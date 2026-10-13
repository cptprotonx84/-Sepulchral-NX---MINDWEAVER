$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$installScript = Join-Path $PSScriptRoot 'Install-Mindweaver.ps1'
Set-Location -LiteralPath $projectRoot

try {
    $npmCommand = Get-Command npm.cmd -ErrorAction Stop

    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules')) -or
        -not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist\server.cjs'))) {
        Write-Host "Mindweaver needs its one-time setup. Running it now..." -ForegroundColor Yellow
        & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installScript
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    $portProbe = New-Object System.Net.Sockets.TcpClient
    try {
        $portProbe.Connect('127.0.0.1', 3000)
        $portInUse = $true
    }
    catch [System.Net.Sockets.SocketException] {
        $portInUse = $false
    }
    finally {
        $portProbe.Dispose()
    }

    if ($portInUse) {
        Write-Host "Mindweaver cannot start because port 3000 is already in use." -ForegroundColor Yellow
        Write-Host "If an earlier Mindweaver console is open, press Ctrl+C in that window, then launch Mindweaver again."
        Write-Host "Closing only the browser tab does not stop the earlier local server."
        exit 1
    }

    $env:NODE_ENV = 'production'
    $env:MINDWEAVER_OPEN_BROWSER = '1'

    Write-Host "Starting Mindweaver..." -ForegroundColor Cyan
    Write-Host "Closing this window will stop the local app."
    & $npmCommand.Source start
    exit $LASTEXITCODE
}
catch {
    Write-Host ""
    Write-Host "Mindweaver could not start: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
