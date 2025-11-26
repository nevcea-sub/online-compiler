export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'] as const;

export const MIME_TYPE_MAP: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp'
} as const;

export const ERROR_MESSAGES = {
    CODE_AND_LANGUAGE_REQUIRED: '코드와 언어는 필수입니다.',
    INVALID_INPUT_FORMAT: '잘못된 입력 형식입니다.',
    CODE_TOO_LONG: (maxLength: number) => `코드 길이가 최대 ${maxLength}자를 초과했습니다.`,
    UNSUPPORTED_LANGUAGE: '지원하지 않는 언어입니다.',
    INPUT_TOO_LONG: (maxLength: number) => `입력 길이가 최대 ${maxLength}자를 초과했습니다.`,
    INVALID_CODE_PATH: '코드 경로가 올바르지 않습니다.',
    INVALID_INPUT_PATH: '입력 파일 경로가 올바르지 않습니다.',
    FILE_PATH_CREATION_FAILED: '파일 경로 생성에 실패했습니다.',
    CLASS_NAME_MISMATCH: (className: string, fileName: string) =>
        `클래스 이름 ${className}은 파일 이름 ${fileName}과 일치해야 합니다.`,
    INVALID_CODE_FORMAT: '잘못된 코드 형식입니다.',
    JAVA_PUBLIC_CLASS_REQUIRED: 'Java 코드는 public class를 포함해야 합니다.',
    JAVA_CLASS_FILE_NAME_MISMATCH: '클래스 이름은 파일 이름과 일치해야 합니다.',
    EXECUTION_TIMEOUT: '실행 시간이 초과되었습니다.',
    EXECUTION_ERROR_OCCURRED: '실행 중 오류가 발생했습니다.',
    REQUEST_ERROR_OCCURRED: '요청 처리 중 오류가 발생했습니다.',
    RESULT_PROCESSING_ERROR: '실행 결과 처리 중 오류가 발생했습니다.',
    EXECUTION_ERROR_HANDLING_ERROR: '실행 에러 처리 중 오류가 발생했습니다.',
    EXECUTION_TIMEOUT_HANDLING_ERROR: '실행 시간 초과 처리 중 오류가 발생했습니다.',
    KOTLIN_COMPILER_NOT_READY: 'Kotlin 컴파일러가 아직 준비되지 않았습니다. 준비 중입니다. 잠시 후 다시 시도해주세요.',
    CODE_MUST_BE_STRING: '코드는 문자열이어야 합니다.',
    CODE_CANNOT_BE_EMPTY: '코드는 비어있을 수 없습니다.',
    CODE_CONTAINS_DANGEROUS_PATTERN: '코드에 위험한 패턴이 포함되어 있습니다.'
} as const;

export const JAVA_CLASS_REGEX = /public\s+class\s+(\w+)/;
export const JAVA_FILE_REGEX = /\/\/\s*File:\s*(\w+\.java)/;

export const WARMUP_TIMEOUT_DEFAULTS = {
    DEFAULT: 10000,
    PHP: 8000,
    RUBY: 8000,
    CSHARP: 8000,
    KOTLIN: 20000,
    TYPESCRIPT: 8000,
    SWIFT: 12000,
    PERL: 8000,
    HASKELL: 12000,
    BASH: 8000
} as const;

export const TIME_CONSTANTS = {
    ONE_SECOND: 1000,
    ONE_MINUTE: 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000
} as const;
