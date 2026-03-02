import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
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
}

export function PlanCarousel({ plans, billingPeriod }: PlanCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1); // Start on Plus (center)

  const updateActiveIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.scrollWidth / plans.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, plans.length - 1));
  }, [plans.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Scroll to center card on mount
    const cardWidth = container.scrollWidth / plans.length;
    container.scrollLeft = cardWidth * 1;
  }, [plans.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateActiveIndex, { passive: true });
    return () => container.removeEventListener('scroll', updateActiveIndex);
  }, [updateActiveIndex]);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.scrollWidth / plans.length;
    container.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Carousel container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-8 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {plans.map((plan, index) => {
          const isCentered = index === activeIndex;
          return (
            <motion.div
              key={plan.id}
              className="snap-center flex-shrink-0"
              style={{ width: '85%', minWidth: '280px', maxWidth: '340px' }}
              animate={{
                scale: isCentered ? 1.05 : 0.92,
                opacity: isCentered ? 1 : 0.6,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => scrollToIndex(index)}
            >
              <Card
                className={cn(
                  'relative overflow-hidden border-2 transition-shadow duration-300 h-full',
                  plan.borderColor,
                  isCentered && 'shadow-lg shadow-primary/20'
                )}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', plan.color)} />

                <CardContent className="relative p-5">
                  <div className="mb-3">
                    <Badge className={cn('mb-2', plan.badgeColor)}>
                      {plan.name}
                    </Badge>
                    <h3 className="text-sm font-semibold text-primary mb-1">
                      {plan.subtitle}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-accent">
                      ${billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceWeekly}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{billingPeriod === 'monthly' ? 'Mes' : 'Semana'}
                    </span>
                  </div>

                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    <Button
                      className={cn(
                        'w-full',
                        plan.featured
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                      )}
                    >
                      Suscribirme
                    </Button>

                    {plan.featured && (
                      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                        7 Días Gratis
                      </Button>
                    )}

                    <button className="w-full text-xs text-muted-foreground hover:text-foreground underline">
                      ver detalles
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {plans.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              index === activeIndex
                ? 'bg-primary w-6'
                : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </div>
  );
}
