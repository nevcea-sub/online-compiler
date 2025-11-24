import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/useApp';
import { LANGUAGE_CONFIG } from '../../config/constants';
import type { ProgrammingLanguage } from '../../types';
import './styles.css';

interface EditorLanguageSelectorProps {
    onLanguageChange: (lang: ProgrammingLanguage) => void;
    pendingChange?: ProgrammingLanguage | null;
}

const EditorLanguageSelector = ({ onLanguageChange, pendingChange }: EditorLanguageSelectorProps) => {
    const { currentLanguage, t } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        setIsOpen(false);
        setSearchQuery('');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                handleClose();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    const filteredLanguages = (Object.keys(LANGUAGE_CONFIG.names) as ProgrammingLanguage[]).filter((lang) => {
        if (!searchQuery) {
            return true;
        }
        const searchLower = searchQuery.toLowerCase();
        const langName = LANGUAGE_CONFIG.names[lang].toLowerCase();
        return langName.includes(searchLower) || lang.toLowerCase().includes(searchLower);
    });

    return (
        <div className="editor-language-selector">
            <button
                ref={buttonRef}
                type="button"
                className={`editor-language-button ${isOpen ? 'active' : ''} ${pendingChange ? 'pending' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    src={LANGUAGE_CONFIG.icons[currentLanguage]}
                    alt=""
                    className="editor-language-icon"
                />
                <span className="editor-language-name">{LANGUAGE_CONFIG.names[currentLanguage]}</span>
                <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div
                ref={dropdownRef}
                className={`editor-language-dropdown ${isOpen ? 'show' : ''}`}
            >
                <div className="editor-language-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="editor-language-search-input"
                        placeholder={t('search-language')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="editor-language-search-clear"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery('');
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
                <div className="editor-language-options">
                    {filteredLanguages.map((lang) => (
                        <div
                            key={lang}
                            className={`editor-language-option ${lang === currentLanguage ? 'selected' : ''}`}
                            onClick={() => {
                                onLanguageChange(lang);
                                handleClose();
                            }}
                        >
                            <img
                                src={LANGUAGE_CONFIG.icons[lang]}
                                alt=""
                                className="editor-language-icon"
                            />
                            <span className="editor-language-name">{LANGUAGE_CONFIG.names[lang]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EditorLanguageSelector;

