// Service worker: guarda só o "esqueleto" do app para abrir rápido. Dados nunca ficam em cache.
const CACHE = 'crv-gp-v258';
const ARQS = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/ponte.js', 'js/painel-filtros.js', 'js/importadores.js', 'js/risco.js', 'js/onboarding.js', 'js/desempenho.js', 'js/justa.js', 'js/aprendiz-pos.js', 'js/pdf-totais.js', 'js/relatorio.js', 'js/bases.js', 'js/gestor.js', 'config.js', 'img/logo-crv.png', 'img/logo-syspro.png', 'img/icone-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Supabase e CDNs: sempre rede
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
