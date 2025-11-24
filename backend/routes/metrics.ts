import { Request, Response } from 'express';
import { getMetrics, register } from '../utils/metrics';

export async function metricsRoute(_: Request, res: Response): Promise<void> {
    try {
        const metrics = await getMetrics();
        res.set('Content-Type', register.contentType);
        res.send(metrics);
    } catch (error) {
        console.error('[METRICS] Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
}

