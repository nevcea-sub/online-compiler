import { ALLOWED_LANGUAGES, ALLOWED_IMAGES, DANGEROUS_PATTERNS } from '../config';
import { validatePath } from './pathUtils';

const ALLOWED_LANGUAGES_SET = new Set(ALLOWED_LANGUAGES.map((lang) => lang.toLowerCase()));
const ALLOWED_IMAGES_SET = new Set(ALLOWED_IMAGES);

export function validateLanguage(language: unknown): language is string {
    return typeof language === 'string' && ALLOWED_LANGUAGES_SET.has(language.toLowerCase());
}

export function validateImage(image: unknown): image is string {
    return typeof image === 'string' && ALLOWED_IMAGES_SET.has(image);
}

export function sanitizeCode(code: unknown): void {
    if (typeof code !== 'string') {
        throw new Error('코드는 문자열이어야 합니다.');
    }
    if (code.length > 100000) {
        throw new Error('코드가 너무 깁니다.');
    }
    if (code.trim().length === 0) {
        throw new Error('코드는 비어있을 수 없습니다.');
    }
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            throw new Error('코드에 위험한 패턴이 포함되어 있습니다.');
        }
    }
}

export function validateJavaClass(code: string): void {
    if (typeof code !== 'string') {
        throw new Error('잘못된 코드 형식입니다.');
    }
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    if (!classMatch) {
        throw new Error('Java 코드는 public class를 포함해야 합니다.');
    }
    const className = classMatch[1];
    const fileNameMatch = code.match(/\/\/\s*File:\s*(\w+\.java)/);
    if (fileNameMatch && fileNameMatch[1] !== `${className}.java`) {
        throw new Error('클래스 이름은 파일 이름과 일치해야 합니다.');
    }
}

export { validatePath };

