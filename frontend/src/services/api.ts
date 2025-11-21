import { CONFIG } from '../config/constants';
import type { ProgrammingLanguage, ExecuteResponse } from '../types';

const REQUEST_TIMEOUT_MS = 300000;

export const executeCode = async (
    code: string,
    language: ProgrammingLanguage,
    input: string
): Promise<ExecuteResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language, input }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

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
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout: The request took too long to complete.');
            }
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Network error: Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
        throw new Error('An unexpected error occurred.');
    }
};

