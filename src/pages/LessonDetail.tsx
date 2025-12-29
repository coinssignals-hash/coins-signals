import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { VideoPlayer } from '@/components/courses/VideoPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  FileText,
  Download,
  MessageCircle,
  ThumbsUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock lesson data
const lessonData = {
  id: '2.1',
  title: 'Qué es una orden (market, límite, stop)',
  description: 'Aprende los diferentes tipos de órdenes que puedes utilizar en el trading y cuándo usar cada una de ellas.',
  duration: '18 min',
  module: 'Cómo funciona una operación de trading',
  category: 'Inicio al Trading',
  videoUrl: '', // Empty for demo mode
  completed: false,
  resources: [
    { name: 'Guía de órdenes.pdf', size: '2.4 MB' },
    { name: 'Cheatsheet tipos de órdenes.pdf', size: '1.1 MB' },
  ],
  lessons: [
    { id: '2.1', title: 'Qué es una orden (market, límite, stop)', duration: '18 min', completed: false, current: true },
    { id: '2.2', title: 'Conceptos clave: spread, comisión, apalancamiento', duration: '25 min', completed: false },
    { id: '2.3', title: 'Tipos de operaciones: compra y venta', duration: '15 min', completed: false },
    { id: '2.4', title: 'Stop loss y take profit', duration: '22 min', completed: false },
  ]
};

export default function LessonDetail() {
  const { lessonId } = useParams();
  const [lesson] = useState(lessonData);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentIndex = lesson.lessons.findIndex(l => l.current);
  const hasNext = currentIndex < lesson.lessons.length - 1;
  const hasPrev = currentIndex > 0;

  const completedCount = lesson.lessons.filter(l => l.completed).length;
  const progress = (completedCount / lesson.lessons.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4">
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
            onEnded={() => setIsCompleted(true)}
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
              onClick={() => setIsCompleted(!isCompleted)}
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
                {lesson.lessons.map((item, idx) => (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer",
                      item.current 
                        ? "bg-primary/10 border border-primary/30" 
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        item.completed 
                          ? "bg-primary text-primary-foreground" 
                          : item.current 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                      )}>
                        {item.completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={cn(
                        "text-sm",
                        item.current ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.duration}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
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
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
