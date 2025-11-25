#!/usr/bin/env node

const path = require('path');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');
const args = process.argv.slice(2);

function splitCommand(cmd) {
	const parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
	return parts.map((p) => p.replace(/^"|"$/g, ''));
}

function runCommand(command, cwd, description) {
	try {
		console.log(`\n${description}...`);
		const parts = Array.isArray(command) ? command : splitCommand(command);
		const cmd = parts[0];
		const args = parts.slice(1);
		const { execFileSync } = require('child_process');
		execFileSync(cmd, args, { stdio: 'inherit', cwd });
		console.log(`  ${description} passed\n`);
		return true;
	// eslint-disable-next-line no-unused-vars
	} catch (_) {
		console.error(`  ${description} failed\n`);
		return false;
	}
}

try {
	if (isWindows) {
		const scriptPath = path.join(__dirname, 'test.ps1');
		const { execFileSync } = require('child_process');
		execFileSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args], {
			stdio: 'inherit',
			cwd: rootDir
		});
	} else {
		console.log('Running tests and checks...\n');

		let allPassed = true;
		const startTime = Date.now();

		if (!runCommand('npm run format', rootDir, 'Formatting code')) {
			allPassed = false;
		}

		if (!runCommand('npm run format:check', rootDir, 'Checking code formatting')) {
			allPassed = false;
		}

		if (!runCommand('npm run lint', rootDir, 'Running root ESLint')) {
			allPassed = false;
		}

		if (!runCommand('npx eslint server.ts -c ../eslint.config.js',
		                path.join(rootDir, 'backend'),
		                'Running backend ESLint')) {
			allPassed = false;
		}

		if (!runCommand('npm run test',
		                path.join(rootDir, 'backend'),
		                'Running backend tests')) {
			allPassed = false;
		}

		if (!runCommand('npm install',
		                path.join(rootDir, 'frontend'),
		                'Installing frontend dependencies')) {
			allPassed = false;
		}

		if (!runCommand('npm run lint',
		                path.join(rootDir, 'frontend'),
		                'Running frontend ESLint')) {
			allPassed = false;
		}

		const frontendPackageJson = require(path.join(rootDir, 'frontend', 'package.json'));
		if (frontendPackageJson.devDependencies?.typescript) {
			// Clean up any .d.ts files in src directory before type check
			const fs = require('fs');
			const srcDir = path.join(rootDir, 'frontend', 'src');

			function deleteDtsFiles(dir) {
				if (!fs.existsSync(dir)) {
					return;
				}
				const files = fs.readdirSync(dir);
				files.forEach(file => {
					const filePath = path.join(dir, file);
					const stat = fs.statSync(filePath);
					if (stat.isDirectory()) {
						deleteDtsFiles(filePath);
					} else if (file.endsWith('.d.ts') && file !== 'vite-env.d.ts') {
						try {
							fs.unlinkSync(filePath);
						} catch {
							// Ignore errors
						}
					}
				});
			}

			deleteDtsFiles(srcDir);

			if (!runCommand('npx tsc --noEmit',
			                path.join(rootDir, 'frontend'),
			                'Running TypeScript type check')) {
				allPassed = false;
			}
		}

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		console.log('='.repeat(50));
		if (allPassed) {
			console.log(`\nAll checks passed! (${duration}s)\n`);
			process.exit(0);
		} else {
			console.log(`\nSome checks failed. Please fix the errors above. (${duration}s)\n`);
			process.exit(1);
		}
	}
} catch (error) {
	console.error(`\n[ERROR] ${error.message}`);
	process.exit(1);
}
