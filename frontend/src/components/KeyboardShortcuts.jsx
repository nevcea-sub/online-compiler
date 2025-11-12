import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';

const KeyboardShortcuts = () => {
    const { t } = useApp();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '/') {
                e.preventDefault();
                setShowModal(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const shortcuts = [
        { keys: ['Ctrl', 'Enter'], description: t('shortcut-run-code') || 'Run code' },
        { keys: ['Ctrl', 'Shift', '/'], description: t('shortcut-show-help') || 'Show keyboard shortcuts' },
        { keys: ['Ctrl', 'K'], description: t('shortcut-clear') || 'Clear editor' },
        { keys: ['Esc'], description: t('shortcut-close-modal') || 'Close modal/dropdown' },
    ];

    if (!showModal) return null;

    return (
        <div className="fixed z-[2000] left-0 top-0 w-full h-full bg-[rgba(0,0,0,0.8)] backdrop-blur-xl animate-[fadeIn_0.2s_ease] flex items-center justify-center p-4">
            <div className="bg-bg-secondary/95 backdrop-blur-2xl border border-border-color/50 rounded-2xl shadow-xl max-w-[600px] w-full max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.4,0,0.2,1)] flex flex-col">
                <div className="p-6 border-b border-border-color/50 bg-gradient-to-r from-bg-tertiary to-bg-tertiary/50">
                    <h3 className="m-0 text-text-primary text-xl font-bold flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        {t('keyboard-shortcuts') || 'Keyboard Shortcuts'}
                    </h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        {shortcuts.map((shortcut, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-bg-tertiary/50 rounded-lg border border-border-color/30">
                                <span className="text-text-primary text-sm">{shortcut.description}</span>
                                <div className="flex items-center gap-1.5">
                                    {shortcut.keys.map((key, keyIndex) => (
                                        <span key={keyIndex}>
                                            <kbd className="px-2.5 py-1.5 text-xs font-semibold text-text-primary bg-bg-secondary border border-border-color rounded-md shadow-sm">
                                                {key}
                                            </kbd>
                                            {keyIndex < shortcut.keys.length - 1 && (
                                                <span className="text-text-muted mx-1">+</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-5 border-t border-border-color/50 bg-bg-tertiary/30 flex justify-end">
                    <button
                        className="bg-accent-gradient text-white border-none px-6 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 shadow-lg shadow-accent-primary/30 min-w-[100px] hover:shadow-xl hover:shadow-accent-primary/40 hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
                        onClick={() => setShowModal(false)}
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcuts;

