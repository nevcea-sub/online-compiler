import { createCleanupScheduler, getCleanupScheduler, CleanupScheduler } from '../../utils/cleanupScheduler';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

jest.mock('../../config', () => ({
    CONFIG: {
        ENABLE_CLEANUP: true,
        CLEANUP_INTERVAL_MS: 1000,
        SESSION_MAX_AGE_MS: 500,
        DEBUG_MODE: false
    }
}));

jest.mock('../../utils/resourceCleanup', () => ({
    cleanupOldSessions: jest.fn().mockResolvedValue({
        filesDeleted: 5,
        directoriesDeleted: 2,
        bytesFreed: 1024,
        errors: 0
    })
}));

describe('Cleanup Scheduler', () => {
    let testDir: string;
    let codeDir: string;
    let outputDir: string;
    let scheduler: CleanupScheduler;

    beforeEach(async () => {
        testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scheduler-test-'));
        codeDir = path.join(testDir, 'code');
        outputDir = path.join(testDir, 'output');
        await fs.mkdir(codeDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
    });

    afterEach(async () => {
        if (scheduler) {
            scheduler.stop();
        }
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch {}
    });

    it('should create scheduler instance', () => {
        scheduler = createCleanupScheduler(codeDir, outputDir);
        expect(scheduler).toBeDefined();
        expect(scheduler.isRunning()).toBe(false);
    });

    it('should return same instance on multiple calls', () => {
        const scheduler1 = createCleanupScheduler(codeDir, outputDir);
        const scheduler2 = createCleanupScheduler(codeDir, outputDir);
        expect(scheduler1).toBe(scheduler2);
    });

    it('should start scheduler', () => {
        scheduler = createCleanupScheduler(codeDir, outputDir);
        scheduler.start();
        expect(scheduler.isRunning()).toBe(true);
    });

    it('should stop scheduler', () => {
        scheduler = createCleanupScheduler(codeDir, outputDir);
        scheduler.start();
        expect(scheduler.isRunning()).toBe(true);
        scheduler.stop();
        expect(scheduler.isRunning()).toBe(false);
    });

    it('should run cleanup manually', async () => {
        scheduler = createCleanupScheduler(codeDir, outputDir);
        const stats = await scheduler.runCleanup();
        expect(stats.filesDeleted).toBe(5);
        expect(stats.directoriesDeleted).toBe(2);
    });

    it('should get scheduler instance', () => {
        scheduler = createCleanupScheduler(codeDir, outputDir);
        const retrieved = getCleanupScheduler();
        expect(retrieved).toBe(scheduler);
    });
});
