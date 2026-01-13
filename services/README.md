# 📈 Trading Signals Platform

Sistema de señales de trading en tiempo real con FastAPI, TimescaleDB y Redis.

> ⚠️ **IMPORTANTE**: Este sistema solo muestra señales y gráficos en tiempo real. **NO ejecuta operaciones de trading.**

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Trading Signals Platform                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐    ┌──────────────┐    ┌─────────────┐                │
│   │   API       │    │   Realtime   │    │   Worker    │                │
│   │  (REST)     │    │  (WS/SSE)    │    │  (Analysis) │                │
│   │  :8000      │    │   :8001      │    │             │                │
│   └──────┬──────┘    └──────┬───────┘    └──────┬──────┘                │
│          │                  │                    │                       │
│          │     ┌────────────┴────────────┐      │                       │
│          │     │                         │      │                       │
│          ▼     ▼                         ▼      ▼                       │
│   ┌─────────────────┐           ┌─────────────────┐                     │
│   │  TimescaleDB    │           │     Redis       │                     │
│   │  (PostgreSQL)   │           │   (Pub/Sub)     │                     │
│   │    :5432        │           │    :6379        │                     │
│   └─────────────────┘           └─────────────────┘                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📂 Estructura de Directorios

```
services/
├── docker-compose.yml      # Orquestación de contenedores
├── .env.example            # Variables de entorno (template)
├── .env                    # Variables de entorno (local)
├── Makefile                # Comandos útiles
├── README.md               # Este archivo
├── docker/
│   └── postgres/
│       └── init.sql        # Script de inicialización de DB
├── api/                    # Servicio REST API
│   ├── app/
│   └── tests/
├── realtime/               # Servicio WebSocket/SSE
│   ├── app/
│   └── tests/
├── worker/                 # Worker de análisis
│   ├── app/
│   └── tests/
└── shared/                 # Código compartido
    ├── models/             # Modelos SQLAlchemy
    ├── schemas/            # Schemas Pydantic
    └── utils/              # Utilidades
```

## 🚀 Quick Start

### Requisitos
- Docker >= 24.0
- Docker Compose >= 2.20
- Make (opcional, pero recomendado)

### 1. Configurar variables de entorno

```bash
cd services
cp .env.example .env
# Editar .env si es necesario
```

### 2. Levantar servicios base

```bash
# Con Make
make up

# O directamente con Docker Compose
docker compose up -d
```

### 3. Verificar estado

```bash
# Ver contenedores
make ps

# Verificar salud de servicios
make health
```

## 📋 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `make up` | Inicia todos los servicios |
| `make down` | Detiene todos los servicios |
| `make logs` | Muestra logs de todos los servicios |
| `make logs-db` | Muestra logs de PostgreSQL |
| `make logs-redis` | Muestra logs de Redis |
| `make ps` | Muestra contenedores en ejecución |
| `make health` | Verifica salud de los servicios |
| `make db-shell` | Abre shell de PostgreSQL |
| `make redis-cli` | Abre cliente Redis |
| `make clean` | Elimina contenedores y volúmenes |
| `make rebuild` | Reconstruye y reinicia servicios |

## 🔧 Servicios

### TimescaleDB (PostgreSQL)
- **Puerto**: 5432
- **Usuario**: trading
- **Base de datos**: trading_signals
- **Extensiones**: timescaledb, uuid-ossp, pg_trgm

### Redis
- **Puerto**: 6379
- **Canales Pub/Sub**: prices, signals, news, analytics

## 📊 Modelos de Datos

### users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| email | VARCHAR | Email único |
| password_hash | VARCHAR | Hash de contraseña |
| created_at | TIMESTAMP | Fecha de creación |

### signals
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| symbol | VARCHAR | Par de trading (ej: EURUSD) |
| timeframe | VARCHAR | Temporalidad (1H, 4H, 1D) |
| direction | VARCHAR | BUY / SELL |
| entry | DECIMAL | Precio de entrada |
| sl | DECIMAL | Stop Loss |
| tp | DECIMAL | Take Profit |
| confidence | DECIMAL | Confianza (0-100) |
| created_at | TIMESTAMP | Fecha de creación |
| source | VARCHAR | Origen de la señal |

### news
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| title | VARCHAR | Título de la noticia |
| source | VARCHAR | Fuente |
| url | VARCHAR | URL de la noticia |
| published_at | TIMESTAMP | Fecha de publicación |
| created_at | TIMESTAMP | Fecha de registro |

### price_candles (Hypertable TimescaleDB)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| time | TIMESTAMPTZ | Tiempo de la vela (PK) |
| symbol | VARCHAR | Par de trading |
| timeframe | VARCHAR | Temporalidad |
| open | DECIMAL | Precio apertura |
| high | DECIMAL | Precio máximo |
| low | DECIMAL | Precio mínimo |
| close | DECIMAL | Precio cierre |
| volume | DECIMAL | Volumen |

## 📡 Endpoints API

### REST API (:8000)
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `POST /auth/refresh` - Refrescar token
- `GET /users/me` - Obtener usuario actual
- `POST /signals` - Crear señal
- `GET /signals` - Listar señales
- `GET /signals/{id}` - Obtener señal
- `GET /news` - Listar noticias
- `GET /news/{id}` - Obtener noticia

### Realtime (:8001)
- `WS /ws/stream` - Stream WebSocket (JWT)
- `GET /sse/stream` - Stream SSE (JWT)

## 🔒 Seguridad

- Autenticación JWT
- Hashing seguro de contraseñas (bcrypt)
- Variables de entorno para secretos
- Sin hardcoding de credenciales

## 📝 Licencia

MIT License
