import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { GlowSection } from '@/components/ui/glow-section';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Bell, MessageCircle, Volume2, Play, TrendingUp, TrendingDown, AlertTriangle, Phone, Loader2, Check, Send } from 'lucide-react';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { GlobalAlertsPanel } from '@/components/notifications/GlobalAlertsPanel';
import { playNotificationSound, enableAudio, SoundType } from '@/utils/notificationSound';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

const ACCENT = '38 95% 55%';

export default function Notifications() {
  const { soundEnabled, toggleSound } = useNewSignalsCount();
  const { profile, updateProfile, user } = useAuth();
  const { t } = useTranslation();

  const soundPreviews: { type: SoundType; label: string; description: string; icon: typeof TrendingUp; color: string }[] = [
    { type: 'buy', label: t('notif_buy_signal'), description: t('notif_buy_desc'), icon: TrendingUp, color: 'hsl(142 71% 45%)' },
    { type: 'sell', label: t('notif_sell_signal'), description: t('notif_sell_desc'), icon: TrendingDown, color: 'hsl(0 84% 60%)' },
    { type: 'alert', label: t('notif_critical_alert'), description: t('notif_critical_desc'), icon: AlertTriangle, color: 'hsl(48 96% 53%)' },
  ];

  const DB_KEYS = ['pushNotifications', 'signalAlert', 'email'] as const;
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
              <Bell className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{t('notif_title')}</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: `hsl(${ACCENT} / 0.5)` }}>ID # 0572564</p>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
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
      </main>
    </PageShell>
  );
}
