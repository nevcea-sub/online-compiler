import { spawn, exec, ChildProcess } from 'child_process';
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
const logger = createLogger('ProcessRunner');

export class DockerProcessRunner {
    private pooledContainerId: string | null = null;
    private containerNameForCleanup: string = '';
    private dockerProcess: ChildProcess | null = null;
    private controller: AbortController;
    private outputCollector: OutputCollector;
    private responseHandled: boolean = false;
    private abortTimeoutId: NodeJS.Timeout | null = null;
    private processTimeoutId: NodeJS.Timeout | null = null;

    constructor(
        private language: string,
        private fullCodePath: string,
        private buildOptions: BuildOptions,
        private config: LanguageConfig,
        private startTime: number,
        private res: Response,
        private sessionOutputDir: string,
        private fullInputPath: string | null,
        private kotlinCacheDir?: string,
        private cacheKey?: { code: string; language: string; input: string }
    ) {
        this.controller = new AbortController();
        this.outputCollector = new OutputCollector(CONFIG.MAX_OUTPUT_BYTES);
    }

    public async execute(): Promise<void> {
        try {
            const executionArgs = await this.prepareContainer();
            await this.spawnProcess(executionArgs);
        } catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    private async prepareContainer(): Promise<string[]> {
        if (CONFIG.ENABLE_CONTAINER_POOL) {
            try {
                this.pooledContainerId = await containerPool.getOrCreateContainer(
                    this.language,
                    this.config.image,
                    this.kotlinCacheDir
                );

                if (this.pooledContainerId) {
                    return await this.setupPooledContainer(this.pooledContainerId);
                }
            } catch (e) {
                logger.warn('Failed to use pooled container, falling back to standard execution', { error: e });
                if (this.pooledContainerId) {
                    containerPool
                        .returnContainer(this.language, this.config.image, this.pooledContainerId)
                        .catch(() => {});
                    this.pooledContainerId = null;
                }
            }
        }

        const { args, containerName } = DockerArgs.buildDockerArgs(
            this.language,
            this.fullCodePath,
            this.buildOptions,
            this.kotlinCacheDir
        );
        this.containerNameForCleanup = containerName;
        return args;
    }

    private async setupPooledContainer(containerId: string): Promise<string[]> {
        const { command, containerPath, containerInputPath } = DockerArgs.buildExecutionCommand(
            this.language,
            this.buildOptions,
            this.kotlinCacheDir
        );

        await execAsync(`docker cp "${this.fullCodePath}" ${containerId}:"${containerPath}"`);

        if (this.fullInputPath && containerInputPath) {
            await execAsync(`docker cp "${this.fullInputPath}" ${containerId}:"${containerInputPath}"`);
        }

        this.containerNameForCleanup = containerId;
        logger.debug('Using pooled container', { pooledContainerId: containerId });

        return ['exec', '-u', '1000:1000', containerId, 'sh', '-c', command];
    }

    private async spawnProcess(args: string[]): Promise<void> {
        logger.debug('Starting Docker execution', {
            language: this.language,
            timeout: this.config.timeout,
            hasInput: !!this.fullInputPath,
            pooled: !!this.pooledContainerId
        });

        this.abortTimeoutId = setTimeout(() => this.controller.abort(), this.config.timeout + CONFIG.TIMEOUT_BUFFER_MS);

        this.dockerProcess = spawn('docker', args, {
            signal: this.controller.signal
        });

        this.setupStreams();
        this.setupProcessEvents();
        this.setupTimeoutHandler();

        if (!this.pooledContainerId) {
            logger.debug('Container started', { containerName: this.containerNameForCleanup });
        }
    }

    private setupStreams(): void {
        if (!this.dockerProcess) return;

        this.dockerProcess.stdout?.setEncoding('utf8');
        this.dockerProcess.stderr?.setEncoding('utf8');

        this.dockerProcess.stdout?.on('data', (data: Buffer | string) => {
            this.outputCollector.addStdout(data);
        });

        this.dockerProcess.stderr?.on('data', (data: Buffer | string) => {
            this.outputCollector.addStderr(data);
        });
    }

    private setupProcessEvents(): void {
        if (!this.dockerProcess) return;

        this.dockerProcess.on('close', (code) => this.handleClose(code));
        this.dockerProcess.on('error', (err) => this.handleError(err));

        const cleanupTimeouts = () => {
            if (this.abortTimeoutId) clearTimeout(this.abortTimeoutId);
            if (this.processTimeoutId) clearTimeout(this.processTimeoutId);
        };
        this.dockerProcess.once('close', cleanupTimeouts);
        this.dockerProcess.once('error', cleanupTimeouts);
    }

    private setupTimeoutHandler(): void {
        this.processTimeoutId = setTimeout(async () => {
            if (this.responseHandled || this.res.headersSent) return;
            if (!this.dockerProcess || this.dockerProcess.killed) return;

            try {
                logger.warn('Execution timeout reached', { language: this.language });
                this.controller.abort();
                this.killProcess();

                if (!this.res.headersSent && this.markResponseHandled()) {
                    await this.performCleanup();
                    safeSendErrorResponse(this.res, 500, ERROR_MESSAGES.EXECUTION_TIMEOUT_HANDLING_ERROR);
                }
            } catch (killError) {
                logger.error('Failed to handle timeout', killError);
            }
        }, this.config.timeout + CONFIG.TIMEOUT_BUFFER_MS);
    }

    private killProcess(): void {
        if (!this.dockerProcess) return;

        this.dockerProcess.kill('SIGTERM');

        const killTimeoutId = setTimeout(async () => {
            if (this.dockerProcess && !this.dockerProcess.killed) {
                try {
                    this.dockerProcess.kill('SIGKILL');
                } catch (e) {
                    logger.error('Failed to SIGKILL', e);
                }
            }
            await this.cleanupContainerResource();
        }, CONFIG.SIGKILL_DELAY_MS);

        const clearKillTimeout = () => clearTimeout(killTimeoutId);
        this.dockerProcess.once('close', clearKillTimeout);
        this.dockerProcess.once('error', clearKillTimeout);
    }

    private async cleanupContainerResource(): Promise<void> {
        if (this.pooledContainerId) {
            await containerPool.returnContainer(this.language, this.config.image, this.pooledContainerId);
        } else {
            await this.removeContainer(this.containerNameForCleanup);
        }
    }

    private async removeContainer(containerName: string): Promise<void> {
        if (!validateContainerName(containerName)) return;
        try {
            await execAsync(`docker rm -f ${containerName} 2>/dev/null || true`);
        } catch {
            // Ignore removal errors
        }
    }

    private async performCleanup(): Promise<void> {
        try {
            await this.cleanupContainerResource();
        } catch (e) {
            logger.error('Cleanup error', e);
        }

        const cleanupPromises = [cleanupFile(this.fullCodePath)];
        if (this.fullInputPath) {
            cleanupPromises.push(cleanupFile(this.fullInputPath));
        }
        await Promise.allSettled(cleanupPromises);
    }

    private markResponseHandled(): boolean {
        if (this.responseHandled || this.res.headersSent) {
            return false;
        }
        this.responseHandled = true;
        return true;
    }

    private async handleClose(code: number | null): Promise<void> {
        if (!this.markResponseHandled()) return;

        try {
            const { stdout, stderr } = this.outputCollector.getFinalOutput();
            const executionTime = Date.now() - this.startTime;
            const error: ExecutionError | null = code !== 0 ? createExecutionError(code, stderr || '') : null;

            await handleExecutionResult(
                error,
                stdout,
                stderr,
                executionTime,
                this.res,
                this.sessionOutputDir,
                this.cacheKey
            );

            await this.performCleanup();
        } catch (err) {
            logger.error('Error in handleClose', err);
            await this.performCleanup();
            if (!this.res.headersSent) {
                safeSendErrorResponse(this.res, 500, ERROR_MESSAGES.RESULT_PROCESSING_ERROR);
            }
        }
    }

    private async handleError(error: Error): Promise<void> {
        if (!this.markResponseHandled()) return;

        try {
            const { stdout, stderr } = this.outputCollector.getFinalOutput();
            const executionTime = Date.now() - this.startTime;

            const errorMessage = error.message || '';
            const combinedStderr = stderr || errorMessage;
            const executionError =
                errorMessage.includes('ENOENT') || isDockerError(combinedStderr)
                    ? createExecutionError(null, combinedStderr, errorMessage)
                    : createExecutionError(null, combinedStderr);

            await handleExecutionResult(
                executionError,
                stdout,
                combinedStderr,
                executionTime,
                this.res,
                this.sessionOutputDir,
                this.cacheKey
            );

            await this.performCleanup();
        } catch (err) {
            logger.error('Error in handleError', err);
            await this.performCleanup();
            if (!this.res.headersSent) {
                safeSendErrorResponse(this.res, 500, ERROR_MESSAGES.EXECUTION_ERROR_HANDLING_ERROR);
            }
        }
    }
}
