import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/LanguageContext';
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
  titleKey: string;
  descKey: string;
  icon: typeof Calculator;
  category: 'calculadoras' | 'calendario' | 'screeners' | 'diario';
  status: 'available' | 'coming_soon';
  route?: string;
}

const LEVEL_KEYS: Record<TraderLevel, string> = {
  novato: 'tools_level_novice',
  medio: 'tools_level_intermediate',
  avanzado: 'tools_level_advanced',
  profesional: 'tools_level_professional',
};

const LEVEL_ICONS: Record<TraderLevel, typeof GraduationCap> = {
  novato: GraduationCap,
  medio: Award,
  avanzado: Star,
  profesional: Crown,
};

const LEVELS: TraderLevel[] = ['novato', 'medio', 'avanzado', 'profesional'];

const CATEGORY_KEYS: Record<string, string> = {
  calculadoras: 'tools_cat_calculators',
  calendario: 'tools_cat_calendar',
  screeners: 'tools_cat_screeners',
  diario: 'tools_cat_journal',
};

const TOOLS_BY_LEVEL: Record<TraderLevel, ToolItem[]> = {
  novato: [
    { id: 'pip-calc', titleKey: 'tools_pip_calc_title', descKey: 'tools_pip_calc_desc', icon: DollarSign, category: 'calculadoras', status: 'available', route: '/tools/pip-calculator' },
    { id: 'lot-calc', titleKey: 'tools_lot_calc_title', descKey: 'tools_lot_calc_desc', icon: Calculator, category: 'calculadoras', status: 'available', route: '/tools/lot-calculator' },
    { id: 'margin-calc', titleKey: 'tools_margin_calc_title', descKey: 'tools_margin_calc_desc', icon: Percent, category: 'calculadoras', status: 'available', route: '/tools/margin-calculator' },
    { id: 'eco-calendar-basic', titleKey: 'tools_eco_calendar_title', descKey: 'tools_eco_calendar_desc', icon: CalendarDays, category: 'calendario', status: 'available', route: '/tools/economic-calendar' },
    { id: 'trade-journal-basic', titleKey: 'tools_journal_basic_title', descKey: 'tools_journal_basic_desc', icon: BookOpen, category: 'diario', status: 'available', route: '/tools/trading-journal' },
    { id: 'trend-scanner', titleKey: 'tools_trend_scanner_title', descKey: 'tools_trend_scanner_desc', icon: TrendingUp, category: 'screeners', status: 'available', route: '/tools/trend-scanner' },
  ],
  medio: [
    { id: 'rr-calc', titleKey: 'tools_rr_calc_title', descKey: 'tools_rr_calc_desc', icon: Scale, category: 'calculadoras', status: 'available', route: '/tools/risk-reward' },
    { id: 'position-size', titleKey: 'tools_position_size_title', descKey: 'tools_position_size_desc', icon: Target, category: 'calculadoras', status: 'available', route: '/tools/position-sizing' },
    { id: 'swap-calc', titleKey: 'tools_swap_calc_title', descKey: 'tools_swap_calc_desc', icon: Clock, category: 'calculadoras', status: 'available', route: '/tools/swap-calculator' },
    { id: 'eco-calendar-adv', titleKey: 'tools_eco_ai_title', descKey: 'tools_eco_ai_desc', icon: CalendarDays, category: 'calendario', status: 'available' },
    { id: 'rsi-screener', titleKey: 'tools_rsi_screener_title', descKey: 'tools_rsi_screener_desc', icon: Activity, category: 'screeners', status: 'available', route: '/tools/rsi-macd-screener' },
    { id: 'trade-journal-stats', titleKey: 'tools_journal_stats_title', descKey: 'tools_journal_stats_desc', icon: BarChart3, category: 'diario', status: 'available' },
  ],
  avanzado: [
    { id: 'compound-calc', titleKey: 'tools_compound_calc_title', descKey: 'tools_compound_calc_desc', icon: LineChart, category: 'calculadoras', status: 'available', route: '/tools/compound-interest' },
    { id: 'corr-matrix', titleKey: 'tools_corr_matrix_title', descKey: 'tools_corr_matrix_desc', icon: Layers, category: 'screeners', status: 'available', route: '/tools/correlation-matrix' },
    { id: 'volatility-scanner', titleKey: 'tools_volatility_title', descKey: 'tools_volatility_desc', icon: Gauge, category: 'screeners', status: 'available', route: '/tools/volatility-scanner' },
    { id: 'pattern-screener', titleKey: 'tools_pattern_screener_title', descKey: 'tools_pattern_screener_desc', icon: CandlestickChart, category: 'screeners', status: 'available', route: '/tools/pattern-screener' },
    { id: 'backtest-basic', titleKey: 'tools_backtest_basic_title', descKey: 'tools_backtest_basic_desc', icon: Workflow, category: 'diario', status: 'available' },
    { id: 'eco-calendar-pro', titleKey: 'tools_eco_predictions_title', descKey: 'tools_eco_predictions_desc', icon: CalendarDays, category: 'calendario', status: 'available' },
  ],
  profesional: [
    { id: 'monte-carlo', titleKey: 'tools_monte_carlo_title', descKey: 'tools_monte_carlo_desc', icon: PieChart, category: 'calculadoras', status: 'available', route: '/tools/monte-carlo' },
    { id: 'risk-manager', titleKey: 'tools_risk_manager_title', descKey: 'tools_risk_manager_desc', icon: Shield, category: 'calculadoras', status: 'available', route: '/tools/risk-manager' },
    { id: 'multi-tf-screener', titleKey: 'tools_multi_tf_title', descKey: 'tools_multi_tf_desc', icon: ScanSearch, category: 'screeners', status: 'available', route: '/tools/multi-tf-screener' },
    { id: 'order-flow', titleKey: 'tools_order_flow_title', descKey: 'tools_order_flow_desc', icon: Zap, category: 'screeners', status: 'available', route: '/tools/order-flow' },
    { id: 'backtest-pro', titleKey: 'tools_backtest_pro_title', descKey: 'tools_backtest_pro_desc', icon: Workflow, category: 'diario', status: 'available', route: '/tools/backtest-pro' },
    { id: 'eco-calendar-inst', titleKey: 'tools_institutional_cal_title', descKey: 'tools_institutional_cal_desc', icon: CalendarDays, category: 'calendario', status: 'available', route: '/tools/institutional-calendar' },
  ],
};

export default function Tools() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
          <span className="text-xs text-muted-foreground">{t('tools_trading_label')}</span>
          <span className="text-xl font-bold text-foreground">{t('tools_title')}</span>
        </div>

        {/* Level tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {LEVELS.map((levelId) => {
            const LevelIcon = LEVEL_ICONS[levelId];
            const isActive = activeLevel === levelId;
            return (
              <button
                key={levelId}
                onClick={() => setActiveLevel(levelId)}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200",
                  isActive
                    ? "bg-primary/10 border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20"
                    : "bg-card border-border hover:border-primary/40 hover:bg-secondary/50"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive ? "bg-primary/20" : "bg-muted"
                )}>
                  <LevelIcon className={cn("w-4.5 h-4.5", isActive ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "text-sm font-semibold truncate",
                    isActive ? "text-primary" : "text-foreground"
                  )}>{t(LEVEL_KEYS[levelId] as any)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {TOOLS_BY_LEVEL[levelId].length} {t('tools_count')}
                  </p>
                </div>
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Grouped tool sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLevel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
          {Object.entries(grouped).map(([category, items], catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: catIndex * 0.08 }}
            >
              <h2 className="text-sm font-semibold text-primary mb-3">
                {t(CATEGORY_KEYS[category] as any) || category}
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
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isClickable ? "bg-primary/15" : "bg-secondary"
                          )}>
                            <ToolIcon className={cn("w-5 h-5", isClickable ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{t(tool.titleKey as any)}</p>
                              {isClickable && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase tracking-wider">
                                  {t('tools_active')}
                                </span>
                              )}
                              {isComingSoon && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                                  {t('tools_coming_soon')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{t(tool.descKey as any)}</p>
                          </div>
                        </div>
                        {isClickable ? (
                          <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                        ) : isComingSoon ? (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : null}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </motion.div>
        </AnimatePresence>
      </main>
    </PageShell>
  );
}