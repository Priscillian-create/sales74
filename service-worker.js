const CACHE_NAME = 'app-shell-v1';

// List of all the files that make up the "app shell"
// This includes your main HTML file, CSS, and the core JavaScript libraries.
// NOTE: I've assumed your main file is named 'index.html'. If not, change it.
const urlsToCache = [
  '/',
  'index.html', // Add the name of your main HTML file here
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js'
];

// Install Event: Cache all the essential app shell files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: App shell cached successfully');
        // Force the new service worker to become active immediately
        return self.skipWaiting();
      })
  );
});

// Activate Event: Clean up old caches to save space
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
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
    }).then(() => {
        console.log('Service Worker: Activated and now controlling clients');
        // Take control of all open pages immediately
        return self.clients.claim();
    })
  );
});

// Fetch Event: Intercept network requests
self.addEventListener('fetch', event => {
  const request = event.request;

  // For navigation requests (loading the page itself), use a "Cache First" strategy.
  // This ensures the app shell loads offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // If the request is in the cache, return it immediately.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Otherwise, fetch it from the network.
        return fetch(request);
      })
    );
  } else {
    // For all other requests (assets, API calls, etc.), also use "Cache First".
    // This is great for performance and offline access to static assets.
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, fetch from network
        return fetch(request);
      })
    );
  }
});