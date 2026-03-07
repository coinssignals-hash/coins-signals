import { FileText, Video, Headphones, BookOpen, TrendingUp, BarChart3, Gem, Bitcoin } from 'lucide-react';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: string;
}

export interface Module {
  title: string;
  icon: typeof FileText;
  type: string;
  difficulty: string;
  lessons: Lesson[];
}

export interface Category {
  id: string;
  name: string;
  icon: typeof FileText;
  gradient: string;
  accent: string;
  ring: string;
  glow: string;
  modules: Module[];
}

export const categories: Category[] = [
  {
    id: 'inicio',
    name: 'Inicio',
    icon: BookOpen,
    gradient: 'from-blue-500/20 to-cyan-500/10',
    accent: 'text-blue-400',
    ring: 'ring-blue-500/30',
    glow: 'shadow-[0_0_20px_hsl(217_91%_60%/0.15)]',
    modules: [
      {
        title: 'Introducción al trading',
        icon: FileText,
        type: 'pdf',
        difficulty: 'Principiante',
        lessons: [
          { id: '1.1', title: '¿Qué es el trading?', duration: '15 min', type: 'pdf' },
          { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min', type: 'pdf' },
          { id: '1.3', title: 'Principales mercados financieros', duration: '20 min', type: 'pdf' },
        ]
      },
      {
        title: 'Cómo funciona una operación',
        icon: Video,
        type: 'video',
        difficulty: 'Principiante',
        lessons: [
          { id: '2.1', title: 'Tipos de órdenes: market, límite, stop', duration: '18 min', type: 'video' },
          { id: '2.2', title: 'Spread, comisión, apalancamiento y margen', duration: '25 min', type: 'video' },
          { id: '2.3', title: 'Operaciones en largo y en corto', duration: '15 min', type: 'video' },
          { id: '2.4', title: 'Stop loss y take profit en la práctica', duration: '22 min', type: 'video' },
        ]
      },
      {
        title: 'Psicología del trader',
        icon: Headphones,
        type: 'podcast',
        difficulty: 'Principiante',
        lessons: [
          { id: 'pi1', title: 'Control emocional en el trading', duration: '30 min', type: 'podcast' },
          { id: 'pi2', title: 'Errores comunes del trader principiante', duration: '25 min', type: 'podcast' },
        ]
      }
    ]
  },
  {
    id: 'forex',
    name: 'Forex',
    icon: TrendingUp,
    gradient: 'from-cyan-500/20 to-teal-500/10',
    accent: 'text-cyan-400',
    ring: 'ring-cyan-500/30',
    glow: 'shadow-[0_0_20px_hsl(187_72%_50%/0.15)]',
    modules: [
      {
        title: 'Fundamentos del mercado Forex',
        icon: FileText,
        type: 'pdf',
        difficulty: 'Principiante',
        lessons: [
          { id: 'fx1.1', title: '¿Qué es el mercado Forex?', duration: '10 min', type: 'pdf' },
          { id: 'fx1.2', title: 'Pares de divisas principales y exóticos', duration: '15 min', type: 'pdf' },
          { id: 'fx1.3', title: 'Sesiones de mercado y horarios', duration: '12 min', type: 'pdf' },
        ]
      },
      {
        title: 'Análisis técnico en Forex',
        icon: Video,
        type: 'video',
        difficulty: 'Intermedio',
        lessons: [
          { id: 'fx2.1', title: 'Lectura de gráficos de velas japonesas', duration: '20 min', type: 'video' },
          { id: 'fx2.2', title: 'Medias móviles y MACD', duration: '30 min', type: 'video' },
          { id: 'fx2.3', title: 'Patrones de precio y acción del precio', duration: '25 min', type: 'video' },
          { id: 'fx2.4', title: 'Fibonacci y retrocesos', duration: '22 min', type: 'video' },
        ]
      },
      {
        title: 'Estrategias Forex avanzadas',
        icon: Headphones,
        type: 'podcast',
        difficulty: 'Avanzado',
        lessons: [
          { id: 'fxp1', title: 'Scalping vs Swing Trading en Forex', duration: '40 min', type: 'podcast' },
          { id: 'fxp2', title: 'Gestión de riesgo profesional', duration: '35 min', type: 'podcast' },
          { id: 'fxp3', title: 'Análisis fundamental: NFP y tipos de interés', duration: '45 min', type: 'podcast' },
        ]
      }
    ]
  },
  {
    id: 'acciones',
    name: 'Acciones',
    icon: BarChart3,
    gradient: 'from-emerald-500/20 to-green-500/10',
    accent: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
    glow: 'shadow-[0_0_20px_hsl(160_84%_39%/0.15)]',
    modules: [
      {
        title: 'Fundamentos de la Bolsa',
        icon: FileText,
        type: 'pdf',
        difficulty: 'Principiante',
        lessons: [
          { id: 'st1.1', title: '¿Qué es la bolsa de valores?', duration: '12 min', type: 'pdf' },
          { id: 'st1.2', title: 'Cómo comprar y vender acciones', duration: '18 min', type: 'pdf' },
          { id: 'st1.3', title: 'Análisis fundamental de empresas', duration: '20 min', type: 'pdf' },
        ]
      },
      {
        title: 'Trading de acciones',
        icon: Video,
        type: 'video',
        difficulty: 'Intermedio',
        lessons: [
          { id: 'st2.1', title: 'Cómo leer un balance financiero', duration: '25 min', type: 'video' },
          { id: 'st2.2', title: 'Ratios financieros: P/E, P/B, ROE', duration: '20 min', type: 'video' },
          { id: 'st2.3', title: 'Earnings season: cómo operar resultados', duration: '18 min', type: 'video' },
        ]
      },
      {
        title: 'Inversión a largo plazo',
        icon: Headphones,
        type: 'podcast',
        difficulty: 'Intermedio',
        lessons: [
          { id: 'stp1', title: 'ETFs vs Acciones individuales', duration: '35 min', type: 'podcast' },
          { id: 'stp2', title: 'Dividendos: construye ingresos pasivos', duration: '30 min', type: 'podcast' },
        ]
      }
    ]
  },
  {
    id: 'metales',
    name: 'Metales',
    icon: Gem,
    gradient: 'from-amber-500/20 to-yellow-500/10',
    accent: 'text-amber-400',
    ring: 'ring-amber-500/30',
    glow: 'shadow-[0_0_20px_hsl(38_92%_50%/0.15)]',
    modules: [
      {
        title: 'Trading con materias primas',
        icon: Headphones,
        type: 'podcast',
        difficulty: 'Intermedio',
        lessons: [
          { id: 'p1.1', title: 'Oro y Plata: guía completa', duration: '45 min', type: 'podcast' },
          { id: 'p1.2', title: 'Petróleo: factores que mueven el precio', duration: '35 min', type: 'podcast' },
          { id: 'p1.3', title: 'Cobre y materias primas industriales', duration: '30 min', type: 'podcast' },
        ]
      },
      {
        title: 'Análisis técnico de commodities',
        icon: Video,
        type: 'video',
        difficulty: 'Avanzado',
        lessons: [
          { id: 'mt2.1', title: 'Correlación oro-dólar', duration: '20 min', type: 'video' },
          { id: 'mt2.2', title: 'Trading con XAU/USD', duration: '25 min', type: 'video' },
        ]
      }
    ]
  },
  {
    id: 'criptomonedas',
    name: 'Cripto',
    icon: Bitcoin,
    gradient: 'from-purple-500/20 to-violet-500/10',
    accent: 'text-purple-400',
    ring: 'ring-purple-500/30',
    glow: 'shadow-[0_0_20px_hsl(271_76%_53%/0.15)]',
    modules: [
      {
        title: 'Fundamentos de criptomonedas',
        icon: Video,
        type: 'video',
        difficulty: 'Principiante',
        lessons: [
          { id: 'cr1.1', title: 'Bitcoin: origen y funcionamiento', duration: '20 min', type: 'video' },
          { id: 'cr1.2', title: 'Ethereum y smart contracts', duration: '25 min', type: 'video' },
          { id: 'cr1.3', title: 'Wallets y seguridad', duration: '18 min', type: 'video' },
        ]
      },
      {
        title: 'Trading de criptomonedas',
        icon: Video,
        type: 'video',
        difficulty: 'Intermedio',
        lessons: [
          { id: 'cr2.1', title: 'Análisis on-chain básico', duration: '22 min', type: 'video' },
          { id: 'cr2.2', title: 'DeFi: oportunidades de trading', duration: '30 min', type: 'video' },
        ]
      },
      {
        title: 'Mercado cripto en profundidad',
        icon: Headphones,
        type: 'podcast',
        difficulty: 'Avanzado',
        lessons: [
          { id: 'crp1', title: 'Ciclos de mercado de Bitcoin', duration: '40 min', type: 'podcast' },
          { id: 'crp2', title: 'Altcoins: cómo encontrar gems', duration: '35 min', type: 'podcast' },
          { id: 'crp3', title: 'Regulación cripto y su impacto', duration: '25 min', type: 'podcast' },
        ]
      }
    ]
  }
];
