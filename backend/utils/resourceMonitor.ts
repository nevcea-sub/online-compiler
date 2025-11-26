import { getDirectorySize, getDirectoryCount } from './resourceCleanup';

interface ResourceStats {
    memory: {
        used: number;
        total: number;
        percentage: number;
        rss: number;
        external: number;
    };
    uptime: number;
    timestamp: number;
    disk?: {
        codeDir: {
            size: number;
            files: number;
            directories: number;
        };
        outputDir: {
            size: number;
            files: number;
            directories: number;
        };
    };
}

let startTime = Date.now();
let codeDir: string | null = null;
let outputDir: string | null = null;

export function setResourceMonitorPaths(codeDirPath: string, outputDirPath: string): void {
    codeDir = codeDirPath;
    outputDir = outputDirPath;
}

export async function getResourceStats(): Promise<ResourceStats> {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryPercentage = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;

    const stats: ResourceStats = {
        memory: {
            used: usedMemory,
            total: totalMemory,
            percentage: Math.round(memoryPercentage * 100) / 100,
            rss: memUsage.rss,
            external: memUsage.external || 0
        },
        uptime: Date.now() - startTime,
        timestamp: Date.now()
    };

    if (codeDir && outputDir) {
        try {
            const [codeSize, codeCount, outputSize, outputCount] = await Promise.all([
                getDirectorySize(codeDir),
                getDirectoryCount(codeDir),
                getDirectorySize(outputDir),
                getDirectoryCount(outputDir)
            ]);

            stats.disk = {
                codeDir: {
                    size: codeSize,
                    files: codeCount.files,
                    directories: codeCount.directories
                },
                outputDir: {
                    size: outputSize,
                    files: outputCount.files,
                    directories: outputCount.directories
                }
            };
        } catch {}
    }

    return stats;
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}
