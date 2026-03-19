# 📸 PROJECT SNAPSHOT — 2026-03-19

## Resumen General
Aplicación profesional de trading y noticias económicas (mobile-first). Frontend React/TypeScript + Supabase Cloud + Backend Python (Hetzner).

---

## 🗂️ Páginas (32 rutas)

### Principales
| Ruta | Página | Protección |
|------|--------|------------|
| `/` | Analysis (home) | — |
| `/signals` | Signals | — |
| `/news` | News | — |
| `/news/saved` | SavedNews | — |
| `/news/:id` | NewsDetail | — |
| `/monitoring` | Monitoring | — |
| `/auth` | Auth | — |
| `/forum` | Forum | — |
| `/courses` | Courses | — |
| `/courses/media/:type` | MediaLibrary | — |
| `/courses/lesson/:lessonId` | LessonDetail | — |
| `/referrals` | Referrals | — |
| `/broker` | Broker | — |
| `/broker-rating` | BrokerRating | — |
| `/link-broker` | LinkBroker | — |
| `/support` | Support | — |
| `/subscriptions` | Subscriptions | — |
| `/install` | Install | — |
| `/onboarding` | Onboarding | — |
| `/performance` | Performance | — |
| `/about` | About | — |
| `/achievements` | Achievements | — |
| `/create-signal` | CreateSignal | — |
| `/ai-center` | AICenter | SubscriptionGate (plus) |
| `/stocks` | Stocks | SubscriptionGate (plus) |
| `/portfolio` | Portfolio | SubscriptionGate (premium) |
| `/admin` | Admin | hostname check |

### Settings (5 sub-rutas)
| Ruta | Página |
|------|--------|
| `/settings` | Settings (perfil) |
| `/settings/personal` | PersonalInfo |
| `/settings/documents` | Documents |
| `/settings/security` | Security |
| `/settings/notifications` | Notifications |
| `/settings/appearance` | Appearance |

### Tools (22 herramientas)
| Ruta | Herramienta |
|------|-------------|
| `/tools` | Tools (índice) |
| `/tools/pip-calculator` | PipCalculator |
| `/tools/economic-calendar` | EconomicCalendar |
| `/tools/rsi-macd-screener` | RsiMacdScreener |
| `/tools/lot-calculator` | LotCalculator |
| `/tools/margin-calculator` | MarginCalculator |
| `/tools/trading-journal` | TradingJournal |
| `/tools/trend-scanner` | TrendScanner |
| `/tools/risk-reward` | RiskRewardCalculator |
| `/tools/position-sizing` | PositionSizing |
| `/tools/swap-calculator` | SwapCalculator |
| `/tools/compound-interest` | CompoundInterestCalculator |
| `/tools/correlation-matrix` | CorrelationMatrix |
| `/tools/volatility-scanner` | VolatilityScanner |
| `/tools/pattern-screener` | PatternScreener |
| `/tools/monte-carlo` | MonteCarloSimulation |
| `/tools/risk-manager` | RiskManagerAdvanced |
| `/tools/multi-tf-screener` | MultiTFScreener |
| `/tools/order-flow` | OrderFlowAnalysis |
| `/tools/backtest-pro` | BacktestPro |
| `/tools/currency-converter` | CurrencyConverter |
| `/tools/institutional-calendar` | InstitutionalCalendar |
| `/tools/market-sessions` | MarketSessions |

---

## 🧩 Componentes UI (18 grupos)
- `admin/` — Panel de administración
- `analysis/` — Análisis de mercado
- `broker/` — Conexión y gestión de brokers
- `courses/` — Cursos y lecciones
- `forum/` — Chat, canales, DMs, reacciones
- `layout/` — MainDrawer, BottomNav, headers
- `monitoring/` — Monitoreo de mercado
- `news/` — Noticias y análisis AI
- `notifications/` — Push y alertas
- `onboarding/` — Tour de bienvenida
- `performance/` — Métricas de rendimiento
- `portfolio/` — Portfolio multi-broker
- `pwa/` — PWA install banner
- `settings/` — Configuración de usuario
- `signals/` — Señales de trading
- `stocks/` — Análisis de acciones
- `subscriptions/` — Planes y pagos
- `ui/` — Shadcn/Radix primitives

---

## 🪝 Hooks Personalizados (64)
useAIAnalysis, useAchievements, useAlertConfig, useAlphaVantage, useAnalysisData, useAuth, useBrokerConnections, useBrokerData, useBrokerSync, useCourseProgress, useCurrencyImpactAI, useDateLocale, useDebounce, useFavoriteCurrencies, useFavoriteSignals, useFavoriteSymbols, useFavoriteUsers, useForexChartData, useForexData, useForum, useHistoricalTrends, useImportedTrades, useIndicatorAlerts, useJournalSignalIds, useMT5Sync, useMarketData, useMobile, useMultiPairPrices, useMultiTFScreener, useNewNewsCount, useNewSignalsCount, useNews, useNewsAIAnalysis, useNewsCache, useNewsCurrencySummary, useNewsHistoricalImpact, useNewsImage, useNewsTranslation, usePerformance, usePortfolio, usePortfolioHistory, usePrefetch, usePreviousDayCandles, useRealNews, useRealtimeMarket, useReferrals, useRestPrice, useSignalAutoClose, useSignalMarketData, useSignalMarketSentiment, useSignalRisk, useSignalStrategy, useSignals, useStockData, useStockPriceAlerts, useSubscription, useSupportResistanceAlerts, useToast, useTopicTranslation, useTranslatedNotes, useUserDocuments, useUserRole

---

## ⚡ Edge Functions (59)
ai-analysis, alpha-vantage, analysis-news, analysis-proxy, analyze-patterns, analyze-signal, broker-connections, broker-portfolio, candlestick-chart, check-subscription, check-usage-alerts, cleanup-ai-cache, cleanup-market-cache, cleanup-news-ai-cache, correlation-analysis, create-checkout, currency-impact-ai, currency-impact, customer-portal, economic-ai, economic-event-alerts, fetch-news, fmp-data, forex-data, generate-news-image, generate-report, health-check, historical-trends, indicator-alerts, insert-signal-admin, insert-signal, market-data, market-impact-summary, market-sentiment, mobile-news, mobile-signals, monetary-policies, mt5-bridge, multi-tf-screener, news-ai-analysis, news-currency-summary, news-historical-impact, news-impact-charts, predict-signals, process-scheduled-notifications, realtime-market, referrals, save-push-subscription, send-push-notification, send-whatsapp, signal-closed-notify, signal-market-data, signal-market-sentiment, stock-analysis, symbol-search, sync-broker-trades, sync-portfolio, synthesize-analysis, translate-news

---

## 🗄️ Tablas de Base de Datos (35)
account_snapshots, ai_analysis_cache, api_usage_logs, audit_logs, brokers, course_progress, favorite_currencies, favorite_signals, favorite_symbols, favorite_users, forum_channels, forum_daily_topics, forum_direct_messages, forum_messages, forum_reactions, forum_reports, forum_topic_votes, forum_user_bans, imported_trades, market_data_cache, news_ai_analysis_cache, orders, positions, profiles, push_subscriptions, referral_codes, referrals, scheduled_notifications, signal_ai_analysis_history, stock_price_alerts, trades, trading_journal, trading_signals, user_achievements, user_alert_configs, user_broker_connections, user_documents, user_roles

---

## 🔐 Enums
- `app_role`: admin, moderator, user

## 🔧 Funciones DB
- `has_role(_user_id, _role)` — Security definer para RLS

---

## 📦 Stack Tecnológico
| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3 |
| UI Kit | Shadcn/Radix, Framer Motion, Recharts |
| State | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Mobile | Capacitor 8 (Android/iOS) |
| Backend Cloud | Supabase (Lovable Cloud) — PostgreSQL, Edge Functions, Auth, Storage |
| Backend Python | FastAPI + MongoDB + Redis (Hetzner) |
| Payments | Stripe (checkout, portal) |
| Notifications | Web Push, Twilio WhatsApp, Capacitor Push |
| CI/CD | GitHub Actions (deploy-backend, build-frontend + APK) |

---

## 📊 Métricas del Proyecto
- **Páginas**: 32 rutas
- **Herramientas de Trading**: 22
- **Edge Functions**: 59
- **Tablas DB**: 35+
- **Hooks**: 64
- **Grupos de Componentes**: 18

---

## 🆕 Cambios recientes (2026-03-19)
- Toggle de alarma (🔔/🔕) añadido al menú lateral junto al selector de idioma
- Alias del perfil se muestra en el drawer en lugar de "Bienvenido"
- Campo `signal_alerts_enabled` integrado en MainDrawer

---

*Snapshot generado el 2026-03-19. Referencia arquitectónica completa del estado del proyecto.*
