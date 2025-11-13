import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './Modal.css';

interface ModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const Modal = ({ title, message, onConfirm, onCancel }: ModalProps) => {
    const { t } = useApp();

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onCancel]);

    return (
        <div className="modal show">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button
                        className="modal-cancel-btn"
                        onClick={onCancel}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>{t('cancel')}</span>
                    </button>
                    <button
                        className="modal-confirm-btn"
                        onClick={onConfirm}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{t('confirm')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;

