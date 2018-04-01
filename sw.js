const VERSION = 0.1;
const CACHE_NAME = 'RESTAURANT_REVIEWS';

self.addEventListener('install', (e) => {
  console.log('The service worker is being installed.');

  // Cleanup old caches then precache the assets.
  e.waitUntil(cleanup().then(() => precache()));
});

self.addEventListener('fetch', function (evt) {
  console.log('The service worker is serving the asset.');
  evt.respondWith(fromCache(evt.request));
  evt.waitUntil(fromNetwork(evt.request)); // update the cache.
});

// Delete old caches.
function cleanup () {
  return caches.delete(`${CACHE_NAME}_${VERSION - 0.1}`);
}

function precache () {
  return caches.open(`${CACHE_NAME}_${VERSION}`).then(function (cache) {
    return cache.addAll([
      './index.html',
      './restaurant.html'
    ]);
  });
}

function fromCache (request) {
  return caches.open(`${CACHE_NAME}_${VERSION}`).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching) {
        return fromNetwork(request);
      }

      return matching;
    });
  });
}

function fromNetwork (request) {
  return caches.open(`${CACHE_NAME}_${VERSION}`).then(function (cache) {
    return fetch(request).then(function (response) {
      const cloned = response.clone();
      return cache.put(request, cloned).then(() => {
        return response;
      });
    });
  });
}
