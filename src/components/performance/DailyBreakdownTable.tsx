import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
      {/* Header */}
      <div className="grid grid-cols-6 gap-1 p-3 border-b border-border text-xs text-muted-foreground">
        <div></div>
        <div className="text-center">Total Señales</div>
        <div className="text-center">Positivas</div>
        <div className="text-center">Negativos</div>
        <div className="text-center">Pips Wins</div>
        <div className="text-center">Pips Loss</div>
      </div>

      {/* Daily Rows */}
      {data.map((dayData) => (
        <div key={dayData.day}>
          <button
            onClick={() => onToggleDay(dayData.day)}
            className={cn(
              'w-full grid grid-cols-6 gap-1 p-3 border-b border-border hover:bg-secondary/50 transition-colors',
              expandedDay === dayData.day && 'bg-secondary/30'
            )}
          >
            <div className="flex items-center gap-1 text-xs">
              <span className="text-foreground font-medium">{dayData.day}</span>
              <span className="text-muted-foreground">{dayData.date}</span>
              {expandedDay === dayData.day ? (
                <ChevronUp className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <div className="text-center text-blue-400 font-bold font-mono-numbers">{dayData.totalSignals.toString().padStart(2, '0')}</div>
            <div className="text-center text-green-500 font-bold font-mono-numbers">{dayData.positivas.toString().padStart(2, '0')}</div>
            <div className="text-center text-red-500 font-bold font-mono-numbers">{dayData.negativos.toString().padStart(2, '0')}</div>
            <div className="text-center text-green-500 font-bold font-mono-numbers">+ {dayData.pipsWins}</div>
            <div className="text-center text-red-500 font-bold font-mono-numbers">- {dayData.pipsLoss}</div>
          </button>
        </div>
      ))}

      {/* Week Total Row */}
      <div className="grid grid-cols-6 gap-1 p-3 bg-secondary/30">
        <div className="flex flex-col text-xs">
          <span className="text-amber-400 font-medium">Semana {weekTotal.day}</span>
          <span className="text-muted-foreground">{weekTotal.date}</span>
        </div>
        <div className="text-center text-blue-400 font-bold font-mono-numbers">{weekTotal.totalSignals}</div>
        <div className="text-center text-green-500 font-bold font-mono-numbers">{weekTotal.positivas}</div>
        <div className="text-center text-red-500 font-bold font-mono-numbers">{weekTotal.negativos}</div>
        <div className="text-center text-green-500 font-bold font-mono-numbers">+ {weekTotal.pipsWins}</div>
        <div className="text-center text-red-500 font-bold font-mono-numbers">- {weekTotal.pipsLoss}</div>
      </div>
    </div>
  );
}
