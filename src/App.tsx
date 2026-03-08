import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionGate } from "@/components/subscriptions/SubscriptionGate";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Lazy load all pages
const News = lazy(() => import("./pages/News"));
const SavedNews = lazy(() => import("./pages/SavedNews"));
const Signals = lazy(() => import("./pages/Signals"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Settings = lazy(() => import("./pages/Settings"));
const PersonalInfo = lazy(() => import("./pages/settings/PersonalInfo"));
const Documents = lazy(() => import("./pages/settings/Documents"));
const Security = lazy(() => import("./pages/settings/Security"));
const Notifications = lazy(() => import("./pages/settings/Notifications"));
const Appearance = lazy(() => import("./pages/settings/Appearance"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Broker = lazy(() => import("./pages/Broker"));
const Support = lazy(() => import("./pages/Support"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Courses = lazy(() => import("./pages/Courses"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const Install = lazy(() => import("./pages/Install"));
const Performance = lazy(() => import("./pages/Performance"));
const About = lazy(() => import("./pages/About"));
const BrokerRating = lazy(() => import("./pages/BrokerRating"));
const LinkBroker = lazy(() => import("./pages/LinkBroker"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const CreateSignal = lazy(() => import("./pages/CreateSignal"));

const AICenter = lazy(() => import("./pages/AICenter"));
const Stocks = lazy(() => import("./pages/Stocks"));
const MediaLibrary = lazy(() => import("./pages/MediaLibrary"));
const Tools = lazy(() => import("./pages/Tools"));
const PipCalculator = lazy(() => import("./pages/tools/PipCalculator"));
const EconomicCalendar = lazy(() => import("./pages/tools/EconomicCalendar"));
const RsiMacdScreener = lazy(() => import("./pages/tools/RsiMacdScreener"));
const LotCalculator = lazy(() => import("./pages/tools/LotCalculator"));
const MarginCalculator = lazy(() => import("./pages/tools/MarginCalculator"));
const TradingJournal = lazy(() => import("./pages/tools/TradingJournal"));
const TrendScanner = lazy(() => import("./pages/tools/TrendScanner"));
const RiskRewardCalculator = lazy(() => import("./pages/tools/RiskRewardCalculator"));
const PositionSizing = lazy(() => import("./pages/tools/PositionSizing"));
const SwapCalculator = lazy(() => import("./pages/tools/SwapCalculator"));
const CompoundInterestCalculator = lazy(() => import("./pages/tools/CompoundInterestCalculator"));
const CorrelationMatrix = lazy(() => import("./pages/tools/CorrelationMatrix"));
const VolatilityScanner = lazy(() => import("./pages/tools/VolatilityScanner"));
const PatternScreener = lazy(() => import("./pages/tools/PatternScreener"));
const MonteCarloSimulation = lazy(() => import("./pages/tools/MonteCarloSimulation"));
const RiskManagerAdvanced = lazy(() => import("./pages/tools/RiskManagerAdvanced"));
const MultiTFScreener = lazy(() => import("./pages/tools/MultiTFScreener"));
const OrderFlowAnalysis = lazy(() => import("./pages/tools/OrderFlowAnalysis"));
const BacktestPro = lazy(() => import("./pages/tools/BacktestPro"));
const InstitutionalCalendar = lazy(() => import("./pages/tools/InstitutionalCalendar"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min - reduce refetches
      gcTime: 1000 * 60 * 10, // 10 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnReconnect: 'always',
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />} key={location.pathname}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Analysis />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/saved" element={<SavedNews />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/profile" element={<Settings />} />
          <Route path="/settings/personal" element={<PersonalInfo />} />
          <Route path="/settings/documents" element={<Documents />} />
          <Route path="/settings/security" element={<Security />} />
          <Route path="/settings/notifications" element={<Notifications />} />
          <Route path="/settings/appearance" element={<Appearance />} />
          <Route path="/settings/language" element={<Appearance />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/broker" element={<Broker />} />
          <Route path="/support" element={<Support />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/media/:type" element={<MediaLibrary />} />
          <Route path="/courses/lesson/:lessonId" element={<LessonDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/install" element={<Install />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/about" element={<About />} />
          <Route path="/broker-rating" element={<BrokerRating />} />
          <Route path="/link-broker" element={<LinkBroker />} />
          <Route path="/portfolio" element={<SubscriptionGate requiredTier="premium" featureName="Portfolio Multi-Broker"><Portfolio /></SubscriptionGate>} />
          <Route path="/create-signal" element={<CreateSignal />} />
          
          <Route path="/ai-center" element={<SubscriptionGate requiredTier="plus" featureName="Centro de IA"><AICenter /></SubscriptionGate>} />
          <Route path="/stocks" element={<SubscriptionGate requiredTier="plus" featureName="Análisis de Acciones"><Stocks /></SubscriptionGate>} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/pip-calculator" element={<PipCalculator />} />
          <Route path="/tools/economic-calendar" element={<EconomicCalendar />} />
          <Route path="/tools/rsi-macd-screener" element={<RsiMacdScreener />} />
          <Route path="/tools/lot-calculator" element={<LotCalculator />} />
          <Route path="/tools/margin-calculator" element={<MarginCalculator />} />
          <Route path="/tools/trading-journal" element={<TradingJournal />} />
          <Route path="/tools/trend-scanner" element={<TrendScanner />} />
          <Route path="/tools/risk-reward" element={<RiskRewardCalculator />} />
          <Route path="/tools/position-sizing" element={<PositionSizing />} />
          <Route path="/tools/swap-calculator" element={<SwapCalculator />} />
          <Route path="/tools/compound-interest" element={<CompoundInterestCalculator />} />
          <Route path="/tools/correlation-matrix" element={<CorrelationMatrix />} />
          <Route path="/tools/volatility-scanner" element={<VolatilityScanner />} />
          <Route path="/tools/pattern-screener" element={<PatternScreener />} />
          <Route path="/tools/monte-carlo" element={<MonteCarloSimulation />} />
          <Route path="/tools/risk-manager" element={<RiskManagerAdvanced />} />
          <Route path="/tools/multi-tf-screener" element={<MultiTFScreener />} />
          <Route path="/tools/order-flow" element={<OrderFlowAnalysis />} />
          <Route path="/tools/backtest-pro" element={<BacktestPro />} />
          <Route path="/tools/institutional-calendar" element={<InstitutionalCalendar />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OnboardingTour />
            <PWAInstallBanner />
            <AnimatedRoutes />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
