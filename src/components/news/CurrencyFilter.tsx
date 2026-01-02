import { Currency, CURRENCIES } from '@/types/news';
import { cn } from '@/lib/utils';
import { useFavoriteCurrencies } from '@/hooks/useFavoriteCurrencies';
import { Star, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CurrencyFilterProps {
  selected: Currency[];
  onChange: (currencies: Currency[]) => void;
}

// Group currencies by region
const CURRENCY_REGIONS = {
  major: { label: 'Principales', currencies: ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'] as Currency[] },
  europe: { label: 'Europa', currencies: ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'TRY', 'RUB'] as Currency[] },
  asia: { label: 'Asia-Pacífico', currencies: ['CNY', 'HKD', 'SGD', 'KRW', 'INR', 'THB', 'MYR', 'IDR', 'PHP'] as Currency[] },
  americas: { label: 'Américas', currencies: ['MXN', 'BRL'] as Currency[] },
  middle_east: { label: 'Medio Oriente', currencies: ['AED', 'SAR', 'ILS'] as Currency[] },
  africa: { label: 'África', currencies: ['ZAR'] as Currency[] },
};

export function CurrencyFilter({ selected, onChange }: CurrencyFilterProps) {
  const { favorites, toggleFavorite, isFavorite, loading } = useFavoriteCurrencies();

  const toggleCurrency = (currency: Currency) => {
    if (selected.includes(currency)) {
      onChange(selected.filter((c) => c !== currency));
    } else {
      onChange([...selected, currency]);
    }
  };

  const clearAll = () => onChange([]);

  const renderCurrencyButton = (currency: Currency, showFavoriteStar = false) => {
    const isSelected = selected.includes(currency);
    const currencyInfo = CURRENCIES[currency];
    const isFav = isFavorite(currency);

    return (
      <div key={currency} className="relative group">
        <button
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
          {showFavoriteStar && isFav && (
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          )}
        </button>
        {/* Favorite toggle on long press / right click */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(currency);
          }}
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'bg-background border border-border shadow-sm hover:bg-accent',
            isFav && 'opacity-100'
          )}
          title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Star className={cn('w-3 h-3', isFav ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground')} />
        </button>
      </div>
    );
  };

  // Get non-favorite currencies grouped by region
  const nonFavoriteCurrencies = Object.entries(CURRENCY_REGIONS).map(([key, region]) => ({
    key,
    label: region.label,
    currencies: region.currencies.filter(c => !favorites.includes(c))
  })).filter(region => region.currencies.length > 0);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Filtrar por divisa
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Sincronizando favoritos...</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

      {/* Favorite currencies section */}
      {favorites.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-yellow-500">
            <Star className="w-3 h-3 fill-yellow-500" />
            <span className="font-medium">Favoritas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites.map(currency => renderCurrencyButton(currency, true))}
          </div>
        </div>
      )}

      {/* Other currencies by region */}
      {nonFavoriteCurrencies.map(region => (
        <div key={region.key} className="space-y-1.5">
          <span className="text-xs text-muted-foreground">{region.label}</span>
          <div className="flex flex-wrap gap-2">
            {region.currencies.map(currency => renderCurrencyButton(currency))}
          </div>
        </div>
      ))}
    </div>
  );
}
