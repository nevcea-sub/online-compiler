import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { Env } from '../utils/envValidation';

const MAX_EXECUTIONS_PER_MINUTE = Env.integer('MAX_EXECUTIONS_PER_MINUTE', 20, 1, 1000);
const MAX_EXECUTIONS_PER_HOUR = Env.integer('MAX_EXECUTIONS_PER_HOUR', 100, 1, 10000);

export const executeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: MAX_EXECUTIONS_PER_MINUTE,
    message: {
        error: 'Too many execution requests. Please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too many execution requests. Please try again later.',
            retryAfter: '1 minute',
            limit: MAX_EXECUTIONS_PER_MINUTE,
            window: '1 minute'
        });
    }
});

export const executeHourlyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: MAX_EXECUTIONS_PER_HOUR,
    message: {
        error: 'Hourly execution limit exceeded. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            error: 'Hourly execution limit exceeded. Please try again later.',
            retryAfter: '1 hour',
            limit: MAX_EXECUTIONS_PER_HOUR,
            window: '1 hour'
        });
    }
});

const DISABLE_RATE_LIMIT = Env.boolean('DISABLE_RATE_LIMIT', false);
const HEALTH_RATE_LIMIT = Env.integer('HEALTH_RATE_LIMIT', 60, 1, 10000);

export const healthLimiter = DISABLE_RATE_LIMIT
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 1 * 60 * 1000,
        max: HEALTH_RATE_LIMIT,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: Request) => {
            return req.headers['x-benchmark'] === 'true';
        }
    });

