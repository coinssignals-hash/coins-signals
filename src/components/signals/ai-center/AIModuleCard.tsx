import { cn } from '@/lib/utils';
import { Loader2, Play, CheckCircle2, AlertCircle, RotateCcw, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'idle' | 'running' | 'done' | 'error';
  onRun: () => void;
  disabled?: boolean;
  accentColor?: string;
}

const ACCENT_GRADIENTS: Record<string, string> = {
  primary: 'linear-gradient(135deg, hsl(200, 90%, 45%), hsl(210, 80%, 55%))',
  purple: 'linear-gradient(135deg, hsl(270, 80%, 50%), hsl(280, 70%, 60%))',
  amber: 'linear-gradient(135deg, hsl(35, 90%, 50%), hsl(45, 85%, 55%))',
  emerald: 'linear-gradient(135deg, hsl(160, 70%, 40%), hsl(170, 60%, 50%))',
  rose: 'linear-gradient(135deg, hsl(350, 80%, 50%), hsl(0, 70%, 55%))',
};

export function AIModuleCard({ title, description, icon: Icon, status, onRun, disabled, accentColor = 'primary' }: Props) {
  const { t } = useTranslation();

  const STATUS_STYLES = {
    idle: {
      border: 'hsl(210, 50%, 18%)',
      bg: 'hsl(210, 80%, 6%)',
      glow: 'none',
      dotColor: 'hsl(210, 30%, 40%)',
      label: t('ai_center_status_pending'),
      labelColor: 'hsl(210, 30%, 50%)',
    },
    running: {
      border: 'hsl(200, 80%, 35%)',
      bg: 'hsl(200, 80%, 6%)',
      glow: '0 0 20px -6px hsla(200, 90%, 50%, 0.3)',
      dotColor: 'hsl(200, 90%, 55%)',
      label: t('ai_center_status_analyzing'),
      labelColor: 'hsl(200, 80%, 60%)',
    },
    done: {
      border: 'hsl(160, 60%, 25%)',
      bg: 'hsl(160, 60%, 5%)',
      glow: '0 0 20px -6px hsla(160, 70%, 45%, 0.25)',
      dotColor: 'hsl(160, 70%, 50%)',
      label: t('ai_center_status_completed'),
      labelColor: 'hsl(160, 60%, 55%)',
    },
    error: {
      border: 'hsl(0, 60%, 28%)',
      bg: 'hsl(0, 60%, 6%)',
      glow: '0 0 20px -6px hsla(0, 70%, 50%, 0.25)',
      dotColor: 'hsl(0, 70%, 55%)',
      label: t('ai_center_status_error'),
      labelColor: 'hsl(0, 60%, 60%)',
    },
  } as const;

  const s = STATUS_STYLES[status];
  const gradient = ACCENT_GRADIENTS[accentColor] || ACCENT_GRADIENTS.primary;

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-300 group"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: s.glow,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{ background: status === 'idle' ? gradient : `linear-gradient(90deg, ${s.dotColor}, transparent 80%)` }}
      />

      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Icon */}
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300",
            status === 'running' && "animate-pulse"
          )}
          style={{
            background: status === 'idle' ? gradient : `${s.dotColor}22`,
            boxShadow: status === 'idle' ? `0 0 12px -4px ${s.dotColor}` : 'none',
          }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: status === 'idle' ? 'white' : s.dotColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold text-white truncate">{title}</h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div
                className={cn("w-1.5 h-1.5 rounded-full", status === 'running' && "animate-pulse")}
                style={{ backgroundColor: s.dotColor, boxShadow: `0 0 6px ${s.dotColor}` }}
              />
              <span className="text-[9px] font-medium tracking-wide uppercase" style={{ color: s.labelColor }}>
                {s.label}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{description}</p>
        </div>

        {/* Action button */}
        <button
          onClick={onRun}
          disabled={disabled || status === 'running'}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            status === 'running' ? "cursor-wait" : "hover:scale-105 active:scale-95"
          )}
          style={{
            background: status === 'done' ? `${s.dotColor}15` :
                         status === 'error' ? `${s.dotColor}15` :
                         status === 'running' ? 'transparent' :
                         'hsla(210, 50%, 20%, 0.5)',
            border: `1px solid ${status === 'idle' ? 'hsl(210, 40%, 25%)' : `${s.dotColor}40`}`,
          }}
          title={status === 'error' ? t('ai_center_retry') : status === 'done' ? t('ai_center_run_again') : t('ai_center_run_module')}
        >
          {status === 'running' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: s.dotColor }} />
          ) : status === 'done' ? (
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: s.dotColor }} />
          ) : status === 'error' ? (
            <RotateCcw className="w-3.5 h-3.5" style={{ color: s.dotColor }} />
          ) : (
            <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}
