@echo off
REM Quick Start Script for Chancenkarte PostgreSQL Setup (Windows)
REM Run this after fixing AWS RDS connectivity

cls
echo.
echo 🚀 Chancenkarte PostgreSQL Setup
echo ==================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Quick connection test
echo 🔍 Testing database connection...
call npm run quick-test
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Database connection failed!
    echo    Please check:
    echo    1. AWS RDS security group allows port 5432
    echo    2. RDS instance has 'Publicly accessible' enabled
    echo    3. Database credentials are correct in .env
    pause
    exit /b 1
)
echo.

REM Initialize database
echo 📊 Initializing database tables...
call npm run init-db
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to initialize database
    pause
    exit /b 1
)
echo.

echo ✅ Setup complete!
echo.
echo 🎉 Next steps:
echo    1. Open Terminal 1: npm run server    (start backend)
echo    2. Open Terminal 2: npm run dev       (start frontend)
echo    3. Open: http://localhost:5173
echo.
pause
