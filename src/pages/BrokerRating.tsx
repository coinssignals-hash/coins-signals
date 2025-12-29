import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArrowLeft, Search, TrendingUp, BarChart3, Gem, LineChart, Bitcoin, Star, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
];

type Broker = typeof brokers[0];

export default function BrokerRating() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('Principiante');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  
  // Advanced filters
  const [location, setLocation] = useState('');
  const [currency, setCurrency] = useState('');
  const [depositRange, setDepositRange] = useState('');
  const [method, setMethod] = useState('');
  const [operation, setOperation] = useState('');
  const [markets, setMarkets] = useState('');

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = broker.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = broker.level === selectedLevel;
    const matchesCategory = !selectedCategory || broker.instruments.some(i => 
      i.toLowerCase().includes(selectedCategory.toLowerCase())
    );
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.floor(rating)
                ? 'fill-amber-400 text-amber-400'
                : star - 0.5 <= rating
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="text-xs text-foreground ml-1">{rating}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4 px-4 max-w-4xl mx-auto">
        {/* Back button and title */}
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-primary">Busca el Broker a tu medida</h1>
            <p className="text-xs text-muted-foreground">
              Aumenta y asegura tus ganancias escogiendo un broker a tu medida
            </p>
          </div>
        </div>

        {/* Search section */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-base font-semibold text-foreground mb-3">Buscar Broker</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tu Brokers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            <div className="flex items-start gap-4 mb-4">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40 bg-secondary">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Principiante">Principiante</SelectItem>
                  <SelectItem value="Intermedio">Intermedio</SelectItem>
                  <SelectItem value="Avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex-1">
                Existe un Broker a tu medida. Saca las mejores ganancias según tu manera de operar, tiempo en el mercado, comisión o spreads.
              </p>
            </div>

            {/* Categories */}
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

        {/* Advanced filters toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full mb-4 justify-between"
        >
          <span>Filtros avanzados</span>
          {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Advanced filters panel */}
        {showAdvancedFilters && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Selecciona Un Broker según tu perfil de trader
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                En muy pocos pasos podrás descubrir los mejores Broker según te forma de invertir, esto aumentará el éxito de tus operaciones
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Introduce el país de donde vives
                  </label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="europa">Europa</SelectItem>
                      <SelectItem value="latam">LATAM</SelectItem>
                      <SelectItem value="usa">USA</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Modo de Trader (tiempo en el mercado)
                  </label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Con cuánto dinero piensa abrir tu cuenta
                  </label>
                  <Select value={depositRange} onValueChange={setDepositRange}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Depósito Inicial" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="100-500">$100 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000+">$1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Cuál es la moneda de tu país
                  </label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Cuánto dinero piensas entrar al mercado
                  </label>
                  <Select value={operation} onValueChange={setOperation}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="En Operación" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="scalping">Scalping</SelectItem>
                      <SelectItem value="day">Day Trading</SelectItem>
                      <SelectItem value="swing">Swing Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Mercados en los que invertirás
                  </label>
                  <Select value={markets} onValueChange={setMarkets}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Mercados" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="acciones">Acciones</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="todos">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                Buscar Broker
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results header */}
        <p className="text-xs text-muted-foreground mb-4">
          Estos son los {filteredBrokers.length} Brokers Más Populares Para {selectedLevel}s en el mercado de {selectedCategory || 'Forex'}
        </p>

        {/* Broker cards */}
        <div className="space-y-4">
          {filteredBrokers.map((broker) => (
            <Card key={broker.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Logo */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-foreground">{broker.logo}</span>
                    </div>
                    <p className="text-xs text-foreground">Central: <span className="text-primary">{broker.central}</span></p>
                    <p className="text-xs text-primary">{broker.regions}</p>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-foreground">{broker.name}</h3>
                      <Badge variant="outline" className="text-primary border-primary text-xs">
                        {broker.level}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                      <div>
                        <span className="text-primary">Depósito inicial</span>
                        <p className="text-amber-400">{broker.depositMin}</p>
                      </div>
                      <div>
                        <span className="text-primary">Comisión</span> / <span className="text-primary">Spreads</span>
                        <p><span className="text-amber-400">{broker.commission}</span> <span className="text-primary ml-2">{broker.spreads}</span></p>
                      </div>
                      <div>
                        <span className="text-primary">Plataforma</span>
                        <p className="text-foreground">{broker.platform.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-primary">Apalancamiento</span>
                        <p className="text-foreground">{broker.leverage.scb} (SCB)<br />{broker.leverage.fca} (FCA)</p>
                      </div>
                      <div>
                        <span className="text-primary">Regulaciones</span>
                        <p className="text-foreground">{broker.regulations.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-primary">Instrumentos</span>
                        <p className="text-foreground">{broker.instruments.join(', ')}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        {renderStars(broker.rating)}
                        <span className="text-xs text-muted-foreground ml-2">Comentarios</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90 text-xs"
                        onClick={() => setSelectedBroker(broker)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Broker Detail Dialog */}
      <Dialog open={!!selectedBroker} onOpenChange={() => setSelectedBroker(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card">
          <ScrollArea className="max-h-[90vh]">
            {selectedBroker && (
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <div className="flex justify-between items-start">
                    <DialogTitle className="text-2xl font-bold text-foreground">
                      {selectedBroker.name}
                    </DialogTitle>
                    <Badge variant="outline" className="text-primary border-primary">
                      {selectedBroker.level}
                    </Badge>
                  </div>
                </DialogHeader>

                {/* Header section */}
                <div className="flex gap-4 mb-6">
                  <div className="w-32 h-32 bg-secondary rounded-lg flex items-center justify-center">
                    <span className="text-4xl font-bold text-foreground">{selectedBroker.logo}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="text-primary font-semibold">Información Básica:</span> {selectedBroker.description}
                    </p>
                  </div>
                </div>

                {/* Basic info cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-primary text-sm">Depósito</span>
                        <span className="text-primary text-sm">Comisión</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-foreground text-sm">{selectedBroker.depositMin}</span>
                        <span className="text-amber-400 text-sm">{selectedBroker.commission} $</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-primary text-sm">Retiros</span>
                        <span className="text-primary text-sm">Spreads</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground text-sm">Sin Límites</span>
                        <span className="text-primary text-sm">{selectedBroker.spreads}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <span className="text-primary text-sm block mb-2">Apalancamientos</span>
                      <p className="text-foreground text-sm">{selectedBroker.leverage.scb} (SCB)</p>
                      <p className="text-foreground text-sm">{selectedBroker.leverage.fca} (FCA)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">Pro</h4>
                      <ul className="space-y-1">
                        {selectedBroker.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-red-400 font-semibold mb-2">Cons</h4>
                      <ul className="space-y-1">
                        {selectedBroker.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            {con}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <h4 className="text-primary font-semibold mb-1">Región Principal</h4>
                        <p className="text-xs text-foreground">{selectedBroker.mainRegion}</p>
                        <h4 className="text-primary font-semibold mt-2 mb-1">Países de Operación</h4>
                        <p className="text-xs text-foreground">{selectedBroker.operatingCountries}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Regulations and Instruments */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">Organismos de Regulación</h4>
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
                      <h4 className="text-primary font-semibold mb-2">Instrumentos Disponibles</h4>
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

                {/* Platforms and Account Types */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="text-primary font-semibold mb-2">Plataformas de Operación</h4>
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
                      <h4 className="text-primary font-semibold mb-2">Tipos de Cuentas</h4>
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

                <Button className="w-full mt-6 bg-primary hover:bg-primary/90">
                  Abrir Cuenta
                </Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
