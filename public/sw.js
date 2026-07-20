// Note: next.config.ts env injection does NOT reach service worker scope directly
// (sw.js is in /public and is not processed by webpack). Instead, the layout's SW
// registration script must pass the build ID via query param:
//   navigator.serviceWorker.register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID}`);
// And in sw.js, read it:
const urlParams = new URL(self.location.href).searchParams;
const buildId = urlParams.get('v') ?? 'dev';
const CACHE_NAME = `notaire-lattab-${buildId}`;

const ASSETS_TO_CACHE = [
  '/calculateur-prix-referentiel',
  '/fr/calculateur-prix-referentiel',
  '/calculateur-succession',
  '/fr/calculateur-succession',
  '/manifest.json',
  '/favicon.ico',
  '/logo-small.webp',
  '/logo.webp',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Focus only on GET requests for caching
  if (event.request.method !== 'GET') {
    return;
  }

  // 1. Interactive Reference Price Calculator API Request Caching
  if (url.pathname.startsWith('/api/calculator-data')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const headers = new Headers(networkResponse.headers);
            headers.set('X-Cache-Timestamp', Date.now().toString());
            const cacheCopy = new Response(networkResponse.clone().body, {
              status: networkResponse.status,
              statusText: networkResponse.statusText,
              headers
            });
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, check Cache Storage and ensure it hasn't expired (7 days TTL)
          return caches.match(event.request).then((cachedResponse) => {
            if (!cachedResponse) return undefined;
            const cacheTimestamp = cachedResponse.headers.get('X-Cache-Timestamp');
            if (cacheTimestamp) {
              const age = Date.now() - parseInt(cacheTimestamp, 10);
              if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
                caches.open(CACHE_NAME).then((cache) => {
                  cache.delete(event.request);
                });
                return undefined;
              }
            }
            return cachedResponse;
          });
        })
    );
    return;
  }

  const isNavigationOrHtml = !url.pathname.startsWith('/api/') && (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/fr') ||
    !url.pathname.split('/').pop().includes('.')
  );

  if (isNavigationOrHtml) {
    // a. Network-first strategy for Documents
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Complete cache miss: Bilingual WCAG-compliant offline fallback
            return new Response(
              '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>غير متصل / Hors ligne</title><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#1e293b;}h1{font-size:24px;margin-bottom:10px;}</style></head><body><h1>غير متصل / Hors ligne</h1><p>يرجى التحقق من اتصالك بالإنترنت / Veuillez vérifier votre connexion.</p></body></html>',
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              }
            );
          });
        })
    );
  } else {
    // b. Cache-first strategy for statics (CSS, JS, images, fonts)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Silent catch to handle offline states without uncaught worker errors
        });
      })
    );
  }
});
