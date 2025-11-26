#!/usr/bin/env node
import path from 'path';
import { execFileSync } from 'child_process';
import { isWindows, rootDir, runPs1, checkCommand, resolveDockerComposeCommand, loadEnvFile } from './shared';

const args = process.argv.slice(2);

try {
	if (isWindows) {
		runPs1('build.ps1', args);
	} else {
		const env = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'production';
		const skipTests = args.includes('--skip-tests');
		const skipDocker = args.includes('--skip-docker');

		console.log(`Building for ${env} environment...\n`);

		console.log('Checking dependencies...');
		if (!checkCommand('node', 'Node.js')) { process.exit(1); }
		if (!checkCommand('npm', 'npm')) { process.exit(1); }

		const envFile = path.join(rootDir, `.env.${env}`);
		const defaultEnvFile = path.join(rootDir, '.env');
		const envVars = { ...loadEnvFile(defaultEnvFile), ...loadEnvFile(envFile) };
		if (Object.keys(envVars).length > 0) {
			console.log('Loaded environment variables from .env files');
			Object.assign(process.env, envVars);
		}

		if (!skipTests) {
			console.log('\nRunning tests...');
			try {
				execFileSync('npm', ['run', 'test'], { stdio: 'inherit', cwd: rootDir });
				console.log('  All tests passed\n');
			} catch {
				console.error('  Tests failed. Use --skip-tests to skip.');
				process.exit(1);
			}
		} else {
			console.log('\nSkipping tests (--skip-tests flag)\n');
		}

		console.log('Installing dependencies...');
		execFileSync('npm', ['install', '--production=false'], { stdio: 'inherit', cwd: rootDir });
		execFileSync('npm', ['install', '--production=false'], { stdio: 'inherit', cwd: path.join(rootDir, 'backend') });
		execFileSync('npm', ['install', '--production=false'], { stdio: 'inherit', cwd: path.join(rootDir, 'frontend') });

		console.log('\nBuilding frontend...');
		process.env.NODE_ENV = env;
		execFileSync('npm', ['run', 'build'], { stdio: 'inherit', cwd: path.join(rootDir, 'frontend') });
		console.log('  Frontend build complete\n');

		if (!skipDocker) {
			console.log('Building Docker images...');
			const composeCmd = resolveDockerComposeCommand();
			if (composeCmd === 'docker compose') {
				execFileSync('docker', ['compose', 'build'], { stdio: 'inherit', cwd: rootDir });
			} else {
				execFileSync('docker-compose', ['build'], { stdio: 'inherit', cwd: rootDir });
			}
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
} catch (error: unknown) {
	const err = error as Error;
	console.error(`\n[ERROR] ${err.message}`);
	if (err.stack) {
		console.error(err.stack);
	}
	process.exit(1);
}

