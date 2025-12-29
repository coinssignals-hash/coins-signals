# 🐳 Docker Setup - Economic News App

## Requisitos previos

1. **Docker Desktop** instalado: https://www.docker.com/products/docker-desktop
2. **Backend FastAPI** en una carpeta llamada `backend/` con su propio `Dockerfile`

## Estructura de carpetas esperada

```
proyecto/
├── docker-compose.yml      # Orquestación de servicios
├── Dockerfile.frontend     # Build del frontend React
├── nginx.conf              # Configuración de nginx
├── backend/                # Tu proyecto FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
├── src/                    # Código React
├── package.json
└── ...
```

## Pasos para ejecutar

### 1. Crear archivo .env (opcional)

```bash
# Crea un archivo .env en la raíz
echo "OPENAI_API_KEY=tu-api-key-aqui" > .env
```

### 2. Construir y ejecutar

```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# O en segundo plano
docker-compose up --build -d
```

### 3. Acceder a la aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f frontend
docker-compose logs -f backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (datos)
docker-compose down -v

# Reconstruir un servicio específico
docker-compose up --build frontend

# Ver estado de los contenedores
docker-compose ps
```

## Solo Frontend (sin backend)

Si solo quieres ejecutar el frontend con datos mock:

```bash
# Construir imagen
docker build -f Dockerfile.frontend -t news-frontend .

# Ejecutar
docker run -p 3000:80 news-frontend
```

Luego abre http://localhost:3000

## Solución de problemas

### Error de conexión al backend
- Verifica que el backend esté corriendo: `docker-compose ps`
- Revisa los logs: `docker-compose logs backend`

### Puerto en uso
```bash
# Cambiar puertos en docker-compose.yml
ports:
  - "3001:80"  # Usar puerto 3001 en lugar de 3000
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v --rmi all
docker-compose up --build
```
