import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  getExistingSubscription,
  unsubscribeFromPush,
} from '@/utils/pushNotifications';

export function NotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const subscription = await getExistingSubscription();
        setIsSubscribed(!!subscription);
      }

      setIsLoading(false);
    };

    checkStatus();
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error('Las notificaciones push no están soportadas en este navegador');
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        setIsSubscribed(false);
        toast.success('Notificaciones desactivadas');
      } else {
        const permission = await requestNotificationPermission();

        if (permission !== 'granted') {
          toast.error('Debes permitir las notificaciones para recibirlas');
          setIsLoading(false);
          return;
        }

        const registration = await registerServiceWorker();
        if (!registration) {
          toast.error('Error al registrar el service worker');
          setIsLoading(false);
          return;
        }

        const subscription = await subscribeToPush(registration);
        if (subscription) {
          setIsSubscribed(true);
          toast.success('¡Notificaciones activadas! Recibirás alertas de nuevas señales');
        } else {
          toast.error('Error al activar las notificaciones');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Error al cambiar el estado de las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className="relative"
      title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      ) : isSubscribed ? (
        <Bell className="w-5 h-5 text-green-400" />
      ) : (
        <BellOff className="w-5 h-5 text-blue-300" />
      )}
      {isSubscribed && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />
      )}
    </Button>
  );
}