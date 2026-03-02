import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Bell, MessageCircle, Volume2, Play, TrendingUp, TrendingDown, AlertTriangle, Phone, Loader2, Check, Send } from 'lucide-react';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { playNotificationSound, enableAudio, SoundType } from '@/utils/notificationSound';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const soundPreviews: { type: SoundType; label: string; description: string; icon: typeof TrendingUp; color: string }[] = [
  { type: 'buy', label: 'Señal BUY', description: 'Tono ascendente alcista', icon: TrendingUp, color: 'text-green-500' },
  { type: 'sell', label: 'Señal SELL', description: 'Tono descendente bajista', icon: TrendingDown, color: 'text-red-500' },
  { type: 'alert', label: 'Alerta Crítica', description: 'Indicadores en niveles extremos', icon: AlertTriangle, color: 'text-yellow-500' },
];

export default function Notifications() {
  const { soundEnabled, toggleSound } = useNewSignalsCount();
  const { profile, updateProfile, user } = useAuth();
  
  const [settings, setSettings] = useState({
    pushNotifications: true,
    signalAlert: true,
    whatsapp: true,
    telegram: true,
    sms: false,
    email: true,
    realTimeUpdate: true,
    entryOperation: true,
    takeProfit: true,
    stopLoss: true,
    brokerAccount: false,
  });

  // WhatsApp configuration
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Load WhatsApp settings from profile
  useEffect(() => {
    if (profile) {
      setWhatsappNumber(profile.whatsapp_number || '');
      setWhatsappEnabled(profile.whatsapp_notifications_enabled || false);
    }
  }, [profile]);

  // Enable audio on page load (user already interacted to get here)
  useEffect(() => {
    enableAudio();
  }, []);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSoundToggle = () => {
    toggleSound();
    if (!soundEnabled) {
      // Play a preview sound when enabling
      playNotificationSound('signal');
    }
  };

  const handlePreviewSound = (type: SoundType) => {
    enableAudio();
    playNotificationSound(type);
  };

  const handleWhatsappToggle = async (enabled: boolean) => {
    if (!user) {
      toast.error('Debes iniciar sesión para activar WhatsApp');
      return;
    }

    if (enabled && !whatsappNumber) {
      toast.error('Primero ingresa tu número de WhatsApp');
      return;
    }

    setWhatsappEnabled(enabled);
    
    try {
      await updateProfile({
        whatsapp_notifications_enabled: enabled,
      });
      toast.success(enabled ? 'Alertas WhatsApp activadas' : 'Alertas WhatsApp desactivadas');
    } catch {
      toast.error('Error al actualizar configuración');
      setWhatsappEnabled(!enabled);
    }
  };

  const handleSaveWhatsappNumber = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar tu número');
      return;
    }

    if (!whatsappNumber) {
      toast.error('Ingresa un número de WhatsApp válido');
      return;
    }

    // Basic validation for phone number format
    const cleanNumber = whatsappNumber.replace(/\s/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanNumber)) {
      toast.error('Formato inválido. Usa formato internacional: +1234567890');
      return;
    }

    setSavingWhatsapp(true);
    
    try {
      await updateProfile({
        whatsapp_number: cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`,
      });
      setWhatsappSaved(true);
      toast.success('Número de WhatsApp guardado');
      
      setTimeout(() => setWhatsappSaved(false), 2000);
    } catch {
      toast.error('Error al guardar número');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!whatsappNumber) {
      toast.error('Primero ingresa y guarda tu número de WhatsApp');
      return;
    }

    const cleanNumber = whatsappNumber.replace(/\s/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanNumber)) {
      toast.error('Número de WhatsApp inválido');
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
            message: '🧪 ¡Mensaje de prueba!\n\nTu configuración de WhatsApp está funcionando correctamente. Recibirás alertas críticas de portfolio aquí.',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Error al enviar');
      }

      toast.success('¡Mensaje de prueba enviado! Revisa tu WhatsApp.');
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje de prueba');
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
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <span className="text-xs text-muted-foreground">ID # 0572564</span>
            <h1 className="text-xl font-bold text-foreground">Notificaciones</h1>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-primary">Ajuste de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">Activar Notificaciones push</span>
                </div>
                <Switch 
                  checked={settings.pushNotifications} 
                  onCheckedChange={() => toggleSetting('pushNotifications')}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Configuration Card */}
          <Card className="bg-card border-border border-green-500/20">
            <CardHeader>
              <CardTitle className="text-sm text-green-500 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Alertas WhatsApp (Portfolio)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Recibe alertas críticas de tu portfolio por WhatsApp: cambios significativos de PnL (±10%), uso de margen alto (≥90%).
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Número de WhatsApp (formato internacional)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="flex-1 bg-secondary/50"
                    />
                    <Button 
                      onClick={handleSaveWhatsappNumber}
                      disabled={savingWhatsapp || !whatsappNumber}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingWhatsapp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : whatsappSaved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        'Guardar'
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 bg-secondary/30 rounded-lg px-3">
                  <div>
                    <span className="text-sm text-foreground">Activar alertas WhatsApp</span>
                    <p className="text-xs text-muted-foreground">Solo para alertas críticas</p>
                  </div>
                  <Switch 
                    checked={whatsappEnabled} 
                    onCheckedChange={handleWhatsappToggle}
                    disabled={!whatsappNumber}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                {/* Test Message Button */}
                <Button
                  onClick={handleSendTestMessage}
                  disabled={sendingTest || !whatsappNumber}
                  variant="outline"
                  className="w-full border-green-500/50 text-green-600 hover:bg-green-500/10"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar mensaje de prueba
                    </>
                  )}
                </Button>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    <strong>Nota:</strong> Para recibir mensajes, primero debes enviar "join" al número de WhatsApp sandbox de Twilio para unirte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Aviso De Señal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { key: 'whatsapp', label: 'Whatsapp' },
                { key: 'telegram', label: 'Telegram' },
                { key: 'sms', label: 'Mensaje de Texto' },
                { key: 'email', label: 'Correo' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <Switch 
                    checked={settings[item.key as keyof typeof settings]} 
                    onCheckedChange={() => toggleSetting(item.key as keyof typeof settings)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sonido de Alerta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <span className="text-sm text-foreground">Sonido de Nuevas Señales</span>
                  <p className="text-xs text-muted-foreground">Reproduce un sonido cuando llegue una nueva señal</p>
                </div>
                <Switch 
                  checked={soundEnabled} 
                  onCheckedChange={handleSoundToggle}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              {/* Sound Previews */}
              <div className="py-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-3">Previsualizar sonidos:</p>
                <div className="grid grid-cols-1 gap-2">
                  {soundPreviews.map((sound) => {
                    const Icon = sound.icon;
                    return (
                      <button
                        key={sound.type}
                        onClick={() => handlePreviewSound(sound.type)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                      >
                        <div className={`p-2 rounded-full bg-background ${sound.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">{sound.label}</span>
                          <p className="text-xs text-muted-foreground">{sound.description}</p>
                        </div>
                        <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Play className="w-4 h-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {[
                { key: 'realTimeUpdate', label: 'Actualización en Tiempo Real' },
                { key: 'entryOperation', label: 'Operación Entrada' },
                { key: 'takeProfit', label: 'Take Profit' },
                { key: 'stopLoss', label: 'Stop Loss' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <Switch 
                    checked={settings[item.key as keyof typeof settings]} 
                    onCheckedChange={() => toggleSetting(item.key as keyof typeof settings)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Alertar Cuenta Broker</span>
                <Switch 
                  checked={settings.brokerAccount} 
                  onCheckedChange={() => toggleSetting('brokerAccount')}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}
