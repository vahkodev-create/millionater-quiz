const CACHE_NAME = "millionater-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./privacy.html",
  "./analytics-config.js",
  "./analytics.js",
  "./styles.css",
  "./questions.js",
  "./questions/index.js",
  "./questions/categories/01-armenia.js",
  "./questions/categories/02-general-knowledge.js",
  "./questions/categories/03-cuisine.js",
  "./questions/categories/04-science.js",
  "./questions/categories/05-geography.js",
  "./questions/categories/06-world.js",
  "./questions/categories/07-sport.js",
  "./questions/categories/08-literature.js",
  "./questions/categories/09-technologies.js",
  "./questions/categories/10-math.js",
  "./questions/categories/11-music.js",
  "./questions/categories/12-armenian-history.js",
  "./questions/categories/13-cinema-culture.js",
  "./questions/categories/14-translation.js",
  "./questions/categories/15-latin.js",
  "./questions/categories/16-biology.js",
  "./questions/categories/17-football.js",
  "./questions/categories/18-world-football.js",
  "./questions/categories/19-cinema.js",
  "./questions/categories/20-books.js",
  "./questions/categories/21-aphorisms.js",
  "./questions/categories/22-aphorism-authors.js",
  "./questions/categories/23-art.js",
  "./questions/categories/24-chemistry.js",
  "./questions/categories/25-physics.js",
  "./questions/categories/26-astronomy.js",
  "./questions/categories/27-world-history.js",
  "./questions/categories/28-economics.js",
  "./questions/categories/29-mythology.js",
  "./questions/categories/30-armenian-literature.js",
  "./questions/categories/31-architecture.js",
  "./questions/categories/32-cinematography.js",
  "./questions/categories/33-informatics.js",
  "./questions/categories/34-space.js",
  "./questions/categories/35-linguistics.js",
  "./questions/categories/36-armenian-art.js",
  "./questions/categories/37-medicine.js",
  "./questions/categories/38-history.js",
  "./questions/categories/39-anatomy.js",
  "./questions/categories/40-technology.js",
  "./questions/categories/41-zoology.js",
  "./questions/categories/42-anime.js",
  "./questions/categories/43-tv-series.js",
  "./game.js",
  "./manifest.json",
  "./icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
