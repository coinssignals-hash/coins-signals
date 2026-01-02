import { useState } from 'react';
import { Currency, CURRENCIES } from '@/types/news';
import { cn } from '@/lib/utils';
import { useFavoriteCurrencies } from '@/hooks/useFavoriteCurrencies';
import { Star, Loader2, ChevronDown, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCurrency = (currency: Currency) => {
    if (selected.includes(currency)) {
      onChange(selected.filter((c) => c !== currency));
    } else {
      onChange([...selected, currency]);
    }
  };

  const clearAll = () => onChange([]);

  // Filter currencies by search query
  const filterBySearch = (currencies: Currency[]) => {
    if (!searchQuery.trim()) return currencies;
    const query = searchQuery.toLowerCase();
    return currencies.filter(currency => {
      const info = CURRENCIES[currency];
      return (
        currency.toLowerCase().includes(query) ||
        info.name.toLowerCase().includes(query)
      );
    });
  };

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

  // Get non-favorite currencies grouped by region (filtered by search)
  const filteredFavorites = filterBySearch(favorites);
  const nonFavoriteCurrencies = Object.entries(CURRENCY_REGIONS).map(([key, region]) => ({
    key,
    label: region.label,
    currencies: filterBySearch(region.currencies.filter(c => !favorites.includes(c)))
  })).filter(region => region.currencies.length > 0);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Sincronizando favoritos...</span>
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 rounded-lg',
          'bg-card border border-border text-foreground',
          'hover:border-primary/50 transition-all',
          isOpen && 'border-primary ring-1 ring-primary/20'
        )}
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          {selected.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {selected.slice(0, 3).map(currency => (
                <span key={currency} className="flex items-center gap-1 text-sm">
                  <span>{CURRENCIES[currency].flag}</span>
                  <span className="font-medium">{currency}</span>
                </span>
              ))}
              {selected.length > 3 && (
                <span className="text-sm text-muted-foreground">+{selected.length - 3} más</span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Seleccionar divisas...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {/* Search input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar divisa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Currency list */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-4">
            {/* Favorite currencies section */}
            {filteredFavorites.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                  <Star className="w-3 h-3 fill-yellow-500" />
                  <span className="font-medium">Favoritas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredFavorites.map(currency => renderCurrencyButton(currency, true))}
                </div>
              </div>
            )}

            {/* Other currencies by region */}
            {nonFavoriteCurrencies.map(region => (
              <div key={region.key} className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">{region.label}</span>
                <div className="flex flex-wrap gap-2">
                  {region.currencies.map(currency => renderCurrencyButton(currency))}
                </div>
              </div>
            ))}

            {/* No results */}
            {filteredFavorites.length === 0 && nonFavoriteCurrencies.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No se encontraron divisas para "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer with count */}
          <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selected.length} divisa{selected.length !== 1 ? 's' : ''} seleccionada{selected.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
