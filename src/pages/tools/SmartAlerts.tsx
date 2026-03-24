import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Plus, Trash2, Zap, TrendingUp, TrendingDown,
  Activity, Clock, AlertTriangle, Volume2, VolumeX, ArrowLeft
} from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
  const navigate = useNavigate();
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
          <div className="flex items-center gap-3 mb-3">
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
                  {t('drawer_smart_alerts') || 'Alertas Inteligentes'}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Monitoreo automático de precio, indicadores y patrones
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Activas', value: activeCount, icon: BellRing, color: '160 84% 39%' },
            { label: 'Disparadas', value: triggeredCount, icon: Zap, color: '45 95% 55%' },
            { label: 'Total', value: alerts.length, icon: Bell, color: '210 80% 55%' },
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

        {/* Create button — glassmorphic */}
        <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
          onClick={() => setShowCreate(!showCreate)}
          style={{
            background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
            border: `1px solid hsl(${ACCENT} / 0.5)`,
            boxShadow: `0 0 20px hsl(${ACCENT} / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.1)`,
          }}>
          <Plus className="w-4 h-4" /> Nueva Alerta Inteligente
        </button>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <GlowSection color={ACCENT}>
                <div className="p-4 space-y-3">
                  <Input placeholder="Nombre de la alerta (opcional)" value={newAlert.name} onChange={e => setNewAlert(a => ({ ...a, name: e.target.value }))}
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
    </PageShell>
  );
}
