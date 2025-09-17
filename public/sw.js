// public/sw.js

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ---- Handle Push Event ---- */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
    console.log("[SW] Push data received:", data);
  } catch (err) {
    console.error("[SW] Failed to parse push data:", err);
    data = {};
  }

  const title = data.title || "New Notification";

  // ambil URL dari berbagai kemungkinan
  const urlFromPayload =
    data.data?.url || data.url || data.actionUrl || "/";

  const options = {
    body: data.body || "You have a new message",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/badge-white.png",
    data: {
      url: urlFromPayload,
      ...data.data, // merge data nested lain (priority, timestamp, dll)
    },
    vibrate: [200, 100, 200],
    actions: [{ action: "open", title: "Open" }],
  };

  if (data.image) options.image = data.image;
  if (data.tag) options.tag = data.tag;
  if (data.priority) options.priority = data.priority;

  console.log("[SW] Showing notification:", { title, options });

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ---- Handle Notification Click ---- */
self.addEventListener("notificationclick", (event) => {

  const targetUrl = event.notification.data?.url || "/";

  event.notification.close();

  event.waitUntil(
    (async () => {
      let absoluteUrl = targetUrl;
      if (!absoluteUrl.startsWith("http")) {
        absoluteUrl = self.location.origin + targetUrl;
      }

      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });


      for (const client of allClients) {
        if (client.url.startsWith(absoluteUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      } else {
        console.warn("[SW] clients.openWindow not supported");
      }
    })()
  );
});




