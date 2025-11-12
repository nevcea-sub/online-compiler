const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_CODE_LENGTH = 100000;
const MAX_EXECUTION_TIME = 10000;
const MAX_MEMORY = '256m';
const MAX_CPU_PERCENT = '2.0';
const MAX_CPU_PERCENT_KOTLIN = '3.0';
const MAX_OUTPUT_BYTES = parseInt(process.env.MAX_OUTPUT_BYTES || '1048576', 10); // 1MB
const MAX_INPUT_LENGTH = parseInt(process.env.MAX_INPUT_LENGTH || '1000000', 10); // 1MB
const ENABLE_PRELOAD = (process.env.ENABLE_PRELOAD || 'true').toLowerCase() === 'true';
const ENABLE_WARMUP = (process.env.ENABLE_WARMUP || 'true').toLowerCase() === 'true';
const TRUST_PROXY = (process.env.TRUST_PROXY || 'false').toLowerCase() === 'true';

const codeDir = path.join(__dirname, 'code');
const outputDir = path.join(__dirname, 'output');
const toolCacheDir = path.join(__dirname, 'tool_cache');
const kotlinCacheDir = path.join(toolCacheDir, 'kotlin');
const kotlinBuildsDir = path.join(toolCacheDir, 'kotlin_builds');

app.disable('x-powered-by');
if (TRUST_PROXY) {
    app.set('trust proxy', 1);
}

async function isDockerAvailable() {
    return new Promise((resolve) => {
        exec('docker version', { timeout: 3000 }, (error) => {
            if (error) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

function kotlinCompilerExistsOnHost() {
    try {
        const p = path.join(kotlinCacheDir, 'kotlinc', 'lib', 'kotlin-compiler.jar');
        return fss.existsSync(p);
    } catch {
        return false;
    }
}

async function warmupKotlinOnStart() {
    if (kotlinCompilerExistsOnHost()) {
        return;
    }
    const image = 'eclipse-temurin:17-jdk-alpine';
    const cmd =
        'if [ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]; then cd /tmp && (busybox wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip || wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version';
    try {
        await runDockerCommand(image, cmd, '200m', 30000, true);
    } catch {
        // Ignore warmup errors
    }
}

const LANGUAGE_EXTENSIONS = {
    python: '.py',
    javascript: '.js',
    java: '.java',
    cpp: '.cpp',
    c: '.c',
    rust: '.rs',
    php: '.php',
    r: '.r',
    ruby: '.rb',
    csharp: '.cs',
    kotlin: '.kt'
};

const LANGUAGE_CONFIGS = {
    python: {
        image: 'python:3.11-slim',
        command: (path) => `python ${path}`,
        timeout: MAX_EXECUTION_TIME
    },
    javascript: {
        image: 'node:20-slim',
        command: (path) => `node ${path}`,
        timeout: MAX_EXECUTION_TIME
    },
    java: {
        image: 'eclipse-temurin:17-jdk-alpine',
        command: (path) => `javac ${path} && java -cp /tmp Main`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    cpp: {
        image: 'gcc:14',
        command: (path) => `g++ -O2 -s -o /tmp/a.out ${path} && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    c: {
        image: 'gcc:14',
        command: (path) => `gcc -O2 -s -o /tmp/a.out ${path} && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    rust: {
        image: 'rust:1.81',
        command: (path) => `rustc ${path} -o /tmp/a.out && chmod +x /tmp/a.out && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 3
    },
    php: {
        image: 'php:8.3-alpine',
        command: (path) => `php ${path}`,
        timeout: MAX_EXECUTION_TIME
    },
    r: {
        image: 'r-base:4.4.1',
        command: (path) => `Rscript ${path}`,
        timeout: MAX_EXECUTION_TIME
    },
    ruby: {
        image: 'ruby:3.3-alpine',
        command: (path) => `ruby ${path}`,
        timeout: MAX_EXECUTION_TIME
    },
    csharp: {
        image: 'mcr.microsoft.com/dotnet/sdk:8.0',
        command: (path) =>
            `cd /tmp && dotnet new console -n Program --force && cp ${path} Program/Program.cs && cd Program && dotnet run --no-restore`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    kotlin: {
        image: 'eclipse-temurin:17-jdk-alpine',
        command: (path, buildDir) =>
            `export JAVA_TOOL_OPTIONS="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xms32m -Xmx256m"; if [ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]; then cd /tmp && (busybox wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip || wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin; fi; mkdir -p ${buildDir}/out; if [ ! -f ${buildDir}/out/CodeKt.class ]; then java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -d ${buildDir}/out ${path}; fi; java -cp "${buildDir}/out:/opt/kotlin/kotlinc/lib/*" CodeKt`,
        timeout: MAX_EXECUTION_TIME * 3
    }
};

const ALLOWED_LANGUAGES = Object.keys(LANGUAGE_EXTENSIONS);
const ALLOWED_IMAGES = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);

const DANGEROUS_PATTERNS = [
    /rm\s+-rf/gi,
    /mkfs/gi,
    /dd\s+if=/gi,
    /mkfs\./gi,
    /\/dev\/sd/gi,
    /fdisk/gi,
    /format\s+c:/gi,
    /del\s+\/f/gi,
    /shutdown/gi,
    /reboot/gi,
    /halt/gi,
    /poweroff/gi,
    /docker/gi,
    /sudo/gi,
    /su\s/gi,
    /chmod\s+[0-9]{3,4}/gi,
    /chown/gi,
    /mount/gi,
    /umount/gi
];

const DOCKER_PULL_MESSAGES = [
    'unable to find image',
    'pulling from',
    'pulling fs layer',
    'pull complete',
    'download complete',
    'already exists',
    'digest:',
    'status: downloaded',
    'status: image is up to date'
];

const INPUT_ERROR_PATTERNS = [
    /EOF when reading a line/i,
    /NoSuchElementException.*No line found/i,
    /No line found/i
];

const ENTRYPOINT_ERROR_PATTERNS = [
    /can't find '__main__' module/i,
    /Main method not found in class/i,
    /no main manifest attribute/i,
    /undefined reference to `main'/i,
    /Cannot find module/i
];

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const devLocalhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        const isNullOrigin = origin === 'null';
        const isLocalhost = devLocalhostRegex.test(origin);
        const allowInDev = !isProduction && (isLocalhost || isNullOrigin);

        if (allowedOrigins.length > 0) {
            if (allowedOrigins.includes(origin) || allowInDev) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'), false);
        }

        if (allowInDev) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin || '';
        let allowed = false;
        if (!origin) {
            allowed = true;
        } else if (allowedOrigins.length > 0) {
            allowed =
                allowedOrigins.includes(origin) ||
                (!isProduction && origin === 'null') ||
                (!isProduction && devLocalhostRegex.test(origin));
        } else if (!isProduction && (devLocalhostRegex.test(origin) || origin === 'null')) {
            allowed = true;
        }
        if (!allowed) {
            return res.status(403).send('Not allowed by CORS');
        }
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header(
            'Access-Control-Allow-Headers',
            req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
        );
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json({ limit: '10mb' }));

const executeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Too many execution requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const healthLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

function validateLanguage(language) {
    if (typeof language !== 'string') {
        return false;
    }
    return ALLOWED_LANGUAGES.includes(language.toLowerCase());
}

function validateImage(image) {
    if (typeof image !== 'string') {
        return false;
    }
    return ALLOWED_IMAGES.includes(image);
}

function normalizePath(filePath) {
    if (typeof filePath !== 'string') {
        return null;
    }
    const resolved = path.resolve(filePath);
    if (process.platform === 'win32') {
        return resolved.replace(/\\/g, '/');
    }
    return resolved;
}

function validatePath(filePath) {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        return false;
    }
    const codeDirNormalized = normalizePath(codeDir);
    if (!codeDirNormalized) {
        return false;
    }
    return normalized.startsWith(codeDirNormalized);
}

function checkImageExists(image) {
    if (!validateImage(image)) {
        return Promise.resolve(false);
    }
    return new Promise((resolve) => {
        exec(`docker images -q ${image}`, { timeout: 5000 }, (error, stdout) => {
            if (error) {
                resolve(false);
                return;
            }
            resolve(stdout.trim().length > 0);
        });
    });
}

async function pullDockerImage(image, retries = 2) {
    if (!validateImage(image)) {
        return { success: false, image, error: 'Invalid image' };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            await new Promise((resolve, reject) => {
                const pullProcess = exec(`docker pull ${image}`, { timeout: 300000 }, (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });

                pullProcess.stdout?.on('data', (data) => {
                    process.stdout.write(`[${image}] ${data.toString().trim()}\n`);
                });

                pullProcess.stderr?.on('data', (data) => {
                    process.stderr.write(`[${image}] ${data.toString().trim()}\n`);
                });
            });

            return { success: true, image };
        } catch (error) {
            if (attempt < retries) {
                console.log(`[${image}] Pull failed, retrying... (${attempt + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
            } else {
                return { success: false, image, error: error.message };
            }
        }
    }
}

async function preloadDockerImages() {
    if (!(await isDockerAvailable())) {
        console.warn(
            '⚠️  Docker is not available. Skipping preload. (Start Docker Desktop to auto-pull on first use)'
        );
        return;
    }
    console.log('🚀 Starting Docker images preload...');
    const startTime = Date.now();
    const images = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);
    const uniqueImages = [...new Set(images)];

    console.log(`📦 Checking ${uniqueImages.length} unique images...`);

    const checkPromises = uniqueImages.map(async (image) => {
        const exists = await checkImageExists(image);
        return { image, exists };
    });

    const checkResults = await Promise.all(checkPromises);
    const imagesToPull = checkResults.filter(({ exists }) => !exists).map(({ image }) => image);
    const existingImages = checkResults.filter(({ exists }) => exists).map(({ image }) => image);

    if (existingImages.length > 0) {
        console.log(
            `✅ ${existingImages.length} images already exist: ${existingImages.join(', ')}`
        );
    }

    if (imagesToPull.length === 0) {
        console.log('✨ All required images are already available!');
        return;
    }

    console.log(`📥 Pulling ${imagesToPull.length} images: ${imagesToPull.join(', ')}`);

    const BATCH_SIZE = 3;
    const results = [];

    for (let i = 0; i < imagesToPull.length; i += BATCH_SIZE) {
        const batch = imagesToPull.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((image) => pullDockerImage(image));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        console.log(
            `📊 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount} succeeded, ${failCount} failed`
        );
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedImages = results.filter((r) => !r.success).map((r) => r.image);
        console.warn(`⚠️  Failed to pull ${totalFailed} images: ${failedImages.join(', ')}`);
        console.warn('   These images will be pulled on first use.');
    }

    console.log(
        `✨ Preload completed in ${elapsed}s: ${totalSuccess} succeeded, ${totalFailed} failed`
    );
}

function runDockerCommand(image, command, tmpfsSize, timeout = 10000, allowNetwork = false) {
    if (!validateImage(image) || typeof command !== 'string' || typeof tmpfsSize !== 'string') {
        return Promise.reject(new Error('Invalid parameters'));
    }
    const escapedCommand = command.replace(/'/g, "'\\''").replace(/"/g, '\\"');
    const networkFlag = allowNetwork ? '' : '--network=none ';
    const mounts = [];
    if (allowNetwork) {
        try {
            const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
            mounts.push(`-v ${hostKotlinCache}:/opt/kotlin`);
        } catch {
            // Ignore path conversion errors
        }
    }
    const dockerCmd = `docker run --rm --memory=${tmpfsSize} --cpus=${MAX_CPU_PERCENT} ${networkFlag}--read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize} ${mounts.join(' ')} ${image} sh -c "${escapedCommand}"`;

    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        exec(dockerCmd, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            const elapsed = Date.now() - startTime;
            if (error) {
                const errorInfo = {
                    message: error.message || 'Unknown error',
                    code: error.code,
                    signal: error.signal,
                    killed: error.killed,
                    stderr: stderr || '',
                    stdout: stdout || ''
                };
                reject({ error: errorInfo, elapsed });
                return;
            }
            resolve({ stdout, stderr, elapsed });
        });
    });
}

function getWarmupConfigs() {
    return [
        {
            language: 'python',
            image: 'python:3.11-slim',
            command: 'python -V',
            tmpfsSize: '50m',
            timeout: 5000
        },
        {
            language: 'javascript',
            image: 'node:20-slim',
            command: 'node -v',
            tmpfsSize: '50m',
            timeout: 5000
        },
        {
            language: 'c',
            image: 'gcc:14',
            command: 'gcc --version',
            tmpfsSize: '50m',
            timeout: 10000
        },
        {
            language: 'cpp',
            image: 'gcc:14',
            command: 'g++ --version',
            tmpfsSize: '50m',
            timeout: 10000
        },
        {
            language: 'java',
            image: 'eclipse-temurin:17-jdk-alpine',
            command: 'java -version',
            tmpfsSize: '50m',
            timeout: 15000
        },
        {
            language: 'rust',
            image: 'rust:1.81',
            command: 'rustc --version',
            tmpfsSize: '200m',
            timeout: 15000
        },
        {
            language: 'php',
            image: 'php:8.3-alpine',
            command: 'php -v',
            tmpfsSize: '50m',
            timeout: 5000
        },
        {
            language: 'r',
            image: 'r-base:4.4.1',
            command: 'Rscript --version',
            tmpfsSize: '50m',
            timeout: 10000
        },
        {
            language: 'ruby',
            image: 'ruby:3.3-alpine',
            command: 'ruby -v',
            tmpfsSize: '50m',
            timeout: 5000
        },
        {
            language: 'csharp',
            image: 'mcr.microsoft.com/dotnet/sdk:8.0',
            command: 'dotnet --version',
            tmpfsSize: '100m',
            timeout: 15000
        },
        {
            language: 'kotlin',
            image: 'eclipse-temurin:17-jdk-alpine',
            command:
                'if [ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]; then cd /tmp && (busybox wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip || wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version',
            tmpfsSize: '200m',
            timeout: 30000
        }
    ];
}

async function warmupContainer(config) {
    try {
        const allowNetwork = config.language === 'kotlin';
        const result = await runDockerCommand(
            config.image,
            config.command,
            config.tmpfsSize,
            config.timeout,
            allowNetwork
        );
        return { success: true, language: config.language, elapsed: result.elapsed };
    } catch (error) {
        const errorInfo = error?.error || {};
        let errorMessage = errorInfo.message || error?.message || 'Unknown error';

        if (errorInfo.stderr && errorInfo.stderr.trim()) {
            const stderrLines = errorInfo.stderr.trim().split('\n');
            const lastLine = stderrLines[stderrLines.length - 1];
            if (lastLine && lastLine.length < 150) {
                errorMessage = lastLine;
            } else if (stderrLines.length > 0) {
                errorMessage = stderrLines[0].substring(0, 150);
            }
        }

        return {
            success: false,
            language: config.language,
            error: errorMessage,
            fullError: errorInfo
        };
    }
}

async function warmupAllContainers() {
    if (!(await isDockerAvailable())) {
        console.warn('⚠️  Docker is not available. Skipping container warmup.');
        return;
    }
    const configs = getWarmupConfigs();
    console.log(`🔥 Warming up ${configs.length} containers...`);
    const startTime = Date.now();

    const BATCH_SIZE = 4;
    const results = [];

    for (let i = 0; i < configs.length; i += BATCH_SIZE) {
        const batch = configs.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((config) => warmupContainer(config));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        const succeededLanguages = batchResults.filter((r) => r.success).map((r) => r.language);
        const failedLanguages = batchResults.filter((r) => !r.success).map((r) => r.language);

        if (successCount > 0 && failCount > 0) {
            console.log(
                `🔥 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount}/${batch.length} succeeded`
            );
            console.log(`   ✅ ${succeededLanguages.join(', ')}`);
            console.log(`   ❌ ${failedLanguages.join(', ')}`);
        } else if (successCount > 0) {
            console.log(
                `🔥 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount}/${batch.length} succeeded (${succeededLanguages.join(', ')})`
            );
        } else {
            console.log(
                `🔥 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount}/${batch.length} succeeded (${failedLanguages.join(', ')})`
            );
        }
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedResults = results.filter((r) => !r.success);
        const failedLanguages = failedResults.map((r) => r.language);
        console.warn(
            `⚠️  Warmup failed for ${totalFailed} languages: ${failedLanguages.join(', ')}`
        );

        failedResults.forEach((result) => {
            const errorMsg = result.error || 'Unknown error';
            const maxLength = 200;
            const displayMsg =
                errorMsg.length > maxLength ? errorMsg.substring(0, maxLength) + '...' : errorMsg;
            console.warn(`   ${result.language}: ${displayMsg}`);
        });
    }

    if (totalSuccess > 0) {
        const avgElapsed =
            results.filter((r) => r.success).reduce((sum, r) => sum + (r.elapsed || 0), 0) /
            totalSuccess;
        console.log(
            `✨ Warmup completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded (avg: ${avgElapsed.toFixed(0)}ms)`
        );
    } else {
        console.log(
            `✨ Warmup completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded`
        );
    }
}

function warmupContainers() {
    warmupAllContainers().catch((error) => {
        console.error('Initial warmup error:', error);
    });

    const frequentLanguages = ['python', 'javascript', 'java', 'cpp'];
    const frequentConfigs = getWarmupConfigs().filter((config) =>
        frequentLanguages.includes(config.language)
    );

    setInterval(async () => {
        if (!(await isDockerAvailable())) {
            return;
        }
        const randomConfigs = frequentConfigs.sort(() => Math.random() - 0.5).slice(0, 2);
        randomConfigs.forEach((config) => {
            warmupContainer(config).catch((error) => {
                console.debug(`Warmup failed for ${config.language}:`, error);
            });
        });
    }, 60000);
}

async function ensureDirectories() {
    try {
        await fs.mkdir(codeDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        await fs.mkdir(toolCacheDir, { recursive: true });
        await fs.mkdir(kotlinCacheDir, { recursive: true });
        await fs.mkdir(kotlinBuildsDir, { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

function sanitizeCode(code) {
    if (typeof code !== 'string') {
        throw new Error('Invalid code format');
    }

    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            throw new Error('Potentially dangerous code detected');
        }
    }

    if (code.length === 0) {
        throw new Error('Code cannot be empty');
    }
}

function filterDockerMessages(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    // Strip ANSI escape sequences without using control chars in regex literal (to satisfy eslint)
    const ESC = String.fromCharCode(27);
    const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, 'g');
    const withoutAnsi = text.replace(ansiRegex, '');
    return withoutAnsi
        .split('\n')
        .filter((line) => {
            const lower = line.toLowerCase();
            return !DOCKER_PULL_MESSAGES.some((msg) => lower.includes(msg));
        })
        .join('\n');
}

function sanitizeError(error) {
    if (!error) {
        return 'An error occurred';
    }
    const errorStr = typeof error === 'string' ? error : error.message || String(error);
    const filtered = filterDockerMessages(errorStr);
    if (filtered.length > 500) {
        return filtered.substring(0, 500) + '...';
    }
    return filtered;
}

function augmentError(stderr, hasInput) {
    if (hasInput) {
        return stderr || '';
    }
    const s = stderr || '';
    for (const rx of INPUT_ERROR_PATTERNS) {
        if (rx.test(s)) {
            const hint =
                'Hint: The program tried to read from standard input, but no input was provided. Enter input in the box and run again.';
            return s && s.trim().length > 0 ? `${s.trim()}\n${hint}` : hint;
        }
    }
    for (const rx of ENTRYPOINT_ERROR_PATTERNS) {
        if (rx.test(s)) {
            const hint =
                'Hint: Could not find a program entry point. For Python, run a .py script; for C/C++, define main(); for Java, use class Main with public static void main; for Node.js, ensure the module/file exists.';
            return s && s.trim().length > 0 ? `${s.trim()}\n${hint}` : hint;
        }
    }
    return s;
}

async function cleanupFile(filePath) {
    if (!filePath || !validatePath(filePath)) {
        return;
    }
    try {
        await fs.unlink(filePath).catch(() => {});
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

function getContainerCodePath(language, extension) {
    if (language === 'java') {
        return '/tmp/Main.java';
    }
    if (language === 'csharp') {
        return '/tmp/Program.cs';
    }
    return `/tmp/code${extension}`;
}

function convertToDockerPath(filePath) {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        throw new Error('Invalid file path');
    }
    return normalized;
}

function buildDockerArgs(language, hostCodePath, opts = {}) {
    if (!validateLanguage(language)) {
        throw new Error('Invalid language');
    }

    if (!validatePath(hostCodePath)) {
        throw new Error('Invalid code path');
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config || !validateImage(config.image)) {
        throw new Error('Invalid language configuration');
    }

    const extension = LANGUAGE_EXTENSIONS[language];
    const containerPath = getContainerCodePath(language, extension);
    const containerBuildDir = language === 'kotlin' ? '/opt/kbuild' : undefined;
    const command = config.command(containerPath, containerBuildDir);
    let tmpfsSize;
    if (language === 'rust' || language === 'kotlin') {
        tmpfsSize = '200m';
    } else if (language === 'csharp') {
        tmpfsSize = '100m';
    } else {
        tmpfsSize = '50m';
    }
    const dockerHostPath = convertToDockerPath(hostCodePath);

    if (dockerHostPath.includes(' ') || containerPath.includes(' ')) {
        throw new Error('Invalid path format: paths with spaces are not supported');
    }

    if (containerPath.includes(':')) {
        throw new Error('Invalid container path format');
    }

    const args = ['run', '--rm'];
    if (opts.hasInput) {
        args.push('-i');
    }
    args.push(`--memory=${MAX_MEMORY}`);
    args.push(`--cpus=${language === 'kotlin' ? MAX_CPU_PERCENT_KOTLIN : MAX_CPU_PERCENT}`);
    // Always disable network for user executions
    args.push('--network=none');
    args.push('--read-only');
    args.push('--tmpfs');
    args.push(`/tmp:rw,exec,nosuid,size=${tmpfsSize},noatime`);

    // Security hardening flags
    args.push('--cap-drop=ALL');
    args.push('--security-opt');
    args.push('no-new-privileges');
    args.push('--pids-limit=128');
    args.push('--ulimit');
    args.push('nofile=1024:1024');
    args.push('--user');
    args.push('1000:1000');

    args.push('-v');
    args.push(`${dockerHostPath}:${containerPath}:ro`);

    if (language === 'kotlin') {
        const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
        args.push('-v');
        args.push(`${hostKotlinCache}:/opt/kotlin`);
        if (opts.kotlinBuildDirHost) {
            const hostBuildDir = convertToDockerPath(opts.kotlinBuildDirHost);
            args.push('-v');
            args.push(`${hostBuildDir}:/opt/kbuild`);
        }
    }
    if (opts.outputDirHost) {
        const hostOutputDir = convertToDockerPath(opts.outputDirHost);
        args.push('-v');
        args.push(`${hostOutputDir}:/output:rw`);
    }

    args.push(config.image);
    args.push('sh');
    args.push('-c');
    args.push(command);

    return args;
}

function validateJavaClass(code) {
    if (typeof code !== 'string') {
        throw new Error('Invalid code format');
    }
    const classMatches = code.match(/public\s+class\s+(\w+)/g);
    if (!classMatches || classMatches.length === 0) {
        throw new Error('Java code must contain a public class');
    }
    if (classMatches.length > 1) {
        throw new Error('Java code must contain only one public class');
    }
    const className = code.match(/public\s+class\s+(\w+)/);
    if (className && className[1] !== 'Main') {
        throw new Error('Java class must be named "Main"');
    }
}

async function writeCodeFile(codePath, code, language) {
    if (!validateLanguage(language)) {
        throw new Error('Invalid language');
    }

    if (!validatePath(codePath)) {
        throw new Error('Invalid code path');
    }

    const resolvedCodePath = path.resolve(codePath);

    if (language === 'java') {
        validateJavaClass(code);
        const modifiedCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
        const filePath = resolvedCodePath + '.java';
        await fs.writeFile(filePath, modifiedCode, 'utf8');
        return filePath;
    }
    if (language === 'csharp') {
        const filePath = resolvedCodePath + '.cs';
        await fs.writeFile(filePath, code, 'utf8');
        return filePath;
    }
    if (language === 'r') {
        const extension = LANGUAGE_EXTENSIONS[language];
        const fullPath = resolvedCodePath + extension;
        const plotPattern = /plot\s*\(|ggplot\s*\(|barplot\s*\(|hist\s*\(|boxplot\s*\(|pie\s*\(/i;
        const hasPlot = plotPattern.test(code);
        let modifiedCode = code;
        if (hasPlot) {
            modifiedCode = `png('/output/plot.png', width=800, height=600, res=100)\n${code}\ndev.off()\n`;
        }
        await fs.writeFile(fullPath, modifiedCode, 'utf8');
        return fullPath;
    }
    const extension = LANGUAGE_EXTENSIONS[language];
    const fullPath = resolvedCodePath + extension;
    await fs.writeFile(fullPath, code, 'utf8');
    return fullPath;
}

async function findImageFiles(outputDir) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'];
    const images = [];

    try {
        const files = await fs.readdir(outputDir);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (imageExtensions.includes(ext)) {
                const filePath = path.join(outputDir, file);
                try {
                    const imageBuffer = await fs.readFile(filePath);
                    const base64 = imageBuffer.toString('base64');
                    const mimeType = ext === '.svg' ? 'image/svg+xml' : `image/${ext.slice(1)}`;
                    images.push({
                        name: file,
                        data: `data:${mimeType};base64,${base64}`
                    });
                    await fs.unlink(filePath).catch(() => {});
                } catch {
                    // Ignore image read/parse errors
                }
            }
        }
    } catch {
        // Ignore directory read errors
    }

    return images;
}

async function handleExecutionResult(error, stdout, stderr, executionTime, res, outputDir = null) {
    const filteredStdout = filterDockerMessages(stdout || '');
    const filteredStderr = filterDockerMessages(stderr || '');
    const hasStdout = stdout && stdout.trim().length > 0;

    let images = [];
    if (outputDir) {
        images = await findImageFiles(outputDir);
        try {
            await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
        } catch {
            // Ignore cleanup errors
        }
    }

    if (error) {
        const errorMsg =
            error.killed || error.signal === 'SIGTERM'
                ? filteredStderr || 'Execution timeout exceeded'
                : sanitizeError(stderr || error.message);

        return res.json({
            output: filteredStdout || '',
            error: errorMsg,
            executionTime,
            images
        });
    }

    res.json({
        output: hasStdout ? filteredStdout : '',
        error: hasStdout ? '' : filteredStderr,
        executionTime,
        images
    });
}

app.post('/api/execute', executeLimiter, async (req, res) => {
    const { code, language, input = '' } = req.body;
    let responseSent = false;

    const sendResponse = (statusCode, data) => {
        if (!responseSent) {
            responseSent = true;
            res.status(statusCode).json(data);
        }
    };

    if (!code || !language) {
        return sendResponse(400, { error: 'Code and language are required' });
    }

    if (typeof code !== 'string' || typeof language !== 'string') {
        return sendResponse(400, { error: 'Invalid input format' });
    }

    if (code.length > MAX_CODE_LENGTH) {
        return sendResponse(400, {
            error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`
        });
    }

    if (!validateLanguage(language)) {
        return sendResponse(400, { error: 'Unsupported language' });
    }

    let inputText;
    if (typeof input === 'string') {
        inputText = input;
    } else if (input === null || input === undefined) {
        inputText = '';
    } else {
        inputText = String(input);
    }
    if (inputText.length > MAX_INPUT_LENGTH) {
        return sendResponse(400, {
            error: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`
        });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const codePath = path.join(codeDir, `${sessionId}_code`);
    let fullCodePath = null;

    try {
        sanitizeCode(code);
        fullCodePath = await writeCodeFile(codePath, code, language);

        if (!validatePath(fullCodePath)) {
            throw new Error('Invalid file path generated');
        }

        const sessionOutputDir = path.join(outputDir, sessionId);
        await fs.mkdir(sessionOutputDir, { recursive: true });

        let buildOptions = {};
        if (language === 'kotlin') {
            // If Kotlin compiler not available on host, block user execution and trigger background warmup
            if (!kotlinCompilerExistsOnHost()) {
                // fire-and-forget warmup
                warmupKotlinOnStart().catch(() => {});
                await cleanupFile(fullCodePath);
                await fs.rm(sessionOutputDir, { recursive: true, force: true }).catch(() => {});
                return sendResponse(503, {
                    error: 'Kotlin compiler is not available yet. Warming up; please retry shortly.'
                });
            }
            const codeHash = crypto.createHash('sha1').update(code).digest('hex');
            const hostBuildDir = path.join(kotlinBuildsDir, codeHash);
            await fs.mkdir(hostBuildDir, { recursive: true });
            buildOptions.kotlinBuildDirHost = hostBuildDir;
        }
        buildOptions.hasInput = inputText && inputText.trim().length > 0;
        buildOptions.outputDirHost = sessionOutputDir;
        const config = LANGUAGE_CONFIGS[language];
        const startTime = Date.now();

        if (buildOptions.hasInput) {
            const dockerArgs = buildDockerArgs(language, fullCodePath, buildOptions);
            const dockerProcess = spawn('docker', dockerArgs, {
                timeout: config.timeout + 2000,
                maxBuffer: 1024 * 1024 * 2
            });

            let stdout = '';
            let stderr = '';
            let stdoutBytes = 0;
            let stderrBytes = 0;
            let stdoutTruncated = false;
            let stderrTruncated = false;

            dockerProcess.stdout.on('data', (data) => {
                const s = data.toString('utf8');
                const bytes = Buffer.byteLength(s, 'utf8');
                const remaining = MAX_OUTPUT_BYTES - stdoutBytes;
                if (remaining <= 0) {
                    stdoutTruncated = true;
                    return;
                }
                if (bytes <= remaining) {
                    stdout += s;
                    stdoutBytes += bytes;
                } else {
                    const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
                    stdout += slice;
                    stdoutBytes += remaining;
                    stdoutTruncated = true;
                }
            });

            dockerProcess.stderr.on('data', (data) => {
                const s = data.toString('utf8');
                const bytes = Buffer.byteLength(s, 'utf8');
                const remaining = MAX_OUTPUT_BYTES - stderrBytes;
                if (remaining <= 0) {
                    stderrTruncated = true;
                    return;
                }
                if (bytes <= remaining) {
                    stderr += s;
                    stderrBytes += bytes;
                } else {
                    const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
                    stderr += slice;
                    stderrBytes += remaining;
                    stderrTruncated = true;
                }
            });

            dockerProcess.on('close', async (code) => {
                const executionTime = Date.now() - startTime;
                await cleanupFile(fullCodePath);
                if (!responseSent) {
                    const error = code !== 0 ? { code, killed: false, signal: null } : null;
                    if (stdoutTruncated) {
                        stdout += '\n[truncated]';
                    }
                    if (stderrTruncated) {
                        stderr += '\n[truncated]';
                    }
                    stderr = augmentError(stderr, buildOptions.hasInput);
                    await handleExecutionResult(
                        error,
                        stdout,
                        stderr,
                        executionTime,
                        res,
                        sessionOutputDir
                    );
                    responseSent = true;
                }
            });

            dockerProcess.on('error', async (error) => {
                const executionTime = Date.now() - startTime;
                await cleanupFile(fullCodePath);
                if (!responseSent) {
                    if (stdoutTruncated) {
                        stdout += '\n[truncated]';
                    }
                    if (stderrTruncated) {
                        stderr += '\n[truncated]';
                    }
                    stderr = augmentError(stderr, buildOptions.hasInput);
                    await handleExecutionResult(
                        error,
                        stdout,
                        stderr,
                        executionTime,
                        res,
                        sessionOutputDir
                    );
                    responseSent = true;
                }
            });

            dockerProcess.stdin.write(inputText);
            dockerProcess.stdin.end();

            setTimeout(() => {
                if (!responseSent && dockerProcess && !dockerProcess.killed) {
                    dockerProcess.kill('SIGTERM');
                }
            }, config.timeout + 2000);
        } else {
            const dockerArgs = buildDockerArgs(language, fullCodePath, buildOptions);
            const dockerProcess = spawn('docker', dockerArgs, {
                timeout: config.timeout + 2000
            });

            let stdout = '';
            let stderr = '';
            let stdoutBytes = 0;
            let stderrBytes = 0;
            let stdoutTruncated = false;
            let stderrTruncated = false;

            dockerProcess.stdout.on('data', (data) => {
                const s = data.toString('utf8');
                const bytes = Buffer.byteLength(s, 'utf8');
                const remaining = MAX_OUTPUT_BYTES - stdoutBytes;
                if (remaining <= 0) {
                    stdoutTruncated = true;
                    return;
                }
                if (bytes <= remaining) {
                    stdout += s;
                    stdoutBytes += bytes;
                } else {
                    const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
                    stdout += slice;
                    stdoutBytes += remaining;
                    stdoutTruncated = true;
                }
            });

            dockerProcess.stderr.on('data', (data) => {
                const s = data.toString('utf8');
                const bytes = Buffer.byteLength(s, 'utf8');
                const remaining = MAX_OUTPUT_BYTES - stderrBytes;
                if (remaining <= 0) {
                    stderrTruncated = true;
                    return;
                }
                if (bytes <= remaining) {
                    stderr += s;
                    stderrBytes += bytes;
                } else {
                    const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
                    stderr += slice;
                    stderrBytes += remaining;
                    stderrTruncated = true;
                }
            });

            dockerProcess.on('close', async (code) => {
                const executionTime = Date.now() - startTime;
                await cleanupFile(fullCodePath);
                if (!responseSent) {
                    const error = code !== 0 ? { code, killed: false, signal: null } : null;
                    if (stdoutTruncated) {
                        stdout += '\n[truncated]';
                    }
                    if (stderrTruncated) {
                        stderr += '\n[truncated]';
                    }
                    stderr = augmentError(stderr, buildOptions.hasInput);
                    await handleExecutionResult(
                        error,
                        stdout,
                        stderr,
                        executionTime,
                        res,
                        sessionOutputDir
                    );
                    responseSent = true;
                }
            });

            dockerProcess.on('error', async (error) => {
                const executionTime = Date.now() - startTime;
                await cleanupFile(fullCodePath);
                if (!responseSent) {
                    if (stdoutTruncated) {
                        stdout += '\n[truncated]';
                    }
                    if (stderrTruncated) {
                        stderr += '\n[truncated]';
                    }
                    stderr = augmentError(stderr, buildOptions.hasInput);
                    await handleExecutionResult(
                        error,
                        stdout,
                        stderr,
                        executionTime,
                        res,
                        sessionOutputDir
                    );
                    responseSent = true;
                }
            });

            setTimeout(() => {
                if (!responseSent && dockerProcess && !dockerProcess.killed) {
                    dockerProcess.kill('SIGTERM');
                }
            }, config.timeout + 2000);
        }
    } catch (error) {
        await cleanupFile(fullCodePath);
        const sanitizedError = sanitizeError(error);
        sendResponse(400, { error: sanitizedError });
    }
});

app.get('/api/health', healthLimiter, (_, res) => {
    res.json({ status: 'ok' });
});

app.use((err, _, res, _next) => {
    console.error('Unhandled error:', err.message || 'Unknown error');
    res.status(500).json({ error: 'Internal server error' });
});

ensureDirectories()
    .then(async () => {
        await warmupKotlinOnStart();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            if (ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (ENABLE_WARMUP) {
            warmupContainers();
        }
    })
    .catch((e) => {
        console.error('Startup error:', e);
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            if (ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (ENABLE_WARMUP) {
            warmupContainers();
        }
    });
