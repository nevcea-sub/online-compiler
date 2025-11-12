import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const Modal = ({ title, message, onConfirm, onCancel }) => {
    const { t } = useApp();

    useEffect(() => {
        const handleEscape = (e) => {
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
                    <p className="text-muted">{t('continue-question')}</p>
                </div>
                <div className="modal-footer">
                    <button className="secondary" onClick={onCancel}>
                        {t('cancel')}
                    </button>
                    <button className="run-button" onClick={onConfirm}>
                        {t('confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;

