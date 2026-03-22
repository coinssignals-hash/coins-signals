import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  ChevronRight, Calculator, CalendarDays, ScanSearch, BookOpen,
  TrendingUp, Target, DollarSign, Percent, BarChart3,
  CandlestickChart, Activity, Layers, Scale, Clock,
  LineChart, Gauge, PieChart, Workflow, Shield, Zap, Lock, ArrowUpDown, Star, Heart
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
  color: string;
  popularity: number;
}

const CATEGORY_TABS: { key: ToolCategory; labelKey: string; emoji: string; color: string }[] = [
  { key: 'all', labelKey: 'tools_cat_all', emoji: '🧰', color: '200 80% 55%' },
  { key: 'calculadoras', labelKey: 'tools_cat_calculators', emoji: '🧮', color: '45 80% 55%' },
  { key: 'calendario', labelKey: 'tools_cat_calendar', emoji: '📅', color: '140 60% 50%' },
  { key: 'screeners', labelKey: 'tools_cat_screeners', emoji: '📡', color: '330 70% 60%' },
  { key: 'diario', labelKey: 'tools_cat_journal', emoji: '📓', color: '30 80% 50%' },
];

const ALL_TOOLS: ToolItem[] = [
  { id: 'trade-journal', titleKey: 'tools_journal_basic_title', descKey: 'tools_journal_basic_desc', icon: BookOpen, category: 'diario', status: 'available', route: '/tools/trading-journal', color: '30 80% 50%', popularity: 1 },
  { id: 'currency-converter', titleKey: 'tools_currency_converter_title', descKey: 'tools_currency_converter_desc', icon: ArrowUpDown, category: 'calculadoras', status: 'available', route: '/tools/currency-converter', color: '45 80% 55%', popularity: 2 },
  { id: 'eco-calendar', titleKey: 'tools_eco_calendar_title', descKey: 'tools_eco_calendar_desc', icon: CalendarDays, category: 'calendario', status: 'available', route: '/tools/economic-calendar', color: '140 60% 50%', popularity: 3 },
  { id: 'backtest-pro', titleKey: 'tools_backtest_pro_title', descKey: 'tools_backtest_pro_desc', icon: Workflow, category: 'diario', status: 'available', route: '/tools/backtest-pro', color: '30 80% 50%', popularity: 4 },
  { id: 'pip-calc', titleKey: 'tools_pip_calc_title', descKey: 'tools_pip_calc_desc', icon: DollarSign, category: 'calculadoras', status: 'available', route: '/tools/pip-calculator', color: '45 80% 55%', popularity: 5 },
  { id: 'lot-calc', titleKey: 'tools_lot_calc_title', descKey: 'tools_lot_calc_desc', icon: Calculator, category: 'calculadoras', status: 'available', route: '/tools/lot-calculator', color: '45 80% 55%', popularity: 6 },
  { id: 'position-size', titleKey: 'tools_position_size_title', descKey: 'tools_position_size_desc', icon: Target, category: 'calculadoras', status: 'available', route: '/tools/position-sizing', color: '45 80% 55%', popularity: 7 },
  { id: 'rr-calc', titleKey: 'tools_rr_calc_title', descKey: 'tools_rr_calc_desc', icon: Scale, category: 'calculadoras', status: 'available', route: '/tools/risk-reward', color: '45 80% 55%', popularity: 8 },
  { id: 'margin-calc', titleKey: 'tools_margin_calc_title', descKey: 'tools_margin_calc_desc', icon: Percent, category: 'calculadoras', status: 'available', route: '/tools/margin-calculator', color: '45 80% 55%', popularity: 9 },
  { id: 'risk-manager', titleKey: 'tools_risk_manager_title', descKey: 'tools_risk_manager_desc', icon: Shield, category: 'calculadoras', status: 'available', route: '/tools/risk-manager', color: '45 80% 55%', popularity: 10 },
  { id: 'swap-calc', titleKey: 'tools_swap_calc_title', descKey: 'tools_swap_calc_desc', icon: Clock, category: 'calculadoras', status: 'available', route: '/tools/swap-calculator', color: '45 80% 55%', popularity: 11 },
  { id: 'compound-calc', titleKey: 'tools_compound_calc_title', descKey: 'tools_compound_calc_desc', icon: LineChart, category: 'calculadoras', status: 'available', route: '/tools/compound-interest', color: '45 80% 55%', popularity: 12 },
  { id: 'monte-carlo', titleKey: 'tools_monte_carlo_title', descKey: 'tools_monte_carlo_desc', icon: PieChart, category: 'calculadoras', status: 'available', route: '/tools/monte-carlo', color: '45 80% 55%', popularity: 13 },
  { id: 'eco-calendar-inst', titleKey: 'tools_institutional_cal_title', descKey: 'tools_institutional_cal_desc', icon: CalendarDays, category: 'calendario', status: 'available', route: '/tools/institutional-calendar', color: '140 60% 50%', popularity: 14 },
  { id: 'market-sessions', titleKey: 'tools_market_sessions_title', descKey: 'tools_market_sessions_desc', icon: Clock, category: 'calendario', status: 'available', route: '/tools/market-sessions', color: '140 60% 50%', popularity: 15 },
  { id: 'trend-scanner', titleKey: 'tools_trend_scanner_title', descKey: 'tools_trend_scanner_desc', icon: TrendingUp, category: 'screeners', status: 'available', route: '/tools/trend-scanner', color: '330 70% 60%', popularity: 16 },
  { id: 'rsi-screener', titleKey: 'tools_rsi_screener_title', descKey: 'tools_rsi_screener_desc', icon: Activity, category: 'screeners', status: 'available', route: '/tools/rsi-macd-screener', color: '330 70% 60%', popularity: 17 },
  { id: 'corr-matrix', titleKey: 'tools_corr_matrix_title', descKey: 'tools_corr_matrix_desc', icon: Layers, category: 'screeners', status: 'available', route: '/tools/correlation-matrix', color: '330 70% 60%', popularity: 18 },
  { id: 'volatility-scanner', titleKey: 'tools_volatility_title', descKey: 'tools_volatility_desc', icon: Gauge, category: 'screeners', status: 'available', route: '/tools/volatility-scanner', color: '330 70% 60%', popularity: 19 },
  { id: 'pattern-screener', titleKey: 'tools_pattern_screener_title', descKey: 'tools_pattern_screener_desc', icon: CandlestickChart, category: 'screeners', status: 'available', route: '/tools/pattern-screener', color: '330 70% 60%', popularity: 20 },
  { id: 'multi-tf-screener', titleKey: 'tools_multi_tf_title', descKey: 'tools_multi_tf_desc', icon: ScanSearch, category: 'screeners', status: 'available', route: '/tools/multi-tf-screener', color: '330 70% 60%', popularity: 21 },
  { id: 'order-flow', titleKey: 'tools_order_flow_title', descKey: 'tools_order_flow_desc', icon: Zap, category: 'screeners', status: 'available', route: '/tools/order-flow', color: '330 70% 60%', popularity: 22 },
];

const FAV_STORAGE_KEY = 'favorite_tools';

function useFavoriteTools() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) || '[]');
    } catch { return []; }
  });

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFav };
}

/* ─── Featured + Favorites Carousel ─── */
function FeaturedCarousel({
  tools, navigate, t, favorites, onToggleFav, isFav,
}: {
  tools: ToolItem[];
  navigate: (path: string) => void;
  t: (k: string) => string;
  favorites: string[];
  onToggleFav: (id: string) => void;
  isFav: (id: string) => boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Build carousel: popular (top 4) + favorites (not already in top 4)
  const top4 = [...tools].sort((a, b) => a.popularity - b.popularity).slice(0, 4);
  const top4Ids = new Set(top4.map(t => t.id));
  const favTools = tools.filter(t => favorites.includes(t.id) && !top4Ids.has(t.id));
  const carouselItems = [...top4, ...favTools];

  // Track scroll position for dot indicators
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardW = 160 + 10; // width + gap
      const idx = Math.round(el.scrollLeft / cardW);
      setActiveIdx(Math.min(idx, carouselItems.length - 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [carouselItems.length]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <Star className="w-3.5 h-3.5" style={{ color: 'hsl(45 80% 55%)' }} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Popular {favTools.length > 0 ? `& ⭐` : ''}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      >
        {carouselItems.map((tool, i) => {
          const ToolIcon = tool.icon;
          const isPopular = top4Ids.has(tool.id);
          const isFavorited = isFav(tool.id);
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="snap-start shrink-0 w-[160px] relative"
            >
              {/* Favorite button */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(tool.id); }}
                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: isFavorited ? 'hsl(0 80% 60% / 0.2)' : 'hsl(var(--card) / 0.8)',
                  border: `1px solid ${isFavorited ? 'hsl(0 80% 60% / 0.4)' : 'hsl(var(--border) / 0.4)'}`,
                }}
              >
                <Heart
                  className={cn('w-3 h-3 transition-all', isFavorited ? 'text-rose-400 fill-rose-400' : 'text-muted-foreground')}
                />
              </button>

              <button
                onClick={() => tool.route && navigate(tool.route)}
                className="w-full rounded-xl p-3 flex flex-col items-start gap-2 text-left transition-all active:scale-95"
                style={{
                  background: `linear-gradient(145deg, hsl(${tool.color} / 0.15), hsl(var(--card) / 0.8))`,
                  border: `1px solid hsl(${tool.color} / 0.25)`,
                  boxShadow: `0 4px 16px hsl(${tool.color} / 0.1)`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, hsl(${tool.color} / 0.3), hsl(${tool.color} / 0.1))`,
                    border: `1px solid hsl(${tool.color} / 0.3)`,
                    boxShadow: `0 0 12px hsl(${tool.color} / 0.15)`,
                  }}
                >
                  <ToolIcon className="w-5 h-5" style={{ color: `hsl(${tool.color})` }} />
                </div>

                <div className="space-y-0.5 pr-5">
                  <p className="text-[12px] font-bold text-foreground leading-tight">{t(tool.titleKey as any)}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{t(tool.descKey as any)}</p>
                </div>

                <div className="mt-auto flex items-center gap-1">
                  {isPopular ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
                      background: `hsl(${tool.color} / 0.15)`,
                      color: `hsl(${tool.color})`,
                    }}>
                      #{top4.indexOf(tool) + 1}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{
                      background: 'hsl(0 80% 60% / 0.12)',
                      color: 'hsl(0 80% 60%)',
                    }}>
                      <Heart className="w-2.5 h-2.5 fill-current" /> Fav
                    </span>
                  )}
                  <ChevronRight className="w-3 h-3" style={{ color: `hsl(${tool.color} / 0.5)` }} />
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Scroll dots */}
      {carouselItems.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-1">
          {carouselItems.map((tool, i) => (
            <div
              key={tool.id}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === activeIdx ? 12 : 5,
                height: 5,
                background: i === activeIdx ? `hsl(${tool.color})` : 'hsl(var(--muted-foreground) / 0.2)',
                boxShadow: i === activeIdx ? `0 0 6px hsl(${tool.color} / 0.5)` : undefined,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tools() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const { favorites, toggle, isFav } = useFavoriteTools();

  const activeCatConfig = CATEGORY_TABS.find(c => c.key === activeCategory)!;
  const filtered = (activeCategory === 'all'
    ? ALL_TOOLS
    : ALL_TOOLS.filter((tool) => tool.category === activeCategory)
  ).sort((a, b) => a.popularity - b.popularity);

  return (
    <PageShell>
      <Header />

      <main className="container py-3 max-w-lg mx-auto px-3">
        {/* Featured + Favorites Carousel */}
        <FeaturedCarousel
          tools={ALL_TOOLS}
          navigate={navigate}
          t={t}
          favorites={favorites}
          onToggleFav={toggle}
          isFav={isFav}
        />

        {/* Category Tabs */}
        <div className="grid grid-cols-5 gap-1 mb-3">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeCategory === tab.key;
            const count = tab.key === 'all'
              ? ALL_TOOLS.length
              : ALL_TOOLS.filter((t) => t.category === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95',
                  isSelected ? 'text-foreground shadow-lg' : 'text-muted-foreground'
                )}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, hsl(${tab.color} / 0.2), hsl(${tab.color} / 0.08))`
                    : 'hsl(var(--card) / 0.5)',
                  border: `1px solid ${isSelected ? `hsl(${tab.color} / 0.35)` : 'hsl(var(--border) / 0.3)'}`,
                  boxShadow: isSelected ? `0 2px 8px hsl(${tab.color} / 0.15)` : undefined,
                }}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                <span className="truncate w-full text-center">{t(tab.labelKey as any)}</span>
                <span
                  className="text-[9px] font-bold px-1.5 rounded-full"
                  style={{
                    background: isSelected ? `hsl(${tab.color} / 0.2)` : 'hsl(var(--muted) / 0.5)',
                    color: isSelected ? `hsl(${tab.color})` : undefined,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tools List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="rounded-xl border overflow-hidden" style={{
              borderColor: `hsl(${activeCatConfig.color} / 0.2)`,
              background: 'hsl(var(--card) / 0.6)',
            }}>
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: `hsl(${activeCatConfig.color} / 0.08)` }}>
                <BarChart3 className="w-3.5 h-3.5" style={{ color: `hsl(${activeCatConfig.color})` }} />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t(activeCatConfig.labelKey as any)}
                </span>
                <span className="ml-auto text-[10px] font-bold tabular-nums" style={{ color: `hsl(${activeCatConfig.color})` }}>
                  {filtered.length}
                </span>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {filtered.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isComingSoon = tool.status === 'coming_soon';
                  const isClickable = !!tool.route && !isComingSoon;
                  const isFavorited = isFav(tool.id);

                  return (
                    <motion.div
                      key={tool.id}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
                      }}
                    >
                      <div
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-300 border-b',
                          isClickable ? 'hover:bg-muted/10' : 'opacity-40',
                        )}
                        style={{ borderColor: 'hsl(var(--border) / 0.15)' }}
                      >
                        {/* Favorite toggle in list */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggle(tool.id); }}
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                          style={{
                            background: isFavorited ? 'hsl(0 80% 60% / 0.12)' : 'transparent',
                          }}
                        >
                          <Heart
                            className={cn('w-3.5 h-3.5 transition-colors', isFavorited ? 'text-rose-400 fill-rose-400' : 'text-muted-foreground/40')}
                          />
                        </button>

                        <button
                          onClick={() => isClickable && navigate(tool.route!)}
                          disabled={!isClickable}
                          className={cn(
                            'flex-1 flex items-center gap-3 text-left',
                            isClickable ? 'active:scale-[0.98]' : 'cursor-not-allowed',
                          )}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: `linear-gradient(135deg, hsl(${tool.color} / 0.2), hsl(${tool.color} / 0.08))`,
                              border: `1px solid hsl(${tool.color} / 0.2)`,
                            }}
                          >
                            <ToolIcon className="w-4 h-4" style={{ color: `hsl(${tool.color})` }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{t(tool.titleKey as any)}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{t(tool.descKey as any)}</p>
                          </div>
                          {isClickable ? (
                            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: `hsl(${tool.color} / 0.6)` }} />
                          ) : isComingSoon ? (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          ) : null}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pb-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className="transition-all rounded-full"
              style={{
                width: activeCategory === tab.key ? 18 : 6,
                height: 6,
                background: activeCategory === tab.key ? `hsl(${tab.color})` : 'hsl(var(--muted-foreground) / 0.2)',
                boxShadow: activeCategory === tab.key ? `0 0 6px hsl(${tab.color} / 0.4)` : undefined,
              }}
            />
          ))}
        </div>
      </main>
    </PageShell>
  );
}
