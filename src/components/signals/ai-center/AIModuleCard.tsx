import { cn } from '@/lib/utils';
import { Loader2, Play, CheckCircle2, AlertCircle, LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'idle' | 'running' | 'done' | 'error';
  onRun: () => void;
  disabled?: boolean;
  accentColor?: string;
}

export function AIModuleCard({ title, description, icon: Icon, status, onRun, disabled, accentColor = 'primary' }: Props) {
  return (
    <div className={cn(
      "relative p-4 rounded-xl border transition-all",
      status === 'done' ? "border-bullish/30 bg-bullish/5" :
      status === 'error' ? "border-destructive/30 bg-destructive/5" :
      status === 'running' ? "border-primary/40 bg-primary/5" :
      "border-border bg-card hover:bg-secondary/30"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          status === 'done' ? "bg-bullish/10 text-bullish" :
          status === 'error' ? "bg-destructive/10 text-destructive" :
          `bg-${accentColor}/10 text-${accentColor}`
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <button
          onClick={onRun}
          disabled={disabled || status === 'running'}
          className={cn(
            "p-2 rounded-lg transition-all",
            status === 'running' ? "text-primary" :
            status === 'done' ? "text-bullish hover:bg-bullish/10" :
            "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          {status === 'running' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === 'done' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : status === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
