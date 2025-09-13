// public/sw.js

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = {};
  }

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-white.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Dismiss' }
    ],
  };
  if (data.image) {
    options.image = data.image; 
  }
  if(data.tag){
    options.tag = data.tag;
  }
  if(data.priority){
    options.priority = data.priority;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    console.log('Notification dismissed by user.');
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close (optional)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
