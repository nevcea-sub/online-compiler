import { createExecuteRoute } from '../../routes/execute';
import { healthRoute } from '../../routes/health';
import { Request, Response } from 'express';
import { createMockRequest, createMockResponse } from '../helpers/testHelpers';

export function runExecuteRouteTests() {
    describe('Execute Route Validation', () => {
        let mockRequest: ReturnType<typeof createMockRequest>;
        let mockResponse: ReturnType<typeof createMockResponse>;
        let executeRoute: ReturnType<typeof createExecuteRoute>;

        const testCodeDir = '/tmp/test-code';
        const testOutputDir = '/tmp/test-output';
        const testKotlinCacheDir = '/tmp/test-kotlin';

        beforeEach(() => {
            jest.clearAllMocks();
            mockResponse = createMockResponse();
            executeRoute = createExecuteRoute(testCodeDir, testOutputDir, testKotlinCacheDir);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('Request Validation', () => {
            it('should reject request without code', async () => {
                mockRequest = createMockRequest({
                    body: {
                        language: 'python'
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
                expect(mockResponse.json).toHaveBeenCalledWith({ error: '코드와 언어는 필수입니다.' });
            });

            it('should reject request without language', async () => {
                mockRequest = createMockRequest({
                    body: {
                        code: 'print("hello")'
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
                expect(mockResponse.json).toHaveBeenCalledWith({ error: '코드와 언어는 필수입니다.' });
            });

            it('should reject request with non-string code', async () => {
                mockRequest = createMockRequest({
                    body: {
                        code: 123,
                        language: 'python'
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
                expect(mockResponse.json).toHaveBeenCalledWith({ error: '잘못된 입력 형식입니다.' });
            });

            it('should reject request with non-string language', async () => {
                mockRequest = createMockRequest({
                    body: {
                        code: 'print("hello")',
                        language: 123
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
                expect(mockResponse.json).toHaveBeenCalledWith({ error: '잘못된 입력 형식입니다.' });
            });

            it('should reject code exceeding max length', async () => {
                const longCode = 'a'.repeat(100001);
                mockRequest = createMockRequest({
                    body: {
                        code: longCode,
                        language: 'python'
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
                expect(mockResponse.json).toHaveBeenCalledWith({
                    error: '코드 길이가 최대 100000자를 초과했습니다.'
                });
            });

            it('should reject unsupported language', async () => {
                mockRequest = createMockRequest({
                    body: {
                        code: 'print("hello")',
                        language: 'unsupported-lang'
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
                expect(mockResponse.json).toHaveBeenCalledWith({ error: '지원하지 않는 언어입니다.' });
            });

            it('should reject input exceeding max length', async () => {
                const longInput = 'a'.repeat(1000001);
                mockRequest = createMockRequest({
                    body: {
                        code: 'print("hello")',
                        language: 'python',
                        input: longInput
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
                expect(mockResponse.json).toHaveBeenCalledWith({
                    error: '입력 길이가 최대 1000000자를 초과했습니다.'
                });
            });

            it('should reject empty code', async () => {
                mockRequest = createMockRequest({
                    body: {
                        code: '',
                        language: 'python'
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
            });

            it('should reject whitespace-only code', async () => {
                mockRequest = createMockRequest({
                    body: {
                        code: '   ',
                        language: 'python'
                    }
                });

                await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                expect(mockResponse.status).toHaveBeenCalledWith(400);
            });

            it('should reject code with dangerous patterns', async () => {
                const dangerousCodes = [
                    'rm -rf /',
                    'docker run malicious',
                    'sudo su'
                ];

                for (const code of dangerousCodes) {
                    jest.clearAllMocks();
                    mockRequest = createMockRequest({
                        body: {
                            code,
                            language: 'bash'
                        }
                    });

                    await executeRoute(mockRequest as Request, mockResponse as unknown as Response);

                    expect(mockResponse.status).toHaveBeenCalledWith(400);
                }
            });
        });
    });
}

export function runHealthRouteTests() {
    describe('Health Route', () => {
        let mockRequest: ReturnType<typeof createMockRequest>;
        let mockResponse: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            jest.clearAllMocks();
            mockRequest = createMockRequest();
            mockResponse = createMockResponse();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return status ok', async () => {
            await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

            expect(mockResponse.json).toHaveBeenCalledTimes(1);
            const callArgs = mockResponse.json.mock.calls[0][0];
            expect(callArgs).toHaveProperty('status');
            expect(callArgs.status).toBe('ok');
            expect(callArgs).toHaveProperty('queue');
            expect(callArgs).toHaveProperty('resources');
            expect(callArgs).toHaveProperty('timestamp');
        });

        it('should not call status method', async () => {
            await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return object with status property', async () => {
            await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

            const callArgs = mockResponse.json.mock.calls[0][0];
            expect(callArgs).toHaveProperty('status');
            expect(callArgs.status).toBe('ok');
            expect(callArgs).toHaveProperty('queue');
            expect(callArgs.queue).toHaveProperty('running');
            expect(callArgs.queue).toHaveProperty('queued');
            expect(callArgs).toHaveProperty('resources');
            expect(callArgs.resources).toHaveProperty('memory');
            expect(callArgs.resources).toHaveProperty('uptime');
        });

        it('should handle multiple consecutive calls', async () => {
            await healthRoute(mockRequest as Request, mockResponse as unknown as Response);
            await healthRoute(mockRequest as Request, mockResponse as unknown as Response);
            await healthRoute(mockRequest as Request, mockResponse as unknown as Response);

            expect(mockResponse.json).toHaveBeenCalledTimes(3);
            mockResponse.json.mock.calls.forEach((call: any[]) => {
                expect(call[0]).toHaveProperty('status');
                expect(call[0].status).toBe('ok');
                expect(call[0]).toHaveProperty('queue');
                expect(call[0]).toHaveProperty('resources');
            });
        });

        it('should work with different request objects', async () => {
            const req1 = createMockRequest({ query: { test: 'value' } });
            const req2 = createMockRequest({ params: { id: '123' } });
            const req3 = createMockRequest({ body: { data: 'test' } });

            await healthRoute(req1 as Request, mockResponse as unknown as Response);
            await healthRoute(req2 as Request, mockResponse as unknown as Response);
            await healthRoute(req3 as Request, mockResponse as unknown as Response);

            expect(mockResponse.json).toHaveBeenCalledTimes(3);
            mockResponse.json.mock.calls.forEach((call: any[]) => {
                expect(call[0]).toHaveProperty('status');
                expect(call[0].status).toBe('ok');
            });
        });

        it('should return Promise', async () => {
            const result = healthRoute(mockRequest as Request, mockResponse as unknown as Response);

            expect(result).toBeInstanceOf(Promise);
            await result;
            expect(mockResponse.json).toHaveBeenCalled();
        });
    });
}

