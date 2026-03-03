// Custom Service Worker for TaskFlow PWA
// This extends the Workbox service worker with notification handling

// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Initialize Workbox
workbox.setConfig({
  debug: false,
});

// Precache static assets
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Cache strategies for different types of content
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  
  // Handle different actions
  if (event.action === 'close') {
    return;
  }

  // Default action or 'view' action
  if (event.action === 'view' || !event.action) {
    let url = '/';
    
    if (data && data.type === 'task' && data.taskId) {
      url = `/tasks?taskId=${data.taskId}`;
    }

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: data,
            });
            return;
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Push notification handler (for future use with push API)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icons/pwa-192x192.png',
      badge: data.badge || '/icons/pwa-64x64.png',
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' },
      ],
      requireInteraction: data.requireInteraction || false,
      tag: data.tag || 'taskflow-notification',
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'TaskFlow', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Placeholder for syncing tasks when back online
  console.log('Syncing tasks...');
}

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

console.log('TaskFlow Service Worker loaded');
