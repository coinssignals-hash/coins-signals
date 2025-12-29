import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signals from "./pages/Signals";
import NewsDetail from "./pages/NewsDetail";
import Monitoring from "./pages/Monitoring";
import Settings from "./pages/Settings";
import PersonalInfo from "./pages/settings/PersonalInfo";
import Documents from "./pages/settings/Documents";
import Security from "./pages/settings/Security";
import Notifications from "./pages/settings/Notifications";
import Appearance from "./pages/settings/Appearance";
import Referrals from "./pages/Referrals";
import Broker from "./pages/Broker";
import Support from "./pages/Support";
import Subscriptions from "./pages/Subscriptions";
import Courses from "./pages/Courses";
import LessonDetail from "./pages/LessonDetail";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import Performance from "./pages/Performance";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Signals />} />
            <Route path="/news" element={<Index />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
