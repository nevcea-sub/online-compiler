import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../utils/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const route = req.route?.path || req.path;

    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const statusCode = res.statusCode.toString();

        httpRequestDuration.observe(
            { method: req.method, route, status_code: statusCode },
            duration
        );
        httpRequestTotal.inc({ method: req.method, route, status_code: statusCode });
    });

    next();
}

