#!/usr/bin/env node

const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');

function runPs1(scriptName, args = []) {
	execFileSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, scriptName), ...args], {
		stdio: 'inherit',
		cwd: rootDir
	});
}

function checkCommand(command, name) {
	try {
		execSync(`${command} --version`, { stdio: 'ignore' });
		return true;
	} catch {
		console.error(`[ERROR] ${name} is not installed. Please install ${name} first.`);
		return false;
	}
}

function resolveDockerComposeCommand(options = {}) {
	const { allowMissing = false } = options;
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
		if (allowMissing) {
			return null;
		}
		throw new Error('Docker Compose is not installed. Please install Docker Desktop or docker-compose.');
	}
}

function loadEnvFile(envPath) {
	if (!fs.existsSync(envPath)) {
		return {};
	}

	const env = {};
	const content = fs.readFileSync(envPath, 'utf-8');
	const lines = content.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith('#')) {
			const [key, ...valueParts] = trimmed.split('=');
			if (key && valueParts.length > 0) {
				env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
			}
		}
	}

	return env;
}

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
		execFileSync(cmd, args, { stdio: 'inherit', cwd });
		console.log(`  ${description} passed\n`);
		return true;
	} catch (e) {
		console.error(`  ${description} failed\n`);
		return false;
	}
}

module.exports = {
	isWindows,
	rootDir,
	runPs1,
	checkCommand,
	resolveDockerComposeCommand,
	loadEnvFile,
	runCommand
};


