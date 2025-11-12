const CONFIG = {
    API_URL: 'http://localhost:3000',
    DEFAULT_LANGUAGE: 'python',
    DEFAULT_THEME: 'system',
    DEFAULT_FONT_FAMILY: "'Consolas', 'Monaco', 'Courier New', monospace",
    DEFAULT_FONT_SIZE: 14,
    WARMUP_INTERVAL: 30000,
    MAX_ERROR_LINES: 20,
    MAX_ERROR_LENGTH: 500,
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
        settings: '설정'
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
        settings: 'Settings'
    }
};

const LANGUAGE_CONFIG = {
    modes: {
        python: 'python',
        javascript: 'javascript',
        java: 'java',
        cpp: 'c_cpp',
        c: 'c_cpp',
        rust: 'rust',
        php: 'php',
        r: 'r',
        ruby: 'ruby',
        csharp: 'csharp',
        kotlin: 'kotlin',
        go: 'golang',
        typescript: 'typescript',
        swift: 'swift',
        perl: 'perl',
        haskell: 'haskell',
        bash: 'sh'
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
        kotlin: 'fun main() {\n    println("Hello, World!")\n}',
        go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
        typescript: 'console.log("Hello, World!");',
        swift: 'print("Hello, World!")',
        perl: 'print "Hello, World!\\n";',
        haskell: 'main = putStrLn "Hello, World!"',
        bash: 'echo "Hello, World!"'
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
        kotlin: 'https://img.icons8.com/color/48/kotlin.png',
        go: 'https://img.icons8.com/color/48/golang.png',
        typescript: 'https://img.icons8.com/color/48/typescript.png',
        swift: 'https://img.icons8.com/color/48/swift.png',
        perl: 'https://img.icons8.com/color/48/perl.png',
        haskell: 'https://img.icons8.com/color/48/haskell.png',
        bash: 'https://img.icons8.com/color/48/bash.png'
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
        kotlin: 'Kotlin',
        go: 'Go',
        typescript: 'TypeScript',
        swift: 'Swift',
        perl: 'Perl',
        haskell: 'Haskell',
        bash: 'Bash'
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
let currentLanguage = CONFIG.DEFAULT_LANGUAGE;
let pendingLanguageChange = null;

const cleanupFunctions = [];

function getTranslation(key) {
    return translations[currentLang]?.[key] || translations.en[key] || '';
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
            element.textContent = translations[lang][key].trim();
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
}

function getSystemTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(themePreference) {
    const actualTheme = themePreference === 'system' ? getSystemTheme() : themePreference;
    document.documentElement.setAttribute('data-theme', actualTheme);
    if (codeEditor && typeof ace !== 'undefined') {
        const aceTheme = actualTheme === 'dark' ? 'monokai' : 'github';
        codeEditor.setTheme(`ace/theme/${aceTheme}`);
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
    if (!element) {
        return;
    }
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
        setTimeout(() => {
            codeEditor.resize();
        }, 100);
    }
}

class ModalManager {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.isVisible = false;
    }

    show() {
        if (this.modal) {
            this.modal.classList.add('show');
            this.isVisible = true;
        }
    }

    hide() {
        if (this.modal) {
            this.modal.classList.remove('show');
            this.isVisible = false;
        }
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
        if (this.button) {
            this.button.classList.add('active');
        }
        if (this.dropdown) {
            this.dropdown.classList.add('show');
        }
        this.isOpen = true;
    }

    close() {
        if (this.button) {
            this.button.classList.remove('active');
        }
        if (this.dropdown) {
            this.dropdown.classList.remove('show');
        }
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
    if (typeof ace === 'undefined') {
        setTimeout(initEditor, 100);
        return;
    }

    if (window._editorInitializing) {
        return;
    }
    window._editorInitializing = true;

    (function () {
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

        if (!elements.codeEditorElement) {
            console.error('Code editor element not found');
            window._editorInitializing = false;
            return;
        }

        const modals = {
            languageChange: new ModalManager('language-change-modal'),
            clearConfirm: new ModalManager('clear-confirm-modal')
        };

        const dropdowns = {
            language: new DropdownManager('language-select-button', 'language-dropdown')
        };

        const savedTheme = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
        applyTheme(savedTheme);

        if (window.matchMedia) {
            const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
            const handleThemeChange = () => {
                const currentThemePreference =
                    localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
                if (currentThemePreference === 'system') {
                    applyTheme('system');
                }
            };
            if (mediaQueryList.addEventListener) {
                mediaQueryList.addEventListener('change', handleThemeChange);
                cleanupFunctions.push(() => {
                    mediaQueryList.removeEventListener('change', handleThemeChange);
                });
            } else {
                mediaQueryList.addListener(handleThemeChange);
                cleanupFunctions.push(() => {
                    mediaQueryList.removeListener(handleThemeChange);
                });
            }
        }

        updateLanguage(currentLang);

        const savedFontFamily = localStorage.getItem('fontFamily') || CONFIG.DEFAULT_FONT_FAMILY;
        const savedFontSize = parseInt(
            localStorage.getItem('fontSize') || CONFIG.DEFAULT_FONT_SIZE
        );
        const actualEditorTheme = savedTheme === 'system' ? getSystemTheme() : savedTheme;
        const aceTheme = actualEditorTheme === 'dark' ? 'monokai' : 'github';

        if (elements.languageSelect) {
            elements.languageSelect.value = CONFIG.DEFAULT_LANGUAGE;
        }
        currentLanguage = CONFIG.DEFAULT_LANGUAGE;

        if (codeEditor) {
            try {
                codeEditor.destroy();
            } catch (e) {
                console.warn('Error destroying old editor:', e);
            }
            codeEditor = null;
        }

        const initialTemplate =
            LANGUAGE_CONFIG.templates[CONFIG.DEFAULT_LANGUAGE] || 'print("Hello, World!")';
        let savedInitialCode = null;
        try {
            savedInitialCode = localStorage.getItem(`code_${CONFIG.DEFAULT_LANGUAGE}`);
        } catch (e) {
            console.warn('Failed to load saved code:', e);
        }
        const initialValue =
            savedInitialCode && savedInitialCode.trim() ? savedInitialCode : initialTemplate;

        if (!elements.codeEditorElement || !elements.codeEditorElement.parentElement) {
            console.error('Editor container not ready');
            setTimeout(() => initEditor(), 200);
            return;
        }

        try {
            const containerRect = elements.codeEditorElement.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) {
                console.warn('Editor container has zero size, retrying...');
                window._editorInitializing = false;
                setTimeout(() => initEditor(), 200);
                return;
            }

            if (codeEditor) {
                try {
                    codeEditor.destroy();
                } catch (e) {
                    console.warn('Error destroying old editor:', e);
                }
                codeEditor = null;
            }

            window.codeEditor = ace.edit(elements.codeEditorElement);
            codeEditor = window.codeEditor;

            codeEditor.setOptions({
                fontSize: savedFontSize,
                fontFamily: savedFontFamily,
                showPrintMargin: false,
                displayIndentGuides: true,
                showFoldWidgets: false,
                highlightActiveLine: true,
                showInvisibles: false,
                behavioursEnabled: true,
                wrapBehavioursEnabled: true,
                autoScrollEditorIntoView: true,
                animatedScroll: false,
                vScrollBarAlwaysVisible: false,
                hScrollBarAlwaysVisible: false,
                highlightSelectedWord: true,
                selectionStyle: 'text',
                fadeFoldWidgets: true,
                useWorker: false,
                showLineNumbers: true,
                tabSize: 4,
                useSoftTabs: true,
                wrap: true,
                indentedSoftWrap: false,
                foldStyle: 'markbegin',
                readOnly: false
            });

            codeEditor.setTheme(`ace/theme/${aceTheme}`);

            const mode = LANGUAGE_CONFIG.modes[CONFIG.DEFAULT_LANGUAGE] || 'text';
            codeEditor.session.setMode(`ace/mode/${mode}`);

            codeEditor.resize();

            requestAnimationFrame(() => {
                if (!codeEditor) {
                    return;
                }

                const valueToSet =
                    initialValue && initialValue.trim()
                        ? initialValue
                        : LANGUAGE_CONFIG.templates[CONFIG.DEFAULT_LANGUAGE] ||
                          'print("Hello, World!")';

                codeEditor.setValue(valueToSet);
                codeEditor.clearSelection();
                codeEditor.moveCursorTo(0, 0);

                codeEditor.resize();

                requestAnimationFrame(() => {
                    if (codeEditor) {
                        codeEditor.resize();
                    }
                });

                setTimeout(() => {
                    if (codeEditor) {
                        try {
                            codeEditor.focus();
                            setupEditorCommands();
                        } catch (e) {
                            console.warn('Failed to focus editor:', e);
                        }
                    }
                }, 100);
            });

            const resizeEditor = () => {
                if (codeEditor) {
                    codeEditor.resize();
                }
            };

            window.addEventListener('resize', resizeEditor);
            cleanupFunctions.push(() => {
                window.removeEventListener('resize', resizeEditor);
            });
        } catch (error) {
            console.error('Failed to create Ace Editor:', error);
            window._editorInitializing = false;
            setTimeout(() => initEditor(), 500);
            return;
        }

        const setupEditorCommands = () => {
            if (codeEditor && codeEditor.commands) {
                try {
                    codeEditor.commands.addCommand({
                        name: 'runCode',
                        bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
                        exec: () => {
                            if (codeEditor && getEditorValue().trim()) {
                                elements.runButton?.click();
                            } else {
                                if (elements.consoleOutput) {
                                    elements.consoleOutput.innerHTML = `<p class="text-muted">${getTranslation('no-code-error')}</p>`;
                                }
                            }
                        }
                    });

                    codeEditor.commands.addCommand({
                        name: 'clearCode',
                        bindKey: { win: 'Ctrl-K', mac: 'Cmd-K' },
                        exec: () => {
                            if (
                                codeEditor &&
                                getEditorValue().trim() &&
                                getEditorValue() !== LANGUAGE_CONFIG.templates[currentLanguage]
                            ) {
                                modals.clearConfirm.show();
                            }
                        }
                    });
                } catch (e) {
                    console.warn('Failed to add editor commands:', e);
                }
            }
        };

        function getEditorValue() {
            if (!codeEditor) {
                return '';
            }
            try {
                return codeEditor.getValue() || '';
            } catch (e) {
                console.error('Error getting editor value:', e);
                return '';
            }
        }

        function setEditorValue(value) {
            if (!codeEditor) {
                return;
            }
            codeEditor.setValue(value || '');
            codeEditor.clearSelection();
            codeEditor.moveCursorTo(0, 0);
            codeEditor.resize();
            saveCodeToStorage();
        }

        function saveCodeToStorage() {
            if (!codeEditor) {
                return;
            }
            const code = getEditorValue();
            const language = elements.languageSelect?.value || currentLanguage;
            if (code && code.trim()) {
                try {
                    localStorage.setItem(`code_${language}`, code);
                } catch (e) {
                    console.error('Failed to save code:', e);
                }
            }
        }

        const saveCodeToStorageDebounced = debounce(saveCodeToStorage, 300);
        cleanupFunctions.push(() => {
            saveCodeToStorageDebounced.flush();
            saveCodeToStorageDebounced.cancel();
        });

        function loadCodeFromStorage(language) {
            const lang = language || currentLanguage;
            try {
                const savedCode = localStorage.getItem(`code_${lang}`);
                if (savedCode && savedCode.trim()) {
                    return savedCode;
                }
            } catch (e) {
                console.error('Failed to load code:', e);
            }
            return LANGUAGE_CONFIG.templates[lang] || '';
        }

        function updateSelectedLanguage(language, skipSave = false) {
            if (!language) {
                console.warn('Invalid language');
                return;
            }

            try {
                if (elements.languageSelect) {
                    elements.languageSelect.value = language;
                }
                currentLanguage = language;

                const iconUrl = LANGUAGE_CONFIG.icons[language];
                if (iconUrl && elements.languageIcon) {
                    updateIcon(elements.languageIcon, iconUrl);
                }
                if (elements.languageName) {
                    elements.languageName.textContent = LANGUAGE_CONFIG.names[language] || language;
                }

                if (elements.languageDropdown) {
                    elements.languageDropdown
                        .querySelectorAll('.select-option')
                        .forEach((option) => {
                            const optionLanguage = option.dataset.value;
                            if (optionLanguage) {
                                option.classList.toggle('selected', optionLanguage === language);
                                const optionIconElement = option.querySelector('.language-icon');
                                if (optionIconElement && LANGUAGE_CONFIG.icons[optionLanguage]) {
                                    updateIcon(
                                        optionIconElement,
                                        LANGUAGE_CONFIG.icons[optionLanguage]
                                    );
                                }
                            }
                        });
                }

                if (codeEditor) {
                    if (!skipSave) {
                        saveCodeToStorage();
                    }

                    if (!skipSave) {
                        const mode = LANGUAGE_CONFIG.modes[language] || 'text';
                        if (codeEditor.session) {
                            const currentMode = codeEditor.session.getMode().$id || '';
                            const newMode = `ace/mode/${mode}`;
                            if (currentMode !== newMode) {
                                codeEditor.session.setMode(newMode);
                                requestAnimationFrame(() => {
                                    if (codeEditor) {
                                        codeEditor.resize();
                                    }
                                });
                            }
                        }
                    }

                    if (!skipSave) {
                        const savedCode = loadCodeFromStorage(language);
                        const template = LANGUAGE_CONFIG.templates[language] || '';
                        const finalCode = savedCode && savedCode.trim() ? savedCode : template;
                        const currentValue = getEditorValue();

                        if (
                            !currentValue.trim() ||
                            currentValue === LANGUAGE_CONFIG.templates[currentLanguage]
                        ) {
                            if (finalCode && currentValue !== finalCode) {
                                codeEditor.setValue(finalCode);
                                codeEditor.clearSelection();
                                codeEditor.moveCursorTo(0, 0);
                                codeEditor.resize();
                            } else if (!currentValue.trim() && template) {
                                codeEditor.setValue(template);
                                codeEditor.clearSelection();
                                codeEditor.moveCursorTo(0, 0);
                                codeEditor.resize();
                            }
                        }
                    }

                    if (!skipSave) {
                        saveCodeToStorage();
                    }
                }

                resetConsoleOutput();
            } catch (error) {
                console.error('Error updating language:', error);
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
            const selectedLanguage = elements.languageSelect?.value || currentLanguage;
            const template = LANGUAGE_CONFIG.templates[selectedLanguage] || '';
            setEditorValue(template);
            try {
                localStorage.removeItem(`code_${selectedLanguage}`);
            } catch (e) {
                console.error('Failed to remove code:', e);
            }
            clearConsole();
            resetConsoleOutput();
            modals.clearConfirm.hide();
        }

        function clearConsole() {
            if (elements.consoleOutput) {
                elements.consoleOutput.innerHTML = '';
            }
            if (elements.consoleInput) {
                elements.consoleInput.value = '';
            }
        }

        function resetConsoleOutput() {
            if (elements.consoleOutput) {
                elements.consoleOutput.innerHTML = `<p class="text-muted">${getTranslation('output-placeholder').trim()}</p>`;
            }
        }

        function appendToConsole(text, type = 'output') {
            if (!elements.consoleOutput) {
                return;
            }

            const line = document.createElement('div');
            line.className = `console-line console-${type}`;
            line.textContent = text;
            elements.consoleOutput.appendChild(line);
            elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
        }

        async function executeCode() {
            if (!codeEditor || !window.codeEditor) {
                codeEditor = window.codeEditor;

                if (!codeEditor) {
                    console.warn('Editor not ready, waiting...');
                    let retries = 0;
                    const maxRetries = 20;
                    while (!codeEditor && !window.codeEditor && retries < maxRetries) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                        codeEditor = window.codeEditor;
                        retries++;
                    }
                    if (!codeEditor && !window.codeEditor) {
                        if (elements.consoleOutput) {
                            elements.consoleOutput.innerHTML = `<p class="text-muted">${getTranslation('connection-error')}: 에디터가 준비되지 않았습니다. 페이지를 새로고침해주세요.</p>`;
                        }
                        return;
                    }
                    if (!codeEditor && window.codeEditor) {
                        codeEditor = window.codeEditor;
                    }
                }
            }

            const code = getEditorValue();
            const language = elements.languageSelect?.value || currentLanguage;
            const input = elements.consoleInput?.value || '';

            if (!code || !code.trim()) {
                if (elements.consoleOutput) {
                    elements.consoleOutput.innerHTML = `<p class="text-muted">${getTranslation('no-code-error')}</p>`;
                }
                return;
            }

            if (!elements.runButton || !elements.consoleOutput) {
                console.warn('Required elements not found');
                return;
            }

            saveCodeToStorage();

            const inputValue = input;
            if (elements.consoleInput) {
                elements.consoleInput.value = '';
                elements.consoleInput.disabled = true;
            }

            elements.runButton.disabled = true;
            elements.runButton.textContent = getTranslation('running');

            if (elements.consoleOutput) {
                elements.consoleOutput.innerHTML = '';
            }

            if (inputValue && inputValue.trim()) {
                appendToConsole(inputValue, 'input');
            }

            try {
                const response = await fetch(`${CONFIG.API_URL}/api/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, language, input })
                });

                if (!response.ok) {
                    let errorMessage = getTranslation('request-error');
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

                const data = await response.json();
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
                        .filter(
                            (line) =>
                                !CONFIG.DEBUG_PATTERNS.some((pattern) => pattern.test(line.trim()))
                        )
                        .map((line) => line.replace(/[ \t]+$/, ''))
                        .join('\n');
                    const collapsed = filtered
                        .replace(/\n{3,}/g, '\n\n')
                        .replace(/[ \t]+\n/g, '\n')
                        .trim();
                    const pre = document.createElement('pre');
                    pre.textContent = collapsed;
                    if (elements.consoleOutput) {
                        elements.consoleOutput.appendChild(pre);
                        elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
                    }
                }

                if (hasError) {
                    const normalizedErr = data.error.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    let collapsedErr = normalizedErr
                        .split('\n')
                        .map((line) => line.replace(/[ \t]+$/, ''))
                        .join('\n')
                        .replace(/\n{3,}/g, '\n\n')
                        .replace(/[ \t]+\n/g, '\n')
                        .trim();

                    const lines = collapsedErr.split('\n');
                    if (lines.length > CONFIG.MAX_ERROR_LINES) {
                        const moreMsg = getTranslation('more-error-messages');
                        collapsedErr =
                            lines.slice(0, CONFIG.MAX_ERROR_LINES).join('\n') + '\n' + moreMsg;
                    }
                    if (collapsedErr.length > CONFIG.MAX_ERROR_LENGTH) {
                        collapsedErr = collapsedErr.substring(0, CONFIG.MAX_ERROR_LENGTH) + '...';
                    }

                    const pre = document.createElement('pre');
                    pre.textContent = collapsedErr;
                    pre.style.color =
                        getComputedStyle(document.documentElement)
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
                    appendToConsole(getTranslation('no-output'), 'info');
                }

                if (elements.consoleInput) {
                    elements.consoleInput.disabled = false;
                    elements.consoleInput.focus();
                }
            } catch (error) {
                console.error('Execution error:', error);
                if (elements.consoleOutput) {
                    let userMessage = getTranslation('connection-error');

                    if (error.message) {
                        const msg = error.message.toLowerCase();
                        if (msg.includes('failed to fetch') || msg.includes('network')) {
                            userMessage = getTranslation('cannot-connect-server');
                        } else if (msg.includes('timeout')) {
                            userMessage = getTranslation('request-timeout');
                        } else if (msg.includes('400')) {
                            userMessage = getTranslation('bad-request');
                        } else if (msg.includes('500')) {
                            userMessage = getTranslation('server-error');
                        } else if (msg.includes('parse')) {
                            userMessage = getTranslation('cannot-process-response');
                        } else {
                            const match = error.message.match(/HTTP \d+: (.+)/);
                            if (match && match[1]) {
                                userMessage = match[1];
                            }
                        }
                    }

                    appendToConsole(userMessage, 'error');
                    appendToConsole(getTranslation('check-backend'), 'info');
                }
            } finally {
                if (elements.runButton) {
                    elements.runButton.disabled = false;
                    elements.runButton.textContent = getTranslation('run') || 'Run';
                }
                if (elements.consoleInput) {
                    elements.consoleInput.disabled = false;
                }
            }
        }

        if (codeEditor && codeEditor.session) {
            codeEditor.session.on('change', () => {
                saveCodeToStorageDebounced();
            });
        }

        if (elements.languageSelectButton) {
            elements.languageSelectButton.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdowns.language.toggle();
            });
        }

        if (elements.languageDropdown) {
            elements.languageDropdown.querySelectorAll('.select-option').forEach((option) => {
                option.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const selectedLanguage = this.dataset.value;
                    if (!selectedLanguage) {
                        return;
                    }

                    const currentLangValue = elements.languageSelect?.value || currentLanguage;

                    if (currentLangValue === selectedLanguage) {
                        dropdowns.language.close();
                        return;
                    }

                    const currentCode = getEditorValue();
                    if (!currentCode || !currentCode.trim()) {
                        updateSelectedLanguage(selectedLanguage);
                        dropdowns.language.close();
                    } else {
                        pendingLanguageChange = selectedLanguage;
                        modals.languageChange.show();
                    }
                });
            });
        }

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

        if (elements.languageSelect) {
            elements.languageSelect.addEventListener('change', () => {
                const lang = elements.languageSelect.value;
                if (lang) {
                    updateSelectedLanguage(lang);
                }
            });
        }

        if (elements.runButton) {
            elements.runButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (elements.runButton.disabled) {
                    return;
                }
                await executeCode();
            });
        }

        if (codeEditor) {
            setupEditorCommands();
        } else {
            setTimeout(() => {
                setupEditorCommands();
            }, 500);
        }

        if (elements.clearButton) {
            elements.clearButton.addEventListener('click', () => {
                modals.clearConfirm.show();
            });
        }

        if (elements.clearOutputButton) {
            elements.clearOutputButton.addEventListener('click', () => {
                clearConsole();
                resetConsoleOutput();
            });
        }

        document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
            confirmLanguageChange();
        });

        document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
            modals.languageChange.hide();
            pendingLanguageChange = null;
        });

        document.getElementById('clear-modal-confirm-btn')?.addEventListener('click', confirmClear);
        document.getElementById('clear-modal-cancel-btn')?.addEventListener('click', () => {
            modals.clearConfirm.hide();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modals.languageChange.hide();
                modals.clearConfirm.hide();
                pendingLanguageChange = null;
            }
        });

        window.addEventListener('focus', () => {
            const editor = codeEditor || window.codeEditor;
            if (editor) {
                try {
                    editor.setReadOnly(false);
                    editor.resize();
                    const currentValue = editor.getValue();
                    if (currentValue) {
                        editor.renderer.updateFull();
                    }
                    editor.focus();
                } catch (e) {
                    console.warn('Error restoring editor on focus:', e);
                }
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const editor = codeEditor || window.codeEditor;
                if (editor) {
                    setTimeout(() => {
                        try {
                            editor.setReadOnly(false);
                            editor.resize();
                            const currentValue = editor.getValue();
                            if (currentValue) {
                                editor.renderer.updateFull();
                            }
                        } catch (e) {
                            console.warn('Error restoring editor on visibility change:', e);
                        }
                    }, 100);
                }
            }
        });

        setTimeout(() => {
            if (codeEditor) {
                const currentValue = getEditorValue();

                if (!currentValue || !currentValue.trim()) {
                    const template =
                        LANGUAGE_CONFIG.templates[CONFIG.DEFAULT_LANGUAGE] ||
                        'print("Hello, World!")';
                    const savedCode = localStorage.getItem(`code_${CONFIG.DEFAULT_LANGUAGE}`);
                    const finalValue = savedCode && savedCode.trim() ? savedCode : template;
                    if (finalValue && finalValue.trim()) {
                        codeEditor.setValue(finalValue);
                        codeEditor.clearSelection();
                        codeEditor.moveCursorTo(0, 0);
                        codeEditor.resize();
                    }
                } else {
                    codeEditor.resize();
                }
            }

            const lang = CONFIG.DEFAULT_LANGUAGE;
            if (elements.languageSelect) {
                elements.languageSelect.value = lang;
            }
            currentLanguage = lang;

            const iconUrl = LANGUAGE_CONFIG.icons[lang];
            if (iconUrl && elements.languageIcon) {
                updateIcon(elements.languageIcon, iconUrl);
            }
            if (elements.languageName) {
                elements.languageName.textContent = LANGUAGE_CONFIG.names[lang] || lang;
            }

            if (elements.languageDropdown) {
                elements.languageDropdown.querySelectorAll('.select-option').forEach((option) => {
                    const optionLanguage = option.dataset.value;
                    if (optionLanguage) {
                        option.classList.toggle('selected', optionLanguage === lang);
                        const optionIconElement = option.querySelector('.language-icon');
                        if (optionIconElement && LANGUAGE_CONFIG.icons[optionLanguage]) {
                            updateIcon(optionIconElement, LANGUAGE_CONFIG.icons[optionLanguage]);
                        }
                    }
                });
            }

            resetConsoleOutput();

            window._editorInitializing = false;
            window._editorReady = true;
        }, 300);
    })();
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

        if (elements.fontSelectDropdown) {
            elements.fontSelectDropdown.querySelectorAll('.font-option').forEach((option) => {
                option.classList.toggle('selected', option.dataset.value === selectedValue);
            });
        }
    }

    function updateThemeSelectDisplay() {
        const currentTheme = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
        const themeNames = {
            system: getTranslation('system-theme'),
            dark: getTranslation('dark-theme'),
            light: getTranslation('light-theme')
        };

        if (elements.themeSelectName) {
            elements.themeSelectName.textContent = themeNames[currentTheme] || themeNames.system;
        }

        if (elements.themeSelectDropdown) {
            elements.themeSelectDropdown.querySelectorAll('.theme-option').forEach((option) => {
                option.classList.toggle('selected', option.dataset.theme === currentTheme);
            });
        }
    }

    function updateSettingsLangDisplay() {
        if (elements.settingsLangIcon) {
            elements.settingsLangIcon.className = `fi ${currentLang === 'ko' ? 'fi-kr' : 'fi-us'}`;
        }
        if (elements.settingsLangName) {
            elements.settingsLangName.textContent =
                currentLang === 'ko' ? getTranslation('korean') : getTranslation('english');
        }

        if (elements.settingsLangDropdown) {
            elements.settingsLangDropdown.querySelectorAll('.lang-option').forEach((option) => {
                option.classList.toggle('selected', option.dataset.lang === currentLang);
            });
        }
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

    if (elements.fontSelectDropdown) {
        elements.fontSelectDropdown.querySelectorAll('.font-option').forEach((option) => {
            option.addEventListener('click', function () {
                const selectedValue = this.dataset.value;
                if (elements.fontFamilySelect) {
                    elements.fontFamilySelect.value = selectedValue;
                }
                localStorage.setItem('fontFamily', selectedValue);
                if (codeEditor) {
                    codeEditor.setOptions({ fontFamily: selectedValue });
                }
                updateFontSelectDisplay();
                dropdowns.font.close();
            });
        });
    }

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

    if (elements.themeSelectDropdown) {
        elements.themeSelectDropdown.querySelectorAll('.theme-option').forEach((option) => {
            option.addEventListener('click', function () {
                applyThemeFromSettings(this.dataset.theme);
                dropdowns.theme.close();
            });
        });
    }

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

    if (elements.settingsLangDropdown) {
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
    }

    if (elements.fontSizeSlider && elements.fontSizeDisplay) {
        const savedFontSize = localStorage.getItem('fontSize') || CONFIG.DEFAULT_FONT_SIZE;
        elements.fontSizeSlider.value = savedFontSize;
        elements.fontSizeDisplay.textContent = `${savedFontSize}px`;

        elements.fontSizeSlider.addEventListener('input', function () {
            const fontSize = this.value;
            elements.fontSizeDisplay.textContent = `${fontSize}px`;
            localStorage.setItem('fontSize', fontSize);
            if (codeEditor) {
                codeEditor.setOptions({ fontSize: parseInt(fontSize) });
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

    if (window.matchMedia) {
        const settingsMediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSettingsThemeChange = () => {
            const currentThemePreference = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
            if (currentThemePreference === 'system') {
                applyThemeFromSettings('system');
            }
        };
        if (settingsMediaQueryList.addEventListener) {
            settingsMediaQueryList.addEventListener('change', handleSettingsThemeChange);
            cleanupFunctions.push(() => {
                settingsMediaQueryList.removeEventListener('change', handleSettingsThemeChange);
            });
        } else {
            settingsMediaQueryList.addListener(handleSettingsThemeChange);
            cleanupFunctions.push(() => {
                settingsMediaQueryList.removeListener(handleSettingsThemeChange);
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

function cleanup() {
    cleanupFunctions.forEach((fn) => {
        try {
            fn();
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    });
    cleanupFunctions.length = 0;
    if (codeEditor) {
        try {
            codeEditor.destroy();
            codeEditor = null;
        } catch (error) {
            console.error('Editor destroy error:', error);
        }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', cleanup);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (codeEditor || window.codeEditor) {
                const editor = codeEditor || window.codeEditor;
                if (editor) {
                    setTimeout(() => {
                        try {
                            editor.resize();
                            const currentValue = editor.getValue();
                            if (currentValue) {
                                editor.renderer.updateFull();
                            }
                        } catch (e) {
                            console.warn('Error resizing editor on visibility change:', e);
                        }
                    }, 100);
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateLanguage(currentLang);
    initSettings();
    initEditor();
});
