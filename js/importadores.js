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
  // históricos da folha: férias (TFP56T), transferências de departamento (TFP89T) e alterações de cargo (TFP71T)
  if (h.includes('Gozo Inicial') && h.includes('Aquisição Inicial')) return { tipo:'hist', h:'ferias', R };
  if (h.includes('Descrição do Curso') && h.includes('Início do Curso')) return { tipo:'hist', h:'curso', R };
  if (h.includes('Nome do Exame') && h.includes('Data do Próximo Exame')) return { tipo:'hist', h:'exame', R };
  // atestados do sistema (RFP2186R: "Relatório de Afastamento", com CID e médico), um arquivo por empresa
  if (/^Relatório de Afastamento/i.test(s((R[0] || [])[0]))) return { tipo:'hist', h:'atest', R, emp:s((R[1] || [])[0]) };
  // ocorrências do ponto (RPE0663R: "Relatório das Ocorrências dos Funcionários"), um arquivo por período
  if (R.slice(0, 4).some(r => (r || []).map(s).some(x => /^Relatório das Ocorrências dos Funcionários/i.test(x)))) return { tipo:'hist', h:'ocor', R };
  // ocorrências do ponto, outro formato (RPE0026R: "Relatório de Ocorrências", uma linha por dia: matrícula, nome, data, ocorrência)
  if (R.slice(0, 3).some(r => (r || []).map(s).some(x => /^Relatório de Ocorrências$/i.test(x))) && R.slice(0, 10).some(r => { const v = (r || []).map(s).filter(Boolean); return v[0] === 'Matrícula' && v[2] === 'Data' && /^Ocorr/i.test(v[3] || ''); })) return { tipo:'hist', h:'ocor', R };
  if (h.includes('Data de Afastamento') && h.includes('Data Efetiva de Retorno')) return { tipo:'hist', h:'afast', R };
  if (h.includes('Data da Aposentadoria') && h.includes('Nome do Benefício')) return { tipo:'hist', h:'apos', R };
  if (h.includes('Causa da Estabilidade') && h.includes('Fim da Estabilidade')) return { tipo:'hist', h:'estab', R };
  // dependentes cadastrados na folha (PFP0658P: "Dados Cadastrais dos Dependentes")
  if (R.slice(0, 4).some(r => (r || []).map(s).some(x => /^Dados Cadastrais dos/i.test(x))) && R.some(r => s((r || [])[0]) === 'DEPENDENTES')) return { tipo:'hist', h:'dep', R };
  if (h.includes('Data da Transferência') && h.includes('Novo Departamento')) return { tipo:'hist', h:'depto', R };
  if (h.includes('Data Alteração') && h.includes('Cargo Novo')) return { tipo:'hist', h:'cargo', R };
  // relação de jovens da RENAPSI com a idade (Nome do Jovem, Cidade, Estado, CNPJ, Idade, Carga Horária, Início e Fim do Contrato)
  if (h.includes('Nome do Jovem') && h.includes('Idade')) return { tipo:'renIdade', R };
  // salários da folha (Código, Nome, CPF, Situação, Função, Admissão, Salário): painel restrito, só a equipe RH vê
  { const im = h.findIndex(x => /^(c[oó]digo|matr[ií]cula)$/i.test(x)), is = h.findIndex(x => /^sal[aá]rio/i.test(x));
    if (im >= 0 && is >= 0 && h.filter(Boolean).length <= 15 && !h.includes('EMPRESA')) return { tipo:'salario', R, im, is }; }
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
  // trava de segurança (out/2026): uma planilha incompleta (ex.: filtrada ou de outra empresa) zerava o Quadro e todos os painéis que dependem dele
  { const antes = ((antigo || {}).D || []).length;
    if (!ativos.length) throw new Error('a planilha não tem nenhum colaborador ativo da CRV (empresa 5). Confira se não está filtrada ou se é o arquivo certo. Nada foi alterado.');
    if (antes >= 200 && ativos.length < antes * 0.7) throw new Error(`a planilha tem só ${ativos.length} ativos da CRV, e o Quadro atual tem ${antes}. Parece incompleta (filtrada ou de outra empresa). Nada foi alterado.`); }
  const dem = recs.filter(o => o.sit === 'DEMITIDO').sort((a, b) => (a.resc || '0000').localeCompare(b.resc || '0000') || (+a.ec - +b.ec) || (a.mat - b.mat));
  // ativos das outras empresas do grupo (APFO 6, CAPFO 16): só o essencial, para cruzamentos por CPF (ex.: aproveitamento de jovens aprendizes)
  const outrosAt = recs.filter(o => o.ec !== '5' && o.sit !== 'DEMITIDO').sort((a, b) => (+a.ec - +b.ec) || (a.mat - b.mat));
  const pid = new Map(); ativos.concat(dem).concat(outrosAt).forEach(o => { const k = chave(o); if (!pid.has(k)) pid.set(k, pid.size); });
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
  const OUTAT = outrosAt.map(o => [o.mat, o.nome, o.fun, o.sec, o.area, o.ges, o.adm, o.emp, o.ccd, pid.get(chave(o)), o.sit]);
  Object.assign(dados, { D, X, DM, PID, CPFM, CPFP, OUTAT });
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

/* ---------- históricos da folha → um registro por pessoa (confere matrícula e nome com o Quadro) ---------- */
const nomeN = v => s(v).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
const mesmoNome = (a, b) => { a = nomeN(a); b = nomeN(b); if (!a || !b) return false; if (a.startsWith(b) || b.startsWith(a)) return true; const x = a.split(' '), y = b.split(' '); return x.length > 1 && y.length > 1 && x[0] === y[0] && x[1] === y[1]; };
function converterHist(h, R, mapa, REF){
  const H = R[0].map(s), ix = n => H.findIndex(x => x.startsWith(n)), I = {};
  const get = (r, n) => r[I[n] != null ? I[n] : (I[n] = ix(n))];
  const itens = {}; let lin = 0, ign = 0, fora = 0, anul = 0;
  if (h === 'dep') { let m = 0, ok = false, modo = '';
    for (const r of R) { const c = (r || []).map(s);
      if (/^#/.test(c[0]) && /^\d+$/.test(c[1])) { m = parseInt(c[1], 10); const q = mapa[String(m)]; ok = !!q && mesmoNome(c[2], q.nome); if (!q) fora++; else if (!ok) ign++; modo = ''; if (ok) itens[m] = itens[m] || []; continue; }
      if (c[0] === 'DEPENDENTES') { modo = 'd'; continue; }
      if (/^Total/i.test(c[0])) { modo = ''; continue; }
      if (modo === 'd' && ok && /^\d+$/.test(c[0]) && c[1]) { itens[m].push([sp(c[1]), iso(r[2]), sp(c[3]), c[4], dig(c[8]) ? dig(c[8]).padStart(11, '0') : '']); lin++; } }
    Object.keys(itens).forEach(k => { if (!itens[k].length) delete itens[k]; });
    return { tipo:'crv-hist', painel:'quadro', hist:h, referencia:REF, itens, n:{ linhas:lin, pessoas:Object.keys(itens).length, nomeDiferente:ign, foraDoQuadro:fora, anuladas:0 } };
  }
  if (h === 'atest') { // [início, dias, CID, descrição do CID, CRM/UF, médico]
    let ini = '', fim = '';
    for (const r of R) { if (!(r && /^\d+$/.test(s(r[0])) && r[3] instanceof Date)) continue; const m = parseInt(s(r[0]), 10); let q = mapa[String(m)];
      if (!q && mapa.__aberto) { q = mapa[String(m)] = { nome:sp(r[1]), funcao:sp(r[2]), setor:'', area:'', gerencia:'', admissao:'', deslig:'', nasc:'', soArq:1 }; }
      if (!q) { fora++; continue; } if (!mesmoNome(r[1], q.nome)) { ign++; continue; }
      const d = iso(r[3]); if (!d) continue; if (!ini || d < ini) ini = d; if (!fim || d > fim) fim = d;
      (itens[m] = itens[m] || []).push([d, Math.max(0, parseInt(num(r[4]), 10) || 0), s(r[5]).toUpperCase(), sp(r[6]), s(r[7]), sp(r[8])]); lin++; }
    Object.values(itens).forEach(L => L.sort((a, b) => a[0].localeCompare(b[0])));
    return { tipo:'crv-hist', painel:'quadro', hist:h, referencia:REF, itens, faixa: ini ? ['0000-01-01', '9999-12-31'] : null, periodo:[ini, fim], empresa:'', n:{ linhas:lin, pessoas:Object.keys(itens).length, nomeDiferente:ign, foraDoQuadro:fora, anuladas:0, ini, fim } };
  }
  if (h === 'ocor') { // [data, tipo, quantidade]; atestados ficam de fora (vêm da planilha de atestados do RH)
    const TP = d => /ATEST/.test(d) ? '' : /FALTA JUST/.test(d) ? 'j' : /FALTA/.test(d) ? 'f' : /SUSPENS/.test(d) ? 's' : /MATERN/.test(d) ? 'm' : /PATERN/.test(d) ? 'p' : 'o';
    const cp = r => (r || []).filter(x => x != null && s(x) !== '');
    if (R.slice(0, 10).some(r => { const v = cp(r).map(s); return v[0] === 'Matrícula' && v[2] === 'Data'; })) { // RPE0026R: uma linha por dia, sem quantidade
      let ini = '', fim = '', at = 0, emp = s((R[0] || [])[0]); const vist = {};
      for (const r of R) { const v = cp(r);
        if (/^Per[ií]odo/i.test(s(v[0])) && v[1] instanceof Date) { ini = iso(v[1]); const f = v.find((x, i) => i > 1 && x instanceof Date); if (f) fim = iso(f); continue; }
        if (/^Empresa/i.test(s(v[0])) && /^\d+$/.test(s(v[1]))) { emp = s(v[1]); continue; }
        if (v.length < 4 || !(v[2] instanceof Date) || !/^\d+$/.test(s(v[0]))) continue;
        const m = parseInt(s(v[0]), 10), d = iso(v[2]), ds = s(v[3]).toUpperCase(), t = TP(ds); if (!d) continue;
        if (!t) { at++; continue; }
        if (!(m in vist)) { let q = mapa[String(m)]; if (!q && mapa.__aberto) { q = mapa[String(m)] = { nome:sp(v[1]), funcao:'', setor:'', area:'', gerencia:'', admissao:'', deslig:'', nasc:'', soArq:1 }; fora++; } vist[m] = !!q && mesmoNome(v[1], q.nome); if (!q) fora++; else if (!vist[m]) ign++; }
        if (!vist[m]) continue; const it = [d, t, 1]; if (t === 'o') it.push(sp(v[3])); (itens[m] = itens[m] || []).push(it); lin++; }
      Object.keys(itens).forEach(k => itens[k].sort((a, b) => a[0].localeCompare(b[0])));
      return { tipo:'crv-hist', painel:'quadro', hist:h, referencia:REF, itens, faixa: ini ? [ini, fim || ini] : null, tipos:[...new Set([].concat(...Object.values(itens)).map(x => x[1]))], empresa:emp, n:{ linhas:lin, pessoas:Object.keys(itens).length, nomeDiferente:ign, foraDoQuadro:fora, anuladas:0, atestados:at, ini, fim } };
    }
    const TP_ = d => /ATEST/.test(d) ? '' : /FALTA JUST/.test(d) ? 'j' : /FALTA/.test(d) ? 'f' : /SUSPENS/.test(d) ? 's' : /MATERN/.test(d) ? 'm' : /PATERN/.test(d) ? 'p' : 'o';
    let m = 0, ok = false, ini = '', fim = '', at = 0; const emp = s((R[0] || [])[0]);
    for (const r of R) { const c0 = (r || [])[0];
      if (c0 instanceof Date) { const d = iso(c0); if (!d) continue; if (!ini || d < ini) ini = d; if (!fim || d > fim) fim = d; if (!ok) continue;
        const ds = s(r[2]).toUpperCase(), t = TP(ds); if (!t) { at++; continue; } const it = [d, t, Math.round((+num(r[3]) || 0) * 100) / 100]; if (t === 'o') it.push(sp(r[2])); itens[m].push(it); lin++; continue; }
      if (/^\d+$/.test(s(c0)) && typeof (r || [])[1] === 'string' && !/LTDA|S\/?A\b/i.test(r[1]) && s(r[1]) !== 'Nome do Funcionário' && !/^Data\/Hora/i.test(s(r[2]))) { m = parseInt(s(c0), 10); let q = mapa[String(m)]; if (!q && mapa.__aberto) { q = mapa[String(m)] = { nome:sp(r[1]), funcao:sp(r[2]), setor:'', area:'', gerencia:'', admissao:'', deslig:'', nasc:'', soArq:1 }; fora++; } ok = !!q && mesmoNome(r[1], q.nome); if (!q) fora++; else if (!ok) ign++; if (ok) itens[m] = itens[m] || []; } }
    Object.keys(itens).forEach(k => { if (!itens[k].length) delete itens[k]; else itens[k].sort((a, b) => a[0].localeCompare(b[0])); });
    return { tipo:'crv-hist', painel:'quadro', hist:h, referencia:REF, itens, faixa: ini ? [ini, fim] : null, empresa:emp, n:{ linhas:lin, pessoas:Object.keys(itens).length, nomeDiferente:ign, foraDoQuadro:fora, anuladas:0, atestados:at, ini, fim } };
  }
  for (const r of R.slice(1)) {
    const m = parseInt(num(get(r, 'Funcionário')), 10); if (!m) continue;
    const q = mapa[String(m)];
    if (!q) { fora++; continue; }
    if (!mesmoNome(get(r, 'Nome do Funcionário'), q.nome)) { ign++; continue; }
    let it = null;
    if (h === 'curso') { it = [iso(get(r, 'Início do Curso')), iso(get(r, 'Final do Curso')), sp(get(r, 'Descrição do Curso')), num(get(r, 'Codigo do Curso'))]; if (!it[0] || !it[2]) continue; (itens[m] = itens[m] || []).push(it); lin++; continue; }
    if (h === 'exame') { const cl = sp(get(r, 'Desc. Classificação')) || sp(get(r, 'Nome do Exame')); it = [iso(get(r, 'Data do Exame')), iso(get(r, 'Data do Próximo Exame')), cl, s(get(r, 'Exame de Demissão')).toUpperCase() === 'S' ? 1 : 0]; if (!it[0]) continue; (itens[m] = itens[m] || []).push(it); lin++; continue; }
    if (h === 'afast') { // TFP44T: [início, retorno ('' = segue afastado), código, causa, CID]
      it = [iso(get(r, 'Data de Afastamento')), iso(get(r, 'Data Efetiva de Retorno')) || '', sp(get(r, 'Causa Afast')), sp(get(r, 'Descr. Causa Afastamento')), sp(get(r, 'CID'))]; if (!it[0]) continue; (itens[m] = itens[m] || []).push(it); lin++; continue; }
    if (h === 'apos') { // TFP43T: [data, término ('' = sem término), benefício, nº do benefício, 1 = nome e número vieram trocados]
      let bn = sp(get(r, 'Nome do Benefício')), nb = sp(get(r, 'Número do Benefício')); let tr = 0; if (/^[\d.\-\s]+$/.test(bn)) { if (nb && !/^[\d.\-\s]+$/.test(nb)) { const t = nb; nb = bn; bn = t; tr = 1; } else if (!nb) { nb = bn; bn = ''; } }
      const fim = iso(get(r, 'Data Término da Aposentadoria')); it = [iso(get(r, 'Data da Aposentadoria')), fim && fim < '2900' ? fim : '', bn, nb, tr]; if (!it[0]) continue; (itens[m] = itens[m] || []).push(it); lin++; continue; }
    if (h === 'estab') { it = { mat:m, nome:q.nome, causa:sp(get(r, 'Descrição da Causa')), inicio:iso(get(r, 'Início da Estabilidade')), fim:iso(get(r, 'Fim da Estabilidade')) }; if (!it.fim) continue; (itens[m] = itens[m] || []).push(it); lin++; continue; }
    if (h === 'ferias') { if (s(get(r, 'Anula')).toUpperCase() === 'S') { anul++; continue; }
      it = [iso(get(r, 'Aquisição Inicial')), iso(get(r, 'Aquisição Final')), iso(get(r, 'Gozo Inicial')), iso(get(r, 'Gozo Final')), iso(get(r, 'Data Retorno'))]; if (!it[2]) continue; }
    else if (h === 'depto') { const a = sp(get(r, 'Nome do Departamento Anterior')), b = sp(get(r, 'Nome do Novo Departamento')); if (!a || a === b) continue;
      it = [iso(get(r, 'Data da Transferência')), a, b]; if (!it[0]) continue; }
    else { const a = sp(r[H.findIndex(x => x.startsWith('Busca Descrição Cargo Antigo'))]) || sp(get(r, 'Descrição Cargo Antigo')), b = sp(r[H.findIndex(x => x.startsWith('Busca Descrição Cargo Novo'))]) || sp(get(r, 'Descrição Cargo Novo'));
      const d = iso(get(r, 'Data Alteração')); if (!d || !a || a === b) continue; it = [d, a, b]; }
    (itens[m] = itens[m] || []).push(it); lin++;
  }
  if (h !== 'estab') Object.values(itens).forEach(L => L.sort((a, b) => String(h === 'ferias' ? a[2] : a[0]).localeCompare(String(h === 'ferias' ? b[2] : b[0]))));
  return { tipo:'crv-hist', painel:'quadro', hist:h, referencia:REF, itens, n:{ linhas:lin, pessoas:Object.keys(itens).length, nomeDiferente:ign, foraDoQuadro:fora, anuladas:anul } };
}

/* ---------- entrada: arquivo .xlsx → pacotes para salvar ---------- */
async function ler(f){
  if (!window.XLSX) throw new Error('leitor de Excel indisponível');
  const wb = XLSX.read(await f.arrayBuffer(), { type:'array', cellDates:true });
  const det = detectar(wb, f.name);
  if (!det) throw new Error('planilha não reconhecida. Por enquanto o app lê o relatório de funcionários (Quadro), as planilhas de cartões Sysprocard e os históricos de férias, departamentos e funções.');
  const REF = refDoNome(f.name, f);
  const out = [];
  if (det.tipo === 'hist') {
    const Q = await window.CRV_QUADRO(); if (!Q || !Q.mapa) throw new Error('carregue o Quadro Geral antes dos históricos');
    let mapaH = Q.mapa, ligaCRV = null;
    const EMP = det.h === 'atest' ? det.emp : s((det.R[0] || [])[0]); let EMPN = '';
    if (['ocor', 'atest'].includes(det.h) && EMP && EMP !== '5') { // outra empresa do grupo (APFO 6, CAPFO 16…): confere com os desligados dela no Quadro e liga a quem hoje está na CRV
      const QD = await window.CRV_DADOS('quadro'), DM = (QD && QD.dados && QD.dados.DM) || []; mapaH = {};
      const reE = new RegExp('\\(' + EMP + '\\)\\s*$'); DM.forEach(r => { if (!reE.test(s(r[21]))) return; if (!EMPN) EMPN = s(r[21]).replace(/\s*\(\d+\)\s*$/, ''); const m = s(r[0]); if (!mapaH[m] || s(r[20]) > (mapaH[m].deslig || '')) mapaH[m] = { nome:s(r[1]), funcao:s(r[2]), setor:s(r[3]), area:s(r[5]), gerencia:s(r[6]), admissao:s(r[9]), deslig:s(r[20]), nasc:s(r[27]) }; });
      if (!Object.keys(mapaH).length) throw new Error('o Quadro carregado não tem os desligados da empresa ' + EMP + ' para conferir as matrículas');
      Object.defineProperty(mapaH, '__aberto', { value:true, enumerable:false }); // quem foi transferido para a CRV não está nos desligados da outra empresa: entra pelo nome do relatório
      const porNome = {}; Object.entries(Q.mapa).forEach(([m, o]) => { const k = nomeN(o.nome); (porNome[k] = porNome[k] || []).push([m, o]); });
      ligaCRV = m => { const a = mapaH[m]; if (!a) return ''; let L = (porNome[nomeN(a.nome)] || []).filter(([, o]) => !a.nasc || !o.nasc || o.nasc === a.nasc); if (L.length > 1) L = L.filter(([, o]) => o.situacao !== 'Desligado'); return L.length === 1 ? L[0][0] : ''; };
    }
    let pac = converterHist(det.h, det.R, mapaH, REF);
    if (det.h === 'atest') pac.empresa = EMP;
    if (ligaCRV) { pac.hist = det.h + EMP; pac.docPre = 'a'; pac.empNome = EMPN || 'Empresa ' + EMP; pac.extra = {}; let lig = 0;
      Object.keys(pac.itens).forEach(m => { const a = mapaH[m], c = ligaCRV(m); if (c) lig++; const qc = c ? Q.mapa[c] : null; pac.extra[m] = { p:[a.nome, a.funcao, a.area || (qc ? qc.area : '') || (a.soArq ? 'Transferidos (sem cadastro na ' + (EMPN || 'empresa') + ')' : ''), a.setor || (qc ? qc.setor : ''), a.gerencia, a.soArq ? (c ? 'Transferido para a CRV' : 'Sem cadastro no Quadro') : 'Desligado', a.admissao, a.deslig], crv:c }; }); pac.n.ligados = lig; pac.n.foraDoQuadro = Object.keys(pac.itens).filter(m => mapaH[m] && mapaH[m].soArq && !ligaCRV(m)).length; } const T = { ferias:'Histórico de férias', depto:'Histórico de departamentos', cargo:'Histórico de funções', dep:'Dependentes da folha', curso:'Treinamentos realizados', exame:'Exames ocupacionais (ASO)', afast:'Histórico de afastamentos', ocor:'Ocorrências do ponto', atest:'Atestados do sistema', ocor6:'Ocorrências do ponto da APFO (empresa 6)', apos:'Aposentadorias', estab:'Estabilidades da folha' }[det.h];
    if (det.h === 'estab') { // entra no cadastro de estabilidade que o app já usa (Quadro Geral, Central, checklist de desligamento)
      const TIP = c => /CIP/i.test(c) ? 'CIPA' : /ACIDENTE/i.test(c) ? 'Acidente de trabalho' : /GESTANTE/i.test(c) ? 'Gestante' : /APOSENT/i.test(c) ? 'Pré-aposentadoria' : /SINDIC/i.test(c) ? 'Dirigente sindical' : 'Outro';
      const itens = [].concat(...Object.values(pac.itens)).map(x => ({ mat:String(x.mat), nome:x.nome, tipo:TIP(x.causa), detalhe:x.causa, inicio:x.inicio, fim:x.fim, status:'confirmada', origem:'Relatório de estabilidades da folha (TFP40T)' }));
      const hoje = new Date().toISOString().slice(0, 10);
      out.push({ pac:{ estab:true, painel:'quadro', referencia:REF, itens }, rotulo:`${T}: ${itens.length} registros, ${itens.filter(x => x.fim >= hoje).length} vigentes` + (pac.n.nomeDiferente ? ` · ${pac.n.nomeDiferente} com nome diferente do Quadro (fora)` : '') });
      return out; }
    if (det.h === 'atest') { const br = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '', T = 'Atestados do sistema' + (pac.empNome ? ' da ' + pac.empNome : ' da CRV') + ' (empresa ' + EMP + ')';
      if (!pac.faixa) { out.push({ pac, rotulo:`${T}: arquivo sem lançamentos (nada a salvar)` }); return out; }
      out.push({ pac, rotulo:`${T} de ${br(pac.periodo[0])} a ${br(pac.periodo[1])}: ${pac.n.linhas} atestados de ${pac.n.pessoas} pessoas (substitui os atestados desta empresa já carregados)` + (pac.n.nomeDiferente ? ` · ${pac.n.nomeDiferente} com nome diferente do Quadro (fora)` : '') + (pac.n.foraDoQuadro ? ` · ${pac.n.foraDoQuadro} ${pac.hist === 'atest' ? 'fora do Quadro' : 'sem cadastro no Quadro nem nome igual na CRV'}` : '') + (pac.n.ligados != null ? ` · ${pac.n.ligados} estão hoje na CRV (aparecem na ficha deles)` : '') }); return out; }
    if (det.h === 'ocor') { const T = pac.hist !== 'ocor' ? 'Ocorrências do ponto da ' + pac.empNome + ' (empresa ' + pac.empresa + ')' : 'Ocorrências do ponto', br = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '';
      if (!pac.faixa) { out.push({ pac, rotulo:`${T}: arquivo sem lançamentos (nada a salvar)` }); return out; }
      
      out.push({ pac, rotulo:`${T} de ${br(pac.faixa[0])} a ${br(pac.faixa[1])}: ${pac.n.linhas} lançamentos de ${pac.n.pessoas} pessoas (${pac.tipos ? (l => l.length > 1 ? l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1] : l[0] || 'nenhuma ocorrência')(['f', 'j', 's', 'm', 'p', 'o'].filter(t => pac.tipos.includes(t)).map(t => ({ f:'faltas', j:'faltas justificadas', s:'suspensões', m:'licença-maternidade', p:'licença-paternidade', o:'outras' })[t])) + ' do período; os outros tipos já carregados ficam como estão' : 'faltas, faltas justificadas, suspensões e licenças'}; ${pac.n.atestados} atestados ficam de fora)` + (pac.n.nomeDiferente ? ` · ${pac.n.nomeDiferente} com nome diferente do Quadro (fora)` : '') + (pac.n.foraDoQuadro ? ` · ${pac.n.foraDoQuadro} ${pac.hist === 'ocor' ? 'matrículas fora do Quadro' : 'sem cadastro no Quadro nem nome igual na CRV'}` : '') + (pac.n.ligados != null ? ` · ${pac.n.ligados} estão hoje na CRV (aparecem na ficha deles)` : '') }); return out; }
    out.push({ pac, rotulo:`${T}: ${pac.n.linhas} ${det.h === 'dep' ? 'dependentes' : 'registros'} de ${pac.n.pessoas} ${det.h === 'dep' ? 'colaboradores' : 'pessoas'}` + (pac.n.anuladas ? ` · ${pac.n.anuladas} anuladas fora` : '') + (pac.n.nomeDiferente ? ` · ${pac.n.nomeDiferente} com nome diferente do Quadro (fora)` : '') });
    return out;
  }
  if (det.tipo === 'renIdade') { // idade informada pela RENAPSI: entra no painel da RENAPSI para quem não tem data de nascimento
    const H = det.R[0].map(s), iN = H.indexOf('Nome do Jovem'), iI = H.indexOf('Idade'), iIn = H.findIndex(x => /^in[ií]cio/i.test(x)), iF = H.findIndex(x => /^fim/i.test(x));
    const nk = v => s(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
    const itens = det.R.slice(1).filter(r => r && s(r[iN]) && /\d/.test(s(r[iI]))).map(r => ({ k:nk(r[iN]), n:sp(r[iN]), idade:parseInt(s(r[iI]).replace(/\D/g, ''), 10), ini:iIn >= 0 ? iso(r[iIn]) : '', fim:iF >= 0 ? iso(r[iF]) : '', ref:REF }));
    if (!itens.length) throw new Error('não achei nomes e idades na planilha');
    out.push({ pac:{ renIdade:true, painel:'renapsi', referencia:REF, itens }, rotulo:`Idade dos jovens RENAPSI: ${itens.length} jovens (idade informada em ${REF.split('-').reverse().join('/')})` });
    return out;
  }
  if (det.tipo === 'salario') { // fica no painel restrito "salarios": o banco só entrega para a equipe RH
    const H = det.R[0].map(s), ix = re => H.findIndex(x => re.test(x)), iN = ix(/^nome/i), iS = ix(/^situa/i), iF = ix(/^fun[cç]/i), iA = ix(/^admiss/i);
    const ant = await window.CRV_DADOS('salarios'), A = (ant && ant.dados && ant.dados.SAL) || {}, refA = (ant && ant.referencia) || '';
    const S = {}; let n = 0, at = 0, mud = 0;
    det.R.slice(1).forEach(r => { if (!r) return; const m = dig(r[det.im]).replace(/^0+/, ''); let v = r[det.is];
      if (typeof v !== 'number') v = parseFloat(s(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
      if (!m || !(v > 0)) return; v = Math.round(v * 100) / 100;
      const o = A[m], hist = o ? (o[5] || []).slice() : [];
      if (o && o[0] !== v && refA < REF) { hist.unshift([refA, o[0]]); mud++; }
      S[m] = [v, iS >= 0 ? sp(r[iS]) : '', iF >= 0 ? sp(r[iF]) : '', iA >= 0 ? iso(r[iA]) : '', iN >= 0 ? sp(r[iN]) : '', hist.slice(0, 12)]; n++;
      if (/^(ativo|afastado)/i.test(S[m][1])) at++; });
    if (!n) throw new Error('planilha de salários sem valores');
    out.push({ pac:{ tipo:'crv-pacote', painel:'salarios', referencia:REF, nomes:['SAL'], dados:[S] }, rotulo:`Salários: ${n} matrículas (${at} ativas ou afastadas)` + (mud ? ` · ${mud} com salário diferente da base anterior (fica no histórico)` : '') + ' · só a equipe RH vê' });
    return out;
  }
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
window.CRV_IMPORT = { ler, detectar, converterQuadro, montarCartao, cardsDaPlanilha, converterHist };
})();
