import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Bell, MessageCircle, Volume2, Play, TrendingUp, TrendingDown, AlertTriangle, Phone, Loader2, Check, Send } from 'lucide-react';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { GlobalAlertsPanel } from '@/components/notifications/GlobalAlertsPanel';
import { playNotificationSound, enableAudio, SoundType } from '@/utils/notificationSound';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

export default function Notifications() {
  const { soundEnabled, toggleSound } = useNewSignalsCount();
  const { profile, updateProfile, user } = useAuth();
  const { t } = useTranslation();

  const soundPreviews: { type: SoundType; label: string; description: string; icon: typeof TrendingUp; color: string }[] = [
    { type: 'buy', label: t('notif_buy_signal'), description: t('notif_buy_desc'), icon: TrendingUp, color: 'text-green-500' },
    { type: 'sell', label: t('notif_sell_signal'), description: t('notif_sell_desc'), icon: TrendingDown, color: 'text-red-500' },
    { type: 'alert', label: t('notif_critical_alert'), description: t('notif_critical_desc'), icon: AlertTriangle, color: 'text-yellow-500' },
  ];
  
  // Keys stored in profile DB
  const DB_KEYS = ['pushNotifications', 'signalAlert', 'email'] as const;
  const DB_MAP: Record<string, keyof Pick<NonNullable<typeof profile>, 'push_notifications_enabled' | 'signal_alerts_enabled' | 'email_notifications_enabled'>> = {
    pushNotifications: 'push_notifications_enabled',
    signalAlert: 'signal_alerts_enabled',
    email: 'email_notifications_enabled',
  };

  // Load persisted local settings
  const loadLocalSettings = () => {
    try {
      const saved = localStorage.getItem('app-notification-settings');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  };

  const [settings, setSettings] = useState(() => {
    const localSaved = loadLocalSettings();
    return {
      pushNotifications: localSaved.pushNotifications ?? true,
      signalAlert: localSaved.signalAlert ?? true,
      whatsapp: localSaved.whatsapp ?? true,
      telegram: localSaved.telegram ?? true,
      sms: localSaved.sms ?? false,
      email: localSaved.email ?? true,
      realTimeUpdate: localSaved.realTimeUpdate ?? true,
      entryOperation: localSaved.entryOperation ?? true,
      takeProfit: localSaved.takeProfit ?? true,
      stopLoss: localSaved.stopLoss ?? true,
      brokerAccount: localSaved.brokerAccount ?? false,
    };
  });

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Sync from profile DB on load
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

  // Persist all settings changes
  useEffect(() => {
    localStorage.setItem('app-notification-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    enableAudio();
  }, []);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSoundToggle = () => {
    toggleSound();
    if (!soundEnabled) {
      playNotificationSound('signal');
    }
  };

  const handlePreviewSound = (type: SoundType) => {
    enableAudio();
    playNotificationSound(type);
  };

  const handleWhatsappToggle = async (enabled: boolean) => {
    if (!user) {
      toast.error(t('notif_login_required') || 'Debes iniciar sesión para activar WhatsApp');
      return;
    }
    if (enabled && !whatsappNumber) {
      toast.error(t('notif_enter_number_first') || 'Primero ingresa tu número de WhatsApp');
      return;
    }
    setWhatsappEnabled(enabled);
    try {
      await updateProfile({ whatsapp_notifications_enabled: enabled });
      toast.success(enabled ? t('notif_whatsapp_enabled') || 'Alertas WhatsApp activadas' : t('notif_whatsapp_disabled') || 'Alertas WhatsApp desactivadas');
    } catch {
      toast.error(t('notif_config_error') || 'Error al actualizar configuración');
      setWhatsappEnabled(!enabled);
    }
  };

  const handleSaveWhatsappNumber = async () => {
    if (!user) {
      toast.error(t('notif_login_required') || 'Debes iniciar sesión para guardar tu número');
      return;
    }
    if (!whatsappNumber) {
      toast.error(t('notif_invalid_number') || 'Ingresa un número de WhatsApp válido');
      return;
    }
    const cleanNumber = whatsappNumber.replace(/\s/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanNumber)) {
      toast.error(t('notif_invalid_number') || 'Formato inválido. Usa formato internacional: +1234567890');
      return;
    }
    setSavingWhatsapp(true);
    try {
      await updateProfile({ whatsapp_number: cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}` });
      setWhatsappSaved(true);
      toast.success(t('notif_whatsapp_saved') || 'Número de WhatsApp guardado');
      setTimeout(() => setWhatsappSaved(false), 2000);
    } catch {
      toast.error(t('notif_save_error') || 'Error al guardar número');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!whatsappNumber) {
      toast.error(t('notif_enter_number_first') || 'Primero ingresa y guarda tu número de WhatsApp');
      return;
    }
    const cleanNumber = whatsappNumber.replace(/\s/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanNumber)) {
      toast.error(t('notif_invalid_number') || 'Número de WhatsApp inválido');
      return;
    }
    setSendingTest(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify({
            to: cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`,
            message: t('notif_test_message') || '🧪 ¡Mensaje de prueba!\n\nTu configuración de WhatsApp está funcionando correctamente.',
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || 'Error al enviar');
      toast.success(t('notif_test_sent') || '¡Mensaje de prueba enviado! Revisa tu WhatsApp.');
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error(error instanceof Error ? error.message : (t('notif_test_error') || 'Error al enviar mensaje de prueba'));
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <PageShell>
      <Header />
      <main className="py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/settings">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <span className="text-xs text-muted-foreground">ID # 0572564</span>
            <h1 className="text-xl font-bold text-foreground">{t('notif_title')}</h1>
          </div>
        </div>

        <div className="space-y-4">
          <GlobalAlertsPanel />

          <GlowCard>
            <CardHeader><CardTitle className="text-sm text-primary">{t('notif_settings')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">{t('notif_push_enable')}</span>
                </div>
                <Switch checked={settings.pushNotifications} onCheckedChange={() => toggleSetting('pushNotifications')} className="data-[state=checked]:bg-primary" />
              </div>
            </CardContent>
          </GlowCard>

          <Card className="bg-card border-border border-green-500/20">
            <CardHeader>
              <CardTitle className="text-sm text-green-500 flex items-center gap-2">
                <Phone className="w-4 h-4" />{t('notif_whatsapp_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">{t('notif_whatsapp_desc')}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t('notif_whatsapp_number')}</label>
                  <div className="flex gap-2">
                    <Input type="tel" placeholder="+1234567890" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="flex-1 bg-secondary/50" />
                    <Button onClick={handleSaveWhatsappNumber} disabled={savingWhatsapp || !whatsappNumber} size="sm" className="bg-green-600 hover:bg-green-700">
                      {savingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin" /> : whatsappSaved ? <Check className="w-4 h-4" /> : t('notif_whatsapp_save')}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 bg-secondary/30 rounded-lg px-3">
                  <div>
                    <span className="text-sm text-foreground">{t('notif_whatsapp_enable')}</span>
                    <p className="text-xs text-muted-foreground">{t('notif_whatsapp_critical')}</p>
                  </div>
                  <Switch checked={whatsappEnabled} onCheckedChange={handleWhatsappToggle} disabled={!whatsappNumber} className="data-[state=checked]:bg-green-500" />
                </div>
                <Button onClick={handleSendTestMessage} disabled={sendingTest || !whatsappNumber} variant="outline" className="w-full border-green-500/50 text-green-600 hover:bg-green-500/10">
                  {sendingTest ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('notif_whatsapp_sending')}</>) : (<><Send className="w-4 h-4 mr-2" />{t('notif_whatsapp_test')}</>)}
                </Button>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400"><strong>Nota:</strong> {t('notif_whatsapp_note')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <GlowCard>
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />{t('notif_signal_alert')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { key: 'whatsapp', label: 'Whatsapp' },
                { key: 'telegram', label: 'Telegram' },
                { key: 'sms', label: t('notif_sms') },
                { key: 'email', label: t('notif_email') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <Switch checked={settings[item.key as keyof typeof settings]} onCheckedChange={() => toggleSetting(item.key as keyof typeof settings)} className="data-[state=checked]:bg-primary" />
                </div>
              ))}
            </CardContent>
          </GlowCard>

          <GlowCard>
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Volume2 className="w-4 h-4" />{t('notif_alert_sound')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <span className="text-sm text-foreground">{t('notif_new_signal_sound')}</span>
                  <p className="text-xs text-muted-foreground">{t('notif_new_signal_sound_desc')}</p>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} className="data-[state=checked]:bg-primary" />
              </div>
              <div className="py-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-3">{t('notif_preview_sounds')}</p>
                <div className="grid grid-cols-1 gap-2">
                  {soundPreviews.map((sound) => {
                    const Icon = sound.icon;
                    return (
                      <button key={sound.type} onClick={() => handlePreviewSound(sound.type)} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group">
                        <div className={`p-2 rounded-full bg-background ${sound.color}`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">{sound.label}</span>
                          <p className="text-xs text-muted-foreground">{sound.description}</p>
                        </div>
                        <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Play className="w-4 h-4" /></div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {[
                { key: 'realTimeUpdate', label: t('notif_realtime') },
                { key: 'entryOperation', label: t('notif_entry_op') },
                { key: 'takeProfit', label: 'Take Profit' },
                { key: 'stopLoss', label: 'Stop Loss' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <Switch checked={settings[item.key as keyof typeof settings]} onCheckedChange={() => toggleSetting(item.key as keyof typeof settings)} className="data-[state=checked]:bg-primary" />
                </div>
              ))}
            </CardContent>
          </GlowCard>

          <GlowCard>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t('notif_broker_alert')}</span>
                <Switch checked={settings.brokerAccount} onCheckedChange={() => toggleSetting('brokerAccount')} className="data-[state=checked]:bg-primary" />
              </div>
            </CardContent>
          </GlowCard>
        </div>
      </main>
    </PageShell>
  );
}
