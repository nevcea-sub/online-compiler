import { AbstractLanguageStrategy } from './abstractLanguageStrategy';

export class DefaultLanguageStrategy extends AbstractLanguageStrategy {
    constructor(
        language: string,
        private commandBuilder: (path: string, inputPath?: string) => string
    ) {
        super(language);
    }

    getExecutionCommand(containerPath: string, containerInputPath?: string): string {
        return this.commandBuilder(containerPath, containerInputPath);
    }
}

// Factory for simple languages
export const createDefaultStrategy = (language: string, builder: any) => new DefaultLanguageStrategy(language, builder);
