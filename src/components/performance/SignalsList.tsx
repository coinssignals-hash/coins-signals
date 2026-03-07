import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { SignalDetailView } from './SignalDetailView';
import { motion, AnimatePresence } from 'framer-motion';

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
  'EUR': '🇪🇺', 'USD': '🇺🇸', 'GBP': '🇬🇧', 'JPY': '🇯🇵',
  'AUD': '🇦🇺', 'CAD': '🇨🇦', 'CHF': '🇨🇭', 'NZD': '🇳🇿',
};

function getCurrencyFlags(pair: string) {
  return pair.split(' ').map(c => flagMap[c] || '🏳️').join(' ');
}

export function SignalsList({ signals }: SignalsListProps) {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {signals.map((signal, i) => (
        <motion.div 
          key={signal.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card 
            className={cn(
              'bg-card border-border cursor-pointer transition-all duration-200',
              expandedSignal === signal.id && 'ring-1 ring-primary/30'
            )}
            onClick={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                {/* Left: Flag + Pair */}
                <div className="flex items-center gap-2">
                  <div className="text-xl">{getCurrencyFlags(signal.currencyPair)}</div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{signal.currencyPair}</div>
                    <div className={cn(
                      'text-[10px] font-bold',
                      signal.action === 'BUY' || signal.action === 'Comprar' ? 'text-emerald-400' : 'text-rose-400'
                    )}>
                      {signal.action}
                    </div>
                  </div>
                </div>

                {/* Center: Pips */}
                <div className="text-center">
                  <div className={cn(
                    'text-sm font-bold tabular-nums',
                    signal.pips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {signal.pips >= 0 ? '+' : ''}{signal.pips}p
                  </div>
                  <div className="text-[10px] text-muted-foreground">{signal.time}</div>
                </div>

                {/* Right: Status */}
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--muted)/0.3)" strokeWidth="3" />
                      <circle
                        cx="20" cy="20" r="16" fill="none"
                        stroke={signal.isSuccessful ? 'hsl(150, 60%, 50%)' : 'hsl(0, 60%, 50%)'}
                        strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${(signal.percentage / 100) * 100.5} 100.5`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn(
                        'text-[9px] font-bold tabular-nums',
                        signal.isSuccessful ? 'text-emerald-400' : 'text-rose-400'
                      )}>
                        {signal.percentage}%
                      </span>
                    </div>
                  </div>

                  {signal.isSuccessful ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}

                  <ChevronDown className={cn(
                    'w-3 h-3 text-muted-foreground transition-transform',
                    expandedSignal === signal.id && 'rotate-180'
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {expandedSignal === signal.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SignalDetailView signal={signal} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}