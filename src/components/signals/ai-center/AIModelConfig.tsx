import { cn } from '@/lib/utils';
import { Settings2, Cpu, Zap, Brain, Check, FileText, AlignLeft, BookOpen } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import type { DetailLevel } from '@/hooks/useAIAnalysis';

export interface AIModelSettings {
  models: string[];
  temperature: number;
  maxTokens: number;
  /** @deprecated use models[0] instead */
  model?: string;
}

const MAX_MODELS = 3;

interface Props {
  settings: AIModelSettings;
  onChange: (settings: AIModelSettings) => void;
  detailLevel: DetailLevel;
  onDetailLevelChange: (level: DetailLevel) => void;
}

export function AIModelConfig({ settings, onChange, detailLevel, onDetailLevelChange }: Props) {
  const { t } = useTranslation();
  const selected = settings.models;

  const MODELS = [
    { id: 'google/gemini-2.5-flash', label: 'Gemini Flash', icon: Zap, desc: t('ai_center_fast_efficient'), provider: 'Google' },
    { id: 'google/gemini-2.5-pro', label: 'Gemini Pro', icon: Brain, desc: t('ai_center_max_precision'), provider: 'Google' },
    { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', icon: Zap, desc: t('ai_center_new_gen'), provider: 'Google' },
    { id: 'openai/gpt-5', label: 'GPT-5', icon: Cpu, desc: t('ai_center_powerful_precise'), provider: 'OpenAI' },
    { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', icon: Zap, desc: t('ai_center_fast_balanced'), provider: 'OpenAI' },
    { id: 'openai/gpt-5.2', label: 'GPT-5.2', icon: Brain, desc: t('ai_center_advanced_reasoning'), provider: 'OpenAI' },
  ];

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length <= 1) return;
      onChange({ ...settings, models: selected.filter((m) => m !== id) });
    } else {
      if (selected.length >= MAX_MODELS) return;
      onChange({ ...settings, models: [...selected, id] });
    }
  };

  const googleModels = MODELS.filter((m) => m.provider === 'Google');
  const openaiModels = MODELS.filter((m) => m.provider === 'OpenAI');

  const renderModel = (m: typeof MODELS[0]) => {
    const Icon = m.icon;
    const isSelected = selected.includes(m.id);
    const disabled = !isSelected && selected.length >= MAX_MODELS;

    return (
      <button
        key={m.id}
        onClick={() => toggle(m.id)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
          isSelected
            ? "border-primary bg-primary/10 text-foreground"
            : disabled
              ? "border-border bg-card/50 text-muted-foreground/50 cursor-not-allowed"
              : "border-border bg-card hover:bg-secondary/50 text-muted-foreground"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
          isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
        )}>
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
        <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{m.label}</div>
          <div className="text-xs text-muted-foreground">{m.desc}</div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Settings2 className="w-4 h-4 text-primary" />
          {t('ai_center_config_title')}
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {selected.length}/{MAX_MODELS} {t('ai_center_active_count')}
        </span>
      </div>

      {/* Google models */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">Google Gemini</div>
        <div className="grid gap-1.5">
          {googleModels.map(renderModel)}
        </div>
      </div>

      {/* OpenAI models */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">OpenAI GPT</div>
        <div className="grid gap-1.5">
          {openaiModels.map(renderModel)}
        </div>
      </div>

      {/* Detail Level */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
          {t('ai_center_detail_level') || 'Nivel de detalle'}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: 'concise' as DetailLevel, label: t('ai_center_detail_concise') || 'Conciso', icon: FileText, desc: t('ai_center_detail_concise_desc') || 'Resumen rápido con los puntos clave' },
            { id: 'standard' as DetailLevel, label: t('ai_center_detail_standard') || 'Estándar', icon: AlignLeft, desc: t('ai_center_detail_standard_desc') || 'Análisis equilibrado y completo' },
            { id: 'detailed' as DetailLevel, label: t('ai_center_detail_detailed') || 'Detallado', icon: BookOpen, desc: t('ai_center_detail_detailed_desc') || 'Análisis profundo con explicaciones' },
          ]).map((opt) => {
            const Icon = opt.icon;
            const isActive = detailLevel === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onDetailLevelChange(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                  isActive
                    ? "border-primary bg-primary/10 text-foreground shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]"
                    : "border-border bg-card hover:bg-secondary/50 text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isActive ? "bg-primary/20" : "bg-muted/50"
                )}>
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                </div>
                <span className="text-[11px] font-bold">{opt.label}</span>
                <span className="text-[8px] text-muted-foreground leading-tight">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center justify-between">
          <span>{t('ai_center_temperature')}</span>
          <span className="text-foreground font-mono">{settings.temperature.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
          className="w-full accent-primary h-1.5"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{t('ai_center_precise')}</span>
          <span>{t('ai_center_creative')}</span>
        </div>
      </div>
    </div>
  );
}
