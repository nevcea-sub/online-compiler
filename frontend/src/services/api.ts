import { CONFIG } from '../config/constants';
import type { ProgrammingLanguage, ExecuteResponse } from '../types';

const REQUEST_TIMEOUT_MS = 300000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];

const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const makeRequest = async (
    code: string,
    language: ProgrammingLanguage,
    input: string,
    attempt: number = 0
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
            const status = response.status;
            let errorMessage = '';
            
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                console.debug('Failed to parse error response:', e);
            }
            
            const shouldRetry = RETRYABLE_STATUS_CODES.includes(status) && attempt < MAX_RETRIES;
            
            if (shouldRetry) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
                await sleep(delay);
                return makeRequest(code, language, input, attempt + 1);
            }

            let translationKey: string;
            if (status === 400) {
                translationKey = 'bad-request';
            } else if (status === 500) {
                translationKey = 'server-error';
            } else if (status === 502 || status === 503 || status === 504) {
                translationKey = 'server-error';
            } else {
                translationKey = 'request-error';
            }

            if (errorMessage) {
                throw new Error(`TRANSLATION_KEY:${translationKey}:${errorMessage}`);
            } else {
                throw new Error(`TRANSLATION_KEY:${translationKey}`);
            }
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('TRANSLATION_KEY:request-timeout-retry');
            }
            
            const isNetworkError = error.message.includes('Failed to fetch') || 
                                 error.message.includes('NetworkError') ||
                                 error.message.includes('Network request failed');
            
            if (isNetworkError && attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
                await sleep(delay);
                return makeRequest(code, language, input, attempt + 1);
            }
            
            if (isNetworkError) {
                throw new Error('TRANSLATION_KEY:network-error-detail');
            }
            
            if (error.message.includes('HTTP')) {
                throw error;
            }
            
            if (error.message.includes('TRANSLATION_KEY:')) {
                throw error;
            }
            
            throw new Error(`TRANSLATION_KEY:request-error:${error.message}`);
        }
        
        throw new Error('TRANSLATION_KEY:unexpected-error');
    }
};

export const executeCode = async (
    code: string,
    language: ProgrammingLanguage,
    input: string
): Promise<ExecuteResponse> => {
    return makeRequest(code, language, input, 0);
};

