/* =====================================================================
   RESPOSTAS DO RH E MEDIDAS DISCIPLINARES NA ÁREA DO GESTOR
   - Respostas do RH: o que o RH respondeu aos envios dos gestores/assistentes (aceito/devolvido, retorno e anexos),
     visível para todos os gestores e assistentes da área do colaborador; "Nova" até alguém da área abrir.
   - Medidas disciplinares: orientação, advertência e suspensão emitidas no painel Sanções ficam prontas para o
     gestor imprimir (só leitura) e acompanhar: Disponível → Impresso → Aplicado → Entregue ao RH → Recebido pelo RH.
   - RH: todas as respostas, todos os documentos, "Pendentes de devolução", alerta de prazo (dias úteis) e exportação.
   Tabelas: gestor_envios (respostas) e gestor_docs (documentos) — arquivo 12_respostas_rh.sql.
   ===================================================================== */
window.CRV_RESP_INIT = function(X){
'use strict';
const { sb, E, $, esc, brD, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, ehRH, ehAdmin } = X;
const quem = () => (E.perfil && E.perfil.nome) || '';
const tc = s => String(s || '').toLowerCase().replace(/(^|[\s\/(.-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Dos|Das|E) /g, m => m.toLowerCase()).replace(/\b(Ii|Iii|Iv|Rh|Crv|Dp)\b/g, m => m.toUpperCase());
const nrm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dh = s => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? brD(s) : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }); };
const hojeISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const TIPO_ENV = { ferias:'Programação de férias', experiencia:'Avaliação de experiência', sancao:'Pedido de sanção disciplinar', perfil:'Parecer do perfil profissional', doc:'Medida disciplinar' };
const TIPO_DOC = { ori:'Orientação', adv:'Advertência', sus:'Suspensão' };
const ST = { disponivel:['Disponível para impressão', '#2f6fa8'], impresso:['Impresso', '#7b3fa0'], aplicado:['Aplicado', '#b5731a'], entregue:['Entregue ao RH', '#1d7a88'], recebido:['Recebido pelo RH', '#2e7d4f'],
  correcao:['Correção solicitada', '#a3301c'], substituido:['Substituído (corrigido)', '#8a94a8'], cancelado:['Cancelado', '#8a94a8'] };
const ABERTOS = ['disponivel', 'impresso', 'aplicado', 'entregue', 'correcao'];
const chip = (t, c) => `<span style="display:inline-block;background:color-mix(in srgb,${c} 13%,#fff);color:${c};border:1px solid color-mix(in srgb,${c} 35%,#fff);border-radius:99px;padding:2px 9px;font-size:11.5px;font-weight:800;white-space:nowrap">${esc(t)}</span>`;
/* dias úteis (seg a sex) desde a data até hoje */
const diasUteis = desde => { if (!desde) return 0; const a = new Date(String(desde).slice(0, 10) + 'T12:00:00'), b = new Date(hojeISO() + 'T12:00:00'); let n = 0; for (let d = new Date(a.getTime() + 864e5); d <= b; d = new Date(d.getTime() + 864e5)) { const w = d.getDay(); if (w && w < 6) n++; } return n; };
const ultHist = (d, ac) => [...(d.hist || [])].reverse().find(h => h.acao === ac);
/* desde quando o documento está parado e por quê */
function parado(d){ if (!ABERTOS.includes(d.status)) return null;
  if (d.status === 'aplicado' || d.status === 'entregue') { const de = d.aplicado_em || (ultHist(d, 'aplicado') || {}).em; return { motivo:d.status === 'entregue' ? 'entregue, aguardando o RH receber' : 'aplicado, sem devolução ao RH', de, dias:diasUteis(de) }; }
  if (d.status === 'correcao') { const de = (ultHist(d, 'correcao') || {}).em || d.atualizado_em; return { motivo:'correção pedida ao RH', de, dias:diasUteis(de) }; }
  return { motivo:'sem aplicação', de:d.criado_em, dias:diasUteis(d.criado_em) }; }
const atrasado = d => { const p = parado(d); return !!(p && d.status !== 'correcao' && p.dias > (d.prazo || 2)); };
const visto = d => (d.hist || []).some(h => h.acao === 'visto');
/* suspensão: início próximo e documento ainda não aplicado */
function alertaSus(d){ if (d.tipo !== 'sus' || !d.dados || !d.dados.ini) return ''; if (!['disponivel', 'impresso'].includes(d.status)) return '';
  const dias = Math.round((new Date(d.dados.ini + 'T12:00:00') - new Date(hojeISO() + 'T12:00:00')) / 864e5);
  return dias < 0 ? 'A suspensão já começou em ' + brD(d.dados.ini) + ' e o documento ainda não foi aplicado.' : dias <= 3 ? 'A suspensão começa ' + (dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : 'em ' + dias + ' dias') + ' (' + brD(d.dados.ini) + ') e o documento ainda não foi aplicado.' : ''; }

/* ---------- dados ---------- */
let ENVS = [], DOCS = [], FALTA = '', CANAL = null, TIMER = null, TELA = null;
const COLS_ENV = 'id,chave,tipo,mat,colaborador,dados,status,autor_nome,criado_em,rh_obs,rh_em,rh_por,lido_em,lido_por,assinatura';
const COLS_DOC = 'id,chaves,area_nome,mat,colaborador,tipo,titulo,dados,status,aplicado_em,recusa,testemunhas,correcao,hist,prazo,recebido_em,recebido_por,criado_em,criado_por,atualizado_em,nome_arq';
const semBanco = e => { const m = String((e && e.message) || '').toLowerCase(); return m.includes('gestor_docs') || m.includes('lido_em') || m.includes('rh_anexos') || m.includes('gdoc_acao') || m.includes('marcar_envio_lido') || (m.includes('relation') && m.includes('does not exist')) || m.includes('could not find'); };
async function carregar(){
  FALTA = '';
  const r1 = await sb.from('gestor_envios').select(COLS_ENV).in('status', ['aceito', 'devolvido']).order('rh_em', { ascending:false });
  if (r1.error) { if (semBanco(r1.error)) { FALTA = 'banco'; const r1b = await sb.from('gestor_envios').select('id,chave,tipo,mat,colaborador,dados,status,autor_nome,criado_em,rh_obs,rh_em,rh_por').in('status', ['aceito', 'devolvido']).order('rh_em', { ascending:false }); ENVS = r1b.data || []; } else ENVS = []; }
  else ENVS = r1.data || [];
  const r2 = await sb.from('gestor_docs').select(COLS_DOC).order('criado_em', { ascending:false });
  if (r2.error) { DOCS = []; if (semBanco(r2.error)) FALTA = 'banco'; } else DOCS = r2.data || [];
  return { ENVS, DOCS };
}
const avisoBanco = () => FALTA === 'banco' ? `<div class="cartao" style="padding:10px 14px;background:#fff7e6;border-color:#f0d199;color:#5c3b00;font-size:13.5px;margin-bottom:12px">${ehRH() ? 'Falta preparar o banco para as respostas e os documentos dos gestores: rode o arquivo <b>12_respostas_rh.sql</b> no Supabase.' : 'Esta parte ainda está sendo preparada pelo RH.'}</div>` : '';
/* atualiza na hora: tempo real do Supabase, com conferência a cada minuto e ao voltar para a tela */
function vigiar(){ if (!CANAL && sb.channel) { try { CANAL = sb.channel('crv-resp').on('postgres_changes', { event:'*', schema:'public', table:'gestor_docs' }, () => recarregar()).on('postgres_changes', { event:'*', schema:'public', table:'gestor_envios' }, () => recarregar()).subscribe(); } catch(_){ CANAL = null; } }
  if (!TIMER) { TIMER = setInterval(() => { if (document.visibilityState === 'visible') recarregar(); }, 60000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') recarregar(); }); } }
let _rec = null; function recarregar(){ clearTimeout(_rec); _rec = setTimeout(async () => { try { await carregar(); badges(); if (TELA && location.hash.startsWith(TELA.h)) TELA.des(); } catch(_){} }, 400); }
/* contadores no menu do gestor e faixa na tela inicial */
function contar(){ const novasR = ENVS.filter(e => !e.lido_em).length, docsN = DOCS.filter(d => ABERTOS.includes(d.status) && !visto(d)).length, atr = DOCS.filter(atrasado).length, imp = DOCS.filter(d => d.status === 'disponivel').length; return { novasR, docsN, atr, imp }; }
function badges(){ if (!E.perfil || E.perfil.papel !== 'gestor') return; const c = contar();
  const pon = (h, n, cor) => { const b = document.querySelector(`[data-ir="${h}"]`); if (!b) return; let s = b.querySelector('.rsp-b'); if (!n) { if (s) s.remove(); return; } if (!s) { s = document.createElement('span'); s.className = 'rsp-b'; s.style.cssText = 'margin-left:auto;background:' + cor + ';color:#fff;border-radius:99px;padding:0 7px;font-size:11px;font-weight:800;line-height:18px'; b.appendChild(s); } s.textContent = n; };
  pon('#/eq/resp', c.novasR, '#c0583f'); pon('#/eq/mdisc', c.imp + c.atr, '#b5731a'); }
async function iniciarGestor(){ try { await carregar(); badges(); vigiar(); } catch(_){} }
function faixaInicio(){ const c = contar(); if (!c.novasR && !c.imp && !c.atr) return '';
  return `<div class="cartao rsp-fx" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:10px 14px;margin-bottom:12px;border-left:4px solid #c0583f">${c.novasR ? `<button class="btn borda peq" data-ir="#/eq/resp"><b>${c.novasR}</b>&nbsp;resposta${c.novasR > 1 ? 's' : ''} nova${c.novasR > 1 ? 's' : ''} do RH</button>` : ''}${c.imp ? `<button class="btn borda peq" data-ir="#/eq/mdisc"><b>${c.imp}</b>&nbsp;documento${c.imp > 1 ? 's' : ''} para imprimir</button>` : ''}${c.atr ? `<button class="btn peq" data-ir="#/eq/mdisc" style="background:#a3301c;color:#fff"><b>${c.atr}</b>&nbsp;documento${c.atr > 1 ? 's' : ''} fora do prazo</button>` : ''}</div>`; }
function porFaixa(){ const c = $('#gs-corpo'); if (!c || document.querySelector('.rsp-fx')) return; const h = faixaInicio(); if (!h) return; c.insertAdjacentHTML('afterbegin', h); c.querySelectorAll('.rsp-fx [data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir); }

/* ---------- anexos (foto reduzida ou PDF), guardados junto da resposta/documento ---------- */
async function lerAnexos(files){ const out = [];
  for (const f of [...(files || [])]) {
    if (/^image\//.test(f.type)) { const url = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
      const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; }); const k = Math.min(1, 1800 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      out.push({ nome:f.name.replace(/\.[^.]+$/, '') + '.jpg', tipo:'image/jpeg', data:c.toDataURL('image/jpeg', .82) }); }
    else { if (f.size > 6 * 1024 * 1024) throw new Error('O arquivo ' + f.name + ' passa de 6 MB.'); const data = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); }); out.push({ nome:f.name, tipo:f.type || 'application/octet-stream', data }); } }
  return out; }
window.CRV_RESP_LER_ANEXOS = lerAnexos;
const b64Blob = (dataUrl, tipo) => { const s = String(dataUrl).split(',').pop(), bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type:tipo || (String(dataUrl).match(/^data:([^;]+)/) || [])[1] || 'application/octet-stream' }); };
function abrirArquivo(a){ const u = URL.createObjectURL(b64Blob(a.data, a.tipo)); const w = window.open(u, '_blank'); if (!w) baixar(b64Blob(a.data, a.tipo), a.nome); setTimeout(() => URL.revokeObjectURL(u), 120000); }

/* ---------- publicar o documento emitido no painel Sanções (chamado pelo painel) ---------- */
window.CRV_GDOC_PUB = async function(d, bytes, nome){
  try { const Q = window.CRV_QUADRO ? await window.CRV_QUADRO() : null; const c = Q && Q.mapa && Q.mapa[String(d.mat).replace(/^0+(?=\d)/, '')];
    if (!c) return { ok:false, erro:'Matrícula fora do Quadro: o documento não foi para o gestor.' };
    const chaves = [c.area ? 'a:' + c.area : '', c.area && c.setor ? 'd:' + c.area + '|' + c.setor : ''].filter(Boolean);
    let b = ''; const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes); for (let i = 0; i < u8.length; i += 32768) b += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
    const prazo = await prazoCfg();
    const row = { id:(crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2)), status:'disponivel', hist:[], recusa:false, criado_em:new Date().toISOString(), atualizado_em:new Date().toISOString(), chaves, area_nome:c.setor || c.area || '', mat:String(d.mat), colaborador:d.nome || c.nome, tipo:d.tipo, titulo:(d.junto ? TIPO_DOC[d.tipo] + ' e Orientação' : TIPO_DOC[d.tipo]) || d.titulo,
      dados:{ assunto:d.assunto || d.oAss || '', data:d.data, dias:d.dias || '', ini:d.ini || '', fim:d.fim || '', ret:d.ret || '', func:d.func || '', dep:d.dep || '' }, pdf:'data:application/pdf;base64,' + btoa(b), nome_arq:nome, prazo, criado_por:quem() };
    const { error } = await sb.from('gestor_docs').insert(row); if (error) return { ok:false, erro:semBanco(error) ? 'Para o documento aparecer para o gestor, rode o arquivo 12_respostas_rh.sql no Supabase.' : traduzErro(error) };
    /* documento corrigido: o anterior (com correção pedida) fica como substituído */
    try { const { data:V } = await sb.from('gestor_docs').select('id,hist').eq('mat', String(d.mat)).eq('tipo', d.tipo).eq('status', 'correcao');
      for (const v of (V || [])) await sb.from('gestor_docs').update({ status:'substituido', atualizado_em:new Date().toISOString(), hist:(v.hist || []).concat([{ em:new Date().toISOString(), por:quem(), acao:'substituido' }]) }).eq('id', v.id); } catch(_){}
    recarregar(); return { ok:true };
  } catch(e){ return { ok:false, erro:e.message || String(e) }; } };
let _prazo = null;
async function prazoCfg(){ if (_prazo != null) return _prazo; try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/gdocs').maybeSingle(); _prazo = (data && +data.dados.prazo) || 2; } catch(_){ _prazo = 2; } return _prazo; }

/* ---------- tela do gestor: Respostas do RH ---------- */
const CSS = `.rsp-f{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}.rsp-f select,.rsp-f input{padding:7px 9px;border:1px solid var(--line,#d5dbe6);border-radius:8px;font:inherit;background:#fff}
.rsp-l{display:flex;flex-direction:column;gap:10px}.rsp-i{background:#fff;border:1px solid #e3e6ec;border-radius:12px;padding:12px 14px;border-left:4px solid var(--c,#2f6fa8)}
.rsp-i.nova{box-shadow:0 0 0 2px color-mix(in srgb,#c0583f 35%,transparent)}.rsp-h{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.rsp-h .sp{flex:1}.rsp-n{font-weight:800;color:#14213d}.rsp-m{color:#5d6a85;font-size:12.5px}
.rsp-b2{margin-top:6px;font-size:13.5px;color:#28324a;line-height:1.5}.rsp-a{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.rsp-sus{margin-top:8px;background:#fff1d6;border:1px solid #f0c98a;border-radius:10px;padding:8px 12px;font-size:13.5px;color:#5c3b00}
.rsp-al{margin-top:8px;background:#fdecea;border:1px solid #f3b7ae;border-radius:10px;padding:7px 12px;font-size:13px;color:#8f1d12;font-weight:600}.rsp-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:12px}
.rsp-k button{background:#fff;border:1px solid #e3e6ec;border-top:4px solid var(--c);border-radius:12px;padding:10px 12px;text-align:left;cursor:pointer;font:inherit}.rsp-k button b{display:block;font-size:24px;color:var(--c)}.rsp-k button.on{box-shadow:0 0 0 2px var(--c)}
.rsp-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #e4e7ec;margin:0 0 14px}.rsp-tabs button{background:none;border:0;padding:9px 12px;font:inherit;font-weight:700;color:#5d6a85;cursor:pointer;border-bottom:3px solid transparent}.rsp-tabs button.on{color:#14213d;border-color:#2e7d4f}
.rsp-t{width:100%;border-collapse:collapse;font-size:13px}.rsp-t th{text-align:left;font-size:11px;text-transform:uppercase;color:#667085;padding:7px;border-bottom:2px solid #e4e7ec}.rsp-t td{padding:7px;border-top:1px solid #eef0f4;vertical-align:top}.rsp-t tr.atr td{background:#fff6f4}`;
const css = () => { if (!document.getElementById('rsp-css')) { const s = document.createElement('style'); s.id = 'rsp-css'; s.textContent = CSS; document.head.appendChild(s); } };
const resumoEnv = e => { const d = e.dados || {};
  if (e.tipo === 'ferias') return (d.parcelas || []).map(x => brD(x.inicio) + ' (' + x.dias + 'd)').join(' + ') + (d.abono ? ' + abono 10d' : '');
  if (e.tipo === 'sancao') return ({ ori:'Orientação', adv:'Advertência', sus:'Suspensão' }[d.tipo] || d.tipo || '') + (d.assunto ? ' · ' + d.assunto : '');
  if (e.tipo === 'perfil') return (d.acoes || []).join(', ');
  return (d.etapaT || '') + (d.decisao ? ': ' + d.decisao : ''); };
/* lista unificada: respostas aos envios + documentos disciplinares liberados */
function itensResp(){ return ENVS.map(e => ({ k:'e', id:e.id, data:e.rh_em || e.criado_em, mat:e.mat, nome:e.colaborador || '', tipo:e.tipo, assunto:(TIPO_ENV[e.tipo] || e.tipo) + (resumoEnv(e) ? ' · ' + resumoEnv(e) : ''), status:e.status === 'aceito' ? 'Aceito' : 'Devolvido', resp:e.rh_obs || (e.status === 'aceito' ? 'Aceito pelo RH.' : ''), nova:!e.lido_em, lido:e.lido_em ? dh(e.lido_em) + (e.lido_por ? ' por ' + tc(e.lido_por) : '') : '', area:'', por:e.rh_por || '', autor:e.autor_nome || '' }))
  .concat(DOCS.filter(d => d.status !== 'cancelado').map(d => ({ k:'d', id:d.id, data:d.criado_em, mat:d.mat, nome:d.colaborador || '', tipo:'doc', assunto:'Medida disciplinar · ' + (d.titulo || TIPO_DOC[d.tipo] || '') + (d.dados && d.dados.assunto ? ' · ' + d.dados.assunto : ''), status:(ST[d.status] || [d.status])[0], resp:'Documento pronto para imprimir na aba Medidas disciplinares.', nova:!visto(d), lido:visto(d) ? dh((d.hist.find(h => h.acao === 'visto') || {}).em) + ' por ' + tc((d.hist.find(h => h.acao === 'visto') || {}).por) : '', area:d.area_nome || '' })))
  .sort((a, b) => String(b.data).localeCompare(String(a.data))); }
async function telaResp(rh){
  css(); const F = { tipo:'', st:'', q:'' };
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">${rh ? 'Central de Rotinas do RH' : 'Atendimento e Ouvidoria'}</div><h1>Respostas do RH</h1><div class="ini-data">${rh ? 'Tudo o que o RH respondeu aos gestores e assistentes de todas as áreas' : 'Tudo o que o RH respondeu às solicitações da sua área, com a matrícula do colaborador'}</div></div></section><div id="rsp-c"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  await carregar(); vigiar(); badges();
  const des = () => { const c = $('#rsp-c'); if (!c) return; const L0 = itensResp(), q = nrm(F.q);
    const L = L0.filter(x => (!F.tipo || x.tipo === F.tipo) && (!F.st || (F.st === 'nova' ? x.nova : F.st === 'lida' ? !x.nova : x.status === F.st)) && (!q || nrm(x.nome + ' ' + x.mat).includes(q)));
    c.innerHTML = avisoBanco() + `<div class="rsp-f"><select id="rf-t"><option value="">Todos os tipos</option>${Object.entries(TIPO_ENV).map(([k, t]) => `<option value="${k}" ${F.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <select id="rf-s"><option value="">Todas as situações</option>${[['nova', 'Novas (não abertas)'], ['lida', 'Já abertas'], ['Aceito', 'Aceitos'], ['Devolvido', 'Devolvidos']].concat(Object.values(ST).map(s => [s[0], s[0]])).map(([k, t]) => `<option value="${esc(k)}" ${F.st === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      <input id="rf-q" type="search" placeholder="Colaborador ou matrícula" value="${esc(F.q)}" style="flex:1;min-width:200px"><span style="color:#5d6a85;font-size:13px">${L.length} de ${L0.length} · ${L0.filter(x => x.nova).length} nova(s)</span></div>
      <div class="rsp-l">${L.map(x => `<div class="rsp-i ${x.nova ? 'nova' : ''}" style="--c:${x.k === 'd' ? '#b5731a' : x.status === 'Devolvido' ? '#a3301c' : '#2e7d4f'}"><div class="rsp-h">${x.nova ? chip('Nova', '#c0583f') : ''}<span class="rsp-n">${esc(tc(x.nome))}</span><span class="rsp-m">Mat. ${esc(x.mat)}${x.area ? ' · ' + esc(tc(x.area)) : ''}</span><span class="sp"></span><span class="rsp-m">${esc(dh(x.data))}</span></div>
        <div class="rsp-b2"><b>${esc(x.assunto)}</b></div><div class="rsp-b2">${chip(x.status, x.k === 'd' ? '#b5731a' : x.status === 'Devolvido' ? '#a3301c' : '#2e7d4f')} ${esc(x.resp)}</div>
        <div class="rsp-a"><button class="btn borda peq" data-ab="${x.k}|${esc(x.id)}">${x.k === 'd' ? 'Ver documento' : 'Abrir resposta'}</button><span class="rsp-m" style="align-self:center">${x.lido ? 'Lida em ' + esc(x.lido) : 'Ainda não aberta'}${rh && x.autor ? ' · enviado por ' + esc(tc(x.autor)) : ''}</span></div></div>`).join('') || '<div class="cartao vazio"><p>Nenhuma resposta com esses filtros.</p></div>'}</div>`;
    c.querySelector('#rf-t').onchange = e => { F.tipo = e.target.value; des(); }; c.querySelector('#rf-s').onchange = e => { F.st = e.target.value; des(); };
    const qi = c.querySelector('#rf-q'); qi.oninput = () => { F.q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { des(); const e = $('#rf-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 300); };
    c.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { const [k, id] = b.dataset.ab.split('|'); if (k === 'd') { location.hash = rh ? '#/respostas/docs' : '#/eq/mdisc'; return; } abrirResp(ENVS.find(e => e.id === id), rh); }); };
  TELA = { h:rh ? '#/respostas' : '#/eq/resp', des }; des();
}
async function abrirResp(e, rh){ if (!e) return;
  let anx = []; try { const { data } = await sb.from('gestor_envios').select('rh_anexos').eq('id', e.id).maybeSingle(); anx = (data && data.rh_anexos) || []; } catch(_){}
  if (!rh && !e.lido_em) { try { const { error } = await sb.rpc('marcar_envio_lido', { p_id:e.id }); if (!error) { e.lido_em = new Date().toISOString(); e.lido_por = quem(); badges(); if (TELA) TELA.des(); } } catch(_){} }
  abrirModal({ titulo:(TIPO_ENV[e.tipo] || e.tipo) + ' · ' + tc(e.colaborador || e.mat), largo:true,
    corpo:`<p style="margin-top:0"><b>${esc(tc(e.colaborador || ''))}</b> · matrícula <b>${esc(e.mat)}</b></p><p>${esc(resumoEnv(e))}</p>
      <div style="background:${e.status === 'aceito' ? '#eef7f1' : '#fdecea'};border-radius:10px;padding:10px 14px"><b>${e.status === 'aceito' ? 'Aceito pelo RH' : 'Devolvido pelo RH'}</b> em ${esc(dh(e.rh_em))}<br>${esc(e.rh_obs || (e.status === 'aceito' ? 'Sem observação.' : ''))}</div>
      ${anx.length ? `<p style="margin:12px 0 4px"><b>Anexos do RH</b></p>${anx.map((a, i) => `<button class="btn borda peq" data-anx="${i}" style="margin:0 6px 6px 0">${esc(a.nome)}</button>`).join('')}` : ''}
      <p style="color:#5d6a85;font-size:12.5px">Enviado em ${esc(dh(e.criado_em))}${e.autor_nome ? ' por ' + esc(tc(e.autor_nome)) : ''}${e.lido_em ? ' · lida em ' + esc(dh(e.lido_em)) + (e.lido_por ? ' por ' + esc(tc(e.lido_por)) : '') : ''}</p>`,
    pe:`<span style="flex:1"></span><button class="btn prim" id="ra-x">Fechar</button>`,
    aoAbrir: m => { m.querySelector('#ra-x').onclick = fecharModal; m.querySelectorAll('[data-anx]').forEach(b => b.onclick = () => abrirArquivo(anx[+b.dataset.anx])); } });
}

/* ---------- medidas disciplinares (gestor imprime e acompanha; RH acompanha tudo) ---------- */
async function pdfDoc(d){ const { data, error } = await sb.from('gestor_docs').select('pdf,nome_arq').eq('id', d.id).maybeSingle(); if (error || !data || !data.pdf) throw new Error('Documento não encontrado.'); return { blob:b64Blob(data.pdf, 'application/pdf'), nome:data.nome_arq || 'documento.pdf' }; }
async function acao(d, ac, dados){ const { error } = await sb.rpc('gdoc_acao', { p_id:d.id, p_acao:ac, p_dados:dados || {} }); if (error) throw error; }
async function acaoRH(d, campos, ac, dados){ const hist = (d.hist || []).concat([{ em:new Date().toISOString(), por:quem(), acao:ac, dados:dados || {} }]);
  const { error } = await sb.from('gestor_docs').update(Object.assign({ atualizado_em:new Date().toISOString(), hist }, campos)).eq('id', d.id); if (error) throw error; }
function cardDoc(d, rh){ const s = ST[d.status] || [d.status, '#5d6a85'], p = parado(d), at = atrasado(d), su = alertaSus(d), dd = d.dados || {};
  return `<div class="rsp-i ${!rh && !visto(d) && ABERTOS.includes(d.status) ? 'nova' : ''}" style="--c:${s[1]}"><div class="rsp-h">${!rh && !visto(d) && ABERTOS.includes(d.status) ? chip('Novo', '#c0583f') : ''}${chip(d.titulo || TIPO_DOC[d.tipo] || d.tipo, d.tipo === 'sus' ? '#a3301c' : d.tipo === 'adv' ? '#b5731a' : '#2f6fa8')}<span class="rsp-n">${esc(tc(d.colaborador))}</span><span class="rsp-m">Mat. ${esc(d.mat)}${d.area_nome ? ' · ' + esc(tc(d.area_nome)) : ''}</span><span class="sp"></span>${chip(s[0], s[1])}</div>
    <div class="rsp-b2">${dd.assunto ? '<b>' + esc(dd.assunto) + '</b> · ' : ''}fato em ${esc(brD(dd.data))} · liberado em ${esc(dh(d.criado_em))}${d.aplicado_em ? ' · aplicado em <b>' + esc(brD(d.aplicado_em)) + '</b>' : ''}${d.recebido_em ? ' · recebido pelo RH em ' + esc(dh(d.recebido_em)) : ''}</div>
    ${d.tipo === 'sus' && dd.ini ? `<div class="rsp-sus"><b>Suspensão de ${esc(dd.dias || '?')} dia(s): ${esc(brD(dd.ini))}${dd.fim && dd.fim !== dd.ini ? ' a ' + esc(brD(dd.fim)) : ''}</b>${dd.ret ? ' · retorno: ' + esc(/^\d{4}-/.test(dd.ret) ? brD(dd.ret) : dd.ret) : ''}</div>` : ''}
    ${su ? `<div class="rsp-al">${esc(su)}</div>` : ''}${at ? `<div class="rsp-al">Parado há ${p.dias} dia(s) úteis (${esc(p.motivo)}). O prazo é de ${d.prazo || 2} dia(s) úteis.</div>` : p && d.status !== 'correcao' ? `<div class="rsp-m" style="margin-top:6px">${p.dias} dia(s) útil(eis) ${esc(p.motivo)} · prazo de ${d.prazo || 2}</div>` : ''}
    ${d.recusa ? `<div class="rsp-sus" style="background:#f1e8f8;border-color:#d7bce9;color:#4a2470"><b>Recusa de assinatura:</b> o documento precisa da assinatura de 2 testemunhas (nome e matrícula/CPF).${(d.testemunhas || []).filter(t => t && t.nome).length ? '<br>' + d.testemunhas.filter(t => t && t.nome).map(t => esc(tc(t.nome)) + (t.doc ? ' (' + esc(t.doc) + ')' : '')).join(' · ') : ''}</div>` : ''}
    ${d.status === 'correcao' ? `<div class="rsp-al" style="background:#fff7e6;border-color:#f0d199;color:#5c3b00">Correção pedida: ${esc(d.correcao || '')}${rh ? ' — emita o documento corrigido no painel Sanções; este fica como substituído.' : ' — aguardando o RH.'}</div>` : ''}
    <div class="rsp-a"><button class="btn prim peq" data-imp="${d.id}">Imprimir</button>
      ${!rh && ['disponivel', 'impresso'].includes(d.status) ? `<button class="btn borda peq" data-apl="${d.id}">Marcar aplicado</button>` : ''}
      ${!rh && d.status === 'aplicado' ? `<button class="btn borda peq" data-ent="${d.id}">Entregue ao RH</button>` : ''}
      ${!rh && ABERTOS.includes(d.status) && d.status !== 'correcao' ? `<button class="btn borda peq" data-rec="${d.id}">Recusa de assinatura</button><button class="btn borda peq" data-cor="${d.id}" style="color:#a3301c">Solicitar correção ao RH</button>` : ''}
      ${rh && ABERTOS.includes(d.status) ? `<button class="btn borda peq" data-rcb="${d.id}" style="color:#2e7d4f">Recebido pelo RH</button>${d.status !== 'aplicado' && d.status !== 'entregue' ? `<button class="btn borda peq" data-apl="${d.id}">Marcar aplicado</button>` : ''}${d.status === 'correcao' ? '<button class="btn borda peq" data-san="1">Abrir Sanções para corrigir</button>' : ''}<button class="btn borda peq" data-can="${d.id}">Cancelar</button>` : ''}
      ${d.status === 'recebido' ? `<button class="btn borda peq" data-anx="${d.id}">Ver documento assinado</button>` : ''}
      <button class="link" data-hst="${d.id}" style="align-self:center">histórico</button></div></div>`; }
function ligarDocs(c, rh, des){ const ach = id => DOCS.find(x => x.id === id); const err = e => toast(traduzErro(e), true);
  c.querySelectorAll('[data-imp]').forEach(b => b.onclick = async () => { const d = ach(b.dataset.imp); b.disabled = true;
    try { const { blob, nome } = await pdfDoc(d); const u = URL.createObjectURL(blob); const w = window.open(u, '_blank'); if (!w) baixar(blob, nome); setTimeout(() => URL.revokeObjectURL(u), 120000);
      if (!rh && d.status === 'disponivel') { await acao(d, 'impresso'); } if (!rh && !visto(d)) await acao(d, 'visto').catch(() => {}); await carregar(); badges(); des(); } catch(e){ err(e); } b.disabled = false; });
  c.querySelectorAll('[data-apl]').forEach(b => b.onclick = () => { const d = ach(b.dataset.apl);
    abrirModal({ titulo:'Aplicado · ' + tc(d.colaborador), corpo:`<div id="ap-m"></div><div class="campo"><label>Data em que o documento foi aplicado ao colaborador</label><input type="date" id="ap-d" value="${hojeISO()}"></div>`, pe:'<button class="btn borda" id="ap-c">Cancelar</button><button class="btn prim" id="ap-ok">Salvar</button>',
      aoAbrir: () => { $('#ap-c').onclick = fecharModal; $('#ap-ok').onclick = async () => { const dt = $('#ap-d').value; if (!dt) return; try { if (rh) await acaoRH(d, { status:'aplicado', aplicado_em:dt }, 'aplicado', { data:dt }); else await acao(d, 'aplicado', { data:dt }); fecharModal(); toast('Marcado como aplicado.'); await carregar(); badges(); des(); } catch(e){ $('#ap-m').innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; } }; } }); });
  c.querySelectorAll('[data-ent]').forEach(b => b.onclick = async () => { const d = ach(b.dataset.ent); try { await acao(d, 'entregue'); toast('Marcado como entregue ao RH.'); await carregar(); badges(); des(); } catch(e){ err(e); } });
  c.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => { const d = ach(b.dataset.rec), T = d.testemunhas || [{}, {}];
    abrirModal({ titulo:'Recusa de assinatura · ' + tc(d.colaborador), corpo:`<div id="rc-m"></div><p style="margin-top:0">O colaborador se recusou a assinar. O documento deve ter a assinatura de <b>2 testemunhas</b>, com nome e matrícula ou CPF.</p>${[0, 1].map(i => `<div style="display:flex;gap:8px;flex-wrap:wrap"><div class="campo" style="flex:2;min-width:200px"><label>Testemunha ${i + 1} · nome</label><input id="rc-n${i}" value="${esc((T[i] || {}).nome || '')}"></div><div class="campo" style="flex:1;min-width:140px"><label>Matrícula ou CPF</label><input id="rc-d${i}" value="${esc((T[i] || {}).doc || '')}"></div></div>`).join('')}`,
      pe:'<button class="btn borda" id="rc-c">Cancelar</button><button class="btn prim" id="rc-ok">Salvar</button>',
      aoAbrir: () => { $('#rc-c').onclick = fecharModal; $('#rc-ok').onclick = async () => { const t = [0, 1].map(i => ({ nome:$('#rc-n' + i).value.trim(), doc:$('#rc-d' + i).value.trim() })); if (t.some(x => !x.nome || !x.doc)) { $('#rc-m').innerHTML = '<div class="erro">Preencha nome e matrícula/CPF das 2 testemunhas.</div>'; return; }
        try { await acao(d, 'recusa', { testemunhas:t }); fecharModal(); toast('Recusa registrada.'); await carregar(); des(); } catch(e){ $('#rc-m').innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; } }; } }); });
  c.querySelectorAll('[data-cor]').forEach(b => b.onclick = () => { const d = ach(b.dataset.cor);
    abrirModal({ titulo:'Solicitar correção ao RH', corpo:`<div id="co-m"></div><p style="margin-top:0">${esc(d.titulo || '')} · ${esc(tc(d.colaborador))} (mat. ${esc(d.mat)}). Você não altera o texto: o RH corrige e libera o documento novo aqui.</p><div class="campo"><label>Qual é o erro?</label><textarea id="co-t" rows="4" maxlength="800" style="width:100%"></textarea></div>`,
      pe:'<button class="btn borda" id="co-c">Cancelar</button><button class="btn prim" id="co-ok">Enviar ao RH</button>',
      aoAbrir: () => { $('#co-c').onclick = fecharModal; $('#co-ok').onclick = async () => { const t = $('#co-t').value.trim(); if (t.length < 5) { $('#co-m').innerHTML = '<div class="erro">Descreva o erro.</div>'; return; } try { await acao(d, 'correcao', { texto:t }); fecharModal(); toast('Pedido de correção enviado ao RH.'); await carregar(); badges(); des(); } catch(e){ $('#co-m').innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; } }; } }); });
  c.querySelectorAll('[data-rcb]').forEach(b => b.onclick = () => { const d = ach(b.dataset.rcb);
    abrirModal({ titulo:'Recebido pelo RH · ' + tc(d.colaborador), corpo:`<div id="rb-m"></div><p style="margin-top:0">${esc(d.titulo || '')} · mat. ${esc(d.mat)}${d.aplicado_em ? ' · aplicado em ' + esc(brD(d.aplicado_em)) : ''}</p><div class="campo"><label>Documento assinado (foto ou PDF) · fica no histórico do colaborador</label><input type="file" id="rb-f" accept="image/*,application/pdf"></div>${d.aplicado_em ? '' : '<div class="campo"><label>Data da aplicação</label><input type="date" id="rb-ap"></div>'}`,
      pe:'<button class="btn borda" id="rb-c">Cancelar</button><button class="btn prim" id="rb-ok">Marcar como recebido</button>',
      aoAbrir: () => { $('#rb-c').onclick = fecharModal; $('#rb-ok').onclick = async () => { const bt = $('#rb-ok'); bt.disabled = true;
        try { const A = await lerAnexos($('#rb-f').files); const ap = $('#rb-ap') ? $('#rb-ap').value : '';
          await acaoRH(d, Object.assign({ status:'recebido', recebido_em:new Date().toISOString(), recebido_por:quem() }, A.length ? { anexo:A[0] } : {}, ap ? { aplicado_em:ap } : {}), 'recebido', { anexo:A.length ? A[0].nome : '' });
          fecharModal(); toast('Recebido pelo RH' + (A.length ? ', com o documento assinado guardado.' : '.')); await carregar(); des(); } catch(e){ bt.disabled = false; $('#rb-m').innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; } }; } }); });
  c.querySelectorAll('[data-can]').forEach(b => b.onclick = async () => { const d = ach(b.dataset.can); if (!confirm('Cancelar este documento? Ele sai da lista do gestor.')) return; try { await acaoRH(d, { status:'cancelado' }, 'cancelado'); await carregar(); des(); } catch(e){ err(e); } });
  c.querySelectorAll('[data-san]').forEach(b => b.onclick = () => location.hash = '#/p/sancoes/doc');
  c.querySelectorAll('[data-anx]').forEach(b => b.onclick = async () => { const { data } = await sb.from('gestor_docs').select('anexo').eq('id', b.dataset.anx).maybeSingle(); if (data && data.anexo) abrirArquivo(data.anexo); else toast('O RH recebeu sem anexar o documento assinado.', true); });
  c.querySelectorAll('[data-hst]').forEach(b => b.onclick = () => { const d = ach(b.dataset.hst); const N = { visto:'Aberto pela área', impresso:'Impresso', aplicado:'Aplicado', entregue:'Entregue ao RH', recusa:'Recusa de assinatura', correcao:'Correção pedida', recebido:'Recebido pelo RH', cancelado:'Cancelado', substituido:'Substituído pelo documento corrigido' };
    abrirModal({ titulo:'Histórico · ' + (d.titulo || '') + ' · ' + tc(d.colaborador), corpo:`<table class="rsp-t"><thead><tr><th>Quando</th><th>O quê</th><th>Quem</th><th>Detalhe</th></tr></thead><tbody><tr><td>${esc(dh(d.criado_em))}</td><td>Liberado para a área</td><td></td><td></td></tr>${(d.hist || []).map(h => `<tr><td>${esc(dh(h.em))}</td><td>${esc(N[h.acao] || h.acao)}</td><td>${esc(tc(h.por || ''))}</td><td>${esc(h.dados ? (h.dados.data ? brD(h.dados.data) : h.dados.texto || '') : '')}</td></tr>`).join('')}</tbody></table>`, pe:'<span style="flex:1"></span><button class="btn prim" id="hs-x">Fechar</button>', aoAbrir: () => $('#hs-x').onclick = fecharModal }); });
}
async function telaDocsGestor(){
  css(); const F = { st:'abertos', q:'' };
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Ocorrências e Relações Trabalhistas</div><h1>Medidas disciplinares</h1><div class="ini-data">Orientações, advertências e suspensões emitidas pelo RH para a sua área: imprima, aplique e devolva assinado ao RH</div></div></section><div id="rsp-c"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  await carregar(); vigiar(); badges();
  /* abriu a tela: os documentos novos deixam de aparecer como "Novo" no menu */
  DOCS.filter(d => ABERTOS.includes(d.status) && !visto(d)).forEach(d => acao(d, 'visto').catch(() => {}));
  const des = () => { const c = $('#rsp-c'); if (!c) return; const q = nrm(F.q);
    const fil = d => F.st === 'abertos' ? ABERTOS.includes(d.status) : F.st === 'atr' ? atrasado(d) : F.st ? d.status === F.st : d.status !== 'cancelado';
    const L = DOCS.filter(d => fil(d) && (!q || nrm(d.colaborador + ' ' + d.mat).includes(q)));
    const K = [['abertos', 'Em andamento', DOCS.filter(d => ABERTOS.includes(d.status)).length, '#2f6fa8'], ['disponivel', 'Para imprimir', DOCS.filter(d => d.status === 'disponivel').length, '#7b3fa0'], ['aplicado', 'Aplicados, falta devolver', DOCS.filter(d => d.status === 'aplicado').length, '#b5731a'], ['atr', 'Fora do prazo', DOCS.filter(atrasado).length, '#a3301c'], ['recebido', 'Recebidos pelo RH', DOCS.filter(d => d.status === 'recebido').length, '#2e7d4f']];
    c.innerHTML = avisoBanco() + `<div class="rsp-k">${K.map(([k, t, n, cor]) => `<button data-k="${k}" class="${F.st === k ? 'on' : ''}" style="--c:${cor}"><b>${n}</b>${t}</button>`).join('')}</div>
      <div class="rsp-f"><input id="rf-q" type="search" placeholder="Colaborador ou matrícula" value="${esc(F.q)}" style="flex:1;min-width:200px"><button class="btn borda peq" data-k="">Ver todos</button></div>
      <div class="rsp-l">${L.map(d => cardDoc(d, false)).join('') || '<div class="cartao vazio"><p>Nenhum documento aqui.</p></div>'}</div>
      <p class="nr-fonte">O texto do documento não pode ser alterado aqui. Se encontrar erro, use "Solicitar correção ao RH". Prazo para aplicar e para devolver assinado: ${(DOCS[0] && DOCS[0].prazo) || 2} dia(s) úteis.</p>`;
    c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { F.st = F.st === b.dataset.k ? '' : b.dataset.k; des(); });
    const qi = c.querySelector('#rf-q'); qi.oninput = () => { F.q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { des(); const e = $('#rf-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 300); };
    ligarDocs(c, false, des); };
  TELA = { h:'#/eq/mdisc', des }; des();
}

/* ---------- RH: respostas, documentos e pendentes de devolução ---------- */
async function gestoresDe(){ try { const { data } = await sb.from('perfis').select('nome,areas,ativo,papel,frentes').eq('papel', 'gestor'); return (data || []).filter(u => u.ativo); } catch(_){ return []; } }
async function telaRH(aba){
  aba = aba || 'pend'; if (aba === 'resp') return telaResp(true);
  css(); const F = { q:'', st:'' };
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Central de Rotinas do RH</div><h1>Documentos com os gestores</h1><div class="ini-data">Medidas disciplinares liberadas às áreas: andamento, pendentes de devolução e documentos assinados</div></div></section>
    <nav class="rsp-tabs">${[['pend', 'Pendentes de devolução'], ['docs', 'Todos os documentos'], ['resp', 'Respostas aos gestores']].map(([k, t]) => `<button data-tab="${k}" class="${aba === k ? 'on' : ''}">${t}</button>`).join('')}</nav><div id="rsp-c"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => location.hash = '#/respostas/' + b.dataset.tab);
  await carregar(); vigiar(); const G = await gestoresDe(); const prazo = await prazoCfg(); const central = await souCentral();
  const gestDe = d => G.filter(u => (u.areas || []).some(a => (d.chaves || []).includes(a))).map(u => tc(u.nome) + ((u.frentes || []).some(f => /^assist:/.test(f)) ? ' (assist.)' : '')).join(', ');
  const des = () => { const c = $('#rsp-c'); if (!c) return; const q = nrm(F.q);
    const base = aba === 'pend' ? DOCS.filter(d => ABERTOS.includes(d.status)) : DOCS;
    const L = base.filter(d => (!F.st || (F.st === 'atr' ? atrasado(d) : d.status === F.st)) && (!q || nrm(d.colaborador + ' ' + d.mat + ' ' + (d.area_nome || '')).includes(q)));
    c.innerHTML = avisoBanco() + `<div class="rsp-f"><input id="rf-q" type="search" placeholder="Colaborador, matrícula ou área" value="${esc(F.q)}" style="flex:1;min-width:200px">
      <select id="rf-s"><option value="">Todas as situações</option><option value="atr" ${F.st === 'atr' ? 'selected' : ''}>Fora do prazo</option>${Object.entries(ST).filter(([k]) => aba !== 'pend' || ABERTOS.includes(k)).map(([k, s]) => `<option value="${k}" ${F.st === k ? 'selected' : ''}>${s[0]}</option>`).join('')}</select>
      <span style="font-size:13px;color:#5d6a85">Prazo: ${central ? `<input id="rf-pz" type="number" min="1" max="30" value="${prazo}" style="width:60px"> dia(s) úteis` : prazo + ' dia(s) úteis'}</span><button class="btn borda" id="rf-x">Exportar</button></div>
      ${aba === 'pend' ? `<div class="cartao" style="padding:0;overflow:auto"><table class="rsp-t"><thead><tr><th>Colaborador</th><th>Documento</th><th>Área</th><th>Gestor / assistente</th><th>Situação</th><th>Parado há</th><th></th></tr></thead><tbody>
        ${L.slice().sort((a, b) => (parado(b) || {}).dias - (parado(a) || {}).dias).map(d => { const p = parado(d) || {}; return `<tr class="${atrasado(d) ? 'atr' : ''}"><td><b>${esc(tc(d.colaborador))}</b><br><small>Mat. ${esc(d.mat)}</small></td><td>${esc(d.titulo || '')}${d.tipo === 'sus' && d.dados && d.dados.ini ? '<br><small>' + esc(brD(d.dados.ini)) + (d.dados.fim && d.dados.fim !== d.dados.ini ? ' a ' + esc(brD(d.dados.fim)) : '') + '</small>' : ''}</td><td>${esc(tc(d.area_nome || ''))}</td><td>${esc(gestDe(d) || '—')}</td><td>${chip((ST[d.status] || [d.status])[0], (ST[d.status] || ['', '#5d6a85'])[1])}${d.recusa ? '<br><small>recusa de assinatura</small>' : ''}</td><td><b style="color:${atrasado(d) ? '#a3301c' : '#14213d'}">${p.dias || 0} dia(s) úteis</b><br><small>${esc(p.motivo || '')}</small></td><td><button class="btn borda peq" data-vd="${d.id}">abrir</button></td></tr>`; }).join('') || '<tr><td colspan="7" style="text-align:center;color:#8a94a8;padding:16px">Nada pendente.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="7"><b>Total: ${L.length} documento(s) · ${new Set(L.map(d => d.mat)).size} pessoa(s) · ${L.filter(atrasado).length} fora do prazo</b></td></tr></tfoot></table></div>`
      : `<div class="rsp-l">${L.map(d => cardDoc(d, true)).join('') || '<div class="cartao vazio"><p>Nenhum documento.</p></div>'}</div>`}`;
    const qi = c.querySelector('#rf-q'); qi.oninput = () => { F.q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { des(); const e = $('#rf-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 300); };
    c.querySelector('#rf-s').onchange = e => { F.st = e.target.value; des(); };
    const pz = c.querySelector('#rf-pz'); if (pz) pz.onchange = async () => { const v = Math.max(1, Math.min(30, +pz.value || 2)); try { await sb.from('registros').upsert({ painel:'quadro', caminho:'sistema/gdocs', colecao:'sistema', doc_id:'gdocs', dados:{ prazo:v, em:new Date().toISOString(), por:quem() }, atualizado_por:quem() }, { onConflict:'painel,caminho' }); _prazo = v;
      for (const d of DOCS.filter(x => ABERTOS.includes(x.status) && x.prazo !== v)) await sb.from('gestor_docs').update({ prazo:v }).eq('id', d.id); toast('Prazo alterado para ' + v + ' dia(s) úteis.'); await carregar(); des(); } catch(e){ toast(traduzErro(e), true); } };
    c.querySelector('#rf-x').onclick = () => exportar(L, gestDe);
    c.querySelectorAll('[data-vd]').forEach(b => b.onclick = () => { const d = DOCS.find(x => x.id === b.dataset.vd); abrirModal({ titulo:(d.titulo || '') + ' · ' + tc(d.colaborador), largo:true, corpo:`<div class="rsp-l" id="vd-c">${cardDoc(d, true)}</div>`, pe:'<span style="flex:1"></span><button class="btn prim" id="vd-x">Fechar</button>', aoAbrir: m => { m.querySelector('#vd-x').onclick = fecharModal; ligarDocs(m.querySelector('#vd-c'), true, () => { fecharModal(); des(); }); } }); });
    if (aba !== 'pend') ligarDocs(c, true, des); };
  TELA = { h:'#/respostas', des }; des();
}
async function souCentral(){ if (!ehAdmin()) return false; if ((E.perfil.frentes || []).includes('admin:central')) return true;
  try { const { data } = await sb.from('perfis').select('frentes,ativo').eq('papel', 'admin'); return !(data || []).some(u => u.ativo && (u.frentes || []).includes('admin:central')); } catch(_){ return true; } }
/* exportação: escolhe as colunas, ordem alfabética, total no fim */
function exportar(L, gestDe){
  const C = [['Colaborador', d => tc(d.colaborador)], ['Matrícula', d => d.mat], ['Documento', d => d.titulo || ''], ['Assunto', d => (d.dados || {}).assunto || ''], ['Área', d => tc(d.area_nome || '')], ['Gestor / assistente', d => gestDe(d)], ['Situação', d => (ST[d.status] || [d.status])[0]],
    ['Liberado em', d => dh(d.criado_em)], ['Aplicado em', d => brD(d.aplicado_em)], ['Parado há (dias úteis)', d => (parado(d) || {}).dias ?? ''], ['Fora do prazo', d => atrasado(d) ? 'Sim' : 'Não'], ['Recusa de assinatura', d => d.recusa ? 'Sim' : ''], ['Suspensão', d => d.tipo === 'sus' && d.dados && d.dados.ini ? brD(d.dados.ini) + (d.dados.fim ? ' a ' + brD(d.dados.fim) : '') : ''], ['Recebido pelo RH em', d => dh(d.recebido_em)]];
  const pad = [0, 1, 2, 4, 5, 6, 9];
  abrirModal({ titulo:'Exportar documentos com os gestores', corpo:`<p style="margin-top:0">${L.length} documento(s) da lista atual. Escolha as colunas:</p><div class="checks" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px">${C.map(([t], i) => `<label><input type="checkbox" value="${i}" ${pad.includes(i) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>`,
    pe:'<span style="flex:1"></span><button class="btn borda" id="ex-c">Cancelar</button><button class="btn borda" id="ex-x">Excel</button><button class="btn prim" id="ex-p">PDF</button>',
    aoAbrir: m => { m.querySelector('#ex-c').onclick = fecharModal;
      const sel = () => [...m.querySelectorAll('input:checked')].map(i => C[+i.value]); const O = L.slice().sort((a, b) => tc(a.colaborador).localeCompare(tc(b.colaborador), 'pt-BR'));
      const tot = () => 'Total: ' + O.length + ' documento(s) · ' + new Set(O.map(d => d.mat)).size + ' pessoa(s)';
      m.querySelector('#ex-x').onclick = () => { const S = sel(); if (!S.length) return; const A = [S.map(s => s[0])].concat(O.map(d => S.map(s => s[1](d)))); A.push([]); A.push([tot()]);
        const ws = XLSX.utils.aoa_to_sheet(A); ws['!cols'] = S.map(() => ({ wch:22 })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Documentos', { semTotal:true, semOrdem:true });
        baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Documentos com os gestores.xlsx'); fecharModal(); };
      m.querySelector('#ex-p').onclick = async () => { const S = sel(); if (!S.length) return; const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'mm', format:'a4', orientation:'landscape' }); const D = window.CRV_DOC;
        const y = D.titulo(doc, 'Medidas Disciplinares com os Gestores', 'Pendentes de devolução e andamento dos documentos liberados às áreas · prazo de ' + ((L[0] && L[0].prazo) || 2) + ' dia(s) úteis');
        doc.autoTable(Object.assign(D.estilo(), { startY:y, margin:D.margem, head:[S.map(s => s[0])], body:O.map(d => S.map(s => String(s[1](d) ?? ''))), foot:[[{ content:tot(), colSpan:S.length }]] }));
        D.moldura(doc); try { if (window.CRV_PDF_LOGOS) await window.CRV_PDF_LOGOS(doc); } catch(_){} baixar(doc.output('blob'), 'Documentos com os gestores.pdf'); fecharModal(); }; } });
}
/* Central de Rotinas: documentos parados além do prazo e correções pedidas */
async function pendencias(){ if (!ehRH()) return []; try { await carregar(); } catch(_){ return []; } const out = [];
  const A = DOCS.filter(atrasado); if (A.length) out.push({ id:'gdocs-atraso', sev:'crit', t:'Documentos disciplinares parados com os gestores', painel:'', rota:'#/respostas/pend', pnome:'Documentos com os gestores', d:'Passou do prazo de dias úteis sem aplicação ou sem devolução assinada ao RH. Cobre o gestor ou marque o andamento.',
    itens:A.map(d => ({ nome:tc(d.colaborador), mat:d.mat, det:(d.titulo || '') + ' · ' + (parado(d) || {}).motivo + ' há ' + (parado(d) || {}).dias + ' dia(s) úteis · ' + tc(d.area_nome || '') })) });
  const C = DOCS.filter(d => d.status === 'correcao'); if (C.length) out.push({ id:'gdocs-correcao', sev:'warn', t:'Correção pedida pelos gestores em documentos disciplinares', painel:'sancoes', pnome:'Sanções', d:'Emita o documento corrigido no painel Sanções: o anterior fica como substituído e o novo aparece para o gestor.',
    itens:C.map(d => ({ nome:tc(d.colaborador), mat:d.mat, det:(d.titulo || '') + ' · ' + (d.correcao || '') })) });
  return out; }
/* histórico do colaborador (Perfil do Colaborador) */
async function daPessoa(mat){ try { const { data } = await sb.from('gestor_docs').select('id,titulo,tipo,dados,status,aplicado_em,recebido_em,recusa,criado_em,area_nome').eq('mat', String(mat)).order('criado_em', { ascending:false }); return data || []; } catch(_){ return []; } }
window.CRV_GDOC_ANEXO = async id => { const { data } = await sb.from('gestor_docs').select('anexo').eq('id', id).maybeSingle(); if (data && data.anexo) abrirArquivo(data.anexo); else toast('Sem documento assinado anexado.', true); };
return { telaResp, telaDocsGestor, telaRH, iniciarGestor, porFaixa, badges, pendencias, daPessoa, ST, TIPO_DOC };
};
