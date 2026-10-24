/* Filtros compactos para todos os painéis.
   O bloco de filtros do topo fica recolhido atrás de uma barra "Filtros (n) · Exportar";
   só os filtros em uso aparecem como etiquetas. No celular os filtros abrem numa folha que sobe da base.
   Também deixa as abas do cabeçalho numa linha só, rolando para o lado, no celular. */
(function(){
'use strict';
if (window.__CRV_FILTROS) return; window.__CRV_FILTROS = 1;
const ID = window.CRV_PAINEL_ID || '';
if (ID === 'quadro') return; // o Quadro já tem a versão própria
/* bloco de filtros de cada painel (o primeiro que existir) */
const ALVO = {
  'absenteismo':'main .wrap>.filters', 'absenteismo-gestao':'main .wrap>.filters',
  'admissoes':'#filters', 'rescisoes':'#filters', 'sancoes':'#filters', 'rd':'#filters',
  'treinamentos':'main>.filters', 'ferias':'.filters[role=search]', 'crachas':'.filters[role=search]',
  'alojamentos':'.filters[role=search]', 'onibus':'.filters[role=search]', 'fadiga':'section.filters',
  'farmacia':'#filt', 'perfil':'.gfilters', 'pesquisas':'#fbar', 'recepcao':'.filters', 'fat':'main .fbar', 'gratificacao':'.fbar'
};
const CSS = `
.cf-tool{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid rgba(20,33,61,.12);border-radius:14px;box-shadow:0 1px 2px rgba(20,33,61,.05),0 6px 18px rgba(20,33,61,.06);padding:9px 12px;margin:0 0 14px;font-size:14px;color:#14213d}
.cf-b{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(20,33,61,.14);background:#f2f4f8;color:#14213d;border-radius:10px;padding:8px 14px;font:700 14px inherit;font-family:inherit;cursor:pointer;white-space:nowrap}
.cf-b:hover{border-color:#3b5a9a}.cf-b svg{width:16px;height:16px}
.cf-b.on{background:#24427c;border-color:#24427c;color:#fff}
.cf-n{background:#e9a23b;color:#16284d;border-radius:20px;padding:0 7px;font-size:12px}
.cf-act{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0;align-items:center}
.cf-c{display:inline-flex;align-items:center;gap:4px;background:#fdf1da;color:#7a4f00;border-radius:20px;padding:4px 6px 4px 11px;font:600 12.5px inherit;font-family:inherit;max-width:280px}
.cf-c span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cf-c button{border:0;background:rgba(0,0,0,.08);color:inherit;width:20px;height:20px;border-radius:50%;cursor:pointer;font-weight:800;line-height:1;flex:none;padding:0}
.cf-z{color:#5d6a85;font-size:13px}
.cf-l{border:0;background:none;color:#24427c;font:700 12.5px inherit;font-family:inherit;cursor:pointer;text-decoration:underline;padding:0}
.cf-x{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto;align-items:center}
.cf-wrap.cf-off>.cf-box{display:none!important}
.cf-hd{display:none}
@media (max-width:760px){
  .cf-tool{padding:8px 10px;gap:8px}.cf-act{flex:1 1 auto}.cf-z{display:none}.cf-x{flex:1 1 100%;margin-left:0;flex-wrap:nowrap;gap:6px}.cf-x>*{flex:1 1 0!important;min-width:0!important;padding:7px 6px!important;font-size:12.5px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cf-wrap:not(.cf-off)>.cf-box select{max-width:100%!important;width:100%!important}
  .cf-wrap:not(.cf-off)>.cf-box{position:fixed!important;left:0;right:0;bottom:0;top:auto;z-index:2000;max-height:82vh;overflow:auto;margin:0!important;border-radius:18px 18px 0 0!important;box-shadow:0 -10px 40px rgba(0,0,0,.25)!important;background:#fff!important;padding:0 16px 18px!important;display:block!important;width:auto!important}
  .cf-wrap:not(.cf-off)::before{content:"";position:fixed;inset:0;background:rgba(10,20,40,.45);z-index:1999}
  .cf-wrap:not(.cf-off)>.cf-box>.cf-hd{display:flex;position:sticky;top:0;background:#fff;z-index:2;align-items:center;justify-content:space-between;padding:14px 0 10px;margin:0 0 8px;border-bottom:1px solid rgba(20,33,61,.12)}
  .cf-hd b{font-size:17px}.cf-hd button{border:0;background:#24427c;color:#fff;border-radius:10px;padding:9px 16px;font:700 14px inherit;font-family:inherit;cursor:pointer}
  .cf-tabs{flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .cf-tabs::-webkit-scrollbar{display:none}
  .cf-tabs>*{flex:0 0 auto!important;white-space:nowrap!important}
}`;
function estilo(){ if (document.getElementById('cf-css')) return; const s = document.createElement('style'); s.id = 'cf-css'; s.textContent = CSS; document.head.appendChild(s); }
const vis = el => !!(el && el.offsetParent !== null || (el && el.getClientRects().length));
const limpa = t => String(t || '').replace(/\s+/g, ' ').replace(/\s*\(\s*\d[\d.,]*\s*(pessoas?|admiss[õo]es|rescis[õo]es|registros?|colaboradores?)?\s*\)\s*$/i, '').trim();
const ATIVO = b => b.classList.contains('on') || b.classList.contains('active') || b.classList.contains('sel') || b.classList.contains('is-on') || b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-checked') === 'true';
function rotulo(el, box){
  let n = el; for (let i = 0; i < 4 && n && n !== box; i++, n = n.parentElement) {
    const l = n.querySelector(':scope>.lab,:scope>label>span,:scope>.label,:scope>span.lab,:scope>b,:scope>.flab');
    if (l && !l.contains(el) && l.textContent.trim().length < 30) return l.textContent.trim().replace(/:$/, '');
    if (n.tagName === 'LABEL') { const t = [...n.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('').trim(); if (t) return t.replace(/:$/, ''); }
  }
  return el.getAttribute('aria-label') || '';
}
function filtros(box){
  const A = [];
  box.querySelectorAll('select').forEach(s => { if (!vis(s) || s.selectedIndex <= 0 || s.multiple) return;
    const o = s.options[s.selectedIndex]; A.push({ t: limpa(o ? o.textContent : s.value), l: rotulo(s, box), clr: () => { s.selectedIndex = 0; s.dispatchEvent(new Event('input', { bubbles:true })); s.dispatchEvent(new Event('change', { bubbles:true })); } }); });
  box.querySelectorAll('input[type=search],input[type=text],input:not([type])').forEach(i => { if (!vis(i) || !i.value.trim()) return;
    A.push({ t: 'Busca: ' + i.value.trim(), l: '', clr: () => { i.value = ''; i.dispatchEvent(new Event('input', { bubbles:true })); i.dispatchEvent(new Event('change', { bubbles:true })); } }); });
  // grupos de botões (chips): o primeiro é "Todos"; qualquer outro ativo é um filtro
  const grupos = new Set();
  box.querySelectorAll('button').forEach(b => { const p = b.parentElement; if (p && p.querySelectorAll(':scope>button').length >= 2) grupos.add(p); });
  grupos.forEach(g => { if (!vis(g)) return; const bs = [...g.querySelectorAll(':scope>button')].filter(vis); if (bs.length < 2) return;
    const on = bs.filter(ATIVO); if (!on.length || on.length === bs.length) return;
    if (on.length === 1 && on[0] === bs[0]) return;
    on.filter(b => b !== bs[0]).forEach(b => A.push({ t: limpa(b.textContent), l: rotulo(g, box), clr: () => bs[0].click() })); });
  box.querySelectorAll('input[type=checkbox]').forEach(c => { if (!vis(c) || !c.checked || c.closest('table')) return; const lb = c.closest('label'); const t = lb ? lb.textContent.trim() : ''; if (t && t.length < 50) A.push({ t, l:'', clr: () => c.click() }); });
  return A;
}
function montar(box){
  if (box.dataset.cf) return; box.dataset.cf = 1;
  estilo();
  const w = document.createElement('div'); w.className = 'cf-wrap cf-off';
  box.parentNode.insertBefore(w, box); w.appendChild(box); box.classList.add('cf-box');
  const tl = document.createElement('div'); tl.className = 'cf-tool';
  tl.innerHTML = '<button type="button" class="cf-b" data-cf="t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Filtros<span class="cf-n" hidden></span></button><div class="cf-act"></div>';
  w.insertBefore(tl, box);
  // botões de ação (PDF, Excel, imprimir, selecionar) não ficam escondidos: vão para a barra
  const xs = [...box.querySelectorAll('button,a.btn')].filter(b => /\b(pdf|excel|exportar|imprimir|selecionar|gerar)\b/i.test(b.textContent) && !b.closest('[role=group],.chips,.seg'));
  if (xs.length) { const xw = document.createElement('div'); xw.className = 'cf-x'; xs.forEach(b => xw.appendChild(b)); tl.appendChild(xw); }
  const hd = document.createElement('div'); hd.className = 'cf-hd'; hd.innerHTML = '<b>Filtros</b><button type="button">Ver resultado</button>';
  box.insertBefore(hd, box.firstChild);
  const tg = tl.querySelector('[data-cf=t]');
  const chave = 'crv-cf-' + ID;
  const abre = on => { w.classList.toggle('cf-off', !on); tg.classList.toggle('on', on); try { localStorage.setItem(chave, on ? '1' : '0'); } catch(_){} };
  let ini = '0'; try { ini = localStorage.getItem(chave) || '0'; } catch(_){}
  abre(ini === '1' && !matchMedia('(max-width:760px)').matches);
  tg.onclick = () => abre(w.classList.contains('cf-off'));
  hd.querySelector('button').onclick = () => abre(false);
  w.addEventListener('mousedown', e => { if (e.target === w) abre(false); });
  const act = tl.querySelector('.cf-act'), n = tl.querySelector('.cf-n');
  let tm = null, ocupado = false;
  const resumo = () => { if (ocupado) return; ocupado = true;
    try {
      const A = filtros(box);
      n.hidden = !A.length; n.textContent = A.length;
      const h = A.length ? A.map((a, i) => '<span class="cf-c" title="' + (a.l || '').replace(/"/g, '') + '"><span>' + (a.l && a.l.length < 18 ? a.l + ': ' : '') + a.t.replace(/</g, '&lt;') + '</span><button type="button" data-i="' + i + '" aria-label="Tirar filtro">×</button></span>').join('') + (A.length > 1 ? '<button type="button" class="cf-l">Limpar tudo</button>' : '') : '<span class="cf-z">Sem filtros aplicados</span>';
      if (act.innerHTML !== h) act.innerHTML = h;
      act.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { A[+b.dataset.i].clr(); setTimeout(resumo, 60); });
      const lt = act.querySelector('.cf-l'); if (lt) lt.onclick = () => { const lx = [...box.querySelectorAll('button')].find(b => /^limpar/i.test(b.textContent.trim()) && vis(b)); if (lx) lx.click(); else A.slice().reverse().forEach(a => a.clr()); setTimeout(resumo, 80); };
    } finally { ocupado = false; }
  };
  new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(resumo, 40); }).observe(box, { subtree:true, childList:true, attributes:true, attributeFilter:['class','aria-pressed','aria-selected','hidden','style'] });
  box.addEventListener('change', () => setTimeout(resumo, 40)); box.addEventListener('input', () => setTimeout(resumo, 300)); box.addEventListener('click', () => setTimeout(resumo, 60));
  resumo();
}
function abas(){
  // abas do cabeçalho: elemento dentro do topo com 3+ botões/links como filhos diretos
  const topo = document.querySelector('header, .top, .band, .hero, .hd') || document.body;
  topo.querySelectorAll('nav, div, [role=tablist]').forEach(el => { if (el.classList.contains('cf-tabs')) return;
    const k = [...el.children]; if (k.length < 3) return;
    const bt = k.filter(x => x.tagName === 'BUTTON' || x.tagName === 'A');
    if (bt.length >= 3 && bt.length >= k.length - 1) el.classList.add('cf-tabs'); });
}
function iniciar(){
  estilo(); abas();
  const sel = ALVO[ID]; if (!sel) return;
  const box = document.querySelector(sel); if (box) montar(box);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(iniciar, 50)); else setTimeout(iniciar, 50);
})();
