/* =====================================================================
   MODO OFFLINE (out/2026) · consulta sem internet, com segurança dos dados
   · Tudo o que o app lê do Supabase passa por aqui (fetch do cliente). Com internet: vai para a rede e uma cópia LIMPA
     (sem dados sensíveis) fica guardada no aparelho, cifrada (AES-GCM, chave que não sai do navegador) no IndexedDB.
   · Sem internet: as leituras são respondidas pela cópia guardada (consulta local simples: igual / em / é nulo /
     ordem / páginas), e a faixa "Sem conexão – dados de dd/mm às hh:mm" aparece no topo.
   · Nunca ficam no aparelho: salário, CPF, RG, endereço, telefone, dados bancários, ouvidorias/escutas e saúde
     (atestados com CID, ASO, afastamentos, plano de saúde, odontológico, farmácia, acidente de trabalho). Onde a tela
     mostraria esses campos aparece "Disponível apenas com conexão"; os painéis inteiros desses assuntos não abrem.
   · Gravações sem internet: recusadas com "Precisa de internet para enviar" (exceção: fila "Aguardando envio").
   · Sair apaga tudo; N dias sem conectar apaga tudo (padrão 7, ajustável na Administração); usuário bloqueado ou
     excluído: apaga na próxima conexão. Liga/desliga por perfil na Administração (tabela app_config, chave 'offline').
   ===================================================================== */
(function(){
'use strict';
const TXT = 'Disponível apenas com conexão';
const NET = 'Precisa de internet para enviar';

/* ---------------- núcleo puro (também usado nos testes em Node) ---------------- */
const NUCLEO = (function(){
  // painéis e coleções que nunca ficam no aparelho (saúde, salário, ouvidoria)
  const BLOQ_PAINEL = new Set(['ouvidorias', 'unimed', 'uniodonto', 'farmacia', 'absenteismo', 'absenteismo-gestao', 'salarios', 'nr1']);
  const BLOQ_COL = /^(hist_atest|hist_exame|hist_afast|acidentes|reembolsos)/;
  const SEM_CACHE = new Set(['acessos', 'historico', 'push_inscricoes']);
  const PK = { registros:['painel', 'caminho'], pacotes:['painel'], paineis:['id'], bases:['painel'], perfis:['user_id'], area_dados:['chave'],
    gestor_envios:['id'], gestor_docs:['id'], notificacoes:['id'], app_config:['chave'] };
  const FORA = { gestor_docs:['pdf'], gestor_envios:['rh_anexos'] };   // arquivos grandes: não guardar
  const K_SENS = /^(cpf|cpfs|rg|pis|ctps|telefone|telefones|tel|tel1|tel2|fone|fones|celular|celulares|cel|cel1|cel2|whatsapp|whats|zap|endereco|endereço|logradouro|rua|bairro|cep|complemento|salario|salário|sal|salarios|remuneracao|remuneração|banco|agencia|agência|conta|pix|chavepix|chave_pix|cid|cids|cid10|crm|medico|médico|diagnostico|diagnóstico)$/i;
  const R_CPF = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, R_TEL = /\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]\d{4}\b/g, R_DIG = /^\s*\d{10,11}\s*$/, R_NUM = /(?<![\d.,/-])\b\d{10,11}\b(?![\d.,/-])/g;
  const vazio = v => v === null || v === undefined || v === '';
  function limparTexto(s){ if (R_DIG.test(s)) return TXT; if (s.length < 9) return s; return s.replace(R_CPF, TXT).replace(R_TEL, TXT).replace(R_NUM, TXT); }
  /* limpeza genérica: chaves sensíveis viram o aviso; textos com CPF/telefone também */
  function limpar(v, prof){ prof = prof || 0; if (prof > 40) return v;
    if (typeof v === 'string') return limparTexto(v);
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = limpar(v[i], prof + 1); return v; }
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) { if (K_SENS.test(k)) { if (!vazio(v[k])) v[k] = (v[k] && typeof v[k] === 'object') ? (Array.isArray(v[k]) ? [] : {}) : TXT; } else v[k] = limpar(v[k], prof + 1); } return v; }
    return v; }
  /* Quadro Geral: X = documentos e contatos (posições), CPFM/CPFP = CPFs, FX = faixa salarial, ABSD = absenteísmo com CID */
  const X_SENS = [2, 3, 7, 8, 9, 10, 11, 12, 13, 17, 18, 19, 25, 26];
  function limparQuadro(o){ const q = o && (o.dados && Array.isArray(o.dados.D) ? o.dados : Array.isArray(o.D) ? o : null); if (!q) return o;
    if (Array.isArray(q.X)) q.X.forEach(x => { if (Array.isArray(x)) X_SENS.forEach(j => { if (!vazio(x[j])) x[j] = TXT; }); });
    if (q.CPFM) q.CPFM = {}; if (q.CPFP) q.CPFP = []; if (q.FX) q.FX = {};
    if (q.ABSD) { const A = q.ABSD; if (Array.isArray(A.grps)) A.grps = A.grps.map(() => TXT); if (Array.isArray(A.docs)) A.docs = A.docs.map(() => TXT);
      if (Array.isArray(A.A)) A.A.forEach(a => { if (Array.isArray(a)) { if (a.length > 3) a[3] = null; if (a.length > 4) a[4] = null; } }); }
    return o; }
  function limparPacote(painel, o){ if (painel === 'quadro' || painel === '__quadro') limparQuadro(o); return limpar(o); }
  const bloqueado = (painel, colecao) => BLOQ_PAINEL.has(String(painel || '')) || BLOQ_COL.test(String(colecao || ''));

  /* ---------- consulta: lê a URL do PostgREST ---------- */
  function partes(s){ const out = []; let d = 0, cur = ''; for (const c of s) { if (c === '(') d++; if (c === ')') d--; if (c === ',' && !d) { out.push(cur); cur = ''; } else cur += c; } if (cur) out.push(cur); return out; }
  function lerSelect(s){ if (!s || s === '*') return [{ todos:true }];
    return partes(s).map(x => { x = x.trim(); if (x === '*') return { todos:true }; let alias = null; const m = /^([A-Za-z0-9_]+):(.+)$/.exec(x); if (m && !/->/.test(m[1])) { alias = m[1]; x = m[2]; }
      const cam = x.split(/(->>|->)/); const col = cam[0]; const path = []; for (let i = 1; i < cam.length; i += 2) path.push([cam[i], cam[i + 1]]);
      return { col, path, alias, nome:alias || (path.length ? path[path.length - 1][1] : col), json:path.length > 0 }; }); }
  function lerLista(v){ const s = v.replace(/^\(/, '').replace(/\)$/, ''); const out = []; let cur = '', q = false;
    for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === '"') { q = !q; continue; } if (c === ',' && !q) { out.push(cur); cur = ''; continue; } cur += c; } out.push(cur); return out; }
  const RESERV = new Set(['select', 'order', 'offset', 'limit', 'on_conflict', 'columns']);
  function lerConsulta(url){ const u = new URL(url); const tabela = decodeURIComponent(u.pathname.replace(/^\/rest\/v1\//, '')); const sp = u.searchParams;
    const filtros = []; sp.forEach((v, k) => { if (RESERV.has(k)) return; const m = /^(not\.)?(eq|neq|in|is|gt|gte|lt|lte|like|ilike)\.(.*)$/s.exec(v); if (!m) { filtros.push({ col:k, op:'??', val:v }); return; }
      filtros.push({ col:k, neg:!!m[1], op:m[2], val:m[2] === 'in' ? lerLista(m[3]) : m[3] }); });
    const ordem = (sp.get('order') || '').split(',').filter(Boolean).map(o => { const p = o.split('.'); return { col:p[0], desc:p[1] === 'desc', nl:p[2] }; });
    return { tabela, sel:lerSelect(sp.get('select')), selTxt:sp.get('select') || '*', filtros, ordem, offset:+(sp.get('offset') || 0), limit:sp.has('limit') ? +sp.get('limit') : null }; }
  const eqDe = (C, col) => { const f = C.filtros.find(x => x.col === col && x.op === 'eq' && !x.neg); return f ? f.val : undefined; };
  const inDe = (C, col) => { const f = C.filtros.find(x => x.col === col && !x.neg && (x.op === 'eq' || x.op === 'in')); return f ? (f.op === 'eq' ? [f.val] : f.val) : null; };
  function casa(v, f){ let r; const s = v === null || v === undefined ? null : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    switch (f.op) {
      case 'eq': r = s === f.val; break; case 'neq': r = s !== f.val; break; case 'in': r = s !== null && f.val.includes(s); break;
      case 'is': r = f.val === 'null' ? (v === null || v === undefined) : f.val === 'true' ? v === true : f.val === 'false' ? v === false : false; break;
      case 'gt': r = s !== null && cmp(v, f.val) > 0; break; case 'gte': r = s !== null && cmp(v, f.val) >= 0; break;
      case 'lt': r = s !== null && cmp(v, f.val) < 0; break; case 'lte': r = s !== null && cmp(v, f.val) <= 0; break;
      case 'like': case 'ilike': { const re = new RegExp('^' + f.val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/%/g, '.*') + '$', f.op === 'ilike' ? 'i' : ''); r = s !== null && re.test(s); break; }
      default: return false; }
    return f.neg ? !r : r; }
  function cmp(a, b){ const na = +a, nb = +b; if (typeof a === 'number' && !isNaN(nb)) return na - nb; const x = String(a), y = String(b); return x < y ? -1 : x > y ? 1 : 0; }
  function pegar(row, s){ let v = row[s.col]; for (const [op, k] of s.path) { if (v && typeof v === 'object') v = Array.isArray(v) ? v[+k] : v[k]; else v = undefined; if (op === '->>' && v !== undefined && v !== null && typeof v === 'object') v = JSON.stringify(v); } return v; }
  /* executa sobre linhas guardadas; devolve null quando falta alguma coluna pedida (aí não responde por aqui) */
  function executar(C, linhas){
    if (C.filtros.some(f => f.op === '??')) return null;
    let L = linhas.filter(r => C.filtros.every(f => casa(r[f.col], f)));
    if (C.ordem.length) L = L.slice().sort((a, b) => { for (const o of C.ordem) { const x = a[o.col], y = b[o.col]; if (x === y) continue; if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1; const c = cmp(x, y); if (c) return o.desc ? -c : c; } return 0; });
    const tot = L.length; L = L.slice(C.offset, C.limit === null ? undefined : C.offset + C.limit);
    const out = []; for (const r of L) { const o = {};
      for (const s of C.sel) { if (s.todos) { Object.assign(o, r); continue; } if (!(s.col in r)) return null; o[s.nome] = s.json ? pegar(r, s) : r[s.col]; if (o[s.nome] === undefined) o[s.nome] = null; }
      out.push(o); }
    return { linhas:out, total:tot }; }
  /* a que "balde" (grupo guardado junto) a consulta se refere */
  function baldesDe(C, conhecidos){ const T = C.tabela;
    if (T === 'pacotes') { const pa = inDe(C, 'painel'); return pa ? pa.map(x => 'pacotes|' + x) : (conhecidos || []).filter(k => k.startsWith('pacotes|')); }
    if (T !== 'registros') return [T];
    const pain = inDe(C, 'painel'); let cols = inDe(C, 'colecao');
    if (!cols) { const cam = inDe(C, 'caminho'); if (cam) cols = [...new Set(cam.map(c => String(c).split('/')[0]))]; }
    const B = (conhecidos || []).filter(k => { const p = k.split('|'); return p[0] === 'registros' && (!pain || pain.includes(p[1])) && (!cols || cols.includes(p[2])); });
    if (pain && cols) pain.forEach(p => cols.forEach(c => { const k = 'registros|' + p + '|' + c; if (!B.includes(k)) B.push(k); }));
    return B; }
  /* linha devolvida pelo servidor → linha guardada (completa os campos da chave pelo filtro da consulta) */
  function chaveLinha(C, r){ const T = C.tabela, pk = PK[T]; if (!pk) return null; const o = Object.assign({}, r);
    for (const s of C.sel) if (s.json || (s.alias && s.alias !== s.col)) return null;   // colunas apelidadas / caminhos JSON: não dá para guardar como linha
    if (T === 'registros') { if (o.painel === undefined) o.painel = eqDe(C, 'painel');
      if (o.caminho === undefined) { const cam = eqDe(C, 'caminho'); if (cam !== undefined) o.caminho = cam; else if (o.doc_id !== undefined) { const col = o.colecao !== undefined ? o.colecao : eqDe(C, 'colecao'); if (col !== undefined) o.caminho = col + '/' + o.doc_id; } }
      if (o.caminho !== undefined) { const p = String(o.caminho).split('/'); if (o.colecao === undefined) o.colecao = p[0]; if (o.doc_id === undefined) o.doc_id = p.slice(1).join('/'); } }
    else pk.forEach(k => { if (o[k] === undefined) { const v = eqDe(C, k); if (v !== undefined) o[k] = v; } });
    if (pk.some(k => o[k] === undefined || o[k] === null)) return null;
    (FORA[T] || []).forEach(k => delete o[k]);
    const balde = T === 'registros' ? 'registros|' + o.painel + '|' + o.colecao : T === 'pacotes' ? 'pacotes|' + o.painel : T;
    return { balde, id:pk.map(k => String(o[k])).join('|'), linha:o }; }
  /* consulta "inteira" de um balde (sem outros filtros): permite trocar o balde todo (some o que foi apagado no servidor) */
  function consultaInteira(C){ const ok = C.tabela === 'registros' ? ['painel', 'colecao'] : []; return C.filtros.every(f => ok.includes(f.col) && f.op === 'eq' && !f.neg); }
  return { BLOQ_PAINEL, BLOQ_COL, SEM_CACHE, PK, limpar, limparQuadro, limparPacote, bloqueado, lerConsulta, lerSelect, executar, baldesDe, chaveLinha, consultaInteira, eqDe, inDe, TXT };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = NUCLEO;
if (typeof window === 'undefined') return;

/* ---------------- navegador ---------------- */
const CFG = window.CRV_CONFIG || {}; const BASE = String(CFG.SUPABASE_URL || '').replace(/\/$/, '');
const fetchRede = window.fetch.bind(window);
const N = NUCLEO;
const RPC_LEITURA = new Set(['nomes_usuarios', 'ultimos_logins']);
try { if (localStorage.getItem('dbgoff')) window.CRV_OFF_DEBUG = true; } catch(_){}

/* ---------- cofre: IndexedDB + AES-GCM (chave não exportável, gerada no próprio aparelho) ---------- */
let _db = null, _chave = null;
function abrir(){ if (_db) return Promise.resolve(_db); return new Promise((ok, er) => { const r = indexedDB.open('crv-offline', 1);
  r.onupgradeneeded = () => { const d = r.result; ['meta', 'chave', 'url', 'bal', 'fila'].forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); }); };
  r.onsuccess = () => { _db = r.result; _db.onversionchange = () => { try { _db.close(); } catch(_){} _db = null; }; ok(_db); }; r.onerror = () => er(r.error); r.onblocked = () => er(new Error('bloqueado')); }); }
function tx(store, modo, fn){ return abrir().then(d => new Promise((ok, er) => { const t = d.transaction(store, modo), s = t.objectStore(store); let res; const r = fn(s); if (r) r.onsuccess = () => { res = r.result; }; t.oncomplete = () => ok(res); t.onerror = () => er(t.error); t.onabort = () => er(t.error); })); }
const iget = (st, k) => tx(st, 'readonly', s => s.get(k));
const iput = (st, k, v) => tx(st, 'readwrite', s => s.put(v, k)); const iput0 = iput;
const idel = (st, k) => tx(st, 'readwrite', s => s.delete(k));
const ichaves = st => tx(st, 'readonly', s => s.getAllKeys());
const iclear = st => tx(st, 'readwrite', s => s.clear());
function chave(){ if (!_chave) _chave = (async () => { let k = await iget('chave', 'k').catch(() => null);   // uma promessa só: duas chamadas ao mesmo tempo não geram duas chaves
  if (!k) { k = await crypto.subtle.generateKey({ name:'AES-GCM', length:256 }, false, ['encrypt', 'decrypt']); await iput('chave', 'k', k); }
  return k; })(); return _chave; }
const temGz = typeof CompressionStream !== 'undefined';
async function gz(u8, de){ const s = new Blob([u8]).stream().pipeThrough(de ? new DecompressionStream('gzip') : new CompressionStream('gzip')); return new Uint8Array(await new Response(s).arrayBuffer()); }
async function cifrar(obj){ let b = new TextEncoder().encode(JSON.stringify(obj)); if (temGz) b = await gz(b); const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, await chave(), b); return { iv, ct, z:temGz ? 1 : 0, em:Date.now() }; }
async function decifrar(e){ if (!e || !e.ct) return null; let b = new Uint8Array(await crypto.subtle.decrypt({ name:'AES-GCM', iv:e.iv }, await chave(), e.ct)); if (e.z) b = await gz(b, true); return JSON.parse(new TextDecoder().decode(b)); }
async function cifrarBin(u8){ const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, await chave(), u8); return { iv, ct, bin:1, em:Date.now() }; }
async function decifrarBin(e){ return new Uint8Array(await crypto.subtle.decrypt({ name:'AES-GCM', iv:e.iv }, await chave(), e.ct)); }

/* ---------- estado ---------- */
let META = { uid:'', ultimoContato:0, ultimaSync:0, dias:7, habil:false, sinc:{} };
let online = navigator.onLine !== false, habil = false, pronto = false;
const lerMeta = async () => { try { const m = await iget('meta', 'm'); if (m) META = Object.assign(META, m); } catch(_){} return META; };
let _tm = null; const salvarMeta = () => { clearTimeout(_tm); _tm = setTimeout(() => iput('meta', 'm', META).catch(() => {}), 300); };
const salvarMetaJa = () => iput('meta', 'm', META).catch(() => {});

/* ---------- baldes de linhas (decifrados ficam na memória durante o uso) ---------- */
const MEM = new Map();          // balde → { rows:{id:linha}, completo }
let BALDES = null;              // lista dos baldes guardados
async function baldes(){ if (!BALDES) { try { BALDES = (await ichaves('bal')) || []; } catch(_){ BALDES = []; } } return BALDES; }
async function lerBalde(k){ if (MEM.has(k)) return MEM.get(k); let b = null; try { b = await decifrar(await iget('bal', k)); } catch(_){ b = null; } if (b) MEM.set(k, b); return b; }
const sujos = new Set(); let _tb = null;
function marcarSujo(k){ sujos.add(k); clearTimeout(_tb); _tb = setTimeout(gravarSujos, 1500); }
async function gravarSujos(){ const L = [...sujos]; sujos.clear(); for (const k of L) { const b = MEM.get(k); if (!b || !habil) continue; try { await iput('bal', k, await cifrar(b)); const B = await baldes(); if (!B.includes(k)) B.push(k); } catch(e){ console.warn('offline: gravar', k, e); } } }
const geracao = new Map();      // balde → ids vistos na leitura em páginas (para tirar o que foi apagado no servidor)
let _serie = Promise.resolve();   // gravações nos baldes uma de cada vez (duas leituras ao mesmo tempo não se atropelam)
const guardarLinhas = (C, linhas) => (_serie = _serie.then(() => guardarLinhas0(C, linhas), () => guardarLinhas0(C, linhas)));
async function guardarLinhas0(C, linhas){
  const porB = new Map();
  for (const r of linhas) { const c = N.chaveLinha(C, r); if (!c) return; if (!porB.has(c.balde)) porB.set(c.balde, []); porB.get(c.balde).push(c); }
  const inteira = N.consultaInteira(C), fim = C.limit === null || linhas.length < C.limit;
  if (inteira && C.tabela === 'registros' && !porB.size) { const p = N.eqDe(C, 'painel'), c = N.eqDe(C, 'colecao'); if (p && c && C.offset === 0 && fim) porB.set('registros|' + p + '|' + c, []); }
  for (const [k, L] of porB) {
    let b = await lerBalde(k); if (!b) b = { rows:{}, completo:false };
    L.forEach(c => { b.rows[c.id] = Object.assign(b.rows[c.id] || {}, c.linha); });
    if (inteira) { if (C.offset === 0) geracao.set(k, new Set()); const g = geracao.get(k); if (g) { L.forEach(c => g.add(c.id));
        if (fim) { Object.keys(b.rows).forEach(id => { if (!g.has(id)) delete b.rows[id]; }); b.completo = true; geracao.delete(k); } } }
    MEM.set(k, b); marcarSujo(k); } }
async function responderLocal(C){
  const B = N.baldesDe(C, await baldes()).filter(k => { const p = k.split('|'); return !(p[0] === 'registros' && N.bloqueado(p[1], p[2])); }); if (!B.length) return null;
  const L = []; let algum = false, todosCompletos = true;
  for (const k of B) { const b = await lerBalde(k); if (!b) { todosCompletos = false; continue; } algum = true; if (!b.completo) todosCompletos = false; for (const id in b.rows) L.push(b.rows[id]); }
  if (!algum) return null;
  const r = N.executar(C, L); if (!r) return null;
  if (!r.linhas.length && !todosCompletos) return null;   // não sei se existe: deixa para a cópia da URL
  return r; }

/* ---------- respostas ---------- */
const jsonResp = (obj, st, extra) => new Response(JSON.stringify(obj), { status:st || 200, headers:Object.assign({ 'content-type':'application/json; charset=utf-8', 'x-crv-offline':'1' }, extra || {}) });
const semRede = () => jsonResp({ message:NET, code:'OFFLINE', details:'', hint:'' }, 400);   // 400 (e não 503): o cliente do Supabase repete pedidos com 503
const soConexao = () => jsonResp({ message:TXT, code:'OFFLINE', details:'', hint:'' }, 400);
const chaveUrl = (url, h) => url + '|' + (h.accept || '') + '|' + (h.prefer || '') + '|' + (h.method || 'GET');
function cab(init, input){ const o = {}; try { new Headers((init && init.headers) || (input && input.headers) || {}).forEach((v, k) => o[k] = v); } catch(_){} o.method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase(); return o; }

async function servirCache(url, h, body){
  const u = new URL(url), p = u.pathname;
  if (p.startsWith('/storage/v1/object/')) { const m = /^\/storage\/v1\/object\/(?:authenticated\/|public\/)?arquivos\/([^/]+)\/(.+)$/.exec(p); if (!m) return soConexao();
    if (N.bloqueado(m[1])) return soConexao(); const e = await iget('url', 'sto|' + m[1] + '/' + m[2]).catch(() => null); if (!e) return soConexao();
    try { return new Response(new Blob([await decifrarBin(e)]), { status:200, headers:{ 'content-type':'application/octet-stream', 'x-crv-offline':'1' } }); } catch(_){ return soConexao(); } }
  if (p.startsWith('/rest/v1/rpc/')) { const e = await iget('url', 'rpc|' + p + '|' + (body || '')).catch(() => null); if (!e) return soConexao(); try { return jsonResp(await decifrar(e)); } catch(_){ return soConexao(); } }
  if (!p.startsWith('/rest/v1/')) return soConexao();
  const C = N.lerConsulta(url);
  if (N.SEM_CACHE.has(C.tabela)) return soConexao();
  const pain = N.inDe(C, 'painel'), col = N.inDe(C, 'colecao') || (N.inDe(C, 'caminho') || []).map(c => String(c).split('/')[0]);
  if ((pain && pain.every(x => N.BLOQ_PAINEL.has(x))) || (col && col.length && col.every(x => N.BLOQ_COL.test(x)))) return soConexao();
  const obj = /vnd\.pgrst\.object/.test(h.accept || ''), cnt = /count=/.test(h.prefer || '');
  // 1º a mesma consulta já feita com internet (resposta guardada); 2º a consulta local sobre as linhas guardadas
  { const e = await iget('url', 'rest|' + chaveUrl(url, h)).catch(() => null); if (e) { try { const v = await decifrar(e); if (h.method === 'HEAD') return new Response(null, { status:200, headers:{ 'content-range':v.cr || '*/0', 'x-crv-offline':'1' } }); return jsonResp(v.body, 200, v.cr ? { 'content-range':v.cr } : null); } catch(_){} } }
  let r = null; try { r = await responderLocal(C); } catch(e){ console.warn('offline: consulta local', e); }
  if (!r) return soConexao();
  const cr = r.linhas.length ? C.offset + '-' + (C.offset + r.linhas.length - 1) + '/' + (cnt ? r.total : '*') : '*/' + (cnt ? r.total : '*');
  if (h.method === 'HEAD') return new Response(null, { status:200, headers:{ 'content-range':cr, 'x-crv-offline':'1' } });
  if (obj) return r.linhas.length === 1 ? jsonResp(r.linhas[0], 200, { 'content-range':cr }) : jsonResp({ message:'JSON object requested, multiple (or no) rows returned', code:'PGRST116', details:'', hint:'' }, 406);
  return jsonResp(r.linhas, 200, { 'content-range':cr }); }

/* guarda a resposta da rede (limpa) */
let _ger = 0;   // muda a cada "apagar tudo": gravação que estava a caminho não volta a guardar depois de sair/bloquear
async function guardar(url, h, resp, body){
  if (!habil) return; const g0 = _ger; const iput = (st, k, v) => (g0 === _ger && habil) ? iput0(st, k, v) : Promise.resolve();
  const u = new URL(url), p = u.pathname;
  try {
    if (p.startsWith('/storage/v1/object/')) { const m = /^\/storage\/v1\/object\/(?:authenticated\/|public\/)?arquivos\/([^/]+)\/(_dados\.json(?:\.gz)?)$/.exec(p); if (!m || N.bloqueado(m[1])) return;
      let b = new Uint8Array(await resp.arrayBuffer()); const z = m[2].endsWith('.gz'); let o = JSON.parse(new TextDecoder().decode(z ? await gz(b, true) : b));
      o = N.limparPacote(m[1], o); b = new TextEncoder().encode(JSON.stringify(o)); if (z) b = await gz(b);
      await iput('url', 'sto|' + m[1] + '/' + m[2], await cifrarBin(b)); marcarSync(); return; }
    if (p.startsWith('/rest/v1/rpc/')) { const nm = p.split('/').pop(); if (!RPC_LEITURA.has(nm)) return; const v = N.limpar(await resp.json()); await iput('url', 'rpc|' + p + '|' + (body || ''), await cifrar(v)); return; }
    if (!p.startsWith('/rest/v1/')) return;
    const C = N.lerConsulta(url); if (N.SEM_CACHE.has(C.tabela)) return;
    const pain = N.inDe(C, 'painel'), col = N.inDe(C, 'colecao') || (N.inDe(C, 'caminho') || []).map(c => String(c).split('/')[0]);
    if ((pain && pain.every(x => N.BLOQ_PAINEL.has(x))) || (col && col.length && col.every(x => N.BLOQ_COL.test(x)))) return;   // linhas de coleções sensíveis saem uma a uma em limparLinhas
    const cr = resp.headers.get('content-range') || '';
    if (h.method === 'HEAD') { await iput('url', 'rest|' + chaveUrl(url, h), await cifrar({ cr })); return; }
    let v = await resp.json(); const obj = !Array.isArray(v); let L = obj ? [v] : v;
    L = await limparLinhas(C.tabela, L, C);
    await iput('url', 'rest|' + chaveUrl(url, h), await cifrar({ body:obj ? (L[0] || null) : L, cr }));
    if (g0 !== _ger) return; await guardarLinhas(C, L); marcarSync();
  } catch(e){ console.warn('offline: guardar', e); } }
/* bloco de painel compactado (gz) da linha do gestor: descompacta, limpa e compacta de novo; painel sensível sai */
async function limparBlob(k, v){
  if (N.BLOQ_PAINEL.has(k)) return undefined;
  if (v && v.gz) { if (typeof DecompressionStream === 'undefined') return undefined;
    try { const bin = Uint8Array.from(atob(v.gz), c => c.charCodeAt(0)); let o = JSON.parse(new TextDecoder().decode(await gz(bin, true)));
      if (o && o.conteudo) o.conteudo = N.limparPacote(k === '__quadro' ? 'quadro' : k, o.conteudo); o = N.limpar(o);
      const nb = await gz(new TextEncoder().encode(JSON.stringify(o))); let s = ''; for (let i = 0; i < nb.length; i += 0x8000) s += String.fromCharCode.apply(null, nb.subarray(i, i + 0x8000));
      return { referencia:v.referencia, gz:btoa(s) }; } catch(_){ return undefined; } }
  return N.limpar(v && v.conteudo ? Object.assign({}, v, { conteudo:N.limparPacote(k, v.conteudo) }) : v); }
async function limparLinhas(T, L, C){
  const pq = N.eqDe(C, 'painel');
  L = L.filter(r => !(r && typeof r === 'object' && N.bloqueado(r.painel || pq, r.colecao || N.eqDe(C, 'colecao'))));
  if (T === 'area_dados') for (const r of L) { if (!r || typeof r !== 'object') continue;
    const pa = r.dados && r.dados.paineis; if (pa) for (const k of Object.keys(pa)) { const v = await limparBlob(k, pa[k]); if (v === undefined) delete pa[k]; else pa[k] = v; }
    for (const s of C.sel) { if (!s.json || !(s.nome in r)) continue; const ult = s.path.length ? s.path[s.path.length - 1][1] : '', pen = s.path.length > 1 ? s.path[s.path.length - 2][1] : '';
      const v = r[s.nome]; if (pen === 'paineis' && v && typeof v === 'object') { const nv = await limparBlob(ult, v); r[s.nome] = nv === undefined ? null : nv; }
      else if (ult === 'paineis' && v && typeof v === 'object') { for (const k of Object.keys(v)) { const nv = await limparBlob(k, v[k]); if (nv === undefined) delete v[k]; else v[k] = nv; } } } }
  return L.map(r => { const pn = r && (r.painel || pq); if (r && r.conteudo && pn) r.conteudo = N.limparPacote(pn, r.conteudo); return N.limpar(r); }); }
let _ts = 0; function marcarSync(){ const t = Date.now(); if (t - _ts < 20000) return; _ts = t; META.ultimaSync = t; salvarMeta(); }
let _tc = 0; function contato(){ const t = Date.now(); if (!META.uid || t - _tc < 60000) return; _tc = t; META.ultimoContato = t; salvarMeta(); }

/* ---------- fetch do cliente Supabase ---------- */
async function ofetch(input, init){
  const url = typeof input === 'string' ? input : (input && input.url) || String(input);
  if (!BASE || !url.startsWith(BASE)) return fetchRede(input, init);
  const h = cab(init, typeof input === 'string' ? null : input), p = new URL(url).pathname;
  const auth = p.startsWith('/auth/'), rest = p.startsWith('/rest/v1/'), sto = p.startsWith('/storage/v1/');
  const rpc = p.startsWith('/rest/v1/rpc/'), body = init && typeof init.body === 'string' ? init.body : '';
  const leitura = h.method === 'GET' || h.method === 'HEAD' || (rpc && RPC_LEITURA.has(p.split('/').pop()));
  const podeCache = pronto && (rest || sto);
  if (!online || navigator.onLine === false) {
    if (navigator.onLine === false) marcarOffline();
    if (auth || !podeCache) throw new TypeError('Failed to fetch');
    if (!leitura) return semRede(); const t0 = Date.now(); const rr = await servirCache(url, h, body); if (window.CRV_OFF_DEBUG) console.log('[off]', Math.round(performance.now()), rr.status, Date.now() - t0 + 'ms', url.replace(BASE, '').slice(0, 160)); return rr; }
  try {
    const r = await fetchRede(input, init); contato();
    if (leitura && r.ok && habil && podeCache) { const c = r.clone(); guardar(url, h, c, body); }
    return r;
  } catch(e){
    if (e && e.name === 'AbortError') throw e;
    marcarOffline();
    if (auth || !podeCache) throw e;
    return leitura ? servirCache(url, h, body) : semRede(); } }

/* ---------- conexão: cai / volta ---------- */
const ouvRecon = []; let _ping = null;
function marcarOffline(){ if (!online) return; online = false; document.documentElement.classList.add('crv-sem-rede'); faixa(); guardaBotoes(); iniciarPing(); avisar('offline'); }
function iniciarPing(){ if (_ping) return; _ping = setInterval(testar, 15000); }
async function testar(){ if (online) return; if (navigator.onLine === false) return;
  try { const r = await fetchRede(BASE + '/auth/v1/health', { headers:{ apikey:CFG.SUPABASE_KEY }, cache:'no-store' }); if (r.status < 500) voltou(); } catch(_){} }
async function voltou(){ if (online) return; online = true; clearInterval(_ping); _ping = null; document.documentElement.classList.remove('crv-sem-rede'); faixa(); guardaBotoes(); avisar('online');
  for (const f of ouvRecon) { try { await f(); } catch(e){ console.warn('reconexão', e); } }
  processarFila().catch(() => {}); }
window.addEventListener('offline', () => marcarOffline());
window.addEventListener('online', () => { setTimeout(testar, 800); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !online) testar(); });
const ouvEst = []; function avisar(ev){ ouvEst.forEach(f => { try { f(ev); } catch(_){} }); }

/* ---------- faixa "Sem conexão" ---------- */
const dh = t => { if (!t) return ''; const d = new Date(t); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' às ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function estilo(){ if (document.getElementById('crv-off-css')) return; const s = document.createElement('style'); s.id = 'crv-off-css';
  s.textContent = `#crv-off-faixa{position:fixed;left:0;right:0;top:0;z-index:99990;background:#3b4252;color:#fff;font:600 12.5px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:6px 12px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;box-shadow:0 1px 4px rgba(0,0,0,.2)}
#crv-off-faixa .p{width:8px;height:8px;border-radius:50%;background:#f0a63a;flex:0 0 auto}#crv-off-faixa a{color:#ffd58a;text-decoration:underline;cursor:pointer}
html.crv-sem-rede body{padding-top:30px}
[data-precisa-net]{opacity:.45!important;cursor:not-allowed!important;filter:grayscale(.4)}
.crv-off-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;background:#1f2937;color:#fff;padding:10px 16px;border-radius:10px;font:600 13.5px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:92vw;text-align:center}`;
  document.head.appendChild(s); }
let _nfila = 0;
function faixa(){ estilo(); let f = document.getElementById('crv-off-faixa');
  if (online) { if (f) f.remove(); return; }
  if (!f) { f = document.createElement('div'); f.id = 'crv-off-faixa'; f.setAttribute('role', 'status'); document.body.appendChild(f); }
  const t = META.ultimaSync || META.ultimoContato;
  f.innerHTML = `<span class="p"></span><span>Sem conexão${t ? ' – dados de ' + dh(t) : ''}</span>${_nfila ? `<a id="crv-off-fl">Aguardando envio (${_nfila})</a>` : ''}`;
  const a = document.getElementById('crv-off-fl'); if (a) a.onclick = () => { location.hash = '#/aguardando'; }; }
/* aviso flutuante quando há algo em "Aguardando envio" */
function pilula(){ estilo(); let b = document.getElementById('crv-off-pil');
  if (!_nfila || location.hash === '#/aguardando' || !document.body) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('button'); b.id = 'crv-off-pil'; b.type = 'button'; b.setAttribute('data-offline-ok', ''); b.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99980;border:0;border-radius:99px;padding:9px 14px;background:#8a5a00;color:#fff;font:700 13px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer'; b.onclick = () => { location.hash = '#/aguardando'; }; document.body.appendChild(b); }
  b.textContent = '⏳ Aguardando envio (' + _nfila + ')'; }
window.addEventListener('hashchange', () => pilula());
function toast(msg){ if (window.CRV_TOAST) { try { return window.CRV_TOAST(msg); } catch(_){} } estilo(); const t = document.createElement('div'); t.className = 'crv-off-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3500); }

/* ---------- botões de lançamento: sem internet ficam apagados com "Precisa de internet para enviar" ---------- */
const R_GRAVA = /(salvar|enviar|lançar|lancar|registrar|aprovar|aceitar|devolver|recusar|excluir|apagar|remover|importar|carregar|atualizar agora|atualizar planilha|enviar planilha|gerar documento|gerar o documento|gerar termo|gerar ficha|gerar comunicado|emitir|assinar|confirmar|adicionar|incluir|cadastrar|editar|alterar|responder|publicar|marcar como|desfazer|restaurar|voltar para esta|liberar|bloquear|trocar foto|tirar foto|tirar a foto|nova senha|redefinir|criar|novo |nova |\+ )/i;
const R_CONSULTA = /(pdf|excel|xlsx|imprimir|exportar|baixar|^ver\b|ver quem|ver como|abrir|filtrar|buscar|fechar|^cancelar$|voltar|limpar filtro)/i;
const SEL = 'button, [role="button"], input[type="submit"], input[type="button"], a.btn, label.btn';
const precisaNet = el => { if (!el || el.closest('[data-offline-ok]') || el.hasAttribute('data-offline-ok')) return false; const t = ((el.innerText || el.value || '') + ' ' + (el.title || '') + ' ' + (el.getAttribute('aria-label') || '')).replace(/\s+/g, ' ').trim();
  if (!t || R_CONSULTA.test(t)) return false; return R_GRAVA.test(t) || el.matches('input[type="file"]'); };
const docsGuardados = new Set(); let _ultInput = 0;
function marcar(doc){ try { doc.querySelectorAll(SEL + ', input[type="file"]').forEach(el => { const p = !online && precisaNet(el); if (p && !el.hasAttribute('data-precisa-net')) { el.setAttribute('data-precisa-net', ''); el.dataset.tituloAntes = el.title || ''; el.title = NET; } else if (!p && el.hasAttribute('data-precisa-net')) { el.removeAttribute('data-precisa-net'); el.title = el.dataset.tituloAntes || ''; } }); } catch(_){} }
function guardar_(doc){ if (!doc || docsGuardados.has(doc)) return; docsGuardados.add(doc); estilo2(doc);
  const bloq = e => { if (online) return; const el = e.target && e.target.closest && e.target.closest(SEL + ', input[type="file"]'); if (!el || !precisaNet(el)) return; e.preventDefault(); e.stopImmediatePropagation(); toast(NET); };
  doc.addEventListener('click', bloq, true); doc.addEventListener('input', () => { _ultInput = Date.now(); }, true); doc.addEventListener('submit', e => { if (!online) { e.preventDefault(); e.stopImmediatePropagation(); toast(NET); } }, true);
  let t = null; try { new MutationObserver(() => { if (online && !doc.querySelector('[data-precisa-net]')) return; clearTimeout(t); t = setTimeout(() => marcar(doc), 120); }).observe(doc.documentElement, { childList:true, subtree:true }); } catch(_){}
  marcar(doc); }
function estilo2(doc){ if (doc === document || doc.getElementById('crv-off-css2')) return; const s = doc.createElement('style'); s.id = 'crv-off-css2'; s.textContent = '[data-precisa-net]{opacity:.45!important;cursor:not-allowed!important;filter:grayscale(.4)}'; (doc.head || doc.documentElement).appendChild(s); }
function guardaBotoes(){ docsGuardados.forEach(d => { try { if (d.defaultView) marcar(d); else docsGuardados.delete(d); } catch(_){ docsGuardados.delete(d); } }); }

/* ---------- fila "Aguardando envio" ---------- */
const TRAT = {};   // tipo → { conferir(item) → texto do conflito | null, enviar(item) }
let _fp = false;
async function filaListar(){ const out = []; try { const K = await ichaves('fila'); for (const k of K) { const v = await decifrar(await iget('fila', k)).catch(() => null); if (v) out.push(v); } } catch(_){} return out.sort((a, b) => String(a.criado).localeCompare(String(b.criado))); }
async function filaSalvar(it){ await iput('fila', it.id, await cifrar(it)); await contarFila(); }
async function filaAdicionar(it){ const L = await filaListar(); const ant = it.chave ? L.find(x => x.chave === it.chave) : null;
  it.id = ant ? ant.id : 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); it.criado = it.criado || new Date().toISOString(); it.status = 'aguardando'; it.msg = '';
  await filaSalvar(it); window.CRV_OFF.ultimaFila = { chave:it.chave, em:Date.now() }; if (online) setTimeout(() => processarFila().catch(() => {}), 500); return it; }
async function filaRemover(id){ await idel('fila', id); await contarFila(); }
async function contarFila(){ try { _nfila = ((await ichaves('fila')) || []).length; } catch(_){ _nfila = 0; } faixa(); pilula(); try { window.dispatchEvent(new CustomEvent('crv-fila', { detail:_nfila })); } catch(_){} return _nfila; }
async function processarFila(forcarId){
  if (_fp || !online) return; _fp = true;
  try { for (const it of await filaListar()) {
      if (!online) break; const T = TRAT[it.tipo]; if (!T) continue;
      if (it.status === 'conferir' && it.id !== forcarId) continue;
      try { if (it.id !== forcarId) { const c = await T.conferir(it); if (c) { it.status = 'conferir'; it.msg = c; await filaSalvar(it); toast('Confira antes de enviar: ' + it.titulo + '. ' + c); continue; } }
        await T.enviar(it); await filaRemover(it.id); toast('Enviado: ' + it.titulo); try { window.dispatchEvent(new CustomEvent('crv-fila-enviado', { detail:it })); } catch(_){} }
      catch(e){ if (!online || (e && /fetch|network|internet|OFFLINE/i.test(String(e.message || e.code)))) break; it.status = 'erro'; it.msg = (e && e.message) || 'Não foi possível enviar.'; await filaSalvar(it); } }
  } finally { _fp = false; } }

/* ---------- ciclo de vida ---------- */
async function limparTudo(){ _ger++; MEM.clear(); BALDES = []; sujos.clear(); geracao.clear(); clearTimeout(_tb);
  for (const s of ['url', 'bal', 'fila', 'meta']) { try { await iclear(s); } catch(_){} }
  META = { uid:'', ultimoContato:0, ultimaSync:0, dias:META.dias || 7, habil:false, sinc:{} }; habil = false; _nfila = 0;
  try { Object.keys(localStorage).filter(k => /^crv-central-/.test(k)).forEach(k => localStorage.removeItem(k)); } catch(_){} faixa(); }
/* início: antes de entrar no app. Devolve 'ok' | 'expirado' | 'sem-copia' */
async function iniciar(uid){
  estilo(); guardar_(document); await lerMeta();
  if (META.uid && uid && META.uid !== uid) await limparTudo();
  pronto = true; habil = !!META.habil && (!uid || META.uid === uid);
  const prazo = (META.dias || 7) * 864e5;
  if (!online || navigator.onLine === false) { if (navigator.onLine === false) online = false;
    if (!habil || !META.ultimoContato) return 'sem-copia';
    if (Date.now() - META.ultimoContato > prazo) { await limparTudo(); return 'expirado'; } }
  document.documentElement.classList.toggle('crv-sem-rede', !online); faixa(); contarFila(); if (!online) iniciarPing();
  return 'ok'; }
/* depois de ler o perfil (com internet): liga ou desliga o modo offline deste usuário */
async function configurar(perfil, cfg){ const tipo = tipoPerfil(perfil); const c = cfg || {}; const P = c.perfis || {};
  const lig = P[tipo] !== false && c.ativo !== false;
  if (META.uid && META.uid !== perfil.user_id) await limparTudo();
  META.uid = perfil.user_id; META.dias = Math.max(1, Math.min(60, +c.dias || 7)); META.ultimoContato = Date.now(); META.tipo = tipo;
  if (!lig) { const uid = META.uid, dias = META.dias; await limparTudo(); META.uid = uid; META.dias = dias; META.habil = false; habil = false; await salvarMetaJa(); return false; }
  META.habil = true; habil = true; await salvarMetaJa(); return true; }
function tipoPerfil(p){ if (!p) return 'rh'; if (p.papel === 'gestor') return (Array.isArray(p.frentes) && p.frentes.some(x => /^assist:/.test(x))) ? 'assistente' : 'gestor'; if (p.papel === 'leitor') return 'leitor'; return 'rh'; }
setInterval(() => { if (!online && pronto && META.ultimoContato && Date.now() - META.ultimoContato > (META.dias || 7) * 864e5) { limparTudo().then(() => { try { window.CRV_OFF_EXPIROU && window.CRV_OFF_EXPIROU(); } catch(_){} }); } }, 60000);

window.CRV_OFF = {
  fetch:ofetch, iniciar, configurar, limpar:limparTudo, tipoPerfil,
  online:() => online, offline:() => !online, ativo:() => habil, meta:() => Object.assign({}, META),
  bloqueado:(painel, col) => N.bloqueado(painel, col), TXT, NET,
  guardar:guardar_, ultimoInput:() => _ultInput, aoReconectar:f => ouvRecon.push(f), aoMudar:f => ouvEst.push(f), testar, voltou, marcarOffline,
  fila:{ listar:filaListar, adicionar:filaAdicionar, remover:filaRemover, salvar:filaSalvar, processar:processarFila, contar:contarFila, tratar:(tipo, t) => { TRAT[tipo] = t; } },
  gravarJa:gravarSujos, nucleo:N, _balde:k => lerBalde(k), _baldes:() => baldes(), _url:k => iget('url', k).then(decifrar),
  sincronizado:painel => META.sinc[painel] || '', marcarSinc:(painel, v) => { META.sinc[painel] = v; salvarMeta(); }, fimSync:() => { META.ultimaSync = Date.now(); salvarMeta(); faixa(); },
  toast };
})();
