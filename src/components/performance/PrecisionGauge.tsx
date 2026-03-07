import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface PrecisionGaugeProps {
  successRate: number;
  totalSignals: number;
  successfulSignals: number;
  lostSignals: number;
}

export function PrecisionGauge({ successRate, totalSignals, successfulSignals, lostSignals }: PrecisionGaugeProps) {
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (successRate / 100) * circumference;
  const gaugeColor = successRate >= 70 ? 'hsl(var(--chart-2))' : successRate >= 50 ? 'hsl(45, 100%, 60%)' : 'hsl(var(--destructive))';

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex flex-col items-center justify-center">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <Target className="w-3 h-3" />
          Precisión
        </div>
        
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted)/0.3)" strokeWidth="6" />
            <motion.circle 
              cx="50" cy="50" r="42" 
              fill="none" 
              stroke={gaugeColor}
              strokeWidth="6" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-xl font-bold tabular-nums"
              style={{ color: gaugeColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {successRate}%
            </motion.span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 text-[10px]">
          <span className="text-emerald-400 tabular-nums">✓ {successfulSignals}</span>
          <span className="text-muted-foreground">de</span>
          <span className="text-foreground tabular-nums font-bold">{totalSignals}</span>
          <span className="text-rose-400 tabular-nums">✗ {lostSignals}</span>
        </div>
      </CardContent>
    </Card>
  );
}