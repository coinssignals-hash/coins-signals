import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Phone, AlertTriangle, CheckCircle2, Clock, Users, Bot, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  channel: string;
  channel_user_id: string | null;
  status: string;
  created_at: string;
  escalated_at: string | null;
  metadata: any;
  user_id: string | null;
}

interface Message {
  id: string;
  role: string;
  content: string;
  channel: string;
  created_at: string;
  metadata: any;
}

const channelIcons: Record<string, string> = {
  web: '🌐', whatsapp: '📱', telegram: '✈️', facebook: '📘', instagram: '📸',
};

const channelColors: Record<string, string> = {
  web: 'bg-blue-500/20 text-blue-400',
  whatsapp: 'bg-green-500/20 text-green-400',
  telegram: 'bg-cyan-500/20 text-cyan-400',
  facebook: 'bg-indigo-500/20 text-indigo-400',
  instagram: 'bg-pink-500/20 text-pink-400',
};

export function AdminSupportTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'escalated' | 'active'>('escalated');
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    let query = supabase
      .from('support_conversations')
      .select('*')
      .neq('channel', 'telegram_state')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (filter === 'escalated') query = query.eq('status', 'escalated');
    else if (filter === 'active') query = query.eq('status', 'active');

    const { data } = await query;
    setConversations((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, [filter]);

  const loadMessages = async (conv: Conversation) => {
    setSelectedConv(conv);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    setMessages((data as any[]) || []);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || sending) return;
    setSending(true);

    // Save admin message
    await supabase.from('support_messages').insert({
      conversation_id: selectedConv.id,
      role: 'assistant',
      content: reply.trim(),
      channel: selectedConv.channel,
      metadata: { from_admin: true },
    });

    // Mark as active (de-escalate)
    await supabase
      .from('support_conversations')
      .update({ status: 'active', resolved_by: null })
      .eq('id', selectedConv.id);

    toast({ title: '✅ Respuesta enviada' });
    setReply('');
    setSending(false);
    loadMessages(selectedConv);
    fetchConversations();
  };

  const resolveConversation = async (convId: string) => {
    await supabase
      .from('support_conversations')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', convId);
    toast({ title: '✅ Conversación resuelta' });
    setSelectedConv(null);
    fetchConversations();
  };

  // Stats
  const escalatedCount = conversations.filter(c => c.status === 'escalated').length;
  const activeCount = conversations.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-400">{escalatedCount}</p>
          <p className="text-[10px] text-white/40">Escalados</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <MessageCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
          <p className="text-[10px] text-white/40">Activos</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-400">{conversations.length}</p>
          <p className="text-[10px] text-white/40">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['escalated', 'active', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
            }`}
          >
            {f === 'escalated' ? '🔔 Escalados' : f === 'active' ? '💬 Activos' : '📋 Todos'}
          </button>
        ))}
        <button onClick={fetchConversations} className="ml-auto p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversation list */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-white/30 text-sm text-center py-8">Cargando...</p>
          ) : conversations.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No hay conversaciones</p>
          ) : conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadMessages(conv)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedConv?.id === conv.id
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{channelIcons[conv.channel] || '💬'}</span>
                <Badge className={`text-[9px] ${channelColors[conv.channel] || 'bg-white/10 text-white/60'}`}>
                  {conv.channel}
                </Badge>
                <Badge className={`text-[9px] ${conv.status === 'escalated' ? 'bg-amber-500/20 text-amber-400' : conv.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {conv.status}
                </Badge>
                <span className="text-[9px] text-white/20 ml-auto">
                  {new Date(conv.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate">
                {conv.channel_user_id || conv.user_id?.slice(0, 8) || 'Anónimo'}
              </p>
            </button>
          ))}
        </div>

        {/* Message thread */}
        {selectedConv ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{channelIcons[selectedConv.channel]}</span>
                <span className="text-sm font-medium text-white/80">
                  {selectedConv.channel_user_id || selectedConv.user_id?.slice(0, 8)}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => resolveConversation(selectedConv.id)}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Resolver
              </Button>
            </div>

            <div className="h-[350px] overflow-y-auto space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-white/[0.05] border border-white/[0.08]'
                      : (msg.metadata as any)?.from_admin
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-primary/10 border border-primary/20'
                  }`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      {msg.role === 'user' ? <Users className="w-3 h-3 text-white/30" /> : (msg.metadata as any)?.from_admin ? <Users className="w-3 h-3 text-amber-400" /> : <Bot className="w-3 h-3 text-primary" />}
                      <span className="text-[9px] text-white/30">
                        {msg.role === 'user' ? 'Usuario' : (msg.metadata as any)?.from_admin ? 'Admin' : 'IA'}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">{msg.content}</p>
                    <p className="text-[8px] text-white/20 mt-1 text-right">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
              <Textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Responder como agente humano..."
                className="flex-1 bg-white/[0.03] border-white/[0.08] text-white min-h-[60px] text-xs"
              />
              <Button
                size="icon"
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] bg-white/[0.01] border border-white/[0.04] rounded-xl">
            <p className="text-white/20 text-sm">Selecciona una conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}
