Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-LastExitCode {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Step (exit code $LASTEXITCODE)"
    }
}

Write-Host "Running tests..." -ForegroundColor Cyan

Write-Host "Checking code formatting..." -ForegroundColor Blue
npm run format
Assert-LastExitCode "npm run format"
npm run format:check
Assert-LastExitCode "npm run format:check"

Write-Host "Running ESLint..." -ForegroundColor Blue
npm run lint
Assert-LastExitCode "npm run lint"

Write-Host "Running backend ESLint..." -ForegroundColor Blue
Push-Location backend
try {
    # use root eslint config explicitly to avoid cwd-based defaults
    npx eslint server.js -c ../eslint.config.js
    Assert-LastExitCode "npx eslint backend/server.js"
} finally {
    Pop-Location
}

Write-Host "[OK] All checks passed!" -ForegroundColor Green

