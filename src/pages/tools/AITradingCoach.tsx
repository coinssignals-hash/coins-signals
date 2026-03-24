import { useState, useRef, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Brain, Send, Sparkles, TrendingUp, Shield, Target, BookOpen,
  MessageCircle, Loader2, User, Lightbulb, BarChart3
} from 'lucide-react';

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
      <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-130px)] px-4 pt-3">
        {/* Stats bar */}
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="outline" className="text-xs rounded-lg" style={{
            borderColor: `hsl(${ACCENT} / 0.3)`, color: `hsl(${ACCENT})`,
          }}>
            <MessageCircle className="w-3 h-3 mr-1" /> {sessionStats.questions} consultas
          </Badge>
          <Badge variant="outline" className="text-xs rounded-lg" style={{
            borderColor: `hsl(${ACCENT} / 0.3)`, color: `hsl(${ACCENT})`,
          }}>
            <Sparkles className="w-3 h-3 mr-1" /> {sessionStats.tips} consejos
          </Badge>
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {QUICK_PROMPTS.map((qp, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-colors"
                style={{
                  background: 'hsl(var(--card) / 0.8)',
                  border: '1px solid hsl(var(--border) / 0.3)',
                }}
                onClick={() => sendMessage(qp.prompt)}
              >
                <qp.icon className="w-4 h-4 shrink-0" style={{ color: `hsl(${ACCENT})` }} />
                <span className="text-xs font-medium leading-tight text-foreground">{qp.label}</span>
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
                <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 items-center pb-2">
          <Input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Pregunta a tu coach..." className="flex-1 h-10 rounded-xl bg-background/40 border-border/30" disabled={isLoading} />
          <Button size="icon" className="h-10 w-10 rounded-xl" onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
            style={{ background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))` }}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
