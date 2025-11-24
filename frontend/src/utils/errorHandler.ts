import type { TranslationKey } from '../i18n/translations';

export interface ErrorMapping {
    pattern: string | RegExp;
    messageKey: TranslationKey;
}

const NETWORK_ERROR_PATTERNS: ErrorMapping[] = [
    { pattern: /failed to fetch|network/i, messageKey: 'cannot-connect-server' },
    { pattern: /timeout/i, messageKey: 'request-timeout' },
    { pattern: /400/i, messageKey: 'bad-request' },
    { pattern: /500/i, messageKey: 'server-error' }
];

export function extractErrorMessage(error: unknown, t: (key: TranslationKey) => string): string {
    if (!(error instanceof Error) || !error.message) {
        return t('connection-error');
    }

    const translationKeyMatch = error.message.match(/^TRANSLATION_KEY:([^:]+)(?::(.+))?$/);
    if (translationKeyMatch) {
        const translationKey = translationKeyMatch[1] as TranslationKey;
        const additionalMessage = translationKeyMatch[2];
        if (additionalMessage) {
            return `${t(translationKey)}: ${additionalMessage}`;
        }
        return t(translationKey);
    }

    const httpMatch = error.message.match(/HTTP (\d+): (.+)/);
    if (httpMatch) {
        const status = parseInt(httpMatch[1], 10);
        const errorDetail = httpMatch[2];
        
        let statusKey: TranslationKey;
        if (status === 400) {
            statusKey = 'bad-request';
        } else if (status === 500 || status === 502 || status === 503 || status === 504) {
            statusKey = 'server-error';
        } else {
            statusKey = 'request-error';
        }
        
        if (errorDetail && errorDetail !== `HTTP ${status} error`) {
            return `${t(statusKey)}: ${errorDetail}`;
        }
        return t(statusKey);
    }

    const errorMessage = error.message.toLowerCase();
    for (const mapping of NETWORK_ERROR_PATTERNS) {
        const pattern = typeof mapping.pattern === 'string'
            ? new RegExp(mapping.pattern, 'i')
            : mapping.pattern;

        if (pattern.test(errorMessage)) {
            return t(mapping.messageKey);
        }
    }

    return t('connection-error');
}

