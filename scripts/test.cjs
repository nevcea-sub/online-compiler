#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');

try {
    if (isWindows) {
        const scriptPath = path.join(__dirname, 'test.ps1');
        execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, {
            stdio: 'inherit',
            cwd: rootDir
        });
    } else {
        console.log('Running tests...');
        
        console.log('Running ESLint...');
        execSync('npm run lint', { stdio: 'inherit', cwd: rootDir });
        
        console.log('Checking code formatting...');
        execSync('npm run format:check', { stdio: 'inherit', cwd: rootDir });
        
        console.log('Running backend ESLint...');
        execSync('npx eslint server.js', { stdio: 'inherit', cwd: path.join(rootDir, 'backend') });
        
        console.log('[OK] All checks passed!');
    }
} catch (error) {
    console.error(`[ERROR] Error running script: ${error.message}`);
    process.exit(1);
}
