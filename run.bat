@echo off
setlocal enabledelayedexpansion
title RoadPay AI Launcher

echo =====================================================================
echo                     ROADPAY AI SUITE LAUNCHER
echo =====================================================================
echo.

:: Check for backend environment file
if not exist "backend\.env" (
    echo [INFO] backend/.env file not found. Copying from backend/.env.example...
    copy "backend\.env.example" "backend\.env" >nul
)

:: Check for frontend environment file
if not exist "frontend\.env.local" (
    echo [INFO] frontend/.env.local file not found. Copying from frontend/.env.local.example...
    copy "frontend\.env.local.example" "frontend\.env.local" >nul
)

:: Check Backend Virtual Environment
if exist "backend\venv" goto check_frontend

echo [WARNING] Python virtual environment (venv) not found in backend/venv.
choice /M "Would you like to create the virtual environment and install requirements now"
if errorlevel 2 goto err_no_venv
if errorlevel 1 goto setup_venv

:setup_venv
echo Creating virtual environment...
python -m venv backend\venv
if errorlevel 1 goto err_venv_fail

echo Installing backend requirements (this may take a few minutes)...
call backend\venv\Scripts\activate
pip install -r backend\requirements.txt
if errorlevel 1 goto err_pip_fail
goto check_frontend

:err_no_venv
echo [ERROR] Cannot run the backend without a virtual environment.
pause
exit /b 1

:err_venv_fail
echo [ERROR] Failed to create virtual environment. Make sure python is installed and in path.
pause
exit /b 1

:err_pip_fail
echo [ERROR] Failed to install backend requirements.
pause
exit /b 1


:check_frontend
:: Check Frontend dependencies
if exist "frontend\node_modules" goto start_servers

echo [WARNING] node_modules not found in frontend/.
choice /M "Would you like to run 'npm install' now"
if errorlevel 2 goto err_no_node_modules
if errorlevel 1 goto setup_frontend

:setup_frontend
echo Installing frontend dependencies (this may take a few minutes)...
cd frontend
call npm install
cd ..
if errorlevel 1 goto err_npm_fail
goto start_servers

:err_no_node_modules
echo [ERROR] Cannot run frontend without dependencies installed.
pause
exit /b 1

:err_npm_fail
echo [ERROR] Failed to install frontend dependencies.
pause
exit /b 1


:start_servers
echo.
echo [INFO] Starting Backend Server (FastAPI) in a separate window...
start "RoadPay AI Backend (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [INFO] Starting Frontend Server (Next.js) in a separate window...
start "RoadPay AI Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo RoadPay AI is booting up!
echo - Backend API:  http://localhost:8000
echo - Frontend App: http://localhost:3000
echo =====================================================================
echo.

:: Automatically open browser after 3 seconds
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo Launcher execution completed. Feel free to close this window.
pause
