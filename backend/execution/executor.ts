import { Response } from 'express';
import { LanguageConfig } from '../config';
import { BuildOptions } from '../types';
import { DockerProcessRunner } from './processRunner';

export async function executeDockerProcess(
    language: string,
    fullCodePath: string,
    buildOptions: BuildOptions,
    config: LanguageConfig,
    startTime: number,
    res: Response,
    sessionOutputDir: string,
    fullInputPath: string | null,
    kotlinCacheDir?: string,
    cacheKey?: { code: string; language: string; input: string }
): Promise<void> {
    const runner = new DockerProcessRunner(
        language,
        fullCodePath,
        buildOptions,
        config,
        startTime,
        res,
        sessionOutputDir,
        fullInputPath,
        kotlinCacheDir,
        cacheKey
    );

    await runner.execute();
}
