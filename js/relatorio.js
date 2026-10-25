/* =====================================================================
   RELATÓRIO MENSAL DA DIRETORIA
   Números do mês × mês anterior, calculados a partir das bases do app, e o texto do RH
   (ponto de atenção, o que fazer, o que acompanhar). O app só sugere frases factuais a partir
   das variações; a análise é escrita pelo RH.
   Texto salvo em registros do Quadro, coleção 'relatorio_mensal' (um documento por mês).
   ===================================================================== */
window.CRV_REL_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, fMat, fDias, podeVer, podeEditar, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF, NR1, RISCO, BASES } = X;
const TEND = ['Turnover do mês', 'Pedidos de demissão', 'Saídas com até 90 dias de casa', 'Dias de atestado por colaborador', 'Faltas por colaborador', 'Advertências', 'Suspensões', 'Ouvidorias abertas'];

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const mesTxt = k => { const [a, m] = k.split('-'); return MESES[+m - 1] + '/' + a; };
const fimMes = k => { const [a, m] = k.split('-').map(Number); return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10); };
const mesAnt = k => { const [a, m] = k.split('-').map(Number); return m === 1 ? (a - 1) + '-12' : a + '-' + String(m - 1).padStart(2, '0'); };
const nf = (v, d = 0) => v == null || isNaN(v) ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits:d, maximumFractionDigits:d });
const SEC = [['mov', 'Movimentação'], ['freq', 'Frequência'], ['disc', 'Disciplina'], ['esc', 'Escuta e risco'], ['dev', 'Desenvolvimento']];

async function calcular(mes){
  const Q = await window.CRV_QUADRO(); if (!Q) return null;
  const M = Q.mapa, mats = Object.keys(M);
  const out = { mes, refQ:Q.referencia, ind:[], notas:[] };
  let EX = {}, TIP = [];
  try { const q = await window.CRV_DADOS('quadro'); const A = q && q.dados.AXD; if (A) { TIP = A.TIP || []; (A.EXR || []).forEach(r => { EX[fMat(r[0]) + '|' + String(r[1]).slice(0, 7)] = r; }); } } catch(_){}
  const pes = (m, extra) => { const c = M[m] || {}; return [c.nome || m, m, c.funcao || '', c.area || '', extra || '']; };
  const um = async k => {
    const ini = k + '-01', fim = fimMes(k);
    const ativos = mats.filter(m => { const c = M[m]; return c.admissao && c.admissao <= fim && (c.situacao !== 'Desligado' || (c.deslig && c.deslig > fim)); });
    const adm = mats.filter(m => { const a = M[m].admissao; return a >= ini && a <= fim; });
    const sai = mats.filter(m => { const c = M[m]; return c.situacao === 'Desligado' && c.deslig >= ini && c.deslig <= fim; });
    const tipo = m => { const r = EX[m + '|' + k]; return r ? (TIP[r[3]] || '') : ''; };
    const ped = sai.filter(m => /pedido/i.test(tipo(m))), s90 = sai.filter(m => M[m].admissao && fDias(M[m].admissao, M[m].deslig) <= 90);
    const O = await window.CRV_OCORR(mats, ini, fim);
    const absAte = O.abs || '', temAbs = absAte >= ini;
    let at = 0, fa = 0, adv = 0, sus = 0; const lAt = [], lFa = [], lAdv = [], lSus = [];
    Object.entries(O.P).forEach(([m, o]) => { if (o.at.length) { at += o.at.length; lAt.push([m, o.at.length]); } if (o.fa.length) { fa += o.fa.length; lFa.push([m, o.fa.length]); }
      if (o.adv.length) { adv += o.adv.length; lAdv.push([m, o.adv.length]); } if (o.sus.length) { sus += o.sus.length; lSus.push([m, o.sus.length]); } });
    let ouv = [], tr = null;
    try { const o = await window.CRV_DADOS('ouvidorias'); if (o) { (o.dados.RAW || []).forEach(r => ouv.push({ data:r[0], setor:r[1], tipo:r[2] })); (await window.CRV_REGS('ouvidorias', 'casos')).filter(x => !x.excluida).forEach(x => ouv.push({ data:x.abertura, setor:x.area, tipo:x.tipo })); } } catch(_){}
    ouv = ouv.filter(x => String(x.data || '').slice(0, 7) === k);
    try { const t = await window.CRV_DADOS('treinamentos'); const D = t && t.dados.DATA; if (D && +String(k).slice(0, 4) === +D.ano) { const i = +k.slice(5) - 1, metas = (D.metas || []).slice();
        if (D.ano === 2026 && metas[3] === 235) metas[3] = 220; if (D.ano === 2026 && metas.length > 4) metas[4] = 170; // mesmos ajustes do painel de Treinamentos
        let real = 0, part = 0, prev = 0; (D.rows || []).forEach(r => { if (r[4] === i) { prev++; if (r[5]) { real++; part += r[6] || 0; } } });
        (await window.CRV_REGS('treinamentos', 'novos')).filter(x => !x.excluido && +x.mes === i).forEach(x => { prev++; if (x.data) { real++; part += parseInt(x.n, 10) || 0; } });
        tr = { real, part, prev, meta: metas[i] != null ? metas[i] : null }; } } catch(_){}
    return { k, ini, fim, ativos, adm, sai, ped, s90, tipo, temAbs, absAte, at, fa, adv, sus, lAt, lFa, lAdv, lSus, ouv, tr };
  };
  const A = await um(mes), B = await um(mesAnt(mes));
  out.A = A; out.B = B;
  const n = (x) => x.ativos.length || 1;
  const I = (sec, t, a, b, o) => out.ind.push(Object.assign({ sec, t, a, b }, o || {}));
  const lp = L => L.map(m => pes(m));
  // movimentação
  I('mov', 'Quadro no fim do mês', A.ativos.length, B.ativos.length, { neutro:1, lista:() => ['Quadro no fim do mês', ['Colaborador', 'Matrícula', 'Função', 'Área'], lp(A.ativos)] });
  I('mov', 'Admissões', A.adm.length, B.adm.length, { neutro:1, lista:() => ['Admissões', ['Colaborador', 'Matrícula', 'Função', 'Área', 'Admissão'], A.adm.map(m => pes(m, brD(M[m].admissao)))] });
  I('mov', 'Saídas', A.sai.length, B.sai.length, { pior:'up', lista:() => ['Saídas', ['Colaborador', 'Matrícula', 'Função', 'Área', 'Saída · tipo'], A.sai.map(m => pes(m, brD(M[m].deslig) + (A.tipo(m) ? ' · ' + A.tipo(m) : '')))] });
  I('mov', 'Pedidos de demissão', A.ped.length, B.ped.length, { pior:'up', lista:() => ['Pedidos de demissão', ['Colaborador', 'Matrícula', 'Função', 'Área', 'Saída'], A.ped.map(m => pes(m, brD(M[m].deslig)))] });
  I('mov', 'Turnover do mês', 100 * A.sai.length / n(A), 100 * B.sai.length / n(B), { pior:'up', d:1, suf:'%' });
  I('mov', 'Saídas com até 90 dias de casa', A.s90.length, B.s90.length, { pior:'up', lista:() => ['Saídas com até 90 dias de casa', ['Colaborador', 'Matrícula', 'Função', 'Área', 'Admissão → saída'], A.s90.map(m => pes(m, brD(M[m].admissao) + ' → ' + brD(M[m].deslig)))] });
  // frequência
  const pLista = (t, L) => () => [t, ['Colaborador', 'Matrícula', 'Função', 'Área', 'Quantidade'], L.sort((a, b) => b[1] - a[1]).map(([m, q]) => pes(m, String(q)))];
  if (A.temAbs) {
    I('freq', 'Dias de atestado', A.at, B.temAbs ? B.at : null, { pior:'up', lista:pLista('Dias de atestado', A.lAt) });
    I('freq', 'Dias de atestado por colaborador', A.at / n(A), B.temAbs ? B.at / n(B) : null, { pior:'up', d:2 });
    I('freq', 'Faltas', A.fa, B.temAbs ? B.fa : null, { pior:'up', lista:pLista('Faltas', A.lFa) });
    I('freq', 'Faltas por colaborador', A.fa / n(A), B.temAbs ? B.fa / n(B) : null, { pior:'up', d:2 });
    if (A.absAte < A.fim) out.notas.push(`Absenteísmo de ${mesTxt(mes)} só até ${brD(A.absAte)}: o mês ainda não está completo na base.`);
  } else out.notas.push(`Ainda não há absenteísmo de ${mesTxt(mes)} na base (vai até ${brD(A.absAte) || '—'}).`);
  // disciplina
  I('disc', 'Advertências', A.adv, B.adv, { pior:'up', lista:pLista('Advertências', A.lAdv) });
  I('disc', 'Suspensões', A.sus, B.sus, { pior:'up', lista:pLista('Suspensões', A.lSus) });
  // escuta e risco
  const ouvL = () => ['Ouvidorias', ['Data', 'Setor', 'Tipo'], A.ouv.map(x => [brD(x.data), x.setor, x.tipo])];
  I('esc', 'Ouvidorias abertas', A.ouv.length, B.ouv.length, { pior:'up', lista:ouvL });
  I('esc', 'Ouvidorias de assédio', A.ouv.filter(x => /ass[eé]dio/i.test(x.tipo || '')).length, B.ouv.filter(x => /ass[eé]dio/i.test(x.tipo || '')).length, { pior:'up', lista:ouvL });
  try { const pr = E.paineis.find(x => x.id === 'risco'); if (pr && podeVer(pr)) { const N = await RISCO().niveis(); const L = Object.entries(N).filter(([, v]) => v.niv === 'a');
      I('esc', 'Risco alto de saída (hoje)', L.length, null, { pior:'up', foto:1, lista:() => ['Risco alto de saída', ['Colaborador', 'Matrícula', 'Função', 'Área', 'Sinais'], L.map(([m, v]) => pes(m, v.S.join(', ')))] }); } } catch(_){}
  try { const pn = E.paineis.find(x => x.id === 'nr1'); if (pn && podeVer(pn)) { const L = (await window.CRV_REGS('nr1', 'acoes')).filter(a => !a.excluida && a.status !== 'ok'); const h = new Date().toISOString().slice(0, 10);
      I('esc', 'Ações NR-1 em aberto (hoje)', L.length, null, { neutro:1, foto:1, extra: L.filter(a => a.prazo && a.prazo < h).length + ' com prazo vencido' }); } } catch(_){}
  // desenvolvimento
  if (A.tr) { const semL = A.tr.prev - A.tr.real;
    I('dev', 'Treinamentos realizados', A.tr.real, B.tr ? B.tr.real : null, { pior:'down', semLanc: semL > 0, extra: [A.tr.meta != null ? `meta ${A.tr.meta} · ${nf(A.tr.meta ? 100 * A.tr.real / A.tr.meta : 0)}% da meta` : '', semL > 0 ? `${semL} previsto${semL > 1 ? 's' : ''} sem data de realização lançada` : ''].filter(Boolean).join(' · ') });
    I('dev', 'Participações em treinamento', A.tr.part, B.tr ? B.tr.part : null, { pior:'down', semLanc: semL > 0 });
    if (semL > 0) out.notas.push(`Treinamentos de ${mesTxt(mes)}: ${semL} previsto${semL > 1 ? 's' : ''} ainda sem lançamento no painel de Treinamentos; o número do mês pode estar incompleto.`);
    else if (!A.tr.prev) out.notas.push(`Nenhum treinamento de ${mesTxt(mes)} lançado no painel de Treinamentos.`); }
  // retenção aos 90 dias dos admitidos 3 meses antes
  { const k3 = mesAnt(mesAnt(mesAnt(mes))), k4 = mesAnt(k3); const coorte = k => { const L = mats.filter(m => String(M[m].admissao || '').slice(0, 7) === k); const s = L.filter(m => M[m].situacao === 'Desligado' && M[m].deslig && fDias(M[m].admissao, M[m].deslig) <= 90); return { L, s, r: L.length ? 100 - 100 * s.length / L.length : null }; };
    const a = coorte(k3), b = coorte(k4);
    if (a.L.length) I('mov', `Retenção aos 90 dias (admitidos em ${mesTxt(k3)})`, a.r, b.r, { pior:'down', suf:'%', lista:() => [`Admitidos em ${mesTxt(k3)} que saíram com até 90 dias`, ['Colaborador', 'Matrícula', 'Função', 'Área', 'Saída'], a.s.map(m => pes(m, brD(M[m].deslig)))] }); }
  return finalizar(out);
}
/* variação e sugestões factuais (também usada para mês fechado) */
function finalizar(out){
  const mes = out.mes;
  out.ind.forEach(x => { x.var = x.b != null && x.b !== 0 ? (x.a - x.b) / Math.abs(x.b) : null;
    x.ruim = !x.neutro && !x.semLanc && x.var != null && (x.pior === 'up' ? x.var > 0 : x.var < 0); });
  out.sug = out.ind.filter(x => x.ruim && !x.semLanc && Math.abs(x.var) >= .15 && Math.abs(x.a - x.b) >= 2 && !/por colaborador/.test(x.t))
    .sort((p, q) => Math.abs(q.var) - Math.abs(p.var)).slice(0, 5)
    .map(x => `${x.t}: ${fmt(x, x.a)} em ${mesTxt(mes)}, contra ${fmt(x, x.b)} em ${mesTxt(mesAnt(mes))} (${x.var > 0 ? '+' : ''}${nf(100 * x.var)}%).`);
  return out;
}
const fmt = (x, v) => v == null ? '—' : nf(v, x.d || (x.suf === '%' ? 1 : 0)) + (x.suf || '');

async function tela(){
  if (!E.perfil || !['admin', 'rh'].includes(E.perfil.papel)) { location.hash = '#/'; return; }
  const princ = E.perfil.papel === 'admin';   // fechar e reabrir mês: só a administradora principal
  const h = new Date().toISOString().slice(0, 10), atual = h.slice(0, 7);
  const opc = []; for (let k = atual; k >= '2026-01'; k = mesAnt(k)) opc.push(k);
  let mes = mesAnt(atual), R = null, T = {}, FECH = {};
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas</div><h1>Relatórios Gerenciais</h1><div class="ini-data">Onde estamos, o principal ponto de atenção, o que fazer e o que acompanhar</div></div>
      <div class="dk-acoes"><label class="rl-mes">Mês <select id="rl-mes">${opc.map(k => `<option value="${k}" ${k === mes ? 'selected' : ''}>${mesTxt(k)}</option>`).join('')}</select></label><button class="btn borda" id="rl-xls">Excel</button><button class="btn prim" id="rl-pdf">PDF</button></div></section>
    <div id="rl-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Calculando o mês…</p></div></div>`);
  const lerFechados = async () => { FECH = {}; try { const { data } = await sb.from('registros').select('doc_id,dados').eq('painel', 'quadro').eq('colecao', 'relatorio_fechado').range(0, 999); (data || []).forEach(x => { if (x.dados && !x.dados.reaberto) FECH[x.doc_id] = x.dados; }); } catch(_){} 
    const sel = $('#rl-mes'); if (sel) [...sel.options].forEach(o => o.textContent = mesTxt(o.value) + (FECH[o.value] ? '  ✓ fechado' : '')); };
  // mês fechado: números guardados no fechamento; as listas de pessoas vêm dos dados atuais
  const doFechado = (f, vivo) => finalizar({ mes, refQ:f.refQ, notas:f.notas || [], fechado:f,
    ind: f.ind.map(x => Object.assign({}, x, { lista: vivo && (vivo.ind.find(y => y.t === x.t) || {}).lista })) });
  const usarAnterior = o => { const fa = FECH[mesAnt(mes)]; if (!fa) return o; o.ind.forEach(x => { const y = fa.ind.find(z => z.t === x.t); if (y && !x.foto) x.b = y.a; }); return finalizar(o); };
  const carregar = async () => { $('#rl-corpo').innerHTML = '<div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Calculando o mês…</p></div>';
    await lerFechados();
    try { const vivo = await calcular(mes); R = FECH[mes] ? usarAnterior(doFechado(FECH[mes], vivo)) : (vivo ? usarAnterior(vivo) : null); } catch(e){ console.warn('relatorio', e); R = null; }
    try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('colecao', 'relatorio_mensal').eq('doc_id', mes).maybeSingle(); T = (data && data.dados) || {}; } catch(_){ T = {}; }
    desenhar(); };
  $('#rl-mes').onchange = e => { mes = e.target.value; carregar(); };
  function desenhar(){
    const c = $('#rl-corpo'); if (!c) return;
    if (!R) { c.innerHTML = '<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3></div>'; return; }
    const card = (x, i) => { const v = x.var, cor = x.neutro || v == null || Math.abs(v) < .005 ? '' : x.ruim ? 'r' : 'v';
      return `<button class="rl-k ${x.lista ? '' : 'sem'}" data-i="${i}" ${x.lista ? '' : 'disabled'}><span>${esc(x.t)}</span><b>${esc(fmt(x, x.a))}</b>
        <small>${x.foto ? 'posição de hoje' : x.b == null ? 'sem comparação' : `<i class="rl-v ${cor}">${v == null ? '' : (v > 0 ? '▲ ' : v < 0 ? '▼ ' : '') + nf(Math.abs(100 * v)) + '%'}</i> ${esc(mesTxt(mesAnt(mes)).split('/')[0])}: ${esc(fmt(x, x.b))}`}</small>${x.extra ? `<small>${esc(x.extra)}</small>` : ''}</button>`; };
    const f = R.fechado, passado = mes < atual;
    const est = f ? `<section class="cartao rl-est ok"><div><b>Mês fechado</b><span>em ${esc(new Date(f.fechadoEm).toLocaleDateString('pt-BR'))} por ${esc(f.fechadoPor || '')}${f.ressalvas && f.ressalvas.length ? ' · com ressalvas: ' + esc(f.ressalvas.join('; ')) : ''}. Os números deste mês não mudam mais, mesmo com bases novas.</span></div>${princ ? '<button class="btn borda" id="rl-reab">Reabrir</button>' : ''}</section>`
      : `<section class="cartao rl-est"><div><b>Mês em aberto</b><span>${passado ? 'Os números ainda mudam quando as bases forem atualizadas. Feche o mês para guardar os números e formar a série histórica.' : 'Mês corrente: feche depois que ele terminar e as bases estiverem atualizadas.'}</span></div>${passado && princ ? '<button class="btn prim" id="rl-fech">Fechar o mês</button>' : ''}</section>`;
    const TL = Object.keys(FECH).sort().filter(k => k <= mes).slice(-12);
    const tend = TL.length >= 2 ? `<section class="fc-sec cartao rl-tend"><header><h3>Tendência dos meses fechados</h3><small>${TL.length} meses</small></header><div class="fc-tw"><table class="fc-t"><thead><tr><th>Indicador</th>${TL.map(k => `<th>${esc(mesTxt(k).slice(0, 3))}/${k.slice(2, 4)}</th>`).join('')}<th></th></tr></thead><tbody>
        ${TEND.map(t => { const v = TL.map(k => { const x = FECH[k].ind.find(z => z.t === t); return x ? x : null; }); if (!v.some(Boolean)) return ''; const nums = v.map(x => x ? x.a : null), ok = nums.filter(n => n != null), mx = Math.max(...ok), mn = Math.min(...ok);
          const pts = nums.map((n, i) => n == null ? null : [6 + i * (108 / Math.max(1, nums.length - 1)), 24 - (mx === mn ? 9 : 18 * (n - mn) / (mx - mn))]).filter(Boolean);
          return `<tr><td>${esc(t)}</td>${v.map(x => `<td>${x ? esc(fmt(x, x.a)) : '—'}</td>`).join('')}<td><svg class="rl-sp" viewBox="0 0 120 30" width="120" height="30"><polyline fill="none" stroke="currentColor" stroke-width="2" points="${pts.map(p => p.join(',')).join(' ')}"/>${pts.length ? `<circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="2.6" fill="currentColor"/>` : ''}</svg></td></tr>`; }).join('')}</tbody></table></div></section>`
      : `<section class="cartao rl-est"><div><b>Tendência</b><span>A série aparece a partir de 2 meses fechados${TL.length ? ' (já tem ' + TL.length + ')' : ''}. ${mes > '2026-01' ? 'Você pode fechar de uma vez os meses anteriores de 2026 com os dados de hoje; eles ficam marcados como fechados depois.' : ''}</span></div>${mes > '2026-01' && princ ? '<button class="btn borda" id="rl-lote">Fechar meses anteriores</button>' : ''}</section>`;
    c.innerHTML = `${est}${SEC.map(([k, t]) => { const L = R.ind.map((x, i) => [x, i]).filter(([x]) => x.sec === k); return L.length ? `<section class="rl-sec"><h3>${t}</h3><div class="rl-g">${L.map(([x, i]) => card(x, i)).join('')}</div></section>` : ''; }).join('')}
      ${R.notas.length ? `<p class="nr-fonte">${R.notas.map(esc).join(' ')}</p>` : ''}
      ${tend}
      <section class="cartao rl-txt"><header><h3>Análise do RH</h3><small>O que você escrever aqui vai no PDF. Fica salvo por mês.</small></header>
        ${R.sug.length ? `<div class="rl-sug"><span>Sugestões a partir dos números (clique para inserir no ponto de atenção):</span>${R.sug.map((s, i) => `<button class="rl-s" data-s="${i}">${esc(s)}</button>`).join('')}</div>` : '<p class="nr-nota" style="padding:0 0 8px">Nenhuma piora acima de 15% em relação ao mês anterior.</p>'}
        <label>Principal ponto de atenção<textarea id="rl-t1" rows="3" maxlength="1200">${esc(T.ponto || '')}</textarea></label>
        <label>O que fazer<textarea id="rl-t2" rows="3" maxlength="1200" placeholder="Ações, responsáveis e prazos">${esc(T.fazer || '')}</textarea></label>
        <label>O que acompanhar<textarea id="rl-t3" rows="2" maxlength="800" placeholder="Indicadores e datas para o próximo mês">${esc(T.acomp || '')}</textarea></label>
        <div class="rl-sv"><small id="rl-st">${T.em ? 'Salvo em ' + new Date(T.em).toLocaleString('pt-BR') + (T.por ? ' por ' + esc(T.por) : '') : ''}</small><button class="btn prim" id="rl-sv">Salvar análise</button></div></section>
      <p class="nr-fonte">Quadro de ${esc(brD(R.refQ))} (CRV). Quadro no fim do mês e turnover são aproximados pelo Quadro atual: quem foi readmitido conta pela admissão mais recente. Saídas por tipo vêm das rescisões do Quadro. Os números com "hoje" são a posição atual, não do mês.</p>`;
    c.querySelectorAll('.rl-k[data-i]').forEach(b => b.onclick = () => { const x = R.ind[+b.dataset.i]; if (!x.lista) return; const [t, cab, L] = x.lista();
      abrirModal({ titulo:`${t}: ${mesTxt(mes)}`, largo:true, corpo: L.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr>${cab.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${L.map(l => `<tr>${l.map((v, j) => `<td>${j === 0 && cab[1] === 'Matrícula' ? `<a class="cd-fl" href="#/ficha/${esc(l[1])}">${esc(v)}</a>` : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Ninguém.</p>',
        aoAbrir: m => m.querySelectorAll('a.cd-fl').forEach(a => a.onclick = () => fecharModal()) }); });
    c.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const t = $('#rl-t1'); t.value = (t.value.trim() ? t.value.trim() + '\n' : '') + R.sug[+b.dataset.s]; t.focus(); });
    $('#rl-sv').onclick = salvar;
    const bf = $('#rl-fech'); if (bf) bf.onclick = fechar;
    const br = $('#rl-reab'); if (br) br.onclick = async () => { if (br.dataset.conf !== '1') { br.dataset.conf = '1'; br.textContent = 'Confirmar: reabrir'; return; }
      const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'relatorio_fechado/' + mes, colecao:'relatorio_fechado', doc_id:mes, dados:Object.assign({}, R.fechado, { reaberto:true, reabertoEm:new Date().toISOString(), reabertoPor:E.perfil.nome }), atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
      if (error) { toast(traduzErro(error), true); return; } toast('Mês reaberto.'); carregar(); };
    const bl = $('#rl-lote'); if (bl) bl.onclick = fecharAnteriores;
  }
  const snap = (o, ress) => ({ mes:o.mes, refQ:o.refQ, notas:o.notas, ressalvas:ress || [], fechadoEm:new Date().toISOString(), fechadoPor:E.perfil.nome,
    ind:o.ind.map(x => ({ sec:x.sec, t:x.t, a:x.a, b:x.b, d:x.d, suf:x.suf, neutro:x.neutro, pior:x.pior, foto:x.foto, extra:x.extra, semLanc:x.semLanc })) });
  const gravarFech = async (k, d) => { const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'relatorio_fechado/' + k, colecao:'relatorio_fechado', doc_id:k, dados:d, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' }); if (error) throw error; };
  async function conferir(k, o){
    const fim = fimMes(k), I = await BASES().internas(), iso = BASES().isoDe, ref = id => iso(E.metas[id] && (E.metas[id].referencia || E.metas[id].atualizado_em));
    const C = [['Quadro Geral', ref('quadro')], ['Absenteísmo (dentro do Quadro)', I['quadro:abs']], ['Rescisões (dentro do Quadro)', I['quadro:resc']]];
    if (E.metas.sancoes) C.push(['Sanções', ref('sancoes')]); if (E.metas.ouvidorias) C.push(['Ouvidorias', ref('ouvidorias')]);
    const L = C.map(([t, ate]) => ({ t, ate, ok: !!ate && ate >= fim }));
    const tr = o.ind.find(x => x.t === 'Treinamentos realizados'); if (tr) L.push({ t:'Treinamentos lançados', ate:'', ok:!tr.semLanc, det: tr.semLanc ? tr.extra : 'sem previstos pendentes' });
    return L;
  }
  async function fechar(){
    salvar().catch(() => {});
    const L = await conferir(mes, R); const pend = L.filter(x => !x.ok);
    abrirModal({ titulo:`Fechar ${mesTxt(mes)}`, largo:true, corpo:`<p class="nr-nota" style="margin:0 0 10px;padding:0">Antes de fechar, confira se as bases já cobrem o mês inteiro (até ${esc(brD(fimMes(mes)))}). Depois de fechado, os números ficam guardados como estão.</p>
      <div class="rl-ck">${L.map(x => `<div class="${x.ok ? 'ok' : 'no'}"><i>${x.ok ? '✓' : '!'}</i><b>${esc(x.t)}</b><span>${x.det ? esc(x.det) : x.ate ? 'vai até ' + esc(brD(x.ate)) : 'sem data'}</span></div>`).join('')}</div>
      ${pend.length ? '<p class="nr-nota" style="margin:10px 0 0;padding:0;color:#a3301c">Há bases que não cobrem o mês inteiro. O ideal é atualizar antes. Se fechar assim, o relatório guarda essas ressalvas.</p>' : ''}`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="fc-c">Cancelar</button><button class="btn ${pend.length ? 'perigo' : 'prim'}" id="fc-ok">${pend.length ? 'Fechar com ressalvas' : 'Fechar o mês'}</button>`,
      aoAbrir: m => { m.querySelector('#fc-c').onclick = fecharModal; m.querySelector('#fc-ok').onclick = async () => {
        try { await gravarFech(mes, snap(R, pend.map(x => x.t + (x.ate ? ' até ' + brD(x.ate) : '')))); fecharModal(); toast(mesTxt(mes) + ' fechado.'); carregar(); } catch(e){ toast(traduzErro(e), true); } }; } });
  }
  async function fecharAnteriores(){
    const L = []; for (let k = mesAnt(mes); k >= '2026-01'; k = mesAnt(k)) if (!FECH[k]) L.push(k);
    if (!L.length) { toast('Os meses anteriores já estão fechados.'); return; }
    abrirModal({ titulo:'Fechar meses anteriores', corpo:`<p class="nr-nota" style="margin:0;padding:0">Vou fechar ${L.length} ${L.length === 1 ? 'mês' : 'meses'} (${esc(L.slice().reverse().map(k => mesTxt(k).slice(0, 3)).join(', '))}) com os dados de hoje. Fica registrado que o fechamento foi feito depois, com as ressalvas de cada mês.</p>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="fa-c">Cancelar</button><button class="btn prim" id="fa-ok">Fechar</button>`,
      aoAbrir: m => { m.querySelector('#fa-c').onclick = fecharModal; m.querySelector('#fa-ok').onclick = async () => { const b = m.querySelector('#fa-ok'); b.disabled = true;
        try { for (const k of L.slice().reverse()) { b.textContent = 'Fechando ' + mesTxt(k) + '…'; const o = await calcular(k); if (!o) continue; const ck = await conferir(k, o);
            const d = snap(o, ck.filter(x => !x.ok).map(x => x.t + (x.ate ? ' até ' + brD(x.ate) : ''))); d.retroativo = true; await gravarFech(k, d); }
          fecharModal(); toast('Meses fechados.'); carregar(); } catch(e){ toast(traduzErro(e), true); b.disabled = false; } }; } });
  }
  async function salvar(){
    const d = { mes, ponto:$('#rl-t1').value.trim(), fazer:$('#rl-t2').value.trim(), acomp:$('#rl-t3').value.trim(), em:new Date().toISOString(), por:E.perfil.nome };
    const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'relatorio_mensal/' + mes, colecao:'relatorio_mensal', doc_id:mes, dados:d, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
    if (error) { toast(traduzErro(error), true); return false; } T = d; const st = $('#rl-st'); if (st) st.textContent = 'Salvo agora'; toast('Análise salva.'); return true;
  }
  const textoAtual = () => ({ ponto:($('#rl-t1') || {}).value || T.ponto || '', fazer:($('#rl-t2') || {}).value || T.fazer || '', acomp:($('#rl-t3') || {}).value || T.acomp || '' });
  const escolher = (tipo, fazer) => abrirModal({ titulo:`Exportar em ${tipo}`, corpo:`<p class="nr-nota" style="margin:0 0 10px;padding:0">Escolha o que vai no relatório.</p><div class="nr-esc">${SEC.filter(([k]) => R.ind.some(x => x.sec === k)).map(([k, t]) => `<label><input type="checkbox" value="${k}" checked> ${t}</label>`).join('')}${tendL().length >= 2 ? '<label><input type="checkbox" value="tend" checked> Tendência dos meses fechados</label>' : ''}<label><input type="checkbox" value="txt" checked> Análise do RH</label></div>`,
    pe:`<span style="flex:1"></span><button class="btn borda" id="ex-c">Cancelar</button><button class="btn prim" id="ex-ok">Baixar</button>`,
    aoAbrir: m => { m.querySelector('#ex-c').onclick = fecharModal; m.querySelector('#ex-ok').onclick = () => { const sel = [...m.querySelectorAll('input:checked')].map(i => i.value); fecharModal(); fazer(sel); }; } });
  const linhasSec = k => R.ind.filter(x => x.sec === k).map(x => [x.t, fmt(x, x.a), x.foto ? 'posição de hoje' : fmt(x, x.b), x.var == null || x.foto ? '' : Math.abs(x.var) < .005 ? '0%' : (x.var > 0 ? '+' : '') + nf(100 * x.var) + '%', x.extra || '']);
  const tendL = () => Object.keys(FECH).sort().filter(k => k <= mes).slice(-12);
  const tendTab = (n) => { const TL = tendL().slice(-n); return { cab:['Indicador', ...TL.map(k => mesTxt(k).slice(0, 3) + '/' + k.slice(2, 4))], lin: TEND.map(t => [t, ...TL.map(k => { const x = FECH[k].ind.find(z => z.t === t); return x ? fmt(x, x.a) : '—'; })]) }; };
  const nomeArq = () => 'Relatorio diretoria ' + mesTxt(mes).replace('/', ' ');
  $('#rl-xls').onclick = () => { if (!R) return; escolher('Excel', sel => { const tx = textoAtual(); const aoa = [['Relatórios Gerenciais · Gestão de Pessoas CRV · ' + mesTxt(mes)], []];
    SEC.filter(([k]) => sel.includes(k)).forEach(([k, t]) => { aoa.push([t], ['Indicador', mesTxt(mes), mesTxt(mesAnt(mes)), 'Variação', 'Observação'], ...linhasSec(k), []); });
    if (sel.includes('tend')) { const T2 = tendTab(12); aoa.push(['Tendência dos meses fechados'], T2.cab, ...T2.lin, []); }
    if (sel.includes('txt')) aoa.push(['Principal ponto de atenção', tx.ponto], ['O que fazer', tx.fazer], ['O que acompanhar', tx.acomp]);
    if (R.notas.length) aoa.push([], [R.notas.join(' ')]);
    const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [{ wch:44 }, { wch:18 }, { wch:18 }, { wch:12 }, { wch:30 }]; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nomeArq() + '.xlsx'); }); };
  $('#rl-pdf').onclick = () => { if (!R) return; escolher('PDF', sel => { const tx = textoAtual(); const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' });
    cabecalhoPDF(doc, 'Relatórios Gerenciais', 'Gestão de Pessoas · ' + mesTxt(mes)); let y = 104; const W = doc.internal.pageSize.getWidth();
    const bloco = (t, txt, cor) => { if (!txt) return; const L = doc.splitTextToSize(txt, W - 76); const hh = 22 + L.length * 12; if (y + hh > 790) { doc.addPage(); y = 40; }
      doc.setFillColor(...cor); doc.rect(30, y, 4, hh - 6, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 33, 61); doc.text(t, 42, y + 11);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(40, 48, 66); doc.text(L, 42, y + 25); y += hh + 8; };
    if (sel.includes('txt')) { bloco('Principal ponto de atenção', tx.ponto, [212, 87, 63]); bloco('O que fazer', tx.fazer, [233, 162, 59]); bloco('O que acompanhar', tx.acomp, [46, 138, 87]); }
    SEC.filter(([k]) => sel.includes(k)).forEach(([k, t]) => { const L = linhasSec(k); if (!L.length) return; if (y > 700) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20, 33, 61); doc.text(t, 30, y + 6);
      doc.autoTable({ startY:y + 12, head:[['Indicador', mesTxt(mes), mesTxt(mesAnt(mes)), 'Variação', '']], body:L, margin:{ left:30, right:30 }, styles:{ fontSize:8.5, cellPadding:3 }, headStyles:{ fillColor:[36,66,124] }, columnStyles:{ 0:{ cellWidth:190 }, 4:{ textColor:[93,106,133] } },
        didParseCell: d => { if (d.section === 'body' && d.column.index === 3) { const x = R.ind.filter(z => z.sec === k)[d.row.index]; if (x && !x.neutro && x.var) d.cell.styles.textColor = x.ruim ? [163,48,28] : [29,107,66]; } } });
      y = doc.lastAutoTable.finalY + 18; });
    if (sel.includes('tend')) { const T2 = tendTab(8); if (y > 680) { doc.addPage(); y = 40; } doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20, 33, 61); doc.text('Tendência dos meses fechados', 30, y + 6);
      doc.autoTable({ startY:y + 12, head:[T2.cab], body:T2.lin, margin:{ left:30, right:30 }, styles:{ fontSize:8, cellPadding:2.6 }, headStyles:{ fillColor:[46,138,87] }, columnStyles:{ 0:{ cellWidth:150 } } }); y = doc.lastAutoTable.finalY + 18; }
    if (R.fechado) R.notas = R.notas.concat(['Mês fechado em ' + new Date(R.fechado.fechadoEm).toLocaleDateString('pt-BR') + (R.fechado.ressalvas && R.fechado.ressalvas.length ? ', com ressalvas: ' + R.fechado.ressalvas.join('; ') : '') + '.']).filter((v, i, a) => a.indexOf(v) === i);
    else R.notas = R.notas.filter(v => !/^Mês fechado/.test(v)).concat(['Mês em aberto: números sujeitos a atualização.']).filter((v, i, a) => a.indexOf(v) === i);
    const nota = 'Fonte: bases do app (Quadro de ' + brD(R.refQ) + ', absenteísmo, sanções, ouvidorias, treinamentos). ' + R.notas.join(' ') + ' Quadro no fim do mês e turnover aproximados pelo Quadro atual.';
    if (y > 760) { doc.addPage(); y = 40; } doc.setFontSize(7.5); doc.setTextColor(93, 106, 133); doc.text(doc.splitTextToSize(nota, W - 60), 30, y + 4);
    rodapePDF(doc); baixar(doc.output('blob'), nomeArq() + '.pdf'); }); };
  carregar();
}
return { tela };
};
