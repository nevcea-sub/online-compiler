import { describe, it, expect } from 'vitest';
import { formatOutput, formatError } from '../../utils/outputFormatter';

export function runOutputFormatterTests() {
    describe('Output Formatter - formatOutput', () => {
        it('should return empty string for invalid input', () => {
            expect(formatOutput('')).toBe('');
            expect(formatOutput(null as any)).toBe('');
            expect(formatOutput(undefined as any)).toBe('');
        });

        it('should normalize line endings', () => {
            expect(formatOutput('line1\r\nline2\rline3\nline4')).toBe('line1\nline2\nline3\nline4');
        });

        it('should remove trailing whitespace', () => {
            expect(formatOutput('line1   \nline2\t\n')).toBe('line1\nline2');
        });

        it('should collapse multiple newlines', () => {
            expect(formatOutput('line1\n\n\nline2')).toBe('line1\n\nline2');
        });

        it('should trim result', () => {
            expect(formatOutput('  \n  line1  \n  ')).toBe('line1');
        });
    });

    describe('Output Formatter - formatError', () => {
        it('should return empty string for invalid input', () => {
            expect(formatError('')).toBe('');
            expect(formatError(null as any)).toBe('');
            expect(formatError(undefined as any)).toBe('');
        });

        it('should truncate to max lines', () => {
            const longError = Array(30).fill('error line').join('\n');
            const result = formatError(longError, 10);
            expect(result.split('\n').length).toBeLessThanOrEqual(11);
            expect(result).toContain('... (more error messages)');
        });

        it('should truncate to max length', () => {
            const longError = 'x'.repeat(1000);
            const result = formatError(longError, 20, 100);
            expect(result.length).toBeLessThanOrEqual(103);
            expect(result).toContain('...');
        });

        it('should normalize line endings', () => {
            const result = formatError('error1\r\nerror2\rerror3');
            expect(result).not.toContain('\r');
        });
    });
}

