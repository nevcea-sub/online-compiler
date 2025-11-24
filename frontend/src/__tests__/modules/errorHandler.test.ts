import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from '../../utils/errorHandler';

export function runErrorHandlerTests() {
    describe('Error Handler - extractErrorMessage', () => {
        const t = (key: string) => {
            const translations: Record<string, string> = {
                'cannot-connect-server': 'Cannot connect to server',
                'request-timeout': 'Request timeout',
                'bad-request': 'Bad request',
                'server-error': 'Server error',
                'connection-error': 'Connection error'
            };
            return translations[key] || key;
        };

        it('should return connection error for non-Error objects', () => {
            expect(extractErrorMessage(null, t)).toBe('Connection error');
            expect(extractErrorMessage(undefined, t)).toBe('Connection error');
            expect(extractErrorMessage('string', t)).toBe('Connection error');
        });

        it('should extract HTTP error messages', () => {
            const error = new Error('HTTP 400: Bad request');
            expect(extractErrorMessage(error, t)).toBe('Bad request');
        });

        it('should map network errors', () => {
            const error = new Error('Failed to fetch');
            expect(extractErrorMessage(error, t)).toBe('Cannot connect to server');
        });

        it('should map timeout errors', () => {
            const error = new Error('Request timeout');
            expect(extractErrorMessage(error, t)).toBe('Request timeout');
        });

        it('should map HTTP status codes', () => {
            expect(extractErrorMessage(new Error('HTTP 400'), t)).toBe('Bad request');
            expect(extractErrorMessage(new Error('HTTP 500'), t)).toBe('Server error');
        });
    });
}

