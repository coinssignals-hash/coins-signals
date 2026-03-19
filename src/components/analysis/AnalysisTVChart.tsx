import { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface AnalysisTVChartProps {
  symbol: string;
  timeframe?: string;
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

export function AnalysisTVChart({ symbol, timeframe = '1h', className }: AnalysisTVChartProps) {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const [forceRotate, setForceRotate] = useState(false);
  const fsRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(symbol);
  const tvInterval = mapTimeframe(timeframe);
  const isPortrait = useOrientation();
  const shouldRotate = fullscreen && isPortrait && forceRotate;

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
            <button
              onClick={() => setFullscreen(true)}
              className="p-2 rounded-lg backdrop-blur-md bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10 shadow-lg shadow-black/20 transition-all duration-200 active:scale-90"
              title={t('chart_fullscreen')}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
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
