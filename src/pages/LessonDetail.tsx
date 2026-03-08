import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { VideoPlayer } from '@/components/courses/VideoPlayer';
import { AudioPlayer } from '@/components/courses/AudioPlayer';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Clock, FileText,
  Download, MessageCircle, ThumbsUp, Play, BookOpen, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface Lesson { id: string; title: string; duration: string; }

interface LessonData {
  id: string; title: string; description: string; duration: string;
  module: string; moduleId: string; category: string;
  mediaUrl: string; mediaType: 'video' | 'podcast' | 'pdf';
  resources: { name: string; size: string }[]; lessons: Lesson[];
}

// Public domain sample media
const V = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const V2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const V3 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const P1 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const P2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
const P3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
const P4 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3';
const P5 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3';
const P6 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3';

// Helper to build lesson objects concisely
const L = (id: string, title: string, desc: string, dur: string, mod: string, modId: string, cat: string, url: string, type: 'video'|'podcast'|'pdf', res: {name:string;size:string}[], siblings: Lesson[]): LessonData => ({
  id, title, description: desc, duration: dur, module: mod, moduleId: modId, category: cat, mediaUrl: url, mediaType: type, resources: res, lessons: siblings,
});

// Sibling arrays
const introLessons: Lesson[] = [
  { id: '1.1', title: '¿Qué es el trading?', duration: '15 min' },
  { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' },
  { id: '1.3', title: 'Principales mercados financieros', duration: '20 min' },
];
const operLessons: Lesson[] = [
  { id: '2.1', title: 'Tipos de órdenes', duration: '18 min' },
  { id: '2.2', title: 'Spread y apalancamiento', duration: '25 min' },
  { id: '2.3', title: 'Operaciones largo/corto', duration: '15 min' },
  { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' },
];
const psicLessons: Lesson[] = [
  { id: 'pi1', title: 'Control emocional', duration: '30 min' },
  { id: 'pi2', title: 'Errores del principiante', duration: '25 min' },
];
const fxFundLessons: Lesson[] = [
  { id: 'fx1.1', title: '¿Qué es Forex?', duration: '10 min' },
  { id: 'fx1.2', title: 'Pares de divisas', duration: '15 min' },
  { id: 'fx1.3', title: 'Sesiones de mercado', duration: '12 min' },
];
const fxTechLessons: Lesson[] = [
  { id: 'fx2.1', title: 'Velas japonesas', duration: '20 min' },
  { id: 'fx2.2', title: 'Medias móviles y MACD', duration: '30 min' },
  { id: 'fx2.3', title: 'Patrones de precio', duration: '25 min' },
  { id: 'fx2.4', title: 'Fibonacci', duration: '22 min' },
];
const fxStratLessons: Lesson[] = [
  { id: 'fxp1', title: 'Scalping vs Swing', duration: '40 min' },
  { id: 'fxp2', title: 'Gestión de riesgo', duration: '35 min' },
  { id: 'fxp3', title: 'NFP y tipos de interés', duration: '45 min' },
];
const stFundLessons: Lesson[] = [
  { id: 'st1.1', title: 'Bolsa de valores', duration: '12 min' },
  { id: 'st1.2', title: 'Comprar y vender acciones', duration: '18 min' },
  { id: 'st1.3', title: 'Análisis fundamental', duration: '20 min' },
];
const stTradeLessons: Lesson[] = [
  { id: 'st2.1', title: 'Leer un balance', duration: '25 min' },
  { id: 'st2.2', title: 'Ratios financieros', duration: '20 min' },
  { id: 'st2.3', title: 'Earnings season', duration: '18 min' },
];
const stPodLessons: Lesson[] = [
  { id: 'stp1', title: 'ETFs vs Acciones', duration: '35 min' },
  { id: 'stp2', title: 'Dividendos', duration: '30 min' },
];
const metalPodLessons: Lesson[] = [
  { id: 'p1.1', title: 'Oro y Plata', duration: '45 min' },
  { id: 'p1.2', title: 'Petróleo', duration: '35 min' },
  { id: 'p1.3', title: 'Cobre e industriales', duration: '30 min' },
];
const metalVidLessons: Lesson[] = [
  { id: 'mt2.1', title: 'Correlación oro-dólar', duration: '20 min' },
  { id: 'mt2.2', title: 'Trading XAU/USD', duration: '25 min' },
];
const crFundLessons: Lesson[] = [
  { id: 'cr1.1', title: 'Bitcoin', duration: '20 min' },
  { id: 'cr1.2', title: 'Ethereum', duration: '25 min' },
  { id: 'cr1.3', title: 'Wallets y seguridad', duration: '18 min' },
];
const crTradeLessons: Lesson[] = [
  { id: 'cr2.1', title: 'On-chain básico', duration: '22 min' },
  { id: 'cr2.2', title: 'DeFi trading', duration: '30 min' },
];
const crPodLessons: Lesson[] = [
  { id: 'crp1', title: 'Ciclos de Bitcoin', duration: '40 min' },
  { id: 'crp2', title: 'Altcoins gems', duration: '35 min' },
  { id: 'crp3', title: 'Regulación cripto', duration: '25 min' },
];

const allLessons: Record<string, LessonData> = {
  // === INICIO - Introducción al trading (PDF) ===
  '1.1': L('1.1', '¿Qué es el trading?', 'Una introducción completa al mundo del trading, los mercados financieros y cómo funcionan.', '15 min', 'Introducción al trading', 'intro-trading', 'Inicio al Trading', '', 'pdf', [{ name: 'Introducción al Trading.pdf', size: '1.8 MB' }], introLessons),
  '1.2': L('1.2', 'Diferencia entre invertir y tradear', 'Aprende las diferencias clave entre inversión a largo plazo y trading activo en los mercados.', '12 min', 'Introducción al trading', 'intro-trading', 'Inicio al Trading', '', 'pdf', [{ name: 'Invertir vs Tradear.pdf', size: '1.2 MB' }], introLessons),
  '1.3': L('1.3', 'Principales mercados financieros', 'Conoce Forex, acciones, futuros, commodities y criptomonedas. Características de cada mercado.', '20 min', 'Introducción al trading', 'intro-trading', 'Inicio al Trading', '', 'pdf', [{ name: 'Guía de Mercados.pdf', size: '2.1 MB' }], introLessons),

  // === INICIO - Cómo funciona una operación (Video) ===
  '2.1': L('2.1', 'Tipos de órdenes: market, límite, stop', 'Aprende a usar los diferentes tipos de órdenes que ofrecen las plataformas de trading.', '18 min', 'Cómo funciona una operación', 'operacion-trading', 'Inicio al Trading', V, 'video', [{ name: 'Guía de órdenes.pdf', size: '2.4 MB' }, { name: 'Cheatsheet órdenes.pdf', size: '1.1 MB' }], operLessons),
  '2.2': L('2.2', 'Spread, comisión, apalancamiento y margen', 'Domina los costos de operar y cómo el apalancamiento amplifica tus resultados.', '25 min', 'Cómo funciona una operación', 'operacion-trading', 'Inicio al Trading', V2, 'video', [{ name: 'Tabla de spreads.pdf', size: '0.8 MB' }], operLessons),
  '2.3': L('2.3', 'Operaciones en largo y en corto', 'Entiende cómo ganar dinero tanto en mercados alcistas como bajistas.', '15 min', 'Cómo funciona una operación', 'operacion-trading', 'Inicio al Trading', V3, 'video', [], operLessons),
  '2.4': L('2.4', 'Stop loss y take profit en la práctica', 'Aprende a proteger tu capital y asegurar ganancias de forma disciplinada.', '22 min', 'Cómo funciona una operación', 'operacion-trading', 'Inicio al Trading', V, 'video', [{ name: 'Calculadora SL/TP.pdf', size: '0.5 MB' }], operLessons),

  // === INICIO - Psicología del trader (Podcast) ===
  'pi1': L('pi1', 'Control emocional en el trading', 'Descubre cómo las emociones afectan tus decisiones y aprende técnicas para mantener la disciplina.', '30 min', 'Psicología del trader', 'psicologia-trader', 'Inicio al Trading', P1, 'podcast', [], psicLessons),
  'pi2': L('pi2', 'Errores comunes del trader principiante', 'Los 10 errores más frecuentes que cometen los traders novatos y cómo evitarlos.', '25 min', 'Psicología del trader', 'psicologia-trader', 'Inicio al Trading', P2, 'podcast', [{ name: 'Checklist del trader.pdf', size: '0.6 MB' }], psicLessons),

  // === FOREX - Fundamentos (PDF) ===
  'fx1.1': L('fx1.1', '¿Qué es el mercado Forex?', 'El mercado de divisas más grande del mundo: volumen, participantes y funcionamiento.', '10 min', 'Fundamentos del mercado Forex', 'forex-fund', 'Forex', '', 'pdf', [{ name: 'Intro Forex.pdf', size: '1.5 MB' }], fxFundLessons),
  'fx1.2': L('fx1.2', 'Pares de divisas principales y exóticos', 'Conoce los majors, minors y exóticos. Liquidez, spread y mejores horarios para cada par.', '15 min', 'Fundamentos del mercado Forex', 'forex-fund', 'Forex', '', 'pdf', [], fxFundLessons),
  'fx1.3': L('fx1.3', 'Sesiones de mercado y horarios', 'Tokyo, Londres, New York: cuándo operar y qué pares son más activos en cada sesión.', '12 min', 'Fundamentos del mercado Forex', 'forex-fund', 'Forex', '', 'pdf', [{ name: 'Horarios Forex.pdf', size: '0.9 MB' }], fxFundLessons),

  // === FOREX - Análisis Técnico (Video) ===
  'fx2.1': L('fx2.1', 'Lectura de gráficos de velas japonesas', 'Domina los patrones de velas: doji, martillo, envolvente y más. Interpretación profesional.', '20 min', 'Análisis técnico en Forex', 'forex-tech', 'Forex', V, 'video', [{ name: 'Patrones de velas.pdf', size: '3.2 MB' }], fxTechLessons),
  'fx2.2': L('fx2.2', 'Medias móviles y MACD', 'Aprende a usar SMA, EMA y el indicador MACD para identificar tendencias y señales de entrada.', '30 min', 'Análisis técnico en Forex', 'forex-tech', 'Forex', V2, 'video', [{ name: 'Guía indicadores.pdf', size: '2.8 MB' }], fxTechLessons),
  'fx2.3': L('fx2.3', 'Patrones de precio y acción del precio', 'Doble techo, cabeza y hombros, triángulos: patrones chart clásicos del price action.', '25 min', 'Análisis técnico en Forex', 'forex-tech', 'Forex', V3, 'video', [], fxTechLessons),
  'fx2.4': L('fx2.4', 'Fibonacci y retrocesos', 'Cómo usar los niveles de Fibonacci para encontrar zonas de entrada y targets de precio.', '22 min', 'Análisis técnico en Forex', 'forex-tech', 'Forex', V, 'video', [{ name: 'Fibonacci cheatsheet.pdf', size: '1.0 MB' }], fxTechLessons),

  // === FOREX - Estrategias avanzadas (Podcast) ===
  'fxp1': L('fxp1', 'Scalping vs Swing Trading en Forex', 'Comparativa profunda entre scalping y swing trading. Ventajas, desventajas y qué estilo elegir.', '40 min', 'Estrategias Forex avanzadas', 'forex-strat', 'Forex', P3, 'podcast', [], fxStratLessons),
  'fxp2': L('fxp2', 'Gestión de riesgo profesional', 'Position sizing, ratio riesgo/beneficio, drawdown máximo y reglas de gestión monetaria.', '35 min', 'Estrategias Forex avanzadas', 'forex-strat', 'Forex', P4, 'podcast', [{ name: 'Calculadora de riesgo.pdf', size: '0.7 MB' }], fxStratLessons),
  'fxp3': L('fxp3', 'Análisis fundamental: NFP y tipos de interés', 'Cómo interpretar los datos macroeconómicos más importantes y su impacto en las divisas.', '45 min', 'Estrategias Forex avanzadas', 'forex-strat', 'Forex', P5, 'podcast', [{ name: 'Calendario económico.pdf', size: '1.3 MB' }], fxStratLessons),

  // === ACCIONES - Fundamentos (PDF) ===
  'st1.1': L('st1.1', '¿Qué es la bolsa de valores?', 'Cómo funciona Wall Street, NYSE, NASDAQ y las bolsas internacionales.', '12 min', 'Fundamentos de la Bolsa', 'stocks-fund', 'Acciones', '', 'pdf', [{ name: 'Guía Bolsa.pdf', size: '1.6 MB' }], stFundLessons),
  'st1.2': L('st1.2', 'Cómo comprar y vender acciones', 'Paso a paso para abrir una cuenta, elegir un broker y ejecutar tu primera operación.', '18 min', 'Fundamentos de la Bolsa', 'stocks-fund', 'Acciones', '', 'pdf', [], stFundLessons),
  'st1.3': L('st1.3', 'Análisis fundamental de empresas', 'Aprende a evaluar empresas: ingresos, márgenes, deuda, crecimiento y ventajas competitivas.', '20 min', 'Fundamentos de la Bolsa', 'stocks-fund', 'Acciones', '', 'pdf', [{ name: 'Plantilla análisis.pdf', size: '1.4 MB' }], stFundLessons),

  // === ACCIONES - Trading (Video) ===
  'st2.1': L('st2.1', 'Cómo leer un balance financiero', 'Activos, pasivos y patrimonio neto. Aprende a interpretar los estados financieros de cualquier empresa.', '25 min', 'Trading de acciones', 'stocks-trade', 'Acciones', V2, 'video', [{ name: 'Balance ejemplo.pdf', size: '2.0 MB' }], stTradeLessons),
  'st2.2': L('st2.2', 'Ratios financieros: P/E, P/B, ROE', 'Los ratios más importantes para valorar acciones y comparar empresas del mismo sector.', '20 min', 'Trading de acciones', 'stocks-trade', 'Acciones', V3, 'video', [], stTradeLessons),
  'st2.3': L('st2.3', 'Earnings season: cómo operar resultados', 'Estrategias para operar antes, durante y después de la publicación de resultados trimestrales.', '18 min', 'Trading de acciones', 'stocks-trade', 'Acciones', V, 'video', [{ name: 'Calendario earnings.pdf', size: '0.9 MB' }], stTradeLessons),

  // === ACCIONES - Inversión (Podcast) ===
  'stp1': L('stp1', 'ETFs vs Acciones individuales', 'Diversificación, costos, liquidez: cuándo elegir un ETF y cuándo stock picking.', '35 min', 'Inversión a largo plazo', 'stocks-invest', 'Acciones', P1, 'podcast', [], stPodLessons),
  'stp2': L('stp2', 'Dividendos: construye ingresos pasivos', 'Estrategias de dividendos, DRIP, aristocrats y cómo construir una cartera de ingresos.', '30 min', 'Inversión a largo plazo', 'stocks-invest', 'Acciones', P2, 'podcast', [{ name: 'Dividend Aristocrats.pdf', size: '1.1 MB' }], stPodLessons),

  // === METALES - Materias primas (Podcast) ===
  'p1.1': L('p1.1', 'Oro y Plata: guía completa', 'Análisis profundo del mercado de metales preciosos, factores que afectan su precio y estrategias.', '45 min', 'Trading con materias primas', 'materias-primas', 'Metales', P3, 'podcast', [{ name: 'Resumen Oro y Plata.pdf', size: '1.2 MB' }], metalPodLessons),
  'p1.2': L('p1.2', 'Petróleo: factores que mueven el precio', 'OPEC, inventarios, geopolítica y demanda estacional del crudo.', '35 min', 'Trading con materias primas', 'materias-primas', 'Metales', P4, 'podcast', [], metalPodLessons),
  'p1.3': L('p1.3', 'Cobre y materias primas industriales', 'El "Doctor Copper" como indicador económico. Trading con commodities industriales.', '30 min', 'Trading con materias primas', 'materias-primas', 'Metales', P5, 'podcast', [], metalPodLessons),

  // === METALES - Análisis técnico (Video) ===
  'mt2.1': L('mt2.1', 'Correlación oro-dólar', 'Cómo la relación inversa entre el oro y el dólar crea oportunidades de trading.', '20 min', 'Análisis técnico de commodities', 'metals-tech', 'Metales', V2, 'video', [{ name: 'Correlaciones.pdf', size: '1.5 MB' }], metalVidLessons),
  'mt2.2': L('mt2.2', 'Trading con XAU/USD', 'Estrategias específicas para operar oro contra el dólar. Niveles clave y volatilidad.', '25 min', 'Análisis técnico de commodities', 'metals-tech', 'Metales', V3, 'video', [], metalVidLessons),

  // === CRIPTO - Fundamentos (Video) ===
  'cr1.1': L('cr1.1', 'Bitcoin: origen y funcionamiento', 'Satoshi Nakamoto, blockchain, minería y halvings. Todo lo que necesitas saber de BTC.', '20 min', 'Fundamentos de criptomonedas', 'crypto-fund', 'Cripto', V, 'video', [{ name: 'Whitepaper Bitcoin.pdf', size: '0.8 MB' }], crFundLessons),
  'cr1.2': L('cr1.2', 'Ethereum y smart contracts', 'La plataforma de contratos inteligentes, gas fees, EVM y el ecosistema DeFi.', '25 min', 'Fundamentos de criptomonedas', 'crypto-fund', 'Cripto', V2, 'video', [], crFundLessons),
  'cr1.3': L('cr1.3', 'Wallets y seguridad', 'Hot wallets, cold wallets, seed phrases. Protege tus activos digitales como un profesional.', '18 min', 'Fundamentos de criptomonedas', 'crypto-fund', 'Cripto', V3, 'video', [{ name: 'Guía seguridad cripto.pdf', size: '1.0 MB' }], crFundLessons),

  // === CRIPTO - Trading (Video) ===
  'cr2.1': L('cr2.1', 'Análisis on-chain básico', 'Métricas on-chain: MVRV, NUPL, HODLer waves y cómo interpretarlas.', '22 min', 'Trading de criptomonedas', 'crypto-trade', 'Cripto', V, 'video', [], crTradeLessons),
  'cr2.2': L('cr2.2', 'DeFi: oportunidades de trading', 'Yield farming, liquidity pools, DEXs. Oportunidades y riesgos del trading descentralizado.', '30 min', 'Trading de criptomonedas', 'crypto-trade', 'Cripto', V2, 'video', [{ name: 'Guía DeFi.pdf', size: '2.3 MB' }], crTradeLessons),

  // === CRIPTO - Mercado en profundidad (Podcast) ===
  'crp1': L('crp1', 'Ciclos de mercado de Bitcoin', '4-year cycles, halvings y su impacto histórico en el precio. Predicciones basadas en datos.', '40 min', 'Mercado cripto en profundidad', 'crypto-deep', 'Cripto', P4, 'podcast', [{ name: 'Ciclos BTC.pdf', size: '1.8 MB' }], crPodLessons),
  'crp2': L('crp2', 'Altcoins: cómo encontrar gems', 'Análisis de tokenomics, equipo, TVL y narrativas. Cómo identificar proyectos con potencial.', '35 min', 'Mercado cripto en profundidad', 'crypto-deep', 'Cripto', P5, 'podcast', [], crPodLessons),
  'crp3': L('crp3', 'Regulación cripto y su impacto', 'SEC, MiCA, regulación global y cómo afecta al mercado cripto y tus inversiones.', '25 min', 'Mercado cripto en profundidad', 'crypto-deep', 'Cripto', P6, 'podcast', [], crPodLessons),
};

export default function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lesson = allLessons[lessonId || '2.1'] || allLessons['2.1'];

  const {
    isLessonCompleted, toggleLessonComplete, setLastViewedLesson,
    initializeModule, getModuleProgress,
  } = useCourseProgress();

  const isCompleted = isLessonCompleted(lesson.id);

  useEffect(() => {
    setLastViewedLesson(lesson.id);
    initializeModule(lesson.moduleId, lesson.lessons.length);
  }, [lesson.id, lesson.moduleId, lesson.lessons.length, setLastViewedLesson, initializeModule]);

  const currentIndex = lesson.lessons.findIndex(l => l.id === lesson.id);
  const hasNext = currentIndex < lesson.lessons.length - 1;
  const hasPrev = currentIndex > 0;

  const moduleProgress = getModuleProgress(lesson.moduleId);
  const completedCount = moduleProgress?.completedLessons || 0;
  const progressPercent = (completedCount / lesson.lessons.length) * 100;

  const handleToggleComplete = () => {
    toggleLessonComplete(lesson.id, lesson.moduleId);
    if (!isCompleted) {
      toast({ title: t('lesson_completed_toast'), description: `${t('lesson_completed_toast_desc')} "${lesson.title}"` });
    }
  };

  const handleMediaEnded = () => {
    if (!isCompleted) {
      toggleLessonComplete(lesson.id, lesson.moduleId);
      toast({ title: t('lesson_completed_toast'), description: lesson.mediaType === 'podcast' ? t('lesson_podcast_ended') : t('lesson_video_ended') });
    }
  };

  const goToLesson = (id: string) => navigate(`/courses/lesson/${id}`);
  const goNext = () => hasNext && goToLesson(lesson.lessons[currentIndex + 1].id);
  const goPrev = () => hasPrev && goToLesson(lesson.lessons[currentIndex - 1].id);

  // Render media player based on type
  const renderMediaPlayer = () => {
    switch (lesson.mediaType) {
      case 'video':
        return (
          <div className="rounded-xl overflow-hidden border border-border/40">
            <VideoPlayer src={lesson.mediaUrl} title={lesson.title} onEnded={handleMediaEnded} />
          </div>
        );
      case 'podcast':
        return (
          <AudioPlayer
            src={lesson.mediaUrl}
            title={lesson.title}
            subtitle={lesson.module}
            onEnded={handleMediaEnded}
          />
        );
      case 'pdf':
      default:
        return (
          <div className="rounded-xl border border-border/40 overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at center 30%, hsl(200, 80%, 10%) 0%, hsl(210, 50%, 5%) 100%)' }}
          >
            <div className="p-8 flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-rose-400" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-foreground">{lesson.title}</h3>
                <p className="text-xs text-muted-foreground">{t('lesson_reading_material')}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                <Download className="w-3.5 h-3.5" />
                {t('lesson_download_pdf')}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <PageShell>
      <Header />

      <main className="py-4 px-4 pb-28 space-y-4">
        {/* Back */}
        <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('lesson_back')}
        </Link>

        {/* Media Player */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {renderMediaPlayer()}
        </motion.div>

        {/* Lesson Info Card */}
        <SignalStyleCard>
          <div className="p-4 space-y-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                {lesson.category}
              </Badge>
              <span className="text-muted-foreground text-[10px]">›</span>
              <span className="text-[11px] text-muted-foreground">{lesson.module}</span>
              <Badge variant="outline" className={cn(
                'text-[10px] ml-auto',
                lesson.mediaType === 'video' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                lesson.mediaType === 'podcast' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                'border-rose-500/30 text-rose-400 bg-rose-500/10'
              )}>
                {lesson.mediaType === 'video' ? '🎬 Video' : lesson.mediaType === 'podcast' ? '🎧 Podcast' : `📄 ${t('lesson_reading')}`}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-lg font-bold text-foreground leading-tight">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground">{lesson.description}</p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.duration}</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Lección {currentIndex + 1} de {lesson.lessons.length}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm" onClick={handleToggleComplete} variant="ghost"
                className={cn(
                  'gap-1.5 text-xs rounded-lg',
                  isCompleted
                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/50'
                )}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isCompleted ? 'Completada' : 'Marcar completada'}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                <ThumbsUp className="w-3.5 h-3.5" />Útil
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="w-3.5 h-3.5" />Preguntar
              </Button>
            </div>
          </div>
        </SignalStyleCard>

        {/* Navigation */}
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 p-3">
          <Button variant="ghost" size="sm" disabled={!hasPrev} onClick={goPrev} className="gap-1 text-xs">
            <ChevronLeft className="w-4 h-4" />Anterior
          </Button>
          <div className="flex items-center gap-1">
            {lesson.lessons.map((_, i) => (
              <div key={i} className={cn(
                'w-2 h-2 rounded-full transition-all',
                i === currentIndex ? 'bg-primary scale-125' : isLessonCompleted(lesson.lessons[i].id) ? 'bg-primary/40' : 'bg-secondary'
              )} />
            ))}
          </div>
          <Button variant="ghost" size="sm" disabled={!hasNext} onClick={goNext} className="gap-1 text-xs">
            Siguiente<ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Module Progress */}
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Progreso del módulo
            </span>
            <span className="text-sm font-bold text-primary tabular-nums">{completedCount}/{lesson.lessons.length}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Lesson List */}
        <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
          <div className="p-4 pb-2 border-b border-border/30">
            <h3 className="text-sm font-semibold text-foreground">Lecciones del módulo</h3>
          </div>
          <div className="p-3 space-y-1.5">
            {lesson.lessons.map((item, idx) => {
              const itemCompleted = isLessonCompleted(item.id);
              const isCurrent = item.id === lesson.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => goToLesson(item.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group',
                    isCurrent ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/40 border border-transparent'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                    itemCompleted ? 'bg-primary text-primary-foreground'
                      : isCurrent ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-secondary text-muted-foreground'
                  )}>
                    {itemCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={cn(
                    'text-sm flex-1 truncate',
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{item.duration}</span>
                    {isCurrent && <Play className="w-3.5 h-3.5 text-primary ml-0.5" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Resources */}
        {lesson.resources.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
            <div className="p-4 pb-2 border-b border-border/30">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                Recursos descargables
              </h3>
            </div>
            <div className="p-3 space-y-1.5">
              {lesson.resources.map((resource, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{resource.name}</p>
                      <p className="text-[10px] text-muted-foreground">{resource.size}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}
