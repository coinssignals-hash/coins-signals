import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ExternalLink, Wifi, WifiOff,
  FileSpreadsheet, RefreshCw, Loader2, Check, Globe, Monitor,
} from 'lucide-react';
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

// Unique accent colors per broker for visual variety
const BROKER_COLORS: Record<string, string> = {
  exness: '200 85% 55%',
  oanda: '35 90% 55%',
  vantage: '280 75% 60%',
  pepperstone: '0 80% 58%',
  avatrade: '220 85% 60%',
  ic_markets: '195 85% 55%',
  alpaca: '150 75% 50%',
  xm: '140 75% 50%',
  roboforex: '260 80% 60%',
  eightcap: '170 80% 48%',
  tradovate: '45 90% 52%',
  fxpro: '310 70% 58%',
  interactive_brokers: '25 85% 55%',
  tradestation: '235 80% 62%',
};

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

const MT5_CAPABLE_BROKERS = ['exness', 'vantage', 'xm', 'roboforex', 'eightcap', 'fxpro'];

export function BrokerCatalog({
  onConnect, onImportCSV, onSync, onConnectMT5, onSyncMT5,
  syncingIds = {}, mt5SyncingIds = {}, connectedBrokers = [], mt5ConnectedBrokers = [],
}: Props) {
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {BROKER_CATALOG.map(broker => {
        const isExpanded = expandedBroker === broker.code;
        const isConnected = connectedBrokers.includes(broker.code);
        const isSyncing = syncingIds[broker.code] || false;
        const isMT5Capable = MT5_CAPABLE_BROKERS.includes(broker.code);
        const isMT5Connected = mt5ConnectedBrokers.includes(broker.code);
        const isMT5Syncing = mt5SyncingIds[broker.code] || false;
        const color = BROKER_COLORS[broker.code] || '210 70% 55%';

        return (
          <div
            key={broker.code}
            className="relative rounded-2xl overflow-hidden transition-all"
            style={{
              background: `linear-gradient(165deg, hsl(${color} / ${isExpanded ? '0.12' : '0.06'}) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
              border: `1px solid hsl(${color} / ${isExpanded ? '0.35' : '0.15'})`,
            }}
          >
            {/* Top glow line */}
            <div
              className="absolute top-0 inset-x-0 h-[2px] z-[1]"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(${color} / ${isExpanded ? '0.8' : '0.4'}), transparent)`,
              }}
            />

            {/* Subtle radial glow */}
            {isExpanded && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none"
                style={{ background: `radial-gradient(circle, hsl(${color} / 0.4), transparent 70%)` }}
              />
            )}

            {/* Header */}
            <button
              onClick={() => setExpandedBroker(isExpanded ? null : broker.code)}
              className="w-full relative z-[2] p-3 flex items-center gap-3 text-left transition-colors active:scale-[0.99]"
            >
              {/* Logo with accent gradient */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${color} / 0.2), hsl(${color} / 0.06))`,
                  border: `1px solid hsl(${color} / 0.25)`,
                  boxShadow: `0 4px 12px hsl(${color} / 0.1)`,
                }}
              >
                {broker.logoEmoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{broker.name}</span>
                  {isConnected && (
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      style={{ background: 'hsl(140 70% 45% / 0.15)', color: 'hsl(140 70% 50%)' }}
                    >
                      ● Activo
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {broker.description} · {broker.regulation}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Connection type badge */}
                <span
                  className="text-[8px] px-2 py-1 rounded-full font-bold flex items-center gap-0.5 uppercase tracking-wider"
                  style={{
                    background: broker.apiSupported
                      ? `hsl(${color} / 0.12)`
                      : 'hsl(var(--muted) / 0.3)',
                    color: broker.apiSupported
                      ? `hsl(${color})`
                      : 'hsl(var(--muted-foreground))',
                    border: `1px solid ${broker.apiSupported
                      ? `hsl(${color} / 0.25)`
                      : 'hsl(var(--border))'}`,
                  }}
                >
                  {broker.apiSupported ? (
                    <><Wifi className="w-2.5 h-2.5" /> API</>
                  ) : (
                    <><FileSpreadsheet className="w-2.5 h-2.5" /> CSV</>
                  )}
                </span>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </div>
            </button>

            {/* Asset tags */}
            <div className="relative z-[2] px-3 pb-2 flex flex-wrap gap-1">
              {broker.assets.map(a => (
                <span
                  key={a}
                  className="text-[8px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={{
                    background: `hsl(${color} / 0.08)`,
                    color: `hsl(${color})`,
                  }}
                >
                  {a}
                </span>
              ))}
              {broker.affiliateCookie && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ background: 'hsl(45 90% 55% / 0.1)', color: 'hsl(45 90% 55%)' }}
                >
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
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="relative z-[2] px-3 pb-4 space-y-3">
                    {/* Divider */}
                    <div className="h-[1px]" style={{ background: `linear-gradient(90deg, transparent, hsl(${color} / 0.3), transparent)` }} />

                    {/* Steps */}
                    {broker.affiliateSteps && (
                      <div className="space-y-2">
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1"
                          style={{ color: `hsl(${color})` }}
                        >
                          Pasos para conectar
                        </span>
                        {broker.affiliateSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                              style={{
                                background: `hsl(${color} / 0.12)`,
                                color: `hsl(${color})`,
                                border: `1px solid hsl(${color} / 0.25)`,
                              }}
                            >
                              {i + 1}
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons — pill style */}
                    <div className="flex flex-wrap gap-2">
                      {isMT5Capable && (
                        <button
                          onClick={() => isMT5Connected ? onSyncMT5?.(broker) : onConnectMT5?.(broker)}
                          disabled={isMT5Syncing}
                          className="flex-1 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                          style={{
                            background: isMT5Connected
                              ? 'hsl(var(--card) / 0.8)'
                              : `linear-gradient(135deg, hsl(${color}), hsl(${color} / 0.8))`,
                            color: isMT5Connected ? `hsl(${color})` : 'hsl(var(--background))',
                            border: `1px solid hsl(${color} / ${isMT5Connected ? '0.3' : '0.5'})`,
                            boxShadow: isMT5Connected ? 'none' : `0 4px 12px hsl(${color} / 0.2)`,
                          }}
                        >
                          {isMT5Syncing ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sincronizando...</>
                          ) : isMT5Connected ? (
                            <><RefreshCw className="w-3.5 h-3.5" /> Sync MT5</>
                          ) : (
                            <><Monitor className="w-3.5 h-3.5" /> Conectar MT5</>
                          )}
                        </button>
                      )}
                      {broker.apiSupported && (
                        <button
                          onClick={() => onConnect?.(broker)}
                          className="flex-1 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          style={{
                            background: isConnected
                              ? 'hsl(var(--card) / 0.8)'
                              : `linear-gradient(135deg, hsl(${color}), hsl(${color} / 0.8))`,
                            color: isConnected ? 'hsl(140 70% 50%)' : 'hsl(var(--background))',
                            border: `1px solid hsl(${isConnected ? '140 70% 50%' : color} / 0.3)`,
                            boxShadow: isConnected ? 'none' : `0 4px 12px hsl(${color} / 0.2)`,
                          }}
                        >
                          {isConnected ? (
                            <><Check className="w-3.5 h-3.5" /> Conectado</>
                          ) : (
                            <><Wifi className="w-3.5 h-3.5" /> Conectar API</>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onImportCSV?.(broker)}
                        className="flex-1 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        style={{
                          background: 'hsl(var(--card) / 0.8)',
                          border: '1px solid hsl(var(--border) / 0.5)',
                          color: 'hsl(var(--foreground))',
                        }}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Importar CSV
                      </button>
                      {broker.apiSupported && isConnected && (
                        <button
                          onClick={() => onSync?.(broker)}
                          disabled={isSyncing}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                          style={{
                            background: 'hsl(var(--card) / 0.8)',
                            border: `1px solid hsl(${color} / 0.3)`,
                          }}
                        >
                          {isSyncing ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <RefreshCw className="w-4 h-4" style={{ color: `hsl(${color})` }} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Generic CSV */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, hsl(var(--muted) / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)',
          border: '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        <div className="relative z-[2] p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--muted) / 0.2), hsl(var(--muted) / 0.06))',
                border: '1px solid hsl(var(--border) / 0.3)',
              }}
            >
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">Otro broker</span>
              <p className="text-[10px] text-muted-foreground">Cualquier CSV genérico</p>
            </div>
          </div>
          <button
            onClick={() => onImportCSV?.({ code: 'generic', name: 'Genérico', description: '', regulation: '', assets: [], apiSupported: false, logoEmoji: '📄' })}
            className="py-2 px-4 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={{
              background: 'hsl(var(--card) / 0.8)',
              border: '1px solid hsl(var(--border) / 0.5)',
              color: 'hsl(var(--foreground))',
            }}
          >
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
