import type { TranslationKey } from '../i18n/translations';

interface BenchmarkResult {
    name: string;
    iterations: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    opsPerSecond: number;
}

function formatResult(result: BenchmarkResult): void {
    console.log(`\n${result.name}:`);
    console.table({
        'Iterations': result.iterations,
        'Total Time (ms)': parseFloat(result.totalTime.toFixed(2)),
        'Avg Time (ms)': parseFloat(result.averageTime.toFixed(4)),
        'Min Time (ms)': parseFloat(result.minTime.toFixed(4)),
        'Max Time (ms)': parseFloat(result.maxTime.toFixed(4)),
        'Ops/Sec': parseFloat(result.opsPerSecond.toFixed(2))
    });
}

async function benchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 1000
): Promise<BenchmarkResult> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / averageTime;

    return {
        name,
        iterations,
        totalTime,
        averageTime,
        minTime,
        maxTime,
        opsPerSecond
    };
}

async function runFormatBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const { formatOutput, formatError } = await import('../utils/outputFormatter');

    const testOutput = 'line1\nline2\nline3';
    const testError = 'Error: ' + 'x'.repeat(500);
    const longOutput = 'line\n'.repeat(1000);
    const debugOutput = '[DEBUG] Start\nActual output\nDEBUG: End';

    results.push(await benchmark('formatOutput (normal)', () => {
        formatOutput(testOutput);
        formatOutput('  \n  test  \n  ');
    }, 10000));

    results.push(await benchmark('formatOutput (long)', () => {
        formatOutput(longOutput);
    }, 5000));

    results.push(await benchmark('formatOutput (with debug)', () => {
        formatOutput(debugOutput);
    }, 10000));

    results.push(await benchmark('formatOutput (empty)', () => {
        formatOutput('');
        formatOutput(null as any);
        formatOutput(undefined as any);
    }, 10000));

    results.push(await benchmark('formatError (normal)', () => {
        formatError(testError);
        formatError('short error');
    }, 10000));

    results.push(await benchmark('formatError (long)', () => {
        formatError('Error: ' + 'x'.repeat(5000));
    }, 5000));

    results.push(await benchmark('formatError (empty)', () => {
        formatError('');
        formatError(null as any);
        formatError(undefined as any);
    }, 10000));

    return results;
}

async function runTranslationBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const { getTranslation, mapServerErrorMessage } = await import('../i18n/translations');

    results.push(await benchmark('getTranslation (ko)', () => {
        getTranslation('title', 'ko');
        getTranslation('run', 'ko');
        getTranslation('clear', 'ko');
        getTranslation('execution-time', 'ko');
    }, 10000));

    results.push(await benchmark('getTranslation (en)', () => {
        getTranslation('title', 'en');
        getTranslation('run', 'en');
        getTranslation('clear', 'en');
        getTranslation('execution-time', 'en');
    }, 10000));

    results.push(await benchmark('getTranslation (missing key)', () => {
        getTranslation('nonexistent-key' as any, 'ko');
        getTranslation('another-missing' as any, 'en');
    }, 10000));

    results.push(await benchmark('mapServerErrorMessage (docker errors)', () => {
        mapServerErrorMessage('Docker가 실행되지 않았습니다');
        mapServerErrorMessage('Docker is not running');
        mapServerErrorMessage('Docker 이미지를 찾을 수 없습니다');
    }, 10000));

    results.push(await benchmark('mapServerErrorMessage (execution errors)', () => {
        mapServerErrorMessage('실행 시간이 초과되었습니다');
        mapServerErrorMessage('execution timeout exceeded');
        mapServerErrorMessage('실행 중 오류가 발생했습니다');
    }, 10000));

    results.push(await benchmark('mapServerErrorMessage (no match)', () => {
        mapServerErrorMessage('Some random error message');
        mapServerErrorMessage('');
    }, 10000));

    return results;
}

async function runErrorHandlerBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const { extractErrorMessage } = await import('../utils/errorHandler');
    const { getTranslation } = await import('../i18n/translations');

    const t = (key: TranslationKey) => getTranslation(key, 'ko');

    results.push(await benchmark('extractErrorMessage (HTTP errors)', () => {
        extractErrorMessage(new Error('HTTP 400: Bad Request from server'), t);
        extractErrorMessage(new Error('HTTP 500: Internal Server Error'), t);
    }, 10000));

    results.push(await benchmark('extractErrorMessage (network errors)', () => {
        extractErrorMessage(new Error('Failed to fetch'), t);
        extractErrorMessage(new Error('NetworkError'), t);
        extractErrorMessage(new Error('Request timed out'), t);
    }, 10000));

    results.push(await benchmark('extractErrorMessage (status codes)', () => {
        extractErrorMessage(new Error('HTTP 400'), t);
        extractErrorMessage(new Error('HTTP 500'), t);
    }, 10000));

    results.push(await benchmark('extractErrorMessage (non-Error)', () => {
        extractErrorMessage(null, t);
        extractErrorMessage(undefined, t);
        extractErrorMessage('string error', t);
    }, 10000));

    results.push(await benchmark('extractErrorMessage (generic)', () => {
        extractErrorMessage(new Error('Some other error'), t);
        extractErrorMessage(new Error('Unknown error occurred'), t);
    }, 10000));

    return results;
}

async function runAllBenchmarks(): Promise<void> {
    console.log('Starting frontend benchmarks...\n');

    const allResults: BenchmarkResult[] = [];

    console.log('Running format benchmarks...');
    allResults.push(...await runFormatBenchmarks());

    console.log('Running translation benchmarks...');
    allResults.push(...await runTranslationBenchmarks());

    console.log('Running error handler benchmarks...');
    allResults.push(...await runErrorHandlerBenchmarks());

    console.log('\n=== Benchmark Results ===\n');
    allResults.forEach(result => {
        formatResult(result);
    });

    const totalOps = allResults.reduce((sum, r) => sum + r.opsPerSecond, 0);
    const avgOps = totalOps / allResults.length;
    console.log(`\nAverage Operations/Second: ${avgOps.toFixed(2)}`);
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('__benchmarks__')) {
    runAllBenchmarks()
        .then(() => {
            console.log('\nBenchmarks completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Benchmark error:', error);
            process.exit(1);
        });
}

export { benchmark, runAllBenchmarks };

