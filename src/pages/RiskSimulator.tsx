import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface SimResult {
  trade: number;
  balance: number;
  win: boolean;
  pnl: number;
  riskAmount: number;
}

export default function RiskSimulator() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState([2]);
  const [winRate, setWinRate] = useState([55]);
  const [rrRatio, setRrRatio] = useState([2]);
  const [trades, setTrades] = useState([50]);
  const [results, setResults] = useState<SimResult[] | null>(null);

  const simulate = () => {
    const startBal = parseFloat(balance) || 10000;
    const rp = riskPercent[0] / 100;
    const wr = winRate[0] / 100;
    const rr = rrRatio[0];
    const n = trades[0];
    const sims: SimResult[] = [];
    let bal = startBal;

    for (let i = 0; i < n; i++) {
      const riskAmt = bal * rp;
      const win = Math.random() < wr;
      const pnl = win ? riskAmt * rr : -riskAmt;
      bal += pnl;
      sims.push({ trade: i + 1, balance: bal, win, pnl, riskAmount: riskAmt });
      if (bal <= 0) { bal = 0; break; }
    }
    setResults(sims);
  };

  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;
    const finalBal = results[results.length - 1].balance;
    const startBal = parseFloat(balance) || 10000;
    const totalReturn = ((finalBal - startBal) / startBal) * 100;
    const wins = results.filter(r => r.win).length;
    const maxDD = results.reduce((max, r) => {
      const dd = ((startBal - r.balance) / startBal) * 100;
      return dd > max ? dd : max;
    }, 0);
    const bestTrade = Math.max(...results.map(r => r.pnl));
    const worstTrade = Math.min(...results.map(r => r.pnl));
    return { finalBal, totalReturn, wins, losses: results.length - wins, maxDD, bestTrade, worstTrade };
  }, [results, balance]);

  // Mini equity curve
  const EquityCurve = () => {
    if (!results || results.length === 0) return null;
    const W = 320;
    const H = 120;
    const startBal = parseFloat(balance) || 10000;
    const allBals = [startBal, ...results.map(r => r.balance)];
    const maxB = Math.max(...allBals);
    const minB = Math.min(...allBals);
    const range = maxB - minB || 1;
    const points = allBals.map((b, i) => {
      const x = (i / (allBals.length - 1)) * W;
      const y = H - 10 - ((b - minB) / range) * (H - 20);
      return `${x},${y}`;
    }).join(' ');
    const lastBal = allBals[allBals.length - 1];
    const color = lastBal >= startBal ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))';
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28">
        <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
        <line x1={0} y1={H - 10 - ((startBal - minB) / range) * (H - 20)} x2={W} y2={H - 10 - ((startBal - minB) / range) * (H - 20)} stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} strokeDasharray="4" />
      </svg>
    );
  };

  return (
    <PageShell>
      <div className="space-y-4 pb-24 px-4 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/tools')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-foreground">{t('risk_simulator_title') || 'Simulador de Riesgo'}</h1>
        </div>
        {/* Config */}
        <Card className="p-4 bg-card border-border space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-accent" />
            <h3 className="text-sm font-bold text-foreground">Parámetros de Simulación</h3>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Balance Inicial ($)</label>
            <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="mt-1 bg-input border-border" />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Riesgo por Trade</label>
              <span className="text-xs font-bold text-foreground">{riskPercent[0]}%</span>
            </div>
            <Slider value={riskPercent} onValueChange={setRiskPercent} min={0.5} max={10} step={0.5} className="mt-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Conservador</span><span>Agresivo</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Win Rate</label>
              <span className="text-xs font-bold text-foreground">{winRate[0]}%</span>
            </div>
            <Slider value={winRate} onValueChange={setWinRate} min={20} max={80} step={5} className="mt-2" />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Ratio R:R</label>
              <span className="text-xs font-bold text-foreground">1:{rrRatio[0]}</span>
            </div>
            <Slider value={rrRatio} onValueChange={setRrRatio} min={0.5} max={5} step={0.5} className="mt-2" />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Número de Trades</label>
              <span className="text-xs font-bold text-foreground">{trades[0]}</span>
            </div>
            <Slider value={trades} onValueChange={setTrades} min={10} max={200} step={10} className="mt-2" />
          </div>

          <Button onClick={simulate} className="w-full bg-primary text-primary-foreground font-bold">
            🎲 Simular {trades[0]} Trades
          </Button>
        </Card>

        {/* Results */}
        {stats && results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="p-4 bg-card border-border">
              <h3 className="text-sm font-bold text-foreground mb-3">📈 Curva de Capital</h3>
              <EquityCurve />
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3 bg-card border-border text-center">
                <p className="text-[10px] text-muted-foreground">Balance Final</p>
                <p className={`text-sm font-bold ${stats.totalReturn >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
                  ${stats.finalBal.toFixed(0)}
                </p>
              </Card>
              <Card className="p-3 bg-card border-border text-center">
                <p className="text-[10px] text-muted-foreground">Retorno</p>
                <p className={`text-sm font-bold ${stats.totalReturn >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
                  {stats.totalReturn >= 0 ? '+' : ''}{stats.totalReturn.toFixed(1)}%
                </p>
              </Card>
              <Card className="p-3 bg-card border-border text-center">
                <p className="text-[10px] text-muted-foreground">Ganadas/Perdidas</p>
                <p className="text-sm font-bold text-foreground">{stats.wins}/{stats.losses}</p>
              </Card>
              <Card className="p-3 bg-card border-border text-center">
                <p className="text-[10px] text-muted-foreground">Máx. Drawdown</p>
                <p className="text-sm font-bold text-[hsl(var(--bearish))]">-{stats.maxDD.toFixed(1)}%</p>
              </Card>
            </div>

            {/* Risk Assessment */}
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-2 mb-2">
                {riskPercent[0] <= 2 ? (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--bullish))]" />
                ) : riskPercent[0] <= 5 ? (
                  <AlertTriangle className="h-5 w-5 text-accent" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-[hsl(var(--bearish))]" />
                )}
                <span className="text-sm font-bold text-foreground">Evaluación de Riesgo</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {riskPercent[0] <= 2
                  ? '✅ Riesgo conservador. Buena gestión de capital que protege contra rachas perdedoras.'
                  : riskPercent[0] <= 5
                  ? '⚠️ Riesgo moderado. Considera reducir si tu win rate es inferior al 50%.'
                  : '🔴 Riesgo alto. Con un drawdown del ' + stats.maxDD.toFixed(0) + '%, podrías sufrir pérdidas significativas.'
                }
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
