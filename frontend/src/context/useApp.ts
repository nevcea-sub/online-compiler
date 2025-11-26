import { useContext } from 'react';
import { AppContext } from './AppContext';
import type { AppContextType } from '../types';

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};
