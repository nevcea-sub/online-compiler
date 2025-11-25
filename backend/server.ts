import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { CONFIG, validateConfig } from './config';
import { preloadDockerImages } from './docker/dockerImage';
import { warmupContainers } from './docker/dockerWarmup';
import { executeLimiter, executeHourlyLimiter, healthLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createExecuteRoute } from './routes/execute';
import { healthRoute } from './routes/health';
import { getServerPaths, initializeServer } from './server/initialization';
import { createLogger } from './utils/logger';

const logger = createLogger('Server');
const app = express();
const paths = getServerPaths();

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
        logger.debug(`${req.method} ${req.path} Origin=${req.headers.origin || 'n/a'}`);
        next();
    });
}

function setupSecurity(app: express.Application, isProduction: boolean): void {
    if (!isProduction) {
        logger.info('Helmet disabled in development');
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
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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
    app.post('/api/execute', executeLimiter, executeHourlyLimiter, createExecuteRoute(paths.codeDir, paths.outputDir, paths.kotlinCacheDir));
    app.get('/api/health', healthLimiter, healthRoute);
}

function setupErrorHandling(app: express.Application): void {
    app.use(notFoundHandler);
    app.use(errorHandler);
}

function startHttpServer(): void {
    app.listen(CONFIG.PORT, () => {
        logger.info(`Server running on port ${CONFIG.PORT}`);
        if (CONFIG.ENABLE_PRELOAD) {
            preloadDockerImages();
        }
    });

    if (CONFIG.ENABLE_WARMUP) {
        warmupContainers(paths.kotlinCacheDir);
    }
}

const isProduction = isProductionEnv();
logger.info(`NODE_ENV=${process.env.NODE_ENV || 'undefined'} isProduction=${isProduction}`);

try {
    validateConfig();
    logger.info('Configuration validated successfully');
} catch (error) {
    logger.error('Configuration validation failed:', error);
    process.exit(1);
}

setupMiddlewares(app, isProduction);
setupRoutes(app);
setupErrorHandling(app);

initializeServer(paths)
    .then(() => {
        logger.info('Initialization complete. Starting HTTP server...');
        startHttpServer();
    })
    .catch((e: unknown) => {
        logger.error('Startup error: initialization failed. Starting server anyway.', e);
        startHttpServer();
    });
