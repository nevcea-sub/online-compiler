#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');
const scriptPath = path.join(__dirname, 'clean.ps1');
const args = process.argv.slice(2);

function resolveDockerComposeCommand() {
	try {
		execSync('docker compose version', { stdio: 'ignore' });
		return 'docker compose';
	} catch {
		void 0;
	}
	try {
		execSync('docker-compose --version', { stdio: 'ignore' });
		return 'docker-compose';
	} catch {
		return null;
	}
}

function removeDirIfExists(targetPath) {
	try {
		if (fs.existsSync(targetPath)) {
			fs.rmSync(targetPath, { recursive: true, force: true });
			return true;
		}
		return false;
	} catch (error) {
		console.warn(`  Warning: Could not remove ${targetPath}: ${error.message}`);
		return false;
	}
}

function emptyDirIfExists(targetPath) {
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
		} catch (error) {
			console.warn(`  Warning: Could not empty ${targetPath}: ${error.message}`);
		}
}

function removeLogsRecursively(startDir) {
	const stack = [startDir];
	let removedCount = 0;

	while (stack.length) {
		const current = stack.pop();
		let entries;
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

function getDirSize(dirPath) {
	if (!fs.existsSync(dirPath)) {
		return 0;
	}

	let size = 0;
	const stack = [dirPath];

	while (stack.length) {
		const current = stack.pop();
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

function formatBytes(bytes) {
	if (bytes === 0) {return '0 B';}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

try {
	if (isWindows) {
		const { execFileSync } = require('child_process');
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
				const { execFileSync } = require('child_process');
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
} catch (error) {
	console.error(`\n[ERROR] ${error.message}`);
	process.exit(1);
}
