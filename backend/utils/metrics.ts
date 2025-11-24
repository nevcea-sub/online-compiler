import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { executionQueue } from '../execution/executionQueue';
import { executionCache } from './cache';
import { getResourceStats } from './resourceMonitor';

const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

export const httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

export const codeExecutionTotal = new Counter({
    name: 'code_executions_total',
    help: 'Total number of code executions',
    labelNames: ['language', 'status']
});

export const codeExecutionDuration = new Histogram({
    name: 'code_execution_duration_seconds',
    help: 'Duration of code executions in seconds',
    labelNames: ['language'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

export const codeExecutionErrors = new Counter({
    name: 'code_execution_errors_total',
    help: 'Total number of code execution errors',
    labelNames: ['language', 'error_type']
});

export const executionQueueSize = new Gauge({
    name: 'execution_queue_size',
    help: 'Current size of execution queue'
});

export const executionQueueRunning = new Gauge({
    name: 'execution_queue_running',
    help: 'Current number of running executions'
});

export const cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits'
});

export const cacheMisses = new Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses'
});

export const cacheSize = new Gauge({
    name: 'cache_size',
    help: 'Current cache size'
});

export const memoryUsage = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type']
});

export const diskUsage = new Gauge({
    name: 'disk_usage_bytes',
    help: 'Disk usage in bytes',
    labelNames: ['directory', 'type']
});

export const diskFileCount = new Gauge({
    name: 'disk_file_count',
    help: 'Number of files on disk',
    labelNames: ['directory', 'type']
});

export const rateLimitHits = new Counter({
    name: 'rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['limiter_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(codeExecutionTotal);
register.registerMetric(codeExecutionDuration);
register.registerMetric(codeExecutionErrors);
register.registerMetric(executionQueueSize);
register.registerMetric(executionQueueRunning);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(cacheSize);
register.registerMetric(memoryUsage);
register.registerMetric(diskUsage);
register.registerMetric(diskFileCount);
register.registerMetric(rateLimitHits);

let metricsUpdateInterval: NodeJS.Timeout | null = null;

export function startMetricsCollection(): void {
    if (metricsUpdateInterval) {
        return;
    }

    metricsUpdateInterval = setInterval(async () => {
        try {
            const queueStatus = executionQueue.getStatus();
            executionQueueSize.set(queueStatus.queued);
            executionQueueRunning.set(queueStatus.running);

            const cacheStats = executionCache.getStats();
            cacheSize.set(cacheStats.size);

            const resourceStats = await getResourceStats();
            memoryUsage.set({ type: 'heap_used' }, resourceStats.memory.used);
            memoryUsage.set({ type: 'heap_total' }, resourceStats.memory.total);
            memoryUsage.set({ type: 'rss' }, resourceStats.memory.rss);
            memoryUsage.set({ type: 'external' }, resourceStats.memory.external);

            if (resourceStats.disk) {
                diskUsage.set({ directory: 'code', type: 'size' }, resourceStats.disk.codeDir.size);
                diskUsage.set({ directory: 'output', type: 'size' }, resourceStats.disk.outputDir.size);
                diskFileCount.set({ directory: 'code', type: 'files' }, resourceStats.disk.codeDir.files);
                diskFileCount.set({ directory: 'code', type: 'directories' }, resourceStats.disk.codeDir.directories);
                diskFileCount.set({ directory: 'output', type: 'files' }, resourceStats.disk.outputDir.files);
                diskFileCount.set({ directory: 'output', type: 'directories' }, resourceStats.disk.outputDir.directories);
            }
        } catch (error) {
            console.error('[METRICS] Error updating metrics:', error);
        }
    }, 5000);
}

export function stopMetricsCollection(): void {
    if (metricsUpdateInterval) {
        clearInterval(metricsUpdateInterval);
        metricsUpdateInterval = null;
    }
}

export function getMetrics(): Promise<string> {
    return register.metrics();
}

export { register };

