/* =====================================================================
   SAÚDE DAS BASES
   Data de cada base carregada × prazo combinado para atualizar. Avisa na Central de Rotinas do RH,
   dentro do painel e antes de fechar o mês no Relatórios Gerenciais.
   Prazos ficam em registros do Quadro: caminho 'sistema/prazos_bases'.
   ===================================================================== */
window.CRV_BASES_INIT = function(X){
'use strict';
const { sb, E, $, esc, brD, podeVer, podeEditar, ehAdmin, moldura, toast, traduzErro, FRENTES } = X;

// dias até a base precisar ser atualizada; 0 = sem prazo (painéis alimentados no próprio app ou que mudam pouco)
const PADRAO = { quadro:7, 'quadro:abs':15, 'quadro:resc':15, admissoes:15, rescisoes:15, experiencia:15, absenteismo:15, ferias:30, sancoes:30, rd:30,
  unimed:35, uniodonto:35, farmacia:35, sysprocard:35, 'cartao-alimentacao':35, 'cartao-convenio':35, 'cartao-premium':35, alojamentos:30, onibus:30,
  treinamentos:30, 'treinamentos:real':30, jovem:30, renapsi:30, fadiga:30, ouvidorias:30, processos:60, 'servicos-gerais':30, gratificacao:35 };
// bases que ficam dentro de outra (a data do pacote não diz até quando vai o conteúdo)
const INTERNAS = [
  { id:'quadro:abs', painel:'quadro', nome:'Absenteísmo dentro do Quadro', ate: async () => { const d = await window.CRV_DADOS('quadro'); return d && d.dados.ABSD && d.dados.ABSD.last || ''; } },
  { id:'quadro:resc', painel:'quadro', nome:'Rescisões dentro do Quadro', ate: async () => { const d = await window.CRV_DADOS('quadro'); return d && d.dados.AXD && d.dados.AXD.EXMAX || ''; } },
  { id:'treinamentos:real', painel:'treinamentos', nome:'Treinamentos realizados lançados', ate: async () => { const d = await window.CRV_DADOS('treinamentos'); const D = d && d.dados.DATA; let m = '';
      (D && D.rows || []).forEach(r => { if (r[5] && r[5] > m) m = r[5]; });
      (await window.CRV_REGS('treinamentos', 'novos')).forEach(x => { if (!x.excluido && x.data && x.data > m) m = x.data; }); return m; } } ];
let _prazos = null, _internas = null, _internasK = '';
const hoje = () => new Date().toISOString().slice(0, 10);
const dias = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const isoDe = v => { const s = String(v || ''); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };

async function prazos(forcar){
  if (_prazos && !forcar) return _prazos;
  let p = {}; try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/prazos_bases').maybeSingle(); p = (data && data.dados && data.dados.p) || {}; } catch(_){}
  _prazos = Object.assign({}, PADRAO, p); return _prazos;
}
async function salvarPrazos(p){
  const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'sistema/prazos_bases', colecao:'sistema', doc_id:'prazos_bases', dados:{ p, em:new Date().toISOString(), por:E.perfil.nome }, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
  if (error) throw error; _prazos = Object.assign({}, PADRAO, p);
}
async function internas(){
  const k = ['quadro', 'treinamentos'].map(id => (E.metas[id] && (E.metas[id].atualizado_em || E.metas[id].referencia)) || '').join('|');
  if (_internas && _internasK === k) return _internas;
  const o = {}; for (const b of INTERNAS) { try { o[b.id] = isoDe(await b.ate()); } catch(_){ o[b.id] = ''; } }
  _internas = o; _internasK = k; return o;
}
function sit(ate, prazo){
  if (!ate) return { k:'sem', t:'Sem dados', ord:1 };
  const idade = dias(ate, hoje());
  if (!prazo) return { k:'livre', t:'Sem prazo', idade, ord:4 };
  const falta = prazo - idade;
  if (falta < 0) return { k:'atr', t:`Desatualizada há ${-falta} dia${-falta === 1 ? '' : 's'}`, idade, falta, ord:0 };
  if (falta <= 3) return { k:'vence', t: falta === 0 ? 'Vence hoje' : `Vence em ${falta} dia${falta === 1 ? '' : 's'}`, idade, falta, ord:2 };
  return { k:'ok', t:'Em dia', idade, falta, ord:3 };
}
/* todas as bases que o usuário vê, com situação */
async function linhas(){
  const P = await prazos(), I = await internas(), L = [];
  (E.paineis || []).filter(p => podeVer(p) && p.id !== 'sysprocard-credito').forEach(p => {
    const m = E.metas[p.id]; if (!m && !PADRAO[p.id]) return;
    const ate = m ? (isoDe(m.referencia) || isoDe(m.atualizado_em)) : '';
    L.push({ id:p.id, painel:p, nome:p.nome, frente:p.frente, ate, carregada:m && m.atualizado_em, por:m && m.atualizado_por, prazo:P[p.id] || 0, s:sit(ate, P[p.id] || 0), pode:podeEditar(p) });
    INTERNAS.filter(b => b.painel === p.id && m).forEach(b => L.push({ id:b.id, painel:p, nome:b.nome, frente:p.frente, interna:1, ate:I[b.id] || '', prazo:P[b.id] || 0, s:sit(I[b.id] || '', P[b.id] || 0), pode:podeEditar(p) }));
  });
  return L;
}
async function situacaoDe(id){ const L = await linhas(); return L.filter(x => x.id === id || x.id.startsWith(id + ':')); }

async function pendencias(){
  if (!ehAdmin()) return [];   // só quem importa as bases recebe o aviso
  const L = (await linhas()).filter(x => x.pode && x.s.k === 'atr');
  if (!L.length) return [];
  return [{ id:'bases', sev:'warn', t:'Bases desatualizadas', painel:'', rota:'#/bases', pnome:'Qualidade dos Dados', d:'Os números destes painéis podem estar defasados. Carregue a planilha nova.',
    itens:L.sort((a, b) => a.s.falta - b.s.falta).map(x => ({ nome:x.nome, mat:'', det:`${x.frente} · base de ${brD(x.ate)} · ${x.s.t.toLowerCase()} (prazo ${x.prazo} dias)` })) }];
}
/* aviso no topo do painel */
async function aviso(id){
  try { const L = (await situacaoDe(id)).filter(x => x.s.k === 'atr' || x.s.k === 'vence'); if (!L.length) return '';
    return `<div class="sb-av ${L.some(x => x.s.k === 'atr') ? 'atr' : ''}">${L.map(x => `<span><b>${esc(x.interna ? x.nome : 'Base')}</b> de ${esc(brD(x.ate))} · ${esc(x.s.t.toLowerCase())}</span>`).join('')}${ehAdmin() ? '<button class="link" data-ir="#/bases">Qualidade dos Dados ›</button>' : ''}</div>`;
  } catch(_){ return ''; }
}

async function tela(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Central de Rotinas do RH</div><h1>Qualidade dos Dados</h1><div class="ini-data">Até quando vai cada base carregada no app e quando precisa ser atualizada</div></div></section>
    <div id="sb-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  let L = await linhas(); const F = { k:'' }, adm = ehAdmin();
  // base principal pela situação; as linhas internas (↳) logo abaixo da base de onde vêm
  const ordenar = A => { const pai = x => x.interna ? A.find(y => !y.interna && y.id === x.painel.id) : x;
    const ordPai = x => { const p = pai(x) || x; const filhos = A.filter(y => y.interna && y.painel.id === p.id); return Math.min(p.s.ord, ...filhos.map(y => y.s.ord)); };
    return A.slice().sort((a, b) => { const pa = pai(a) || a, pb = pai(b) || b;
      if (pa !== pb) return ordPai(a) - ordPai(b) || pa.nome.localeCompare(pb.nome, 'pt-BR');
      return (a.interna ? 1 : 0) - (b.interna ? 1 : 0) || a.nome.localeCompare(b.nome, 'pt-BR'); }); };
  const desenhar = () => { const c = $('#sb-corpo'); if (!c) return;
    const n = k => L.filter(x => x.s.k === k).length;
    const V = L.filter(x => !F.k || x.s.k === F.k || (F.k === 'ok' && x.s.k === 'livre'));
    const fr = [...new Set(V.map(x => x.frente))].sort((a, b) => Object.keys(FRENTES).indexOf(a) - Object.keys(FRENTES).indexOf(b));
    c.innerHTML = `<section class="dk-kpis">
        <button class="dk-k ${F.k === 'atr' ? 'on' : ''}" data-k="atr" style="--c:var(--coral)"><span>Desatualizadas</span><b>${n('atr')}</b><small>passaram do prazo</small></button>
        <button class="dk-k ${F.k === 'vence' ? 'on' : ''}" data-k="vence" style="--c:var(--amber)"><span>Vencendo</span><b>${n('vence')}</b><small>em até 3 dias</small></button>
        <button class="dk-k ${F.k === 'ok' ? 'on' : ''}" data-k="ok" style="--c:var(--cane)"><span>Em dia</span><b>${n('ok') + n('livre')}</b><small>${n('livre')} sem prazo</small></button>
        <button class="dk-k ${F.k === 'sem' ? 'on' : ''}" data-k="sem" style="--c:#7a869c"><span>Sem dados</span><b>${n('sem')}</b><small>nunca carregadas</small></button></section>
      ${fr.map(f => `<section class="fc-sec cartao sb-fr"><header><h3><i style="background:${(FRENTES[f] || {}).cor || '#888'}"></i>${esc(f)}</h3></header><div class="fc-tw"><table class="fc-t sb-t"><thead><tr><th>Base</th><th>Vai até</th><th>Carregada em</th><th>Prazo</th><th>Situação</th><th></th></tr></thead><tbody>
        ${ordenar(V.filter(x => x.frente === f)).map(x => `<tr class="${x.interna ? 'sb-int' : ''}"><td>${x.interna ? '↳ ' : ''}${esc(x.nome)}</td><td>${x.ate ? esc(brD(x.ate)) + `<small class="rs-sub">${x.s.idade} dia${x.s.idade === 1 ? '' : 's'} atrás</small>` : '—'}</td>
          <td>${x.carregada ? esc(new Date(x.carregada).toLocaleDateString('pt-BR')) + (x.por ? `<small class="rs-sub">${esc(String(x.por).split(' ')[0])}</small>` : '') : x.interna ? '<small class="rs-sub">conteúdo da base acima</small>' : '—'}</td>
          <td>${adm ? `<input class="sb-pz" type="number" min="0" max="365" value="${x.prazo}" data-pz="${esc(x.id)}" aria-label="Prazo em dias"> <small>dias</small>` : x.prazo ? x.prazo + ' dias' : 'sem prazo'}</td>
          <td><span class="sb-s ${x.s.k}">${esc(x.s.t)}</span></td><td>${x.interna ? '' : `<button class="link" data-ir="#/p/${encodeURIComponent(x.id)}">Abrir ›</button>`}</td></tr>`).join('')}</tbody></table></div></section>`).join('') || '<div class="cartao vazio"><h3>Nada com esse filtro</h3></div>'}
      <p class="nr-fonte">"Vai até" é a data de referência informada ao carregar a base (ou o último registro, nas linhas ↳). O prazo é quantos dias a base pode ficar sem atualizar; 0 = sem prazo, para painéis alimentados no próprio app. ${adm ? 'Mude o prazo direto na tabela: grava sozinho.' : ''}</p>`;
    c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { F.k = F.k === b.dataset.k ? '' : b.dataset.k; desenhar(); });
    c.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
    c.querySelectorAll('[data-pz]').forEach(i => i.onchange = async () => { const v = Math.max(0, Math.min(365, parseInt(i.value, 10) || 0)); const P = Object.assign({}, await prazos()); P[i.dataset.pz] = v;
      const dif = {}; Object.keys(P).forEach(k => { if (P[k] !== PADRAO[k]) dif[k] = P[k]; });
      try { await salvarPrazos(dif); toast('Prazo salvo.'); L = await linhas(); desenhar(); } catch(e){ toast(traduzErro(e), true); } });
  };
  desenhar();
}
return { tela, pendencias, aviso, linhas, internas, isoDe };
};
