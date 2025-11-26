import { memo, useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/useApp';
import type { Output } from '../../types';
import Modal from '../Modal';
import './styles.css';

interface OutputPanelProps {
    input: string;
    setInput: (input: string) => void;
    output: Output;
    error: string;
}

const OutputPanel = memo(({ input, setInput, output, error }: OutputPanelProps) => {
    const { t, setOutput, isRunning } = useApp();
    const [pendingClearOutput, setPendingClearOutput] = useState(false);
    const outputContentRef = useRef<HTMLDivElement>(null);
    const consoleOutputRef = useRef<HTMLDivElement>(null);

    const handleClear = () => {
        setPendingClearOutput(true);
    };

    const confirmClear = () => {
        setOutput('');
        setPendingClearOutput(false);
    };

    const cancelClear = () => {
        setPendingClearOutput(false);
    };

    const outputText = typeof output === 'object' && 'text' in output ? output.text : output;
    const images = typeof output === 'object' && 'images' in output ? output.images : [];
    const hasContent = outputText || error || images.length > 0;

    useEffect(() => {
        if (!isRunning && hasContent && consoleOutputRef.current) {
            const timer = setTimeout(() => {
                consoleOutputRef.current?.scrollTo({
                    top: consoleOutputRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isRunning, hasContent]);

    return (
        <div className="output-section">
            <div className="output-header">
                <div className="output-title">
                    <div className="output-title-content">{t('execution-result')}</div>
                </div>
                {hasContent && (
                    <button className="clear-output-btn" onClick={handleClear} aria-label={t('clear-output')}>
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
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span>{t('clear-output')}</span>
                    </button>
                )}
            </div>
            <div id="output" className="output-content" ref={outputContentRef}>
                {isRunning ? (
                    <div className="output-loading">
                        <svg
                            className="animate-spin loading-spinner"
                            width="32"
                            height="32"
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
                        <p className="loading-text">{t('executing')}</p>
                    </div>
                ) : !hasContent ? (
                    <div className="output-empty">
                        <svg
                            className="empty-icon"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="empty-text">{t('output-placeholder')}</p>
                    </div>
                ) : (
                    <div className="console-output" ref={consoleOutputRef}>
                        {images.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                {images.map((img, index) => (
                                    <div key={index} className="console-line console-image">
                                        <img src={img.data} alt={img.name} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {outputText && (
                            <div className="output-text">
                                <pre>{outputText}</pre>
                            </div>
                        )}
                        {error && (
                            <div className="output-error">
                                <pre>{error}</pre>
                            </div>
                        )}
                        {!outputText && !error && images.length === 0 && <p className="text-muted">{t('no-output')}</p>}
                    </div>
                )}
                <div className="console-input-wrapper">
                    <span className="console-prompt">&gt;</span>
                    <input
                        type="text"
                        className="console-input"
                        placeholder={t('console-input-placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoComplete="off"
                        disabled={isRunning}
                        aria-label={t('console-input-placeholder')}
                    />
                </div>
            </div>
            {pendingClearOutput && (
                <Modal
                    title={t('continue-question')}
                    message={t('clear-output-confirm-message')}
                    onConfirm={confirmClear}
                    onCancel={cancelClear}
                />
            )}
        </div>
    );
});

OutputPanel.displayName = 'OutputPanel';

export default OutputPanel;
