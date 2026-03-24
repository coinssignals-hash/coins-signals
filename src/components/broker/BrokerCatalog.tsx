import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ExternalLink, Wifi, WifiOff,
  FileSpreadsheet, RefreshCw, Loader2, Check, Globe, Monitor,
  Zap, Shield, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlowSection } from '@/components/ui/glow-section';
import { ScrollFadeTabs } from '@/components/ui/ScrollFadeTabs';

export interface BrokerCatalogItem {
  code: string;
  name: string;
  description: string;
  regulation: string;
  assets: string[];
  apiSupported: boolean;
  csvOnly?: boolean;
  affiliateUrl?: string;
  logoEmoji: string;
  affiliateSteps?: string[];
  category: 'mt_native' | 'mt_metaapi' | 'institutional' | 'api_rest' | 'latam';
  latam?: boolean;
}

// ─── MT4/MT5 con API propia ────────────────────────────
const MT_NATIVE_BROKERS: BrokerCatalogItem[] = [
  {
    code: 'ic_markets', name: 'IC Markets', description: 'True ECN, spreads desde 0.0',
    regulation: 'ASIC, CySEC, FSA', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, logoEmoji: '🔷', category: 'mt_native',
    affiliateSteps: ['Crea tu cuenta en IC Markets', 'Descarga MT4 o MT5', 'Obtén tu servidor y credenciales de lectura'],
  },
  {
    code: 'oanda', name: 'OANDA', description: 'Forex & CFDs — 180+ países',
    regulation: 'FCA, CFTC, MAS', assets: ['Forex', 'CFDs'],
    apiSupported: true, logoEmoji: '📊', category: 'mt_native',
    affiliateSteps: ['Crea tu cuenta en OANDA', 'Descarga MT4/MT5 o usa API REST', 'Ingresa servidor y login'],
  },
  {
    code: 'pepperstone', name: 'Pepperstone', description: 'Ejecución ultra rápida',
    regulation: 'FCA, ASIC, CySEC', assets: ['Forex', 'CFDs', 'Indices'],
    apiSupported: false, logoEmoji: '🌶️', category: 'mt_native',
    affiliateSteps: ['Abre tu cuenta en Pepperstone', 'Descarga MT4/MT5', 'Ingresa servidor y contraseña investor'],
  },
  {
    code: 'xm', name: 'XM Group', description: '1000+ instrumentos',
    regulation: 'CySEC, ASIC, IFSC', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, logoEmoji: '🟢', category: 'mt_native', latam: true,
    affiliateSteps: ['Abre tu cuenta en XM', 'Descarga MT4/MT5 desde tu área de cliente', 'Copia el nombre del servidor y login'],
  },
  {
    code: 'exness', name: 'Exness', description: 'Retiros instantáneos',
    regulation: 'FCA, CySEC, FSCA', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '💹', category: 'mt_native', latam: true,
    affiliateSteps: ['Regístrate en Exness', 'Abre una cuenta de trading MT4/MT5', 'Usa la contraseña investor (solo lectura)'],
  },
  {
    code: 'fp_markets', name: 'FP Markets', description: 'ECN desde 2005',
    regulation: 'ASIC, CySEC', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, logoEmoji: '🏔️', category: 'mt_native',
    affiliateSteps: ['Crea cuenta en FP Markets', 'Descarga MT4/MT5', 'Conecta con tu servidor y login'],
  },
  {
    code: 'fusion_markets', name: 'Fusion Markets', description: 'Comisiones ultra bajas',
    regulation: 'ASIC, VFSC', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '⚡', category: 'mt_native',
    affiliateSteps: ['Regístrate en Fusion Markets', 'Descarga MT4/MT5', 'Ingresa servidor y credenciales'],
  },
  {
    code: 'blackbull', name: 'BlackBull Markets', description: 'ECN institucional',
    regulation: 'FMA, FSA', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, logoEmoji: '🐂', category: 'mt_native',
    affiliateSteps: ['Crea cuenta en BlackBull', 'Descarga MT4/MT5', 'Usa tus credenciales investor'],
  },
  {
    code: 'admirals', name: 'Admirals', description: 'Regulado en EU',
    regulation: 'FCA, CySEC, ASIC', assets: ['Forex', 'CFDs', 'Stocks', 'ETFs'],
    apiSupported: false, logoEmoji: '⚓', category: 'mt_native',
    affiliateSteps: ['Abre cuenta en Admirals', 'Descarga MT5 Supreme Edition', 'Conecta con servidor y login'],
  },
  {
    code: 'fxopen', name: 'FxOpen', description: 'ECN desde 2005',
    regulation: 'FCA, ASIC', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, logoEmoji: '🔓', category: 'mt_native',
    affiliateSteps: ['Regístrate en FxOpen', 'Descarga MT4/MT5', 'Conecta con tus credenciales'],
  },
];

// ─── MT4/MT5 vía MetaAPI (sin API propia) ──────────────
const MT_METAAPI_BROKERS: BrokerCatalogItem[] = [
  {
    code: 'avatrade', name: 'AvaTrade', description: 'Forex, CFDs, Crypto',
    regulation: '9 jurisdicciones', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, logoEmoji: '🔵', category: 'mt_metaapi', latam: true,
    affiliateSteps: ['Regístrate en AvaTrade', 'Descarga MT4/MT5', 'Ingresa servidor y contraseña investor'],
  },
  {
    code: 'hotforex', name: 'HotForex (HFM)', description: 'Premiado globalmente',
    regulation: 'FCA, FSCA, FSA', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, logoEmoji: '🔥', category: 'mt_metaapi', latam: true,
    affiliateSteps: ['Crea cuenta en HFM', 'Descarga MT4/MT5', 'Conecta con tu servidor y login'],
  },
  {
    code: 'fbs', name: 'FBS', description: 'Popular en LATAM',
    regulation: 'IFSC, CySEC', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '🎯', category: 'mt_metaapi', latam: true,
    affiliateSteps: ['Regístrate en FBS', 'Descarga MT4/MT5', 'Usa tus credenciales de acceso'],
  },
  {
    code: 'roboforex', name: 'RoboForex', description: 'Apalancamiento alto',
    regulation: 'IFSC Belize', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, logoEmoji: '🤖', category: 'mt_metaapi',
    affiliateSteps: ['Regístrate en RoboForex', 'Descarga MT4/MT5', 'Conecta con servidor y login'],
  },
  {
    code: 'alpari', name: 'Alpari', description: 'Desde 1998',
    regulation: 'FSC', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '🅰️', category: 'mt_metaapi',
    affiliateSteps: ['Crea cuenta en Alpari', 'Descarga MT4/MT5', 'Ingresa datos de conexión'],
  },
  {
    code: 'thinkmarkets', name: 'ThinkMarkets', description: 'ThinkTrader premiado',
    regulation: 'FCA, ASIC', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, logoEmoji: '💭', category: 'mt_metaapi',
    affiliateSteps: ['Regístrate en ThinkMarkets', 'Descarga MT4/MT5', 'Usa credenciales investor'],
  },
  {
    code: 'fxgt', name: 'FXGT', description: 'Forex, CFDs, Crypto híbrido',
    regulation: 'FSA, VFSC', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, logoEmoji: '🔶', category: 'mt_metaapi',
    affiliateSteps: ['Crea cuenta en FXGT', 'Descarga MT5', 'Conecta con servidor y login'],
  },
  {
    code: 'tickmill', name: 'Tickmill', description: 'Spreads ultra bajos',
    regulation: 'FCA, CySEC, FSA', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '✅', category: 'mt_metaapi',
    affiliateSteps: ['Regístrate en Tickmill', 'Descarga MT4/MT5', 'Ingresa credenciales'],
  },
  {
    code: 'vantage', name: 'Vantage FX', description: 'ASIC regulado',
    regulation: 'ASIC, FCA', assets: ['Forex', 'CFDs', 'Stocks'],
    apiSupported: false, logoEmoji: '🎯', category: 'mt_metaapi',
    affiliateSteps: ['Regístrate en Vantage', 'Descarga MT4/MT5', 'Usa credenciales investor'],
  },
  {
    code: 'fxtm', name: 'FXTM', description: 'ForexTime',
    regulation: 'FCA, CySEC, FSCA', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '⏱️', category: 'mt_metaapi', latam: true,
    affiliateSteps: ['Crea cuenta en FXTM', 'Descarga MT4/MT5', 'Conecta con servidor y login'],
  },
  {
    code: 'octafx', name: 'OctaFX', description: 'Copy trading',
    regulation: 'CySEC', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '🐙', category: 'mt_metaapi', latam: true,
    affiliateSteps: ['Regístrate en OctaFX', 'Descarga MT4/MT5', 'Ingresa datos de tu cuenta'],
  },
  {
    code: 'litefinance', name: 'LiteFinance', description: 'Social trading',
    regulation: 'SVG FSA', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '💡', category: 'mt_metaapi',
    affiliateSteps: ['Crea cuenta en LiteFinance', 'Descarga MT4/MT5', 'Conecta con credenciales'],
  },
  {
    code: 'weltrade', name: 'Weltrade', description: 'Desde 2006',
    regulation: 'SVG FSA', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '🌍', category: 'mt_metaapi',
    affiliateSteps: ['Regístrate en Weltrade', 'Descarga MT4/MT5', 'Usa tus credenciales investor'],
  },
  {
    code: 'nordfx', name: 'NordFX', description: 'Nórdico & Crypto',
    regulation: 'VFSC', assets: ['Forex', 'CFDs', 'Crypto'],
    apiSupported: false, logoEmoji: '❄️', category: 'mt_metaapi',
    affiliateSteps: ['Crea cuenta en NordFX', 'Descarga MT4/MT5', 'Ingresa datos de conexión'],
  },
  {
    code: 'amarkets', name: 'AMarkets', description: 'ECN/STP',
    regulation: 'FSA', assets: ['Forex', 'CFDs'],
    apiSupported: false, logoEmoji: '🅰️', category: 'mt_metaapi',
    affiliateSteps: ['Regístrate en AMarkets', 'Descarga MT4/MT5', 'Conecta con tus credenciales'],
  },
];

// ─── Institucionales ───────────────────────────────────
const INSTITUTIONAL_BROKERS: BrokerCatalogItem[] = [
  {
    code: 'interactive_brokers', name: 'Interactive Brokers', description: 'Multi-activo global — TWS API',
    regulation: 'SEC, FCA, ASIC', assets: ['Stocks', 'Forex', 'Futures', 'Options'],
    apiSupported: true, logoEmoji: '🏢', category: 'institutional',
    affiliateSteps: ['Abre cuenta en IBKR', 'Habilita Client Portal API', '⚠️ Requiere TWS ejecutándose'],
  },
  {
    code: 'saxo_bank', name: 'Saxo Bank', description: 'Multi-activo — OpenAPI',
    regulation: 'DFSA, MAS, FSA', assets: ['Forex', 'Stocks', 'Futures', 'Bonds'],
    apiSupported: true, logoEmoji: '🏦', category: 'institutional',
    affiliateSteps: ['Abre cuenta en Saxo Bank', 'Solicita acceso a OpenAPI', 'Genera tus credenciales'],
  },
  {
    code: 'fxcm', name: 'FXCM', description: 'Forex & CFDs — REST API',
    regulation: 'FCA, ASIC', assets: ['Forex', 'CFDs'],
    apiSupported: true, logoEmoji: '📐', category: 'institutional',
    affiliateSteps: ['Crea cuenta en FXCM', 'Accede a la REST API', 'Genera tu token de acceso'],
  },
  {
    code: 'swissquote', name: 'Swissquote', description: 'Multi-activo suizo — FIX API',
    regulation: 'FINMA', assets: ['Forex', 'Stocks', 'CFDs', 'Crypto'],
    apiSupported: true, logoEmoji: '🇨🇭', category: 'institutional',
    affiliateSteps: ['Abre cuenta en Swissquote', 'Solicita acceso FIX', 'Configura conexión FIX'],
  },
  {
    code: 'lmax', name: 'LMAX', description: 'FIX API institucional',
    regulation: 'FCA', assets: ['Forex', 'CFDs'],
    apiSupported: true, logoEmoji: '🏛️', category: 'institutional',
    affiliateSteps: ['Solicita cuenta institucional en LMAX', 'Recibe credenciales FIX', 'Configura tu conexión'],
  },
];

// ─── API REST nativos ──────────────────────────────────
const API_REST_BROKERS: BrokerCatalogItem[] = [
  {
    code: 'alpaca', name: 'Alpaca', description: 'Acciones US, ETFs, Crypto',
    regulation: 'FINRA/SEC', assets: ['Stocks', 'Crypto'],
    apiSupported: true, logoEmoji: '🦙', category: 'api_rest',
    affiliateSteps: ['Regístrate en Alpaca Markets', 'Ve a Settings > API Keys', 'Genera API Key + Secret'],
  },
  {
    code: 'oanda', name: 'OANDA (API)', description: 'Forex & CFDs — REST API v20',
    regulation: 'FCA, CFTC, MAS', assets: ['Forex', 'CFDs'],
    apiSupported: true, logoEmoji: '📊', category: 'api_rest',
    affiliateSteps: ['Crea tu cuenta en OANDA', 'Ve a Settings > API Management', 'Genera tu API Token'],
  },
];

// ─── All brokers combined ──────────────────────────────
export const BROKER_CATALOG: BrokerCatalogItem[] = [
  ...MT_NATIVE_BROKERS,
  ...MT_METAAPI_BROKERS,
  ...INSTITUTIONAL_BROKERS,
  ...API_REST_BROKERS,
];

// All MT-capable brokers (for MT5ConnectDialog)
export const MT5_CAPABLE_BROKERS = [
  ...MT_NATIVE_BROKERS.map(b => b.code),
  ...MT_METAAPI_BROKERS.map(b => b.code),
];

// LATAM popular subset
const LATAM_BROKERS = BROKER_CATALOG.filter(b => b.latam);

// Accent colors per broker
const BROKER_COLORS: Record<string, string> = {
  ic_markets: '195 85% 55%',
  oanda: '35 90% 55%',
  pepperstone: '0 80% 58%',
  xm: '140 75% 50%',
  exness: '200 85% 55%',
  fp_markets: '170 80% 48%',
  fusion_markets: '45 85% 52%',
  blackbull: '25 80% 50%',
  admirals: '220 75% 55%',
  fxopen: '310 70% 55%',
  avatrade: '220 85% 60%',
  hotforex: '15 85% 55%',
  fbs: '340 75% 55%',
  roboforex: '260 80% 60%',
  alpari: '210 70% 55%',
  thinkmarkets: '175 70% 50%',
  fxgt: '30 85% 55%',
  tickmill: '145 70% 50%',
  vantage: '280 75% 60%',
  fxtm: '195 75% 50%',
  octafx: '270 70% 55%',
  litefinance: '50 80% 52%',
  weltrade: '160 70% 48%',
  nordfx: '205 80% 60%',
  amarkets: '350 70% 55%',
  alpaca: '150 75% 50%',
  interactive_brokers: '25 85% 55%',
  saxo_bank: '210 80% 55%',
  fxcm: '0 70% 55%',
  swissquote: '350 80% 55%',
  lmax: '230 70% 55%',
};

// ─── Tab categories ────────────────────────────────────
type TabKey = 'mt_native' | 'mt_metaapi' | 'latam' | 'institutional' | 'api_rest';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; brokers: BrokerCatalogItem[] }[] = [
  { key: 'mt_native', label: 'MT4/MT5 API', icon: <Monitor className="w-3.5 h-3.5" />, brokers: MT_NATIVE_BROKERS },
  { key: 'mt_metaapi', label: 'MetaAPI', icon: <Zap className="w-3.5 h-3.5" />, brokers: MT_METAAPI_BROKERS },
  { key: 'latam', label: 'LATAM', icon: <Globe className="w-3.5 h-3.5" />, brokers: LATAM_BROKERS },
  { key: 'institutional', label: 'Institucional', icon: <Building2 className="w-3.5 h-3.5" />, brokers: INSTITUTIONAL_BROKERS },
  { key: 'api_rest', label: 'API REST', icon: <Wifi className="w-3.5 h-3.5" />, brokers: API_REST_BROKERS },
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

export function BrokerCatalog({
  onConnect, onImportCSV, onSync, onConnectMT5, onSyncMT5,
  syncingIds = {}, mt5SyncingIds = {}, connectedBrokers = [], mt5ConnectedBrokers = [],
}: Props) {
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('mt_native');

  const currentTab = TABS.find(t => t.key === activeTab) || TABS[0];

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setExpandedBroker(null); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0',
                isActive
                  ? 'text-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))',
                border: '1px solid hsl(var(--primary) / 0.3)',
                boxShadow: '0 2px 8px hsl(var(--primary) / 0.15)',
              } : {
                background: 'hsl(var(--card) / 0.5)',
                border: '1px solid hsl(var(--border) / 0.3)',
              }}
            >
              {tab.icon}
              {tab.label}
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted) / 0.3)',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
              >
                {tab.brokers.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category description */}
      <div
        className="rounded-xl px-3 py-2 flex items-center gap-2"
        style={{
          background: 'hsl(var(--card) / 0.6)',
          border: '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        <Shield className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {activeTab === 'mt_native' && 'Brokers con servidor MetaTrader propio. Conexión directa vía MetaAPI con credenciales investor (solo lectura).'}
          {activeTab === 'mt_metaapi' && 'Brokers sin API REST propia. Se conectan mediante MetaAPI como puente para sincronizar operaciones MT4/MT5.'}
          {activeTab === 'latam' && 'Brokers populares en Latinoamérica con soporte en español y depósitos locales.'}
          {activeTab === 'institutional' && 'Brokers institucionales con FIX API o REST API profesional. Requieren cuentas verificadas.'}
          {activeTab === 'api_rest' && 'Brokers con API REST nativa. Conexión directa sin MetaAPI — más rápida y confiable.'}
        </p>
      </div>

      {/* Broker cards */}
      {currentTab.brokers.map(broker => {
        const isExpanded = expandedBroker === broker.code;
        const isConnected = connectedBrokers.includes(broker.code);
        const isSyncing = syncingIds[broker.code] || false;
        const isMT5Capable = MT5_CAPABLE_BROKERS.includes(broker.code);
        const isMT5Connected = mt5ConnectedBrokers.includes(broker.code);
        const isMT5Syncing = mt5SyncingIds[broker.code] || false;
        const color = BROKER_COLORS[broker.code] || '210 70% 55%';

        return (
          <div key={broker.code}>
            <GlowSection color={color}>
            {/* Top glow line is provided by GlowSection */}

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
                  {(isConnected || isMT5Connected) && (
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      style={{ background: 'hsl(140 70% 45% / 0.15)', color: 'hsl(140 70% 50%)' }}
                    >
                      ● Activo
                    </span>
                  )}
                  {broker.latam && (
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'hsl(45 90% 55% / 0.1)', color: 'hsl(45 90% 55%)' }}
                    >
                      🌎
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {broker.description} · {broker.regulation}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-[8px] px-2 py-1 rounded-full font-bold flex items-center gap-0.5 uppercase tracking-wider"
                  style={{
                    background: isMT5Capable
                      ? `hsl(${color} / 0.12)`
                      : broker.apiSupported
                      ? `hsl(${color} / 0.12)`
                      : 'hsl(var(--muted) / 0.3)',
                    color: isMT5Capable || broker.apiSupported
                      ? `hsl(${color})`
                      : 'hsl(var(--muted-foreground))',
                    border: `1px solid ${isMT5Capable || broker.apiSupported
                      ? `hsl(${color} / 0.25)`
                      : 'hsl(var(--border))'}`,
                  }}
                >
                  {isMT5Capable ? (
                    <><Monitor className="w-2.5 h-2.5" /> MT</>
                  ) : broker.apiSupported ? (
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

                    {/* Action buttons */}
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
                            <><Monitor className="w-3.5 h-3.5" /> Conectar MT4/MT5</>
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
          </GlowSection>
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
            onClick={() => onImportCSV?.({ code: 'generic', name: 'Genérico', description: '', regulation: '', assets: [], apiSupported: false, logoEmoji: '📄', category: 'api_rest' })}
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
