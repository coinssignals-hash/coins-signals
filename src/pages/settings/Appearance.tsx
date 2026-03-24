import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { GlowSection } from '@/components/ui/glow-section';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Palette, Eye, Type, Globe, Zap, Minimize2, Sparkles, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation, LANGUAGE_LABELS, LANGUAGE_FLAGS } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const ACCENT = '271 76% 53%';

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
  blue: 'appearance_color_blue', cyan: 'appearance_color_cyan', green: 'appearance_color_green',
  amber: 'appearance_color_amber', rose: 'appearance_color_rose', violet: 'appearance_color_violet',
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
  const { user, profile, updateProfile } = useAuth();
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('app-font-scale') || '100');
  const [contrastLevel, setContrastLevel] = useState(() => localStorage.getItem('app-contrast-level') || 'normal');
  const [largeText, setLargeText] = useState(() => localStorage.getItem('app-large-text') === 'true');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('app-timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('app-accent-color') || 'blue');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('app-reduce-motion') === 'true');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('app-compact-mode') === 'true');
  const { language, setLanguage, t } = useTranslation();

  useEffect(() => { if (profile?.timezone) { setTimezone(profile.timezone); localStorage.setItem('app-timezone', profile.timezone); } }, [profile]);

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
  useEffect(() => { localStorage.setItem('app-timezone', timezone); if (user) updateProfile({ timezone } as any); }, [timezone, user, updateProfile]);

  const handleResetAll = useCallback(() => {
    setFontSize('100'); setContrastLevel('normal'); setLargeText(false); setAccentColor('blue');
    setReducedMotion(false); setCompactMode(false); setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota');
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

      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${ACCENT} / 0.4), transparent 70%)`,
        }} />
        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Link to="/settings" className="p-2 rounded-xl transition-all active:scale-95" style={{
              background: 'hsl(var(--muted) / 0.5)', backdropFilter: 'blur(8px)', border: `1px solid hsl(${ACCENT} / 0.15)`,
            }}>
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
              border: `1px solid hsl(${ACCENT} / 0.3)`, boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
            }}>
              <Palette className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{t('appearance_title')}</h1>
              <p className="text-xs text-muted-foreground">{t('appearance_subtitle')}</p>
            </div>
            <button onClick={handleResetAll} className="p-2 rounded-xl transition-all active:scale-95" style={{
              background: 'hsl(var(--muted) / 0.3)', border: `1px solid hsl(${ACCENT} / 0.1)`,
            }}>
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 pb-28 space-y-4">
        {/* Theme & Language */}
        <GlowSection color={ACCENT}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-sm font-semibold text-foreground">{t('appearance_prefs')}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t('appearance_language')}</label>
              <Select value={language} onValueChange={(v) => { setLanguage(v as Language); toast.success(t('appearance_lang_updated')); }}>
                <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                    <SelectItem key={lang} value={lang}>{LANGUAGE_FLAGS[lang]} {LANGUAGE_LABELS[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> {t('appearance_timezone_label')}
              </label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (<SelectItem key={tz.value} value={tz.value}>{tz.label} ({tz.offset})</SelectItem>))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {t('appearance_current_time')} <span className="text-foreground tabular-nums font-medium">{currentTime}</span>
              </p>
            </div>
          </div>
        </GlowSection>

        {/* Color Accent */}
        <GlowSection color={ACCENT}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-sm font-semibold text-foreground">{t('appearance_accent_color')}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {ACCENT_COLOR_IDS.map(id => {
                const meta = ACCENT_COLORS_META[id];
                const label = t(ACCENT_LABEL_KEYS[id]);
                return (
                  <motion.button key={id} whileTap={{ scale: 0.9 }}
                    onClick={() => { setAccentColor(id); toast.success(`${t('appearance_accent_color')}: ${label}`); }}
                    className={cn('flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all',
                      accentColor === id ? 'bg-white/5 shadow-md' : 'border-transparent hover:bg-white/[0.02]'
                    )}
                    style={{ borderColor: accentColor === id ? `hsl(${meta.hsl} / 0.4)` : undefined }}
                  >
                    <div className={cn('w-8 h-8 rounded-full border-2 transition-all', meta.preview,
                      accentColor === id ? 'scale-110' : 'border-transparent'
                    )} style={{ borderColor: accentColor === id ? `hsl(${meta.hsl} / 0.6)` : undefined, boxShadow: accentColor === id ? `0 0 12px hsl(${meta.hsl} / 0.3)` : undefined }} />
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{t('appearance_accent_desc')}</p>
          </div>
        </GlowSection>

        {/* Typography */}
        <GlowSection color={ACCENT}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Type className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-sm font-semibold text-foreground">{t('appearance_typography')}</span>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t('appearance_font_scale')}</label>
              <div className="grid grid-cols-4 gap-2">
                {FONT_SCALE_LABEL_KEYS.map(scale => (
                  <button key={scale.value} onClick={() => setFontSize(scale.value)}
                    className="rounded-xl px-2 py-2.5 text-center transition-all"
                    style={{
                      background: fontSize === scale.value ? `hsl(${ACCENT} / 0.12)` : 'hsl(var(--muted) / 0.3)',
                      border: `1px solid ${fontSize === scale.value ? `hsl(${ACCENT} / 0.35)` : 'hsl(var(--border))'}`,
                      color: fontSize === scale.value ? `hsl(${ACCENT})` : undefined,
                      boxShadow: fontSize === scale.value ? `0 0 12px hsl(${ACCENT} / 0.1)` : undefined,
                    }}
                  >
                    <span className="text-xs font-bold block">{scale.desc}</span>
                    <span className="text-[9px] text-muted-foreground">{t(scale.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: `hsl(${ACCENT} / 0.04)`, border: `1px solid hsl(${ACCENT} / 0.1)` }}>
              <div>
                <p className="text-sm font-medium text-foreground">{t('appearance_large_text')}</p>
                <p className="text-[11px] text-muted-foreground">{t('appearance_large_text_desc')}</p>
              </div>
              <Switch checked={largeText} onCheckedChange={setLargeText} />
            </div>
            <div className="p-3 rounded-xl space-y-1" style={{ background: `hsl(${ACCENT} / 0.03)`, border: `1px solid hsl(${ACCENT} / 0.08)` }}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('appearance_preview')}</p>
              <p className="text-foreground">{t('appearance_preview_normal')}</p>
              <p className="text-sm text-muted-foreground">{t('appearance_preview_secondary')}</p>
              <p className="text-xs text-muted-foreground">{t('appearance_preview_tiny')}</p>
            </div>
          </div>
        </GlowSection>

        {/* Accessibility */}
        <GlowSection color={ACCENT}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-sm font-semibold text-foreground">{t('appearance_accessibility')}</span>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t('appearance_contrast_level')}</label>
              <div className="grid grid-cols-4 gap-2">
                {contrastOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setContrastLevel(opt.value)}
                    className="rounded-xl px-2 py-2.5 text-center transition-all"
                    style={{
                      background: contrastLevel === opt.value ? `hsl(${ACCENT} / 0.12)` : 'hsl(var(--muted) / 0.3)',
                      border: `1px solid ${contrastLevel === opt.value ? `hsl(${ACCENT} / 0.35)` : 'hsl(var(--border))'}`,
                      color: contrastLevel === opt.value ? `hsl(${ACCENT})` : undefined,
                    }}
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
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: `hsl(${ACCENT} / 0.04)`, border: `1px solid hsl(${ACCENT} / 0.1)` }}>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" /> {t('appearance_reduce_motion')}
                </p>
                <p className="text-[11px] text-muted-foreground">{t('appearance_reduce_motion_desc')}</p>
              </div>
              <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: `hsl(${ACCENT} / 0.04)`, border: `1px solid hsl(${ACCENT} / 0.1)` }}>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> {t('appearance_compact_mode')}
                </p>
                <p className="text-[11px] text-muted-foreground">{t('appearance_compact_mode_desc')}</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
          </div>
        </GlowSection>
      </main>
    </PageShell>
  );
}
