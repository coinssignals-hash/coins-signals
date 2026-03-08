import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface WeeklySummaryProps {
  weekNumber: number;
  totalSignals: number;
  successfulSignals: number;
  lostSignals: number;
  pipsGained: number;
  pipsLost: number;
  successRate: number;
}

export function WeeklySummary({
  weekNumber,
  totalSignals,
  successfulSignals,
  lostSignals,
  pipsGained,
  pipsLost,
  successRate,
}: WeeklySummaryProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">{t('perf_weekly_summary')}</h2>
          <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            S{weekNumber}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* TP Hit */}
          <motion.div 
            className="rounded-lg p-3 bg-emerald-500/5 border border-emerald-500/15"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider">{t('perf_tp_hit')}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 tabular-nums">{successfulSignals}</span>
              <span className="text-[10px] text-muted-foreground">{t('perf_signals_label')}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 tabular-nums">+{pipsGained} pips</span>
            </div>
          </motion.div>

          {/* SL Hit */}
          <motion.div 
            className="rounded-lg p-3 bg-rose-500/5 border border-rose-500/15"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] text-rose-400/80 uppercase tracking-wider">{t('perf_sl_hit')}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400 tabular-nums">{lostSignals}</span>
              <span className="text-[10px] text-muted-foreground">{t('perf_signals_label')}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <span className="text-xs font-bold text-rose-400 tabular-nums">{pipsLost} pips</span>
            </div>
          </motion.div>
        </div>

        {/* Win Rate Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{t('perf_success_rate')}</span>
            <span className="text-xs font-bold text-foreground tabular-nums">{successRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                background: successRate >= 60 
                  ? 'linear-gradient(90deg, hsl(150, 60%, 40%), hsl(150, 80%, 50%))' 
                  : 'linear-gradient(90deg, hsl(0, 60%, 40%), hsl(0, 80%, 50%))'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${successRate}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
