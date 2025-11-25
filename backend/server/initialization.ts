import path from 'path';
import { ensureDirectories } from '../file/fileManager';
import { warmupKotlinOnStart } from '../docker/dockerWarmup';
import { createCleanupScheduler } from '../utils/cleanupScheduler';
import { setResourceMonitorPaths } from '../utils/resourceMonitor';
import { executionCache } from '../utils/cache';
import { createLogger } from '../utils/logger';

const logger = createLogger('ServerInit');

export interface ServerPaths {
    codeDir: string;
    outputDir: string;
    toolCacheDir: string;
    kotlinCacheDir: string;
    kotlinBuildsDir: string;
}

export function getServerPaths(): ServerPaths {
    const codeDir = process.env.CODE_DIR || (process.env.NODE_ENV === 'production'
        ? '/app/code'
        : path.join(__dirname, '..', 'code'));
    const outputDir = process.env.OUTPUT_DIR || (process.env.NODE_ENV === 'production'
        ? '/app/output'
        : path.join(__dirname, '..', 'output'));
    const toolCacheDir = process.env.TOOL_CACHE_DIR || (process.env.NODE_ENV === 'production'
        ? '/app/tool_cache'
        : path.join(__dirname, '..', 'tool_cache'));
    const kotlinCacheDir = path.join(toolCacheDir, 'kotlin');
    const kotlinBuildsDir = path.join(toolCacheDir, 'kotlin_builds');

    return {
        codeDir,
        outputDir,
        toolCacheDir,
        kotlinCacheDir,
        kotlinBuildsDir
    };
}

export async function initializeServer(paths: ServerPaths): Promise<void> {
    logger.info('Ensuring required directories...', {
        codeDir: paths.codeDir,
        outputDir: paths.outputDir,
        toolCacheDir: paths.toolCacheDir
    });

    await ensureDirectories(
        paths.codeDir,
        paths.outputDir,
        paths.toolCacheDir,
        paths.kotlinCacheDir,
        paths.kotlinBuildsDir
    );

    await warmupKotlinOnStart(paths.kotlinCacheDir);

    setResourceMonitorPaths(paths.codeDir, paths.outputDir);

    const cleanupScheduler = createCleanupScheduler(paths.codeDir, paths.outputDir);
    cleanupScheduler.start();

    const shutdown = (signal: string) => {
        logger.info(`${signal} received, shutting down gracefully...`);
        cleanupScheduler.stop();
        executionCache.stop();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

