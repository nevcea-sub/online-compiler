Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-DockerCompose {
    if (docker compose version 2>$null) {
        return @{ Exe = 'docker'; Args = @('compose') }
    } elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        return @{ Exe = 'docker-compose'; Args = @() }
    } else {
        throw 'Docker Compose is not installed. Please install Docker Desktop or docker-compose.'
    }
}

function Test-Command {
    param([string]$Command, [string]$Name)
    try {
        $null = & $Command --version 2>$null
        return $true
    } catch {
        Write-Host "[ERROR] $Name is not installed. Please install $Name first." -ForegroundColor Red
        return $false
    }
}

function Load-EnvFile {
    param([string]$EnvPath)
    
    if (-not (Test-Path $EnvPath)) {
        return @{}
    }
    
    $env = @{}
    $content = Get-Content $EnvPath -Raw
    $lines = $content -split "`n"
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith('#')) {
            $parts = $trimmed -split '=', 2
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim() -replace '^["'']|["'']$', ''
                $env[$key] = $value
            }
        }
    }
    
    return $env
}

$envArg = if ($args -contains '--env') { 
    $index = [Array]::IndexOf($args, '--env')
    if ($index -lt $args.Length - 1) { $args[$index + 1] } else { 'production' }
} else { 
    'production' 
}

$skipTests = $args -contains '--skip-tests'
$skipDocker = $args -contains '--skip-docker'

Write-Host "Building for $envArg environment...`n" -ForegroundColor Cyan

Write-Host "Checking dependencies..." -ForegroundColor Blue
if (-not (Test-Command "node" "Node.js")) { exit 1 }
if (-not (Test-Command "npm" "npm")) { exit 1 }

$envFile = Join-Path $PSScriptRoot "..\.env.$envArg"
$defaultEnvFile = Join-Path $PSScriptRoot "..\.env"
$envVars = Load-EnvFile $defaultEnvFile
$envSpecific = Load-EnvFile $envFile
foreach ($key in $envSpecific.Keys) {
    $envVars[$key] = $envSpecific[$key]
}

if ($envVars.Count -gt 0) {
    Write-Host "Loaded environment variables from .env files" -ForegroundColor Green
    foreach ($key in $envVars.Keys) {
        [Environment]::SetEnvironmentVariable($key, $envVars[$key], "Process")
    }
}

if (-not $skipTests) {
    Write-Host "`nRunning tests..." -ForegroundColor Blue
    try {
        Push-Location (Join-Path $PSScriptRoot "..")
        npm run test
        if ($LASTEXITCODE -ne 0) {
            throw "Tests failed"
        }
        Write-Host "  All tests passed`n" -ForegroundColor Green
    } catch {
        Write-Host "  Tests failed. Use --skip-tests to skip." -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Host "`nSkipping tests (--skip-tests flag)`n" -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Blue
Push-Location (Join-Path $PSScriptRoot "..")
try {
    npm install --production=false
} finally {
    Pop-Location
}

Push-Location (Join-Path $PSScriptRoot "..\backend")
try {
    npm install --production=false
} finally {
    Pop-Location
}

Push-Location (Join-Path $PSScriptRoot "..\frontend")
try {
    npm install --production=false
} finally {
    Pop-Location
}

Write-Host "`nBuilding frontend..." -ForegroundColor Blue
$env:NODE_ENV = $envArg
Push-Location (Join-Path $PSScriptRoot "..\frontend")
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
    Write-Host "  Frontend build complete`n" -ForegroundColor Green
} finally {
    Pop-Location
}

if (-not $skipDocker) {
    Write-Host "Building Docker images..." -ForegroundColor Blue
    try {
        $compose = Resolve-DockerCompose
        $buildArgs = $compose.Args + @('build')
        Push-Location (Join-Path $PSScriptRoot "..")
        try {
            & $compose.Exe @buildArgs
            if ($LASTEXITCODE -ne 0) {
                throw "Docker build failed"
            }
            Write-Host "  Docker images built`n" -ForegroundColor Green
        } finally {
            Pop-Location
        }
    } catch {
        Write-Host "  Docker build failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nSkipping Docker build (--skip-docker flag)`n" -ForegroundColor Yellow
}

Write-Host "Build complete!`n" -ForegroundColor Green
Write-Host "Build artifacts:" -ForegroundColor Cyan
Write-Host "   Frontend: frontend/dist/" -ForegroundColor White
if (-not $skipDocker) {
    Write-Host "   Docker images: Ready for deployment" -ForegroundColor White
}
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "   Deploy: docker compose up -d" -ForegroundColor White
Write-Host "   Preview: cd frontend && npm run preview" -ForegroundColor White

