import {
    buildPythonCommand,
    buildJavascriptCommand,
    buildJavaCommand,
    buildCppCommand,
    buildCCommand,
    buildRustCommand,
    buildPhpCommand,
    buildRCommand,
    buildRubyCommand,
    buildCsharpCommand,
    buildGoCommand,
    buildTypescriptCommand,
    buildSwiftCommand,
    buildPerlCommand,
    buildHaskellCommand,
    buildBashCommand
} from '../../config/languageCommands';

describe('Language Commands', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('buildPythonCommand', () => {
        it('should build Python command without input', () => {
            const cmd = buildPythonCommand('/tmp/code.py');
            expect(cmd).toContain('python3');
            expect(cmd).toContain('/tmp/code.py');
            expect(cmd).not.toContain('input.txt');
        });

        it('should build Python command with input', () => {
            const cmd = buildPythonCommand('/tmp/code.py', '/tmp/input.txt');
            expect(cmd).toContain('python3');
            expect(cmd).toContain('/tmp/code.py');
            expect(cmd).toContain('input.txt');
            expect(cmd).toContain('cp');
        });
    });

    describe('buildJavascriptCommand', () => {
        it('should build JavaScript command without input', () => {
            const cmd = buildJavascriptCommand('/tmp/code.js');
            expect(cmd).toContain('node');
            expect(cmd).toContain('/tmp/code.js');
            expect(cmd).not.toContain('input.txt');
        });

        it('should build JavaScript command with input', () => {
            const cmd = buildJavascriptCommand('/tmp/code.js', '/tmp/input.txt');
            expect(cmd).toContain('node');
            expect(cmd).toContain('/tmp/code.js');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildJavaCommand', () => {
        it('should build Java command without input', () => {
            const cmd = buildJavaCommand('/tmp/Main.java');
            expect(cmd).toContain('javac');
            expect(cmd).toContain('java');
            expect(cmd).toContain('Main');
            expect(cmd).not.toContain('input.txt');
        });

        it('should build Java command with input', () => {
            const cmd = buildJavaCommand('/tmp/Main.java', '/tmp/input.txt');
            expect(cmd).toContain('javac');
            expect(cmd).toContain('java');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildCppCommand', () => {
        it('should build C++ command without input', () => {
            const cmd = buildCppCommand('/tmp/code.cpp');
            expect(cmd).toContain('g++');
            expect(cmd).toContain('/tmp/code.cpp');
            expect(cmd).toContain('a.out');
        });

        it('should build C++ command with input', () => {
            const cmd = buildCppCommand('/tmp/code.cpp', '/tmp/input.txt');
            expect(cmd).toContain('g++');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildCCommand', () => {
        it('should build C command without input', () => {
            const cmd = buildCCommand('/tmp/code.c');
            expect(cmd).toContain('gcc');
            expect(cmd).toContain('/tmp/code.c');
            expect(cmd).toContain('a.out');
        });

        it('should build C command with input', () => {
            const cmd = buildCCommand('/tmp/code.c', '/tmp/input.txt');
            expect(cmd).toContain('gcc');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildRustCommand', () => {
        it('should build Rust command without input', () => {
            const cmd = buildRustCommand('/tmp/code.rs');
            expect(cmd).toContain('rustc');
            expect(cmd).toContain('/tmp/code.rs');
        });

        it('should build Rust command with input', () => {
            const cmd = buildRustCommand('/tmp/code.rs', '/tmp/input.txt');
            expect(cmd).toContain('rustc');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildPhpCommand', () => {
        it('should build PHP command without input', () => {
            const cmd = buildPhpCommand('/tmp/code.php');
            expect(cmd).toContain('php');
            expect(cmd).toContain('/tmp/code.php');
        });

        it('should build PHP command with input', () => {
            const cmd = buildPhpCommand('/tmp/code.php', '/tmp/input.txt');
            expect(cmd).toContain('php');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildRCommand', () => {
        it('should build R command without input', () => {
            const cmd = buildRCommand('/tmp/code.r');
            expect(cmd).toContain('Rscript');
            expect(cmd).toContain('/tmp/code.r');
        });

        it('should build R command with input', () => {
            const cmd = buildRCommand('/tmp/code.r', '/tmp/input.txt');
            expect(cmd).toContain('Rscript');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildRubyCommand', () => {
        it('should build Ruby command without input', () => {
            const cmd = buildRubyCommand('/tmp/code.rb');
            expect(cmd).toContain('ruby');
            expect(cmd).toContain('/tmp/code.rb');
        });

        it('should build Ruby command with input', () => {
            const cmd = buildRubyCommand('/tmp/code.rb', '/tmp/input.txt');
            expect(cmd).toContain('ruby');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildCsharpCommand', () => {
        it('should build C# command without input', () => {
            const cmd = buildCsharpCommand('/tmp/Program.cs');
            expect(cmd).toContain('dotnet');
            expect(cmd).toContain('/tmp/Program.cs');
            expect(cmd).toContain('Program/Program.cs');
        });

        it('should build C# command with input', () => {
            const cmd = buildCsharpCommand('/tmp/Program.cs', '/tmp/input.txt');
            expect(cmd).toContain('dotnet');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildGoCommand', () => {
        it('should build Go command without input', () => {
            const cmd = buildGoCommand('/tmp/code.go');
            expect(cmd).toContain('go run');
            expect(cmd).toContain('/tmp/code.go');
        });

        it('should build Go command with input', () => {
            const cmd = buildGoCommand('/tmp/code.go', '/tmp/input.txt');
            expect(cmd).toContain('go run');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildTypescriptCommand', () => {
        it('should build TypeScript command without input', () => {
            const cmd = buildTypescriptCommand('/tmp/code.ts');
            expect(cmd).toContain('tsx');
            expect(cmd).toContain('/tmp/code.ts');
        });

        it('should build TypeScript command with input', () => {
            const cmd = buildTypescriptCommand('/tmp/code.ts', '/tmp/input.txt');
            expect(cmd).toContain('tsx');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildSwiftCommand', () => {
        it('should build Swift command without input', () => {
            const cmd = buildSwiftCommand('/tmp/code.swift');
            expect(cmd).toContain('swift');
            expect(cmd).toContain('/tmp/code.swift');
        });

        it('should build Swift command with input', () => {
            const cmd = buildSwiftCommand('/tmp/code.swift', '/tmp/input.txt');
            expect(cmd).toContain('swift');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildPerlCommand', () => {
        it('should build Perl command without input', () => {
            const cmd = buildPerlCommand('/tmp/code.pl');
            expect(cmd).toContain('perl');
            expect(cmd).toContain('/tmp/code.pl');
        });

        it('should build Perl command with input', () => {
            const cmd = buildPerlCommand('/tmp/code.pl', '/tmp/input.txt');
            expect(cmd).toContain('perl');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildHaskellCommand', () => {
        it('should build Haskell command without input', () => {
            const cmd = buildHaskellCommand('/tmp/code.hs');
            expect(cmd).toContain('ghc');
            expect(cmd).toContain('/tmp/code.hs');
        });

        it('should build Haskell command with input', () => {
            const cmd = buildHaskellCommand('/tmp/code.hs', '/tmp/input.txt');
            expect(cmd).toContain('ghc');
            expect(cmd).toContain('input.txt');
        });
    });

    describe('buildBashCommand', () => {
        it('should build Bash command without input', () => {
            const cmd = buildBashCommand('/tmp/code.sh');
            expect(cmd).toContain('bash');
            expect(cmd).toContain('/tmp/code.sh');
        });

        it('should build Bash command with input', () => {
            const cmd = buildBashCommand('/tmp/code.sh', '/tmp/input.txt');
            expect(cmd).toContain('bash');
            expect(cmd).toContain('input.txt');
        });
    });
});
