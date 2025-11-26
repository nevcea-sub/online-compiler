import { Env } from '../../utils/envValidation';

describe('Environment Variable Validation Utilities', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Env.integer', () => {
        it('should return default value when env var is undefined', () => {
            delete process.env.TEST_INT;
            expect(Env.integer('TEST_INT', 100)).toBe(100);
        });

        it('should return default value when env var is empty string', () => {
            process.env.TEST_INT = '';
            expect(Env.integer('TEST_INT', 100)).toBe(100);
        });

        it('should parse valid integer string', () => {
            process.env.TEST_INT = '123';
            expect(Env.integer('TEST_INT', 100)).toBe(123);
            process.env.TEST_INT = '0';
            expect(Env.integer('TEST_INT', 100)).toBe(0);
            process.env.TEST_INT = '-10';
            expect(Env.integer('TEST_INT', 100)).toBe(-10);
        });

        it('should return default value for invalid integer string', () => {
            process.env.TEST_INT = 'abc';
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            expect(Env.integer('TEST_INT', 100)).toBe(100);
            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });

        it('should validate minimum value', () => {
            process.env.TEST_INT = '50';
            expect(Env.integer('TEST_INT', 100, 0)).toBe(50);

            process.env.TEST_INT = '50';
            expect(() => Env.integer('TEST_INT', 100, 100)).toThrow('TEST_INT must be >= 100');
        });

        it('should validate maximum value', () => {
            process.env.TEST_INT = '50';
            expect(Env.integer('TEST_INT', 100, undefined, 100)).toBe(50);

            process.env.TEST_INT = '150';
            expect(() => Env.integer('TEST_INT', 100, undefined, 100)).toThrow('TEST_INT must be <= 100');
        });
    });

    describe('Env.boolean', () => {
        it('should return default value when env var is undefined', () => {
            delete process.env.TEST_BOOL;
            expect(Env.boolean('TEST_BOOL', true)).toBe(true);
            expect(Env.boolean('TEST_BOOL', false)).toBe(false);
        });

        it('should return default value when env var is empty string', () => {
            process.env.TEST_BOOL = '';
            expect(Env.boolean('TEST_BOOL', true)).toBe(true);
            expect(Env.boolean('TEST_BOOL', false)).toBe(false);
        });

        it('should parse "true" string as true', () => {
            process.env.TEST_BOOL = 'true';
            expect(Env.boolean('TEST_BOOL', false)).toBe(true);
            process.env.TEST_BOOL = 'True';
            expect(Env.boolean('TEST_BOOL', false)).toBe(true);
            process.env.TEST_BOOL = 'TRUE';
            expect(Env.boolean('TEST_BOOL', false)).toBe(true);
        });

        it('should parse any other string as false', () => {
            process.env.TEST_BOOL = 'false';
            expect(Env.boolean('TEST_BOOL', true)).toBe(false);
            process.env.TEST_BOOL = '0';
            expect(Env.boolean('TEST_BOOL', true)).toBe(false);
            process.env.TEST_BOOL = 'yes';
            expect(Env.boolean('TEST_BOOL', true)).toBe(false);
        });
    });

    describe('Env.memory', () => {
        it('should accept valid memory sizes', () => {
            process.env.TEST_MEM = '256m';
            expect(() => Env.memory('TEST_MEM', '512m')).not.toThrow();
            expect(Env.memory('TEST_MEM', '512m')).toBe('256m');
        });

        it('should use default value when undefined', () => {
            delete process.env.TEST_MEM;
            expect(Env.memory('TEST_MEM', '512m')).toBe('512m');
        });

        it('should reject invalid memory size formats', () => {
            process.env.TEST_MEM = 'abc';
            expect(() => Env.memory('TEST_MEM', '512m')).toThrow('Invalid memory size format');
        });
    });

    describe('Env.cpu', () => {
        it('should accept valid CPU percentages', () => {
            process.env.TEST_CPU = '1.0';
            expect(() => Env.cpu('TEST_CPU', '2.0')).not.toThrow();
            expect(Env.cpu('TEST_CPU', '2.0')).toBe('1.0');
        });

        it('should use default value when undefined', () => {
            delete process.env.TEST_CPU;
            expect(Env.cpu('TEST_CPU', '2.0')).toBe('2.0');
        });

        it('should reject invalid CPU percentages', () => {
            process.env.TEST_CPU = 'abc';
            expect(() => Env.cpu('TEST_CPU', '2.0')).toThrow('Invalid CPU percent');

            process.env.TEST_CPU = '101';
            expect(() => Env.cpu('TEST_CPU', '2.0')).toThrow('Invalid CPU percent');
        });
    });
});
