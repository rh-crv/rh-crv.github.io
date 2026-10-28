/* =====================================================================
   NOTIFICAÇÕES (sininho + push no aparelho, como o WhatsApp)
   As notificações nascem no banco (13_notificacoes.sql): o RH recebe o que os gestores enviam e o gestor/assistente
   recebe o que o RH responde ou libera para a área dele. Aqui: sininho com a lista e o número de não lidas,
   número no ícone do app (badge), pedido de permissão na primeira vez e inscrição do aparelho para o push.
   ===================================================================== */
window.CRV_NOTIF = (function(){
'use strict';
let sb = null, E = null, L = [], canal = null, relogio = null, ok = false;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const naoLidas = () => L.filter(n => !n.lida_em).length;
const suportaPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const quando = iso => { const d = new Date(iso), s = (Date.now() - d) / 1000; if (s < 60) return 'agora'; if (s < 3600) return Math.floor(s / 60) + ' min'; if (s < 86400) return Math.floor(s / 3600) + ' h';
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }); };

/* número no ícone do app */
function badge(){ const n = naoLidas(); try { if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n).catch(() => {}); else navigator.clearAppBadge().catch(() => {}); } } catch(_){}
  const b = $('#notif-sino'); if (b) { b.querySelector('.ns-n').textContent = n > 99 ? '99+' : n; b.classList.toggle('tem', n > 0); b.title = n ? n + ' notificação(ões) não lida(s)' : 'Notificações'; } }

async function ler(){ if (!sb || !E.perfil || E.perfil.__sim) return;
  const { data, error } = await sb.from('notificacoes').select('*').eq('para', E.perfil.user_id).order('criado_em', { ascending:false }).limit(60);
  if (error) { ok = false; const b = $('#notif-sino'); if (b) b.hidden = true; return; }   // banco ainda sem a tabela: o sininho fica escondido
  ok = true; L = data || []; sino(); badge(); if ($('#notif-painel')) lista(); }

function css(){ if ($('#notif-css')) return; const s = document.createElement('style'); s.id = 'notif-css'; s.textContent = `
  #notif-sino{position:fixed;top:10px;right:14px;z-index:60;width:42px;height:42px;border-radius:50%;border:1px solid var(--linha,#dfe4ee);background:#fff;color:#24427c;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(20,33,61,.12)}
  #notif-sino .ns-n{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#d4573f;color:#fff;font:700 11.5px/20px system-ui,sans-serif;display:none}
  #notif-sino.tem .ns-n{display:block}
  #notif-painel{position:fixed;top:58px;right:14px;z-index:61;width:min(420px,calc(100vw - 28px));max-height:min(70vh,560px);display:flex;flex-direction:column;background:#fff;border:1px solid #dfe4ee;border-radius:12px;box-shadow:0 12px 32px rgba(20,33,61,.22);overflow:hidden}
  #notif-painel header{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #e6eaf2}#notif-painel header b{flex:1;font-size:15px;color:#16284d}
  #notif-painel .np-l{overflow:auto}#notif-painel .np-i{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eef1f6;background:#fff;padding:10px 14px 10px 26px;cursor:pointer;position:relative;font:inherit;color:#14213d}
  #notif-painel .np-i.nova{background:#fff8ec}#notif-painel .np-i.nova::before{content:'';position:absolute;left:10px;top:16px;width:8px;height:8px;border-radius:50%;background:#d4573f}
  #notif-painel .np-i b{display:block;font-size:13.5px}#notif-painel .np-i span{display:block;font-size:12.5px;color:#4a5670;margin-top:2px}#notif-painel .np-i small{display:block;font-size:11.5px;color:#7a859c;margin-top:3px}
  #notif-painel .np-v{padding:22px 14px;text-align:center;color:#5d6a85;font-size:13.5px}#notif-painel .np-a{padding:10px 14px;background:#f3f6fb;font-size:12.5px;color:#24427c;border-bottom:1px solid #e6eaf2}
  #notif-painel .np-a button{margin-top:6px}
  @media (max-width:860px){#notif-sino{top:7px;right:10px;width:38px;height:38px}#notif-painel{top:52px;right:8px}}`; document.head.appendChild(s); }

function sino(){ if (!ok || !E.perfil) return; css(); let b = $('#notif-sino');
  if (!b) { b = document.createElement('button'); b.id = 'notif-sino'; b.type = 'button'; b.setAttribute('aria-label', 'Notificações');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><span class="ns-n">0</span>';
    b.onclick = e => { e.stopPropagation(); $('#notif-painel') ? fechar() : abrir(); }; document.body.appendChild(b); }
  b.hidden = !!E.perfil.__sim; }

function fechar(){ const p = $('#notif-painel'); if (p) p.remove(); document.removeEventListener('click', fora, true); }
function fora(e){ const p = $('#notif-painel'); if (p && !p.contains(e.target) && e.target.id !== 'notif-sino' && !e.target.closest('#notif-sino')) fechar(); }
function abrir(){ const p = document.createElement('div'); p.id = 'notif-painel'; p.setAttribute('role', 'dialog'); document.body.appendChild(p); lista(); setTimeout(() => document.addEventListener('click', fora, true), 0); }
function lista(){ const p = $('#notif-painel'); if (!p) return; const n = naoLidas();
  const ativar = suportaPush() && Notification.permission !== 'granted' ? `<div class="np-a">${ehIOS() && !instalado() ? 'No iPhone, as notificações só funcionam com o app na Tela de Início.' : 'Receba os avisos mesmo com o app fechado.'}<br><button class="btn peq prim" id="np-ativar">${ehIOS() && !instalado() ? 'Como instalar' : 'Ativar notificações neste aparelho'}</button></div>` : '';
  p.innerHTML = `<header><b>Notificações${n ? ' · ' + n + ' não lida' + (n > 1 ? 's' : '') : ''}</b>${n ? '<button class="btn peq borda" id="np-todas">Marcar todas como lidas</button>' : ''}</header>${ativar}
    <div class="np-l">${L.length ? L.map(x => `<button class="np-i ${x.lida_em ? '' : 'nova'}" data-n="${esc(x.id)}"><b>${esc(x.titulo)}</b>${x.corpo ? `<span>${esc(x.corpo)}</span>` : ''}<small>${esc([x.de_nome ? 'Enviado por ' + x.de_nome : '', quando(x.criado_em)].filter(Boolean).join(' · '))}</small></button>`).join('') : '<div class="np-v">Nenhuma notificação por enquanto.</div>'}</div>`;
  const t = p.querySelector('#np-todas'); if (t) t.onclick = todas;
  const a = p.querySelector('#np-ativar'); if (a) a.onclick = () => { fechar(); pedir(true); };
  p.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { const x = L.find(y => y.id === b.dataset.n); fechar(); if (!x) return; lida(x.id); irPara(x.rota); }); }

function irPara(rota){ if (!rota) return; const r = String(rota); if (location.hash === r) { window.dispatchEvent(new HashChangeEvent('hashchange')); } else location.hash = r; }
async function lida(id){ const x = L.find(y => y.id === id); if (x && x.lida_em) return; if (x) x.lida_em = new Date().toISOString(); badge(); if ($('#notif-painel')) lista();
  try { await sb.from('notificacoes').update({ lida_em:new Date().toISOString() }).eq('id', id).is('lida_em', null); } catch(_){} }
async function todas(){ const agora = new Date().toISOString(); L.forEach(x => { if (!x.lida_em) x.lida_em = agora; }); badge(); lista();
  try { await sb.from('notificacoes').update({ lida_em:agora }).eq('para', E.perfil.user_id).is('lida_em', null); } catch(_){} }

/* ---------- push: permissão e inscrição deste aparelho ---------- */
const chave = b64 => { const p = '='.repeat((4 - b64.length % 4) % 4), s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...s].map(c => c.charCodeAt(0))); };
async function inscrever(){ const pub = (window.CRV_CONFIG || {}).VAPID_PUBLICA; if (!pub || !suportaPush() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready; let s = await reg.pushManager.getSubscription();
  if (!s) s = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:chave(pub) });
  const j = s.toJSON(); const { error } = await sb.from('push_inscricoes').upsert({ endpoint:j.endpoint, user_id:E.perfil.user_id, p256dh:j.keys.p256dh, auth:j.keys.auth, aparelho:navigator.userAgent.slice(0, 160), atualizado_em:new Date().toISOString() }, { onConflict:'endpoint' });
  if (error) console.warn('push', error); return !error; }
function pedir(forcar){ if (!ok || !E.perfil || E.perfil.__sim) return;
  let visto = ''; try { visto = localStorage.getItem('crv-notif-pedido') || ''; } catch(_){}
  if (!forcar && (visto || !suportaPush() && !ehIOS())) return;
  if (!forcar && suportaPush() && Notification.permission !== 'default') return;
  const marcar = () => { try { localStorage.setItem('crv-notif-pedido', '1'); } catch(_){} };
  const iosSemApp = ehIOS() && !instalado();
  const m = document.createElement('div'); m.className = 'modal-fundo'; m.style.zIndex = 70;
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="modal-cab"><h3>Receber notificações</h3><button class="x" aria-label="Fechar">&times;</button></div>
    <div class="modal-corpo">${iosSemApp ? `<p>No iPhone, as notificações só funcionam com o app instalado na Tela de Início:</p>
      <ol style="padding-left:20px;line-height:1.7"><li>Abra este endereço no <b>Safari</b>.</li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).</li><li>Toque em <b>Adicionar à Tela de Início</b> e depois em <b>Adicionar</b>.</li><li>Abra o app pelo novo ícone, entre com seu usuário e toque em <b>Permitir</b> quando aparecer este aviso.</li></ol>`
      : `<p>Avisamos você aqui no aparelho, mesmo com o app fechado, quando chegar algo novo para você: envios dos gestores, respostas do RH e medidas disciplinares.</p><p style="color:var(--mut);font-size:13px">Na próxima tela, toque em <b>Permitir</b>. Dá para mudar depois nas configurações do aparelho.</p>`}<div id="np-msg"></div></div>
    <div class="modal-pe"><button class="btn borda" id="np-depois">${iosSemApp ? 'Entendi' : 'Agora não'}</button>${iosSemApp ? '' : '<button class="btn prim" id="np-sim">Permitir notificações</button>'}</div></div>`;
  document.body.appendChild(m); const sai = () => { marcar(); m.remove(); };
  m.querySelector('.x').onclick = sai; m.querySelector('#np-depois').onclick = sai;
  const sim = m.querySelector('#np-sim'); if (sim) sim.onclick = async () => { sim.disabled = true; sim.textContent = 'Aguardando…';
    try { const r = await Notification.requestPermission(); if (r === 'granted') { const okI = await inscrever(); marcar(); m.remove(); window.CRV_TOAST && window.CRV_TOAST(okI ? 'Notificações ativadas neste aparelho.' : 'Notificações permitidas. O envio para o aparelho ainda está sendo configurado pelo RH.'); }
      else { m.querySelector('#np-msg').innerHTML = '<div class="erro">As notificações ficaram bloqueadas. Para liberar, abra as configurações do navegador/aparelho → Notificações → permitir para este site.</div>'; sim.remove(); marcar(); } }
    catch(e) { m.querySelector('#np-msg').innerHTML = '<div class="erro">' + esc(e.message || e) + '</div>'; sim.disabled = false; sim.textContent = 'Permitir notificações'; } }; }

/* ---------- ciclo ---------- */
async function iniciar(cliente, estado){ sb = cliente; E = estado; if (!E.perfil) return; parar();
  await ler(); if (!ok) return;
  try { canal = sb.channel('notif-' + E.perfil.user_id).on('postgres_changes', { event:'*', schema:'public', table:'notificacoes', filter:'para=eq.' + E.perfil.user_id }, () => ler()).subscribe(); } catch(_){}
  relogio = setInterval(() => { if (!document.hidden) ler(); }, 60000);
  document.addEventListener('visibilitychange', vis);
  if (suportaPush() && Notification.permission === 'granted') inscrever().catch(() => {});
  setTimeout(() => pedir(false), 2500); }
function vis(){ if (!document.hidden) ler(); }
function parar(){ try { if (canal) sb.removeChannel(canal); } catch(_){} canal = null; clearInterval(relogio); document.removeEventListener('visibilitychange', vis); fechar(); const b = $('#notif-sino'); if (b) b.remove(); L = []; badge(); }
/* ao sair do app: este aparelho deixa de receber push desta pessoa */
async function sair(){ try { if (sb && suportaPush()) { const reg = await navigator.serviceWorker.getRegistration(); const s = reg && await reg.pushManager.getSubscription(); if (s) await sb.from('push_inscricoes').delete().eq('endpoint', s.endpoint); } } catch(_){} parar(); }

/* toque na notificação do aparelho com o app aberto: o service worker pede para abrir o item */
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { const d = e.data || {}; if (d.tipo === 'abrir' && d.rota) { if (d.id) lida(d.id); irPara(d.rota); } });

return { iniciar, sair, lida, ler, pedir: () => pedir(true) };
})();
