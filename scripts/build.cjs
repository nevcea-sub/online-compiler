#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');
const scriptPath = path.join(__dirname, 'build.ps1');
const args = process.argv.slice(2);

function quoteArg(arg) {
	if (/[\s"]/g.test(arg)) {
		return `"${arg.replace(/"/g, '\\"')}"`;
	}
	return arg;
}

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
		throw new Error('Docker Compose is not installed. Please install Docker Desktop or docker-compose.');
	}
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

try {
	if (isWindows) {
		const forwarded = args.map(quoteArg).join(' ');
		execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${forwarded}`, {
			stdio: 'inherit',
			cwd: rootDir
		});
	} else {
		const env = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'production';
		const skipTests = args.includes('--skip-tests');
		const skipDocker = args.includes('--skip-docker');
		
		console.log(`Building for ${env} environment...\n`);
		
		console.log('Checking dependencies...');
		if (!checkCommand('node', 'Node.js')) process.exit(1);
		if (!checkCommand('npm', 'npm')) process.exit(1);
		
		const envFile = path.join(rootDir, `.env.${env}`);
		const defaultEnvFile = path.join(rootDir, '.env');
		const envVars = { ...loadEnvFile(defaultEnvFile), ...loadEnvFile(envFile) };
		if (Object.keys(envVars).length > 0) {
			console.log(`Loaded environment variables from .env files`);
			Object.assign(process.env, envVars);
		}
		
		if (!skipTests) {
			console.log('\nRunning tests...');
			try {
				execSync('npm run test', { stdio: 'inherit', cwd: rootDir });
				console.log('  All tests passed\n');
			} catch {
				console.error('  Tests failed. Use --skip-tests to skip.');
				process.exit(1);
			}
		} else {
			console.log('\nSkipping tests (--skip-tests flag)\n');
		}
		
		console.log('Installing dependencies...');
		execSync('npm install --production=false', { stdio: 'inherit', cwd: rootDir });
		execSync('npm install --production=false', { stdio: 'inherit', cwd: path.join(rootDir, 'backend') });
		execSync('npm install --production=false', { stdio: 'inherit', cwd: path.join(rootDir, 'frontend') });
		
		console.log('\nBuilding frontend...');
		process.env.NODE_ENV = env;
		execSync('npm run build', { stdio: 'inherit', cwd: path.join(rootDir, 'frontend') });
		console.log('  Frontend build complete\n');
		
		if (!skipDocker) {
			console.log('Building Docker images...');
			const composeCmd = resolveDockerComposeCommand();
			execSync(`${composeCmd} build`, { stdio: 'inherit', cwd: rootDir });
			console.log('  Docker images built\n');
		} else {
			console.log('\nSkipping Docker build (--skip-docker flag)\n');
		}
		
		console.log('Build complete!\n');
		console.log('Build artifacts:');
		console.log('   Frontend: frontend/dist/');
		if (!skipDocker) {
			console.log('   Docker images: Ready for deployment');
		}
		console.log('\nNext steps:');
		console.log('   Deploy: docker compose up -d');
		console.log('   Preview: cd frontend && npm run preview');
	}
} catch (error) {
	console.error(`\n[ERROR] ${error.message}`);
	if (error.stack) {
		console.error(error.stack);
	}
	process.exit(1);
}

