import { Request, Response } from 'express';
import { executionQueue } from '../execution/executionQueue';
import { getResourceStats, formatBytes, formatUptime } from '../utils/resourceMonitor';

export function healthRoute(_: Request, res: Response): void {
    const queueStatus = executionQueue.getStatus();
    const resourceStats = getResourceStats();

    res.json({
        status: 'ok',
        queue: queueStatus,
        resources: {
            memory: {
                used: formatBytes(resourceStats.memory.used),
                total: formatBytes(resourceStats.memory.total),
                percentage: resourceStats.memory.percentage
            },
            uptime: formatUptime(resourceStats.uptime)
        },
        timestamp: new Date().toISOString()
    });
}

