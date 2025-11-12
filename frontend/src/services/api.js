import { CONFIG } from '../config/constants';

export const executeCode = async (code, language, input) => {
    const response = await fetch(`${CONFIG.API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
    });

    if (!response.ok) {
        let errorMessage = 'Request error';
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            console.debug('Failed to parse error response:', e);
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    return await response.json();
};

