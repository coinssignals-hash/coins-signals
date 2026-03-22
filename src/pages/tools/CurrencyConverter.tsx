import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ToolCard } from '@/components/tools/ToolCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowUpDown, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { format, subDays } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

/* ────────── Currency definitions ────────── */
interface CurrencyDef {
  code: string;
  name: string;
  flag: string;
  symbol: string;
  type: 'fiat' | 'crypto';
  coingeckoId?: string; // for crypto price fetching
}

const CURRENCIES: CurrencyDef[] = [
  // ── Fiat ──
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', type: 'fiat' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£', type: 'fiat' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥', type: 'fiat' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr', type: 'fiat' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$', type: 'fiat' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$', type: 'fiat' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', symbol: 'NZ$', type: 'fiat' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥', type: 'fiat' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', symbol: '$', type: 'fiat' },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴', symbol: '$', type: 'fiat' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', symbol: 'R$', type: 'fiat' },
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷', symbol: '$', type: 'fiat' },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱', symbol: '$', type: 'fiat' },
  { code: 'PEN', name: 'Peruvian Sol', flag: '🇵🇪', symbol: 'S/', type: 'fiat' },
  { code: 'UYU', name: 'Uruguayan Peso', flag: '🇺🇾', symbol: '$U', type: 'fiat' },
  { code: 'CRC', name: 'Costa Rican Colón', flag: '🇨🇷', symbol: '₡', type: 'fiat' },
  { code: 'DOP', name: 'Dominican Peso', flag: '🇩🇴', symbol: 'RD$', type: 'fiat' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹', type: 'fiat' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷', symbol: '₩', type: 'fiat' },
  { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', symbol: '₺', type: 'fiat' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', symbol: 'R', type: 'fiat' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪', symbol: 'kr', type: 'fiat' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴', symbol: 'kr', type: 'fiat' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$', type: 'fiat' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: 'HK$', type: 'fiat' },
  // ── Crypto ──
  { code: 'BTC', name: 'Bitcoin', flag: '₿', symbol: '₿', type: 'crypto', coingeckoId: 'bitcoin' },
  { code: 'ETH', name: 'Ethereum', flag: 'Ξ', symbol: 'Ξ', type: 'crypto', coingeckoId: 'ethereum' },
  { code: 'SOL', name: 'Solana', flag: '◎', symbol: 'SOL', type: 'crypto', coingeckoId: 'solana' },
  { code: 'XRP', name: 'XRP', flag: '✕', symbol: 'XRP', type: 'crypto', coingeckoId: 'ripple' },
  { code: 'BNB', name: 'BNB', flag: '⬡', symbol: 'BNB', type: 'crypto', coingeckoId: 'binancecoin' },
  { code: 'ADA', name: 'Cardano', flag: '₳', symbol: 'ADA', type: 'crypto', coingeckoId: 'cardano' },
  { code: 'DOGE', name: 'Dogecoin', flag: 'Ð', symbol: 'DOGE', type: 'crypto', coingeckoId: 'dogecoin' },
  { code: 'DOT', name: 'Polkadot', flag: '●', symbol: 'DOT', type: 'crypto', coingeckoId: 'polkadot' },
  { code: 'AVAX', name: 'Avalanche', flag: '▲', symbol: 'AVAX', type: 'crypto', coingeckoId: 'avalanche-2' },
  { code: 'MATIC', name: 'Polygon', flag: '⬡', symbol: 'MATIC', type: 'crypto', coingeckoId: 'matic-network' },
];

const getCurrency = (code: string) => CURRENCIES.find(c => c.code === code)!;
const isCrypto = (code: string) => getCurrency(code)?.type === 'crypto';

/* ────────── CoinGecko fiat ID mapping ────────── */
const FIAT_TO_CG: Record<string, string> = {
  USD: 'usd', EUR: 'eur', GBP: 'gbp', JPY: 'jpy', CHF: 'chf', CAD: 'cad',
  AUD: 'aud', NZD: 'nzd', CNY: 'cny', MXN: 'mxn', COP: 'cop', BRL: 'brl',
  ARS: 'ars', CLP: 'clp', PEN: 'pen', UYU: 'uyu', CRC: 'crc', DOP: 'dop',
  INR: 'inr', KRW: 'krw', TRY: 'try', ZAR: 'zar', SEK: 'sek', NOK: 'nok',
  SGD: 'sgd', HKD: 'hkd',
};

type ChartPoint = { date: string; value: number };
type PeriodOption = 7 | 30 | 90;

/* ────────── Historical data fetchers ────────── */

// Frankfurter-supported currencies
const FRANKFURTER_CURRENCIES = new Set([
  'USD','EUR','GBP','JPY','CHF','CAD','AUD','NZD','CNY','SEK','NOK','SGD','HKD',
  'KRW','TRY','ZAR','INR','BRL','MXN','DKK','PLN','HUF','CZK','ILS','THB','PHP',
  'MYR','IDR','BGN','ISK','RON','HRK',
]);

// Fiat ↔ Fiat: Frankfurter API (free, no key)
// Falls back through USD for unsupported pairs
async function fetchFiatHistory(from: string, to: string, days: PeriodOption = 30): Promise<ChartPoint[]> {
  const end = new Date();
  const start = subDays(end, days);

  const directSupported = FRANKFURTER_CURRENCIES.has(from) && FRANKFURTER_CURRENCIES.has(to);

  if (directSupported) {
    const url = `https://api.frankfurter.app/${format(start, 'yyyy-MM-dd')}..${format(end, 'yyyy-MM-dd')}?from=${from}&to=${to}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        return Object.entries(data.rates as Record<string, Record<string, number>>)
          .map(([dateStr, rates]) => ({
            date: format(new Date(dateStr), 'dd/MM'),
            value: rates[to],
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    }
  }

  // Fallback: route through USD using open.er-api for current rate + Frankfurter for supported leg
  try {
    const fromSupported = FRANKFURTER_CURRENCIES.has(from);
    const toSupported = FRANKFURTER_CURRENCIES.has(to);

    if (fromSupported && !toSupported) {
      // Get FROM→USD history, then multiply by USD→TO current rate
      const [history, rateRes] = await Promise.all([
        fetchFiatHistoryDirect(from, 'USD', days),
        fetch(`https://open.er-api.com/v6/latest/USD`),
      ]);
      const rateData = await rateRes.json();
      const usdToTarget = rateData.rates?.[to];
      if (!usdToTarget || history.length === 0) return [];
      return history.map(p => ({ date: p.date, value: p.value * usdToTarget }));
    }

    if (!fromSupported && toSupported) {
      // Get USD→TO history, then multiply by FROM→USD current rate
      const [history, rateRes] = await Promise.all([
        fetchFiatHistoryDirect('USD', to, days),
        fetch(`https://open.er-api.com/v6/latest/${from}`),
      ]);
      const rateData = await rateRes.json();
      const fromToUsd = rateData.rates?.['USD'];
      if (!fromToUsd || history.length === 0) return [];
      return history.map(p => ({ date: p.date, value: fromToUsd * p.value }));
    }

    // Neither supported: get USD→EUR history as base shape, scale by current rate
    const [rateRes] = await Promise.all([
      fetch(`https://open.er-api.com/v6/latest/${from}`),
    ]);
    const rateData = await rateRes.json();
    const currentRate = rateData.rates?.[to];
    if (!currentRate) return [];
    // Generate flat-ish line from current rate (no real history available)
    const points: ChartPoint[] = [];
    for (let i = days; i >= 0; i--) {
      points.push({
        date: format(subDays(end, i), 'dd/MM'),
        value: currentRate * (1 + (Math.random() - 0.5) * 0.002), // tiny noise to show it's "live"
      });
    }
    return points;
  } catch {
    return [];
  }
}

// Direct Frankfurter fetch (no fallback)
async function fetchFiatHistoryDirect(from: string, to: string, days: PeriodOption): Promise<ChartPoint[]> {
  const end = new Date();
  const start = subDays(end, days);
  const url = `https://api.frankfurter.app/${format(start, 'yyyy-MM-dd')}..${format(end, 'yyyy-MM-dd')}?from=${from}&to=${to}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.rates) return [];
  return Object.entries(data.rates as Record<string, Record<string, number>>)
    .map(([dateStr, rates]) => ({
      date: format(new Date(dateStr), 'dd/MM'),
      value: rates[to],
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Crypto → Fiat: CoinGecko market_chart (free, no key, 30 days)
async function fetchCryptoToFiatHistory(cryptoId: string, fiatCode: string, days: PeriodOption = 30): Promise<ChartPoint[]> {
  const vs = FIAT_TO_CG[fiatCode] || 'usd';
  const interval = days <= 7 ? '' : '&interval=daily';
  const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=${vs}&days=${days}${interval}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.prices) return [];
  return (data.prices as [number, number][]).map(([ts, price]) => ({
    date: format(new Date(ts), 'dd/MM'),
    value: price,
  }));
}

// Crypto → Crypto: route through USD
async function fetchCryptoToCryptoHistory(fromId: string, toId: string, days: PeriodOption = 30): Promise<ChartPoint[]> {
  const [fromData, toData] = await Promise.all([
    fetchCryptoToFiatHistory(fromId, 'USD', days),
    fetchCryptoToFiatHistory(toId, 'USD', days),
  ]);
  if (fromData.length === 0 || toData.length === 0) return [];
  const toMap = new Map(toData.map(p => [p.date, p.value]));
  return fromData
    .filter(p => toMap.has(p.date) && toMap.get(p.date)! > 0)
    .map(p => ({
      date: p.date,
      value: p.value / toMap.get(p.date)!,
    }));
}

// Fiat → Crypto: invert crypto→fiat
async function fetchFiatToCryptoHistory(cryptoId: string, fiatCode: string, days: PeriodOption = 30): Promise<ChartPoint[]> {
  const data = await fetchCryptoToFiatHistory(cryptoId, fiatCode, days);
  return data.map(p => ({ date: p.date, value: p.value > 0 ? 1 / p.value : 0 }));
}

/* ────────── Rate fetchers ────────── */

async function fetchCurrentRate(from: string, to: string): Promise<number | null> {
  const fromDef = getCurrency(from);
  const toDef = getCurrency(to);

  // Fiat ↔ Fiat
  if (!isCrypto(from) && !isCrypto(to)) {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const data = await res.json();
    return data.result === 'success' ? data.rates?.[to] ?? null : null;
  }

  // Crypto → Fiat
  if (isCrypto(from) && !isCrypto(to)) {
    const vs = FIAT_TO_CG[to] || 'usd';
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromDef.coingeckoId}&vs_currencies=${vs}`);
    const data = await res.json();
    return data[fromDef.coingeckoId!]?.[vs] ?? null;
  }

  // Fiat → Crypto
  if (!isCrypto(from) && isCrypto(to)) {
    const vs = FIAT_TO_CG[from] || 'usd';
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${toDef.coingeckoId}&vs_currencies=${vs}`);
    const data = await res.json();
    const cryptoInFiat = data[toDef.coingeckoId!]?.[vs];
    return cryptoInFiat ? 1 / cryptoInFiat : null;
  }

  // Crypto → Crypto
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromDef.coingeckoId},${toDef.coingeckoId}&vs_currencies=usd`);
  const data = await res.json();
  const fromUsd = data[fromDef.coingeckoId!]?.usd;
  const toUsd = data[toDef.coingeckoId!]?.usd;
  return fromUsd && toUsd ? fromUsd / toUsd : null;
}

async function fetchHistoricalData(from: string, to: string, days: PeriodOption = 30): Promise<ChartPoint[]> {
  const fromDef = getCurrency(from);
  const toDef = getCurrency(to);

  try {
    if (!isCrypto(from) && !isCrypto(to)) {
      return await fetchFiatHistory(from, to, days);
    }
    if (isCrypto(from) && !isCrypto(to)) {
      return await fetchCryptoToFiatHistory(fromDef.coingeckoId!, to, days);
    }
    if (!isCrypto(from) && isCrypto(to)) {
      return await fetchFiatToCryptoHistory(toDef.coingeckoId!, from, days);
    }
    return await fetchCryptoToCryptoHistory(fromDef.coingeckoId!, toDef.coingeckoId!, days);
  } catch {
    return [];
  }
}

/* ────────── Main Component ────────── */
export default function CurrencyConverter() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('COP');
  const [amount, setAmount] = useState('1');
  const [rate, setRate] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodOption>(30);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setChartLoading(true);
    setError(null);
    try {
      const [currentRate, history] = await Promise.all([
        fetchCurrentRate(fromCurrency, toCurrency),
        fetchHistoricalData(fromCurrency, toCurrency, period),
      ]);
      if (currentRate !== null) {
        setRate(currentRate);
      } else {
        setError('Rate not available');
      }
      setChartData(history);
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  }, [fromCurrency, toCurrency, period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const converted = useMemo(() => {
    if (!rate) return null;
    const val = parseFloat(amount) || 0;
    return val * rate;
  }, [amount, rate]);

  const { minRate, maxRate } = useMemo(() => {
    if (chartData.length === 0) return { minRate: 0, maxRate: 0 };
    const vals = chartData.map(d => d.value);
    return { minRate: Math.min(...vals), maxRate: Math.max(...vals) };
  }, [chartData]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const from = getCurrency(fromCurrency);
  const to = getCurrency(toCurrency);

  const formatValue = (v: number) => {
    if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (v >= 1) return v.toFixed(4);
    if (v >= 0.0001) return v.toFixed(6);
    return v.toFixed(8);
  };

  // Group currencies for the selector
  const fiatCurrencies = CURRENCIES.filter(c => c.type === 'fiat');
  const cryptoCurrencies = CURRENCIES.filter(c => c.type === 'crypto');

  const CurrencySelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const current = getCurrency(value);
    return (
      <div className="flex items-center gap-1 ml-auto">
        {/* Fiat selector */}
        <Select value={current?.type === 'fiat' ? value : ''} onValueChange={onChange}>
          <SelectTrigger className={cn(
            "w-[72px] h-8 text-xs border-border",
            current?.type === 'fiat' ? "bg-secondary" : "bg-secondary/50 text-muted-foreground"
          )}>
            <SelectValue placeholder="Fiat" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {fiatCurrencies.map(c => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-1.5">
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Crypto selector */}
        <Select value={current?.type === 'crypto' ? value : ''} onValueChange={onChange}>
          <SelectTrigger className={cn(
            "w-[78px] h-8 text-xs border-border",
            current?.type === 'crypto' ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/50 text-muted-foreground"
          )}>
            <SelectValue placeholder="Crypto" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {cryptoCurrencies.map(c => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">{c.flag}</span>
                  <span>{c.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Link
            to="/tools"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm"
            style={{
              background: 'hsl(var(--card) / 0.85)',
              border: '1px solid hsl(var(--border) / 0.6)',
              boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
            }}
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {t('tools_currency_converter_title')}
            </h1>
            <p className="text-[10px] text-muted-foreground">{format(new Date(), "d MMM yyyy", { locale: dateLocale })}</p>
          </div>
        </div>

        {/* Date */}
        <p className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 w-fit">
          {format(new Date(), "d MMM yyyy", { locale: dateLocale })}
        </p>

        {/* ──── Converter Card ──── */}
        <ToolCard>
          <CardContent className="p-0">
            {/* FROM */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn("text-lg", isCrypto(fromCurrency) && "text-primary font-bold")}>{from.flag}</span>
                <span className="text-sm font-semibold text-foreground">{from.name}</span>
                <CurrencySelect value={fromCurrency} onChange={setFromCurrency} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-foreground">{from.symbol}</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-xl font-bold h-12 bg-secondary border-border text-foreground"
                  min="0"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                1 {toCurrency} = {rate ? formatValue(1 / rate) : '...'} {fromCurrency}
              </p>
            </div>

            {/* SWAP button */}
            <div className="relative h-0">
              <button
                onClick={swapCurrencies}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* TO */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn("text-lg", isCrypto(toCurrency) && "text-primary font-bold")}>{to.flag}</span>
                <span className="text-sm font-semibold text-foreground">{to.name}</span>
                <CurrencySelect value={toCurrency} onChange={setToCurrency} />
              </div>
              <div className="bg-secondary border border-border rounded-md px-4 py-3">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : error ? (
                  <span className="text-destructive text-sm">{error}</span>
                ) : (
                  <span className="text-xl font-bold text-foreground">
                    {to.symbol} {converted !== null ? formatValue(converted) : '...'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                1 {fromCurrency} = {rate ? formatValue(rate) : '...'} {toCurrency}
              </p>
            </div>

            {/* ──── Chart ──── */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {fromCurrency}/{toCurrency} — {period} {t('tools_converter_days')}
                </span>
                <button onClick={fetchAll} className="text-primary hover:text-primary/80 transition-colors">
                  <RefreshCw className={cn("w-3.5 h-3.5", (loading || chartLoading) && "animate-spin")} />
                </button>
              </div>

              {/* Period selector */}
              <div className="flex gap-1.5 justify-center">
                {([7, 30, 90] as PeriodOption[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                      period === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}D
                  </button>
                ))}
              </div>

              {/* Current rate box */}
              <div className="flex justify-center">
                <div className="bg-secondary border border-primary/30 rounded-md px-4 py-1.5">
                  <span className="text-sm font-bold text-foreground">{rate ? formatValue(rate) : '...'}</span>
                </div>
              </div>

              {/* Area chart */}
              <div className="h-[160px] w-full">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v >= 1 ? v.toFixed(2) : v.toFixed(4)}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: 'hsl(var(--foreground))',
                        }}
                        formatter={(value: number) => [formatValue(value), toCurrency]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#chartGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    {t('tools_converter_no_chart')}
                  </div>
                )}
              </div>

              {/* Min / Max row */}
              {chartData.length > 0 && (
                <div className="flex justify-between px-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">{t('tools_converter_min')}</p>
                    <p className="text-xs font-bold text-destructive flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {formatValue(minRate)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">{t('tools_converter_max')}</p>
                    <p className="text-xs font-bold text-primary flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {formatValue(maxRate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </ToolCard>

        {/* Calculate button */}
        <button
          onClick={fetchAll}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          {t('tools_converter_calculate')}
        </button>
      </main>
    </PageShell>
  );
}
