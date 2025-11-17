import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const devLocalhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export const corsOptions: cors.CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
            return callback(null, true);
        }
        const isNullOrigin = origin === 'null';
        const isLocalhost = devLocalhostRegex.test(origin);
        const allowInDev = !isProduction && (isLocalhost || isNullOrigin);

        if (allowedOrigins.length > 0) {
            if (allowedOrigins.includes(origin) || allowInDev) {
                return callback(null, true);
            }
            return callback(null, false);
        }

        if (allowInDev) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200
};

export function corsDenyHandler(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'OPTIONS') {
        return next();
    }

    const origin = (req.headers.origin || '') as string;
    if (!origin) {
        return next();
    }

    const isNullOrigin = origin === 'null';
    const isLocalhost = devLocalhostRegex.test(origin);
    const allowInDev = !isProduction && (isLocalhost || isNullOrigin);

    let allowed = false;
    if (allowedOrigins.length > 0) {
        allowed = allowedOrigins.includes(origin) || allowInDev;
    } else if (allowInDev) {
        allowed = true;
    }

    if (!allowed) {
        res.status(403).send('Not allowed by CORS');
        return;
    }

    next();
}

export function corsOptionsHandler(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin || '';
        let allowed = false;
        if (!origin) {
            allowed = true;
        } else if (allowedOrigins.length > 0) {
            allowed =
                allowedOrigins.includes(origin) ||
                (!isProduction && origin === 'null') ||
                (!isProduction && devLocalhostRegex.test(origin));
        } else if (!isProduction && (devLocalhostRegex.test(origin) || origin === 'null')) {
            allowed = true;
        }
        if (!allowed) {
            res.status(403).send('Not allowed by CORS');
            return;
        }
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header(
            'Access-Control-Allow-Headers',
            req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
        );
        res.sendStatus(204);
        return;
    }
    next();
}

