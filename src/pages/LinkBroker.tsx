import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Trash2, RefreshCw, AlertCircle, BarChart3, LogIn, Monitor } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { cn } from '@/lib/utils';
import { GlowSection } from '@/components/ui/glow-section';
import { toast } from 'sonner';
import { useBrokerConnections } from '@/hooks/useBrokerConnections';
import { useBrokerSync } from '@/hooks/useBrokerSync';
import { useMT5Sync } from '@/hooks/useMT5Sync';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/LanguageContext';
import { TradeImportModal } from '@/components/portfolio/TradeImportModal';
import { BrokerCatalog, BrokerCatalogItem, MT5_CAPABLE_BROKERS } from '@/components/broker/BrokerCatalog';
import { MT5ConnectDialog } from '@/components/broker/MT5ConnectDialog';
import { APIConnectDialog } from '@/components/broker/APIConnectDialog';

const ACCENT = '200 90% 58%';

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
  const [showAPIDialog, setShowAPIDialog] = useState(false);
  const [apiBroker, setAPIBroker] = useState<BrokerCatalogItem | null>(null);
  

  const connectedBrokerCodes = connections
    .filter(c => c.is_connected && c.broker)
    .map(c => (c.broker as any)?.code || '')
    .filter(Boolean);

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
    // MT5 catalog brokers (exness, xm, etc.) map to the generic metatrader4/metatrader5 DB entry
    const platformCode = data.platform === 'mt4' ? 'metatrader4' : 'metatrader5';
    const dbBroker = brokers.find(b => b.code === data.broker.code)
      || brokers.find(b => b.code === platformCode);

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
      },
      { catalog_broker_code: data.broker.code, catalog_broker_name: data.broker.name }
    );

    if (connection) {
      toast.success(`${data.broker.name} conectado vía ${data.platform.toUpperCase()}`);
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
      handleConnectMT5(catalogBroker);
    }
  };

  const handleConnectBroker = (catalogBroker: BrokerCatalogItem) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      navigate('/auth');
      return;
    }
    setAPIBroker(catalogBroker);
    setShowAPIDialog(true);
  };

  const handleSyncBroker = async (catalogBroker: BrokerCatalogItem) => {
    const conn = connections.find(c => (c.broker as any)?.code === catalogBroker.code && c.is_connected);
    if (conn) {
      await syncBroker(conn.id);
    } else {
      toast.error('Broker no conectado');
    }
  };

  const handleAPITest = async (data: {
    brokerCode: string;
    credentials: { api_key?: string; api_secret?: string; account_id?: string; access_token?: string };
    environment: 'demo' | 'live';
  }) => {
    const result = await testConnection(undefined, data.brokerCode, data.credentials, data.environment);
    return result;
  };

  const handleAPISave = async (data: {
    broker: BrokerCatalogItem;
    connectionName: string;
    environment: 'demo' | 'live';
    credentials: { api_key?: string; api_secret?: string; account_id?: string; access_token?: string };
  }): Promise<boolean> => {
    const dbBroker = brokers.find(b => b.code === data.broker.code);
    if (!dbBroker) {
      toast.error('Broker no encontrado en la base de datos');
      return false;
    }
    const connection = await createConnection(
      dbBroker.id,
      data.connectionName,
      data.environment,
      data.credentials,
    );
    return !!connection;
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (confirm('¿Eliminar esta conexión?')) {
      await deleteConnection(connectionId);
    }
  };

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

      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        {/* Header — glassmorphism back button like MarketSessions */}
        <div className="flex items-center gap-3 mb-1">
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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Monitor className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{t('lb_manage_accounts')}</h1>
              <p className="text-[10px] text-muted-foreground truncate">{t('lb_invest_safely')}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm"
            style={{
              background: 'hsl(var(--card) / 0.85)',
              border: '1px solid hsl(var(--border) / 0.6)',
              boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
            }}
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} />
          </button>
        </div>

        {/* Auth banner */}
        {!user && (
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(165deg, hsl(45 80% 55% / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
              border: '1px solid hsl(45 80% 55% / 0.2)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(45 80% 55% / 0.7), transparent)' }} />
            <div className="relative z-[2] p-4 flex items-start gap-3">
              <LogIn className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-200 text-sm font-medium">{t('lb_preview_mode')}</p>
                <p className="text-amber-200/70 text-xs mt-0.5">{t('lb_preview_desc')}</p>
                <button
                  onClick={() => navigate('/auth')}
                  className="mt-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: 'hsl(45 80% 55%)',
                    color: 'hsl(var(--background))',
                  }}
                >
                  {t('lb_login')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connected accounts summary */}
        {connections.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cuentas conectadas
              </span>
              <button
                onClick={() => navigate('/portfolio')}
                className="text-[10px] font-bold flex items-center gap-1 transition-colors"
                style={{ color: `hsl(${ACCENT})` }}
              >
                <BarChart3 className="w-3 h-3" /> Ver portafolio
              </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: 'hsl(140 60% 50% / 0.08)',
                  border: '1px solid hsl(140 60% 50% / 0.2)',
                }}
              >
                <p className="text-xl font-bold tabular-nums text-emerald-400">{connectedCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Activas</p>
              </div>
              <div
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: `hsl(${ACCENT} / 0.08)`,
                  border: `1px solid hsl(${ACCENT} / 0.2)`,
                }}
              >
                <p className="text-xl font-bold tabular-nums" style={{ color: `hsl(${ACCENT})` }}>{connections.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total</p>
              </div>
              <div
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: 'hsl(330 70% 60% / 0.08)',
                  border: '1px solid hsl(330 70% 60% / 0.2)',
                }}
              >
                <p className="text-xl font-bold tabular-nums" style={{ color: 'hsl(330 70% 60%)' }}>
                  {connections.filter(c => !c.is_connected).length}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Inactivas</p>
              </div>
            </div>

            {/* Connection cards — session style */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(165deg, hsl(${ACCENT} / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
                border: `1px solid hsl(${ACCENT} / 0.2)`,
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px] z-[1]" style={{ background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.7), transparent)` }} />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, hsl(${ACCENT} / 0.4), transparent 70%)` }} />

              <div
                className="relative z-[2] px-3 py-2 flex items-center gap-1.5"
                style={{ background: `hsl(${ACCENT} / 0.06)`, borderBottom: '1px solid hsl(var(--border) / 0.3)' }}
              >
                <Monitor className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conexiones</span>
                <span className="ml-auto text-[10px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT})` }}>{connections.length}</span>
              </div>

              <div className="relative z-[2]">
                {connections.map((conn, i) => (
                  <div
                    key={conn.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3',
                      i !== connections.length - 1 && 'border-b'
                    )}
                    style={{ borderColor: 'hsl(var(--border) / 0.15)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: conn.is_connected
                          ? 'linear-gradient(135deg, hsl(140 60% 50% / 0.2), hsl(140 60% 50% / 0.08))'
                          : 'linear-gradient(135deg, hsl(0 70% 50% / 0.2), hsl(0 70% 50% / 0.08))',
                        border: conn.is_connected
                          ? '1px solid hsl(140 60% 50% / 0.3)'
                          : '1px solid hsl(0 70% 50% / 0.3)',
                      }}
                    >
                      {conn.is_connected
                        ? <Check className="w-4 h-4 text-emerald-400" />
                        : <AlertCircle className="w-4 h-4 text-rose-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate block">{conn.connection_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {conn.environment === 'live' ? '🔴 Live' : '🟢 Demo'}
                        {conn.last_sync_at && ` · Sync: ${new Date(conn.last_sync_at).toLocaleDateString()}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {conn.is_connected && (
                        <button
                          onClick={() => {
                            const isMT5 = conn.connection_name?.includes('MT');
                            if (isMT5) {
                              syncMT5(conn.id);
                            } else {
                              syncBroker(conn.id);
                            }
                          }}
                          disabled={isSyncing(conn.id) || isMT5Syncing(conn.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                          style={{ background: 'hsl(var(--card) / 0.8)', border: '1px solid hsl(var(--border) / 0.4)' }}
                        >
                          {(isSyncing(conn.id) || isMT5Syncing(conn.id))
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            : <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                          }
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteConnection(conn.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                        style={{ background: 'hsl(0 70% 50% / 0.08)', border: '1px solid hsl(0 70% 50% / 0.2)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Broker Catalog */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-0.5">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Brokers disponibles</span>
          </div>
          <BrokerCatalog
            onConnect={handleConnectBroker}
            onImportCSV={() => setShowImportModal(true)}
            onSync={handleSyncBroker}
            onConnectMT5={handleConnectMT5}
            onSyncMT5={handleSyncMT5Broker}
            syncingIds={syncingMap}
            mt5SyncingIds={mt5SyncingMap}
            connectedBrokers={connectedBrokerCodes}
            mt5ConnectedBrokers={mt5ConnectedBrokerCodes}
          />
        </div>

        {/* API Connect Dialog */}
        <APIConnectDialog
          open={showAPIDialog}
          onOpenChange={setShowAPIDialog}
          broker={apiBroker}
          onTest={handleAPITest}
          onSave={handleAPISave}
        />
        {/* Import Modal */}
        <TradeImportModal open={showImportModal} onOpenChange={setShowImportModal} />

        {/* MT5 Connect Dialog */}
        <MT5ConnectDialog
          open={showMT5Dialog}
          onOpenChange={setShowMT5Dialog}
          broker={mt5Broker}
          onSave={handleSaveMT5}
        />
      </main>
    </PageShell>
  );
}
