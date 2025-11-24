import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import CompilerPage from './pages/CompilerPage/index';
import SettingsPage from './pages/SettingsPage/index';
import { useApp } from './context/useApp';
import Toast from './components/Toast';

const AppContent = () => {
    const { toast, hideToast } = useApp();

    return (
        <>
            <Routes>
                <Route path="/" element={<CompilerPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
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
        <BrowserRouter>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </BrowserRouter>
    );
}

export default App;

