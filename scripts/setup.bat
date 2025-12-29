@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: Economic News App - Setup Wizard (Windows)
:: ============================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║   Economic News App - Setup Wizard         ║
echo ╚════════════════════════════════════════════╝
echo.

:: Verificar si .env ya existe
if exist ".env" (
    echo [AVISO] El archivo .env ya existe.
    set /p overwrite="¿Deseas sobrescribirlo? (s/n): "
    if /i not "!overwrite!"=="s" (
        echo [OK] Manteniendo configuración existente.
        goto :end
    )
)

echo.
echo Configuración de variables de entorno
echo ----------------------------------------

:: API URL del backend
echo.
set /p API_URL="URL del backend FastAPI [http://localhost:8000]: "
if "!API_URL!"=="" set API_URL=http://localhost:8000

:: Usar datos mock
echo.
echo ¿Usar datos de prueba (mock) en lugar del backend real?
set /p USE_MOCK="Usar mock data (s/n) [n]: "
if /i "!USE_MOCK!"=="s" (
    set USE_MOCK_DATA=true
) else (
    set USE_MOCK_DATA=false
)

:: OpenAI API Key
echo.
echo La API Key de OpenAI es necesaria para el análisis de noticias con IA.
set /p OPENAI_KEY="OpenAI API Key (dejar vacío para omitir): "

:: MongoDB URL
echo.
set /p MONGO_URL="MongoDB URL [mongodb://localhost:27017]: "
if "!MONGO_URL!"=="" set MONGO_URL=mongodb://localhost:27017

:: Redis URL
echo.
set /p REDIS_URL="Redis URL [redis://localhost:6379]: "
if "!REDIS_URL!"=="" set REDIS_URL=redis://localhost:6379

:: Crear archivo .env
echo.
echo Creando archivo .env...

(
echo # ============================================
echo # Economic News App - Variables de Entorno
echo # Generado automáticamente
echo # ============================================
echo.
echo # Frontend Configuration
echo VITE_API_URL=!API_URL!
echo VITE_USE_MOCK_DATA=!USE_MOCK_DATA!
echo.
echo # Backend Configuration
echo OPENAI_API_KEY=!OPENAI_KEY!
echo MONGODB_URL=!MONGO_URL!
echo REDIS_URL=!REDIS_URL!
echo.
echo # Environment
echo NODE_ENV=development
echo ENV=development
) > .env

echo [OK] Archivo .env creado exitosamente

:: Verificar Docker
echo.
echo Verificando Docker...
where docker >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Docker está instalado
    docker --version
) else (
    echo [AVISO] Docker no está instalado. Visita: https://docker.com/products/docker-desktop
)

:: Verificar Node.js
echo.
echo Verificando Node.js...
where node >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Node.js está instalado
    node --version
) else (
    echo [AVISO] Node.js no está instalado. Visita: https://nodejs.org
)

:: Preguntar si instalar dependencias
echo.
set /p install_deps="¿Instalar dependencias del frontend ahora? (s/n): "
if /i "!install_deps!"=="s" (
    echo Instalando dependencias...
    call npm install
    echo [OK] Dependencias instaladas
)

:: Resumen
echo.
echo ╔════════════════════════════════════════════╗
echo ║         Configuración completada           ║
echo ╚════════════════════════════════════════════╝
echo.
echo Próximos pasos:
echo.
echo   1. Ejecutar solo frontend (con mock data):
echo      npm run dev
echo.
echo   2. Ejecutar con Docker (frontend + backend):
echo      docker-compose up --build
echo.
echo   3. Ver la aplicación:
echo      Frontend: http://localhost:3000
echo      Backend:  http://localhost:8000
echo.

:end
pause
