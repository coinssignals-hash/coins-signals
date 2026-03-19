import { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, X, RotateCcw, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { SignalLevelsOverlay } from './SignalLevelsOverlay';

interface SignalLevels {
  entryPrice: number;
  takeProfit: number;
  takeProfit2?: number;
  stopLoss: number;
  signalDatetime: string;
}

interface SignalChartProps {
  currencyPair: string;
  support?: number;
  resistance?: number;
  signalLevels?: SignalLevels;
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

function buildWidgetUrl(symbol: string, fullscreen: boolean): string {
  const params = new URLSearchParams({
    autosize: '1',
    symbol,
    interval: '15',
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

/** Detect if device is in portrait orientation */
function useOrientation() {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const update = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => {
      setTimeout(update, 150);
    });

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

export function SignalChart({
  currencyPair,
  signalLevels,
  className,
}: SignalChartProps) {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const [forceRotate, setForceRotate] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [levelsMounted, setLevelsMounted] = useState(false);

  const toggleLevels = useCallback(() => {
    if (showLevels) {
      setShowLevels(false); // triggers fade-out, stays mounted
    } else {
      setLevelsMounted(true);
      // RAF to ensure mount before animation
      requestAnimationFrame(() => setShowLevels(true));
    }
  }, [showLevels]);
  const fsRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(currencyPair);
  const isPortrait = useOrientation();

  const shouldRotate = fullscreen && isPortrait && forceRotate;

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
      try {
        (screen.orientation as any)?.lock?.('landscape').catch(() => {});
      } catch {}
      return () => {
        document.body.style.overflow = '';
        try {
          (screen.orientation as any)?.unlock?.();
        } catch {}
      };
    }
  }, [fullscreen]);

  useEffect(() => {
    if (fullscreen && isPortrait) {
      setForceRotate(true);
    }
    if (!fullscreen) {
      setForceRotate(false);
    }
  }, [fullscreen, isPortrait]);

  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
    setForceRotate(false);
  }, []);

  return (
    <>
      {/* Inline chart */}
      <div className={cn('mx-0 sm:mx-1.5 mb-3', className)}>
        <div
          className="relative rounded-none sm:rounded-lg overflow-hidden"
          style={{ background: '#060e1c' }}
        >
          {/* Fullscreen button */}
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-md transition-colors active:scale-95"
            style={{
              background: 'rgba(6,14,28,0.8)',
              border: '1px solid rgba(100,116,139,0.3)',
            }}
            title={t('chart_fullscreen')}
          >
            <Maximize2 className="w-4 h-4 text-cyan-300/70" />
          </button>

          {/* Toggle signal levels */}
          {signalLevels && (
            <button
              onClick={toggleLevels}
              className={cn(
                "absolute top-2 right-12 z-10 p-1.5 rounded-md transition-all active:scale-95",
                showLevels ? "text-cyan-300" : "text-white/40"
              )}
              style={{
                background: showLevels ? 'rgba(0,230,180,0.15)' : 'rgba(6,14,28,0.8)',
                border: `1px solid ${showLevels ? 'rgba(0,230,180,0.4)' : 'rgba(100,116,139,0.3)'}`,
              }}
              title="Signal Levels"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          )}

          {/* Signal levels overlay */}
          {levelsMounted && signalLevels && (
            <SignalLevelsOverlay
              entryPrice={signalLevels.entryPrice}
              takeProfit={signalLevels.takeProfit}
              takeProfit2={signalLevels.takeProfit2}
              stopLoss={signalLevels.stopLoss}
              signalDatetime={signalLevels.signalDatetime}
              visible={showLevels}
              onExited={() => setLevelsMounted(false)}
            />
          )}

          <iframe
            src={buildWidgetUrl(tvSymbol, false)}
            style={{ width: '100%', height: 370, border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          ref={fsRef}
          className="fixed inset-0 z-[9999]"
          style={{ background: '#060e1c' }}
          onClick={(e) => {
            if (e.target === fsRef.current) closeFullscreen();
          }}
        >
          <div
            className="w-full h-full relative"
            style={shouldRotate ? {
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100vh',
              height: '100vw',
              transform: 'translate(-50%, -50%) rotate(90deg)',
              transformOrigin: 'center center',
            } : undefined}
          >
            {/* Controls bar */}
            <div className="absolute top-0 left-0 right-0 z-[10001] flex items-center justify-between px-3 py-2"
              style={{ background: 'linear-gradient(to bottom, rgba(6,14,28,0.9), transparent)' }}
            >
              <span className="text-xs font-mono text-cyan-300/80 tracking-wider">
                {currencyPair}
              </span>

              <div className="flex items-center gap-2">
                {/* Toggle levels in fullscreen */}
                {signalLevels && (
                  <button
                    onClick={toggleLevels}
                    className={cn(
                      "p-1.5 rounded-md transition-all active:scale-90",
                      showLevels ? "text-cyan-300" : "text-white/50"
                    )}
                    style={{
                      background: showLevels ? 'rgba(0,230,180,0.15)' : 'rgba(0,0,0,0.4)',
                      border: `1px solid ${showLevels ? 'rgba(0,230,180,0.3)' : 'rgba(255,255,255,0.2)'}`,
                    }}
                    title="Signal Levels"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                )}

                {/* Rotate toggle */}
                <button
                  onClick={() => setForceRotate(!forceRotate)}
                  className={cn(
                    "p-1.5 rounded-md transition-all active:scale-90",
                    forceRotate ? "text-cyan-300" : "text-white/50"
                  )}
                  style={{
                    background: forceRotate ? 'rgba(0,230,180,0.15)' : 'rgba(0,0,0,0.4)',
                    border: `1px solid ${forceRotate ? 'rgba(0,230,180,0.3)' : 'rgba(255,255,255,0.2)'}`,
                  }}
                  title="Rotar gráfico"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Close */}
                <button
                  onClick={closeFullscreen}
                  className="p-1.5 rounded-md active:scale-90"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Signal levels overlay in fullscreen */}
            {levelsMounted && signalLevels && (
              <SignalLevelsOverlay
                entryPrice={signalLevels.entryPrice}
                takeProfit={signalLevels.takeProfit}
                takeProfit2={signalLevels.takeProfit2}
                stopLoss={signalLevels.stopLoss}
                signalDatetime={signalLevels.signalDatetime}
                visible={showLevels}
                onExited={() => setLevelsMounted(false)}
              />
            )}

            <iframe
              src={buildWidgetUrl(tvSymbol, true)}
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
