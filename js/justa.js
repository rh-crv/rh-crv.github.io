/* =====================================================================
   COMUNICAÇÃO DE JUSTA CAUSA (Ocorrências e Relações Trabalhistas)
   Formulário pela matrícula (Quadro Geral) → documento "Comunicação de Rescisão do Contrato de Trabalho
   por Justa Causa" em PDF, com as alíneas do Art. 482 da CLT marcadas, descrição da ocorrência,
   assinaturas e 2 testemunhas, tudo numa folha.
   Registros: painel 'justa-causa', coleção 'emitidas' (um por comunicação); textos do modelo em 'cfg/textos'.
   ===================================================================== */
window.CRV_JC_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, fMat, podeEditar, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, logo } = X;
const PAINEL = 'justa-causa';
/* Art. 482 da CLT, alíneas a a m (texto da lei) */
const ALI = [
  ['a', 'ato de improbidade'],
  ['b', 'incontinência de conduta ou mau procedimento'],
  ['c', 'negociação habitual por conta própria ou alheia sem permissão do empregador, e quando constituir ato de concorrência à empresa para a qual trabalha o empregado, ou for prejudicial ao serviço'],
  ['d', 'condenação criminal do empregado, passada em julgado, caso não tenha havido suspensão da execução da pena'],
  ['e', 'desídia no desempenho das respectivas funções'],
  ['f', 'embriaguez habitual ou em serviço'],
  ['g', 'violação de segredo da empresa'],
  ['h', 'ato de indisciplina ou de insubordinação'],
  ['i', 'abandono de emprego'],
  ['j', 'ato lesivo da honra ou da boa fama praticado no serviço contra qualquer pessoa, ou ofensas físicas, nas mesmas condições, salvo em caso de legítima defesa, própria ou de outrem'],
  ['k', 'ato lesivo da honra ou da boa fama ou ofensas físicas praticadas contra o empregador e superiores hierárquicos, salvo em caso de legítima defesa, própria ou de outrem'],
  ['l', 'prática constante de jogos de azar'],
  ['m', 'perda da habilitação ou dos requisitos estabelecidos em lei para o exercício da profissão, em decorrência de conduta dolosa do empregado']
];
const TXT0 = {
  titulo: 'COMUNICAÇÃO DE RESCISÃO DO CONTRATO DE TRABALHO POR JUSTA CAUSA',
  abertura: 'Pela presente, comunicamos a V.Sa. que, a partir desta data, fica rescindido o seu contrato de trabalho por JUSTA CAUSA, com fundamento no Art. 482 da Consolidação das Leis do Trabalho (CLT), em razão da(s) falta(s) grave(s) enquadrada(s) na(s) alínea(s) abaixo, conforme ocorrência de {DATA_OCORRENCIA}:',
  convocacao: 'Solicitamos o seu comparecimento ao Departamento de Pessoal no dia {DATA_DP}, às {HORA_DP}, para as providências relativas à rescisão do contrato de trabalho.'
};
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const extenso = iso => iso ? (+iso.slice(8, 10)) + ' de ' + MESES[+iso.slice(5, 7) - 1] + ' de ' + iso.slice(0, 4) : '';
const brHora = h => h ? h.replace(':', 'h') : '';
const quem = () => (E.perfil && E.perfil.nome) || '';

let TXT = Object.assign({}, TXT0), RASCUNHO = null, Q = null;
async function regs(){ return (await window.CRV_REGS(PAINEL, 'emitidas')).filter(x => !x.excluida); }
async function salvar(col, id, dados){
  const { error } = await sb.from('registros').upsert({ painel:PAINEL, caminho:col + '/' + id, colecao:col, doc_id:id, dados, atualizado_por:quem() }, { onConflict:'painel,caminho' });
  if (error) throw error;
  try { window.CRV_CENTRAL_LIMPAR && window.CRV_CENTRAL_LIMPAR(); } catch(_){}
}
async function textos(){ try { const c = (await window.CRV_REGS(PAINEL, 'cfg')).find(x => x._id === 'textos'); TXT = Object.assign({}, TXT0, c ? { abertura:c.abertura || TXT0.abertura, convocacao:c.convocacao || TXT0.convocacao, titulo:c.titulo || TXT0.titulo } : {}); } catch(_){} return TXT; }
async function quadro(){ if (!Q) { try { Q = await window.CRV_QUADRO(); } catch(_){ Q = null; } } return Q; }
const pessoa = m => { const k = fMat(String(m || '').replace(/\D/g, '')); return k && Q && Q.mapa ? Object.assign({ mat:k }, Q.mapa[k] || {}) : null; };

/* ---------- PDF ---------- */
/* mesmo papel timbrado dos documentos de Sanções Disciplinares (faixa azul, CRV INDUSTRIAL / UNIDADE CAPINÓPOLIS,
   linha verde, título em azul, quadro cinza com os dados do colaborador e rodapé com CNPJ e endereço; logo à direita) */
function montarPDF(r, K){
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'mm', format:'a4' });
  const NAVY = [31, 58, 104], INK = [40, 46, 58], MUT = [110, 116, 128], GREEN = [110, 150, 60]; const L = 18, R = 192, W = R - L;
  let quebrou = false;
  const cab2 = () => { doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 4, 'F'); };
  const rodape = () => { const n = doc.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i);
    doc.setDrawColor(215, 220, 228); doc.setLineWidth(.3); doc.line(L, 276, R, 276); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.3); doc.setTextColor(...INK); doc.text('CRV INDUSTRIAL LTDA - UNIDADE CAPINÓPOLIS | CNPJ 03.937.452/0004-35', 105, 280.5, { align:'center' });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUT); doc.text('Rodovia MG-226, s/nº, km 63, Zona Rural, Capinópolis/MG - CEP 38.360-000', 105, 284.3, { align:'center' }); doc.text('Telefone: (34) 3263-8100', 105, 288, { align:'center' });
    doc.setFontSize(6.8); doc.text('Gestão de Pessoas · emitido em ' + new Date().toLocaleDateString('pt-BR'), L, 292); if (n > 1) doc.text(i + '/' + n, R, 292, { align:'right' }); } };
  const lab = (t, v, x, y) => { doc.setFont('helvetica', 'bold'); doc.text(t, x, y); const w = doc.getTextWidth(t); doc.setFont('helvetica', 'normal'); const vv = String(v || ''); doc.text(vv, x + w + 1.6, y); return x + w + 1.6 + doc.getTextWidth(vv); };
  const sec = (t, y) => { if (y > 255) { quebrou = true; doc.addPage(); cab2(); y = 20; } doc.setFont('helvetica', 'bold'); doc.setFontSize(10 * Math.max(K, .85)); doc.setTextColor(...NAVY); doc.text(t, L, y); return y + 5.6 * K; };
  /* cabeçalho */
  cab2(); doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5); doc.setTextColor(...NAVY); doc.text('CRV INDUSTRIAL', L, 19);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...MUT); doc.text('UNIDADE CAPINÓPOLIS', L, 24);
  doc.setDrawColor(...GREEN); doc.setLineWidth(.6); doc.line(L, 29, R, 29);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...NAVY); const tl = doc.splitTextToSize(TXT.titulo, W); let y = 38; tl.forEach(t => { doc.text(t, L, y); y += 6; });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...INK); doc.text((r.cidade || 'Capinópolis/MG') + ', ' + extenso(r.dataDoc) + '.', L, y); y += 5;
  /* quadro cinza com os dados do empregado */
  doc.setFillColor(238, 241, 245); doc.roundedRect(L, y, W, 25, 2, 2, 'F'); doc.setFontSize(9.4); doc.setTextColor(...INK);
  lab('Empregado(a):', r.nome, L + 1, y + 6.5); lab('Matrícula:', r.mat, 140, y + 6.5);
  let x = lab('CPF:', r.cpf, L + 1, y + 11.6); x = lab('CTPS nº:', r.ctps, x + 6, y + 11.6); lab('Série:', r.serie, x + 6, y + 11.6); lab('Admissão:', brD(r.adm), 140, y + 11.6);
  lab('Função:', r.funcao, L + 1, y + 16.7);
  x = lab('Departamento:', r.depto, L + 1, y + 21.8); if (r.setor && r.setor !== r.depto) lab('Setor:', r.setor, Math.max(x + 6, 120), y + 21.8);
  y += 34;
  const subst = t => String(t || '').split('{DATA_OCORRENCIA}').join(brD(r.dataOc) || '____/____/______').split('{DATA_DP}').join(brD(r.dpData) || '____/____/______').split('{HORA_DP}').join(brHora(r.dpHora) || '____h____');
  const fs = 9.6 * K, lh = 4.7 * K;
  const paragrafo = texto => { doc.setFont('helvetica', 'normal'); doc.setFontSize(fs); doc.setTextColor(...INK);
    String(texto || '').replace(/\r/g, '').split('\n').forEach((pa, ip, arr) => {
      if (!pa.trim()) { y += lh * .5; return; }
      const ls = doc.splitTextToSize(pa.trim(), W);
      ls.forEach((ln, i) => { if (y > 262) { quebrou = true; doc.addPage(); cab2(); y = 20; }
        const ws = ln.split(' ').filter(Boolean);
        if (i < ls.length - 1 && ws.length > 1) { const tw = ws.reduce((s, w) => s + doc.getTextWidth(w), 0), sp = (W - tw) / (ws.length - 1); let xx = L; ws.forEach(w => { doc.text(w, xx, y); xx += doc.getTextWidth(w) + sp; }); }
        else doc.text(ln, L, y);
        y += lh; });
      if (ip < arr.length - 1) y += lh * .3; }); };
  paragrafo(subst(TXT.abertura)); y += 1.5 * K;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(fs); doc.setTextColor(...INK);
  ALI.filter(a => (r.alineas || []).includes(a[0])).forEach(a => { doc.splitTextToSize('Alínea "' + a[0] + '" – ' + a[1] + ';', W - 6).forEach(t => { if (y > 262) { quebrou = true; doc.addPage(); cab2(); y = 20; } doc.text(t, L + 6, y); y += lh; }); y += .6 * K; });
  y += 2 * K; paragrafo(subst(TXT.convocacao)); y += 3 * K;
  y = sec('DESCRIÇÃO DA OCORRÊNCIA', y); paragrafo(r.desc);
  /* assinaturas no pé da folha, como nas sanções: empregador e empregado; testemunhas com nome e CPF */
  if (y > 232) { quebrou = true; doc.addPage(); cab2(); y = 30; }
  let ys = Math.max(y + 12, 238); const c2 = 114, cx1 = L + 39, cx2 = (c2 + R) / 2;
  doc.setDrawColor(...INK); doc.setLineWidth(.3); doc.line(L, ys, L + 78, ys); doc.line(c2, ys, R, ys);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.8); doc.setTextColor(...INK); doc.text('CRV INDUSTRIAL', cx1, ys + 4.5, { align:'center' }); doc.text(String(r.nome || '').toUpperCase().slice(0, 44), cx2, ys + 4.5, { align:'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.text('EMPREGADOR', cx1, ys + 9, { align:'center' }); doc.text('EMPREGADO(A) | Matrícula: ' + (r.mat || ''), cx2, ys + 9, { align:'center' });
  ys += 23; doc.line(L, ys - 5, L + 78, ys - 5); doc.line(c2, ys - 5, R, ys - 5);
  const T = r.test || [];
  [[L, T[0] || {}], [c2, T[1] || {}]].forEach(([xx, t]) => { doc.text('Testemunha - Nome: ' + (t.nome || '______________________________'), xx, ys); doc.text('CPF: ' + (t.cpf || '_____________________________________________'), xx, ys + 4.3); });
  rodape();
  return { doc, quebrou };
}
async function gerarPDF(r){ let K = 1, B = montarPDF(r, K); while (B.quebrou && K > .62) { K = Math.round((K - .04) * 100) / 100; B = montarPDF(r, K); }
  try { const f = window.CRV_PDF_LOGOS; if (f) { const o = await f(B.doc); if (o) return o; } } catch(_){} return B.doc; }
const nomeArq = r => 'Justa causa - ' + (r.nome || '').split(' ').slice(0, 2).join(' ') + ' ' + r.mat + ' - ' + brD(r.dataDoc).split('/').join('-') + '.pdf';
async function visualizar(r){
  const blob = (await gerarPDF(r)).output('blob'), u = URL.createObjectURL(blob);
  const w = document.createElement('div'); w.className = 'jc-prev';
  w.innerHTML = `<div class="jc-pv"><div class="jc-pvh"><b>Visualização · ${esc(r.nome || '')}</b><span style="flex:1"></span><button class="btn borda peq" data-b>Baixar PDF</button><button class="btn prim peq" data-x>Fechar visualização</button></div><iframe src="${u}#toolbar=1&view=FitH" title="Visualização do documento"></iframe></div>`;
  document.body.appendChild(w); const fechar = () => { w.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
  w.querySelector('[data-x]').onclick = fechar; w.querySelector('[data-b]').onclick = () => baixar(blob, nomeArq(r));
  w.addEventListener('mousedown', e => { if (e.target === w) fechar(); });
}

/* ---------- formulário ---------- */
const CSS = `.jc-g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px 12px}.jc-g label{display:flex;flex-direction:column;gap:4px;font-size:11.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--mut)}
.jc-g input,.jc-g textarea{font:inherit;font-size:14px;font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:#fff}
.jc-g input.falta{border-color:#e0a23a;background:#fffaf0}.jc-g small.av{color:#9a5b00;font-weight:600;text-transform:none;letter-spacing:0;font-size:11.5px}
.jc-g .s2{grid-column:span 2}.jc-g .s3{grid-column:span 3}.jc-g .s4{grid-column:span 4}.jc-g .s5{grid-column:span 5}.jc-g .s6{grid-column:span 6}.jc-g .s8{grid-column:span 8}.jc-g .s12{grid-column:span 12}
@media(max-width:700px){.jc-g>*{grid-column:span 12!important}}
.jc-h{grid-column:span 12;margin:8px 0 0;font-size:12.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ink);border-bottom:1px solid var(--line);padding-bottom:4px}
.jc-st{grid-column:span 12;border-radius:10px;padding:9px 12px;font-size:13.5px;background:#f3f6fb;border:1px solid var(--line)}.jc-st.bad{background:#fdecea;border-color:#efb7ae;color:#8f1d12}.jc-st.ok{background:#e9f5ee;border-color:#b9dcc6}
.jc-al{grid-column:span 12;display:grid;grid-template-columns:1fr 1fr;gap:6px}@media(max-width:700px){.jc-al{grid-template-columns:1fr}}
.jc-al label{flex-direction:row;align-items:flex-start;gap:8px;text-transform:none;letter-spacing:0;font-weight:500;font-size:13px;color:var(--ink);border:1px solid var(--line);border-radius:9px;padding:7px 9px;cursor:pointer}.jc-al label b{min-width:16px}
.jc-al label.on{border-color:#b42318;background:#fff5f3}
.jc-desc{min-height:220px;text-align:justify;line-height:1.5}
.jc-prev{position:fixed;inset:0;z-index:300;background:rgba(10,16,30,.6);display:flex;align-items:center;justify-content:center;padding:16px}
.jc-pv{background:#fff;border-radius:12px;width:min(900px,100%);height:min(94vh,1100px);display:flex;flex-direction:column;overflow:hidden}.jc-pvh{display:flex;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line)}.jc-pv iframe{flex:1;border:0;width:100%}
.jc-al-t{display:flex;flex-wrap:wrap;gap:4px}.jc-al-t span{background:#fdecea;color:#8f1d12;border-radius:99px;padding:1px 8px;font-size:11.5px;font-weight:700}`;
function css(){ if (!document.getElementById('jc-css')) { const s = document.createElement('style'); s.id = 'jc-css'; s.textContent = CSS; document.head.appendChild(s); } }

async function form(r0, aoSalvar){
  css(); await Promise.all([quadro(), textos()]);
  const ed = !!(r0 && r0._id); const r = Object.assign({ cidade:'Capinópolis/MG', dataDoc:hoje(), alineas:[], test:[{}, {}] }, ed ? r0 : (RASCUNHO || {}));
  const v = k => esc(r[k] == null ? '' : r[k]);
  const T = r.test || [{}, {}];
  abrirModal({ titulo: ed ? 'Comunicação de justa causa · ' + (r.nome || '') : 'Nova comunicação de justa causa', largo:true,
    corpo:`<div class="jc-g">
      <div class="jc-h">Colaborador</div>
      <label class="s3">Matrícula<input id="jc-mat" inputmode="numeric" value="${v('mat')}" ${ed ? 'readonly' : ''} placeholder="Digite a matrícula"></label>
      <div class="jc-st s9" id="jc-st" style="grid-column:span 9">${ed ? 'Lançamento salvo · os dados abaixo são os da comunicação' : 'Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).'}</div>
      <label class="s8">Nome completo<input data-k="nome" value="${v('nome')}"></label><label class="s4">CPF<input data-k="cpf" value="${v('cpf')}"></label>
      <label class="s3">Admissão<input type="date" data-k="adm" value="${v('adm')}"></label><label class="s3">CTPS nº<input data-k="ctps" value="${v('ctps')}"></label><label class="s2">Série<input data-k="serie" value="${v('serie')}"></label><label class="s4">Função<input data-k="funcao" value="${v('funcao')}"></label>
      <label class="s6">Departamento<input data-k="depto" value="${v('depto')}"></label><label class="s6">Setor<input data-k="setor" value="${v('setor')}"></label>
      <div class="jc-h">Documento</div>
      <label class="s4">Cidade<input data-k="cidade" value="${v('cidade')}"></label><label class="s4">Data do documento<input type="date" data-k="dataDoc" value="${v('dataDoc')}"></label><label class="s4">Data da ocorrência<input type="date" data-k="dataOc" value="${v('dataOc')}"></label>
      <label class="s4">Comparecimento ao DP · data<input type="date" data-k="dpData" value="${v('dpData')}"></label><label class="s4">Horário<input type="time" data-k="dpHora" value="${v('dpHora')}"></label><div class="s4" id="jc-ext" style="align-self:end;font-size:12.5px;color:var(--mut)"></div>
      <div class="jc-h">Art. 482 da CLT · alíneas (pode marcar mais de uma)</div>
      <div class="jc-al">${ALI.map(a => `<label class="${(r.alineas || []).includes(a[0]) ? 'on' : ''}"><input type="checkbox" value="${a[0]}" ${(r.alineas || []).includes(a[0]) ? 'checked' : ''}><b>${a[0]})</b><span>${esc(a[1])}</span></label>`).join('')}</div>
      <div class="jc-h">Descrição da ocorrência</div>
      <label class="s12" style="text-transform:none;letter-spacing:0;font-weight:500">Escreva os fatos (pode usar vários parágrafos; no documento o texto sai justificado)<textarea id="jc-desc" class="jc-desc" rows="10">${esc(r.desc || '')}</textarea></label>
      <div class="jc-h">Testemunhas</div>
      ${[0, 1].map(i => `<label class="s2">Matrícula (opcional)<input data-t="${i}" data-tk="mat" inputmode="numeric" value="${esc((T[i] || {}).mat || '')}" placeholder="Buscar"></label><label class="s6">Testemunha ${i + 1} · nome<input data-t="${i}" data-tk="nome" value="${esc((T[i] || {}).nome || '')}"></label><label class="s4">CPF<input data-t="${i}" data-tk="cpf" value="${esc((T[i] || {}).cpf || '')}"></label>`).join('')}
      <p class="nr-msg s12" id="jc-msg" style="grid-column:span 12"></p></div>`,
    pe:`${ed ? '<button class="btn borda" id="jc-del" style="color:var(--coral)">Excluir</button>' : ''}<span style="flex:1"></span><button class="btn borda" id="jc-c">Cancelar</button><button class="btn borda" id="jc-ver">Visualizar</button><button class="btn prim" id="jc-ok">${ed ? 'Salvar e gerar PDF' : 'Imprimir / Gerar PDF'}</button>`,
    aoAbrir: m => {
      const g = s => m.querySelector(s), msg = (t, ok) => { const e = g('#jc-msg'); e.style.color = ok ? 'var(--cane)' : ''; e.textContent = t; };
      const FAL = ['nome', 'cpf', 'adm', 'ctps', 'serie', 'funcao', 'depto', 'setor'];
      let ok = ed; // matrícula válida (ativo ou afastado)
      const ler = () => { const o = {}; m.querySelectorAll('[data-k]').forEach(i => o[i.dataset.k] = i.value.trim()); o.mat = fMat(g('#jc-mat').value.replace(/\D/g, ''));
        o.alineas = [...m.querySelectorAll('.jc-al input:checked')].map(i => i.value); o.desc = g('#jc-desc').value.replace(/\s+$/, '');
        o.test = [0, 1].map(i => { const t = {}; m.querySelectorAll(`[data-t="${i}"]`).forEach(x => t[x.dataset.tk] = x.value.trim()); return t; }); return o; };
      const rasc = () => { if (!ed) RASCUNHO = ler(); };
      m.addEventListener('input', rasc);
      const ext = () => { const d = g('[data-k="dataDoc"]').value; g('#jc-ext').textContent = d ? 'No documento: ' + (g('[data-k="cidade"]').value || 'Capinópolis/MG') + ', ' + extenso(d) + '.' : ''; };
      g('[data-k="dataDoc"]').addEventListener('input', ext); g('[data-k="cidade"]').addEventListener('input', ext); ext();
      const marca = () => FAL.forEach(k => { const i = g(`[data-k="${k}"]`); const vazio = !i.value.trim(); i.classList.toggle('falta', vazio && ok); let s = i.parentElement.querySelector('small.av');
        if (vazio && ok) { if (!s) { s = document.createElement('small'); s.className = 'av'; i.parentElement.appendChild(s); } s.textContent = 'dado não encontrado na base – preencher manualmente'; } else if (s) s.remove(); });
      const preencher = () => { const st = g('#jc-st'), p = pessoa(g('#jc-mat').value);
        if (!g('#jc-mat').value.trim()) { st.className = 'jc-st'; st.textContent = 'Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).'; ok = false; marca(); return; }
        if (!Q || !Q.mapa) { st.className = 'jc-st bad'; st.textContent = 'A Base Geral de Colaboradores (Quadro) não foi carregada. Carregue o Quadro para preencher pela matrícula.'; ok = false; return; }
        if (!p || !p.nome) { st.className = 'jc-st bad'; st.textContent = 'Matrícula não encontrada na Base Geral de Colaboradores.'; ok = false; FAL.forEach(k => g(`[data-k="${k}"]`).value = ''); marca(); return; }
        if (p.situacao === 'Desligado') { st.className = 'jc-st bad'; st.innerHTML = `<b>${esc(p.nome)}</b> está como <b>demitido(a)</b> na base${p.deslig ? ' (desligamento em ' + esc(brD(p.deslig)) + ')' : ''}. A comunicação de justa causa só é emitida para colaboradores ativos ou afastados.`; ok = false; FAL.forEach(k => g(`[data-k="${k}"]`).value = ''); marca(); return; }
        const D = { nome:p.nome, cpf:p.cpf, adm:(p.admissao || '').slice(0, 10), ctps:p.ctps, serie:p.serie, funcao:p.funcao, depto:p.ccd || '', setor:p.setor };
        FAL.forEach(k => g(`[data-k="${k}"]`).value = D[k] || '');
        st.className = 'jc-st ok'; st.innerHTML = `<b>${esc(p.nome)}</b> · ${esc(p.situacao || 'Ativo')}${p.area ? ' · ' + esc(p.area) : ''} · base de ${esc(brD(Q.referencia || ''))}`; ok = true; marca(); rasc(); };
      if (!ed) { g('#jc-mat').addEventListener('input', () => { clearTimeout(g('#jc-mat')._t); g('#jc-mat')._t = setTimeout(preencher, 250); }); if (r.mat) preencher(); } else marca();
      FAL.forEach(k => g(`[data-k="${k}"]`).addEventListener('input', marca));
      m.querySelectorAll('.jc-al input').forEach(i => i.onchange = () => i.parentElement.classList.toggle('on', i.checked));
      m.querySelectorAll('[data-tk="mat"]').forEach(i => i.addEventListener('input', () => { clearTimeout(i._t); i._t = setTimeout(() => { const t = i.dataset.t, p = pessoa(i.value);
        if (p && p.nome) { g(`[data-t="${t}"][data-tk="nome"]`).value = p.nome; g(`[data-t="${t}"][data-tk="cpf"]`).value = p.cpf || ''; msg(p.cpf ? '' : 'Testemunha ' + (+t + 1) + ': CPF não encontrado na base – preencher manualmente.'); rasc(); } }, 300); }));
      const valida = o => { if (!ok && !ed) return 'Informe a matrícula de um colaborador ativo ou afastado.'; if (!o.nome) return 'Preencha o nome do colaborador.';
        if (!o.alineas.length) return 'Marque ao menos uma alínea do Art. 482.'; if (!o.dataOc) return 'Informe a data da ocorrência.'; if (!o.dataDoc) return 'Informe a data do documento.';
        if (!o.desc.trim()) return 'Escreva a descrição da ocorrência.'; return ''; };
      g('#jc-c').onclick = fecharModal;
      g('#jc-ver').onclick = () => { const o = ler(); if (!o.mat && !ed) return msg('Informe a matrícula.'); visualizar(Object.assign({}, r, o, ed ? { mat:r.mat } : {})).catch(e => msg('Não consegui montar a visualização: ' + (e.message || e))); };
      const del = g('#jc-del'); if (del) del.onclick = async () => { if (!del.dataset.c) { del.dataset.c = 1; del.textContent = 'Confirmar exclusão'; return; }
        try { await salvar('emitidas', r._id, Object.assign({}, r, { _id:undefined, excluida:true, excluidaEm:new Date().toISOString(), excluidaPor:quem() })); fecharModal(); toast('Comunicação excluída.'); aoSalvar && aoSalvar(); } catch(e){ msg(traduzErro(e)); } };
      g('#jc-ok').onclick = async () => { const o = ler(); if (ed) o.mat = r.mat; const er = valida(o); if (er) return msg(er);
        const b = g('#jc-ok'); b.disabled = true; const agora = new Date().toISOString();
        const id = ed ? r._id : 'jc' + Date.now().toString(36);
        const reg = Object.assign({}, ed ? r : {}, o, { _id:undefined, atualizadoEm:agora, atualizadoPor:quem() }, ed ? {} : { criadoEm:agora, criadoPor:quem() });
        try { await salvar('emitidas', id, reg); RASCUNHO = null; const doc = await gerarPDF(Object.assign({}, reg, { _id:id })); baixar(doc.output('blob'), nomeArq(reg)); fecharModal(); toast(ed ? 'Comunicação atualizada e PDF gerado.' : 'Comunicação salva e PDF gerado.'); aoSalvar && aoSalvar(); }
        catch(e){ b.disabled = false; msg('Não consegui salvar: ' + traduzErro(e)); } };
    } });
}
function formTextos(aoSalvar){
  css();
  abrirModal({ titulo:'Textos do modelo da comunicação', largo:true, corpo:`<p style="margin-top:0">Se o modelo de vocês tiver outra redação, cole aqui o texto exato. Vale para as próximas comunicações e reimpressões. Use <b>{DATA_OCORRENCIA}</b>, <b>{DATA_DP}</b> e <b>{HORA_DP}</b> onde a data e o horário devem aparecer.</p>
    <div class="jc-g"><label class="s12">Título<input id="tx-t" value="${esc(TXT.titulo)}"></label><label class="s12">Parágrafo de abertura (Art. 482)<textarea id="tx-a" rows="4">${esc(TXT.abertura)}</textarea></label><label class="s12">Convocação ao Departamento de Pessoal<textarea id="tx-c" rows="3">${esc(TXT.convocacao)}</textarea></label><p class="nr-msg s12" id="tx-m" style="grid-column:span 12"></p></div>`,
    pe:`<button class="btn borda" id="tx-p">Voltar ao texto padrão</button><span style="flex:1"></span><button class="btn borda" id="tx-x">Cancelar</button><button class="btn prim" id="tx-ok">Salvar textos</button>`,
    aoAbrir: m => { m.querySelector('#tx-x').onclick = fecharModal;
      m.querySelector('#tx-p').onclick = () => { m.querySelector('#tx-t').value = TXT0.titulo; m.querySelector('#tx-a').value = TXT0.abertura; m.querySelector('#tx-c').value = TXT0.convocacao; };
      m.querySelector('#tx-ok').onclick = async () => { const o = { titulo:m.querySelector('#tx-t').value.trim(), abertura:m.querySelector('#tx-a').value.trim(), convocacao:m.querySelector('#tx-c').value.trim(), em:new Date().toISOString(), por:quem() };
        try { await salvar('cfg', 'textos', o); TXT = Object.assign({}, TXT0, { titulo:o.titulo || TXT0.titulo, abertura:o.abertura || TXT0.abertura, convocacao:o.convocacao || TXT0.convocacao }); fecharModal(); toast('Textos salvos.'); aoSalvar && aoSalvar(); } catch(e){ m.querySelector('#tx-m').textContent = traduzErro(e); } }; } });
}

/* ---------- tela ---------- */
async function tela(p, cfg, acao){
  css(); const pode = podeEditar(p); const F = { q:'', ano:String(new Date().getFullYear()), al:'' }; let L = [];
  E.painelAberto = p.id;
  moldura(`<div class="trilha"><button data-ir="#/">Visão Geral</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
    <section class="ini-topo capa" style="${(c => c ? '--c1:' + c[0] + ';--c2:' + c[1] : '')((window.CRV_CAPA || {})[p.frente])}"><div><div class="ini-eyebrow">${esc(p.frente)}</div><h1>Comunicação de Justa Causa</h1><div class="ini-data">Comunicação de Rescisão do Contrato de Trabalho por Justa Causa · Art. 482 da CLT</div></div>
      <div class="dk-acoes">${pode ? '<button class="btn prim" id="jc-novo">Nova comunicação</button><button class="btn borda" id="jc-tx">Textos do modelo</button>' : ''}</div></section>
    <div id="jc-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  const carregar = async () => { try { [L] = await Promise.all([regs(), textos(), quadro()]); } catch(e){ L = []; } desenhar(); };
  window.CRV_JC_NOVA = () => pode && form(null, carregar);
  if (pode) { $('#jc-novo').onclick = () => form(null, carregar); $('#jc-tx').onclick = () => formTextos(carregar); }
  const tag = r => `<span class="jc-al-t">${(r.alineas || []).map(a => `<span>${a})</span>`).join('')}</span>`;
  function desenhar(){
    const c = $('#jc-corpo'); if (!c) return;
    const anos = [...new Set(L.map(r => String(r.dataDoc || '').slice(0, 4)).filter(Boolean).concat(F.ano))].sort().reverse();
    const doAno = L.filter(r => !F.ano || String(r.dataDoc || '').startsWith(F.ano)), mes = hoje().slice(0, 7), noMes = L.filter(r => String(r.dataDoc || '').startsWith(mes));
    const cont = {}; doAno.forEach(r => (r.alineas || []).forEach(a => cont[a] = (cont[a] || 0) + 1)); const top = Object.entries(cont).sort((a, b) => b[1] - a[1])[0];
    const q = normal(F.q); const V = doAno.filter(r => (!q || normal(r.nome + ' ' + r.mat + ' ' + r.funcao + ' ' + r.setor + ' ' + r.depto).includes(q)) && (!F.al || (r.alineas || []).includes(F.al))).sort((a, b) => String(b.dataDoc).localeCompare(String(a.dataDoc)) || String(b.criadoEm).localeCompare(String(a.criadoEm)));
    c.innerHTML = `<section class="dk-kpis">
        <button class="dk-k ${!F.al ? 'on' : ''}" data-al="" style="--c:#8f1d12"><span>Emitidas em ${esc(F.ano || 'todos os anos')}</span><b>${doAno.length}</b><small>${new Set(doAno.map(r => r.mat)).size} colaborador(es)</small></button>
        <button class="dk-k" data-mes="1" style="--c:#b5731a"><span>Neste mês</span><b>${noMes.length}</b><small>${esc(MESES[+mes.slice(5) - 1])}/${mes.slice(0, 4)}</small></button>
        <button class="dk-k ${top && F.al === top[0] ? 'on' : ''}" data-al="${top ? top[0] : ''}" style="--c:#2f6fa8"><span>Alínea mais usada</span><b>${top ? top[0] + ')' : '—'}</b><small>${top ? esc(ALI.find(a => a[0] === top[0])[1].slice(0, 60)) + (ALI.find(a => a[0] === top[0])[1].length > 60 ? '…' : '') + ' · ' + top[1] + 'x' : 'nenhuma no período'}</small></button></section>
      <section class="dk-filtros cartao"><input id="jc-q" type="search" placeholder="Buscar nome, matrícula, função ou setor" value="${esc(F.q)}">
        <label>Ano <select id="jc-ano">${anos.map(a => `<option ${a === F.ano ? 'selected' : ''}>${a}</option>`).join('')}<option value="" ${!F.ano ? 'selected' : ''}>Todos</option></select></label>
        <label>Alínea <select id="jc-alf"><option value="">Todas</option>${ALI.map(a => `<option value="${a[0]}" ${F.al === a[0] ? 'selected' : ''}>${a[0]}) ${esc(a[1].slice(0, 50))}</option>`).join('')}</select></label>
        <span class="ad-cnt">${V.length} na lista</span></section>
      <section class="dk-lista">${V.map(r => `<article class="dk-p">
          <div class="dk-quem"><b><a class="cd-fl" href="#/ficha/${esc(r.mat)}">${esc(r.nome)}</a></b><span>Mat. ${esc(r.mat)} · ${esc(r.funcao || '')}${r.setor ? ' · ' + esc(r.setor) : ''}</span>
            <span class="dk-dt">Documento de <b>${esc(brD(r.dataDoc))}</b> · ocorrência em ${esc(brD(r.dataOc))}${r.dpData ? ' · DP em ' + esc(brD(r.dpData)) + (r.dpHora ? ' às ' + esc(brHora(r.dpHora)) : '') : ''}</span>
            <span class="dk-dt">Art. 482: ${tag(r)} · lançado por ${esc(r.criadoPor || '')}${r.atualizadoPor && r.atualizadoEm !== r.criadoEm ? ' · editado por ' + esc(r.atualizadoPor) : ''}</span></div>
          <div class="ad-bts" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${pode ? `<button class="btn borda peq" data-ab="${esc(r._id)}">Reabrir / editar</button>` : ''}<button class="btn borda peq" data-vi="${esc(r._id)}">Visualizar</button><button class="btn prim peq" data-pdf="${esc(r._id)}">Reimprimir</button></div></article>`).join('')
        || `<div class="cartao vazio"><h3>${L.length ? 'Nenhuma comunicação com esses filtros' : 'Nenhuma comunicação de justa causa emitida'}</h3>${pode && !L.length ? '<p>Use <b>Nova comunicação</b> para gerar a primeira.</p>' : ''}</div>`}</section>
      <p class="nr-fonte">Dados do colaborador pela matrícula na Base Geral de Colaboradores (Quadro). Cada comunicação emitida aparece no histórico disciplinar do colaborador (Perfil do Colaborador e Sanções Disciplinares) e na Conferência de Desligamentos, para conferir benefícios e concluir a rescisão. Para corrigir um erro, use Reabrir / editar ou Excluir.</p>`;
    c.querySelectorAll('[data-al]').forEach(b => b.onclick = () => { F.al = F.al === b.dataset.al ? '' : b.dataset.al; desenhar(); });
    const bm = c.querySelector('[data-mes]'); bm.onclick = () => { F.ano = mes.slice(0, 4); F.al = ''; F.q = ''; desenhar(); };
    const qi = $('#jc-q'); qi.oninput = () => { F.q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { desenhar(); const e = $('#jc-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 250); };
    $('#jc-ano').onchange = e => { F.ano = e.target.value; desenhar(); }; $('#jc-alf').onchange = e => { F.al = e.target.value; desenhar(); };
    const ach = id => L.find(r => r._id === id);
    c.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => form(ach(b.dataset.ab), carregar));
    c.querySelectorAll('[data-vi]').forEach(b => b.onclick = () => visualizar(ach(b.dataset.vi)).catch(e => toast('Não consegui montar a visualização: ' + (e.message || e), true)));
    c.querySelectorAll('[data-pdf]').forEach(b => b.onclick = async () => { const r = ach(b.dataset.pdf); baixar((await gerarPDF(r)).output('blob'), nomeArq(r)); });
  }
  await carregar();
  if (acao === 'jcn' && pode) form(null, carregar);
}
/* para o Perfil do Colaborador, Sanções e Conferência de Desligamentos */
async function daPessoa(mat){ return (await regs()).filter(r => fMat(r.mat) === fMat(mat)).sort((a, b) => String(b.dataDoc).localeCompare(String(a.dataDoc))); }
const resumoAl = r => (r.alineas || []).map(a => a + ')').join(', ');
return { tela, regs, daPessoa, resumoAl, ALI, gerarPDF, form };
};
