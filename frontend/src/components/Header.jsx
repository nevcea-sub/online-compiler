import { useApp } from '../context/AppContext';

const Header = () => {
    const { setCurrentPage, t } = useApp();

    return (
        <header>
            <div className="container header-content">
                <h1>{t('title')}</h1>
                <div className="header-actions">
                    <button
                        className="settings-toggle"
                        onClick={() => setCurrentPage('settings')}
                        aria-label={t('settings')}
                        title={t('settings')}
                    >
                        {t('settings')}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;

