import { CONFIG, validateConfig } from '../../config';

describe('Config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    describe('CONFIG', () => {
        it('should have all required properties', () => {
            expect(CONFIG).toHaveProperty('PORT');
            expect(CONFIG).toHaveProperty('MAX_CODE_LENGTH');
            expect(CONFIG).toHaveProperty('MAX_EXECUTION_TIME');
            expect(CONFIG).toHaveProperty('MAX_MEMORY');
            expect(CONFIG).toHaveProperty('MAX_CPU_PERCENT');
            expect(CONFIG).toHaveProperty('MAX_OUTPUT_BYTES');
            expect(CONFIG).toHaveProperty('MAX_INPUT_LENGTH');
            expect(CONFIG).toHaveProperty('ENABLE_PRELOAD');
            expect(CONFIG).toHaveProperty('ENABLE_WARMUP');
            expect(CONFIG).toHaveProperty('TRUST_PROXY');
            expect(CONFIG).toHaveProperty('DEBUG_MODE');
        });

        it('should use default PORT when not set', () => {
            delete process.env.PORT;
            jest.resetModules();
            const { CONFIG: newConfig } = require('../../config');
            expect(newConfig.PORT).toBe(4000);
        });

        it('should parse PORT from environment variable', () => {
            process.env.PORT = '3000';
            jest.resetModules();
            const { CONFIG: newConfig } = require('../../config');
            expect(newConfig.PORT).toBe(3000);
        });

        it('should validate PORT range', () => {
            process.env.PORT = '0';
            jest.resetModules();
            expect(() => {
                require('../../config');
            }).toThrow('Environment variable must be >= 1');

            process.env.PORT = '70000';
            jest.resetModules();
            expect(() => {
                require('../../config');
            }).toThrow('Environment variable must be <= 65535');
        });

        it('should parse boolean environment variables', () => {
            process.env.ENABLE_PRELOAD = 'false';
            process.env.ENABLE_WARMUP = 'false';
            process.env.TRUST_PROXY = 'true';
            jest.resetModules();
            const { CONFIG: newConfig } = require('../../config');
            expect(newConfig.ENABLE_PRELOAD).toBe(false);
            expect(newConfig.ENABLE_WARMUP).toBe(false);
            expect(newConfig.TRUST_PROXY).toBe(true);
        });

        it('should validate memory size format', () => {
            process.env.MAX_MEMORY = 'invalid';
            jest.resetModules();
            expect(() => {
                require('../../config');
            }).toThrow('Invalid memory size format');
        });

        it('should validate CPU percent', () => {
            process.env.MAX_CPU_PERCENT = '101';
            jest.resetModules();
            expect(() => {
                require('../../config');
            }).toThrow('Invalid CPU percent');

            process.env.MAX_CPU_PERCENT = '0';
            jest.resetModules();
            expect(() => {
                require('../../config');
            }).toThrow('Invalid CPU percent');
        });

        it('should validate MAX_OUTPUT_BYTES range', () => {
            process.env.MAX_OUTPUT_BYTES = '500';
            jest.resetModules();
            expect(() => {
                require('../../config');
            }).toThrow('Environment variable must be >= 1024');

            process.env.MAX_OUTPUT_BYTES = '200000000';
            jest.resetModules();
            expect(() => {
                require('../../config');
            }).toThrow('Environment variable must be <= 104857600');
        });
    });

    describe('validateConfig', () => {
        it('should pass validation with valid config', () => {
            expect(() => validateConfig()).not.toThrow();
        });

        it('should throw if MAX_CODE_LENGTH is invalid', () => {
            const originalMaxCodeLength = CONFIG.MAX_CODE_LENGTH;
            (CONFIG as any).MAX_CODE_LENGTH = 0;
            expect(() => validateConfig()).toThrow('MAX_CODE_LENGTH must be >= 1');
            (CONFIG as any).MAX_CODE_LENGTH = originalMaxCodeLength;
        });

        it('should throw if MAX_EXECUTION_TIME is too small', () => {
            const originalMaxExecutionTime = CONFIG.MAX_EXECUTION_TIME;
            (CONFIG as any).MAX_EXECUTION_TIME = 500;
            expect(() => validateConfig()).toThrow('MAX_EXECUTION_TIME must be >= 1000ms');
            (CONFIG as any).MAX_EXECUTION_TIME = originalMaxExecutionTime;
        });

        it('should throw if TIMEOUT_BUFFER_MS is too large', () => {
            const originalTimeoutBuffer = CONFIG.TIMEOUT_BUFFER_MS;
            (CONFIG as any).TIMEOUT_BUFFER_MS = CONFIG.MAX_EXECUTION_TIME + 1000;
            expect(() => validateConfig()).toThrow('TIMEOUT_BUFFER_MS');
            (CONFIG as any).TIMEOUT_BUFFER_MS = originalTimeoutBuffer;
        });

        it('should throw if SIGKILL_DELAY_MS is too large', () => {
            const originalSigkillDelay = CONFIG.SIGKILL_DELAY_MS;
            (CONFIG as any).SIGKILL_DELAY_MS = CONFIG.MAX_EXECUTION_TIME + 1000;
            expect(() => validateConfig()).toThrow('SIGKILL_DELAY_MS');
            (CONFIG as any).SIGKILL_DELAY_MS = originalSigkillDelay;
        });
    });
});
