import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Building2, Users, Globe, Server, Briefcase, UserCheck, MapPin, Phone, Mail, Target, TrendingUp, Shield, Award, Zap, BarChart3, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import aboutHero from '@/assets/about-hero.jpg';
import isabellaAvatar from '@/assets/team/isabella-walker.jpg';
import cristopherAvatar from '@/assets/team/cristopher-hayes.jpg';
import edithAvatar from '@/assets/team/edith-sanchez.jpg';
import andresAvatar from '@/assets/team/andres-lopez.jpg';
import kenjiAvatar from '@/assets/team/kenji-tanaka.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const stats = [
  { icon: Briefcase, value: '6+', label: 'Años de Experiencia', desc: 'Soluciones avanzadas en análisis financiero y señales inteligentes.' },
  { icon: UserCheck, value: '93%', label: 'Clientes Recurrentes', desc: 'Base sólida de usuarios que confían continuamente en nuestros servicios.' },
  { icon: Globe, value: '400+', label: 'Clientes en 48 países', desc: 'Presencia activa en mercados de América, Europa, Asia y más.' },
  { icon: Server, value: '40+', label: 'Dominios Operativos', desc: 'Infraestructura digital robusta y en crecimiento constante.' },
  { icon: Building2, value: '1.6K+', label: 'Proyectos Integrados', desc: 'Implementados con éxito, adaptados a diversas necesidades.' },
  { icon: Users, value: '3K+', label: 'Profesionales en TI', desc: 'Red global de expertos respaldando desarrollo y soporte.' },
];

const values = [
  { icon: Target, title: 'Precisión', desc: 'Cada señal pasa por múltiples capas de validación antes de publicarse.' },
  { icon: Shield, title: 'Seguridad', desc: 'Protección de datos y gestión de riesgos como prioridad absoluta.' },
  { icon: TrendingUp, title: 'Innovación', desc: 'IA y algoritmos en constante evolución para anticipar el mercado.' },
  { icon: Award, title: 'Transparencia', desc: 'Historial verificable de rendimiento y métricas en tiempo real.' },
];

const teamMembers = [
  { name: 'Isabella Walker', role: 'Atención al Cliente', desc: 'Resolución de solicitudes, gestión de quejas y experiencias positivas. Comunicación clara, empatía y manejo de alta presión.', year: 2023, avatar: isabellaAvatar },
  { name: 'Cristopher Hayes', role: 'Mercado Internacional', desc: 'Identificación de oportunidades comerciales, negociación con clientes extranjeros y análisis de tendencias globales.', year: 2021, avatar: cristopherAvatar },
  { name: 'Edith Sanchez', role: 'Marketing Digital', desc: 'Estrategias de marca, campañas digitales y optimización de posicionamiento en mercados competitivos.', year: 2022, avatar: edithAvatar },
  { name: 'Andres Lopez', role: 'Contador Senior', desc: 'Gestión contable, análisis financiero y cumplimiento tributario. Elaboración de estados financieros.', year: 2021, avatar: andresAvatar },
  { name: 'Kenji Tanaka', role: 'Ingeniero de Software', desc: 'Diseño, desarrollo y optimización de aplicaciones escalables. Backend y frontend con frameworks modernos.', year: 2023, avatar: kenjiAvatar },
];

const milestones = [
  { year: '2019', event: 'Fundación en Kinderdijk, Países Bajos' },
  { year: '2020', event: 'Lanzamiento de la app con 50 usuarios beta' },
  { year: '2021', event: 'Expansión a 15 países, algoritmos de IA v2' },
  { year: '2022', event: 'Integración multi-broker y 1.000+ usuarios' },
  { year: '2023', event: 'Lanzamiento de portfolio y análisis en tiempo real' },
  { year: '2024', event: '400+ clientes activos en 48 países' },
];

const offices = [
  { flag: '🇲🇹', country: 'Malta', address: 'Marija Immakulata', city: 'Gzira 1326', email: 'valleta-coins@signal.com', phone: '+356-7950124' },
  { flag: '🇳🇱', country: 'Netherlands', address: 'Boomgaardstraat 12', city: 'Fijnaart 2544', email: 'hollad-coins@signal.com', phone: '+31 06 85006065' },
];

export default function About() {
  return (
    <PageShell>
      <Header />

      <main className="py-4 px-4">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Sobre Nosotros</h1>
            <p className="text-xs text-muted-foreground">La historia detrás de COINS SIGNALS</p>
          </div>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6 overflow-hidden bg-card border-border">
            <div className="relative">
              <img src={aboutHero} alt="Kinderdijk, Países Bajos" className="w-full h-48 md:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary mb-2">
                  <Zap className="w-3 h-3 mr-1" /> Fundada en 2019
                </Badge>
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  De Kinderdijk al Mundo
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Tres amigos, una visión: democratizar el trading inteligente</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Origin story */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Nuestro Origen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Hace más de cinco años, en la tranquila localidad de <span className="text-foreground font-medium">Kinderdijk</span>, famosa por sus icónicos molinos de viento, tres amigos de la universidad — <span className="text-primary font-semibold">Lois, Edith y Kenji</span> — compartían una visión clara: el mercado de inversiones era un laberinto lleno de información poco fiable.
            </p>
            <p>
              Lois, analista financiero, había visto inversores pequeños perder capital por decisiones impulsivas. Kenji, ingeniero de software, creía que la tecnología podía aportar transparencia. Edith, con su experiencia en marketing, entendía la necesidad de simplificar mensajes complejos.
            </p>
            <p>
              Fue durante una tarde de lluvia, con el zumbido de los molinos de fondo, que decidieron crear <span className="text-primary font-semibold">COINS SIGNALS</span> — no otra plataforma de "consejos" rápidos, sino una herramienta robusta donde los inversores pudieran acceder a señales cuidadosamente analizadas con énfasis en gestión de riesgos.
            </p>
            <p>
              Hoy, COINS SIGNALS se ha consolidado como una aplicación de referencia que empodera a inversores en más de 48 países, ayudándolos a navegar el mercado con confianza y conocimiento.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Shield className="w-4 h-4" /> Nuestros Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {values.map((v, i) => (
                <motion.div key={v.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary border border-border/50">
                    <v.icon className="w-5 h-5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Datos Destacados
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Card className="bg-card border-border h-full">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-lg font-bold text-primary tabular-nums">{s.value}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-1">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Zap className="w-4 h-4" /> Nuestra Trayectoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l-2 border-primary/30 space-y-4">
              {milestones.map((m, i) => (
                <motion.div key={m.year} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-primary border-2 border-card" />
                  <div>
                    <span className="text-xs font-bold text-primary tabular-nums">{m.year}</span>
                    <p className="text-xs text-muted-foreground">{m.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Nuestro Equipo
        </h2>
        <div className="space-y-3 mb-6">
          {teamMembers.map((m, i) => (
            <motion.div key={m.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Card className="bg-card border-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-14 h-14 border-2 border-border shrink-0">
                      <AvatarImage src={m.avatar} alt={m.name} />
                      <AvatarFallback className="bg-secondary text-foreground text-sm font-bold">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground">{m.name}</h3>
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-primary/30 text-primary shrink-0">
                          {m.year}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-medium text-primary mb-1">{m.role}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Offices */}
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Oficinas Internacionales
        </h2>
        <div className="grid grid-cols-1 gap-3 mb-6">
          {offices.map((o) => (
            <Card key={o.country} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{o.flag}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{o.country}</h3>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">{o.address}, {o.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-primary shrink-0" />
                        <a href={`mailto:${o.email}`} className="text-xs text-primary hover:underline truncate">{o.email}</a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-xs text-primary tabular-nums">{o.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-foreground font-medium mb-1">¿Listo para empezar?</p>
            <p className="text-xs text-muted-foreground mb-3">Únete a más de 400 traders que confían en nosotros</p>
            <div className="flex gap-2 justify-center">
              <Link to="/signals">
                <Button size="sm" className="text-xs gap-1">
                  <BarChart3 className="w-3.5 h-3.5" /> Ver Señales <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
              <Link to="/support">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Mail className="w-3.5 h-3.5" /> Contacto
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
