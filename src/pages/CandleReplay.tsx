import { useState, useCallback, useRef, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipForward, RotateCcw, TrendingUp, TrendingDown, Eye, Trophy, Target, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const ACCENT = '270 70% 60%'; // purple accent

function MiniCandleChart({ candles, revealedCount }: { candles: Candle[]; revealedCount: number }) {
  const visible = candles.slice(0, revealedCount);
  if (visible.length === 0) return null;

  const allPrices = visible.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 0.001;
  const W = 360;
  const H = 200;
  const candleW = Math.max(2, Math.min(8, (W - 20) / visible.length - 1));

  const toY = (p: number) => H - 10 - ((p - minP) / range) * (H - 20);

  return (
    <div className="relative rounded-xl overflow-hidden" style={{
      border: `1px solid hsl(${ACCENT} / 0.15)`,
      background: `linear-gradient(165deg, hsl(${ACCENT} / 0.04) 0%, hsl(var(--card)) 40%)`,
    }}>
      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{
        background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.5), transparent)`,
      }} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1={10} y1={10 + pct * (H - 20)} x2={W - 10} y2={10 + pct * (H - 20)}
            stroke="hsl(var(--muted-foreground) / 0.08)" strokeWidth={0.5} strokeDasharray="4 4" />
        ))}
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
    </div>
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

  const winRate = rounds > 0 ? (score / rounds * 100).toFixed(0) : '0';

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 pb-24">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: Trophy, label: t('candle_replay_score') || 'Score', value: `${score}/${rounds}`, color: '45 80% 55%' },
            { icon: Target, label: t('candle_replay_winrate') || 'Win Rate', value: `${winRate}%`, color: '140 60% 50%' },
            { icon: Flame, label: t('candle_replay_candle') || 'Vela', value: `${revealed}/${candles.length}`, color: ACCENT },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="relative rounded-xl overflow-hidden p-2.5 text-center"
              style={{
                background: `linear-gradient(165deg, hsl(${color} / 0.1) 0%, hsl(var(--card)) 60%)`,
                border: `1px solid hsl(${color} / 0.2)`,
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[1px]" style={{
                background: `linear-gradient(90deg, transparent, hsl(${color} / 0.5), transparent)`,
              }} />
              <Icon className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: `hsl(${color})` }} />
              <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <MiniCandleChart candles={candles} revealedCount={revealed} />

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {[
            { icon: SkipForward, onClick: () => setRevealed(r => Math.min(r + 1, candles.length)), disabled: playing },
            { icon: playing ? Pause : Play, onClick: () => setPlaying(!playing), disabled: false },
            { icon: RotateCcw, onClick: newRound, disabled: false },
          ].map(({ icon: Icon, onClick, disabled }, i) => (
            <button
              key={i}
              onClick={onClick}
              disabled={disabled}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: `hsl(${ACCENT} / 0.08)`,
                border: `1px solid hsl(${ACCENT} / 0.2)`,
                color: `hsl(${ACCENT})`,
              }}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Prediction Buttons */}
        <AnimatePresence mode="wait">
          {!prediction && !showResult && (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 space-y-2"
            >
              <p className="text-center text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {t('candle_replay_question') || '¿Hacia dónde irá el precio?'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => makePrediction('buy')}
                  className="h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--bullish) / 0.15), hsl(var(--bullish) / 0.05))',
                    border: '1px solid hsl(var(--bullish) / 0.3)',
                    color: 'hsl(var(--bullish))',
                    boxShadow: '0 4px 12px hsl(var(--bullish) / 0.1)',
                  }}
                >
                  <TrendingUp className="w-5 h-5" /> SUBE
                </button>
                <button
                  onClick={() => makePrediction('sell')}
                  className="h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--bearish) / 0.15), hsl(var(--bearish) / 0.05))',
                    border: '1px solid hsl(var(--bearish) / 0.3)',
                    color: 'hsl(var(--bearish))',
                    boxShadow: '0 4px 12px hsl(var(--bearish) / 0.1)',
                  }}
                >
                  <TrendingDown className="w-5 h-5" /> BAJA
                </button>
              </div>
            </motion.div>
          )}

          {prediction && !showResult && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center space-y-2"
            >
              <Badge
                className="text-xs px-3 py-1"
                style={{
                  background: prediction === 'buy' ? 'hsl(var(--bullish) / 0.15)' : 'hsl(var(--bearish) / 0.15)',
                  color: prediction === 'buy' ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))',
                  border: `1px solid ${prediction === 'buy' ? 'hsl(var(--bullish) / 0.3)' : 'hsl(var(--bearish) / 0.3)'}`,
                }}
              >
                {prediction === 'buy' ? '🟢 SUBE' : '🔴 BAJA'}
              </Badge>
              <p className="text-[11px] text-muted-foreground">{t('candle_replay_revealing') || 'Revelando velas...'}</p>
              <button
                onClick={checkResult}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{
                  background: `hsl(${ACCENT} / 0.08)`,
                  border: `1px solid hsl(${ACCENT} / 0.2)`,
                  color: `hsl(${ACCENT})`,
                }}
              >
                <Eye className="w-3.5 h-3.5" /> {t('candle_replay_see_result') || 'Ver resultado ahora'}
              </button>
            </motion.div>
          )}

          {showResult && (
            <motion.div
              key="result"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              {(() => {
                const entry = candles[9]?.close;
                const exit = candles[candles.length - 1]?.close;
                const won = (prediction === 'buy' && exit > entry) || (prediction === 'sell' && exit < entry);
                const resultColor = won ? '140 60% 50%' : '0 70% 55%';
                return (
                  <div
                    className="relative rounded-xl overflow-hidden p-5 text-center space-y-3"
                    style={{
                      background: `linear-gradient(165deg, hsl(${resultColor} / 0.1) 0%, hsl(var(--card)) 50%)`,
                      border: `1px solid hsl(${resultColor} / 0.25)`,
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                      background: `linear-gradient(90deg, transparent, hsl(${resultColor} / 0.6), transparent)`,
                    }} />
                    <p className="text-2xl">{won ? '🎉' : '😔'}</p>
                    <p className="text-lg font-bold text-foreground">
                      {won ? (t('candle_replay_correct') || '¡Correcto!') : (t('candle_replay_incorrect') || 'Incorrecto')}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      {entry?.toFixed(5)} → {exit?.toFixed(5)}
                    </p>
                    <button
                      onClick={newRound}
                      className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.08))`,
                        border: `1px solid hsl(${ACCENT} / 0.3)`,
                        color: `hsl(${ACCENT})`,
                        boxShadow: `0 4px 12px hsl(${ACCENT} / 0.15)`,
                      }}
                    >
                      <RotateCcw className="w-4 h-4" /> {t('candle_replay_new_round') || 'Nueva Ronda'}
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageShell>
  );
}
