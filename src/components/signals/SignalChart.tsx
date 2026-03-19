import { useState, useRef, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

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
    hide_side_toolbar: fullscreen ? '0' : '1',
    allow_symbol_change: fullscreen ? '1' : '0',
    save_image: '0',
    withdateranges: fullscreen ? '1' : '0',
    details: '0',
    hotlist: '0',
    calendar: '0',
    backgroundColor: 'rgba(6, 14, 28, 1)',
    gridColor: 'rgba(21, 42, 71, 1)',
  });
  if (fullscreen) {
    params.set('studies', 'MACD@tv-basicstudies');
  }
  return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
}

export function SignalChart({
  currencyPair,
  className,
}: SignalChartProps) {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const fsRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(currencyPair);

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [fullscreen]);

  return (
    <>
      <div className={cn('mx-0 sm:mx-1.5 mb-3', className)}>
        <div
          className="relative rounded-none sm:rounded-lg overflow-hidden"
          style={{ background: '#060e1c' }}
        >
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

          <iframe
            src={buildWidgetUrl(tvSymbol, false)}
            style={{ width: '100%', height: 280, border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
        </div>
      </div>

      {fullscreen && (
        <div
          ref={fsRef}
          className="fixed inset-0 z-[9999] bg-black"
          onClick={(e) => {
            if (e.target === fsRef.current) setFullscreen(false);
          }}
        >
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

          <iframe
            src={buildWidgetUrl(tvSymbol, true)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      )}
    </>
  );
}
