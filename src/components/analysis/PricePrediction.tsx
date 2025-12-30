import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePricePrediction } from '@/hooks/useAnalysisData';

interface PricePredictionProps {
  symbol: string;
  currentPrice: number;
}

export function PricePrediction({ symbol, currentPrice }: PricePredictionProps) {
  const { data, isLoading, error } = usePricePrediction(symbol, currentPrice);

  const today = new Date();
  const dateStr = format(today, "d 'de' MMMM 'de' yyyy", { locale: es });

  if (isLoading) {
    return (
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
          <span className="ml-2 text-gray-400">Cargando predicción...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
        <p className="text-red-400 text-sm">Error al cargar la predicción del precio</p>
      </div>
    );
  }

  const trendIcon = data.direction === 'up' ? <TrendingUp className="w-5 h-5" /> :
                    data.direction === 'down' ? <TrendingDown className="w-5 h-5" /> :
                    <Minus className="w-5 h-5" />;
  
  const trendColor = data.direction === 'up' ? 'text-green-400' : 
                     data.direction === 'down' ? 'text-red-400' : 'text-yellow-400';
  
  const trendText = data.direction === 'up' ? 'Tendencia Alcista' : 
                    data.direction === 'down' ? 'Tendencia Bajista' : 'Tendencia Lateral';

  return (
    <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-white font-semibold flex items-center gap-2">
          Predicción Del Precio
          <span className="text-gray-500">{'·'.repeat(20)}</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 ${trendColor}`}>
            {trendIcon}
          </span>
          <span className="text-green-400 text-2xl font-bold font-mono">{data.currentPrice.toFixed(4)}</span>
        </div>
      </div>

      {/* Predicted range */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-[#0d1f0d] rounded-lg">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Mínimo Esperado</p>
          <p className="text-red-400 font-mono font-semibold">{data.predictedLow.toFixed(4)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Cierre Esperado</p>
          <p className="text-white font-mono font-semibold">{data.predictedClose.toFixed(4)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Máximo Esperado</p>
          <p className="text-green-400 font-mono font-semibold">{data.predictedHigh.toFixed(4)}</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Confianza de la predicción</span>
          <span className={`font-semibold ${
            data.confidence >= 70 ? 'text-green-400' : 
            data.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>{data.confidence}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              data.confidence >= 70 ? 'bg-green-500' : 
              data.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${data.confidence}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <h4 className="text-white font-semibold mb-1">Síntesis del Día</h4>
          <p className="text-gray-300 leading-relaxed">
            El par <span className="text-green-400 underline">{data.symbol}</span> muestra una{' '}
            <span className={trendColor}>{trendText}</span> el {dateStr}. {data.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Timeframe: {data.timeframe}</span>
          <span>•</span>
          <span>Última actualización: {format(new Date(), 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
