import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { CONFIG } from '../config';
import { DockerCommandResult, DockerCommandError } from '../types';
import { convertToDockerPath } from '../utils/pathUtils';
import { Validator } from '../utils/validation';
import { createTimeoutController } from '../utils/timeout';

export async function isDockerAvailable(): Promise<boolean> {
    const { controller, clear } = createTimeoutController(CONFIG.DOCKER_CHECK_TIMEOUT);
    try {
        await promisify(exec)('docker version', { signal: controller.signal });
        clear();
        return true;
    } catch {
        clear();
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
    if (!Validator.image(image) || typeof command !== 'string' || typeof tmpfsSize !== 'string') {
        throw new Error('Invalid parameters');
    }
    const networkFlag = allowNetwork ? [] : ['--network=none'];
    const mounts: string[] = [];
    if (allowNetwork && kotlinCacheDir) {
        try {
            const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
            mounts.push('-v', `${hostKotlinCache}:/opt/kotlin`);
        } catch {}
    }

    const args: string[] = [
        'run',
        '--rm',
        `--memory=${tmpfsSize}`,
        `--cpus=${CONFIG.MAX_CPU_PERCENT}`,
        ...networkFlag,
        '--read-only',
        '--tmpfs',
        `/tmp:rw,exec,nosuid,size=${tmpfsSize}`,
        ...mounts,
        image,
        'sh',
        '-c',
        command
    ];

    const dockerCmdStr = ['docker', ...args].join(' ');
    const { controller, clear } = createTimeoutController(timeout + 500);
    const startTime = Date.now();

    try {
        const { stdout, stderr } = await promisify(execFile)('docker', args, {
            signal: controller.signal,
            maxBuffer: 1024 * 1024
        } as any);
        const stdoutStr = typeof stdout === 'string' ? stdout : stdout ? stdout.toString('utf8') : '';
        const stderrStr = typeof stderr === 'string' ? stderr : stderr ? stderr.toString('utf8') : '';
        clear();
        const elapsed = Date.now() - startTime;
        return { stdout: stdoutStr, stderr: stderrStr, elapsed, cmd: dockerCmdStr };
    } catch (error) {
        clear();
        const elapsed = Date.now() - startTime;
        const err = error as {
            message?: string;
            code?: string | number;
            signal?: string | null;
            killed?: boolean;
            stderr?: Buffer | string;
            stdout?: Buffer | string;
        };
        const errorStdout =
            typeof err.stdout === 'string' ? err.stdout : err.stdout ? (err.stdout as Buffer).toString('utf8') : '';
        const errorStderr =
            typeof err.stderr === 'string' ? err.stderr : err.stderr ? (err.stderr as Buffer).toString('utf8') : '';
        const errorInfo: DockerCommandError['error'] = {
            message: err.message || 'Unknown error',
            code: err.code,
            signal: err.signal || null,
            killed: err.killed,
            stderr: errorStderr,
            stdout: errorStdout
        };
        (errorInfo as any).cmd = dockerCmdStr;
        throw { error: errorInfo, elapsed } as DockerCommandError;
    }
}
