import path from 'path';
import {
    CONFIG,
    TMPFS_SIZES,
    CONTAINER_CODE_PATHS,
    LANGUAGE_EXTENSIONS,
    LANGUAGE_CONFIGS,
    CPU_LIMITS
} from '../config';
import { BuildOptions } from '../types';
import { validateLanguage, validateImage } from '../utils/validation';
import { convertToDockerPath, getContainerCodePath } from '../utils/pathUtils';
import { normalizePath } from '../utils/pathUtils';

export function buildDockerArgs(
    language: string,
    hostCodePath: string,
    opts: BuildOptions = {},
    kotlinCacheDir?: string
): string[] {
    if (!validateLanguage(language)) {
        throw new Error('Invalid language');
    }

    const normalized = normalizePath(hostCodePath);
    if (!normalized) {
        throw new Error('Invalid code path');
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config || !validateImage(config.image)) {
        throw new Error('Invalid language configuration');
    }

    const extension = LANGUAGE_EXTENSIONS[language];
    const containerPath = getContainerCodePath(language, extension, CONTAINER_CODE_PATHS);
    const containerBuildDir = language === 'kotlin' ? '/tmp/kbuild' : undefined;
    const containerInputPath = opts.inputPath
        ? `/input/${path.basename(opts.inputPath)}`
        : undefined;
    const command =
        language === 'kotlin'
            ? config.command(containerPath, containerInputPath, containerBuildDir)
            : config.command(containerPath, containerInputPath);
    const tmpfsSize = TMPFS_SIZES[language] || TMPFS_SIZES.default;
    const dockerHostPath = convertToDockerPath(hostCodePath);

    if (dockerHostPath.includes(' ') || containerPath.includes(' ')) {
        throw new Error('Invalid path format: paths with spaces are not supported');
    }

    if (containerPath.includes(':')) {
        throw new Error('Invalid container path format');
    }

    const args: string[] = [];
    args.length = 0;
    
    args.push('run', '--rm');
    args.push(`--memory=${CONFIG.MAX_MEMORY}`);

    const cpuLimit =
        language === 'kotlin'
            ? CONFIG.MAX_CPU_PERCENT_KOTLIN
            : CPU_LIMITS[language] || CONFIG.MAX_CPU_PERCENT;
    args.push(`--cpus=${cpuLimit}`);
    
    if (language !== 'typescript' && language !== 'bash') {
        args.push('--network=none');
    }
    
    args.push('--read-only', '--tmpfs', `/tmp:rw,exec,nosuid,size=${tmpfsSize},noatime`);
    args.push('--cap-drop=ALL', '--security-opt', 'no-new-privileges');
    args.push('--pids-limit=128', '--ulimit', 'nofile=1024:1024');
    args.push('--user', '1000:1000');

    const hostCodeDir = path.dirname(hostCodePath);
    const hostFileName = path.basename(hostCodePath);
    const dockerHostDir = convertToDockerPath(hostCodeDir);
    const mountedFilePath = `/code/${hostFileName}`;

    if (!dockerHostDir || dockerHostDir.trim() === '' || !dockerHostDir.startsWith('/')) {
        console.error(`[ERROR] Invalid dockerHostDir: "${dockerHostDir}" from hostCodeDir: "${hostCodeDir}"`);
        throw new Error(`Invalid Docker host directory path: ${dockerHostDir}`);
    }

    if (CONFIG.DEBUG_MODE) {
        console.log(
            `[DEBUG] File paths: hostCodePath=${hostCodePath}, hostCodeDir=${hostCodeDir}, hostFileName=${hostFileName}, dockerHostDir=${dockerHostDir}, mountedFilePath=${mountedFilePath}`
        );
    }

    const volumeMounts: string[] = [];
    
    volumeMounts.push('-v', `${dockerHostDir}:/code:ro`);

    if (opts.inputPath) {
        const hostInputDir = path.dirname(opts.inputPath);
        const dockerInputDir = convertToDockerPath(hostInputDir);
        const inputBasename = path.basename(opts.inputPath);
        
        if (!dockerInputDir || dockerInputDir.trim() === '' || !dockerInputDir.startsWith('/')) {
            console.error(`[ERROR] Invalid dockerInputDir: "${dockerInputDir}" from hostInputDir: "${hostInputDir}"`);
            throw new Error(`Invalid Docker input directory path: ${dockerInputDir}`);
        }
        
        if (CONFIG.DEBUG_MODE) {
            console.log(
                `[DEBUG] Input file paths: hostInputPath=${opts.inputPath}, dockerInputDir=${dockerInputDir}`
            );
        }
        volumeMounts.push('-v', `${dockerInputDir}:/input:ro`);
    }
    
    if (language === 'kotlin' && kotlinCacheDir) {
        const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
        if (!hostKotlinCache || hostKotlinCache.trim() === '' || !hostKotlinCache.startsWith('/')) {
            console.error(`[ERROR] Invalid hostKotlinCache: "${hostKotlinCache}" from kotlinCacheDir: "${kotlinCacheDir}"`);
            throw new Error(`Invalid Docker Kotlin cache directory path: ${hostKotlinCache}`);
        }
        volumeMounts.push('-v', `${hostKotlinCache}:/opt/kotlin`);
    }
    if (opts.outputDirHost) {
        const hostOutputDir = convertToDockerPath(opts.outputDirHost);
        if (!hostOutputDir || hostOutputDir.trim() === '' || !hostOutputDir.startsWith('/')) {
            console.error(`[ERROR] Invalid hostOutputDir: "${hostOutputDir}" from outputDirHost: "${opts.outputDirHost}"`);
            throw new Error(`Invalid Docker output directory path: ${hostOutputDir}`);
        }
        volumeMounts.push('-v', `${hostOutputDir}:/output:rw`);
    }
    
    args.push(...volumeMounts);

    if (language === 'csharp') {
        args.push('-e', 'DOTNET_CLI_HOME=/tmp', '-e', 'NUGET_PACKAGES=/tmp/.nuget', '-w', '/tmp');
    }

    if (opts.inputPath) {
        const inputBasename = path.basename(opts.inputPath);
        
        const inputFileCheck = !CONFIG.DEBUG_MODE
            ? `test -f "/input/${inputBasename}" || (echo "ERROR: Input file not found" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking input file: /input/${inputBasename}" >&2 && if [ ! -f "/input/${inputBasename}" ]; then echo "ERROR: Input file not found: /input/${inputBasename}" >&2; ls -la /input >&2; exit 1; fi && `;
        
        const fileCopy = !CONFIG.DEBUG_MODE
            ? `test -f "${mountedFilePath}" || (echo "ERROR: Source file not found" >&2 && exit 1) && cp "${mountedFilePath}" "${containerPath}" && test -f "${containerPath}" || (echo "ERROR: Copy failed" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking source file: ${mountedFilePath}" >&2 && if [ ! -f "${mountedFilePath}" ]; then echo "ERROR: Source file not found: ${mountedFilePath}" >&2; ls -la /code >&2; exit 1; fi && echo "[DEBUG] Copying file to ${containerPath}" >&2 && cp "${mountedFilePath}" "${containerPath}" && echo "[DEBUG] Verifying copied file" >&2 && if [ ! -f "${containerPath}" ]; then echo "ERROR: Destination file not found after copy: ${containerPath}" >&2; ls -la /tmp >&2; exit 1; fi && if [ ! -s "${containerPath}" ]; then echo "ERROR: Destination file is empty: ${containerPath}" >&2; exit 1; fi && echo "[DEBUG] File copy successful" >&2 && `;
        
        args.push(config.image, 'sh', '-c', `${inputFileCheck}${fileCopy}${command}`);
    } else {
        const fileCopy = !CONFIG.DEBUG_MODE
            ? `test -f "${mountedFilePath}" || (echo "ERROR: Source file not found" >&2 && exit 1) && cp "${mountedFilePath}" "${containerPath}" && test -f "${containerPath}" || (echo "ERROR: Copy failed" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking source file: ${mountedFilePath}" >&2 && if [ ! -f "${mountedFilePath}" ]; then echo "ERROR: Source file not found: ${mountedFilePath}" >&2; ls -la /code >&2; exit 1; fi && echo "[DEBUG] Copying file to ${containerPath}" >&2 && cp "${mountedFilePath}" "${containerPath}" && echo "[DEBUG] Verifying copied file" >&2 && if [ ! -f "${containerPath}" ]; then echo "ERROR: Destination file not found after copy: ${containerPath}" >&2; ls -la /tmp >&2; exit 1; fi && if [ ! -s "${containerPath}" ]; then echo "ERROR: Destination file is empty: ${containerPath}" >&2; exit 1; fi && echo "[DEBUG] File copy successful" >&2 && `;
        
        args.push(config.image, 'sh', '-c', `${fileCopy}${command}`);
    }

    return args;
}

