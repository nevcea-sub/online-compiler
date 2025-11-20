import { CONFIG } from '../config/constants';
import type { ProgrammingLanguage, ExecuteResponse } from '../types';

export const executeCode = async (
    code: string,
    language: ProgrammingLanguage,
    input: string
): Promise<ExecuteResponse> => {
    const response = await fetch(`${CONFIG.API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
    });

    if (!response.ok) {
        let errorMessage = '';
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            console.debug('Failed to parse error response:', e);
        }
        if (!errorMessage) {
            errorMessage = `HTTP ${response.status} error`;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    return await response.json();
};

