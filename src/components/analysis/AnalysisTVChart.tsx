import { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, X, Smartphone, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface AnalysisTVChartProps {
  symbol: string;
  timeframe?: string;
  support?: number;
  resistance?: number;
  className?: string;
}

function toTradingViewSymbol(pair: string): string {
  const clean = pair.replace('/', '').toUpperCase();
  const cryptos = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'LTC', 'BNB', 'AVAX', 'DOT'];
  for (const c of cryptos) {
    if (clean.startsWith(c)) return `BINANCE:${clean}`;
  }
  if (clean === 'XAUUSD') return 'TVC:GOLD';
  if (clean === 'XAGUSD') return 'TVC:SILVER';
  if (clean === 'WTIUSD' || clean === 'USOIL') return 'TVC:USOIL';
  if (clean === 'US30') return 'TVC:DJI';
  if (clean === 'US500' || clean === 'SPX500') return 'SP:SPX';
  if (clean === 'NAS100' || clean === 'USTEC') return 'NASDAQ:NDX';
  return `FX:${clean}`;
}

function mapTimeframe(tf: string): string {
  const map: Record<string, string> = {
    '5min': '5', '15min': '15', '30min': '30',
    '1h': '60', '4h': '240', '1day': 'D', '1week': 'W',
  };
  return map[tf] || '60';
}

function buildWidgetUrl(symbol: string, interval: string, fullscreen: boolean): string {
  const params = new URLSearchParams({
    autosize: '1',
    symbol,
    interval,
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'es',
    hide_top_toolbar: fullscreen ? '0' : '1',
    hide_legend: fullscreen ? '0' : '1',
    hide_side_toolbar: '1',
    allow_symbol_change: fullscreen ? '1' : '0',
    save_image: '0',
    withdateranges: fullscreen ? '1' : '0',
    details: '0',
    hotlist: '0',
    calendar: '0',
    backgroundColor: 'rgba(6, 14, 28, 1)',
    gridColor: 'rgba(21, 42, 71, 1)',
  });
  return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
}

function useOrientation() {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const update = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => setTimeout(update, 150));
    const mql = window.matchMedia?.('(orientation: portrait)');
    mql?.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      mql?.removeEventListener?.('change', update);
    };
  }, []);

  return isPortrait;
}

function isJpy(s: number, r: number) { return s > 10 || r > 10; }
function fmtP(n: number, jpy: boolean) { return jpy ? n.toFixed(3) : n.toFixed(5); }

/** Overlay that draws S/R lines on top of the TradingView iframe */
function SROverlay({ support, resistance, visible }: { support: number; resistance: number; visible: boolean }) {
  if (!visible) return null;

  const jpy = isJpy(support, resistance);
  // We estimate vertical positioning based on price range
  // Since we can't read TradingView's axis, we use a fixed layout approach
  // Resistance at ~25% from top, Support at ~75% from top (approximation)

  return (
    <div className="absolute inset-0 pointer-events-none z-[5]" style={{ top: 0, bottom: 0 }}>
      {/* Resistance line (green) */}
      <div className="absolute left-0 right-0" style={{ top: '22%' }}>
        <div className="w-full border-t-2 border-dashed border-emerald-400/70" />
        <div className="absolute right-2 -top-3 flex items-center gap-1">
          <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/40 px-2 py-0.5 rounded-md shadow-lg shadow-emerald-500/10">
            R {fmtP(resistance, jpy)}
          </span>
        </div>
      </div>

      {/* Support line (red) */}
      <div className="absolute left-0 right-0" style={{ top: '78%' }}>
        <div className="w-full border-t-2 border-dashed border-red-400/70" />
        <div className="absolute right-2 -top-3 flex items-center gap-1">
          <span className="text-[9px] font-mono font-bold text-red-300 bg-red-500/20 backdrop-blur-sm border border-red-400/40 px-2 py-0.5 rounded-md shadow-lg shadow-red-500/10">
            S {fmtP(support, jpy)}
          </span>
        </div>
      </div>

      {/* Subtle zone shading */}
      <div className="absolute left-0 right-0" style={{ top: 0, height: '22%' }}>
        <div className="w-full h-full bg-gradient-to-b from-emerald-500/[0.03] to-transparent" />
      </div>
      <div className="absolute left-0 right-0" style={{ top: '78%', bottom: 0 }}>
        <div className="w-full h-full bg-gradient-to-t from-red-500/[0.03] to-transparent" />
      </div>
    </div>
  );
}

export function AnalysisTVChart({ symbol, timeframe = '1h', support, resistance, className }: AnalysisTVChartProps) {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const [forceRotate, setForceRotate] = useState(false);
  const [showSR, setShowSR] = useState(false);
  const fsRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(symbol);
  const tvInterval = mapTimeframe(timeframe);
  const isPortrait = useOrientation();
  const shouldRotate = fullscreen && isPortrait && forceRotate;
  const hasSR = support != null && resistance != null;

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
      try { (screen.orientation as any)?.lock?.('landscape').catch(() => {}); } catch {}
      return () => {
        document.body.style.overflow = '';
        try { (screen.orientation as any)?.unlock?.(); } catch {}
      };
    }
  }, [fullscreen]);

  useEffect(() => {
    if (fullscreen && isPortrait) setForceRotate(true);
    if (!fullscreen) setForceRotate(false);
  }, [fullscreen, isPortrait]);

  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
    setForceRotate(false);
  }, []);

  return (
    <>
      <div className={cn('mb-1', className)}>
        <div className="relative overflow-hidden" style={{ background: '#060e1c' }}>
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            {/* S/R toggle button */}
            {hasSR && (
              <button
                onClick={() => setShowSR(!showSR)}
                className={cn(
                  "p-2 rounded-lg backdrop-blur-md transition-all duration-200 active:scale-90 shadow-lg shadow-black/20",
                  showSR
                    ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-300"
                    : "bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10"
                )}
                title="Soporte / Resistencia"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setFullscreen(true)}
              className="p-2 rounded-lg backdrop-blur-md bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10 shadow-lg shadow-black/20 transition-all duration-200 active:scale-90"
              title={t('chart_fullscreen')}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {hasSR && <SROverlay support={support!} resistance={resistance!} visible={showSR} />}

          <iframe
            src={buildWidgetUrl(tvSymbol, tvInterval, false)}
            style={{ width: '100%', height: 370, border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
        </div>
      </div>

      {fullscreen && (
        <div
          ref={fsRef}
          className="fixed inset-0 z-[9999]"
          style={{ background: '#060e1c' }}
          onClick={(e) => { if (e.target === fsRef.current) closeFullscreen(); }}
        >
          <div
            className="w-full h-full relative"
            style={shouldRotate ? {
              position: 'absolute', top: '50%', left: '50%',
              width: '100vh', height: '100vw',
              transform: 'translate(-50%, -50%) rotate(90deg)',
              transformOrigin: 'center center',
            } : undefined}
          >
            <div className="absolute top-0 left-0 right-0 z-[10001] flex items-center justify-between px-3 py-2"
              style={{ background: 'linear-gradient(to bottom, rgba(6,14,28,0.9), transparent)' }}
            >
              <span className="text-xs font-mono text-cyan-300/80 tracking-wider">{symbol}</span>
              <div className="flex items-center gap-1.5">
                {hasSR && (
                  <button
                    onClick={() => setShowSR(!showSR)}
                    className={cn(
                      "p-2 rounded-lg backdrop-blur-md transition-all duration-200 active:scale-90 shadow-lg shadow-black/30",
                      showSR
                        ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-300"
                        : "bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10"
                    )}
                    title="Soporte / Resistencia"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setForceRotate(!forceRotate)}
                  className={cn(
                    "p-2 rounded-lg backdrop-blur-md transition-all duration-200 active:scale-90 shadow-lg shadow-black/30",
                    forceRotate
                      ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-300"
                      : "bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10"
                  )}
                  title="Rotar gráfico"
                >
                  <Smartphone className={cn("w-4 h-4 transition-transform duration-300", forceRotate ? "rotate-90" : "")} />
                </button>
                <button
                  onClick={closeFullscreen}
                  className="p-2 rounded-lg backdrop-blur-md bg-red-500/10 border border-red-400/30 text-red-300/80 hover:bg-red-500/20 hover:text-red-300 shadow-lg shadow-black/30 transition-all duration-200 active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {hasSR && <SROverlay support={support!} resistance={resistance!} visible={showSR} />}

            <iframe
              src={buildWidgetUrl(tvSymbol, tvInterval, true)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      )}
    </>
  );
}
