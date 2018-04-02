const VERSION = 0.1;
const CACHE_NAME = 'RESTAURANT_REVIEWS';

self.addEventListener('install', (e) => {
  // Cleanup old caches then precache the assets.
  e.waitUntil(cleanup().then(() => precache()));
});

self.addEventListener('fetch', function (e) {
  e.respondWith(fromCache(e.request));
  e.waitUntil(fromNetwork(e.request)); // update the cache.
});

// Delete old caches.
function cleanup () {
  return caches.delete(`${CACHE_NAME}_${VERSION - 0.1}`);
}

function precache () {
  return caches.open(`${CACHE_NAME}_${VERSION}`).then(function (cache) {
    return cache.addAll([
      './manifest.webmanifest',
      './index.html',
      './restaurant.html',
      './js/main.js',
      './js/dbhelper.js',
      './css/styles.css',
      './data/restaurants.json'
    ]);
  });
}

function fromCache (request) {
  return caches.open(`${CACHE_NAME}_${VERSION}`).then(function (cache) {
    if (/restaurant\.html/.test(request.url)) {
      request = new Request('/restaurant.html');
    }

    return cache.match(request).then(function (matching) {
      return matching || fromNetwork(request);
    });
  });
}

function fromNetwork (request) {
  return caches.open(`${CACHE_NAME}_${VERSION}`).then(function (cache) {
    return fetch(request).then(function (response) {
      const cloned = response.clone();
      if (response.ok) {
        return cache.put(request, cloned).then(() => {
          return response;
        });
      }

      return response;
    }).catch(err => {
      console.log(err);
      return null;
    });
  });
}


function cacheStaticMap (restaurant) {
  const location = `${restaurant.latlng.lat},${restaurant.latlng.lng}`;
  const params = `center=${location}&zoom=16&size=640x640&scale=2&markers=markerStyles|${location}`;

  return fetch(`https://maps.googleapis.com/maps/api/staticmap?${params}`).then(response => {
    return caches.open(`${CACHE_NAME}_${VERSION}`).then(cache => {
      return cache.put(new Request(`/restaurant_${restaurant.id}_staticmap`), response);
    });
  }).catch(() => {
    return;
  });
}

// self.addEventListener('message', function (event) {
//   if (event.data.action === 'staticmap') {
//     event.waitUntil(cacheStaticMap(event.data.restaurant));
//   }
// });
