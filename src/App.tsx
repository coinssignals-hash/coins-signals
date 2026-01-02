import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const News = lazy(() => import("./pages/News"));
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
const Analysis = lazy(() => import("./pages/Analysis"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/news" element={<News />} />
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
              <Route path="/courses/lesson/:lessonId" element={<LessonDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/about" element={<About />} />
              <Route path="/broker-rating" element={<BrokerRating />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
