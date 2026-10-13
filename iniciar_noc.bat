@echo off
echo ===================================================
echo     INICIANDO SISTEMA DE MONITOREO NOC
echo ===================================================
echo.

echo Iniciando servidor SNMP (Backend)...
cd backend
start "NOC - Backend" cmd /k "node server.js"
cd ..

echo Iniciando interfaz grafica (Frontend)...
cd frontend
start "NOC - Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Los servicios se estan ejecutando en ventanas separadas.
echo Puedes cerrar esta ventana.
timeout /t 5 >nul