# Coins Signals — Documentación Técnica Completa

> Última actualización: 2026-03-15

---

## 1. Visión General de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE                                  │
│  React 18 + TypeScript + Vite + Tailwind CSS                    │
│  PWA (Service Worker) + Capacitor (Android/iOS)                │
│  Viewport: 390×844 (mobile-first)                              │
└──────────────┬──────────────────────┬───────────────────────────┘
               │ Supabase SDK         │ REST/fetch
               ▼                      ▼
┌──────────────────────────┐  ┌──────────────────────────────────┐
│    LOVABLE CLOUD         │  │    BACKEND PYTHON (Hetzner VPS)  │
│    (Supabase)            │  │    FastAPI + MongoDB + Redis     │
│                          │  │    Nginx + SSL (Let's Encrypt)   │
│  ┌────────────────────┐  │  │                                  │
│  │ PostgreSQL (24 tab) │  │  │  /api/v1/news/*                 │
│  │ Auth (JWT)          │  │  │  /api/v1/analysis/*              │
│  │ Storage (4 buckets) │  │  │  /api/v1/ai/*                   │
│  │ Realtime (WS)       │  │  └──────────────────────────────────┘
│  │ Edge Functions (57) │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 18, Vite 5 |
| Estilos | Tailwind CSS + shadcn/ui | Tailwind 3 |
| Estado | TanStack React Query | v5 |
| Animaciones | Framer Motion | v11 |
| Gráficos | Recharts | v2 |
| Routing | React Router DOM | v6 |
| Backend Serverless | Supabase Edge Functions (Deno) | 57 funciones |
| Backend Python | FastAPI + MongoDB + Redis | Python 3.11 |
| Base de datos | PostgreSQL (Supabase) | v15 |
| Autenticación | Supabase Auth (JWT) | — |
| Pagos | Stripe API | — |
| Push | Firebase Cloud Messaging (FCM v1) | — |
| Mobile | Capacitor | v8 |

---

## 2. Base de Datos — 24 Tablas

### 2.1 Tablas Principales

| Tabla | Descripción | RLS | Filas estimadas |
|-------|------------|-----|-----------------|
| `trading_signals` | Señales de trading (par, entrada, TP, SL, estado) | ✅ Public read, admin write | — |
| `profiles` | Información del usuario (nombre, avatar, config notif.) | ✅ Owner only | — |
| `user_roles` | Roles RBAC (`admin`, `moderator`, `user`) | ✅ Admin manage, owner read | — |
| `trading_journal` | Diario de operaciones del usuario | ✅ Owner CRUD | — |
| `favorite_signals` | Señales favoritas del usuario | ✅ Owner only | — |
| `favorite_currencies` | Divisas favoritas | ✅ Owner only | — |
| `favorite_symbols` | Símbolos favoritos (forex, crypto, stocks) | ✅ Owner only | — |

### 2.2 Tablas de Bróker y Portfolio

| Tabla | Descripción | RLS |
|-------|------------|-----|
| `brokers` | Catálogo de brókers soportados | ✅ Public read (active) |
| `user_broker_connections` | Conexiones encriptadas usuario↔bróker | ✅ Owner CRUD |
| `orders` | Órdenes de trading | ✅ Owner CRUD |
| `positions` | Posiciones abiertas | ✅ Owner CRUD |
| `trades` | Historial de trades ejecutados | ✅ Owner read+insert |
| `account_snapshots` | Snapshots de cuenta para gráficos históricos | ✅ Owner read+insert |

### 2.3 Tablas de Caché

| Tabla | Descripción | TTL |
|-------|------------|-----|
| `ai_analysis_cache` | Caché de análisis IA por símbolo | 1h default |
| `market_data_cache` | Caché de datos de mercado (precios, indicadores) | 5min default |
| `news_ai_analysis_cache` | Caché de análisis IA de noticias | 7 días |

### 2.4 Tablas de Soporte

| Tabla | Descripción |
|-------|------------|
| `push_subscriptions` | Suscripciones push (web + FCM nativo) |
| `scheduled_notifications` | Notificaciones programadas por admin |
| `referral_codes` | Códigos de referido |
| `referrals` | Registro de referidos y recompensas |
| `user_documents` | Documentos KYC del usuario |
| `user_alert_configs` | Configuración de alertas personalizadas |
| `signal_ai_analysis_history` | Historial de análisis IA por señal |
| `stock_price_alerts` | Alertas de precio para acciones |
| `course_progress` | Progreso de cursos educativos |
| `api_usage_logs` | Logs de uso de APIs externas |
| `audit_logs` | Auditoría de acciones del sistema |

### 2.5 Funciones de Base de Datos

```sql
-- Verificación de roles (SECURITY DEFINER, evita recursión RLS)
has_role(_user_id uuid, _role app_role) → boolean

-- Actualización automática de updated_at
update_updated_at_column() → trigger

-- Creación automática de perfil al registrarse
handle_new_user() → trigger (on auth.users INSERT)
```

### 2.6 Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `avatars` | ✅ | Fotos de perfil |
| `signal-charts` | ✅ | Capturas de gráficos de señales |
| `news-images` | ✅ | Imágenes generadas por IA para noticias |
| `user-documents` | ❌ | Documentos KYC (privado) |

---

## 3. Edge Functions (57 funciones — Deno/TypeScript)

### 3.1 Trading & Señales

| Función | Método | Descripción |
|---------|--------|-------------|
| `insert-signal` | POST | Crear señal (validado por rol admin) |
| `insert-signal-admin` | POST | Crear señal desde panel admin |
| `predict-signals` | POST | Predicción de señales con IA |
| `analyze-signal` | POST | Análisis IA de una señal específica |
| `signal-closed-notify` | POST | Notificar cierre de señal vía push |
| `mobile-signals` | POST | Endpoint optimizado para móvil |

### 3.2 Datos de Mercado

| Función | Método | Descripción | Caché |
|---------|--------|-------------|-------|
| `market-data` | POST | Precios + indicadores técnicos (RSI, MACD, SMA, BB, ADX, Ichimoku) | 3-capas: Mem→DB→API |
| `forex-data` | POST | Datos forex desde múltiples proveedores | DB 5min |
| `realtime-market` | POST | WebSocket proxy para precios en tiempo real | — |
| `signal-market-data` | POST | Precio actual para señales activas | Mem 3min |
| `signal-market-sentiment` | POST | Sentimiento de mercado por señal | DB 5min |
| `candlestick-chart` | POST | Datos de velas para gráficos | DB 5min |
| `alpha-vantage` | POST | Proxy Alpha Vantage API | — |
| `fmp-data` | POST | Proxy Financial Modeling Prep | — |
| `multi-tf-screener` | POST | Screener multi-temporalidad | 3-capas |
| `correlation-analysis` | POST | Matriz de correlación entre pares | — |

### 3.3 Análisis IA

| Función | Método | Descripción | Modelo |
|---------|--------|-------------|--------|
| `ai-analysis` | POST | Análisis técnico/fundamental completo | Lovable AI (Gemini/GPT) |
| `synthesize-analysis` | POST | Síntesis de múltiples análisis | Lovable AI |
| `analyze-patterns` | POST | Detección de patrones de velas | Lovable AI |
| `market-sentiment` | POST | Sentimiento de mercado agregado | Lovable AI |
| `economic-ai` | POST | Análisis de eventos económicos | Lovable AI |
| `stock-analysis` | POST | Análisis de acciones | Lovable AI |

### 3.4 Noticias

| Función | Método | Descripción |
|---------|--------|-------------|
| `fetch-news` | POST | Agregar noticias de 8 proveedores (Finnhub, NewsAPI, FXStreet, etc.) |
| `analysis-news` | POST | Noticias para módulo de análisis |
| `mobile-news` | POST | Endpoint optimizado para móvil |
| `news-ai-analysis` | POST | Análisis IA de una noticia |
| `news-currency-summary` | POST | Resumen de impacto por divisa |
| `news-historical-impact` | POST | Impacto histórico de noticias |
| `news-impact-charts` | POST | Datos para gráficos de impacto |
| `translate-news` | POST | Traducción multi-idioma con IA |
| `generate-news-image` | POST | Generación de imagen con IA |
| `currency-impact` | POST | Impacto en divisas |
| `currency-impact-ai` | POST | Impacto con análisis IA |
| `market-impact-summary` | POST | Resumen de impacto de mercado |

### 3.5 Análisis Fundamental

| Función | Método | Descripción |
|---------|--------|-------------|
| `monetary-policies` | POST | Políticas monetarias de bancos centrales |
| `historical-trends` | POST | Tendencias históricas |
| `analysis-proxy` | POST | Proxy hacia backend FastAPI |
| `indicator-alerts` | POST | Alertas basadas en indicadores |
| `economic-event-alerts` | POST | Alertas de eventos económicos |

### 3.6 Pagos (Stripe)

| Función | Método | Descripción |
|---------|--------|-------------|
| `create-checkout` | POST | Crear sesión de pago Stripe |
| `customer-portal` | POST | Portal de gestión de suscripción |
| `check-subscription` | POST | Verificar nivel de suscripción |

### 3.7 Notificaciones

| Función | Método | Descripción |
|---------|--------|-------------|
| `save-push-subscription` | POST | Guardar suscripción push |
| `send-push-notification` | POST | Enviar push (FCM v1) |
| `send-whatsapp` | POST | Enviar notificación WhatsApp (Twilio) |
| `process-scheduled-notifications` | POST | Procesar notificaciones programadas |
| `check-usage-alerts` | POST | Alertas de uso de API |

### 3.8 Portfolio & Bróker

| Función | Método | Descripción |
|---------|--------|-------------|
| `broker-connections` | POST | Gestión de conexiones de bróker |
| `broker-portfolio` | POST | Datos de portfolio del bróker |
| `sync-portfolio` | POST | Sincronización automática |

### 3.9 Utilidades

| Función | Método | Descripción |
|---------|--------|-------------|
| `symbol-search` | POST | Búsqueda de símbolos (forex, crypto, stocks) |
| `generate-report` | POST | Generar reporte PDF |
| `referrals` | POST | Gestión de programa de referidos |
| `cleanup-ai-cache` | POST | Limpieza de caché IA |
| `cleanup-market-cache` | POST | Limpieza de caché de mercado |
| `cleanup-news-ai-cache` | POST | Limpieza de caché de noticias IA |

---

## 4. Backend Python (FastAPI)

**Base URL:** `https://<VPS_IP>/api/v1`  
**Infraestructura:** Docker Compose (FastAPI + MongoDB + Redis + Nginx)

### 4.1 Endpoints de Noticias (`/api/v1/news`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar noticias con paginación y filtros |
| GET | `/{news_id}` | Detalle de una noticia |
| GET | `/currencies` | Noticias por divisa |
| GET | `/summary` | Resumen del mercado |
| GET | `/trends/{year}/{month}` | Tendencias históricas por mes |
| GET | `/trends/range` | Tendencias en rango de fechas |
| GET | `/top-by-impact` | Top noticias por impacto |
| POST | `/refresh` | Forzar actualización de noticias |

### 4.2 Endpoints de Análisis (`/api/v1/analysis`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/full/{symbol}` | Análisis completo (sentimiento, predicción, niveles, etc.) |
| GET | `/sentiment/{symbol}` | Sentimiento de mercado |
| GET | `/prediction/{symbol}` | Predicción de precio |
| GET | `/technical-levels/{symbol}` | Niveles técnicos (S/R, Fibonacci, pivotes) |
| GET | `/previous-day/{symbol}` | Datos del día anterior |
| GET | `/recommendations/{symbol}` | Recomendaciones estratégicas |
| GET | `/conclusions/{symbol}` | Conclusiones de mercado |
| GET | `/monetary-policies/{symbol}` | Políticas monetarias relevantes |
| GET | `/major-news/{symbol}` | Noticias principales |
| GET | `/relevant-news/{symbol}` | Noticias relevantes |
| GET | `/economic-events/{symbol}/{date}` | Eventos económicos por fecha |

### 4.3 Endpoints de IA (`/api/v1/ai`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/sentiment/{symbol}` | Análisis de sentimiento con IA |
| POST | `/prediction/{symbol}` | Predicción de precio con IA |
| POST | `/conclusions/{symbol}` | Conclusiones con IA |
| POST | `/recommendations/{symbol}` | Recomendaciones con IA |
| POST | `/full/{symbol}` | Análisis completo con IA |

### 4.4 Endpoints de Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Info del servidor |
| GET | `/health` | Health check |

---

## 5. Flujos de Datos Principales

### 5.1 Flujo de Señales de Trading

```
Admin crea señal → insert-signal-admin (Edge Fn)
    │
    ├─→ INSERT trading_signals (PostgreSQL)
    ├─→ signal-closed-notify → send-push-notification → FCM v1
    │
    └─→ Realtime (WebSocket) → Cliente React
            │
            ├─→ useSignals (React Query + Realtime subscription)
            ├─→ SignalCard / SignalCardCompact (memoizado)
            └─→ TargetProgressBar (progreso live con useRestPrice)
```

### 5.2 Flujo de Datos de Mercado (3 capas de caché)

```
Cliente solicita datos → useMarketData hook
    │
    ├─ 1. Client Memory Cache (Map, TTL 60s)
    │     ↓ miss
    ├─ 2. market-data Edge Function
    │     ├─ DB Cache (market_data_cache, TTL 3-10min)
    │     │     ↓ miss
    │     └─ 3. APIs Externas (paralelo)
    │           ├─ Alpha Vantage
    │           ├─ Financial Modeling Prep
    │           ├─ Twelve Data
    │           ├─ Finnhub
    │           └─ Polygon.io
    │
    └─→ Datos: OHLCV + RSI + MACD + SMA + BB + ADX + Stochastic + Ichimoku
```

### 5.3 Flujo de Noticias

```
Cliente → useRealNewsByDate → fetch-news Edge Function
    │
    ├─→ 8 proveedores en paralelo
    │     Finnhub, NewsAPI, FXStreet, Investing, Bloomberg,
    │     MarketAux, FMP, Alpha Vantage
    │
    ├─→ Deduplicación + Normalización (max 120 artículos)
    │
    ├─→ Análisis IA (sentimiento, impacto, categoría)
    │     └─ Cache: news_ai_analysis_cache (TTL 7 días)
    │
    ├─→ Traducción multi-idioma (Lovable AI)
    │     └─ Cache localizado: newsId_en, newsId_es, etc.
    │
    └─→ Imagen generada por IA → Storage: news-images bucket
```

### 5.4 Flujo de Análisis IA por Señal

```
Usuario abre SignalCard → "Estrategia IA"
    │
    ├─ 1. Memory Cache (clave = par+entry+tp+sl+lang)
    │     ↓ miss
    ├─ 2. LocalStorage (TTL 2h)
    │     ↓ miss
    ├─ 3. ai_analysis_cache (Supabase, TTL 2h)
    │     ↓ miss
    └─ 4. ai-analysis Edge Function
          └─ Lovable AI Gateway (Gemini/GPT)
              → Respuesta streaming con cursor animado
```

### 5.5 Flujo de Autenticación y Suscripción

```
Usuario → Auth Page (email/password)
    │
    ├─→ Supabase Auth → JWT token
    ├─→ handle_new_user trigger → profiles INSERT
    │
    └─→ Verificación de suscripción:
          check-subscription Edge Fn → Stripe API
              │
              ├─ Trial (7 días gratis, nivel premium)
              ├─ Básico ($30/mes) → tier 1
              ├─ Plus ($35/mes) → tier 2
              └─ Premium ($40/mes) → tier 3
              
          SubscriptionGate component → bloquea acceso por tier
          Admin override → acceso total (has_role check)
```

### 5.6 Flujo de Portfolio Multi-Bróker

```
Usuario conecta bróker → broker-connections Edge Fn
    │
    ├─→ Encriptación AES de credenciales
    ├─→ INSERT user_broker_connections
    │
    └─→ sync-portfolio Edge Fn (periódico)
          ├─→ Fetch posiciones/órdenes del bróker API
          ├─→ UPSERT positions, orders
          └─→ INSERT account_snapshots (para gráficos históricos)
```

---

## 6. APIs Externas Integradas

| Proveedor | Uso | Secret |
|-----------|-----|--------|
| Alpha Vantage | Indicadores técnicos, forex | `ALPHA_VANTAGE_API_KEY` |
| Financial Modeling Prep | Datos de acciones, forex | `FMP_API_KEY` |
| Twelve Data | Precios en tiempo real | `TWELVE_DATA_API_KEY` |
| Polygon.io | WebSocket de precios | `POLYGON_API_KEY` |
| Finnhub | Noticias, sentimiento | `FINNHUB_API_KEY` |
| NewsAPI | Noticias financieras | `NEWSAPI_API_KEY` |
| MarketAux | Noticias de mercado | `MARKETAUX_API_KEY` |
| RapidAPI | Servicios diversos | `RAPIDAPI_KEY` |
| Stripe | Pagos y suscripciones | `STRIPE_SECRET_KEY` |
| Twilio | WhatsApp notifications | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| Firebase (FCM v1) | Push nativo Android/iOS | `FCM_SERVICE_ACCOUNT` |
| Lovable AI Gateway | IA (Gemini, GPT) | `LOVABLE_API_KEY` |

---

## 7. Estrategia de Rendimiento

### 7.1 Frontend

| Técnica | Implementación |
|---------|---------------|
| Code Splitting | 67+ lazy-loaded pages via `React.lazy()` |
| Chunk Splitting | 8 manual chunks: react, router, query, motion, dates, supabase, ui-core/forms/overlay, charts |
| Lazy Sections | `LazySection` con IntersectionObserver (rootMargin 200px) |
| Lazy Images | `LazyImage` con native lazy + IO fallback |
| Route Prefetch | `usePrefetch` en hover/touchstart con `requestIdleCallback` |
| React Query | staleTime 3min, gcTime 15min, placeholderData global |
| Memoization | `React.memo` en SignalCardCompact y componentes de lista |
| Compression | Gzip + Brotli (vite-plugin-compression) |
| Transitions | AnimatePresence popLayout (150ms in / 80ms out) |
| Font Loading | Non-blocking preload con onload fallback |
| Preconnect | Supabase + Google Fonts DNS prefetch |

### 7.2 Caché por Capas

```
┌─────────────────┐
│  Client Memory   │  Map<string, {data, timestamp}>  TTL: 60s
├─────────────────┤
│  React Query     │  staleTime: 3min, gcTime: 15min
├─────────────────┤
│  LocalStorage    │  Análisis IA, preferencias       TTL: 2h
├─────────────────┤
│  Supabase Tables │  market_data_cache (5min)
│                  │  ai_analysis_cache (1-2h)
│                  │  news_ai_analysis_cache (7d)
├─────────────────┤
│  Redis (FastAPI) │  Respuestas de backend Python    TTL: variable
└─────────────────┘
```

---

## 8. Seguridad

| Control | Implementación |
|---------|---------------|
| Autenticación | Supabase Auth (email/password, JWT) |
| Autorización | RBAC via `user_roles` + `has_role()` SECURITY DEFINER |
| RLS | Habilitado en las 24 tablas |
| Credenciales bróker | Encriptación AES (`ENCRYPTION_KEY`) |
| API Keys | Almacenadas como Supabase Secrets (26 secrets) |
| CORS | Orígenes restringidos (FastAPI + Supabase) |
| Admin Access | Hostname check (`admin.coinssignals.com`) + role check |
| Rate Limiting | Throttle en `useMarketData` (2s mínimo entre requests) |

---

## 9. Internacionalización

9 idiomas soportados: `es`, `en`, `fr`, `de`, `it`, `pt`, `nl`, `ar`, `mt`

- Traducciones estáticas en `src/i18n/locales/*.ts`
- Traducciones dinámicas de noticias vía `translate-news` Edge Function
- Caché de traducciones localizado por idioma

---

## 10. PWA & Mobile

| Feature | Detalles |
|---------|---------|
| Service Worker | Workbox (autoUpdate), cache supabase-cache (24h) |
| Instalación | Banner flotante + página `/install` con guías por OS |
| Push Web | VAPID keys + Supabase push_subscriptions |
| Push Nativo | Capacitor + FCM v1 (Service Account) |
| Offline | Caché de assets estáticos (JS, CSS, HTML, iconos) |
| Manifest | standalone, portrait, theme #0a0f1a |

---

## 11. Infraestructura de Producción

```
┌───────────────────────────────┐
│  Lovable Cloud (Supabase)     │
│  ├─ PostgreSQL + Auth         │
│  ├─ 57 Edge Functions         │
│  ├─ Storage (4 buckets)       │
│  └─ Realtime WebSocket        │
└───────────────────────────────┘

┌───────────────────────────────┐
│  Hetzner VPS                  │
│  ├─ Nginx (SSL, gzip_static) │
│  ├─ FastAPI (:8000)           │
│  ├─ MongoDB                   │
│  ├─ Redis                     │
│  └─ Docker Compose            │
│     Ports: 127.0.0.1 only     │
└───────────────────────────────┘

┌───────────────────────────────┐
│  CDN / Lovable Hosting        │
│  └─ Frontend SPA (Vite build) │
│     Pre-compressed .gz + .br  │
└───────────────────────────────┘
```

---

## 12. Páginas del Frontend (35+ rutas)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Analysis | Dashboard principal con análisis técnico/fundamental |
| `/signals` | Signals | Lista de señales con filtros, favoritos, IA |
| `/news` | News | Agregador de noticias de 8 fuentes |
| `/news/:id` | NewsDetail | Detalle de noticia con análisis IA |
| `/ai-center` | AICenter | Centro de IA (Plus+) |
| `/stocks` | Stocks | Análisis de acciones (Plus+) |
| `/tools` | Tools | 20 herramientas de trading |
| `/portfolio` | Portfolio | Portfolio multi-bróker (Premium) |
| `/courses` | Courses | Cursos educativos |
| `/broker` | Broker | Directorio de brókers por región |
| `/performance` | Performance | Estadísticas de rendimiento |
| `/settings/*` | Settings | Configuración (perfil, seguridad, notif., apariencia) |
| `/subscriptions` | Subscriptions | Planes y pagos Stripe |
| `/admin` | Admin | Panel administrativo (admin only) |
| `/auth` | Auth | Login/Registro |
| `/install` | Install | Guía de instalación PWA |

### Herramientas (`/tools/*`)

Pip Calculator, Lot Calculator, Margin Calculator, Swap Calculator, Risk/Reward Calculator, Position Sizing, Compound Interest, Trading Journal, Economic Calendar, Institutional Calendar, Market Sessions, Trend Scanner, Volatility Scanner, Pattern Screener, RSI/MACD Screener, Multi-TF Screener, Correlation Matrix, Monte Carlo Simulation, Order Flow Analysis, Backtest Pro, Risk Manager Advanced.
