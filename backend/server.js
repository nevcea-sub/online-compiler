const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
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

const codeDir = path.join(__dirname, 'code');
const outputDir = path.join(__dirname, 'output');

const LANGUAGE_EXTENSIONS = {
    python: '.py',
    javascript: '.js',
    java: '.java',
    cpp: '.cpp',
    c: '.c',
    rust: '.rs',
    php: '.php'
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
        image: 'gcc:latest',
        command: (path) => `g++ -O2 -s -o /tmp/a.out ${path} && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    c: {
        image: 'gcc:latest',
        command: (path) => `gcc -O2 -s -o /tmp/a.out ${path} && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    rust: {
        image: 'rust:latest',
        command: (path) => `rustc ${path} -o /tmp/a.out && chmod +x /tmp/a.out && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 3
    },
    php: {
        image: 'php:alpine',
        command: (path) => `php ${path}`,
        timeout: MAX_EXECUTION_TIME
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

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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
        console.log(`✅ ${existingImages.length} images already exist: ${existingImages.join(', ')}`);
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
        console.log(`📊 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount} succeeded, ${failCount} failed`);
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedImages = results.filter((r) => !r.success).map((r) => r.image);
        console.warn(`⚠️  Failed to pull ${totalFailed} images: ${failedImages.join(', ')}`);
        console.warn('   These images will be pulled on first use.');
    }

    console.log(`✨ Preload completed in ${elapsed}s: ${totalSuccess} succeeded, ${totalFailed} failed`);
}

function runDockerCommand(image, command, tmpfsSize, timeout = 10000) {
    if (!validateImage(image) || typeof command !== 'string' || typeof tmpfsSize !== 'string') {
        return Promise.reject(new Error('Invalid parameters'));
    }
    const escapedCommand = command.replace(/'/g, "'\\''").replace(/"/g, '\\"');
    const dockerCmd = `docker run --rm --memory=${tmpfsSize} --cpus=${MAX_CPU_PERCENT} --network=none --read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize} ${image} sh -c "${escapedCommand}"`;

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
            image: 'gcc:latest',
            command: 'gcc --version',
            tmpfsSize: '50m',
            timeout: 10000
        },
        {
            language: 'cpp',
            image: 'gcc:latest',
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
            image: 'rust:latest',
            command: 'rustc --version',
            tmpfsSize: '200m',
            timeout: 15000
        },
        {
            language: 'php',
            image: 'php:alpine',
            command: 'php -v',
            tmpfsSize: '50m',
            timeout: 5000
        }
    ];
}

async function warmupContainer(config) {
    try {
        const result = await runDockerCommand(config.image, config.command, config.tmpfsSize, config.timeout);
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

        return { success: false, language: config.language, error: errorMessage, fullError: errorInfo };
    }
}

async function warmupAllContainers() {
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
            console.log(`🔥 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount}/${batch.length} succeeded`);
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
        console.warn(`⚠️  Warmup failed for ${totalFailed} languages: ${failedLanguages.join(', ')}`);

        failedResults.forEach((result) => {
            const errorMsg = result.error || 'Unknown error';
            const maxLength = 200;
            const displayMsg = errorMsg.length > maxLength ? errorMsg.substring(0, maxLength) + '...' : errorMsg;
            console.warn(`   ${result.language}: ${displayMsg}`);
        });
    }

    if (totalSuccess > 0) {
        const avgElapsed =
            results.filter((r) => r.success).reduce((sum, r) => sum + (r.elapsed || 0), 0) / totalSuccess;
        console.log(
            `✨ Warmup completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded (avg: ${avgElapsed.toFixed(0)}ms)`
        );
    } else {
        console.log(`✨ Warmup completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded`);
    }
}

function warmupContainers() {
    warmupAllContainers().catch((error) => {
        console.error('Initial warmup error:', error);
    });

    const frequentLanguages = ['python', 'javascript', 'java', 'cpp'];
    const frequentConfigs = getWarmupConfigs().filter((config) => frequentLanguages.includes(config.language));

    setInterval(() => {
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
    return text
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
    return `/tmp/code${extension}`;
}

function convertToDockerPath(filePath) {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        throw new Error('Invalid file path');
    }
    return normalized;
}

function buildDockerCommand(language, hostCodePath) {
    if (!validateLanguage(language)) {
        throw new Error('Invalid language');
    }

    if (!validatePath(hostCodePath)) {
        throw new Error('Invalid file path');
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config || !validateImage(config.image)) {
        throw new Error('Invalid language configuration');
    }

    const extension = LANGUAGE_EXTENSIONS[language];
    const containerPath = getContainerCodePath(language, extension);
    const command = config.command(containerPath);
    const tmpfsSize = language === 'rust' ? '200m' : '50m';
    const dockerHostPath = convertToDockerPath(hostCodePath);

    if (dockerHostPath.includes(' ') || containerPath.includes(' ')) {
        throw new Error('Invalid path format: paths with spaces are not supported');
    }

    if (containerPath.includes(':')) {
        throw new Error('Invalid container path format');
    }

    const escapedCommand = command.replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/"/g, '\\"');
    const volumeMount = `${dockerHostPath}:${containerPath}:ro`;

    return `docker run --rm --memory=${MAX_MEMORY} --cpus=${MAX_CPU_PERCENT} --network=none --read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize},noatime -v ${volumeMount} ${config.image} sh -c "${escapedCommand}"`;
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
    const extension = LANGUAGE_EXTENSIONS[language];
    const fullPath = resolvedCodePath + extension;
    await fs.writeFile(fullPath, code, 'utf8');
    return fullPath;
}

function handleExecutionResult(error, stdout, stderr, executionTime, res) {
    const filteredStderr = filterDockerMessages(stderr || '');
    const hasStdout = stdout && stdout.trim().length > 0;

    if (error) {
        const errorMsg =
            error.killed || error.signal === 'SIGTERM'
                ? filteredStderr || 'Execution timeout exceeded'
                : sanitizeError(stderr || error.message);

        return res.json({
            output: stdout || '',
            error: errorMsg,
            executionTime
        });
    }

    res.json({
        output: hasStdout ? stdout : '',
        error: hasStdout ? '' : filteredStderr,
        executionTime
    });
}

app.post('/api/execute', executeLimiter, async (req, res) => {
    const { code, language } = req.body;
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
        return sendResponse(400, { error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` });
    }

    if (!validateLanguage(language)) {
        return sendResponse(400, { error: 'Unsupported language' });
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

        const dockerCommand = buildDockerCommand(language, fullCodePath);
        const config = LANGUAGE_CONFIGS[language];
        const startTime = Date.now();

        exec(
            dockerCommand,
            {
                timeout: config.timeout + 2000,
                maxBuffer: 1024 * 1024 * 2
            },
            async (error, stdout, stderr) => {
                const executionTime = Date.now() - startTime;
                await cleanupFile(fullCodePath);
                if (!responseSent) {
                    handleExecutionResult(error, stdout, stderr, executionTime, res);
                    responseSent = true;
                }
            }
        );
    } catch (error) {
        await cleanupFile(fullCodePath);
        const sanitizedError = sanitizeError(error);
        sendResponse(400, { error: sanitizedError });
    }
});

app.get('/api/health', healthLimiter, (req, res) => {
    res.json({ status: 'ok' });
});

app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err.message || 'Unknown error');
    res.status(500).json({ error: 'Internal server error' });
});

ensureDirectories().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        preloadDockerImages();
    });
    warmupContainers();
});
