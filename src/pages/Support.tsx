import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

/* ─── Chat ─── */
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

/* ─── Section selector ─── */
type Section = 'main' | 'faq' | 'chat' | 'ticket';

export default function Support() {
  const { user, profile } = useAuth();
  const [section, setSection] = useState<Section>('main');

  return (
    <PageShell>
      <Header />

      <main className="py-6 px-4">
        {/* Page header — always visible */}
        <div className="mb-6">
          <span className="text-xs text-muted-foreground">ID # {user?.id?.slice(0, 7) || '0572564'}</span>
          <h1 className="text-xl font-bold text-foreground">Contacto y Soporte</h1>
        </div>

        <AnimatePresence mode="wait">
          {section === 'main' && <MainSection key="main" onNavigate={setSection} />}
          {section === 'faq' && <FAQSection key="faq" onBack={() => setSection('main')} />}
          {section === 'chat' && <ChatSection key="chat" onBack={() => setSection('main')} userName={profile?.first_name || 'Trader'} />}
          {section === 'ticket' && <TicketSection key="ticket" onBack={() => setSection('main')} />}
        </AnimatePresence>
      </main>
    </PageShell>
  );
}

/* ━━━━━━━━━━━━━━━━━━ MAIN ━━━━━━━━━━━━━━━━━━ */
function MainSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-6">
      {/* Welcome */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-primary flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            Bienvenido, ¿Cómo te Podemos Ayudar?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Encuentra la mejor manera para resolver tus dudas.
          </p>

          {/* Status */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-2 border border-border/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-muted-foreground">Chat Activo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-2 border border-border/50">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-muted-foreground">&lt; 2h Email</span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-2 border border-border/50">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground">24/7</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onNavigate('chat')}>
              <MessageCircle className="w-6 h-6 text-primary" />
              <span className="text-xs">Chat En Vivo</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => window.open('https://wa.me/34600000000?text=Hola,%20necesito%20ayuda', '_blank')}
            >
              <Send className="w-6 h-6 text-primary" />
              <span className="text-xs">Whatsapp</span>
            </Button>
          </div>

          {/* Extra nav */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => onNavigate('faq')}>
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="text-xs">Preguntas Frecuentes</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => onNavigate('ticket')}>
              <Mail className="w-5 h-5 text-primary" />
              <span className="text-xs">Enviar Ticket</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-primary">Canales de Comunicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ContactRow icon={MessageCircle} title="Chat En Vivo" detail="Lun–Vie: 8:00 – 22:00 UTC" color="text-emerald-400" />
          <ContactRow icon={Phone} title="WhatsApp Business" detail="+34 600 000 000" color="text-green-400" onClick={() => window.open('https://wa.me/34600000000', '_blank')} />
          <ContactRow icon={Mail} title="Email" detail="soporte@ecosignal.ai" color="text-primary" onClick={() => window.open('mailto:soporte@ecosignal.ai', '_blank')} />
        </CardContent>
      </Card>

      {/* Offices */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-primary">Ubicación y Teléfonos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Oficinas Internacionales</p>
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Malta</p>
                <p className="text-xs text-muted-foreground">Marija Immakulata, Gzira 1326</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Netherlands</p>
                <p className="text-xs text-muted-foreground">Boomgaardstraat 12, Fijnaart 2544</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-primary">Legal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {['Términos de Uso', 'Política de Privacidad', 'Aviso de Riesgo', 'Política de Reembolso'].map(l => (
              <button key={l} className="flex items-center gap-1.5 bg-secondary border border-border/50 rounded-lg px-3 py-2 hover:bg-secondary/80 transition-colors text-left w-full">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-foreground">{l}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ContactRow({ icon: Icon, title, detail, color, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {onClick && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

/* ━━━━━━━━━━━━━━━━━━ FAQ ━━━━━━━━━━━━━━━━━━ */
function FAQSection({ onBack }: { onBack: () => void }) {
  const [searchQ, setSearchQ] = useState('');
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  const filtered = faqCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(i =>
      !searchQ || i.q.toLowerCase().includes(searchQ.toLowerCase()) || i.a.toLowerCase().includes(searchQ.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground -ml-2">
        ← Volver
      </Button>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-primary flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en preguntas frecuentes..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          {filtered.map(cat => (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-2">
                <cat.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">{cat.label}</span>
              </div>
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
      </Card>
    </motion.div>
  );
}

/* ━━━━━━━━━━━━━━━━━━ CHAT ━━━━━━━━━━━━━━━━━━ */
function ChatSection({ onBack, userName }: { onBack: () => void; userName: string }) {
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground -ml-2">
        ← Volver
      </Button>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm text-foreground">EcoSignal AI Assistant</CardTitle>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">En línea</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
              <Sparkles className="w-3 h-3 mr-0.5" /> AI
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Messages */}
          <div className="h-[340px] overflow-y-auto space-y-2 pr-1">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.from === 'user'
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-secondary border border-border/50'
                }`}>
                  <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
                  <p className="text-[9px] text-muted-foreground mt-1 text-right">{msg.time}</p>
                </div>
              </motion.div>
            ))}
            {typing && (
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

          {/* Input */}
          <div className="flex gap-2 pt-2 border-t border-border/30">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-secondary border-border"
            />
            <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ━━━━━━━━━━━━━━━━━━ TICKET ━━━━━━━━━━━━━━━━━━ */
function TicketSection({ onBack }: { onBack: () => void }) {
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
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    toast({ title: '✅ Ticket enviado', description: 'Recibirás una respuesta en menos de 2 horas.' });
    setSelectedTopic('');
    setSubject('');
    setMessage('');
    setFile(null);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground -ml-2">
        ← Volver
      </Button>

      {/* Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-primary">Envíanos una Solicitud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envíanos un mensaje con todas tus dudas y te responderemos en el menor tiempo posible.
          </p>

          {/* Search help */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Buscar Ayuda</label>
            <Input placeholder="Escribe tu consulta..." className="bg-secondary border-border" />
          </div>

          {/* Topics */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Asunto</label>
            <div className="flex flex-wrap gap-2">
              {helpTopics.map(t => (
                <Button
                  key={t.id}
                  variant={selectedTopic === t.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTopic(t.id)}
                  className="text-xs gap-1"
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Título</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Resumen breve del problema..."
              className="bg-secondary border-border"
            />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Mensaje</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe tu problema o consulta..."
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>

          {/* File */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Archivos Adjuntos (opcional)</label>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center gap-2 bg-secondary border border-border/50 rounded-md px-3 py-2">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
                <button onClick={() => setFile(null)}>
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Subir Archivo
              </Button>
            )}
          </div>

          {/* Submit */}
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleSubmit}
            disabled={sending || !selectedTopic || !message.trim()}
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-primary">Tickets Recientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <TicketRow id="TK-4821" topic="Señales" status="resolved" date="05 Mar" summary="Señal EUR/USD no se cerró automáticamente" />
          <TicketRow id="TK-4798" topic="Pagos" status="open" date="03 Mar" summary="Cobro duplicado en suscripción mensual" />
          <TicketRow id="TK-4756" topic="Cuenta" status="resolved" date="28 Feb" summary="Solicitud de verificación KYC" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TicketRow({ id, topic, status, date, summary }: { id: string; topic: string; status: 'open' | 'resolved'; date: string; summary: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary">
      {status === 'resolved'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-primary">{id}</span>
          <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{topic}</Badge>
        </div>
        <p className="text-xs text-foreground truncate">{summary}</p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{date}</span>
    </div>
  );
}
