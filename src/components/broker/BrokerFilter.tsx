import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n/LanguageContext';

interface BrokerFilterProps {
  filters: {
    ubicacion: string;
    moneda: string;
    depositoInicial: string;
    metodo: string;
    enOperacion: string;
    mercados: string;
  };
  onFiltersChange: (filters: BrokerFilterProps['filters']) => void;
  onSearch: () => void;
  onClose: () => void;
}

export function BrokerFilter({ filters, onFiltersChange, onSearch, onClose }: BrokerFilterProps) {
  const { t } = useTranslation();
  const updateFilter = (key: keyof typeof filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('bf_title')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('bf_desc')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('bf_country_label')}</p>
            <Select value={filters.ubicacion} onValueChange={(v) => updateFilter('ubicacion', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={t('bf_location')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="espana">España</SelectItem>
                <SelectItem value="mexico">México</SelectItem>
                <SelectItem value="argentina">Argentina</SelectItem>
                <SelectItem value="colombia">Colombia</SelectItem>
                <SelectItem value="usa">USA</SelectItem>
                <SelectItem value="uk">UK</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('bf_trading_mode_label')}</p>
            <Select value={filters.moneda} onValueChange={(v) => updateFilter('moneda', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={t('bf_currency')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="mxn">MXN</SelectItem>
                <SelectItem value="ars">ARS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('bf_deposit_label')}</p>
            <Select value={filters.depositoInicial} onValueChange={(v) => updateFilter('depositoInicial', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={t('bf_initial_deposit')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="0-50">$0 - $50</SelectItem>
                <SelectItem value="50-200">$50 - $200</SelectItem>
                <SelectItem value="200-500">$200 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1000</SelectItem>
                <SelectItem value="1000+">$1000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('bf_method_label')}</p>
            <Select value={filters.metodo} onValueChange={(v) => updateFilter('metodo', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={t('bf_method')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="scalping">Scalping</SelectItem>
                <SelectItem value="daytrading">Day Trading</SelectItem>
                <SelectItem value="swing">Swing Trading</SelectItem>
                <SelectItem value="position">Position Trading</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('bf_operation_label')}</p>
            <Select value={filters.enOperacion} onValueChange={(v) => updateFilter('enOperacion', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={t('bf_in_operation')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="0-100">$0 - $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1000</SelectItem>
                <SelectItem value="1000-5000">$1000 - $5000</SelectItem>
                <SelectItem value="5000+">$5000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('bf_markets_label')}</p>
            <Select value={filters.mercados} onValueChange={(v) => updateFilter('mercados', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={t('bf_markets')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="acciones">{t('bf_stocks')}</SelectItem>
                <SelectItem value="indices">{t('bf_indices')}</SelectItem>
                <SelectItem value="crypto">{t('bf_crypto')}</SelectItem>
                <SelectItem value="materias">{t('bf_commodities')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => {
            onSearch();
            onClose();
          }}
        >
          {t('bf_search_broker')}
        </Button>
      </CardContent>
    </Card>
  );
}
