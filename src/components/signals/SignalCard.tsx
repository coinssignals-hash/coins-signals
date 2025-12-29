import { useState } from 'react';
import { TradingSignal } from '@/hooks/useSignals';
import { Copy, TrendingUp, TrendingDown, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SignalCardProps {
  signal: TradingSignal;
  isFavorite?: boolean;
  onToggleFavorite?: (signalId: string) => void;
}

export function SignalCard({ signal, isFavorite = false, onToggleFavorite }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const copyToClipboard = (value: number) => {
    navigator.clipboard.writeText(value.toString());
    toast.success('Precio copiado');
  };

  const isBuy = signal.action === 'BUY';
  const formattedDate = format(new Date(signal.datetime), "dd MMM yyyy HH:mm", { locale: es });

  // Get flag emojis based on currency pair
  const getFlagEmojis = (pair: string) => {
    const flags: Record<string, string> = {
      'EUR': '🇪🇺', 'USD': '🇺🇸', 'GBP': '🇬🇧', 'JPY': '🇯🇵',
      'AUD': '🇦🇺', 'CAD': '🇨🇦', 'CHF': '🇨🇭', 'NZD': '🇳🇿',
      'XAU': '🥇', 'BTC': '₿'
    };
    const [base, quote] = pair.split('/');
    return { flag1: flags[base] || '🏳️', flag2: flags[quote] || '🏳️' };
  };

  const { flag1, flag2 } = getFlagEmojis(signal.currencyPair);

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628] border border-blue-500/30 shadow-lg shadow-blue-500/10">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer relative"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(30, 64, 175, 0.4) 100%)'
        }}
      >
        {/* Favorite Button & Date */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-blue-200/80">
            {formattedDate}
          </div>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(signal.id);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-white/60 hover:text-red-400"
                )}
              />
            </button>
          )}
        </div>

        {/* Main Header Row */}
        <div className="flex items-center justify-between">
          {/* Pair Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="text-2xl">{flag1}</span>
              <span className="text-2xl -ml-1">{flag2}</span>
            </div>
            <span className="text-2xl font-bold text-white">{signal.currencyPair}</span>
          </div>

          {/* Status & Probability */}
          <div className="flex flex-col items-end gap-1">
            <span className={cn(
              "font-semibold text-sm italic",
              signal.status === 'active' ? "text-green-400" : 
              signal.status === 'pending' ? "text-yellow-400" : "text-gray-400"
            )}>
              {signal.status === 'active' ? 'Señal Activa' : 
               signal.status === 'pending' ? 'Pendiente' : 'Completada'}
            </span>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(signal.probability / 100) * 125.6} 125.6`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-400">
                {signal.probability}%
              </span>
            </div>
          </div>
        </div>

        {/* Trend/Action/Session Row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-blue-900/50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-blue-300 uppercase">Tendencia</div>
            <div className={cn(
              "flex items-center justify-center gap-1 font-bold",
              isBuy ? "text-green-400" : "text-red-400"
            )}>
              {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {signal.trend === 'bullish' ? 'Alcista' : 'Bajista'}
            </div>
          </div>
          <div className="bg-blue-900/50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-blue-300 uppercase">Acción</div>
            <div className={cn(
              "font-bold",
              isBuy ? "text-green-400" : "text-red-400"
            )}>
              {signal.action === 'BUY' ? 'Comprar' : 'Vender'}
            </div>
          </div>
          <div className="bg-blue-900/50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-blue-300 uppercase">Sesiones</div>
            <div className="text-blue-100 text-xs">
              {signal.sessionData?.map((s, i) => (
                <div key={i}>{s.session}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Entry Price */}
      <div className="px-4 py-3 bg-[#0a1628]/80 flex items-center justify-between border-t border-blue-500/20">
        <span className="text-blue-200 font-medium">Precio De Entrada.</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">{signal.entryPrice}</span>
          <button onClick={() => copyToClipboard(signal.entryPrice)} className="text-blue-400 hover:text-blue-300">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Show More */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-sm text-blue-400/70 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
      >
        <div className="w-8 h-0.5 bg-blue-500/50 rounded" />
        <span>{expanded ? 'Mostrar menos' : 'Mostrar mas'}</span>
        <div className="w-8 h-0.5 bg-blue-500/50 rounded" />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {/* Take Profit */}
          <PriceRow
            label="Take Profit"
            price={signal.takeProfit}
            onCopy={() => copyToClipboard(signal.takeProfit)}
            color="green"
          />

          {/* Stop Loss */}
          <PriceRow
            label="Stop Loss"
            price={signal.stopLoss}
            onCopy={() => copyToClipboard(signal.stopLoss)}
            color="red"
          />

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Support Chart */}
            <div className="bg-[#0a1628] rounded-lg p-3 border border-blue-500/20">
              <div className="h-16 flex items-end gap-0.5">
                {[40, 55, 45, 60, 50, 65, 55, 70, 60, 75, 65, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-green-500/60" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-green-400 italic text-sm">Soporte</span>
                <span className="text-green-400 font-bold">{signal.support || '-'}</span>
              </div>
            </div>

            {/* Resistance Chart */}
            <div className="bg-[#0a1628] rounded-lg p-3 border border-blue-500/20">
              <div className="h-16 flex items-end gap-0.5">
                {[80, 70, 85, 65, 75, 60, 70, 55, 65, 50, 60, 45].map((h, i) => (
                  <div key={i} className="flex-1 bg-red-500/60" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-red-400 italic text-sm">Resistencia</span>
                <span className="text-red-400 font-bold">{signal.resistance || '-'}</span>
              </div>
            </div>
          </div>

          {/* Gauge and Session Data */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gauge */}
            <div className="bg-[#0a1628] rounded-lg p-3 border border-blue-500/20 flex items-center justify-center">
              <div className="relative w-24 h-14">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="25%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="75%" stopColor="#84cc16" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 45 A 40 40 0 0 1 90 45"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="50"
                    y1="45"
                    x2={50 + 25 * Math.cos((Math.PI * (1 - signal.probability / 100)))}
                    y2={45 - 25 * Math.sin((Math.PI * (1 - signal.probability / 100)))}
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
                <div className="absolute bottom-0 w-full flex justify-between text-[8px] text-muted-foreground px-1">
                  <span>Vender</span>
                  <span>Comprar</span>
                </div>
              </div>
            </div>

            {/* Session Data */}
            <div className="bg-[#0a1628] rounded-lg p-3 border border-blue-500/20">
              <div className="text-[10px] text-blue-300 mb-2">Datos de Sesión</div>
              <div className="space-y-1 text-xs">
                {signal.sessionData?.map((session, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-blue-300">{session.session}</span>
                    <span className="text-blue-100">{session.volume}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Chart */}
          {signal.analysisData && signal.analysisData.length > 0 && (
            <div className="bg-[#0a1628] rounded-lg p-3 border border-blue-500/20">
              <div className="text-[10px] text-blue-300 mb-2">Análisis Técnico</div>
              <div className="flex items-end justify-around h-20 mb-2">
                {signal.analysisData.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div 
                      className="w-8 bg-blue-500 rounded-t"
                      style={{ height: `${item.value}%` }}
                    />
                    <span className="text-[10px] text-center text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg border-2 border-green-400 shadow-lg shadow-green-500/20 transition-all">
              Ejecutar Orden
            </button>
            <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg border-2 border-green-400 shadow-lg shadow-green-500/20 transition-all text-sm">
              Analizar Señal<br />Con AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceRow({ 
  label, 
  price, 
  onCopy, 
  color 
}: { 
  label: string; 
  price: number; 
  onCopy: () => void;
  color: 'green' | 'red';
}) {
  return (
    <div className="bg-[#0a1628] rounded-lg p-3 border border-blue-500/20">
      <div className="flex items-center justify-between">
        <span className={cn(
          "font-medium",
          color === 'green' ? "text-green-400" : "text-red-400"
        )}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{price}</span>
          <button onClick={onCopy} className="text-blue-400 hover:text-blue-300">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}