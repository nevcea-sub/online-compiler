import { ExecutionError } from '../types';

export function isDockerError(stderr: string): boolean {
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

export function createExecutionError(
    code: number | null,
    stderr: string,
    errorMessage?: string
): ExecutionError {
    const stderrStr = stderr || '';
    const combinedStderr = stderrStr || errorMessage || '';

    if (isDockerError(combinedStderr)) {
        return {
            message: combinedStderr || errorMessage || 'Docker error',
            code,
            killed: false,
            signal: null
        };
    }

    if (code !== null && code !== 0) {
        return {
            code,
            killed: false,
            signal: null,
            message: stderrStr || 'Execution error'
        };
    }

    return {
        message: combinedStderr || errorMessage || 'Unknown error',
        code: null,
        killed: false,
        signal: null
    };
}

export function validateContainerName(name: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 128;
}

