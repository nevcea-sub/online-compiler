import { AbstractLanguageStrategy } from './abstractLanguageStrategy';
import { validateJavaClass } from '../utils/validation';
import { PreparedCode } from '../utils/codePreparer';
import { buildJavaCommand } from '../config/languageCommands';

export class JavaStrategy extends AbstractLanguageStrategy {
    constructor() {
        super('java');
    }

    prepareCode(code: string): PreparedCode {
        validateJavaClass(code);
        const finalCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
        return {
            finalCode,
            fileExtension: '.java'
        };
    }

    getExecutionCommand(containerPath: string, containerInputPath?: string): string {
        return buildJavaCommand(containerPath, containerInputPath);
    }
}
