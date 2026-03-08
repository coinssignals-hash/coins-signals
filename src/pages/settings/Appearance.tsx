import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette, Eye, Type, Globe, Zap, Minimize2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation, LANGUAGE_LABELS, LANGUAGE_FLAGS } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ACCENT_COLOR_IDS = ['blue', 'cyan', 'green', 'amber', 'rose', 'violet'] as const;
const ACCENT_COLORS_META: Record<string, { hsl: string; preview: string }> = {
  blue: { hsl: '217 91% 60%', preview: 'bg-[hsl(217,91%,60%)]' },
  cyan: { hsl: '187 72% 50%', preview: 'bg-[hsl(187,72%,50%)]' },
  green: { hsl: '142 70% 45%', preview: 'bg-[hsl(142,70%,45%)]' },
  amber: { hsl: '38 95% 55%', preview: 'bg-[hsl(38,95%,55%)]' },
  rose: { hsl: '346 77% 50%', preview: 'bg-[hsl(346,77%,50%)]' },
  violet: { hsl: '271 76% 53%', preview: 'bg-[hsl(271,76%,53%)]' },
};

const ACCENT_LABEL_KEYS: Record<string, string> = {
  blue: 'appearance_color_blue',
  cyan: 'appearance_color_cyan',
  green: 'appearance_color_green',
  amber: 'appearance_color_amber',
  rose: 'appearance_color_rose',
  violet: 'appearance_color_violet',
};

const FONT_SCALE_LABEL_KEYS = [
  { value: '85', labelKey: 'appearance_font_small', desc: '85%' },
  { value: '100', labelKey: 'appearance_font_normal', desc: '100%' },
  { value: '115', labelKey: 'appearance_font_large', desc: '115%' },
  { value: '130', labelKey: 'appearance_font_xlarge', desc: '130%' },
];

const TIMEZONES = [
  { value: 'America/Bogota', label: 'Bogotá, Quito', offset: 'UTC -05:00' },
  { value: 'America/New_York', label: 'New York', offset: 'UTC -05:00' },
  { value: 'America/Chicago', label: 'Chicago', offset: 'UTC -06:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: 'UTC -08:00' },
  { value: 'America/Mexico_City', label: 'Ciudad de México', offset: 'UTC -06:00' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC -03:00' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC -03:00' },
  { value: 'Europe/London', label: 'London', offset: 'UTC +00:00' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC +01:00' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: 'UTC +01:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'UTC +09:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 'UTC +08:00' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC +04:00' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC +11:00' },
];

function applyFontScale(scale: string) {
  document.documentElement.classList.remove('font-scale-85', 'font-scale-100', 'font-scale-115', 'font-scale-130');
  document.documentElement.classList.add(`font-scale-${scale}`);
  localStorage.setItem('app-font-scale', scale);
}

function applyAccentColor(accent: string) {
  ACCENT_COLOR_IDS.forEach(c => document.documentElement.classList.remove(`accent-${c}`));
  document.documentElement.classList.add(`accent-${accent}`);
  localStorage.setItem('app-accent-color', accent);
}

function applyReducedMotion(enabled: boolean) {
  document.documentElement.classList.toggle('reduce-motion', enabled);
  localStorage.setItem('app-reduce-motion', String(enabled));
}

function applyCompactMode(enabled: boolean) {
  document.documentElement.classList.toggle('compact-mode', enabled);
  localStorage.setItem('app-compact-mode', String(enabled));
}

export default function Appearance() {
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('app-font-scale') || '100');
  const [contrastLevel, setContrastLevel] = useState(() => localStorage.getItem('app-contrast-level') || 'normal');
  const [largeText, setLargeText] = useState(() => localStorage.getItem('app-large-text') === 'true');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('app-timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('app-accent-color') || 'blue');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('app-reduce-motion') === 'true');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('app-compact-mode') === 'true');
  const { language, setLanguage, t } = useTranslation();

  useEffect(() => {
    document.documentElement.classList.remove('contrast-low', 'high-contrast', 'contrast-high');
    if (contrastLevel === 'low') document.documentElement.classList.add('contrast-low');
    else if (contrastLevel === 'medium') document.documentElement.classList.add('high-contrast');
    else if (contrastLevel === 'high') document.documentElement.classList.add('contrast-high');
    localStorage.setItem('app-contrast-level', contrastLevel);
  }, [contrastLevel]);

  useEffect(() => { document.body.classList.toggle('large-text', largeText); localStorage.setItem('app-large-text', String(largeText)); }, [largeText]);
  useEffect(() => { applyFontScale(fontSize); }, [fontSize]);
  useEffect(() => { applyAccentColor(accentColor); }, [accentColor]);
  useEffect(() => { applyReducedMotion(reducedMotion); }, [reducedMotion]);
  useEffect(() => { applyCompactMode(compactMode); }, [compactMode]);
  useEffect(() => { localStorage.setItem('app-timezone', timezone); }, [timezone]);

  const handleResetAll = useCallback(() => {
    setFontSize('100');
    setContrastLevel('normal');
    setLargeText(false);
    setAccentColor('blue');
    setReducedMotion(false);
    setCompactMode(false);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota');
    toast.success(t('appearance_prefs_restored'));
  }, [t]);

  const currentTime = new Date().toLocaleTimeString('es', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const contrastOptions = [
    { value: 'normal', labelKey: 'appearance_contrast_normal', icon: '○' },
    { value: 'low', labelKey: 'appearance_contrast_low', icon: '◔' },
    { value: 'medium', labelKey: 'appearance_contrast_medium', icon: '◑' },
    { value: 'high', labelKey: 'appearance_contrast_high', icon: '●' },
  ];

  return (
    <PageShell>
      <Header />
      <main className="py-4 px-4 pb-28 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{t('appearance_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('appearance_subtitle')}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleResetAll}>
            {t('appearance_reset')}
          </Button>
        </div>

        {/* Theme & Language */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Palette className="w-4 h-4" />{t('appearance_prefs')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('appearance_language')}</label>
              <Select value={language} onValueChange={(v) => { setLanguage(v as Language); toast.success(t('appearance_lang_updated')); }}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                    <SelectItem key={lang} value={lang}>{LANGUAGE_FLAGS[lang]} {LANGUAGE_LABELS[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> {t('appearance_timezone_label')}
              </label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label} ({tz.offset})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {t('appearance_current_time')} <span className="text-foreground tabular-nums font-medium">{currentTime}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Color Accent */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />{t('appearance_accent_color')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {ACCENT_COLOR_IDS.map(id => {
                const meta = ACCENT_COLORS_META[id];
                const label = t(ACCENT_LABEL_KEYS[id]);
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setAccentColor(id); toast.success(`${t('appearance_accent_color')}: ${label}`); }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all',
                      accentColor === id ? 'border-foreground/30 bg-secondary/60 shadow-md' : 'border-transparent hover:bg-secondary/30'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      meta.preview,
                      accentColor === id ? 'border-foreground/50 scale-110 shadow-[0_0_12px_currentColor]' : 'border-transparent'
                    )} />
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{t('appearance_accent_desc')}</p>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Type className="w-4 h-4" />{t('appearance_typography')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('appearance_font_scale')}</label>
              <div className="grid grid-cols-4 gap-2">
                {FONT_SCALE_LABEL_KEYS.map(scale => (
                  <button
                    key={scale.value}
                    onClick={() => setFontSize(scale.value)}
                    className={cn(
                      'rounded-xl border px-2 py-2.5 text-center transition-all',
                      fontSize === scale.value
                        ? 'bg-primary/15 text-primary border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]'
                        : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/10'
                    )}
                  >
                    <span className="text-xs font-bold block">{scale.desc}</span>
                    <span className="text-[9px] text-muted-foreground">{t(scale.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
              <div>
                <p className="text-sm font-medium text-foreground">{t('appearance_large_text')}</p>
                <p className="text-[11px] text-muted-foreground">{t('appearance_large_text_desc')}</p>
              </div>
              <Switch checked={largeText} onCheckedChange={setLargeText} />
            </div>
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('appearance_preview')}</p>
              <p className="text-foreground">{t('appearance_preview_normal')}</p>
              <p className="text-sm text-muted-foreground">{t('appearance_preview_secondary')}</p>
              <p className="text-xs text-muted-foreground">{t('appearance_preview_tiny')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Eye className="w-4 h-4" />{t('appearance_accessibility')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('appearance_contrast_level')}</label>
              <div className="grid grid-cols-4 gap-2">
                {contrastOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setContrastLevel(opt.value)}
                    className={cn(
                      'rounded-xl border px-2 py-2.5 text-center transition-all',
                      contrastLevel === opt.value
                        ? 'bg-primary/15 text-primary border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]'
                        : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/10'
                    )}
                  >
                    <span className="text-base block mb-0.5">{opt.icon}</span>
                    <span className="text-[10px] font-medium">{t(opt.labelKey)}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {contrastLevel === 'normal' && t('appearance_contrast_desc_normal')}
                {contrastLevel === 'low' && t('appearance_contrast_desc_low')}
                {contrastLevel === 'medium' && t('appearance_contrast_desc_medium')}
                {contrastLevel === 'high' && t('appearance_contrast_desc_high')}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" /> {t('appearance_reduce_motion')}
                </p>
                <p className="text-[11px] text-muted-foreground">{t('appearance_reduce_motion_desc')}</p>
              </div>
              <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> {t('appearance_compact_mode')}
                </p>
                <p className="text-[11px] text-muted-foreground">{t('appearance_compact_mode_desc')}</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
