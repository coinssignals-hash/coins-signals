import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Bell, Send, Loader2, Users, Megaphone, CheckCircle2, AlertTriangle, Globe, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface SendResult {
  success: number;
  failed: number;
  errors: string[];
}

type AudienceType = 'all' | 'country' | 'role';

const TEMPLATES = [
  { id: 'custom', label: 'Personalizado', title: '', body: '' },
  { id: 'new-signal', label: '🚀 Nueva señal', title: '🚀 Nueva Señal Disponible', body: 'Se ha publicado una nueva señal de trading. ¡Revísala ahora!' },
  { id: 'market-alert', label: '⚠️ Alerta de mercado', title: '⚠️ Alerta de Mercado', body: 'Movimiento importante detectado en el mercado. Revisa tus posiciones.' },
  { id: 'maintenance', label: '🔧 Mantenimiento', title: '🔧 Mantenimiento Programado', body: 'Realizaremos un mantenimiento breve. El servicio volverá en minutos.' },
  { id: 'promo', label: '🎉 Promoción', title: '🎉 Oferta Especial', body: '¡No te pierdas nuestra promoción exclusiva! Visita la app para más detalles.' },
];

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

  useEffect(() => {
    supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setSubscriberCount(count || 0);
    });
    // Fetch distinct countries from profiles
    supabase.from('profiles').select('country').not('country', 'is', null).then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(p => p.country).filter(Boolean))] as string[];
        setCountries(unique.sort());
      }
    });
  }, []);

  // Recalculate segment count when audience changes
  useEffect(() => {
    if (audienceType === 'all') {
      setSegmentCount(null);
      return;
    }

    const fetchCount = async () => {
      setLoadingSegment(true);
      try {
        if (audienceType === 'country' && selectedCountry) {
          const { data: profileIds } = await supabase
            .from('profiles')
            .select('id')
            .eq('country', selectedCountry);
          if (profileIds) {
            const ids = profileIds.map(p => p.id);
            const { count } = await supabase
              .from('push_subscriptions')
              .select('id', { count: 'exact', head: true })
              .in('user_id', ids);
            setSegmentCount(count || 0);
          }
        } else if (audienceType === 'role' && selectedRole) {
          const { data: roleUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', selectedRole as any);
          if (roleUsers) {
            const ids = roleUsers.map(r => r.user_id);
            const { count } = await supabase
              .from('push_subscriptions')
              .select('id', { count: 'exact', head: true })
              .in('user_id', ids);
            setSegmentCount(count || 0);
          }
        } else {
          setSegmentCount(null);
        }
      } catch {
        setSegmentCount(null);
      } finally {
        setLoadingSegment(false);
      }
    };

    fetchCount();
  }, [audienceType, selectedCountry, selectedRole]);

  const handleTemplate = (templateId: string) => {
    const t = TEMPLATES.find(tp => tp.id === templateId);
    if (t) {
      setTitle(t.title);
      setBody(t.body);
    }
  };

  const getAudienceLabel = () => {
    if (audienceType === 'country' && selectedCountry) return `País: ${selectedCountry}`;
    if (audienceType === 'role' && selectedRole) return `Rol: ${selectedRole}`;
    return 'Todos';
  };

  const getTargetCount = () => {
    if (audienceType === 'all') return subscriberCount;
    return segmentCount;
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

    const targetCount = getTargetCount();
    const audienceLabel = getAudienceLabel();
    const confirmed = window.confirm(`¿Enviar notificación push a ${targetCount ?? '?'} suscriptores (${audienceLabel})?\n\n"${title}"\n${body}`);
    if (!confirmed) return;

    setSending(true);
    setLastResult(null);

    try {
      const payload: Record<string, unknown> = { title, body, url, tag };

      if (audienceType === 'country' && selectedCountry) {
        payload.filter = { type: 'country', value: selectedCountry };
      } else if (audienceType === 'role' && selectedRole) {
        payload.filter = { type: 'role', value: selectedRole };
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: payload,
      });

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

  return (
    <div className="space-y-6">
      {/* Stats */}
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
              <p className="text-2xl font-bold text-white tabular-nums">{history.length}</p>
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

      {/* Compose */}
      <Card className="bg-[#0f0f18] border-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white/80">Enviar Notificación</h3>
        </div>

        {/* Audience Selector */}
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

        {/* Template selector */}
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
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título de la notificación"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
            maxLength={100}
          />
          <p className="text-[10px] text-white/15 mt-1 text-right">{title.length}/100</p>
        </div>

        <div>
          <label className="text-xs text-white/30 mb-1.5 block">Mensaje *</label>
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Contenido del mensaje push..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none min-h-[80px]"
            maxLength={300}
          />
          <p className="text-[10px] text-white/15 mt-1 text-right">{body.length}/300</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/30 mb-1.5 block">URL destino</label>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="/"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-white/30 mb-1.5 block">Tag</label>
            <Input
              value={tag}
              onChange={e => setTag(e.target.value)}
              placeholder="admin-broadcast"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs"
            />
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-10"
        >
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
          ) : (
            <><Send className="h-4 w-4 mr-2" /> Enviar a {getTargetCount() ?? '?'} suscriptores ({getAudienceLabel()})</>
          )}
        </Button>
      </Card>

      {/* Session History */}
      {history.length > 0 && (
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
      )}
    </div>
  );
}
