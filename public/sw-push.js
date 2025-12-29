// Service Worker for Push Notifications
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  const data = event.data.json();
  console.log('Push data:', data);

  const options: NotificationOptions = {
    body: data.body || 'Nueva señal de trading disponible',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'trading-signal',
    requireInteraction: true,
    data: {
      url: data.url || '/',
      signalId: data.signalId,
    },
    actions: [
      { action: 'view', title: 'Ver señal' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nueva Señal', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // If no window is open, open a new one
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
  // Handle subscription change - re-subscribe
});

export {};