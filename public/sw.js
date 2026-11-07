const CACHE = 'rutasnx-v2'
const APP_SHELL = ['/manifest.webmanifest', '/icon.svg', '/icon-maskable.svg']

const OFFLINE_HTML = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sin conexión - rutasNX</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0D0D0D; color: #fff; font-family: system-ui, sans-serif; padding: 24px; }
    main { max-width: 420px; text-align: center; }
    h1 { font-size: 22px; margin: 0 0 10px; }
    p { color: #a1a1aa; line-height: 1.5; margin: 0 0 20px; }
    a { display: inline-block; background: #10B981; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <h1>Sin conexión</h1>
    <p>No pudimos cargar la aplicación. Los puntos que guardes sin señal se sincronizarán automáticamente al recuperar la conexión.</p>
    <a href="/chofer/registro">Reintentar</a>
  </main>
</body>
</html>`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    const cacheable = url.pathname === '/' || url.pathname.startsWith('/chofer')

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (cacheable && response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          if (cacheable) {
            const cached = await caches.match(request)
            if (cached) return cached
          }
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        })
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/') || APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
      })
    )
  }
})
