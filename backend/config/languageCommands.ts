const TMP_INPUT_PATH = '/tmp/input.txt';
const TMP_DIR = '/tmp';
const REDIRECT_STDERR = '2>&1';

function buildInputRedirection(inputPath?: string): string {
    if (!inputPath) {
        return '';
    }
    return `cp "${inputPath}" "${TMP_INPUT_PATH}" && `;
}

function addInputRedirect(command: string, inputPath?: string): string {
    if (!inputPath) {
        return command;
    }
    return `${command} < "${TMP_INPUT_PATH}"`;
}

function buildSimpleCommand(
    executor: string,
    path: string,
    inputPath?: string,
    envVars: string[] = []
): string {
    const envStr = envVars.length > 0 ? envVars.join(' ') + ' && ' : '';
    const inputCopy = buildInputRedirection(inputPath);
    const baseCommand = `${envStr}${executor} "${path}"`;
    const command = addInputRedirect(baseCommand, inputPath);
    return `cd ${TMP_DIR} && ${inputCopy}${command} ${REDIRECT_STDERR}`;
}

function buildCompileAndRunCommand(
    compileCmd: string,
    runCmd: string,
    path: string,
    inputPath?: string,
    envVars: string[] = []
): string {
    const envStr = envVars.length > 0 ? envVars.join(' ') + ' && ' : '';
    const inputCopy = buildInputRedirection(inputPath);
    const compile = `${compileCmd} "${path}" ${REDIRECT_STDERR}`;
    const run = addInputRedirect(runCmd, inputPath);
    return `cd ${TMP_DIR} && ${compile} && ${inputCopy}${envStr}${run} ${REDIRECT_STDERR}`;
}

export function buildPythonCommand(path: string, inputPath?: string): string {
    const envVars = 'PYTHONUNBUFFERED=1';
    const python3Cmd = `python3 -u "${path}"`;
    const pythonCmd = `python -u "${path}"`;

    if (inputPath) {
        const inputCopy = buildInputRedirection(inputPath);
        const cmd = `${python3Cmd} < "${TMP_INPUT_PATH}" ${REDIRECT_STDERR} || ${pythonCmd} < "${TMP_INPUT_PATH}" ${REDIRECT_STDERR}`;
        return `cd ${TMP_DIR} && ${inputCopy}${envVars} ${cmd}`;
    } else {
        const cmd = `${python3Cmd} ${REDIRECT_STDERR} || ${pythonCmd} ${REDIRECT_STDERR}`;
        return `cd ${TMP_DIR} && ${envVars} ${cmd}`;
    }
}

export function buildJavascriptCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const inputCopy = buildInputRedirection(inputPath);
        return `cd ${TMP_DIR} && ${inputCopy}node "${path}" < "${TMP_INPUT_PATH}" ${REDIRECT_STDERR}`;
    }
    return `cd ${TMP_DIR} && node "${path}" ${REDIRECT_STDERR}`;
}

export function buildJavaCommand(path: string, inputPath?: string): string {
    const jvmOpts = '-J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1';
    const compileCmd = `javac ${jvmOpts}`;
    const runCmd = `java -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -cp ${TMP_DIR} Main`;
    return buildCompileAndRunCommand(compileCmd, runCmd, path, inputPath);
}

export function buildCppCommand(path: string, inputPath?: string): string {
    const compileCmd = 'g++ -O1 -pipe -o /tmp/a.out';
    const runCmd = '/tmp/a.out';
    return buildCompileAndRunCommand(compileCmd, runCmd, path, inputPath);
}

export function buildCCommand(path: string, inputPath?: string): string {
    const compileCmd = 'gcc -O1 -pipe -o /tmp/a.out';
    const runCmd = '/tmp/a.out';
    return buildCompileAndRunCommand(compileCmd, runCmd, path, inputPath);
}

export function buildRustCommand(path: string, inputPath?: string): string {
    const compileCmd = 'rustc -C opt-level=1 -o /tmp/a.out';
    const runCmd = '/tmp/a.out';
    return buildCompileAndRunCommand(compileCmd, runCmd, path, inputPath);
}

export function buildPhpCommand(path: string, inputPath?: string): string {
    return buildSimpleCommand('php', path, inputPath);
}

export function buildRCommand(path: string, inputPath?: string): string {
    return buildSimpleCommand('Rscript', path, inputPath);
}

export function buildRubyCommand(path: string, inputPath?: string): string {
    return buildSimpleCommand('ruby', path, inputPath);
}

export function buildCsharpCommand(path: string, inputPath?: string): string {
    const setup = 'rm -rf Program 2>/dev/null && dotnet new console -n Program --force';
    const build = 'cd Program && dotnet build -c Release --no-restore -nologo -v q';
    const exec = 'dotnet exec bin/Release/net*/Program.dll';

    if (inputPath) {
        const inputCopy = buildInputRedirection(inputPath);
        return `cd ${TMP_DIR} && ${setup} && cp ${path} Program/Program.cs && ${inputCopy}${build} && ${exec} < "${TMP_INPUT_PATH}" ${REDIRECT_STDERR}`;
    } else {
        return `cd ${TMP_DIR} && ${setup} && cp ${path} Program/Program.cs && ${build} && ${exec} ${REDIRECT_STDERR}`;
    }
}

export function buildGoCommand(path: string, inputPath?: string): string {
    const envVars = ['export GOCACHE=/tmp/.cache/go-build', 'export HOME=/tmp'];
    return buildSimpleCommand('go run', path, inputPath, envVars);
}

export function buildTypescriptCommand(path: string, inputPath?: string): string {
    const envVars = ['export HOME=/tmp', 'export npm_config_cache=/tmp/.npm'];
    return buildSimpleCommand('npx -y tsx', path, inputPath, envVars);
}

export function buildSwiftCommand(path: string, inputPath?: string): string {
    const envVars = ['export HOME=/tmp'];
    return buildSimpleCommand('swift', path, inputPath, envVars);
}

export function buildPerlCommand(path: string, inputPath?: string): string {
    return buildSimpleCommand('perl', path, inputPath);
}

export function buildHaskellCommand(path: string, inputPath?: string): string {
    const compileCmd = 'ghc -o /tmp/a.out';
    const runCmd = '/tmp/a.out';
    return buildCompileAndRunCommand(compileCmd, runCmd, path, inputPath);
}

export function buildBashCommand(path: string, inputPath?: string): string {
    return buildSimpleCommand('bash', path, inputPath);
}
