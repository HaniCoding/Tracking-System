const CACHE = 'nexus-v1';
const URLS = ['/', '/index.html', '/src/main.js', '/src/styles/main.css', '/src/styles/variables.css', '/src/styles/components.css', '/src/styles/animations.css', '/public/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('Offline', { status: 503 })))
  );
});