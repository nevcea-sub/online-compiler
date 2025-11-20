#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { isWindows, rootDir, runPs1, checkCommand, resolveDockerComposeCommand, loadEnvFile } = require('./shared.cjs');

const args = process.argv.slice(2);

function waitForService(url, timeout = 30000, interval = 1000) {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		const check = async () => {
			try {
				const response = await fetch(url);
				if (response.ok) {
					resolve(true);
					return;
				}
			} catch {
			}

			if (Date.now() - startTime > timeout) {
				reject(new Error(`Service at ${url} did not become available within ${timeout}ms`));
				return;
			}

			setTimeout(check, interval);
		};
		check();
	});
}

try {
	if (isWindows) {
		runPs1('dev.ps1', args);
	} else {
		console.log('Starting development environment...\n');

		console.log('Checking dependencies...');
		if (!checkCommand('node', 'Node.js')) {process.exit(1);}
		if (!checkCommand('npm', 'npm')) {process.exit(1);}
		if (!checkCommand('docker', 'Docker')) {process.exit(1);}

		const envFile = path.join(rootDir, '.env');
		const env = loadEnvFile(envFile);
		if (Object.keys(env).length > 0) {
			console.log('Loaded environment variables from .env');
			Object.assign(process.env, env);
		}

		console.log('\nInstalling dependencies...');
		if (!fs.existsSync(path.join(rootDir, 'node_modules'))) {
			execSync('npm install', { stdio: 'inherit', cwd: rootDir });
		} else {
			console.log('  Root dependencies already installed');
		}

		if (!fs.existsSync(path.join(rootDir, 'backend', 'node_modules'))) {
			execSync('npm install', { stdio: 'inherit', cwd: path.join(rootDir, 'backend') });
		} else {
			console.log('  Backend dependencies already installed');
		}

		if (!fs.existsSync(path.join(rootDir, 'frontend', 'node_modules'))) {
			execSync('npm install', { stdio: 'inherit', cwd: path.join(rootDir, 'frontend') });
		} else {
			console.log('  Frontend dependencies already installed');
		}

		const composeCmd = resolveDockerComposeCommand();
		console.log('\nBuilding Docker images...');
		const { execFileSync } = require('child_process');
		if (composeCmd === 'docker compose') {
			execFileSync('docker', ['compose', 'build'], { stdio: 'inherit', cwd: rootDir });
		} else {
			execFileSync('docker-compose', ['build'], { stdio: 'inherit', cwd: rootDir });
		}

		console.log('\nStarting services...');
		if (composeCmd === 'docker compose') {
			execFileSync('docker', ['compose', 'up', '-d'], { stdio: 'inherit', cwd: rootDir });
		} else {
			execFileSync('docker-compose', ['up', '-d'], { stdio: 'inherit', cwd: rootDir });
		}

		const backendPort = process.env.BACKEND_PORT || process.env.PORT || 3000;

		console.log('\nWaiting for backend to be ready...');
		waitForService(`http://localhost:${backendPort}/health`, 30000)
			.then(() => {
				console.log('  Backend is ready');
			})
			.catch(() => {
				console.warn('  Backend health check failed, but continuing...');
			});

		const frontendPort = process.env.FRONTEND_PORT || 5173;

		console.log('\nDevelopment environment is ready!\n');
		console.log('Service URLs:');
		console.log(`   Frontend: http://localhost:${frontendPort}`);
		console.log(`   Backend API: http://localhost:${backendPort}`);
		console.log('\nUseful commands:');
		console.log('   Stop services: docker compose down');
		console.log('   View logs: docker compose logs -f');
		console.log('   Restart: docker compose restart\n');

		console.log('Starting frontend dev server...\n');
		const frontendProcess = spawn('npm', ['run', 'dev'], {
			cwd: path.join(rootDir, 'frontend'),
			stdio: 'inherit',
			shell: false,
			env: { ...process.env }
		});

		const cleanup = () => {
			console.log('\n\nShutting down...');
			frontendProcess.kill();
			process.exit(0);
		};

		process.on('SIGINT', cleanup);
		process.on('SIGTERM', cleanup);

		frontendProcess.on('exit', (code) => {
			if (code !== 0 && code !== null) {
				console.error(`\n[ERROR] Frontend process exited with code ${code}`);
				process.exit(code);
			}
		});
	}
} catch (error) {
	console.error(`\n[ERROR] ${error.message}`);
	if (error.stack) {
		console.error(error.stack);
	}
	process.exit(1);
}
