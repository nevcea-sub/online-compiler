import { LanguageStrategy } from './languageStrategy';
import { JavaStrategy } from './javaStrategy';
import { KotlinStrategy } from './kotlinStrategy';
import { CSharpStrategy } from './csharpStrategy';
import { RStrategy } from './rStrategy';
import { DefaultLanguageStrategy } from './defaultStrategy';
import * as Commands from '../config/languageCommands';

class LanguageStrategyFactory {
    private strategies: Map<string, LanguageStrategy> = new Map();

    constructor() {
        this.registerStrategy('java', new JavaStrategy());
        this.registerStrategy('kotlin', new KotlinStrategy());
        this.registerStrategy('csharp', new CSharpStrategy());
        this.registerStrategy('r', new RStrategy());

        this.registerSimple('python', Commands.buildPythonCommand);
        this.registerSimple('javascript', Commands.buildJavascriptCommand);
        this.registerSimple('cpp', Commands.buildCppCommand);
        this.registerSimple('c', Commands.buildCCommand);
        this.registerSimple('rust', Commands.buildRustCommand);
        this.registerSimple('php', Commands.buildPhpCommand);
        this.registerSimple('ruby', Commands.buildRubyCommand);
        this.registerSimple('go', Commands.buildGoCommand);
        this.registerSimple('typescript', Commands.buildTypescriptCommand);
        this.registerSimple('swift', Commands.buildSwiftCommand);
        this.registerSimple('perl', Commands.buildPerlCommand);
        this.registerSimple('haskell', Commands.buildHaskellCommand);
        this.registerSimple('bash', Commands.buildBashCommand);
    }

    private registerStrategy(language: string, strategy: LanguageStrategy) {
        this.strategies.set(language, strategy);
    }

    private registerSimple(language: string, commandBuilder: (path: string, inputPath?: string) => string) {
        this.strategies.set(language, new DefaultLanguageStrategy(language, commandBuilder));
    }

    getStrategy(language: string): LanguageStrategy {
        const strategy = this.strategies.get(language);
        if (!strategy) {
            throw new Error(`No strategy found for language: ${language}`);
        }
        return strategy;
    }
}

export const languageStrategyFactory = new LanguageStrategyFactory();
