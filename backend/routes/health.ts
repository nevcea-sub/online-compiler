import { Request, Response } from 'express';
import { executionQueue } from '../execution/executionQueue';
import { getResourceStats, formatBytes, formatUptime } from '../utils/resourceMonitor';
import { executionCache } from '../utils/cache';

const INCLUDE_DISK_STATS = process.env.HEALTH_INCLUDE_DISK_STATS !== 'false';
let diskStatsCache: { stats: any; timestamp: number } | null = null;
const DISK_STATS_CACHE_TTL = 5000;

export async function healthRoute(_: Request, res: Response): Promise<void> {
    const queueStatus = executionQueue.getStatus();
    const cacheStats = executionCache.getStats();

    let resourceStats;
    if (INCLUDE_DISK_STATS) {
        const now = Date.now();
        if (diskStatsCache && now - diskStatsCache.timestamp < DISK_STATS_CACHE_TTL) {
            resourceStats = diskStatsCache.stats;
        } else {
            resourceStats = await getResourceStats();
            diskStatsCache = { stats: resourceStats, timestamp: now };
        }
    } else {
        resourceStats = await getResourceStats();
    }

    const response: any = {
        status: 'ok',
        queue: queueStatus,
        cache: {
            enabled: true,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            hitRate: `${(cacheStats.hitRate * 100).toFixed(2)}%`,
            size: cacheStats.size,
            evictions: cacheStats.evictions,
            totalRequests: cacheStats.totalRequests
        },
        resources: {
            memory: {
                used: formatBytes(resourceStats.memory.used),
                total: formatBytes(resourceStats.memory.total),
                percentage: resourceStats.memory.percentage,
                rss: formatBytes(resourceStats.memory.rss),
                external: formatBytes(resourceStats.memory.external)
            },
            uptime: formatUptime(resourceStats.uptime)
        },
        timestamp: new Date().toISOString()
    };

    if (resourceStats.disk) {
        response.resources.disk = {
            codeDir: {
                size: formatBytes(resourceStats.disk.codeDir.size),
                files: resourceStats.disk.codeDir.files,
                directories: resourceStats.disk.codeDir.directories
            },
            outputDir: {
                size: formatBytes(resourceStats.disk.outputDir.size),
                files: resourceStats.disk.outputDir.files,
                directories: resourceStats.disk.outputDir.directories
            }
        };
    }

    res.json(response);
}

