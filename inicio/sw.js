// =====================================================
//  Service Worker · estrategia "RED PRIMERO"
//  - Con internet: siempre descarga la versión más nueva
//    (así tus cambios se ven al recargar) y la guarda en caché.
//  - Sin internet: responde con la copia guardada.
// =====================================================

const CACHE_NAME = 'runner-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

// Instalación: guarda los archivos del juego en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: borra cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Peticiones: primero la red; si falla (modo avión), la caché
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // cache: 'no-cache' obliga a preguntar al servidor si hay versión nueva
  event.respondWith(
    fetch(req.url, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(res => res || caches.match('./index.html')))
  );
});
