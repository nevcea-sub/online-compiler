import { DOCKER_PULL_MESSAGES, DEBUG_PATTERNS } from '../config';

const ESC = String.fromCharCode(27);
const ANSI_REGEX = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, 'g');
const DOCKER_PULL_MESSAGES_SET = new Set(DOCKER_PULL_MESSAGES.map((msg) => msg.toLowerCase()));
const FILE_PATH_REGEX = /\/[^\s]+/g;
const WINDOWS_PATH_REGEX = /[A-Z]:\\[^\s]+/gi;
const STACK_TRACE_REGEX = /(.*?)(\n\s+at\s+.*)/s;
const FILE_PATH_PLACEHOLDER_REGEX = /^\[file path\]$/;
const DEBUG_PREFIX_REGEX = /^\[DEBUG\]|^DEBUG:/;

const DEFAULT_ERROR_MESSAGE = 'An error occurred during execution.';
const DEFAULT_SANITIZED_ERROR_MESSAGE = '실행 중 오류가 발생했습니다.';
const TRUNCATE_LENGTH_ERROR = 500;
const TRUNCATE_LENGTH_SANITIZED = 300;
const MAX_ERROR_LINES = 10;
const MIN_ERROR_LINE_LENGTH = 5;
const MAX_ERROR_LINE_LENGTH = 200;
const MAX_CACHEABLE_ERROR_LENGTH = 1000;

const ERROR_PATTERN_DOCKER = /docker:\s*(.+?)(?:\n|$)/i;
const ERROR_PATTERN_ERROR = /error[:\s]+(.+?)(?:\n|$)/i;
const ERROR_PATTERN_INVALID = /invalid[:\s]+(.+?)(?:\n|$)/i;
const ERROR_PATTERN_UNKNOWN = /unknown[:\s]+(.+?)(?:\n|$)/i;
const ERROR_PATTERN_FAILED = /failed[:\s]+(.+?)(?:\n|$)/i;
const ERROR_PATTERN_CANNOT = /cannot[:\s]+(.+?)(?:\n|$)/i;
const DOCKER_PREFIX_CLEAN = /^docker:\s*/i;

const ERROR_PATTERNS = [
    ERROR_PATTERN_DOCKER,
    ERROR_PATTERN_ERROR,
    ERROR_PATTERN_INVALID,
    ERROR_PATTERN_UNKNOWN,
    ERROR_PATTERN_FAILED,
    ERROR_PATTERN_CANNOT
];

const DOCKER_PREFIX_REGEX = /docker:.*/gi;
const DOCKER_DAEMON_REGEX = /Error response from daemon.*/gi;
const DOCKER_HELP_REGEX = /Run 'docker run --help'.*/gi;

function truncateString(str: string, maxLength: number): string {
    if (str.length > maxLength) {
        return str.substring(0, maxLength) + '...';
    }
    return str;
}

interface DockerErrorCheck {
    patterns: string[];
    message: string;
}

const DOCKER_ERROR_CHECKS: DockerErrorCheck[] = [
    {
        patterns: [
            'cannot connect to the docker daemon',
            'is the docker daemon running',
            'docker daemon',
            'not running'
        ],
        message: 'Docker가 실행되지 않았습니다. Docker Desktop을 시작한 후 다시 시도해주세요.'
    },
    {
        patterns: ["'docker' is not recognized", 'docker: command not found', 'spawn docker enoent'],
        message: 'Docker가 설치되지 않았습니다. Docker를 설치한 후 다시 시도해주세요.'
    },
    {
        patterns: ['no such image', 'pull access denied', 'repository does not exist'],
        message: 'Docker 이미지를 찾을 수 없습니다. 필요한 이미지를 다운로드 중입니다. 잠시 후 다시 시도해주세요.'
    },
    {
        patterns: ['permission denied'],
        message: 'Docker 권한 오류가 발생했습니다. Docker 권한을 확인해주세요.'
    },
    {
        patterns: ['docker: invalid reference format', 'invalid reference format'],
        message: 'Docker 명령어 형식 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
];

const DOCKER_ERROR_CHECKS_LOWER: Array<{ patterns: string[]; message: string }> = DOCKER_ERROR_CHECKS.map((check) => ({
    patterns: check.patterns.map((p) => p.toLowerCase()),
    message: check.message
}));

interface CachedError {
    result: string;
    timestamp: number;
}

const ERROR_CACHE = new Map<string, CachedError>();
const ERROR_CACHE_MAX_SIZE = 100;
const ERROR_CACHE_TTL = 5 * 60 * 1000;

function getCachedError(errorStr: string): string | null {
    const cached = ERROR_CACHE.get(errorStr);
    if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < ERROR_CACHE_TTL) {
            return cached.result;
        }
        ERROR_CACHE.delete(errorStr);
    }
    return null;
}

function setCachedError(errorStr: string, result: string): void {
    if (ERROR_CACHE.size >= ERROR_CACHE_MAX_SIZE) {
        const firstKey = ERROR_CACHE.keys().next().value;
        if (firstKey !== undefined) {
            ERROR_CACHE.delete(firstKey);
        }
    }
    ERROR_CACHE.set(errorStr, { result, timestamp: Date.now() });
}

function tryCacheResult(errorStr: string, result: string): void {
    if (errorStr.length <= MAX_CACHEABLE_ERROR_LENGTH) {
        setCachedError(errorStr, result);
    }
}

function resetRegexLastIndex(...regexes: RegExp[]): void {
    for (let i = 0; i < regexes.length; i++) {
        regexes[i].lastIndex = 0;
    }
}

function filterErrorLines(lines: string[]): string[] {
    const filtered: string[] = [];
    for (let i = 0; i < lines.length && filtered.length < MAX_ERROR_LINES; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
            continue;
        }
        if (DEBUG_PREFIX_REGEX.test(trimmed)) {
            continue;
        }
        if (FILE_PATH_PLACEHOLDER_REGEX.test(trimmed)) {
            continue;
        }
        if (trimmed.includes("Run 'docker") || trimmed.includes('for more information')) {
            continue;
        }
        filtered.push(lines[i]);
    }
    return filtered;
}

function checkDockerError(errorStr: string): string | null {
    const lowerError = errorStr.toLowerCase();

    for (let i = 0; i < DOCKER_ERROR_CHECKS_LOWER.length; i++) {
        const check = DOCKER_ERROR_CHECKS_LOWER[i];
        const patterns = check.patterns;
        let found = false;

        for (let j = 0; j < patterns.length; j++) {
            if (lowerError.includes(patterns[j])) {
                found = true;
                break;
            }
        }

        if (found) {
            if (patterns[0] === 'permission denied' && !lowerError.includes('docker')) {
                continue;
            }
            return check.message;
        }
    }
    return null;
}

function extractErrorFromDockerHelpMessage(errorStr: string): string | null {
    const originalLower = errorStr.toLowerCase();
    const hasRunDocker = originalLower.includes("run 'docker");
    const hasHelp = originalLower.includes('--help');
    if (!hasRunDocker && !hasHelp) {
        return null;
    }

    const originalLines = errorStr.split('\n');
    const linesLen = originalLines.length;
    const maxCheck = Math.min(linesLen, 20);

    for (let i = 0; i < maxCheck; i++) {
        const line = originalLines[i];
        const trimmed = line.trim();
        if (trimmed.length < MIN_ERROR_LINE_LENGTH) {
            continue;
        }
        const lineLower = trimmed.toLowerCase();

        if (lineLower.includes("run 'docker") && lineLower.includes('--help')) {
            break;
        }

        if (lineLower.includes('for more information') || lineLower.includes("see 'docker")) {
            continue;
        }

        if (
            lineLower.includes('error') ||
            lineLower.includes('invalid') ||
            lineLower.includes('unknown') ||
            lineLower.includes('failed') ||
            lineLower.includes('cannot') ||
            lineLower.includes('docker:')
        ) {
            for (let j = 0; j < ERROR_PATTERNS.length; j++) {
                ERROR_PATTERNS[j].lastIndex = 0;
                const match = ERROR_PATTERNS[j].exec(trimmed);
                if (match && match[1]) {
                    const errorMsg = match[1].trim();
                    if (errorMsg.length > 0 && errorMsg.length < MAX_ERROR_LINE_LENGTH) {
                        const cleaned = errorMsg.replace(DOCKER_PREFIX_CLEAN, '');
                        if (cleaned.length > 0) {
                            return cleaned;
                        }
                    }
                }
            }

            if (trimmed.length < MAX_ERROR_LINE_LENGTH) {
                const cleaned = trimmed.replace(DOCKER_PREFIX_CLEAN, '');
                if (cleaned.length > MIN_ERROR_LINE_LENGTH) {
                    return cleaned;
                }
            }
        }
    }

    return null;
}

export const ErrorHandler = {
    filterDockerMessages(text: unknown): string {
        if (!text || typeof text !== 'string' || text.length === 0) {
            return '';
        }

        const lines = text.split('\n');
        const filteredLines: string[] = [];
        const linesLen = lines.length;

        for (let i = 0; i < linesLen; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const lowerLine = trimmed.toLowerCase();

            if (!DOCKER_PULL_MESSAGES_SET.has(lowerLine)) {
                filteredLines.push(line);
            }
        }

        let filtered = filteredLines.join('\n');
        filtered = filtered.replace(ANSI_REGEX, '');

        return truncateString(filtered, TRUNCATE_LENGTH_ERROR);
    },

    sanitizeError(error: unknown): string {
        if (!error || typeof error !== 'string') {
            return '';
        }
        let filtered = ErrorHandler.filterDockerMessages(error);
        if (filtered.length === 0) {
            return '';
        }

        filtered = filtered.replace(FILE_PATH_REGEX, '[file path]');
        filtered = filtered.replace(WINDOWS_PATH_REGEX, '[file path]');

        for (let i = 0; i < DEBUG_PATTERNS.length; i++) {
            filtered = filtered.replace(DEBUG_PATTERNS[i], '');
        }

        return truncateString(filtered, TRUNCATE_LENGTH_ERROR);
    },

    sanitizeErrorForUser(errorStr: unknown): string {
        if (!errorStr || typeof errorStr !== 'string' || errorStr.length === 0) {
            return DEFAULT_ERROR_MESSAGE;
        }

        const cacheKey =
            errorStr.length > MAX_CACHEABLE_ERROR_LENGTH ? errorStr.substring(0, MAX_CACHEABLE_ERROR_LENGTH) : errorStr;
        const cached = getCachedError(cacheKey);
        if (cached) {
            return cached;
        }

        const dockerError = checkDockerError(errorStr);
        if (dockerError) {
            tryCacheResult(errorStr, dockerError);
            return dockerError;
        }

        const dockerHelpError = extractErrorFromDockerHelpMessage(errorStr);
        if (dockerHelpError) {
            tryCacheResult(errorStr, dockerHelpError);
            return dockerHelpError;
        }

        let sanitized = ErrorHandler.filterDockerMessages(errorStr);
        if (!sanitized) {
            return DEFAULT_SANITIZED_ERROR_MESSAGE;
        }

        resetRegexLastIndex(
            DOCKER_PREFIX_REGEX,
            DOCKER_DAEMON_REGEX,
            DOCKER_HELP_REGEX,
            FILE_PATH_REGEX,
            WINDOWS_PATH_REGEX
        );
        sanitized = sanitized
            .replace(DOCKER_PREFIX_REGEX, '')
            .replace(DOCKER_DAEMON_REGEX, '')
            .replace(DOCKER_HELP_REGEX, '')
            .replace(FILE_PATH_REGEX, '[file path]')
            .replace(WINDOWS_PATH_REGEX, '[file path]');

        if (!sanitized) {
            return DEFAULT_SANITIZED_ERROR_MESSAGE;
        }

        STACK_TRACE_REGEX.lastIndex = 0;
        const stackTraceMatch = STACK_TRACE_REGEX.exec(sanitized);
        if (stackTraceMatch) {
            sanitized = stackTraceMatch[1];
            if (!sanitized) {
                return DEFAULT_SANITIZED_ERROR_MESSAGE;
            }
        }

        const lines = sanitized.split('\n');
        const filtered = filterErrorLines(lines);

        if (filtered.length === 0) {
            return DEFAULT_SANITIZED_ERROR_MESSAGE;
        }

        sanitized = filtered.join('\n').trim();
        sanitized = truncateString(sanitized, TRUNCATE_LENGTH_SANITIZED);

        if (!sanitized) {
            return DEFAULT_SANITIZED_ERROR_MESSAGE;
        }

        tryCacheResult(errorStr, sanitized);
        return sanitized;
    }
};

export const filterDockerMessages = ErrorHandler.filterDockerMessages;
export const sanitizeError = ErrorHandler.sanitizeError;
export const sanitizeErrorForUser = ErrorHandler.sanitizeErrorForUser;
