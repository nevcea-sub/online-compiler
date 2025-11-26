import { AbstractLanguageStrategy } from './abstractLanguageStrategy';
import { convertToDockerPath } from '../utils/pathUtils';
import { createLogger } from '../utils/logger';
import { KOTLIN_COMPILER_CHECK, KOTLIN_DOWNLOAD_CMD } from '../config';

const logger = createLogger('KotlinStrategy');

export class KotlinStrategy extends AbstractLanguageStrategy {
    constructor() {
        super('kotlin');
    }

    getExecutionCommand(containerPath: string, containerInputPath?: string, buildDir?: string): string {
        const jvmOpts =
            '-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xms32m -Xmx128m -XX:ReservedCodeCacheSize=16m -XX:InitialCodeCacheSize=8m -XX:+OptimizeStringConcat -XX:+UseCompressedOops -XX:+UseCompressedClassPointers';
        const kotlinOpts =
            '-Xjvm-default=all -Xno-param-assertions -Xno-call-assertions -Xno-receiver-assertions -Xskip-prerelease-check';
        const kotlinSetup = `if ${KOTLIN_COMPILER_CHECK}; then ${KOTLIN_DOWNLOAD_CMD}; fi`;
        const outDir = buildDir || '/tmp/kbuild';
        const compileCmd = `mkdir -p ${outDir}/out && java ${jvmOpts} -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar ${kotlinOpts} -d ${outDir}/out "${containerPath}" 2>&1`;

        if (containerInputPath) {
            const tmpInputPath = '/tmp/input.txt';
            return `cd /tmp && ${kotlinSetup} && ${compileCmd} && cp "${containerInputPath}" "${tmpInputPath}" && java ${jvmOpts} -cp "${outDir}/out:/opt/kotlin/kotlinc/lib/*" CodeKt < "${tmpInputPath}" 2>&1`;
        } else {
            return `cd /tmp && ${kotlinSetup} && ${compileCmd} && java ${jvmOpts} -cp "${outDir}/out:/opt/kotlin/kotlinc/lib/*" CodeKt 2>&1`;
        }
    }

    getPoolStartupArgs(baseArgs: string[], kotlinCacheDir?: string): string[] {
        const args = [...baseArgs];
        if (kotlinCacheDir) {
            try {
                const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
                args.push('-v', `${hostKotlinCache}:/opt/kotlin`);
            } catch (e) {
                logger.warn('Failed to mount Kotlin cache for pool', { error: e });
            }
        }
        return args;
    }
}
