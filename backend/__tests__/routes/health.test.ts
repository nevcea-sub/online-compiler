import { healthRoute } from '../../routes/health';
import { Request, Response } from 'express';

describe('Health Route', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis();
        
        mockRequest = {};
        mockResponse = {
            json: jsonMock,
            status: statusMock
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return status ok', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith({ status: 'ok' });
        expect(jsonMock).toHaveBeenCalledTimes(1);
    });

    it('should not call status method', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);

        expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return object with status property', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);

        const callArgs = jsonMock.mock.calls[0][0];
        expect(callArgs).toHaveProperty('status');
        expect(callArgs.status).toBe('ok');
    });

    it('should handle multiple consecutive calls', () => {
        healthRoute(mockRequest as Request, mockResponse as Response);
        healthRoute(mockRequest as Request, mockResponse as Response);
        healthRoute(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledTimes(3);
        jsonMock.mock.calls.forEach(call => {
            expect(call[0]).toEqual({ status: 'ok' });
        });
    });

    it('should work with different request objects', () => {
        const req1 = { query: { test: 'value' } } as any;
        const req2 = { params: { id: '123' } } as any;
        const req3 = { body: { data: 'test' } } as any;

        healthRoute(req1, mockResponse as Response);
        healthRoute(req2, mockResponse as Response);
        healthRoute(req3, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledTimes(3);
        jsonMock.mock.calls.forEach(call => {
            expect(call[0]).toEqual({ status: 'ok' });
        });
    });

    it('should return JSON response synchronously', () => {
        const result = healthRoute(mockRequest as Request, mockResponse as Response);

        expect(result).toBeUndefined(); // void return type
        expect(jsonMock).toHaveBeenCalled();
    });
});
