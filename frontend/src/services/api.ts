import { CONFIG } from '../config/constants';
import type { ProgrammingLanguage, ExecuteResponse } from '../types';

export const executeCode = async (
    code: string,
    language: ProgrammingLanguage,
    input: string
): Promise<ExecuteResponse> => {
    // Vite dev 서버의 프록시 설정(vite.config.ts의 server.proxy)을 사용해
    // 항상 같은 오리진(5173)으로만 요청을 보내도록 상대 경로를 사용합니다.
    const response = await fetch(`${CONFIG.API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
    });

    if (!response.ok) {
        let errorMessage = '요청 오류가 발생했습니다.';
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

