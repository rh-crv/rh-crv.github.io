/* =====================================================================
   CADASTROS DO RH (Central de Rotinas → Cadastros)
   · Centros de custo e setores: nome oficial (do Quadro) e nomes equivalentes usados nas outras bases,
     para os painéis agruparem e conferirem pelo mesmo nome.
   · Assinantes dos documentos: quem assina cada documento (nome e cargo), num lugar só.
   · Quem pode fazer o quê: permissões de cada usuário por painel (só leitura, para conferência).
   Guardado em registros do Quadro: caminho 'sistema/cadastros'.
   Os painéis usam window.CRV_PADRAO e window.CRV_ASSINANTES (no app principal).
   ===================================================================== */
(function(){
'use strict';
const nrm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
/* documentos que usam o cadastro de assinantes (os demais têm a assinatura configurada no próprio painel) */
const DOCS = [
  { k:'acid-aut', n:'Unimed · Autorização para não descontar (acidente de trabalho)' },
  { k:'acid-rel', n:'Unimed · Relatório de acidentes de trabalho' },
  { k:'conv-folha', n:'Cartão Convênio · Lançamento em folha e desconto final' },
  { k:'acid-reemb', n:'Unimed · Reembolso de desconto indevido (acidente de trabalho)' },
  { k:'ferias-dp', n:'Férias · Relação de saídas de férias' },
  { k:'dispensa', n:'Desligamento · Documento de dispensa (aviso indenizado, trabalhado ou justa causa)' }
];
/* como está hoje nos documentos (pedidos do RH em 27/10/2026); muda pela tela de cadastros */
const ASS_PADRAO = [
  { id:'a1', nome:'Michelle Pereira', cargo:'Coordenadora de RH', mat:'', docs:['acid-aut', 'acid-rel', 'acid-reemb', 'conv-folha'] },
  { id:'a2', nome:'Leonardo Dias', cargo:'Gerente Executivo', mat:'', docs:['acid-aut', 'acid-rel', 'acid-reemb', 'conv-folha'] },
  { id:'a3', nome:'', cargo:'Coordenadora de RH', mat:'334', docs:['ferias-dp', 'dispensa'] }
];
/* datas liberadas para início de férias (calendário do RH: início do gozo e data de pagamento); muda pela tela de cadastros */
const FER0 = [['2026-11-03','2026-10-30'],['2026-11-16','2026-11-13'],['2026-12-01','2026-11-27'],['2026-12-21','2026-12-18'],['2027-01-04','2026-12-30'],['2027-01-18','2027-01-15'],['2027-02-01','2027-01-29'],['2027-02-15','2027-02-12'],['2027-03-01','2027-02-26']].map(([ini, pag]) => ({ ini, pag }));
let SB = null, CAD = null, _carregando = null;
async function carregar(forcar){
  if (CAD && !forcar) return CAD; if (_carregando && !forcar) return _carregando;
  _carregando = (async () => { let d = {}; try { const { data } = await SB.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/cadastros').maybeSingle(); d = (data && data.dados) || {}; } catch(_){}
    CAD = { sin:d.sin || {}, ccNome:d.ccNome || {}, ass:Array.isArray(d.ass) ? d.ass : ASS_PADRAO.map(a => Object.assign({}, a)), fer:Array.isArray(d.fer) ? d.fer : FER0.map(x => Object.assign({}, x)), em:d.em || '', por:d.por || '' }; return CAD; })();
  return _carregando;
}
async function salvarCad(nome){ const dados = Object.assign({}, CAD, { em:new Date().toISOString(), por:nome });
  const { error } = await SB.from('registros').upsert({ painel:'quadro', caminho:'sistema/cadastros', colecao:'sistema', doc_id:'cadastros', dados, atualizado_por:nome }, { onConflict:'painel,caminho' });
  if (error) throw error; CAD = dados; }
/* centros de custo e setores oficiais, a partir do Quadro Geral */
async function doQuadro(){ const Q = window.CRV_QUADRO ? await window.CRV_QUADRO() : null; const cc = new Map(), st = new Map();
  if (Q && Q.mapa) Object.entries(Q.mapa).forEach(([m, c]) => { const at = c.situacao !== 'Desligado';
    if (c.cc && c.cc !== '0') { if (!cc.has(c.cc)) cc.set(c.cc, { cod:c.cc, nomes:new Map(), at:0, tot:0, setores:new Map() }); const o = cc.get(c.cc); o.tot++; if (at) o.at++; if (c.ccd) o.nomes.set(c.ccd, (o.nomes.get(c.ccd) || 0) + 1); if (c.setor && at) o.setores.set(c.setor, (o.setores.get(c.setor) || 0) + 1); }
    if (c.setor) { const k = nrm(c.setor); if (!st.has(k)) st.set(k, { nome:c.setor, at:0, tot:0 }); const o = st.get(k); o.tot++; if (at) o.at++; } });
  cc.forEach(o => { o.nomeQ = [...o.nomes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ''; });
  return { cc, st, ok:!!(Q && Q.mapa) }; }
let _q = null; const quadro = async () => _q || (_q = await doQuadro());

/* API usada pelos painéis */
window.CRV_PADRAO = {
  carregar: async () => { await carregar(); await quadro(); return true; },
  /* nome oficial de um setor (ou o próprio nome, se não houver equivalência) */
  setor(n){ if (!n || !CAD) return n; const k = nrm(n); return CAD.sin[k] || (_q && _q.st.get(k) ? _q.st.get(k).nome : n); },
  /* centro de custo pelo código: { cod, nome, existe } — existe = está no Quadro ou no cadastro */
  cc(c){ c = String(c == null ? '' : c).trim(); if (!c) return null; const q = _q && _q.cc.get(c); const nome = (CAD && CAD.ccNome[c]) || (q && q.nomeQ) || '';
    return { cod:c, nome, existe:!!(q || (CAD && CAD.ccNome[c])) }; },
  temCadastro(){ return !!(_q && _q.ok && _q.cc.size); }
};
/* datas liberadas para início de férias: [{ ini, pag }] em ordem (usado pelo painel Férias e pelo gestor) */
window.CRV_FER_DATAS = async function(){ await carregar(); return (CAD.fer || []).filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.ini)).slice().sort((a, b) => a.ini.localeCompare(b.ini)); };
/* assinantes de um documento: [{ nome, cargo }] na ordem do cadastro */
window.CRV_ASSINANTES = async function(doc){ await carregar(); const L = (CAD.ass || []).filter(a => (a.docs || []).includes(doc));
  const out = []; for (const a of L) { let nome = a.nome, cargo = a.cargo;
    if (a.mat && window.CRV_QUADRO) { try { const Q = await window.CRV_QUADRO(); const c = Q && Q.mapa && Q.mapa[String(a.mat)]; if (c) { if (!nome) nome = c.nome; if (!cargo) cargo = c.funcao; } } catch(_){} }
    if (nome) out.push({ nome, cargo:cargo || '' }); }
  return out; };

/* MODELO ÚNICO DE DOCUMENTO (PDF jsPDF em mm): o mesmo das Sanções / Serviços Gerais.
   CRV_DOC.margem → margens das tabelas; estilo() → estilos do autoTable; titulo(); caixa(); assinaturas(); moldura() no fim (cabeçalho e rodapé em todas as páginas). */
window.CRV_DOC = (function(){
  const C = { NAVY:[31,58,104], INK:[30,36,48], MUT:[110,116,128], GREEN:[110,150,60], HEAD:[36,65,79], FOOT:[246,240,233] };
  const dims = doc => ({ W:doc.internal.pageSize.getWidth(), H:doc.internal.pageSize.getHeight() });
  const dataExt = d => { d = d || new Date(); const M = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']; return 'Capinópolis/MG, ' + String(d.getDate()).padStart(2, '0') + ' de ' + M[d.getMonth()] + ' de ' + d.getFullYear() + '.'; };
  return {
    cores:C, margem:{ top:30, bottom:26, left:12, right:12 },
    estilo(){ return { theme:'striped', styles:{ fontSize:7.6, cellPadding:1.3, lineColor:[225,222,216], lineWidth:.1, textColor:C.INK }, headStyles:{ fillColor:C.HEAD, textColor:255, fontStyle:'bold' }, footStyles:{ fillColor:C.FOOT, textColor:C.INK, fontStyle:'bold' }, alternateRowStyles:{ fillColor:[250,249,246] } }; },
    /* título grande + data por extenso + subtítulo; devolve o y seguinte */
    titulo(doc, titulo, sub, y){ y = y || 36; doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...C.NAVY); doc.text(String(titulo), 12, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.INK); doc.text(dataExt(), 12, y + 5.5);
      if (sub) { doc.setFontSize(8.5); doc.setTextColor(...C.MUT); const L = doc.splitTextToSize(String(sub), dims(doc).W - 24); doc.text(L, 12, y + 10.5); return y + 10.5 + L.length * 3.8 + 2; } return y + 10; },
    /* faixa cinza com pares [rótulo, valor] */
    caixa(doc, y, pares){ const { W } = dims(doc); doc.setFillColor(238,241,245); doc.roundedRect(12, y, W - 24, 10, 2, 2, 'F'); doc.setFontSize(9); doc.setTextColor(...C.INK); let x = 16;
      pares.forEach(([t, v]) => { doc.setFont('helvetica', 'bold'); doc.text(t, x, y + 6.3); const w = doc.getTextWidth(t); doc.setFont('helvetica', 'normal'); doc.text(String(v), x + w + 1.6, y + 6.3); x += w + 1.6 + doc.getTextWidth(String(v)) + 10; }); return y + 15; },
    /* seção (título pequeno); quebra a página se precisar */
    secao(doc, y, t){ const { H } = dims(doc); if (y > H - 50) { doc.addPage(); y = 34; } doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.NAVY); doc.text(String(t), 12, y); return y + 2.5; },
    /* assinaturas centralizadas lado a lado; lista [{nome,cargo}] ou [[nome,cargo]]; devolve o y seguinte (ou null se não couber nesta folha) */
    assinaturas(doc, y, lista){ const { W, H } = dims(doc); const A = (lista || []).map(a => Array.isArray(a) ? { nome:a[0], cargo:a[1] } : a).filter(a => a && a.nome); if (!A.length) return y;
      const yy = y + 16; if (yy + 12 > H - 22) return null; const gap = A.length > 2 ? 10 : 30, lw = Math.min(70, (W - 24 - (A.length - 1) * gap) / A.length), tw = A.length * lw + (A.length - 1) * gap; let x = (W - tw) / 2;
      A.forEach(a => { doc.setDrawColor(60,66,80); doc.setLineWidth(.3); doc.line(x, yy, x + lw, yy); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.8); doc.setTextColor(...C.INK); doc.text(a.nome, x + lw / 2, yy + 4.5, { align:'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.MUT); doc.text(a.cargo || '', x + lw / 2, yy + 8.6, { align:'center' }); x += lw + gap; });
      return yy + 14; },
    /* cabeçalho e rodapé em todas as páginas (chamar no fim, antes de salvar) */
    moldura(doc, quem){ const n = doc.getNumberOfPages(), hj = new Date();
      for (let i = 1; i <= n; i++) { doc.setPage(i); const { W, H } = dims(doc); /* por página: aceita folhas deitadas e em pé no mesmo PDF */ doc.setFillColor(...C.NAVY); doc.rect(0, 0, W, 4, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5); doc.setTextColor(...C.NAVY); doc.text('CRV INDUSTRIAL', 12, 14);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...C.MUT); doc.text('UNIDADE CAPINÓPOLIS', 12, 18.5); doc.setDrawColor(...C.GREEN); doc.setLineWidth(.6); doc.line(12, 22, W - 12, 22);
        doc.setDrawColor(215,220,228); doc.setLineWidth(.3); doc.line(12, H - 19, W - 12, H - 19); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.3); doc.setTextColor(...C.INK); doc.text('CRV INDUSTRIAL LTDA - UNIDADE CAPINÓPOLIS | CNPJ 03.937.452/0004-35', W / 2, H - 15, { align:'center' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.MUT); doc.text('Rodovia MG-226, s/nº, km 63, Zona Rural, Capinópolis/MG - CEP 38.360-000 · Telefone: (34) 3263-8100', W / 2, H - 11.4, { align:'center' });
        doc.setFontSize(7); doc.setTextColor(130,136,148); doc.text('Gestão de Pessoas · emitido em ' + hj.toLocaleDateString('pt-BR') + ' · Página ' + i + ' de ' + n, W - 12, H - 5, { align:'right' }); }
      return doc; }
  };
})();
window.CRV_CAD_INIT = function(X){
const { sb, E, $, esc, moldura, toast, traduzErro, ehAdmin, ehRH, baixar, FRENTES } = X; SB = sb;
const quem = () => (E.perfil && E.perfil.nome) || '';
let aba = 'cc', q = '';
async function tela(a){ if (a) aba = a;
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Central de Rotinas do RH</div><h1>Cadastros do RH</h1><div class="ini-data">Centros de custo, setores, assinantes dos documentos, datas de férias e permissões, num lugar só</div></div></section>
    <nav class="cad-tabs" style="display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid var(--linha,#e4e7ec);margin:0 0 14px">${[['cc', 'Centros de custo'], ['st', 'Setores'], ['ass', 'Assinantes dos documentos'], ['fer', 'Datas de férias'], ['perm', 'Quem pode fazer o quê']].filter(t => t[0] !== 'perm' || ehAdmin()).map(t => `<button data-ab="${t[0]}" style="border:0;background:none;padding:9px 14px;font:700 14px inherit;font-family:inherit;cursor:pointer;color:${aba === t[0] ? '#24427c' : '#667085'};border-bottom:3px solid ${aba === t[0] ? '#e9a23b' : 'transparent'};margin-bottom:-1px">${t[1]}</button>`).join('')}</nav>
    <div id="cad-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  document.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { aba = b.dataset.ab; q = ''; tela(); });
  await carregar(true); _q = null; const Q = await quadro(); const c = $('#cad-corpo'); if (!c) return;
  const pode = ehRH();
  if (aba === 'cc') return telaCC(c, Q, pode);
  if (aba === 'st') return telaSt(c, Q, pode);
  if (aba === 'ass') return telaAss(c, pode);
  if (aba === 'perm') return telaPerm(c);
  if (aba === 'fer') return telaFer(c, pode);
}
const MESES_F = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const brF = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
function telaFer(c, pode){
  const L = (CAD.fer || []).map(x => Object.assign({}, x));
  const desenhar = () => { L.sort((a, b) => String(a.ini).localeCompare(String(b.ini))); const G = new Map(); L.forEach((x, i) => { const k = String(x.ini).slice(0, 7); if (!G.has(k)) G.set(k, []); G.get(k).push([x, i]); });
    c.innerHTML = dica('Só estas datas podem ser usadas como <b>início de férias</b>, tanto pelo RH (painel Férias) quanto pelos gestores. Outra data só com autorização do RH, registrada no próprio painel Férias. Quando sair o calendário dos próximos meses, acrescente aqui.') +
      `<div class="cartao" style="padding:12px"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${[...G.entries()].map(([k, A]) => `<div style="border:1px solid #e4e7ec;border-radius:10px;overflow:hidden"><div style="background:#2e7d4f;color:#fff;font-weight:800;padding:6px 10px;text-transform:uppercase;font-size:13px">${MESES_F[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left;padding:5px 10px;color:#667085;font-size:11px">INÍCIO DO GOZO</th><th style="text-align:left;padding:5px 10px;color:#667085;font-size:11px">PAGAMENTO</th><th></th></tr></thead><tbody>
        ${A.map(([x, i]) => `<tr style="border-top:1px solid #eef0f4"><td style="padding:6px 10px"><b>${brF(x.ini)}</b></td><td style="padding:6px 10px">${brF(x.pag) || '–'}</td><td style="text-align:right;padding:4px 8px">${pode ? `<button class="link" data-rm="${i}" style="color:#a3301c">tirar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`).join('') || '<p>Nenhuma data liberada.</p>'}</div>
      ${pode ? `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-top:14px;border-top:1px solid #e4e7ec;padding-top:12px"><label style="font-size:12px;font-weight:700;color:#667085">INÍCIO DO GOZO<br><input type="date" id="fe-i" style="padding:7px 9px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label><label style="font-size:12px;font-weight:700;color:#667085">DATA DE PAGAMENTO<br><input type="date" id="fe-p" style="padding:7px 9px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label><button class="btn borda" id="fe-a">+ Acrescentar</button><span style="flex:1"></span><span id="fe-m" style="font-size:13px;color:#a3301c"></span><button class="btn prim" id="fe-ok">Salvar calendário</button></div>` : ''}
      <p style="margin:10px 0 0;font-size:12.5px;color:#667085">Total: ${L.length} datas liberadas${L.length ? ', de ' + brF(L[0].ini) + ' a ' + brF(L[L.length - 1].ini) : ''}.</p></div>`;
    c.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { L.splice(+b.dataset.rm, 1); desenhar(); });
    const ad = $('#fe-a'); if (ad) ad.onclick = () => { const i = $('#fe-i').value, p = $('#fe-p').value, m = $('#fe-m');
      if (!i) { m.textContent = 'Informe o início do gozo.'; return; } if (L.some(x => x.ini === i)) { m.textContent = 'Essa data já está no calendário.'; return; } if (p && p > i) { m.textContent = 'O pagamento costuma ser antes do início: confira a data.'; return; }
      L.push({ ini:i, pag:p || '' }); desenhar(); };
    const ok = $('#fe-ok'); if (ok) ok.onclick = async () => { CAD.fer = L.map(x => ({ ini:x.ini, pag:x.pag || '' })); try { await salvarCad(quem()); toast('Calendário de férias salvo.'); } catch(e){ toast(traduzErro(e), true); } };
  };
  desenhar();
}
const dica = t => `<p style="margin:0 0 12px;color:var(--mut,#667085);font-size:13px">${t}</p>`;
function telaCC(c, Q, pode){
  const L = [...Q.cc.values()].sort((a, b) => String(a.cod).localeCompare(String(b.cod), 'pt-BR', { numeric:true }));
  const extra = Object.keys(CAD.ccNome).filter(k => !Q.cc.has(k)).map(k => ({ cod:k, nomeQ:'', at:0, tot:0, setores:new Map(), soCad:true }));
  const desenhar = () => { const T = L.concat(extra).filter(o => !q || nrm(o.cod + ' ' + o.nomeQ + ' ' + (CAD.ccNome[o.cod] || '') + ' ' + [...o.setores.keys()].join(' ')).includes(nrm(q)));
    c.innerHTML = dica(`Os centros de custo vêm do Quadro Geral (${L.length} códigos). O <b>nome oficial</b> é o usado nos relatórios por centro de custo; se ficar vazio, vale o nome do Quadro. Os painéis (como o fechamento do Cartão ADM) avisam quando aparece um código que não existe aqui.`) +
      `<div class="cartao" style="padding:12px"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input id="cad-q" type="search" placeholder="Buscar código, nome ou setor" value="${esc(q)}" style="flex:1;min-width:220px;padding:8px 10px;border:1px solid #d5dbe6;border-radius:8px;font:inherit">
        ${pode ? '<button class="btn borda" id="cad-add">+ Código que não está no Quadro</button>' : ''}<button class="btn borda" id="cad-xl">Excel</button></div>
      <div style="overflow:auto"><table class="fc-t" style="width:100%"><thead><tr><th>Código</th><th>Nome no Quadro</th><th>Nome oficial</th><th style="text-align:right">Ativos</th><th>Setores (ativos)</th></tr></thead><tbody>
      ${T.map(o => `<tr><td><b>${esc(o.cod)}</b></td><td>${esc(o.nomeQ || (o.soCad ? 'não está no Quadro' : ''))}</td><td>${pode ? `<input data-cc="${esc(o.cod)}" value="${esc(CAD.ccNome[o.cod] || '')}" placeholder="${esc(o.nomeQ)}" style="width:100%;min-width:180px;padding:6px 8px;border:1px solid #d5dbe6;border-radius:7px;font:inherit">` : esc(CAD.ccNome[o.cod] || o.nomeQ)}</td><td style="text-align:right">${o.at}</td><td style="font-size:12.5px;color:var(--mut,#667085)">${esc([...o.setores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, n]) => s + ' (' + n + ')').join(' · '))}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="5">Total: ${T.length} centros de custo</td></tr></tfoot></table></div>
      ${pode ? '<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn prim" id="cad-ok">Salvar nomes oficiais</button></div>' : ''}</div>`;
    const qi = $('#cad-q'); qi.oninput = () => { q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { desenhar(); const e = $('#cad-q'); e.focus(); e.setSelectionRange(q.length, q.length); }, 300); };
    c.querySelectorAll('[data-cc]').forEach(i => i.oninput = () => { const v = i.value.trim(); if (v) CAD.ccNome[i.dataset.cc] = v; else delete CAD.ccNome[i.dataset.cc]; });
    const ok = $('#cad-ok'); if (ok) ok.onclick = async () => { try { await salvarCad(quem()); toast('Nomes oficiais salvos.'); } catch(e){ toast(traduzErro(e), true); } };
    const ad = $('#cad-add'); if (ad) ad.onclick = () => { const cod = (prompt('Código do centro de custo:') || '').trim(); if (!cod) return; const n = (prompt('Nome oficial:') || '').trim(); if (!n) return; CAD.ccNome[cod] = n; if (!Q.cc.has(cod) && !extra.some(x => x.cod === cod)) extra.push({ cod, nomeQ:'', at:0, tot:0, setores:new Map(), soCad:true }); desenhar(); toast('Clique em "Salvar nomes oficiais" para gravar.'); };
    $('#cad-xl').onclick = () => { const A = [['Código', 'Nome no Quadro', 'Nome oficial', 'Ativos', 'Setores']].concat(T.map(o => [o.cod, o.nomeQ, CAD.ccNome[o.cod] || o.nomeQ, o.at, [...o.setores.keys()].join('; ')])); A.push(['Total: ' + T.length + ' centros de custo']);
      const ws = XLSX.utils.aoa_to_sheet(A); ws['!cols'] = [12, 36, 36, 8, 60].map(w => ({ wch:w })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Centros de custo', { semTotal:true, semOrdem:true });
      baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Centros de custo.xlsx'); };
  };
  desenhar();
}
function telaSt(c, Q, pode){
  const OF = [...Q.st.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const desenhar = () => { const S = Object.entries(CAD.sin).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR') || a[0].localeCompare(b[0]));
    c.innerHTML = dica('Os setores oficiais são os do Quadro Geral. Quando outra base escreve o setor de outro jeito (ex.: "RH" e "RH / Sustentabilidade", ou "Oficina Automotiva – Elétrica"), cadastre aqui o <b>nome equivalente</b>: os painéis passam a juntar os dois no nome oficial.') +
      `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px">
      <div class="cartao" style="padding:12px"><h3 style="margin:0 0 8px;font-size:15px">Nomes equivalentes (${S.length})</h3>
        ${pode ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><input id="sv" placeholder="Como aparece na outra base" style="flex:1;min-width:150px;padding:7px 9px;border:1px solid #d5dbe6;border-radius:7px;font:inherit"><input id="so" list="sol" placeholder="Nome oficial" style="flex:1;min-width:150px;padding:7px 9px;border:1px solid #d5dbe6;border-radius:7px;font:inherit"><datalist id="sol">${OF.map(o => `<option value="${esc(o.nome)}">`).join('')}</datalist><button class="btn prim" id="sa">Adicionar</button></div>` : ''}
        <div style="overflow:auto"><table class="fc-t" style="width:100%"><thead><tr><th>Como aparece</th><th>Vira</th><th></th></tr></thead><tbody>${S.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td><td>${pode ? `<button class="btn peq borda" data-rm="${esc(k)}">Tirar</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="3" style="color:var(--mut,#667085)">Nenhum nome equivalente cadastrado.</td></tr>'}</tbody></table></div></div>
      <div class="cartao" style="padding:12px"><h3 style="margin:0 0 8px;font-size:15px">Setores oficiais no Quadro (${OF.length})</h3><div style="overflow:auto;max-height:520px"><table class="fc-t" style="width:100%"><thead><tr><th>Setor</th><th style="text-align:right">Ativos</th></tr></thead><tbody>${OF.map(o => `<tr><td>${esc(o.nome)}</td><td style="text-align:right">${o.at}</td></tr>`).join('')}</tbody></table></div></div></div>`;
    const sa = $('#sa'); if (sa) sa.onclick = async () => { const v = $('#sv').value.trim(), o = $('#so').value.trim(); if (!v || !o) return toast('Preencha os dois campos.', true); if (nrm(v) === nrm(o)) return toast('Os dois nomes são iguais.', true);
      CAD.sin[nrm(v)] = o; try { await salvarCad(quem()); toast('Nome equivalente salvo.'); desenhar(); } catch(e){ delete CAD.sin[nrm(v)]; toast(traduzErro(e), true); } };
    c.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { const k = b.dataset.rm, v = CAD.sin[k]; delete CAD.sin[k]; try { await salvarCad(quem()); toast('Retirado.'); desenhar(); } catch(e){ CAD.sin[k] = v; toast(traduzErro(e), true); } });
  };
  desenhar();
}
function telaAss(c, pode){
  let A = (CAD.ass || []).map(a => Object.assign({}, a, { docs:(a.docs || []).slice() }));
  const desenhar = () => {
    c.innerHTML = dica('Quem assina cada documento. Mudou alguém de cargo? Altere aqui e todos os documentos marcados passam a sair com o novo nome. Com a <b>matrícula</b> preenchida e o nome vazio, o nome sai do Quadro Geral.') +
      `<div class="cartao" style="padding:12px"><div style="overflow:auto"><table class="fc-t" style="width:100%"><thead><tr><th>Nome</th><th>Cargo</th><th>Matrícula</th>${DOCS.map(d => `<th style="font-size:11px;max-width:150px;white-space:normal">${esc(d.n)}</th>`).join('')}<th></th></tr></thead><tbody>
      ${A.map((a, i) => `<tr><td><input data-i="${i}" data-f="nome" value="${esc(a.nome)}" placeholder="${a.mat ? 'pelo Quadro' : ''}" ${pode ? '' : 'disabled'} style="width:100%;min-width:150px;padding:6px 8px;border:1px solid #d5dbe6;border-radius:7px;font:inherit"></td><td><input data-i="${i}" data-f="cargo" value="${esc(a.cargo)}" ${pode ? '' : 'disabled'} style="width:100%;min-width:140px;padding:6px 8px;border:1px solid #d5dbe6;border-radius:7px;font:inherit"></td><td><input data-i="${i}" data-f="mat" value="${esc(a.mat || '')}" ${pode ? '' : 'disabled'} style="width:80px;padding:6px 8px;border:1px solid #d5dbe6;border-radius:7px;font:inherit"></td>
        ${DOCS.map(d => `<td style="text-align:center"><input type="checkbox" data-i="${i}" data-d="${d.k}" ${(a.docs || []).includes(d.k) ? 'checked' : ''} ${pode ? '' : 'disabled'}></td>`).join('')}<td>${pode ? `<button class="btn peq borda" data-rm="${i}">Tirar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
      ${pode ? '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap"><button class="btn borda" id="aa">+ Assinante</button><button class="btn prim" id="ao">Salvar assinantes</button></div>' : ''}</div>
      <p style="font-size:12.5px;color:var(--mut,#667085)">Sanções, RD, gratificação e horas extras do Serviços Gerais continuam com as assinaturas configuradas no próprio painel.</p>`;
    c.querySelectorAll('input[data-f]').forEach(i => i.oninput = () => { A[+i.dataset.i][i.dataset.f] = i.value.trim(); });
    c.querySelectorAll('input[data-d]').forEach(i => i.onchange = () => { const a = A[+i.dataset.i]; a.docs = a.docs.filter(x => x !== i.dataset.d).concat(i.checked ? [i.dataset.d] : []); });
    c.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { A.splice(+b.dataset.rm, 1); desenhar(); });
    const aa = $('#aa'); if (aa) aa.onclick = () => { A.push({ id:'a' + Date.now().toString(36), nome:'', cargo:'', mat:'', docs:[] }); desenhar(); };
    const ao = $('#ao'); if (ao) ao.onclick = async () => { const L = A.filter(a => a.nome || a.mat); const sem = DOCS.filter(d => !L.some(a => a.docs.includes(d.k)));
      if (sem.length && !confirm('Estes documentos vão ficar sem assinante: ' + sem.map(d => d.n).join('; ') + '. Salvar mesmo assim?')) return;
      const ant = CAD.ass; CAD.ass = L; try { await salvarCad(quem()); toast('Assinantes salvos.'); A = L.map(a => Object.assign({}, a, { docs:a.docs.slice() })); desenhar(); } catch(e){ CAD.ass = ant; toast(traduzErro(e), true); } };
  };
  desenhar();
}
async function telaPerm(c){
  const { data, error } = await sb.from('perfis').select('*').order('nome'); if (error) { c.innerHTML = `<div class="erro">${esc(traduzErro(error))}</div>`; return; }
  const U = data.filter(u => u.ativo !== false), P = (E.paineis || []).slice().sort((a, b) => Object.keys(FRENTES).indexOf(a.frente) - Object.keys(FRENTES).indexOf(b.frente) || a.nome.localeCompare(b.nome, 'pt-BR'));
  const rh = u => ['admin', 'rh'].includes(u.papel), pp = (u, k, p) => (Array.isArray(u[k]) ? u[k] : []).includes(p.id);
  const ver = (u, p) => rh(u) || (u.papel !== 'gestor' && (pp(u, 'paineis_ver', p) || pp(u, 'paineis_editar', p))) || (u.papel !== 'gestor' && p.nivel !== 'restrito' && (u.frentes || []).includes(p.frente));
  const edi = (u, p) => rh(u) || (u.papel !== 'gestor' && pp(u, 'paineis_editar', p)) || (u.papel === 'editor' && p.nivel !== 'restrito' && (u.frentes || []).includes(p.frente));
  const imp = u => u.papel === 'admin' || (!!u.importa && ['rh', 'editor'].includes(u.papel));
  const PAP = { admin:'Administrador principal', rh:'Equipe RH', editor:'Editor', leitor:'Leitor', gestor:'Gestor de área' };
  const cel = (u, p) => u.papel === 'gestor' ? '<td style="text-align:center;color:#98a2b3">—</td>' : edi(u, p) ? '<td style="text-align:center;background:#e6f3ec;color:#1d4d33;font-weight:700" title="Vê e lança">Edita</td>' : ver(u, p) ? '<td style="text-align:center;background:#eef4fb;color:#24427c" title="Só consulta">Vê</td>' : '<td style="text-align:center;color:#c0c6d0">·</td>';
  c.innerHTML = dica('Conferência do que cada usuário pode fazer. Para mudar, vá em Administração → Usuários → Editar. <b>Edita</b> = vê e faz lançamentos; <b>Vê</b> = só consulta; <b>Importa</b> = pode carregar as planilhas das bases nos painéis que edita.') +
    `<div class="cartao" style="padding:12px"><div style="overflow:auto;max-height:70vh"><table class="fc-t" style="width:100%;font-size:12.5px"><thead><tr><th style="position:sticky;left:0;background:#f8f9fb;z-index:2">Painel</th>${U.map(u => `<th style="white-space:normal;min-width:92px;text-align:center">${esc(u.nome)}<div style="font-weight:400;text-transform:none;letter-spacing:0">${esc(PAP[u.papel] || u.papel)}${imp(u) ? ' · <b style="color:#b5731a">importa</b>' : ''}</div></th>`).join('')}</tr></thead><tbody>
    ${P.map(p => `<tr><td style="position:sticky;left:0;background:var(--card,#fff)"><b>${esc(p.nome)}</b><div style="font-size:11px;color:var(--mut,#667085)">${esc(p.frente)}${p.nivel === 'restrito' ? ' · restrito' : ''}</div></td>${U.map(u => cel(u, p)).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
return { tela };
};
})();
