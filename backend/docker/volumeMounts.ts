import path from 'path';
import { CONFIG } from '../config';
import { BuildOptions } from '../types';
import { convertToDockerPath, validateDockerPath } from '../utils/pathUtils';

function validateAndConvertPath(hostPath: string, pathName: string): string {
    const dockerPath = convertToDockerPath(hostPath);
    if (!validateDockerPath(dockerPath)) {
        const error = new Error(`Invalid Docker ${pathName} path: ${dockerPath}`);
        console.error(`[ERROR] Invalid ${pathName}: "${dockerPath}" from hostPath: "${hostPath}"`);
        throw error;
    }
    return dockerPath;
}

export function addVolumeMount(
    volumeMounts: string[],
    hostPath: string,
    containerPath: string,
    pathName: string,
    mode: 'ro' | 'rw' = 'ro'
): void {
    const dockerPath = validateAndConvertPath(hostPath, pathName);
    volumeMounts.push('-v', `${dockerPath}:${containerPath}:${mode}`);
}

export function buildVolumeMounts(
    hostCodePath: string,
    opts: BuildOptions,
    language: string,
    kotlinCacheDir?: string
): string[] {
    const volumeMounts: string[] = [];
    const hostCodeDir = path.dirname(hostCodePath);

    if (CONFIG.DEBUG_MODE) {
        const hostFileName = path.basename(hostCodePath);
        const dockerHostDir = validateAndConvertPath(hostCodeDir, 'host directory');
        const mountedFilePath = `/code/${hostFileName}`;
        console.log(
            `[DEBUG] File paths: hostCodePath=${hostCodePath}, hostCodeDir=${hostCodeDir}, hostFileName=${hostFileName}, dockerHostDir=${dockerHostDir}, mountedFilePath=${mountedFilePath}`
        );
    }

    addVolumeMount(volumeMounts, hostCodeDir, '/code', 'code directory', 'ro');

    if (opts.inputPath) {
        const hostInputDir = path.dirname(opts.inputPath);
        if (CONFIG.DEBUG_MODE) {
            console.log(`[DEBUG] Input file paths: hostInputPath=${opts.inputPath}, hostInputDir=${hostInputDir}`);
        }
        addVolumeMount(volumeMounts, hostInputDir, '/input', 'input directory', 'ro');
    }

    if (language === 'kotlin' && kotlinCacheDir) {
        addVolumeMount(volumeMounts, kotlinCacheDir, '/opt/kotlin', 'Kotlin cache directory', 'rw');
    }

    if (opts.outputDirHost) {
        addVolumeMount(volumeMounts, opts.outputDirHost, '/output', 'output directory', 'rw');
    }

    return volumeMounts;
}

