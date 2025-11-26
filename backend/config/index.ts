import {
    buildPythonCommand,
    buildJavascriptCommand,
    buildJavaCommand,
    buildCppCommand,
    buildCCommand,
    buildRustCommand,
    buildPhpCommand,
    buildRCommand,
    buildRubyCommand,
    buildCsharpCommand,
    buildGoCommand,
    buildTypescriptCommand,
    buildSwiftCommand,
    buildPerlCommand,
    buildHaskellCommand,
    buildBashCommand
} from './languageCommands';
import { Env } from '../utils/envValidation';
import { createLogger } from '../utils/logger';
import { WARMUP_TIMEOUT_DEFAULTS } from '../utils/constants';

const logger = createLogger('Config');

const MAX_EXECUTION_TIME = 10000;

const KOTLIN_COMPILER_VERSION = '2.0.21';
const KOTLIN_COMPILER_URL = `https://github.com/JetBrains/kotlin/releases/download/v${KOTLIN_COMPILER_VERSION}/kotlin-compiler-${KOTLIN_COMPILER_VERSION}.zip`;
const KOTLIN_DOWNLOAD_CMD = `cd /tmp && (busybox wget -q --timeout=10 --tries=2 ${KOTLIN_COMPILER_URL} -O kotlin.zip || wget -q --timeout=10 --tries=2 ${KOTLIN_COMPILER_URL} -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin`;
const KOTLIN_COMPILER_CHECK = '[ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]';

export interface Config {
    PORT: number;
    MAX_CODE_LENGTH: number;
    MAX_EXECUTION_TIME: number;
    MAX_MEMORY: string;
    MAX_CPU_PERCENT: string;
    MAX_CPU_PERCENT_KOTLIN: string;
    MAX_OUTPUT_BYTES: number;
    MAX_INPUT_LENGTH: number;
    ENABLE_PRELOAD: boolean;
    ENABLE_WARMUP: boolean;
    ENABLE_CONTAINER_POOL: boolean;
    ENABLE_CONTAINER_POOL_DEBUG: boolean;
    TRUST_PROXY: boolean;
    DEBUG_MODE: boolean;
    TIMEOUT_BUFFER_MS: number;
    SIGKILL_DELAY_MS: number;
    MAX_BUFFER_SIZE: number;
    DOCKER_CHECK_TIMEOUT: number;
    DOCKER_PULL_TIMEOUT: number;
    DOCKER_PULL_RETRIES: number;
    DOCKER_PULL_RETRY_DELAY_BASE: number;
    PRELOAD_BATCH_SIZE: number;
    WARMUP_BATCH_SIZE: number;
    ERROR_MESSAGE_MAX_LENGTH: number;
    ENABLE_CLEANUP: boolean;
    CLEANUP_INTERVAL_MS: number;
    SESSION_MAX_AGE_MS: number;
    ENABLE_CACHE: boolean;
    MAX_CONCURRENT_EXECUTIONS: number;
    MAX_QUEUE_SIZE: number;
}

export const CONFIG: Config = {
    PORT: Env.integer('PORT', 4000, 1, 65535),
    MAX_CODE_LENGTH: 100000,
    MAX_EXECUTION_TIME: MAX_EXECUTION_TIME,
    MAX_MEMORY: Env.memory('MAX_MEMORY', '256m'),
    MAX_CPU_PERCENT: Env.cpu('MAX_CPU_PERCENT', '2.0'),
    MAX_CPU_PERCENT_KOTLIN: Env.cpu('MAX_CPU_PERCENT_KOTLIN', '3.0'),
    MAX_OUTPUT_BYTES: Env.integer('MAX_OUTPUT_BYTES', 1048576, 1024, 100 * 1024 * 1024),
    MAX_INPUT_LENGTH: Env.integer('MAX_INPUT_LENGTH', 1000000, 1, 10 * 1000000),
    ENABLE_PRELOAD: Env.boolean('ENABLE_PRELOAD', true),
    ENABLE_WARMUP: Env.boolean('ENABLE_WARMUP', true),
    ENABLE_CONTAINER_POOL: Env.boolean('ENABLE_CONTAINER_POOL', true),
    ENABLE_CONTAINER_POOL_DEBUG: Env.boolean('ENABLE_CONTAINER_POOL_DEBUG', false),
    TRUST_PROXY: Env.boolean('TRUST_PROXY', false),
    DEBUG_MODE: process.env.DEBUG ? Env.boolean('DEBUG', false) : false,
    TIMEOUT_BUFFER_MS: Env.integer('TIMEOUT_BUFFER_MS', 2000, 0, 60000),
    SIGKILL_DELAY_MS: Env.integer('SIGKILL_DELAY_MS', 2000, 0, 60000),
    MAX_BUFFER_SIZE: Env.integer('MAX_BUFFER_SIZE', 2 * 1024 * 1024, 1024, 100 * 1024 * 1024),
    DOCKER_CHECK_TIMEOUT: Env.integer('DOCKER_CHECK_TIMEOUT', 3000, 1000, 60000),
    DOCKER_PULL_TIMEOUT: Env.integer('DOCKER_PULL_TIMEOUT', 300000, 10000, 1800000),
    DOCKER_PULL_RETRIES: Env.integer('DOCKER_PULL_RETRIES', 2, 0, 10),
    DOCKER_PULL_RETRY_DELAY_BASE: Env.integer('DOCKER_PULL_RETRY_DELAY_BASE', 2000, 100, 60000),
    PRELOAD_BATCH_SIZE: Env.integer('PRELOAD_BATCH_SIZE', 3, 1, 20),
    WARMUP_BATCH_SIZE: Env.integer('WARMUP_BATCH_SIZE', 10, 1, 50),
    ERROR_MESSAGE_MAX_LENGTH: Env.integer('ERROR_MESSAGE_MAX_LENGTH', 200, 50, 10000),
    ENABLE_CLEANUP: Env.boolean('ENABLE_CLEANUP', true),
    CLEANUP_INTERVAL_MS: Env.integer('CLEANUP_INTERVAL_MS', 60 * 60 * 1000, 5 * 60 * 1000, 24 * 60 * 60 * 1000),
    SESSION_MAX_AGE_MS: Env.integer('SESSION_MAX_AGE_MS', 24 * 60 * 60 * 1000, 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000),
    ENABLE_CACHE: Env.boolean('ENABLE_CACHE', true),
    MAX_CONCURRENT_EXECUTIONS: Env.integer('MAX_CONCURRENT_EXECUTIONS', 5, 1, 50),
    MAX_QUEUE_SIZE: Env.integer('MAX_QUEUE_SIZE', 50, 10, 500)
};

export function validateConfig(): void {
    if (CONFIG.MAX_CODE_LENGTH < 1) {
        throw new Error(`MAX_CODE_LENGTH must be >= 1, got: ${CONFIG.MAX_CODE_LENGTH}`);
    }
    if (CONFIG.MAX_EXECUTION_TIME < 1000) {
        throw new Error(`MAX_EXECUTION_TIME must be >= 1000ms, got: ${CONFIG.MAX_EXECUTION_TIME}`);
    }
    if (CONFIG.TIMEOUT_BUFFER_MS >= CONFIG.MAX_EXECUTION_TIME) {
        throw new Error(
            `TIMEOUT_BUFFER_MS (${CONFIG.TIMEOUT_BUFFER_MS}) should be less than MAX_EXECUTION_TIME (${CONFIG.MAX_EXECUTION_TIME})`
        );
    }
    if (CONFIG.SIGKILL_DELAY_MS >= CONFIG.MAX_EXECUTION_TIME) {
        throw new Error(
            `SIGKILL_DELAY_MS (${CONFIG.SIGKILL_DELAY_MS}) should be less than MAX_EXECUTION_TIME (${CONFIG.MAX_EXECUTION_TIME})`
        );
    }
    if (CONFIG.CLEANUP_INTERVAL_MS < 5 * 60 * 1000) {
        throw new Error(`CLEANUP_INTERVAL_MS (${CONFIG.CLEANUP_INTERVAL_MS}) should be at least 5 minutes`);
    }
    if (CONFIG.SESSION_MAX_AGE_MS < 60 * 60 * 1000) {
        throw new Error(`SESSION_MAX_AGE_MS (${CONFIG.SESSION_MAX_AGE_MS}) should be at least 1 hour`);
    }
}

const WARMUP_TIMEOUT_DEFAULT = Env.integer('WARMUP_TIMEOUT_DEFAULT', WARMUP_TIMEOUT_DEFAULTS.DEFAULT, 1000, 300000);

const DEFAULT_WARMUP_TIMEOUTS: Record<string, number> = {
    python: WARMUP_TIMEOUT_DEFAULT,
    javascript: WARMUP_TIMEOUT_DEFAULT,
    c: WARMUP_TIMEOUT_DEFAULT,
    cpp: WARMUP_TIMEOUT_DEFAULT,
    java: WARMUP_TIMEOUT_DEFAULT,
    rust: WARMUP_TIMEOUT_DEFAULT,
    php: WARMUP_TIMEOUT_DEFAULTS.PHP,
    r: WARMUP_TIMEOUT_DEFAULT,
    ruby: WARMUP_TIMEOUT_DEFAULTS.RUBY,
    csharp: WARMUP_TIMEOUT_DEFAULTS.CSHARP,
    kotlin: WARMUP_TIMEOUT_DEFAULTS.KOTLIN,
    go: WARMUP_TIMEOUT_DEFAULT,
    typescript: WARMUP_TIMEOUT_DEFAULTS.TYPESCRIPT,
    swift: WARMUP_TIMEOUT_DEFAULTS.SWIFT,
    perl: WARMUP_TIMEOUT_DEFAULTS.PERL,
    haskell: WARMUP_TIMEOUT_DEFAULTS.HASKELL,
    bash: WARMUP_TIMEOUT_DEFAULTS.BASH
};

export const WARMUP_TIMEOUTS: Record<string, number> = (() => {
    const timeouts = { ...DEFAULT_WARMUP_TIMEOUTS };

    if (process.env.WARMUP_TIMEOUT_DEFAULT) {
        for (const key in timeouts) {
            if (Object.prototype.hasOwnProperty.call(timeouts, key)) {
                timeouts[key] = WARMUP_TIMEOUT_DEFAULT;
            }
        }
    }

    const envJson = process.env.WARMUP_TIMEOUTS;
    if (envJson) {
        try {
            const parsed = JSON.parse(envJson);
            if (typeof parsed === 'object' && parsed !== null) {
                Object.assign(timeouts, parsed);
            }
        } catch {
            logger.warn('Invalid WARMUP_TIMEOUTS env var, using defaults');
        }
    }

    for (const key in timeouts) {
        if (Object.prototype.hasOwnProperty.call(timeouts, key)) {
            const envVarName = `WARMUP_TIMEOUT_${key.toUpperCase()}`;
            const val = Env.integer(envVarName, 0, 0, 300000);
            if (val > 0) {
                timeouts[key] = val;
            }
        }
    }

    return timeouts;
})();

const DEFAULT_TMPFS_SIZES: Record<string, string> = {
    rust: '200m',
    kotlin: '200m',
    csharp: '100m',
    haskell: '150m',
    swift: '150m',
    go: '200m',
    default: '50m'
};

export const TMPFS_SIZES: Record<string, string> = (() => {
    const env = process.env.TMPFS_SIZES;
    if (!env) {
        return DEFAULT_TMPFS_SIZES;
    }
    try {
        const parsed = JSON.parse(env);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_TMPFS_SIZES, ...parsed };
        }
        return DEFAULT_TMPFS_SIZES;
    } catch {
        logger.warn('Invalid TMPFS_SIZES env var, using defaults');
        return DEFAULT_TMPFS_SIZES;
    }
})();

const DEFAULT_CPU_LIMITS: Record<string, string> = {
    python: '2.0',
    javascript: '2.0',
    php: '2.0',
    r: '2.0',
    ruby: '2.0',
    c: '3.0',
    cpp: '3.0',
    java: '3.0',
    csharp: '3.0',
    rust: '3.0',
    go: '3.0',
    haskell: '3.0',
    swift: '3.0',
    typescript: '2.5',
    bash: '1.0',
    kotlin: '3.0'
};

export const CPU_LIMITS: Record<string, string> = (() => {
    const env = process.env.CPU_LIMITS;
    if (!env) {
        return DEFAULT_CPU_LIMITS;
    }
    try {
        const parsed = JSON.parse(env);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_CPU_LIMITS, ...parsed };
        }
        return DEFAULT_CPU_LIMITS;
    } catch {
        logger.warn('Invalid CPU_LIMITS env var, using defaults');
        return DEFAULT_CPU_LIMITS;
    }
})();

const DEFAULT_EXECUTION_TIMEOUTS: Record<string, number> = {
    python: MAX_EXECUTION_TIME,
    javascript: MAX_EXECUTION_TIME,
    c: MAX_EXECUTION_TIME,
    cpp: MAX_EXECUTION_TIME,
    java: MAX_EXECUTION_TIME,
    rust: MAX_EXECUTION_TIME,
    php: MAX_EXECUTION_TIME,
    r: MAX_EXECUTION_TIME,
    ruby: MAX_EXECUTION_TIME,
    csharp: MAX_EXECUTION_TIME,
    kotlin: MAX_EXECUTION_TIME,
    go: MAX_EXECUTION_TIME,
    typescript: MAX_EXECUTION_TIME,
    swift: MAX_EXECUTION_TIME,
    perl: MAX_EXECUTION_TIME,
    haskell: MAX_EXECUTION_TIME,
    bash: MAX_EXECUTION_TIME
};

export const EXECUTION_TIMEOUTS: Record<string, number> = (() => {
    const env = process.env.EXECUTION_TIMEOUTS;
    if (!env) {
        return DEFAULT_EXECUTION_TIMEOUTS;
    }
    try {
        const parsed = JSON.parse(env);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_EXECUTION_TIMEOUTS, ...parsed };
        }
        return DEFAULT_EXECUTION_TIMEOUTS;
    } catch {
        logger.warn('Invalid EXECUTION_TIMEOUTS env var, using defaults');
        return DEFAULT_EXECUTION_TIMEOUTS;
    }
})();

export const CONTAINER_CODE_PATHS: Record<string, string> = {
    java: '/tmp/Main.java',
    csharp: '/tmp/Program.cs'
};

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
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
    kotlin: '.kt',
    go: '.go',
    typescript: '.ts',
    swift: '.swift',
    perl: '.pl',
    haskell: '.hs',
    bash: '.sh'
};

export interface LanguageConfig {
    image: string;
    command: (path: string, inputPath?: string, buildDir?: string) => string;
    timeout: number;
}

function buildKotlinCommand(path: string, inputPath?: string, buildDir?: string): string {
    const jvmOpts =
        '-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xms32m -Xmx128m -XX:ReservedCodeCacheSize=16m -XX:InitialCodeCacheSize=8m -XX:+OptimizeStringConcat -XX:+UseCompressedOops -XX:+UseCompressedClassPointers';
    const kotlinOpts =
        '-Xjvm-default=all -Xno-param-assertions -Xno-call-assertions -Xno-receiver-assertions -Xskip-prerelease-check';
    const kotlinSetup = `if ${KOTLIN_COMPILER_CHECK}; then ${KOTLIN_DOWNLOAD_CMD}; fi`;
    const outDir = buildDir || '/tmp/kbuild';
    const compileCmd = `mkdir -p ${outDir}/out && java ${jvmOpts} -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ${kotlinOpts} -d ${outDir}/out "${path}" 2>&1`;

    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && ${kotlinSetup} && ${compileCmd} && cp "${inputPath}" "${tmpInputPath}" && java ${jvmOpts} -cp "${outDir}/out:/opt/kotlin/kotlinc/lib/*" CodeKt < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && ${kotlinSetup} && ${compileCmd} && java ${jvmOpts} -cp "${outDir}/out:/opt/kotlin/kotlinc/lib/*" CodeKt 2>&1`;
    }
}

const BASE_LANGUAGE_CONFIGS: Record<string, Omit<LanguageConfig, 'timeout'>> = {
    python: {
        image: 'python:3.11-alpine',
        command: buildPythonCommand
    },
    javascript: {
        image: 'node:20-alpine',
        command: buildJavascriptCommand
    },
    java: {
        image: 'eclipse-temurin:17-jdk-alpine',
        command: buildJavaCommand
    },
    cpp: {
        image: 'gcc:14',
        command: buildCppCommand
    },
    c: {
        image: 'gcc:14',
        command: buildCCommand
    },
    rust: {
        image: 'rust:alpine',
        command: buildRustCommand
    },
    php: {
        image: 'php:8.3-alpine',
        command: buildPhpCommand
    },
    r: {
        image: 'r-base:4.4.1',
        command: buildRCommand
    },
    ruby: {
        image: 'ruby:3.3-alpine',
        command: buildRubyCommand
    },
    csharp: {
        image: 'mcr.microsoft.com/dotnet/sdk:8.0-alpine3.19',
        command: buildCsharpCommand
    },
    kotlin: {
        image: 'eclipse-temurin:17-jdk-alpine',
        command: (path, inputPath, buildDir) => buildKotlinCommand(path, inputPath, buildDir)
    },
    go: {
        image: 'golang:1.23-alpine',
        command: buildGoCommand
    },
    typescript: {
        image: 'node:20-alpine',
        command: buildTypescriptCommand
    },
    swift: {
        image: 'swift:5.10',
        command: buildSwiftCommand
    },
    perl: {
        image: 'perl:5.40-slim',
        command: buildPerlCommand
    },
    haskell: {
        image: 'haskell:9.6',
        command: buildHaskellCommand
    },
    bash: {
        image: 'bash:5.2',
        command: buildBashCommand
    }
};

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = Object.fromEntries(
    Object.entries(BASE_LANGUAGE_CONFIGS).map(([language, cfg]) => [
        language,
        {
            ...cfg,
            timeout: EXECUTION_TIMEOUTS[language] ?? MAX_EXECUTION_TIME
        }
    ])
) as Record<string, LanguageConfig>;

export const ALLOWED_LANGUAGES = Object.keys(LANGUAGE_EXTENSIONS);
export const ALLOWED_IMAGES = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);

export const DANGEROUS_PATTERNS = [
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
    /umount/gi,
    /\bnc\b/gi,
    /netcat/gi,
    /\bnmap\b/gi,
    /iptables/gi,
    /systemctl/gi,
    /\bservice\b/gi,
    /\bpasswd\b/gi,
    /\buseradd\b/gi,
    /\badduser\b/gi,
    /\buserdel\b/gi,
    /\bgroupadd\b/gi,
    /\bgroupdel\b/gi,
    /\busermod\b/gi,
    /\bchpasswd\b/gi,
    /\bssh-keygen\b/gi,
    /\bssh-add\b/gi,
    /sshd/gi,
    /crontab\s/gi,
    /\/etc\/passwd/gi,
    /\/etc\/shadow/gi,
    /\/root(\/|$)/gi,
    /\/boot(\/|$)/gi,
    /proc\/sys\/kernel/gi,
    /sys\//gi,
    /dev\/mem/gi,
    /dev\/zero/gi,
    /dev\/random/gi,
    /wipefs/gi,
    /mknod/gi,
    /modprobe/gi,
    /insmod/gi,
    /rmmod/gi,
    /bash\s+-i/gi,
    /exec\s+\/bin\/bash/gi,
    /curl\s+.*\|\s*sh/gi,
    /wget\s+.*\|\s*sh/gi,
    /:\(\)\s*\{\s*:\|:\s*&\s*\};\s*:/gi,
    /`.*`/gi,
    /\$\(.+\)/gi
];

export const DOCKER_PULL_MESSAGES = [
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

export const DEBUG_PATTERNS = [
    /^\[DEBUG\].*/i,
    /^DEBUG:.*/i,
    /^Checking source file:.*/i,
    /^Copying file to.*/i,
    /^Verifying copied file.*/i,
    /^File copy successful.*/i,
    /^Checking input file:.*/i,
    /^ERROR: Source file not found:.*/i,
    /^ERROR: Destination file not found after copy:.*/i,
    /^ERROR: Destination file is empty:.*/i,
    /^ERROR: Input file not found:.*/i,
    /^ERROR: Copy failed.*/i,
    /^ERROR: Runtime file not found:.*/i
];

export { KOTLIN_COMPILER_VERSION, KOTLIN_COMPILER_URL, KOTLIN_DOWNLOAD_CMD, KOTLIN_COMPILER_CHECK };
