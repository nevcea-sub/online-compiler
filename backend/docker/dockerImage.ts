import { exec } from 'child_process';
import { promisify } from 'util';
import { CONFIG, LANGUAGE_CONFIGS } from '../config';
import { ImageCacheEntry, PullResult } from '../types';
import { Validator } from '../utils/validation';
import { createTimeoutController } from '../utils/timeout';
import { createLogger } from '../utils/logger';

const logger = createLogger('DockerImage');
const imageExistenceCache = new Map<string, ImageCacheEntry>();
const IMAGE_CACHE_TTL = 10 * 60 * 1000;
const imageCheckPromises = new Map<string, Promise<boolean>>();

export async function checkImageExists(image: string): Promise<boolean> {
    if (!Validator.image(image)) {
        return false;
    }

    const now = Date.now();
    const cached = imageExistenceCache.get(image);
    if (cached && now - cached.timestamp < IMAGE_CACHE_TTL) {
        return cached.exists;
    }

    const existingPromise = imageCheckPromises.get(image);
    if (existingPromise) {
        return existingPromise;
    }

    const checkPromise = (async () => {
        const { controller, clear } = createTimeoutController(3000);
        try {
            const { stdout } = await promisify(exec)(`docker images -q ${image}`, {
                signal: controller.signal
            });
            clear();
            const exists = stdout.trim().length > 0;
            imageExistenceCache.set(image, { exists, timestamp: Date.now() });
            imageCheckPromises.delete(image);
            return exists;
        } catch {
            clear();
            imageExistenceCache.set(image, { exists: false, timestamp: Date.now() });
            imageCheckPromises.delete(image);
            return false;
        }
    })();

    imageCheckPromises.set(image, checkPromise);
    return checkPromise;
}

export async function pullDockerImage(
    image: string,
    retries: number = CONFIG.DOCKER_PULL_RETRIES,
    silent: boolean = false
): Promise<PullResult> {
    if (!Validator.image(image)) {
        return { success: false, image, error: 'Invalid image' };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const timeout = attempt === 0 ? CONFIG.DOCKER_PULL_TIMEOUT : CONFIG.DOCKER_PULL_TIMEOUT * 2;
            const { controller, clear } = createTimeoutController(timeout);

            const pullProcess = exec(`docker pull ${image}`, { signal: controller.signal });

            if (!silent) {
                pullProcess.stdout?.on('data', (data: Buffer | string) => {
                    process.stdout.write(`[${image}] ${data.toString().trim()}\n`);
                });

                pullProcess.stderr?.on('data', (data: Buffer | string) => {
                    process.stderr.write(`[${image}] ${data.toString().trim()}\n`);
                });
            }

            await new Promise<void>((resolve, reject) => {
                pullProcess.on('close', (code: number | null) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Process exited with code ${code}`));
                    }
                });
                pullProcess.on('error', reject);
            });

            clear();
            imageExistenceCache.set(image, { exists: true, timestamp: Date.now() });
            return { success: true, image };
        } catch (error) {
            if (attempt < retries) {
                const delay = CONFIG.DOCKER_PULL_RETRY_DELAY_BASE * (attempt + 1);
                if (!silent) {
                    logger.info(`[${image}] Pull failed, retrying... (${attempt + 1}/${retries})`);
                }
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                const err = error as Error;
                return { success: false, image, error: err.message || 'Unknown error' };
            }
        }
    }
    return { success: false, image, error: 'Max retries exceeded' };
}

export async function preloadDockerImages(): Promise<void> {
    const { isDockerAvailable } = await import('./dockerClient');

    if (!(await isDockerAvailable())) {
        logger.warn('Docker is not available. Skipping preload. (Start Docker Desktop to auto-pull on first use)');
        return;
    }
    logger.debug('Starting Docker images preload...');
    const startTime = Date.now();
    const images = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);
    const uniqueImages = [...new Set(images)];

    logger.debug(`Checking ${uniqueImages.length} unique images...`);

    const checkPromises = uniqueImages.map(async (image) => {
        const exists = await checkImageExists(image);
        return { image, exists };
    });

    const checkResults = await Promise.all(checkPromises);
    const imagesToPull = checkResults.filter(({ exists }) => !exists).map(({ image }) => image);
    const existingImages = checkResults.filter(({ exists }) => exists).map(({ image }) => image);

    if (imagesToPull.length === 0) {
        logger.debug('All required images are already available!');
        return;
    }

    if (existingImages.length > 0) {
        logger.debug(`${existingImages.length} images already exist: ${existingImages.join(', ')}`);
    }
    logger.debug(`Pulling ${imagesToPull.length} images: ${imagesToPull.join(', ')}`);

    const results: PullResult[] = [];

    for (let i = 0; i < imagesToPull.length; i += CONFIG.PRELOAD_BATCH_SIZE) {
        const batch = imagesToPull.slice(i, i + CONFIG.PRELOAD_BATCH_SIZE);
        const batchPromises = batch.map((image) => pullDockerImage(image));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        const batchNumber = Math.floor(i / CONFIG.PRELOAD_BATCH_SIZE) + 1;
        logger.info(`Batch ${batchNumber}: ${successCount} succeeded, ${failCount} failed`);
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedImages = results.filter((r) => !r.success).map((r) => r.image);
        logger.warn(`Failed to pull ${totalFailed} images: ${failedImages.join(', ')}`);
        logger.warn('These images will be pulled on first use.');
    }

    logger.info(`Completed in ${elapsed}s: ${totalSuccess} succeeded, ${totalFailed} failed`);
}
