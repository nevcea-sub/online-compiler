import { execSync, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const isWindows = process.platform === 'win32';
export const rootDir = path.join(__dirname, '..');

export function runPs1(scriptName: string, args: string[] = []): void {
	execFileSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, scriptName), ...args], {
		stdio: 'inherit',
		cwd: rootDir
	});
}

export function checkCommand(command: string, name: string): boolean {
	try {
		execSync(`${command} --version`, { stdio: 'ignore' });
		return true;
	} catch {
		console.error(`[ERROR] ${name} is not installed. Please install ${name} first.`);
		return false;
	}
}

export function resolveDockerComposeCommand(options: { allowMissing?: boolean } = {}): string | null {
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

export function loadEnvFile(envPath: string): Record<string, string> {
	if (!fs.existsSync(envPath)) {
		return {};
	}

	const env: Record<string, string> = {};
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

