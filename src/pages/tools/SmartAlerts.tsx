import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Plus, Trash2, Zap, TrendingUp, TrendingDown,
  Activity, Clock, AlertTriangle, CheckCircle2, Volume2, VolumeX
} from 'lucide-react';

type AlertType = 'price' | 'indicator' | 'pattern' | 'news' | 'volatility';
type AlertStatus = 'active' | 'triggered' | 'paused';

interface SmartAlert {
  id: string;
  name: string;
  type: AlertType;
  pair: string;
  condition: string;
  value: string;
  timeframe: string;
  status: AlertStatus;
  sound: boolean;
  push: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  recurrence: 'once' | 'recurring';
}

const ALERT_TYPES: { value: AlertType; label: string; icon: any; color: string }[] = [
  { value: 'price', label: 'Precio', icon: TrendingUp, color: 'text-emerald-400' },
  { value: 'indicator', label: 'Indicador', icon: Activity, color: 'text-blue-400' },
  { value: 'pattern', label: 'Patrón', icon: Zap, color: 'text-amber-400' },
  { value: 'news', label: 'Noticias', icon: Bell, color: 'text-purple-400' },
  { value: 'volatility', label: 'Volatilidad', icon: AlertTriangle, color: 'text-red-400' },
];

const CONDITIONS: Record<AlertType, string[]> = {
  price: ['Precio cruza arriba de', 'Precio cruza abajo de', 'Precio entre rango', 'Cambio % en'],
  indicator: ['RSI cruza arriba de', 'RSI cruza abajo de', 'MACD cruce alcista', 'MACD cruce bajista', 'EMA cruce dorado', 'EMA cruce muerte'],
  pattern: ['Doble techo detectado', 'Doble suelo detectado', 'Hombro-Cabeza-Hombro', 'Triángulo ascendente', 'Doji en soporte', 'Engulfing alcista'],
  news: ['Noticia alto impacto', 'Decisión tasa interés', 'NFP/Empleo', 'PIB publicación', 'CPI/Inflación'],
  volatility: ['ATR supera', 'Bollinger squeeze', 'Expansión volatilidad', 'Rango diario supera'],
};

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'XAU/USD', 'BTC/USD', 'US500', 'NAS100'];

export default function SmartAlerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<SmartAlert[]>([
    {
      id: '1', name: 'RSI Oversold EUR/USD', type: 'indicator', pair: 'EUR/USD',
      condition: 'RSI cruza abajo de', value: '30', timeframe: 'H1',
      status: 'active', sound: true, push: true, createdAt: new Date(), recurrence: 'recurring',
    },
    {
      id: '2', name: 'Gold Price Alert', type: 'price', pair: 'XAU/USD',
      condition: 'Precio cruza arriba de', value: '2450', timeframe: 'M15',
      status: 'triggered', sound: true, push: true, createdAt: new Date(Date.now() - 86400000),
      triggeredAt: new Date(Date.now() - 3600000), recurrence: 'once',
    },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<SmartAlert>>({
    type: 'price', pair: 'EUR/USD', condition: '', value: '', timeframe: 'H1',
    sound: true, push: true, recurrence: 'once', name: '',
  });

  const createAlert = () => {
    if (!newAlert.condition || !newAlert.value) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' });
      return;
    }
    const alert: SmartAlert = {
      id: crypto.randomUUID(),
      name: newAlert.name || `${newAlert.pair} ${newAlert.condition}`,
      type: newAlert.type as AlertType,
      pair: newAlert.pair!,
      condition: newAlert.condition!,
      value: newAlert.value!,
      timeframe: newAlert.timeframe!,
      status: 'active',
      sound: newAlert.sound!,
      push: newAlert.push!,
      createdAt: new Date(),
      recurrence: newAlert.recurrence as 'once' | 'recurring',
    };
    setAlerts(prev => [alert, ...prev]);
    setShowCreate(false);
    setNewAlert({ type: 'price', pair: 'EUR/USD', condition: '', value: '', timeframe: 'H1', sound: true, push: true, recurrence: 'once', name: '' });
    toast({ title: 'Alerta creada ✓' });
  };

  const toggleStatus = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Alerta eliminada' });
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const triggeredCount = alerts.filter(a => a.status === 'triggered').length;

  const statusColors: Record<AlertStatus, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    triggered: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    paused: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <PageShell>
      <div className="space-y-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Activas', value: activeCount, icon: BellRing, color: 'text-emerald-400' },
            { label: 'Disparadas', value: triggeredCount, icon: Zap, color: 'text-amber-400' },
            { label: 'Total', value: alerts.length, icon: Bell, color: 'text-blue-400' },
          ].map(s => (
            <Card key={s.label} className="bg-card/80 backdrop-blur">
              <CardContent className="p-3 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create button */}
        <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-1" /> Nueva Alerta Inteligente
        </Button>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="bg-card/90 backdrop-blur border-violet-500/30">
                <CardContent className="p-4 space-y-3">
                  <Input
                    placeholder="Nombre de la alerta (opcional)"
                    value={newAlert.name}
                    onChange={e => setNewAlert(a => ({ ...a, name: e.target.value }))}
                    className="h-9"
                  />

                  {/* Alert type selector */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {ALERT_TYPES.map(at => (
                      <button
                        key={at.value}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                          newAlert.type === at.value ? 'bg-primary/20 border border-primary/40' : 'bg-muted'
                        }`}
                        onClick={() => setNewAlert(a => ({ ...a, type: at.value, condition: '' }))}
                      >
                        <at.icon className={`w-3 h-3 ${at.color}`} />
                        {at.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={newAlert.pair} onValueChange={v => setNewAlert(a => ({ ...a, pair: v }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Par" /></SelectTrigger>
                      <SelectContent>
                        {PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={newAlert.timeframe} onValueChange={v => setNewAlert(a => ({ ...a, timeframe: v }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="TF" /></SelectTrigger>
                      <SelectContent>
                        {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => (
                          <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={newAlert.condition} onValueChange={v => setNewAlert(a => ({ ...a, condition: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Condición..." /></SelectTrigger>
                    <SelectContent>
                      {(CONDITIONS[newAlert.type as AlertType] || []).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Valor (ej: 1.0850, 30, etc.)"
                    value={newAlert.value}
                    onChange={e => setNewAlert(a => ({ ...a, value: e.target.value }))}
                    className="h-9"
                  />

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
                      <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Una vez</SelectItem>
                        <SelectItem value="recurring">Recurrente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={createAlert}>
                    <Zap className="w-4 h-4 mr-1" /> Crear Alerta
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert list */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {alerts.map(alert => {
              const typeInfo = ALERT_TYPES.find(at => at.value === alert.type);
              const Icon = typeInfo?.icon || Bell;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  layout
                >
                  <Card className={`bg-card/70 backdrop-blur border ${alert.status === 'active' ? 'border-emerald-500/20' : 'border-border/50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${alert.status === 'active' ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                            <Icon className={`w-4 h-4 ${typeInfo?.color}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium leading-tight">{alert.name}</div>
                            <div className="text-xs text-muted-foreground">{alert.pair} · {alert.timeframe}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[alert.status]}`}>
                          {alert.status === 'active' ? '● Activa' : alert.status === 'triggered' ? '⚡ Disparada' : '⏸ Pausa'}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground mb-2 bg-background/30 rounded px-2 py-1">
                        {alert.condition} <span className="font-mono font-bold text-foreground">{alert.value}</span>
                        {alert.recurrence === 'recurring' && <Badge variant="outline" className="ml-2 text-[9px]">↻</Badge>}
                      </div>

                      {alert.triggeredAt && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1 mb-2">
                          <Clock className="w-3 h-3" />
                          Disparada: {alert.triggeredAt.toLocaleString()}
                        </div>
                      )}

                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleStatus(alert.id)}>
                          {alert.status === 'active' ? 'Pausar' : 'Activar'}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAlert(alert.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
