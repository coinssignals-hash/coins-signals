export interface TradingSignal {
  id: string;
  pair: string;
  flag1: string;
  flag2: string;
  datetime: string;
  status: 'active' | 'closed';
  probability: number;
  trend: number;
  trendDirection: 'up' | 'down';
  action: 'Comprar' | 'Vender';
  sessions: string[];
  entryPrice: number;
  takeProfit1: {
    price: number;
    probability: number;
    pips: number;
  };
  takeProfit2: {
    price: number;
    probability: number;
    pips: number;
  };
  stopLoss: {
    price: number;
    probability: number;
    pips: number;
  };
  support: number;
  resistance: number;
  sessionData: {
    close: number;
    open: number;
    pipsDiff: number;
  };
  analysis: {
    ai: number;
    sentiment: number;
    traderPages: number;
    professional: number;
  };
}

export const mockSignals: TradingSignal[] = [
  {
    id: '1',
    pair: 'EUR-USD',
    flag1: '🇪🇺',
    flag2: '🇺🇸',
    datetime: 'Jueves 08 Octubre 2025 11:35 (UTC+01:00)',
    status: 'active',
    probability: 85,
    trend: 67,
    trendDirection: 'up',
    action: 'Comprar',
    sessions: ['Londres', 'Asia'],
    entryPrice: 1.1572,
    takeProfit1: { price: 1.1610, probability: 87, pips: 0.070 },
    takeProfit2: { price: 1.1654, probability: 68, pips: 0.097 },
    stopLoss: { price: 1.1478, probability: 25, pips: -0.075 },
    support: 1.1524,
    resistance: 1.1589,
    sessionData: { close: 1.1654, open: 1.154, pipsDiff: -40 },
    analysis: { ai: 65, sentiment: 58, traderPages: 72, professional: 68 }
  },
  {
    id: '2',
    pair: 'USD-JPY',
    flag1: '🇺🇸',
    flag2: '🇯🇵',
    datetime: 'Jueves 08 Octubre 2025 12:48 (UTC+01:00)',
    status: 'active',
    probability: 85,
    trend: 78,
    trendDirection: 'down',
    action: 'Vender',
    sessions: ['New York', 'Londres'],
    entryPrice: 152.265,
    takeProfit1: { price: 152.302, probability: 82, pips: 0.070 },
    takeProfit2: { price: 152.323, probability: 59, pips: 0.097 },
    stopLoss: { price: 151.845, probability: 32, pips: -0.079 },
    support: 150.025,
    resistance: 152.035,
    sessionData: { close: 151.500, open: 151.420, pipsDiff: -80 },
    analysis: { ai: 70, sentiment: 62, traderPages: 75, professional: 55 }
  },
  {
    id: '3',
    pair: 'GBP-USD',
    flag1: '🇬🇧',
    flag2: '🇺🇸',
    datetime: 'Jueves 08 Octubre 2025 13:05 (UTC+01:00)',
    status: 'active',
    probability: 85,
    trend: 72,
    trendDirection: 'down',
    action: 'Vender',
    sessions: ['New York', 'Sydney'],
    entryPrice: 1.3250,
    takeProfit1: { price: 1.3180, probability: 75, pips: 0.055 },
    takeProfit2: { price: 1.3120, probability: 62, pips: 0.085 },
    stopLoss: { price: 1.3320, probability: 28, pips: -0.070 },
    support: 1.3100,
    resistance: 1.3350,
    sessionData: { close: 1.3180, open: 1.3200, pipsDiff: -20 },
    analysis: { ai: 68, sentiment: 55, traderPages: 80, professional: 72 }
  },
  {
    id: '4',
    pair: 'AUD-USD',
    flag1: '🇦🇺',
    flag2: '🇺🇸',
    datetime: 'Jueves 08 Octubre 2025 14:20 (UTC+01:00)',
    status: 'active',
    probability: 78,
    trend: 65,
    trendDirection: 'up',
    action: 'Comprar',
    sessions: ['Sydney', 'Asia'],
    entryPrice: 0.6450,
    takeProfit1: { price: 0.6485, probability: 80, pips: 0.035 },
    takeProfit2: { price: 0.6520, probability: 65, pips: 0.070 },
    stopLoss: { price: 0.6400, probability: 22, pips: -0.050 },
    support: 0.6380,
    resistance: 0.6550,
    sessionData: { close: 0.6485, open: 0.6440, pipsDiff: 45 },
    analysis: { ai: 72, sentiment: 60, traderPages: 68, professional: 58 }
  }
];

export const weekDays = [
  { label: 'Lunes 05', date: '2025-10-05' },
  { label: 'Martes 06', date: '2025-10-06' },
  { label: 'Miercoles 07', date: '2025-10-07' },
  { label: 'Jueves 08', date: '2025-10-08' },
  { label: 'Viernes 09', date: '2025-10-09' },
];
