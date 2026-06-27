// Service worker — 讓 App 可安裝並支援離線開啟啟動頁
const CACHE = 'pet-query-v3';
const ASSETS = [
  './',
  './index.html',
  './stats.html',
  './data/pet-stats.json',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 只快取自家啟動頁資源（同源）；官方查詢網站一律走網路
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // 不攔截官方站
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
