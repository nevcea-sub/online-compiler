import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validatePath } from '../utils/validation';
import { getContainerCodePath } from '../utils/pathUtils';
import { ImageFile } from '../types';

export async function cleanupFile(filePath: string | null): Promise<void> {
    if (!filePath || !validatePath(filePath)) {
        return;
    }
    try {
        await fs.unlink(filePath).catch(() => {});
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

export async function writeInputFile(inputPath: string, inputText: string): Promise<string> {
    if (!validatePath(inputPath)) {
        console.error('[ERROR] Invalid input path:', inputPath);
        throw new Error('입력 파일 경로가 올바르지 않습니다.');
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
        console.error('[ERROR] Invalid code path:', codePath);
        throw new Error('코드 경로가 올바르지 않습니다.');
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
            if (expectedFileName !== `${className}.java`) {
                console.error('[ERROR] Class name mismatch:', className, expectedFileName);
                throw new Error(`클래스 이름 ${className}은 파일 이름 ${expectedFileName}과 일치해야 합니다.`);
            }
        }
    }
    
    return resolvedCodePath;
}

export async function findImageFiles(outputDir: string): Promise<ImageFile[]> {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'];
    const images: ImageFile[] = [];

    try {
        const files = await fs.readdir(outputDir);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (imageExtensions.includes(ext)) {
                const filePath = path.join(outputDir, file);
                try {
                    const imageBuffer = await fs.readFile(filePath);
                    const base64 = imageBuffer.toString('base64');
                    const mimeType = ext === '.svg' ? 'image/svg+xml' : `image/${ext.slice(1)}`;
                    images.push({
                        name: file,
                        data: `data:${mimeType};base64,${base64}`
                    });
                    await fs.unlink(filePath).catch(() => {});
                } catch (error) {
                    console.error(`[ERROR] Failed to read image file ${file}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('[ERROR] Failed to read output directory:', error);
    }

    return images;
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

