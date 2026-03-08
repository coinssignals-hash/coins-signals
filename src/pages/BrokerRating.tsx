import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Search, TrendingUp, BarChart3, Gem, LineChart, Bitcoin, Star, Check, X, ChevronDown, ChevronUp, GitCompare, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';
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

const categories = [
  { icon: TrendingUp, label: 'Forex', sublabel: 'Divisas' },
  { icon: BarChart3, label: 'Acciones', sublabel: 'Bolsa de Valores' },
  { icon: Gem, label: 'Materias Primas', sublabel: 'Oro, Petroleo' },
  { icon: LineChart, label: 'Bursátiles', sublabel: 'Futuro, Opciones' },
  { icon: Bitcoin, label: 'CryptoMonedas', sublabel: '' },
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

            <div className="flex justify-between gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.label)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] transition-colors ${
                      isSelected ? 'bg-primary/20 border border-primary' : 'bg-secondary'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-primary'}`} />
                    <span className="text-[10px] text-foreground text-center">{cat.label}</span>
                    {cat.sublabel && (
                      <span className="text-[8px] text-muted-foreground text-center">{cat.sublabel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full mb-4 justify-between"
        >
          <span>{t('broker_advanced_filters')}</span>
          {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {showAdvancedFilters && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('broker_filter_title')}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t('broker_filter_desc')}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('broker_country')}</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="europa">Europa</SelectItem>
                      <SelectItem value="latam">LATAM</SelectItem>
                      <SelectItem value="usa">USA</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('broker_trader_mode')}</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('broker_deposit_amount')}</label>
                  <Select value={depositRange} onValueChange={setDepositRange}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="100-500">$100 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000+">$1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('broker_country_currency')}</label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('broker_market_entry')}</label>
                  <Select value={operation} onValueChange={setOperation}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="scalping">Scalping</SelectItem>
                      <SelectItem value="day">Day Trading</SelectItem>
                      <SelectItem value="swing">Swing Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('broker_preferred_market')}</label>
                  <Select value={markets} onValueChange={setMarkets}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="acciones">Acciones</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90">{t('broker_search_btn')}</Button>
            </CardContent>
          </Card>
        )}

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

        <div className="space-y-4">
          {filteredBrokers.map((broker) => {
            const isSelectedForCompare = brokersToCompare.some(b => b.id === broker.id);
            return (
              <Card key={broker.id} className={`overflow-hidden transition-all ${isSelectedForCompare ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {compareMode && (
                      <div className="flex items-start pt-1">
                        <Checkbox checked={isSelectedForCompare} onCheckedChange={() => toggleBrokerCompare(broker)} className="border-primary data-[state=checked]:bg-primary" />
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-foreground">{broker.logo}</span>
                      </div>
                      <p className="text-xs text-foreground">{t('broker_headquarters')}: <span className="text-primary">{broker.central}</span></p>
                      <p className="text-xs text-primary">{broker.regions}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-foreground">{broker.name}</h3>
                        <Badge variant="outline" className="text-primary border-primary text-xs">{broker.level}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                        <div>
                          <span className="text-primary">{t('broker_initial_deposit')}</span>
                          <p className="text-amber-400">{broker.depositMin}</p>
                        </div>
                        <div>
                          <span className="text-primary">{t('broker_commission')}</span> / <span className="text-primary">{t('broker_spreads')}</span>
                          <p><span className="text-amber-400">{broker.commission}</span> <span className="text-primary ml-2">{broker.spreads}</span></p>
                        </div>
                        <div>
                          <span className="text-primary">{t('broker_platform')}</span>
                          <p className="text-foreground">{broker.platform.join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-primary">{t('broker_leverage')}</span>
                          <p className="text-foreground">{broker.leverage.scb} (SCB)<br />{broker.leverage.fca} (FCA)</p>
                        </div>
                        <div>
                          <span className="text-primary">{t('broker_regulations')}</span>
                          <p className="text-foreground">{broker.regulations.join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-primary">{t('broker_instruments')}</span>
                          <p className="text-foreground">{broker.instruments.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          {renderStars(broker.rating)}
                          <span className="text-xs text-muted-foreground ml-2">{t('broker_comments')}</span>
                        </div>
                        <div className="flex gap-2">
                          {compareMode && (
                            <Button size="sm" variant={isSelectedForCompare ? "secondary" : "outline"} className="text-xs" onClick={() => toggleBrokerCompare(broker)}>
                              {isSelectedForCompare ? t('broker_remove') : t('broker_add')}
                            </Button>
                          )}
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs" onClick={() => setSelectedBroker(broker)}>
                            {t('broker_view_details')}
                          </Button>
                        </div>
                      </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card">
          <ScrollArea className="max-h-[90vh]">
            {selectedBroker && (
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <div className="flex justify-between items-start">
                    <DialogTitle className="text-2xl font-bold text-foreground">{selectedBroker.name}</DialogTitle>
                    <Badge variant="outline" className="text-primary border-primary">{selectedBroker.level}</Badge>
                  </div>
                </DialogHeader>
                <div className="flex gap-4 mb-6">
                  <div className="w-32 h-32 bg-secondary rounded-lg flex items-center justify-center">
                    <span className="text-4xl font-bold text-foreground">{selectedBroker.logo}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="text-primary font-semibold">{t('broker_basic_info')}:</span> {selectedBroker.description}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-primary text-sm">{t('broker_deposit')}</span>
                        <span className="text-primary text-sm">{t('broker_commission')}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-foreground text-sm">{selectedBroker.depositMin}</span>
                        <span className="text-amber-400 text-sm">{selectedBroker.commission} $</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-primary text-sm">{t('broker_withdrawals')}</span>
                        <span className="text-primary text-sm">{t('broker_spreads')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground text-sm">{t('broker_no_limits')}</span>
                        <span className="text-primary text-sm">{selectedBroker.spreads}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <span className="text-primary text-sm block mb-2">{t('broker_leverages')}</span>
                      <p className="text-foreground text-sm">{selectedBroker.leverage.scb} (SCB)</p>
                      <p className="text-foreground text-sm">{selectedBroker.leverage.fca} (FCA)</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">{t('broker_pro')}</h4>
                      <ul className="space-y-1">
                        {selectedBroker.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{pro}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-red-400 font-semibold mb-2">{t('broker_cons')}</h4>
                      <ul className="space-y-1">
                        {selectedBroker.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />{con}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <h4 className="text-primary font-semibold mb-1">{t('broker_main_region')}</h4>
                        <p className="text-xs text-foreground">{selectedBroker.mainRegion}</p>
                        <h4 className="text-primary font-semibold mt-2 mb-1">{t('broker_operating_countries')}</h4>
                        <p className="text-xs text-foreground">{selectedBroker.operatingCountries}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">{t('broker_regulatory_bodies')}</h4>
                      <ul className="space-y-1">
                        {selectedBroker.allRegulations.map((reg, i) => (
                          <li key={i}>
                            <span className="text-primary text-sm font-medium">{reg.name}</span>
                            <p className="text-[10px] text-muted-foreground">{reg.desc}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">{t('broker_available_instruments')}</h4>
                      <ul className="space-y-1">
                        {selectedBroker.instrumentTypes.map((inst, i) => (
                          <li key={i}>
                            <span className="text-primary text-sm font-medium">{inst.name}</span>
                            <p className="text-[10px] text-muted-foreground">{inst.desc}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">{t('broker_trading_platforms')}</h4>
                      <ul className="space-y-1">
                        {selectedBroker.platforms.map((plat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                              <span className="text-foreground text-sm">{plat.name}</span>
                              <p className="text-[10px] text-muted-foreground">{plat.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">{t('broker_account_types')}</h4>
                      <ul className="space-y-1">
                        {selectedBroker.accountTypes.map((acc, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                              <span className="text-foreground text-sm">{acc.name}</span>
                              <p className="text-[10px] text-muted-foreground">{acc.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90">{t('broker_open_account')}</Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
