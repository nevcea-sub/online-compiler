import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from './logger';

const logger = createLogger('ResourceCleanup');

export interface CleanupStats {
    filesDeleted: number;
    directoriesDeleted: number;
    bytesFreed: number;
    errors: number;
}

export async function cleanupOldFiles(dirPath: string, maxAgeMs: number, filePattern?: string): Promise<CleanupStats> {
    const stats: CleanupStats = {
        filesDeleted: 0,
        directoriesDeleted: 0,
        bytesFreed: 0,
        errors: 0
    };

    try {
        const files = await fs.readdir(dirPath);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(dirPath, file);

            try {
                const stat = await fs.stat(filePath);

                if (filePattern) {
                    const pattern = new RegExp(filePattern.replace(/\*/g, '.*'));
                    if (!pattern.test(file)) {
                        continue;
                    }
                }

                const age = now - stat.mtimeMs;
                if (age > maxAgeMs) {
                    if (stat.isDirectory()) {
                        await fs.rm(filePath, { recursive: true, force: true });
                        stats.directoriesDeleted++;
                    } else {
                        const fileSize = stat.size;
                        await fs.unlink(filePath);
                        stats.filesDeleted++;
                        stats.bytesFreed += fileSize;
                    }
                }
            } catch (error) {
                stats.errors++;
                logger.debug(`Failed to process ${filePath}:`, error);
            }
        }
    } catch (error) {
        logger.debug(`Failed to read directory ${dirPath}:`, error);
        stats.errors++;
    }

    return stats;
}

export async function cleanupOldSessions(codeDir: string, outputDir: string, maxAgeMs: number): Promise<CleanupStats> {
    const totalStats: CleanupStats = {
        filesDeleted: 0,
        directoriesDeleted: 0,
        bytesFreed: 0,
        errors: 0
    };

    const codeStats = await cleanupOldFiles(codeDir, maxAgeMs, '.*_(code|input)(\\..*)?$');
    totalStats.filesDeleted += codeStats.filesDeleted;
    totalStats.bytesFreed += codeStats.bytesFreed;
    totalStats.errors += codeStats.errors;

    const outputStats = await cleanupOldFiles(outputDir, maxAgeMs);
    totalStats.directoriesDeleted += outputStats.directoriesDeleted;
    totalStats.filesDeleted += outputStats.filesDeleted;
    totalStats.bytesFreed += outputStats.bytesFreed;
    totalStats.errors += outputStats.errors;

    return totalStats;
}

export async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath, file);

            try {
                const stat = await fs.stat(filePath);
                if (stat.isDirectory()) {
                    totalSize += await getDirectorySize(filePath);
                } else {
                    totalSize += stat.size;
                }
            } catch {}
        }
    } catch {}

    return totalSize;
}

export async function getDirectoryCount(dirPath: string): Promise<{ files: number; directories: number }> {
    let files = 0;
    let directories = 0;

    try {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);

            try {
                const stat = await fs.stat(itemPath);
                if (stat.isDirectory()) {
                    directories++;
                    const subCount = await getDirectoryCount(itemPath);
                    files += subCount.files;
                    directories += subCount.directories;
                } else {
                    files++;
                }
            } catch {}
        }
    } catch {}

    return { files, directories };
}
