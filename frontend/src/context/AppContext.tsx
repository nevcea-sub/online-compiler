import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CONFIG, LANGUAGE_CONFIG } from '../config/constants';
import { getTranslation } from '../i18n/translations';
import type { AppContextType, Language, ProgrammingLanguage, Theme, ToastType, Page, Output } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
    const [currentLang, setCurrentLang] = useState<Language>(
        () => (localStorage.getItem('language') as Language) || 'ko'
    );
    const [currentLanguage, setCurrentLanguage] = useState<ProgrammingLanguage>(CONFIG.DEFAULT_LANGUAGE);
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem('theme') as Theme) || CONFIG.DEFAULT_THEME
    );
    const [fontFamily, setFontFamily] = useState<string>(
        () => localStorage.getItem('fontFamily') || CONFIG.DEFAULT_FONT_FAMILY
    );
    const [fontSize, setFontSize] = useState<number>(
        () => parseInt(localStorage.getItem('fontSize') || String(CONFIG.DEFAULT_FONT_SIZE), 10)
    );
    const [code, setCode] = useState<string>(() => {
        const saved = localStorage.getItem(`code_${CONFIG.DEFAULT_LANGUAGE}`);
        return saved && saved.trim() ? saved : LANGUAGE_CONFIG.templates[CONFIG.DEFAULT_LANGUAGE];
    });
    const [input, setInput] = useState<string>('');
    const [output, setOutput] = useState<Output>('');
    const [error, setError] = useState<string>('');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<Page>('compiler');
    const [toast, setToast] = useState<{ message: string; type: ToastType; duration: number } | null>(null);
    const [executionTime, setExecutionTime] = useState<number | null>(null);

    const getSystemTheme = (): 'light' | 'dark' => {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

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

    const changeLanguage = useCallback((lang: Language) => {
        if (lang && ['ko', 'en'].includes(lang)) {
            setCurrentLang(lang);
        }
    }, []);

    const changeProgrammingLanguage = useCallback((lang: ProgrammingLanguage) => {
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

    const t = useCallback((key: string) => getTranslation(key, currentLang), [currentLang]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        setToast({ message, type, duration });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const value: AppContextType = {
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
        toast,
        executionTime,
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
        setExecutionTime,
        showToast,
        hideToast,
        t,
        getSystemTheme
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

