/* =====================================================================
   GESTOR DE ÁREA
   O gestor vê só a equipe da(s) área(s) dele: experiência, férias, frequência, novos colaboradores e crachás.
   Segurança no banco: o administrador gera um recorte por área (tabela area_dados) e a RLS deixa o
   gestor ler só as chaves que estão em perfis.areas. O gestor não tem acesso a nenhum pacote nem painel.
   Chave: 'a:<área do Quadro>' ou 'g:<gerência do Quadro>'.
   Nada de CPF, salário, saúde (só a contagem de dias de atestado), processos, ouvidorias ou risco de saída.
   ===================================================================== */
window.CRV_GESTOR_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, fMat, fDias, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF } = X;
const hoje = () => new Date().toISOString().slice(0, 10);
const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const nomeChave = k => k.slice(2);
const tipoChave = k => k[0] === 'g' ? 'Gerência' : 'Área';
const DEC = { efetivar:'Efetivar', encerrar:'Encerrar contrato', prorrogar:'Prorrogar' };

/* opções de área/gerência para o cadastro do gestor */
async function opcoes(){
  const Q = await window.CRV_QUADRO(); if (!Q) return [];
  const c = {}; Object.values(Q.mapa).forEach(p => { if (p.situacao === 'Desligado') return; if (p.area && !/^(afastados|desistentes)$/i.test(p.area)) c['a:' + p.area] = (c['a:' + p.area] || 0) + 1; if (p.gerencia && !/classificar/i.test(p.gerencia)) c['g:' + p.gerencia] = (c['g:' + p.gerencia] || 0) + 1; });
  return Object.entries(c).map(([k, n]) => ({ k, n })).sort((a, b) => a.k[0].localeCompare(b.k[0]) || a.k.localeCompare(b.k, 'pt-BR'));
}
const assinatura = () => ['quadro', 'experiencia', 'ferias', 'crachas'].map(id => id + ':' + ((E.metas[id] && (E.metas[id].atualizado_em || E.metas[id].referencia)) || '')).join('|');

/* monta o recorte de uma chave a partir das bases completas (só o administrador consegue ler as bases) */
async function recortes(chaves){
  const Q = await window.CRV_QUADRO(); if (!Q) throw new Error('Sem a base do Quadro Geral.');
  const M = Q.mapa, h = hoje();
  const dentro = (p, k) => p.situacao !== 'Desligado' && (k[0] === 'a' ? p.area === k.slice(2) : p.gerencia === k.slice(2));
  // bases auxiliares (lidas uma vez)
  const EXP = {}; let refExp = '';
  try { const d = await window.CRV_DADOS('experiencia'); refExp = d && d.referencia || ''; const R = d && d.dados.RAW || []; const reg = {}; (await window.CRV_REGS('experiencia', 'registros')).forEach(x => reg[x._id] = x);
    R.forEach(r => { const m = fMat(r[0]); const g = reg['m' + m] || {}; EXP[m] = { v1:r[7] || '', v2:r[8] || '', dias:r[9] || '', dec1:g.pr && g.pr.decisao ? DEC[g.pr.decisao] || g.pr.decisao : '', dec2:g.ef && g.ef.decisao ? DEC[g.ef.decisao] || g.ef.decisao : '', enc:(g.enc && g.enc.data) || (r[17] ? 'sim' : '') }; }); } catch(_){}
  const FER = {}; let refFer = '';
  try { const d = await window.CRV_DADOS('ferias'); refFer = d && d.referencia || ''; const PR = {}; (await window.CRV_REGS('ferias', 'prog')).forEach(x => { if (x._id) PR[x._id] = x; });
    (d && d.dados.DATA || []).forEach(p => { const m = fMat(p.c);
      FER[m] = (p.p || []).filter(q => !q[5] && q[3] > 0).map(([de, ate, lim, saldo, , , plan]) => { const g = PR[m + '_' + de];
        const prog = g ? (g.retorno ? 'aguarda retorno' : (g.parcelas && g.parcelas.length ? g.parcelas : [{ inicio:g.inicio, dias:g.dias }]).map(x => brD(x.inicio) + ' (' + x.dias + 'd)').join(' + ')) : (plan && /^\d{4}/.test(plan) ? brD(plan) + ' (planilha)' : '');
        const st = ate > h ? 'Em aquisição' : lim < h && !prog ? 'Vencido' : fDias(h, lim) <= 90 && !prog ? 'Vence em ' + fDias(h, lim) + ' dias' : prog ? 'Programado' : 'A gozar';
        return { de, ate, lim, saldo:Math.round(saldo), prog, st }; }); }); } catch(_){}
  const CR = {}; try { (await window.CRV_REGS('crachas', 'treinamentos')).filter(x => !x.excluido).forEach(x => (CR[fMat(x.mat)] = CR[fMat(x.mat)] || []).push({ func:x.funcaoTrein || '', ini:x.inicio || '', fim:x.fim || '', res:x.resultado || '' })); } catch(_){}
  let ONB = { itens:[], ck:{}, cv:{} };
  try { const L = await window.CRV_REGS('onboarding', 'config'), c = L.find(x => x._id === 'itens'); ONB.itens = c && c.itens || [];
    (await window.CRV_REGS('onboarding', 'check')).forEach(x => ONB.ck[fMat(x.mat || x._id)] = x.ok || {});
    (await window.CRV_REGS('onboarding', 'conversas')).filter(x => !x.excluida).forEach(x => (ONB.cv[fMat(x.mat)] = ONB.cv[fMat(x.mat)] || []).push(+x.marco)); } catch(_){}
  const out = [];
  for (const k of chaves) {
    const mats = Object.keys(M).filter(m => dentro(M[m], k));
    const O = await window.CRV_OCORR(mats, '2000-01-01', h); const ate = O.abs || '';
    const d90 = ate ? addD(ate, -90) : '', d30 = ate ? addD(ate, -30) : '';
    const P = mats.map(m => { const p = M[m], o = O.P[m] || { at:[], fa:[], adv:[], sus:[] };
      const casa = p.admissao ? fDias(p.admissao, h) : null, ob = casa != null && casa <= 120 ? { falta: ONB.itens.filter(i => !(ONB.ck[m] || {})[i.id]).map(i => i.nome), conv: ONB.cv[m] || [] } : null;
      return { m, n:p.nome, f:p.funcao, s:p.setor, adm:p.admissao, v:p.vinculo, sit:p.situacao,
        fa90:o.fa.filter(x => x > d90).length, fa30:o.fa.filter(x => x > d30).length, at90:o.at.filter(x => x > d90).length,
        exp: p.vinculo === 'Experiência' || (EXP[m] && EXP[m].v2 >= addD(h, -30)) ? EXP[m] || null : null, fer: FER[m] || [], cr:(CR[m] || []).filter(x => !x.fim || x.fim >= addD(h, -30)), ob };
    }).sort((a, b) => a.n.localeCompare(b.n, 'pt-BR'));
    out.push({ chave:k, dados:{ chave:k, nome:nomeChave(k), tipo:tipoChave(k), P, ref:{ quadro:Q.referencia, abs:ate, exp:refExp, fer:refFer }, gerado:new Date().toISOString(), por:E.perfil.nome } });
  }
  return out;
}

/* administrador: gera os recortes para todas as áreas usadas por gestores */
async function gerar(forcar){
  if (!E.perfil || E.perfil.papel !== 'admin') return { ok:false };
  const { data: G, error } = await sb.from('perfis').select('areas,papel,ativo').eq('papel', 'gestor');
  if (error) return { ok:false, erro:error };
  const chaves = [...new Set((G || []).filter(g => g.ativo).flatMap(g => g.areas || []))];
  const sig = assinatura();
  if (!forcar) { try { const { data } = await sb.from('area_dados').select('dados').eq('chave', '__meta').maybeSingle(); if (data && data.dados && data.dados.sig === sig && JSON.stringify(data.dados.chaves) === JSON.stringify(chaves.slice().sort())) return { ok:true, igual:true }; } catch(_){} }
  if (!chaves.length) return { ok:true, n:0 };
  const R = await recortes(chaves);
  for (const r of R) { const { error: e } = await sb.from('area_dados').upsert({ chave:r.chave, dados:r.dados, atualizado_em:new Date().toISOString(), atualizado_por:E.perfil.nome }, { onConflict:'chave' }); if (e) return { ok:false, erro:e }; }
  await sb.from('area_dados').upsert({ chave:'__meta', dados:{ sig, chaves:chaves.slice().sort(), em:new Date().toISOString(), por:E.perfil.nome }, atualizado_em:new Date().toISOString(), atualizado_por:E.perfil.nome }, { onConflict:'chave' });
  return { ok:true, n:R.length };
}
async function ultimaGeracao(){ try { const { data } = await sb.from('area_dados').select('dados').eq('chave', '__meta').maybeSingle(); return data && data.dados; } catch(_){ return null; } }

/* tela do gestor */
async function tela(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas</div><h1>Minha equipe</h1><div class="ini-data" id="gs-sub">Carregando…</div></div>
      <div class="dk-acoes"><button class="btn borda" id="gs-xls">Excel</button><button class="btn borda" id="gs-pdf">PDF</button></div></section>
    <div id="gs-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  const { data, error } = await sb.from('area_dados').select('chave,dados,atualizado_em').neq('chave', '__meta');
  const c = $('#gs-corpo'); if (!c) return;
  if (error) { c.innerHTML = `<div class="cartao vazio"><h3>Não consegui abrir os dados da sua equipe</h3><p>${esc(traduzErro(error))}</p></div>`; return; }
  const A = (data || []).map(x => x.dados).filter(Boolean);
  if (!A.length) { $('#gs-sub').textContent = ''; c.innerHTML = '<div class="cartao vazio"><h3>Sua equipe ainda não foi liberada</h3><p>O RH precisa vincular sua área ao seu acesso e atualizar a visão dos gestores.</p></div>'; return; }
  const P = []; const vis = new Set(); A.forEach(a => a.P.forEach(p => { if (!vis.has(p.m)) { vis.add(p.m); P.push(Object.assign({ chave:a.nome }, p)); } }));
  P.sort((a, b) => a.n.localeCompare(b.n, 'pt-BR'));
  const ref = A[0].ref || {}, h = hoje();
  $('#gs-sub').innerHTML = `${A.map(a => `<span class="gs-ch">${esc(a.tipo)}: ${esc(a.nome)}</span>`).join('')} <span>Atualizado pelo RH em ${esc(new Date(A.map(a => a.gerado).sort().pop()).toLocaleDateString('pt-BR'))}</span>`;
  const H = h, em15 = addD(H, 15);
  const expL = P.filter(p => p.exp && !p.exp.enc).map(p => { const prox = [p.exp.v1, p.exp.v2].filter(d => d && d >= addD(H, -30)).sort()[0] || p.exp.v2; return Object.assign({ prox }, p); }).sort((a, b) => String(a.prox).localeCompare(String(b.prox)));
  const ferL = P.flatMap(p => p.fer.filter(f => f.st !== 'Em aquisição').map(f => Object.assign({ p }, f))).sort((a, b) => a.lim.localeCompare(b.lim));
  const novos = P.filter(p => p.ob);
  const crL = P.flatMap(p => p.cr.map(x => Object.assign({ p }, x))).sort((a, b) => String(a.fim).localeCompare(String(b.fim)));
  const ABAS = [['eq', 'Equipe', P.length], ['exp', 'Experiência', expL.filter(p => p.prox && p.prox <= em15).length], ['fer', 'Férias', ferL.filter(f => /Vencido|Vence/.test(f.st)).length], ['freq', 'Frequência', P.filter(p => p.fa30).length], ['nov', 'Novos colaboradores', novos.length], ['cr', 'Crachás de treinamento', crL.filter(x => x.fim && x.fim <= em15).length]];
  let aba = 'eq', q = '';
  const tabelas = {
    eq: () => ({ t:'Equipe', cab:['Colaborador', 'Matrícula', 'Função', 'Seção', 'Admissão', 'Vínculo', 'Situação'], lin:P.map(p => [p.n, p.m, p.f, p.s, brD(p.adm), p.v, p.sit]) }),
    exp: () => ({ t:'Período de experiência', cab:['Colaborador', 'Função', '1º vencimento', 'Avaliação', 'Vencimento final', 'Avaliação'], lin:expL.map(p => [p.n, p.f, brD(p.exp.v1), p.exp.dec1 || 'pendente', brD(p.exp.v2), p.exp.dec2 || 'pendente']), hl:expL.map(p => p.prox && p.prox <= em15) }),
    fer: () => ({ t:'Férias', cab:['Colaborador', 'Período aquisitivo', 'Data limite', 'Saldo', 'Programação', 'Situação'], lin:ferL.map(f => [f.p.n, brD(f.de) + ' a ' + brD(f.ate), brD(f.lim), f.saldo + 'd', f.prog || '—', f.st]), hl:ferL.map(f => /Vencido|Vence/.test(f.st)) }),
    freq: () => ({ t:`Frequência (até ${brD(ref.abs)})`, cab:['Colaborador', 'Função', 'Faltas 30 dias', 'Faltas 90 dias', 'Dias de atestado 90 dias'], lin:P.filter(p => p.fa90 || p.at90).sort((a, b) => b.fa90 - a.fa90 || b.at90 - a.at90).map(p => [p.n, p.f, p.fa30, p.fa90, p.at90]) }),
    nov: () => ({ t:'Novos colaboradores', cab:['Colaborador', 'Função', 'Admissão', 'Dias de casa', 'Integração pendente', 'Conversas do RH'], lin:novos.map(p => [p.n, p.f, brD(p.adm), fDias(p.adm, h), p.ob.falta.join(', ') || 'completa', [30, 60, 90].filter(k => p.ob.conv.includes(k)).map(k => k + 'd').join(', ') || '—']) }),
    cr: () => ({ t:'Crachás de treinamento', cab:['Colaborador', 'Função em treinamento', 'Início', 'Vencimento', 'Resultado'], lin:crL.map(x => [x.p.n, x.func, brD(x.ini), brD(x.fim), x.res || '—']), hl:crL.map(x => x.fim && x.fim <= em15) }) };
  const desenhar = () => { const T = tabelas[aba](), nq = normal(q); const idx = T.lin.map((l, i) => i).filter(i => !nq || normal(T.lin[i].join(' ')).includes(nq));
    c.innerHTML = `<section class="dk-kpis gs-k">${ABAS.map(([k, t, n]) => `<button class="dk-k ${aba === k ? 'on' : ''}" data-a="${k}" style="--c:${{ eq:'#2f6fa8', exp:'var(--amber)', fer:'#8e3b6a', freq:'var(--coral)', nov:'var(--cane)', cr:'#b5731a' }[k]}"><span>${t}</span><b>${n}</b><small>${{ eq:'pessoas', exp:'vencendo em 15 dias', fer:'vencidas ou vencendo', freq:'com falta em 30 dias', nov:'até 120 dias de casa', cr:'vencendo em 15 dias' }[k]}</small></button>`).join('')}</section>
      <section class="dk-filtros cartao"><input id="gs-q" type="search" placeholder="Buscar nome, matrícula ou função" value="${esc(q)}"></section>
      <section class="fc-sec cartao"><header><h3>${esc(T.t)}</h3><small>${idx.length} linha${idx.length === 1 ? '' : 's'}</small></header>${idx.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr>${T.cab.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${idx.map(i => `<tr class="${T.hl && T.hl[i] ? 'gs-hl' : ''}">${T.lin[i].map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nada aqui.</p>'}</section>
      <p class="nr-fonte">Quadro de ${esc(brD(ref.quadro))}${ref.abs ? ' · faltas e atestados até ' + esc(brD(ref.abs)) : ''}${ref.exp ? ' · experiência de ' + esc(brD(ref.exp)) : ''}${ref.fer ? ' · férias de ' + esc(brD(ref.fer)) : ''}. Dúvidas ou correções: fale com a Gestão de Pessoas.</p>`;
    c.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { aba = b.dataset.a; desenhar(); });
    const i = $('#gs-q'); i.oninput = () => { q = i.value; clearTimeout(i._t); i._t = setTimeout(() => { desenhar(); const e = $('#gs-q'); if (e) { e.focus(); e.setSelectionRange(q.length, q.length); } }, 250); }; };
  const nome = 'Minha equipe ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  $('#gs-xls').onclick = () => { const wb = XLSX.utils.book_new(); Object.keys(tabelas).forEach(k => { const T = tabelas[k](); const ws = XLSX.utils.aoa_to_sheet([T.cab, ...T.lin]); ws['!cols'] = T.cab.map((x, i) => ({ wch: i === 0 ? 34 : 18 })); XLSX.utils.book_append_sheet(wb, ws, T.t.replace(/[\\/?*[\]:]/g, '-').slice(0, 31)); });
    baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nome + '.xlsx'); };
  $('#gs-pdf').onclick = () => { const T = tabelas[aba](); const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Minha equipe · ' + T.t, A.map(a => a.nome).join(', '));
    doc.autoTable({ startY:104, head:[T.cab], body:T.lin.map(l => l.map(String)), margin:{ left:30, right:30 }, styles:{ fontSize:8, cellPadding:3 }, headStyles:{ fillColor:[36,66,124] }, alternateRowStyles:{ fillColor:[244,246,250] } });
    rodapePDF(doc); baixar(doc.output('blob'), nome + ' ' + T.t + '.pdf'); };
  desenhar();
}
return { tela, gerar, opcoes, ultimaGeracao, nomeChave, tipoChave };
};
