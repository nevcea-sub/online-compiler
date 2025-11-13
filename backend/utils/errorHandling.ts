import {
    DOCKER_PULL_MESSAGES,
    DEBUG_PATTERNS
} from '../config';

const ESC = String.fromCharCode(27);
const ANSI_REGEX = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, 'g');
const DOCKER_PULL_MESSAGES_SET = new Set(DOCKER_PULL_MESSAGES.map((msg) => msg.toLowerCase()));
const FILE_PATH_REGEX = /\/[^\s]+/g;
const WINDOWS_PATH_REGEX = /[A-Z]:\\[^\s]+/gi;
const STACK_TRACE_REGEX = /(.*?)(\n\s+at\s+.*)/s;
const FILE_PATH_PLACEHOLDER_REGEX = /^\[file path\]$/;
const DEBUG_PREFIX_REGEX = /^\[DEBUG\]|^DEBUG:/;

export function filterDockerMessages(text: unknown): string {
    if (!text || typeof text !== 'string') {
        return '';
    }
    let filtered = text;
    const lines = filtered.split('\n');
    const filteredLines: string[] = [];
    
    for (const line of lines) {
        const lowerLine = line.toLowerCase().trim();
        if (DOCKER_PULL_MESSAGES_SET.has(lowerLine)) {
            continue;
        }
        filteredLines.push(line);
    }
    
    filtered = filteredLines.join('\n');
    filtered = filtered.replace(ANSI_REGEX, '');
    
    if (filtered.length > 500) {
        return filtered.substring(0, 500) + '...';
    }
    return filtered;
}

export function sanitizeError(error: unknown): string {
    if (!error || typeof error !== 'string') {
        return '';
    }
    let filtered = filterDockerMessages(error);
    filtered = filtered.replace(FILE_PATH_REGEX, '[file path]');
    filtered = filtered.replace(WINDOWS_PATH_REGEX, '[file path]');
    
    for (const pattern of DEBUG_PATTERNS) {
        filtered = filtered.replace(pattern, '');
    }
    
    if (filtered.length > 500) {
        return filtered.substring(0, 500) + '...';
    }
    return filtered;
}

export function sanitizeErrorForUser(errorStr: unknown): string {
    if (!errorStr || typeof errorStr !== 'string') {
        return 'An error occurred during execution.';
    }

    console.error('[DEBUG] Original error message:', errorStr.substring(0, 500));

    const originalLower = errorStr.toLowerCase();
    
    let sanitized = filterDockerMessages(errorStr);

    const lowerSanitized = sanitized.toLowerCase();
    
    if (lowerSanitized.includes("cannot connect to the docker daemon") || 
        lowerSanitized.includes("is the docker daemon running") ||
        (lowerSanitized.includes("docker daemon") && lowerSanitized.includes("not running"))) {
        return 'Docker가 실행되지 않았습니다. Docker Desktop을 시작한 후 다시 시도해주세요.';
    }
    
    if (lowerSanitized.includes("'docker' is not recognized") || 
        lowerSanitized.includes("docker: command not found") ||
        lowerSanitized.includes("spawn docker enoent")) {
        return 'Docker가 설치되지 않았습니다. Docker를 설치한 후 다시 시도해주세요.';
    }
    
    if (lowerSanitized.includes("no such image") || 
        lowerSanitized.includes("pull access denied") ||
        lowerSanitized.includes("repository does not exist")) {
        return 'Docker 이미지를 찾을 수 없습니다. 필요한 이미지를 다운로드 중입니다. 잠시 후 다시 시도해주세요.';
    }
    
    if (lowerSanitized.includes("permission denied") && lowerSanitized.includes("docker")) {
        return 'Docker 권한 오류가 발생했습니다. Docker 권한을 확인해주세요.';
    }
    
    if (lowerSanitized.includes("docker: invalid reference format") ||
        lowerSanitized.includes("invalid reference format")) {
        return 'Docker 명령어 형식 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    if (lowerSanitized.includes("run 'docker run --help'") || 
        (lowerSanitized.includes("run 'docker") && lowerSanitized.includes("--help")) ||
        originalLower.includes("run 'docker run --help'") ||
        (originalLower.includes("run 'docker") && originalLower.includes("--help"))) {
        
        const originalLines = errorStr.split('\n');
        
        for (let i = 0; i < originalLines.length; i++) {
            const line = originalLines[i].trim();
            const lineLower = line.toLowerCase();
            
            if (lineLower.includes("run 'docker") && lineLower.includes("--help")) {
                break;
            }
            
            if (!line || 
                lineLower.includes("for more information") ||
                lineLower.includes("see 'docker") ||
                line.length < 5) {
                continue;
            }
            
            const errorPatterns = [
                /docker:\s*(.+?)(?:\n|$)/i,
                /error[:\s]+(.+?)(?:\n|$)/i,
                /invalid[:\s]+(.+?)(?:\n|$)/i,
                /unknown[:\s]+(.+?)(?:\n|$)/i,
                /failed[:\s]+(.+?)(?:\n|$)/i,
                /cannot[:\s]+(.+?)(?:\n|$)/i
            ];
            
            for (const pattern of errorPatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    const errorMsg = match[1].trim();
                    if (errorMsg.length > 0 && errorMsg.length < 200) {
                        const cleaned = errorMsg.replace(/^docker:\s*/i, '').trim();
                        if (cleaned.length > 0) {
                            return cleaned;
                        }
                    }
                }
            }
            
            if (lineLower.includes('error') || 
                lineLower.includes('invalid') ||
                lineLower.includes('unknown') ||
                lineLower.includes('failed') ||
                lineLower.includes('cannot') ||
                lineLower.includes('docker:')) {
                const cleaned = line.replace(/^docker:\s*/i, '').trim();
                if (cleaned.length > 5 && cleaned.length < 200) {
                    return cleaned;
                }
            }
        }
        
        const beforeHelp = errorStr.split(/run ['"]docker/i)[0].trim();
        if (beforeHelp && beforeHelp.length > 0) {
            const beforeLines = beforeHelp.split('\n').filter(l => l.trim().length > 0);
            if (beforeLines.length > 0) {
                for (let i = beforeLines.length - 1; i >= 0; i--) {
                    const lastLine = beforeLines[i].trim();
                    if (lastLine.length > 5 && lastLine.length < 200) {
                        const cleaned = lastLine.replace(/^docker:\s*/i, '').trim();
                        if (cleaned.length > 0) {
                            return cleaned;
                        }
                    }
                }
            }
        }
        
        for (const line of originalLines) {
            const trimmed = line.trim();
            if (trimmed && 
                !trimmed.toLowerCase().includes("run 'docker") &&
                !trimmed.toLowerCase().includes("for more information") &&
                trimmed.length > 5 && 
                trimmed.length < 200) {
                const cleaned = trimmed.replace(/^docker:\s*/i, '').trim();
                if (cleaned.length > 0) {
                    return cleaned;
                }
            }
        }
        
        return 'Docker 명령어 실행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    sanitized = sanitized.replace(/docker:.*/gi, '');
    sanitized = sanitized.replace(/Error response from daemon.*/gi, '');
    sanitized = sanitized.replace(/Run 'docker run --help'.*/gi, '');
    sanitized = sanitized.replace(FILE_PATH_REGEX, '[file path]');
    sanitized = sanitized.replace(WINDOWS_PATH_REGEX, '[file path]');

    const stackTraceMatch = sanitized.match(STACK_TRACE_REGEX);
    if (stackTraceMatch) {
        sanitized = stackTraceMatch[1];
    }

    const lines = sanitized.split('\n');
    const filtered: string[] = [];
    
    for (let i = 0; i < lines.length && filtered.length < 10; i++) {
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
        if (trimmed.includes("Run 'docker") || trimmed.includes("for more information")) {
            continue;
        }
        filtered.push(lines[i]);
    }

    sanitized = filtered.join('\n').trim();

    if (sanitized.length > 300) {
        sanitized = sanitized.substring(0, 300) + '...';
    }

    if (!sanitized || sanitized.length === 0) {
        return '실행 중 오류가 발생했습니다.';
    }

    return sanitized;
}

