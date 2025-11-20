import { healthRoute } from '../../routes/health';
import { Request, Response } from 'express';
import { createMockRequest, createMockResponse } from '../helpers/testHelpers';

describe('Health Route', () => {
    let mockRequest: ReturnType<typeof createMockRequest>;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
    });

    it('should return status ok', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledTimes(1);
        const callArgs = mockResponse.json.mock.calls[0][0];
        expect(callArgs).toHaveProperty('status');
        expect(callArgs.status).toBe('ok');
        expect(callArgs).toHaveProperty('queue');
        expect(callArgs).toHaveProperty('resources');
        expect(callArgs).toHaveProperty('timestamp');
    });

    it('should not call status method', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return object with status property', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);

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

    it('should handle multiple consecutive calls', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);
        healthRoute(mockRequest as Request, mockResponse as Response);
        healthRoute(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledTimes(3);
        mockResponse.json.mock.calls.forEach((call: any[]) => {
            expect(call[0]).toHaveProperty('status');
            expect(call[0].status).toBe('ok');
            expect(call[0]).toHaveProperty('queue');
            expect(call[0]).toHaveProperty('resources');
        });
    });

    it('should work with different request objects', () => {
        const req1 = createMockRequest({ query: { test: 'value' } });
        const req2 = createMockRequest({ params: { id: '123' } });
        const req3 = createMockRequest({ body: { data: 'test' } });

        healthRoute(req1 as Request, mockResponse as Response);
        healthRoute(req2 as Request, mockResponse as Response);
        healthRoute(req3 as Request, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledTimes(3);
        mockResponse.json.mock.calls.forEach((call: any[]) => {
            expect(call[0]).toHaveProperty('status');
            expect(call[0].status).toBe('ok');
        });
    });

    it('should return JSON response synchronously', () => {
        const result = healthRoute(mockRequest as Request, mockResponse as Response);

        expect(result).toBeUndefined();
        expect(mockResponse.json).toHaveBeenCalled();
    });
});
