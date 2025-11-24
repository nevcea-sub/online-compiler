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
import { buildVolumeMounts } from './volumeMounts';

function buildFileCopyCommand(
    mountedFilePath: string,
    containerPath: string,
    includeInputCheck: boolean,
    inputBasename?: string
): string {
    if (CONFIG.DEBUG_MODE) {
        let command = '';
        if (includeInputCheck && inputBasename) {
            command += `test -f "/input/${inputBasename}" || (echo "ERROR: Input file not found" >&2 && exit 1) && `;
        }
        command += `cp "${mountedFilePath}" "${containerPath}" && test -f "${containerPath}" || (echo "ERROR: Copy failed" >&2 && exit 1) && `;
        return command;
    }
    return `cp "${mountedFilePath}" "${containerPath}" 2>/dev/null || exit 1 && `;
}

export function buildDockerArgs(
    language: string,
    hostCodePath: string,
    opts: BuildOptions = {},
    kotlinCacheDir?: string
): { args: string[]; containerName: string } {
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

    const containerName = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;

    const args: string[] = [
        'run',
        '--rm',
        '--name', containerName,
        `--memory=${CONFIG.MAX_MEMORY}`,
        `--cpus=${language === 'kotlin' ? CONFIG.MAX_CPU_PERCENT_KOTLIN : CPU_LIMITS[language] || CONFIG.MAX_CPU_PERCENT}`,
        '--init',
        '--stop-timeout', '1'
    ];

    if (language !== 'typescript' && language !== 'bash') {
        args.push('--network=none');
    }

    args.push(
        '--read-only',
        '--tmpfs', `/tmp:rw,exec,nosuid,size=${tmpfsSize}`,
        '--cap-drop=ALL',
        '--security-opt', 'no-new-privileges',
        '--pids-limit=128',
        '--log-driver', 'none',
        '--user', '1000:1000',
        '--oom-score-adj', '500'
    );

    const hostFileName = path.basename(hostCodePath);
    const mountedFilePath = `/code/${hostFileName}`;
    const volumeMounts = buildVolumeMounts(hostCodePath, opts, language, kotlinCacheDir);
    args.push(...volumeMounts);

    if (language === 'csharp') {
        args.push('-e', 'DOTNET_CLI_HOME=/tmp', '-e', 'NUGET_PACKAGES=/tmp/.nuget', '-w', '/tmp');
    }

    const inputBasename = opts.inputPath ? path.basename(opts.inputPath) : undefined;
    const fileCopyCommand = buildFileCopyCommand(mountedFilePath, containerPath, !!opts.inputPath, inputBasename);
    args.push(config.image, 'sh', '-c', `${fileCopyCommand}${command}`);

    return { args, containerName };
}

