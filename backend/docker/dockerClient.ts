import { exec } from 'child_process';
import { promisify } from 'util';
import { CONFIG } from '../config';
import { DockerCommandResult, DockerCommandError } from '../types';
import { convertToDockerPath } from '../utils/pathUtils';
import { validateImage } from '../utils/validation';

export async function isDockerAvailable(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.DOCKER_CHECK_TIMEOUT);
    try {
        await promisify(exec)('docker version', { signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}

export async function runDockerCommand(
    image: string,
    command: string,
    tmpfsSize: string,
    timeout: number = 10000,
    allowNetwork: boolean = false,
    kotlinCacheDir?: string
): Promise<DockerCommandResult> {
    if (!validateImage(image) || typeof command !== 'string' || typeof tmpfsSize !== 'string') {
        throw new Error('Invalid parameters');
    }
    const escapedCommand = command.replace(/'/g, "'\\''").replace(/"/g, '\\"');
    const networkFlag = allowNetwork ? '' : '--network=none ';
    const mounts: string[] = [];
    if (allowNetwork && kotlinCacheDir) {
        try {
            const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
            mounts.push(`-v ${hostKotlinCache}:/opt/kotlin`);
        } catch {
        }
    }
    const dockerCmd = `docker run --rm --memory=${tmpfsSize} --cpus=${CONFIG.MAX_CPU_PERCENT} ${networkFlag}--read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize} ${mounts.join(' ')} ${image} sh -c "${escapedCommand}"`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startTime = Date.now();

    try {
        const { stdout, stderr } = await promisify(exec)(dockerCmd, {
            signal: controller.signal,
            maxBuffer: 1024 * 1024
        });
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        return { stdout, stderr, elapsed, cmd: dockerCmd };
    } catch (error) {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        const err = error as { message?: string; code?: string | number; signal?: string | null; killed?: boolean; stderr?: string; stdout?: string };
        const errorInfo: DockerCommandError['error'] = {
            message: err.message || 'Unknown error',
            code: err.code,
            signal: err.signal || null,
            killed: err.killed,
            stderr: err.stderr || '',
            stdout: err.stdout || ''
        };
        // Attach the command string for richer debugging
        (errorInfo as any).cmd = dockerCmd;
        throw { error: errorInfo, elapsed } as DockerCommandError;
    }
}

