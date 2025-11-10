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

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

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

function escapeShellArg(arg) {
    if (typeof arg !== 'string') {
        return '';
    }
    return `'${arg.replace(/'/g, "'\\''")}'`;
}

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

function validatePath(filePath) {
    if (typeof filePath !== 'string') {
        return false;
    }
    const resolved = path.resolve(filePath);
    const codeDirResolved = path.resolve(codeDir);
    return resolved.startsWith(codeDirResolved);
}

function checkImageExists(image) {
    if (!validateImage(image)) {
        return Promise.resolve(false);
    }
    return new Promise((resolve) => {
        const escapedImage = escapeShellArg(image);
        exec(`docker images -q ${escapedImage}`, (error, stdout) => {
            if (error) {
                resolve(false);
                return;
            }
            resolve(stdout.trim().length > 0);
        });
    });
}

async function preloadDockerImages() {
    console.log('Preloading Docker images...');
    const images = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);
    const uniqueImages = [...new Set(images)];

    const pullPromises = uniqueImages.map(async (image) => {
        if (!validateImage(image)) {
            return;
        }
        const exists = await checkImageExists(image);
        if (!exists) {
            console.log(`Pulling ${image}...`);
            return new Promise((resolve) => {
                const escapedImage = escapeShellArg(image);
                exec(`docker pull ${escapedImage}`, (error) => {
                    if (error) {
                        console.error(`Failed to pull ${image}:`, error.message);
                    } else {
                        console.log(`Successfully pulled ${image}`);
                    }
                    resolve();
                });
            });
        }
        console.log(`${image} already exists`);
    });

    await Promise.all(pullPromises);
    console.log('All images preloaded');
}

function runDockerCommand(image, command, tmpfsSize) {
    if (!validateImage(image) || typeof command !== 'string' || typeof tmpfsSize !== 'string') {
        return;
    }
    const escapedImage = escapeShellArg(image);
    const escapedCommand = escapeShellArg(command);
    const escapedTmpfsSize = escapeShellArg(tmpfsSize);
    const dockerCmd = `docker run --rm --memory=${escapedTmpfsSize} --cpus=${MAX_CPU_PERCENT} --network=none --read-only --tmpfs /tmp:rw,exec,nosuid,size=${escapedTmpfsSize} ${escapedImage} sh -c ${escapedCommand}`;
    exec(dockerCmd, () => {});
}

function warmupContainers() {
    const warmups = [
        { image: 'python:3.11-slim', command: 'python -c "print(\'warmup\')"', tmpfsSize: '50m' },
        { image: 'node:20-slim', command: 'node -e "console.log(\'warmup\')"', tmpfsSize: '50m' },
        {
            image: 'gcc:latest',
            command: 'echo "int main(){return 0;}" > /tmp/warmup.c && gcc -o /tmp/warmup /tmp/warmup.c && /tmp/warmup',
            tmpfsSize: '50m'
        },
        { image: 'php:alpine', command: 'php -r "echo \\"warmup\\n\\";"', tmpfsSize: '50m' },
        {
            image: 'eclipse-temurin:17-jdk-alpine',
            command:
                'echo "public class Main{public static void main(String[]a){System.out.println(\\"warmup\\");}}" > /tmp/Main.java && javac /tmp/Main.java && java -cp /tmp Main',
            tmpfsSize: '50m'
        }
    ];

    warmups.forEach(({ image, command, tmpfsSize }) => {
        runDockerCommand(image, command, tmpfsSize);
    });

    setInterval(() => {
        warmups.slice(0, 2).forEach(({ image, command, tmpfsSize }) => {
            runDockerCommand(image, command, tmpfsSize);
        });
    }, 30000);
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
    const normalizedHostPath = path.resolve(hostCodePath);

    const escapedImage = escapeShellArg(config.image);
    const escapedHostPath = escapeShellArg(normalizedHostPath);
    const escapedContainerPath = escapeShellArg(containerPath);
    const escapedCommand = escapeShellArg(command);
    const escapedTmpfsSize = escapeShellArg(tmpfsSize);
    const escapedMemory = escapeShellArg(MAX_MEMORY);

    return `docker run --rm --memory=${escapedMemory} --cpus=${MAX_CPU_PERCENT} --network=none --read-only --tmpfs /tmp:rw,exec,nosuid,size=${escapedTmpfsSize},noatime -v ${escapedHostPath}:${escapedContainerPath}:ro ${escapedImage} sh -c ${escapedCommand}`;
}

function validateJavaClass(code) {
    if (typeof code !== 'string') {
        throw new Error('Invalid code format');
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

    const resolvedCodePath = path.resolve(codePath);
    if (!resolvedCodePath.startsWith(path.resolve(codeDir))) {
        throw new Error('Invalid code path');
    }

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

    if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
    }

    if (typeof code !== 'string' || typeof language !== 'string') {
        return res.status(400).json({ error: 'Invalid input format' });
    }

    if (code.length > MAX_CODE_LENGTH) {
        return res.status(400).json({ error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` });
    }

    if (!validateLanguage(language)) {
        return res.status(400).json({ error: 'Unsupported language' });
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
                handleExecutionResult(error, stdout, stderr, executionTime, res);
            }
        );
    } catch (error) {
        await cleanupFile(fullCodePath);
        const sanitizedError = sanitizeError(error);
        res.status(400).json({ error: sanitizedError });
    }
});

app.get('/api/health', healthLimiter, (req, res) => {
    res.json({ status: 'ok' });
});

app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

ensureDirectories().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        preloadDockerImages();
    });
    warmupContainers();
});
