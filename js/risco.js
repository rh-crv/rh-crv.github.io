/* =====================================================================
   RISCO DE SAÍDA
   Alerta por colaborador ativo a partir de sinais que, nos dados da própria CRV, apareceram bem mais
   em quem saiu do que em quem ficou: faltas e atestados nos últimos 90 dias e tempo de casa.
   Sanções foram testadas e ficaram de fora (apareciam igual em quem saiu e em quem ficou).
   O painel refaz o teste com os dados carregados e mostra o resultado.
   Indica com quem conversar; não decide nada sobre a pessoa.
   Registros: painel 'risco', coleção 'conversas'.
   ===================================================================== */
window.CRV_RISCO_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, fMat, fDias, podeVer, podeEditar, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF, centralChave } = X;

const RES = { fica:'Vai continuar', acomp:'Seguir acompanhando', area:'Encaminhado à área', sair:'Pretende sair' };
const NIV = { a:'Alto', t:'Atenção' };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
let CACHE = null;

/* faltas e atestados por matrícula (absenteísmo do Quadro) */
async function eventos(){
  const q = await window.CRV_DADOS('quadro'); const A = q && q.dados.ABSD, D = q && q.dados.D, DM = q && q.dados.DM; if (!A || !D) return null;
  const base = Date.UTC(2026, 0, 1), iso = k => new Date(base + k * 864e5).toISOString().slice(0, 10);
  const mat = A.PR.map(x => { if (x == null || Array.isArray(x)) return null; const r = x >= 0 ? D[x] : (DM || [])[-x - 1]; return r ? fMat(r[0]) : null; });
  const ev = {}; (A.O || []).forEach(([pi, d, t]) => { const m = mat[pi]; if (!m || (t !== 0 && t !== 1)) return; (ev[m] = ev[m] || { fa:[], at:[] })[t === 1 ? 'fa' : 'at'].push(iso(d)); });
  return { ev, last:A.last || '', ini:iso(0) };
}
function sinais(E2, m, ref, adm, refCasa){
  const de = addD(ref, -90), e = E2.ev[m] || { fa:[], at:[] };
  const fa = e.fa.filter(d => d > de && d <= ref), at = e.at.filter(d => d > de && d <= ref);
  const casa = adm ? fDias(adm, refCasa || ref) : null;
  const S = []; let p = 0;
  if (fa.length >= 15) { p += 3; S.push(fa.length + ' faltas em 90 dias: verificar abandono'); }
  else if (fa.length >= 3) { p += 3; S.push('3 ou mais faltas em 90 dias'); } else if (fa.length) { p += 2; S.push(fa.length === 1 ? '1 falta em 90 dias' : fa.length + ' faltas em 90 dias'); }
  if (casa != null && casa <= 90) { p += 2; S.push('até 90 dias de casa'); } else if (casa != null && casa <= 365) { p += 1; S.push('menos de 1 ano de casa'); }
  if (at.length >= 5) { p += 1; S.push(at.length + ' dias de atestado em 90 dias'); }
  return { p, niv: p >= 4 ? 'a' : p >= 3 ? 't' : '', S, fa, at, casa };
}

async function dados(){
  const Q = await window.CRV_QUADRO(); if (!Q) return null;
  const E2 = await eventos(); if (!E2) return { semAbs:true, refQ:Q.referencia };
  const M = Q.mapa, hoje = new Date().toISOString().slice(0, 10), ref = E2.last || hoje;
  const conv = (await window.CRV_REGS('risco', 'conversas')).filter(x => !x.excluida);
  const ult = {}; conv.forEach(c => { const m = fMat(c.mat); if (!ult[m] || c.data > ult[m].data) ult[m] = c; });
  const L = [];
  Object.entries(M).forEach(([m, c]) => { if (c.situacao !== 'Ativo') return; const s = sinais(E2, m, ref, c.admissao, hoje); if (!s.niv) return;
    L.push(Object.assign({ mat:m, nome:c.nome, funcao:c.funcao, setor:c.setor, area:c.area, vinculo:c.vinculo, adm:c.admissao, conv:ult[m] || null }, s)); });
  L.sort((a, b) => b.p - a.p || b.fa.length - a.fa.length || a.nome.localeCompare(b.nome, 'pt-BR'));
  // teste do critério: quem saiu (com 90 dias de absenteísmo antes da saída) × quem está ativo hoje
  const tIni = addD(E2.ini, 90), sai = [], vol = [];
  let EX = {}, TIP = [];
  try { const q = await window.CRV_DADOS('quadro'); const A = q && q.dados.AXD; if (A) { TIP = A.TIP || []; (A.EXR || []).forEach(r => EX[fMat(r[0])] = r); } } catch(_){}
  Object.entries(M).forEach(([m, c]) => { if (c.situacao !== 'Desligado' || !c.deslig || c.deslig < tIni || c.deslig > ref) return; const s = sinais(E2, m, c.deslig, c.admissao); sai.push(s); const r = EX[m]; if (r && /pedido/i.test(TIP[r[3]] || '')) vol.push(s); });
  const ati = Object.entries(M).filter(([, c]) => c.situacao === 'Ativo').map(([m, c]) => sinais(E2, m, ref, c.admissao, hoje));
  const tx = (G, f) => pct(G.filter(f).length, G.length);
  const T = { periodo:[tIni, ref], nS:sai.length, nV:vol.length, nA:ati.length, linhas:[
    ['Risco alto', s => s.niv === 'a'], ['Alto ou atenção', s => !!s.niv], ['3 ou mais faltas em 90 dias', s => s.fa.length >= 3], ['Pelo menos 1 falta em 90 dias', s => s.fa.length >= 1],
    ['Até 90 dias de casa', s => s.casa != null && s.casa <= 90], ['5 ou mais dias de atestado em 90 dias', s => s.at.length >= 5]].map(([t, f]) => [t, tx(sai, f), tx(vol, f), tx(ati, f)]) };
  // acompanhamento: quem teve conversa registrada e saiu depois
  const comConv = Object.values(ult), saiuDepois = comConv.filter(c => { const p = M[fMat(c.mat)]; return p && p.situacao === 'Desligado' && p.deslig >= c.data; });
  CACHE = { L, T, ref, refQ:Q.referencia, conv, ult, comConv, saiuDepois, M };
  return CACHE;
}

/* para a ficha 360 */
async function daPessoa(mat){
  const Q = await window.CRV_QUADRO(); const c = Q && Q.mapa[mat]; if (!c || c.situacao !== 'Ativo') return null;
  const E2 = await eventos(); if (!E2) return null;
  const s = sinais(E2, mat, E2.last || new Date().toISOString().slice(0, 10), c.admissao, new Date().toISOString().slice(0, 10));
  const conv = (await window.CRV_REGS('risco', 'conversas')).filter(x => !x.excluida && fMat(x.mat) === mat).sort((a, b) => b.data.localeCompare(a.data));
  return Object.assign(s, { conv:conv[0] || null, ref:E2.last });
}

/* Central do dia: risco alto sem conversa nos últimos 30 dias */
async function pendencias(){
  const p = E.paineis.find(x => x.id === 'risco'); if (!p || !podeVer(p)) return [];
  const D = await dados(); if (!D || !D.L) return [];
  const lim = addD(new Date().toISOString().slice(0, 10), -30);
  const L = D.L.filter(x => x.niv === 'a' && !(x.conv && x.conv.data >= lim));
  if (!L.length) return [];
  return [{ id:'risco-alto', sev:'warn', t:'Risco alto de saída sem conversa recente', painel:'risco', pnome:'Risco de saída', d:'Faltas recentes e pouco tempo de casa. Uma conversa agora pode evitar a saída.',
    itens:L.map(x => ({ nome:x.nome, mat:x.mat, det:`${x.area || ''} · ${x.S.join(', ')}` })) }];
}

async function tela(p, cfg){
  const pode = podeEditar(p);
  moldura(`<div class="trilha"><button data-ir="#/">Início</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
    <section class="ini-topo capa" style="${(c => c ? '--c1:' + c[0] + ';--c2:' + c[1] : '')((window.CRV_CAPA || {})[p.frente])}"><div><div class="ini-eyebrow">${esc(p.frente)}</div><h1>Risco de saída</h1><div class="ini-data">Quem tem os sinais que mais apareceram antes das saídas na CRV, para conversar antes que a pessoa peça para sair</div></div>
      <div class="dk-acoes"><button class="btn borda" id="rs-xls">Excel</button><button class="btn borda" id="rs-pdf">PDF</button></div></section>
    <div id="rs-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Calculando…</p></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  let D = null; try { D = await dados(); } catch(e){ console.warn('risco', e); }
  const corpo = $('#rs-corpo'); if (!corpo) return;
  if (!D) { corpo.innerHTML = '<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3><p>O risco de saída usa o Quadro Geral com o absenteísmo.</p></div>'; return; }
  if (D.semAbs) { corpo.innerHTML = '<div class="cartao vazio"><h3>O Quadro carregado não tem o absenteísmo</h3><p>Carregue o Quadro com a aba de absenteísmo para calcular o risco.</p></div>'; return; }
  const F = { q:'', niv:'', area:'', sem:false };
  const lim30 = addD(new Date().toISOString().slice(0, 10), -30);
  const areas = [...new Set(D.L.map(x => x.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filtrar = () => { const q = normal(F.q); return D.L.filter(x => (!F.niv || x.niv === F.niv) && (!F.area || x.area === F.area) && (!F.sem || !(x.conv && x.conv.data >= lim30)) && (!q || normal(x.nome + ' ' + x.mat + ' ' + x.funcao + ' ' + x.setor).includes(q))); };
  const fonte = `Faltas e atestados dos 90 dias até ${brD(D.ref)} (absenteísmo do Quadro de ${brD(D.refQ)}); tempo de casa até hoje.`;

  function desenhar(){
    const L = filtrar(), nA = D.L.filter(x => x.niv === 'a').length, nT = D.L.filter(x => x.niv === 't').length;
    const c30 = D.conv.filter(c => c.data >= lim30).length, T = D.T, alto = T.linhas[0];
    corpo.innerHTML = `<section class="dk-kpis">
        <button class="dk-k ${F.niv === 'a' ? 'on' : ''}" data-niv="a" style="--c:var(--coral)"><span>Risco alto</span><b>${nA}</b><small>4 pontos ou mais</small></button>
        <button class="dk-k ${F.niv === 't' ? 'on' : ''}" data-niv="t" style="--c:var(--amber)"><span>Atenção</span><b>${nT}</b><small>3 pontos</small></button>
        <button class="dk-k ${F.sem ? 'on' : ''}" data-sem="1" style="--c:#2f6fa8"><span>Sem conversa em 30 dias</span><b>${D.L.filter(x => !(x.conv && x.conv.data >= lim30)).length}</b><small>${c30} conversa${c30 === 1 ? '' : 's'} registrada${c30 === 1 ? '' : 's'} em 30 dias</small></button>
        <a class="dk-k" href="#rs-teste" style="--c:var(--cane);text-decoration:none"><span>Teste do critério</span><b>${alto[1]}% × ${alto[3]}%</b><small>dos que saíram × dos que ficaram estavam em risco alto</small></a></section>
      <section class="dk-filtros cartao"><input id="rs-q" type="search" placeholder="Buscar nome, matrícula, função ou seção" value="${esc(F.q)}">
        <label>Área <select id="rs-area"><option value="">Todas</option>${areas.map(a => `<option ${a === F.area ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></label>
        ${F.niv || F.sem || F.area || F.q ? '<button class="btn borda" id="rs-limpa">Limpar filtros</button>' : ''}</section>
      <section class="fc-sec cartao"><div class="fc-tw"><table class="fc-t rs-t"><thead><tr><th>Colaborador</th><th>Nível</th><th>Sinais</th><th>Faltas</th><th>Atestado</th><th>Casa</th><th>Área · seção</th><th>Vínculo</th><th>Última conversa</th>${pode ? '<th></th>' : ''}</tr></thead>
        <tbody>${L.length ? L.map(x => `<tr><td><a class="cd-fl" href="#/ficha/${esc(x.mat)}"><b>${esc(x.nome)}</b></a><small class="rs-sub">${esc(x.mat)} · ${esc(x.funcao)}</small></td>
          <td><span class="rs-niv ${x.niv}">${NIV[x.niv]}</span></td><td class="rs-si">${x.S.map(s => `<span>${esc(s)}</span>`).join('')}</td>
          <td>${x.fa.length ? `<button class="nr-n" data-ev="${esc(x.mat)}">${x.fa.length}</button>` : '<span class="nr-z">0</span>'}</td><td>${x.at.length ? `<button class="nr-n" data-ev="${esc(x.mat)}">${x.at.length}d</button>` : '<span class="nr-z">0</span>'}</td>
          <td>${x.casa == null ? '—' : x.casa <= 365 ? x.casa + ' dias' : Math.floor(x.casa / 365) + ' a'}</td><td>${esc(x.area || '')}<small class="rs-sub">${esc(x.setor || '')}</small></td><td>${esc(x.vinculo || '')}</td>
          <td>${x.conv ? `${esc(brD(x.conv.data))}<small class="rs-sub">${esc(RES[x.conv.res] || '')}</small>` : '<span class="nr-z">—</span>'}</td>
          ${pode ? `<td><button class="btn borda rs-cv" data-cv="${esc(x.mat)}">Conversa</button></td>` : ''}</tr>`).join('') : `<tr><td colspan="10">Ninguém com esses filtros.</td></tr>`}</tbody></table></div></section>
      <div class="fc-grade" style="margin-top:12px">
        <section class="fc-sec cartao" id="rs-teste"><header><h3>Como o critério foi testado</h3><small>dados da própria CRV</small></header>
          <div class="fc-tw"><table class="fc-t"><thead><tr><th>Sinal nos 90 dias antes</th><th>Quem saiu<br><small>${T.nS} pessoas</small></th><th>Pedido de demissão<br><small>${T.nV} pessoas</small></th><th>Ativos hoje<br><small>${T.nA} pessoas</small></th></tr></thead>
            <tbody>${T.linhas.map(l => `<tr><td>${esc(l[0])}</td><td><b>${l[1]}%</b></td><td>${l[2]}%</td><td>${l[3]}%</td></tr>`).join('')}</tbody></table></div>
          <p class="nr-nota" style="padding-top:10px">Saídas de ${esc(brD(T.periodo[0]))} a ${esc(brD(T.periodo[1]))}, olhando os 90 dias antes de cada saída. Pontos: 3 ou mais faltas = 3; 1 ou 2 faltas = 2; até 90 dias de casa = 2; menos de 1 ano = 1; 5 ou mais dias de atestado = 1. Alto = 4 ou mais; atenção = 3. Sanções foram testadas e ficaram de fora: apareciam quase igual em quem saiu e em quem ficou. Parte das faltas acontece já perto da saída, então o alerta funciona melhor quanto antes a conversa acontece.</p></section>
        <section class="fc-sec cartao"><header><h3>Acompanhamento das conversas</h3></header>
          <div class="nr-lis" style="padding:12px 14px">
            <div class="nr-li" style="cursor:default"><span>Pessoas com conversa registrada</span><b>${D.comConv.length}</b></div>
            <button class="nr-li" id="rs-saiu"><span>Saíram depois da conversa</span><b>${D.saiuDepois.length}</b><small>${D.comConv.length ? pct(D.saiuDepois.length, D.comConv.length) + '% das pessoas com conversa' : 'sem conversas ainda'}</small></button></div>
          <p class="nr-nota">É assim que se mede se o alerta está ajudando: com o tempo, a proporção de quem sai depois da conversa deve ficar abaixo da de quem estava em risco e não teve conversa.</p></section></div>
      <p class="nr-fonte">${esc(fonte)} O alerta aponta com quem conversar; não serve para decidir desligamento, promoção ou qualquer medida sobre a pessoa.</p>`;
    corpo.querySelectorAll('[data-niv]').forEach(b => b.onclick = () => { F.niv = F.niv === b.dataset.niv ? '' : b.dataset.niv; desenhar(); });
    corpo.querySelectorAll('[data-sem]').forEach(b => b.onclick = () => { F.sem = !F.sem; desenhar(); });
    corpo.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => verEventos(D.L.find(x => x.mat === b.dataset.ev)));
    corpo.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => formConversa(D.L.find(x => x.mat === b.dataset.cv)));
    const sa = $('#rs-saiu'); if (sa) sa.onclick = () => abrirModal({ titulo:'Saíram depois da conversa', largo:true, corpo: D.saiuDepois.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Colaborador</th><th>Conversa</th><th>Resultado</th><th>Saída</th></tr></thead><tbody>${D.saiuDepois.map(c => { const p = D.M[fMat(c.mat)] || {}; return `<tr><td>${esc(p.nome || c.nome)}</td><td>${esc(brD(c.data))}</td><td>${esc(RES[c.res] || '')}</td><td>${esc(brD(p.deslig))}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="fc-vz">Ninguém.</p>' });
    const q = $('#rs-q'); q.oninput = () => { F.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { desenhar(); const e = $('#rs-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 250); };
    $('#rs-area').onchange = e => { F.area = e.target.value; desenhar(); };
    const lp = $('#rs-limpa'); if (lp) lp.onclick = () => { Object.assign(F, { q:'', niv:'', area:'', sem:false }); desenhar(); };
    corpo.querySelector('a.dk-k').onclick = ev => { ev.preventDefault(); $('#rs-teste').scrollIntoView({ behavior:'smooth', block:'start' }); };
  }
  function verEventos(x){
    abrirModal({ titulo:`${x.nome}: últimos 90 dias até ${brD(D.ref)}`, corpo:`<div class="fc-grade" style="grid-template-columns:1fr 1fr"><div><h4 style="margin:0 0 6px">Faltas (${x.fa.length})</h4>${x.fa.length ? x.fa.slice().reverse().map(d => `<div>${esc(brD(d))}</div>`).join('') : '<p class="fc-vz" style="padding:0">Nenhuma</p>'}</div>
      <div><h4 style="margin:0 0 6px">Dias de atestado (${x.at.length})</h4>${x.at.length ? x.at.slice().reverse().map(d => `<div>${esc(brD(d))}</div>`).join('') : '<p class="fc-vz" style="padding:0">Nenhum</p>'}</div></div>` });
  }
  function formConversa(x){
    const hoje = new Date().toISOString().slice(0, 10);
    abrirModal({ titulo:`Conversa: ${x.nome}`, largo:true,
      corpo:`<p class="nr-nota" style="margin:0 0 10px;padding:0">Sinais: ${esc(x.S.join(', '))}. Registre o que for útil para o acompanhamento; detalhes de saúde ficam fora daqui.</p><div class="nr-form">
        <div class="nr-c"><label for="cv-d">Data</label><input type="date" id="cv-d" value="${hoje}"></div>
        <div class="nr-c"><label for="cv-q">Quem conduziu</label><input id="cv-q" maxlength="120" value="${esc(E.perfil.nome)}"></div>
        <div class="nr-c w"><label for="cv-r">Resultado</label><select id="cv-r">${Object.entries(RES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div class="nr-c w"><label for="cv-o">O que foi conversado e combinado</label><textarea id="cv-o" rows="3" maxlength="800" placeholder="Ex.: dificuldade com transporte no turno B; combinado verificar troca de linha com a área"></textarea></div>
        <div class="nr-c"><label for="cv-p">Próximo acompanhamento</label><input type="date" id="cv-p" value="${addD(hoje, 30)}"></div></div>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="cv-c">Cancelar</button><button class="btn prim" id="cv-ok">Salvar</button>`,
      aoAbrir: m => { m.querySelector('#cv-c').onclick = fecharModal;
        m.querySelector('#cv-ok').onclick = async () => { const v = id => m.querySelector('#' + id).value.trim();
          const d = { mat:x.mat, nome:x.nome, data:v('cv-d') || hoje, quem:v('cv-q'), res:v('cv-r'), obs:v('cv-o'), prox:v('cv-p'), nivel:x.niv, sinais:x.S, criadoPor:E.perfil.nome, criadoEm:new Date().toISOString() };
          const id = x.mat + '_' + Date.now().toString(36);
          const { error } = await sb.from('registros').upsert({ painel:'risco', caminho:'conversas/' + id, colecao:'conversas', doc_id:id, dados:d, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
          if (error) { toast(traduzErro(error), true); return; }
          try { localStorage.removeItem(centralChave()); } catch(_){}
          fecharModal(); toast('Conversa registrada.'); D = await dados(); desenhar(); }; } });
  }
  const linhas = () => filtrar().map(x => [x.nome, x.mat, x.funcao, x.area || '', x.setor || '', x.vinculo || '', NIV[x.niv], x.S.join('; '), x.fa.length, x.at.length, x.casa == null ? '' : x.casa, x.conv ? brD(x.conv.data) + ' · ' + (RES[x.conv.res] || '') : '']);
  const cab = ['Colaborador', 'Matrícula', 'Função', 'Área', 'Seção', 'Vínculo', 'Nível', 'Sinais', 'Faltas 90d', 'Dias de atestado 90d', 'Dias de casa', 'Última conversa'];
  const nome = 'Risco de saida ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  $('#rs-xls').onclick = () => { if (!D || !D.L) return; const ws = XLSX.utils.aoa_to_sheet([cab, ...linhas()]); ws['!cols'] = cab.map((c, i) => ({ wch: i === 0 ? 34 : i === 7 ? 44 : 14 }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Risco de saída');
    const t = XLSX.utils.aoa_to_sheet([['Sinal nos 90 dias antes', 'Quem saiu (%)', 'Pedido de demissão (%)', 'Ativos hoje (%)'], ...D.T.linhas, [], [fonte]]); t['!cols'] = [{ wch:40 }, { wch:16 }, { wch:22 }, { wch:16 }]; XLSX.utils.book_append_sheet(wb, t, 'Teste do critério');
    baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nome + '.xlsx'); };
  $('#rs-pdf').onclick = () => { if (!D || !D.L) return; const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Risco de saída', `${filtrar().length} colaboradores · uso interno do RH`);
    doc.setFontSize(8.5); doc.setTextColor(60, 70, 90); doc.text(doc.splitTextToSize(fonte + ' O alerta aponta com quem conversar; não serve para decidir medidas sobre a pessoa.', 780), 30, 104);
    doc.autoTable({ startY:124, head:[cab], body:linhas().map(l => l.map(String)), margin:{ left:30, right:30 }, styles:{ fontSize:7, cellPadding:2.5, overflow:'linebreak' }, headStyles:{ fillColor:[36,66,124] }, alternateRowStyles:{ fillColor:[244,246,250] } });
    rodapePDF(doc); baixar(doc.output('blob'), nome + '.pdf'); };
  desenhar();
}
async function niveis(){ const D = await dados(); const o = {}; (D && D.L || []).forEach(x => o[x.mat] = { niv:x.niv, S:x.S }); return o; }
return { tela, pendencias, daPessoa, niveis, RES };
};
