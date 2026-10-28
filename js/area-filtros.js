/* Recortes por área dos painéis do RH para o gestor (registrados em CRV_AREA, js/area-paineis.js). */
(function(){ 'use strict'; if (!window.CRV_AREA) return; const CRV_AREA = window.CRV_AREA;

/* ---------- Período de experiência ----------
   Recorte = o mesmo do filtro "Setor" do painel do RH: RAW[r][4] = setor (área), RAW[r][3] = departamento (da própria base).
   Os lançamentos (coleção 'registros', doc 'm<matrícula>') vão só para as matrículas que ficaram na base recortada.
   Envio do gestor: na aba Formulários o gestor preenche o RE.0150.07 e grava 'registros/m<mat>' com o campo _g
   (etapa, vencimento, notas, decisão, comentário). Aqui isso vira o envio 'experiencia' no MESMO formato do formulário
   antigo do gestor (js/gestor.js formExp), para o RH aceitar em "Envios dos Gestores" sem mudança. */
(function(){
const cx = ctx => (ctx.areasN ? ctx : Object.assign(ctx, (({areasN, depSelN, depsN, areasConhecidasN}) => ({areasN, depSelN, depsN, areasConhecidasN}))(CRV_AREA.contexto(ctx.chaves, ctx.mapa))));
/* formulário oficial RE.0150.07 (mesmos fatores e regra do js/gestor.js): nota 0 a 5; pontos = nota × 2; total = média; meta 70% */
const FORM_COD = 'RE.0150.07 · Versão 05';
const FAT = ['Pontualidade/ Assiduidade', 'Iniciativa/Pró-atividade', 'Relacionamento', 'Organização', 'Metas', 'Qualidade do serviço /Atenção', 'Postura Profissional', 'Conhecimento / Desenvolvimento profissional', 'Liderança'];
const ETAPA = { pr:'1º período', ef:'Fim do contrato', ef90:'Fim dos 90 dias' };
const DECT = { efetivar:'Efetivar', prorrogar:'Prorrogar', encerrar:'Encerrar o contrato' };
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const hoje = () => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
const br = iso => iso ? iso.split('-').reverse().join('/') : '';
const pct = p => p == null ? '—' : (p * 100).toFixed(1).replace('.', ',') + '%';
const faixa = p => p == null ? '' : p >= .7 ? 'Desempenho acima do esperado' : p >= .7 - .105 ? 'Atenção para o desempenho mostrado' : 'Desempenho abaixo do esperado';

function envioExp(docId, d){
  const g = d && d._g; if (!g) return null;                       // gravação sem avaliação do gestor: não é envio
  const mat = (String(docId).match(/^m(\d+)$/) || [])[1]; if (!mat) return null;
  const etapa = g.etapa, venc = String(g.venc || ''), dec = g.decisao, obs = String(g.obs || '').trim().slice(0, 1200);
  if (!ETAPA[etapa] || !ISO.test(venc)) throw new Error('Não encontrei a etapa e o vencimento do contrato. Atualize o painel e tente de novo.');
  const notas = Array.isArray(g.notas) ? g.notas.slice(0, FAT.length) : [];
  if (notas.length !== FAT.length || notas.some((n, i) => n === null ? i !== FAT.length - 1 : !(Number.isInteger(n) && n >= 0 && n <= 5)))
    throw new Error('Dê uma nota de 0 a 5 em todos os fatores (só Liderança pode ficar como "não se aplica").');
  if (!DECT[dec]) throw new Error('Escolha a decisão: efetivar, prorrogar ou encerrar.');
  const h = hoje(), lim = addD(venc, -5);                          // encerramento vai ao RH até 5 dias antes do vencimento
  if (dec === 'encerrar' && h > lim) throw new Error('Fora do prazo para encerramento (até ' + br(lim) + '). Fale com a Gestão de Pessoas.');
  if ((dec === 'encerrar' || dec === 'prorrogar') && obs.length < 10) throw new Error('Escreva o comentário que justifica a decisão.');
  const v = notas.filter(n => n !== null).map(n => n * 2), tot = v.reduce((a, b) => a + b, 0) / v.length, p = tot / 10;
  const crit = FAT.map((a, i) => [a, notas[i] == null ? 'não se aplica' : notas[i] + ' (' + notas[i] * 2 + ' pts)']);
  const dados = { ref:etapa + '|' + venc, etapa, etapaT:ETAPA[etapa], venc, decisao:dec, crit, notas, tot, pct:p, form:FORM_COD, obs };
  if (ISO.test(String(g.adm || ''))) dados.adm = g.adm;
  dados.prazoEnc = lim;                                            // funcao e secao: o app completa pelo Quadro (como no formulário antigo)
  const resumo = [['Etapa', ETAPA[etapa]], ['Vencimento', br(venc)], ['Encerramento: enviar até', br(lim)],
    ['Fatores avaliados', notas.filter(n => n !== null).length + ' de ' + FAT.length + ' (formulário ' + FORM_COD + ')'],
    ['% atingido (meta 70%)', pct(p) + ' · ' + faixa(p)], ['Total de pontos', tot.toFixed(1).replace('.', ',')],
    ['Decisão', DECT[dec]], ['Comentário', obs || '—']];
  if (h > venc) resumo.push(['Atenção', 'O contrato já venceu em ' + br(venc) + '. Fale com a Gestão de Pessoas.']);
  else if (h > lim) resumo.push(['Atenção', 'Passou do prazo para encerrar (5 dias antes do vencimento).']);
  return { tipo:'experiencia', mat, dados, resumo };
}

/* envio ainda aguardando o RH → documento como o painel lê ('registros/m<mat>' com _g e _aguardaRH), para continuar
   marcado "Aguardando o RH" depois de recarregar. Só traz _g: o app deve MESCLAR com o documento que já existe (enc, pr, ef...). */
function pendenteExp(e){
  if (!e || e.tipo !== 'experiencia' || (e.status && e.status !== 'enviado')) return null;
  const d = e.dados || {}, mat = CRV_AREA.fm(e.mat); if (!mat || !ETAPA[d.etapa] || !ISO.test(String(d.venc || ''))) return null;
  const _g = { etapa:d.etapa, venc:d.venc, adm:d.adm || '', decisao:d.decisao, notas:Array.isArray(d.notas) ? d.notas.slice() : [], obs:d.obs || '',
    gestor:(e.assinatura && e.assinatura.nome) || e.autor_nome || '', cargoG:'', em:e.criado_em || '', envio:e.id || '' };
  return { colecao:'registros', doc_id:'m' + mat, dados:{ _g, _aguardaRH:true } };
}

CRV_AREA.reg({ id:'experiencia', nome:'Período de experiência', frente:'Gestão de Colaboradores',
  filtro(c, ctx){ cx(ctx);
    const L = (CRV_AREA.get(c, 'RAW') || []).filter(r => CRV_AREA.casa(ctx, r[4], r[3]));
    CRV_AREA.set(c, 'RAW', L);
    ctx._expMats = new Set(L.map(r => CRV_AREA.fm(r[0]))); },
  regs:{ registros:(id, d, ctx) => { const m = (String(id).match(/^m?(\d+)/) || [])[1]; return !!m && !!ctx._expMats && ctx._expMats.has(CRV_AREA.fm(m)); } },
  envios:{ registros:envioExp }, pendente:pendenteExp });
})();

/* ---------- Férias ----------
   Recorte = o mesmo dos filtros do painel do RH: DATA[].dp = "Setor" (área) e DATA[].d = "Seção" (departamento), da própria base de férias.
   Gestantes (GEST) ficam só com o RH (informação de saúde). Programações (coleção 'prog', doc '<matrícula>_...') só das matrículas que ficaram. */
(function(){
const cx = ctx => (ctx.areasN ? ctx : Object.assign(ctx, (({areasN, depSelN, depsN, areasConhecidasN}) => ({areasN, depSelN, depsN, areasConhecidasN}))(CRV_AREA.contexto(ctx.chaves, ctx.mapa))));
CRV_AREA.reg({ id:'ferias', nome:'Férias', frente:'Absenteísmo e Férias',
  filtro(c, ctx){ cx(ctx);
    const L = (CRV_AREA.get(c, 'DATA') || []).filter(p => CRV_AREA.casa(ctx, p.dp, p.d));
    CRV_AREA.set(c, 'DATA', L); CRV_AREA.set(c, 'GEST', []);
    ctx._ferMats = new Set(L.map(p => CRV_AREA.fm(p.c))); },
  regs:{ prog:(id, d, ctx) => { const m = (String(id).match(/^(\d+)_/) || [])[1]; return !!m && !!ctx._ferMats && ctx._ferMats.has(CRV_AREA.fm(m)); } },
  /* gestor programa no próprio painel (só datas liberadas, prazo até o dia 15 do mês anterior): vira envio 'ferias' ao RH,
     no mesmo formato do formulário antigo (gestor.js → formFer). O painel grava prog/<matrícula>_<início do aquisitivo>
     com { inicio, dias, parcelas, abono, obs, _g:{ de, ate, lim, saldo } } (o _g só no modo gestor). */
  envios:{ prog:(docId, d) => {
    const m = String(docId).match(/^(\d+)_(\d{4}-\d{2}-\d{2})$/); if (!m) throw new Error('Período de férias não identificado. Fale com a Gestão de Pessoas.');
    const g = d._g || {};
    if (d.retorno) throw new Error('"Aguarda retorno do afastamento" é lançado só pelo RH.');
    if (!g.de || g.de !== m[2] || !g.lim) throw new Error('Dados do período não vieram do painel. Abra o painel de novo e tente outra vez.');
    if (d.autorizacao) throw new Error('Data fora do calendário (com autorização) é lançada só pelo RH.');
    const iso = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    const addD = (s, n) => { const [a, b, c] = s.split('-').map(Number); return iso(new Date(a, b - 1, c + n)); };
    const h = new Date(), mi = iso(new Date(h.getFullYear(), h.getMonth() + (h.getDate() <= 15 ? 1 : 2), 1));   // = minInicioFerias do gestor.js
    const parc = (Array.isArray(d.parcelas) && d.parcelas.length ? d.parcelas : [{ inicio:d.inicio, dias:d.dias }])
      .filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.inicio || '')).map(x => ({ inicio:x.inicio, dias:+x.dias, fim:addD(x.inicio, +x.dias - 1) })).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const ab = +d.abono || 0, tot = parc.reduce((t, x) => t + x.dias, 0), saldo = +g.saldo || 0;
    if (!parc.length) throw new Error('Informe o início das férias.');
    if (parc.length > 3) throw new Error('No máximo 3 parcelas.');
    if (parc.some(x => x.inicio < mi)) throw new Error('Fora do prazo: o início mais cedo possível hoje é ' + mi.split('-').reverse().join('/') + ' (envio até o dia 15 do mês anterior).');
    if (parc.some(x => !(x.dias >= 5))) throw new Error('Cada parcela precisa ter pelo menos 5 dias.');
    if (parc.length > 1 && !parc.some(x => x.dias >= 14)) throw new Error('Uma das parcelas precisa ter pelo menos 14 dias.');
    if (ab && ab !== 10) throw new Error('Abono pecuniário: 10 dias ou nenhum.');
    if (tot + ab > saldo) throw new Error('A soma (' + tot + ' dias' + (ab ? ' + 10 de abono' : '') + ') passa do saldo de ' + saldo + ' dias.');
    for (let i = 1; i < parc.length; i++) if (parc[i].inicio <= parc[i - 1].fim) throw new Error('As parcelas se sobrepõem.');
    const br = s => s ? s.split('-').reverse().join('/') : '';
    const foraLimite = parc[0].inicio > g.lim;
    const dados = { ref:g.de, de:g.de, ate:g.ate, lim:g.lim, saldo, parcelas:parc, abono:ab, obs:String(d.obs || '').trim(), foraLimite };
    return { tipo:'ferias', mat:m[1], dados,
      resumo:[['Período aquisitivo', br(g.de) + ' a ' + br(g.ate)], ['Data limite', br(g.lim)], ['Saldo', saldo + ' dias']]
        .concat(parc.map((x, i) => [(parc.length > 1 ? (i + 1) + 'ª parcela' : 'Férias'), br(x.inicio) + ' a ' + br(x.fim) + ' (' + x.dias + ' dias)']))
        .concat(ab ? [['Abono pecuniário', '10 dias']] : []).concat(foraLimite ? [['Atenção', 'Início depois da data limite: o RH vai avaliar']] : []).concat(dados.obs ? [['Observação', dados.obs]] : []) }; } },
  /* envio ainda aguardando o RH: aparece no painel como "Aguardando o RH" mesmo depois de recarregar */
  pendente(e){ const d = e.dados || {}; if (e.tipo !== 'ferias' || !d.de || !Array.isArray(d.parcelas) || !d.parcelas.length) return null; const p0 = d.parcelas[0];
    return { colecao:'prog', doc_id:CRV_AREA.fm(e.mat) + '_' + d.de, dados:{ inicio:p0.inicio, dias:p0.dias, parcelas:d.parcelas.map(x => ({ inicio:x.inicio, dias:x.dias })), abono:d.abono || 0, obs:d.obs || '', _aguardaRH:true, envio:e.id } }; } });
})();

/* ---------- Registro de Danos (RD) ----------
   D.rows: [rd, data, matrícula, nome, i_func, i_dep, i_ger, admissão, situação, desfecho, ação, valor, parcelas, mês desc., obs, linha, flags]
   D.funcs / D.deps / D.gers: listas apontadas por índice nas linhas; D.hc: quadro por índice de departamento; EMP: matrícula → dados da Base Geral
   Regra (out/2026): entra a linha cujo departamento (D.deps[i_dep], o campo do filtro "Departamento" do painel, posição atual
   na Base Geral) é do gestor — exatamente o que o RH vê filtrando esse departamento. Linha sem departamento (sem matrícula) não entra.
   D.hc: o número do RH para cada departamento que fica. D.yms: meses da base inteira (o gráfico mensal mostra os meses sem RD da área). */
CRV_AREA.reg({ id:'rd', nome:'Registro de Danos', frente:'Ocorrências e Relações Trabalhistas',
  filtro(c, ctx){
    const A = CRV_AREA, fm = A.fm, D = A.get(c, 'D'); if (!D || !Array.isArray(D.rows)) return c;
    const X = ctx.areasN ? ctx : Object.assign({}, ctx, A.contexto(ctx.chaves, ctx.mapa));
    const deps = D.deps || [], okDep = i => i != null && i >= 0 && A.casa(X, null, deps[i]);
    D.yms = [...new Set(D.rows.map(r => String(r[1] || '').slice(0, 7)).filter(Boolean))].sort();
    const rows = D.rows.filter(r => okDep(r[5]));
    // reindexa função, departamento e gerência só com o que a área usa
    const novo = (lista, fixos) => { const m = new Map(), out = []; (fixos || []).forEach(v => { const i = lista.indexOf(v); if (i >= 0) { m.set(i, out.length); out.push(v); } });
      return { m, out, ix(i){ if (i == null || i < 0) return i; if (!m.has(i)) { m.set(i, out.length); out.push(lista[i]); } return m.get(i); } }; };
    const F = novo(D.funcs || []), DP = novo(deps), G = novo(D.gers || [], ['Não classificada']);
    rows.forEach(r => { r[4] = F.ix(r[4]); r[5] = DP.ix(r[5]); r[6] = G.ix(r[6]); });
    // quadro por departamento: o mesmo número do RH
    const hc = {}; DP.m.forEach((ni, oi) => { const h0 = (D.hc || {})[oi]; if (h0 != null) hc[ni] = h0; });
    D.rows = rows; D.funcs = F.out; D.deps = DP.out; D.gers = G.out; D.hc = hc;
    D.miss = []; // lacunas na numeração dos RDs são da planilha toda (o bloco nem aparece para o gestor)
    const rds = new Set(rows.map(r => String(r[0]))), mats = new Set(rows.filter(r => r[2] != null && r[2] !== '').map(r => fm(r[2])));
    // EMP (consulta por matrícula nas autorizações): quem tem RD na área ou está, na Base Geral, num departamento da área
    const E = A.get(c, 'EMP');
    if (E && typeof E === 'object') { const e2 = {}; Object.keys(E).forEach(k => { if (mats.has(fm(k)) || A.casa(X, null, (E[k] || [])[2])) e2[k] = E[k]; }); A.set(c, 'EMP', e2); }
    ctx.__rd = { rds, mats };
    A.set(c, 'D', D);
    return c;
  },
  regs:{
    // RDs cadastrados no app: pelo departamento do cadastro (é o que o painel usa para a linha nova)
    novos:(id, d, ctx) => { if (d.excluida) return false; const A = CRV_AREA, X = ctx.areasN ? ctx : A.contexto(ctx.chaves, ctx.mapa);
      const ok = A.casa(X, null, d.dep); if (ok && ctx.__rd) { if (d.rd) ctx.__rd.rds.add(String(d.rd)); if (d.mat) ctx.__rd.mats.add(A.fm(d.mat)); } return ok; },
    // autorizações de desconto de RD da área (pelo nº do RD ou matrícula de quem tem RD na área); as de farmácia ficam só com o RH
    autorizacoes:(id, d, ctx) => { if (d.origem === 'farmacia') return false; const A = CRV_AREA, R = ctx.__rd; const dc = d.doc || {};
      const rd = String(d.rd || dc.rd || ''), m = A.fm(d.mat || dc.mat);
      if (R) return (!!rd && R.rds.has(rd)) || (!!m && R.mats.has(m));
      return !!m && ctx.mats.has(m); }
    // 'folhas' (compras da farmácia) não vai para o gestor
  },
  limparReg(colecao, d){
    // sem quem emitiu/excluiu
    ['por', 'excluidaPor', 'cadastradoPor', 'alteradoPor'].forEach(k => delete d[k]);
    return d;
  }
});

/* ---------- Absenteísmo ----------
   Regra (out/2026): o gestor vê exatamente quem o painel do RH mostra quando o RH filtra pelo mesmo setor.
   Campos de setor do próprio painel (planilha de atestados, não o Quadro):
     D.P: pessoas [i_setor(D.deps), admissão, saída, nome, matrícula, função, contrato, situação, i_ger, i_func, i_seção(D.sets)]
     filtro "Setor" do painel = p[0] (D.deps) · filtro "Seção" = p[10] (D.sets, o departamento).
   Cadastros AFASTADOS / DESISTENTES não têm setor nem seção na planilha (seção = 'AFASTADOS'/'DESISTENTES'):
   o painel do RH não os mostra ao filtrar por setor, então também não entram no recorte.
   D.O: ocorrências [i_pessoa, dia, tipo]; D.A: atestados [i_pessoa, dia, dias, i_grupo CID, i_médico]
   Sensível: GEST (gestantes) sai; grupo de CID e médico saem; fica só a quantidade de dias de atestado.
   window.CRV_OC (aba "Histórico (sistema)") e window.CRV_QSIT: recortados em `injetar` (mesmo critério da aba:
   P[m][2] = setor/área do Quadro, filtro "Setor" da aba; P[m][3] = departamento), sem CID. */
(function(){
const MEMO = new WeakMap();   // ctx → matrículas que ficaram (base recortada + histórico recortado), para recortar o QSIT
const guarda = (ctx, mats) => { if (!ctx || typeof ctx !== 'object') return; const s = MEMO.get(ctx) || new Set(); mats.forEach(m => s.add(CRV_AREA.fm(m))); MEMO.set(ctx, s); };
/* histórico de uma empresa (CRV ou outra do grupo): só quem casa pelo setor/departamento de P, CID zerado */
function recHist(P, L, AT, C, ctx){
  const out = { P:{}, L:{}, AT:{} }; if (C) out.C = {};
  const ok = m => { const p = P && P[m]; return !!p && CRV_AREA.casa(ctx, p[2], p[3]); };
  Object.keys(P || {}).forEach(m => { if (ok(m)) out.P[m] = P[m].slice(); });
  Object.keys(L || {}).forEach(m => { if (m === '__ref') { out.L.__ref = L.__ref; return; } if (ok(m)) out.L[m] = L[m]; });
  Object.keys(AT || {}).forEach(m => { if (m === '__ref') return; if (ok(m)) out.AT[m] = (AT[m] || []).map(a => [a[0], a[1], '']); });
  if (C) Object.keys(C).forEach(m => { if (ok(m)) out.C[m] = C[m]; });
  return out;
}
/* primeiro ano, anos e última data do histórico de uma empresa inteira (igual ao setEmp da aba Histórico) */
function fx(L, AT){
  L = L || {}; AT = AT || {}; const ms = [...new Set(Object.keys(L).concat(Object.keys(AT)))].filter(m => m !== '__ref');
  const yc = {}; ms.forEach(m => (L[m] || []).forEach(o => { const y = String(o[0]).slice(0, 4); yc[y] = (yc[y] || 0) + 1; }));
  const ys = Object.keys(yc).sort(), Y0 = ys.find(y => yc[y] >= 100) || ys[0] || '2000';
  const ANOS = [...new Set(ms.flatMap(m => (L[m] || []).map(o => String(o[0]).slice(0, 4)).concat((AT[m] || []).map(a => String(a[0]).slice(0, 4)))))].filter(a => a >= Y0).sort();
  const ULT = ms.reduce((z, m) => { const l = L[m] || [], a = AT[m] || []; const u = [l.length ? l[l.length - 1][0] : '', a.length ? a[a.length - 1][0] : ''].sort().pop(); return u > z ? u : z; }, '');
  return { Y0, ANOS, ULT };
}
CRV_AREA.reg({ id:'absenteismo', nome:'Absenteísmo', frente:'Absenteísmo e Férias',
  filtro(c, ctx){
    const D = CRV_AREA.get(c, 'D'); if (!D || !Array.isArray(D.P)) return c;
    const deps = D.deps || [], sets = D.sets || [];
    // pessoas do recorte: setor (p[0]) e seção (p[10]) da própria planilha, como o filtro do painel
    const ni = new Map(), P = [];
    D.P.forEach((p, i) => { if (CRV_AREA.casa(ctx, deps[p[0]], sets[p[10]])) { ni.set(i, P.length); P.push(p); } });
    // listas por índice (setor, gerência, função, seção): só o que o recorte usa
    const novo = lista => { const m = new Map(), out = []; return { out, ix(i){ if (i == null || i < 0) return i; if (!m.has(i)) { m.set(i, out.length); out.push(lista[i]); } return m.get(i); } }; };
    const DP = novo(deps), G = novo(D.gers || []), F = novo(D.funcs || []), S = novo(sets);
    P.forEach(p => { p[0] = DP.ix(p[0]); p[8] = G.ix(p[8]); p[9] = F.ix(p[9]); p[10] = S.ix(p[10]); });
    // ocorrências e atestados reapontados para o novo índice da pessoa (atestado sem CID e sem médico)
    D.O = (D.O || []).filter(o => ni.has(o[0])).map(o => { o[0] = ni.get(o[0]); return o; });
    D.A = (D.A || []).filter(a => ni.has(a[0])).map(a => [ni.get(a[0]), a[1], a[2], 0, 0]);
    D.grps = ['CID restrito ao RH'];
    D.docs = [['Médico restrito ao RH', '']];
    D.P = P; D.deps = DP.out; D.gers = G.out; D.funcs = F.out; D.sets = S.out;
    CRV_AREA.set(c, 'D', D);
    CRV_AREA.set(c, 'GEST', []);
    guarda(ctx, P.map(p => p[4]));
    // estado inicial: índices da base inteira não valem mais; se o recorte é um setor só (ou uma seção só, no
    // gestor de departamento), já abre filtrado por ele, igual ao RH com o filtro aplicado
    const st = CRV_AREA.get(c, 'S');
    if (st && typeof st === 'object') {
      ['set', 'func', 'ger', 'dept', 'open', 'topen'].forEach(k => { if (k in st) st[k] = -1; }); st.q = ''; st.tq = '';
      if (DP.out.length === 1) st.dept = 0;
      const soDep = ctx && ctx.areasN && ctx.areasN.size === 0;
      if (soDep && DP.out.length === 1 && S.out.length === 1) st.set = 0;
      CRV_AREA.set(c, 'S', st);
    }
    return c;
  },
  regs:{},  // o painel não tem lançamentos
  /* dados que o app injeta no painel do RH (window.CRV_OC e window.CRV_QSIT): para o gestor vão recortados */
  injetar:{
    CRV_OC(oc, ctx){
      if (!oc || typeof oc !== 'object') return oc;
      const base = recHist(oc.P, oc.L, oc.AT, null, ctx), EMP = {};
      Object.keys(oc.EMP || {}).forEach(k => { const e = oc.EMP[k] || {}, r = recHist(e.P, e.L, e.AT, e.C || {}, ctx);
        if (Object.keys(r.L).some(m => m !== '__ref') || Object.keys(r.AT).length) EMP[k] = Object.assign({ n:e.n }, r); });
      // anos e última data da empresa inteira (mesma conta da aba), para o período do histórico não mudar com o recorte
      const FX = { '5':fx(oc.L, oc.AT) }; Object.keys(EMP).forEach(k => FX[k] = fx(oc.EMP[k].L, oc.EMP[k].AT));
      const out = { ref:oc.ref, P:base.P, L:base.L, AT:base.AT, EMP, CIDD:{}, FX };
      guarda(ctx, Object.keys(out.P).concat(...Object.values(EMP).map(e => Object.values(e.C || {}))));
      return out;
    },
    /* situação atual pelo Quadro: só as matrículas que ficaram na base recortada ou no histórico recortado.
       `extra` (opcional) = conteúdo recortado, caso o filtro não tenha rodado antes com este mesmo ctx. */
    CRV_QSIT(q, ctx, extra){
      if (!q || !q.S) return q;
      let mats = MEMO.get(ctx);
      if (!mats && extra) { const D = CRV_AREA.get(extra, 'D'); mats = new Set(((D && D.P) || []).map(p => CRV_AREA.fm(p[4]))); }
      if (!mats) mats = ctx.mats;  // último recurso: pessoas do setor pelo Quadro
      const S = {}; Object.keys(q.S).forEach(m => { if (mats.has(CRV_AREA.fm(m))) S[m] = q.S[m]; });
      return { ref:q.ref, S };
    }
  }
});
})();

/* ---------- Sanções Disciplinares (advertências e suspensões, 2026 + anos anteriores) ----------
   Base: DB = { P: matrícula → [nome, função, departamento, gerência, situação, contrato, admissão, rescisão],
     R: [tipo, mat, data, seq, índice em M/MC, dias, início, fim, atraso, origem], M: textos dos motivos, MC: grupo de cada motivo,
     CONF: listas de índices em R (aba Conferência), HC/HG/HF: quadro ativo por departamento/gerência/função (coluna "quadro" da aba
     Por área), QUADRO: total ativo, HA: período do histórico, CATS: grupos de motivo }.
   Regra (out/2026): entra quem o painel do RH mostra ao filtrar pelo departamento — campo P[mat][2] (departamento atual da base
   do painel). A pessoa entra com TODAS as sanções de todos os anos (reincidência e "Anos anteriores" completos).
   Agregados: HC/HG/HF ficam com os números do RH, só nas chaves que aparecem para a área (é o que o RH vê filtrando);
   QUADRO não aparece para o gestor (o painel trata o gestor como recorte filtrado).
   DB.REF (período da base inteira: data mais recente e meses de cada ano) deixa meses/anos sem sanção da área no gráfico, como o RH vê. */
CRV_AREA.reg({ id:'sancoes', nome:'Sanções Disciplinares', frente:'Ocorrências e Relações Trabalhistas',
  filtro(c, ctx){
    const A = CRV_AREA, DB = A.get(c, 'DB'); if (!DB || !Array.isArray(DB.R)) return;
    const X = ctx.areasN ? ctx : Object.assign({}, ctx, A.contexto(ctx.chaves, ctx.mapa));
    const P0 = DB.P || {};
    // período da base inteira (antes do recorte)
    const REF = { max:'', anos:{} };
    DB.R.forEach(r => { const d = String(r[2] || ''); if (!d) return; const y = d.slice(0, 4), a = REF.anos[y] || (REF.anos[y] = { ini:d, fim:d, ym:{} });
      if (d < a.ini) a.ini = d; if (d > a.fim) a.fim = d; a.ym[d.slice(0, 7)] = 1; if (d > REF.max) REF.max = d; });
    Object.keys(REF.anos).forEach(y => { REF.anos[y].ym = Object.keys(REF.anos[y].ym).sort(); });
    // pessoas: departamento atual da base do painel (o mesmo campo do filtro "Departamento")
    const P = {}; Object.keys(P0).forEach(m => { if (A.casa(X, null, P0[m][2])) P[m] = P0[m]; });
    const naArea = m => Object.prototype.hasOwnProperty.call(P, String(m));
    // linhas: todas as da pessoa (todos os anos); motivos reindexados (M/MC) e índice antigo → novo (CONF)
    const novoR = {}, novoM = {}, R = [], M = [], MC = [];
    DB.R.forEach((r, i) => { if (!naArea(r[1])) return;
      const x = r.slice(), mi = r[4];
      if (mi != null && DB.M && mi in DB.M) { if (!(mi in novoM)) { novoM[mi] = M.length; M.push(DB.M[mi]); MC.push(DB.MC ? DB.MC[mi] : 0); } x[4] = novoM[mi]; }
      novoR[i] = R.length; R.push(x); });
    const CONF = {}; Object.keys(DB.CONF || {}).forEach(k => { CONF[k] = (DB.CONF[k] || []).filter(i => i in novoR).map(i => novoR[i]); });
    // quadro: os mesmos números do RH, só nas chaves da área
    const so = (H, ip) => { const o = {}; if (!H) return o; Object.keys(P).forEach(m => { const k = P[m][ip]; if (k in H) o[k] = H[k]; }); return o; };
    const HC = {}; Object.keys(DB.HC || {}).forEach(k => { if (A.casa(X, null, k)) HC[k] = DB.HC[k]; });
    DB.P = P; DB.R = R; DB.M = M; DB.MC = MC; DB.CONF = CONF;
    DB.HC = HC; DB.HG = so(DB.HG, 3); DB.HF = so(DB.HF, 1);
    DB.QUADRO = Object.values(HC).reduce((s, v) => s + (+v || 0), 0);   // não é exibido para o gestor
    DB.REF = REF;
    // para os lançamentos do app: quem já está na base vale o departamento da base; os demais, o departamento do documento
    ctx.__sanc = { base:new Set(Object.keys(P0).map(A.fm)), area:new Set(Object.keys(P).map(A.fm)) };
    A.set(c, 'DB', DB);
  },
  vazio(c){ return !(((CRV_AREA.get(c, 'DB') || {}).R) || []).length; },
  // documentos emitidos no app (advertência e suspensão) entram no painel e no histórico: só os da área, não excluídos.
  // 'pedidos' NÃO é liberado: são pedidos pendentes do fluxo interno do RH (o painel mostraria o botão de emitir/descartar).
  regs:{ documentos:(id, d, ctx) => {
    if (d.excluido || !(d.tipo === 'adv' || d.tipo === 'sus') || !d.mat) return false;
    const A = CRV_AREA, m = A.fm(d.mat), S = ctx.__sanc;
    if (S && S.base.has(m)) return S.area.has(m);
    const X = ctx.areasN ? ctx : A.contexto(ctx.chaves, ctx.mapa);
    return A.casa(X, null, d.dep); } },
  // gestor solicita a sanção no próprio painel (botão "Solicitar sanção ao RH"): o painel grava em 'solicitacoes' e a ponte
  // transforma no envio 'sancao' do antigo "Pedido de sanção" (formSan). funcao/secao vêm do Quadro (enviarPainel).
  // Não vai 'hist': o painel não tem faltas em 90 dias (fa90) e o verEnvio mostraria "undefined"; o histórico de sanções vai no resumo.
  envios:{ solicitacoes:(id, d) => {
    if (!d || !d.mat) return null;
    const T = { ori:'Orientação disciplinar', adv:'Advertência escrita', sus:'Suspensão disciplinar' }, sus = d.tipo === 'sus', dias = +d.dias;
    const br = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '';
    const h = new Date(), hoje = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
    if (!T[d.tipo]) throw new Error('Escolha a medida sugerida.');
    if (sus && !(dias >= 1 && dias <= 30 && Number.isInteger(dias))) throw new Error('Informe os dias de suspensão (de 1 a 30).');
    if (!d.data || !/^\d{4}-\d{2}-\d{2}$/.test(d.data)) throw new Error('Informe a data do ocorrido.');
    if (d.data > hoje) throw new Error('A data do ocorrido não pode ser no futuro.');
    const ass = String(d.assunto || '').trim(), desc = String(d.desc || '').trim();
    if (ass.length < 5) throw new Error('Escreva o assunto em uma linha.');
    if (desc.length < 80) throw new Error('Descreva os fatos com mais detalhes (mínimo 80 caracteres).');
    const g = d._g || {};
    const dados = { ref:d.data, tipo:d.tipo, tipoT:T[d.tipo], dias:sus ? dias : null, data:d.data, hora:d.hora || '', local:String(d.local || '').trim(),
      assunto:ass, desc, test:String(d.test || '').trim(), ant:d.ant || '', adm:d.adm || '', exp:!!g.exp };
    const resumo = [['Medida sugerida', T[d.tipo] + (sus ? ' · ' + dias + ' dia' + (dias > 1 ? 's' : '') : '')], ['Data do ocorrido', br(d.data) + (dados.hora ? ' · ' + dados.hora : '')],
      ['Local', dados.local || '—'], ['Assunto', ass], ['Descrição dos fatos', desc], ['Testemunhas', dados.test || 'não informadas'], ['Já tinha sido orientado', dados.ant || 'não informado'],
      ['Sanções nos últimos 12 meses (painel)', g.s12 ? g.s12 + ' · ' + (g.ult || []).join('; ') : 'nenhuma']].concat(g.exp ? [['Contrato', 'em experiência']] : []);
    return { tipo:'sancao', mat:CRV_AREA.fm(d.mat), dados, resumo }; } },
  // envio de sanção ainda aguardando o RH (feito pelo painel ou pelo formulário antigo): volta como 'solicitacoes', que o
  // formulário do gestor lista como "Aguardando o RH" e usa no aviso "já existe solicitação desta pessoa".
  pendente(e){
    if (!e || e.tipo !== 'sancao' || e.status !== 'enviado' || !e.mat || !e.id) return null;
    const d = e.dados || {};
    return { colecao:'solicitacoes', doc_id:('e' + String(e.id)).replace(/[^A-Za-z0-9_\-.~:@+]/g, '-').slice(0, 200),
      dados:{ tipo:d.tipo, mat:CRV_AREA.fm(e.mat), nome:e.colaborador || '', func:d.funcao || '', dep:d.secao || '', adm:d.adm || '',
        data:d.data || '', hora:d.hora || '', local:d.local || '', assunto:d.assunto || '', desc:d.desc || '', dias:d.tipo === 'sus' ? d.dias : null,
        test:d.test || '', ant:d.ant || '', solicitadoEm:e.criado_em || '', envio:e.id, _aguardaRH:true } }; },
  // só os campos que o painel usa (sai CPF, quem emitiu, testemunhas/observações internas etc.)
  limparReg(col, d){ if (col !== 'documentos') return d; const o = {};
    ['tipo','titulo','mat','nome','func','dep','ger','adm','data','assunto','desc','cat','dias','ini','fim','excluido','emitidoEm'].forEach(k => { if (d[k] !== undefined) o[k] = d[k]; });
    return o; }
});

/* ---------- Gestão de Fadiga (telemetria de veículos) ----------
   Base: D = { p: matrícula → [nome, função, seção, situação], r: [setor da fadiga, mat, mês, dia, motivo, turno, hora, frota, medida, flag, nº ocorrência] }.
   Regra (out/2026): o filtro "Setor" do painel usa r[0], o setor da própria planilha de fadiga (CTT, Oficina, Compras, Comboio,
   Indústria, Irrigação). Só "Indústria" e "Oficina" têm o mesmo nome de um setor do Quadro:
   - gestor de Indústria/Oficina (ou de um departamento delas) → linhas com r[0] = esse setor (= RH clicando no setor),
     e no caso de departamento, também a seção da pessoa (p[2]) = o departamento;
   - demais gestores (Operacional CTT, ADM - Agrícola, Irrigação...) → o painel do RH não tem filtro equivalente; entra pela seção
     da pessoa na base do painel (p[2], departamento atual), só nas linhas cujo setor da fadiga não é Indústria/Oficina
     (essas já são de quem filtra por Indústria/Oficina). CTT/Compras/Comboio/Irrigação não são ligados por nome a nenhum setor do Quadro.
   D.ref = [último mês, último dia] da base inteira: o painel do gestor mostra os mesmos meses (média por mês) que o RH.
   LOGOJPG e IC (ícones) ficam. */
(function(){
const A = CRV_AREA;
const area = k => k.slice(2).split('|')[0];
// por chave do gestor: contexto próprio (para a regra Indústria/Oficina × demais)
function prep(ctx, setoresFad){
  const ks = (ctx.chaves || []).filter(k => /^[ad]:/.test(k)), M = ctx.mapa || {};
  const X = ctx.areasN ? ctx : A.contexto(ks, M), conhecidas = X.areasConhecidasN || new Set();
  const fad = new Set([...setoresFad].map(A.N).filter(s => conhecidas.has(s)));      // setores da fadiga que são setores do Quadro
  return { fad, conhecidas, ks:ks.map(k => ({ c:A.contexto([k], M), proprio:fad.has(A.N(area(k))) })) };
}
function entra(P, setor, secao){
  const s = A.N(setor);
  return P.ks.some(k => (k.proprio && !P.fad.has(s)) ? false : A.casa(k.c, setor, secao));
}
A.reg({ id:'fadiga', nome:'Gestão de Fadiga', frente:'Ocorrências e Relações Trabalhistas',
  filtro(c, ctx){
    const D = A.get(c, 'D'); if (!D) return;
    const p0 = D.p || {}, r0 = D.r || [];
    const P = prep(ctx, new Set(r0.map(r => r[0]).concat(['CTT','Oficina','Compras','Comboio','Indústria','Irrigação'])));
    // período da base inteira (o painel monta os meses a partir do maior mês da base)
    const mx = r0.reduce((a, r) => Math.max(a, +r[2] || 0), 0), ult = r0.filter(r => +r[2] === mx).reduce((a, r) => Math.max(a, +r[3] || 0), 0);
    D.r = r0.filter(r => entra(P, r[0], (p0[r[1]] || [])[2]));
    const p = {}; D.r.forEach(r => { if (p0[r[1]]) p[r[1]] = p0[r[1]]; }); D.p = p;
    D.ref = [mx, ult];
    ctx.__fad = { P, ocs:new Set(D.r.map(r => String(r[10] || '')).filter(Boolean)), mats:new Set(D.r.map(r => A.fm(r[1]))) };
    A.set(c, 'D', D);
  },
  regs:{
    // ocorrências cadastradas no app: pelo setor da ocorrência e a seção do colaborador (mesma regra das linhas da planilha)
    novos:(id, d, ctx) => { if (d.excluida || d.excluido || !d.mat) return false;
      const P = (ctx.__fad && ctx.__fad.P) || prep(ctx, new Set(['CTT','Oficina','Compras','Comboio','Indústria','Irrigação']));
      const ok = entra(P, d.setor, d.secao); if (ok && ctx.__fad && d.oc) ctx.__fad.ocs.add(String(d.oc)); if (ok && ctx.__fad) ctx.__fad.mats.add(A.fm(d.mat)); return ok; },
    // tratativas (orientação/advertência/suspensão): o painel só usa tipo + nº das ocorrências para atualizar a medida;
    // entram as que apontam para ocorrências da área (ou de colaborador da área); terceiros (sem matrícula) não entram
    tratativas:(id, d, ctx) => { if (d.excluido || !d.mat) return false; const F = ctx.__fad; if (!F) return false;
      return (d.ocs || []).some(o => F.ocs.has(String(o))) || F.mats.has(A.fm(d.mat)); }
  },
  limparReg(col, d){ const o = {};
    const K = col === 'tratativas' ? ['tipo','titulo','mat','ocs','data','excluido','emitidoEm']
      : ['oc','data','hora','turno','setor','frota','mot','med','mat','nome','func','secao','sit','excluida','cadastradoEm'];
    K.forEach(k => { if (d[k] !== undefined) o[k] = d[k]; }); return o; }
});
})();

/* ---------- Crachás de treinamento ----------
   Não há base injetada: tudo está nos lançamentos. 'treinamentos' (um por crachá) traz o departamento no próprio lançamento ('depto').
   O filtro do painel do RH só tem "Gerência" (nomes de responsáveis, sem correspondência com o Quadro), então o recorte usa o 'depto'
   do lançamento. A área vem do Quadro só para desempatar departamento que existe em mais de um setor (quando o Quadro tem a pessoa
   nesse mesmo departamento); senão vale só o departamento.
   'docs_trein' (termos) acompanham o crachá ('crachaId'); sem crachaId, pela matrícula de um crachá liberado. */
(function(){
const cx = ctx => (ctx.areasN ? ctx : Object.assign(ctx, (({areasN, depSelN, depsN, areasConhecidasN}) => ({areasN, depSelN, depsN, areasConhecidasN}))(CRV_AREA.contexto(ctx.chaves, ctx.mapa))));
const daArea = (d, ctx) => { cx(ctx); const q = (ctx.mapa || {})[CRV_AREA.fm(d.mat)] || (ctx.mapa || {})[String(d.mat)];
  const area = q && CRV_AREA.N(q.setor) === CRV_AREA.N(d.depto) ? q.area : '';
  return CRV_AREA.casa(ctx, area, d.depto); };
CRV_AREA.reg({ id:'crachas', nome:'Crachás de treinamento', frente:'T&D | Desenvolvimento de Pessoas',
  filtro(c, ctx){ cx(ctx); ctx._crIds = new Set(); ctx._crMats = new Set(); /* pacote sem blocos de dados */ },
  regs:{
    /* a ordem importa: 'treinamentos' é lido antes e guarda os crachás liberados para 'docs_trein' */
    treinamentos: (id, d, ctx) => { const ok = daArea(d, ctx); if (ok) { (ctx._crIds = ctx._crIds || new Set()).add(String(id)); (ctx._crMats = ctx._crMats || new Set()).add(CRV_AREA.fm(d.mat)); } return ok; },
    docs_trein:   (id, d, ctx) => d.crachaId ? !!ctx._crIds && ctx._crIds.has(String(d.crachaId)) : !!ctx._crMats && ctx._crMats.has(CRV_AREA.fm(d.mat))
  },
  /* tira quem lançou/alterou (nome de usuário do RH) */
  limparReg(col, d){ delete d.criadoPor; delete d.atualizadoPor; delete d.excluidoPor; return d; }
});
})();

/* FAT 2026/2027 (motoristas e operadores de máquinas: direito ao programa e situação das férias).
   Regra (out/2026): o gestor vê quem o painel do RH mostra ao filtrar pelo mesmo setor/departamento.
   RAW = uma linha por pessoa: r[0] matrícula, r[3] Setor (filtro "Setor" do painel), r[5] Departamento (filtro "Departamento").
   Sensível: nascimento (r[11]) e cidade (r[13]) saem. Para os números baterem com o RH, vai no lugar só a marcação
   r[17] = 1 se a pessoa tem idade igual ou acima do corte padrão do painel (homens 60, mulheres 55) na data de referência
   padrão (REF0 = 20/12/2026); o painel, só no modo gestor, usa essa marcação em vez da idade.
   Confirmação de aposentado (coleção 'conf', doc = matrícula): só das matrículas que ficaram no recorte. */
(function(){
const REF0 = '2026-12-20', CORTE = { M:60, F:55 };   // iguais a REF0 e st.ih/st.im de paineis/fat.html
const MEMO = new WeakMap();
const idade = (nasc, ref) => { const a = String(nasc || '').split('-').map(Number), b = ref.split('-').map(Number); if (a.length < 3 || !a[0]) return null;
  let y = b[0] - a[0]; if (b[1] < a[1] || (b[1] === a[1] && b[2] < a[2])) y--; return y; };
CRV_AREA.reg({ id:'fat', nome:'FAT 2026/2027', frente:'Absenteísmo e Férias',
  filtro(c, ctx){
    const R = (CRV_AREA.get(c, 'RAW') || []).filter(r => CRV_AREA.casa(ctx, r[3], r[5]));
    R.forEach(r => { const i = idade(r[11], REF0); r[17] = i != null && i >= (r[12] === 'F' ? CORTE.F : CORTE.M) ? 1 : 0; r[11] = ''; r[13] = ''; });
    CRV_AREA.set(c, 'RAW', R);
    if (ctx && typeof ctx === 'object') MEMO.set(ctx, new Set(R.map(r => CRV_AREA.fm(r[0]))));
  },
  // a confirmação vale para quem ficou na base recortada (o filtro roda antes, com o mesmo ctx)
  regs:{ conf: (id, d, ctx) => { const m = (String(id).match(/^(\d+)$/) || [])[1]; if (!m) return false; const s = MEMO.get(ctx) || ctx.mats; return s.has(CRV_AREA.fm(m)); } },
  limparReg(col, d){ return { s:d.s }; }   // só a marcação (aposentado / não aposentado)
});
})();

/* Levantamento de Perfil Profissional: a base injetada é só configuração (THEMES, SERIES, MAP), sem pessoas
   nem números da empresa, e fica igual. As pessoas vêm dos lançamentos (coleção 'colaboradores', um por pessoa).
   Regra (out/2026): o gestor vê quem o painel do RH mostra ao filtrar pelo mesmo setor/departamento.
   O painel filtra por "Departamento" (campo depto do lançamento, que veio do Quadro: setor) e "Gerência / área"
   (gerencia, com nomes de gerência/pessoa, que não correspondem aos setores do Quadro). Não há campo de setor (área).
   Então: entra quem tem depto entre os departamentos do gestor (setor inteiro: todos os departamentos que o Quadro
   tem nesse setor). Exceção: 3 nomes de departamento existem em mais de um setor no Quadro (ex.: RECEPCAO na
   Indústria e na ADM - CRV); nesses casos desempata pelo setor atual da matrícula no Quadro, para não mostrar
   gente de outro setor. Lançamento sem departamento (ex.: importado de planilha sem setor) não entra. */
(function(){
const MEMO = new WeakMap();   // ctx → departamentos que existem em mais de um setor no Quadro
const repetidos = ctx => { let s = MEMO.get(ctx); if (s) return s; const a = {}; s = new Set();
  Object.values(ctx.mapa || {}).forEach(o => { const d = CRV_AREA.N(o && o.setor); if (!d) return; (a[d] = a[d] || new Set()).add(CRV_AREA.N(o.area)); });
  Object.keys(a).forEach(d => { if (a[d].size > 1) s.add(d); }); MEMO.set(ctx, s); return s; };
CRV_AREA.reg({ id:'perfil', nome:'Levantamento de Perfil Profissional', frente:'Seleção e Perfil Profissional',
  filtro(c, ctx){ /* nada a recortar: só configuração */ },
  regs:{ colaboradores: (id, d, ctx) => {
    const dep = String(d.depto || '').trim(); if (!dep) return false;
    if (repetidos(ctx).has(CRV_AREA.N(dep))) { const q = (ctx.mapa || {})[CRV_AREA.fm(d.mat)]; if (q && q.area) return CRV_AREA.casa(ctx, q.area, dep); }
    return CRV_AREA.casa(ctx, '', dep);
  } },
  /* informações e avisos do RH (obs, aviso) ficam só com o RH: não vão para o gestor */
  limparReg(col, d){ ['criadoPor','atualizadoPor','por','autor','email','obs','aviso'].forEach(k => delete d[k]); return d; },
  /* Rodada 3: o gestor registra o parecer da gestão na própria ficha e envia ao RH (tipo 'perfil', mesmo formato do formPerfil antigo).
     O painel grava col.doc(id).update({parecer}) e a ponte entrega aqui o documento inteiro já mesclado. */
  envios:{ colaboradores: (id, d) => {
    const pr = d && d.parecer; if (!pr || typeof pr !== 'object') return null;
    const acoes = (Array.isArray(pr.acoes) ? pr.acoes : []).map(a => String(a).trim()).filter(Boolean), txt = String(pr.txt || '').trim(), resp = String(pr.resp || '').trim();
    if (!acoes.length) throw new Error('Marque pelo menos uma ação da gestão.');
    if (txt.length < 15) throw new Error('Escreva as observações, com prazo e responsável.');
    const mat = String(d.mat || id || '').trim(); if (!mat) throw new Error('Colaborador sem matrícula no levantamento. Fale com a Gestão de Pessoas.');
    const n = k => +d[k] || 0, nums = { atest:n('atest'), falta:n('falta'), fj:n('fj'), adv:n('adv'), susp:n('susp') }, pl = (v, s, p) => v + ' ' + (v === 1 ? s : p);
    const resumo = [['Colaborador', String(d.nome || '')],
      ['Números do levantamento', pl(nums.atest, 'atestado', 'atestados') + ' · ' + pl(nums.falta, 'falta', 'faltas') + (nums.fj ? ' (+ ' + nums.fj + ' just.)' : '') + ' · ' + pl(nums.adv, 'advertência', 'advertências') + ' · ' + pl(nums.susp, 'suspensão', 'suspensões')],
      ['Ação da gestão', acoes.join(', ')], ['Observações, prazos e responsáveis', txt], ['Responsável pelo acompanhamento', resp || '(quem assina)']];
    if (acoes.includes('Desligamento')) resumo.push(['Atenção', 'Desligamento marcado: o RH vai conferir estabilidade, processos e o histórico antes de qualquer passo.']);
    // _g: o que o painel precisa para remontar a ficha do envio pendente depois de recarregar (aceitar/verEnvio ignoram)
    const _g = { id:String(id || ''), nome:String(d.nome || ''), funcao:String(d.funcao || ''), depto:String(d.depto || ''), gerencia:String(d.gerencia || ''), adm:String(d.adm || '') };
    return { tipo:'perfil', mat, dados:{ ref:new Date().toISOString().slice(0, 10), acoes, txt, resp, nums, _g }, resumo };
  } },
  /* envio 'perfil' ainda aguardando o RH → ficha como o painel lê, com o parecer enviado e _aguardaRH */
  pendente(e){
    if (!e || e.tipo !== 'perfil' || e.status !== 'enviado') return null;
    const d = e.dados || {}, g = d._g || {}, n = d.nums || {}, mat = String(e.mat || '').trim(); if (!mat) return null;
    const doc_id = g.id || mat.replace(/[^A-Za-z0-9_\-.~:@+]/g, '-').slice(0, 100);
    return { colecao:'colaboradores', doc_id, dados:{ mat:mat, nome:g.nome || String(e.colaborador || '').toUpperCase(), funcao:g.funcao || d.funcao || '', depto:g.depto || d.secao || '', gerencia:g.gerencia || '', adm:g.adm || '',
      atest:+n.atest || 0, falta:+n.falta || 0, fj:+n.fj || 0, susp:+n.susp || 0, adv:+n.adv || 0,
      parecer:{ acoes:Array.isArray(d.acoes) ? d.acoes.slice() : [], txt:d.txt || '', resp:d.resp || '', em:String(e.criado_em || d.ref || '').slice(0, 10) }, _aguardaRH:true } };
  }
});
})();

/* ---------- Quadro de Colaboradores (recorte do gestor) ----------
   Regra: fica exatamente quem o painel do RH mostra com o filtro de Setor (st.area → r[AREA]) ou de Seção (st.dep → r.dk).
   Setor = coluna AREA da própria base (D: com a mesma troca do painel: centro de custo OFICINA conta em Oficina);
   Seção = departamento da chave de código (r.dk), com o setor da seção como o painel monta (DEPS).
   Vale para ativos (D) e para o histórico de TODAS as empresas (DM: CRV, APFO e CAPFO), sem usar matrícula:
   assim as visões "Todas as empresas e anos" (Admissões 'a' e Desligamentos 'r') também batem.
   Readmissão (r.re) e saída anterior (PREVX) dependem de passagens em outros setores: vão prontas em GRE (calculadas na base toda).
   Sai: CPF, RG, PIS, CTPS, CNH nº, nascimento, idade, endereço, telefone, e-mail, pais, naturalidade, tipo sanguíneo,
   estado civil, salário, grupo de CID e médico dos atestados. */
(function(){
const cx = ctx => (ctx.areasN ? ctx : Object.assign(ctx, (({areasN, depSelN, depsN, areasConhecidasN}) => ({areasN, depSelN, depsN, areasConhecidasN}))(CRV_AREA.contexto(ctx.chaves, ctx.mapa))));
CRV_AREA.reg({ id:'quadro', nome:'Quadro de Colaboradores', frente:'Gestão de Colaboradores',
  filtro(c, ctx){ cx(ctx);
    const A = CRV_AREA, N = A.N, SEM = '—';                 // idade removida: texto, não cai em faixa etária
    const [MAT, DEP, AREA, ADM, CC] = [0, 3, 5, 9, 13];
    const XOK = [4, 5, 6, 14, 23, 24, 29, 30, 31, 32, 33, 34];   // X que ficam: CNH categoria/validade/UF, CBO, códigos de seção/função/CC, férias, sexo
    const limpaX = x => { const o = Array((x && x.length) || 35).fill(''); if (x) XOK.forEach(i => { if (i < x.length) o[i] = x[i]; }); return o; };
    const D = A.get(c, 'D') || [], X = A.get(c, 'X') || [], PID = A.get(c, 'PID') || [], DM = A.get(c, 'DM') || [];
    // setor do ativo como o painel usa (centro de custo OFICINA vai para Oficina)
    const efA = r => (r[CC] === 'OFICINA' && r[AREA] !== 'Oficina' && !/^(Afastados|Desistentes)$/i.test(r[AREA])) ? 'Oficina' : r[AREA];
    // seções (DEPS) montadas igual ao painel: chave de código; setor da seção = o da 1ª pessoa com a chave
    const DEPS = new Map(), dkD = [], dkM = [];
    D.forEach((r, i) => { const k = (X[i] && X[i][23]) || r[DEP]; dkD[i] = k; if (!DEPS.has(k)) DEPS.set(k, { n:r[DEP], a:efA(r) }); });
    DM.forEach((r, i) => { let k = r[22] || r[DEP]; if (DEPS.has(k) && DEPS.get(k).n != r[DEP]) k = k + '|' + r[DEP]; dkM[i] = k; if (!DEPS.has(k)) DEPS.set(k, { n:r[DEP], a:r[AREA] }); });
    // nome da seção como o painel do RH mostra (desempate entre seções de mesmo nome feito na base toda): chave código|nome → rótulo
    const LAB = {}; { const c1 = {}, c2 = {}, cc = new Map();
      D.forEach((r, i) => { if (!cc.has(dkD[i])) cc.set(dkD[i], r[CC]); });
      [...DEPS].forEach(([k, d]) => { if (cc.has(k)) { c1[d.n] = (c1[d.n] || 0) + 1; c2[d.n + '|' + cc.get(k)] = (c2[d.n + '|' + cc.get(k)] || 0) + 1; } });
      const labs = new Set();
      D.forEach((r, i) => { const k = dkD[i], d = DEPS.get(k), x = cc.get(k), l = c1[d.n] < 2 ? d.n : c2[d.n + '|' + x] < 2 ? d.n + ' · ' + x : d.n + ' · cód. ' + k; labs.add(l); LAB[((X[i] && X[i][23]) || r[DEP]) + '|' + r[DEP]] = l; });
      const vist = new Set(); DM.forEach((r, i) => { const k = dkM[i]; if (cc.has(k)) { LAB[(r[22] || r[DEP]) + '|' + r[DEP]] = LAB[(r[22] || r[DEP]) + '|' + r[DEP]] || null; return; }
        if (vist.has(k)) return; vist.add(k); const l = labs.has(r[DEP]) ? r[DEP] + ' · cód. ' + r[22] : r[DEP]; labs.add(l); LAB[(r[22] || r[DEP]) + '|' + r[DEP]] = l; }); }
    const okSet = a => ctx.areasN.has(N(a));                                            // filtro "Setor"
    const okSec = k => { const d = DEPS.get(k); return !!d && ctx.depSelN.has(N(d.a) + '|' + N(d.n)); };   // filtro "Seção"
    const fica = (area, dk) => okSet(area) || okSec(dk);
    // readmissão e saída anterior na base TODA (passagens em outro setor contam, como no painel do RH)
    const ALL = D.map((r, i) => ({ r, p:PID[i], dm:0, i, m:'D' })).concat(DM.map((r, i) => ({ r, p:r[26], dm:1, i, m:'M' })));
    const G = new Map(); ALL.forEach(o => { (G.get(o.p) || G.set(o.p, []).get(o.p)).push(o); });
    G.forEach(L => { const S = L.slice().sort((a, b) => a.r[ADM] < b.r[ADM] ? -1 : a.r[ADM] > b.r[ADM] ? 1 : 0);
      S.forEach((o, j) => { o.re = j > 0 && S[j - 1].r[ADM] < o.r[ADM]; });
      L.forEach(o => { let px = ''; L.forEach(q => { if (q !== o && q.dm && q.r[ADM] < o.r[ADM] && q.r[20] <= o.r[ADM] && q.r[20] > px) px = q.r[20]; }); o.px = px; }); });
    const reD = new Map(), reM = new Map(); ALL.forEach(o => (o.m === 'D' ? reD : reM).set(o.i, o));
    // ativos (D, X e PID andam juntos)
    const mD = new Map(), mDM = new Map(), nD = [], nX = [], nP = [], nDM = [], gD = [], gM = [], mats = new Set();
    D.forEach((r, i) => { if (!fica(efA(r), dkD[i])) return; mD.set(i, nD.length); const q = r.slice(); q[10] = SEM; nD.push(q); nX.push(limpaX(X[i])); nP.push(PID[i]);
      const o = reD.get(i); gD.push(o.re || o.px ? [o.re ? 1 : 0, o.px] : 0); mats.add(A.fm(r[MAT])); });
    // desligados de todas as empresas do grupo, pelo setor/seção da própria linha
    DM.forEach((r, i) => { if (!fica(r[AREA], dkM[i])) return; mDM.set(i, nDM.length); const q = r.slice(); q[10] = SEM; if (q.length > 27) q[27] = ''; nDM.push(q);
      const o = reM.get(i); gM.push(o.re || o.px ? [o.re ? 1 : 0, o.px] : 0); if (/\(5\)\s*$/.test(String(r[21] || ''))) mats.add(A.fm(r[MAT])); });
    A.set(c, 'D', nD); A.set(c, 'X', nX); A.set(c, 'PID', nP); A.set(c, 'DM', nDM);
    ctx._qMats = mats;                                                                   // matrículas CRV que ficaram (para os lançamentos)
    // referência de linha: >=0 → D[i]; <0 → DM[-i-1]; undefined = pessoa saiu do recorte
    const rb = v => v == null ? null : v >= 0 ? (mD.has(v) ? mD.get(v) : undefined) : (mDM.has(-v - 1) ? -mDM.get(-v - 1) - 1 : undefined);
    // admissões/rescisões 2026 (planilha) ligadas à base; sem ligação: setor e seção da própria planilha (EXR[10], EXR[9])
    const AX = A.get(c, 'AXD');
    if (AX) {
      const fx = (L, sl) => (L || []).filter(e => e[2] == null ? (sl && (okSet(e[10]) || ctx.depSelN.has(N(e[10]) + '|' + N(e[9])))) : rb(e[2]) !== undefined)
        .map(e => { const o = e.slice(); if (o[2] != null) o[2] = rb(o[2]); return o; });
      AX.ADR = fx(AX.ADR, false); AX.EXR = fx(AX.EXR, true);
    }
    // atestados e ocorrências: PR = pessoas (índice da base); O/A apontam para PR. Linhas fora da base o painel não usa: saem.
    const AB = A.get(c, 'ABSD');
    if (AB) {
      const mp = new Map(), PR = [];
      (AB.PR || []).forEach((x, i) => { if (Array.isArray(x)) return; const n = rb(x); if (n === undefined || n === null) return; mp.set(i, PR.length); PR.push(n); });
      AB.PR = PR;
      AB.O = (AB.O || []).filter(o => mp.has(o[0])).map(o => [mp.get(o[0])].concat(o.slice(1)));
      AB.A = (AB.A || []).filter(a => mp.has(a[0])).map(a => [mp.get(a[0]), a[1], a[2], 0, 0]);   // fica data e dias; CID e médico saem
      AB.grps = ['Grupo de CID restrito ao RH'];
      AB.docs = [['', '']];
    }
    // horários: só de quem ficou nos ativos; HNF (pessoas da planilha de horários fora do Quadro) não tem setor → sai
    const H = A.get(c, 'HOR'), mA = new Set(nD.map(r => String(r[MAT])));
    if (H) { const o = {}; Object.keys(H).forEach(k => { if (mA.has(String(k))) o[k] = H[k]; }); A.set(c, 'HOR', o); }
    A.set(c, 'HNF', []);
    A.set(c, 'CPFM', {});
    // o que não vai para o painel (ex.: CPFP = CPF por pessoa) sai; item novo e desconhecido vai vazio
    if (c.dados && !Array.isArray(c.dados)) {
      const CON = ['D', 'X', 'DM', 'PID', 'AXD', 'ABSD', 'HOR', 'HNF', 'HREF', 'CPFM'], nm = Array.isArray(c.nomes) ? c.nomes : CON;
      Object.keys(c.dados).forEach(k => { if (!nm.includes(k)) delete c.dados[k];
        else if (!CON.includes(k)) { const v = c.dados[k]; c.dados[k] = Array.isArray(v) ? [] : v && typeof v == 'object' ? {} : typeof v == 'string' ? '' : null; } });
      const lab = {}; nD.forEach((r, i) => { const k = ((nX[i] && nX[i][23]) || r[DEP]) + '|' + r[DEP]; if (LAB[k]) lab[k] = LAB[k]; }); nDM.forEach(r => { const k = (r[22] || r[DEP]) + '|' + r[DEP]; if (LAB[k]) lab[k] = LAB[k]; });
      c.dados.GRE = { D:gD, M:gM, lab, ar:(ctx.chaves || []).filter(k => /^a:/.test(k)).map(k => k.slice(2)) };   // ar = setores inteiros do gestor (previsão)                                                      // lido pelo painel só com CRV_GESTOR_AREA
      if (Array.isArray(c.nomes) && !c.nomes.includes('GRE')) c.nomes.push('GRE');
    }
  },
  regs:(function(){
    const fm = CRV_AREA.fm, tem = (ctx, m) => !!ctx._qMats && ctx._qMats.has(fm(m));
    // documento 'm<matrícula>' (histórico da folha, por pessoa)
    const pM = (id, d, ctx) => { const m = (String(id).match(/^m(\d+)$/) || [])[1]; return !!m && tem(ctx, m); };
    // APFO/CAPFO: só os documentos 'c<matrícula CRV>' (os 'a…' usam outra matrícula)
    const pC = (id, d, ctx) => { const m = (String(id).match(/^c(\d+)$/) || [])[1]; return !!m && tem(ctx, m) && (!d.mat || fm(d.mat) === fm(m)); };
    // estabilidade: só tipos sem dado de saúde (gestante, acidente, doença ficam com o RH)
    const est = (id, d, ctx) => !!d.mat && tem(ctx, d.mat) && !/gest|matern|acident|doen|sa[uú]de|afast|cid/i.test((d.tipo || '') + ' ' + (d.detalhe || ''));
    return { hist_depto:pM, hist_cargo:pM, hist_ferias:pM, hist_curso:pM, hist_exame:pM, hist_ocor:pM, hist_atest:pM,
      hist_ocor6:pC, hist_ocor16:pC, hist_atest6:pC, hist_atest16:pC, estabilidade:est };
  })(),
  limparReg(col, d){
    if (!d || typeof d != 'object') return d;
    Object.keys(d).forEach(k => { if (/^(cpf|rg|pis|nasc|nascimento|idade|tel|telefone|cel|celular|endereco|email|salario|sal|cid|medico|crm)$/i.test(k)) delete d[k]; });
    if (/^hist_atest/.test(col) && Array.isArray(d.l)) d.l = d.l.map(a => Array.isArray(a) ? [a[0], a[1]] : a);   // atestado: só data e dias
    return d;
  }
});
})();

/* ---------- Admissões (recorte do gestor) ----------
   Regra: fica exatamente quem o painel do RH mostra com o filtro de Setor (S.ar = coluna 5 das linhas, índice de D.areas).
   Gestor de seção: a seção da própria linha (coluna 4, D.deps) dentro do setor da linha.
   D.rows = admissões 2026, D.exits = saídas 2026 (mesmos campos). Quadro mensal: hcA (por setor) e hcG (por seção/código/CC).
   Sai: idade (coluna 11) e as observações/categorias de bloqueio com processo trabalhista ou saúde. */
(function(){
  const SENS = /process|trabalhist|judic|reclama|atestad|sa[uú]de|afast|doen|cid\b|bipolar|m[eé]dic/i;
  window.CRV_AREA_BLQ = window.CRV_AREA_BLQ || function(B, ok){
    const o = {};
    Object.keys(B || {}).forEach(m => { if (!ok(m)) return; const v = B[m] || [];
      const cat = String(v[0] || '').split('/').map(s => s.trim()).filter(s => s && !SENS.test(s)).join(' / ');
      o[m] = [cat || 'Detalhes com o RH', '']; });
    return o;
  };
const cx = ctx => (ctx.areasN ? ctx : Object.assign(ctx, (({areasN, depSelN, depsN, areasConhecidasN}) => ({areasN, depSelN, depsN, areasConhecidasN}))(CRV_AREA.contexto(ctx.chaves, ctx.mapa))));
CRV_AREA.reg({ id:'admissoes', nome:'Admissões', frente:'Gestão de Colaboradores',
  filtro(c, ctx){ cx(ctx);
    const A = CRV_AREA, D = A.get(c, 'D');
    const mats = new Set();
    if (D) {
      const ar = D.areas || [], dp = D.deps || [], depA = D.depA || [];
      D.nm = Math.max(...(D.rows || []).map(r => +String(r[0]).slice(5, 7))) || null;   // meses do ano no painel do RH (o gestor vê o mesmo período)
      // setor = coluna 5 da linha (filtro Setor do RH); gestor de seção: a seção da linha com o setor da seção (depA), como na aba Departamentos
      const secOk = d => ctx.depSelN.has(A.N(ar[depA[d]]) + '|' + A.N(dp[d]));
      const fica = r => ctx.areasN.has(A.N(ar[r[5]])) || secOk(r[4]);
      D.rows = (D.rows || []).filter(fica).map(r => { const q = r.slice(); q[11] = '—'; return q; });   // idade: texto, não entra em faixa
      D.exits = (D.exits || []).filter(fica);
      D.rows.concat(D.exits).forEach(r => mats.add(A.fm(r[1])));
      // quadro por seção: seções dos setores do gestor (setor da seção = depA) ou as seções marcadas
      // (gestor de setor: também as seções de outro setor que estão num código de setor/centro de custo do setor dele, como os totais por código do RH)
      const sA = D.setA || [], cA = D.ccA || [], arOk = i => ctx.areasN.has(A.N(ar[i]));
      D.hcG = (D.hcG || []).filter(g => arOk(depA[g[0]]) || arOk(sA[g[1]]) || arOk(cA[g[2]]) || secOk(g[0]));
      // quadro por setor: setor inteiro do gestor fica como está; gestor de seção = soma das seções dele; demais setores zerados
      D.hcA = (D.hcA || []).map((v, i) => { if (ctx.areasN.has(A.N(ar[i]))) return v;
        const t = v.map(() => 0); D.hcG.forEach(g => { if (depA[g[0]] === i && secOk(g[0])) g[3].forEach((q, k) => { if (k < t.length) t[k] += q; }); }); return t; });
      // setores que a aba Departamentos mostra sem filtro (o RH filtrado mostra só as seções do setor escolhido)
      D.gAr = ar.map((a, i) => i).filter(i => ctx.areasN.has(A.N(ar[i])) || dp.some((d, k) => depA[k] === i && secOk(k)));
      // contagens da empresa: total de saídas refeito; as demais não são usadas no painel
      if (D.meta) { D.meta.exTot = D.exits.length; ['inf', 'semCod', 'semGer', 'infSet'].forEach(k => { if (k in D.meta) D.meta[k] = 0; }); }
    }
    A.set(c, 'BLQ', window.CRV_AREA_BLQ(A.get(c, 'BLQ'), m => mats.has(A.fm(m))));
  },
  regs:{}
});
})();

/* ---------- Desligamentos (recorte do gestor) ----------
   Regra: fica exatamente quem o painel do RH mostra com o filtro de Setor (S.dg = setor da seção: D.dgs[D.sd[seção]])
   ou de Seção (S.dep = coluna 5 das linhas, índice de D.deps). D.rows = saídas 2026.
   D.P = pessoas sem nome [seção, função, admissão, saída] do quadro mensal: ficam as das mesmas seções/setor.
   Sai: categorias de bloqueio com processo trabalhista ou saúde e o texto livre da observação. */
(function(){
  const SENS = /process|trabalhist|judic|reclama|atestad|sa[uú]de|afast|doen|cid\b|bipolar|m[eé]dic/i;
  window.CRV_AREA_BLQ = window.CRV_AREA_BLQ || function(B, ok){
    const o = {};
    Object.keys(B || {}).forEach(m => { if (!ok(m)) return; const v = B[m] || [];
      const cat = String(v[0] || '').split('/').map(s => s.trim()).filter(s => s && !SENS.test(s)).join(' / ');
      o[m] = [cat || 'Detalhes com o RH', '']; });
    return o;
  };
const cx = ctx => (ctx.areasN ? ctx : Object.assign(ctx, (({areasN, depSelN, depsN, areasConhecidasN}) => ({areasN, depSelN, depsN, areasConhecidasN}))(CRV_AREA.contexto(ctx.chaves, ctx.mapa))));
CRV_AREA.reg({ id:'rescisoes', nome:'Desligamentos', frente:'Gestão de Colaboradores',
  filtro(c, ctx){ cx(ctx);
    const A = CRV_AREA, D = A.get(c, 'D'), mats = new Set();
    if (D) {
      const sd = D.sd || [], dg = D.dgs || [], dp = D.deps || [];
      D.nm = Math.max(...(D.rows || []).map(r => +String(r[0]).slice(5, 7))) || null;   // meses do ano no painel do RH (o gestor vê o mesmo período)
      const fica = di => A.casa(ctx, dg[sd[di]], dp[di]);
      D.rows = (D.rows || []).filter(r => fica(r[5]));
      D.rows.forEach(r => mats.add(A.fm(r[2])));
      D.P = (D.P || []).filter(p => fica(p[0]));
    }
    A.set(c, 'BLQ', window.CRV_AREA_BLQ(A.get(c, 'BLQ'), m => mats.has(A.fm(m))));
  },
  regs:{}
});
})();

/* área sem nenhuma sanção: o painel não é gerado para o gestor */
{ const d = CRV_AREA.def('sancoes'); if (d) d.vazio = c => !(((CRV_AREA.get(c, 'DB') || {}).R) || []).length; }
})();
