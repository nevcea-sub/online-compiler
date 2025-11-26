import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/useApp';
import CodeEditor from '../../components/CodeEditor';
import OutputPanel from '../../components/OutputPanel';
import Header from '../../components/Header';
import KeyboardShortcuts from '../../components/KeyboardShortcuts';
import Modal from '../../components/Modal';
import EditorLanguageSelector from '../../components/EditorLanguageSelector';
import { executeCode as apiExecuteCode } from '../../services/api';
import { LANGUAGE_CONFIG } from '../../config/constants';
import { formatOutput, formatError } from '../../utils/outputFormatter';
import { mapServerErrorMessage } from '../../i18n/translations';
import { extractErrorMessage } from '../../utils/errorHandler';
import type { ProgrammingLanguage } from '../../types';
import './styles.css';

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

    const handleRun = useCallback(async () => {
        if (!code || !code.trim()) {
            return;
        }

        setIsRunning(true);
        setOutput('');
        setError('');
        setExecutionTime(null);

        try {
            const result = await apiExecuteCode(code, currentLanguage, input);
            setExecutionTime(result.executionTime ?? null);

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
            const userMessage = extractErrorMessage(err, t);
            showToast(userMessage, 'error', 5000);
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

    const confirmClear = () => {
        const template = LANGUAGE_CONFIG.templates[currentLanguage];
        if (template) {
            setCode(template);
            localStorage.removeItem(`code_${currentLanguage}`);
        } else {
            setCode('');
        }
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

    const cancelLanguageChange = () => {
        setPendingLanguageChange(null);
    };

    return (
        <>
            <Header />
            <KeyboardShortcuts />
            <main className="container">
                <div className="compiler-layout">
                    <div className="editor-section">
                        <div className="editor-header">
                            <div className="editor-title">{t('code-editor')}</div>
                            <div className="editor-header-actions">
                                <EditorLanguageSelector
                                    onLanguageChange={handleLanguageChange}
                                    pendingChange={pendingLanguageChange}
                                />
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
                                disabled={isRunning || !code || !code.trim()}
                                title={!code || !code.trim() ? t('no-code-error') : t('run')}
                                aria-label={t('run')}
                            >
                                {isRunning ? (
                                    <>
                                        <svg
                                            className="animate-spin"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        <span>{t('running')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
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
                                aria-label={t('clear')}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
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
                    onCancel={cancelLanguageChange}
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
