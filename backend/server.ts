import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import path from 'path';
import { CONFIG } from './config';
import { ensureDirectories } from './file/fileManager';
import { preloadDockerImages } from './docker/dockerImage';
import { warmupKotlinOnStart, warmupContainers } from './docker/dockerWarmup';
import { executeLimiter, healthLimiter } from './middleware/rateLimit';
import { createExecuteRoute } from './routes/execute';
import { healthRoute } from './routes/health';

const app = express();

const codeDir = path.join(__dirname, 'code');
const outputDir = path.join(__dirname, 'output');
const toolCacheDir = path.join(__dirname, 'tool_cache');
const kotlinCacheDir = path.join(toolCacheDir, 'kotlin');
const kotlinBuildsDir = path.join(toolCacheDir, 'kotlin_builds');

function isProductionEnv(): boolean {
    return (process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function setupBasicSettings(app: express.Application): void {
    app.disable('x-powered-by');
    if (CONFIG.TRUST_PROXY) {
        app.set('trust proxy', 1);
    }
}

function setupRequestLogging(app: express.Application): void {
    if (!CONFIG.DEBUG_MODE) {
        return;
    }

    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[REQ] ${req.method} ${req.path} Origin=${req.headers.origin || 'n/a'}`);
        next();
    });
}

function setupSecurity(app: express.Application, isProduction: boolean): void {
    if (!isProduction) {
        console.log('[SERVER] Helmet disabled in development');
        return;
    }

    app.use(helmet());
    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],
                imgSrc: ["'self'", 'data:'],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"]
            }
        })
    );
}

function createCorsOptions(isProduction: boolean): CorsOptions {
    if (isProduction) {
        return {
            origin: false,
            credentials: true
        };
    }

    return {
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };
}

function setupMiddlewares(app: express.Application, isProduction: boolean): void {
    setupBasicSettings(app);
    setupRequestLogging(app);
    setupSecurity(app, isProduction);

    const corsOptions = createCorsOptions(isProduction);
    app.use(cors(corsOptions));
    app.use(express.json({ limit: '10mb' }));
}

function setupRoutes(app: express.Application): void {
    app.post('/api/execute', executeLimiter, createExecuteRoute(codeDir, outputDir, kotlinCacheDir));
    app.get('/api/health', healthLimiter, healthRoute);
}

function setupErrorHandling(app: express.Application): void {
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error('Unhandled error:', err.message || 'Unknown error');
        res.status(500).json({ error: 'Internal server error' });
    });
}

function startHttpServer(): void {
    app.listen(CONFIG.PORT, () => {
        console.log(`Server running on port ${CONFIG.PORT}`);
        if (CONFIG.ENABLE_PRELOAD) {
            preloadDockerImages();
        }
    });

    if (CONFIG.ENABLE_WARMUP) {
        warmupContainers(kotlinCacheDir);
    }
}

const isProduction = isProductionEnv();
console.log(`[SERVER] NODE_ENV=${process.env.NODE_ENV || 'undefined'} isProduction=${isProduction}`);

setupMiddlewares(app, isProduction);
setupRoutes(app);
setupErrorHandling(app);

console.log('[SERVER] Ensuring required directories...', {
    codeDir,
    outputDir,
    toolCacheDir
});

ensureDirectories(codeDir, outputDir, toolCacheDir, kotlinCacheDir, kotlinBuildsDir)
    .then(async () => {
        console.log('[SERVER] Directories ready. Starting Kotlin warmup (if needed)...');
        await warmupKotlinOnStart(kotlinCacheDir);
        console.log('[SERVER] Kotlin warmup finished. Starting HTTP server...');
        startHttpServer();
    })
    .catch((e: unknown) => {
        console.error('Startup error: directory ensure or warmup failed. Starting server anyway.', e);
        startHttpServer();
    });
