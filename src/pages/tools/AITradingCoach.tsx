import { useState, useRef, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Brain, Send, Sparkles, TrendingUp, Shield, Target, BookOpen,
  MessageCircle, Loader2, User, Lightbulb, BarChart3, ArrowLeft
} from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ACCENT = '270 70% 60%';

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Analiza mi último trade', prompt: 'Analiza mi último trade en EUR/USD donde entré en 1.0850 con SL en 1.0820 y TP en 1.0910. ¿Fue una buena entrada?' },
  { icon: Shield, label: 'Revisar gestión de riesgo', prompt: 'Revisa mi gestión de riesgo: arriesgo 2% por trade, uso ratio 1:2, y tengo un drawdown actual del 8%. ¿Qué mejoras sugieres?' },
  { icon: Target, label: 'Plan de trading semanal', prompt: 'Ayúdame a crear un plan de trading para esta semana. Me enfoco en EUR/USD y GBP/USD en temporalidades H1 y H4.' },
  { icon: BookOpen, label: 'Ejercicio de disciplina', prompt: 'Dame un ejercicio práctico para mejorar mi disciplina de trading y evitar el overtrading.' },
  { icon: Lightbulb, label: 'Mentalidad ganadora', prompt: 'Estoy en una racha perdedora de 5 trades. ¿Cómo puedo recuperar la confianza sin hacer revenge trading?' },
  { icon: BarChart3, label: 'Optimizar estrategia', prompt: 'Mi estrategia tiene un win rate del 55% con ratio R:R de 1.5:1. ¿Cómo puedo optimizarla para mejorar la expectativa?' },
];

export default function AITradingCoach() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'assistant',
      content: '¡Hola! 👋 Soy tu **Coach de Trading con IA**. Puedo ayudarte con:\n\n- 📊 **Análisis de trades** — revisemos tus operaciones\n- 🛡️ **Gestión de riesgo** — optimicemos tu estrategia\n- 🧠 **Psicología** — trabajemos tu mentalidad\n- 📋 **Plan de trading** — creemos uno juntos\n- 🎯 **Mejora continua** — identifiquemos áreas de crecimiento\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState({ questions: 0, tips: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setSessionStats(s => ({ ...s, questions: s.questions + 1 }));

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: allMessages,
            systemPrompt: `Eres un coach profesional de trading con más de 15 años de experiencia en los mercados financieros. Tu rol es guiar al trader de forma personalizada.\n\nREGLAS:\n- Responde siempre en ${language === 'en' ? 'inglés' : language === 'pt' ? 'portugués' : language === 'fr' ? 'francés' : language === 'de' ? 'alemán' : language === 'it' ? 'italiano' : 'español'}\n- Sé directo pero empático\n- Usa ejemplos prácticos y números concretos\n- Si el trader está frustrado, primero valida sus emociones\n- Siempre incluye al menos un consejo accionable\n- Usa formato markdown con headers y bullets\n- No des consejos de inversión específicos, enfócate en proceso y disciplina\n- Si detectas malos hábitos (overtrading, revenge trading, no usar SL), señálalos con tacto\n- Incluye ejercicios prácticos cuando sea apropiado`,
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
                return [...prev, { id: assistantId, role: 'assistant', content: assistantContent, timestamp: new Date() }];
              });
            }
          } catch { /* partial */ }
        }
      }
      setSessionStats(s => ({ ...s, tips: s.tips + 1 }));
    } catch {
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: 'Lo siento, no pude procesar tu consulta en este momento. Intenta de nuevo en unos segundos. 🔄', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="relative px-4 py-4">
          <div className="flex items-center gap-3">
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
                <Brain className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {t('drawer_ai_coach') || 'Coach IA'}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Tu mentor de trading personalizado
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-semibold" style={{
                borderColor: `hsl(${ACCENT} / 0.3)`, color: `hsl(${ACCENT})`,
                background: `hsl(${ACCENT} / 0.08)`,
              }}>
                <MessageCircle className="w-2.5 h-2.5 mr-0.5" /> {sessionStats.questions}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-semibold" style={{
                borderColor: `hsl(160 84% 39% / 0.3)`, color: `hsl(160 84% 39%)`,
                background: `hsl(160 84% 39% / 0.08)`,
              }}>
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> {sessionStats.tips}
              </Badge>
            </div>
          </div>
        </div>

        <div className="h-px" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.3), transparent)`,
        }} />
      </div>

      <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-195px)] px-4 pt-3">
        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {QUICK_PROMPTS.map((qp, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <GlowSection color={ACCENT} className="h-full">
                  <button className="flex items-center gap-2 p-2.5 w-full text-left active:scale-[0.97] transition-transform"
                    onClick={() => sendMessage(qp.prompt)}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{
                      background: `hsl(${ACCENT} / 0.15)`,
                      boxShadow: `0 0 8px hsl(${ACCENT} / 0.1)`,
                    }}>
                      <qp.icon className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
                    </div>
                    <span className="text-xs font-medium leading-tight text-foreground">{qp.label}</span>
                  </button>
                </GlowSection>
              </motion.div>
            ))}
          </div>
        )}

        {/* Chat messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-hide">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{
                    background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.7))`,
                    boxShadow: `0 0 12px hsl(${ACCENT} / 0.3)`,
                  }}>
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}
                {msg.role === 'assistant' ? (
                  <GlowSection color={ACCENT} className="max-w-[85%] rounded-tl-sm">
                    <div className="px-3 py-2 prose prose-sm prose-invert max-w-none text-sm [&>p]:mb-2 [&>ul]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </GlowSection>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 relative overflow-hidden" style={{
                    background: `linear-gradient(165deg, hsl(${ACCENT}) 0%, hsl(${ACCENT} / 0.8) 100%)`,
                  }}>
                    <div className="absolute top-0 inset-x-0 h-[1px]" style={{
                      background: `linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.4), transparent)`,
                    }} />
                    <p className="text-sm text-white relative">{msg.content}</p>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{
                    background: 'hsl(var(--muted) / 0.5)',
                    border: '1px solid hsl(var(--border) / 0.2)',
                  }}>
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.7))`,
                boxShadow: `0 0 12px hsl(${ACCENT} / 0.3)`,
              }}>
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: `hsl(${ACCENT})` }} /> Pensando...
              </div>
            </div>
          )}
        </div>

        {/* Input — glassmorphic */}
        <div className="flex gap-2 items-center pb-2">
          <div className="flex-1 relative" style={{
            background: 'hsl(var(--card) / 0.6)',
            borderRadius: '0.75rem',
            border: `1px solid hsl(${ACCENT} / 0.15)`,
            backdropFilter: 'blur(8px)',
          }}>
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Pregunta a tu coach..."
              className="h-10 bg-transparent border-0 focus-visible:ring-0 text-sm"
              disabled={isLoading} />
          </div>
          <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
            style={{
              background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
              border: `1px solid hsl(${ACCENT} / 0.5)`,
              boxShadow: `0 0 15px hsl(${ACCENT} / 0.2)`,
            }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </PageShell>
  );
}
