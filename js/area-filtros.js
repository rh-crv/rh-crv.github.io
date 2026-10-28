/* Recortes por área dos painéis do RH para o gestor (registrados em CRV_AREA, js/area-paineis.js). */
(function(){ 'use strict'; if (!window.CRV_AREA) return; const CRV_AREA = window.CRV_AREA;

/* ---------- Registro de Danos (RD) ----------
   D.rows: [rd, data, matrícula, nome, i_func, i_dep, i_ger, admissão, situação, desfecho, ação, valor, parcelas, mês desc., obs, linha, flags]
   D.funcs / D.deps / D.gers: listas apontadas por índice nas linhas; D.hc: quadro por índice de departamento; EMP: matrícula → dados da Base Geral */
CRV_AREA.reg({ id:'rd', nome:'Registro de Danos', frente:'Ocorrências e Relações Trabalhistas',
  filtro(c, ctx){
    const fm = CRV_AREA.fm, D = CRV_AREA.get(c, 'D'); if (!D || !Array.isArray(D.rows)) return c;
    const up = s => String(s || '').trim().toUpperCase();
    // só RDs de pessoas da área (linhas sem matrícula não são de ninguém da área)
    const rows = D.rows.filter(r => r[2] != null && r[2] !== '' && ctx.mats.has(fm(r[2])));
    // reindexa função, departamento e gerência só com o que a área usa
    const novo = (lista, fixos) => { const m = new Map(), out = []; (fixos || []).forEach(v => { const i = lista.indexOf(v); if (i >= 0) { m.set(i, out.length); out.push(v); } });
      return { m, out, ix(i){ if (i == null || i < 0) return i; if (!m.has(i)) { m.set(i, out.length); out.push(lista[i]); } return m.get(i); } }; };
    const F = novo(D.funcs || []), DP = novo(D.deps || []), G = novo(D.gers || [], ['Não classificada']);
    rows.forEach(r => { r[4] = F.ix(r[4]); r[5] = DP.ix(r[5]); r[6] = G.ix(r[6]); });
    // quadro por departamento: o número do RH se o departamento é todo da área; senão, os ativos da área nesse departamento (Quadro)
    const hc = {}, M = ctx.mapa || {};
    const daArea = {}, fora = {};
    Object.keys(M).forEach(m => { const p = M[m]; if (!p || p.situacao === 'Desligado') return; const s = up(p.setor); if (!s) return;
      if (ctx.mats.has(fm(m))) daArea[s] = (daArea[s] || 0) + 1; else fora[s] = (fora[s] || 0) + 1; });
    DP.m.forEach((ni, oi) => { const s = up(D.deps[oi]); const h0 = (D.hc || {})[oi];
      if (!fora[s] && h0 != null) hc[ni] = h0; else if (daArea[s]) hc[ni] = daArea[s]; });
    D.rows = rows; D.funcs = F.out; D.deps = DP.out; D.gers = G.out; D.hc = hc;
    D.miss = []; // lacunas na numeração dos RDs são da planilha toda, não da área
    // EMP (consulta por matrícula no formulário): só a área
    const E = CRV_AREA.get(c, 'EMP');
    if (E && typeof E === 'object') { const e2 = {}; Object.keys(E).forEach(k => { if (ctx.mats.has(fm(k))) e2[k] = E[k]; }); CRV_AREA.set(c, 'EMP', e2); }
    CRV_AREA.set(c, 'D', D);
    return c;
  },
  regs:{
    // RDs cadastrados no app (matrícula no campo mat)
    novos:(id, d, ctx) => !d.excluida && ctx.mats.has(CRV_AREA.fm(d.mat)),
    // autorizações de desconto de RD da área (as de farmácia ficam só com o RH)
    autorizacoes:(id, d, ctx) => d.origem !== 'farmacia' && ctx.mats.has(CRV_AREA.fm(d.mat || (d.doc || {}).mat))
    // 'folhas' (compras da farmácia) não vai para o gestor
  },
  limparReg(colecao, d){
    // sem quem emitiu/excluiu
    ['por', 'excluidaPor', 'cadastradoPor', 'alteradoPor'].forEach(k => delete d[k]);
    return d;
  }
});

/* ---------- Absenteísmo ----------
   D.P: pessoas [i_dep, admissão, saída, nome, matrícula, função, contrato, situação, i_ger, i_func, i_set] (layout D.rh)
   D.O: ocorrências [i_pessoa, dia, tipo]; D.A: atestados [i_pessoa, dia, dias, i_grupo CID, i_médico]
   GEST: gestantes (saúde) → sai. CID e médico → saem; fica só a quantidade de dias de atestado.
   window.CRV_QSIT / CRV_OC só existem no RH: o painel já funciona sem eles. */
CRV_AREA.reg({ id:'absenteismo', nome:'Absenteísmo', frente:'Absenteísmo e Férias',
  filtro(c, ctx){
    const fm = CRV_AREA.fm, D = CRV_AREA.get(c, 'D'); if (!D || !Array.isArray(D.P)) return c;
    // pessoas da área e novo índice de cada uma
    const ni = new Map(), P = [];
    D.P.forEach((p, i) => { if (ctx.mats.has(fm(p[4]))) { ni.set(i, P.length); P.push(p); } });
    // listas por índice (setor, gerência, função, seção): só o que a área usa
    const novo = lista => { const m = new Map(), out = []; return { out, ix(i){ if (i == null || i < 0) return i; if (!m.has(i)) { m.set(i, out.length); out.push(lista[i]); } return m.get(i); } }; };
    const DP = novo(D.deps || []), G = novo(D.gers || []), F = novo(D.funcs || []), S = novo(D.sets || []);
    P.forEach(p => { p[0] = DP.ix(p[0]); p[8] = G.ix(p[8]); p[9] = F.ix(p[9]); p[10] = S.ix(p[10]); });
    // ocorrências e atestados reapontados para o novo índice da pessoa
    D.O = (D.O || []).filter(o => ni.has(o[0])).map(o => { o[0] = ni.get(o[0]); return o; });
    D.A = (D.A || []).filter(a => ni.has(a[0])).map(a => [ni.get(a[0]), a[1], a[2], 0, 0]);
    D.grps = ['CID restrito ao RH'];
    D.docs = [['Médico restrito ao RH', '']];
    D.P = P; D.deps = DP.out; D.gers = G.out; D.funcs = F.out; D.sets = S.out;
    CRV_AREA.set(c, 'D', D);
    CRV_AREA.set(c, 'GEST', []);
    // filtros guardados apontavam para índices da base inteira
    const st = CRV_AREA.get(c, 'S');
    if (st && typeof st === 'object') { ['set', 'func', 'ger', 'dept', 'open', 'topen'].forEach(k => { if (k in st) st[k] = -1; }); st.q = ''; st.tq = ''; CRV_AREA.set(c, 'S', st); }
    return c;
  },
  regs:{}  // o painel não tem lançamentos
});

/* ---------- Sanções Disciplinares (advertências e suspensões) ----------
   Base: DB = { P: matrícula → [nome, função, departamento, gerência, situação, contrato, admissão, rescisão],
     R: [tipo, mat, data, seq, índice em M/MC, dias, início, fim, atraso, origem?], M: textos dos motivos, MC: grupo de cada motivo,
     CONF: listas de índices em R (aba Conferência), HC/HG/HF: quadro ativo por departamento/gerência/função, QUADRO: total ativo,
     HA (opcional): metadados do histórico, CATS: grupos de motivo }.
   Recorte: P e R só da área; M/MC só os motivos usados; índices de R (CONF) e de M (R[4]) refeitos;
   QUADRO e HC/HG/HF recalculados com as pessoas ativas da área no Quadro. */
CRV_AREA.reg({ id:'sancoes', nome:'Sanções Disciplinares', frente:'Ocorrências e Relações Trabalhistas',
  filtro(c, ctx){
    const A = CRV_AREA, fm = A.fm, DB = A.get(c, 'DB'); if (!DB || !Array.isArray(DB.R)) return;
    const naArea = m => ctx.mats.has(fm(m));
    const P0 = DB.P || {};
    // pessoas: só as da área
    const P = {}; Object.keys(P0).forEach(m => { if (naArea(m)) P[m] = P0[m]; });
    // linhas: só da área; guarda o índice antigo → novo (para CONF) e reaproveita só os motivos usados (M/MC)
    const novoR = {}, novoM = {}, R = [], M = [], MC = [];
    DB.R.forEach((r, i) => { if (!naArea(r[1])) return;
      const x = r.slice(), mi = r[4];
      if (mi != null && DB.M && mi in DB.M) { if (!(mi in novoM)) { novoM[mi] = M.length; M.push(DB.M[mi]); MC.push(DB.MC ? DB.MC[mi] : 0); } x[4] = novoM[mi]; }
      novoR[i] = R.length; R.push(x); });
    // CONF: cada lista de índices aponta para as linhas novas (as de fora da área saem)
    const CONF = {}; Object.keys(DB.CONF || {}).forEach(k => { CONF[k] = (DB.CONF[k] || []).filter(i => i in novoR).map(i => novoR[i]); });
    // quadro ativo da área (Quadro de Colaboradores), contado com a mesma classificação usada no painel
    const Q = ctx.mapa || {}, ativo = q => q && !/deslig|demit/i.test(String(q.situacao || ''));
    const nz = s => String(s == null ? '' : s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, ' ').replace(/\b(DE|DA|DO|DAS|DOS|E)\b/g, ' ').replace(/\s+/g, ' ').trim();
    const QM = {}; Object.keys(Q).forEach(m => { QM[fm(m)] = Q[m]; });
    // quem está em P segue a situação do próprio painel (mesma base do "ativos ou afastados"); os demais, a do Quadro
    const mAtivos = [...ctx.mats].filter(m => P0[m] ? P0[m][4] !== 'DEMITIDO' : ativo(QM[m]));
    // para quem não está em P: nome do grupo no Quadro → nome usado no painel (igual normalizado, ou de/para que as pessoas de P confirmam em 80%+)
    const recontar = (H0, ip, campo) => {
      const dir = {}; Object.keys(H0 || {}).forEach(k => { dir[nz(k)] = k; });
      const par = {}; Object.keys(P0).forEach(m => { const q = QM[fm(m)]; if (!q) return; const v = nz(q[campo]); (par[v] = par[v] || {})[P0[m][ip]] = (par[v][P0[m][ip]] || 0) + 1; });
      const ali = {}; Object.keys(par).forEach(v => { const e = Object.entries(par[v]).sort((a, b) => b[1] - a[1]), t = e.reduce((s, x) => s + x[1], 0); if (e[0][1] >= 2 && e[0][1] / t >= 0.8) ali[v] = e[0][0]; });
      const H = {}; mAtivos.forEach(m => { const v = nz(QM[m][campo]); const k = P0[m] ? P0[m][ip] : (dir[v] || ali[v]); if (k) H[k] = (H[k] || 0) + 1; });
      return H; };
    DB.P = P; DB.R = R; DB.M = M; DB.MC = MC; DB.CONF = CONF;
    DB.QUADRO = mAtivos.length;
    DB.HC = recontar(DB.HC, 2, 'setor'); DB.HG = recontar(DB.HG, 3, 'gerencia'); DB.HF = recontar(DB.HF, 1, 'funcao');
    A.set(c, 'DB', DB);
  },
  // documentos emitidos no app (advertência e suspensão) entram no painel e no histórico: só os da área, não excluídos.
  // 'pedidos' NÃO é liberado: são pedidos pendentes do fluxo interno do RH (o painel mostraria o botão de emitir/descartar).
  regs:{ documentos:(id, d, ctx) => !d.excluido && (d.tipo === 'adv' || d.tipo === 'sus') && !!d.mat && ctx.mats.has(CRV_AREA.fm(d.mat)) },
  // só os campos que o painel usa (sai CPF, quem emitiu, testemunhas/observações internas etc.)
  limparReg(col, d){ if (col !== 'documentos') return d; const o = {};
    ['tipo','titulo','mat','nome','func','dep','ger','adm','data','assunto','desc','cat','dias','ini','fim','excluido','emitidoEm'].forEach(k => { if (d[k] !== undefined) o[k] = d[k]; });
    return o; }
});

/* ---------- Gestão de Fadiga (telemetria de veículos) ----------
   Base: D = { p: matrícula → [nome, função, seção, situação], r: [setor da fadiga, mat, mês, dia, motivo, turno, hora, frota, medida, flag, nº ocorrência] }.
   Nenhuma outra estrutura aponta por índice; os totais são calculados no painel a partir de D.r. LOGOJPG e IC (ícones) ficam. */
CRV_AREA.reg({ id:'fadiga', nome:'Gestão de Fadiga', frente:'Ocorrências e Relações Trabalhistas',
  filtro(c, ctx){
    const A = CRV_AREA, D = A.get(c, 'D'); if (!D) return;
    const ok = m => ctx.mats.has(A.fm(m));
    D.r = (D.r || []).filter(r => ok(r[1]));
    const p = {}; Object.keys(D.p || {}).forEach(m => { if (ok(m)) p[m] = D.p[m]; }); D.p = p;
    A.set(c, 'D', D);
  },
  regs:{
    // ocorrências cadastradas no app: pela matrícula do colaborador, sem as excluídas
    novos:(id, d, ctx) => !d.excluida && !d.excluido && !!d.mat && ctx.mats.has(CRV_AREA.fm(d.mat)),
    // tratativas (orientação/advertência/suspensão): o painel só usa tipo + nº das ocorrências para atualizar a medida; terceiros (sem matrícula) não entram
    tratativas:(id, d, ctx) => !d.excluido && !!d.mat && ctx.mats.has(CRV_AREA.fm(d.mat))
  },
  limparReg(col, d){ const o = {};
    const K = col === 'tratativas' ? ['tipo','titulo','mat','ocs','data','excluido','emitidoEm']
      : ['oc','data','hora','turno','setor','frota','mot','med','mat','nome','func','secao','sit','excluida','cadastradoEm'];
    K.forEach(k => { if (d[k] !== undefined) o[k] = d[k]; }); return o; }
});

/* área sem nenhuma sanção: o painel não é gerado para o gestor */
{ const d = CRV_AREA.def('sancoes'); if (d) d.vazio = c => !(((CRV_AREA.get(c, 'DB') || {}).R) || []).length; }
})();
