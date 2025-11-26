import { LANGUAGE_EXTENSIONS } from '../config';
import { validateJavaClass } from './validation';

export interface PreparedCode {
    finalCode: string;
    fileExtension: string;
}

export function prepareCode(code: string, language: string): PreparedCode {
    let finalCode = code;
    let fileExtension = LANGUAGE_EXTENSIONS[language] || '';

    switch (language) {
        case 'java':
            validateJavaClass(code);
            finalCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
            break;

        case 'r': {
            const plotPattern = /plot\s*\(|ggplot\s*\(|barplot\s*\(|hist\s*\(|boxplot\s*\(|pie\s*\(/i;
            if (plotPattern.test(code)) {
                finalCode = `png('/output/plot.png', width=800, height=600, res=100)\n${code}\ndev.off()\n`;
            }
            break;
        }
    }

    return { finalCode, fileExtension };
}
