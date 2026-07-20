// Hushwood service worker — offline-first for a single-file game.
// The cache name carries the BUILD STAMP, which build.js rewrites on every build. That
// matters more than it looks: with a fixed name the browser sees an identical sw.js on
// each deploy, never installs a new worker, and never clears the old cache — so a
// playtester can sit on a stale build while you push fixes they never receive. A changed
// stamp makes the file differ, which triggers install → activate → old caches deleted.
const CACHE = "hushwood-__BUILD__";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // network-first for the HTML so updates land; cache-first for the rest
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
