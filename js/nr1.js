/* =====================================================================
   RISCOS PSICOSSOCIAIS (NR-1)
   Reúne os indícios que o RH já tem (Quadro, absenteísmo, sanções, saídas, entrevistas de desligamento,
   ouvidorias, Pesquisa Pulse e treinamentos), por área, e guarda o plano de ação, as comunicações e
   os dados da avaliação técnica feita pela Segurança do Trabalho (PGR).
   Indício não é diagnóstico: a avaliação do risco é do SESMT, com método técnico.
   Registros: painel 'nr1', coleções 'acoes', 'comunic' e 'config'.
   ===================================================================== */
window.CRV_NR1_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, fMat, fDias, podeVer, podeEditar, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF, centralChave } = X;
const NR1_FATORES = [
  'Assédio de qualquer natureza no trabalho',
  'Má gestão de mudanças organizacionais',
  'Baixa clareza de papel/função',
  'Baixas recompensas e reconhecimento',
  'Falta de suporte/apoio no trabalho',
  'Baixo controle no trabalho/falta de autonomia',
  'Baixa justiça organizacional',
  'Eventos violentos ou traumáticos',
  'Baixa demanda no trabalho (subcarga)',
  'Excesso de demandas no trabalho (sobrecarga)',
  'Maus relacionamentos no local de trabalho',
  'Trabalho em condições de difícil comunicação',
  'Trabalho remoto e isolado'
];
const NR1_ST = { nao:'Não iniciada', and:'Em andamento', ok:'Concluída' };
const NR1_TIPOS_COM = ['DDS', 'Reunião', 'Treinamento', 'Mural / comunicado', 'E-mail', 'Outro'];
// perguntas da Pulse (índice em r[4]) que se aproximam de um fator do guia: relação feita pelo RH, a confirmar com o SESMT
const NR1_PULSE = [[0, 'Respeito da liderança', 4], [1, 'Clareza do trabalho', 2], [2, 'Recursos para trabalhar', 4], [3, 'Comunicação na área', 11], [4, 'Reconhecimento', 3], [8, 'Ambiente da área', 10]];
const NR1_PSEUDO = /^(afastados|desistentes)$/i;
const NR1_MOT = /lideran|ambiente|ass[eé]dio|relacion|chefia|persegui/i;
const NR1_TREIN = /ass[eé]dio|psicossoc|sa[uú]de mental|nr.?1\b|comunica[cç][aã]o|lideran|emocion|respeito|[eé]tica e conduta|conduta funcional/i;
let NR1_CACHE = null;

const nr1Hoje = () => new Date().toISOString().slice(0, 10);
const nr1Num = (v, d = 1) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits:d, maximumFractionDigits:d });

async function nr1Regs(col){ return (await window.CRV_REGS('nr1', col)).filter(x => !x.excluida); }
async function nr1Salvar(col, id, dados){
  const { error } = await sb.from('registros').upsert({ painel:'nr1', caminho:col + '/' + id, colecao:col, doc_id:id, dados, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
  if (error) throw error;
  try { localStorage.removeItem(centralChave()); } catch(_){}
}
const nr1Id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- indícios ---------- */
async function nr1Dados(){
  const Q = await window.CRV_QUADRO(); if (!Q) return null;
  const ano = nr1Hoje().slice(0, 4), ini = ano + '-01-01', fim = ano + '-12-31';
  const M = Q.mapa, mats = Object.keys(M);
  const G = {}; const ga = a => G[a] || (G[a] = { area:a, n:0, at:{}, fa:{}, san:{}, sai:[], ouv:[], ent:[] });
  const areaDe = c => c.area || 'Sem área no Quadro';
  mats.forEach(m => { const c = M[m]; if (c.situacao === 'Ativo' && !NR1_PSEUDO.test(c.area)) ga(areaDe(c)).n++; });
  // índice de setor/gerência → área (para localizar as ouvidorias, que vêm com o nome do setor)
  const IX = {}; mats.forEach(m => { const c = M[m]; if (!c.area || NR1_PSEUDO.test(c.area)) return; [c.setor, c.gerencia].forEach(s => { const k = normal(s); if (!k) return; const o = IX[k] || (IX[k] = {}); o[c.area] = (o[c.area] || 0) + 1; }); });
  const areaNorm = {}; Object.keys(G).forEach(a => areaNorm[normal(a)] = a);
  const localizar = s => { const k = normal(s); if (!k) return null; if (areaNorm[k]) return areaNorm[k];
    const cand = Object.keys(IX).filter(x => x === k || x.includes(k) || (k.length >= 6 && k.includes(x) && x.length >= 6));
    const tot = {}; cand.forEach(x => Object.entries(IX[x]).forEach(([a, n]) => tot[a] = (tot[a] || 0) + n));
    const best = Object.entries(tot).sort((a, b) => b[1] - a[1])[0]; return best ? best[0] : null; };
  const fontes = {};
  // atestados, faltas e sanções
  const O = await window.CRV_OCORR(mats, ini, fim);
  if (O.abs) fontes.abs = O.abs;
  Object.entries(O.P).forEach(([m, o]) => { const c = M[m]; if (!c || NR1_PSEUDO.test(c.area)) return; if (c.situacao === 'Desligado' && !(c.deslig >= ini)) return;
    const g = ga(areaDe(c));
    if (o.at.length) g.at[m] = o.at.length; if (o.fa.length) g.fa[m] = o.fa.length;
    const s = o.adv.length + o.sus.length; if (s) g.san[m] = s; });
  if (E.metas.sancoes) fontes.sanc = 1;
  // saídas do ano (Quadro) com tipo e motivo (Rescisões do Quadro: AXD.EXR)
  let EX = {}, TIP = [], MOT = [];
  try { const q = await window.CRV_DADOS('quadro'); const A = q && q.dados.AXD; if (A) { TIP = A.TIP || []; MOT = A.MOT || []; (A.EXR || []).forEach(r => { const m = fMat(r[0]); if (String(r[1]).slice(0, 4) === ano) EX[m] = r; }); fontes.sai = A.EXMAX || ''; } } catch(_){}
  mats.forEach(m => { const c = M[m]; if (c.situacao !== 'Desligado' || !(c.deslig >= ini && c.deslig <= fim)) return; if (NR1_PSEUDO.test(c.area)) return;
    const r = EX[m]; const tipo = r ? (TIP[r[3]] || '') : '', mot = r ? (r[4] || []).map(i => MOT[i]).filter(Boolean) : [];
    ga(areaDe(c)).sai.push({ mat:m, nome:c.nome, funcao:c.funcao, setor:c.setor, adm:c.admissao, deslig:c.deslig, tipo, mot, casa: c.admissao ? fDias(c.admissao, c.deslig) : null }); });
  // entrevistas de desligamento respondidas
  try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('colecao', 'entrevistas_resp').range(0, 4999);
    (data || []).map(x => x.dados).filter(v => v && !v.excluida && String(v.ped || v.dataAss || '').slice(0, 4) === ano).forEach(v => { const c = M[fMat(v.mat)];
      const a = c && !NR1_PSEUDO.test(c.area) ? areaDe(c) : (localizar(v.dep) || 'Sem área no Quadro');
      const neg = ['lid', 'amb'].filter(k => /regular|ruim|p[eé]ssim/i.test(v[k] || ''));
      ga(a).ent.push({ mat:fMat(v.mat), nome:v.nome, lid:v.lid || '', amb:v.amb || '', mot:v.mot || [], neg }); }); fontes.ent = 1; } catch(_){}
  // ouvidorias (planilha + cadastradas no app)
  let OUV = [];
  try { const o = await window.CRV_DADOS('ouvidorias'); if (o && Array.isArray(o.dados.RAW)) { fontes.ouv = o.referencia; o.dados.RAW.forEach(r => OUV.push({ data:r[0], setor:r[1], tipo:r[2], grav:r[3], desc:r[7] || '' })); }
    if (o) (await window.CRV_REGS('ouvidorias', 'casos')).filter(x => !x.excluida).forEach(x => OUV.push({ data:x.abertura, setor:x.area, tipo:x.tipo, grav:x.grav, desc:x.desc || '' })); } catch(_){}
  OUV = OUV.filter(x => String(x.data || '').slice(0, 4) === ano);
  OUV.forEach(x => { const a = localizar(x.setor); x.area = a || ''; ga(a || 'Outras (setor da ouvidoria não localizado no Quadro)').ouv.push(x); });
  // Pesquisa Pulse (anônima: só setores com 5 ou mais respostas)
  let PUL = null;
  try { const p = await window.CRV_DADOS('pesquisas'); const DB = p && p.dados.DB; if (DB && Array.isArray(DB.R)) { const R = DB.R.filter(r => r[7] !== 'c');
      const por = {}; R.forEach(r => (por[r[2]] = por[r[2]] || []).push(r));
      const med = (rs, j) => { const v = rs.map(r => r[4][j]).filter(x => x != null && x !== ''); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
      PUL = { datas:DB.D || [], ger:NR1_PULSE.map(([j]) => med(R, j)), n:R.length,
        S: Object.entries(por).filter(([, rs]) => rs.length >= 5).map(([s, rs]) => ({ setor:String(DB.S[s] || ''), n:rs.length, v:NR1_PULSE.map(([j]) => med(rs, j)) })).sort((a, b) => a.setor.localeCompare(b.setor, 'pt-BR')) };
      fontes.pul = (DB.D || []).slice(-1)[0] || p.referencia; } } catch(_){}
  // treinamentos ligados ao tema
  let TR = [];
  try { const t = await window.CRV_DADOS('treinamentos'); const D = t && t.dados.DATA; if (D) { fontes.tre = D.ref || t.referencia;
      (D.rows || []).forEach(r => { if (r[5] && String(r[5]).slice(0, 4) === ano && NR1_TREIN.test(r[1] || '') && !/food|vigil|higiene/i.test(r[1])) TR.push({ tema:r[1], data:r[5], setor:(D.setores || [])[r[3]] || '', n:r[6] || 0, h:r[7] || 0 }); }); }
    (await window.CRV_REGS('treinamentos', 'novos')).filter(x => !x.excluido && x.data && String(x.data).slice(0, 4) === ano && NR1_TREIN.test(x.titulo || '')).forEach(x => TR.push({ tema:String(x.titulo).toUpperCase(), data:x.data, setor:'', n:parseInt(x.n, 10) || 0, h:parseFloat(x.h) || 0 }));
    TR.sort((a, b) => a.data.localeCompare(b.data)); } catch(_){}
  // indicadores por área e pontos de atenção (comparados com a média da empresa)
  const L = Object.values(G).filter(g => g.n || g.ouv.length || g.sai.length);
  const soma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  L.forEach(g => { g.dAt = soma(g.at); g.dFa = soma(g.fa); g.dSan = soma(g.san); g.vol = g.sai.filter(x => /pedido/i.test(x.tipo)).length; g.s90 = g.sai.filter(x => x.casa != null && x.casa <= 90).length;
    g.sMot = g.sai.filter(x => x.mot.some(t => NR1_MOT.test(t))).length; g.oAss = g.ouv.filter(x => /ass[eé]dio/i.test(x.tipo)).length; g.eNeg = g.ent.filter(x => x.neg.length).length;
    g.tAt = g.n ? g.dAt / g.n : null; g.tFa = g.n ? g.dFa / g.n : null; g.tSan = g.n ? g.dSan / g.n : null; g.tSai = g.n ? g.sai.length / g.n : null; });
  const N = L.reduce((a, g) => a + g.n, 0) || 1;
  const MED = { tAt: L.reduce((a, g) => a + g.dAt, 0) / N, tFa: L.reduce((a, g) => a + g.dFa, 0) / N, tSan: L.reduce((a, g) => a + g.dSan, 0) / N, tSai: L.reduce((a, g) => a + g.sai.length, 0) / N };
  const ROT = { tAt:'dias de atestado por colaborador', tFa:'faltas por colaborador', tSan:'sanções por colaborador', tSai:'saídas por colaborador' };
  const CUR = { tAt:'Atestados', tFa:'Faltas', tSan:'Sanções', tSai:'Saídas' };
  const tSai = L.reduce((a, g) => a + g.sai.length, 0), pMot = tSai ? L.reduce((a, g) => a + g.sMot, 0) / tSai : 0;
  MED.pMot = pMot;
  L.forEach(g => { g.pts = [];
    if (g.n >= 15) Object.keys(ROT).forEach(k => { const cnt = k === 'tAt' ? g.dAt : k === 'tFa' ? g.dFa : k === 'tSan' ? g.dSan : g.sai.length;
      if (MED[k] > 0 && g[k] >= 1.5 * MED[k] && cnt >= 3) g.pts.push({ k, c:`${CUR[k]} ${nr1Num(g[k] / MED[k], 1)}×`, t:`${nr1Num(g[k] / MED[k], 1)}× a média em ${ROT[k]}` }); });
    if (g.oAss) g.pts.push({ k:'oAss', c:`Assédio (${g.oAss})`, t:`${g.oAss} ouvidoria${g.oAss > 1 ? 's' : ''} de assédio no ano` });
    if (g.sMot >= 3 && g.sai.length >= 5 && pMot > 0 && g.sMot / g.sai.length >= 1.5 * pMot) g.pts.push({ k:'sMot', c:`Liderança/ambiente (${g.sMot})`, t:`${g.sMot} de ${g.sai.length} saídas citando liderança ou ambiente (${Math.round(100 * g.sMot / g.sai.length)}%, empresa ${Math.round(100 * pMot)}%)` });
    if (g.s90 >= 5 && g.sai.length && g.s90 / g.sai.length >= .5) g.pts.push({ k:'s90', c:`Até 90 dias (${g.s90})`, t:`${g.s90} de ${g.sai.length} saídas com até 90 dias de casa` }); });
  L.sort((a, b) => b.pts.length - a.pts.length || b.n - a.n);
  const D = { ano, L, MED, OUV, PUL, TR, fontes, refQ:Q.referencia, total:N, M };
  NR1_CACHE = D; return D;
}

/* relação dos 13 fatores com o que o RH já tem: indício, não avaliação */
function nr1Fatores(D, ACO){
  const F = NR1_FATORES.map((nome, i) => ({ i, nome, ind:[], acoes:ACO.filter(a => a.fator === nome) }));
  const add = (i, t) => F[i].ind.push(t);
  const oT = re => D.OUV.filter(x => re.test(x.tipo || ''));
  const oa = oT(/ass[eé]dio/i); if (oa.length) add(0, `${oa.length} ouvidoria${oa.length > 1 ? 's' : ''} de assédio no ano (${[...new Set(oa.map(x => x.setor))].slice(0, 4).join(', ')}${new Set(oa.map(x => x.setor)).size > 4 ? '…' : ''})`);
  const ta = D.TR.filter(x => /ass[eé]dio/i.test(x.tema)); if (ta.length) add(0, `Treinamento sobre assédio: ${ta.map(x => x.tema.toLowerCase()).join('; ')}`);
  const orl = oT(/relacion|conflit/i); if (orl.length) add(10, `${orl.length} ouvidoria${orl.length > 1 ? 's' : ''} de relacionamento ou conflito`);
  const oc = oT(/comunica/i); if (oc.length) add(11, `${oc.length} ouvidoria${oc.length > 1 ? 's' : ''} sobre comunicação`);
  const sai = D.L.flatMap(g => g.sai), sl = sai.filter(x => x.mot.some(t => /lideran|chefia/i.test(t))).length, sa = sai.filter(x => x.mot.some(t => /ambiente|relacion|ass[eé]dio/i.test(t))).length;
  if (sl) add(4, `${sl} saída${sl > 1 ? 's' : ''} no ano com motivo "Liderança"`);
  if (sa) add(10, `${sa} saída${sa > 1 ? 's' : ''} no ano com motivo "Ambiente de trabalho"`);
  const en = D.L.reduce((a, g) => a + g.ent.filter(x => x.neg.includes('lid')).length, 0); if (en) add(4, `${en} entrevista${en > 1 ? 's' : ''} de desligamento com liderança avaliada como regular ou ruim`);
  const enA = D.L.reduce((a, g) => a + g.ent.filter(x => x.neg.includes('amb')).length, 0); if (enA) add(10, `${enA} entrevista${enA > 1 ? 's' : ''} de desligamento com ambiente regular ou ruim`);
  if (D.PUL) NR1_PULSE.forEach(([, rot, fi], k) => { const b = D.PUL.S.filter(s => s.v[k] != null && s.v[k] < 7); if (b.length) add(fi, `Pulse "${rot}" abaixo de 7 em ${b.length} setor${b.length > 1 ? 'es' : ''}: ${b.slice(0, 4).map(s => s.setor.toLowerCase()).join(', ')}${b.length > 4 ? '…' : ''}`); });
  return F;
}

/* ---------- pendências para a Central de Rotinas do RH ---------- */
const nr1Pendencias = async function(){
  const p = E.paineis.find(x => x.id === 'nr1'); if (!p || !podeVer(p)) return [];
  const A = (await nr1Regs('acoes')).filter(a => a.status !== 'ok' && a.prazo);
  const h = nr1Hoje(), em7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const atr = A.filter(a => a.prazo < h), prox = A.filter(a => a.prazo >= h && a.prazo <= em7), out = [];
  const it = a => ({ nome:a.acao, mat:'', det:`${a.area || 'Todas as áreas'} · ${a.resp || 'sem responsável'} · prazo ${brD(a.prazo)}` });
  if (atr.length) out.push({ id:'nr1-atr', sev:'crit', t:'Ações do plano NR-1 com prazo vencido', painel:'nr1', acao:'plano', pnome:'Riscos Psicossociais (NR-1)', d:'Atualize o andamento ou o prazo: o fiscal pede plano com responsável, prazo e acompanhamento.', itens:atr.map(it) });
  if (prox.length) out.push({ id:'nr1-prox', sev:'warn', t:'Ações do plano NR-1 vencendo em 7 dias', painel:'nr1', acao:'plano', pnome:'Riscos Psicossociais (NR-1)', d:'', itens:prox.map(it) });
  return out;
};

/* ---------- tela ---------- */
async function telaNR1(p, cfg, acao){
  const pode = podeEditar(p);
  const ABAS = [['geral', 'Visão geral'], ['areas', 'Indícios por área'], ['fatores', 'Os 13 fatores'], ['plano', 'Plano de ação'], ['com', 'Comunicações e evidências']];
  let aba = ABAS.some(a => a[0] === acao) ? acao : 'geral';
  moldura(`<div class="trilha"><button data-ir="#/">Visão Geral</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
    <section class="ini-topo"><div><div class="ini-eyebrow">${esc(p.frente)}</div><h1>Riscos Psicossociais (NR-1)</h1><div class="ini-data">O que o RH já tem de indício por área, o plano de ação e as evidências para o PGR</div></div>
      <div class="dk-acoes"><button class="btn borda" id="nr-xls">Excel</button><button class="btn borda" id="nr-pdf">PDF</button></div></section>
    <nav class="vista-seg" id="nr-abas">${ABAS.map(a => `<button data-a="${a[0]}" class="${a[0] === aba ? 'on' : ''}">${a[1]}</button>`).join('')}</nav>
    <div id="nr-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Juntando os indícios dos painéis…</p></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  let D, ACO = [], COM = [], CFG = {};
  try { [D, ACO, COM, CFG] = await Promise.all([nr1Dados(), nr1Regs('acoes'), nr1Regs('comunic'), nr1Regs('config').then(L => L.find(x => x._id === 'metodo') || {})]); } catch(e){ console.warn('nr1', e); }
  const corpo = $('#nr-corpo'); if (!corpo) return;
  if (!D) { corpo.innerHTML = '<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3><p>Os indícios por área usam o Quadro Geral. Carregue o Quadro e volte aqui.</p></div>'; return; }
  const recarregar = async () => { [ACO, COM, CFG] = await Promise.all([nr1Regs('acoes'), nr1Regs('comunic'), nr1Regs('config').then(L => L.find(x => x._id === 'metodo') || {})]); desenhar(); };
  $('#nr-abas').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { aba = b.dataset.a; $('#nr-abas').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); try { history.replaceState(null, '', '#/p/nr1' + (aba === 'geral' ? '' : '/' + aba)); } catch(_){} desenhar(); });
  const h = nr1Hoje();
  const atrasada = a => a.status !== 'ok' && a.prazo && a.prazo < h;
  const fonteTxt = () => { const f = D.fontes, s = [`Quadro de ${brD(D.refQ)}`];
    if (f.abs) s.push(`atestados e faltas até ${brD(f.abs)}`); if (f.sanc) s.push('sanções'); if (f.sai) s.push(`saídas até ${brD(f.sai)}`); if (f.ouv !== undefined) s.push('ouvidorias'); if (f.pul) s.push(`Pulse de ${brD(f.pul)}`); if (f.tre) s.push('treinamentos');
    return `Ano de ${D.ano}. Fontes: ${s.join(', ')}.`; };

  // lista de pessoas por trás de um número
  const pessoas = (titulo, cab, linhas) => abrirModal({ titulo, largo:true, corpo: linhas.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr>${cab.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map(l => `<tr>${l.map((v, i) => `<td>${i === 0 && l._mat ? `<a class="cd-fl" href="#/ficha/${esc(l._mat)}">${esc(v)}</a>` : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Ninguém nesta lista.</p>',
    aoAbrir: m => m.querySelectorAll('a.cd-fl').forEach(a => a.onclick = () => fecharModal()) });
  const lin = (mat, arr) => { const l = arr; l._mat = mat; return l; };
  const M = D.M;
  const abrirNum = (g, k) => {
    const pm = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([m, n]) => { const c = M[m] || {}; return lin(m, [c.nome || m, m, c.funcao || '', c.setor || '', String(n)]); });
    if (k === 'at') return pessoas(`${g.area}: dias de atestado em ${D.ano}`, ['Colaborador', 'Matrícula', 'Função', 'Seção', 'Dias'], pm(g.at));
    if (k === 'fa') return pessoas(`${g.area}: faltas em ${D.ano}`, ['Colaborador', 'Matrícula', 'Função', 'Seção', 'Faltas'], pm(g.fa));
    if (k === 'san') return pessoas(`${g.area}: advertências e suspensões em ${D.ano}`, ['Colaborador', 'Matrícula', 'Função', 'Seção', 'Sanções'], pm(g.san));
    if (k === 'sai' || k === 'vol' || k === 's90' || k === 'sMot') { const f = k === 'vol' ? x => /pedido/i.test(x.tipo) : k === 's90' ? x => x.casa != null && x.casa <= 90 : k === 'sMot' ? x => x.mot.some(t => NR1_MOT.test(t)) : () => true;
      return pessoas(`${g.area}: saídas em ${D.ano}`, ['Colaborador', 'Matrícula', 'Função', 'Saída', 'Dias de casa', 'Tipo e motivo'], g.sai.filter(f).sort((a, b) => b.deslig.localeCompare(a.deslig)).map(x => lin(x.mat, [x.nome, x.mat, x.funcao, brD(x.deslig), x.casa == null ? '' : String(x.casa), [x.tipo, x.mot.join(', ')].filter(Boolean).join(' · ')]))); }
    if (k === 'ouv') return pessoas(`${g.area}: ouvidorias em ${D.ano}`, ['Data', 'Setor', 'Tipo', 'Gravidade', 'Resumo'], g.ouv.slice().sort((a, b) => String(b.data).localeCompare(String(a.data))).map(x => [brD(x.data), x.setor, x.tipo, x.grav, x.desc]));
    if (k === 'ent') return pessoas(`${g.area}: entrevistas de desligamento em ${D.ano}`, ['Colaborador', 'Matrícula', 'Liderança', 'Ambiente', 'Motivo da saída'], g.ent.map(x => lin(x.mat, [x.nome, x.mat, x.lid || '—', x.amb || '—', (x.mot || []).join(', ')])));
  };

  function desenhar(){
    const c = $('#nr-corpo'); if (!c) return;
    if (aba === 'geral') c.innerHTML = vGeral(); else if (aba === 'areas') c.innerHTML = vAreas(); else if (aba === 'fatores') c.innerHTML = vFatores(); else if (aba === 'plano') c.innerHTML = vPlano(); else c.innerHTML = vCom();
    c.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
    c.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => $('#nr-abas [data-a="' + b.dataset.ab + '"]').click());
    c.querySelectorAll('[data-num]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.num.split('|'); abrirNum(D.L[+i], k); });
    c.querySelectorAll('[data-area]').forEach(b => b.onclick = () => abrirArea(D.L[+b.dataset.area]));
    c.querySelectorAll('[data-nova]').forEach(b => b.onclick = () => formAcao(null, b.dataset.nova ? JSON.parse(b.dataset.nova) : {}));
    c.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => formAcao(ACO.find(a => a._id === b.dataset.ed)));
    c.querySelectorAll('[data-edc]').forEach(b => b.onclick = () => formCom(COM.find(a => a._id === b.dataset.edc)));
    c.querySelectorAll('[data-novac]').forEach(b => b.onclick = () => formCom(null));
    const fm = c.querySelector('#nr-met'); if (fm) fm.onclick = formMetodo;
    c.querySelectorAll('[data-fst]').forEach(b => b.onclick = () => { FP.st = b.dataset.fst; desenhar(); });
    const fq = c.querySelector('#nr-fq'); if (fq) fq.oninput = () => { FP.q = fq.value; clearTimeout(fq._t); fq._t = setTimeout(() => { desenhar(); const e = $('#nr-fq'); if (e) { e.focus(); e.setSelectionRange(FP.q.length, FP.q.length); } }, 250); };
  }
  const FP = { st:'abertas', q:'' };

  function vGeral(){
    const comPts = D.L.filter(g => g.pts.length && !/^Outras/.test(g.area));
    const oAss = D.OUV.filter(x => /ass[eé]dio/i.test(x.tipo || '')).length;
    const abertas = ACO.filter(a => a.status !== 'ok'), atr = ACO.filter(atrasada);
    const met = CFG.instrumento ? `<b>${esc(CFG.instrumento)}</b>${CFG.aplicadoEm ? ' · aplicado em ' + esc(brD(CFG.aplicadoEm)) : ''}${CFG.resp ? ' · ' + esc(CFG.resp) : ''}${CFG.revisao ? ` · próxima revisão <b class="${CFG.revisao < h ? 'nr-atr' : ''}">${esc(brD(CFG.revisao))}</b>` : ''}` : '<b class="nr-atr">A definir com a Segurança do Trabalho</b>';
    const top = comPts.flatMap(g => g.pts.map(pt => ({ g, pt }))).slice(0, 8);
    return `<section class="dk-kpis">
        <button class="dk-k" data-ab="areas" style="--c:var(--coral)"><span>Áreas com ponto de atenção</span><b>${comPts.length}</b><small>de ${D.L.filter(g => g.n).length} áreas do Quadro</small></button>
        <button class="dk-k" data-ab="fatores" style="--c:#8e3b6a"><span>Ouvidorias de assédio</span><b>${oAss}</b><small>em ${D.ano}, de ${D.OUV.length} ouvidorias</small></button>
        <button class="dk-k" data-ab="plano" style="--c:${atr.length ? 'var(--coral)' : 'var(--amber)'}"><span>Ações em aberto</span><b>${abertas.length}</b><small>${atr.length ? `<b class="nr-atr">${atr.length} com prazo vencido</b>` : ACO.length ? ACO.filter(a => a.status === 'ok').length + ' concluídas' : 'nenhuma ação cadastrada'}</small></button>
        <button class="dk-k" data-ab="com" style="--c:var(--cane)"><span>Comunicações registradas</span><b>${COM.length}</b><small>+ ${D.TR.length} treinamento${D.TR.length === 1 ? '' : 's'} ligados ao tema</small></button></section>
      <section class="cartao nr-met"><div><span class="nr-rot">Avaliação técnica do risco (PGR)</span><div>${met}</div><small>O inventário e a classificação do risco são da Segurança do Trabalho, com questionário validado. O RH registra aqui o método usado e as datas.</small></div>${pode ? '<button class="btn borda" id="nr-met">Registrar</button>' : ''}</section>
      <div class="fc-grade">
        <section class="fc-sec cartao"><header><h3>Principais pontos de atenção</h3><small>comparados com a média da empresa</small></header>
          ${top.length ? `<div class="nr-pts">${top.map(({ g, pt }) => `<button class="nr-pt" data-num="${D.L.indexOf(g)}|${{ tAt:'at', tFa:'fa', tSan:'san', tSai:'sai', oAss:'ouv', sMot:'sMot', s90:'s90' }[pt.k]}"><b>${esc(g.area)}</b><span>${esc(pt.t)}</span></button>`).join('')}</div>` : '<p class="fc-vz">Nenhuma área acima do critério de atenção.</p>'}
          <p class="nr-nota">Critério: área com 15 ou mais colaboradores e indicador 1,5 vez acima da média da empresa; ouvidoria de assédio; proporção de saídas citando liderança ou ambiente 1,5 vez acima da empresa; ou metade das saídas com até 90 dias de casa. É indício para investigar, não diagnóstico.</p></section>
        <section class="fc-sec cartao"><header><h3>O que a NR-1 pede</h3></header><ul class="nr-lista">
          <li><b>Desde 26/05/2026</b> os fatores de risco psicossociais fazem parte obrigatória do PGR.</li>
          <li><b>Identificar e avaliar</b> por setor, com método técnico (não basta pesquisa de clima).</li>
          <li><b>Plano de ação</b> com responsável, prazo e indicador de acompanhamento.</li>
          <li><b>Comunicar</b> os trabalhadores e guardar a comprovação.</li>
          <li><b>Revisar</b> periodicamente.</li></ul>
          <p class="nr-nota">Orientação geral para organizar as evidências do RH. A interpretação legal e o PGR ficam com a Segurança do Trabalho e o jurídico.</p></section>
      </div>
      <p class="nr-fonte">${esc(fonteTxt())}</p>`;
  }

  function vAreas(){
    const cel = (g, i, k, v, txt, alerta) => v ? `<button class="nr-n ${alerta ? 'al' : ''}" data-num="${i}|${k}">${txt}</button>` : '<span class="nr-z">0</span>';
    const fl = (g, k) => g.pts.some(p => p.k === k);
    const L = D.L;
    return `<section class="cartao nr-leg"><b>Como ler:</b> cada número abre as pessoas por trás dele. Em destaque, o que está 1,5 vez acima da média da empresa (áreas com 15 ou mais colaboradores). Médias da empresa: <b>${nr1Num(D.MED.tAt)}</b> dias de atestado, <b>${nr1Num(D.MED.tFa)}</b> faltas e <b>${nr1Num(D.MED.tSan, 2)}</b> sanções por colaborador no ano.</section>
      <section class="fc-sec cartao"><div class="fc-tw"><table class="fc-t nr-t"><thead><tr><th>Área</th><th>Pontos de atenção</th><th>Ativos</th><th>Atestados<br><small>dias · por colab.</small></th><th>Faltas<br><small>total · por colab.</small></th><th>Sanções</th><th>Saídas<br><small>total · pedidos</small></th><th>Até 90 dias</th><th>Liderança ou ambiente<br><small>saídas · entrevistas</small></th><th>Ouvidorias<br><small>total · assédio</small></th></tr></thead>
        <tbody>${L.map((g, i) => `<tr class="${g.pts.length ? 'nr-com' : ''}"><td><button class="nr-ar" data-area="${i}">${esc(g.area)}</button></td><td class="nr-pc">${g.pts.length ? g.pts.map(p => `<span class="fc-a ${p.k === 'oAss' ? 'crit' : ''}" title="${esc(p.t)}">${esc(p.c)}</span>`).join(' ') : '<span class="nr-z">—</span>'}</td><td>${g.n || '—'}</td>
          <td>${cel(g, i, 'at', g.dAt, `${g.dAt} <small>· ${g.n ? nr1Num(g.tAt) : '—'}</small>`, fl(g, 'tAt'))}</td>
          <td>${cel(g, i, 'fa', g.dFa, `${g.dFa} <small>· ${g.n ? nr1Num(g.tFa) : '—'}</small>`, fl(g, 'tFa'))}</td>
          <td>${cel(g, i, 'san', g.dSan, String(g.dSan), fl(g, 'tSan'))}</td>
          <td>${cel(g, i, 'sai', g.sai.length, `${g.sai.length} <small>· ${g.vol}</small>`, fl(g, 'tSai'))}</td>
          <td>${cel(g, i, 's90', g.s90, String(g.s90), fl(g, 's90'))}</td>
          <td>${g.sMot || g.eNeg ? `${cel(g, i, 'sMot', g.sMot, String(g.sMot), fl(g, 'sMot'))} · ${cel(g, i, 'ent', g.ent.length, String(g.eNeg), false)}` : '<span class="nr-z">0</span>'}</td>
          <td>${cel(g, i, 'ouv', g.ouv.length, `${g.ouv.length} <small>· ${g.oAss}</small>`, g.oAss > 0)}</td>
</tr>`).join('')}</tbody></table></div></section>
      ${D.PUL ? `<section class="fc-sec cartao"><header><h3>Pesquisa Pulse: percepção por setor</h3><small>anônima · só setores com 5 ou mais respostas · nota de 0 a 10</small></header>
        <div class="fc-tw"><table class="fc-t nr-t"><thead><tr><th>Setor</th><th>Respostas</th>${NR1_PULSE.map(q => `<th title="Relação com o fator: ${esc(NR1_FATORES[q[2]])}">${esc(q[1])}</th>`).join('')}</tr></thead>
          <tbody><tr class="nr-tot"><td>Empresa</td><td>${D.PUL.n}</td>${D.PUL.ger.map(v => `<td>${v == null ? '—' : nr1Num(v)}</td>`).join('')}</tr>${D.PUL.S.map(s => `<tr><td>${esc(s.setor)}</td><td>${s.n}</td>${s.v.map(v => `<td class="${v != null && v < 7 ? 'nr-bx' : ''}">${v == null ? '—' : nr1Num(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="nr-nota">Abaixo de 7 em destaque (o mesmo critério do painel de Pesquisas). Os nomes dos setores são os da pesquisa, que nem sempre batem com as áreas do Quadro.</p></section>` : ''}
      <p class="nr-fonte">${esc(fonteTxt())} Afastados e desistentes do Quadro ficam fora da conta por área.</p>`;
  }
  function abrirArea(g){
    const i = D.L.indexOf(g);
    const lin2 = (rot, k, v, extra) => `<button class="nr-li" data-k="${k}"><span>${rot}</span><b>${v}</b>${extra ? `<small>${extra}</small>` : ''}</button>`;
    abrirModal({ titulo:g.area, largo:true, corpo:`${g.pts.length ? `<div class="fc-al">${g.pts.map(p => `<span class="fc-a ${p.k === 'oAss' ? 'crit' : ''}">${esc(p.t)}</span>`).join('')}</div>` : '<p class="fc-vz">Sem ponto de atenção pelo critério do painel.</p>'}
      <div class="nr-lis">${lin2('Dias de atestado', 'at', g.dAt, g.n ? nr1Num(g.tAt) + ' por colaborador (empresa ' + nr1Num(D.MED.tAt) + ')' : '')}${lin2('Faltas', 'fa', g.dFa, g.n ? nr1Num(g.tFa) + ' por colaborador (empresa ' + nr1Num(D.MED.tFa) + ')' : '')}${lin2('Advertências e suspensões', 'san', g.dSan, '')}
        ${lin2('Saídas no ano', 'sai', g.sai.length, g.vol + ' por pedido de demissão')}${lin2('Saídas com até 90 dias', 's90', g.s90, '')}${lin2('Saídas citando liderança ou ambiente', 'sMot', g.sMot, '')}
        ${lin2('Entrevistas de desligamento', 'ent', g.ent.length, g.eNeg + ' com liderança ou ambiente regular/ruim')}${lin2('Ouvidorias', 'ouv', g.ouv.length, g.oAss + ' de assédio')}</div>
      ${pode ? `<div style="margin-top:14px"><button class="btn prim" id="nr-aa">+ Ação do plano para esta área</button></div>` : ''}`,
      aoAbrir: m => { m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => abrirNum(g, b.dataset.k)); const a = m.querySelector('#nr-aa'); if (a) a.onclick = () => formAcao(null, { area:g.area }); } });
  }

  function vFatores(){
    const F = nr1Fatores(D, ACO);
    return `<section class="cartao nr-leg">Os 13 fatores do <b>Guia de fatores de riscos psicossociais do Ministério do Trabalho</b>. Ao lado de cada um, o que o RH já tem de indício e as ações do plano. A relação entre o dado do RH e o fator é uma leitura do RH: <b>quem avalia o risco é a Segurança do Trabalho</b>.</section>
      <section class="nr-fat">${F.map(f => { const ab = f.acoes.filter(a => a.status !== 'ok').length, ok = f.acoes.length - ab, at = f.acoes.filter(atrasada).length;
        return `<article class="nr-f ${f.ind.length ? 'com' : ''}"><header><span class="nr-fi">${f.i + 1}</span><h4>${esc(f.nome)}</h4></header>
          ${f.ind.length ? `<ul>${f.ind.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="nr-sd">Sem dado no app sobre este fator. Depende da avaliação da Segurança do Trabalho.</p>'}
          <footer><span>${f.acoes.length ? `${f.acoes.length} ação${f.acoes.length > 1 ? 'ões' : ''}: ${ab} em aberto${at ? ` (<b class="nr-atr">${at} vencida${at > 1 ? 's' : ''}</b>)` : ''}, ${ok} concluída${ok === 1 ? '' : 's'}` : 'Nenhuma ação'}</span>${pode ? `<button class="btn borda" data-nova='${esc(JSON.stringify({ fator:f.nome }))}'>+ Ação</button>` : ''}</footer></article>`; }).join('')}</section>`;
  }

  function vPlano(){
    const q = normal(FP.q);
    const base = ACO.filter(a => !q || normal([a.acao, a.area, a.resp, a.fator].join(' ')).includes(q));
    const L = base.filter(a => FP.st === 'todas' ? true : FP.st === 'atr' ? atrasada(a) : FP.st === 'ok' ? a.status === 'ok' : a.status !== 'ok')
      .sort((a, b) => (a.status === 'ok') - (b.status === 'ok') || String(a.prazo || '9').localeCompare(String(b.prazo || '9')));
    const n = f => base.filter(f).length;
    return `<section class="dk-kpis">
        <button class="dk-k ${FP.st === 'abertas' ? 'on' : ''}" data-fst="abertas" style="--c:var(--amber)"><span>Em aberto</span><b>${n(a => a.status !== 'ok')}</b></button>
        <button class="dk-k ${FP.st === 'atr' ? 'on' : ''}" data-fst="atr" style="--c:var(--coral)"><span>Prazo vencido</span><b>${n(atrasada)}</b></button>
        <button class="dk-k ${FP.st === 'ok' ? 'on' : ''}" data-fst="ok" style="--c:var(--cane)"><span>Concluídas</span><b>${n(a => a.status === 'ok')}</b></button>
        <button class="dk-k ${FP.st === 'todas' ? 'on' : ''}" data-fst="todas" style="--c:#2f6fa8"><span>Todas</span><b>${base.length}</b></button></section>
      <section class="dk-filtros cartao"><input id="nr-fq" type="search" placeholder="Buscar ação, área, responsável ou fator" value="${esc(FP.q)}">${pode ? '<button class="btn prim" data-nova="">+ Nova ação</button>' : ''}</section>
      <section class="dk-lista">${L.length ? L.map(a => `<article class="dk-p nr-a ${a.status === 'ok' ? 'feito' : atrasada(a) ? 'atr' : ''}">
          <div class="dk-quem"><b>${esc(a.acao)}</b><span>${esc(a.fator || 'Geral')}</span><span>${esc(a.area || 'Todas as áreas')}</span></div>
          <div class="nr-ad"><div><small>Responsável</small><b>${esc(a.resp || '—')}</b></div><div><small>Prazo</small><b class="${atrasada(a) ? 'nr-atr' : ''}">${esc(brD(a.prazo) || '—')}</b></div><div><small>Situação</small><b>${esc(NR1_ST[a.status] || NR1_ST.nao)}</b></div>
            ${a.indicador ? `<div class="w"><small>Como acompanhar</small><span>${esc(a.indicador)}</span></div>` : ''}${a.evid ? `<div class="w"><small>Andamento e evidência</small><span>${esc(a.evid)}</span></div>` : ''}
            ${pode ? `<div class="w nr-ab"><button class="btn borda" data-ed="${esc(a._id)}">Editar</button></div>` : ''}</div></article>`).join('')
        : `<div class="cartao vazio"><h3>${ACO.length ? 'Nada com esses filtros' : 'Nenhuma ação cadastrada'}</h3>${!ACO.length ? '<p>Comece pelas áreas com ponto de atenção ou pelos fatores que têm indício.</p>' : ''}</div>`}</section>`;
  }

  function vCom(){
    const L = COM.slice().sort((a, b) => String(b.data).localeCompare(String(a.data)));
    return `<div class="fc-grade">
      <section class="fc-sec cartao" style="grid-column:1/-1"><header><h3>Comunicações aos trabalhadores</h3><small>DDS, reuniões, murais e e-mails sobre o tema</small>${pode ? '<button class="btn prim" data-novac>+ Registrar</button>' : ''}</header>
        ${L.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Data</th><th>Tipo</th><th>Tema</th><th>Área / público</th><th>Participantes</th><th>Responsável</th><th>Observação</th>${pode ? '<th></th>' : ''}</tr></thead><tbody>${L.map(x => `<tr><td>${esc(brD(x.data))}</td><td>${esc(x.tipo)}</td><td>${esc(x.tema)}</td><td>${esc(x.area || '')}</td><td>${esc(x.part || '')}</td><td>${esc(x.resp || '')}</td><td>${esc(x.obs || '')}</td>${pode ? `<td><button class="link" data-edc="${esc(x._id)}">editar</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nenhuma comunicação registrada. A NR-1 pede comprovação de que os trabalhadores foram informados.</p>'}</section>
      <section class="fc-sec cartao" style="grid-column:1/-1"><header><h3>Treinamentos ligados ao tema em ${D.ano}</h3><small>vêm do painel de Treinamentos (assédio, saúde mental, comunicação, liderança, inteligência emocional)</small></header>
        ${D.TR.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Data</th><th>Treinamento</th><th>Setor</th><th>Participantes</th><th>Horas</th></tr></thead><tbody>${D.TR.map(t => `<tr><td>${esc(brD(t.data))}</td><td>${esc(t.tema)}</td><td>${esc(t.setor)}</td><td>${t.n || ''}</td><td>${t.h ? nr1Num(t.h, t.h % 1 ? 1 : 0) : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nenhum treinamento com esses temas no ano.</p>'}</section></div>`;
  }

  /* formulários */
  const campo = (id, rot, html, w) => `<div class="nr-c ${w ? 'w' : ''}"><label for="${id}">${rot}</label>${html}</div>`;
  const areasOpc = sel => ['', ...D.L.filter(g => g.n).map(g => g.area)].map(a => `<option value="${esc(a)}" ${a === (sel || '') ? 'selected' : ''}>${a ? esc(a) : 'Todas as áreas'}</option>`).join('');
  function formAcao(a, pre){
    const x = Object.assign({ status:'nao' }, pre || {}, a || {});
    abrirModal({ titulo: a ? 'Editar ação' : 'Nova ação do plano', largo:true,
      corpo:`<div class="nr-form">
        ${campo('na-acao', 'Ação', `<textarea id="na-acao" rows="2" maxlength="400" placeholder="Ex.: Roda de conversa com a equipe e devolutiva ao gestor">${esc(x.acao || '')}</textarea>`, 1)}
        ${campo('na-fator', 'Fator (guia do MTE)', `<select id="na-fator"><option value="">Geral (vários fatores)</option>${NR1_FATORES.map(f => `<option ${f === x.fator ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select>`)}
        ${campo('na-area', 'Área', `<select id="na-area">${areasOpc(x.area)}</select>`)}
        ${campo('na-resp', 'Responsável', `<input id="na-resp" maxlength="120" value="${esc(x.resp || '')}" placeholder="Nome de quem conduz">`)}
        ${campo('na-prazo', 'Prazo', `<input type="date" id="na-prazo" value="${esc(x.prazo || '')}">`)}
        ${campo('na-st', 'Situação', `<select id="na-st">${Object.entries(NR1_ST).map(([k, v]) => `<option value="${k}" ${k === x.status ? 'selected' : ''}>${v}</option>`).join('')}</select>`)}
        ${campo('na-ind', 'Como acompanhar (indicador)', `<input id="na-ind" maxlength="200" value="${esc(x.indicador || '')}" placeholder="Ex.: ouvidorias da área no trimestre; nota de liderança na próxima Pulse">`, 1)}
        ${campo('na-ev', 'Andamento e evidência', `<textarea id="na-ev" rows="2" maxlength="600" placeholder="O que foi feito, datas, lista de presença, onde está o documento">${esc(x.evid || '')}</textarea>`, 1)}
        <p class="nr-msg" id="na-msg"></p></div>`,
      pe:`${a ? '<button class="btn borda perigo" id="na-del">Excluir</button>' : ''}<span style="flex:1"></span><button class="btn borda" id="na-c">Cancelar</button><button class="btn prim" id="na-ok">Salvar</button>`,
      aoAbrir: m => { m.querySelector('#na-c').onclick = fecharModal;
        const del = m.querySelector('#na-del'); if (del) del.onclick = async () => { if (del.dataset.conf !== '1') { del.dataset.conf = '1'; del.textContent = 'Confirmar exclusão'; return; }
          try { await nr1Salvar('acoes', a._id, Object.assign({}, a, { _id:undefined, excluida:true, excluidaEm:new Date().toISOString(), excluidaPor:E.perfil.nome })); fecharModal(); toast('Ação excluída.'); recarregar(); } catch(e){ toast(traduzErro(e), true); } };
        m.querySelector('#na-ok').onclick = async () => { const v = id => m.querySelector('#' + id).value.trim();
          const d = { acao:v('na-acao'), fator:v('na-fator'), area:v('na-area'), resp:v('na-resp'), prazo:v('na-prazo'), status:v('na-st'), indicador:v('na-ind'), evid:v('na-ev') };
          const falta = [!d.acao && 'ação', !d.resp && 'responsável', !d.prazo && 'prazo'].filter(Boolean);
          if (falta.length) { m.querySelector('#na-msg').textContent = 'Falta preencher: ' + falta.join(', ') + '.'; return; }
          const id = a ? a._id : nr1Id(); const ant = a || { criadoEm:new Date().toISOString(), criadoPor:E.perfil.nome };
          if (d.status === 'ok' && (!a || a.status !== 'ok')) d.concluidaEm = new Date().toISOString();
          try { await nr1Salvar('acoes', id, Object.assign({ criadoEm:ant.criadoEm, criadoPor:ant.criadoPor, concluidaEm:ant.concluidaEm || null }, d, { alteradoEm:new Date().toISOString(), alteradoPor:E.perfil.nome }));
            fecharModal(); toast('Ação salva.'); if (aba !== 'plano' && aba !== 'fatores') { aba = 'plano'; $('#nr-abas').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.a === 'plano')); } recarregar(); } catch(e){ toast(traduzErro(e), true); } };
        setTimeout(() => m.querySelector('#na-acao').focus(), 30); } });
  }
  function formCom(a){
    const x = a || { data:h, tipo:'DDS' };
    abrirModal({ titulo: a ? 'Editar comunicação' : 'Registrar comunicação', largo:true,
      corpo:`<div class="nr-form">
        ${campo('nc-data', 'Data', `<input type="date" id="nc-data" value="${esc(x.data || '')}">`)}
        ${campo('nc-tipo', 'Tipo', `<select id="nc-tipo">${NR1_TIPOS_COM.map(t => `<option ${t === x.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}
        ${campo('nc-tema', 'Tema', `<input id="nc-tema" maxlength="200" value="${esc(x.tema || '')}" placeholder="Ex.: Canal de denúncia e respeito no trabalho">`, 1)}
        ${campo('nc-area', 'Área / público', `<input id="nc-area" maxlength="120" value="${esc(x.area || '')}" placeholder="Ex.: Irrigação Localizada, turno A" list="nc-al"><datalist id="nc-al">${D.L.filter(g => g.n).map(g => `<option value="${esc(g.area)}">`).join('')}</datalist>`)}
        ${campo('nc-part', 'Participantes', `<input id="nc-part" inputmode="numeric" maxlength="6" value="${esc(x.part || '')}">`)}
        ${campo('nc-resp', 'Responsável', `<input id="nc-resp" maxlength="120" value="${esc(x.resp || '')}">`)}
        ${campo('nc-obs', 'Observação e onde está a comprovação', `<textarea id="nc-obs" rows="2" maxlength="600" placeholder="Ex.: lista de presença arquivada na pasta do SESMT">${esc(x.obs || '')}</textarea>`, 1)}
        <p class="nr-msg" id="nc-msg"></p></div>`,
      pe:`${a ? '<button class="btn borda perigo" id="nc-del">Excluir</button>' : ''}<span style="flex:1"></span><button class="btn borda" id="nc-c">Cancelar</button><button class="btn prim" id="nc-ok">Salvar</button>`,
      aoAbrir: m => { m.querySelector('#nc-c').onclick = fecharModal;
        const del = m.querySelector('#nc-del'); if (del) del.onclick = async () => { if (del.dataset.conf !== '1') { del.dataset.conf = '1'; del.textContent = 'Confirmar exclusão'; return; }
          try { await nr1Salvar('comunic', a._id, Object.assign({}, a, { _id:undefined, excluida:true, excluidaEm:new Date().toISOString(), excluidaPor:E.perfil.nome })); fecharModal(); toast('Registro excluído.'); recarregar(); } catch(e){ toast(traduzErro(e), true); } };
        m.querySelector('#nc-ok').onclick = async () => { const v = id => m.querySelector('#' + id).value.trim();
          const d = { data:v('nc-data'), tipo:v('nc-tipo'), tema:v('nc-tema'), area:v('nc-area'), part:v('nc-part').replace(/\D/g, ''), resp:v('nc-resp'), obs:v('nc-obs') };
          const falta = [!d.data && 'data', !d.tema && 'tema'].filter(Boolean);
          if (falta.length) { m.querySelector('#nc-msg').textContent = 'Falta preencher: ' + falta.join(', ') + '.'; return; }
          const id = a ? a._id : nr1Id();
          try { await nr1Salvar('comunic', id, Object.assign({ criadoEm:(a && a.criadoEm) || new Date().toISOString(), criadoPor:(a && a.criadoPor) || E.perfil.nome }, d)); fecharModal(); toast('Comunicação registrada.'); recarregar(); } catch(e){ toast(traduzErro(e), true); } }; } });
  }
  function formMetodo(){
    const x = CFG || {};
    abrirModal({ titulo:'Avaliação técnica do risco (PGR)', largo:true,
      corpo:`<p class="nr-nota" style="margin-top:0">Preencha com o que a Segurança do Trabalho informar. O painel não escolhe nem aplica o método.</p><div class="nr-form">
        ${campo('nm-ins', 'Questionário / método usado', `<input id="nm-ins" maxlength="160" value="${esc(x.instrumento || '')}" placeholder="Nome do questionário validado ou da metodologia">`, 1)}
        ${campo('nm-ap', 'Aplicado em', `<input type="date" id="nm-ap" value="${esc(x.aplicadoEm || '')}">`)}
        ${campo('nm-rv', 'Próxima revisão', `<input type="date" id="nm-rv" value="${esc(x.revisao || '')}">`)}
        ${campo('nm-resp', 'Responsável técnico (SESMT)', `<input id="nm-resp" maxlength="120" value="${esc(x.resp || '')}">`, 1)}
        ${campo('nm-obs', 'Observação', `<textarea id="nm-obs" rows="2" maxlength="600">${esc(x.obs || '')}</textarea>`, 1)}</div>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="nm-c">Cancelar</button><button class="btn prim" id="nm-ok">Salvar</button>`,
      aoAbrir: m => { m.querySelector('#nm-c').onclick = fecharModal;
        m.querySelector('#nm-ok').onclick = async () => { const v = id => m.querySelector('#' + id).value.trim();
          try { await nr1Salvar('config', 'metodo', { instrumento:v('nm-ins'), aplicadoEm:v('nm-ap'), revisao:v('nm-rv'), resp:v('nm-resp'), obs:v('nm-obs') }); fecharModal(); toast('Registrado.'); recarregar(); } catch(e){ toast(traduzErro(e), true); } }; } });
  }

  /* exportação: o usuário escolhe as partes; nada nominal sai no arquivo */
  const PARTES = [['areas', 'Indícios por área'], ['pulse', 'Pulse por setor'], ['fatores', 'Os 13 fatores'], ['plano', 'Plano de ação'], ['com', 'Comunicações'], ['trein', 'Treinamentos ligados ao tema']];
  const tabelas = () => {
    const F = nr1Fatores(D, ACO);
    return {
      areas: { t:'Indícios por área', cab:['Área', 'Ativos', 'Dias de atestado', 'Atestado por colab.', 'Faltas', 'Faltas por colab.', 'Sanções', 'Saídas', 'Pedidos de demissão', 'Saídas até 90 dias', 'Saídas liderança/ambiente', 'Entrevistas lid./amb. regular ou ruim', 'Ouvidorias', 'Ouvidorias de assédio', 'Pontos de atenção'],
        lin: D.L.map(g => [g.area, g.n, g.dAt, g.n ? nr1Num(g.tAt) : '', g.dFa, g.n ? nr1Num(g.tFa) : '', g.dSan, g.sai.length, g.vol, g.s90, g.sMot, g.eNeg, g.ouv.length, g.oAss, g.pts.map(p => p.t).join('; ')]) },
      pulse: D.PUL ? { t:'Pesquisa Pulse por setor (0 a 10)', cab:['Setor', 'Respostas', ...NR1_PULSE.map(q => q[1])], lin:[['Empresa', D.PUL.n, ...D.PUL.ger.map(v => v == null ? '' : nr1Num(v))], ...D.PUL.S.map(s => [s.setor, s.n, ...s.v.map(v => v == null ? '' : nr1Num(v))])] } : null,
      fatores: { t:'Os 13 fatores do guia do MTE', cab:['Nº', 'Fator', 'Indícios do RH (leitura do RH)', 'Ações (abertas / concluídas)'], lin: F.map(f => [f.i + 1, f.nome, f.ind.join('; ') || 'Sem dado no app', `${f.acoes.filter(a => a.status !== 'ok').length} / ${f.acoes.filter(a => a.status === 'ok').length}`]) },
      plano: { t:'Plano de ação', cab:['Ação', 'Fator', 'Área', 'Responsável', 'Prazo', 'Situação', 'Como acompanhar', 'Andamento e evidência'], lin: ACO.slice().sort((a, b) => String(a.prazo).localeCompare(String(b.prazo))).map(a => [a.acao, a.fator || 'Geral', a.area || 'Todas', a.resp || '', brD(a.prazo), (NR1_ST[a.status] || '') + (atrasada(a) ? ' (prazo vencido)' : ''), a.indicador || '', a.evid || '']) },
      com: { t:'Comunicações aos trabalhadores', cab:['Data', 'Tipo', 'Tema', 'Área / público', 'Participantes', 'Responsável', 'Observação'], lin: COM.slice().sort((a, b) => String(a.data).localeCompare(String(b.data))).map(x => [brD(x.data), x.tipo, x.tema, x.area || '', x.part || '', x.resp || '', x.obs || '']) },
      trein: { t:`Treinamentos ligados ao tema em ${D.ano}`, cab:['Data', 'Treinamento', 'Setor', 'Participantes', 'Horas'], lin: D.TR.map(t => [brD(t.data), t.tema, t.setor, t.n || '', t.h || '']) } };
  };
  const escolher = (tipo, fazer) => abrirModal({ titulo:`Exportar em ${tipo}`, corpo:`<p class="nr-nota" style="margin-top:0">Escolha o que vai no arquivo. Os números vão agregados por área, sem nomes de colaboradores.</p><div class="nr-esc">${PARTES.filter(([k]) => k !== 'pulse' || D.PUL).map(([k, n]) => `<label><input type="checkbox" value="${k}" checked> ${n}</label>`).join('')}</div>`,
    pe:`<span style="flex:1"></span><button class="btn borda" id="ex-c">Cancelar</button><button class="btn prim" id="ex-ok">Baixar</button>`,
    aoAbrir: m => { m.querySelector('#ex-c').onclick = fecharModal; m.querySelector('#ex-ok').onclick = () => { const sel = [...m.querySelectorAll('input:checked')].map(i => i.value); if (!sel.length) return; fecharModal(); fazer(sel); }; } });
  const nomeArq = 'Riscos psicossociais NR-1 ' + h.split('-').reverse().join('-');
  $('#nr-xls').onclick = () => escolher('Excel', sel => { const T = tabelas(), wb = XLSX.utils.book_new();
    const cap = [['Riscos Psicossociais (NR-1) · Gestão de Pessoas CRV'], [fonteTxt()], ['Indício do RH não é diagnóstico: a avaliação do risco é da Segurança do Trabalho (PGR).'], [`Avaliação técnica: ${CFG.instrumento ? CFG.instrumento + (CFG.aplicadoEm ? ' · aplicada em ' + brD(CFG.aplicadoEm) : '') : 'a definir com a Segurança do Trabalho'}`]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cap), 'Resumo');
    sel.forEach(k => { const t = T[k]; if (!t) return; const ws = XLSX.utils.aoa_to_sheet([t.cab, ...t.lin]); ws['!cols'] = t.cab.map((c, i) => ({ wch: i === 0 ? 34 : Math.min(40, Math.max(10, c.length + 2)) })); XLSX.utils.book_append_sheet(wb, ws, { areas:'Indícios por área', pulse:'Pulse por setor', fatores:'13 fatores', plano:'Plano de ação', com:'Comunicações', trein:'Treinamentos' }[k]); });
    baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nomeArq + '.xlsx'); });
  $('#nr-pdf').onclick = () => escolher('PDF', sel => { const T = tabelas(); const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Riscos Psicossociais (NR-1)', 'Indícios do RH, plano de ação e evidências');
    doc.setFontSize(9); doc.setTextColor(60, 70, 90);
    doc.text(doc.splitTextToSize(fonteTxt() + ' Indício do RH não é diagnóstico: a avaliação do risco é da Segurança do Trabalho (PGR). Avaliação técnica: ' + (CFG.instrumento ? CFG.instrumento + (CFG.aplicadoEm ? ', aplicada em ' + brD(CFG.aplicadoEm) : '') : 'a definir com a Segurança do Trabalho') + '.', 780), 30, 104);
    let y = 146;
    sel.forEach(k => { const t = T[k]; if (!t) return; if (y > 470) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 33, 61); doc.text(t.t, 30, y);
      doc.autoTable({ startY:y + 6, head:[t.cab], body:t.lin.length ? t.lin.map(l => l.map(v => String(v))) : [[t.cab.map((_, i) => i ? '' : 'Nada registrado')].flat()], margin:{ left:30, right:30 }, styles:{ fontSize:7.2, cellPadding:2.6, overflow:'linebreak' }, headStyles:{ fillColor:[36,66,124], fontSize:7.2 }, alternateRowStyles:{ fillColor:[244,246,250] } });
      y = doc.lastAutoTable.finalY + 22; });
    rodapePDF(doc); baixar(doc.output('blob'), nomeArq + '.pdf'); });

  desenhar();
}
return { telaNR1, pendencias:nr1Pendencias };
};
