// CIAC service worker (scope /ciac/ on GitHub Pages, / on ciac-tcg.com).
// zyzythepizi.github.io is shared with other sites, so every cache name is
// prefixed and nothing outside the app's own needs is touched.
const V = 'v1'
const SHELL = `ciac-shell-${V}`
const DATA = `ciac-data-${V}`
// img2: the first image cache could hold failed responses (a TCGdex 503 stored as an
// opaque "picture"); the new name drops it on every device (activate deletes old ciac- caches)
const IMG = `ciac-img2-${V}`
const BASE = new URL('./', self.location).pathname // "/ciac/"
const IMG_CAP = 2000 // card images are ~20–70 KB: about 60–100 MB at most

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll([BASE, `${BASE}index.html`, `${BASE}manifest.webmanifest`, `${BASE}icon.svg`])).catch(() => {}))
})
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('ciac-') && ![SHELL, DATA, IMG].includes(k)) await caches.delete(k)
    await self.clients.claim()
  })())
})
self.addEventListener('message', (e) => { if (e.data === 'skip-waiting') self.skipWaiting() })

async function trim(cacheName, max) {
  const c = await caches.open(cacheName)
  const keys = await c.keys()
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i])
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // app navigations: network first, the cached shell offline (SPA routes)
  if (req.mode === 'navigate' && url.pathname.startsWith(BASE)) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) caches.open(SHELL).then(c => c.put(`${BASE}index.html`, res.clone()))
      return res
    }).catch(async () => (await caches.match(`${BASE}index.html`)) || Response.error()))
    return
  }
  // hashed build assets: cache first
  if (url.origin === location.origin && url.pathname.startsWith(`${BASE}assets/`)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)) }
      return res
    })))
    return
  }
  // the price relay: catalog, scan index, indices, history (stale-while-revalidate);
  // today's prices go to the network first. Same origin on GitHub Pages, another
  // origin on ciac-tcg.com.
  // the scanner's models and index (?v=<content hash>) and the pinned onnxruntime build never change: cache first
  // the region worlds' models (public/world, ?v=<content hash>) too
  const forever = (url.hostname === 'zyzythepizi.github.io' && url.pathname.startsWith('/pokemon-price-data/scan/v2/') && url.searchParams.has('v'))
    || (url.origin === location.origin && url.pathname.startsWith(`${BASE}world/`) && url.searchParams.has('v'))
    || (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/onnxruntime-web@'))
  if (forever) {
    e.respondWith((async () => {
      const cache = await caches.open(DATA)
      const hit = await cache.match(req)
      if (hit) return hit
      const res = await fetch(req)
      if (res.ok) cache.put(req, res.clone())
      return res
    })())
    return
  }
  if (url.hostname === 'zyzythepizi.github.io' && url.pathname.startsWith('/pokemon-price-data/')) {
    const fresh = /\/prices\/(latest|manifest)\.json$|\/catalog\/v2\/manifest\.json$/.test(url.pathname)
    e.respondWith((async () => {
      const cache = await caches.open(DATA)
      const hit = await cache.match(req)
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res }).catch(() => hit)
      return fresh ? (await net) || hit || Response.error() : hit || net
    })())
    return
  }
  // card images (TCGdex, Pokéllector, pokemontcg.io, Limitless, TCGplayer, proxy): cache first, capped
  if (/^(assets\.tcgdex\.net|den-cards\.pokellector\.com|den-media\.pokellector\.com|wsrv\.nl|raw\.githubusercontent\.com|images\.pokemontcg\.io|limitlesstcg\.nyc3\.cdn\.digitaloceanspaces\.com|tcgplayer-cdn\.tcgplayer\.com)$/.test(url.hostname) && req.destination === 'image') {
    e.respondWith(caches.match(req).then(hit => hit || loadImage(req)))
  }
})

/**
 * A card picture, reliably. An <img> request is "no-cors": its response hides the
 * status, so a TCGdex 503 (it refuses bursts: a binder page asks for dozens at once)
 * looked like a picture and was cached for good. Here: a CORS fetch whose status we
 * can see, one retry, then the wsrv.nl image proxy (it also fixes TCGdex's occasional
 * duplicated CORS header); only an ok response is cached, under the original request.
 * Last resort: the plain request, never cached.
 */
async function loadImage(req) {
  const keep = (res) => {
    const copy = res.clone()
    caches.open(IMG).then(c => c.put(req, copy)).then(() => trim(IMG, IMG_CAP)).catch(() => {})
    return res
  }
  const tryCors = async (u) => { try { const r = await fetch(u, { mode: 'cors', credentials: 'omit' }); return r.ok ? r : null } catch { return null } }
  // TCGplayer's CDN sends no CORS header and wsrv.nl refuses it ("blocked by policy"): through our Worker
  // (worker/index.js, same rule as corsImageUrl in src/lib/cards.ts), else a plain request, not cached
  const tcgp = /^https:\/\/tcgplayer-cdn\.tcgplayer\.com\/product\/(\d+_(?:200w|400w)\.jpg)$/.exec(req.url)
  if (tcgp) {
    const viaWorker = await tryCors(`https://ciac-tcg.com/img/tcgplayer/${tcgp[1]}`)
    return viaWorker ? keep(viaWorker) : fetch(req)
  }
  let res = await tryCors(req.url)
  if (!res) { await new Promise(r => setTimeout(r, 700)); res = await tryCors(req.url) }
  if (!res && !req.url.startsWith('https://wsrv.nl/')) res = await tryCors(`https://wsrv.nl/?url=${encodeURIComponent(req.url)}`)
  if (res) return keep(res)
  return fetch(req)
}

// Web Push (sent by the price relay's alert job when the user subscribed)
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = { body: e.data && e.data.text() } }
  e.waitUntil(self.registration.showNotification(data.title || 'CIAC', {
    body: data.body || '', icon: `${BASE}icon-192.png`, badge: `${BASE}icon-192.png`, tag: data.tag || 'ciac', data: { url: data.url || BASE },
  }))
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = (e.notification.data && e.notification.data.url) || BASE
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) if (c.url.includes(BASE)) { c.focus(); return c.navigate(target) }
    return self.clients.openWindow(target)
  }))
})
