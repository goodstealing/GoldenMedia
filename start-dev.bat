@echo off
REM Запуск backend и frontend для GoldenMedia

REM Переходим в корень проекта (папка, где лежит этот .bat)
cd /d "%~dp0"

REM Запуск backend (порт 4000)
start "GoldenMedia Backend" cmd /k "cd /d backend && npm run dev"

REM Запуск frontend (порт 5173)
start "GoldenMedia Frontend" cmd /k "cd /d frontend && npm run dev"

echo Запущены backend и frontend в отдельных окнах.
echo Можно закрыть это окно.
exit

