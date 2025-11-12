import { AppProvider } from './context/AppContext';
import CompilerPage from './pages/CompilerPage';
import SettingsPage from './pages/SettingsPage';
import { useApp } from './context/AppContext';
import './styles/index.css';

const AppContent = () => {
    const { currentPage } = useApp();

    return (
        <>
            {currentPage === 'compiler' && <CompilerPage />}
            {currentPage === 'settings' && <SettingsPage />}
        </>
    );
};

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
