import {
    parseIntegerEnv,
    parseBooleanEnv,
    validateMemorySize,
    validateCpuPercent
} from '../../utils/envValidation';

export function runEnvValidationTests() {
    describe('Environment Variable Validation Utilities', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('parseIntegerEnv', () => {
            it('should return default value when env var is undefined', () => {
                expect(parseIntegerEnv(undefined, 100)).toBe(100);
            });

            it('should return default value when env var is empty string', () => {
                expect(parseIntegerEnv('', 100)).toBe(100);
            });

            it('should parse valid integer string', () => {
                expect(parseIntegerEnv('123', 100)).toBe(123);
                expect(parseIntegerEnv('0', 100)).toBe(0);
                expect(parseIntegerEnv('-10', 100)).toBe(-10);
            });

            it('should return default value for invalid integer string', () => {
                const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                expect(parseIntegerEnv('abc', 100)).toBe(100);
                expect(consoleWarnSpy).toHaveBeenCalled();
                consoleWarnSpy.mockRestore();
            });

            it('should validate minimum value', () => {
                expect(parseIntegerEnv('50', 100, 0)).toBe(50);
                expect(() => parseIntegerEnv('50', 100, 100)).toThrow('Environment variable must be >= 100');
            });

            it('should validate maximum value', () => {
                expect(parseIntegerEnv('50', 100, undefined, 100)).toBe(50);
                expect(() => parseIntegerEnv('150', 100, undefined, 100)).toThrow('Environment variable must be <= 100');
            });

            it('should validate both min and max', () => {
                expect(parseIntegerEnv('50', 100, 0, 100)).toBe(50);
                expect(() => parseIntegerEnv('-10', 100, 0, 100)).toThrow('Environment variable must be >= 0');
                expect(() => parseIntegerEnv('150', 100, 0, 100)).toThrow('Environment variable must be <= 100');
            });

            it('should handle edge cases', () => {
                expect(parseIntegerEnv('0', 100, 0, 100)).toBe(0);
                expect(parseIntegerEnv('100', 50, 0, 100)).toBe(100);
            });
        });

        describe('parseBooleanEnv', () => {
            it('should return default value when env var is undefined', () => {
                expect(parseBooleanEnv(undefined, true)).toBe(true);
                expect(parseBooleanEnv(undefined, false)).toBe(false);
            });

            it('should return default value when env var is empty string', () => {
                expect(parseBooleanEnv('', true)).toBe(true);
                expect(parseBooleanEnv('', false)).toBe(false);
            });

            it('should parse "true" string as true', () => {
                expect(parseBooleanEnv('true', false)).toBe(true);
                expect(parseBooleanEnv('True', false)).toBe(true);
                expect(parseBooleanEnv('TRUE', false)).toBe(true);
            });

            it('should parse any other string as false', () => {
                expect(parseBooleanEnv('false', true)).toBe(false);
                expect(parseBooleanEnv('0', true)).toBe(false);
                expect(parseBooleanEnv('yes', true)).toBe(false);
                expect(parseBooleanEnv('no', true)).toBe(false);
            });
        });

        describe('validateMemorySize', () => {
            it('should accept valid memory sizes', () => {
                expect(() => validateMemorySize('256m')).not.toThrow();
                expect(() => validateMemorySize('1g')).not.toThrow();
                expect(() => validateMemorySize('512k')).not.toThrow();
                expect(() => validateMemorySize('1024')).not.toThrow();
                expect(() => validateMemorySize('2G')).not.toThrow();
                expect(() => validateMemorySize('512M')).not.toThrow();
            });

            it('should reject invalid memory size formats', () => {
                expect(() => validateMemorySize('abc')).toThrow('Invalid memory size format');
                expect(() => validateMemorySize('256mb')).toThrow('Invalid memory size format');
                expect(() => validateMemorySize('256 g')).toThrow('Invalid memory size format');
                expect(() => validateMemorySize('')).toThrow('Invalid memory size format');
                expect(() => validateMemorySize('256x')).toThrow('Invalid memory size format');
            });

            it('should accept edge cases', () => {
                expect(() => validateMemorySize('0')).not.toThrow();
                expect(() => validateMemorySize('999999')).not.toThrow();
            });
        });

        describe('validateCpuPercent', () => {
            it('should accept valid CPU percentages', () => {
                expect(() => validateCpuPercent('1.0')).not.toThrow();
                expect(() => validateCpuPercent('2.5')).not.toThrow();
                expect(() => validateCpuPercent('50')).not.toThrow();
                expect(() => validateCpuPercent('100')).not.toThrow();
                expect(() => validateCpuPercent('0.1')).not.toThrow();
            });

            it('should reject invalid CPU percentages', () => {
                expect(() => validateCpuPercent('0')).toThrow('Invalid CPU percent');
                expect(() => validateCpuPercent('-1')).toThrow('Invalid CPU percent');
                expect(() => validateCpuPercent('101')).toThrow('Invalid CPU percent');
                expect(() => validateCpuPercent('abc')).toThrow('Invalid CPU percent');
                expect(() => validateCpuPercent('')).toThrow('Invalid CPU percent');
            });

            it('should handle edge cases', () => {
                expect(() => validateCpuPercent('0.01')).not.toThrow();
                expect(() => validateCpuPercent('99.99')).not.toThrow();
            });
        });
    });
}

