import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BrokerSlot {
  id: string;
  name: string;
  logo?: string;
  connected: boolean;
}

interface BrokerOption {
  id: string;
  name: string;
  logo: string;
}

const availableBrokers: BrokerOption[] = [
  { id: 'icmarket', name: 'IC Markets', logo: '🤝' },
  { id: 'oanda', name: 'OANDA', logo: '📊' },
  { id: 'interactive', name: 'Interactive Brokers', logo: '📈' },
  { id: 'metatrader4', name: 'MetaTrader 4', logo: '📉' },
  { id: 'metatrader5', name: 'MetaTrader 5', logo: '💹' },
  { id: 'alpaca', name: 'Alpaca', logo: '🦙' },
  { id: 'etoro', name: 'eToro', logo: '🌐' },
  { id: 'plus500', name: 'Plus500', logo: '➕' },
];

export default function LinkBroker() {
  const navigate = useNavigate();
  const [brokerSlots, setBrokerSlots] = useState<BrokerSlot[]>([
    { id: '1', name: 'IC Markets', connected: true },
    { id: '2', name: '', connected: false },
    { id: '3', name: '', connected: false },
    { id: '4', name: '', connected: false },
    { id: '5', name: '', connected: false },
  ]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  
  // Form states
  const [connectionMethod, setConnectionMethod] = useState<'api' | 'oauth'>('api');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBroker, setSelectedBroker] = useState<BrokerOption | null>(null);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [formData, setFormData] = useState({
    emailOrId: '',
    apiKey: '',
    apiSecret: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Permissions
  const [permissions, setPermissions] = useState({
    copyTrader: true,
    leerBalance: true,
    alertas: true,
    enviarOrdenes: true,
    historial: true,
    operacionesAbiertas: true,
  });
  const [isLiveMode, setIsLiveMode] = useState(true);

  const filteredBrokers = availableBrokers.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBroker = (broker: BrokerOption) => {
    setSelectedBroker(broker);
    setSearchQuery(broker.name);
    setShowBrokerDropdown(false);
  };

  const handleTestConnection = async () => {
    if (!selectedBroker) {
      toast.error('Selecciona un broker primero');
      return;
    }
    if (connectionMethod === 'api' && (!formData.apiKey || !formData.apiSecret)) {
      toast.error('Completa los campos de API Key');
      return;
    }

    setIsTestingConnection(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsTestingConnection(false);
    toast.success('Conexión exitosa con ' + selectedBroker.name);
    
    // Update broker slot
    if (selectedSlotIndex !== null) {
      const newSlots = [...brokerSlots];
      newSlots[selectedSlotIndex] = {
        ...newSlots[selectedSlotIndex],
        name: selectedBroker.name,
        connected: true,
      };
      setBrokerSlots(newSlots);
    } else {
      // Find first empty slot
      const emptyIndex = brokerSlots.findIndex(s => !s.connected);
      if (emptyIndex !== -1) {
        const newSlots = [...brokerSlots];
        newSlots[emptyIndex] = {
          ...newSlots[emptyIndex],
          name: selectedBroker.name,
          connected: true,
        };
        setBrokerSlots(newSlots);
      }
    }
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index);
    const slot = brokerSlots[index];
    if (slot.connected) {
      // Pre-fill with existing broker
      const broker = availableBrokers.find(b => b.name === slot.name);
      if (broker) {
        setSelectedBroker(broker);
        setSearchQuery(broker.name);
      }
    } else {
      setSelectedBroker(null);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-20">
      <Header />
      
      <main className="container max-w-lg mx-auto px-4 py-4">
        {/* Back button and header */}
        <div className="flex items-start gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center pr-7">
            <p className="text-cyan-400 text-sm font-medium">
              Maneja hasta 5 cuentas Brokers a la vez
            </p>
            <p className="text-cyan-400/70 text-xs mt-0.5">
              Invierte de manera segura, Rápido y con mejores resultados
            </p>
          </div>
        </div>

        {/* Broker Slots */}
        <div className="flex items-center justify-center gap-3 mb-8 overflow-x-auto pb-2">
          {brokerSlots.map((slot, index) => (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(index)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[64px]",
                selectedSlotIndex === index && "ring-2 ring-cyan-500",
                slot.connected 
                  ? "bg-slate-800/60 border border-cyan-500/40" 
                  : "bg-slate-800/40 border border-slate-700/50 hover:border-slate-600"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                slot.connected 
                  ? "bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 border border-cyan-400/50" 
                  : "bg-slate-700/50 border border-dashed border-slate-600"
              )}>
                {slot.connected ? '🤝' : <Plus className="w-4 h-4 text-slate-500" />}
              </div>
              <span className={cn(
                "text-[9px] text-center leading-tight max-w-[56px] truncate",
                slot.connected ? "text-cyan-400" : "text-slate-500"
              )}>
                {slot.connected ? slot.name : 'Añadir Broker'}
              </span>
            </button>
          ))}
        </div>

        {/* Vincular Broker Section */}
        <section className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">Vincular Broker</h2>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <label className="text-slate-400 text-sm mb-2 block">Seleccionar Broker</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar tu Broker"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowBrokerDropdown(true);
                }}
                onFocus={() => setShowBrokerDropdown(true)}
                className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              
              {/* Dropdown */}
              {showBrokerDropdown && searchQuery && (
                <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredBrokers.length > 0 ? (
                    filteredBrokers.map(broker => (
                      <button
                        key={broker.id}
                        onClick={() => handleSelectBroker(broker)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left"
                      >
                        <span className="text-lg">{broker.logo}</span>
                        <span className="text-white text-sm">{broker.name}</span>
                        {selectedBroker?.id === broker.id && (
                          <Check className="w-4 h-4 text-cyan-400 ml-auto" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-500 text-sm">No se encontraron brokers</div>
                  )}
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Conecta tu cuenta, Opera de la mano de los Profesionales
            </p>
          </div>
        </section>

        {/* Metodo de Conexion */}
        <section className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">Método de Conexión</h2>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
            {/* Toggle API/OAuth */}
            <div className="flex items-center justify-center gap-1 p-1 bg-slate-900/60 rounded-full max-w-xs mx-auto">
              <button
                onClick={() => setConnectionMethod('api')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all",
                  connectionMethod === 'api' 
                    ? "bg-cyan-600 text-white" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                API Key
              </button>
              <button
                onClick={() => setConnectionMethod('oauth')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all",
                  connectionMethod === 'oauth' 
                    ? "bg-cyan-600 text-white" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                OAuth
              </button>
            </div>

            {connectionMethod === 'api' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm mb-1.5 block">ID o Correo</label>
                  <Input
                    type="text"
                    placeholder="Introduce tu correo o número ID"
                    value={formData.emailOrId}
                    onChange={(e) => setFormData({ ...formData, emailOrId: e.target.value })}
                    className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500"
                  />
                </div>
                
                <div>
                  <label className="text-slate-400 text-sm mb-1.5 block">API Key</label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Introduce tu API Key"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-400 text-sm mb-1.5 block">Secreto API Key</label>
                  <div className="relative">
                    <Input
                      type={showApiSecret ? 'text' : 'password'}
                      placeholder="Introduce tu Secreto API Key"
                      value={formData.apiSecret}
                      onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                      className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-4">
                  Conecta tu cuenta usando OAuth para una autenticación más segura
                </p>
                <button className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-medium transition-colors">
                  Conectar con OAuth
                </button>
              </div>
            )}

            {/* Test Connection Button */}
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Probando Conexión...
                </>
              ) : (
                'Probar Conexión'
              )}
            </button>
          </div>
        </section>

        {/* Permisos y Alcances */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-semibold">Permisos y Alcances</h2>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Live</span>
              <Switch
                checked={isLiveMode}
                onCheckedChange={setIsLiveMode}
                className="data-[state=checked]:bg-cyan-600"
              />
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
            <PermissionRow
              label="Copy Trader"
              checked={permissions.copyTrader}
              onChange={(v) => setPermissions({ ...permissions, copyTrader: v })}
            />
            <PermissionRow
              label="Leer Balance"
              checked={permissions.leerBalance}
              onChange={(v) => setPermissions({ ...permissions, leerBalance: v })}
            />
            <PermissionRow
              label="Alertas del Broker"
              checked={permissions.alertas}
              onChange={(v) => setPermissions({ ...permissions, alertas: v })}
            />
            <PermissionRow
              label="Enviar Ordenes (Solo con Confirmación)"
              checked={permissions.enviarOrdenes}
              onChange={(v) => setPermissions({ ...permissions, enviarOrdenes: v })}
            />
            <PermissionRow
              label="Historial de Operaciones"
              checked={permissions.historial}
              onChange={(v) => setPermissions({ ...permissions, historial: v })}
            />
            <PermissionRow
              label="Ver Operaciones Abiertas"
              checked={permissions.operacionesAbiertas}
              onChange={(v) => setPermissions({ ...permissions, operacionesAbiertas: v })}
            />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function PermissionRow({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-slate-300 text-sm">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-cyan-600"
      />
    </div>
  );
}
