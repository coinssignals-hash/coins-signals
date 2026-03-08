import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface RiskRewardCalculatorProps {
  currentPrice: number;
  symbol: string;
  resistance?: number;
  support?: number;
}

export function RiskRewardCalculator({ currentPrice, symbol, resistance, support }: RiskRewardCalculatorProps) {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState(currentPrice.toFixed(5));
  const [stopLoss, setStopLoss] = useState((support || currentPrice * 0.995).toFixed(5));
  const [takeProfit, setTakeProfit] = useState((resistance || currentPrice * 1.005).toFixed(5));
  const [lotSize, setLotSize] = useState('0.01');

  const calc = useMemo(() => {
    const e = parseFloat(entry) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const lots = parseFloat(lotSize) || 0;

    const riskPips = Math.abs(e - sl) * 10000;
    const rewardPips = Math.abs(tp - e) * 10000;
    const ratio = riskPips > 0 ? rewardPips / riskPips : 0;

    // Approximate P&L (standard lot = 100k units, 1 pip ≈ $10 for majors)
    const pipValue = lots * 10; // simplified for majors
    const potentialLoss = riskPips * pipValue;
    const potentialProfit = rewardPips * pipValue;

    return { riskPips, rewardPips, ratio, potentialLoss, potentialProfit, pipValue };
  }, [entry, stopLoss, takeProfit, lotSize]);

  const ratioColor = calc.ratio >= 2 ? 'text-green-400' : calc.ratio >= 1 ? 'text-yellow-400' : 'text-red-400';
  const ratioLabel = calc.ratio >= 3 ? 'Excelente' : calc.ratio >= 2 ? 'Bueno' : calc.ratio >= 1 ? 'Aceptable' : 'Desfavorable';

  return (
    <div className="bg-[#0a1628] border border-amber-900/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-semibold text-sm">Calculadora R:R</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setDirection('long')}
            className={cn(
              "px-3 py-1 rounded text-[10px] font-bold transition-all",
              direction === 'long'
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />LONG
          </button>
          <button
            onClick={() => setDirection('short')}
            className={cn(
              "px-3 py-1 rounded text-[10px] font-bold transition-all",
              direction === 'short'
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            <TrendingDown className="w-3 h-3 inline mr-1" />SHORT
          </button>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Entrada', value: entry, onChange: setEntry, color: 'border-cyan-500/30' },
          { label: 'Stop Loss', value: stopLoss, onChange: setStopLoss, color: 'border-red-500/30' },
          { label: 'Take Profit', value: takeProfit, onChange: setTakeProfit, color: 'border-green-500/30' },
          { label: 'Lotes', value: lotSize, onChange: setLotSize, color: 'border-amber-500/30' },
        ].map(field => (
          <div key={field.label}>
            <label className="text-[9px] text-gray-500 uppercase tracking-wider">{field.label}</label>
            <input
              type="text"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className={cn(
                "w-full bg-[#0d1829] border rounded px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50",
                field.color
              )}
            />
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-500 uppercase">Riesgo</div>
          <div className="text-red-400 font-mono font-bold text-sm">{calc.riskPips.toFixed(2)}p</div>
          <div className="text-red-400/70 text-[10px] font-mono">-${calc.potentialLoss.toFixed(2)}</div>
        </div>
        <div className={cn("border rounded-lg p-2 text-center", calc.ratio >= 2 ? "bg-green-500/10 border-green-500/20" : calc.ratio >= 1 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20")}>
          <div className="text-[9px] text-gray-500 uppercase">Ratio R:R</div>
          <div className={cn("font-bold text-lg tabular-nums", ratioColor)}>
            1:{calc.ratio.toFixed(2)}
          </div>
          <div className={cn("text-[10px] font-medium", ratioColor)}>{ratioLabel}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
          <div className="text-[9px] text-gray-500 uppercase">Beneficio</div>
          <div className="text-green-400 font-mono font-bold text-sm">{calc.rewardPips.toFixed(2)}p</div>
          <div className="text-green-400/70 text-[10px] font-mono">+${calc.potentialProfit.toFixed(2)}</div>
        </div>
      </div>

      {/* Visual R:R bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-gray-500">
          <span>SL: {stopLoss}</span>
          <span>Entrada: {entry}</span>
          <span>TP: {takeProfit}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-red-600 to-red-400 rounded-l-full transition-all"
            style={{ width: `${(calc.riskPips / (calc.riskPips + calc.rewardPips || 1)) * 100}%` }}
          />
          <div className="w-0.5 bg-white/50" />
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 rounded-r-full transition-all flex-1"
          />
        </div>
      </div>

      {calc.ratio < 1 && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Ratio desfavorable. Considera ajustar SL/TP para un ratio mínimo de 1:2.</span>
        </div>
      )}
    </div>
  );
}
