export type Language = 'es' | 'en' | 'pt' | 'fr';

export const LANGUAGE_LABELS: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
  pt: '🇧🇷',
  fr: '🇫🇷',
};

type TranslationKeys = {
  // Navigation
  nav_ideas: string;
  nav_portfolio: string;
  nav_news: string;
  nav_signals: string;
  nav_courses: string;
  nav_brokers: string;
  nav_performance: string;
  nav_referrals: string;
  nav_support: string;
  nav_about: string;
  nav_settings: string;
  nav_more: string;
  nav_saved_news: string;

  // Drawer
  drawer_welcome: string;
  drawer_login_sync: string;
  drawer_login: string;
  drawer_logout: string;
  drawer_session_closed: string;
  drawer_session_closed_desc: string;
  drawer_synced: string;
  drawer_profile_settings: string;
  drawer_subscriptions: string;
  drawer_referral_bonus: string;
  drawer_link_broker: string;
  drawer_security: string;
  drawer_courses_tutorials: string;
  drawer_earnings: string;
  drawer_broker_score: string;
  drawer_contact_support: string;
  drawer_about_us: string;
  drawer_preferences: string;
  drawer_notifications: string;
  drawer_appearance: string;
  drawer_language_tz: string;
  drawer_install_app: string;
  drawer_new: string;

  // Settings
  settings_title: string;
  settings_profile: string;
  settings_personal_info: string;
  settings_personal_info_desc: string;
  settings_documents: string;
  settings_documents_desc: string;
  settings_security: string;
  settings_security_desc: string;
  settings_preferences: string;
  settings_notifications: string;
  settings_notifications_desc: string;
  settings_appearance: string;
  settings_appearance_desc: string;
  settings_language_tz: string;
  settings_language_tz_desc: string;
  settings_help: string;
  settings_app_tour: string;
  settings_app_tour_desc: string;

  // Appearance
  appearance_title: string;
  appearance_prefs: string;
  appearance_theme: string;
  appearance_theme_dark: string;
  appearance_theme_light: string;
  appearance_theme_system: string;
  appearance_language: string;
  appearance_font_size: string;
  appearance_timezone: string;

  // Signals page
  signals_today: string;
  signals_yesterday: string;
  signals_tomorrow: string;
  signals_all: string;
  signals_favorites: string;
  signals_count: string;
  signals_no_signals: string;
  signals_no_yesterday: string;
  signals_no_date: string;
  signals_sort_recent: string;
  signals_sort_oldest: string;
  signals_sort_prob_high: string;
  signals_sort_prob_low: string;
  signals_sort_pips_high: string;
  signals_sort_pips_low: string;
  signals_view_full: string;
  signals_view_compact: string;

  // Signal Card
  signal_buy: string;
  signal_sell: string;
  signal_bullish: string;
  signal_bearish: string;
  signal_entry: string;
  signal_take_profit: string;
  signal_stop_loss: string;
  signal_resistance: string;
  signal_support: string;
  signal_probability: string;
  signal_risk: string;
  signal_status: string;
  signal_status_active: string;
  signal_status_pending: string;
  signal_status_closed: string;
  signal_information: string;
  signal_strategy: string;
  signal_strategy_duration: string;
  signal_strategy_approach: string;
  signal_strategy_session: string;
  signal_strategy_best_time: string;
  signal_strategy_candle: string;
  signal_analyzing: string;
  signal_market_sentiment: string;
  signal_currency_impact: string;
  signal_copy_price: string;
  signal_positive: string;
  signal_negative: string;
  signal_neutral: string;
  signal_long: string;
  signal_short: string;

  // Index / Analysis page
  index_timeframe_5min: string;
  index_timeframe_15min: string;
  index_timeframe_30min: string;
  index_timeframe_1h: string;
  index_timeframe_4h: string;
  index_timeframe_1day: string;
  index_timeframe_1week: string;
  index_indicator_alerts: string;
  index_api_limit: string;
  index_api_limit_desc: string;
  index_reconnecting: string;
  index_reconnecting_desc: string;
  index_realtime_lost: string;
  index_cached_data: string;
  index_tab_price: string;
  index_tab_rsi: string;
  index_tab_macd: string;
  index_tab_bollinger: string;
  index_tab_stochastic: string;

  // News page
  news_title: string;
  news_currencies: string;
  news_last_updated: string;
  news_sources: string;
  news_error_loading: string;
  news_unknown_error: string;
  news_retry: string;
  news_no_news_currencies: string;
  news_no_news_date: string;
  news_clear_filters: string;
  news_top_news: string;
  news_historical_impact: string;
  news_confidence: string;
  news_average: string;
  news_top_badge: string;
  news_all_currencies: string;

  // News Detail
  news_detail_error_loading: string;
  news_detail_unavailable: string;
  news_detail_unavailable_desc: string;
  news_detail_refresh: string;
  news_detail_recent: string;
  news_detail_view_all: string;
  news_detail_go_home: string;
  news_detail_cached_notice: string;
  news_detail_back: string;
  news_detail_ai_analysis: string;
  news_detail_analyzing: string;
  news_detail_key_points: string;
  news_detail_trader_conclusion: string;
  news_detail_risk: string;
  news_detail_risk_high: string;
  news_detail_risk_medium: string;
  news_detail_risk_low: string;
  news_detail_horizon: string;
  news_detail_horizon_short: string;
  news_detail_horizon_medium: string;
  news_detail_horizon_long: string;
  news_detail_bias: string;
  news_detail_bullish: string;
  news_detail_bearish: string;
  news_detail_neutral: string;
  news_detail_strong: string;
  news_detail_moderate: string;
  news_detail_weak: string;
  news_detail_recommended_pairs: string;
  news_detail_market_impact: string;
  news_detail_suggested_strategy: string;
  news_detail_summary: string;
  news_detail_ai_unavailable: string;
  news_detail_affected_currencies: string;
  news_detail_live_impact: string;
  news_detail_relevance: string;
  news_detail_view_full_article: string;

  // Portfolio page
  portfolio_title: string;
  portfolio_subtitle: string;
  portfolio_login_banner: string;
  portfolio_login_banner_desc: string;
  portfolio_login: string;
  portfolio_equity: string;
  portfolio_cash: string;
  portfolio_unrealized_pnl: string;
  portfolio_positions: string;
  portfolio_demo_tooltip: string;
  portfolio_no_positions: string;
  portfolio_connect_broker: string;

  // Performance page
  perf_loading: string;
  perf_no_signals_week: string;
  perf_most_moved: string;
  perf_buy: string;
  perf_sell: string;
  perf_total_operation_time: string;

  // Analysis components
  analysis_market_sentiment: string;
  analysis_loading_sentiment: string;
  analysis_ai_generated: string;
  analysis_bullish: string;
  analysis_bearish: string;
  analysis_neutral: string;
  analysis_high: string;
  analysis_low: string;
  analysis_change: string;
  analysis_pips: string;
  analysis_buy_signal: string;
  analysis_sell_signal: string;
  analysis_neutral_signal: string;

  analysis_price_prediction: string;
  analysis_loading_prediction: string;
  analysis_trend_bullish: string;
  analysis_trend_bearish: string;
  analysis_trend_sideways: string;
  analysis_expected_low: string;
  analysis_expected_close: string;
  analysis_expected_high: string;
  analysis_prediction_confidence: string;
  analysis_day_synthesis: string;
  analysis_last_update: string;

  analysis_technical_levels: string;
  analysis_loading_levels: string;
  analysis_pivot_point: string;
  analysis_key_resistances: string;
  analysis_key_supports: string;
  analysis_fibonacci_levels: string;
  analysis_strong: string;
  analysis_moderate: string;
  analysis_weak: string;

  analysis_strategic_recommendations: string;
  analysis_loading_recommendations: string;
  analysis_long_term_traders: string;
  analysis_short_term_traders: string;
  analysis_strategy_label: string;
  analysis_entry_label: string;
  analysis_target_1: string;
  analysis_target_2: string;
  analysis_horizon: string;
  analysis_watch: string;

  analysis_conclusions: string;
  analysis_loading_conclusions: string;
  analysis_expected_direction: string;
  analysis_detailed_technical: string;
  analysis_very_short_term: string;
  analysis_short_term: string;
  analysis_medium_term: string;
  analysis_probability_label: string;
  analysis_target_label: string;
  analysis_range_label: string;
  analysis_technical_summary: string;
  analysis_for_bulls: string;
  analysis_bearish_scenario: string;
  analysis_summary: string;
  analysis_key_factors: string;
  analysis_risks: string;
  analysis_opportunities: string;
  analysis_outlook: string;

  analysis_monetary_policies: string;
  analysis_loading_policies: string;
  analysis_current_rate: string;
  analysis_last_decision: string;
  analysis_next_meeting: string;
  analysis_expectations: string;
  analysis_end_year_rate: string;

  analysis_economic_events: string;
  analysis_loading_events: string;
  analysis_no_events: string;
  analysis_time: string;
  analysis_events: string;
  analysis_description: string;
  analysis_impact: string;
  analysis_results: string;

  analysis_major_news: string;
  analysis_featured_events: string;
  analysis_loading_news: string;
  analysis_no_impact_news: string;
  analysis_positive_for: string;
  analysis_negative_for: string;
  analysis_source: string;

  analysis_relevant_news: string;
  analysis_loading_relevant: string;
  analysis_no_relevant_news: string;
  analysis_impact_high: string;
  analysis_impact_medium: string;
  analysis_impact_low: string;
  analysis_view_more_news: string;

  // Currency header
  currency_max: string;
  currency_min: string;

  // AI hooks
  ai_rate_limit: string;
  ai_rate_limit_desc: string;
  ai_credits_exhausted: string;
  ai_credits_exhausted_desc: string;
  ai_analysis_generated: string;
  ai_analysis_updated: string;

  // Common
  common_loading: string;
  common_error: string;
  common_retry: string;
  common_close: string;
  common_save: string;
  common_cancel: string;
};

const es: TranslationKeys = {
  nav_ideas: 'Ideas',
  nav_portfolio: 'Portfolio',
  nav_news: 'Noticias',
  nav_signals: 'Señales',
  nav_courses: 'Cursos',
  nav_brokers: 'Brokers',
  nav_performance: 'Rendimientos',
  nav_referrals: 'Referidos',
  nav_support: 'Soporte',
  nav_about: 'Sobre Nosotros',
  nav_settings: 'Ajustes',
  nav_more: 'Más',
  nav_saved_news: 'Noticias Guardadas',

  drawer_welcome: 'Bienvenido',
  drawer_login_sync: 'Inicia sesión para sincronizar',
  drawer_login: 'Iniciar Sesión',
  drawer_logout: 'Cerrar Sesión',
  drawer_session_closed: 'Sesión cerrada',
  drawer_session_closed_desc: 'Has cerrado sesión correctamente',
  drawer_synced: 'Sincronizado',
  drawer_profile_settings: 'Ajuste De Perfil',
  drawer_subscriptions: 'Suscripciones',
  drawer_referral_bonus: 'Bonos Por Referidos',
  drawer_link_broker: 'Vincular Broker',
  drawer_security: 'Seguridad',
  drawer_courses_tutorials: 'Cursos y Tutoriales',
  drawer_earnings: 'Rendimientos Y Ganancias',
  drawer_broker_score: 'Puntuación De Broker',
  drawer_contact_support: 'Contacto y Soporte',
  drawer_about_us: 'Sobre Nosotros',
  drawer_preferences: 'Preferencias',
  drawer_notifications: 'Notificaciones',
  drawer_appearance: 'Aspecto',
  drawer_language_tz: 'Idioma y Zona Horaria',
  drawer_install_app: 'Instalar App',
  drawer_new: 'nuevas',

  settings_title: 'Ajustes',
  settings_profile: 'Perfil',
  settings_personal_info: 'Información Personal',
  settings_personal_info_desc: 'Nombre, fecha de nacimiento, dirección',
  settings_documents: 'Documentos',
  settings_documents_desc: 'Prueba de identidad y residencia',
  settings_security: 'Seguridad',
  settings_security_desc: 'Contraseña, autenticación, biométrico',
  settings_preferences: 'Preferencias',
  settings_notifications: 'Notificaciones',
  settings_notifications_desc: 'Alertas, señales, actualizaciones',
  settings_appearance: 'Aspecto',
  settings_appearance_desc: 'Tema, tamaño de letra',
  settings_language_tz: 'Idioma y Zona Horaria',
  settings_language_tz_desc: 'Idioma, zona horaria',
  settings_help: 'Ayuda',
  settings_app_tour: 'Tour de la App',
  settings_app_tour_desc: 'Revisa las funciones principales',

  appearance_title: 'Aspecto',
  appearance_prefs: 'Preferencias',
  appearance_theme: 'Tema',
  appearance_theme_dark: 'Oscuro',
  appearance_theme_light: 'Claro',
  appearance_theme_system: 'Sistema',
  appearance_language: 'Idioma',
  appearance_font_size: 'Tamaño de Letra',
  appearance_timezone: 'Zona Horaria',

  signals_today: 'Hoy',
  signals_yesterday: 'Ayer',
  signals_tomorrow: 'Mañana',
  signals_all: 'Todos',
  signals_favorites: 'Favoritos',
  signals_count: 'señales',
  signals_no_signals: 'No hay señales disponibles',
  signals_no_yesterday: 'No hay señales de ayer',
  signals_no_date: 'No hay señales para esta fecha',
  signals_sort_recent: 'Más recientes',
  signals_sort_oldest: 'Más antiguas',
  signals_sort_prob_high: 'Mayor probabilidad',
  signals_sort_prob_low: 'Menor probabilidad',
  signals_sort_pips_high: 'Más pips',
  signals_sort_pips_low: 'Menos pips',
  signals_view_full: 'Vista completa',
  signals_view_compact: 'Vista compacta',

  signal_buy: 'COMPRAR',
  signal_sell: 'VENDER',
  signal_bullish: 'Alcista',
  signal_bearish: 'Bajista',
  signal_entry: 'Precio de Entrada',
  signal_take_profit: 'Take Profit',
  signal_stop_loss: 'Stop Loss',
  signal_resistance: 'Resistencia',
  signal_support: 'Soporte',
  signal_probability: 'Probabilidad',
  signal_risk: 'Riesgo',
  signal_status: 'Estado',
  signal_status_active: 'Activa',
  signal_status_pending: 'Pendiente',
  signal_status_closed: 'Cerrada',
  signal_information: 'Información',
  signal_strategy: 'Estrategia Sugerida',
  signal_strategy_duration: 'Duración',
  signal_strategy_approach: 'Enfoque',
  signal_strategy_session: 'Sesión',
  signal_strategy_best_time: 'Mejor Hora',
  signal_strategy_candle: 'Vela de Confirmación',
  signal_analyzing: 'Analizando con IA...',
  signal_market_sentiment: 'Sentimiento del Mercado',
  signal_currency_impact: 'Impacto de Divisas',
  signal_copy_price: 'Copiar precio',
  signal_positive: 'Positivo',
  signal_negative: 'Negativo',
  signal_neutral: 'Neutral',
  signal_long: 'Largo (Long)',
  signal_short: 'Corto (Short)',

  index_timeframe_5min: '5 Min',
  index_timeframe_15min: '15 Min',
  index_timeframe_30min: '30 Min',
  index_timeframe_1h: '1 Hora',
  index_timeframe_4h: '4 Horas',
  index_timeframe_1day: '1 Día',
  index_timeframe_1week: '1 Semana',
  index_indicator_alerts: 'Alertas de Indicadores',
  index_api_limit: 'Límite de API alcanzado',
  index_api_limit_desc: 'Actualizando en 60 segundos...',
  index_reconnecting: 'Reconectando datos en tiempo real...',
  index_reconnecting_desc: 'Reintentando automáticamente',
  index_realtime_lost: 'Conexión en tiempo real perdida',
  index_cached_data: 'Datos desde caché',
  index_tab_price: 'Precio',
  index_tab_rsi: 'RSI',
  index_tab_macd: 'MACD',
  index_tab_bollinger: 'Bollinger',
  index_tab_stochastic: 'Estocástico',

  news_title: 'Principales Noticias',
  news_currencies: 'Monedas',
  news_last_updated: 'Última actualización',
  news_sources: 'Fuentes',
  news_error_loading: 'Error al cargar noticias',
  news_unknown_error: 'Error desconocido',
  news_retry: 'Reintentar',
  news_no_news_currencies: 'No hay noticias para las divisas seleccionadas',
  news_no_news_date: 'No hay noticias para esta fecha',
  news_clear_filters: 'Limpiar filtros',
  news_top_news: 'Top News',
  news_historical_impact: 'Impacto Histórico',
  news_confidence: 'Confianza',
  news_average: 'Promedio',
  news_top_badge: '🔥 Top News',
  news_all_currencies: 'Todas',

  news_detail_error_loading: 'Error al cargar la noticia',
  news_detail_unavailable: 'Noticia no disponible',
  news_detail_unavailable_desc: 'Esta noticia ya no está en el feed. Aquí tienes las noticias más recientes.',
  news_detail_refresh: 'Actualizar noticias',
  news_detail_recent: 'Noticias Recientes',
  news_detail_view_all: 'Ver todas las noticias',
  news_detail_go_home: 'Ir al inicio',
  news_detail_cached_notice: 'Mostrando versión guardada. Esta noticia ya no está en el feed actual.',
  news_detail_back: 'Volver a noticias',
  news_detail_ai_analysis: 'Análisis IA',
  news_detail_analyzing: 'Analizando con IA...',
  news_detail_key_points: 'Puntos Clave',
  news_detail_trader_conclusion: 'Conclusión para Traders',
  news_detail_risk: 'Riesgo',
  news_detail_risk_high: 'Alto',
  news_detail_risk_medium: 'Medio',
  news_detail_risk_low: 'Bajo',
  news_detail_horizon: 'Horizonte',
  news_detail_horizon_short: 'Corto Plazo',
  news_detail_horizon_medium: 'Mediano Plazo',
  news_detail_horizon_long: 'Largo Plazo',
  news_detail_bias: 'Sesgo',
  news_detail_bullish: 'Alcista',
  news_detail_bearish: 'Bajista',
  news_detail_neutral: 'Neutral',
  news_detail_strong: 'Fuerte',
  news_detail_moderate: 'Moderado',
  news_detail_weak: 'Débil',
  news_detail_recommended_pairs: 'Pares Recomendados',
  news_detail_market_impact: 'Impacto en Mercado',
  news_detail_suggested_strategy: 'Estrategia Sugerida',
  news_detail_summary: 'Resumen',
  news_detail_ai_unavailable: 'El análisis IA no está disponible en este momento.',
  news_detail_affected_currencies: 'Divisas Afectadas',
  news_detail_live_impact: 'Ver impacto en vivo',
  news_detail_relevance: 'Relevancia',
  news_detail_view_full_article: 'Ver artículo completo en',

  portfolio_title: 'Portfolio',
  portfolio_subtitle: 'Vista unificada de todos tus brokers',
  portfolio_login_banner: 'Inicia sesión para guardar tu portfolio',
  portfolio_login_banner_desc: 'Conecta tus brokers y sincroniza tus datos',
  portfolio_login: 'Iniciar Sesión',
  portfolio_equity: 'Equity Total',
  portfolio_cash: 'Cash Disponible',
  portfolio_unrealized_pnl: 'PnL No Realizado',
  portfolio_positions: 'Posiciones',
  portfolio_demo_tooltip: 'Estos datos son ficticios. Inicia sesión para ver tu portfolio real.',
  portfolio_no_positions: 'Sin posiciones abiertas',
  portfolio_connect_broker: 'Conectar broker',

  perf_loading: 'Cargando datos...',
  perf_no_signals_week: 'No hay señales para esta semana',
  perf_most_moved: 'Moneda Mas Movida',
  perf_buy: 'Comprar',
  perf_sell: 'Vender',
  perf_total_operation_time: 'Horas',

  // Analysis components
  analysis_market_sentiment: 'Sentimiento del Mercado',
  analysis_loading_sentiment: 'Cargando sentimiento...',
  analysis_ai_generated: 'Análisis generado con IA',
  analysis_bullish: 'ALCISTA',
  analysis_bearish: 'BAJISTA',
  analysis_neutral: 'NEUTRAL',
  analysis_high: 'Máximo',
  analysis_low: 'Mínimo',
  analysis_change: 'Cambio',
  analysis_pips: 'Pips',
  analysis_buy_signal: 'Compra',
  analysis_sell_signal: 'Venta',
  analysis_neutral_signal: 'Neutro',

  analysis_price_prediction: 'Predicción Del Precio',
  analysis_loading_prediction: 'Cargando predicción...',
  analysis_trend_bullish: 'Tendencia Alcista',
  analysis_trend_bearish: 'Tendencia Bajista',
  analysis_trend_sideways: 'Tendencia Lateral',
  analysis_expected_low: 'Mínimo Esperado',
  analysis_expected_close: 'Cierre Esperado',
  analysis_expected_high: 'Máximo Esperado',
  analysis_prediction_confidence: 'Confianza de la predicción',
  analysis_day_synthesis: 'Síntesis del Día',
  analysis_last_update: 'Última actualización',

  analysis_technical_levels: 'Niveles Técnicos - Soportes y Resistencias',
  analysis_loading_levels: 'Cargando niveles técnicos...',
  analysis_pivot_point: 'Punto Pivote',
  analysis_key_resistances: 'Resistencias Clave',
  analysis_key_supports: 'Soportes Clave',
  analysis_fibonacci_levels: 'Niveles Fibonacci',
  analysis_strong: 'Fuerte',
  analysis_moderate: 'Moderado',
  analysis_weak: 'Débil',

  analysis_strategic_recommendations: 'Recomendaciones Estratégicas',
  analysis_loading_recommendations: 'Cargando recomendaciones...',
  analysis_long_term_traders: 'Para Traders de Largo Plazo',
  analysis_short_term_traders: 'Para Traders de Corto Plazo',
  analysis_strategy_label: 'Estrategia',
  analysis_entry_label: 'Entrada',
  analysis_target_1: 'Objetivo 1',
  analysis_target_2: 'Objetivo 2',
  analysis_horizon: 'Horizonte',
  analysis_watch: 'Vigilar',

  analysis_conclusions: 'Conclusiones y Dirección Esperada Del Mercado',
  analysis_loading_conclusions: 'Cargando conclusiones...',
  analysis_expected_direction: 'Dirección Esperada del Mercado',
  analysis_detailed_technical: 'Análisis Técnico Detallado',
  analysis_very_short_term: 'Muy Corto Plazo (1-2 días)',
  analysis_short_term: 'Corto Plazo (1-2 semanas)',
  analysis_medium_term: 'Medio Plazo (1-3 meses)',
  analysis_probability_label: 'Probabilidad',
  analysis_target_label: 'Objetivo',
  analysis_range_label: 'Rango',
  analysis_technical_summary: 'Resumen Técnico',
  analysis_for_bulls: 'Para Alcistas',
  analysis_bearish_scenario: 'Escenario Bajista',
  analysis_summary: 'Resumen',
  analysis_key_factors: 'Factores Clave',
  analysis_risks: 'Riesgos',
  analysis_opportunities: 'Oportunidades',
  analysis_outlook: 'Perspectiva',

  analysis_monetary_policies: 'Políticas Monetarias',
  analysis_loading_policies: 'Cargando políticas...',
  analysis_current_rate: 'Tasa Actual',
  analysis_last_decision: 'Última Decisión',
  analysis_next_meeting: 'Próxima Reunión',
  analysis_expectations: 'Expectativas',
  analysis_end_year_rate: 'Tasa Fin 2025',

  analysis_economic_events: 'Eventos Económicos Del Día',
  analysis_loading_events: 'Cargando eventos...',
  analysis_no_events: 'No hay eventos económicos programados para esta fecha.',
  analysis_time: 'Hora',
  analysis_events: 'Eventos',
  analysis_description: 'Descripción',
  analysis_impact: 'Impacto',
  analysis_results: 'Resultados',

  analysis_major_news: 'Principales Noticias De Mayor Impacto',
  analysis_featured_events: 'Eventos Destacados',
  analysis_loading_news: 'Cargando noticias...',
  analysis_no_impact_news: 'No hay noticias de impacto disponibles para este símbolo.',
  analysis_positive_for: 'POSITIVO PARA',
  analysis_negative_for: 'NEGATIVO PARA',
  analysis_source: 'Fuente',

  analysis_relevant_news: 'Noticias Relevantes',
  analysis_loading_relevant: 'Cargando noticias...',
  analysis_no_relevant_news: 'No hay noticias relevantes disponibles para este par',
  analysis_impact_high: 'Alto',
  analysis_impact_medium: 'Medio',
  analysis_impact_low: 'Bajo',
  analysis_view_more_news: 'Ver más noticias',

  currency_max: 'Máximo',
  currency_min: 'Mínimo',

  ai_rate_limit: 'Límite de velocidad',
  ai_rate_limit_desc: 'Por favor espera unos segundos antes de regenerar.',
  ai_credits_exhausted: 'Créditos agotados',
  ai_credits_exhausted_desc: 'Añade créditos a tu workspace para continuar.',
  ai_analysis_generated: 'Análisis generado',
  ai_analysis_updated: 'Análisis actualizado con IA',

  common_loading: 'Cargando...',
  common_error: 'Error',
  common_retry: 'Reintentar',
  common_close: 'Cerrar',
  common_save: 'Guardar',
  common_cancel: 'Cancelar',
};

const en: TranslationKeys = {
  nav_ideas: 'Ideas',
  nav_portfolio: 'Portfolio',
  nav_news: 'News',
  nav_signals: 'Signals',
  nav_courses: 'Courses',
  nav_brokers: 'Brokers',
  nav_performance: 'Performance',
  nav_referrals: 'Referrals',
  nav_support: 'Support',
  nav_about: 'About Us',
  nav_settings: 'Settings',
  nav_more: 'More',
  nav_saved_news: 'Saved News',

  drawer_welcome: 'Welcome',
  drawer_login_sync: 'Log in to sync',
  drawer_login: 'Log In',
  drawer_logout: 'Log Out',
  drawer_session_closed: 'Session closed',
  drawer_session_closed_desc: 'You have been logged out successfully',
  drawer_synced: 'Synced',
  drawer_profile_settings: 'Profile Settings',
  drawer_subscriptions: 'Subscriptions',
  drawer_referral_bonus: 'Referral Bonuses',
  drawer_link_broker: 'Link Broker',
  drawer_security: 'Security',
  drawer_courses_tutorials: 'Courses & Tutorials',
  drawer_earnings: 'Earnings & Performance',
  drawer_broker_score: 'Broker Rating',
  drawer_contact_support: 'Contact & Support',
  drawer_about_us: 'About Us',
  drawer_preferences: 'Preferences',
  drawer_notifications: 'Notifications',
  drawer_appearance: 'Appearance',
  drawer_language_tz: 'Language & Timezone',
  drawer_install_app: 'Install App',
  drawer_new: 'new',

  settings_title: 'Settings',
  settings_profile: 'Profile',
  settings_personal_info: 'Personal Information',
  settings_personal_info_desc: 'Name, date of birth, address',
  settings_documents: 'Documents',
  settings_documents_desc: 'Proof of identity and residence',
  settings_security: 'Security',
  settings_security_desc: 'Password, authentication, biometrics',
  settings_preferences: 'Preferences',
  settings_notifications: 'Notifications',
  settings_notifications_desc: 'Alerts, signals, updates',
  settings_appearance: 'Appearance',
  settings_appearance_desc: 'Theme, font size',
  settings_language_tz: 'Language & Timezone',
  settings_language_tz_desc: 'Language, timezone',
  settings_help: 'Help',
  settings_app_tour: 'App Tour',
  settings_app_tour_desc: 'Review the main features',

  appearance_title: 'Appearance',
  appearance_prefs: 'Preferences',
  appearance_theme: 'Theme',
  appearance_theme_dark: 'Dark',
  appearance_theme_light: 'Light',
  appearance_theme_system: 'System',
  appearance_language: 'Language',
  appearance_font_size: 'Font Size',
  appearance_timezone: 'Timezone',

  signals_today: 'Today',
  signals_yesterday: 'Yesterday',
  signals_tomorrow: 'Tomorrow',
  signals_all: 'All',
  signals_favorites: 'Favorites',
  signals_count: 'signals',
  signals_no_signals: 'No signals available',
  signals_no_yesterday: 'No signals from yesterday',
  signals_no_date: 'No signals for this date',
  signals_sort_recent: 'Most recent',
  signals_sort_oldest: 'Oldest',
  signals_sort_prob_high: 'Highest probability',
  signals_sort_prob_low: 'Lowest probability',
  signals_sort_pips_high: 'Most pips',
  signals_sort_pips_low: 'Fewest pips',
  signals_view_full: 'Full view',
  signals_view_compact: 'Compact view',

  signal_buy: 'BUY',
  signal_sell: 'SELL',
  signal_bullish: 'Bullish',
  signal_bearish: 'Bearish',
  signal_entry: 'Entry Price',
  signal_take_profit: 'Take Profit',
  signal_stop_loss: 'Stop Loss',
  signal_resistance: 'Resistance',
  signal_support: 'Support',
  signal_probability: 'Probability',
  signal_risk: 'Risk',
  signal_status: 'Status',
  signal_status_active: 'Active',
  signal_status_pending: 'Pending',
  signal_status_closed: 'Closed',
  signal_information: 'Information',
  signal_strategy: 'Suggested Strategy',
  signal_strategy_duration: 'Duration',
  signal_strategy_approach: 'Approach',
  signal_strategy_session: 'Session',
  signal_strategy_best_time: 'Best Time',
  signal_strategy_candle: 'Confirmation Candle',
  signal_analyzing: 'Analyzing with AI...',
  signal_market_sentiment: 'Market Sentiment',
  signal_currency_impact: 'Currency Impact',
  signal_copy_price: 'Copy price',
  signal_positive: 'Positive',
  signal_negative: 'Negative',
  signal_neutral: 'Neutral',
  signal_long: 'Long',
  signal_short: 'Short',

  index_timeframe_5min: '5 Min',
  index_timeframe_15min: '15 Min',
  index_timeframe_30min: '30 Min',
  index_timeframe_1h: '1 Hour',
  index_timeframe_4h: '4 Hours',
  index_timeframe_1day: '1 Day',
  index_timeframe_1week: '1 Week',
  index_indicator_alerts: 'Indicator Alerts',
  index_api_limit: 'API limit reached',
  index_api_limit_desc: 'Updating in 60 seconds...',
  index_reconnecting: 'Reconnecting real-time data...',
  index_reconnecting_desc: 'Retrying automatically',
  index_realtime_lost: 'Real-time connection lost',
  index_cached_data: 'Data from cache',
  index_tab_price: 'Price',
  index_tab_rsi: 'RSI',
  index_tab_macd: 'MACD',
  index_tab_bollinger: 'Bollinger',
  index_tab_stochastic: 'Stochastic',

  news_title: 'Top News',
  news_currencies: 'Currencies',
  news_last_updated: 'Last updated',
  news_sources: 'Sources',
  news_error_loading: 'Error loading news',
  news_unknown_error: 'Unknown error',
  news_retry: 'Retry',
  news_no_news_currencies: 'No news for the selected currencies',
  news_no_news_date: 'No news for this date',
  news_clear_filters: 'Clear filters',
  news_top_news: 'Top News',
  news_historical_impact: 'Historical Impact',
  news_confidence: 'Confidence',
  news_average: 'Average',
  news_top_badge: '🔥 Top News',
  news_all_currencies: 'All',

  news_detail_error_loading: 'Error loading news',
  news_detail_unavailable: 'News unavailable',
  news_detail_unavailable_desc: 'This news is no longer in the feed. Here are the latest news.',
  news_detail_refresh: 'Refresh news',
  news_detail_recent: 'Recent News',
  news_detail_view_all: 'View all news',
  news_detail_go_home: 'Go to home',
  news_detail_cached_notice: 'Showing saved version. This news is no longer in the current feed.',
  news_detail_back: 'Back to news',
  news_detail_ai_analysis: 'AI Analysis',
  news_detail_analyzing: 'Analyzing with AI...',
  news_detail_key_points: 'Key Points',
  news_detail_trader_conclusion: 'Trader Conclusion',
  news_detail_risk: 'Risk',
  news_detail_risk_high: 'High',
  news_detail_risk_medium: 'Medium',
  news_detail_risk_low: 'Low',
  news_detail_horizon: 'Horizon',
  news_detail_horizon_short: 'Short Term',
  news_detail_horizon_medium: 'Medium Term',
  news_detail_horizon_long: 'Long Term',
  news_detail_bias: 'Bias',
  news_detail_bullish: 'Bullish',
  news_detail_bearish: 'Bearish',
  news_detail_neutral: 'Neutral',
  news_detail_strong: 'Strong',
  news_detail_moderate: 'Moderate',
  news_detail_weak: 'Weak',
  news_detail_recommended_pairs: 'Recommended Pairs',
  news_detail_market_impact: 'Market Impact',
  news_detail_suggested_strategy: 'Suggested Strategy',
  news_detail_summary: 'Summary',
  news_detail_ai_unavailable: 'AI analysis is not available at this time.',
  news_detail_affected_currencies: 'Affected Currencies',
  news_detail_live_impact: 'View live impact',
  news_detail_relevance: 'Relevance',
  news_detail_view_full_article: 'View full article on',

  portfolio_title: 'Portfolio',
  portfolio_subtitle: 'Unified view of all your brokers',
  portfolio_login_banner: 'Log in to save your portfolio',
  portfolio_login_banner_desc: 'Connect your brokers and sync your data',
  portfolio_login: 'Log In',
  portfolio_equity: 'Total Equity',
  portfolio_cash: 'Available Cash',
  portfolio_unrealized_pnl: 'Unrealized PnL',
  portfolio_positions: 'Positions',
  portfolio_demo_tooltip: 'This is demo data. Log in to see your real portfolio.',
  portfolio_no_positions: 'No open positions',
  portfolio_connect_broker: 'Connect broker',

  perf_loading: 'Loading data...',
  perf_no_signals_week: 'No signals for this week',
  perf_most_moved: 'Most Moved Currency',
  perf_buy: 'Buy',
  perf_sell: 'Sell',
  perf_total_operation_time: 'Hours',

  analysis_market_sentiment: 'Market Sentiment',
  analysis_loading_sentiment: 'Loading sentiment...',
  analysis_ai_generated: 'AI-generated analysis',
  analysis_bullish: 'BULLISH',
  analysis_bearish: 'BEARISH',
  analysis_neutral: 'NEUTRAL',
  analysis_high: 'High',
  analysis_low: 'Low',
  analysis_change: 'Change',
  analysis_pips: 'Pips',
  analysis_buy_signal: 'Buy',
  analysis_sell_signal: 'Sell',
  analysis_neutral_signal: 'Neutral',

  analysis_price_prediction: 'Price Prediction',
  analysis_loading_prediction: 'Loading prediction...',
  analysis_trend_bullish: 'Bullish Trend',
  analysis_trend_bearish: 'Bearish Trend',
  analysis_trend_sideways: 'Sideways Trend',
  analysis_expected_low: 'Expected Low',
  analysis_expected_close: 'Expected Close',
  analysis_expected_high: 'Expected High',
  analysis_prediction_confidence: 'Prediction confidence',
  analysis_day_synthesis: 'Day Synthesis',
  analysis_last_update: 'Last update',

  analysis_technical_levels: 'Technical Levels - Supports & Resistances',
  analysis_loading_levels: 'Loading technical levels...',
  analysis_pivot_point: 'Pivot Point',
  analysis_key_resistances: 'Key Resistances',
  analysis_key_supports: 'Key Supports',
  analysis_fibonacci_levels: 'Fibonacci Levels',
  analysis_strong: 'Strong',
  analysis_moderate: 'Moderate',
  analysis_weak: 'Weak',

  analysis_strategic_recommendations: 'Strategic Recommendations',
  analysis_loading_recommendations: 'Loading recommendations...',
  analysis_long_term_traders: 'For Long-Term Traders',
  analysis_short_term_traders: 'For Short-Term Traders',
  analysis_strategy_label: 'Strategy',
  analysis_entry_label: 'Entry',
  analysis_target_1: 'Target 1',
  analysis_target_2: 'Target 2',
  analysis_horizon: 'Horizon',
  analysis_watch: 'Watch',

  analysis_conclusions: 'Conclusions & Expected Market Direction',
  analysis_loading_conclusions: 'Loading conclusions...',
  analysis_expected_direction: 'Expected Market Direction',
  analysis_detailed_technical: 'Detailed Technical Analysis',
  analysis_very_short_term: 'Very Short Term (1-2 days)',
  analysis_short_term: 'Short Term (1-2 weeks)',
  analysis_medium_term: 'Medium Term (1-3 months)',
  analysis_probability_label: 'Probability',
  analysis_target_label: 'Target',
  analysis_range_label: 'Range',
  analysis_technical_summary: 'Technical Summary',
  analysis_for_bulls: 'For Bulls',
  analysis_bearish_scenario: 'Bearish Scenario',
  analysis_summary: 'Summary',
  analysis_key_factors: 'Key Factors',
  analysis_risks: 'Risks',
  analysis_opportunities: 'Opportunities',
  analysis_outlook: 'Outlook',

  analysis_monetary_policies: 'Monetary Policies',
  analysis_loading_policies: 'Loading policies...',
  analysis_current_rate: 'Current Rate',
  analysis_last_decision: 'Last Decision',
  analysis_next_meeting: 'Next Meeting',
  analysis_expectations: 'Expectations',
  analysis_end_year_rate: 'Year-End Rate 2025',

  analysis_economic_events: 'Economic Events of the Day',
  analysis_loading_events: 'Loading events...',
  analysis_no_events: 'No economic events scheduled for this date.',
  analysis_time: 'Time',
  analysis_events: 'Events',
  analysis_description: 'Description',
  analysis_impact: 'Impact',
  analysis_results: 'Results',

  analysis_major_news: 'Major High-Impact News',
  analysis_featured_events: 'Featured Events',
  analysis_loading_news: 'Loading news...',
  analysis_no_impact_news: 'No impact news available for this symbol.',
  analysis_positive_for: 'POSITIVE FOR',
  analysis_negative_for: 'NEGATIVE FOR',
  analysis_source: 'Source',

  analysis_relevant_news: 'Relevant News',
  analysis_loading_relevant: 'Loading news...',
  analysis_no_relevant_news: 'No relevant news available for this pair',
  analysis_impact_high: 'High',
  analysis_impact_medium: 'Medium',
  analysis_impact_low: 'Low',
  analysis_view_more_news: 'View more news',

  currency_max: 'High',
  currency_min: 'Low',

  ai_rate_limit: 'Rate limit',
  ai_rate_limit_desc: 'Please wait a few seconds before regenerating.',
  ai_credits_exhausted: 'Credits exhausted',
  ai_credits_exhausted_desc: 'Add credits to your workspace to continue.',
  ai_analysis_generated: 'Analysis generated',
  ai_analysis_updated: 'Analysis updated with AI',

  common_loading: 'Loading...',
  common_error: 'Error',
  common_retry: 'Retry',
  common_close: 'Close',
  common_save: 'Save',
  common_cancel: 'Cancel',
};

const pt: TranslationKeys = {
  nav_ideas: 'Ideias',
  nav_portfolio: 'Portfólio',
  nav_news: 'Notícias',
  nav_signals: 'Sinais',
  nav_courses: 'Cursos',
  nav_brokers: 'Corretoras',
  nav_performance: 'Desempenho',
  nav_referrals: 'Indicações',
  nav_support: 'Suporte',
  nav_about: 'Sobre Nós',
  nav_settings: 'Configurações',
  nav_more: 'Mais',
  nav_saved_news: 'Notícias Salvas',

  drawer_welcome: 'Bem-vindo',
  drawer_login_sync: 'Faça login para sincronizar',
  drawer_login: 'Entrar',
  drawer_logout: 'Sair',
  drawer_session_closed: 'Sessão encerrada',
  drawer_session_closed_desc: 'Você saiu com sucesso',
  drawer_synced: 'Sincronizado',
  drawer_profile_settings: 'Config. de Perfil',
  drawer_subscriptions: 'Assinaturas',
  drawer_referral_bonus: 'Bônus de Indicação',
  drawer_link_broker: 'Vincular Corretora',
  drawer_security: 'Segurança',
  drawer_courses_tutorials: 'Cursos e Tutoriais',
  drawer_earnings: 'Rendimentos e Ganhos',
  drawer_broker_score: 'Avaliação de Corretora',
  drawer_contact_support: 'Contato e Suporte',
  drawer_about_us: 'Sobre Nós',
  drawer_preferences: 'Preferências',
  drawer_notifications: 'Notificações',
  drawer_appearance: 'Aparência',
  drawer_language_tz: 'Idioma e Fuso Horário',
  drawer_install_app: 'Instalar App',
  drawer_new: 'novas',

  settings_title: 'Configurações',
  settings_profile: 'Perfil',
  settings_personal_info: 'Informações Pessoais',
  settings_personal_info_desc: 'Nome, data de nascimento, endereço',
  settings_documents: 'Documentos',
  settings_documents_desc: 'Prova de identidade e residência',
  settings_security: 'Segurança',
  settings_security_desc: 'Senha, autenticação, biometria',
  settings_preferences: 'Preferências',
  settings_notifications: 'Notificações',
  settings_notifications_desc: 'Alertas, sinais, atualizações',
  settings_appearance: 'Aparência',
  settings_appearance_desc: 'Tema, tamanho da fonte',
  settings_language_tz: 'Idioma e Fuso Horário',
  settings_language_tz_desc: 'Idioma, fuso horário',
  settings_help: 'Ajuda',
  settings_app_tour: 'Tour do App',
  settings_app_tour_desc: 'Revise as funções principais',

  appearance_title: 'Aparência',
  appearance_prefs: 'Preferências',
  appearance_theme: 'Tema',
  appearance_theme_dark: 'Escuro',
  appearance_theme_light: 'Claro',
  appearance_theme_system: 'Sistema',
  appearance_language: 'Idioma',
  appearance_font_size: 'Tamanho da Fonte',
  appearance_timezone: 'Fuso Horário',

  signals_today: 'Hoje',
  signals_yesterday: 'Ontem',
  signals_tomorrow: 'Amanhã',
  signals_all: 'Todos',
  signals_favorites: 'Favoritos',
  signals_count: 'sinais',
  signals_no_signals: 'Nenhum sinal disponível',
  signals_no_yesterday: 'Sem sinais de ontem',
  signals_no_date: 'Sem sinais para esta data',
  signals_sort_recent: 'Mais recentes',
  signals_sort_oldest: 'Mais antigos',
  signals_sort_prob_high: 'Maior probabilidade',
  signals_sort_prob_low: 'Menor probabilidade',
  signals_sort_pips_high: 'Mais pips',
  signals_sort_pips_low: 'Menos pips',
  signals_view_full: 'Visão completa',
  signals_view_compact: 'Visão compacta',

  signal_buy: 'COMPRAR',
  signal_sell: 'VENDER',
  signal_bullish: 'Altista',
  signal_bearish: 'Baixista',
  signal_entry: 'Preço de Entrada',
  signal_take_profit: 'Take Profit',
  signal_stop_loss: 'Stop Loss',
  signal_resistance: 'Resistência',
  signal_support: 'Suporte',
  signal_probability: 'Probabilidade',
  signal_risk: 'Risco',
  signal_status: 'Status',
  signal_status_active: 'Ativa',
  signal_status_pending: 'Pendente',
  signal_status_closed: 'Fechada',
  signal_information: 'Informação',
  signal_strategy: 'Estratégia Sugerida',
  signal_strategy_duration: 'Duração',
  signal_strategy_approach: 'Abordagem',
  signal_strategy_session: 'Sessão',
  signal_strategy_best_time: 'Melhor Horário',
  signal_strategy_candle: 'Vela de Confirmação',
  signal_analyzing: 'Analisando com IA...',
  signal_market_sentiment: 'Sentimento do Mercado',
  signal_currency_impact: 'Impacto Cambial',
  signal_copy_price: 'Copiar preço',
  signal_positive: 'Positivo',
  signal_negative: 'Negativo',
  signal_neutral: 'Neutro',
  signal_long: 'Longo (Long)',
  signal_short: 'Curto (Short)',

  index_timeframe_5min: '5 Min',
  index_timeframe_15min: '15 Min',
  index_timeframe_30min: '30 Min',
  index_timeframe_1h: '1 Hora',
  index_timeframe_4h: '4 Horas',
  index_timeframe_1day: '1 Dia',
  index_timeframe_1week: '1 Semana',
  index_indicator_alerts: 'Alertas de Indicadores',
  index_api_limit: 'Limite da API atingido',
  index_api_limit_desc: 'Atualizando em 60 segundos...',
  index_reconnecting: 'Reconectando dados em tempo real...',
  index_reconnecting_desc: 'Tentando automaticamente',
  index_realtime_lost: 'Conexão em tempo real perdida',
  index_cached_data: 'Dados do cache',
  index_tab_price: 'Preço',
  index_tab_rsi: 'RSI',
  index_tab_macd: 'MACD',
  index_tab_bollinger: 'Bollinger',
  index_tab_stochastic: 'Estocástico',

  news_title: 'Principais Notícias',
  news_currencies: 'Moedas',
  news_last_updated: 'Última atualização',
  news_sources: 'Fontes',
  news_error_loading: 'Erro ao carregar notícias',
  news_unknown_error: 'Erro desconhecido',
  news_retry: 'Tentar novamente',
  news_no_news_currencies: 'Sem notícias para as moedas selecionadas',
  news_no_news_date: 'Sem notícias para esta data',
  news_clear_filters: 'Limpar filtros',
  news_top_news: 'Top News',
  news_historical_impact: 'Impacto Histórico',
  news_confidence: 'Confiança',
  news_average: 'Média',
  news_top_badge: '🔥 Top News',
  news_all_currencies: 'Todas',

  news_detail_error_loading: 'Erro ao carregar notícia',
  news_detail_unavailable: 'Notícia indisponível',
  news_detail_unavailable_desc: 'Esta notícia não está mais no feed. Aqui estão as notícias mais recentes.',
  news_detail_refresh: 'Atualizar notícias',
  news_detail_recent: 'Notícias Recentes',
  news_detail_view_all: 'Ver todas as notícias',
  news_detail_go_home: 'Ir para o início',
  news_detail_cached_notice: 'Mostrando versão salva. Esta notícia não está mais no feed atual.',
  news_detail_back: 'Voltar às notícias',
  news_detail_ai_analysis: 'Análise IA',
  news_detail_analyzing: 'Analisando com IA...',
  news_detail_key_points: 'Pontos Chave',
  news_detail_trader_conclusion: 'Conclusão para Traders',
  news_detail_risk: 'Risco',
  news_detail_risk_high: 'Alto',
  news_detail_risk_medium: 'Médio',
  news_detail_risk_low: 'Baixo',
  news_detail_horizon: 'Horizonte',
  news_detail_horizon_short: 'Curto Prazo',
  news_detail_horizon_medium: 'Médio Prazo',
  news_detail_horizon_long: 'Longo Prazo',
  news_detail_bias: 'Viés',
  news_detail_bullish: 'Altista',
  news_detail_bearish: 'Baixista',
  news_detail_neutral: 'Neutro',
  news_detail_strong: 'Forte',
  news_detail_moderate: 'Moderado',
  news_detail_weak: 'Fraco',
  news_detail_recommended_pairs: 'Pares Recomendados',
  news_detail_market_impact: 'Impacto no Mercado',
  news_detail_suggested_strategy: 'Estratégia Sugerida',
  news_detail_summary: 'Resumo',
  news_detail_ai_unavailable: 'A análise IA não está disponível no momento.',
  news_detail_affected_currencies: 'Moedas Afetadas',
  news_detail_live_impact: 'Ver impacto ao vivo',
  news_detail_relevance: 'Relevância',
  news_detail_view_full_article: 'Ver artigo completo em',

  portfolio_title: 'Portfólio',
  portfolio_subtitle: 'Visão unificada de todas as suas corretoras',
  portfolio_login_banner: 'Faça login para salvar seu portfólio',
  portfolio_login_banner_desc: 'Conecte suas corretoras e sincronize seus dados',
  portfolio_login: 'Entrar',
  portfolio_equity: 'Patrimônio Total',
  portfolio_cash: 'Caixa Disponível',
  portfolio_unrealized_pnl: 'PnL Não Realizado',
  portfolio_positions: 'Posições',
  portfolio_demo_tooltip: 'Estes dados são fictícios. Faça login para ver seu portfólio real.',
  portfolio_no_positions: 'Sem posições abertas',
  portfolio_connect_broker: 'Conectar corretora',

  perf_loading: 'Carregando dados...',
  perf_no_signals_week: 'Sem sinais para esta semana',
  perf_most_moved: 'Moeda Mais Movimentada',
  perf_buy: 'Comprar',
  perf_sell: 'Vender',
  perf_total_operation_time: 'Horas',

  analysis_market_sentiment: 'Sentimento do Mercado',
  analysis_loading_sentiment: 'Carregando sentimento...',
  analysis_ai_generated: 'Análise gerada com IA',
  analysis_bullish: 'ALTISTA',
  analysis_bearish: 'BAIXISTA',
  analysis_neutral: 'NEUTRO',
  analysis_high: 'Máximo',
  analysis_low: 'Mínimo',
  analysis_change: 'Variação',
  analysis_pips: 'Pips',
  analysis_buy_signal: 'Compra',
  analysis_sell_signal: 'Venda',
  analysis_neutral_signal: 'Neutro',

  analysis_price_prediction: 'Previsão de Preço',
  analysis_loading_prediction: 'Carregando previsão...',
  analysis_trend_bullish: 'Tendência Altista',
  analysis_trend_bearish: 'Tendência Baixista',
  analysis_trend_sideways: 'Tendência Lateral',
  analysis_expected_low: 'Mínimo Esperado',
  analysis_expected_close: 'Fechamento Esperado',
  analysis_expected_high: 'Máximo Esperado',
  analysis_prediction_confidence: 'Confiança da previsão',
  analysis_day_synthesis: 'Síntese do Dia',
  analysis_last_update: 'Última atualização',

  analysis_technical_levels: 'Níveis Técnicos - Suportes e Resistências',
  analysis_loading_levels: 'Carregando níveis técnicos...',
  analysis_pivot_point: 'Ponto Pivô',
  analysis_key_resistances: 'Resistências Chave',
  analysis_key_supports: 'Suportes Chave',
  analysis_fibonacci_levels: 'Níveis Fibonacci',
  analysis_strong: 'Forte',
  analysis_moderate: 'Moderado',
  analysis_weak: 'Fraco',

  analysis_strategic_recommendations: 'Recomendações Estratégicas',
  analysis_loading_recommendations: 'Carregando recomendações...',
  analysis_long_term_traders: 'Para Traders de Longo Prazo',
  analysis_short_term_traders: 'Para Traders de Curto Prazo',
  analysis_strategy_label: 'Estratégia',
  analysis_entry_label: 'Entrada',
  analysis_target_1: 'Alvo 1',
  analysis_target_2: 'Alvo 2',
  analysis_horizon: 'Horizonte',
  analysis_watch: 'Observar',

  analysis_conclusions: 'Conclusões e Direção Esperada do Mercado',
  analysis_loading_conclusions: 'Carregando conclusões...',
  analysis_expected_direction: 'Direção Esperada do Mercado',
  analysis_detailed_technical: 'Análise Técnica Detalhada',
  analysis_very_short_term: 'Curtíssimo Prazo (1-2 dias)',
  analysis_short_term: 'Curto Prazo (1-2 semanas)',
  analysis_medium_term: 'Médio Prazo (1-3 meses)',
  analysis_probability_label: 'Probabilidade',
  analysis_target_label: 'Alvo',
  analysis_range_label: 'Faixa',
  analysis_technical_summary: 'Resumo Técnico',
  analysis_for_bulls: 'Para Altistas',
  analysis_bearish_scenario: 'Cenário Baixista',
  analysis_summary: 'Resumo',
  analysis_key_factors: 'Fatores Chave',
  analysis_risks: 'Riscos',
  analysis_opportunities: 'Oportunidades',
  analysis_outlook: 'Perspectiva',

  analysis_monetary_policies: 'Políticas Monetárias',
  analysis_loading_policies: 'Carregando políticas...',
  analysis_current_rate: 'Taxa Atual',
  analysis_last_decision: 'Última Decisão',
  analysis_next_meeting: 'Próxima Reunião',
  analysis_expectations: 'Expectativas',
  analysis_end_year_rate: 'Taxa Final 2025',

  analysis_economic_events: 'Eventos Econômicos do Dia',
  analysis_loading_events: 'Carregando eventos...',
  analysis_no_events: 'Não há eventos econômicos programados para esta data.',
  analysis_time: 'Hora',
  analysis_events: 'Eventos',
  analysis_description: 'Descrição',
  analysis_impact: 'Impacto',
  analysis_results: 'Resultados',

  analysis_major_news: 'Principais Notícias de Grande Impacto',
  analysis_featured_events: 'Eventos Destacados',
  analysis_loading_news: 'Carregando notícias...',
  analysis_no_impact_news: 'Não há notícias de impacto disponíveis para este símbolo.',
  analysis_positive_for: 'POSITIVO PARA',
  analysis_negative_for: 'NEGATIVO PARA',
  analysis_source: 'Fonte',

  analysis_relevant_news: 'Notícias Relevantes',
  analysis_loading_relevant: 'Carregando notícias...',
  analysis_no_relevant_news: 'Não há notícias relevantes disponíveis para este par',
  analysis_impact_high: 'Alto',
  analysis_impact_medium: 'Médio',
  analysis_impact_low: 'Baixo',
  analysis_view_more_news: 'Ver mais notícias',

  currency_max: 'Máximo',
  currency_min: 'Mínimo',

  ai_rate_limit: 'Limite de velocidade',
  ai_rate_limit_desc: 'Por favor, aguarde alguns segundos antes de regenerar.',
  ai_credits_exhausted: 'Créditos esgotados',
  ai_credits_exhausted_desc: 'Adicione créditos ao seu workspace para continuar.',
  ai_analysis_generated: 'Análise gerada',
  ai_analysis_updated: 'Análise atualizada com IA',

  common_loading: 'Carregando...',
  common_error: 'Erro',
  common_retry: 'Tentar novamente',
  common_close: 'Fechar',
  common_save: 'Salvar',
  common_cancel: 'Cancelar',
};

const fr: TranslationKeys = {
  nav_ideas: 'Idées',
  nav_portfolio: 'Portefeuille',
  nav_news: 'Actualités',
  nav_signals: 'Signaux',
  nav_courses: 'Cours',
  nav_brokers: 'Courtiers',
  nav_performance: 'Performance',
  nav_referrals: 'Parrainages',
  nav_support: 'Support',
  nav_about: 'À propos',
  nav_settings: 'Paramètres',
  nav_more: 'Plus',
  nav_saved_news: 'Actualités sauvées',

  drawer_welcome: 'Bienvenue',
  drawer_login_sync: 'Connectez-vous pour synchroniser',
  drawer_login: 'Se connecter',
  drawer_logout: 'Se déconnecter',
  drawer_session_closed: 'Session fermée',
  drawer_session_closed_desc: 'Vous avez été déconnecté avec succès',
  drawer_synced: 'Synchronisé',
  drawer_profile_settings: 'Paramètres du profil',
  drawer_subscriptions: 'Abonnements',
  drawer_referral_bonus: 'Bonus de parrainage',
  drawer_link_broker: 'Lier un courtier',
  drawer_security: 'Sécurité',
  drawer_courses_tutorials: 'Cours et tutoriels',
  drawer_earnings: 'Rendements et gains',
  drawer_broker_score: 'Notation des courtiers',
  drawer_contact_support: 'Contact et support',
  drawer_about_us: 'À propos de nous',
  drawer_preferences: 'Préférences',
  drawer_notifications: 'Notifications',
  drawer_appearance: 'Apparence',
  drawer_language_tz: 'Langue et fuseau horaire',
  drawer_install_app: 'Installer l\'appli',
  drawer_new: 'nouvelles',

  settings_title: 'Paramètres',
  settings_profile: 'Profil',
  settings_personal_info: 'Informations personnelles',
  settings_personal_info_desc: 'Nom, date de naissance, adresse',
  settings_documents: 'Documents',
  settings_documents_desc: 'Preuve d\'identité et de résidence',
  settings_security: 'Sécurité',
  settings_security_desc: 'Mot de passe, authentification, biométrie',
  settings_preferences: 'Préférences',
  settings_notifications: 'Notifications',
  settings_notifications_desc: 'Alertes, signaux, mises à jour',
  settings_appearance: 'Apparence',
  settings_appearance_desc: 'Thème, taille de police',
  settings_language_tz: 'Langue et fuseau horaire',
  settings_language_tz_desc: 'Langue, fuseau horaire',
  settings_help: 'Aide',
  settings_app_tour: 'Visite guidée',
  settings_app_tour_desc: 'Découvrez les fonctions principales',

  appearance_title: 'Apparence',
  appearance_prefs: 'Préférences',
  appearance_theme: 'Thème',
  appearance_theme_dark: 'Sombre',
  appearance_theme_light: 'Clair',
  appearance_theme_system: 'Système',
  appearance_language: 'Langue',
  appearance_font_size: 'Taille de police',
  appearance_timezone: 'Fuseau horaire',

  signals_today: 'Aujourd\'hui',
  signals_yesterday: 'Hier',
  signals_tomorrow: 'Demain',
  signals_all: 'Tous',
  signals_favorites: 'Favoris',
  signals_count: 'signaux',
  signals_no_signals: 'Aucun signal disponible',
  signals_no_yesterday: 'Pas de signaux d\'hier',
  signals_no_date: 'Pas de signaux pour cette date',
  signals_sort_recent: 'Plus récents',
  signals_sort_oldest: 'Plus anciens',
  signals_sort_prob_high: 'Probabilité la plus élevée',
  signals_sort_prob_low: 'Probabilité la plus faible',
  signals_sort_pips_high: 'Plus de pips',
  signals_sort_pips_low: 'Moins de pips',
  signals_view_full: 'Vue complète',
  signals_view_compact: 'Vue compacte',

  signal_buy: 'ACHETER',
  signal_sell: 'VENDRE',
  signal_bullish: 'Haussier',
  signal_bearish: 'Baissier',
  signal_entry: 'Prix d\'entrée',
  signal_take_profit: 'Take Profit',
  signal_stop_loss: 'Stop Loss',
  signal_resistance: 'Résistance',
  signal_support: 'Support',
  signal_probability: 'Probabilité',
  signal_risk: 'Risque',
  signal_status: 'Statut',
  signal_status_active: 'Active',
  signal_status_pending: 'En attente',
  signal_status_closed: 'Fermée',
  signal_information: 'Informations',
  signal_strategy: 'Stratégie suggérée',
  signal_strategy_duration: 'Durée',
  signal_strategy_approach: 'Approche',
  signal_strategy_session: 'Session',
  signal_strategy_best_time: 'Meilleur moment',
  signal_strategy_candle: 'Bougie de confirmation',
  signal_analyzing: 'Analyse IA en cours...',
  signal_market_sentiment: 'Sentiment du marché',
  signal_currency_impact: 'Impact des devises',
  signal_copy_price: 'Copier le prix',
  signal_positive: 'Positif',
  signal_negative: 'Négatif',
  signal_neutral: 'Neutre',
  signal_long: 'Long',
  signal_short: 'Court (Short)',

  index_timeframe_5min: '5 Min',
  index_timeframe_15min: '15 Min',
  index_timeframe_30min: '30 Min',
  index_timeframe_1h: '1 Heure',
  index_timeframe_4h: '4 Heures',
  index_timeframe_1day: '1 Jour',
  index_timeframe_1week: '1 Semaine',
  index_indicator_alerts: 'Alertes d\'indicateurs',
  index_api_limit: 'Limite API atteinte',
  index_api_limit_desc: 'Mise à jour dans 60 secondes...',
  index_reconnecting: 'Reconnexion des données en temps réel...',
  index_reconnecting_desc: 'Nouvelle tentative automatique',
  index_realtime_lost: 'Connexion en temps réel perdue',
  index_cached_data: 'Données depuis le cache',
  index_tab_price: 'Prix',
  index_tab_rsi: 'RSI',
  index_tab_macd: 'MACD',
  index_tab_bollinger: 'Bollinger',
  index_tab_stochastic: 'Stochastique',

  news_title: 'Actualités principales',
  news_currencies: 'Devises',
  news_last_updated: 'Dernière mise à jour',
  news_sources: 'Sources',
  news_error_loading: 'Erreur de chargement des actualités',
  news_unknown_error: 'Erreur inconnue',
  news_retry: 'Réessayer',
  news_no_news_currencies: 'Pas d\'actualités pour les devises sélectionnées',
  news_no_news_date: 'Pas d\'actualités pour cette date',
  news_clear_filters: 'Effacer les filtres',
  news_top_news: 'Top News',
  news_historical_impact: 'Impact historique',
  news_confidence: 'Confiance',
  news_average: 'Moyenne',
  news_top_badge: '🔥 Top News',
  news_all_currencies: 'Toutes',

  news_detail_error_loading: 'Erreur de chargement de l\'actualité',
  news_detail_unavailable: 'Actualité indisponible',
  news_detail_unavailable_desc: 'Cette actualité n\'est plus dans le flux. Voici les dernières actualités.',
  news_detail_refresh: 'Actualiser les nouvelles',
  news_detail_recent: 'Actualités Récentes',
  news_detail_view_all: 'Voir toutes les actualités',
  news_detail_go_home: 'Aller à l\'accueil',
  news_detail_cached_notice: 'Version sauvegardée affichée. Cette actualité n\'est plus dans le flux actuel.',
  news_detail_back: 'Retour aux actualités',
  news_detail_ai_analysis: 'Analyse IA',
  news_detail_analyzing: 'Analyse IA en cours...',
  news_detail_key_points: 'Points Clés',
  news_detail_trader_conclusion: 'Conclusion pour Traders',
  news_detail_risk: 'Risque',
  news_detail_risk_high: 'Élevé',
  news_detail_risk_medium: 'Moyen',
  news_detail_risk_low: 'Faible',
  news_detail_horizon: 'Horizon',
  news_detail_horizon_short: 'Court Terme',
  news_detail_horizon_medium: 'Moyen Terme',
  news_detail_horizon_long: 'Long Terme',
  news_detail_bias: 'Biais',
  news_detail_bullish: 'Haussier',
  news_detail_bearish: 'Baissier',
  news_detail_neutral: 'Neutre',
  news_detail_strong: 'Fort',
  news_detail_moderate: 'Modéré',
  news_detail_weak: 'Faible',
  news_detail_recommended_pairs: 'Paires Recommandées',
  news_detail_market_impact: 'Impact sur le Marché',
  news_detail_suggested_strategy: 'Stratégie Suggérée',
  news_detail_summary: 'Résumé',
  news_detail_ai_unavailable: 'L\'analyse IA n\'est pas disponible pour le moment.',
  news_detail_affected_currencies: 'Devises Affectées',
  news_detail_live_impact: 'Voir l\'impact en direct',
  news_detail_relevance: 'Pertinence',
  news_detail_view_full_article: 'Voir l\'article complet sur',

  portfolio_title: 'Portefeuille',
  portfolio_subtitle: 'Vue unifiée de tous vos courtiers',
  portfolio_login_banner: 'Connectez-vous pour sauvegarder votre portefeuille',
  portfolio_login_banner_desc: 'Connectez vos courtiers et synchronisez vos données',
  portfolio_login: 'Se connecter',
  portfolio_equity: 'Fonds propres totaux',
  portfolio_cash: 'Liquidités disponibles',
  portfolio_unrealized_pnl: 'PnL non réalisé',
  portfolio_positions: 'Positions',
  portfolio_demo_tooltip: 'Ce sont des données fictives. Connectez-vous pour voir votre vrai portefeuille.',
  portfolio_no_positions: 'Aucune position ouverte',
  portfolio_connect_broker: 'Connecter un courtier',

  perf_loading: 'Chargement des données...',
  perf_no_signals_week: 'Pas de signaux pour cette semaine',
  perf_most_moved: 'Devise la plus active',
  perf_buy: 'Acheter',
  perf_sell: 'Vendre',
  perf_total_operation_time: 'Heures',

  analysis_market_sentiment: 'Sentiment du marché',
  analysis_loading_sentiment: 'Chargement du sentiment...',
  analysis_ai_generated: 'Analyse générée par IA',
  analysis_bullish: 'HAUSSIER',
  analysis_bearish: 'BAISSIER',
  analysis_neutral: 'NEUTRE',
  analysis_high: 'Plus haut',
  analysis_low: 'Plus bas',
  analysis_change: 'Variation',
  analysis_pips: 'Pips',
  analysis_buy_signal: 'Achat',
  analysis_sell_signal: 'Vente',
  analysis_neutral_signal: 'Neutre',

  analysis_price_prediction: 'Prévision de prix',
  analysis_loading_prediction: 'Chargement de la prévision...',
  analysis_trend_bullish: 'Tendance haussière',
  analysis_trend_bearish: 'Tendance baissière',
  analysis_trend_sideways: 'Tendance latérale',
  analysis_expected_low: 'Plus bas attendu',
  analysis_expected_close: 'Clôture attendue',
  analysis_expected_high: 'Plus haut attendu',
  analysis_prediction_confidence: 'Confiance de la prévision',
  analysis_day_synthesis: 'Synthèse du jour',
  analysis_last_update: 'Dernière mise à jour',

  analysis_technical_levels: 'Niveaux techniques - Supports et résistances',
  analysis_loading_levels: 'Chargement des niveaux techniques...',
  analysis_pivot_point: 'Point pivot',
  analysis_key_resistances: 'Résistances clés',
  analysis_key_supports: 'Supports clés',
  analysis_fibonacci_levels: 'Niveaux Fibonacci',
  analysis_strong: 'Fort',
  analysis_moderate: 'Modéré',
  analysis_weak: 'Faible',

  analysis_strategic_recommendations: 'Recommandations stratégiques',
  analysis_loading_recommendations: 'Chargement des recommandations...',
  analysis_long_term_traders: 'Pour les traders long terme',
  analysis_short_term_traders: 'Pour les traders court terme',
  analysis_strategy_label: 'Stratégie',
  analysis_entry_label: 'Entrée',
  analysis_target_1: 'Objectif 1',
  analysis_target_2: 'Objectif 2',
  analysis_horizon: 'Horizon',
  analysis_watch: 'Surveiller',

  analysis_conclusions: 'Conclusions et direction attendue du marché',
  analysis_loading_conclusions: 'Chargement des conclusions...',
  analysis_expected_direction: 'Direction attendue du marché',
  analysis_detailed_technical: 'Analyse technique détaillée',
  analysis_very_short_term: 'Très court terme (1-2 jours)',
  analysis_short_term: 'Court terme (1-2 semaines)',
  analysis_medium_term: 'Moyen terme (1-3 mois)',
  analysis_probability_label: 'Probabilité',
  analysis_target_label: 'Objectif',
  analysis_range_label: 'Fourchette',
  analysis_technical_summary: 'Résumé technique',
  analysis_for_bulls: 'Pour les haussiers',
  analysis_bearish_scenario: 'Scénario baissier',
  analysis_summary: 'Résumé',
  analysis_key_factors: 'Facteurs clés',
  analysis_risks: 'Risques',
  analysis_opportunities: 'Opportunités',
  analysis_outlook: 'Perspectives',

  analysis_monetary_policies: 'Politiques monétaires',
  analysis_loading_policies: 'Chargement des politiques...',
  analysis_current_rate: 'Taux actuel',
  analysis_last_decision: 'Dernière décision',
  analysis_next_meeting: 'Prochaine réunion',
  analysis_expectations: 'Attentes',
  analysis_end_year_rate: 'Taux fin 2025',

  analysis_economic_events: 'Événements économiques du jour',
  analysis_loading_events: 'Chargement des événements...',
  analysis_no_events: 'Aucun événement économique prévu pour cette date.',
  analysis_time: 'Heure',
  analysis_events: 'Événements',
  analysis_description: 'Description',
  analysis_impact: 'Impact',
  analysis_results: 'Résultats',

  analysis_major_news: 'Principales actualités à fort impact',
  analysis_featured_events: 'Événements majeurs',
  analysis_loading_news: 'Chargement des actualités...',
  analysis_no_impact_news: 'Aucune actualité d\'impact disponible pour ce symbole.',
  analysis_positive_for: 'POSITIF POUR',
  analysis_negative_for: 'NÉGATIF POUR',
  analysis_source: 'Source',

  analysis_relevant_news: 'Actualités pertinentes',
  analysis_loading_relevant: 'Chargement des actualités...',
  analysis_no_relevant_news: 'Aucune actualité pertinente disponible pour cette paire',
  analysis_impact_high: 'Élevé',
  analysis_impact_medium: 'Moyen',
  analysis_impact_low: 'Faible',
  analysis_view_more_news: 'Voir plus d\'actualités',

  currency_max: 'Plus haut',
  currency_min: 'Plus bas',

  ai_rate_limit: 'Limite de débit',
  ai_rate_limit_desc: 'Veuillez patienter quelques secondes avant de régénérer.',
  ai_credits_exhausted: 'Crédits épuisés',
  ai_credits_exhausted_desc: 'Ajoutez des crédits à votre espace de travail pour continuer.',
  ai_analysis_generated: 'Analyse générée',
  ai_analysis_updated: 'Analyse mise à jour avec l\'IA',

  common_loading: 'Chargement...',
  common_error: 'Erreur',
  common_retry: 'Réessayer',
  common_close: 'Fermer',
  common_save: 'Enregistrer',
  common_cancel: 'Annuler',
};

export const translations: Record<Language, TranslationKeys> = { es, en, pt, fr };
