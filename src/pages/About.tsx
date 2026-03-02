import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Building2, Users, Globe, Server, Briefcase, UserCheck, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import aboutHero from '@/assets/about-hero.jpg';

const stats = [
  {
    icon: Briefcase,
    title: '6 años de experiencia',
    description: 'Más de seis años ofreciendo soluciones avanzadas en análisis financiero, señales inteligentes y herramientas tecnológicas de alto rendimiento.',
  },
  {
    icon: UserCheck,
    title: '93% de clientes recurrentes',
    description: 'Nuestro compromiso con la calidad y la precisión nos permite mantener una base sólida de usuarios que confían continuamente en nuestros servicios.',
  },
  {
    icon: Globe,
    title: '400+ clientes en 48 países',
    description: 'Alcance global con presencia activa en mercados de América, Europa, Asia y más.',
  },
  {
    icon: Server,
    title: '40+ dominios operativos',
    description: 'Infraestructura digital robusta, estable y en crecimiento constante para garantizar disponibilidad y expansión internacional.',
  },
  {
    icon: Building2,
    title: '1.600+ proyectos integrados',
    description: 'Más de mil seiscientos proyectos implementados con éxito, adaptados a diversas necesidades financieras y tecnológicas.',
  },
  {
    icon: Users,
    title: '3.000+ profesionales en TI',
    description: 'Una red global de más de tres mil expertos en tecnología respalda nuestro desarrollo, soporte y evolución continua.',
  },
];

const teamMembers = [
  {
    name: 'Isabella Walker',
    role: 'Profesional en Atención al Cliente',
    description: 'Profesional en Atención al Cliente con sólida experiencia en la resolución de solicitudes, gestión de quejas y creación de experiencias positivas para los usuarios. Reconocida por su comunicación clara, empatía, paciencia y capacidad para manejar situaciones de alta presión.',
    startYear: 2023,
    position: 'left',
  },
  {
    name: 'Cristopher Hayes',
    role: 'Mercado Internacional',
    description: 'Especialista en Mercado Internacional con sólida experiencia en la identificación de oportunidades comerciales, negociación con proveedores y clientes extranjeros, y gestión de operaciones de importación y exportación. Experto en analizar tendencias globales y evaluar riesgos comerciales.',
    startYear: 2021,
    position: 'right',
  },
  {
    name: 'Edith Sanchez',
    role: 'Marketing Digital',
    description: 'Especialista en Marketing con amplia experiencia en el desarrollo de estrategias de marca, campañas digitales y optimización del posicionamiento en mercados competitivos. Hábil en el análisis de datos, gestión de campañas multicanal y creación de contenido orientado al crecimiento.',
    startYear: 2022,
    position: 'left',
  },
  {
    name: 'Andres Lopez',
    role: 'Contador Senior',
    description: 'Contador Senior con amplia experiencia en la gestión contable, análisis financiero y cumplimiento tributario. Experto en elaborar estados financieros, coordinar cierres contables y asegurar el cumplimiento de normativas locales e internacionales.',
    startYear: 2021,
    position: 'right',
  },
  {
    name: 'Kenji Tanaka',
    role: 'Ingeniero en Software',
    description: 'Ingeniero en software con sólida experiencia en el diseño, desarrollo y optimización de aplicaciones escalables. Domina diversos lenguajes y frameworks modernos, con capacidad para trabajar tanto en backend como en frontend.',
    startYear: 2023,
    position: 'left',
  },
];

const offices = [
  {
    country: 'Malta',
    address: 'Marija Immakulata',
    city: 'Ghaghur 1326',
    email: 'valleta-coins@signal.com',
    phone: '+356-7950124',
  },
  {
    country: 'Netherland',
    address: 'Boomgaardstraat 12',
    city: 'Fijnaart 2544',
    email: 'hollad-coins@signal.com',
    phone: '+31 06 85006065',
  },
];

export default function About() {
  return (
    <PageShell>
      <Header />
      
      <main className="py-4 px-4">
        {/* Back button and title */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-bold text-primary">
            Un poco de<br />
            <span className="text-primary">Nuestro Comienzo</span>
          </h1>
        </div>

        {/* Hero image */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative">
            <img 
              src={aboutHero} 
              alt="Kinderdijk, Países Bajos" 
              className="w-full h-48 md:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        </Card>

        {/* Origin story */}
        <Card className="mb-8">
          <CardContent className="p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              El Origen de <span className="text-primary">COINS SIGNALS</span> en Kinderdijk
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Hace exactamente cinco años, en la tranquila localidad de Kinderdijk, famosa por sus icónicos molinos de viento y su profunda conexión con la gestión del agua, tres amigos de la universidad, Lois, Edith y Kenji, solían reunirse. Los tres compartían una visión clara: el mercado de inversiones, especialmente el de las señales de trading, era un laberinto para muchos, lleno de información poco fiable y riesgos innecesarios.
              </p>
              <p>
                Lois, un analista financiero con años de experiencia, había visto de primera mano cómo inversores pequeños perdían capital por decisiones impulsivas. Kenji, un ingeniero de software con un ojo clínico para la eficiencia y la seguridad de las plataformas, creía firmemente que la tecnología podía aportar transparencia. Edith, la tercera del grupo, con su experiencia en marketing y comunicación, entendía la necesidad de simplificar mensajes complejos para un público amplio.
              </p>
              <p>
                Fue durante una de esas tardes de lluvia, con el zumbido de los molinos de fondo, que decidieron aunar sus fuerzas. Su objetivo era construir una aplicación: <span className="text-primary font-semibold">COINS SIGNALS</span>. No querían ser otra plataforma que vendiera "consejos" rápidos, sino una herramienta robusta y fiable donde los inversores pudieran acceder a señales cuidadosamente analizadas y verificadas, con un fuerte énfasis en la gestión de riesgos y la educación del usuario.
              </p>
              <p>
                El proceso no fue sencillo. Dedicaron incontables horas a desarrollar algoritmos, a establecer estrictos protocolos de validación para las señales y a construir una interfaz intuitiva. Su motivación siempre fue la misma: ofrecer una vía más segura y fundamentada para que las personas tomaran decisiones de inversión informadas.
              </p>
              <p>
                Hoy, cinco años después de aquel inicio en Kinderdijk, COINS SIGNALS se ha consolidado como una aplicación de referencia. Lo que comenzó como un proyecto entre tres amigos, impulsados por la necesidad de una mayor seguridad en las inversiones, es ahora una herramienta que busca empoderar a los inversores, ayudándolos a navegar el mercado con mayor confianza y conocimiento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats section */}
        <h2 className="text-xl font-bold text-foreground mb-4">Datos Destacados</h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <h3 className="text-sm font-semibold text-primary leading-tight">{stat.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Team section */}
        <h2 className="text-xl font-bold text-foreground mb-4">Nuestro Personal</h2>
        <div className="space-y-4 mb-8">
          {teamMembers.map((member, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className={`flex gap-4 ${member.position === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <Avatar className="w-20 h-20 border-2 border-border">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-secondary text-foreground text-lg">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground mt-2 text-center max-w-[80px]">{member.role}</p>
                  </div>
                  <div className={`flex-1 ${member.position === 'right' ? 'text-left' : 'text-left'}`}>
                    <h3 className={`text-lg font-bold mb-2 ${member.position === 'right' ? 'text-primary' : 'text-amber-400'}`}>
                      {member.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {member.description}
                    </p>
                    <p className="text-xs text-primary">Inicio en {member.startYear}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Offices section */}
        <h2 className="text-xl font-bold text-foreground mb-4">Ubicación y Teléfonos</h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {offices.map((office, index) => (
            <Card key={index} className="overflow-hidden border-primary/30">
              <CardContent className="p-3">
                <p className="text-xs text-primary mb-1">Oficinal</p>
                <h3 className="text-base font-bold text-amber-400 mb-2">{office.country}</h3>
                <div className="space-y-1 text-xs text-foreground">
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{office.address}</p>
                      <p>{office.city}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border space-y-1">
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{office.email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Phone className="w-3 h-3" />
                    <span>{office.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
