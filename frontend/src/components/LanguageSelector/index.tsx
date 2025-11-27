import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/useApp';
import type { Language } from '../../types';
import './styles.css';

const LanguageSelector = () => {
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

    const languages: Language[] = ['ko', 'en'];

    const getLanguageName = (lang: Language) => {
        return lang === 'ko' ? t('korean') : t('english');
    };

    return (
        <div className="language-selector">
            <div className="custom-select-wrapper">
                <button
                    ref={buttonRef}
                    type="button"
                    className={`custom-select-button ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="language-icon">
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
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                    </div>
                    <span className="language-name">{getLanguageName(currentLang)}</span>
                    <svg
                        className="select-arrow"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div ref={dropdownRef} className={`custom-select-dropdown ${isOpen ? 'show' : ''}`}>
                    {languages.map((lang) => (
                        <div
                            key={lang}
                            className={`select-option ${lang === currentLang ? 'selected' : ''}`}
                            onClick={() => {
                                setCurrentLang(lang);
                                setIsOpen(false);
                            }}
                        >
                            <span className="language-name">{getLanguageName(lang)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LanguageSelector;
