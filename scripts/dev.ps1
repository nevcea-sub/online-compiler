Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-LastExitCode {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        throw "Step failed: $Step (exit code $LASTEXITCODE)"
    }
}

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

function Wait-ForService {
    param(
        [string]$Url,
        [int]$Timeout = 30000,
        [int]$Interval = 1000
    )
    
    $startTime = Get-Date
    while ($true) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
        }
        
        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
        if ($elapsed -gt $Timeout) {
            throw "Service at $Url did not become available within $Timeout ms"
        }
        
        Start-Sleep -Milliseconds $Interval
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

Write-Host "Starting development environment...`n" -ForegroundColor Cyan

Write-Host "Checking dependencies..." -ForegroundColor Blue
if (-not (Test-Command "node" "Node.js")) { exit 1 }
if (-not (Test-Command "npm" "npm")) { exit 1 }
if (-not (Test-Command "docker" "Docker")) { exit 1 }

$envFile = Join-Path $PSScriptRoot "..\.env"
$envVars = Load-EnvFile $envFile
if ($envVars.Count -gt 0) {
    Write-Host "Loaded environment variables from .env" -ForegroundColor Green
    foreach ($key in $envVars.Keys) {
        [Environment]::SetEnvironmentVariable($key, $envVars[$key], "Process")
    }
}

Write-Host "`nInstalling dependencies..." -ForegroundColor Blue
if (-not (Test-Path "node_modules")) {
    npm install
    Assert-LastExitCode "npm install (root)"
} else {
    Write-Host "  Root dependencies already installed" -ForegroundColor Green
}

Push-Location backend
try {
    if (-not (Test-Path "node_modules")) {
        npm install
        Assert-LastExitCode "npm install (backend)"
    } else {
        Write-Host "  Backend dependencies already installed" -ForegroundColor Green
    }
} finally {
    Pop-Location
}

Push-Location frontend
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing frontend dependencies..." -ForegroundColor Blue
        npm install
        Assert-LastExitCode "npm install (frontend)"
    } else {
        Write-Host "  Frontend dependencies already installed" -ForegroundColor Green
    }
} finally {
    Pop-Location
}

Write-Host "`nBuilding Docker images..." -ForegroundColor Blue
$compose = Resolve-DockerCompose
$buildArgs = $compose.Args + @('build')
& $compose.Exe @buildArgs
Assert-LastExitCode "docker compose build"

Write-Host "`nStarting services..." -ForegroundColor Blue
$upArgs = $compose.Args + @('up','-d')
& $compose.Exe @upArgs
Assert-LastExitCode "docker compose up -d"

Write-Host "`nWaiting for backend to be ready..." -ForegroundColor Blue
try {
    Wait-ForService -Url "http://localhost:3000/health" -Timeout 30000
    Write-Host "  Backend is ready" -ForegroundColor Green
} catch {
    Write-Host "  Backend health check failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "`nDevelopment environment is ready!`n" -ForegroundColor Green
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "`nUseful commands:" -ForegroundColor Yellow
Write-Host "   Stop services: docker compose down" -ForegroundColor White
Write-Host "   View logs: docker compose logs -f" -ForegroundColor White
Write-Host "   Restart: docker compose restart`n" -ForegroundColor White

Write-Host "Starting frontend dev server...`n" -ForegroundColor Blue
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "To view logs: docker compose logs -f" -ForegroundColor Yellow
