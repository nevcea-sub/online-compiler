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
}

export const CONFIG: Config = {
    PORT: parseInt(process.env.PORT || '4000', 10),
    MAX_CODE_LENGTH: 100000,
    MAX_EXECUTION_TIME: MAX_EXECUTION_TIME,
    MAX_MEMORY: '256m',
    MAX_CPU_PERCENT: '2.0',
    MAX_CPU_PERCENT_KOTLIN: '3.0',
    MAX_OUTPUT_BYTES: parseInt(process.env.MAX_OUTPUT_BYTES || '1048576', 10),
    MAX_INPUT_LENGTH: parseInt(process.env.MAX_INPUT_LENGTH || '1000000', 10),
    ENABLE_PRELOAD: (process.env.ENABLE_PRELOAD || 'true').toLowerCase() === 'true',
    ENABLE_WARMUP: (process.env.ENABLE_WARMUP || 'true').toLowerCase() === 'true',
    TRUST_PROXY: (process.env.TRUST_PROXY || 'false').toLowerCase() === 'true',
    DEBUG_MODE: process.env.DEBUG
        ? process.env.DEBUG.toLowerCase() === 'true'
        : process.env.NODE_ENV !== 'production',
    TIMEOUT_BUFFER_MS: 2000,
    SIGKILL_DELAY_MS: 2000,
    MAX_BUFFER_SIZE: 2 * 1024 * 1024,
    DOCKER_CHECK_TIMEOUT: 3000,
    DOCKER_PULL_TIMEOUT: 300000,
    DOCKER_PULL_RETRIES: 2,
    DOCKER_PULL_RETRY_DELAY_BASE: 2000,
    PRELOAD_BATCH_SIZE: 3,
    WARMUP_BATCH_SIZE: 10,
    ERROR_MESSAGE_MAX_LENGTH: 200
};

const DEFAULT_WARMUP_TIMEOUTS: Record<string, number> = {
    python: 10000,
    javascript: 10000,
    c: 10000,
    cpp: 10000,
    java: 10000,
    rust: 10000,
    php: 8000,
    r: 10000,
    ruby: 8000,
    csharp: 8000,
    kotlin: 12000,
    go: 10000,
    typescript: 8000,
    swift: 12000,
    perl: 8000,
    haskell: 12000,
    bash: 8000
};

export const WARMUP_TIMEOUTS: Record<string, number> = (() => {
    const env = process.env.WARMUP_TIMEOUTS;
    if (!env) return DEFAULT_WARMUP_TIMEOUTS;
    try {
        const parsed = JSON.parse(env);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_WARMUP_TIMEOUTS, ...parsed };
        }
        return DEFAULT_WARMUP_TIMEOUTS;
    } catch (e) {
        console.warn('Invalid WARMUP_TIMEOUTS env var, using defaults');
        return DEFAULT_WARMUP_TIMEOUTS;
    }
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
    if (!env) return DEFAULT_TMPFS_SIZES;
    try {
        const parsed = JSON.parse(env);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_TMPFS_SIZES, ...parsed };
        }
        return DEFAULT_TMPFS_SIZES;
    } catch (e) {
        console.warn('Invalid TMPFS_SIZES env var, using defaults');
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
    if (!env) return DEFAULT_CPU_LIMITS;
    try {
        const parsed = JSON.parse(env);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_CPU_LIMITS, ...parsed };
        }
        return DEFAULT_CPU_LIMITS;
    } catch (e) {
        console.warn('Invalid CPU_LIMITS env var, using defaults');
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
    if (!env) return DEFAULT_EXECUTION_TIMEOUTS;
    try {
        const parsed = JSON.parse(env);
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_EXECUTION_TIMEOUTS, ...parsed };
        }
        return DEFAULT_EXECUTION_TIMEOUTS;
    } catch (e) {
        console.warn('Invalid EXECUTION_TIMEOUTS env var, using defaults');
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
        image: 'python:3.11-slim',
        command: buildPythonCommand
    },
    javascript: {
        image: 'node:20-slim',
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
        image: 'rust:1.81',
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
        image: 'mcr.microsoft.com/dotnet/sdk:8.0',
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
        image: 'node:20-slim',
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

export {
    KOTLIN_COMPILER_VERSION,
    KOTLIN_COMPILER_URL,
    KOTLIN_DOWNLOAD_CMD,
    KOTLIN_COMPILER_CHECK
};

