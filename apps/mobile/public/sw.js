const CACHE_NAME = 'saudeseg-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

const OFFLINE_ROUTES = [
  '/p/',
  '/medico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (OFFLINE_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const fallback = await caches.match('/index.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'SaudeSeg+', body: event.data.text() };
  }

  const options = {
    body: payload.body || 'Você tem uma nova notificação.',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: payload.tag || 'saudeseg-notification',
    renotify: true,
    data: payload.data || {},
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'SaudeSeg+', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  let targetUrl = '/';

  if (data.url) {
    targetUrl = data.url;
  } else if (data.processId) {
    targetUrl = `/p/${data.processId}`;
  } else if (data.type === 'TELECONSULTA_INICIADA' && data.processId) {
    targetUrl = `/p/${data.processId}/teleconsulta`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
  });
}
