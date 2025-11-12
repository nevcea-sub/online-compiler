import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_CONFIG } from '../config/constants';
import Modal from './Modal';

const LanguageSelector = ({ onLanguageChange, pendingChange, onConfirmChange, onCancelChange }) => {
    const { currentLanguage, t } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const languages = Object.keys(LANGUAGE_CONFIG.names);

    return (
        <>
            <div className="language-selector">
                <label>{t('programming-language')}</label>
                <div className="custom-select-wrapper">
                    <button
                        ref={buttonRef}
                        type="button"
                        className="custom-select-button"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <span className="language-icon">
                            <img
                                src={LANGUAGE_CONFIG.icons[currentLanguage]}
                                alt=""
                                className="language-icon-img"
                            />
                        </span>
                        <span className="language-name">{LANGUAGE_CONFIG.names[currentLanguage]}</span>
                        <span className="select-arrow">▼</span>
                    </button>
                    {isOpen && (
                        <div ref={dropdownRef} className="custom-select-dropdown">
                            {languages.map((lang) => (
                                <div
                                    key={lang}
                                    className={`select-option ${lang === currentLanguage ? 'selected' : ''}`}
                                    onClick={() => {
                                        onLanguageChange(lang);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="language-icon">
                                        <img
                                            src={LANGUAGE_CONFIG.icons[lang]}
                                            alt=""
                                            className="language-icon-img"
                                        />
                                    </span>
                                    <span>{LANGUAGE_CONFIG.names[lang]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {pendingChange && (
                <Modal
                    title={t('language-change-title')}
                    message={t('language-change-message')}
                    onConfirm={onConfirmChange}
                    onCancel={onCancelChange}
                />
            )}
        </>
    );
};

export default LanguageSelector;

