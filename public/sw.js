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
    console.log('Push notification received:', event);
    
    let notificationData = {};
    
    try {
        // Try to parse data from push event
        if (event.data) {
            notificationData = event.data.json();
        }
    } catch (error) {
        console.error('Error parsing push data:', error);
        // Fallback notification data
        notificationData = {
            title: 'New Notification',
            body: 'You have a new message',
            icon: '/icon-192x192.png',
            badge: '/badge.png',
        };
    }
    
    // Set default values
    const {
        title = 'New Notification',
        body = 'You have a new message',
        icon = '/icon-192x192.png',
        badge = '/badge.png',
        tag = 'default',
        data = {},
        actions = [],
        requireInteraction = false,
    } = notificationData;

    const notificationOptions = {
        body,
        icon,
        badge,
        tag,
        data,
        actions,
        requireInteraction,
        vibrate: [200, 100, 200], // Optional: vibration pattern
    };

    event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
    );
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