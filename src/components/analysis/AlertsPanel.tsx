import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/i18n/LanguageContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bell, Activity, Shield, Volume2, CandlestickChart, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playNotificationSound } from '@/utils/notificationSound';
import { cn } from '@/lib/utils';

interface AlertConfig {
  rsiOverbought: number;
  rsiOversold: number;
  enableRSI: boolean;
  enableMACD: boolean;
  enableSMACross: boolean;
  enableSupportResistance: boolean;
  srProximityPercent: number;
  srEnableSound: boolean;
  enablePatternAlerts: boolean;
  patternAlertTypes: {
    bullish: boolean;
    bearish: boolean;
    neutral: boolean;
  };
  patternEnableSound: boolean;
}

interface AlertsPanelProps {
  config: AlertConfig;
  onConfigChange: (config: AlertConfig) => void;
}

/* ───── Reusable toggle row ───── */
function AlertToggleRow({
  icon,
  iconColor,
  label,
  description,
  checked,
  onCheckedChange,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'group flex items-center gap-3 w-full rounded-xl px-3 py-3 transition-all duration-200 border',
          checked
            ? 'bg-primary/10 border-primary/30 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.25)]'
            : 'bg-card/40 border-border/30 hover:border-border/60'
        )}
      >
        {/* Icon container */}
        <div className={cn(
          'flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-all duration-200',
          checked
            ? `${iconColor} shadow-sm`
            : 'bg-muted/50'
        )}>
          {icon}
        </div>

        {/* Label & desc */}
        <div className="flex-1 text-left min-w-0">
          <span className={cn(
            'text-sm font-medium transition-colors block',
            checked ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {label}
          </span>
          {description && (
            <span className="text-[10px] text-muted-foreground/70 leading-tight block mt-0.5 truncate">
              {description}
            </span>
          )}
        </div>

        {/* Toggle */}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'shrink-0 transition-all duration-200',
            checked && 'shadow-[0_0_8px_-2px_hsl(var(--primary)/0.4)]'
          )}
        />
      </button>

      {/* Expandable children */}
      {checked && children && (
        <div className="ml-3 pl-3 border-l-2 border-primary/20 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

/* ───── Mini pattern row ───── */
function PatternTypeRow({
  emoji,
  emojiColor,
  label,
  hint,
  checked,
  onCheckedChange,
  onTestSound,
}: {
  emoji: string;
  emojiColor: string;
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  onTestSound: () => void;
}) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200 border',
      checked
        ? 'bg-card/60 border-border/40'
        : 'bg-transparent border-transparent'
    )}>
      <span className={cn('text-sm', emojiColor)}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-[9px] text-muted-foreground/60 ml-1">{hint}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 rounded-md hover:bg-muted/50"
        onClick={onTestSound}
      >
        <Volume2 className="w-3 h-3 text-muted-foreground" />
      </Button>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="scale-[0.85]"
      />
    </div>
  );
}

export function AlertsPanel({ config, onConfigChange }: AlertsPanelProps) {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (key: keyof AlertConfig, value: boolean | number | AlertConfig['patternAlertTypes']) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handlePatternTypeChange = (type: keyof AlertConfig['patternAlertTypes'], value: boolean) => {
    const newPatternTypes = { ...localConfig.patternAlertTypes, [type]: value };
    handleChange('patternAlertTypes', newPatternTypes);
  };

  const testPatternSound = (type: 'bullish' | 'bearish' | 'neutral') => {
    playNotificationSound(`pattern_${type}`);
  };

  const activeCount = [
    localConfig.enableSupportResistance,
    localConfig.enablePatternAlerts,
    localConfig.enableRSI,
    localConfig.enableMACD,
    localConfig.enableSMACross,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Header badge */}
      <div className="flex items-center gap-2 px-1">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{t('analysis_alerts')}</span>
        <span className={cn(
          'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
          activeCount > 0
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground'
        )}>
          {activeCount} {t('analysis_alert_active')}
        </span>
      </div>

      {/* ── Support/Resistance ── */}
      <AlertToggleRow
        icon={<Shield className="w-4 h-4 text-emerald-400" />}
        iconColor="bg-emerald-500/15"
        label={t('analysis_alert_sr')}
        description={t('analysis_alert_sr_desc')}
        checked={localConfig.enableSupportResistance}
        onCheckedChange={(v) => handleChange('enableSupportResistance', v)}
      >
        <div className="space-y-2">
            <span className="text-muted-foreground">{t('analysis_alert_proximity')}</span>
            <span className="font-mono text-amber-400">{localConfig.srProximityPercent}%</span>
          </div>
          <Slider
            value={[localConfig.srProximityPercent]}
            onValueChange={([val]) => handleChange('srProximityPercent', val)}
            min={1} max={20} step={1}
            className="w-full"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-blue-400" />
            <Label className="text-xs">{t('analysis_alert_sound')}</Label>
          </div>
          <Switch
            checked={localConfig.srEnableSound}
            onCheckedChange={(v) => handleChange('srEnableSound', v)}
            className="scale-[0.85]"
          />
        </div>
      </AlertToggleRow>

      {/* ── Candle Patterns ── */}
      <AlertToggleRow
        icon={<CandlestickChart className="w-4 h-4 text-amber-400" />}
        iconColor="bg-amber-500/15"
        label={t('analysis_alert_candle_patterns')}
        description={t('analysis_alert_candle_desc')}
        checked={localConfig.enablePatternAlerts}
        onCheckedChange={(v) => handleChange('enablePatternAlerts', v)}
      >
        <div className="space-y-1.5">
          <PatternTypeRow emoji="↑" emojiColor="text-emerald-400" label="Alcistas" hint="Hammer, Engulfing"
            checked={localConfig.patternAlertTypes.bullish}
            onCheckedChange={(v) => handlePatternTypeChange('bullish', v)}
            onTestSound={() => testPatternSound('bullish')}
          />
          <PatternTypeRow emoji="↓" emojiColor="text-red-400" label="Bajistas" hint="Bear Engulfing"
            checked={localConfig.patternAlertTypes.bearish}
            onCheckedChange={(v) => handlePatternTypeChange('bearish', v)}
            onTestSound={() => testPatternSound('bearish')}
          />
          <PatternTypeRow emoji="→" emojiColor="text-amber-400" label="Neutrales" hint="Doji"
            checked={localConfig.patternAlertTypes.neutral}
            onCheckedChange={(v) => handlePatternTypeChange('neutral', v)}
            onTestSound={() => testPatternSound('neutral')}
          />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/20">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-blue-400" />
            <Label className="text-xs">Sonido global</Label>
          </div>
          <Switch
            checked={localConfig.patternEnableSound}
            onCheckedChange={(v) => handleChange('patternEnableSound', v)}
            className="scale-[0.85]"
          />
        </div>
      </AlertToggleRow>

      {/* ── RSI ── */}
      <AlertToggleRow
        icon={<Activity className="w-4 h-4 text-yellow-400" />}
        iconColor="bg-yellow-500/15"
        label="Alertas RSI"
        description="Sobrecompra y sobreventa"
        checked={localConfig.enableRSI}
        onCheckedChange={(v) => handleChange('enableRSI', v)}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sobrecompra</span>
              <span className="font-mono text-red-400">{localConfig.rsiOverbought}</span>
            </div>
            <Slider value={[localConfig.rsiOverbought]} onValueChange={([v]) => handleChange('rsiOverbought', v)} min={60} max={90} step={5} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sobreventa</span>
              <span className="font-mono text-emerald-400">{localConfig.rsiOversold}</span>
            </div>
            <Slider value={[localConfig.rsiOversold]} onValueChange={([v]) => handleChange('rsiOversold', v)} min={10} max={40} step={5} />
          </div>
        </div>
      </AlertToggleRow>

      {/* ── MACD ── */}
      <AlertToggleRow
        icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
        iconColor="bg-blue-500/15"
        label="Cruces MACD"
        description="Cruce de línea de señal"
        checked={localConfig.enableMACD}
        onCheckedChange={(v) => handleChange('enableMACD', v)}
      />

      {/* ── SMA Cross ── */}
      <AlertToggleRow
        icon={<TrendingDown className="w-4 h-4 text-purple-400" />}
        iconColor="bg-purple-500/15"
        label="Cruces Precio/SMA"
        description="Golden Cross, Death Cross"
        checked={localConfig.enableSMACross}
        onCheckedChange={(v) => handleChange('enableSMACross', v)}
      />

      {/* Footer info */}
      <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Las alertas se envían como notificaciones push y dentro de la app.
        </p>
      </div>
    </div>
  );
}
