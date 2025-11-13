Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-LastExitCode {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        throw "Step failed: $Step (exit code $LASTEXITCODE)"
    }
}

function Run-Command {
    param(
        [string]$Command,
        [string]$Cwd,
        [string]$Description
    )
    
    try {
        Write-Host "`n$Description..." -ForegroundColor Blue
        Push-Location $Cwd
        try {
            Invoke-Expression $Command
            Assert-LastExitCode $Description
            Write-Host "  $Description passed`n" -ForegroundColor Green
            return $true
        } finally {
            Pop-Location
        }
    } catch {
        Write-Host "  $Description failed`n" -ForegroundColor Red
        return $false
    }
}

Write-Host "Running tests and checks...`n" -ForegroundColor Cyan

$allPassed = $true
$startTime = Get-Date

if (-not (Run-Command -Command "npm run format" -Cwd (Join-Path $PSScriptRoot "..") -Description "Formatting code")) {
    $allPassed = $false
}

if (-not (Run-Command -Command "npm run format:check" -Cwd (Join-Path $PSScriptRoot "..") -Description "Checking code formatting")) {
    $allPassed = $false
}

if (-not (Run-Command -Command "npm run lint" -Cwd (Join-Path $PSScriptRoot "..") -Description "Running root ESLint")) {
    $allPassed = $false
}

if (-not (Run-Command -Command "npx eslint server.js -c ../eslint.config.js" -Cwd (Join-Path $PSScriptRoot "..\backend") -Description "Running backend ESLint")) {
    $allPassed = $false
}

if (-not (Run-Command -Command "npm install" -Cwd (Join-Path $PSScriptRoot "..\frontend") -Description "Installing frontend dependencies")) {
    $allPassed = $false
}

if (-not (Run-Command -Command "npm run lint" -Cwd (Join-Path $PSScriptRoot "..\frontend") -Description "Running frontend ESLint")) {
    $allPassed = $false
}

$frontendPackageJson = Get-Content (Join-Path $PSScriptRoot "..\frontend\package.json") | ConvertFrom-Json
if ($frontendPackageJson.devDependencies.PSObject.Properties.Name -contains "typescript") {
    if (-not (Run-Command -Command "npx tsc --noEmit" -Cwd (Join-Path $PSScriptRoot "..\frontend") -Description "Running TypeScript type check")) {
        $allPassed = $false
    }
}

$duration = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 2)

Write-Host ("=" * 50) -ForegroundColor Gray
if ($allPassed) {
    Write-Host "`nAll checks passed! ($duration s)`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome checks failed. Please fix the errors above. ($duration s)`n" -ForegroundColor Red
    exit 1
}
