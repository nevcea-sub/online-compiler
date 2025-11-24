import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/useApp';

const LanguageSettings = () => {
    const { currentLang, setCurrentLang, t } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="settings-section">
            <h3>{t('language-settings')}</h3>
            <div className="settings-item">
                <label>{t('interface-language')}</label>
                <div className="language-select-wrapper">
                    <button
                        ref={buttonRef}
                        type="button"
                        className={`language-select-button ${isOpen ? 'active' : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="option-icon">
                            {currentLang === 'ko' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            )}
                        </div>
                        <span>
                            {currentLang === 'ko' && t('korean')}
                            {currentLang === 'en' && t('english')}
                        </span>
                        <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <div className={`language-select-dropdown ${isOpen ? 'show' : ''}`} ref={dropdownRef}>
                        <div
                            className={`language-option ${currentLang === 'ko' ? 'selected' : ''}`}
                            onClick={() => {
                                setCurrentLang('ko');
                                setIsOpen(false);
                            }}
                        >
                            <div className="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <span>{t('korean')}</span>
                        </div>
                        <div
                            className={`language-option ${currentLang === 'en' ? 'selected' : ''}`}
                            onClick={() => {
                                setCurrentLang('en');
                                setIsOpen(false);
                            }}
                        >
                            <div className="option-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <span>{t('english')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageSettings;

