#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { isWindows, rootDir, runPs1, resolveDockerComposeCommand } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.join(__dirname, 'clean.ps1');
const args = process.argv.slice(2);

function removeDirIfExists(targetPath: string): boolean {
	try {
		if (fs.existsSync(targetPath)) {
			fs.rmSync(targetPath, { recursive: true, force: true });
			return true;
		}
		return false;
	} catch (error: unknown) {
		const err = error as Error;
		console.warn(`  Warning: Could not remove ${targetPath}: ${err.message}`);
		return false;
	}
}

function emptyDirIfExists(targetPath: string): void {
	if (!fs.existsSync(targetPath)) {
		return;
	}
	try {
		const entries = fs.readdirSync(targetPath, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.name === '.gitkeep') {
				continue;
			}
			const full = path.join(targetPath, entry.name);
			removeDirIfExists(full);
		}
	} catch (error: unknown) {
		const err = error as Error;
		console.warn(`  Warning: Could not empty ${targetPath}: ${err.message}`);
	}
}

function removeLogsRecursively(startDir: string): number {
	const stack = [startDir];
	let removedCount = 0;

	while (stack.length) {
		const current = stack.pop();
		if (!current) continue;

		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(current, { withFileTypes: true });
		} catch {
			continue;
		}

		for (const entry of entries) {
			const full = path.join(current, entry.name);

			if (entry.name === 'node_modules' ||
				entry.name === '.git' ||
				entry.name === 'dist' ||
				entry.name === 'build') {
				continue;
			}

			if (entry.isDirectory()) {
				stack.push(full);
			} else if (entry.isFile() && entry.name.endsWith('.log')) {
				try {
					fs.unlinkSync(full);
					removedCount++;
				} catch {
				}
			}
		}
	}

	return removedCount;
}

function getDirSize(dirPath: string): number {
	if (!fs.existsSync(dirPath)) {
		return 0;
	}

	let size = 0;
	const stack = [dirPath];

	while (stack.length) {
		const current = stack.pop();
		if (!current) continue;

		try {
			const entries = fs.readdirSync(current, { withFileTypes: true });
			for (const entry of entries) {
				const full = path.join(current, entry.name);
				if (entry.isDirectory()) {
					stack.push(full);
				} else {
					try {
						const stats = fs.statSync(full);
						size += stats.size;
					} catch {
					}
				}
			}
		} catch {
		}
	}

	return size;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) { return '0 B'; }
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

try {
	if (isWindows) {
		execFileSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args], {
			stdio: 'inherit',
			cwd: rootDir
		});
	} else {
		const force = args.includes('--force') || args.includes('-f');

		if (!force) {
			console.log('This will remove:');
			console.log('   - node_modules directories');
			console.log('   - dist/build directories');
			console.log('   - log files');
			console.log('   - temporary files (backend/code, backend/output)');
			console.log('   - Docker containers and volumes\n');
			console.log('Use --force or -f to skip this confirmation.\n');
		}

		console.log('Cleaning up...\n');

		let totalFreed = 0;

		const composeCmd = resolveDockerComposeCommand();
		if (composeCmd) {
			console.log('Stopping Docker containers...');
			try {
				if (composeCmd === 'docker compose') {
					execFileSync('docker', ['compose', 'down', '-v'], { stdio: 'inherit', cwd: rootDir });
				} else {
					execFileSync('docker-compose', ['down', '-v'], { stdio: 'inherit', cwd: rootDir });
				}
				console.log('  Docker containers stopped\n');
			} catch {
				console.log('  Could not stop Docker containers (may not be running)\n');
			}
		}

		console.log('Removing node_modules...');
		const nodeModulesDirs = [
			path.join(rootDir, 'node_modules'),
			path.join(rootDir, 'backend', 'node_modules'),
			path.join(rootDir, 'frontend', 'node_modules')
		];

		for (const dir of nodeModulesDirs) {
			if (fs.existsSync(dir)) {
				const size = getDirSize(dir);
				if (removeDirIfExists(dir)) {
					console.log(`  Removed ${path.relative(rootDir, dir)} (${formatBytes(size)})`);
					totalFreed += size;
				}
			}
		}
		console.log('');

		console.log('Removing build outputs...');
		const buildDirs = [
			path.join(rootDir, 'dist'),
			path.join(rootDir, 'build'),
			path.join(rootDir, 'frontend', 'dist'),
			path.join(rootDir, 'frontend', 'build')
		];

		for (const dir of buildDirs) {
			if (fs.existsSync(dir)) {
				const size = getDirSize(dir);
				if (removeDirIfExists(dir)) {
					console.log(`  Removed ${path.relative(rootDir, dir)} (${formatBytes(size)})`);
					totalFreed += size;
				}
			}
		}
		console.log('');

		console.log('Removing log files...');
		const logCount = removeLogsRecursively(rootDir);
		console.log(`  Removed ${logCount} log file(s)\n`);

		console.log('Removing temporary files...');
		emptyDirIfExists(path.join(rootDir, 'backend', 'code'));
		emptyDirIfExists(path.join(rootDir, 'backend', 'output'));
		console.log('  Temporary files removed\n');

		console.log('Removing cache directories...');
		const cacheDirs = [
			path.join(rootDir, '.cache'),
			path.join(rootDir, '.parcel-cache'),
			path.join(rootDir, 'frontend', '.vite'),
			path.join(rootDir, 'backend', 'tool_cache')
		];

		for (const dir of cacheDirs) {
			if (fs.existsSync(dir)) {
				const size = getDirSize(dir);
				if (removeDirIfExists(dir)) {
					console.log(`  Removed ${path.relative(rootDir, dir)} (${formatBytes(size)})`);
					totalFreed += size;
				}
			}
		}
		console.log('');

		console.log('Cleanup complete!');
		if (totalFreed > 0) {
			console.log(`Total space freed: ${formatBytes(totalFreed)}`);
		}
	}
} catch (error: unknown) {
	const err = error as Error;
	console.error(`\n[ERROR] ${err.message}`);
	process.exit(1);
}

