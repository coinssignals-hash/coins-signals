import { BrokerData } from './BrokerCard';

export const brokersData: BrokerData[] = [
  {
    id: '1',
    name: 'IG Group',
    level: 'Principiante',
    central: 'London',
    coverage: 'Europa + de 150 paise',
    depositoInicial: '10 $',
    comision: '0.0',
    spreads: '0.9 pips',
    plataforma: ['Web,App', 'MT5'],
    apalancamiento: ['1:200 (SCB)', '1:30 (FCA)'],
    regulaciones: ['ASIC', 'CySEC', 'FSA'],
    instrumentos: ['Forex', 'Acciones', 'Materias Primas +'],
    rating: 4.5,
    description: 'Información Básica: Fundado en 2007 en Sídney, Australia, IC Markets es uno de los brokers de Forex y CFDs más grandes del mundo por volumen, famoso por su entorno de trading True ECN IG Group (originalmente IG Index) fue fundado en 1974 en Londres (Reino Unido) por Stuart Wheeler, siendo pionero en ofrecer spread betting como alternativa a comprar oro físico. En 2000 se convirtió en empresa pública listada en la London Stock Exchange (FTSE 250).',
    pros: [
      '2800+ Traded Assets',
      'Unlimited Demo Account',
      'Competitive Spreads',
      'Regulated by Reputable Authorities',
      'Wide Range of Tradable CFD Instruments'
    ],
    cons: [
      'Limited Educational Resources',
      'High Leverage Poses Risks'
    ],
    regionPrincipal: 'Sidney, Australia',
    paisesOperacion: 'Global, Todos los paises con restriccion en algunas juridiciones',
    organismos: ['ASIC', 'CySEC', 'DFSA', 'EFSA', 'FCA', 'FMA', 'FSA (SC)', 'FSCA', 'FSC', 'JFSA', 'MAS', 'MiFID'],
    mercados: [
      { name: 'INDICES', items: 'S&P 500, Nasdaq 100, IBEX 35, Dow 30 +' },
      { name: 'FUTUROS', items: 'Oil, West, Petroleo, Gas Natural, Gasolina +' },
      { name: 'FOREX', items: 'USD-JPY, EUR-USD, USD-CAD, GPB-USD' },
      { name: 'ACCIONES', items: 'Apple Inc, BBVA, Nvidia, Netflix, Amazon +' },
      { name: 'CRIPTOMONEDAS', items: 'Meta, Ethereum, Tether, Binace Goin, XRP' },
      { name: 'BONOS', items: 'Microsoft, Boeing, GameStop Vodafone' },
      { name: 'ETF', items: 'Vanguard Total Stock, Invesco QQQ, S&P 500' },
      { name: 'OPCIONES', items: 'Financial Sector Conduct Authority' }
    ],
    plataformasOperacion: [
      { name: 'Plataforma propia', description: 'Plataforma en la Web. No requiere Instalacion' },
      { name: 'Aplicacion Moviles', description: 'App para Android e iOS' },
      { name: 'MetaTrader', description: 'MetaTrader 4 y 5' },
      { name: 'Plataforma en la Web', description: 'Operacion Desde Chrome, Safari, Internet Explore' },
      { name: 'Integracion', description: 'ProRealtime, TradingView' }
    ],
    tiposCuenta: [
      { name: 'Cuenta Demo', description: 'Cuenta para practicar tus estrategias sin pérdidas' },
      { name: 'Cuenta Segregada', description: 'Cuenta especial para proteger tu operativa' },
      { name: 'Cuenta Standar', description: 'Cuenta real con apalancamiento y todas las herramientas' },
      { name: 'Cuenta Principiantes', description: 'Cuentas con herramientas especial y Spread bajos' },
      { name: 'Cuentas Profesional', description: 'Cuentas para profesionales con todos los instrumentos' }
    ]
  },
  {
    id: '2',
    name: 'XTB',
    level: 'Principiante',
    central: 'London',
    coverage: 'LATAM + de 13 paise',
    depositoInicial: '0.0 $',
    comision: '0.0',
    spreads: '0.7 pips',
    plataforma: ['XStation', 'MT5'],
    apalancamiento: ['1:200 (SCB)', '1:30 (FCA)'],
    regulaciones: ['FCA', 'CySEC', 'KNF +'],
    instrumentos: ['Forex', 'Acciones', 'Materias Primas +'],
    rating: 4.5,
    pros: [
      'Sin deposito minimo',
      'Plataforma XStation premiada',
      'Amplia oferta educativa',
      'Regulado en Europa'
    ],
    cons: [
      'Spreads variables',
      'Sin soporte 24/7'
    ]
  },
  {
    id: '3',
    name: 'OANDA',
    level: 'Intermedio',
    central: 'New York',
    coverage: 'Global + 180 paises',
    depositoInicial: '1 $',
    comision: '0.1',
    spreads: '1.0 pips',
    plataforma: ['OANDA Trade', 'MT4', 'MT5'],
    apalancamiento: ['1:50 (US)', '1:30 (EU)'],
    regulaciones: ['FCA', 'NFA', 'ASIC', 'IIROC'],
    instrumentos: ['Forex', 'Indices', 'Metales'],
    rating: 4.7,
    pros: [
      'Deposito minimo muy bajo',
      'Excelente ejecucion',
      'Herramientas de analisis avanzadas',
      'Historial de precios gratuito'
    ],
    cons: [
      'Oferta limitada de CFDs',
      'Comisiones en algunos instrumentos'
    ]
  },
  {
    id: '4',
    name: 'Pepperstone',
    level: 'Avanzado',
    central: 'Melbourne',
    coverage: 'Global + 170 paises',
    depositoInicial: '200 $',
    comision: '0.0',
    spreads: '0.1 pips',
    plataforma: ['cTrader', 'MT4', 'MT5'],
    apalancamiento: ['1:500 (SCB)', '1:30 (ASIC)'],
    regulaciones: ['ASIC', 'FCA', 'DFSA', 'CySEC'],
    instrumentos: ['Forex', 'Indices', 'Crypto', 'Commodities'],
    rating: 4.6,
    pros: [
      'Spreads ultra bajos',
      'Ejecucion ultra rapida',
      'Multiples plataformas',
      'Excelente soporte'
    ],
    cons: [
      'Deposito minimo alto',
      'Sin acciones reales'
    ]
  },
  {
    id: '5',
    name: 'eToro',
    level: 'Principiante',
    central: 'Tel Aviv',
    coverage: 'Global + 140 paises',
    depositoInicial: '50 $',
    comision: '0.0',
    spreads: '1.0 pips',
    plataforma: ['eToro Platform'],
    apalancamiento: ['1:30 (EU)', '1:400 (Otros)'],
    regulaciones: ['FCA', 'CySEC', 'ASIC'],
    instrumentos: ['Forex', 'Acciones', 'Crypto', 'ETFs'],
    rating: 4.4,
    pros: [
      'Social Trading',
      'Copy Trading',
      'Interfaz muy intuitiva',
      'Acciones sin comision'
    ],
    cons: [
      'Spreads mas altos',
      'Retiros con comision'
    ]
  }
];
