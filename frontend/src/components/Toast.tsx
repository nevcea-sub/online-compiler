import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ToastType } from '../types';
import './Toast.css';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast = ({ message, type = 'info', onClose, duration = 3000 }: ToastProps) => {
    const { t } = useApp();
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (duration > 0) {
            let closeTimer: ReturnType<typeof setTimeout> | null = null;
            const timer = setTimeout(() => {
                setIsClosing(true);
                closeTimer = setTimeout(() => {
                    onClose();
                }, 200);
            }, duration);
            return () => {
                clearTimeout(timer);
                if (closeTimer) {
                    clearTimeout(closeTimer);
                }
            };
        }
    }, [duration, onClose]);

    const icons = {
        success: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        error: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        ),
        warning: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        ),
        info: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        )
    };

    return (
        <div
            className={`toast toast-${type} ${isClosing ? 'toast-closing' : ''}`}
            role="alert"
        >
            <div className="toast-icon">{icons[type]}</div>
            <p className="toast-message">{message}</p>
            <button
                onClick={() => {
                    setIsClosing(true);
                    setTimeout(() => {
                        onClose();
                    }, 200);
                }}
                className="toast-close"
                aria-label={t('close')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};

export default Toast;

