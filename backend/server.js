const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const {
    CONFIG,
    TMPFS_SIZES,
    CONTAINER_CODE_PATHS,
    LANGUAGE_EXTENSIONS,
    LANGUAGE_CONFIGS,
    ALLOWED_LANGUAGES,
    ALLOWED_IMAGES,
    DANGEROUS_PATTERNS,
    DOCKER_PULL_MESSAGES,
    DEBUG_PATTERNS
} = require('./config');

const app = express();

const codeDir = path.join(__dirname, 'code');
const outputDir = path.join(__dirname, 'output');
const toolCacheDir = path.join(__dirname, 'tool_cache');
const kotlinCacheDir = path.join(toolCacheDir, 'kotlin');
const kotlinBuildsDir = path.join(toolCacheDir, 'kotlin_builds');

app.disable('x-powered-by');
if (CONFIG.TRUST_PROXY) {
    app.set('trust proxy', 1);
}

async function isDockerAvailable() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.DOCKER_CHECK_TIMEOUT);
    try {
        await promisify(exec)('docker version', { signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
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
        'if [ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]; then cd /tmp && (busybox wget -q --timeout=10 --tries=2 https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip || wget -q --timeout=10 --tries=2 https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version';
    try {
        await runDockerCommand(image, cmd, TMPFS_SIZES.kotlin, 20000, true);
    } catch {
        // Ignore warmup errors
    }
}

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

async function checkImageExists(image) {
    if (!validateImage(image)) {
        return false;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const { stdout } = await promisify(exec)(`docker images -q ${image}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return stdout.trim().length > 0;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}

async function pullDockerImage(image, retries = CONFIG.DOCKER_PULL_RETRIES) {
    if (!validateImage(image)) {
        return { success: false, image, error: 'Invalid image' };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.DOCKER_PULL_TIMEOUT);

            const pullProcess = exec(`docker pull ${image}`, { signal: controller.signal });

            pullProcess.stdout?.on('data', (data) => {
                process.stdout.write(`[${image}] ${data.toString().trim()}\n`);
            });

            pullProcess.stderr?.on('data', (data) => {
                process.stderr.write(`[${image}] ${data.toString().trim()}\n`);
            });

            await new Promise((resolve, reject) => {
                pullProcess.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Process exited with code ${code}`));
                    }
                });
                pullProcess.on('error', reject);
            });

            clearTimeout(timeoutId);
            return { success: true, image };
        } catch (error) {
            if (attempt < retries) {
                const delay = CONFIG.DOCKER_PULL_RETRY_DELAY_BASE * (attempt + 1);
                console.log(`[${image}] Pull failed, retrying... (${attempt + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                return { success: false, image, error: error.message || 'Unknown error' };
            }
        }
    }
}

async function preloadDockerImages() {
    if (!(await isDockerAvailable())) {
        console.warn(
            '[PRELOAD] Docker is not available. Skipping preload. (Start Docker Desktop to auto-pull on first use)'
        );
        return;
    }
    console.log('[PRELOAD] Starting Docker images preload...');
    const startTime = Date.now();
    const images = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);
    const uniqueImages = [...new Set(images)];

    console.log(`[PRELOAD] Checking ${uniqueImages.length} unique images...`);

    const checkPromises = uniqueImages.map(async (image) => {
        const exists = await checkImageExists(image);
        return { image, exists };
    });

    const checkResults = await Promise.all(checkPromises);
    const imagesToPull = checkResults.filter(({ exists }) => !exists).map(({ image }) => image);
    const existingImages = checkResults.filter(({ exists }) => exists).map(({ image }) => image);

    if (existingImages.length > 0) {
        console.log(
            `[PRELOAD] ${existingImages.length} images already exist: ${existingImages.join(', ')}`
        );
    }

    if (imagesToPull.length === 0) {
        console.log('[PRELOAD] All required images are already available!');
        return;
    }

    console.log(`[PRELOAD] Pulling ${imagesToPull.length} images: ${imagesToPull.join(', ')}`);

    const results = [];

    for (let i = 0; i < imagesToPull.length; i += CONFIG.PRELOAD_BATCH_SIZE) {
        const batch = imagesToPull.slice(i, i + CONFIG.PRELOAD_BATCH_SIZE);
        const batchPromises = batch.map((image) => pullDockerImage(image));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        const batchNumber = Math.floor(i / CONFIG.PRELOAD_BATCH_SIZE) + 1;
        console.log(
            `[PRELOAD] Batch ${batchNumber}: ${successCount} succeeded, ${failCount} failed`
        );
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedImages = results.filter((r) => !r.success).map((r) => r.image);
        console.warn(`[PRELOAD] Failed to pull ${totalFailed} images: ${failedImages.join(', ')}`);
        console.warn('[PRELOAD] These images will be pulled on first use.');
    }

    console.log(
        `[PRELOAD] Completed in ${elapsed}s: ${totalSuccess} succeeded, ${totalFailed} failed`
    );
}

async function runDockerCommand(image, command, tmpfsSize, timeout = 10000, allowNetwork = false) {
    if (!validateImage(image) || typeof command !== 'string' || typeof tmpfsSize !== 'string') {
        throw new Error('Invalid parameters');
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
    const dockerCmd = `docker run --rm --memory=${tmpfsSize} --cpus=${CONFIG.MAX_CPU_PERCENT} ${networkFlag}--read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize} ${mounts.join(' ')} ${image} sh -c "${escapedCommand}"`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startTime = Date.now();

    try {
        const { stdout, stderr } = await promisify(exec)(dockerCmd, {
            signal: controller.signal,
            maxBuffer: 1024 * 1024
        });
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        return { stdout, stderr, elapsed };
    } catch (error) {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        const errorInfo = {
            message: error.message || 'Unknown error',
            code: error.code,
            signal: error.signal,
            killed: error.killed,
            stderr: error.stderr || '',
            stdout: error.stdout || ''
        };
        throw { error: errorInfo, elapsed };
    }
}

function getWarmupConfigs() {
    return [
        {
            language: 'python',
            image: 'python:3.11-slim',
            command: 'python -V',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'javascript',
            image: 'node:20-slim',
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'c',
            image: 'gcc:14',
            command: 'gcc --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'cpp',
            image: 'gcc:14',
            command: 'g++ --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'java',
            image: 'eclipse-temurin:17-jdk-alpine',
            command: 'java -version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'rust',
            image: 'rust:1.81',
            command: 'rustc --version',
            tmpfsSize: TMPFS_SIZES.rust,
            timeout: 5000
        },
        {
            language: 'php',
            image: 'php:8.3-alpine',
            command: 'php -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        },
        {
            language: 'r',
            image: 'r-base:4.4.1',
            command: 'Rscript --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'ruby',
            image: 'ruby:3.3-alpine',
            command: 'ruby -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'csharp',
            image: 'mcr.microsoft.com/dotnet/sdk:8.0',
            command: 'dotnet --version',
            tmpfsSize: TMPFS_SIZES.csharp,
            timeout: 10000
        },
        {
            language: 'kotlin',
            image: 'eclipse-temurin:17-jdk-alpine',
            command: kotlinCompilerExistsOnHost()
                ? 'java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version'
                : 'if [ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]; then cd /tmp && (busybox wget -q --timeout=10 --tries=2 https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip || wget -q --timeout=10 --tries=2 https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version',
            tmpfsSize: TMPFS_SIZES.kotlin,
            timeout: 15000
        },
        {
            language: 'go',
            image: 'golang:1.23-alpine',
            command: 'go version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'typescript',
            image: 'node:20-slim',
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        },
        {
            language: 'swift',
            image: 'swift:5.10',
            command: 'swift --version',
            tmpfsSize: TMPFS_SIZES.swift,
            timeout: 15000
        },
        {
            language: 'perl',
            image: 'perl:5.40-slim',
            command: 'perl -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        },
        {
            language: 'haskell',
            image: 'haskell:9.6',
            command: 'ghc --version',
            tmpfsSize: TMPFS_SIZES.haskell,
            timeout: 15000
        },
        {
            language: 'bash',
            image: 'alpine:3.19',
            command: 'echo "Alpine Linux ready for bash"',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        }
    ];
}

async function warmupContainer(config) {
    try {
        let retries = 3;
        let imageExists = false;
        while (retries > 0 && !imageExists) {
            imageExists = await checkImageExists(config.image);
            if (!imageExists) {
                retries--;
                if (retries > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        }

        if (!imageExists) {
            return {
                success: false,
                language: config.language,
                error: `Image ${config.image} not found after waiting`
            };
        }

        const allowNetwork = config.language === 'kotlin';
        const result = await runDockerCommand(
            config.image,
            config.command,
            config.tmpfsSize,
            config.timeout,
            allowNetwork
        );

        if (
            config.language === 'kotlin' &&
            result.stderr &&
            result.stderr.includes('kotlinc-jvm')
        ) {
            return { success: true, language: config.language, elapsed: result.elapsed };
        }

        return { success: true, language: config.language, elapsed: result.elapsed };
    } catch (error) {
        const errorInfo = error?.error || {};
        let errorMessage = errorInfo.message || error?.message || 'Unknown error';

        if (
            error.name === 'AbortError' ||
            errorMessage.includes('aborted') ||
            errorMessage.includes('The operation was aborted')
        ) {
            errorMessage = `Timeout after ${config.timeout}ms`;
        }

        if (
            config.language === 'kotlin' &&
            errorInfo.stderr &&
            errorInfo.stderr.includes('kotlinc-jvm')
        ) {
            return { success: true, language: config.language, elapsed: error?.elapsed || 0 };
        }

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
        console.warn('[WARMUP] Docker is not available. Skipping container warmup.');
        return;
    }
    const configs = getWarmupConfigs();
    console.log(`[WARMUP] Warming up ${configs.length} containers...`);
    const startTime = Date.now();

    const results = [];

    for (let i = 0; i < configs.length; i += CONFIG.WARMUP_BATCH_SIZE) {
        const batch = configs.slice(i, i + CONFIG.WARMUP_BATCH_SIZE);
        const batchPromises = batch.map((config) => warmupContainer(config));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        const succeededLanguages = batchResults.filter((r) => r.success).map((r) => r.language);
        const failedLanguages = batchResults.filter((r) => !r.success).map((r) => r.language);
        const batchNumber = Math.floor(i / CONFIG.WARMUP_BATCH_SIZE) + 1;

        if (successCount > 0 && failCount > 0) {
            console.log(`[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded`);
            console.log(`[WARMUP]   Succeeded: ${succeededLanguages.join(', ')}`);
            console.log(`[WARMUP]   Failed: ${failedLanguages.join(', ')}`);
        } else if (successCount > 0) {
            console.log(
                `[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded (${succeededLanguages.join(', ')})`
            );
        } else {
            console.log(
                `[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded (${failedLanguages.join(', ')})`
            );
        }
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedResults = results.filter((r) => !r.success);
        const failedLanguages = failedResults.map((r) => r.language);
        console.warn(`[WARMUP] Failed for ${totalFailed} languages: ${failedLanguages.join(', ')}`);

        failedResults.forEach((result) => {
            const errorMsg = result.error || 'Unknown error';
            const displayMsg =
                errorMsg.length > CONFIG.ERROR_MESSAGE_MAX_LENGTH
                    ? errorMsg.substring(0, CONFIG.ERROR_MESSAGE_MAX_LENGTH) + '...'
                    : errorMsg;
            console.warn(`[WARMUP]   ${result.language}: ${displayMsg}`);
        });
    }

    if (totalSuccess > 0) {
        const avgElapsed =
            results.filter((r) => r.success).reduce((sum, r) => sum + (r.elapsed || 0), 0) /
            totalSuccess;
        console.log(
            `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded (avg: ${avgElapsed.toFixed(0)}ms)`
        );
    } else {
        console.log(
            `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded`
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
    const ESC = String.fromCharCode(27);
    const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, 'g');
    const withoutAnsi = text.replace(ansiRegex, '');

    return withoutAnsi
        .split('\n')
        .filter((line) => {
            const lower = line.toLowerCase();
            if (DOCKER_PULL_MESSAGES.some((msg) => lower.includes(msg))) {
                return false;
            }
            if (DEBUG_PATTERNS.some((pattern) => pattern.test(line.trim()))) {
                return false;
            }
            return true;
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

function sanitizeErrorForUser(errorStr) {
    if (!errorStr || typeof errorStr !== 'string') {
        return 'An error occurred during execution.';
    }

    let sanitized = filterDockerMessages(errorStr);

    sanitized = sanitized.replace(/docker:.*/gi, '');
    sanitized = sanitized.replace(/Error response from daemon.*/gi, '');

    sanitized = sanitized.replace(/\/[^\s]+/g, '[file path]');
    sanitized = sanitized.replace(/[A-Z]:\\[^\s]+/gi, '[file path]');

    const stackTraceMatch = sanitized.match(/(.*?)(\n\s+at\s+.*)/s);
    if (stackTraceMatch) {
        sanitized = stackTraceMatch[1];
    }

    const lines = sanitized.split('\n').filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return false;
        }
        if (trimmed.startsWith('[DEBUG]') || trimmed.startsWith('DEBUG:')) {
            return false;
        }
        if (/^\[file path\]$/.test(trimmed)) {
            return false;
        }
        return true;
    });

    sanitized = lines.slice(0, 10).join('\n').trim();

    if (sanitized.length > 300) {
        sanitized = sanitized.substring(0, 300) + '...';
    }

    if (!sanitized || sanitized.length === 0) {
        return 'An error occurred during execution.';
    }

    return sanitized;
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

async function writeInputFile(inputPath, inputText) {
    if (!validatePath(inputPath)) {
        throw new Error('Invalid input path');
    }
    const resolvedInputPath = path.resolve(inputPath);
    await fs.writeFile(resolvedInputPath, inputText, 'utf8');
    return resolvedInputPath;
}

function getContainerCodePath(language, extension) {
    return CONTAINER_CODE_PATHS[language] || `/tmp/code${extension}`;
}

function convertToDockerPath(filePath) {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        throw new Error('Invalid file path');
    }
    if (process.platform === 'win32' && normalized.match(/^[A-Z]:/)) {
        const drive = normalized[0].toLowerCase();
        const rest = normalized.substring(2).replace(/\\/g, '/');
        return `/${drive}${rest}`;
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
    const containerBuildDir = language === 'kotlin' ? '/tmp/kbuild' : undefined;
    const containerInputPath = opts.inputPath
        ? `/input/${path.basename(opts.inputPath)}`
        : undefined;
    const command =
        language === 'kotlin'
            ? config.command(containerPath, containerInputPath, containerBuildDir)
            : config.command(containerPath, containerInputPath);
    const tmpfsSize = TMPFS_SIZES[language] || TMPFS_SIZES.default;
    const dockerHostPath = convertToDockerPath(hostCodePath);

    if (dockerHostPath.includes(' ') || containerPath.includes(' ')) {
        throw new Error('Invalid path format: paths with spaces are not supported');
    }

    if (containerPath.includes(':')) {
        throw new Error('Invalid container path format');
    }

    const args = ['run', '--rm'];
    args.push(`--memory=${CONFIG.MAX_MEMORY}`);
    args.push(
        `--cpus=${language === 'kotlin' ? CONFIG.MAX_CPU_PERCENT_KOTLIN : CONFIG.MAX_CPU_PERCENT}`
    );
    if (language !== 'typescript' && language !== 'bash') {
        args.push('--network=none');
    }
    args.push('--read-only');
    args.push('--tmpfs');
    args.push(`/tmp:rw,exec,nosuid,size=${tmpfsSize},noatime`);

    args.push('--cap-drop=ALL');
    args.push('--security-opt');
    args.push('no-new-privileges');
    args.push('--pids-limit=128');
    args.push('--ulimit');
    args.push('nofile=1024:1024');
    args.push('--user');
    args.push('1000:1000');

    const hostCodeDir = path.dirname(hostCodePath);
    const hostFileName = path.basename(hostCodePath);
    const dockerHostDir = convertToDockerPath(hostCodeDir);
    const mountedFilePath = `/code/${hostFileName}`;

    if (CONFIG.DEBUG_MODE) {
        console.log(
            `[DEBUG] File paths: hostCodePath=${hostCodePath}, hostCodeDir=${hostCodeDir}, hostFileName=${hostFileName}, dockerHostDir=${dockerHostDir}, mountedFilePath=${mountedFilePath}`
        );
    }

    args.push('-v');
    args.push(`${dockerHostDir}:/code:ro`);

    if (opts.inputPath) {
        const hostInputDir = path.dirname(opts.inputPath);
        const dockerInputDir = convertToDockerPath(hostInputDir);
        if (CONFIG.DEBUG_MODE) {
            console.log(
                `[DEBUG] Input file paths: hostInputPath=${opts.inputPath}, dockerInputDir=${dockerInputDir}`
            );
        }
        args.push('-v');
        args.push(`${dockerInputDir}:/input:ro`);
    }

    const inputFileCheck = opts.inputPath
        ? !CONFIG.DEBUG_MODE
            ? `test -f "/input/${path.basename(opts.inputPath)}" || (echo "ERROR: Input file not found" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking input file: /input/${path.basename(opts.inputPath)}" >&2 && if [ ! -f "/input/${path.basename(opts.inputPath)}" ]; then echo "ERROR: Input file not found: /input/${path.basename(opts.inputPath)}" >&2; ls -la /input >&2; exit 1; fi && `
        : '';
    const fileCopy = !CONFIG.DEBUG_MODE
        ? `test -f "${mountedFilePath}" || (echo "ERROR: Source file not found" >&2 && exit 1) && cp "${mountedFilePath}" "${containerPath}" && test -f "${containerPath}" || (echo "ERROR: Copy failed" >&2 && exit 1) && `
        : `echo "[DEBUG] Checking source file: ${mountedFilePath}" >&2 && if [ ! -f "${mountedFilePath}" ]; then echo "ERROR: Source file not found: ${mountedFilePath}" >&2; ls -la /code >&2; exit 1; fi && echo "[DEBUG] Copying file to ${containerPath}" >&2 && cp "${mountedFilePath}" "${containerPath}" && echo "[DEBUG] Verifying copied file" >&2 && if [ ! -f "${containerPath}" ]; then echo "ERROR: Destination file not found after copy: ${containerPath}" >&2; ls -la /tmp >&2; exit 1; fi && if [ ! -s "${containerPath}" ]; then echo "ERROR: Destination file is empty: ${containerPath}" >&2; exit 1; fi && echo "[DEBUG] File copy successful" >&2 && `;
    const finalCommand = `${inputFileCheck}${fileCopy}${command}`;

    if (language === 'kotlin') {
        const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
        args.push('-v');
        args.push(`${hostKotlinCache}:/opt/kotlin`);
    }
    if (opts.outputDirHost) {
        const hostOutputDir = convertToDockerPath(opts.outputDirHost);
        args.push('-v');
        args.push(`${hostOutputDir}:/output:rw`);
    }

    args.push(config.image);
    args.push('sh');
    args.push('-c');
    args.push(finalCommand);

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
    let finalCode = code;
    let fileExtension;

    switch (language) {
        case 'java':
            validateJavaClass(code);
            finalCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
            fileExtension = '.java';
            break;

        case 'csharp':
            fileExtension = '.cs';
            break;

        case 'r': {
            const plotPattern =
                /plot\s*\(|ggplot\s*\(|barplot\s*\(|hist\s*\(|boxplot\s*\(|pie\s*\(/i;
            const hasPlot = plotPattern.test(code);
            if (hasPlot) {
                finalCode = `png('/output/plot.png', width=800, height=600, res=100)\n${code}\ndev.off()\n`;
            }
            fileExtension = LANGUAGE_EXTENSIONS[language];
            break;
        }

        default:
            fileExtension = LANGUAGE_EXTENSIONS[language];
            break;
    }

    const fullPath = resolvedCodePath + fileExtension;
    await fs.writeFile(fullPath, finalCode, 'utf8');
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
                    // Ignore file read errors
                }
            }
        }
    } catch {
        // Ignore directory read errors
    }

    return images;
}

class OutputCollector {
    constructor(maxBytes) {
        this.maxBytes = maxBytes;
        this.stdout = '';
        this.stderr = '';
        this.stdoutBytes = 0;
        this.stderrBytes = 0;
        this.stdoutTruncated = false;
        this.stderrTruncated = false;
    }

    addStdout(data) {
        if (this.stdoutTruncated) {
            return;
        }
        const s = data.toString('utf8');
        const bytes = Buffer.byteLength(s, 'utf8');
        const remaining = this.maxBytes - this.stdoutBytes;
        if (remaining <= 0) {
            this.stdoutTruncated = true;
            return;
        }
        if (bytes <= remaining) {
            this.stdout += s;
            this.stdoutBytes += bytes;
        } else {
            const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
            this.stdout += slice;
            this.stdoutBytes += remaining;
            this.stdoutTruncated = true;
        }
    }

    addStderr(data) {
        if (this.stderrTruncated) {
            return;
        }
        const s = data.toString('utf8');
        const bytes = Buffer.byteLength(s, 'utf8');
        const remaining = this.maxBytes - this.stderrBytes;
        if (remaining <= 0) {
            this.stderrTruncated = true;
            return;
        }
        if (bytes <= remaining) {
            this.stderr += s;
            this.stderrBytes += bytes;
        } else {
            const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
            this.stderr += slice;
            this.stderrBytes += remaining;
            this.stderrTruncated = true;
        }
    }

    getFinalOutput() {
        let stdout = this.stdout;
        let stderr = this.stderr;
        if (this.stdoutTruncated) {
            stdout += '\n[truncated]';
        }
        if (this.stderrTruncated) {
            stderr += '\n[truncated]';
        }
        return { stdout, stderr };
    }
}

async function executeDockerProcess(
    language,
    fullCodePath,
    buildOptions,
    config,
    startTime,
    res,
    sessionOutputDir,
    fullInputPath,
    getResponseSent,
    setResponseSent
) {
    const dockerArgs = buildDockerArgs(language, fullCodePath, buildOptions);
    const controller = new AbortController();
    const abortTimeoutId = setTimeout(
        () => controller.abort(),
        config.timeout + CONFIG.TIMEOUT_BUFFER_MS
    );
    const dockerProcess = spawn('docker', dockerArgs, {
        signal: controller.signal,
        maxBuffer: CONFIG.MAX_BUFFER_SIZE
    });

    dockerProcess.stdout.setEncoding('utf8');
    dockerProcess.stderr.setEncoding('utf8');

    if (dockerProcess.stdout.setDefaultEncoding) {
        dockerProcess.stdout.setDefaultEncoding('utf8');
    }
    if (dockerProcess.stderr.setDefaultEncoding) {
        dockerProcess.stderr.setDefaultEncoding('utf8');
    }

    const outputCollector = new OutputCollector(CONFIG.MAX_OUTPUT_BYTES);

    dockerProcess.stdout.on('data', (data) => {
        outputCollector.addStdout(data);
    });

    dockerProcess.stderr.on('data', (data) => {
        outputCollector.addStderr(data);
    });

    let responseHandled = false;
    const markResponseHandled = () => {
        if (responseHandled) {
            return false;
        }
        responseHandled = true;
        return true;
    };

    const handleClose = async (code) => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const executionTime = Date.now() - startTime;
            await cleanupResources(fullCodePath, fullInputPath);

            const error = code !== 0 ? { code, killed: false, signal: null } : null;
            const { stdout, stderr } = outputCollector.getFinalOutput();
            await handleExecutionResult(
                error,
                stdout,
                stderr,
                executionTime,
                res,
                sessionOutputDir
            );
            setResponseSent(true);
        } catch (err) {
            console.error('[ERROR] Error in handleClose:', err);
            if (!getResponseSent()) {
                try {
                    res.status(500).json({
                        error: 'An error occurred while processing execution result.'
                    });
                    setResponseSent(true);
                } catch (sendErr) {
                    console.error('[ERROR] Failed to send error response:', sendErr);
                }
            }
        }
    };

    const handleError = async (error) => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const executionTime = Date.now() - startTime;
            await cleanupResources(fullCodePath, fullInputPath);

            const { stdout, stderr } = outputCollector.getFinalOutput();
            await handleExecutionResult(
                error,
                stdout,
                stderr,
                executionTime,
                res,
                sessionOutputDir
            );
            setResponseSent(true);
        } catch (err) {
            console.error('[ERROR] Error in handleError:', err);
            if (!getResponseSent()) {
                try {
                    res.status(500).json({
                        error: 'An error occurred while processing execution error.'
                    });
                    setResponseSent(true);
                } catch (sendErr) {
                    console.error('[ERROR] Failed to send error response:', sendErr);
                }
            }
        }
    };

    dockerProcess.on('close', handleClose);
    dockerProcess.on('error', handleError);

    const processTimeoutId = setTimeout(async () => {
        if (responseHandled || getResponseSent()) {
            return;
        }
        if (!dockerProcess || dockerProcess.killed) {
            return;
        }

        try {
            controller.abort();
            dockerProcess.kill('SIGTERM');

            const killTimeoutId = setTimeout(() => {
                if (dockerProcess && !dockerProcess.killed) {
                    try {
                        dockerProcess.kill('SIGKILL');
                    } catch (killError) {
                        console.error('[ERROR] Failed to kill Docker process:', killError);
                    }
                }
            }, CONFIG.SIGKILL_DELAY_MS);

            dockerProcess.once('close', () => {
                clearTimeout(killTimeoutId);
            });
            dockerProcess.once('error', () => {
                clearTimeout(killTimeoutId);
            });
        } catch (killError) {
            console.error('[ERROR] Failed to send SIGTERM to Docker process:', killError);
        }
    }, config.timeout + CONFIG.TIMEOUT_BUFFER_MS);

    const cleanupTimeout = () => {
        clearTimeout(abortTimeoutId);
        clearTimeout(processTimeoutId);
    };
    dockerProcess.once('close', cleanupTimeout);
    dockerProcess.once('error', cleanupTimeout);
}

async function cleanupResources(fullCodePath, fullInputPath) {
    const cleanupPromises = [cleanupFile(fullCodePath)];
    if (fullInputPath) {
        cleanupPromises.push(cleanupFile(fullInputPath));
    }
    await Promise.allSettled(cleanupPromises);
}

async function handleExecutionResult(error, stdout, stderr, executionTime, res, outputDir = null) {
    const filteredStdout = filterDockerMessages(stdout || '');
    const filteredStderr = filterDockerMessages(stderr || '');
    const hasStdout = stdout && stdout.trim().length > 0;

    let images = [];
    if (outputDir) {
        try {
            images = await findImageFiles(outputDir);
        } catch (error) {
            console.error('[ERROR] Failed to find image files:', error);
        }
        try {
            await fs.rm(outputDir, { recursive: true, force: true });
        } catch (error) {
            console.error('[ERROR] Failed to cleanup output directory:', error);
        }
    }

    if (error) {
        let errorMsg;
        if (error.killed || error.signal === 'SIGTERM') {
            errorMsg = 'Execution timeout exceeded.';
        } else {
            const sanitized = sanitizeError(stderr || error.message || 'Unknown error');
            errorMsg = sanitizeErrorForUser(sanitized);
        }

        return res.json({
            output: filteredStdout || '',
            error: errorMsg,
            executionTime,
            images
        });
    }

    let finalOutput = hasStdout ? filteredStdout : '';
    let finalError = '';

    if (!hasStdout && filteredStderr) {
        const isBuildSuccess = /Build succeeded/i.test(filteredStderr);
        const isBuildFailed = /Build FAILED/i.test(filteredStderr);
        const isWarningOnly =
            /warning/i.test(filteredStderr) && !/error/i.test(filteredStderr) && !isBuildFailed;

        if (isBuildSuccess || isWarningOnly) {
            finalOutput = '';
            finalError = '';
        } else {
            finalError = sanitizeErrorForUser(filteredStderr);
        }
    } else if (hasStdout) {
        finalError = '';
    } else {
        finalError = filteredStderr ? sanitizeErrorForUser(filteredStderr) : '';
    }

    res.json({
        output: finalOutput,
        error: finalError,
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

    if (code.length > CONFIG.MAX_CODE_LENGTH) {
        return sendResponse(400, {
            error: `Code exceeds maximum length of ${CONFIG.MAX_CODE_LENGTH} characters`
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
    if (inputText.length > CONFIG.MAX_INPUT_LENGTH) {
        return sendResponse(400, {
            error: `Input exceeds maximum length of ${CONFIG.MAX_INPUT_LENGTH} characters`
        });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const codePath = path.join(codeDir, `${sessionId}_code`);
    let fullCodePath = null;
    let fullInputPath = null;

    try {
        sanitizeCode(code);
        fullCodePath = await writeCodeFile(codePath, code, language);

        if (!validatePath(fullCodePath)) {
            throw new Error('Invalid file path generated');
        }

        try {
            const stats = await fs.stat(fullCodePath);
            if (!stats.isFile()) {
                throw new Error(`Path exists but is not a file: ${fullCodePath}`);
            }
            if (CONFIG.DEBUG_MODE) {
                console.log(
                    `[DEBUG] File created successfully: ${fullCodePath}, size: ${stats.size} bytes`
                );
            }
        } catch (error) {
            console.error(`[ERROR] File verification failed: ${fullCodePath}`, error);
            throw new Error(`Failed to create or verify code file: ${error.message}`);
        }

        const sessionOutputDir = path.join(outputDir, sessionId);
        await fs.mkdir(sessionOutputDir, { recursive: true });

        let buildOptions = {};
        if (language === 'kotlin') {
            if (!kotlinCompilerExistsOnHost()) {
                warmupKotlinOnStart().catch(() => {});
                await cleanupFile(fullCodePath);
                await fs.rm(sessionOutputDir, { recursive: true, force: true }).catch(() => {});
                return sendResponse(503, {
                    error: 'Kotlin compiler is not available yet. Warming up; please retry shortly.'
                });
            }
        }
        buildOptions.hasInput = inputText && inputText.trim().length > 0;
        buildOptions.outputDirHost = sessionOutputDir;

        if (buildOptions.hasInput) {
            const inputPath = path.join(codeDir, `${sessionId}_input`);
            fullInputPath = await writeInputFile(inputPath, inputText);
            buildOptions.inputPath = fullInputPath;
            if (CONFIG.DEBUG_MODE) {
                console.log(
                    `[DEBUG] Input file created: ${fullInputPath}, size: ${inputText.length} bytes`
                );
            }
        }

        const config = LANGUAGE_CONFIGS[language];
        const startTime = Date.now();
        let executionResponseSent = false;

        await executeDockerProcess(
            language,
            fullCodePath,
            buildOptions,
            config,
            startTime,
            res,
            sessionOutputDir,
            fullInputPath,
            () => executionResponseSent,
            (value) => {
                executionResponseSent = value;
            }
        );
    } catch (error) {
        await cleanupFile(fullCodePath);
        if (fullInputPath) {
            await cleanupFile(fullInputPath);
        }
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
        app.listen(CONFIG.PORT, () => {
            console.log(`Server running on port ${CONFIG.PORT}`);
            if (CONFIG.ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (CONFIG.ENABLE_WARMUP) {
            warmupContainers();
        }
    })
    .catch((e) => {
        console.error('Startup error:', e);
        app.listen(CONFIG.PORT, () => {
            console.log(`Server running on port ${CONFIG.PORT}`);
            if (CONFIG.ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (CONFIG.ENABLE_WARMUP) {
            warmupContainers();
        }
    });
