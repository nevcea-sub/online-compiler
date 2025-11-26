import { LANGUAGE_EXTENSIONS } from '../config';
import { languageStrategyFactory } from '../languages/factory';

export interface PreparedCode {
    finalCode: string;
    fileExtension: string;
}

export function prepareCode(code: string, language: string): PreparedCode {
    try {
        const strategy = languageStrategyFactory.getStrategy(language);
        return strategy.prepareCode(code);
    } catch {
        // Fallback for unknown languages (though they should be caught by validation)
        return {
            finalCode: code,
            fileExtension: LANGUAGE_EXTENSIONS[language] || ''
        };
    }
}
