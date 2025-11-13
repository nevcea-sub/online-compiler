import { promises as fs } from 'fs';
import { Response } from 'express';
import { ExecutionError, ImageFile } from '../types';
import { filterDockerMessages, sanitizeError, sanitizeErrorForUser } from '../utils/errorHandling';
import { findImageFiles } from '../file/fileManager';

export async function handleExecutionResult(
    error: ExecutionError | Error | null,
    stdout: string,
    stderr: string,
    executionTime: number,
    res: Response,
    outputDir: string | null = null
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
        try {
            await fs.rm(outputDir, { recursive: true, force: true });
        } catch (error) {
            console.error('[ERROR] Failed to cleanup output directory:', error);
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

        res.json({
            output: filteredStdout || '',
            error: errorMsg,
            executionTime,
            images
        });
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

    res.json({
        output: finalOutput,
        error: finalError,
        executionTime,
        images
    });
}

