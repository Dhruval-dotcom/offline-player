const CACHE_NAME = 'offline-video-cache-v1';
const OFFLINE_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js'
];

// Cache static files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_FILES))
  );
});

// Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// Serve cached or fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
