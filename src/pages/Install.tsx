import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share, MoreVertical, Plus, Smartphone, Check, Zap, BellRing, WifiOff, Target } from 'lucide-react';
import logoImg from '@/assets/logo.svg';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Install() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <PageShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('inst_title')}</h1>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="relative mx-auto w-20 h-20 mb-4">
            <img src={logoImg} alt="Coins Signals" className="w-20 h-20 rounded-2xl shadow-lg" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
              <Download className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Coins Signals</h2>
          <p className="text-muted-foreground text-sm">{t('inst_native_experience')}</p>
        </motion.div>

        {isInstalled ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[hsl(142_70%_45%/0.15)] border border-[hsl(142_70%_45%/0.3)] rounded-xl p-6 text-center"
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[hsl(142_70%_45%/0.2)] flex items-center justify-center">
              <Check className="w-7 h-7 text-bullish" />
            </div>
            <h3 className="text-lg font-bold text-bullish mb-1">{t('inst_installed')}</h3>
            <p className="text-muted-foreground text-sm">{t('inst_installed_desc')}</p>
          </motion.div>
        ) : (
          <>
            {/* Direct Install Button */}
            {deferredPrompt && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={handleInstall}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 text-base rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Ahora
                </Button>
              </motion.div>
            )}

            {/* iOS Instructions */}
            {platform === 'ios' && (
              <InstructionCard
                emoji="🍎"
                title="Instrucciones para iPhone"
                accentClass="bg-muted"
                steps={[
                  { icon: <Share className="w-4 h-4" />, title: 'Toca el botón Compartir', desc: 'En la barra inferior de Safari, toca el ícono de compartir (cuadrado con flecha)' },
                  { icon: <Plus className="w-4 h-4" />, title: '"Añadir a pantalla de inicio"', desc: 'Desliza hacia abajo en el menú y busca la opción con el ícono +' },
                  { icon: <Download className="w-4 h-4" />, title: 'Confirma tocando "Añadir"', desc: 'El ícono aparecerá en tu pantalla de inicio' },
                ]}
                note="Asegúrate de estar usando Safari. Chrome y otros navegadores no permiten instalar apps en iOS."
              />
            )}

            {/* Android Instructions */}
            {platform === 'android' && !deferredPrompt && (
              <InstructionCard
                emoji="🤖"
                title="Instrucciones para Android"
                accentClass="bg-[hsl(142_70%_45%/0.1)]"
                steps={[
                  { icon: <MoreVertical className="w-4 h-4" />, title: 'Abre el menú del navegador', desc: 'Toca los tres puntos en la esquina superior derecha de Chrome' },
                  { icon: <Download className="w-4 h-4" />, title: '"Instalar aplicación"', desc: 'O "Añadir a pantalla de inicio" según tu versión de Chrome' },
                  { icon: <Smartphone className="w-4 h-4" />, title: 'Confirma la instalación', desc: 'La app aparecerá en tu lista de aplicaciones' },
                ]}
              />
            )}

            {/* Desktop Instructions */}
            {platform === 'desktop' && !deferredPrompt && (
              <InstructionCard
                emoji="💻"
                title="Instrucciones para Escritorio"
                accentClass="bg-muted"
                steps={[
                  { icon: <Download className="w-4 h-4" />, title: 'Busca el ícono de instalación', desc: 'En la barra de direcciones de Chrome, busca el ícono de monitor con flecha' },
                  { icon: <Plus className="w-4 h-4" />, title: 'Haz clic en "Instalar"', desc: 'Se abrirá un diálogo para confirmar la instalación' },
                  { icon: <Smartphone className="w-4 h-4" />, title: 'Confirma y disfruta', desc: 'La app se abrirá en su propia ventana' },
                ]}
              />
            )}

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <h3 className="text-base font-bold text-foreground mb-3 text-center">¿Por qué instalar?</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <BenefitCard icon={<BellRing className="w-5 h-5 text-primary" />} title="Notificaciones" desc="Alertas instantáneas" />
                <BenefitCard icon={<Zap className="w-5 h-5 text-accent" />} title="Más rápido" desc="Carga 2x más rápido" />
                <BenefitCard icon={<WifiOff className="w-5 h-5 text-muted-foreground" />} title="Sin conexión" desc="Funciona offline" />
                <BenefitCard icon={<Target className="w-5 h-5 text-bullish" />} title="Acceso directo" desc="Desde tu pantalla" />
              </div>
            </motion.div>
          </>
        )}
      </main>
    </PageShell>
  );
}

function InstructionCard({
  emoji,
  title,
  accentClass,
  steps,
  note,
}: {
  emoji: string;
  title: string;
  accentClass: string;
  steps: { icon: React.ReactNode; title: string; desc: string }[];
  note?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className={`${accentClass} px-4 py-2.5 flex items-center gap-3`}>
        <span className="text-xl">{emoji}</span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-4 space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-primary">{step.icon}</span>
                <h4 className="font-semibold text-foreground text-sm">{step.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      {note && (
        <div className="px-4 pb-4">
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-2.5">
            <p className="text-muted-foreground text-xs">
              <span className="font-bold text-accent">Nota:</span> {note}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-secondary rounded-lg p-3 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <h4 className="font-semibold text-foreground text-xs">{title}</h4>
      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}
