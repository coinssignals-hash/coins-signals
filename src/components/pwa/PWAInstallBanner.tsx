import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '@/assets/logo.svg';
import { useTranslation } from '@/i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-banner-dismissed';
const DISMISS_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

export function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Don't show if recently dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION) return;

    // Show after a short delay for better UX
    const timer = setTimeout(() => setShow(true), 3000);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-14 left-2 right-2 z-40 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl p-3 shadow-lg shadow-background/50 flex items-center gap-3">
            <img src={logoImg} alt="" className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Instala Coins Signals</p>
              <p className="text-[10px] text-muted-foreground">Acceso rápido y notificaciones</p>
            </div>
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
              >
                Instalar
              </button>
            ) : (
              <Link
                to="/install"
                onClick={handleDismiss}
                className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
              >
                Ver más
              </Link>
            )}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 active:scale-90 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
