const CACHE = "optima-pad-shell-v2";
const SHELL_ASSETS = ["/manifest.json", "/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Cache-first HANYA untuk aset statis di daftar di atas (ikon/manifest).
// Halaman & data selalu diambil dari jaringan supaya tidak menampilkan versi
// basi -- penanganan kondisi offline yang sesungguhnya (form lapangan) ada
// di lib/offline-queue.ts (IndexedDB), bukan di service worker ini.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
