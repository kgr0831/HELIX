@echo off
title HELIX - Heterogeneous LLM Integrated eXchange

echo [1/5] Starting database (Docker: postgres + pgvector)...
docker compose up -d

echo [2/5] Waiting for database to be ready...
timeout /t 6 /nobreak >nul

echo [3/5] Applying DB migrations (Alembic)...
cd /d C:\HELIX && venv\Scripts\alembic.exe upgrade head

echo [4/5] Starting Backend (FastAPI)...
start /B cmd /C "cd /d C:\HELIX && venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 2>nul"

echo [5/5] Starting Frontend (Vite)...
start /B cmd /C "cd /d C:\HELIX\frontend && npm run dev 2>nul"

echo Waiting for servers to start...
timeout /t 4 /nobreak >nul

echo Opening Chrome...
start chrome http://localhost:5173

echo.
echo ==========================================
echo   HELIX is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo ==========================================
echo   Press any key to stop all servers...
echo ==========================================
pause >nul

echo Shutting down...
taskkill /F /IM "uvicorn.exe" >nul 2>&1
taskkill /F /IM "node.exe" >nul 2>&1
echo Done.
