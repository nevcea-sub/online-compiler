import { AbstractLanguageStrategy } from './abstractLanguageStrategy';
import { PreparedCode } from '../utils/codePreparer';
import { buildRCommand } from '../config/languageCommands';

export class RStrategy extends AbstractLanguageStrategy {
    constructor() {
        super('r');
    }

    prepareCode(code: string): PreparedCode {
        let finalCode = code;
        const plotPattern = /plot\s*\(|ggplot\s*\(|barplot\s*\(|hist\s*\(|boxplot\s*\(|pie\s*\(/i;
        if (plotPattern.test(code)) {
            finalCode = `png('/output/plot.png', width=800, height=600, res=100)\n${code}\ndev.off()\n`;
        }
        return {
            finalCode,
            fileExtension: '.r'
        };
    }

    getExecutionCommand(containerPath: string, containerInputPath?: string): string {
        return buildRCommand(containerPath, containerInputPath);
    }
}
