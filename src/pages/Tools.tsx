import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, CalendarDays, ScanSearch, BookOpen,
  TrendingUp, Target, DollarSign, Percent, BarChart3,
  CandlestickChart, Activity, Layers, Scale, Clock,
  LineChart, Gauge, PieChart, Workflow, Shield, Zap,
  GraduationCap, Award, Crown, Star
} from 'lucide-react';

type TraderLevel = 'novato' | 'medio' | 'avanzado' | 'profesional';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: typeof Calculator;
  category: 'calculadoras' | 'calendario' | 'screeners' | 'diario';
  status: 'available' | 'coming_soon';
  accent: string;
  route?: string;
}

const LEVELS: { id: TraderLevel; label: string; icon: typeof GraduationCap; color: string }[] = [
  { id: 'novato', label: 'Novato', icon: GraduationCap, color: 'text-emerald-400' },
  { id: 'medio', label: 'Intermedio', icon: Award, color: 'text-blue-400' },
  { id: 'avanzado', label: 'Avanzado', icon: Star, color: 'text-amber-400' },
  { id: 'profesional', label: 'Profesional', icon: Crown, color: 'text-purple-400' },
];

const TOOLS_BY_LEVEL: Record<TraderLevel, ToolItem[]> = {
  novato: [
    { id: 'pip-calc', title: 'Calculadora de Pips', description: 'Calcula el valor de pips para cualquier par de divisas', icon: DollarSign, category: 'calculadoras', status: 'available', accent: 'emerald', route: '/tools/pip-calculator' },
    { id: 'lot-calc', title: 'Calculadora de Lotes', description: 'Determina el tamaño de lote ideal según tu capital', icon: Calculator, category: 'calculadoras', status: 'available', accent: 'emerald' },
    { id: 'margin-calc', title: 'Calculadora de Margen', description: 'Calcula el margen requerido para abrir posiciones', icon: Percent, category: 'calculadoras', status: 'available', accent: 'emerald' },
    { id: 'eco-calendar-basic', title: 'Calendario Económico', description: 'Eventos de alto impacto con alertas básicas', icon: CalendarDays, category: 'calendario', status: 'available', accent: 'blue', route: '/tools/economic-calendar' },
    { id: 'trade-journal-basic', title: 'Diario de Trading Básico', description: 'Registra tus operaciones con notas simples', icon: BookOpen, category: 'diario', status: 'available', accent: 'amber' },
    { id: 'trend-scanner', title: 'Escáner de Tendencias', description: 'Identifica la dirección general del mercado', icon: TrendingUp, category: 'screeners', status: 'available', accent: 'cyan' },
  ],
  medio: [
    { id: 'rr-calc', title: 'Calculadora Riesgo/Recompensa', description: 'Evalúa la relación riesgo-beneficio antes de operar', icon: Scale, category: 'calculadoras', status: 'available', accent: 'blue' },
    { id: 'position-size', title: 'Position Sizing', description: 'Calcula el tamaño óptimo de posición con gestión de riesgo', icon: Target, category: 'calculadoras', status: 'available', accent: 'blue' },
    { id: 'swap-calc', title: 'Calculadora de Swaps', description: 'Estima el costo de mantener posiciones overnight', icon: Clock, category: 'calculadoras', status: 'available', accent: 'blue' },
    { id: 'eco-calendar-adv', title: 'Calendario con Impacto IA', description: 'Análisis de impacto potencial en pares específicos', icon: CalendarDays, category: 'calendario', status: 'available', accent: 'purple' },
    { id: 'rsi-screener', title: 'Screener RSI/MACD', description: 'Detecta sobrecompra/sobreventa en múltiples pares', icon: Activity, category: 'screeners', status: 'available', accent: 'cyan' },
    { id: 'trade-journal-stats', title: 'Diario con Estadísticas', description: 'Métricas de rendimiento: win rate, drawdown, profit factor', icon: BarChart3, category: 'diario', status: 'available', accent: 'amber' },
  ],
  avanzado: [
    { id: 'compound-calc', title: 'Calculadora de Interés Compuesto', description: 'Proyecta el crecimiento de tu cuenta con reinversión', icon: LineChart, category: 'calculadoras', status: 'available', accent: 'amber' },
    { id: 'corr-matrix', title: 'Matriz de Correlación', description: 'Analiza correlaciones entre múltiples instrumentos', icon: Layers, category: 'screeners', status: 'available', accent: 'purple' },
    { id: 'volatility-scanner', title: 'Escáner de Volatilidad', description: 'ATR, Bollinger width y volatilidad histórica en tiempo real', icon: Gauge, category: 'screeners', status: 'available', accent: 'cyan' },
    { id: 'pattern-screener', title: 'Screener de Patrones', description: 'Detecta patrones chartistas automáticamente con IA', icon: CandlestickChart, category: 'screeners', status: 'available', accent: 'cyan' },
    { id: 'backtest-basic', title: 'Backtesting Básico', description: 'Prueba estrategias simples con datos históricos', icon: Workflow, category: 'diario', status: 'available', accent: 'amber' },
    { id: 'eco-calendar-pro', title: 'Calendario con Predicciones', description: 'Predicciones IA del impacto en precio pre/post evento', icon: CalendarDays, category: 'calendario', status: 'available', accent: 'purple' },
  ],
  profesional: [
    { id: 'monte-carlo', title: 'Simulación Monte Carlo', description: 'Proyecciones probabilísticas de rendimiento de estrategia', icon: PieChart, category: 'calculadoras', status: 'coming_soon', accent: 'purple' },
    { id: 'risk-manager', title: 'Risk Manager Avanzado', description: 'Control de exposición multi-cuenta con alertas automáticas', icon: Shield, category: 'calculadoras', status: 'coming_soon', accent: 'purple' },
    { id: 'multi-tf-screener', title: 'Screener Multi-Timeframe', description: 'Confluencia de indicadores en múltiples temporalidades', icon: ScanSearch, category: 'screeners', status: 'available', accent: 'cyan' },
    { id: 'order-flow', title: 'Análisis de Flujo de Órdenes', description: 'Volumen institucional y posicionamiento del mercado', icon: Zap, category: 'screeners', status: 'coming_soon', accent: 'cyan' },
    { id: 'backtest-pro', title: 'Backtesting Multi-Estrategia', description: 'Backtesting avanzado con múltiples estrategias simultáneas', icon: Workflow, category: 'diario', status: 'coming_soon', accent: 'amber' },
    { id: 'eco-calendar-inst', title: 'Calendario Institucional', description: 'Datos de consenso, histórico de desviaciones y reacciones', icon: CalendarDays, category: 'calendario', status: 'coming_soon', accent: 'purple' },
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  calculadoras: 'from-emerald-500/20 to-emerald-600/5',
  calendario: 'from-blue-500/20 to-blue-600/5',
  screeners: 'from-cyan-500/20 to-cyan-600/5',
  diario: 'from-amber-500/20 to-amber-600/5',
};

const CATEGORY_LABELS: Record<string, string> = {
  calculadoras: 'Calculadora',
  calendario: 'Calendario',
  screeners: 'Screener',
  diario: 'Diario/Backtest',
};

export default function Tools() {
  const [activeLevel, setActiveLevel] = useState<TraderLevel>('novato');
  const tools = TOOLS_BY_LEVEL[activeLevel];

  return (
    <PageShell>
      <div className="px-4 py-4 pb-24 space-y-5">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Herramientas de Trading</h1>
            <p className="text-xs text-muted-foreground">Selecciona tu nivel para ver las herramientas disponibles</p>
          </div>
        </div>

        {/* Level tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {LEVELS.map((level) => {
            const LevelIcon = level.icon;
            const isActive = activeLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setActiveLevel(level.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border",
                  isActive
                    ? "bg-primary/15 border-primary/40 text-foreground shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                    : "bg-card/60 border-border/50 text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <LevelIcon className={cn("w-4 h-4", isActive ? level.color : "text-muted-foreground")} />
                {level.label}
              </button>
            );
          })}
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <span
              key={key}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full font-medium bg-gradient-to-r border border-border/30",
                CATEGORY_COLORS[key],
                "text-muted-foreground"
              )}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Tools grid */}
        <div className="grid gap-3">
          {tools.map((tool) => {
            const ToolIcon = tool.icon;
            const isComingSoon = tool.status === 'coming_soon';
            return (
              <SignalStyleCard
                key={tool.id}
                className={cn(
                  "p-4 transition-all",
                  isComingSoon && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br",
                    CATEGORY_COLORS[tool.category]
                  )}>
                    <ToolIcon className={cn(
                      "w-5 h-5",
                      tool.category === 'calculadoras' && "text-emerald-400",
                      tool.category === 'calendario' && "text-blue-400",
                      tool.category === 'screeners' && "text-cyan-400",
                      tool.category === 'diario' && "text-amber-400",
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{tool.title}</h3>
                      {isComingSoon && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold uppercase">
                          Próximamente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tool.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium bg-gradient-to-r border border-border/30",
                        CATEGORY_COLORS[tool.category],
                        "text-muted-foreground"
                      )}>
                        {CATEGORY_LABELS[tool.category]}
                      </span>
                    </div>
                  </div>
                </div>
              </SignalStyleCard>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}