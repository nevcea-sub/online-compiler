import path from 'path';
import * as fss from 'fs';

export const PathUtils = {
    normalizePath(filePath: unknown): string | null {
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
    },

    validatePath(filePath: unknown): boolean {
        const normalized = PathUtils.normalizePath(filePath);
        if (!normalized) {
            return false;
        }
        if (normalized.includes('\0')) {
            return false;
        }
        if (normalized.startsWith('/')) {
            return !normalized.includes('..');
        }
        try {
            const resolved = path.resolve(normalized);
            return resolved === normalized || resolved.startsWith(normalized);
        } catch {
            return false;
        }
    },

    isChildPath(childPath: unknown, parentPath: string): boolean {
        const normalizedChild = PathUtils.normalizePath(childPath);
        if (!normalizedChild) {
            return false;
        }
        const normalizedParent = path.resolve(parentPath);

        const parentDir = process.platform === 'win32' ? normalizedParent.replace(/\\/g, '/') : normalizedParent;
        const childDir = process.platform === 'win32' ? normalizedChild.replace(/\\/g, '/') : normalizedChild;

        return childDir.startsWith(parentDir);
    },

    convertToDockerPath(filePath: string): string {
        const normalized = PathUtils.normalizePath(filePath);
        if (!normalized) {
            throw new Error('Invalid file path');
        }
        if (process.platform === 'win32' && normalized.match(/^[A-Z]:/)) {
            const drive = normalized[0].toLowerCase();
            const rest = normalized.substring(2).replace(/\\/g, '/');
            return `/${drive}${rest}`;
        }
        return normalized.replace(/\\/g, '/');
    },

    getContainerCodePath(language: string, extension: string, containerCodePaths: Record<string, string>): string {
        return containerCodePaths[language] || `/tmp/code${extension}`;
    },

    validateDockerPath(dockerPath: string): boolean {
        return !!(dockerPath && dockerPath.length > 0 && dockerPath[0] === '/');
    }
};

let kotlinCompilerPathCache: { exists: boolean; timestamp: number } | null = null;
const KOTLIN_CACHE_TTL = 60 * 1000;

export function kotlinCompilerExistsOnHost(kotlinCacheDir: string): boolean {
    const now = Date.now();
    if (kotlinCompilerPathCache && now - kotlinCompilerPathCache.timestamp < KOTLIN_CACHE_TTL) {
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

export const normalizePath = PathUtils.normalizePath;
export const validatePath = PathUtils.validatePath;
export const isChildPath = PathUtils.isChildPath;
export const convertToDockerPath = PathUtils.convertToDockerPath;
export const getContainerCodePath = PathUtils.getContainerCodePath;
export const validateDockerPath = PathUtils.validateDockerPath;
