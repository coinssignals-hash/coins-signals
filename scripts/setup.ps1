# ============================================
# Economic News App - Setup Wizard (PowerShell)
# ============================================

$Host.UI.RawUI.WindowTitle = "Economic News App Setup"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Economic News App - Setup Wizard         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si .env ya existe
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "⚠️  El archivo .env ya existe." -ForegroundColor Yellow
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "✓ Manteniendo configuración existente." -ForegroundColor Green
        exit
    }
}

Write-Host ""
Write-Host "📝 Configuración de variables de entorno" -ForegroundColor Cyan
Write-Host "----------------------------------------"

# API URL del backend
Write-Host ""
$apiUrl = Read-Host "URL del backend FastAPI [http://localhost:8000]"
if ([string]::IsNullOrWhiteSpace($apiUrl)) { $apiUrl = "http://localhost:8000" }

# Usar datos mock
Write-Host ""
Write-Host "¿Usar datos de prueba (mock) en lugar del backend real?"
$useMock = Read-Host "Usar mock data (s/n) [n]"
if ($useMock -eq "s" -or $useMock -eq "S") {
    $useMockData = "true"
} else {
    $useMockData = "false"
}

# OpenAI API Key
Write-Host ""
Write-Host "La API Key de OpenAI es necesaria para el análisis de noticias con IA." -ForegroundColor Yellow
$openaiKey = Read-Host "OpenAI API Key (dejar vacío para omitir)"

# MongoDB URL
Write-Host ""
$mongoUrl = Read-Host "MongoDB URL [mongodb://localhost:27017]"
if ([string]::IsNullOrWhiteSpace($mongoUrl)) { $mongoUrl = "mongodb://localhost:27017" }

# Redis URL
Write-Host ""
$redisUrl = Read-Host "Redis URL [redis://localhost:6379]"
if ([string]::IsNullOrWhiteSpace($redisUrl)) { $redisUrl = "redis://localhost:6379" }

# Crear archivo .env
Write-Host ""
Write-Host "📄 Creando archivo .env..." -ForegroundColor Cyan

$envContent = @"
# ============================================
# Economic News App - Variables de Entorno
# Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# Frontend Configuration
VITE_API_URL=$apiUrl
VITE_USE_MOCK_DATA=$useMockData

# Backend Configuration
OPENAI_API_KEY=$openaiKey
MONGODB_URL=$mongoUrl
REDIS_URL=$redisUrl

# Environment
NODE_ENV=development
ENV=development
"@

$envContent | Out-File -FilePath $envFile -Encoding utf8
Write-Host "✓ Archivo .env creado exitosamente" -ForegroundColor Green

# Verificar Docker
Write-Host ""
Write-Host "🐳 Verificando Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✓ Docker está instalado" -ForegroundColor Green
    Write-Host $dockerVersion
} catch {
    Write-Host "⚠️  Docker no está instalado. Visita: https://docker.com/products/docker-desktop" -ForegroundColor Yellow
}

# Verificar Node.js
Write-Host ""
Write-Host "📦 Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js está instalado" -ForegroundColor Green
    Write-Host $nodeVersion
} catch {
    Write-Host "⚠️  Node.js no está instalado. Visita: https://nodejs.org" -ForegroundColor Yellow
}

# Preguntar si instalar dependencias
Write-Host ""
$installDeps = Read-Host "¿Instalar dependencias del frontend ahora? (s/n)"
if ($installDeps -eq "s" -or $installDeps -eq "S") {
    Write-Host "📥 Instalando dependencias..." -ForegroundColor Cyan
    npm install
    Write-Host "✓ Dependencias instaladas" -ForegroundColor Green
}

# Resumen
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ✓ Configuración completada         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Próximos pasos:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Ejecutar solo frontend (con mock data):"
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Ejecutar con Docker (frontend + backend):"
Write-Host "     docker-compose up --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Ver la aplicación:"
Write-Host "     Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "     Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter para salir"
