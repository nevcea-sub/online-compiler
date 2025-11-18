import { spawn } from 'child_process';
import { Response } from 'express';
import { CONFIG, LanguageConfig } from '../config';
import { BuildOptions, ExecutionError } from '../types';
import { buildDockerArgs } from '../docker/dockerArgs';
import { OutputCollector } from './outputCollector';
import { handleExecutionResult } from './resultHandler';
import { cleanupFile } from '../file/fileManager';

export async function executeDockerProcess(
    language: string,
    fullCodePath: string,
    buildOptions: BuildOptions,
    config: LanguageConfig,
    startTime: number,
    res: Response,
    sessionOutputDir: string,
    fullInputPath: string | null,
    getResponseSent: () => boolean,
    setResponseSent: (value: boolean) => void,
    kotlinCacheDir?: string
): Promise<void> {
    const dockerArgs = buildDockerArgs(language, fullCodePath, buildOptions, kotlinCacheDir);

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

    const outputCollector = new OutputCollector(CONFIG.MAX_OUTPUT_BYTES);

    dockerProcess.stdout.on('data', (data: Buffer | string) => {
        outputCollector.addStdout(data);
    });

    dockerProcess.stderr.on('data', (data: Buffer | string) => {
        outputCollector.addStderr(data);
    });

    let responseHandled = false;
    const markResponseHandled = (): boolean => {
        if (responseHandled) {
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
                
                const stderrLower = (stderr || '').toLowerCase();
                if (stderrLower.includes("run 'docker") || 
                    stderrLower.includes("docker:") ||
                    stderrLower.includes("cannot connect to the docker daemon") ||
                    stderrLower.includes("docker daemon") ||
                    stderrLower.includes("'docker' is not recognized") ||
                    stderrLower.includes("docker: command not found") ||
                    stderrLower.includes("spawn docker enoent") ||
                    stderrLower.includes("error response from daemon") ||
                    stderrLower.includes("invalid reference format") ||
                    stderrLower.includes("no such image") ||
                    stderrLower.includes("permission denied")) {
                    error.message = stderr || 'Docker error';
                } else if (stderr && stderr.trim()) {
                    error.message = stderr;
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
            setResponseSent(true);
        } catch (err) {
            console.error('[ERROR] Error in handleClose:', err);
            if (!getResponseSent()) {
                try {
                    res.status(500).json({
                        error: 'An error occurred while processing execution result.'
                    });
                    setResponseSent(true);
                } catch (sendErr) {
                    console.error('[ERROR] Failed to send error response:', sendErr);
                }
            }
        }
    };

    const handleError = async (error: Error): Promise<void> => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const executionTime = Date.now() - startTime;
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
            
            if (errorMessage.includes('ENOENT') || 
                errorMessage.includes('docker') || 
                combinedStderr.toLowerCase().includes('docker') ||
                combinedStderr.toLowerCase().includes("run 'docker")) {
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
            setResponseSent(true);
        } catch (err) {
            console.error('[ERROR] Error in handleError:', err);
            if (!getResponseSent()) {
                try {
                    res.status(500).json({
                        error: 'An error occurred while processing execution error.'
                    });
                    setResponseSent(true);
                } catch (sendErr) {
                    console.error('[ERROR] Failed to send error response:', sendErr);
                }
            }
        }
    };

    dockerProcess.on('close', handleClose);
    dockerProcess.on('error', handleError);

    const processTimeoutId = setTimeout(async () => {
        if (responseHandled || getResponseSent()) {
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

            const killTimeoutId = setTimeout(() => {
                if (dockerProcess && !dockerProcess.killed) {
                    try {
                        dockerProcess.kill('SIGKILL');
                    } catch (killError) {
                        console.error('[ERROR] Failed to kill Docker process:', killError);
                    }
                }
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

