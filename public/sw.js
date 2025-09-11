// 1. CREATE FILE: /public/sw.js
// This is your service worker file

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    // Skip waiting to activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    // Claim all clients immediately
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
      icon: data.icon || '/yon-light-logo.svg',
      badge: data.badge || '/badge.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open',
        },
        {
          action: 'close',
          title: '✖ Close',
        },
      ],
    };
  
    event.waitUntil(self.registration.showNotification(title, options));
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  
    if (event.action === 'close') {
      // User klik tombol "Close"
      console.log('User closed the notification manually.');
      return;
    }
  
    if (event.action === 'open' || !event.action) {
      // Default behavior: buka URL
      const urlToOpen = event.notification.data.url;
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
          for (const client of clientsArr) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
    }
  });
  
// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        if (urlToOpen !== '/') {
                            client.navigate(urlToOpen);
                        }
                        return;
                    }
                }
                
                // If no window is open, open a new one
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
    // Optional: Track notification close events
});

// Handle background sync (optional)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Handle background sync tasks
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled promise rejection:', event.reason);
});