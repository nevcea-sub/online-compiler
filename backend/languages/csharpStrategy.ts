import { AbstractLanguageStrategy } from './abstractLanguageStrategy';
import { BuildOptions } from '../types';
import { buildCsharpCommand } from '../config/languageCommands';

export class CSharpStrategy extends AbstractLanguageStrategy {
    constructor() {
        super('csharp');
    }

    getExecutionCommand(containerPath: string, containerInputPath?: string): string {
        return buildCsharpCommand(containerPath, containerInputPath);
    }

    getDockerArgs(baseArgs: string[], hostCodePath: string, opts: BuildOptions, kotlinCacheDir?: string): string[] {
        const args = super.getDockerArgs(baseArgs, hostCodePath, opts, kotlinCacheDir);
        // C# specific env vars
        args.push('-e', 'DOTNET_CLI_HOME=/tmp', '-e', 'NUGET_PACKAGES=/tmp/.nuget', '-w', '/tmp');
        return args;
    }

    getPoolStartupArgs(baseArgs: string[], _kotlinCacheDir?: string): string[] {
        const args = [...baseArgs];
        args.push('-e', 'DOTNET_CLI_HOME=/tmp', '-e', 'NUGET_PACKAGES=/tmp/.nuget', '-w', '/tmp');
        return args;
    }
}
