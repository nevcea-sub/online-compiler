import path from 'path';
import * as fss from 'fs';

export function normalizePath(filePath: unknown): string | null {
    if (typeof filePath !== 'string' || !filePath.trim()) {
        return null;
    }
    try {
        const trimmed = filePath.trim();
        if (trimmed.startsWith('/')) {
            return trimmed.replace(/\/+/g, '/');
        }
        return path.normalize(trimmed);
    } catch {
        return null;
    }
}

export function validatePath(filePath: unknown): boolean {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        return false;
    }
    try {
        if (normalized.startsWith('/')) {
            if (normalized.includes('..') || normalized.includes('\0')) {
                return false;
            }
            return true;
        }
        const resolved = path.resolve(normalized);
        return resolved === normalized || resolved.startsWith(normalized);
    } catch {
        return false;
    }
}

export function convertToDockerPath(filePath: string): string {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        throw new Error('Invalid file path');
    }
    if (process.platform === 'win32' && normalized.match(/^[A-Z]:/)) {
        const drive = normalized[0].toLowerCase();
        const rest = normalized.substring(2).replace(/\\/g, '/');
        return `/${drive}${rest}`;
    }
    return normalized.replace(/\\/g, '/');
}

export function getContainerCodePath(language: string, extension: string, containerCodePaths: Record<string, string>): string {
    return containerCodePaths[language] || `/tmp/code${extension}`;
}

export function validateDockerPath(dockerPath: string, pathName: string): void {
    if (!dockerPath || dockerPath.trim() === '' || !dockerPath.startsWith('/')) {
        throw new Error(`Invalid Docker ${pathName} path: ${dockerPath}`);
    }
}

let kotlinCompilerPathCache: { exists: boolean; timestamp: number } | null = null;
const KOTLIN_CACHE_TTL = 60 * 1000;

export function kotlinCompilerExistsOnHost(kotlinCacheDir: string): boolean {
    const now = Date.now();
    if (kotlinCompilerPathCache && (now - kotlinCompilerPathCache.timestamp) < KOTLIN_CACHE_TTL) {
        return kotlinCompilerPathCache.exists;
    }
    try {
        const p = path.join(kotlinCacheDir, 'kotlinc', 'lib', 'kotlin-compiler.jar');
        const exists = fss.existsSync(p);
        kotlinCompilerPathCache = { exists, timestamp: now };
        return exists;
    } catch {
        kotlinCompilerPathCache = { exists: false, timestamp: now };
        return false;
    }
}

