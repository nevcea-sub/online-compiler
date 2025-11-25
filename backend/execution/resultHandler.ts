import { promises as fs } from 'fs';
import { Response } from 'express';
import { ExecutionError, ImageFile } from '../types';
import { filterDockerMessages, sanitizeError, sanitizeErrorForUser } from '../utils/errorHandling';
import { findImageFiles } from '../file/fileManager';
import { executionCache } from '../utils/cache';
import { createLogger } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/constants';

const logger = createLogger('ResultHandler');

function isTimeoutError(error: ExecutionError | Error): boolean {
    return ('killed' in error && error.killed) || ('signal' in error && error.signal === 'SIGTERM');
}

function createResultObject(output: string, error: string, executionTime: number, images: ImageFile[]): any {
    return {
        output: output || '',
        error,
        executionTime,
        images: images.map(img => img.data)
    };
}

function cacheAndSendResult(
    result: any,
    res: Response,
    cacheKey?: { code: string; language: string; input: string }
): void {
    if (cacheKey) {
        executionCache.set(cacheKey.code, cacheKey.language, cacheKey.input, {
            output: result.output,
            error: result.error,
            executionTime: result.executionTime,
            images: result.images
        });
    }
    res.json(result);
}

export async function handleExecutionResult(
    error: ExecutionError | Error | null,
    stdout: string,
    stderr: string,
    executionTime: number,
    res: Response,
    outputDir: string | null = null,
    cacheKey?: { code: string; language: string; input: string }
): Promise<void> {
    const filteredStdout = filterDockerMessages(stdout || '');
    const filteredStderr = filterDockerMessages(stderr || '');
    const hasStdout = stdout && stdout.trim().length > 0;

    let images: ImageFile[] = [];
    if (outputDir) {
        try {
            images = await findImageFiles(outputDir);
        } catch (error) {
            logger.error('Failed to find image files:', error);
        }
        fs.rm(outputDir, { recursive: true, force: true }).catch((error) => {
            logger.debug('Failed to cleanup output directory:', error);
        });
    }

    if (error) {
        const errorMsg = isTimeoutError(error)
            ? ERROR_MESSAGES.EXECUTION_TIMEOUT
            : (() => {
                const errorSource = ('message' in error && error.message && error.message !== 'Docker error')
                    ? error.message
                    : stderr || ('message' in error ? error.message || 'Unknown error' : 'Unknown error');
                return sanitizeErrorForUser(sanitizeError(errorSource));
            })();

        const result = createResultObject(filteredStdout, errorMsg, executionTime, images);
        cacheAndSendResult(result, res, cacheKey);
        return;
    }

    const { finalOutput, finalError } = (() => {
        if (hasStdout) {
            return { finalOutput: filteredStdout, finalError: '' };
        }

        if (filteredStderr) {
            const isBuildSuccess = /Build succeeded/i.test(filteredStderr);
            const isBuildFailed = /Build FAILED/i.test(filteredStderr);
            const isWarningOnly =
                /warning/i.test(filteredStderr) && !/error/i.test(filteredStderr) && !isBuildFailed;

            if (isBuildSuccess || isWarningOnly) {
                return { finalOutput: '', finalError: '' };
            }
            return { finalOutput: '', finalError: sanitizeErrorForUser(filteredStderr) };
        }

        return { finalOutput: '', finalError: '' };
    })();

    const result = createResultObject(finalOutput, finalError, executionTime, images);
    cacheAndSendResult(result, res, cacheKey);
}

