import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share, MoreVertical, Plus, Smartphone } from 'lucide-react';
import logoImg from '@/assets/logo.svg';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';

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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <PageShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Instalar App</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-8">
          <img src={logoImg} alt="Coins Signals" className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Coins Signals
          </h2>
          <p className="text-blue-200/80 text-sm">
            Instala la app para recibir señales al instante
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Download className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-green-400 mb-2">¡App Instalada!</h3>
            <p className="text-green-200/80 text-sm">
              Ya tienes Coins Signals instalada en tu dispositivo
            </p>
          </div>
        ) : (
          <>
            {/* Direct Install Button (Android/Desktop with prompt) */}
            {deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-blue-500/30"
              >
                <Download className="w-6 h-6 mr-2" />
                Instalar Ahora
              </Button>
            )}

            {/* iOS Instructions */}
            {platform === 'ios' && (
              <div className="bg-[#0a1628] border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="bg-blue-600/20 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl">🍎</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Instrucciones para iPhone/iPad</h3>
                </div>
                <div className="p-4 space-y-4">
                  <Step
                    number={1}
                    icon={<Share className="w-5 h-5" />}
                    title="Toca el botón Compartir"
                    description="En la barra inferior de Safari, toca el ícono de compartir (cuadrado con flecha hacia arriba)"
                  />
                  <Step
                    number={2}
                    icon={<Plus className="w-5 h-5" />}
                    title='Selecciona "Añadir a pantalla de inicio"'
                    description="Desliza hacia abajo en el menú y busca la opción con el ícono +"
                  />
                  <Step
                    number={3}
                    icon={<Download className="w-5 h-5" />}
                    title='Confirma tocando "Añadir"'
                    description="El ícono de Coins Signals aparecerá en tu pantalla de inicio"
                  />
                </div>
                <div className="px-4 pb-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-200 text-xs">
                      <span className="font-bold">Nota:</span> Asegúrate de estar usando Safari. 
                      Chrome y otros navegadores no permiten instalar apps en iOS.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {platform === 'android' && !deferredPrompt && (
              <div className="bg-[#0a1628] border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="bg-green-600/20 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Instrucciones para Android</h3>
                </div>
                <div className="p-4 space-y-4">
                  <Step
                    number={1}
                    icon={<MoreVertical className="w-5 h-5" />}
                    title="Abre el menú del navegador"
                    description="Toca los tres puntos verticales en la esquina superior derecha de Chrome"
                  />
                  <Step
                    number={2}
                    icon={<Download className="w-5 h-5" />}
                    title='Selecciona "Instalar aplicación"'
                    description='O "Añadir a pantalla de inicio" según tu versión de Chrome'
                  />
                  <Step
                    number={3}
                    icon={<Smartphone className="w-5 h-5" />}
                    title="Confirma la instalación"
                    description="La app se instalará y aparecerá en tu lista de aplicaciones"
                  />
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {platform === 'desktop' && !deferredPrompt && (
              <div className="bg-[#0a1628] border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="bg-purple-600/20 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">💻</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Instrucciones para Escritorio</h3>
                </div>
                <div className="p-4 space-y-4">
                  <Step
                    number={1}
                    icon={<Download className="w-5 h-5" />}
                    title="Busca el ícono de instalación"
                    description="En la barra de direcciones de Chrome, busca el ícono de instalación (monitor con flecha)"
                  />
                  <Step
                    number={2}
                    icon={<Plus className="w-5 h-5" />}
                    title='Haz clic en "Instalar"'
                    description="Se abrirá un diálogo preguntando si deseas instalar la aplicación"
                  />
                  <Step
                    number={3}
                    icon={<Smartphone className="w-5 h-5" />}
                    title="Confirma y disfruta"
                    description="La app se abrirá en su propia ventana y aparecerá en tu escritorio"
                  />
                </div>
              </div>
            )}

            {/* Benefits Section */}
            <div className="bg-[#0a1628] border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-4 text-center">¿Por qué instalar?</h3>
              <div className="grid grid-cols-2 gap-3">
                <Benefit icon="🔔" title="Notificaciones" description="Recibe alertas instantáneas" />
                <Benefit icon="⚡" title="Más rápido" description="Carga 2x más rápido" />
                <Benefit icon="📴" title="Sin conexión" description="Funciona offline" />
                <Benefit icon="🎯" title="Acceso directo" description="Desde tu pantalla" />
              </div>
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}

function Step({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: number; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-blue-400">{icon}</span>
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <p className="text-sm text-blue-200/70">{description}</p>
      </div>
    </div>
  );
}

function Benefit({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-blue-900/30 rounded-lg p-3 text-center">
      <span className="text-2xl mb-2 block">{icon}</span>
      <h4 className="font-semibold text-white text-sm">{title}</h4>
      <p className="text-xs text-blue-200/70">{description}</p>
    </div>
  );
}