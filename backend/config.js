const MAX_EXECUTION_TIME = 10000;

const CONFIG = {
    PORT: process.env.PORT || 3000,
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
    WARMUP_BATCH_SIZE: 6,
    ERROR_MESSAGE_MAX_LENGTH: 200
};

const TMPFS_SIZES = {
    rust: '200m',
    kotlin: '200m',
    csharp: '100m',
    haskell: '150m',
    swift: '150m',
    default: '50m'
};

const CONTAINER_CODE_PATHS = {
    java: '/tmp/Main.java',
    csharp: '/tmp/Program.cs'
};

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
    kotlin: '.kt',
    go: '.go',
    typescript: '.ts',
    swift: '.swift',
    perl: '.pl',
    haskell: '.hs',
    bash: '.sh'
};

const LANGUAGE_CONFIGS = {
    python: {
        image: 'python:3.11-slim',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && export PYTHONPATH=/tmp PYTHONUNBUFFERED=1 && python3 -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" < "${tmpInputPath}" 2>&1 || python -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && export PYTHONPATH=/tmp PYTHONUNBUFFERED=1 && (python3 -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" 2>&1 || python -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" 2>&1)`;
            }
        },
        timeout: MAX_EXECUTION_TIME
    },
    javascript: {
        image: 'node:20-slim',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && node "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && node "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME
    },
    java: {
        image: 'eclipse-temurin:17-jdk-alpine',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && javac -J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1 "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && java -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -cp /tmp Main < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && javac -J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1 "${path}" 2>&1 && java -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -cp /tmp Main 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 2
    },
    cpp: {
        image: 'gcc:14',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && g++ -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && g++ -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && /tmp/a.out 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 2
    },
    c: {
        image: 'gcc:14',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && gcc -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && gcc -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && /tmp/a.out 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 2
    },
    rust: {
        image: 'rust:1.81',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && rustc -C opt-level=1 "${path}" -o /tmp/a.out 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && rustc -C opt-level=1 "${path}" -o /tmp/a.out 2>&1 && /tmp/a.out 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 3
    },
    php: {
        image: 'php:8.3-alpine',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && php "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && php "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME
    },
    r: {
        image: 'r-base:4.4.1',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && Rscript "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && Rscript "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME
    },
    ruby: {
        image: 'ruby:3.3-alpine',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && ruby "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && ruby "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME
    },
    csharp: {
        image: 'mcr.microsoft.com/dotnet/sdk:8.0',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && rm -rf Program 2>/dev/null && dotnet new console -n Program --force >/dev/null 2>&1 && cp ${path} Program/Program.cs && cp "${inputPath}" "${tmpInputPath}" && cd Program && dotnet build -c Release --no-restore -nologo -v q >/dev/null 2>&1 && dotnet exec bin/Release/net*/Program.dll < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && rm -rf Program 2>/dev/null && dotnet new console -n Program --force >/dev/null 2>&1 && cp ${path} Program/Program.cs && cd Program && dotnet build -c Release --no-restore -nologo -v q >/dev/null 2>&1 && dotnet exec bin/Release/net*/Program.dll 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 2
    },
    kotlin: {
        image: 'eclipse-temurin:17-jdk-alpine',
        command: (path, inputPath, buildDir) => {
            const jvmOpts =
                '-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xms64m -Xmx256m -XX:ReservedCodeCacheSize=32m -XX:InitialCodeCacheSize=16m -XX:+UseStringDeduplication -XX:+OptimizeStringConcat';
            const kotlinOpts =
                '-Xjvm-default=all -Xno-param-assertions -Xno-call-assertions -Xno-receiver-assertions';
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && export JAVA_TOOL_OPTIONS="${jvmOpts}" && if [ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]; then cd /tmp && (busybox wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip || wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin; fi && mkdir -p ${buildDir}/out && java ${jvmOpts} -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ${kotlinOpts} -d ${buildDir}/out "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && java ${jvmOpts} -cp "${buildDir}/out:/opt/kotlin/kotlinc/lib/*" CodeKt < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && export JAVA_TOOL_OPTIONS="${jvmOpts}" && if [ ! -f /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ]; then cd /tmp && (busybox wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip || wget -q https://github.com/JetBrains/kotlin/releases/download/v2.0.21/kotlin-compiler-2.0.21.zip -O kotlin.zip) && jar xf kotlin.zip && mkdir -p /opt/kotlin && mv kotlinc /opt/kotlin; fi && mkdir -p ${buildDir}/out && java ${jvmOpts} -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ${kotlinOpts} -d ${buildDir}/out "${path}" 2>&1 && java ${jvmOpts} -cp "${buildDir}/out:/opt/kotlin/kotlinc/lib/*" CodeKt 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 3
    },
    go: {
        image: 'golang:1.23-alpine',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && export GOCACHE=/tmp/.cache/go-build && export HOME=/tmp && cp "${inputPath}" "${tmpInputPath}" && go run "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && export GOCACHE=/tmp/.cache/go-build && export HOME=/tmp && go run "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 2
    },
    typescript: {
        image: 'node:20-slim',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && export HOME=/tmp && export npm_config_cache=/tmp/.npm && cp "${inputPath}" "${tmpInputPath}" && npx -y tsx "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && export HOME=/tmp && export npm_config_cache=/tmp/.npm && npx -y tsx "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 2
    },
    swift: {
        image: 'swift:5.10',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && export HOME=/tmp && cp "${inputPath}" "${tmpInputPath}" && swift "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && export HOME=/tmp && swift "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 2
    },
    perl: {
        image: 'perl:5.40-slim',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && perl "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && perl "${path}" 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME
    },
    haskell: {
        image: 'haskell:9.6',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && ghc -o /tmp/a.out "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && ghc -o /tmp/a.out "${path}" 2>&1 && /tmp/a.out 2>&1`;
            }
        },
        timeout: MAX_EXECUTION_TIME * 3
    },
    bash: {
        image: 'alpine:3.19',
        command: (path, inputPath) => {
            if (inputPath) {
                const tmpInputPath = '/tmp/input.txt';
                return `cd /tmp && apk add --no-cache --cache-dir /tmp/apk-cache bash >/dev/null 2>&1 && cp "${inputPath}" "${tmpInputPath}" && bash "${path}" < "${tmpInputPath}" 2>&1`;
            } else {
                return `cd /tmp && apk add --no-cache --cache-dir /tmp/apk-cache bash >/dev/null 2>&1 && bash "${path}" 2>&1`;
            }
        },
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

const DEBUG_PATTERNS = [
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

module.exports = {
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
};
