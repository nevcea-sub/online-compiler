import path from 'path';
import { ensureDirectories } from '../file/fileManager';
import { warmupKotlinOnStart } from '../docker/dockerWarmup';
import { createCleanupScheduler } from '../utils/cleanupScheduler';
import { setResourceMonitorPaths } from '../utils/resourceMonitor';
import { executionCache } from '../utils/cache';
import { startMetricsCollection, stopMetricsCollection } from '../utils/metrics';

export interface ServerPaths {
    codeDir: string;
    outputDir: string;
    toolCacheDir: string;
    kotlinCacheDir: string;
    kotlinBuildsDir: string;
}

export function getServerPaths(): ServerPaths {
    const codeDir = path.join(__dirname, '..', 'code');
    const outputDir = path.join(__dirname, '..', 'output');
    const toolCacheDir = path.join(__dirname, '..', 'tool_cache');
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
    console.log('[SERVER] Ensuring required directories...', {
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

    console.log('[SERVER] Directories ready. Starting Kotlin warmup (if needed)...');
    await warmupKotlinOnStart(paths.kotlinCacheDir);
    console.log('[SERVER] Kotlin warmup finished.');

    setResourceMonitorPaths(paths.codeDir, paths.outputDir);

    const cleanupScheduler = createCleanupScheduler(paths.codeDir, paths.outputDir);
    cleanupScheduler.start();

    startMetricsCollection();

    const shutdown = (signal: string) => {
        console.log(`[SERVER] ${signal} received, shutting down gracefully...`);
        cleanupScheduler.stop();
        executionCache.stop();
        stopMetricsCollection();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

