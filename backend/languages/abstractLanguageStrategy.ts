import { LanguageStrategy } from './languageStrategy';
import { PreparedCode } from '../utils/codePreparer';
import { BuildOptions } from '../types';
import { LANGUAGE_EXTENSIONS } from '../config';
import { buildVolumeMounts } from '../docker/volumeMounts';

export abstract class AbstractLanguageStrategy implements LanguageStrategy {
    constructor(protected language: string) {}

    prepareCode(code: string): PreparedCode {
        return {
            finalCode: code,
            fileExtension: LANGUAGE_EXTENSIONS[this.language] || ''
        };
    }

    abstract getExecutionCommand(
        containerPath: string,
        containerInputPath?: string,
        containerBuildDir?: string
    ): string;

    getDockerArgs(baseArgs: string[], hostCodePath: string, opts: BuildOptions, kotlinCacheDir?: string): string[] {
        const args = [...baseArgs];
        const volumeMounts = buildVolumeMounts(hostCodePath, opts, this.language, kotlinCacheDir);
        args.push(...volumeMounts);
        return args;
    }

    getPoolStartupArgs(baseArgs: string[], _kotlinCacheDir?: string): string[] {
        // Default implementation just returns base args
        return [...baseArgs];
    }
}
