@echo off

echo =============================
echo Starting all services...
echo =============================


start "Springboot backend" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run"

start "React frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

start "ML backend" cmd /k "cd /d %~dp0python && python -m uvicorn app.main:app --reload"

echo.
echo All services have been launched.
echo You can close this window.
pause
