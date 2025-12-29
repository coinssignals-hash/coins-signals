import { cn } from '@/lib/utils';

interface MarketTabsProps {
  selectedMarket: string;
  onSelectMarket: (market: string) => void;
}

const markets = ['Forex', 'Acciones', 'Futuro', 'Cripto', 'Indices'];

export function MarketTabs({ selectedMarket, onSelectMarket }: MarketTabsProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-2 mb-4">
      <div className="flex justify-center gap-2">
        {markets.map((market) => (
          <button
            key={market}
            onClick={() => onSelectMarket(market)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded transition-colors',
              selectedMarket === market
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {market}
          </button>
        ))}
      </div>
    </div>
  );
}
