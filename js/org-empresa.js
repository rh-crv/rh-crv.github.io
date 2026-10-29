/* =====================================================================
   ORGANOGRAMA DA EMPRESA (toda a CRV) — mesmo padrão visual do Organograma do RH
   · Monta sozinho a partir do Quadro Geral (só ATIVOS; afastados contados à parte), por SETOR (coluna Setor) e DEPARTAMENTO.
     A coluna de gerência da base não é usada (desatualizada).
   · Lideranças (função que contém diretor, gerente, coordenador, supervisor ou encarregado) em cartões com nome, função e foto
     (a mesma foto do Organograma do RH: só recortada, nada alterado; sem foto = iniciais).
   · Demais funções sem nomes: blocos por função com a quantidade, ligados ao departamento e à liderança responsável.
   · Quem responde a quem: definido pela RH em "Definir lideranças" (registros do Quadro, caminho 'sistema/org_empresa'):
     dep['Setor|Departamento'] = matrícula da liderança responsável; chefe[matrícula] = matrícula de quem ela responde ('-' = topo).
     Sem definição: departamento com uma única liderança dentro dele → ela (automático); senão "Liderança a definir".
   ===================================================================== */
window.CRV_OE_INIT = function(X){
'use strict';
const { sb, E, $, esc, moldura, toast, traduzErro, ehRH, ehAdmin, baixar } = X;
const quem = () => (E.perfil && E.perfil.nome) || '';
const N = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const tc = s => String(s || '').toLowerCase().replace(/(^|[\s\/(.-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Dos|Das|E|Em) /g, m => m.toLowerCase())
  .replace(/\b(Ii|Iii|Iv|Vi|Vii|Viii|Rh|Crv|Ctt|Ti|Pcm|Coa|Adm|Sgi|Sesmt|Cct|Mg)\b/gi, m => m.toUpperCase()).replace(/\((A|O|As|Os)\)/g, m => m.toLowerCase());
const iniciais = n => String(n || '?').split(/\s+/).filter(w => w.length > 2 || /^[A-Z]/.test(w)).filter(Boolean).slice(0, 1).concat(String(n || '').split(/\s+/).filter(Boolean).slice(-1)).map(w => w[0]).join('').toUpperCase().slice(0, 2);
const pessoas = n => n + (n === 1 ? ' pessoa' : ' pessoas');
const NIVEIS = [ { n:'Diretoria', c:'#16284d' }, { n:'Gerência', c:'#1f3a68' }, { n:'Coordenação', c:'#2e7d4f' }, { n:'Supervisão e encarregados', c:'#b5731a' } ];
const nivelDe = f => { const t = N(f); return /\bDIRETOR\b/.test(t) ? 0 : /\bGERENT|\bGERENC/.test(t) ? 1 : /\bCOORD/.test(t) ? 2 : /\bSUPERV|\bENCARREG/.test(t) ? 3 : -1; };
/* cores dos setores: as frentes do app, sem uma cor só nem excesso de azul */
const PALETA = ['#2e7d4f', '#b5731a', '#7b3fa0', '#1d7a88', '#a3485a', '#5a6e1f', '#c0583f', '#3f5fa8', '#8a6a1d', '#16807a', '#8e3b6a', '#4a6b2a'];
const corDe = k => { let h = 0; for (const ch of String(k)) h = (h * 31 + ch.charCodeAt(0)) % 9973; return ['#24427c', '#2e8a57', '#c47f1a', '#d4573f', '#16807a', '#8e3b6a', '#5a4fb0', '#2f6fa8'][h % 8]; };
const fora = a => /^(AFASTADOS|DESISTENTES)$/.test(N(a));
const areaDe = (a, d, f) => (window.CRV_AREA && window.CRV_AREA.areaDe) ? window.CRV_AREA.areaDe(a, d, f) : a;

let CFG = { dep:{}, chefe:{} }, FOTOS = {}, B = null, VIS = { setor:'', q:'' };

const SNAP = () => window.CRV_ORG_SNAP && window.CRV_ORG_SNAP.emp;   /* gestor/assistente: cópia gerada pelo administrador (só leitura) */
async function lerCfg(){ if (SNAP()) { CFG = Object.assign({ dep:{}, chefe:{} }, SNAP().cfg || {}); return; } try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/org_empresa').maybeSingle();
  CFG = Object.assign({ dep:{}, chefe:{} }, (data && data.dados) || {}); } catch(_){ CFG = { dep:{}, chefe:{} }; } }
async function salvarCfg(){ const dados = Object.assign({}, CFG, { em:new Date().toISOString(), por:quem() });
  const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'sistema/org_empresa', colecao:'sistema', doc_id:'org_empresa', dados, atualizado_por:quem() }, { onConflict:'painel,caminho' }); if (error) throw error; }
async function lerFotos(){ FOTOS = {}; if (SNAP()) { FOTOS = Object.assign({}, SNAP().fotos || {}); return; } try { const { data } = await sb.from('registros').select('doc_id,dados').eq('painel', 'quadro').eq('colecao', 'org_foto'); (data || []).forEach(r => { if (r.dados && r.dados.img) FOTOS[r.doc_id] = r.dados.img; }); } catch(_){} }
async function salvarFoto(k, img){ const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'org_foto/' + k, colecao:'org_foto', doc_id:k, dados:{ img, em:new Date().toISOString(), por:quem() }, atualizado_por:quem() }, { onConflict:'painel,caminho' }); if (error) throw error; if (img) FOTOS[k] = img; else delete FOTOS[k]; }

/* ---------- base: Quadro Geral atual (atualiza sozinha a cada importação) ---------- */
async function montar(){
  const Q = SNAP() ? { mapa:SNAP().mapa || {}, referencia:SNAP().ref || '' } : window.CRV_QUADRO ? await window.CRV_QUADRO() : null; if (!Q || !Q.mapa) throw new Error('Carregue o Quadro Geral para montar o organograma.');
  let HOR = {}; if (SNAP()) HOR = SNAP().hor || {}; else { try { const d = await window.CRV_DADOS('quadro'); HOR = (d && d.dados && d.dados.HOR) || {}; } catch(_){} }
  const turno = m => { const h = HOR[m]; return h && h[0] && h[1] ? h[0] + ' às ' + h[1] : ''; };
  const ATV = [], AFD = [];
  Object.entries(Q.mapa).forEach(([m, p]) => { if (p.situacao === 'Desligado') return;
    const o = { m, nome:p.nome || '', funcao:p.funcao || '', area:areaDe(p.area, p.setor, p.funcao) || '', dep:p.setor || '(sem departamento)', hor:turno(m), sit:p.situacao };
    if (p.situacao === 'Afastado' || fora(o.area)) AFD.push(o); else ATV.push(o); });
  // afastados: o Quadro põe setor e departamento "Afastados" (sem a origem), então ficam numa contagem à parte, da empresa
  const desist = AFD.filter(p => p.sit !== 'Afastado').length;
  const AF = AFD.filter(p => p.sit === 'Afastado');
  const LID = ATV.filter(p => nivelDe(p.funcao) >= 0).map(p => Object.assign(p, { niv:nivelDe(p.funcao) }));
  const LM = new Map(LID.map(p => [p.m, p]));
  // setores e departamentos
  const S = new Map();
  ATV.forEach(p => { const s = S.get(p.area) || (S.set(p.area, { nome:p.area, deps:new Map(), n:0, af:0 }), S.get(p.area)); s.n++;
    const k = p.area + '|' + p.dep, d = s.deps.get(k) || (s.deps.set(k, { k, nome:p.dep, area:p.area, P:[], af:0 }), s.deps.get(k)); d.P.push(p); });
  AF.forEach(p => { const s = S.get(p.area); if (s) { s.af++; const d = s.deps.get(p.area + '|' + p.dep); if (d) d.af++; } });
  // responsável de cada departamento
  S.forEach(s => s.deps.forEach(d => { const c = (CFG.dep || {})[d.k]; const lids = d.P.filter(p => p.niv >= 0);
    if (c && c.resp && LM.has(c.resp)) { d.resp = c.resp; d.auto = false; }
    else if (lids.length === 1) { d.resp = lids[0].m; d.auto = true; }
    else if (lids.length > 1) { const mx = Math.max(...lids.map(p => p.niv)); const L2 = lids.filter(p => p.niv === mx); if (L2.length === 1) { d.resp = L2[0].m; d.auto = true; } }
    d.func = funcoes(d.P.filter(p => p.niv < 0 || p.niv === undefined)); }));
  // a quem cada liderança responde
  const chefe = {};
  LID.forEach(l => { const c = (CFG.chefe || {})[l.m]; if (c === '-') { chefe[l.m] = ''; l.chefeAuto = false; return; } if (c && LM.has(c) && c !== l.m) { chefe[l.m] = c; l.chefeAuto = false; return; }
    // automático: a liderança de nível mais próximo acima, no mesmo setor (só quando há uma só); diretoria/gerência → diretor
    let acima = LID.filter(x => x.niv < l.niv && (x.area === l.area || x.niv === 0)); const mx = acima.length ? Math.max(...acima.map(x => x.niv)) : -1; acima = acima.filter(x => x.niv === mx);
    chefe[l.m] = acima.length === 1 ? acima[0].m : ''; l.chefeAuto = true; });
  // sem ciclos
  LID.forEach(l => { const vis = new Set([l.m]); let c = chefe[l.m]; while (c) { if (vis.has(c)) { chefe[l.m] = ''; break; } vis.add(c); c = chefe[c]; } });
  const SET = [...S.values()].sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome, 'pt-BR'));
  SET.forEach((s, i) => { s.cor = PALETA[i % PALETA.length]; s.D = [...s.deps.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); s.pend = s.D.filter(d => !d.resp).length; s.lid = LID.filter(l => l.area === s.nome).length; });
  B = { ATV, AF, desist, LID, LM, chefe, SET, ref:Q.referencia || '' };
}
function funcoes(P){ const m = new Map(); P.forEach(p => { const f = p.funcao || 'Sem função'; m.set(f, (m.get(f) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')); }

/* árvore de um setor: lideranças do setor + as responsáveis por departamentos dele + quem está acima delas */
function arvore(s){
  const ids = new Set(B.LID.filter(l => l.area === s.nome).map(l => l.m)); s.D.forEach(d => { if (d.resp) ids.add(d.resp); });
  [...ids].forEach(m => { let c = B.chefe[m], g = 0; while (c && g++ < 20) { ids.add(c); c = B.chefe[c]; } });
  const filhos = m => [...ids].filter(x => B.chefe[x] === m).map(x => B.LM.get(x)).sort((a, b) => a.niv - b.niv || a.nome.localeCompare(b.nome, 'pt-BR'));
  const raizes = [...ids].filter(m => !B.chefe[m] || !ids.has(B.chefe[m])).map(m => B.LM.get(m)).sort((a, b) => a.niv - b.niv || a.nome.localeCompare(b.nome, 'pt-BR'));
  const depsDe = m => s.D.filter(d => d.resp === m);
  return { raizes, filhos, depsDe, semResp:s.D.filter(d => !d.resp) };
}

/* ---------- visual ---------- */
const CSS = `.oe-top{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 12px}.oe-top .sp{flex:1}.oe-top input{flex:1;min-width:200px;max-width:420px;padding:10px 12px;border:1px solid #d0d5dd;border-radius:10px;font:inherit;font-size:14px;background:#fff}
.oe-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:0 0 14px}.oe-k div{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:10px 12px;border-top:4px solid var(--c)}
.oe-k small{display:block;font-size:11px;color:#5d6a85;text-transform:uppercase;letter-spacing:.04em;font-weight:700}.oe-k b{font-size:24px;color:#14213d}
.oe-dir{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:0 0 16px}
.oe-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.oe-s{background:#fff;border:1px solid #e3e6ec;border-top:5px solid var(--sc);border-radius:14px;padding:14px;cursor:pointer;text-align:left;font:inherit;color:#14213d;box-shadow:0 2px 6px rgba(20,33,61,.05);transition:transform .12s}
.oe-s:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(20,33,61,.12)}.oe-s h3{margin:0 0 4px;font-size:16px}.oe-s .n{font-size:28px;font-weight:800;color:var(--sc)}
.oe-s .l{font-size:12.5px;color:#5d6a85;margin-top:2px}.oe-s .pd{display:inline-block;margin-top:8px;background:#fff1d6;color:#7a5200;border-radius:99px;padding:2px 9px;font-size:11.5px;font-weight:800}
.oe-sh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px}.oe-sh h2{margin:0;font-size:20px}.oe-sh .q{background:color-mix(in srgb,var(--sc) 14%,#fff);color:var(--sc);border-radius:99px;padding:3px 10px;font-size:12.5px;font-weight:800}.oe-sh .sp{flex:1}
.oe-wrap{background:#fff;border:1px solid #e4e7ec;border-top:4px solid var(--sc);border-radius:14px;padding:16px;overflow:auto}
.oe-no{margin:0 0 0 0}.oe-no>summary{list-style:none;cursor:pointer}.oe-no>summary::-webkit-details-marker{display:none}
.oe-fi{margin-left:26px;padding-left:16px;border-left:2px solid #d5dbe5}
.oe-c{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #e3e6ec;border-left:5px solid var(--c);border-radius:12px;padding:8px 12px;margin:8px 0;max-width:520px;box-shadow:0 2px 6px rgba(20,33,61,.05)}
.oe-f{width:46px;height:46px;border-radius:50%;flex:0 0 auto;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;border:2px solid #fff;box-shadow:0 0 0 2px var(--c)}
.oe-f img{width:100%;height:100%;object-fit:cover;display:block}.oe-c .t{flex:1;min-width:0}.oe-c b{display:block;font-size:13.5px;color:#14213d}.oe-c small{display:block;font-size:12px;color:#5d6a85}
.oe-c .nv{font-size:10.5px;font-weight:800;color:var(--c);text-transform:uppercase;letter-spacing:.04em}.oe-c .ar{font-size:11px;color:#8a94a8;transition:transform .15s}.oe-no[open]>summary .ar{transform:rotate(90deg)}
.oe-c .ft{border:0;background:none;color:#24427c;font-size:11.5px;cursor:pointer;text-decoration:underline;padding:0}
.oe-d{background:#fbfbfc;border:1px solid #e4e7ec;border-radius:12px;padding:10px 12px;margin:8px 0;max-width:760px}.oe-d.pend{border:1px dashed #d9a441;background:#fffaf0}
.oe-d h4{margin:0;font-size:13.5px;color:#14213d;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.oe-d h4 span{color:var(--sc);font-weight:800;font-size:12.5px}.oe-d h4 em{font-style:normal;font-size:11.5px;color:#8a94a8;font-weight:600}
.oe-fns{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.oe-fn{border:1px solid #dfe3ea;background:#fff;border-radius:8px;padding:4px 9px;font:inherit;font-size:12px;cursor:pointer;color:#14213d}.oe-fn b{color:var(--sc)}.oe-fn:hover{border-color:var(--sc)}
.oe-pd{display:inline-block;background:#fff1d6;color:#7a5200;border-radius:99px;padding:2px 9px;font-size:11px;font-weight:800}
.oe-hl{outline:3px solid #e9a23b;outline-offset:2px}
.oe-res{display:flex;flex-direction:column;gap:6px;margin:0 0 14px}.oe-res button{text-align:left;border:1px solid #e4e7ec;background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer;font:inherit}.oe-res small{color:#5d6a85}
.oe-ov{position:fixed;inset:0;background:rgba(10,20,40,.5);z-index:95;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 10px}
.oe-m{background:#fff;border-radius:16px;width:min(680px,100%);box-shadow:0 20px 50px rgba(0,0,0,.3);max-height:calc(100vh - 48px);display:flex;flex-direction:column}
.oe-mh{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid #e4e7ec}.oe-mh h3{margin:0;flex:1;font-size:17px}.oe-mb{padding:16px 18px;overflow:auto}.oe-mf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 18px;border-top:1px solid #e4e7ec}
.oe-tb{width:100%;border-collapse:collapse;font-size:13px}.oe-tb th{text-align:left;font-size:11px;text-transform:uppercase;color:#667085;padding:6px;border-bottom:2px solid #e4e7ec}.oe-tb td{padding:6px;border-top:1px solid #eef0f4;vertical-align:middle}.oe-tb td.n{text-align:right;font-weight:800}
.oe-tb select{width:100%;max-width:340px}.oe-tb tr.pend td{background:#fffaf0}
@media (max-width:760px){.oe-fi{margin-left:10px;padding-left:10px}.oe-c{max-width:none}.oe-wrap{padding:10px}.oe-g{grid-template-columns:1fr 1fr}.oe-s .n{font-size:22px}}`;
function estilo(){ if (!document.getElementById('oe-css')) { const s = document.createElement('style'); s.id = 'oe-css'; s.textContent = CSS; document.head.appendChild(s); } }
const fotoHtml = p => FOTOS['q:' + p.m] ? `<img src="${FOTOS['q:' + p.m]}" alt="">` : esc(iniciais(p.nome));
const cardLid = (l, ex) => { const c = NIVEIS[l.niv].c; return `<div class="oe-c" style="--c:${c}" data-l="${esc(l.m)}"><div class="oe-f" style="background:${corDe(l.m)}">${fotoHtml(l)}</div><div class="t"><span class="nv">${NIVEIS[l.niv].n}</span><b>${esc(tc(l.nome))}</b><small>${esc(tc(l.funcao))} · ${esc(tc(l.dep))}${l.area !== ex ? ' · ' + esc(l.area) : ''}</small></div>${ex !== undefined ? '<span class="ar">▶</span>' : ''}</div>`; };
const depHtml = (d, s) => `<div class="oe-d ${d.resp ? '' : 'pend'}" id="oe-d-${esc(btoa(unescape(encodeURIComponent(d.k))).replace(/=/g, ''))}"><h4>${esc(tc(d.nome))} <span>${pessoas(d.P.length)}</span>${d.af ? `<em>+ ${d.af} afastado${d.af > 1 ? 's' : ''}</em>` : ''}${d.resp ? (d.auto ? '<em>· responsável automático</em>' : '') : '<span class="oe-pd">Liderança a definir</span>'}</h4>
  <div class="oe-fns">${d.func.map(([f, n]) => `<button class="oe-fn" data-fn="${esc(f)}" data-dk="${esc(d.k)}">${esc(tc(f))} – <b>${n}</b></button>`).join('') || '<small style="color:#8a94a8">Só a liderança neste departamento.</small>'}</div></div>`;

async function tela(setor){
  estilo(); if (setor !== undefined) VIS.setor = setor;
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Organograma da Empresa · pelo Quadro</h1><div class="ini-data" id="oe-sub">Toda a CRV por setor e departamento: lideranças com nome e as equipes por função</div></div></section><div id="oe-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  try { await Promise.all([lerCfg(), lerFotos()]); await montar(); } catch(e) { const c = $('#oe-corpo'); if (c) c.innerHTML = `<div class="cartao vazio"><h3>Não consegui montar o organograma</h3><p>${esc(e.message || traduzErro(e))}</p></div>`; return; }
  desenhar();
}
function desenhar(){
  const c = $('#oe-corpo'); if (!c || !B) return; const sb0 = $('#oe-sub'); if (sb0 && B.ref) sb0.textContent = 'Toda a CRV por setor e departamento · Quadro Geral de ' + B.ref.split('-').reverse().join('/');
  const s = VIS.setor && B.SET.find(x => x.nome === VIS.setor);
  const barra = `<div class="oe-top">${s ? '<button class="btn borda" id="oe-volta">‹ Todos os setores</button>' : ''}<input id="oe-q" type="search" placeholder="Buscar função ou departamento" value="${esc(VIS.q)}"><span class="sp"></span>${ehAdmin() ? '<button class="btn borda" id="oe-cfg">Definir lideranças</button>' : ''}<button class="btn borda" id="oe-xls">Excel</button><button class="btn prim" id="oe-pdf">Imprimir / Gerar PDF</button></div>`;
  c.innerHTML = barra + `<div id="oe-res"></div>` + (s ? setorHtml(s) : geral());
  ligar(c);
}
function geral(){ const tot = B.ATV.length, pend = B.SET.reduce((t, s) => t + s.pend, 0), dir = B.LID.filter(l => l.niv <= 1).sort((a, b) => a.niv - b.niv || a.nome.localeCompare(b.nome, 'pt-BR'));
  return `<div class="oe-k"><div style="--c:#2e7d4f"><small>Ativos na empresa</small><b>${tot}</b></div><div style="--c:#b5731a;cursor:pointer" id="oe-af" title="Ver afastados por função"><small>Afastados (à parte)</small><b>${B.AF.length}</b></div><div style="--c:#7b3fa0"><small>Setores</small><b>${B.SET.length}</b></div>
    <div style="--c:#1d7a88"><small>Departamentos</small><b>${B.SET.reduce((t, s) => t + s.D.length, 0)}</b></div><div style="--c:#a3485a"><small>Lideranças</small><b>${B.LID.length}</b></div><div style="--c:#c0583f"><small>Liderança a definir</small><b>${pend}</b></div></div>
    ${dir.length ? `<div class="oe-dir">${dir.map(l => cardLid(l)).join('')}</div>` : ''}
    <div class="oe-g">${B.SET.map(s => `<button class="oe-s" data-s="${esc(s.nome)}" style="--sc:${s.cor}"><h3>${esc(s.nome)}</h3><div class="n">${s.n}</div><div class="l">${s.D.length} departamento${s.D.length > 1 ? 's' : ''} · ${s.lid} liderança${s.lid === 1 ? '' : 's'}${s.af ? ' · ' + s.af + ' afastado' + (s.af > 1 ? 's' : '') : ''}</div>${s.pend ? `<span class="pd">${s.pend} sem liderança definida</span>` : ''}</button>`).join('')}</div>
    <p class="nr-fonte">Total da empresa: ${pessoas(tot)} ativas${B.AF.length ? ' e ' + B.AF.length + ' afastadas' : ''}. Clique num setor para abrir a estrutura completa. Funções sem liderança aparecem só com a quantidade, sem nomes.${B.desist ? ' ' + B.desist + ' pessoa(s) no setor "Desistentes" do Quadro não entram.' : ''}</p>`; }
function setorHtml(s){ const A = arvore(s);
  const no = l => { const F = A.filhos(l.m), D = A.depsDe(l.m); return `<details class="oe-no" open><summary>${cardLid(l, s.nome)}</summary><div class="oe-fi">${F.map(no).join('')}${D.map(d => depHtml(d, s)).join('')}</div></details>`; };
  return `<section style="--sc:${s.cor}"><div class="oe-sh"><h2>${esc(s.nome)}</h2><span class="q">${pessoas(s.n)}</span>${s.af ? `<span class="q" style="--sc:#b5731a">${s.af} afastado${s.af > 1 ? 's' : ''}</span>` : ''}<span class="sp"></span><button class="btn borda peq" id="oe-ab">Abrir tudo</button><button class="btn borda peq" id="oe-fe">Recolher</button></div>
    <div class="oe-wrap">${A.raizes.map(no).join('')}${A.semResp.length ? `<div style="margin-top:14px"><div class="oe-pd" style="font-size:12.5px;margin-bottom:4px">Liderança a definir · ${A.semResp.length} departamento${A.semResp.length > 1 ? 's' : ''}</div>${A.semResp.map(d => depHtml(d, s)).join('')}${ehAdmin() ? '<button class="btn prim peq" id="oe-cfg2" style="margin-top:6px">Definir as lideranças deste setor</button>' : ''}</div>` : ''}</div>
    <p class="nr-fonte">Total do setor: ${pessoas(s.n)} em ${s.D.length} departamentos. Clique numa função para ver a quantidade por departamento e por turno.</p></section>`; }
function ligar(c){
  c.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { VIS.setor = b.dataset.s; desenhar(); window.scrollTo(0, 0); });
  const v = $('#oe-volta'); if (v) v.onclick = () => { VIS.setor = ''; desenhar(); };
  const ab = $('#oe-ab'), fe = $('#oe-fe'); if (ab) ab.onclick = () => c.querySelectorAll('.oe-no').forEach(d => d.open = true); if (fe) fe.onclick = () => c.querySelectorAll('.oe-no').forEach(d => d.open = false);
  c.querySelectorAll('[data-fn]').forEach(b => b.onclick = () => detFuncao(b.dataset.fn, b.dataset.dk));
  c.querySelectorAll('.oe-dir [data-l]').forEach(b => b.onclick = () => fichaLid(b.dataset.l));
  c.querySelectorAll('.oe-c[data-l]').forEach(b => b.addEventListener('dblclick', () => fichaLid(b.dataset.l)));
  c.querySelectorAll('.oe-c[data-l] .oe-f').forEach(f => f.onclick = e => { e.preventDefault(); e.stopPropagation(); fichaLid(f.closest('[data-l]').dataset.l); });
  [$('#oe-cfg'), $('#oe-cfg2')].forEach(b => { if (b) b.onclick = () => config(VIS.setor); });
  const af = $('#oe-af'); if (af) af.onclick = () => { const f = funcoes(B.AF); janela('Afastados · ' + pessoas(B.AF.length), `<p style="margin-top:0;color:#5d6a85;font-size:13px">No Quadro Geral os afastados ficam no setor "Afastados", sem o departamento de origem, por isso não entram nos setores. Contagem por função, sem nomes.</p><table class="oe-tb"><thead><tr><th>Função</th><th style="text-align:right">Pessoas</th></tr></thead><tbody>${f.map(([n, q]) => `<tr><td>${esc(tc(n))}</td><td class="n">${q}</td></tr>`).join('')}<tr><td><b>Total</b></td><td class="n">${B.AF.length}</td></tr></tbody></table>`); };
  $('#oe-pdf').onclick = escolherPDF; $('#oe-xls').onclick = excel;
  const q = $('#oe-q'); q.oninput = () => { VIS.q = q.value; clearTimeout(q._t); q._t = setTimeout(busca, 250); }; if (VIS.q) busca();
}
function busca(){ const r = $('#oe-res'); if (!r) return; const t = N(VIS.q); if (t.length < 2) { r.innerHTML = ''; return; } const out = [];
  B.SET.forEach(s => s.D.forEach(d => { if (N(d.nome).includes(t)) out.push({ s, d, txt:'Departamento <b>' + esc(tc(d.nome)) + '</b> · ' + pessoas(d.P.length) });
    d.func.forEach(([f, n]) => { if (N(f).includes(t)) out.push({ s, d, txt:'<b>' + esc(tc(f)) + ' – ' + n + '</b> · ' + esc(tc(d.nome)) }); }); }));
  r.innerHTML = out.length ? `<div class="oe-res">${out.slice(0, 40).map((o, i) => `<button data-i="${i}">${o.txt} <small>· ${esc(o.s.nome)}</small></button>`).join('')}${out.length > 40 ? `<small>Mais ${out.length - 40} resultados: refine a busca.</small>` : ''}</div>` : '<p class="nr-fonte">Nada encontrado.</p>';
  r.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const o = out[+b.dataset.i]; VIS.setor = o.s.nome; VIS.q = ''; desenhar();
    const el = document.getElementById('oe-d-' + btoa(unescape(encodeURIComponent(o.d.k))).replace(/=/g, '')); if (el) { let p = el.parentElement; while (p) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; } el.classList.add('oe-hl'); el.scrollIntoView({ behavior:'smooth', block:'center' }); setTimeout(() => el.classList.remove('oe-hl'), 3000); } }); }
function janela(tit, corpo, pe){ const w = document.createElement('div'); w.className = 'oe-ov'; w.innerHTML = `<div class="oe-m"><div class="oe-mh"><h3>${tit}</h3><button class="btn borda peq" data-x>Fechar</button></div><div class="oe-mb">${corpo}</div><div class="oe-mf">${pe || ''}</div></div>`;
  document.body.appendChild(w); w.addEventListener('mousedown', e => { if (e.target === w) w.remove(); }); w.querySelectorAll('[data-x]').forEach(b => b.onclick = () => w.remove()); return w; }
/* bloco de função: só quantidades (por departamento do setor e por turno) — sem nomes */
function detFuncao(f, dk){ const [area] = dk.split('|'); const s = B.SET.find(x => x.nome === area); if (!s) return;
  const porDep = s.D.map(d => [d.nome, d.P.filter(p => p.funcao === f && !(p.niv >= 0)).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const d = s.deps.get(dk), aqui = d ? d.P.filter(p => p.funcao === f && !(p.niv >= 0)) : [];
  const tur = new Map(); aqui.forEach(p => { const k = p.hor || 'Sem horário na base'; tur.set(k, (tur.get(k) || 0) + 1); });
  janela(esc(tc(f)), `<p style="margin-top:0;color:#5d6a85;font-size:13px">${esc(area)} · ${esc(tc(d ? d.nome : ''))}: <b>${pessoas(aqui.length)}</b></p>
    <h4 style="margin:10px 0 6px">Por turno / horário (${esc(tc(d ? d.nome : ''))})</h4><table class="oe-tb"><thead><tr><th>Horário</th><th style="text-align:right">Pessoas</th></tr></thead><tbody>${[...tur.entries()].sort((a, b) => b[1] - a[1]).map(([h, n]) => `<tr><td>${esc(h)}</td><td class="n">${n}</td></tr>`).join('')}</tbody></table>
    <h4 style="margin:14px 0 6px">Por departamento (${esc(area)})</h4><table class="oe-tb"><thead><tr><th>Departamento</th><th style="text-align:right">Pessoas</th></tr></thead><tbody>${porDep.map(([n, q]) => `<tr><td>${esc(tc(n))}</td><td class="n">${q}</td></tr>`).join('')}<tr><td><b>Total no setor</b></td><td class="n">${porDep.reduce((t, x) => t + x[1], 0)}</td></tr></tbody></table>`); }
/* ficha da liderança: foto (só RH troca) e quem responde a quem */
function fichaLid(m){ const l = B.LM.get(m); if (!l) return; const ch = B.LM.get(B.chefe[m]); const sub = B.LID.filter(x => B.chefe[x.m] === m), deps = B.SET.flatMap(s => s.D.filter(d => d.resp === m));
  const w = janela(esc(tc(l.nome)), `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><div class="oe-f" style="--c:${NIVEIS[l.niv].c};width:110px;height:110px;font-size:36px;background:${corDe(m)}">${fotoHtml(l)}</div>
    <div><b style="font-size:16px">${esc(tc(l.nome))}</b><br><span style="color:#5d6a85">${esc(tc(l.funcao))}</span><br><small>Mat. ${esc(m)} · ${esc(l.area)} · ${esc(tc(l.dep))}</small></div></div>
    <table class="oe-tb"><tbody><tr><td>Responde a</td><td><b>${ch ? esc(tc(ch.nome)) + ' · ' + esc(tc(ch.funcao)) : '—'}</b>${l.chefeAuto && ch ? ' <small>(automático)</small>' : ''}</td></tr>
    <tr><td>Lideranças abaixo</td><td>${sub.map(x => esc(tc(x.nome))).join(', ') || '—'}</td></tr><tr><td>Departamentos sob responsabilidade</td><td>${deps.map(d => esc(tc(d.nome)) + ' (' + d.P.length + ')').join(', ') || '—'}</td></tr></tbody></table>`,
    ehRH() ? `<button class="btn borda" id="oe-foto">${FOTOS['q:' + m] ? 'Trocar foto' : 'Adicionar foto'}</button>${FOTOS['q:' + m] ? '<button class="btn borda" id="oe-fx">Tirar foto</button>' : ''}` : '');
  const fb = w.querySelector('#oe-foto'); if (fb) fb.onclick = () => recortar('q:' + m, () => { w.remove(); desenhar(); fichaLid(m); });
  const fx = w.querySelector('#oe-fx'); if (fx) fx.onclick = async () => { if (!confirm('Tirar a foto de ' + tc(l.nome) + '?')) return; try { await salvarFoto('q:' + m, ''); w.remove(); desenhar(); fichaLid(m); } catch(e) { toast(traduzErro(e), true); } }; }
/* foto: só recortar/enquadrar no círculo (arrastar e aproximar); a imagem não é alterada */
function recortar(k, depois){ const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const url = URL.createObjectURL(f), im = new Image(); im.onload = () => {
    const T = 280, w = janela('Enquadrar a foto', `<p style="margin-top:0;font-size:13px;color:#5d6a85">Arraste a foto e use o controle para aproximar até o rosto ficar no círculo. A foto não é alterada, só recortada.</p><canvas id="oe-cv" width="${T}" height="${T}" style="display:block;margin:0 auto;border-radius:50%;cursor:grab;touch-action:none;background:#eef1f6"></canvas><input type="range" id="oe-z" min="1" max="4" step="0.01" value="1" style="width:100%;margin-top:10px">`,
      '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oe-fok">Salvar foto</button>');
    const cv = w.querySelector('#oe-cv'), ctx = cv.getContext('2d'), base = Math.max(T / im.width, T / im.height); let z = 1, ox = 0, oy = 0, dr = null;
    const lim = () => { const s = base * z, mw = (im.width * s - T) / 2, mh = (im.height * s - T) / 2; ox = Math.max(-mw, Math.min(mw, ox)); oy = Math.max(-mh, Math.min(mh, oy)); };
    const pinta = () => { lim(); const s = base * z; ctx.clearRect(0, 0, T, T); ctx.drawImage(im, (T - im.width * s) / 2 + ox, (T - im.height * s) / 2 + oy, im.width * s, im.height * s); }; pinta();
    const pt = e => { const t = e.touches ? e.touches[0] : e; return [t.clientX, t.clientY]; };
    const ini = e => { e.preventDefault(); dr = pt(e); }, mov = e => { if (!dr) return; const p = pt(e); ox += p[0] - dr[0]; oy += p[1] - dr[1]; dr = p; pinta(); }, fim = () => { dr = null; };
    cv.addEventListener('mousedown', ini); cv.addEventListener('touchstart', ini, { passive:false }); window.addEventListener('mousemove', mov); cv.addEventListener('touchmove', e => { e.preventDefault(); mov(e); }, { passive:false }); window.addEventListener('mouseup', fim); cv.addEventListener('touchend', fim);
    w.querySelector('#oe-z').oninput = e => { z = +e.target.value; pinta(); };
    w.querySelector('#oe-fok').onclick = async () => { const o = document.createElement('canvas'); o.width = o.height = 320; const s = base * z * (320 / T); o.getContext('2d').drawImage(im, (320 - im.width * s) / 2 + ox * 320 / T, (320 - im.height * s) / 2 + oy * 320 / T, im.width * s, im.height * s);
      try { await salvarFoto(k, o.toDataURL('image/jpeg', .88)); window.removeEventListener('mousemove', mov); window.removeEventListener('mouseup', fim); w.remove(); URL.revokeObjectURL(url); toast('Foto salva.'); depois && depois(); } catch(e) { toast(traduzErro(e), true); } }; };
    im.src = url; }; inp.click(); }

/* ---------- Definir lideranças (Administração): responsável por departamento e a quem cada liderança responde ---------- */
async function config(setorIni){
  if (!ehAdmin()) { toast('Só a administração define as lideranças.', true); return; }
  if (!B) { await Promise.all([lerCfg(), lerFotos()]); await montar(); }
  let sel = setorIni || (B.SET.find(s => s.pend) || B.SET[0] || {}).nome || '';
  const D2 = JSON.parse(JSON.stringify({ dep:CFG.dep || {}, chefe:CFG.chefe || {} }));
  const optL = (atual, excl, setor) => { const L = B.LID.slice().sort((a, b) => (a.area === setor ? 0 : 1) - (b.area === setor ? 0 : 1) || a.niv - b.niv || a.nome.localeCompare(b.nome, 'pt-BR'));
    return L.filter(l => l.m !== excl).map(l => `<option value="${esc(l.m)}" ${atual === l.m ? 'selected' : ''}>${esc(tc(l.nome))} · ${esc(tc(l.funcao))}${l.area !== setor ? ' · ' + esc(l.area) : ''}</option>`).join(''); };
  const w = janela('Definir lideranças', '<div id="oe-cf"></div>', '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oe-sv">Salvar</button>');
  w.querySelector('.oe-m').style.width = 'min(1000px,100%)';
  const des = () => { const s = B.SET.find(x => x.nome === sel); const box = w.querySelector('#oe-cf'); if (!s) { box.innerHTML = 'Sem setores.'; return; }
    const lids = B.LID.filter(l => l.area === s.nome).sort((a, b) => a.niv - b.niv || a.nome.localeCompare(b.nome, 'pt-BR'));
    box.innerHTML = `<label style="font-size:12px;font-weight:700;color:#667085">SETOR <select id="oe-cs">${B.SET.map(x => `<option ${x.nome === sel ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
      <h4 style="margin:14px 0 6px">Departamentos: quem é a liderança responsável</h4>
      <table class="oe-tb"><thead><tr><th>Departamento</th><th style="text-align:right">Pessoas</th><th>Liderança responsável</th></tr></thead><tbody>${s.D.map(d => { const v = (D2.dep[d.k] || {}).resp || ''; const pend = !v && !d.resp;
        return `<tr class="${pend ? 'pend' : ''}"><td>${esc(tc(d.nome))}</td><td class="n">${d.P.length}</td><td><select data-dep="${esc(d.k)}"><option value="">${d.resp && d.auto ? 'Automático: ' + esc(tc(B.LM.get(d.resp).nome)) : 'Liderança a definir'}</option>${optL(v, '', s.nome)}</select></td></tr>`; }).join('')}</tbody></table>
      <h4 style="margin:16px 0 6px">Lideranças do setor: a quem cada uma responde</h4>
      <table class="oe-tb"><thead><tr><th>Liderança</th><th>Departamento</th><th>Responde a</th></tr></thead><tbody>${lids.map(l => { const v = D2.chefe[l.m] || ''; const auto = B.chefe[l.m] && !v ? B.LM.get(B.chefe[l.m]) : null;
        return `<tr><td><b>${esc(tc(l.nome))}</b><br><small>${esc(tc(l.funcao))}</small></td><td>${esc(tc(l.dep))}</td><td><select data-ch="${esc(l.m)}"><option value="">${auto ? 'Automático: ' + esc(tc(auto.nome)) : 'Ninguém acima (topo do setor)'}</option><option value="-" ${v === '-' ? 'selected' : ''}>Ninguém acima (topo)</option>${optL(v, l.m, s.nome)}</select></td></tr>`; }).join('') || '<tr><td colspan="3">Nenhuma liderança com cargo de gerente, coordenador, supervisor ou encarregado neste setor.</td></tr>'}</tbody></table>
      <p class="nr-fonte">"Automático" = o app escolheu porque só há uma liderança no departamento (ou só uma acima no setor). Escolha outra pessoa para fixar. A lista mostra primeiro as lideranças deste setor.</p>`;
    box.querySelector('#oe-cs').onchange = e => { sel = e.target.value; des(); };
    box.querySelectorAll('[data-dep]').forEach(x => x.onchange = () => { if (x.value) D2.dep[x.dataset.dep] = { resp:x.value }; else delete D2.dep[x.dataset.dep]; });
    box.querySelectorAll('[data-ch]').forEach(x => x.onchange = () => { if (x.value) D2.chefe[x.dataset.ch] = x.value; else delete D2.chefe[x.dataset.ch]; }); };
  des();
  w.querySelector('#oe-sv').onclick = async () => { const bt = w.querySelector('#oe-sv'); bt.disabled = true; bt.textContent = 'Salvando…';
    try { CFG.dep = D2.dep; CFG.chefe = D2.chefe; await salvarCfg(); toast('Lideranças salvas.'); w.remove(); await montar(); if (/^#\/org-empresa/.test(location.hash)) { VIS.setor = sel; desenhar(); } }
    catch(e) { bt.disabled = false; bt.textContent = 'Salvar'; toast(traduzErro(e), true); } };
}

/* ---------- Excel: contagem por setor, departamento, liderança e função ---------- */
function excel(){ const rows = [], lid = [];
  const setores = B.SET;
  setores.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach(s => s.D.forEach(d => { const r = d.resp ? B.LM.get(d.resp) : null;
    d.func.forEach(([f, n]) => rows.push([s.nome, tc(d.nome), r ? tc(r.nome) : 'Liderança a definir', r ? tc(r.funcao) : '', tc(f), n]));
    d.P.filter(p => p.niv >= 0).forEach(l => lid.push([s.nome, tc(d.nome), tc(l.nome), l.m, tc(l.funcao), NIVEIS[l.niv].n, B.chefe[l.m] ? tc(B.LM.get(B.chefe[l.m]).nome) : '—'])); }));
  const tot = rows.reduce((t, r) => t + r[5], 0) + lid.length;
  const cab = [['CRV Industrial · Organograma da Empresa'], ['Quadro Geral de ' + (B.ref ? B.ref.split('-').reverse().join('/') : '') + ' · somente ativos']];
  const ws1 = XLSX.utils.aoa_to_sheet(cab.concat([[], ['Setor', 'Departamento', 'Liderança responsável', 'Função da liderança', 'Função', 'Pessoas']], rows, [[], ['Total (funções sem liderança)', '', '', '', '', rows.reduce((t, r) => t + r[5], 0)]]));
  ws1['!cols'] = [{ wch:24 }, { wch:36 }, { wch:34 }, { wch:30 }, { wch:40 }, { wch:10 }];
  lid.sort((a, b) => a[0].localeCompare(b[0], 'pt-BR') || a[2].localeCompare(b[2], 'pt-BR'));
  const ws2 = XLSX.utils.aoa_to_sheet(cab.concat([[], ['Setor', 'Departamento', 'Nome', 'Matrícula', 'Função', 'Nível', 'Responde a']], lid, [[], ['Total de lideranças', '', lid.length]]));
  ws2['!cols'] = [{ wch:24 }, { wch:36 }, { wch:36 }, { wch:10 }, { wch:36 }, { wch:24 }, { wch:34 }];
  const sres = setores.map(s => [s.nome, s.D.length, s.lid, s.n, s.pend]);
  const ws3 = XLSX.utils.aoa_to_sheet(cab.concat([[], ['Setor', 'Departamentos', 'Lideranças', 'Ativos', 'Departamentos sem liderança definida']], sres.sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')), [[], ['Total de ativos', sres.reduce((t, r) => t + r[1], 0), sres.reduce((t, r) => t + r[2], 0), sres.reduce((t, r) => t + r[3], 0), sres.reduce((t, r) => t + r[4], 0)], ['Afastados (à parte: no Quadro ficam sem setor de origem)', '', '', B.AF.length]]));
  ws3['!cols'] = [{ wch:26 }, { wch:14 }, { wch:12 }, { wch:10 }, { wch:10 }, { wch:24 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws3, 'Setores'); XLSX.utils.book_append_sheet(wb, ws1, 'Funções por departamento'); XLSX.utils.book_append_sheet(wb, ws2, 'Lideranças');
  baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Organograma da empresa.xlsx');
  void tot; }

/* ---------- PDF: completo ou por setor, no padrão dos documentos do app ---------- */
function escolherPDF(){ const w = janela('Imprimir / Gerar PDF', `<label class="oe-op" style="display:flex;gap:8px;margin-bottom:8px"><input type="radio" name="oe-pp" value="" ${VIS.setor ? '' : 'checked'}> Organograma completo (todos os setores)</label>${B.SET.map(s => `<label style="display:flex;gap:8px;margin-bottom:6px"><input type="radio" name="oe-pp" value="${esc(s.nome)}" ${VIS.setor === s.nome ? 'checked' : ''}> ${esc(s.nome)} (${s.n})</label>`).join('')}`,
  '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="oe-pg">Gerar PDF</button>');
  w.querySelector('#oe-pg').onclick = async () => { const v = (w.querySelector('[name=oe-pp]:checked') || {}).value || ''; const bt = w.querySelector('#oe-pg'); bt.disabled = true; bt.textContent = 'Gerando…'; try { await pdf(v); w.remove(); } catch(e) { bt.disabled = false; bt.textContent = 'Gerar PDF'; toast('Não consegui gerar o PDF: ' + e.message, true); } }; }
async function pdf(so){
  const { jsPDF } = window.jspdf, D = window.CRV_DOC, doc = new jsPDF({ unit:'mm', format:'a4' }), W = 210, H = 297, L = 14, R = W - 14, TOP = 30, BOT = H - 26; let y = 0;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const C = D ? D.cores : { NAVY:[31,58,104], INK:[30,36,48], MUT:[110,116,128] };
  const nova = () => { doc.addPage(); y = TOP + 4; }; const cabe = h => { if (y + h > BOT) nova(); };
  const setores = so ? B.SET.filter(s => s.nome === so) : B.SET;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(...C.NAVY); doc.text('Organograma da Empresa' + (so ? ' · ' + so : ''), L, 36);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.INK); const M = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'], hj = new Date();
  doc.text('Capinópolis/MG, ' + String(hj.getDate()).padStart(2, '0') + ' de ' + M[hj.getMonth()] + ' de ' + hj.getFullYear() + ' · Quadro Geral de ' + (B.ref ? B.ref.split('-').reverse().join('/') : '') + ' · somente ativos', L, 41.5); y = 48;
  const circ = (l, cx, cy, r) => { const img = FOTOS['q:' + l.m]; if (img) { try { doc.saveGraphicsState && doc.saveGraphicsState(); doc.addImage(img, 'JPEG', cx - r, cy - r, 2 * r, 2 * r); } catch(_){} } else { doc.setFillColor(...hex(corDe(l.m))); doc.circle(cx, cy, r, 'F'); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(r * 2.2); doc.text(iniciais(l.nome), cx, cy + r * .38, { align:'center' }); }
    doc.setDrawColor(...hex(NIVEIS[l.niv].c)); doc.setLineWidth(.6); doc.circle(cx, cy, r, 'S'); };
  const lider = (l, ind) => { cabe(13); const x = L + ind; doc.setFillColor(255, 255, 255); doc.setDrawColor(227, 230, 236); doc.setLineWidth(.25); doc.roundedRect(x, y, Math.min(120, R - x), 11, 2, 2, 'FD');
    doc.setFillColor(...hex(NIVEIS[l.niv].c)); doc.rect(x, y, 1.6, 11, 'F'); circ(l, x + 7, y + 5.5, 3.8);
    doc.setTextColor(...C.INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); doc.text(doc.splitTextToSize(tc(l.nome), Math.min(120, R - x) - 16)[0], x + 13, y + 4.6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...C.MUT); doc.text(doc.splitTextToSize(tc(l.funcao) + ' · ' + tc(l.dep), Math.min(120, R - x) - 16)[0], x + 13, y + 8.6); y += 13; };
  const dep = (d, ind, cor) => { const x = L + ind, wd = R - x; const txt = d.func.map(([f, n]) => tc(f) + ' – ' + n).join('   ·   ') || 'Só a liderança neste departamento.';
    doc.setFontSize(7.4); const ls = doc.splitTextToSize(txt, wd - 6); const h = 8 + ls.length * 3.3; cabe(h + 2);
    if (d.resp) doc.setFillColor(251, 251, 252); else doc.setFillColor(255, 250, 240); doc.setDrawColor(...(d.resp ? [228, 231, 236] : [217, 164, 65])); doc.roundedRect(x, y, wd, h, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.2); doc.setTextColor(...C.INK); doc.text(tc(d.nome), x + 3, y + 4.6); const w0 = doc.getTextWidth(tc(d.nome));
    doc.setTextColor(...hex(cor)); doc.text(pessoas(d.P.length) + (d.af ? ' (+' + d.af + ' afast.)' : ''), x + 5 + w0, y + 4.6); if (!d.resp) { doc.setTextColor(122, 82, 0); doc.text('Liderança a definir', R - 3, y + 4.6, { align:'right' }); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.4); doc.setTextColor(...C.MUT); doc.text(ls, x + 3, y + 8.4); y += h + 2; };
  setores.forEach((s, si) => { if (si && !so) { if (y > BOT - 60) nova(); else y += 4; } cabe(16);
    doc.setFillColor(...hex(s.cor)); doc.roundedRect(L, y, R - L, 9, 2, 2, 'F'); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.text(s.nome, L + 3, y + 6);
    doc.setFontSize(8.5); doc.text(pessoas(s.n) + ' · ' + s.D.length + ' departamentos' + (s.af ? ' · ' + s.af + ' afastados' : ''), R - 3, y + 6, { align:'right' }); y += 12;
    const A = arvore(s); const no = (l, n) => { lider(l, n * 6); A.filhos(l.m).forEach(f => no(f, n + 1)); A.depsDe(l.m).forEach(d => dep(d, (n + 1) * 6, s.cor)); };
    A.raizes.forEach(r => no(r, 0));
    if (A.semResp.length) { cabe(8); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); doc.setTextColor(122, 82, 0); doc.text('Liderança a definir · ' + A.semResp.length + ' departamento(s)', L, y + 4); y += 6; A.semResp.forEach(d => dep(d, 0, s.cor)); } });
  const tot = setores.reduce((t, s) => t + s.n, 0), af = so ? 0 : B.AF.length; cabe(10); y += 2; doc.setDrawColor(215, 220, 228); doc.line(L, y, R, y); y += 5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.INK); doc.text('Total: ' + pessoas(tot) + ' ativas' + (af ? ' · ' + af + ' afastadas (à parte, sem setor de origem no Quadro)' : '') + ' · ' + setores.reduce((t, s) => t + s.D.length, 0) + ' departamentos · ' + B.LID.filter(l => setores.some(s => s.nome === l.area)).length + ' lideranças', L, y);
  if (D) D.moldura(doc, '');
  const logo = window.CRV_LOGO ? await window.CRV_LOGO('logo-crv') : null; if (logo && logo.src) { const n = doc.getNumberOfPages(), h = 11, w = h * logo.w / logo.h; for (let p = 1; p <= n; p++) { doc.setPage(p); try { doc.addImage(logo.src, 'PNG', W - 12 - w, 7, w, h); } catch(_){} } }
  baixar(doc.output('blob'), 'Organograma da empresa' + (so ? ' - ' + so : '') + '.pdf');
}

/* cópia para gestor/assistente (gerada pelo administrador): nome só das lideranças; as demais pessoas vão sem nome (o organograma só mostra a quantidade) */
async function snapshot(){
  await Promise.all([lerCfg(), lerFotos()]); const Q = window.CRV_QUADRO ? await window.CRV_QUADRO() : null; if (!Q || !Q.mapa) return null;
  let H0 = {}; try { const d = await window.CRV_DADOS('quadro'); H0 = (d && d.dados && d.dados.HOR) || {}; } catch(_){}
  const mapa = {}, hor = {}, fotos = {};
  Object.entries(Q.mapa).forEach(([m, p]) => { if (p.situacao === 'Desligado') return; const lid = nivelDe(p.funcao) >= 0;
    mapa[m] = { nome:lid ? p.nome : '', funcao:p.funcao, area:p.area, setor:p.setor, situacao:p.situacao };
    if (H0[m]) hor[m] = [H0[m][0], H0[m][1]]; if (lid && FOTOS['q:' + m]) fotos['q:' + m] = FOTOS['q:' + m]; });
  return { cfg:CFG, fotos, mapa, hor, ref:Q.referencia || '', em:new Date().toISOString() };
}
return { tela, config, snapshot };
};
