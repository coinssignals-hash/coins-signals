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

export type TranslationKeys = {
  // Navigation
  nav_analysis: string;
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
  nav_stocks: string;
  nav_ai: string;
  nav_ai_center: string;
  nav_tools: string;
  // Drawer
  drawer_ai_center: string;
  drawer_stock_market: string;
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
  signal_reached: string;
  signal_expired: string;
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
  // Performance days
  perf_monday: string;
  perf_tuesday: string;
  perf_wednesday: string;
  perf_thursday: string;
  perf_friday: string;
  // SignalsDayGroup
  signals_signal_singular: string;
  signals_signal_plural: string;
  // Trading Journal
  journal_title: string;
  journal_new_trade: string;
  journal_save_trade: string;
  journal_update_trade: string;
  journal_cancel: string;
  journal_login_required: string;
  journal_login_desc: string;
  journal_date: string;
  journal_pair: string;
  journal_action: string;
  journal_entry_price: string;
  journal_exit_price: string;
  journal_lot_size: string;
  journal_stop_loss: string;
  journal_take_profit: string;
  journal_result: string;
  journal_pips: string;
  journal_notes: string;
  journal_win: string;
  journal_loss: string;
  journal_breakeven: string;
  journal_total_trades: string;
  journal_win_rate: string;
  journal_total_pips: string;
  journal_wins: string;
  journal_losses: string;
  journal_history: string;
  journal_no_trades: string;
  journal_saved: string;
  journal_updated: string;
  journal_save_error: string;
  journal_update_error: string;
  journal_delete_error: string;
  // Tools page
  tools_title: string;
  tools_level_novice: string;
  tools_level_intermediate: string;
  tools_level_advanced: string;
  tools_level_professional: string;
};

// Dynamic locale loaders — only the active language is loaded at runtime
const localeLoaders: Record<Language, () => Promise<{ default: TranslationKeys }>> = {
  es: () => import('./locales/es'),
  en: () => import('./locales/en'),
  pt: () => import('./locales/pt'),
  fr: () => import('./locales/fr'),
};

// Keep a synchronous fallback (Spanish is default and bundled inline for instant first paint)
import esDefault from './locales/es';

const translationsCache: Partial<Record<Language, TranslationKeys>> = {
  es: esDefault,
};

export async function loadTranslations(lang: Language): Promise<TranslationKeys> {
  if (translationsCache[lang]) return translationsCache[lang]!;
  const mod = await localeLoaders[lang]();
  translationsCache[lang] = mod.default;
  return mod.default;
}

export function getTranslationsSync(lang: Language): TranslationKeys {
  return translationsCache[lang] ?? esDefault;
}

// Legacy compat — some files may still import this
export const translations: Record<Language, TranslationKeys> = new Proxy({} as Record<Language, TranslationKeys>, {
  get(_, lang: string) {
    return translationsCache[lang as Language] ?? esDefault;
  },
});
