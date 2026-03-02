import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export function PlanCarousel({ plans, billingPeriod }: PlanCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(1);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

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

  return (
    <div className="relative flex flex-col items-center">
      {/* Stacked cards container with swipe */}
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
          const isRight = offset > 0;
          const absOffset = Math.abs(offset);

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
                  'relative overflow-hidden border transition-all duration-300',
                  isActive ? 'border-primary/60 shadow-2xl shadow-primary/15' : 'border-border/40 shadow-lg',
                )}
              >
                {/* Gradient overlay */}
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40', plan.color)} />

                {/* Glow effect for active */}
                {isActive && (
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 via-transparent to-accent/10 pointer-events-none" />
                )}

                <CardContent className="relative p-5">
                  {/* Header */}
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

                  <h3 className="text-sm font-semibold text-primary mb-1">
                    {plan.subtitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground tracking-tight">
                      ${billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceWeekly}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      /{billingPeriod === 'monthly' ? 'mes' : 'sem'}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border/60 mb-4" />

                  {/* Features */}
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

                  {/* CTA */}
                  <div className="space-y-2">
                    <Button
                      className={cn(
                        'w-full font-semibold',
                        plan.featured
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50'
                      )}
                    >
                      Suscribirme
                    </Button>

                    {plan.featured && (
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

      {/* Navigation */}
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
