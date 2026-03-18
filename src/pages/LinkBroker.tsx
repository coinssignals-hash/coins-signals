import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Check, Eye, EyeOff, Loader2, Trash2, RefreshCw, AlertCircle, BarChart3, LogIn, FileSpreadsheet, Shield, Monitor } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useBrokerConnections, Broker, BrokerConnection } from '@/hooks/useBrokerConnections';
import { useBrokerSync } from '@/hooks/useBrokerSync';
import { useMT5Sync } from '@/hooks/useMT5Sync';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/LanguageContext';
import { TradeImportModal } from '@/components/portfolio/TradeImportModal';
import { BrokerCatalog, BrokerCatalogItem } from '@/components/broker/BrokerCatalog';
import { MT5ConnectDialog } from '@/components/broker/MT5ConnectDialog';

export default function LinkBroker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    brokers,
    connections,
    loading,
    createConnection,
    testConnection,
    deleteConnection,
    refetch,
  } = useBrokerConnections();
  const { syncBroker, isSyncing } = useBrokerSync();
  const { syncMT5, isSyncing: isMT5Syncing } = useMT5Sync();

  const connectedCount = connections.filter(c => c.is_connected).length;
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMT5Dialog, setShowMT5Dialog] = useState(false);
  const [mt5Broker, setMT5Broker] = useState<BrokerCatalogItem | null>(null);

  // Connection form state
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [selectedCatalogBroker, setSelectedCatalogBroker] = useState<BrokerCatalogItem | null>(null);
  const [formData, setFormData] = useState({ connectionName: '', apiKey: '', apiSecret: '', accountId: '', accessToken: '' });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const connectedBrokerCodes = connections
    .filter(c => c.is_connected && c.broker)
    .map(c => (c.broker as any)?.code || '')
    .filter(Boolean);

  // MT5-connected brokers
  const mt5ConnectedBrokerCodes = connections
    .filter(c => c.is_connected && c.broker && (c as any).connection_name?.includes('MT'))
    .map(c => (c.broker as any)?.code || '')
    .filter(Boolean);

  const handleConnectMT5 = (catalogBroker: BrokerCatalogItem) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      navigate('/auth');
      return;
    }
    setMT5Broker(catalogBroker);
    setShowMT5Dialog(true);
  };

  const handleSaveMT5 = async (data: {
    broker: BrokerCatalogItem;
    server: string;
    login: string;
    password: string;
    platform: 'mt4' | 'mt5';
    connectionName: string;
    environment: 'demo' | 'live';
  }) => {
    const dbBroker = brokers.find(b => b.code === data.broker.code);
    if (!dbBroker) {
      toast.error('Broker no encontrado en la base de datos');
      return;
    }

    const connection = await createConnection(
      dbBroker.id,
      data.connectionName,
      data.environment,
      {
        mt5_server: data.server,
        mt5_login: data.login,
        mt5_password: data.password,
        mt5_platform: data.platform,
      }
    );

    if (connection) {
      toast.success(`${data.broker.name} conectado vía ${data.platform.toUpperCase()}`);
      // Auto-sync after connecting
      await syncMT5(connection.id);
    }
  };

  const handleSyncMT5Broker = async (catalogBroker: BrokerCatalogItem) => {
    const conn = connections.find(
      c => (c.broker as any)?.code === catalogBroker.code && c.is_connected && (c as any).connection_name?.includes('MT')
    );
    if (conn) {
      await syncMT5(conn.id);
    } else {
      // Not connected yet, open dialog
      handleConnectMT5(catalogBroker);
    }
  };

  const handleConnectBroker = (catalogBroker: BrokerCatalogItem) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      navigate('/auth');
      return;
    }
    setSelectedCatalogBroker(catalogBroker);
    setFormData({
      connectionName: `${catalogBroker.name} - ${isLiveMode ? 'Live' : 'Demo'}`,
      apiKey: '', apiSecret: '', accountId: '', accessToken: '',
    });
    setShowConnectForm(true);
  };

  const handleSyncBroker = async (catalogBroker: BrokerCatalogItem) => {
    const conn = connections.find(c => (c.broker as any)?.code === catalogBroker.code && c.is_connected);
    if (conn) {
      await syncBroker(conn.id);
    } else {
      toast.error('Broker no conectado');
    }
  };

  const handleTestConnection = async () => {
    if (!selectedCatalogBroker) return;
    // Find DB broker by code
    const dbBroker = brokers.find(b => b.code === selectedCatalogBroker.code);

    setIsTestingConnection(true);
    const result = await testConnection(
      undefined,
      selectedCatalogBroker.code,
      {
        api_key: formData.apiKey,
        api_secret: formData.apiSecret,
        account_id: formData.accountId || undefined,
        access_token: formData.accessToken || undefined,
      },
      isLiveMode ? 'live' : 'demo'
    );
    setIsTestingConnection(false);

    if (result.success) {
      toast.success(result.message || 'Conexión exitosa');
    } else {
      toast.error(result.message || 'Error de conexión');
    }
  };

  const handleSaveConnection = async () => {
    if (!selectedCatalogBroker || !user) return;
    const dbBroker = brokers.find(b => b.code === selectedCatalogBroker.code);
    if (!dbBroker) {
      toast.error('Broker no encontrado en la base de datos');
      return;
    }

    setIsSaving(true);
    const connection = await createConnection(
      dbBroker.id,
      formData.connectionName || `${selectedCatalogBroker.name} Account`,
      isLiveMode ? 'live' : 'demo',
      {
        api_key: formData.apiKey,
        api_secret: formData.apiSecret,
        account_id: formData.accountId || undefined,
        access_token: formData.accessToken || undefined,
      }
    );
    setIsSaving(false);

    if (connection) {
      setShowConnectForm(false);
      setSelectedCatalogBroker(null);
      setFormData({ connectionName: '', apiKey: '', apiSecret: '', accountId: '', accessToken: '' });
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (confirm('¿Eliminar esta conexión?')) {
      await deleteConnection(connectionId);
    }
  };

  // Build syncing maps
  const syncingMap: Record<string, boolean> = {};
  const mt5SyncingMap: Record<string, boolean> = {};
  connections.forEach(c => {
    const code = (c.broker as any)?.code;
    if (code && isSyncing(c.id)) syncingMap[code] = true;
    if (code && isMT5Syncing(c.id)) mt5SyncingMap[code] = true;
  });

  return (
    <PageShell>
      <Header />

      <main className="px-4 py-4 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center pr-7">
            <h1 className="text-foreground text-lg font-bold">{t('lb_manage_accounts')}</h1>
            <p className="text-muted-foreground text-xs mt-0.5">{t('lb_invest_safely')}</p>
          </div>
          <button onClick={() => refetch()} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Auth banner */}
        {!user && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <LogIn className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium">{t('lb_preview_mode')}</p>
              <p className="text-amber-200/70 text-xs mt-0.5">{t('lb_preview_desc')}</p>
              <button onClick={() => navigate('/auth')} className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-background rounded-full text-xs font-semibold transition-colors">
                {t('lb_login')}
              </button>
            </div>
          </div>
        )}

        {/* Connected accounts summary */}
        {connections.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Cuentas conectadas ({connectedCount})</span>
              <button
                onClick={() => navigate('/portfolio')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <BarChart3 className="w-3 h-3" /> Ver portafolio
              </button>
            </div>
            {connections.map(conn => (
              <div key={conn.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center text-lg",
                  conn.is_connected ? "bg-emerald-500/15" : "bg-destructive/15"
                )}>
                  {conn.is_connected ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground font-medium truncate block">{conn.connection_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {conn.environment === 'live' ? '🔴 Live' : '🟢 Demo'}
                    {conn.last_sync_at && ` · Sync: ${new Date(conn.last_sync_at).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {conn.is_connected && (
                    <button
                      onClick={() => syncBroker(conn.id)}
                      disabled={isSyncing(conn.id)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                      title="Sincronizar"
                    >
                      {isSyncing(conn.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteConnection(conn.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Broker Catalog */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Brokers disponibles</h2>
          <BrokerCatalog
            onConnect={handleConnectBroker}
            onImportCSV={() => setShowImportModal(true)}
            onSync={handleSyncBroker}
            syncingIds={syncingMap}
            connectedBrokers={connectedBrokerCodes}
          />
        </div>

        {/* Connect Form Modal */}
        {showConnectForm && selectedCatalogBroker && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center">
            <div className="w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-semibold flex items-center gap-2">
                  <span className="text-xl">{selectedCatalogBroker.logoEmoji}</span>
                  Conectar {selectedCatalogBroker.name}
                </h3>
                <button onClick={() => setShowConnectForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground text-xs mb-1 block">Nombre de conexión</label>
                  <Input value={formData.connectionName} onChange={(e) => setFormData(p => ({ ...p, connectionName: e.target.value }))} placeholder="Mi cuenta Demo" className="h-9 text-sm" />
                </div>

                {/* Broker-specific fields */}
                {['oanda', 'alpaca', 'pepperstone', 'avatrade', 'ic_markets', 'interactive_brokers', 'tradestation', 'tradovate'].includes(selectedCatalogBroker.code) && (
                  <>
                    <div>
                      <label className="text-muted-foreground text-xs mb-1 block">
                        {selectedCatalogBroker.code === 'tradestation' ? 'Access Token (OAuth)' : 'API Key'}
                      </label>
                      <div className="relative">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={selectedCatalogBroker.code === 'tradestation' ? formData.accessToken : formData.apiKey}
                          onChange={(e) => setFormData(p => ({
                            ...p,
                            [selectedCatalogBroker.code === 'tradestation' ? 'accessToken' : 'apiKey']: e.target.value,
                          }))}
                          placeholder="Tu API key..."
                          className="h-9 text-sm pr-9"
                        />
                        <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {selectedCatalogBroker.code !== 'oanda' && selectedCatalogBroker.code !== 'tradestation' && (
                      <div>
                        <label className="text-muted-foreground text-xs mb-1 block">
                          {selectedCatalogBroker.code === 'tradovate' ? 'Password' : 'API Secret'}
                        </label>
                        <div className="relative">
                          <Input
                            type={showApiSecret ? 'text' : 'password'}
                            value={formData.apiSecret}
                            onChange={(e) => setFormData(p => ({ ...p, apiSecret: e.target.value }))}
                            placeholder="Tu secret..."
                            className="h-9 text-sm pr-9"
                          />
                          <button onClick={() => setShowApiSecret(!showApiSecret)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showApiSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {(selectedCatalogBroker.code === 'oanda' || selectedCatalogBroker.code === 'tradovate') && (
                      <div>
                        <label className="text-muted-foreground text-xs mb-1 block">
                          {selectedCatalogBroker.code === 'oanda' ? 'Account ID' : 'App ID (opcional)'}
                        </label>
                        <Input
                          value={formData.accountId}
                          onChange={(e) => setFormData(p => ({ ...p, accountId: e.target.value }))}
                          placeholder={selectedCatalogBroker.code === 'oanda' ? '101-001-12345678-001' : 'TradeSync'}
                          className="h-9 text-sm"
                        />
                      </div>
                    )}

                    {selectedCatalogBroker.code === 'interactive_brokers' && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-[10px] text-amber-400 flex items-start gap-1.5">
                          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          IBKR requiere TWS ejecutándose localmente. Las llamadas van a localhost:5000.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Environment toggle */}
                <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">Entorno</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs", isLiveMode ? "text-amber-400 font-medium" : "text-muted-foreground")}>
                      {isLiveMode ? '🔴 Live' : '🟢 Demo'}
                    </span>
                    <Switch checked={isLiveMode} onCheckedChange={setIsLiveMode} className="data-[state=checked]:bg-amber-600" />
                  </div>
                </div>

                {isLiveMode && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-[10px] text-amber-400">{t('lb_live_warning')}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !formData.apiKey}
                    className="flex-1 py-2.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isTestingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {isTestingConnection ? 'Probando...' : 'Probar'}
                  </button>
                  <button
                    onClick={handleSaveConnection}
                    disabled={isSaving || !formData.apiKey}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {isSaving ? 'Guardando...' : 'Conectar'}
                  </button>
                </div>

                {/* Privacy notice */}
                <div className="flex items-start gap-1.5 pt-1">
                  <Shield className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Credenciales cifradas AES-256-GCM. Solo lectura — no ejecutamos órdenes. Solo se almacenan en tu cuenta segura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        <TradeImportModal open={showImportModal} onOpenChange={setShowImportModal} />
      </main>
    </PageShell>
  );
}
