import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CONFIG, LANGUAGE_CONFIG } from '../config/constants';
import { getTranslation } from '../i18n/translations';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [currentLang, setCurrentLang] = useState(
        () => localStorage.getItem('language') || 'ko'
    );
    const [currentLanguage, setCurrentLanguage] = useState(CONFIG.DEFAULT_LANGUAGE);
    const [theme, setTheme] = useState(
        () => localStorage.getItem('theme') || CONFIG.DEFAULT_THEME
    );
    const [fontFamily, setFontFamily] = useState(
        () => localStorage.getItem('fontFamily') || CONFIG.DEFAULT_FONT_FAMILY
    );
    const [fontSize, setFontSize] = useState(
        () => parseInt(localStorage.getItem('fontSize') || CONFIG.DEFAULT_FONT_SIZE, 10)
    );
    const [code, setCode] = useState(() => {
        const saved = localStorage.getItem(`code_${CONFIG.DEFAULT_LANGUAGE}`);
        return saved && saved.trim() ? saved : LANGUAGE_CONFIG.templates[CONFIG.DEFAULT_LANGUAGE];
    });
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [currentPage, setCurrentPage] = useState('compiler');

    useEffect(() => {
        localStorage.setItem('language', currentLang);
        document.documentElement.setAttribute('lang', currentLang);
        document.title = getTranslation('title', currentLang);
    }, [currentLang]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        const actualTheme = theme === 'system' ? getSystemTheme() : theme;
        document.documentElement.setAttribute('data-theme', actualTheme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('fontFamily', fontFamily);
    }, [fontFamily]);

    useEffect(() => {
        localStorage.setItem('fontSize', fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        if (code && code.trim()) {
            localStorage.setItem(`code_${currentLanguage}`, code);
        }
    }, [code, currentLanguage]);

    const getSystemTheme = () => {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const changeLanguage = useCallback((lang) => {
        if (lang && ['ko', 'en'].includes(lang)) {
            setCurrentLang(lang);
        }
    }, []);

    const changeProgrammingLanguage = useCallback((lang) => {
        if (!lang || !LANGUAGE_CONFIG.templates[lang]) {
            return;
        }
        const savedCode = localStorage.getItem(`code_${lang}`);
        const template = LANGUAGE_CONFIG.templates[lang];
        const newCode = savedCode && savedCode.trim() ? savedCode : template;
        setCode(newCode);
        setCurrentLanguage(lang);
        setOutput('');
        setError('');
    }, []);

    const t = useCallback((key) => getTranslation(key, currentLang), [currentLang]);

    const value = {
        currentLang,
        currentLanguage,
        theme,
        fontFamily,
        fontSize,
        code,
        input,
        output,
        error,
        isRunning,
        currentPage,
        setCurrentLang: changeLanguage,
        setCurrentLanguage: changeProgrammingLanguage,
        setTheme,
        setFontFamily,
        setFontSize,
        setCode,
        setInput,
        setOutput,
        setError,
        setIsRunning,
        setCurrentPage,
        t,
        getSystemTheme
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

