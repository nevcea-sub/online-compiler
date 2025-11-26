import { Request, Response, NextFunction } from 'express';
import { sanitizeError } from '../utils/errorHandling';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export function safeSendErrorResponse(res: Response, statusCode: number, error: string): boolean {
    if (res.headersSent) {
        logger.error('Cannot send error response: headers already sent', { statusCode, error });
        return false;
    }
    try {
        res.status(statusCode).json({ error });
        return true;
    } catch (err) {
        logger.error('Failed to send error response:', err);
        return false;
    }
}

export function errorHandler(err: AppError | Error, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        logger.error('Error occurred after response was sent:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
        return next(err);
    }

    const statusCode = 'statusCode' in err && err.statusCode ? err.statusCode : 500;

    let errorMessage: string;
    if (statusCode >= 500) {
        errorMessage = 'Internal server error';
        logger.error('Internal server error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
    } else {
        errorMessage = sanitizeError(err.message || 'An error occurred');
        logger.debug('Client error:', {
            error: err.message,
            path: req.path,
            method: req.method,
            statusCode
        });
    }

    safeSendErrorResponse(res, statusCode, errorMessage);
}

export function notFoundHandler(_req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        return next();
    }
    safeSendErrorResponse(res, 404, 'Endpoint not found');
}

