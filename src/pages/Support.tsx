import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  MessageCircle, Send, Upload, MapPin, Phone, Mail,
  ChevronDown, ChevronUp, Search, Clock, CheckCircle2,
  AlertCircle, HelpCircle, Headphones, Shield, CreditCard,
  BarChart3, Globe, ExternalLink, Bot, User, Paperclip,
  Sparkles, ArrowRight, X, Mic, MicOff, Volume2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/LanguageContext';

function getNow() {
  return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

interface ChatMessage { id: number; from: 'user' | 'bot'; text: string; time: string; }
type Section = 'main' | 'faq' | 'chat' | 'ticket';

export default function Support() {
  const { user, profile } = useAuth();
  const [section, setSection] = useState<Section>('main');
  const { t } = useTranslation();

  return (
    <PageShell>
      <Header />
      <main className="py-6 px-4">
        <div className="mb-6">
          <span className="text-xs text-muted-foreground">ID # {user?.id?.slice(0, 7) || '0572564'}</span>
          <h1 className="text-xl font-bold text-foreground">{t('support_title')}</h1>
        </div>
        <AnimatePresence mode="wait">
          {section === 'main' && <MainSection key="main" onNavigate={setSection} t={t} />}
          {section === 'faq' && <FAQSection key="faq" onBack={() => setSection('main')} t={t} />}
          {section === 'chat' && <AIChatSection key="chat" onBack={() => setSection('main')} userName={profile?.first_name || 'Trader'} t={t} />}
          {section === 'ticket' && <TicketSection key="ticket" onBack={() => setSection('main')} t={t} />}
        </AnimatePresence>
      </main>
    </PageShell>
  );
}

/* ─── Main Section ─── */
function MainSection({ onNavigate, t }: { onNavigate: (s: Section) => void; t: (k: string) => string }) {
  const legalItems = [
    { key: 'support_terms' }, { key: 'support_privacy' }, { key: 'support_risk_notice' }, { key: 'support_refund_policy' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-6">
      <GlowCard>
        <CardHeader>
          <CardTitle className="text-sm text-primary flex items-center gap-2">
            <Headphones className="w-4 h-4" /> {t('support_welcome')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('support_find_help')}</p>
          <div className="grid grid-cols-3 gap-2">
            <StatusBadge icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} label={t('support_chat_active')} />
            <StatusBadge icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} label={t('support_email_time')} />
            <StatusBadge icon={<Globe className="w-3.5 h-3.5 text-primary" />} label="24/7" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onNavigate('chat')}>
              <Bot className="w-6 h-6 text-primary" />
              <span className="text-xs">Chat IA en vivo</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => window.open('https://wa.me/34600000000?text=Hola,%20necesito%20ayuda', '_blank')}>
              <Send className="w-6 h-6 text-primary" />
              <span className="text-xs">WhatsApp</span>
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <SocialBtn label="Telegram" color="#26A5E4" onClick={() => window.open('https://t.me/ecosignal_ai', '_blank')} icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>} />
            <SocialBtn label="Facebook" color="#1877F2" onClick={() => window.open('https://m.me/ecosignal.ai', '_blank')} icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>} />
            <SocialBtn label="Instagram" color="#E4405F" onClick={() => window.open('https://instagram.com/ecosignal.ai', '_blank')} icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 1 1-2.882 0 1.441 1.441 0 0 1 2.882 0z"/></svg>} />
            <SocialBtn label="TikTok" color="#000000" onClick={() => window.open('https://tiktok.com/@ecosignal.ai', '_blank')} icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => onNavigate('faq')}>
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="text-xs">{t('support_faq')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => onNavigate('ticket')}>
              <Mail className="w-5 h-5 text-primary" />
              <span className="text-xs">{t('support_send_ticket')}</span>
            </Button>
          </div>
        </CardContent>
      </GlowCard>

      <GlowCard>
        <CardHeader><CardTitle className="text-sm text-primary">{t('support_channels')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ContactRow icon={MessageCircle} title="Chat IA en vivo" detail="Respuestas instantáneas con IA" color="text-emerald-400" />
          <ContactRow icon={Phone} title="WhatsApp Business" detail="+34 600 000 000" color="text-green-400" onClick={() => window.open('https://wa.me/34600000000', '_blank')} />
          <ContactRow icon={Mail} title="Email" detail="soporte@ecosignal.ai" color="text-primary" onClick={() => window.open('mailto:soporte@ecosignal.ai', '_blank')} />
          <ContactRow icon={Send} title="Telegram" detail="@ecosignal_ai" color="text-[hsl(200,80%,50%)]" onClick={() => window.open('https://t.me/ecosignal_ai', '_blank')} />
          <ContactRow icon={MessageCircle} title="Facebook Messenger" detail="ecosignal.ai" color="text-[hsl(220,80%,55%)]" onClick={() => window.open('https://m.me/ecosignal.ai', '_blank')} />
          <ContactRow icon={Globe} title="Instagram" detail="@ecosignal.ai" color="text-[hsl(340,75%,55%)]" onClick={() => window.open('https://instagram.com/ecosignal.ai', '_blank')} />
          <ContactRow icon={Globe} title="TikTok" detail="@ecosignal.ai" color="text-foreground" onClick={() => window.open('https://tiktok.com/@ecosignal.ai', '_blank')} />
        </CardContent>
      </GlowCard>

      <GlowCard>
        <CardHeader><CardTitle className="text-sm text-primary">{t('support_location_phones')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('support_intl_offices')}</p>
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary"><MapPin className="w-5 h-5 text-primary mt-0.5" /><div><p className="text-sm font-medium text-foreground">Malta</p><p className="text-xs text-muted-foreground">Marija Immakulata, Gzira 1326</p></div></div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary"><MapPin className="w-5 h-5 text-primary mt-0.5" /><div><p className="text-sm font-medium text-foreground">Netherlands</p><p className="text-xs text-muted-foreground">Boomgaardstraat 12, Fijnaart 2544</p></div></div>
          </div>
        </CardContent>
      </GlowCard>

      <GlowCard>
        <CardHeader><CardTitle className="text-sm text-primary">{t('support_legal')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {legalItems.map(l => (
              <button key={l.key} className="flex items-center gap-1.5 bg-secondary border border-border/50 rounded-lg px-3 py-2 hover:bg-secondary/80 transition-colors text-left w-full">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-foreground">{t(l.key)}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </GlowCard>
    </motion.div>
  );
}

/* ─── AI Chat Section (Real Streaming) ─── */
function AIChatSection({ onBack, userName, t }: { onBack: () => void; userName: string; t: (k: string) => string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, from: 'bot', text: `¡Hola ${userName}! 👋 Soy el asistente de IA de Coins Signals. ¿En qué puedo ayudarte hoy?`, time: getNow() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = { id: Date.now(), from: 'user', text: userText, time: getNow() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build messages array for the API
    const apiMessages = messages
      .filter(m => m.id !== 1) // skip greeting
      .map(m => ({ role: m.from === 'user' ? 'user' as const : 'assistant' as const, content: m.text }));
    apiMessages.push({ role: 'user', content: userText });

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          conversationId,
          channel: 'web',
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error('Demasiadas solicitudes. Intenta de nuevo en unos segundos.');
        }
        if (resp.status === 402) {
          throw new Error('Servicio temporalmente no disponible.');
        }
        throw new Error('Error al conectar con el asistente');
      }

      // Get conversation ID from header
      const newConvId = resp.headers.get('X-Conversation-Id');
      if (newConvId) setConversationId(newConvId);

      // Stream the response
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream available');

      const decoder = new TextDecoder();
      let assistantText = '';
      let textBuffer = '';
      const botMsgId = Date.now() + 1;

      // Add empty bot message
      setMessages(prev => [...prev, { id: botMsgId, from: 'bot', text: '', time: getNow() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              const cleanText = assistantText.replace('[ESCALATE]', '').trim();
              setMessages(prev =>
                prev.map(m => m.id === botMsgId ? { ...m, text: cleanText } : m)
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Check for escalation
      if (assistantText.includes('[ESCALATE]')) {
        setEscalated(true);
        toast({
          title: '🔔 Escalamiento activado',
          description: 'Tu caso ha sido escalado a un agente humano. Te contactaremos pronto.',
        });
      }
    } catch (e) {
      console.error('Chat error:', e);
      const errMsg = e instanceof Error ? e.message : 'Error de conexión';
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        from: 'bot',
        text: `⚠️ ${errMsg}. Puedes intentar de nuevo o contactarnos por WhatsApp.`,
        time: getNow(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, conversationId]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground -ml-2">{t('support_back')}</Button>
      <GlowCard>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm text-foreground">Coins Signals AI</CardTitle>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">
                  {escalated ? '🔔 Escalado a agente' : isLoading ? 'Pensando...' : t('support_online')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                <Sparkles className="w-3 h-3 mr-0.5" /> AI + Voz
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-[340px] overflow-y-auto space-y-2 pr-1">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  msg.from === 'user'
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-secondary border border-border/50'
                }`}>
                  {msg.from === 'bot' ? (
                    <div className="text-xs text-foreground leading-relaxed prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                      <ReactMarkdown>{msg.text || '...'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
                  )}
                  <p className="text-[9px] text-muted-foreground mt-1 text-right">{msg.time}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.from === 'user' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-secondary border border-border/50 rounded-xl px-4 py-2.5 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5">
              {['¿Cómo funcionan las señales?', '¿Planes y precios?', '¿Cómo cambio mi suscripción?', 'Tengo un problema técnico'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[10px] bg-primary/10 border border-primary/20 text-primary rounded-full px-2.5 py-1 hover:bg-primary/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border/30">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={escalated ? 'Un agente te responderá pronto...' : t('support_write_message')}
              className="flex-1 bg-secondary border-border"
              disabled={isLoading}
            />
            <Button size="icon" onClick={sendMessage} disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {escalated && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center"
            >
              <p className="text-xs text-amber-400">
                🔔 Tu caso ha sido escalado. Un agente revisará tu conversación y te contactará por este chat o por WhatsApp.
              </p>
            </motion.div>
          )}
        </CardContent>
      </GlowCard>
    </motion.div>
  );
}

/* ─── Sub-components ─── */
function StatusBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-2 border border-border/50">
      {icon}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SocialBtn({ label, color, icon, onClick }: { label: string; color: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 bg-secondary border border-border/50 rounded-xl py-3 hover:bg-secondary/80 transition-colors">
      <span style={{ color }}>{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}

function ContactRow({ icon: Icon, title, detail, color, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="flex-1"><p className="text-sm font-medium text-foreground">{title}</p><p className="text-xs text-muted-foreground">{detail}</p></div>
      {onClick && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

/* ─── FAQ Section ─── */
function FAQSection({ onBack, t }: { onBack: () => void; t: (k: string) => string }) {
  const [searchQ, setSearchQ] = useState('');
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  const faqCategories = [
    { icon: BarChart3, label: t('support_faq_cat_signals'), items: [
      { q: t('support_faq_signals_q1'), a: t('support_faq_signals_a1') },
      { q: t('support_faq_signals_q2'), a: t('support_faq_signals_a2') },
      { q: t('support_faq_signals_q3'), a: t('support_faq_signals_a3') },
    ]},
    { icon: CreditCard, label: t('support_faq_cat_payments'), items: [
      { q: t('support_faq_payments_q1'), a: t('support_faq_payments_a1') },
      { q: t('support_faq_payments_q2'), a: t('support_faq_payments_a2') },
      { q: t('support_faq_payments_q3'), a: t('support_faq_payments_a3') },
    ]},
    { icon: Shield, label: t('support_faq_cat_account'), items: [
      { q: t('support_faq_account_q1'), a: t('support_faq_account_a1') },
      { q: t('support_faq_account_q2'), a: t('support_faq_account_a2') },
      { q: t('support_faq_account_q3'), a: t('support_faq_account_a3') },
    ]},
  ];

  const filtered = faqCategories.map(cat => ({ ...cat, items: cat.items.filter(i => !searchQ || i.q.toLowerCase().includes(searchQ.toLowerCase()) || i.a.toLowerCase().includes(searchQ.toLowerCase())) })).filter(cat => cat.items.length > 0);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground -ml-2">{t('support_back')}</Button>
      <GlowCard>
        <CardHeader><CardTitle className="text-sm text-primary flex items-center gap-2"><HelpCircle className="w-4 h-4" /> {t('support_faq')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('support_faq_search')} value={searchQ} onChange={e => setSearchQ(e.target.value)} className="pl-9 bg-secondary border-border" />
          </div>
          {filtered.map(cat => (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-2"><cat.icon className="w-4 h-4 text-primary" /><span className="text-xs font-semibold text-foreground">{cat.label}</span></div>
              <div className="space-y-1">
                {cat.items.map((item, i) => {
                  const key = `${cat.label}-${i}`;
                  const isOpen = openIdx === key;
                  return (
                    <div key={key} className="border-b border-border/30 last:border-0">
                      <button onClick={() => setOpenIdx(isOpen ? null : key)} className="w-full flex items-center gap-2 py-2.5 text-left">
                        <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs text-foreground font-medium flex-1">{item.q}</span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <p className="text-[11px] text-muted-foreground pb-3 pl-5 leading-relaxed">{item.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </GlowCard>
    </motion.div>
  );
}

/* ─── Ticket Section ─── */
function TicketSection({ onBack, t }: { onBack: () => void; t: (k: string) => string }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const helpTopics = [
    { id: 'verification', label: t('support_topic_verification'), icon: Shield },
    { id: 'payments', label: t('support_topic_payments'), icon: CreditCard },
    { id: 'signals', label: t('support_topic_signals'), icon: BarChart3 },
    { id: 'account', label: t('support_topic_account'), icon: User },
    { id: 'technical', label: t('support_topic_technical'), icon: HelpCircle },
  ];

  const handleSubmit = async () => {
    if (!selectedTopic || !message.trim()) {
      toast({ title: t('support_ticket_submit_title'), description: t('support_ticket_fill_fields'), variant: 'destructive' });
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    toast({ title: t('support_ticket_sent'), description: t('support_ticket_sent_desc') });
    setSelectedTopic(''); setSubject(''); setMessage(''); setFile(null);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground -ml-2">{t('support_back')}</Button>
      <GlowCard>
        <CardHeader><CardTitle className="text-sm text-primary">{t('support_send_request')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('support_send_request_desc')}</p>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('support_subject')}</label>
            <div className="flex flex-wrap gap-2">
              {helpTopics.map(tp => (
                <Button key={tp.id} variant={selectedTopic === tp.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTopic(tp.id)} className="text-xs gap-1">
                  <tp.icon className="w-3 h-3" />{tp.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('support_ticket_title_label')}</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('support_ticket_title_placeholder')} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('support_ticket_message')}</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t('support_ticket_message_placeholder')} className="bg-secondary border-border min-h-[100px]" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t('support_ticket_files')}</label>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center gap-2 bg-secondary border border-border/50 rounded-md px-3 py-2">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
                <button onClick={() => setFile(null)}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />{t('support_ticket_upload')}
              </Button>
            )}
          </div>
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSubmit} disabled={sending || !selectedTopic || !message.trim()}>
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                {t('support_ticket_sending')}
              </span>
            ) : (<><Send className="w-4 h-4 mr-2" />{t('support_ticket_send')}</>)}
          </Button>
        </CardContent>
      </GlowCard>
    </motion.div>
  );
}

function TicketRow({ id, topic, status, date, summary }: { id: string; topic: string; status: 'open' | 'resolved'; date: string; summary: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary">
      {status === 'resolved' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5"><span className="text-[10px] font-mono text-primary">{id}</span><Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{topic}</Badge></div>
        <p className="text-xs text-foreground truncate">{summary}</p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{date}</span>
    </div>
  );
}
