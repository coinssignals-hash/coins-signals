import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Video, Headphones, Play, Download, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  {
    id: 'inicio',
    name: 'Inicio al Trading',
    color: 'border-l-primary',
    modules: [
      {
        title: 'Introducción al trading',
        icon: FileText,
        type: 'pdf',
        lessons: [
          { id: '1.1', title: '¿Qué es el trading?', duration: '15 min' },
          { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' },
          { id: '1.3', title: 'Principales mercados: acciones, forex, índices, materias primas, criptos', duration: '20 min' },
        ]
      },
      {
        title: 'Cómo funciona una operación de trading',
        icon: Video,
        type: 'video',
        lessons: [
          { id: '2.1', title: 'Qué es una orden (market, límite, stop)', duration: '18 min' },
          { id: '2.2', title: 'Conceptos clave: spread, comisión, apalancamiento, margen', duration: '25 min' },
          { id: '2.3', title: 'Tipos de operaciones: compra (largo) y venta (corto)', duration: '15 min' },
          { id: '2.4', title: 'Stop loss y take profit (cómo protegerte y asegurar beneficios)', duration: '22 min' },
        ]
      }
    ]
  },
  {
    id: 'forex',
    name: 'Forex',
    color: 'border-l-accent',
    subcategories: ['Divisas', 'Análisis', 'Estrategias'],
    modules: [
      {
        title: 'Introducción al Forex',
        icon: FileText,
        type: 'pdf',
        lessons: [
          { id: '1.1', title: '¿Qué es el Forex?', duration: '10 min' },
          { id: '1.2', title: 'Pares de divisas principales', duration: '15 min' },
          { id: '1.3', title: 'Horarios del mercado Forex', duration: '12 min' },
        ]
      },
      {
        title: 'Análisis Técnico en Forex',
        icon: Video,
        type: 'video',
        lessons: [
          { id: '2.1', title: 'Lectura de gráficos de velas', duration: '20 min' },
          { id: '2.2', title: 'Indicadores técnicos esenciales', duration: '30 min' },
          { id: '2.3', title: 'Patrones de precio', duration: '25 min' },
        ]
      }
    ]
  },
  {
    id: 'acciones',
    name: 'Acciones',
    color: 'border-l-blue-500',
    subcategories: ['Bolsa de Valores', 'Análisis', 'Estrategias'],
    modules: [
      {
        title: 'Fundamentos de la Bolsa',
        icon: FileText,
        type: 'pdf',
        lessons: [
          { id: '1.1', title: '¿Qué es la bolsa de valores?', duration: '12 min' },
          { id: '1.2', title: 'Cómo comprar y vender acciones', duration: '18 min' },
        ]
      }
    ]
  },
  {
    id: 'metales',
    name: 'Metales',
    color: 'border-l-yellow-600',
    subcategories: ['Petróleo', 'Análisis', 'Estrategias'],
    modules: [
      {
        title: 'Trading con Materias Primas',
        icon: Headphones,
        type: 'podcast',
        lessons: [
          { id: '1.1', title: 'Oro y Plata: guía completa', duration: '45 min' },
          { id: '1.2', title: 'Petróleo: factores que mueven el precio', duration: '35 min' },
        ]
      }
    ]
  },
  {
    id: 'criptomonedas',
    name: 'Criptomonedas',
    color: 'border-l-purple-500',
    subcategories: ['Criptos', 'Análisis', 'Estrategias'],
    modules: [
      {
        title: 'Introducción a las Criptomonedas',
        icon: Video,
        type: 'video',
        lessons: [
          { id: '1.1', title: '¿Qué es Bitcoin?', duration: '20 min' },
          { id: '1.2', title: 'Altcoins: Ethereum, Solana y más', duration: '25 min' },
          { id: '1.3', title: 'Wallets y exchanges', duration: '18 min' },
        ]
      }
    ]
  }
];

const contentTypes = [
  { id: 'lectura', label: 'Lectura', icon: FileText, color: 'text-red-500' },
  { id: 'videos', label: 'Videos', icon: Video, color: 'text-blue-400' },
  { id: 'podcast', label: 'Podcast', icon: Headphones, color: 'text-purple-400' },
];

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState('inicio');
  const [contentType, setContentType] = useState('lectura');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'video': return <Video className="w-5 h-5 text-blue-400" />;
      case 'podcast': return <Headphones className="w-5 h-5 text-purple-400" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        {/* Hero Section */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-card to-secondary rounded-lg p-6 mb-6">
          <p className="text-lg text-foreground">
            Bienvenido <span className="text-primary font-bold">Philip j. Fray</span>
          </p>
          <h1 className="text-xl font-bold text-foreground">
            Encuentra la mejor manera para tu aprendizaje
          </h1>
        </div>

        {/* Categories Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'whitespace-nowrap',
                activeCategory === cat.id && 'bg-accent text-accent-foreground'
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Current Category Content */}
        {categories.map((category) => (
          <div 
            key={category.id} 
            className={cn('space-y-4', activeCategory !== category.id && 'hidden')}
          >
            <Card className={cn('border-l-4', category.color, 'bg-card')}>
              <CardContent className="p-4">
                <h2 className="text-lg font-bold text-accent mb-4">{category.name}</h2>
                
                {/* Content Type Tabs */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                          contentType === type.id
                            ? 'bg-secondary border-primary'
                            : 'bg-card border-border hover:border-muted-foreground'
                        )}
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center',
                          contentType === type.id ? 'bg-primary/20' : 'bg-secondary'
                        )}>
                          <Icon className={cn('w-6 h-6', type.color)} />
                        </div>
                        <span className="text-xs font-medium text-foreground">{type.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Subcategories */}
                {category.subcategories && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {category.subcategories.map((sub, idx) => (
                      <Badge 
                        key={idx} 
                        variant={idx === 0 ? 'default' : 'outline'}
                        className={idx === 0 ? 'bg-accent text-accent-foreground' : ''}
                      >
                        {sub}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Modules Accordion */}
                <Accordion type="single" collapsible className="space-y-3">
                  {category.modules.map((module, idx) => (
                    <AccordionItem 
                      key={idx} 
                      value={`module-${idx}`} 
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            {getTypeIcon(module.type)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{module.title}</p>
                            <p className="text-xs text-muted-foreground">{module.lessons.length} lecciones</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2 mt-2">
                          {module.lessons.map((lesson) => (
                            <div 
                              key={lesson.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-primary">{lesson.id}</span>
                                <span className="text-sm text-foreground">{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration}
                                </span>
                                {module.type === 'pdf' ? (
                                  <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                ) : (
                                  <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Quick Access Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <CardContent className="p-4">
              <Video className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-foreground text-sm">Videos Destacados</h3>
              <p className="text-xs text-muted-foreground">12 videos nuevos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
            <CardContent className="p-4">
              <Headphones className="w-8 h-8 text-accent mb-2" />
              <h3 className="font-semibold text-foreground text-sm">Podcasts</h3>
              <p className="text-xs text-muted-foreground">8 episodios</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
