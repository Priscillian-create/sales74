// service-worker.js

const CACHE_NAME = 'pagerrysmart-v1';
const urlsToCache = [
    '/',
    '/index.html'
    // If you had external CSS or JS files, you would list them here.
    // Since your CSS/JS are in your HTML file, you don't need to list them.
];

// 1. INSTALL EVENT: Cache the app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. FETCH EVENT: The core logic for handling requests
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // --- STRATEGY 1: NETWORK FIRST for Firebase API Calls ---
    // This is the most important fix. We must always try the network first for Firebase.
    if (requestUrl.hostname.includes('firebaseio.com') || requestUrl.hostname.includes('firestore.googleapis.com') || requestUrl.hostname.includes('googleapis.com')) {
        
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                // Try to fetch from the network
                return fetch(event.request)
                    .then(response => {
                        // If the network request is successful, cache the response for offline use
                        // We only cache successful responses (status 200)
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // If the network fails completely, try to get the last cached version
                        // This is what allows your app to work offline
                        console.log('Service Worker: Network failed. Serving from cache:', event.request.url);
                        return cache.match(event.request);
                    });
            })
        );
        return; // Stop processing this event further
    }

    // --- STRATEGY 2: CACHE FIRST for Static Assets (App Shell) ---
    // For all other requests (like your index.html), serve from cache first for instant loading.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If the request is in the cache, return it immediately
                if (response) {
                    return response;
                }
                // If not in the cache, fetch it from the network
                return fetch(event.request);
            })
    );
});

// 3. ACTIVATE EVENT: Clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // If a cache name is not in our whitelist, delete it
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});