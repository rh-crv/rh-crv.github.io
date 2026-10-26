/* =====================================================================
   AVALIAÇÃO DE DESEMPENHO (colaboradores ativos)
   Mesmo formulário RE.0150.07 da avaliação de experiência (9 fatores, nota de 0 a 5, meta de 70%),
   marcado como "Desempenho". Lista vem do Quadro Geral (ativos e afastados da CRV).
   Registros: painel 'desempenho', coleção 'avaliacoes' (uma por colaborador e ciclo).
   ===================================================================== */
window.CRV_DES_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, podeEditar, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF } = X;

const FORM = 'RE.0150.07';
const META = .7;
const FAT = [["Pontualidade/ Assiduidade", "Chega e sai nos horários estabelecidos. Avisa com antecedência possíveis atrasos ou saídas antecipadas. É pontual em reuniões."], ["Iniciativa/Pró-atividade", "Capacidade de antecipar-se, não espera determinações. Apresenta sugestões pertinentes com frequência. Tem iniciativa para conhecer atividades diversas das que executa."], ["Relacionamento", "Se relaciona bem com colegas de trabalho e suas lideranças."], ["Organização", "Elabora cronograma de atividades, definindo prazos e prioridades. Executa suas atividades de maneira lógica e objetiva, de forma a serem facilmente compreendidas e continuadas por terceiros em caso de necessidade."], ["Metas", "Cumpre todas as metas estabelecidas. Contribui decisivamente e com contínuo esforço para o alcance ou a superação de suas metas e as da empresa."], ["Qualidade do serviço /Atenção", "Desenvolve seu trabalho de acordo com os requisitos. Entrega trabalhos completos, revisados e corretos. Presta atenção no que faz e toma providências para não haver erros, quando esses ocorrem, atua de modo a evitar sua reincidência."], ["Postura Profissional", "Apresenta um bom marketing pessoal, honestidade, discrição, aparência adequada. Uniforme adequado, asseio."], ["Conhecimento / Desenvolvimento profissional", "Conhece profundamente as atividades inerentes à sua função. Interessa-se em manter-se atualizado sobre os assuntos do seu setor. Participa de cursos, treinamentos e outros eventos de capacitação e atualização necessários à função que exerce."], ["Liderança", "Capacidade de engajar equipe. Consegue persuadir e influenciar equipe na conquista dos objetivos."]];
const ACOES = ['Manter e acompanhar', 'Feedback formal', 'Plano de desenvolvimento (PDI)', 'Treinamento / capacitação', 'Reconhecimento / elogio', 'Reavaliar função', 'Medida disciplinar', 'Encaminhar ao SESMT / saúde'];
const calc = n => { const v = n.filter(x => x !== null && x !== undefined).map(x => x * 2); if (!v.length) return { tot:null, pct:null }; const tot = v.reduce((a, b) => a + b, 0) / v.length; return { tot, pct:tot / 10 }; };
const faixa = p => p == null ? ['', 'Sem nota'] : p >= META ? ['ok', 'Desempenho acima do esperado'] : p >= META - .105 ? ['aten', 'Atenção para o desempenho mostrado'] : ['baixo', 'Desempenho abaixo do esperado'];
const COR = { ok:'#2e7d4f', aten:'#b8860b', baixo:'#c3352f', '':'#8a94a8' };
const pctTxt = p => p == null ? '—' : (Math.round(p * 1000) / 10).toString().replace('.', ',') + '%';
const hoje = () => new Date().toISOString().slice(0, 10);
const anoAtual = new Date().getFullYear();
const CICLOS = [String(anoAtual), String(anoAtual - 1)];

async function regs(){ return (await window.CRV_REGS('desempenho', 'avaliacoes')).filter(x => !x.excluida); }
async function salvar(id, dados){
  const { error } = await sb.from('registros').upsert({ painel:'desempenho', caminho:'avaliacoes/' + id, colecao:'avaliacoes', doc_id:id, dados, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
  if (error) throw error;
}
async function dados(){
  const Q = await window.CRV_QUADRO(); if (!Q || !Q.mapa) return null;
  const P = Object.entries(Q.mapa).filter(([, o]) => o.situacao && o.situacao !== 'Desligado').map(([m, o]) => ({ mat:m, nome:o.nome || '', funcao:o.funcao || '', setor:o.setor || '', area:o.area || '', ger:o.gerencia || '', adm:(o.admissao || '').slice(0, 10), situacao:o.situacao, vinculo:o.vinculo || '' }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return { P, A:await regs(), ref:Q.referencia || Q.ref || '' };
}
const casa = adm => { if (!adm) return ''; const d = Math.floor((Date.now() - new Date(adm + 'T12:00:00')) / 864e5); return d < 365 ? Math.max(0, Math.round(d / 30)) + ' meses' : (Math.floor(d / 365.25)) + (Math.floor(d / 365.25) === 1 ? ' ano' : ' anos'); };

async function tela(p){
  const pode = podeEditar(p);
  const F = { q:'', area:'', ciclo:CICLOS[0], so:'' };
  let D = null;
  moldura(`<div class="trilha"><button data-ir="#/">Visão Geral</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
    <section class="ini-topo capa" style="${(c => c ? '--c1:' + c[0] + ';--c2:' + c[1] : '')((window.CRV_CAPA || {})[p.frente])}"><div><div class="ini-eyebrow">${esc(p.frente)}</div><h1>Avaliação de Desempenho</h1><div class="ini-data">Colaboradores ativos · mesmo formulário da experiência (${FORM}), marcado como Desempenho · meta de 70%</div></div>
      <div class="dk-acoes"><button class="btn borda" id="ad-xls">Excel</button><button class="btn borda" id="ad-pdf">PDF</button><button class="btn borda" id="ad-branco">Formulário em branco</button></div></section>
    <div id="ad-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  const carregar = async () => { try { D = await dados(); } catch(e){ console.warn('desempenho', e); D = null; } desenhar(); };
  const avDe = m => D.A.find(a => a.mat === m && a.ciclo === F.ciclo);
  const lista = () => { const q = normal(F.q); return D.P.filter(x => (!F.area || x.area === F.area) && (!q || normal(x.nome + ' ' + x.mat + ' ' + x.funcao + ' ' + x.setor).includes(q))).map(x => Object.assign({}, x, { av:avDe(x.mat) }))
    .filter(x => !F.so || (F.so === 'pend' ? !x.av : F.so === 'feita' ? !!x.av : x.av && faixa(x.av.pct)[0] === F.so)); };

  function desenhar(){
    const c = $('#ad-corpo'); if (!c) return;
    if (!D) { c.innerHTML = '<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3><p>A lista de ativos vem do Quadro Geral. Carregue o Quadro e volte aqui.</p></div>'; return; }
    const base = D.P.filter(x => !F.area || x.area === F.area), AV = base.map(x => avDe(x.mat)).filter(Boolean);
    const n = k => AV.filter(a => faixa(a.pct)[0] === k).length, med = AV.filter(a => a.pct != null);
    const areas = [...new Set(D.P.map(x => x.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const L = lista();
    c.innerHTML = `<section class="dk-kpis">
        <button class="dk-k ${!F.so ? 'on' : ''}" data-so="" style="--c:#2f6fa8"><span>Ativos${F.area ? ' · ' + esc(F.area) : ''}</span><b>${base.length}</b><small>no Quadro de ${esc(brD(D.ref))}</small></button>
        <button class="dk-k ${F.so === 'feita' ? 'on' : ''}" data-so="feita" style="--c:#5b3f9e"><span>Avaliados em ${esc(F.ciclo)}</span><b>${AV.length}</b><small>${base.length ? (v => v > 0 && v < 1 ? 'menos de 1' : Math.round(v))(100 * AV.length / base.length) : 0}% dos ativos</small></button>
        <button class="dk-k ${F.so === 'pend' ? 'on' : ''}" data-so="pend" style="--c:#8a94a8"><span>Sem avaliação</span><b>${base.length - AV.length}</b><small>no ciclo ${esc(F.ciclo)}</small></button>
        <button class="dk-k ${F.so === 'ok' ? 'on' : ''}" data-so="ok" style="--c:${COR.ok}"><span>Acima do esperado</span><b>${n('ok')}</b><small>70% ou mais</small></button>
        <button class="dk-k ${F.so === 'aten' ? 'on' : ''}" data-so="aten" style="--c:${COR.aten}"><span>Atenção</span><b>${n('aten')}</b><small>de 59,5% a 69,9%</small></button>
        <button class="dk-k ${F.so === 'baixo' ? 'on' : ''}" data-so="baixo" style="--c:${COR.baixo}"><span>Abaixo do esperado</span><b>${n('baixo')}</b><small>média geral ${med.length ? pctTxt(med.reduce((s, a) => s + a.pct, 0) / med.length) : '—'}</small></button></section>
      <section class="dk-filtros cartao"><input id="ad-q" type="search" placeholder="Buscar nome, matrícula, função ou seção" value="${esc(F.q)}">
        <label>Ciclo <select id="ad-ciclo">${CICLOS.map(k => `<option ${k === F.ciclo ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Área <select id="ad-area"><option value="">Todas</option>${areas.map(a => `<option ${a === F.area ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></label>
        <span class="ad-cnt">${L.length} na lista</span></section>
      <section class="dk-lista">${L.slice(0, 300).map(x => { const a = x.av, fx = a ? faixa(a.pct) : null;
        return `<article class="dk-p ad-p">
          <div class="dk-quem"><b><a class="cd-fl" href="#/ficha/${esc(x.mat)}">${esc(x.nome)}</a></b><span>Mat. ${esc(x.mat)} · ${esc(x.funcao)}</span><span>${esc([x.area, x.setor].filter(Boolean).join(' · '))}</span>
            <span class="dk-dt">Admitido em <b>${esc(brD(x.adm))}</b> · ${esc(casa(x.adm))}${x.situacao !== 'Ativo' ? ' · ' + esc(x.situacao) : ''}</span></div>
          <div class="ad-dir">${a ? `<div class="ad-nota" style="--c:${COR[fx[0]]}"><b>${pctTxt(a.pct)}</b><span>${esc(fx[1])}</span><small>${esc(brD(a.data))}${a.aval ? ' · ' + esc(a.aval) : ''}</small></div>` : `<div class="ad-nota pend"><b>—</b><span>Sem avaliação em ${esc(F.ciclo)}</span></div>`}
            <div class="ad-bts">${pode ? `<button class="btn ${a ? 'borda' : 'prim'} peq" data-av="${esc(x.mat)}">${a ? 'Ver / editar' : 'Avaliar'}</button>` : ''}${a ? `<button class="btn borda peq" data-pdf="${esc(x.mat)}">PDF</button>` : ''}</div></div></article>`; }).join('') || '<div class="cartao vazio"><h3>Ninguém com esses filtros</h3></div>'}
        ${L.length > 300 ? `<p class="nr-fonte">Mostrando 300 de ${L.length}. Use a busca ou a área para achar quem você procura.</p>` : ''}</section>
      <p class="nr-fonte">Avaliação feita pelo RH ou pelo gestor (o nome do avaliador fica registrado). Fatores com nota de 0 a 5; cada ponto vale 2. % atingido = média dos pontos ÷ 10; meta de 70%. Uma avaliação por colaborador em cada ciclo.</p>`;
    c.querySelectorAll('[data-so]').forEach(b => b.onclick = () => { F.so = F.so === b.dataset.so && b.dataset.so ? '' : b.dataset.so; desenhar(); });
    const q = $('#ad-q'); q.oninput = () => { F.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { desenhar(); const e = $('#ad-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 250); };
    $('#ad-ciclo').onchange = e => { F.ciclo = e.target.value; desenhar(); };
    $('#ad-area').onchange = e => { F.area = e.target.value; desenhar(); };
    c.querySelectorAll('[data-av]').forEach(b => b.onclick = () => { const x = D.P.find(y => y.mat === b.dataset.av); form(x, avDe(x.mat)); });
    c.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => { const x = D.P.find(y => y.mat === b.dataset.pdf); pdfAval([[x, avDe(x.mat)]]); });
  }

  function form(x, a){
    a = a || {}; const notas = (a.notas || FAT.map(() => undefined)).slice();
    abrirModal({ titulo:`Avaliação de desempenho · ${x.nome}`, largo:true, corpo:`<div class="gs-fid" style="grid-template-columns:repeat(4,minmax(0,1fr))"><div><small>Matrícula</small><b>${esc(x.mat)}</b></div><div><small>Função</small><b>${esc(x.funcao)}</b></div><div><small>Seção</small><b>${esc(x.setor)}</b></div><div><small>Admissão</small><b>${esc(brD(x.adm))} · ${esc(casa(x.adm))}</b></div></div>
      <div class="ad-cab"><label>Ciclo<select id="af-ciclo">${CICLOS.map(k => `<option ${k === (a.ciclo || F.ciclo) ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Data da avaliação<input type="date" id="af-data" value="${esc(a.data || hoje())}"></label>
        <label>Avaliador (gestor)<input id="af-aval" value="${esc(a.aval || '')}" placeholder="Nome de quem avaliou"></label>
        <label>Cargo do avaliador<input id="af-cargo" value="${esc(a.cargo || '')}"></label></div>
      <h4 class="gs-h4">Fatores avaliados <small>(formulário ${FORM}: nota de 0 a 5)</small></h4>
      <div class="gs-fat">${FAT.map(([t, d], i) => `<div class="gs-fr"><div><b>${i + 1}. ${esc(t)}</b><small>${esc(d)}</small></div><div class="gs-nt">${[0, 1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="dn${i}" value="${n}" ${notas[i] === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}${i === FAT.length - 1 ? `<label class="na"><input type="radio" name="dn${i}" value="na" ${a.notas && notas[i] === null ? 'checked' : ''}><span>não se aplica</span></label>` : ''}</div><em id="dp${i}"></em></div>`).join('')}</div>
      <div class="gs-sc"><div><small>Meta</small><b>70%</b></div><div><small>% atingido</small><b id="ad-pct">—</b></div><div><small>Total de pontos</small><b id="ad-tot">—</b></div><span id="ad-fx"></span></div>
      <label class="gs-obs">Comentários do avaliador<textarea id="af-com" rows="3" maxlength="1500">${esc(a.coment || '')}</textarea></label>
      <h4 class="gs-h4">Encaminhamento <small>(pode marcar mais de um)</small></h4>
      <div class="ad-ac">${ACOES.map(t => `<label><input type="checkbox" value="${esc(t)}" ${(a.acoes || []).includes(t) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>
      <label class="gs-obs">Plano de ação, prazos e responsáveis (opcional)<textarea id="af-plano" rows="2" maxlength="1500">${esc(a.plano || '')}</textarea></label>
      <p class="nr-msg" id="af-msg"></p>`,
      pe:`${a.mat ? '<button class="btn borda" id="af-del" style="color:var(--coral)">Excluir</button>' : ''}<span style="flex:1"></span><button class="btn borda" id="af-c">Cancelar</button><button class="btn prim" id="af-ok">Salvar avaliação</button>`,
      aoAbrir: m => {
        const lerN = () => FAT.map((_, i) => { const v = (m.querySelector(`input[name=dn${i}]:checked`) || {}).value; return v === undefined ? undefined : v === 'na' ? null : +v; });
        const atual = () => { const n = lerN(), k = calc(n.map(x => x === undefined ? null : x)); n.forEach((x, i) => { m.querySelector('#dp' + i).textContent = x == null ? '' : (x * 2) + ' pts'; });
          m.querySelector('#ad-pct').textContent = pctTxt(k.pct); m.querySelector('#ad-tot').textContent = k.tot == null ? '—' : k.tot.toFixed(1).replace('.', ','); const f = faixa(k.pct), fx = m.querySelector('#ad-fx'); fx.className = 'gs-fx ' + f[0]; fx.textContent = k.pct == null ? '' : f[1]; };
        m.querySelectorAll('.gs-fat input').forEach(i => i.onchange = atual); atual();
        m.querySelector('#af-c').onclick = fecharModal;
        const del = m.querySelector('#af-del'); if (del) del.onclick = async () => { if (!del.dataset.c) { del.dataset.c = 1; del.textContent = 'Confirmar exclusão'; return; }
          try { await salvar(a._id || (x.mat + '-' + a.ciclo), Object.assign({}, a, { excluida:true, excluidaEm:new Date().toISOString(), excluidaPor:E.perfil.nome, _id:undefined })); fecharModal(); toast('Avaliação excluída.'); carregar(); } catch(e){ toast(traduzErro(e), true); } };
        m.querySelector('#af-ok').onclick = async () => { const msg = t => m.querySelector('#af-msg').textContent = t;
          const n = lerN(); if (n.some(v => v === undefined)) return msg('Dê uma nota de 0 a 5 em todos os fatores (Liderança aceita "não se aplica").');
          const aval = m.querySelector('#af-aval').value.trim(); if (aval.length < 3) return msg('Informe o nome de quem avaliou.');
          const ciclo = m.querySelector('#af-ciclo').value, { tot, pct } = calc(n), id = x.mat + '-' + ciclo;
          if (!a.mat && D.A.some(z => z.mat === x.mat && z.ciclo === ciclo)) return msg('Já existe avaliação deste colaborador no ciclo ' + ciclo + '. Abra a existente para editar.');
          const v = { mat:x.mat, nome:x.nome, funcao:x.funcao, setor:x.setor, area:x.area, adm:x.adm, ciclo, data:m.querySelector('#af-data').value || hoje(), aval, cargo:m.querySelector('#af-cargo').value.trim(),
            notas:n, tot, pct, faixa:faixa(pct)[1], coment:m.querySelector('#af-com').value.trim(), acoes:[...m.querySelectorAll('.ad-ac input:checked')].map(i => i.value), plano:m.querySelector('#af-plano').value.trim(),
            form:FORM, tipo:'desempenho', lancPor:a.lancPor || E.perfil.nome, lancEm:a.lancEm || new Date().toISOString(), editPor:a.mat ? E.perfil.nome : undefined };
          const b = m.querySelector('#af-ok'); b.disabled = true;
          try { if (a.mat && a.ciclo && a.ciclo !== ciclo) await salvar(x.mat + '-' + a.ciclo, Object.assign({}, a, { excluida:true, _id:undefined }));
            await salvar(id, v); fecharModal(); toast('Avaliação salva.'); F.ciclo = ciclo; carregar(); } catch(e){ msg(traduzErro(e)); b.disabled = false; } };
      } });
  }

  // PDF no modelo RE.0150.07 (Desempenho): uma folha por colaborador, assinaturas na mesma folha
  function pdfAval(itens, nomeArq){
    const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' }); let first = true;
    itens.forEach(([x, a]) => { if (!first) doc.addPage(); first = false; a = a || {};
      cabecalhoPDF(doc, 'Avaliação de Desempenho', `${x.nome} · matrícula ${x.mat}`);
      doc.autoTable({ startY:100, theme:'grid', body:[['Colaborador', x.nome, 'Matrícula', x.mat], ['Função', x.funcao, 'Admissão', brD(x.adm)], ['Seção', x.setor, 'Área', x.area], ['Avaliador', (a.aval || '') + (a.cargo ? ' · ' + a.cargo : ''), 'Data / ciclo', a.data ? brD(a.data) + ' · ' + a.ciclo : '']],
        styles:{ fontSize:8.5, cellPadding:3 }, columnStyles:{ 0:{ fontStyle:'bold', cellWidth:72 }, 2:{ fontStyle:'bold', cellWidth:72 } } });
      doc.setFontSize(8); doc.setTextColor(93, 106, 133); doc.text('Formulário ' + FORM + ' · Avaliação de período de experiência e desempenho · [ ] Experiência  [X] Desempenho', 40, doc.lastAutoTable.finalY + 12);
      const N = a.notas || FAT.map(() => undefined);
      doc.autoTable({ startY:doc.lastAutoTable.finalY + 18, head:[['Nº', 'Fator', '0', '1', '2', '3', '4', '5', 'Pontos']],
        body:FAT.map(([t], i) => [i + 1, t].concat([0, 1, 2, 3, 4, 5].map(k => N[i] === k ? 'X' : '')).concat([N[i] == null ? (N[i] === null ? 'n/a' : '') : N[i] * 2])),
        styles:{ fontSize:8.2, cellPadding:2.6, halign:'center' }, columnStyles:{ 1:{ halign:'left', cellWidth:200 } }, headStyles:{ fillColor:[36, 66, 124] } });
      const fx = faixa(a.pct);
      doc.autoTable({ startY:doc.lastAutoTable.finalY + 8, body:[['Meta', '70%', '% atingido', pctTxt(a.pct), 'Total de pontos', a.tot == null ? '' : a.tot.toFixed(1).replace('.', ',')], ['Resultado', { content:a.pct == null ? '' : fx[1], colSpan:5 }]],
        styles:{ fontSize:8.6, cellPadding:3 }, columnStyles:{ 0:{ fontStyle:'bold' }, 2:{ fontStyle:'bold' }, 4:{ fontStyle:'bold' } } });
      doc.autoTable({ startY:doc.lastAutoTable.finalY + 8, head:[['Comentários do avaliador']], body:[[a.coment || ' \n \n ']], styles:{ fontSize:8.6, cellPadding:4, minCellHeight:a.coment ? 0 : 40 }, headStyles:{ fillColor:[46, 138, 87] } });
      doc.autoTable({ startY:doc.lastAutoTable.finalY + 6, head:[['Encaminhamento', 'Plano de ação / prazos']], body:[[(a.acoes || []).join('; ') || ' ', a.plano || ' ']], styles:{ fontSize:8.4, cellPadding:4 }, headStyles:{ fillColor:[233, 162, 59] } });
      let y = Math.max(doc.lastAutoTable.finalY + 46, 720); const H = doc.internal.pageSize.getHeight(); if (y > H - 60) { doc.addPage(); y = 140; }
      doc.setDrawColor(40); doc.setLineWidth(.6); doc.setFontSize(8.5); doc.setTextColor(20, 33, 61);
      [[40, 'Colaborador'], [222, 'Avaliador'], [404, 'Gestão de Pessoas']].forEach(([xx, t]) => { doc.line(xx, y, xx + 160, y); doc.text(t, xx + 80, y + 12, { align:'center' }); });
    });
    rodapePDF(doc); baixar(doc.output('blob'), (nomeArq || ('Avaliacao desempenho ' + (itens[0] && itens[0][0].nome.split(' ')[0]) + ' ' + (itens[0] && itens[0][0].mat))) + '.pdf');
  }
  $('#ad-branco').onclick = () => { if (!D) return; const x = { nome:'', mat:'', funcao:'', setor:'', area:'', adm:'' }; pdfAval([[x, { ciclo:F.ciclo }]], 'Avaliacao de desempenho em branco'); };
  $('#ad-pdf').onclick = () => { if (!D) return; const L = lista(); const C = L.filter(x => x.av);
    abrirModal({ titulo:'PDF da avaliação de desempenho', corpo:`<p style="margin-top:0">${L.length} na lista atual (${C.length} com avaliação em ${esc(F.ciclo)}).</p>`,
      pe:`<button class="btn borda" id="pp-l">Lista resumida</button><button class="btn prim" id="pp-f" ${C.length ? '' : 'disabled'}>Formulários avaliados (${C.length})</button>`,
      aoAbrir: m => { m.querySelector('#pp-f').onclick = () => { fecharModal(); pdfAval(C.map(x => [x, x.av]), 'Avaliacoes de desempenho ' + F.ciclo); };
        m.querySelector('#pp-l').onclick = () => { fecharModal(); const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
          cabecalhoPDF(doc, 'Avaliação de Desempenho · ' + F.ciclo, (F.area || 'Todas as áreas') + ' · ' + L.length + ' colaboradores');
          doc.autoTable({ startY:100, head:[['Matrícula', 'Nome', 'Função', 'Seção', 'Admissão', '% atingido', 'Resultado', 'Data', 'Avaliador', 'Encaminhamento']],
            body:L.map(x => [x.mat, x.nome, x.funcao, x.setor, brD(x.adm), x.av ? pctTxt(x.av.pct) : '', x.av ? faixa(x.av.pct)[1] : 'Sem avaliação', x.av ? brD(x.av.data) : '', x.av ? x.av.aval : '', x.av ? (x.av.acoes || []).join('; ') : '']),
            styles:{ fontSize:7.2, cellPadding:2.4, overflow:'linebreak' }, headStyles:{ fillColor:[36, 66, 124] } });
          rodapePDF(doc); baixar(doc.output('blob'), 'Avaliacao de desempenho ' + F.ciclo + '.pdf'); }; } }); };
  $('#ad-xls').onclick = () => { if (!D || !window.XLSX) return; const L = lista();
    const rows = [['Matrícula', 'Nome', 'Função', 'Seção', 'Área', 'Admissão', 'Ciclo', 'Data', 'Avaliador', 'Cargo do avaliador'].concat(FAT.map(f => f[0])).concat(['Total de pontos', '% atingido', 'Resultado', 'Comentários', 'Encaminhamento', 'Plano de ação'])]
      .concat(L.map(x => { const a = x.av || {}; return [+x.mat || x.mat, x.nome, x.funcao, x.setor, x.area, brD(x.adm), F.ciclo, a.data ? brD(a.data) : '', a.aval || '', a.cargo || ''].concat(FAT.map((_, i) => a.notas ? (a.notas[i] === null ? 'n/a' : a.notas[i]) : ''))
        .concat([a.tot == null ? '' : Math.round(a.tot * 10) / 10, a.pct == null ? '' : Math.round(a.pct * 1000) / 10, x.av ? faixa(a.pct)[1] : 'Sem avaliação', a.coment || '', (a.acoes || []).join('; '), a.plano || '']); }));
    const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = rows[0].map((h, i) => ({ wch:i === 1 ? 34 : i < 10 ? 16 : 12 })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Desempenho ' + F.ciclo);
    baixar(new Blob([XLSX.write(wb, { type:'array', bookType:'xlsx' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Avaliacao de desempenho ' + F.ciclo + '.xlsx'); };
  carregar();
}
// para a ficha do colaborador: avaliações desta matrícula
async function daPessoa(mat){ const L = (await regs()).filter(a => String(a.mat) === String(mat)).sort((a, b) => String(b.data).localeCompare(String(a.data))); return L.map(a => ({ ciclo:a.ciclo, data:a.data, pct:a.pct, faixa:faixa(a.pct)[1], aval:a.aval, acoes:a.acoes || [] })); }
return { tela, daPessoa, pctTxt };
};
