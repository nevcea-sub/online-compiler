import { BuildOptions } from '../types';
import { PreparedCode } from '../utils/codePreparer';

export interface LanguageStrategy {
    prepareCode(code: string): PreparedCode;
    getExecutionCommand(containerPath: string, containerInputPath?: string, containerBuildDir?: string): string;
    getDockerArgs(baseArgs: string[], hostCodePath: string, opts: BuildOptions, kotlinCacheDir?: string): string[];
    getPoolStartupArgs(baseArgs: string[], kotlinCacheDir?: string): string[];
}
