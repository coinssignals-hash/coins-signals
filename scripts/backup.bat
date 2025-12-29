@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: MongoDB Backup Script - Windows
:: ============================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║      MongoDB Backup - Economic News        ║
echo ╚════════════════════════════════════════════╝
echo.

:: Configuración
set MONGO_HOST=localhost
set MONGO_PORT=27017
set MONGO_DB=economic_news
set BACKUP_DIR=backups
set RETENTION_DAYS=7

:: Timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_NAME=backup_%MONGO_DB%_%TIMESTAMP%

:: Verificar mongodump
echo [INFO] Verificando herramientas...
where mongodump >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] mongodump no está instalado.
    echo.
    echo Descárgalo de: https://www.mongodb.com/try/download/database-tools
    pause
    exit /b 1
)
echo [OK] mongodump encontrado

:: Crear directorio
echo [INFO] Preparando directorio de backups...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo [OK] Directorio: %BACKUP_DIR%

:: Realizar backup
echo.
echo [INFO] Iniciando backup de '%MONGO_DB%'...
echo    Host: %MONGO_HOST%:%MONGO_PORT%
echo    Destino: %BACKUP_DIR%\%BACKUP_NAME%
echo.

mongodump --host=%MONGO_HOST% --port=%MONGO_PORT% --db=%MONGO_DB% --out=%BACKUP_DIR%\%BACKUP_NAME% --gzip

if %errorlevel% neq 0 (
    echo [ERROR] Error durante el backup
    pause
    exit /b 1
)

echo [OK] Backup completado

:: Comprimir (usando PowerShell)
echo.
echo [INFO] Comprimiendo backup...
powershell -Command "Compress-Archive -Path '%BACKUP_DIR%\%BACKUP_NAME%' -DestinationPath '%BACKUP_DIR%\%BACKUP_NAME%.zip' -Force"
rmdir /s /q "%BACKUP_DIR%\%BACKUP_NAME%"
echo [OK] Backup comprimido: %BACKUP_NAME%.zip

:: Limpiar backups antiguos
echo.
echo [INFO] Limpiando backups antiguos...
forfiles /p "%BACKUP_DIR%" /m "backup_*.zip" /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
echo [OK] Limpieza completada

:: Listar backups
echo.
echo [INFO] Backups disponibles:
dir /b "%BACKUP_DIR%\*.zip" 2>nul

echo.
echo ╔════════════════════════════════════════════╗
echo ║           Backup completado                ║
echo ╚════════════════════════════════════════════╝
echo.
echo Archivo: %BACKUP_DIR%\%BACKUP_NAME%.zip
echo.

pause
