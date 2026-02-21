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

  common_loading: 'Chargement...',
  common_error: 'Erreur',
  common_retry: 'Réessayer',
  common_close: 'Fermer',
  common_save: 'Enregistrer',
  common_cancel: 'Annuler',
};

export const translations: Record<Language, TranslationKeys> = { es, en, pt, fr };
