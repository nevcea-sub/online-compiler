import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { FONT_CONFIG } from '../config/constants';

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

    return (
        <>
            <Header />
            <main className="container">
                <div className="settings-layout">
                    <div className="settings-header">
                        <h2>{t('settings-title')}</h2>
                        <button className="back-button" onClick={() => setCurrentPage('compiler')}>
                            {t('back')}
                        </button>
                    </div>
                    <div className="settings-content">
                        <div className="settings-section">
                            <h3>{t('language-settings')}</h3>
                            <div className="settings-item">
                                <label>{t('interface-language')}</label>
                                <select
                                    value={currentLang}
                                    onChange={(e) => setCurrentLang(e.target.value)}
                                >
                                    <option value="ko">{t('korean')}</option>
                                    <option value="en">{t('english')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="settings-section">
                            <h3>{t('theme-settings')}</h3>
                            <div className="settings-item">
                                <label>{t('theme')}</label>
                                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                                    <option value="system">{t('system-theme')}</option>
                                    <option value="dark">{t('dark-theme')}</option>
                                    <option value="light">{t('light-theme')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="settings-section">
                            <h3>{t('editor-settings')}</h3>
                            <div className="settings-item">
                                <label>{t('font-family')}</label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                >
                                    {Object.entries(FONT_CONFIG.families).map(([value, name]) => (
                                        <option key={value} value={value}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="settings-item">
                                <label>{t('font-size')}</label>
                                <div className="font-size-control">
                                    <input
                                        type="range"
                                        min="10"
                                        max="24"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                                        step="1"
                                    />
                                    <span>{fontSize}px</span>
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

