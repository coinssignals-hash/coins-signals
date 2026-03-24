import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Plus, Trash2, Zap, TrendingUp, TrendingDown,
  Activity, Clock, AlertTriangle, Volume2, VolumeX
} from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';

type AlertType = 'price' | 'indicator' | 'pattern' | 'news' | 'volatility';
type AlertStatus = 'active' | 'triggered' | 'paused';

interface SmartAlert {
  id: string; name: string; type: AlertType; pair: string;
  condition: string; value: string; timeframe: string; status: AlertStatus;
  sound: boolean; push: boolean; createdAt: Date; triggeredAt?: Date;
  recurrence: 'once' | 'recurring';
}

const ALERT_TYPES: { value: AlertType; label: string; icon: any; color: string }[] = [
  { value: 'price', label: 'Precio', icon: TrendingUp, color: '160 84% 39%' },
  { value: 'indicator', label: 'Indicador', icon: Activity, color: '210 80% 55%' },
  { value: 'pattern', label: 'Patrón', icon: Zap, color: '45 95% 55%' },
  { value: 'news', label: 'Noticias', icon: Bell, color: '270 70% 60%' },
  { value: 'volatility', label: 'Volatilidad', icon: AlertTriangle, color: '0 84% 60%' },
];

const CONDITIONS: Record<AlertType, string[]> = {
  price: ['Precio cruza arriba de', 'Precio cruza abajo de', 'Precio entre rango', 'Cambio % en'],
  indicator: ['RSI cruza arriba de', 'RSI cruza abajo de', 'MACD cruce alcista', 'MACD cruce bajista', 'EMA cruce dorado', 'EMA cruce muerte'],
  pattern: ['Doble techo detectado', 'Doble suelo detectado', 'Hombro-Cabeza-Hombro', 'Triángulo ascendente', 'Doji en soporte', 'Engulfing alcista'],
  news: ['Noticia alto impacto', 'Decisión tasa interés', 'NFP/Empleo', 'PIB publicación', 'CPI/Inflación'],
  volatility: ['ATR supera', 'Bollinger squeeze', 'Expansión volatilidad', 'Rango diario supera'],
};

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'XAU/USD', 'BTC/USD', 'US500', 'NAS100'];
const ACCENT = '270 70% 60%';


export default function SmartAlerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<SmartAlert[]>([
    { id: '1', name: 'RSI Oversold EUR/USD', type: 'indicator', pair: 'EUR/USD', condition: 'RSI cruza abajo de', value: '30', timeframe: 'H1', status: 'active', sound: true, push: true, createdAt: new Date(), recurrence: 'recurring' },
    { id: '2', name: 'Gold Price Alert', type: 'price', pair: 'XAU/USD', condition: 'Precio cruza arriba de', value: '2450', timeframe: 'M15', status: 'triggered', sound: true, push: true, createdAt: new Date(Date.now() - 86400000), triggeredAt: new Date(Date.now() - 3600000), recurrence: 'once' },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<SmartAlert>>({
    type: 'price', pair: 'EUR/USD', condition: '', value: '', timeframe: 'H1', sound: true, push: true, recurrence: 'once', name: '',
  });

  const createAlert = () => {
    if (!newAlert.condition || !newAlert.value) { toast({ title: 'Completa todos los campos', variant: 'destructive' }); return; }
    const alert: SmartAlert = {
      id: crypto.randomUUID(), name: newAlert.name || `${newAlert.pair} ${newAlert.condition}`,
      type: newAlert.type as AlertType, pair: newAlert.pair!, condition: newAlert.condition!, value: newAlert.value!,
      timeframe: newAlert.timeframe!, status: 'active', sound: newAlert.sound!, push: newAlert.push!,
      createdAt: new Date(), recurrence: newAlert.recurrence as 'once' | 'recurring',
    };
    setAlerts(prev => [alert, ...prev]);
    setShowCreate(false);
    setNewAlert({ type: 'price', pair: 'EUR/USD', condition: '', value: '', timeframe: 'H1', sound: true, push: true, recurrence: 'once', name: '' });
    toast({ title: 'Alerta creada ✓' });
  };

  const toggleStatus = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
  const deleteAlert = (id: string) => { setAlerts(prev => prev.filter(a => a.id !== id)); toast({ title: 'Alerta eliminada' }); };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const triggeredCount = alerts.filter(a => a.status === 'triggered').length;

  return (
    <PageShell>
      <Header />
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Activas', value: activeCount, icon: BellRing, color: '160 84% 39%' },
            { label: 'Disparadas', value: triggeredCount, icon: Zap, color: '45 95% 55%' },
            { label: 'Total', value: alerts.length, icon: Bell, color: '210 80% 55%' },
          ].map(s => (
            <GlowSection key={s.label} color={s.color}>
              <div className="p-3 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: `hsl(${s.color})` }} />
                <div className="text-lg font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            </GlowSection>
          ))}
        </div>

        {/* Create button */}
        <Button className="w-full rounded-xl backdrop-blur" onClick={() => setShowCreate(!showCreate)} style={{
          background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
          border: `1px solid hsl(${ACCENT} / 0.4)`,
        }}>
          <Plus className="w-4 h-4 mr-1" /> Nueva Alerta Inteligente
        </Button>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <GlowSection color={ACCENT}>
                <div className="p-4 space-y-3">
                  <Input placeholder="Nombre de la alerta (opcional)" value={newAlert.name} onChange={e => setNewAlert(a => ({ ...a, name: e.target.value }))} className="h-9 bg-background/40 border-border/30" />
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {ALERT_TYPES.map(at => (
                      <button key={at.value}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
                        style={{
                          background: newAlert.type === at.value ? `hsl(${at.color} / 0.15)` : 'hsl(var(--muted))',
                          border: newAlert.type === at.value ? `1px solid hsl(${at.color} / 0.4)` : '1px solid transparent',
                          color: newAlert.type === at.value ? `hsl(${at.color})` : undefined,
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
                      <label className="flex items-center gap-1.5 text-xs">
                        <Switch checked={newAlert.sound} onCheckedChange={v => setNewAlert(a => ({ ...a, sound: v }))} />
                        {newAlert.sound ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      </label>
                      <label className="flex items-center gap-1.5 text-xs">
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
                  <Button className="w-full rounded-xl" onClick={createAlert} style={{
                    background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                  }}>
                    <Zap className="w-4 h-4 mr-1" /> Crear Alerta
                  </Button>
                </div>
              </GlowSection>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert list */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {alerts.map(alert => {
              const typeInfo = ALERT_TYPES.find(at => at.value === alert.type);
              const Icon = typeInfo?.icon || Bell;
              const alertColor = typeInfo?.color || ACCENT;
              const isActive = alert.status === 'active';

              return (
                <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80 }} layout>
                  <div className="relative rounded-2xl overflow-hidden" style={{
                    background: `linear-gradient(165deg, hsl(${alertColor} / ${isActive ? '0.06' : '0.02'}) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
                    border: `1px solid hsl(${alertColor} / ${isActive ? '0.25' : '0.1'})`,
                  }}>
                    {isActive && <div className="absolute top-0 inset-x-0 h-[1px]" style={{
                      background: `linear-gradient(90deg, transparent, hsl(${alertColor} / 0.5), transparent)`,
                    }} />}
                    <div className="relative p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl" style={{ background: `hsl(${alertColor} / 0.1)` }}>
                            <Icon className="w-4 h-4" style={{ color: `hsl(${alertColor})` }} />
                          </div>
                          <div>
                            <div className="text-sm font-medium leading-tight text-foreground">{alert.name}</div>
                            <div className="text-xs text-muted-foreground">{alert.pair} · {alert.timeframe}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]" style={{
                          borderColor: `hsl(${isActive ? '160 84% 39%' : alert.status === 'triggered' ? '45 95% 55%' : 'var(--border)'} / 0.4)`,
                          color: `hsl(${isActive ? '160 84% 39%' : alert.status === 'triggered' ? '45 95% 55%' : 'var(--muted-foreground)'})`,
                          background: `hsl(${isActive ? '160 84% 39%' : alert.status === 'triggered' ? '45 95% 55%' : 'var(--muted)'} / 0.1)`,
                        }}>
                          {alert.status === 'active' ? '● Activa' : alert.status === 'triggered' ? '⚡ Disparada' : '⏸ Pausa'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2 rounded-lg px-2 py-1" style={{ background: 'hsl(var(--background) / 0.3)' }}>
                        {alert.condition} <span className="font-mono font-bold text-foreground">{alert.value}</span>
                        {alert.recurrence === 'recurring' && <Badge variant="outline" className="ml-2 text-[9px]">↻</Badge>}
                      </div>
                      {alert.triggeredAt && (
                        <div className="text-[10px] flex items-center gap-1 mb-2" style={{ color: 'hsl(45 95% 55%)' }}>
                          <Clock className="w-3 h-3" /> Disparada: {alert.triggeredAt.toLocaleString()}
                        </div>
                      )}
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={() => toggleStatus(alert.id)}>
                          {alert.status === 'active' ? 'Pausar' : 'Activar'}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive rounded-lg" onClick={() => deleteAlert(alert.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
