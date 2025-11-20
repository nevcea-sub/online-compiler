import { Request, Response } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { CONFIG, LANGUAGE_CONFIGS, LANGUAGE_EXTENSIONS, CONTAINER_CODE_PATHS } from '../config';
import { ExecuteRequestBody, BuildOptions } from '../types';
import { validateLanguage, sanitizeCode, validateJavaClass } from '../utils/validation';
import { normalizePath } from '../utils/pathUtils';
import { sanitizeError } from '../utils/errorHandling';
import { cleanupFile, writeInputFile, writeCodeFile, generateSessionId } from '../file/fileManager';
import { executeDockerProcess } from '../execution/executor';
import { warmupKotlinOnStart } from '../docker/dockerWarmup';
import { kotlinCompilerExistsOnHost } from '../utils/pathUtils';
import { executionQueue } from '../execution/executionQueue';

function validateCodePath(filePath: unknown, codeDir: string): boolean {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        return false;
    }
    const codeDirNormalized = path.resolve(codeDir);
    const normalizedCodeDir = process.platform === 'win32' ? codeDirNormalized.replace(/\\/g, '/') : codeDirNormalized;
    const normalizedPathForCompare = process.platform === 'win32' ? normalized.replace(/\\/g, '/') : normalized;
    return normalizedPathForCompare.startsWith(normalizedCodeDir);
}

export function createExecuteRoute(
    codeDir: string,
    outputDir: string,
    kotlinCacheDir: string
) {
    return async (req: Request<{}, {}, ExecuteRequestBody>, res: Response): Promise<void> => {
        const { code, language, input = '' } = req.body;
        let responseSent = false;

        const sendResponse = (statusCode: number, data: object): void => {
            if (!responseSent) {
                responseSent = true;
                res.status(statusCode).json(data);
            }
        };

        if (!code || !language) {
            sendResponse(400, { error: '코드와 언어는 필수입니다.' });
            return;
        }

        if (typeof code !== 'string' || typeof language !== 'string') {
            sendResponse(400, { error: '잘못된 입력 형식입니다.' });
            return;
        }

        if (code.length > CONFIG.MAX_CODE_LENGTH) {
            sendResponse(400, {
                error: `코드 길이가 최대 ${CONFIG.MAX_CODE_LENGTH}자를 초과했습니다.`
            });
            return;
        }

        if (!validateLanguage(language)) {
            sendResponse(400, { error: '지원하지 않는 언어입니다.' });
            return;
        }

        let inputText: string;
        if (typeof input === 'string') {
            inputText = input;
        } else if (input === null || input === undefined) {
            inputText = '';
        } else {
            inputText = String(input);
        }
        if (inputText.length > CONFIG.MAX_INPUT_LENGTH) {
            sendResponse(400, {
                error: `입력 길이가 최대 ${CONFIG.MAX_INPUT_LENGTH}자를 초과했습니다.`
            });
            return;
        }

        const sessionId = generateSessionId();
        const codePathBase = path.join(codeDir, `${sessionId}_code`);
        let fullCodePath: string | null = null;
        let fullInputPath: string | null = null;

        try {
            sanitizeCode(code);

            const sessionOutputDir = path.join(outputDir, sessionId);
            let finalCode = code;
            let fileExtension: string;

            switch (language) {
                case 'java':
                    validateJavaClass(code);
                    finalCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
                    fileExtension = LANGUAGE_EXTENSIONS[language];
                    break;

                case 'csharp':
                    fileExtension = LANGUAGE_EXTENSIONS[language];
                    break;

                case 'r': {
                    const plotPattern =
                        /plot\s*\(|ggplot\s*\(|barplot\s*\(|hist\s*\(|boxplot\s*\(|pie\s*\(/i;
                    const hasPlot = plotPattern.test(code);
                    if (hasPlot) {
                        finalCode = `png('/output/plot.png', width=800, height=600, res=100)\n${code}\ndev.off()\n`;
                    }
                    fileExtension = LANGUAGE_EXTENSIONS[language];
                    break;
                }

                default:
                    fileExtension = LANGUAGE_EXTENSIONS[language];
                    break;
            }

            const resolvedCodePath = path.resolve(`${codePathBase}${fileExtension}`);
            const [writtenPath] = await Promise.all([
                writeCodeFile(resolvedCodePath, finalCode, language, CONTAINER_CODE_PATHS, LANGUAGE_EXTENSIONS),
                fs.mkdir(sessionOutputDir, { recursive: true })
            ]);
            fullCodePath = writtenPath;

            if (!fullCodePath || !validateCodePath(fullCodePath, codeDir)) {
                console.error('[ERROR] Invalid file path generated:', fullCodePath);
                throw new Error('파일 경로 생성에 실패했습니다.');
            }

            try {
                const stats = await fs.stat(fullCodePath);
                if (!stats.isFile()) {
                    console.error('[ERROR] Path exists but is not a file:', fullCodePath);
                    throw new Error('파일 경로가 올바르지 않습니다.');
                }
                if (CONFIG.DEBUG_MODE) {
                    console.log(
                        `[DEBUG] File created successfully: ${fullCodePath}, size: ${stats.size} bytes`
                    );
                }
            } catch {
                console.error(`[ERROR] File verification failed: ${fullCodePath}`);
                throw new Error('코드 파일 생성 또는 검증에 실패했습니다.');
            }

            let buildOptions: BuildOptions = {};
            if (language === 'kotlin') {
                if (!kotlinCompilerExistsOnHost(kotlinCacheDir)) {
                    warmupKotlinOnStart(kotlinCacheDir).catch(() => {});
                    await cleanupFile(fullCodePath);
                    await fs.rm(sessionOutputDir, { recursive: true, force: true }).catch(() => {});
                    sendResponse(503, {
                        error: 'Kotlin 컴파일러가 아직 준비되지 않았습니다. 준비 중입니다. 잠시 후 다시 시도해주세요.'
                    });
                    return;
                }
            }
            buildOptions.hasInput = !!(inputText && inputText.trim().length > 0);
            buildOptions.outputDirHost = sessionOutputDir;

            if (buildOptions.hasInput) {
                const inputPath = path.join(codeDir, `${sessionId}_input`);
                fullInputPath = await writeInputFile(inputPath, inputText);
                buildOptions.inputPath = fullInputPath;
                if (CONFIG.DEBUG_MODE) {
                    console.log(
                        `[DEBUG] Input file created: ${fullInputPath}, size: ${inputText.length} bytes`
                    );
                }
            }

            const config = LANGUAGE_CONFIGS[language];
            const startTime = Date.now();
            let executionResponseSent = false;

            if (!fullCodePath) {
                console.error('[ERROR] Code path is null');
                throw new Error('코드 경로가 없습니다.');
            }

            const executionId = `${sessionId}_${language}_${Date.now()}`;
            await executionQueue.enqueue(
                executionId,
                language,
                async () => {
                    await executeDockerProcess(
                        language,
                        fullCodePath!,
                        buildOptions,
                        config,
                        startTime,
                        res,
                        sessionOutputDir,
                        fullInputPath,
                        () => executionResponseSent,
                        (value) => {
                            executionResponseSent = value;
                        },
                        kotlinCacheDir
                    );
                },
                0
            );
        } catch (error) {
            await cleanupFile(fullCodePath);
            if (fullInputPath) {
                await cleanupFile(fullInputPath);
            }
            const sanitizedError = sanitizeError(error);
            sendResponse(400, { error: sanitizedError });
        }
    };
}

