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
  'Gestão de Colaboradores':         { cor:'#24427c', ic:'pessoas',   desc:'Quadro, admissões, rescisões e experiência' },
  'Seleção e Perfil Profissional':              { cor:'#1f8a8a', ic:'lupa',      desc:'Recrutamento, seleção e perfil' },
  'Absenteísmo e Férias':           { cor:'#e9a23b', ic:'calendario',desc:'Absenteísmo, férias e sanções' },
  'Gestão de Benefícios':                    { cor:'#2e8a57', ic:'presente',  desc:'VA, plano de saúde, odonto e farmácia' },
  'Programa Jovem Aprendiz':                { cor:'#7a4fb5', ic:'capelo',    desc:'Programa Conexão Aprendiz' },
  'T&D | Desenvolvimento de Pessoas': { cor:'#d4573f', ic:'trofeu',    desc:'Treinamentos, pesquisas e lideranças' },
  'Ocorrências e Relações Trabalhistas': { cor:'#a1341f', ic:'alerta',    desc:'RD, fadiga, processos e sanções' },
  'Atendimento e Ouvidoria':          { cor:'#4a6a8a', ic:'balcao',    desc:'Recepção do RH e ouvidorias' },
  'Alojamentos e Transporte':       { cor:'#8a7a2e', ic:'onibus',    desc:'Alojamentos e ônibus' },
  'Horas Extras e Gratificações':   { cor:'#5d6a85', ic:'pasta',     desc:'Gratificação BPP, horas extras e gratificação' }
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
const ehAdmin = () => E.perfil?.papel === 'admin';   // administradora principal: importa bases, mexe na estrutura, usuários e configurações
const ehRH = () => ['admin', 'rh'].includes(E.perfil?.papel);
const podeImportar = () => E.perfil?.papel === 'admin' || (!!E.perfil?.importa && ['rh', 'editor'].includes(E.perfil?.papel));   // atualiza as bases dos painéis (planilhas)   // equipe RH: vê tudo e lança tudo, sem importar bases nem mudar estrutura
/* menu do gestor: mesmas frentes e cores do app, só com o que ele vê da equipe */
const GESTOR_MENU = [
  ['Gestão de Colaboradores', [['eq', 'Equipe'], ['mov', 'Admissões e saídas'], ['pv', 'Quadro x previsto'], ['exp', 'Período de experiência'], ['nov', 'Novos colaboradores']]],
  ['Absenteísmo e Férias', [['fer', 'Férias'], ['freq', 'Frequência']]],
  ['Ocorrências e Relações Trabalhistas', [['disc', 'Disciplina e RD'], ['mdisc', 'Medidas disciplinares']]],
  ['Seleção e Perfil Profissional', [['perfil', 'Perfil profissional']]],
  ['T&D | Desenvolvimento de Pessoas', [['cr', 'Em treinamento']]],
  ['Alojamentos e Transporte', [['alo', 'Alojamento']]],
  ['Atendimento e Ouvidoria', [['resp', 'Respostas do RH'], ['env', 'Meus envios ao RH']]] ];
const nomePapel = p => ({admin:'Administrador principal', rh:'Equipe RH', editor:'Editor', leitor:'Leitor', gestor:'Gestor de área'}[p] || p);
/* assistente (secretária) de gestor: acesso de gestor ligado a um gestor responsável; vê a mesma equipe e lança em nome dele.
   O vínculo fica em perfis.frentes (que o gestor não usa): 'assist:<user_id do gestor>' e 'assistnome:<nome do gestor>'. */
const assistDe = u => { const f = (u && u.papel === 'gestor' && Array.isArray(u.frentes)) ? u.frentes : []; const id = (f.find(x => /^assist:/.test(x)) || '').slice(7); return id ? { id, nome:(f.find(x => /^assistnome:/.test(x)) || '').slice(11) } : null; };
window.CRV_ASSIST = () => assistDe(E.perfil);
const papelDe = u => { const a = assistDe(u); return a ? 'Assistente do gestor' + (a.nome ? ' ' + nomeBonito(a.nome) : '') : nomePapel(u && u.papel); };

function toast(msg, erro=false){
  const t = document.createElement('div');
  t.className = 'toast' + (erro?' erro-t':'');
  t.textContent = msg;
  $('#toast').appendChild(t);
  setTimeout(()=>t.remove(), erro?6000:3200);
}

function traduzErro(e){
  { const m0 = String((e && (e.message || e.error_description || e.details)) || e || '').toLowerCase(); if (m0.includes('importa') && (m0.includes('column') || m0.includes('coluna'))) return 'Falta preparar o banco para liberar a importação de planilhas: rode o arquivo 09_importar_planilhas.sql no Supabase (SQL Editor).'; }
  const m = (e?.message || String(e||'')).toLowerCase();
  if (m.includes('invalid login')) return 'Usuário ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('duplicate key')) return 'Esse usuário já existe. Escolha outro nome de usuário.';
  if (m.includes('different from the old') || m.includes('same_password') || m.includes('same password')) return 'A nova senha precisa ser diferente da senha atual.';
  if (m.includes('session missing') || m.includes('session not found') || m.includes('jwt expired') || m.includes('invalid jwt') || m.includes('reauthenticat')) return 'Sua sessão expirou. Clique em Sair, entre de novo com a senha atual e troque a senha logo em seguida.';
  if (m.includes('password should be at least') || m.includes('weak')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (m.includes('email not confirmed')) return 'Login ainda não liberado. No Supabase, desative a opção "Confirm email" (veja o passo a passo).';
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Cadastro desativado no Supabase. Ative "Allow new users to sign up" (veja o passo a passo).';
  if (m.includes('rate limit')) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão com o servidor. Verifique a internet.';
  if (m.includes('row-level security') || m.includes('permission denied')) return 'Você não tem permissão para essa ação.';
  if (m.includes('gestor_envios_tipo_check')) return 'Este tipo de envio ainda não foi liberado no banco: peça ao RH para rodar o arquivo 08_parecer_perfil.sql no Supabase.';
  if ((m.includes('areas') && m.includes('column')) || m.includes('area_dados') || m.includes('gestor_envios') || m.includes('perfis_papel_check')) return 'Falta preparar o banco para o perfil de gestor: rode o arquivo 04_gestor.sql no Supabase (SQL Editor).';
  if (m.includes('paineis_ver') || m.includes('paineis_editar')) return 'Falta preparar o banco para liberar painéis um a um: rode o arquivo 05_equipe_rh.sql atualizado no Supabase.';
  if (m.includes('perfis_papel_check') && m.includes('rh')) return 'Falta preparar o banco para a Equipe RH: rode o arquivo 05_equipe_rh.sql no Supabase.';
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
    try { const kk = 'crv-ent-' + perfil.user_id; if (!sessionStorage.getItem(kk)) { sessionStorage.setItem(kk, '1'); const mob = /Mobi|Android|iPhone/i.test(navigator.userAgent), inst = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches; logAcesso('entrou', null, (mob ? 'celular' : 'computador') + (inst ? ' · app instalado' : ' · navegador')); } } catch(_){}
    rota();
    if (window.CRV_PADRAO && perfil.papel !== 'gestor') setTimeout(() => window.CRV_PADRAO.carregar().catch(() => {}), 3000);
    /* respostas do RH e documentos dos gestores: publica os documentos do painel Sanções e mantém os contadores do gestor */
    try { if (window.CRV_RESP_INIT && (ehRH() || perfil.papel === 'gestor')) { RESP(); if (perfil.papel === 'gestor') setTimeout(() => RESP().iniciarGestor(), 1500); } } catch(_){}
    if (ehAdmin()) setTimeout(() => GESTOR().gerar(false).catch(() => {}), 8000);
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
  window._temSal = (p.data || []).some(x => x.id === 'salarios'); E.paineis = (p.data || []).filter(x => x.id !== 'absenteismo-gestao' && x.id !== 'nr1' && x.id !== 'salarios'); E.paineis.forEach(x => { if (x.id === 'absenteismo') x.nome = String(x.nome || '').replace(/\s*·\s*Controle RH\s*$/i, ''); }); // NR-1 retirado por enquanto (out/2026); os registros continuam guardados // R&S fica dentro do Banco de Currículos; Absenteísmo Gestão foi retirado (fica só o do RH)
  // nomes dos painéis (out/2026, tabela da Scarlatt): o administrador grava no banco
  { const NOMES = { quadro:'Quadro de Colaboradores', onboarding:'Integração de Colaboradores', rescisoes:'Desligamentos', risco:'Risco de Desligamento', pesquisas:'Pesquisas com Colaboradores', sysprocard:'Sysprocard', ouvidorias:'Ouvidoria', recepcao:'Atendimento do RH', onibus:'Transporte de Colaboradores', 'servicos-gerais':'Serviços Gerais — Extras e Gratificações' };
    window.CRV_NOMES = NOMES;
    E.paineis.forEach(x => { const n = NOMES[x.id]; if (n && x.nome !== n) { x.nome = n; if (E.perfil && E.perfil.papel === 'admin') sb.from('paineis').update({ nome:n }).eq('id', x.id).then(() => {}, () => {}); } }); }
  // Recrutamento e Seleção vira painel próprio (com "Em contratação"); o Banco de Currículos sai do menu
  { const cv = E.paineis.find(x => x.id === 'curriculos'), rs = E.paineis.find(x => x.id === 'rs');
    if (rs) { const alvo = { nome:'Recrutamento e Seleção', frente: cv ? cv.frente : 'Seleção e Perfil Profissional', nivel: cv ? cv.nivel : rs.nivel, ordem: cv ? cv.ordem : rs.ordem };
      const dif = Object.keys(alvo).some(k => rs[k] !== alvo[k]); Object.assign(rs, alvo);
      if (dif && E.perfil && E.perfil.papel === 'admin') sb.from('paineis').update(alvo).eq('id', 'rs').then(() => {}, () => {}); }
    else if (cv && E.perfil && E.perfil.papel === 'admin') { const n = { id:'rs', frente:cv.frente, nome:'Recrutamento e Seleção', nivel:cv.nivel, ordem:cv.ordem };
      sb.from('paineis').insert(n).then(() => {}, () => {}); E.paineis.push(n); } }
  // Onboarding (integração de novos): painel do app, a partir das admissões do Quadro
  if (!E.paineis.some(x => x.id === 'onboarding') && E.perfil && E.perfil.papel === 'admin') { const n = { id:'onboarding', frente:'Gestão de Colaboradores', nome:'Integração de Colaboradores', nivel:'controlado', ordem:12 };
    sb.from('paineis').insert(n).then(() => {}, () => {}); E.paineis.push(n); }
  // Avaliação de desempenho dos ativos (mesmo formulário da experiência): painel do app
  // Comunicação de Justa Causa (restrita ao RH): ao lado das Sanções Disciplinares
  if (!E.paineis.some(x => x.id === 'justa-causa') && E.perfil && E.perfil.papel === 'admin') { const sa = E.paineis.find(x => x.id === 'sancoes'); const n = { id:'justa-causa', frente:'Ocorrências e Relações Trabalhistas', nome:'Comunicação de Justa Causa', nivel:'restrito', ordem:Math.round(sa ? +sa.ordem : 60) + 1 };
    const { error:eJ } = await sb.from('paineis').insert(n); if (eJ) console.warn('painel justa-causa', eJ); E.paineis.push(n); }
  // Aproveitamento pós-programa (Jovem Aprendiz): ao lado dos painéis do João Bittar e da RENAPSI
  if (!E.paineis.some(x => x.id === 'aprendiz-pos') && E.perfil && E.perfil.papel === 'admin') { const rj = E.paineis.find(x => x.id === 'renapsi') || E.paineis.find(x => x.id === 'jovem'); const n = { id:'aprendiz-pos', frente:(rj && rj.frente) || 'Programa Jovem Aprendiz', nome:'Aproveitamento pós-programa', nivel:'controlado', ordem:Math.round(rj ? +rj.ordem : 50) + 1 };
    const { error:eA } = await sb.from('paineis').insert(n); if (eA) console.warn('painel aprendiz-pos', eA); E.paineis.push(n); }
  if (!E.paineis.some(x => x.id === 'desempenho') && E.perfil && E.perfil.papel === 'admin') { const n = { id:'desempenho', frente:'Gestão de Colaboradores', nome:'Avaliação de Desempenho', nivel:'controlado', ordem:13 };
    sb.from('paineis').insert(n).then(() => {}, () => {}); E.paineis.push(n); }
  // Risco de saída: painel do app, calculado a partir do Quadro; restrito
  if (!E.paineis.some(x => x.id === 'risco') && E.perfil && E.perfil.papel === 'admin') { const n = { id:'risco', frente:'Gestão de Colaboradores', nome:'Risco de Desligamento', nivel:'restrito', ordem:16 };
    sb.from('paineis').insert(n).then(() => {}, () => {}); E.paineis.push(n); }
  // Salários: guardados num painel restrito que não aparece no menu; o banco só entrega para a equipe RH (admin e rh)
  if (!window._temSal && E.perfil && E.perfil.papel === 'admin') { window._temSal = true; sb.from('paineis').insert({ id:'salarios', frente:'Gestão de Colaboradores', nome:'Salários (restrito)', nivel:'restrito', ordem:99 }).then(() => {}, () => {}); }
  // organização do menu (out/2026): frentes renomeadas e painéis que mudaram de lugar; o administrador grava no banco
  { const REN = { 'Outros controles':'Horas Extras e Gratificações', 'RH externo':'Alojamentos e Transporte', 'Atendimento':'Atendimento e Ouvidoria', 'Treinamento e liderança':'T&D | Desenvolvimento de Pessoas', 'Ocorrências, risco e jurídico':'Ocorrências e Relações Trabalhistas', 'Atração e perfil':'Seleção e Perfil Profissional', 'Quadro e movimentação':'Gestão de Colaboradores', 'Recrutamento e Seleção':'Seleção e Perfil Profissional', 'Frequência e férias':'Absenteísmo e Férias', 'Benefícios':'Gestão de Benefícios', 'Jovem Aprendiz':'Programa Jovem Aprendiz', 'T&D | Pessoas e Desenvolvimento':'T&D | Desenvolvimento de Pessoas', 'Gestão de Ocorrências':'Ocorrências e Relações Trabalhistas', 'Atendimento e escuta':'Atendimento e Ouvidoria', 'Alojamento e transporte':'Alojamentos e Transporte', 'Remuneração e gratificações':'Horas Extras e Gratificações' };
    const MOV = { sancoes:'Ocorrências e Relações Trabalhistas', ouvidorias:'Atendimento e Ouvidoria' };
    const mud = [];
    E.paineis.forEach(x => { const nf = MOV[x.id] || REN[x.frente]; if (nf && nf !== x.frente) { x.frente = nf; mud.push(x); } });
    if (mud.length && E.perfil && E.perfil.papel === 'admin') mud.forEach(x => sb.from('paineis').update({ frente: x.frente }).eq('id', x.id).then(() => {}, () => {}));
    // quem tinha acesso a uma frente renomeada continua com acesso (Sanções e Ouvidorias são restritas: só administradores)
    const ajF = L => { if (!Array.isArray(L)) return L; const o = new Set(L.map(f => REN[f] || f)); return [...o]; };
    if (E.perfil && Array.isArray(E.perfil.frentes)) E.perfil.frentes = ajF(E.perfil.frentes);
    if (E.perfil && E.perfil.papel === 'admin') { try { if (!localStorage.getItem('crv-mig-frentes-2510e')) sb.from('perfis').select('user_id,frentes').then(({ data }) => { (data || []).forEach(u => { const n = ajF(u.frentes || []); if (JSON.stringify(n) !== JSON.stringify(u.frentes || [])) sb.from('perfis').update({ frentes:n }).eq('user_id', u.user_id).then(() => {}, () => {}); }); try { localStorage.setItem('crv-mig-frentes-2510e', '1'); } catch(_){} }, () => {}); } catch(_){} } }
  // nome padrão do Jovem Aprendiz (Instituto João Bittar), separado do RENAPSI
  const jv = E.paineis.find(x => x.id === 'jovem');
  if (jv && jv.nome === 'Jovem Aprendiz') {
    jv.nome = 'Jovem Aprendiz João Bittar';
    if (E.perfil && E.perfil.papel === 'admin') sb.from('paineis').update({ nome: jv.nome }).eq('id', 'jovem').then(() => {}, () => {});
  }
  // painéis novos que ainda não existem no banco: o administrador cria na hora
  const sp = E.paineis.find(x => x.id === 'sysprocard');
  const NOVOS = [
    { id:'sysprocard-credito', frente:'Gestão de Benefícios', nome:'Crédito manual Sysprocard', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.05 },
    { id:'cartao-alimentacao', frente:'Gestão de Benefícios', nome:'Cartão Alimentação', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.1 },
    { id:'cartao-convenio',    frente:'Gestão de Benefícios', nome:'Cartão Convênio',    nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.2 },
    { id:'cartao-premium',     frente:'Gestão de Benefícios', nome:'Cartão Premium',     nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.3 },
    { id:'cartao-adm',         frente:'Gestão de Benefícios', nome:'Cartão Convênio ADM', nivel:'controlado', ordem:(sp ? sp.ordem : 40) + 0.4 },
    { id:'servicos-gerais',    frente:'Horas Extras e Gratificações', nome:'Serviços Gerais — Extras e Gratificações', nivel:'controlado', ordem:90 },
    { id:'clube',              frente:'Gestão de Benefícios', nome:'Capinópolis Clube', nivel:'controlado', ordem:Math.round(+(E.paineis.find(x => x.id === 'uniodonto') || {}).ordem || 45) + 1 }
  ].filter(n => !E.paineis.some(x => x.id === n.id));
  if (NOVOS.length && E.perfil && E.perfil.papel === 'admin') {
    const { error:eN } = await sb.from('paineis').insert(NOVOS.map((n, i) => ({ ...n, ordem: Math.round((n.id.startsWith('cartao-') || n.id === 'sysprocard-credito') ? (sp ? +sp.ordem : 40) + 1 + i : +n.ordem) }))); if (eN) console.warn('painéis novos', eN);
    const r2 = await sb.from('paineis').select('*').order('ordem');
    if (!r2.error) E.paineis = (r2.data || []).filter(x => x.id !== 'absenteismo-gestao' && x.id !== 'salarios'); E.paineis.forEach(x => { if (window.CRV_NOMES && window.CRV_NOMES[x.id]) x.nome = window.CRV_NOMES[x.id]; if (x.id === 'absenteismo') x.nome = String(x.nome || '').replace(/\s*·\s*Controle RH\s*$/i, ''); });
  }
  // os cartões ficam logo abaixo do Sysprocard
  if (sp) { const ix = E.paineis.indexOf(sp); const OC = ['sysprocard-credito','cartao-alimentacao','cartao-convenio','cartao-adm','cartao-premium']; const cs = E.paineis.filter(x => OC.includes(x.id)).sort((a,b) => OC.indexOf(a.id) - OC.indexOf(b.id));
    if (cs.length) { E.paineis = E.paineis.filter(x => !OC.includes(x.id)); E.paineis.splice(E.paineis.indexOf(E.paineis.find(x => x.id === 'sysprocard')) + 1, 0, ...cs); } }
  E.metas = {};
  (m.data || []).forEach(r => E.metas[r.painel] = r);
  (k.data || []).forEach(r => E.metas[r.painel] = { ...r, linhas:null });
  if (E.metas.sysprocard && !E.metas['sysprocard-credito']) E.metas['sysprocard-credito'] = E.metas.sysprocard;
}

const porPainel = (k, p) => (E.perfil && Array.isArray(E.perfil[k]) ? E.perfil[k] : []).includes(p.id);
function podeVer(p){ if (!E.perfil) return false; if (ehRH()) return true; if (E.perfil.papel !== 'gestor' && (porPainel('paineis_ver', p) || porPainel('paineis_editar', p))) return true; return p.nivel !== 'restrito' && (E.perfil.frentes||[]).includes(p.frente); }
function podeEditar(p){ if (!E.perfil) return false; if (ehRH()) return true; if (E.perfil.papel !== 'gestor' && porPainel('paineis_editar', p)) return true; return E.perfil.papel === 'editor' && p.nivel !== 'restrito' && (E.perfil.frentes||[]).includes(p.frente); }

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

async function sair(){ try { await logAcesso('saiu'); } catch(_){} await sb.auth.signOut(); E.sessao=null; E.perfil=null; location.hash=''; telaLogin(); }

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
  const temQuadro = (() => { const q = E.paineis.find(x => x.id === 'quadro'); return !!(q && podeVer(q)); })();   // ficha e consulta usam o Quadro Geral
  const visiveis = E.paineis.filter(p => podeVer(p) && p.id !== 'curriculos' && !(SYSG.includes(p.id) && E.paineis.some(q => q.id === 'sysprocard' && podeVer(q))));
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
        ${p.papel === 'gestor' ? '' : `<button class="lat-item ${h==='#/'||h===''?'ativo':''}" data-ir="#/">${svg('casa')}<span>Visão Geral</span></button><button class="lat-item ${h==='#/organograma'?'ativo':''}" data-ir="#/organograma"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-2h14v2"/></svg><span>Organograma do RH</span></button>`}
        ${p.papel === 'gestor' ? `<button class="lat-item ${h==='#/'||h===''?'ativo':''}" data-ir="#/">${svg('casa')}<span>Minha equipe</span></button>
        <div class="lat-sec">Painéis da equipe</div>
        ${GESTOR_MENU.map(([f, itens]) => { const cfg = FRENTES[f] || { cor:'#24427c', ic:'pessoas' }; const aqui = itens.some(([k]) => h === '#/eq/' + k); const ab = aqui || abertas['g:' + f];
          return `<div class="lat-grupo ${ab ? 'aberto' : ''}" data-frente="${esc('g:' + f)}"><button class="lat-frente ${aqui ? 'atual' : ''}" aria-expanded="${ab ? 'true' : 'false'}"><span class="lat-ic" style="background:${cfg.cor}">${svg(cfg.ic, '#fff')}</span><span class="lat-nome">${esc(f)}</span><span class="lat-seta">${CHEV}</span></button>
            <div class="lat-sub">${itens.map(([k, n]) => `<button class="lat-painel ${h === '#/eq/' + k ? 'ativo atual' : ''}" data-ir="#/eq/${k}" data-busca="${esc(n.toLowerCase())}" style="--cor:${cfg.cor}"><span class="lat-pn">${esc(n)}</span></button>`).join('')}</div></div>`; }).join('')}` : `
        <div class="lat-pgrupo lat-cgrupo ${h==='#/central'||h==='#/desligamento'||h==='#/bases'||h==='#/envios'||h==='#/cadastros'||h.startsWith('#/respostas')||subAbertos.__central?'aberto':''}" data-pid="__central">
          <div class="lat-plinha"><button class="lat-item ${h==='#/central'?'ativo':''}" data-ir="#/central"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg><span>Central de Rotinas do RH</span></button><button class="lat-pseta" aria-label="Mostrar opções da Central de Rotinas do RH" aria-expanded="${h==='#/desligamento'||h==='#/bases'||h==='#/envios'?'true':'false'}">${CHEV}</button></div>
          <div class="lat-psub"><button class="lat-acao ${h==='#/desligamento'?'ativo':''}" data-ir="#/desligamento" style="--cor:var(--coral)"><i>${IA('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>')}</i><span>Conferência de Desligamentos</span></button><button class="lat-acao ${h==='#/bases'?'ativo':''}" data-ir="#/bases" style="--cor:var(--cane)"><i>${IA('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>')}</i><span>Qualidade dos Dados</span></button>${ehRH() ? `<button class="lat-acao ${h==='#/cadastros'?'ativo':''}" data-ir="#/cadastros" style="--cor:#7b3fa0"><i>${IA('<path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h10v4H4z"/>')}</i><span>Cadastros do RH</span></button>` : ''}${ehRH() ? `<button class="lat-acao ${h==='#/envios'?'ativo':''}" data-ir="#/envios" style="--cor:#24427c"><i>${IA('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>')}</i><span>Envios dos Gestores</span></button>` : ''}${ehRH() ? `<button class="lat-acao ${h.startsWith('#/respostas')?'ativo':''}" data-ir="#/respostas" style="--cor:#b5731a"><i>${IA('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>')}</i><span>Documentos com os gestores</span></button>` : ''}</div>
        </div>
        ${temQuadro ? `<button class="lat-item ${h.startsWith('#/ficha')?'ativo':''}" data-ir="#/ficha"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-1.8 2-2.7 3.5-2.7s2.9.9 3.5 2.7M14 9h4M14 13h4"/></svg><span>Perfil do Colaborador</span></button>` : ''}
        ${temQuadro ? `<button class="lat-item ${h==='#/consulta'?'ativo':''}" data-ir="#/consulta"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M20 20l-5.6-5.6M8 10h4M10 8v4"/></svg><span>Consulta de Candidatos</span></button>` : ''}
        ${podeImportar() && !ehAdmin() ? `<button class="lat-item ${h==='#/importar'?'ativo':''}" data-ir="#/importar"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg><span>Importar planilhas</span></button>` : ''}
        ${ehRH() ? `<button class="lat-item ${h==='#/relatorio'?'ativo':''}" data-ir="#/relatorio"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 17v-3M12 17v-6M15 17v-2"/></svg><span>Relatórios Gerenciais</span></button>` : ''}
        <div class="lat-busca"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="lat-q" type="search" placeholder="Buscar painel ou ação" autocomplete="off" aria-label="Buscar painel"></div>
        <div class="lat-sec">Frentes</div>
        <div class="lat-vazio" id="lat-vazio" hidden>Nenhum painel com esse nome.</div>
        ${frentes.map(f => { const cfg = FRENTES[f] || FRENTES['Horas Extras e Gratificações']; return `
          <div class="lat-grupo ${abertas[f]?'aberto':''}" data-frente="${esc(f)}">
            <button class="lat-frente ${f===frenteAtual?'atual':''}" aria-expanded="${abertas[f]?'true':'false'}"><span class="lat-ic" style="background:${cfg.cor}">${svg(cfg.ic,'#fff')}</span><span class="lat-nome">${esc(f)}</span><span class="lat-seta">${CHEV}</span></button>
            <div class="lat-sub">${grupos[f].map(x => itemPainel(x, cfg)).join('')}</div>
          </div>`; }).join('')}
        `}
        <div class="lat-sec">Conta</div>
        ${ehAdmin() ? `<button class="lat-item ${h==='#/admin'?'ativo':''}" data-ir="#/admin">${svg('engrenagem')}<span>Administração</span></button>` : ''}
        <button class="lat-item ${h==='#/conta'?'ativo':''}" data-ir="#/conta">${svg('usuario')}<span>Minha conta</span></button>
        <button class="lat-item" id="m-instalar">${svg('baixar')}<span>Instalar o app</span></button>
      </nav>
      <div class="lat-pe">
        <div class="lat-av">${esc(iniciais(p.nome))}</div>
        <div class="lat-quem"><b>${esc(nomeBonito(p.nome))}</b><span>${esc(papelDe(p))} · v${esc(CFG.VERSAO)}</span></div>
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
  logAcesso('abriu', ondeDe(h));
  if (E.perfil.papel === 'gestor') { if (h === '#/conta') return telaConta();
    if (window.CRV_RESP_INIT && h === '#/eq/resp') return RESP().telaResp(false).then(() => RESP().badges()).catch(e => console.error(e));
    if (window.CRV_RESP_INIT && h === '#/eq/mdisc') return RESP().telaDocsGestor().then(() => RESP().badges()).catch(e => console.error(e));
    /* se algo falhar ao montar a tela, mostra o erro em vez de ficar carregando para sempre */
    return Promise.resolve().then(() => GESTOR().tela(h.startsWith('#/eq/') ? h.slice(5) : '')).then(() => { if (window.CRV_RESP_INIT) RESP().iniciarGestor().then(() => { if (h === '#/' || h === '' || h === '#') RESP().porFaixa(); }); }).catch(e => { console.error(e); const c = $('#gs-corpo') || $('#app'); if (c) c.innerHTML = `<div class="cartao vazio"><h3>Não consegui abrir a sua equipe</h3><p>Atualize a página. Se continuar, avise a Gestão de Pessoas. Detalhe: ${esc(e && e.message || String(e))}</p></div>`; }); }
  if (h.startsWith('#/p/')) { const [id, acao] = h.slice(4).split('/'); return telaPainel(decodeURIComponent(id), acao || ''); }
  if (h === '#/admin' && ehAdmin()) return telaAdmin();
  if (h === '#/importar' && podeImportar()) return telaImportar();
  if (h === '#/central') return telaCentral();
  if (h === '#/ficha' || h.startsWith('#/ficha/')) return telaFicha(h.split('/')[2] || '');
  if (h === '#/consulta') return telaConsulta();
  if (h === '#/relatorio') return REL().tela();
  if (h === '#/bases') return BASES().tela();
  if (h === '#/cadastros' && ehRH()) return CADS().tela();
  if (h === '#/organograma' && E.perfil && E.perfil.papel !== 'gestor') return ORG().tela();
  if (h === '#/envios' && ehRH()) return GESTOR().telaEnvios();
  if (h.startsWith('#/respostas') && ehRH() && window.CRV_RESP_INIT) return RESP().telaRH(h.split('/')[2] || 'pend');
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
      <button class="ini-capa-bt" data-ir="#/central">Abrir a Central de Rotinas do RH</button>
    </div>
  </section>`);
  document.querySelectorAll('.ini-capa [data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
}

/* =====================================================================
   CENTRAL DO DIA: pendências de todos os painéis num lugar só.
   Cada painel calcula as próprias pendências (window.CRV_PENDENCIAS) com as mesmas regras que mostra na tela;
   o app abre os painéis escondidos, recolhe e guarda o resultado por algumas horas.
   ===================================================================== */
const CENTRAL_FONTES = ['experiencia', 'ferias', 'crachas', 'onibus', 'sancoes', 'rd', 'jovem', 'renapsi', 'treinamentos', 'unimed', 'cartao-adm', 'cartao-alimentacao', 'cartao-convenio', 'cartao-premium'];
const CENTRAL_VALIDADE = 3 * 3600e3;
const centralChave = () => 'crv-central-' + (E.perfil ? E.perfil.id || E.perfil.nome : '');
let centralRodando = false;
window.CRV_CENTRAL_LIMPAR = () => { try { localStorage.removeItem(centralChave()); } catch(_){} };
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
    const r = await todasLinhas((a, z) => sb.from('registros').select('doc_id,dados,colecao').eq('painel', p.id).in('colecao', cols).order('caminho').range(a, z));
    if (!r.error) novos = (r.data || []).filter(x => x.dados && !x.dados.excluida).map(x => cols.length > 1 ? { _id: x.doc_id, colecao: x.colecao, dados: x.dados } : { _id: x.doc_id, dados: x.dados });
  }
  const ponte = window.CRV_PONTE.criar({ sb, painel: pid, perfil: () => E.perfil, quem: () => E.perfil.nome, podeEditar: () => podeEditar(p), ehAdmin: () => ehRH() });
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
  const { data, error } = await todasLinhas((a, z) => sb.from('registros').select('colecao,dados').eq('painel', 'quadro').in('colecao', ['entrevistas', 'entrevistas_resp', 'estabilidade']).order('caminho').range(a, z));
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
/* Conferência de Desligamentos: desligados (Quadro) que ainda aparecem com Cartão Convênio ativo, Unimed, Uniodonto ou alojamento.
   Cartão Alimentação e Premium não entram: o colaborador pode usar o saldo depois da saída.
   O que o RH marca como feito fica salvo (registros do Quadro, coleção deslig_check). */
const DCK = [
  { k:'jc',     n:'Justa causa',     acao:'Concluir a rescisão no DP', painel:'justa-causa' },
  { k:'conv',   n:'Cartão Convênio', acao:'Bloquear o cartão',  painel:'cartao-convenio' },
  { k:'unimed', n:'Unimed',          acao:'Excluir do plano',   painel:'unimed' },
  { k:'odonto', n:'Uniodonto',       acao:'Excluir do plano',   painel:'uniodonto' },
  { k:'aloj',   n:'Alojamento',      acao:'Liberar o leito',    painel:'alojamentos' },
  { k:'clube',  n:'Capinópolis Clube', acao:'Excluir do clube (parar o desconto)', painel:'clube' }
];
const brD = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '';
async function dadosDesligamento(){
  const Q = await window.CRV_QUADRO(); if (!Q || !Q.mapa) return null;
  // justa causa comunicada no app: entra no checklist mesmo antes de o Quadro trazer o desligamento
  const JCM = {}; { const pj = E.paineis.find(x => x.id === 'justa-causa'); if (pj && podeVer(pj) && window.CRV_JC_INIT) { try { (await JC().regs()).forEach(r => { const k = String(r.mat).replace(/^0+(?=\d)/, ''); if (!JCM[k] || String(r.dataDoc) > String(JCM[k].dataDoc)) JCM[k] = r; }); } catch(_){} } }
  const deslig = m => { const k = String(m).replace(/^0+(?=\d)/, ''), c = Q.mapa[k]; if (!c) return null; if (c.situacao === 'Desligado') return c; return JCM[k] ? Object.assign({}, c, { deslig: JCM[k].dataDoc || '' }) : null; };
  const P = new Map(), refs = {};
  const add = (m, nome, k, det, ref) => { const c = deslig(m); if (!c) return; const key = String(m).replace(/^0+(?=\d)/, '');
    if (!P.has(key)) P.set(key, { mat:key, nome:nome || c.nome, deslig:c.deslig || '', funcao:c.funcao || '', setor:c.setor || '', area:c.area || '', b:{} });
    P.get(key).b[k] = { det, ref, depois: !!(ref && c.deslig && c.deslig > ref) }; };
  const pode = id => { const p = E.paineis.find(x => x.id === id); return p && podeVer(p) && E.metas[id]; };
  if (pode('cartao-convenio')) { const d = await window.CRV_DADOS('cartao-convenio'); const C = d && d.dados.CARTAO; if (C && C.rows) { refs.conv = C.refPlanilha || d.referencia; C.rows.filter(r => String(r.card || '').toLowerCase() === 'ativo').forEach(r => add(r.mat, r.nome, 'conv', 'Cartão ativo na planilha', refs.conv)); } }
  if (pode('unimed')) { const d = await window.CRV_DADOS('unimed'); const U = d && d.dados.DATA; const T3 = U ? await unimedPorMat(U) : null;
    if (T3) { refs.unimed = U.BREF ? U.BREF.split('/').reverse().join('-') : d.referencia; Object.entries(T3).filter(([, t]) => !t.aut).forEach(([m, t]) => add(m, t.nome, 'unimed', t.deps.length ? `Titular + ${t.deps.length} dependente${t.deps.length > 1 ? 's' : ''}` : 'Titular', refs.unimed)); }
    else if (U && U.P) { refs.unimed = d.referencia; U.P.filter(r => r[8] >= 0).forEach(r => add(r[0], r[1], 'unimed', r[11] && r[11].length ? `Titular + ${r[11].length} dependente${r[11].length > 1 ? 's' : ''}` : 'Titular', refs.unimed)); } }
  if (pode('uniodonto')) { const d = await window.CRV_DADOS('uniodonto'); const U = d && d.dados.DATA; if (U && U.T) { refs.odonto = d.referencia; U.T.forEach(t => add(t[5] || t[1], t[2], 'odonto', t[7] && t[7].length ? `Titular + ${t[7].length} dependente${t[7].length > 1 ? 's' : ''}` : 'Titular', refs.odonto)); } }
  if (pode('alojamentos')) { const d = await window.CRV_DADOS('alojamentos'); const A = d && d.dados.DATA; if (A && A.people) { refs.aloj = d.referencia; A.people.filter(x => x.t === 'c' && x.m).forEach(x => { const h = A.houses && A.houses[x.h]; add(x.m, x.n, 'aloj', h ? `${h.n}${x.q ? ', quarto ' + x.q : ''}` : 'Alojado', refs.aloj); }); } }
  { const pc = E.paineis.find(x => x.id === 'clube'); if (pc && podeVer(pc)) { const R = (await window.CRV_REGS('clube', 'lanc')).filter(x => !x.excluida && x.mes); const mx = R.reduce((a, x) => x.mes > a ? x.mes : a, '');
    if (mx) { refs.clube = mx + '-01'; R.filter(x => x.mes === mx).forEach(x => add(x.mat, x.nome, 'clube', (x.tipo === 'F' ? 'Contribuição familiar' : x.tipo === 'I' ? 'Contribuição individual' : 'Sócio') + ' · lista de ' + mx.slice(5, 7) + '/' + mx.slice(0, 4), refs.clube)); } } }
  if (Object.keys(JCM).length) { refs.jc = Object.values(JCM).reduce((a, r) => String(r.dataDoc) > a ? String(r.dataDoc) : a, ''); Object.values(JCM).forEach(r => add(r.mat, r.nome, 'jc', 'Comunicação de ' + brD(r.dataDoc) + ' · Art. 482, alínea(s) ' + JC().resumoAl(r) + (r.dpData ? ' · DP em ' + brD(r.dpData) + (r.dpHora ? ' às ' + r.dpHora : '') : ''), '')); }
  const { data } = await todasLinhas((a, z) => sb.from('registros').select('doc_id,dados').eq('painel', 'quadro').eq('colecao', 'deslig_check').order('caminho').range(a, z));
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
/* Riscos Psicossociais (NR-1): js/nr1.js recebe as funções do app quando é usado */
let _nr1 = null;
const ctxMod = () => ({ sb, E, $, esc, normal, brD, fMat, fDias, podeVer, podeEditar, ehAdmin, ehRH, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF, centralChave });
const NR1 = () => _nr1 || (_nr1 = window.CRV_NR1_INIT ? window.CRV_NR1_INIT(ctxMod()) : null);
let _risco = null; const RISCO = () => _risco || (_risco = window.CRV_RISCO_INIT(ctxMod()));
let _rel = null; const REL = () => _rel || (_rel = window.CRV_REL_INIT(Object.assign(ctxMod(), { NR1, RISCO, BASES })));
let _rsp = null; const RESP = () => _rsp || (_rsp = window.CRV_RESP_INIT(ctxMod()));
let _dav = null; const DAV = () => _dav || (_dav = window.CRV_DAV_INIT(ctxMod()));
let _org = null; const ORG = () => _org || (_org = window.CRV_ORG_INIT(ctxMod()));
let _cad = null; const CADS = () => _cad || (_cad = window.CRV_CAD_INIT(Object.assign(ctxMod(), { FRENTES })));
let _bases = null; const BASES = () => _bases || (_bases = window.CRV_BASES_INIT(Object.assign(ctxMod(), { ehAdmin, FRENTES })));
let _gestor = null; const GESTOR = () => _gestor || (_gestor = window.CRV_GESTOR_INIT(ctxMod()));
let _des = null; const DES = () => _des || (_des = window.CRV_DES_INIT(ctxMod()));
let _apos = null; const APOS = () => _apos || (_apos = window.CRV_APOS_INIT(ctxMod()));
let _jc = null; const JC = () => _jc || (_jc = window.CRV_JC_INIT(Object.assign(ctxMod(), { logo: () => LOGO_DATAURL })));
let _onb = null; const ONB = () => _onb || (_onb = window.CRV_ONB_INIT(Object.assign(ctxMod(), { RISCO })));
async function pendenciasDesligamento(){
  const D = await dadosDesligamento(); if (!D) return [];
  const L = D.L.filter(x => x.pend.length);
  if (!L.length) return [];
  const nomes = Object.keys(D.refs).map(k => DCK.find(d => d.k === k).n);
  return [{ id:'desl-check', sev:'crit', t:'Desligados com benefício ou alojamento ainda ativo', painel:'', rota:'#/desligamento', pnome:'Conferência de Desligamentos',
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
    const pjc = E.paineis.find(x => x.id === 'justa-causa'), JCL = pjc && podeVer(pjc) && window.CRV_JC_INIT ? await JC().daPessoa(mat).catch(() => []) : [];
    if (JCL.length) F.sec.push({ k:'jc', t:'Comunicação de justa causa', painel:'justa-causa', cab:['Documento', 'Ocorrência', 'Art. 482 (alíneas)', 'Comparecimento ao DP', 'Lançado por'], linhas:JCL.map(r => [brD(r.dataDoc), brD(r.dataOc), JC().resumoAl(r), r.dpData ? brD(r.dpData) + (r.dpHora ? ' às ' + r.dpHora : '') : '', r.criadoPor || '']), alerta:'justa causa comunicada em ' + brD(JCL[0].dataDoc) });
    if (fPode('sancoes')) { const L = (o ? o.adv.map(x => [brD(x.data), 'Advertência', x.motivo || '']).concat(o.sus.map(x => [brD(x.data), 'Suspensão' + (x.dias ? ' (' + x.dias + 'd)' : ''), x.motivo || ''])) : []).concat(JCL.map(r => [brD(r.dataDoc), 'Justa causa', 'Art. 482 da CLT, alínea(s) ' + JC().resumoAl(r)]));
      L.sort((a, b) => b[0].split('/').reverse().join('').localeCompare(a[0].split('/').reverse().join('')));
      F.sec.push({ k:'sanc', t:'Sanções disciplinares', painel:'sancoes', cab:['Data', 'Tipo', 'Motivo'], linhas:L, alerta: o && o.sus.length >= 3 ? o.sus.length + 'ª suspensão ou mais' : '' }); }
    if (fPode('sancoes') && window.CRV_RESP_INIT) { const GD = await RESP().daPessoa(mat); if (GD.length) F.sec.push({ k:'gdocs', t:'Documentos disciplinares com o gestor', painel:'', cab:['Liberado em', 'Documento', 'Situação', 'Aplicado em', 'Documento assinado'],
      linhas:GD.map(d => [brD(String(d.criado_em).slice(0, 10)), (d.titulo || '') + (d.dados && d.dados.assunto ? ' · ' + d.dados.assunto : ''), (RESP().ST[d.status] || [d.status])[0] + (d.recusa ? ' · recusa de assinatura' : ''), brD(d.aplicado_em), d.status === 'recebido' ? 'Recebido em ' + brD(String(d.recebido_em || '').slice(0, 10)) + ' (ver em Documentos com os gestores)' : '']) }); }
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
    if (fPode('unimed')) { const d = await window.CRV_DADOS('unimed'); const U = d && d.dados.DATA; const T3 = U ? await unimedPorMat(U) : null;
      if (T3) { const t = Object.entries(T3).find(([m]) => fMat(m) === mat); const PLN = ['Local', 'Nacional Enfermaria', 'Nacional Apartamento'];
        B.push(['Unimed', t ? (t[1].aut && c.situacao === 'Desligado' ? 'Mantido no plano (autorizado pela diretoria) · ' : 'Titular · ') + PLN[t[1].pl] : 'Sem plano', t && t[1].deps.length ? t[1].deps.length + ' dependente' + (t[1].deps.length > 1 ? 's' : '') + ': ' + t[1].deps.join(', ') : '', U.BREF || brD(d.referencia)]); }
      else if (U) { const r = (U.P || []).find(x => fMat(x[0]) === mat);
      const PLN = ['Local', 'Nacional Enfermaria', 'Nacional Apartamento']; B.push(['Unimed', r && r[8] >= 0 ? 'Titular · ' + (PLN[r[8]] || 'plano') : 'Sem plano', r && r[11] && r[11].length ? r[11].length + ' dependente' + (r[11].length > 1 ? 's' : '') + ': ' + r[11].map(x => x[0]).join(', ') : '', brD(d.referencia)]); } }
    if (fPode('uniodonto')) { const d = await window.CRV_DADOS('uniodonto'); const U = d && d.dados.DATA; if (U) { const t = (U.T || []).find(x => fMat(x[5] || x[1]) === mat);
      B.push(['Uniodonto', t ? 'Titular' : 'Sem plano', t && t[7] && t[7].length ? t[7].length + ' dependente' + (t[7].length > 1 ? 's' : '') + ': ' + t[7].map(x => x[1]).join(', ') : '', brD(d.referencia)]); } }
    if (fPode('alojamentos')) { const d = await window.CRV_DADOS('alojamentos'); const A = d && d.dados.DATA; if (A) { const x = (A.people || []).find(y => y.t === 'c' && fMat(y.m) === mat);
      B.push(['Alojamento', x ? 'Alojado' : 'Não alojado', x ? ((A.houses[x.h] || {}).n || '') + (x.q ? ', quarto ' + x.q : '') : '', brD(d.referencia)]); } }
    { const pc = E.paineis.find(x => x.id === 'clube'); if (pc && podeVer(pc)) { const R = (await window.CRV_REGS('clube', 'lanc')).filter(x => !x.excluida && x.mes); const mx = R.reduce((a, x) => x.mes > a ? x.mes : a, '');
      if (mx) { const x = R.find(y => y.mes === mx && fMat(y.mat) === mat), v = x ? (+x.valor || 0) - (+x.desc || 0) : 0;
        B.push(['Capinópolis Clube', x ? 'Ativo · sócio ' + (x.tipo === 'F' ? 'familiar' : x.tipo === 'I' ? 'individual' : '(outro valor)') : 'Não sócio', x ? 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits:2 }) + ' a descontar' + (+x.desc ? ' (desconto de R$ ' + (+x.desc).toLocaleString('pt-BR', { minimumFractionDigits:2 }) + ')' : '') : '', mx.slice(5, 7) + '/' + mx.slice(0, 4)]); } } }
    if (B.length) F.sec.push({ k:'ben', t:'Benefícios e alojamento', cab:['Benefício', 'Situação', 'Detalhe', 'Base de'], linhas:B, alerta: c.situacao === 'Desligado' && B.some(b => /Titular|Ativo|Alojado/.test(b[1]) && !/Alimenta|Premium/.test(b[0])) ? 'Desligado com benefício ativo' : '' });
  })());
  // Remuneração: só a equipe RH (a planilha de salários fica num painel restrito)
  if (ehRH()) tarefas.push((async () => { const o = await window.CRV_SAL(); const v = o && o.SAL[mat]; if (!v) return;
    const R$ = n => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }), nN = t => String(t || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
    const a = nN(v[4]), b = nN(c.nome), mesmo = !a.length || (a[0] === b[0] && a[a.length - 1] === b[b.length - 1]);
    F.sec.push({ k:'sal', t:'Remuneração', ref:o.ref, resumo: mesmo ? [['Salário', R$(v[0])], ['Função na folha', v[2] || '—'], ['Situação na folha', v[1] || '—']].concat((v[5] || []).map(h => ['Antes (base de ' + brD(h[0]) + ')', R$(h[1])])) : [['Salário', 'não mostrado'], ['Na planilha de salários, a matrícula ' + mat + ' é de', v[4] + (v[1] ? ' (' + v[1].toLowerCase() + ')' : '')]],
      alerta: !mesmo ? 'nome diferente na planilha de salários: conferir a matrícula' : (c.situacao !== 'Desligado' && /DEMITIDO/i.test(v[1]) ? 'consta como demitido na planilha de salários' : '') }); })());
  // Avaliação de desempenho
  if ((pd => pd && podeVer(pd))(E.paineis.find(x => x.id === 'desempenho')) && window.CRV_DES_INIT) tarefas.push((async () => { const L = await DES().daPessoa(mat); if (!L.length) return;
    F.sec.push({ k:'des', t:'Avaliação de desempenho', painel:'desempenho', cab:['Ciclo', 'Data', '% atingido', 'Resultado', 'Avaliador', 'Encaminhamento'], linhas:L.map(a => [a.ciclo, brD(a.data), DES().pctTxt(a.pct), a.faixa, a.aval || '', a.acoes.join('; ')]),
      alerta: L[0] && /abaixo/i.test(L[0].faixa) ? 'última avaliação de desempenho abaixo do esperado' : '' }); })());
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
    const nN = t => String(t || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean), mesmo = (a, b) => { const x = nN(a), y = nN(b); return x.length && y.length && x[0] === y[0] && x[x.length - 1] === y[y.length - 1]; };
    const p = cpf8 ? (DB.P || []).find(x => String(x.c || '').replace(/\D/g, '').slice(-8) === cpf8) : null; if (!p) return; // processo trabalhista: só pelo CPF
    F.sec.push({ k:'proc', t:'Processos trabalhistas', painel:'processos', cab:['Processo', 'Empresa', 'Tipo'], linhas:(p.p || []).map(x => [x[0], x[1], x[2]]), alerta:(p.p || []).length ? (p.p.length === 1 ? '1 processo' : p.p.length + ' processos') : '' });
    if (p.bq) F.bloqueio = p.bq; })());
  // Risco de Desligamento (só para quem pode ver o painel)
  { const pr = E.paineis.find(x => x.id === 'risco'); if (pr && podeVer(pr)) tarefas.push((async () => { const s = await RISCO().daPessoa(mat); if (!s) return;
    F.sec.push({ k:'risco', t:'Risco de Desligamento', painel:'risco', ref:s.ref, resumo:[['Nível', s.niv === 'a' ? 'Alto' : s.niv === 't' ? 'Atenção' : 'Sem sinal'], ['Faltas em 90 dias', s.fa.length], ['Dias de atestado em 90 dias', s.at.length], ['Última conversa', s.conv ? brD(s.conv.data) + ' · ' + (RISCO().RES[s.conv.res] || '') : '—']],
      alerta: s.niv === 'a' ? 'risco alto (' + s.S.join(', ') + ')' : s.niv === 't' ? 'atenção (' + s.S.join(', ') + ')' : '' }); })()); }
  // Trajetória (departamentos e funções) e histórico de férias, vindos dos relatórios da folha
  if (ehRH()) tarefas.push((async () => {
    const { data } = await sb.from('registros').select('colecao,dados').eq('painel', 'quadro').in('caminho', ['hist_depto/m' + mat, 'hist_cargo/m' + mat, 'hist_ferias/m' + mat, 'hist_dep/m' + mat, 'hist_curso/m' + mat, 'hist_exame/m' + mat, 'hist_afast/m' + mat, 'hist_apos/m' + mat, 'hist_ocor/m' + mat, 'hist_atest/m' + mat].concat(...EMPRESAS_GRUPO.map(e => ['hist_ocor' + e[0] + '/c' + mat, 'hist_atest' + e[0] + '/c' + mat])));
    const H = {}; (data || []).forEach(x => { H[x.colecao] = x.dados || {}; });
    const T = ((H.hist_depto || {}).l || []).map(x => [x[0], 'Departamento', x[1], x[2]]).concat(((H.hist_cargo || {}).l || []).map(x => [x[0], 'Função', x[1], x[2]])).sort((a, b) => b[0].localeCompare(a[0]));
    const DP = (H.hist_dep || {}).l || [], idd = n => { if (!n) return ''; const a = Math.floor((Date.now() - new Date(n + 'T12:00:00')) / 31557600000); return ' (' + a + ' anos)'; };
    const EX = ((H.hist_exame || {}).l || []).slice().sort((a, b) => b[0].localeCompare(a[0])), ul = EX.find(x => !x[3]);
    if (EX.length) F.sec.push({ k:'aso', t:'Exames ocupacionais (ASO)', ref:H.hist_exame.ref, cab:['Data do exame', 'Exame', 'Próximo exame'], linhas:EX.map(x => [brD(x[0]), x[2] + (x[3] ? ' (demissional)' : ''), x[1] ? brD(x[1]) + (x === ul && x[1] < hoje ? ' · vencido' : '') : '—']),
      resumo:[['Último exame', ul ? brD(ul[0]) + ' · ' + ul[2] : '—'], ['Próximo exame', ul && ul[1] ? brD(ul[1]) : '—']],
      alerta: ul && ul[1] && ul[1] < hoje ? (c.situacao === 'Afastado' ? 'ASO vencido em ' + brD(ul[1]) + ' (afastado: fazer o exame de retorno ao voltar)' : 'ASO periódico vencido desde ' + brD(ul[1])) : '' });
    const AF = ((H.hist_afast || {}).l || []).slice().sort((a, b) => b[0].localeCompare(a[0])), AB = AF.find(x => !x[1]), c12 = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const dAf = (a, b) => Math.max(0, Math.round((new Date((b || hoje) + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5)), A12 = AF.filter(x => (x[1] || hoje) > c12);
    const AP = ((H.hist_apos || {}).l || []).slice().sort((a, b) => b[0].localeCompare(a[0]));
    if (AF.length || AP.length) F.sec.push({ k:'afast', t:'Afastamentos (' + AF.length + ')', ref:(H.hist_afast || H.hist_apos).ref, cab:['Início', 'Retorno', 'Motivo', 'CID', 'Dias'], linhas:AF.map(x => [brD(x[0]), x[1] ? brD(x[1]) : 'segue afastado', x[3] || x[2], x[4] || '—', dAf(x[0], x[1])]),
      resumo:[['Situação', AB ? 'Afastado desde ' + brD(AB[0]) + ' · ' + (AB[3] || AB[2]) : 'Sem afastamento em aberto'], ['Últimos 12 meses', A12.length + (A12.length === 1 ? ' afastamento' : ' afastamentos') + ' · ' + A12.reduce((t, x) => t + dAf(x[0] > c12 ? x[0] : c12, x[1]), 0) + ' dias']].concat(AP.map(x => ['Aposentadoria', (x[2] || 'Benefício não informado') + ' desde ' + brD(x[0]) + (x[3] ? ' · nº ' + x[3] : '')])),
      alerta: AB && /ACID/i.test(AB[3]) ? 'afastado por acidente de trabalho' : '' });
    const ocSec = (OC, tit, k, ref, nota) => { if (!OC.length) return; const TN = { f:'Falta', j:'Falta justificada', s:'Suspensão', m:'Licença-maternidade', p:'Licença-paternidade', o:'Outra ocorrência' }, EP = [];
      OC.forEach(x => { const u = EP[EP.length - 1], prox = u && u.t === x[1] && Math.round((new Date(x[0] + 'T12:00:00') - new Date(u.z + 'T12:00:00')) / 864e5) === 1; if (prox) { u.z = x[0]; u.n++; } else EP.push({ a:x[0], z:x[0], t:x[1], n:1, d:x[3] || '' }); });
      const ano = {}; OC.forEach(x => { const y = x[0].slice(0, 4); (ano[y] = ano[y] || { f:0, j:0, s:0 })[x[1]] != null && ano[y][x[1]]++; });
      F.sec.push({ k, t:tit, ref, nota, cab:['Período', 'Ocorrência', 'Dias'], linhas:EP.reverse().map(e => [brD(e.a) + (e.z !== e.a ? ' a ' + brD(e.z) : ''), e.d || TN[e.t] || e.t, e.n]),
        resumo:(nota ? [['Origem', nota]] : []).concat(Object.keys(ano).sort().reverse().map(y => [y, ano[y].f + (ano[y].f === 1 ? ' falta' : ' faltas') + ' · ' + ano[y].j + ' justificada' + (ano[y].j === 1 ? '' : 's') + ' · ' + ano[y].s + (ano[y].s === 1 ? ' dia' : ' dias') + ' de suspensão'])) }); }
    const atSec = (L, tit, k, ref, nota) => { if (!L.length) return; const A = L.slice().sort((a, b) => b[0].localeCompare(a[0])), ano = {};
      A.forEach(x => { const y = x[0].slice(0, 4); const o = ano[y] = ano[y] || { n:0, d:0 }; o.n++; o.d += x[1]; });
      F.sec.push({ k, t:tit + ' (' + A.length + ')', ref, cab:['Início', 'Dias', 'CID', 'Médico'], linhas:A.map(x => [brD(x[0]), x[1], x[2] ? x[2] + (x[3] ? ' · ' + x[3] : '') : '—', x[5] ? x[5] + (x[4] ? ' (' + x[4] + ')' : '') : '—']),
        resumo:(nota ? [['Origem', nota]] : []).concat(Object.keys(ano).sort().reverse().slice(0, 6).map(y => [y, ano[y].n + (ano[y].n === 1 ? ' atestado' : ' atestados') + ' · ' + ano[y].d + ' dias'])) }); };
    atSec((H.hist_atest || {}).l || [], 'Atestados (sistema)', 'atest', (H.hist_atest || {}).ref);
    EMPRESAS_GRUPO.forEach(e => { const X = H['hist_atest' + e[0]] || {}, n = X.emp || e[1]; atSec(X.l || [], 'Atestados na ' + n + ' (empresa ' + e[0] + ')', 'atest' + e[0], X.ref, 'Época da ' + n + '. Não entra nos números da CRV.'); });
    ocSec((H.hist_ocor || {}).l || [], 'Faltas e suspensões (ponto)', 'ocor', (H.hist_ocor || {}).ref);
    EMPRESAS_GRUPO.forEach(e => { const X = H['hist_ocor' + e[0]] || {}, n = X.emp || e[1]; ocSec(X.l || [], 'Faltas e suspensões na ' + n + ' (empresa ' + e[0] + ')', 'ocor' + e[0], X.ref, 'Histórico da época da ' + n + (X.de ? ', matrícula ' + X.de.join(', ') + ' na ' + n : '') + '. Não entra nos números da CRV.'); });
    const CU = ((H.hist_curso || {}).l || []).slice().sort((a, b) => b[0].localeCompare(a[0]));
    if (CU.length) F.sec.push({ k:'cursos', t:'Treinamentos realizados (' + CU.length + ')', ref:H.hist_curso.ref, cab:['Data', 'Treinamento'], linhas:CU.map(x => [brD(x[0]) + (x[1] && x[1] !== x[0] ? ' a ' + brD(x[1]) : ''), x[2]]) });
    if (H.hist_dep) F.sec.push({ k:'deps', t:'Dependentes (' + DP.length + ')', ref:H.hist_dep.ref, cab:['Nome', 'Parentesco', 'Nascimento', 'CPF'], linhas:DP.map(d => [d[0], d[2], brD(d[1]) + idd(d[1]), d[4] ? d[4].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—']) });
    if (T.length) F.sec.push({ k:'traj', t:'Trajetória na empresa', ref:(H.hist_depto || H.hist_cargo || {}).ref, cab:['Data', 'Mudança', 'De', 'Para'], linhas:T.map(x => [brD(x[0]) + (x[0] > hoje ? ' (programada)' : ''), x[1], x[2], x[3]]),
      resumo:[['Trocas de departamento', T.filter(x => x[1] === 'Departamento').length], ['Mudanças de função', T.filter(x => x[1] === 'Função').length], ['Última mudança de função', (T.find(x => x[1] === 'Função') || [''])[0] ? brD(T.find(x => x[1] === 'Função')[0]) : 'nenhuma no histórico']] });
    const FE = ((H.hist_ferias || {}).l || []).slice().sort((a, b) => b[2].localeCompare(a[2]));
    if (FE.length) { const lim = af => { const d = new Date(af + 'T12:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() + 1); return d.toISOString().slice(0, 10); };
      const L = FE.map(x => { const l = lim(x[1]), atr = x[2] > l ? fDias(l, x[2]) : 0; return [brD(x[0]) + ' a ' + brD(x[1]), brD(x[2]) + ' a ' + brD(x[3]), String(fDias(x[2], x[3]) + 1) + 'd', brD(x[4]), atr ? 'Fora do prazo (' + atr + ' dias depois do limite)' : 'No prazo']; });
      const fora = FE.filter(x => x[2] > lim(x[1]));
      F.sec.push({ k:'hfer', t:'Histórico de férias', painel:'ferias', ref:H.hist_ferias.ref, cab:['Período aquisitivo', 'Gozo', 'Dias', 'Retorno', 'Prazo'], linhas:L,
        alerta: fora.some(x => x[2] >= new Date(Date.now() - 730 * 864e5).toISOString().slice(0, 10)) ? 'férias gozadas fora do prazo concessivo (CLT art. 137: pagamento em dobro)' : '' }); }
  })());
  // Quadro: estabilidade, entrevista de desligamento, checklist
  tarefas.push((async () => { const { data } = await todasLinhas((a, z) => sb.from('registros').select('colecao,dados').eq('painel', 'quadro').in('colecao', ['estabilidade', 'entrevistas_resp', 'deslig_check']).order('caminho').range(a, z));
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
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Perfil do Colaborador</h1><div class="ini-data">Tudo da pessoa em um lugar só, a partir de todos os painéis</div></div></section>
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
      cabecalhoPDF(doc, 'Perfil do Colaborador', `${c.nome} · matrícula ${mat}`);
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
    const nN = t => String(t || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean), mesmo = (a, b) => { const x = nN(a), y = nN(b); return x.length && y.length && x[0] === y[0] && x[x.length - 1] === y[y.length - 1]; };
    proc = c8 ? (DB.P || []).find(x => String(x.c || '').replace(/\D/g, '').slice(-8) === c8) : null; // só pelo CPF
    if (proc && proc.bq && !bloq.some(b => b.t === proc.bq[0])) bloq.push({ m:String(proc.mat || ''), t:proc.bq[0], o:proc.bq[1], fonte:'Processos trabalhistas' }); } }
  const O = crv.length ? await window.CRV_OCORR(crv) : { P:{} };
  const sanc = []; crv.forEach(m => { const o = O.P[m]; if (!o) return; o.adv.forEach(x => sanc.push([brD(x.data), 'Advertência', x.motivo || ''])); o.sus.forEach(x => sanc.push([brD(x.data), 'Suspensão' + (x.dias ? ' (' + x.dias + 'd)' : ''), x.motivo || ''])); });
  sanc.sort((a, b) => b[0].split('/').reverse().join('').localeCompare(a[0].split('/').reverse().join('')));
  let rd = []; if (fPode('rd')) { const d = await window.CRV_DADOS('rd'); const D = d && d.dados.D; const DES = ['Sem tratativa', 'Ausência de culpa', 'Culpa apontada, sem medida', 'Medida disciplinar', 'Desconto', 'Sem informação'];
    if (D) rd = D.rows.filter(r => crv.includes(String(r[2]))).map(r => [String(r[0]), brD(r[1]), DES[r[9]] || '', r[10] || '']); }
  let ent = null; try { const { data } = await todasLinhas((a, z) => sb.from('registros').select('dados').eq('painel', 'quadro').eq('colecao', 'entrevistas_resp').order('caminho').range(a, z)); ent = (data || []).map(x => x.dados).find(v => v && !v.excluida && crv.includes(String(v.mat))) || null; } catch(_){}
  // frequência por passagem (ponto e atestados do sistema): só o que está dentro do período da passagem, porque a mesma matrícula pode ter sido usada por outra pessoa
  const oc = []; try {
    const HO = await window.CRV_HIST('ocor'), HA = await window.CRV_HIST('atest'), hj = new Date().toISOString().slice(0, 10), outra = {};
    const regs = async (col, e) => { const k = col + e; if (!outra[k]) { outra[k] = {}; try { (await window.CRV_REGS('quadro', col + e)).forEach(x => { if (String(x._id || '').startsWith('a') && x.mat) outra[k][String(x.mat)] = x.l || []; }); } catch(_){} } return outra[k]; };
    for (const x of p.pass) { const e = (/\((\d+)\)/.exec(x.emp) || [])[1] || '5', ini = x.adm || '0000', fim = x.atual ? hj : (x.saida || hj), den = d => d >= ini && d <= fim;
      const LO = (e === '5' ? HO[x.mat] : (await regs('hist_ocor', e))[x.mat]) || [], LA = (e === '5' ? HA[x.mat] : (await regs('hist_atest', e))[x.mat]) || [];
      const anos = {}; const ano = d => anos[d.slice(0, 4)] || (anos[d.slice(0, 4)] = { aq:0, ad:0, f:0, j:0, s:0 });
      LO.filter(o => den(o[0])).forEach(o => { const a = ano(o[0]); if (o[1] === 'f') a.f++; else if (o[1] === 'j') a.j++; else if (o[1] === 's') a.s++; });
      LA.filter(o => den(o[0])).forEach(o => { const a = ano(o[0]); a.aq++; a.ad += Math.max(1, +o[1] || 1); });
      Object.keys(anos).sort().reverse().forEach(y => { const a = anos[y]; if (a.aq || a.f || a.j || a.s) oc.push({ emp:x.emp, mat:x.mat, ano:y, ...a }); }); }
  } catch(_){}
  return { bloq, proc, sanc, rd, ent, oc };
}
function telaConsulta(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Seleção e Perfil Profissional</div><h1>Consulta de Candidatos</h1><div class="ini-data">Pelo CPF ou pelo nome: se já trabalhou em alguma das empresas, se tem bloqueio e o histórico, para a área analisar junto com o currículo</div></div></section>
    <div class="fc-busca cartao"><input id="cs-q" type="search" placeholder="CPF (só números ou com pontos) ou nome completo" autocomplete="off" aria-label="CPF ou nome"><div class="fc-sug" id="cs-sug" hidden></div></div>
    <div id="cs-corpo"><div class="cartao vazio"><p>Digite o CPF ou o nome do candidato.</p></div></div>`);
  const q = $('#cs-q'), sug = $('#cs-sug'); let B = null;
  consultaBase().then(x => { B = x; if (!x) $('#cs-corpo').innerHTML = '<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3></div>'; });
  const buscar = () => { if (!B) return; const t = q.value.trim(), dg = t.replace(/\D/g, ''); let L = [];
    const soNum = dg.length && dg.length === t.replace(/[\s.\-]/g, '').length;
    if (soNum && dg.length >= 6) L = B.L.filter(p => p.d && p.d.includes(dg));
    else if (soNum) L = B.L.filter(p => p.pass.some(x => x.mat === dg.replace(/^0+/, '')));
    else if (t.length >= 3) { const n = nNome(t); L = B.L.filter(p => p.n.includes(n)); }
    if (!t) { sug.hidden = true; return; }
    L = L.slice(0, 12);
    sug.innerHTML = L.length ? L.map(p => { const u = p.pass[0]; return `<button data-id="${esc(String(p.id))}"><b>${esc(p.nome)}</b><span>${p.d ? esc(fCpf(p.cpf)) + ' · ' : ''}${p.pass.length} passage${p.pass.length > 1 ? 'ns' : 'm'} · última: ${esc(u.emp)} ${u.atual ? '<i>(' + esc(u.sit) + ' hoje)</i>' : 'até ' + esc(brD(u.saida))}</span></button>`; }).join('')
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
    { const tf = X.oc.reduce((t, o) => t + o.f, 0); if (tf >= 10) pts.push(['warn', tf + ' faltas no histórico do ponto', '']); }
    const ver = X.bloq.length || jc.length ? ['r', 'Bloqueio ou restrição registrada'] : pts.some(x => x[0] === 'warn') ? ['a', 'Pontos para a área avaliar'] : p.pass.length ? ['v', 'Sem bloqueio registrado'] : ['v', 'Nunca trabalhou nas empresas'];
    C.innerHTML = `<section class="fc-cab cartao cs-cab ${ver[0]}"><div class="fc-av">${esc(iniciais(p.nome))}</div>
        <div class="fc-id"><h2>${esc(p.nome)}</h2><div class="fc-sub">${p.d ? 'CPF ' + esc(fCpf(p.cpf)) + ' · ' : ''}${p.pass.length ? p.pass.length + ' passage' + (p.pass.length > 1 ? 'ns' : 'm') + ' pelas empresas' : 'Não consta passagem por nenhuma das empresas'} (base do Quadro de ${esc(brD(B.ref))})</div>
          <div class="fc-pills"><span class="fc-pill ${ver[0] === 'r' ? 'r' : ver[0] === 'a' ? 'a' : 'v'}">${esc(ver[1])}</span></div></div>
        <button class="btn prim" id="cs-pdf">PDF para a área</button></section>
      ${pts.length ? `<section class="fc-al">${pts.map(x => `<span class="fc-a ${x[0] === 'crit' ? 'crit' : x[0] === 'info' ? 'info' : ''}" title="${esc(x[2])}">${esc(x[1])}</span>`).join('')}</section>` : ''}
      <div class="fc-grade">
        <section class="fc-sec cartao" style="grid-column:1/-1"><header><h3>Passagens pelas empresas</h3></header><div class="fc-tw"><table class="fc-t"><thead><tr><th>Empresa</th><th>Matrícula</th><th>Função</th><th>Seção / setor</th><th>Admissão</th><th>Saída</th><th>Tempo</th><th>Tipo e motivo da saída</th></tr></thead>
          <tbody>${p.pass.length ? '' : '<tr><td colspan="8">Não consta passagem por nenhuma das empresas do Quadro (CRV, APFO, CAPFO). Para confirmar, busque também pelo CPF.</td></tr>'}${p.pass.map(x => `<tr><td>${esc(x.emp)}</td><td>${esc(x.mat)}</td><td>${esc(x.funcao)}</td><td>${esc([x.secao, x.area].filter(Boolean).join(' · '))}</td><td>${esc(brD(x.adm))}</td><td>${x.atual ? '<b>' + esc(x.sit) + ' hoje</b>' : esc(brD(x.saida))}</td><td>${esc(fCasa(x.adm, x.saida || ''))}</td><td>${esc([x.tipo, (x.mot || []).join(', '), x.obs].filter(Boolean).join(' · ')) || (x.atual ? '' : '<span class="fc-vz2">não informado</span>')}${x.re3 ? ' · readmitido em até 3 dias' : ''}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="fc-sec cartao" style="grid-column:1/-1"><header><h3>Frequência: faltas, faltas justificadas e atestados</h3><small>ponto e atestados do sistema, por passagem e ano</small></header>${X.oc.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Empresa</th><th>Matrícula</th><th>Ano</th><th>Faltas</th><th>Faltas justificadas</th><th>Atestados</th><th>Dias de atestado</th><th>Suspensões (ponto)</th></tr></thead><tbody>${X.oc.map(o => `<tr><td>${esc(o.emp)}</td><td>${esc(o.mat)}</td><td>${esc(o.ano)}</td><td>${o.f ? '<b style="color:#a3301c">' + o.f + '</b>' : 0}</td><td>${o.j}</td><td>${o.aq ? '<b>' + o.aq + '</b>' : 0}</td><td>${o.ad}</td><td>${o.s ? '<b style="color:#a3301c">' + o.s + '</b>' : 0}</td></tr>`).join('')}<tr style="font-weight:800"><td colspan="3">Total</td>${['f', 'j', 'aq', 'ad', 's'].map(k => `<td>${X.oc.reduce((t, o) => t + o[k], 0)}</td>`).join('')}</tr></tbody></table></div>` : '<p class="fc-vz">Nenhuma falta, falta justificada ou atestado no histórico do sistema.</p>'}</section>
        <section class="fc-sec cartao"><header><h3>Sanções disciplinares (CRV)</h3></header>${X.sanc.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Data</th><th>Tipo</th><th>Motivo</th></tr></thead><tbody>${X.sanc.map(l => `<tr>${l.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nada registrado.</p>'}</section>
        <section class="fc-sec cartao"><header><h3>Registros de dano (RD)</h3></header>${X.rd.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>RD</th><th>Data</th><th>Desfecho</th><th>Tratativa</th></tr></thead><tbody>${X.rd.map(l => `<tr>${l.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="fc-vz">Nada registrado.</p>'}</section>
        ${X.ent ? `<section class="fc-sec cartao"><header><h3>Entrevista de desligamento</h3></header><div class="fc-res"><div><b>${esc((X.ent.mot || []).join('; ') || '—')}</b><span>Motivo</span></div><div><b>${esc(X.ent.volta || 'Não respondeu')}</b><span>Voltaria a trabalhar</span></div></div></section>` : ''}
        ${X.proc ? `<section class="fc-sec cartao cs-sens"><header><h3>Processos trabalhistas</h3><small>informação sensível: não vai no PDF para a área</small></header><div class="fc-tw"><table class="fc-t"><thead><tr><th>Processo</th><th>Empresa</th><th>Tipo</th></tr></thead><tbody>${(X.proc.p || []).map(x => `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
      </div>`;
    C.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir);
    $('#cs-pdf').onclick = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' });
      cabecalhoPDF(doc, 'Histórico do candidato', p.nome);
      doc.autoTable({ startY:100, head:[['Resumo para a área', '']], body:[['Candidato', p.nome], ['CPF', p.d ? fCpf(p.cpf) : 'não informado'], ['Situação', ver[1]], ['Passagens pelas empresas', String(p.pass.length)]].concat(pts.map(x => ['Atenção', /^Bloqueado/.test(x[1]) && /processo|trabalhist|judicial|justi[cç]a do trabalho/i.test(x[1]) ? 'Bloqueado para recontratação (motivo com a Gestão de Pessoas)' : x[1]])),
        styles:{ fontSize:9, cellPadding:3.5 }, headStyles:{ fillColor:[36,66,124] }, columnStyles:{ 0:{ cellWidth:150, fontStyle:'bold' } } });
      const sec = (t, cab, body) => { const y = doc.lastAutoTable.finalY + 18; doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20,33,61); doc.text(t, 40, y);
        doc.autoTable({ startY:y + 5, head:[cab], body: body.length ? body : [cab.map((h, i) => i ? '' : 'Nada registrado')], styles:{ fontSize:8, cellPadding:2.5, overflow:'linebreak' }, headStyles:{ fillColor:[46,138,87] } }); };
      sec('Passagens pelas empresas', ['Empresa', 'Matrícula', 'Função', 'Admissão', 'Saída', 'Tempo', 'Tipo e motivo da saída'], p.pass.map(x => [x.emp, x.mat, x.funcao, brD(x.adm), x.atual ? x.sit + ' hoje' : brD(x.saida), fCasa(x.adm, x.saida || ''), [x.tipo, (x.mot || []).join(', ')].filter(Boolean).join(' · ')]));
      sec('Frequência (faltas, faltas justificadas e atestados)', ['Empresa', 'Matrícula', 'Ano', 'Faltas', 'Faltas just.', 'Atestados', 'Dias de atestado', 'Suspensões (ponto)'], X.oc.map(o => [o.emp, o.mat, o.ano, o.f, o.j, o.aq, o.ad, o.s].map(String)));
      sec('Sanções disciplinares', ['Data', 'Tipo', 'Motivo'], X.sanc);
      sec('Registros de dano (RD)', ['RD', 'Data', 'Desfecho', 'Tratativa'], X.rd);
      const y = doc.lastAutoTable.finalY + 22; doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(93,106,133);
      doc.text(doc.splitTextToSize('Documento interno da Gestão de Pessoas para análise de recontratação, junto com o currículo. Atestados aparecem só em quantidade e dias, sem diagnóstico. Não inclui processos judiciais. Uso restrito à área solicitante.', 515), 40, y);
      rodapePDF(doc); baixar(doc.output('blob'), 'Historico candidato ' + p.nome.split(' ')[0] + '.pdf'); };
  }
}

/* ---------- telas: Central de Rotinas do RH e Conferência de Desligamentos ---------- */
function telaCentral(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Central de Rotinas do RH</h1><div class="ini-data">Pendências de todos os painéis, das mais urgentes para as menos urgentes</div></div></section><section class="central" id="central"></section>`);
  iniciarCentral();
}
async function telaDesligamento(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Central de Rotinas do RH</div><h1>Conferência de Desligamentos</h1><div class="ini-data" id="dk-sub">Cruzando os desligados do Quadro com as bases de benefícios…</div></div>
    <div class="dk-acoes"><button class="btn borda" id="dk-xls">Excel</button><button class="btn borda" id="dk-pdf">PDF</button></div></section>
    <div id="dk-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  let D;
  try { D = await dadosDesligamento(); } catch(e) { D = null; }
  const corpo = $('#dk-corpo'); if (!corpo) return;
  if (!D) { corpo.innerHTML = `<div class="cartao vazio"><h3>Sem a base do Quadro Geral</h3><p>O checklist usa os desligados do Quadro Geral.</p></div>`; return; }
  const fontes = DCK.filter(d => D.refs[d.k] !== undefined);
  $('#dk-sub').innerHTML = `Desligados do Quadro de ${esc(brD(D.refQ))} × ${fontes.map(d => d.k === 'jc' ? 'Justas causas comunicadas no app' : `${esc(d.n)} (base de ${esc(brD(D.refs[d.k]))})`).join(' · ')}. Cartão Alimentação e Premium não entram: o saldo pode ser usado depois da saída.`;
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
  const nome = 'Conferência de Desligamentos ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  $('#dk-xls').onclick = () => { const ws = XLSX.utils.aoa_to_sheet([cab, ...linhas()]); ws['!cols'] = cab.map((c, i) => ({ wch: i === 0 ? 34 : i > 4 ? 30 : 16 })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Checklist'); baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nome + '.xlsx'); };
  $('#dk-pdf').onclick = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Conferência de Desligamentos', `${(D._vis || []).length} colaboradores · Alimentação e Premium não entram`);
    doc.autoTable({ startY:110, head:[cab], body:linhas(), styles:{ fontSize:7.5, cellPadding:3, overflow:'linebreak' }, headStyles:{ fillColor:[36,66,124] }, alternateRowStyles:{ fillColor:[242,244,249] } });
    rodapePDF(doc); baixar(doc.output('blob'), nome + '.pdf'); };
}
/* exames ocupacionais (relatório TFP39T): periódico vencido de quem está trabalhando e o que vence em 30 dias */
async function pendenciasASO(){
  if (!ehRH()) return []; const H = await window.CRV_HIST('exame'); if (!H || Object.keys(H).length < 2) return [];
  const Q = await window.CRV_QUADRO(); if (!Q) return []; const hj = new Date().toISOString().slice(0, 10), ate = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const V = [], P30 = [];
  Object.entries(Q.mapa).forEach(([m, c]) => { if (c.situacao !== 'Ativo') return; const L = (H[m] || []).filter(x => !x[3]).sort((a, b) => b[0].localeCompare(a[0])); const u = L[0]; if (!u || !u[1]) return;
    const it = { nome:c.nome, mat:m, det:`${u[2]} em ${brD(u[0])} · próximo ${brD(u[1])} · ${c.setor || ''}` };
    if (u[1] < hj) V.push(Object.assign(it, { ord:u[1] })); else if (u[1] <= ate) P30.push(Object.assign(it, { ord:u[1] })); });
  const out = [];
  if (V.length) out.push({ id:'aso-venc', sev:'warn', t:'ASO periódico vencido (quem está trabalhando)', d:'Pelo relatório de exames da folha. Afastados não entram aqui: fazem o exame de retorno ao voltar. Pode ser exame feito e não lançado no sistema: confira com o SESMT.', painel:'quadro', acao:'aso', pnome:'Exames (ASO)', itens:V.sort((a, b) => a.ord.localeCompare(b.ord)) });
  if (P30.length) out.push({ id:'aso-30', sev:'info', t:'ASO vence nos próximos 30 dias', d:'Agendar o periódico com o SESMT.', painel:'quadro', acao:'aso', pnome:'Exames (ASO)', itens:P30.sort((a, b) => a.ord.localeCompare(b.ord)) });
  return out;
}
async function coletarCentral(){
  if (centralRodando) return; centralRodando = true;
  desenharCentral(centralCache(), true);
  const out = [];
  try {
    try { out.push(...await pendenciasQuadro()); } catch(e){ console.warn('central quadro', e); }
    try { out.push(...await pendenciasDesligamento()); } catch(e){ console.warn('central desligamento', e); }
    try { out.push(...await pendenciasASO()); } catch(e){ console.warn('central aso', e); }
    try { out.push(...await RISCO().pendencias()); } catch(e){ console.warn('central risco', e); }
    try { out.push(...await ONB().pendencias()); } catch(e){ console.warn('central onboarding', e); }
    // plano de ação da inspeção semanal de Serviços Gerais: ações com prazo vencido
    try { const sg = E.paineis.find(x => x.id === 'servicos-gerais'); if (sg && podeVer(sg)) { const hj = new Date().toISOString().slice(0, 10);
      const A = (await window.CRV_REGS('servicos-gerais', 'acoes')).filter(a => !a.excluida && (a.st === 'ab' || a.st === 'and') && a.prazo && a.prazo < hj).sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)));
      if (A.length) out.push({ id:'sg-acoes', sev:'warn', t:'Plano de ação de Serviços Gerais: ações atrasadas', painel:'', rota:'#/p/servicos-gerais/spa', pnome:'Plano de ação · Serviços Gerais', d:'Não conformidades das inspeções semanais com prazo vencido. Registre a tratativa no plano de ação.',
        itens: A.map(a => ({ nome:(a.area ? a.area + ' · ' : '') + (a.oc || ''), mat:'', det:`${a.acao || ''} · responsável: ${a.resp || '—'} · prazo ${brD(a.prazo)} (${Math.round((Date.now() - new Date(a.prazo + 'T12:00:00')) / 864e5)} dias de atraso)` })) }); } } catch(e){ console.warn('central serviços gerais', e); }
    try { out.push(...await BASES().pendencias()); } catch(e){ console.warn('central bases', e); }
    try { const pa = E.paineis.find(x => x.id === 'aprendiz-pos'); if (pa && podeVer(pa)) out.push(...await APOS().pendencias()); } catch(e){ console.warn('central aproveitamento', e); }
    try { out.push(...await GESTOR().pendenciasEnvios()); } catch(e){ console.warn('central envios', e); }
    try { if (window.CRV_RESP_INIT) out.push(...await RESP().pendencias()); } catch(e){ console.warn('central documentos gestores', e); }
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
  el.innerHTML = `<header class="cd-cab"><div><h2>Central de Rotinas do RH</h2><span>${carregando ? 'Atualizando as pendências dos painéis…' : c ? `${L.length ? `${L.length} ${L.length === 1 ? 'pendência' : 'pendências'}${nCrit ? ` · <b>${nCrit} urgente${nCrit > 1 ? 's' : ''}</b>` : ''}` : 'Nenhuma pendência'} · atualizado em ${esc(hora)}` : ''}</span></div>
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
  const cfg = FRENTES[f] || FRENTES['Horas Extras e Gratificações'];
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
/* ajuda curta no topo dos painéis (some depois de "Entendi"; volta quando a dica muda de versão) */
const DICAS = {
  unimed: { v:1, t:['As abas do topo trocam a visão: utilização, desconto em folha, dependentes e <b>Acidente de trabalho</b>.', 'Em <b>Acidente de trabalho</b>: importe a lista de acidentes e use <b>Conferir utilizações após o acidente</b> para decidir, mês a mês, o que desconta e o que não desconta.', 'Clique nos números e nas barras para ver quem está por trás deles.'] },
  'cartao-adm': { v:1, t:['<b>Lançamentos do período</b> e <b>Mapa dos cartões</b> mostram quem está com cada cartão.', 'Na aba <b>Fechamento por centro de custo</b>, importe o fechamento da Sysprocard: o painel junta as abas, faz o resumo por centro de custo e aponta o que conferir.', 'Use <b>Corrigir</b> e <b>Está certo</b> em cada ponto da análise; no PDF e no Excel, escolha as partes que devem sair.'] },
  clube: { v:1, t:['Lance os sócios pela matrícula: o centro de custo vem do Quadro.', 'Há dois relatórios: <b>desconto</b> (sem centro de custo) e <b>lançamento da nota</b> (com centro de custo e valor cheio).', 'Use a observação de inclusão nova ou exclusão, com a data, para avisar o clube.'] },
  'cartao-alimentacao': { v:1, t:['Importe a planilha exportada da Sysprocard: o painel compara com o Quadro e mostra quem falta pedir cartão.', 'Marque <b>Pedido</b> ou <b>Demitido</b>: a pessoa sai da lista de pendências na hora.'] },
  'cartao-convenio': { v:1, t:['Importe a planilha exportada da Sysprocard: o painel compara com o Quadro e mostra quem falta pedir cartão.', 'Marque <b>Pedido</b> ou <b>Demitido</b>: a pessoa sai da lista de pendências na hora.'] },
  'cartao-premium': { v:1, t:['Importe a planilha exportada da Sysprocard: o painel compara com o Quadro e mostra quem falta pedir cartão.', 'Marque <b>Pedido</b> ou <b>Demitido</b>: a pessoa sai da lista de pendências na hora.'] },
  ferias: { v:1, t:['<b>Imprimir relação de saídas de férias</b> gera a lista de quem sai de férias, por mês ou por período, com o lugar da assinatura.', 'Quem assina sai de Central de Rotinas → <b>Cadastros do RH</b> → Assinantes.'] }
};
const SUBACOES = {
  quadro:   [{ acao:'grel', nome:'Gerador de relatórios' }, { acao:'hcol', nome:'Histórico do colaborador' }, { acao:'decl', nome:'Declaração de trabalho' }, { acao:'ent', nome:'Entrevista de desligamento' }, { acao:'dav', nome:'Documento de dispensa' }, { acao:'entr', nome:'Respostas das entrevistas' }, { acao:'estab', nome:'Estabilidade' }, { acao:'aso', nome:'Exames (ASO)' }, { acao:'afast', nome:'Afastamentos' }],
  admissoes: [{ acao:'vq', nome:'Todas as empresas e anos' }, { acao:'vp', nome:'Acompanhamento 2026' }],
  rescisoes: [{ acao:'dav', nome:'Documento de dispensa' }, { acao:'vq', nome:'Todas as empresas e anos' }, { acao:'vp', nome:'Acompanhamento 2026' }],
  rs: [{ acao:'ctr', nome:'Contratações em Andamento' }],
  jovem:    [{ acao:'novo', nome:'Cadastrar jovem' }, { acao:'dslj', nome:'Registrar desligamento' }, { acao:'atj', nome:'Atestados' }],
  renapsi:  [{ acao:'novo', nome:'Cadastrar jovem' }, { acao:'dslj', nome:'Registrar desligamento' }, { acao:'atj', nome:'Atestados' }],
  sancoes:  [{ acao:'doc', nome:'Emitir advertência / suspensão / orientação' }, { acao:'pdev', nome:'Pendentes de devolução (gestores)' }],
  'justa-causa': [{ acao:'jcn', nome:'Nova comunicação de justa causa' }, { acao:'dav', nome:'Documento de dispensa' }],
  ouvidorias: [{ acao:'nova', nome:'Cadastrar ouvidoria' }],
  rd:       [{ acao:'novo', nome:'Cadastrar RD' }, { acao:'aut', nome:'Autorização de desconto' }, { acao:'hist', nome:'Histórico de autorizações' }],
  fadiga:   [{ acao:'novo', nome:'Cadastrar ocorrência' }, { acao:'trat', nome:'Aplicar tratativa' }],
  treinamentos: [{ acao:'novo', nome:'Cadastrar treinamento' }],
  'cartao-alimentacao': [{ acao:'rel', nome:'Relatório de conferência' }],
  'cartao-convenio':    [{ acao:'desc', nome:'Desconto em folha' }, { acao:'termo', nome:'Termo de opção' }, { acao:'rel', nome:'Relatório de conferência' }],
  'cartao-premium':     [{ acao:'rel', nome:'Relatório de conferência' }],
  'cartao-adm':         [{ acao:'fech', nome:'Fechamento por centro de custo' }, { acao:'novo', nome:'Registrar entrega' }, { acao:'sem', nome:'Créditos da semana' }, { acao:'rel', nome:'Relatório do período' }],
  crachas:  [{ acao:'novo', nome:'Cadastrar crachá de treinamento' }],
  clube:    [{ acao:'novo', nome:'Lançar sócio' }],
  unimed:   [{ acao:'acid', nome:'Acidente de trabalho' }, { acao:'reemb', nome:'Reembolso de desconto indevido' }],
  ferias:   [{ acao:'fdp', nome:'Relação de saídas de férias' }],
  farmacia: [{ acao:'aut', nome:'Autorização de desconto' }, { acao:'hist', nome:'Histórico de autorizações' }],
  'servicos-gerais': [{ acao:'she', nome:'Lançar horas extras' }, { acao:'sab', nome:'Lançar abonos' }, { acao:'sgr', nome:'Gratificação do mês' }, { acao:'sin', nome:'Nova inspeção semanal' }, { acao:'spa', nome:'Plano de ação' }]
};
/* altura do painel: ocupa só o espaço visível da tela, para as janelas de dentro do painel (com o botão Salvar) caberem sem rolar a página */
function ajustarFrame(){ const f = document.getElementById('modelo-frame'); if (!f) return; const top = f.getBoundingClientRect().top + window.scrollY; const h = Math.max(460, Math.round(window.innerHeight - top - 12)); f.style.minHeight = '0'; f.style.height = h + 'px'; }
window.CRV_AJUSTAR_FRAME = () => ajustarFrame();
window.addEventListener('resize', () => { clearTimeout(ajustarFrame._t); ajustarFrame._t = setTimeout(ajustarFrame, 150); });
function fecharJanelasAut(w){ try { w.document.querySelectorAll('.aut-fundo,.ent-fundo,.er-fundo,.of-fundo,.nv-fundo,.rl-fundo,.es-fundo,.ds-fundo,.ct-fundo,.jf-fundo,.ft-fundo,.df-fundo').forEach(x => x.remove()); } catch(_){} }
function executarAcao(acao){
  const f = document.getElementById('modelo-frame');
  const w = f && f.contentWindow;
  if (acao === 'dav' && window.CRV_DAV_INIT) { DAV().abrir(); return true; }
  if (acao === 'pdev') { location.hash = '#/respostas/pend'; return true; }
  if (acao === 'decl' && window.CRV_DAV_INIT) { DAV().abrirDecl(); return true; }
  if (acao === 'aut' && w && typeof w.CRV_AUTORIZACAO === 'function') { fecharJanelasAut(w); w.CRV_AUTORIZACAO(); return true; }
  if (acao === 'hist' && w && typeof w.CRV_AUT_HIST === 'function') { fecharJanelasAut(w); w.CRV_AUT_HIST(); return true; }
  if (acao === 'doc' && w && typeof w.CRV_DOCDISC === 'function') { fecharJanelasAut(w); w.CRV_DOCDISC(); return true; }
  if (acao === 'desc' && w && typeof w.CRV_DESCFOLHA === 'function') { fecharJanelasAut(w); w.CRV_DESCFOLHA(); return true; }
  if (acao === 'trat' && w && typeof w.CRV_FAD_TRAT === 'function') { fecharJanelasAut(w); w.CRV_FAD_TRAT(); return true; }
  if (acao === 'dslj' && w && typeof w.CRV_JOV_DESL === 'function') { fecharJanelasAut(w); w.CRV_JOV_DESL(); return true; }
  if (acao === 'atj' && w && typeof w.CRV_JOV_AT === 'function') { fecharJanelasAut(w); w.CRV_JOV_AT(); return true; }
  if (acao === 'ctr' && w && typeof w.CRV_CONTRATACAO === 'function') { fecharJanelasAut(w); w.CRV_CONTRATACAO(); return true; }
  if (acao === 'jcn' && E.painelAberto === 'justa-causa' && typeof window.CRV_JC_NOVA === 'function') { window.CRV_JC_NOVA(); return true; }
  if (acao === 'acid' && w && typeof w.CRV_ACID === 'function') { w.CRV_ACID(); return true; }
  if (acao === 'reemb' && w && typeof w.CRV_REEMB === 'function') { w.CRV_REEMB(); return true; }
  if (acao === 'fdp' && w && typeof w.CRV_FER_DP === 'function') { w.CRV_FER_DP(); return true; }
  if (acao === 'fech' && w && typeof w.CRV_FECH === 'function') { w.CRV_FECH(); return true; }
  if (acao === 'grel' && w && typeof w.CRV_GERREL === 'function') { fecharJanelasAut(w); w.CRV_GERREL(); return true; }
  if (acao === 'hcol' && w && typeof w.CRV_HISTCOL === 'function') { fecharJanelasAut(w); w.CRV_HISTCOL(); return true; }
  if (acao === 'estab' && w && typeof w.CRV_ESTAB === 'function') { fecharJanelasAut(w); w.CRV_ESTAB(); return true; }
  if (acao === 'aso' && w && typeof w.CRV_EXAMES === 'function') { fecharJanelasAut(w); w.CRV_EXAMES(); return true; }
  if (acao === 'afast' && w && typeof w.CRV_AFAST === 'function') { fecharJanelasAut(w); w.CRV_AFAST(); return true; }
  if (acao === 'entr' && w && typeof w.CRV_ENT_RESP === 'function') { fecharJanelasAut(w); w.CRV_ENT_RESP(); return true; }
  if (acao === 'ent' && w && typeof w.CRV_ENTREVISTA === 'function') { fecharJanelasAut(w); w.CRV_ENTREVISTA(); return true; }
  if (acao === 'termo' && w && typeof w.CRV_TERMO === 'function') { fecharJanelasAut(w); w.CRV_TERMO(); return true; }
  if (acao === 'sem' && w && typeof w.CRV_SEMANA === 'function') { fecharJanelasAut(w); w.CRV_SEMANA(); return true; }
  if (acao === 'rel' && w && typeof w.CRV_RELATORIO === 'function') { fecharJanelasAut(w); w.CRV_RELATORIO(); return true; }
  if (acao === 'novo' && w && typeof w.CRV_NOVO === 'function') { fecharJanelasAut(w); w.CRV_NOVO(); return true; }
  if (acao === 'nova' && w && typeof w.CRV_OUV_NOVA === 'function') { fecharJanelasAut(w); w.CRV_OUV_NOVA(); return true; }
  if (['she', 'sab', 'sgr', 'sin', 'spa'].includes(acao) && w && typeof w.CRV_SG === 'function') { w.CRV_SG(acao); return true; }
  return false;
}
async function telaPainel(id, acao){
  E.painelAberto = null;
  const p = E.paineis.find(x => x.id === id);
  if (!p || !podeVer(p)) { toast('Painel não encontrado ou sem acesso.', true); location.hash = '#/'; return; }
  const cfg = FRENTES[p.frente] || FRENTES['Horas Extras e Gratificações'];
  if (VISTA_QUADRO[id] && (acao === 'vq' || acao === 'vp')) { try { localStorage.setItem('crv-vista-' + id, acao.slice(1)); } catch(_){} try { history.replaceState(null, '', '#/p/' + encodeURIComponent(id)); } catch(_){} acao = ''; }
  if (id === 'risco') return RISCO().tela(p, cfg);
  if (id === 'onboarding') return ONB().tela(p, cfg);
  if (id === 'desempenho') return DES().tela(p, cfg);
  if (id === 'justa-causa') return JC().tela(p, cfg, acao);
  if (id === 'aprendiz-pos') return APOS().tela(p, cfg);
  if (MODELOS[id]) return telaModelo(p, cfg, acao);
  moldura(`<div class="trilha"><button data-ir="#/">Visão Geral</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
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
  const editar = podeEditar(p) && ehAdmin();   // importar planilha: só a administradora principal
  const cab = `<div class="trilha"><button data-ir="#/">Visão Geral</button> › <span>${esc(p.frente)}</span> › <b>${esc(p.nome)}</b></div>
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
  const onde = pid ? null : h.startsWith('#/ficha') ? 'Perfil do Colaborador' : h.startsWith('#/desligamento') ? 'Conferência de Desligamentos' : h.startsWith('#/relatorio') ? 'Relatórios Gerenciais' : h.startsWith('#/bases') ? 'Qualidade dos Dados' : h.startsWith('#/envios') ? 'Envios dos Gestores' : h.startsWith('#/admin') ? 'Administração' : '';
  const painel = pid ? (PAC_DE[pid] || pid) : null;
  registrar(painel && E.paineis.some(p => p.id === painel) ? painel : null, 'exportou arquivo', String(nome || '') + (onde ? ' · ' + onde : ''));
  logAcesso('exportou', ondeDe(h), String(nome || '')); };
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
    doc.text('Documento interno · uso restrito do RH', 24, h-16); doc.text(`${i}/${n}`, w-40, h-16); }
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

/* acessos de cada pessoa (Administração → Acessos). Se a tabela ainda não existe (07_acessos.sql), fica quieto. */
let _acOff = false; const _acUlt = {};
async function logAcesso(acao, onde, detalhe){
  if (_acOff || !E.perfil) return; const k = acao + '|' + (onde || ''); if (acao === 'abriu' && _acUlt[k] && Date.now() - _acUlt[k] < 5 * 60e3) return; _acUlt[k] = Date.now();
  try { const { error } = await sb.from('acessos').insert({ usuario:E.perfil.nome, papel:E.perfil.papel, acao, onde:onde || null, detalhe:detalhe ? String(detalhe).slice(0, 300) : null }); if (error && /acessos|relation|42P01/i.test(error.message + error.code)) _acOff = true; } catch(_){}
}
window.CRV_LOG_ACESSO = logAcesso;
const ondeDe = h => { if (h.startsWith('#/p/')) { const id = decodeURIComponent(h.slice(4).split('/')[0]); return 'Painel: ' + ((E.paineis || []).find(p => p.id === id)?.nome || id); }
  if (h.startsWith('#/eq/')) { const k = h.slice(5); return 'Minha equipe: ' + ({ eq:'Equipe', mov:'Admissões e saídas', pv:'Quadro x previsto', exp:'Experiência', nov:'Novos colaboradores', perfil:'Perfil profissional', fer:'Férias', freq:'Frequência', disc:'Disciplina e RD', cr:'Em treinamento', alo:'Alojamento', env:'Meus envios' }[k] || k); }
  return ({ '#/':'Visão Geral', '#/central':'Central de Rotinas do RH', '#/admin':'Administração', '#/conta':'Minha conta', '#/relatorio':'Relatórios Gerenciais', '#/bases':'Qualidade dos Dados', '#/cadastros':'Cadastros do RH', '#/organograma':'Organograma do RH', '#/envios':'Envios dos Gestores', '#/respostas':'Documentos com os gestores', '#/respostas/pend':'Documentos com os gestores', '#/respostas/docs':'Documentos com os gestores', '#/respostas/resp':'Respostas aos gestores' })[h] || (h.startsWith('#/ficha') ? 'Perfil do Colaborador' : h.startsWith('#/desligamento') ? 'Conferência de Desligamentos' : h.replace(/^#\//, '') || 'Início'); };
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
  'conexao','rd','fadiga','processos','ouvidorias','recepcao','alojamentos','onibus','gratificacao','servicos-gerais','clube'];
const SEM_PACOTE = ['clube'];
const MODELOS = Object.fromEntries(MODELOS_LISTA.map(id => [id, `paineis/${id}.html`]));
// painéis que usam o mesmo arquivo de painel
['cartao-alimentacao','cartao-convenio','cartao-premium'].forEach(id => MODELOS[id] = 'paineis/cartoes.html');
MODELOS['cartao-adm'] = 'paineis/cartao-adm.html';
// o crédito manual usa o mesmo arquivo, os mesmos dados e os mesmos créditos salvos do Vale-Alimentação Sysprocard
MODELOS['sysprocard-credito'] = 'paineis/sysprocard.html';
// Recrutamento e Seleção: mesmo arquivo e mesmos dados do Banco de Currículos, aberto só na parte de R&S (o Banco saiu do menu)
MODELOS['rs'] = 'paineis/curriculos.html';
const PAC_DE = { 'sysprocard-credito':'sysprocard', 'rs':'curriculos' };
// recursos que dependem do Claude e não funcionam no app
const AVISOS = {};

const fmtRef = r => r ? r.split('-').reverse().join('/') : '—';

// Admissões e Rescisões: além do acompanhamento 2026 (planilha), mostram o histórico completo
// de todas as empresas e anos, calculado da base do Quadro Geral (mesmo código, sem a aba no Quadro)
const VISTA_QUADRO = { admissoes:'a', rescisoes:'r' };
const vistaDe = id => { try { return localStorage.getItem('crv-vista-' + id) || 'q'; } catch(_) { return 'q'; } };
async function telaModelo(p, cfg, acao){
  const editar = podeEditar(p);
  const vq = VISTA_QUADRO[p.id];
  const sel = vq ? vistaDe(p.id) : '';
  const nomeV = p.id === 'admissoes' ? 'Admissões' : 'Desligamentos';
  moldura((vq ? `<div class="vista-seg" role="tablist"><button data-vq="q" class="${sel === 'q' ? 'on' : ''}">Todas as empresas e anos</button><button data-vq="p" class="${sel === 'p' ? 'on' : ''}">${nomeV} 2026 · acompanhamento</button></div>` : '') +
    (podeImportar() && podeEditar(p) && !SEM_PACOTE.includes(p.id) ? `<div class="cartao" id="imp-barra" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:10px 14px;margin-bottom:10px;border-left:4px solid #1d7a88"><div style="flex:1;min-width:220px;font-size:13.5px"><b>Atualizar a planilha deste painel</b><br><small style="color:var(--mut)">${['cartao-convenio','cartao-alimentacao','cartao-premium','cartao-adm','sysprocard','sysprocard-credito'].includes(p.id) ? 'Carregue a planilha exportada da Sysprocard. O painel compara com o Quadro e mostra quem ainda está sem cartão.' : 'Carregue a planilha nova do sistema. Os lançamentos feitos no app são mantidos.'}</small></div><button class="btn prim" id="imp-painel">Importar planilha${['cartao-convenio','cartao-alimentacao','cartao-premium','cartao-adm','sysprocard','sysprocard-credito'].includes(p.id) ? ' da Sysprocard' : ''}</button></div>` : '') +
    `<div id="modelo-area" class="cartao vazio"><div class="spinner" style="margin:0 auto"></div><p>Abrindo o painel…</p></div>`);
  { const bi = document.getElementById('imp-painel'); if (bi) bi.onclick = () => escolherPacotes(PAC_DE[p.id] || p.id); }
  { const dk = DICAS[p.id], ck = 'crv-dica-' + p.id + '-' + (dk ? dk.v : '');
    let visto = false; try { visto = !!localStorage.getItem(ck); } catch(_){}
    if (dk && !visto) { const area0 = $('#modelo-area'); if (area0) { area0.insertAdjacentHTML('beforebegin', `<div class="cartao" id="dica-painel" style="display:flex;gap:10px;align-items:center;padding:6px 12px;margin-bottom:10px;border-left:4px solid #e9a23b;background:#fffaf0"><details style="flex:1;font-size:13px;line-height:1.5" ontoggle="window.CRV_AJUSTAR_FRAME&&window.CRV_AJUSTAR_FRAME()"><summary style="cursor:pointer"><b>Como usar este painel</b> <span style="color:var(--mut)">· clique para ver as dicas</span></summary><ul style="margin:4px 0 2px;padding-left:18px">${dk.t.map(x => '<li>' + x + '</li>').join('')}</ul></details><button class="btn borda peq" id="dica-ok">Entendi</button></div>`);
      $('#dica-ok').onclick = () => { try { localStorage.setItem(ck, '1'); } catch(_){} const d = $('#dica-painel'); if (d) d.remove(); ajustarFrame(); }; } } }
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
  let d = pac.data;
  if (!d && SEM_PACOTE.includes(p.id)) d = { referencia:'', conteudo:{ dados:{} } }; // painéis só com lançamentos no app
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
      podeEditar: () => podeEditar(p), ehAdmin: () => ehRH() });
    let novos = [];
    if (PAINEIS_COM_NOVOS.includes(p.id)) {
      const cols = [].concat(COLECAO_NOVOS[p.id] || 'novos');
      const r = await todasLinhas((a, z) => sb.from('registros').select('doc_id,dados,colecao').eq('painel', p.id).in('colecao', cols).order('caminho').range(a, z));
      if (!r.error) novos = (r.data || []).filter(x => x.dados && !x.dados.excluida).map(x => cols.length > 1 ? { _id: x.doc_id, colecao: x.colecao, dados: x.dados } : { _id: x.doc_id, dados: x.dados });
    }
    window.CRV_RECARREGAR = () => { if (location.hash.startsWith('#/p/' + encodeURIComponent(p.id))) telaPainel(p.id); };
    let tplU = tpl;
    if (p.id === 'ferias' && ehRH()) { try { const HF = await window.CRV_HIST('ferias'); if (Object.keys(HF).length > 1) tplU = tplU.replace(/<head[^>]*>/i, h => h + '<script>window.CRV_HF=' + JSON.stringify(HF).replace(/</g, '\\u003c') + ';<\/script>'); } catch(_) {} }
    if (p.id === 'sancoes') { try { const pj = E.paineis.find(x => x.id === 'justa-causa'); if (pj && podeVer(pj) && window.CRV_JC_INIT) { const J = (await JC().regs()).map(r => ({ mat:String(r.mat), nome:r.nome || '', doc:r.dataDoc || '', oc:r.dataOc || '', al:JC().resumoAl(r), desc:String(r.desc || '').slice(0, 600) }));
        if (J.length) tplU = tplU.replace(/<head[^>]*>/i, h => h + '<script>window.CRV_JC=' + JSON.stringify(J).replace(/</g, '\\u003c') + ';<\/script>'); } } catch(_) {} }
    if (p.id === 'absenteismo') { try { const Q = await window.CRV_QUADRO(); if (Q && Q.mapa) { // situação atual de cada um pelo Quadro Geral (a planilha de atestados pode estar mais antiga)
        const QS = {}; Object.entries(Q.mapa).forEach(([m, o]) => { QS[m] = [o.situacao === 'Desligado' ? 'DEMITIDO' : o.situacao === 'Afastado' ? 'AFASTADO' : 'ATIVO', o.situacao === 'Desligado' ? (o.deslig || '') : ''] });
        tplU = tplU.replace(/<head[^>]*>/i, h => h + '<script>window.CRV_QSIT=' + JSON.stringify({ ref:Q.referencia || '', S:QS }).replace(/</g, '\\u003c') + ';<\/script>'); } } catch(_) {} }
    if (p.id === 'absenteismo' && ehRH()) { try { const HO = await window.CRV_HIST('ocor'), HA = await window.CRV_HIST('atest'), Q = await window.CRV_QUADRO(); if (Q && Q.mapa && (Object.keys(HO).length > 1 || Object.keys(HA).length > 1)) {
        const CIDD = {}, enx = L => (L || []).map(x => { if (x[2] && x[3] && !CIDD[x[2]]) CIDD[x[2]] = x[3]; return [x[0], x[1], x[2]]; }); // atestados: [início, dias, CID] (o médico fica só na ficha)
        const P = {}, LA = {}; Object.keys(HA).forEach(m => { if (m !== '__ref' && HA[m].length) LA[m] = enx(HA[m]); });
        new Set(Object.keys(HO).concat(Object.keys(LA))).forEach(m => { if (m === '__ref') return; const o = Q.mapa[m] || {}; P[m] = [o.nome || '', o.funcao || '', o.area || '', o.setor || '', o.gerencia || '', o.situacao || '', o.admissao || '', o.deslig || '']; });
        const EMP = {}; for (const e of EMPRESAS_GRUPO) { const A = { n:e[1], P:{}, L:{}, AT:{}, C:{} };
          for (const [col, k] of [['hist_ocor', 'L'], ['hist_atest', 'AT']]) { try { (await window.CRV_REGS('quadro', col + e[0])).forEach(x => { if (!String(x._id || '').startsWith('a') || !x.mat || !(x.l || []).length) return; A[k][x.mat] = k === 'AT' ? enx(x.l) : x.l; if (x.p && (!A.P[x.mat] || !A.P[x.mat][2])) A.P[x.mat] = x.p; if (x.crv) A.C[x.mat] = x.crv; if (x.emp) A.n = x.emp; }); } catch(_) {} }
          if (Object.keys(A.L).length || Object.keys(A.AT).length) EMP[e[0]] = A; }
        tplU = tplU.replace(/<head[^>]*>/i, h => h + '<script>window.CRV_OC=' + JSON.stringify({ ref:HO.__ref || HA.__ref, P, L:HO, AT:LA, EMP, CIDD }).replace(/</g, '\\u003c') + ';<\/script>'); } } catch(e) { console.warn('absenteísmo', e); } }
    if (['unimed', 'uniodonto'].includes(PAC_DE[p.id] || p.id)) { // Unimed e Uniodonto cruzam com o Quadro atual do app
      try { const Q = await window.CRV_QUADRO(); if (Q && Q.mapa) {
        const dig = v => String(v || '').replace(/\D/g, ''), P = [], DL = {};
        Object.entries(Q.mapa).forEach(([m, o]) => {
          if (o.situacao === 'Desligado') { const c = dig(o.cpf); if (c && (!DL[c] || (o.deslig || '') > DL[c][0])) DL[c] = [o.deslig || '', o.cc || '', o.ccd || '', o.setor || '', o.nome || '']; return; }
          P.push([+m, o.nome, o.funcao, o.area, o.vinculo, o.situacao, o.admissao, dig(o.cpf), o.setor, o.gerencia, o.idade || '', o.nasc || '', o.cid || '', o.ccd || '', o.cc || '', o.fx === '' || o.fx == null ? '' : o.fx, o.cel || '']); });
        const rf = String(Q.referencia || ''), ref = /^\d{4}-\d{2}-\d{2}/.test(rf) ? rf.slice(8, 10) + '/' + rf.slice(5, 7) + '/' + rf.slice(0, 4) : rf;
        let DF = null; try { const H = await window.CRV_HIST('dep'); if (Object.keys(H).length > 1) { DF = { ref:H.__ref, c:{} }; Object.entries(H).forEach(([m, L]) => { if (m !== '__ref') L.forEach(d => { if (d[4]) DF.c[d[4]] = [d[0], d[2], +m]; }); }); } } catch(_) {}
        const js = JSON.stringify({ P, DL, ref, DF }).replace(/</g, '\\u003c');
        tplU = tplU.replace(/<head[^>]*>/i, h => h + '<script>window.CRV_QB=' + js + ';<\/script>'); } } catch(_) {}
    }
    const html = montarModelo(tplU, d.conteudo, d.referencia, p, novos);
    const url = URL.createObjectURL(new Blob([html], { type:'text/html' }));
    area.className = 'modelo-area';
    area.innerHTML = `<iframe id="modelo-frame" title="${esc(p.nome)}" src="${url}"></iframe>`; ajustarFrame(); [300, 1500, 4000].forEach(t => setTimeout(ajustarFrame, t));
    BASES().aviso(PAC_DE[p.id] || p.id).then(h => { if (!h || !$('#modelo-frame')) return; area.insertAdjacentHTML('afterbegin', h); area.querySelectorAll('.sb-av [data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir); }).catch(() => {});
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
    window.__CRV_PAINEL = window.CRV_PONTE.criar({ sb, painel:'quadro', perfil: () => E.perfil, quem: () => E.perfil.nome, podeEditar: () => podeEditar(q), ehAdmin: () => ehRH() });
    window.CRV_RECARREGAR = () => { if (location.hash.startsWith('#/p/' + encodeURIComponent(p.id))) telaPainel(p.id); };
    const tplM = tpl.replace(/<head[^>]*>/i, m => m + `<script>window.CRV_MODO_QUADRO=${JSON.stringify(vq)};<\/script>`);
    const html = montarModelo(tplM, d.conteudo, d.referencia, Object.assign({}, q, { frente: p.frente }), []);
    const url = URL.createObjectURL(new Blob([html], { type:'text/html' }));
    area.className = 'modelo-area';
    area.innerHTML = `<iframe id="modelo-frame" title="${esc(p.nome)}" src="${url}"></iframe>`; ajustarFrame(); [300, 1500, 4000].forEach(t => setTimeout(ajustarFrame, t));
    BASES().aviso(PAC_DE[p.id] || p.id).then(h => { if (!h || !$('#modelo-frame')) return; area.insertAdjacentHTML('afterbegin', h); area.querySelectorAll('.sb-av [data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir); }).catch(() => {});
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
/* Unimed (pacote V3): titulares ativos na Unimed cruzados pelo CPF do Quadro atual → { matrícula: { pl, deps, nome } } */
async function unimedPorMat(U){
  if (!U || U.V !== 3 || !Array.isArray(U.BEN)) return null;
  const Q = await window.CRV_QUADRO(); if (!Q || !Q.mapa) return null;
  const T = {}, D = {}; U.BEN.forEach(b => { if (b[1] === b[2]) T[b[1]] = b; else (D[b[1]] = D[b[1]] || []).push(b[3]); });
  const dg = o => String(o.cpf || '').replace(/\D/g, '').padStart(11, '0'), ativo = new Set();
  // autorizados pela diretoria a continuar no plano (lista do painel Unimed): não entram como pendência de exclusão
  const AUT = new Set([].concat(U.AUT || [], U.O || []).map(a => String(a[1] || '').replace(/\D/g, '').padStart(11, '0')));
  Object.values(Q.mapa).forEach(o => { if (o.situacao !== 'Desligado') ativo.add(dg(o)); });
  // quem foi readmitido: a matrícula antiga (desligada) não conta, o plano é da matrícula atual
  const out = {}; Object.entries(Q.mapa).forEach(([m, o]) => { const c = dg(o), t = T[c]; if (t && !(o.situacao === 'Desligado' && ativo.has(c))) out[m] = { pl:t[0], deps:D[c] || [], nome:o.nome, aut:AUT.has(c) }; });
  return out;
}
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
    const FXQ = dados.FX || {};
    dados.D.forEach((r, i) => { M[txt(r[0])] = { idade: r[10], sexo: txt(r[11]), cid: txt(r[12]), cel: XX ? txt(XX[i][25]) : '', fx: FXQ[txt(r[0])] != null ? FXQ[txt(r[0])] : '', nasc: XX ? txt(XX[i][0]) : '', cpf: XX ? txt(XX[i][11]) : '', rg: XX ? txt(XX[i][7]) : '', rgUf: XX ? txt(XX[i][10]) : '', cc: XX ? txt(XX[i][33]) : '', ctps: XX ? txt(XX[i][12]) : '', serie: XX ? txt(XX[i][13]) : '', ccd: txt(r[13]), nome:txt(r[1]), funcao:txt(r[2]), setor:txt(r[3]), situacao:txt(r[8]) || 'Ativo', vinculo:txt(r[7]), gerencia:txt(r[6]), area:txt(r[5]), cnh:txt(r[17]), admissao:txt(r[9]), deslig:'', empresa:'CRV' }; });
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
window.CRV_SAL = async function(){ if (!ehRH()) return null; const d = await window.CRV_DADOS('salarios'); return d && d.dados && d.dados.SAL ? { SAL:d.dados.SAL, ref:d.referencia } : null; };
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
// lê todas as linhas de uma consulta, em páginas de 1000 (o banco devolve no máximo 1000 por vez)
window.todasLinhas = async function(q){ const out = []; for (let a = 0; a < 200000; a += 1000) { const { data, error } = await q(a, a + 999); if (error) return { data:out, error }; out.push(...(data || [])); if (!data || data.length < 1000) break; } return { data:out, error:null }; };
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
    const out = []; // o Supabase devolve no máximo 1000 linhas por consulta: lê em páginas
    for (let i = 0; i < 20000; i += 1000) { const r = await sb.from('registros').select('doc_id,dados').eq('painel', painel).eq('colecao', colecao).order('doc_id').range(i, i + 999);
      if (r.error) break; (r.data || []).forEach(x => out.push(Object.assign({ _id:x.doc_id }, x.dados || {}))); if ((r.data || []).length < 1000) break; }
    return out;
  } catch(_) { return []; }
};
/* banco de registros de outro painel (ex.: a fadiga grava a advertência também nas Sanções) */
window.CRV_DB_DE = function(id){ const p = (E.paineis || []).find(x => x.id === id); if (!p || !window.CRV_PONTE) return null;
  return window.CRV_PONTE.criar({ sb, painel:id, perfil:() => E.perfil, quem:() => E.perfil.nome, podeEditar:() => podeEditar(p), ehAdmin:() => ehRH() }).capacidade('db'); };
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
  'Gestão de Colaboradores':         ['#08394a','#137089'],
  'Seleção e Perfil Profissional':              ['#0a4440','#16807a'],
  'Absenteísmo e Férias':           ['#4a2608','#a0581b'],
  'Programa Jovem Aprendiz':                ['#2a1a57','#5a3fa0'],
  'T&D | Desenvolvimento de Pessoas': ['#561d12','#a3462a'],
  'Ocorrências e Relações Trabalhistas': ['#46111d','#8a2a3d'],
  'Atendimento e Ouvidoria':          ['#1f3346','#3f6688'],
  'Alojamentos e Transporte':       ['#1f3d17','#3f7a2c'],
  'Horas Extras e Gratificações':   ['#3d300a','#86691a']
};
window.CRV_CAPA = CAPA;
window.CRV_GESTOR_GERAR = () => { clearTimeout(window._gerT); window._gerT = setTimeout(() => { try { GESTOR().gerar(true).catch(() => {}); } catch(_){} }, 4000); }; // usado também nas telas próprias do app (Onboarding, Risco de saída)
// como cada painel azul pinta a capa (os demais já têm cor própria: Unimed, Uniodonto, Sanções, Sysprocard…)
const CAPA_MODO = {
  vars:  ['absenteismo','absenteismo-gestao','admissoes','jovem','processos','quadro','rd','rescisoes','gratificacao','pesquisas'],
  band:  ['alojamentos','ferias','recepcao'],
  hd:    ['experiencia'],
  hero:  ['curriculos','rs'],
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
// todo painel recebe o código que põe a linha de total (pessoas e valores) no fim das tabelas dos PDFs
function montarModelo(){ const h = montarModelo0.apply(null, arguments); try { if (!window.CRV_TOTAIS_PDF) return h;
  const sc = '<script>(function(){var f=' + window.CRV_TOTAIS_PDF.toString().replace(/<\/script/gi, '<\\/script') + ';var k=0,t=function(){f(window);if(++k<20)setTimeout(t,1500)};t();window.addEventListener("load",function(){f(window)})})();<\/script>';
  return /<\/body>/i.test(h) ? h.replace(/<\/body>(?![\s\S]*<\/body>)/i, sc + '</body>') : h + sc; } catch(_) { return h; } }
function montarModelo0(tpl, conteudo, referencia, p, novos){
  conteudo = mascaraCPF(conteudo);
  const nomeOk = n => /^[A-Za-z_$][\w$]*$/.test(n);
  const base = location.href.split('#')[0].replace(/[^/]*$/, '');
  let html = tpl.split('__CRV_REFBR__').join(fmtRef(referencia)).split('__CRV_BASE__').join(base);
  const ponte = (p.id === 'rs' ? '<script>window.CRV_MODO_CV="rs";<\/script>' : '') + `<script>window.CRV_PAINEL_ID=${JSON.stringify(p.id)};<\/script><script>${window.CRV_PONTE.scriptPainel()}<\/script>` + (novos ? `<script>window.CRV_NOVOS=${jsValor(novos)};<\/script>` : '');
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
  inp.onchange = async () => { if (!inp.files.length) return; let fs = [...inp.files];
    /* planilha de acidentes de trabalho aberta no painel da Unimed: vai para a aba Acidente de trabalho */
    const fr = document.getElementById('modelo-frame'), w = fr && fr.contentWindow;
    if (w && typeof w.CRV_ACID_IMP === 'function' && window.XLSX) { const resto = [];
      for (const f of fs) { let ac = false; if (/\.(xlsx|xls|csv)$/i.test(f.name)) { try { const wb = XLSX.read(await f.arrayBuffer(), { type:'array', sheetRows:6 }); const A = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, defval:'' }); const t = A.map(r => r.join(' ')).join(' ').toLowerCase(); ac = /agente causador|parte do corpo/.test(t) && /colaborador|nome/.test(t); } catch(_){} }
        if (ac) w.CRV_ACID_IMP(f); else resto.push(f); }
      fs = resto; if (!fs.length) return; }
    carregarPacotes(fs, esperado); };
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
/* históricos da folha (férias, departamentos, funções): um registro por pessoa, substitui o anterior */
let _ocorMem = {};
const EMPRESAS_GRUPO = [['6', 'APFO'], ['16', 'CAPFO']]; // outras empresas do grupo: ocorrências guardadas como histórico separado
async function salvarHistorico(pac){
  const quem = E.perfil ? E.perfil.nome : '', col = 'hist_' + pac.hist;
  if (pac.faixa !== undefined) { // ocorrências do ponto: cada arquivo cobre um período; troca só os lançamentos desse período e mantém os outros
    if (!pac.faixa) return 0; const [a, z] = pac.faixa, pre = pac.docPre || 'm', X = pac.extra || {};
    if (!_ocorMem[col]) { const M = {}; (await window.CRV_REGS('quadro', col)).forEach(x => { if (x.mat && String(x._id || '').startsWith(pre)) M[String(x.mat)] = { l:x.l || [], p:x.p, crv:x.crv }; }); _ocorMem[col] = M; }
    const MEM = _ocorMem[col], mud = {};
    const TPS = Array.isArray(pac.tipos) ? new Set(pac.tipos) : null, sai = x => x[0] >= a && x[0] <= z && (!TPS || TPS.has(x[1])); // RPE0026R não traz todos os tipos: só troca os que vieram no arquivo
    Object.keys(MEM).forEach(m => { if (MEM[m].l.some(sai)) mud[m] = 1; }); Object.keys(pac.itens).forEach(m => mud[m] = 1);
    Object.keys(mud).forEach(m => { const o = MEM[m] || (MEM[m] = { l:[] }); o.l = o.l.filter(x => !sai(x)).concat(pac.itens[m] || []).sort((x, y) => x[0].localeCompare(y[0])); if (X[m]) { o.p = X[m].p; o.crv = X[m].crv; } });
    const doc = (id, dados) => ({ painel:'quadro', caminho:col + '/' + id, colecao:col, doc_id:id, dados:Object.assign({ ref:pac.referencia }, pac.empNome ? { emp:pac.empNome } : {}, dados), atualizado_por:quem });
    const linhas = Object.keys(mud).map(m => doc(pre + m, { mat:m, l:MEM[m].l, p:MEM[m].p, crv:MEM[m].crv }));
    // APFO: cópia na matrícula atual da CRV, para aparecer na ficha de quem foi transferido
    if (pre !== 'm') { const cs = new Set(Object.keys(mud).map(m => MEM[m].crv).filter(Boolean));
      cs.forEach(c => { const de = Object.keys(MEM).filter(m => MEM[m].crv === c); linhas.push(doc('c' + c, { mat:c, crv:c, de, l:[].concat(...de.map(m => MEM[m].l)).sort((x, y) => x[0].localeCompare(y[0])) })); }); }
    for (let i = 0; i < linhas.length; i += 200) { const { error } = await sb.from('registros').upsert(linhas.slice(i, i + 200), { onConflict:'painel,caminho' }); if (error) { delete _ocorMem[col]; throw error; } }
    _histCache = {}; return Object.keys(pac.itens).length;
  }
  const linhas = Object.entries(pac.itens).map(([m, l]) => ({ painel:'quadro', caminho:col + '/m' + m, colecao:col, doc_id:'m' + m, dados:{ mat:m, l, ref:pac.referencia }, atualizado_por:quem }));
  for (let i = 0; i < linhas.length; i += 200) { const { error } = await sb.from('registros').upsert(linhas.slice(i, i + 200), { onConflict:'painel,caminho' }); if (error) throw error; }
  _histCache = {}; return linhas.length;
}
let _histCache = {};
window.CRV_HIST = async function(h){ if (_histCache[h]) return _histCache[h]; const L = await window.CRV_REGS('quadro', 'hist_' + h); const o = {}; L.forEach(x => { if (x.mat) o[String(x.mat)] = x.l || []; }); o.__ref = (L[0] || {}).ref || ''; return (_histCache[h] = o); };
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
    if (it.painel === 'salarios') { if (!ehRH()) it.erro = 'só a equipe RH pode carregar salários'; continue; }
    const p = E.paineis.find(x => x.id === it.painel);
    if (it.zip) { if (!it.painel) it.painel = 'curriculos'; continue; }
    if (!p) it.erro = `painel "${it.painel}" não existe no app`;
    else if (esperado && it.painel !== esperado) it.erro = `este arquivo é do painel "${p.nome}"`;
    else if (!podeEditar(p)) it.erro = 'sem permissão para este painel';
  }
  const validos = itens.filter(i => !i.erro);
  const nomeP = id => id === 'salarios' ? 'Salários (só RH)' : E.paineis.find(x => x.id === id)?.nome || id;
  abrirModal({
    titulo: validos.length > 1 ? `Carregar ${validos.length} arquivos de dados` : 'Atualizar dados',
    largo: itens.length > 1,
    corpo: `<p style="margin-top:0;color:var(--mut)">Os dados atuais de cada painel serão substituídos pela versão do arquivo. As anotações feitas no app (avaliações, programações, fichas…) <b>são mantidas</b>.</p>
      <div class="tabela-env" style="max-height:340px"><table class="tab"><thead><tr><th>Arquivo</th><th>Painel</th><th>Dados de</th><th>Situação</th></tr></thead><tbody>
      ${itens.map((i, n) => `<tr style="cursor:default"><td>${esc(i.f.name)}</td><td>${esc(i.painel ? nomeP(i.painel) : '—')}</td>
        <td>${i.rotulo ? esc(i.rotulo) + '<br><small>' + esc(fmtRef(i.pac.referencia)) + '</small>' : i.pac ? (i.pac.hist ? 'histórico da folha' : i.pac.estab ? 'lista de estabilidade (' + i.pac.itens.length + ')' : i.pac.entr ? 'entrevistas de desligamento (' + i.pac.itens.length + ')' : fmtRef(i.pac.referencia)) : (i.zip ? 'arquivos' : '—')}</td>
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
            if (i.pac.hist) { const n2 = await salvarHistorico(i.pac); st.innerHTML = `<span style="color:var(--cane)">✓ ${n2} pessoas</span>`; ok++; if (['depto', 'cargo'].includes(i.pac.hist) || /^(ocor|atest)/.test(i.pac.hist)) { clearTimeout(window._gerT); window._gerT = setTimeout(() => GESTOR().gerar(true).catch(() => {}), 4000); } continue; }
            if (i.pac.renIdade) { const quem = E.perfil.nome; const L = i.pac.itens.map(x => { const id = x.k.replace(/[^A-Z0-9]+/g, '_').slice(0, 90); return { painel:'renapsi', caminho:'idades/' + id, colecao:'idades', doc_id:id, dados:Object.assign({}, x, { em:new Date().toISOString(), por:quem }), atualizado_por:quem }; });
              const { error } = await sb.from('registros').upsert(L, { onConflict:'painel,caminho' }); if (error) throw error; st.innerHTML = `<span style="color:var(--cane)">✓ ${L.length} idades</span>`; ok++; continue; }
            if (i.pac.entr) { const n2 = await salvarEntrevistas(i.pac.itens); st.innerHTML = `<span style="color:var(--cane)">✓ ${n2} entrevistas</span>`; ok++; continue; }
            if (i.pac.estab) { const n2 = await salvarEstabilidade(i.pac.itens); st.innerHTML = `<span style="color:var(--cane)">✓ ${n2} de estabilidade</span>`; ok++; continue; }
            await salvarPacote(i.pac, i.f, t => st.textContent = t);
            st.innerHTML = '<span style="color:var(--cane)">✓ salvo</span>'; ok++;
          } catch(e){ console.error(e); st.innerHTML = `<span style="color:var(--coral)">${esc(traduzErro(e))}<br><small>${esc((e && (e.message || e.error || e.statusCode)) || String(e))}</small></span>`; }
        }
        bt.textContent = 'Concluído'; $('#pk-c').disabled = false; $('#pk-c').textContent = 'Fechar';
        setTimeout(() => GESTOR().gerar(true).catch(() => {}), 1500);
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
  moldura(`<div class="trilha"><button data-ir="#/">Visão Geral</button> › <b>Administração</b></div>
    <div class="abas">
      <button class="aba ${abaAdmin==='usuarios'?'ativa':''}" data-aba="usuarios">Usuários e acessos</button>
      <button class="aba ${abaAdmin==='paineis'?'ativa':''}" data-aba="paineis">Painéis e frentes</button>
      <button class="aba ${abaAdmin==='acessos'?'ativa':''}" data-aba="acessos">Acessos</button>
      <button class="aba ${abaAdmin==='historico'?'ativa':''}" data-aba="historico">Histórico</button>
      <button class="aba ${abaAdmin==='backup'?'ativa':''}" data-aba="backup">Cópia de segurança</button>
    </div><div id="admin-corpo" class="cartao"><div class="spinner" style="margin:20px auto"></div></div>`);
  document.querySelector('.trilha [data-ir]').onclick = () => location.hash = '#/';
  document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => { abaAdmin = b.dataset.aba; telaAdmin(); });
  if (abaAdmin === 'usuarios') return adminUsuarios();
  if (abaAdmin === 'paineis') return adminPaineis();
  if (abaAdmin === 'backup') return adminBackup();
  if (abaAdmin === 'acessos') return adminAcessos();
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
      const LIM = 32000, cortar = t => t.length > LIM ? t.slice(0, LIM) + ' … (texto cortado no Excel; completo no arquivo para restaurar)' : t;
      const cel = v => v == null ? '' : typeof v === 'object' ? cortar(JSON.stringify(v)) : typeof v === 'string' ? cortar(v) : v;   // o Excel aceita até 32.767 caracteres por célula
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
  const temG = data.some(u => u.papel === 'gestor'); const ug = temG ? await GESTOR().ultimaGeracao() : null;
  /* administradora central: só ela cadastra, altera, redefine senha e exclui usuários (marca 'admin:central' em perfis.frentes) */
  const ehCentralU = x => x && x.papel === 'admin' && (x.frentes || []).includes('admin:central');
  const temCentral = data.some(x => ehCentralU(x) && x.ativo), souCentral = ehCentralU(E.perfil) || (!temCentral && ehAdmin());
  c.innerHTML = `<div class="cartao-cab"><h3>${data.length} usuário(s)</h3>${souCentral ? '<button class="btn prim" id="u-novo">+ Novo usuário</button>' : ''}</div>
    ${souCentral ? '' : '<div class="cartao" style="padding:10px 14px;background:#fff7e6;border-color:#f0d199;color:#5c3b00;font-size:13.5px">Só a <b>administradora central</b> cadastra, altera, troca senha ou exclui usuários. Aqui você só consulta.</div>'}
    ${temG ? `<div class="gs-adm cartao"><div><b>Visão dos gestores</b><small>${ug && ug.em ? 'Atualizada em ' + esc(new Date(ug.em).toLocaleString('pt-BR')) + ' · ' + (ug.chaves || []).length + ' setor(es) ou departamento(s)' : 'Ainda não gerada'}. Atualiza sozinha quando você entra no app ou carrega as bases.</small></div><button class="btn borda" id="u-gerar">Atualizar agora</button></div>` : ''}
    <p style="color:var(--mut);margin-top:0;font-size:13px"><b>Administrador principal</b> faz tudo: importa bases, cria e tira painéis, cadastra usuários e muda configurações · <b>Equipe RH</b> vê todos os painéis (inclusive restritos) e faz todos os lançamentos, mas não importa bases nem mexe na estrutura · <b>Editor</b> vê e atualiza as frentes liberadas · <b>Leitor</b> só consulta as frentes liberadas · <b>Gestor de área</b> vê só a própria equipe (experiência, férias, frequência, novos e crachás), sem acesso aos painéis. Painéis <span class="selo restrito">restrito</span> são só de administradores.</p>
    ${data.map((u,i)=>`<div class="linha-u ${u.ativo?'':'inativo'}">
      <div class="av" style="background:${PALETA[i%PALETA.length]}">${esc(iniciais(u.nome))}</div>
      <div class="info"><b>${esc(u.nome)}</b> ${u.ativo?'':'<small>(desativado)</small>'}<br><small>@${esc(u.usuario)} · ${esc(ehCentralU(u) ? 'Administradora central' : papelDe(u))}${u.importa && u.papel !== 'admin' ? ' · importa planilhas' : ''}${u.papel==='admin'?' · todas as frentes':u.papel==='rh'?' · todos os painéis'+(u.importa?'':', só lançamentos'):(u.paineis_ver||[]).length||(u.paineis_editar||[]).length?` · ${u.frentes?.length ? esc(u.frentes.join(', ')) + ' + ' : ''}painéis: ${esc([...(u.paineis_ver||[]), ...(u.paineis_editar||[])].map(id => (E.paineis.find(x => x.id === id) || {}).nome || id).join(', '))}`:u.papel==='gestor'?` · ${(u.areas||[]).filter(k=>GESTOR().chaveOk(k)).length ? esc((u.areas||[]).filter(k=>GESTOR().chaveOk(k)).map(k=>(k[0]==='a'?'setor ':'depto. ')+GESTOR().nomeChave(k)).join(', ')) : 'nenhum setor vinculado'}`:` · ${u.frentes?.length ? esc(u.frentes.join(', ')) : 'nenhuma frente liberada'}`}</small></div>
      ${souCentral ? `<button class="btn peq borda" data-edit="${esc(u.user_id)}">Editar</button>
      <button class="btn peq borda" data-senha="${esc(u.user_id)}">Nova senha</button>
      ${u.user_id !== E.perfil.user_id ? `<button class="btn peq borda" data-exc="${esc(u.user_id)}" style="color:var(--coral)">Excluir</button>` : ''}` : ''}
    </div>`).join('')}`;
  const un = $('#u-novo'); if (un) un.onclick = () => formUsuario(null, data);
  c.querySelectorAll('[data-exc]').forEach(b => b.onclick = () => excluirUsuario(data.find(u => u.user_id === b.dataset.exc)));
  const bg = $('#u-gerar'); if (bg) bg.onclick = async () => { bg.disabled = true; bg.textContent = 'Atualizando…'; const r = await GESTOR().gerar(true).catch(e => ({ ok:false, erro:e }));
    if (r.ok) { toast(`Visão dos gestores atualizada (${r.n || 0} área(s)).`); adminUsuarios(); } else { toast(traduzErro(r.erro), true); bg.disabled = false; bg.textContent = 'Atualizar agora'; } };
  c.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formUsuario(data.find(u=>u.user_id===b.dataset.edit), data));
  c.querySelectorAll('[data-senha]').forEach(b => b.onclick = () => formSenha(data.find(u=>u.user_id===b.dataset.senha)));
}

function excluirUsuario(u){ if (!u) return;
  abrirModal({ titulo:'Excluir ' + u.nome,
    corpo:`<div id="x-msg"></div><p style="margin-top:0">O login de <b>${esc(u.nome)}</b> (@${esc(u.usuario)}) será apagado e a pessoa não entra mais no app. O que ela já lançou nos painéis continua guardado com o nome dela.</p>
      <p style="color:var(--mut);font-size:13px">Se for só temporário (férias, afastamento), prefira <b>Editar → desmarcar "Usuário ativo"</b>: dá para reativar depois.</p>
      <div class="campo"><label>Para confirmar, digite EXCLUIR</label><input id="x-conf" autocomplete="off"></div>`,
    pe:`<button class="btn borda" id="x-c">Cancelar</button><button class="btn prim" id="x-ok" style="background:var(--coral);border-color:var(--coral)">Excluir usuário</button>`,
    aoAbrir: () => { $('#x-c').onclick = fecharModal;
      $('#x-ok').onclick = async () => { const msg = t => $('#x-msg').innerHTML = `<div class="erro">${esc(t)}</div>`;
        if ($('#x-conf').value.trim().toUpperCase() !== 'EXCLUIR') return msg('Digite EXCLUIR para confirmar.');
        const bt = $('#x-ok'); bt.disabled = true; bt.textContent = 'Excluindo…';
        const { error } = await sb.rpc('admin_excluir_usuario', { p_user:u.user_id });
        if (error) { bt.disabled = false; bt.textContent = 'Excluir usuário'; const m = String(error.message || '').toLowerCase();
          return msg(m.includes('admin_excluir_usuario') || m.includes('could not find the function') ? 'Falta preparar o banco para excluir usuários: rode o arquivo 11_admin_central.sql no Supabase.' : traduzErro(error)); }
        registrar(null, 'excluiu usuário', u.nome + ' (@' + u.usuario + ')'); if (u.papel === 'gestor') GESTOR().gerar(true).catch(() => {});
        fecharModal(); toast('Usuário excluído.'); adminUsuarios(); }; } });
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
        ${['leitor','editor','gestor','rh','admin'].map(p=>`<option value="${p}" ${(u?.papel||'leitor')===p?'selected':''}>${nomePapel(p)}</option>`).join('')}</select></div>
      <div class="campo" id="u-frentes-box"><label>Frentes liberadas</label>
        <div class="checks">${frentes.map(f=>`<label><input type="checkbox" value="${esc(f)}" ${(u?.frentes||[]).includes(f)?'checked':''}> ${esc(f)}</label>`).join('')}</div></div>
      <div class="campo" id="u-pain-box"><label>Painéis liberados um a um</label><input id="u-pain-q" type="search" placeholder="Filtrar painéis" style="margin-bottom:6px">
        <div class="checks gs-areas u-pain">${E.paineis.filter(x => x.id !== 'curriculos' && x.id !== 'sysprocard-credito').slice().sort((a, b) => a.frente.localeCompare(b.frente, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR')).map(x => { const v = (u?.paineis_ver || []).includes(x.id), ed = (u?.paineis_editar || []).includes(x.id);
          return `<div class="u-pl" data-q="${esc(normal(x.nome + ' ' + x.frente))}"><span><b>${esc(x.nome)}</b><small>${esc(x.frente)}${x.nivel === 'restrito' ? ' · restrito' : ''}</small></span><label><input type="checkbox" data-pv="${esc(x.id)}" ${v || ed ? 'checked' : ''}> Ver e exportar</label><label><input type="checkbox" data-pe="${esc(x.id)}" ${ed ? 'checked' : ''}> Pode lançar</label></div>`; }).join('')}</div>
        <small style="color:var(--mut)">Além das frentes marcadas acima. Use para liberar só alguns painéis, por exemplo para Treinamento e Desenvolvimento. "Ver e exportar" permite consultar e baixar PDF e Excel, sem alterar nada. "Pode lançar" só quando você permitir.</small></div>
      <div class="campo oculto" id="u-tipo-box"><label>Este acesso é de</label>
        <div class="checks"><label><input type="radio" name="u-tipo" value="g" ${assistDe(u) ? '' : 'checked'}> Gestor da área</label><label><input type="radio" name="u-tipo" value="a" ${assistDe(u) ? 'checked' : ''}> Assistente / secretária de um gestor</label></div>
        <div id="u-gresp-box" ${assistDe(u) ? '' : 'hidden'} style="margin-top:6px"><select id="u-gresp" style="width:100%;margin-bottom:6px"><option value="">Escolha o gestor responsável</option>${todos.filter(x => x.papel === 'gestor' && !assistDe(x) && (!u || x.user_id !== u.user_id)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(x => `<option value="${esc(x.user_id)}" ${assistDe(u) && assistDe(u).id === x.user_id ? 'selected' : ''}>${esc(x.nome)}${x.ativo ? '' : ' (desativado)'}</option>`).join('')}</select>
        <small style="color:var(--mut);display:block">A assistente vê exatamente a mesma equipe do gestor escolhido e pode lançar tudo o que ele lança (férias, experiência, sanções, perfil). Ela assina com o próprio nome e o documento sai também com o nome do gestor responsável, que autorizou o preenchimento. Se o gestor mudar de setor, a assistente acompanha.</small></div></div>
      <div class="campo oculto" id="u-areas-box"><label>Setor(es) que o gestor vê</label><input id="u-areas-q" type="search" placeholder="Filtrar setores" style="margin-bottom:6px">
        <div class="checks gs-areas" id="u-areas"><small style="color:var(--mut)">Carregando as áreas do Quadro…</small></div>
        <small style="color:var(--mut)">Marque o setor inteiro (coluna Setor da planilha do Quadro) ou, em "escolher departamentos", só os departamentos que ele cuida. Dá para marcar mais de um. O gestor vê só as pessoas desses setores, sem CPF, salário, saúde ou ocorrências sensíveis.</small></div>
      <div class="campo" id="u-imp-box"><label><input type="checkbox" id="u-imp" ${u?.importa?'checked':''}> Pode importar planilhas (atualizar as bases dos painéis, como Quadro e cartões Convênio)</label><small style="color:var(--mut)">Para Equipe RH ou Editor. A pessoa ganha o item "Importar planilhas" no menu e atualiza só os painéis em que pode lançar. Apagar bases continua só com o administrador.</small></div>
      ${!novo ? `<div class="campo"><label><input type="checkbox" id="u-ativo" ${u.ativo?'checked':''}> Usuário ativo (desmarque para bloquear o acesso)</label></div>` : ''}`,
    pe: `<button class="btn borda" id="u-c">Cancelar</button><button class="btn prim" id="u-ok">${novo?'Criar usuário':'Salvar'}</button>`,
    aoAbrir: m => {
      const atualizaFrentes = () => { const pp = $('#u-papel').value; $('#u-frentes-box').classList.toggle('oculto', pp === 'admin' || pp === 'gestor' || pp === 'rh'); $('#u-pain-box').classList.toggle('oculto', pp === 'admin' || pp === 'gestor' || pp === 'rh'); $('#u-tipo-box').classList.toggle('oculto', pp !== 'gestor'); const ehA = pp === 'gestor' && (m.querySelector('[name=u-tipo]:checked') || {}).value === 'a'; $('#u-gresp-box').hidden = !ehA; $('#u-areas-box').classList.toggle('oculto', pp !== 'gestor' || ehA); $('#u-imp-box').classList.toggle('oculto', !['rh', 'editor'].includes(pp)); };
      $('#u-papel').onchange = atualizaFrentes; m.querySelectorAll('[name=u-tipo]').forEach(r => r.onchange = atualizaFrentes); atualizaFrentes();
      m.querySelectorAll('[data-pe]').forEach(i => i.onchange = () => { if (i.checked) m.querySelector(`[data-pv="${i.dataset.pe}"]`).checked = true; });
      m.querySelectorAll('[data-pv]').forEach(i => i.onchange = () => { if (!i.checked) m.querySelector(`[data-pe="${i.dataset.pv}"]`).checked = false; });
      $('#u-pain-q').oninput = e => { const q = normal(e.target.value); m.querySelectorAll('.u-pl').forEach(l => l.style.display = !q || l.dataset.q.includes(q) ? '' : 'none'); };
      GESTOR().opcoes().then(L => { const box = $('#u-areas'); if (!box) return; const sel = new Set(u?.areas || []);
        box.innerHTML = L.length ? L.map(o => { const algum = o.deps.some(d => sel.has(d.k)); return `<div class="u-st" data-q="${esc(normal(o.nome + ' ' + o.deps.map(d => d.nome).join(' ')))}">
            <div class="u-sth"><label><input type="checkbox" value="${esc(o.k)}" data-set="1" ${sel.has(o.k)?'checked':''}> <b>${esc(o.nome)}</b> <small>setor inteiro · ${o.n} pessoas</small></label><button type="button" class="link u-dep-t">${algum ? 'esconder' : 'escolher'} departamentos (${o.deps.length})</button></div>
            <div class="u-deps" ${algum ? '' : 'hidden'}>${o.deps.map(d => `<label><input type="checkbox" value="${esc(d.k)}" ${sel.has(d.k)?'checked':''} ${sel.has(o.k)?'disabled':''}> ${esc(d.nome)} <small>${d.n}</small></label>`).join('')}</div></div>`; }).join('') : '<small>Carregue o Quadro Geral para listar os setores.</small>';
        box.querySelectorAll('.u-dep-t').forEach(b => b.onclick = () => { const d = b.closest('.u-st').querySelector('.u-deps'); d.hidden = !d.hidden; b.textContent = (d.hidden ? 'escolher' : 'esconder') + b.textContent.replace(/^(escolher|esconder)/, ''); });
        box.querySelectorAll('[data-set]').forEach(i => i.onchange = () => i.closest('.u-st').querySelectorAll('.u-deps input').forEach(x => { x.disabled = i.checked; if (i.checked) x.checked = false; }));
        box.querySelectorAll('.u-deps label').forEach(l => l.dataset.q = normal(l.textContent));
        $('#u-areas-q').oninput = e => { const q = normal(e.target.value);
          box.querySelectorAll('.u-st').forEach(st => { const nome = normal(st.querySelector('.u-sth b').textContent), noSetor = !q || nome.includes(q), deps = [...st.querySelectorAll('.u-deps label')];
            deps.forEach(l => l.style.display = noSetor || l.dataset.q.includes(q) ? '' : 'none');
            const achouDep = !noSetor && deps.some(l => l.style.display !== 'none');
            st.style.display = noSetor || achouDep ? '' : 'none'; if (achouDep) st.querySelector('.u-deps').hidden = false; }); }; });
      $('#u-c').onclick = fecharModal;
      $('#u-ok').onclick = async () => {
        const bt = $('#u-ok'); const erro = t => { $('#u-msg').innerHTML = `<div class="erro">${esc(t)}</div>`; bt.disabled=false; bt.textContent = novo?'Criar usuário':'Salvar'; };
        const nome = $('#u-nome').value.trim();
        const papel = $('#u-papel').value;
        const ehAssist = papel === 'gestor' && (m.querySelector('[name=u-tipo]:checked') || {}).value === 'a';
        const gResp = ehAssist ? todos.find(x => x.user_id === $('#u-gresp').value) : null;
        if (ehAssist && !gResp) return erro('Escolha o gestor responsável pela assistente.');
        const fr = ehAssist ? ['assist:' + gResp.user_id, 'assistnome:' + gResp.nome] : papel === 'admin' ? ((u && (u.frentes || []).includes('admin:central')) ? ['admin:central'] : []) : papel === 'gestor' || papel === 'rh' ? [] : [...m.querySelectorAll('#u-frentes-box .checks input:checked')].map(x=>x.value);
        const ar = ehAssist ? (gResp.areas || []).slice() : papel === 'gestor' ? [...m.querySelectorAll('#u-areas input:checked:not(:disabled)')].map(x=>x.value).filter(k => GESTOR().chaveOk(k)) : [];
        if (papel === 'gestor' && !ar.length) return erro(ehAssist ? 'O gestor escolhido ainda não tem setor marcado. Marque os setores dele primeiro.' : 'Marque pelo menos um setor ou departamento para o gestor.');
        /* o gestor mudou de setor ou de nome: as assistentes dele acompanham */
        const syncAssist = async uid => { if (papel !== 'gestor' || ehAssist) return; for (const x of todos.filter(y => assistDe(y) && assistDe(y).id === uid)) { await sb.from('perfis').update({ areas:ar, frentes:['assist:' + uid, 'assistnome:' + nome] }).eq('user_id', x.user_id); } };
        const semPain = papel === 'admin' || papel === 'gestor' || papel === 'rh';
        const pe = semPain ? [] : [...m.querySelectorAll('[data-pe]:checked')].map(x => x.dataset.pe), pv = semPain ? [] : [...m.querySelectorAll('[data-pv]:checked')].map(x => x.dataset.pv).filter(id => !pe.includes(id));
        const comPain = o => (pv.length || pe.length || (u && u.paineis_ver !== undefined)) ? Object.assign(o, { paineis_ver:pv, paineis_editar:pe }) : o;
        const imp = ['rh', 'editor'].includes(papel) && $('#u-imp').checked;
        const comImp = o => (imp || (u && u.importa !== undefined)) ? Object.assign(o, { importa:imp }) : o;
        const comAreas = o => comImp(comPain((papel === 'gestor' || (u && u.areas !== undefined)) ? Object.assign(o, { areas:ar }) : o));
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
            const r = await sb.from('perfis').insert(comAreas({ user_id:data.user.id, usuario, nome, papel, frentes:fr }));
            if (r.error) throw r.error;
            registrar(null, 'criou usuário', `${nome} (@${usuario}) · ${ehAssist ? 'Assistente do gestor ' + gResp.nome : nomePapel(papel)}`);
            if (papel === 'gestor') GESTOR().gerar(true).catch(() => {});
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
            const r = await sb.from('perfis').update(comAreas({ nome, papel, frentes:fr, ativo })).eq('user_id', u.user_id);
            if (r.error) throw r.error;
            await syncAssist(u.user_id);
            registrar(null, 'alterou acesso', `${nome} · ${ehAssist ? 'Assistente do gestor ' + gResp.nome : nomePapel(papel)}${ativo?'':' · desativado'}`);
            if (papel === 'gestor' || u.papel === 'gestor') GESTOR().gerar(true).catch(() => {});
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

/* Importar planilhas: usuários do RH liberados pelo administrador atualizam as bases dos painéis em que podem lançar */
function telaImportar(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Importar planilhas</h1><div class="ini-data">Atualize as bases dos painéis com as planilhas do sistema (Quadro, cartões Convênio, Alimentação e Premium, férias, atestados e outras)</div></div></section>
    <section class="cartao"><div class="cartao-cab"><h3>Carregar planilhas</h3><button class="btn prim" id="im-lote">Escolher planilhas ou arquivos de dados</button></div>
      <p style="color:var(--mut);margin-top:0;font-size:13px">Pode escolher várias de uma vez: o app reconhece cada planilha e mostra para qual painel ela vai antes de salvar. Os lançamentos feitos no app (avaliações, programações, fichas) são mantidos.</p>
      <div class="tabela-env" style="max-height:none"><table class="tab"><thead><tr><th>Painel</th><th>Frente</th><th>Dados atuais</th><th></th></tr></thead><tbody>
      ${E.paineis.filter(p => podeEditar(p) && p.id !== 'curriculos').slice().sort((a, b) => a.frente.localeCompare(b.frente, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR')).map(p => { const m = E.metas[p.id];
        return `<tr data-id="${esc(p.id)}" style="cursor:default"><td><b>${esc(p.nome)}</b></td><td>${esc(p.frente)}</td><td>${m ? `${m.linhas == null ? 'dados de ' + fmtRef(m.referencia) : fmtNum(m.linhas) + ' linhas'}<br><small style="color:var(--mut)">atualizado ${new Date(m.atualizado_em).toLocaleDateString('pt-BR')}${m.atualizado_por ? ' por ' + esc(m.atualizado_por) : ''}</small>` : '—'}</td>
          <td><button class="btn peq prim im-1">${m ? 'Atualizar' : 'Carregar'}</button></td></tr>`; }).join('')}
      </tbody></table></div></section>`);
  $('#im-lote').onclick = () => escolherPacotes(null);
  document.querySelectorAll('tr[data-id] .im-1').forEach(b => b.onclick = () => escolherPacotes(b.closest('tr').dataset.id));
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

/* ---------- Acessos: quem entrou, quando, o que abriu e exportou ---------- */
let _acPer = 30;
async function adminAcessos(){
  const c = $('#admin-corpo'); c.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
  const desde = new Date(Date.now() - _acPer * 864e5).toISOString();
  const [pf, ac, lg] = await Promise.all([sb.from('perfis').select('user_id,nome,usuario,papel,ativo').order('nome'),
    lerAcessos(desde), Promise.resolve().then(() => sb.rpc('ultimos_logins')).then(r => r || { data:null }, () => ({ data:null }))]);
  if (ac.error) { c.innerHTML = `<div class="cartao vazio"><h3>O registro de acessos ainda não foi criado</h3><p>Rode o arquivo <b>07_acessos.sql</b> no SQL Editor do Supabase. Depois disso, cada entrada, tela aberta e exportação passa a ser registrada.</p></div>`; return; }
  const A = ac.data, LG = {}; (Array.isArray(lg && lg.data) ? lg.data : []).forEach(x => { if (x && x.user_id) LG[x.user_id] = x; });
  const hoje = Date.now(), dias = iso => Math.floor((hoje - new Date(iso)) / 864e5), dt = iso => iso ? new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
  const U = (pf.data || []).map(u => { const L = A.filter(a => a.user_id === u.user_id); const ult = [L[0] && L[0].em, LG[u.user_id] && LG[u.user_id].ultimo].filter(Boolean).sort().pop() || '';
    const top = {}; L.filter(a => a.acao === 'abriu' && a.onde && a.onde !== 'Início' && a.onde !== 'Visão Geral').forEach(a => top[a.onde] = (top[a.onde] || 0) + 1);
    return { u, L, ult, dd:new Set(L.map(a => a.em.slice(0, 10))).size, ab:L.filter(a => a.acao === 'abriu').length, ex:L.filter(a => a.acao === 'exportou').length, en:L.filter(a => a.acao === 'enviou').length,
      top:Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0].replace(/^Painel: /, '') + ' (' + x[1] + ')').join(', '), nunca:!ult, parado:ult && dias(ult) >= 30 }; });
  const at = U.filter(x => x.u.ativo), ent = at.filter(x => x.dd > 0), nun = at.filter(x => x.nunca), par = at.filter(x => x.parado);
  const st = x => !x.u.ativo ? '<span class="gs-st can">Desativado</span>' : x.nunca ? '<span class="gs-st dev">Nunca entrou</span>' : x.parado ? '<span class="gs-st pend">Sem acesso há ' + dias(x.ult) + ' dias</span>' : '<span class="gs-st ok">Em uso</span>';
  let F = window.__acF || '';
  const des = () => { const V = U.filter(x => !F || (F === 'nun' ? x.u.ativo && x.nunca : F === 'par' ? x.u.ativo && x.parado : F === 'ent' ? x.dd > 0 : true));
    c.innerHTML = `<div class="cartao-cab"><h3>Acessos dos usuários</h3><div class="vista-seg" style="margin:0;box-shadow:none">${[7, 30, 90].map(n => `<button data-per="${n}" class="${_acPer === n ? 'on' : ''}">${n} dias</button>`).join('')}</div></div>
      <section class="dk-kpis">${[['', 'Usuários ativos', at.length, '#2f6fa8'], ['ent', 'Entraram no período', ent.length, 'var(--cane)'], ['nun', 'Nunca entraram', nun.length, 'var(--coral)'], ['par', 'Sem acesso há 30+ dias', par.length, 'var(--amber)']].map(([k, t, n, cor]) => `<button class="dk-k ${F === k ? 'on' : ''}" data-fa="${k}" style="--c:${cor}"><span>${t}</span><b>${n}</b></button>`).join('')}</section>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin:8px 0"><button class="btn borda peq" id="ac-xls">Excel</button><button class="btn borda peq" id="ac-pdf">PDF</button></div>
      <div class="tabela-env"><table class="tab"><thead><tr><th>Usuário</th><th>Papel</th><th>Situação</th><th>Último acesso</th><th>Dias com acesso</th><th>Telas abertas</th><th>Exportações</th><th>Envios ao RH</th><th>Mais usado</th></tr></thead><tbody>
      ${V.map(x => `<tr data-u="${esc(x.u.user_id)}"><td><b>${esc(x.u.nome)}</b><br><small>@${esc(x.u.usuario || '')}</small></td><td>${esc(nomePapel(x.u.papel))}</td><td>${st(x)}</td><td>${x.ult ? esc(dt(x.ult)) : '—'}</td><td>${x.dd}</td><td>${x.ab}</td><td>${x.ex}</td><td>${x.en || '—'}</td><td><small>${esc(x.top || '—')}</small></td></tr>`).join('') || '<tr><td colspan="9">Ninguém aqui.</td></tr>'}</tbody></table></div>
      <p class="nr-fonte">Período: últimos ${_acPer} dias. O último acesso considera também o login registrado pelo Supabase. Clique em uma pessoa para ver tudo o que ela fez. Cada pessoa só grava o próprio acesso; só o administrador principal vê esta aba.</p>`;
    c.querySelectorAll('[data-per]').forEach(b => b.onclick = () => { _acPer = +b.dataset.per; adminAcessos(); });
    c.querySelectorAll('[data-fa]').forEach(b => b.onclick = () => { F = window.__acF = F === b.dataset.fa ? '' : b.dataset.fa; des(); });
    c.querySelectorAll('[data-u]').forEach(r => r.onclick = () => verAcessos(U.find(x => x.u.user_id === r.dataset.u)));
    const linhas = () => V.map(x => [x.u.nome, '@' + (x.u.usuario || ''), nomePapel(x.u.papel), !x.u.ativo ? 'Desativado' : x.nunca ? 'Nunca entrou' : x.parado ? 'Sem acesso há ' + dias(x.ult) + ' dias' : 'Em uso', x.ult ? dt(x.ult) : '', x.dd, x.ab, x.ex, x.en, x.top]);
    const CAB = ['Usuário', 'Login', 'Papel', 'Situação', 'Último acesso', 'Dias com acesso', 'Telas abertas', 'Exportações', 'Envios ao RH', 'Mais usado'];
    $('#ac-xls').onclick = () => { const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet([['Acessos dos usuários · últimos ' + _acPer + ' dias · CRV Industrial'], [], CAB].concat(linhas())); ws['!cols'] = CAB.map((_, i) => ({ wch:i ? 16 : 34 })); XLSX.utils.book_append_sheet(wb, ws, 'Acessos');
      baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Acessos dos usuários.xlsx'); };
    $('#ac-pdf').onclick = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' }); cabecalhoPDF(doc, 'Acessos dos usuários', 'Últimos ' + _acPer + ' dias');
      doc.autoTable({ startY:104, head:[CAB], body:linhas().map(l => l.map(String)), margin:{ left:30, right:30 }, styles:{ fontSize:8, cellPadding:3 }, headStyles:{ fillColor:[36,66,124] } }); rodapePDF(doc); baixar(doc.output('blob'), 'Acessos dos usuários.pdf'); }; };
  des();
  function verAcessos(x){ if (!x) return; let T = '';
    const NOM = { entrou:'Entrou', abriu:'Abriu', exportou:'Exportou', enviou:'Enviou ao RH', saiu:'Saiu' };
    const corpo = () => { const L = x.L.filter(a => !T || a.acao === T);
      return `<div class="vista-seg" style="box-shadow:none;margin:0 0 10px">${[['', 'Tudo'], ['entrou', 'Entradas'], ['abriu', 'Telas'], ['exportou', 'Exportações'], ['enviou', 'Envios']].map(([k, t]) => `<button data-t="${k}" class="${T === k ? 'on' : ''}">${t} (${k ? x.L.filter(a => a.acao === k).length : x.L.length})</button>`).join('')}</div>
        <div class="tabela-env" style="max-height:420px"><table class="tab"><thead><tr><th>Quando</th><th>Ação</th><th>Onde</th><th>Detalhe</th></tr></thead><tbody>${L.map(a => `<tr style="cursor:default"><td>${esc(dt(a.em))}</td><td>${esc(NOM[a.acao] || a.acao)}</td><td>${esc(a.onde || '—')}</td><td><small>${esc(a.detalhe || '')}</small></td></tr>`).join('') || '<tr><td colspan="4">Nada no período.</td></tr>'}</tbody></table></div>`; };
    abrirModal({ titulo:x.u.nome + ' · ' + nomePapel(x.u.papel), largo:true, corpo:'<div id="ac-c"></div>', pe:'<button class="btn borda" id="ac-ux">Excel</button><span style="flex:1"></span><button class="btn prim" id="ac-ok">Fechar</button>',
      aoAbrir: m => { const r = () => { m.querySelector('#ac-c').innerHTML = corpo(); m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { T = b.dataset.t; r(); }); }; r(); m.querySelector('#ac-ok').onclick = fecharModal;
        m.querySelector('#ac-ux').onclick = () => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Quando', 'Ação', 'Onde', 'Detalhe']].concat(x.L.filter(a => !T || a.acao === T).map(a => [dt(a.em), NOM[a.acao] || a.acao, a.onde || '', a.detalhe || '']))), 'Acessos');
          baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Acessos - ' + x.u.nome + '.xlsx'); }; } }); }
}
async function lerAcessos(desde){ const out = []; for (let i = 0; i < 20000; i += 1000) { const { data, error } = await sb.from('acessos').select('user_id,acao,onde,detalhe,em').gte('em', desde).order('em', { ascending:false }).range(i, i + 999); if (error) return { error }; out.push(...(data || [])); if (!data || data.length < 1000) break; } return { data:out }; }
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
  moldura(`<div class="trilha"><button data-ir="#/">Visão Geral</button> › <b>Minha conta</b></div>
    <div class="cartao" style="max-width:520px">
      <div class="cartao-cab"><h3>${esc(p.nome)}</h3><span class="chip-papel">${esc(nomePapel(p.papel))}</span></div>
      <p style="color:var(--mut);margin-top:0">Usuário: <b>@${esc(p.usuario)}</b><br>${assistDe(p) ? 'Gestor responsável: <b>' + esc(nomeBonito(assistDe(p).nome)) + '</b>' : 'Frentes: ' + (p.papel==='admin' ? 'todas' : (p.frentes?.length ? esc(p.frentes.join(', ')) : 'nenhuma'))}</p>
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
    const bt = $('#c-ok'); bt.disabled = true; bt.textContent = 'Salvando…';
    try {
      /* renova a sessão antes: sessão antiga (app aberto há muito tempo) faz a troca falhar sem explicar */
      try { await sb.auth.refreshSession(); } catch(_){}
      const { error } = await sb.auth.updateUser({ password: a });
      if (error) { console.warn('troca de senha', error); return msg(traduzErro(error)); }
      registrar(null, 'trocou a própria senha', ''); msg('Senha alterada. Na próxima entrada, use a nova senha.', true); $('#c-s1').value = $('#c-s2').value = '';
    } catch(e){ msg(traduzErro(e)); } finally { bt.disabled = false; bt.textContent = 'Salvar nova senha'; }
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
/* atualização automática: confere a versão publicada e mostra a faixa "Nova versão disponível" */
(function(){
  const cmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
  let mostrada = '';
  async function atualizarAgora(){ const b = document.getElementById('nv-bar'); if (b) b.querySelector('button').textContent = 'Atualizando…';
    try { const r = await navigator.serviceWorker?.getRegistration(); if (r) { await r.update(); if (r.waiting) r.waiting.postMessage('skip'); } } catch(_){}
    try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch(_){}
    location.reload(); }
  window.CRV_ATUALIZAR_APP = atualizarAgora;
  async function conferir(){ try { if (!navigator.onLine) return;
      const t = await (await fetch('config.js?t=' + Date.now(), { cache:'no-store' })).text(); const m = t.match(/VERSAO:\s*'([\d.]+)'/); if (!m) return;
      const nova = m[1]; if (cmp(nova, CFG.VERSAO) <= 0 || mostrada === nova) return; mostrada = nova;
      let b = document.getElementById('nv-bar'); if (!b) { b = document.createElement('div'); b.id = 'nv-bar'; document.body.appendChild(b); }
      b.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;background:#14213d;color:#fff;border-radius:12px;padding:10px 12px 10px 16px;display:flex;gap:12px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.35);font-size:14px;max-width:calc(100% - 24px);flex-wrap:wrap';
      b.innerHTML = `<span><b>Nova versão do app disponível</b> (${nova}). Você está na ${CFG.VERSAO}.</span><button style="border:0;background:#e9a23b;color:#16284d;border-radius:8px;padding:7px 14px;font:700 13px inherit;font-family:inherit;cursor:pointer">Atualizar agora</button><button title="Depois" style="border:0;background:transparent;color:#cfd6e4;font-size:18px;cursor:pointer;padding:0 4px">×</button>`;
      const [ok, x] = b.querySelectorAll('button'); ok.onclick = atualizarAgora; x.onclick = () => b.remove();
    } catch(_){} }
  setTimeout(conferir, 20000); setInterval(conferir, 5 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') conferir(); });
  window.addEventListener('focus', () => conferir());
})();

sb.auth.onAuthStateChange((evento) => { if (evento === 'SIGNED_OUT' && E.perfil) { E.perfil = null; telaLogin(); } });
prepararLogo();
iniciar();
})();
