import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast as toastHook } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Plus, Trash2, Zap, TrendingUp, TrendingDown,
  Activity, Clock, AlertTriangle, Volume2, VolumeX, ArrowLeft,
  MessageCircle, Play, Phone, Loader2, Check, Send, Settings2
} from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';
import { Button } from '@/components/ui/button';
import { GlobalAlertsPanel } from '@/components/notifications/GlobalAlertsPanel';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { playNotificationSound, enableAudio, SoundType } from '@/utils/notificationSound';
import { useAuth } from '@/hooks/useAuth';

// ── Smart Alert types ──
type AlertType = 'price' | 'indicator' | 'pattern' | 'news' | 'volatility';
type AlertStatus = 'active' | 'triggered' | 'paused';

interface SmartAlert {
  id: string; name: string; type: AlertType; pair: string;
  condition: string; value: string; timeframe: string; status: AlertStatus;
  sound: boolean; push: boolean; createdAt: Date; triggeredAt?: Date;
  recurrence: 'once' | 'recurring';
}

const ALERT_TYPE_KEYS: { value: AlertType; labelKey: string; icon: any; color: string }[] = [
  { value: 'price', labelKey: 'sa_price', icon: TrendingUp, color: '160 84% 39%' },
  { value: 'indicator', labelKey: 'sa_indicator', icon: Activity, color: '210 80% 55%' },
  { value: 'pattern', labelKey: 'sa_pattern', icon: Zap, color: '45 95% 55%' },
  { value: 'news', labelKey: 'sa_news', icon: Bell, color: '270 70% 60%' },
  { value: 'volatility', labelKey: 'sa_volatility', icon: AlertTriangle, color: '0 84% 60%' },
];

const CONDITION_KEYS: Record<AlertType, string[]> = {
  price: ['sa_price_crosses_above', 'sa_price_crosses_below', 'sa_price_between', 'sa_price_change_pct'],
  indicator: ['sa_rsi_crosses_above', 'sa_rsi_crosses_below', 'sa_macd_bullish', 'sa_macd_bearish', 'sa_ema_golden', 'sa_ema_death'],
  pattern: ['sa_double_top', 'sa_double_bottom', 'sa_head_shoulders', 'sa_ascending_triangle', 'sa_doji_support', 'sa_engulfing_bullish'],
  news: ['sa_high_impact_news', 'sa_interest_rate', 'sa_nfp', 'sa_gdp', 'sa_cpi'],
  volatility: ['sa_atr_exceeds', 'sa_bollinger_squeeze', 'sa_volatility_expansion', 'sa_daily_range_exceeds'],
};

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'XAU/USD', 'BTC/USD', 'US500', 'NAS100'];
const ACCENT = '270 70% 60%';

// ── Notification Settings Sub-component ──
function NotificationSettingsTab() {
  const { t } = useTranslation();
  const { soundEnabled, toggleSound } = useNewSignalsCount();
  const { profile, updateProfile, user } = useAuth();

  const soundPreviews: { type: SoundType; label: string; description: string; icon: typeof TrendingUp; color: string }[] = [
    { type: 'buy', label: t('notif_buy_signal'), description: t('notif_buy_desc'), icon: TrendingUp, color: 'hsl(142 71% 45%)' },
    { type: 'sell', label: t('notif_sell_signal'), description: t('notif_sell_desc'), icon: TrendingDown, color: 'hsl(0 84% 60%)' },
    { type: 'alert', label: t('notif_critical_alert'), description: t('notif_critical_desc'), icon: AlertTriangle, color: 'hsl(48 96% 53%)' },
  ];

  const DB_MAP: Record<string, keyof Pick<NonNullable<typeof profile>, 'push_notifications_enabled' | 'signal_alerts_enabled' | 'email_notifications_enabled'>> = {
    pushNotifications: 'push_notifications_enabled',
    signalAlert: 'signal_alerts_enabled',
    email: 'email_notifications_enabled',
  };

  const loadLocalSettings = () => {
    try { const saved = localStorage.getItem('app-notification-settings'); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  };

  const [settings, setSettings] = useState(() => {
    const localSaved = loadLocalSettings();
    return {
      pushNotifications: localSaved.pushNotifications ?? true, signalAlert: localSaved.signalAlert ?? true,
      whatsapp: localSaved.whatsapp ?? true, telegram: localSaved.telegram ?? true, sms: localSaved.sms ?? false,
      email: localSaved.email ?? true, realTimeUpdate: localSaved.realTimeUpdate ?? true,
      entryOperation: localSaved.entryOperation ?? true, takeProfit: localSaved.takeProfit ?? true,
      stopLoss: localSaved.stopLoss ?? true, brokerAccount: localSaved.brokerAccount ?? false,
    };
  });

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (profile) {
      setWhatsappNumber(profile.whatsapp_number || '');
      setWhatsappEnabled(profile.whatsapp_notifications_enabled || false);
      setSettings(prev => ({
        ...prev,
        pushNotifications: profile.push_notifications_enabled ?? prev.pushNotifications,
        signalAlert: profile.signal_alerts_enabled ?? prev.signalAlert,
        email: profile.email_notifications_enabled ?? prev.email,
      }));
    }
  }, [profile]);

  useEffect(() => { localStorage.setItem('app-notification-settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { enableAudio(); }, []);

  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    if (key in DB_MAP && user) { updateProfile({ [DB_MAP[key]]: newValue } as any); }
  };

  const handleSoundToggle = () => { toggleSound(); if (!soundEnabled) playNotificationSound('signal'); };
  const handlePreviewSound = (type: SoundType) => { enableAudio(); playNotificationSound(type); };

  const handleWhatsappToggle = async (enabled: boolean) => {
    if (!user) { toast.error(t('notif_login_required') || 'Debes iniciar sesión'); return; }
    if (enabled && !whatsappNumber) { toast.error(t('notif_enter_number_first') || 'Primero ingresa tu número'); return; }
    setWhatsappEnabled(enabled);
    try {
      await updateProfile({ whatsapp_notifications_enabled: enabled });
      toast.success(enabled ? t('notif_whatsapp_enabled') || 'Alertas WhatsApp activadas' : t('notif_whatsapp_disabled') || 'Alertas WhatsApp desactivadas');
    } catch { toast.error(t('notif_config_error') || 'Error al actualizar'); setWhatsappEnabled(!enabled); }
  };

  const handleSaveWhatsappNumber = async () => {
    if (!user) { toast.error(t('notif_login_required')); return; }
    if (!whatsappNumber) { toast.error(t('notif_invalid_number')); return; }
    const cleanNumber = whatsappNumber.replace(/\s/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanNumber)) { toast.error(t('notif_invalid_number') || 'Formato inválido'); return; }
    setSavingWhatsapp(true);
    try {
      await updateProfile({ whatsapp_number: cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}` });
      setWhatsappSaved(true); toast.success(t('notif_whatsapp_saved') || 'Número guardado');
      setTimeout(() => setWhatsappSaved(false), 2000);
    } catch { toast.error(t('notif_save_error') || 'Error al guardar'); } finally { setSavingWhatsapp(false); }
  };

  const handleSendTestMessage = async () => {
    if (!whatsappNumber) { toast.error(t('notif_enter_number_first')); return; }
    const cleanNumber = whatsappNumber.replace(/\s/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanNumber)) { toast.error(t('notif_invalid_number')); return; }
    setSendingTest(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '' },
        body: JSON.stringify({ to: cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`, message: t('notif_test_message') || '🧪 ¡Mensaje de prueba!' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || 'Error');
      toast.success(t('notif_test_sent') || '¡Mensaje enviado!');
    } catch (error) { toast.error(error instanceof Error ? error.message : (t('notif_test_error') || 'Error')); } finally { setSendingTest(false); }
  };

  return (
    <div className="space-y-4">
      <GlobalAlertsPanel />

      {/* Push Notifications */}
      <GlowSection color={ACCENT}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            <span className="text-sm font-semibold text-foreground">{t('notif_settings')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t('notif_push_enable')}</span>
            <Switch checked={settings.pushNotifications} onCheckedChange={() => toggleSetting('pushNotifications')} />
          </div>
        </div>
      </GlowSection>

      {/* WhatsApp */}
      <GlowSection color="142 71% 45%">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color: 'hsl(142 71% 45%)' }} />
            <span className="text-sm font-semibold text-foreground">{t('notif_whatsapp_title')}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('notif_whatsapp_desc')}</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t('notif_whatsapp_number')}</label>
              <div className="flex gap-2">
                <Input type="tel" placeholder="+1234567890" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="flex-1 bg-background/50 border-white/10" />
                <button onClick={handleSaveWhatsappNumber} disabled={savingWhatsapp || !whatsappNumber} className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40" style={{ background: 'hsl(142 71% 45%)' }}>
                  {savingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin" /> : whatsappSaved ? <Check className="w-4 h-4" /> : t('notif_whatsapp_save')}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: 'hsl(142 71% 45% / 0.05)', border: '1px solid hsl(142 71% 45% / 0.15)' }}>
              <div>
                <span className="text-sm text-foreground">{t('notif_whatsapp_enable')}</span>
                <p className="text-xs text-muted-foreground">{t('notif_whatsapp_critical')}</p>
              </div>
              <Switch checked={whatsappEnabled} onCheckedChange={handleWhatsappToggle} disabled={!whatsappNumber} />
            </div>
            <button onClick={handleSendTestMessage} disabled={sendingTest || !whatsappNumber} className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2" style={{ border: '1px solid hsl(142 71% 45% / 0.4)', color: 'hsl(142 71% 45%)' }}>
              {sendingTest ? (<><Loader2 className="w-4 h-4 animate-spin" />{t('notif_whatsapp_sending')}</>) : (<><Send className="w-4 h-4" />{t('notif_whatsapp_test')}</>)}
            </button>
            <div className="p-3 rounded-lg" style={{ background: 'hsl(48 96% 53% / 0.08)', border: '1px solid hsl(48 96% 53% / 0.15)' }}>
              <p className="text-xs" style={{ color: 'hsl(48 96% 53%)' }}><strong>Nota:</strong> {t('notif_whatsapp_note')}</p>
            </div>
          </div>
        </div>
      </GlowSection>

      {/* Signal Alerts */}
      <GlowSection color={ACCENT}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            <span className="text-sm font-semibold text-foreground">{t('notif_signal_alert')}</span>
          </div>
          {[
            { key: 'whatsapp', label: 'Whatsapp' }, { key: 'telegram', label: 'Telegram' },
            { key: 'sms', label: t('notif_sms') }, { key: 'email', label: t('notif_email') },
          ].map((item, i, arr) => (
            <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: i < arr.length - 1 ? `1px solid hsl(${ACCENT} / 0.1)` : 'none' }}>
              <span className="text-sm text-foreground">{item.label}</span>
              <Switch checked={settings[item.key as keyof typeof settings]} onCheckedChange={() => toggleSetting(item.key as keyof typeof settings)} />
            </div>
          ))}
        </div>
      </GlowSection>

      {/* Sound Settings */}
      <GlowSection color={ACCENT}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            <span className="text-sm font-semibold text-foreground">{t('notif_alert_sound')}</span>
          </div>
          <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid hsl(${ACCENT} / 0.1)` }}>
            <div>
              <span className="text-sm text-foreground">{t('notif_new_signal_sound')}</span>
              <p className="text-xs text-muted-foreground">{t('notif_new_signal_sound_desc')}</p>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
          </div>
          <div className="py-4" style={{ borderBottom: `1px solid hsl(${ACCENT} / 0.1)` }}>
            <p className="text-xs text-muted-foreground mb-3">{t('notif_preview_sounds')}</p>
            <div className="grid grid-cols-1 gap-2">
              {soundPreviews.map((sound) => {
                const Icon = sound.icon;
                return (
                  <button key={sound.type} onClick={() => handlePreviewSound(sound.type)} className="flex items-center gap-3 p-3 rounded-xl text-left group transition-all active:scale-[0.98]" style={{
                    background: `hsl(${ACCENT} / 0.04)`, border: `1px solid hsl(${ACCENT} / 0.1)`,
                  }}>
                    <div className="p-2 rounded-full" style={{ background: `${sound.color.replace(')', ' / 0.15)')}` }}><Icon className="w-4 h-4" style={{ color: sound.color }} /></div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{sound.label}</span>
                      <p className="text-xs text-muted-foreground">{sound.description}</p>
                    </div>
                    <div className="p-2 rounded-full" style={{ background: `hsl(${ACCENT} / 0.1)` }}><Play className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} /></div>
                  </button>
                );
              })}
            </div>
          </div>
          {[
            { key: 'realTimeUpdate', label: t('notif_realtime') }, { key: 'entryOperation', label: t('notif_entry_op') },
            { key: 'takeProfit', label: 'Take Profit' }, { key: 'stopLoss', label: 'Stop Loss' },
          ].map((item, i, arr) => (
            <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: i < arr.length - 1 ? `1px solid hsl(${ACCENT} / 0.1)` : 'none' }}>
              <span className="text-sm text-foreground">{item.label}</span>
              <Switch checked={settings[item.key as keyof typeof settings]} onCheckedChange={() => toggleSetting(item.key as keyof typeof settings)} />
            </div>
          ))}
        </div>
      </GlowSection>

      {/* Broker Account */}
      <GlowSection color={ACCENT}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t('notif_broker_alert')}</span>
            <Switch checked={settings.brokerAccount} onCheckedChange={() => toggleSetting('brokerAccount')} />
          </div>
        </div>
      </GlowSection>
    </div>
  );
}

// ── Smart Alerts Tab Sub-component ──
function SmartAlertsTab() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<SmartAlert[]>([
    { id: '1', name: 'RSI Oversold EUR/USD', type: 'indicator', pair: 'EUR/USD', condition: 'sa_rsi_crosses_below', value: '30', timeframe: 'H1', status: 'active', sound: true, push: true, createdAt: new Date(), recurrence: 'recurring' },
    { id: '2', name: 'Gold Price Alert', type: 'price', pair: 'XAU/USD', condition: 'sa_price_crosses_above', value: '2450', timeframe: 'M15', status: 'triggered', sound: true, push: true, createdAt: new Date(Date.now() - 86400000), triggeredAt: new Date(Date.now() - 3600000), recurrence: 'once' },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<SmartAlert>>({
    type: 'price', pair: 'EUR/USD', condition: '', value: '', timeframe: 'H1', sound: true, push: true, recurrence: 'once', name: '',
  });

  const createAlert = () => {
    if (!newAlert.condition || !newAlert.value) { toastHook({ title: t('sa_complete_fields'), variant: 'destructive' }); return; }
    const alert: SmartAlert = {
      id: crypto.randomUUID(), name: newAlert.name || `${newAlert.pair} ${t(newAlert.condition!)}`,
      type: newAlert.type as AlertType, pair: newAlert.pair!, condition: newAlert.condition!, value: newAlert.value!,
      timeframe: newAlert.timeframe!, status: 'active', sound: newAlert.sound!, push: newAlert.push!,
      createdAt: new Date(), recurrence: newAlert.recurrence as 'once' | 'recurring',
    };
    setAlerts(prev => [alert, ...prev]);
    setShowCreate(false);
    setNewAlert({ type: 'price', pair: 'EUR/USD', condition: '', value: '', timeframe: 'H1', sound: true, push: true, recurrence: 'once', name: '' });
    toastHook({ title: t('sa_alert_created') });
  };

  const toggleStatus = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
  const deleteAlert = (id: string) => { setAlerts(prev => prev.filter(a => a.id !== id)); toastHook({ title: t('sa_alert_deleted') }); };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const triggeredCount = alerts.filter(a => a.status === 'triggered').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t('sa_active'), value: activeCount, icon: BellRing, color: '160 84% 39%' },
          { label: t('sa_triggered'), value: triggeredCount, icon: Zap, color: '45 95% 55%' },
          { label: t('sa_total'), value: alerts.length, icon: Bell, color: '210 80% 55%' },
        ].map(s => (
          <GlowSection key={s.label} color={s.color}>
            <div className="p-3 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg flex items-center justify-center" style={{
                background: `hsl(${s.color} / 0.15)`,
                boxShadow: `0 0 10px hsl(${s.color} / 0.1)`,
              }}>
                <s.icon className="w-4 h-4" style={{ color: `hsl(${s.color})` }} />
              </div>
              <div className="text-lg font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </div>
          </GlowSection>
        ))}
      </div>

      {/* Create button */}
      <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
        onClick={() => setShowCreate(!showCreate)}
        style={{
          background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
          border: `1px solid hsl(${ACCENT} / 0.5)`,
          boxShadow: `0 0 20px hsl(${ACCENT} / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.1)`,
        }}>
        <Plus className="w-4 h-4" /> {t('sa_new_alert')}
      </button>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlowSection color={ACCENT}>
              <div className="p-4 space-y-3">
                <Input placeholder={t('sa_alert_name_placeholder')} value={newAlert.name} onChange={e => setNewAlert(a => ({ ...a, name: e.target.value }))}
                  className="h-9 border-0 bg-transparent placeholder:text-muted-foreground/40 focus-visible:ring-0"
                  style={{ borderBottom: `1px solid hsl(${ACCENT} / 0.2)` }} />
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {ALERT_TYPES.map(at => (
                    <button key={at.value}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap active:scale-95"
                      style={{
                        background: newAlert.type === at.value ? `hsl(${at.color} / 0.15)` : 'hsl(var(--muted) / 0.5)',
                        border: newAlert.type === at.value ? `1px solid hsl(${at.color} / 0.4)` : '1px solid transparent',
                        color: newAlert.type === at.value ? `hsl(${at.color})` : undefined,
                        boxShadow: newAlert.type === at.value ? `0 0 8px hsl(${at.color} / 0.1)` : undefined,
                      }}
                      onClick={() => setNewAlert(a => ({ ...a, type: at.value, condition: '' }))}
                    >
                      <at.icon className="w-3 h-3" /> {at.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newAlert.pair} onValueChange={v => setNewAlert(a => ({ ...a, pair: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-background/40 border-border/30"><SelectValue placeholder="Par" /></SelectTrigger>
                    <SelectContent>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newAlert.timeframe} onValueChange={v => setNewAlert(a => ({ ...a, timeframe: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-background/40 border-border/30"><SelectValue placeholder="TF" /></SelectTrigger>
                    <SelectContent>{['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Select value={newAlert.condition} onValueChange={v => setNewAlert(a => ({ ...a, condition: v }))}>
                  <SelectTrigger className="h-9 text-xs bg-background/40 border-border/30"><SelectValue placeholder="Condición..." /></SelectTrigger>
                  <SelectContent>{(CONDITIONS[newAlert.type as AlertType] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Valor (ej: 1.0850, 30, etc.)" value={newAlert.value} onChange={e => setNewAlert(a => ({ ...a, value: e.target.value }))} className="h-9 bg-background/40 border-border/30" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch checked={newAlert.sound} onCheckedChange={v => setNewAlert(a => ({ ...a, sound: v }))} />
                      {newAlert.sound ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch checked={newAlert.push} onCheckedChange={v => setNewAlert(a => ({ ...a, push: v }))} />
                      <Bell className="w-3 h-3" />
                    </label>
                  </div>
                  <Select value={newAlert.recurrence} onValueChange={v => setNewAlert(a => ({ ...a, recurrence: v as any }))}>
                    <SelectTrigger className="h-8 text-xs w-[110px] bg-background/40 border-border/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Una vez</SelectItem>
                      <SelectItem value="recurring">Recurrente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                  onClick={createAlert}
                  style={{
                    background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                    border: `1px solid hsl(${ACCENT} / 0.4)`,
                    boxShadow: `0 0 15px hsl(${ACCENT} / 0.2)`,
                  }}>
                  <Zap className="w-4 h-4" /> Crear Alerta
                </button>
              </div>
            </GlowSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert list */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
          <Bell className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
          ALERTAS CONFIGURADAS
        </h3>
        <AnimatePresence mode="popLayout">
          {alerts.map(alert => {
            const typeInfo = ALERT_TYPES.find(at => at.value === alert.type);
            const Icon = typeInfo?.icon || Bell;
            const alertColor = typeInfo?.color || ACCENT;
            const isActive = alert.status === 'active';

            return (
              <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80 }} layout>
                <GlowSection color={alertColor}>
                  <div className="p-3" style={{ borderLeft: `3px solid hsl(${alertColor})` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                          background: `hsl(${alertColor} / 0.15)`,
                          boxShadow: `0 0 10px hsl(${alertColor} / 0.1)`,
                        }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${alertColor})` }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-tight text-foreground">{alert.name}</div>
                          <div className="text-[11px] text-muted-foreground">{alert.pair} · {alert.timeframe}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold" style={{
                        borderColor: `hsl(${isActive ? '160 84% 39%' : alert.status === 'triggered' ? '45 95% 55%' : 'var(--border)'} / 0.4)`,
                        color: `hsl(${isActive ? '160 84% 39%' : alert.status === 'triggered' ? '45 95% 55%' : 'var(--muted-foreground)'})`,
                        background: `hsl(${isActive ? '160 84% 39%' : alert.status === 'triggered' ? '45 95% 55%' : 'var(--muted)'} / 0.1)`,
                      }}>
                        {alert.status === 'active' ? '● Activa' : alert.status === 'triggered' ? '⚡ Disparada' : '⏸ Pausa'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 rounded-lg px-2.5 py-1.5" style={{
                      background: 'linear-gradient(165deg, hsl(var(--card) / 0.5), hsl(var(--background) / 0.3))',
                      border: '1px solid hsl(var(--border) / 0.1)',
                    }}>
                      {alert.condition} <span className="font-mono font-bold text-foreground">{alert.value}</span>
                      {alert.recurrence === 'recurring' && <Badge variant="outline" className="ml-2 text-[9px]" style={{ borderColor: `hsl(${alertColor} / 0.3)`, color: `hsl(${alertColor})` }}>↻</Badge>}
                    </div>
                    {alert.triggeredAt && (
                      <div className="text-[10px] flex items-center gap-1 mb-2" style={{ color: 'hsl(45 95% 55%)' }}>
                        <Clock className="w-3 h-3" /> Disparada: {alert.triggeredAt.toLocaleString()}
                      </div>
                    )}
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleStatus(alert.id)}
                        className="px-2.5 h-7 rounded-lg text-[11px] font-medium transition-all active:scale-95"
                        style={{
                          background: 'hsl(var(--card) / 0.6)',
                          border: '1px solid hsl(var(--border) / 0.2)',
                          color: 'hsl(var(--foreground) / 0.7)',
                        }}>
                        {alert.status === 'active' ? 'Pausar' : 'Activar'}
                      </button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 rounded-lg" onClick={() => deleteAlert(alert.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </GlowSection>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Unified Page ──
type TabKey = 'alerts' | 'settings';

export default function SmartAlerts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // If arrived from /settings/notifications, default to settings tab
  const initialTab: TabKey = location.pathname.includes('notifications') ? 'settings' : 'alerts';
  const [tab, setTab] = useState<TabKey>(initialTab);

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: 'alerts', label: t('drawer_smart_alerts') || 'Alertas', icon: BellRing },
    { key: 'settings', label: t('notif_settings') || 'Configuración', icon: Settings2 },
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${ACCENT} / 0.5), transparent 70%)`,
        }} />

        <div className="relative px-4 py-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90"
              style={{ background: `hsl(${ACCENT} / 0.1)`, border: `1px solid hsl(${ACCENT} / 0.2)` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
                border: `1px solid hsl(${ACCENT} / 0.3)`,
                boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
              }}>
                <BellRing className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {t('drawer_smart_alerts') || 'Alertas y Notificaciones'}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Alertas inteligentes y configuración de notificaciones
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.3), transparent)`,
        }} />
      </div>

      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        {/* Tab bar */}
        <div className="flex rounded-xl p-1" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.3)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all"
              style={tab === t.key ? {
                background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                color: 'white',
                boxShadow: `0 2px 8px hsl(${ACCENT} / 0.3)`,
              } : { color: 'hsl(var(--muted-foreground))' }}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tab === 'alerts' && <SmartAlertsTab />}
            {tab === 'settings' && <NotificationSettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
