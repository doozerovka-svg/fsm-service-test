const CACHE_NAME = 'fsm-cache-v32.0';
const ASSETS = [
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon.png',
    './firebase-app.js',
    './firebase-database.js',
    './html5-qrcode.min.js'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all assets');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event (Network First, Falling Back to Cache)
self.addEventListener('fetch', (e) => {
    // Avoid caching non-GET requests (e.g. Firebase RTDB WebSocket or HTTPS posts)
    if (e.request.method !== 'GET') {
        return;
    }
    
    // Do not cache external APIs or database requests
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // If valid response, update cache
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseCopy);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline fallback
                return caches.match(e.request);
            })
    );
});
