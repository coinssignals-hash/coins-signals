# 📸 Project Snapshot — 18 de Marzo 2026

> Estado completo de todas las páginas, funciones, iconos y componentes del proyecto.

---

## 🗺️ Mapa de Rutas y Páginas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `Analysis` | Dashboard principal con análisis técnico, predicciones, indicadores, niveles S/R, sentimiento |
| `/signals` | `Signals` | Señales de trading con tabs por día (hoy/mañana), cards V2, sparklines, confluence score |
| `/news` | `News` | Noticias económicas en tiempo real con filtros por divisa, impacto, categoría |
| `/news/saved` | `SavedNews` | Noticias guardadas por el usuario |
| `/news/:id` | `NewsDetail` | Detalle de noticia con análisis AI inline, impacto en divisas |
| `/performance` | `Performance` | Rendimiento de señales: precisión, rachas, gráficos diarios, breakdown por par |
| `/forum` | `Forum` | Foro comunitario con canales, mensajes, reacciones, DMs, temas diarios, votaciones |
| `/portfolio` | `Portfolio` | Portfolio multi-broker (Premium), sparklines de equity, historial, analytics |
| `/stocks` | `Stocks` | Análisis de acciones (Plus), cotizaciones, técnicos, fundamentales, sentimiento AI |
| `/ai-center` | `AICenter` | Centro de IA (Plus): módulos de análisis, creador de señales AI, gráficos AI |
| `/broker` | `Broker` | Catálogo de brokers con búsqueda, filtros, comparación, detalle |
| `/broker-rating` | `BrokerRating` | Rating y calificación de brokers |
| `/link-broker` | `LinkBroker` | Conexión de brokers vía API o CSV, sincronización de trades |
| `/courses` | `Courses` | Cursos de trading con progreso, video player, audio player |
| `/courses/lesson/:lessonId` | `LessonDetail` | Detalle de lección con reproductor multimedia |
| `/courses/media/:type` | `MediaLibrary` | Biblioteca de medios por tipo |
| `/tools` | `Tools` | Hub de herramientas de trading (20+ herramientas) |
| `/settings` | `Settings` | Configuración general del usuario |
| `/settings/personal` | `PersonalInfo` | Información personal del perfil |
| `/settings/documents` | `Documents` | Documentos del usuario |
| `/settings/security` | `Security` | Seguridad y contraseña |
| `/settings/notifications` | `Notifications` | Preferencias de notificaciones |
| `/settings/appearance` | `Appearance` | Tema, idioma, apariencia |
| `/subscriptions` | `Subscriptions` | Planes de suscripción con carrusel |
| `/referrals` | `Referrals` | Sistema de referidos |
| `/support` | `Support` | Soporte y ayuda |
| `/auth` | `Auth` | Login/registro con email |
| `/install` | `Install` | Guía de instalación PWA |
| `/onboarding` | `Onboarding` | Tour de bienvenida |
| `/about` | `About` | Acerca de, equipo |
| `/monitoring` | `Monitoring` | Monitoreo de servicios (admin) |
| `/create-signal` | `CreateSignal` | Crear señal manualmente |
| `/admin` | `Admin` | Panel de administración completo |

---

## 🔧 Herramientas de Trading (`/tools/*`)

| Ruta | Herramienta |
|------|-------------|
| `/tools/pip-calculator` | Calculadora de Pips |
| `/tools/lot-calculator` | Calculadora de Lotes |
| `/tools/margin-calculator` | Calculadora de Margen |
| `/tools/risk-reward` | Calculadora Riesgo/Beneficio |
| `/tools/position-sizing` | Tamaño de Posición |
| `/tools/swap-calculator` | Calculadora de Swaps |
| `/tools/compound-interest` | Interés Compuesto |
| `/tools/currency-converter` | Conversor de Divisas |
| `/tools/economic-calendar` | Calendario Económico |
| `/tools/institutional-calendar` | Calendario Institucional |
| `/tools/market-sessions` | Sesiones de Mercado |
| `/tools/correlation-matrix` | Matriz de Correlación |
| `/tools/volatility-scanner` | Scanner de Volatilidad |
| `/tools/trend-scanner` | Scanner de Tendencias |
| `/tools/pattern-screener` | Scanner de Patrones |
| `/tools/rsi-macd-screener` | Screener RSI/MACD |
| `/tools/multi-tf-screener` | Screener Multi-Timeframe |
| `/tools/order-flow` | Análisis de Flujo de Órdenes |
| `/tools/monte-carlo` | Simulación Monte Carlo |
| `/tools/risk-manager` | Gestor de Riesgo Avanzado |
| `/tools/backtest-pro` | Backtesting Pro |
| `/tools/trading-journal` | Diario de Trading |

---

## 🧩 Componentes Principales

### Layout
- `Header` — Barra superior con logo, búsqueda, notificaciones
- `BottomNav` — Navegación inferior (5 tabs: Análisis, Señales, Noticias, Herramientas, Más)
- `MainDrawer` — Menú lateral con todas las secciones, avatar, plan
- `PageShell` — Wrapper con transición, padding, bottom nav
- `PageTransition` — Animación de entrada/salida (framer-motion)
- `StaggerList` — Lista con animación escalonada
- `LanguageQuickSelect` — Selector rápido de idioma

### Signals
- `SignalCard` / `SignalCardV2` / `SignalCardCompact` — Cards de señal (3 variantes)
- `SignalChart` / `ZoomableChart` — Gráficos de señal interactivos
- `TargetProgressBar` — Barra de progreso hacia targets (TP1, TP2, TP3)
- `ConfluenceScore` — Score de confluencia técnica
- `PriceSparkline` — Mini gráfico de precio
- `MarketSentimentDashboard` — Dashboard de sentimiento
- `SignalPerformanceStats` — Estadísticas de rendimiento
- `SignalsDayGroup` / `SignalsDayTabs` — Agrupación por día
- `TodaySignalsGroup` / `TomorrowSignalsGroup` — Grupos hoy/mañana
- `SaveSignalToJournal` — Guardar señal al diario

### AI Center
- `AICenter` — Hub principal de módulos IA
- `AIChartPanel` — Panel de gráficos con IA
- `AIModelConfig` — Configuración de modelos
- `AIModuleCard` — Card de módulo AI
- `AIResultPanel` — Panel de resultados
- `AISignalCreator` — Creador de señales con IA
- `AISymbolSearch` — Búsqueda de símbolos
- `StreamingCursor` / `useStreamingBlocks` — Streaming de respuestas AI

### Analysis
- `HeroDashboard` — Dashboard hero con precio animado
- `CandlestickChart` — Gráfico de velas
- `TechnicalIndicatorsTabs` — Tabs de indicadores técnicos
- `TechnicalLevels` — Niveles de soporte/resistencia
- `MarketSentiment` — Sentimiento de mercado
- `PricePrediction` — Predicción de precio
- `MonetaryPolicies` — Políticas monetarias
- `EconomicEvents` — Eventos económicos
- `MajorNews` / `RelevantNews` — Noticias principales
- `MarketConclusions` — Conclusiones de mercado
- `StrategicRecommendations` — Recomendaciones estratégicas
- `RiskRewardCalculator` — Calculadora R:R inline
- `SymbolSearch` — Búsqueda de símbolos
- `AlertsPanel` — Panel de alertas
- `IndicatorsSummary` — Resumen de indicadores
- `QuickStatsGrid` — Grid de estadísticas rápidas
- `AnimatedPrice` — Precio con animación
- `CurrencyPairIcon` / `CurrencyIcon` — Iconos de divisas
- `TerminalStatusBar` — Barra de estado tipo terminal

### News
- `NewsCard` — Card de noticia con badge, categoría, impacto
- `NewsAISummaryInline` — Resumen AI dentro de la noticia
- `CurrencyFilter` — Filtro por divisa
- `CurrencyImpactModal` / `CurrencyImpactCharts` — Modal/gráficos de impacto
- `RealtimeCurrencyImpact` — Impacto en tiempo real
- `DateTabs` — Tabs por fecha
- `BiasBadge` / `CategoryBadge` / `CurrencyBadge` — Badges informativos
- `HistoricalChart` / `ImpactChart` — Gráficos históricos
- `LivePriceCircle` — Precio en vivo circular

### Forum
- `EmbeddedSignalCard` — Señal embebida en mensaje del foro
- `FavoriteUsersPanel` — Panel de usuarios favoritos
- `PastTopicsBrowser` — Navegador de temas pasados
- `SignalPicker` — Picker para compartir señales

### Portfolio
- `PortfolioWidget` — Widget principal de portfolio
- `PortfolioHistoryChart` — Gráfico de historial
- `EquitySparkline` — Sparkline de equity
- `TradeAnalytics` — Analytics de trades
- `TradeImportModal` — Modal de importación CSV

### Broker
- `BrokerCard` — Card de broker
- `BrokerCatalog` — Catálogo completo con API/CSV badges
- `BrokerCompare` — Comparador de brokers
- `BrokerDetail` — Detalle de broker
- `BrokerFilter` / `BrokerSearch` — Filtros y búsqueda

### Performance
- `PrecisionGauge` — Gauge de precisión
- `StreakWidget` — Widget de rachas
- `WeeklySummary` — Resumen semanal
- `DailyActivityChart` — Gráfico de actividad diaria
- `DailyBreakdownTable` — Tabla desglose diario
- `SignalDetailView` — Vista detallada de señal
- `CurrencyPairCard` — Card por par de divisas

### Stocks
- `StockQuoteCard` — Cotización en tiempo real
- `StockChart` — Gráfico de acciones
- `StockTechnicalsCard` — Análisis técnico
- `StockFinancialsCard` — Datos financieros
- `StockSentimentCard` — Sentimiento AI
- `StockAISummaryCard` — Resumen AI
- `StockNewsCard` — Noticias de acciones
- `StockProfileCard` — Perfil de empresa
- `StockCompare` — Comparador de acciones
- `StockPriceAlerts` — Alertas de precio
- `MarketIndicesTicker` — Ticker de índices

### Subscriptions
- `PlanCarousel` — Carrusel de planes
- `SubscriptionGate` — Gate por nivel de suscripción
- `SubscriptionPaywall` — Paywall

### Admin
- `AdminSidebar` — Sidebar de admin
- `AdminDashboardTab` — Dashboard principal
- `AdminUsersTab` — Gestión de usuarios
- `AdminSignalsTab` — Gestión de señales
- `AdminCreateSignalTab` — Crear señal
- `AdminTablesTab` / `AdminTablesTabV2` — Visor de tablas
- `AdminAnalyticsTab` — Analytics
- `AdminAuditTab` — Auditoría
- `AdminModerationTab` — Moderación del foro
- `AdminNotificationsTab` — Notificaciones push
- `AdminDocumentsTab` — Documentos
- `AdminHealthCheckTab` — Health check
- `AdminAPIUsageTab` — Uso de API
- `AdminGlobalSearch` — Búsqueda global

### UI Components (shadcn/ui)
- accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb
- button, calendar, card, chart, checkbox, collapsible, command
- context-menu, dialog, drawer, dropdown-menu, form, hover-card
- input, label, lazy-image, lazy-section, menubar, navigation-menu
- pagination, popover, progress, radio-group, scroll-area, select
- separator, sheet, sidebar, signal-style-card, skeleton, slider
- sonner, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip
- ScrollFadeTabs

---

## 🪝 Hooks Personalizados

| Hook | Función |
|------|---------|
| `useAuth` | Autenticación con Supabase |
| `useSignals` | Señales de trading (CRUD) |
| `useNews` / `useRealNews` | Noticias económicas |
| `useAIAnalysis` | Análisis con IA |
| `useAlphaVantage` | Datos de Alpha Vantage |
| `useAnalysisData` | Datos de análisis técnico |
| `useBrokerConnections` | Conexiones de brokers |
| `useBrokerData` | Datos de brokers |
| `useBrokerSync` | Sincronización de trades |
| `useCourseProgress` | Progreso de cursos |
| `useCurrencyImpactAI` | Impacto de noticias en divisas |
| `useFavoriteCurrencies` | Divisas favoritas |
| `useFavoriteSignals` | Señales favoritas |
| `useFavoriteSymbols` | Símbolos favoritos |
| `useFavoriteUsers` | Usuarios favoritos |
| `useForexChartData` | Datos de gráficos forex |
| `useForexData` | Datos forex en tiempo real |
| `useForum` | Lógica del foro |
| `useHistoricalTrends` | Tendencias históricas |
| `useImportedTrades` | Trades importados |
| `useIndicatorAlerts` | Alertas de indicadores |
| `useJournalSignalIds` | IDs de señales en diario |
| `useMarketData` | Datos de mercado |
| `useMultiPairPrices` | Precios multi-par |
| `useMultiTFScreener` | Screener multi-timeframe |
| `useNewNewsCount` | Contador de noticias nuevas |
| `useNewSignalsCount` | Contador de señales nuevas |
| `useNewsAIAnalysis` | Análisis AI de noticias |
| `useNewsCache` | Cache de noticias |
| `useNewsCurrencySummary` | Resumen por divisa |
| `useNewsHistoricalImpact` | Impacto histórico |
| `useNewsImage` | Imágenes de noticias |
| `useNewsTranslation` | Traducción de noticias |
| `usePerformance` | Métricas de rendimiento |
| `usePortfolio` | Portfolio multi-broker |
| `usePortfolioHistory` | Historial de portfolio |
| `usePrefetch` | Prefetch de datos |
| `usePreviousDayCandles` | Velas del día anterior |
| `useRealtimeMarket` | Mercado en tiempo real |
| `useReferrals` | Sistema de referidos |
| `useRestPrice` | Precio vía REST |
| `useSignalAutoClose` | Auto-cierre de señales |
| `useSignalMarketData` | Datos de mercado para señales |
| `useSignalMarketSentiment` | Sentimiento para señales |
| `useSignalRisk` | Riesgo de señales |
| `useSignalStrategy` | Estrategia de señales |
| `useStockData` | Datos de acciones |
| `useStockPriceAlerts` | Alertas de acciones |
| `useSubscription` | Suscripción del usuario |
| `useSupportResistanceAlerts` | Alertas S/R |
| `useTopicTranslation` | Traducción de temas |
| `useTranslatedNotes` | Notas traducidas |
| `useUserDocuments` | Documentos del usuario |
| `useUserRole` | Rol del usuario |
| `useAlertConfig` | Configuración de alertas |
| `useDateLocale` | Locale de fechas |
| `useDebounce` | Debounce de valores |

---

## ⚡ Edge Functions (Supabase)

| Función | Propósito |
|---------|-----------|
| `ai-analysis` | Análisis técnico con IA |
| `alpha-vantage` | Proxy Alpha Vantage |
| `analysis-news` | Noticias para análisis |
| `analysis-proxy` | Proxy de análisis |
| `analyze-patterns` | Detección de patrones |
| `analyze-signal` | Análisis de señal individual |
| `broker-connections` | Gestión conexiones broker |
| `broker-portfolio` | Portfolio de broker |
| `candlestick-chart` | Datos de velas |
| `check-subscription` | Verificar suscripción |
| `check-usage-alerts` | Alertas de uso |
| `cleanup-ai-cache` | Limpieza cache AI |
| `cleanup-market-cache` | Limpieza cache mercado |
| `cleanup-news-ai-cache` | Limpieza cache noticias AI |
| `correlation-analysis` | Análisis de correlación |
| `create-checkout` | Checkout Stripe |
| `currency-impact` | Impacto en divisas |
| `currency-impact-ai` | Impacto AI en divisas |
| `customer-portal` | Portal Stripe |
| `economic-ai` | Calendario económico AI |
| `economic-event-alerts` | Alertas eventos económicos |
| `fetch-news` | Obtener noticias |
| `fmp-data` | Datos de Financial Modeling Prep |
| `forex-data` | Datos forex |
| `generate-news-image` | Generar imagen para noticia |
| `generate-report` | Generar reporte |
| `health-check` | Estado de servicios |
| `historical-trends` | Tendencias históricas |
| `indicator-alerts` | Alertas de indicadores |
| `insert-signal` / `insert-signal-admin` | Insertar señal |
| `market-data` | Datos de mercado |
| `market-impact-summary` | Resumen de impacto |
| `market-sentiment` | Sentimiento de mercado |
| `mobile-news` | Noticias optimizadas para móvil |
| `mobile-signals` | Señales optimizadas para móvil |
| `monetary-policies` | Políticas monetarias |
| `multi-tf-screener` | Screener multi-timeframe |
| `news-ai-analysis` | Análisis AI de noticias |
| `news-currency-summary` | Resumen por divisa |
| `news-historical-impact` | Impacto histórico |
| `news-impact-charts` | Gráficos de impacto |
| `predict-signals` | Predicción de señales |
| `process-scheduled-notifications` | Procesar notificaciones programadas |
| `realtime-market` | Mercado en tiempo real |
| `referrals` | Sistema de referidos |
| `save-push-subscription` | Guardar suscripción push |
| `send-push-notification` | Enviar notificación push |
| `send-whatsapp` | Enviar WhatsApp (Twilio) |
| `signal-closed-notify` | Notificar cierre de señal |
| `signal-market-data` | Datos de mercado para señal |
| `signal-market-sentiment` | Sentimiento para señal |
| `stock-analysis` | Análisis de acciones |
| `symbol-search` | Búsqueda de símbolos |
| `sync-broker-trades` | Sincronizar trades de broker |
| `sync-portfolio` | Sincronizar portfolio |
| `synthesize-analysis` | Sintetizar análisis |
| `translate-news` | Traducir noticias |

---

## 🗄️ Tablas de Base de Datos

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuario |
| `trading_signals` | Señales de trading |
| `trading_journal` | Diario de trading |
| `favorite_signals` | Señales favoritas |
| `favorite_currencies` | Divisas favoritas |
| `favorite_symbols` | Símbolos favoritos |
| `favorite_users` | Usuarios favoritos |
| `imported_trades` | Trades importados |
| `course_progress` | Progreso de cursos |
| `push_subscriptions` | Suscripciones push |
| `scheduled_notifications` | Notificaciones programadas |
| `referral_codes` | Códigos de referido |
| `referrals` | Referidos |
| `stock_price_alerts` | Alertas de precio de acciones |
| `signal_ai_analysis_history` | Historial de análisis AI |
| `ai_analysis_cache` | Cache de análisis AI |
| `news_ai_analysis_cache` | Cache de análisis AI de noticias |
| `market_data_cache` | Cache de datos de mercado |
| `api_usage_logs` | Logs de uso de API |
| `audit_logs` | Logs de auditoría |
| `forum_channels` | Canales del foro |
| `forum_messages` | Mensajes del foro |
| `forum_reactions` | Reacciones del foro |
| `forum_direct_messages` | Mensajes directos |
| `forum_daily_topics` | Temas diarios |
| `forum_topic_votes` | Votos de temas |
| `forum_reports` | Reportes de moderación |
| `forum_user_bans` | Usuarios baneados |
| `brokers` | Catálogo de brokers |
| `user_broker_connections` | Conexiones de broker |
| `positions` | Posiciones abiertas |
| `orders` | Órdenes |
| `trades` | Trades ejecutados |
| `account_snapshots` | Snapshots de cuenta |

---

## 🌐 Idiomas Soportados

| Código | Idioma |
|--------|--------|
| `es` | Español |
| `en` | English |
| `pt` | Português |
| `fr` | Français |
| `de` | Deutsch |
| `it` | Italiano |
| `nl` | Nederlands |
| `ar` | العربية |
| `mt` | Malti |

---

## 🎨 Assets e Iconos

### Logos
- `src/assets/logo.png` / `src/assets/logo.svg` — Logo principal
- `src/assets/brand-logo-bg.svg` — Logo con fondo
- `public/logo.png` / `public/logo.svg` / `public/favicon.svg` — Favicon/logo público

### Brokers (26 logos)
`src/assets/brokers/`: admirals, avatrade, capital-com, charles-schwab, cmc-markets, degiro, etoro, exness, fp-markets, fxcm, fxtm, hfm, ic-markets, ig-group, interactive-brokers, oanda, pepperstone, plus500, roboforex, saxo-bank, swissquote, td-ameritrade, tickmill, vantage, xm-group, xtb

### Equipo
`src/assets/team/`: andres-lopez, cristopher-hayes, edith-sanchez, isabella-walker, kenji-tanaka

### UI Assets
- `src/assets/bull-card-bg.svg` — Fondo de card bull
- `src/assets/bull-silhouette.png` — Silueta de toro
- `src/assets/chart-signal.jpg` — Imagen de señal/gráfico
- `src/assets/jpy-usd-icon.svg` — Icono JPY/USD
- `src/assets/market-sentiment-chart.jpg` — Gráfico de sentimiento
- `src/assets/pinbar-pattern.png` — Patrón pinbar
- `src/assets/signal-card-bg.png` — Fondo de card de señal
- `src/assets/about-hero.jpg` — Hero de About

### PWA
- `public/pwa-192x192.png` / `public/pwa-512x512.png` — Iconos PWA
- `public/apple-touch-icon.png` — Icono Apple Touch

### Datos de Brokers (JSON)
`public/data/brokers/`: argentina, brasil, chile, colombia, costarica, ecuador, elsalvador, europa, internacionales_latam, mexico, nicaragua, panama, peru, usa_canada, uruguay, venezuela

---

## 🔐 Suscripciones y Gates

| Tier | Features Protegidos |
|------|---------------------|
| `free` | Acceso básico a señales, noticias, herramientas |
| `plus` | AI Center, Análisis de Acciones |
| `premium` | Portfolio Multi-Broker |

---

## 📱 PWA & Capacitor

- Service Worker: `public/sw-push.js`
- PWA Install Banner: `src/components/pwa/PWAInstallBanner.tsx`
- Capacitor Config: `capacitor.config.ts`
- Native Push: `src/utils/nativePushNotifications.ts`
- Push Utils: `src/utils/pushNotifications.ts`

---

## 🛡️ Admin Panel (solo `admin.coinssignals.com` / `localhost`)

- Dashboard con métricas
- Gestión de usuarios
- Gestión de señales
- Crear señales
- Visor de tablas (V1 y V2)
- Analytics
- Auditoría
- Moderación del foro
- Notificaciones push
- Documentos
- Health check
- Uso de API
- Búsqueda global

---

## 📦 Stack Tecnológico

- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 3
- **UI**: shadcn/ui, Radix UI, Framer Motion, Recharts, Lucide Icons
- **Estado**: TanStack React Query
- **Routing**: React Router DOM 6
- **Backend**: Supabase (PostgreSQL + Edge Functions Deno)
- **Backend secundario**: Python FastAPI + MongoDB + Redis (Hetzner)
- **Móvil**: Capacitor 8 (Android/iOS)
- **Pagos**: Stripe
- **Notificaciones**: Web Push, WhatsApp (Twilio), Capacitor Push
- **APIs**: FMP, Alpha Vantage, Finnhub, Polygon, Twelve Data

---

*Snapshot generado automáticamente el 18/03/2026*
