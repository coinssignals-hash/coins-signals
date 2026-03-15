import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Search, TrendingUp, BarChart3, Gem, LineChart, Bitcoin, Star, Check, X, ChevronDown, ChevronUp, GitCompare, CheckCircle2, XCircle, ArrowUpDown, Landmark, CandlestickChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

import igGroupLogo from '@/assets/brokers/ig-group.png';
import xtbLogo from '@/assets/brokers/xtb.png';
import pepperstoneLogo from '@/assets/brokers/pepperstone.png';
import oandaLogo from '@/assets/brokers/oanda.png';
import etoroLogo from '@/assets/brokers/etoro.png';
import plus500Logo from '@/assets/brokers/plus500.png';
import ibLogo from '@/assets/brokers/interactive-brokers.png';
import exnessLogo from '@/assets/brokers/exness.png';
import saxoLogo from '@/assets/brokers/saxo-bank.png';
import avatradeLogo from '@/assets/brokers/avatrade.png';

const BROKER_LOGOS: Record<string, string> = {
  '1': igGroupLogo,
  '2': xtbLogo,
  '3': pepperstoneLogo,
  '4': oandaLogo,
  '5': etoroLogo,
  '6': plus500Logo,
  '7': ibLogo,
  '8': exnessLogo,
  '9': saxoLogo,
  '10': avatradeLogo,
};

const CATEGORY_COLORS: Record<string, string> = {
  forex: 'hsl(200, 90%, 50%)',
  stocks: 'hsl(270, 70%, 55%)',
  commodities: 'hsl(45, 90%, 55%)',
  futures: 'hsl(160, 70%, 50%)',
  crypto: 'hsl(25, 90%, 55%)',
};

const getCategoriesTranslated = (t: (key: string) => string) => [
  { icon: CandlestickChart, label: t('broker_cat_forex'), sublabel: t('broker_cat_forex_sub'), colorKey: 'forex' },
  { icon: BarChart3, label: t('broker_cat_stocks'), sublabel: t('broker_cat_stocks_sub'), colorKey: 'stocks' },
  { icon: Gem, label: t('broker_cat_commodities'), sublabel: t('broker_cat_commodities_sub'), colorKey: 'commodities' },
  { icon: TrendingUp, label: t('broker_cat_futures'), sublabel: t('broker_cat_futures_sub'), colorKey: 'futures' },
  { icon: Bitcoin, label: t('broker_cat_crypto'), sublabel: '', colorKey: 'crypto' },
];

const brokers = [
  {
    id: '1',
    name: 'IG Group',
    logo: 'IG',
    level: 'Principiante',
    depositMin: '10 $',
    commission: '0.0',
    spreads: '0.9 pips',
    platform: ['Web', 'App', 'MT5'],
    leverage: { scb: '1:200', fca: '1:30' },
    regulations: ['ASIC', 'CySEC', 'FSA'],
    instruments: ['Forex', 'Acciones', 'Materias Primas'],
    central: 'London',
    regions: 'Europa + de 150 países',
    rating: 4.5,
    founded: 2007,
    description: 'Fundado en 2007 en Sídney, Australia, IC Markets es uno de los brokers de Forex y CFDs más grandes del mundo por volumen, famoso por su entorno de trading True ECN. IG Group (originalmente IG Index) fue fundado en 1974 en Londres (Reino Unido) por Stuart Wheeler, siendo pionero en ofrecer spread betting como alternativa a comprar oro físico.',
    pros: ['2800+ Traded Assets', 'Unlimited Demo Account', 'Competitive Spreads', 'Regulated by Reputable Authorities', 'Wide Range of Tradable CFD Instruments'],
    cons: ['Limited Educational Resources', 'High Leverage Poses Risks'],
    mainRegion: 'Sidney, Australia',
    operatingCountries: 'Global, Todos los países con restricción en algunas jurisdicciones',
    allRegulations: [
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
      { name: 'CySEC', desc: 'Cyprus Securities and Exchange Commission' },
      { name: 'DFSA', desc: 'Dubai Financial Services Authority' },
      { name: 'EFSA', desc: 'Estonian Financial Supervision Authority' },
      { name: 'FCA', desc: 'Financial Conduct Authority' },
      { name: 'FMA', desc: 'Financial Markets Authority' },
      { name: 'FSA (SC)', desc: 'Financial Services Authority – Seychelles' },
      { name: 'FSCA', desc: 'Financial Sector Conduct Authority' },
      { name: 'FSC', desc: 'Financial Services Commission' },
      { name: 'JFSA', desc: 'Japan Financial Services Agency' },
      { name: 'MAS', desc: 'Monetary Authority of Singapore' },
      { name: 'MiFID', desc: 'Markets in Financial Instruments Directive' },
    ],
    instrumentTypes: [
      { name: 'INDICES', desc: 'S&P 500, Nasdaq 100, IBEX 35, Dow 30 +' },
      { name: 'FUTUROS', desc: 'Gas Natural, Gasolina +' },
      { name: 'FOREX', desc: 'USD-JPY, EUR-USD, USD-CAD, GBP-USD' },
      { name: 'ACCIONES', desc: 'Apple Inc, BBVA, Nvidia, Netflix, Amazon +' },
      { name: 'CRIPTOMONEDAS', desc: 'Bitcoin, Ethereum, Solana, XRP' },
      { name: 'BONOS', desc: 'Microsoft, Boeing, GameStop Vodafone' },
      { name: 'ETF', desc: 'Vanguard Total Stock, Invesco QQQ, S&P 500' },
      { name: 'OPCIONES', desc: 'Financial Sector Conduct Authority' },
    ],
    platforms: [
      { name: 'Plataforma propia', desc: 'Plataforma en la Web. No requiere instalación' },
      { name: 'Aplicación Móviles', desc: 'App para Android e iOS' },
      { name: 'MetaTrader', desc: 'MetaTrader 4 y 5' },
      { name: 'Plataforma en la Web', desc: 'Operación desde Chrome, Safari, Internet Explorer' },
      { name: 'Integración', desc: 'ProRealTime, TradingView' },
    ],
    accountTypes: [
      { name: 'Cuenta Demo', desc: 'Cuenta para practicar tus estrategias sin pérdidas' },
      { name: 'Cuenta Segregada', desc: 'Cuenta especial para cuentas y spreads' },
      { name: 'Cuenta Standar', desc: 'Cuenta real con apalancamiento y todas las herramientas' },
      { name: 'Cuenta Principiantes', desc: 'Cuentas con herramientas especial y Spread bajos' },
      { name: 'Cuentas Profesional', desc: 'Cuentas para profesionales con todos los instrumentos' },
    ],
  },
  {
    id: '2',
    name: 'XTB',
    logo: 'XTB',
    level: 'Principiante',
    depositMin: '0.0 $',
    commission: '0.0',
    spreads: '0.7 pips',
    platform: ['XStation', 'MT5'],
    leverage: { scb: '1:200', fca: '1:30' },
    regulations: ['FCA', 'CySEC', 'KNF'],
    instruments: ['Forex', 'Acciones', 'Materias Primas'],
    central: 'London',
    regions: 'LATAM + de 13 países',
    rating: 4.5,
    founded: 2002,
    description: 'XTB es un broker de trading online establecido en 2002, con sede en Polonia y regulado por múltiples autoridades financieras. Ofrece una amplia gama de instrumentos financieros incluyendo forex, acciones, índices y criptomonedas.',
    pros: ['Sin depósito mínimo', 'Plataforma xStation intuitiva', 'Spreads competitivos', 'Regulación múltiple'],
    cons: ['Apalancamiento limitado en EU', 'Cargos por inactividad'],
    mainRegion: 'Varsovia, Polonia',
    operatingCountries: 'Europa, LATAM',
    allRegulations: [
      { name: 'FCA', desc: 'Financial Conduct Authority' },
      { name: 'CySEC', desc: 'Cyprus Securities and Exchange Commission' },
      { name: 'KNF', desc: 'Polish Financial Supervision Authority' },
    ],
    instrumentTypes: [
      { name: 'FOREX', desc: 'Más de 50 pares de divisas' },
      { name: 'ACCIONES', desc: 'Acciones de mercados globales' },
      { name: 'INDICES', desc: 'Principales índices bursátiles' },
      { name: 'CRIPTOMONEDAS', desc: 'Bitcoin, Ethereum y más' },
    ],
    platforms: [
      { name: 'xStation 5', desc: 'Plataforma propietaria avanzada' },
      { name: 'MetaTrader 4', desc: 'MT4 disponible' },
      { name: 'Aplicación Móvil', desc: 'Trading desde el móvil' },
    ],
    accountTypes: [
      { name: 'Cuenta Demo', desc: 'Práctica sin riesgo' },
      { name: 'Cuenta Standard', desc: 'Para todos los traders' },
      { name: 'Cuenta Pro', desc: 'Para profesionales' },
    ],
  },
  {
    id: '3',
    name: 'Pepperstone',
    logo: 'PP',
    level: 'Intermedio',
    depositMin: '200 $',
    commission: '3.5 $',
    spreads: '0.0 pips',
    platform: ['MT4', 'MT5', 'cTrader'],
    leverage: { scb: '1:500', fca: '1:30' },
    regulations: ['ASIC', 'FCA', 'DFSA'],
    instruments: ['Forex', 'CFDs', 'Crypto'],
    central: 'Melbourne',
    regions: 'Global 170+ países',
    rating: 4.7,
    founded: 2010,
    description: 'Pepperstone es un broker australiano fundado en 2010, conocido por sus spreads ultra bajos y ejecución rápida. Ideal para traders experimentados.',
    pros: ['Spreads desde 0.0 pips', 'Ejecución ultra rápida', 'Múltiples plataformas', 'Excelente soporte'],
    cons: ['Depósito mínimo elevado', 'Comisiones en cuenta Razor'],
    mainRegion: 'Melbourne, Australia',
    operatingCountries: 'Global',
    allRegulations: [
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
      { name: 'FCA', desc: 'Financial Conduct Authority' },
      { name: 'DFSA', desc: 'Dubai Financial Services Authority' },
    ],
    instrumentTypes: [
      { name: 'FOREX', desc: '60+ pares de divisas' },
      { name: 'CFDs', desc: 'Índices, materias primas' },
      { name: 'CRYPTO', desc: 'Principales criptomonedas' },
    ],
    platforms: [
      { name: 'MetaTrader 4/5', desc: 'Plataformas estándar de la industria' },
      { name: 'cTrader', desc: 'Plataforma ECN avanzada' },
      { name: 'TradingView', desc: 'Integración disponible' },
    ],
    accountTypes: [
      { name: 'Cuenta Standard', desc: 'Sin comisiones, spreads desde 1.0' },
      { name: 'Cuenta Razor', desc: 'Spreads desde 0.0 + comisión' },
    ],
  },
  {
    id: '4',
    name: 'OANDA',
    logo: 'OA',
    level: 'Avanzado',
    depositMin: '0 $',
    commission: '0.0',
    spreads: '1.0 pips',
    platform: ['Web', 'MT4', 'App'],
    leverage: { scb: '1:100', fca: '1:30' },
    regulations: ['NFA', 'FCA', 'ASIC'],
    instruments: ['Forex', 'CFDs'],
    central: 'New York',
    regions: 'USA + Global',
    rating: 4.3,
    founded: 1996,
    description: 'OANDA es un broker pionero fundado en 1996, conocido por su tecnología innovadora y herramientas de análisis avanzadas.',
    pros: ['Sin depósito mínimo', 'Herramientas avanzadas', 'Regulación fuerte', 'Datos históricos'],
    cons: ['Spreads variables', 'Instrumentos limitados'],
    mainRegion: 'New York, USA',
    operatingCountries: 'USA, Europa, Asia',
    allRegulations: [
      { name: 'NFA', desc: 'National Futures Association' },
      { name: 'FCA', desc: 'Financial Conduct Authority' },
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
    ],
    instrumentTypes: [
      { name: 'FOREX', desc: '70+ pares de divisas' },
      { name: 'CFDs', desc: 'Índices y materias primas' },
    ],
    platforms: [
      { name: 'OANDA Trade', desc: 'Plataforma propietaria' },
      { name: 'MetaTrader 4', desc: 'MT4 disponible' },
      { name: 'API', desc: 'Para trading algorítmico' },
    ],
    accountTypes: [
      { name: 'Standard', desc: 'Para todos los traders' },
      { name: 'Premium', desc: 'Beneficios adicionales' },
    ],
  },
  {
    id: '5',
    name: 'eToro',
    logo: 'eT',
    level: 'Principiante',
    depositMin: '50 $',
    commission: '0.0',
    spreads: '1.0 pips',
    platform: ['Web', 'App'],
    leverage: { scb: '1:400', fca: '1:30' },
    regulations: ['FCA', 'CySEC', 'ASIC'],
    instruments: ['Forex', 'Acciones', 'CryptoMonedas', 'ETFs'],
    central: 'Tel Aviv',
    regions: 'Global 140+ países',
    rating: 4.4,
    founded: 2007,
    description: 'eToro es una plataforma de trading social fundada en 2007 en Israel. Es pionera en copy trading, permitiendo a los usuarios copiar automáticamente las operaciones de traders exitosos. Con más de 30 millones de usuarios registrados, es una de las plataformas más populares del mundo.',
    pros: ['Copy Trading innovador', 'Sin comisiones en acciones', 'Plataforma muy intuitiva', 'Gran comunidad social', 'Amplia variedad de criptomonedas'],
    cons: ['Spreads elevados en Forex', 'Comisión por retiro de $5', 'Solo USD como divisa base'],
    mainRegion: 'Tel Aviv, Israel',
    operatingCountries: 'Global excepto USA (limitado), Canadá, Japón',
    allRegulations: [
      { name: 'FCA', desc: 'Financial Conduct Authority (Reino Unido)' },
      { name: 'CySEC', desc: 'Cyprus Securities and Exchange Commission' },
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
      { name: 'FinCEN', desc: 'Financial Crimes Enforcement Network (USA)' },
    ],
    instrumentTypes: [
      { name: 'ACCIONES', desc: '3000+ acciones sin comisiones de 17 bolsas' },
      { name: 'CRIPTOMONEDAS', desc: '80+ criptomonedas incluyendo Bitcoin, Ethereum, Solana' },
      { name: 'ETFs', desc: '300+ ETFs de mercados globales' },
      { name: 'FOREX', desc: '49 pares de divisas' },
      { name: 'MATERIAS PRIMAS', desc: 'Oro, Plata, Petróleo, Gas Natural' },
      { name: 'INDICES', desc: 'S&P 500, NASDAQ, DAX, FTSE 100' },
    ],
    platforms: [
      { name: 'eToro WebTrader', desc: 'Plataforma web con copy trading integrado' },
      { name: 'eToro App', desc: 'Aplicación móvil iOS y Android' },
      { name: 'eToro Money', desc: 'Billetera cripto separada' },
    ],
    accountTypes: [
      { name: 'Cuenta Demo', desc: '$100,000 virtuales para practicar' },
      { name: 'Cuenta Retail', desc: 'Para inversores minoristas' },
      { name: 'Cuenta Pro', desc: 'Mayor apalancamiento para profesionales' },
      { name: 'eToro Club', desc: 'Niveles Silver, Gold, Platinum, Diamond' },
    ],
  },
  {
    id: '6',
    name: 'Plus500',
    logo: 'P5',
    level: 'Intermedio',
    depositMin: '100 $',
    commission: '0.0',
    spreads: '0.8 pips',
    platform: ['Web', 'App'],
    leverage: { scb: '1:300', fca: '1:30' },
    regulations: ['FCA', 'CySEC', 'ASIC', 'MAS'],
    instruments: ['Forex', 'CFDs', 'Acciones', 'CryptoMonedas'],
    central: 'Haifa',
    regions: 'Europa + 50 países',
    rating: 4.2,
    founded: 2008,
    description: 'Plus500 es un broker de CFDs fundado en 2008 en Israel, cotizado en la Bolsa de Londres (FTSE 250). Conocido por su plataforma simple e intuitiva, es ideal para traders que buscan una experiencia sin complicaciones.',
    pros: ['Plataforma muy simple', 'Sin comisiones', 'Cotiza en bolsa (confiable)', 'Cuenta demo ilimitada', 'Amplia gama de CFDs'],
    cons: ['Solo CFDs (no activos reales)', 'Sin MetaTrader', 'Herramientas de análisis limitadas', 'Sin copy trading'],
    mainRegion: 'Haifa, Israel',
    operatingCountries: 'Europa, Australia, Sudáfrica, Singapur',
    allRegulations: [
      { name: 'FCA', desc: 'Financial Conduct Authority (Reino Unido)' },
      { name: 'CySEC', desc: 'Cyprus Securities and Exchange Commission' },
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
      { name: 'MAS', desc: 'Monetary Authority of Singapore' },
      { name: 'FMA', desc: 'Financial Markets Authority (Nueva Zelanda)' },
    ],
    instrumentTypes: [
      { name: 'FOREX', desc: '60+ pares de divisas CFDs' },
      { name: 'ACCIONES', desc: '2000+ CFDs de acciones globales' },
      { name: 'INDICES', desc: 'Principales índices mundiales' },
      { name: 'CRIPTOMONEDAS', desc: 'Bitcoin, Ethereum, Litecoin y más' },
      { name: 'MATERIAS PRIMAS', desc: 'Oro, Plata, Petróleo, Gas' },
      { name: 'ETFs', desc: 'CFDs sobre ETFs populares' },
      { name: 'OPCIONES', desc: 'Opciones sobre índices y forex' },
    ],
    platforms: [
      { name: 'Plus500 WebTrader', desc: 'Plataforma propietaria basada en web' },
      { name: 'Plus500 App', desc: 'Aplicación móvil galardonada' },
      { name: 'Plus500 Windows', desc: 'Aplicación de escritorio' },
    ],
    accountTypes: [
      { name: 'Cuenta Demo', desc: 'Ilimitada con fondos virtuales' },
      { name: 'Cuenta Real', desc: 'Trading con dinero real' },
      { name: 'Cuenta Profesional', desc: 'Mayor apalancamiento para elegibles' },
    ],
  },
  {
    id: '7',
    name: 'Interactive Brokers',
    logo: 'IB',
    level: 'Avanzado',
    depositMin: '0 $',
    commission: '0.005 $/acción',
    spreads: '0.1 pips',
    platform: ['TWS', 'Web', 'App'],
    leverage: { scb: '1:50', fca: '1:30' },
    regulations: ['SEC', 'FCA', 'ASIC', 'SFC'],
    instruments: ['Forex', 'Acciones', 'Opciones', 'Futuros', 'Bonos'],
    central: 'Greenwich, CT',
    regions: 'Global 150+ mercados',
    rating: 4.8,
    founded: 1978,
    description: 'Interactive Brokers es uno de los brokers más grandes y respetados del mundo, fundado en 1978 por Thomas Peterffy. Ofrece acceso a más de 150 mercados en 33 países, con las comisiones más bajas de la industria para traders activos.',
    pros: ['Comisiones ultra bajas', 'Acceso a 150+ mercados globales', 'Plataforma TWS profesional', 'Excelente para traders activos', 'Margen muy competitivo'],
    cons: ['Plataforma compleja para principiantes', 'Servicio al cliente limitado', 'Curva de aprendizaje alta'],
    mainRegion: 'Greenwich, Connecticut, USA',
    operatingCountries: 'Global - 150+ mercados en 33 países',
    allRegulations: [
      { name: 'SEC', desc: 'Securities and Exchange Commission (USA)' },
      { name: 'FINRA', desc: 'Financial Industry Regulatory Authority' },
      { name: 'FCA', desc: 'Financial Conduct Authority (Reino Unido)' },
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
      { name: 'SFC', desc: 'Securities and Futures Commission (Hong Kong)' },
      { name: 'MAS', desc: 'Monetary Authority of Singapore' },
    ],
    instrumentTypes: [
      { name: 'ACCIONES', desc: 'Acciones en 90+ bolsas mundiales' },
      { name: 'OPCIONES', desc: 'Opciones en 30+ mercados' },
      { name: 'FUTUROS', desc: 'Futuros en 35+ mercados' },
      { name: 'FOREX', desc: '100+ pares de divisas' },
      { name: 'BONOS', desc: 'Bonos corporativos y gubernamentales' },
      { name: 'ETFs', desc: '13,000+ ETFs globales' },
      { name: 'FONDOS', desc: '40,000+ fondos mutuos' },
    ],
    platforms: [
      { name: 'Trader Workstation (TWS)', desc: 'Plataforma profesional de escritorio' },
      { name: 'IBKR Mobile', desc: 'App móvil completa' },
      { name: 'Client Portal', desc: 'Plataforma web simplificada' },
      { name: 'IBKR APIs', desc: 'APIs para trading algorítmico' },
    ],
    accountTypes: [
      { name: 'IBKR Lite', desc: 'Sin comisiones en acciones USA, ideal principiantes' },
      { name: 'IBKR Pro', desc: 'Comisiones bajas, acceso completo' },
      { name: 'Cuenta Margen', desc: 'Trading con apalancamiento' },
      { name: 'Cuenta IRA', desc: 'Cuentas de jubilación (USA)' },
    ],
  },
  {
    id: '8',
    name: 'Exness',
    logo: 'EX',
    level: 'Principiante',
    depositMin: '1 $',
    commission: '0.0',
    spreads: '0.3 pips',
    platform: ['MT4', 'MT5', 'Web'],
    leverage: { scb: '1:2000', fca: '1:30' },
    regulations: ['FCA', 'CySEC', 'FSA'],
    instruments: ['Forex', 'Crypto', 'Acciones', 'Indices'],
    central: 'Limassol',
    regions: 'Global 190+ países',
    rating: 4.6,
    founded: 2008,
    description: 'Exness es un broker global fundado en 2008 en Chipre, conocido por su apalancamiento ilimitado, retiros instantáneos y depósito mínimo de solo $1. Procesa más de $4 trillones en volumen mensual.',
    pros: ['Depósito mínimo $1', 'Apalancamiento hasta 1:ilimitado', 'Retiros instantáneos 24/7', 'Spreads muy bajos', 'Sin swaps en cuentas islámicas'],
    cons: ['No disponible en USA/EU para retail', 'Apalancamiento alto = alto riesgo', 'Sin acciones reales'],
    mainRegion: 'Limassol, Chipre',
    operatingCountries: 'Asia, África, LATAM, Medio Oriente',
    allRegulations: [
      { name: 'FCA', desc: 'Financial Conduct Authority (Reino Unido)' },
      { name: 'CySEC', desc: 'Cyprus Securities and Exchange Commission' },
      { name: 'FSA', desc: 'Financial Services Authority (Seychelles)' },
      { name: 'FSCA', desc: 'Financial Sector Conduct Authority (Sudáfrica)' },
    ],
    instrumentTypes: [
      { name: 'FOREX', desc: '100+ pares de divisas' },
      { name: 'CRIPTOMONEDAS', desc: 'Bitcoin, Ethereum, 35+ cryptos' },
      { name: 'METALES', desc: 'Oro, Plata, Platino' },
      { name: 'ENERGIAS', desc: 'Petróleo Brent, WTI, Gas Natural' },
      { name: 'INDICES', desc: 'Principales índices globales' },
      { name: 'ACCIONES', desc: 'CFDs de acciones populares' },
    ],
    platforms: [
      { name: 'MetaTrader 4', desc: 'Plataforma clásica de trading' },
      { name: 'MetaTrader 5', desc: 'Versión avanzada con más herramientas' },
      { name: 'Exness Terminal', desc: 'Plataforma web propietaria' },
      { name: 'Exness Trade App', desc: 'App móvil para iOS y Android' },
    ],
    accountTypes: [
      { name: 'Standard', desc: 'Sin comisión, spreads desde 0.3' },
      { name: 'Standard Cent', desc: 'Para micro trading' },
      { name: 'Pro', desc: 'Ejecución instantánea' },
      { name: 'Raw Spread', desc: 'Spreads desde 0.0 + comisión' },
      { name: 'Zero', desc: 'Sin spreads en 30 pares principales' },
    ],
  },
  {
    id: '9',
    name: 'Saxo Bank',
    logo: 'SB',
    level: 'Avanzado',
    depositMin: '2000 $',
    commission: '0.08%',
    spreads: '0.4 pips',
    platform: ['SaxoTraderGO', 'SaxoTraderPRO'],
    leverage: { scb: '1:100', fca: '1:30' },
    regulations: ['FCA', 'DFSA', 'ASIC', 'FSA'],
    instruments: ['Forex', 'Acciones', 'Bonos', 'ETFs', 'Futuros'],
    central: 'Copenhagen',
    regions: 'Europa + Global',
    rating: 4.5,
    founded: 1992,
    description: 'Saxo Bank es un banco de inversión danés fundado en 1992, especializado en trading online. Ofrece acceso a más de 71,000 instrumentos y es conocido por su plataforma premium y análisis de alta calidad.',
    pros: ['71,000+ instrumentos', 'Plataforma premium', 'Excelente investigación', 'Banco regulado', 'Servicio VIP'],
    cons: ['Depósito mínimo alto', 'Comisiones elevadas para pequeños traders', 'Complejidad de la plataforma'],
    mainRegion: 'Copenhagen, Dinamarca',
    operatingCountries: 'Europa, Asia, Medio Oriente, Australia',
    allRegulations: [
      { name: 'FSA Denmark', desc: 'Danish Financial Supervisory Authority' },
      { name: 'FCA', desc: 'Financial Conduct Authority' },
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
      { name: 'MAS', desc: 'Monetary Authority of Singapore' },
      { name: 'DFSA', desc: 'Dubai Financial Services Authority' },
    ],
    instrumentTypes: [
      { name: 'ACCIONES', desc: '23,000+ acciones en 50+ bolsas' },
      { name: 'FOREX', desc: '185 pares de divisas' },
      { name: 'ETFs', desc: '7,000+ ETFs globales' },
      { name: 'BONOS', desc: '5,900+ bonos' },
      { name: 'FUTUROS', desc: '300+ futuros' },
      { name: 'OPCIONES', desc: 'Opciones listadas globales' },
    ],
    platforms: [
      { name: 'SaxoTraderGO', desc: 'Plataforma web y móvil intuitiva' },
      { name: 'SaxoTraderPRO', desc: 'Plataforma profesional avanzada' },
      { name: 'SaxoInvestor', desc: 'Para inversores a largo plazo' },
    ],
    accountTypes: [
      { name: 'Classic', desc: 'Acceso estándar a todos los mercados' },
      { name: 'Platinum', desc: 'Beneficios premium desde $200,000' },
      { name: 'VIP', desc: 'Servicio exclusivo desde $1M' },
    ],
  },
  {
    id: '10',
    name: 'AvaTrade',
    logo: 'AT',
    level: 'Principiante',
    depositMin: '100 $',
    commission: '0.0',
    spreads: '0.9 pips',
    platform: ['MT4', 'MT5', 'AvaTradeGO'],
    leverage: { scb: '1:400', fca: '1:30' },
    regulations: ['CBI', 'ASIC', 'FSA', 'FSCA'],
    instruments: ['Forex', 'Acciones', 'CryptoMonedas', 'Commodities'],
    central: 'Dublin',
    regions: 'Global 150+ países',
    rating: 4.3,
    founded: 2006,
    description: 'AvaTrade es un broker irlandés fundado en 2006, conocido por su regulación múltiple y herramientas educativas. Ofrece trading automatizado con DupliTrade y ZuluTrade.',
    pros: ['Multi-regulado (7 jurisdicciones)', 'Copy trading disponible', 'Educación completa', 'Opciones de vanilla disponibles', 'AvaProtect para gestión de riesgo'],
    cons: ['Spreads no son los más bajos', 'Cargo por inactividad', 'Sin acciones reales'],
    mainRegion: 'Dublin, Irlanda',
    operatingCountries: 'Global excepto USA',
    allRegulations: [
      { name: 'CBI', desc: 'Central Bank of Ireland' },
      { name: 'ASIC', desc: 'Australian Securities and Investments Commission' },
      { name: 'FSA', desc: 'Financial Services Agency (Japón)' },
      { name: 'FSCA', desc: 'Financial Sector Conduct Authority (Sudáfrica)' },
      { name: 'ADGM', desc: 'Abu Dhabi Global Market' },
    ],
    instrumentTypes: [
      { name: 'FOREX', desc: '55+ pares de divisas' },
      { name: 'ACCIONES', desc: '600+ CFDs de acciones' },
      { name: 'CRIPTOMONEDAS', desc: '20+ criptomonedas' },
      { name: 'COMMODITIES', desc: 'Oro, Plata, Petróleo' },
      { name: 'INDICES', desc: 'Principales índices globales' },
      { name: 'ETFs', desc: 'ETFs populares' },
    ],
    platforms: [
      { name: 'MetaTrader 4/5', desc: 'Plataformas estándar' },
      { name: 'AvaTradeGO', desc: 'App móvil propietaria' },
      { name: 'AvaOptions', desc: 'Para trading de opciones' },
      { name: 'AvaSocial', desc: 'Copy trading integrado' },
      { name: 'DupliTrade', desc: 'Trading automatizado' },
    ],
    accountTypes: [
      { name: 'Cuenta Demo', desc: '21 días de prueba gratuita' },
      { name: 'Cuenta Retail', desc: 'Para traders minoristas' },
      { name: 'Cuenta Pro', desc: 'Para traders profesionales' },
      { name: 'Cuenta Islámica', desc: 'Sin swaps overnight' },
    ],
  },
];

type Broker = typeof brokers[0];
type SortOption = 'rating' | 'deposit' | 'spreads';

const parseDeposit = (deposit: string): number => {
  const num = parseFloat(deposit.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

const parseSpreads = (spreads: string): number => {
  const num = parseFloat(spreads.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

export default function BrokerRating() {
  const { t } = useTranslation();
  const categories = getCategoriesTranslated(t);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('Principiante');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [brokersToCompare, setBrokersToCompare] = useState<Broker[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption | ''>('');
  
  const [location, setLocation] = useState('');
  const [currency, setCurrency] = useState('');
  const [depositRange, setDepositRange] = useState('');
  const [method, setMethod] = useState('');
  const [operation, setOperation] = useState('');
  const [markets, setMarkets] = useState('');

  const toggleBrokerCompare = (broker: Broker) => {
    if (brokersToCompare.some(b => b.id === broker.id)) {
      setBrokersToCompare(prev => prev.filter(b => b.id !== broker.id));
    } else {
      if (brokersToCompare.length >= 4) {
        toast.error(t('broker_max_compare'));
        return;
      }
      setBrokersToCompare(prev => [...prev, broker]);
    }
  };

  const removeBrokerFromCompare = (brokerId: string) => {
    setBrokersToCompare(prev => prev.filter(b => b.id !== brokerId));
  };

  const handleCompare = () => {
    if (brokersToCompare.length < 2) {
      toast.error(t('broker_min_compare'));
      return;
    }
    setShowComparePanel(true);
  };

  const filteredBrokers = brokers
    .filter(broker => {
      const matchesSearch = broker.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = broker.level === selectedLevel;
      const matchesCategory = !selectedCategory || broker.instruments.some(i => 
        i.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      return matchesSearch && matchesLevel && matchesCategory;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'deposit': return parseDeposit(a.depositMin) - parseDeposit(b.depositMin);
        case 'spreads': return parseSpreads(a.spreads) - parseSpreads(b.spreads);
        default: return 0;
      }
    });

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= Math.floor(rating) ? 'fill-amber-400 text-amber-400'
            : star - 0.5 <= rating ? 'fill-amber-400/50 text-amber-400'
            : 'text-muted-foreground'
          }`}
        />
      ))}
      <span className="text-xs text-foreground ml-1">{rating}</span>
    </div>
  );

  return (
    <PageShell>
      <Header />
      <main className="py-4 px-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-primary">{t('broker_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('broker_subtitle')}</p>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-base font-semibold text-foreground mb-3">{t('broker_search')}</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('broker_search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            <div className="flex items-start gap-4 mb-4">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40 bg-secondary">
                  <SelectValue placeholder={t('broker_level')} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Principiante">{t('broker_beginner')}</SelectItem>
                  <SelectItem value="Intermedio">{t('broker_intermediate')}</SelectItem>
                  <SelectItem value="Avanzado">{t('broker_advanced')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex-1">{t('broker_tip')}</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.label;
                const color = CATEGORY_COLORS[cat.colorKey] || 'hsl(200, 90%, 50%)';
                return (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.label)}
                    className="flex flex-col items-center gap-1.5 min-w-[64px] py-2.5 px-2 rounded-xl transition-all duration-200 active:scale-95"
                    style={isSelected ? {
                      background: `linear-gradient(180deg, ${color}18, ${color}08)`,
                      border: `1px solid ${color}40`,
                      boxShadow: `0 4px 12px -4px ${color}30`,
                    } : {
                      background: 'hsl(var(--secondary))',
                      border: '1px solid transparent',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={isSelected ? {
                        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                        boxShadow: `0 0 10px -3px ${color}40`,
                      } : {
                        background: 'hsl(var(--muted))',
                      }}
                    >
                      <Icon
                        size={20}
                        strokeWidth={1.8}
                        className="transition-colors flex-shrink-0"
                        style={{ color: isSelected ? color : 'hsl(var(--muted-foreground))', width: 20, height: 20 }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold text-center leading-tight ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cat.label}
                    </span>
                    {cat.sublabel && (
                      <span className="text-[8px] text-muted-foreground text-center leading-tight -mt-0.5">{cat.sublabel}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Advanced filters toggle inline */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center justify-between w-full mt-3 px-3 py-2 rounded-lg bg-muted/50 border border-border transition-colors hover:bg-muted active:scale-[0.99]"
            >
              <span className="text-[11px] font-semibold text-muted-foreground">{t('broker_advanced_filters')}</span>
              {showAdvancedFilters ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showAdvancedFilters && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">{t('broker_country')}</label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="bg-secondary h-9 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="europa">Europa</SelectItem>
                        <SelectItem value="latam">LATAM</SelectItem>
                        <SelectItem value="usa">USA</SelectItem>
                        <SelectItem value="asia">Asia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">{t('broker_trader_mode')}</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="bg-secondary h-9 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">{t('broker_deposit_amount')}</label>
                    <Select value={depositRange} onValueChange={setDepositRange}>
                      <SelectTrigger className="bg-secondary h-9 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="0-100">$0 - $100</SelectItem>
                        <SelectItem value="100-500">$100 - $500</SelectItem>
                        <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                        <SelectItem value="1000+">$1,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">{t('broker_country_currency')}</label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="bg-secondary h-9 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">{t('broker_market_entry')}</label>
                    <Select value={operation} onValueChange={setOperation}>
                      <SelectTrigger className="bg-secondary h-9 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="scalping">Scalping</SelectItem>
                        <SelectItem value="day">Day Trading</SelectItem>
                        <SelectItem value="swing">Swing Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">{t('broker_preferred_market')}</label>
                    <Select value={markets} onValueChange={setMarkets}>
                      <SelectTrigger className="bg-secondary h-9 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="acciones">Acciones</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 h-9 text-xs">{t('broker_search_btn')}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4 gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            {t('broker_popular_results')
              .replace('{count}', String(filteredBrokers.length))
              .replace('{level}', selectedLevel)
              .replace('{market}', selectedCategory || 'Forex')}
          </p>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption | '')}>
              <SelectTrigger className="w-[140px] bg-secondary text-xs h-8">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue placeholder={t('broker_sort_placeholder')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="rating">{t('broker_sort_rating')}</SelectItem>
                <SelectItem value="deposit">{t('broker_sort_deposit')}</SelectItem>
                <SelectItem value="spreads">{t('broker_sort_spreads')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setCompareMode(!compareMode); if (compareMode) setBrokersToCompare([]); }}
              className="text-xs"
            >
              <GitCompare className="w-4 h-4 mr-1" />
              {compareMode ? t('broker_cancel') : t('broker_compare')}
            </Button>
          </div>
        </div>

        {compareMode && (
          <Card className="mb-4 border-primary/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">
                    {t('broker_selected').replace('{count}', String(brokersToCompare.length))}
                  </span>
                  {brokersToCompare.length > 0 && (
                    <div className="flex gap-1">
                      {brokersToCompare.map(b => (
                        <Badge key={b.id} variant="secondary" className="text-xs">
                          {b.name}
                          <button onClick={() => removeBrokerFromCompare(b.id)} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="sm" onClick={handleCompare} disabled={brokersToCompare.length < 2} className="bg-primary hover:bg-primary/90">
                  {t('broker_compare')} ({brokersToCompare.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {filteredBrokers.map((broker) => {
            const isSelectedForCompare = brokersToCompare.some(b => b.id === broker.id);
            return (
              <Card 
                key={broker.id} 
                className={`overflow-hidden transition-all active:scale-[0.99] ${isSelectedForCompare ? 'ring-2 ring-primary' : ''}`}
                onClick={() => !compareMode && setSelectedBroker(broker)}
              >
                <CardContent className="p-0">
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-3 pb-2">
                    {compareMode && (
                      <Checkbox 
                        checked={isSelectedForCompare} 
                        onCheckedChange={(e) => { e && toggleBrokerCompare(broker); }} 
                        onClick={(e) => e.stopPropagation()}
                        className="border-primary data-[state=checked]:bg-primary" 
                      />
                    )}
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1">
                      <img src={BROKER_LOGOS[broker.id]} alt={broker.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground truncate">{broker.name}</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/40 shrink-0">{broker.level}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Landmark className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] text-muted-foreground truncate">{broker.central} · {broker.regions}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-foreground">{broker.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-px bg-border/50 mx-3 rounded-lg overflow-hidden mb-2">
                    <div className="bg-card p-2 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_initial_deposit')}</span>
                      <span className="text-xs font-semibold text-accent">{broker.depositMin}</span>
                    </div>
                    <div className="bg-card p-2 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_spreads')}</span>
                      <span className="text-xs font-semibold text-accent">{broker.spreads}</span>
                    </div>
                    <div className="bg-card p-2 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t('broker_commission')}</span>
                      <span className="text-xs font-semibold text-accent">{broker.commission === '0.0' ? '$0' : `$${broker.commission}`}</span>
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="px-3 pb-2">
                    <div className="flex flex-wrap gap-1">
                      {broker.platform.map(p => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{p}</span>
                      ))}
                      {broker.regulations.slice(0, 3).map(r => (
                        <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">{r}</span>
                      ))}
                      {broker.regulations.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">+{broker.regulations.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-secondary/30">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{t('broker_leverage')}: <span className="text-foreground font-medium">{broker.leverage.scb}</span></span>
                      <span className="mx-1">·</span>
                      <span>{broker.instruments.slice(0, 2).join(', ')}{broker.instruments.length > 2 ? ' +' : ''}</span>
                    </div>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {compareMode && (
                        <Button size="sm" variant={isSelectedForCompare ? "secondary" : "outline"} className="text-[10px] h-7 px-2" onClick={() => toggleBrokerCompare(broker)}>
                          {isSelectedForCompare ? t('broker_remove') : t('broker_add')}
                        </Button>
                      )}
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-[10px] h-7 px-3" onClick={() => setSelectedBroker(broker)}>
                        {t('broker_view_details')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Compare Panel Dialog */}
      <Dialog open={showComparePanel} onOpenChange={setShowComparePanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-bold text-foreground">
                  {t('broker_compare_title')} ({brokersToCompare.length})
                </DialogTitle>
              </DialogHeader>
              <div className="min-w-max">
                <div className="flex border-b border-border">
                  <div className="w-32 shrink-0 p-3 bg-secondary/50">
                    <span className="text-sm font-medium text-muted-foreground">{t('broker_feature')}</span>
                  </div>
                  {brokersToCompare.map((broker) => (
                    <div key={broker.id} className="w-48 shrink-0 p-3 bg-card border-l border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">{broker.name}</h3>
                          <span className="text-xs text-primary">{broker.level}</span>
                        </div>
                        <button onClick={() => removeBrokerFromCompare(broker.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {[
                  { label: t('broker_level'), render: (b: Broker) => b.level },
                  { label: t('broker_initial_deposit'), render: (b: Broker) => b.depositMin },
                  { label: t('broker_commission'), render: (b: Broker) => b.commission },
                  { label: t('broker_spreads'), render: (b: Broker) => b.spreads },
                  { label: t('broker_platform'), render: (b: Broker) => b.platform.join(', ') },
                  { label: t('broker_leverage'), render: (b: Broker) => `${b.leverage.scb} / ${b.leverage.fca}` },
                  { label: t('broker_regulations'), render: (b: Broker) => b.regulations.join(', ') },
                  { label: t('broker_instruments'), render: (b: Broker) => b.instruments.join(', ') },
                  { label: t('broker_headquarters'), render: (b: Broker) => b.central },
                  { label: t('broker_coverage'), render: (b: Broker) => b.regions },
                  { label: 'Rating', render: (b: Broker) => (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${star <= Math.floor(b.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                      ))}
                      <span className="ml-1">{b.rating}</span>
                    </div>
                  )},
                ].map((row, idx) => (
                  <div key={row.label} className={`flex border-b border-border ${idx % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                    <div className="w-32 shrink-0 p-3">
                      <span className="text-sm font-medium text-primary">{row.label}</span>
                    </div>
                    {brokersToCompare.map((broker) => (
                      <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                        <span className="text-sm text-foreground">{row.render(broker)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex border-b border-border bg-secondary/20">
                  <div className="w-32 shrink-0 p-3"><span className="text-sm font-medium text-primary">{t('broker_pro')}</span></div>
                  {brokersToCompare.map((broker) => (
                    <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                      <ul className="space-y-1">
                        {broker.pros.slice(0, 3).map((pro, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                            <span className="text-foreground">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="flex border-b border-border">
                  <div className="w-32 shrink-0 p-3"><span className="text-sm font-medium text-destructive">{t('broker_cons')}</span></div>
                  {brokersToCompare.map((broker) => (
                    <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                      <ul className="space-y-1">
                        {broker.cons.slice(0, 2).map((con, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs">
                            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                            <span className="text-foreground">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <div className="w-32 shrink-0 p-3"></div>
                  {brokersToCompare.map((broker) => (
                    <div key={broker.id} className="w-48 shrink-0 p-3 border-l border-border">
                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90">{t('broker_open_account')}</Button>
                    </div>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Broker Detail Dialog */}
      <Dialog open={!!selectedBroker} onOpenChange={() => setSelectedBroker(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] p-0 bg-card border-border">
          <ScrollArea className="max-h-[90vh]">
            {selectedBroker && (
              <div className="pb-6">
                {/* Hero header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative px-5 pt-6 pb-4" style={{ background: 'linear-gradient(180deg, hsl(var(--primary) / 0.12) 0%, transparent 100%)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden p-2 shadow-md shrink-0">
                      <img src={BROKER_LOGOS[selectedBroker.id]} alt={selectedBroker.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogHeader className="space-y-0">
                        <DialogTitle className="text-xl font-bold text-foreground">{selectedBroker.name}</DialogTitle>
                      </DialogHeader>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/40">{selectedBroker.level}</Badge>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-foreground">{selectedBroker.rating}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Landmark className="w-3 h-3" />
                        {selectedBroker.central} · {selectedBroker.regions}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="px-5 mb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedBroker.description}</p>
                </motion.div>

                {/* Key stats grid */}
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  className="grid grid-cols-4 gap-px bg-border/50 mx-5 rounded-xl overflow-hidden mb-4">
                  <div className="bg-card p-2.5 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_deposit')}</span>
                    <span className="text-xs font-bold text-accent">{selectedBroker.depositMin}</span>
                  </div>
                  <div className="bg-card p-2.5 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_spreads')}</span>
                    <span className="text-xs font-bold text-accent">{selectedBroker.spreads}</span>
                  </div>
                  <div className="bg-card p-2.5 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_commission')}</span>
                    <span className="text-xs font-bold text-accent">{selectedBroker.commission === '0.0' || selectedBroker.commission === '0' ? '$0' : `$${selectedBroker.commission}`}</span>
                  </div>
                  <div className="bg-card p-2.5 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_leverage')}</span>
                    <span className="text-xs font-bold text-accent">{selectedBroker.leverage.scb}</span>
                  </div>
                </motion.div>

                {/* Pros & Cons */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.22 }}
                  className="px-5 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                      <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('broker_pro')}
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedBroker.pros.map((pro, i) => (
                          <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-destructive/5 rounded-xl p-3 border border-destructive/10">
                      <h4 className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> {t('broker_cons')}
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedBroker.cons.map((con, i) => (
                          <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                            <X className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>

                {/* Regulations */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.29 }}
                  className="px-5 mb-4">
                  <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_regulatory_bodies')}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBroker.allRegulations.map((reg, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-secondary text-foreground font-medium" title={reg.desc}>
                        {reg.name}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Instruments */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                  className="px-5 mb-4">
                  <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_available_instruments')}</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {selectedBroker.instrumentTypes.map((inst, i) => (
                      <div key={i} className="bg-secondary/50 rounded-lg p-2">
                        <span className="text-[10px] font-semibold text-primary block">{inst.name}</span>
                        <span className="text-[10px] text-muted-foreground">{inst.desc}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Platforms */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="px-5 mb-4">
                  <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_trading_platforms')}</h4>
                  <div className="space-y-1.5">
                    {selectedBroker.platforms.map((plat, i) => (
                      <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-medium text-foreground block">{plat.name}</span>
                          <span className="text-[10px] text-muted-foreground">{plat.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Account Types */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                  className="px-5 mb-4">
                  <h4 className="text-xs font-semibold text-foreground mb-2">{t('broker_account_types')}</h4>
                  <div className="space-y-1.5">
                    {selectedBroker.accountTypes.map((acc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-medium text-foreground block">{acc.name}</span>
                          <span className="text-[10px] text-muted-foreground">{acc.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Region info */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="px-5 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-lg p-2.5">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_main_region')}</span>
                      <span className="text-[11px] font-medium text-foreground">{selectedBroker.mainRegion}</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-2.5">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t('broker_operating_countries')}</span>
                      <span className="text-[11px] font-medium text-foreground">{selectedBroker.operatingCountries}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5">
                  <Button className="w-full bg-primary hover:bg-primary/90 h-11 text-sm font-semibold">{t('broker_open_account')}</Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
