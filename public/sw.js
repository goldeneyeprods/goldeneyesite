// ============================================================================
//  Service Worker do app de portaria
//
//  Objetivo: manter a tela do scanner funcionando mesmo sem internet.
//
//  ESTRATÉGIA — "rede primeiro, cache como rede de segurança":
//    - Com internet: sempre busca a versão nova e guarda uma cópia.
//    - Sem internet: entrega a última cópia guardada.
//
//  Por que NÃO "cache primeiro": a página guardada aponta para arquivos de
//  CSS e JS com nomes que mudam a cada build. Servindo a cópia velha, o
//  navegador pede arquivos que já não existem — e a tela abre sem estilo
//  nenhum. Foi exatamente isso que aconteceu.
// ============================================================================

const CACHE = 'ge-portaria-v2'
const ESSENCIAIS = ['/portaria', '/manifest.json']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (evento) => {
  // Apaga versões antigas do cache — inclusive a v1, que servia páginas velhas.
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
  const req = evento.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Nunca servir API do cache: um check-in vencido liberaria quem já entrou.
  if (url.pathname.startsWith('/api/')) return

  const ehDaPortaria =
    url.pathname.startsWith('/portaria') || ESSENCIAIS.includes(url.pathname)
  // Os arquivos de build são versionados no nome, então podem vir do cache.
  const ehEstatico = url.pathname.startsWith('/_next/static/')

  if (!ehDaPortaria && !ehEstatico) return

  evento.respondWith(
    fetch(req)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copia))
        }
        return resposta
      })
      .catch(async () => {
        // Sem rede: entrega o que estiver guardado.
        const guardado = await caches.match(req)
        if (guardado) return guardado
        // Última linha: qualquer navegação da portaria cai na tela do scanner.
        if (req.mode === 'navigate') {
          const portaria = await caches.match('/portaria')
          if (portaria) return portaria
        }
        return Response.error()
      })
  )
})
