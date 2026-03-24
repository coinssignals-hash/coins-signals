export interface PathStep {
  moduleTitle: string;
  categoryId: string;
  lessonIds: string[];
  hasQuiz: boolean;
}

export interface LearningPath {
  id: string;
  name: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  color: string;
  icon: string;
  estimatedHours: number;
  steps: PathStep[];
}

export const learningPaths: LearningPath[] = [
  {
    id: 'beginner',
    name: 'Fundamentos del Trading',
    level: 'Principiante',
    description: 'Aprende las bases del trading desde cero: mercados, órdenes, psicología y tu primera operación.',
    color: '160 84% 39%',
    icon: '🌱',
    estimatedHours: 8,
    steps: [
      { moduleTitle: 'Introducción al trading', categoryId: 'inicio', lessonIds: ['1.1', '1.2', '1.3'], hasQuiz: true },
      { moduleTitle: 'Cómo funciona una operación', categoryId: 'inicio', lessonIds: ['2.1', '2.2', '2.3', '2.4'], hasQuiz: true },
      { moduleTitle: 'Psicología del trader', categoryId: 'inicio', lessonIds: ['pi1', 'pi2'], hasQuiz: true },
      { moduleTitle: 'Fundamentos del mercado Forex', categoryId: 'forex', lessonIds: ['fx1.1', 'fx1.2', 'fx1.3'], hasQuiz: true },
      { moduleTitle: 'Fundamentos de la Bolsa', categoryId: 'acciones', lessonIds: ['st1.1', 'st1.2', 'st1.3'], hasQuiz: true },
    ],
  },
  {
    id: 'intermediate',
    name: 'Análisis Técnico y Estrategias',
    level: 'Intermedio',
    description: 'Domina el análisis técnico, indicadores, patrones de precio y estrategias de trading probadas.',
    color: '40 80% 55%',
    icon: '📊',
    estimatedHours: 12,
    steps: [
      { moduleTitle: 'Análisis técnico en Forex', categoryId: 'forex', lessonIds: ['fx2.1', 'fx2.2', 'fx2.3', 'fx2.4'], hasQuiz: true },
      { moduleTitle: 'Trading de acciones', categoryId: 'acciones', lessonIds: ['st2.1', 'st2.2', 'st2.3'], hasQuiz: true },
      { moduleTitle: 'Inversión a largo plazo', categoryId: 'acciones', lessonIds: ['stp1', 'stp2'], hasQuiz: false },
      { moduleTitle: 'Trading con materias primas', categoryId: 'metales', lessonIds: ['p1.1', 'p1.2', 'p1.3'], hasQuiz: true },
      { moduleTitle: 'Análisis técnico de commodities', categoryId: 'metales', lessonIds: ['mt2.1', 'mt2.2'], hasQuiz: false },
      { moduleTitle: 'Fundamentos de criptomonedas', categoryId: 'criptomonedas', lessonIds: ['cr1.1', 'cr1.2', 'cr1.3'], hasQuiz: true },
    ],
  },
  {
    id: 'advanced',
    name: 'Trading Profesional',
    level: 'Avanzado',
    description: 'Estrategias avanzadas, gestión de riesgo profesional, DeFi y análisis institucional.',
    color: '270 60% 60%',
    icon: '🏆',
    estimatedHours: 10,
    steps: [
      { moduleTitle: 'Estrategias Forex avanzadas', categoryId: 'forex', lessonIds: ['fxp1', 'fxp2', 'fxp3'], hasQuiz: true },
      { moduleTitle: 'Trading de criptomonedas', categoryId: 'criptomonedas', lessonIds: ['cr2.1', 'cr2.2'], hasQuiz: true },
      { moduleTitle: 'Mercado cripto en profundidad', categoryId: 'criptomonedas', lessonIds: ['crp1', 'crp2', 'crp3'], hasQuiz: false },
    ],
  },
];
