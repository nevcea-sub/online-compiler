import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { FONT_CONFIG } from '../config/constants';
import './SettingsPage.css';

const SettingsPage = () => {
    const {
        theme,
        setTheme,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        currentLang,
        setCurrentLang,
        setCurrentPage,
        t
    } = useApp();
    const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
    const [fontSearchQuery, setFontSearchQuery] = useState('');
    const fontDropdownRef = useRef<HTMLDivElement>(null);
    const fontButtonRef = useRef<HTMLButtonElement>(null);
    const fontSearchInputRef = useRef<HTMLInputElement>(null);
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const themeDropdownRef = useRef<HTMLDivElement>(null);
    const themeButtonRef = useRef<HTMLButtonElement>(null);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const languageDropdownRef = useRef<HTMLDivElement>(null);
    const languageButtonRef = useRef<HTMLButtonElement>(null);
    const [fontSizeInput, setFontSizeInput] = useState(fontSize.toString());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                fontDropdownRef.current &&
                !fontDropdownRef.current.contains(event.target as Node) &&
                fontButtonRef.current &&
                !fontButtonRef.current.contains(event.target as Node)
            ) {
                setIsFontDropdownOpen(false);
                setFontSearchQuery('');
            }
            if (
                themeDropdownRef.current &&
                !themeDropdownRef.current.contains(event.target as Node) &&
                themeButtonRef.current &&
                !themeButtonRef.current.contains(event.target as Node)
            ) {
                setIsThemeDropdownOpen(false);
            }
            if (
                languageDropdownRef.current &&
                !languageDropdownRef.current.contains(event.target as Node) &&
                languageButtonRef.current &&
                !languageButtonRef.current.contains(event.target as Node)
            ) {
                setIsLanguageDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isFontDropdownOpen) {
            setFontSearchQuery('');
        } else {
            setTimeout(() => {
                fontSearchInputRef.current?.focus();
            }, 0);
        }
    }, [isFontDropdownOpen]);

    useEffect(() => {
        setFontSizeInput(fontSize.toString());
    }, [fontSize]);

    return (
        <>
            <Header />
            <main className="container">
                <div className="settings-layout">
                    <div className="settings-header">
                        <h2>{t('settings-title')}</h2>
                        <button
                            className="back-button"
                            onClick={() => setCurrentPage('compiler')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            <span>{t('back')}</span>
                        </button>
                    </div>
                    <div className="settings-content">
                        <div className="settings-section">
                            <h3>{t('language-settings')}</h3>
                            <div className="settings-item">
                                <label>{t('interface-language')}</label>
                                <div className="language-select-wrapper">
                                    <button
                                        ref={languageButtonRef}
                                        type="button"
                                        className={`language-select-button ${isLanguageDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
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
                                    <div className={`language-select-dropdown ${isLanguageDropdownOpen ? 'show' : ''}`} ref={languageDropdownRef}>
                                        <div
                                            className={`language-option ${currentLang === 'ko' ? 'selected' : ''}`}
                                            onClick={() => {
                                                setCurrentLang('ko');
                                                setIsLanguageDropdownOpen(false);
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
                                                setIsLanguageDropdownOpen(false);
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
                        <div className="settings-section">
                            <h3>{t('theme-settings')}</h3>
                            <div className="settings-item">
                                <label>{t('theme')}</label>
                                <div className="theme-select-wrapper">
                                    <button
                                        ref={themeButtonRef}
                                        type="button"
                                        className={`theme-select-button ${isThemeDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                                    >
                                        <div className="option-icon">
                                            {theme === 'system' ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                                </svg>
                                            ) : theme === 'dark' ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="5"></circle>
                                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                                </svg>
                                            )}
                                        </div>
                                        <span>
                                            {theme === 'system' && t('system-theme')}
                                            {theme === 'dark' && t('dark-theme')}
                                            {theme === 'light' && t('light-theme')}
                                        </span>
                                        <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>
                                    <div className={`theme-select-dropdown ${isThemeDropdownOpen ? 'show' : ''}`} ref={themeDropdownRef}>
                                        <div
                                            className={`theme-option ${theme === 'system' ? 'selected' : ''}`}
                                            onClick={() => {
                                                setTheme('system');
                                                setIsThemeDropdownOpen(false);
                                            }}
                                        >
                                            <div className="option-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                                </svg>
                                            </div>
                                            <span>{t('system-theme')}</span>
                                        </div>
                                        <div
                                            className={`theme-option ${theme === 'dark' ? 'selected' : ''}`}
                                            onClick={() => {
                                                setTheme('dark');
                                                setIsThemeDropdownOpen(false);
                                            }}
                                        >
                                            <div className="option-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                                </svg>
                                            </div>
                                            <span>{t('dark-theme')}</span>
                                        </div>
                                        <div
                                            className={`theme-option ${theme === 'light' ? 'selected' : ''}`}
                                            onClick={() => {
                                                setTheme('light');
                                                setIsThemeDropdownOpen(false);
                                            }}
                                        >
                                            <div className="option-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="5"></circle>
                                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                                </svg>
                                            </div>
                                            <span>{t('light-theme')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="settings-section">
                            <h3>{t('editor-settings')}</h3>
                            <div className="settings-item">
                                <label>{t('font-family')}</label>
                                <div className="font-select-wrapper">
                                    <button
                                        ref={fontButtonRef}
                                        type="button"
                                        className={`font-select-button ${isFontDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                                        style={{ fontFamily: fontFamily }}
                                    >
                                        <div className="option-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                                                <line x1="9" y1="20" x2="15" y2="20"></line>
                                                <line x1="12" y1="4" x2="12" y2="20"></line>
                                            </svg>
                                        </div>
                                        <span>{FONT_CONFIG.families[fontFamily as keyof typeof FONT_CONFIG.families] || fontFamily}</span>
                                        <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>
                                    <div className={`font-select-dropdown ${isFontDropdownOpen ? 'show' : ''}`} ref={fontDropdownRef}>
                                        <div className="font-select-search">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <path d="m21 21-4.35-4.35"></path>
                                            </svg>
                                            <input
                                                ref={fontSearchInputRef}
                                                type="text"
                                                className="font-select-search-input"
                                                placeholder={t('search-font') || '폰트 검색...'}
                                                value={fontSearchQuery}
                                                onChange={(e) => setFontSearchQuery(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {fontSearchQuery && (
                                                <button
                                                    type="button"
                                                    className="font-select-search-clear"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFontSearchQuery('');
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="font-select-options">
                                            {Object.entries(FONT_CONFIG.families)
                                                .filter(([value, name]) => {
                                                    if (!fontSearchQuery) {
                                                        return true;
                                                    }
                                                    const searchLower = fontSearchQuery.toLowerCase();
                                                    const fontName = name.toLowerCase();
                                                    return fontName.includes(searchLower) || value.toLowerCase().includes(searchLower);
                                                })
                                                .map(([value, name]) => (
                                                    <div
                                                        key={value}
                                                        className={`font-option ${value === fontFamily ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setFontFamily(value);
                                                            setIsFontDropdownOpen(false);
                                                            setFontSearchQuery('');
                                                        }}
                                                        style={{ fontFamily: value }}
                                                    >
                                                        <div className="option-icon">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                                                                <line x1="9" y1="20" x2="15" y2="20"></line>
                                                                <line x1="12" y1="4" x2="12" y2="20"></line>
                                                            </svg>
                                                        </div>
                                                        <span>{name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="settings-item">
                                <label>{t('font-size')}</label>
                                <div className="font-size-input-wrapper">
                                    <div className="option-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="4 7 4 4 20 4 20 7"></polyline>
                                            <line x1="9" y1="20" x2="15" y2="20"></line>
                                            <line x1="12" y1="4" x2="12" y2="20"></line>
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={fontSizeInput}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d+$/.test(value)) {
                                                setFontSizeInput(value);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const value = parseInt(fontSizeInput, 10);
                                                if (!isNaN(value) && value >= 8 && value <= 48) {
                                                    setFontSize(value);
                                                } else if (isNaN(value) || value < 8) {
                                                    setFontSize(8);
                                                } else if (value > 48) {
                                                    setFontSize(48);
                                                }
                                                e.currentTarget.blur();
                                            } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                const currentValue = parseInt(fontSizeInput, 10) || fontSize;
                                                const newValue = Math.min(currentValue + 1, 48);
                                                setFontSize(newValue);
                                            } else if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                const currentValue = parseInt(fontSizeInput, 10) || fontSize;
                                                const newValue = Math.max(currentValue - 1, 8);
                                                setFontSize(newValue);
                                            }
                                        }}
                                        onBlur={() => {
                                            const value = parseInt(fontSizeInput, 10);
                                            if (isNaN(value) || value < 8) {
                                                setFontSize(8);
                                            } else if (value > 48) {
                                                setFontSize(48);
                                            } else {
                                                setFontSize(value);
                                            }
                                        }}
                                        className="font-size-input"
                                        placeholder="14"
                                    />
                                    <span className="font-size-unit">px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default SettingsPage;

