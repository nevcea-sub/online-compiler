import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Response } from 'express';
import { CONFIG, LanguageConfig } from '../config';
import { BuildOptions, ExecutionError } from '../types';
import { buildDockerArgs } from '../docker/dockerArgs';
import { OutputCollector } from './outputCollector';
import { handleExecutionResult } from './resultHandler';
import { cleanupFile } from '../file/fileManager';
import { safeSendErrorResponse } from '../middleware/errorHandler';

const execAsync = promisify(exec);

function validateContainerName(name: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 128;
}

async function cleanupContainer(containerName: string): Promise<void> {
    if (!validateContainerName(containerName)) {
        console.error('[ERROR] Invalid container name:', containerName);
        return;
    }
    try {
        await execAsync(`docker rm -f ${containerName} 2>/dev/null || true`);
    } catch {
    }
}

function isDockerError(stderr: string): boolean {
    const stderrLower = stderr.toLowerCase();
    const dockerErrorPatterns = [
        'run \'docker',
        'docker:',
        'cannot connect to the docker daemon',
        'docker daemon',
        '\'docker\' is not recognized',
        'docker: command not found',
        'spawn docker enoent',
        'error response from daemon',
        'invalid reference format',
        'no such image',
        'permission denied'
    ];
    return dockerErrorPatterns.some(pattern => stderrLower.includes(pattern));
}

export async function executeDockerProcess(
    language: string,
    fullCodePath: string,
    buildOptions: BuildOptions,
    config: LanguageConfig,
    startTime: number,
    res: Response,
    sessionOutputDir: string,
    fullInputPath: string | null,
    kotlinCacheDir?: string
): Promise<void> {
    const { args: dockerArgs, containerName } = buildDockerArgs(language, fullCodePath, buildOptions, kotlinCacheDir);

    if (CONFIG.DEBUG_MODE) {
        console.log('[EXECUTE] Starting Docker execution', {
            language,
            timeout: config.timeout,
            hasInput: !!fullInputPath
        });
        console.log('[DEBUG] Docker command:', 'docker', dockerArgs.join(' '));
    }

    const controller = new AbortController();
    const abortTimeoutId = setTimeout(
        () => controller.abort(),
        config.timeout + CONFIG.TIMEOUT_BUFFER_MS
    );
    const dockerProcess = spawn('docker', dockerArgs, {
        signal: controller.signal
    });

    dockerProcess.stdout.setEncoding('utf8');
    dockerProcess.stderr.setEncoding('utf8');

    if (CONFIG.DEBUG_MODE) {
        console.log('[DEBUG] Container name:', containerName);
    }

    const outputCollector = new OutputCollector(CONFIG.MAX_OUTPUT_BYTES);

    dockerProcess.stdout.on('data', (data: Buffer | string) => {
        outputCollector.addStdout(data);
    });

    dockerProcess.stderr.on('data', (data: Buffer | string) => {
        outputCollector.addStderr(data);
    });

    let responseHandled = false;
    const markResponseHandled = (): boolean => {
        if (responseHandled || res.headersSent) {
            return false;
        }
        responseHandled = true;
        return true;
    };

    const handleClose = async (code: number | null): Promise<void> => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const executionTime = Date.now() - startTime;

            await cleanupContainer(containerName);
            await cleanupResources(fullCodePath, fullInputPath);

            const { stdout, stderr } = outputCollector.getFinalOutput();

            if (CONFIG.DEBUG_MODE) {
                console.log('[EXECUTE] Process closed', {
                    language,
                    code,
                    executionTime
                });
            }

            let error: ExecutionError | null = null;
            if (code !== 0) {
                error = { code, killed: false, signal: null };
                const stderrStr = stderr || '';
                if (stderrStr && (isDockerError(stderrStr) || stderrStr.trim())) {
                    error.message = stderrStr || 'Docker error';
                }
            }

            await handleExecutionResult(
                error,
                stdout,
                stderr,
                executionTime,
                res,
                sessionOutputDir
            );
        } catch (err) {
            console.error('[ERROR] Error in handleClose:', err);
            await cleanupContainer(containerName);
            if (!res.headersSent) {
                safeSendErrorResponse(res, 500, '실행 결과 처리 중 오류가 발생했습니다.');
            }
        }
    };

    const handleError = async (error: Error): Promise<void> => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const executionTime = Date.now() - startTime;

            await cleanupContainer(containerName);
            await cleanupResources(fullCodePath, fullInputPath);

            const { stdout, stderr } = outputCollector.getFinalOutput();

            if (CONFIG.DEBUG_MODE) {
                console.error('[EXECUTE] Process error', {
                    language,
                    executionTime,
                    errorMessage: error.message
                });
            }

            const errorMessage = error.message || '';
            const combinedStderr = stderr || errorMessage;

            let executionError: ExecutionError | Error = error;

            if (errorMessage.includes('ENOENT') || isDockerError(combinedStderr)) {
                executionError = {
                    message: combinedStderr || errorMessage,
                    code: null,
                    killed: false,
                    signal: null
                } as ExecutionError;
            } else if (combinedStderr) {
                executionError = {
                    message: combinedStderr,
                    code: null,
                    killed: false,
                    signal: null
                } as ExecutionError;
            }

            await handleExecutionResult(
                executionError,
                stdout,
                combinedStderr,
                executionTime,
                res,
                sessionOutputDir
            );
        } catch (err) {
            console.error('[ERROR] Error in handleError:', err);
            await cleanupContainer(containerName);
            if (!res.headersSent) {
                safeSendErrorResponse(res, 500, '실행 에러 처리 중 오류가 발생했습니다.');
            }
        }
    };

    dockerProcess.on('close', handleClose);
    dockerProcess.on('error', handleError);

    const processTimeoutId = setTimeout(async () => {
        if (responseHandled || res.headersSent) {
            return;
        }
        if (!dockerProcess || dockerProcess.killed) {
            return;
        }

        try {
            if (CONFIG.DEBUG_MODE) {
                console.warn('[EXECUTE] Execution timeout reached', {
                    language,
                    timeout: config.timeout,
                    timeoutBufferMs: CONFIG.TIMEOUT_BUFFER_MS
                });
            }

            controller.abort();
            dockerProcess.kill('SIGTERM');

            const killTimeoutId = setTimeout(async () => {
                if (dockerProcess && !dockerProcess.killed) {
                    try {
                        dockerProcess.kill('SIGKILL');
                    } catch (killError) {
                        console.error('[ERROR] Failed to kill Docker process:', killError);
                    }
                }
                await cleanupContainer(containerName);
            }, CONFIG.SIGKILL_DELAY_MS);

            dockerProcess.once('close', () => {
                clearTimeout(killTimeoutId);
            });
            dockerProcess.once('error', () => {
                clearTimeout(killTimeoutId);
            });
        } catch (killError) {
            console.error('[ERROR] Failed to send SIGTERM to Docker process:', killError);
        }
    }, config.timeout + CONFIG.TIMEOUT_BUFFER_MS);

    const cleanupTimeout = (): void => {
        clearTimeout(abortTimeoutId);
        clearTimeout(processTimeoutId);
    };
    dockerProcess.once('close', cleanupTimeout);
    dockerProcess.once('error', cleanupTimeout);
}

async function cleanupResources(fullCodePath: string | null, fullInputPath: string | null): Promise<void> {
    const cleanupPromises = [cleanupFile(fullCodePath)];
    if (fullInputPath) {
        cleanupPromises.push(cleanupFile(fullInputPath));
    }
    await Promise.allSettled(cleanupPromises);
}

