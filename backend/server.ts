import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { CONFIG } from './config';
import { ensureDirectories } from './file/fileManager';
import { preloadDockerImages } from './docker/dockerImage';
import { warmupKotlinOnStart, warmupContainers } from './docker/dockerWarmup';
import { corsOptions, corsOptionsHandler, corsDenyHandler } from './middleware/cors';
import { executeLimiter, healthLimiter } from './middleware/rateLimit';
import { createExecuteRoute } from './routes/execute';
import { healthRoute } from './routes/health';

const app = express();

const codeDir = path.join(__dirname, 'code');
const outputDir = path.join(__dirname, 'output');
const toolCacheDir = path.join(__dirname, 'tool_cache');
const kotlinCacheDir = path.join(toolCacheDir, 'kotlin');
const kotlinBuildsDir = path.join(toolCacheDir, 'kotlin_builds');

app.disable('x-powered-by');
if (CONFIG.TRUST_PROXY) {
    app.set('trust proxy', 1);
}

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);

app.use(cors(corsOptions));
app.use(corsOptionsHandler);
app.use(corsDenyHandler);

app.use(express.json({ limit: '10mb' }));

app.post('/api/execute', executeLimiter, createExecuteRoute(codeDir, outputDir, kotlinCacheDir));
app.get('/api/health', healthLimiter, healthRoute);

app.use((err: Error, _: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err.message || 'Unknown error');
    res.status(500).json({ error: 'Internal server error' });
});

ensureDirectories(codeDir, outputDir, toolCacheDir, kotlinCacheDir, kotlinBuildsDir)
    .then(async () => {
        await warmupKotlinOnStart(kotlinCacheDir);
        app.listen(CONFIG.PORT, () => {
            console.log(`Server running on port ${CONFIG.PORT}`);
            if (CONFIG.ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (CONFIG.ENABLE_WARMUP) {
            warmupContainers(kotlinCacheDir);
        }
    })
    .catch((e: unknown) => {
        console.error('Startup error:', e);
        app.listen(CONFIG.PORT, () => {
            console.log(`Server running on port ${CONFIG.PORT}`);
            if (CONFIG.ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (CONFIG.ENABLE_WARMUP) {
            warmupContainers(kotlinCacheDir);
        }
    });