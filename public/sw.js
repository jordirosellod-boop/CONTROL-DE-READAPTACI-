/* Service worker de Readaptació (CE Europa)
 * - Pàgines: primer la xarxa; sense connexió, l'última versió desada (o la pàgina "sense connexió").
 * - Fitxers estàtics, fonts i fotos del club: des de la memòria cau.
 * - Notificacions push i obrir l'app en tocar-les.
 */
const VERSIO = "v1";
const ESTATICS = `ra-estatics-${VERSIO}`;
const PAGINES = "ra-pagines";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ESTATICS).then((c) => c.addAll(["/offline.html", "/escut.png", "/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const claus = await caches.keys();
      await Promise.all(claus.filter((k) => k.startsWith("ra-estatics-") && k !== ESTATICS).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// En sortir de l'app s'esborren les pàgines desades (dades de salut)
self.addEventListener("message", (event) => {
  if (event.data === "esborra-pagines") event.waitUntil(caches.delete(PAGINES));
});

async function primerCau(req) {
  const cau = await caches.open(ESTATICS);
  const desat = await cau.match(req);
  if (desat) return desat;
  const resp = await fetch(req);
  if (resp.ok || resp.type === "opaque") cau.put(req, resp.clone());
  return resp;
}

async function primerXarxa(req, esNavegacio) {
  const cau = await caches.open(PAGINES);
  try {
    const resp = await fetch(req);
    // Només es desen pàgines bones de l'app (no redireccions a l'accés)
    if (resp.ok && !resp.redirected) cau.put(req, resp.clone());
    return resp;
  } catch (err) {
    const desat = (await cau.match(req)) || (esNavegacio && (await cau.match(req, { ignoreSearch: true })));
    if (desat) return desat;
    if (esNavegacio) return (await caches.match("/offline.html")) || Response.error();
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname === "www.ceeuropa.cat") return event.respondWith(primerCau(req)); // fotos del club
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/login" || url.pathname === "/sw.js") return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/splash/") || /\.(png|jpg|svg|ico|woff2?|ttf)$/.test(url.pathname)) {
    return event.respondWith(primerCau(req));
  }
  const esNavegacio = req.mode === "navigate";
  if (esNavegacio || req.headers.get("RSC") === "1") event.respondWith(primerXarxa(req, esNavegacio));
});

// Notificacions push
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Readaptació", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Readaptació", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/favicon.png",
      tag: data.tag || "readaptacio",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const desti = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const finestres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const oberta = finestres.find((c) => c.url.startsWith(self.location.origin));
      if (oberta) {
        await oberta.focus();
        return oberta.navigate(desti);
      }
      return self.clients.openWindow(desti);
    })(),
  );
});
