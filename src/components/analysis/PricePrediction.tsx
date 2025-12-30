import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PricePredictionProps {
  symbol: string;
  currentPrice: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  changePercent: number;
  pips: number;
  high: number;
  low: number;
  bullishPercent: number;
  bearishPercent: number;
  targetPrice: number;
  loading?: boolean;
}

export function PricePrediction({
  symbol,
  currentPrice,
  trend,
  changePercent,
  pips,
  high,
  low,
  bullishPercent,
  bearishPercent,
  targetPrice,
  loading
}: PricePredictionProps) {
  const today = new Date();
  const dateStr = format(today, "d 'de' MMMM 'de' yyyy", { locale: es });

  const trendText = trend === 'bullish' ? 'Tendencia Alcista' : trend === 'bearish' ? 'Tendencia Bajista' : 'Tendencia Neutral';
  const trendColor = trend === 'bullish' ? 'text-green-400' : trend === 'bearish' ? 'text-red-400' : 'text-yellow-400';
  const sentimentText = trend === 'bullish' ? 'alcista' : trend === 'bearish' ? 'bajista' : 'mixto';

  if (loading) {
    return (
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 animate-pulse">
        <div className="h-40 bg-green-900/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-white font-semibold flex items-center gap-2">
          Predicción Del Precio
          <span className="text-gray-500">{'·'.repeat(30)}</span>
        </h3>
        <span className="text-green-400 text-2xl font-bold font-mono">{currentPrice.toFixed(4)}</span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <h4 className="text-white font-semibold mb-1">Síntesis del Día</h4>
          <p className="text-gray-300 leading-relaxed">
            El par <span className="text-green-400 underline">{symbol}</span> mostró una{' '}
            <span className={trendColor}>{trendText}</span> el {dateStr}, cerrando en{' '}
            <span className="text-white">{currentPrice.toFixed(4)}</span> con una variación de{' '}
            <span className={changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </span>{' '}
            ({Math.abs(pips)} pips). El rango de operación fue de {Math.abs(pips).toFixed(4)} puntos, 
            con un máximo de <span className="text-white">{high.toFixed(4)}</span> y un mínimo de{' '}
            <span className="text-white">{low.toFixed(4)}</span>.
          </p>
        </div>

        <p className="text-gray-300 leading-relaxed">
          El sentimiento del mercado está <span className="text-yellow-400">MIXTO</span> con sesgo ligeramente {sentimentText}{' '}
          para {symbol.split('/')[0]} a corto-medio plazo, con{' '}
          <span className="text-green-400">{bullishPercent}%</span> de posiciones alcistas y{' '}
          <span className="text-red-400">{bearishPercent}%</span> de posiciones bajistas. 
          Los analistas proyectan un objetivo de medio plazo en <span className="text-white">{targetPrice.toFixed(4)}</span>.
        </p>
      </div>
    </div>
  );
}
