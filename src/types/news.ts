// TypeScript types matching the API schemas

// 30 Major world currencies
export type Currency = 
  // G10 Currencies (Major)
  | 'EUR'  // Euro
  | 'USD'  // US Dollar
  | 'GBP'  // British Pound
  | 'JPY'  // Japanese Yen
  | 'AUD'  // Australian Dollar
  | 'CAD'  // Canadian Dollar
  | 'CHF'  // Swiss Franc
  | 'NZD'  // New Zealand Dollar
  | 'SEK'  // Swedish Krona
  | 'NOK'  // Norwegian Krone
  // Emerging Market Currencies
  | 'CNY'  // Chinese Yuan
  | 'HKD'  // Hong Kong Dollar
  | 'SGD'  // Singapore Dollar
  | 'KRW'  // South Korean Won
  | 'INR'  // Indian Rupee
  | 'MXN'  // Mexican Peso
  | 'BRL'  // Brazilian Real
  | 'ZAR'  // South African Rand
  | 'RUB'  // Russian Ruble
  | 'TRY'  // Turkish Lira
  | 'PLN'  // Polish Zloty
  | 'THB'  // Thai Baht
  | 'MYR'  // Malaysian Ringgit
  | 'IDR'  // Indonesian Rupiah
  | 'PHP'  // Philippine Peso
  // Middle East & Others
  | 'AED'  // UAE Dirham
  | 'SAR'  // Saudi Riyal
  | 'ILS'  // Israeli Shekel
  | 'CZK'  // Czech Koruna
  | 'DKK'; // Danish Krone

export interface CurrencyInfo {
  code: Currency;
  name: string;
  flag: string;
  color: string;
  region: 'major' | 'europe' | 'asia' | 'americas' | 'middle_east' | 'africa';
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  // G10 / Major Currencies
  EUR: { code: 'EUR', name: 'Euro', flag: '🇪🇺', color: 'currency-eur', region: 'major' },
  USD: { code: 'USD', name: 'Dólar Estadounidense', flag: '🇺🇸', color: 'currency-usd', region: 'major' },
  GBP: { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧', color: 'currency-gbp', region: 'major' },
  JPY: { code: 'JPY', name: 'Yen Japonés', flag: '🇯🇵', color: 'currency-jpy', region: 'asia' },
  AUD: { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺', color: 'currency-aud', region: 'major' },
  CAD: { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦', color: 'currency-cad', region: 'major' },
  CHF: { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭', color: 'currency-chf', region: 'europe' },
  NZD: { code: 'NZD', name: 'Dólar Neozelandés', flag: '🇳🇿', color: 'currency-nzd', region: 'major' },
  SEK: { code: 'SEK', name: 'Corona Sueca', flag: '🇸🇪', color: 'currency-sek', region: 'europe' },
  NOK: { code: 'NOK', name: 'Corona Noruega', flag: '🇳🇴', color: 'currency-nok', region: 'europe' },
  DKK: { code: 'DKK', name: 'Corona Danesa', flag: '🇩🇰', color: 'currency-dkk', region: 'europe' },
  
  // Asia Pacific
  CNY: { code: 'CNY', name: 'Yuan Chino', flag: '🇨🇳', color: 'currency-cny', region: 'asia' },
  HKD: { code: 'HKD', name: 'Dólar Hong Kong', flag: '🇭🇰', color: 'currency-hkd', region: 'asia' },
  SGD: { code: 'SGD', name: 'Dólar Singapur', flag: '🇸🇬', color: 'currency-sgd', region: 'asia' },
  KRW: { code: 'KRW', name: 'Won Surcoreano', flag: '🇰🇷', color: 'currency-krw', region: 'asia' },
  INR: { code: 'INR', name: 'Rupia India', flag: '🇮🇳', color: 'currency-inr', region: 'asia' },
  THB: { code: 'THB', name: 'Baht Tailandés', flag: '🇹🇭', color: 'currency-thb', region: 'asia' },
  MYR: { code: 'MYR', name: 'Ringgit Malayo', flag: '🇲🇾', color: 'currency-myr', region: 'asia' },
  IDR: { code: 'IDR', name: 'Rupia Indonesia', flag: '🇮🇩', color: 'currency-idr', region: 'asia' },
  PHP: { code: 'PHP', name: 'Peso Filipino', flag: '🇵🇭', color: 'currency-php', region: 'asia' },
  
  // Americas
  MXN: { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽', color: 'currency-mxn', region: 'americas' },
  BRL: { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷', color: 'currency-brl', region: 'americas' },
  
  // Europe (Non-G10)
  PLN: { code: 'PLN', name: 'Zloty Polaco', flag: '🇵🇱', color: 'currency-pln', region: 'europe' },
  CZK: { code: 'CZK', name: 'Corona Checa', flag: '🇨🇿', color: 'currency-czk', region: 'europe' },
  TRY: { code: 'TRY', name: 'Lira Turca', flag: '🇹🇷', color: 'currency-try', region: 'europe' },
  RUB: { code: 'RUB', name: 'Rublo Ruso', flag: '🇷🇺', color: 'currency-rub', region: 'europe' },
  
  // Middle East
  AED: { code: 'AED', name: 'Dirham Emiratos', flag: '🇦🇪', color: 'currency-aed', region: 'middle_east' },
  SAR: { code: 'SAR', name: 'Riyal Saudí', flag: '🇸🇦', color: 'currency-sar', region: 'middle_east' },
  ILS: { code: 'ILS', name: 'Shekel Israelí', flag: '🇮🇱', color: 'currency-ils', region: 'middle_east' },
  
  // Africa
  ZAR: { code: 'ZAR', name: 'Rand Sudafricano', flag: '🇿🇦', color: 'currency-zar', region: 'africa' },
};

export type EconomicCategory = 
  | 'monetary_policy'
  | 'inflation'
  | 'employment'
  | 'gdp'
  | 'trade'
  | 'central_bank'
  | 'geopolitics'
  | 'commodities'
  | 'stocks'
  | 'crypto'
  | 'other';

export type Bias = 'bullish' | 'bearish' | 'neutral';
export type BiasStrength = 'strong' | 'moderate' | 'weak';
export type RiskLevel = 'high' | 'medium' | 'low';
export type TimeHorizon = 'short_term' | 'medium_term' | 'long_term';
export type Importance = 'high' | 'medium' | 'low';

// News List Item (Screen 1)
export interface NewsListItem {
  id: string;
  image_url: string | null;
  title: string;
  source: string;
  source_logo: string | null;
  time_ago: string;
  published_at: string;
  category: EconomicCategory;
  affected_currencies: Currency[];
  relevance_score: number;
}

export interface NewsListResponse {
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
  news: NewsListItem[];
  last_updated: string;
}

// News Detail (Screen 2)
export interface KeyPoint {
  icon: string;
  text: string;
  importance: Importance;
}

export interface CurrencyImpact {
  currency: Currency;
  currency_flag: string;
  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;
  expected_direction: Bias;
  confidence: number;
}

export interface HistoricalDataPoint {
  period: string;
  impact_score: number;
  event_count: number;
  avg_market_reaction: number;
}

export interface HistoricalAnalysis {
  monthly_data: HistoricalDataPoint[];
  yearly_data: HistoricalDataPoint[];
  similar_events_summary: string;
  historical_pattern: string;
}

export interface TraderConclusion {
  bias: Bias;
  bias_strength: BiasStrength;
  summary: string;
  recommended_pairs: string[];
  risk_level: RiskLevel;
  time_horizon: TimeHorizon;
}

export interface NewsDetail {
  id: string;
  image_url: string | null;
  title: string;
  published_at: string;
  formatted_date: string;
  source: string;
  source_url: string;
  source_logo: string | null;
  category: EconomicCategory;
  ai_summary: string;
  key_points: KeyPoint[];
  trader_conclusion: TraderConclusion;
  currency_impacts: CurrencyImpact[];
  affected_currencies: Currency[];
  historical_analysis: HistoricalAnalysis;
  original_url: string;
  reading_time_minutes: number;
  relevance_score: number;
  processed_at: string;
}

export interface NewsDetailResponse {
  success: boolean;
  data: NewsDetail;
  cached: boolean;
}

// Category metadata
export interface CategoryInfo {
  id: EconomicCategory;
  label: string;
  icon: string;
}

export const CATEGORIES: Record<EconomicCategory, CategoryInfo> = {
  monetary_policy: { id: 'monetary_policy', label: 'Política Monetaria', icon: '🏦' },
  inflation: { id: 'inflation', label: 'Inflación', icon: '📈' },
  employment: { id: 'employment', label: 'Empleo', icon: '👔' },
  gdp: { id: 'gdp', label: 'PIB', icon: '📊' },
  trade: { id: 'trade', label: 'Comercio', icon: '🌐' },
  central_bank: { id: 'central_bank', label: 'Banco Central', icon: '🏛️' },
  geopolitics: { id: 'geopolitics', label: 'Geopolítica', icon: '🌍' },
  commodities: { id: 'commodities', label: 'Materias Primas', icon: '⛽' },
  stocks: { id: 'stocks', label: 'Acciones', icon: '📉' },
  crypto: { id: 'crypto', label: 'Cripto', icon: '₿' },
  other: { id: 'other', label: 'Otros', icon: '📰' },
};
