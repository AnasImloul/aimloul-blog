{{- $latest := index (.Site.Pages.ByLastmod.Reverse) 0 -}}
{{- $version := $latest.Lastmod.Format "20060102150405" -}}
const CACHE = 'aimloul-{{ $version }}';
const OFFLINE_URL = '/offline/';
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(['/', OFFLINE_URL]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

function fetchWithTimeout(request) {
  return new Promise(function (resolve, reject) {
    var done = false;
    var timer = setTimeout(function () {
      if (!done) { done = true; reject(new Error('timeout')); }
    }, NETWORK_TIMEOUT_MS);
    fetch(request).then(function (response) {
      if (!done) { done = true; clearTimeout(timer); resolve(response); }
    }).catch(function (err) {
      if (!done) { done = true; clearTimeout(timer); reject(err); }
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (!navigator.onLine) {
          return cached || caches.match(OFFLINE_URL);
        }
        return fetchWithTimeout(request).then(function (response) {
          var clone = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, clone); });
          return response;
        }).catch(function () {
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          var clone = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, clone); });
          return response;
        });
      })
    );
  }
});
