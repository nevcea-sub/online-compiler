export interface ImageCacheEntry {
    exists: boolean;
    timestamp: number;
}

export interface PullResult {
    success: boolean;
    image: string;
    error?: string;
}

export interface DockerCommandResult {
    stdout: string;
    stderr: string;
    elapsed: number;
    cmd?: string;
}

export interface DockerCommandError {
    error: {
        message: string;
        code?: string | number;
        signal?: string | null;
        killed?: boolean;
        stderr: string;
        stdout: string;
        cmd?: string;
    };
    elapsed: number;
}

export interface WarmupConfig {
    language: string;
    image: string;
    command: string;
    tmpfsSize: string;
    timeout: number;
    allowNetwork: boolean;
}

export interface WarmupResult {
    success: boolean;
    language: string;
    error?: string;
    fullError?: DockerCommandError['error'];
    elapsed?: number;
}

export interface BuildOptions {
    hasInput?: boolean;
    inputPath?: string;
    outputDirHost?: string;
}

export interface ImageFile {
    name: string;
    data: string;
}

export interface ExecutionError {
    code?: number | null;
    killed?: boolean;
    signal?: string | null;
    message?: string;
}

export interface ExecuteRequestBody {
    code?: unknown;
    language?: unknown;
    input?: unknown;
}

