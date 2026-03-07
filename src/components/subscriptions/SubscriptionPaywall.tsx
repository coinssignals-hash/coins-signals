import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Crown, Rocket, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import brandLogo from '@/assets/g174.svg';

interface SubscriptionPaywallProps {
  featureName?: string;
  reason: 'no_subscription' | 'upgrade_required';
  currentTier?: string;
  requiredTier?: string;
}

const tierLabels: Record<string, string> = {
  basico: 'Básico',
  plus: 'Plus',
  premium: 'Premium Pro Trader',
};

export function SubscriptionPaywall({ featureName, reason, currentTier, requiredTier }: SubscriptionPaywallProps) {
  const isUpgrade = reason === 'upgrade_required';

  return (
    <PageShell>
      <Header />

      <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
        <Card className="relative overflow-hidden max-w-md w-full border-primary/30 shadow-2xl shadow-primary/10">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
          <img
            src={brandLogo}
            alt=""
            aria-hidden="true"
            className="absolute bottom-4 right-4 w-24 h-24 opacity-[0.06] pointer-events-none select-none"
          />

          <CardContent className="relative p-8 text-center">
            {/* Icon */}
            <div className={cn(
              'w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center',
              isUpgrade
                ? 'bg-accent/15 text-accent'
                : 'bg-primary/15 text-primary'
            )}>
              {isUpgrade ? (
                <Rocket className="w-8 h-8" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground mb-2">
              {isUpgrade ? 'Mejora tu Plan' : 'Contenido Premium'}
            </h2>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {isUpgrade ? (
                <>
                  {featureName && (
                    <span className="text-foreground font-medium">{featureName}</span>
                  )}{' '}
                  requiere el plan{' '}
                  <span className="text-primary font-semibold">
                    {requiredTier ? tierLabels[requiredTier] : 'superior'}
                  </span>
                  . Actualmente tienes el plan{' '}
                  <span className="text-foreground font-medium">
                    {currentTier ? tierLabels[currentTier] : ''}
                  </span>.
                </>
              ) : (
                <>
                  {featureName ? (
                    <>
                      <span className="text-foreground font-medium">{featureName}</span>{' '}
                      es una función exclusiva para suscriptores.
                    </>
                  ) : (
                    'Esta función es exclusiva para suscriptores.'
                  )}{' '}
                  Suscríbete para desbloquear todas las herramientas profesionales.
                </>
              )}
            </p>

            {/* Features preview */}
            <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-left space-y-2.5">
              {[
                'Señales ilimitadas con IA',
                'Análisis técnico avanzado',
                'Centro de Inteligencia Artificial',
                'Conexión multi-broker',
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="text-foreground/80">{feat}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link to="/subscriptions">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 h-11">
                <Crown className="w-4 h-4" />
                {isUpgrade ? 'Mejorar Plan' : 'Ver Planes'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <p className="text-[10px] text-muted-foreground mt-4">
              Cancela en cualquier momento · Sin compromisos
            </p>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
