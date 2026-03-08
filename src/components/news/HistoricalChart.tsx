import { HistoricalAnalysis, HistoricalDataPoint } from '@/types/news';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useTranslation } from '@/i18n/LanguageContext';

interface HistoricalChartProps {
  analysis: HistoricalAnalysis;
  className?: string;
}

export function HistoricalChart({ analysis, className }: HistoricalChartProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('news_historical_previous_months')}
        </h3>
        <MonthlyChart data={analysis.monthly_data} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">{t('news_historical_short_term')}</h4>
          <div className="grid grid-cols-3 gap-1">
            {analysis.monthly_data.slice(-3).map((point, i) => (
              <ImpactBlock 
                key={i}
                value={point.impact_score} 
                label={point.period}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Monedas Afectadas</h4>
          <div className="flex gap-1">
            <span className="text-xl">🇺🇸</span>
            <span className="text-xl">🇪🇺</span>
            <span className="text-xl">🇬🇧</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground italic">
        {analysis.similar_events_summary}
      </p>
    </div>
  );
}

interface MonthlyChartProps {
  data: HistoricalDataPoint[];
}

function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 10, fill: 'hsl(210 15% 55%)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[-100, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(225 25% 10%)',
              border: '1px solid hsl(225 15% 18%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(210 20% 95%)' }}
            formatter={(value: number) => [`${value}%`, 'Impacto']}
          />
          <Bar dataKey="impact_score" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.impact_score >= 0 
                  ? 'hsl(142 70% 45%)' 
                  : 'hsl(0 70% 50%)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ImpactBlockProps {
  value: number;
  label: string;
}

function ImpactBlock({ value, label }: ImpactBlockProps) {
  const isPositive = value >= 0;
  const intensity = Math.min(Math.abs(value) / 100, 1);
  
  return (
    <div 
      className={cn(
        'aspect-square rounded flex flex-col items-center justify-center text-xs font-mono',
        isPositive 
          ? 'bg-bullish/20 text-bullish' 
          : 'bg-bearish/20 text-bearish'
      )}
      style={{ 
        opacity: 0.4 + intensity * 0.6 
      }}
    >
      <span className="font-bold">{value > 0 ? '+' : ''}{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// Simple bar version for smaller screens
interface HistoricalChartSimpleProps {
  data: HistoricalDataPoint[];
  className?: string;
}

export function HistoricalChartSimple({ data, className }: HistoricalChartSimpleProps) {
  const maxValue = Math.max(...data.map(d => Math.abs(d.impact_score)));
  
  return (
    <div className={cn('space-y-2', className)}>
      {data.slice(-6).map((point, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">{point.period}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex items-center">
            <div className="w-1/2 flex justify-end">
              {point.impact_score < 0 && (
                <div 
                  className="h-full bg-bearish rounded-l-full"
                  style={{ width: `${(Math.abs(point.impact_score) / maxValue) * 100}%` }}
                />
              )}
            </div>
            <div className="w-px h-full bg-muted-foreground/30" />
            <div className="w-1/2">
              {point.impact_score > 0 && (
                <div 
                  className="h-full bg-bullish rounded-r-full"
                  style={{ width: `${(point.impact_score / maxValue) * 100}%` }}
                />
              )}
            </div>
          </div>
          <span className={cn(
            'text-xs font-mono w-10 text-right',
            point.impact_score >= 0 ? 'text-bullish' : 'text-bearish'
          )}>
            {point.impact_score > 0 ? '+' : ''}{point.impact_score}
          </span>
        </div>
      ))}
    </div>
  );
}
