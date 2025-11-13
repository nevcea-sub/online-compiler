import { CONFIG, TMPFS_SIZES, KOTLIN_DOWNLOAD_CMD, KOTLIN_COMPILER_CHECK } from '../config';
import { WarmupConfig, WarmupResult, DockerCommandError } from '../types';
import { runDockerCommand } from './dockerClient';
import { checkImageExists } from './dockerImage';
import { kotlinCompilerExistsOnHost } from '../utils/pathUtils';

export function getWarmupConfigs(kotlinCacheDir: string): Omit<WarmupConfig, 'allowNetwork'>[] {
    return [
        {
            language: 'python',
            image: 'python:3.11-slim',
            command: 'python -V',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'javascript',
            image: 'node:20-slim',
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'c',
            image: 'gcc:14',
            command: 'gcc --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'cpp',
            image: 'gcc:14',
            command: 'g++ --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'java',
            image: 'eclipse-temurin:17-jdk-alpine',
            command: 'java -version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'rust',
            image: 'rust:1.81',
            command: 'rustc --version',
            tmpfsSize: TMPFS_SIZES.rust,
            timeout: 4000
        },
        {
            language: 'php',
            image: 'php:8.3-alpine',
            command: 'php -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 8000
        },
        {
            language: 'r',
            image: 'r-base:4.4.1',
            command: 'Rscript --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'ruby',
            image: 'ruby:3.3-alpine',
            command: 'ruby -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'csharp',
            image: 'mcr.microsoft.com/dotnet/sdk:8.0',
            command: 'dotnet --version',
            tmpfsSize: TMPFS_SIZES.csharp,
            timeout: 8000
        },
        {
            language: 'kotlin',
            image: 'eclipse-temurin:17-jdk-alpine',
            command: kotlinCompilerExistsOnHost(kotlinCacheDir)
                ? 'java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version'
                : `if ${KOTLIN_COMPILER_CHECK}; then ${KOTLIN_DOWNLOAD_CMD}; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version`,
            tmpfsSize: TMPFS_SIZES.kotlin,
            timeout: 12000
        },
        {
            language: 'go',
            image: 'golang:1.23-alpine',
            command: 'go version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 4000
        },
        {
            language: 'typescript',
            image: 'node:20-slim',
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 8000
        },
        {
            language: 'swift',
            image: 'swift:5.10',
            command: 'swift --version',
            tmpfsSize: TMPFS_SIZES.swift,
            timeout: 12000
        },
        {
            language: 'perl',
            image: 'perl:5.40-slim',
            command: 'perl -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 8000
        },
        {
            language: 'haskell',
            image: 'haskell:9.6',
            command: 'ghc --version',
            tmpfsSize: TMPFS_SIZES.haskell,
            timeout: 12000
        },
        {
            language: 'bash',
            image: 'alpine:3.19',
            command: 'echo "Alpine Linux ready for bash"',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 8000
        }
    ];
}

export async function warmupContainer(
    config: Omit<WarmupConfig, 'allowNetwork'>,
    kotlinCacheDir?: string
): Promise<WarmupResult> {
    try {
        let retries = 3;
        let imageExists = false;
        while (retries > 0 && !imageExists) {
            imageExists = await checkImageExists(config.image);
            if (!imageExists) {
                retries--;
                if (retries > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        }

        if (!imageExists) {
            return {
                success: false,
                language: config.language,
                error: `Image ${config.image} not found after waiting`,
                elapsed: 0
            };
        }

        const allowNetwork = config.language === 'kotlin';
        const result = await runDockerCommand(
            config.image,
            config.command,
            config.tmpfsSize,
            config.timeout,
            allowNetwork,
            kotlinCacheDir
        );

        if (
            config.language === 'kotlin' &&
            result.stderr &&
            result.stderr.includes('kotlinc-jvm')
        ) {
            return { success: true, language: config.language, elapsed: result.elapsed };
        }

        return { success: true, language: config.language, elapsed: result.elapsed };
    } catch (error) {
        const dockerError = error as DockerCommandError;
        const errorInfo = dockerError?.error || {};
        let errorMessage = errorInfo.message || (error as Error)?.message || 'Unknown error';

        if (
            (error as Error).name === 'AbortError' ||
            errorMessage.includes('aborted') ||
            errorMessage.includes('The operation was aborted')
        ) {
            errorMessage = `Timeout after ${config.timeout}ms`;
        }

        if (
            config.language === 'kotlin' &&
            errorInfo.stderr &&
            errorInfo.stderr.includes('kotlinc-jvm')
        ) {
            return { success: true, language: config.language, elapsed: dockerError?.elapsed || 0 };
        }

        if (errorInfo.stderr && errorInfo.stderr.trim()) {
            const stderrLines = errorInfo.stderr.trim().split('\n');
            const lastLine = stderrLines[stderrLines.length - 1];
            if (lastLine && lastLine.length < 150) {
                errorMessage = lastLine;
            } else if (stderrLines.length > 0) {
                errorMessage = stderrLines[0].substring(0, 150);
            }
        }

        return {
            success: false,
            language: config.language,
            error: errorMessage,
            fullError: errorInfo,
            elapsed: dockerError?.elapsed || 0
        };
    }
}

export async function warmupAllContainers(kotlinCacheDir: string): Promise<void> {
    const { isDockerAvailable } = await import('./dockerClient');
    
    if (!(await isDockerAvailable())) {
        console.warn('[WARMUP] Docker is not available. Skipping container warmup.');
        return;
    }
    const configs = getWarmupConfigs(kotlinCacheDir);
    console.log(`[WARMUP] Warming up ${configs.length} containers...`);
    const startTime = Date.now();

    const results: WarmupResult[] = [];

    for (let i = 0; i < configs.length; i += CONFIG.WARMUP_BATCH_SIZE) {
        const batch = configs.slice(i, i + CONFIG.WARMUP_BATCH_SIZE);
        const batchPromises = batch.map((config) => warmupContainer(config, kotlinCacheDir));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        const succeededLanguages = batchResults.filter((r) => r.success).map((r) => r.language);
        const failedLanguages = batchResults.filter((r) => !r.success).map((r) => r.language);
        const batchNumber = Math.floor(i / CONFIG.WARMUP_BATCH_SIZE) + 1;

        if (successCount > 0 && failCount > 0) {
            console.log(`[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded`);
            console.log(`[WARMUP]   Succeeded: ${succeededLanguages.join(', ')}`);
            console.log(`[WARMUP]   Failed: ${failedLanguages.join(', ')}`);
        } else if (successCount > 0) {
            console.log(
                `[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded (${succeededLanguages.join(', ')})`
            );
        } else {
            console.log(
                `[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded (${failedLanguages.join(', ')})`
            );
        }
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedResults = results.filter((r) => !r.success);
        const failedLanguages = failedResults.map((r) => r.language);
        console.warn(`[WARMUP] Failed for ${totalFailed} languages: ${failedLanguages.join(', ')}`);

        failedResults.forEach((result) => {
            const errorMsg = result.error || 'Unknown error';
            const displayMsg =
                errorMsg.length > CONFIG.ERROR_MESSAGE_MAX_LENGTH
                    ? errorMsg.substring(0, CONFIG.ERROR_MESSAGE_MAX_LENGTH) + '...'
                    : errorMsg;
            console.warn(`[WARMUP]   ${result.language}: ${displayMsg}`);
        });
    }

    if (totalSuccess > 0) {
        const avgElapsed =
            results.filter((r) => r.success).reduce((sum, r) => sum + (r.elapsed || 0), 0) /
            totalSuccess;
        console.log(
            `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded (avg: ${avgElapsed.toFixed(0)}ms)`
        );
    } else {
        console.log(
            `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded`
        );
    }
}

export function warmupContainers(kotlinCacheDir: string): void {
    warmupAllContainers(kotlinCacheDir).catch((error) => {
        console.error('Initial warmup error:', error);
    });

    const frequentLanguages = ['python', 'javascript', 'java', 'cpp'];
    const configs = getWarmupConfigs(kotlinCacheDir);
    const frequentConfigs = configs.filter((config) =>
        frequentLanguages.includes(config.language)
    );

    setInterval(async () => {
        const { isDockerAvailable } = await import('./dockerClient');
        if (!(await isDockerAvailable())) {
            return;
        }
        const randomConfigs = frequentConfigs.sort(() => Math.random() - 0.5).slice(0, 2);
        randomConfigs.forEach((config) => {
            warmupContainer(config, kotlinCacheDir).catch((error) => {
                console.debug(`Warmup failed for ${config.language}:`, error);
            });
        });
    }, 60000);
}

export async function warmupKotlinOnStart(kotlinCacheDir: string): Promise<void> {
    if (kotlinCompilerExistsOnHost(kotlinCacheDir)) {
        return;
    }
    const image = 'eclipse-temurin:17-jdk-alpine';
    const cmd = `if ${KOTLIN_COMPILER_CHECK}; then ${KOTLIN_DOWNLOAD_CMD}; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version`;
    try {
        await runDockerCommand(image, cmd, TMPFS_SIZES.kotlin, 20000, true, kotlinCacheDir);
    } catch {
    }
}

