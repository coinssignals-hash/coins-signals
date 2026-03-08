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
  const { t } = useTranslation();
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
      toast.error(t('nt_not_supported'));
      return;
    }
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        setIsSubscribed(false);
        toast.success(t('nt_disabled'));
      } else {
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
          toast.error(t('nt_permission_required'));
          setIsLoading(false);
          return;
        }
        const registration = await registerServiceWorker();
        if (!registration) {
          toast.error(t('nt_sw_error'));
          setIsLoading(false);
          return;
        }
        const subscription = await subscribeToPush(registration);
        if (subscription) {
          setIsSubscribed(true);
          toast.success(t('nt_enabled'));
        } else {
          toast.error(t('nt_enable_error'));
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error(t('nt_toggle_error'));
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