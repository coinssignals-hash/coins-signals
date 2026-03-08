import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrokerData } from './BrokerCard';
import { useTranslation } from '@/i18n/LanguageContext';

interface BrokerDetailProps {
  broker: BrokerData;
  onBack: () => void;
}

export function BrokerDetail({ broker, onBack }: BrokerDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('bk_back')}
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
              {broker.description || `${t('bk_basic_info')}: ${broker.name} ${t('bk_default_desc')}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deposit and Commission */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-2">
            <div>
              <span className="text-primary text-sm">{t('bk_deposit')}</span>
              <p className="text-accent font-medium">{broker.depositoInicial}</p>
            </div>
            <div>
              <span className="text-primary text-sm">{t('bk_withdrawals')}</span>
              <p className="text-muted-foreground text-sm">{t('bk_no_limits')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-2">
            <div>
              <span className="text-primary text-sm">{t('bk_commission')}</span>
              <p className="text-accent font-medium">{broker.comision}</p>
            </div>
            <div>
              <span className="text-primary text-sm">{t('bk_spreads')}</span>
              <p className="text-accent font-medium">{broker.spreads}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leverage */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <span className="text-primary text-sm">{t('bk_leverages')}</span>
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
            <h3 className="text-primary font-semibold mb-3">{t('bk_pro')}</h3>
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
            <h3 className="text-destructive font-semibold mb-3">{t('bk_cons')}</h3>
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
            <span className="text-primary text-sm">{t('bk_main_region')}</span>
            <p className="text-muted-foreground text-sm">{broker.regionPrincipal || `${broker.central}, Australia`}</p>
          </div>
          <div>
            <span className="text-primary text-sm">{t('bk_operating_countries')}</span>
            <p className="text-muted-foreground text-sm">{broker.paisesOperacion || t('bk_global_countries')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Regulations and Markets */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-primary font-semibold mb-3">{t('bk_regulatory_bodies')}</h3>
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
            <h3 className="text-primary font-semibold mb-3">{t('bk_markets')}</h3>
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
            <h3 className="text-primary font-semibold mb-3">{t('bk_trading_platforms')}</h3>
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
            <h3 className="text-primary font-semibold mb-3">{t('bk_account_types')}</h3>
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
        {t('bk_open_account')} {broker.name}
      </Button>
    </div>
  );
}
