/* =====================================================================
   DISPENSA DO AVISO PRÉVIO (documento entregue junto com o papel de demissão)
   Escolhe a modalidade (aviso trabalhado, aviso indenizado ou justa causa) e o colaborador pela matrícula;
   os dados vêm da Base Geral de Colaboradores (Quadro). Gera o PDF no padrão único dos documentos do RH,
   com as assinaturas na mesma folha. O texto de cada modalidade pode ser ajustado e salvo como modelo
   (registros do Quadro, caminho 'sistema/dispensa-aviso'); o texto padrão é o modelo que o RH já usa.
   ===================================================================== */
window.CRV_DAV_INIT = function(X){
'use strict';
const { sb, E, $, esc, brD, abrirModal, fecharModal, toast, traduzErro, baixar } = X;
const quem = () => (E.perfil && E.perfil.nome) || '';
const tc = s => String(s || '').toLowerCase().replace(/(^|[\s\/(.-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Dos|Das|E) /g, m => m.toLowerCase()).replace(/\b(Ii|Iii|Iv|Rh|Crv|Dp|Td)\b/g, m => m.toUpperCase());
const fCPF = c => { c = String(c || '').replace(/\D/g, ''); if (c.length && c.length < 11) c = c.padStart(11, '0'); return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c; };
const MOD = [ { k:'trab', n:'Aviso prévio trabalhado' }, { k:'inde', n:'Aviso prévio indenizado' }, { k:'jc', n:'Justa causa' } ];
/* texto do modelo que o RH já usa (Dispensa_Aviso_Previo_trabalhado.docx); campos entre chaves são preenchidos sozinhos */
const ASSUNTO0 = 'Solicitação de dispensa do Aviso Prévio Trabalhado';
const CORPO0 = 'Eu, {NOME}, portador(a) do CPF {CPF} e matrícula {MATRICULA}, atualmente exercendo o cargo de {CARGO}, venho, por meio desta, solicitar formalmente minha dispensa do cumprimento do aviso prévio trabalhado, iniciado em {DATA_AVISO}.\n\nPor motivos {MOTIVO}, necessito encerrar minhas atividades imediatamente, não podendo continuar cumprindo o aviso prévio até a data inicialmente prevista. Estou ciente que será efetuado o desconto correspondente ao período não trabalhado, conforme previsto na legislação vigente.\n\nAgradeço pela atenção.';
let TXT = null, Q = null;
async function textos(){ if (TXT) return TXT; TXT = {};
  try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/dispensa-aviso').maybeSingle(); TXT = (data && data.dados && data.dados.mod) || {}; } catch(_){} return TXT; }
async function salvarTextos(){ const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'sistema/dispensa-aviso', colecao:'sistema', doc_id:'dispensa-aviso', dados:{ mod:TXT, em:new Date().toISOString(), por:quem() }, atualizado_por:quem() }, { onConflict:'painel,caminho' }); if (error) throw error; }
const modelo = k => Object.assign({ assunto:ASSUNTO0, corpo:CORPO0 }, TXT[k] || {});
const preencher = (t, r) => String(t || '').split('{NOME}').join(r.nome || '____________________').split('{CPF}').join(r.cpf || '___.___.___-__').split('{MATRICULA}').join(r.mat || '______').split('{CARGO}').join(r.cargo || '____________________')
  .split('{DATA_AVISO}').join(brD(r.dataAviso) || '____/____/______').split('{MOTIVO}').join(r.motivo || 'pessoais');

/* ---------- PDF no padrão do RH (cabeçalho CRV, rodapé com os dados da empresa), tudo numa folha ---------- */
function montar(r, K){
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'mm', format:'a4' }); const D = window.CRV_DOC; const L = 12, W = 186;
  const titulo = String(r.assunto || ASSUNTO0).replace(/^assunto:\s*/i, '');
  let y = D.titulo(doc, titulo, null);
  y = D.caixa(doc, y, [['Colaborador(a):', tc(r.nome)], ['Matrícula:', r.mat || '']]) - 3;
  y = D.caixa(doc, y, [['Cargo:', tc(r.cargo)], ['Modalidade:', (MOD.find(m => m.k === r.mod) || MOD[0]).n]]) + 4;
  y += 2 * K; doc.setTextColor(30, 36, 48);
  const fs = 10.4 * K, lh = 5.3 * K; doc.setFont('helvetica', 'normal'); doc.setFontSize(fs);
  preencher(r.corpo, r).replace(/\r/g, '').split('\n').forEach(pa => { if (!pa.trim()) { y += lh * .6; return; }
    const ls = doc.splitTextToSize(pa.trim(), W);
    ls.forEach((ln, i) => { const ws = ln.split(' ').filter(Boolean);
      if (i < ls.length - 1 && ws.length > 1) { const tw = ws.reduce((s, w) => s + doc.getTextWidth(w), 0), sp = (W - tw) / (ws.length - 1); let x = L; ws.forEach(w => { doc.text(w, x, y); x += doc.getTextWidth(w) + sp; }); }
      else doc.text(ln, L, y); y += lh; }); y += lh * .4; });
  /* assinaturas na mesma folha: colaborador (com data) e empresa */
  const ys = Math.max(y + 18, 228); const yy = D.assinaturas(doc, ys - 16, [{ nome:String(r.nome || '').toUpperCase(), cargo:'Colaborador(a) · Matrícula ' + (r.mat || '') }, { nome:'CRV INDUSTRIAL LTDA', cargo:'Empresa' }]);
  if (yy != null) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4); doc.setTextColor(30, 36, 48); const cx = doc.internal.pageSize.getWidth() / 2; doc.text('Data: ____/____/________', cx - 50, yy + 3, { align:'center' }); }
  D.moldura(doc);
  return { doc, cabe:yy != null && doc.getNumberOfPages() === 1 };
}
async function gerar(r){ let K = 1, B = montar(r, K); while (!B.cabe && K > .7) { K = Math.round((K - .05) * 100) / 100; B = montar(r, K); }
  try { if (window.CRV_PDF_LOGOS) await window.CRV_PDF_LOGOS(B.doc); } catch(_){} return B.doc; }
const nomeArq = r => 'Dispensa do aviso previo - ' + String(r.nome || '').split(' ').slice(0, 2).map(tc).join(' ') + ' ' + (r.mat || '') + '.pdf';

/* ---------- formulário ---------- */
const CSS = `.dv-g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px 12px}.dv-g label{display:flex;flex-direction:column;gap:4px;font-size:11.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--mut)}
.dv-g input,.dv-g textarea,.dv-g select{font:inherit;font-size:14px;font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:#fff}
.dv-g .s3{grid-column:span 3}.dv-g .s4{grid-column:span 4}.dv-g .s5{grid-column:span 5}.dv-g .s6{grid-column:span 6}.dv-g .s8{grid-column:span 8}.dv-g .s9{grid-column:span 9}.dv-g .s12{grid-column:span 12}
.dv-h{grid-column:span 12;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1f3a68;border-bottom:1px solid var(--line);padding-bottom:4px;margin-top:4px}
.dv-mod{grid-column:span 12;display:flex;gap:8px;flex-wrap:wrap}.dv-mod label{flex:1;min-width:170px;flex-direction:row;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;text-transform:none;letter-spacing:0;font-size:14px;color:var(--ink)}
.dv-mod label.on{border-color:#2e7d4f;background:#eef7f1;box-shadow:0 0 0 1px #2e7d4f inset}
.dv-st{grid-column:span 9;align-self:end;font-size:13px;color:var(--mut);padding-bottom:9px}.dv-av{grid-column:span 12;background:#fff7e6;border:1px solid #f0d199;border-radius:10px;padding:8px 12px;font-size:13px;color:#5c3b00}
.dv-tags{font-size:12px;color:var(--mut);text-transform:none;letter-spacing:0;font-weight:500}
@media(max-width:700px){.dv-g>*{grid-column:span 12!important}}`;
function css(){ if (!document.getElementById('dv-css')) { const s = document.createElement('style'); s.id = 'dv-css'; s.textContent = CSS; document.head.appendChild(s); } }
async function abrir(){
  css(); await textos(); if (!Q) { try { Q = await window.CRV_QUADRO(); } catch(_){ Q = null; } }
  const r = { mod:'trab', motivo:'pessoais' };
  abrirModal({ titulo:'Dispensa do aviso prévio', largo:true,
    corpo:`<div class="dv-g">
      <div class="dv-h">Para qual modalidade</div>
      <div class="dv-mod">${MOD.map(m => `<label class="${m.k === r.mod ? 'on' : ''}"><input type="radio" name="dv-mod" value="${m.k}" ${m.k === r.mod ? 'checked' : ''}> ${m.n}</label>`).join('')}</div>
      <div class="dv-h">Colaborador</div>
      <label class="s3">Matrícula<input id="dv-mat" inputmode="numeric" placeholder="Digite a matrícula"></label><div class="dv-st" id="dv-st">Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).</div>
      <label class="s8">Nome completo<input data-k="nome"></label><label class="s4">CPF<input data-k="cpf"></label>
      <label class="s6">Cargo<input data-k="cargo"></label><label class="s3">Início do aviso<input type="date" data-k="dataAviso"></label><label class="s3">Motivo<select data-k="motivo"><option value="pessoais">Pessoais</option><option value="profissionais">Profissionais</option><option value="pessoais e profissionais">Pessoais e profissionais</option></select></label>
      <div class="dv-h">Texto do documento</div>
      <div id="dv-av" class="dv-av" style="display:none"></div>
      <label class="s12">Assunto<input id="dv-as"></label>
      <label class="s12">Texto <span class="dv-tags">Campos preenchidos sozinhos: {NOME} {CPF} {MATRICULA} {CARGO} {DATA_AVISO} {MOTIVO}</span><textarea id="dv-co" rows="9"></textarea></label>
      <p class="nr-msg" id="dv-msg" style="grid-column:span 12;margin:0"></p></div>`,
    pe:`<button class="btn borda" id="dv-sm">Salvar texto como modelo desta modalidade</button><span style="flex:1"></span><button class="btn borda" id="dv-c">Cancelar</button><button class="btn borda" id="dv-ver">Visualizar</button><button class="btn prim" id="dv-ok">Imprimir / Gerar PDF</button>`,
    aoAbrir: m => {
      const g = s => m.querySelector(s), msg = (t, ok) => { const e = g('#dv-msg'); e.style.color = ok ? 'var(--cane)' : ''; e.textContent = t; };
      const carregarTexto = () => { const M = modelo(r.mod); g('#dv-as').value = M.assunto; g('#dv-co').value = M.corpo;
        const av = g('#dv-av'); const proprio = !!TXT[r.mod];
        if (r.mod !== 'trab' && !proprio) { av.style.display = ''; av.innerHTML = '<b>Atenção:</b> para ' + esc((MOD.find(x => x.k === r.mod) || {}).n || '') + ' ainda não há texto próprio salvo; está carregado o mesmo modelo do aviso trabalhado (com o desconto do período não trabalhado). Confira a redação com o DP e, se for outra, ajuste e clique em “Salvar texto como modelo desta modalidade”.'; }
        else av.style.display = 'none'; };
      carregarTexto();
      m.querySelectorAll('[name=dv-mod]').forEach(i => i.onchange = () => { r.mod = i.value; m.querySelectorAll('.dv-mod label').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)); carregarTexto(); });
      const set = (k, v) => { const e = m.querySelector(`[data-k="${k}"]`); if (e) e.value = v || ''; };
      g('#dv-mat').oninput = () => { const k = g('#dv-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); const c = Q && Q.mapa && Q.mapa[k]; const st = g('#dv-st');
        if (!k) { st.textContent = 'Ao digitar a matrícula, os dados vêm da Base Geral de Colaboradores (Quadro).'; return; }
        if (!c) { st.innerHTML = '<span style="color:#a3301c">Matrícula não encontrada no Quadro. Preencha os dados à mão.</span>'; return; }
        set('nome', c.nome); set('cpf', fCPF(c.cpf)); set('cargo', tc(c.funcao));
        st.innerHTML = `<b>${esc(tc(c.nome))}</b> · ${esc(tc(c.funcao))} · ${esc(tc(c.setor))} · ${c.situacao === 'Desligado' ? 'desligado em ' + esc(brD(c.deslig)) : esc(c.situacao || '')}`; };
      const ler = () => { const o = Object.assign({}, r, { mat:g('#dv-mat').value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''), assunto:g('#dv-as').value.trim() || ASSUNTO0, corpo:g('#dv-co').value });
        m.querySelectorAll('[data-k]').forEach(e => o[e.dataset.k] = e.value.trim()); return o; };
      const valida = o => { if (!o.nome) { msg('Informe a matrícula (ou o nome) do colaborador.'); return false; } if (/\{DATA_AVISO\}/.test(o.corpo) && !o.dataAviso) { msg('Informe a data de início do aviso (ou tire {DATA_AVISO} do texto).'); return false; } msg(''); return true; };
      g('#dv-c').onclick = fecharModal;
      g('#dv-sm').onclick = async () => { const b = g('#dv-sm'); b.disabled = true; try { TXT[r.mod] = { assunto:g('#dv-as').value.trim() || ASSUNTO0, corpo:g('#dv-co').value }; await salvarTextos(); carregarTexto(); msg('Texto salvo como modelo de ' + MOD.find(x => x.k === r.mod).n + '.', true); } catch(e){ msg(traduzErro(e)); } b.disabled = false; };
      g('#dv-ver').onclick = async () => { const o = ler(); if (!valida(o)) return; const u = URL.createObjectURL((await gerar(o)).output('blob')); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); };
      g('#dv-ok').onclick = async () => { const o = ler(); if (!valida(o)) return; const b = g('#dv-ok'); b.disabled = true; try { baixar((await gerar(o)).output('blob'), nomeArq(o)); toast('Documento gerado.'); fecharModal(); } catch(e){ b.disabled = false; msg('Não consegui gerar o PDF: ' + (e.message || e)); } };
    } });
}
return { abrir };
};
