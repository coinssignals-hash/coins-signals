// Types for analysis data

export interface MajorNewsEvent {
  type: 'positive' | 'negative';
  currency: string;
  title: string;
  description: string;
  source?: string;
}

export interface EconomicEvent {
  time: string;
  event: string;
  description: string;
  impact: 'Alto' | 'Moderado' | 'Bajo';
  result?: string;
}

export interface MarketSentimentData {
  overall: 'bullish' | 'bearish' | 'neutral';
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent: number;
  indicators: {
    name: string;
    signal: 'buy' | 'sell' | 'neutral';
    value?: number;
  }[];
  lastUpdate: string;
}

export interface PricePredictionData {
  symbol: string;
  currentPrice: number;
  predictedHigh: number;
  predictedLow: number;
  predictedClose: number;
  confidence: number;
  direction: 'up' | 'down' | 'sideways';
  summary: string;
  timeframe: string;
}

export interface TechnicalLevelsData {
  symbol: string;
  resistances: { level: number; strength: 'strong' | 'moderate' | 'weak'; description?: string }[];
  supports: { level: number; strength: 'strong' | 'moderate' | 'weak'; description?: string }[];
  pivot: number;
  fibonacci: {
    level: string;
    price: number;
  }[];
}

export interface PreviousDayData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  resistance: number;
  support: number;
  change: number;
  changePercent: number;
}

export interface StrategicRecommendation {
  type: 'long_term' | 'short_term';
  strategy: string;
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2?: string;
  horizon: string;
  notes?: string[];
}

export interface MarketConclusionsData {
  symbol: string;
  shortTerm: {
    direction: 'bullish' | 'bearish' | 'neutral';
    label: string;
    probability: number;
    target: number;
  };
  mediumTerm: {
    direction: 'bullish' | 'bearish' | 'neutral';
    label: string;
    probability: number;
    range: { min: number; max: number };
  };
  longTerm: {
    direction: 'bullish' | 'bearish' | 'neutral';
    label: string;
    range: { min: number; max: number };
    target: number;
  };
  technicalSummary: string;
  bullishScenario: string;
  bearishScenario: string;
}

export interface MonetaryPolicyData {
  currency: string;
  centralBank: string;
  currentRate: string;
  lastDecision: string;
  nextMeeting: string;
  expectations: string;
  endYearRate: string;
  sources?: {
    finnhub: number;
    fmp: number;
    marketaux: number;
    alphaVantage: number;
  };
  recentHeadlines?: Array<{
    title: string;
    source: string;
    date: string;
  }>;
}

export interface RelevantNewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  url: string;
  source: string;
  publishedAt: string;
  impact: 'high' | 'medium' | 'low';
  currencies: string[];
}

export interface FullAnalysisData {
  symbol: string;
  timestamp: string;
  sentiment: MarketSentimentData;
  prediction: PricePredictionData;
  technicalLevels: TechnicalLevelsData;
  previousDay: PreviousDayData;
  recommendations: {
    longTerm: StrategicRecommendation;
    shortTerm: StrategicRecommendation;
  };
  conclusions: MarketConclusionsData;
  monetaryPolicies: MonetaryPolicyData[];
  majorNews: MajorNewsEvent[];
  relevantNews: RelevantNewsItem[];
  economicEvents: EconomicEvent[];
}
