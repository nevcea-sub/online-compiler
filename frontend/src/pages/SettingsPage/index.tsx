import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import Header from '../../components/Header';
import LanguageSettings from '../../components/settings/LanguageSettings';
import ThemeSettings from '../../components/settings/ThemeSettings';
import EditorSettings from '../../components/settings/EditorSettings';
import './styles.css';

const SettingsPage = () => {
    const { t } = useApp();
    const navigate = useNavigate();

    return (
        <>
            <Header />
            <main className="container">
                <div className="settings-layout">
                    <div className="settings-header">
                        <h2>{t('settings-title')}</h2>
                        <button
                            className="back-button"
                            onClick={() => navigate('/')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            <span>{t('back')}</span>
                        </button>
                    </div>
                    <div className="settings-content">
                        <LanguageSettings />
                        <ThemeSettings />
                        <EditorSettings />
                    </div>
                </div>
            </main>
        </>
    );
};

export default SettingsPage;

