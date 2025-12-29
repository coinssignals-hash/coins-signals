import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const updateFilter = (key: keyof typeof filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Seleciona Un Broker segun tu perfil de trader
          </h3>
          <p className="text-xs text-muted-foreground">
            En muy pocos pasos podras descubrir los mejores Broker segun te forma de invertir, esto aumentara el exito de tus operaciones
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Introduce el pais de donde vives</p>
            <Select value={filters.ubicacion} onValueChange={(v) => updateFilter('ubicacion', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Ubicacion" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="espana">España</SelectItem>
                <SelectItem value="mexico">México</SelectItem>
                <SelectItem value="argentina">Argentina</SelectItem>
                <SelectItem value="colombia">Colombia</SelectItem>
                <SelectItem value="usa">Estados Unidos</SelectItem>
                <SelectItem value="uk">Reino Unido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Modo de Trader, (tiempo en el mercado)</p>
            <Select value={filters.moneda} onValueChange={(v) => updateFilter('moneda', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Moneda" />
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
            <p className="text-xs text-muted-foreground">Con cuanto dinero piensa abrir tu cuenta</p>
            <Select value={filters.depositoInicial} onValueChange={(v) => updateFilter('depositoInicial', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Deposito Inicial" />
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
            <p className="text-xs text-muted-foreground">cual es la moneda de tu pais</p>
            <Select value={filters.metodo} onValueChange={(v) => updateFilter('metodo', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Metodo" />
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
            <p className="text-xs text-muted-foreground">Cuanto dinero piensas entrar al mercado</p>
            <Select value={filters.enOperacion} onValueChange={(v) => updateFilter('enOperacion', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="En Operacion" />
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
            <p className="text-xs text-muted-foreground">Mercados en los que invertiras</p>
            <Select value={filters.mercados} onValueChange={(v) => updateFilter('mercados', v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Mercados" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="acciones">Acciones</SelectItem>
                <SelectItem value="indices">Indices</SelectItem>
                <SelectItem value="crypto">Criptomonedas</SelectItem>
                <SelectItem value="materias">Materias Primas</SelectItem>
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
          Buscar Broker
        </Button>
      </CardContent>
    </Card>
  );
}
