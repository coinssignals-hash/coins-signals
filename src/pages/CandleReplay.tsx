import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipForward, RotateCcw, TrendingUp, TrendingDown, Eye, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface Candle {
  open: number; high: number; low: number; close: number; index: number;
}

function generateCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 1.08 + Math.random() * 0.02;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 0.005;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 0.002;
    const low = Math.min(open, close) - Math.random() * 0.002;
    candles.push({ open, high, low, close, index: i });
    price = close;
  }
  return candles;
}

function MiniCandleChart({ candles, revealedCount }: { candles: Candle[]; revealedCount: number }) {
  const visible = candles.slice(0, revealedCount);
  if (visible.length === 0) return null;

  const allPrices = visible.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 0.001;
  const W = 320;
  const H = 180;
  const candleW = Math.max(2, Math.min(8, (W - 20) / visible.length - 1));

  const toY = (p: number) => H - 10 - ((p - minP) / range) * (H - 20);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 rounded-lg bg-card border border-border">
      {visible.map((c, i) => {
        const x = 10 + i * (candleW + 1);
        const isBullish = c.close >= c.open;
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const color = isBullish ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))';
        return (
          <g key={i}>
            <line x1={x + candleW / 2} y1={toY(c.high)} x2={x + candleW / 2} y2={toY(c.low)} stroke={color} strokeWidth={1} />
            <rect x={x} y={bodyTop} width={candleW} height={Math.max(1, bodyBot - bodyTop)} fill={color} rx={0.5} />
          </g>
        );
      })}
    </svg>
  );
}

const SCENARIOS = [
  { name: 'Tendencia Alcista', count: 60 },
  { name: 'Rango Lateral', count: 50 },
  { name: 'Reversión Bajista', count: 45 },
  { name: 'Breakout', count: 55 },
];

export default function CandleReplay() {
  const { t } = useTranslation();
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(60));
  const [revealed, setRevealed] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [prediction, setPrediction] = useState<'buy' | 'sell' | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (playing && revealed < candles.length) {
      timerRef.current = setInterval(() => {
        setRevealed(prev => {
          if (prev >= candles.length) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, revealed, candles.length]);

  const makePrediction = (dir: 'buy' | 'sell') => {
    setPrediction(dir);
    setPlaying(true);
  };

  const checkResult = useCallback(() => {
    if (!prediction) return;
    const entryPrice = candles[revealed - 5]?.close || candles[revealed - 1]?.close;
    const exitPrice = candles[Math.min(revealed - 1, candles.length - 1)]?.close;
    const diff = exitPrice - entryPrice;
    const won = (prediction === 'buy' && diff > 0) || (prediction === 'sell' && diff < 0);
    if (won) setScore(s => s + 1);
    setRounds(r => r + 1);
    setShowResult(true);
    setPlaying(false);
  }, [prediction, revealed, candles]);

  useEffect(() => {
    if (revealed >= candles.length && prediction && !showResult) {
      checkResult();
    }
  }, [revealed, candles.length, prediction, showResult, checkResult]);

  const newRound = () => {
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    setCandles(generateCandles(scenario.count));
    setRevealed(10);
    setPrediction(null);
    setShowResult(false);
    setPlaying(false);
  };

  return (
    <PageShell>
      <div className="space-y-4 pb-24 px-4 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/tools')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-foreground">{t('candle_replay_title') || 'Candle Replay'}</h1>
        </div>
        {/* Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary">
              ✅ {score}/{rounds}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {rounds > 0 ? `${(score / rounds * 100).toFixed(0)}% aciertos` : 'Sin rondas'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Vela {revealed}/{candles.length}
          </span>
        </div>

        {/* Chart */}
        <MiniCandleChart candles={candles} revealedCount={revealed} />

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setRevealed(r => Math.min(r + 1, candles.length))} disabled={playing} className="border-border">
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPlaying(!playing)} className="border-border">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={newRound} className="border-border">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Prediction Buttons */}
        {!prediction && !showResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">¿Hacia dónde irá el precio?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => makePrediction('buy')} className="h-12 bg-[hsl(var(--bullish))] hover:bg-[hsl(var(--bullish))]/90 text-white font-bold">
                <TrendingUp className="mr-2 h-5 w-5" /> SUBE
              </Button>
              <Button onClick={() => makePrediction('sell')} className="h-12 bg-[hsl(var(--bearish))] hover:bg-[hsl(var(--bearish))]/90 text-white font-bold">
                <TrendingDown className="mr-2 h-5 w-5" /> BAJA
              </Button>
            </div>
          </motion.div>
        )}

        {prediction && !showResult && (
          <div className="text-center space-y-2">
            <Badge className={prediction === 'buy' ? 'bg-[hsl(var(--bullish))]' : 'bg-[hsl(var(--bearish))]'}>
              Predicción: {prediction === 'buy' ? '🟢 SUBE' : '🔴 BAJA'}
            </Badge>
            <p className="text-xs text-muted-foreground">Revelando velas...</p>
            <Button size="sm" variant="outline" onClick={checkResult} className="border-border">
              <Eye className="mr-2 h-4 w-4" /> Ver resultado ahora
            </Button>
          </div>
        )}

        {showResult && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="p-4 bg-card border-border text-center space-y-3">
              <p className="text-2xl">{(() => {
                const entry = candles[9]?.close;
                const exit = candles[candles.length - 1]?.close;
                const won = (prediction === 'buy' && exit > entry) || (prediction === 'sell' && exit < entry);
                return won ? '🎉 ¡Correcto!' : '😔 Incorrecto';
              })()}</p>
              <p className="text-xs text-muted-foreground">
                Precio inicial: {candles[9]?.close.toFixed(5)} → Final: {candles[candles.length - 1]?.close.toFixed(5)}
              </p>
              <Button onClick={newRound} className="bg-primary text-primary-foreground">
                <RotateCcw className="mr-2 h-4 w-4" /> Nueva Ronda
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
