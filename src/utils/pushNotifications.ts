import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw-push.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key not configured');
    return null;
  }

  try {
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    console.log('Push subscription:', subscription);

    // Save subscription to backend
    await saveSubscription(subscription);

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const { error } = await supabase.functions.invoke('save-push-subscription', {
    body: { subscription: subscription.toJSON() },
  });

  if (error) {
    console.error('Failed to save subscription:', error);
    throw error;
  }

  console.log('Subscription saved successfully');
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    console.log('Unsubscribed from push notifications');
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}