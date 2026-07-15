const CACHE_NAME = "shenyou-v6";
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const ROOT_PATH = `${BASE_PATH}/`;
const APP_SHELL = [ROOT_PATH, `${BASE_PATH}/manifest.webmanifest`, `${BASE_PATH}/favicon.svg`, `${BASE_PATH}/images/riverside.png`, `${BASE_PATH}/images/places/shenzhen-bay.jpg`, `${BASE_PATH}/og.png`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(ROOT_PATH, copy));
      return response;
    }).catch(() => caches.match(ROOT_PATH)));
    return;
  }

  if (["image", "font", "style", "script"].includes(request.destination)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    })));
  }
});
