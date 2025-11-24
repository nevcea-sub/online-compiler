import { Request, Response, NextFunction } from 'express';
import { safeSendErrorResponse, errorHandler, notFoundHandler, AppError } from '../../middleware/errorHandler';
import { createMockRequest, createMockResponse } from '../helpers/testHelpers';

describe('Error Handler Middleware', () => {
    let mockRequest: ReturnType<typeof createMockRequest>;
    let mockResponse: ReturnType<typeof createMockResponse>;
    let mockNext: jest.Mock<void, [Error?]>;

    beforeEach(() => {
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        mockNext = jest.fn<void, [Error?]>();
    });

    describe('safeSendErrorResponse', () => {
        it('should send error response when headers not sent', () => {
            const result = safeSendErrorResponse(mockResponse as unknown as Response, 400, 'Test error');

            expect(result).toBe(true);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Test error' });
        });

        it('should not send response when headers already sent', () => {
            mockResponse.headersSent = true;
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = safeSendErrorResponse(mockResponse as unknown as Response, 400, 'Test error');

            expect(result).toBe(false);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('should handle errors when sending response', () => {
            mockResponse.json = jest.fn().mockImplementation(() => {
                throw new Error('Send failed');
            });
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = safeSendErrorResponse(mockResponse as unknown as Response, 400, 'Test error');

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('errorHandler', () => {
        it('should handle 500 errors and hide sensitive information', () => {
            const error = new Error('Internal server error');
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('should handle client errors (4xx) with sanitized message', () => {
            const error: AppError = new Error('Invalid input') as AppError;
            error.statusCode = 400;

            errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalled();
            const callArgs = mockResponse.json.mock.calls[0][0];
            expect(callArgs).toHaveProperty('error');
        });

        it('should use statusCode from AppError', () => {
            const error: AppError = new Error('Not found') as AppError;
            error.statusCode = 404;

            errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should default to 500 when no statusCode provided', () => {
            const error = new Error('Unknown error');

            errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });

        it('should not send response if headers already sent', () => {
            mockResponse.headersSent = true;
            const error = new Error('Test error');
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('should log error details for 500 errors', () => {
            const error = new Error('Database connection failed');
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            errorHandler(error, mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[ERROR] Internal server error:',
                expect.objectContaining({
                    error: 'Database connection failed',
                    path: '/',
                    method: 'GET'
                })
            );
            consoleErrorSpy.mockRestore();
        });
    });

    describe('notFoundHandler', () => {
        it('should send 404 response', () => {
            notFoundHandler(mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Endpoint not found' });
        });

        it('should not send response if headers already sent', () => {
            mockResponse.headersSent = true;

            notFoundHandler(mockRequest as Request, mockResponse as unknown as Response, mockNext as unknown as NextFunction);

            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });
});

