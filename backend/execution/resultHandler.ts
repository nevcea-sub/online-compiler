import { promises as fs } from 'fs';
import { Response } from 'express';
import { ExecutionError, ImageFile } from '../types';
import { filterDockerMessages, sanitizeError, sanitizeErrorForUser } from '../utils/errorHandling';
import { findImageFiles } from '../file/fileManager';
import { executionCache } from '../utils/cache';
import { codeExecutionTotal, codeExecutionDuration, codeExecutionErrors } from '../utils/metrics';
import { CONFIG } from '../config';

export async function handleExecutionResult(
    error: ExecutionError | Error | null,
    stdout: string,
    stderr: string,
    executionTime: number,
    res: Response,
    outputDir: string | null = null,
    cacheKey?: { code: string; language: string; input: string },
    language?: string
): Promise<void> {
    const filteredStdout = filterDockerMessages(stdout || '');
    const filteredStderr = filterDockerMessages(stderr || '');
    const hasStdout = stdout && stdout.trim().length > 0;

    let images: ImageFile[] = [];
    if (outputDir) {
        try {
            images = await findImageFiles(outputDir);
        } catch (error) {
            console.error('[ERROR] Failed to find image files:', error);
        }
        fs.rm(outputDir, { recursive: true, force: true }).catch((error) => {
            if (CONFIG.DEBUG_MODE) {
                console.error('[ERROR] Failed to cleanup output directory:', error);
            }
        });
    }

    if (language) {
        const executionTimeSeconds = executionTime / 1000;
        codeExecutionDuration.observe({ language }, executionTimeSeconds);

        if (error) {
            const errorType = ('killed' in error && error.killed) || ('signal' in error && error.signal === 'SIGTERM')
                ? 'timeout'
                : 'execution_error';
            codeExecutionErrors.inc({ language, error_type: errorType });
            codeExecutionTotal.inc({ language, status: 'error' });
        } else {
            codeExecutionTotal.inc({ language, status: 'success' });
        }
    }

    if (error) {
        let errorMsg: string;
        if ('killed' in error && error.killed || 'signal' in error && error.signal === 'SIGTERM') {
            errorMsg = '실행 시간이 초과되었습니다.';
        } else {
            let errorSource: string;
            if ('message' in error && error.message && error.message !== 'Docker error') {
                errorSource = error.message;
            } else {
                errorSource = stderr || ('message' in error ? error.message || 'Unknown error' : 'Unknown error');
            }
            const sanitized = sanitizeError(errorSource);
            errorMsg = sanitizeErrorForUser(sanitized);
        }

        const result = {
            output: filteredStdout || '',
            error: errorMsg,
            executionTime,
            images: images.map(img => img.data)
        };

        if (cacheKey) {
            executionCache.set(cacheKey.code, cacheKey.language, cacheKey.input, {
                output: result.output,
                error: result.error,
                executionTime: result.executionTime,
                images: result.images
            });
        }

        res.json(result);
        return;
    }

    let finalOutput = hasStdout ? filteredStdout : '';
    let finalError = '';

    if (!hasStdout && filteredStderr) {
        const isBuildSuccess = /Build succeeded/i.test(filteredStderr);
        const isBuildFailed = /Build FAILED/i.test(filteredStderr);
        const isWarningOnly =
            /warning/i.test(filteredStderr) && !/error/i.test(filteredStderr) && !isBuildFailed;

        if (isBuildSuccess || isWarningOnly) {
            finalOutput = '';
            finalError = '';
        } else {
            finalError = sanitizeErrorForUser(filteredStderr);
        }
    } else if (hasStdout) {
        finalError = '';
    } else {
        finalError = filteredStderr ? sanitizeErrorForUser(filteredStderr) : '';
    }

    const result = {
        output: finalOutput,
        error: finalError,
        executionTime,
        images: images.map(img => img.data)
    };

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

