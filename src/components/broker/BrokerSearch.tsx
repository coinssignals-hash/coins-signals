import { Search, TrendingUp, Briefcase, Gem, BarChart3, Bitcoin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BrokerSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onAdvancedSearch: () => void;
}

const categories = [
  { id: 'forex', name: 'Forex Divisas', icon: TrendingUp },
  { id: 'acciones', name: 'Acciones Bolsa de Valores', icon: Briefcase },
  { id: 'materias', name: 'Materias Primas Oro, Petroleo', icon: Gem },
  { id: 'bursatiles', name: 'Bursatiles Futuro, Opciones', icon: BarChart3 },
  { id: 'crypto', name: 'CrytoMonedas', icon: Bitcoin },
];

export function BrokerSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onAdvancedSearch,
}: BrokerSearchProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Buscar Broker</h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tu Brokers"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 justify-start bg-secondary border-border"
              onClick={onAdvancedSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Principiante
            </Button>
            <div className="text-xs text-muted-foreground flex-1">
              <p>Existe un Broker a tu medida</p>
              <p>Saca las mejores ganancias segun tu manera de operar, tiempo en el mercado comision o spreads.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(isSelected ? null : cat.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg min-w-[80px] transition-colors ${
                isSelected
                  ? 'bg-primary/20 border border-primary'
                  : 'bg-secondary border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/30' : 'bg-card'}`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-[10px] text-center leading-tight ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                {cat.name.split(' ').slice(0, 2).join(' ')}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Estos son los 5 Brokers Mas Populares Para Principiantes en los mercado de Forex
      </p>
    </div>
  );
}
