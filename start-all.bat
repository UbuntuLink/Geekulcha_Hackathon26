@echo off

echo ==========================================
echo Starting all UbuntuLink services...
echo ==========================================

echo Starting Spring Boot backend (port 8080)...
start "Spring Boot Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run"

echo Starting React frontend (port 5173)...
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Starting Python ML service (port 8000)...
start "Python ML Backend" cmd /k "cd /d %~dp0python && python -m uvicorn app.main:app --reload --port 8000"

echo.
echo ==========================================
echo All three services launched in their own windows.
echo Backend needs backend\.env, ML service needs python\.env.
echo ==========================================
pause
