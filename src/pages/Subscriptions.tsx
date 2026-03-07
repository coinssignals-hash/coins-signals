import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Settings2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanCarousel } from '@/components/subscriptions/PlanCarousel';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_TIERS } from '@/config/subscriptionTiers';
import { toast } from 'sonner';

const plans = [
  {
    id: 'basico' as const,
    name: 'Básico',
    subtitle: 'Essencial Para las Primeras Operaciones',
    description: 'Ideal si solo quieres comenzar',
    priceMonthly: 30,
    priceWeekly: 10,
    color: 'from-yellow-500/20 to-yellow-600/10',
    borderColor: 'border-yellow-500/50',
    badgeColor: 'bg-yellow-500 text-black',
    features: [
      'Señales De las Divisas Principales',
      'Hasta 10 señales por día',
      'Historial de señales, Rendimiento y Ganancias',
      'Accesos a canal educativo',
      'Alertas por precio, tendencia',
      'Recomendaciones de Brokers',
      'Recomendaciones para operar',
      'Soporte y servicio al cliente 24/7',
    ],
  },
  {
    id: 'plus' as const,
    name: 'Plus',
    subtitle: 'Plus Forex + Acciones + Cripto Multiactivos',
    description: 'Ideal para aumentar tus ganancias semanales con todas las herramientas',
    priceMonthly: 35,
    priceWeekly: 12,
    color: 'from-primary/30 to-primary/10',
    borderColor: 'border-primary',
    badgeColor: 'bg-primary text-primary-foreground',
    featured: true,
    features: [
      'Señales De todas las Divisas, Acciones, Índices',
      'Hasta 20 señales por día',
      'Historial de señales, Rendimiento y Ganancias',
      'Accesos a canal educativo',
      'Alertas ilimitadas por precio, tendencia',
      'Recomendaciones de Brokers',
      'Recomendaciones para operar',
      'Soporte y servicio al cliente 24/7',
      'Análisis con inteligencia Artificial',
      'Estrategia Forex, Acciones, Materia Prima',
      'Herramientas Trader: Calendario, Calculadora Profit, Reloj por tendencia',
    ],
  },
  {
    id: 'premium' as const,
    name: 'Premium Pro Trader',
    subtitle: 'Multi-Brokers',
    description: 'Para profesionales que quieren sacar el mejor partido del mercado',
    priceMonthly: 40,
    priceWeekly: 15,
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/50',
    badgeColor: 'bg-blue-500 text-white',
    features: [
      'Señales De todas las Divisas, Acciones, Índices',
      'Señales ilimitadas por día',
      'Historial de señales, Rendimiento y Ganancias',
      'Accesos a canal educativo',
      'Alertas ilimitadas por precio, tendencia',
      'Recomendaciones de Brokers',
      'Recomendaciones para operar',
      'Soporte y servicio al cliente 24/7',
      'Análisis con inteligencia Artificial',
      'Estrategia Forex, Acciones, Materia Prima',
      'Herramientas Trader',
      'Señales Trader: Meta Pivot, filtro por tendencia',
      'Conexión de Broker a la Aplicación: Copy, Stop loss, precio apertura, Bid',
      'Hasta 5 múltiple Broker',
      'Todo en una sola aplicación',
    ],
  },
];

export default function Subscriptions() {
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [searchParams] = useSearchParams();
  const { subscribed, tier, subscriptionEnd, loading, startCheckout, openPortal, checkSubscription, onTrial, trialDaysLeft } = useSubscription();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('¡Suscripción activada exitosamente!');
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Proceso de suscripción cancelado');
    }
  }, [searchParams, checkSubscription]);

  const handleSubscribe = async (planId: string) => {
    try {
      const tierConfig = SUBSCRIPTION_TIERS[planId as keyof typeof SUBSCRIPTION_TIERS];
      if (!tierConfig) return;
      const priceId = billingPeriod === 'monthly' ? tierConfig.monthly_price_id : tierConfig.weekly_price_id;
      await startCheckout(priceId);
    } catch (err) {
      toast.error('Error al iniciar el checkout');
      console.error(err);
    }
  };

  return (
    <PageShell>
      <Header />
      
      <main className="py-6">
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {subscribed && (
              <Button variant="outline" size="sm" onClick={openPortal} className="text-xs gap-1.5 border-primary/40 text-primary">
                <Settings2 className="w-3.5 h-3.5" />
                Gestionar
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={checkSubscription} className="h-8 w-8">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Trial banner */}
        {onTrial && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-center space-y-1">
            <p className="text-sm font-bold text-amber-400">
              🎉 ¡Prueba gratuita activa!
            </p>
            <p className="text-xs text-amber-300/80">
              Tienes acceso completo a todas las funciones Premium por{' '}
              <span className="font-bold text-amber-200">{trialDaysLeft} {trialDaysLeft === 1 ? 'día' : 'días'}</span> más.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Suscríbete antes de que termine para no perder el acceso.
            </p>
          </div>
        )}

        {/* Active plan banner */}
        {subscribed && !onTrial && tier && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <p className="text-sm text-primary font-medium">
              Plan activo: <span className="font-bold capitalize">{tier}</span>
              {subscriptionEnd && (
                <span className="text-muted-foreground ml-2">
                  · Renueva el {new Date(subscriptionEnd).toLocaleDateString('es-ES')}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-6 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            Mejora tus resultados con señales
          </h1>
          <p className="text-lg text-primary font-semibold mb-1">
            Profesionales con conexión directa a tus Brokers
          </p>
          <p className="text-sm text-muted-foreground">
            Elige entre planes diseñados para cada tipo de trader
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6 px-4">
          <div className="inline-flex rounded-lg bg-secondary p-1">
            <button
              onClick={() => setBillingPeriod('weekly')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                billingPeriod === 'weekly'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semanal
            </button>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                billingPeriod === 'monthly'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mensual
            </button>
          </div>
        </div>

        {/* Pricing Carousel */}
        <PlanCarousel
          plans={plans}
          billingPeriod={billingPeriod}
          activeTier={tier}
          onSubscribe={handleSubscribe}
        />

        {/* Footer Info */}
        <div className="text-center space-y-4 mt-8 px-4">
          <p className="text-sm text-muted-foreground">
            Sin contratos a largo plazo.{' '}
            <span className="text-foreground font-medium">Cancela cuando lo desee</span>
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>Tus datos de pago están cifrados y son seguros</span>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
