// Service worker: guarda o "esqueleto" do app (telas, painéis e bibliotecas) para abrir rápido e também sem internet.
// Os DADOS não ficam aqui: o modo offline (js/offline.js) guarda uma cópia limpa e cifrada no IndexedDB.
const CACHE = 'crv-gp-v347';
const ARQS = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/ponte.js', 'js/area-paineis.js', 'js/area-filtros.js', 'js/painel-filtros.js', 'js/importadores.js', 'js/risco.js', 'js/onboarding.js', 'js/desempenho.js', 'js/justa.js', 'js/aprendiz-pos.js', 'js/pdf-totais.js', 'js/relatorio.js', 'js/bases.js', 'js/cadastros.js', 'js/organograma.js', 'js/org-empresa.js', 'js/org-crv.js', 'js/dispensa.js', 'js/respostas.js', 'js/gestor.js', 'js/notificacoes.js', 'js/offline.js', 'config.js', 'img/logo-crv.png', 'img/logo-syspro.png', 'img/icone-192.png', 'manifest.webmanifest'].concat(["paineis/absenteismo-gestao.html", "paineis/absenteismo.html", "paineis/admissoes.html", "paineis/alojamentos.html", "paineis/cartao-adm.html", "paineis/cartoes.html", "paineis/clube.html", "paineis/conexao.html", "paineis/crachas.html", "paineis/curriculos.html", "paineis/experiencia.html", "paineis/fadiga.html", "paineis/farmacia.html", "paineis/fat.html", "paineis/ferias.html", "paineis/gratificacao.html", "paineis/jovem.html", "paineis/lideres.html", "paineis/onibus.html", "paineis/ouvidorias.html", "paineis/perfil.html", "paineis/pesquisas.html", "paineis/processos.html", "paineis/quadro.html", "paineis/rd.html", "paineis/recepcao.html", "paineis/renapsi.html", "paineis/rescisoes.html", "paineis/sancoes.html", "paineis/servicos-gerais.html", "paineis/sysprocard.html", "paineis/treinamentos.html", "paineis/unimed.html", "paineis/uniodonto.html"]);
// bibliotecas de fora (CDN) e fontes: usadas pelo app e pelos painéis; ficam guardadas para abrir sem internet
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com)\//;
const LIBS = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS).then(() => Promise.all(LIBS.map(u => fetch(u, { mode:'cors' }).then(r => r.ok ? c.put(u, r) : null).catch(() => null)))))); self.skipWaiting(); });
// troca de versão: os painéis e bibliotecas já guardados passam para a cópia nova (para continuar abrindo sem internet); o resto sai
self.addEventListener('activate', e => { e.waitUntil(caches.open(CACHE).then(novo => caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && /^crv-gp-/.test(k)).map(async k => {
  const velho = await caches.open(k); for (const r of await velho.keys()) { const u = new URL(r.url); if (!(CDN.test(r.url) || /\/paineis\/[^/]+\.html$/.test(u.pathname))) continue;
    if (await novo.match(r, { ignoreSearch:!CDN.test(r.url) })) continue; const m = await velho.match(r); if (m) await novo.put(r, m); }
  await caches.delete(k); }))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // bibliotecas e fontes de CDN: usa a guardada na hora e renova em segundo plano
  if (CDN.test(e.request.url)) { e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreVary:true }).then(m => { const rede = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => m || Response.error()); return m || rede; }))); return; }
  if (u.origin !== location.origin) return; // Supabase: o app cuida (js/offline.js)
  if (u.searchParams.has('t')) return; // conferência de versão: direto na rede, sem guardar
  // rede primeiro; resposta com erro (ex.: site fora do ar, 404) não substitui a cópia boa guardada
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r => { if (!r.ok) return caches.match(e.request).then(m => m || caches.match(e.request, { ignoreSearch:true })).then(m => m || r); const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match(e.request, { ignoreSearch:true })).then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
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
