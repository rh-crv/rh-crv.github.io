/* =====================================================================
   ONBOARDING: INTEGRAÇÃO DE NOVOS COLABORADORES
   Quem entrou nos últimos meses (Quadro), checklist de admissão marcado pelo RH, conversas do RH
   aos 30, 60 e 90 dias e retenção aos 90 dias por mês de admissão.
   As conversas do RH não substituem a avaliação de experiência feita pela área.
   Registros: painel 'onboarding', coleções 'check', 'conversas' e 'config'.
   ===================================================================== */
window.CRV_ONB_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, fMat, fDias, podeVer, podeEditar, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF, centralChave, RISCO } = X;

// lista inicial: o RH ajusta em "Itens do checklist"
const ITENS_PADRAO = [
  { id:'doc', nome:'Documentos e registro conferidos' }, { id:'aso', nome:'ASO admissional' }, { id:'integ', nome:'Integração de segurança' },
  { id:'epi', nome:'EPI entregue' }, { id:'cracha', nome:'Crachá' }, { id:'va', nome:'Cartão Alimentação' },
  { id:'transp', nome:'Transporte definido' }, { id:'lider', nome:'Apresentado ao líder e à equipe' } ];
const MARCOS = [30, 60, 90];
const COMO = { bem:'Adaptando bem', aten:'Precisa de atenção', dif:'Dificuldade séria' };
const TEMAS = ['Função e treinamento', 'Líder', 'Equipe', 'Transporte', 'Alojamento', 'Salário e benefícios', 'Jornada e escala', 'Segurança e EPI', 'Assuntos pessoais'];
const hoje = () => new Date().toISOString().slice(0, 10);
const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function regs(col){ return (await window.CRV_REGS('onboarding', col)).filter(x => !x.excluida); }
async function salvar(col, id, dados){
  const { error } = await sb.from('registros').upsert({ painel:'onboarding', caminho:col + '/' + id, colecao:col, doc_id:id, dados, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
  if (error) throw error; try { localStorage.removeItem(centralChave()); } catch(_){}
}
async function cfg(){ const L = await regs('config'); const c = L.find(x => x._id === 'itens'), i = L.find(x => x._id === 'inicio'); return { itens: c && Array.isArray(c.itens) && c.itens.length ? c.itens : ITENS_PADRAO, inicio: (i && i.data) || '', lote2410: L.some(x => x._id === 'lote-20261024') }; }
/* marca itens em lote para quem foi admitido entre duas datas (e ainda está na empresa); mantém o que já estava marcado */
async function marcarLote(M, CK, de, ate, ids, nota){
  const ck = {}; CK.forEach(x => ck[fMat(x.mat || x._id)] = x);
  const em = new Date().toISOString(), rows = [];
  Object.entries(M).forEach(([m, c]) => { if (c.situacao === 'Desligado' || !c.admissao || c.admissao < de || c.admissao > ate) return;
    const ok = Object.assign({}, (ck[m] && ck[m].ok) || {}); let mud = false; ids.forEach(id => { if (!ok[id]) { ok[id] = { em, por:E.perfil.nome, lote:nota }; mud = true; } });
    if (mud) rows.push({ painel:'onboarding', caminho:'check/' + m, colecao:'check', doc_id:m, dados:{ mat:m, nome:c.nome, adm:c.admissao, ok }, atualizado_por:E.perfil.nome }); });
  for (let i = 0; i < rows.length; i += 200) { const { error } = await sb.from('registros').upsert(rows.slice(i, i + 200), { onConflict:'painel,caminho' }); if (error) throw error; }
  try { localStorage.removeItem(centralChave()); } catch(_){}
  return rows.length;
}

// situação de cada marco: ok (feita), pend (já chegou a hora), atr (15 dias depois e sem conversa), fut (ainda não chegou)
// na = o prazo já tinha passado quando o acompanhamento começou (não é cobrado)
const marco = (adm, casa, conv, k, ini) => conv.find(c => +c.marco === k) ? 'ok' : ini && addD(adm, k + 15) <= ini ? 'na' : casa >= k + 15 ? 'atr' : casa >= k ? 'pend' : 'fut';

/* dicas das bases de outros painéis (o RH confere e marca) */
async function dicas(mats){
  const H = {}; const put = (m, k, t) => { (H[m] = H[m] || {})[k] = t; };
  const S = new Set(mats);
  try { const d = await window.CRV_DADOS('cartao-alimentacao'); const C = d && d.dados.CARTAO; if (C) (C.rows || []).forEach(r => { const m = fMat(r.mat); if (S.has(m)) put(m, 'va', r.card ? 'Na base da Sysprocard de ' + brD(C.refPlanilha) + ': com cartão' : 'Na base da Sysprocard: sem cartão'); }); } catch(_){}
  try { const L = await window.CRV_REGS('crachas', 'treinamentos'); L.filter(x => !x.excluido).forEach(x => { const m = fMat(x.mat); if (S.has(m)) put(m, 'cracha', 'Crachá de treinamento até ' + brD(x.fim)); }); } catch(_){}
  try { const d = await window.CRV_DADOS('alojamentos'); const A = d && d.dados.DATA; if (A) (A.people || []).forEach(y => { const m = fMat(y.m); if (y.t === 'c' && S.has(m)) put(m, 'aloj', 'Alojado: ' + (((A.houses || [])[y.h] || {}).n || '')); }); } catch(_){}
  return H;
}

async function dados(dias){
  const Q = await window.CRV_QUADRO(); if (!Q) return null;
  const M = Q.mapa, h = hoje(), desde = addD(h, -dias);
  let [C, CK, CV] = await Promise.all([cfg(), regs('check'), regs('conversas')]); const itens = C.itens; let ini = C.inicio;
  // 24/10/2026: o RH informou que todos os admitidos estão com o checklist completo, menos o Cartão Alimentação de quem entrou em outubro
  { const pp = E.paineis.find(x => x.id === 'onboarding');
    if (!C.lote2410 && pp && E.perfil.papel === 'admin') { try { const nota = 'Informado pelo RH em 24/10/2026';
      await marcarLote(M, CK, '2000-01-01', '2026-09-30', itens.map(i => i.id), nota);
      await marcarLote(M, CK, '2026-10-01', '2026-10-24', itens.filter(i => i.id !== 'va').map(i => i.id), nota);
      await salvar('config', 'lote-20261024', { em:new Date().toISOString(), por:E.perfil.nome }); CK = await regs('check'); } catch(e){ console.warn('lote onboarding', e); } } }
  // a primeira vez que alguém com permissão abre, o acompanhamento começa hoje
  if (!ini) { ini = h; if (E.perfil.papel === 'admin') salvar('config', 'inicio', { data:h }).catch(() => {}); }
  const ck = {}; CK.forEach(x => ck[fMat(x.mat || x._id)] = x);
  const cv = {}; CV.forEach(x => (cv[fMat(x.mat)] = cv[fMat(x.mat)] || []).push(x));
  const L = Object.entries(M).filter(([, c]) => c.situacao !== 'Desligado' && c.admissao && c.admissao >= desde && c.admissao <= h).map(([m, c]) => {
    const casa = fDias(c.admissao, h), conv = (cv[m] || []).sort((a, b) => a.marco - b.marco), ok = (ck[m] && ck[m].ok) || {};
    return { mat:m, nome:c.nome, funcao:c.funcao, setor:c.setor, area:c.area, vinculo:c.vinculo, situacao:c.situacao, adm:c.admissao, casa, conv, ok,
      falta: itens.filter(i => !ok[i.id]).map(i => i.id), cobra: c.admissao >= addD(ini, -15), mk: MARCOS.map(k => marco(c.admissao, casa, conv, k, ini)) }; }).sort((a, b) => b.adm.localeCompare(a.adm) || a.nome.localeCompare(b.nome, 'pt-BR'));
  let H = {}; try { H = await dicas(L.map(x => x.mat)); } catch(_){}
  let RS = {}; try { const pr = E.paineis.find(x => x.id === 'risco'); if (pr && podeVer(pr)) RS = await RISCO().niveis(); } catch(_){}
  // retenção aos 90 dias por mês de admissão (todas as admissões da CRV no Quadro)
  const R = {}; Object.entries(M).forEach(([m, c]) => { if (!c.admissao || c.admissao.slice(0, 7) < addD(h, -365).slice(0, 7) || c.admissao > h) return; const k = c.admissao.slice(0, 7);
    const o = R[k] || (R[k] = { mes:k, adm:[], sai:[] }); o.adm.push(m); if (c.situacao === 'Desligado' && c.deslig && fDias(c.admissao, c.deslig) <= 90) o.sai.push(m); });
  const RET = Object.values(R).sort((a, b) => a.mes.localeCompare(b.mes)).map(o => Object.assign(o, { fechado: addD(o.mes + '-28', 90) <= h }));
  return { L, itens, H, RS, RET, M, refQ:Q.referencia, dias, ini };
}

/* Central do dia */
async function pendencias(){
  const p = E.paineis.find(x => x.id === 'onboarding'); if (!p || !podeVer(p)) return [];
  const D = await dados(100); if (!D) return [];
  const out = [];
  const atr = D.L.filter(x => x.mk.includes('atr'));
  if (atr.length) out.push({ id:'onb-conv', sev:'warn', t:'Conversas de acompanhamento atrasadas (30, 60 ou 90 dias)', painel:'onboarding', pnome:'Onboarding', d:'Conversa do RH com quem acabou de entrar; não substitui a avaliação de experiência da área.',
    itens: atr.map(x => ({ nome:x.nome, mat:x.mat, det:`${x.casa} dias de casa · falta a conversa de ${MARCOS.filter((k, i) => x.mk[i] === 'atr').join(', ')} dias` })) });
  const ck = D.L.filter(x => x.cobra && x.casa > 15 && x.falta.length);
  if (ck.length) out.push({ id:'onb-check', sev:'info', t:'Checklist de admissão incompleto há mais de 15 dias', painel:'onboarding', pnome:'Onboarding', d:'',
    itens: ck.map(x => ({ nome:x.nome, mat:x.mat, det:`admitido em ${brD(x.adm)} · falta: ${x.falta.map(id => (D.itens.find(i => i.id === id) || {}).nome).filter(Boolean).join(', ')}` })) });
  return out;
}

async function tela(p){
  const pode = podeEditar(p);
  let aba = 'lista', D = null;
  const F = { q:'', area:'', dias:120, so:'' };
  moldura(`<div class="trilha"><button data-ir="#/">Início</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
    <section class="ini-topo capa" style="${(c => c ? '--c1:' + c[0] + ';--c2:' + c[1] : '')((window.CRV_CAPA || {})[p.frente])}"><div><div class="ini-eyebrow">${esc(p.frente)}</div><h1>Onboarding</h1><div class="ini-data">Quem acabou de entrar: checklist de admissão, conversas do RH aos 30, 60 e 90 dias e retenção</div></div>
      <div class="dk-acoes"><button class="btn borda" id="ob-xls">Excel</button><button class="btn borda" id="ob-pdf">PDF</button></div></section>
    <nav class="vista-seg" id="ob-abas"><button data-a="lista" class="on">Acompanhamento</button><button data-a="ret">Retenção aos 90 dias</button>${E.perfil.papel === 'admin' ? '<button data-a="itens">Itens do checklist</button>' : ''}</nav>
    <div id="ob-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  const carregar = async () => { try { D = await dados(F.dias); } catch(e){ console.warn('onboarding', e); D = null; } desenhar(); };
  $('#ob-abas').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { aba = b.dataset.a; $('#ob-abas').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); desenhar(); });
  const nomeItem = id => (D.itens.find(i => i.id === id) || {}).nome || id;

  function filtrar(){ const q = normal(F.q); return D.L.filter(x => (!F.area || x.area === F.area) && (!q || normal(x.nome + ' ' + x.mat + ' ' + x.funcao + ' ' + x.setor).includes(q))
    && (F.so === 'check' ? x.falta.length : F.so === 'conv' ? x.mk.some(s => s === 'pend' || s === 'atr') : F.so === 'atr' ? x.mk.includes('atr') : F.so === 'risco' ? D.RS[x.mat] : true)); }
  function desenhar(){
    const c = $('#ob-corpo'); if (!c) return;
    if (!D) { c.innerHTML = '<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3><p>O onboarding usa as admissões do Quadro Geral.</p></div>'; return; }
    if (aba === 'ret') return vRet(c);
    if (aba === 'itens') return vItens(c);
    const L = filtrar(), T = D.L;
    const ult = D.RET.filter(o => o.fechado).slice(-3), rA = ult.reduce((a, o) => a + o.adm.length, 0), rS = ult.reduce((a, o) => a + o.sai.length, 0);
    const areas = [...new Set(T.map(x => x.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    c.innerHTML = `<section class="dk-kpis">
        <button class="dk-k ${!F.so ? 'on' : ''}" data-so="" style="--c:#2f6fa8"><span>Admitidos no período</span><b>${T.length}</b><small>últimos ${F.dias} dias, ainda na empresa</small></button>
        <button class="dk-k ${F.so === 'check' ? 'on' : ''}" data-so="check" style="--c:var(--amber)"><span>Checklist incompleto</span><b>${T.filter(x => x.falta.length).length}</b><small>${T.filter(x => !x.falta.length).length} completos · ${T.filter(x => x.cobra && x.falta.length).length} cobrados</small></button>
        <button class="dk-k ${F.so === 'atr' ? 'on' : ''}" data-so="atr" style="--c:var(--coral)"><span>Conversas atrasadas</span><b>${T.filter(x => x.mk.includes('atr')).length}</b><small>${T.filter(x => x.mk.includes('pend') && !x.mk.includes('atr')).length} no prazo para fazer</small></button>
        <button class="dk-k" data-ab="ret" style="--c:var(--cane)"><span>Retenção aos 90 dias</span><b>${rA ? 100 - pct(rS, rA) + '%' : '—'}</b><small>${ult.length ? 'admitidos de ' + mesNome(ult[0].mes) + ' a ' + mesNome(ult[ult.length - 1].mes) : ''}</small></button></section>
      <section class="dk-filtros cartao"><input id="ob-q" type="search" placeholder="Buscar nome, matrícula, função ou seção" value="${esc(F.q)}">
        <label>Admitidos nos últimos <select id="ob-dias">${[30, 60, 90, 120, 180].map(d => `<option value="${d}" ${d === F.dias ? 'selected' : ''}>${d} dias</option>`).join('')}</select></label>
        <label>Área <select id="ob-area"><option value="">Todas</option>${areas.map(a => `<option ${a === F.area ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></label>
        ${Object.keys(D.RS).length ? `<label class="dk-chk"><input type="checkbox" id="ob-risco" ${F.so === 'risco' ? 'checked' : ''}> Só com risco de saída</label>` : ''}</section>
      <section class="dk-lista">${L.length ? L.map(x => { const rs = D.RS[x.mat];
        return `<article class="dk-p ob-p ${x.mk.includes('atr') ? 'atr' : !x.falta.length && !x.mk.includes('pend') ? 'feito' : ''}">
          <div class="dk-quem"><b><a class="cd-fl" href="#/ficha/${esc(x.mat)}">${esc(x.nome)}</a></b><span>${esc(x.mat)} · ${esc(x.funcao)}</span><span>${esc([x.area, x.setor].filter(Boolean).join(' · '))}</span>
            <span class="dk-dt">Admitido em <b>${esc(brD(x.adm))}</b> · ${x.casa} dias · ${esc(x.vinculo || '')}${x.situacao !== 'Ativo' ? ' · ' + esc(x.situacao) : ''}</span>
            ${rs ? `<span class="rs-niv ${rs.niv}" title="${esc(rs.S.join(', '))}" style="align-self:flex-start;margin-top:4px">Risco de saída: ${rs.niv === 'a' ? 'alto' : 'atenção'}</span>` : ''}</div>
          <div class="ob-dir">
            <div class="ob-ck">${D.itens.map(i => { const ok = x.ok[i.id], dica = (D.H[x.mat] || {})[i.id];
              return `<button class="ob-i ${ok ? 'ok' : ''}" ${pode ? '' : 'disabled'} data-ck="${esc(x.mat)}|${esc(i.id)}" title="${esc(ok ? 'Feito em ' + brD(ok.em) + (ok.por ? ' por ' + ok.por : '') : dica || 'Marcar como feito')}"><i>${ok ? '✓' : ''}</i>${esc(i.nome)}${dica && !ok ? '<em>•</em>' : ''}</button>`; }).join('')}</div>
            <div class="ob-mk">${MARCOS.map((k, j) => { const s = x.mk[j], cv = x.conv.find(v => +v.marco === k);
              return `<button class="ob-m ${s}" data-mk="${esc(x.mat)}|${k}" ${s === 'fut' && !cv ? 'disabled' : ''} title="${s === 'ok' ? esc(COMO[cv.como] || '') + ' · ' + esc(brD(cv.data)) : s === 'fut' ? 'Ainda não chegou' : s === 'na' ? 'O prazo passou antes de o acompanhamento começar; dá para registrar mesmo assim' : s === 'atr' ? 'Atrasada' : 'Fazer a conversa'}"><b>${k} dias</b><small>${s === 'ok' ? esc(COMO[cv.como] || 'feita') : s === 'atr' ? 'atrasada' : s === 'pend' ? 'fazer agora' : s === 'na' ? 'antes do início' : 'a partir de ' + esc(brD(addD(x.adm, k)))}</small></button>`; }).join('')}</div>
          </div></article>`; }).join('') : '<div class="cartao vazio"><h3>Ninguém com esses filtros</h3></div>'}</section>
      <p class="nr-fonte">Admissões do Quadro de ${esc(brD(D.refQ))}. Acompanhamento iniciado em ${esc(brD(D.ini))}: prazos que já tinham passado antes dessa data aparecem como "antes do início" e não são cobrados na Central do dia; o checklist é cobrado para quem entrou a partir de 15 dias antes do início. O ponto (•) num item indica que há informação em outra base para conferir (passe o mouse). As conversas do RH não substituem a avaliação de experiência feita pela área.</p>`;
    c.querySelectorAll('[data-so]').forEach(b => b.onclick = () => { F.so = F.so === b.dataset.so && b.dataset.so ? '' : b.dataset.so; desenhar(); });
    c.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => $('#ob-abas [data-a="' + b.dataset.ab + '"]').click());
    const q = $('#ob-q'); q.oninput = () => { F.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { desenhar(); const e = $('#ob-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 250); };
    $('#ob-dias').onchange = e => { F.dias = +e.target.value; c.innerHTML = '<div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div>'; carregar(); };
    $('#ob-area').onchange = e => { F.area = e.target.value; desenhar(); };
    const rk = $('#ob-risco'); if (rk) rk.onchange = () => { F.so = rk.checked ? 'risco' : ''; desenhar(); };
    c.querySelectorAll('[data-ck]').forEach(b => b.onclick = async () => { const [m, id] = b.dataset.ck.split('|'); const x = D.L.find(y => y.mat === m); const ok = Object.assign({}, x.ok);
      if (ok[id]) delete ok[id]; else ok[id] = { em:new Date().toISOString(), por:E.perfil.nome };
      b.disabled = true;
      try { await salvar('check', m, { mat:m, nome:x.nome, adm:x.adm, ok }); x.ok = ok; x.falta = D.itens.filter(i => !ok[i.id]).map(i => i.id); desenhar(); } catch(e){ toast(traduzErro(e), true); b.disabled = false; } });
    c.querySelectorAll('[data-mk]').forEach(b => b.onclick = () => { const [m, k] = b.dataset.mk.split('|'); const x = D.L.find(y => y.mat === m); formConversa(x, +k, x.conv.find(v => +v.marco === +k)); });
  }
  function mesNome(k){ const [a, m] = k.split('-'); return ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+m - 1] + '/' + a.slice(2); }
  function vRet(c){
    const R = D.RET, maxA = Math.max(1, ...R.map(o => o.adm.length));
    c.innerHTML = `<section class="cartao nr-leg">De cada mês de admissão, quantos continuavam na empresa depois de 90 dias. É o indicador que mostra se a integração está funcionando. Clique nos números para ver as pessoas. Meses com menos de 90 dias ainda estão em andamento.</section>
      <section class="fc-sec cartao"><div class="fc-tw"><table class="fc-t ob-rt"><thead><tr><th>Mês de admissão</th><th>Admitidos</th><th>Saíram com até 90 dias</th><th>Retenção aos 90 dias</th><th></th></tr></thead>
        <tbody>${R.map((o, i) => { const r = 100 - pct(o.sai.length, o.adm.length); return `<tr class="${o.fechado ? '' : 'ob-and'}"><td>${esc(mesNome(o.mes))}${o.fechado ? '' : ' <small>em andamento</small>'}</td>
          <td><button class="nr-n" data-rl="${i}|adm">${o.adm.length}</button></td><td>${o.sai.length ? `<button class="nr-n" data-rl="${i}|sai">${o.sai.length}</button>` : '<span class="nr-z">0</span>'}</td>
          <td><b class="${!o.fechado ? '' : r < 70 ? 'nr-atr' : r >= 80 ? 'ob-bom' : ''}">${r}%</b></td><td style="width:40%"><div class="ob-bar"><i style="width:${pct(o.adm.length, maxA)}%"><s style="width:${pct(o.sai.length, o.adm.length)}%"></s></i></div></td></tr>`; }).join('')}</tbody></table></div></section>
      <p class="nr-fonte">Admissões e desligamentos da CRV no Quadro de ${esc(brD(D.refQ))}. Barra: admitidos no mês; parte vermelha: saíram com até 90 dias. Quem foi readmitido conta pela admissão mais recente.</p>`;
    c.querySelectorAll('[data-rl]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.rl.split('|'); const o = D.RET[+i];
      const L = o[k].map(m => { const p = D.M[m] || {}; return [p.nome || m, m, p.funcao || '', p.area || '', brD(p.admissao), p.situacao === 'Desligado' ? brD(p.deslig) + ' (' + fDias(p.admissao, p.deslig) + ' dias)' : p.situacao || '']; }).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
      abrirModal({ titulo:`${k === 'adm' ? 'Admitidos' : 'Saíram com até 90 dias'}: ${mesNome(o.mes)}`, largo:true, corpo:`<div class="fc-tw"><table class="fc-t"><thead><tr><th>Colaborador</th><th>Matrícula</th><th>Função</th><th>Área</th><th>Admissão</th><th>Situação / saída</th></tr></thead><tbody>${L.map(l => `<tr><td><a class="cd-fl" href="#/ficha/${esc(l[1])}">${esc(l[0])}</a></td>${l.slice(1).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
        aoAbrir: m => m.querySelectorAll('a.cd-fl').forEach(a => a.onclick = () => fecharModal()) }); });
  }
  function vItens(c){
    let it = D.itens.map(i => Object.assign({}, i));
    let pintar = () => { c.innerHTML = `<section class="cartao nr-leg">Itens que o RH confere para cada pessoa admitida. Comecei com uma lista inicial: ajuste para a rotina da CRV. Remover um item não apaga o que já foi marcado.</section>
      <section class="fc-sec cartao" style="padding:14px"><div class="ob-it">${it.map((i, k) => `<div class="ob-ir"><input value="${esc(i.nome)}" data-in="${k}" maxlength="80"><button class="btn borda" data-up="${k}" ${k ? '' : 'disabled'} aria-label="Subir">↑</button><button class="btn borda" data-rm="${k}" aria-label="Remover">Remover</button></div>`).join('')}</div>
        <div class="ob-ini"><label>Acompanhamento iniciado em <input type="date" id="ob-ini" value="${esc(D.ini)}"></label><small>Prazos de conversa anteriores a esta data não são cobrados.</small></div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn borda" id="ob-add">+ Item</button><span style="flex:1"></span><button class="btn borda" id="ob-pad">Voltar à lista inicial</button><button class="btn prim" id="ob-sv">Salvar itens</button></div></section>`;
      c.querySelectorAll('[data-in]').forEach(e => e.oninput = () => it[+e.dataset.in].nome = e.value);
      c.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { it.splice(+b.dataset.rm, 1); pintar(); });
      c.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const k = +b.dataset.up; [it[k - 1], it[k]] = [it[k], it[k - 1]]; pintar(); });
      $('#ob-add').onclick = () => { it.push({ id:novoId(), nome:'' }); pintar(); const l = c.querySelectorAll('[data-in]'); l[l.length - 1].focus(); };
      $('#ob-pad').onclick = () => { it = ITENS_PADRAO.map(i => Object.assign({}, i)); pintar(); };
      $('#ob-sv').onclick = async () => { const L = it.map(i => ({ id:i.id, nome:String(i.nome || '').trim() })).filter(i => i.nome); if (!L.length) { toast('Deixe pelo menos um item.', true); return; }
        const ni = $('#ob-ini').value;
        try { await salvar('config', 'itens', { itens:L }); if (ni && ni !== D.ini) await salvar('config', 'inicio', { data:ni }); toast('Itens salvos.'); await carregar(); } catch(e){ toast(traduzErro(e), true); } }; };
    const addLote = () => {
    const lt = document.createElement('section'); lt.className = 'fc-sec cartao'; lt.style.cssText = 'padding:14px;margin-top:12px';
    lt.innerHTML = `<h3 style="margin:0 0 4px;font-size:15px">Marcar em lote</h3><p class="nr-nota" style="padding:0 0 10px">Marca os itens escolhidos como feitos para todos os admitidos no período que ainda estão na empresa. O que já estava marcado continua como está.</p>
      <div class="ob-ini" style="margin-top:0"><label>Admitidos de <input type="date" id="lt-de"></label><label>até <input type="date" id="lt-ate" value="${hoje()}"></label></div>
      <div class="ob-tm" style="margin:10px 0">${D.itens.map(i => `<label><input type="checkbox" value="${esc(i.id)}" checked> ${esc(i.nome)}</label>`).join('')}</div>
      <div style="display:flex;justify-content:flex-end"><button class="btn prim" id="lt-ok">Marcar como feito</button></div>`;
    c.appendChild(lt);
    $('#lt-ok').onclick = async () => { const de = $('#lt-de').value || '2000-01-01', ate = $('#lt-ate').value || hoje(), ids = [...lt.querySelectorAll('.ob-tm input:checked')].map(i => i.value);
      if (!ids.length) { toast('Escolha pelo menos um item.', true); return; }
      const n = Object.values(D.M).filter(x => x.situacao !== 'Desligado' && x.admissao >= de && x.admissao <= ate).length;
      const b = $('#lt-ok'); if (b.dataset.conf !== '1') { b.dataset.conf = '1'; b.textContent = `Confirmar para ${n} admitido${n === 1 ? '' : 's'}`; return; }
      b.disabled = true; try { const q = await marcarLote(D.M, await regs('check'), de, ate, ids, 'Marcado em lote'); toast(`${q} ficha${q === 1 ? '' : 's'} atualizada${q === 1 ? '' : 's'}.`); await carregar(); } catch(e){ toast(traduzErro(e), true); b.disabled = false; } };
    };
    const _p = pintar; pintar = () => { _p(); addLote(); }; pintar();
  }
  function formConversa(x, k, cv){
    const v = cv || { data:hoje(), como:'bem', temas:[], obs:'', quem:E.perfil.nome };
    abrirModal({ titulo:`Conversa de ${k} dias: ${x.nome}`, largo:true,
      corpo:`<p class="nr-nota" style="margin:0 0 10px;padding:0">Admitido em ${esc(brD(x.adm))} · ${esc(x.funcao)} · ${esc(x.area || '')}. Conversa do RH; não substitui a avaliação de experiência da área. Detalhes de saúde ficam fora daqui.</p>
        <div class="nr-form"><div class="nr-c"><label for="oc-d">Data</label><input type="date" id="oc-d" value="${esc(v.data)}" ${pode ? '' : 'disabled'}></div>
        <div class="nr-c"><label for="oc-q">Quem conduziu</label><input id="oc-q" maxlength="120" value="${esc(v.quem || '')}" ${pode ? '' : 'disabled'}></div>
        <div class="nr-c w"><label>Como a pessoa está</label><div class="ob-como">${Object.entries(COMO).map(([kk, t]) => `<label><input type="radio" name="oc-c" value="${kk}" ${v.como === kk ? 'checked' : ''} ${pode ? '' : 'disabled'}> ${t}</label>`).join('')}</div></div>
        <div class="nr-c w"><label>Pontos que apareceram</label><div class="ob-tm">${TEMAS.map(t => `<label><input type="checkbox" value="${esc(t)}" ${(v.temas || []).includes(t) ? 'checked' : ''} ${pode ? '' : 'disabled'}> ${esc(t)}</label>`).join('')}</div></div>
        <div class="nr-c w"><label for="oc-o">O que foi conversado e combinado</label><textarea id="oc-o" rows="3" maxlength="800" ${pode ? '' : 'disabled'}>${esc(v.obs || '')}</textarea></div><p class="nr-msg" id="oc-m"></p></div>`,
      pe: pode ? `${cv ? '<button class="btn perigo" id="oc-del">Excluir</button>' : ''}<span style="flex:1"></span><button class="btn borda" id="oc-c">Cancelar</button><button class="btn prim" id="oc-ok">Salvar</button>` : '',
      aoAbrir: m => { if (!pode) return; m.querySelector('#oc-c').onclick = fecharModal;
        const del = m.querySelector('#oc-del'); if (del) del.onclick = async () => { if (del.dataset.conf !== '1') { del.dataset.conf = '1'; del.textContent = 'Confirmar exclusão'; return; }
          try { await salvar('conversas', cv._id, Object.assign({}, cv, { _id:undefined, excluida:true, excluidaEm:new Date().toISOString(), excluidaPor:E.perfil.nome })); fecharModal(); toast('Conversa excluída.'); carregar(); } catch(e){ toast(traduzErro(e), true); } };
        m.querySelector('#oc-ok').onclick = async () => {
          const d = { mat:x.mat, nome:x.nome, adm:x.adm, marco:k, data:m.querySelector('#oc-d').value || hoje(), quem:m.querySelector('#oc-q').value.trim(), como:(m.querySelector('input[name=oc-c]:checked') || {}).value || 'bem',
            temas:[...m.querySelectorAll('.ob-tm input:checked')].map(i => i.value), obs:m.querySelector('#oc-o').value.trim(), criadoEm:(cv && cv.criadoEm) || new Date().toISOString(), criadoPor:(cv && cv.criadoPor) || E.perfil.nome };
          try { await salvar('conversas', cv ? cv._id : x.mat + '_' + k, d); fecharModal(); toast('Conversa registrada.'); carregar(); } catch(e){ toast(traduzErro(e), true); } }; } });
  }
  const cab = () => ['Colaborador', 'Matrícula', 'Função', 'Área', 'Seção', 'Admissão', 'Dias de casa', ...D.itens.map(i => i.nome), ...MARCOS.map(k => 'Conversa ' + k + ' dias'), 'Risco de saída'];
  const MKT = { atr:'Atrasada', pend:'Fazer', fut:'', na:'Antes do início' };
  const linhas = () => filtrar().map(x => [x.nome, x.mat, x.funcao, x.area || '', x.setor || '', brD(x.adm), x.casa, ...D.itens.map(i => x.ok[i.id] ? 'Feito ' + brD(x.ok[i.id].em) : 'Pendente'),
    ...MARCOS.map((k, j) => { const cv = x.conv.find(v => +v.marco === k); return cv ? (COMO[cv.como] || 'Feita') + ' (' + brD(cv.data) + ')' : MKT[x.mk[j]]; }), D.RS[x.mat] ? (D.RS[x.mat].niv === 'a' ? 'Alto' : 'Atenção') : '']);
  const linhasRet = () => D.RET.map(o => [mesNome(o.mes), o.adm.length, o.sai.length, (100 - pct(o.sai.length, o.adm.length)) + '%', o.fechado ? '' : 'em andamento']);
  const nome = 'Onboarding ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  $('#ob-xls').onclick = () => { if (!D) return; const wb = XLSX.utils.book_new();
    const a = XLSX.utils.aoa_to_sheet([cab(), ...linhas()]); a['!cols'] = cab().map((c, i) => ({ wch: i === 0 ? 34 : 16 })); XLSX.utils.book_append_sheet(wb, a, 'Acompanhamento');
    const r = XLSX.utils.aoa_to_sheet([['Mês de admissão', 'Admitidos', 'Saíram com até 90 dias', 'Retenção aos 90 dias', ''], ...linhasRet()]); r['!cols'] = [{ wch:18 }, { wch:12 }, { wch:24 }, { wch:22 }, { wch:16 }]; XLSX.utils.book_append_sheet(wb, r, 'Retenção 90 dias');
    baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nome + '.xlsx'); };
  $('#ob-pdf').onclick = () => { if (!D) return; const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Onboarding', `${filtrar().length} admitidos · últimos ${F.dias} dias`);
    const c0 = ['Colaborador', 'Função', 'Área', 'Admissão', 'Dias', 'Checklist pendente', '30 dias', '60 dias', '90 dias'];
    const L = filtrar().map(x => [x.nome, x.funcao, x.area || '', brD(x.adm), String(x.casa), x.falta.map(nomeItem).join(', ') || 'Completo', ...MARCOS.map((k, j) => { const cv = x.conv.find(v => +v.marco === k); return cv ? (COMO[cv.como] || 'Feita') : MKT[x.mk[j]]; })]);
    doc.autoTable({ startY:104, head:[c0], body:L, margin:{ left:30, right:30 }, styles:{ fontSize:7, cellPadding:2.5, overflow:'linebreak' }, headStyles:{ fillColor:[36,66,124] }, alternateRowStyles:{ fillColor:[244,246,250] } });
    const y = doc.lastAutoTable.finalY + 22; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 33, 61); doc.text('Retenção aos 90 dias por mês de admissão', 30, y > 520 ? (doc.addPage(), 40) : y);
    doc.autoTable({ startY:(y > 520 ? 40 : y) + 6, head:[['Mês de admissão', 'Admitidos', 'Saíram com até 90 dias', 'Retenção aos 90 dias', '']], body:linhasRet().map(l => l.map(String)), margin:{ left:30, right:30 }, styles:{ fontSize:8, cellPadding:2.5 }, headStyles:{ fillColor:[46,138,87] } });
    rodapePDF(doc); baixar(doc.output('blob'), nome + '.pdf'); };
  carregar();
}
return { tela, pendencias };
};
