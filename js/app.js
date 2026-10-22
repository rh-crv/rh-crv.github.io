/* =====================================================================
   App Gestão de Pessoas CRV
   Login + perfis (Supabase) · frentes do Fluxograma do RH · painéis
   ===================================================================== */
(() => {
'use strict';

const CFG = window.CRV_CONFIG;
const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'crv-gp-sessao' }
});

/* ---------- identidade visual das frentes ---------- */
const FRENTES = {
  'Quadro e movimentação':         { cor:'#24427c', ic:'pessoas',   desc:'Quadro, admissões, rescisões e experiência' },
  'Atração e perfil':              { cor:'#1f8a8a', ic:'lupa',      desc:'Currículos, seleção e perfil' },
  'Frequência e férias':           { cor:'#e9a23b', ic:'calendario',desc:'Absenteísmo, férias e sanções' },
  'Benefícios':                    { cor:'#2e8a57', ic:'presente',  desc:'VA, plano de saúde, odonto e farmácia' },
  'Jovem Aprendiz':                { cor:'#7a4fb5', ic:'capelo',    desc:'Programa Conexão Aprendiz' },
  'Treinamento e liderança':       { cor:'#d4573f', ic:'trofeu',    desc:'T&D, pesquisas e lideranças' },
  'Ocorrências, risco e jurídico': { cor:'#a1341f', ic:'alerta',    desc:'RD, fadiga, processos e ouvidorias' },
  'Atendimento':                   { cor:'#4a6a8a', ic:'balcao',    desc:'Recepção do RH' },
  'RH externo':                    { cor:'#8a7a2e', ic:'onibus',    desc:'Alojamentos e ônibus' },
  'Outros controles':              { cor:'#5d6a85', ic:'pasta',     desc:'Controles complementares' }
};
const ORDEM_FRENTES = Object.keys(FRENTES);
const PALETA = ['#24427c','#2e8a57','#e9a23b','#d4573f','#1f8a8a','#7a4fb5','#8a7a2e','#4a6a8a','#c46a9a','#3f7fbf'];
const ICONES = {
  pessoas:'<path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4zM8 14c-.3 0-.7 0-1.1.1A4.9 4.9 0 0 1 9 17v3H0v-2.5C0 15.6 4.3 14 8 14z"/>',
  lupa:'<path d="M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/>',
  calendario:'<path d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3zm12 7H5v10h14zM7 11h4v4H7z"/>',
  presente:'<path d="M20 7h-2.2A3 3 0 0 0 12 3.8 3 3 0 0 0 6.2 7H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1zM9 5a1 1 0 0 1 1 1v1H9a1 1 0 0 1 0-2zm6 0a1 1 0 0 1 0 2h-1V6a1 1 0 0 1 1-1zM4 13v7a1 1 0 0 0 1 1h6v-8zm9 0v8h6a1 1 0 0 0 1-1v-7z"/>',
  capelo:'<path d="M12 3 1 9l11 6 9-4.9V17h2V9zm-6 9.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3.3z"/>',
  trofeu:'<path d="M17 4V2H7v2H3v3a4 4 0 0 0 4 4h.3A5 5 0 0 0 11 13.9V17H8v2h8v-2h-3v-3.1a5 5 0 0 0 3.7-2.9h.3a4 4 0 0 0 4-4V4zM5 7V6h2v3a2 2 0 0 1-2-2zm14 0a2 2 0 0 1-2 2V6h2z"/>',
  alerta:'<path d="M12 2 1 21h22zm1 15h-2v-2h2zm0-4h-2V9h2z"/>',
  balcao:'<path d="M12 2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.3A5 5 0 0 1 12 17v1h3v2H9v-2h3v-1a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z"/>',
  onibus:'<path d="M4 16c0 .9.4 1.7 1 2.2V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.8c.6-.5 1-1.3 1-2.2V6c0-3.5-3.6-4-8-4S4 2.5 4 6zm3.5 1A1.5 1.5 0 1 1 9 15.5 1.5 1.5 0 0 1 7.5 17zm9 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5zM18 11H6V6h12z"/>',
  pasta:'<path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z"/>',
  casa:'<path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/>',
  engrenagem:'<path d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.3 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.3-2.9a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z"/>',
  usuario:'<path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>',
  baixar:'<path d="M11 3h2v9.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4 3.3 3.3zM4 18h16v2H4z"/>',
  sair:'<path d="M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6v-2H5V5h5zm6.6 4.6L15.2 9l2 2H9v2h8.2l-2 2 1.4 1.4L21 12z"/>',
  planilha:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 7V3.5L18.5 9zM8 13h3v2H8zm5 0h3v2h-3zm-5 4h3v2H8zm5 0h3v2h-3z"/>'
};
const svg = (nome, cor='currentColor') => `<svg viewBox="0 0 24 24" fill="${cor}" aria-hidden="true">${ICONES[nome]||ICONES.pasta}</svg>`;

/* ---------- estado ---------- */
const E = { sessao:null, perfil:null, paineis:[], metas:{}, base:null, view:null, instalarEvt:null };

/* ---------- utilidades ---------- */
const $ = (s, el=document) => el.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normal = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const fmtData = iso => { if(!iso) return '—'; const d=new Date(iso); return d.toLocaleDateString('pt-BR')+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); };
const fmtNum = n => Number(n||0).toLocaleString('pt-BR');
const iniciais = n => String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
const usuarioParaEmail = u => normal(u).replace(/\s+/g,'.').replace(/[^a-z0-9._-]/g,'') + '@' + CFG.DOMINIO_LOGIN;
const ehAdmin = () => E.perfil?.papel === 'admin';
const nomePapel = p => ({admin:'Administrador', editor:'Editor', leitor:'Leitor'}[p] || p);

function toast(msg, erro=false){
  const t = document.createElement('div');
  t.className = 'toast' + (erro?' erro-t':'');
  t.textContent = msg;
  $('#toast').appendChild(t);
  setTimeout(()=>t.remove(), erro?6000:3200);
}

function traduzErro(e){
  const m = (e?.message || String(e||'')).toLowerCase();
  if (m.includes('invalid login')) return 'Usuário ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('duplicate key')) return 'Esse usuário já existe. Escolha outro nome de usuário.';
  if (m.includes('password should be at least') || m.includes('weak')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (m.includes('email not confirmed')) return 'Login ainda não liberado. No Supabase, desative a opção "Confirm email" (veja o passo a passo).';
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Cadastro desativado no Supabase. Ative "Allow new users to sign up" (veja o passo a passo).';
  if (m.includes('rate limit')) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão com o servidor. Verifique a internet.';
  if (m.includes('row-level security') || m.includes('permission denied')) return 'Você não tem permissão para essa ação.';
  if (m.includes('relation') && m.includes('does not exist')) return 'O banco ainda não foi preparado. Rode o arquivo SQL no Supabase (passo a passo).';
  return e?.message || 'Algo deu errado. Tente novamente.';
}

/* ---------- modal ---------- */
function abrirModal({titulo, corpo, pe='', largo=false, aoAbrir}){
  const raiz = $('#modal-raiz');
  raiz.innerHTML = `<div class="modal-fundo"><div class="modal ${largo?'largo':''}" role="dialog" aria-modal="true">
    <div class="modal-cab"><h3>${esc(titulo)}</h3><button class="x" aria-label="Fechar">&times;</button></div>
    <div class="modal-corpo">${corpo}</div>${pe?`<div class="modal-pe">${pe}</div>`:''}</div></div>`;
  const fundo = $('.modal-fundo', raiz);
  $('.x', raiz).onclick = fecharModal;
  fundo.addEventListener('mousedown', ev => { if (ev.target === fundo) fecharModal(); });
  if (aoAbrir) aoAbrir($('.modal', raiz));
}
function fecharModal(){ $('#modal-raiz').innerHTML = ''; }
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') fecharModal(); });

/* =====================================================================
   INÍCIO / AUTENTICAÇÃO
   ===================================================================== */
async function iniciar(){
  const { data } = await sb.auth.getSession();
  E.sessao = data.session;
  if (!E.sessao) return telaLogin();
  await entrarNoApp();
}

async function entrarNoApp(){
  try {
    const uid = E.sessao.user.id;
    const { data: perfil, error } = await sb.from('perfis').select('*').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    if (!perfil || !perfil.ativo) return telaSemAcesso(!perfil ? 'semperfil' : 'inativo');
    E.perfil = perfil;
    await carregarCatalogo();
    window.addEventListener('hashchange', rota);
    rota();
  } catch(e){
    $('#app').innerHTML = `<div class="login-fundo"><div class="login-card"><img class="logo" src="img/logo-crv.png" alt="CRV Industrial">
      <div class="erro" style="margin-top:18px">${esc(traduzErro(e))}</div>
      <button class="btn cheio" id="b-sair">Voltar ao login</button></div></div>`;
    $('#b-sair').onclick = sair;
  }
}

async function carregarCatalogo(){
  const [p, m, k] = await Promise.all([
    sb.from('paineis').select('*').order('ordem'),
    sb.from('bases').select('painel,arquivo,linhas,atualizado_em,atualizado_por'),
    sb.from('pacotes').select('painel,referencia,atualizado_em,atualizado_por')
  ]);
  if (p.error) throw p.error;
  E.paineis = (p.data || []).filter(x => x.id !== 'rs' && x.id !== 'absenteismo-gestao'); // R&S fica dentro do Banco de Currículos; Absenteísmo Gestão foi retirado (fica só o do RH)
  // nome padrão do Jovem Aprendiz (Instituto João Bittar), separado do RENAPSI
  const jv = E.paineis.find(x => x.id === 'jovem');
  if (jv && jv.nome === 'Jovem Aprendiz') {
    jv.nome = 'Jovem Aprendiz João Bittar';
    if (E.perfil && E.perfil.papel === 'admin') sb.from('paineis').update({ nome: jv.nome }).eq('id', 'jovem').then(() => {}, () => {});
  }
  // painéis novos que ainda não existem no banco: o administrador cria na hora
  const sp = E.paineis.find(x => x.id === 'sysprocard');
  const NOVOS = [
    { id:'cartao-alimentacao', frente:'Benefícios', nome:'Cartão Alimentação', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.1 },
    { id:'cartao-convenio',    frente:'Benefícios', nome:'Cartão Convênio',    nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.2 },
    { id:'cartao-premium',     frente:'Benefícios', nome:'Cartão Premium',     nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.3 },
    { id:'cartao-adm',         frente:'Benefícios', nome:'Cartão Convênio ADM', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.4 }
  ].filter(n => !E.paineis.some(x => x.id === n.id));
  if (NOVOS.length && E.perfil && E.perfil.papel === 'admin') {
    await sb.from('paineis').insert(NOVOS.map((n, i) => ({ ...n, ordem: (sp ? sp.ordem : 40) + 1 + i })));
    const r2 = await sb.from('paineis').select('*').order('ordem');
    if (!r2.error) E.paineis = (r2.data || []).filter(x => x.id !== 'rs' && x.id !== 'absenteismo-gestao');
  }
  // os cartões ficam logo abaixo do Sysprocard
  if (sp) { const ix = E.paineis.indexOf(sp); const OC = ['cartao-alimentacao','cartao-convenio','cartao-adm','cartao-premium']; const cs = E.paineis.filter(x => x.id.startsWith('cartao-')).sort((a,b) => OC.indexOf(a.id) - OC.indexOf(b.id));
    if (cs.length) { E.paineis = E.paineis.filter(x => !x.id.startsWith('cartao-')); E.paineis.splice(E.paineis.indexOf(E.paineis.find(x => x.id === 'sysprocard')) + 1, 0, ...cs); } }
  E.metas = {};
  (m.data || []).forEach(r => E.metas[r.painel] = r);
  (k.data || []).forEach(r => E.metas[r.painel] = { ...r, linhas:null });
}

function podeVer(p){ if (!E.perfil) return false; if (ehAdmin()) return true; return p.nivel !== 'restrito' && (E.perfil.frentes||[]).includes(p.frente); }
function podeEditar(p){ if (!E.perfil) return false; if (ehAdmin()) return true; return E.perfil.papel === 'editor' && p.nivel !== 'restrito' && (E.perfil.frentes||[]).includes(p.frente); }

function telaLogin(modo='entrar', msg=''){
  const primeiro = modo === 'primeiro';
  $('#app').innerHTML = `
  <div class="login-fundo"><form class="login-card" id="f-login" autocomplete="on">
    <img class="logo" src="img/logo-crv.png" alt="CRV Industrial">
    <h1>Gestão de Pessoas</h1>
    <div class="faixa-cana"></div>
    <p class="sub">${primeiro ? 'Primeiro acesso: crie o usuário administrador do app.' : 'Entre com o usuário e a senha liberados pelo RH.'}</p>
    ${msg ? `<div class="${msg.startsWith('✓')?'ok':'erro'}">${esc(msg.replace(/^✓\s*/,''))}</div>` : ''}
    <div id="msg"></div>
    ${primeiro ? `<div class="campo"><label for="i-nome">Seu nome</label><input id="i-nome" required autocomplete="name"></div>` : ''}
    <div class="campo"><label for="i-usuario">Usuário</label><input id="i-usuario" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ex.: scarlatt"></div>
    <div class="campo"><label for="i-senha">Senha</label><input id="i-senha" type="password" required minlength="6" autocomplete="${primeiro?'new-password':'current-password'}"></div>
    ${primeiro ? `<div class="campo"><label for="i-senha2">Repita a senha</label><input id="i-senha2" type="password" required minlength="6" autocomplete="new-password"></div>` : ''}
    <button class="btn prim cheio" id="b-entrar" type="submit">${primeiro ? 'Criar administrador' : 'Entrar'}</button>
    <div style="text-align:center;margin-top:16px">
      <button type="button" class="link" id="b-modo">${primeiro ? 'Já tenho usuário — entrar' : 'Primeiro acesso do administrador'}</button>
    </div>
  </form></div>`;
  $('#b-modo').onclick = () => telaLogin(primeiro ? 'entrar' : 'primeiro');
  $('#f-login').onsubmit = async ev => {
    ev.preventDefault();
    const b = $('#b-entrar'); b.disabled = true; b.textContent = 'Aguarde...';
    const usuario = $('#i-usuario').value.trim();
    const senha = $('#i-senha').value;
    const mostrarErro = t => { $('#msg').innerHTML = `<div class="erro">${esc(t)}</div>`; b.disabled=false; b.textContent = primeiro?'Criar administrador':'Entrar'; };
    try {
      if (primeiro) {
        if (senha !== $('#i-senha2').value) return mostrarErro('As senhas não conferem.');
        const nome = $('#i-nome').value.trim();
        const { data, error } = await sb.auth.signUp({ email: usuarioParaEmail(usuario), password: senha, options:{ data:{ nome, usuario } } });
        if (error) throw error;
        if (!data.session) return mostrarErro('Usuário criado, mas o login ainda está bloqueado. No Supabase, desative "Confirm email" e entre normalmente.');
        const r = await sb.rpc('reivindicar_admin', { p_usuario: normal(usuario), p_nome: nome });
        if (r.error) throw r.error;
        if (!r.data) { await sb.auth.signOut(); return telaLogin('entrar', 'Já existe um administrador. Peça a ele para liberar seu acesso.'); }
        E.sessao = data.session;
        return entrarNoApp();
      }
      const { data, error } = await sb.auth.signInWithPassword({ email: usuarioParaEmail(usuario), password: senha });
      if (error) throw error;
      E.sessao = data.session;
      entrarNoApp();
    } catch(e){ mostrarErro(traduzErro(e)); }
  };
}

function telaSemAcesso(tipo){
  $('#app').innerHTML = `<div class="login-fundo"><div class="login-card">
    <img class="logo" src="img/logo-crv.png" alt="CRV Industrial"><div class="faixa-cana" style="margin-top:16px"></div>
    <h1>${tipo==='inativo' ? 'Acesso desativado' : 'Acesso ainda não liberado'}</h1>
    <p class="sub">${tipo==='inativo' ? 'Seu usuário está desativado. Fale com o RH.' : 'Seu usuário existe, mas ainda não tem permissões. Fale com o administrador do app.'}</p>
    <button class="btn cheio" id="b-sair">Sair</button></div></div>`;
  $('#b-sair').onclick = sair;
}

async function sair(){ await sb.auth.signOut(); E.sessao=null; E.perfil=null; location.hash=''; telaLogin(); }

/* =====================================================================
   ESTRUTURA (topo + rotas)
   ===================================================================== */
function menuRecolhido(){ try { return !!localStorage.getItem('crv-menu-recolhido'); } catch(_) { return false; } }
function moldura(conteudo){
  window.CRV_PONTE && window.CRV_PONTE.limpar();
  const p = E.perfil;
  const h = location.hash || '#/';
  const atual = h.startsWith('#/p/') ? decodeURIComponent(h.slice(4).split('/')[0]) : null;
  const acaoAtual = h.startsWith('#/p/') ? (h.slice(4).split('/')[1] || '') : '';
  let subAbertos = {};
  try { subAbertos = JSON.parse(localStorage.getItem('crv-menu-sub') || '{}'); } catch(_){}
  const itemPainel = (x, cfg) => {
    const subs = SUBACOES[x.id];
    const bt = `<button class="lat-painel ${x.id===atual&&!acaoAtual?'ativo':''}" data-ir="#/p/${encodeURIComponent(x.id)}" style="--cor:${cfg.cor}">${esc(x.nome)}${x.nivel==='restrito'?' <i class="cad" title="Restrito">●</i>':''}</button>`;
    if (!subs) return bt;
    const aberto = x.id === atual || subAbertos[x.id];
    return `<div class="lat-pgrupo ${aberto?'aberto':''}" data-pid="${esc(x.id)}">
      <div class="lat-plinha">${bt}<button class="lat-pseta" title="Mostrar opções" aria-label="Mostrar opções">›</button></div>
      <div class="lat-psub">${subs.map(s => `<button class="lat-acao ${x.id===atual&&acaoAtual===s.acao?'ativo':''}" data-pid="${esc(x.id)}" data-acao="${esc(s.acao)}" style="--cor:${cfg.cor}">${esc(s.nome)}</button>`).join('')}</div>
    </div>`;
  };
  const visiveis = E.paineis.filter(podeVer);
  const grupos = {};
  visiveis.forEach(x => (grupos[x.frente] = grupos[x.frente] || []).push(x));
  const frentes = Object.keys(grupos).sort((a,b) => (ORDEM_FRENTES.indexOf(a)+1||99) - (ORDEM_FRENTES.indexOf(b)+1||99));
  let abertas = {};
  try { abertas = JSON.parse(localStorage.getItem('crv-menu-abertas') || '{}'); } catch(_){}
  const frenteAtual = atual ? E.paineis.find(x => x.id === atual)?.frente : null;
  if (frenteAtual) abertas[frenteAtual] = true;

  $('#app').innerHTML = `
  <div class="casca">
    <aside class="lateral ${menuRecolhido() ? 'recolhida' : ''}" id="lateral">
      <button class="lat-recolher" id="b-recolher" title="Recolher / abrir o menu" aria-label="Recolher menu">‹</button>
      <div class="lat-topo">
        <img class="logo" src="img/logo-crv.png" alt="CRV Industrial" id="t-logo">
        <div class="lat-tit"><b>Gestão de Pessoas</b><span>Unidade Capinópolis</span></div>
      </div>
      <nav class="lat-nav">
        <button class="lat-item ${h==='#/'||h===''?'ativo':''}" data-ir="#/">${svg('casa')}<span>Início</span></button>
        <div class="lat-sec">Frentes</div>
        ${frentes.map(f => { const cfg = FRENTES[f] || FRENTES['Outros controles']; return `
          <div class="lat-grupo ${abertas[f]?'aberto':''}" data-frente="${esc(f)}">
            <button class="lat-frente"><span class="lat-ic" style="background:${cfg.cor}">${svg(cfg.ic,'#fff')}</span><span class="lat-nome">${esc(f)}</span><span class="lat-seta">›</span></button>
            <div class="lat-sub">${grupos[f].map(x => itemPainel(x, cfg)).join('')}</div>
          </div>`; }).join('')}
        <div class="lat-sec">Conta</div>
        ${ehAdmin() ? `<button class="lat-item ${h==='#/admin'?'ativo':''}" data-ir="#/admin">${svg('engrenagem')}<span>Administração</span></button>` : ''}
        <button class="lat-item ${h==='#/conta'?'ativo':''}" data-ir="#/conta">${svg('usuario')}<span>Minha conta</span></button>
        <button class="lat-item" id="m-instalar">${svg('baixar')}<span>Instalar o app</span></button>
      </nav>
      <div class="lat-pe">
        <div class="lat-av">${esc(iniciais(p.nome))}</div>
        <div class="lat-quem"><b>${esc(nomeBonito(p.nome))}</b><span>${esc(nomePapel(p.papel))} · v${esc(CFG.VERSAO)}</span></div>
        <button class="lat-sair" id="m-sair" title="Sair">${svg('sair')}</button>
      </div>
    </aside>
    <div class="veu" id="veu"></div>
    <div class="conteudo">
      <header class="barra-movel">
        <button class="hamb" id="b-hamb" aria-label="Abrir menu"><span></span><span></span><span></span></button>
        <img class="logo" src="img/logo-crv.png" alt="CRV Industrial">
        <b>Gestão de Pessoas</b>
      </header>
      <main class="pagina" id="pagina">${conteudo}</main>
    </div>
  </div>`;
  const lat = $('#lateral'), veu = $('#veu');
  $('#b-recolher').onclick = () => { lat.classList.toggle('recolhida'); try { localStorage.setItem('crv-menu-recolhido', lat.classList.contains('recolhida') ? '1' : ''); } catch(_){} };
  const fechar = () => { lat.classList.remove('aberta'); veu.classList.remove('ativo'); };
  $('#b-hamb').onclick = () => { lat.classList.add('aberta'); veu.classList.add('ativo'); };
  veu.onclick = fechar;
  $('#t-logo').onclick = () => { fechar(); location.hash = '#/'; };
  lat.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { fechar(); if (location.hash === b.dataset.ir) rota(); else location.hash = b.dataset.ir; });
  lat.querySelectorAll('.lat-frente').forEach(b => b.onclick = () => {
    const g = b.parentElement; g.classList.toggle('aberto');
    abertas[g.dataset.frente] = g.classList.contains('aberto');
    try { localStorage.setItem('crv-menu-abertas', JSON.stringify(abertas)); } catch(_){}
  });
  lat.querySelectorAll('.lat-pseta').forEach(b => b.onclick = () => {
    const g = b.closest('.lat-pgrupo'); g.classList.toggle('aberto');
    subAbertos[g.dataset.pid] = g.classList.contains('aberto');
    try { localStorage.setItem('crv-menu-sub', JSON.stringify(subAbertos)); } catch(_){}
  });
  lat.querySelectorAll('.lat-acao').forEach(b => b.onclick = () => {
    fechar();
    const id = b.dataset.pid, acao = b.dataset.acao;
    // se o painel já está aberto, só chama a ação dentro dele
    if (E.painelAberto === id && executarAcao(acao)) return;
    location.hash = '#/p/' + encodeURIComponent(id) + '/' + acao;
  });
  $('#m-sair').onclick = sair;
  $('#m-instalar').onclick = () => { fechar(); instalarApp(); };
}

function rota(){
  if (!E.perfil) return;
  fecharModal();
  const h = location.hash || '#/';
  if (h.startsWith('#/p/')) { const [id, acao] = h.slice(4).split('/'); return telaPainel(decodeURIComponent(id), acao || ''); }
  if (h === '#/admin' && ehAdmin()) return telaAdmin();
  if (h === '#/conta') return telaConta();
  telaInicio();
}

/* =====================================================================
   INÍCIO — frentes e painéis
   ===================================================================== */
const nomeBonito = n => String(n||'').toLowerCase().replace(/(^|\s)(\S)/g, (m, e, l) => e + l.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, x => x.toLowerCase());
function telaInicio(){
  const visiveis = E.paineis.filter(podeVer);
  const grupos = {};
  visiveis.forEach(p => (grupos[p.frente] = grupos[p.frente] || []).push(p));
  const frentes = Object.keys(grupos).sort((a,b) => (ORDEM_FRENTES.indexOf(a)+1||99) - (ORDEM_FRENTES.indexOf(b)+1||99));
  const agora = new Date(), hora = agora.getHours();
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const hoje = agora.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  // situação dos dados
  const dataRef = p => { const m = E.metas[p.id]; if (!m) return null; return m.referencia ? new Date(m.referencia + 'T12:00') : new Date(m.atualizado_em); };
  const comDados = visiveis.filter(p => E.metas[p.id]);
  const dias = d => Math.floor((agora - d) / 864e5);
  const antigos = comDados.filter(p => dias(dataRef(p)) > 30);
  const semana = comDados.filter(p => dias(new Date(E.metas[p.id].atualizado_em)) <= 7);
  const semDados = visiveis.filter(p => !E.metas[p.id]);

  moldura(`
    <section class="ini-topo">
      <div>
        <div class="ini-eyebrow">CRV Industrial · Unidade Capinópolis</div>
        <h1>${saud}, ${esc(nomeBonito(E.perfil.nome).split(' ')[0])}</h1>
        <div class="ini-data">${esc(hoje.charAt(0).toUpperCase() + hoje.slice(1))}</div>
      </div>
      <input class="ini-busca" id="busca" type="search" placeholder="Buscar painel…" aria-label="Buscar painel">
    </section>
    <section class="ini-stats">
      <div class="ist"><span>Painéis disponíveis</span><b>${visiveis.length}</b><small>em ${frentes.length} frentes</small></div>
      <div class="ist"><span>Atualizados na semana</span><b>${semana.length}</b><small>últimos 7 dias</small></div>
      <div class="ist ${antigos.length ? 'alerta' : ''}"><span>Dados com mais de 30 dias</span><b>${antigos.length}</b><small>${antigos.length ? esc(antigos.slice(0,2).map(p=>p.nome).join(', ')) + (antigos.length > 2 ? '…' : '') : 'tudo em dia'}</small></div>
      <div class="ist ${semDados.length ? 'neutro' : ''}"><span>Sem dados carregados</span><b>${semDados.length}</b><small>${semDados.length ? esc(semDados.slice(0,2).map(p=>p.nome).join(', ')) + (semDados.length > 2 ? '…' : '') : 'todos carregados'}</small></div>
    </section>
    ${!standalone ? `<div class="ini-instalar" id="faixa-instalar"><span>Use como aplicativo no celular ou no computador.</span><button class="link" id="b-inst">Instalar</button><button class="link" id="b-inst-x" aria-label="Fechar">×</button></div>` : ''}
    ${frentes.length ? frentes.map(f => blocoFrente(f, grupos[f])).join('')
      : `<div class="cartao vazio"><h3>Nenhum painel liberado</h3><p>Peça ao administrador para liberar as frentes que você usa.</p></div>`}
  `);
  if ($('#faixa-instalar')) {
    try { if (localStorage.getItem('crv-inst-x')) $('#faixa-instalar').remove(); } catch(_){}
    $('#b-inst') && ($('#b-inst').onclick = instalarApp);
    $('#b-inst-x') && ($('#b-inst-x').onclick = () => { $('#faixa-instalar').remove(); try{localStorage.setItem('crv-inst-x','1')}catch(_){} });
  }
  document.querySelectorAll('[data-painel]').forEach(b => b.onclick = () => location.hash = '#/p/' + encodeURIComponent(b.dataset.painel));
  $('#busca')?.addEventListener('input', ev => {
    const q = normal(ev.target.value);
    document.querySelectorAll('.tile').forEach(b => b.classList.toggle('oculto', q && !normal(b.dataset.nome).includes(q)));
    document.querySelectorAll('.ini-frente').forEach(f => f.classList.toggle('oculto', !f.querySelector('.tile:not(.oculto)')));
  });
}

function blocoFrente(f, lista){
  const cfg = FRENTES[f] || FRENTES['Outros controles'];
  return `<section class="ini-frente" style="--cor:${cfg.cor}">
    <header class="if-cab"><span class="if-ic">${svg(cfg.ic,'#fff')}</span><h2>${esc(f)}</h2><span class="if-n">${lista.length}</span><span class="if-desc">${esc(cfg.desc)}</span></header>
    <div class="tiles">${lista.map(p => {
      const m = E.metas[p.id];
      const ref = m ? (m.referencia ? fmtRef(m.referencia) : new Date(m.atualizado_em).toLocaleDateString('pt-BR')) : null;
      return `<button class="tile" data-painel="${esc(p.id)}" data-nome="${esc(p.nome)}">
        <span class="t-nome">${esc(p.nome)}</span>
        <span class="t-meta">${ref ? 'Dados de ' + esc(ref) : '<i>Sem dados</i>'}${p.nivel === 'restrito' ? '<span class="t-cad" title="Restrito a administradores"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3z"/></svg>Restrito</span>' : ''}</span>
      </button>`;
    }).join('')}</div>
  </section>`;
}

/* =====================================================================
   PAINEL
   ===================================================================== */
// opções que aparecem abaixo do painel no menu (seta)
const SUBACOES = {
  quadro:   [{ acao:'hcol', nome:'Histórico do colaborador' }, { acao:'ent', nome:'Entrevista de desligamento' }, { acao:'estab', nome:'Estabilidade' }],
  sancoes:  [{ acao:'doc', nome:'Emitir advertência / suspensão / orientação' }],
  ouvidorias: [{ acao:'nova', nome:'Cadastrar ouvidoria' }],
  rd:       [{ acao:'novo', nome:'Cadastrar RD' }, { acao:'aut', nome:'Autorização de desconto' }, { acao:'hist', nome:'Histórico de autorizações' }],
  fadiga:   [{ acao:'novo', nome:'Cadastrar ocorrência' }],
  treinamentos: [{ acao:'novo', nome:'Cadastrar treinamento' }],
  'cartao-alimentacao': [{ acao:'rel', nome:'Relatório de conferência' }],
  'cartao-convenio':    [{ acao:'termo', nome:'Termo de opção' }, { acao:'rel', nome:'Relatório de conferência' }],
  'cartao-premium':     [{ acao:'rel', nome:'Relatório de conferência' }],
  'cartao-adm':         [{ acao:'novo', nome:'Registrar entrega' }, { acao:'sem', nome:'Créditos da semana' }, { acao:'rel', nome:'Relatório do período' }],
  crachas:  [{ acao:'novo', nome:'Cadastrar crachá de treinamento' }],
  farmacia: [{ acao:'aut', nome:'Autorização de desconto' }, { acao:'hist', nome:'Histórico de autorizações' }]
};
function fecharJanelasAut(w){ try { w.document.querySelectorAll('.aut-fundo,.ent-fundo,.of-fundo,.nv-fundo,.rl-fundo,.es-fundo,.ds-fundo').forEach(x => x.remove()); } catch(_){} }
function executarAcao(acao){
  const f = document.getElementById('modelo-frame');
  const w = f && f.contentWindow;
  if (acao === 'aut' && w && typeof w.CRV_AUTORIZACAO === 'function') { fecharJanelasAut(w); w.CRV_AUTORIZACAO(); return true; }
  if (acao === 'hist' && w && typeof w.CRV_AUT_HIST === 'function') { fecharJanelasAut(w); w.CRV_AUT_HIST(); return true; }
  if (acao === 'doc' && w && typeof w.CRV_DOCDISC === 'function') { fecharJanelasAut(w); w.CRV_DOCDISC(); return true; }
  if (acao === 'hcol' && w && typeof w.CRV_HISTCOL === 'function') { fecharJanelasAut(w); w.CRV_HISTCOL(); return true; }
  if (acao === 'estab' && w && typeof w.CRV_ESTAB === 'function') { fecharJanelasAut(w); w.CRV_ESTAB(); return true; }
  if (acao === 'ent' && w && typeof w.CRV_ENTREVISTA === 'function') { fecharJanelasAut(w); w.CRV_ENTREVISTA(); return true; }
  if (acao === 'termo' && w && typeof w.CRV_TERMO === 'function') { fecharJanelasAut(w); w.CRV_TERMO(); return true; }
  if (acao === 'sem' && w && typeof w.CRV_SEMANA === 'function') { fecharJanelasAut(w); w.CRV_SEMANA(); return true; }
  if (acao === 'rel' && w && typeof w.CRV_RELATORIO === 'function') { fecharJanelasAut(w); w.CRV_RELATORIO(); return true; }
  if (acao === 'novo' && w && typeof w.CRV_NOVO === 'function') { fecharJanelasAut(w); w.CRV_NOVO(); return true; }
  if (acao === 'nova' && w && typeof w.CRV_OUV_NOVA === 'function') { fecharJanelasAut(w); w.CRV_OUV_NOVA(); return true; }
  return false;
}
async function telaPainel(id, acao){
  E.painelAberto = null;
  const p = E.paineis.find(x => x.id === id);
  if (!p || !podeVer(p)) { toast('Painel não encontrado ou sem acesso.', true); location.hash = '#/'; return; }
  const cfg = FRENTES[p.frente] || FRENTES['Outros controles'];
  if (MODELOS[id]) return telaModelo(p, cfg, acao);
  moldura(`<div class="trilha"><button data-ir="#/">Início</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
    <div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Carregando dados...</p></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';

  const { data, error } = await sb.from('bases').select('*').eq('painel', id).maybeSingle();
  if (error) { $('#pagina').innerHTML += `<div class="erro">${esc(traduzErro(error))}</div>`; return; }

  E.view = { p, cfg, base: data, filtro: null, busca: '', ordem: null, limite: 100, agrupar: null };
  if (data) {
    E.view.agrupar = escolherAgrupamento(data.colunas, data.dados);
  }
  desenharPainel();
}

function desenharPainel(){
  const v = E.view, p = v.p, b = v.base;
  const editar = podeEditar(p);
  const cab = `<div class="trilha"><button data-ir="#/">Início</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
  <div class="painel-cab">
    <div class="barra-cor" style="background:${v.cfg.cor}"></div>
    <div><h2>${esc(p.nome)}</h2>
      <div class="meta">${b ? `${esc(b.arquivo||'Planilha')} · atualizado em ${fmtData(b.atualizado_em)}${b.atualizado_por?` por ${esc(b.atualizado_por)}`:''}` : 'Ainda sem dados carregados'}
      · <span class="selo ${p.nivel}">${p.nivel}</span></div></div>
    <div class="acoes">
      ${b ? `<button class="btn azul" id="b-exportar">Exportar</button>` : ''}
      ${editar ? `<button class="btn prim" id="b-enviar">${b ? 'Atualizar planilha' : 'Enviar planilha'}</button>` : ''}
    </div>
  </div>`;

  if (!b || !b.dados?.length) {
    $('#pagina').innerHTML = cab + `<div class="cartao vazio">${svg('planilha')}
      <h3>Nenhum dado neste painel ainda</h3>
      <p>${editar ? 'Envie a planilha deste controle (Excel ou CSV). O app lê, organiza e libera para quem tem acesso.' : 'O RH ainda não carregou a base deste painel.'}</p>
      ${editar ? '<button class="btn prim" id="b-enviar2">Enviar planilha</button>' : ''}</div>`;
    ligarCabPainel();
    $('#b-enviar2') && ($('#b-enviar2').onclick = () => escolherArquivo());
    return;
  }

  const linhas = linhasVisiveis();
  const col = v.agrupar;
  const idx = b.colunas.indexOf(col);
  const contagem = {};
  if (idx >= 0) {
    linhasFiltradasSemGrupo().forEach(r => { const k = vazioParaTraco(r[idx]); contagem[k] = (contagem[k]||0) + 1; });
  }
  const ordenado = Object.entries(contagem).sort((a,b)=>b[1]-a[1]);
  const max = ordenado[0]?.[1] || 1;
  const candidatos = colunasAgrupaveis(b.colunas, b.dados);

  const kpis = kpisAutomaticos(b);

  $('#pagina').innerHTML = cab + `
  <div class="kpis">
    <button class="kpi" style="--cor:${v.cfg.cor}" id="k-total"><small>Total de registros</small><b>${fmtNum(b.dados.length)}</b><span>clique para ver todos</span></button>
    ${kpis.map((k,i)=>`<button class="kpi" style="--cor:${PALETA[(i+1)%PALETA.length]}" data-kcol="${esc(k.col)}" data-kval="${esc(k.val)}"><small>${esc(k.rotulo)}</small><b>${fmtNum(k.n)}</b><span>${esc(k.sub)}</span></button>`).join('')}
  </div>
  <div class="grade2">
    <div class="cartao">
      <div class="cartao-cab"><h3>Distribuição</h3>
        <select id="s-agrupar" aria-label="Agrupar por">${candidatos.map(c=>`<option ${c===col?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="barras">${ordenado.map(([k,n],i)=>`
        <button class="barra ${v.filtro && v.filtro.val===k ? 'ativa':''}" data-val="${esc(k)}" title="Ver quem está em ${esc(k)}">
          <span class="rot">${esc(k)}</span><span class="trilho"><span class="enche" style="width:${Math.max(2,n/max*100)}%;background:${PALETA[i%PALETA.length]}"></span></span><span class="val">${fmtNum(n)}</span>
        </button>`).join('') || '<p class="vazio">Sem colunas para agrupar.</p>'}</div>
    </div>
    <div class="cartao">
      <div class="cartao-cab"><h3>${v.filtro ? 'Quem está em' : 'Registros'}</h3>
        ${v.filtro ? `<span class="filtro-ativo">${esc(v.filtro.col)}: ${esc(v.filtro.val)} <button id="b-limpa" aria-label="Limpar filtro">&times;</button></span>` : ''}
        <input class="busca" id="i-busca" type="search" placeholder="Buscar nome, matrícula..." value="${esc(v.busca)}"></div>
      <div class="tabela-env"><table class="tab"><thead><tr>${b.colunas.map((c,i)=>`<th data-i="${i}">${esc(c)}${v.ordem?.i===i?(v.ordem.asc?' ▲':' ▼'):''}</th>`).join('')}</tr></thead>
        <tbody>${linhas.slice(0, v.limite).map((r)=>`<tr data-r="${b.dados.indexOf(r)}">${b.colunas.map((_,i)=>`<td>${esc(r[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="rodape-tab"><span>${fmtNum(linhas.length)} de ${fmtNum(b.dados.length)} registros · clique em uma linha para abrir a ficha</span>
        ${linhas.length > v.limite ? '<button class="btn peq borda" id="b-mais">Mostrar mais</button>' : ''}</div>
    </div>
  </div>`;
  ligarCabPainel();

  $('#k-total').onclick = () => { v.filtro=null; v.busca=''; desenharPainel(); };
  document.querySelectorAll('[data-kcol]').forEach(k => k.onclick = () => { v.agrupar = k.dataset.kcol; v.filtro = { col:k.dataset.kcol, val:k.dataset.kval }; v.limite=100; desenharPainel(); });
  $('#s-agrupar').onchange = ev => { v.agrupar = ev.target.value; v.filtro = null; desenharPainel(); };
  document.querySelectorAll('.barra').forEach(bt => bt.onclick = () => {
    const val = bt.dataset.val;
    v.filtro = (v.filtro && v.filtro.val === val) ? null : { col: v.agrupar, val };
    v.limite = 100; desenharPainel();
  });
  $('#b-limpa') && ($('#b-limpa').onclick = () => { v.filtro = null; desenharPainel(); });
  let tempo;
  $('#i-busca').oninput = ev => { clearTimeout(tempo); tempo = setTimeout(()=>{ v.busca = ev.target.value; v.limite=100; desenharPainel(); const i=$('#i-busca'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); }, 250); };
  document.querySelectorAll('th[data-i]').forEach(th => th.onclick = () => { const i=+th.dataset.i; v.ordem = (v.ordem?.i===i) ? {i, asc:!v.ordem.asc} : {i, asc:true}; desenharPainel(); });
  document.querySelectorAll('tbody tr').forEach(tr => tr.onclick = () => abrirFicha(b.dados[+tr.dataset.r]));
  $('#b-mais') && ($('#b-mais').onclick = () => { v.limite += 200; desenharPainel(); });
}

function ligarCabPainel(){
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  $('#b-enviar') && ($('#b-enviar').onclick = () => escolherArquivo());
  $('#b-exportar') && ($('#b-exportar').onclick = abrirExportar);
}

const vazioParaTraco = x => (x === null || x === undefined || String(x).trim() === '') ? '(em branco)' : String(x).trim();

function linhasFiltradasSemGrupo(){
  const v = E.view, b = v.base;
  const q = normal(v.busca);
  return q ? b.dados.filter(r => r.some(c => normal(c).includes(q))) : b.dados;
}
function linhasVisiveis(){
  const v = E.view, b = v.base;
  let L = linhasFiltradasSemGrupo();
  if (v.filtro) { const i = b.colunas.indexOf(v.filtro.col); L = L.filter(r => vazioParaTraco(r[i]) === v.filtro.val); }
  if (v.ordem) {
    const i = v.ordem.i, s = v.ordem.asc ? 1 : -1;
    L = [...L].sort((a,c) => {
      const x=a[i], y=c[i];
      const nx = typeof x==='number'?x:parseFloat(String(x).replace(/\./g,'').replace(',','.'));
      const ny = typeof y==='number'?y:parseFloat(String(y).replace(/\./g,'').replace(',','.'));
      if (!isNaN(nx) && !isNaN(ny) && /^[\d.,\s-]+$/.test(String(x)) && /^[\d.,\s-]+$/.test(String(y))) return (nx-ny)*s;
      const dx = dataBR(x), dy = dataBR(y);
      if (dx && dy) return (dx-dy)*s;
      return String(x??'').localeCompare(String(y??''),'pt-BR')*s;
    });
  }
  return L;
}
function dataBR(s){ const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s||'')); return m ? new Date(+m[3], +m[2]-1, +m[1]).getTime() : null; }

function colunasAgrupaveis(colunas, dados){
  return colunas.filter((c,i) => {
    const set = new Set();
    for (const r of dados) { set.add(vazioParaTraco(r[i])); if (set.size > 80) return false; }
    return set.size >= 2 || dados.length < 3;
  });
}
function escolherAgrupamento(colunas, dados){
  const cand = colunasAgrupaveis(colunas, dados);
  const pref = ['departamento','setor','area','situacao','status','funcao','cargo','frente','tipo','motivo','unidade'];
  for (const p of pref) { const c = cand.find(x => normal(x).includes(p)); if (c) return c; }
  return cand[0] || colunas[0];
}
function kpisAutomaticos(b){
  // Destaques automáticos: a coluna de situação/status (se existir) mostra os 3 maiores grupos
  const i = b.colunas.findIndex(c => /situa|status/.test(normal(c)));
  if (i < 0) return [];
  const cont = {};
  b.dados.forEach(r => { const k = vazioParaTraco(r[i]); cont[k]=(cont[k]||0)+1; });
  return Object.entries(cont).sort((a,c)=>c[1]-a[1]).slice(0,3)
    .map(([val,n]) => ({ col:b.colunas[i], val, n, rotulo: val, sub: `${b.colunas[i]} · ${Math.round(n/b.dados.length*100)}%` }));
}

/* ---------- ficha individual ---------- */
function abrirFicha(r){
  const b = E.view.base;
  const iNome = b.colunas.findIndex(c => /^nome|colaborador|funcionario/.test(normal(c)));
  const titulo = iNome >= 0 ? r[iNome] : 'Ficha do registro';
  abrirModal({
    titulo, largo:true,
    corpo: `<div class="ficha">${b.colunas.map((c,i)=>`<div><small>${esc(c)}</small><span>${esc(r[i]) || '—'}</span></div>`).join('')}</div>`,
    pe: `<button class="btn borda" id="f-fechar">Fechar</button><button class="btn azul" id="f-pdf">Baixar ficha em PDF</button>`,
    aoAbrir: () => {
      $('#f-fechar').onclick = fecharModal;
      $('#f-pdf').onclick = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit:'pt', format:'a4' });
        cabecalhoPDF(doc, E.view.p.nome + ' — Ficha', titulo);
        doc.autoTable({ startY: 110, head:[['Campo','Informação']], body: b.colunas.map((c,i)=>[c, String(r[i]??'')]),
          styles:{ fontSize:9, cellPadding:4 }, headStyles:{ fillColor:[36,66,124] }, columnStyles:{0:{fontStyle:'bold',cellWidth:170}} });
        rodapePDF(doc);
        baixar(doc.output('blob'), `Ficha - ${String(titulo).slice(0,60)}.pdf`);
      };
    }
  });
}

/* ---------- exportar (Excel / PDF, escolhendo o que exportar) ---------- */
function abrirExportar(){
  const v = E.view, b = v.base, vis = linhasVisiveis();
  abrirModal({
    titulo: 'Exportar ' + v.p.nome,
    corpo: `
      <p style="margin-top:0;color:var(--mut)">Escolha quais linhas e quais colunas vão no arquivo.</p>
      <div class="campo"><label>Linhas</label>
        <select id="x-linhas">
          <option value="vis">O que estou vendo agora (${fmtNum(vis.length)}${v.filtro?` · ${esc(v.filtro.val)}`:''}${v.busca?' · com busca':''})</option>
          <option value="tudo">Todos os registros (${fmtNum(b.dados.length)})</option>
        </select></div>
      <div class="campo"><label>Colunas <button type="button" class="link" id="x-todas">marcar todas</button> · <button type="button" class="link" id="x-nenhuma">desmarcar todas</button></label>
        <div class="checks">${b.colunas.map((c,i)=>`<label><input type="checkbox" value="${i}" checked> ${esc(c)}</label>`).join('')}</div></div>`,
    pe: `<button class="btn borda" id="x-cancelar">Cancelar</button><button class="btn prim" id="x-xlsx">Excel</button><button class="btn azul" id="x-pdf">PDF</button>`,
    aoAbrir: m => {
      const marcadas = () => [...m.querySelectorAll('.checks input:checked')].map(x=>+x.value);
      $('#x-todas').onclick = () => m.querySelectorAll('.checks input').forEach(x=>x.checked=true);
      $('#x-nenhuma').onclick = () => m.querySelectorAll('.checks input').forEach(x=>x.checked=false);
      $('#x-cancelar').onclick = fecharModal;
      const pegar = () => {
        const cols = marcadas();
        if (!cols.length) { toast('Marque pelo menos uma coluna.', true); return null; }
        const L = $('#x-linhas').value === 'tudo' ? b.dados : vis;
        return { cols, cab: cols.map(i=>b.colunas[i]), corpo: L.map(r => cols.map(i => r[i] ?? '')) };
      };
      const nomeArq = () => `${v.p.nome}${v.filtro?' - '+v.filtro.val:''} - ${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}`;
      $('#x-xlsx').onclick = () => {
        const d = pegar(); if (!d) return;
        const ws = XLSX.utils.aoa_to_sheet([d.cab, ...d.corpo]);
        ws['!cols'] = d.cab.map(c => ({ wch: Math.min(40, Math.max(10, String(c).length + 2)) }));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Dados');
        const bin = XLSX.write(wb, { bookType:'xlsx', type:'array' });
        baixar(new Blob([bin], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nomeArq() + '.xlsx');
        registrar(v.p.id, 'exportou Excel', `${d.corpo.length} linhas`);
        fecharModal();
      };
      $('#x-pdf').onclick = () => {
        const d = pegar(); if (!d) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit:'pt', format:'a4', orientation: d.cab.length > 6 ? 'landscape' : 'portrait' });
        cabecalhoPDF(doc, v.p.nome, v.filtro ? `${v.filtro.col}: ${v.filtro.val}` : `${d.corpo.length} registros`);
        doc.autoTable({ startY:110, head:[d.cab], body:d.corpo.map(r=>r.map(x=>String(x))),
          styles:{ fontSize: d.cab.length > 10 ? 6.5 : 8, cellPadding:3, overflow:'linebreak' }, headStyles:{ fillColor:[36,66,124] },
          alternateRowStyles:{ fillColor:[242,244,249] } });
        rodapePDF(doc);
        baixar(doc.output('blob'), nomeArq() + '.pdf');
        registrar(v.p.id, 'exportou PDF', `${d.corpo.length} linhas`);
        fecharModal();
      };
    }
  });
}

function baixar(blob, nome){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome.replace(/[\\/:*?"<>|]/g, '-');
  document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
}

let LOGO_DATAURL = null;
function prepararLogo(){
  const img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width=img.width; c.height=img.height; c.getContext('2d').drawImage(img,0,0); LOGO_DATAURL = c.toDataURL('image/png'); };
  img.src = 'img/logo-crv.png';
}
function cabecalhoPDF(doc, titulo, sub){
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(16,33,63); doc.rect(0,0,w,80,'F');
  doc.setFillColor(46,138,87); doc.rect(0,80,w/3,4,'F');
  doc.setFillColor(233,162,59); doc.rect(w/3,80,w/3,4,'F');
  doc.setFillColor(212,87,63); doc.rect(2*w/3,80,w/3,4,'F');
  if (LOGO_DATAURL) { doc.setFillColor(255,255,255); doc.roundedRect(24,18,140,46,4,4,'F'); doc.addImage(LOGO_DATAURL,'PNG',30,22,128,38); }
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(15);
  doc.text(String(titulo), 184, 40);
  doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
  doc.text(`${sub || ''}  ·  Gestão de Pessoas CRV  ·  gerado em ${new Date().toLocaleString('pt-BR')}`, 184, 58);
  doc.setTextColor(20,33,61);
}
function rodapePDF(doc){
  const n = doc.getNumberOfPages(), w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
  for (let i=1;i<=n;i++){ doc.setPage(i); doc.setFontSize(8); doc.setTextColor(93,106,133);
    doc.text(`Documento interno · uso restrito do RH · por ${E.perfil.nome}`, 24, h-16); doc.text(`${i}/${n}`, w-40, h-16); }
}

/* ---------- enviar planilha ---------- */
function escolherArquivo(){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.xlsx,.xls,.xlsm,.csv';
  inp.onchange = () => inp.files[0] && lerPlanilha(inp.files[0]);
  inp.click();
}

async function lerPlanilha(arquivo){
  try {
    const buf = await arquivo.arrayBuffer();
    const wb = XLSX.read(buf, { type:'array', cellDates:true });
    const abas = wb.SheetNames.filter(n => { const ws = wb.Sheets[n]; return ws && ws['!ref']; });
    if (!abas.length) return toast('A planilha está vazia.', true);
    if (abas.length === 1) return prepararEnvio(arquivo.name, wb.Sheets[abas[0]], abas[0]);
    abrirModal({
      titulo: 'Qual aba da planilha?',
      corpo: `<p style="margin-top:0;color:var(--mut)">O arquivo <b>${esc(arquivo.name)}</b> tem ${abas.length} abas. Escolha a que tem a base deste painel.</p>
        <div class="checks">${abas.map(a=>`<label><input type="radio" name="aba" value="${esc(a)}"> ${esc(a)}</label>`).join('')}</div>`,
      pe: `<button class="btn borda" id="a-c">Cancelar</button><button class="btn prim" id="a-ok">Continuar</button>`,
      aoAbrir: m => {
        m.querySelector('input[name=aba]').checked = true;
        $('#a-c').onclick = fecharModal;
        $('#a-ok').onclick = () => { const a = m.querySelector('input[name=aba]:checked').value; fecharModal(); prepararEnvio(arquivo.name, wb.Sheets[a], a); };
      }
    });
  } catch(e){ toast('Não consegui ler esse arquivo: ' + e.message, true); }
}

function valorCelula(x){
  if (x instanceof Date) {
    if (isNaN(x)) return '';
    // corrige fuso: datas do Excel chegam à meia-noite UTC
    const d = new Date(x.getTime() + 12*3600*1000);
    return d.toLocaleDateString('pt-BR', { timeZone:'UTC' });
  }
  if (typeof x === 'number') return Math.round(x*100)/100;
  return String(x ?? '').trim();
}

function prepararEnvio(nomeArquivo, ws, aba){
  const bruto = XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:'', blankrows:false });
  if (!bruto.length) return toast('A aba escolhida está vazia.', true);
  // linha de cabeçalho = a que tem mais textos preenchidos entre as 20 primeiras
  let iCab = 0, melhor = -1;
  bruto.slice(0,20).forEach((r,i) => { const n = r.filter(c => typeof c === 'string' && c.trim()).length; if (n > melhor) { melhor = n; iCab = i; } });
  const cabBruto = bruto[iCab].map(c => String(valorCelula(c)));
  const usados = {};
  let colunas = cabBruto.map((c,i) => { let n = c || `Coluna ${i+1}`; if (usados[n]) n = `${n} (${++usados[n]})`; else usados[n] = 1; return n; });
  let dados = bruto.slice(iCab+1).map(r => colunas.map((_,i) => valorCelula(r[i])))
    .filter(r => r.some(c => c !== '' && c !== null));
  // remove colunas totalmente vazias
  const manter = colunas.map((c,i) => dados.some(r => r[i] !== '' ) || !/^Coluna \d+$/.test(c));
  colunas = colunas.filter((_,i)=>manter[i]);
  dados = dados.map(r => r.filter((_,i)=>manter[i]));
  if (!dados.length) return toast('Não encontrei linhas de dados abaixo do cabeçalho.', true);

  const p = E.view.p;
  const atual = E.view.base;
  const kb = Math.round(JSON.stringify(dados).length/1024);
  abrirModal({
    titulo: 'Conferir antes de salvar', largo:true,
    corpo: `<div class="ok">Li <b>${fmtNum(dados.length)} linhas</b> e <b>${colunas.length} colunas</b> da aba "${esc(aba)}" (${esc(nomeArquivo)}).</div>
      ${atual ? `<p style="color:var(--mut)">A base atual tem ${fmtNum(atual.linhas)} linhas e será <b>substituída</b> por esta.</p>` : ''}
      <p style="margin:8px 0 6px;font-weight:600">Primeiras linhas:</p>
      <div class="tabela-env" style="max-height:280px"><table class="tab"><thead><tr>${colunas.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${dados.slice(0,8).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      ${kb > 5000 ? `<div class="erro" style="margin-top:12px">Arquivo grande (${fmtNum(kb)} KB). Pode demorar para salvar.</div>` : ''}`,
    pe: `<button class="btn borda" id="e-c">Cancelar</button><button class="btn prim" id="e-ok">Salvar no app</button>`,
    aoAbrir: () => {
      $('#e-c').onclick = fecharModal;
      $('#e-ok').onclick = async () => {
        const bt = $('#e-ok'); bt.disabled = true; bt.textContent = 'Salvando...';
        const reg = { painel:p.id, arquivo:nomeArquivo, colunas, dados, linhas:dados.length,
          atualizado_em:new Date().toISOString(), atualizado_por:E.perfil.nome };
        const { error } = await sb.from('bases').upsert(reg);
        if (error) { bt.disabled=false; bt.textContent='Salvar no app'; return toast(traduzErro(error), true); }
        registrar(p.id, 'atualizou a base', `${nomeArquivo} · ${dados.length} linhas`);
        fecharModal(); toast('Base atualizada. Todos com acesso já veem os dados novos.');
        E.metas[p.id] = { painel:p.id, arquivo:nomeArquivo, linhas:dados.length, atualizado_em:reg.atualizado_em, atualizado_por:reg.atualizado_por };
        E.view.base = reg; E.view.filtro = null; E.view.agrupar = escolherAgrupamento(colunas, dados);
        desenharPainel();
      };
    }
  });
}

async function registrar(painel, acao, detalhe){
  try { await sb.from('historico').insert({ painel, acao, detalhe, usuario: E.perfil?.nome }); } catch(_){}
}

/* =====================================================================
   PAINÉIS COMPLETOS (mesmo visual dos painéis do Claude)
   O código do painel fica no GitHub (sem dados). Os dados ficam no
   Supabase, protegidos, e são juntados só na hora de abrir.
   ===================================================================== */
const MODELOS_LISTA = ['quadro','admissoes','rescisoes','experiencia','fat','curriculos','perfil','absenteismo','absenteismo-gestao',
  'ferias','sancoes','sysprocard','unimed','uniodonto','farmacia','jovem','renapsi','treinamentos','crachas','pesquisas','lideres',
  'conexao','rd','fadiga','processos','ouvidorias','recepcao','alojamentos','onibus','gratificacao'];
const MODELOS = Object.fromEntries(MODELOS_LISTA.map(id => [id, `paineis/${id}.html`]));
// painéis que usam o mesmo arquivo de painel
['cartao-alimentacao','cartao-convenio','cartao-premium'].forEach(id => MODELOS[id] = 'paineis/cartoes.html');
MODELOS['cartao-adm'] = 'paineis/cartao-adm.html';
// recursos que dependem do Claude e não funcionam no app
const AVISOS = { curriculos: 'Recrutamento e Seleção fica aqui dentro, no quadro "Recrutamento e Seleção". A leitura automática de currículos por IA só funciona dentro do Claude; aqui você consulta, cadastra e acompanha.' };

const fmtRef = r => r ? r.split('-').reverse().join('/') : '—';

async function telaModelo(p, cfg, acao){
  const editar = podeEditar(p);
  moldura(`<div id="modelo-area" class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Abrindo o painel…</p></div>`);
  const meta = { set innerHTML(v){}, set textContent(v){} };   // informações do painel ficam só em Administração
  const [pac, tpl] = await Promise.all([
    sb.from('pacotes').select('referencia,conteudo,atualizado_em,atualizado_por').eq('painel', p.id).maybeSingle(),
    fetch(MODELOS[p.id] + '?v=' + CFG.VERSAO, { cache:'no-cache' }).then(r => r.ok ? r.text() : Promise.reject(new Error('Arquivo do painel não encontrado no GitHub (' + MODELOS[p.id] + ').'))).catch(e => ({ erro:e }))
  ]);
  const area = $('#modelo-area');
  if (!area) return;
  if (pac.error) { area.innerHTML = `<div class="erro">${esc(traduzErro(pac.error))}</div>`; return; }
  if (tpl.erro) { area.innerHTML = `<div class="erro">${esc(tpl.erro.message)}</div>`; return; }
  const d = pac.data;
  if (!d) {
    area.innerHTML = `${svg('planilha')}<h3>${esc(p.nome)}: ainda sem dados</h3>
      <p>${ehAdmin() ? 'Carregue o arquivo de dados em <b>Administração → Painéis e frentes</b>.' : 'O RH ainda não carregou os dados deste painel.'}</p>`;
    return;
  }
  if (d.conteudo && d.conteudo.arquivo) {
    try { d.conteudo = await lerArquivoPacote(p.id, d.conteudo.arquivo); }
    catch(_) { area.innerHTML = `<div class="erro">Não consegui abrir os dados deste painel. Carregue o arquivo de dados de novo em Administração.</div>`; return; }
  }
  try {
    // ponte: o que o painel pedir ao "Claude" (salvar anotações, baixar arquivos...) vem para o app
    window.CRV_QUEM = E.perfil.nome;
    window.__CRV_PAINEL = window.CRV_PONTE.criar({ sb, painel: p.id, perfil: () => E.perfil, quem: () => E.perfil.nome,
      podeEditar: () => podeEditar(p), ehAdmin: () => ehAdmin() });
    let novos = [];
    if (PAINEIS_COM_NOVOS.includes(p.id)) {
      const r = await sb.from('registros').select('doc_id,dados').eq('painel', p.id).eq('colecao', COLECAO_NOVOS[p.id] || 'novos').range(0, 4999);
      if (!r.error) novos = (r.data || []).filter(x => x.dados && !x.dados.excluida).map(x => ({ _id: x.doc_id, dados: x.dados }));
    }
    window.CRV_RECARREGAR = () => { if (location.hash.startsWith('#/p/' + encodeURIComponent(p.id))) telaPainel(p.id); };
    const html = montarModelo(tpl, d.conteudo, d.referencia, p, novos);
    const url = URL.createObjectURL(new Blob([html], { type:'text/html' }));
    area.className = 'modelo-area';
    area.innerHTML = `<iframe id="modelo-frame" title="${esc(p.nome)}" src="${url}"></iframe>`;
    E.painelAberto = p.id;
    $('#modelo-frame').onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      if (acao) setTimeout(() => {
        executarAcao(acao);
        // tira a ação do endereço para o F5 não reabrir a janela
        try { history.replaceState(null, '', '#/p/' + encodeURIComponent(p.id)); } catch(_){}
      }, 150);
    };
  } catch(e){ area.innerHTML = `<div class="erro">Não consegui montar o painel: ${esc(e.message)}</div>`; }
}

async function lerArquivoPacote(painel, arquivo){
  const { data: arq, error: ea } = await sb.storage.from('arquivos').download(`${painel}/${arquivo}`);
  if (ea || !arq) throw new Error('arquivo');
  const texto = arquivo.endsWith('.gz')
    ? await new Response(arq.stream().pipeThrough(new DecompressionStream('gzip'))).text()
    : await arq.text();
  return JSON.parse(texto);
}

/* Base de colaboradores tirada do Quadro Geral (usada pelas autorizações de desconto).
   Retorna { 'matrícula': {nome, funcao, setor, situacao, admissao, deslig, empresa} } */
let _quadroBase = null, _quadroBaseRef = null;
window.CRV_QUADRO = async function(){
  try {
    const { data: d, error } = await sb.from('pacotes').select('referencia,conteudo,atualizado_em').eq('painel', 'quadro').maybeSingle();
    if (error || !d) return null;
    const chave = d.atualizado_em || d.referencia;
    if (_quadroBase && _quadroBaseRef === chave) return _quadroBase;
    let c = d.conteudo;
    if (c && c.arquivo) c = await lerArquivoPacote('quadro', c.arquivo);
    let dados = c && c.dados;
    if (Array.isArray(dados) && Array.isArray(c.nomes)) { const o = {}; c.nomes.forEach((n, i) => o[n] = dados[i]); dados = o; }
    if (!dados || !Array.isArray(dados.D)) return null;
    const M = {};
    const txt = v => String(v == null ? '' : v).trim();
    // só a empresa 5 (CRV); entre desligados, o desligamento mais recente vence
    const DM = (dados.DM || []).filter(r => /\(5\)\s*$/.test(String(r[21] || '')) || /^CRV\b/i.test(String(r[21] || '')))
      .sort((a, b) => String(a[20] || '') < String(b[20] || '') ? -1 : 1);
    DM.forEach(r => { M[txt(r[0])] = { nome:txt(r[1]), funcao:txt(r[2]), setor:txt(r[3]), situacao:'Desligado', vinculo:txt(r[7]), gerencia:txt(r[6]), cnh:txt(r[17]), admissao:txt(r[9]), deslig:txt(r[20]), empresa:txt(r[21]).replace(/\s*\(\d+\)$/, '') }; });
    const XX = Array.isArray(dados.X) && dados.X.length === dados.D.length ? dados.X : null;
    dados.D.forEach((r, i) => { M[txt(r[0])] = { cpf: XX ? txt(XX[i][11]) : '', nome:txt(r[1]), funcao:txt(r[2]), setor:txt(r[3]), situacao:txt(r[8]) || 'Ativo', vinculo:txt(r[7]), gerencia:txt(r[6]), cnh:txt(r[17]), admissao:txt(r[9]), deslig:'', empresa:'CRV' }; });
    _quadroBase = { mapa:M, referencia:d.referencia || '' }; _quadroBaseRef = chave;
    return _quadroBase;
  } catch(_) { return null; }
};

/* dados de outro painel (para o histórico do colaborador no Quadro) */
const _pacCache = {};
window.CRV_DADOS = async function(painel){
  try {
    const { data: d, error } = await sb.from('pacotes').select('referencia,conteudo,atualizado_em').eq('painel', painel).maybeSingle();
    if (error || !d) return null;
    const chave = d.atualizado_em || d.referencia;
    if (_pacCache[painel] && _pacCache[painel].k === chave) return _pacCache[painel].v;
    let c = d.conteudo;
    if (c && c.arquivo) c = await lerArquivoPacote(painel, c.arquivo);
    const o = {};
    if (c && c.blocos) c.blocos.forEach(b => (b.itens || []).forEach(i => { o[i.nome] = i.valor; }));
    else if (c && c.dados) { if (Array.isArray(c.dados) && Array.isArray(c.nomes)) c.nomes.forEach((n, i) => o[n] = c.dados[i]); else Object.assign(o, c.dados); }
    const v = { dados:o, referencia:d.referencia || '' };
    _pacCache[painel] = { k:chave, v };
    return v;
  } catch(_) { return null; }
};
window.CRV_REGS = async function(painel, colecao){
  try {
    const r = await sb.from('registros').select('doc_id,dados').eq('painel', painel).eq('colecao', colecao).range(0, 4999);
    return r.error ? [] : (r.data || []).map(x => Object.assign({ _id:x.doc_id }, x.dados || {}));
  } catch(_) { return []; }
};
/* sanções (planilha + emitidas no app) e RD de uma matrícula */
window.CRV_HIST_COLAB = async function(mat){
  mat = String(mat || '').trim().replace(/^0+(?=\d)/, '');
  const mm = v => String(v == null ? '' : v).trim().replace(/^0+(?=\d)/, '');
  const out = { sanc:[], rd:[], refS:'', refR:'' };
  const [S, SD, R, RN] = await Promise.all([window.CRV_DADOS('sancoes'), window.CRV_REGS('sancoes', 'documentos'), window.CRV_DADOS('rd'), window.CRV_REGS('rd', 'novos')]);
  try {
    const DB = S && S.dados.DB;
    if (DB && Array.isArray(DB.R)) {
      out.refS = S.referencia;
      DB.R.forEach(r => { if (mm(r[1]) !== mat) return;
        out.sanc.push({ data:r[2], t:r[0] ? 'sus' : 'adv', sq:r[3], dias:r[0] ? r[5] : null, ini:r[6] || '', fim:r[7] || '', assunto:'', motivo:DB.M[r[4]] || '', cat:(DB.CATS || [])[(DB.MC || [])[r[4]]] || '', app:false }); });
    }
  } catch(_){}
  (SD || []).forEach(d => { if (d.excluido || mm(d.mat) !== mat || !d.data) return;
    out.sanc.push({ data:d.data, t:d.tipo, sq:null, dias:d.tipo === 'sus' ? (parseInt(d.dias, 10) || null) : null, ini:d.tipo === 'sus' ? d.ini || '' : '', fim:d.tipo === 'sus' ? d.fim || '' : '',
      assunto:d.assunto || d.oAss || '', motivo:String(d.desc || d.obj || '').replace(/\*\*/g, ''), cat:'', app:true, junto:!!d.junto && d.tipo !== 'ori' }); });
  out.sanc.sort((a, b) => String(a.data).localeCompare(String(b.data)));
  const mx = { adv:0, sus:0 };
  out.sanc.forEach(x => { if (x.t === 'ori') return; if (x.sq == null) x.sq = (mx[x.t] || 0) + 1; mx[x.t] = Math.max(mx[x.t] || 0, +x.sq || 0); });
  out.sanc.reverse();
  try {
    const D = R && R.dados.D;
    if (D && Array.isArray(D.rows)) {
      out.refR = R.referencia;
      D.rows.forEach(r => { if (mm(r[2]) !== mat) return; out.rd.push({ rd:r[0], data:r[1], acao:r[10] || '', val:r[11], obs:r[14] || '', fato:'' }); });
    }
  } catch(_){}
  (RN || []).forEach(d => { if (d.excluida || mm(d.mat) !== mat) return; out.rd.push({ rd:d.rd, data:d.data, acao:d.acao || '', val:d.val, obs:d.obs || '', fato:d.fato || '' }); });
  out.rd.sort((a, b) => String(b.data).localeCompare(String(a.data)));
  return out;
};

function jsValor(v){
  // JSON seguro dentro de <script>, restaurando NaN / Infinity / undefined
  return JSON.stringify(v).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')
    .replace(/\{"\$crv":"(NaN|Infinity|-Infinity|undefined)"\}/g, '$1');
}

// cores da capa por frente (tons escuros, para o texto branco continuar legível)
const CAPA = {
  'Quadro e movimentação':         ['#0b3a47','#15647d'],
  'Atração e perfil':              ['#0d4747','#1b7470'],
  'Frequência e férias':           ['#4a300b','#80561a'],
  'Jovem Aprendiz':                ['#2f1f5a','#53398f'],
  'Treinamento e liderança':       ['#5a2317','#94432b'],
  'Ocorrências, risco e jurídico': ['#4a1420','#7c2536'],
  'Atendimento':                   ['#283a4b','#40607b'],
  'RH externo':                    ['#363c18','#5d6427']
};
// como cada painel azul pinta a capa (os demais já têm cor própria: Unimed, Uniodonto, Sanções, Sysprocard…)
const CAPA_MODO = {
  vars:  ['absenteismo','absenteismo-gestao','admissoes','jovem','processos','quadro','rd','rescisoes'],
  band:  ['alojamentos','ferias','recepcao'],
  hd:    ['experiencia','ouvidorias'],
  hero:  ['curriculos'],
  top:   ['crachas','treinamentos','conexao'],
  header:['perfil','lideres']
};
function cssCapa(p){
  const c = p && CAPA[p.frente]; if (!c) return '';
  const [a, b] = c, g = `linear-gradient(120deg,${a},${b})`, m = Object.keys(CAPA_MODO).find(k => CAPA_MODO[k].includes(p.id));
  if (!m) return '';
  const r = { vars:`:root,body{--hd1:${a}!important;--hd2:${b}!important}`,
              band:`:root,body{--band:${a}!important;--band-2:${b}!important}`,
              hd:`:root,body{--hd:${a}!important}header{background:${g}!important}`,
              hero:`:root,body{--hero:${a}!important;--hero-2:${b}!important}`,
              top:`.top{background:${g}!important}`,
              header:`body>header,header{background:${g}!important}` }[m];
  return `<style id="crv-capa">${r}</style>`;
}

const PAINEIS_COM_NOVOS = ['rd', 'fadiga', 'treinamentos', 'sancoes'];
const COLECAO_NOVOS = { sancoes:'documentos' };
function montarModelo(tpl, conteudo, referencia, p, novos){
  const nomeOk = n => /^[A-Za-z_$][\w$]*$/.test(n);
  const base = location.href.split('#')[0].replace(/[^/]*$/, '');
  let html = tpl.split('__CRV_REFBR__').join(fmtRef(referencia)).split('__CRV_BASE__').join(base);
  const ponte = `<script>${window.CRV_PONTE.scriptPainel()}<\/script>` + (novos ? `<script>window.CRV_NOVOS=${jsValor(novos)};<\/script>` : '');
  // visual compacto: capa mais baixa e títulos menores em todos os painéis
  const compacto = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;500;600;700&display=swap">
  <style id="crv-padrao">
    /* padrão visual do app: IBM Plex Sans Condensed em todos os painéis, letras ~10% menores */
    :root{--f-body:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;--f-disp:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;--f-display:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;
      --display:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;--font-display:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;--font-body:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;
      --body:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;--font:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;--f-head:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;
      --f-mono:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;--font-mono:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important}
    html{zoom:.9}
    body{font-family:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif!important;font-variant-numeric:tabular-nums;letter-spacing:0!important;-webkit-font-smoothing:antialiased}
    body h1,body h2,body h3,body .ttl,body .eyebrow{letter-spacing:-.005em!important;font-stretch:100%!important}
    body h2{font-size:17px!important}
    body h3{font-size:14.5px!important}
  </style>
  <style id="crv-impressao">@page{@bottom-left{content:"Gestão de Pessoas · CRV Industrial";font:7pt sans-serif;color:#5d6a85}@bottom-right{content:"Emitido em ${new Date().toLocaleDateString('pt-BR')}";font:7pt sans-serif;color:#5d6a85}}</style>
  <style id="crv-compacto">
    body h1{font-size:20px!important;line-height:1.2!important;margin-top:0!important}
    body h1 small{font-size:12px!important}
    body>header,body>.top,body>.hero,body>.head,body>.band,header.top,.hero,.head,.band,.top{padding-top:12px!important;min-height:0!important}
    header img,.top img,.hero img,.head img,.band img,.brand img,.logo-card img,img.logo{max-height:44px!important;width:auto!important}
    .logo-card{padding:6px 10px!important}
    .eyebrow,.kicker,.sup,.over{font-size:10.5px!important;margin-bottom:2px!important}
    .ttl p,.hero p,.top p.lead,.top .sub,.hero .sub{font-size:13px!important;margin-top:2px!important}
  </style>`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + ponte) : ponte + html;
  const capa = cssCapa(p);
  html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, m => compacto + capa + m) : html + compacto + capa;

  if (conteudo && conteudo.blocos) {               // formato 2: vários blocos por script
    for (const b of conteudo.blocos) {
      if (b.tipo === 'json') { html = html.replace(`/*__CRV_JSON_${b.script}__*/`, () => b.texto.replace(/<\/script/gi, '<\\/script')); continue; }
      const js = b.itens.filter(i => nomeOk(i.nome)).map(i => {
        const k = ['const','let','var'].includes(i.kind) ? i.kind : 'const';
        return i.ctor ? `${k} ${i.nome}=new ${i.ctor === 'Set' ? 'Set' : 'Map'}(${jsValor(i.valor)});` : `${k} ${i.nome}=${jsValor(i.valor)};`;
      }).join('\n');
      html = html.replace(`/*__CRV_DADOS_${b.script}__*/`, () => js);
    }
    return html;
  }
  // formato 1 (Quadro Geral)
  const nomes = (conteudo.nomes || Object.keys(conteudo.dados || {})).filter(n => /^[A-Z][A-Z0-9_]*$/.test(n));
  const js = [`const CRV_REF=${jsValor(referencia)};`, ...nomes.map(n => `const ${n}=${jsValor(conteudo.dados[n])};`)].join('\n');
  if (!html.includes('/*__CRV_DADOS__*/')) throw new Error('arquivo do painel sem o ponto de dados');
  return html.replace('/*__CRV_DADOS__*/', () => js);
}

/* ---------- carregar arquivos de dados (um ou vários de uma vez) ---------- */
function escolherPacotes(esperado){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.multiple = !esperado; inp.accept = '.json,.zip,application/json,application/zip';
  inp.onchange = () => inp.files.length && carregarPacotes([...inp.files], esperado);
  inp.click();
}

async function lerPacote(f){
  let pac;
  try { pac = JSON.parse(await f.text()); } catch(_) { throw new Error('não é um arquivo de dados do app'); }
  if (pac.tipo === 'crv-estabilidade' && Array.isArray(pac.itens)) return { estab:true, painel:'quadro', referencia: pac.gerado || '', itens: pac.itens };
  if (pac.tipo !== 'crv-pacote' || !(pac.dados || pac.blocos)) throw new Error('não é um arquivo de dados do app');
  return pac;
}

// lista de estabilidade (Quadro Geral): entra como registros do painel, sem mexer nos dados do Quadro
async function salvarEstabilidade(itens){
  const quem = E.perfil ? E.perfil.nome : '';
  const linhas = itens.map(it => { const id = (it.tipo + '-' + it.mat + '-' + (it.fim || it.detalhe || '')).replace(/[^\w-]+/g, '_').slice(0, 90);
    return { painel:'quadro', caminho:'estabilidade/' + id, colecao:'estabilidade', doc_id:id, dados:{ ...it, cadastradoEm:new Date().toISOString(), cadastradoPor:quem + ' (lista)' }, atualizado_por:quem }; });
  for (let i = 0; i < linhas.length; i += 100) {
    const { error } = await sb.from('registros').upsert(linhas.slice(i, i + 100), { onConflict:'painel,caminho', ignoreDuplicates:true });
    if (error) throw error;
  }
  return linhas.length;
}
async function carregarPacotes(arquivos, esperado){
  const itens = [];
  for (const f of arquivos) {
    if (/\.zip$/i.test(f.name)) { itens.push({ f, zip:true, painel: esperado || null }); continue; }
    try { const pac = await lerPacote(f); itens.push({ f, pac, painel: pac.painel }); }
    catch(e){ itens.push({ f, erro: e.message }); }
  }
  for (const it of itens) {
    if (it.erro) continue;
    const p = E.paineis.find(x => x.id === it.painel);
    if (it.zip) { if (!it.painel) it.painel = 'curriculos'; continue; }
    if (!p) it.erro = `painel "${it.painel}" não existe no app`;
    else if (esperado && it.painel !== esperado) it.erro = `este arquivo é do painel "${p.nome}"`;
    else if (!podeEditar(p)) it.erro = 'sem permissão para este painel';
  }
  const validos = itens.filter(i => !i.erro);
  const nomeP = id => E.paineis.find(x => x.id === id)?.nome || id;
  abrirModal({
    titulo: validos.length > 1 ? `Carregar ${validos.length} arquivos de dados` : 'Atualizar dados',
    largo: itens.length > 1,
    corpo: `<p style="margin-top:0;color:var(--mut)">Os dados atuais de cada painel serão substituídos pela versão do arquivo. As anotações feitas no app (avaliações, programações, fichas…) <b>são mantidas</b>.</p>
      <div class="tabela-env" style="max-height:340px"><table class="tab"><thead><tr><th>Arquivo</th><th>Painel</th><th>Dados de</th><th>Situação</th></tr></thead><tbody>
      ${itens.map((i, n) => `<tr style="cursor:default"><td>${esc(i.f.name)}</td><td>${esc(i.painel ? nomeP(i.painel) : '—')}</td>
        <td>${i.pac ? (i.pac.estab ? 'lista de estabilidade (' + i.pac.itens.length + ')' : fmtRef(i.pac.referencia)) : (i.zip ? 'arquivos' : '—')}</td>
        <td id="pk-st-${n}">${i.erro ? `<span style="color:var(--coral)">${esc(i.erro)}</span>` : 'pronto'}</td></tr>`).join('')}
      </tbody></table></div>`,
    pe: `<button class="btn borda" id="pk-c">Cancelar</button><button class="btn prim" id="pk-ok" ${validos.length ? '' : 'disabled'}>Salvar no app</button>`,
    aoAbrir: () => {
      $('#pk-c').onclick = fecharModal;
      $('#pk-ok').onclick = async () => {
        const bt = $('#pk-ok'); bt.disabled = true; $('#pk-c').disabled = true;
        let ok = 0;
        for (const [n, i] of itens.entries()) {
          if (i.erro) continue;
          const st = $('#pk-st-' + n);
          st.textContent = 'enviando…';
          try {
            if (i.zip) { const q = await enviarZip(i.f, i.painel, t => st.textContent = t); st.innerHTML = `<span style="color:var(--cane)">✓ ${q} arquivos</span>`; ok++; continue; }
            if (i.pac.estab) { const n2 = await salvarEstabilidade(i.pac.itens); st.innerHTML = `<span style="color:var(--cane)">✓ ${n2} de estabilidade</span>`; ok++; continue; }
            await salvarPacote(i.pac, i.f, t => st.textContent = t);
            st.innerHTML = '<span style="color:var(--cane)">✓ salvo</span>'; ok++;
          } catch(e){ console.error(e); st.innerHTML = `<span style="color:var(--coral)">${esc(traduzErro(e))}<br><small>${esc((e && (e.message || e.error || e.statusCode)) || String(e))}</small></span>`; }
        }
        bt.textContent = 'Concluído'; $('#pk-c').disabled = false; $('#pk-c').textContent = 'Fechar';
        $('#pk-c').onclick = () => { fecharModal(); rota(); };
        toast(`${ok} de ${validos.length} carregados.`);
        await carregarCatalogo();
      };
    }
  });
}

async function salvarPacote(pac, f, progresso){
  const kb = Math.round(f.size/1024);
  let conteudo = pac.blocos ? { blocos: pac.blocos } : { nomes: pac.nomes, dados: pac.dados };
  if (kb > 1500) {
    // arquivo grande: guarda o conteúdo como arquivo protegido (o banco recusa registros muito grandes)
    progresso && progresso(`enviando ${fmtNum(kb)} KB…`);
    // compacta antes de enviar (12 MB viram ~1-2 MB)
    let blob = new Blob([JSON.stringify(conteudo)], { type:'application/json' });
    let nome = '_dados.json';
    if (window.CompressionStream) {
      blob = await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob();
      nome = '_dados.json.gz';
    }
    progresso && progresso(`enviando ${fmtNum(Math.round(blob.size/1024))} KB…`);
    const { error: e0 } = await sb.storage.from('arquivos').upload(`${pac.painel}/${nome}`, blob, { contentType:'application/octet-stream', upsert:true });
    if (e0) throw new Error('Envio do arquivo: ' + (e0.message || e0.error || JSON.stringify(e0)));
    conteudo = { arquivo: nome };
  }
  const reg = { painel:pac.painel, referencia:pac.referencia, conteudo, tamanho_kb:kb, atualizado_em:new Date().toISOString(), atualizado_por:E.perfil.nome };
  progresso && progresso('salvando…');
  const { error } = await sb.from('pacotes').upsert(reg);
  if (error) throw new Error('Registro do painel: ' + (error.message || JSON.stringify(error)));
  // anotações que vieram do Claude: entram só se ainda não existirem no app (nunca sobrescreve o que já foi feito aqui)
  const regs = pac.registros || [];
  let lote = [], tam = 0, feitos = 0;
  const enviar = async () => {
    if (!lote.length) return;
    const { error: e2 } = await sb.from('registros').upsert(lote, { onConflict:'painel,caminho', ignoreDuplicates:true });
    if (e2) throw e2;
    feitos += lote.length; lote = []; tam = 0;
    progresso && progresso(`anotações ${feitos}/${regs.length}…`);
  };
  for (const r of regs) {
    const item = { painel:pac.painel, caminho:r.caminho, colecao:r.colecao, doc_id:r.doc_id, dados:r.dados, atualizado_por:'Importado do Claude' };
    const t = JSON.stringify(r.dados).length;
    if (lote.length && (tam + t > 400000 || lote.length >= 100)) await enviar();
    lote.push(item); tam += t;
  }
  await enviar();
  registrar(pac.painel, 'atualizou os dados', `${f.name} · dados de ${fmtRef(pac.referencia)}${regs.length ? ` · ${regs.length} anotações` : ''}`);
}

async function enviarZip(f, painel, progresso){
  if (!window.JSZip) await new Promise((ok, falha) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload = ok; s.onerror = () => falha(new Error('não consegui abrir o .zip')); document.head.appendChild(s); });
  const zip = await JSZip.loadAsync(f);
  const nomes = Object.keys(zip.files).filter(n => !zip.files[n].dir);
  let q = 0;
  for (const n of nomes) {
    const id = n.split('/').pop().replace(/\.[^.]+$/, '');
    if (!/^[0-9a-f]{32}$/.test(id)) continue;
    const blob = await zip.files[n].async('blob');
    const tipo = /\.pdf$/i.test(n) ? 'application/pdf' : /\.png$/i.test(n) ? 'image/png' : /\.jpe?g$/i.test(n) ? 'image/jpeg' : /\.docx$/i.test(n) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream';
    const { error } = await sb.storage.from('arquivos').upload(`${painel}/${id}`, blob, { contentType: tipo, upsert: true });
    if (error) throw error;
    q++; progresso && progresso(`arquivos ${q}/${nomes.length}…`);
  }
  registrar(painel, 'enviou arquivos', `${f.name} · ${q} arquivos`);
  return q;
}

/* =====================================================================
   ADMINISTRAÇÃO
   ===================================================================== */
let abaAdmin = 'usuarios';
async function telaAdmin(){
  moldura(`<div class="trilha"><button data-ir="#/">Início</button> › <b>Administração</b></div>
    <div class="abas">
      <button class="aba ${abaAdmin==='usuarios'?'ativa':''}" data-aba="usuarios">Usuários e acessos</button>
      <button class="aba ${abaAdmin==='paineis'?'ativa':''}" data-aba="paineis">Painéis e frentes</button>
      <button class="aba ${abaAdmin==='historico'?'ativa':''}" data-aba="historico">Histórico</button>
    </div><div id="admin-corpo" class="cartao"><div class="spinner" style="margin:20px auto"></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => { abaAdmin = b.dataset.aba; telaAdmin(); });
  if (abaAdmin === 'usuarios') return adminUsuarios();
  if (abaAdmin === 'paineis') return adminPaineis();
  return adminHistorico();
}

const frentesExistentes = () => [...new Set(E.paineis.map(p=>p.frente))].sort((a,b)=>(ORDEM_FRENTES.indexOf(a)+1||99)-(ORDEM_FRENTES.indexOf(b)+1||99));

async function adminUsuarios(){
  const { data, error } = await sb.from('perfis').select('*').order('nome');
  const c = $('#admin-corpo');
  if (error) { c.innerHTML = `<div class="erro">${esc(traduzErro(error))}</div>`; return; }
  c.innerHTML = `<div class="cartao-cab"><h3>${data.length} usuário(s)</h3><button class="btn prim" id="u-novo">+ Novo usuário</button></div>
    <p style="color:var(--mut);margin-top:0;font-size:13px"><b>Administrador</b> vê e mexe em tudo · <b>Editor</b> vê e atualiza as frentes liberadas · <b>Leitor</b> só consulta as frentes liberadas. Painéis <span class="selo restrito">restrito</span> são só de administradores.</p>
    ${data.map((u,i)=>`<div class="linha-u ${u.ativo?'':'inativo'}">
      <div class="av" style="background:${PALETA[i%PALETA.length]}">${esc(iniciais(u.nome))}</div>
      <div class="info"><b>${esc(u.nome)}</b> ${u.ativo?'':'<small>(desativado)</small>'}<br><small>@${esc(u.usuario)} · ${esc(nomePapel(u.papel))}${u.papel==='admin'?' · todas as frentes':` · ${u.frentes?.length ? esc(u.frentes.join(', ')) : 'nenhuma frente liberada'}`}</small></div>
      <button class="btn peq borda" data-edit="${esc(u.user_id)}">Editar</button>
      <button class="btn peq borda" data-senha="${esc(u.user_id)}">Nova senha</button>
    </div>`).join('')}`;
  $('#u-novo').onclick = () => formUsuario(null, data);
  c.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formUsuario(data.find(u=>u.user_id===b.dataset.edit), data));
  c.querySelectorAll('[data-senha]').forEach(b => b.onclick = () => formSenha(data.find(u=>u.user_id===b.dataset.senha)));
}

function formUsuario(u, todos){
  const novo = !u;
  const frentes = frentesExistentes();
  abrirModal({
    titulo: novo ? 'Novo usuário' : 'Editar ' + u.nome,
    corpo: `<div id="u-msg"></div>
      <div class="campo"><label>Nome completo</label><input id="u-nome" value="${esc(u?.nome||'')}" required></div>
      ${novo ? `<div class="campo"><label>Usuário (para entrar no app)</label><input id="u-user" autocapitalize="none" spellcheck="false" placeholder="ex.: maria.silva"><small style="color:var(--mut)">Sem espaços e sem acentos. A pessoa não precisa ter e-mail.</small></div>
      <div class="campo"><label>Senha inicial</label><input id="u-senha" type="text" minlength="6" placeholder="mínimo 6 caracteres"><small style="color:var(--mut)">Passe a senha para a pessoa. Ela pode trocar depois em "Minha conta".</small></div>` : `<p style="color:var(--mut);margin-top:0">Usuário: <b>@${esc(u.usuario)}</b></p>`}
      <div class="campo"><label>Perfil</label><select id="u-papel">
        ${['leitor','editor','admin'].map(p=>`<option value="${p}" ${(u?.papel||'leitor')===p?'selected':''}>${nomePapel(p)}</option>`).join('')}</select></div>
      <div class="campo" id="u-frentes-box"><label>Frentes liberadas</label>
        <div class="checks">${frentes.map(f=>`<label><input type="checkbox" value="${esc(f)}" ${(u?.frentes||[]).includes(f)?'checked':''}> ${esc(f)}</label>`).join('')}</div></div>
      ${!novo ? `<div class="campo"><label><input type="checkbox" id="u-ativo" ${u.ativo?'checked':''}> Usuário ativo (desmarque para bloquear o acesso)</label></div>` : ''}`,
    pe: `<button class="btn borda" id="u-c">Cancelar</button><button class="btn prim" id="u-ok">${novo?'Criar usuário':'Salvar'}</button>`,
    aoAbrir: m => {
      const atualizaFrentes = () => $('#u-frentes-box').classList.toggle('oculto', $('#u-papel').value === 'admin');
      $('#u-papel').onchange = atualizaFrentes; atualizaFrentes();
      $('#u-c').onclick = fecharModal;
      $('#u-ok').onclick = async () => {
        const bt = $('#u-ok'); const erro = t => { $('#u-msg').innerHTML = `<div class="erro">${esc(t)}</div>`; bt.disabled=false; bt.textContent = novo?'Criar usuário':'Salvar'; };
        const nome = $('#u-nome').value.trim();
        const papel = $('#u-papel').value;
        const fr = papel === 'admin' ? [] : [...m.querySelectorAll('.checks input:checked')].map(x=>x.value);
        if (!nome) return erro('Informe o nome.');
        bt.disabled = true; bt.textContent = 'Salvando...';
        try {
          if (novo) {
            const usuario = normal($('#u-user').value).replace(/\s+/g,'.').replace(/[^a-z0-9._-]/g,'');
            const senha = $('#u-senha').value;
            if (!usuario) return erro('Informe o usuário.');
            if (senha.length < 6) return erro('A senha precisa ter pelo menos 6 caracteres.');
            if (todos.some(x => x.usuario === usuario)) return erro('Esse usuário já existe.');
            // cria o login sem desconectar o administrador
            const temp = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false, storageKey:'crv-gp-temp' } });
            const { data, error } = await temp.auth.signUp({ email: usuarioParaEmail(usuario), password: senha, options:{ data:{ nome, usuario } } });
            if (error) throw error;
            if (!data.user || (data.user.identities && data.user.identities.length === 0)) return erro('Esse usuário já existe.');
            const r = await sb.from('perfis').insert({ user_id:data.user.id, usuario, nome, papel, frentes:fr });
            if (r.error) throw r.error;
            registrar(null, 'criou usuário', `${nome} (@${usuario}) · ${nomePapel(papel)}`);
            fecharModal();
            abrirModal({ titulo:'Usuário criado', corpo:`<div class="ok">Acesso de <b>${esc(nome)}</b> liberado.</div>
              <p>Passe estes dados para a pessoa:</p>
              <div class="ficha"><div><small>Endereço do app</small><span>${esc(location.origin + location.pathname)}</span></div>
              <div><small>Usuário</small><span>${esc(usuario)}</span></div><div><small>Senha</small><span>${esc(senha)}</span></div></div>`,
              pe:`<button class="btn prim" id="ok-f">Pronto</button>`, aoAbrir:()=>{$('#ok-f').onclick=()=>{fecharModal(); adminUsuarios();};} });
          } else {
            const ativo = $('#u-ativo').checked;
            const adminsAtivos = todos.filter(x => x.papel==='admin' && x.ativo && x.user_id !== u.user_id).length;
            if (u.papel === 'admin' && (papel !== 'admin' || !ativo) && adminsAtivos === 0) return erro('Precisa existir pelo menos um administrador ativo.');
            const r = await sb.from('perfis').update({ nome, papel, frentes:fr, ativo }).eq('user_id', u.user_id);
            if (r.error) throw r.error;
            registrar(null, 'alterou acesso', `${nome} · ${nomePapel(papel)}${ativo?'':' · desativado'}`);
            fecharModal(); toast('Acesso atualizado.');
            if (u.user_id === E.perfil.user_id) { E.perfil = { ...E.perfil, nome, papel, frentes:fr, ativo }; if (papel !== 'admin') { location.hash = '#/'; return; } }
            adminUsuarios();
          }
        } catch(e){ erro(traduzErro(e)); }
      };
    }
  });
}

function formSenha(u){
  abrirModal({
    titulo: 'Nova senha para ' + u.nome,
    corpo: `<div id="s-msg"></div><div class="campo"><label>Nova senha</label><input id="s-nova" type="text" minlength="6" placeholder="mínimo 6 caracteres"></div>
      <p style="color:var(--mut);font-size:13px">Use quando a pessoa esquecer a senha. Depois ela pode trocar em "Minha conta".</p>`,
    pe: `<button class="btn borda" id="s-c">Cancelar</button><button class="btn prim" id="s-ok">Salvar senha</button>`,
    aoAbrir: () => {
      $('#s-c').onclick = fecharModal;
      $('#s-ok').onclick = async () => {
        const s = $('#s-nova').value;
        if (s.length < 6) { $('#s-msg').innerHTML = '<div class="erro">A senha precisa ter pelo menos 6 caracteres.</div>'; return; }
        const { error } = await sb.rpc('admin_redefinir_senha', { p_user: u.user_id, p_senha: s });
        if (error) { $('#s-msg').innerHTML = `<div class="erro">${esc(traduzErro(error))}</div>`; return; }
        registrar(null, 'redefiniu senha', u.nome);
        fecharModal(); toast('Senha redefinida. Passe a nova senha para ' + u.nome.split(' ')[0] + '.');
      };
    }
  });
}

function adminPaineis(){
  const c = $('#admin-corpo');
  const frentes = frentesExistentes();
  c.innerHTML = `<div class="cartao-cab"><h3>Painéis do app</h3><button class="btn prim" id="p-lote">Carregar arquivos de dados</button></div>
    <p style="color:var(--mut);margin-top:0;font-size:13px"><b>Carregar arquivos de dados:</b> selecione de uma vez todos os arquivos de dados (.json) que o Claude preparou — cada um vai para o seu painel.</p>
    <p style="color:var(--mut);margin-top:0;font-size:13px">Mude a frente ou o nível de acesso de cada painel. <b>Restrito</b>: só administradores. <b>Controlado</b>: quem tiver a frente liberada. <b>Geral</b>: também quem tiver a frente liberada (dado operacional).</p>
    <div class="tabela-env" style="max-height:none"><table class="tab"><thead><tr><th>Painel</th><th>Frente</th><th>Nível</th><th>Dados</th><th>Arquivo de dados</th></tr></thead><tbody>
    ${E.paineis.map(p=>{ const m=E.metas[p.id]; return `<tr data-id="${esc(p.id)}" style="cursor:default">
      <td><input class="p-nome" value="${esc(p.nome)}" title="Clique para mudar o nome do painel" style="font:inherit;font-weight:700;border:1px solid transparent;background:transparent;border-radius:6px;padding:4px 6px;width:100%;min-width:180px"></td>
      <td><select class="p-frente">${[...new Set([...frentes, ...ORDEM_FRENTES])].map(f=>`<option ${f===p.frente?'selected':''}>${esc(f)}</option>`).join('')}</select></td>
      <td><select class="p-nivel">${['geral','controlado','restrito'].map(n=>`<option ${n===p.nivel?'selected':''}>${n}</option>`).join('')}</select></td>
      <td>${m ? `${m.linhas==null ? 'dados de '+fmtRef(m.referencia) : fmtNum(m.linhas)+' linhas'}<br><small style="color:var(--mut)">atualizado ${new Date(m.atualizado_em).toLocaleDateString('pt-BR')}${m.atualizado_por?' por '+esc(m.atualizado_por):''}</small>` : '—'}</td>
      <td style="white-space:nowrap"><button class="btn peq prim p-carregar">${m ? 'Atualizar' : 'Carregar'}</button> ${m ? '<button class="btn peq perigo p-apagar">Apagar</button>' : ''}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  $('#p-lote').onclick = () => escolherPacotes(null);
  c.querySelectorAll('tr[data-id]').forEach(tr => {
    const id = tr.dataset.id;
    const salvar = async (campo, valor) => {
      const { error } = await sb.from('paineis').update({ [campo]: valor }).eq('id', id);
      if (error) return toast(traduzErro(error), true);
      const p = E.paineis.find(x=>x.id===id); p[campo] = valor;
      registrar(id, 'alterou painel', `${campo}: ${valor}`); toast('Painel atualizado.');
    };
    tr.querySelector('.p-carregar').onclick = () => escolherPacotes(id);
    tr.querySelector('.p-frente').onchange = ev => salvar('frente', ev.target.value);
    tr.querySelector('.p-nivel').onchange = ev => salvar('nivel', ev.target.value);
    const pn = tr.querySelector('.p-nome');
    pn.onfocus = () => { pn.style.borderColor = 'var(--borda, #d5dbe6)'; pn.style.background = '#fff'; };
    pn.onblur = () => { pn.style.borderColor = 'transparent'; pn.style.background = 'transparent'; };
    pn.onkeydown = ev => { if (ev.key === 'Enter') pn.blur(); if (ev.key === 'Escape') { pn.value = E.paineis.find(x=>x.id===id).nome; pn.blur(); } };
    pn.onchange = async () => {
      const v = pn.value.trim(); const p = E.paineis.find(x=>x.id===id);
      if (!v) { pn.value = p.nome; return; }
      if (v === p.nome) return;
      await salvar('nome', v);
    };
    const ap = tr.querySelector('.p-apagar');
    if (ap) ap.onclick = async () => {
      if (!confirm('Apagar a base deste painel? Os dados saem do app (a planilha original continua no seu computador).')) return;
      const tabela = MODELOS[id] ? 'pacotes' : 'bases';
      const { error } = await sb.from(tabela).delete().eq('painel', id);
      if (error) return toast(traduzErro(error), true);
      delete E.metas[id]; registrar(id, 'apagou a base', ''); toast('Base apagada.'); adminPaineis();
    };
  });
}

async function adminHistorico(){
  const c = $('#admin-corpo');
  const { data, error } = await sb.from('historico').select('*').order('feito_em', { ascending:false }).limit(200);
  if (error) { c.innerHTML = `<div class="erro">${esc(traduzErro(error))}</div>`; return; }
  const nomeP = id => E.paineis.find(p=>p.id===id)?.nome || '—';
  c.innerHTML = `<div class="cartao-cab"><h3>Últimas ações</h3></div>
    ${data.length ? `<div class="tabela-env"><table class="tab"><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Painel</th><th>Detalhe</th></tr></thead><tbody>
    ${data.map(h=>`<tr style="cursor:default"><td>${fmtData(h.feito_em)}</td><td>${esc(h.usuario)}</td><td>${esc(h.acao)}</td><td>${esc(h.painel?nomeP(h.painel):'—')}</td><td>${esc(h.detalhe)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="vazio">Nenhuma ação registrada ainda.</p>'}`;
}

/* =====================================================================
   MINHA CONTA
   ===================================================================== */
function telaConta(){
  const p = E.perfil;
  moldura(`<div class="trilha"><button data-ir="#/">Início</button> › <b>Minha conta</b></div>
    <div class="cartao" style="max-width:520px">
      <div class="cartao-cab"><h3>${esc(p.nome)}</h3><span class="chip-papel">${esc(nomePapel(p.papel))}</span></div>
      <p style="color:var(--mut);margin-top:0">Usuário: <b>@${esc(p.usuario)}</b><br>Frentes: ${p.papel==='admin' ? 'todas' : (p.frentes?.length ? esc(p.frentes.join(', ')) : 'nenhuma')}</p>
      <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
      <h3 style="font-size:15px">Trocar minha senha</h3><div id="c-msg"></div>
      <div class="campo"><label>Nova senha</label><input id="c-s1" type="password" minlength="6" autocomplete="new-password"></div>
      <div class="campo"><label>Repita a nova senha</label><input id="c-s2" type="password" minlength="6" autocomplete="new-password"></div>
      <button class="btn prim" id="c-ok">Salvar nova senha</button>
    </div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  $('#c-ok').onclick = async () => {
    const a = $('#c-s1').value, b = $('#c-s2').value;
    const msg = (t, ok) => $('#c-msg').innerHTML = `<div class="${ok?'ok':'erro'}">${esc(t)}</div>`;
    if (a.length < 6) return msg('A senha precisa ter pelo menos 6 caracteres.');
    if (a !== b) return msg('As senhas não conferem.');
    const { error } = await sb.auth.updateUser({ password: a });
    if (error) return msg(traduzErro(error));
    msg('Senha alterada.', true); $('#c-s1').value = $('#c-s2').value = '';
  };
}

/* =====================================================================
   INSTALAR (PWA)
   ===================================================================== */
window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); E.instalarEvt = ev; });
async function instalarApp(){
  if (E.instalarEvt) { E.instalarEvt.prompt(); await E.instalarEvt.userChoice; E.instalarEvt = null; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  abrirModal({
    titulo: 'Instalar o app',
    corpo: ios
      ? `<ol><li>Abra este endereço no <b>Safari</b>.</li><li>Toque no botão <b>Compartilhar</b> (quadrado com seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b> e confirme.</li></ol>`
      : `<p><b>Computador (Chrome ou Edge):</b> clique no ícone de instalar na barra de endereço (um monitor com seta) ou no menu ⋮ → <b>Instalar Gestão de Pessoas CRV</b>.</p>
         <p><b>Celular Android (Chrome):</b> menu ⋮ → <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p>`,
    pe: `<button class="btn prim" id="i-ok">Entendi</button>`,
    aoAbrir: () => $('#i-ok').onclick = fecharModal
  });
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

sb.auth.onAuthStateChange((evento) => { if (evento === 'SIGNED_OUT' && E.perfil) { E.perfil = null; telaLogin(); } });
prepararLogo();
iniciar();
})();
