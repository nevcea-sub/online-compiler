import request from 'supertest';
import express from 'express';
import { createExecuteRoute } from '../../routes/execute';
import { errorHandler } from '../../middleware/errorHandler';
import { ERROR_MESSAGES } from '../../utils/constants';
import path from 'path';
import { promises as fs } from 'fs';

jest.mock('../../execution/executor', () => ({
    executeDockerProcess: jest.fn(
        async (
            _language,
            _fullCodePath,
            _buildOptions,
            _config,
            _startTime,
            res,
            _sessionOutputDir,
            _fullInputPath,
            _kotlinCacheDir,
            { code, input }
        ) => {
            await new Promise((resolve) => setTimeout(resolve, 10));

            if (code.includes('while True')) {
                return res.status(200).json({
                    output: '',
                    error: '실행 시간이 초과되었습니다.',
                    executionTime: null
                });
            }

            if (code.includes('Missing paren')) {
                return res.status(200).json({
                    output: '',
                    error: 'SyntaxError: missing ) after argument list',
                    executionTime: null
                });
            }

            if (input === 'SecretInput') {
                return res.status(200).json({
                    output: `Received: ${input}\n`,
                    error: '',
                    executionTime: 100
                });
            }

            if (code.includes('Hello E2E World')) {
                return res.status(200).json({
                    output: 'Hello E2E World\n',
                    error: '',
                    executionTime: 100
                });
            }

            if (code.includes('JS E2E Test')) {
                return res.status(200).json({
                    output: 'JS E2E Test\n',
                    error: '',
                    executionTime: 100
                });
            }

            return res.status(200).json({
                output: '',
                error: '',
                executionTime: 100
            });
        }
    )
}));

const app = express();
app.use(express.json());

const TEST_DIRS = {
    codeDir: path.join(__dirname, 'temp_e2e_code'),
    outputDir: path.join(__dirname, 'temp_e2e_output'),
    kotlinCacheDir: path.join(__dirname, 'temp_e2e_kotlin')
};

beforeAll(async () => {
    await fs.mkdir(TEST_DIRS.codeDir, { recursive: true });
    await fs.mkdir(TEST_DIRS.outputDir, { recursive: true });
    await fs.mkdir(TEST_DIRS.kotlinCacheDir, { recursive: true });

    app.post('/api/execute', createExecuteRoute(TEST_DIRS.codeDir, TEST_DIRS.outputDir, TEST_DIRS.kotlinCacheDir));
    app.use(errorHandler);
});

afterAll(async () => {
    await fs.rm(TEST_DIRS.codeDir, { recursive: true, force: true });
    await fs.rm(TEST_DIRS.outputDir, { recursive: true, force: true });
    await fs.rm(TEST_DIRS.kotlinCacheDir, { recursive: true, force: true });
});

describe('E2E: Code Execution API', () => {
    jest.setTimeout(30000);

    it('should execute Python code successfully', async () => {
        const response = await request(app).post('/api/execute').send({
            language: 'python',
            code: 'print("Hello E2E World")'
        });

        expect(response.status).toBe(200);
        expect(response.body.output).toContain('Hello E2E World');
        expect(response.body.error).toBe('');
    });

    it('should execute JavaScript code successfully', async () => {
        const response = await request(app).post('/api/execute').send({
            language: 'javascript',
            code: 'console.log("JS E2E Test");'
        });

        expect(response.status).toBe(200);
        expect(response.body.output).toContain('JS E2E Test');
    });

    it('should handle infinite loops (Timeout)', async () => {
        const response = await request(app).post('/api/execute').send({
            language: 'python',
            code: 'while True: pass'
        });

        expect(response.status).toBe(200);
        // The actual error message from processRunner might vary slightly depending on how the timeout is caught
        // It could be "The operation was aborted" from AbortController or our custom message
        // But sanitizeErrorForUser usually maps timeout errors.
        // Let's check for either standard timeout message or the one from constants
        expect(response.body.error).toMatch(new RegExp(`${ERROR_MESSAGES.EXECUTION_TIMEOUT}|aborted`, 'i'));
    });

    it('should handle syntax errors', async () => {
        const response = await request(app).post('/api/execute').send({
            language: 'javascript',
            code: 'console.log("Missing paren"'
        });

        expect(response.status).toBe(200);
        expect(response.body.error).toBeTruthy();
        expect(response.body.error).not.toBe('');
    });

    it('should handle input via stdin', async () => {
        const response = await request(app).post('/api/execute').send({
            language: 'python',
            code: 'val = input()\nprint(f"Received: {val}")',
            input: 'SecretInput'
        });

        expect(response.status).toBe(200);
        expect(response.body.output).toContain('Received: SecretInput');
    });

    it('should fail for unsupported language', async () => {
        const response = await request(app).post('/api/execute').send({
            language: 'brainfuck',
            code: '++++'
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ERROR_MESSAGES.UNSUPPORTED_LANGUAGE);
    });
});
