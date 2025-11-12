import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import OutputPanel from '../components/OutputPanel';
import Header from '../components/Header';
import Toast from '../components/Toast';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import { executeCode as apiExecuteCode } from '../services/api';
import { CONFIG, LANGUAGE_CONFIG } from '../config/constants';
import { formatOutput, formatError } from '../utils/outputFormatter';

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
        toast,
        hideToast,
        t
    } = useApp();
    const [pendingLanguageChange, setPendingLanguageChange] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isRunning) {
                e.preventDefault();
                handleRun();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                handleClear();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [code, isRunning]);

    const handleRun = async () => {
        if (!code || !code.trim()) {
            showToast(t('no-code-error'), 'warning');
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
            
            if (result.images && result.images.length > 0) {
                setOutput({
                    text: formattedOutput,
                    images: result.images
                });
            } else {
                setOutput(formattedOutput);
            }
            setError(formattedError);

            if (formattedError) {
                showToast(t('execution-completed-with-errors') || 'Execution completed with errors', 'warning');
            } else {
                showToast(t('execution-completed') || `Execution completed in ${executionTimeMs}ms`, 'success');
            }
        } catch (err) {
            const endTime = Date.now();
            setExecutionTime(Date.now() - startTime);
            let userMessage = t('connection-error');
            if (err.message) {
                const msg = err.message.toLowerCase();
                if (msg.includes('failed to fetch') || msg.includes('network')) {
                    userMessage = t('cannot-connect-server');
                } else if (msg.includes('timeout')) {
                    userMessage = t('request-timeout');
                } else if (msg.includes('400')) {
                    userMessage = t('bad-request');
                } else if (msg.includes('500')) {
                    userMessage = t('server-error');
                } else {
                    const match = err.message.match(/HTTP \d+: (.+)/);
                    if (match && match[1]) {
                        userMessage = match[1];
                    }
                }
            }
            setError(userMessage);
            showToast(userMessage, 'error');
        } finally {
            setIsRunning(false);
        }
    };

    const handleClear = () => {
        const template = LANGUAGE_CONFIG.templates[currentLanguage] || '';
        setCode(template);
        localStorage.removeItem(`code_${currentLanguage}`);
        setOutput('');
        setError('');
        setExecutionTime(null);
        showToast(t('code-cleared') || 'Code cleared', 'info');
    };

    const handleLanguageChange = (lang) => {
        if (code && code.trim() && code !== LANGUAGE_CONFIG.templates[currentLanguage]) {
            setPendingLanguageChange(lang);
        } else {
            setCurrentLanguage(lang);
        }
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
            {toast && <Toast message={toast.message} type={toast.type} duration={toast.duration} onClose={hideToast} />}
            <KeyboardShortcuts />
            <main className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[calc(100vh-180px)] items-start xl:gap-8 xl:min-h-[calc(100vh-200px)]" style={{ gridTemplateRows: 'auto 1fr auto', gridTemplateAreas: "'language language' 'editor output' 'actions actions'" }}>
                    <div className="[grid-area:language] md:[grid-area:language]">
                        <LanguageSelector
                            onLanguageChange={handleLanguageChange}
                            pendingChange={pendingLanguageChange}
                            onConfirmChange={confirmLanguageChange}
                            onCancelChange={() => setPendingLanguageChange(null)}
                        />
                    </div>
                    <div className="flex flex-col bg-bg-secondary/80 backdrop-blur-sm border border-border-color rounded-xl overflow-hidden h-full min-h-[400px] shadow-lg transition-all duration-300 relative hover:shadow-xl hover:border-accent-primary/30 hover:-translate-y-0.5 group md:min-h-[350px]" style={{ gridArea: 'editor' }}>
                        <div className="relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-accent-gradient before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100">
                            <div className="bg-gradient-to-r from-bg-tertiary to-bg-tertiary/50 px-6 py-4 border-b border-border-color/50 flex items-center justify-between min-h-[52px]">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
                                    <span className="font-bold text-text-primary text-sm uppercase tracking-widest">
                                        {t('code-editor')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                    <kbd className="px-2 py-1 bg-bg-secondary border border-border-color rounded text-[10px]">Ctrl</kbd>
                                    <span>+</span>
                                    <kbd className="px-2 py-1 bg-bg-secondary border border-border-color rounded text-[10px]">Enter</kbd>
                                    <span className="ml-1">{t('to-run') || 'to run'}</span>
                                </div>
                            </div>
                            <div className="flex relative min-h-[350px] flex-1 md:min-h-[300px]">
                                <CodeEditor onRun={handleRun} />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 justify-end items-center py-6 flex-wrap md:flex-col md:w-full md:gap-3 md:py-4" style={{ gridArea: 'actions' }}>
                        <button
                            type="button"
                            className="group relative bg-accent-gradient text-white border-none px-8 py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 shadow-lg shadow-accent-primary/30 min-w-[120px] hover:shadow-xl hover:shadow-accent-primary/40 hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none md:w-full md:justify-center overflow-hidden"
                            onClick={handleRun}
                            disabled={isRunning}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isRunning ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('running')}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {t('run')}
                                    </>
                                )}
                            </span>
                            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        </button>
                        <button 
                            type="button" 
                            className="bg-bg-tertiary/80 backdrop-blur-sm text-text-primary border border-border-color px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 shadow-md hover:bg-bg-secondary hover:border-accent-primary/50 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 md:w-full md:justify-center"
                            onClick={handleClear}
                        >
                            {t('clear')}
                        </button>
                    </div>
                    <div style={{ gridArea: 'output' }}>
                        <OutputPanel input={input} setInput={setInput} output={output} error={error} />
                    </div>
                </div>
            </main>
        </>
    );
};

export default CompilerPage;

