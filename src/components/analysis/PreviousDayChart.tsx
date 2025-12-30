import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { usePreviousDay } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';

interface PreviousDayChartProps {
  symbol: string;
  currentPrice: number;
}

export function PreviousDayChart({ symbol, currentPrice }: PreviousDayChartProps) {
  const { data, isLoading, error } = usePreviousDay(symbol, currentPrice);

  if (isLoading) {
    return (
      <div className="bg-[#0a1a0a] rounded-xl border-2 border-green-500/30 p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
          <span className="ml-2 text-gray-400 text-sm">Cargando datos...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <AnalysisError 
        title="Datos del Día Anterior"
        error={error as Error}
        compact
      />
    );
  }

  const isPositive = data.changePercent >= 0;
  const range = data.high - data.low;
  const closePosition = range > 0 ? ((data.close - data.low) / range) * 100 : 50;
  const openPosition = range > 0 ? ((data.open - data.low) / range) * 100 : 50;

  return (
    <div className="bg-[#0a1a0a] rounded-xl border-2 border-green-500/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Resistencia y Soporte Día Anterior</h3>
        <span className="text-gray-400 text-xs">{data.date}</span>
      </div>
      
      {/* Price Range Visualization */}
      <div className="relative h-32 bg-[#0d1f0d] rounded-lg p-4">
        {/* High Line */}
        <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-4">
          <span className="text-red-400 text-xs font-semibold">Resistencia (High)</span>
          <span className="text-red-400 text-xs font-mono">{data.high.toFixed(4)}</span>
        </div>
        
        {/* Chart Area */}
        <div className="absolute top-8 bottom-8 left-4 right-4">
          {/* Vertical Range Bar */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-12 bg-gradient-to-b from-red-500/30 via-gray-600/30 to-green-500/30 rounded-lg">
            {/* Close Position Marker */}
            <div 
              className="absolute left-0 right-0 h-1 bg-white rounded"
              style={{ bottom: `${closePosition}%` }}
            >
              <span className="absolute -right-16 -top-2 text-white text-xs font-mono whitespace-nowrap">
                C: {data.close.toFixed(4)}
              </span>
            </div>
            
            {/* Open Position Marker */}
            <div 
              className="absolute left-0 right-0 h-0.5 bg-yellow-400 rounded"
              style={{ bottom: `${openPosition}%` }}
            >
              <span className="absolute -left-16 -top-2 text-yellow-400 text-xs font-mono whitespace-nowrap">
                O: {data.open.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Low Line */}
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-4">
          <span className="text-green-400 text-xs font-semibold">Soporte (Low)</span>
          <span className="text-green-400 text-xs font-mono">{data.low.toFixed(4)}</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-[#0d1f0d] rounded p-2">
          <p className="text-gray-400">Apertura</p>
          <p className="text-white font-mono">{data.open.toFixed(4)}</p>
        </div>
        <div className="bg-[#0d1f0d] rounded p-2">
          <p className="text-gray-400">Cierre</p>
          <p className="text-white font-mono">{data.close.toFixed(4)}</p>
        </div>
        <div className="bg-[#0d1f0d] rounded p-2">
          <p className="text-gray-400">Rango</p>
          <p className="text-white font-mono">{(range * 10000).toFixed(0)} pips</p>
        </div>
        <div className="bg-[#0d1f0d] rounded p-2">
          <p className="text-gray-400">Cambio</p>
          <p className={`font-mono flex items-center justify-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {data.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
