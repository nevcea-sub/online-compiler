import { CONFIG, TMPFS_SIZES, KOTLIN_DOWNLOAD_CMD, KOTLIN_COMPILER_CHECK, WARMUP_TIMEOUTS, LANGUAGE_CONFIGS } from '../config';
import { WarmupConfig, WarmupResult, DockerCommandError } from '../types';
import { runDockerCommand } from './dockerClient';
import { checkImageExists } from './dockerImage';
import { kotlinCompilerExistsOnHost } from '../utils/pathUtils';

const warmupStatusCache = new Map<string, { warmed: boolean; timestamp: number }>();
const WARMUP_STATUS_TTL = 30 * 60 * 1000;
const warmupInProgress = new Set<string>();

export function isWarmedUp(language: string): boolean {
    const cached = warmupStatusCache.get(language);
    if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < WARMUP_STATUS_TTL) {
            return cached.warmed;
        }
        warmupStatusCache.delete(language);
    }
    return false;
}

export function markWarmedUp(language: string): void {
    warmupStatusCache.set(language, { warmed: true, timestamp: Date.now() });
}

export async function ensureWarmedUp(
    language: string,
    image: string,
    kotlinCacheDir?: string
): Promise<boolean> {
    if (isWarmedUp(language)) {
        return true;
    }

    if (warmupInProgress.has(language)) {
        return false;
    }

    const configs = getWarmupConfigs(kotlinCacheDir || '');
    const config = configs.find((c) => c.language === language);
    if (!config) {
        return false;
    }

    warmupInProgress.add(language);
    try {
        const result = await warmupContainer(config, kotlinCacheDir);
        if (result.success) {
            markWarmedUp(language);
            return true;
        }
    } catch {
    } finally {
        warmupInProgress.delete(language);
    }
    return false;
}

export function getWarmupConfigs(kotlinCacheDir: string): Omit<WarmupConfig, 'allowNetwork'>[] {
    const getImage = (language: string): string => {
        return LANGUAGE_CONFIGS[language]?.image || '';
    };

    return [
        {
            language: 'python',
            image: getImage('python'),
            command: 'python -V',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.python || 10000
        },
        {
            language: 'javascript',
            image: getImage('javascript'),
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.javascript || 10000
        },
        {
            language: 'c',
            image: getImage('c'),
            command: 'gcc --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.c || 10000
        },
        {
            language: 'cpp',
            image: getImage('cpp'),
            command: 'g++ --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.cpp || 10000
        },
        {
            language: 'java',
            image: getImage('java'),
            command: 'java -version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.java || 10000
        },
        {
            language: 'rust',
            image: getImage('rust'),
            command: 'rustc --version',
            tmpfsSize: TMPFS_SIZES.rust,
            timeout: WARMUP_TIMEOUTS.rust || 10000
        },
        {
            language: 'php',
            image: getImage('php'),
            command: 'php -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.php || 8000
        },
        {
            language: 'r',
            image: getImage('r'),
            command: 'Rscript --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.r || 10000
        },
        {
            language: 'ruby',
            image: getImage('ruby'),
            command: 'ruby -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.ruby || 8000
        },
        {
            language: 'csharp',
            image: getImage('csharp'),
            command: 'dotnet --version',
            tmpfsSize: TMPFS_SIZES.csharp,
            timeout: WARMUP_TIMEOUTS.csharp || 8000
        },
        {
            language: 'kotlin',
            image: getImage('kotlin'),
            command: kotlinCompilerExistsOnHost(kotlinCacheDir)
                ? 'java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version'
                : `if ${KOTLIN_COMPILER_CHECK}; then ${KOTLIN_DOWNLOAD_CMD}; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version`,
            tmpfsSize: TMPFS_SIZES.kotlin,
            timeout: WARMUP_TIMEOUTS.kotlin || 12000
        },
        {
            language: 'go',
            image: getImage('go'),
            command: 'go version',
            tmpfsSize: TMPFS_SIZES.go || TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.go || 10000
        },
        {
            language: 'typescript',
            image: getImage('typescript'),
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.typescript || 8000
        },
        {
            language: 'swift',
            image: getImage('swift'),
            command: 'swift --version',
            tmpfsSize: TMPFS_SIZES.swift,
            timeout: WARMUP_TIMEOUTS.swift || 12000
        },
        {
            language: 'perl',
            image: getImage('perl'),
            command: 'perl -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.perl || 8000
        },
        {
            language: 'haskell',
            image: getImage('haskell'),
            command: 'ghc --version',
            tmpfsSize: TMPFS_SIZES.haskell,
            timeout: WARMUP_TIMEOUTS.haskell || 12000
        },
        {
            language: 'bash',
            image: getImage('bash'),
            command: 'bash --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: WARMUP_TIMEOUTS.bash || 8000
        }
    ].filter(config => config.image);
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

        markWarmedUp(config.language);
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

        if (CONFIG.DEBUG_MODE) {
            console.debug(`[WARMUP][DEBUG] Failed warmup for ${config.language}`);
            if ((errorInfo as any).cmd) {
                console.debug('[WARMUP][DEBUG] Docker command:', (errorInfo as any).cmd);
            }
            if (errorInfo.stdout && errorInfo.stdout.trim()) {
                console.debug('[WARMUP][DEBUG] Stdout:\n', errorInfo.stdout);
            }
            if (errorInfo.stderr && errorInfo.stderr.trim()) {
                console.debug('[WARMUP][DEBUG] Stderr:\n', errorInfo.stderr);
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
    if (CONFIG.DEBUG_MODE) {
        console.log(`[WARMUP] Warming up ${configs.length} containers...`);
    }
    const startTime = Date.now();

    const results: WarmupResult[] = [];

    for (let i = 0; i < configs.length; i += CONFIG.WARMUP_BATCH_SIZE) {
        const batch = configs.slice(i, i + CONFIG.WARMUP_BATCH_SIZE);
        const batchPromises = batch.map((config) => warmupContainer(config, kotlinCacheDir));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (CONFIG.DEBUG_MODE) {
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
        if (CONFIG.DEBUG_MODE) {
            console.log(
                `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded (avg: ${avgElapsed.toFixed(0)}ms)`
            );
        }
    } else {
        if (CONFIG.DEBUG_MODE) {
            console.log(
                `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded`
            );
        }
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

