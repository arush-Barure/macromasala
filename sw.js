const CACHE = 'macromasala-v2-20261014a';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './core.js', './foods.js', './manifest.json', './assets/icon.svg', './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('macromasala-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location.href).pathname)) return;
  // Network first prevents old app shells from trapping an installed app on stale UI.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && ASSETS.some(path => new URL(path, self.location.href).pathname === url.pathname)) {
      const clone = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, clone)));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
