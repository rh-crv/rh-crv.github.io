/* Importação direta de planilhas no app (sem passar pelo Claude).
   Cada leitor transforma a planilha original no mesmo arquivo de dados que o painel já usa.
   Hoje: Quadro Geral (relatório de funcionários com todas as empresas) e os três cartões Sysprocard
   (Alimentação 56906, Convênio 53584, Premium 53586). Ao importar o Quadro, os cartões são refeitos
   com o quadro novo, mantendo a última planilha de cartões carregada. */
(function(){
'use strict';
const s = v => v == null ? '' : String(v).trim();
const pad = n => String(n).padStart(2, '0');
const isoD = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
function iso(v){
  if (v instanceof Date && !isNaN(v)) return isoD(v);
  const t = s(v); const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m || m[3] === '0000') { const m2 = /^(\d{4})-(\d{2})-(\d{2})/.exec(t); return m2 ? m2[1] + '-' + m2[2] + '-' + m2[3] : ''; }
  return m[3] + '-' + m[2] + '-' + m[1];
}
const LOW = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
const tc = v => s(v).toLowerCase().split(/\s+/).filter(Boolean).map((x, i) => (LOW.has(x) && i) ? x : x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
const dig = v => String(v == null ? '' : v).replace(/\D/g, '');
function cpf(v){ let d = dig(v); if (!d) return ''; d = d.padStart(11, '0'); return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9); }
function num(v){
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  const t = s(v); return t.endsWith('.0') ? t.slice(0, -2) : t;
}
const sp = v => s(v).replace(/\s+/g, ' ');
const AREA = { 'ADM - AGRICOLA':'ADM - Agrícola', 'ADM - CRV':'ADM - CRV', 'AFASTADOS':'Afastados', 'AUXILIARES - OPERACIONAL CTT':'Auxiliares - Operacional CTT',
  'DESISTENTES':'Desistentes', 'INDUSTRIA':'Indústria', 'IRRIGAÇÃO CONVENCIONAL':'Irrigação Convencional', 'IRRIGAÇÃO LOCALIZADA':'Irrigação Localizada',
  'OFICINA':'Oficina', 'OPERACIONAL CTT':'Operacional CTT', 'TRATOS CULTURAIS':'Tratos Culturais' };
const CON = { 'TEMPO INDETERMINADO':'Efetivo', 'EXPERIÊNCIA':'Experiência', 'SAFRA':'Safra', 'TEMPO DETERMINADO':'Determinado' };

function linhas(wb){
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:null, blankrows:false });
}
function detectar(wb, nomeArq){
  const R = linhas(wb);
  const h = (R[0] || []).map(s);
  if (h.includes('Matricula do Funcionário') && h.includes('EMPRESA') && h.includes('Situação do Funcionário')) return { tipo:'quadro', R };
  // cartões Sysprocard: a linha "Empresa: ... Código: 56906" às vezes não é lida; reconhece também pelo nome da aba e do arquivo
  const hi = R.findIndex(r => r && r.map(s).includes('MATRÍCULA') && r.map(s).includes('SITUAÇÃO'));
  if (hi >= 0 && hi <= 3) {
    const txt = [s((R[0] || [])[0]), (wb.Strings || []).slice(0, 3).map(x => x && (x.t || x)).join(' '), wb.SheetNames[0], nomeArq || ''].join(' | ');
    const m = /C[óo]digo:?\s*(\d{5})/.exec(txt) || /\b(56906|53584|53586)\b/.exec(txt);
    let T = m ? { '56906':'alimentacao', '53584':'convenio', '53586':'premium' }[m[1]] : '';
    const up = txt.toUpperCase();
    if (!T) T = /PREMIUM|INDUS PR/.test(up) ? 'premium' : /CONV[EÊ]NIO|CRV INDUSTRIAL\b(?! P)/.test(up) || R[hi].map(s).includes('LIMITE') ? 'convenio' : /ALIMENTA|PAT|INDUST P\b/.test(up) ? 'alimentacao' : '';
    if (T) { const R2 = R.slice(hi); R2.unshift([]); return { tipo:'cartao', cartao:T, R:R2 }; }
  }
  return null;
}
const refDoNome = (nome, f) => { const m = /(\d{2})[-_.](\d{2})[-_.](\d{4})/.exec(nome || ''); if (m) return m[3] + '-' + m[2] + '-' + m[1]; return isoD(f && f.lastModified ? new Date(f.lastModified) : new Date()); };

/* ---------- Quadro Geral (porte fiel do leitor usado até aqui) ---------- */
function converterQuadro(R, antigo, REF){
  const H = R[0].map(x => s(x));
  const C = {}; H.forEach((h, i) => { if (h && !(h in C)) C[h] = i; });
  const col = (r, nome) => { for (const h of H) if (h && h.startsWith(nome)) return r[C[h]]; throw new Error('coluna "' + nome + '" não encontrada na planilha'); };
  const hSal = H.find(h => /^sal[aá]rio/i.test(h) && /mensal|base|contrat|atual|nominal/i.test(h)) || H.find(h => /^sal[aá]rio/i.test(h));
  const recs = [], semArea = {};
  for (const r of R.slice(1)) {
    if (r[C['Matricula do Funcionário']] == null || s(r[C['Matricula do Funcionário']]) === '') continue;
    const em = /(\d+)\s*-\s*(\w+)/.exec(s(col(r, 'EMPRESA'))); if (!em) continue;
    const ec = em[1], en = em[2];
    const setor = s(col(r, 'Setor')).toUpperCase();
    let area = AREA[setor]; if (area == null) { semArea[setor] = (semArea[setor] || 0) + 1; area = tc(setor); }
    const sexo = s(col(r, 'Descr. do Sexo')).toUpperCase();
    const o = { ec, emp: en + ' (' + ec + ')', mat: parseInt(num(col(r, 'Matricula do')), 10), nome: sp(col(r, 'Nome do Func')).toUpperCase(),
      fun: sp(col(r, 'Função do Func')), sec: s(col(r, 'Descrição do Departamento')), setor, area, ges: s(col(r, 'Descrição da Gerência')),
      con: CON[s(col(r, 'Tipo de Contrato')).toUpperCase()] || tc(col(r, 'Tipo de Contrato')), sit: s(col(r, 'Situação do Func')).toUpperCase(),
      adm: iso(col(r, 'Data de Admissão')), resc: iso(col(r, 'Data Rescisão')), idade: parseInt(num(col(r, 'Idade')) || '0', 10) || 0,
      sexo: sexo.startsWith('F') ? 'F' : 'M', sexoL: sexo.startsWith('F') ? 'Feminino' : 'Masculino', cid: tc(col(r, 'Cidade Residente')),
      ccd: s(col(r, 'Descrição do Centro')), ccc: num(col(r, 'Código do Centro')), cnhv: iso(col(r, 'Vencimento')), cnhc: s(col(r, 'Categoria do CNH')),
      depto: num(col(r, 'Depto')), codf: num(col(r, 'Código da Função')), nasc: iso(col(r, 'Data Nascimento')), cpf: cpf(col(r, 'CPF')), sal: hSal ? r[C[hSal]] : undefined };
    o.X = [iso(col(r, 'Data Nascimento')), tc(col(r, 'Descrição do Estado Civil')), num(col(r, 'Numero do PIS')), num(col(r, 'Numero do CNH')), s(col(r, 'Categoria do CNH')),
      iso(col(r, 'Vencimento')), s(col(r, 'UF da CNH')), num(col(r, 'RG')), s(col(r, 'Orgão do RG')), iso(col(r, 'Data de Emissão do RG')), s(col(r, 'UF do RG')),
      cpf(col(r, 'CPF')), num(col(r, 'Carteira Profissional')), num(col(r, 'Serie Carteira')), num(col(r, 'Código do C.B.O')), tc(col(r, 'Cidade Nascimento')),
      s(col(r, 'UF Nascimento')), s(col(r, 'Tipo Sangue')), tc(col(r, 'Logradouro')), tc(col(r, 'Bairro')), s(col(r, 'UF Residente')),
      sp(col(r, 'Nome do Pai')).toUpperCase(), sp(col(r, 'Nome da Mãe')).toUpperCase(), num(col(r, 'Depto')), num(col(r, 'Código da Função')),
      num(col(r, 'Cel. 1')), num(col(r, 'Cel. 2')), '', s(col(r, 'Email do Func')), '', '', '', '', num(col(r, 'Código do Centro')), ''];
    o.X[34] = o.sexoL;
    recs.push(o);
  }
  if (!recs.length) throw new Error('nenhum colaborador encontrado na planilha');
  const mot = f => String(f).toUpperCase().startsWith('MOTORISTA') ? 1 : 0;
  const q = antigo || {};
  const oldD = new Map(); (q.D || []).forEach((d, i) => oldD.set('5|' + d[0] + '|' + d[9], [i, d, (q.X || [])[i] || []]));
  const chave = o => o.cpf || ('m' + o.mat + '-' + o.nome);
  const porCPF = new Map(); recs.forEach(o => { const k = chave(o); if (!porCPF.has(k)) porCPF.set(k, []); porCPF.get(k).push(o); });
  const ativos = recs.filter(o => o.ec === '5' && o.sit === 'ATIVO').sort((a, b) => a.mat - b.mat);
  const dem = recs.filter(o => o.sit === 'DEMITIDO').sort((a, b) => (a.resc || '0000').localeCompare(b.resc || '0000') || (+a.ec - +b.ec) || (a.mat - b.mat));
  const pid = new Map(); ativos.concat(dem).forEach(o => { const k = chave(o); if (!pid.has(k)) pid.set(k, pid.size); });
  const dd = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 864e5);
  const D = [], X = [], PID = []; let ovr = 0;
  for (const o of ativos) {
    let area = o.area; const key = '5|' + o.mat + '|' + o.adm; const old = oldD.get(key);
    if (old) { const oa = old[1][5]; if (oa !== area && o.setor !== 'AFASTADOS' && o.setor !== 'DESISTENTES' && oa !== 'Afastados' && oa !== 'Desistentes') { area = oa; ovr++; } }
    const sit = area === 'Afastados' ? 'Afastado' : 'Ativo';
    D.push([o.mat, o.nome, o.fun, o.sec, '', area, o.ges, o.con, sit, o.adm, o.idade, o.sexo, o.cid, o.ccd, '', '', '', o.cnhv, o.cnhc, mot(o.fun)]);
    const x = o.X.slice();
    if (old) { const ox = old[2];
      [27, 29, 30, 31, 32].forEach(j => { x[j] = j < ox.length ? ox[j] : ''; });
      [25, 26].forEach(j => { const a = dig(x[j]), b = dig(ox[j]); if (/e\+/i.test(String(x[j])) || (b.length > 15 && a.slice(0, 12) === b.slice(0, 12))) x[j] = ox[j]; }); }
    X.push(x); PID.push(pid.get(chave(o)));
  }
  const DM = [];
  for (const o of dem) {
    const k = chave(o);
    const nx = porCPF.get(k).filter(z => z !== o && z.adm && o.resc && z.adm >= o.resc).map(z => z.adm).sort();
    const prox = nx[0] || '';
    const re3 = prox && dd(prox, o.resc) <= 3 ? 1 : 0;
    DM.push([o.mat, o.nome, o.fun, o.sec, '', o.area, o.ges, o.con, 'Desligado', o.adm, o.idade, o.sexo, o.cid, o.ccd, '', '', '', o.cnhv, o.cnhc, mot(o.fun),
      o.resc, o.emp, o.depto, o.ccc, re3, prox, pid.get(k), o.nasc]);
  }
  // referências do absenteísmo e das admissões/rescisões apontam para posições do Quadro: remapeia para as posições novas
  const ecDe = r => parseInt(String(r[21]).split('(')[1], 10);
  const nD = new Map(D.map((d, i) => ['5|' + d[0] + '|' + d[9], i]));
  const nDM = new Map(), nDM3 = new Map();
  DM.forEach((r, j) => { nDM.set(ecDe(r) + '|' + r[0] + '|' + r[9] + '|' + r[20], j); const k3 = ecDe(r) + '|' + r[0] + '|' + r[9]; if (!nDM3.has(k3)) nDM3.set(k3, j); });
  const oldDMk = (q.DM || []).map(r => [ecDe(r), r[0], r[9], r[20]]);
  let perdidos = 0;
  const remap = c => {
    if (c == null || typeof c !== 'number') return c;
    if (c >= 0) { const d = (q.D || [])[c]; if (!d) { perdidos++; return null; } const k = '5|' + d[0] + '|' + d[9];
      if (nD.has(k)) return nD.get(k); if (nDM3.has(k)) return -nDM3.get(k) - 1; perdidos++; return null; }
    const k = oldDMk[-c - 1]; if (!k) { perdidos++; return null; }
    const k4 = k.join('|'), k3 = k.slice(0, 3).join('|');
    if (nDM.has(k4)) return -nDM.get(k4) - 1; if (nDM3.has(k3)) return -nDM3.get(k3) - 1;
    if (k[0] === 5 && nD.has('5|' + k[1] + '|' + k[2])) return nD.get('5|' + k[1] + '|' + k[2]);
    perdidos++; return null;
  };
  const dados = Object.assign({}, q);
  if (q.ABSD && Array.isArray(q.ABSD.PR)) dados.ABSD = Object.assign({}, q.ABSD, { PR: q.ABSD.PR.map(x => typeof x === 'number' ? remap(x) : x) });
  if (q.AXD) { const A = JSON.parse(JSON.stringify(q.AXD)); (A.ADR || []).forEach(e => { e[2] = remap(e[2]); }); (A.EXR || []).forEach(e => { e[2] = e[2] != null ? remap(e[2]) : null; }); dados.AXD = A; }
  const CPFM = {}; recs.forEach(o => { if (o.ec === '5' && o.cpf) CPFM[String(o.mat)] = o.cpf; });
  // CPF de cada pessoa (todas as empresas), na mesma ordem do identificador de pessoa: permite buscar ex-colaboradores pelo CPF
  const CPFP = []; pid.forEach((i, k) => { CPFP[i] = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(k) ? k : ''; });
  Object.assign(dados, { D, X, DM, PID, CPFM, CPFP });
  // faixa de desconto do plano de saúde: só a faixa (1, 2 ou 3) fica guardada, não o salário
  let nFx = 0;
  if (hSal) { const FX = {};
    for (const o of ativos) { const raw = o.sal; const v = typeof raw === 'number' ? raw : parseFloat(String(raw == null ? '' : raw).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
      if (!(v > 0)) continue; FX[String(o.mat)] = v <= 1665 ? 1 : v <= 2220 ? 2 : 3; nFx++; }
    dados.FX = FX; dados.FXREF = REF; }
  const resumo = { faixas: nFx, colunaSalario: hSal || '', ativos: D.filter(d => d[8] === 'Ativo').length, afastados: D.filter(d => d[8] === 'Afastado').length, desligados: DM.length, linhas: recs.length, areaMantida: ovr, refPerdidas: perdidos, semRegra: Object.keys(semArea) };
  return { pac: { tipo:'crv-pacote', painel:'quadro', referencia: REF, dados }, resumo };
}

/* ---------- Cartões Sysprocard ---------- */
const TIT = { alimentacao:'Cartão Alimentação', convenio:'Cartão Convênio', premium:'Cartão Premium' };
const ARQ = { alimentacao:'USINA CRV INDUST PAT (código 56906)', convenio:'CRV INDUSTRIAL (código 53584)', premium:'USINA CRV INDUS PREMIUM (código 53586)' };
const ELEG = /^(MOTORISTA|OP\. DE MAQUINAS AGRICOLAS|OPERADOR DE MAQUINAS( AGRICOLAS)?) (I{1,3})( \(MG\))?$/;
function pessoasQuadro(Q){
  const P = new Map(), CPFM = Q.CPFM || {};
  const pessoa = (r, sit) => ({ mat:String(r[0]), nome:s(r[1]), func:s(r[2]), secao:s(r[3]), dep:s(r[5]) || 'Sem departamento', ger:s(r[6]) || 'Sem gerência', sit, vinc:s(r[7]), adm:s(r[9]).slice(0, 10), desl: sit === 'Desligado' ? s(r[20]).slice(0, 10) : '' });
  (Q.DM || []).filter(r => String(r[21]).includes('(5)')).sort((a, b) => s(a[20]).localeCompare(s(b[20]))).forEach(r => { const p = pessoa(r, 'Desligado'); if (r.length > 27 && r[27]) p.nasc = s(r[27]).slice(0, 10); P.set(p.mat, p); });
  (Q.D || []).forEach((r, i) => { const p = pessoa(r, r[8] === 'Afastado' ? 'Afastado' : 'Ativo'); const x = (Q.X || [])[i] || []; p.cpf = s(x[11]); p.nasc = s(x[0]).slice(0, 10); P.set(p.mat, p); });
  P.forEach((p, m) => { if (!p.cpf && CPFM[m]) p.cpf = String(CPFM[m]); });
  return P;
}
function montarCartao(tipo, cards, meta, Q, ALOJ){
  const Pq = pessoasQuadro(Q), CPFM = Q.CPFM || {};
  const cpf2mat = new Map(); Object.entries(CPFM).forEach(([m, c]) => { if (Pq.has(m)) { const k = dig(c).slice(-8); if (!cpf2mat.has(k)) cpf2mat.set(k, []); cpf2mat.get(k).push(m); } });
  const rows = [];
  Pq.forEach((p, m) => {
    const c = cards.get(m);
    if (p.sit === 'Desligado' && !(c && c.st === 'Ativo')) return;
    const r = Object.assign({}, p); r.card = c ? c.st : ''; r.idc = c ? c.id : '';
    if (c) r.cpfC = c.cpf;
    if (c && c.lim != null) r.lim = c.lim;
    if (c && dig(c.cpf).slice(-8) && CPFM[m] && !dig(CPFM[m]).endsWith(dig(c.cpf).slice(-8))) r.cpfdif = 1;
    r.eleg = ELEG.test(r.func) ? 1 : 0;
    rows.push(r);
  });
  cards.forEach((c, m) => {
    if (Pq.has(m)) return;
    const cand = cpf2mat.get(dig(c.cpf).slice(-8)) || [];
    rows.push({ cpfC:c.cpf, mat:m, nome:c.nomeC, func:'', secao:'', dep:'Fora do Quadro', ger:'', sit:'Fora do quadro', vinc:'', adm:'', desl:'', card:c.st, idc:c.id, eleg:0,
      lim:c.lim, outraMat:cand[0] || '', outraNome:cand[0] ? Pq.get(cand[0]).nome : '', outraSit:cand[0] ? Pq.get(cand[0]).sit : '' });
  });
  if (tipo !== 'convenio') rows.forEach(r => { delete r.lim; });
  let out = rows;
  if (tipo === 'premium') out = rows.filter(r => r.eleg || r.card);
  if (tipo === 'convenio' && ALOJ) out.forEach(r => { if (ALOJ[r.mat]) r.aloj = ALOJ[r.mat]; });
  const CARTAO = Object.assign({ tipo, titulo:TIT[tipo], arquivo:ARQ[tipo], excEsp:{ '45937':[1320, 'Motorista da diretoria (R$ 1.320)'] },
    exc540:['27066','22550','13018','24806','8771','1648','26505','42456','21477','22901','21052','4728','22056','26499'] }, meta, { rows:out });
  return { tipo:'crv-pacote', formato:2, painel:'cartao-' + tipo, referencia: meta.refPlanilha,
    blocos:[{ tipo:'decl', script:0, itens:[{ nome:'CARTAO', kind:'const', valor:CARTAO }] }], registros:[] };
}
function cardsDaPlanilha(tipo, R){
  const h = R[1].map(s), L = [];
  for (const r of R.slice(2)) { if (!r || r[0] == null || s(r[0]) === '') continue; const o = {}; h.forEach((k, i) => { o[k] = typeof r[i] === 'string' ? r[i].trim() : r[i]; }); L.push(o); }
  const cards = new Map(), sit = {};
  for (const x of L) {
    sit[x['SITUAÇÃO']] = (sit[x['SITUAÇÃO']] || 0) + 1;
    const m = s(x['MATRÍCULA']).replace(/^0+/, '');
    const c = { id:s(x['ID']), nomeC:x['NOME'], st:x['SITUAÇÃO'], cpf:x['CPF'] || '' };
    if (tipo === 'convenio') c.lim = x['LIMITE'];
    const prev = cards.get(m);
    if (!prev || (prev.st !== 'Ativo' && c.st === 'Ativo')) { if (prev) c.dup = 1; cards.set(m, c); } else prev.dup = 1;
  }
  return { cards, n:L.length, sit };
}
function cardsDoPacote(CARTAO){
  const cards = new Map();
  (CARTAO.rows || []).forEach(r => { if (!r.card) return; cards.set(String(r.mat), { id:r.idc, nomeC:r.nome, st:r.card, cpf:r.cpfC || '', lim:r.lim }); });
  return cards;
}
async function alojMapa(){
  try { const d = await window.CRV_DADOS('alojamentos'); const A = d && d.dados.DATA; if (!A || !A.people) return { map:null, ref:'' };
    const m = {}; A.people.forEach(p => { if (p.t === 'c' && p.m) m[String(p.m)] = (A.houses[p.h] || {}).n; }); return { map:m, ref:d.referencia || '' }; } catch(_) { return { map:null, ref:'' }; }
}

/* ---------- entrada: arquivo .xlsx → pacotes para salvar ---------- */
async function ler(f){
  if (!window.XLSX) throw new Error('leitor de Excel indisponível');
  const wb = XLSX.read(await f.arrayBuffer(), { type:'array', cellDates:true });
  const det = detectar(wb, f.name);
  if (!det) throw new Error('planilha não reconhecida. Por enquanto o app lê o relatório de funcionários (Quadro) e as planilhas de cartões Sysprocard.');
  const REF = refDoNome(f.name, f);
  const out = [];
  if (det.tipo === 'quadro') {
    const atual = await window.CRV_DADOS('quadro');
    const { pac, resumo } = converterQuadro(det.R, atual && atual.dados, REF);
    out.push({ pac, rotulo:`Quadro: ${resumo.ativos} ativos, ${resumo.afastados} afastados, ${resumo.desligados} desligados` + (resumo.refPerdidas ? ` · ${resumo.refPerdidas} referências antigas sem par` : ''), resumo });
    const al = await alojMapa();
    for (const t of ['alimentacao', 'convenio', 'premium']) {
      const d = await window.CRV_DADOS('cartao-' + t); const C = d && d.dados.CARTAO; if (!C) continue;
      const meta = { refPlanilha:C.refPlanilha, refQuadro:REF, nPlanilha:C.nPlanilha, sitPlanilha:C.sitPlanilha, alojRef: al.ref || C.alojRef };
      out.push({ pac: montarCartao(t, cardsDoPacote(C), meta, pac.dados, al.map), rotulo:`${TIT[t]} refeito com o quadro novo (cartões de ${String(C.refPlanilha || '').split('-').reverse().join('/')})` });
    }
  } else {
    const Q = await window.CRV_DADOS('quadro'); if (!Q) throw new Error('carregue o Quadro Geral antes dos cartões');
    const { cards, n, sit } = cardsDaPlanilha(det.cartao, det.R);
    const al = await alojMapa();
    const meta = { refPlanilha:REF, refQuadro:Q.referencia || '', nPlanilha:n, sitPlanilha:sit, alojRef:al.ref };
    out.push({ pac: montarCartao(det.cartao, cards, meta, Q.dados, al.map), rotulo:`${TIT[det.cartao]}: ${n} cartões na planilha` });
  }
  return out;
}
window.CRV_IMPORT = { ler, detectar, converterQuadro, montarCartao, cardsDaPlanilha };
})();
