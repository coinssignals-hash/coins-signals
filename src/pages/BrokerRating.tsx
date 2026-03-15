import { useState, useRef } from 'react';
import { motion, useTransform, useMotionValue } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Search, TrendingUp, BarChart3, Gem, Bitcoin, Star, Check, X, ChevronDown, ChevronUp, GitCompare, CheckCircle2, XCircle, ArrowUpDown, Landmark, CandlestickChart, Loader2, Building2, Coins, ShieldCheck, Globe, MessageSquare, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { useBrokerData, BROKER_REGIONS, NormalizedBroker, useGlobalBrokerSearch, useRegionCounts } from '@/hooks/useBrokerData';
import { getBrokerLogo } from '@/lib/brokerLogos';
import { LazyImage } from '@/components/ui/lazy-image';

const CATEGORY_COLORS: Record<string, string> = {
  forex: 'hsl(200, 90%, 50%)',
  stocks: 'hsl(270, 70%, 55%)',
  commodities: 'hsl(45, 90%, 55%)',
  futures: 'hsl(160, 70%, 50%)',
  crypto: 'hsl(25, 90%, 55%)',
};

const getCategoriesTranslated = (t: (key: string) => string) => [
  { icon: CandlestickChart, label: t('broker_cat_forex'), sublabel: t('broker_cat_forex_sub'), colorKey: 'forex', matchKey: 'forex' },
  { icon: BarChart3, label: t('broker_cat_stocks'), sublabel: t('broker_cat_stocks_sub'), colorKey: 'stocks', matchKey: 'acciones' },
  { icon: Gem, label: t('broker_cat_commodities'), sublabel: t('broker_cat_commodities_sub'), colorKey: 'commodities', matchKey: 'materias' },
  { icon: TrendingUp, label: t('broker_cat_futures'), sublabel: t('broker_cat_futures_sub'), colorKey: 'futures', matchKey: 'futuros' },
  { icon: Bitcoin, label: t('broker_cat_crypto'), sublabel: '', colorKey: 'crypto', matchKey: 'crypto' },
];

type SortOption = 'rating' | 'deposit' | 'spreads';

const REGION_METADATA: Record<string, { flag: string; country: string; regulator: string; exchange: string; currency: string; note: string }> = {
  eu: { flag: '🇪🇺', country: 'Europa', regulator: 'ESMA / FCA / BaFin', exchange: 'Euronext / LSE / XETRA', currency: 'EUR / GBP', note: 'Regulación unificada MiFID II' },
  us: { flag: '🇺🇸', country: 'USA / Canadá', regulator: 'SEC / FINRA / IIROC', exchange: 'NYSE / NASDAQ / TSX', currency: 'USD / CAD', note: 'Mercado más líquido del mundo' },
  mx: { flag: '🇲🇽', country: 'México', regulator: 'CNBV', exchange: 'BMV', currency: 'MXN', note: 'Forex no regulado localmente' },
  co: { flag: '🇨🇴', country: 'Colombia', regulator: 'SFC', exchange: 'BVC', currency: 'COP', note: 'Mercado en crecimiento' },
  ar: { flag: '🇦🇷', country: 'Argentina', regulator: 'CNV', exchange: 'BCBA / BYMA', currency: 'ARS', note: 'Control cambiario vigente' },
  br: { flag: '🇧🇷', country: 'Brasil', regulator: 'CVM', exchange: 'B3', currency: 'BRL', note: 'Mayor mercado de LATAM' },
  cl: { flag: '🇨🇱', country: 'Chile', regulator: 'CMF', exchange: 'Bolsa de Santiago', currency: 'CLP', note: 'Mercado estable y regulado' },
  pe: { flag: '🇵🇪', country: 'Perú', regulator: 'SMV', exchange: 'BVL', currency: 'PEN', note: 'Economía dolarizada parcial' },
  ec: { flag: '🇪🇨', country: 'Ecuador', regulator: 'Supercias', exchange: 'BVQ / BVG', currency: 'USD', note: 'Economía dolarizada' },
  cr: { flag: '🇨🇷', country: 'Costa Rica', regulator: 'SUGEVAL', exchange: 'BNV', currency: 'CRC', note: 'Sistema financiero estable' },
  pa: { flag: '🇵🇦', country: 'Panamá', regulator: 'SMV', exchange: 'BVP', currency: 'USD / PAB', note: 'Centro financiero regional' },
  sv: { flag: '🇸🇻', country: 'El Salvador', regulator: 'SSF', exchange: 'BVES', currency: 'USD', note: 'Economía dolarizada' },
  ni: { flag: '🇳🇮', country: 'Nicaragua', regulator: 'SIBOIF', exchange: 'BVDN', currency: 'NIO', note: 'Mercado emergente' },
  ve: { flag: '🇻🇪', country: 'Venezuela', regulator: 'SUNAVAL', exchange: 'BVC', currency: 'VES', note: 'Restricciones cambiarias' },
  uy: { flag: '🇺🇾', country: 'Uruguay', regulator: 'BCU', exchange: 'BVM', currency: 'UYU', note: 'Plaza financiera estable' },
};

const parseNumeric = (val: string): number => {
  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

export default function BrokerRating() {
  const { t } = useTranslation();
  const categories = getCategoriesTranslated(t);
  const [selectedRegion, setSelectedRegion] = useState('intl');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<NormalizedBroker | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [brokersToCompare, setBrokersToCompare] = useState<NormalizedBroker[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption | ''>('');

  const { brokers, loading, error } = useBrokerData(selectedRegion);
  const { results: globalResults, loading: globalLoading } = useGlobalBrokerSearch(isGlobalSearch ? globalSearchTerm : '');
  const regionCounts = useRegionCounts();

  // Parallax
  const scrollY = useMotionValue(0);
  const heroParallaxY = useTransform(scrollY, [0, 200], [0, -30]);
  const bgParallaxY = useTransform(scrollY, [0, 200], [0, -50]);
  const bgScale = useTransform(scrollY, [0, 200], [1, 1.15]);
  const logoParallaxY = useTransform(scrollY, [0, 200], [0, -8]);

  const toggleBrokerCompare = (broker: NormalizedBroker) => {
    if (brokersToCompare.some(b => b.id === broker.id)) {
      setBrokersToCompare(prev => prev.filter(b => b.id !== broker.id));
    } else {
      if (brokersToCompare.length >= 4) {
        toast.error(t('broker_max_compare'));
        return;
      }
      setBrokersToCompare(prev => [...prev, broker]);
    }
  };

  const removeBrokerFromCompare = (brokerId: string) => {
    setBrokersToCompare(prev => prev.filter(b => b.id !== brokerId));
  };

  const handleCompare = () => {
    if (brokersToCompare.length < 2) {
      toast.error(t('broker_min_compare'));
      return;
    }
    setShowComparePanel(true);
  };

  const filteredBrokers = brokers
    .filter(broker => {
      const matchesSearch = broker.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || broker.instruments.some(i =>
        i.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (!sortBy) return b.rating - a.rating;
      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'deposit': return parseNumeric(a.depositMin) - parseNumeric(b.depositMin);
        case 'spreads': return parseNumeric(a.spreads) - parseNumeric(b.spreads);
        default: return 0;
      }
    });

  const currentRegion = BROKER_REGIONS.find(r => r.key === selectedRegion);

  return (
    <PageShell>
      <Header />
      <main className="py-4 px-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-primary">{t('broker_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('broker_subtitle')}</p>
          </div>
        </div>

        {/* Region Selector */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl leading-none">{currentRegion?.label.split(' ')[0]}</span>
          <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setSearchTerm(''); setSelectedCategory(null); }}>
            <SelectTrigger className="flex-1 bg-secondary border-border h-10">
              <SelectValue>
                {currentRegion?.label.split(' ').slice(1).join(' ') || 'Seleccionar región'}
                {regionCounts[selectedRegion] != null && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground">({regionCounts[selectedRegion]})</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {BROKER_REGIONS.map((region) => {
                const flag = region.label.split(' ')[0];
                const name = region.label.split(' ').slice(1).join(' ');
                const count = regionCounts[region.key];
                return (
                  <SelectItem key={region.key} value={region.key} className="py-2.5 pl-9 pr-3">
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl leading-none shrink-0">{flag}</span>
                      <span className="flex-1 font-medium">{name}</span>
                      {count != null && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-2 py-0.5 font-bold">{count}</Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Region metadata header */}
        {selectedRegion !== 'intl' && REGION_METADATA[selectedRegion] && (() => {
          const meta = REGION_METADATA[selectedRegion];
          return (
            <motion.div
              key={selectedRegion}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-4 rounded-xl border border-border/60 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.8), hsl(var(--secondary) / 0.4))' }}
            >
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">{meta.flag}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{meta.country}</h3>
                  <p className="text-[10px] text-muted-foreground leading-tight">{meta.note}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-px bg-border/40">
                <div className="bg-card px-3 py-2.5 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Regulador</span>
                    <span className="text-[10px] font-semibold text-foreground truncate block">{meta.regulator}</span>
                  </div>
                </div>
                <div className="bg-card px-3 py-2.5 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Bolsa</span>
                    <span className="text-[10px] font-semibold text-foreground truncate block">{meta.exchange}</span>
                  </div>
                </div>
                <div className="bg-card px-3 py-2.5 flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Moneda</span>
                    <span className="text-[10px] font-semibold text-foreground truncate block">{meta.currency}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">{t('broker_search')}</h2>
              <button
                onClick={() => { setIsGlobalSearch(!isGlobalSearch); setGlobalSearchTerm(''); setSearchTerm(''); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  isGlobalSearch
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <Globe className="w-3 h-3" />
                {isGlobalSearch ? 'Global ON' : 'Buscar global'}
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {isGlobalSearch ? (
                <Input
                  placeholder="Buscar en todas las regiones..."
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary border-primary/30 ring-1 ring-primary/20"
                  autoFocus
                />
              ) : (
                <Input
                  placeholder={t('broker_search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.matchKey;
                const color = CATEGORY_COLORS[cat.colorKey] || 'hsl(200, 90%, 50%)';
                return (
                  <button
                    key={cat.matchKey}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.matchKey)}
                    className="flex flex-col items-center gap-1.5 min-w-[64px] py-2.5 px-2 rounded-xl transition-all duration-200 active:scale-95"
                    style={isSelected ? {
                      background: `linear-gradient(180deg, ${color}18, ${color}08)`,
                      border: `1px solid ${color}40`,
                      boxShadow: `0 4px 12px -4px ${color}30`,
                    } : {
                      background: 'hsl(var(--secondary))',
                      border: '1px solid transparent',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={isSelected ? {
                        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                        boxShadow: `0 0 10px -3px ${color}40`,
                      } : {
                        background: 'hsl(var(--muted))',
                      }}
                    >
                      <Icon size={20} strokeWidth={1.8} className="transition-colors flex-shrink-0"
                        style={{ color: isSelected ? color : 'hsl(var(--muted-foreground))', width: 20, height: 20 }} />
                    </div>
                    <span className={`text-[10px] font-bold text-center leading-tight ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Global search results or regional view */}
        {isGlobalSearch && globalSearchTerm.length >= 2 ? (
          <>
            <div className="flex items-center justify-between mb-4 gap-2">
              <p className="text-xs text-muted-foreground flex-1">
                {globalLoading ? 'Buscando en todas las regiones...' : `${globalResults.length} resultados globales`}
              </p>
            </div>
            {globalLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
            {!globalLoading && globalResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No se encontraron brokers para "{globalSearchTerm}"</p>
              </div>
            )}
            {!globalLoading && globalResults.length > 0 && (
              <div className="space-y-3">
                {globalResults.map((broker) => (
                  <Card
                    key={broker.id}
                    className="overflow-hidden transition-all active:scale-[0.99]"
                    onClick={() => setSelectedBroker(broker)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-3 pb-2">
                        <div className="w-11 h-11 bg-secondary rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-lg">
                          {getBrokerLogo(broker.name) ? (
                            <LazyImage src={getBrokerLogo(broker.name)} alt={broker.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            broker.countryFlag
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate">{broker.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Globe className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-[10px] text-primary font-medium truncate">{broker.regionLabel}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-bold text-foreground">{broker.rating}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">/5.0</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-border/50 mx-3 rounded-lg overflow-hidden mb-2">
                        <div className="bg-card p-2 text-center">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_initial_deposit')}</span>
                          <span className="text-xs font-semibold text-accent">{broker.depositMin}</span>
                        </div>
                        <div className="bg-card p-2 text-center">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_spreads')}</span>
                          <span className="text-[10px] font-semibold text-accent truncate block">{broker.spreads || 'Variable'}</span>
                        </div>
                        <div className="bg-card p-2 text-center">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_leverage')}</span>
                          <span className="text-[10px] font-semibold text-accent truncate block">{broker.leverage || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="px-3 pb-2">
                        <div className="flex flex-wrap gap-1">
                          {broker.regulations.slice(0, 2).map(r => (
                            <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{r.split(' (')[0]}</span>
                          ))}
                          {broker.instruments.slice(0, 2).map(i => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">{i}</span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
        <>
        <div className="flex items-center justify-between mb-4 gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            {loading ? t('broker_loading') || 'Cargando...' : `${filteredBrokers.length} brokers · ${currentRegion?.label || ''}`}
          </p>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption | '')}>
              <SelectTrigger className="w-[130px] bg-secondary text-xs h-8">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue placeholder={t('broker_sort_placeholder')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="rating">{t('broker_sort_rating')}</SelectItem>
                <SelectItem value="deposit">{t('broker_sort_deposit')}</SelectItem>
                <SelectItem value="spreads">{t('broker_sort_spreads')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setCompareMode(!compareMode); if (compareMode) setBrokersToCompare([]); }}
              className="text-xs"
            >
              <GitCompare className="w-4 h-4 mr-1" />
              {compareMode ? t('broker_cancel') : t('broker_compare')}
            </Button>
          </div>
        </div>

        {compareMode && (
          <Card className="mb-4 border-primary/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-foreground">
                    {t('broker_selected').replace('{count}', String(brokersToCompare.length))}
                  </span>
                  {brokersToCompare.map(b => (
                    <Badge key={b.id} variant="secondary" className="text-xs">
                      {b.name}
                      <button onClick={() => removeBrokerFromCompare(b.id)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button size="sm" onClick={handleCompare} disabled={brokersToCompare.length < 2} className="bg-primary hover:bg-primary/90">
                  {t('broker_compare')} ({brokersToCompare.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-destructive">
            <p className="text-sm">Error: {error}</p>
          </div>
        )}

        {/* Broker Cards */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredBrokers.map((broker) => {
              const isSelectedForCompare = brokersToCompare.some(b => b.id === broker.id);
              return (
                <Card
                  key={broker.id}
                  className={`overflow-hidden transition-all active:scale-[0.99] ${isSelectedForCompare ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => !compareMode && setSelectedBroker(broker)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-3 pb-2">
                      {compareMode && (
                        <Checkbox
                          checked={isSelectedForCompare}
                          onCheckedChange={() => toggleBrokerCompare(broker)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-primary data-[state=checked]:bg-primary"
                        />
                      )}
                      <div className="w-11 h-11 bg-secondary rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-lg">
                        {getBrokerLogo(broker.name) ? (
                          <LazyImage src={getBrokerLogo(broker.name)} alt={broker.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          broker.countryFlag
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{broker.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Landmark className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-[10px] text-muted-foreground truncate">{broker.central}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-foreground">{broker.rating}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">/5.0</span>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-px bg-border/50 mx-3 rounded-lg overflow-hidden mb-2">
                      <div className="bg-card p-2 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_initial_deposit')}</span>
                        <span className="text-xs font-semibold text-accent">{broker.depositMin}</span>
                      </div>
                      <div className="bg-card p-2 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_spreads')}</span>
                        <span className="text-[10px] font-semibold text-accent truncate block">{broker.spreads || 'Variable'}</span>
                      </div>
                      <div className="bg-card p-2 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_leverage')}</span>
                        <span className="text-[10px] font-semibold text-accent truncate block">{broker.leverage || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="px-3 pb-2">
                      <div className="flex flex-wrap gap-1">
                        {broker.regulations.slice(0, 3).map(r => (
                          <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{r.split(' (')[0]}</span>
                        ))}
                        {broker.instruments.slice(0, 3).map(i => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">{i}</span>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-secondary/30">
                      <span className="text-[10px] text-muted-foreground truncate max-w-[55%]">{broker.type}</span>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {compareMode && (
                          <Button size="sm" variant={isSelectedForCompare ? "secondary" : "outline"} className="text-[10px] h-7 px-2" onClick={() => toggleBrokerCompare(broker)}>
                            {isSelectedForCompare ? t('broker_remove') : t('broker_add')}
                          </Button>
                        )}
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-[10px] h-7 px-3" onClick={() => setSelectedBroker(broker)}>
                          {t('broker_view_details')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredBrokers.length === 0 && !isGlobalSearch && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t('bk_no_brokers_found')}</p>
          </div>
        )}
        </>
        )}
      </main>

      {/* Compare Panel Dialog */}
      <Dialog open={showComparePanel} onOpenChange={setShowComparePanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-bold text-foreground">
                  {t('broker_compare_title')} ({brokersToCompare.length})
                </DialogTitle>
              </DialogHeader>
              <div className="min-w-max">
                <div className="flex border-b border-border">
                  <div className="w-32 shrink-0 p-3 bg-secondary/50">
                    <span className="text-sm font-medium text-muted-foreground">{t('broker_feature')}</span>
                  </div>
                  {brokersToCompare.map((broker) => (
                    <div key={broker.id} className="w-48 shrink-0 p-3 bg-card border-l border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{broker.name}</h3>
                          <span className="text-xs text-primary">{broker.countryFlag} {broker.country}</span>
                        </div>
                        <button onClick={() => removeBrokerFromCompare(broker.id)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {[
                  { label: t('broker_initial_deposit'), render: (b: NormalizedBroker) => b.depositMin },
                  { label: t('broker_spreads'), render: (b: NormalizedBroker) => b.spreads || 'Variable' },
                  { label: t('broker_leverage'), render: (b: NormalizedBroker) => b.leverage || 'N/A' },
                  { label: t('broker_regulations'), render: (b: NormalizedBroker) => b.regulations.slice(0, 4).join(', ') },
                  { label: t('broker_instruments'), render: (b: NormalizedBroker) => b.instruments.join(', ') },
                  { label: t('broker_platform'), render: (b: NormalizedBroker) => b.platform.join(', ') },
                  { label: t('broker_headquarters'), render: (b: NormalizedBroker) => b.central },
                  { label: 'Rating', render: (b: NormalizedBroker) => (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${star <= Math.floor(b.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                      ))}
                      <span className="ml-1">{b.rating}</span>
                    </div>
                  )},
                ].map((row, idx) => (
                  <div key={row.label} className={`flex border-b border-border ${idx % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                    <div className="w-32 shrink-0 p-3"><span className="text-sm font-medium text-primary">{row.label}</span></div>
                    {brokersToCompare.map((broker) => (
                      <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                        <span className="text-sm text-foreground">{row.render(broker)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex border-b border-border bg-secondary/20">
                  <div className="w-32 shrink-0 p-3"><span className="text-sm font-medium text-primary">{t('broker_pro')}</span></div>
                  {brokersToCompare.map((broker) => (
                    <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                      <ul className="space-y-1">
                        {broker.pros.slice(0, 3).map((pro, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                            <span className="text-foreground">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="flex border-b border-border">
                  <div className="w-32 shrink-0 p-3"><span className="text-sm font-medium text-destructive">{t('broker_cons')}</span></div>
                  {brokersToCompare.map((broker) => (
                    <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                      <ul className="space-y-1">
                        {broker.cons.slice(0, 2).map((con, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs">
                            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                            <span className="text-foreground">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Broker Detail Dialog */}
      <Dialog open={!!selectedBroker} onOpenChange={() => setSelectedBroker(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] p-0 bg-card border-border">
          <ScrollArea className="max-h-[90vh]" onScrollCapture={(e) => {
            const target = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]');
            if (target) scrollY.set((target as HTMLElement).scrollTop);
          }}>
            {selectedBroker && (
              <div className="pb-6">
                {/* Hero header with parallax */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ background: 'linear-gradient(180deg, hsl(var(--primary) / 0.12) 0%, transparent 100%)', translateY: heroParallaxY }}
                  className="relative px-5 pt-6 pb-4 overflow-hidden"
                >
                  <motion.div className="absolute inset-0 opacity-[0.07]" style={{
                    backgroundImage: 'radial-gradient(circle at 70% 30%, hsl(var(--primary)) 0%, transparent 60%)',
                    translateY: bgParallaxY, scale: bgScale,
                  }} />
                  <div className="relative z-10 flex items-center gap-4">
                    <motion.div
                      className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center overflow-hidden p-2 shadow-md shrink-0 text-2xl"
                      style={{ translateY: logoParallaxY }}
                    >
                      {getBrokerLogo(selectedBroker.name) ? (
                        <img src={getBrokerLogo(selectedBroker.name)} alt={selectedBroker.name} className="w-full h-full object-contain" />
                      ) : (
                        selectedBroker.countryFlag
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <DialogHeader className="space-y-0">
                        <DialogTitle className="text-xl font-bold text-foreground">{selectedBroker.name}</DialogTitle>
                      </DialogHeader>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-foreground">{selectedBroker.rating}/5</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Landmark className="w-3 h-3" />
                        {selectedBroker.central}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Type badge */}
                {selectedBroker.type && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="px-5 mb-3">
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">{selectedBroker.type}</Badge>
                  </motion.div>
                )}

                {/* Description */}
                {selectedBroker.description && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }} className="px-5 mb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedBroker.description}</p>
                  </motion.div>
                )}

                {/* Key stats grid */}
                <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, delay: 0.15 }}
                  className="grid grid-cols-3 gap-px bg-border/50 mx-5 rounded-xl overflow-hidden mb-4">
                  <div className="bg-card p-2.5 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_deposit')}</span>
                    <span className="text-xs font-bold text-accent">{selectedBroker.depositMin}</span>
                  </div>
                  <div className="bg-card p-2.5 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_spreads')}</span>
                    <span className="text-[10px] font-bold text-accent">{selectedBroker.spreads || 'Variable'}</span>
                  </div>
                  <div className="bg-card p-2.5 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_leverage')}</span>
                    <span className="text-[10px] font-bold text-accent">{selectedBroker.leverage || 'N/A'}</span>
                  </div>
                </motion.div>

                {/* Pros & Cons */}
                {(selectedBroker.pros.length > 0 || selectedBroker.cons.length > 0) && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.22 }} className="px-5 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {selectedBroker.pros.length > 0 && (
                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                          <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('broker_pro')}
                          </h4>
                          <ul className="space-y-1.5">
                            {selectedBroker.pros.map((pro, i) => (
                              <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                                <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedBroker.cons.length > 0 && (
                        <div className="bg-destructive/5 rounded-xl p-3 border border-destructive/10">
                          <h4 className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> {t('broker_cons')}
                          </h4>
                          <ul className="space-y-1.5">
                            {selectedBroker.cons.map((con, i) => (
                              <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                                <X className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Regulations */}
                {selectedBroker.allRegulations.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.29 }} className="px-5 mb-4">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_regulatory_bodies')}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBroker.allRegulations.map((reg, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-secondary text-foreground font-medium" title={reg.desc}>
                          {reg.name}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Instruments */}
                {selectedBroker.instrumentTypes.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }} className="px-5 mb-4">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_available_instruments')}</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedBroker.instrumentTypes.map((inst, i) => (
                        <div key={i} className="bg-secondary/50 rounded-lg p-2">
                          <span className="text-[10px] font-semibold text-primary block">{inst.name}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-2">{inst.desc}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Platforms */}
                {selectedBroker.platforms.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="px-5 mb-4">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_trading_platforms')}</h4>
                    <div className="space-y-1.5">
                      {selectedBroker.platforms.map((plat, i) => (
                        <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-medium text-foreground block">{plat.name}</span>
                            {plat.desc && <span className="text-[10px] text-muted-foreground">{plat.desc}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Account Types */}
                {selectedBroker.accountTypes.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.45 }} className="px-5 mb-4">
                    <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_account_types')}</h4>
                    <div className="space-y-1.5">
                      {selectedBroker.accountTypes.map((acc, i) => (
                        <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-medium text-foreground block">{acc.name}</span>
                            {acc.desc && <span className="text-[10px] text-muted-foreground">{acc.desc}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Region info */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="px-5 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-lg p-2.5">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_main_region')}</span>
                      <span className="text-[11px] font-medium text-foreground line-clamp-2">{selectedBroker.mainRegion}</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-2.5">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_operating_countries')}</span>
                      <span className="text-[11px] font-medium text-foreground line-clamp-2">{selectedBroker.operatingCountries}</span>
                    </div>
                  </div>
                </motion.div>

                {/* User Reviews */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.52 }} className="px-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      {t('broker_reviews') || 'Reseñas de usuarios'}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {(() => {
                        const seed = selectedBroker.name.length;
                        return `${120 + seed * 7} ${t('broker_reviews_count') || 'reseñas'}`;
                      })()}
                    </span>
                  </div>

                  {/* Rating breakdown */}
                  {(() => {
                    const r = selectedBroker.rating;
                    const distribution = [
                      Math.round(r * 14),
                      Math.round(r * 6),
                      Math.round((5 - r) * 8),
                      Math.round((5 - r) * 3),
                      Math.round((5 - r) * 1.5),
                    ];
                    const total = distribution.reduce((a, b) => a + b, 0);
                    return (
                      <div className="bg-secondary/50 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="text-center">
                            <span className="text-2xl font-bold text-foreground">{r}</span>
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(r) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            {distribution.map((count, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground w-3 text-right">{5 - i}</span>
                                <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-1.5 flex-1" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Individual reviews */}
                  <div className="space-y-2.5">
                    {[
                      { name: 'Carlos M.', initials: 'CM', rating: 5, date: '2 sem', text: `Excelente plataforma. ${selectedBroker.name} ofrece spreads competitivos y la ejecución es rápida.`, helpful: 12 },
                      { name: 'Ana R.', initials: 'AR', rating: 4, date: '1 mes', text: 'Buena experiencia en general. El soporte al cliente es responsivo y las herramientas de análisis son completas.', helpful: 8 },
                      { name: 'Miguel S.', initials: 'MS', rating: 4, date: '3 sem', text: 'Me gusta la variedad de instrumentos disponibles. La app móvil funciona bien aunque podría mejorar la interfaz.', helpful: 5 },
                    ].map((review, i) => (
                      <div key={i} className="bg-secondary/30 rounded-xl p-3 border border-border/50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">{review.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-semibold text-foreground">{review.name}</span>
                            <span className="text-[9px] text-muted-foreground ml-2">{review.date}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{review.text}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">{review.helpful} útil</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.58, ease: [0.25, 0.46, 0.45, 0.94] }} className="px-5">
                  <Button className="w-full bg-primary hover:bg-primary/90 h-11 text-sm font-semibold">{t('broker_open_account')}</Button>
                </motion.div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
