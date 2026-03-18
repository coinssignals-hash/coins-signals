import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ExternalLink, Wifi, WifiOff,
  FileSpreadsheet, RefreshCw, Loader2, Check, Globe, Monitor,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BrokerCatalogItem {
  code: string;
  name: string;
  description: string;
  regulation: string;
  assets: string[];
  apiSupported: boolean;
  csvOnly?: boolean;
  affiliateCookie?: string;
  affiliateUrl?: string;
  logoEmoji: string;
  affiliateSteps?: string[];
}

export const BROKER_CATALOG: BrokerCatalogItem[] = [
  {
    code: 'exness', name: 'Exness', description: 'Forex & CFDs',
    regulation: 'FCA, CySEC, ASIC', assets: ['Forex', 'CFDs'],
    apiSupported: false, csvOnly: true, logoEmoji: '💹',
    affiliateSteps: ['Regístrate en Exness con nuestro enlace de afiliado', 'Verifica tu cuenta', 'Descarga tu historial CSV desde MT4/MT5'],
  },
  {
    code: 'oanda', name: 'OANDA', description: 'Forex & CFDs',
    regulation: 'FCA, CFTC, MAS', assets: ['Forex', 'CFDs'],
    apiSupported: true, logoEmoji: '📊',
    affiliateSteps: ['Crea tu cuenta en OANDA', 'Genera tu API Token en Settings > API Management', 'Copia tu Account ID y Token'],
  },
  {
    code: 'vantage', name: 'Vantage', description: 'Forex, CFDs, Acciones',
    regulation: 'ASIC, FCA', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, csvOnly: true, logoEmoji: '🎯',
    affiliateSteps: ['Regístrate en Vantage', 'Accede a tu terminal MT4/MT5', 'Exporta tu historial como CSV'],
  },
  {
    code: 'pepperstone', name: 'Pepperstone', description: 'Forex & CFDs',
    regulation: 'FCA, ASIC, CySEC', assets: ['Forex', 'CFDs'],
    apiSupported: true, affiliateCookie: '45 días', logoEmoji: '🌶️',
    affiliateSteps: ['Abre tu cuenta en Pepperstone', 'Solicita acceso API en tu área de cliente', 'Genera tus credenciales cTrader Open API'],
  },
  {
    code: 'avatrade', name: 'AvaTrade', description: 'Forex, CFDs, Crypto',
    regulation: '9 jurisdicciones', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: true, logoEmoji: '🔵',
    affiliateSteps: ['Regístrate en AvaTrade (AvaPartner)', 'Verifica tu identidad', 'Genera tu API key desde el dashboard'],
  },
  {
    code: 'ic_markets', name: 'IC Markets', description: 'Forex, CFDs, Crypto',
    regulation: 'ASIC, CySEC', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: true, logoEmoji: '🔷',
    affiliateSteps: ['Crea cuenta en IC Markets', 'Accede a cTrader y genera tu API token', 'Configura los permisos de lectura'],
  },
  {
    code: 'alpaca', name: 'Alpaca', description: 'Acciones US, ETFs, Crypto',
    regulation: 'FINRA/SEC', assets: ['Stocks', 'Crypto'],
    apiSupported: true, logoEmoji: '🦙',
    affiliateSteps: ['Regístrate en Alpaca Markets', 'Ve a Settings > API Keys', 'Genera un par de API Key + Secret'],
  },
  {
    code: 'xm', name: 'XM Group', description: 'Forex, CFDs, Acciones',
    regulation: 'CySEC, ASIC, IFSC', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, csvOnly: true, logoEmoji: '🟢',
    affiliateSteps: ['Abre tu cuenta en XM', 'Descarga MT4/MT5', 'Exporta historial > CSV'],
  },
  {
    code: 'roboforex', name: 'RoboForex', description: 'Forex, CFDs, Acciones',
    regulation: 'IFSC Belize', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, csvOnly: true, logoEmoji: '🤖',
    affiliateSteps: ['Regístrate en RoboForex', 'Exporta historial desde tu terminal MT4/MT5'],
  },
  {
    code: 'eightcap', name: 'Eightcap', description: 'Forex, CFDs, Crypto',
    regulation: 'ASIC, FCA, SCB', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, csvOnly: true, logoEmoji: '8️⃣',
    affiliateSteps: ['Crea tu cuenta en Eightcap', 'Descarga MT4/MT5', 'Exporta tu historial como CSV'],
  },
  {
    code: 'tradovate', name: 'Tradovate', description: 'Futuros & Opciones',
    regulation: 'NFA/CFTC', assets: ['Futures'],
    apiSupported: true, affiliateCookie: 'Comisión máx.', logoEmoji: '📈',
    affiliateSteps: ['Regístrate en Tradovate', 'Ve a Settings > API Access', 'Genera tu usuario y contraseña API'],
  },
  {
    code: 'fxpro', name: 'FxPro', description: 'Forex, CFDs',
    regulation: 'FCA, CySEC, DFSA', assets: ['Forex', 'CFDs'],
    apiSupported: false, csvOnly: true, affiliateCookie: 'Lifetime', logoEmoji: '🏛️',
    affiliateSteps: ['Abre cuenta en FxPro', 'Exporta historial desde cTrader o MT4/MT5'],
  },
  {
    code: 'interactive_brokers', name: 'Interactive Brokers', description: 'Multi-activo global',
    regulation: 'SEC, FCA, ASIC', assets: ['Stocks', 'Forex', 'Futures', 'Options'],
    apiSupported: true, logoEmoji: '🏢',
    affiliateSteps: ['Abre cuenta en IBKR', 'Descarga y ejecuta TWS (Trader Workstation)', 'Habilita Client Portal API en configuración', '⚠️ Requiere TWS ejecutándose localmente'],
  },
  {
    code: 'tradestation', name: 'TradeStation', description: 'Multi-activo US',
    regulation: 'SEC, FINRA', assets: ['Stocks', 'Futures', 'Options'],
    apiSupported: true, logoEmoji: '🚉',
    affiliateSteps: ['Crea tu cuenta en TradeStation', 'Registra tu app en developer.tradestation.com', 'Obtén tu OAuth access token'],
  },
];

interface Props {
  onConnect?: (broker: BrokerCatalogItem) => void;
  onImportCSV?: (broker: BrokerCatalogItem) => void;
  onSync?: (broker: BrokerCatalogItem) => void;
  onConnectMT5?: (broker: BrokerCatalogItem) => void;
  onSyncMT5?: (broker: BrokerCatalogItem) => void;
  syncingIds?: Record<string, boolean>;
  mt5SyncingIds?: Record<string, boolean>;
  connectedBrokers?: string[];
  mt5ConnectedBrokers?: string[];
}

// Brokers that support MT4/MT5 terminal (csv-only ones that use MetaTrader)
const MT5_CAPABLE_BROKERS = ['exness', 'vantage', 'xm', 'roboforex', 'eightcap', 'fxpro'];

export function BrokerCatalog({
  onConnect, onImportCSV, onSync, onConnectMT5, onSyncMT5,
  syncingIds = {}, mt5SyncingIds = {}, connectedBrokers = [], mt5ConnectedBrokers = [],
}: Props) {
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {BROKER_CATALOG.map(broker => {
        const isExpanded = expandedBroker === broker.code;
        const isConnected = connectedBrokers.includes(broker.code);
        const isSyncing = syncingIds[broker.code] || false;
        const isMT5Capable = MT5_CAPABLE_BROKERS.includes(broker.code);
        const isMT5Connected = mt5ConnectedBrokers.includes(broker.code);
        const isMT5Syncing = mt5SyncingIds[broker.code] || false;

        return (
          <Card key={broker.code} className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <button
                onClick={() => setExpandedBroker(isExpanded ? null : broker.code)}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
              >
                <span className="text-2xl w-10 h-10 flex items-center justify-center bg-secondary/50 rounded-lg">
                  {broker.logoEmoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{broker.name}</span>
                    {isConnected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {broker.description} · {broker.regulation}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {broker.apiSupported ? (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold flex items-center gap-0.5">
                      <Wifi className="w-2.5 h-2.5" /> API
                    </span>
                  ) : (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold flex items-center gap-0.5">
                      <FileSpreadsheet className="w-2.5 h-2.5" /> CSV
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Asset tags */}
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {broker.assets.map(a => (
                  <span key={a} className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {a}
                  </span>
                ))}
                {broker.affiliateCookie && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                    🍪 {broker.affiliateCookie}
                  </span>
                )}
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      {/* Affiliate steps */}
                      {broker.affiliateSteps && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Pasos para conectar
                          </span>
                          {broker.affiliateSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-primary w-4 flex-shrink-0">{i + 1}.</span>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {broker.apiSupported && (
                          <Button
                            size="sm"
                            onClick={() => onConnect?.(broker)}
                            className="flex-1 text-xs h-8"
                            variant={isConnected ? 'secondary' : 'default'}
                          >
                            {isConnected ? (
                              <><Check className="w-3 h-3 mr-1" /> Conectado</>
                            ) : (
                              <><Wifi className="w-3 h-3 mr-1" /> Conectar API</>
                            )}
                          </Button>
                        )}
                        {isMT5Capable && (
                          <Button
                            size="sm"
                            onClick={() => isMT5Connected ? onSyncMT5?.(broker) : onConnectMT5?.(broker)}
                            className="flex-1 text-xs h-8"
                            variant={isMT5Connected ? 'secondary' : 'default'}
                            disabled={isMT5Syncing}
                          >
                            {isMT5Syncing ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sincronizando...</>
                            ) : isMT5Connected ? (
                              <><RefreshCw className="w-3 h-3 mr-1" /> Sync MT5</>
                            ) : (
                              <><Monitor className="w-3 h-3 mr-1" /> Conectar MT5</>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onImportCSV?.(broker)}
                          className="flex-1 text-xs h-8"
                        >
                          <FileSpreadsheet className="w-3 h-3 mr-1" /> Importar CSV
                        </Button>
                        {broker.apiSupported && isConnected && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSync?.(broker)}
                            disabled={isSyncing}
                            className="text-xs h-8"
                          >
                            {isSyncing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}

      {/* Generic CSV */}
      <Card className="bg-card border-border">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl w-10 h-10 flex items-center justify-center bg-secondary/50 rounded-lg">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </span>
            <div>
              <span className="text-sm font-semibold text-foreground">Otro broker</span>
              <p className="text-[10px] text-muted-foreground">Cualquier CSV genérico</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onImportCSV?.({ code: 'generic', name: 'Genérico', description: '', regulation: '', assets: [], apiSupported: false, logoEmoji: '📄' })}
            className="text-xs h-8"
          >
            <FileSpreadsheet className="w-3 h-3 mr-1" /> CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
