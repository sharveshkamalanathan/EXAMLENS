@echo off
setlocal enabledelayedexpansion
title ExamLens - Worldwide Public Sharing Tunnel
cd /d "%~dp0"

cls
echo ===============================================================================
echo                EXAMLENS - WORLDWIDE PUBLIC SHARING TUNNEL
echo ===============================================================================
echo.
echo Starting secure Cloudflare Tunnel to share ExamLens with anyone in the world...
echo Anyone on mobile phones, tablets, or computers can use the generated HTTPS link.
echo.
echo   * Public Website: Accessible by everyone on mobile phones and computers
echo   * Evaluation Portal: Optimized for computer displays (monitors and laptops)
echo.
echo -------------------------------------------------------------------------------
echo Look for your public URL below (e.g. https://xxxx.trycloudflare.com):
echo -------------------------------------------------------------------------------
echo.

.\bin\cloudflared.exe tunnel --url http://localhost:5173

pause
