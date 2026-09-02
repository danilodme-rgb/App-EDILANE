/* Rotina da Edilane — cache offline com atualização automática.
   Estratégia: rede primeiro, cache como reserva. Assim toda publicação
   nova chega ao usuário no próximo carregamento, e o app continua
   funcionando sem internet. O CI substitui __BUILD__ pelo commit. */

const VERSION = '__BUILD__';
const CACHE = `rotina-edilane-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // 'no-store' pula o cache HTTP do navegador: sem isso o Pages serve a
  // versão antiga por até 10 minutos (Cache-Control: max-age=600).
  const daRede = new Request(req, { cache: 'no-store' });

  e.respondWith(
    fetch(daRede)
      .then((res) => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
        )
      )
  );
});
