@echo off
chcp 65001 >nul
title ExamLens — Launcher
color 0B
cls

echo ===============================================================================
echo                     EXAMLENS — SEE BEYOND THE ANSWER
echo          AI-Assisted Handwritten Examination Evaluation Platform
echo ===============================================================================
echo.

:: 1. Detect and configure Node.js path
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "%~dp0..\node-bin\node-v20.18.0-win-x64\node.exe" (
        set "PATH=%~dp0..\node-bin\node-v20.18.0-win-x64;%PATH%"
        echo [INFO] Detected portable Node.js v20.18.0 at node-bin.
    ) else (
        echo [ERROR] Node.js is not found in PATH or node-bin!
        echo Please ensure Node.js is installed or extracted.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Node.js is available in system PATH.
)

:: 2. Detect Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not found in your PATH!
    echo Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
) else (
    echo [INFO] Python interpreter detected.
)

echo.
echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ExamLens - Backend Server (FastAPI)" cmd /c "cd /d "%~dp0backend" && title ExamLens Backend && echo Starting Uvicorn backend... && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Waiting for Backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Vite Frontend on http://localhost:5173 ...
start "ExamLens - Frontend UI (Vite)" cmd /c "cd /d "%~dp0frontend" && title ExamLens Frontend && set "PATH=%PATH%" && echo Starting Vite development server... && npm run dev"

echo.
echo Waiting for Vite dev server to boot...
timeout /t 3 /nobreak >nul

echo.
echo ===============================================================================
echo                     EXAMLENS IS NOW RUNNING!
echo ===============================================================================
echo   * Web Application:     http://localhost:5173
echo   * Backend REST API:    http://127.0.0.1:8000
echo   * API Documentation:   http://127.0.0.1:8000/docs
echo.
echo -------------------------------------------------------------------------------
echo PRE-SEEDED TEST ACCOUNTS (Password for all: examlens123):
echo   * Faculty/Teacher:     teacher@examlens.edu  (Prof. Rajesh Sharma)
echo   * Student 1 (Top):     stu101@examlens.edu   (Aarav Sharma - STU-1024)
echo   * Student 2 (Pass):    stu102@examlens.edu   (Priya Nair - STU-1025)
echo   * Student 3 (Remedial): stu103@examlens.edu  (Rohan Mehta - STU-1026)
echo   * Administrator:       admin@examlens.edu    (Exam Admin NIT)
echo.
echo TIP: You can switch roles instantly with 1 click using the 'Switch Role'
echo      dropdown located at the top-right of the dashboard header.
echo ===============================================================================
echo.
echo Opening ExamLens in your default browser...
start http://localhost:5173

echo.
echo Press any key to stop all ExamLens processes and exit...
pause >nul

echo.
echo Shutting down ExamLens services...
taskkill /F /FI "WINDOWTITLE eq ExamLens Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ExamLens Frontend*" >nul 2>&1
echo Done! All services stopped.
timeout /t 2 >nul
exit /b 0
