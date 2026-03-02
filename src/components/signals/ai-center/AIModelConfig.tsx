import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Settings2, Cpu, Zap, Brain } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

export interface AIModelSettings {
  model: string;
  temperature: number;
  maxTokens: number;
}

const MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini Flash', icon: Zap, desc: 'Rápido y eficiente' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini Pro', icon: Brain, desc: 'Máxima precisión' },
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', icon: Zap, desc: 'Nueva generación' },
];

interface Props {
  settings: AIModelSettings;
  onChange: (settings: AIModelSettings) => void;
}

export function AIModelConfig({ settings, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Settings2 className="w-4 h-4 text-primary" />
        Configuración del Modelo IA
      </div>

      {/* Model selection */}
      <div className="grid gap-2">
        {MODELS.map((m) => {
          const Icon = m.icon;
          const selected = settings.model === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange({ ...settings, model: m.id })}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                selected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:bg-secondary/50 text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", selected ? "text-primary" : "text-muted-foreground")} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </div>
              {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center justify-between">
          <span>Temperatura</span>
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
          <span>Preciso</span>
          <span>Creativo</span>
        </div>
      </div>
    </div>
  );
}
