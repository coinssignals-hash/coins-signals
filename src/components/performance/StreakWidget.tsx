import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, TrendingUp, TrendingDown, Trophy } from 'lucide-react';

interface StreakWidgetProps {
  pipsGained: number;
  pipsLost: number;
  successRate: number;
  weekNumber: number;
}

export function StreakWidget({ pipsGained, pipsLost, successRate, weekNumber }: StreakWidgetProps) {
  const netPips = pipsGained + pipsLost;
  const isPositiveWeek = netPips >= 0;
  const performance = successRate >= 70 ? 'Excelente' : successRate >= 50 ? 'Bueno' : 'Mejorar';
  const performanceColor = successRate >= 70 ? 'text-emerald-400' : successRate >= 50 ? 'text-amber-400' : 'text-rose-400';

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400" />
          Semana {weekNumber}
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Pips Neto</span>
            <div className="flex items-center gap-1">
              {isPositiveWeek ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <motion.span 
                className={`text-sm font-bold tabular-nums ${isPositiveWeek ? 'text-emerald-400' : 'text-rose-400'}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {netPips >= 0 ? '+' : ''}{netPips}
              </motion.span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Ganados</span>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">+{pipsGained}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Perdidos</span>
            <span className="text-xs font-bold text-rose-400 tabular-nums">{pipsLost}</span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Calificación</span>
            <div className="flex items-center gap-1">
              <Trophy className={`w-3 h-3 ${performanceColor}`} />
              <span className={`text-xs font-bold ${performanceColor}`}>{performance}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}