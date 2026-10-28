/* =====================================================================
   ORGANOGRAMA DO RH (Gestão de Pessoas) + SETORES LIGADOS À GESTÃO DE PESSOAS
   Seções: Gestão de Pessoas (Quadro + jovens aprendizes do RH), T&D e Serviços Gerais; outras podem ser
   acrescentadas no próprio app ("Adicionar setor ligado ao RH"), sem mexer no código.
   Quem entra em cada seção: ativos do Quadro Geral cujo departamento bate com a seção (grafias diferentes contam
   como o mesmo), mais inclusões manuais e menos as retiradas. Nos setores ligados, afastados não entram.
   Desligado no Quadro (ou baixa do jovem) sai sozinho. Nunca mostra salário, CPF ou dados pessoais.
   Configuração: registros do Quadro, caminho 'sistema/organograma'. Fotos: coleção 'org_foto' (uma por pessoa),
   só recorte/enquadramento da foto enviada (nada é alterado ou gerado).
   ===================================================================== */
window.CRV_ORG_INIT = function(X){
'use strict';
const { sb, E, $, esc, moldura, toast, traduzErro, ehRH } = X;
const quem = () => (E.perfil && E.perfil.nome) || '';
const nrm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const tc = s => String(s || '').toLowerCase().replace(/(^|[\s\/(.-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Dos|Das|E) /g, m => m.toLowerCase()).replace(/\b(Ii|Iii|Iv|Rh|Crv|Dp|T&d|Td)\b/gi, m => m.toUpperCase()).replace(/\((A|O|As|Os)\)/g, m => m.toLowerCase()).replace(/\.(\S)/g, '. $1').replace(/\bServicos\b/g, 'Serviços').replace(/\bLider\b/g, 'Líder');
const NIV = [ { n:'Gerência', c:'#1f3a68' }, { n:'Coordenação e liderança', c:'#2e7d4f' }, { n:'Analistas, assistentes e técnicos', c:'#b5731a' }, { n:'Auxiliares e operacionais', c:'#1d7a88' }, { n:'Jovens aprendizes', c:'#7b3fa0' } ];
const SETOR_JOV = /^(RH|RECURSOS HUMANOS|GESTAO DE PESSOAS)$/;  // setor de alocação do jovem no RH
const nivelAuto = p => { if (p.jovem) return 4; const f = nrm(p.funcao); if (/GERENTE|GERENCIA|DIRETOR/.test(f)) return 0; if (/COORDENAD|SUPERVIS|LIDER|ENCARREGAD/.test(f)) return 1; if (/AUXILIAR|AJUDANTE|RECEPCION|ESTAGI|ZELADOR|SERVICOS GERAIS|SERV GERAIS|LIMPEZA|COPEIR|JARDINEIR|PORTEIR/.test(f)) return 3; return 2; };
const grau = f => { const m = nrm(f).match(/\b(I{1,3}|IV|V)\b\s*$/); return m ? ({ I:1, II:2, III:3, IV:4, V:5 })[m[1]] : 0; };
const funcBase = f => tc(String(f || '').replace(/\s+(I{1,3}|IV|V)\s*$/i, '').trim());
const iniciais = n => String(n || '?').split(/\s+/).filter(w => w.length > 2 || /^[A-Z]/.test(w)).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const corDe = k => { const P = ['#2e7d4f', '#b5731a', '#7b3fa0', '#1d7a88', '#c0583f', '#5b3f9e', '#8a7a2e', '#2f6fa8']; let h = 0; String(k).split('').forEach(c => h = (h * 31 + c.charCodeAt(0)) >>> 0); return P[h % P.length]; };
const brD = s => { s = String(s || ''); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[3] + '/' + m[2] + '/' + m[1]; return s.slice(0, 10); };
const iso = s => { s = String(s || ''); const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : s.slice(0, 10); };
const tempoCasa = adm => { adm = iso(adm); if (!/^\d{4}-\d{2}-\d{2}$/.test(adm)) return ''; const a = new Date(adm + 'T12:00:00'), h = new Date(); let m = (h.getFullYear() - a.getFullYear()) * 12 + (h.getMonth() - a.getMonth()); if (h.getDate() < a.getDate()) m--; if (m < 0) return '';
  const y = Math.floor(m / 12), r = m % 12; return y ? y + (y === 1 ? ' ano' : ' anos') + (r ? ' e ' + r + (r === 1 ? ' mês' : ' meses') : '') : r ? r + (r === 1 ? ' mês' : ' meses') : 'menos de 1 mês'; };
const pessoasTxt = n => n + (n === 1 ? ' pessoa' : ' pessoas');

/* atividades informadas pelo RH (preenchimento inicial; depois de salvo na ficha, vale o que estiver salvo) */
const ASSIST = 'Triagem de candidatos\nOrganização documental\nContratos físicos\nConferência das informações\nInterface com áreas\nCumprimento de prazos\nSanções disciplinares\nIndicadores (acompanhamento)\nWhatsApp interno e externo';
/* Serviços Gerais: atividades, local e horário de serviço (planilha ATIVIDADES_EQUIPE_SOL, equipe da Solange, 28/10/2026) */
const PADRAO_SG = {
"q:6373": {
"faz": "Recepção da portaria\nBanheiro feminino\nBanheiro masculino\nSala de monitoramento e supervisor\nSala do Tenente Ricardo\nSala de arquivo\nSala do operacional CTT\nSala DML\nBalança",
"local": "Portaria dos veiculos / balança",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:38581": {
"faz": "Capela\nSala Dr. Paulo Filho\nSala de reunião\nSala Dr. Leonardo\nRecepção\nJuridico\nTI\nFaturamento\nCopa\nBanheiro ADM masculino/feminino\nBanheiro masculino agricola\nSala DML",
"local": "Diretoria / ADM central / ADM agricola",
"horario": "Turno A · 06:00 às 16:00",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço. (Na parte da manhã colaboradora auxilia na manutenção da Sala Agrícola)"
},
"q:17036": {
"faz": "Salas\nBanheiros almoxarifado masculino / feminino\nSala do PCM\nSala reunião oficina\nSala ferramentaria/hidraulica\nBanheiro masculino e feminino do escritorio oficina\nBanheiros masculinos oficina I e II",
"local": "Almoxarifado / oficina",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço. Colaboradora da Apoio no banheiro da Caldeiraria."
},
"q:17103": {
"faz": "Sala Dr. Ludeir\nSala (projeto, TI, Pedro e Dean)\nRecepção\nBanheiro masculino e feminino ADM\nPCM industria\nSala Bruno armazém\nSala qualidade\nSala reunião\nSala fabrica\nBanheiro masculino / feminino (PCM)\nSala eletrica, ferramentaria e instrumentação",
"local": "ADM industrial",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:36870": {
"faz": "Auditorio, salas (ambulatorio, RH, portaria,segurança do trabalho)\nSala do agricola\nSala PCM oficina\n(recolhimento do lixo e manutenção)",
"local": "Auditorio / ambulatorio / segurança do trabalho / sala agricola / PCM oficina",
"horario": "Turno B · 15:00 às 23:20",
"obs": "Limpeza realizada na parte da tarde e manutenção após Janta."
},
"q:18776": {
"faz": "Conforto dos motoristas\nSala da herbicida\nVestiario masculino (herbicida)\nManutençao nos banheiros",
"local": "Herbicida",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço. Apoio em limpeza de bebedouros e outros setores."
},
"q:11400": {
"faz": "Vestiario feminino e masculino\nSala vigilantes\nSala recepção\nSala ambulatorio e segurança do trabalho\nSala RH",
"local": "Vestiarios / salas predio portaria pedestre",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:36729": {
"faz": "Fazer café\nLimpeza do refeitorio I e II, limpeza da copa\nHigienização estufas e freezer",
"local": "Refeitorio e copa",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:17851": {
"faz": "Limpeza geral refeitorio I e II\nLimpeza das calçadas\nManutenção nas lixeiras\nApoio no almoço no refeitorio",
"local": "Refeitorio",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço. Apoio sempre que necessario nos outros setores."
},
"q:25677": {
"faz": "Limpeza de bebedouros e purificadores\nTroca e manutenção em todos os objetos danificados na empresa (maçaneta, vasos, mictorios, montagem de moveis e etc...) reposição de materiais de limpeza nos DML",
"local": "Manutenção (prefeito)",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço. Apoio sempre que necessario nos outros setores."
},
"q:17644": {
"faz": "Fazer café\nAuditorio, salas (ambulatorio, RH, portaria)\nBanheiros femininos e masculinos\nSala do agricola\nSala PCM oficina\nRefeitorio (recolhimento do lixo e manutenção)",
"local": "Predio portaria central / oficina / agricola",
"horario": "Turno B · 15:00 às 23:20",
"obs": "Limpeza realizada na parte da tarde e manutenção após Janta."
},
"q:17670": {
"faz": "Limpeza de salas (destilaria, casa de força, caldeira, difusor e limpeza e manutenção de bebedouros da area industrial.) apoio apos o almoço nas salas (RH, DP , segurança do trabalho.)",
"local": "Supervisorios da industria",
"horario": "Turno A · 07:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:22147": {
"faz": "Limpeza do predio\nLimpeza de bebedouros e purificadores\nLavar roupas de cama",
"local": "Alojamentos - Pombo / casa do Alan e casa da Bia",
"horario": "Turno A · 07:00 às 16:00",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:4182": {
"faz": "Limpeza do predio\nLimpeza de bebedouros e purificadores\nLavar roupas de cama",
"local": "Alojamentos - Zebrina I / Andes e casa da Bia",
"horario": "Turno A · 07:00 às 16:00",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:21040": {
"faz": "Limpeza do predio\nLimpeza de bebedouros e purificadores\nLavar roupas de cama",
"local": "Alojamentos - Zebrinha II e Roma",
"horario": "Turno A · 07:00 às 16:00",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:42420": {
"faz": "Fazer café\nLimpeza salas (meio ambiente, COA, COI, armazém)\nSala Dr. Cristiano\nBanheiro masculino e feminino\nSala guarita\nRefeitorio\nSala DML\nLimpeza bebedouros",
"local": "Deposito fechado (armazém externo)",
"horario": "Turno A · 06:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço. Apoio sala armazém durante a Safra."
},
"q:1090": {
"faz": "Dr. Marcos Coutinho, Pedro e Dean\nDr. Ronaldo",
"local": "Casas de apoio",
"horario": "Turno A · 07:00 às 16:00",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço. Apoio nos alojamentos quando necessario (menos banheiros)."
},
"q:42419": {
"faz": "Limpeza e organização de todos os banheiros industriais",
"local": "Banheiros femininos / masculinos industria (caldeiraria / sacarose / destilaria)",
"horario": "Turno A · 06:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:44258": {
"faz": "Limpeza do predio\nLimpeza de bebedouros e purificadores\nLavar roupas de cama",
"local": "Alojamentos - Ituiutaba Japungu",
"horario": "Turno A · 07:00 às 16:00",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:42018": {
"faz": "Tira folga de 5 colaboradores turno a",
"local": "Folguista",
"horario": "Turno A · 06:00 às 15:20",
"obs": "Limpeza realizada na parte da manhã e manutenção após Almoço."
},
"q:16809": {
"faz": "Jardinagem",
"local": "Casa diretoria",
"horario": "Horário administrativo",
"obs": ""
},
"q:5897": {
"faz": "Cozinheira",
"local": "Casa diretoria",
"horario": "Horário administrativo",
"obs": ""
},
"q:18442": {
"faz": "Auxiliar nas tarefas limpeza residencial",
"local": "Casa diretoria",
"horario": "Horário administrativo",
"obs": ""
}
};

const PADRAO0 = { 'q:6932':{ faz:ASSIST }, 'q:15441':{ faz:ASSIST },
  'q:2471':{ faz:'Onboarding\nAcompanhamento de experiência\nFérias\nVida funcional\nTreinamentos (controle) relacionados à jornada\nJovem Aprendiz\nDemissões\nRH Externo\nAplicativo Gestão de Pessoas\nSocial (eventos)\nMídia / comunicação\nNotas fiscais (lançamentos) e pedidos\nSanções disciplinares\nIndicadores (acompanhamento)' },
  'q:16068':{ faz:'Gestão dos benefícios\nAtendimento de demandas\nOuvidorias\nRegistro das manifestações\nEncaminhamento\nAcompanhamento das soluções\nNotas fiscais (lançamentos) e pedidos\nSanções disciplinares\nIndicadores (acompanhamento)' },
  'q:334':{ faz:'Gestão estratégica de pessoas\nCoordenação da equipe de RH\nGestão de desempenho\nClima organizacional e engajamento\nApoio às lideranças e gestão de conflitos\nSupervisão das rotinas de administração de pessoas\nGestão de políticas e procedimentos de RH\nGestão de indicadores de pessoas\nSocial (eventos)\nMídia / comunicação' },
  'j:jovem:123':{ faz:'Checklist\nContratos\nArquivo' },
  'j:jovem:175':{ faz:'Mídia do RH\nProdução de vídeos (audiovisual) de divulgação e integração de novos colaboradores' },
  'j:jovem:158':{ faz:'Arquivo de treinamentos\nChecklist\nProtocolar documentos\nLançar treinamentos' },
  'j:jovem:93':{ faz:'Transmitir a integração (em vídeo)\nResponder o WhatsApp do RH (interno e externo)\nFiltrar currículos' },
  'q:45433':{ faz:'Recepção e atendimento interno\nConexão com contratos\nColeta de assinaturas\nApoio na chegada à área\nOrientação inicial\nWhatsApp interno e externo' } };
const PADRAO = Object.assign({}, PADRAO0, PADRAO_SG);
const infoDe = k => Object.assign({}, PADRAO[k] || {}, CFG.info[k] || {});

/* ---------- seções (as fixas aqui; as acrescentadas pelo RH ficam em CFG.extras) ---------- */
const IC = {
  gp:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c2.9.3 5.5 2.6 5.5 5.8"/>',
  td:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
  sg:'<path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 21v-6h6v6"/>',
  x:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' };
const SEC_BASE = [
  { id:'gp', nome:'Gestão de Pessoas', curto:'Gestão de Pessoas', cor:'#2e7d4f', ic:IC.gp, jov:true, ok:s => /^GESTAO DE PESSOAS$/.test(s) },
  { id:'td', nome:'T&D – Treinamento e Desenvolvimento', curto:'T&D', cor:'#c0583f', ic:IC.td, ligado:true, ok:s => /TREINAMENTO|\bT ?& ?D\b|DESENVOLVIMENTO TD/.test(s) },
  { id:'sg', nome:'Serviços Gerais', curto:'Serviços Gerais', cor:'#8a7a2e', ic:IC.sg, ligado:true, agrupar:true, ok:s => /\bSERV(ICOS?|\.)? ?GER(AIS|\.)?\b/.test(s) } ];
const COR_EXTRA = ['#7b3fa0', '#1d7a88', '#b5731a', '#5b3f9e', '#a3485a'];
const SECS = () => SEC_BASE.concat((CFG.extras || []).map((x, i) => { const S = new Set((x.setores || []).map(nrm)); return { id:x.id, nome:x.nome, curto:x.nome, cor:x.cor || COR_EXTRA[i % COR_EXTRA.length], ic:IC.x, ligado:true, extra:true, ok:s => S.has(s) }; }));
const cs = s => s.id === 'gp' ? CFG : (CFG.sec[s.id] || (CFG.sec[s.id] = { conf:false, inc:[], exc:[] }));
const muitos = (s, n) => s.agrupar ? n > 10 : n > 14;   // agrupa os cartões por função quando a seção é grande

let CFG = null, FOTOS = {}, G = [], VIEW = '', FONTES = null;
async function lerCfg(){ const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/organograma').maybeSingle();
  CFG = Object.assign({ conf:false, inc:[], exc:[], chefe:{}, nivel:{}, info:{}, sec:{}, extras:[] }, (data && data.dados) || {}); CFG.sec = CFG.sec || {}; CFG.extras = CFG.extras || []; }
async function salvarCfg(){ const dados = Object.assign({}, CFG, { em:new Date().toISOString(), por:quem() });
  const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'sistema/organograma', colecao:'sistema', doc_id:'organograma', dados, atualizado_por:quem() }, { onConflict:'painel,caminho' }); if (error) throw error; }
async function lerFotos(){ FOTOS = {}; try { const { data } = await sb.from('registros').select('doc_id,dados').eq('painel', 'quadro').eq('colecao', 'org_foto'); (data || []).forEach(r => { if (r.dados && r.dados.img) FOTOS[r.doc_id] = r.dados.img; }); } catch(_){} }
async function salvarFoto(k, img){ const { error } = await sb.from('registros').upsert({ painel:'quadro', caminho:'org_foto/' + k, colecao:'org_foto', doc_id:k, dados:{ img, em:new Date().toISOString(), por:quem() }, atualizado_por:quem() }, { onConflict:'painel,caminho' }); if (error) throw error; if (img) FOTOS[k] = img; else delete FOTOS[k]; }

/* ---------- quem pode entrar: Quadro + jovens das duas instituições ---------- */
async function fontes(){
  const Q = window.CRV_QUADRO ? await window.CRV_QUADRO() : null; const M = (Q && Q.mapa) || {};
  const quadro = Object.entries(M).filter(([, c]) => c.situacao !== 'Desligado').map(([m, c]) => ({ key:'q:' + m, mat:m, nome:c.nome, funcao:c.funcao, setor:c.setor, area:c.area, adm:c.admissao, sit:c.situacao, origem:'Quadro Geral' }));
  const jov = [];
  const um = async (painel, ent) => { let d = null; try { d = await window.CRV_DADOS(painel); } catch(_){} const D = (d && d.dados) || {};
    let REG = {}, SET = {}; try { (await window.CRV_REGS(painel, 'jovens')).forEach(r => REG[r._id] = r); } catch(_){} try { (await window.CRV_REGS(painel, 'setores')).forEach(r => SET[r._id] = r); } catch(_){}
    const base = painel === 'jovem' ? (D.BASE || []).filter(b => b.st !== 'Desligado').map(b => ({ mat:String(b.mat || ''), nome:b.nome, setor:b.setor, ini:b.ini, fim:b.fim, cpf:b.cpf }))
      : (((D.MESES || [])[(D.MESES || []).length - 1] || {}).jovens || []).map(j => ({ mat:String(j.mat || ''), nome:j.n, setor:j.setor, ini:j.ini, fim:j.fim, cpf:j.cpf }));
    /* jovens cadastrados no app */
    Object.entries(REG).forEach(([k, r]) => { if (r.excluido || !r.novo || !r.dados) return; const dd = r.dados; if (base.some(b => b.mat && b.mat === String(dd.mat || ''))) return; base.push({ mat:String(dd.mat || k), nome:dd.nome, setor:dd.setor, ini:dd.ini, fim:dd.fim }); });
    base.forEach(b => { const r = REG[b.mat] || REG['cpf' + String(b.cpf || '').replace(/\D/g, '')] || {}; if (r.excluido || (r.baixa && r.baixa.data)) return;
      const setor = (SET[b.mat] && SET[b.mat].setor) || (r.dados && r.dados.setor) || b.setor || '';
      jov.push({ key:'j:' + painel + ':' + b.mat, mat:b.mat, nome:b.nome, funcao:'Jovem Aprendiz', setor, ini:iso(b.ini), fim:iso(b.fim), entidade:ent, jovem:true, origem:'Jovem Aprendiz · ' + ent }); }); };
  await Promise.all([um('jovem', 'Instituto João Bittar'), um('renapsi', 'RENAPSI')]);
  FONTES = { quadro, jov, porK:new Map(quadro.concat(jov).map(p => [p.key, p])) };
  return FONTES;
}
/* encontrados automaticamente para a seção (antes das inclusões/retiradas manuais) */
const achadosDe = (s, F) => F.quadro.filter(p => s.ok(nrm(p.setor)) && (!s.ligado || p.sit !== 'Afastado')).concat(s.jov ? F.jov.filter(p => SETOR_JOV.test(nrm(p.setor))) : []);
async function montar(){
  const F = await fontes();
  G = SECS().map(s => { const c = cs(s); const ach = achadosDe(s, F); const ks = new Set(ach.map(p => p.key)); (c.inc || []).forEach(k => ks.add(k)); (c.exc || []).forEach(k => ks.delete(k));
    const pess = [...ks].map(k => F.porK.get(k)).filter(p => p && (!s.ligado || p.sit !== 'Afastado')).map(p => Object.assign({}, p, { sec:s.id, nivel:CFG.nivel[p.key] != null ? +CFG.nivel[p.key] : nivelAuto(p), manual:(c.inc || []).includes(p.key) }));
    hierarquia(pess); return { s, pess, ach, conf:!!c.conf }; });
}
/* responde a: manual ou o líder mais próximo acima (gerência/coordenação/liderança), sempre dentro da mesma seção */
function hierarquia(P){
  const ord = (a, b) => a.nivel - b.nivel || grau(b.funcao) - grau(a.funcao) || String(iso(a.adm)).localeCompare(String(iso(b.adm))) || String(a.nome).localeCompare(String(b.nome), 'pt-BR');
  P.sort(ord);
  P.forEach(p => { const m = CFG.chefe[p.key]; if (m === '-') { p.chefe = ''; return; } if (m && m !== p.key && P.some(x => x.key === m)) { p.chefe = m; return; }
    const acima = P.filter(x => x.nivel < p.nivel); if (!acima.length) { p.chefe = ''; return; }
    const lid = acima.filter(x => x.nivel <= 1); const alvo = (lid.length ? lid : acima).sort((a, b) => b.nivel - a.nivel || ord(a, b))[0]; p.chefe = alvo ? alvo.key : ''; });
  P.forEach(p => { const vis = new Set([p.key]); let c = p.chefe; while (c) { if (vis.has(c)) { p.chefe = ''; break; } vis.add(c); c = (P.find(x => x.key === c) || {}).chefe; } });
}
const acharP = k => { for (const g of G) { const p = g.pess.find(x => x.key === k); if (p) return [p, g]; } return [null, null]; };
/* grupos por função (para seções grandes): liderança à parte, depois um bloco por função */
function grupos(P){ const lid = P.filter(p => p.nivel <= 1), M = new Map();
  P.filter(p => p.nivel > 1).forEach(p => { const f = funcBase(p.funcao) || 'Sem função'; if (!M.has(f)) M.set(f, []); M.get(f).push(p); });
  const B = [...M.entries()].map(([f, L]) => ({ f, L:L.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')) })).sort((a, b) => b.L.length - a.L.length || a.f.localeCompare(b.f, 'pt-BR'));
  return { lid, B }; }

/* ---------- layout em níveis (o mesmo para a tela e o PDF) ---------- */
function layout(P, cw, ch, gx, gy){
  const lv = [...new Set(P.map(p => p.nivel))].sort((a, b) => a - b); const pos = {}; let maxW = 0;
  lv.forEach((n, i) => { const L = P.filter(p => p.nivel === n);
    L.sort((a, b) => { const xa = pos[a.chefe] ? pos[a.chefe].x : -1, xb = pos[b.chefe] ? pos[b.chefe].x : -1; return xa - xb || grau(b.funcao) - grau(a.funcao) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'); });
    const w = L.length * cw + (L.length - 1) * gx; maxW = Math.max(maxW, w); L.forEach((p, j) => { pos[p.key] = { x:j * (cw + gx), y:i * (ch + gy), row:i, w }; }); });
  Object.values(pos).forEach(o => { o.x += (maxW - o.w) / 2; });
  return { pos, W:maxW, H:lv.length * ch + (lv.length - 1) * gy, lv };
}
const linhas = (P, pos, cw, ch, gy) => P.filter(p => p.chefe && pos[p.chefe] && pos[p.key]).map(p => { const a = pos[p.chefe], b = pos[p.key]; const x1 = a.x + cw / 2, y1 = a.y + ch, x2 = b.x + cw / 2, y2 = b.y; const ym = y2 - gy / 2; return [[x1, y1], [x1, ym], [x2, ym], [x2, y2]]; });

/* ---------- tela ---------- */
const CSS = `.og-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px}.og-bar .sp{flex:1}
.og-nav{position:sticky;top:0;z-index:5;display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:var(--fundo,#f5f6f8);padding:6px 0 10px;margin-bottom:6px}
.og-nav a{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;border:1px solid #e0e4ea;background:#fff;color:#14213d;font-weight:700;font-size:13px;text-decoration:none;cursor:pointer}
.og-nav a i{width:9px;height:9px;border-radius:50%;background:var(--sc)}.og-nav a b{color:#8a94a8;font-weight:700}
.og-sec{margin:0 0 22px;scroll-margin-top:60px}.og-sh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px}
.og-sh .og-ic{width:36px;height:36px;border-radius:10px;background:var(--sc);display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.og-sh h2{margin:0;font-size:18px;color:#14213d}.og-qt{background:color-mix(in srgb,var(--sc) 14%,#fff);color:var(--sc);border-radius:99px;padding:3px 10px;font-size:12.5px;font-weight:800}
.og-sh .sp{flex:1}.og-div{display:flex;align-items:center;gap:12px;margin:30px 0 16px;color:#5d6a85;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.og-div:before,.og-div:after{content:"";flex:1;height:1px;background:#dfe3ea}
.og-wrap{background:var(--card,#fff);border:1px solid var(--line,#e4e7ec);border-top:4px solid var(--sc,#e4e7ec);border-radius:14px;padding:18px;overflow:auto;position:relative}
.og-area{position:relative;margin:0 auto}.og-svg{position:absolute;left:0;top:0;pointer-events:none}
.og-c{position:absolute;box-sizing:border-box;background:#fff;border:1px solid #e3e6ec;border-top:4px solid var(--c);border-radius:12px;padding:10px 8px 8px;text-align:center;cursor:pointer;box-shadow:0 2px 6px rgba(20,33,61,.06);transition:transform .12s}
.og-c:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(20,33,61,.12)}
.og-f{width:64px;height:64px;border-radius:50%;margin:0 auto 6px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:22px;border:3px solid #fff;box-shadow:0 0 0 2px var(--c)}
.og-f img{width:100%;height:100%;object-fit:cover;display:block}
.og-n{font-weight:800;font-size:12.5px;line-height:1.2;color:#14213d}.og-fu{font-size:11px;color:#5d6a85;margin-top:2px;line-height:1.2}.og-t{font-size:10.5px;color:#8a94a8;margin-top:3px}
.og-sel{display:inline-block;margin-top:4px;background:#f1e8f8;color:#5a2d82;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:800;letter-spacing:.03em}
.og-af{display:inline-block;margin-top:4px;background:#fff1d6;color:#7a5200;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:800}
.og-lg{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#5d6a85;margin:0 0 10px}.og-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.og-lv h3{margin:14px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--c)}.og-lv:first-child h3{margin-top:0}
.og-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.og-grid .og-c,.og-row .og-c{position:relative}
.og-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}.og-row .og-c{width:168px}
.og-tr{width:2px;height:18px;background:#c3cad6;margin:0 auto}
.og-gr{border:1px solid #e4e7ec;border-radius:12px;margin-top:10px;background:#fbfbfc}.og-gr>summary{list-style:none;display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;flex-wrap:wrap}.og-gr>summary::-webkit-details-marker{display:none}
.og-gr>summary .t{font-weight:800;color:#14213d}.og-gr>summary .q{color:var(--sc);font-weight:800;font-size:12.5px}.og-gr>summary .sp{flex:1}.og-gr>summary .ch{color:#8a94a8;font-size:12px;font-weight:700}
.og-gr>summary .ch b{display:inline-block;transition:transform .15s}.og-gr>summary .ch em{font-style:normal}.og-gr[open]>summary .ch b{transform:rotate(180deg)}.og-gr[open]>summary .ch em{display:none}.og-gr>.og-grid{padding:0 12px 12px}
.og-mini{display:flex}.og-mini span{width:26px;height:26px;border-radius:50%;border:2px solid #fff;margin-left:-7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800;overflow:hidden}.og-mini span:first-child{margin-left:0}.og-mini img{width:100%;height:100%;object-fit:cover}
.og-pend{border:1px dashed #d9b97a;background:#fffaf0;border-radius:12px;padding:14px 16px;font-size:13.5px;color:#5c3b00;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.og-ov{position:fixed;inset:0;background:rgba(10,20,40,.5);z-index:95;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 10px}
.og-m{background:#fff;border-radius:16px;width:min(620px,100%);box-shadow:0 20px 50px rgba(0,0,0,.3);max-height:calc(100vh - 48px);display:flex;flex-direction:column}
.og-mh{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid #e4e7ec}.og-mh h3{margin:0;flex:1;font-size:17px}.og-mb{padding:16px 18px;overflow:auto}.og-mf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 18px;border-top:1px solid #e4e7ec}
.og-tb{width:100%;border-collapse:collapse;font-size:13px}.og-tb th{text-align:left;font-size:11px;text-transform:uppercase;color:#667085;padding:6px;border-bottom:2px solid #e4e7ec}.og-tb td{padding:6px;border-top:1px solid #eef0f4}
.og-op{display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid #e4e7ec;border-radius:10px;margin-bottom:8px;cursor:pointer}.og-op:hover{background:#f7f8fa}
@media (max-width:760px){.og-nav{position:static}.og-sec{scroll-margin-top:76px}.og-wrap{padding:10px}.og-row .og-c{width:calc(50% - 7px)}.og-sh h2{font-size:16px}}`;
function estilo(){ if (!document.getElementById('og-css')) { const s = document.createElement('style'); s.id = 'og-css'; s.textContent = CSS; document.head.appendChild(s); } }
const svgIc = (d, t) => `<svg viewBox="0 0 24 24" width="${t || 20}" height="${t || 20}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const fotoHtml = (p, tam) => FOTOS[p.key] ? `<img src="${FOTOS[p.key]}" alt="">` : `<span style="font-size:${tam ? Math.round(tam / 2.9) : 22}px">${esc(iniciais(p.nome))}</span>`;
const cartao = (p, st) => { const c = NIV[p.nivel].c; return `<div class="og-c" data-k="${esc(p.key)}" style="--c:${c};${st || ''}"><div class="og-f" style="background:${corDe(p.key)}">${fotoHtml(p)}</div><div class="og-n">${esc(tc(p.nome))}</div><div class="og-fu">${esc(tc(p.funcao))}</div>${p.jovem ? `<div class="og-t">${esc(p.entidade)}</div><span class="og-sel">JOVEM APRENDIZ</span>` : `<div class="og-t">${esc(tempoCasa(p.adm))}${tempoCasa(p.adm) ? ' de casa' : ''}</div>${infoDe(p.key).horario ? `<div class="og-t" style="color:#5d6a85;font-weight:700">${esc(infoDe(p.key).horario)}</div>` : ''}`}${p.sit === 'Afastado' ? '<span class="og-af">Afastado</span>' : ''}</div>`; };

async function tela(){
  estilo(); const pode = ehRH();
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Organograma do RH</h1><div class="ini-data">Equipe de Gestão de Pessoas e setores ligados: quem é quem e o que cada um faz</div></div></section><div id="og-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  try { await Promise.all([lerCfg(), lerFotos()]); await montar(); } catch(e){ const c = $('#og-corpo'); if (c) c.innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; return; }
  desenhar();
  if (pode) { const g = G.find(x => !x.conf); if (g) conferir(g.s.id, true); }
}
const visiveis = () => G.filter(g => g.conf || ehRH());
function desenhar(){
  const c = $('#og-corpo'); if (!c) return; const pode = ehRH(); const mob = window.innerWidth < 760; if (!VIEW) VIEW = mob ? 'lv' : 'org';
  const V = visiveis(); const gp = V.filter(g => !g.s.ligado), lig = V.filter(g => g.s.ligado);
  c.innerHTML = `<div class="og-nav">${V.map(g => `<a data-ir="${g.s.id}" style="--sc:${g.s.cor}"><i></i>${esc(g.s.curto)} <b>${g.conf ? g.pess.length : '…'}</b></a>`).join('')}</div>
    <div class="og-bar"><button class="btn ${VIEW === 'org' ? 'prim' : 'borda'}" data-v="org">Organograma</button><button class="btn ${VIEW === 'lv' ? 'prim' : 'borda'}" data-v="lv">Por nível</button><span class="sp"></span>${pode ? '<button class="btn borda" id="og-add">+ Setor ligado ao RH</button>' : ''}<button class="btn prim" id="og-pdf">Imprimir / Gerar PDF</button></div>
    <div class="og-lg">${NIV.map((n, i) => V.some(g => g.pess.some(p => p.nivel === i)) ? `<span><i style="background:${n.c}"></i>${n.n}</span>` : '').join('')}<span style="margin-left:auto">Clique no cartão para ver o que cada um faz</span></div>
    ${gp.map(secHtml).join('')}${lig.length ? '<div class="og-div">Setores ligados à Gestão de Pessoas</div>' + lig.map(secHtml).join('') : ''}`;
  c.querySelectorAll('[data-ir]').forEach(a => a.onclick = () => { const el = document.getElementById('og-s-' + a.dataset.ir); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); });
  c.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { VIEW = b.dataset.v; desenhar(); });
  c.querySelectorAll('.og-c').forEach(b => b.onclick = () => ficha(b.dataset.k));
  c.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => conferir(b.dataset.eq, false));
  const ad = $('#og-add'); if (ad) ad.onclick = novoSetor;
  $('#og-pdf').onclick = escolherPDF;
}
function secHtml(g){ const s = g.s, P = g.pess, pode = ehRH();
  const cab = `<div class="og-sh"><span class="og-ic">${svgIc(s.ic)}</span><h2>${esc(s.nome)}</h2>${g.conf ? `<span class="og-qt">${pessoasTxt(P.length)}</span>` : ''}<span class="sp"></span>${pode ? `<button class="btn borda peq" data-eq="${s.id}">Equipe (incluir / retirar)</button>` : ''}</div>`;
  let corpo;
  if (!g.conf) corpo = `<div class="og-pend"><b>Lista encontrada aguardando sua confirmação:</b> ${pessoasTxt(g.ach.length)} no Quadro Geral.<span style="flex:1"></span><button class="btn prim peq" data-eq="${s.id}">Conferir e confirmar</button></div>`;
  else if (!P.length) corpo = `<div class="og-wrap" style="--sc:${s.cor}"><div class="vazio" style="text-align:center;color:#8a94a8;padding:10px">Ninguém nesta seção. Use "Equipe" para incluir pela matrícula.</div></div>`;
  else if (muitos(s, P.length)) { const { lid, B } = grupos(P);
    corpo = `<div class="og-wrap" style="--sc:${s.cor}">${lid.length ? `<div class="og-row">${lid.map(p => cartao(p)).join('')}</div><div class="og-tr"></div>` : ''}
      ${B.map(b => `<details class="og-gr"><summary><span class="t">${esc(b.f)}</span><span class="q">${pessoasTxt(b.L.length)}</span><span class="og-mini">${b.L.slice(0, 7).map(p => `<span style="background:${corDe(p.key)}">${FOTOS[p.key] ? `<img src="${FOTOS[p.key]}" alt="">` : esc(iniciais(p.nome))}</span>`).join('')}</span><span class="sp"></span><span class="ch"><b>▼</b> <em>ver</em></span></summary><div class="og-grid">${b.L.map(p => cartao(p)).join('')}</div></details>`).join('')}</div>`; }
  else if (VIEW === 'org') { const cw = 168, ch = 168, gx = 18, gy = 46, L = layout(P, cw, ch, gx, gy);
    corpo = `<div class="og-wrap" style="--sc:${s.cor}"><div class="og-area" style="width:${L.W}px;height:${L.H}px"><svg class="og-svg" width="${L.W}" height="${L.H}">${linhas(P, L.pos, cw, ch, gy).map(pts => `<polyline points="${pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="#c3cad6" stroke-width="2"/>`).join('')}</svg>
      ${P.map(p => cartao(p, `left:${L.pos[p.key].x}px;top:${L.pos[p.key].y}px;width:${cw}px;height:${ch}px`)).join('')}</div></div>`; }
  else corpo = `<div class="og-wrap" style="--sc:${s.cor}">${NIV.map((n, i) => { const Q = P.filter(p => p.nivel === i); return Q.length ? `<div class="og-lv" style="--c:${n.c}"><h3>${n.n} (${Q.length})</h3><div class="og-grid">${Q.map(p => cartao(p)).join('')}</div></div>` : ''; }).join('')}</div>`;
  return `<section class="og-sec" id="og-s-${s.id}" style="--sc:${s.cor}">${cab}${corpo}</section>`; }
function janela(tit, corpo, pe){ const w = document.createElement('div'); w.className = 'og-ov'; w.innerHTML = `<div class="og-m"><div class="og-mh"><h3>${tit}</h3><button class="btn borda peq" data-x>Fechar</button></div><div class="og-mb">${corpo}</div><div class="og-mf">${pe || ''}</div></div>`;
  document.body.appendChild(w); w.addEventListener('mousedown', e => { if (e.target === w) w.remove(); }); w.querySelectorAll('[data-x]').forEach(b => b.onclick = () => w.remove()); return w; }

/* ---------- conferir a equipe de uma seção (antes de montar e depois, para incluir/retirar) ---------- */
async function conferir(id, primeira){
  const g = G.find(x => x.s.id === id); if (!g) return; const s = g.s, c = cs(s);
  const F = FONTES || await fontes(); const todos = F.quadro.concat(F.jov); const porK = F.porK;
  const exc = new Set(c.exc || []), inc = new Set(c.inc || []);
  const ach = achadosDe(s, F);
  const lista = () => { const ks = new Set(ach.map(p => p.key).concat([...inc])); return [...ks].map(k => porK.get(k)).filter(Boolean).sort((a, b) => (a.jovem ? 1 : 0) - (b.jovem ? 1 : 0) || String(a.nome).localeCompare(String(b.nome), 'pt-BR')); };
  const sumidos = [...inc].filter(k => !porK.has(k));
  const grafias = [...new Set(ach.filter(p => !p.jovem).map(p => p.setor))].sort();
  const w = janela((primeira ? 'Conferir antes de montar · ' : 'Equipe · ') + esc(s.nome), '', `<span id="og-msg" style="flex:1;font-size:13px;color:#a3301c"></span>${s.extra && !primeira ? '<button class="btn borda" id="og-rm" style="color:#a3301c">Remover esta seção</button>' : ''}${primeira ? '<button class="btn borda" data-x>Depois</button>' : '<button class="btn borda" data-x>Cancelar</button>'}<button class="btn prim" id="og-ok">${primeira ? 'Confirmar e montar' : 'Salvar'}</button>`);
  const des = () => { const L = lista(), nJ = L.filter(p => p.jovem && !exc.has(p.key)).length, sel = L.filter(p => !exc.has(p.key));
    w.querySelector('.og-mb').innerHTML = `<p style="margin-top:0;font-size:13.5px">${s.jov ? 'Encontrados: colaboradores ativos do Quadro Geral com setor <b>Gestão de Pessoas</b> e jovens aprendizes ativos alocados no <b>RH</b> (painéis do João Bittar e da RENAPSI).' : `Encontrados: colaboradores <b>ativos</b> do Quadro Geral do departamento <b>${esc(s.nome)}</b> (afastados não entram).`} Desmarque quem não deve entrar.</p>
      ${!s.jov ? `<div style="font-size:12.5px;color:#5d6a85;margin:-4px 0 10px">Como o departamento aparece na base: ${grafias.length ? grafias.map(t => `<b>${esc(t)}</b>`).join(', ') : '<i>nenhum ativo encontrado</i>'}</div>` : ''}
      ${s.jov && nJ !== 4 ? `<div style="background:#fff1d6;border:1px solid #f0c98a;border-radius:10px;padding:8px 12px;font-size:13px;color:#5c3b00;margin-bottom:10px"><b>Atenção:</b> ${nJ} jovem(ns) aprendiz(es) no RH, e não 4. Confira nos painéis do Jovem Aprendiz o setor de alocação, ou inclua/retire pela matrícula.</div>` : ''}
      ${sumidos.length ? `<div style="background:#fdecea;border-radius:10px;padding:8px 12px;font-size:13px;color:#8f1d12;margin-bottom:10px">${sumidos.length} pessoa(s) incluída(s) antes não estão mais ativas (desligadas) e saíram do organograma.</div>` : ''}
      <div style="overflow:auto"><table class="og-tb"><thead><tr><th></th><th>Matrícula</th><th>Nome</th><th>Função</th>${s.jov ? '<th>Origem</th>' : ''}</tr></thead><tbody>${L.map(p => `<tr><td><input type="checkbox" data-ck="${esc(p.key)}" ${exc.has(p.key) ? '' : 'checked'}></td><td>${esc(p.mat)}</td><td><b>${esc(tc(p.nome))}</b>${inc.has(p.key) ? ' <span class="og-af" style="background:#e6f3ec;color:#1d4d33">incluído à mão</span>' : ''}${p.sit === 'Afastado' ? ' <span class="og-af">Afastado</span>' : ''}</td><td>${esc(tc(p.funcao))}${p.jovem ? ' · ' + esc(brD(p.ini)) + ' a ' + esc(brD(p.fim)) : ''}</td>${s.jov ? `<td>${esc(p.origem)}${p.setor ? '<div style="font-size:11.5px;color:#8a94a8">' + esc(tc(p.setor)) + '</div>' : ''}</td>` : ''}</tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="5" style="font-weight:700">Total: ${pessoasTxt(sel.length)}${s.jov ? ` (${sel.filter(p => !p.jovem).length} do Quadro e ${nJ} jovens aprendizes)` : ''}</td></tr></tfoot></table></div>
      <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><b style="font-size:13px">Incluir pela matrícula:</b><input id="og-im" inputmode="numeric" placeholder="Matrícula" style="width:120px;padding:7px 9px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"><button class="btn borda" id="og-ib">Procurar</button><span id="og-ir" style="font-size:13px"></span></div>`;
    w.querySelectorAll('[data-ck]').forEach(x => x.onchange = () => { x.checked ? exc.delete(x.dataset.ck) : exc.add(x.dataset.ck); des(); });
    const im = w.querySelector('#og-im'); im.onkeydown = e => { if (e.key === 'Enter') w.querySelector('#og-ib').click(); };
    w.querySelector('#og-ib').onclick = () => { const m = im.value.replace(/\D/g, ''); const r = w.querySelector('#og-ir'); if (!m) return;
      const H = todos.filter(p => String(p.mat) === m && (s.jov || !p.jovem)); if (!H.length) { r.innerHTML = '<span style="color:#a3301c">Matrícula não encontrada entre os ativos do Quadro' + (s.jov ? ' nem entre os jovens ativos' : '') + '.</span>'; return; }
      if (s.ligado && H.every(p => p.sit === 'Afastado')) { r.innerHTML = '<span style="color:#a3301c">' + esc(tc(H[0].nome)) + ' está afastado(a): afastados não entram nesta seção.</span>'; return; }
      r.innerHTML = H.filter(p => !s.ligado || p.sit !== 'Afastado').map(p => `<button class="btn borda peq" data-add="${esc(p.key)}">${esc(tc(p.nome))} · ${esc(tc(p.setor || p.origem))}</button>`).join(' ');
      r.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { inc.add(b.dataset.add); exc.delete(b.dataset.add); des(); }); };
  };
  des();
  const rm = w.querySelector('#og-rm'); if (rm) rm.onclick = async () => { if (!confirm('Remover a seção "' + s.nome + '" do organograma? As fotos e as fichas das pessoas continuam guardadas.')) return;
    try { CFG.extras = CFG.extras.filter(x => x.id !== s.id); delete CFG.sec[s.id]; await salvarCfg(); await montar(); w.remove(); desenhar(); toast('Seção removida.'); } catch(e){ toast(traduzErro(e), true); } };
  w.querySelector('#og-ok').onclick = async () => { const b = w.querySelector('#og-ok'); b.disabled = true;
    try { const base = new Set(ach.map(p => p.key)); c.inc = [...inc].filter(k => !base.has(k) && porK.has(k)); c.exc = [...exc]; c.conf = true; await salvarCfg(); await montar(); w.remove(); desenhar(); toast('Equipe de ' + s.curto + ' salva.');
      if (primeira) { const prox = G.find(x => !x.conf); if (prox) conferir(prox.s.id, true); } }
    catch(e){ b.disabled = false; w.querySelector('#og-msg').textContent = traduzErro(e); } };
}
/* ---------- acrescentar um setor ligado ao RH (sem mexer no código) ---------- */
async function novoSetor(){
  const F = FONTES || await fontes(); const usados = new Set(); F.quadro.forEach(p => { const n = nrm(p.setor); if (SECS().some(s => s.ok(n))) usados.add(n); });
  const C = new Map(); F.quadro.filter(p => p.sit !== 'Afastado' && p.setor).forEach(p => { const n = nrm(p.setor); if (!C.has(n)) C.set(n, { n, t:p.setor, q:0 }); C.get(n).q++; });
  const L = [...C.values()].filter(x => !usados.has(x.n)).sort((a, b) => a.t.localeCompare(b.t, 'pt-BR'));
  const w = janela('Adicionar setor ligado à Gestão de Pessoas', `<label style="display:block;font-size:12px;font-weight:700;color:#667085">NOME DA SEÇÃO<input id="og-nn" placeholder="Ex.: Administração de Pessoas" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label>
    <div style="font-size:12px;font-weight:700;color:#667085;margin:12px 0 6px">DEPARTAMENTO(S) DO QUADRO GERAL (marque todas as grafias do mesmo setor)</div><input id="og-fb" placeholder="Filtrar…" style="width:100%;padding:7px 9px;border:1px solid #d5dbe6;border-radius:8px;font:inherit;margin-bottom:6px">
    <div id="og-dl" style="max-height:300px;overflow:auto;border:1px solid #eef0f4;border-radius:10px;padding:4px 8px">${L.map(x => `<label style="display:flex;gap:8px;align-items:center;padding:5px 0;font-size:13px" data-t="${esc(x.n)}"><input type="checkbox" value="${esc(x.t)}"> ${esc(tc(x.t))} <span style="color:#8a94a8;margin-left:auto">${x.q}</span></label>`).join('')}</div>`,
    '<span id="og-msg" style="flex:1;font-size:13px;color:#a3301c"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="og-nok">Criar seção</button>');
  w.querySelector('#og-fb').oninput = e => { const q = nrm(e.target.value); w.querySelectorAll('#og-dl label').forEach(l => l.style.display = !q || l.dataset.t.includes(q) ? '' : 'none'); };
  w.querySelectorAll('#og-dl input').forEach(i => i.onchange = () => { const n = w.querySelector('#og-nn'); if (!n.value.trim() && i.checked) n.value = tc(i.value); });
  w.querySelector('#og-nok').onclick = async () => { const nome = w.querySelector('#og-nn').value.trim(), set = [...w.querySelectorAll('#og-dl input:checked')].map(i => i.value);
    if (!nome || !set.length) { w.querySelector('#og-msg').textContent = 'Informe o nome e marque pelo menos um departamento.'; return; }
    const id = 'x' + Date.now().toString(36); CFG.extras.push({ id, nome, setores:set, cor:COR_EXTRA[CFG.extras.length % COR_EXTRA.length] });
    try { await salvarCfg(); await montar(); w.remove(); desenhar(); conferir(id, true); } catch(e){ CFG.extras.pop(); w.querySelector('#og-msg').textContent = traduzErro(e); } };
}

/* ---------- ficha da pessoa ---------- */
function ficha(k){
  const [p, g] = acharP(k); if (!p) return; const P = g.pess, pode = ehRH(); const info = infoDe(k);
  const faz = String(info.faz || '').split(/\n/).map(t => t.replace(/^[-•·\s]+/, '').trim()).filter(Boolean), proc = String(info.procure || '').split(/[,;\n]/).map(t => t.trim()).filter(Boolean);
  const chefe = P.find(x => x.key === p.chefe);
  const w = janela(esc(tc(p.nome)), `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><div class="og-f" style="width:120px;height:120px;margin:0;background:${corDe(p.key)};--c:${NIV[p.nivel].c}">${fotoHtml(p, 120)}</div>
      <div style="flex:1;min-width:200px"><div style="font-size:19px;font-weight:800;color:#14213d">${esc(tc(p.nome))}</div><div style="color:#5d6a85;margin-top:2px">${esc(tc(p.funcao))}${p.jovem ? ' · ' + esc(p.entidade) : ''}</div>
      <div style="font-size:12.5px;color:${g.s.cor};font-weight:700;margin-top:3px">${esc(g.s.nome)}</div>
      <div style="font-size:13px;color:#5d6a85;margin-top:6px">${p.jovem ? 'Contrato de ' + esc(brD(p.ini)) + ' a ' + esc(brD(p.fim)) : (tempoCasa(p.adm) ? esc(tempoCasa(p.adm)) + ' de casa (desde ' + esc(brD(p.adm)) + ')' : '')}${chefe ? '<br>Responde a: <b>' + esc(tc(chefe.nome)) + '</b>' : ''}</div>
      ${p.jovem ? '<span class="og-sel">JOVEM APRENDIZ</span>' : ''}</div></div>
    ${info.local || info.horario ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:0 0 12px">${info.local ? `<div style="background:#f6f7f9;border-radius:10px;padding:8px 12px"><small style="display:block;font-size:11px;font-weight:800;color:#667085;text-transform:uppercase">Local de trabalho</small><b>${esc(info.local)}</b></div>` : ''}${info.horario ? `<div style="background:#f6f7f9;border-radius:10px;padding:8px 12px"><small style="display:block;font-size:11px;font-weight:800;color:#667085;text-transform:uppercase">Horário de serviço</small><b>${esc(info.horario)}</b></div>` : ''}</div>` : ''}
    <h4 style="margin:6px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:${g.s.cor}">O que faz no departamento</h4>
    ${faz.length ? '<ul style="margin:0 0 10px;padding-left:18px;line-height:1.6;' + (faz.length > 7 ? 'columns:2 220px;column-gap:24px' : '') + '">' + faz.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '<p style="color:#8a94a8;margin:0 0 10px">Ainda não preenchido.</p>'}
    ${info.obs ? `<p style="margin:0 0 10px;font-size:13px;color:#5d6a85"><b>Observação:</b> ${esc(info.obs)}</p>` : ''}
    ${proc.length ? `<h4 style="margin:6px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:${g.s.cor}">Procure para</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${proc.map(t => `<span style="background:#eef1f5;border-radius:99px;padding:3px 10px;font-size:12.5px">${esc(t)}</span>`).join('')}</div>` : ''}
    ${pode ? `<details style="margin-top:14px;border-top:1px solid #e4e7ec;padding-top:10px"><summary style="cursor:pointer;font-weight:700">Editar (RH)</summary>
      <label style="display:block;font-size:12px;font-weight:700;color:#667085;margin-top:10px">O QUE FAZ NO DEPARTAMENTO (um tópico por linha)<textarea id="og-faz" rows="6" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit">${esc(faz.join('\n'))}</textarea></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><label style="flex:2;min-width:200px;font-size:12px;font-weight:700;color:#667085">LOCAL DE TRABALHO<input id="og-loc" value="${esc(info.local || '')}" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label><label style="flex:1;min-width:180px;font-size:12px;font-weight:700;color:#667085">HORÁRIO DE SERVIÇO<input id="og-hor" value="${esc(info.horario || '')}" placeholder="Ex.: Turno A · 07:00 às 15:20" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label></div>
      <label style="display:block;font-size:12px;font-weight:700;color:#667085;margin-top:8px">OBSERVAÇÃO<input id="og-obs" value="${esc(info.obs || '')}" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label>
      <label style="display:block;font-size:12px;font-weight:700;color:#667085;margin-top:8px">PROCURE PARA (separe por vírgula)<input id="og-pro" value="${esc(proc.join(', '))}" placeholder="Ex.: atestados, benefícios, admissão" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><label style="flex:1;min-width:180px;font-size:12px;font-weight:700;color:#667085">NÍVEL<select id="og-niv" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit">${NIV.map((n, i) => `<option value="${i}" ${p.nivel === i ? 'selected' : ''}>${n.n}${CFG.nivel[k] == null && nivelAuto(p) === i ? ' (pela função)' : ''}</option>`).join('')}</select></label>
      <label style="flex:1;min-width:180px;font-size:12px;font-weight:700;color:#667085">RESPONDE A<select id="og-che" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"><option value="">(automático)</option><option value="-" ${CFG.chefe[k] === '-' ? 'selected' : ''}>Ninguém (topo da seção)</option>${P.filter(x => x.key !== k).map(x => `<option value="${esc(x.key)}" ${CFG.chefe[k] === x.key ? 'selected' : ''}>${esc(tc(x.nome))} · ${esc(tc(x.funcao))}</option>`).join('')}</select></label></div></details>` : ''}`,
    pode ? `<button class="btn borda" id="og-foto">${FOTOS[k] ? 'Trocar foto' : 'Adicionar foto'}</button>${FOTOS[k] ? '<button class="btn borda" id="og-fx" style="color:#a3301c">Tirar foto</button>' : ''}<span style="flex:1"></span><button class="btn borda" data-x>Fechar</button><button class="btn prim" id="og-sv">Salvar</button>` : '<span style="flex:1"></span><button class="btn prim" data-x>Fechar</button>');
  if (!pode) return;
  w.querySelector('#og-foto').onclick = () => recortar(k, () => { w.remove(); desenhar(); ficha(k); });
  const fx = w.querySelector('#og-fx'); if (fx) fx.onclick = async () => { if (!confirm('Tirar a foto de ' + tc(p.nome) + '?')) return; try { await salvarFoto(k, ''); w.remove(); desenhar(); toast('Foto retirada.'); } catch(e){ toast(traduzErro(e), true); } };
  w.querySelector('#og-sv').onclick = async () => { const b = w.querySelector('#og-sv'); b.disabled = true;
    CFG.info[k] = { faz:w.querySelector('#og-faz').value.trim(), procure:w.querySelector('#og-pro').value.trim(), local:w.querySelector('#og-loc').value.trim(), horario:w.querySelector('#og-hor').value.trim(), obs:w.querySelector('#og-obs').value.trim() };
    const nv = +w.querySelector('#og-niv').value; if (nv === nivelAuto(p)) delete CFG.nivel[k]; else CFG.nivel[k] = nv;
    const ch = w.querySelector('#og-che').value; if (ch === '-') CFG.chefe[k] = '-'; else if (ch) CFG.chefe[k] = ch; else delete CFG.chefe[k];
    try { await salvarCfg(); await montar(); w.remove(); desenhar(); toast('Salvo.'); } catch(e){ b.disabled = false; toast(traduzErro(e), true); } };
}
/* ---------- foto: só recortar/enquadrar no círculo (arrastar e aproximar); nada é alterado na imagem ---------- */
function recortar(k, depois){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const url = URL.createObjectURL(f); const img = new Image();
    img.onload = () => { const S = 300; let z = 1, ox = 0, oy = 0; const base = Math.max(S / img.width, S / img.height);
      const w = janela('Enquadrar a foto', `<p style="margin-top:0;font-size:13px;color:#5d6a85">Arraste a foto e use o controle para aproximar até o rosto ficar no círculo. A foto é só recortada: nada nela é alterado.</p>
        <div style="display:flex;justify-content:center"><canvas id="og-cv" width="${S}" height="${S}" style="border-radius:12px;touch-action:none;cursor:grab;background:#eef1f5;max-width:100%"></canvas></div>
        <label style="display:block;margin-top:10px;font-size:13px">Aproximar <input id="og-z" type="range" min="1" max="4" step="0.01" value="1" style="width:100%"></label>`,
        '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="og-fok">Salvar foto</button>');
      const cv = w.querySelector('#og-cv'), cx = cv.getContext('2d');
      const lim = () => { const s = base * z, iw = img.width * s, ih = img.height * s; ox = Math.min(0, Math.max(S - iw, ox)); oy = Math.min(0, Math.max(S - ih, oy)); };
      const centro = () => { const s = base * z; ox = (S - img.width * s) / 2; oy = (S - img.height * s) / 2; };
      const des = () => { const s = base * z; cx.clearRect(0, 0, S, S); cx.drawImage(img, ox, oy, img.width * s, img.height * s); cx.save(); cx.fillStyle = 'rgba(255,255,255,.65)'; cx.beginPath(); cx.rect(0, 0, S, S); cx.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2, true); cx.fill('evenodd'); cx.restore(); cx.strokeStyle = '#2e7d4f'; cx.lineWidth = 2; cx.beginPath(); cx.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2); cx.stroke(); };
      centro(); des();
      let arr = null; const pt = e => { const r = cv.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return [(t.clientX - r.left) * S / r.width, (t.clientY - r.top) * S / r.height]; };
      const ini = e => { arr = pt(e); e.preventDefault(); }, mov = e => { if (!arr) return; const q = pt(e); ox += q[0] - arr[0]; oy += q[1] - arr[1]; arr = q; lim(); des(); e.preventDefault(); }, fim = () => { arr = null; };
      cv.addEventListener('mousedown', ini); cv.addEventListener('touchstart', ini, { passive:false }); window.addEventListener('mousemove', mov); cv.addEventListener('touchmove', mov, { passive:false }); window.addEventListener('mouseup', fim); cv.addEventListener('touchend', fim);
      w.querySelector('#og-z').oninput = e => { const s0 = base * z, cxm = (S / 2 - ox) / s0, cym = (S / 2 - oy) / s0; z = +e.target.value; const s = base * z; ox = S / 2 - cxm * s; oy = S / 2 - cym * s; lim(); des(); };
      w.querySelector('#og-fok').onclick = async () => { const O = 360, oc = document.createElement('canvas'); oc.width = O; oc.height = O; const s = base * z * O / S; oc.getContext('2d').drawImage(img, ox * O / S, oy * O / S, img.width * s, img.height * s);
        const dataUrl = oc.toDataURL('image/jpeg', .86); const b = w.querySelector('#og-fok'); b.disabled = true;
        try { await salvarFoto(k, dataUrl); window.removeEventListener('mousemove', mov); window.removeEventListener('mouseup', fim); w.remove(); URL.revokeObjectURL(url); toast('Foto salva.'); depois && depois(); } catch(e){ b.disabled = false; toast(traduzErro(e), true); } };
    };
    img.onerror = () => toast('Não consegui abrir a imagem.', true); img.src = url; };
  inp.click();
}

/* ---------- PDF: escolher o que imprimir; cada seção na sua página, no padrão dos documentos do RH ---------- */
function escolherPDF(){
  const V = visiveis().filter(g => g.conf && g.pess.length); if (!V.length) { toast('Não há seção montada para imprimir.', true); return; }
  const w = janela('Imprimir / Gerar PDF', `<label class="og-op"><input type="radio" name="og-pq" value="*" checked><div><b>Organograma completo</b><div style="font-size:12.5px;color:#5d6a85">${V.length} seções, cada uma na sua página</div></div></label>
    ${V.map(g => `<label class="og-op"><input type="radio" name="og-pq" value="${g.s.id}"><span style="width:10px;height:10px;border-radius:50%;background:${g.s.cor}"></span><div><b>Só ${esc(g.s.nome)}</b><div style="font-size:12.5px;color:#5d6a85">${pessoasTxt(g.pess.length)}</div></div></label>`).join('')}`,
    '<span style="flex:1"></span><button class="btn borda" data-x>Cancelar</button><button class="btn prim" id="og-gp">Gerar PDF</button>');
  w.querySelector('#og-gp').onclick = async () => { const v = w.querySelector('[name=og-pq]:checked').value; const b = w.querySelector('#og-gp'); b.disabled = true;
    try { await pdf(v === '*' ? V : V.filter(g => g.s.id === v)); w.remove(); } catch(e){ b.disabled = false; toast('Não consegui gerar o PDF: ' + (e.message || e), true); } };
}
const circulo = src => new Promise(ok => { const im = new Image(); im.onload = () => { const S = 240, c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d'); x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); x.clip(); x.drawImage(im, 0, 0, S, S); ok(c.toDataURL('image/png')); }; im.onerror = () => ok(null); im.src = src; });
const hex = h => { h = String(h).replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
async function pdf(LG){
  const { jsPDF } = window.jspdf; const D = window.CRV_DOC; const FC = {};
  for (const g of LG) for (const p of g.pess) if (FOTOS[p.key] && !FC[p.key]) FC[p.key] = await circulo(FOTOS[p.key]);
  const ori = g => muitos(g.s, g.pess.length) ? 'portrait' : 'landscape';
  const doc = new jsPDF({ unit:'mm', format:'a4', orientation:ori(LG[0]) });
  /* foto (ou iniciais) em círculo com aro da cor do nível */
  const foto = (p, fx, fy, r, k) => { if (FC[p.key]) doc.addImage(FC[p.key], 'PNG', fx - r, fy - r, 2 * r, 2 * r); else { doc.setFillColor(...hex(corDe(p.key))); doc.circle(fx, fy, r, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(r * 1.3); doc.text(iniciais(p.nome), fx, fy + r * .16, { align:'center' }); }
    doc.setDrawColor(...hex(NIV[p.nivel].c)); doc.setLineWidth(.35 * k); doc.circle(fx, fy, r + .5 * k, 'S'); };
  /* cartão em pé (organograma por níveis) */
  const cartaoV = (p, x, y, cw, ch, k) => { const c = hex(NIV[p.nivel].c);
    doc.setFillColor(255, 255, 255); doc.setDrawColor(227, 230, 236); doc.setLineWidth(.25); doc.roundedRect(x, y, cw, ch, 2 * k, 2 * k, 'FD'); doc.setFillColor(...c); doc.rect(x, y, cw, 1.1 * k, 'F');
    const r = 7 * k, fx = x + cw / 2, fy = y + 3 * k + r; foto(p, fx, fy, r, k);
    let ty = fy + r + 4.2 * k; doc.setTextColor(20, 33, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6 * k); doc.splitTextToSize(tc(p.nome), cw - 3 * k).slice(0, 2).forEach(t => { doc.text(t, fx, ty, { align:'center' }); ty += 2.7 * k; });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.6 * k); doc.setTextColor(93, 106, 133); doc.splitTextToSize(tc(p.funcao), cw - 3 * k).slice(0, 2).forEach(t => { doc.text(t, fx, ty + .4 * k, { align:'center' }); ty += 2.4 * k; });
    doc.setFontSize(5.2 * k); doc.setTextColor(138, 148, 168);
    if (p.jovem) { doc.text(p.entidade, fx, ty + .9 * k, { align:'center' }); const t = 'JOVEM APRENDIZ', tw = doc.getTextWidth(t) + 3 * k; doc.setFillColor(241, 232, 248); doc.roundedRect(fx - tw / 2, y + ch - 4.6 * k, tw, 3.3 * k, 1.5 * k, 1.5 * k, 'F'); doc.setTextColor(90, 45, 130); doc.setFont('helvetica', 'bold'); doc.setFontSize(4.8 * k); doc.text(t, fx, y + ch - 2.2 * k, { align:'center' }); }
    else if (tempoCasa(p.adm)) doc.text(tempoCasa(p.adm) + ' de casa', fx, ty + .9 * k, { align:'center' }); };
  /* cartão deitado (seções grandes, agrupadas por função) */
  const cartaoH = (p, x, y, cw, ch, k) => { doc.setFillColor(255, 255, 255); doc.setDrawColor(227, 230, 236); doc.setLineWidth(.25); doc.roundedRect(x, y, cw, ch, 1.6 * k, 1.6 * k, 'FD'); doc.setFillColor(...hex(NIV[p.nivel].c)); doc.rect(x, y + .6 * k, 1 * k, ch - 1.2 * k, 'F');
    const r = 5 * k; foto(p, x + 3 * k + r, y + ch / 2, r, k); const tx = x + 6 * k + 2 * r, tw = cw - (tx - x) - 2 * k;
    doc.setTextColor(20, 33, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8 * k); const nm = doc.splitTextToSize(tc(p.nome), tw).slice(0, 2); let ty = y + ch / 2 - (nm.length - 1) * 1.4 * k - 2.2 * k; nm.forEach(t => { doc.text(t, tx, ty); ty += 2.8 * k; });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.6 * k); doc.setTextColor(93, 106, 133); doc.text(doc.splitTextToSize(tc(p.funcao), tw)[0] || '', tx, ty + .2 * k);
    if (tempoCasa(p.adm)) { doc.setFontSize(5.2 * k); doc.setTextColor(138, 148, 168); doc.text(tempoCasa(p.adm) + ' de casa', tx, ty + 2.6 * k); }
    const hi = infoDe(p.key); if (hi.horario || hi.local) { doc.setFontSize(5 * k); doc.setTextColor(93, 106, 133); doc.setFont('helvetica', 'bold'); doc.text(doc.splitTextToSize([hi.horario, hi.local].filter(Boolean).join(' · '), tw)[0], tx, ty + 5 * k); } };
  LG.forEach((g, gi) => { if (gi) doc.addPage('a4', ori(g)); const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(); const s = g.s, P = g.pess;
    let y0 = D ? D.titulo(doc, s.id === 'gp' ? 'Organograma do RH' : 'Organograma · ' + s.nome, (s.ligado ? 'Setor ligado à Gestão de Pessoas' : 'Gestão de Pessoas') + ' · CRV Industrial · Unidade Capinópolis') : 30;
    const lg = NIV.filter((n, i) => P.some(p => p.nivel === i)); let lx = 12; doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    lg.forEach(n => { doc.setFillColor(...hex(n.c)); doc.roundedRect(lx, y0 - 2.6, 3, 3, .6, .6, 'F'); doc.setTextColor(93, 106, 133); doc.text(n.n, lx + 4.2, y0); lx += doc.getTextWidth(n.n) + 10; }); y0 += 5;
    const areaW = W - 24, areaH = H - 30 - y0;
    if (!muitos(s, P.length)) { const base = layout(P, 34, 40, 5, 12); const k = Math.min(1.6, areaW / base.W, areaH / base.H);
      const cw = 34 * k, ch = 40 * k, gy = 12 * k; const L = layout(P, cw, ch, 5 * k, gy); const ox = 12 + (areaW - L.W) / 2, oy = y0;
      doc.setDrawColor(195, 202, 214); doc.setLineWidth(.4); linhas(P, L.pos, cw, ch, gy).forEach(pts => { for (let i = 1; i < pts.length; i++) doc.line(ox + pts[i - 1][0], oy + pts[i - 1][1], ox + pts[i][0], oy + pts[i][1]); });
      P.forEach(p => { const o = L.pos[p.key]; cartaoV(p, ox + o.x, oy + o.y, cw, ch, k); }); }
    else { const { lid, B } = grupos(P); const COL = 3, CW = 58, CH = 19, GX = 4, GY = 3, HD = 7; const gw = COL * CW + (COL - 1) * GX;
      const LL = lid.length ? layout(lid, 34, 40, 5, 12) : { W:0, H:0, pos:{} };
      const hU = (lid.length ? LL.H + 10 : 0) + B.reduce((t, b) => t + HD + Math.ceil(b.L.length / COL) * (CH + GY) + 3, 0);
      const k = Math.min(1.25, areaW / Math.max(gw, LL.W), areaH / hU); let y = y0; const ox = 12 + (areaW - gw * k) / 2;
      if (lid.length) { const lx0 = 12 + (areaW - LL.W * k) / 2; lid.forEach(p => { const o = LL.pos[p.key]; cartaoV(p, lx0 + o.x * k, y + o.y * k, 34 * k, 40 * k, k); }); y += LL.H * k; doc.setDrawColor(195, 202, 214); doc.setLineWidth(.4); doc.line(W / 2, y, W / 2, y + 7 * k); y += 10 * k; }
      B.forEach(b => { doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5 * Math.min(1, k + .1)); doc.setTextColor(...hex(s.cor)); doc.text(b.f.toUpperCase() + '  (' + pessoasTxt(b.L.length) + ')', ox, y + 4 * k); doc.setDrawColor(...hex(s.cor)); doc.setLineWidth(.3); doc.line(ox, y + 5.3 * k, ox + gw * k, y + 5.3 * k); y += HD * k;
        b.L.forEach((p, i) => { const c = i % COL, r = Math.floor(i / COL); cartaoH(p, ox + c * (CW + GX) * k, y + r * (CH + GY) * k, CW * k, CH * k, k); }); y += (Math.ceil(b.L.length / COL) * (CH + GY) + 3) * k; }); }
    /* total da seção, no fim da folha */
    doc.setDrawColor(...hex(s.cor)); doc.setLineWidth(.4); doc.line(12, H - 26.5, W - 12, H - 26.5); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 33, 61);
    const nJ = P.filter(p => p.jovem).length; doc.text('Total: ' + pessoasTxt(P.length) + (nJ ? ' (' + (P.length - nJ) + ' do Quadro e ' + nJ + ' jovens aprendizes)' : ''), 12, H - 22.3); });
  if (LG.length > 1) { doc.setPage(doc.getNumberOfPages()); const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(); const t = LG.reduce((a, g) => a + g.pess.length, 0); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 33, 61); doc.text('Total do organograma: ' + pessoasTxt(t) + ' em ' + LG.length + ' seções', W - 12, H - 22.3, { align:'right' }); }
  if (D) D.moldura(doc);
  const logo = window.CRV_LOGO ? await window.CRV_LOGO('logo-crv') : null;
  if (logo && logo.src) for (let i = 1; i <= doc.getNumberOfPages(); i++) { doc.setPage(i); const W = doc.internal.pageSize.getWidth(); try { const h = 11, w = h * logo.w / logo.h; doc.addImage(logo.src, 'PNG', W - 12 - w, 7, w, h); } catch(_){} }
  const nome = LG.length === 1 && LG[0].s.id !== 'gp' ? 'Organograma - ' + LG[0].s.curto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'e').replace(/[\\/:*?"<>|]/g, '-') : 'Organograma do RH';
  const blob = doc.output('blob'); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nome + ' - ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.pdf'; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 3000);
}
window.addEventListener('resize', () => { if (location.hash === '#/organograma' && G.length && window.innerWidth < 760 && VIEW === 'org') { VIEW = 'lv'; desenhar(); } });
return { tela };
};
