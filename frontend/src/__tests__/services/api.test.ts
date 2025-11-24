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
        mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

        await expect(executeCode('print("hello")', 'python', '')).rejects.toThrow(
            '네트워크 오류'
        );
    });

    it('should throw error on timeout', async () => {
        const controller = new AbortController();
        controller.abort();

        mockFetch.mockRejectedValueOnce(
            new Error('AbortError')
        );

        await expect(executeCode('print("hello")', 'python', '')).rejects.toThrow(
            '요청 시간이 초과되었습니다'
        );
    });

    it('should throw error with message from server', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Invalid code' })
        } as Response);

        await expect(executeCode('invalid', 'python', '')).rejects.toThrow(
            'HTTP 400: Invalid code'
        );
    });
});

