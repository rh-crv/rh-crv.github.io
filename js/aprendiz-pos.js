/* =====================================================================
   APROVEITAMENTO PÓS-PROGRAMA (Programa Jovem Aprendiz)
   Quais jovens que passaram pelo programa (CRV, RENAPSI, Instituto João Bittar) foram contratados depois,
   em outra função, nas empresas 5 (CRV), 6 (APFO) e 16 (CAPFO). Cruzamento só pelo CPF.
   Jovens: planilha importada aqui (painel 'aprendiz-pos', coleção 'jovens', em blocos).
   Colaboradores: Base Geral (Quadro) — ativos e desligados das 3 empresas, com a data de saída.
   Casos duvidosos ficam em "A conferir" e só entram no indicador depois de validados (coleção 'valid').
   ===================================================================== */
window.CRV_APOS_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, podeEditar, moldura, abrirModal, fecharModal, toast, traduzErro, baixar } = X;
const PAINEL = 'aprendiz-pos', EMPS = ['5', '6', '16'], EMPN = { '5':'CRV (5)', '6':'APFO (6)', '16':'CAPFO (16)' };
const ORIG = ['CRV', 'RENAPSI', 'João Bittar'], ORC = { 'CRV':'#2e7d4f', 'RENAPSI':'#2f6fa8', 'João Bittar':'#b5731a' };
const quem = () => (E.perfil && E.perfil.nome) || '';
const hoje = () => new Date().toISOString().slice(0, 10);
const nf = v => (+v || 0).toLocaleString('pt-BR');
const pct = (a, b) => b ? (Math.round(1000 * a / b) / 10).toString().replace('.', ',') + '%' : '—';
/* CPF: só dígitos, completa com zeros à esquerda até 11; válido = dígitos verificadores corretos */
const cpfN = v => { let d = String(v == null ? '' : v).replace(/\.0+$/, '').replace(/\D/g, ''); if (!d) return ''; if (d.length < 11) d = d.padStart(11, '0'); return d; };
const cpfOk = d => { if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false; const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; }; return dv(9) === +d[9] && dv(10) === +d[10]; };
const cpfF = d => /^\d{11}$/.test(d) ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : (d || '');
const tok = s => normal(s).toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !['DOS', 'DAS', 'DES'].includes(t));
const nomeParecido = (a, b) => { const x = tok(a), y = tok(b); if (!x.length || !y.length) return true; if (x[0] === y[0]) return true; const c = x.filter(t => y.includes(t)).length; return c / Math.min(x.length, y.length) >= .5; };
const dIso = v => { if (v == null || v === '') return ''; if (typeof v === 'number' && v > 20000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().slice(0, 10); }
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10); const t = String(v).trim(); let m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(t);
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); } m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t); return m ? m[0] : ''; };
const origDe = v => { const t = normal(v); return /renapsi/.test(t) ? 'RENAPSI' : /bittar|joao|instituto/.test(t) ? 'João Bittar' : /crv|diret|propri|empresa/.test(t) ? 'CRV' : ''; };
const ehApr = f => /aprendi/i.test(normal(f));
const dias = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const tempoTxt = d => d == null ? '—' : d < 60 ? d + ' dias' : (Math.round(d / 30.44 * 10) / 10).toString().replace('.', ',') + ' meses';

/* ---------- dados ---------- */
async function lerJovens(){ const R = await window.CRV_REGS(PAINEL, 'jovens'); const meta = R.find(x => x._id === 'meta') || null;
  const rows = []; R.filter(x => /^b\d+$/.test(x._id)).sort((a, b) => +a._id.slice(1) - +b._id.slice(1)).forEach(b => (b.rows || []).forEach(r => rows.push(r))); return { meta, rows }; }
async function lerValid(){ const o = {}; (await window.CRV_REGS(PAINEL, 'valid')).forEach(v => { if (!v.excluida) o[v._id] = v; }); return o; }
async function salvar(col, id, dados){ const { error } = await sb.from('registros').upsert({ painel:PAINEL, caminho:col + '/' + id, colecao:col, doc_id:id, dados, atualizado_por:quem() }, { onConflict:'painel,caminho' }); if (error) throw error; }
async function baseColab(){
  const Q = await window.CRV_DADOS('quadro'); if (!Q || !Q.dados) return null;
  const { D = [], DM = [], PID = [], CPFP = [], CPFM = {}, OUTAT = null } = Q.dados; const XX = Q.dados.X || [];
  const P = new Map(); const add = (c, o) => { const k = cpfN(c); if (!k) return; if (!P.has(k)) P.set(k, []); P.get(k).push(o); };
  /* confere se a lista de CPFs por pessoa (CPFP) está alinhada com os desligados: compara com o CPF por matrícula da CRV (CPFM) */
  let ok = 0, tot = 0; DM.forEach(r => { if (!/\(5\)/.test(String(r[21]))) return; const a = CPFM[String(r[0])]; if (!a || r[26] == null) return; tot++; if (cpfN(a) === cpfN(CPFP[r[26]])) ok++; });
  const cpfpOk = !tot || ok / tot >= .95;
  D.forEach((r, i) => add((XX[i] && XX[i][11]) || CPFM[String(r[0])] || (PID[i] != null && CPFP[PID[i]]) || '', { emp:'5', mat:String(r[0]), nome:r[1], funcao:r[2] || '', depto:r[13] || r[3] || '', setor:r[3] || '', adm:String(r[9] || '').slice(0, 10), sit:r[8] || 'Ativo', saida:'' }));
  DM.forEach(r => { const ec = (/\((\d+)\)/.exec(String(r[21])) || [])[1]; if (!EMPS.includes(ec)) return;
    const c = ec === '5' ? (CPFM[String(r[0])] || (cpfpOk && r[26] != null ? CPFP[r[26]] : '')) : (cpfpOk && r[26] != null ? CPFP[r[26]] : '');
    add(c || '', { emp:ec, mat:String(r[0]), nome:r[1], funcao:r[2] || '', depto:r[13] || r[3] || '', setor:r[3] || '', adm:String(r[9] || '').slice(0, 10), sit:'Desligado', saida:String(r[20] || '').slice(0, 10) }); });
  (OUTAT || []).forEach(r => { const ec = (/\((\d+)\)/.exec(String(r[7])) || [])[1]; if (!EMPS.includes(ec)) return;
    add(cpfpOk ? CPFP[r[9]] || '' : '', { emp:ec, mat:String(r[0]), nome:r[1], funcao:r[2] || '', depto:r[8] || r[3] || '', setor:r[3] || '', adm:String(r[6] || '').slice(0, 10), sit:/AFAST/.test(String(r[10])) ? 'Afastado' : 'Ativo', saida:'' }); });
  P.forEach(L => L.sort((a, b) => String(a.adm).localeCompare(String(b.adm))));
  return { P, ref:Q.referencia || '', temOutros: Array.isArray(OUTAT), cpfpOk, alin:tot ? Math.round(100 * ok / tot) : 100 };
}
const chaveReg = h => h.emp + '|' + h.mat + '|' + h.adm;
/* cruzamento */
function cruzar(J, B, V, incluiBase){
  const hj = hoje(), grupos = new Map(), pess = [];
  J.rows.forEach((r, i) => { const c = cpfN(r.cpf); const k = cpfOk(c) ? c : 'x' + i; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(r); });
  /* aprendizes contratados direto pelo grupo: vêm da própria Base Geral (registro com função de aprendiz), se não estiverem nas planilhas */
  if (incluiBase) B.P.forEach((L, c) => { if (grupos.has(c)) return; const A = L.filter(x => ehApr(x.funcao)); if (!A.length) return; A.sort((a, b) => String(a.adm).localeCompare(String(b.adm)));
    const u = A[A.length - 1]; grupos.set(c, A.map(x => ({ nome:x.nome, cpf:c, origem:'CRV', ini:x.adm, fim:x.saida || '', setor:x.depto, mat:x.mat, base:true, emp:x.emp }))); });
  /* cada passagem pelo programa conta: o mesmo jovem na RENAPSI e depois no João Bittar aparece duas vezes (uma por instituição).
     Linhas idênticas (mesmo CPF, origem, início e fim) são repetição da planilha e contam uma vez só. */
  const ENT = [];
  grupos.forEach((L0, k) => { const vis = new Set(), L = L0.filter(x => { const z = (x.origem || '') + '|' + (x.ini || '') + '|' + (x.fim || ''); if (vis.has(z)) return false; vis.add(z); return true; });
    const porO = new Map(); L.forEach(x => { const o = x.origem || ''; if (!porO.has(o)) porO.set(o, []); porO.get(o).push(x); });
    const es = [...porO.entries()].map(([o, LL]) => { LL.sort((a, b) => String(a.ini || '').localeCompare(String(b.ini || '')) || String(a.fim || '').localeCompare(String(b.fim || ''))); return { k, o, L:LL, u:LL[LL.length - 1], ini:LL.map(x => x.ini).filter(Boolean).sort()[0] || '', dup:L0.length - L.length }; })
      .sort((a, b) => String(a.ini).localeCompare(String(b.ini)));
    es.forEach((e, n) => { e.prox = es[n + 1] || null; e.multi = es.length > 1; ENT.push(e); }); });
  ENT.forEach(e => { const k = e.k, L = e.L, u = e.u, nx = e.prox;
    const fimPl = u.fim || '', fimE = nx && nx.ini && (!fimPl || fimPl > nx.ini) ? nx.ini : fimPl;
    const p = { k, cpf:k[0] === 'x' ? cpfN(u.cpf) : k, cpfRaw:u.cpf, nome:u.nome, origem:u.origem || '', motivo:u.motivo || '', daBase:!!u.base, empA:u.empA || (u.emp ? EMPN[u.emp] : ''), ini:e.ini, fim:fimE, fimPlan:fimE !== fimPl ? fimPl : '', setorA:u.setor || '', matA:u.mat || '', contratos:L.length, dup:e.dup, origens:[u.origem].filter(Boolean),
      prox:nx ? nx.o : '', proxIni:nx ? nx.ini : '' };
    p.vk = p.cpf + '|' + p.origem;
    p.anoFim = p.fim ? p.fim.slice(0, 4) : ''; p.concl = !!p.fim && p.fim <= hj;
    const regs = k[0] === 'x' ? [] : (B.P.get(k) || []); p.regs = regs;
    const ate = p.proxIni || '9999'; const nonApr = regs.filter(x => !ehApr(x.funcao) && (!p.proxIni || x.adm < p.proxIni)); const depois = p.fim ? nonApr.filter(x => x.adm && x.adm > p.fim && x.adm < ate) : []; const antes = p.fim ? nonApr.filter(x => x.adm && x.adm <= p.fim && (!e.multi || x.adm >= p.ini)) : [];
    if (p.prox) p.transf = true;
    const nomeDif = regs.length && !regs.some(x => nomeParecido(p.nome, x.nome));
    const v = V[p.vk] || (e.prox || ENT.some(z => z !== e && z.k === k) ? null : V[p.cpf]); p.st = 'nao'; p.mot = '';
    if (k[0] === 'x') { p.st = 'conf'; p.mot = String(u.cpf || '').trim() ? 'CPF inválido na planilha de jovens' : 'CPF vazio na planilha de jovens'; }
    else if (v && v.d === 'nao') { p.st = 'nao'; p.valid = v; }
    else if (v && v.d === 'sim') { p.h = nonApr.find(x => chaveReg(x) === v.k) || depois[0] || antes[0] || null; p.st = p.h ? 'cont' : 'conf'; p.valid = v; if (!p.h) p.mot = 'Contratação validada não encontrada na base atual'; }
    else if (!p.fim) { if (nonApr.length) { p.st = 'conf'; p.mot = 'Sem data de término do contrato de aprendiz na planilha'; } }
    else if (nomeDif && nonApr.length) { p.st = 'conf'; p.mot = 'CPF igual, nome muito diferente (base: ' + regs[0].nome + ')'; }
    else if (depois.length > 1) { p.st = 'conf'; p.mot = 'Mesmo CPF com ' + depois.length + ' contratações depois do programa'; }
    else if (depois.length === 1) { p.st = 'cont'; p.h = depois[0]; }
    else if (/efetiva/i.test(p.motivo) && !depois.length && !antes.length) { p.st = 'conf'; p.mot = 'Saiu do programa por "' + p.motivo + '", mas o CPF não aparece em outra função na Base Geral'; }
    else if (antes.length) { p.st = 'conf'; p.mot = 'Admissão em outra função antes do término do contrato de aprendiz (' + antes.map(x => brD(x.adm) + ', ' + x.funcao).join('; ') + ')'; }
    p.cand = nonApr;
    if (p.h) { const h = p.h; const ativo = regs.find(x => x.sit !== 'Desligado' && !ehApr(x.funcao) && x.adm >= h.adm);
      p.atual = ativo || h; p.situacao = ativo ? (ativo.sit === 'Afastado' ? 'Afastado' : 'Ativo') : 'Desligado'; p.saida = ativo ? '' : h.saida;
      p.tempo = dias(p.fim, h.adm); }
    pess.push(p); });
  return pess;
}

/* ---------- importar as planilhas de jovens (uma ou várias de uma vez; cada arquivo com a sua origem) ---------- */
function lerPlanilha(wb, nomeArq){
  const out = [], avisos = [];
  wb.SheetNames.forEach(sn => { const A = window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header:1, raw:true, defval:'' });
    let h = -1; for (let i = 0; i < Math.min(A.length, 20); i++) { const H = A[i].map(x => normal(x)); if (H.some(x => /^nome|aprendiz|jovem/.test(x)) && H.some(x => /cpf/.test(x))) { h = i; break; } }
    if (h < 0) return; const H = A[h].map(x => normal(x)); const f = (re, nao) => H.findIndex(x => re.test(x) && !(nao && nao.test(x)));
    const cN = f(/^nome|^aprendiz|^jovem/), cC = f(/cpf/), cO = f(/origem|instituic|programa|entidade/), cI = f(/inicio|admiss|entrada/), cS = (k => k >= 0 ? k : f(/^setor/) >= 0 ? f(/^setor/) : f(/setor|depart|area|lotac/))(f(/descricao do centro/)), cM = f(/^mat/);
    const cFr = f(/deslig|rescis|saida|termino real|data termino\//, /motivo|previst/), cFp = f(/previst/), cF0 = f(/termino|fim|final|encerr/, /previst|motivo/), cMo = f(/motivo/), cE = f(/^empresa$/);
    const oAba = origDe(sn);
    const fmtBase = H.some(x => /situacao do func/.test(x)) && H.some(x => /^empresa/.test(x)); // exportação da Base Geral (aprendizes registrados no grupo)
    for (let r = h + 1; r < A.length; r++) { const L = A[r]; const nome = String(L[cN] == null ? '' : L[cN]).trim(); if (!nome) continue;
      const real = cFr >= 0 ? dIso(L[cFr]) : '', prev = cFp >= 0 ? dIso(L[cFp]) : '', f0 = cF0 >= 0 && cF0 !== cFr ? dIso(L[cF0]) : '';
      out.push({ nome:nome.toUpperCase(), cpf:cC >= 0 ? String(L[cC]).trim() : '', origem:(cO >= 0 && origDe(L[cO])) || oAba || '', ini:cI >= 0 ? dIso(L[cI]) : '', fim:real || f0 || prev, fimPrev:prev || f0, saiuAntes:!!real && !!prev,
        motivo:cMo >= 0 ? String(L[cMo]).trim() : '', empA:cE >= 0 ? String(L[cE]).trim() : '', fmtBase, setor:cS >= 0 ? String(L[cS]).trim() : '', mat:cM >= 0 ? String(L[cM]).trim() : '', arq:nomeArq }); }
    avisos.push(nomeArq + (wb.SheetNames.length > 1 ? ' / ' + sn : '') + ': ' + [['nome', cN], ['CPF', cC], ['origem', cO], ['início', cI], ['término', cFr >= 0 ? cFr : cF0 >= 0 ? cF0 : cFp], ['setor', cS], ['motivo de saída', cMo]].map(([n, c]) => n + (c >= 0 ? ' ✓' : ' ✗')).join(', ')); });
  return { rows:out, avisos };
}
async function lerArquivo(fl){
  if (/\.csv$/i.test(fl.name)) { const b = new Uint8Array(await fl.arrayBuffer()); let t = new TextDecoder('utf-8').decode(b); if (/�/.test(t)) t = new TextDecoder('latin1').decode(b);
    const l1 = t.split(/\r?\n/)[0] || ''; const FS = (l1.match(/;/g) || []).length > (l1.match(/,/g) || []).length ? ';' : ',';
    return window.XLSX.read(t.replace(/^﻿/, ''), { type:'string', FS, raw:true }); }
  return window.XLSX.read(new Uint8Array(await fl.arrayBuffer()), { type:'array', cellDates:false });
}
/* sugestão de origem pelo próprio dado: CPFs que já estão nos painéis do João Bittar e da RENAPSI */
async function cpfsPaineis(){ const o = { 'João Bittar':new Set(), 'RENAPSI':new Set() };
  try { const d = await window.CRV_DADOS('jovem'); ((d && d.dados.BASE) || []).forEach(j => { const c = cpfN(j.cpf); if (c) o['João Bittar'].add(c); }); } catch(_){}
  try { const d = await window.CRV_DADOS('renapsi'); ((d && d.dados.MESES) || []).forEach(m => (m.jovens || []).forEach(j => { const c = cpfN(j.cpf); if (c) o['RENAPSI'].add(c); })); } catch(_){}
  return o; }
function importar(onOk){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv'; inp.multiple = true;
  inp.onchange = async () => { const fls = [...inp.files]; if (!fls.length) return;
    const ARQ = []; for (const fl of fls) { try { const R = lerPlanilha(await lerArquivo(fl), fl.name); if (R.rows.length) ARQ.push(Object.assign({ fl }, R)); else toast(fl.name + ': não achei cabeçalho com nome e CPF.', true); } catch(e){ toast('Não consegui ler ' + fl.name + ': ' + (e.message || e), true); } }
    if (!ARQ.length) return;
    const CP = await cpfsPaineis();
    ARQ.forEach(a => { const tem = a.rows.some(r => r.origem); const cs = a.rows.map(r => cpfN(r.cpf)); a.bate = { 'João Bittar':cs.filter(c => CP['João Bittar'].has(c)).length, 'RENAPSI':cs.filter(c => CP['RENAPSI'].has(c)).length };
      const rb = CP['João Bittar'].size ? a.bate['João Bittar'] / CP['João Bittar'].size : 0, rr = CP['RENAPSI'].size ? a.bate['RENAPSI'] / CP['RENAPSI'].size : 0; a.cob = { 'João Bittar':Math.round(rb * 100), 'RENAPSI':Math.round(rr * 100) };
      a.sug = tem ? '' : Math.max(rb, rr) >= .5 ? (rb >= rr ? 'João Bittar' : 'RENAPSI') : a.rows.some(r => r.fmtBase) ? 'CRV' : ''; });
    abrirModal({ titulo:'Importar planilhas de jovens aprendizes', largo:true, corpo:ARQ.map((a, i) => { const semO = a.rows.filter(r => !r.origem).length, inv = a.rows.filter(r => !cpfOk(cpfN(r.cpf))).length, semF = a.rows.filter(r => !r.fim).length;
        return `<div class="cartao" style="margin-bottom:10px"><p style="margin:0 0 6px"><b>${esc(a.fl.name)}</b> · ${nf(a.rows.length)} jovens · CPF vazio ou inválido: ${inv} · sem data de término: ${semF}${a.rows.some(r => r.saiuAntes) ? ' · ' + a.rows.filter(r => r.saiuAntes).length + ' saíram antes do previsto' : ''}</p>
          ${semO ? `<label style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13.5px"><b>Origem deste arquivo:</b> <select data-o="${i}"><option value="">Escolha…</option>${ORIG.map(o => `<option ${a.sug === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
            <span class="nr-fonte" style="margin:0">${a.bate['João Bittar'] || a.bate['RENAPSI'] ? `${a.bate['João Bittar']} CPFs batem com os jovens do painel do João Bittar (${a.cob['João Bittar']}% dos jovens do painel) e ${a.bate['RENAPSI']} com os do painel da RENAPSI (${a.cob['RENAPSI']}%)${a.sug ? ' (sugestão: ' + a.sug + ')' : ''}` : a.sug === 'CRV' ? 'arquivo no formato da Base Geral (aprendizes registrados no grupo): sugestão CRV' : 'a planilha não diz a origem; escolha'}</span></label>`
          : `<p class="nr-fonte" style="margin:0">${ORIG.map(o => o + ': ' + a.rows.filter(r => r.origem === o).length).join(' · ')}</p>`}
          <p class="nr-fonte" style="margin:4px 0 0">${a.avisos.map(esc).join('<br>')}</p></div>`; }).join('') +
        `<div style="display:flex;flex-direction:column;gap:6px;font-size:13.5px;margin:6px 0"><label><input type="radio" name="ap-modo" value="somar" checked> <b>Somar</b> aos jovens já importados (o mesmo jovem no mesmo contrato é atualizado, não duplica)</label><label><input type="radio" name="ap-modo" value="subst"> <b>Substituir</b> a lista anterior das origens deste arquivo</label></div><p class="nr-fonte">As outras origens não mudam. As validações já feitas em "A conferir" ficam guardadas pelo CPF.</p><p class="nr-msg" id="ap-m"></p>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="ap-x">Cancelar</button><button class="btn prim" id="ap-ok">Importar ${nf(ARQ.reduce((s, a) => s + a.rows.length, 0))} jovens</button>`,
      aoAbrir: m => { m.querySelector('#ap-x').onclick = fecharModal;
        m.querySelector('#ap-ok').onclick = async () => { const msg = m.querySelector('#ap-m');
          const rows = []; for (let i = 0; i < ARQ.length; i++) { const sel = m.querySelector(`[data-o="${i}"]`); const od = sel ? sel.value : ''; if (sel && !od) { msg.textContent = 'Escolha a origem de ' + ARQ[i].fl.name + '.'; return; } ARQ[i].rows.forEach(r => rows.push(Object.assign({}, r, { origem:r.origem || od }))); }
          const b = m.querySelector('#ap-ok'); b.disabled = true; b.textContent = 'Importando…';
          try { const J0 = await lerJovens(); const modo = (m.querySelector('input[name=ap-modo]:checked') || {}).value || 'somar'; const novas = new Set(rows.map(r => r.origem)); const kk = r => cpfN(r.cpf) + '|' + (r.ini || '') + '|' + r.origem; const ks = new Set(rows.map(kk));
            const todas = J0.rows.filter(r => modo === 'subst' ? !novas.has(r.origem) : !ks.has(kk(r))).concat(rows);
            const ant = (await window.CRV_REGS(PAINEL, 'jovens')).filter(x => /^b\d+$/.test(x._id)).length; const N = Math.ceil(todas.length / 300);
            for (let i = 0; i < Math.max(N, ant); i++) await salvar('jovens', 'b' + i, { rows:todas.slice(i * 300, i * 300 + 300) });
            await salvar('jovens', 'meta', { arquivo:ARQ.map(a => a.fl.name).join(', '), n:todas.length, em:new Date().toISOString(), por:quem(), origens:[...new Set(todas.map(r => r.origem))] });
            fecharModal(); toast(nf(rows.length) + ' jovens importados. Cruzamento refeito.'); onOk && onOk(); }
          catch(e){ b.disabled = false; b.textContent = 'Importar'; msg.textContent = traduzErro(e); } }; } }); };
  inp.click();
}

/* ---------- tela ---------- */
const CSS = `.ap-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-bottom:12px}
.ap-or{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-bottom:12px}
.ap-oc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;border-top:4px solid var(--c);cursor:pointer;text-align:left;font:inherit;color:inherit}
.ap-oc h4{margin:0 0 4px;font-size:14px}.ap-oc .n{font-size:24px;font-weight:700;color:var(--c)}.ap-oc small{display:block;color:var(--mut);font-size:12px}
.ap-bar{display:grid;grid-template-columns:minmax(120px,1.2fr) 2fr 44px;gap:8px;align-items:center;padding:4px 2px;cursor:pointer;border-radius:6px;font-size:13px}.ap-bar:hover{background:var(--fundo2,#f3f5f8)}
.ap-bar .t{height:10px;background:#edf0f4;border-radius:5px;overflow:hidden}.ap-bar .t i{display:block;height:100%;border-radius:5px}.ap-bar b{text-align:right}
.ap-tb{width:100%;border-collapse:collapse;font-size:12.5px}.ap-tb th{text-align:left;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);padding:6px;border-bottom:2px solid var(--line);white-space:nowrap}
.ap-tb td{padding:6px;border-top:1px solid var(--line);vertical-align:top}.ap-tb tr.cl{cursor:pointer}.ap-tb tr.cl:hover{background:#f6f8fb}.ap-tb tfoot td{font-weight:700;background:#f4f6f9}
.ap-pill{display:inline-block;border-radius:99px;padding:1px 8px;font-size:11px;font-weight:700;white-space:nowrap}.ap-at{background:#e6f3ec;color:#1d5c3a}.ap-de{background:#fdecea;color:#a3301c}.ap-af{background:#fcf1dc;color:#7a5200}
.ap-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:4px 0 12px;flex-wrap:wrap}.ap-tabs button{border:0;background:none;padding:8px 14px;font:inherit;font-weight:600;color:var(--mut);cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-1px}.ap-tabs button.on{color:var(--ink);border-bottom-color:#b5731a}
.ap-cf{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.ap-cf select{max-width:300px}`;
async function tela(p){
  if (!document.getElementById('ap-css')) { const s = document.createElement('style'); s.id = 'ap-css'; s.textContent = CSS; document.head.appendChild(s); }
  const pode = podeEditar(p); const F = { or:'', emp:'', sit:'', dep:'', ano:'', aba:'n', q:'' }; let J = null, B = null, V = {}, PS = [], CFG = {};
  E.painelAberto = p.id;
  moldura(`<div class="trilha"><button data-ir="#/">Visão Geral</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
    <section class="ini-topo capa" style="${(c => c ? '--c1:' + c[0] + ';--c2:' + c[1] : '')((window.CRV_CAPA || {})[p.frente])}"><div><div class="ini-eyebrow">${esc(p.frente)}</div><h1>Aproveitamento pós-programa</h1><div class="ini-data" id="ap-sub">Jovens aprendizes contratados depois do programa, em outra função · empresas 5, 6 e 16 · cruzamento pelo CPF</div></div>
      <div class="dk-acoes">${pode ? '<button class="btn prim" id="ap-imp">Importar planilha de jovens</button>' : ''}<button class="btn borda" id="ap-exp">Exportar</button></div></section>
    <div id="ap-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  const carregar = async () => { try { [J, B, V] = await Promise.all([lerJovens(), baseColab(), lerValid()]); try { CFG = (await window.CRV_REGS(PAINEL, 'cfg')).find(x => x._id === 'geral') || {}; } catch(_){ CFG = {}; } } catch(e){ console.warn(e); } PS = J && B ? cruzar(J, B, V, CFG.crvBase !== false) : []; desenhar(); };
  if (pode) $('#ap-imp').onclick = () => importar(carregar);
  $('#ap-exp').onclick = () => exportar();
  const base = () => PS.filter(x => (!F.or || x.origem === F.or) && (!F.ano || x.anoFim === F.ano));
  const contF = () => base().filter(x => x.st === 'cont' && (!F.emp || x.h.emp === F.emp) && (!F.sit || (F.sit === 'Desligado' ? x.situacao === 'Desligado' : x.situacao !== 'Desligado')) && (!F.dep || x.h.depto === F.dep))
    .filter(x => { const q = normal(F.q); return !q || normal(x.nome + ' ' + x.cpf + ' ' + (x.atual || {}).mat + ' ' + x.h.funcao + ' ' + x.h.depto).includes(q); }).sort((a, b) => String(b.h.adm).localeCompare(String(a.h.adm)));
  const confF = () => base().filter(x => x.st === 'conf');
  function lista(t, L, sub){ abrirModal({ titulo:t, largo:true, corpo:`<p style="margin-top:0;color:var(--mut)">${sub || ''}</p>${tabCont(L)}`, pe:'<span style="flex:1"></span><button class="btn prim" id="ap-f">Fechar</button>', aoAbrir: m => { m.querySelector('#ap-f').onclick = fecharModal; } }); }
  const sitPill = x => x.situacao === 'Desligado' ? `<span class="ap-pill ap-de">Desligado${x.saida ? ' em ' + esc(brD(x.saida)) : ''}</span>` : x.situacao === 'Afastado' ? '<span class="ap-pill ap-af">Afastado</span>' : '<span class="ap-pill ap-at">Ativo</span>';
  const tabCont = L => L.length ? `<div style="overflow:auto"><table class="ap-tb"><thead><tr><th>Mat. atual</th><th>Nome</th><th>CPF</th><th>Origem</th><th>Período como aprendiz</th><th>Setor (aprendiz)</th><th>Empresa</th><th>Admissão</th><th>Função</th><th>Departamento</th><th>Situação</th></tr></thead><tbody>
    ${L.map(x => `<tr><td>${esc((x.atual || x.h).mat)}</td><td><b>${esc(x.nome)}</b>${x.valid ? '<div class="nr-fonte" style="margin:0">validado por ' + esc(x.valid.por || '') + '</div>' : ''}</td><td style="white-space:nowrap">${esc(cpfF(x.cpf))}</td><td>${esc(x.origens && x.origens.length > 1 ? x.origens.join(' → ') : x.origem || '—')}${x.daBase ? '<div class="nr-fonte" style="margin:0">pela Base Geral</div>' : ''}</td><td style="white-space:nowrap">${esc(brD(x.ini))} a<br>${esc(brD(x.fim))}</td><td>${esc(x.setorA || '—')}${x.empA ? '<div class="nr-fonte" style="margin:0">' + esc(x.empA) + '</div>' : ''}</td><td>${esc(EMPN[x.h.emp])}</td><td>${esc(brD(x.h.adm))}<div class="nr-fonte" style="margin:0">${esc(tempoTxt(x.tempo))} após o fim</div></td><td>${esc(x.h.funcao)}</td><td>${esc(x.h.depto)}</td><td>${sitPill(x)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="11">Total: ${nf(L.length)} ${L.length === 1 ? 'pessoa' : 'pessoas'}</td></tr></tfoot></table></div>` : '<div class="cartao vazio"><h3>Ninguém nesta lista</h3></div>';
  const barras = (titulo, L, chave, cor) => { const m = new Map(); L.forEach(x => { const k = chave(x) || '—'; m.set(k, (m.get(k) || []).concat([x])); }); const A = [...m.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 12), mx = Math.max(1, ...A.map(a => a[1].length));
    return `<div class="cartao"><h3 style="margin:0 0 8px;font-size:15px">${titulo}</h3>${A.length ? A.map(([k, v]) => `<div class="ap-bar" data-bk="${esc(titulo)}" data-bv="${esc(k)}"><span>${esc(k)}</span><span class="t"><i style="width:${v.length / mx * 100}%;background:${cor}"></i></span><b>${v.length}</b></div>`).join('') : '<p class="nr-fonte">Sem contratados no recorte.</p>'}${m.size > 12 ? `<p class="nr-fonte">Mostrando os 12 maiores de ${m.size}.</p>` : ''}</div>`; };
  function desenhar(){
    const c = $('#ap-corpo'); if (!c) return;
    if (!B) { c.innerHTML = '<div class="cartao vazio"><h3>Sem a Base Geral de Colaboradores</h3><p>O cruzamento usa o Quadro Geral (ativos e desligados das empresas 5, 6 e 16). Carregue o Quadro e volte aqui.</p></div>'; return; }
    if (!PS.length) { c.innerHTML = `<div class="cartao vazio"><h3>Falta a planilha de jovens aprendizes</h3><p>${pode ? 'Clique em <b>Importar planilha de jovens</b>. A planilha precisa ter nome e CPF de cada jovem; o painel também procura as colunas de origem (CRV, RENAPSI ou João Bittar), início, término do contrato e setor.' : 'O RH ainda não importou a planilha de jovens.'}</p></div>`; return; }
    $('#ap-sub').textContent = `Planilha de jovens: ${J.meta ? J.meta.arquivo + ' (' + new Date(J.meta.em).toLocaleDateString('pt-BR') + ')' : '—'} · Base Geral de ${brD(B.ref)} · empresas 5, 6 e 16 · cruzamento pelo CPF`;
    const Bx = base(), concl = Bx.filter(x => x.concl), cont = Bx.filter(x => x.st === 'cont'), conf = Bx.filter(x => x.st === 'conf'), C = contF();
    const at = cont.filter(x => x.situacao !== 'Desligado'), sa = cont.filter(x => x.situacao === 'Desligado');
    const tm = cont.filter(x => x.tempo != null), tMed = tm.length ? Math.round(tm.reduce((s, x) => s + x.tempo, 0) / tm.length) : null;
    const anos = [...new Set(PS.map(x => x.anoFim).filter(Boolean))].sort().reverse(), deps = [...new Set(PS.filter(x => x.h).map(x => x.h.depto).filter(Boolean))].sort();
    c.innerHTML = `${!B.cpfpOk ? `<div class="cartao" style="border-left:4px solid #c3352f;margin-bottom:12px;font-size:13.5px"><b>Base Geral com CPF desalinhado:</b> nesta base, o CPF dos desligados das empresas 6 e 16 não confere com o da matrícula (só ${B.alin}% batem nos desligados da CRV). Para não cruzar CPF errado, o painel usou só os CPFs da CRV (5). Recarregue a planilha da Base Geral em Administração para refazer os CPFs de todas as empresas.</div>` : ''}${!B.temOutros ? `<div class="cartao" style="border-left:4px solid #b5731a;margin-bottom:12px;font-size:13.5px"><b>Atenção:</b> a Base Geral carregada hoje traz os ativos só da CRV (5); das empresas 6 e 16 vêm apenas os desligados. Recarregue a planilha da Base Geral em Administração (o app agora guarda também os ativos de APFO e CAPFO) para o cruzamento ficar completo.</div>` : ''}
      <section class="dk-kpis">
        <button class="dk-k" data-k="todos" style="--c:#5b3f9e"><span>Passaram pelo programa</span><b>${nf(Bx.length)}</b><small>${nf(new Set(Bx.map(x => x.k)).size)} pessoas (quem passou por duas instituições conta uma vez em cada) · ${nf(concl.length)} já concluíram · ${nf(Bx.length - concl.length)} em andamento ou sem término</small></button>
        <button class="dk-k" data-k="cont" style="--c:#2e7d4f"><span>Contratados depois</span><b>${nf(cont.length)}</b><small>em outra função, após o fim do contrato</small></button>
        <button class="dk-k" data-k="cont" style="--c:#1d7a88"><span>Aproveitamento</span><b>${pct(cont.length, concl.length)}</b><small>contratados ÷ jovens que concluíram</small></button>
        <button class="dk-k" data-k="at" style="--c:#2f6fa8"><span>Continuam na empresa</span><b>${nf(at.length)}</b><small>${nf(sa.length)} já saíram</small></button>
        <button class="dk-k" data-k="cont" style="--c:#b5731a"><span>Tempo médio até a contratação</span><b>${tempoTxt(tMed)}</b><small>do fim do programa à admissão</small></button>
        <button class="dk-k" data-k="conf" style="--c:#c3352f"><span>A conferir</span><b>${nf(conf.length)}</b><small>fora do indicador até validar</small></button></section>
      <section class="ap-or">${ORIG.map(o => { const T = Bx.filter(x => x.origem === o), Cc = T.filter(x => x.concl), K = T.filter(x => x.st === 'cont');
        return `<button class="ap-oc" data-or="${o}" style="--c:${ORC[o]}"><h4>${o === 'CRV' ? 'Contratados direto pela CRV' : o === 'RENAPSI' ? 'RENAPSI' : 'Instituto João Bittar'}</h4><span class="n">${pct(K.length, Cc.length)}</span><small>${nf(K.length)} contratados de ${nf(Cc.length)} que concluíram · ${nf(T.length)} no total</small></button>`; }).join('')}
        ${Bx.some(x => !x.origem) ? `<button class="ap-oc" data-or="__" style="--c:#8a94a8"><h4>Sem origem na planilha</h4><span class="n">${nf(Bx.filter(x => !x.origem).length)}</span><small>jovens sem origem identificada</small></button>` : ''}</section>
      <section class="dk-filtros cartao"><input id="ap-q" type="search" placeholder="Buscar nome, CPF, matrícula, função" value="${esc(F.q)}">
        <label>Origem <select id="f-or"><option value="">Todas</option>${ORIG.map(o => `<option ${F.or === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <label>Empresa <select id="f-emp"><option value="">Todas</option>${EMPS.map(e => `<option value="${e}" ${F.emp === e ? 'selected' : ''}>${EMPN[e]}</option>`).join('')}</select></label>
        <label>Situação <select id="f-sit"><option value="">Todas</option><option value="Ativo" ${F.sit === 'Ativo' ? 'selected' : ''}>Ativos</option><option value="Desligado" ${F.sit === 'Desligado' ? 'selected' : ''}>Desligados</option></select></label>
        <label>Departamento <select id="f-dep"><option value="">Todos</option>${deps.map(d => `<option ${F.dep === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
        <label class="dk-chk" title="Aprendizes registrados no grupo com função de aprendiz que não estão nas planilhas das instituições"><input type="checkbox" id="f-base" ${CFG.crvBase !== false ? 'checked' : ''} ${pode ? '' : 'disabled'}> CRV direto: incluir aprendizes da Base Geral</label>
        <label>Término do programa <select id="f-ano"><option value="">Todos</option>${anos.map(a => `<option ${F.ano === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label></section>
      <div class="ap-tabs"><button data-ab="n" class="${F.aba === 'n' ? 'on' : ''}">Contratados (${nf(C.length)})</button><button data-ab="g" class="${F.aba === 'g' ? 'on' : ''}">Por empresa, departamento e função</button><button data-ab="c" class="${F.aba === 'c' ? 'on' : ''}">A conferir (${nf(conf.length)})</button></div>
      <div id="ap-aba"></div>
      <p class="nr-fonte">Regra: CPF padronizado (só números, 11 dígitos) encontrado nas empresas 5, 6 ou 16, em função diferente de aprendiz e com admissão depois do término do contrato de aprendiz. O registro do próprio aprendiz não conta. Casos duvidosos ficam em "A conferir" e só entram no indicador depois de validados. Aproveitamento = contratados ÷ jovens que já concluíram o programa (quem ainda está no programa não entra na conta).</p>`;
    const a = $('#ap-aba');
    if (F.aba === 'n') a.innerHTML = `<div class="cartao">${tabCont(C)}</div>`;
    if (F.aba === 'g') a.innerHTML = `<div class="ap-g2">${barras('Por empresa', C, x => EMPN[x.h.emp], '#2e7d4f')}${barras('Por departamento', C, x => x.h.depto, '#2f6fa8')}${barras('Por função de contratação', C, x => x.h.funcao, '#b5731a')}${barras('Por origem do aprendizado', C, x => x.origem || 'Sem origem', '#5b3f9e')}</div>`;
    if (F.aba === 'c') { const L = confF().concat(base().filter(x => x.valid && x.valid.d === 'nao'));
      a.innerHTML = `<div class="cartao">${L.length ? `<div style="overflow:auto"><table class="ap-tb"><thead><tr><th>Nome</th><th>CPF (planilha)</th><th>Origem</th><th>Período como aprendiz</th><th>Motivo</th><th>Registros na base (fora aprendiz)</th>${pode ? '<th>Decisão</th>' : ''}</tr></thead><tbody>
        ${L.map(x => `<tr><td><b>${esc(x.nome)}</b></td><td>${esc(x.cpfRaw || '')}${x.cpf && x.cpf !== String(x.cpfRaw).replace(/\D/g, '') ? '<div class="nr-fonte" style="margin:0">→ ' + esc(cpfF(x.cpf)) + '</div>' : ''}</td><td>${esc(x.origem || '—')}</td><td>${esc(brD(x.ini))} a ${esc(brD(x.fim))}</td>
          <td>${x.valid && x.valid.d === 'nao' ? '<span class="ap-pill ap-de">Validado: não conta</span> <span class="nr-fonte">por ' + esc(x.valid.por || '') + '</span>' : esc(x.mot)}</td>
          <td>${(x.cand || []).map(h => `${esc(EMPN[h.emp])} · mat. ${esc(h.mat)} · ${esc(h.funcao)} · adm. ${esc(brD(h.adm))}${h.sit === 'Desligado' ? ' · saiu ' + esc(brD(h.saida)) : ''}<br>`).join('') || '—'}</td>
          ${pode ? `<td><div class="ap-cf">${x.cpf && cpfOk(x.cpf) && (x.cand || []).length ? `<select data-sel="${esc(x.vk)}">${x.cand.map(h => `<option value="${esc(chaveReg(h))}">${esc(EMPN[h.emp] + ' · ' + h.funcao + ' · ' + brD(h.adm))}</option>`).join('')}</select><button class="btn prim peq" data-sim="${esc(x.vk)}">Contar como contratado</button>` : ''}${x.cpf && cpfOk(x.cpf) ? (x.valid ? `<button class="btn borda peq" data-desf="${esc(x.vk)}">Desfazer</button>` : `<button class="btn borda peq" data-nao="${esc(x.vk)}">Não conta</button>`) : '<span class="nr-fonte">corrija o CPF na planilha e importe de novo</span>'}</div></td>` : ''}</tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="${pode ? 7 : 6}">Total: ${nf(L.length)} ${L.length === 1 ? 'pessoa' : 'pessoas'}</td></tr></tfoot></table></div>` : '<div class="vazio"><h3>Nada a conferir</h3></div>'}</div>`;
      const dec = async (cpf, d, k) => { try { await salvar('valid', cpf, d ? { d, k:k || '', por:quem(), em:new Date().toISOString() } : { excluida:true, por:quem(), em:new Date().toISOString() }); toast(d ? 'Decisão registrada.' : 'Decisão desfeita.'); carregar(); } catch(e){ toast(traduzErro(e), true); } };
      a.querySelectorAll('[data-sim]').forEach(b => b.onclick = () => dec(b.dataset.sim, 'sim', a.querySelector(`[data-sel="${b.dataset.sim}"]`).value));
      a.querySelectorAll('[data-nao]').forEach(b => b.onclick = () => dec(b.dataset.nao, 'nao'));
      a.querySelectorAll('[data-desf]').forEach(b => b.onclick = () => dec(b.dataset.desf, null)); }
    /* cliques: quem está por trás de cada número */
    c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k;
      if (k === 'conf') { F.aba = 'c'; return desenhar(); }
      if (k === 'todos') return abrirModal({ titulo:'Jovens que passaram pelo programa', largo:true, corpo:`<div style="overflow:auto"><table class="ap-tb"><thead><tr><th>Nome</th><th>CPF</th><th>Origem</th><th>Período</th><th>Setor</th><th>Resultado</th></tr></thead><tbody>${Bx.map(x => `<tr><td><b>${esc(x.nome)}</b></td><td>${esc(cpfF(x.cpf) || x.cpfRaw || '')}</td><td>${esc(x.origem || '—')}</td><td>${esc(brD(x.ini))} a ${esc(brD(x.fim))}</td><td>${esc(x.setorA)}</td><td>${x.st === 'cont' ? 'Contratado depois' : x.st === 'conf' ? 'A conferir' : x.concl ? 'Não contratado' : 'Em andamento'}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="6">Total: ${nf(Bx.length)} pessoas</td></tr></tfoot></table></div>`, pe:'<span style="flex:1"></span><button class="btn prim" onclick="document.getElementById(\'modal-raiz\').innerHTML=\'\'">Fechar</button>' });
      lista(k === 'at' ? 'Contratados que continuam na empresa' : 'Contratados depois do programa', k === 'at' ? at : cont, (k === 'at' ? nf(at.length) : nf(cont.length)) + ' pessoas'); });
    c.querySelectorAll('[data-or]').forEach(b => b.onclick = () => { const o = b.dataset.or; const L = cont.filter(x => o === '__' ? !x.origem : x.origem === o); lista('Contratados depois · ' + (o === '__' ? 'sem origem' : o), L, nf(L.length) + ' contratados de ' + nf(Bx.filter(x => (o === '__' ? !x.origem : x.origem === o) && x.concl).length) + ' que concluíram'); });
    c.querySelectorAll('[data-bk]').forEach(b => b.onclick = () => { const t = b.dataset.bk, v = b.dataset.bv; const f = t === 'Por empresa' ? x => EMPN[x.h.emp] : t === 'Por departamento' ? x => x.h.depto || '—' : t === 'Por função de contratação' ? x => x.h.funcao || '—' : x => x.origem || 'Sem origem'; const L = C.filter(x => f(x) === v); lista(t.replace('Por ', '') + ': ' + v, L, nf(L.length) + ' pessoas'); });
    c.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { F.aba = b.dataset.ab; desenhar(); });
    [['f-or', 'or'], ['f-emp', 'emp'], ['f-sit', 'sit'], ['f-dep', 'dep'], ['f-ano', 'ano']].forEach(([id, k]) => $('#' + id).onchange = e => { F[k] = e.target.value; desenhar(); });
    $('#f-base').onchange = async e => { try { await salvar('cfg', 'geral', Object.assign({}, CFG, { _id:undefined, crvBase:e.target.checked, por:quem(), em:new Date().toISOString() })); toast('Configuração salva. Cruzamento refeito.'); carregar(); } catch(er){ toast(traduzErro(er), true); } };
    const qi = $('#ap-q'); qi.oninput = () => { F.q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { desenhar(); const e = $('#ap-q'); if (e) { e.focus(); e.setSelectionRange(F.q.length, F.q.length); } }, 250); };
  }
  /* exportar: escolher o que sai */
  function exportar(){
    if (!PS.length) return toast('Nada para exportar ainda.', true);
    abrirModal({ titulo:'Exportar aproveitamento pós-programa', corpo:`<div style="display:flex;flex-direction:column;gap:8px;font-size:14px"><label><input type="checkbox" id="x-i" checked> Indicadores (geral e por origem)</label><label><input type="checkbox" id="x-n" checked> Lista nominal dos contratados (com os filtros da tela)</label><label><input type="checkbox" id="x-c"> A conferir</label></div>`,
      pe:'<span style="flex:1"></span><button class="btn borda" id="x-x">Cancelar</button><button class="btn borda" id="x-xl">Excel</button><button class="btn prim" id="x-pdf">PDF</button>',
      aoAbrir: m => { m.querySelector('#x-x').onclick = fecharModal; const op = () => ({ i:m.querySelector('#x-i').checked, n:m.querySelector('#x-n').checked, c:m.querySelector('#x-c').checked });
        m.querySelector('#x-xl').onclick = () => { const o = op(); fecharModal(); xls(o); }; m.querySelector('#x-pdf').onclick = () => { const o = op(); fecharModal(); pdf(o).catch(e => toast('Não consegui gerar o PDF: ' + (e.message || e), true)); }; } });
  }
  const indRows = () => { const Bx = base(), lin = (n, T) => { const Cc = T.filter(x => x.concl), K = T.filter(x => x.st === 'cont'); return [n, T.length, Cc.length, K.length, pct(K.length, Cc.length), K.filter(x => x.situacao !== 'Desligado').length, K.filter(x => x.situacao === 'Desligado').length, T.filter(x => x.st === 'conf').length]; };
    return [lin('Geral', Bx)].concat(ORIG.map(o => lin(o, Bx.filter(x => x.origem === o)))); };
  const IH = ['Recorte', 'Passaram pelo programa', 'Concluíram', 'Contratados depois', 'Aproveitamento', 'Continuam', 'Já saíram', 'A conferir'];
  const NH = ['Mat. atual', 'Nome', 'CPF', 'Origem', 'Período como aprendiz', 'Setor (aprendiz)', 'Empresa', 'Admissão', 'Função', 'Departamento', 'Situação'];
  const nRow = x => [(x.atual || x.h).mat, x.nome, cpfF(x.cpf), x.origem || '', brD(x.ini) + ' a ' + brD(x.fim), x.setorA || '', EMPN[x.h.emp], brD(x.h.adm), x.h.funcao, x.h.depto, x.situacao === 'Desligado' ? 'Desligado' + (x.saida ? ' em ' + brD(x.saida) : '') : x.situacao];
  const CH = ['Nome', 'CPF (planilha)', 'Origem', 'Período como aprendiz', 'Motivo', 'Registros na base'];
  const cRow = x => [x.nome, String(x.cpfRaw || ''), x.origem || '', brD(x.ini) + ' a ' + brD(x.fim), x.mot, (x.cand || []).map(h => EMPN[h.emp] + ' mat. ' + h.mat + ' ' + h.funcao + ' adm. ' + brD(h.adm)).join('; ')];
  const filtrosTxt = () => [F.or && 'origem ' + F.or, F.emp && EMPN[F.emp], F.sit && F.sit, F.dep && F.dep, F.ano && 'término em ' + F.ano].filter(Boolean).join(' · ') || 'sem filtros';
  function xls(o){ const XL = window.XLSX, wb = XL.utils.book_new(), C = contF(), K = confF();
    if (o.i) { const a = [['Aproveitamento pós-programa · Jovem Aprendiz · ' + new Date().toLocaleDateString('pt-BR')], [filtrosTxt()], [], IH].concat(indRows()); const ws = XL.utils.aoa_to_sheet(a); ws['!cols'] = IH.map(() => ({ wch:20 })); XL.utils.book_append_sheet(wb, ws, 'Indicadores', { semTotal:true }); }
    if (o.n) { const a = [NH].concat(C.map(nRow)); a.push(['Total: ' + C.length + ' pessoas']); const ws = XL.utils.aoa_to_sheet(a); ws['!cols'] = [10, 36, 16, 12, 24, 22, 12, 12, 28, 28, 22].map(w => ({ wch:w })); XL.utils.book_append_sheet(wb, ws, 'Contratados', { semTotal:true }); }
    if (o.c) { const a = [CH].concat(K.map(cRow)); a.push(['Total: ' + K.length + ' pessoas']); const ws = XL.utils.aoa_to_sheet(a); ws['!cols'] = [36, 16, 12, 24, 50, 60].map(w => ({ wch:w })); XL.utils.book_append_sheet(wb, ws, 'A conferir', { semTotal:true }); }
    if (!wb.SheetNames.length) return; baixar(new Blob([XL.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Aproveitamento pos-programa - ' + new Date().toLocaleDateString('pt-BR').split('/').join('-') + '.xlsx'); }
  async function pdf(o){ const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'mm', format:'a4', orientation:'landscape' }), W = 297; const C = contF(), K = confF();
    doc.setFillColor(31, 58, 104); doc.rect(0, 0, W, 3, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(31, 58, 104); doc.text('Aproveitamento pós-programa · Jovem Aprendiz', 12, 15);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 96, 110); doc.text('Contratados depois do programa, em outra função, nas empresas 5, 6 e 16 · cruzamento pelo CPF · ' + filtrosTxt(), 12, 21);
    let y = 27; const st = { fontSize:7.6, cellPadding:1.5, lineColor:[225, 229, 236], lineWidth:.15 }, hs = { fillColor:[31, 58, 104], textColor:255, fontStyle:'bold' }, fs = { fillColor:[238, 241, 245], textColor:[20, 33, 61], fontStyle:'bold' };
    const tit = t => { if (y > 180) { doc.addPage(); y = 16; } doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(31, 58, 104); doc.text(t, 12, y); y += 3; };
    if (o.i) { tit('Indicadores'); doc.autoTable({ startY:y, head:[IH], body:indRows(), styles:st, headStyles:hs, margin:{ left:12, right:12 }, semTotal:true }); y = doc.lastAutoTable.finalY + 8; }
    if (o.n) { tit('Contratados depois do programa'); doc.autoTable({ startY:y, head:[NH], body:C.map(nRow), foot:[[{ content:'Total: ' + C.length + (C.length === 1 ? ' pessoa' : ' pessoas'), colSpan:NH.length }]], showFoot:'lastPage', styles:st, headStyles:hs, footStyles:fs, margin:{ left:12, right:12 } }); y = doc.lastAutoTable.finalY + 8; }
    if (o.c) { tit('A conferir (fora do indicador até validar)'); doc.autoTable({ startY:y, head:[CH], body:K.map(cRow), foot:[[{ content:'Total: ' + K.length + (K.length === 1 ? ' pessoa' : ' pessoas'), colSpan:CH.length }]], showFoot:'lastPage', styles:st, headStyles:{ fillColor:[163, 48, 28], textColor:255, fontStyle:'bold' }, footStyles:fs, columnStyles:{ 4:{ cellWidth:70 }, 5:{ cellWidth:80 } }, margin:{ left:12, right:12 } }); }
    const n = doc.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110); doc.text('Gestão de Pessoas · CRV Industrial · ' + new Date().toLocaleDateString('pt-BR') + ' · por ' + quem(), 12, 203); doc.text(i + '/' + n, W - 12, 203, { align:'right' }); }
    const out = window.CRV_PDF_LOGOS ? await window.CRV_PDF_LOGOS(doc) : doc;
    baixar((out || doc).output('blob'), 'Aproveitamento pos-programa - ' + new Date().toLocaleDateString('pt-BR').split('/').join('-') + '.pdf'); }
  await carregar();
}
return { tela };
};
