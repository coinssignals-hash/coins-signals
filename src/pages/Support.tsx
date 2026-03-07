import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, Upload, MapPin, Phone, Mail,
  ChevronDown, ChevronUp, Search, Clock, CheckCircle2,
  AlertCircle, HelpCircle, Headphones, Shield, CreditCard,
  BarChart3, Globe, ExternalLink, Bot, User, Paperclip,
  Sparkles, ArrowRight, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/* ─── FAQ data ─── */
const faqCategories = [
  {
    icon: BarChart3, label: 'Señales',
    items: [
      { q: '¿Cómo se generan las señales de trading?', a: 'Nuestras señales se generan mediante análisis técnico avanzado combinado con inteligencia artificial. Cada señal incluye punto de entrada, stop loss, take profit y nivel de probabilidad.' },
      { q: '¿Cuántas señales se publican por día?', a: 'Publicamos entre 3 y 8 señales diarias dependiendo de las condiciones del mercado. Las señales se concentran en las sesiones de Londres y Nueva York.' },
      { q: '¿Qué significa el porcentaje de probabilidad?', a: 'Es la confianza del algoritmo en que el precio alcanzará el take profit antes del stop loss, basada en patrones históricos y condiciones actuales del mercado.' },
    ]
  },
  {
    icon: CreditCard, label: 'Pagos',
    items: [
      { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, AMEX), PayPal, y transferencias bancarias en países seleccionados.' },
      { q: '¿Puedo cancelar mi suscripción en cualquier momento?', a: 'Sí, puedes cancelar desde Configuración → Suscripción. Mantendrás acceso hasta el final del período facturado.' },
      { q: '¿Ofrecen reembolsos?', a: 'Ofrecemos reembolso completo dentro de los primeros 7 días si no estás satisfecho con el servicio.' },
    ]
  },
  {
    icon: Shield, label: 'Cuenta',
    items: [
      { q: '¿Cómo verifico mi cuenta?', a: 'Ve a Configuración → Documentos y sube tu identificación oficial y comprobante de domicilio. La verificación toma 24-48 horas.' },
      { q: '¿Cómo cambio mi contraseña?', a: 'Accede a Configuración → Seguridad → Cambiar Contraseña. Recibirás un email de confirmación.' },
      { q: '¿Puedo vincular múltiples brokers?', a: 'Sí, puedes vincular hasta 3 brokers simultáneamente desde la sección Portfolio → Vincular Broker.' },
    ]
  },
];

const helpTopics = [
  { id: 'verification', label: 'Verificación', icon: Shield },
  { id: 'payments', label: 'Pagos', icon: CreditCard },
  { id: 'signals', label: 'Señales', icon: BarChart3 },
  { id: 'account', label: 'Cuenta', icon: User },
  { id: 'technical', label: 'Soporte Técnico', icon: HelpCircle },
];

/* ─── Chat messages type ─── */
interface ChatMessage {
  id: number;
  from: 'user' | 'bot';
  text: string;
  time: string;
}

const botResponses: Record<string, string> = {
  hola: '¡Hola! 👋 Soy el asistente virtual de EcoSignal. ¿En qué puedo ayudarte hoy?',
  señal: 'Nuestras señales se actualizan en tiempo real. Puedes verlas en la sección "Señales". ¿Necesitas ayuda con alguna señal en particular?',
  pago: 'Para temas de pagos, te recomiendo contactar directamente con nuestro equipo financiero por WhatsApp. ¿Quieres que te conecte?',
  cuenta: 'Puedo ayudarte con tu cuenta. ¿Necesitas cambiar tu contraseña, actualizar datos personales o verificar tu identidad?',
  default: 'Entiendo tu consulta. Nuestro equipo de soporte revisará tu mensaje y te responderá en menos de 2 horas. ¿Hay algo más en lo que pueda ayudarte?',
};

function getNow() {
  return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Main Component ─── */
export default function Support() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('help');

  return (
    <PageShell>
      <Header />
      <main className="py-4 px-3 space-y-4">
        {/* Hero */}
        <SignalStyleCard label="Centro de Soporte">
          <div className="px-4 pb-4 pt-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground">Contacto y Soporte</h1>
                <p className="text-[11px] text-muted-foreground">
                  ID #{user?.id?.slice(0, 8) || '0572564'} · {profile?.first_name || 'Trader'}
                </p>
              </div>
            </div>
            {/* Status indicators */}
            <div className="grid grid-cols-3 gap-2">
              <StatusPill icon={CheckCircle2} label="Chat Activo" color="text-emerald-400" />
              <StatusPill icon={Clock} label="< 2h Email" color="text-amber-400" />
              <StatusPill icon={Globe} label="24/7" color="text-primary" />
            </div>
          </div>
        </SignalStyleCard>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-secondary/60 border border-border h-9 p-0.5">
            <TabsTrigger value="help" className="text-xs flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <HelpCircle className="w-3.5 h-3.5 mr-1" /> Ayuda
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> Chat
            </TabsTrigger>
            <TabsTrigger value="ticket" className="text-xs flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Send className="w-3.5 h-3.5 mr-1" /> Ticket
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Phone className="w-3.5 h-3.5 mr-1" /> Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="help"><HelpTab /></TabsContent>
          <TabsContent value="chat"><ChatTab userName={profile?.first_name || 'Trader'} /></TabsContent>
          <TabsContent value="ticket"><TicketTab /></TabsContent>
          <TabsContent value="contact"><ContactTab /></TabsContent>
        </Tabs>
      </main>
    </PageShell>
  );
}

/* ─── Status Pill ─── */
function StatusPill({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-2 py-1.5 border border-border/50">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━ HELP TAB ━━━━━━━━━━━━━━━━━━ */
function HelpTab() {
  const [searchQ, setSearchQ] = useState('');
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  const filtered = faqCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(
      i => !searchQ || i.q.toLowerCase().includes(searchQ.toLowerCase()) || i.a.toLowerCase().includes(searchQ.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="space-y-3 mt-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar en preguntas frecuentes..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          className="pl-9 bg-secondary/60 border-border text-sm h-9"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <QuickActionBtn icon={MessageCircle} label="Chat En Vivo" sub="Respuesta inmediata" onClick={() => {}} color="text-emerald-400" />
        <QuickActionBtn
          icon={Phone}
          label="WhatsApp"
          sub="Línea directa"
          onClick={() => window.open('https://wa.me/34600000000?text=Hola,%20necesito%20ayuda', '_blank')}
          color="text-green-400"
        />
      </div>

      {/* FAQ */}
      {filtered.map((cat) => (
        <SignalStyleCard key={cat.label} label={cat.label}>
          <div className="px-3 pb-3 space-y-1">
            {cat.items.map((item, i) => {
              const key = `${cat.label}-${i}`;
              const isOpen = openIdx === key;
              return (
                <motion.div key={key} layout className="border-b border-border/30 last:border-0">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : key)}
                    className="w-full flex items-start gap-2 py-2.5 text-left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-xs text-foreground font-medium flex-1">{item.q}</span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[11px] text-muted-foreground pb-3 pl-5 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </SignalStyleCard>
      ))}
    </div>
  );
}

function QuickActionBtn({ icon: Icon, label, sub, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 bg-secondary/60 border border-border/50 rounded-xl px-3 py-3 hover:bg-secondary/80 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className={`w-4.5 h-4.5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </button>
  );
}

/* ━━━━━━━━━━━━━━━━━━ CHAT TAB ━━━━━━━━━━━━━━━━━━ */
function ChatTab({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, from: 'bot', text: `¡Hola ${userName}! 👋 Soy el asistente de EcoSignal AI. ¿En qué puedo ayudarte hoy?`, time: getNow() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), from: 'user', text: input.trim(), time: getNow() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const lower = input.toLowerCase();
    const key = Object.keys(botResponses).find(k => lower.includes(k)) || 'default';

    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: botResponses[key], time: getNow() }]);
    }, 1200 + Math.random() * 800);
  };

  return (
    <div className="mt-3">
      <SignalStyleCard>
        <div className="px-3 pt-3 pb-2">
          {/* Chat header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">EcoSignal AI Assistant</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">En línea</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
              <Sparkles className="w-3 h-3 mr-0.5" /> AI
            </Badge>
          </div>

          {/* Messages */}
          <div className="h-[320px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.from === 'user'
                    ? 'bg-primary/20 border border-primary/30 text-foreground'
                    : 'bg-secondary/80 border border-border/50 text-foreground'
                }`}>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                  <p className="text-[9px] text-muted-foreground mt-1 text-right">{msg.time}</p>
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-secondary/80 border border-border/50 rounded-xl px-4 py-2.5 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 h-9 text-xs bg-secondary/60 border-border"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SignalStyleCard>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━ TICKET TAB ━━━━━━━━━━━━━━━━━━ */
function TicketTab() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!selectedTopic || !message.trim()) {
      toast({ title: 'Completa todos los campos', description: 'Selecciona un asunto y escribe tu mensaje.', variant: 'destructive' });
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    toast({ title: '✅ Ticket enviado', description: 'Recibirás una respuesta en menos de 2 horas.' });
    setSelectedTopic('');
    setSubject('');
    setMessage('');
    setFile(null);
  };

  return (
    <div className="space-y-3 mt-3">
      <SignalStyleCard label="Nueva Solicitud">
        <div className="px-3 pb-3 space-y-3">
          {/* Topic */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Asunto</label>
            <div className="flex flex-wrap gap-1.5">
              {helpTopics.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    selectedTopic === t.id
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-secondary/40 border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Título</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Resumen breve del problema..."
              className="h-9 text-xs bg-secondary/60 border-border"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Mensaje</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe tu problema o consulta en detalle..."
              className="bg-secondary/60 border-border min-h-[100px] text-xs"
            />
          </div>

          {/* File */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Adjuntar Archivo</label>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center gap-2 bg-secondary/60 border border-border/50 rounded-lg px-3 py-2">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
                <button onClick={() => setFile(null)}>
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full text-xs h-9" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir Captura o PDF
              </Button>
            )}
          </div>

          {/* Submit */}
          <Button
            className="w-full h-10 text-xs font-semibold"
            onClick={handleSubmit}
            disabled={sending || !selectedTopic || !message.trim()}
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Enviar Ticket
              </>
            )}
          </Button>
        </div>
      </SignalStyleCard>

      {/* Recent Tickets (mock) */}
      <SignalStyleCard label="Tickets Recientes">
        <div className="px-3 pb-3 space-y-2">
          <TicketRow id="TK-4821" topic="Señales" status="resolved" date="05 Mar" summary="Señal EUR/USD no se cerró automáticamente" />
          <TicketRow id="TK-4798" topic="Pagos" status="open" date="03 Mar" summary="Cobro duplicado en suscripción mensual" />
          <TicketRow id="TK-4756" topic="Cuenta" status="resolved" date="28 Feb" summary="Solicitud de verificación KYC" />
        </div>
      </SignalStyleCard>
    </div>
  );
}

function TicketRow({ id, topic, status, date, summary }: { id: string; topic: string; status: 'open' | 'resolved'; date: string; summary: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-secondary/40 border border-border/30 rounded-lg px-3 py-2.5">
      {status === 'resolved'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-primary">{id}</span>
          <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-border/50">{topic}</Badge>
        </div>
        <p className="text-[11px] text-foreground truncate">{summary}</p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{date}</span>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━ CONTACT TAB ━━━━━━━━━━━━━━━━━━ */
function ContactTab() {
  return (
    <div className="space-y-3 mt-3">
      {/* Contact Methods */}
      <SignalStyleCard label="Canales de Comunicación">
        <div className="px-3 pb-3 space-y-2">
          <ContactMethodCard
            icon={MessageCircle}
            title="Chat En Vivo"
            subtitle="Respuesta inmediata durante horario de mercado"
            detail="Lun–Vie: 8:00 – 22:00 UTC"
            color="text-emerald-400"
          />
          <ContactMethodCard
            icon={Phone}
            title="WhatsApp Business"
            subtitle="Soporte prioritario para suscriptores Premium"
            detail="+34 600 000 000"
            color="text-green-400"
            action={() => window.open('https://wa.me/34600000000', '_blank')}
          />
          <ContactMethodCard
            icon={Mail}
            title="Email"
            subtitle="Respuesta en menos de 2 horas hábiles"
            detail="soporte@ecosignal.ai"
            color="text-primary"
            action={() => window.open('mailto:soporte@ecosignal.ai', '_blank')}
          />
        </div>
      </SignalStyleCard>

      {/* Offices */}
      <SignalStyleCard label="Oficinas Internacionales">
        <div className="px-3 pb-3 space-y-2">
          <OfficeCard country="🇲🇹 Malta" address="Marija Immakulata, Gzira 1326" timezone="CET (UTC+1)" />
          <OfficeCard country="🇳🇱 Netherlands" address="Boomgaardstraat 12, Fijnaart 2544" timezone="CET (UTC+1)" />
        </div>
      </SignalStyleCard>

      {/* Legal */}
      <SignalStyleCard label="Legal">
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <LegalLink label="Términos de Uso" />
            <LegalLink label="Política de Privacidad" />
            <LegalLink label="Aviso de Riesgo" />
            <LegalLink label="Política de Reembolso" />
          </div>
        </div>
      </SignalStyleCard>
    </div>
  );
}

function ContactMethodCard({ icon: Icon, title, subtitle, detail, color, action }: any) {
  return (
    <button
      onClick={action}
      className="w-full flex items-center gap-3 bg-secondary/40 border border-border/30 rounded-xl px-3 py-3 hover:bg-secondary/60 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        <p className="text-[10px] text-primary font-mono mt-0.5">{detail}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function OfficeCard({ country, address, timezone }: { country: string; address: string; timezone: string }) {
  return (
    <div className="flex items-start gap-3 bg-secondary/40 border border-border/30 rounded-xl px-3 py-3">
      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-foreground">{country}</p>
        <p className="text-[10px] text-muted-foreground">{address}</p>
        <p className="text-[10px] text-primary/70 font-mono mt-0.5">{timezone}</p>
      </div>
    </div>
  );
}

function LegalLink({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 bg-secondary/40 border border-border/30 rounded-lg px-3 py-2 hover:bg-secondary/60 transition-colors text-left w-full">
      <ExternalLink className="w-3 h-3 text-muted-foreground" />
      <span className="text-[10px] text-foreground">{label}</span>
    </button>
  );
}
