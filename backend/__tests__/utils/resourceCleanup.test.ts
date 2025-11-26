import { cleanupOldFiles, cleanupOldSessions, getDirectorySize, getDirectoryCount } from '../../utils/resourceCleanup';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('Resource Cleanup Utilities', () => {
    let testDir: string;
    let codeDir: string;
    let outputDir: string;

    beforeEach(async () => {
        testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-test-'));
        codeDir = path.join(testDir, 'code');
        outputDir = path.join(testDir, 'output');
        await fs.mkdir(codeDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch {}
    });

    describe('cleanupOldFiles', () => {
        it('should delete old files', async () => {
            const oldFile = path.join(codeDir, 'old_file.txt');
            const newFile = path.join(codeDir, 'new_file.txt');

            await fs.writeFile(oldFile, 'old content');
            const oldTime = Date.now() - 2 * 60 * 60 * 1000;
            await fs.utimes(oldFile, new Date(oldTime), new Date(oldTime));

            await fs.writeFile(newFile, 'new content');

            const stats = await cleanupOldFiles(codeDir, 60 * 60 * 1000);

            expect(stats.filesDeleted).toBe(1);
            expect(stats.filesDeleted).toBeGreaterThan(0);

            await expect(fs.access(oldFile)).rejects.toThrow();
            await expect(fs.access(newFile)).resolves.not.toThrow();
        });

        it('should not delete recent files', async () => {
            const recentFile = path.join(codeDir, 'recent_file.txt');
            await fs.writeFile(recentFile, 'content');

            const stats = await cleanupOldFiles(codeDir, 60 * 60 * 1000);

            expect(stats.filesDeleted).toBe(0);
            await expect(fs.access(recentFile)).resolves.not.toThrow();
        });

        it('should filter files by pattern', async () => {
            const codeFile = path.join(codeDir, 'session123_code.py');
            const inputFile = path.join(codeDir, 'session123_input');
            const otherFile = path.join(codeDir, 'other.txt');

            await fs.writeFile(codeFile, 'code');
            await fs.writeFile(inputFile, 'input');
            await fs.writeFile(otherFile, 'other');

            const oldTime = Date.now() - 2 * 60 * 60 * 1000;
            await fs.utimes(codeFile, new Date(oldTime), new Date(oldTime));
            await fs.utimes(inputFile, new Date(oldTime), new Date(oldTime));
            await fs.utimes(otherFile, new Date(oldTime), new Date(oldTime));

            const stats = await cleanupOldFiles(codeDir, 60 * 60 * 1000, '.*_(code|input)(\\..*)?$');

            expect(stats.filesDeleted).toBeGreaterThanOrEqual(2);
            try {
                await fs.access(otherFile);
            } catch {
                throw new Error('otherFile should not be deleted as it does not match the pattern');
            }
        });

        it('should delete old directories', async () => {
            const oldDir = path.join(outputDir, 'old_session');
            await fs.mkdir(oldDir, { recursive: true });
            await fs.writeFile(path.join(oldDir, 'file.txt'), 'content');

            const oldTime = Date.now() - 2 * 60 * 60 * 1000;
            await fs.utimes(oldDir, new Date(oldTime), new Date(oldTime));

            const stats = await cleanupOldFiles(outputDir, 60 * 60 * 1000);

            expect(stats.directoriesDeleted).toBe(1);
            await expect(fs.access(oldDir)).rejects.toThrow();
        });

        it('should calculate bytes freed', async () => {
            const file1 = path.join(codeDir, 'file1.txt');
            const file2 = path.join(codeDir, 'file2.txt');

            await fs.writeFile(file1, 'a'.repeat(1000));
            await fs.writeFile(file2, 'b'.repeat(2000));

            const oldTime = Date.now() - 2 * 60 * 60 * 1000;
            await fs.utimes(file1, new Date(oldTime), new Date(oldTime));
            await fs.utimes(file2, new Date(oldTime), new Date(oldTime));

            const stats = await cleanupOldFiles(codeDir, 60 * 60 * 1000);

            expect(stats.bytesFreed).toBeGreaterThanOrEqual(3000);
        });
    });

    describe('cleanupOldSessions', () => {
        it('should cleanup both code and output directories', async () => {
            const codeFile = path.join(codeDir, 'session123_code.py');
            const inputFile = path.join(codeDir, 'session123_input');
            const sessionDir = path.join(outputDir, 'session123');
            await fs.mkdir(sessionDir, { recursive: true });
            const outputFile = path.join(sessionDir, 'output.txt');
            await fs.writeFile(outputFile, 'output');

            const oldTime = Date.now() - 2 * 60 * 60 * 1000;
            await fs.writeFile(codeFile, 'code');
            await fs.writeFile(inputFile, 'input');

            await fs.utimes(codeFile, new Date(oldTime), new Date(oldTime));
            await fs.utimes(inputFile, new Date(oldTime), new Date(oldTime));

            await fs.utimes(outputFile, new Date(oldTime), new Date(oldTime));
            await new Promise((resolve) => setTimeout(resolve, 10));
            await fs.utimes(sessionDir, new Date(oldTime), new Date(oldTime));

            const stats = await cleanupOldSessions(codeDir, outputDir, 60 * 60 * 1000);

            expect(stats.filesDeleted).toBeGreaterThanOrEqual(2);
            expect(stats.directoriesDeleted + stats.filesDeleted).toBeGreaterThanOrEqual(2);
        });
    });

    describe('getDirectorySize', () => {
        it('should calculate directory size', async () => {
            const file1 = path.join(codeDir, 'file1.txt');
            const file2 = path.join(codeDir, 'file2.txt');
            const subDir = path.join(codeDir, 'subdir');
            await fs.mkdir(subDir, { recursive: true });
            const file3 = path.join(subDir, 'file3.txt');

            await fs.writeFile(file1, 'a'.repeat(100));
            await fs.writeFile(file2, 'b'.repeat(200));
            await fs.writeFile(file3, 'c'.repeat(300));

            const size = await getDirectorySize(codeDir);

            expect(size).toBeGreaterThanOrEqual(600);
        });

        it('should return 0 for empty directory', async () => {
            const size = await getDirectorySize(codeDir);
            expect(size).toBe(0);
        });
    });

    describe('getDirectoryCount', () => {
        it('should count files and directories', async () => {
            const file1 = path.join(codeDir, 'file1.txt');
            const file2 = path.join(codeDir, 'file2.txt');
            const subDir = path.join(codeDir, 'subdir');
            await fs.mkdir(subDir, { recursive: true });
            const file3 = path.join(subDir, 'file3.txt');

            await fs.writeFile(file1, 'content');
            await fs.writeFile(file2, 'content');
            await fs.writeFile(file3, 'content');

            const count = await getDirectoryCount(codeDir);

            expect(count.files).toBe(3);
            expect(count.directories).toBe(1);
        });

        it('should return zeros for empty directory', async () => {
            const count = await getDirectoryCount(codeDir);
            expect(count.files).toBe(0);
            expect(count.directories).toBe(0);
        });
    });
});
