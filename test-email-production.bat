@echo off
echo ====================================
echo Email Configuration Test
echo ====================================
echo.

cd /d "%~dp0backend"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo Testing email configuration...
echo.

if "%1"=="" (
    node test-email-production.js
) else (
    node test-email-production.js %1
)

echo.
echo ====================================
echo Test completed!
echo ====================================
pause
