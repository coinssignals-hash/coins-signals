import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { VideoPlayer } from '@/components/courses/VideoPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  FileText,
  Download,
  MessageCircle,
  ThumbsUp,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  duration: string;
}

interface LessonData {
  id: string;
  title: string;
  description: string;
  duration: string;
  module: string;
  moduleId: string;
  category: string;
  videoUrl: string;
  resources: { name: string; size: string }[];
  lessons: Lesson[];
}

const allLessons: Record<string, LessonData> = {
  '1.1': {
    id: '1.1',
    title: '¿Qué es el trading?',
    description: 'Una introducción completa al mundo del trading y sus conceptos fundamentales.',
    duration: '15 min',
    module: 'Introducción al trading',
    moduleId: 'intro-trading',
    category: 'Inicio al Trading',
    videoUrl: '',
    resources: [
      { name: 'Introducción al Trading.pdf', size: '1.8 MB' },
    ],
    lessons: [
      { id: '1.1', title: '¿Qué es el trading?', duration: '15 min' },
      { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' },
      { id: '1.3', title: 'Principales mercados', duration: '20 min' },
    ]
  },
  '1.2': {
    id: '1.2',
    title: 'Diferencia entre invertir y tradear',
    description: 'Aprende las diferencias clave entre inversión a largo plazo y trading activo.',
    duration: '12 min',
    module: 'Introducción al trading',
    moduleId: 'intro-trading',
    category: 'Inicio al Trading',
    videoUrl: '',
    resources: [],
    lessons: [
      { id: '1.1', title: '¿Qué es el trading?', duration: '15 min' },
      { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' },
      { id: '1.3', title: 'Principales mercados', duration: '20 min' },
    ]
  },
  '1.3': {
    id: '1.3',
    title: 'Principales mercados: acciones, forex, índices, materias primas, criptos',
    description: 'Conoce los diferentes mercados financieros donde puedes operar.',
    duration: '20 min',
    module: 'Introducción al trading',
    moduleId: 'intro-trading',
    category: 'Inicio al Trading',
    videoUrl: '',
    resources: [],
    lessons: [
      { id: '1.1', title: '¿Qué es el trading?', duration: '15 min' },
      { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min' },
      { id: '1.3', title: 'Principales mercados', duration: '20 min' },
    ]
  },
  '2.1': {
    id: '2.1',
    title: 'Qué es una orden (market, límite, stop)',
    description: 'Aprende los diferentes tipos de órdenes que puedes utilizar en el trading y cuándo usar cada una de ellas.',
    duration: '18 min',
    module: 'Cómo funciona una operación de trading',
    moduleId: 'operacion-trading',
    category: 'Inicio al Trading',
    videoUrl: '',
    resources: [
      { name: 'Guía de órdenes.pdf', size: '2.4 MB' },
      { name: 'Cheatsheet tipos de órdenes.pdf', size: '1.1 MB' },
    ],
    lessons: [
      { id: '2.1', title: 'Qué es una orden (market, límite, stop)', duration: '18 min' },
      { id: '2.2', title: 'Conceptos clave: spread, comisión, apalancamiento', duration: '25 min' },
      { id: '2.3', title: 'Tipos de operaciones: compra y venta', duration: '15 min' },
      { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' },
    ]
  },
  '2.2': {
    id: '2.2',
    title: 'Conceptos clave: spread, comisión, apalancamiento, margen',
    description: 'Domina los conceptos fundamentales que todo trader debe conocer.',
    duration: '25 min',
    module: 'Cómo funciona una operación de trading',
    moduleId: 'operacion-trading',
    category: 'Inicio al Trading',
    videoUrl: '',
    resources: [],
    lessons: [
      { id: '2.1', title: 'Qué es una orden (market, límite, stop)', duration: '18 min' },
      { id: '2.2', title: 'Conceptos clave: spread, comisión, apalancamiento', duration: '25 min' },
      { id: '2.3', title: 'Tipos de operaciones: compra y venta', duration: '15 min' },
      { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' },
    ]
  },
  '2.3': {
    id: '2.3',
    title: 'Tipos de operaciones: compra (largo) y venta (corto)',
    description: 'Entiende cómo funcionan las operaciones en largo y en corto.',
    duration: '15 min',
    module: 'Cómo funciona una operación de trading',
    moduleId: 'operacion-trading',
    category: 'Inicio al Trading',
    videoUrl: '',
    resources: [],
    lessons: [
      { id: '2.1', title: 'Qué es una orden (market, límite, stop)', duration: '18 min' },
      { id: '2.2', title: 'Conceptos clave: spread, comisión, apalancamiento', duration: '25 min' },
      { id: '2.3', title: 'Tipos de operaciones: compra y venta', duration: '15 min' },
      { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' },
    ]
  },
  '2.4': {
    id: '2.4',
    title: 'Stop loss y take profit (cómo protegerte y asegurar beneficios)',
    description: 'Aprende a proteger tu capital y asegurar ganancias con estas herramientas esenciales.',
    duration: '22 min',
    module: 'Cómo funciona una operación de trading',
    moduleId: 'operacion-trading',
    category: 'Inicio al Trading',
    videoUrl: '',
    resources: [],
    lessons: [
      { id: '2.1', title: 'Qué es una orden (market, límite, stop)', duration: '18 min' },
      { id: '2.2', title: 'Conceptos clave: spread, comisión, apalancamiento', duration: '25 min' },
      { id: '2.3', title: 'Tipos de operaciones: compra y venta', duration: '15 min' },
      { id: '2.4', title: 'Stop loss y take profit', duration: '22 min' },
    ]
  },
};

const defaultLesson = allLessons['2.1'];

export default function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = allLessons[lessonId || '2.1'] || defaultLesson;
  
  const {
    isLessonCompleted,
    toggleLessonComplete,
    setLastViewedLesson,
    initializeModule,
    getModuleProgress,
  } = useCourseProgress();

  const isCompleted = isLessonCompleted(lesson.id);

  // Set last viewed lesson and initialize module on mount
  useEffect(() => {
    setLastViewedLesson(lesson.id);
    initializeModule(lesson.moduleId, lesson.lessons.length);
  }, [lesson.id, lesson.moduleId, lesson.lessons.length, setLastViewedLesson, initializeModule]);

  const currentIndex = lesson.lessons.findIndex(l => l.id === lesson.id);
  const hasNext = currentIndex < lesson.lessons.length - 1;
  const hasPrev = currentIndex > 0;

  const moduleProgress = getModuleProgress(lesson.moduleId);
  const completedCount = moduleProgress?.completedLessons || 0;
  const progress = (completedCount / lesson.lessons.length) * 100;

  const handleToggleComplete = () => {
    toggleLessonComplete(lesson.id, lesson.moduleId);
    if (!isCompleted) {
      toast({
        title: "¡Lección completada!",
        description: `Has completado "${lesson.title}"`,
      });
    }
  };

  const goToLesson = (id: string) => {
    navigate(`/courses/lesson/${id}`);
  };

  const goNext = () => {
    if (hasNext) {
      goToLesson(lesson.lessons[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (hasPrev) {
      goToLesson(lesson.lessons[currentIndex - 1].id);
    }
  };

  return (
    <PageShell>
      <Header />
      
      <main className="py-4 px-4">
        {/* Back navigation */}
        <div className="flex items-center gap-2 mb-4">
          <Link to="/courses">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Volver a cursos
            </Button>
          </Link>
        </div>

        {/* Video Player */}
        <div className="mb-6">
          <VideoPlayer 
            src={lesson.videoUrl}
            title={lesson.title}
            onEnded={() => {
              if (!isCompleted) {
                toggleLessonComplete(lesson.id, lesson.moduleId);
                toast({
                  title: "¡Lección completada!",
                  description: "El video ha terminado. ¡Buen trabajo!",
                });
              }
            }}
          />
        </div>

        {/* Lesson Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{lesson.category}</Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{lesson.module}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {lesson.id}. {lesson.title}
            </h1>
            <p className="text-sm text-muted-foreground">{lesson.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant={isCompleted ? "default" : "outline"}
              size="sm"
              onClick={handleToggleComplete}
              className={cn(isCompleted && "bg-primary")}
            >
              <CheckCircle className={cn("w-4 h-4 mr-1", isCompleted && "text-primary-foreground")} />
              {isCompleted ? "Completada" : "Marcar completada"}
            </Button>
            <Button variant="ghost" size="sm">
              <ThumbsUp className="w-4 h-4 mr-1" />
              Útil
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle className="w-4 h-4 mr-1" />
              Preguntar
            </Button>
          </div>

          {/* Navigation */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={!hasPrev}
                  onClick={goPrev}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{lesson.duration}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={!hasNext}
                  onClick={goNext}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progreso del módulo</span>
                <span className="text-sm text-primary">{completedCount}/{lesson.lessons.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Lesson List */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-3">Lecciones del módulo</h3>
              <div className="space-y-2">
                {lesson.lessons.map((item, idx) => {
                  const itemCompleted = isLessonCompleted(item.id);
                  const isCurrent = item.id === lesson.id;
                  
                  return (
                    <div 
                      key={item.id}
                      onClick={() => goToLesson(item.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer",
                        isCurrent 
                          ? "bg-primary/10 border border-primary/30" 
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          itemCompleted 
                            ? "bg-primary text-primary-foreground" 
                            : isCurrent 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                        )}>
                          {itemCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span className={cn(
                          "text-sm",
                          isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {item.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          {lesson.resources.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground mb-3">Recursos descargables</h3>
                <div className="space-y-2">
                  {lesson.resources.map((resource, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm text-foreground">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">{resource.size}</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </PageShell>
  );
}
