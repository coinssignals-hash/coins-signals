import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GlowSection } from '@/components/ui/glow-section';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  Brain, Send, Sparkles, TrendingUp, Shield, Target, BookOpen,
  MessageCircle, Loader2, User, Lightbulb, BarChart3, Heart
} from 'lucide-react';

const ACCENT = '270 70% 60%';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface JournalEntry {
  date: string;
  pair: string;
  action: string;
  entryPrice: string;
  exitPrice: string;
  lotSize: string;
  stopLoss: string;
  takeProfit: string;
  result: string;
  pips: string;
  notes: string;
}

interface PsychEntry {
  id: string;
  date: string;
  emotion: string;
  discipline: number;
  followed_plan: boolean;
  notes: string;
  result?: string;
  mistakes: string[];
}

interface JournalCoachProps {
  journalEntries: JournalEntry[];
  psychologyEntries: PsychEntry[];
}

const QUICK_PROMPTS = [
  { icon: BarChart3, label: 'Analizar rendimiento', prompt: 'Analiza mi rendimiento general basándote en mi diario de trading. ¿Cuáles son mis fortalezas y debilidades?' },
  { icon: Shield, label: 'Revisar riesgo', prompt: 'Revisa mi gestión de riesgo según mis operaciones registradas. ¿Estoy usando bien el SL y TP?' },
  { icon: Heart, label: 'Análisis emocional', prompt: 'Analiza la correlación entre mis emociones y mis resultados de trading. ¿Qué patrones ves?' },
  { icon: Target, label: 'Plan semanal', prompt: 'Basándote en mis datos, crea un plan de trading personalizado para esta semana.' },
  { icon: Lightbulb, label: 'Errores frecuentes', prompt: 'Identifica mis errores más recurrentes y dame un plan de acción para corregirlos.' },
  { icon: TrendingUp, label: 'Optimizar estrategia', prompt: 'Basándote en mi win rate y ratio R:R, ¿cómo puedo optimizar mi estrategia?' },
];

export function JournalCoach({ journalEntries, psychologyEntries }: JournalCoachProps) {
  const { language } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'assistant',
      content: journalEntries.length > 0
        ? `¡Hola! 👋 Soy tu **Coach de Trading con IA**. Tengo acceso completo a tu diario (**${journalEntries.length} operaciones**) ${psychologyEntries.length > 0 ? `y tu perfil psicológico (**${psychologyEntries.length} sesiones**)` : ''}.\n\nPuedo ayudarte con:\n- 📊 **Análisis personalizado** de tu rendimiento\n- 🛡️ **Gestión de riesgo** basada en tus datos\n- 🧠 **Psicología** — correlación emociones/resultados\n- 🎯 **Plan de mejora** personalizado\n\n¿Qué quieres trabajar hoy?`
        : '¡Hola! 👋 Soy tu **Coach de Trading con IA**. Aún no tienes operaciones registradas en tu diario. ¡Empieza registrando tus trades y sesiones psicológicas para que pueda darte análisis personalizados! 📊',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            journalContext: journalEntries,
            psychologyContext: psychologyEntries,
            language,
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error('Stream error');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.id === assistantId)
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                return [...prev, { id: assistantId, role: 'assistant', content: assistantContent }];
              });
            }
          } catch { /* partial */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: 'Lo siento, no pude procesar tu consulta. Intenta de nuevo. 🔄' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {QUICK_PROMPTS.map((qp, i) => (
            <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-colors"
              style={{
                background: 'hsl(var(--card) / 0.8)',
                border: '1px solid hsl(var(--border) / 0.3)',
              }}
              onClick={() => sendMessage(qp.prompt)}
            >
              <qp.icon className="w-4 h-4 shrink-0" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-[10px] font-medium leading-tight text-foreground">{qp.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1" style={{
                  background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.7))`,
                }}>
                  <Brain className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} style={
                msg.role === 'user'
                  ? { background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`, color: 'white' }
                  : { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.3)' }
              }>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none text-sm [&>p]:mb-2 [&>ul]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
              background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.7))`,
            }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Analizando tus datos...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Pregunta sobre tu trading..." className="flex-1 h-10 rounded-xl bg-background/40 border-border/30" disabled={isLoading} />
        <Button size="icon" className="h-10 w-10 rounded-xl" onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
          style={{ background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))` }}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
