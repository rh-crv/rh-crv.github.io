/* =====================================================================
   DOCUMENTOS DE DISPENSA (entregues junto com o papel de demissão)
   1) Dispensa (da empresa): aviso indenizado, aviso trabalhado ou justa causa — modelo
      DISPENSA_SEM_JUSTA_CAUSA_AVISO_INDENIZADO_CRV.docx, assinado pela coordenação de RH.
   2) Pedido do colaborador para não cumprir o aviso prévio trabalhado — modelo Dispensa_Aviso_Previo_trabalhado.docx.
   O colaborador vem da Base Geral de Colaboradores (Quadro) pela matrícula. PDF no padrão único dos documentos
   do RH (cabeçalho CRV, rodapé com os dados da empresa), tudo numa folha, sem mostrar quem emitiu.
   ===================================================================== */
window.CRV_DAV_INIT = function(X){
'use strict';
const { esc, brD, abrirModal, fecharModal, toast, baixar } = X;
const tc = s => String(s || '').toLowerCase().replace(/(^|[\s\/(.-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Dos|Das|E) /g, m => m.toLowerCase()).replace(/\b(Ii|Iii|Iv|Rh|Crv|Dp|Td)\b/g, m => m.toUpperCase());
const fCPF = c => { c = String(c || '').replace(/\D/g, ''); if (c.length && c.length < 11) c = c.padStart(11, '0'); return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c; };
const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const extenso = iso => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return ''; const M = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']; return 'Capinópolis/MG, ' + m[3] + ' de ' + M[+m[2] - 1] + ' de ' + m[1] + '.'; };
/* dispensa da empresa: título e como a modalidade aparece no texto */
const MOD = [ { k:'inde', n:'Aviso indenizado', tit:'Dispensa sem Justa Causa – Aviso Indenizado', txt:'aviso indenizado' },
              { k:'trab', n:'Aviso trabalhado', tit:'Dispensa sem Justa Causa – Aviso Trabalhado', txt:'aviso trabalhado' },
              { k:'jc',   n:'Justa causa',      tit:'Dispensa por Justa Causa',                    txt:'por justa causa' },
              { k:'acordo', n:'Comum acordo',   tit:'Rescisão do Contrato por Comum Acordo',       txt:'por comum acordo entre as partes, nos termos do art. 484-A da CLT', acordo:true } ];
/* frase principal da dispensa da empresa (comum acordo: assinada só pela coordenação de RH, como as demais) */
const frase = (M, f, nome, mat, data) => M.acordo
  ? 'O contrato de trabalho ' + (f ? 'da colaboradora ' : 'do colaborador ') + nome + ', matrícula ' + mat + ', está sendo encerrado no dia ' + data + ', ' + M.txt + '.'
  : (f ? 'A colaboradora ' : 'O colaborador ') + nome + ', matrícula ' + mat + ', está sendo ' + (f ? 'dispensada' : 'dispensado') + ' no dia ' + data + ', ' + M.txt + '.';
const DOCS = [ { k:'emp', n:'Dispensa (entregue pela empresa)', d:'Aviso indenizado, aviso trabalhado, justa causa ou comum acordo · assinado pela coordenação de RH' },
               { k:'ped', n:'Pedido do colaborador', d:'Quando o colaborador não quer cumprir o aviso prévio trabalhado' } ];
let Q = null;

/* ---------- PDF ---------- */
function cabecalho(doc, titulo, dataIso){ const C = window.CRV_DOC.cores; const y = 36;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...C.NAVY); doc.text(titulo, 12, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.INK); doc.text(extenso(dataIso), 12, y + 5.5); return y + 10; }
/* parágrafos justificados, com a folha distribuída: texto arejado e as assinaturas embaixo */
function paragrafos(doc, txts, y, K, L, W){ const fs = 12.4 * K, lh = 7.6 * K, gap = 6.5 * K; doc.setFont('helvetica', 'normal'); doc.setFontSize(fs); doc.setTextColor(30, 36, 48);
  const PAR = txts.map(t => String(t || '').trim()).filter(Boolean).map(t => doc.splitTextToSize(t, W));
  const alt = PAR.reduce((a, ls) => a + ls.length * lh, 0) + (PAR.length - 1) * gap, livre = Math.max(0, 222 - (y + 8) - alt);
  y += 10 + Math.min(14, livre * .12);
  PAR.forEach((ls, ip) => { ls.forEach((ln, i) => { const ws = ln.split(' ').filter(Boolean);
      if (i < ls.length - 1 && ws.length > 1) { const tw = ws.reduce((s, w) => s + doc.getTextWidth(w), 0), sp = (W - tw) / (ws.length - 1); let x = L; ws.forEach(w => { doc.text(w, x, y); x += doc.getTextWidth(w) + sp; }); }
      else doc.text(ln, L, y); y += lh; }); if (ip < PAR.length - 1) y += gap; });
  return y; }
function montar(r, K){
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'mm', format:'a4' }); const D = window.CRV_DOC; const L = 16, W = 178; let y, ass, extraData = false;
  if (r.doc === 'emp') { const M = MOD.find(m => m.k === r.mod) || MOD[0], fem = r.trat === 'a';
    y = cabecalho(doc, M.tit, r.dataDoc);
    y = D.caixa(doc, y, [['Colaborador(a):', tc(r.nome)], ['Matrícula:', r.mat || '']]) - 3;
    y = D.caixa(doc, y, [['Cargo:', tc(r.cargo)], [M.acordo ? 'Encerramento:' : 'Dispensa:', brD(r.dataDisp) + ' · ' + M.n]]) + 4;
    y = paragrafos(doc, [frase(M, fem, String(r.nome || '').toUpperCase(), r.mat || '', brD(r.dataDisp)), 'Por ser verdade, firmo o presente.'], y, K, L, W);
    ass = r.ass && r.ass.length ? r.ass : [{ nome:'Michelle Patrícia Alves Pereira', cargo:'Coordenadora de RH' }];
  }   // comum acordo também: só a assinatura da coordenação de RH
  else { y = cabecalho(doc, 'Solicitação de Dispensa do Aviso Prévio Trabalhado', r.dataDoc);
    y = D.caixa(doc, y, [['Colaborador(a):', tc(r.nome)], ['Matrícula:', r.mat || '']]) - 3;
    y = D.caixa(doc, y, [['Cargo:', tc(r.cargo)], ['Início do aviso:', brD(r.dataAviso)]]) + 4;
    y = paragrafos(doc, ['Eu, ' + String(r.nome || '').toUpperCase() + ', portador(a) do CPF ' + (r.cpf || '___.___.___-__') + ' e matrícula ' + (r.mat || '') + ', atualmente exercendo o cargo de ' + tc(r.cargo) + ', venho, por meio desta, solicitar formalmente minha dispensa do cumprimento do aviso prévio trabalhado, iniciado em ' + brD(r.dataAviso) + '.',
      'Por motivos ' + (r.motivo || 'pessoais') + ', necessito encerrar minhas atividades imediatamente, não podendo continuar cumprindo o aviso prévio até a data inicialmente prevista. Estou ciente que será efetuado o desconto correspondente ao período não trabalhado, conforme previsto na legislação vigente.',
      'Agradeço pela atenção.'], y, K, L, W);
    ass = [{ nome:String(r.nome || '').toUpperCase(), cargo:'Colaborador(a) · Matrícula ' + (r.mat || '') }, { nome:'CRV INDUSTRIAL LTDA', cargo:'Empresa' }]; extraData = true; }
  /* assinaturas na mesma folha */
  /* texto curto (dispensa da empresa): assinatura mais perto do texto, sem buraco no meio da folha */
  y += extraData ? 30 : 42; const ys = Math.min(Math.max(y, extraData ? 222 : 178), 240); const yy = D.assinaturas(doc, ys - 16, ass);
  if (yy != null && extraData) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4); doc.setTextColor(30, 36, 48); doc.text('Data: ____/____/________', doc.internal.pageSize.getWidth() / 2 - 50, yy + 3, { align:'center' }); }
  D.moldura(doc);
  return { doc, cabe:yy != null && doc.getNumberOfPages() === 1 };
}
async function gerar(r){ if (r.doc === 'emp') { try { const A = window.CRV_ASSINANTES ? await window.CRV_ASSINANTES('dispensa') : []; if (A && A.length) r.ass = A.map(a => ({ nome:tc(a.nome), cargo:a.cargo })); } catch(_){} }
  let K = 1, B = montar(r, K); while (!B.cabe && K > .7) { K = Math.round((K - .05) * 100) / 100; B = montar(r, K); }
  try { if (window.CRV_PDF_LOGOS) await window.CRV_PDF_LOGOS(B.doc); } catch(_){} return B.doc; }
const nomeArq = r => (r.doc === 'emp' ? 'Dispensa - ' + ((MOD.find(m => m.k === r.mod) || MOD[0]).n) : 'Pedido de dispensa do aviso') + ' - ' + String(r.nome || '').split(' ').slice(0, 2).map(tc).join(' ') + ' ' + (r.mat || '') + '.pdf';

/* ---------- formulário ---------- */
const CSS = `.dv-g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px 12px}.dv-g label{display:flex;flex-direction:column;gap:4px;font-size:11.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--mut)}
.dv-g input,.dv-g select{font:inherit;font-size:14px;font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:#fff}
.dv-g .s3{grid-column:span 3}.dv-g .s4{grid-column:span 4}.dv-g .s6{grid-column:span 6}.dv-g .s8{grid-column:span 8}.dv-g .s12{grid-column:span 12}
.dv-h{grid-column:span 12;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1f3a68;border-bottom:1px solid var(--line);padding-bottom:4px;margin-top:4px}
.dv-op{grid-column:span 12;display:flex;gap:8px;flex-wrap:wrap}.dv-op label{flex:1;min-width:170px;flex-direction:row;align-items:flex-start;gap:8px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;text-transform:none;letter-spacing:0;font-size:14px;color:var(--ink)}
.dv-op label small{display:block;font-size:12px;font-weight:500;color:var(--mut);margin-top:2px}.dv-op label.on{border-color:#2e7d4f;background:#eef7f1;box-shadow:0 0 0 1px #2e7d4f inset}
.dv-st{grid-column:span 9;align-self:end;font-size:13px;color:var(--mut);padding-bottom:9px}.dv-prev{grid-column:span 12;background:#f6f7f9;border-radius:10px;padding:10px 14px;font-size:13.5px;color:var(--ink);line-height:1.5}
@media(max-width:700px){.dv-g>*{grid-column:span 12!important}}`;
function css(){ if (!document.getElementById('dv-css')) { const s = document.createElement('style'); s.id = 'dv-css'; s.textContent = CSS; document.head.appendChild(s); } }
async function abrir(){
  css(); if (!Q) { try { Q = await window.CRV_QUADRO(); } catch(_){ Q = null; } }
  const r = { doc:'emp', mod:'inde' };
  const ops = (nm, L, val) => L.map(m => `<label class="${m.k === val ? 'on' : ''}"><input type="radio" name="${nm}" value="${m.k}" ${m.k === val ? 'checked' : ''}><span><b>${esc(m.n)}</b>${m.d ? `<small>${esc(m.d)}</small>` : ''}</span></label>`).join('');
  abrirModal({ titulo:'Documento de dispensa', largo:true,
    corpo:`<div class="dv-g">
      <div class="dv-h">Qual documento</div><div class="dv-op">${ops('dv-doc', DOCS, r.doc)}</div>
      <div class="dv-h dv-emp">Modalidade</div><div class="dv-op dv-emp">${ops('dv-mod', MOD, r.mod)}</div>
      <div class="dv-h">Colaborador</div>
      <label class="s3">Matrícula<input id="dv-mat" inputmode="numeric" placeholder="Digite a matrícula"></label><div class="dv-st" id="dv-st">Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).</div>
      <label class="s8">Nome completo<input data-k="nome"></label><label class="s4 dv-emp">Tratamento<select data-k="trat"><option value="o">O colaborador</option><option value="a">A colaboradora</option></select></label><label class="s4 dv-ped">CPF<input data-k="cpf"></label>
      <label class="s6">Cargo<input data-k="cargo"></label>
      <label class="s3 dv-emp">Data da dispensa<input type="date" data-k="dataDisp" value="${hoje()}"></label>
      <label class="s3 dv-ped">Início do aviso<input type="date" data-k="dataAviso"></label><label class="s3 dv-ped">Motivo<select data-k="motivo"><option value="pessoais">Pessoais</option><option value="profissionais">Profissionais</option><option value="pessoais e profissionais">Pessoais e profissionais</option></select></label>
      <label class="s3">Data do documento<input type="date" data-k="dataDoc" value="${hoje()}"></label>
      <div class="dv-h">Como vai sair o texto</div><div class="dv-prev" id="dv-prev"></div>
      <p class="nr-msg" id="dv-msg" style="grid-column:span 12;margin:0"></p></div>`,
    pe:`<span style="flex:1"></span><button class="btn borda" id="dv-c">Cancelar</button><button class="btn borda" id="dv-ver">Visualizar</button><button class="btn prim" id="dv-ok">Imprimir / Gerar PDF</button>`,
    aoAbrir: m => {
      const g = s => m.querySelector(s), msg = t => { g('#dv-msg').textContent = t; };
      const ler = () => { const o = Object.assign({}, r, { mat:g('#dv-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, '') }); m.querySelectorAll('[data-k]').forEach(e => o[e.dataset.k] = e.value.trim()); return o; };
      const prev = () => { const o = ler(), N = String(o.nome || '(nome)').toUpperCase();
        if (o.doc === 'emp') { const M = MOD.find(x => x.k === o.mod), f = o.trat === 'a'; g('#dv-prev').innerHTML = `<b>${esc(M.tit)}</b><br>${esc(frase(M, f, N, o.mat || '(matrícula)', brD(o.dataDisp) || '(data)'))}<br>${'Por ser verdade, firmo o presente.'}<br><span style="color:var(--mut)">Assinatura: coordenação de RH</span>`; }
        else g('#dv-prev').innerHTML = `<b>Solicitação de Dispensa do Aviso Prévio Trabalhado</b><br>Eu, ${esc(N)}, portador(a) do CPF ${esc(o.cpf || '(CPF)')} e matrícula ${esc(o.mat || '(matrícula)')}, … solicitar formalmente minha dispensa do cumprimento do aviso prévio trabalhado, iniciado em ${esc(brD(o.dataAviso) || '(data)')}. Por motivos ${esc(o.motivo)}, … desconto correspondente ao período não trabalhado …<br><span style="color:var(--mut)">Assinaturas: colaborador(a) e empresa</span>`; };
      const vis = () => { m.querySelectorAll('.dv-emp').forEach(e => e.style.display = r.doc === 'emp' ? '' : 'none'); m.querySelectorAll('.dv-ped').forEach(e => e.style.display = r.doc === 'ped' ? '' : 'none'); prev(); };
      const radios = (nm, k) => m.querySelectorAll(`[name=${nm}]`).forEach(i => i.onchange = () => { r[k] = i.value; i.closest('.dv-op').querySelectorAll('label').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)); vis(); });
      radios('dv-doc', 'doc'); radios('dv-mod', 'mod'); vis();
      m.querySelectorAll('[data-k]').forEach(e => { e.addEventListener('input', prev); e.addEventListener('change', prev); });
      const set = (k, v) => { const e = m.querySelector(`[data-k="${k}"]`); if (e) e.value = v || ''; };
      g('#dv-mat').oninput = () => { const k = g('#dv-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); const c = Q && Q.mapa && Q.mapa[k]; const st = g('#dv-st');
        if (!k) st.textContent = 'Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).';
        else if (!c) st.innerHTML = '<span style="color:#a3301c">Matrícula não encontrada no Quadro. Preencha os dados à mão.</span>';
        else { set('nome', c.nome); set('cpf', fCPF(c.cpf)); set('cargo', tc(c.funcao)); if (/^F/i.test(c.sexo || '')) set('trat', 'a'); else if (/^M/i.test(c.sexo || '')) set('trat', 'o');
          if (c.situacao === 'Desligado' && /^\d{4}-\d{2}-\d{2}/.test(c.deslig || '')) set('dataDisp', String(c.deslig).slice(0, 10));
          st.innerHTML = `<b>${esc(tc(c.nome))}</b> · ${esc(tc(c.funcao))} · ${esc(tc(c.setor))} · ${c.situacao === 'Desligado' ? 'desligado em ' + esc(brD(c.deslig)) : esc(c.situacao || '')}`; }
        prev(); };
      const valida = o => { if (!o.nome) { msg('Informe a matrícula (ou o nome) do colaborador.'); return false; }
        if (o.doc === 'emp' && !o.dataDisp) { msg('Informe a data da dispensa.'); return false; } if (o.doc === 'ped' && !o.dataAviso) { msg('Informe a data de início do aviso.'); return false; } msg(''); return true; };
      g('#dv-c').onclick = fecharModal;
      g('#dv-ver').onclick = async () => { const o = ler(); if (!valida(o)) return; const u = URL.createObjectURL((await gerar(o)).output('blob')); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); };
      g('#dv-ok').onclick = async () => { const o = ler(); if (!valida(o)) return; const b = g('#dv-ok'); b.disabled = true; try { baixar((await gerar(o)).output('blob'), nomeArq(o)); toast('Documento gerado.'); fecharModal(); } catch(e){ b.disabled = false; msg('Não consegui gerar o PDF: ' + (e.message || e)); } };
    } });
}
/* =====================================================================
   DECLARAÇÃO DE TRABALHO (modelo da coordenação de RH): colaborador ativo, com CPF, RG, cargo e admissão.
   ===================================================================== */
/* parágrafo justificado com trechos em negrito: segs = [[texto, negrito], ...] */
function paragrafoRico(doc, segs, y, L, W, fs, lh){ doc.setFontSize(fs); doc.setTextColor(30, 36, 48);
  const T = []; segs.forEach(([t, b]) => String(t).split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { if (T.length) T[T.length - 1].sp = true; return; } T.push({ w, b:!!b, sp:false }); }));
  const larg = o => { doc.setFont('helvetica', o.b ? 'bold' : 'normal'); return doc.getTextWidth(o.w); }; doc.setFont('helvetica', 'normal'); const esp = doc.getTextWidth(' ');
  const linhas = []; let cur = [], cw = 0;
  T.forEach((o, i) => { const lw = larg(o), add = (cur.length && T[i - 1].sp ? esp : 0) + lw; if (cur.length && cw + add > W) { linhas.push(cur); cur = [o]; cw = lw; } else { cur.push(o); cw += add; } o.lw = lw; }); if (cur.length) linhas.push(cur);
  linhas.forEach((ln, li) => { const ult = li === linhas.length - 1; const tw = ln.reduce((a, o) => a + o.lw, 0); const nGaps = ln.filter((o, k) => k < ln.length - 1 && o.sp).length;
    const gap = !ult && nGaps ? (W - tw) / nGaps : esp; let x = L;
    ln.forEach((o, k) => { doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.text(o.w, x, y); x += o.lw + (k < ln.length - 1 && o.sp ? gap : 0); }); y += lh; });
  return y; }
async function gerarDecl(r){
  let ass = [{ nome:'Michelle Patrícia Alves Pereira', cargo:'Coordenadora de RH' }];
  try { const A = window.CRV_ASSINANTES ? await window.CRV_ASSINANTES('declaracao') : []; if (A && A.length) ass = A.map(a => ({ nome:tc(a.nome), cargo:a.cargo })); } catch(_){}
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'mm', format:'a4' }); const D = window.CRV_DOC; const L = 18, W = 174, f = r.trat === 'a';
  let y = cabecalho(doc, 'Declaração de Trabalho', r.dataDoc) + 26;
  y = paragrafoRico(doc, [['Declaramos, para os devidos fins, que '], [String(r.nome || '').toUpperCase(), 1], [', ' + (f ? 'inscrita' : 'inscrito') + ' no CPF nº '], [r.cpf || '', 1],
    [r.rg ? ' e ' + (f ? 'portadora' : 'portador') + ' do RG nº ' : ''], [r.rg || '', 1], [', ocupa o cargo de ' + String(r.cargo || '').toUpperCase() + ' na empresa '], ['CRV Industrial Ltda.', 1], [', inscrita no CNPJ nº '], ['03.937.452/0004-35', 1],
    [', desde '], [brD(r.adm), 1], [', encontrando-se '], [(f ? 'atualmente ativa' : 'atualmente ativo') + ' no quadro de colaboradores da empresa', 1], ['.']], y, L, W, 12.4, 7.8);
  y += 6; y = paragrafoRico(doc, [['Por ser expressão da verdade, firmamos a presente declaração para os fins que se fizerem necessários.']], y, L, W, 12.4, 7.8);
  D.assinaturas(doc, Math.max(y + 40, 190) - 16, ass);
  D.moldura(doc); try { if (window.CRV_PDF_LOGOS) await window.CRV_PDF_LOGOS(doc); } catch(_){} return doc; }
async function abrirDecl(){
  css(); if (!Q) { try { Q = await window.CRV_QUADRO(); } catch(_){ Q = null; } }
  abrirModal({ titulo:'Declaração de trabalho', largo:true,
    corpo:`<div class="dv-g">
      <div class="dv-h">Colaborador</div>
      <label class="s3">Matrícula<input id="dc-mat" inputmode="numeric" placeholder="Digite a matrícula"></label><div class="dv-st" id="dc-st">Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).</div>
      <label class="s8">Nome completo<input data-k="nome"></label><label class="s4">Tratamento<select data-k="trat"><option value="o">Masculino (inscrito, ativo)</option><option value="a">Feminino (inscrita, ativa)</option></select></label>
      <label class="s4">CPF<input data-k="cpf"></label><label class="s4">RG<input data-k="rg"></label><label class="s4">Admissão<input type="date" data-k="adm"></label>
      <label class="s8">Cargo<input data-k="cargo"></label><label class="s4">Data do documento<input type="date" data-k="dataDoc" value="${hoje()}"></label>
      <div class="dv-h">Como vai sair o texto</div><div class="dv-prev" id="dc-prev"></div>
      <p class="nr-msg" id="dc-msg" style="grid-column:span 12;margin:0"></p></div>`,
    pe:`<span style="flex:1"></span><button class="btn borda" id="dc-c">Cancelar</button><button class="btn borda" id="dc-ver">Visualizar</button><button class="btn prim" id="dc-ok">Imprimir / Gerar PDF</button>`,
    aoAbrir: m => {
      const g = s => m.querySelector(s), msg = t => { g('#dc-msg').textContent = t; };
      const ler = () => { const o = { mat:g('#dc-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, '') }; m.querySelectorAll('[data-k]').forEach(e => o[e.dataset.k] = e.value.trim()); return o; };
      const prev = () => { const o = ler(), f = o.trat === 'a'; g('#dc-prev').innerHTML = `Declaramos, para os devidos fins, que <b>${esc(String(o.nome || '(nome)').toUpperCase())}</b>, ${f ? 'inscrita' : 'inscrito'} no CPF nº <b>${esc(o.cpf || '(CPF)')}</b>${o.rg ? ` e ${f ? 'portadora' : 'portador'} do RG nº <b>${esc(o.rg)}</b>` : ''}, ocupa o cargo de ${esc(String(o.cargo || '(cargo)').toUpperCase())} na empresa <b>CRV Industrial Ltda.</b>, inscrita no CNPJ nº <b>03.937.452/0004-35</b>, desde <b>${esc(brD(o.adm) || '(admissão)')}</b>, encontrando-se <b>${f ? 'atualmente ativa' : 'atualmente ativo'} no quadro de colaboradores da empresa</b>.<br>Por ser expressão da verdade, firmamos a presente declaração para os fins que se fizerem necessários.<br><span style="color:var(--mut)">Assinatura: coordenação de RH</span>`; };
      m.querySelectorAll('[data-k]').forEach(e => { e.addEventListener('input', prev); e.addEventListener('change', prev); }); prev();
      const set = (k, v) => { const e = m.querySelector(`[data-k="${k}"]`); if (e) e.value = v || ''; };
      g('#dc-mat').oninput = () => { const k = g('#dc-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); const c = Q && Q.mapa && Q.mapa[k]; const st = g('#dc-st');
        if (!k) st.textContent = 'Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).';
        else if (!c) st.innerHTML = '<span style="color:#a3301c">Matrícula não encontrada no Quadro. Preencha os dados à mão.</span>';
        else { set('nome', c.nome); set('cpf', fCPF(c.cpf)); set('rg', c.rg ? (/^[A-Za-z]/.test(c.rg) ? '' : (c.rgUf || '')) + c.rg : ''); set('cargo', tc(c.funcao)); set('adm', String(c.admissao || '').slice(0, 10)); if (/^F/i.test(c.sexo || '')) set('trat', 'a'); else if (/^M/i.test(c.sexo || '')) set('trat', 'o');
          st.innerHTML = `<b>${esc(tc(c.nome))}</b> · ${esc(tc(c.funcao))} · ${esc(tc(c.setor))} · ${c.situacao === 'Desligado' ? '<span style="color:#a3301c">desligado em ' + esc(brD(c.deslig)) + ': a declaração diz que está ativo</span>' : esc(c.situacao || '')}`; }
        prev(); };
      const valida = o => { if (!o.nome || !o.cpf || !o.cargo || !o.adm) { msg('Preencha nome, CPF, cargo e admissão.'); return false; } msg(''); return true; };
      const nomeA = o => 'Declaracao de trabalho - ' + String(o.nome || '').split(' ').slice(0, 2).map(tc).join(' ').normalize('NFD').replace(/[̀-ͯ]/g, '') + ' ' + (o.mat || '') + '.pdf';
      g('#dc-c').onclick = fecharModal;
      g('#dc-ver').onclick = async () => { const o = ler(); if (!valida(o)) return; const u = URL.createObjectURL((await gerarDecl(o)).output('blob')); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); };
      g('#dc-ok').onclick = async () => { const o = ler(); if (!valida(o)) return; const b = g('#dc-ok'); b.disabled = true; try { baixar((await gerarDecl(o)).output('blob'), nomeA(o)); toast('Declaração gerada.'); fecharModal(); } catch(e){ b.disabled = false; msg('Não consegui gerar o PDF: ' + (e.message || e)); } };
    } });
}
return { abrir, abrirDecl };
};
