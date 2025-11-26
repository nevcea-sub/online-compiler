import { createLogger } from './logger';

const logger = createLogger('EnvValidation');

export const Env = {
    string(key: string, defaultValue: string): string {
        return process.env[key] || defaultValue;
    },

    integer(key: string, defaultValue: number, min?: number, max?: number): number {
        const raw = process.env[key];
        return parseIntegerEnv(raw, defaultValue, min, max);
    },

    boolean(key: string, defaultValue: boolean): boolean {
        const raw = process.env[key];
        return parseBooleanEnv(raw, defaultValue);
    },

    memory(key: string, defaultValue: string): string {
        const val = process.env[key] || defaultValue;
        validateMemorySize(val);
        return val;
    },

    cpu(key: string, defaultValue: string): string {
        const val = process.env[key] || defaultValue;
        validateCpuPercent(val);
        return val;
    }
};

function validateMemorySize(value: string): void {
    const memoryRegex = /^(\d+)([kmg]?)$/i;
    if (!memoryRegex.test(value)) {
        throw new Error(`Invalid memory size format: ${value}. Expected format: <number>[k|m|g]`);
    }
}

function validateCpuPercent(value: string): void {
    const cpu = parseFloat(value);
    if (isNaN(cpu) || cpu <= 0 || cpu > 100) {
        throw new Error(`Invalid CPU percent: ${value}. Must be between 0 and 100`);
    }
}

function parseIntegerEnv(envVar: string | undefined, defaultValue: number, min?: number, max?: number): number {
    if (envVar === undefined || envVar === '') {
        return defaultValue;
    }
    const parsed = parseInt(envVar, 10);
    if (isNaN(parsed)) {
        logger.warn(`Invalid integer value for environment variable, using default: ${defaultValue}`);
        return defaultValue;
    }
    if (min !== undefined && parsed < min) {
        throw new Error(`Environment variable must be >= ${min}, got: ${parsed}`);
    }
    if (max !== undefined && parsed > max) {
        throw new Error(`Environment variable must be <= ${max}, got: ${parsed}`);
    }
    return parsed;
}

function parseBooleanEnv(envVar: string | undefined, defaultValue: boolean): boolean {
    if (envVar === undefined || envVar === '') {
        return defaultValue;
    }
    return envVar.toLowerCase() === 'true';
}
