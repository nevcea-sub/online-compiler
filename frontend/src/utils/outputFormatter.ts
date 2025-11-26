import { CONFIG } from '../config/constants';

export const formatOutput = (text: string): string => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const filtered = normalized
        .split('\n')
        .filter((line) => !CONFIG.DEBUG_PATTERNS.some((pattern) => pattern.test(line.trim())))
        .map((line) => line.replace(/[ \t]+$/, ''))
        .join('\n');
    const collapsed = filtered
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+\n/g, '\n')
        .trim();

    return collapsed;
};

export const formatError = (
    errorText: string,
    maxLines: number = CONFIG.MAX_ERROR_LINES,
    maxLength: number = CONFIG.MAX_ERROR_LENGTH
): string => {
    if (!errorText || typeof errorText !== 'string') {
        return '';
    }

    const normalized = errorText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let collapsed = normalized
        .split('\n')
        .map((line) => line.replace(/[ \t]+$/, ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+\n/g, '\n')
        .trim();

    const lines = collapsed.split('\n');
    if (lines.length > maxLines) {
        collapsed = lines.slice(0, maxLines).join('\n') + '\n... (more error messages)';
    }
    if (collapsed.length > maxLength) {
        collapsed = collapsed.substring(0, maxLength) + '...';
    }

    return collapsed;
};

export const formatExecutionTime = (timeMs: number | null): string | null => {
    if (timeMs === null || timeMs < 0) {
        return null;
    }
    if (timeMs < 1000) {
        return `${timeMs.toFixed(0)}ms`;
    }
    const seconds = timeMs / 1000;
    if (seconds < 60) {
        return `${seconds.toFixed(3)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes}m ${remainingSeconds}s`;
};
