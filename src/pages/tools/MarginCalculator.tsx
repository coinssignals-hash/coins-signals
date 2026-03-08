import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Percent, ArrowLeft, Info, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';

const PAIRS = [
  { symbol: 'EUR/USD', pipSize: 0.0001 },
  { symbol: 'GBP/USD', pipSize: 0.0001 },
  { symbol: 'USD/JPY', pipSize: 0.01 },
  { symbol: 'USD/CHF', pipSize: 0.0001 },
  { symbol: 'AUD/USD', pipSize: 0.0001 },
  { symbol: 'NZD/USD', pipSize: 0.0001 },
  { symbol: 'USD/CAD', pipSize: 0.0001 },
  { symbol: 'EUR/GBP', pipSize: 0.0001 },
  { symbol: 'EUR/JPY', pipSize: 0.01 },
  { symbol: 'GBP/JPY', pipSize: 0.01 },
  { symbol: 'AUD/JPY', pipSize: 0.01 },
  { symbol: 'XAU/USD', pipSize: 0.01 },
];

const LEVERAGE_OPTIONS = [
  { value: 10, label: '1:10' },
  { value: 20, label: '1:20' },
  { value: 30, label: '1:30' },
  { value: 50, label: '1:50' },
  { value: 100, label: '1:100' },
  { value: 200, label: '1:200' },
  { value: 500, label: '1:500' },
];

const LOT_SIZES = [
  { value: 100000, label: 'Estándar (100,000)' },
  { value: 10000, label: 'Mini (10,000)' },
  { value: 1000, label: 'Micro (1,000)' },
];

export default function MarginCalculator() {
  const [pair, setPair] = useState('EUR/USD');
  const [lotSize, setLotSize] = useState(100000);
  const [numLots, setNumLots] = useState('1');
  const [leverage, setLeverage] = useState(100);
  const [exchangeRate, setExchangeRate] = useState('1.0850');
  const [accountBalance, setAccountBalance] = useState('10000');

  const result = useMemo(() => {
    const lots = parseFloat(numLots) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    const balance = parseFloat(accountBalance) || 0;
    const positionSize = lotSize * lots;

    // Position value in USD
    const baseCurrency = pair.split('/')[0];
    const quoteCurrency = pair.split('/')[1];
    let positionValueUSD: number;

    if (quoteCurrency === 'USD') {
      positionValueUSD = positionSize * rate;
    } else if (baseCurrency === 'USD') {
      positionValueUSD = positionSize;
    } else {
      positionValueUSD = positionSize * rate;
    }

    const requiredMargin = positionValueUSD / leverage;
    const freeMargin = balance - requiredMargin;
    const marginLevel = requiredMargin > 0 ? (balance / requiredMargin) * 100 : 0;
    const marginUsedPercent = balance > 0 ? (requiredMargin / balance) * 100 : 0;

    return {
      positionSize,
      positionValueUSD,
      requiredMargin,
      freeMargin,
      marginLevel,
      marginUsedPercent,
    };
  }, [pair, lotSize, numLots, leverage, exchangeRate, accountBalance]);

  const marginStatus = result.marginLevel >= 200 ? 'safe' : result.marginLevel >= 100 ? 'warning' : 'danger';
  const statusConfig = {
    safe: { label: 'Seguro', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    warning: { label: 'Precaución', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    danger: { label: 'Peligro', color: 'text-red-400', bg: 'bg-red-500/15' },
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/tools" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Calculadora de Margen</h1>
            <p className="text-xs text-muted-foreground">Calcula el margen requerido para tus posiciones</p>
          </div>
        </div>

        {/* Inputs */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Par de Divisas</Label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAIRS.map(p => (
                    <SelectItem key={p.symbol} value={p.symbol}>{p.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tamaño de Lote</Label>
                <Select value={String(lotSize)} onValueChange={v => setLotSize(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOT_SIZES.map(l => (
                      <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Número de Lotes</Label>
                <Input type="number" value={numLots} onChange={e => setNumLots(e.target.value)} step="0.01" min="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Apalancamiento</Label>
                <Select value={String(leverage)} onValueChange={v => setLeverage(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVERAGE_OPTIONS.map(l => (
                      <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipo de Cambio</Label>
                <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} step="0.0001" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Balance de Cuenta (USD)</Label>
              <Input type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} min="0" step="100" />
            </div>
          </CardContent>
        </Card>

        {/* Margin Status */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary">Estado del Margen</h2>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">Nivel de Margen</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-mono font-bold", statusConfig[marginStatus].color)}>
                  {result.marginLevel.toFixed(1)}%
                </span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", statusConfig[marginStatus].bg, statusConfig[marginStatus].color)}>
                  {statusConfig[marginStatus].label}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  marginStatus === 'safe' ? 'bg-emerald-500' : marginStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(result.marginUsedPercent, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {result.marginUsedPercent.toFixed(1)}% del balance utilizado
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary">Desglose</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tamaño de posición</span>
                <span className="text-sm font-mono font-semibold text-foreground">{result.positionSize.toLocaleString()} unidades</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Valor de posición</span>
                <span className="text-sm font-mono font-semibold text-foreground">${result.positionValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Margen Requerido</span>
                <span className="text-base font-mono font-bold text-foreground">${result.requiredMargin.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Margen Libre</span>
                <span className={cn(
                  "text-base font-mono font-bold",
                  result.freeMargin >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  ${result.freeMargin.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        {marginStatus !== 'safe' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", statusConfig[marginStatus].color)} />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {marginStatus === 'danger'
                ? 'Tu nivel de margen está por debajo del 100%. Podrías recibir un margin call. Reduce el tamaño de la posición o aumenta tu capital.'
                : 'Tu nivel de margen es bajo. Considera reducir el apalancamiento o el tamaño de la posición para mayor seguridad.'}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            El margen es la garantía que tu broker retiene al abrir una posición. Un apalancamiento de 1:100 
            significa que necesitas solo el 1% del valor total como margen. Un nivel de margen por debajo del 100% 
            puede resultar en un margin call.
          </p>
        </div>
      </main>
    </PageShell>
  );
}
