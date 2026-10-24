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
  'Atendimento e escuta':          { cor:'#4a6a8a', ic:'balcao',    desc:'Recepção do RH e ouvidorias' },
  'Alojamento e transporte':       { cor:'#8a7a2e', ic:'onibus',    desc:'Alojamentos e ônibus' },
  'Remuneração e gratificações':   { cor:'#5d6a85', ic:'pasta',     desc:'Gratificação BPP, horas extras e gratificação' }
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
  // organização do menu (out/2026): frentes renomeadas e painéis que mudaram de lugar; o administrador grava no banco
  { const REN = { 'Outros controles':'Remuneração e gratificações', 'RH externo':'Alojamento e transporte', 'Atendimento':'Atendimento e escuta' };
    const MOV = { sancoes:'Ocorrências, risco e jurídico', ouvidorias:'Atendimento e escuta' };
    const mud = [];
    E.paineis.forEach(x => { const nf = MOV[x.id] || REN[x.frente]; if (nf && nf !== x.frente) { x.frente = nf; mud.push(x); } });
    if (mud.length && E.perfil && E.perfil.papel === 'admin') mud.forEach(x => sb.from('paineis').update({ frente: x.frente }).eq('id', x.id).then(() => {}, () => {}));
    // quem tinha acesso a uma frente renomeada continua com acesso (Sanções e Ouvidorias são restritas: só administradores)
    const ajF = L => { if (!Array.isArray(L)) return L; const o = new Set(L.map(f => REN[f] || f)); return [...o]; };
    if (E.perfil && Array.isArray(E.perfil.frentes)) E.perfil.frentes = ajF(E.perfil.frentes);
    if (E.perfil && E.perfil.papel === 'admin') { try { if (!localStorage.getItem('crv-mig-frentes-2610')) sb.from('perfis').select('user_id,frentes').then(({ data }) => { (data || []).forEach(u => { const n = ajF(u.frentes || []); if (JSON.stringify(n) !== JSON.stringify(u.frentes || [])) sb.from('perfis').update({ frentes:n }).eq('user_id', u.user_id).then(() => {}, () => {}); }); try { localStorage.setItem('crv-mig-frentes-2610', '1'); } catch(_){} }, () => {}); } catch(_){} } }
  // nome padrão do Jovem Aprendiz (Instituto João Bittar), separado do RENAPSI
  const jv = E.paineis.find(x => x.id === 'jovem');
  if (jv && jv.nome === 'Jovem Aprendiz') {
    jv.nome = 'Jovem Aprendiz João Bittar';
    if (E.perfil && E.perfil.papel === 'admin') sb.from('paineis').update({ nome: jv.nome }).eq('id', 'jovem').then(() => {}, () => {});
  }
  // painéis novos que ainda não existem no banco: o administrador cria na hora
  const sp = E.paineis.find(x => x.id === 'sysprocard');
  const NOVOS = [
    { id:'sysprocard-credito', frente:'Benefícios', nome:'Crédito manual Sysprocard', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.05 },
    { id:'cartao-alimentacao', frente:'Benefícios', nome:'Cartão Alimentação', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.1 },
    { id:'cartao-convenio',    frente:'Benefícios', nome:'Cartão Convênio',    nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.2 },
    { id:'cartao-premium',     frente:'Benefícios', nome:'Cartão Premium',     nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.3 },
    { id:'cartao-adm',         frente:'Benefícios', nome:'Cartão Convênio ADM', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.4 },
    { id:'servicos-gerais',    frente:'Remuneração e gratificações', nome:'Serviços Gerais · Horas extras e gratificação', nivel:'controlado', ordem:90 }
  ].filter(n => !E.paineis.some(x => x.id === n.id));
  if (NOVOS.length && E.perfil && E.perfil.papel === 'admin') {
    await sb.from('paineis').insert(NOVOS.map((n, i) => ({ ...n, ordem: (n.id.startsWith('cartao-') || n.id === 'sysprocard-credito') ? (sp ? sp.ordem : 40) + 1 + i : n.ordem })));
    const r2 = await sb.from('paineis').select('*').order('ordem');
    if (!r2.error) E.paineis = (r2.data || []).filter(x => x.id !== 'rs' && x.id !== 'absenteismo-gestao');
  }
  // os cartões ficam logo abaixo do Sysprocard
  if (sp) { const ix = E.paineis.indexOf(sp); const OC = ['sysprocard-credito','cartao-alimentacao','cartao-convenio','cartao-adm','cartao-premium']; const cs = E.paineis.filter(x => OC.includes(x.id)).sort((a,b) => OC.indexOf(a.id) - OC.indexOf(b.id));
    if (cs.length) { E.paineis = E.paineis.filter(x => !OC.includes(x.id)); E.paineis.splice(E.paineis.indexOf(E.paineis.find(x => x.id === 'sysprocard')) + 1, 0, ...cs); } }
  E.metas = {};
  (m.data || []).forEach(r => E.metas[r.painel] = r);
  (k.data || []).forEach(r => E.metas[r.painel] = { ...r, linhas:null });
  if (E.metas.sysprocard && !E.metas['sysprocard-credito']) E.metas['sysprocard-credito'] = E.metas.sysprocard;
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
  const CHEV = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const CAD = '<svg class="cad" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const IA = d => `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const icAcao = n => /^(cadastrar|lançar|registrar|emitir|aplicar)/i.test(n) ? IA('<path d="M12 5v14M5 12h14"/>')
    : /^(histórico|respostas|relatório|créditos|gratificação)/i.test(n) ? IA('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>')
    : /^(autorização|termo|desconto|entrevista)/i.test(n) ? IA('<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>')
    : /^(todas|acompanhamento)/i.test(n) ? IA('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>')
    : IA('<circle cx="12" cy="12" r="3.5"/>');
  const SYSG = ['sysprocard-credito','cartao-alimentacao','cartao-convenio','cartao-adm','cartao-premium'];
  const itemPainel = (x, cfg) => {
    if (x.id === 'sysprocard') return itemSys(x, cfg);
    const subs = SUBACOES[x.id];
    const rest = x.nivel==='restrito' ? `<span class="lat-rest" title="Acesso restrito">${CAD}</span>` : '';
    const bt = `<button class="lat-painel ${x.id===atual&&!acaoAtual?'ativo':''} ${x.id===atual?'atual':''}" data-ir="#/p/${encodeURIComponent(x.id)}" data-busca="${esc((x.nome+' '+(subs||[]).map(s=>s.nome).join(' ')).toLowerCase())}" style="--cor:${cfg.cor}"><span class="lat-pn">${esc(x.nome)}</span>${rest}</button>`;
    if (!subs) return bt;
    const aberto = x.id === atual || subAbertos[x.id];
    return `<div class="lat-pgrupo ${aberto?'aberto':''}" data-pid="${esc(x.id)}" data-busca="${esc((x.nome+' '+subs.map(s=>s.nome).join(' ')).toLowerCase())}">
      <div class="lat-plinha">${bt}<button class="lat-pseta" title="${subs.length} opções" aria-label="Mostrar opções de ${esc(x.nome)}" aria-expanded="${aberto?'true':'false'}">${CHEV}</button></div>
      <div class="lat-psub">${subs.map(s => `<button class="lat-acao ${x.id===atual&&acaoAtual===s.acao?'ativo':''}" data-pid="${esc(x.id)}" data-acao="${esc(s.acao)}" style="--cor:${cfg.cor}"><i>${icAcao(s.nome)}</i><span>${esc(s.nome)}</span></button>`).join('')}</div>
    </div>`;
  };
  const itemSys = (x, cfg) => {
    const fil = E.paineis.filter(p => SYSG.includes(p.id) && podeVer(p)).sort((a, b) => SYSG.indexOf(a.id) - SYSG.indexOf(b.id));
    const dentro = SYSG.includes(atual) || x.id === atual;
    const bt = `<button class="lat-painel ${x.id===atual&&!acaoAtual?'ativo':''} ${dentro?'atual':''}" data-ir="#/p/${encodeURIComponent(x.id)}" data-busca="${esc((x.nome+' '+fil.map(p=>p.nome).join(' ')).toLowerCase())}" style="--cor:${cfg.cor}"><span class="lat-pn">${esc(x.nome)}</span></button>`;
    if (!fil.length) return bt;
    const aberto = dentro || subAbertos[x.id];
    return `<div class="lat-pgrupo ${aberto?'aberto':''}" data-pid="${esc(x.id)}" data-busca="${esc((x.nome+' '+fil.map(p=>p.nome).join(' ')).toLowerCase())}">
      <div class="lat-plinha">${bt}<button class="lat-pseta" title="Cartões e crédito manual" aria-label="Mostrar cartões e crédito manual" aria-expanded="${aberto?'true':'false'}">${CHEV}</button></div>
      <div class="lat-psub">${fil.map(p => `<button class="lat-acao ${p.id===atual?'ativo':''}" data-ir="#/p/${encodeURIComponent(p.id)}" style="--cor:${cfg.cor}"><i>${IA(p.id === 'sysprocard-credito' ? '<path d="M12 5v14M5 12h14"/>' : '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>')}</i><span>${esc(p.nome)}</span>${p.nivel==='restrito'?`<span class="lat-rest">${CAD}</span>`:''}</button>`).join('')}</div>
    </div>`;
  };
  const visiveis = E.paineis.filter(p => podeVer(p) && !(SYSG.includes(p.id) && E.paineis.some(q => q.id === 'sysprocard' && podeVer(q))));
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
        <div class="lat-pgrupo lat-cgrupo ${h==='#/central'||h==='#/desligamento'||subAbertos.__central?'aberto':''}" data-pid="__central">
          <div class="lat-plinha"><button class="lat-item ${h==='#/central'?'ativo':''}" data-ir="#/central"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg><span>Central do dia</span></button><button class="lat-pseta" aria-label="Mostrar opções da Central do dia" aria-expanded="${h==='#/desligamento'?'true':'false'}">${CHEV}</button></div>
          <div class="lat-psub"><button class="lat-acao ${h==='#/desligamento'?'ativo':''}" data-ir="#/desligamento" style="--cor:var(--coral)"><i>${IA('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>')}</i><span>Checklist de desligamento</span></button></div>
        </div>
        <button class="lat-item ${h.startsWith('#/ficha')?'ativo':''}" data-ir="#/ficha"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-1.8 2-2.7 3.5-2.7s2.9.9 3.5 2.7M14 9h4M14 13h4"/></svg><span>Ficha do colaborador</span></button>
        <button class="lat-item ${h==='#/consulta'?'ativo':''}" data-ir="#/consulta"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M20 20l-5.6-5.6M8 10h4M10 8v4"/></svg><span>Consulta de candidato</span></button>
        <div class="lat-busca"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="lat-q" type="search" placeholder="Buscar painel ou ação" autocomplete="off" aria-label="Buscar painel"></div>
        <div class="lat-sec">Frentes</div>
        <div class="lat-vazio" id="lat-vazio" hidden>Nenhum painel com esse nome.</div>
        ${frentes.map(f => { const cfg = FRENTES[f] || FRENTES['Remuneração e gratificações']; return `
          <div class="lat-grupo ${abertas[f]?'aberto':''}" data-frente="${esc(f)}">
            <button class="lat-frente ${f===frenteAtual?'atual':''}" aria-expanded="${abertas[f]?'true':'false'}"><span class="lat-ic" style="background:${cfg.cor}">${svg(cfg.ic,'#fff')}</span><span class="lat-nome">${esc(f)}</span><span class="lat-seta">${CHEV}</span></button>
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
    const g = b.parentElement, abrir = !g.classList.contains('aberto');
    if (abrir && !lat.classList.contains('buscando')) lat.querySelectorAll('.lat-grupo.aberto').forEach(o => { if (o !== g) { o.classList.remove('aberto'); o.querySelector('.lat-frente').setAttribute('aria-expanded','false'); } });
    g.classList.toggle('aberto', abrir); b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    abertas = {}; lat.querySelectorAll('.lat-grupo.aberto').forEach(o => abertas[o.dataset.frente] = true);
    try { localStorage.setItem('crv-menu-abertas', JSON.stringify(abertas)); } catch(_){}
  });
  lat.querySelectorAll('.lat-pseta').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const g = b.closest('.lat-pgrupo'); g.classList.toggle('aberto');
    b.setAttribute('aria-expanded', g.classList.contains('aberto') ? 'true' : 'false');
    subAbertos[g.dataset.pid] = g.classList.contains('aberto');
    try { localStorage.setItem('crv-menu-sub', JSON.stringify(subAbertos)); } catch(_){}
  });
  const q = $('#lat-q');
  if (q) q.oninput = () => {
    const t = q.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const norm = v => (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    lat.classList.toggle('buscando', !!t);
    let n = 0;
    lat.querySelectorAll('.lat-grupo').forEach(g => {
      let tem = 0;
      g.querySelectorAll('.lat-sub>.lat-painel,.lat-sub>.lat-pgrupo').forEach(it => { const ok = !t || norm(it.dataset.busca).includes(t) || norm(g.dataset.frente.toLowerCase()).includes(t); it.style.display = ok ? '' : 'none'; if (ok) tem++; });
      g.style.display = tem ? '' : 'none'; g.classList.toggle('achou', !!t && !!tem); n += tem;
    });
    $('#lat-vazio').hidden = !t || n > 0;
  };
  lat.querySelectorAll('.lat-acao[data-acao]').forEach(b => b.onclick = () => {
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
  if (h === '#/central') return telaCentral();
  if (h === '#/ficha' || h.startsWith('#/ficha/')) return telaFicha(h.split('/')[2] || '');
  if (h === '#/consulta') return telaConsulta();
  if (h === '#/desligamento') return telaDesligamento();
  if (h === '#/conta') return telaConta();
  telaInicio();
}

/* =====================================================================
   INÍCIO — frentes e painéis
   ===================================================================== */
const nomeBonito = n => String(n||'').toLowerCase().replace(/(^|\s)(\S)/g, (m, e, l) => e + l.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, x => x.toLowerCase());
function telaInicio(){
  const agora = new Date(), hora = agora.getHours();
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const hoje = agora.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  moldura(`<section class="ini-capa" aria-label="Gestão de Pessoas">
    <svg class="ini-arte" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="ic-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10213f"/><stop offset=".55" stop-color="#173b52"/><stop offset="1" stop-color="#1f6b4f"/></linearGradient>
        <linearGradient id="ic-c" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2e8a57" stop-opacity=".55"/><stop offset="1" stop-color="#7fd19b" stop-opacity=".08"/></linearGradient></defs>
      <rect width="800" height="520" fill="url(#ic-g)"/>
      <g stroke="url(#ic-c)" stroke-width="7" stroke-linecap="round" fill="none">
        ${[40,85,130,600,645,690,735,775].map((x, k) => `<path d="M${x} 520 C ${x + 6} 400, ${x - 8} 300, ${x + 4} ${170 + (k % 3) * 40}"/><path d="M${x + 2} ${330 + (k % 2) * 30} q 40 -40 78 -44" stroke-width="4"/><path d="M${x} ${260 + (k % 3) * 20} q -36 -30 -70 -30" stroke-width="4"/>`).join('')}
      </g>
      <g transform="translate(400 215)">
        <circle r="150" fill="#ffffff" fill-opacity=".05"/><circle r="108" fill="#ffffff" fill-opacity=".06"/>
        <g transform="translate(-74 6)"><circle cy="-46" r="25" fill="#2e8a57"/><path d="M-44 52 c0-44 18-66 44-66 s44 22 44 66 z" fill="#2e8a57"/></g>
        <g transform="translate(74 6)"><circle cy="-46" r="25" fill="#d4573f"/><path d="M-44 52 c0-44 18-66 44-66 s44 22 44 66 z" fill="#d4573f"/></g>
        <g transform="translate(0 -6)"><circle cy="-56" r="31" fill="#e9a23b"/><path d="M-54 58 c0-54 22-80 54-80 s54 26 54 80 z" fill="#e9a23b"/></g>
      </g>
      <path d="M0 470 C 200 440, 600 500, 800 455 L800 520 L0 520 Z" fill="#000" fill-opacity=".18"/>
    </svg>
    <div class="ini-capa-tx">
      <img class="ini-capa-logo" src="img/logo-crv.png" alt="CRV Industrial">
      <h1>Gestão de Pessoas</h1>
      <p>CRV Industrial · Unidade Capinópolis</p>
      <div class="ini-capa-saud">${saud}, ${esc(nomeBonito(E.perfil.nome).split(' ')[0])} · ${esc(hoje.charAt(0).toUpperCase() + hoje.slice(1))}</div>
      <button class="ini-capa-bt" data-ir="#/central">Abrir a Central do dia</button>
    </div>
  </section>`);
  document.querySelectorAll('.ini-capa [data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
}

/* =====================================================================
   CENTRAL DO DIA: pendências de todos os painéis num lugar só.
   Cada painel calcula as próprias pendências (window.CRV_PENDENCIAS) com as mesmas regras que mostra na tela;
   o app abre os painéis escondidos, recolhe e guarda o resultado por algumas horas.
   ===================================================================== */
const CENTRAL_FONTES = ['experiencia', 'ferias', 'crachas', 'onibus', 'sancoes', 'rd', 'jovem', 'renapsi', 'treinamentos'];
const CENTRAL_VALIDADE = 3 * 3600e3;
const centralChave = () => 'crv-central-' + (E.perfil ? E.perfil.id || E.perfil.nome : '');
let centralRodando = false;
function centralCache(){ try { return JSON.parse(localStorage.getItem(centralChave()) || 'null'); } catch(_) { return null; } }
// assinatura dos dados das fontes: se algum painel recebeu dados novos, a central é refeita
const centralAss = () => ['quadro','cartao-convenio','unimed','uniodonto','alojamentos'].concat(CENTRAL_FONTES).map(id => id + ':' + ((E.metas[id] && (E.metas[id].atualizado_em || E.metas[id].referencia)) || '')).join('|');
async function htmlDoPainel(p){
  const pid = PAC_DE[p.id] || p.id;
  const [pac, tpl] = await Promise.all([
    sb.from('pacotes').select('referencia,conteudo').eq('painel', pid).maybeSingle(),
    fetch(MODELOS[p.id] + '?v=' + CFG.VERSAO, { cache:'no-cache' }).then(r => r.ok ? r.text() : null).catch(() => null)
  ]);
  const d = pac && pac.data; if (!d || !tpl) return null;
  if (d.conteudo && d.conteudo.arquivo) d.conteudo = await lerArquivoPacote(pid, d.conteudo.arquivo);
  let novos = [];
  if (PAINEIS_COM_NOVOS.includes(p.id)) {
    const cols = [].concat(COLECAO_NOVOS[p.id] || 'novos');
    const r = await sb.from('registros').select('doc_id,dados,colecao').eq('painel', p.id).in('colecao', cols).range(0, 4999);
    if (!r.error) novos = (r.data || []).filter(x => x.dados && !x.dados.excluida).map(x => cols.length > 1 ? { _id: x.doc_id, colecao: x.colecao, dados: x.dados } : { _id: x.doc_id, dados: x.dados });
  }
  const ponte = window.CRV_PONTE.criar({ sb, painel: pid, perfil: () => E.perfil, quem: () => E.perfil.nome, podeEditar: () => podeEditar(p), ehAdmin: () => ehAdmin() });
  return { html: montarModelo(tpl, d.conteudo, d.referencia, p, novos), ponte, ref: d.referencia || '' };
}
const espera = ms => new Promise(ok => setTimeout(ok, ms));
async function pendenciasDoPainel(p){
  const r = await htmlDoPainel(p); if (!r) return [];
  const nm = 'crvc-' + p.id + '-' + Date.now();
  window.__CRV_PONTES = window.__CRV_PONTES || {}; window.__CRV_PONTES[nm] = r.ponte;
  const fr = document.createElement('iframe'); fr.name = nm; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1;
  fr.style.cssText = 'position:fixed;left:-20000px;top:0;width:1280px;height:900px;visibility:hidden;border:0;pointer-events:none';
  const url = URL.createObjectURL(new Blob([r.html], { type:'text/html' }));
  try {
    await new Promise(ok => { fr.onload = ok; setTimeout(ok, 25000); fr.src = url; document.body.appendChild(fr); });
    let L = null;
    for (let i = 0; i < 14 && !L; i++) { await espera(600); try { const f = fr.contentWindow.CRV_PENDENCIAS; if (typeof f === 'function') L = await f(i >= 12); } catch(_){} }
    return (L || []).map(x => Object.assign(x, { painel: p.id, pnome: p.nome, ref: r.ref }));
  } finally { fr.remove(); URL.revokeObjectURL(url); delete window.__CRV_PONTES[nm]; }
}
async function pendenciasQuadro(){
  const q = E.paineis.find(x => x.id === 'quadro'); if (!q || !podeVer(q)) return [];
  const { data, error } = await sb.from('registros').select('colecao,dados').eq('painel', 'quadro').in('colecao', ['entrevistas', 'entrevistas_resp', 'estabilidade']).range(0, 4999);
  if (error || !data) return [];
  const R = [], hoje = new Date(); const iso = d => d.toISOString().slice(0, 10); const br = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '';
  const resp = new Set(data.filter(x => x.colecao === 'entrevistas_resp' && x.dados && !x.dados.excluida).map(x => String(x.dados.mat)));
  const lim = iso(new Date(hoje - 3 * 864e5));
  const sem = data.filter(x => x.colecao === 'entrevistas' && x.dados && !x.dados.excluida && !resp.has(String(x.dados.mat)) && String(x.dados.emitidoEm || '').slice(0, 10) <= lim);
  if (sem.length) R.push({ id:'q-ent', sev:'info', t:'Entrevistas de desligamento sem resposta lançada', d:'Formulário gerado há mais de 3 dias. Recolher a via preenchida e lançar as respostas.', painel:'quadro', pnome:'Quadro Geral', acao:'entr',
    itens: sem.map(x => ({ nome:x.dados.nome, mat:x.dados.mat, det:`${x.dados.func || ''} · gerado em ${br(x.dados.emitidoEm)}` })) });
  const ate = iso(new Date(hoje.getTime() + 30 * 864e5)), hj = iso(hoje);
  const es = data.filter(x => x.colecao === 'estabilidade' && x.dados && !x.dados.excluida && !x.dados.encerrada && x.dados.fim && x.dados.fim >= hj && x.dados.fim <= ate);
  if (es.length) R.push({ id:'q-est', sev:'info', t:'Estabilidades terminam em até 30 dias', d:'Conferir antes de qualquer desligamento.', painel:'quadro', pnome:'Quadro Geral', acao:'estab',
    itens: es.sort((a, b) => a.dados.fim.localeCompare(b.dados.fim)).map(x => ({ nome:x.dados.nome, mat:x.dados.mat, det:`${x.dados.tipo || ''} · até ${br(x.dados.fim)}` })) });
  return R;
}
/* Checklist de desligamento: desligados (Quadro) que ainda aparecem com Cartão Convênio ativo, Unimed, Uniodonto ou alojamento.
   Cartão Alimentação e Premium não entram: o colaborador pode usar o saldo depois da saída.
   O que o RH marca como feito fica salvo (registros do Quadro, coleção deslig_check). */
const DCK = [
  { k:'conv',   n:'Cartão Convênio', acao:'Bloquear o cartão',  painel:'cartao-convenio' },
  { k:'unimed', n:'Unimed',          acao:'Excluir do plano',   painel:'unimed' },
  { k:'odonto', n:'Uniodonto',       acao:'Excluir do plano',   painel:'uniodonto' },
  { k:'aloj',   n:'Alojamento',      acao:'Liberar o leito',    painel:'alojamentos' }
];
const brD = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '';
async function dadosDesligamento(){
  const Q = await window.CRV_QUADRO(); if (!Q || !Q.mapa) return null;
  const deslig = m => { const c = Q.mapa[String(m).replace(/^0+(?=\d)/, '')]; return c && c.situacao === 'Desligado' ? c : null; };
  const P = new Map(), refs = {};
  const add = (m, nome, k, det, ref) => { const c = deslig(m); if (!c) return; const key = String(m).replace(/^0+(?=\d)/, '');
    if (!P.has(key)) P.set(key, { mat:key, nome:nome || c.nome, deslig:c.deslig || '', funcao:c.funcao || '', setor:c.setor || '', area:c.area || '', b:{} });
    P.get(key).b[k] = { det, ref, depois: !!(ref && c.deslig && c.deslig > ref) }; };
  const pode = id => { const p = E.paineis.find(x => x.id === id); return p && podeVer(p) && E.metas[id]; };
  if (pode('cartao-convenio')) { const d = await window.CRV_DADOS('cartao-convenio'); const C = d && d.dados.CARTAO; if (C && C.rows) { refs.conv = C.refPlanilha || d.referencia; C.rows.filter(r => String(r.card || '').toLowerCase() === 'ativo').forEach(r => add(r.mat, r.nome, 'conv', 'Cartão ativo na planilha', refs.conv)); } }
  if (pode('unimed')) { const d = await window.CRV_DADOS('unimed'); const U = d && d.dados.DATA; if (U && U.P) { refs.unimed = d.referencia; U.P.filter(r => r[8] >= 0).forEach(r => add(r[0], r[1], 'unimed', r[11] && r[11].length ? `Titular + ${r[11].length} dependente${r[11].length > 1 ? 's' : ''}` : 'Titular', refs.unimed)); } }
  if (pode('uniodonto')) { const d = await window.CRV_DADOS('uniodonto'); const U = d && d.dados.DATA; if (U && U.T) { refs.odonto = d.referencia; U.T.forEach(t => add(t[5] || t[1], t[2], 'odonto', t[7] && t[7].length ? `Titular + ${t[7].length} dependente${t[7].length > 1 ? 's' : ''}` : 'Titular', refs.odonto)); } }
  if (pode('alojamentos')) { const d = await window.CRV_DADOS('alojamentos'); const A = d && d.dados.DATA; if (A && A.people) { refs.aloj = d.referencia; A.people.filter(x => x.t === 'c' && x.m).forEach(x => { const h = A.houses && A.houses[x.h]; add(x.m, x.n, 'aloj', h ? `${h.n}${x.q ? ', quarto ' + x.q : ''}` : 'Alojado', refs.aloj); }); } }
  const { data } = await sb.from('registros').select('doc_id,dados').eq('painel', 'quadro').eq('colecao', 'deslig_check').range(0, 4999);
  const OK = {}; (data || []).forEach(r => { OK[r.doc_id] = (r.dados && r.dados.ok) || {}; });
  const L = [...P.values()].map(x => { x.ok = OK[x.mat] || {}; x.pend = Object.keys(x.b).filter(k => !x.ok[k]); return x; })
    .sort((a, b) => String(b.deslig).localeCompare(String(a.deslig)) || a.nome.localeCompare(b.nome));
  return { L, refs, refQ: Q.referencia || '' };
}
async function marcarDesligamento(x, k, feito){
  const ok = Object.assign({}, x.ok);
  if (feito) ok[k] = { em: new Date().toISOString(), por: E.perfil.nome }; else delete ok[k];
  const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'deslig_check/' + x.mat, colecao:'deslig_check', doc_id:x.mat,
    dados:{ mat:x.mat, nome:x.nome, deslig:x.deslig, ok }, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' });
  if (error) throw error;
  x.ok = ok; x.pend = Object.keys(x.b).filter(q => !x.ok[q]);
  try { localStorage.removeItem(centralChave()); } catch(_){}
}
async function pendenciasDesligamento(){
  const D = await dadosDesligamento(); if (!D) return [];
  const L = D.L.filter(x => x.pend.length);
  if (!L.length) return [];
  const nomes = Object.keys(D.refs).map(k => DCK.find(d => d.k === k).n);
  return [{ id:'desl-check', sev:'crit', t:'Desligados com benefício ou alojamento ainda ativo', painel:'', rota:'#/desligamento', pnome:'Checklist de desligamento',
    d:`Cruzamento do Quadro com ${nomes.join(', ')}. Cartão Alimentação e Premium não entram: o saldo pode ser usado depois da saída.`,
    itens: L.map(x => ({ nome:x.nome, mat:x.mat, det:`${x.deslig ? 'desligado em ' + brD(x.deslig) + ' · ' : ''}${x.pend.map(k => { const d = DCK.find(q => q.k === k); return `${d.n}: ${d.acao.toLowerCase()}`; }).join(' · ')}` })) }];
}
/* =====================================================================
   FICHA 360 DO COLABORADOR: tudo da pessoa numa tela, a partir de todos os painéis que o usuário pode ver.
   ===================================================================== */
const fPode = id => { const p = E.paineis.find(x => x.id === id); return p && podeVer(p) && E.metas[id] ? p : null; };
const fMat = m => String(m == null ? '' : m).replace(/^0+(?=\d)/, '');
const fDias = (a, b) => Math.round((new Date((b || new Date().toISOString().slice(0, 10)) + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const fCasa = (adm, fim) => { if (!adm) return ''; const d = fDias(adm, fim), m = Math.floor(d / 30.44); return m < 1 ? d + ' dias' : m < 12 ? m + (m === 1 ? ' mês' : ' meses') : Math.floor(m / 12) + (m < 24 ? ' ano' : ' anos') + (m % 12 ? ' e ' + (m % 12) + (m % 12 === 1 ? ' mês' : ' meses') : ''); };
const fIdade = n => { if (!n) return ''; const h = new Date(), d = new Date(n + 'T12:00:00'); let a = h.getFullYear() - d.getFullYear(); if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--; return a + ' anos'; };
const fCpf = c => { const d = String(c || '').replace(/\D/g, ''); return d.length >= 11 ? '***.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9, 11) : ''; };
async function fichaDados(mat){
  const Q = await window.CRV_QUADRO(); const c = Q && Q.mapa[mat]; if (!c) return null;
  const F = { mat, c, sec: [] }; const hoje = new Date().toISOString().slice(0, 10);
  const cpf8 = String(c.cpf || '').replace(/\D/g, '').slice(-8);
  const tarefas = [];
  // Férias
  if (fPode('ferias')) tarefas.push((async () => {
    const d = await window.CRV_DADOS('ferias'); const p = d && (d.dados.DATA || []).find(x => String(x.c) === mat); if (!p) return;
    const PR = {}; (await window.CRV_REGS('ferias', 'prog')).forEach(x => { if (x._id && x._id.startsWith(mat + '_')) PR[x._id] = x; });
    const L = (p.p || []).map(([de, ate, lim, saldo, , nulo, plan]) => { const g = PR[mat + '_' + de]; const pg = g ? (g.retorno ? 'aguarda retorno' : (g.parcelas && g.parcelas.length ? g.parcelas : [{ inicio:g.inicio, dias:g.dias }]).map(q => brD(q.inicio) + ' (' + q.dias + 'd)').join(' + ')) : (plan && /^\d{4}/.test(plan) ? brD(plan) + ' (planilha)' : '');
      const st = nulo ? 'Nulo' : saldo <= 0 ? 'Gozado' : ate > hoje ? 'Em aquisição' : lim < hoje && !pg ? 'Vencido' : fDias(hoje, lim) <= 90 && !pg ? 'Vence em ' + fDias(hoje, lim) + ' dias' : pg ? 'Programado' : 'A gozar';
      return [brD(de) + ' a ' + brD(ate), brD(lim), nulo ? '0' : Math.round(saldo) + 'd', pg || '—', st]; });
    F.sec.push({ k:'ferias', t:'Férias', painel:'ferias', ref:d.referencia, cab:['Período aquisitivo', 'Data limite', 'Saldo', 'Programação', 'Situação'], linhas:L, alerta: L.some(l => l[4] === 'Vencido') ? 'Período vencido sem programação' : '' }); })());
  // Frequência e disciplina
  tarefas.push((async () => {
    const O = await window.CRV_OCORR([mat]); const o = O.P[mat];
    if (fPode('absenteismo') || fPode('quadro')) { const at = o ? o.at : [], fa = o ? o.fa : [];
      F.sec.push({ k:'abs', t:'Atestados e faltas (2026)', painel:'absenteismo', ref:O.abs, resumo:[['Dias de atestado', at.length], ['Faltas', fa.length], ['Último atestado', at.length ? brD(at[at.length - 1]) : '—'], ['Última falta', fa.length ? brD(fa[fa.length - 1]) : '—']] }); }
    if (fPode('sancoes')) { const L = o ? o.adv.map(x => [brD(x.data), 'Advertência', x.motivo || '']).concat(o.sus.map(x => [brD(x.data), 'Suspensão' + (x.dias ? ' (' + x.dias + 'd)' : ''), x.motivo || ''])) : [];
      L.sort((a, b) => b[0].split('/').reverse().join('').localeCompare(a[0].split('/').reverse().join('')));
      F.sec.push({ k:'sanc', t:'Sanções disciplinares', painel:'sancoes', cab:['Data', 'Tipo', 'Motivo'], linhas:L, alerta: o && o.sus.length >= 3 ? o.sus.length + 'ª suspensão ou mais' : '' }); }
  })());
  // RD
  if (fPode('rd')) tarefas.push((async () => { const d = await window.CRV_DADOS('rd'); const D = d && d.dados.D; if (!D) return;
    const DES = ['Sem tratativa', 'Ausência de culpa', 'Culpa apontada, sem medida', 'Medida disciplinar', 'Desconto', 'Sem informação'];
    const L = D.rows.filter(r => fMat(r[2]) === mat).map(r => [String(r[0]), brD(r[1]), DES[r[9]] || '', r[10] || '', r[11] != null ? 'R$ ' + Number(r[11]).toLocaleString('pt-BR', { minimumFractionDigits:2 }) : '']);
    F.sec.push({ k:'rd', t:'Registros de dano (RD)', painel:'rd', ref:D.base, cab:['RD', 'Data', 'Desfecho', 'Tratativa', 'Valor'], linhas:L, alerta: L.some(l => l[2] === 'Sem tratativa') ? 'RD sem tratativa' : '' }); })());
  // Benefícios
  tarefas.push((async () => { const B = [];
    for (const t of ['alimentacao', 'convenio', 'premium']) { if (!fPode('cartao-' + t)) continue; const d = await window.CRV_DADOS('cartao-' + t); const C = d && d.dados.CARTAO; if (!C) continue;
      const r = (C.rows || []).find(x => fMat(x.mat) === mat); B.push([C.titulo, r && r.card ? r.card : 'Sem cartão', r && r.idc ? 'ID ' + r.idc : '', brD(C.refPlanilha)]); }
    if (fPode('unimed')) { const d = await window.CRV_DADOS('unimed'); const U = d && d.dados.DATA; if (U) { const r = (U.P || []).find(x => fMat(x[0]) === mat);
      const PLN = ['Local', 'Nacional Enfermaria', 'Nacional Apartamento']; B.push(['Unimed', r && r[8] >= 0 ? 'Titular · ' + (PLN[r[8]] || 'plano') : 'Sem plano', r && r[11] && r[11].length ? r[11].length + ' dependente' + (r[11].length > 1 ? 's' : '') + ': ' + r[11].map(x => x[0]).join(', ') : '', brD(d.referencia)]); } }
    if (fPode('uniodonto')) { const d = await window.CRV_DADOS('uniodonto'); const U = d && d.dados.DATA; if (U) { const t = (U.T || []).find(x => fMat(x[5] || x[1]) === mat);
      B.push(['Uniodonto', t ? 'Titular' : 'Sem plano', t && t[7] && t[7].length ? t[7].length + ' dependente' + (t[7].length > 1 ? 's' : '') + ': ' + t[7].map(x => x[1]).join(', ') : '', brD(d.referencia)]); } }
    if (fPode('alojamentos')) { const d = await window.CRV_DADOS('alojamentos'); const A = d && d.dados.DATA; if (A) { const x = (A.people || []).find(y => y.t === 'c' && fMat(y.m) === mat);
      B.push(['Alojamento', x ? 'Alojado' : 'Não alojado', x ? ((A.houses[x.h] || {}).n || '') + (x.q ? ', quarto ' + x.q : '') : '', brD(d.referencia)]); } }
    if (B.length) F.sec.push({ k:'ben', t:'Benefícios e alojamento', cab:['Benefício', 'Situação', 'Detalhe', 'Base de'], linhas:B, alerta: c.situacao === 'Desligado' && B.some(b => /Titular|Ativo|Alojado/.test(b[1]) && !/Alimenta|Premium/.test(b[0])) ? 'Desligado com benefício ativo' : '' });
  })());
  // Experiência
  if (fPode('experiencia')) tarefas.push((async () => { const d = await window.CRV_DADOS('experiencia'); const R = d && d.dados.RAW; if (!R) return; const r = R.find(x => fMat(x[0]) === mat); if (!r) return;
    const reg = (await window.CRV_REGS('experiencia', 'registros')).find(x => x._id === 'm' + mat) || {};
    const DEC = { efetivar:'Efetivar', encerrar:'Encerrar contrato', prorrogar:'Prorrogar' };
    const L = [['1º vencimento', r[7] ? brD(r[7]) : '—', reg.pr && reg.pr.decisao ? 'Área: ' + (DEC[reg.pr.decisao] || reg.pr.decisao) : ''], ['Vencimento final (' + r[9] + ' dias)', brD(r[8]), reg.ef && reg.ef.decisao ? 'Área: ' + (DEC[reg.ef.decisao] || reg.ef.decisao) : '']];
    if (reg.enc && reg.enc.data) L.push(['Encerramento', brD(reg.enc.data), '']);
    F.sec.push({ k:'exp', t:'Período de experiência', painel:'experiencia', cab:['Etapa', 'Data', 'Avaliação'], linhas:L, alerta: r[8] < hoje && !(reg.ef && reg.ef.decisao) && !(reg.enc && reg.enc.data) && !r[17] ? 'Prazo encerrado sem decisão' : '' }); })());
  // Crachás de treinamento
  if (fPode('crachas')) tarefas.push((async () => { const L = (await window.CRV_REGS('crachas', 'treinamentos')).filter(x => fMat(x.mat) === mat && !x.excluido);
    if (L.length) F.sec.push({ k:'cr', t:'Crachás de treinamento', painel:'crachas', cab:['Função em treinamento', 'Início', 'Vencimento', 'Resultado'], linhas:L.map(x => [x.funcaoTrein || '', brD(x.inicio), brD(x.fim), String(x.resultado || '—').replace(/_/g, ' ').toLowerCase()]) }); })());
  // Processos trabalhistas e bloqueio para recontratação
  if (fPode('processos')) tarefas.push((async () => { const d = await window.CRV_DADOS('processos'); const DB = d && d.dados.DB; if (!DB) return;
    const p = (DB.P || []).find(x => fMat(x.mat) === mat || (cpf8 && String(x.c || '').replace(/\D/g, '').slice(-8) === cpf8)); if (!p) return;
    F.sec.push({ k:'proc', t:'Processos trabalhistas', painel:'processos', cab:['Processo', 'Empresa', 'Tipo'], linhas:(p.p || []).map(x => [x[0], x[1], x[2]]), alerta:(p.p || []).length ? (p.p.length === 1 ? '1 processo' : p.p.length + ' processos') : '' });
    if (p.bq) F.bloqueio = p.bq; })());
  // Quadro: estabilidade, entrevista de desligamento, checklist
  tarefas.push((async () => { const { data } = await sb.from('registros').select('colecao,dados').eq('painel', 'quadro').in('colecao', ['estabilidade', 'entrevistas_resp', 'deslig_check']).range(0, 4999);
    (data || []).forEach(x => { const v = x.dados || {}; if (fMat(v.mat) !== mat || v.excluida) return;
      if (x.colecao === 'estabilidade' && !v.encerrada) (F.estab = F.estab || []).push(v);
      if (x.colecao === 'entrevistas_resp') F.entrevista = v;
      if (x.colecao === 'deslig_check') F.dck = v; }); })());
  await Promise.all(tarefas.map(p => p.catch(e => console.warn('ficha', e))));
  const ORD = ['exp', 'ferias', 'abs', 'sanc', 'rd', 'ben', 'cr', 'proc'];
  F.sec.sort((a, b) => ORD.indexOf(a.k) - ORD.indexOf(b.k));
  return F;
}
function telaFicha(matIni){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Ficha do colaborador</h1><div class="ini-data">Tudo da pessoa em um lugar só, a partir de todos os painéis</div></div></section>
    <div class="fc-busca cartao"><input id="fc-q" type="search" placeholder="Digite o nome ou a matrícula" autocomplete="off" aria-label="Buscar colaborador"><div class="fc-sug" id="fc-sug" hidden></div></div>
    <div id="fc-corpo"></div>`);
  const q = $('#fc-q'), sug = $('#fc-sug'); let Q = null;
  window.CRV_QUADRO().then(x => { Q = x; if (matIni) abrir(fMat(matIni)); });
  const busca = () => { if (!Q) return; const t = normal(q.value.trim()); if (t.length < 2) { sug.hidden = true; return; }
    const L = Object.entries(Q.mapa).filter(([m, c]) => m === t || normal(c.nome).includes(t)).sort((a, b) => (a[1].situacao === 'Desligado') - (b[1].situacao === 'Desligado') || a[1].nome.localeCompare(b[1].nome)).slice(0, 10);
    sug.innerHTML = L.length ? L.map(([m, c]) => `<button data-m="${esc(m)}"><b>${esc(c.nome)}</b><span>${esc(m)} · ${esc(c.funcao)} · <i class="${c.situacao === 'Desligado' ? 'des' : ''}">${esc(c.situacao)}</i></span></button>`).join('') : '<div class="fc-nada">Ninguém encontrado no Quadro (empresa 5).</div>';
    sug.hidden = false; sug.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { sug.hidden = true; q.value = ''; abrir(b.dataset.m); }); };
  q.oninput = busca; q.onkeydown = e => { if (e.key === 'Enter') { const b = sug.querySelector('[data-m]'); if (b) b.click(); } };
  setTimeout(() => q.focus(), 50);
  async function abrir(mat){
    try { history.replaceState(null, '', '#/ficha/' + mat); } catch(_){}
    const corpo = $('#fc-corpo'); corpo.innerHTML = '<div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Juntando as informações dos painéis…</p></div>';
    const F = await fichaDados(mat); if (!$('#fc-corpo')) return;
    if (!F) { corpo.innerHTML = '<div class="cartao vazio"><h3>Matrícula não encontrada no Quadro</h3></div>'; return; }
    const c = F.c, des = c.situacao === 'Desligado';
    const al = [];
    if (F.bloqueio) al.push(['crit', 'Bloqueado para recontratação: ' + F.bloqueio[0]]);
    (F.estab || []).forEach(e => al.push(['warn', 'Estabilidade: ' + (e.tipo || '') + (e.fim ? ' até ' + brD(e.fim) : '')]));
    F.sec.filter(x => x.alerta).forEach(x => al.push([x.k === 'ben' || x.k === 'proc' ? 'crit' : 'warn', x.t + ': ' + x.alerta]));
    corpo.innerHTML = `<section class="fc-cab cartao ${des ? 'des' : ''}">
        <div class="fc-av">${esc(iniciais(c.nome))}</div>
        <div class="fc-id"><h2>${esc(c.nome)}</h2><div class="fc-sub">Matrícula ${esc(mat)} · ${esc(c.funcao)}</div>
          <div class="fc-pills"><span class="fc-pill ${des ? 'r' : c.situacao === 'Afastado' ? 'a' : 'v'}">${esc(c.situacao)}</span>${c.vinculo ? `<span class="fc-pill n">${esc(c.vinculo)}</span>` : ''}</div></div>
        <button class="btn borda" id="fc-pdf">PDF da ficha</button>
        <dl class="fc-dl"><div><dt>Setor / seção</dt><dd>${esc([c.area, c.setor].filter(Boolean).join(' · ')) || '—'}</dd></div><div><dt>Gerência</dt><dd>${esc(c.gerencia || '—')}</dd></div>
          <div><dt>Admissão</dt><dd>${esc(brD(c.admissao))} · ${esc(fCasa(c.admissao, des ? c.deslig : ''))}</dd></div>${des ? `<div><dt>Desligamento</dt><dd>${esc(brD(c.deslig))}</dd></div>` : ''}
          <div><dt>Idade</dt><dd>${esc(fIdade(c.nasc)) || '—'}</dd></div><div><dt>CPF</dt><dd>${esc(fCpf(c.cpf)) || '—'}</dd></div><div><dt>Centro de custo</dt><dd>${esc([c.cc, c.ccd].filter(Boolean).join(' · ')) || '—'}</dd></div></dl></section>
      ${al.length ? `<section class="fc-al">${al.map(a => `<span class="fc-a ${a[0]}">${esc(a[1])}</span>`).join('')}</section>` : ''}
      <div class="fc-grade">${F.sec.map(x => `<section class="fc-sec cartao"><header><h3>${esc(x.t)}</h3>${x.ref ? `<small>base de ${esc(brD(x.ref))}</small>` : ''}${x.painel && fPode(x.painel) ? `<button class="link" data-ir="#/p/${esc(x.painel)}">Abrir painel ›</button>` : ''}</header>
          ${x.resumo ? `<div class="fc-res">${x.resumo.map(r => `<div><b>${esc(r[1])}</b><span>${esc(r[0])}</span></div>`).join('')}</div>`
          : x.linhas && x.linhas.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr>${x.cab.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${x.linhas.map(l => `<tr>${l.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
          : '<p class="fc-vz">Nada registrado.</p>'}</section>`).join('')}
        ${F.entrevista ? `<section class="fc-sec cartao"><header><h3>Entrevista de desligamento</h3><button class="link" data-ir="#/p/quadro/entr">Abrir respostas ›</button></header><div class="fc-res"><div><b>${esc((F.entrevista.mot || []).join('; ') || '—')}</b><span>Motivo</span></div><div><b>${esc(F.entrevista.volta || 'Não respondeu')}</b><span>Voltaria a trabalhar</span></div></div></section>` : ''}
      </div>`;
    corpo.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
    $('#fc-pdf').onclick = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' });
      cabecalhoPDF(doc, 'Ficha do colaborador', `${c.nome} · matrícula ${mat}`);
      doc.autoTable({ startY:100, head:[['Campo', 'Informação']], body:[['Nome', c.nome], ['Matrícula', mat], ['Situação', c.situacao + (des ? ' em ' + brD(c.deslig) : '')], ['Função', c.funcao], ['Setor / seção', [c.area, c.setor].filter(Boolean).join(' · ')], ['Gerência', c.gerencia || ''], ['Contrato', c.vinculo || ''], ['Admissão', brD(c.admissao) + ' · ' + fCasa(c.admissao, des ? c.deslig : '')]].concat(al.map(a => ['Atenção', a[1]])),
        styles:{ fontSize:8.5, cellPadding:3 }, headStyles:{ fillColor:[36,66,124] }, columnStyles:{ 0:{ cellWidth:120, fontStyle:'bold' } } });
      F.sec.forEach(x => { const y = doc.lastAutoTable.finalY + 18; doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.text(x.t, 40, y);
        doc.autoTable({ startY:y + 5, head:[x.resumo ? ['Indicador', 'Valor'] : x.cab], body: x.resumo ? x.resumo.map(r => [r[0], String(r[1])]) : (x.linhas.length ? x.linhas : [x.cab.map((h, i) => i ? '' : 'Nada registrado')]), styles:{ fontSize:8, cellPadding:2.5, overflow:'linebreak' }, headStyles:{ fillColor:[46,138,87] } }); });
      rodapePDF(doc); baixar(doc.output('blob'), 'Ficha ' + c.nome.split(' ')[0] + ' ' + mat + '.pdf'); };
  }
}

/* =====================================================================
   CONSULTA DE CANDIDATO / EX-COLABORADOR: pelo CPF ou pelo nome, em todas as empresas do Quadro.
   Mostra se já passou pela empresa, bloqueio para recontratação, motivos de saída, sanções, RD e currículo no banco;
   gera o PDF para a área analisar junto com o currículo.
   ===================================================================== */
const nNome = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
let _consBase = null;
async function consultaBase(){
  const Q = await window.CRV_DADOS('quadro'); if (!Q) return null;
  const k = Q.referencia + '|' + (Q.dados.D || []).length + '|' + (Q.dados.DM || []).length;
  if (_consBase && _consBase.k === k) return _consBase;
  const { D = [], DM = [], PID = [], CPFM = {}, CPFP = [], AXD = {} } = Q.dados;
  const pess = new Map(); const pe = (id, nome) => { if (!pess.has(id)) pess.set(id, { id, nome, cpf:'', pass:[] }); return pess.get(id); };
  const saida = new Map(); (AXD.EXR || []).forEach(e => { if (typeof e[2] === 'number' && e[2] < 0) saida.set(-e[2] - 1, e); });
  D.forEach((r, i) => { const id = PID[i] != null ? PID[i] : 'a' + i; const p = pe(id, r[1]);
    p.pass.push({ emp:'CRV (5)', mat:String(r[0]), funcao:r[2], secao:r[3], area:r[5], adm:r[9], saida:'', sit:r[8], atual:true });
    if (!p.cpf) p.cpf = CPFP[id] || CPFM[String(r[0])] || ''; });
  DM.forEach((r, j) => { const id = r[26] != null ? r[26] : 'd' + j; const p = pe(id, r[1]); const e = saida.get(j);
    p.pass.push({ emp:r[21], mat:String(r[0]), funcao:r[2], secao:r[3], area:r[5], adm:r[9], saida:r[20], sit:'Desligado', tipo: e && e[3] >= 0 ? (AXD.TIP || [])[e[3]] : '', mot: e && e[4] ? e[4].map(x => (AXD.MOT || [])[x]).filter(Boolean) : [], obs: e ? e[7] || '' : '', re3:r[24] });
    if (!p.cpf) p.cpf = CPFP[id] || (/\(5\)/.test(r[21]) ? CPFM[String(r[0])] || '' : ''); });
  pess.forEach(p => { p.pass.sort((a, b) => String(b.adm).localeCompare(String(a.adm))); p.n = nNome(p.nome); p.d = String(p.cpf).replace(/\D/g, ''); });
  _consBase = { k, ref:Q.referencia, L:[...pess.values()] };
  return _consBase;
}
async function consultaDetalhe(p){
  const crv = p.pass.filter(x => /\(5\)/.test(x.emp)).map(x => x.mat);
  const bloq = [];
  for (const id of ['admissoes', 'rescisoes']) { if (!fPode(id)) continue; const d = await window.CRV_DADOS(id); const B = d && d.dados.BLQ; if (B) crv.forEach(m => { if (B[m] && !bloq.some(b => b.m === m && b.t === B[m][0])) bloq.push({ m, t:B[m][0], o:B[m][1], fonte:id === 'admissoes' ? 'Acompanhamento de admissões' : 'Acompanhamento de rescisões' }); }); }
  let proc = null;
  if (fPode('processos')) { const d = await window.CRV_DADOS('processos'); const DB = d && d.dados.DB; if (DB) { const c8 = p.d.slice(-8);
    proc = (DB.P || []).find(x => (c8 && String(x.c || '').replace(/\D/g, '').slice(-8) === c8) || crv.includes(String(x.mat)));
    if (proc && proc.bq && !bloq.some(b => b.t === proc.bq[0])) bloq.push({ m:String(proc.mat || ''), t:proc.bq[0], o:proc.bq[1], fonte:'Processos trabalhistas' }); } }
  const O = crv.length ? await window.CRV_OCORR(crv) : { P:{} };
  const sanc = []; crv.forEach(m => { const o = O.P[m]; if (!o) return; o.adv.forEach(x => sanc.push([brD(x.data), 'Advertência', x.motivo || ''])); o.sus.forEach(x => sanc.push([brD(x.data), 'Suspensão' + (x.dias ? ' (' + x.dias + 'd)' : ''), x.motivo || ''])); });
  sanc.sort((a, b) => b[0].split('/').reverse().join('').localeCompare(a[0].split('/').reverse().join('')));
  let rd = []; if (fPode('rd')) { const d = await window.CRV_DADOS('rd'); const D = d && d.dados.D; const DES = ['Sem tratativa', 'Ausência de culpa', 'Culpa apontada, sem medida', 'Medida disciplinar', 'Desconto', 'Sem informação'];
    if (D) rd = D.rows.filter(r => crv.includes(String(r[2]))).map(r => [String(r[0]), brD(r[1]), DES[r[9]] || '', r[10] || '']); }
  let ent = null; try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('colecao', 'entrevistas_resp').range(0, 4999); ent = (data || []).map(x => x.dados).find(v => v && !v.excluida && crv.includes(String(v.mat))) || null; } catch(_){}
  let cvs = []; if (fPode('curriculos')) { const C = await window.CRV_REGS('curriculos', 'candidatos'); cvs = C.filter(c => nNome(c.nome) === p.n); }
  return { bloq, proc, sanc, rd, ent, cvs };
}
function telaConsulta(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Atração e perfil</div><h1>Consulta de candidato</h1><div class="ini-data">Pelo CPF ou pelo nome: se já trabalhou em alguma das empresas, se tem bloqueio e o histórico, para a área analisar junto com o currículo</div></div></section>
    <div class="fc-busca cartao"><input id="cs-q" type="search" placeholder="CPF (só números ou com pontos) ou nome completo" autocomplete="off" aria-label="CPF ou nome"><div class="fc-sug" id="cs-sug" hidden></div></div>
    <div id="cs-corpo"><div class="cartao vazio"><p>Digite o CPF ou o nome do candidato.</p></div></div>`);
  const q = $('#cs-q'), sug = $('#cs-sug'); let B = null, CV = [];
  consultaBase().then(x => { B = x; if (!x) $('#cs-corpo').innerHTML = '<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3></div>'; });
  if (fPode('curriculos')) window.CRV_REGS('curriculos', 'candidatos').then(L => { CV = L.filter(c => c.nome); });
  const buscar = () => { if (!B) return; const t = q.value.trim(), dg = t.replace(/\D/g, ''); let L = [];
    const soNum = dg.length && dg.length === t.replace(/[\s.\-]/g, '').length;
    if (soNum && dg.length >= 6) L = B.L.filter(p => p.d && p.d.includes(dg));
    else if (soNum) L = B.L.filter(p => p.pass.some(x => x.mat === dg.replace(/^0+/, '')));
    else if (t.length >= 3) { const n = nNome(t); L = B.L.filter(p => p.n.includes(n));
      // candidatos do Banco de Currículos que nunca passaram pelas empresas
      const ja = new Set(L.map(p => p.n)); const vistos = new Set();
      CV.filter(c => nNome(c.nome).includes(n) && !ja.has(nNome(c.nome))).forEach(c => { const k = nNome(c.nome); if (vistos.has(k)) return; vistos.add(k); L.push({ id:'cv:' + k, nome:c.nome, cpf:'', d:'', n:k, pass:[], soCv:true }); }); }
    if (!t) { sug.hidden = true; return; }
    L = L.slice(0, 12);
    sug.innerHTML = L.length ? L.map(p => { const u = p.pass[0]; if (!u) return `<button data-id="${esc(String(p.id))}"><b>${esc(p.nome)}</b><span>Currículo no banco · nunca trabalhou nas empresas do Quadro</span></button>`; return `<button data-id="${esc(String(p.id))}"><b>${esc(p.nome)}</b><span>${p.d ? esc(fCpf(p.cpf)) + ' · ' : ''}${p.pass.length} passage${p.pass.length > 1 ? 'ns' : 'm'} · última: ${esc(u.emp)} ${u.atual ? '<i>(' + esc(u.sit) + ' hoje)</i>' : 'até ' + esc(brD(u.saida))}</span></button>`; }).join('')
      : `<div class="fc-nada">${dg.length >= 6 ? 'Nenhum CPF encontrado: não consta passagem por nenhuma das empresas do Quadro.' : 'Ninguém com esse nome no Quadro (todas as empresas).'}</div>`;
    sug.hidden = false; sug.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { sug.hidden = true; abrir(L.find(p => String(p.id) === b.dataset.id)); }); };
  q.oninput = buscar; q.onkeydown = e => { if (e.key === 'Enter') { const b = sug.querySelector('[data-id]'); if (b) b.click(); else buscar(); } };
  setTimeout(() => q.focus(), 50);
  async function abrir(p){
    const C = $('#cs-corpo'); C.innerHTML = '<div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Juntando o histórico…</p></div>';
    const X = await consultaDetalhe(p); if (!$('#cs-corpo')) return;
    const atual = p.pass.find(x => x.atual);
    const jc = p.pass.filter(x => /justa causa/i.test(x.tipo || '') || /justa causa/i.test(x.obs || ''));
    const curto = p.pass.filter(x => x.saida && x.adm && fDias(x.adm, x.saida) <= 90);
    const pts = [];
    if (X.bloq.length) X.bloq.forEach(b => pts.push(['crit', 'Bloqueado para recontratação: ' + b.t + (b.o ? ' — ' + b.o : ''), b.fonte]));
    if (atual) pts.push(['info', 'Já é colaborador hoje: ' + atual.sit + ' na CRV, matrícula ' + atual.mat, '']);
    jc.forEach(x => pts.push(['crit', 'Saída por justa causa em ' + brD(x.saida) + ' (' + x.emp + ')', '']));
    if (curto.length) pts.push(['warn', curto.length === 1 ? 'Saiu com até 90 dias de casa em uma passagem' : `Saiu com até 90 dias de casa em ${curto.length} passagens`, '']);
    if (X.sanc.filter(s => /Suspens/.test(s[1])).length >= 3) pts.push(['warn', X.sanc.filter(s => /Suspens/.test(s[1])).length + ' suspensões no histórico', '']);
    if (X.rd.some(r => /culpa apontada|medida|desconto/i.test(r[2]))) pts.push(['warn', 'RD com culpa apontada ou medida', '']);
    const ver = X.bloq.length || jc.length ? ['r', 'Bloqueio ou restrição registrada'] : pts.some(x => x[0] === 'warn') ? ['a', 'Pontos para a área avaliar'] : p.pass.length ? ['v', 'Sem bloqueio registrado'] : ['v', 'Nunca trabalhou nas empresas'];
    C.innerHTML = `<section class="fc-cab cartao cs-cab ${ver[0]}"><div class="fc-av">${esc(iniciais(p.nome))}</div>
        <div class="fc-id"><h2>${esc(p.nome)}</h2><div class="fc-sub">${p.d ? 'CPF ' + esc(fCpf(p.cpf)) + ' · ' : ''}${p.pass.length ? p.pass.length + ' passage' + (p.pass.length > 1 ? 'ns' : 'm') + ' pelas empresas' : 'Não consta passagem por nenhuma das empresas'} (base do Quadro de ${esc(brD(B.ref))})</div>
          <div class="fc-pills"><span class="fc-pill ${ver[0] === 'r' ? 'r' : ver[0] === 'a' ? 'a' : 'v'}">${esc(ver[1])}</span></div></div>
        <button class="btn prim" id="cs-pdf">PDF para a área</button></section>
      ${pts.length ? `<section class="fc-al">${pts.map(x => `<span class="fc-a ${x[0] === 'crit' ? 'crit' : x[0] === 'info' ? 'info' : ''}" title="${esc(x[2])}">${esc(x[1])}</span>`).join('')}</section>` : ''}
      <div class="fc-grade">
        <section class="fc-sec cartao" style="grid-column:1/-1"><header><h3>Passagens pelas empresas</h3></header><div class="fc-tw"><table class="fc-t"><thead><tr><th>Empresa</th><th>Matrícula</th><th>Função</th><th>Seção / setor</th><th>Admissão</th><th>Saída</th><th>Tempo</th><th>Tipo e motivo da saída</th></tr></thead>
          <tbody>${p.pass.length ? '' : '<tr><td colspan="8">Não consta passagem por nenhuma das empresas do Quadro (CRV, APFO, CAPFO). Para confirmar, busque também pelo CPF.</td></tr>'}${p.pass.map(x => `<tr><td>${esc(x.emp)}</td><td>${esc(x.mat)}</td><td>${esc(x.funcao)}</td><td>${esc([x.secao, x.area].filter(Boolean).join(' · '))}</td><td>${esc(brD(x.adm))}</td><td>${x.atual ? '<b>' + esc(x.sit) + ' hoje</b>' : esc(brD(x.saida))}</td><td>${esc(fCasa(x.adm, x.saida || ''))}</td><td>${esc([x.tipo, (x.mot || []).join(', '), x.obs].filter(Boolean).join(' · ')) || (x.atual ? '' : '<span class="fc-vz2">não informado</span>')}${x.re3 ? ' · readmitido em até 3 dias' : ''}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="fc-sec cartao"><header><h3>Sanções disciplinares (CRV)</h3></header>${X.sanc.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Data</th><th>Tipo</th><th>Motivo</th></tr></thead><tbody>${X.sanc.map(l => `<tr>${l.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nada registrado.</p>'}</section>
        <section class="fc-sec cartao"><header><h3>Registros de dano (RD)</h3></header>${X.rd.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>RD</th><th>Data</th><th>Desfecho</th><th>Tratativa</th></tr></thead><tbody>${X.rd.map(l => `<tr>${l.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nada registrado.</p>'}</section>
        ${X.ent ? `<section class="fc-sec cartao"><header><h3>Entrevista de desligamento</h3></header><div class="fc-res"><div><b>${esc((X.ent.mot || []).join('; ') || '—')}</b><span>Motivo</span></div><div><b>${esc(X.ent.volta || 'Não respondeu')}</b><span>Voltaria a trabalhar</span></div></div></section>` : ''}
        ${X.proc ? `<section class="fc-sec cartao cs-sens"><header><h3>Processos trabalhistas</h3><small>informação sensível: não vai no PDF para a área</small></header><div class="fc-tw"><table class="fc-t"><thead><tr><th>Processo</th><th>Empresa</th><th>Tipo</th></tr></thead><tbody>${(X.proc.p || []).map(x => `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
        <section class="fc-sec cartao"><header><h3>Currículo no Banco de Currículos</h3>${fPode('curriculos') ? '<button class="link" data-ir="#/p/curriculos">Abrir banco ›</button>' : ''}</header>${X.cvs.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Recebido em</th><th>Área</th><th>Aderência</th><th>Situação</th></tr></thead><tbody>${X.cvs.map(c => `<tr><td>${esc(brD(c.recebidoEm))}</td><td>${esc(c.area_principal || '')}</td><td>${esc(c.aderencia || '')}</td><td>${esc(c.status || c.funil || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nenhum currículo com esse nome no banco.</p>'}</section>
      </div>`;
    C.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
    $('#cs-pdf').onclick = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' });
      cabecalhoPDF(doc, 'Histórico do candidato', p.nome);
      doc.autoTable({ startY:100, head:[['Resumo para a área', '']], body:[['Candidato', p.nome], ['CPF', p.d ? fCpf(p.cpf) : 'não informado'], ['Situação', ver[1]], ['Passagens pelas empresas', String(p.pass.length)]].concat(pts.map(x => ['Atenção', /^Bloqueado/.test(x[1]) && /processo|trabalhist|judicial|justi[cç]a do trabalho/i.test(x[1]) ? 'Bloqueado para recontratação (motivo com a Gestão de Pessoas)' : x[1]])),
        styles:{ fontSize:9, cellPadding:3.5 }, headStyles:{ fillColor:[36,66,124] }, columnStyles:{ 0:{ cellWidth:150, fontStyle:'bold' } } });
      const sec = (t, cab, body) => { const y = doc.lastAutoTable.finalY + 18; doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20,33,61); doc.text(t, 40, y);
        doc.autoTable({ startY:y + 5, head:[cab], body: body.length ? body : [cab.map((h, i) => i ? '' : 'Nada registrado')], styles:{ fontSize:8, cellPadding:2.5, overflow:'linebreak' }, headStyles:{ fillColor:[46,138,87] } }); };
      sec('Passagens pelas empresas', ['Empresa', 'Matrícula', 'Função', 'Admissão', 'Saída', 'Tempo', 'Tipo e motivo da saída'], p.pass.map(x => [x.emp, x.mat, x.funcao, brD(x.adm), x.atual ? x.sit + ' hoje' : brD(x.saida), fCasa(x.adm, x.saida || ''), [x.tipo, (x.mot || []).join(', ')].filter(Boolean).join(' · ')]));
      sec('Sanções disciplinares', ['Data', 'Tipo', 'Motivo'], X.sanc);
      sec('Registros de dano (RD)', ['RD', 'Data', 'Desfecho', 'Tratativa'], X.rd);
      const y = doc.lastAutoTable.finalY + 22; doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(93,106,133);
      doc.text(doc.splitTextToSize('Documento interno da Gestão de Pessoas para análise de recontratação, junto com o currículo. Não inclui dados de saúde nem processos judiciais. Uso restrito à área solicitante.', 515), 40, y);
      rodapePDF(doc); baixar(doc.output('blob'), 'Historico candidato ' + p.nome.split(' ')[0] + '.pdf'); };
  }
}

/* ---------- telas: Central do dia e Checklist de desligamento ---------- */
function telaCentral(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Central do dia</h1><div class="ini-data">Pendências de todos os painéis, das mais urgentes para as menos urgentes</div></div></section><section class="central" id="central"></section>`);
  iniciarCentral();
}
async function telaDesligamento(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Central do dia</div><h1>Checklist de desligamento</h1><div class="ini-data" id="dk-sub">Cruzando os desligados do Quadro com as bases de benefícios…</div></div>
    <div class="dk-acoes"><button class="btn borda" id="dk-xls">Excel</button><button class="btn borda" id="dk-pdf">PDF</button></div></section>
    <div id="dk-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  let D;
  try { D = await dadosDesligamento(); } catch(e) { D = null; }
  const corpo = $('#dk-corpo'); if (!corpo) return;
  if (!D) { corpo.innerHTML = `<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3><p>O checklist usa os desligados do Quadro Geral.</p></div>`; return; }
  const fontes = DCK.filter(d => D.refs[d.k] !== undefined);
  $('#dk-sub').innerHTML = `Desligados do Quadro de ${esc(brD(D.refQ))} × ${fontes.map(d => `${esc(d.n)} (base de ${esc(brD(D.refs[d.k]))})`).join(' · ')}. Cartão Alimentação e Premium não entram: o saldo pode ser usado depois da saída.`;
  const F = { q:'', b:'', res:false, desde:'' };
  const pode = podeEditar(E.paineis.find(x => x.id === 'quadro') || {});
  const desenhar = () => {
    const q = normal(F.q);
    const base = D.L.filter(x => (!q || normal(x.nome + ' ' + x.mat + ' ' + x.setor).includes(q)) && (!F.desde || x.deslig >= F.desde));
    const L = base.filter(x => (F.res ? true : x.pend.length) && (!F.b || (F.res ? x.b[F.b] : x.pend.includes(F.b))));
    const n = k => base.filter(x => x.pend.includes(k)).length;
    const nP = base.filter(x => x.pend.length).length, nR = base.reduce((a, x) => a + Object.keys(x.ok).filter(k => x.b[k]).length, 0);
    corpo.innerHTML = `<section class="dk-kpis">
        <button class="dk-k ${!F.b ? 'on' : ''}" data-b="" style="--c:var(--coral)"><span>Pessoas com pendência</span><b>${nP}</b></button>
        ${fontes.map(d => `<button class="dk-k ${F.b === d.k ? 'on' : ''}" data-b="${d.k}" style="--c:${d.k === 'unimed' ? '#1a7f5a' : d.k === 'odonto' ? '#8e3b6a' : d.k === 'conv' ? '#2f6fa8' : '#b5731a'}"><span>${esc(d.n)}</span><b>${n(d.k)}</b><small>${esc(d.acao.toLowerCase())}</small></button>`).join('')}
        <div class="dk-k ok" style="--c:var(--cane)"><span>Já resolvidos</span><b>${nR}</b><small>marcados como feitos</small></div></section>
      <section class="dk-filtros cartao"><input id="dk-q" type="search" placeholder="Buscar nome, matrícula ou setor" value="${esc(F.q)}">
        <label>Desligados desde <input type="date" id="dk-desde" value="${esc(F.desde)}"></label>
        <label class="dk-chk"><input type="checkbox" id="dk-res" ${F.res ? 'checked' : ''}> Mostrar também os resolvidos</label></section>
      <section class="dk-lista">${L.length ? L.map(x => `<article class="dk-p ${x.pend.length ? '' : 'feito'}">
          <div class="dk-quem"><b><a class="cd-fl" href="#/ficha/${esc(x.mat)}">${esc(x.nome)}</a></b><span>${esc(x.mat)} · ${esc(x.funcao)}${x.setor ? ' · ' + esc(x.setor) : ''}</span><span class="dk-dt">Desligado em <b>${esc(brD(x.deslig)) || '—'}</b></span></div>
          <div class="dk-bens">${DCK.filter(d => x.b[d.k]).map(d => { const b = x.b[d.k], ok = x.ok[d.k];
            return `<div class="dk-b ${ok ? 'ok' : ''}"><div><strong>${esc(d.n)}</strong><small>${esc(b.det)}${b.depois && !ok ? ` · <i title="O desligamento é posterior à base deste benefício; a exclusão pode já ter sido feita">saiu depois da base de ${esc(brD(b.ref))}</i>` : ''}</small>
              ${ok ? `<small class="dk-okt">Feito em ${esc(new Date(ok.em).toLocaleDateString('pt-BR'))}${ok.por ? ' por ' + esc(String(ok.por).split(' ')[0]) : ''}</small>` : `<small class="dk-ac">${esc(d.acao)}</small>`}</div>
              ${pode ? `<button class="btn ${ok ? 'borda' : 'prim'} dk-mk" data-m="${esc(x.mat)}" data-k="${d.k}" data-f="${ok ? '0' : '1'}">${ok ? 'Desfazer' : 'Feito'}</button>` : ''}</div>`; }).join('')}</div></article>`).join('')
        : `<div class="cartao vazio"><h3>${D.L.length ? 'Nada pendente com esses filtros' : 'Nenhum desligado com benefício ativo'}</h3></div>`}</section>`;
    corpo.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { F.b = b.dataset.b; desenhar(); });
    const qi = $('#dk-q'); qi.oninput = () => { F.q = qi.value; const p = qi.selectionStart; desenhar(); const n2 = $('#dk-q'); n2.focus(); n2.setSelectionRange(p, p); };
    $('#dk-desde').onchange = e => { F.desde = e.target.value; desenhar(); };
    $('#dk-res').onchange = e => { F.res = e.target.checked; desenhar(); };
    corpo.querySelectorAll('.dk-mk').forEach(b => b.onclick = async () => {
      const x = D.L.find(y => y.mat === b.dataset.m); if (!x) return; b.disabled = true;
      try { await marcarDesligamento(x, b.dataset.k, b.dataset.f === '1'); toast(b.dataset.f === '1' ? 'Marcado como feito.' : 'Marcação desfeita.'); desenhar(); }
      catch(e) { b.disabled = false; toast('Não consegui salvar: ' + traduzErro(e), true); } });
    D._vis = L;
  };
  desenhar();
  const linhas = () => (D._vis || []).map(x => [x.nome, x.mat, x.funcao, x.setor, brD(x.deslig)].concat(fontes.map(d => !x.b[d.k] ? '' : x.ok[d.k] ? 'Feito ' + new Date(x.ok[d.k].em).toLocaleDateString('pt-BR') : 'Pendente: ' + d.acao.toLowerCase() + ' (' + x.b[d.k].det + ')')));
  const cab = ['Colaborador', 'Matrícula', 'Função', 'Setor', 'Desligado em'].concat(fontes.map(d => d.n));
  const nome = 'Checklist de desligamento ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  $('#dk-xls').onclick = () => { const ws = XLSX.utils.aoa_to_sheet([cab, ...linhas()]); ws['!cols'] = cab.map((c, i) => ({ wch: i === 0 ? 34 : i > 4 ? 30 : 16 })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Checklist'); baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nome + '.xlsx'); };
  $('#dk-pdf').onclick = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Checklist de desligamento', `${(D._vis || []).length} colaboradores · Alimentação e Premium não entram`);
    doc.autoTable({ startY:110, head:[cab], body:linhas(), styles:{ fontSize:7.5, cellPadding:3, overflow:'linebreak' }, headStyles:{ fillColor:[36,66,124] }, alternateRowStyles:{ fillColor:[242,244,249] } });
    rodapePDF(doc); baixar(doc.output('blob'), nome + '.pdf'); };
}
async function coletarCentral(){
  if (centralRodando) return; centralRodando = true;
  desenharCentral(centralCache(), true);
  const out = [];
  try {
    try { out.push(...await pendenciasQuadro()); } catch(e){ console.warn('central quadro', e); }
    try { out.push(...await pendenciasDesligamento()); } catch(e){ console.warn('central desligamento', e); }
    if (ehAdmin()) try { const u = await ultimoBackup(); const d = u && u.em ? Math.floor((Date.now() - new Date(u.em)) / 864e5) : null;
      if (d == null || d > 7) out.push({ id:'bk', sev:'info', t:'Cópia de segurança do app', d: d == null ? 'Nenhuma cópia feita ainda.' : `A última foi há ${d} dias. Recomendado: uma vez por semana.`, painel:'', rota:'#/admin', pnome:'Administração', n: d == null ? '!' : d + 'd', itens:[{ nome:'Baixar a cópia em Administração → Cópia de segurança', mat:'', det:'Guarda tudo o que foi lançado no app e não existe nas planilhas.' }] }); } catch(_){}
    for (const id of CENTRAL_FONTES) {
      if (location.hash !== '#/central') break;
      const p = E.paineis.find(x => x.id === id);
      if (!p || !podeVer(p) || !E.metas[id]) continue;
      try { out.push(...await pendenciasDoPainel(p)); } catch(e){ console.warn('central', id, e); }
    }
    if (location.hash === '#/central') {
      const c = { em: new Date().toISOString(), ass: centralAss(), itens: out };
      try { localStorage.setItem(centralChave(), JSON.stringify(c)); } catch(_){}
      desenharCentral(c, false);
    }
  } finally { centralRodando = false; }
}
function iniciarCentral(){
  const c = centralCache();
  if (c && c.ass === centralAss() && Date.now() - new Date(c.em) < CENTRAL_VALIDADE) desenharCentral(c, false); else coletarCentral();
}
const centralAbertos = new Set();
function desenharCentral(c, carregando){
  const el = $('#central'); if (!el) return;
  const SEV = { crit:0, warn:1, info:2 }, COR = { crit:'var(--coral)', warn:'var(--amber)', info:'#2f7ea8' };
  const L = ((c && c.itens) || []).filter(x => x.itens && x.itens.length).sort((a, b) => SEV[a.sev] - SEV[b.sev]);
  const hora = c ? new Date(c.em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '';
  const nCrit = L.filter(x => x.sev === 'crit').length;
  el.innerHTML = `<header class="cd-cab"><div><h2>Central do dia</h2><span>${carregando ? 'Atualizando as pendências dos painéis…' : c ? `${L.length ? `${L.length} ${L.length === 1 ? 'pendência' : 'pendências'}${nCrit ? ` · <b>${nCrit} urgente${nCrit > 1 ? 's' : ''}</b>` : ''}` : 'Nenhuma pendência'} · atualizado em ${esc(hora)}` : ''}</span></div>
      <button class="btn borda cd-at" id="cd-at" ${carregando ? 'disabled' : ''}>${carregando ? '<span class="spinner pq"></span>' : 'Atualizar'}</button></header>
    ${L.length ? `<div class="cd-lista">${L.map(x => { const n = x.n || x.itens.length, ab = centralAbertos.has(x.id); return `<article class="cd-it ${ab ? 'aberto' : ''}" style="--c:${COR[x.sev]}" data-cid="${esc(x.id)}">
        <button class="cd-l" data-tog="${esc(x.id)}" aria-expanded="${ab}"><b class="cd-n">${n}</b><span class="cd-tx"><strong>${esc(x.t)}</strong><small>${esc(x.pnome)}${x.d ? ' · ' + esc(x.d) : ''}</small></span><span class="cd-seta">›</span></button>
        <div class="cd-nomes">${x.itens.slice(0, 40).map(i => `<div class="cd-p"><b>${i.mat ? `<a class="cd-fl" href="#/ficha/${esc(fMat(i.mat))}">${esc(i.nome)}</a>` : esc(i.nome)}</b>${i.mat ? `<span class="cd-m">${esc(i.mat)}</span>` : ''}<small>${esc(i.det || '')}</small></div>`).join('')}${x.itens.length > 40 ? `<div class="cd-mais">+ ${x.itens.length - 40} no painel</div>` : ''}
          <button class="btn prim cd-ir" data-ir="${x.rota ? x.rota : '#/p/' + encodeURIComponent(x.painel) + (x.acao ? '/' + x.acao : '')}">Abrir ${esc(x.pnome)}</button></div></article>`; }).join('')}</div>`
      : carregando && !c ? '<div class="cd-vazio">Lendo os painéis: Experiência, Férias, Crachás, Ônibus, Sanções, RD, Jovem Aprendiz, Treinamentos, Quadro e benefícios…</div>' : c ? '<div class="cd-vazio ok">Tudo em dia nos painéis acompanhados.</div>' : ''}`;
  el.querySelector('#cd-at').onclick = () => coletarCentral();
  el.querySelectorAll('[data-tog]').forEach(b => b.onclick = () => { const id = b.dataset.tog; centralAbertos.has(id) ? centralAbertos.delete(id) : centralAbertos.add(id); b.closest('.cd-it').classList.toggle('aberto'); b.setAttribute('aria-expanded', centralAbertos.has(id)); });
  el.querySelectorAll('.cd-ir').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
}

function blocoFrente(f, lista){
  const cfg = FRENTES[f] || FRENTES['Remuneração e gratificações'];
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
  quadro:   [{ acao:'hcol', nome:'Histórico do colaborador' }, { acao:'ent', nome:'Entrevista de desligamento' }, { acao:'entr', nome:'Respostas das entrevistas' }, { acao:'estab', nome:'Estabilidade' }],
  admissoes: [{ acao:'vq', nome:'Todas as empresas e anos' }, { acao:'vp', nome:'Acompanhamento 2026' }],
  rescisoes: [{ acao:'vq', nome:'Todas as empresas e anos' }, { acao:'vp', nome:'Acompanhamento 2026' }],
  curriculos: [{ acao:'ctr', nome:'Em contratação' }],
  jovem:    [{ acao:'novo', nome:'Cadastrar jovem' }, { acao:'dslj', nome:'Registrar desligamento' }, { acao:'atj', nome:'Atestados' }],
  renapsi:  [{ acao:'novo', nome:'Cadastrar jovem' }, { acao:'dslj', nome:'Registrar desligamento' }, { acao:'atj', nome:'Atestados' }],
  sancoes:  [{ acao:'doc', nome:'Emitir advertência / suspensão / orientação' }],
  ouvidorias: [{ acao:'nova', nome:'Cadastrar ouvidoria' }],
  rd:       [{ acao:'novo', nome:'Cadastrar RD' }, { acao:'aut', nome:'Autorização de desconto' }, { acao:'hist', nome:'Histórico de autorizações' }],
  fadiga:   [{ acao:'novo', nome:'Cadastrar ocorrência' }, { acao:'trat', nome:'Aplicar tratativa' }],
  treinamentos: [{ acao:'novo', nome:'Cadastrar treinamento' }],
  'cartao-alimentacao': [{ acao:'rel', nome:'Relatório de conferência' }],
  'cartao-convenio':    [{ acao:'desc', nome:'Desconto em folha' }, { acao:'termo', nome:'Termo de opção' }, { acao:'rel', nome:'Relatório de conferência' }],
  'cartao-premium':     [{ acao:'rel', nome:'Relatório de conferência' }],
  'cartao-adm':         [{ acao:'novo', nome:'Registrar entrega' }, { acao:'sem', nome:'Créditos da semana' }, { acao:'rel', nome:'Relatório do período' }],
  crachas:  [{ acao:'novo', nome:'Cadastrar crachá de treinamento' }],
  farmacia: [{ acao:'aut', nome:'Autorização de desconto' }, { acao:'hist', nome:'Histórico de autorizações' }],
  'servicos-gerais': [{ acao:'she', nome:'Lançar horas extras' }, { acao:'sgr', nome:'Gratificação do mês' }]
};
function fecharJanelasAut(w){ try { w.document.querySelectorAll('.aut-fundo,.ent-fundo,.er-fundo,.of-fundo,.nv-fundo,.rl-fundo,.es-fundo,.ds-fundo,.ct-fundo,.jf-fundo,.ft-fundo,.df-fundo').forEach(x => x.remove()); } catch(_){} }
function executarAcao(acao){
  const f = document.getElementById('modelo-frame');
  const w = f && f.contentWindow;
  if (acao === 'aut' && w && typeof w.CRV_AUTORIZACAO === 'function') { fecharJanelasAut(w); w.CRV_AUTORIZACAO(); return true; }
  if (acao === 'hist' && w && typeof w.CRV_AUT_HIST === 'function') { fecharJanelasAut(w); w.CRV_AUT_HIST(); return true; }
  if (acao === 'doc' && w && typeof w.CRV_DOCDISC === 'function') { fecharJanelasAut(w); w.CRV_DOCDISC(); return true; }
  if (acao === 'desc' && w && typeof w.CRV_DESCFOLHA === 'function') { fecharJanelasAut(w); w.CRV_DESCFOLHA(); return true; }
  if (acao === 'trat' && w && typeof w.CRV_FAD_TRAT === 'function') { fecharJanelasAut(w); w.CRV_FAD_TRAT(); return true; }
  if (acao === 'dslj' && w && typeof w.CRV_JOV_DESL === 'function') { fecharJanelasAut(w); w.CRV_JOV_DESL(); return true; }
  if (acao === 'atj' && w && typeof w.CRV_JOV_AT === 'function') { fecharJanelasAut(w); w.CRV_JOV_AT(); return true; }
  if (acao === 'ctr' && w && typeof w.CRV_CONTRATACAO === 'function') { fecharJanelasAut(w); w.CRV_CONTRATACAO(); return true; }
  if (acao === 'hcol' && w && typeof w.CRV_HISTCOL === 'function') { fecharJanelasAut(w); w.CRV_HISTCOL(); return true; }
  if (acao === 'estab' && w && typeof w.CRV_ESTAB === 'function') { fecharJanelasAut(w); w.CRV_ESTAB(); return true; }
  if (acao === 'entr' && w && typeof w.CRV_ENT_RESP === 'function') { fecharJanelasAut(w); w.CRV_ENT_RESP(); return true; }
  if (acao === 'ent' && w && typeof w.CRV_ENTREVISTA === 'function') { fecharJanelasAut(w); w.CRV_ENTREVISTA(); return true; }
  if (acao === 'termo' && w && typeof w.CRV_TERMO === 'function') { fecharJanelasAut(w); w.CRV_TERMO(); return true; }
  if (acao === 'sem' && w && typeof w.CRV_SEMANA === 'function') { fecharJanelasAut(w); w.CRV_SEMANA(); return true; }
  if (acao === 'rel' && w && typeof w.CRV_RELATORIO === 'function') { fecharJanelasAut(w); w.CRV_RELATORIO(); return true; }
  if (acao === 'novo' && w && typeof w.CRV_NOVO === 'function') { fecharJanelasAut(w); w.CRV_NOVO(); return true; }
  if (acao === 'nova' && w && typeof w.CRV_OUV_NOVA === 'function') { fecharJanelasAut(w); w.CRV_OUV_NOVA(); return true; }
  if ((acao === 'she' || acao === 'sgr') && w && typeof w.CRV_SG === 'function') { w.CRV_SG(acao); return true; }
  return false;
}
async function telaPainel(id, acao){
  E.painelAberto = null;
  const p = E.paineis.find(x => x.id === id);
  if (!p || !podeVer(p)) { toast('Painel não encontrado ou sem acesso.', true); location.hash = '#/'; return; }
  const cfg = FRENTES[p.frente] || FRENTES['Remuneração e gratificações'];
  if (VISTA_QUADRO[id] && (acao === 'vq' || acao === 'vp')) { try { localStorage.setItem('crv-vista-' + id, acao.slice(1)); } catch(_){} try { history.replaceState(null, '', '#/p/' + encodeURIComponent(id)); } catch(_){} acao = ''; }
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

/* registro de quem exportou o quê (PDF, Excel): vai para Administração → Histórico */
let _logUlt = '';
window.CRV_LOG_EXPORT = nome => { const k = String(nome || '') + '|' + Math.floor(Date.now() / 3000); if (k === _logUlt) return; _logUlt = k;
  const h = location.hash || ''; const pid = h.startsWith('#/p/') ? decodeURIComponent(h.slice(4).split('/')[0]) : null;
  const onde = pid ? null : h.startsWith('#/ficha') ? 'Ficha do colaborador' : h.startsWith('#/desligamento') ? 'Checklist de desligamento' : h.startsWith('#/admin') ? 'Administração' : '';
  const painel = pid ? (PAC_DE[pid] || pid) : null;
  registrar(painel && E.paineis.some(p => p.id === painel) ? painel : null, 'exportou arquivo', String(nome || '') + (onde ? ' · ' + onde : '')); };
function baixar(blob, nome){
  try { window.CRV_LOG_EXPORT(nome); } catch(_){}
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
  'conexao','rd','fadiga','processos','ouvidorias','recepcao','alojamentos','onibus','gratificacao','servicos-gerais'];
const MODELOS = Object.fromEntries(MODELOS_LISTA.map(id => [id, `paineis/${id}.html`]));
// painéis que usam o mesmo arquivo de painel
['cartao-alimentacao','cartao-convenio','cartao-premium'].forEach(id => MODELOS[id] = 'paineis/cartoes.html');
MODELOS['cartao-adm'] = 'paineis/cartao-adm.html';
// o crédito manual usa o mesmo arquivo, os mesmos dados e os mesmos créditos salvos do Vale-Alimentação Sysprocard
MODELOS['sysprocard-credito'] = 'paineis/sysprocard.html';
const PAC_DE = { 'sysprocard-credito':'sysprocard' };
// recursos que dependem do Claude e não funcionam no app
const AVISOS = { curriculos: 'Recrutamento e Seleção fica aqui dentro, no quadro "Recrutamento e Seleção". A leitura automática de currículos por IA só funciona dentro do Claude; aqui você consulta, cadastra e acompanha.' };

const fmtRef = r => r ? r.split('-').reverse().join('/') : '—';

// Admissões e Rescisões: além do acompanhamento 2026 (planilha), mostram o histórico completo
// de todas as empresas e anos, calculado da base do Quadro Geral (mesmo código, sem a aba no Quadro)
const VISTA_QUADRO = { admissoes:'a', rescisoes:'r' };
const vistaDe = id => { try { return localStorage.getItem('crv-vista-' + id) || 'q'; } catch(_) { return 'q'; } };
async function telaModelo(p, cfg, acao){
  const editar = podeEditar(p);
  const vq = VISTA_QUADRO[p.id];
  const sel = vq ? vistaDe(p.id) : '';
  const nomeV = p.id === 'admissoes' ? 'Admissões' : 'Rescisões';
  moldura((vq ? `<div class="vista-seg" role="tablist"><button data-vq="q" class="${sel === 'q' ? 'on' : ''}">Todas as empresas e anos</button><button data-vq="p" class="${sel === 'p' ? 'on' : ''}">${nomeV} 2026 · acompanhamento</button></div>` : '') +
    `<div id="modelo-area" class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Abrindo o painel…</p></div>`);
  if (vq) document.querySelectorAll('.vista-seg [data-vq]').forEach(b => b.onclick = () => { try { localStorage.setItem('crv-vista-' + p.id, b.dataset.vq); } catch(_){} telaModelo(p, cfg); });
  if (vq && sel === 'q') return telaVistaQuadro(p, vq, acao);
  const meta = { set innerHTML(v){}, set textContent(v){} };   // informações do painel ficam só em Administração
  const [pac, tpl] = await Promise.all([
    sb.from('pacotes').select('referencia,conteudo,atualizado_em,atualizado_por').eq('painel', PAC_DE[p.id] || p.id).maybeSingle(),
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
    try { d.conteudo = await lerArquivoPacote(PAC_DE[p.id] || p.id, d.conteudo.arquivo); }
    catch(_) { area.innerHTML = `<div class="erro">Não consegui abrir os dados deste painel. Carregue o arquivo de dados de novo em Administração.</div>`; return; }
  }
  try {
    // ponte: o que o painel pedir ao "Claude" (salvar anotações, baixar arquivos...) vem para o app
    window.CRV_QUEM = E.perfil.nome;
    window.__CRV_PAINEL = window.CRV_PONTE.criar({ sb, painel: PAC_DE[p.id] || p.id, perfil: () => E.perfil, quem: () => E.perfil.nome,
      podeEditar: () => podeEditar(p), ehAdmin: () => ehAdmin() });
    let novos = [];
    if (PAINEIS_COM_NOVOS.includes(p.id)) {
      const cols = [].concat(COLECAO_NOVOS[p.id] || 'novos');
      const r = await sb.from('registros').select('doc_id,dados,colecao').eq('painel', p.id).in('colecao', cols).range(0, 4999);
      if (!r.error) novos = (r.data || []).filter(x => x.dados && !x.dados.excluida).map(x => cols.length > 1 ? { _id: x.doc_id, colecao: x.colecao, dados: x.dados } : { _id: x.doc_id, dados: x.dados });
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

async function telaVistaQuadro(p, vq, acao){
  const q = E.paineis.find(x => x.id === 'quadro') || { id:'quadro', nome:'Quadro Geral', frente:p.frente };
  const [pac, tpl] = await Promise.all([
    sb.from('pacotes').select('referencia,conteudo,atualizado_em,atualizado_por').eq('painel', 'quadro').maybeSingle(),
    fetch(MODELOS.quadro + '?v=' + CFG.VERSAO, { cache:'no-cache' }).then(r => r.ok ? r.text() : Promise.reject(new Error('Arquivo do painel não encontrado.'))).catch(e => ({ erro:e }))
  ]);
  const area = $('#modelo-area'); if (!area) return;
  if (pac.error || tpl.erro) { area.innerHTML = `<div class="erro">${esc(pac.error ? traduzErro(pac.error) : tpl.erro.message)}</div>`; return; }
  const d = pac.data;
  if (!d) { area.innerHTML = `${svg('planilha')}<h3>Ainda sem a base do Quadro Geral</h3><p>O histórico de todas as empresas é calculado a partir da base do Quadro Geral. ${ehAdmin() ? 'Carregue o arquivo do Quadro em <b>Administração → Painéis e frentes</b>.' : ''}</p>`; return; }
  if (d.conteudo && d.conteudo.arquivo) {
    try { d.conteudo = await lerArquivoPacote('quadro', d.conteudo.arquivo); }
    catch(_) { area.innerHTML = `<div class="erro">Não consegui abrir a base do Quadro Geral.</div>`; return; }
  }
  try {
    window.CRV_QUEM = E.perfil.nome;
    window.__CRV_PAINEL = window.CRV_PONTE.criar({ sb, painel:'quadro', perfil: () => E.perfil, quem: () => E.perfil.nome, podeEditar: () => podeEditar(q), ehAdmin: () => ehAdmin() });
    window.CRV_RECARREGAR = () => { if (location.hash.startsWith('#/p/' + encodeURIComponent(p.id))) telaPainel(p.id); };
    const tplM = tpl.replace(/<head[^>]*>/i, m => m + `<script>window.CRV_MODO_QUADRO=${JSON.stringify(vq)};<\/script>`);
    const html = montarModelo(tplM, d.conteudo, d.referencia, Object.assign({}, q, { frente: p.frente }), []);
    const url = URL.createObjectURL(new Blob([html], { type:'text/html' }));
    area.className = 'modelo-area';
    area.innerHTML = `<iframe id="modelo-frame" title="${esc(p.nome)}" src="${url}"></iframe>`;
    E.painelAberto = p.id;
    $('#modelo-frame').onload = () => setTimeout(() => URL.revokeObjectURL(url), 2000);
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
/* Logos nos documentos impressos: CRV em todos; Syspro nos documentos dos cartões Sysprocard.
   Uso nos painéis: await window.parent.CRV_PDF_LOGOS(doc,{syspro:true}) logo antes de salvar o PDF. */
const LOGOS_CACHE = {};
window.CRV_LOGO = function(nome){
  if (!LOGOS_CACHE[nome]) LOGOS_CACHE[nome] = fetch('img/' + nome + '.png').then(r => r.ok ? r.blob() : null).then(b => b && new Promise(ok => {
    const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => ok({ src: fr.result, w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => ok(null); im.src = fr.result; }; fr.onerror = () => ok(null); fr.readAsDataURL(b);
  })).catch(() => null);
  return LOGOS_CACHE[nome];
};
window.CRV_PDF_LOGOS = async function(doc, op){
  op = op || {};
  try {
    const L = [await window.CRV_LOGO('logo-crv')];
    if (op.syspro) L.push(await window.CRV_LOGO('logo-syspro'));
    const im = L.filter(Boolean); if (!im.length) return doc;
    const k = doc.internal.scaleFactor ? 72 / 25.4 / doc.internal.scaleFactor : 1; // mm -> unidade do documento
    const mm = v => v * k;
    const dir = mm(op.margem == null ? 6 : op.margem);
    const n = doc.internal.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      if (op.soPrimeira && p > 1) break;
      // da 2ª página em diante a logo fica menor, para não encostar na tabela que continua
      const h = mm(p === 1 ? (op.altura || 9) : 5.5), pad = mm(p === 1 ? 1.6 : 1), gap = mm(p === 1 ? 2.5 : 1.6), top = mm(p === 1 ? (op.topo == null ? 3 : op.topo) : 2.5);
      const ws = im.map(i => h * i.w / i.h), boxW = ws.reduce((a, b) => a + b, 0) + gap * (im.length - 1) + pad * 2, boxH = h + pad * 2;
      doc.setPage(p);
      const W = doc.internal.pageSize.getWidth();
      let x = op.esquerda ? dir : W - dir - boxW;
      doc.setFillColor(255, 255, 255); doc.setDrawColor(225, 229, 236); doc.setLineWidth(mm(0.2));
      doc.roundedRect(x, top, boxW, boxH, mm(1.5), mm(1.5), 'FD');
      x += pad;
      im.forEach((i, j) => { try { doc.addImage(i.src, 'PNG', x, top + pad, ws[j], h, 'crvlogo' + j, 'FAST'); } catch (_) {} x += ws[j] + gap; });
    }
    doc.setPage(n);
  } catch (_) {}
  return doc;
};
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
    const CPFM = dados.CPFM || {};
    DM.forEach(r => { M[txt(r[0])] = { nasc: txt(r[27] || ''), cpf: txt(CPFM[txt(r[0])] || ''), cc: (txt(r[23]) && txt(r[23]) !== '0') ? txt(r[23]) : '', ccd: txt(r[13]), nome:txt(r[1]), funcao:txt(r[2]), setor:txt(r[3]), situacao:'Desligado', vinculo:txt(r[7]), gerencia:txt(r[6]), area:txt(r[5]), cnh:txt(r[17]), admissao:txt(r[9]), deslig:txt(r[20]), empresa:txt(r[21]).replace(/\s*\(\d+\)$/, '') }; });
    const XX = Array.isArray(dados.X) && dados.X.length === dados.D.length ? dados.X : null;
    dados.D.forEach((r, i) => { M[txt(r[0])] = { nasc: XX ? txt(XX[i][0]) : '', cpf: XX ? txt(XX[i][11]) : '', cc: XX ? txt(XX[i][33]) : '', ccd: txt(r[13]), nome:txt(r[1]), funcao:txt(r[2]), setor:txt(r[3]), situacao:txt(r[8]) || 'Ativo', vinculo:txt(r[7]), gerencia:txt(r[6]), area:txt(r[5]), cnh:txt(r[17]), admissao:txt(r[9]), deslig:'', empresa:'CRV' }; });
    // departamentos (código Depto/Seção → nome), a partir dos ativos e afastados
    const DP = {};
    if (XX) dados.D.forEach((r, i) => { const cod = txt(XX[i][23]), nome = txt(r[3]); if (!cod || !nome) return;
      const o = DP[cod] || (DP[cod] = { cod, nome, area:txt(r[5]), ger:txt(r[6]), n:0, funcs:{} }); o.n++; const f = txt(r[2]); if (f) o.funcs[f] = (o.funcs[f] || 0) + 1; });
    const deptos = Object.values(DP).map(o => ({ cod:o.cod, nome:o.nome, area:o.area, ger:o.ger, n:o.n, funcs:Object.entries(o.funcs).sort((a, b) => b[1] - a[1]).map(x => x[0]) }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.cod.localeCompare(b.cod));
    _quadroBase = { mapa:M, deptos, referencia:d.referencia || '' }; _quadroBaseRef = chave;
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
/* Ocorrências de um grupo de matrículas num período: atestado/falta/suspensão (absenteísmo do Quadro) e advertências/suspensões (Sanções).
   Retorna { abs:'yyyy-mm-dd' (até quando há absenteísmo), P:{ mat:{ at:[iso], fa:[iso], su:[iso], adv:[{data,motivo}], sus:[{data,motivo,dias}] } } } */
window.CRV_OCORR = async function(mats, ini, fim){
  const M = new Set((mats || []).map(m => String(m).replace(/^0+(?=\d)/, '')));
  const P = {}; const pe = m => P[m] || (P[m] = { at:[], fa:[], su:[], adv:[], sus:[] });
  const den = d => !ini || !fim || (d >= ini && d <= fim);
  let abs = '';
  try {
    const Q = await window.CRV_DADOS('quadro'); const A = Q && Q.dados.ABSD, D = Q && Q.dados.D, DM = Q && Q.dados.DM;
    if (A && D) {
      abs = A.last || '';
      const base = Date.UTC(2026, 0, 1), iso = k => new Date(base + k * 864e5).toISOString().slice(0, 10);
      const mat = A.PR.map(x => { if (x == null || (Array.isArray(x) && typeof x[0] === 'string')) return null; const r = x >= 0 ? D[x] : (DM || [])[-x - 1]; return r ? String(r[0]) : null; });
      (A.O || []).forEach(([pi, d, t]) => { const m = mat[pi]; if (!m || !M.has(m)) return; const di = iso(d); if (!den(di)) return; pe(m)[['at','fa','su'][t] || 'at'].push(di); });
    }
  } catch(_){}
  try {
    const S = await window.CRV_DADOS('sancoes'); const DB = S && S.dados.DB;
    if (DB && Array.isArray(DB.R)) DB.R.forEach(r => { const m = String(r[1]).replace(/^0+(?=\d)/, ''); if (!M.has(m) || !r[2] || !den(r[2])) return; (r[0] ? pe(m).sus : pe(m).adv).push({ data:r[2], motivo:(DB.M || [])[r[4]] || '', dias:r[0] ? r[5] : null }); });
    const SD = await window.CRV_REGS('sancoes', 'documentos');
    (SD || []).forEach(d => { const m = String(d.mat || '').replace(/^0+(?=\d)/, ''); if (d.excluido || !M.has(m) || !d.data || !den(d.data)) return; if (d.tipo === 'adv') pe(m).adv.push({ data:d.data, motivo:d.assunto || '' }); else if (d.tipo === 'sus') pe(m).sus.push({ data:d.data, motivo:d.assunto || '', dias:d.dias || null }); });
  } catch(_){}
  Object.values(P).forEach(o => Object.values(o).forEach(a => a.sort((x, y) => String(x.data || x).localeCompare(String(y.data || y)))));
  return { abs, P };
};
/* Férias de um grupo de matrículas que caem num período (programação da planilha + programações feitas no painel de Férias).
   Retorna { mat: [{inicio, fim, dias, src}] } só com as partes dentro do período */
window.CRV_FERIAS = async function(mats, ini, fim){
  const M = new Set((mats || []).map(m => String(m).replace(/^0+(?=\d)/, ''))); const out = {};
  const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  try {
    const F = await window.CRV_DADOS('ferias'); const DATA = F && F.dados.DATA; if (!Array.isArray(DATA)) return out;
    const PR = {}; (await window.CRV_REGS('ferias', 'prog') || []).forEach(d => { if (d && d._id) PR[d._id] = d; });
    DATA.forEach(p => { const m = String(p.c); if (!M.has(m)) return;
      (p.p || []).forEach(([de, , , saldo, , nulo, plan]) => { const key = m + '_' + de; let g = PR[key] || null;
        if (!g && plan && !nulo && /^\d{4}-\d{2}-\d{2}$/.test(plan)) g = { inicio: plan, dias: Math.min(30, Math.max(5, Math.round(saldo) || 30)), src: 'planilha' };
        if (!g || g.retorno) return;
        const parts = Array.isArray(g.parcelas) && g.parcelas.length ? g.parcelas : [{ inicio: g.inicio, dias: g.dias }];
        parts.forEach(q => { if (!q || !q.inicio || !q.dias) return; const f = addD(q.inicio, (+q.dias) - 1);
          const a = q.inicio > ini ? q.inicio : ini, b = f < fim ? f : fim; if (a > b) return;
          const n = Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5) + 1;
          (out[m] = out[m] || []).push({ inicio: q.inicio, fim: f, dias: n, src: g.src || 'painel' }); }); }); });
  } catch(_){}
  return out;
};
window.CRV_REGS = async function(painel, colecao){
  try {
    const r = await sb.from('registros').select('doc_id,dados').eq('painel', painel).eq('colecao', colecao).range(0, 4999);
    return r.error ? [] : (r.data || []).map(x => Object.assign({ _id:x.doc_id }, x.dados || {}));
  } catch(_) { return []; }
};
/* banco de registros de outro painel (ex.: a fadiga grava a advertência também nas Sanções) */
window.CRV_DB_DE = function(id){ const p = (E.paineis || []).find(x => x.id === id); if (!p || !window.CRV_PONTE) return null;
  return window.CRV_PONTE.criar({ sb, painel:id, perfil:() => E.perfil, quem:() => E.perfil.nome, podeEditar:() => podeEditar(p), ehAdmin:() => ehAdmin() }).capacidade('db'); };
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
    if (DB && DB.HA && Array.isArray(DB.HA.R)) DB.HA.R.forEach(r => { if (mm(r[0]) !== mat) return;
      out.sanc.push({ data:r[1], t:'adv', sq:r[2], dias:null, ini:'', fim:'', assunto:'', motivo:DB.HA.M[r[3]] || '', cat:'anos anteriores', app:false }); });
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
  'Atendimento e escuta':          ['#283a4b','#40607b'],
  'Alojamento e transporte':       ['#363c18','#5d6427']
};
// como cada painel azul pinta a capa (os demais já têm cor própria: Unimed, Uniodonto, Sanções, Sysprocard…)
const CAPA_MODO = {
  vars:  ['absenteismo','absenteismo-gestao','admissoes','jovem','processos','quadro','rd','rescisoes'],
  band:  ['alojamentos','ferias','recepcao'],
  hd:    ['experiencia'],
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
const COLECAO_NOVOS = { sancoes:'documentos', fadiga:['novos','tratativas'] };
const mascaraCPF = c => { if (!c || !E.perfil || E.perfil.papel !== 'leitor') return c;
  return JSON.parse(JSON.stringify(c).replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/g, '***.$2.$3-**')); };
function montarModelo(tpl, conteudo, referencia, p, novos){
  conteudo = mascaraCPF(conteudo);
  const nomeOk = n => /^[A-Za-z_$][\w$]*$/.test(n);
  const base = location.href.split('#')[0].replace(/[^/]*$/, '');
  let html = tpl.split('__CRV_REFBR__').join(fmtRef(referencia)).split('__CRV_BASE__').join(base);
  const ponte = `<script>window.CRV_PAINEL_ID=${JSON.stringify(p.id)};<\/script><script>${window.CRV_PONTE.scriptPainel()}<\/script>` + (novos ? `<script>window.CRV_NOVOS=${jsValor(novos)};<\/script>` : '');
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
  const capa = cssCapa(p) + `<script defer src="${base}js/painel-filtros.js?v=${CFG.VERSAO}"><\/script>`;
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
  inp.type = 'file'; inp.multiple = !esperado; inp.accept = '.json,.zip,.xlsx,.xls,application/json,application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
  inp.onchange = () => inp.files.length && carregarPacotes([...inp.files], esperado);
  inp.click();
}

async function lerPacote(f){
  let pac;
  try { pac = JSON.parse(await f.text()); } catch(_) { throw new Error('não é um arquivo de dados do app'); }
  if (pac.tipo === 'crv-estabilidade' && Array.isArray(pac.itens)) return { estab:true, painel:'quadro', referencia: pac.gerado || '', itens: pac.itens };
  if (pac.tipo === 'crv-entrevistas' && Array.isArray(pac.itens)) return { entr:true, painel:'quadro', referencia: pac.gerado || '', itens: pac.itens };
  if (pac.tipo !== 'crv-pacote' || !(pac.dados || pac.blocos)) throw new Error('não é um arquivo de dados do app');
  return pac;
}

// respostas das entrevistas de desligamento (tabuladas): entram como registros do Quadro; não substituem o que já foi lançado ou corrigido no app
async function salvarEntrevistas(itens){
  const quem = E.perfil ? E.perfil.nome : '';
  const linhas = itens.map(it => { const id = String(it.id || ('ent-' + it.mat + '-' + (it.ped || it.dataAss || ''))).replace(/[^\w-]+/g, '_').slice(0, 90);
    return { painel:'quadro', caminho:'entrevistas_resp/' + id, colecao:'entrevistas_resp', doc_id:id, dados:{ ...it, id:undefined, lancEm:new Date().toISOString(), lancPor:quem + ' (arquivo)' }, atualizado_por:quem }; });
  for (let i = 0; i < linhas.length; i += 100) {
    const { error } = await sb.from('registros').upsert(linhas.slice(i, i + 100), { onConflict:'painel,caminho', ignoreDuplicates:true });
    if (error) throw error;
  }
  return linhas.length;
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
    if (/\.xlsx?$/i.test(f.name)) {
      // planilha original: o app converte sozinho no arquivo de dados do painel
      try { const L = await window.CRV_IMPORT.ler(f);
        L.forEach(x => { const txt = JSON.stringify(x.pac); itens.push({ f:{ name: f.name, size: txt.length }, pac:x.pac, painel:x.pac.painel, rotulo:x.rotulo }); }); }
      catch(e){ itens.push({ f, erro: e.message }); }
      continue;
    }
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
        <td>${i.rotulo ? esc(i.rotulo) + '<br><small>' + esc(fmtRef(i.pac.referencia)) + '</small>' : i.pac ? (i.pac.estab ? 'lista de estabilidade (' + i.pac.itens.length + ')' : i.pac.entr ? 'entrevistas de desligamento (' + i.pac.itens.length + ')' : fmtRef(i.pac.referencia)) : (i.zip ? 'arquivos' : '—')}</td>
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
            if (i.pac.entr) { const n2 = await salvarEntrevistas(i.pac.itens); st.innerHTML = `<span style="color:var(--cane)">✓ ${n2} entrevistas</span>`; ok++; continue; }
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
      <button class="aba ${abaAdmin==='backup'?'ativa':''}" data-aba="backup">Cópia de segurança</button>
    </div><div id="admin-corpo" class="cartao"><div class="spinner" style="margin:20px auto"></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => { abaAdmin = b.dataset.aba; telaAdmin(); });
  if (abaAdmin === 'usuarios') return adminUsuarios();
  if (abaAdmin === 'paineis') return adminPaineis();
  if (abaAdmin === 'backup') return adminBackup();
  return adminHistorico();
}

/* ---------- Cópia de segurança: tudo o que foi lançado no app (registros), bases carregadas e usuários ---------- */
async function lerTudo(tabela, campos, ordem){
  const out = []; for (let i = 0; ; i += 1000) {
    let q = sb.from(tabela).select(campos).range(i, i + 999); if (ordem) q = q.order(ordem);
    const { data, error } = await q; if (error) throw error; out.push(...(data || [])); if (!data || data.length < 1000) break; }
  return out;
}
async function ultimoBackup(){ try { const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/backup').maybeSingle(); return data && data.dados; } catch(_) { return null; } }
async function adminBackup(){
  const c = $('#admin-corpo');
  const ult = await ultimoBackup();
  const dias = ult && ult.em ? Math.floor((Date.now() - new Date(ult.em)) / 864e5) : null;
  c.innerHTML = `<div class="cartao-cab"><h3>Cópia de segurança</h3></div>
    <p style="margin-top:0">Guarda tudo o que foi <b>lançado dentro do app</b> e não existe nas planilhas: programações de férias, avaliações de experiência, entrevistas de desligamento, checklist de desligamento, RDs, sanções e treinamentos cadastrados, crachás, créditos manuais, fichas e demais anotações. Leva também a lista de bases carregadas e de usuários (sem senhas).</p>
    <div class="bk-st ${dias == null || dias > 7 ? 'alerta' : ''}">${ult && ult.em ? `Última cópia em <b>${esc(new Date(ult.em).toLocaleString('pt-BR'))}</b>${ult.por ? ' por ' + esc(ult.por) : ''} (${dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : 'há ' + dias + ' dias'}).` : 'Nenhuma cópia feita ainda.'} Recomendado: uma vez por semana.</div>
    <div class="bk-bts"><button class="btn prim" id="bk-xls">Baixar cópia em Excel</button><button class="btn borda" id="bk-json">Baixar arquivo para restaurar</button><button class="btn borda" id="bk-rest">Restaurar de um arquivo</button></div>
    <p class="bk-nota">O Excel é para consultar e guardar (uma aba por tipo de lançamento). O arquivo para restaurar devolve ao app os lançamentos que tiverem sido apagados, sem mexer no que já existe. As bases (Quadro, Férias, Unimed…) não precisam de cópia: são refeitas carregando as planilhas de novo. Os currículos em PDF ficam guardados à parte e não entram nesta cópia.</p>
    <div id="bk-msg" class="bk-msg"></div>`;
  const msg = t => { $('#bk-msg').innerHTML = t; };
  const coletar = async () => {
    msg('<span class="spinner pq"></span> Lendo os lançamentos…');
    const regs = await lerTudo('registros', 'painel,caminho,colecao,doc_id,dados,atualizado_em,atualizado_por');
    const pacs = await lerTudo('pacotes', 'painel,referencia,atualizado_em,atualizado_por,tamanho_kb');
    let perf = []; try { perf = await lerTudo('perfis', 'nome,usuario,papel,ativo,frentes'); } catch(_) { try { perf = await lerTudo('perfis', 'nome,usuario,papel,ativo'); } catch(__){} }
    return { regs: regs.filter(r => r.caminho !== 'sistema/backup'), pacs, perf };
  };
  const marcar = async (tipo, n) => { const d = { em:new Date().toISOString(), por:E.perfil.nome, tipo, n };
    try { await sb.from('registros').upsert({ painel:'quadro', caminho:'sistema/backup', colecao:'sistema', doc_id:'backup', dados:d, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' }); } catch(_){}
    try { localStorage.removeItem(centralChave()); } catch(_){} };
  const nomeP = id => (E.paineis.find(p => p.id === id) || {}).nome || id;
  const dataArq = () => new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  $('#bk-xls').onclick = async () => { try {
    const { regs, pacs, perf } = await coletar(); msg('<span class="spinner pq"></span> Montando o Excel…');
    const wb = XLSX.utils.book_new(), usados = new Set();
    const nomeAba = t => { let n = t.replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31).trim(); let k = 2; while (usados.has(n)) n = t.slice(0, 28) + ' ' + (k++); usados.add(n); return n; };
    const resumo = [['Painel', 'Tipo de lançamento', 'Quantidade', 'Último lançamento']];
    const grupos = new Map(); regs.forEach(r => { const k = r.painel + '|' + r.colecao; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(r); });
    [...grupos].sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, L]) => { const [pn, col] = k.split('|');
      const chaves = []; L.forEach(r => Object.keys(r.dados || {}).forEach(c => { if (!chaves.includes(c)) chaves.push(c); }));
      const cel = v => v == null ? '' : typeof v === 'object' ? JSON.stringify(v).slice(0, 32000) : v;
      const aoa = [['Identificador', 'Atualizado em', 'Atualizado por'].concat(chaves)].concat(L.map(r => [r.doc_id, r.atualizado_em ? new Date(r.atualizado_em).toLocaleString('pt-BR') : '', r.atualizado_por || ''].concat(chaves.map(c => cel(r.dados[c])))));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), nomeAba(nomeP(pn) + ' - ' + col));
      resumo.push([nomeP(pn), col, L.length, L.map(r => r.atualizado_em || '').sort().pop() ? new Date(L.map(r => r.atualizado_em || '').sort().pop()).toLocaleString('pt-BR') : '']); });
    const ws0 = XLSX.utils.aoa_to_sheet(resumo); ws0['!cols'] = [{ wch:36 }, { wch:24 }, { wch:12 }, { wch:20 }];
    const wb2 = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb2, ws0, 'Resumo');
    wb.SheetNames.forEach(n => XLSX.utils.book_append_sheet(wb2, wb.Sheets[n], n));
    XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([['Painel', 'Dados de', 'Carregado em', 'Por']].concat(pacs.map(p => [nomeP(p.painel), fmtRef(p.referencia), p.atualizado_em ? new Date(p.atualizado_em).toLocaleString('pt-BR') : '', p.atualizado_por || '']))), 'Bases carregadas');
    if (perf.length) XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([['Nome', 'Usuário', 'Papel', 'Ativo', 'Frentes']].concat(perf.map(u => [u.nome, u.usuario, nomePapel(u.papel), u.ativo ? 'Sim' : 'Não', Array.isArray(u.frentes) ? u.frentes.join(', ') : (u.frentes || '')]))), 'Usuários');
    baixar(new Blob([XLSX.write(wb2, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Copia de seguranca Gestao de Pessoas ' + dataArq() + '.xlsx');
    await marcar('excel', regs.length); registrar('quadro', 'cópia de segurança (Excel)', regs.length + ' lançamentos');
    msg(`<b style="color:var(--cane)">Cópia gerada:</b> ${regs.length} lançamentos em ${grupos.size} tipos. Guarde o arquivo numa pasta segura (ex.: OneDrive da empresa).`); adminBackupStatus();
  } catch(e) { msg('<span style="color:var(--coral)">Não consegui gerar a cópia: ' + esc(traduzErro(e)) + '</span>'); } };
  $('#bk-json').onclick = async () => { try {
    const { regs, pacs, perf } = await coletar();
    const arq = { tipo:'crv-backup', versao:1, gerado:new Date().toISOString(), por:E.perfil.nome, registros:regs, bases:pacs, usuarios:perf };
    baixar(new Blob([JSON.stringify(arq)], { type:'application/json' }), 'Restauracao Gestao de Pessoas ' + dataArq() + '.json');
    await marcar('arquivo', regs.length); registrar('quadro', 'cópia de segurança (arquivo)', regs.length + ' lançamentos');
    msg(`<b style="color:var(--cane)">Arquivo gerado:</b> ${regs.length} lançamentos. Guarde junto com o Excel.`); adminBackupStatus();
  } catch(e) { msg('<span style="color:var(--coral)">Não consegui gerar: ' + esc(traduzErro(e)) + '</span>'); } };
  $('#bk-rest').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; let arq;
      try { arq = JSON.parse(await f.text()); } catch(_) { return msg('<span style="color:var(--coral)">Arquivo inválido.</span>'); }
      if (arq.tipo !== 'crv-backup' || !Array.isArray(arq.registros)) return msg('<span style="color:var(--coral)">Este não é um arquivo de restauração do app.</span>');
      const atuais = new Set((await lerTudo('registros', 'painel,caminho')).map(r => r.painel + '|' + r.caminho));
      const falt = arq.registros.filter(r => !atuais.has(r.painel + '|' + r.caminho));
      if (!falt.length) return msg(`Nada a restaurar: os ${arq.registros.length} lançamentos da cópia de ${esc(new Date(arq.gerado).toLocaleString('pt-BR'))} já estão no app.`);
      msg(`A cópia de ${esc(new Date(arq.gerado).toLocaleString('pt-BR'))} tem <b>${falt.length}</b> lançamento(s) que não estão mais no app. <button class="btn prim peq" id="bk-ok">Restaurar esses ${falt.length}</button>`);
      $('#bk-ok').onclick = async () => { try { for (let i = 0; i < falt.length; i += 100) {
          const { error } = await sb.from('registros').upsert(falt.slice(i, i + 100).map(r => ({ painel:r.painel, caminho:r.caminho, colecao:r.colecao, doc_id:r.doc_id, dados:r.dados, atualizado_por:(r.atualizado_por || '') + ' (restaurado)' })), { onConflict:'painel,caminho', ignoreDuplicates:true });
          if (error) throw error; }
        registrar('quadro', 'restaurou cópia de segurança', falt.length + ' lançamentos'); msg(`<b style="color:var(--cane)">${falt.length} lançamento(s) restaurado(s).</b>`);
      } catch(e) { msg('<span style="color:var(--coral)">Não consegui restaurar: ' + esc(traduzErro(e)) + '</span>'); } };
    }; inp.click(); };
  async function adminBackupStatus(){ const u = await ultimoBackup(); const el = c.querySelector('.bk-st'); if (el && u) { el.classList.remove('alerta'); el.innerHTML = `Última cópia em <b>${esc(new Date(u.em).toLocaleString('pt-BR'))}</b>${u.por ? ' por ' + esc(u.por) : ''} (hoje). Recomendado: uma vez por semana.`; } }
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
  c.innerHTML = `<div class="cartao-cab"><h3>Painéis do app</h3><button class="btn prim" id="p-lote">Carregar planilhas ou arquivos de dados</button></div>
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
  const so = window.__histExp; const L = so ? data.filter(h => h.acao === 'exportou arquivo' || /^exportou/.test(h.acao || '')) : data;
  c.innerHTML = `<div class="cartao-cab"><h3>Últimas ações</h3><div class="vista-seg" style="margin:0;box-shadow:none"><button data-hx="0" class="${so ? '' : 'on'}">Todas</button><button data-hx="1" class="${so ? 'on' : ''}">Só exportações (PDF e Excel)</button></div></div>
    ${L.length ? `<div class="tabela-env"><table class="tab"><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Painel</th><th>Detalhe</th></tr></thead><tbody>
    ${L.map(h=>`<tr style="cursor:default"><td>${fmtData(h.feito_em)}</td><td>${esc(h.usuario)}</td><td>${esc(h.acao)}</td><td>${esc(h.painel?nomeP(h.painel):'—')}</td><td>${esc(h.detalhe)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="vazio">Nenhuma ação registrada ainda.</p>'}`;
  c.querySelectorAll('[data-hx]').forEach(b => b.onclick = () => { window.__histExp = b.dataset.hx === '1'; adminHistorico(); });
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
