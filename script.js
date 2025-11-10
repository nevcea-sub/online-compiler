const CONFIG = {
    API_URL: 'http://localhost:3000',
    DEFAULT_LANGUAGE: 'python',
    DEFAULT_THEME: 'system',
    DEFAULT_FONT_FAMILY: "'Consolas', 'Monaco', 'Courier New', monospace",
    DEFAULT_FONT_SIZE: 14,
    WARMUP_INTERVAL: 30000
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
        'clear-confirm-message': '코드를 초기화하면 현재 작성한 코드가 모두 삭제되고 기본 템플릿으로 교체됩니다.',
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
        'copy-output': '출력 복사',
        copied: '복사됨!',
        'code-saved': '코드가 자동 저장되었습니다.',
        shortcuts: '단축키',
        'run-code': '코드 실행',
        'clear-code': '코드 초기화',
        'toggle-comment': '주석 토글',
        'settings-title': '설정',
        back: '← 뒤로',
        'language-settings': '언어 설정',
        'interface-language': '인터페이스 언어:',
        'editor-settings': '에디터 설정',
        'font-family': '폰트:',
        'font-size': '폰트 크기:',
        'theme-settings': '테마 설정',
        theme: '테마:',
        'system-theme': '시스템 기본값',
        'dark-theme': '다크 모드',
        'light-theme': '라이트 모드'
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
        'language-change-message': 'Changing the language will replace the current code with the default template.',
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
        'copy-output': 'Copy Output',
        copied: 'Copied!',
        'code-saved': 'Code auto-saved.',
        shortcuts: 'Shortcuts',
        'run-code': 'Run Code',
        'clear-code': 'Clear Code',
        'toggle-comment': 'Toggle Comment',
        'settings-title': 'Settings',
        back: '← Back',
        'language-settings': 'Language Settings',
        'interface-language': 'Interface Language:',
        'editor-settings': 'Editor Settings',
        'font-family': 'Font:',
        'font-size': 'Font Size:',
        'theme-settings': 'Theme Settings',
        theme: 'Theme:',
        'system-theme': 'System Default',
        'dark-theme': 'Dark Mode',
        'light-theme': 'Light Mode'
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
        php: 'php'
    },
    templates: {
        python: 'print("Hello, World!")',
        javascript: 'console.log("Hello, World!");',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
        c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
        rust: 'fn main() {\n    println!("Hello, World!");\n}',
        php: '<?php\n\necho "Hello, World!\\n";\n?>'
    },
    icons: {
        python: 'https://img.icons8.com/color/48/000000/python.png',
        javascript: 'https://img.icons8.com/color/48/000000/javascript.png',
        java: 'https://img.icons8.com/color/48/000000/java-coffee-cup-logo.png',
        cpp: 'https://img.icons8.com/color/48/000000/c-plus-plus-logo.png',
        c: 'https://img.icons8.com/color/48/000000/c-programming.png',
        rust: 'https://img.icons8.com/color/48/000000/rust.png',
        php: 'https://img.icons8.com/color/48/000000/php.png'
    },
    names: {
        python: 'Python',
        javascript: 'JavaScript',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        rust: 'Rust',
        php: 'PHP'
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
        "'PT Mono', 'Consolas', monospace": 'PT Mono'
    }
};

let currentLang = localStorage.getItem('language') || 'ko';
let codeEditor = null;

function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang]?.[key]) {
            element.textContent = translations[lang][key];
        }
    });

    document.title = translations[lang]['title'];

    const langIcon = document.getElementById('lang-icon');
    if (langIcon) {
        langIcon.className = `fi ${lang === 'ko' ? 'fi-kr' : 'fi-us'}`;
    }

    const langName = document.getElementById('lang-name');
    if (langName) {
        langName.textContent = lang === 'ko' ? '한국어' : 'English';
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                const currentThemePreference = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
                if (currentThemePreference === 'system') {
                    applyTheme('system');
                }
            });
        }

        updateLanguage(currentLang);

        const savedFontFamily = localStorage.getItem('fontFamily') || CONFIG.DEFAULT_FONT_FAMILY;
        const savedFontSize = parseInt(localStorage.getItem('fontSize') || CONFIG.DEFAULT_FONT_SIZE);
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
            suggestOnTriggerCharacters: true,
            quickSuggestions: { other: true, comments: true, strings: true },
            acceptSuggestionOnEnter: 'on',
            acceptSuggestionOnCommitCharacter: true,
            snippetSuggestions: 'top',
            tabCompletion: 'on',
            wordBasedSuggestions: 'allDocuments',
            parameterHints: { enabled: true, cycle: true },
            formatOnPaste: true,
            formatOnType: true,
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

            elements.output.innerHTML = `<p class="text-muted">${translations[currentLang]['output-placeholder']}</p>`;
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
            elements.output.innerHTML = `<p class="text-muted">${translations[currentLang]['output-placeholder']}</p>`;
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
            if (!elements.languageSelectButton?.contains(e.target) && !elements.languageDropdown?.contains(e.target)) {
                dropdowns.language.close();
            }
        });

        elements.languageSelect.addEventListener('change', () => {
            updateSelectedLanguage(elements.languageSelect.value);
        });

        elements.clearButton.addEventListener('click', () => {
            modals.clearConfirm.show();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modals.languageChange.hide();
                modals.clearConfirm.hide();
            }
        });

        let abortController = null;

        async function executeCode() {
            const code = getEditorValue();
            const language = elements.languageSelect.value;

            if (!code.trim()) {
                elements.output.innerHTML = `<p class="text-muted">${translations[currentLang]['no-code-error']}</p>`;
                return;
            }

            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();

            saveCodeToStorage();

            elements.runButton.disabled = true;
            elements.runButton.textContent = translations[currentLang]['running'] || '실행 중...';
            elements.output.innerHTML = `<p class="text-muted">${translations[currentLang]['executing'] || '코드를 실행하고 있습니다...'}</p>`;

            try {
                const response = await fetch(`${CONFIG.API_URL}/api/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, language, input: '' }),
                    signal: abortController.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const hasOutput = data.output?.trim().length > 0;
                const hasError = data.error?.trim().length > 0;

                let outputHtml = '';
                if (hasError && !hasOutput) {
                    outputHtml = `
                        <div class="output-error">
                            <p><strong>${translations[currentLang]['error'] || '오류'}:</strong></p>
                            <pre id="error-text">${escapeHtml(data.error)}</pre>
                        </div>
                    `;
                } else {
                    if (hasOutput) {
                        outputHtml += `
                            <div class="output-success">
                                <p><strong>${translations[currentLang]['output'] || '출력'}:</strong></p>
                                <pre id="output-text">${escapeHtml(data.output)}</pre>
                            </div>
                        `;
                    }
                    if (hasError) {
                        outputHtml += `
                            <div class="output-error">
                                <p><strong>${translations[currentLang]['error'] || '오류'}:</strong></p>
                                <pre id="error-text">${escapeHtml(data.error)}</pre>
                            </div>
                        `;
                    }
                    if (data.executionTime !== undefined) {
                        outputHtml += `<p class="text-muted">${translations[currentLang]['execution-time'] || '실행 시간'}: ${data.executionTime}ms</p>`;
                    }
                }

                elements.output.innerHTML =
                    outputHtml ||
                    `<p class="text-muted">${translations[currentLang]['no-output'] || '출력이 없습니다.'}</p>`;

                const copyBtn = document.getElementById('copy-output-btn');
                if (copyBtn) {
                    const hasContent = hasOutput || hasError;
                    copyBtn.style.display = hasContent ? 'flex' : 'none';
                    if (hasContent) {
                        copyBtn.onclick = () => {
                            const outputText =
                                elements.output.querySelector('#output-text') ||
                                elements.output.querySelector('#error-text');
                            if (outputText) {
                                navigator.clipboard.writeText(outputText.textContent).then(() => {
                                    const originalText = copyBtn.querySelector('span:last-child').textContent;
                                    copyBtn.querySelector('span:last-child').textContent =
                                        translations[currentLang]['copied'] || 'Copied!';
                                    setTimeout(() => {
                                        copyBtn.querySelector('span:last-child').textContent = originalText;
                                    }, 2000);
                                });
                            }
                        };
                    }
                }

                const outputElement =
                    elements.output.querySelector('#output-text') || elements.output.querySelector('#error-text');
                if (outputElement) {
                    setTimeout(() => {
                        outputElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }
                elements.output.innerHTML = `
                    <div class="output-error">
                        <p><strong>${translations[currentLang]['connection-error'] || '연결 오류'}:</strong></p>
                        <p>${escapeHtml(error.message)}</p>
                        <p class="text-muted">${translations[currentLang]['check-backend'] || '백엔드 서버가 실행 중인지 확인해주세요.'}</p>
                    </div>
                `;
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
            if (getEditorValue().trim() && getEditorValue() !== LANGUAGE_CONFIG.templates[currentLanguage]) {
                modals.clearConfirm.show();
            }
        });

        codeEditor.onDidChangeModelContent(() => {
            saveCodeToStorage();
            updateAutoComplete();
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
                    provideCompletionItems: function (model, position) {
                        const text = model.getValue();
                        const words = extractWords(text, language);
                        const wordAtPosition = model.getWordUntilPosition(position);
                        const currentWord = wordAtPosition.word;

                        if (!currentWord || currentWord.length < 1) {
                            return { suggestions: [] };
                        }

                        const suggestions = words
                            .filter(word =>
                                word.toLowerCase().startsWith(currentWord.toLowerCase()) &&
                                word !== currentWord &&
                                word.length > 1
                            )
                            .slice(0, 50)
                            .map(word => ({
                                label: word,
                                kind: monaco.languages.CompletionItemKind.Text,
                                insertText: word,
                                range: {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn: wordAtPosition.startColumn,
                                    endColumn: wordAtPosition.endColumn
                                }
                            }));

                        return { suggestions: suggestions };
                    }
                });

                registeredProviders.add(language);
            } catch (error) {
                console.debug('Completion provider registration failed:', error);
            }
        }

        function extractWords(text, language) {
            const wordPatterns = {
                python: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                javascript: /[a-zA-Z_$][a-zA-Z0-9_$]*/g,
                java: /[a-zA-Z_$][a-zA-Z0-9_$]*/g,
                cpp: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                c: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                rust: /[a-zA-Z_][a-zA-Z0-9_]*/g,
                php: /[a-zA-Z_$][a-zA-Z0-9_$]*/g
            };

            const pattern = wordPatterns[language] || /[a-zA-Z_][a-zA-Z0-9_]*/g;
            const words = new Set();
            let match;

            while ((match = pattern.exec(text)) !== null) {
                const word = match[0];
                if (word.length > 1 && !isKeyword(word, language)) {
                    words.add(word);
                }
            }

            return Array.from(words);
        }

        function isKeyword(word, language) {
            const keywords = {
                python: ['if', 'else', 'elif', 'for', 'while', 'def', 'class', 'import', 'from', 'as', 'return', 'try', 'except', 'finally', 'with', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False'],
                javascript: ['if', 'else', 'for', 'while', 'function', 'class', 'import', 'export', 'return', 'try', 'catch', 'finally', 'with', 'break', 'continue', 'var', 'let', 'const', 'new', 'this', 'super', 'extends', 'static', 'async', 'await'],
                java: ['if', 'else', 'for', 'while', 'class', 'public', 'private', 'protected', 'static', 'void', 'return', 'try', 'catch', 'finally', 'import', 'package', 'extends', 'implements', 'new', 'this', 'super'],
                cpp: ['if', 'else', 'for', 'while', 'class', 'public', 'private', 'protected', 'static', 'void', 'return', 'try', 'catch', 'include', 'using', 'namespace', 'new', 'delete', 'this'],
                c: ['if', 'else', 'for', 'while', 'return', 'include', 'define', 'typedef', 'struct', 'enum', 'union'],
                rust: ['if', 'else', 'for', 'while', 'fn', 'let', 'mut', 'pub', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'return', 'match', 'loop', 'break', 'continue'],
                php: ['if', 'else', 'for', 'while', 'function', 'class', 'public', 'private', 'protected', 'static', 'return', 'try', 'catch', 'finally', 'include', 'require', 'use', 'namespace', 'new', 'this']
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
                php: '//'
            };
            return comments[language] || '//';
        }

        function getBlockComment(language) {
            const comments = {
                python: null,
                javascript: { open: '/*', close: '*/' },
                java: { open: '/*', close: '*/' },
                cpp: { open: '/*', close: '*/' },
                c: { open: '/*', close: '*/' },
                rust: { open: '/*', close: '*/' },
                php: { open: '/*', close: '*/' }
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

        codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
            const outputText =
                elements.output.querySelector('#output-text') || elements.output.querySelector('#error-text');
            if (outputText) {
                const text = outputText.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    const copyBtn = document.getElementById('copy-output-btn');
                    if (copyBtn) {
                        const originalText = copyBtn.querySelector('span:last-child').textContent;
                        copyBtn.querySelector('span:last-child').textContent =
                            translations[currentLang]['copied'] || 'Copied!';
                        setTimeout(() => {
                            copyBtn.querySelector('span:last-child').textContent = originalText;
                        }, 2000);
                    }
                });
            }
        });

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

        window.addEventListener('resize', () => codeEditor.layout());
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
            system: currentLang === 'ko' ? '시스템 기본값' : 'System Default',
            dark: currentLang === 'ko' ? '다크 모드' : 'Dark Mode',
            light: currentLang === 'ko' ? '라이트 모드' : 'Light Mode'
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
            elements.settingsLangName.textContent = currentLang === 'ko' ? '한국어' : 'English';
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
        elements.fontFamilySelect.value = localStorage.getItem('fontFamily') || CONFIG.DEFAULT_FONT_FAMILY;
        updateFontSelectDisplay();
    }

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const currentThemePreference = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
            if (currentThemePreference === 'system') {
                applyThemeFromSettings('system');
            }
        });
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
