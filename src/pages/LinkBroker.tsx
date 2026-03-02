import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Check, Eye, EyeOff, Loader2, Trash2, RefreshCw, AlertCircle, BarChart3, LogIn } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useBrokerConnections, Broker, BrokerConnection } from '@/hooks/useBrokerConnections';
import { useAuth } from '@/hooks/useAuth';

interface BrokerSlot {
  id: string;
  name: string;
  logo?: string;
  connected: boolean;
  connectionId?: string;
  brokerId?: string;
}

export default function LinkBroker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    brokers, 
    connections, 
    loading, 
    createConnection, 
    testConnection, 
    deleteConnection,
    refetch 
  } = useBrokerConnections();

  // Count connected accounts
  const connectedCount = connections.filter(c => c.is_connected).length;
  const accounts = connections;

  const [brokerSlots, setBrokerSlots] = useState<BrokerSlot[]>([
    { id: '1', name: '', connected: false },
    { id: '2', name: '', connected: false },
    { id: '3', name: '', connected: false },
    { id: '4', name: '', connected: false },
    { id: '5', name: '', connected: false },
  ]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  
  // Form states
  const [connectionMethod, setConnectionMethod] = useState<'api' | 'oauth'>('api');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [formData, setFormData] = useState({
    connectionName: '',
    apiKey: '',
    apiSecret: '',
    accountId: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Permissions
  const [permissions, setPermissions] = useState({
    copyTrader: true,
    leerBalance: true,
    alertas: true,
    enviarOrdenes: true,
    historial: true,
    operacionesAbiertas: true,
  });
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Sync connections to slots
  useEffect(() => {
    if (connections.length > 0) {
      const newSlots: BrokerSlot[] = [];
      
      // Fill with existing connections
      connections.slice(0, 5).forEach((conn, index) => {
        newSlots.push({
          id: String(index + 1),
          name: conn.broker?.display_name || conn.connection_name,
          logo: conn.broker?.logo_url || undefined,
          connected: conn.is_connected,
          connectionId: conn.id,
          brokerId: conn.broker_id,
        });
      });
      
      // Fill remaining slots
      while (newSlots.length < 5) {
        newSlots.push({
          id: String(newSlots.length + 1),
          name: '',
          connected: false,
        });
      }
      
      setBrokerSlots(newSlots);
    }
  }, [connections]);

  const filteredBrokers = brokers.filter(b => 
    b.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBroker = (broker: Broker) => {
    setSelectedBroker(broker);
    setSearchQuery(broker.display_name);
    setShowBrokerDropdown(false);
    setFormData(prev => ({
      ...prev,
      connectionName: `${broker.display_name} - ${isLiveMode ? 'Live' : 'Demo'}`,
    }));
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
    
    const result = await testConnection(
      undefined,
      selectedBroker.code,
      {
        api_key: formData.apiKey,
        api_secret: formData.apiSecret,
        account_id: formData.accountId || undefined,
      },
      isLiveMode ? 'live' : 'demo'
    );
    
    setIsTestingConnection(false);
    
    if (result.success) {
      toast.success(result.message || 'Conexión exitosa');
      if (result.account_info) {
        console.log('Account info:', result.account_info);
      }
    } else {
      toast.error(result.message || 'Error en la conexión');
    }
  };

  const handleSaveConnection = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para conectar un broker');
      navigate('/auth');
      return;
    }

    if (!selectedBroker) {
      toast.error('Selecciona un broker primero');
      return;
    }
    if (connectionMethod === 'api' && (!formData.apiKey || !formData.apiSecret)) {
      toast.error('Completa los campos de API Key');
      return;
    }

    setIsSaving(true);
    
    const connection = await createConnection(
      selectedBroker.id,
      formData.connectionName || `${selectedBroker.display_name} Account`,
      isLiveMode ? 'live' : 'demo',
      {
        api_key: formData.apiKey,
        api_secret: formData.apiSecret,
        account_id: formData.accountId || undefined,
      },
      { permissions }
    );
    
    setIsSaving(false);
    
    if (connection) {
      // Reset form
      setFormData({ connectionName: '', apiKey: '', apiSecret: '', accountId: '' });
      setSelectedBroker(null);
      setSearchQuery('');
      setSelectedSlotIndex(null);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta conexión?')) {
      await deleteConnection(connectionId);
    }
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index);
    const slot = brokerSlots[index];
    if (slot.connected && slot.brokerId) {
      const broker = brokers.find(b => b.id === slot.brokerId);
      if (broker) {
        setSelectedBroker(broker);
        setSearchQuery(broker.display_name);
      }
    } else {
      setSelectedBroker(null);
      setSearchQuery('');
    }
  };

  const getBrokerEmoji = (code?: string): string => {
    const emojiMap: Record<string, string> = {
      alpaca: '🦙',
      oanda: '📊',
      interactive_brokers: '📈',
      metatrader4: '📉',
      metatrader5: '💹',
      ig_markets: '🎯',
      forex_com: '💱',
    };
    return emojiMap[code || ''] || '🏦';
  };

  // Remove authentication wall - allow viewing without login
  // Authentication is only required when saving a connection (handled in handleSaveConnection)

  return (
    <PageShell>
      <Header />
      
      <main className="px-4 py-4">
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
          <button 
            onClick={() => refetch()} 
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Auth Banner for non-authenticated users */}
        {!user && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <LogIn className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium">Modo vista previa</p>
              <p className="text-amber-200/70 text-xs mt-0.5">
                Puedes explorar la configuración, pero necesitas iniciar sesión para guardar conexiones.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full text-xs font-semibold transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-8 overflow-x-auto pb-2">
          {brokerSlots.map((slot, index) => (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(index)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[64px] relative group",
                selectedSlotIndex === index && "ring-2 ring-cyan-500",
                slot.connected 
                  ? "bg-slate-800/60 border border-cyan-500/40" 
                  : "bg-slate-800/40 border border-slate-700/50 hover:border-slate-600"
              )}
            >
              {slot.connected && slot.connectionId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConnection(slot.connectionId!);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg overflow-hidden",
                slot.connected 
                  ? "bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 border border-cyan-400/50" 
                  : "bg-slate-700/50 border border-dashed border-slate-600"
              )}>
                {slot.connected ? (
                  slot.logo ? (
                    <img src={slot.logo} alt="" className="w-full h-full object-cover" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.textContent = getBrokerEmoji();
                    }} />
                  ) : getBrokerEmoji()
                ) : (
                  <Plus className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <span className={cn(
                "text-[9px] text-center leading-tight max-w-[56px] truncate",
                slot.connected ? "text-cyan-400" : "text-slate-500"
              )}>
                {slot.connected ? slot.name : 'Añadir'}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        {accounts.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/portfolio')}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Ver Portfolio Unificado
            </button>
          </div>
        )}

        {/* Vincular Broker Section */}
        <section className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">Vincular Broker</h2>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <label className="text-slate-400 text-sm mb-2 block">Seleccionar Broker</label>
            <div className="relative">
              <Input
                type="text"
                placeholder={loading ? 'Cargando brokers...' : 'Buscar tu Broker'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowBrokerDropdown(true);
                }}
                onFocus={() => setShowBrokerDropdown(true)}
                className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 pr-10"
                disabled={loading}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              
              {/* Dropdown */}
              {showBrokerDropdown && (searchQuery || brokers.length > 0) && (
                <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredBrokers.length > 0 ? (
                    filteredBrokers.map(broker => (
                      <button
                        key={broker.id}
                        onClick={() => handleSelectBroker(broker)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left"
                      >
                        <span className="text-lg">{getBrokerEmoji(broker.code)}</span>
                        <div className="flex-1">
                          <span className="text-white text-sm block">{broker.display_name}</span>
                          <span className="text-slate-500 text-xs">{broker.supported_assets?.join(', ')}</span>
                        </div>
                        {selectedBroker?.id === broker.id && (
                          <Check className="w-4 h-4 text-cyan-400" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-500 text-sm">
                      {loading ? 'Cargando...' : 'No se encontraron brokers'}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedBroker && (
              <p className="text-slate-500 text-xs mt-2">
                {selectedBroker.description}
              </p>
            )}
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
                  <label className="text-slate-400 text-sm mb-1.5 block">Nombre de Conexión</label>
                  <Input
                    type="text"
                    placeholder="Mi cuenta Alpaca Demo"
                    value={formData.connectionName}
                    onChange={(e) => setFormData({ ...formData, connectionName: e.target.value })}
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

                {selectedBroker?.code === 'oanda' && (
                  <div>
                    <label className="text-slate-400 text-sm mb-1.5 block">Account ID (opcional)</label>
                    <Input
                      type="text"
                      placeholder="Ej: 101-001-12345678-001"
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500"
                    />
                  </div>
                )}
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

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !selectedBroker}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Probando...
                  </>
                ) : (
                  'Probar'
                )}
              </button>
              <button
                onClick={handleSaveConnection}
                disabled={isSaving || !selectedBroker || !formData.apiKey}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:text-cyan-300 text-white rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Conexión'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Permisos y Alcances */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-semibold">Permisos y Alcances</h2>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm", isLiveMode ? "text-amber-400" : "text-slate-400")}>
                {isLiveMode ? 'Live' : 'Demo'}
              </span>
              <Switch
                checked={isLiveMode}
                onCheckedChange={setIsLiveMode}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>
          </div>
          
          {isLiveMode && (
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Modo Live: Las operaciones afectarán tu cuenta real
              </p>
            </div>
          )}
          
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
    </PageShell>
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
