import http from 'http';
import { performance } from 'perf_hooks';

interface ApiBenchmarkResult {
    endpoint: string;
    method: string;
    requests: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    medianTime: number;
    p95Time: number;
    p99Time: number;
    requestsPerSecond: number;
    successCount: number;
    errorCount: number;
    statusCodes: Record<number, number>;
    successOnlyStats?: {
        averageTime: number;
        medianTime: number;
        p95Time: number;
        p99Time: number;
        requestsPerSecond: number;
    };
    cacheStats?: {
        hits: number;
        misses: number;
        hitRate: number;
    };
}

async function makeRequest(
    options: http.RequestOptions,
    data?: string,
    timeout: number = 5000
): Promise<{ statusCode: number; time: number; error?: Error; body?: any }> {
    const start = performance.now();
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            const end = performance.now();
            let body = '';
            res.on('data', (chunk) => {
                body += chunk.toString();
            });
            res.on('end', () => {
                let parsedBody: any = null;
                try {
                    if (body) {
                        parsedBody = JSON.parse(body);
                    }
                } catch {
                }
                resolve({
                    statusCode: res.statusCode || 0,
                    time: end - start,
                    body: parsedBody
                });
            });
        });

        req.on('error', (error) => {
            const end = performance.now();
            resolve({
                statusCode: 0,
                time: end - start,
                error
            });
        });

        req.setTimeout(timeout, () => {
            req.destroy();
            const end = performance.now();
            resolve({
                statusCode: 0,
                time: end - start,
                error: new Error('Request timeout')
            });
        });

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

async function checkServerConnection(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port,
            path: '/api/health',
            method: 'GET',
            timeout: 2000
        }, (res) => {
            resolve(true);
            res.on('data', () => {});
            res.on('end', () => {});
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

function calculatePercentile(sortedTimes: number[], percentile: number): number {
    if (sortedTimes.length === 0) {
        return 0;
    }
    const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1;
    return sortedTimes[Math.max(0, index)];
}

async function benchmarkEndpoint(
    endpoint: string,
    method: string = 'GET',
    data?: string,
    requests: number = 100,
    port: number = 4000,
    delayMs: number = 0,
    generateUniqueData?: (index: number) => string,
    timeout: number = 5000
): Promise<ApiBenchmarkResultWithErrors> {
    const times: number[] = [];
    const successTimes: number[] = [];
    const statusCodes: Record<number, number> = {};
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    const options: http.RequestOptions = {
        hostname: 'localhost',
        port,
        path: endpoint,
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Benchmark': 'true'
        }
    };

    console.log(`Benchmarking ${method} ${endpoint} (${requests} requests${delayMs > 0 ? `, ${delayMs}ms delay between requests` : ''})...`);

    for (let i = 0; i < requests; i++) {
        if (i > 0 && delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        let requestData = data;
        if (generateUniqueData && data) {
            try {
                const baseData = JSON.parse(data);
                const uniqueData = JSON.parse(generateUniqueData(i));
                requestData = JSON.stringify({ ...baseData, ...uniqueData });
            } catch {
                requestData = data;
            }
        }

        if (requestData) {
            options.headers = {
                ...options.headers,
                'Content-Length': Buffer.byteLength(requestData)
            };
        } else {
            options.headers = {
                ...options.headers,
                'Content-Length': 0
            };
        }

        const result = await makeRequest(options, requestData, timeout);
        times.push(result.time);

        if (result.statusCode > 0) {
            statusCodes[result.statusCode] = (statusCodes[result.statusCode] || 0) + 1;
            if (result.statusCode >= 200 && result.statusCode < 300) {
                successCount++;
                successTimes.push(result.time);

                if (result.body && typeof result.body === 'object') {
                    if (result.body.cached === true) {
                        cacheHits++;
                    } else if (result.body.cached === false || result.body.cached === undefined) {
                        cacheMisses++;
                    }
                }
            } else {
                errorCount++;
            }
        } else {
            errorCount++;
            if (result.error && errors.length < 5) {
                const errorMsg = result.error.message || result.error.toString();
                if (!errors.includes(errorMsg)) {
                    errors.push(errorMsg);
                }
            }
        }
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / requests;
    const sortedTimes = [...times].sort((a, b) => a - b);
    const minTime = sortedTimes[0] || 0;
    const maxTime = sortedTimes[sortedTimes.length - 1] || 0;
    const medianTime = calculatePercentile(sortedTimes, 50);
    const p95Time = calculatePercentile(sortedTimes, 95);
    const p99Time = calculatePercentile(sortedTimes, 99);
    const requestsPerSecond = 1000 / averageTime;

    let successOnlyStats: ApiBenchmarkResult['successOnlyStats'] | undefined;
    if (successTimes.length > 0) {
        const sortedSuccessTimes = [...successTimes].sort((a, b) => a - b);
        const successAverage = successTimes.reduce((sum, time) => sum + time, 0) / successTimes.length;
        successOnlyStats = {
            averageTime: successAverage,
            medianTime: calculatePercentile(sortedSuccessTimes, 50),
            p95Time: calculatePercentile(sortedSuccessTimes, 95),
            p99Time: calculatePercentile(sortedSuccessTimes, 99),
            requestsPerSecond: 1000 / successAverage
        };
    }

    let cacheStats: ApiBenchmarkResult['cacheStats'] | undefined;
    const totalCacheRequests = cacheHits + cacheMisses;
    if (totalCacheRequests > 0) {
        cacheStats = {
            hits: cacheHits,
            misses: cacheMisses,
            hitRate: (cacheHits / totalCacheRequests) * 100
        };
    }

    return {
        endpoint,
        method,
        requests,
        totalTime,
        averageTime,
        minTime,
        maxTime,
        medianTime,
        p95Time,
        p99Time,
        requestsPerSecond,
        successCount,
        errorCount,
        statusCodes,
        successOnlyStats,
        cacheStats,
        errors: errors.length > 0 ? errors : undefined
    };
}

interface ApiBenchmarkResultWithErrors extends ApiBenchmarkResult {
    errors?: string[];
}

function formatApiResult(result: ApiBenchmarkResultWithErrors): string {
    let output = `
${result.method} ${result.endpoint}:
  Requests: ${result.requests}
  Total Time: ${result.totalTime.toFixed(2)}ms
  Success: ${result.successCount} (${((result.successCount / result.requests) * 100).toFixed(1)}%)
  Errors: ${result.errorCount} (${((result.errorCount / result.requests) * 100).toFixed(1)}%)
  Status Codes: ${JSON.stringify(result.statusCodes, null, 2)}
  
  Response Times (all requests):
    Average: ${result.averageTime.toFixed(4)}ms
    Median (p50): ${result.medianTime.toFixed(4)}ms
    p95: ${result.p95Time.toFixed(4)}ms
    p99: ${result.p99Time.toFixed(4)}ms
    Min: ${result.minTime.toFixed(4)}ms
    Max: ${result.maxTime.toFixed(4)}ms
    Requests/Second: ${result.requestsPerSecond.toFixed(2)}`;

    if (result.successOnlyStats && result.errorCount > 0) {
        output += `
  
  Response Times (successful requests only):
    Average: ${result.successOnlyStats.averageTime.toFixed(4)}ms
    Median (p50): ${result.successOnlyStats.medianTime.toFixed(4)}ms
    p95: ${result.successOnlyStats.p95Time.toFixed(4)}ms
    p99: ${result.successOnlyStats.p99Time.toFixed(4)}ms
    Requests/Second: ${result.successOnlyStats.requestsPerSecond.toFixed(2)}`;
    }

    if (result.errors && result.errors.length > 0) {
        output += `\n  Error Messages: ${result.errors.join(', ')}`;
    }

    if (result.statusCodes[429]) {
        output += `\n  Rate limit hit: ${result.statusCodes[429]} requests returned 429 (Too Many Requests)`;
    }

    if (result.cacheStats) {
        output += `\n  Cache Stats:
    Hits: ${result.cacheStats.hits} (${result.cacheStats.hitRate.toFixed(1)}%)
    Misses: ${result.cacheStats.misses} (${(100 - result.cacheStats.hitRate).toFixed(1)}%)`;
    }

    return output;
}

function calculateRateLimitDelay(requestsPerMinute: number): number {
    if (requestsPerMinute <= 0) {
        return 0;
    }
    return Math.ceil((60 * 1000) / requestsPerMinute);
}

async function runApiBenchmarks(port: number = 4000, respectRateLimit: boolean = true, bypassCache: boolean = false): Promise<void> {
    console.log('Starting API benchmarks...\n');
    console.log('Make sure the server is running on port', port, '\n');

    const isConnected = await checkServerConnection(port);
    if (!isConnected) {
        console.error(`\n ERROR: Cannot connect to server on port ${port}`);
        console.error('Please make sure the server is running before running benchmarks.');
        console.error('Start the server with: npm start (in the backend directory)\n');
        process.exit(1);
    }
    console.log(`Server connection verified on port ${port}\n`);

    if (respectRateLimit) {
        console.log('Rate limit aware mode: Adding delays to avoid 429 errors');
    }
    if (bypassCache) {
        console.log('Cache bypass mode: Using unique code for each request\n');
    } else {
        console.log();
    }

    const results: ApiBenchmarkResultWithErrors[] = [];

    const healthRateLimit = 60;
    const healthDelay = respectRateLimit ? calculateRateLimitDelay(healthRateLimit) : 0;
    console.log('Benchmarking /api/health...');
    console.log(`  Rate limit: ${healthRateLimit} requests/minute (${healthDelay}ms delay)`);
    results.push(await benchmarkEndpoint('/api/health', 'GET', undefined, 60, port, healthDelay));

    console.log('\nBenchmarking /metrics...');
    console.log('  Rate limit: None');
    results.push(await benchmarkEndpoint('/metrics', 'GET', undefined, 100, port, 0));

    const baseExecutePayload = JSON.stringify({
        code: 'print("hello")',
        language: 'python',
        input: ''
    });

    const executeRateLimit = 20;
    const executeDelay = respectRateLimit ? calculateRateLimitDelay(executeRateLimit) : 0;
    console.log('\nBenchmarking /api/execute...');
    console.log(`  Rate limit: ${executeRateLimit} requests/minute (${executeDelay}ms delay)`);
    const executeTimeout = 300000;
    if (bypassCache) {
        console.log('  Cache: Bypassed (unique code per request)');
        const uniqueCodeGenerator = (index: number) => {
            return JSON.stringify({
                code: `print("hello_${index}_${Date.now()}")`,
                language: 'python',
                input: ''
            });
        };
        results.push(await benchmarkEndpoint('/api/execute', 'POST', baseExecutePayload, 10, port, executeDelay, uniqueCodeGenerator, executeTimeout));
    } else {
        console.log('  Cache: Enabled (same code, may hit cache)');
        results.push(await benchmarkEndpoint('/api/execute', 'POST', baseExecutePayload, 10, port, executeDelay, undefined, executeTimeout));
    }

    console.log('\n=== API Benchmark Results ===\n');
    results.forEach(result => {
        console.log(formatApiResult(result));
    });
}

if (require.main === module) {
    const port = parseInt(process.env.PORT || '4000', 10);
    const respectRateLimit = process.env.RESPECT_RATE_LIMIT !== 'false';
    const bypassCache = process.env.BYPASS_CACHE === 'true';
    runApiBenchmarks(port, respectRateLimit, bypassCache)
        .then(() => {
            console.log('\nAPI benchmarks completed!');
            if (!respectRateLimit) {
                console.log('\nTip: Set RESPECT_RATE_LIMIT=false to disable rate limit delays');
            }
            if (!bypassCache) {
                console.log('Tip: Set BYPASS_CACHE=true to test with cache misses');
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('API benchmark error:', error);
            process.exit(1);
        });
}

export { benchmarkEndpoint, runApiBenchmarks };

