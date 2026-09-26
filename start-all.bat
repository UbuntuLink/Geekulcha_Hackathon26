@echo off

echo ==========================================
echo Starting Application...
echo ==========================================

echo Starting Spring Boot Backend...
start "Spring Boot Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo Starting React Frontend...
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Starting Python ML Backend...
start "Python ML Backend" cmd /k "cd /d %~dp0python && python -m uvicorn app.main:app --reload"

echo.
echo ==========================================
echo All services started!
echo ==========================================

exit