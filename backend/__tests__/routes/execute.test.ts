import { createExecuteRoute } from '../../routes/execute';
import { Request, Response } from 'express';

describe('Execute Route Validation', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let executeRoute: ReturnType<typeof createExecuteRoute>;

    const testCodeDir = '/tmp/test-code';
    const testOutputDir = '/tmp/test-output';
    const testKotlinCacheDir = '/tmp/test-kotlin';

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis();

        mockResponse = {
            json: jsonMock,
            status: statusMock
        };

        executeRoute = createExecuteRoute(testCodeDir, testOutputDir, testKotlinCacheDir);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Request Validation', () => {
        it('should reject request without code', async () => {
            mockRequest = {
                body: {
                    language: 'python'
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: '코드와 언어는 필수입니다.' });
        });

        it('should reject request without language', async () => {
            mockRequest = {
                body: {
                    code: 'print("hello")'
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: '코드와 언어는 필수입니다.' });
        });

        it('should reject request with non-string code', async () => {
            mockRequest = {
                body: {
                    code: 123,
                    language: 'python'
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: '잘못된 입력 형식입니다.' });
        });

        it('should reject request with non-string language', async () => {
            mockRequest = {
                body: {
                    code: 'print("hello")',
                    language: 123
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: '잘못된 입력 형식입니다.' });
        });

        it('should reject code exceeding max length', async () => {
            const longCode = 'a'.repeat(100001);
            mockRequest = {
                body: {
                    code: longCode,
                    language: 'python'
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                error: '코드 길이가 최대 100000자를 초과했습니다.'
            });
        });

        it('should reject unsupported language', async () => {
            mockRequest = {
                body: {
                    code: 'print("hello")',
                    language: 'unsupported-lang'
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: '지원하지 않는 언어입니다.' });
        });

        it('should reject input exceeding max length', async () => {
            const longInput = 'a'.repeat(1000001);
            mockRequest = {
                body: {
                    code: 'print("hello")',
                    language: 'python',
                    input: longInput
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                error: '입력 길이가 최대 1000000자를 초과했습니다.'
            });
        });

        it('should reject empty code', async () => {
            mockRequest = {
                body: {
                    code: '',
                    language: 'python'
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should reject whitespace-only code', async () => {
            mockRequest = {
                body: {
                    code: '   ',
                    language: 'python'
                }
            };

            await executeRoute(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should reject code with dangerous patterns', async () => {
            const dangerousCodes = [
                'rm -rf /',
                'docker run malicious',
                'sudo su'
            ];

            for (const code of dangerousCodes) {
                jest.clearAllMocks();
                mockRequest = {
                    body: {
                        code,
                        language: 'bash'
                    }
                };

                await executeRoute(mockRequest as Request, mockResponse as Response);

                expect(statusMock).toHaveBeenCalledWith(400);
            }
        });
    });
});
