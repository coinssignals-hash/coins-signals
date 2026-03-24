import { useState } from 'react';
import { ArrowLeft, GitCompare, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { BrokerCard, BrokerData } from '@/components/broker/BrokerCard';
import { BrokerDetail } from '@/components/broker/BrokerDetail';
import { BrokerSearch } from '@/components/broker/BrokerSearch';
import { BrokerFilter } from '@/components/broker/BrokerFilter';
import { BrokerCompare } from '@/components/broker/BrokerCompare';
import { brokersData } from '@/components/broker/brokersData';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

const ACCENT = '200 70% 55%';

export default function Broker() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerData | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [brokersToCompare, setBrokersToCompare] = useState<BrokerData[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState({
    ubicacion: '',
    moneda: '',
    depositoInicial: '',
    metodo: '',
    enOperacion: '',
    mercados: '',
  });

  const filteredBrokers = brokersData.filter((broker) => {
    const matchesSearch = broker.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || 
      (selectedCategory === 'forex' && broker.instrumentos.some(i => i.toLowerCase().includes('forex'))) ||
      (selectedCategory === 'acciones' && broker.instrumentos.some(i => i.toLowerCase().includes('acciones'))) ||
      (selectedCategory === 'materias' && broker.instrumentos.some(i => i.toLowerCase().includes('materias'))) ||
      (selectedCategory === 'crypto' && broker.instrumentos.some(i => i.toLowerCase().includes('crypto')));
    return matchesSearch && matchesCategory;
  });

  const handleToggleCompare = (broker: BrokerData) => {
    const isSelected = brokersToCompare.some(b => b.id === broker.id);
    if (isSelected) {
      setBrokersToCompare(brokersToCompare.filter(b => b.id !== broker.id));
    } else {
      if (brokersToCompare.length >= 4) {
        toast.error(t('broker_max_compare'));
        return;
      }
      setBrokersToCompare([...brokersToCompare, broker]);
    }
  };

  const handleRemoveFromCompare = (brokerId: string) => {
    setBrokersToCompare(brokersToCompare.filter(b => b.id !== brokerId));
    if (brokersToCompare.length <= 1) {
      setShowComparison(false);
    }
  };

  const handleStartComparison = () => {
    if (brokersToCompare.length < 2) {
      toast.error(t('broker_min_compare'));
      return;
    }
    setShowComparison(true);
  };

  if (selectedBroker) {
    return (
      <PageShell>
        <Header />
        <main className="container py-6">
          <BrokerDetail broker={selectedBroker} onBack={() => setSelectedBroker(null)} />
        </main>
      </PageShell>
    );
  }

  if (showComparison && brokersToCompare.length >= 2) {
    return (
      <PageShell>
        <Header />
        <main className="container py-6">
          <BrokerCompare
            brokers={brokersToCompare}
            onRemove={handleRemoveFromCompare}
            onClose={() => setShowComparison(false)}
          />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header />
      
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-4">
        {/* Premium Hero Header */}
        <div className="relative overflow-hidden rounded-2xl" style={{
          background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)`,
          border: `1px solid hsl(${ACCENT} / 0.2)`,
        }}>
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{
            background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.7), transparent)`,
          }} />
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.07]" style={{
            background: `radial-gradient(circle, hsl(${ACCENT}), transparent 70%)`,
          }} />
          <div className="relative flex items-center gap-3 px-3 py-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm"
              style={{
                background: 'hsl(var(--card) / 0.85)',
                border: '1px solid hsl(var(--border) / 0.6)',
                boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
              }}
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(135deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.08))`,
              border: `1px solid hsl(${ACCENT} / 0.3)`,
              boxShadow: `0 0 12px hsl(${ACCENT} / 0.15)`,
            }}>
              <Search className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{t('bk_search_title')}</h1>
              <p className="text-[10px] text-muted-foreground truncate">{t('bk_search_subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Compare Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant={compareMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) {
                setBrokersToCompare([]);
              }
            }}
            className="gap-2"
          >
            <GitCompare className="w-4 h-4" />
            {compareMode ? t('bk_compare_cancel') : t('bk_compare_brokers')}
          </Button>
          
          {compareMode && brokersToCompare.length > 0 && (
            <Button
              size="sm"
              onClick={handleStartComparison}
              className="bg-primary hover:bg-primary/90"
            >
              {t('bk_compare_brokers')} ({brokersToCompare.length})
            </Button>
          )}
        </div>

        {/* Compare Selection Info */}
        {compareMode && (
          <div className="bg-secondary/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
            <p>{t('bk_compare_instruction')}</p>
            {brokersToCompare.length > 0 && (
              <p className="text-primary mt-1">
                {t('bk_compare_selected')}: {brokersToCompare.map(b => b.name).join(', ')}
              </p>
            )}
          </div>
        )}

        <BrokerSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onAdvancedSearch={() => setShowAdvancedFilter(true)}
        />

        {showAdvancedFilter && (
          <div className="mt-4">
            <BrokerFilter
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={() => {
                console.log('Searching with filters:', filters);
              }}
              onClose={() => setShowAdvancedFilter(false)}
            />
          </div>
        )}

        <div className="space-y-4 mt-6">
          {filteredBrokers.map((broker) => (
            <BrokerCard
              key={broker.id}
              broker={broker}
              onSelect={setSelectedBroker}
              showCompareCheckbox={compareMode}
              isSelectedForCompare={brokersToCompare.some(b => b.id === broker.id)}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>

        {filteredBrokers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('bk_no_brokers_found')}</p>
          </div>
        )}
      </main>
    </PageShell>
  );
}
