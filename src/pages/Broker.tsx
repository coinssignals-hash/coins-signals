import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { BrokerCard, BrokerData } from '@/components/broker/BrokerCard';
import { BrokerDetail } from '@/components/broker/BrokerDetail';
import { BrokerSearch } from '@/components/broker/BrokerSearch';
import { BrokerFilter } from '@/components/broker/BrokerFilter';
import { brokersData } from '@/components/broker/brokersData';
import { useNavigate } from 'react-router-dom';

export default function Broker() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerData | null>(null);
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
                // Apply filters logic here
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
