import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Response } from 'express';
import { CONFIG, LanguageConfig } from '../config';
import { BuildOptions, ExecutionError } from '../types';
import { DockerArgs } from '../docker/dockerArgs';
import { OutputCollector } from './outputCollector';
import { handleExecutionResult } from './resultHandler';
import { cleanupFile } from '../file/fileManager';
import { safeSendErrorResponse } from '../middleware/errorHandler';
import { validateContainerName, isDockerError, createExecutionError } from './errorHandler';
import { createLogger } from '../utils/logger';
import { containerPool } from '../docker/containerPool';
import { ERROR_MESSAGES } from '../utils/constants';

const execAsync = promisify(exec);
const logger = createLogger('Executor');

async function cleanupContainer(containerName: string): Promise<void> {
    if (!validateContainerName(containerName)) {
        logger.error('Invalid container name', { containerName });
        return;
    }
    try {
        await execAsync(`docker rm -f ${containerName} 2>/dev/null || true`);
    } catch {
        logger.debug('Container cleanup failed (may already be removed)', { containerName });
    }
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
    kotlinCacheDir?: string,
    cacheKey?: { code: string; language: string; input: string }
): Promise<void> {
    let pooledContainerId: string | null = null;
    let dockerProcess: any;
    let executionArgs: string[] = [];
    let containerNameForCleanup: string = '';

    if (CONFIG.ENABLE_CONTAINER_POOL) {
        try {
            pooledContainerId = await containerPool.getOrCreateContainer(language, config.image, kotlinCacheDir);

            if (pooledContainerId) {
                const { command, containerPath, containerInputPath } = DockerArgs.buildExecutionCommand(
                    language,
                    buildOptions,
                    kotlinCacheDir
                );

                await execAsync(`docker cp "${fullCodePath}" ${pooledContainerId}:"${containerPath}"`);

                if (fullInputPath && containerInputPath) {
                    await execAsync(`docker cp "${fullInputPath}" ${pooledContainerId}:"${containerInputPath}"`);
                }

                executionArgs = ['exec', '-u', '1000:1000', pooledContainerId, 'sh', '-c', command];
                containerNameForCleanup = pooledContainerId;
                logger.debug('Using pooled container', { pooledContainerId });
            }
        } catch (e) {
            logger.warn('Failed to use pooled container, falling back to standard execution', { error: e });
            if (pooledContainerId) {
                containerPool.returnContainer(language, config.image, pooledContainerId).catch(() => {});
                pooledContainerId = null;
            }
        }
    }

    if (!pooledContainerId) {
        const { args, containerName } = DockerArgs.buildDockerArgs(
            language,
            fullCodePath,
            buildOptions,
            kotlinCacheDir
        );
        executionArgs = args;
        containerNameForCleanup = containerName;
    }

    logger.debug('Starting Docker execution', {
        language,
        timeout: config.timeout,
        hasInput: !!fullInputPath,
        pooled: !!pooledContainerId
    });

    const controller = new AbortController();
    let abortTimeoutId: NodeJS.Timeout | null = setTimeout(
        () => controller.abort(),
        config.timeout + CONFIG.TIMEOUT_BUFFER_MS
    );

    dockerProcess = spawn('docker', executionArgs, {
        signal: controller.signal
    });

    dockerProcess.stdout.setEncoding('utf8');
    dockerProcess.stderr.setEncoding('utf8');

    if (!pooledContainerId) {
        logger.debug('Container started', { containerName: containerNameForCleanup });
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

    const performCleanup = async () => {
        try {
            if (pooledContainerId) {
                await containerPool.returnContainer(language, config.image, pooledContainerId);
            } else {
                await cleanupContainer(containerNameForCleanup);
            }
        } catch (e) {
            logger.error('Cleanup error', e);
        }
        await cleanupResources(fullCodePath, fullInputPath).catch(() => {});
    };

    const handleClose = async (code: number | null): Promise<void> => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const { stdout, stderr } = outputCollector.getFinalOutput();
            const executionTime = Date.now() - startTime;

            logger.debug('Process closed', {
                language,
                code,
                executionTime,
                stdoutLength: stdout.length,
                stderrLength: stderr.length,
                stdoutPreview: stdout.substring(0, 500),
                stderrPreview: stderr.substring(0, 500)
            });

            const error: ExecutionError | null = code !== 0 ? createExecutionError(code, stderr || '') : null;

            logger.debug('Calling handleExecutionResult', {
                language,
                hasError: !!error,
                executionTime
            });

            await handleExecutionResult(error, stdout, stderr, executionTime, res, sessionOutputDir, cacheKey);

            performCleanup().catch((err) => logger.error('Cleanup failed after response', err));
        } catch (err) {
            logger.error('Error in handleClose', err);
            await performCleanup();
            if (!res.headersSent) {
                safeSendErrorResponse(res, 500, ERROR_MESSAGES.RESULT_PROCESSING_ERROR);
            }
        }
    };

    const handleError = async (error: Error): Promise<void> => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const { stdout, stderr } = outputCollector.getFinalOutput();
            const executionTime = Date.now() - startTime;

            logger.debug('Process error', {
                language,
                executionTime,
                errorMessage: error.message
            });

            const errorMessage = error.message || '';
            const combinedStderr = stderr || errorMessage;
            const executionError =
                errorMessage.includes('ENOENT') || isDockerError(combinedStderr)
                    ? createExecutionError(null, combinedStderr, errorMessage)
                    : createExecutionError(null, combinedStderr);

            logger.debug('Calling handleExecutionResult (error handler)', {
                language,
                hasError: !!executionError,
                executionTime
            });

            await handleExecutionResult(
                executionError,
                stdout,
                combinedStderr,
                executionTime,
                res,
                sessionOutputDir,
                cacheKey
            );

            performCleanup().catch((err) => logger.error('Cleanup failed after response (error case)', err));
        } catch (err) {
            logger.error('Error in handleError', err);
            await performCleanup();
            if (!res.headersSent) {
                safeSendErrorResponse(res, 500, ERROR_MESSAGES.EXECUTION_ERROR_HANDLING_ERROR);
            }
        }
    };

    dockerProcess.on('close', handleClose);
    dockerProcess.on('error', handleError);

    let processTimeoutId: NodeJS.Timeout | null = setTimeout(async () => {
        if (responseHandled || res.headersSent) {
            return;
        }
        if (!dockerProcess || dockerProcess.killed) {
            return;
        }

        try {
            logger.warn('Execution timeout reached', {
                language,
                timeout: config.timeout
            });

            controller.abort();
            dockerProcess.kill('SIGTERM');

            const killTimeoutId = setTimeout(async () => {
                if (dockerProcess && !dockerProcess.killed) {
                    try {
                        dockerProcess.kill('SIGKILL');
                    } catch (killError) {
                        logger.error('Failed to kill Docker process', killError);
                    }
                }
                if (pooledContainerId) {
                    await containerPool.returnContainer(language, config.image, pooledContainerId);
                } else {
                    await cleanupContainer(containerNameForCleanup);
                }
            }, CONFIG.SIGKILL_DELAY_MS);

            const cleanupKillTimeout = (): void => {
                clearTimeout(killTimeoutId);
            };
            dockerProcess.once('close', cleanupKillTimeout);
            dockerProcess.once('error', cleanupKillTimeout);
        } catch (killError) {
            logger.error('Failed to send SIGTERM to Docker process', killError);
            if (!res.headersSent && markResponseHandled()) {
                await performCleanup();
                safeSendErrorResponse(res, 500, ERROR_MESSAGES.EXECUTION_TIMEOUT_HANDLING_ERROR);
            }
        }
    }, config.timeout + CONFIG.TIMEOUT_BUFFER_MS);

    const cleanupTimeout = (): void => {
        if (abortTimeoutId) {
            clearTimeout(abortTimeoutId);
            abortTimeoutId = null;
        }
        if (processTimeoutId) {
            clearTimeout(processTimeoutId);
            processTimeoutId = null;
        }
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
