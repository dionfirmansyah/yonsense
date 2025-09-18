import { precacheAndRoute } from 'workbox-precaching';

// Precache default dari next-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Install: langsung aktifkan SW baru
self.addEventListener('install', () => {
    self.skipWaiting();
});

// Activate: klaim semua client
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

/* ---- Handle Push Event ---- */
self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data?.json() || {};
    } catch {
        data = {};
    }

    const title = data.title || 'New Notification';
    const urlFromPayload = data.data?.url || data.url || data.actionUrl || '/';

    const options = {
        body: data.body || 'You have a new message',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/badge-white.png',
        data: {
            url: urlFromPayload,
            priority: data.priority || 'normal', // dipindahkan ke data
            ...data.data,
        },
        vibrate: [200, 100, 200],
        actions: [{ action: 'open', title: 'Open' }],
    };

    if (data.image) options.image = data.image;
    if (data.tag) options.tag = data.tag;

    event.waitUntil(self.registration.showNotification(title, options));
});

/* ---- Handle Notification Click ---- */
self.addEventListener('notificationclick', (event) => {
    const targetUrl = event.notification.data?.url || '/';

    event.notification.close();

    event.waitUntil(
        (async () => {
            let absoluteUrl = targetUrl;
            if (!absoluteUrl.startsWith('http')) {
                absoluteUrl = self.location.origin + targetUrl;
            }

            const allClients = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });

            // Fokus tab yang sudah ada
            for (const client of allClients) {
                if (client.url.startsWith(absoluteUrl) && 'focus' in client) {
                    return client.focus();
                }
            }

            // Kalau belum ada, buka tab baru
            if (clients.openWindow) {
                return clients.openWindow(absoluteUrl);
            }
        })(),
    );
});
