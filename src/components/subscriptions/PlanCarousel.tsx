import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronLeft, ChevronRight, Star, Crown, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  priceMonthly: number;
  priceWeekly: number;
  color: string;
  borderColor: string;
  badgeColor: string;
  featured?: boolean;
  features: string[];
}

interface PlanCarouselProps {
  plans: Plan[];
  billingPeriod: 'weekly' | 'monthly';
  activeTier?: string | null;
  onSubscribe?: (planId: string) => void;
}

export function PlanCarousel({ plans, billingPeriod, activeTier, onSubscribe }: PlanCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(1);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const goTo = (index: number) => {
    if (index >= 0 && index < plans.length) setActiveIndex(index);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 50;
    const { x } = info.offset;
    const vx = info.velocity.x;
    if (x < -threshold || vx < -300) goTo(activeIndex + 1);
    else if (x > threshold || vx > 300) goTo(activeIndex - 1);
  };

  const handleSubscribe = async (planId: string) => {
    if (!onSubscribe) return;
    setLoadingPlan(planId);
    try {
      await onSubscribe(planId);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className="relative w-full flex justify-center items-start touch-pan-y"
        style={{ minHeight: '540px' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
      >
        {plans.map((plan, index) => {
          const offset = index - activeIndex;
          const isActive = offset === 0;
          const isLeft = offset < 0;
          const absOffset = Math.abs(offset);
          const isCurrentPlan = activeTier === plan.id;

          return (
            <motion.div
              key={plan.id}
              className="absolute cursor-pointer"
              style={{
                width: 'min(85vw, 320px)',
                zIndex: isActive ? 30 : 20 - absOffset,
                transformOrigin: 'top center',
              }}
              animate={{
                x: isActive ? 0 : isLeft ? `-${absOffset * 28}px` : `${absOffset * 28}px`,
                scale: isActive ? 1 : 0.88 - absOffset * 0.04,
                opacity: isActive ? 1 : 0.45,
                rotateY: isActive ? 0 : isLeft ? 6 : -6,
                y: isActive ? 0 : 16 * absOffset,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
              onClick={() => goTo(index)}
            >
              <Card
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  'bg-[hsl(225,45%,4%)] border',
                  isCurrentPlan
                    ? 'border-accent shadow-[0_0_20px_hsl(var(--accent)/0.25)] ring-1 ring-accent/30'
                    : isActive
                      ? 'border-primary/50 shadow-[0_0_24px_hsl(var(--primary)/0.2)]'
                      : 'border-border/30 shadow-lg',
                )}
              >
                {/* Animated glow border overlay */}
                {isActive && (
                  <div className={cn(
                    'absolute -inset-px rounded-xl pointer-events-none',
                    isCurrentPlan
                      ? 'bg-gradient-to-b from-accent/25 via-transparent to-accent/10'
                      : 'bg-gradient-to-b from-primary/20 via-transparent to-primary/8'
                  )} />
                )}

                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Corner accent glow */}
                <div className={cn(
                  'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none',
                  plan.id === 'basico' && 'bg-yellow-500/8',
                  plan.id === 'plus' && 'bg-primary/10',
                  plan.id === 'premium' && 'bg-blue-500/10',
                )} />

                {/* Current plan badge */}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-center text-xs font-bold py-1 z-10 flex items-center justify-center gap-1">
                    <Crown className="w-3 h-3" />
                    Tu Plan Actual
                  </div>
                )}

                <CardContent className={cn('relative p-5', isCurrentPlan && 'pt-8')}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={cn('text-xs font-bold px-3 py-1', plan.badgeColor)}>
                      {plan.name}
                    </Badge>
                    {plan.featured && (
                      <div className="flex items-center gap-1 text-accent text-xs font-medium">
                        <Star className="w-3.5 h-3.5 fill-accent" />
                        Popular
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-primary mb-1">{plan.subtitle}</h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{plan.description}</p>

                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground tracking-tight">
                      ${billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceWeekly}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      /{billingPeriod === 'monthly' ? 'mes' : 'sem'}
                    </span>
                  </div>

                  <div className="h-px bg-border/60 mb-4" />

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <span className="text-foreground/85">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full font-semibold bg-accent/20 text-accent border border-accent/30">
                        <Crown className="w-4 h-4 mr-1.5" />
                        Plan Activo
                      </Button>
                    ) : (
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleSubscribe(plan.id); }}
                        disabled={loadingPlan === plan.id}
                        className={cn(
                          'w-full font-semibold',
                          plan.featured
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50'
                        )}
                      >
                        {loadingPlan === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        ) : null}
                        Suscribirme
                      </Button>
                    )}

                    {plan.featured && !isCurrentPlan && (
                      <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10 text-xs">
                        7 Días Gratis
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="flex items-center gap-6 mt-4">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-2">
          {plans.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === activeIndex
                  ? 'bg-primary w-7'
                  : 'bg-muted-foreground/25 w-2 hover:bg-muted-foreground/40'
              )}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === plans.length - 1}
          className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
