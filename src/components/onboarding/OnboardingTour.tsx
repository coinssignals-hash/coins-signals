import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, TrendingUp, Bell, Wallet, GraduationCap, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route?: string;
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a TradeSignals!',
    description: 'Te guiaremos por las principales funciones de la aplicación para que empieces a operar como un profesional.',
    icon: Sparkles,
  },
  {
    id: 'signals',
    title: 'Señales de Trading',
    description: 'Recibe señales de compra/venta en tiempo real con niveles de entrada, take profit y stop loss calculados por IA.',
    icon: TrendingUp,
    route: '/signals',
  },
  {
    id: 'analysis',
    title: 'Análisis Técnico',
    description: 'Accede a análisis detallados con indicadores RSI, MACD, Bollinger y más para cualquier par de divisas.',
    icon: TrendingUp,
    route: '/',
  },
  {
    id: 'news',
    title: 'Noticias Económicas',
    description: 'Mantente informado con noticias de alto impacto y análisis de IA sobre cómo afectarán al mercado.',
    icon: Newspaper,
    route: '/news',
  },
  {
    id: 'broker',
    title: 'Conecta tu Broker',
    description: 'Vincula hasta 5 cuentas de broker para ver tu portfolio unificado y recibir alertas automáticas.',
    icon: Wallet,
    route: '/link-broker',
  },
  {
    id: 'notifications',
    title: 'Notificaciones Inteligentes',
    description: 'Configura alertas push, WhatsApp y sonido para no perderte ninguna oportunidad de trading.',
    icon: Bell,
    route: '/settings/notifications',
  },
  {
    id: 'courses',
    title: 'Academia de Trading',
    description: 'Aprende trading con nuestros cursos en video, desde básico hasta estrategias avanzadas.',
    icon: GraduationCap,
    route: '/courses',
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function OnboardingTour({ onComplete, forceShow = false }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding_completed');
    if (!hasSeenTour || forceShow) {
      // Small delay to let the page load
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsOpen(false);
  };

  const handleGoToRoute = () => {
    const step = tourSteps[currentStep];
    if (step.route) {
      handleComplete();
      navigate(step.route);
    }
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <div className={cn(
        "relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden transition-all duration-300",
        isAnimating && "opacity-50 scale-95"
      )}>
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentStep 
                  ? "w-6 bg-cyan-500" 
                  : index < currentStep 
                    ? "bg-cyan-500/50" 
                    : "bg-slate-600"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Icon className="w-10 h-10 text-cyan-400" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-3">{step.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
          </div>

          {/* Go to page button (for steps with routes) */}
          {step.route && !isFirstStep && (
            <Button
              onClick={handleGoToRoute}
              variant="outline"
              className="w-full mb-4 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              Ir a {step.title}
            </Button>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button
                onClick={handlePrev}
                variant="ghost"
                className="flex-1 text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className={cn(
                "flex-1 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white",
                isFirstStep && "flex-[2]"
              )}
            >
              {isLastStep ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  ¡Comenzar!
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-slate-500 text-xs hover:text-slate-400 transition-colors"
          >
            Saltar tour
          </button>
        </div>

        {/* Step counter */}
        <div className="bg-slate-800/50 py-3 text-center border-t border-slate-700/50">
          <span className="text-slate-500 text-xs">
            Paso {currentStep + 1} de {tourSteps.length}
          </span>
        </div>
      </div>
    </div>
  );
}

// Hook to control tour
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  const startTour = () => {
    localStorage.removeItem('onboarding_completed');
    setShowTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem('onboarding_completed');
  };

  return { showTour, startTour, resetTour, setShowTour };
}
