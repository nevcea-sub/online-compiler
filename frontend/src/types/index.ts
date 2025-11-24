import type { TranslationKey } from '../i18n/translations';

export type Language = 'ko' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type ToastType = 'info' | 'success' | 'error' | 'warning';

export type ProgrammingLanguage =
    | 'python'
    | 'javascript'
    | 'java'
    | 'cpp'
    | 'c'
    | 'rust'
    | 'php'
    | 'r'
    | 'ruby'
    | 'csharp'
    | 'kotlin'
    | 'go'
    | 'typescript'
    | 'swift'
    | 'perl'
    | 'haskell'
    | 'bash';

export interface Toast {
    message: string;
    type: ToastType;
    duration: number;
}

export interface OutputWithImages {
    text: string;
    images: Array<{
        name: string;
        data: string;
    }>;
}

export type Output = string | OutputWithImages;

export interface ExecuteResponse {
    output?: string;
    error?: string;
    executionTime?: number;
    images?: Array<{
        name: string;
        data: string;
    }>;
}

export interface AppContextType {
    currentLang: Language;
    currentLanguage: ProgrammingLanguage;
    theme: Theme;
    fontFamily: string;
    fontSize: number;
    code: string;
    input: string;
    output: Output;
    error: string;
    isRunning: boolean;
    toast: Toast | null;
    executionTime: number | null;
    setCurrentLang: (lang: Language) => void;
    setCurrentLanguage: (lang: ProgrammingLanguage) => void;
    setTheme: (theme: Theme) => void;
    setFontFamily: (fontFamily: string) => void;
    setFontSize: (size: number) => void;
    setCode: (code: string) => void;
    setInput: (input: string) => void;
    setOutput: (output: Output) => void;
    setError: (error: string) => void;
    setIsRunning: (isRunning: boolean) => void;
    setExecutionTime: (time: number | null) => void;
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: () => void;
    t: (key: TranslationKey) => string;
    getSystemTheme: () => 'light' | 'dark';
}

