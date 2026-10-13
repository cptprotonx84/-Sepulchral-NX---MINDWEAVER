$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

try {
    $nodeCommand = Get-Command node.exe -ErrorAction Stop
    $npmCommand = Get-Command npm.cmd -ErrorAction Stop
    $nodeMajor = [int](& $nodeCommand.Source -p "Number(process.versions.node.split('.')[0])")

    if ($nodeMajor -lt 18) {
        throw "Mindweaver requires Node.js 18 or newer. Install the current Node.js LTS release, then run this installer again."
    }

    Write-Host "Installing Mindweaver's local packages..." -ForegroundColor Cyan
    & $npmCommand.Source install
    if ($LASTEXITCODE -ne 0) { throw "Package installation failed with exit code $LASTEXITCODE." }

    Write-Host "Checking and building Mindweaver..." -ForegroundColor Cyan
    & $npmCommand.Source run verify
    if ($LASTEXITCODE -ne 0) { throw "Mindweaver verification failed with exit code $LASTEXITCODE." }

    Write-Host ""
    Write-Host "Mindweaver is ready." -ForegroundColor Green
    Write-Host "Double-click Start-Mindweaver.cmd to open it."

    $shortcutChoice = Read-Host "Create or update a Mindweaver desktop shortcut? [Y/n]"
    if ([string]::IsNullOrWhiteSpace($shortcutChoice) -or $shortcutChoice.Trim().ToLowerInvariant() -eq 'y' -or $shortcutChoice.Trim().ToLowerInvariant() -eq 'yes') {
        $desktopPath = [Environment]::GetFolderPath('Desktop')
        if ([string]::IsNullOrWhiteSpace($desktopPath)) {
            Write-Host "Windows did not report a desktop folder, so no shortcut was created." -ForegroundColor Yellow
        }
        else {
            $launcherPath = Join-Path $projectRoot 'Start-Mindweaver.cmd'
            $shortcutPath = Join-Path $desktopPath 'Mindweaver.lnk'
            $shell = New-Object -ComObject WScript.Shell
            $shortcut = $shell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = $launcherPath
            $shortcut.WorkingDirectory = $projectRoot
            $shortcut.Description = 'Launch Mindweaver locally'
            $shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,220"
            $shortcut.Save()
            Write-Host "Desktop shortcut ready: $shortcutPath" -ForegroundColor Green
        }
    }
    else {
        Write-Host "Desktop shortcut skipped. You can still use Start-Mindweaver.cmd." -ForegroundColor DarkGray
    }
    exit 0
}
catch {
    Write-Host ""
    Write-Host "Mindweaver setup stopped: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "No board or save data was changed."
    exit 1
}
