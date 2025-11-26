import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeCode } from '../../services/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('executeCode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return execution result on success', async () => {
        const mockResponse = {
            output: 'hello',
            error: '',
            executionTime: 100
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        } as Response);

        const result = await executeCode('print("hello")', 'python', '');
        expect(result).toEqual(mockResponse);
    });

    it('should throw error on network failure', async () => {
        mockFetch.mockRejectedValue(new Error('Failed to fetch'));

        await expect(executeCode('print("hello")', 'python', '')).rejects.toThrow(
            'TRANSLATION_KEY:network-error-detail'
        );
    });

    it('should throw error on timeout', async () => {
        const controller = new AbortController();
        controller.abort();

        const abortError = new Error('AbortError');
        abortError.name = 'AbortError';

        mockFetch.mockRejectedValueOnce(abortError);

        await expect(executeCode('print("hello")', 'python', '')).rejects.toThrow(
            'TRANSLATION_KEY:request-timeout-retry'
        );
    });

    it('should throw error with message from server', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Invalid code' })
        } as Response);

        await expect(executeCode('invalid', 'python', '')).rejects.toThrow(
            'TRANSLATION_KEY:bad-request:Invalid code'
        );
    });
});

