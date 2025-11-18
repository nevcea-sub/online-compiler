export function buildPythonCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && export PYTHONPATH=/tmp PYTHONUNBUFFERED=1 && python3 -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" < "${tmpInputPath}" 2>&1 || python -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && export PYTHONPATH=/tmp PYTHONUNBUFFERED=1 && (python3 -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" 2>&1 || python -u -c "import runpy,sys; sys.path.insert(0,'/tmp'); runpy.run_path('${path}', run_name='__main__')" 2>&1)`;
    }
}

export function buildJavascriptCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && node "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && node "${path}" 2>&1`;
    }
}

export function buildJavaCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && javac -J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1 "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && java -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -cp /tmp Main < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && javac -J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1 "${path}" 2>&1 && java -XX:+TieredCompilation -J-XX:TieredStopAtLevel=1 -cp /tmp Main 2>&1`;
    }
}

export function buildCppCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && g++ -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && g++ -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && /tmp/a.out 2>&1`;
    }
}

export function buildCCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && gcc -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && gcc -O1 -pipe -o /tmp/a.out "${path}" 2>&1 && /tmp/a.out 2>&1`;
    }
}

export function buildRustCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && rustc -C opt-level=1 "${path}" -o /tmp/a.out 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && rustc -C opt-level=1 "${path}" -o /tmp/a.out 2>&1 && /tmp/a.out 2>&1`;
    }
}

export function buildPhpCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && php "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && php "${path}" 2>&1`;
    }
}

export function buildRCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && Rscript "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && Rscript "${path}" 2>&1`;
    }
}

export function buildRubyCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && ruby "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && ruby "${path}" 2>&1`;
    }
}

export function buildCsharpCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && rm -rf Program 2>/dev/null && dotnet new console -n Program --force && cp ${path} Program/Program.cs && cp "${inputPath}" "${tmpInputPath}" && cd Program && dotnet build -c Release --no-restore -nologo -v q && dotnet exec bin/Release/net*/Program.dll < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && rm -rf Program 2>/dev/null && dotnet new console -n Program --force && cp ${path} Program/Program.cs && cd Program && dotnet build -c Release --no-restore -nologo -v q && dotnet exec bin/Release/net*/Program.dll 2>&1`;
    }
}

export function buildGoCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && export GOCACHE=/tmp/.cache/go-build && export HOME=/tmp && cp "${inputPath}" "${tmpInputPath}" && go run "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && export GOCACHE=/tmp/.cache/go-build && export HOME=/tmp && go run "${path}" 2>&1`;
    }
}

export function buildTypescriptCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && export HOME=/tmp && export npm_config_cache=/tmp/.npm && cp "${inputPath}" "${tmpInputPath}" && npx -y tsx "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && export HOME=/tmp && export npm_config_cache=/tmp/.npm && npx -y tsx "${path}" 2>&1`;
    }
}

export function buildSwiftCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && export HOME=/tmp && cp "${inputPath}" "${tmpInputPath}" && swift "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && export HOME=/tmp && swift "${path}" 2>&1`;
    }
}

export function buildPerlCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && perl "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && perl "${path}" 2>&1`;
    }
}

export function buildHaskellCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && ghc -o /tmp/a.out "${path}" 2>&1 && cp "${inputPath}" "${tmpInputPath}" && /tmp/a.out < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && ghc -o /tmp/a.out "${path}" 2>&1 && /tmp/a.out 2>&1`;
    }
}

export function buildBashCommand(path: string, inputPath?: string): string {
    if (inputPath) {
        const tmpInputPath = '/tmp/input.txt';
        return `cd /tmp && cp "${inputPath}" "${tmpInputPath}" && bash "${path}" < "${tmpInputPath}" 2>&1`;
    } else {
        return `cd /tmp && bash "${path}" 2>&1`;
    }
}

