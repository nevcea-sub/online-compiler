#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { isWindows, rootDir } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

function splitCommand(cmd: string): string[] {
	const parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
	return parts.map((p) => p.replace(/^"|"$/g, ''));
}

function runCommand(command: string | string[], cwd: string, description: string): boolean {
	try {
		console.log(`\n${description}...`);
		const parts = Array.isArray(command) ? command : splitCommand(command);
		const cmd = parts[0];
		const cmdArgs = parts.slice(1);
		execFileSync(cmd, cmdArgs, { stdio: 'inherit', cwd });
		console.log(`  ${description} passed\n`);
		return true;
	} catch (_) {
		console.error(`  ${description} failed\n`);
		return false;
	}
}

try {
	if (isWindows) {
		const scriptPath = path.join(__dirname, 'test.ps1');
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

		const frontendPackageJsonPath = path.join(rootDir, 'frontend', 'package.json');
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const frontendPackageJson = JSON.parse(fs.readFileSync(frontendPackageJsonPath, 'utf-8'));

		if (frontendPackageJson.devDependencies?.typescript) {
			// Clean up any .d.ts files in src directory before type check
			const srcDir = path.join(rootDir, 'frontend', 'src');

			const deleteDtsFiles = (dir: string) => {
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
			};

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
} catch (error: unknown) {
	const err = error as Error;
	console.error(`\n[ERROR] ${err.message}`);
	process.exit(1);
}

