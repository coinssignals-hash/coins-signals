import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ChevronRight,
  Calculator, CalendarDays, ScanSearch, BookOpen,
  TrendingUp, Target, DollarSign, Percent, BarChart3,
  CandlestickChart, Activity, Layers, Scale, Clock,
  LineChart, Gauge, PieChart, Workflow, Shield, Zap,
  GraduationCap, Award, Crown, Star, Lock
} from 'lucide-react';

type TraderLevel = 'novato' | 'medio' | 'avanzado' | 'profesional';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: typeof Calculator;
  category: 'calculadoras' | 'calendario' | 'screeners' | 'diario';
  status: 'available' | 'coming_soon';
  route?: string;
}

const LEVELS: { id: TraderLevel; label: string; icon: typeof GraduationCap }[] = [
  { id: 'novato', label: 'Novato', icon: GraduationCap },
  { id: 'medio', label: 'Intermedio', icon: Award },
  { id: 'avanzado', label: 'Avanzado', icon: Star },
  { id: 'profesional', label: 'Profesional', icon: Crown },
];

const TOOLS_BY_LEVEL: Record<TraderLevel, ToolItem[]> = {
  novato: [
    { id: 'pip-calc', title: 'Calculadora de Pips', description: 'Calcula el valor de pips para cualquier par de divisas', icon: DollarSign, category: 'calculadoras', status: 'available', route: '/tools/pip-calculator' },
    { id: 'lot-calc', title: 'Calculadora de Lotes', description: 'Determina el tamaño de lote ideal según tu capital', icon: Calculator, category: 'calculadoras', status: 'available' },
    { id: 'margin-calc', title: 'Calculadora de Margen', description: 'Calcula el margen requerido para abrir posiciones', icon: Percent, category: 'calculadoras', status: 'available' },
    { id: 'eco-calendar-basic', title: 'Calendario Económico', description: 'Eventos de alto impacto con alertas básicas', icon: CalendarDays, category: 'calendario', status: 'available', route: '/tools/economic-calendar' },
    { id: 'trade-journal-basic', title: 'Diario de Trading Básico', description: 'Registra tus operaciones con notas simples', icon: BookOpen, category: 'diario', status: 'available' },
    { id: 'trend-scanner', title: 'Escáner de Tendencias', description: 'Identifica la dirección general del mercado', icon: TrendingUp, category: 'screeners', status: 'available' },
  ],
  medio: [
    { id: 'rr-calc', title: 'Calculadora Riesgo/Recompensa', description: 'Evalúa la relación riesgo-beneficio antes de operar', icon: Scale, category: 'calculadoras', status: 'available' },
    { id: 'position-size', title: 'Position Sizing', description: 'Calcula el tamaño óptimo de posición con gestión de riesgo', icon: Target, category: 'calculadoras', status: 'available' },
    { id: 'swap-calc', title: 'Calculadora de Swaps', description: 'Estima el costo de mantener posiciones overnight', icon: Clock, category: 'calculadoras', status: 'available' },
    { id: 'eco-calendar-adv', title: 'Calendario con Impacto IA', description: 'Análisis de impacto potencial en pares específicos', icon: CalendarDays, category: 'calendario', status: 'available' },
    { id: 'rsi-screener', title: 'Screener RSI/MACD', description: 'Detecta sobrecompra/sobreventa en múltiples pares', icon: Activity, category: 'screeners', status: 'available', route: '/tools/rsi-macd-screener' },
    { id: 'trade-journal-stats', title: 'Diario con Estadísticas', description: 'Métricas de rendimiento: win rate, drawdown, profit factor', icon: BarChart3, category: 'diario', status: 'available' },
  ],
  avanzado: [
    { id: 'compound-calc', title: 'Calculadora de Interés Compuesto', description: 'Proyecta el crecimiento de tu cuenta con reinversión', icon: LineChart, category: 'calculadoras', status: 'available' },
    { id: 'corr-matrix', title: 'Matriz de Correlación', description: 'Analiza correlaciones entre múltiples instrumentos', icon: Layers, category: 'screeners', status: 'available' },
    { id: 'volatility-scanner', title: 'Escáner de Volatilidad', description: 'ATR, Bollinger width y volatilidad histórica en tiempo real', icon: Gauge, category: 'screeners', status: 'available' },
    { id: 'pattern-screener', title: 'Screener de Patrones', description: 'Detecta patrones chartistas automáticamente con IA', icon: CandlestickChart, category: 'screeners', status: 'available' },
    { id: 'backtest-basic', title: 'Backtesting Básico', description: 'Prueba estrategias simples con datos históricos', icon: Workflow, category: 'diario', status: 'available' },
    { id: 'eco-calendar-pro', title: 'Calendario con Predicciones', description: 'Predicciones IA del impacto en precio pre/post evento', icon: CalendarDays, category: 'calendario', status: 'available' },
  ],
  profesional: [
    { id: 'monte-carlo', title: 'Simulación Monte Carlo', description: 'Proyecciones probabilísticas de rendimiento de estrategia', icon: PieChart, category: 'calculadoras', status: 'coming_soon' },
    { id: 'risk-manager', title: 'Risk Manager Avanzado', description: 'Control de exposición multi-cuenta con alertas automáticas', icon: Shield, category: 'calculadoras', status: 'coming_soon' },
    { id: 'multi-tf-screener', title: 'Screener Multi-Timeframe', description: 'Confluencia de indicadores en múltiples temporalidades', icon: ScanSearch, category: 'screeners', status: 'available' },
    { id: 'order-flow', title: 'Análisis de Flujo de Órdenes', description: 'Volumen institucional y posicionamiento del mercado', icon: Zap, category: 'screeners', status: 'coming_soon' },
    { id: 'backtest-pro', title: 'Backtesting Multi-Estrategia', description: 'Backtesting avanzado con múltiples estrategias simultáneas', icon: Workflow, category: 'diario', status: 'coming_soon' },
    { id: 'eco-calendar-inst', title: 'Calendario Institucional', description: 'Datos de consenso, histórico de desviaciones y reacciones', icon: CalendarDays, category: 'calendario', status: 'coming_soon' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  calculadoras: 'Calculadoras',
  calendario: 'Calendario',
  screeners: 'Screeners',
  diario: 'Diario & Backtest',
};

export default function Tools() {
  const navigate = useNavigate();
  const [activeLevel, setActiveLevel] = useState<TraderLevel>('novato');
  const tools = TOOLS_BY_LEVEL[activeLevel];

  // Group tools by category
  const grouped = tools.reduce<Record<string, ToolItem[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {});

  return (
    <PageShell>
      <Header />

      <main className="container py-6">
        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">Trading</span>
          <span className="text-xl font-bold text-foreground">Herramientas</span>
        </div>

        {/* Level tabs */}
        <div className="flex gap-1 p-1 mb-6 rounded-lg bg-muted/50">
          {LEVELS.map((level) => {
            const LevelIcon = level.icon;
            const isActive = activeLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setActiveLevel(level.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-md text-xs font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LevelIcon className="w-3.5 h-3.5" />
                <span className="hidden min-[380px]:inline">{level.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grouped tool sections */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-primary mb-3">
                {CATEGORY_LABELS[category] || category}
              </h2>
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  {items.map((tool, index) => {
                    const ToolIcon = tool.icon;
                    const isComingSoon = tool.status === 'coming_soon';
                    const isClickable = !!tool.route && !isComingSoon;

                    return (
                      <div
                        key={tool.id}
                        onClick={() => isClickable && navigate(tool.route!)}
                        className={cn(
                          "flex items-center justify-between p-4 transition-colors",
                          index !== items.length - 1 && "border-b border-border",
                          isClickable && "cursor-pointer hover:bg-secondary",
                          !isClickable && !isComingSoon && "hover:bg-secondary/50",
                          isComingSoon && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <ToolIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{tool.title}</p>
                              {isComingSoon && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                                  Próx.
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>
                        {isClickable ? (
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : isComingSoon ? (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : null}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
