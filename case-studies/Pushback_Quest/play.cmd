@echo off
rem Starts the local web server and opens the game. Needs Node.js.
rem Close this window to stop the server.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org or run: python -m http.server
  pause
  exit /b 1
)
start "" "http://localhost:8080/"
node tools\serve.mjs 8080
