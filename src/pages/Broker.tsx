import { useState } from 'react';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { BrokerCard, BrokerData } from '@/components/broker/BrokerCard';
import { BrokerDetail } from '@/components/broker/BrokerDetail';
import { BrokerSearch } from '@/components/broker/BrokerSearch';
import { BrokerFilter } from '@/components/broker/BrokerFilter';
import { BrokerCompare } from '@/components/broker/BrokerCompare';
import { brokersData } from '@/components/broker/brokersData';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Broker() {
  const navigate = useNavigate();
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

  // Filter brokers based on search and category
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
        toast.error('Máximo 4 brokers para comparar');
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
      toast.error('Selecciona al menos 2 brokers para comparar');
      return;
    }
    setShowComparison(true);
  };

  // If a broker is selected, show the detail view
  if (selectedBroker) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container py-6">
          <BrokerDetail broker={selectedBroker} onBack={() => setSelectedBroker(null)} />
        </main>
        <BottomNav />
      </div>
    );
  }

  // If showing comparison view
  if (showComparison && brokersToCompare.length >= 2) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container py-6">
          <BrokerCompare
            brokers={brokersToCompare}
            onRemove={handleRemoveFromCompare}
            onClose={() => setShowComparison(false)}
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        {/* Back button and title */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h1 className="text-primary font-medium">Busca el Broker a tu medida</h1>
          <p className="text-sm text-primary/80">
            Aumenta y asegura tus ganancia escogioendo un broker a tu medidas
          </p>
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
            {compareMode ? 'Cancelar Comparación' : 'Comparar Brokers'}
          </Button>
          
          {compareMode && brokersToCompare.length > 0 && (
            <Button
              size="sm"
              onClick={handleStartComparison}
              className="bg-primary hover:bg-primary/90"
            >
              Comparar ({brokersToCompare.length})
            </Button>
          )}
        </div>

        {/* Compare Selection Info */}
        {compareMode && (
          <div className="bg-secondary/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
            <p>Selecciona de 2 a 4 brokers para comparar sus características lado a lado.</p>
            {brokersToCompare.length > 0 && (
              <p className="text-primary mt-1">
                Seleccionados: {brokersToCompare.map(b => b.name).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Search and Categories */}
        <BrokerSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onAdvancedSearch={() => setShowAdvancedFilter(true)}
        />

        {/* Advanced Filter Panel */}
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

        {/* Broker List */}
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
            <p>No se encontraron brokers con los criterios seleccionados</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
