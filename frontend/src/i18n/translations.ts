import type { Language } from '../types';

export const translations: Record<Language, Record<string, string>> = {
    ko: {
        title: '온라인 컴파일러',
        'programming-language': '프로그래밍 언어:',
        'code-editor': '코드 에디터',
        'execution-result': '실행 결과',
        'output-placeholder': '실행 결과가 여기에 표시됩니다.',
        run: '실행',
        clear: '초기화',
        'language-change-title': '언어 변경 확인',
        'language-change-message': '언어를 변경하면 현재 코드가 기본 템플릿으로 교체됩니다.',
        'clear-confirm-title': '코드 초기화 확인',
        'clear-confirm-message': '코드를 초기화합니다.',
        'continue-question': '계속하시겠습니까?',
        cancel: '취소',
        confirm: '확인',
        'no-code-error': '실행할 코드가 없습니다.',
        'language-label': '언어:',
        running: '실행 중...',
        executing: '코드를 실행하고 있습니다...',
        output: '출력',
        error: '오류',
        'execution-time': '실행 시간',
        'no-output': '출력이 없습니다.',
        'connection-error': '연결 오류',
        'check-backend': '백엔드 서버가 실행 중인지 확인해주세요.',
        'code-saved': '코드가 자동 저장되었습니다.',
        'clear-output': '지우기',
        'input-label': '입력:',
        'input-placeholder': '프로그램에 전달할 입력을 입력하세요...',
        'console-input-placeholder': '프로그램 입력',
        shortcuts: '단축키',
        'run-code': '코드 실행',
        'clear-code': '코드 초기화',
        'toggle-comment': '주석 토글',
        'settings-title': '설정',
        back: '뒤로',
        'language-settings': '언어 설정',
        'interface-language': '인터페이스 언어:',
        korean: '한국어',
        english: 'English',
        'editor-settings': '에디터 설정',
        'font-family': '폰트:',
        'font-size': '폰트 크기:',
        'theme-settings': '테마 설정',
        theme: '테마:',
        'system-theme': '시스템 기본값',
        'dark-theme': '다크 모드',
        'light-theme': '라이트 모드',
        'request-error': '요청 처리 중 오류가 발생했습니다.',
        'cannot-connect-server': '서버에 연결할 수 없습니다.',
        'request-timeout': '요청 시간이 초과되었습니다.',
        'bad-request': '잘못된 요청입니다.',
        'server-error': '서버 오류가 발생했습니다.',
        'cannot-process-response': '응답을 처리할 수 없습니다.',
        'more-error-messages': '... (더 많은 오류 메시지가 있습니다)',
        settings: '설정',
        'execution-completed': '실행 완료',
        'execution-completed-with-errors': '실행 완료 (오류 포함)',
        'code-cleared': '코드가 초기화되었습니다.',
        'clear-output-confirm-title': '출력 지우기 확인',
        'clear-output-confirm-message': '실행 결과를 지웁니다.',
        'keyboard-shortcuts': '키보드 단축키',
        'shortcut-run-code': '코드 실행',
        'shortcut-show-help': '도움말 표시',
        'shortcut-clear': '에디터 초기화',
        'shortcut-close-modal': '모달 닫기',
        close: '닫기',
        'to-run': '실행',
        'search-language': '언어 검색...',
        'search-font': '폰트 검색...',
        seconds: '초',
        'docker-not-running': 'Docker가 실행되지 않았습니다. Docker Desktop을 시작한 후 다시 시도해주세요.',
        'docker-not-installed': 'Docker가 설치되지 않았습니다. Docker를 설치한 후 다시 시도해주세요.',
        'docker-image-not-found': 'Docker 이미지를 찾을 수 없습니다. 필요한 이미지를 다운로드 중입니다. 잠시 후 다시 시도해주세요.',
        'docker-permission-error': 'Docker 권한 오류가 발생했습니다. Docker 권한을 확인해주세요.',
        'docker-invalid-format': 'Docker 명령어 형식 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        'execution-timeout': '실행 시간이 초과되었습니다.',
        'execution-error': '실행 중 오류가 발생했습니다.'
    },
    en: {
        title: 'Online Compiler',
        'programming-language': 'Programming Language:',
        'code-editor': 'Code Editor',
        'execution-result': 'Execution Result',
        'output-placeholder': 'Execution results will be displayed here.',
        run: 'Run',
        clear: 'Clear',
        'language-change-title': 'Language Change Confirmation',
        'language-change-message':
            'Changing the language will replace the current code with the default template.',
        'clear-confirm-title': 'Clear Code Confirmation',
        'clear-confirm-message': 'This will clear the code.',
        'continue-question': 'Do you want to continue?',
        cancel: 'Cancel',
        confirm: 'Confirm',
        'no-code-error': 'No code to execute.',
        'language-label': 'Language:',
        running: 'Running...',
        executing: 'Executing code...',
        output: 'Output',
        error: 'Error',
        'execution-time': 'Execution time',
        'no-output': 'No output.',
        'connection-error': 'Connection error',
        'check-backend': 'Please check if the backend server is running.',
        'code-saved': 'Code auto-saved.',
        'clear-output': 'Clear',
        'input-label': 'Input:',
        'input-placeholder': 'Enter input to pass to the program...',
        'console-input-placeholder': 'Program input',
        shortcuts: 'Shortcuts',
        'run-code': 'Run Code',
        'clear-code': 'Clear Code',
        'toggle-comment': 'Toggle Comment',
        'settings-title': 'Settings',
        back: 'Back',
        'language-settings': 'Language Settings',
        'interface-language': 'Interface Language:',
        korean: 'Korean',
        english: 'English',
        'editor-settings': 'Editor Settings',
        'font-family': 'Font:',
        'font-size': 'Font Size:',
        'theme-settings': 'Theme Settings',
        theme: 'Theme:',
        'system-theme': 'System Default',
        'dark-theme': 'Dark Mode',
        'light-theme': 'Light Mode',
        'request-error': 'An error occurred while processing the request.',
        'cannot-connect-server': 'Cannot connect to server.',
        'request-timeout': 'Request timeout exceeded.',
        'bad-request': 'Bad request.',
        'server-error': 'Server error occurred.',
        'cannot-process-response': 'Cannot process response.',
        'more-error-messages': '... (more error messages)',
        settings: 'Settings',
        'execution-completed': 'Execution completed',
        'execution-completed-with-errors': 'Execution completed with errors',
        'code-cleared': 'Code cleared',
        'clear-output-confirm-title': 'Clear Output Confirmation',
        'clear-output-confirm-message': 'This will clear the execution result.',
        'keyboard-shortcuts': 'Keyboard Shortcuts',
        'shortcut-run-code': 'Run code',
        'shortcut-show-help': 'Show keyboard shortcuts',
        'shortcut-clear': 'Clear editor',
        'shortcut-close-modal': 'Close modal/dropdown',
        close: 'Close',
        'to-run': 'to run',
        'search-language': 'Search language...',
        'search-font': 'Search font...',
        seconds: 's',
        'docker-not-running': 'Docker is not running. Please start Docker Desktop and try again.',
        'docker-not-installed': 'Docker is not installed. Please install Docker and try again.',
        'docker-image-not-found': 'Docker image not found. Downloading required image. Please try again in a moment.',
        'docker-permission-error': 'Docker permission error occurred. Please check Docker permissions.',
        'docker-invalid-format': 'Docker command format error occurred. Please try again in a moment.',
        'execution-timeout': 'Execution timeout exceeded.',
        'execution-error': 'An error occurred during execution.'
    }
};

export const getTranslation = (key: string, lang: Language = 'ko'): string => {
    return translations[lang]?.[key] || translations.en[key] || '';
};

export const mapServerErrorMessage = (errorMessage: string): string | null => {
    const errorLower = errorMessage.toLowerCase();
    
    if (errorMessage.includes('Docker가 실행되지 않았습니다') || 
        errorMessage.includes('Docker Desktop을 시작한 후')) {
        return 'docker-not-running';
    }
    if (errorMessage.includes('Docker가 설치되지 않았습니다') || 
        errorMessage.includes('Docker를 설치한 후')) {
        return 'docker-not-installed';
    }
    if (errorMessage.includes('Docker 이미지를 찾을 수 없습니다') || 
        errorMessage.includes('이미지를 다운로드 중입니다')) {
        return 'docker-image-not-found';
    }
    if (errorMessage.includes('Docker 권한 오류가 발생했습니다')) {
        return 'docker-permission-error';
    }
    if (errorMessage.includes('Docker 명령어 형식 오류가 발생했습니다')) {
        return 'docker-invalid-format';
    }
    if (errorMessage.includes('실행 시간이 초과되었습니다')) {
        return 'execution-timeout';
    }
    if (errorMessage.includes('실행 중 오류가 발생했습니다')) {
        return 'execution-error';
    }
    
    if (errorLower.includes('docker is not running') || 
        errorLower.includes('docker daemon') && errorLower.includes('not running')) {
        return 'docker-not-running';
    }
    if (errorLower.includes('docker is not installed') || 
        errorLower.includes('docker: command not found')) {
        return 'docker-not-installed';
    }
    if (errorLower.includes('docker image not found') || 
        errorLower.includes('no such image')) {
        return 'docker-image-not-found';
    }
    if (errorLower.includes('docker permission') || 
        errorLower.includes('permission denied') && errorLower.includes('docker')) {
        return 'docker-permission-error';
    }
    if (errorLower.includes('execution timeout') || 
        errorLower.includes('timeout exceeded')) {
        return 'execution-timeout';
    }
    if (errorLower.includes('error occurred during execution')) {
        return 'execution-error';
    }
    
    return null;
};

