# Economic News API - Backend

API FastAPI para análisis de mercados y noticias económicas.

## 🚀 Instalación Rápida

### Opción 1: Con Docker (Recomendado)

```bash
cd backend
docker-compose up --build
```

La API estará disponible en: http://localhost:8000

### Opción 2: Instalación Manual

1. **Crear entorno virtual:**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Ejecutar el servidor:**
```bash
python run.py
```

## 📡 Endpoints Disponibles

### News API (`/api/v1/news`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener todas las noticias |
| GET | `/{id}` | Obtener noticia por ID |
| GET | `/by-date/{date}` | Noticias por fecha (YYYY-MM-DD) |
| GET | `/currency/{currency}` | Noticias por moneda |
| POST | `/refresh` | Actualizar noticias |

### Analysis API (`/api/v1/analysis`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/full/{symbol}` | Análisis completo |
| GET | `/sentiment/{symbol}` | Sentimiento de mercado |
| GET | `/prediction/{symbol}` | Predicción de precios |
| GET | `/technical-levels/{symbol}` | Niveles técnicos |
| GET | `/previous-day/{symbol}` | Datos del día anterior |
| GET | `/recommendations/{symbol}` | Recomendaciones |
| GET | `/conclusions/{symbol}` | Conclusiones |
| GET | `/monetary-policies/{symbol}` | Políticas monetarias |
| GET | `/major-news/{symbol}` | Noticias principales |
| GET | `/relevant-news/{symbol}` | Noticias relevantes |
| GET | `/economic-events/{symbol}/{date}` | Eventos económicos |

## 🔗 Conectar con el Frontend

### En desarrollo local:

1. Asegúrate de que la API esté corriendo en `http://localhost:8000`

2. En tu archivo `.env` del frontend:
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
```

3. Reinicia el servidor de desarrollo del frontend

### En producción (Lovable):

1. Despliega esta API en un servidor (Railway, Render, DigitalOcean, etc.)

2. Configura el secret `FASTAPI_BASE_URL` en Lovable Cloud con la URL de tu API

3. La Edge Function `analysis-proxy` redirigirá las peticiones a tu API

## 📖 Documentación Interactiva

Una vez ejecutando el servidor:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔧 Servicios Opcionales

### MongoDB
Almacenamiento persistente de noticias y análisis.
- URL por defecto: `mongodb://localhost:27017`

### Redis
Cache para mejorar rendimiento.
- URL por defecto: `redis://localhost:6379`

### OpenAI
Para análisis con IA (opcional).
- Configura `OPENAI_API_KEY` en `.env`

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # Aplicación FastAPI
│   ├── config.py        # Configuración
│   ├── routers/
│   │   ├── news.py      # Endpoints de noticias
│   │   └── analysis.py  # Endpoints de análisis
│   └── services/
│       ├── database.py  # Conexión MongoDB
│       └── cache.py     # Conexión Redis
├── requirements.txt
├── run.py
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## ✅ Verificar Conexión

```bash
# Verificar que la API está corriendo
curl http://localhost:8000/health

# Probar endpoint de análisis
curl http://localhost:8000/api/v1/analysis/full/EUR%2FUSD
```
