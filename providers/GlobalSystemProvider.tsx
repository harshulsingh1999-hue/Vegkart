
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Locale } from '../data/translations';

interface GlobalSystemContextType {
    language: Locale;
    setLanguage: (lang: Locale) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isOnline: boolean;
    t: (key: keyof typeof translations['en']) => string;
}

const GlobalSystemContext = createContext<GlobalSystemContextType | undefined>(undefined);

export const GlobalSystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Language State
    const [language, setLanguageState] = useState<Locale>(() => {
        return (localStorage.getItem('sys_lang') as Locale) || 'en';
    });

    const setLanguage = (lang: Locale) => {
        setLanguageState(lang);
        localStorage.setItem('sys_lang', lang);
    };

    // 2. Theme State
    const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('sys_theme') as 'light' | 'dark') || 'light';
    });

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        localStorage.setItem('sys_theme', newTheme);
        
        // Apply class to HTML tag for Tailwind Dark Mode
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Apply theme on mount
    useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
    }, []);

    // 3. Translation Helper
    const t = (key: keyof typeof translations['en']): string => {
        return translations[language][key] || translations['en'][key] || key;
    };

    // 4. Network Status
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <GlobalSystemContext.Provider value={{ language, setLanguage, theme, toggleTheme, isOnline, t }}>
            {children}
        </GlobalSystemContext.Provider>
    );
};

export const useGlobalSystem = () => {
    const context = useContext(GlobalSystemContext);
    if (!context) {
        throw new Error("useGlobalSystem must be used within a GlobalSystemProvider");
    }
    return context;
};
