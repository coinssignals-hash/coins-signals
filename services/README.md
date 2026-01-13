# 🚀 Trading Signals Platform - Backend Services

Sistema de señales de trading en tiempo real construido con FastAPI, TimescaleDB y Redis.

> **⚠️ IMPORTANTE**: Este sistema solo muestra señales y gráficos en tiempo real. NO ejecuta operaciones de trading.

## 📋 Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│              (Web App / Mobile / External APIs)                  │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
                  ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      API SERVICE            │   │    REALTIME SERVICE         │
│      (FastAPI REST)         │   │    (FastAPI WS/SSE)         │
│      Port: 8000             │   │    Port: 8001               │
│                             │   │                             │
│  • Auth (JWT)               │   │  • WebSocket /ws/stream     │
│  • Users CRUD               │   │  • SSE /sse/stream          │
│  • Signals CRUD             │   │  • Redis Pub/Sub Consumer   │
│  • News CRUD                │   │                             │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                  │
               │         ┌────────────────┐       │
               └────────►│     REDIS      │◄──────┘
                         │   Pub/Sub +    │
                         │    Cache       │
                         │   Port: 6379   │
                         └───────┬────────┘
                                 │
                                 ▼
               ┌─────────────────────────────────┐
               │         WORKER SERVICE          │
               │    (Analysis & Data Generator)  │
               │                                 │
               │  • Genera datos demo (prices)   │
               │  • Calcula indicadores          │
               │  • Genera señales               │
               │  • Publica a Redis              │
               │  • Persiste en DB               │
               └────────────────┬────────────────┘
                                │
                                ▼
               ┌─────────────────────────────────┐
               │         TIMESCALEDB            │
               │      (PostgreSQL + TS)         │
               │         Port: 5432             │
               │                                │
               │  • users                       │
               │  • signals                     │
               │  • news                        │
               │  • price_candles (hypertable)  │
               └────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Runtime | Python | 3.12 |
| Framework REST | FastAPI | Latest |
| ORM | SQLAlchemy 2.0 | Async |
| DB Driver | asyncpg | Latest |
| Migrations | Alembic | Latest |
| Database | TimescaleDB | PG16 |
| Cache/PubSub | Redis | 7-alpine |
| Config | pydantic-settings | Latest |

## 🚀 Quick Start

### 1. Configuración inicial

```bash
# Clonar y entrar al directorio
cd services

# Copiar variables de entorno
cp .env.example .env

# (Opcional) Editar .env con tus valores
nano .env
```

### 2. Levantar servicios base

```bash
# Levantar DB y Redis
docker compose up -d db redis

# Verificar que están corriendo
docker compose ps

# Ver logs
docker compose logs -f
```

### 3. Verificar conexiones

```bash
# Probar conexión a PostgreSQL/TimescaleDB
docker compose exec db psql -U trading -d trading_signals -c "SELECT version();"
docker compose exec db psql -U trading -d trading_signals -c "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';"

# Probar conexión a Redis
docker compose exec redis redis-cli ping
```

## 📁 Estructura del Proyecto

```
services/
├── docker-compose.yml      # Orquestación de servicios
├── .env.example            # Template de variables de entorno
├── .env                    # Variables de entorno (NO commitear)
├── README.md               # Este archivo
│
├── api/                    # Servicio REST API
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── models/
│       ├── schemas/
│       ├── routers/
│       ├── services/
│       └── dependencies/
│
├── realtime/               # Servicio WebSocket/SSE
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       └── ...
│
├── worker/                 # Servicio Worker (análisis)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       └── ...
│
├── shared/                 # Código compartido entre servicios
│   ├── models/
│   └── utils/
│
└── infra/                  # Infraestructura
    ├── nginx/              # Configuración proxy (opcional)
    └── scripts/            # Scripts de inicialización
```

## 🔌 Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API | 8000 | REST API (auth, users, signals, news) |
| Realtime | 8001 | WebSocket y SSE streams |
| TimescaleDB | 5432 | Base de datos |
| Redis | 6379 | Cache y Pub/Sub |
| Nginx | 80 | Proxy (opcional) |

## 📚 Documentación API

Una vez levantados los servicios:

- **API REST Docs**: http://localhost:8000/docs
- **API REST ReDoc**: http://localhost:8000/redoc
- **Realtime Docs**: http://localhost:8001/docs

## 🧪 Desarrollo

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f api

# Reiniciar un servicio
docker compose restart api

# Reconstruir un servicio
docker compose up -d --build api

# Parar todo
docker compose down

# Parar todo y eliminar volúmenes (¡CUIDADO! Borra datos)
docker compose down -v
```

## 📝 Licencia

Proyecto privado - Todos los derechos reservados.
