import { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

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

/** Map our currency pair format to TradingView symbol */
function toTradingViewSymbol(pair: string): string {
  const clean = pair.replace('/', '').toUpperCase();
  // Crypto pairs
  const cryptos = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'LTC', 'BNB', 'AVAX', 'DOT'];
  for (const c of cryptos) {
    if (clean.startsWith(c)) return `BINANCE:${clean}`;
  }
  // Commodities
  if (clean === 'XAUUSD') return 'TVC:GOLD';
  if (clean === 'XAGUSD') return 'TVC:SILVER';
  if (clean === 'WTIUSD' || clean === 'USOIL') return 'TVC:USOIL';
  // Indices
  if (clean === 'US30') return 'TVC:DJI';
  if (clean === 'US500' || clean === 'SPX500') return 'SP:SPX';
  if (clean === 'NAS100' || clean === 'USTEC') return 'NASDAQ:NDX';
  // Forex
  return `FX:${clean}`;
}

function TradingViewWidget({
  symbol,
  height = 300,
  fullscreen = false,
}: {
  symbol: string;
  height?: number;
  fullscreen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    setLoading(true);

    const widgetConfig = {
      autosize: true,
      symbol,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'es',
      toolbar_bg: '#060e1c',
      hide_top_toolbar: !fullscreen,
      hide_legend: !fullscreen,
      hide_side_toolbar: !fullscreen,
      allow_symbol_change: fullscreen,
      save_image: false,
      withdateranges: fullscreen,
      details: false,
      hotlist: false,
      calendar: false,
      studies: fullscreen ? ['MACD@tv-basicstudies'] : [],
      backgroundColor: '#060e1c',
      gridColor: '#152a47',
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify(widgetConfig);
    script.onload = () => setLoading(false);
    script.onerror = () => setLoading(false);

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    wrapper.appendChild(widgetDiv);
    wrapper.appendChild(script);
    container.appendChild(wrapper);

    // Fallback timeout for loading state
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      clearTimeout(timeout);
      container.innerHTML = '';
    };
  }, [symbol, fullscreen]);

  return (
    <div
      ref={containerRef}
      style={{ height: fullscreen ? '100%' : height, width: '100%', position: 'relative' }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#060e1c' }}>
          <Skeleton className="w-full h-full" style={{ background: 'rgba(21,42,71,0.3)' }} />
        </div>
      )}
    </div>
  );
}

export function SignalChart({
  currencyPair,
  support,
  resistance,
  signalLevels,
  className,
}: SignalChartProps) {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const fsRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(currencyPair);

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [fullscreen]);

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

          <TradingViewWidget symbol={tvSymbol} height={280} />
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          ref={fsRef}
          className="fixed inset-0 z-[9999] bg-black"
          onClick={(e) => {
            if (e.target === fsRef.current) setFullscreen(false);
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-3 right-3 z-[10001] p-2 rounded-full active:scale-90"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <TradingViewWidget symbol={tvSymbol} fullscreen />
        </div>
      )}
    </>
  );
}
