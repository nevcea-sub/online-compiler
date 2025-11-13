import { AppProvider } from './context/AppContext';
import CompilerPage from './pages/CompilerPage';
import SettingsPage from './pages/SettingsPage';
import { useApp } from './context/AppContext';
import Toast from './components/Toast';

const AppContent = () => {
    const { currentPage, toast, hideToast } = useApp();

    return (
        <>
            {currentPage === 'compiler' && <CompilerPage />}
            {currentPage === 'settings' && <SettingsPage />}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={hideToast}
                />
            )}
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

