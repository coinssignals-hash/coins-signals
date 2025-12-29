import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrokerData } from './BrokerCard';

interface BrokerDetailProps {
  broker: BrokerData;
  onBack: () => void;
}

export function BrokerDetail({ broker, onBack }: BrokerDetailProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      {/* Header */}
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold text-foreground">{broker.name}</h1>
        <Badge variant="outline" className="text-primary border-primary">
          {broker.level}
        </Badge>
      </div>

      {/* Logo and Description */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-28 h-24 bg-secondary rounded-lg flex items-center justify-center text-3xl font-bold text-muted-foreground shrink-0">
              {broker.name.substring(0, 2).toUpperCase()}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {broker.description || `Información Básica: ${broker.name} es uno de los brokers más reconocidos en el mercado de Forex y CFDs, famoso por su entorno de trading profesional y amplia gama de instrumentos.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deposit and Commission */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-2">
            <div>
              <span className="text-primary text-sm">Deposito</span>
              <p className="text-accent font-medium">{broker.depositoInicial}</p>
            </div>
            <div>
              <span className="text-primary text-sm">Retiros</span>
              <p className="text-muted-foreground text-sm">Sin Limites</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-2">
            <div>
              <span className="text-primary text-sm">Comision</span>
              <p className="text-accent font-medium">{broker.comision}</p>
            </div>
            <div>
              <span className="text-primary text-sm">Spreads</span>
              <p className="text-accent font-medium">{broker.spreads}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leverage */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <span className="text-primary text-sm">Apalancamientos</span>
          <div className="flex gap-4 mt-1">
            {broker.apalancamiento.map((ap, idx) => (
              <span key={idx} className="text-muted-foreground text-sm">{ap}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pros and Cons */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-primary font-semibold mb-3">Pro</h3>
            <ul className="space-y-2">
              {(broker.pros || [
                '2800+ Traded Assets',
                'Unlimited Demo Account',
                'Competitive Spreads',
                'Regulated by Reputable Authorities',
                'Wide Range of Tradable CFD Instruments'
              ]).map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{pro}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-destructive font-semibold mb-3">Cons</h3>
            <ul className="space-y-2">
              {(broker.cons || [
                'Limited Educational Resources',
                'High Leverage Poses Risks'
              ]).map((con, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-foreground">{con}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Region */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="mb-2">
            <span className="text-primary text-sm">Region Principal</span>
            <p className="text-muted-foreground text-sm">{broker.regionPrincipal || `${broker.central}, Australia`}</p>
          </div>
          <div>
            <span className="text-primary text-sm">Paises de Operacion</span>
            <p className="text-muted-foreground text-sm">{broker.paisesOperacion || 'Global, Todos los paises con restriccion en algunas juridiciones'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Regulations and Markets */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-primary font-semibold mb-3">Organismos de Regulacion</h3>
            <ul className="space-y-1">
              {(broker.organismos || broker.regulaciones).map((org, idx) => (
                <li key={idx} className="text-sm">
                  <span className="text-primary">{org}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-primary font-semibold mb-3">Mercados</h3>
            <ul className="space-y-1">
              {(broker.mercados || [
                { name: 'INDICES', items: 'S&P 500, Nasdaq 100' },
                { name: 'FUTUROS', items: 'Oil, Gas Natural' },
                { name: 'FOREX', items: 'USD-JPY, EUR-USD' },
                { name: 'ACCIONES', items: 'Apple, BBVA' },
                { name: 'CRIPTOMONEDAS', items: 'Bitcoin, Ethereum' }
              ]).map((market, idx) => (
                <li key={idx} className="text-sm">
                  <span className="text-primary">{market.name}</span>
                  <p className="text-muted-foreground text-xs">{market.items}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Platforms and Account Types */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-primary font-semibold mb-3">Plataformas de Operacion</h3>
            <ul className="space-y-2">
              {(broker.plataformasOperacion || [
                { name: 'Plataforma propia', description: 'Plataforma en la Web' },
                { name: 'Aplicacion Moviles', description: 'App para Android e iOS' },
                { name: 'MetaTrader', description: 'MetaTrader 4 y 5' },
                { name: 'Plataforma en la Web', description: 'Chrome, Safari, Explorer' },
                { name: 'Integracion', description: 'ProRealtime, TradingView' }
              ]).map((platform, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-foreground text-sm">{platform.name}</span>
                    <p className="text-muted-foreground text-xs">{platform.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-primary font-semibold mb-3">Tipos de Cuentas</h3>
            <ul className="space-y-2">
              {(broker.tiposCuenta || [
                { name: 'Cuenta Demo', description: 'Practica sin pérdidas' },
                { name: 'Cuenta Segregada', description: 'Cuenta especial' },
                { name: 'Cuenta Standar', description: 'Cuenta real con apalancamiento' },
                { name: 'Cuenta Principiantes', description: 'Con herramientas especiales' },
                { name: 'Cuentas Profesional', description: 'Para profesionales' }
              ]).map((account, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-foreground text-sm">{account.name}</span>
                    <p className="text-muted-foreground text-xs">{account.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Button className="w-full bg-primary hover:bg-primary/90">
        Abrir Cuenta con {broker.name}
      </Button>
    </div>
  );
}
