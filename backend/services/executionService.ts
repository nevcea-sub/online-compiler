import path from 'path';
import { promises as fs } from 'fs';
import { Response } from 'express';
import { CONFIG, LANGUAGE_CONFIGS, CONTAINER_CODE_PATHS, LANGUAGE_EXTENSIONS } from '../config';
import { ExecuteRequestBody, BuildOptions } from '../types';
import { executionCache } from '../utils/cache';
import { generateSessionId, writeCodeFile, writeInputFile, cleanupFile } from '../file/fileManager';
import { Validator } from '../utils/validation';
import { prepareCode } from '../utils/codePreparer';
import { isChildPath, kotlinCompilerExistsOnHost } from '../utils/pathUtils';
import { executionQueue } from '../execution/executionQueue';
import { executeDockerProcess } from '../execution/executor';
import { warmupKotlinOnStart } from '../docker/dockerWarmup';
import { safeSendErrorResponse } from '../middleware/errorHandler';
import { sanitizeError } from '../utils/errorHandling';
import { createLogger } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/constants';

const logger = createLogger('ExecutionService');

export class ExecutionService {
    private validateRequest(code: unknown, language: unknown, input: unknown): string | null {
        if (!code || !language) {
            return ERROR_MESSAGES.CODE_AND_LANGUAGE_REQUIRED;
        }

        if (typeof code !== 'string' || typeof language !== 'string') {
            return ERROR_MESSAGES.INVALID_INPUT_FORMAT;
        }

        if (code.length > CONFIG.MAX_CODE_LENGTH) {
            return ERROR_MESSAGES.CODE_TOO_LONG(CONFIG.MAX_CODE_LENGTH);
        }

        if (!Validator.language(language)) {
            return ERROR_MESSAGES.UNSUPPORTED_LANGUAGE;
        }

        const inputText = String(input ?? '');
        if (inputText.length > CONFIG.MAX_INPUT_LENGTH) {
            return ERROR_MESSAGES.INPUT_TOO_LONG(CONFIG.MAX_INPUT_LENGTH);
        }

        return null;
    }

    async execute(
        body: ExecuteRequestBody,
        paths: { codeDir: string; outputDir: string; kotlinCacheDir: string },
        res: Response
    ): Promise<void> {
        const { code, language, input = '' } = body;
        const { codeDir, outputDir, kotlinCacheDir } = paths;

        // 1. Validation
        const validationError = this.validateRequest(code, language, input);
        if (validationError) {
            safeSendErrorResponse(res, 400, validationError);
            return;
        }

        // Type assertions are safe here as validation passed
        const validCode = code as string;
        const validLanguage = language as string;
        const inputText = String(input ?? '');

        // 2. Cache Check
        const cachedResult = executionCache.get(validCode, validLanguage, inputText);
        if (cachedResult) {
            logger.debug('Cache hit for code execution');
            res.json({
                output: cachedResult.output,
                error: cachedResult.error,
                executionTime: cachedResult.executionTime,
                images: cachedResult.images,
                cached: true
            });
            return;
        }

        // 3. Session Setup
        const sessionId = generateSessionId();
        const codePathBase = path.join(codeDir, `${sessionId}_code`);
        let fullCodePath: string | null = null;
        let fullInputPath: string | null = null;
        const sessionOutputDir = path.join(outputDir, sessionId);

        try {
            Validator.sanitizeCode(validCode);

            // 4. Code Preparation
            const { finalCode, fileExtension } = prepareCode(validCode, validLanguage);
            const resolvedCodePath = path.resolve(`${codePathBase}${fileExtension}`);
            const config = LANGUAGE_CONFIGS[validLanguage];

            // 5. File Writing & Environment Prep
            const [writtenPath] = await Promise.all([
                writeCodeFile(resolvedCodePath, finalCode, validLanguage, CONTAINER_CODE_PATHS, LANGUAGE_EXTENSIONS),
                fs.mkdir(sessionOutputDir, { recursive: true }),
                this.handleWarmupAndPreload(validLanguage, config.image, kotlinCacheDir)
            ]);

            fullCodePath = writtenPath;

            if (!fullCodePath || !isChildPath(fullCodePath, codeDir)) {
                throw new Error(ERROR_MESSAGES.FILE_PATH_CREATION_FAILED);
            }

            // 6. Build Options Setup
            const buildOptions: BuildOptions = {
                hasInput: !!(inputText && inputText.trim().length > 0),
                outputDirHost: sessionOutputDir
            };

            // Kotlin Specific Check
            if (validLanguage === 'kotlin') {
                if (!kotlinCompilerExistsOnHost(kotlinCacheDir)) {
                    await this.handleKotlinWarmupFailure(kotlinCacheDir, fullCodePath, sessionOutputDir, res);
                    return;
                }
            }

            if (buildOptions.hasInput) {
                const inputPath = path.join(codeDir, `${sessionId}_input`);
                fullInputPath = await writeInputFile(inputPath, inputText);
                buildOptions.inputPath = fullInputPath;
            }

            // 7. Execution Queueing
            const executionId = `${sessionId}_${validLanguage}_${Date.now()}`;
            const cacheKey = { code: validCode, language: validLanguage, input: inputText };
            const startTime = Date.now();

            logger.debug('Enqueuing execution', { executionId, language });

            await executionQueue.enqueue(
                executionId,
                validLanguage,
                async () => {
                    await executeDockerProcess(
                        validLanguage,
                        fullCodePath!,
                        buildOptions,
                        config,
                        startTime,
                        res,
                        sessionOutputDir,
                        fullInputPath,
                        kotlinCacheDir,
                        cacheKey
                    );
                },
                0
            );
        } catch (error) {
            await this.handleExecutionError(error, res, sessionId, outputDir, fullCodePath, fullInputPath);
        }
    }

    private async handleWarmupAndPreload(language: string, image: string, kotlinCacheDir: string): Promise<void> {
        if (CONFIG.ENABLE_WARMUP) {
            import('../docker/dockerWarmup')
                .then(({ ensureWarmedUp }) => {
                    ensureWarmedUp(language, kotlinCacheDir).catch(() => {});
                })
                .catch(() => {});
        }

        if (CONFIG.ENABLE_PRELOAD) {
            import('../docker/dockerImage')
                .then(({ checkImageExists }) => {
                    return checkImageExists(image).then(async (exists) => {
                        if (!exists) {
                            logger.debug('Image not found, pulling', { image });
                            const { pullDockerImage } = await import('../docker/dockerImage');
                            pullDockerImage(image, 1, true).catch(() => {});
                        }
                    });
                })
                .catch(() => {});
        }
    }

    private async handleKotlinWarmupFailure(
        kotlinCacheDir: string,
        fullCodePath: string,
        sessionOutputDir: string,
        res: Response
    ): Promise<void> {
        warmupKotlinOnStart(kotlinCacheDir).catch((error: unknown) => {
            logger.warn('Kotlin warmup failed', error);
        });
        await cleanupFile(fullCodePath);
        await fs.rm(sessionOutputDir, { recursive: true, force: true }).catch(() => {});
        safeSendErrorResponse(res, 503, ERROR_MESSAGES.KOTLIN_COMPILER_NOT_READY);
    }

    private async handleExecutionError(
        error: unknown,
        res: Response,
        sessionId: string,
        outputDir: string,
        fullCodePath: string | null,
        fullInputPath: string | null
    ): Promise<void> {
        const cleanupPromises = [];
        if (fullCodePath) {
            cleanupPromises.push(cleanupFile(fullCodePath));
        }
        if (fullInputPath) {
            cleanupPromises.push(cleanupFile(fullInputPath));
        }

        if (sessionId) {
            const sessionOutputDir = path.join(outputDir, sessionId);
            cleanupPromises.push(fs.rm(sessionOutputDir, { recursive: true, force: true }).catch(() => {}));
        }
        await Promise.allSettled(cleanupPromises);

        if (!res.headersSent) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const sanitizedError = sanitizeError(errorMessage);
            safeSendErrorResponse(res, 400, sanitizedError || ERROR_MESSAGES.REQUEST_ERROR_OCCURRED);
        } else {
            logger.error('Error occurred after response was sent', error);
        }
    }
}

export const executionService = new ExecutionService();
