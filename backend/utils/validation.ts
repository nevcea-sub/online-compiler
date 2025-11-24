import { ALLOWED_LANGUAGES, ALLOWED_IMAGES, DANGEROUS_PATTERNS, CONFIG } from '../config';
import { validatePath } from './pathUtils';

const ALLOWED_LANGUAGES_SET = new Set(ALLOWED_LANGUAGES.map((lang) => lang.toLowerCase()));
const ALLOWED_IMAGES_SET = new Set(ALLOWED_IMAGES);

export function validateLanguage(language: unknown): language is string {
    return typeof language === 'string' && ALLOWED_LANGUAGES_SET.has(language.toLowerCase());
}

export function validateImage(image: unknown): image is string {
    return typeof image === 'string' && ALLOWED_IMAGES_SET.has(image);
}

const DANGEROUS_PATTERNS_LENGTH = DANGEROUS_PATTERNS.length;

export function sanitizeCode(code: unknown): void {
    if (typeof code !== 'string') {
        throw new Error('코드는 문자열이어야 합니다.');
    }
    const codeLen = code.length;
    if (codeLen > CONFIG.MAX_CODE_LENGTH) {
        throw new Error(`코드가 너무 깁니다. 최대 ${CONFIG.MAX_CODE_LENGTH}자까지 허용됩니다.`);
    }
    if (codeLen === 0) {
        throw new Error('코드는 비어있을 수 없습니다.');
    }

    let trimmedStart = codeLen;
    let trimmedEnd = 0;
    for (let i = 0; i < codeLen; i++) {
        const char = code[i];
        if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
            trimmedStart = i;
            break;
        }
    }
    for (let i = codeLen - 1; i >= 0; i--) {
        const char = code[i];
        if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
            trimmedEnd = i + 1;
            break;
        }
    }
    if (trimmedStart >= trimmedEnd) {
        throw new Error('코드는 비어있을 수 없습니다.');
    }

    for (let i = 0; i < DANGEROUS_PATTERNS_LENGTH; i++) {
        if (DANGEROUS_PATTERNS[i].test(code)) {
            throw new Error('코드에 위험한 패턴이 포함되어 있습니다.');
        }
    }
}

const JAVA_CLASS_REGEX = /public\s+class\s+(\w+)/;
const JAVA_FILE_REGEX = /\/\/\s*File:\s*(\w+\.java)/;

export function validateJavaClass(code: string): void {
    if (typeof code !== 'string') {
        throw new Error('잘못된 코드 형식입니다.');
    }
    const classMatch = JAVA_CLASS_REGEX.exec(code);
    if (!classMatch) {
        throw new Error('Java 코드는 public class를 포함해야 합니다.');
    }
    const className = classMatch[1];
    const fileNameMatch = JAVA_FILE_REGEX.exec(code);
    if (fileNameMatch && fileNameMatch[1] !== `${className}.java`) {
        throw new Error('클래스 이름은 파일 이름과 일치해야 합니다.');
    }
}

export { validatePath };

