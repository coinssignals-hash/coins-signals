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
import {
  isNativePlatform,
  registerNativePush,
  unregisterNativePush,
  checkNativePushPermission,
} from '@/utils/nativePushNotifications';

export function NotificationToggle() {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isNative = isNativePlatform();

  useEffect(() => {
    const checkStatus = async () => {
      if (isNative) {
        setIsSupported(true);
        const granted = await checkNativePushPermission();
        setIsSubscribed(granted);
      } else {
        const supported = isPushSupported();
        setIsSupported(supported);
        if (supported) {
          const subscription = await getExistingSubscription();
          setIsSubscribed(!!subscription);
        }
      }
      setIsLoading(false);
    };

    checkStatus();
  }, [isNative]);

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error(t('nt_not_supported'));
      return;
    }
    setIsLoading(true);
    try {
      if (isSubscribed) {
        if (isNative) {
          await unregisterNativePush();
        } else {
          await unsubscribeFromPush();
        }
        setIsSubscribed(false);
        toast.success(t('nt_disabled'));
      } else {
        if (isNative) {
          const token = await registerNativePush();
          if (token) {
            setIsSubscribed(true);
            toast.success(t('nt_enabled'));
          } else {
            toast.error(t('nt_permission_required'));
          }
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
      title={isSubscribed ? t('nt_disable_title') : t('nt_enable_title')}
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