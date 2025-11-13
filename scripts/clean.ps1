Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-DockerCompose {
    if (docker compose version 2>$null) {
        return @{ Exe = 'docker'; Args = @('compose') }
    } elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        return @{ Exe = 'docker-compose'; Args = @() }
    } else {
        return $null
    }
}

function Get-DirectorySize {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        return 0
    }
    
    $size = 0
    try {
        $items = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            $size += $item.Length
        }
    } catch {
    }
    
    return $size
}

function Format-Bytes {
    param([long]$Bytes)
    
    if ($Bytes -eq 0) { return "0 B" }
    $units = @("B", "KB", "MB", "GB")
    $i = [Math]::Floor([Math]::Log($Bytes, 1024))
    $size = [Math]::Round($Bytes / [Math]::Pow(1024, $i) * 100) / 100
    return "$size $($units[$i])"
}

$force = $args -contains '--force' -or $args -contains '-f'

if (-not $force) {
    Write-Host "This will remove:" -ForegroundColor Yellow
    Write-Host "   - node_modules directories" -ForegroundColor White
    Write-Host "   - dist/build directories" -ForegroundColor White
    Write-Host "   - log files" -ForegroundColor White
    Write-Host "   - temporary files (backend/code, backend/output)" -ForegroundColor White
    Write-Host "   - Docker containers and volumes`n" -ForegroundColor White
    Write-Host "Use --force or -f to skip this confirmation.`n" -ForegroundColor Yellow
}

Write-Host "Cleaning up...`n" -ForegroundColor Cyan

$totalFreed = 0

Write-Host "Stopping Docker containers..." -ForegroundColor Blue
$compose = Resolve-DockerCompose
if ($compose -ne $null) {
    try {
        $downArgs = $compose.Args + @('down','-v')
        & $compose.Exe @downArgs 2>$null
        Write-Host "  Docker containers stopped`n" -ForegroundColor Green
    } catch {
        Write-Host "  Could not stop Docker containers (may not be running)`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Docker Compose not found, skipping`n" -ForegroundColor Yellow
}

Write-Host "Removing node_modules..." -ForegroundColor Blue
$nodeModulesDirs = @(
    "node_modules",
    "backend\node_modules",
    "frontend\node_modules"
)

foreach ($dir in $nodeModulesDirs) {
    $fullPath = Join-Path $PSScriptRoot "..\$dir"
    if (Test-Path $fullPath) {
        $size = Get-DirectorySize -Path $fullPath
        Remove-Item -Recurse -Force $fullPath -ErrorAction SilentlyContinue
        if (-not (Test-Path $fullPath)) {
            $relativePath = $dir -replace '\\', '/'
            Write-Host "  Removed $relativePath ($(Format-Bytes -Bytes $size))" -ForegroundColor Green
            $totalFreed += $size
        }
    }
}
Write-Host ""

Write-Host "Removing build outputs..." -ForegroundColor Blue
$buildDirs = @(
    "dist",
    "build",
    "frontend\dist",
    "frontend\build"
)

foreach ($dir in $buildDirs) {
    $fullPath = Join-Path $PSScriptRoot "..\$dir"
    if (Test-Path $fullPath) {
        $size = Get-DirectorySize -Path $fullPath
        Remove-Item -Recurse -Force $fullPath -ErrorAction SilentlyContinue
        if (-not (Test-Path $fullPath)) {
            $relativePath = $dir -replace '\\', '/'
            Write-Host "  Removed $relativePath ($(Format-Bytes -Bytes $size))" -ForegroundColor Green
            $totalFreed += $size
        }
    }
}
Write-Host ""

Write-Host "Removing log files..." -ForegroundColor Blue
$logFiles = Get-ChildItem -Path (Join-Path $PSScriptRoot "..") -Filter "*.log" -Recurse -ErrorAction SilentlyContinue
$logCount = 0
foreach ($file in $logFiles) {
    if ($file.FullName -notmatch 'node_modules|\.git') {
        Remove-Item -Force $file.FullName -ErrorAction SilentlyContinue
        $logCount++
    }
}
Write-Host "  Removed $logCount log file(s)`n" -ForegroundColor Green

Write-Host "Removing temporary files..." -ForegroundColor Blue
$codePath = Join-Path $PSScriptRoot "..\backend\code"
$outputPath = Join-Path $PSScriptRoot "..\backend\output"

if (Test-Path $codePath) {
    Get-ChildItem -Path $codePath -Exclude ".gitkeep" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path $outputPath) {
    Get-ChildItem -Path $outputPath -Exclude ".gitkeep" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "  Temporary files removed`n" -ForegroundColor Green

Write-Host "Removing cache directories..." -ForegroundColor Blue
$cacheDirs = @(
    ".cache",
    ".parcel-cache",
    "frontend\.vite",
    "backend\tool_cache"
)

foreach ($dir in $cacheDirs) {
    $fullPath = Join-Path $PSScriptRoot "..\$dir"
    if (Test-Path $fullPath) {
        $size = Get-DirectorySize -Path $fullPath
        Remove-Item -Recurse -Force $fullPath -ErrorAction SilentlyContinue
        if (-not (Test-Path $fullPath)) {
            $relativePath = $dir -replace '\\', '/'
            Write-Host "  Removed $relativePath ($(Format-Bytes -Bytes $size))" -ForegroundColor Green
            $totalFreed += $size
        }
    }
}
Write-Host ""

Write-Host "Cleanup complete!" -ForegroundColor Green
if ($totalFreed -gt 0) {
    Write-Host "Total space freed: $(Format-Bytes -Bytes $totalFreed)" -ForegroundColor Cyan
}
