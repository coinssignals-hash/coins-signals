import { Currency, CURRENCIES } from '@/types/news';
import { cn } from '@/lib/utils';

interface CurrencyFilterProps {
  selected: Currency[];
  onChange: (currencies: Currency[]) => void;
}

export function CurrencyFilter({ selected, onChange }: CurrencyFilterProps) {
  const toggleCurrency = (currency: Currency) => {
    if (selected.includes(currency)) {
      onChange(selected.filter((c) => c !== currency));
    } else {
      onChange([...selected, currency]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Filtrar por divisa
        </span>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Limpiar ({selected.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CURRENCIES) as Currency[]).map((currency) => {
          const isSelected = selected.includes(currency);
          const currencyInfo = CURRENCIES[currency];
          
          return (
            <button
              key={currency}
              onClick={() => toggleCurrency(currency)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                'border',
                isSelected
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              <span>{currencyInfo.flag}</span>
              <span>{currency}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
