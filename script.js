const CONFIG = {
    API_URL: 'http://localhost:3000',
    DEFAULT_LANGUAGE: 'python',
    DEFAULT_THEME: 'system',
    DEFAULT_FONT_FAMILY: "'Consolas', 'Monaco', 'Courier New', monospace",
    DEFAULT_FONT_SIZE: 14,
    WARMUP_INTERVAL: 30000,
    MAX_ERROR_LINES: 20,
    MAX_ERROR_LENGTH: 500,
    MAX_AUTOCOMPLETE_SUGGESTIONS: 20,
    MAX_AUTOCOMPLETE_SUGGESTIONS_WITH_SNIPPETS: 50,
    IMAGE_STYLES: {
        maxWidth: '100%',
        height: 'auto',
        marginTop: '0.5rem',
        borderRadius: '4px'
    },
    DEFAULT_ERROR_COLOR: '#f44336',
    DEBUG_PATTERNS: [
        /^\[DEBUG\].*/i,
        /^DEBUG:.*/i,
        /^Checking source file:.*/i,
        /^Copying file to.*/i,
        /^Verifying copied file.*/i,
        /^File copy successful.*/i,
        /^Checking input file:.*/i
    ]
};

const translations = {
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
        'clear-confirm-message':
            '코드를 초기화하면 현재 작성한 코드가 모두 삭제되고 기본 템플릿으로 교체됩니다.',
        'continue-question': '계속하시겠습니까?',
        cancel: '취소',
        confirm: '확인',
        'no-code-error': '실행할 코드가 없습니다.',
        'execution-not-implemented': '코드 실행 기능은 아직 구현되지 않았습니다.',
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
        back: '← 뒤로',
        'language-settings': '언어 설정',
        'interface-language': '인터페이스 언어:',
        'korean': '한국어',
        'english': 'English',
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
        'settings': '설정'
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
        'clear-confirm-message':
            'Clearing the code will delete all currently written code and replace it with the default template.',
        'continue-question': 'Do you want to continue?',
        cancel: 'Cancel',
        confirm: 'Confirm',
        'no-code-error': 'No code to execute.',
        'execution-not-implemented': 'Code execution feature is not yet implemented.',
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
        back: '← Back',
        'language-settings': 'Language Settings',
        'interface-language': 'Interface Language:',
        'korean': 'Korean',
        'english': 'English',
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
        'settings': 'Settings'
    }
};

const LANGUAGE_CONFIG = {
    modes: {
        python: 'python',
        javascript: 'javascript',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        rust: 'rust',
        php: 'php',
        r: 'r',
        ruby: 'ruby',
        csharp: 'csharp',
        kotlin: 'kotlin'
    },
    templates: {
        python: 'print("Hello, World!")',
        javascript: 'console.log("Hello, World!");',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
        c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
        rust: 'fn main() {\n    println!("Hello, World!");\n}',
        php: '<?php\n\necho "Hello, World!\\n";\n?>',
        r: 'cat("Hello, World!\\n")',
        ruby: 'puts "Hello, World!"',
        csharp: 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello, World!");\n    }\n}',
        kotlin: 'fun main() {\n    println("Hello, World!")\n}'
    },
    icons: {
        python: 'https://img.icons8.com/color/48/python.png',
        javascript: 'https://img.icons8.com/color/48/javascript.png',
        java: 'https://img.icons8.com/color/48/java-coffee-cup-logo.png',
        cpp: 'https://img.icons8.com/color/48/c-plus-plus-logo.png',
        c: 'https://img.icons8.com/color/48/c-programming.png',
        rust: 'https://img.icons8.com/color/48/rust.png',
        php: 'https://img.icons8.com/color/48/php.png',
        r: 'https://www.r-project.org/logo/Rlogo.png',
        ruby: 'https://img.icons8.com/color/48/ruby-programming-language.png',
        csharp: 'https://img.icons8.com/color/48/c-sharp-logo.png',
        kotlin: 'https://img.icons8.com/color/48/kotlin.png'
    },
    names: {
        python: 'Python',
        javascript: 'JavaScript',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        rust: 'Rust',
        php: 'PHP',
        r: 'R',
        ruby: 'Ruby',
        csharp: 'C#',
        kotlin: 'Kotlin'
    }
};

const FONT_CONFIG = {
    families: {
        "'Consolas', 'Monaco', 'Courier New', monospace": 'Consolas',
        "'Courier New', Courier, monospace": 'Courier New',
        "'Monaco', 'Menlo', monospace": 'Monaco',
        "'Fira Code', 'Consolas', monospace": 'Fira Code',
        "'JetBrains Mono', 'Consolas', monospace": 'JetBrains Mono',
        "'Source Code Pro', 'Consolas', monospace": 'Source Code Pro',
        "'Roboto Mono', 'Consolas', monospace": 'Roboto Mono',
        'D2Coding, "D2Coding ligature", "Consolas", monospace': 'D2Coding',
        "'Inconsolata', 'Consolas', monospace": 'Inconsolata',
        "'Space Mono', 'Consolas', monospace": 'Space Mono',
        "'IBM Plex Mono', 'Consolas', monospace": 'IBM Plex Mono',
        "'Courier Prime', 'Courier New', monospace": 'Courier Prime',
        "'Red Hat Mono', 'Consolas', monospace": 'Red Hat Mono',
        "'PT Mono', 'Consolas', monospace": 'PT Mono',
        "'Cascadia Code', 'Consolas', monospace": 'Cascadia Code',
        "'Hack', 'Consolas', monospace": 'Hack',
        "'Victor Mono', 'Consolas', monospace": 'Victor Mono',
        "'Ubuntu Mono', 'Consolas', monospace": 'Ubuntu Mono',
        "'Anonymous Pro', 'Consolas', monospace": 'Anonymous Pro',
        "'Share Tech Mono', 'Consolas', monospace": 'Share Tech Mono',
        "'Oxygen Mono', 'Consolas', monospace": 'Oxygen Mono',
        "'Overpass Mono', 'Consolas', monospace": 'Overpass Mono',
        "'Nova Mono', 'Consolas', monospace": 'Nova Mono',
        "'Cousine', 'Consolas', monospace": 'Cousine',
        "'SF Mono', 'Monaco', 'Menlo', monospace": 'SF Mono',
        "'Menlo', 'Monaco', 'Consolas', monospace": 'Menlo',
        "'Liberation Mono', 'Courier New', monospace": 'Liberation Mono',
        "'DejaVu Sans Mono', 'Consolas', monospace": 'DejaVu Sans Mono'
    }
};

let currentLang = localStorage.getItem('language') || 'ko';
let codeEditor = null;

const cleanupFunctions = [];
const eventListeners = new Map();

function addEventListenerSafe(element, event, handler, options = false) {
    if (!element) return null;
    element.addEventListener(event, handler, options);
    const key = `${element.constructor.name}_${event}`;
    if (!eventListeners.has(key)) {
        eventListeners.set(key, []);
    }
    eventListeners.get(key).push({ element, event, handler, options });
    return () => {
        element.removeEventListener(event, handler, options);
        const listeners = eventListeners.get(key);
        if (listeners) {
            const index = listeners.findIndex(l => l.handler === handler);
            if (index > -1) listeners.splice(index, 1);
        }
    };
}

function cleanupEventListeners() {
    eventListeners.forEach((listeners) => {
        listeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
    });
    eventListeners.clear();
}

function cleanup() {
    cleanupFunctions.forEach(fn => {
        try {
            fn();
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    });
    cleanupFunctions.length = 0;
    cleanupEventListeners();
    if (codeEditor) {
        try {
            codeEditor.dispose();
            codeEditor = null;
        } catch (error) {
            console.error('Editor dispose error:', error);
        }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', cleanup);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            cleanup();
        }
    });
}


function debounce(fn, delay) {
    let timer = null;
    const debounced = (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
    debounced.cancel = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };
    debounced.flush = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            fn();
        }
    };
    return debounced;
}

const domCache = new Map();

function getCachedElement(selector, useCache = true) {
    if (!useCache) {
        return document.querySelector(selector);
    }
    if (!domCache.has(selector)) {
        const element = document.querySelector(selector);
        if (element) {
            domCache.set(selector, element);
        }
        return element;
    }
    const cached = domCache.get(selector);
    if (cached && document.contains(cached)) {
        return cached;
    }
    domCache.delete(selector);
    return getCachedElement(selector, false);
}

function updateLanguage(lang) {
    if (!lang || !translations[lang]) {
        console.warn(`Invalid language: ${lang}`);
        return;
    }
    
    currentLang = lang;
    try {
        localStorage.setItem('language', lang);
    } catch (error) {
        console.error('Failed to save language to localStorage:', error);
    }
    
    document.documentElement.setAttribute('lang', lang);

    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang]?.[key]) {
            element.textContent = translations[lang][key];
        }
    });

    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach((element) => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang]?.[key]) {
            element.placeholder = translations[lang][key];
        }
    });

    const ariaLabelElements = document.querySelectorAll('[data-i18n-aria-label]');
    ariaLabelElements.forEach((element) => {
        const key = element.getAttribute('data-i18n-aria-label');
        if (translations[lang]?.[key]) {
            element.setAttribute('aria-label', translations[lang][key]);
        }
    });

    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach((element) => {
        const key = element.getAttribute('data-i18n-title');
        if (translations[lang]?.[key]) {
            element.setAttribute('title', translations[lang][key]);
        }
    });

    const titleElement = document.querySelector('title[data-i18n-title]');
    if (titleElement) {
        const titleKey = titleElement.getAttribute('data-i18n-title');
        if (translations[lang]?.[titleKey]) {
            document.title = translations[lang][titleKey];
        }
    } else if (translations[lang]?.['title']) {
        document.title = translations[lang]['title'];
    }

    const langIcon = getCachedElement('#lang-icon');
    if (langIcon) {
        langIcon.className = `fi ${lang === 'ko' ? 'fi-kr' : 'fi-us'}`;
    }

    const langName = getCachedElement('#lang-name');
    if (langName) {
        langName.textContent = lang === 'ko' ? translations.ko['korean'] : translations.en['english'];
    }
}

function getSystemTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(themePreference) {
    const actualTheme = themePreference === 'system' ? getSystemTheme() : themePreference;
    document.documentElement.setAttribute('data-theme', actualTheme);
    if (codeEditor) {
        monaco.editor.setTheme(actualTheme === 'dark' ? 'vs-dark' : 'vs');
    }
}

function createIconElement(iconUrl) {
    const img = document.createElement('img');
    img.src = iconUrl;
    img.alt = '';
    img.className = 'language-icon-img';
    return img;
}

function updateIcon(element, iconUrl) {
    element.innerHTML = '';
    element.appendChild(createIconElement(iconUrl));
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    if (pageId === 'compiler-page' && codeEditor) {
        setTimeout(() => codeEditor.layout(), 100);
    }
}

class ModalManager {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.isVisible = false;
    }

    show() {
        this.modal?.classList.add('show');
        this.isVisible = true;
    }

    hide() {
        this.modal?.classList.remove('show');
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

class DropdownManager {
    constructor(buttonId, dropdownId) {
        this.button = document.getElementById(buttonId);
        this.dropdown = document.getElementById(dropdownId);
        this.isOpen = false;
    }

    open() {
        this.button?.classList.add('active');
        this.dropdown?.classList.add('show');
        this.isOpen = true;
    }

    close() {
        this.button?.classList.remove('active');
        this.dropdown?.classList.remove('show');
        this.isOpen = false;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

function initEditor() {
    if (typeof require === 'undefined') {
        setTimeout(initEditor, 100);
        return;
    }

    require.config({
        paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
        }
    });

    require(['vs/editor/editor.main'], function () {
        const elements = {
            languageSelect: document.getElementById('language-select'),
            languageSelectButton: document.getElementById('language-select-button'),
            languageDropdown: document.getElementById('language-dropdown'),
            languageIcon: document.getElementById('language-icon'),
            languageName: document.getElementById('language-name'),
            codeEditorElement: document.getElementById('code-editor'),
            runButton: document.getElementById('run-btn'),
            clearButton: document.getElementById('clear-btn'),
            clearOutputButton: document.getElementById('clear-output-btn'),
            consoleInput: document.getElementById('console-input'),
            consoleOutput: document.getElementById('console-output'),
            output: document.getElementById('output')
        };

        const modals = {
            languageChange: new ModalManager('language-change-modal'),
            clearConfirm: new ModalManager('clear-confirm-modal')
        };

        const dropdowns = {
            language: new DropdownManager('language-select-button', 'language-dropdown')
        };

        let currentLanguage = CONFIG.DEFAULT_LANGUAGE;
        let pendingLanguageChange = null;

        const savedTheme = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
        applyTheme(savedTheme);

        let mediaQueryList = null;
        if (window.matchMedia) {
            mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
            const handleThemeChange = () => {
                const currentThemePreference = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
                if (currentThemePreference === 'system') {
                    applyTheme('system');
                }
            };
            if (mediaQueryList.addEventListener) {
                mediaQueryList.addEventListener('change', handleThemeChange);
                cleanupFunctions.push(() => {
                    if (mediaQueryList) {
                        mediaQueryList.removeEventListener('change', handleThemeChange);
                    }
                });
            } else {
                mediaQueryList.addListener(handleThemeChange);
                cleanupFunctions.push(() => {
                    if (mediaQueryList) {
                        mediaQueryList.removeListener(handleThemeChange);
                    }
                });
            }
        }

        updateLanguage(currentLang);

        const savedFontFamily = localStorage.getItem('fontFamily') || CONFIG.DEFAULT_FONT_FAMILY;
        const savedFontSize = parseInt(
            localStorage.getItem('fontSize') || CONFIG.DEFAULT_FONT_SIZE
        );
        const actualEditorTheme = savedTheme === 'system' ? getSystemTheme() : savedTheme;
        const monacoTheme = actualEditorTheme === 'dark' ? 'vs-dark' : 'vs';

        codeEditor = monaco.editor.create(elements.codeEditorElement, {
            value: LANGUAGE_CONFIG.templates[currentLanguage] || '',
            language: LANGUAGE_CONFIG.modes[currentLanguage] || 'plaintext',
            theme: monacoTheme,
            lineNumbers: 'on',
            wordWrap: 'on',
            tabSize: 4,
            insertSpaces: true,
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: savedFontSize,
            fontFamily: savedFontFamily,
            fontLigatures: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: { other: true, comments: true, strings: true },
            quickSuggestionsDelay: 10,
            acceptSuggestionOnEnter: 'on',
            acceptSuggestionOnCommitCharacter: true,
            snippetSuggestions: 'top',
            tabCompletion: 'on',
            wordBasedSuggestions: 'allDocuments',
            parameterHints: { enabled: true, cycle: true },
            formatOnPaste: true,
            formatOnType: true,
            unicodeHighlight: {
                ambiguousCharacters: false,
                invisibleCharacters: false,
                nonBasicASCII: false
            },
            renderWhitespace: 'selection',
            renderControlCharacters: false,
            renderIndentGuides: true,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            mouseWheelZoom: true,
            multiCursorModifier: 'ctrlCmd',
            accessibilitySupport: 'auto',
            autoIndent: 'full',
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true
            },
            suggest: {
                showKeywords: true,
                showSnippets: true,
                showClasses: true,
                showFunctions: true,
                showVariables: true,
                showFields: true,
                showMethods: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showText: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showIssues: true,
                showUsers: true,
                showWords: true,
                showDeprecated: true,
                maxVisibleSuggestions: 12,
                filterGraceful: true,
                shareSuggestSelections: false,
                showIcons: true,
                preview: true,
                previewMode: 'prefix',
                showStatusBar: true,
                insertMode: 'replace'
            },
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
                verticalScrollbarSize: 0,
                horizontalScrollbarSize: 0,
                useShadows: false,
                alwaysConsumeMouseWheel: false
            }
        });

        function getEditorValue() {
            return codeEditor.getValue();
        }

        function setEditorValue(value) {
            codeEditor.setValue(value);
            saveCodeToStorage();
        }

        function saveCodeToStorage() {
            const code = getEditorValue();
            const language = elements.languageSelect.value;
            if (code.trim()) {
                localStorage.setItem(`code_${language}`, code);
            }
        }
        const saveCodeToStorageDebounced = debounce(saveCodeToStorage, 300);
        cleanupFunctions.push(() => {
            if (saveCodeToStorageDebounced && saveCodeToStorageDebounced.flush) {
                saveCodeToStorageDebounced.flush();
            }
            if (saveCodeToStorageDebounced && saveCodeToStorageDebounced.cancel) {
                saveCodeToStorageDebounced.cancel();
            }
        });

        function loadCodeFromStorage() {
            const language = elements.languageSelect.value;
            const savedCode = localStorage.getItem(`code_${language}`);
            if (savedCode && savedCode.trim()) {
                return savedCode;
            }
            return LANGUAGE_CONFIG.templates[language] || '';
        }

        function updateSelectedLanguage(language) {
            saveCodeToStorage();
            elements.languageSelect.value = language;
            currentLanguage = language;

            const iconUrl = LANGUAGE_CONFIG.icons[language];
            if (iconUrl) {
                updateIcon(elements.languageIcon, iconUrl);
            }
            elements.languageName.textContent = LANGUAGE_CONFIG.names[language] || language;

            const mode = LANGUAGE_CONFIG.modes[language] || 'plaintext';
            monaco.editor.setModelLanguage(codeEditor.getModel(), mode);

            elements.languageDropdown.querySelectorAll('.select-option').forEach((option) => {
                const optionLanguage = option.dataset.value;
                const optionIconElement = option.querySelector('.language-icon');

                option.classList.toggle('selected', optionLanguage === language);

                if (optionIconElement && LANGUAGE_CONFIG.icons[optionLanguage]) {
                    updateIcon(optionIconElement, LANGUAGE_CONFIG.icons[optionLanguage]);
                }
            });

            const savedCode = loadCodeFromStorage();
            setEditorValue(savedCode);
            updateAutoComplete();

            clearConsole();
            if (elements.consoleOutput) {
                elements.consoleOutput.innerHTML = `<p class="text-muted">${translations[currentLang]['output-placeholder']}</p>`;
            }
        }

        function confirmLanguageChange() {
            if (pendingLanguageChange) {
                updateSelectedLanguage(pendingLanguageChange);
                setEditorValue(LANGUAGE_CONFIG.templates[pendingLanguageChange] || '');
                modals.languageChange.hide();
                dropdowns.language.close();
                pendingLanguageChange = null;
            }
        }

        function confirmClear() {
            const selectedLanguage = elements.languageSelect.value;
            const template = LANGUAGE_CONFIG.templates[selectedLanguage] || '';
            setEditorValue(template);
            localStorage.removeItem(`code_${selectedLanguage}`);
            clearConsole();
            if (elements.consoleOutput) {
                elements.consoleOutput.innerHTML = `<p class="text-muted">${translations[currentLang]['output-placeholder']}</p>`;
            }
            modals.clearConfirm.hide();
        }

        function updateMonacoTheme() {
            const theme = document.documentElement.getAttribute('data-theme');
            monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
        }

        elements.languageSelectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdowns.language.toggle();
        });

        document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
            confirmLanguageChange();
        });

        document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
            modals.languageChange.hide();
        });

        document.getElementById('clear-modal-confirm-btn')?.addEventListener('click', confirmClear);
        document.getElementById('clear-modal-cancel-btn')?.addEventListener('click', () => {
            modals.clearConfirm.hide();
        });

        elements.languageDropdown.querySelectorAll('.select-option').forEach((option) => {
            option.addEventListener('click', function () {
                const selectedLanguage = this.dataset.value;
                const currentLangValue = elements.languageSelect.value;

                if (currentLangValue === selectedLanguage) {
                    dropdowns.language.close();
                    return;
                }

                if (getEditorValue().trim() === '') {
                    updateSelectedLanguage(selectedLanguage);
                    setEditorValue(LANGUAGE_CONFIG.templates[selectedLanguage] || '');
                    dropdowns.language.close();
                } else {
                    pendingLanguageChange = selectedLanguage;
                    modals.languageChange.show();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (elements.runButton?.contains(e.target)) {
                return;
            }
            if (
                !elements.languageSelectButton?.contains(e.target) &&
                !elements.languageDropdown?.contains(e.target)
            ) {
                dropdowns.language.close();
            }
        });

        elements.languageSelect.addEventListener('change', () => {
            updateSelectedLanguage(elements.languageSelect.value);
        });

        elements.clearButton.addEventListener('click', () => {
            modals.clearConfirm.show();
        });

        if (elements.clearOutputButton) {
            elements.clearOutputButton.addEventListener('click', () => {
                clearConsole();
                if (elements.consoleOutput) {
                    elements.consoleOutput.innerHTML = `<p class="text-muted">${translations[currentLang]['output-placeholder']}</p>`;
                }
            });
        }



        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modals.languageChange.hide();
                modals.clearConfirm.hide();
            }
        });

        let abortController = null;

        function appendToConsole(text, type = 'output') {
            if (!elements.consoleOutput) {
                return;
            }

            const line = document.createElement('div');
            line.className = `console-line console-${type}`;

            if (type === 'input') {
                line.textContent = text;
            } else {
                line.textContent = text;
            }

            elements.consoleOutput.appendChild(line);
            elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
        }

        function clearConsole() {
            if (elements.consoleOutput) {
                elements.consoleOutput.innerHTML = '';
            }
            if (elements.consoleInput) {
                elements.consoleInput.value = '';
            }
        }

        async function executeCode() {
            const code = getEditorValue();
            const language = elements.languageSelect.value;
            const input = elements.consoleInput ? elements.consoleInput.value : '';

            if (!code.trim()) {
                if (elements.consoleOutput) {
                    elements.consoleOutput.innerHTML = `<p class="text-muted">${translations[currentLang]['no-code-error']}</p>`;
                }
                return;
            }

            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();

            saveCodeToStorage();

            const inputValue = input;
            if (elements.consoleInput) {
                elements.consoleInput.value = '';
                elements.consoleInput.disabled = true;
            }

            elements.runButton.disabled = true;
            elements.runButton.textContent = translations[currentLang]['running'] || translations.en['running'];

            if (inputValue && inputValue.trim()) {
                appendToConsole(inputValue, 'input');
            }

            try {
                const response = await fetch(`${CONFIG.API_URL}/api/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, language, input }),
                    signal: abortController.signal
                });

                if (!response.ok) {
                    let errorMessage = translations[currentLang]?.['request-error'] || translations.en['request-error'];
                    try {
                        const errorData = await response.json();
                        if (errorData.error) {
                            errorMessage = errorData.error;
                        }
                    } catch {
                    }
                    throw new Error(`HTTP ${response.status}: ${errorMessage}`);
                }

                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    throw new Error(`Failed to parse response: ${parseError.message}`);
                }
                const hasOutput = data.output?.trim().length > 0;
                const hasError = data.error?.trim().length > 0;

                if (data.images && data.images.length > 0) {
                    data.images.forEach((img) => {
                        const imgLine = document.createElement('div');
                        imgLine.className = 'console-line console-image';
                        const imgElement = document.createElement('img');
                        imgElement.src = img.data;
                        imgElement.alt = img.name;
                        Object.assign(imgElement.style, CONFIG.IMAGE_STYLES);
                        imgLine.appendChild(imgElement);
                        if (elements.consoleOutput) {
                            elements.consoleOutput.appendChild(imgLine);
                            elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
                        }
                    });
                }

                if (hasOutput) {
                    const normalized = data.output.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    const filtered = normalized
                        .split('\n')
                        .filter(line => !CONFIG.DEBUG_PATTERNS.some(pattern => pattern.test(line.trim())))
                        .join('\n');
                    const collapsed = filtered.replace(/\n{2,}/g, '\n').replace(/[ \t]+\n/g, '\n').trimEnd();
                    const pre = document.createElement('pre');
                    pre.textContent = collapsed;
                    if (elements.consoleOutput) {
                        elements.consoleOutput.appendChild(pre);
                        elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
                    }
                }

                if (hasError) {
                    const normalizedErr = data.error.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    let collapsedErr = normalizedErr.replace(/\n{2,}/g, '\n').replace(/[ \t]+\n/g, '\n').trimEnd();
                    
                    const lines = collapsedErr.split('\n');
                    if (lines.length > CONFIG.MAX_ERROR_LINES) {
                        const moreMsg = translations[currentLang]?.['more-error-messages'] || translations.en['more-error-messages'];
                        collapsedErr = lines.slice(0, CONFIG.MAX_ERROR_LINES).join('\n') + '\n' + moreMsg;
                    }
                    if (collapsedErr.length > CONFIG.MAX_ERROR_LENGTH) {
                        collapsedErr = collapsedErr.substring(0, CONFIG.MAX_ERROR_LENGTH) + '...';
                    }
                    
                    const pre = document.createElement('pre');
                    pre.textContent = collapsedErr;
                    pre.style.color = getComputedStyle(document.documentElement)
                        .getPropertyValue('--error-color')
                        .trim() || CONFIG.DEFAULT_ERROR_COLOR;
                    if (elements.consoleOutput) {
                        elements.consoleOutput.appendChild(pre);
                        elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
                    }
                }

                if (
                    !hasOutput &&
                    !hasError &&
                    !inputValue &&
                    (!data.images || data.images.length === 0)
                ) {
                    appendToConsole(
                        translations[currentLang]['no-output'] || translations.en['no-output'],
                        'info'
                    );
                }

                if (elements.consoleInput) {
                    elements.consoleInput.disabled = false;
                    elements.consoleInput.focus();
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    if (elements.runButton) {
                        elements.runButton.disabled = false;
                        elements.runButton.textContent = translations[currentLang]['run'];
                    }
                    if (elements.consoleInput) {
                        elements.consoleInput.disabled = false;
                    }
                    abortController = null;
                    return;
                }
                console.error('Execution error:', error);
                if (elements.consoleOutput) {
                    let userMessage = translations[currentLang]?.['connection-error'] || translations.en['connection-error'];
                    
                    if (error.message) {
                        const msg = error.message.toLowerCase();
                        if (msg.includes('failed to fetch') || msg.includes('network')) {
                            userMessage = translations[currentLang]?.['cannot-connect-server'] || translations.en['cannot-connect-server'];
                        } else if (msg.includes('timeout')) {
                            userMessage = translations[currentLang]?.['request-timeout'] || translations.en['request-timeout'];
                        } else if (msg.includes('400')) {
                            userMessage = translations[currentLang]?.['bad-request'] || translations.en['bad-request'];
                        } else if (msg.includes('500')) {
                            userMessage = translations[currentLang]?.['server-error'] || translations.en['server-error'];
                        } else if (msg.includes('parse')) {
                            userMessage = translations[currentLang]?.['cannot-process-response'] || translations.en['cannot-process-response'];
                        } else {
                            const match = error.message.match(/HTTP \d+: (.+)/);
                            if (match && match[1]) {
                                userMessage = match[1];
                            }
                        }
                    }
                    
                    appendToConsole(userMessage, 'error');
                    const checkBackendMsg = translations[currentLang]?.['check-backend'] || translations.en['check-backend'];
                    appendToConsole(checkBackendMsg, 'info');
                }
                if (elements.consoleInput) {
                    elements.consoleInput.disabled = false;
                }
            } finally {
                elements.runButton.disabled = false;
                elements.runButton.textContent = translations[currentLang]['run'];
                abortController = null;
            }
        }

        elements.runButton.addEventListener(
            'click',
            async (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (elements.consoleOutput) {
                    clearConsole();
                    elements.consoleOutput.innerHTML = '';
                }

                if (elements.consoleInput) {
                    elements.consoleInput.disabled = false;
                    elements.consoleInput.focus();
                }

                await executeCode();

                return false;
            },
            true
        );

        codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            if (getEditorValue().trim()) {
                elements.runButton.click();
            } else {
                elements.output.innerHTML = `<p class="text-muted">${translations[currentLang]['no-code-error']}</p>`;
            }
        });

        codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
            if (
                getEditorValue().trim() &&
                getEditorValue() !== LANGUAGE_CONFIG.templates[currentLanguage]
            ) {
                modals.clearConfirm.show();
            }
        });

        let isComposing = false;
        let compositionTimeout = null;
        let originalQuickSuggestions = null;
        let originalFormatOnType = null;
        let originalAcceptSuggestionOnCommitCharacter = null;
        let contentChangeDisposable = null;
        let compositionCleanups = [];

        const cleanupComposition = () => {
            if (compositionTimeout) {
                clearTimeout(compositionTimeout);
                compositionTimeout = null;
            }
            compositionCleanups.forEach(fn => {
                try {
                    fn();
                } catch (error) {
                    console.error('Composition cleanup error:', error);
                }
            });
            compositionCleanups = [];
        };

        contentChangeDisposable = codeEditor.onDidChangeModelContent(() => {
            if (!isComposing) {
                saveCodeToStorageDebounced();
            }
        });
        cleanupFunctions.push(() => {
            if (contentChangeDisposable) {
                contentChangeDisposable.dispose();
            }
        });

        const editorDomNode = codeEditor.getDomNode();
        if (editorDomNode) {
            const textArea = editorDomNode.querySelector('textarea');
            if (textArea) {
                const handleCompositionStart = (e) => {
                    e.stopPropagation();
                    isComposing = true;
                    
                    cleanupComposition();
                    
                    const options = codeEditor.getOptions();
                    if (originalQuickSuggestions === null) {
                        originalQuickSuggestions = options.get(monaco.editor.EditorOption.quickSuggestions);
                        originalFormatOnType = options.get(monaco.editor.EditorOption.formatOnType);
                        originalAcceptSuggestionOnCommitCharacter = options.get(monaco.editor.EditorOption.acceptSuggestionOnCommitCharacter);
                    }
                    
                    codeEditor.updateOptions({
                        quickSuggestions: false,
                        formatOnType: false,
                        formatOnPaste: false,
                        suggestOnTriggerCharacters: false,
                        acceptSuggestionOnCommitCharacter: false,
                        acceptSuggestionOnEnter: 'off'
                    });
                };

                const handleCompositionUpdate = (e) => {
                    e.stopPropagation();
                    if (isComposing) {
                        codeEditor.updateOptions({
                            quickSuggestions: false,
                            formatOnType: false,
                            suggestOnTriggerCharacters: false,
                            acceptSuggestionOnCommitCharacter: false
                        });
                    }
                };

                const handleCompositionEnd = (e) => {
                    e.stopPropagation();
                    isComposing = false;
                    
                    if (compositionTimeout) {
                        clearTimeout(compositionTimeout);
                    }
                    
                    compositionTimeout = setTimeout(() => {
                        if (!isComposing && originalQuickSuggestions !== null) {
                            codeEditor.updateOptions({
                                quickSuggestions: originalQuickSuggestions,
                                formatOnType: originalFormatOnType,
                                formatOnPaste: true,
                                suggestOnTriggerCharacters: true,
                                acceptSuggestionOnCommitCharacter: originalAcceptSuggestionOnCommitCharacter,
                                acceptSuggestionOnEnter: 'on'
                            });
                            saveCodeToStorageDebounced();
                        }
                        compositionTimeout = null;
                    }, 100);
                };
                textArea.addEventListener('compositionstart', handleCompositionStart, true);
                textArea.addEventListener('compositionupdate', handleCompositionUpdate, true);
                textArea.addEventListener('compositionend', handleCompositionEnd, true);
                
                compositionCleanups.push(
                    () => textArea.removeEventListener('compositionstart', handleCompositionStart, true),
                    () => textArea.removeEventListener('compositionupdate', handleCompositionUpdate, true),
                    () => textArea.removeEventListener('compositionend', handleCompositionEnd, true)
                );
            }
        }
        
        cleanupFunctions.push(cleanupComposition);

        codeEditor.updateOptions({
            domReadOnly: false,
            readOnly: false,
            disableLayerHinting: false,
            stopRenderingLineAfter: 10000,
            renderValidationDecorations: 'on',
            renderLineHighlightOnlyWhenFocus: false
        });

        function updateAutoComplete() {
            const model = codeEditor.getModel();
            if (!model) {
                return;
            }

            if (currentLanguage === 'javascript') {
                return;
            }

            try {
                monaco.languages.setLanguageConfiguration(currentLanguage, {
                    wordPattern: /[a-zA-Z_$][a-zA-Z0-9_$]*/g,
                    comments: {
                        lineComment: getLineComment(currentLanguage),
                        blockComment: getBlockComment(currentLanguage)
                    },
                    brackets: getBrackets(currentLanguage),
                    autoClosingPairs: getAutoClosingPairs(currentLanguage),
                    surroundingPairs: getSurroundingPairs(currentLanguage)
                });

                registerCompletionProvider(currentLanguage);
            } catch (error) {
                console.debug('Language configuration failed:', error);
            }
        }

        const registeredProviders = new Set();

        function registerCompletionProvider(language) {
            if (registeredProviders.has(language) || language === 'javascript') {
                return;
            }

            try {

                monaco.languages.registerCompletionItemProvider(language, {
                    triggerCharacters: ['.', '(', '[', '{', ':', ' '],
                    provideCompletionItems: function (model, position) {
                        const text = model.getValue();
                        const words = extractWords(text, language);
                        const wordAtPosition = model.getWordUntilPosition(position);
                        const currentWord = wordAtPosition.word;
                        const linePrefix = model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        });

                        const suggestions = [];

                        const snippets = getSnippets(language);
                        snippets.forEach(snippet => {
                            if (currentWord && currentWord.length > 0) {
                                const wordLower = currentWord.toLowerCase();
                                const prefixLower = snippet.prefix.toLowerCase();
                                if (prefixLower.startsWith(wordLower) || wordLower === prefixLower) {
                                    suggestions.push({
                                        label: snippet.prefix,
                                        kind: monaco.languages.CompletionItemKind.Snippet,
                                        insertText: snippet.body,
                                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                        documentation: snippet.description,
                                        detail: snippet.label,
                                        range: {
                                            startLineNumber: position.lineNumber,
                                            endLineNumber: position.lineNumber,
                                            startColumn: wordAtPosition.startColumn,
                                            endColumn: wordAtPosition.endColumn
                                        },
                                        sortText: '0' + snippet.prefix
                                    });
                                }
                            }
                        });

                        const keywords = getKeywords(language);
                        keywords.forEach(keyword => {
                            if (!currentWord || keyword.toLowerCase().startsWith(currentWord.toLowerCase())) {
                                suggestions.push({
                                    label: keyword,
                                    kind: monaco.languages.CompletionItemKind.Keyword,
                                    insertText: keyword,
                                    range: {
                                        startLineNumber: position.lineNumber,
                                        endLineNumber: position.lineNumber,
                                        startColumn: wordAtPosition.startColumn,
                                        endColumn: wordAtPosition.endColumn
                                    },
                                    sortText: '1' + keyword
                                });
                            }
                        });

                        const wordSuggestions = words
                            .filter(
                                (word) =>
                                    (!currentWord || word.toLowerCase().startsWith(currentWord.toLowerCase())) &&
                                    word !== currentWord &&
                                    word.length > 1 &&
                                    !keywords.includes(word)
                            )
                            .slice(0, CONFIG.MAX_AUTOCOMPLETE_SUGGESTIONS_WITH_SNIPPETS)
                            .map((word) => ({
                                label: word,
                                kind: monaco.languages.CompletionItemKind.Variable,
                                insertText: word,
                                range: {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn: wordAtPosition.startColumn,
                                    endColumn: wordAtPosition.endColumn
                                },
                                sortText: '2' + word
                            }));

                        suggestions.push(...wordSuggestions);

                        const sortedSuggestions = suggestions.sort((a, b) => {
                            if (a.sortText && b.sortText) {
                                return a.sortText.localeCompare(b.sortText);
                            }
                            return 0;
                        });

                        if (!currentWord || currentWord.length === 0) {
                            const nonSnippetSuggestions = sortedSuggestions.filter(s => s.kind !== monaco.languages.CompletionItemKind.Snippet);
                            return { suggestions: nonSnippetSuggestions.slice(0, CONFIG.MAX_AUTOCOMPLETE_SUGGESTIONS) };
                        }

                        return { suggestions: sortedSuggestions.slice(0, CONFIG.MAX_AUTOCOMPLETE_SUGGESTIONS_WITH_SNIPPETS) };
                    }
                });

                registeredProviders.add(language);
            } catch (error) {
                console.debug('Completion provider registration failed:', error);
            }
        }

        function getKeywords(language) {
            const allKeywords = {
                python: [
                    'if', 'else', 'elif', 'for', 'while', 'def', 'class', 'import', 'from', 'as',
                    'return', 'try', 'except', 'finally', 'with', 'pass', 'break', 'continue',
                    'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'lambda', 'yield',
                    'global', 'nonlocal', 'assert', 'raise', 'del', 'print', 'len', 'range',
                    'str', 'int', 'float', 'list', 'dict', 'tuple', 'set', 'bool', 'abs', 'all',
                    'any', 'bin', 'bool', 'chr', 'dict', 'dir', 'divmod', 'enumerate', 'eval',
                    'exec', 'filter', 'float', 'format', 'frozenset', 'getattr', 'hasattr', 'hash',
                    'help', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
                    'list', 'locals', 'map', 'max', 'min', 'next', 'oct', 'open', 'ord', 'pow',
                    'print', 'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr',
                    'slice', 'sorted', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
                    'append', 'extend', 'insert', 'remove', 'pop', 'index', 'count', 'sort',
                    'reverse', 'copy', 'clear', 'keys', 'values', 'items', 'get', 'update',
                    'popitem', 'setdefault', 'split', 'join', 'strip', 'replace', 'find', 'index',
                    'startswith', 'endswith', 'lower', 'upper', 'title', 'capitalize', 'isalpha',
                    'isdigit', 'isalnum', 'isspace', 'format', 'f-string', 'open', 'read', 'write',
                    'close', 'readline', 'readlines', 'writelines', 'seek', 'tell', 'with', 'as'
                ],
                java: [
                    'if', 'else', 'for', 'while', 'class', 'public', 'private', 'protected',
                    'static', 'void', 'return', 'try', 'catch', 'finally', 'import', 'package',
                    'extends', 'implements', 'new', 'this', 'super', 'final', 'abstract',
                    'interface', 'enum', 'switch', 'case', 'default', 'break', 'continue',
                    'int', 'String', 'boolean', 'char', 'double', 'float', 'long', 'short',
                    'byte', 'System', 'out', 'println', 'main', 'args', 'Scanner', 'ArrayList',
                    'HashMap', 'HashSet', 'LinkedList', 'Vector', 'Stack', 'Queue', 'TreeMap',
                    'TreeSet', 'Arrays', 'Collections', 'Math', 'Random', 'Date', 'Calendar',
                    'StringBuilder', 'StringBuffer', 'Integer', 'Double', 'Float', 'Boolean',
                    'Character', 'Long', 'Short', 'Byte', 'BigInteger', 'BigDecimal', 'Object',
                    'equals', 'hashCode', 'toString', 'clone', 'getClass', 'notify', 'notifyAll',
                    'wait', 'finalize', 'length', 'charAt', 'substring', 'indexOf', 'lastIndexOf',
                    'contains', 'startsWith', 'endsWith', 'replace', 'replaceAll', 'split', 'trim',
                    'toLowerCase', 'toUpperCase', 'valueOf', 'parseInt', 'parseDouble', 'parseFloat',
                    'parseLong', 'parseBoolean', 'format', 'printf', 'nextInt', 'nextDouble',
                    'nextLine', 'next', 'hasNext', 'hasNextInt', 'hasNextDouble', 'close', 'add',
                    'remove', 'get', 'set', 'size', 'isEmpty', 'contains', 'indexOf', 'clear',
                    'toArray', 'iterator', 'addAll', 'removeAll', 'retainAll', 'containsAll'
                ],
                cpp: [
                    'if', 'else', 'for', 'while', 'class', 'public', 'private', 'protected',
                    'static', 'void', 'return', 'try', 'catch', 'include', 'using', 'namespace',
                    'new', 'delete', 'this', 'const', 'int', 'char', 'string', 'bool', 'double',
                    'float', 'auto', 'nullptr', 'true', 'false', 'cout', 'cin', 'endl', 'std',
                    'vector', 'map', 'set', 'list', 'deque', 'queue', 'stack', 'priority_queue',
                    'array', 'tuple', 'pair', 'unordered_map', 'unordered_set', 'multimap',
                    'multiset', 'bitset', 'algorithm', 'numeric', 'functional', 'iterator',
                    'memory', 'utility', 'type_traits', 'limits', 'cmath', 'cstring', 'cstdlib',
                    'cstdio', 'ctime', 'cassert', 'fstream', 'sstream', 'iomanip', 'regex',
                    'thread', 'mutex', 'condition_variable', 'future', 'async', 'promise',
                    'size', 'empty', 'push_back', 'pop_back', 'push_front', 'pop_front',
                    'insert', 'erase', 'clear', 'begin', 'end', 'rbegin', 'rend', 'find',
                    'count', 'lower_bound', 'upper_bound', 'equal_range', 'sort', 'reverse',
                    'unique', 'remove', 'remove_if', 'transform', 'for_each', 'accumulate',
                    'max_element', 'min_element', 'max', 'min', 'abs', 'pow', 'sqrt', 'sin',
                    'cos', 'tan', 'log', 'exp', 'ceil', 'floor', 'round', 'strlen', 'strcpy',
                    'strcat', 'strcmp', 'strstr', 'strtok', 'atoi', 'atof', 'itoa', 'sprintf',
                    'sscanf', 'malloc', 'calloc', 'realloc', 'free', 'memset', 'memcpy', 'memmove'
                ],
                c: [
                    'if', 'else', 'for', 'while', 'return', 'include', 'define', 'typedef',
                    'struct', 'enum', 'union', 'int', 'char', 'float', 'double', 'void',
                    'const', 'static', 'extern', 'printf', 'scanf', 'malloc', 'free', 'NULL',
                    'size_t', 'FILE', 'fopen', 'fclose', 'fread', 'fwrite', 'fgets', 'fputs',
                    'fprintf', 'fscanf', 'feof', 'ferror', 'fseek', 'ftell', 'rewind', 'remove',
                    'rename', 'tmpfile', 'tmpnam', 'strlen', 'strcpy', 'strncpy', 'strcat',
                    'strncat', 'strcmp', 'strncmp', 'strchr', 'strrchr', 'strstr', 'strtok',
                    'strspn', 'strcspn', 'strpbrk', 'memset', 'memcpy', 'memmove', 'memcmp',
                    'memchr', 'atoi', 'atol', 'atof', 'strtol', 'strtoul', 'strtod', 'sprintf',
                    'snprintf', 'sscanf', 'calloc', 'realloc', 'abort', 'exit', 'atexit',
                    'system', 'getenv', 'time', 'clock', 'difftime', 'ctime', 'localtime',
                    'gmtime', 'mktime', 'strftime', 'asctime', 'rand', 'srand', 'abs', 'labs',
                    'div', 'ldiv', 'ceil', 'floor', 'fabs', 'sqrt', 'pow', 'exp', 'log', 'log10',
                    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh',
                    'isalnum', 'isalpha', 'iscntrl', 'isdigit', 'isgraph', 'islower', 'isprint',
                    'ispunct', 'isspace', 'isupper', 'isxdigit', 'tolower', 'toupper', 'assert',
                    'setjmp', 'longjmp', 'signal', 'raise', 'va_start', 'va_arg', 'va_end'
                ],
                rust: [
                    'fn', 'let', 'mut', 'const', 'static', 'if', 'else', 'match', 'for', 'while',
                    'loop', 'return', 'break', 'continue', 'struct', 'enum', 'impl', 'trait',
                    'pub', 'use', 'mod', 'self', 'Self', 'true', 'false', 'Some', 'None',
                    'Ok', 'Err', 'Result', 'Option', 'String', 'Vec', 'i32', 'i64', 'u32', 'u64',
                    'f32', 'f64', 'bool', 'char', 'println!', 'print!', 'format!', 'Box', 'Rc',
                    'Arc', 'RefCell', 'Cell', 'Mutex', 'RwLock', 'HashMap', 'HashSet', 'BTreeMap',
                    'BTreeSet', 'VecDeque', 'LinkedList', 'BinaryHeap', 'String', 'str', 'OsString',
                    'Path', 'PathBuf', 'File', 'BufReader', 'BufWriter', 'Read', 'Write', 'Seek',
                    'Clone', 'Copy', 'Debug', 'Display', 'Default', 'PartialEq', 'Eq', 'PartialOrd',
                    'Ord', 'Hash', 'Iterator', 'IntoIterator', 'FromIterator', 'Extend', 'From',
                    'Into', 'AsRef', 'AsMut', 'Deref', 'DerefMut', 'Drop', 'Send', 'Sync', 'Sized',
                    'Unpin', 'UnsafeCell', 'PhantomData', 'MaybeUninit', 'ManuallyDrop', 'NonNull',
                    'NonZero', 'Wrapping', 'Saturating', 'Checked', 'Overflowing', 'len', 'capacity',
                    'push', 'pop', 'insert', 'remove', 'get', 'get_mut', 'contains', 'is_empty',
                    'clear', 'iter', 'iter_mut', 'into_iter', 'map', 'filter', 'fold', 'collect',
                    'find', 'find_map', 'any', 'all', 'sum', 'product', 'max', 'min', 'unwrap',
                    'unwrap_or', 'unwrap_or_else', 'expect', 'ok', 'err', 'is_ok', 'is_err',
                    'as_ref', 'as_mut', 'map', 'map_err', 'and_then', 'or_else', 'unwrap_or_default'
                ],
                php: [
                    'if', 'else', 'elseif', 'for', 'foreach', 'while', 'do', 'switch', 'case',
                    'function', 'class', 'public', 'private', 'protected', 'static', 'return',
                    'try', 'catch', 'finally', 'throw', 'new', 'this', 'self', 'parent',
                    'echo', 'print', 'var_dump', 'isset', 'empty', 'array', 'string', 'int',
                    'bool', 'float', 'null', 'true', 'false', '$_GET', '$_POST', '$_SESSION',
                    '$_COOKIE', '$_FILES', '$_SERVER', '$_ENV', '$_REQUEST', '$GLOBALS', 'array',
                    'array_push', 'array_pop', 'array_shift', 'array_unshift', 'array_merge',
                    'array_slice', 'array_splice', 'array_keys', 'array_values', 'array_search',
                    'array_key_exists', 'in_array', 'count', 'sizeof', 'empty', 'isset', 'unset',
                    'strlen', 'strpos', 'strrpos', 'substr', 'str_replace', 'str_ireplace',
                    'strtolower', 'strtoupper', 'ucfirst', 'ucwords', 'trim', 'ltrim', 'rtrim',
                    'explode', 'implode', 'join', 'split', 'preg_match', 'preg_replace',
                    'preg_split', 'htmlspecialchars', 'htmlentities', 'strip_tags', 'addslashes',
                    'stripslashes', 'md5', 'sha1', 'hash', 'base64_encode', 'base64_decode',
                    'json_encode', 'json_decode', 'serialize', 'unserialize', 'date', 'time',
                    'strtotime', 'mktime', 'date_format', 'gmdate', 'file_get_contents',
                    'file_put_contents', 'fopen', 'fclose', 'fread', 'fwrite', 'fgets', 'feof',
                    'file_exists', 'is_file', 'is_dir', 'mkdir', 'rmdir', 'unlink', 'copy',
                    'move_uploaded_file', 'header', 'setcookie', 'session_start', 'session_destroy',
                    'session_id', 'session_name', 'mysqli_connect', 'mysqli_query', 'mysqli_fetch_array',
                    'mysqli_fetch_assoc', 'mysqli_fetch_row', 'mysqli_close', 'PDO', 'prepare',
                    'execute', 'fetch', 'fetchAll', 'bindParam', 'bindValue'
                ],
                r: [
                    'if', 'else', 'for', 'while', 'repeat', 'function', 'return', 'break', 'next',
                    'TRUE', 'FALSE', 'NULL', 'NA', 'Inf', 'NaN', 'c', 'list', 'data.frame',
                    'matrix', 'vector', 'array', 'cat', 'print', 'paste', 'paste0', 'strsplit',
                    'length', 'nrow', 'ncol', 'dim', 'names', 'colnames', 'rownames', 'factor',
                    'as.factor', 'as.character', 'as.numeric', 'as.integer', 'as.logical', 'as.Date',
                    'as.POSIXct', 'as.POSIXlt', 'str', 'summary', 'head', 'tail', 'View', 'glimpse',
                    'class', 'typeof', 'mode', 'attributes', 'attr', 'structure', 'is.numeric',
                    'is.character', 'is.logical', 'is.factor', 'is.data.frame', 'is.matrix',
                    'is.vector', 'is.list', 'is.na', 'is.null', 'is.infinite', 'is.nan', 'which',
                    'which.max', 'which.min', 'which.min', 'which.max', 'which', 'any', 'all',
                    'sum', 'mean', 'median', 'sd', 'var', 'min', 'max', 'range', 'quantile',
                    'IQR', 'cor', 'cov', 'lm', 'glm', 'aov', 't.test', 'chisq.test', 'plot',
                    'hist', 'boxplot', 'barplot', 'pie', 'lines', 'points', 'abline', 'legend',
                    'title', 'xlab', 'ylab', 'par', 'dev.off', 'png', 'pdf', 'jpeg', 'read.csv',
                    'read.table', 'read.delim', 'write.csv', 'write.table', 'readLines', 'writeLines',
                    'readRDS', 'saveRDS', 'load', 'save', 'library', 'require', 'install.packages',
                    'dplyr', 'filter', 'select', 'mutate', 'arrange', 'group_by', 'summarise',
                    'summarize', 'distinct', 'slice', 'pull', 'rename', 'bind_rows', 'bind_cols',
                    'left_join', 'right_join', 'inner_join', 'full_join', 'anti_join', 'semi_join'
                ],
                ruby: [
                    'if', 'else', 'elsif', 'unless', 'for', 'while', 'until', 'def', 'class',
                    'module', 'end', 'return', 'yield', 'next', 'break', 'redo', 'retry',
                    'begin', 'rescue', 'ensure', 'raise', 'require', 'include', 'extend',
                    'true', 'false', 'nil', 'self', 'super', 'puts', 'print', 'p', 'gets',
                    'chomp', 'to_s', 'to_i', 'to_f', 'to_a', 'to_h', 'to_sym', 'each', 'map',
                    'select', 'reject', 'find', 'detect', 'find_all', 'collect', 'inject',
                    'reduce', 'each_with_index', 'each_with_object', 'group_by', 'partition',
                    'sort', 'sort_by', 'reverse', 'uniq', 'compact', 'flatten', 'zip', 'transpose',
                    'first', 'last', 'take', 'drop', 'take_while', 'drop_while', 'slice', 'slice_before',
                    'slice_after', 'slice_when', 'chunk', 'chunk_while', 'grep', 'grep_v', 'scan',
                    'match', 'gsub', 'sub', 'split', 'join', 'strip', 'lstrip', 'rstrip', 'chop',
                    'chomp', 'upcase', 'downcase', 'capitalize', 'swapcase', 'reverse', 'length',
                    'size', 'empty?', 'nil?', 'include?', 'start_with?', 'end_with?', 'index',
                    'rindex', 'insert', 'delete', 'delete_at', 'delete_if', 'keep_if', 'clear',
                    'push', 'pop', 'shift', 'unshift', 'concat', '<<', '[]', '[]=', 'at', 'fetch',
                    'values_at', 'assoc', 'rassoc', 'key', 'keys', 'values', 'has_key?', 'has_value?',
                    'merge', 'merge!', 'update', 'invert', 'transform_keys', 'transform_values',
                    'File', 'Dir', 'FileUtils', 'open', 'read', 'write', 'readlines', 'writelines',
                    'readline', 'gets', 'puts', 'print', 'printf', 'sprintf', 'format', 'File.exist?',
                    'File.file?', 'File.directory?', 'File.size', 'File.mtime', 'File.ctime',
                    'File.atime', 'Dir.glob', 'Dir.entries', 'Dir.mkdir', 'Dir.rmdir', 'Dir.pwd',
                    'Dir.chdir', 'Dir.chroot', 'Time', 'Date', 'DateTime', 'now', 'today', 'parse',
                    'strftime', 'to_s', 'to_i', 'to_f', 'year', 'month', 'day', 'hour', 'min',
                    'sec', 'wday', 'yday', 'zone', 'utc', 'localtime', 'gmtime', 'JSON', 'parse',
                    'generate', 'pretty_generate', 'load', 'dump', 'YAML', 'load', 'dump', 'to_yaml'
                ],
                csharp: [
                    'if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'class',
                    'public', 'private', 'protected', 'internal', 'static', 'void', 'return',
                    'try', 'catch', 'finally', 'throw', 'using', 'namespace', 'new', 'this',
                    'base', 'var', 'int', 'string', 'bool', 'double', 'float', 'char', 'object',
                    'Console', 'WriteLine', 'ReadLine', 'Main', 'args', 'true', 'false', 'null',
                    'List', 'Dictionary', 'HashSet', 'Queue', 'Stack', 'LinkedList', 'SortedList',
                    'SortedDictionary', 'Array', 'ArrayList', 'Hashtable', 'Tuple', 'ValueTuple',
                    'StringBuilder', 'StringReader', 'StringWriter', 'StreamReader', 'StreamWriter',
                    'File', 'FileInfo', 'Directory', 'DirectoryInfo', 'Path', 'FileStream',
                    'MemoryStream', 'BinaryReader', 'BinaryWriter', 'XmlReader', 'XmlWriter',
                    'XDocument', 'XElement', 'XAttribute', 'JsonSerializer', 'JsonConvert',
                    'JObject', 'JArray', 'JToken', 'HttpClient', 'HttpRequestMessage',
                    'HttpResponseMessage', 'WebRequest', 'WebResponse', 'Socket', 'TcpClient',
                    'TcpListener', 'UdpClient', 'Thread', 'Task', 'async', 'await', 'Parallel',
                    'ThreadPool', 'Semaphore', 'Mutex', 'Monitor', 'lock', 'Interlocked',
                    'ConcurrentDictionary', 'ConcurrentQueue', 'ConcurrentStack', 'BlockingCollection',
                    'CancellationToken', 'CancellationTokenSource', 'Timer', 'Stopwatch',
                    'DateTime', 'TimeSpan', 'DateTimeOffset', 'TimeZoneInfo', 'CultureInfo',
                    'Regex', 'Match', 'MatchCollection', 'Group', 'GroupCollection', 'Capture',
                    'Math', 'Random', 'Guid', 'Environment', 'Process', 'Assembly', 'Type',
                    'Activator', 'Reflection', 'Attribute', 'LINQ', 'Where', 'Select', 'OrderBy',
                    'OrderByDescending', 'ThenBy', 'ThenByDescending', 'GroupBy', 'Join',
                    'GroupJoin', 'SelectMany', 'Aggregate', 'Sum', 'Average', 'Min', 'Max',
                    'Count', 'LongCount', 'First', 'FirstOrDefault', 'Last', 'LastOrDefault',
                    'Single', 'SingleOrDefault', 'ElementAt', 'ElementAtOrDefault', 'Any',
                    'All', 'Contains', 'Distinct', 'Except', 'Intersect', 'Union', 'Concat',
                    'Skip', 'SkipWhile', 'Take', 'TakeWhile', 'Reverse', 'DefaultIfEmpty',
                    'OfType', 'Cast', 'ToArray', 'ToList', 'ToDictionary', 'ToLookup',
                    'Zip', 'SequenceEqual', 'Append', 'Prepend', 'Chunk', 'Split', 'Join',
                    'Substring', 'IndexOf', 'LastIndexOf', 'Contains', 'StartsWith', 'EndsWith',
                    'Replace', 'Remove', 'Insert', 'PadLeft', 'PadRight', 'Trim', 'TrimStart',
                    'TrimEnd', 'ToLower', 'ToUpper', 'ToLowerInvariant', 'ToUpperInvariant',
                    'Format', 'Concat', 'Compare', 'CompareTo', 'Equals', 'GetHashCode',
                    'ToString', 'Parse', 'TryParse', 'Convert', 'ChangeType', 'IsNullOrEmpty',
                    'IsNullOrWhiteSpace', 'Length', 'Count', 'Capacity', 'Add', 'AddRange',
                    'Remove', 'RemoveAt', 'RemoveAll', 'RemoveRange', 'Insert', 'InsertRange',
                    'Clear', 'Contains', 'IndexOf', 'LastIndexOf', 'Find', 'FindAll', 'FindIndex',
                    'FindLast', 'FindLastIndex', 'Exists', 'TrueForAll', 'ForEach', 'Sort',
                    'Reverse', 'ToArray', 'AsReadOnly', 'BinarySearch', 'CopyTo', 'GetRange'
                ],
                kotlin: [
                    'fun', 'val', 'var', 'if', 'else', 'when', 'for', 'while', 'do', 'class',
                    'interface', 'object', 'enum', 'data', 'sealed', 'abstract', 'open',
                    'private', 'protected', 'internal', 'public', 'return', 'break', 'continue',
                    'try', 'catch', 'finally', 'throw', 'import', 'package', 'this', 'super',
                    'null', 'true', 'false', 'Int', 'String', 'Boolean', 'Double', 'Float',
                    'Long', 'Short', 'Byte', 'Char', 'Array', 'List', 'Set', 'Map', 'println',
                    'mutableListOf', 'listOf', 'arrayListOf', 'mutableSetOf', 'setOf', 'hashSetOf',
                    'linkedSetOf', 'sortedSetOf', 'mutableMapOf', 'mapOf', 'hashMapOf', 'linkedMapOf',
                    'sortedMapOf', 'emptyList', 'emptySet', 'emptyMap', 'listOfNotNull', 'setOfNotNull',
                    'buildList', 'buildSet', 'buildMap', 'toList', 'toSet', 'toMap', 'toMutableList',
                    'toMutableSet', 'toMutableMap', 'toTypedArray', 'toIntArray', 'toLongArray',
                    'toShortArray', 'toByteArray', 'toCharArray', 'toFloatArray', 'toDoubleArray',
                    'toBooleanArray', 'asList', 'asSequence', 'asIterable', 'asCollection', 'asReversed',
                    'shuffled', 'sorted', 'sortedBy', 'sortedWith', 'sortedDescending', 'sortedByDescending',
                    'reversed', 'distinct', 'distinctBy', 'union', 'intersect', 'subtract', 'plus',
                    'minus', 'contains', 'containsAll', 'isEmpty', 'isNotEmpty', 'isNullOrEmpty',
                    'isNullOrBlank', 'ifEmpty', 'ifBlank', 'orEmpty', 'orElse', 'orElseGet',
                    'take', 'takeLast', 'takeWhile', 'takeLastWhile', 'drop', 'dropLast', 'dropWhile',
                    'dropLastWhile', 'first', 'firstOrNull', 'last', 'lastOrNull', 'single', 'singleOrNull',
                    'elementAt', 'elementAtOrNull', 'elementAtOrElse', 'get', 'getOrNull', 'getOrElse',
                    'indexOf', 'indexOfFirst', 'indexOfLast', 'lastIndexOf', 'find', 'findLast',
                    'any', 'all', 'none', 'count', 'sum', 'sumOf', 'average', 'min', 'minOf',
                    'minWith', 'minBy', 'max', 'maxOf', 'maxWith', 'maxBy', 'reduce', 'reduceIndexed',
                    'reduceOrNull', 'fold', 'foldIndexed', 'runningFold', 'runningReduce', 'scan',
                    'groupBy', 'groupingBy', 'partition', 'chunked', 'windowed', 'zip', 'zipWithNext',
                    'unzip', 'flatten', 'flatMap', 'map', 'mapIndexed', 'mapNotNull', 'mapIndexedNotNull',
                    'associate', 'associateBy', 'associateWith', 'associateByTo', 'associateWithTo',
                    'filter', 'filterIndexed', 'filterNot', 'filterNotNull', 'filterIsInstance',
                    'filterIsInstanceTo', 'onEach', 'forEach', 'forEachIndexed', 'withIndex',
                    'joinToString', 'joinTo', 'plus', 'minus', 'times', 'div', 'rem', 'rangeTo',
                    'downTo', 'until', 'step', 'repeat', 'also', 'let', 'run', 'with', 'apply',
                    'takeIf', 'takeUnless', 'require', 'requireNotNull', 'check', 'checkNotNull',
                    'error', 'TODO', 'lazy', 'lazyOf', 'suspend', 'coroutineScope', 'async',
                    'await', 'delay', 'launch', 'job', 'Deferred', 'Flow', 'flowOf', 'flow',
                    'collect', 'collectLatest', 'map', 'filter', 'transform', 'onEach', 'catch',
                    'onCompletion', 'retry', 'retryWhen', 'buffer', 'conflate', 'flowOn',
                    'shareIn', 'stateIn', 'asSharedFlow', 'asStateFlow', 'combine', 'merge',
                    'zip', 'flatMapConcat', 'flatMapMerge', 'flatMapLatest', 'scan', 'fold',
                    'reduce', 'first', 'firstOrNull', 'single', 'singleOrNull', 'toList', 'toSet',
                    'toCollection', 'File', 'readText', 'readLines', 'readBytes', 'writeText',
                    'writeBytes', 'appendText', 'appendBytes', 'forEachLine', 'useLines',
                    'copyTo', 'copyRecursively', 'deleteRecursively', 'walk', 'walkTopDown',
                    'walkBottomUp', 'listFiles', 'list', 'exists', 'isFile', 'isDirectory',
                    'canRead', 'canWrite', 'canExecute', 'length', 'lastModified', 'extension',
                    'name', 'nameWithoutExtension', 'parent', 'parentFile', 'absolutePath',
                    'canonicalPath', 'separator', 'pathSeparator', 'createTempFile', 'createTempDirectory'
                ]
            };

            return allKeywords[language] || [];
        }

        function getSnippets(language) {
            const allSnippets = {
                python: [
                    { prefix: 'if', label: 'if statement', description: 'if condition', body: 'if ${1:condition}:\n    ${2:pass}' },
                    { prefix: 'ifelse', label: 'if-else statement', description: 'if-else condition', body: 'if ${1:condition}:\n    ${2:pass}\nelse:\n    ${3:pass}' },
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}' },
                    { prefix: 'while', label: 'while loop', description: 'while loop', body: 'while ${1:condition}:\n    ${2:pass}' },
                    { prefix: 'def', label: 'function definition', description: 'define function', body: 'def ${1:function_name}(${2:args}):\n    """${3:docstring}"""\n    ${4:pass}\n    return ${5:None}' },
                    { prefix: 'class', label: 'class definition', description: 'define class', body: 'class ${1:ClassName}:\n    """${2:docstring}"""\n    \n    def __init__(self${3:, args}):\n        ${4:pass}' },
                    { prefix: 'try', label: 'try-except', description: 'try-except block', body: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}' },
                    { prefix: 'with', label: 'with statement', description: 'with context manager', body: 'with ${1:resource} as ${2:alias}:\n    ${3:pass}' },
                    { prefix: 'main', label: 'main function', description: 'if __name__ == "__main__"', body: 'if __name__ == "__main__":\n    ${1:main()}' }
                ],
                java: [
                    { prefix: 'main', label: 'main method', description: 'public static void main', body: 'public static void main(String[] args) {\n    ${1:// code}\n}' },
                    { prefix: 'class', label: 'class definition', description: 'class definition', body: 'public class ${1:ClassName} {\n    ${2:// code}\n}' },
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n    ${4:// code}\n}' },
                    { prefix: 'foreach', label: 'for-each loop', description: 'enhanced for loop', body: 'for (${1:Type} ${2:item} : ${3:collection}) {\n    ${4:// code}\n}' },
                    { prefix: 'if', label: 'if statement', description: 'if condition', body: 'if (${1:condition}) {\n    ${2:// code}\n}' },
                    { prefix: 'ifelse', label: 'if-else statement', description: 'if-else condition', body: 'if (${1:condition}) {\n    ${2:// code}\n} else {\n    ${3:// code}\n}' },
                    { prefix: 'try', label: 'try-catch', description: 'try-catch block', body: 'try {\n    ${1:// code}\n} catch (${2:Exception} ${3:e}) {\n    ${4:// code}\n}' },
                    { prefix: 'sysout', label: 'System.out.println', description: 'print statement', body: 'System.out.println(${1:message});' }
                ],
                cpp: [
                    { prefix: 'main', label: 'main function', description: 'int main()', body: 'int main() {\n    ${1:// code}\n    return 0;\n}' },
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n    ${4:// code}\n}' },
                    { prefix: 'if', label: 'if statement', description: 'if condition', body: 'if (${1:condition}) {\n    ${2:// code}\n}' },
                    { prefix: 'ifelse', label: 'if-else statement', description: 'if-else condition', body: 'if (${1:condition}) {\n    ${2:// code}\n} else {\n    ${3:// code}\n}' },
                    { prefix: 'class', label: 'class definition', description: 'class definition', body: 'class ${1:ClassName} {\npublic:\n    ${2:// code}\nprivate:\n    ${3:// code}\n};' },
                    { prefix: 'cout', label: 'std::cout', description: 'output statement', body: 'std::cout << ${1:message} << std::endl;' },
                    { prefix: 'cin', label: 'std::cin', description: 'input statement', body: 'std::cin >> ${1:variable};' }
                ],
                c: [
                    { prefix: 'main', label: 'main function', description: 'int main()', body: 'int main() {\n    ${1:// code}\n    return 0;\n}' },
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n    ${4:// code}\n}' },
                    { prefix: 'if', label: 'if statement', description: 'if condition', body: 'if (${1:condition}) {\n    ${2:// code}\n}' },
                    { prefix: 'printf', label: 'printf', description: 'print statement', body: 'printf("${1:format}\\n"${2:, args});' },
                    { prefix: 'scanf', label: 'scanf', description: 'input statement', body: 'scanf("${1:format}", ${2:&variable});' }
                ],
                rust: [
                    { prefix: 'main', label: 'main function', description: 'fn main()', body: 'fn main() {\n    ${1:// code}\n}' },
                    { prefix: 'fn', label: 'function definition', description: 'define function', body: 'fn ${1:function_name}(${2:args}) -> ${3:ReturnType} {\n    ${4:// code}\n}' },
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for ${1:item} in ${2:iterable} {\n    ${3:// code}\n}' },
                    { prefix: 'if', label: 'if statement', description: 'if condition', body: 'if ${1:condition} {\n    ${2:// code}\n}' },
                    { prefix: 'match', label: 'match expression', description: 'match pattern', body: 'match ${1:value} {\n    ${2:pattern} => ${3:// code},\n    _ => ${4:// code}\n}' },
                    { prefix: 'struct', label: 'struct definition', description: 'define struct', body: 'struct ${1:StructName} {\n    ${2:field}: ${3:Type},\n}' },
                    { prefix: 'impl', label: 'impl block', description: 'implementation block', body: 'impl ${1:Type} {\n    fn ${2:method}(${3:&self}) {\n        ${4:// code}\n    }\n}' }
                ],
                php: [
                    { prefix: 'if', label: 'if statement', description: 'if condition', body: 'if (${1:condition}) {\n    ${2:// code}\n}' },
                    { prefix: 'foreach', label: 'foreach loop', description: 'foreach loop', body: 'foreach (${1:$array} as ${2:$key} => ${3:$value}) {\n    ${4:// code}\n}' },
                    { prefix: 'function', label: 'function definition', description: 'define function', body: 'function ${1:function_name}(${2:$args}) {\n    ${3:// code}\n    return ${4:null};\n}' },
                    { prefix: 'class', label: 'class definition', description: 'define class', body: 'class ${1:ClassName} {\n    ${2:// code}\n}' }
                ],
                r: [
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for (${1:i} in ${2:1:n}) {\n    ${3:# code}\n}' },
                    { prefix: 'if', label: 'if statement', description: 'if condition', body: 'if (${1:condition}) {\n    ${2:# code}\n}' },
                    { prefix: 'function', label: 'function definition', description: 'define function', body: '${1:function_name} <- function(${2:args}) {\n    ${3:# code}\n    return(${4:value})\n}' }
                ],
                ruby: [
                    { prefix: 'def', label: 'method definition', description: 'define method', body: 'def ${1:method_name}${2:(args)}\n    ${3:# code}\nend' },
                    { prefix: 'class', label: 'class definition', description: 'define class', body: 'class ${1:ClassName}\n    ${2:# code}\nend' },
                    { prefix: 'each', label: 'each block', description: 'each iterator', body: '${1:collection}.each do |${2:item}|\n    ${3:# code}\nend' }
                ],
                csharp: [
                    { prefix: 'main', label: 'Main method', description: 'static void Main', body: 'static void Main(string[] args) {\n    ${1:// code}\n}' },
                    { prefix: 'class', label: 'class definition', description: 'class definition', body: 'public class ${1:ClassName} {\n    ${2:// code}\n}' },
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n    ${4:// code}\n}' },
                    { prefix: 'foreach', label: 'foreach loop', description: 'foreach loop', body: 'foreach (${1:var item} in ${2:collection}) {\n    ${3:// code}\n}' },
                    { prefix: 'cw', label: 'Console.WriteLine', description: 'print statement', body: 'Console.WriteLine(${1:message});' }
                ],
                kotlin: [
                    { prefix: 'main', label: 'main function', description: 'fun main()', body: 'fun main() {\n    ${1:// code}\n}' },
                    { prefix: 'fun', label: 'function definition', description: 'define function', body: 'fun ${1:functionName}(${2:args}): ${3:ReturnType} {\n    ${4:// code}\n    return ${5:value}\n}' },
                    { prefix: 'for', label: 'for loop', description: 'for loop', body: 'for (${1:item} in ${2:collection}) {\n    ${3:// code}\n}' },
                    { prefix: 'when', label: 'when expression', description: 'when statement', body: 'when (${1:value}) {\n    ${2:condition} -> ${3:// code}\n    else -> ${4:// code}\n}' },
                    { prefix: 'class', label: 'class definition', description: 'class definition', body: 'class ${1:ClassName}(${2:args}) {\n    ${3:// code}\n}' }
                ]
            };

            return allSnippets[language] || [];
        }

        function extractWords(text, language) {
            const wordPatterns = {
                python: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                javascript: /[a-zA-Z_$][a-zA-Z0-9_$]*/g,
                java: /[a-zA-Z_$][a-zA-Z0-9_$]*/g,
                cpp: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                c: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                rust: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                php: /[a-zA-Z_$][a-zA-Z0-9_$]*/g,
                r: /[a-zA-Z_][a-zA-Z0-9_.]*/g,
                ruby: /[a-zA-Z_][a-zA-Z0-9_?!]*/g,
                csharp: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                kotlin: /[a-zA-Z_][a-zA-Z0-9_]*/g
            };

            const pattern = wordPatterns[language] || /[a-zA-Z_][a-zA-Z0-9_]*/g;
            const words = new Set();
            let match;

            const keywords = getKeywords(language);
            while ((match = pattern.exec(text)) !== null) {
                const word = match[0];
                if (word.length > 1 && !keywords.includes(word)) {
                    words.add(word);
                }
            }

            return Array.from(words);
        }

        function isKeyword(word, language) {
            const keywords = {
                python: [
                    'if',
                    'else',
                    'elif',
                    'for',
                    'while',
                    'def',
                    'class',
                    'import',
                    'from',
                    'as',
                    'return',
                    'try',
                    'except',
                    'finally',
                    'with',
                    'pass',
                    'break',
                    'continue',
                    'and',
                    'or',
                    'not',
                    'in',
                    'is',
                    'None',
                    'True',
                    'False'
                ],
                javascript: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'function',
                    'class',
                    'import',
                    'export',
                    'return',
                    'try',
                    'catch',
                    'finally',
                    'with',
                    'break',
                    'continue',
                    'var',
                    'let',
                    'const',
                    'new',
                    'this',
                    'super',
                    'extends',
                    'static',
                    'async',
                    'await'
                ],
                java: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'class',
                    'public',
                    'private',
                    'protected',
                    'static',
                    'void',
                    'return',
                    'try',
                    'catch',
                    'finally',
                    'import',
                    'package',
                    'extends',
                    'implements',
                    'new',
                    'this',
                    'super'
                ],
                cpp: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'class',
                    'public',
                    'private',
                    'protected',
                    'static',
                    'void',
                    'return',
                    'try',
                    'catch',
                    'include',
                    'using',
                    'namespace',
                    'new',
                    'delete',
                    'this'
                ],
                c: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'return',
                    'include',
                    'define',
                    'typedef',
                    'struct',
                    'enum',
                    'union'
                ],
                rust: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'fn',
                    'let',
                    'mut',
                    'pub',
                    'struct',
                    'enum',
                    'impl',
                    'trait',
                    'use',
                    'mod',
                    'return',
                    'match',
                    'loop',
                    'break',
                    'continue'
                ],
                php: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'function',
                    'class',
                    'public',
                    'private',
                    'protected',
                    'static',
                    'return',
                    'try',
                    'catch',
                    'finally',
                    'include',
                    'require',
                    'use',
                    'namespace',
                    'new',
                    'this'
                ],
                r: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'function',
                    'return',
                    'break',
                    'next',
                    'repeat',
                    'in',
                    'TRUE',
                    'FALSE',
                    'NULL',
                    'NA',
                    'Inf',
                    'NaN'
                ],
                ruby: [
                    'if',
                    'else',
                    'elsif',
                    'end',
                    'for',
                    'while',
                    'until',
                    'def',
                    'class',
                    'module',
                    'return',
                    'break',
                    'next',
                    'redo',
                    'retry',
                    'begin',
                    'rescue',
                    'ensure',
                    'true',
                    'false',
                    'nil',
                    'self',
                    'super'
                ],
                csharp: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'foreach',
                    'class',
                    'public',
                    'private',
                    'protected',
                    'static',
                    'void',
                    'return',
                    'try',
                    'catch',
                    'finally',
                    'using',
                    'namespace',
                    'new',
                    'this',
                    'base',
                    'var',
                    'const',
                    'readonly'
                ],
                kotlin: [
                    'if',
                    'else',
                    'for',
                    'while',
                    'when',
                    'fun',
                    'class',
                    'object',
                    'interface',
                    'public',
                    'private',
                    'protected',
                    'internal',
                    'open',
                    'abstract',
                    'sealed',
                    'data',
                    'enum',
                    'return',
                    'break',
                    'continue',
                    'try',
                    'catch',
                    'finally',
                    'throw',
                    'val',
                    'var',
                    'null',
                    'true',
                    'false',
                    'this',
                    'super'
                ]
            };
            return keywords[language]?.includes(word) || false;
        }

        function getLineComment(language) {
            const comments = {
                python: '#',
                javascript: '//',
                java: '//',
                cpp: '//',
                c: '//',
                rust: '//',
                php: '//',
                r: '#',
                ruby: '#',
                csharp: '//',
                kotlin: '//'
            };
            return comments[language] || '//';
        }

        function getBlockComment(language) {
            const comments = {
                python: null,
                javascript: ['/*', '*/'],
                java: ['/*', '*/'],
                cpp: ['/*', '*/'],
                c: ['/*', '*/'],
                rust: ['/*', '*/'],
                php: ['/*', '*/'],
                r: null,
                ruby: null,
                csharp: ['/*', '*/'],
                kotlin: ['/*', '*/']
            };
            return comments[language] || null;
        }

        function getBrackets(_language) {
            return [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ];
        }

        function getAutoClosingPairs(language) {
            const pairs = [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ];

            if (language === 'python') {
                pairs.push({ open: '"""', close: '"""' });
                pairs.push({ open: "'''", close: "'''" });
            }

            return pairs;
        }

        function getSurroundingPairs(_language) {
            return [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ];
        }

        updateSelectedLanguage(CONFIG.DEFAULT_LANGUAGE);
        updateMonacoTheme();
        updateAutoComplete();

        elements.languageDropdown.querySelectorAll('.select-option').forEach((option) => {
            const optionLanguage = option.dataset.value;
            const optionIconElement = option.querySelector('.language-icon');
            if (optionIconElement && LANGUAGE_CONFIG.icons[optionLanguage]) {
                updateIcon(optionIconElement, LANGUAGE_CONFIG.icons[optionLanguage]);
            }
        });

        let resizeTimer = null;
        const handleResize = () => {
            if (resizeTimer) return;
            resizeTimer = requestAnimationFrame(() => {
                if (codeEditor) {
                    codeEditor.layout();
                }
                resizeTimer = null;
            });
        };
        const cleanupResize = addEventListenerSafe(window, 'resize', handleResize);
        if (cleanupResize) cleanupFunctions.push(cleanupResize);
    });
}

function initSettings() {
    const elements = {
        settingsBtn: document.getElementById('settings-btn'),
        backBtn: document.getElementById('back-btn'),
        fontFamilySelect: document.getElementById('font-family-select'),
        fontSelectButton: document.getElementById('font-select-button'),
        fontSelectDropdown: document.getElementById('font-select-dropdown'),
        fontSelectName: document.getElementById('font-select-name'),
        fontSizeSlider: document.getElementById('font-size-slider'),
        fontSizeDisplay: document.getElementById('font-size-display'),
        themeSelectButton: document.getElementById('theme-select-button'),
        themeSelectDropdown: document.getElementById('theme-select-dropdown'),
        themeSelectName: document.getElementById('theme-select-name'),
        settingsLangSelectButton: document.getElementById('settings-lang-select-button'),
        settingsLangDropdown: document.getElementById('settings-lang-dropdown'),
        settingsLangIcon: document.getElementById('settings-lang-icon'),
        settingsLangName: document.getElementById('settings-lang-name')
    };

    const dropdowns = {
        font: new DropdownManager('font-select-button', 'font-select-dropdown'),
        theme: new DropdownManager('theme-select-button', 'theme-select-dropdown'),
        lang: new DropdownManager('settings-lang-select-button', 'settings-lang-dropdown')
    };

    function closeAllDropdowns() {
        Object.values(dropdowns).forEach((dropdown) => dropdown.close());
    }

    function updateFontSelectDisplay() {
        if (!elements.fontSelectName || !elements.fontFamilySelect) {
            return;
        }

        const selectedValue = elements.fontFamilySelect.value;
        const selectedName = FONT_CONFIG.families[selectedValue] || 'Consolas';
        elements.fontSelectName.textContent = selectedName;
        elements.fontSelectName.style.fontFamily = selectedValue;

        elements.fontSelectDropdown.querySelectorAll('.font-option').forEach((option) => {
            option.classList.toggle('selected', option.dataset.value === selectedValue);
        });
    }

    function updateThemeSelectDisplay() {
        const currentTheme = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
        const themeNames = {
            system: translations[currentLang]?.['system-theme'] || translations.en['system-theme'],
            dark: translations[currentLang]?.['dark-theme'] || translations.en['dark-theme'],
            light: translations[currentLang]?.['light-theme'] || translations.en['light-theme']
        };

        if (elements.themeSelectName) {
            elements.themeSelectName.textContent = themeNames[currentTheme] || themeNames.system;
        }

        elements.themeSelectDropdown.querySelectorAll('.theme-option').forEach((option) => {
            option.classList.toggle('selected', option.dataset.theme === currentTheme);
        });
    }

    function updateSettingsLangDisplay() {
        if (elements.settingsLangIcon) {
            elements.settingsLangIcon.className = `fi ${currentLang === 'ko' ? 'fi-kr' : 'fi-us'}`;
        }
        if (elements.settingsLangName) {
            elements.settingsLangName.textContent = currentLang === 'ko' ? translations.ko['korean'] : translations.en['english'];
        }

        elements.settingsLangDropdown.querySelectorAll('.lang-option').forEach((option) => {
            option.classList.toggle('selected', option.dataset.lang === currentLang);
        });
    }

    function applyThemeFromSettings(themePreference) {
        localStorage.setItem('theme', themePreference);
        applyTheme(themePreference);
        updateThemeSelectDisplay();
    }

    if (elements.fontSelectButton) {
        elements.fontSelectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dropdowns.font.isOpen;
            closeAllDropdowns();
            if (!isActive) {
                dropdowns.font.open();
            }
        });
    }

    elements.fontSelectDropdown.querySelectorAll('.font-option').forEach((option) => {
        option.addEventListener('click', function () {
            const selectedValue = this.dataset.value;
            if (elements.fontFamilySelect) {
                elements.fontFamilySelect.value = selectedValue;
            }
            localStorage.setItem('fontFamily', selectedValue);
            if (codeEditor) {
                codeEditor.updateOptions({ fontFamily: selectedValue });
            }
            updateFontSelectDisplay();
            dropdowns.font.close();
        });
    });

    if (elements.themeSelectButton) {
        elements.themeSelectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dropdowns.theme.isOpen;
            closeAllDropdowns();
            if (!isActive) {
                dropdowns.theme.open();
            }
        });
    }

    elements.themeSelectDropdown.querySelectorAll('.theme-option').forEach((option) => {
        option.addEventListener('click', function () {
            applyThemeFromSettings(this.dataset.theme);
            dropdowns.theme.close();
        });
    });

    if (elements.settingsLangSelectButton) {
        elements.settingsLangSelectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dropdowns.lang.isOpen;
            closeAllDropdowns();
            if (!isActive) {
                dropdowns.lang.open();
            }
        });
    }

    elements.settingsLangDropdown.querySelectorAll('.lang-option').forEach((option) => {
        option.addEventListener('click', function () {
            const selectedLang = this.dataset.lang;
            if (selectedLang !== currentLang) {
                updateLanguage(selectedLang);
                updateSettingsLangDisplay();
                updateThemeSelectDisplay();
            }
            dropdowns.lang.close();
        });
    });

    if (elements.fontSizeSlider && elements.fontSizeDisplay) {
        const savedFontSize = localStorage.getItem('fontSize') || CONFIG.DEFAULT_FONT_SIZE;
        elements.fontSizeSlider.value = savedFontSize;
        elements.fontSizeDisplay.textContent = `${savedFontSize}px`;

        elements.fontSizeSlider.addEventListener('input', function () {
            const fontSize = this.value;
            elements.fontSizeDisplay.textContent = `${fontSize}px`;
            localStorage.setItem('fontSize', fontSize);
            if (codeEditor) {
                codeEditor.updateOptions({ fontSize: parseInt(fontSize) });
            }
        });
    }

    document.addEventListener('click', (e) => {
        const runBtn = document.getElementById('run-btn');
        if (runBtn?.contains(e.target)) {
            return;
        }

        Object.values(dropdowns).forEach((dropdown) => {
            if (!dropdown.button?.contains(e.target) && !dropdown.dropdown?.contains(e.target)) {
                dropdown.close();
            }
        });
    });

    if (elements.fontFamilySelect) {
        elements.fontFamilySelect.value =
            localStorage.getItem('fontFamily') || CONFIG.DEFAULT_FONT_FAMILY;
        updateFontSelectDisplay();
    }

    let settingsMediaQueryList = null;
    if (window.matchMedia) {
        settingsMediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSettingsThemeChange = () => {
            const currentThemePreference = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
            if (currentThemePreference === 'system') {
                applyThemeFromSettings('system');
            }
        };
        if (settingsMediaQueryList.addEventListener) {
            settingsMediaQueryList.addEventListener('change', handleSettingsThemeChange);
            cleanupFunctions.push(() => {
                if (settingsMediaQueryList) {
                    settingsMediaQueryList.removeEventListener('change', handleSettingsThemeChange);
                }
            });
        } else {
            settingsMediaQueryList.addListener(handleSettingsThemeChange);
            cleanupFunctions.push(() => {
                if (settingsMediaQueryList) {
                    settingsMediaQueryList.removeListener(handleSettingsThemeChange);
                }
            });
        }
    }

    updateThemeSelectDisplay();
    updateSettingsLangDisplay();

    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            showPage('settings-page');
            updateSettingsLangDisplay();
        });
    }

    if (elements.backBtn) {
        elements.backBtn.addEventListener('click', () => {
            showPage('compiler-page');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateLanguage(currentLang);
    initSettings();
    initEditor();
});
