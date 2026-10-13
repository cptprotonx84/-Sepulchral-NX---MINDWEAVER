@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Install-Mindweaver.ps1"
set "MINDWEAVER_EXIT=%ERRORLEVEL%"
if not "%MINDWEAVER_EXIT%"=="0" pause
exit /b %MINDWEAVER_EXIT%
