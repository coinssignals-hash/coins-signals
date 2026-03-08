import { useState } from 'react';
import { Currency, CURRENCIES } from '@/types/news';
import { cn } from '@/lib/utils';
import { useFavoriteCurrencies } from '@/hooks/useFavoriteCurrencies';
import { Star, Loader2, ChevronDown, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/LanguageContext';

interface CurrencyFilterProps {
  selected: Currency[];
  onChange: (currencies: Currency[]) => void;
}

// Forex pairs organized by category
const FOREX_PAIRS = {
  majors: {
    label: 'Pares Mayores',
    pairs: [
      { symbol: 'EUR/USD', name: 'Euro / Dólar', flags: '🇪🇺🇺🇸' },
      { symbol: 'GBP/USD', name: 'Libra / Dólar', flags: '🇬🇧🇺🇸' },
      { symbol: 'USD/JPY', name: 'Dólar / Yen', flags: '🇺🇸🇯🇵' },
      { symbol: 'USD/CHF', name: 'Dólar / Franco', flags: '🇺🇸🇨🇭' },
      { symbol: 'AUD/USD', name: 'Aussie / Dólar', flags: '🇦🇺🇺🇸' },
      { symbol: 'USD/CAD', name: 'Dólar / CAD', flags: '🇺🇸🇨🇦' },
      { symbol: 'NZD/USD', name: 'Kiwi / Dólar', flags: '🇳🇿🇺🇸' },
    ]
  },
  euro_crosses: {
    label: 'Cruces Euro',
    pairs: [
      { symbol: 'EUR/GBP', name: 'Euro / Libra', flags: '🇪🇺🇬🇧' },
      { symbol: 'EUR/JPY', name: 'Euro / Yen', flags: '🇪🇺🇯🇵' },
      { symbol: 'EUR/CHF', name: 'Euro / Franco', flags: '🇪🇺🇨🇭' },
      { symbol: 'EUR/AUD', name: 'Euro / Aussie', flags: '🇪🇺🇦🇺' },
      { symbol: 'EUR/CAD', name: 'Euro / CAD', flags: '🇪🇺🇨🇦' },
      { symbol: 'EUR/NZD', name: 'Euro / Kiwi', flags: '🇪🇺🇳🇿' },
      { symbol: 'EUR/SEK', name: 'Euro / Corona Sueca', flags: '🇪🇺🇸🇪' },
      { symbol: 'EUR/NOK', name: 'Euro / Corona Noruega', flags: '🇪🇺🇳🇴' },
    ]
  },
  gbp_crosses: {
    label: 'Cruces Libra',
    pairs: [
      { symbol: 'GBP/JPY', name: 'Libra / Yen', flags: '🇬🇧🇯🇵' },
      { symbol: 'GBP/CHF', name: 'Libra / Franco', flags: '🇬🇧🇨🇭' },
      { symbol: 'GBP/AUD', name: 'Libra / Aussie', flags: '🇬🇧🇦🇺' },
      { symbol: 'GBP/CAD', name: 'Libra / CAD', flags: '🇬🇧🇨🇦' },
      { symbol: 'GBP/NZD', name: 'Libra / Kiwi', flags: '🇬🇧🇳🇿' },
    ]
  },
  jpy_crosses: {
    label: 'Cruces Yen',
    pairs: [
      { symbol: 'AUD/JPY', name: 'Aussie / Yen', flags: '🇦🇺🇯🇵' },
      { symbol: 'CAD/JPY', name: 'CAD / Yen', flags: '🇨🇦🇯🇵' },
      { symbol: 'CHF/JPY', name: 'Franco / Yen', flags: '🇨🇭🇯🇵' },
      { symbol: 'NZD/JPY', name: 'Kiwi / Yen', flags: '🇳🇿🇯🇵' },
    ]
  },
  exotics: {
    label: 'Exóticos',
    pairs: [
      { symbol: 'USD/MXN', name: 'Dólar / Peso MX', flags: '🇺🇸🇲🇽' },
      { symbol: 'USD/BRL', name: 'Dólar / Real', flags: '🇺🇸🇧🇷' },
      { symbol: 'USD/ZAR', name: 'Dólar / Rand', flags: '🇺🇸🇿🇦' },
      { symbol: 'USD/TRY', name: 'Dólar / Lira', flags: '🇺🇸🇹🇷' },
      { symbol: 'USD/PLN', name: 'Dólar / Zloty', flags: '🇺🇸🇵🇱' },
      { symbol: 'USD/SGD', name: 'Dólar / SGD', flags: '🇺🇸🇸🇬' },
      { symbol: 'USD/HKD', name: 'Dólar / HKD', flags: '🇺🇸🇭🇰' },
      { symbol: 'USD/CNH', name: 'Dólar / Yuan', flags: '🇺🇸🇨🇳' },
      { symbol: 'USD/INR', name: 'Dólar / Rupia', flags: '🇺🇸🇮🇳' },
      { symbol: 'USD/THB', name: 'Dólar / Baht', flags: '🇺🇸🇹🇭' },
      { symbol: 'EUR/TRY', name: 'Euro / Lira', flags: '🇪🇺🇹🇷' },
      { symbol: 'EUR/PLN', name: 'Euro / Zloty', flags: '🇪🇺🇵🇱' },
      { symbol: 'EUR/CZK', name: 'Euro / Corona Checa', flags: '🇪🇺🇨🇿' },
      { symbol: 'EUR/HUF', name: 'Euro / Florín', flags: '🇪🇺🇭🇺' },
    ]
  },
  commodity: {
    label: 'Commodities',
    pairs: [
      { symbol: 'AUD/CAD', name: 'Aussie / CAD', flags: '🇦🇺🇨🇦' },
      { symbol: 'AUD/NZD', name: 'Aussie / Kiwi', flags: '🇦🇺🇳🇿' },
      { symbol: 'AUD/CHF', name: 'Aussie / Franco', flags: '🇦🇺🇨🇭' },
      { symbol: 'CAD/CHF', name: 'CAD / Franco', flags: '🇨🇦🇨🇭' },
      { symbol: 'NZD/CAD', name: 'Kiwi / CAD', flags: '🇳🇿🇨🇦' },
      { symbol: 'NZD/CHF', name: 'Kiwi / Franco', flags: '🇳🇿🇨🇭' },
    ]
  },
};

// Crypto pairs
const CRYPTO_PAIRS = {
  major_crypto: {
    label: 'Principales',
    pairs: [
      { symbol: 'BTC/USD', name: 'Bitcoin', icon: '₿' },
      { symbol: 'ETH/USD', name: 'Ethereum', icon: 'Ξ' },
      { symbol: 'BNB/USD', name: 'Binance Coin', icon: '🔶' },
      { symbol: 'XRP/USD', name: 'Ripple', icon: '💧' },
      { symbol: 'SOL/USD', name: 'Solana', icon: '◎' },
      { symbol: 'ADA/USD', name: 'Cardano', icon: '🔷' },
      { symbol: 'DOGE/USD', name: 'Dogecoin', icon: '🐕' },
      { symbol: 'DOT/USD', name: 'Polkadot', icon: '⚫' },
      { symbol: 'AVAX/USD', name: 'Avalanche', icon: '🔺' },
      { symbol: 'MATIC/USD', name: 'Polygon', icon: '🟣' },
    ]
  },
  defi: {
    label: 'DeFi',
    pairs: [
      { symbol: 'LINK/USD', name: 'Chainlink', icon: '🔗' },
      { symbol: 'UNI/USD', name: 'Uniswap', icon: '🦄' },
      { symbol: 'AAVE/USD', name: 'Aave', icon: '👻' },
      { symbol: 'MKR/USD', name: 'Maker', icon: '🏛️' },
      { symbol: 'CRV/USD', name: 'Curve', icon: '📈' },
      { symbol: 'SNX/USD', name: 'Synthetix', icon: '⚡' },
      { symbol: 'COMP/USD', name: 'Compound', icon: '🏦' },
      { symbol: 'SUSHI/USD', name: 'SushiSwap', icon: '🍣' },
    ]
  },
  layer2: {
    label: 'Layer 2',
    pairs: [
      { symbol: 'ARB/USD', name: 'Arbitrum', icon: '🔵' },
      { symbol: 'OP/USD', name: 'Optimism', icon: '🔴' },
      { symbol: 'IMX/USD', name: 'Immutable X', icon: '⬛' },
      { symbol: 'LRC/USD', name: 'Loopring', icon: '🔄' },
    ]
  },
  memecoins: {
    label: 'Memecoins',
    pairs: [
      { symbol: 'SHIB/USD', name: 'Shiba Inu', icon: '🐶' },
      { symbol: 'PEPE/USD', name: 'Pepe', icon: '🐸' },
      { symbol: 'FLOKI/USD', name: 'Floki', icon: '🐕‍🦺' },
      { symbol: 'BONK/USD', name: 'Bonk', icon: '🦴' },
      { symbol: 'WIF/USD', name: 'Dogwifhat', icon: '🎩' },
    ]
  },
  stablecoins: {
    label: 'Stablecoins',
    pairs: [
      { symbol: 'USDT/USD', name: 'Tether', icon: '💵' },
      { symbol: 'USDC/USD', name: 'USD Coin', icon: '💲' },
      { symbol: 'DAI/USD', name: 'DAI', icon: '🟡' },
      { symbol: 'BUSD/USD', name: 'Binance USD', icon: '🟠' },
    ]
  },
  btc_pairs: {
    label: 'Pares BTC',
    pairs: [
      { symbol: 'ETH/BTC', name: 'Ethereum', icon: 'Ξ' },
      { symbol: 'BNB/BTC', name: 'Binance Coin', icon: '🔶' },
      { symbol: 'XRP/BTC', name: 'Ripple', icon: '💧' },
      { symbol: 'SOL/BTC', name: 'Solana', icon: '◎' },
      { symbol: 'ADA/BTC', name: 'Cardano', icon: '🔷' },
      { symbol: 'DOGE/BTC', name: 'Dogecoin', icon: '🐕' },
    ]
  },
};

// Currency regions for individual currencies
const CURRENCY_REGIONS = {
  major: { label: 'Principales', currencies: ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'] as Currency[] },
  europe: { label: 'Europa', currencies: ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'TRY', 'RUB'] as Currency[] },
  asia: { label: 'Asia-Pacífico', currencies: ['CNY', 'HKD', 'SGD', 'KRW', 'INR', 'THB', 'MYR', 'IDR', 'PHP'] as Currency[] },
  americas: { label: 'Américas', currencies: ['MXN', 'BRL'] as Currency[] },
  middle_east: { label: 'Medio Oriente', currencies: ['AED', 'SAR', 'ILS'] as Currency[] },
  africa: { label: 'África', currencies: ['ZAR'] as Currency[] },
};

type SymbolTab = 'currencies' | 'forex' | 'crypto';

export function CurrencyFilter({ selected, onChange }: CurrencyFilterProps) {
  const { t } = useTranslation();
  const { favorites, toggleFavorite, isFavorite, loading } = useFavoriteCurrencies();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SymbolTab>('currencies');

  const toggleCurrency = (currency: Currency) => {
    if (selected.includes(currency)) {
      onChange(selected.filter((c) => c !== currency));
    } else {
      onChange([...selected, currency]);
    }
  };

  const clearAll = () => onChange([]);

  // Filter by search query
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

  const filterForexBySearch = (pairs: typeof FOREX_PAIRS.majors.pairs) => {
    if (!searchQuery.trim()) return pairs;
    const query = searchQuery.toLowerCase();
    return pairs.filter(pair =>
      pair.symbol.toLowerCase().includes(query) ||
      pair.name.toLowerCase().includes(query)
    );
  };

  const filterCryptoBySearch = (pairs: typeof CRYPTO_PAIRS.major_crypto.pairs) => {
    if (!searchQuery.trim()) return pairs;
    const query = searchQuery.toLowerCase();
    return pairs.filter(pair =>
      pair.symbol.toLowerCase().includes(query) ||
      pair.name.toLowerCase().includes(query)
    );
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
          title={isFav ? t('cf_remove_fav') : t('cf_add_fav')}
        >
          <Star className={cn('w-3 h-3', isFav ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground')} />
        </button>
      </div>
    );
  };

  const renderForexPairButton = (pair: { symbol: string; name: string; flags: string }) => (
    <button
      key={pair.symbol}
      onClick={() => {
        // Can be extended to select forex pairs
        console.log('Selected forex pair:', pair.symbol);
      }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
        'border border-border bg-card hover:border-primary/50 hover:bg-accent'
      )}
    >
      <span className="text-base">{pair.flags}</span>
      <div className="text-left">
        <div className="font-mono font-medium text-foreground">{pair.symbol}</div>
        <div className="text-xs text-muted-foreground">{pair.name}</div>
      </div>
    </button>
  );

  const renderCryptoPairButton = (pair: { symbol: string; name: string; icon: string }) => (
    <button
      key={pair.symbol}
      onClick={() => {
        console.log('Selected crypto pair:', pair.symbol);
      }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
        'border border-border bg-card hover:border-primary/50 hover:bg-accent'
      )}
    >
      <span className="text-lg">{pair.icon}</span>
      <div className="text-left">
        <div className="font-mono font-medium text-foreground">{pair.symbol}</div>
        <div className="text-xs text-muted-foreground">{pair.name}</div>
      </div>
    </button>
  );

  // Get non-favorite currencies grouped by region (filtered by search)
  const filteredFavorites = filterBySearch(favorites);
  const nonFavoriteCurrencies = Object.entries(CURRENCY_REGIONS).map(([key, region]) => ({
    key,
    label: region.label,
    currencies: filterBySearch(region.currencies.filter(c => !favorites.includes(c)))
  })).filter(region => region.currencies.length > 0);

  // Filtered forex pairs
  const filteredForexPairs = Object.entries(FOREX_PAIRS).map(([key, category]) => ({
    key,
    label: category.label,
    pairs: filterForexBySearch(category.pairs)
  })).filter(category => category.pairs.length > 0);

  // Filtered crypto pairs
  const filteredCryptoPairs = Object.entries(CRYPTO_PAIRS).map(([key, category]) => ({
    key,
    label: category.label,
    pairs: filterCryptoBySearch(category.pairs)
  })).filter(category => category.pairs.length > 0);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>{t('cf_syncing')}</span>
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
                <span className="text-sm text-muted-foreground">+{selected.length - 3} {t('cf_more')}</span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t('cf_search_placeholder')}</span>
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
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SymbolTab)} className="w-full">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-muted/30">
              <TabsTrigger value="currencies" className="text-xs">💱 {t('cf_currencies')}</TabsTrigger>
              <TabsTrigger value="forex" className="text-xs">📊 Forex</TabsTrigger>
              <TabsTrigger value="crypto" className="text-xs">₿ Crypto</TabsTrigger>
            </TabsList>

            {/* Search input */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={
                    activeTab === 'currencies' ? t('cf_search_currency') :
                    activeTab === 'forex' ? t('cf_search_forex') :
                    t('cf_search_crypto')
                  }
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

            {/* Currencies Tab */}
            <TabsContent value="currencies" className="m-0">
              <div className="max-h-80 overflow-y-auto p-3 space-y-4">
                {filteredFavorites.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                      <Star className="w-3 h-3 fill-yellow-500" />
                      <span className="font-medium">{t('cf_favorites')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredFavorites.map(currency => renderCurrencyButton(currency, true))}
                    </div>
                  </div>
                )}
                {nonFavoriteCurrencies.map(region => (
                  <div key={region.key} className="space-y-1.5">
                    <span className="text-xs text-muted-foreground font-medium">{region.label}</span>
                    <div className="flex flex-wrap gap-2">
                      {region.currencies.map(currency => renderCurrencyButton(currency))}
                    </div>
                  </div>
                ))}
                {filteredFavorites.length === 0 && nonFavoriteCurrencies.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {t('cf_no_currencies')} "{searchQuery}"
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Forex Tab */}
            <TabsContent value="forex" className="m-0">
              <div className="max-h-80 overflow-y-auto p-3 space-y-4">
                {filteredForexPairs.map(category => (
                  <div key={category.key} className="space-y-2">
                    <span className="text-xs text-muted-foreground font-medium">{category.label}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {category.pairs.map(pair => renderForexPairButton(pair))}
                    </div>
                  </div>
                ))}
                {filteredForexPairs.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {t('cf_no_forex')} "{searchQuery}"
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Crypto Tab */}
            <TabsContent value="crypto" className="m-0">
              <div className="max-h-80 overflow-y-auto p-3 space-y-4">
                {filteredCryptoPairs.map(category => (
                  <div key={category.key} className="space-y-2">
                    <span className="text-xs text-muted-foreground font-medium">{category.label}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {category.pairs.map(pair => renderCryptoPairButton(pair))}
                    </div>
                  </div>
                ))}
                {filteredCryptoPairs.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No se encontraron criptomonedas para "{searchQuery}"
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {activeTab === 'currencies' && `${selected.length} divisa${selected.length !== 1 ? 's' : ''}`}
              {activeTab === 'forex' && `${Object.values(FOREX_PAIRS).reduce((a, c) => a + c.pairs.length, 0)} pares Forex`}
              {activeTab === 'crypto' && `${Object.values(CRYPTO_PAIRS).reduce((a, c) => a + c.pairs.length, 0)} criptos`}
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
