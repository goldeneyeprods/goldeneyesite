// ============================================================================
//  Service Worker do app de portaria
//
//  Objetivo: manter a tela do scanner funcionando mesmo sem internet.
//  Estratégia deliberada:
//    - Páginas e assets: cache-first (a portaria abre offline)
//    - Chamadas de API: SEMPRE rede, nunca cache (dado de check-in vencido
//      liberaria gente que já entrou)
// ============================================================================

const CACHE = 'ge-portaria-v1'
const ESSENCIAIS = ['/portaria', '/manifest.json']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ESSENCIAIS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url)

  // Nunca servir API do cache.
  if (url.pathname.startsWith('/api/')) return

  // Só cuidamos das rotas da portaria; o site público segue o fluxo normal.
  if (!url.pathname.startsWith('/portaria') && !ESSENCIAIS.includes(url.pathname)) {
    return
  }

  evento.respondWith(
    caches.match(evento.request).then((emCache) => {
      const daRede = fetch(evento.request)
        .then((resposta) => {
          // Guarda a versão nova para a próxima vez que a rede cair.
          if (resposta.ok && evento.request.method === 'GET') {
            const copia = resposta.clone()
            caches.open(CACHE).then((cache) => cache.put(evento.request, copia))
          }
          return resposta
        })
        .catch(() => emCache)

      // Responde do cache na hora e atualiza em segundo plano.
      return emCache || daRede
    })
  )
})
