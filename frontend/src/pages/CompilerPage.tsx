import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import CodeEditor from '../components/CodeEditor';
import OutputPanel from '../components/OutputPanel';
import Header from '../components/Header';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import Modal from '../components/Modal';
import { executeCode as apiExecuteCode } from '../services/api';
import { LANGUAGE_CONFIG } from '../config/constants';
import { formatOutput, formatError } from '../utils/outputFormatter';
import { mapServerErrorMessage } from '../i18n/translations';
import type { ProgrammingLanguage } from '../types';
import './CompilerPage.css';

const CompilerPage = () => {
    const {
        code,
        setCode,
        input,
        setInput,
        output,
        setOutput,
        error,
        setError,
        isRunning,
        setIsRunning,
        currentLanguage,
        setCurrentLanguage,
        setExecutionTime,
        showToast,
        t
    } = useApp();
    const [pendingLanguageChange, setPendingLanguageChange] = useState<ProgrammingLanguage | null>(null);
    const [pendingClearCode, setPendingClearCode] = useState(false);
    const [isEditorLanguageDropdownOpen, setIsEditorLanguageDropdownOpen] = useState(false);
    const [languageSearchQuery, setLanguageSearchQuery] = useState('');
    const editorLanguageDropdownRef = useRef<HTMLDivElement>(null);
    const editorLanguageButtonRef = useRef<HTMLButtonElement>(null);
    const languageSearchInputRef = useRef<HTMLInputElement>(null);

    const handleRun = useCallback(async () => {
        if (!code || !code.trim()) {
            return;
        }

        setIsRunning(true);
        setOutput('');
        setError('');
        setExecutionTime(null);
        const startTime = Date.now();

        try {
            const result = await apiExecuteCode(code, currentLanguage, input);
            const endTime = Date.now();
            const executionTimeMs = endTime - startTime;
            setExecutionTime(executionTimeMs);

            const formattedOutput = formatOutput(result.output || '');
            const formattedError = formatError(result.error || '');

            if (result.error && result.error.trim()) {
                const translationKey = mapServerErrorMessage(result.error);
                const errorMessage = translationKey ? t(translationKey) : result.error;
                showToast(errorMessage, 'error', 5000);
                setError('');
            } else {
                setError(formattedError);
            }

            if (result.images && result.images.length > 0) {
                setOutput({
                    text: formattedOutput,
                    images: result.images
                });
            } else {
                setOutput(formattedOutput);
            }
        } catch (err) {
            setExecutionTime(Date.now() - startTime);
            let userMessage = t('connection-error');
            let errorType: 'error' | 'info' | 'success' | 'warning' = 'error';
            if (err instanceof Error && err.message) {
                const match = err.message.match(/HTTP \d+: (.+)/);
                if (match && match[1]) {
                    userMessage = match[1];
                } else {
                    const msg = err.message.toLowerCase();
                    if (msg.includes('failed to fetch') || msg.includes('network')) {
                        userMessage = t('cannot-connect-server');
                    } else if (msg.includes('timeout')) {
                        userMessage = t('request-timeout');
                    } else if (msg.includes('400')) {
                        userMessage = t('bad-request');
                    } else if (msg.includes('500')) {
                        userMessage = t('server-error');
                    }
                }
            }
            showToast(userMessage, errorType, 5000);
        } finally {
            setIsRunning(false);
        }
    }, [code, currentLanguage, input, t, showToast, setError, setExecutionTime, setIsRunning, setOutput]);

    const handleClear = useCallback(() => {
        setPendingClearCode(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isRunning && !isInputFocused) {
                e.preventDefault();
                handleRun();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !isInputFocused) {
                e.preventDefault();
                handleClear();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isRunning, handleRun, handleClear]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                editorLanguageDropdownRef.current &&
                !editorLanguageDropdownRef.current.contains(event.target as Node) &&
                editorLanguageButtonRef.current &&
                !editorLanguageButtonRef.current.contains(event.target as Node)
            ) {
                setIsEditorLanguageDropdownOpen(false);
                setLanguageSearchQuery('');
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isEditorLanguageDropdownOpen) {
            setLanguageSearchQuery('');
        } else {
            setTimeout(() => {
                languageSearchInputRef.current?.focus();
            }, 0);
        }
    }, [isEditorLanguageDropdownOpen]);

    const confirmClear = () => {
        const template = LANGUAGE_CONFIG.templates[currentLanguage] || '';
        setCode(template);
        localStorage.removeItem(`code_${currentLanguage}`);
        setOutput('');
        setError('');
        setExecutionTime(null);
        setPendingClearCode(false);
    };

    const cancelClear = () => {
        setPendingClearCode(false);
    };

    const handleLanguageChange = (lang: ProgrammingLanguage) => {
        if (lang === currentLanguage) {
            return;
        }
        setPendingLanguageChange(lang);
    };

    const confirmLanguageChange = () => {
        if (pendingLanguageChange) {
            setCurrentLanguage(pendingLanguageChange);
            setPendingLanguageChange(null);
        }
    };

    return (
        <>
            <Header />
            <KeyboardShortcuts />
            <main className="container">
                <div className="compiler-layout">
                    <div className="editor-section">
                        <div className="editor-header">
                            <div className="editor-title">
                                {t('code-editor')}
                            </div>
                            <div className="editor-header-actions">
                                <div className="editor-language-selector">
                                    <button
                                        ref={editorLanguageButtonRef}
                                        type="button"
                                        className={`editor-language-button ${isEditorLanguageDropdownOpen ? 'active' : ''} ${pendingLanguageChange ? 'pending' : ''}`}
                                        onClick={() => setIsEditorLanguageDropdownOpen(!isEditorLanguageDropdownOpen)}
                                    >
                                        <img
                                            src={LANGUAGE_CONFIG.icons[currentLanguage]}
                                            alt=""
                                            className="editor-language-icon"
                                        />
                                        <span className="editor-language-name">{LANGUAGE_CONFIG.names[currentLanguage]}</span>
                                        <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>
                                    <div
                                        ref={editorLanguageDropdownRef}
                                        className={`editor-language-dropdown ${isEditorLanguageDropdownOpen ? 'show' : ''}`}
                                    >
                                        <div className="editor-language-search">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <path d="m21 21-4.35-4.35"></path>
                                            </svg>
                                            <input
                                                ref={languageSearchInputRef}
                                                type="text"
                                                className="editor-language-search-input"
                                                placeholder={t('search-language') || '언어 검색...'}
                                                value={languageSearchQuery}
                                                onChange={(e) => setLanguageSearchQuery(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {languageSearchQuery && (
                                                <button
                                                    type="button"
                                                    className="editor-language-search-clear"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLanguageSearchQuery('');
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="editor-language-options">
                                            {(Object.keys(LANGUAGE_CONFIG.names) as ProgrammingLanguage[])
                                                .filter((lang) => {
                                                    if (!languageSearchQuery) {
                                                        return true;
                                                    }
                                                    const searchLower = languageSearchQuery.toLowerCase();
                                                    const langName = LANGUAGE_CONFIG.names[lang].toLowerCase();
                                                    return langName.includes(searchLower) || lang.toLowerCase().includes(searchLower);
                                                })
                                                .map((lang) => (
                                                    <div
                                                        key={lang}
                                                        className={`editor-language-option ${lang === currentLanguage ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            handleLanguageChange(lang);
                                                            setIsEditorLanguageDropdownOpen(false);
                                                            setLanguageSearchQuery('');
                                                        }}
                                                    >
                                                        <img
                                                            src={LANGUAGE_CONFIG.icons[lang]}
                                                            alt=""
                                                            className="editor-language-icon"
                                                        />
                                                        <span className="editor-language-name">{LANGUAGE_CONFIG.names[lang]}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="editor-wrapper">
                            <CodeEditor onRun={handleRun} />
                        </div>
                        <div className="action-buttons">
                            <button
                                type="button"
                                className="run-button"
                                onClick={handleRun}
                                disabled={isRunning}
                            >
                                {isRunning ? (
                                    <>
                                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{t('running')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                        <span>{t('run')}</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="secondary"
                                onClick={handleClear}
                                disabled={isRunning}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                <span>{t('clear')}</span>
                            </button>
                        </div>
                    </div>
                    <OutputPanel input={input} setInput={setInput} output={output} error={error} />
                </div>
            </main>
            {pendingLanguageChange && (
                <Modal
                    title={t('continue-question')}
                    message={t('language-change-message')}
                    onConfirm={confirmLanguageChange}
                    onCancel={() => setPendingLanguageChange(null)}
                />
            )}
            {pendingClearCode && (
                <Modal
                    title={t('continue-question')}
                    message={t('clear-confirm-message')}
                    onConfirm={confirmClear}
                    onCancel={cancelClear}
                />
            )}
        </>
    );
};

export default CompilerPage;

