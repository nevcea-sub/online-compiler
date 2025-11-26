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
import { executeDockerProcess } from '../execution/executor';
import { safeSendErrorResponse } from '../middleware/errorHandler';
import { sanitizeError } from '../utils/errorHandling';
import { createLogger } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/constants';
import { container } from '../utils/container';
import { ExecutionQueue } from '../execution/executionQueue';

const logger = createLogger('ExecutionService');

interface ExecutionSession {
    sessionId: string;
    codeDir: string;
    outputDir: string;
    fullCodePath: string;
    fullInputPath: string | null;
    sessionOutputDir: string;
    buildOptions: BuildOptions;
}

export class ExecutionService {
    constructor(private executionQueue: ExecutionQueue = container.executionQueue) {}

    async execute(
        body: ExecuteRequestBody,
        paths: { codeDir: string; outputDir: string; kotlinCacheDir: string },
        res: Response
    ): Promise<void> {
        const { code, language, input = '' } = body;
        const { codeDir, outputDir, kotlinCacheDir } = paths;

        const validationError = this.validateRequest(code, language, input);
        if (validationError) {
            safeSendErrorResponse(res, 400, validationError);
            return;
        }

        const validCode = code as string;
        const validLanguage = language as string;
        const inputText = String(input ?? '');

        if (this.checkAndServeCache(validCode, validLanguage, inputText, res)) {
            return;
        }

        let session: ExecutionSession | null = null;
        try {
            session = await this.prepareExecutionSession(
                validCode,
                validLanguage,
                inputText,
                codeDir,
                outputDir,
                kotlinCacheDir
            );

            await this.enqueueExecution(session, validCode, validLanguage, inputText, kotlinCacheDir, res);
        } catch (error) {
            await this.handleExecutionError(error, res, session);
        }
    }

    private validateRequest(code: unknown, language: unknown, input: unknown): string | null {
        if (!code || !language) return ERROR_MESSAGES.CODE_AND_LANGUAGE_REQUIRED;
        if (typeof code !== 'string' || typeof language !== 'string') return ERROR_MESSAGES.INVALID_INPUT_FORMAT;
        if (code.length > CONFIG.MAX_CODE_LENGTH) return ERROR_MESSAGES.CODE_TOO_LONG(CONFIG.MAX_CODE_LENGTH);
        if (!Validator.language(language)) return ERROR_MESSAGES.UNSUPPORTED_LANGUAGE;

        const inputText = String(input ?? '');
        if (inputText.length > CONFIG.MAX_INPUT_LENGTH) return ERROR_MESSAGES.INPUT_TOO_LONG(CONFIG.MAX_INPUT_LENGTH);

        return null;
    }

    private checkAndServeCache(code: string, language: string, input: string, res: Response): boolean {
        const cachedResult = executionCache.get(code, language, input);
        if (cachedResult) {
            logger.debug('Cache hit for code execution');
            res.json({
                ...cachedResult,
                cached: true
            });
            return true;
        }
        return false;
    }

    private async prepareExecutionSession(
        code: string,
        language: string,
        input: string,
        codeDir: string,
        outputDir: string,
        kotlinCacheDir: string
    ): Promise<ExecutionSession> {
        const sessionId = generateSessionId();
        const sessionOutputDir = path.join(outputDir, sessionId);

        Validator.sanitizeCode(code);

        const { finalCode, fileExtension } = prepareCode(code, language);
        const codePathBase = path.join(codeDir, `${sessionId}_code`);
        const resolvedCodePath = path.resolve(`${codePathBase}${fileExtension}`);

        const config = LANGUAGE_CONFIGS[language];
        const [fullCodePath] = await Promise.all([
            writeCodeFile(resolvedCodePath, finalCode, language, CONTAINER_CODE_PATHS, LANGUAGE_EXTENSIONS),
            fs.mkdir(sessionOutputDir, { recursive: true }),
            this.handleWarmupAndPreload(language, config.image, kotlinCacheDir)
        ]);

        if (!fullCodePath || !isChildPath(fullCodePath, codeDir)) {
            throw new Error(ERROR_MESSAGES.FILE_PATH_CREATION_FAILED);
        }

        if (language === 'kotlin' && !kotlinCompilerExistsOnHost(kotlinCacheDir)) {
            throw new Error(ERROR_MESSAGES.KOTLIN_COMPILER_NOT_READY);
        }

        const hasInput = !!(input && input.trim().length > 0);
        let fullInputPath: string | null = null;

        if (hasInput) {
            const inputPath = path.join(codeDir, `${sessionId}_input`);
            fullInputPath = await writeInputFile(inputPath, input);
        }

        return {
            sessionId,
            codeDir,
            outputDir,
            fullCodePath,
            fullInputPath,
            sessionOutputDir,
            buildOptions: {
                hasInput,
                outputDirHost: sessionOutputDir,
                inputPath: fullInputPath ?? undefined
            }
        };
    }

    private async enqueueExecution(
        session: ExecutionSession,
        code: string,
        language: string,
        input: string,
        kotlinCacheDir: string,
        res: Response
    ): Promise<void> {
        const { sessionId, fullCodePath, fullInputPath, sessionOutputDir, buildOptions } = session;
        const executionId = `${sessionId}_${language}_${Date.now()}`;
        const startTime = Date.now();
        const config = LANGUAGE_CONFIGS[language];

        logger.debug('Enqueuing execution', { executionId, language });

        await this.executionQueue.enqueue(
            executionId,
            language,
            async () => {
                await executeDockerProcess(
                    language,
                    fullCodePath,
                    buildOptions,
                    config,
                    startTime,
                    res,
                    sessionOutputDir,
                    fullInputPath,
                    kotlinCacheDir,
                    { code, language, input }
                );
            },
            0
        );
    }

    private async handleWarmupAndPreload(language: string, image: string, kotlinCacheDir: string): Promise<void> {
        if (CONFIG.ENABLE_WARMUP) {
            import('../docker/dockerWarmup').then(({ ensureWarmedUp }) => {
                ensureWarmedUp(language, kotlinCacheDir).catch(() => {});
            });
        }

        if (CONFIG.ENABLE_PRELOAD) {
            import('../docker/dockerImage').then(async ({ checkImageExists, pullDockerImage }) => {
                const exists = await checkImageExists(image);
                if (!exists) {
                    pullDockerImage(image, 1, true).catch(() => {});
                }
            });
        }
    }

    private async handleExecutionError(error: unknown, res: Response, session: ExecutionSession | null): Promise<void> {
        if (session) {
            const { fullCodePath, fullInputPath, sessionOutputDir } = session;
            await Promise.allSettled([
                fullCodePath ? cleanupFile(fullCodePath) : Promise.resolve(),
                fullInputPath ? cleanupFile(fullInputPath) : Promise.resolve(),
                sessionOutputDir ? fs.rm(sessionOutputDir, { recursive: true, force: true }) : Promise.resolve()
            ]);
        }

        if (!res.headersSent) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage === ERROR_MESSAGES.KOTLIN_COMPILER_NOT_READY) {
                safeSendErrorResponse(res, 503, ERROR_MESSAGES.KOTLIN_COMPILER_NOT_READY);
                return;
            }

            const sanitizedError = sanitizeError(errorMessage);
            safeSendErrorResponse(res, 400, sanitizedError || ERROR_MESSAGES.REQUEST_ERROR_OCCURRED);
        } else {
            logger.error('Error occurred after response was sent', error);
        }
    }
}

export const executionService = new ExecutionService();
