import {
    filterDockerMessages,
    sanitizeError,
    sanitizeErrorForUser
} from '../../utils/errorHandling';

describe('Error Handling Utilities', () => {
    describe('filterDockerMessages', () => {
        it('should return empty string for non-string inputs', () => {
            expect(filterDockerMessages(null)).toBe('');
            expect(filterDockerMessages(undefined)).toBe('');
            expect(filterDockerMessages(123)).toBe('');
            expect(filterDockerMessages({})).toBe('');
        });

        it('should filter out Docker pull messages', () => {
            const dockerPullMessages = [
                'pulling from',
                'digest:',
                'status: downloaded',
                'already exists'
            ];
            dockerPullMessages.forEach(msg => {
                const result = filterDockerMessages(msg);
                expect(result).toBe('');
            });
        });

        it('should remove ANSI color codes', () => {
            const coloredText = '\x1b[31mError: Something went wrong\x1b[0m';
            const result = filterDockerMessages(coloredText);
            expect(result).not.toContain('\x1b');
            expect(result).toContain('Error: Something went wrong');
        });

        it('should preserve actual error messages', () => {
            const errorMessage = 'SyntaxError: Unexpected token';
            const result = filterDockerMessages(errorMessage);
            expect(result).toBe(errorMessage);
        });

        it('should truncate long messages to 500 characters', () => {
            const longMessage = 'a'.repeat(1000);
            const result = filterDockerMessages(longMessage);
            expect(result.length).toBeLessThanOrEqual(503); // 500 + '...'
            expect(result).toContain('...');
        });

        it('should handle multiline messages', () => {
            const multilineMessage = 'Line 1\nLine 2\nLine 3';
            const result = filterDockerMessages(multilineMessage);
            expect(result).toContain('Line 1');
            expect(result).toContain('Line 2');
            expect(result).toContain('Line 3');
        });

        it('should filter Docker pull lines from multiline text', () => {
            const mixedMessage = 'pulling from\nActual error message\nstatus: downloaded';
            const result = filterDockerMessages(mixedMessage);
            expect(result).not.toContain('pulling from');
            expect(result).not.toContain('status: downloaded');
            expect(result).toContain('Actual error message');
        });

        it('should handle empty strings', () => {
            expect(filterDockerMessages('')).toBe('');
        });
    });

    describe('sanitizeError', () => {
        it('should return empty string for non-string inputs', () => {
            expect(sanitizeError(null)).toBe('');
            expect(sanitizeError(undefined)).toBe('');
            expect(sanitizeError(123)).toBe('');
            expect(sanitizeError({})).toBe('');
        });

        it('should filter Docker messages', () => {
            const errorWithDocker = 'pulling from\nError: Command failed';
            const result = sanitizeError(errorWithDocker);
            expect(result).not.toContain('pulling from');
        });

        it('should replace file paths with placeholder', () => {
            const errorWithPath = 'Error in /home/user/code/file.py';
            const result = sanitizeError(errorWithPath);
            expect(result).toContain('[file path]');
            expect(result).not.toContain('/home/user/code/file.py');
        });

        it('should replace Windows file paths', () => {
            const errorWithWindowsPath = 'Error in C:\\Users\\test\\code.py';
            const result = sanitizeError(errorWithWindowsPath);
            expect(result).toContain('[file path]');
            expect(result).not.toContain('C:\\Users');
        });

        it('should remove debug patterns', () => {
            const errorWithDebug = '[DEBUG] Some debug info\nActual error';
            const result = sanitizeError(errorWithDebug);
            expect(result).not.toContain('[DEBUG]');
        });

        it('should truncate to 500 characters', () => {
            const longError = 'Error: ' + 'a'.repeat(1000);
            const result = sanitizeError(longError);
            expect(result.length).toBeLessThanOrEqual(503);
        });

        it('should preserve actual error information', () => {
            const error = 'TypeError: undefined is not a function';
            const result = sanitizeError(error);
            expect(result).toContain('TypeError');
        });
    });

    describe('sanitizeErrorForUser', () => {
        it('should return default message for non-string inputs', () => {
            expect(sanitizeErrorForUser(null)).toBe('An error occurred during execution.');
            expect(sanitizeErrorForUser(undefined)).toBe('An error occurred during execution.');
            expect(sanitizeErrorForUser(123)).toBe('An error occurred during execution.');
        });

        it('should detect Docker not running errors', () => {
            const dockerNotRunningErrors = [
                'Cannot connect to the Docker daemon',
                'Is the Docker daemon running?',
                'Docker daemon is not running'
            ];
            dockerNotRunningErrors.forEach(error => {
                const result = sanitizeErrorForUser(error);
                expect(result).toBe('Docker가 실행되지 않았습니다. Docker Desktop을 시작한 후 다시 시도해주세요.');
            });
        });

        it('should detect Docker not installed errors', () => {
            const dockerNotInstalledErrors = [
                "'docker' is not recognized",
                'docker: command not found',
                'spawn docker ENOENT'
            ];
            dockerNotInstalledErrors.forEach(error => {
                const result = sanitizeErrorForUser(error);
                expect(result).toBe('Docker가 설치되지 않았습니다. Docker를 설치한 후 다시 시도해주세요.');
            });
        });

        it('should detect Docker image not found errors', () => {
            const imageNotFoundErrors = [
                'No such image: python:3.12',
                'pull access denied for myimage',
                'repository does not exist'
            ];
            imageNotFoundErrors.forEach(error => {
                const result = sanitizeErrorForUser(error);
                expect(result).toBe('Docker 이미지를 찾을 수 없습니다. 필요한 이미지를 다운로드 중입니다. 잠시 후 다시 시도해주세요.');
            });
        });

        it('should detect Docker permission errors', () => {
            const permissionErrors = [
                'permission denied while trying to connect to Docker',
                'Docker permission denied'
            ];
            permissionErrors.forEach(error => {
                const result = sanitizeErrorForUser(error);
                expect(result).toBe('Docker 권한 오류가 발생했습니다. Docker 권한을 확인해주세요.');
            });
        });

        it('should detect invalid reference format errors', () => {
            const invalidRefErrors = [
                'docker: invalid reference format',
                'invalid reference format'
            ];
            invalidRefErrors.forEach(error => {
                const result = sanitizeErrorForUser(error);
                expect(result).toBe('Docker 명령어 형식 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            });
        });

        it('should handle Docker help text in errors', () => {
            const errorWithHelp = "docker: Error\nSome error details\nRun 'docker run --help' for more information";
            const result = sanitizeErrorForUser(errorWithHelp);
            expect(result).not.toContain("Run 'docker");
            expect(result).not.toContain('--help');
        });

        it('should remove file paths from user-facing errors', () => {
            const errorWithPath = 'Error in /tmp/code/12345_code.py at line 5';
            const result = sanitizeErrorForUser(errorWithPath);
            expect(result).toContain('[file path]');
            expect(result).not.toContain('/tmp/code/12345_code.py');
        });

        it('should limit error length to 300 characters', () => {
            const longError = 'Error: ' + 'a'.repeat(500);
            const result = sanitizeErrorForUser(longError);
            expect(result.length).toBeLessThanOrEqual(303); // 300 + '...'
        });

        it('should return default message for empty sanitized errors', () => {
            const emptyAfterSanitization = '[DEBUG] Only debug info\n[DEBUG] More debug';
            const result = sanitizeErrorForUser(emptyAfterSanitization);
            expect(result).toBe('실행 중 오류가 발생했습니다.');
        });

        it('should preserve meaningful error messages', () => {
            const meaningfulError = 'SyntaxError: invalid syntax at line 10';
            const result = sanitizeErrorForUser(meaningfulError);
            expect(result).toContain('SyntaxError');
            expect(result).toContain('invalid syntax');
        });

        it('should handle multiline errors correctly', () => {
            const multilineError = 'Error occurred\nLine 2 details\nLine 3 more details';
            const result = sanitizeErrorForUser(multilineError);
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
        });

        it('should remove stack traces', () => {
            const errorWithStack = 'Error: Something failed\n    at function1\n    at function2\n    at function3';
            const result = sanitizeErrorForUser(errorWithStack);
            // Stack traces should be removed or reduced
            expect(result).not.toContain('    at function1');
        });

        it('should handle Docker daemon response errors', () => {
            const daemonError = 'Error response from daemon: container not found';
            const result = sanitizeErrorForUser(daemonError);
            expect(result).toBeTruthy();
            expect(result).not.toContain('Error response from daemon');
        });

        it('should be case-insensitive for error detection', () => {
            const mixedCaseError = 'CANNOT CONNECT TO THE DOCKER DAEMON';
            const result = sanitizeErrorForUser(mixedCaseError);
            expect(result).toBe('Docker가 실행되지 않았습니다. Docker Desktop을 시작한 후 다시 시도해주세요.');
        });

        it('should handle error with "for more information" text', () => {
            const errorText = 'Some error occurred\nFor more information, see documentation';
            const result = sanitizeErrorForUser(errorText);
            expect(result).not.toContain('for more information');
        });

        it('should extract meaningful error from complex Docker errors', () => {
            const complexError = 'docker: Error response from daemon: invalid mount config\nRun \'docker run --help\' for more information.';
            const result = sanitizeErrorForUser(complexError);
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
        });
    });
});
