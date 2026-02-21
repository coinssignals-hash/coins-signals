import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignalDetailView } from './SignalDetailView';

export interface SignalData {
  id: string;
  time: string;
  action: string;
  currencyPair: string;
  pips: number;
  percentage: number;
  isSuccessful: boolean;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  signalTime: string;
  endTime: string;
  executionTime: string;
  totalOperationTime: string;
}

interface SignalsListProps {
  signals: SignalData[];
}

const flagMap: Record<string, string> = {
  'EUR': '🇪🇺',
  'USD': '🇺🇸',
  'GBP': '🇬🇧',
  'JPY': '🇯🇵',
  'AUD': '🇦🇺',
  'CAD': '🇨🇦',
  'CHF': '🇨🇭',
  'NZD': '🇳🇿',
};

function getCurrencyFlags(pair: string) {
  const currencies = pair.split(' ');
  return currencies.map(c => flagMap[c] || '🏳️').join(' ');
}

export function SignalsList({ signals }: SignalsListProps) {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  return (
    <div className="space-y-2 mb-4">
      {signals.map((signal) => (
        <div key={signal.id}>
          <button
            onClick={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
            className={cn(
              'w-full bg-card border border-border rounded-lg p-3 transition-colors hover:bg-secondary/30',
              expandedSignal === signal.id && 'bg-secondary/30 border-primary/50'
            )}
          >
            <div className="flex items-center justify-between">
              {/* Time & Flag */}
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">{signal.time}</div>
                  <div className="text-xs text-primary"># 18</div>
                </div>
                <div className="text-2xl">{getCurrencyFlags(signal.currencyPair)}</div>
              </div>

              {/* Action & Currency */}
              <div className="flex flex-col items-start">
                <span className={cn(
                  'text-sm font-bold',
                  signal.action === 'Comprar' ? 'text-green-500' : 'text-red-500'
                )}>
                  {signal.action}
                </span>
                <span className="text-xs text-foreground">{signal.currencyPair}</span>
              </div>

              {/* Pips */}
              <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Porcentaje</span>
                <span className={cn(
                  'text-sm font-bold font-mono-numbers',
                  signal.pips >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {signal.pips >= 0 ? '+' : ''}{signal.pips} Pips ({signal.percentage.toFixed(2)}%)
                </span>
              </div>

              {/* Percentage Circle */}
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={signal.isSuccessful ? '#22c55e' : '#ef4444'}
                      strokeWidth="4"
                      strokeDasharray={`${(signal.percentage / 100) * 125.6} 125.6`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(
                      'text-xs font-bold',
                      signal.isSuccessful ? 'text-green-500' : 'text-red-500'
                    )}>
                      {signal.percentage}%
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">Porcentaje</span>
                  <span className={cn(
                    'text-[10px]',
                    signal.isSuccessful ? 'text-green-500' : 'text-red-500'
                  )}>
                    {signal.isSuccessful ? 'Alcanzado' : 'Fallido'}
                  </span>
                  {signal.isSuccessful ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Expanded Signal Detail */}
          {expandedSignal === signal.id && (
            <SignalDetailView signal={signal} />
          )}
        </div>
      ))}
    </div>
  );
}
