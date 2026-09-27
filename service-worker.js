/* Mathe-Abenteuer – Service Worker für Offline-Nutzung.
   WICHTIG bei Änderungen: VERSION erhöhen, dann laden alle Geräte die neue Fassung. */
var VERSION = 'v1.0.0';
var CACHE = 'mathe-abenteuer-' + VERSION;
var FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './js/storage.js',
  './js/generator.js',
  './js/game.js',
  './js/graphics.js',
  './js/sound.js',
  './assets/images/world-1.svg',
  './assets/images/world-2.svg',
  './assets/images/world-3.svg',
  './assets/images/world-4.svg',
  './assets/images/world-5.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // „reload“ umgeht den HTTP-Cache, damit wirklich die neue Version gespeichert wird
      return Promise.all(FILES.map(function (url) {
        return fetch(new Request(url, { cache: 'reload' })).then(function (res) {
          if (!res.ok) throw new Error('Laden fehlgeschlagen: ' + url);
          return cache.put(url, res);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf('mathe-abenteuer-') === 0 && k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe: immer die gespeicherte Startseite (funktioniert offline)
  if (req.mode === 'navigate') {
    var root = new URL('./', self.location).pathname;
    if (url.pathname !== root && url.pathname !== root + 'index.html') {
      // andere Seiten (z. B. tests/) normal laden
      event.respondWith(fetch(req).catch(function () { return caches.match('./index.html'); }));
      return;
    }
    event.respondWith(
      caches.match('./index.html', { cacheName: CACHE }).then(function (hit) {
        return hit || fetch(req);
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }

  // Alle anderen Dateien: zuerst aus dem Cache, sonst aus dem Netz (und merken)
  event.respondWith(
    caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
