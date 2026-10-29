/* =====================================================================
   ORGANOGRAMA CRV · MONTADO MANUALMENTE (out/2026), no mesmo visual do Organograma do RH
   · Cartões: pessoa COM matrícula (dados do Quadro Geral), pessoa SEM matrícula (diretoria, consultor, prestador,
     outra empresa: selo com o vínculo) ou Área/Departamento (sem pessoa, para agrupar).
   · Cada cartão: foto (só recortada no círculo; sem foto = iniciais), "O que faz", "Ligado a" (a quem responde;
     sem ligação = topo), ordem entre os do mesmo nível e "Colaboradores ligados" (manual ou automático pelos
     departamentos do Quadro, atualizado a cada importação).
   · Salva sozinho a cada mudança e guarda versões com data (dá para voltar). Toda a equipe do RH edita.
   · Guardado em registros do Quadro: 'sistema/org_crv' (cartões e editores) e coleção 'org_crv_hist' (versões).
     Fotos na coleção 'org_foto' (com matrícula usa a mesma do Organograma do RH: 'q:<matrícula>'; sem matrícula: 'c:<id>').
   · Gestor/assistente: cópia só de leitura gerada pelo administrador (window.CRV_ORG_SNAP.crv).
   ===================================================================== */
window.CRV_OCRV_INIT = function(X){
'use strict';
const { sb, E, $, esc, moldura, toast, traduzErro, ehRH, ehAdmin, baixar } = X;
const quem = () => (E.perfil && E.perfil.nome) || '';
const N = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const tc = s => String(s || '').toLowerCase().replace(/(^|[\s\/(.-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Dos|Das|E|Em) /g, m => m.toLowerCase())
  .replace(/\b(Ii|Iii|Iv|Vi|Vii|Viii|Rh|Crv|Ctt|Ti|Pcm|Adm|Sgi|Sesmt|Cct|Mg|Td)\b/gi, m => m.toUpperCase()).replace(/\((A|O|As|Os)\)/g, m => m.toLowerCase());
const iniciais = n => { const w = String(n || '').split(/\s+/).filter(x => x.length > 2); return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
const brD = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
const tempoCasa = adm => { if (!/^\d{4}-\d{2}-\d{2}/.test(adm || '')) return ''; const a = new Date(adm.slice(0, 10) + 'T12:00:00'), h = new Date(); let m = (h.getFullYear() - a.getFullYear()) * 12 + h.getMonth() - a.getMonth(); if (h.getDate() < a.getDate()) m--;
  const y = Math.floor(m / 12), r = m % 12; return y ? y + (y === 1 ? ' ano' : ' anos') + (r ? ' e ' + r + (r === 1 ? ' mês' : ' meses') : '') : r > 0 ? r + (r === 1 ? ' mês' : ' meses') : 'menos de 1 mês'; };
const colab = n => n + (n === 1 ? ' colaborador' : ' colaboradores');
const corDe = k => { const P = ['#2e7d4f', '#b5731a', '#7b3fa0', '#1d7a88', '#c0583f', '#5b3f9e', '#8a7a2e', '#2f6fa8']; let h = 0; String(k).split('').forEach(c => h = (h * 31 + c.charCodeAt(0)) >>> 0); return P[h % P.length]; };
const COR = { pessoa:'#1f3a68', externo:'#7b3fa0', area:'#2e7d4f' };
const areaDe = (a, d, f) => (window.CRV_AREA && window.CRV_AREA.areaDe) ? window.CRV_AREA.areaDe(a, d, f) : a;
const SNAP = () => window.CRV_ORG_SNAP && window.CRV_ORG_SNAP.crv;
const novoId = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let RHFAZ = () => '', CFG = { nos:[], editores:[] }, FOTOS = {}, Q = null, DEPS = null, VIS = { fechados:new Set(), z:0, q:'', modo:'' };

/* ---------- dados ---------- */
async function ler(){
  if (SNAP()) { const S = SNAP(); CFG = { nos:S.nos || [], editores:[] }; FOTOS = Object.assign({}, S.fotos || {}); Q = null; return; }
  try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/org_crv').maybeSingle(); CFG = Object.assign({ nos:[], editores:[] }, (data && data.dados) || {}); } catch(_){ CFG = { nos:[], editores:[] }; }
  FOTOS = {}; try { const { data } = await sb.from('registros').select('doc_id,dados').eq('painel', 'quadro').eq('colecao', 'org_foto'); (data || []).forEach(r => { if (r.dados && r.dados.img) FOTOS[r.doc_id] = r.dados.img; }); } catch(_){}
  try { Q = window.CRV_QUADRO ? await window.CRV_QUADRO() : null; } catch(_){ Q = null; }
  try { RHFAZ = window.CRV_ORG_RH_FAZ ? await window.CRV_ORG_RH_FAZ() : () => ''; } catch(_){ RHFAZ = () => ''; }
  DEPS = null;
}
const pode = () => !SNAP() && ehRH();   // toda a equipe do RH monta e altera o organograma
async function salvar(acao){
  const dados = { nos:CFG.nos, editores:CFG.editores || [], em:new Date().toISOString(), por:quem() };
  const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'sistema/org_crv', colecao:'sistema', doc_id:'org_crv', dados, atualizado_por:quem() }, { onConflict:'painel,caminho' });
  if (error) { toast('Não salvou: ' + traduzErro(error), true); throw error; }
  const id = new Date().toISOString().replace(/\D/g, '').slice(0, 17);
  try { await sb.from('registros').upsert({ painel:'quadro', caminho:'org_crv_hist/' + id, colecao:'org_crv_hist', doc_id:id, dados:{ nos:CFG.nos, em:dados.em, por:quem(), acao:acao || 'alteração' }, atualizado_por:quem() }, { onConflict:'painel,caminho' }); } catch(_){}
}
async function salvarFoto(k, img){ const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'org_foto/' + k, colecao:'org_foto', doc_id:k, dados:{ img, em:new Date().toISOString(), por:quem() }, atualizado_por:quem() }, { onConflict:'painel,caminho' }); if (error) throw error; if (img) FOTOS[k] = img; else delete FOTOS[k]; }
const fotoK = n => n.mat ? 'q:' + n.mat : 'c:' + n.id;
const pq = n => (n.mat && Q && Q.mapa) ? Q.mapa[n.mat] : null;
/* dados mostrados do cartão (com matrícula: o Quadro atual manda no nome, na função e na área) */
function info(n){ const S = SNAP(), x = S && S.info ? S.info[n.id] : null, p = pq(n);
  if (n.tipo === 'area') return { nome:n.nome, funcao:n.funcao || 'Área / Departamento', area:n.area || '', vinc:'', desl:false };
  if (n.mat) { const d = p || x || {}; const desl = x ? !!x.desl : (!p || p.situacao === 'Desligado');
    return { nome:tc(d.nome || n.nome), funcao:tc(d.funcao || n.funcao), area:tc(d.setor || n.area) + (d.area ? ' · ' + d.area : ''), adm:d.admissao || n.adm || '', vinc:'', desl, afast:d.situacao === 'Afastado' }; }
  return { nome:n.nome, funcao:n.funcao, area:n.area, vinc:n.vinculo || 'Externo', desl:false }; }
/* nome do departamento padronizado: grafias diferentes na base contam como o mesmo (ex.: "SEG. TRABALHO" = "SEGURANÇA DO TRABALHO") */
const ABREV = [[/\bSEG\b\.?/g, 'SEGURANCA'], [/\bMED\b\.?/g, 'MEDICINA'], [/\bADM\b\.?/g, 'ADMINISTRACAO'], [/\bADMINIST\b\.?/g, 'ADMINISTRACAO'], [/\bDEPTO?\b\.?/g, 'DEPARTAMENTO'], [/\bDP\b/g, 'DEPARTAMENTO PESSOAL'],
  [/\bGER\b\.?/g, 'GERENCIA'], [/\bMANUT\b\.?/g, 'MANUTENCAO'], [/\bALMOX\b\.?/g, 'ALMOXARIFADO'], [/\bPATRIM\b\.?/g, 'PATRIMONIAL'], [/\bTRAB\b\.?/g, 'TRABALHO'], [/\bQUALID\b\.?/g, 'QUALIDADE']];
const canon = s => { let t = N(s).replace(/[.\/\-_,;:()]+/g, ' '); ABREV.forEach(([r, v]) => t = t.replace(r, v)); return t.replace(/\b(DO|DA|DE|DOS|DAS|E)\b/g, ' ').replace(/\s+/g, ' ').trim(); };
/* departamentos do Quadro: por setor|departamento (k) e agrupados pelo nome padronizado (d:<nome>); guarda quem está ativo em cada um */
function deps(){ if (DEPS) return DEPS; const M = {}, G = {}; if (Q && Q.mapa) Object.entries(Q.mapa).forEach(([m, p]) => { if (!p || typeof p !== 'object' || p.situacao === 'Desligado' || !p.setor) return; const a = areaDe(p.area, p.setor, p.funcao) || ''; if (/^(Afastados|Desistentes)$/i.test(a)) return;
  const k = a + '|' + p.setor; const o = M[k] || (M[k] = { k, area:a, dep:p.setor, n:0, F:{}, P:[] }); const c = canon(p.setor), gk = 'd:' + c; const g = G[gk] || (G[gk] = { k:gk, dep:p.setor, var:{}, areas:{}, n:0, F:{}, P:[] });
  if (p.situacao === 'Ativo') { [o, g].forEach(x => { x.n++; x.F[p.funcao] = (x.F[p.funcao] || 0) + 1; x.P.push([m, p.funcao]); }); g.var[p.setor] = (g.var[p.setor] || 0) + 1; g.areas[a] = 1; } });
  Object.values(G).forEach(g => { g.dep = Object.entries(g.var).sort((x, y) => y[1] - x[1])[0]?.[0] || g.dep; });
  DEPS = Object.assign(M, G); return DEPS; }
/* quem tem cartão próprio no organograma não entra na contagem do departamento (não conta duas vezes; ex.: a própria cabeça) */
const comCartao = () => new Set(CFG.nos.filter(n => n.mat).map(n => String(n.mat)));
function qtd(n, _vis){ const q = n.qtd || {}; if (q.modo === 'manual') return { n:+q.n || 0, auto:false };
  const S = SNAP(); if ((q.modo === 'auto' || q.modo === 'soma') && S && S.cont && S.cont[n.id]) return { n:S.cont[n.id].n, auto:true, F:S.cont[n.id].F, soma:q.modo === 'soma', cab:S.cont[n.id].cab };
  if (q.modo === 'auto') { const D = deps(), F = {}, X = comCartao(), vis = new Set(); let t = 0;
    (q.deps || []).forEach(k => { const d = D[k]; if (!d) return; d.P.forEach(([m, f]) => { if (vis.has(m) || X.has(String(m))) return; vis.add(m); t++; F[f] = (F[f] || 0) + 1; }); }); return { n:t, auto:true, F, P:[...vis] }; }
  /* soma: cada cartão de pessoa ativa abaixo (as cabeças) + os colaboradores contados nos cartões abaixo */
  if (q.modo === 'soma') { const F = {}, P = []; let t = 0, cab = 0; _vis = _vis || new Set(); if (_vis.has(n.id)) return { n:0, auto:true, F, soma:true }; _vis.add(n.id);
    desc(n.id).forEach(id => { const c = byId(id); if (!c) return; const I = info(c);
      if (c.mat && !I.desl) { t++; cab++; P.push(String(c.mat)); const f = (pq(c) || {}).funcao || c.funcao || ''; F[f] = (F[f] || 0) + 1; }
      const qc = c.qtd && c.qtd.modo !== 'soma' ? qtd(c) : null; if (qc) { t += qc.n; (qc.P || []).forEach(m => P.push(m)); Object.entries(qc.F || {}).forEach(([f, v]) => F[f] = (F[f] || 0) + v); } });
    return { n:t, auto:true, F, soma:true, cab, P }; }
  return null; }
const byId = id => CFG.nos.find(n => n.id === id);
const raizes = () => CFG.nos.filter(n => !n.pai || !byId(n.pai)).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
const filhos = id => id ? CFG.nos.filter(n => n.pai === id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : raizes();
const desc = id => { const out = []; const rec = i => filhos(i).forEach(f => { out.push(f.id); rec(f.id); }); rec(id); return out; };
const ancest = id => { const out = []; let n = byId(id), g = 0; while (n && n.pai && byId(n.pai) && g++ < 200) { out.push(n.pai); n = byId(n.pai); } return out; };
const reordena = pai => filhos(pai).forEach((n, i) => n.ordem = i);

/* ---------- desenho em árvore ---------- */
const CW = 176, CH = 196, GX = 18, GY = 44;
function layout(rootsList){ const pos = {}, larg = {};
  const L = id => { if (larg[id] != null) return larg[id]; const F = VIS.fechados.has(id) ? [] : filhos(id); larg[id] = F.length ? Math.max(CW, F.reduce((t, f) => t + L(f.id), 0) + GX * (F.length - 1)) : CW; return larg[id]; };
  let maxY = 0; const pl = (n, x, d) => { const w = L(n.id); pos[n.id] = { x:x + (w - CW) / 2, y:d * (CH + GY) }; maxY = Math.max(maxY, d); if (VIS.fechados.has(n.id)) return;
    const F = filhos(n.id), tw = F.reduce((t, f) => t + L(f.id), 0) + GX * (F.length - 1); let cx = x + (w - tw) / 2; F.forEach(f => { pl(f, cx, d + 1); cx += L(f.id) + GX; }); };
  let x = 0; rootsList.forEach(r => { pl(r, x, 0); x += L(r.id) + GX * 2; });
  return { pos, W:Math.max(CW, x - GX * 2), H:(maxY + 1) * CH + maxY * GY }; }
const CSS = `.oc-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 10px}.oc-bar .sp{flex:1}.oc-bar input{flex:1;min-width:180px;max-width:340px;padding:9px 12px;border:1px solid #d0d5dd;border-radius:10px;font:inherit;font-size:14px;background:#fff}
.oc-z{display:inline-flex;border:1px solid #d0d5dd;border-radius:10px;overflow:hidden;background:#fff}.oc-z button{border:0;background:none;padding:7px 11px;font:inherit;font-weight:800;cursor:pointer;color:#14213d}.oc-z span{padding:7px 4px;font-size:12px;color:#5d6a85;min-width:42px;text-align:center}
.oc-wrap{background:var(--card,#fff);border:1px solid var(--line,#e4e7ec);border-top:4px solid #8e3b6a;border-radius:14px;padding:18px;overflow:auto;position:relative;min-height:260px}
.oc-area{position:relative;transform-origin:0 0}.oc-svg{position:absolute;left:0;top:0;pointer-events:none}
.oc-c{position:absolute;box-sizing:border-box;width:${CW}px;height:${CH}px;background:#fff;border:1px solid #e3e6ec;border-top:4px solid var(--c);border-radius:12px;padding:10px 8px 8px;text-align:center;cursor:pointer;box-shadow:0 2px 6px rgba(20,33,61,.06);transition:box-shadow .12s;display:flex;flex-direction:column;align-items:center}
.oc-c:hover{box-shadow:0 6px 16px rgba(20,33,61,.14)}.oc-c.hl{outline:3px solid #e9a23b;outline-offset:2px}.oc-c.dz{outline:3px dashed #2e7d4f;outline-offset:2px}.oc-c.ar{background:#f7faf8}
.oc-f{width:62px;height:62px;border-radius:50%;flex:0 0 auto;margin:0 auto 6px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:21px;border:3px solid #fff;box-shadow:0 0 0 2px var(--c)}
.oc-f img{width:100%;height:100%;object-fit:cover;display:block}.oc-f.ar{border-radius:14px;font-size:24px}
.oc-dp{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:var(--c);margin:-5px 0 4px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.oc-n{font-weight:800;font-size:12.5px;line-height:1.2;color:#14213d;max-height:30px;overflow:hidden}.oc-fu{font-size:11px;color:#5d6a85;margin-top:2px;line-height:1.2;max-height:27px;overflow:hidden}
.oc-sl{display:inline-block;margin-top:3px;background:#f1e8f8;color:#5a2d82;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:800}.oc-dl{display:inline-block;margin-top:3px;background:#fde8e6;color:#a3301c;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:800}
.oc-q{margin-top:auto;font-size:12px;font-weight:800;color:var(--c);background:color-mix(in srgb,var(--c) 10%,#fff);border-radius:99px;padding:2px 9px}
.oc-tg{position:absolute;bottom:-11px;left:50%;transform:translateX(-50%);border:1px solid #d0d5dd;background:#fff;border-radius:99px;font-size:10.5px;font-weight:800;color:#5d6a85;padding:1px 7px;cursor:pointer;z-index:2}
.oc-vz{text-align:center;color:#5d6a85;padding:30px 10px}
.oc-ov{position:fixed;inset:0;background:rgba(10,20,40,.5);z-index:95;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 10px}
.oc-m{background:#fff;border-radius:16px;width:min(640px,100%);box-shadow:0 20px 50px rgba(0,0,0,.3);max-height:calc(100vh - 48px);display:flex;flex-direction:column}
.oc-mh{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid #e4e7ec}.oc-mh h3{margin:0;flex:1;font-size:17px}.oc-mb{padding:16px 18px;overflow:auto}.oc-mf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 18px;border-top:1px solid #e4e7ec}
.oc-fm label{display:block;font-size:11.5px;font-weight:800;color:#5d6a85;text-transform:uppercase;letter-spacing:.03em;margin:10px 0 4px}.oc-fm input,.oc-fm select,.oc-fm textarea{width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid #d0d5dd;border-radius:9px;font:inherit;font-size:14px;background:#fff}
.oc-fm textarea{min-height:90px}.oc-ops{display:flex;gap:8px;flex-wrap:wrap}.oc-ops label{display:flex;gap:6px;align-items:center;text-transform:none;letter-spacing:0;font-size:13.5px;color:#14213d;font-weight:600;border:1px solid #d0d5dd;border-radius:9px;padding:7px 11px;margin:0;cursor:pointer}.oc-ops input{width:auto}
.oc-st{font-size:12.5px;color:#5d6a85;margin-top:4px}.oc-dps{max-height:220px;overflow:auto;border:1px solid #e4e7ec;border-radius:9px;padding:6px 8px;margin-top:6px}.oc-dps label{display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:#14213d;font-weight:500;margin:3px 0}.oc-dps input{width:auto}
.oc-tb{width:100%;border-collapse:collapse;font-size:13px}.oc-tb th{text-align:left;font-size:11px;text-transform:uppercase;color:#667085;padding:6px;border-bottom:2px solid #e4e7ec}.oc-tb td{padding:6px;border-top:1px solid #eef0f4}.oc-tb td.n{text-align:right;font-weight:800}
.oc-li{margin:4px 0 0;padding-left:18px}.oc-li li{margin:2px 0}
@media (max-width:760px){.oc-wrap{padding:10px}.oc-bar input{min-width:120px}}`;
function estilo(){ if (!document.getElementById('oc-css')) { const s = document.createElement('style'); s.id = 'oc-css'; s.textContent = CSS; document.head.appendChild(s); } }
const fotoHtml = n => { const I = info(n), k = fotoK(n); if (n.tipo === 'area') return '▦'; return FOTOS[k] ? `<img src="${FOTOS[k]}" alt="">` : esc(iniciais(I.nome)); };
const corN = n => n.tipo === 'area' ? COR.area : n.mat ? COR.pessoa : COR.externo;
function cartao(n, p){ const I = info(n), q = qtd(n), F = filhos(n.id), c = corN(n);
  return `<div class="oc-c ${n.tipo === 'area' ? 'ar' : ''}" data-id="${n.id}" ${pode() ? 'draggable="true"' : ''} style="--c:${c};left:${p.x}px;top:${p.y}px">
    ${n.dep ? `<div class="oc-dp" title="${esc(n.dep)}">${esc(n.dep)}</div>` : ''}<div class="oc-f ${n.tipo === 'area' ? 'ar' : ''}" style="background:${n.tipo === 'area' ? COR.area : corDe(n.id)}">${fotoHtml(n)}</div>
    <div class="oc-n">${esc(I.nome || '(sem nome)')}</div><div class="oc-fu">${esc(I.funcao || '')}</div>
    ${I.desl ? '<span class="oc-dl">Desligado – revisar</span>' : I.vinc ? `<span class="oc-sl">${esc(I.vinc)}</span>` : I.afast ? '<span class="oc-sl" style="background:#fff1d6;color:#7a5200">Afastado</span>' : ''}
    ${q ? `<span class="oc-q" ${q.auto ? `data-qf="${n.id}" title="${!SNAP() && ehRH() ? 'Ver quem são' : 'Ver por função'}"` : ''}>${colab(q.n)}</span>` : ''}
    ${F.length ? `<button class="oc-tg" data-tg="${n.id}" title="${VIS.fechados.has(n.id) ? 'Abrir' : 'Recolher'}">${VIS.fechados.has(n.id) ? '+ ' + F.length : '−'}</button>` : ''}</div>`; }
function arvoreHtml(roots){ const L = layout(roots); if (!roots.length) return '';
  const lin = []; CFG.nos.forEach(n => { const a = L.pos[n.pai], b = L.pos[n.id]; if (!a || !b || VIS.fechados.has(n.pai)) return; const x1 = a.x + CW / 2, y1 = a.y + CH, x2 = b.x + CW / 2, y2 = b.y, ym = y2 - GY / 2; lin.push([[x1, y1], [x1, ym], [x2, ym], [x2, y2]]); });
  const vis = CFG.nos.filter(n => L.pos[n.id]);
  return `<div class="oc-area" style="width:${L.W}px;height:${L.H + 14}px"><svg class="oc-svg" width="${L.W}" height="${L.H}">${lin.map(P => `<polyline points="${P.map(q => q.join(',')).join(' ')}" fill="none" stroke="#c3cad6" stroke-width="2"/>`).join('')}</svg>${vis.map(n => cartao(n, L.pos[n.id])).join('')}</div>`; }

/* ---------- tela ---------- */
async function tela(){
  estilo(); if (!VIS.z) VIS.z = window.innerWidth < 760 ? .6 : 1;
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Organograma CRV</h1><div class="ini-data">Montado pela Gestão de Pessoas: quem responde a quem, o que cada um faz e quantos colaboradores estão ligados</div></div></section><div id="oc-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  try { await ler(); } catch(e) { const c = $('#oc-corpo'); if (c) c.innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; return; }
  desenhar();
}
function desenhar(){
  const c = $('#oc-corpo'); if (!c) return; const P = pode(), R = raizes(), ndesl = CFG.nos.filter(n => n.mat && info(n).desl).length;
  c.innerHTML = `<div class="oc-bar">${P ? '<button class="btn prim" id="oc-add">+ Adicionar ao organograma</button>' : ''}<input id="oc-q" type="search" placeholder="Buscar nome ou função" value="${esc(VIS.q)}"><span class="oc-z"><button id="oc-zm" title="Diminuir">−</button><span>${Math.round(VIS.z * 100)}%</span><button id="oc-zp" title="Aumentar">+</button></span>
    <button class="btn borda" id="oc-ab">Abrir tudo</button><button class="btn borda" id="oc-fe">Recolher</button><span class="sp"></span>${P ? '<button class="btn borda" id="oc-hist">Versões</button>' : ''}${false ? '<button class="btn borda" id="oc-ed">Quem pode editar</button>' : ''}${!SNAP() && ehRH() ? '<button class="btn borda" id="oc-auto" title="Organograma montado sozinho pelo Quadro Geral">Visão pelo Quadro</button>' : ''}<button class="btn prim" id="oc-pdf">Imprimir / PDF</button></div>
    ${ndesl ? `<div style="background:#fde8e6;color:#8f1d12;border-radius:10px;padding:9px 12px;font-size:13px;margin:0 0 10px"><b>${ndesl} cartão(ões) com pessoa desligada no Quadro Geral.</b> Estão marcados "Desligado – revisar": troque a pessoa ou exclua o cartão.</div>` : ''}
    <div class="oc-wrap" id="oc-wrap">${R.length ? `<div id="oc-esc" style="width:0;height:0">${arvoreHtml(R)}</div>` : `<div class="oc-vz">${P ? 'Organograma vazio. Clique em <b>Adicionar ao organograma</b> para começar pelo topo (ex.: diretoria).' : 'O organograma ainda não foi montado.'}</div>`}</div>
    <p class="nr-fonte">${CFG.nos.length} cartões${totalTxt(R)}. ${P ? 'Arraste um cartão sobre outro do mesmo nível para mudar a ordem. ' : ''}Clique no cartão para ver a ficha${P ? ' e editar' : ''}.${CFG.em ? ' Última alteração em ' + new Date(CFG.em).toLocaleString('pt-BR') + (CFG.por ? ' por ' + esc(tc(CFG.por)) : '') + '.' : ''}</p>`;
  zoom(); ligar(c); if (VIS.q) busca(false);
}
/* total sem contar duas vezes: soma os cartões com número que não têm número em cima deles */
function total(roots){ let t = 0; const rec = n => { const q = qtd(n); if (q) { t += q.n; return; } filhos(n.id).forEach(rec); }; roots.forEach(rec); return t; }
const totalTxt = R => { const t = total(R); return t ? ' · ' + colab(t) + ' ligados' : ''; };
function zoom(){ const a = document.querySelector('#oc-esc .oc-area'), e = $('#oc-esc'); if (!a || !e) return; a.style.transform = `scale(${VIS.z})`; e.style.width = (parseFloat(a.style.width) * VIS.z) + 'px'; e.style.height = (parseFloat(a.style.height) * VIS.z) + 'px'; }
function ligar(c){
  const g = s => c.querySelector(s);
  if (g('#oc-add')) g('#oc-add').onclick = () => form(null);
  g('#oc-zm').onclick = () => { VIS.z = Math.max(.3, Math.round((VIS.z - .1) * 10) / 10); desenhar(); }; g('#oc-zp').onclick = () => { VIS.z = Math.min(1.6, Math.round((VIS.z + .1) * 10) / 10); desenhar(); };
  g('#oc-ab').onclick = () => { VIS.fechados.clear(); desenhar(); }; g('#oc-fe').onclick = () => { CFG.nos.forEach(n => { if (filhos(n.id).length && n.pai) VIS.fechados.add(n.id); }); desenhar(); };
  if (g('#oc-hist')) g('#oc-hist').onclick = versoes; if (g('#oc-ed')) g('#oc-ed').onclick = editores; if (g('#oc-auto')) g('#oc-auto').onclick = () => location.hash = '#/org-empresa-auto';
  g('#oc-pdf').onclick = escolherPDF;
  const q = g('#oc-q'); q.oninput = () => { VIS.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => busca(true), 300); };
  c.querySelectorAll('[data-tg]').forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.dataset.tg; VIS.fechados.has(id) ? VIS.fechados.delete(id) : VIS.fechados.add(id); desenhar(); });
  c.querySelectorAll('[data-qf]').forEach(b => b.onclick = e => { e.stopPropagation(); porFuncao(byId(b.dataset.qf)); });
  c.querySelectorAll('.oc-c[data-id]').forEach(el => { el.onclick = () => ficha(el.dataset.id);
    if (!pode()) return;
    el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', el.dataset.id); e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragover', e => { const de = c._arr; if (!de) return; e.preventDefault(); el.classList.add('dz'); });
    el.addEventListener('dragleave', () => el.classList.remove('dz'));
    el.addEventListener('dragenter', () => {});
    el.addEventListener('drop', async e => { e.preventDefault(); el.classList.remove('dz'); const de = e.dataTransfer.getData('text/plain'), para = el.dataset.id; if (!de || de === para) return;
      const a = byId(de), b = byId(para); if (!a || !b) return;
      if ((a.pai || '') !== (b.pai || '')) { toast('Para levar o cartão para outro lugar, abra a ficha e mude o "Ligado a".'); return; }
      const L = filhos(a.pai).filter(x => x.id !== de), i = L.findIndex(x => x.id === para), r = el.getBoundingClientRect(), depois = e.clientX > r.left + r.width / 2;
      L.splice(i + (depois ? 1 : 0), 0, a); L.forEach((x, j) => x.ordem = j); desenhar(); try { await salvar('ordem de ' + info(a).nome); } catch(_){} }); });
  c._arr = true;
}
function busca(rolar){ const t = N(VIS.q); document.querySelectorAll('.oc-c.hl').forEach(x => x.classList.remove('hl')); if (t.length < 2) return;
  const ach = CFG.nos.filter(n => { const I = info(n); return N(I.nome + ' ' + I.funcao + ' ' + I.area + ' ' + (n.dep || '')).includes(t); });
  let abriu = false; ach.forEach(n => ancest(n.id).forEach(a => { if (VIS.fechados.has(a)) { VIS.fechados.delete(a); abriu = true; } }));
  if (abriu) { desenhar(); return; }
  ach.forEach(n => { const el = document.querySelector(`.oc-c[data-id="${n.id}"]`); if (el) el.classList.add('hl'); });
  if (rolar) { const el = document.querySelector('.oc-c.hl'); if (el) el.scrollIntoView({ behavior:'smooth', block:'center', inline:'center' }); else toast('Nada encontrado.'); } }
function janela(tit, corpo, pe, larg){ const w = document.createElement('div'); w.className = 'oc-ov'; w.innerHTML = `<div class="oc-m" ${larg ? `style="width:min(${larg}px,100%)"` : ''}><div class="oc-mh"><h3>${tit}</h3><button class="btn borda peq" data-x>Fechar</button></div><div class="oc-mb">${corpo}</div><div class="oc-mf">${pe || ''}</div></div>`;
  document.body.appendChild(w); w.addEventListener('mousedown', e => { if (e.target === w) w.remove(); }); w.querySelectorAll('[data-x]').forEach(b => b.onclick = () => w.remove()); return w; }
function porFuncao(n){ if (!n) return; const q = qtd(n); if (!q || !q.auto) return; const F = Object.entries(q.F || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
  /* RH: com nomes (clicar na função filtra; clicar no nome abre o Perfil do Colaborador). Gestor (cópia): só a contagem por função */
  const com = !SNAP() && ehRH() && Q && Q.mapa && Array.isArray(q.P);
  const L = com ? q.P.map(m => { const p = Q.mapa[m] || {}; const d = Object.values(deps()).find(x => /^d:/.test(x.k) && x.P.some(y => y[0] === m)); return { m, nome:tc(p.nome || ''), fun:p.funcao || '', dep:tc(p.setor || ''), adm:p.admissao || '' }; }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) : [];
  const I0 = info(n); let filtro = '';
  const w = janela('Colaboradores ligados · ' + esc(I0.nome), `<p style="margin-top:0;color:#5d6a85;font-size:13px">${q.soma ? 'Todos abaixo deste cartão no organograma: as pessoas com cartão e os colaboradores dos departamentos delas.' : 'Ativos do Quadro Geral nos departamentos deste cartão (sem quem já tem cartão próprio no organograma).'}${com ? ' Clique numa função para filtrar e num nome para abrir o Perfil do Colaborador.' : ' Contagem por função.'}</p>
    <table class="oc-tb"><thead><tr><th>Função</th><th style="text-align:right">Pessoas</th></tr></thead><tbody>${F.map(([f, v]) => `<tr ${com ? `data-ff="${esc(f)}" style="cursor:pointer"` : ''}><td>${esc(tc(f))}</td><td class="n">${v}</td></tr>`).join('')}<tr><td><b>Total</b></td><td class="n">${q.n}</td></tr></tbody></table>
    ${com ? `<h4 style="margin:16px 0 6px;display:flex;gap:8px;align-items:center">Quem são <small id="oc-pfx" style="font-weight:600;color:#5d6a85"></small></h4><div id="oc-pl"></div>` : ''}
    ${q.soma ? '' : depsTxt(n)}`, com ? '<button class="btn borda" id="oc-px">Excel</button><button class="btn borda" id="oc-pp">PDF</button><span style="flex:1"></span>' : '', com ? 760 : 0);
  if (!com) return;
  const lista = () => L.filter(x => !filtro || x.fun === filtro);
  const des = () => { const A = lista(); w.querySelector('#oc-pfx').innerHTML = filtro ? `· ${esc(tc(filtro))} <button class="btn borda peq" id="oc-pfl">Ver todos</button>` : '';
    w.querySelector('#oc-pl').innerHTML = `<table class="oc-tb"><thead><tr><th>Nome</th><th>Matrícula</th><th>Função</th><th>Departamento</th></tr></thead><tbody>${A.map(x => `<tr><td><button class="link" data-pm="${esc(x.m)}" style="border:0;background:none;padding:0;color:#1f3a68;font:inherit;font-weight:700;cursor:pointer;text-align:left">${esc(x.nome)}</button></td><td>${esc(x.m)}</td><td>${esc(tc(x.fun))}</td><td>${esc(x.dep)}</td></tr>`).join('')}<tr><td colspan="3"><b>Total</b></td><td class="n">${A.length} ${A.length === 1 ? 'pessoa' : 'pessoas'}</td></tr></tbody></table>`;
    w.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => { document.querySelectorAll('.oc-ov').forEach(x => x.remove()); location.hash = '#/ficha/' + b.dataset.pm; });
    const vt = w.querySelector('#oc-pfl'); if (vt) vt.onclick = () => { filtro = ''; des(); };
    w.querySelectorAll('[data-ff]').forEach(r => r.style.background = r.dataset.ff === filtro ? '#eef8f1' : ''); };
  w.querySelectorAll('[data-ff]').forEach(r => r.onclick = () => { filtro = filtro === r.dataset.ff ? '' : r.dataset.ff; des(); });
  des();
  const nomeArq = () => 'Colaboradores ligados - ' + I0.nome + (filtro ? ' - ' + tc(filtro) : '');
  w.querySelector('#oc-px').onclick = () => { if (!window.XLSX) return toast('Excel indisponível agora.', true); const A = lista();
    const ws = XLSX.utils.aoa_to_sheet([['CRV Industrial · Gestão de Pessoas'], ['Colaboradores ligados · ' + I0.nome + (I0.funcao ? ' (' + I0.funcao + ')' : '') + (filtro ? ' · função ' + tc(filtro) : '')], [], ['Nome', 'Matrícula', 'Função', 'Departamento']].concat(A.map(x => [x.nome, x.m, tc(x.fun), x.dep]), [[], ['Total de pessoas', A.length]]));
    ws['!cols'] = [{ wch:40 }, { wch:11 }, { wch:38 }, { wch:34 }]; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores'); XLSX.writeFile(wb, nomeArq() + '.xlsx'); };
  w.querySelector('#oc-pp').onclick = async () => { const A = lista(), { jsPDF } = window.jspdf, D = window.CRV_DOC, doc = new jsPDF({ unit:'mm', format:'a4' });
    let y = D.titulo(doc, 'Colaboradores ligados · ' + I0.nome, (I0.funcao || '') + (filtro ? ' · função ' + tc(filtro) : '') + ' · ativos do Quadro Geral', 36);
    doc.autoTable(Object.assign(D.estilo(), { startY:y + 2, margin:{ top:D.margem.top, bottom:D.margem.bottom, left:12, right:12 }, head:[['Nome', 'Matrícula', 'Função', 'Departamento']], body:A.map(x => [x.nome, x.m, tc(x.fun), x.dep]), foot:[['Total de pessoas', String(A.length), '', '']] }));
    D.moldura(doc); try { if (window.CRV_PDF_LOGOS) await window.CRV_PDF_LOGOS(doc); } catch(_){} baixar(doc.output('blob'), nomeArq() + '.pdf'); }; }
/* departamentos escolhidos e os nomes da base agrupados em cada um */
function depsTxt(n){ const L = (n.qtd && n.qtd.deps) || []; if (!L.length || SNAP()) return ''; const D = deps();
  return `<div style="font-size:12px;color:#5d6a85;margin-top:10px"><b>Departamentos contados</b>${L.map(k => { const d = D[k];
    if (/^d:/.test(k)) { const V = d ? Object.keys(d.var) : []; return `<div style="margin-top:4px">• ${esc(tc(d ? d.dep : k.slice(2)))}${V.length > 1 ? ` <span style="color:#8a5a00">· nomes agrupados: ${V.map(v => esc(v)).join(' · ')}</span>` : ''}${d ? '' : ' <span style="color:#a3301c">(sem ativos hoje)</span>'}</div>`; }
    return `<div style="margin-top:4px">• ${esc(tc(k.split('|')[1]))} (${esc(k.split('|')[0])})</div>`; }).join('')}<div style="margin-top:4px;color:#8a94a8">Não entram na conta: afastados, desistentes e quem já tem cartão próprio no organograma (a própria cabeça, por exemplo).</div></div>`; }

/* ---------- ficha ---------- */
function ficha(id){ const n = byId(id); if (!n) return; const I = info(n), q = qtd(n), F = filhos(n.id), pai = byId(n.pai), P = pode();
  const oqRH = !n.oque && n.mat && !SNAP() ? RHFAZ('q:' + n.mat) : '';
  const oq = String(n.oque || oqRH || '').split(/\n+/).map(x => x.replace(/^[\s•\-*]+/, '').trim()).filter(Boolean);
  const w = janela(esc(I.nome || 'Cartão'), `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><div class="oc-f ${n.tipo === 'area' ? 'ar' : ''}" style="--c:${corN(n)};width:110px;height:110px;font-size:36px;background:${n.tipo === 'area' ? COR.area : corDe(n.id)}">${fotoHtml(n)}</div>
    <div><b style="font-size:16px">${esc(I.nome)}</b><br><span style="color:#5d6a85">${esc(I.funcao || '')}</span>${I.area ? `<br><small>${esc(I.area)}</small>` : ''}${I.desl ? '<br><span class="oc-dl">Desligado no Quadro Geral – revisar</span>' : I.vinc ? `<br><span class="oc-sl">${esc(I.vinc)}</span>` : ''}</div></div>
    <table class="oc-tb"><tbody>${n.mat ? `<tr><td>Matrícula</td><td><b>${esc(n.mat)}</b></td></tr>${I.adm ? `<tr><td>Admissão</td><td>${brD(I.adm)} · ${esc(tempoCasa(I.adm))} de casa</td></tr>` : ''}` : ''}
    ${n.tipo !== 'area' && !n.mat ? `<tr><td>Vínculo</td><td>${esc(n.vinculo || 'Externo')}${n.empresa ? ' · ' + esc(n.empresa) : ''}</td></tr>` : ''}
    <tr><td>Ligado a</td><td>${pai ? esc(info(pai).nome) + ' · ' + esc(info(pai).funcao || '') : '— (topo)'}</td></tr>
    <tr><td>Abaixo dele(a)</td><td>${F.map(f => esc(info(f).nome)).join(', ') || '—'}</td></tr>
    <tr><td>Colaboradores ligados</td><td>${q ? `<b ${q.auto ? 'id="oc-pfn" style="cursor:pointer;text-decoration:underline" title="Ver quem são"' : ''}>${colab(q.n)}</b> ${q.auto ? (q.soma ? '<small>(soma automática de tudo abaixo)</small>' : '<small>(automático pelo Quadro)</small>') + ' <button class="btn borda peq" id="oc-pf">' + (!SNAP() && ehRH() ? 'Ver quem são' : 'Por função') + '</button>' : '<small>(informado)</small>'}` : '—'}</td></tr></tbody></table>
    ${q && q.auto && !q.soma ? depsTxt(n) : q && q.soma ? `<p style="font-size:12px;color:#5d6a85;margin:8px 0 0">Soma automática: ${q.cab || 0} pessoa(s) com cartão abaixo + os colaboradores dos departamentos delas.</p>` : ''}
    ${oq.length ? `<h4 style="margin:14px 0 4px">O que faz${oqRH ? ' <small style="font-weight:600;color:#8a94a8">· do Organograma do RH</small>' : ''}</h4><ul class="oc-li">${oq.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`,
    P ? `<button class="btn prim" id="oc-e">Editar</button>${n.tipo !== 'area' ? `<button class="btn borda" id="oc-ft">${FOTOS[fotoK(n)] ? 'Trocar foto' : 'Adicionar foto'}</button>` : ''}<button class="btn borda" id="oc-l" title="Mover para a esquerda">◀ Mover</button><button class="btn borda" id="oc-r" title="Mover para a direita">Mover ▶</button><span style="flex:1"></span><button class="btn borda" id="oc-del" style="color:var(--coral,#c0392b)">Excluir</button>` : '');
  const g = s => w.querySelector(s);
  if (g('#oc-pf')) g('#oc-pf').onclick = () => porFuncao(n); if (g('#oc-pfn')) g('#oc-pfn').onclick = () => porFuncao(n);
  if (!P) return;
  g('#oc-e').onclick = () => { w.remove(); form(n); };
  if (g('#oc-ft')) g('#oc-ft').onclick = () => recortar(fotoK(n), () => { w.remove(); desenhar(); ficha(id); });
  const mover = async d => { const L = filhos(n.pai), i = L.indexOf(n), j = i + d; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; L.forEach((x, k) => x.ordem = k); desenhar(); try { await salvar('ordem de ' + I.nome); } catch(_){} };
  g('#oc-l').onclick = () => mover(-1); g('#oc-r').onclick = () => mover(1);
  g('#oc-del').onclick = () => { w.remove(); excluir(n); };
}
function excluir(n){ const F = filhos(n.id), I = info(n);
  const alvos = CFG.nos.filter(x => x.id !== n.id && !desc(n.id).includes(x.id));
  const w = janela('Excluir cartão', `<p style="margin-top:0">Excluir <b>${esc(I.nome)}</b> do organograma?</p>${F.length ? `<p style="font-size:13.5px">Este cartão tem <b>${F.length}</b> cartão(ões) ligado(s) abaixo (${F.map(f => esc(info(f).nome)).join(', ')}). Eles passam para:</p>
    <div class="oc-fm"><select id="oc-pp"><option value="${esc(n.pai || '')}">${n.pai && byId(n.pai) ? 'O mesmo de cima: ' + esc(info(byId(n.pai)).nome) : 'Ficam no topo'}</option>${alvos.filter(x => x.id !== (n.pai || '')).map(x => `<option value="${x.id}">${esc(info(x).nome)} · ${esc(info(x).funcao || '')}</option>`).join('')}<option value="">Ficam no topo</option></select></div>` : ''}
    <p style="font-size:12.5px;color:#5d6a85">Fica guardado em "Versões": dá para voltar se precisar.</p>`, '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oc-dok" style="background:#c0392b;border-color:#c0392b">Excluir</button>');
  w.querySelector('#oc-dok').onclick = async () => { const para = F.length ? w.querySelector('#oc-pp').value : ''; const base = filhos(para).length;
    F.forEach((f, i) => { f.pai = para; f.ordem = base + i; }); CFG.nos = CFG.nos.filter(x => x.id !== n.id); w.remove(); desenhar(); try { await salvar('excluiu ' + I.nome); toast('Cartão excluído.'); } catch(_){} }; }

/* ---------- adicionar / editar ---------- */
function form(n0){
  const n = n0 ? JSON.parse(JSON.stringify(n0)) : { id:novoId(), tipo:'pessoa', mat:'', nome:'', funcao:'', area:'', vinculo:'', empresa:'', oque:'', pai:'', qtd:{ modo:'' } };
  let modo = n.tipo === 'area' ? 'area' : (n.mat || !n0) ? 'mat' : 'ext'; if (!n0) modo = 'mat';
  const proib = new Set(n0 ? [n.id].concat(desc(n.id)) : []);
  const opPai = () => `<option value="">Sem ligação (fica no topo)</option>` + CFG.nos.filter(x => !proib.has(x.id)).map(x => { const I = info(x); return `<option value="${x.id}" ${n.pai === x.id ? 'selected' : ''}>${esc(I.nome)}${I.funcao ? ' · ' + esc(I.funcao) : ''}</option>`; }).join('');
  const D0 = deps(), D = Object.values(D0).filter(d => /^d:/.test(d.k)).sort((a, b) => a.dep.localeCompare(b.dep, 'pt-BR'));
  const selD = new Set(((n.qtd && n.qtd.deps) || []).map(k => /^d:/.test(k) ? k : 'd:' + canon(String(k).split('|')[1] || '')));
  const w = janela(n0 ? 'Editar cartão' : 'Adicionar ao organograma', `<div class="oc-fm">
    <label>Tipo de cartão</label><div class="oc-ops"><label><input type="radio" name="oc-t" value="mat" ${modo === 'mat' ? 'checked' : ''}> Pessoa com matrícula</label><label><input type="radio" name="oc-t" value="ext" ${modo === 'ext' ? 'checked' : ''}> Pessoa sem matrícula</label><label><input type="radio" name="oc-t" value="area" ${modo === 'area' ? 'checked' : ''}> Área / Departamento</label></div>
    <div id="oc-bm"><label>Matrícula</label><input id="oc-mat" inputmode="numeric" value="${esc(n.mat || '')}" placeholder="Digite a matrícula"><div class="oc-st" id="oc-ms"></div></div>
    <div id="oc-be"><label id="oc-ln">Nome</label><input id="oc-nm" value="${esc(n.mat ? '' : n.nome || '')}"><label id="oc-lf">Cargo / função</label><input id="oc-fn" value="${esc(n.mat ? '' : n.funcao || '')}">
      <label>Área</label><input id="oc-ar" value="${esc(n.mat ? '' : n.area || '')}"><div id="oc-bv"><label>Vínculo (aparece no selo do cartão)</label><input id="oc-vi" value="${esc(n.vinculo || '')}" placeholder="Externo, Diretoria, Consultor, Prestador…"><label>Empresa</label><input id="oc-em" value="${esc(n.empresa || '')}" placeholder="Se for de outra empresa"></div></div>
    <label>Departamento no cartão <small style="text-transform:none;font-weight:600">· aparece no alto do cartão (opcional)</small></label><input id="oc-dpl" value="${esc(n.dep || '')}" placeholder="Ex.: Segurança do Trabalho">
    <label>O que faz <small style="text-transform:none;font-weight:600">· um tópico por linha</small></label>${n.mat && RHFAZ('q:' + n.mat) ? '<div class="oc-st" style="margin:-2px 0 4px">Em branco = usa o que está no Organograma do RH para esta pessoa (atualiza junto).</div>' : ''}<textarea id="oc-oq" placeholder="${n.mat && RHFAZ('q:' + n.mat) ? esc(RHFAZ('q:' + n.mat)) : 'Ex.: Aprova as admissões&#10;Acompanha os indicadores da área'}">${esc(n.oque || '')}</textarea>
    <label>Ligado a (a quem responde)</label><select id="oc-pai">${opPai()}</select>
    <label>Colaboradores ligados</label><div class="oc-ops"><label><input type="radio" name="oc-q" value="" ${!n.qtd || !n.qtd.modo ? 'checked' : ''}> Não mostrar</label><label><input type="radio" name="oc-q" value="manual" ${n.qtd && n.qtd.modo === 'manual' ? 'checked' : ''}> Manual</label><label><input type="radio" name="oc-q" value="auto" ${n.qtd && n.qtd.modo === 'auto' ? 'checked' : ''}> Automático pelos departamentos</label><label><input type="radio" name="oc-q" value="soma" ${n.qtd && n.qtd.modo === 'soma' ? 'checked' : ''}> Soma de tudo abaixo</label></div>
    <div class="oc-st" id="oc-qs" style="display:none">Soma automática: cada pessoa com cartão abaixo deste + os colaboradores dos departamentos delas. Atualiza a cada importação do Quadro.</div>
    <div id="oc-qm"><input id="oc-qn" type="number" min="0" value="${esc(n.qtd && n.qtd.n != null ? n.qtd.n : '')}" placeholder="Número de colaboradores" style="margin-top:6px"></div>
    <div id="oc-qa"><input id="oc-dq" type="search" placeholder="Filtrar departamentos" style="margin-top:6px"><div class="oc-dps" id="oc-dl">${D.map(d => { const V = Object.keys(d.var); return `<label data-q="${esc(N(V.join(' ') + ' ' + Object.keys(d.areas).join(' ')))}"><input type="checkbox" value="${esc(d.k)}" ${selD.has(d.k) ? 'checked' : ''}> ${esc(tc(d.dep))} <small style="color:#8a94a8">· ${esc(Object.keys(d.areas).join(', '))} · ${d.n}${V.length > 1 ? ' · agrupa: ' + esc(V.join(' / ')) : ''}</small></label>`; }).join('') || '<small>Carregue o Quadro Geral para escolher os departamentos.</small>'}</div><div class="oc-st" id="oc-qt"></div></div>
    </div>`, '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oc-ok">Salvar</button>', 680);
  const g = s => w.querySelector(s);
  const vis = () => { modo = (w.querySelector('[name=oc-t]:checked') || {}).value || 'mat'; g('#oc-bm').style.display = modo === 'mat' ? '' : 'none'; g('#oc-be').style.display = modo === 'mat' ? 'none' : ''; g('#oc-bv').style.display = modo === 'ext' ? '' : 'none';
    g('#oc-ln').textContent = modo === 'area' ? 'Nome da área / departamento' : 'Nome'; g('#oc-lf').textContent = modo === 'area' ? 'Descrição curta (opcional)' : 'Cargo / função';
    const qm = (w.querySelector('[name=oc-q]:checked') || {}).value || ''; g('#oc-qm').style.display = qm === 'manual' ? '' : 'none'; g('#oc-qa').style.display = qm === 'auto' ? '' : 'none'; g('#oc-qs').style.display = qm === 'soma' ? '' : 'none'; somaQ(); };
  const somaQ = () => { const ks = [...w.querySelectorAll('#oc-dl input:checked')].map(i => i.value), Dm = deps(); const t = ks.reduce((s, k) => s + ((Dm[k] || {}).n || 0), 0); g('#oc-qt').textContent = ks.length ? ks.length + ' departamento(s) · ' + colab(t) + ' ativos hoje (quem tem cartão próprio no organograma, como a própria cabeça, não entra na conta)' : 'Escolha um ou mais departamentos.'; };
  const mostraMat = () => { const m = g('#oc-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); const p = m && Q && Q.mapa ? Q.mapa[m] : null;
    g('#oc-ms').innerHTML = !m ? 'Ao digitar, os dados vêm do Quadro Geral.' : p ? `<b>${esc(tc(p.nome))}</b> · ${esc(tc(p.funcao))} · ${esc(tc(p.setor))} · ${esc(p.area || '')} · admissão ${brD(p.admissao)}${p.situacao === 'Desligado' ? ' · <b style="color:#a3301c">desligado</b>' : ''}` : '<span style="color:#a3301c">Matrícula não encontrada no Quadro Geral.</span>';
    if (p && CFG.nos.some(x => x.mat === m && x.id !== n.id)) g('#oc-ms').innerHTML += '<br><span style="color:#8a5a00">Essa pessoa já está no organograma.</span>'; };
  w.querySelectorAll('[name=oc-t],[name=oc-q]').forEach(r => r.onchange = vis); g('#oc-mat').oninput = mostraMat; w.querySelectorAll('#oc-dl input').forEach(i => i.onchange = somaQ);
  g('#oc-dq').oninput = e => { const t = N(e.target.value); w.querySelectorAll('#oc-dl label').forEach(l => l.style.display = !t || l.dataset.q.includes(t) ? '' : 'none'); };
  vis(); if (modo === 'mat') mostraMat();
  g('#oc-ok').onclick = async () => { const qm = (w.querySelector('[name=oc-q]:checked') || {}).value || '';
    if (modo === 'mat') { const m = g('#oc-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); const p = m && Q && Q.mapa ? Q.mapa[m] : null; if (!p) return toast('Digite uma matrícula que esteja no Quadro Geral.', true);
      Object.assign(n, { tipo:'pessoa', mat:m, nome:p.nome, funcao:p.funcao, area:p.setor, adm:p.admissao, vinculo:'', empresa:'' }); }
    else { const nm = g('#oc-nm').value.trim(); if (!nm) return toast('Preencha o nome.', true);
      Object.assign(n, { tipo:modo === 'area' ? 'area' : 'pessoa', mat:'', adm:'', nome:nm, funcao:g('#oc-fn').value.trim(), area:g('#oc-ar').value.trim(), vinculo:modo === 'ext' ? (g('#oc-vi').value.trim() || 'Externo') : '', empresa:modo === 'ext' ? g('#oc-em').value.trim() : '' }); }
    n.oque = g('#oc-oq').value.trim(); n.dep = g('#oc-dpl').value.trim();
    const novoPai = g('#oc-pai').value; if (novoPai !== (n.pai || '')) { n.pai = novoPai; n.ordem = filhos(novoPai).length; } else if (!n0) n.ordem = filhos(novoPai).length;
    n.qtd = qm === 'manual' ? { modo:'manual', n:Math.max(0, parseInt(g('#oc-qn').value, 10) || 0) } : qm === 'auto' ? { modo:'auto', deps:[...w.querySelectorAll('#oc-dl input:checked')].map(i => i.value) } : qm === 'soma' ? { modo:'soma' } : { modo:'' };
    if (qm === 'auto' && !n.qtd.deps.length) return toast('Escolha ao menos um departamento para a contagem automática.', true);
    const i = CFG.nos.findIndex(x => x.id === n.id); if (i >= 0) CFG.nos[i] = n; else CFG.nos.push(n);   // os ligados abaixo vão junto (continuam ligados a este cartão)
    const bt = g('#oc-ok'); bt.disabled = true; bt.textContent = 'Salvando…';
    try { await salvar((n0 ? 'editou ' : 'adicionou ') + (n.nome || '')); w.remove(); ancest(n.id).forEach(a => VIS.fechados.delete(a)); desenhar(); toast('Salvo.'); } catch(_){ bt.disabled = false; bt.textContent = 'Salvar'; } };
}
/* foto: só recortar/enquadrar no círculo (arrastar e aproximar); a imagem não é alterada */
function recortar(k, depois){ const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const url = URL.createObjectURL(f), im = new Image(); im.onload = () => {
    const T = 280, w = janela('Enquadrar a foto', `<p style="margin-top:0;font-size:13px;color:#5d6a85">Arraste a foto e use o controle para aproximar até o rosto ficar no círculo. A foto não é alterada, só recortada.</p><canvas id="oc-cv" width="${T}" height="${T}" style="display:block;margin:0 auto;border-radius:50%;cursor:grab;touch-action:none;background:#eef1f6"></canvas><input type="range" id="oc-zz" min="1" max="4" step="0.01" value="1" style="width:100%;margin-top:10px">`,
      `${FOTOS[k] ? '<button class="btn borda" id="oc-fx">Tirar a foto atual</button>' : ''}<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oc-fok">Salvar foto</button>`);
    const cv = w.querySelector('#oc-cv'), ctx = cv.getContext('2d'), base = Math.max(T / im.width, T / im.height); let z = 1, ox = 0, oy = 0, dr = null;
    const lim = () => { const s = base * z, mw = (im.width * s - T) / 2, mh = (im.height * s - T) / 2; ox = Math.max(-mw, Math.min(mw, ox)); oy = Math.max(-mh, Math.min(mh, oy)); };
    const pinta = () => { lim(); const s = base * z; ctx.clearRect(0, 0, T, T); ctx.drawImage(im, (T - im.width * s) / 2 + ox, (T - im.height * s) / 2 + oy, im.width * s, im.height * s); }; pinta();
    const pt = e => { const t = e.touches ? e.touches[0] : e; return [t.clientX, t.clientY]; };
    const ini = e => { e.preventDefault(); dr = pt(e); }, mov = e => { if (!dr) return; const p = pt(e); ox += p[0] - dr[0]; oy += p[1] - dr[1]; dr = p; pinta(); }, fim = () => { dr = null; };
    cv.addEventListener('mousedown', ini); cv.addEventListener('touchstart', ini, { passive:false }); window.addEventListener('mousemove', mov); cv.addEventListener('touchmove', e => { e.preventDefault(); mov(e); }, { passive:false }); window.addEventListener('mouseup', fim); cv.addEventListener('touchend', fim);
    w.querySelector('#oc-zz').oninput = e => { z = +e.target.value; pinta(); };
    const fx = w.querySelector('#oc-fx'); if (fx) fx.onclick = async () => { try { await salvarFoto(k, ''); w.remove(); depois && depois(); } catch(e) { toast(traduzErro(e), true); } };
    w.querySelector('#oc-fok').onclick = async () => { const o = document.createElement('canvas'); o.width = o.height = 320; const s = base * z * (320 / T); o.getContext('2d').drawImage(im, (320 - im.width * s) / 2 + ox * 320 / T, (320 - im.height * s) / 2 + oy * 320 / T, im.width * s, im.height * s);
      try { await salvarFoto(k, o.toDataURL('image/jpeg', .88)); window.removeEventListener('mousemove', mov); window.removeEventListener('mouseup', fim); w.remove(); URL.revokeObjectURL(url); toast('Foto salva.'); depois && depois(); } catch(e) { toast(traduzErro(e), true); } }; };
    im.src = url; }; inp.click(); }

/* ---------- versões e editores ---------- */
async function versoes(){ const w = janela('Versões do organograma', '<div id="oc-vl"><div class="spinner" style="margin:10px auto"></div></div>', '', 640);
  let L = []; try { const { data } = await sb.from('registros').select('doc_id,dados').eq('painel', 'quadro').eq('colecao', 'org_crv_hist').order('doc_id', { ascending:false }).limit(60); L = data || []; } catch(_){}
  const box = w.querySelector('#oc-vl'); if (!L.length) { box.innerHTML = '<p>Nenhuma versão guardada ainda.</p>'; return; }
  box.innerHTML = `<p style="margin-top:0;font-size:13px;color:#5d6a85">Cada mudança salva guarda uma versão. Ao voltar a uma versão, o organograma fica igual a ela (e isso também vira uma versão nova).</p><table class="oc-tb"><thead><tr><th>Quando</th><th>O quê</th><th>Cartões</th><th></th></tr></thead><tbody>${L.map((r, i) => `<tr><td>${esc(new Date(r.dados.em).toLocaleString('pt-BR'))}<br><small>${esc(tc(r.dados.por || ''))}</small></td><td>${esc(r.dados.acao || '')}</td><td>${(r.dados.nos || []).length}</td><td>${i ? `<button class="btn borda peq" data-v="${i}">Voltar a esta</button>` : '<small>atual</small>'}</td></tr>`).join('')}</tbody></table>`;
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = async () => { const r = L[+b.dataset.v]; if (!confirm('Voltar o organograma para a versão de ' + new Date(r.dados.em).toLocaleString('pt-BR') + '?')) return;
    CFG.nos = JSON.parse(JSON.stringify(r.dados.nos || [])); try { await salvar('voltou à versão de ' + new Date(r.dados.em).toLocaleString('pt-BR')); w.remove(); desenhar(); toast('Versão restaurada.'); } catch(_){} }); }
async function editores(){ let U = []; try { const { data } = await sb.from('perfis').select('user_id,nome,papel,ativo').eq('papel', 'rh'); U = (data || []).filter(u => u.ativo !== false).sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')); } catch(_){}
  const S = new Set(CFG.editores || []);
  const w = janela('Quem pode editar o Organograma CRV', `<p style="margin-top:0;font-size:13px;color:#5d6a85">A administradora sempre edita. Marque quem da equipe do RH também pode adicionar, editar, mover e excluir cartões. Os demais só visualizam e imprimem.</p>${U.map(u => `<label style="display:flex;gap:8px;align-items:center;padding:6px 0"><input type="checkbox" value="${esc(u.user_id)}" ${S.has(u.user_id) ? 'checked' : ''}> ${esc(tc(u.nome))}</label>`).join('') || '<p>Nenhum usuário da equipe RH.</p>'}`,
    '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oc-eok">Salvar</button>');
  w.querySelector('#oc-eok').onclick = async () => { CFG.editores = [...w.querySelectorAll('input:checked')].map(i => i.value); try { await salvar('editores'); w.remove(); toast('Salvo.'); } catch(_){} }; }

/* ---------- PDF: completo ou a partir de um cartão ---------- */
function escolherPDF(){ const ops = CFG.nos.filter(n => filhos(n.id).length).map(n => `<option value="${n.id}">${esc(info(n).nome)} · ${esc(info(n).funcao || '')}</option>`).join('');
  const w = janela('Imprimir / Gerar PDF', `<div class="oc-fm"><label>O que imprimir</label><select id="oc-pp"><option value="">Organograma completo</option>${ops}</select><p class="oc-st">Escolha um cartão para imprimir só ele e quem está abaixo (ex.: uma gerência).</p></div>`, '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oc-pg">Gerar PDF</button>');
  w.querySelector('#oc-pg').onclick = async () => { const b = w.querySelector('#oc-pg'); b.disabled = true; b.textContent = 'Gerando…'; try { await pdf(w.querySelector('#oc-pp').value); w.remove(); } catch(e) { b.disabled = false; b.textContent = 'Gerar PDF'; toast('Não consegui gerar o PDF: ' + e.message, true); } }; }
async function pdf(rootId){
  const { jsPDF } = window.jspdf, Dc = window.CRV_DOC, C = Dc ? Dc.cores : { NAVY:[31,58,104], INK:[30,36,48], MUT:[110,116,128] };
  const roots = rootId ? [byId(rootId)] : raizes(); const fech = VIS.fechados; VIS.fechados = new Set(); const L = layout(roots); VIS.fechados = fech;
  const ids = rootId ? [rootId].concat(desc(rootId)) : CFG.nos.map(n => n.id), NN = ids.map(byId).filter(Boolean);
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  let fmt = 'a4', doc, W, H, s; for (const f of ['a4', 'a3']) { doc = new jsPDF({ unit:'mm', format:f, orientation:'landscape' }); W = doc.internal.pageSize.getWidth(); H = doc.internal.pageSize.getHeight(); s = Math.min((W - 24) / L.W, (H - 76) / L.H, .42); fmt = f; if (s >= .2) break; }
  const tit = rootId ? 'Organograma CRV · ' + info(byId(rootId)).nome : 'Organograma CRV';
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...C.NAVY); doc.text(tit, 12, 32);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.INK); const hj = new Date(); doc.text('Capinópolis/MG, ' + hj.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }) + ' · montado pela Gestão de Pessoas', 12, 37);
  const ox = (W - L.W * s) / 2, oy = 42, P = (x, y) => [ox + x * s, oy + y * s];
  doc.setDrawColor(195, 202, 214); doc.setLineWidth(.35);
  NN.forEach(n => { const a = L.pos[n.pai], b = L.pos[n.id]; if (!a || !b || !ids.includes(n.pai)) return; const [x1, y1] = P(a.x + CW / 2, a.y + CH), [x2, y2] = P(b.x + CW / 2, b.y), ym = y2 - GY * s / 2; doc.line(x1, y1, x1, ym); doc.line(x1, ym, x2, ym); doc.line(x2, ym, x2, y2); });
  const fs = Math.max(4, Math.min(9, 34 * s));
  NN.forEach(n => { const p = L.pos[n.id]; if (!p) return; const I = info(n), q = qtd(n), [x, y] = P(p.x, p.y), w = CW * s, h = CH * s, c = hex(corN(n));
    doc.setFillColor(255, 255, 255); doc.setDrawColor(227, 230, 236); doc.setLineWidth(.25); doc.roundedRect(x, y, w, h, 1.6, 1.6, 'FD'); doc.setFillColor(...c); doc.rect(x, y, w, Math.max(.6, 4 * s), 'F');
    const r = 31 * s, cx = x + w / 2, cy = y + 41 * s;
    const img = n.tipo !== 'area' && FOTOS[fotoK(n)];
    if (img) { try { doc.addImage(img, 'JPEG', cx - r, cy - r, 2 * r, 2 * r); } catch(_){} } else { doc.setFillColor(...(n.tipo === 'area' ? hex(COR.area) : hex(corDe(n.id)))); doc.circle(cx, cy, r, 'F'); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(r * 2.3); doc.text(n.tipo === 'area' ? '' : iniciais(I.nome), cx, cy + r * .38, { align:'center' }); }
    doc.setDrawColor(...c); doc.setLineWidth(.4); doc.circle(cx, cy, r, 'S');
    if (n.dep) { doc.setFont('helvetica', 'bold'); doc.setFontSize(fs * .72); doc.setTextColor(...c); doc.text(doc.splitTextToSize(String(n.dep).toUpperCase(), w - 2)[0], cx, y + 8.5 * s, { align:'center' }); }
    let ty = cy + r + fs * .55; doc.setTextColor(...C.INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(fs); doc.splitTextToSize(I.nome || '', w - 2).slice(0, 2).forEach(l => { doc.text(l, cx, ty, { align:'center' }); ty += fs * .42; });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(fs * .85); doc.setTextColor(...C.MUT); doc.splitTextToSize(I.funcao || '', w - 2).slice(0, 2).forEach(l => { doc.text(l, cx, ty, { align:'center' }); ty += fs * .36; });
    const selo = I.desl ? 'Desligado – revisar' : I.vinc; if (selo) { doc.setFontSize(fs * .78); doc.setTextColor(...(I.desl ? [163, 48, 28] : [90, 45, 130])); doc.text(selo, cx, ty + fs * .1, { align:'center' }); }
    if (q) { doc.setFont('helvetica', 'bold'); doc.setFontSize(fs * .9); doc.setTextColor(...c); doc.text(colab(q.n), cx, y + h - fs * .25, { align:'center' }); } });
  const t = total(roots), np = NN.filter(n => n.tipo !== 'area').length; doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.INK);
  doc.text(`Total: ${np} ${np === 1 ? 'pessoa' : 'pessoas'} no organograma` + (t ? ` · ${colab(t)} ligados` : ''), 12, H - 25);
  if (Dc && Dc.moldura) Dc.moldura(doc, '');
  try { if (window.CRV_PDF_LOGOS) await window.CRV_PDF_LOGOS(doc); } catch(_){}
  baixar(doc.output('blob'), (rootId ? 'Organograma CRV - ' + info(byId(rootId)).nome : 'Organograma CRV') + '.pdf');
}

/* cópia para gestor/assistente (gerada pelo administrador): cartões, fotos, contagens e dados do Quadro de quem tem matrícula */
async function snapshot(){ window.CRV_ORG_SNAP = null; await ler(); if (!CFG.nos.length) return null;
  const fotos = {}, cont = {}, inf = {}; CFG.nos.forEach(n => { const k = fotoK(n); if (FOTOS[k]) fotos[k] = FOTOS[k]; const q = qtd(n); if (q && q.auto) cont[n.id] = { n:q.n, F:q.F, cab:q.cab };
    if (n.mat) { const p = pq(n); inf[n.id] = p ? { nome:p.nome, funcao:p.funcao, setor:p.setor, area:p.area, admissao:p.admissao, situacao:p.situacao, desl:p.situacao === 'Desligado' } : { desl:true }; } });
  const nos = CFG.nos.map(n => !n.oque && n.mat && RHFAZ('q:' + n.mat) ? Object.assign({}, n, { oque:RHFAZ('q:' + n.mat) }) : n);
  return { nos, fotos, cont, info:inf, em:new Date().toISOString() }; }

return { tela, snapshot };
};
