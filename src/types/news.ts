// TypeScript types matching the API schemas

export type Currency = 'EUR' | 'USD' | 'AUD' | 'CAD' | 'GBP' | 'JPY' | 'CHF' | 'NZD';

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

// Currency metadata
export interface CurrencyInfo {
  code: Currency;
  name: string;
  flag: string;
  color: string;
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  EUR: { code: 'EUR', name: 'Euro', flag: '🇪🇺', color: 'currency-eur' },
  USD: { code: 'USD', name: 'US Dollar', flag: '🇺🇸', color: 'currency-usd' },
  GBP: { code: 'GBP', name: 'British Pound', flag: '🇬🇧', color: 'currency-gbp' },
  JPY: { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', color: 'currency-jpy' },
  AUD: { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', color: 'currency-aud' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', color: 'currency-cad' },
  CHF: { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', color: 'currency-chf' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', color: 'currency-nzd' },
};

// Category metadata
export interface CategoryInfo {
  id: EconomicCategory;
  label: string;
  icon: string;
}

export const CATEGORIES: Record<EconomicCategory, CategoryInfo> = {
  monetary_policy: { id: 'monetary_policy', label: 'Monetary Policy', icon: '🏦' },
  inflation: { id: 'inflation', label: 'Inflation', icon: '📈' },
  employment: { id: 'employment', label: 'Employment', icon: '👔' },
  gdp: { id: 'gdp', label: 'GDP', icon: '📊' },
  trade: { id: 'trade', label: 'Trade', icon: '🌐' },
  central_bank: { id: 'central_bank', label: 'Central Bank', icon: '🏛️' },
  geopolitics: { id: 'geopolitics', label: 'Geopolitics', icon: '🌍' },
  commodities: { id: 'commodities', label: 'Commodities', icon: '⛽' },
  stocks: { id: 'stocks', label: 'Stocks', icon: '📉' },
  crypto: { id: 'crypto', label: 'Crypto', icon: '₿' },
  other: { id: 'other', label: 'Other', icon: '📰' },
};
