// Stay service worker: browser notifications only (no offline caching).
// Payload from the API worker: { title, body, url, tag } — `url` is a same-origin path.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'Stay';
  const url = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      tag: typeof data.tag === 'string' ? data.tag : undefined,
      lang: 'vi',
      icon: '/icons/icon-192.png',
      badge: '/icons/favicon-32.png',
      data: { url },
    }),
  );
});

// Opens the related screen: focuses an open Stay tab when there is one, else a new window.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? '/', self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);

      if (open) {
        await open.focus();
        if ('navigate' in open) return open.navigate(target);
        return undefined;
      }
      return self.clients.openWindow(target);
    })(),
  );
});
