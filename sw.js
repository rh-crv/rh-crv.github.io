// Service worker: guarda só o "esqueleto" do app para abrir rápido. Dados nunca ficam em cache.
const CACHE = 'crv-gp-v332';
const ARQS = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/ponte.js', 'js/area-paineis.js', 'js/area-filtros.js', 'js/painel-filtros.js', 'js/importadores.js', 'js/risco.js', 'js/onboarding.js', 'js/desempenho.js', 'js/justa.js', 'js/aprendiz-pos.js', 'js/pdf-totais.js', 'js/relatorio.js', 'js/bases.js', 'js/cadastros.js', 'js/organograma.js', 'js/org-empresa.js', 'js/dispensa.js', 'js/respostas.js', 'js/gestor.js', 'js/notificacoes.js', 'config.js', 'img/logo-crv.png', 'img/logo-syspro.png', 'img/icone-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Supabase e CDNs: sempre rede
  if (u.searchParams.has('t')) return; // conferência de versão: direto na rede, sem guardar
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

/* ---------- notificações push (como o WhatsApp): aparece fora do app e na tela bloqueada; número no ícone ---------- */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(_) { d = { corpo: e.data ? e.data.text() : '' }; }
  const tarefas = [self.registration.showNotification(d.titulo || 'Gestão de Pessoas', { body:d.corpo || '', icon:'img/icone-192.png', badge:'img/icone-192.png', tag:d.id || undefined, renotify:true, data:{ rota:d.rota || '#/', id:d.id || '' } })];
  if (self.navigator && 'setAppBadge' in self.navigator) tarefas.push(d.badge ? self.navigator.setAppBadge(d.badge).catch(() => {}) : self.navigator.clearAppBadge().catch(() => {}));
  e.waitUntil(Promise.all(tarefas));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {}, rota = d.rota || '#/', url = new URL('./', self.registration.scope).href + rota + (d.id ? (rota.includes('?') ? '&' : '?') + 'n=' + d.id : '');
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(L => {
    const c = L.find(x => x.url.startsWith(self.registration.scope));
    if (c) { c.postMessage({ tipo:'abrir', rota, id:d.id }); return c.focus(); }
    return clients.openWindow(url);
  }));
});
