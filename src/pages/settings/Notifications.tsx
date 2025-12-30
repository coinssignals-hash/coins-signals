import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Bell, MessageCircle, Volume2, Play, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { playNotificationSound, enableAudio, SoundType } from '@/utils/notificationSound';

const soundPreviews: { type: SoundType; label: string; description: string; icon: typeof TrendingUp; color: string }[] = [
  { type: 'buy', label: 'Señal BUY', description: 'Tono ascendente alcista', icon: TrendingUp, color: 'text-green-500' },
  { type: 'sell', label: 'Señal SELL', description: 'Tono descendente bajista', icon: TrendingDown, color: 'text-red-500' },
  { type: 'alert', label: 'Alerta Crítica', description: 'Indicadores en niveles extremos', icon: AlertTriangle, color: 'text-yellow-500' },
];

export default function Notifications() {
  const { soundEnabled, toggleSound } = useNewSignalsCount();
  
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
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

      <BottomNav />
    </div>
  );
}