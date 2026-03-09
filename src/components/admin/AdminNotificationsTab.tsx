import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Bell, Send, Loader2, Users, Megaphone, CheckCircle2, AlertTriangle, Globe, Shield, Clock, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface SendResult {
  success: number;
  failed: number;
  errors: string[];
}

type AudienceType = 'all' | 'country' | 'role';
type SendMode = 'now' | 'scheduled';

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  audience_label: string;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  result: SendResult | null;
  created_at: string;
}

const TEMPLATES = [
  { id: 'custom', label: 'Personalizado', title: '', body: '' },
  { id: 'new-signal', label: '🚀 Nueva señal', title: '🚀 Nueva Señal Disponible', body: 'Se ha publicado una nueva señal de trading. ¡Revísala ahora!' },
  { id: 'market-alert', label: '⚠️ Alerta de mercado', title: '⚠️ Alerta de Mercado', body: 'Movimiento importante detectado en el mercado. Revisa tus posiciones.' },
  { id: 'maintenance', label: '🔧 Mantenimiento', title: '🔧 Mantenimiento Programado', body: 'Realizaremos un mantenimiento breve. El servicio volverá en minutos.' },
  { id: 'promo', label: '🎉 Promoción', title: '🎉 Oferta Especial', body: '¡No te pierdas nuestra promoción exclusiva! Visita la app para más detalles.' },
];

// --- Sub-components ---

function StatsCards({ subscriberCount, historyCount, lastResult }: {
  subscriberCount: number | null;
  historyCount: number;
  lastResult: SendResult | null;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="bg-[#0f0f18] border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Suscriptores Push</p>
            <p className="text-2xl font-bold text-white tabular-nums">{subscriberCount ?? '—'}</p>
          </div>
        </div>
      </Card>
      <Card className="bg-[#0f0f18] border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Enviadas (sesión)</p>
            <p className="text-2xl font-bold text-white tabular-nums">{historyCount}</p>
          </div>
        </div>
      </Card>
      {lastResult && (
        <Card className="bg-[#0f0f18] border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${lastResult.failed === 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {lastResult.failed === 0
                ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                : <AlertTriangle className="h-5 w-5 text-red-400" />}
            </div>
            <div>
              <p className="text-xs text-white/40">Último envío</p>
              <p className="text-sm text-white">
                <span className="text-emerald-400">{lastResult.success}</span> / <span className="text-red-400">{lastResult.failed}</span>
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function AudienceSelector({ audienceType, setAudienceType, selectedCountry, setSelectedCountry, selectedRole, setSelectedRole, countries, segmentCount, loadingSegment }: {
  audienceType: AudienceType;
  setAudienceType: (v: AudienceType) => void;
  selectedCountry: string;
  setSelectedCountry: (v: string) => void;
  selectedRole: string;
  setSelectedRole: (v: string) => void;
  countries: string[];
  segmentCount: number | null;
  loadingSegment: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <p className="text-xs font-medium text-white/50 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" /> Audiencia
      </p>
      <div className="grid grid-cols-3 gap-2">
        {([
          { value: 'all' as const, label: 'Todos', icon: Users },
          { value: 'country' as const, label: 'País', icon: Globe },
          { value: 'role' as const, label: 'Rol', icon: Shield },
        ]).map(opt => (
          <button
            key={opt.value}
            onClick={() => { setAudienceType(opt.value); setSelectedCountry(''); setSelectedRole(''); }}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
              audienceType === opt.value
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-white/[0.03] text-white/40 border border-white/5 hover:text-white/60'
            }`}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      {audienceType === 'country' && (
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="bg-white/5 border-white/10 text-xs text-white">
            <SelectValue placeholder="Seleccionar país..." />
          </SelectTrigger>
          <SelectContent>
            {countries.map(c => (
              <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {audienceType === 'role' && (
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="bg-white/5 border-white/10 text-xs text-white">
            <SelectValue placeholder="Seleccionar rol..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin" className="text-xs">Admin</SelectItem>
            <SelectItem value="moderator" className="text-xs">Moderador</SelectItem>
            <SelectItem value="user" className="text-xs">Usuario</SelectItem>
          </SelectContent>
        </Select>
      )}

      {audienceType !== 'all' && (
        <p className="text-[10px] text-white/30">
          {loadingSegment ? 'Calculando...' : segmentCount !== null ? `${segmentCount} suscriptores en este segmento` : 'Selecciona un filtro'}
        </p>
      )}
    </div>
  );
}

function ScheduledList({ items, onCancel, onRefresh, refreshing }: {
  items: ScheduledNotification[];
  onCancel: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-400',
    sending: 'bg-blue-400 animate-pulse',
    sent: 'bg-emerald-400',
    failed: 'bg-red-400',
    cancelled: 'bg-white/20',
  };
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    sending: 'Enviando...',
    sent: 'Enviada',
    failed: 'Fallida',
    cancelled: 'Cancelada',
  };

  return (
    <Card className="bg-[#0f0f18] border-white/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" />
          Notificaciones Programadas
        </h3>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing} className="h-7 px-2 text-white/40 hover:text-white/70">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-white/20 text-center py-4">No hay notificaciones programadas</p>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div key={n.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]">
              <div className={`shrink-0 mt-1.5 h-2 w-2 rounded-full ${statusColors[n.status] || 'bg-white/20'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 font-medium truncate">{n.title}</p>
                <p className="text-[10px] text-white/30 truncate">{n.body}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-amber-400/50">{n.audience_label}</span>
                  <span className="text-[9px] text-white/20">·</span>
                  <span className="text-[9px] text-blue-400/60 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(n.scheduled_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right flex flex-col items-end gap-1">
                <span className="text-[10px] text-white/40">{statusLabels[n.status] || n.status}</span>
                {n.status === 'sent' && n.result && (
                  <span className="text-[9px] text-emerald-400/70">{(n.result as SendResult).success} ✓</span>
                )}
                {n.status === 'pending' && (
                  <button onClick={() => onCancel(n.id)} className="text-[9px] text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-0.5">
                    <Trash2 className="h-2.5 w-2.5" /> Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SessionHistory({ history }: { history: { title: string; body: string; sentAt: string; result: SendResult; audience: string }[] }) {
  if (history.length === 0) return null;
  return (
    <Card className="bg-[#0f0f18] border-white/5 p-5">
      <h3 className="text-sm font-semibold text-white/80 mb-3">Historial de esta sesión</h3>
      <div className="space-y-2">
        {history.map((h, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]">
            <div className={`shrink-0 mt-0.5 h-2 w-2 rounded-full ${h.result.failed === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 font-medium truncate">{h.title}</p>
              <p className="text-[10px] text-white/30 truncate">{h.body}</p>
              <p className="text-[9px] text-amber-400/50 mt-0.5">{h.audience}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-emerald-400/70">{h.result.success} ✓</p>
              {h.result.failed > 0 && <p className="text-[10px] text-red-400/70">{h.result.failed} ✗</p>}
              <p className="text-[9px] text-white/15 font-mono">{format(new Date(h.sentAt), 'HH:mm:ss')}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// --- Main Component ---

export function AdminNotificationsTab() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [tag, setTag] = useState('admin-broadcast');
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);
  const [history, setHistory] = useState<{ title: string; body: string; sentAt: string; result: SendResult; audience: string }[]>([]);

  // Segmentation
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [segmentCount, setSegmentCount] = useState<number | null>(null);
  const [loadingSegment, setLoadingSegment] = useState(false);

  // Scheduling
  const [sendMode, setSendMode] = useState<SendMode>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledItems, setScheduledItems] = useState<ScheduledNotification[]>([]);
  const [refreshingScheduled, setRefreshingScheduled] = useState(false);

  useEffect(() => {
    supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setSubscriberCount(count || 0);
    });
    supabase.from('profiles').select('country').not('country', 'is', null).then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(p => p.country).filter(Boolean))] as string[];
        setCountries(unique.sort());
      }
    });
    fetchScheduled();
  }, []);

  // Recalculate segment count
  useEffect(() => {
    if (audienceType === 'all') { setSegmentCount(null); return; }
    const fetchCount = async () => {
      setLoadingSegment(true);
      try {
        if (audienceType === 'country' && selectedCountry) {
          const { data: profileIds } = await supabase.from('profiles').select('id').eq('country', selectedCountry);
          if (profileIds) {
            const ids = profileIds.map(p => p.id);
            const { count } = await supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).in('user_id', ids);
            setSegmentCount(count || 0);
          }
        } else if (audienceType === 'role' && selectedRole) {
          const { data: roleUsers } = await supabase.from('user_roles').select('user_id').eq('role', selectedRole as any);
          if (roleUsers) {
            const ids = roleUsers.map(r => r.user_id);
            const { count } = await supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).in('user_id', ids);
            setSegmentCount(count || 0);
          }
        } else {
          setSegmentCount(null);
        }
      } catch { setSegmentCount(null); }
      finally { setLoadingSegment(false); }
    };
    fetchCount();
  }, [audienceType, selectedCountry, selectedRole]);

  const fetchScheduled = async () => {
    setRefreshingScheduled(true);
    const { data } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .in('status', ['pending', 'sending', 'sent', 'failed'])
      .order('scheduled_at', { ascending: false })
      .limit(20);
    setScheduledItems((data as unknown as ScheduledNotification[] | null) || []);
    setRefreshingScheduled(false);
  };

  const handleTemplate = (templateId: string) => {
    const t = TEMPLATES.find(tp => tp.id === templateId);
    if (t) { setTitle(t.title); setBody(t.body); }
  };

  const getAudienceLabel = () => {
    if (audienceType === 'country' && selectedCountry) return `País: ${selectedCountry}`;
    if (audienceType === 'role' && selectedRole) return `Rol: ${selectedRole}`;
    return 'Todos';
  };

  const getTargetCount = () => audienceType === 'all' ? subscriberCount : segmentCount;

  const buildFilter = () => {
    if (audienceType === 'country' && selectedCountry) return { type: 'country', value: selectedCountry };
    if (audienceType === 'role' && selectedRole) return { type: 'role', value: selectedRole };
    return null;
  };

  const handleCancelScheduled = async (id: string) => {
    const confirmed = window.confirm('¿Cancelar esta notificación programada?');
    if (!confirmed) return;
    await supabase.from('scheduled_notifications').update({ status: 'cancelled' }).eq('id', id);
    toast({ title: 'Cancelada', description: 'La notificación programada fue cancelada.' });
    fetchScheduled();
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Error', description: 'Título y mensaje son obligatorios', variant: 'destructive' });
      return;
    }
    if (audienceType === 'country' && !selectedCountry) {
      toast({ title: 'Error', description: 'Selecciona un país', variant: 'destructive' });
      return;
    }
    if (audienceType === 'role' && !selectedRole) {
      toast({ title: 'Error', description: 'Selecciona un rol', variant: 'destructive' });
      return;
    }

    // SCHEDULED mode
    if (sendMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast({ title: 'Error', description: 'Selecciona fecha y hora para programar', variant: 'destructive' });
        return;
      }
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledAt <= new Date()) {
        toast({ title: 'Error', description: 'La fecha programada debe ser en el futuro', variant: 'destructive' });
        return;
      }

      const confirmed = window.confirm(`¿Programar notificación para ${format(scheduledAt, 'dd/MM/yyyy HH:mm')}?\n\n"${title}"\n${body}`);
      if (!confirmed) return;

      setSending(true);
      const { error } = await supabase.from('scheduled_notifications').insert({
        title, body, url, tag,
        filter: buildFilter(),
        audience_label: getAudienceLabel(),
        scheduled_at: scheduledAt.toISOString(),
      });
      setSending(false);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Programada ✓', description: `Notificación programada para ${format(scheduledAt, 'dd/MM/yyyy HH:mm')}` });
        setScheduledDate(''); setScheduledTime('');
        fetchScheduled();
      }
      return;
    }

    // IMMEDIATE mode
    const targetCount = getTargetCount();
    const audienceLabel = getAudienceLabel();
    const confirmed = window.confirm(`¿Enviar notificación push a ${targetCount ?? '?'} suscriptores (${audienceLabel})?\n\n"${title}"\n${body}`);
    if (!confirmed) return;

    setSending(true);
    setLastResult(null);

    try {
      const payload: Record<string, unknown> = { title, body, url, tag };
      const filter = buildFilter();
      if (filter) payload.filter = filter;

      const { data, error } = await supabase.functions.invoke('send-push-notification', { body: payload });
      if (error) throw error;

      const result: SendResult = data?.results || { success: 0, failed: 0, errors: [] };
      setLastResult(result);
      setHistory(prev => [{ title, body, sentAt: new Date().toISOString(), result, audience: audienceLabel }, ...prev].slice(0, 10));

      toast({
        title: 'Notificación enviada',
        description: `✅ ${result.success} exitosas · ❌ ${result.failed} fallidas (${audienceLabel})`,
      });
    } catch (err: any) {
      toast({ title: 'Error al enviar', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Set default date/time to now + 1h
  const handleSwitchToScheduled = () => {
    setSendMode('scheduled');
    if (!scheduledDate) {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      setScheduledDate(format(future, 'yyyy-MM-dd'));
      setScheduledTime(format(future, 'HH:mm'));
    }
  };

  return (
    <div className="space-y-6">
      <StatsCards subscriberCount={subscriberCount} historyCount={history.length} lastResult={lastResult} />

      {/* Compose */}
      <Card className="bg-[#0f0f18] border-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white/80">Enviar Notificación</h3>
        </div>

        <AudienceSelector
          audienceType={audienceType} setAudienceType={setAudienceType}
          selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
          selectedRole={selectedRole} setSelectedRole={setSelectedRole}
          countries={countries} segmentCount={segmentCount} loadingSegment={loadingSegment}
        />

        {/* Template */}
        <div>
          <label className="text-xs text-white/30 mb-1.5 block">Plantilla</label>
          <Select onValueChange={handleTemplate}>
            <SelectTrigger className="bg-white/5 border-white/10 text-xs text-white">
              <SelectValue placeholder="Seleccionar plantilla..." />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-white/30 mb-1.5 block">Título *</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la notificación"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20" maxLength={100} />
          <p className="text-[10px] text-white/15 mt-1 text-right">{title.length}/100</p>
        </div>

        <div>
          <label className="text-xs text-white/30 mb-1.5 block">Mensaje *</label>
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Contenido del mensaje push..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none min-h-[80px]" maxLength={300} />
          <p className="text-[10px] text-white/15 mt-1 text-right">{body.length}/300</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/30 mb-1.5 block">URL destino</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="/"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs" />
          </div>
          <div>
            <label className="text-xs text-white/30 mb-1.5 block">Tag</label>
            <Input value={tag} onChange={e => setTag(e.target.value)} placeholder="admin-broadcast"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs" />
          </div>
        </div>

        {/* Send Mode Toggle */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSendMode('now')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                sendMode === 'now'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/5 hover:text-white/60'
              }`}
            >
              <Send className="h-3.5 w-3.5" /> Enviar ahora
            </button>
            <button
              onClick={handleSwitchToScheduled}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                sendMode === 'scheduled'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/5 hover:text-white/60'
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Programar
            </button>
          </div>

          {sendMode === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/30 mb-1.5 block">Fecha</label>
                <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs" />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1.5 block">Hora</label>
                <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs" />
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}
          className={`w-full font-semibold h-10 ${sendMode === 'scheduled' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-black'}`}
        >
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {sendMode === 'scheduled' ? 'Programando...' : 'Enviando...'}</>
          ) : sendMode === 'scheduled' ? (
            <><Clock className="h-4 w-4 mr-2" /> Programar para {scheduledDate && scheduledTime ? format(new Date(`${scheduledDate}T${scheduledTime}`), 'dd/MM HH:mm') : '...'}</>
          ) : (
            <><Send className="h-4 w-4 mr-2" /> Enviar a {getTargetCount() ?? '?'} suscriptores ({getAudienceLabel()})</>
          )}
        </Button>
      </Card>

      {/* Scheduled Notifications */}
      <ScheduledList items={scheduledItems} onCancel={handleCancelScheduled} onRefresh={fetchScheduled} refreshing={refreshingScheduled} />

      {/* Session History */}
      <SessionHistory history={history} />
    </div>
  );
}
