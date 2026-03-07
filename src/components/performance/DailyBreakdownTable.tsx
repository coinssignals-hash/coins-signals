import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface DailyData {
  day: string;
  date: string;
  totalSignals: number;
  positivas: number;
  negativos: number;
  pipsWins: number;
  pipsLoss: number;
}

interface DailyBreakdownTableProps {
  data: DailyData[];
  weekTotal: DailyData;
  expandedDay: string | null;
  onToggleDay: (day: string) => void;
}

export function DailyBreakdownTable({ data, weekTotal, expandedDay, onToggleDay }: DailyBreakdownTableProps) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-6 gap-1 px-3 py-2 border-b border-border">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Día</div>
        <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Total</div>
        <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">TP</div>
        <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">SL</div>
        <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">+Pips</div>
        <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">-Pips</div>
      </div>

      {/* Daily Rows */}
      {data.map((dayData) => (
        <button
          key={dayData.day}
          onClick={() => onToggleDay(dayData.day)}
          className={cn(
            'w-full grid grid-cols-6 gap-1 px-3 py-2.5 border-b border-border/30 hover:bg-secondary/30 transition-all duration-200',
            expandedDay === dayData.day && 'bg-primary/5 border-l-2 border-l-primary'
          )}
        >
          <div className="flex items-center gap-1 text-xs">
            <span className="text-foreground font-medium">{dayData.day.slice(0, 3)}</span>
            <span className="text-[10px] text-muted-foreground">{dayData.date}</span>
            {expandedDay === dayData.day ? (
              <ChevronUp className="w-3 h-3 text-primary" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <div className="text-center text-sm text-blue-400 font-bold tabular-nums">{dayData.totalSignals}</div>
          <div className="text-center text-sm text-emerald-400 font-bold tabular-nums">{dayData.positivas}</div>
          <div className="text-center text-sm text-rose-400 font-bold tabular-nums">{dayData.negativos}</div>
          <div className="text-center text-xs text-emerald-400 font-bold tabular-nums">+{dayData.pipsWins}</div>
          <div className="text-center text-xs text-rose-400 font-bold tabular-nums">-{dayData.pipsLoss}</div>
        </button>
      ))}

      {/* Week Total Row */}
      <div className="grid grid-cols-6 gap-1 px-3 py-2.5 bg-primary/5">
        <div className="flex flex-col text-xs">
          <span className="text-amber-400 font-bold">S{weekTotal.day}</span>
          <span className="text-[9px] text-muted-foreground tabular-nums">{weekTotal.date}</span>
        </div>
        <div className="text-center text-sm text-blue-400 font-extrabold tabular-nums">{weekTotal.totalSignals}</div>
        <div className="text-center text-sm text-emerald-400 font-extrabold tabular-nums">{weekTotal.positivas}</div>
        <div className="text-center text-sm text-rose-400 font-extrabold tabular-nums">{weekTotal.negativos}</div>
        <div className="text-center text-xs text-emerald-400 font-extrabold tabular-nums">+{weekTotal.pipsWins}</div>
        <div className="text-center text-xs text-rose-400 font-extrabold tabular-nums">-{weekTotal.pipsLoss}</div>
      </div>
    </Card>
  );
}