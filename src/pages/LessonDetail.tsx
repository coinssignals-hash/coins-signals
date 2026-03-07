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

interface Lesson { id: string; title: string; duration: string; }

interface LessonData {
  id: string; title: string; description: string; duration: string;
  module: string; moduleId: string; category: string;
  mediaUrl: string; mediaType: 'video' | 'podcast' | 'pdf';
  resources: { name: string; size: string }[]; lessons: Lesson[];
}

// Sample public domain media
const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_PODCAST = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const allLessons: Record<string, LessonData> = {
  '1.1': { id: '1.1', title: '¿Qué es el trading?', description: 'Una introducción completa al mundo del trading y sus conceptos fundamentales.', duration: '15 min', module: 'Introducción al trading', moduleId: 'intro-trading', category: 'Inicio al Trading', mediaUrl: '', mediaType: 'pdf', resources: [{ name: 'Introducción al Trading.pdf', size: '1.8 MB' }], lessons: [{ id: '1.1', title: '¿Qué es el trading?', duration: '15 min' }, { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' }, { id: '1.3', title: 'Principales mercados', duration: '20 min' }] },
  '1.2': { id: '1.2', title: 'Diferencia entre invertir y tradear', description: 'Aprende las diferencias clave entre inversión a largo plazo y trading activo.', duration: '12 min', module: 'Introducción al trading', moduleId: 'intro-trading', category: 'Inicio al Trading', mediaUrl: '', mediaType: 'pdf', resources: [], lessons: [{ id: '1.1', title: '¿Qué es el trading?', duration: '15 min' }, { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' }, { id: '1.3', title: 'Principales mercados', duration: '20 min' }] },
  '1.3': { id: '1.3', title: 'Principales mercados', description: 'Conoce los diferentes mercados financieros donde puedes operar.', duration: '20 min', module: 'Introducción al trading', moduleId: 'intro-trading', category: 'Inicio al Trading', mediaUrl: '', mediaType: 'pdf', resources: [], lessons: [{ id: '1.1', title: '¿Qué es el trading?', duration: '15 min' }, { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' }, { id: '1.3', title: 'Principales mercados', duration: '20 min' }] },
  // Video examples
  '2.1': { id: '2.1', title: 'Qué es una orden (market, límite, stop)', description: 'Aprende los diferentes tipos de órdenes que puedes utilizar en el trading y cuándo usar cada una.', duration: '18 min', module: 'Cómo funciona una operación', moduleId: 'operacion-trading', category: 'Inicio al Trading', mediaUrl: SAMPLE_VIDEO, mediaType: 'video', resources: [{ name: 'Guía de órdenes.pdf', size: '2.4 MB' }, { name: 'Cheatsheet tipos de órdenes.pdf', size: '1.1 MB' }], lessons: [{ id: '2.1', title: 'Qué es una orden', duration: '18 min' }, { id: '2.2', title: 'Spread, comisión, apalancamiento', duration: '25 min' }, { id: '2.3', title: 'Compra y venta', duration: '15 min' }, { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' }] },
  '2.2': { id: '2.2', title: 'Conceptos clave: spread, comisión, apalancamiento, margen', description: 'Domina los conceptos fundamentales que todo trader debe conocer.', duration: '25 min', module: 'Cómo funciona una operación', moduleId: 'operacion-trading', category: 'Inicio al Trading', mediaUrl: SAMPLE_VIDEO, mediaType: 'video', resources: [], lessons: [{ id: '2.1', title: 'Qué es una orden', duration: '18 min' }, { id: '2.2', title: 'Spread, comisión, apalancamiento', duration: '25 min' }, { id: '2.3', title: 'Compra y venta', duration: '15 min' }, { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' }] },
  '2.3': { id: '2.3', title: 'Tipos de operaciones: compra (largo) y venta (corto)', description: 'Entiende cómo funcionan las operaciones en largo y en corto.', duration: '15 min', module: 'Cómo funciona una operación', moduleId: 'operacion-trading', category: 'Inicio al Trading', mediaUrl: SAMPLE_VIDEO, mediaType: 'video', resources: [], lessons: [{ id: '2.1', title: 'Qué es una orden', duration: '18 min' }, { id: '2.2', title: 'Spread, comisión, apalancamiento', duration: '25 min' }, { id: '2.3', title: 'Compra y venta', duration: '15 min' }, { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' }] },
  '2.4': { id: '2.4', title: 'Stop loss y take profit', description: 'Aprende a proteger tu capital y asegurar ganancias con herramientas esenciales.', duration: '22 min', module: 'Cómo funciona una operación', moduleId: 'operacion-trading', category: 'Inicio al Trading', mediaUrl: SAMPLE_VIDEO, mediaType: 'video', resources: [], lessons: [{ id: '2.1', title: 'Qué es una orden', duration: '18 min' }, { id: '2.2', title: 'Spread, comisión, apalancamiento', duration: '25 min' }, { id: '2.3', title: 'Compra y venta', duration: '15 min' }, { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' }] },
  // Podcast examples (Metales)
  'p1.1': { id: 'p1.1', title: 'Oro y Plata: guía completa', description: 'Un análisis profundo del mercado de metales preciosos, factores que afectan su precio y estrategias de trading.', duration: '45 min', module: 'Trading con Materias Primas', moduleId: 'materias-primas', category: 'Metales', mediaUrl: SAMPLE_PODCAST, mediaType: 'podcast', resources: [{ name: 'Resumen Oro y Plata.pdf', size: '1.2 MB' }], lessons: [{ id: 'p1.1', title: 'Oro y Plata: guía completa', duration: '45 min' }, { id: 'p1.2', title: 'Petróleo: factores clave', duration: '35 min' }] },
  'p1.2': { id: 'p1.2', title: 'Petróleo: factores que mueven el precio', description: 'Descubre los factores geopolíticos, de oferta y demanda que impactan el precio del crudo.', duration: '35 min', module: 'Trading con Materias Primas', moduleId: 'materias-primas', category: 'Metales', mediaUrl: SAMPLE_PODCAST, mediaType: 'podcast', resources: [], lessons: [{ id: 'p1.1', title: 'Oro y Plata: guía completa', duration: '45 min' }, { id: 'p1.2', title: 'Petróleo: factores clave', duration: '35 min' }] },
};

export default function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
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
      toast({ title: '¡Lección completada!', description: `Has completado "${lesson.title}"` });
    }
  };

  const handleMediaEnded = () => {
    if (!isCompleted) {
      toggleLessonComplete(lesson.id, lesson.moduleId);
      toast({ title: '¡Lección completada!', description: lesson.mediaType === 'podcast' ? '¡Podcast terminado! Buen trabajo.' : 'El video ha terminado. ¡Buen trabajo!' });
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
                <p className="text-xs text-muted-foreground">Material de lectura</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                <Download className="w-3.5 h-3.5" />
                Descargar PDF
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
          Volver a cursos
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
                {lesson.mediaType === 'video' ? '🎬 Video' : lesson.mediaType === 'podcast' ? '🎧 Podcast' : '📄 Lectura'}
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
