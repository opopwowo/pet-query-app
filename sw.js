/*
 * Service worker — 可安裝、離線開啟啟動頁，並支援「即時更新」：
 *  - 導覽(HTML)採網路優先：永遠先拿最新頁面，離線才回退快取（不卡舊快取）
 *  - 其他同源資源採 stale-while-revalidate：先給快取、背景更新
 *  - 不在 install 自動 skipWaiting；改由頁面(app.js)提示使用者後再套用
 *  - 官方查詢網站與外部 CDN 一律走網路，不攔截
 */
const VERSION = 'v10';
const CACHE = 'pet-query-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './stats.html',
  './registry.html',
  './app.js',
  './data/pet-stats.json',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  // 注意：不呼叫 skipWaiting()，等使用者在頁面確認後才切換
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    // 立即接管所有分頁，讓新版一致生效（配合 app.js 只在使用者按下更新時才重新整理）
    await self.clients.claim();
  })());
});

// 頁面按下「立即更新」時觸發：讓等待中的新版立即接管
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 官方站／CDN 不攔截

  // 導覽（HTML）：網路優先，離線時回退快取
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // 其他同源資源：stale-while-revalidate
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
