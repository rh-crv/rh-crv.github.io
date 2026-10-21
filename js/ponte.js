/* =====================================================================
   Ponte dos painéis completos
   Os painéis feitos no Claude usam "window.claude.use(...)" para salvar
   anotações (db), saber quem está usando (user), guardar arquivos
   (assets) e baixar arquivos (downloads). Aqui essas funções passam a
   usar o Supabase do app, com as mesmas permissões de cada painel.
   ===================================================================== */
(() => {
'use strict';

const ouvintes = new Set();   // assinaturas ativas (onSnapshot)
let relogio = null;

function novoId(n = 20){
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = '';
  const r = crypto.getRandomValues(new Uint8Array(n));
  for (const x of r) s += a[x % a.length];
  return s;
}
const clonar = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const erro = (code, message) => Object.assign(new Error(message), { code, message });
const traduz = e => {
  const m = (e && e.message || '').toLowerCase();
  if (m.includes('row-level security') || m.includes('permission')) return erro('invalid_argument', 'Sem permissão para salvar neste painel.');
  if (m.includes('fetch') || m.includes('network')) return erro('unavailable', 'Sem conexão.');
  return erro('invalid_argument', e && e.message || 'Erro ao salvar.');
};

function mesclar(a, b){
  const out = Array.isArray(a) ? a.slice() : Object.assign({}, a);
  for (const k of Object.keys(b)) {
    const v = b[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = mesclar(out[k], v);
    else out[k] = v;
  }
  return out;
}

function snapDoc(ref, linha){
  const dados = linha ? linha.dados : undefined;
  return { id: ref.id, ref, exists: !!linha, data: () => clonar(dados), get: k => dados ? clonar(dados[k]) : undefined,
           metadata: { fromCache:false, hasPendingWrites:false } };
}

function compara(v, op, x){
  switch (op) {
    case '==': return JSON.stringify(v) === JSON.stringify(x);
    case '!=': return v !== undefined && JSON.stringify(v) !== JSON.stringify(x);
    case '<': return v < x; case '<=': return v <= x;
    case '>': return v > x; case '>=': return v >= x;
    case 'in': return Array.isArray(x) && x.some(y => JSON.stringify(y) === JSON.stringify(v));
    case 'not-in': return Array.isArray(x) && v !== undefined && !x.some(y => JSON.stringify(y) === JSON.stringify(v));
    case 'array-contains': return Array.isArray(v) && v.some(y => JSON.stringify(y) === JSON.stringify(x));
    default: return false;
  }
}

function criarDb(ctx){
  const { sb, painel, quem, podeEditar } = ctx;

  async function lerDoc(caminho){
    const { data, error } = await sb.from('registros').select('doc_id,dados').eq('painel', painel).eq('caminho', caminho).maybeSingle();
    if (error) throw traduz(error);
    return data;
  }
  async function lerColecao(colecao){
    const todas = [];
    for (let i = 0; ; i += 1000) {
      const { data, error } = await sb.from('registros').select('doc_id,dados').eq('painel', painel).eq('colecao', colecao).order('doc_id').range(i, i + 999);
      if (error) throw traduz(error);
      todas.push(...data);
      if (data.length < 1000) break;
    }
    return todas;
  }
  async function gravar(caminho, dados){
    if (!podeEditar()) throw erro('invalid_argument', 'Sem permissão para salvar neste painel.');
    const partes = caminho.split('/');
    const doc_id = partes.pop(), colecao = partes.join('/');
    const { error } = await sb.from('registros').upsert({ painel, caminho, colecao, doc_id, dados, atualizado_em: new Date().toISOString(), atualizado_por: quem() });
    if (error) throw traduz(error);
    avisar();
  }
  async function apagar(caminho){
    if (!podeEditar()) throw erro('invalid_argument', 'Sem permissão para salvar neste painel.');
    const { error } = await sb.from('registros').delete().eq('painel', painel).eq('caminho', caminho);
    if (error) throw traduz(error);
    avisar();
  }
  function avisar(){ ouvintes.forEach(o => o.painel === painel && o.atualizar()); }

  function validar(caminho, par){
    const seg = String(caminho).split('/').filter(Boolean);
    if (!seg.length || seg.some(s => !/^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(s) || s === '.' || s === '..')) throw new TypeError('Caminho inválido: ' + caminho);
    if ((seg.length % 2 === 0) !== par) throw new TypeError(`Caminho com número de partes errado (${seg.length}): ${caminho}`);
    return seg.join('/');
  }

  function docRef(caminho){
    caminho = validar(caminho, true);
    const id = caminho.split('/').pop();
    const ref = {
      id, path: caminho,
      get: async () => snapDoc(ref, await lerDoc(caminho)),
      set: async d => gravar(caminho, clonar(d)),
      update: async d => {
        const atual = await lerDoc(caminho);
        if (!atual) throw erro('invalid_argument', 'Documento não existe.');
        return gravar(caminho, mesclar(atual.dados, clonar(d)));
      },
      delete: async () => apagar(caminho),
      acquire: async () => ({ acquired: true, version: 1, expiresAt: new Date(Date.now() + 30000).toISOString() }),
      collection: p => colRef(caminho + '/' + p),
      onSnapshot(next, fail){
        let vivo = true;
        const o = { painel, atualizar: async () => { try { const s = await ref.get(); if (vivo) next(s); } catch (e) { if (vivo && fail) fail(e); } } };
        ouvintes.add(o); o.atualizar(); ligarRelogio();
        return () => { vivo = false; ouvintes.delete(o); };
      }
    };
    return ref;
  }

  function consulta(colecao, filtros = [], ordem = null, lim = null){
    const executar = async () => {
      let L = (await lerColecao(colecao)).map(l => ({ ref: docRef(colecao + '/' + l.doc_id), linha: l }));
      for (const [c, op, v] of filtros) L = L.filter(x => compara(x.linha.dados[c], op, v));
      if (ordem) {
        const [c, dir] = ordem, s = dir === 'desc' ? -1 : 1;
        L.sort((a, b) => { const x = a.linha.dados[c], y = b.linha.dados[c];
          if (x === undefined && y === undefined) return 0; if (x === undefined) return 1; if (y === undefined) return -1;
          return (x < y ? -1 : x > y ? 1 : 0) * s; });
      }
      if (lim) L = L.slice(0, lim);
      return L.map(x => snapDoc(x.ref, x.linha));
    };
    const montar = (docs, anteriores) => {
      const antes = new Map((anteriores || []).map((d, i) => [d.id, { d, i }]));
      const mud = [];
      docs.forEach((d, i) => { const a = antes.get(d.id);
        if (!a) mud.push({ type:'added', doc:d, oldIndex:-1, newIndex:i });
        else if (JSON.stringify(a.d.data()) !== JSON.stringify(d.data()) || a.i !== i) mud.push({ type:'modified', doc:d, oldIndex:a.i, newIndex:i });
        antes.delete(d.id); });
      antes.forEach(a => mud.push({ type:'removed', doc:a.d, oldIndex:a.i, newIndex:-1 }));
      return { docs, size: docs.length, empty: !docs.length, docChanges: () => mud, forEach: f => docs.forEach(f),
               metadata: { fromCache:false, hasPendingWrites:false } };
    };
    return {
      where: (c, op, v) => consulta(colecao, [...filtros, [c, op, v]], ordem, lim),
      orderBy: (c, dir = 'asc') => consulta(colecao, filtros, [c, dir], lim),
      limit: n => consulta(colecao, filtros, ordem, n),
      get: async () => montar(await executar(), []),
      onSnapshot(next, fail){
        let vivo = true, ultimo = [], assinatura = null;
        const o = { painel, atualizar: async () => {
          try { const docs = await executar(); const sig = JSON.stringify(docs.map(d => [d.id, d.data()]));
            if (vivo && sig !== assinatura) { assinatura = sig; const s = montar(docs, ultimo); ultimo = docs; next(s); } }
          catch (e) { if (vivo && fail) fail(e); } } };
        ouvintes.add(o); o.atualizar(); ligarRelogio();
        return () => { vivo = false; ouvintes.delete(o); };
      }
    };
  }

  function colRef(caminho){
    caminho = validar(caminho, false);
    const q = consulta(caminho);
    return Object.assign(q, {
      path: caminho,
      doc: id => docRef(caminho + '/' + (id || novoId())),
      add: async d => { const r = docRef(caminho + '/' + novoId()); await r.set(d); return r; }
    });
  }

  return Object.freeze({ doc: docRef, collection: colRef });
}

function ligarRelogio(){
  if (relogio) return;
  relogio = setInterval(() => { if (!document.hidden) ouvintes.forEach(o => o.atualizar()); }, 30000);
}

function criarArquivos(ctx){
  const { sb, painel, podeEditar } = ctx;
  const BUCKET = 'arquivos';
  return Object.freeze({
    async upload(blob, opts = {}){
      if (!podeEditar()) throw erro('not_granted', 'Sem permissão para enviar arquivos.');
      const id = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
      const { error } = await sb.storage.from(BUCKET).upload(`${painel}/${id}`, blob, { contentType: opts.type || blob.type || 'application/octet-stream' });
      if (error) throw erro('upload_failed', error.message);
      return { id, url: '/_blob/' + id, sizeBytes: blob.size, contentType: opts.type || blob.type };
    },
    async list(){
      const { data, error } = await sb.storage.from(BUCKET).list(painel, { limit: 1000 });
      if (error) throw erro('unavailable', error.message);
      const assets = (data || []).filter(f => !f.name.startsWith('_')).map(f => ({ id: f.name, url: '/_blob/' + f.name, sizeBytes: f.metadata?.size, contentType: f.metadata?.mimetype }));
      return { assets, usage: { files: assets.length, bytes: assets.reduce((s, a) => s + (a.sizeBytes || 0), 0) } };
    },
    async delete(id){
      if (!podeEditar()) throw erro('not_granted', 'Sem permissão.');
      const { error } = await sb.storage.from(BUCKET).remove([`${painel}/${id}`]);
      if (error) throw erro('unavailable', error.message);
      return { deleted: true };
    }
  });
}

async function baixarArquivo(sb, painel, id){
  const { data, error } = await sb.storage.from('arquivos').download(`${painel}/${id}`);
  if (error || !data) return new Response('', { status: 404 });
  return new Response(data, { status: 200, headers: { 'Content-Type': data.type || 'application/octet-stream' } });
}

function criarUsuario(ctx){
  const { sb, perfil, podeEditar, ehAdmin } = ctx;
  let nomes = null;
  const carregarNomes = async () => {
    if (nomes) return nomes;
    const { data } = await sb.rpc('nomes_usuarios');
    nomes = {}; (data || []).forEach(u => nomes[u.user_id] = u.nome);
    return nomes;
  };
  const p = () => perfil();
  return Object.freeze({
    id: async () => p().user_id,
    me: async () => ({ id: p().user_id, name: p().nome, guest: false }),
    isOwner: async () => ehAdmin(),
    canEdit: async () => podeEditar(),
    can: async n => n === 'data.write' ? podeEditar() : null,
    profiles: async ids => { const n = await carregarNomes(); const o = {}; (ids || []).forEach(id => o[id] = { id, name: n[id] || '', guest: false }); return o; },
    search: async q => { const n = await carregarNomes(); const t = String(q || '').toLowerCase();
      return Object.entries(n).filter(([, nome]) => nome.toLowerCase().includes(t)).map(([id, name]) => ({ id, name, guest: false })); }
  });
}

/* ---------- carimbo em todo PDF: "Gestão de Pessoas · CRV Industrial" + data de emissão ---------- */
let PDFLIB = null;
function carregarPdfLib(){
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (!PDFLIB) PDFLIB = new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload = () => ok(window.PDFLib); s.onerror = () => { PDFLIB = null; falha(new Error('pdf-lib')); };
    document.head.appendChild(s);
  });
  return PDFLIB;
}
const ehPdf = (nome, bytes) => /\.pdf$/i.test(nome || '') || (bytes && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46);
async function carimbarPdf(dados){
  const bytes = dados instanceof Uint8Array ? dados : new Uint8Array(dados instanceof ArrayBuffer ? dados : await new Blob([dados]).arrayBuffer());
  try {
    const { PDFDocument, StandardFonts, rgb } = await carregarPdfLib();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const fonte = await doc.embedFont(StandardFonts.Helvetica);
    const negrito = await doc.embedFont(StandardFonts.HelveticaBold);
    const agora = new Date();
    const quando = 'Emitido em ' + agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    const cor = rgb(0.36, 0.42, 0.52), tam = 7;
    doc.getPages().forEach(pg => {
      const { width } = pg.getSize();
      pg.drawText('Gestão de Pessoas', { x: 18, y: 7, size: tam, font: negrito, color: cor });
      pg.drawText(' · CRV Industrial', { x: 18 + negrito.widthOfTextAtSize('Gestão de Pessoas', tam), y: 7, size: tam, font: fonte, color: cor });
      pg.drawText(quando, { x: width - 18 - fonte.widthOfTextAtSize(quando, tam), y: 7, size: tam, font: fonte, color: cor });
    });
    return await doc.save();
  } catch (e) { console.warn('carimbo do PDF não aplicado:', e); return bytes; }
}

function criarDownloads(){
  return Object.freeze({
    async save({ filename, data }){
      if (ehPdf(filename)) data = await carimbarPdf(data);
      const b = data instanceof Blob ? data : new Blob([data], ehPdf(filename) ? { type:'application/pdf' } : {});
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = String(filename || 'arquivo').replace(/[\\/:*?"<>|]/g, '-');
      document.body.appendChild(a); a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 4000);
      return true;
    }
  });
}

/* Chamado pelo app ao abrir um painel completo */
window.CRV_PONTE = {
  limpar(){ ouvintes.clear(); },
  criar(ctx){
    const cache = {};
    return {
      capacidade(nome){
        if (cache[nome] !== undefined) return cache[nome];
        let v = null;
        if (nome === 'downloads') v = criarDownloads();
        else if (nome === 'db') v = criarDb(ctx);
        else if (nome === 'user') v = criarUsuario(ctx);
        else if (nome === 'assets') v = ctx.podeEditar() ? criarArquivos(ctx) : null;
        // sample (IA), room, comments, mcp etc. não existem fora do Claude: o painel esconde esses recursos
        return (cache[nome] = v);
      },
      blob: id => baixarArquivo(ctx.sb, ctx.painel, id),
      carimbar: dados => carimbarPdf(dados)
    };
  },
  // código que roda dentro do painel, antes de tudo
  scriptPainel(){
    return `(function(){var P=window.parent&&window.parent.__CRV_PAINEL;
window.claude={use:function(n){return Promise.resolve(P?P.capacidade(n):null)}};
var f0=window.fetch.bind(window);
window.fetch=function(u,o){var s=typeof u==='string'?u:(u&&u.url)||'';if(s.indexOf('/_blob/')===0&&P)return P.blob(s.slice(7).split(/[?#]/)[0]);return f0(u,o)};
var oc=HTMLAnchorElement.prototype.click,od=HTMLAnchorElement.prototype.dispatchEvent;
function crvPdf(a){if(!P||!P.carimbar||a.__crv||!a.hasAttribute('download'))return false;var h=a.href||'',n=a.download||'';if(!/\\.pdf$/i.test(n)&&!/^data:application\\/pdf/i.test(h))return false;if(!/^(blob:|data:)/i.test(h))return false;
 fetch(h).then(function(r){return r.arrayBuffer()}).then(function(b){return P.carimbar(b)}).then(function(u8){var u=URL.createObjectURL(new Blob([u8],{type:'application/pdf'}));var x=document.createElement('a');x.href=u;x.download=n||'documento.pdf';x.__crv=1;document.body.appendChild(x);oc.call(x);setTimeout(function(){x.remove();URL.revokeObjectURL(u)},4000)}).catch(function(){a.__crv=1;oc.call(a)});return true}
HTMLAnchorElement.prototype.click=function(){if(crvPdf(this))return;return oc.call(this)};
HTMLAnchorElement.prototype.dispatchEvent=function(e){if(e&&e.type==='click'&&crvPdf(this))return true;return od.call(this,e)};
document.addEventListener('click',function(ev){var a0=ev.target&&ev.target.closest&&ev.target.closest('a[download]');if(a0&&crvPdf(a0)){ev.preventDefault();return}},true);
document.addEventListener('click',function(ev){var a=ev.target&&ev.target.closest&&ev.target.closest('a[href^="/_blob/"]');if(!a||!P)return;ev.preventDefault();var w=window.open('','_blank');P.blob(a.getAttribute('href').slice(7)).then(function(r){return r.blob()}).then(function(b){var u=URL.createObjectURL(b);if(w)w.location=u;else location.href=u})},true);
})();`;
  }
};
})();
