import { useState } from 'react';
import { useApp } from '../context/AppContext';
import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import OutputPanel from '../components/OutputPanel';
import Header from '../components/Header';
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
        t
    } = useApp();
    const [pendingLanguageChange, setPendingLanguageChange] = useState(null);

    const handleRun = async () => {
        if (!code || !code.trim()) {
            setOutput(t('no-code-error'));
            return;
        }

        setIsRunning(true);
        setOutput('');
        setError('');

        try {
            const result = await apiExecuteCode(code, currentLanguage, input);
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
        } catch (err) {
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
            <main className="container">
                <div className="compiler-layout">
                    <LanguageSelector
                        onLanguageChange={handleLanguageChange}
                        pendingChange={pendingLanguageChange}
                        onConfirmChange={confirmLanguageChange}
                        onCancelChange={() => setPendingLanguageChange(null)}
                    />
                    <div className="editor-section">
                        <div className="editor-header">
                            <span className="editor-title">{t('code-editor')}</span>
                        </div>
                        <div className="editor-wrapper">
                            <CodeEditor onRun={handleRun} />
                        </div>
                    </div>
                    <div className="action-buttons">
                        <button
                            type="button"
                            className="run-button"
                            onClick={handleRun}
                            disabled={isRunning}
                        >
                            {isRunning ? t('running') : t('run')}
                        </button>
                        <button type="button" className="secondary" onClick={handleClear}>
                            {t('clear')}
                        </button>
                    </div>
                    <OutputPanel input={input} setInput={setInput} output={output} error={error} />
                </div>
            </main>
        </>
    );
};

export default CompilerPage;

