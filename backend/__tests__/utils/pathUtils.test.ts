import {
    normalizePath,
    validatePath,
    convertToDockerPath,
    getContainerCodePath
} from '../../utils/pathUtils';
import path from 'path';

jest.mock('fs');

describe('Path Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('normalizePath', () => {
        it('should normalize valid file paths', () => {
            const validPaths = [
                '/tmp/code.py',
                'relative/path/file.js',
                './current/dir/file.txt'
            ];
            validPaths.forEach(filePath => {
                const result = normalizePath(filePath);
                expect(result).toBeTruthy();
                expect(typeof result).toBe('string');
            });
        });

        it('should handle paths with multiple slashes', () => {
            const result = normalizePath('/tmp//code///file.py');
            expect(result).toBeTruthy();
            expect(result).not.toContain('//');
        });

        it('should handle paths with backslashes', () => {
            const result = normalizePath('C:\\Users\\test\\code.py');
            expect(result).toBeTruthy();
        });

        it('should return null for non-string inputs', () => {
            expect(normalizePath(123)).toBeNull();
            expect(normalizePath(null)).toBeNull();
            expect(normalizePath(undefined)).toBeNull();
            expect(normalizePath({})).toBeNull();
            expect(normalizePath([])).toBeNull();
        });

        it('should return null for empty or whitespace-only strings', () => {
            expect(normalizePath('')).toBeNull();
            expect(normalizePath('   ')).toBeNull();
            expect(normalizePath('\t\t')).toBeNull();
        });

        it('should trim whitespace from paths', () => {
            const result = normalizePath('  /tmp/code.py  ');
            expect(result).toBeTruthy();
            expect(result).not.toMatch(/^\s+|\s+$/);
        });

        it('should handle relative paths with .. and .', () => {
            const result = normalizePath('./folder/../file.txt');
            expect(result).toBeTruthy();
        });
    });

    describe('validatePath', () => {
        it('should validate legitimate file paths', () => {
            const validPaths = [
                '/tmp/code.py',
                '/home/user/project/file.js',
                path.resolve('./test.txt')
            ];
            validPaths.forEach(filePath => {
                expect(validatePath(filePath)).toBe(true);
            });
        });

        it('should reject invalid inputs', () => {
            expect(validatePath(123)).toBe(false);
            expect(validatePath(null)).toBe(false);
            expect(validatePath(undefined)).toBe(false);
            expect(validatePath({})).toBe(false);
            expect(validatePath('')).toBe(false);
            expect(validatePath('   ')).toBe(false);
        });

        it('should handle absolute paths', () => {
            const absolutePath = path.resolve('/tmp/test.txt');
            expect(validatePath(absolutePath)).toBe(true);
        });

        it('should handle relative paths correctly', () => {
            const relativePath = './relative/path.txt';
            const result = validatePath(relativePath);
            expect(typeof result).toBe('boolean');
        });

        describe('Security - Path Traversal Prevention', () => {
            it('should detect path traversal attempts with ..', () => {
                const traversalPaths = [
                    '../../../etc/passwd',
                    '../../etc/shadow',
                    './../../boot/grub',
                    'code/../../../root/'
                ];
                traversalPaths.forEach(filePath => {
                    const result = validatePath(filePath);
                    expect(typeof result).toBe('boolean');
                });
            });

            it('should handle null byte injection attempts', () => {
                const maliciousPaths = [
                    '/tmp/file.txt\x00.jpg',
                    'test\x00../../etc/passwd',
                    'file.py\0.txt'
                ];
                maliciousPaths.forEach(filePath => {
                    const result = validatePath(filePath);
                    expect(typeof result).toBe('boolean');
                });
            });

            it('should handle symbolic link style paths safely', () => {
                const symlinkPaths = [
                    '/tmp/symlink',
                    '/home/user/.ssh/authorized_keys',
                    '/var/www/html/../../../etc'
                ];
                symlinkPaths.forEach(filePath => {
                    const result = validatePath(filePath);
                    expect(typeof result).toBe('boolean');
                });
            });

            it('should handle URL-encoded path traversal attempts', () => {
                const encodedPaths = [
                    '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
                    '..%2f..%2f..%2froot',
                    'file%00.txt'
                ];
                encodedPaths.forEach(filePath => {
                    const result = validatePath(filePath);
                    expect(typeof result).toBe('boolean');
                });
            });

            it('should reject paths with suspicious patterns', () => {
                const suspiciousPaths = [
                    '/etc/passwd',
                    '/etc/shadow',
                    '/root/.ssh/id_rsa',
                    '/proc/self/environ',
                    'C:\\Windows\\System32\\config\\SAM'
                ];
                suspiciousPaths.forEach(filePath => {
                    const result = validatePath(filePath);
                    expect(typeof result).toBe('boolean');
                });
            });
        });

        it('should validate paths with special characters', () => {
            const pathsWithSpecialChars = [
                '/tmp/file-name.txt',
                '/tmp/file_name.txt',
                '/tmp/file.name.txt'
            ];
            pathsWithSpecialChars.forEach(filePath => {
                expect(validatePath(filePath)).toBe(true);
            });
        });
    });

    describe('convertToDockerPath', () => {
        it('should convert Unix paths correctly', () => {
            const unixPath = '/tmp/code/file.py';
            const result = convertToDockerPath(unixPath);
            expect(result).toBe(unixPath);
        });

        it('should throw error for invalid paths', () => {
            expect(() => convertToDockerPath(null as any)).toThrow('Invalid file path');
            expect(() => convertToDockerPath(undefined as any)).toThrow('Invalid file path');
            expect(() => convertToDockerPath('   ')).toThrow('Invalid file path');
        });

        it('should handle relative paths', () => {
            const relativePath = './relative/path.txt';
            const result = convertToDockerPath(relativePath);
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('should handle paths with backslashes', () => {
            const mixedPath = 'folder\\subfolder/file.txt';
            const result = convertToDockerPath(mixedPath);
            expect(result).toBeTruthy();
        });

        if (process.platform === 'win32') {
            it('should convert Windows paths to Docker format on Windows', () => {
                const windowsPath = 'C:\\Users\\test\\code.py';
                const result = convertToDockerPath(windowsPath);
                expect(result).toBe('/c/Users/test/code.py');
            });

            it('should handle different drive letters on Windows', () => {
                const drives = ['C:', 'D:', 'E:'];
                drives.forEach(drive => {
                    const windowsPath = `${drive}\\temp\\file.txt`;
                    const result = convertToDockerPath(windowsPath);
                    expect(result).toMatch(/^\/[a-z]\//);
                    expect(result).not.toContain('\\');
                });
            });
        }
    });

    describe('getContainerCodePath', () => {
        it('should return specific path for Java', () => {
            const containerPaths = { java: '/tmp/Main.java' };
            const result = getContainerCodePath('java', '.java', containerPaths);
            expect(result).toBe('/tmp/Main.java');
        });

        it('should return specific path for C#', () => {
            const containerPaths = { csharp: '/tmp/Program.cs' };
            const result = getContainerCodePath('csharp', '.cs', containerPaths);
            expect(result).toBe('/tmp/Program.cs');
        });

        it('should return default path for unlisted languages', () => {
            const containerPaths = {};
            const result = getContainerCodePath('python', '.py', containerPaths);
            expect(result).toBe('/tmp/code.py');
        });

        it('should use correct extension in default path', () => {
            const containerPaths = {};
            const extensions = ['.js', '.cpp', '.rs', '.go'];
            extensions.forEach(ext => {
                const result = getContainerCodePath('somelang', ext, containerPaths);
                expect(result).toBe(`/tmp/code${ext}`);
            });
        });

        it('should prioritize custom paths over default', () => {
            const containerPaths = { python: '/custom/python.py' };
            const result = getContainerCodePath('python', '.py', containerPaths);
            expect(result).toBe('/custom/python.py');
        });
    });

    describe('kotlinCompilerExistsOnHost', () => {
        it('should return true when Kotlin compiler exists', () => {
            jest.isolateModules(() => {
                const { kotlinCompilerExistsOnHost } = require('../../utils/pathUtils');
                const fs = require('fs');
                (fs.existsSync as jest.Mock).mockReturnValue(true);

                const result = kotlinCompilerExistsOnHost('/tmp/kotlin_cache');
                expect(result).toBe(true);
            });
        });

        it('should return false when Kotlin compiler does not exist', () => {
            jest.isolateModules(() => {
                const { kotlinCompilerExistsOnHost } = require('../../utils/pathUtils');
                const fs = require('fs');
                (fs.existsSync as jest.Mock).mockReturnValue(false);

                const result = kotlinCompilerExistsOnHost('/tmp/kotlin_cache');
                expect(result).toBe(false);
            });
        });

        it('should cache results for performance', () => {
            jest.isolateModules(() => {
                const { kotlinCompilerExistsOnHost } = require('../../utils/pathUtils');
                const fs = require('fs');
                (fs.existsSync as jest.Mock).mockReturnValue(true);

                kotlinCompilerExistsOnHost('/tmp/kotlin_cache');
                expect(fs.existsSync).toHaveBeenCalledTimes(1);

                kotlinCompilerExistsOnHost('/tmp/kotlin_cache');
                expect(fs.existsSync).toHaveBeenCalledTimes(1);
            });
        });

        it('should handle errors gracefully', () => {
            jest.isolateModules(() => {
                const { kotlinCompilerExistsOnHost } = require('../../utils/pathUtils');
                const fs = require('fs');
                (fs.existsSync as jest.Mock).mockImplementation(() => {
                    throw new Error('File system error');
                });

                const result = kotlinCompilerExistsOnHost('/tmp/kotlin_cache');
                expect(result).toBe(false);
            });
        });

        it('should check correct Kotlin compiler path', () => {
            jest.isolateModules(() => {
                const { kotlinCompilerExistsOnHost } = require('../../utils/pathUtils');
                const fs = require('fs');
                (fs.existsSync as jest.Mock).mockReturnValue(true);

                const cacheDir = '/custom/kotlin_cache';
                kotlinCompilerExistsOnHost(cacheDir);

                const expectedPath = path.join(cacheDir, 'kotlinc', 'lib', 'kotlin-compiler.jar');
                expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
            });
        });
    });
});
