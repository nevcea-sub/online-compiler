import { executionCache } from '../utils/cache';
import { executionQueue } from '../execution/executionQueue';
import { validateLanguage, sanitizeCode, validateJavaClass, validateImage } from '../utils/validation';
import { normalizePath, validatePath, convertToDockerPath, getContainerCodePath, validateDockerPath } from '../utils/pathUtils';
import { filterDockerMessages, sanitizeError, sanitizeErrorForUser } from '../utils/errorHandling';
import { formatBytes, formatUptime, getResourceStats } from '../utils/resourceMonitor';
import { OutputCollector } from '../execution/outputCollector';

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

async function runValidationBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const validJavaCode = 'public class Main { public static void main(String[] args) {} }';

    results.push(await benchmark('validateLanguage (valid)', () => {
        validateLanguage('python');
        validateLanguage('javascript');
        validateLanguage('java');
        validateLanguage('cpp');
    }, 10000));

    results.push(await benchmark('validateLanguage (invalid)', () => {
        validateLanguage('invalid');
        validateLanguage('cobol');
        validateLanguage('');
    }, 10000));

    results.push(await benchmark('validateImage (valid)', () => {
        validateImage('python:3.11');
        validateImage('node:18');
        validateImage('openjdk:17');
    }, 10000));

    results.push(await benchmark('validateImage (invalid)', () => {
        validateImage('invalid:tag');
        validateImage('');
    }, 10000));

    results.push(await benchmark('sanitizeCode (safe)', () => {
        sanitizeCode('print("hello")');
        sanitizeCode('console.log("test")');
        sanitizeCode('System.out.println("test");');
    }, 5000));

    results.push(await benchmark('sanitizeCode (dangerous)', () => {
        try { sanitizeCode('rm -rf /'); } catch {}
        try { sanitizeCode('import os; os.system("rm -rf /")'); } catch {}
    }, 5000));

    results.push(await benchmark('validateJavaClass (valid)', () => {
        validateJavaClass(validJavaCode);
        validateJavaClass('public class Test { }');
    }, 5000));

    results.push(await benchmark('validateJavaClass (invalid)', () => {
        try { validateJavaClass('class Invalid {}'); } catch {}
        try { validateJavaClass('public class Test {} // File: Wrong.java'); } catch {}
    }, 5000));

    return results;
}

async function runPathUtilsBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const containerCodePaths: Record<string, string> = {
        python: '/tmp/code.py',
        javascript: '/tmp/code.js',
        java: '/tmp/Main.java'
    };

    results.push(await benchmark('normalizePath', () => {
        normalizePath('/tmp/code/file.py');
        normalizePath('C:\\Users\\test\\file.py');
        normalizePath('/tmp//code///file.py');
        normalizePath('');
    }, 10000));

    results.push(await benchmark('validatePath', () => {
        validatePath('/tmp/code/file.py');
        validatePath('/tmp/../etc/passwd');
        validatePath('../../../etc/passwd');
    }, 10000));

    results.push(await benchmark('convertToDockerPath', () => {
        convertToDockerPath('/tmp/code/file.py');
        convertToDockerPath('C:\\Users\\test\\file.py');
        convertToDockerPath('/tmp/code');
    }, 10000));

    results.push(await benchmark('getContainerCodePath', () => {
        getContainerCodePath('python', '.py', containerCodePaths);
        getContainerCodePath('javascript', '.js', containerCodePaths);
        getContainerCodePath('unknown', '.txt', containerCodePaths);
    }, 10000));

    results.push(await benchmark('validateDockerPath', () => {
        validateDockerPath('/tmp/code');
        validateDockerPath('invalid');
        validateDockerPath('');
    }, 10000));

    return results;
}

async function runErrorHandlingBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    const dockerError = 'docker: Error response from daemon: Cannot connect to the Docker daemon';
    const longError = 'Error: ' + 'x'.repeat(1000);

    results.push(await benchmark('filterDockerMessages', () => {
        filterDockerMessages(dockerError);
        filterDockerMessages('normal output');
    }, 5000));

    results.push(await benchmark('sanitizeError', () => {
        sanitizeError(dockerError);
        sanitizeError(longError);
    }, 5000));

    results.push(await benchmark('sanitizeErrorForUser', () => {
        sanitizeErrorForUser(dockerError);
        sanitizeErrorForUser(longError);
    }, 5000));

    return results;
}

async function runCacheBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    const testCode = 'print("hello")';
    const testLanguage = 'python';
    const testInput = '';

    executionCache.set(testCode, testLanguage, testInput, {
        output: 'hello',
        error: '',
        executionTime: 100,
        images: []
    });

    results.push(await benchmark('cache.get (hit)', () => {
        executionCache.get(testCode, testLanguage, testInput);
    }, 10000));

    results.push(await benchmark('cache.get (miss)', () => {
        executionCache.get('different code', testLanguage, testInput);
    }, 10000));

    results.push(await benchmark('cache.set', () => {
        executionCache.set(`code_${Math.random()}`, testLanguage, testInput, {
            output: 'test',
            error: '',
            executionTime: 50,
            images: []
        });
    }, 5000));

    results.push(await benchmark('cache.getStats', () => {
        executionCache.getStats();
    }, 10000));

    return results;
}

async function runQueueBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    results.push(await benchmark('queue.getStatus', () => {
        executionQueue.getStatus();
    }, 10000));

    results.push(await benchmark('queue.getQueueSize', () => {
        executionQueue.getQueueSize();
    }, 10000));

    results.push(await benchmark('queue.getRunningCount', () => {
        executionQueue.getRunningCount();
    }, 10000));

    results.push(await benchmark('queue.getRunningCountByLanguage', () => {
        executionQueue.getRunningCountByLanguage('python');
        executionQueue.getRunningCountByLanguage('javascript');
    }, 10000));

    return results;
}

async function runResourceMonitorBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    results.push(await benchmark('formatBytes', () => {
        formatBytes(0);
        formatBytes(1024);
        formatBytes(1024 * 1024);
        formatBytes(1024 * 1024 * 1024);
        formatBytes(1024 * 1024 * 1024 * 1024);
    }, 10000));

    results.push(await benchmark('formatUptime', () => {
        formatUptime(0);
        formatUptime(1000);
        formatUptime(60000);
        formatUptime(3600000);
        formatUptime(86400000);
    }, 10000));

    results.push(await benchmark('getResourceStats', async () => {
        await getResourceStats();
    }, 100));

    return results;
}

async function runOutputCollectorBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const maxBytes = 1024 * 1024;
    const testData = 'x'.repeat(100);

    results.push(await benchmark('OutputCollector.addStdout', () => {
        const collector = new OutputCollector(maxBytes);
        collector.addStdout(testData);
        collector.addStdout(Buffer.from(testData));
    }, 10000));

    results.push(await benchmark('OutputCollector.addStderr', () => {
        const collector = new OutputCollector(maxBytes);
        collector.addStderr(testData);
        collector.addStderr(Buffer.from(testData));
    }, 10000));

    results.push(await benchmark('OutputCollector.getFinalOutput', () => {
        const collector = new OutputCollector(maxBytes);
        collector.addStdout('stdout test');
        collector.addStderr('stderr test');
        collector.getFinalOutput();
    }, 10000));

    results.push(await benchmark('OutputCollector (truncation)', () => {
        const collector = new OutputCollector(100);
        collector.addStdout('x'.repeat(200));
        collector.getFinalOutput();
    }, 5000));

    return results;
}

async function runAllBenchmarks(): Promise<void> {
    console.log('Starting benchmarks...\n');

    const allResults: BenchmarkResult[] = [];

    console.log('Running validation benchmarks...');
    allResults.push(...await runValidationBenchmarks());

    console.log('Running path utils benchmarks...');
    allResults.push(...await runPathUtilsBenchmarks());

    console.log('Running error handling benchmarks...');
    allResults.push(...await runErrorHandlingBenchmarks());

    console.log('Running cache benchmarks...');
    allResults.push(...await runCacheBenchmarks());

    console.log('Running queue benchmarks...');
    allResults.push(...await runQueueBenchmarks());

    console.log('Running resource monitor benchmarks...');
    allResults.push(...await runResourceMonitorBenchmarks());

    console.log('Running output collector benchmarks...');
    allResults.push(...await runOutputCollectorBenchmarks());

    console.log('\n=== Benchmark Results ===\n');
    allResults.forEach(result => {
        formatResult(result);
    });

    const totalOps = allResults.reduce((sum, r) => sum + r.opsPerSecond, 0);
    const avgOps = totalOps / allResults.length;
    console.log(`\nAverage Operations/Second: ${avgOps.toFixed(2)}`);
}

if (require.main === module) {
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

