import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/useApp';
import { FONT_CONFIG } from '../../../config/constants';

const EditorSettings = () => {
    const { fontFamily, setFontFamily, fontSize, setFontSize, t } = useApp();
    const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
    const [fontSearchQuery, setFontSearchQuery] = useState('');
    const fontDropdownRef = useRef<HTMLDivElement>(null);
    const fontButtonRef = useRef<HTMLButtonElement>(null);
    const fontSearchInputRef = useRef<HTMLInputElement>(null);
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
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isFontDropdownOpen) {
            setTimeout(() => {
                fontSearchInputRef.current?.focus();
            }, 0);
        }
    }, [isFontDropdownOpen]);

    useEffect(() => {
        setFontSizeInput(fontSize.toString());
    }, [fontSize]);

    return (
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
                                placeholder={t('search-font')}
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
    );
};

export default EditorSettings;

