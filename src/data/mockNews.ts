import { NewsListItem, NewsDetail, Currency, EconomicCategory } from '@/types/news';

// Mock data for development (will be replaced with API calls)

export const mockNewsList: NewsListItem[] = [
  {
    id: '1',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    title: 'Fed Signals Potential Rate Cut in Early 2025 Amid Cooling Inflation',
    source: 'Reuters',
    source_logo: null,
    time_ago: '2h ago',
    published_at: '2024-12-27T14:00:00Z',
    category: 'monetary_policy',
    affected_currencies: ['USD', 'EUR', 'GBP'],
    relevance_score: 0.95,
  },
  {
    id: '2',
    image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
    title: 'ECB Maintains Hawkish Stance as Eurozone Inflation Remains Elevated',
    source: 'Bloomberg',
    source_logo: null,
    time_ago: '4h ago',
    published_at: '2024-12-27T12:00:00Z',
    category: 'central_bank',
    affected_currencies: ['EUR', 'USD'],
    relevance_score: 0.92,
  },
  {
    id: '3',
    image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
    title: 'Bank of Japan Hints at Policy Shift, Yen Strengthens',
    source: 'Nikkei',
    source_logo: null,
    time_ago: '6h ago',
    published_at: '2024-12-27T10:00:00Z',
    category: 'monetary_policy',
    affected_currencies: ['JPY', 'USD', 'EUR'],
    relevance_score: 0.89,
  },
  {
    id: '4',
    image_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
    title: 'UK Employment Data Beats Expectations, GBP Rallies',
    source: 'Financial Times',
    source_logo: null,
    time_ago: '8h ago',
    published_at: '2024-12-27T08:00:00Z',
    category: 'employment',
    affected_currencies: ['GBP', 'EUR'],
    relevance_score: 0.85,
  },
  {
    id: '5',
    image_url: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
    title: 'Australian GDP Growth Exceeds Forecasts, RBA Under Pressure',
    source: 'ABC News',
    source_logo: null,
    time_ago: '10h ago',
    published_at: '2024-12-27T06:00:00Z',
    category: 'gdp',
    affected_currencies: ['AUD', 'NZD', 'USD'],
    relevance_score: 0.82,
  },
  {
    id: '6',
    image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
    title: 'Canadian Trade Surplus Widens on Strong Energy Exports',
    source: 'Globe and Mail',
    source_logo: null,
    time_ago: '12h ago',
    published_at: '2024-12-27T04:00:00Z',
    category: 'trade',
    affected_currencies: ['CAD', 'USD'],
    relevance_score: 0.78,
  },
  {
    id: '7',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    title: 'Swiss National Bank Surprises with Larger Rate Cut',
    source: 'SWI',
    source_logo: null,
    time_ago: '14h ago',
    published_at: '2024-12-27T02:00:00Z',
    category: 'central_bank',
    affected_currencies: ['CHF', 'EUR'],
    relevance_score: 0.88,
  },
  {
    id: '8',
    image_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    title: 'New Zealand Dairy Exports Hit Record High, NZD Supported',
    source: 'NZ Herald',
    source_logo: null,
    time_ago: '16h ago',
    published_at: '2024-12-26T22:00:00Z',
    category: 'commodities',
    affected_currencies: ['NZD', 'AUD'],
    relevance_score: 0.75,
  },
];

export const mockNewsDetail: NewsDetail = {
  id: '1',
  image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200',
  title: 'Fed Signals Potential Rate Cut in Early 2025 Amid Cooling Inflation',
  published_at: '2024-12-27T14:00:00Z',
  formatted_date: '27 Dec 2024',
  source: 'Reuters',
  source_url: 'https://reuters.com',
  source_logo: null,
  category: 'monetary_policy',
  ai_summary: `The Federal Reserve has signaled a potential shift in monetary policy, suggesting that interest rate cuts could begin as early as the first quarter of 2025. This dovish pivot comes after months of aggressive rate hikes aimed at combating inflation.

Fed Chair Jerome Powell emphasized that while inflation has shown encouraging signs of cooling, the central bank remains data-dependent. The latest PCE inflation reading came in at 2.8%, down from 3.2% in the previous quarter, moving closer to the Fed's 2% target.

Market participants are now pricing in a 75% probability of a 25 basis point cut in March 2025, with additional cuts expected throughout the year. This shift in expectations has already begun to impact currency markets, with the Dollar Index (DXY) declining 1.2% in the past week.

The Fed's balance sheet reduction (quantitative tightening) is expected to continue at the current pace of $95 billion per month, though some FOMC members have suggested slowing the pace of runoff could be appropriate if financial conditions tighten significantly.`,
  key_points: [
    { icon: '📉', text: 'Fed signals potential rate cuts starting Q1 2025', importance: 'high' },
    { icon: '📊', text: 'PCE inflation dropped to 2.8% from 3.2%', importance: 'high' },
    { icon: '💹', text: 'Markets pricing 75% probability of March rate cut', importance: 'high' },
    { icon: '💵', text: 'Dollar Index declined 1.2% on dovish outlook', importance: 'medium' },
    { icon: '🏦', text: 'QT continues at $95B/month pace', importance: 'medium' },
  ],
  trader_conclusion: {
    bias: 'bearish',
    bias_strength: 'moderate',
    summary: 'The Fed\'s dovish pivot suggests USD weakness ahead. Consider short USD positions against high-yielding currencies like AUD and NZD. EUR/USD likely to test 1.1100 resistance. Watch for NFP data next week as confirmation.',
    recommended_pairs: ['EUR/USD Long', 'AUD/USD Long', 'USD/JPY Short'],
    risk_level: 'medium',
    time_horizon: 'medium_term',
  },
  currency_impacts: [
    {
      currency: 'USD',
      currency_flag: '🇺🇸',
      positive_percentage: 15,
      negative_percentage: 70,
      neutral_percentage: 15,
      expected_direction: 'bearish',
      confidence: 0.85,
    },
    {
      currency: 'EUR',
      currency_flag: '🇪🇺',
      positive_percentage: 65,
      negative_percentage: 20,
      neutral_percentage: 15,
      expected_direction: 'bullish',
      confidence: 0.75,
    },
    {
      currency: 'GBP',
      currency_flag: '🇬🇧',
      positive_percentage: 55,
      negative_percentage: 25,
      neutral_percentage: 20,
      expected_direction: 'bullish',
      confidence: 0.65,
    },
    {
      currency: 'JPY',
      currency_flag: '🇯🇵',
      positive_percentage: 50,
      negative_percentage: 30,
      neutral_percentage: 20,
      expected_direction: 'bullish',
      confidence: 0.60,
    },
    {
      currency: 'AUD',
      currency_flag: '🇦🇺',
      positive_percentage: 60,
      negative_percentage: 25,
      neutral_percentage: 15,
      expected_direction: 'bullish',
      confidence: 0.70,
    },
  ],
  affected_currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD'],
  historical_analysis: {
    monthly_data: [
      { period: 'Ene', impact_score: 45, event_count: 3, avg_market_reaction: 85 },
      { period: 'Feb', impact_score: 30, event_count: 2, avg_market_reaction: 60 },
      { period: 'Mar', impact_score: -25, event_count: 4, avg_market_reaction: -45 },
      { period: 'Abr', impact_score: 55, event_count: 2, avg_market_reaction: 95 },
      { period: 'May', impact_score: 20, event_count: 3, avg_market_reaction: 40 },
      { period: 'Jun', impact_score: -40, event_count: 5, avg_market_reaction: -75 },
      { period: 'Jul', impact_score: 35, event_count: 2, avg_market_reaction: 65 },
      { period: 'Ago', impact_score: 60, event_count: 4, avg_market_reaction: 110 },
      { period: 'Sep', impact_score: -15, event_count: 3, avg_market_reaction: -30 },
      { period: 'Oct', impact_score: 70, event_count: 5, avg_market_reaction: 125 },
      { period: 'Nov', impact_score: 25, event_count: 2, avg_market_reaction: 50 },
      { period: 'Dic', impact_score: 80, event_count: 4, avg_market_reaction: 140 },
    ],
    yearly_data: [
      { period: '2020', impact_score: 85, event_count: 24, avg_market_reaction: 150 },
      { period: '2021', impact_score: 45, event_count: 18, avg_market_reaction: 80 },
      { period: '2022', impact_score: -60, event_count: 32, avg_market_reaction: -110 },
      { period: '2023', impact_score: 30, event_count: 28, avg_market_reaction: 55 },
      { period: '2024', impact_score: 55, event_count: 35, avg_market_reaction: 95 },
    ],
    similar_events_summary: 'In 8 of the last 10 Fed dovish pivots, EUR/USD gained an average of 3.5% over the following 3 months.',
    historical_pattern: 'Fed rate cut cycles historically trigger USD weakness lasting 6-12 months.',
  },
  original_url: 'https://www.reuters.com/markets/fed-signals-rate-cut',
  reading_time_minutes: 5,
  relevance_score: 0.95,
  processed_at: '2024-12-27T14:30:00Z',
};

// Helper to get news by date
export const getNewsByDate = (date: Date): NewsListItem[] => {
  // In production, this would filter by actual dates
  // For mock data, just return all news
  return mockNewsList;
};

// Helper to get news detail by ID
export const getNewsById = (id: string): NewsDetail | undefined => {
  if (id === '1') return mockNewsDetail;
  // For other IDs, create variations of the mock detail
  const listItem = mockNewsList.find(n => n.id === id);
  if (!listItem) return undefined;
  
  return {
    ...mockNewsDetail,
    id: listItem.id,
    title: listItem.title,
    image_url: listItem.image_url,
    source: listItem.source,
    category: listItem.category,
    affected_currencies: listItem.affected_currencies,
    currency_impacts: mockNewsDetail.currency_impacts.filter(
      ci => listItem.affected_currencies.includes(ci.currency)
    ),
  };
};
