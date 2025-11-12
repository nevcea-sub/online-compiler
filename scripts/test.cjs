#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');
const args = process.argv.slice(2);

function quoteArg(arg) {
	if (/[\s"]/g.test(arg)) {
		return `"${arg.replace(/"/g, '\\"')}"`;
	}
	return arg;
}

try {
    if (isWindows) {
        const scriptPath = path.join(__dirname, 'test.ps1');
		const forwarded = args.map(quoteArg).join(' ');
		execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${forwarded}`, {
            stdio: 'inherit',
            cwd: rootDir
        });
    } else {
        console.log('Running tests...');

        console.log('Checking code formatting...');
        execSync('npm run format', { stdio: 'inherit', cwd: rootDir });
        execSync('npm run format:check', { stdio: 'inherit', cwd: rootDir });

        console.log('Running ESLint...');
        execSync('npm run lint', { stdio: 'inherit', cwd: rootDir });

        console.log('Running backend ESLint...');
        // use root eslint config explicitly
        execSync('npx eslint server.js -c ../eslint.config.js', { stdio: 'inherit', cwd: path.join(rootDir, 'backend') });

        console.log('[OK] All checks passed!');
    }
} catch (error) {
    console.error(`[ERROR] Error running script: ${error.message}`);
    process.exit(1);
}
