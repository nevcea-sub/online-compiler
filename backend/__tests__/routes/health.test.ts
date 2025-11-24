import { healthRoute } from '../../routes/health';
import { Request, Response } from 'express';
import { createMockRequest, createMockResponse } from '../helpers/testHelpers';

describe('Health Route', () => {
    let mockRequest: ReturnType<typeof createMockRequest>;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return status ok', async () => {
        await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

        expect(mockResponse.json).toHaveBeenCalledTimes(1);
        const callArgs = mockResponse.json.mock.calls[0][0];
        expect(callArgs).toHaveProperty('status');
        expect(callArgs.status).toBe('ok');
        expect(callArgs).toHaveProperty('queue');
        expect(callArgs).toHaveProperty('resources');
        expect(callArgs).toHaveProperty('timestamp');
    });

    it('should not call status method', async () => {
        await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return object with status property', async () => {
        await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

        const callArgs = mockResponse.json.mock.calls[0][0];
        expect(callArgs).toHaveProperty('status');
        expect(callArgs.status).toBe('ok');
        expect(callArgs).toHaveProperty('queue');
        expect(callArgs.queue).toHaveProperty('running');
        expect(callArgs.queue).toHaveProperty('queued');
        expect(callArgs).toHaveProperty('resources');
        expect(callArgs.resources).toHaveProperty('memory');
        expect(callArgs.resources).toHaveProperty('uptime');
    });

    it('should handle multiple consecutive calls', async () => {
        await healthRoute(mockRequest as Request, mockResponse as unknown as Response);
        await healthRoute(mockRequest as Request, mockResponse as unknown as Response);
        await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

        expect(mockResponse.json).toHaveBeenCalledTimes(3);
        mockResponse.json.mock.calls.forEach((call: any[]) => {
            expect(call[0]).toHaveProperty('status');
            expect(call[0].status).toBe('ok');
            expect(call[0]).toHaveProperty('queue');
            expect(call[0]).toHaveProperty('resources');
        });
    });

    it('should work with different request objects', async () => {
        const req1 = createMockRequest({ query: { test: 'value' } });
        const req2 = createMockRequest({ params: { id: '123' } });
        const req3 = createMockRequest({ body: { data: 'test' } });

        await healthRoute(req1 as Request, mockResponse as unknown as Response);
        await healthRoute(req2 as Request, mockResponse as unknown as Response);
        await healthRoute(req3 as Request, mockResponse as unknown as Response);

        expect(mockResponse.json).toHaveBeenCalledTimes(3);
        mockResponse.json.mock.calls.forEach((call: any[]) => {
            expect(call[0]).toHaveProperty('status');
            expect(call[0].status).toBe('ok');
        });
    });

    it('should return Promise', async () => {
        const result = healthRoute(mockRequest as Request, mockResponse as unknown as Response);

        expect(result).toBeInstanceOf(Promise);
        await result;
        expect(mockResponse.json).toHaveBeenCalled();
    });
});
