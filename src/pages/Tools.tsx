import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollFadeTabs } from '@/components/ui/ScrollFadeTabs';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  ChevronRight, Calculator, CalendarDays, ScanSearch, BookOpen,
  TrendingUp, Target, DollarSign, Percent, BarChart3,
  CandlestickChart, Activity, Layers, Scale, Clock,
  LineChart, Gauge, PieChart, Workflow, Shield, Zap, Lock
} from 'lucide-react';

type ToolCategory = 'all' | 'calculadoras' | 'calendario' | 'screeners' | 'diario';

interface ToolItem {
  id: string;
  titleKey: string;
  descKey: string;
  icon: typeof Calculator;
  category: 'calculadoras' | 'calendario' | 'screeners' | 'diario';
  status: 'available' | 'coming_soon';
  route?: string;
}

const CATEGORY_TABS: { key: ToolCategory; labelKey: string; icon: typeof Calculator }[] = [
  { key: 'all', labelKey: 'tools_cat_all', icon: Layers },
  { key: 'calculadoras', labelKey: 'tools_cat_calculators', icon: Calculator },
  { key: 'calendario', labelKey: 'tools_cat_calendar', icon: CalendarDays },
  { key: 'screeners', labelKey: 'tools_cat_screeners', icon: ScanSearch },
  { key: 'diario', labelKey: 'tools_cat_journal', icon: BookOpen },
];

const ALL_TOOLS: ToolItem[] = [
  // Calculadoras
  { id: 'pip-calc', titleKey: 'tools_pip_calc_title', descKey: 'tools_pip_calc_desc', icon: DollarSign, category: 'calculadoras', status: 'available', route: '/tools/pip-calculator' },
  { id: 'lot-calc', titleKey: 'tools_lot_calc_title', descKey: 'tools_lot_calc_desc', icon: Calculator, category: 'calculadoras', status: 'available', route: '/tools/lot-calculator' },
  { id: 'margin-calc', titleKey: 'tools_margin_calc_title', descKey: 'tools_margin_calc_desc', icon: Percent, category: 'calculadoras', status: 'available', route: '/tools/margin-calculator' },
  { id: 'rr-calc', titleKey: 'tools_rr_calc_title', descKey: 'tools_rr_calc_desc', icon: Scale, category: 'calculadoras', status: 'available', route: '/tools/risk-reward' },
  { id: 'position-size', titleKey: 'tools_position_size_title', descKey: 'tools_position_size_desc', icon: Target, category: 'calculadoras', status: 'available', route: '/tools/position-sizing' },
  { id: 'swap-calc', titleKey: 'tools_swap_calc_title', descKey: 'tools_swap_calc_desc', icon: Clock, category: 'calculadoras', status: 'available', route: '/tools/swap-calculator' },
  { id: 'compound-calc', titleKey: 'tools_compound_calc_title', descKey: 'tools_compound_calc_desc', icon: LineChart, category: 'calculadoras', status: 'available', route: '/tools/compound-interest' },
  { id: 'monte-carlo', titleKey: 'tools_monte_carlo_title', descKey: 'tools_monte_carlo_desc', icon: PieChart, category: 'calculadoras', status: 'available', route: '/tools/monte-carlo' },
  { id: 'risk-manager', titleKey: 'tools_risk_manager_title', descKey: 'tools_risk_manager_desc', icon: Shield, category: 'calculadoras', status: 'available', route: '/tools/risk-manager' },
  // Calendario
  { id: 'eco-calendar', titleKey: 'tools_eco_calendar_title', descKey: 'tools_eco_calendar_desc', icon: CalendarDays, category: 'calendario', status: 'available', route: '/tools/economic-calendar' },
  { id: 'eco-calendar-inst', titleKey: 'tools_institutional_cal_title', descKey: 'tools_institutional_cal_desc', icon: CalendarDays, category: 'calendario', status: 'available', route: '/tools/institutional-calendar' },
  // Screeners
  { id: 'trend-scanner', titleKey: 'tools_trend_scanner_title', descKey: 'tools_trend_scanner_desc', icon: TrendingUp, category: 'screeners', status: 'available', route: '/tools/trend-scanner' },
  { id: 'rsi-screener', titleKey: 'tools_rsi_screener_title', descKey: 'tools_rsi_screener_desc', icon: Activity, category: 'screeners', status: 'available', route: '/tools/rsi-macd-screener' },
  { id: 'corr-matrix', titleKey: 'tools_corr_matrix_title', descKey: 'tools_corr_matrix_desc', icon: Layers, category: 'screeners', status: 'available', route: '/tools/correlation-matrix' },
  { id: 'volatility-scanner', titleKey: 'tools_volatility_title', descKey: 'tools_volatility_desc', icon: Gauge, category: 'screeners', status: 'available', route: '/tools/volatility-scanner' },
  { id: 'pattern-screener', titleKey: 'tools_pattern_screener_title', descKey: 'tools_pattern_screener_desc', icon: CandlestickChart, category: 'screeners', status: 'available', route: '/tools/pattern-screener' },
  { id: 'multi-tf-screener', titleKey: 'tools_multi_tf_title', descKey: 'tools_multi_tf_desc', icon: ScanSearch, category: 'screeners', status: 'available', route: '/tools/multi-tf-screener' },
  { id: 'order-flow', titleKey: 'tools_order_flow_title', descKey: 'tools_order_flow_desc', icon: Zap, category: 'screeners', status: 'available', route: '/tools/order-flow' },
  // Diario
  { id: 'trade-journal', titleKey: 'tools_journal_basic_title', descKey: 'tools_journal_basic_desc', icon: BookOpen, category: 'diario', status: 'available', route: '/tools/trading-journal' },
  { id: 'backtest-pro', titleKey: 'tools_backtest_pro_title', descKey: 'tools_backtest_pro_desc', icon: Workflow, category: 'diario', status: 'available', route: '/tools/backtest-pro' },
  { id: 'market-sessions', titleKey: 'tools_market_sessions_title', descKey: 'tools_market_sessions_desc', icon: Clock, category: 'calendario', status: 'available', route: '/tools/market-sessions' },
];
export default function Tools() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');

  const filtered = activeCategory === 'all'
    ? ALL_TOOLS
    : ALL_TOOLS.filter((tool) => tool.category === activeCategory);

  return (
    <PageShell>
      <Header />

      <main className="container py-6">
        {/* Title */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-muted-foreground">{t('tools_trading_label')}</span>
          <span className="text-xl font-bold text-foreground">{t('tools_title')}</span>
        </div>

        {/* Category tabs - horizontal scroll with dynamic fade edges */}
        <ScrollFadeTabs className="mb-5">
          {CATEGORY_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeCategory === tab.key;
            const count = tab.key === 'all'
              ? ALL_TOOLS.length
              : ALL_TOOLS.filter((t) => t.category === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all shrink-0 min-h-[32px] min-w-0 active:scale-95",
                  isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {t(tab.labelKey as any)}
                <span className={cn(
                  "text-[10px] px-1.5 rounded-full",
                  isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>{count}</span>
              </button>
            );
          })}
        </ScrollFadeTabs>

        {/* Tools list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {filtered.map((tool, index) => {
                  const ToolIcon = tool.icon;
                  const isComingSoon = tool.status === 'coming_soon';
                  const isClickable = !!tool.route && !isComingSoon;

                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => isClickable && navigate(tool.route!)}
                      className={cn(
                        "flex items-center justify-between p-4 transition-colors",
                        index !== filtered.length - 1 && "border-b border-border",
                        isClickable && "cursor-pointer hover:bg-secondary",
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
                          <p className="font-medium text-foreground">{t(tool.titleKey as any)}</p>
                          <p className="text-xs text-muted-foreground">{t(tool.descKey as any)}</p>
                        </div>
                      </div>
                      {isClickable ? (
                        <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                      ) : isComingSoon ? (
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : null}
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </PageShell>
  );
}
