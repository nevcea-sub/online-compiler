import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:4000';
const FRONTEND_PORT = Number(process.env.VITE_FRONTEND_PORT || 5173);

export default defineConfig({
    plugins: [react()],
    server: {
        port: FRONTEND_PORT,
        host: true,
        fs: {
            allow: ['..', '../node_modules']
        },
        proxy: {
            '/api': {
                target: BACKEND_URL,
                changeOrigin: true
            }
        }
    },
    preview: {
        port: FRONTEND_PORT,
        host: true
    }
});
