import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowUpDown, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

/* ────────── Currency list ────────── */
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', symbol: 'NZ$' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', flag: '🇵🇪', symbol: 'S/' },
  { code: 'UYU', name: 'Uruguayan Peso', flag: '🇺🇾', symbol: '$U' },
  { code: 'CRC', name: 'Costa Rican Colón', flag: '🇨🇷', symbol: '₡' },
  { code: 'DOP', name: 'Dominican Peso', flag: '🇩🇴', symbol: 'RD$' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷', symbol: '₩' },
  { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', symbol: '₺' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴', symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: 'HK$' },
];

const getCurrency = (code: string) => CURRENCIES.find(c => c.code === code)!;

/* ────────── Chart mock generator (simulates 7-day trend) ────────── */
function generateChartData(rate: number) {
  const points = 30;
  const data = [];
  let value = rate * (0.98 + Math.random() * 0.02);
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.48) * rate * 0.003;
    value = Math.max(value + change, rate * 0.95);
    const dateOffset = points - i;
    const d = new Date();
    d.setDate(d.getDate() - dateOffset);
    data.push({
      date: format(d, 'dd/MM'),
      value: parseFloat(value.toFixed(4)),
    });
  }
  // End near actual rate
  data.push({ date: format(new Date(), 'dd/MM'), value: rate });
  return data;
}

/* ────────── Main Component ────────── */
export default function CurrencyConverter() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('COP');
  const [amount, setAmount] = useState('1');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
      const data = await res.json();
      if (data.result === 'success' && data.rates?.[toCurrency]) {
        setRate(data.rates[toCurrency]);
      } else {
        setError('Rate not available');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  const converted = useMemo(() => {
    if (!rate) return null;
    const val = parseFloat(amount) || 0;
    return val * rate;
  }, [amount, rate]);

  const chartData = useMemo(() => {
    if (!rate) return [];
    return generateChartData(rate);
  }, [rate]);

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
    return v.toFixed(6);
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-4 space-y-4">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Link to="/tools" className="text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground italic">
            {t('tools_currency_converter_title')}
          </h1>
        </div>

        {/* Date */}
        <p className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 w-fit">
          {format(new Date(), "d MMM yyyy", { locale: dateLocale })}
        </p>

        {/* ──── Converter Card ──── */}
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            {/* FROM */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{from.flag}</span>
                <span className="text-sm font-semibold text-foreground">{from.name}</span>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-[80px] h-8 ml-auto text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-1.5">
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <span className="text-lg">{to.flag}</span>
                <span className="text-sm font-semibold text-foreground">{to.name}</span>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-[80px] h-8 ml-auto text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-1.5">
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {fromCurrency}/{toCurrency} — 30 {t('tools_converter_days')}
                </span>
                <button onClick={fetchRate} className="text-primary hover:text-primary/80 transition-colors">
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                </button>
              </div>

              {/* Current rate box */}
              <div className="flex justify-center">
                <div className="bg-secondary border border-primary/30 rounded-md px-4 py-1.5">
                  <span className="text-sm font-bold text-foreground">{rate ? formatValue(rate) : '...'}</span>
                </div>
              </div>

              {/* Area chart */}
              <div className="h-[160px] w-full">
                {chartData.length > 0 && (
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
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(2)}
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
                )}
              </div>

              {/* Min / Max row */}
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
            </div>
          </CardContent>
        </Card>

        {/* Calculate button */}
        <button
          onClick={fetchRate}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          {t('tools_converter_calculate')}
        </button>
      </main>
    </PageShell>
  );
}
