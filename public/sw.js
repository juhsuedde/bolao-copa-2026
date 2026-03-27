const CACHE_NAME = 'bolao-copa-2026-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Pula espera e ativa imediato
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]))
  );
});

self.addEventListener('fetch', (event) => {
  // API requests sempre buscam do network
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Para HTML, usa network-first (sempre tenta buscar do servidor)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cacheia a nova versão
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Se offline, fallback para cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para outros arquivos (JS, CSS, imagens), usa cache-first
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
