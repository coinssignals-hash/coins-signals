import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if we're running inside a native Capacitor shell
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Register for native push notifications (FCM on Android, APNs on iOS)
 */
export async function registerNativePush(): Promise<string | null> {
  if (!isNativePlatform()) return null;

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    console.warn('Native push permission not granted');
    return null;
  }

  // Register with the native push service
  await PushNotifications.register();

  // Wait for the registration token
  return new Promise((resolve) => {
    PushNotifications.addListener('registration', async (token) => {
      console.log('Native push token:', token.value);
      await saveNativeToken(token.value);
      resolve(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Native push registration error:', error);
      resolve(null);
    });
  });
}

/**
 * Save the FCM/APNs token to the backend
 */
async function saveNativeToken(token: string): Promise<void> {
  const { error } = await supabase.functions.invoke('save-push-subscription', {
    body: {
      subscription: {
        native: true,
        token,
        platform: Capacitor.getPlatform(), // 'android' | 'ios'
      },
    },
  });

  if (error) {
    console.error('Failed to save native push token:', error);
    throw error;
  }
  console.log('Native push token saved');
}

/**
 * Remove all listeners and unregister
 */
export async function unregisterNativePush(): Promise<void> {
  if (!isNativePlatform()) return;
  await PushNotifications.removeAllListeners();
}

/**
 * Set up listeners for incoming notifications
 */
export function setupNativePushListeners(
  onNotification?: (data: { title?: string; body?: string; url?: string }) => void
): void {
  if (!isNativePlatform()) return;

  // Notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received in foreground:', notification);
    onNotification?.({
      title: notification.title ?? undefined,
      body: notification.body ?? undefined,
      url: (notification.data as Record<string, string>)?.url,
    });
  });

  // User tapped on a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action performed:', action);
    const data = action.notification.data as Record<string, string> | undefined;
    if (data?.url) {
      window.location.href = data.url;
    }
  });
}

/**
 * Check current native push permission status
 */
export async function checkNativePushPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  const result = await PushNotifications.checkPermissions();
  return result.receive === 'granted';
}
