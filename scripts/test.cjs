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

function runCommand(command, cwd, description) {
	try {
		console.log(`\n${description}...`);
		execSync(command, { stdio: 'inherit', cwd });
		console.log(`  ${description} passed\n`);
		return true;
	} catch (error) {
		console.error(`  ${description} failed\n`);
		return false;
	}
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
		
		if (!runCommand('npx eslint server.js -c ../eslint.config.js', 
		                path.join(rootDir, 'backend'), 
		                'Running backend ESLint')) {
			allPassed = false;
		}
		
		if (!runCommand('npm run lint', 
		                path.join(rootDir, 'frontend'), 
		                'Running frontend ESLint')) {
			allPassed = false;
		}
		
		const frontendPackageJson = require(path.join(rootDir, 'frontend', 'package.json'));
		if (frontendPackageJson.devDependencies?.typescript) {
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
