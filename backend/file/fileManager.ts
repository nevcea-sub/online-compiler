import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validatePath } from '../utils/validation';
import { getContainerCodePath } from '../utils/pathUtils';
import { ImageFile } from '../types';
import { createLogger } from '../utils/logger';
import { IMAGE_EXTENSIONS, MIME_TYPE_MAP, ERROR_MESSAGES } from '../utils/constants';

const logger = createLogger('FileManager');

export async function cleanupFile(filePath: string | null): Promise<void> {
    if (!filePath || !validatePath(filePath)) {
        return;
    }
    try {
        await fs.unlink(filePath).catch((error: unknown) => {
            if (error instanceof Error && !error.message.includes('ENOENT')) {
                logger.debug(`Failed to delete file ${filePath}:`, error);
            }
        });
    } catch (error) {
        logger.debug('Cleanup error:', error);
    }
}

export async function writeInputFile(inputPath: string, inputText: string): Promise<string> {
    if (!validatePath(inputPath)) {
        logger.error('Invalid input path:', inputPath);
        throw new Error(ERROR_MESSAGES.INVALID_INPUT_PATH);
    }
    const resolvedInputPath = path.resolve(inputPath);
    await fs.writeFile(resolvedInputPath, inputText, 'utf8');
    return resolvedInputPath;
}

export async function writeCodeFile(
    codePath: string,
    code: string,
    language: string,
    containerCodePaths: Record<string, string>,
    languageExtensions: Record<string, string>
): Promise<string> {
    if (!validatePath(codePath)) {
        logger.error('Invalid code path:', codePath);
        throw new Error(ERROR_MESSAGES.INVALID_CODE_PATH);
    }
    const resolvedCodePath = path.resolve(codePath);
    await fs.writeFile(resolvedCodePath, code, 'utf8');

    if (language === 'java') {
        const extension = languageExtensions[language] || '.java';
        const containerPath = getContainerCodePath(language, extension, containerCodePaths);
        const expectedFileName = path.basename(containerPath);
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        if (classMatch) {
            const className = classMatch[1];
            if (expectedFileName !== `${className}${extension}`) {
                logger.error(`Class name mismatch: ${className} vs ${expectedFileName}`);
                throw new Error(ERROR_MESSAGES.CLASS_NAME_MISMATCH(className, expectedFileName));
            }
        }
    }

    return resolvedCodePath;
}

export async function findImageFiles(outputDir: string): Promise<ImageFile[]> {
    try {
        const files = await fs.readdir(outputDir);

        // Process all image files in parallel
        const imagePromises = files
            .filter((file) => {
                const ext = path.extname(file).toLowerCase();
                return IMAGE_EXTENSIONS.includes(ext as any);
            })
            .map(async (file) => {
                const ext = path.extname(file).toLowerCase();
                const filePath = path.join(outputDir, file);
                try {
                    const imageBuffer = await fs.readFile(filePath);
                    const base64 = imageBuffer.toString('base64');
                    const mimeType = MIME_TYPE_MAP[ext] || `image/${ext.slice(1)}`;

                    // Delete file asynchronously (don't wait)
                    fs.unlink(filePath).catch((error: unknown) => {
                        if (error instanceof Error) {
                            logger.debug(`Failed to delete image file ${filePath}:`, error);
                        }
                    });

                    return {
                        name: file,
                        data: `data:${mimeType};base64,${base64}`
                    };
                } catch (error) {
                    logger.error(`Failed to read image file ${file}:`, error);
                    return null;
                }
            });

        const results = await Promise.all(imagePromises);
        return results.filter((img): img is ImageFile => img !== null);
    } catch (error) {
        logger.error('Failed to read output directory:', error);
        return [];
    }
}

export async function ensureDirectories(
    codeDir: string,
    outputDir: string,
    toolCacheDir: string,
    kotlinCacheDir: string,
    kotlinBuildsDir: string
): Promise<void> {
    await Promise.all([
        fs.mkdir(codeDir, { recursive: true }),
        fs.mkdir(outputDir, { recursive: true }),
        fs.mkdir(toolCacheDir, { recursive: true }),
        fs.mkdir(kotlinCacheDir, { recursive: true }),
        fs.mkdir(kotlinBuildsDir, { recursive: true })
    ]);
}

export function generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
}
