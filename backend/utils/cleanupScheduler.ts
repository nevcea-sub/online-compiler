import { CONFIG } from '../config';
import { cleanupOldSessions, CleanupStats } from './resourceCleanup';
import { createLogger } from './logger';

const logger = createLogger('CleanupScheduler');

export interface CleanupScheduler {
    start(): void;
    stop(): void;
    runCleanup(): Promise<CleanupStats>;
    isRunning(): boolean;
}

class CleanupSchedulerImpl implements CleanupScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private isActive = false;
    private codeDir: string;
    private outputDir: string;

    constructor(codeDir: string, outputDir: string) {
        this.codeDir = codeDir;
        this.outputDir = outputDir;
    }

    start(): void {
        if (this.isActive || !CONFIG.ENABLE_CLEANUP) {
            return;
        }

        this.isActive = true;
        logger.info(
            `Starting cleanup scheduler (interval: ${CONFIG.CLEANUP_INTERVAL_MS}ms, max age: ${CONFIG.SESSION_MAX_AGE_MS}ms)`
        );

        this.runCleanup().catch((error) => {
            logger.error('Initial cleanup failed:', error);
        });

        this.intervalId = setInterval(() => {
            this.runCleanup().catch((error) => {
                logger.error('Scheduled cleanup failed:', error);
            });
        }, CONFIG.CLEANUP_INTERVAL_MS);
    }

    stop(): void {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger.info('Cleanup scheduler stopped');
    }

    async runCleanup(): Promise<CleanupStats> {
        if (!CONFIG.ENABLE_CLEANUP) {
            return {
                filesDeleted: 0,
                directoriesDeleted: 0,
                bytesFreed: 0,
                errors: 0
            };
        }

        const startTime = Date.now();
        const stats = await cleanupOldSessions(this.codeDir, this.outputDir, CONFIG.SESSION_MAX_AGE_MS);
        const duration = Date.now() - startTime;

        if (stats.filesDeleted > 0 || stats.directoriesDeleted > 0 || stats.errors > 0) {
            logger.info(`Cleanup completed in ${duration}ms:`, {
                filesDeleted: stats.filesDeleted,
                directoriesDeleted: stats.directoriesDeleted,
                bytesFreed: formatBytes(stats.bytesFreed),
                errors: stats.errors
            });
        }

        return stats;
    }

    isRunning(): boolean {
        return this.isActive;
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

let schedulerInstance: CleanupScheduler | null = null;

export function createCleanupScheduler(codeDir: string, outputDir: string): CleanupScheduler {
    if (schedulerInstance) {
        return schedulerInstance;
    }
    schedulerInstance = new CleanupSchedulerImpl(codeDir, outputDir);
    return schedulerInstance;
}

export function getCleanupScheduler(): CleanupScheduler | null {
    return schedulerInstance;
}
