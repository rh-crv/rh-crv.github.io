/* =====================================================================
   GESTOR DE ÁREA
   O gestor vê só a equipe da(s) área(s) dele: experiência, férias, frequência, novos colaboradores e crachás.
   Segurança no banco: o administrador gera um recorte por área (tabela area_dados) e a RLS deixa o
   gestor ler só as chaves que estão em perfis.areas. O gestor não tem acesso a nenhum pacote nem painel.
   Chave: 'a:<área do Quadro>' ou 'g:<gerência do Quadro>'.
   Inclui sanções disciplinares e RD (pedido do RH, para o gestor avaliar a equipe). Nada de CPF, salário, saúde
   (só a contagem de dias de atestado), processos, ouvidorias ou risco de saída.
   ===================================================================== */
window.CRV_GESTOR_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, brD, fMat, fDias, moldura, abrirModal, fecharModal, toast, traduzErro, baixar, cabecalhoPDF, rodapePDF } = X;
const hoje = () => new Date().toISOString().slice(0, 10);
const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
// chaves: 'a:<setor>' = setor inteiro; 'd:<setor>|<departamento>' = só um departamento do setor
const nomeChave = k => k[0] === 'd' ? k.slice(2).split('|')[1] + ' (' + k.slice(2).split('|')[0] + ')' : k.slice(2);
const chaveOk = k => /^[ad]:/.test(k || '');
const daChave = (k, p) => k[0] === 'a' ? p.area === k.slice(2) : k[0] === 'd' ? (p.area + '|' + p.setor) === k.slice(2) : false;
const tipoChave = k => k[0] === 'd' ? 'Departamento' : 'Setor';
const DEC = { efetivar:'Efetivar', encerrar:'Encerrar contrato', prorrogar:'Prorrogar' };
const OCN = { f:'Falta', j:'Falta justificada', s:'Suspensão', a:'Atestado' };
const DECG = [['efetivar', 'Efetivar', 'Fica no quadro como efetivo'], ['prorrogar', 'Prorrogar', 'Avaliar mais um pouco, até o fim do contrato'], ['encerrar', 'Encerrar o contrato', 'Não continua após o vencimento']];
// formulário oficial RE.0150.07 (SGI, versão 05): nota de 0 a 5 por fator; pontos = nota × 2; total = média dos pontos; meta 70%
const FORM_COD = 'RE.0150.07 · Versão 05';
const FAT = [["Pontualidade/ Assiduidade", "Chega e sai nos horários estabelecidos. Avisa com antecedência possíveis atrasos ou saídas antecipadas. É pontual em reuniões."], ["Iniciativa/Pró-atividade", "Capacidade de antecipar-se, não espera determinações. Apresenta sugestões pertinentes com frequência. Tem iniciativa para conhecer atividades diversas das que executa."], ["Relacionamento", "Se relaciona bem com colegas de trabalho e suas lideranças."], ["Organização", "Elabora cronograma de atividades, definindo prazos e prioridades. Executa suas atividades de maneira lógica e objetiva, de forma a serem facilmente compreendidas e continuadas por terceiros em caso de necessidade."], ["Metas", "Cumpre todas as metas estabelecidas. Contribui decisivamente e com contínuo esforço para o alcance ou a superação de suas metas e as da empresa."], ["Qualidade do serviço /Atenção", "Desenvolve seu trabalho de acordo com os requisitos. Entrega trabalhos completos, revisados e corretos. Presta atenção no que faz e toma providências para não haver erros, quando esses ocorrem, atua de modo a evitar sua reincidência."], ["Postura Profissional", "Apresenta um bom marketing pessoal, honestidade, discrição, aparência adequada. Uniforme adequado, asseio."], ["Conhecimento / Desenvolvimento profissional", "Conhece profundamente as atividades inerentes à sua função. Interessa-se em manter-se atualizado sobre os assuntos do seu setor. Participa de cursos, treinamentos e outros eventos de capacitação e atualização necessários à função que exerce."], ["Liderança", "Capacidade de engajar equipe. Consegue persuadir e influenciar equipe na conquista dos objetivos."]];
const META = .7;
const calcNotas = n => { const v = n.filter(x => x !== null && x !== undefined).map(x => x * 2); if (!v.length) return { tot:null, pct:null }; const tot = v.reduce((a, b) => a + b, 0) / v.length; return { tot, pct:tot / 10 }; };
const faixa = pct => pct == null ? ['', ''] : pct >= META ? ['ok', 'Desempenho acima do esperado'] : pct >= META - .105 ? ['aten', 'Atenção para o desempenho mostrado'] : ['baixo', 'Desempenho abaixo do esperado'];
const pctTxt = pct => pct == null ? '—' : (pct * 100).toFixed(1).replace('.', ',') + '%';
const STE = { enviado:['Aguardando o RH', 'pend'], aceito:['Aceito pelo RH', 'ok'], devolvido:['Devolvido pelo RH', 'dev'], cancelado:['Cancelado', 'can'] };
const SANC = { ori:['Orientação disciplinar', 'Conversa formal registrada, sem penalidade'], adv:['Advertência escrita', 'Registro formal da falta'], sus:['Suspensão disciplinar', 'Afastamento sem salário, de 1 a 30 dias'] };
const TIPO_ENV = { ferias:'Programação de férias', experiencia:'Avaliação de experiência', sancao:'Pedido de sanção disciplinar', perfil:'Parecer do perfil profissional' };
const ACOES_PF = ['Manter e acompanhar', 'Feedback formal', 'Plano de desenvolvimento (PDI)', 'Treinamento / capacitação', 'Medida disciplinar', 'Encaminhar ao SESMT / saúde', 'Reavaliar função', 'Desligamento'];
const TIPO_CURTO = { ferias:'Férias', experiencia:'Experiência', sancao:'Sanção', perfil:'Perfil profissional' };
const MESN = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const dataHora = iso => iso ? new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
// férias: para começar no mês M, o gestor envia até o dia 15 do mês anterior
const minInicioFerias = (h) => { const [a, m, d] = h.split('-').map(Number); const add = d <= 15 ? 1 : 2; const dt = new Date(Date.UTC(a, m - 1 + add, 1)); return dt.toISOString().slice(0, 10); };
const prazoFerias = ini => { const [a, m] = ini.split('-').map(Number); return new Date(Date.UTC(a, m - 2, 15)).toISOString().slice(0, 10); };
// experiência: o encerramento vai ao RH no máximo 5 dias antes do vencimento
const prazoEnc = venc => venc ? addD(venc, -5) : '';
const etapaExp = (e, h) => e && e.v1 && !e.dec1 && e.v1 >= addD(h, -10) ? { k:'pr', t:'1º período', venc:e.v1 } : e ? { k:'ef', t:'Fim do contrato', venc:e.v2 } : null;
const assinaturaOk = (dig, nome) => { const a = normal(dig).replace(/\s+/g, ' ').trim(), b = normal(nome).replace(/\s+/g, ' ').trim(); return a.length >= 5 && a.split(' ').length >= 2 && (a === b || b.startsWith(a) || a.startsWith(b)); };
/* assistente (secretária) do gestor: assina com o próprio nome e o envio sai também com o gestor responsável, que autorizou */
const ASSIST = () => (window.CRV_ASSIST && window.CRV_ASSIST()) || null;
const tcN = n => String(n || '').toLowerCase().replace(/(^|\s)(\S)/g, (m, e, l) => e + l.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, x => x.toLowerCase());
const quemG = (a, e) => a && a.gestorResp ? a.gestorResp + ' (preenchido por ' + (a.nome || e.autor_nome || '') + ', assistente)' : (a && a.nome) || e.autor_nome || '';
const linhaResp = a => a && a.gestorResp ? 'Gestor responsável que autorizou o preenchimento: ' + a.gestorResp : '';
const blocoAssinatura = (pref, nome) => `<div class="gs-ass">${ASSIST() ? `<p style="margin:0 0 6px;font-size:13px">Você assina como <b>assistente</b>. O envio sai também com o nome do gestor responsável que autorizou o preenchimento: <b>${esc(tcN(ASSIST().nome))}</b>.</p>` : ''}<label><input type="checkbox" id="${pref}-dec"> ${ASSIST() ? 'Declaro que preenchi com autorização do gestor responsável, que as informações estão corretas e autorizo a Gestão de Pessoas a dar continuidade.' : 'Declaro que as informações estão corretas e autorizo a Gestão de Pessoas a dar continuidade.'}</label>
  <label class="gs-assn">Assinatura: digite seu nome completo<input id="${pref}-nm" autocomplete="off" placeholder="${esc(nome)}"></label><small>A assinatura fica registrada com data e hora e o seu usuário do app.</small></div>`;

/* opções de área/gerência para o cadastro do gestor */
async function opcoes(){
  const Q = await window.CRV_QUADRO(); if (!Q) return [];
  // só o Setor da planilha (área do Quadro); gerência não é usada porque o cadastro dela não é confiável
  const S = {}; Object.values(Q.mapa).forEach(p => { if (p.situacao === 'Desligado' || !p.area || /^(afastados|desistentes)$/i.test(p.area)) return;
    const o = S[p.area] || (S[p.area] = { k:'a:' + p.area, nome:p.area, n:0, deps:{} }); o.n++; const d = p.setor || '(sem departamento)'; o.deps[d] = (o.deps[d] || 0) + 1; });
  return Object.values(S).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(o => ({ k:o.k, nome:o.nome, n:o.n, deps:Object.entries(o.deps).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')).map(([d, n]) => ({ k:'d:' + o.nome + '|' + d, nome:d, n })) }));
}
const assinatura = () => 'hist:' + (window.__CRV_HIST_REF || '') + '|' + ['quadro', 'experiencia', 'ferias', 'crachas', 'sancoes', 'rd', 'alojamentos', 'curriculos'].map(id => id + ':' + ((E.metas[id] && (E.metas[id].atualizado_em || E.metas[id].referencia)) || '')).join('|');

/* monta o recorte de uma chave a partir das bases completas (só o administrador consegue ler as bases) */
async function recortes(chaves){
  const Q = await window.CRV_QUADRO(); if (!Q) throw new Error('Sem a base do Quadro Geral.');
  const M = Q.mapa, h = hoje();
  // trajetória (departamentos e funções) dos relatórios da folha; o histórico de férias fica só com o RH
  let HD = {}, HC = {}; try { HD = await window.CRV_HIST('depto'); HC = await window.CRV_HIST('cargo'); } catch(_){}
  const traj = m => (HD[m] || []).map(x => [x[0], 'd', x[1], x[2]]).concat((HC[m] || []).map(x => [x[0], 'f', x[1], x[2]])).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 25);
  const dentro = (p, k) => p.situacao !== 'Desligado' && daChave(k, p);
  // levantamento de perfil profissional: só os números e o parecer da gestão (as informações do RH e os avisos ficam só com o RH)
  const PFL = {}; try { (await window.CRV_REGS('perfil', 'colaboradores')).forEach(x => { if (x.mat) PFL[fMat(x.mat)] = x; }); } catch(_){}
  // ocorrências do ponto (faltas, faltas justificadas e suspensões) e atestados do sistema (só os dias, sem CID), da CRV e das outras empresas do grupo
  let HO = {}, HA = {}; const HOE = {}, HAE = {}; try { HO = await window.CRV_HIST('ocor'); HA = await window.CRV_HIST('atest'); } catch(_){}
  for (const e of [['6', 'APFO'], ['16', 'CAPFO']]) for (const [col, T] of [['hist_ocor', HOE], ['hist_atest', HAE]]) { try { (await window.CRV_REGS('quadro', col + e[0])).forEach(x => { if (String(x._id || '').startsWith('c') && x.mat) (T[fMat(x.mat)] = T[fMat(x.mat)] || []).push([x.emp || e[1], x.l || []]); }); } catch(_){} }
  const ocHist = m => { const Y = {}, EP = [], yr = (y, emp) => Y[y + '|' + emp] = Y[y + '|' + emp] || [y, 0, 0, 0, emp, 0];
    [['', HO[m] || []]].concat(HOE[m] || []).forEach(([emp, L]) => { const ep = []; L.forEach(x => { if (!'fjs'.includes(x[1])) return; const r = yr(x[0].slice(0, 4), emp); r[{ f:1, j:2, s:3 }[x[1]]]++;
        const u = ep[ep.length - 1]; if (u && u[2] === x[1] && fDias(u[1], x[0]) === 1) { u[1] = x[0]; u[3]++; } else ep.push([x[0], x[0], x[1], 1, emp]); }); EP.push(...ep); });
    [['', HA[m] || []]].concat(HAE[m] || []).forEach(([emp, L]) => L.forEach(a => { yr(a[0].slice(0, 4), emp)[5] += a[1]; EP.push([a[0], a[1] > 1 ? addD(a[0], a[1] - 1) : a[0], 'a', a[1], emp]); }));
    const YL = Object.values(Y); return YL.length ? { y:YL.sort((a, b) => b[0].localeCompare(a[0]) || a[4].localeCompare(b[4])), ep:EP.sort((a, b) => b[0].localeCompare(a[0])).slice(0, 20) } : null; };
  // bases auxiliares (lidas uma vez)
  const EXP = {}; let refExp = '';
  try { const d = await window.CRV_DADOS('experiencia'); refExp = d && d.referencia || ''; const R = d && d.dados.RAW || []; const reg = {}; (await window.CRV_REGS('experiencia', 'registros')).forEach(x => reg[x._id] = x);
    R.forEach(r => { const m = fMat(r[0]); const g = reg['m' + m] || {}; const pz = +g.prazoT || 0, v2p = pz && /^\d{4}-\d{2}-\d{2}/.test(String(r[6] || '')) ? new Date(new Date(String(r[6]).slice(0, 10) + 'T12:00:00Z').getTime() + (pz - 1) * 864e5).toISOString().slice(0, 10) : ''; EXP[m] = { v1:r[7] || '', v2:v2p || r[8] || '', dias:(v2p ? pz : r[9]) || '', dec1:g.pr && g.pr.decisao ? DEC[g.pr.decisao] || g.pr.decisao : '', dec2:g.ef && g.ef.decisao ? DEC[g.ef.decisao] || g.ef.decisao : '', enc:(g.enc && g.enc.data) || (r[17] ? 'sim' : '') }; }); } catch(_){}
  const FER = {}; let refFer = '';
  try { const d = await window.CRV_DADOS('ferias'); refFer = d && d.referencia || ''; const PR = {}; (await window.CRV_REGS('ferias', 'prog')).forEach(x => { if (x._id) PR[x._id] = x; });
    (d && d.dados.DATA || []).forEach(p => { const m = fMat(p.c);
      FER[m] = (p.p || []).filter(q => !q[5] && q[3] > 0).map(([de, ate, lim, saldo, , , plan]) => { const g = PR[m + '_' + de];
        const prog = g ? (g.retorno ? 'aguarda retorno' : (g.parcelas && g.parcelas.length ? g.parcelas : [{ inicio:g.inicio, dias:g.dias }]).map(x => brD(x.inicio) + ' (' + x.dias + 'd)').join(' + ')) : (plan && /^\d{4}/.test(plan) ? brD(plan) + ' (planilha)' : '');
        const st = ate > h ? 'Em aquisição' : lim < h && !prog ? 'Vencido' : fDias(h, lim) <= 90 && !prog ? 'Vence em ' + fDias(h, lim) + ' dias' : prog ? 'Programado' : 'A gozar';
        return { de, ate, lim, saldo:Math.round(saldo), prog, st }; }); }); } catch(_){}
  const CR = {}; try { (await window.CRV_REGS('crachas', 'treinamentos')).filter(x => !x.excluido).forEach(x => (CR[fMat(x.mat)] = CR[fMat(x.mat)] || []).push({ func:x.funcaoTrein || '', ini:x.inicio || '', fim:x.fim || '', res:x.resultado || '' })); } catch(_){}
  const RD = {}; try { const d = await window.CRV_DADOS('rd'); const D = d && d.dados.D; const DES = ['Sem tratativa', 'Ausência de culpa', 'Culpa apontada, sem medida', 'Medida disciplinar', 'Desconto', 'Sem informação'];
    if (D) (D.rows || []).forEach(r => (RD[fMat(r[2])] = RD[fMat(r[2])] || []).push({ n:String(r[0]), d:r[1] || '', des:DES[r[9]] || '', tr:r[10] || '' })); } catch(_){}
  let ONB = { itens:[], ck:{}, cv:{} };
  try { const L = await window.CRV_REGS('onboarding', 'config'), c = L.find(x => x._id === 'itens'); ONB.itens = c && c.itens || [];
    (await window.CRV_REGS('onboarding', 'check')).forEach(x => ONB.ck[fMat(x.mat || x._id)] = x.ok || {});
    (await window.CRV_REGS('onboarding', 'conversas')).filter(x => !x.excluida).forEach(x => (ONB.cv[fMat(x.mat)] = ONB.cv[fMat(x.mat)] || []).push(+x.marco)); } catch(_){}
  const CID = {}; let TIP = [], MOTN = [], EXR = {};
  try { const q = await window.CRV_DADOS('quadro'); (q && q.dados.D || []).forEach(r => { CID[fMat(r[0])] = r[12] || ''; });
    const A = q && q.dados.AXD; if (A) { TIP = A.TIP || []; MOTN = A.MOT || []; (A.EXR || []).forEach(r => { const m = fMat(r[0]); if (!EXR[m] || String(r[1]) > String(EXR[m][1])) EXR[m] = r; }); } } catch(_){}
  const ALO = {}; try { const d = await window.CRV_DADOS('alojamentos'); const A = d && d.dados.DATA; if (A) (A.people || []).forEach(y => { if (y.t === 'c') ALO[fMat(y.m)] = { casa:((A.houses || [])[y.h] || {}).n || '', q:y.q || '', orig:[y.oc, y.ou].filter(Boolean).join('/') }; }); } catch(_){}
  let PREV = null; try { const L = await window.CRV_REGS('curriculos', 'config'); PREV = L.find(x => x._id === 'previsao') || null; } catch(_){}
  const casa = (k, p) => daChave(k, p);
  const d400 = addD(h, -400);
  const out = [];
  for (const k of chaves) {
    const mats = Object.keys(M).filter(m => dentro(M[m], k));
    const O = await window.CRV_OCORR(mats, '2000-01-01', h); const ate = O.abs || '';
    const d90 = ate ? addD(ate, -90) : '', d30 = ate ? addD(ate, -30) : '';
    const P = mats.map(m => { const p = M[m], o = O.P[m] || { at:[], fa:[], adv:[], sus:[] };
      const casa = p.admissao ? fDias(p.admissao, h) : null, ob = casa != null && casa <= 120 ? { falta: ONB.itens.filter(i => !(ONB.ck[m] || {})[i.id]).map(i => i.nome), conv: ONB.cv[m] || [] } : null;
      return { m, n:p.nome, f:p.funcao, s:p.setor, adm:p.admissao, v:p.vinculo, sit:p.situacao,
        fa90:o.fa.filter(x => x > d90).length, fa30:o.fa.filter(x => x > d30).length, at90:o.at.filter(x => x > d90).length,
        faAno:o.fa.filter(x => x.slice(0, 4) === h.slice(0, 4)).length, atAno:o.at.filter(x => x.slice(0, 4) === h.slice(0, 4)).length,
        ger:p.gerencia || '', area:p.area || '',
        san: o.adv.map(x => ({ d:x.data, t:'Advertência', mot:x.motivo || '' })).concat(o.sus.map(x => ({ d:x.data, t:'Suspensão' + (x.dias ? ' (' + x.dias + 'd)' : ''), mot:x.motivo || '' }))).sort((a, b) => String(b.d).localeCompare(String(a.d))),
        rd: (RD[m] || []).sort((a, b) => String(b.d).localeCompare(String(a.d))),
        exp: p.vinculo === 'Experiência' || (EXP[m] && EXP[m].v2 >= addD(h, -30)) ? EXP[m] || null : null, fer: FER[m] || [], cr:(CR[m] || []).filter(x => !x.fim || x.fim >= addD(h, -30)), ob };
    }).sort((a, b) => a.n.localeCompare(b.n, 'pt-BR'));
    P.forEach(p => { p.cid = CID[p.m] || ''; p.alo = ALO[p.m] || null; const t = traj(p.m); if (t.length) p.tr = t; const oh = ocHist(p.m); if (oh) p.oh = oh; const pf = PFL[p.m]; if (pf) p.pf = { atest:+pf.atest || 0, falta:+pf.falta || 0, fj:+pf.fj || 0, susp:+pf.susp || 0, adv:+pf.adv || 0, par:pf.parecer && ((pf.parecer.acoes || []).length || String(pf.parecer.txt || '').trim()) ? { acoes:pf.parecer.acoes || [], txt:pf.parecer.txt || '', resp:pf.parecer.resp || '', em:pf.parecer.em || '' } : null }; });
    // movimentação dos últimos 13 meses (inclui quem já saiu)
    const MOV = { adm:[], sai:[] };
    Object.entries(M).forEach(([m, p]) => { if (!casa(k, p)) return;
      if (p.admissao && p.admissao >= d400) MOV.adm.push({ m, n:p.nome, f:p.funcao, s:p.setor, d:p.admissao, v:p.vinculo, saiu: p.situacao === 'Desligado' ? p.deslig : '' });
      if (p.situacao === 'Desligado' && p.deslig && p.deslig >= d400) { const e = EXR[m]; MOV.sai.push({ m, n:p.nome, f:p.funcao, s:p.setor, d:p.deslig, adm:p.admissao, casa:p.admissao ? fDias(p.admissao, p.deslig) : null, tipo:e ? TIP[e[3]] || '' : '', mot:e ? (e[4] || []).map(i => MOTN[i]).filter(Boolean) : [] }); } });
    // quadro x previsto: seções da equipe (ou o grupo da área) na previsão de quadro
    let PV = null;
    if (PREV && Array.isArray(PREV.grupos)) { const sec = new Set(P.map(p => normal(p.s)));
      // o grupo da previsão é da área quando o nome bate com a área (ou está contido na gerência); os itens são seções ou tipos de função
      const kn = normal(k.slice(2)), grupoDaArea = g => k[0] === 'a' && [g.g, g.dp].some(x => { const n = normal(x || ''); return n && n === kn; });
      // função: palavra inteira (Motorista I não pode contar Motorista II/III) e cada pessoa entra só no item mais específico
      const palavras = x => normal(x).replace(/[^a-z0-9]+/g, ' ').trim(), temTermo = (txt, n) => (' ' + palavras(txt) + ' ').includes(' ' + palavras(n) + ' ');
      const cand = []; PREV.grupos.forEach(g => (g.itens || []).forEach(it => { const n = normal(it.n); if (sec.has(n) || grupoDaArea(g)) cand.push([g, it, n, sec.has(n)]); }));
      const dono = {}; P.forEach(p => { if (p.sit !== 'Ativo') return; let best = null;
        cand.forEach(([g, it, n, porSecao]) => { if (porSecao || !(temTermo(p.f, n) || temTermo(p.s, n))) return; if (!best || palavras(it.n).length > palavras(best.n).length) best = it; });
        if (best) dono[p.m] = best; });
      const itens = []; cand.forEach(([g, it, n, porSecao]) => {
        const L = P.filter(p => p.sit === 'Ativo' && (porSecao ? normal(p.s) === n : dono[p.m] === it));
        itens.push({ n:it.n, g:g.g || g.dp || '', p:+it.p || 0, t:L.length, x:L.filter(p => p.v === 'Experiência').length }); });
      PV = { itens, posicao: PREV.posicao || PREV.atualizadoEm || '' }; }
    out.push({ chave:k, dados:{ chave:k, nome:nomeChave(k), tipo:tipoChave(k), P, MOV, PV, ref:{ quadro:Q.referencia, abs:ate, exp:refExp, fer:refFer, sai:(Object.values(EXR).length ? '' : '') }, gerado:new Date().toISOString(), por:E.perfil.nome } });
  }
  return out;
}

/* administrador: gera os recortes para todas as áreas usadas por gestores */
async function gerar(forcar){
  if (!E.perfil || E.perfil.papel !== 'admin') return { ok:false };
  const { data: G, error } = await sb.from('perfis').select('areas,papel,ativo').eq('papel', 'gestor');
  if (error) return { ok:false, erro:error };
  const chaves = [...new Set((G || []).filter(g => g.ativo).flatMap(g => g.areas || []))].filter(chaveOk);
  const sig = assinatura();
  if (!forcar) { try { const { data } = await sb.from('area_dados').select('dados').eq('chave', '__meta').maybeSingle(); if (data && data.dados && data.dados.sig === sig && JSON.stringify(data.dados.chaves) === JSON.stringify(chaves.slice().sort())) return { ok:true, igual:true }; } catch(_){} }
  if (!chaves.length) return { ok:true, n:0 };
  const R = await recortes(chaves);
  for (const r of R) { const { error: e } = await sb.from('area_dados').upsert({ chave:r.chave, dados:r.dados, atualizado_em:new Date().toISOString(), atualizado_por:E.perfil.nome }, { onConflict:'chave' }); if (e) return { ok:false, erro:e }; }
  await sb.from('area_dados').upsert({ chave:'__meta', dados:{ sig, chaves:chaves.slice().sort(), em:new Date().toISOString(), por:E.perfil.nome }, atualizado_em:new Date().toISOString(), atualizado_por:E.perfil.nome }, { onConflict:'chave' });
  return { ok:true, n:R.length };
}
async function ultimaGeracao(){ try { const { data } = await sb.from('area_dados').select('dados').eq('chave', '__meta').maybeSingle(); return data && data.dados; } catch(_){ return null; } }

/* tela do gestor: resumo (#/) ou um painel da equipe (#/eq/<painel>) */
const PAINEL_G = { eq:['Gestão de Colaboradores', 'Equipe', 'Quem é da sua equipe: função, departamento, contrato e cidade.'], mov:['Gestão de Colaboradores', 'Admissões e saídas', 'Quem entrou e quem saiu, com tipo e motivo das saídas por período.'],
  pv:['Gestão de Colaboradores', 'Quadro x previsto', 'Quantas pessoas a previsão de quadro pede e quantas a equipe tem hoje.'], exp:['Gestão de Colaboradores', 'Período de experiência', 'Vencimentos e avaliação de experiência: avalie e envie ao RH pelo app.'],
  nov:['Gestão de Colaboradores', 'Novos colaboradores', 'Quem entrou nos últimos 120 dias: integração e conversas do RH.'], fer:['Absenteísmo e Férias', 'Férias', 'Períodos, data limite e saldo: programe e envie ao RH até o dia 15 do mês anterior.'],
  freq:['Absenteísmo e Férias', 'Frequência', 'Faltas e dias de atestado (só a quantidade) nos últimos 30 e 90 dias.'], disc:['Ocorrências e Relações Trabalhistas', 'Disciplina e RD', 'Advertências, suspensões e registros de dano da equipe.'],
  cr:['T&D | Desenvolvimento de Pessoas', 'Em treinamento', 'Quem está com crachá de treinamento e até quando.'], alo:['Alojamentos e Transporte', 'Alojamento', 'Quem da equipe está alojado, onde e de qual cidade veio.'],
  perfil:['Seleção e Perfil Profissional', 'Perfil profissional', 'Quem da sua equipe está no levantamento de perfil profissional: veja os números e registre seu parecer e o plano de ação.'],
  env:['Atendimento e Ouvidoria', 'Meus envios ao RH', 'Tudo o que você programou ou avaliou e enviou, com a situação de cada envio.'] };
async function tela(abaIni){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow" id="gs-eye">Gestão de Pessoas</div><h1 id="gs-h1">Minha equipe</h1><div class="ini-data" id="gs-sub">Carregando…</div></div>
      <div class="dk-acoes"><button class="btn borda" id="gs-xls">Excel</button><button class="btn borda" id="gs-pdf">PDF</button></div></section>
    <div id="gs-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  const { data, error } = await sb.from('area_dados').select('chave,dados,atualizado_em').neq('chave', '__meta');
  const c = $('#gs-corpo'); if (!c) return;
  if (error) { c.innerHTML = `<div class="cartao vazio"><h3>Não consegui abrir os dados da sua equipe</h3><p>${esc(traduzErro(error))}</p></div>`; return; }
  const A = (data || []).map(x => x.dados).filter(Boolean);
  if (!A.length) { $('#gs-sub').textContent = ''; c.innerHTML = '<div class="cartao vazio"><h3>Sua equipe ainda não foi liberada</h3><p>O RH precisa vincular sua área ao seu acesso e atualizar a visão dos gestores.</p></div>'; return; }
  const P = []; const vis = new Set(); A.forEach(a => a.P.forEach(p => { if (!vis.has(p.m)) { vis.add(p.m); P.push(Object.assign({ chave:a.nome }, p)); } }));
  P.sort((a, b) => a.n.localeCompare(b.n, 'pt-BR'));
  const ref = A[0].ref || {}, h = hoje();
  const uniq = L => { const v = new Set(); return L.filter(x => { const k = x.m + '|' + x.d; if (v.has(k)) return false; v.add(k); return true; }); };
  const MADM = uniq(A.flatMap(a => (a.MOV || {}).adm || [])).sort((a, b) => b.d.localeCompare(a.d)), MSAI = uniq(A.flatMap(a => (a.MOV || {}).sai || [])).sort((a, b) => b.d.localeCompare(a.d));
  const PVI = A.flatMap(a => (a.PV && a.PV.itens) || []).filter((x, i, arr) => arr.findIndex(y => y.n === x.n) === i).map(x => Object.assign({}, x));
  { // recalcula aqui o atual de cada item: função por palavra inteira e cada pessoa em um item só (vale também para visões geradas antes da correção)
    const pal = x => normal(x || '').replace(/[^a-z0-9]+/g, ' ').trim(), tem = (t, n) => (' ' + pal(t) + ' ').includes(' ' + pal(n) + ' ');
    const at = P.filter(p => p.sit === 'Ativo'), secs = new Set(at.map(p => normal(p.s)));
    const dono = {}; at.forEach(p => { let best = null; PVI.forEach(it => { if (secs.has(normal(it.n)) || !(tem(p.f, it.n) || tem(p.s, it.n))) return; if (!best || pal(it.n).length > pal(best.n).length) best = it; }); if (best) dono[p.m] = best; });
    PVI.forEach(it => { const L = secs.has(normal(it.n)) ? at.filter(p => normal(p.s) === normal(it.n)) : at.filter(p => dono[p.m] === it); it.t = L.length; it.x = L.filter(p => p.v === 'Experiência').length; it.mats = L.map(p => p.m); }); }
  const pvPos = (A.find(a => a.PV) || {}).PV;
  let per = 3; const PERS = [[1, 'Último mês'], [3, '3 meses'], [6, '6 meses'], [12, '12 meses']];
  const desde = () => addD(h, -30 * per - (per === 12 ? 5 : 0));
  const aloL = P.filter(p => p.alo);
  $('#gs-sub').innerHTML = `${ASSIST() ? `<span class="gs-ch">Assistente de ${esc(tcN(ASSIST().nome))}</span>` : ''}${A.map(a => `<span class="gs-ch">${esc(a.tipo)}: ${esc(a.nome)}</span>`).join('')} <span>Atualizado pelo RH em ${esc(new Date(A.map(a => a.gerado).sort().pop()).toLocaleDateString('pt-BR'))}</span>`;
  const H = h, em15 = addD(H, 15);
  let ENV = []; const lerEnv = async () => { try { const r = await sb.from('gestor_envios').select('*').order('criado_em', { ascending:false }); ENV = r.error ? [] : (r.data || []); } catch(_){ ENV = []; } };
  await lerEnv();
  const ultEnv = (tipo, mat, ref) => ENV.find(e => e.tipo === tipo && e.mat === mat && e.status !== 'cancelado' && (!ref || (e.dados || {}).ref === ref));
  const chaveDe = m => (A.find(a => a.P.some(p => p.m === m)) || A[0]).chave;
  const stChip = e => e ? `<span class="gs-st ${STE[e.status][1]}">${STE[e.status][0]}${e.status === 'enviado' ? ' · ' + esc(brD(e.criado_em.slice(0, 10))) : ''}</span>` : '';
  const expL = P.filter(p => p.exp && !p.exp.enc).map(p => { const prox = [p.exp.v1, p.exp.v2].filter(d => d && d >= addD(H, -30)).sort()[0] || p.exp.v2; return Object.assign({ prox }, p); }).sort((a, b) => String(a.prox).localeCompare(String(b.prox)));
  const ferL = P.flatMap(p => p.fer.filter(f => f.st !== 'Em aquisição').map(f => Object.assign({ p }, f))).sort((a, b) => a.lim.localeCompare(b.lim));
  const novos = P.filter(p => p.ob);
  const crL = P.flatMap(p => p.cr.map(x => Object.assign({ p }, x))).sort((a, b) => String(a.fim).localeCompare(String(b.fim)));
  const d12 = addD(h, -365), s12 = p => (p.san || []).filter(x => x.d >= d12);
  const discL = P.filter(p => (p.san || []).length || (p.rd || []).length).sort((a, b) => s12(b).length - s12(a).length || (b.san || []).length - (a.san || []).length);
  const pfPrio = x => x.susp > 0 || x.falta > 10 || x.adv >= 3 ? 0 : x.adv >= 1 ? 1 : 2, pfL = P.filter(p => p.pf).sort((a, b) => pfPrio(a.pf) - pfPrio(b.pf) || (b.pf.susp * 100 + b.pf.adv * 10 + b.pf.falta) - (a.pf.susp * 100 + a.pf.adv * 10 + a.pf.falta));
  const pfPend = p => !p.pf.par && !(ultEnv('perfil', p.m) || {}).id;
  const ABAS = [['eq', 'Equipe', P.length], ['mov', 'Admissões e saídas', MSAI.filter(x => x.d >= addD(h, -90)).length], ['pv', 'Quadro x previsto', PVI.reduce((t, x) => t + Math.max(0, x.p - x.t), 0)], ['exp', 'Experiência', expL.filter(p => p.prox && p.prox <= em15).length], ['fer', 'Férias', ferL.filter(f => /Vencido|Vence/.test(f.st)).length], ['freq', 'Frequência', P.filter(p => p.fa30).length], ['disc', 'Disciplina', P.filter(p => s12(p).length).length], ['nov', 'Novos colaboradores', novos.length], ['alo', 'Alojamento', aloL.length], ['cr', 'Em treinamento', crL.length], ['perfil', 'Perfil profissional', pfL.filter(pfPend).length], ['env', 'Meus envios', ENV.filter(e => e.status === 'devolvido').length]];
  const FQ = P.filter(p => p.fa90 || p.at90).sort((a, b) => b.fa90 - a.fa90 || b.at90 - a.at90);
  let aba = abaIni && PAINEL_G[abaIni] ? abaIni : 'resumo', q = ''; const fq = { v:'', c:'' };
  if (aba !== 'resumo') { $('#gs-eye').textContent = PAINEL_G[aba][0]; $('#gs-h1').textContent = PAINEL_G[aba][1]; $('#gs-sub').innerHTML = `<span class="gs-desc">${esc(PAINEL_G[aba][2])}</span> ` + $('#gs-sub').innerHTML; }
  const tabelas = {
    eq: () => { const L = P.filter(p => (!fq.v || p.v === fq.v) && (!fq.c || (p.cid || '(sem cidade)') === fq.c)); return { t:'Equipe', cab:['Colaborador', 'Matrícula', 'Função', 'Seção', 'Contrato', 'Cidade', 'Admissão', 'Situação', 'Sanções 12 meses', 'Faltas no ano'], lin:L.map(p => [p.n, p.m, p.f, p.s, p.v, p.cid || '', brD(p.adm), p.sit, s12(p).length, p.faAno || 0]), mats:L.map(p => p.m), hl:L.map(p => s12(p).length >= 3) }; },
    mov: () => { const de = desde(), Ad = MADM.filter(x => x.d >= de), Sa = MSAI.filter(x => x.d >= de); const L = [...Ad.map(x => ['Admissão', x]), ...Sa.map(x => ['Saída', x])].sort((a, b) => b[1].d.localeCompare(a[1].d));
      return { t:`Admissões e saídas · ${PERS.find(x => x[0] === per)[1].toLowerCase()}`, cab:['Colaborador', 'Movimento', 'Data', 'Função', 'Seção', 'Tipo / contrato', 'Motivo da saída', 'Dias de casa'], lin:L.map(([t, x]) => [x.n, t, brD(x.d), x.f, x.s, t === 'Saída' ? x.tipo || '—' : x.v + (x.saiu ? ' · saiu em ' + brD(x.saiu) : ''), t === 'Saída' ? x.mot.join(', ') || '—' : '', t === 'Saída' && x.casa != null ? x.casa : '']), hl:L.map(([t, x]) => t === 'Saída' && x.casa != null && x.casa <= 90), pess:L.map(([t, x]) => ({ n:x.n, m:x.m, f:x.f })) }; },
    pv: () => ({ t:'Quadro x previsto' + (pvPos && pvPos.posicao ? ` (previsão de ${brD(pvPos.posicao)})` : ''), cab:['Seção', 'Grupo', 'Previsto', 'Atual', 'Em experiência', 'Falta contratar', 'Acima do previsto'], lin:PVI.slice().sort((a, b) => (b.p - b.t) - (a.p - a.t)).map(x => [x.n, x.g, x.p, x.t, x.x, Math.max(0, x.p - x.t) || '—', Math.max(0, x.t - x.p) || '—']), hl:PVI.slice().sort((a, b) => (b.p - b.t) - (a.p - a.t)).map(x => x.p > x.t) }),
    alo: () => ({ t:'Alojamento', cab:['Colaborador', 'Função', 'Seção', 'Contrato', 'Alojamento', 'Quarto', 'Cidade de origem'], lin:aloL.map(p => [p.n, p.f, p.s, p.v, p.alo.casa, p.alo.q, p.alo.orig || '']), mats:aloL.map(p => p.m) }),
    disc: () => ({ t:'Disciplina', cab:['Colaborador', 'Função', 'Advertências 12 meses', 'Suspensões 12 meses', 'Total no histórico', 'Última', 'RD'], lin:discL.map(p => { const L = s12(p); return [p.n, p.f, L.filter(x => /^Adv/.test(x.t)).length, L.filter(x => /^Sus/.test(x.t)).length, (p.san || []).length, p.san && p.san[0] ? brD(p.san[0].d) + ' · ' + p.san[0].t : '—', (p.rd || []).length]; }), mats:discL.map(p => p.m), hl:discL.map(p => s12(p).length >= 3 || s12(p).some(x => /^Sus/.test(x.t))),
      acao: discL.map(p => { const e = ultEnv('sancao', p.m); return (e && e.status === 'enviado' ? stChip(e) + ` <button class="link" data-ve="${esc(e.id)}">ver</button> · ` : '') + `<button class="btn peq borda" data-ps="${esc(p.m)}">Pedir sanção</button>`; }), acaoT:'Pedido ao RH' }),
    exp: () => ({ t:'Período de experiência', cab:['Colaborador', 'Função', '1º vencimento', 'Avaliação', 'Vencimento final', 'Avaliação', 'Encerramento: enviar até', 'Faltas', 'Sanções'], lin:expL.map(p => { const et = etapaExp(p.exp, h); return [p.n, p.f, brD(p.exp.v1), p.exp.dec1 || 'pendente', brD(p.exp.v2), p.exp.dec2 || 'pendente', et ? brD(prazoEnc(et.venc)) : '', p.faAno || 0, (p.san || []).length]; }), mats:expL.map(p => p.m), hl:expL.map(p => p.prox && p.prox <= em15),
      acao: expL.map(p => { const et = etapaExp(p.exp, h); const e = et && ultEnv('experiencia', p.m, et.k + '|' + et.venc); return e && e.status !== 'devolvido' ? stChip(e) + ` <button class="link" data-ve="${esc(e.id)}">ver</button>` : `${e ? stChip(e) + ' ' : ''}<button class="btn peq prim" data-av="${esc(p.m)}">Avaliar</button>`; }), acaoT:'Avaliação do gestor' }),
    fer: () => ({ t:'Férias', cab:['Colaborador', 'Período aquisitivo', 'Data limite', 'Saldo', 'Programação', 'Situação'], lin:ferL.map(f => [f.p.n, brD(f.de) + ' a ' + brD(f.ate), brD(f.lim), f.saldo + 'd', f.prog || '—', f.st]), mats:ferL.map(f => f.p.m), hl:ferL.map(f => /Vencido|Vence/.test(f.st)),
      acao: ferL.map((f, i) => { const e = ultEnv('ferias', f.p.m, f.de); return e && e.status !== 'devolvido' ? stChip(e) + ` <button class="link" data-ve="${esc(e.id)}">ver</button>` : f.prog && !e ? '<span class="gs-st ok">Programado</span>' : `${e ? stChip(e) + ' ' : ''}<button class="btn peq prim" data-pf="${i}">Programar</button>`; }), acaoT:'Programação pelo gestor' }),
    env: () => ({ t:'Meus envios ao RH', cab:['Enviado em', 'Tipo', 'Colaborador', 'Resumo', 'Situação', 'Retorno do RH'], lin:ENV.map(e => [dataHora(e.criado_em), TIPO_ENV[e.tipo] || e.tipo, e.colaborador || e.mat, resumoEnvio(e), STE[e.status][0], e.rh_obs || '']), pcol:2, pess:ENV.map(e => ({ n:e.colaborador || '', m:e.mat || '', f:'' })), acao:ENV.map(e => `<button class="link" data-ve="${esc(e.id)}">ver</button>${e.status === 'enviado' ? ` · <button class="link" data-cx="${esc(e.id)}">cancelar</button>` : ''}`), acaoT:'' }),
    freq: () => ({ t:`Frequência (até ${brD(ref.abs)})`, cab:['Colaborador', 'Função', 'Faltas 30 dias', 'Faltas 90 dias', 'Dias de atestado 90 dias'], lin:FQ.map(p => [p.n, p.f, p.fa30, p.fa90, p.at90]), mats:FQ.map(p => p.m) }),
    nov: () => ({ t:'Novos colaboradores', cab:['Colaborador', 'Função', 'Admissão', 'Dias de casa', 'Integração pendente', 'Conversas do RH'], lin:novos.map(p => [p.n, p.f, brD(p.adm), fDias(p.adm, h), p.ob.falta.join(', ') || 'completa', [30, 60, 90].filter(k => p.ob.conv.includes(k)).map(k => k + 'd').join(', ') || '—']), mats:novos.map(p => p.m) }),
    perfil: () => ({ t:'Perfil profissional', cab:['Colaborador', 'Função', 'Prioridade', 'Atestados', 'Faltas', 'Advertências', 'Suspensões', 'Parecer da gestão'], lin:pfL.map(p => [p.n, p.f, ['Alta', 'Média', 'Acompanhar'][pfPrio(p.pf)], p.pf.atest, p.pf.falta + (p.pf.fj ? ' + ' + p.pf.fj + ' just.' : ''), p.pf.adv, p.pf.susp, p.pf.par ? p.pf.par.acoes.join(', ') || 'preenchido' : 'pendente']), mats:pfL.map(p => p.m), hl:pfL.map(p => pfPrio(p.pf) === 0),
      acao: pfL.map(p => { const e = ultEnv('perfil', p.m); return e && e.status === 'enviado' ? stChip(e) + ` <button class="link" data-ve="${esc(e.id)}">ver</button>` : `${e ? stChip(e) + ' ' : ''}<button class="btn peq ${p.pf.par ? 'borda' : 'prim'}" data-pp="${esc(p.m)}">${p.pf.par ? 'Atualizar parecer' : 'Preencher parecer'}</button>`; }), acaoT:'Seu parecer' }),
    cr: () => ({ t:'Em treinamento (crachá de treinamento)', cab:['Colaborador', 'Função em treinamento', 'Início', 'Vencimento', 'Resultado'], lin:crL.map(x => [x.p.n, x.func, brD(x.ini), brD(x.fim), x.res || '—']), mats:crL.map(x => x.p.m), hl:crL.map(x => x.fim && x.fim <= em15) }) };
  const conta = (L, f) => { const o = {}; L.forEach(x => { const k = f(x); o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
  const chips = (tit, L, campo) => `<div class="gs-res"><span>${tit}</span>${L.map(([k, n]) => `<button class="gs-c ${fq[campo] === k ? 'on' : ''}" data-fq="${campo}|${esc(k)}">${esc(k)} <b>${n}</b></button>`).join('')}</div>`;
  const extra = () => {
    if (aba === 'eq') return `<section class="cartao gs-resw">${chips('Contrato', conta(P, p => p.v || '—'), 'v')}${chips('Cidade de residência', conta(P, p => p.cid || '(sem cidade)'), 'c')}${fq.v || fq.c ? '<button class="link" id="gs-lf">limpar</button>' : ''}</section>`;
    if (aba === 'mov') { const de = desde(), Ad = MADM.filter(x => x.d >= de), Sa = MSAI.filter(x => x.d >= de), at = P.filter(p => p.sit === 'Ativo').length || 1;
      const tp = conta(Sa, x => x.tipo || 'Não informado'), mt = conta(Sa.flatMap(x => x.mot.length ? x.mot.map(m => ({ m })) : [{ m:'Não informado' }]), x => x.m), mx = Math.max(1, ...mt.map(x => x[1]));
      return `<section class="cartao gs-resw"><div class="gs-res"><span>Período</span>${PERS.map(([n, t]) => `<button class="gs-c ${per === n ? 'on' : ''}" data-per="${n}">${t}</button>`).join('')}</div>
        <div class="gs-mv"><div><small>Admissões</small><b>${Ad.length}</b></div><div><small>Saídas</small><b>${Sa.length}</b></div><div><small>Saídas com até 90 dias</small><b>${Sa.filter(x => x.casa != null && x.casa <= 90).length}</b></div><div><small>Turnover no período</small><b>${(100 * Sa.length / at).toLocaleString('pt-BR', { maximumFractionDigits:1 })}%</b></div></div>
        ${Sa.length ? `<div class="gs-mt"><div><h4>Tipo de saída</h4>${tp.map(([k, n]) => `<div class="gs-b"><span>${esc(k)}</span><i style="width:${Math.round(100 * n / Sa.length)}%"></i><b>${n}</b></div>`).join('')}</div><div><h4>Motivos das saídas</h4>${mt.map(([k, n]) => `<div class="gs-b"><span>${esc(k)}</span><i style="width:${Math.round(100 * n / mx)}%"></i><b>${n}</b></div>`).join('')}</div></div>` : ''}</section>`; }
    if (aba === 'fer') { const mi = minInicioFerias(h); return `<section class="cartao gs-resw gs-pz"><div><b>Prazo:</b> férias que começam em ${esc(MESN[+mi.slice(5, 7) - 1])} podem ser enviadas até ${esc(brD(prazoFerias(mi)))}. Hoje, a data mais cedo que dá para programar é ${esc(brD(mi))}.</div><button class="btn borda" id="gs-impf">Imprimir formulário da equipe</button></section>`; }
    if (aba === 'exp') return `<section class="cartao gs-resw gs-pz"><div><b>Prazo:</b> o encerramento do contrato precisa chegar ao RH no máximo 5 dias antes do vencimento. Efetivar ou prorrogar também deve ser enviado antes do vencimento.</div></section>`;
    if (aba === 'env') return ENV.length ? '' : '<section class="cartao gs-resw"><p class="nr-nota" style="padding:0">Você ainda não enviou nada ao RH. Programe férias no painel Férias, avalie a experiência no painel Experiência e peça sanções no painel Disciplina e RD.</p></section>';
    if (aba === 'perfil') return `<section class="cartao gs-resw gs-pz"><div><b>Como funciona:</b> o RH reuniu os números de cada um (atestados, faltas, advertências e suspensões). Você conhece o dia a dia: diga qual ação a gestão vai tomar, com prazo e responsável. O RH recebe, confere e lança no levantamento. ${pfL.length ? pfL.filter(pfPend).length + ' de ' + pfL.length + ' ainda sem parecer.' : 'Ninguém da sua equipe está no levantamento agora.'}</div></section>`;
    if (aba === 'disc') { const pend = ENV.filter(e => e.tipo === 'sancao' && e.status === 'enviado').length;
      return `<section class="cartao gs-resw gs-pz"><div><b>Pedido de sanção:</b> descreva ao RH o que aconteceu, a data e todos os fatos, e diga qual medida você sugere (orientação, advertência ou suspensão com os dias). O RH analisa o caso e o histórico, define a medida e emite o documento para o colaborador assinar.${pend ? ` <span class="gs-st pend">${pend} pedido${pend > 1 ? 's' : ''} aguardando o RH</span>` : ''}</div><button class="btn prim" id="gs-psan">Pedir sanção ao RH</button></section>`; }
    if (aba === 'pv') { const f = PVI.reduce((t, x) => t + Math.max(0, x.p - x.t), 0), pr = PVI.reduce((t, x) => t + x.p, 0), at = PVI.reduce((t, x) => t + x.t, 0);
      return PVI.length ? `<section class="cartao gs-resw"><div class="gs-mv"><div><small>Previsto</small><b>${pr}</b></div><div><small>Atual</small><b>${at}</b></div><div><small>Falta contratar</small><b style="color:#a3301c">${f}</b></div><div><small>Em experiência</small><b>${PVI.reduce((t, x) => t + x.x, 0)}</b></div></div><p class="nr-nota" style="padding:6px 0 0">A falta mostra onde o quadro está abaixo do previsto; não é vaga aprovada. Para abrir vaga, fale com a Gestão de Pessoas.</p></section>`
        : '<section class="cartao gs-resw"><p class="nr-nota" style="padding:0">A previsão de quadro desta área ainda não foi cadastrada.</p></section>'; }
    return ''; };

  // exportações: sempre com a coluna Matrícula logo depois do nome
  const comMat = T => { const pc = T.pcol || 0, ms = T.mats || (T.pess && T.pess.map(x => x.m)); if (!ms || T.cab.includes('Matrícula')) return { cab:T.cab, lin:T.lin };
    return { cab:[...T.cab.slice(0, pc + 1), 'Matrícula', ...T.cab.slice(pc + 1)], lin:T.lin.map((l, i) => [...l.slice(0, pc + 1), ms[i] || '', ...l.slice(pc + 1)]) }; };
  // tabela do gestor: nome com matrícula e função embaixo, números e situações em destaque; no celular vira cartão
  const tcN = t => String(t || '').toLowerCase().replace(/(^|[\s(\/-])([a-zà-ú])/g, (a, b, c) => b + c.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das|E)\b/g, w => w.toLowerCase()).replace(/\b(Ii|Iii|Iv|Vi|Vii|Ctt|Rh|Ti)\b/g, w => w.toUpperCase());
  const iniN = n => { const w = String(n || '').trim().split(/\s+/); return ((w[0] || '')[0] || '') + (w.length > 1 ? w[w.length - 1][0] : ''); };
  const AVC = ['#24427c', '#2e8a57', '#c47f1a', '#d4573f', '#16807a', '#8e3b6a', '#5a4fb0', '#2f6fa8'], hueN = t => { let h = 0; for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) % 997; return AVC[h % AVC.length]; };
  const TOM = v => { const t = String(v); return /^(pendente|sem parecer|não informado)$/i.test(t) || /Vence(?!ido)|Aguard|pendente/i.test(t) ? 'pend' : /Vencid|Encerr|Saída|Justa|Alta\b|Desliga/i.test(t) ? 'dev' : /^(Efetiv|Prorrog|Programado|completa|preenchido|Admissão|Acompanhar|Aprovado|Recebido|Em dia|Ativo)/i.test(t) ? 'ok' : /Média/i.test(t) ? 'pend' : 'neu'; };
  const COL_CHIP = /^(Avaliação|Situação|Parecer da gestão|Prioridade|Resultado|Movimento|Integração pendente)$/;
  function tabelaG(T, idx){
    const pc = T.pcol || 0, temP = !!(T.pess || T.mats);
    const pessoa = i => T.pess ? T.pess[i] : (() => { const x = P.find(p => p.m === T.mats[i]); return x ? { n:x.n, m:x.m, f:x.f } : { n:T.lin[i][pc], m:T.mats[i], f:'' }; })();
    const tira = temP ? T.cab.map((h, j) => j !== pc && /^(Matrícula|Função)$/.test(h)) : T.cab.map(() => false);
    const cab = T.cab.filter((h, j) => !tira[j]);
    const cel = (v, h) => { if (v === '' || v == null) return '<span class="gt-z">—</span>';
      if (typeof v === 'number' || /^\d+$/.test(String(v))) { const n = +v; return `<span class="gt-n ${n > 0 ? (/Falta|Sanç|Advert|Suspens|Atest|RD|contratar|Acima/i.test(h) ? 'on' : 'nt') : ''}">${n}</span>`; }
      if (COL_CHIP.test(h)) return `<span class="gs-st ${TOM(v)}">${esc(v)}</span>`;
      const t = String(v); return esc(t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t) ? tcN(t) : t); };
    const pcel = i => { const x = pessoa(i) || {}; const clic = T.mats || P.some(p => p.m === x.m);
      return `<div class="gt-p"><span class="gt-av" style="--av:${hueN(x.n)}">${esc(iniN(x.n).toUpperCase())}</span><div class="gt-pt">${clic ? `<button class="gt-nm" data-f="${esc(x.m)}">${esc(tcN(x.n))}</button>` : `<b class="gt-nm0">${esc(tcN(x.n))}</b>`}<small>${x.m ? `<span class="gt-mat">Mat. ${esc(x.m)}</span>` : ''}${x.f ? `<span>${esc(tcN(x.f))}</span>` : ''}</small></div></div>`; };
    return `<div class="fc-tw"><table class="gt-t"><thead><tr>${cab.map(x => `<th>${esc(x)}</th>`).join('')}${T.acao ? `<th>${esc(T.acaoT || '')}</th>` : ''}</tr></thead><tbody>${idx.map(i => `<tr class="${T.hl && T.hl[i] ? 'gt-hl' : ''}">${T.lin[i].map((v, j) => tira[j] ? '' : (j === pc && temP ? `<td class="gt-pc" data-l="${esc(T.cab[j])}">${pcel(i)}</td>` : `<td data-l="${esc(T.cab[j])}">${cel(v, T.cab[j])}</td>`)).join('')}${T.acao ? `<td class="gs-ac" data-l="${esc(T.acaoT || '')}">${T.acao[i] || ''}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  }
  const desenhar = () => {
    if (aba === 'resumo') { c.innerHTML = `<section class="gs-res-g">${ABAS.map(([k, t, n]) => `<button class="gs-rc" data-ir="#/eq/${k}" style="--c:${{ perfil:'#16807a', eq:'#2f6fa8', exp:'var(--amber)', fer:'#8e3b6a', freq:'var(--coral)', disc:'#a1341f', nov:'var(--cane)', cr:'#b5731a', mov:'#2f8a8a', pv:'#5a4fb0', alo:'#7a6a2a', env:'#24427c' }[k]}"><span class="gs-rf">${esc(PAINEL_G[k][0])}</span><b>${esc(PAINEL_G[k][1])}</b><strong>${n}</strong><small>${{ eq:'pessoas', exp:'vencendo em 15 dias', fer:'vencidas ou vencendo', freq:'com falta em 30 dias', disc:'com sanção em 12 meses', nov:'até 120 dias de casa', cr:'com crachá de treinamento', mov:'saídas em 90 dias', pv:'posições a contratar', alo:'alojados', perfil:'sem parecer da gestão', env:'devolvidos pelo RH' }[k]}</small><em>Abrir ›</em></button>`).join('')}</section>
      <p class="nr-fonte">Escolha um painel aqui ou no menu ao lado. Quadro de ${esc(brD(ref.quadro))}. Dúvidas ou correções: fale com a Gestão de Pessoas.</p>`;
      c.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => location.hash = b.dataset.ir); return; }
    const T = tabelas[aba](), nq = normal(q); const idx = T.lin.map((l, i) => i).filter(i => !nq || normal(T.lin[i].join(' ') + ' ' + ((T.mats && T.mats[i]) || (T.pess && T.pess[i] && T.pess[i].m) || '')).includes(nq));
    c.innerHTML = `<section class="dk-kpis gs-k" hidden>${ABAS.map(([k, t, n]) => `<button class="dk-k ${aba === k ? 'on' : ''}" data-a="${k}" style="--c:${{ perfil:'#16807a', eq:'#2f6fa8', exp:'var(--amber)', fer:'#8e3b6a', freq:'var(--coral)', disc:'#a1341f', nov:'var(--cane)', cr:'#b5731a', mov:'#2f8a8a', pv:'#5a4fb0', alo:'#7a6a2a', env:'#24427c' }[k]}"><span>${t}</span><b>${n}</b><small>${{ eq:'pessoas', exp:'vencendo em 15 dias', fer:'vencidas ou vencendo', freq:'com falta em 30 dias', disc:'com sanção em 12 meses', nov:'até 120 dias de casa', cr:'com crachá de treinamento', mov:'saídas em 90 dias', pv:'posições a contratar', alo:'alojados', perfil:'sem parecer da gestão', env:'devolvidos pelo RH' }[k]}</small></button>`).join('')}</section>
      ${extra()}
      <section class="dk-filtros cartao"><input id="gs-q" type="search" placeholder="Buscar nome, matrícula ou função" value="${esc(q)}"></section>
      <section class="fc-sec cartao gt-sec"><header><h3>${esc(T.t)}</h3><span class="gt-cnt">${idx.length} ${idx.length === 1 ? 'registro' : 'registros'}</span></header>${idx.length ? tabelaG(T, idx) : '<p class="fc-vz">Nada aqui.</p>'}</section>
      <p class="nr-fonte">Clique no nome para abrir a ficha do colaborador. Quadro de ${esc(brD(ref.quadro))}${ref.abs ? ' · faltas e atestados até ' + esc(brD(ref.abs)) : ''}${ref.exp ? ' · experiência de ' + esc(brD(ref.exp)) : ''}${ref.fer ? ' · férias de ' + esc(brD(ref.fer)) : ''}. Dúvidas ou correções: fale com a Gestão de Pessoas.</p>`;
    c.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { aba = b.dataset.a; desenhar(); });
    c.querySelectorAll('[data-f]').forEach(b => b.onclick = () => ficha(P.find(p => p.m === b.dataset.f)));
    c.querySelectorAll('[data-fq]').forEach(b => b.onclick = () => { const [k, v] = b.dataset.fq.split('|'); fq[k] = fq[k] === v ? '' : v; desenhar(); });
    c.querySelectorAll('[data-per]').forEach(b => b.onclick = () => { per = +b.dataset.per; desenhar(); });
    const lf = $('#gs-lf'); if (lf) lf.onclick = () => { fq.v = ''; fq.c = ''; desenhar(); };
    c.querySelectorAll('[data-av]').forEach(b => b.onclick = () => formExp(expL.find(p => p.m === b.dataset.av)));
    c.querySelectorAll('[data-pf]').forEach(b => b.onclick = () => formFer(ferL[+b.dataset.pf]));
    c.querySelectorAll('[data-ve]').forEach(b => b.onclick = () => verEnvio(ENV.find(e => e.id === b.dataset.ve), false));
    c.querySelectorAll('[data-cx]').forEach(b => b.onclick = async () => { if (b.dataset.conf !== '1') { b.dataset.conf = '1'; b.textContent = 'confirmar cancelamento'; return; }
      const { error } = await sb.from('gestor_envios').update({ status:'cancelado' }).eq('id', b.dataset.cx); if (error) { toast(traduzErro(error), true); return; } toast('Envio cancelado.'); await lerEnv(); desenhar(); });
    c.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => formSan(P.find(p => p.m === b.dataset.ps)));
    c.querySelectorAll('[data-pp]').forEach(b => b.onclick = () => formPerfil(P.find(p => p.m === b.dataset.pp)));
    const psn = $('#gs-psan'); if (psn) psn.onclick = () => formSan(null);
    const imf = $('#gs-impf'); if (imf) imf.onclick = () => imprimirFerias(ferL);
    const ime = $('#gs-impe'); if (ime) ime.onclick = () => imprimirAvaliacoes(expL);
    const i = $('#gs-q'); i.oninput = () => { q = i.value; clearTimeout(i._t); i._t = setTimeout(() => { desenhar(); const e = $('#gs-q'); if (e) { e.focus(); e.setSelectionRange(q.length, q.length); } }, 250); }; };
  function ficha(p){ if (!p) return;
    const casa = p.adm ? fDias(p.adm, h) : null, tc = casa == null ? '' : casa < 365 ? casa + ' dias' : Math.floor(casa / 365) + ' ano' + (casa >= 730 ? 's' : '') + (casa % 365 >= 30 ? ' e ' + Math.floor((casa % 365) / 30) + ' meses' : '');
    const tab = (cab, L, vz) => L.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr>${cab.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${L.map(l => `<tr>${l.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : `<p class="fc-vz">${vz}</p>`;
    const S = [
      ['Período de experiência', p.exp ? tab(['Etapa', 'Data', 'Avaliação da área'], [['1º vencimento', brD(p.exp.v1), p.exp.dec1 || 'pendente'], ['Vencimento final', brD(p.exp.v2), p.exp.dec2 || 'pendente']], '') : '<p class="fc-vz">Fora do período de experiência.</p>'],
      ['Frequência', tab(['', '30 dias', '90 dias', `${h.slice(0, 4)}`], [['Faltas', p.fa30, p.fa90, p.faAno || 0], ['Dias de atestado', '—', p.at90, p.atAno || 0]], '') + (ref.abs ? `<p class="nr-nota" style="padding:6px 14px">Até ${esc(brD(ref.abs))}. Motivo de atestado não aparece aqui.</p>` : '')],
      ['Histórico de ausências (sistema)', p.oh ? tab(['Ano', 'Dias de atestado', 'Faltas', 'Faltas justificadas', 'Dias de suspensão'], p.oh.y.map(x => [x[0] + (x[4] ? ' (' + x[4] + ')' : ''), x[5] || 0, x[1], x[2], x[3]]), '') + tab(['Últimos registros', 'Ocorrência', 'Dias'], p.oh.ep.map(e => [brD(e[0]) + (e[1] !== e[0] ? ' a ' + brD(e[1]) : ''), OCN[e[2]] + (e[4] ? ' (' + e[4] + ')' : ''), e[3]]), '') + '<p class="nr-nota" style="padding:6px 14px">Atestados (só os dias, sem o motivo) e lançamentos do ponto. Entre parênteses, a época em outra empresa do grupo.</p>' : '<p class="fc-vz">Nenhum atestado, falta ou suspensão no histórico do sistema.</p>'],
      ['Sanções disciplinares', tab(['Data', 'Tipo', 'Motivo'], (p.san || []).map(x => [brD(x.d), x.t, x.mot]), 'Nenhuma sanção registrada.')],
      ['Registros de dano (RD)', tab(['RD', 'Data', 'Desfecho', 'Tratativa'], (p.rd || []).map(x => [x.n, brD(x.d), x.des, x.tr]), 'Nenhum RD registrado.')],
      ['Férias', tab(['Período aquisitivo', 'Data limite', 'Saldo', 'Programação', 'Situação'], (p.fer || []).map(f => [brD(f.de) + ' a ' + brD(f.ate), brD(f.lim), f.saldo + 'd', f.prog || '—', f.st]), 'Sem período em aberto.')],
      ['Crachás de treinamento', tab(['Função', 'Início', 'Vencimento', 'Resultado'], (p.cr || []).map(x => [x.func, brD(x.ini), brD(x.fim), x.res || '—']), 'Nenhum crachá em andamento.')],
      ['Trajetória na empresa', tab(['Data', 'Mudança', 'De', 'Para'], (p.tr || []).map(x => [brD(x[0]), x[1] === 'd' ? 'Departamento' : 'Função', x[2], x[3]]), 'Nenhuma mudança de departamento ou função no histórico da folha.')]];
    if (p.ob) S.push(['Integração (novos)', `<p class="fc-vz">${p.ob.falta.length ? 'Pendente: ' + esc(p.ob.falta.join(', ')) : 'Checklist de admissão completo.'} · Conversas do RH: ${[30, 60, 90].filter(k => p.ob.conv.includes(k)).map(k => k + ' dias').join(', ') || 'nenhuma ainda'}</p>`]);
    const al = []; const L12 = s12(p);
    if (L12.length) al.push([L12.some(x => /^Sus/.test(x.t)) ? 'crit' : '', `${L12.length} sanç${L12.length > 1 ? 'ões' : 'ão'} nos últimos 12 meses`]);
    if (p.fa90 >= 3) al.push(['crit', `${p.fa90} faltas em 90 dias`]);
    if (p.exp && !p.exp.enc && [p.exp.v1, p.exp.v2].some(d => d && d >= h && d <= em15)) al.push(['', 'Experiência vencendo em até 15 dias']);
    abrirModal({ titulo:p.n + ' · Mat. ' + p.m, largo:true, corpo:`<div class="gs-fid"><div><small>Matrícula</small><b>${esc(p.m)}</b></div><div><small>Função</small><b>${esc(p.f)}</b></div><div><small>Departamento / seção</small><b>${esc(p.s)}</b></div><div><small>Setor</small><b>${esc(p.area || '')}</b></div>
        <div><small>Admissão</small><b>${esc(brD(p.adm))}</b></div><div><small>Tempo de casa</small><b>${esc(tc)}</b></div><div><small>Contrato</small><b>${esc(p.v)}</b></div><div><small>Situação</small><b>${esc(p.sit)}</b></div><div><small>Cidade de residência</small><b>${esc(p.cid || '—')}</b></div><div><small>Alojamento</small><b>${esc(p.alo ? p.alo.casa + (p.alo.q ? ', quarto ' + p.alo.q : '') + (p.alo.orig ? ' · origem ' + p.alo.orig : '') : 'Não alojado')}</b></div></div>
      ${al.length ? `<div class="fc-al" style="margin:10px 0 0">${al.map(a => `<span class="fc-a ${a[0]}">${esc(a[1])}</span>`).join('')}</div>` : ''}
      <div class="gs-fs">${S.map(([t, hh]) => `<section class="fc-sec cartao"><header><h3>${esc(t)}</h3></header>${hh}</section>`).join('')}</div>
      <p class="nr-nota" style="padding:8px 0 0">Para decidir sobre experiência ou desligamento, converse com a Gestão de Pessoas: o RH confere o histórico completo e o registro de cada medida.</p>`,
      pe:`<button class="btn borda" id="gf-san">Pedir sanção</button><span style="flex:1"></span><button class="btn borda" id="gf-pdf">PDF da ficha</button><button class="btn prim" id="gf-x">Fechar</button>`,
      aoAbrir: m => { m.querySelector('#gf-x').onclick = fecharModal; m.querySelector('#gf-san').onclick = () => { fecharModal(); setTimeout(() => formSan(p), 60); }; m.querySelector('#gf-pdf').onclick = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' });
        cabecalhoPDF(doc, 'Perfil do Colaborador', p.n); let y = 100;
        doc.autoTable({ startY:y, body:[['Matrícula', p.m, 'Função', p.f], ['Departamento', p.s, 'Setor', p.area || ''], ['Admissão', brD(p.adm), 'Tempo de casa', tc], ['Contrato', p.v, 'Situação', p.sit], ['Cidade', p.cid || '—', 'Alojamento', p.alo ? p.alo.casa + (p.alo.q ? ', quarto ' + p.alo.q : '') : 'Não alojado']], styles:{ fontSize:8.5, cellPadding:3 }, columnStyles:{ 0:{ fontStyle:'bold', cellWidth:80 }, 2:{ fontStyle:'bold', cellWidth:80 } }, margin:{ left:30, right:30 } });
        const sec = (t, cab, L) => { y = doc.lastAutoTable.finalY + 16; if (y > 760) { doc.addPage(); y = 40; } doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 33, 61); doc.text(t, 30, y);
          doc.autoTable({ startY:y + 5, head:[cab], body:L.length ? L.map(l => l.map(String)) : [cab.map((_, i) => i ? '' : 'Nada registrado')], styles:{ fontSize:8, cellPadding:2.6, overflow:'linebreak' }, headStyles:{ fillColor:[36,66,124] }, margin:{ left:30, right:30 } }); };
        if (p.exp) sec('Período de experiência', ['Etapa', 'Data', 'Avaliação da área'], [['1º vencimento', brD(p.exp.v1), p.exp.dec1 || 'pendente'], ['Vencimento final', brD(p.exp.v2), p.exp.dec2 || 'pendente']]);
        sec('Frequência' + (ref.abs ? ' (até ' + brD(ref.abs) + ')' : ''), ['', '30 dias', '90 dias', h.slice(0, 4)], [['Faltas', p.fa30, p.fa90, p.faAno || 0], ['Dias de atestado', '—', p.at90, p.atAno || 0]]);
        if (p.oh) { sec('Histórico de ausências (por ano)', ['Ano', 'Dias de atestado', 'Faltas', 'Faltas justificadas', 'Dias de suspensão'], p.oh.y.map(x => [x[0] + (x[4] ? ' (' + x[4] + ')' : ''), x[5] || 0, x[1], x[2], x[3]])); sec('Últimos registros', ['Período', 'Ocorrência', 'Dias'], p.oh.ep.map(e => [brD(e[0]) + (e[1] !== e[0] ? ' a ' + brD(e[1]) : ''), OCN[e[2]] + (e[4] ? ' (' + e[4] + ')' : ''), e[3]])); }
        sec('Sanções disciplinares', ['Data', 'Tipo', 'Motivo'], (p.san || []).map(x => [brD(x.d), x.t, x.mot]));
        sec('Registros de dano (RD)', ['RD', 'Data', 'Desfecho', 'Tratativa'], (p.rd || []).map(x => [x.n, brD(x.d), x.des, x.tr]));
        sec('Férias', ['Período aquisitivo', 'Data limite', 'Saldo', 'Programação', 'Situação'], (p.fer || []).map(f => [brD(f.de) + ' a ' + brD(f.ate), brD(f.lim), f.saldo + 'd', f.prog || '—', f.st]));
        sec('Trajetória na empresa', ['Data', 'Mudança', 'De', 'Para'], (p.tr || []).map(x => [brD(x[0]), x[1] === 'd' ? 'Departamento' : 'Função', x[2], x[3]]));
        rodapePDF(doc); baixar(doc.output('blob'), 'Ficha ' + p.n + '.pdf'); }; } });
  }
  const enviar = async (tipo, p, dados, assin) => {
    const row = { id:(crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)), chave:chaveDe(p.m), tipo, mat:p.m, colaborador:p.n, dados, assinatura:assin, status:'enviado', autor:E.perfil.user_id, autor_nome:E.perfil.nome, criado_em:new Date().toISOString() };
    const { error } = await sb.from('gestor_envios').insert(row); if (error) throw error; try { window.CRV_LOG_ACESSO && window.CRV_LOG_ACESSO('enviou', TIPO_ENV[tipo] || tipo, p.n + ' (' + p.m + ')'); } catch(_){} await lerEnv(); return row; };
  const lerAss = (m, pref) => { const nm = m.querySelector('#' + pref + '-nm').value.trim(), ok = m.querySelector('#' + pref + '-dec').checked;
    if (!ok) return [null, 'Marque a declaração de autorização.']; if (!assinaturaOk(nm, E.perfil.nome)) return [null, 'A assinatura precisa ser o seu nome completo, como no seu acesso: ' + E.perfil.nome + '.'];
    const as = ASSIST(); if (as) return [{ nome:nm, em:new Date().toISOString(), usuario:E.perfil.usuario || '', assistente:true, gestorResp:tcN(as.nome), gestorRespId:as.id, declaracao:'Preenchido por ' + nm + ', assistente, com autorização do gestor responsável ' + tcN(as.nome) + '. Declaro que as informações estão corretas e autorizo a Gestão de Pessoas a dar continuidade.' }, ''];
    return [{ nome:nm, em:new Date().toISOString(), usuario:E.perfil.usuario || '', declaracao:'Declaro que as informações estão corretas e autorizo a Gestão de Pessoas a dar continuidade.' }, '']; };
  function formExp(p){ if (!p) return; const et = etapaExp(p.exp, h); if (!et) return; const lim = prazoEnc(et.venc), tarde = h > lim, venceu = h > et.venc;
    abrirModal({ titulo:`Avaliação de experiência · ${p.n}`, largo:true, corpo:`<div class="gs-fid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><small>Função</small><b>${esc(p.f)}</b></div><div><small>Etapa</small><b>${esc(et.t)}</b></div><div><small>Vencimento</small><b>${esc(brD(et.venc))}</b></div><div><small>Admissão</small><b>${esc(brD(p.adm))}</b></div><div><small>Faltas no ano · sanções</small><b>${p.faAno || 0} · ${(p.san || []).length}</b></div><div><small>Encerramento: enviar até</small><b class="${tarde ? 'nr-atr' : ''}">${esc(brD(lim))}</b></div></div>
      ${venceu ? '<p class="gs-avi crit">O contrato já venceu. Fale com a Gestão de Pessoas antes de enviar.</p>' : tarde ? '<p class="gs-avi">Passou do prazo para encerrar (5 dias antes do vencimento). Ainda dá para enviar Efetivar ou Prorrogar; para encerrar, fale com a Gestão de Pessoas.</p>' : ''}
      <h4 class="gs-h4">Fatores avaliados <small>(formulário ${FORM_COD}: nota de 0 a 5)</small></h4>
      <div class="gs-fat">${FAT.map(([a, d], i) => `<div class="gs-fr"><div><b>${i + 1}. ${esc(a)}</b><small>${esc(d)}</small></div><div class="gs-nt">${[0, 1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="cr${i}" value="${n}"><span>${n}</span></label>`).join('')}${i === FAT.length - 1 ? `<label class="na"><input type="radio" name="cr${i}" value="na"><span>não se aplica</span></label>` : ''}</div><em id="ae-pt${i}"></em></div>`).join('')}</div>
      <div class="gs-sc"><div><small>Meta</small><b>70%</b></div><div><small>% atingido</small><b id="ae-pct">—</b></div><div><small>Total de pontos</small><b id="ae-tot">—</b></div><span id="ae-fx"></span></div>
      <h4 class="gs-h4">Decisão</h4><div class="gs-dec">${DECG.map(([k, t, d]) => `<label class="${k === 'encerrar' && (tarde || venceu) ? 'off' : ''}"><input type="radio" name="dec" value="${k}" ${k === 'encerrar' && (tarde || venceu) ? 'disabled' : ''}><b>${t}</b><small>${d}</small></label>`).join('')}</div>
      <label class="gs-obs">Comentário (o que justifica a decisão)<textarea id="ae-obs" rows="3" maxlength="1200"></textarea></label>
      ${blocoAssinatura('ae', E.perfil.nome)}<p class="nr-msg" id="ae-msg"></p>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="ae-c">Cancelar</button><button class="btn prim" id="ae-ok">Assinar e enviar ao RH</button>`,
      aoAbrir: m => { m.querySelector('#ae-c').onclick = fecharModal;
        const lerN = () => FAT.map((_, i) => { const v = (m.querySelector(`input[name=cr${i}]:checked`) || {}).value; return v === undefined ? undefined : v === 'na' ? null : +v; });
        const atual = () => { const n = lerN(), c = calcNotas(n.map(x => x === undefined ? null : x)); n.forEach((x, i) => { m.querySelector('#ae-pt' + i).textContent = x == null ? '' : (x * 2) + ' pts'; });
          m.querySelector('#ae-pct').textContent = pctTxt(c.pct); m.querySelector('#ae-tot').textContent = c.tot == null ? '—' : c.tot.toFixed(1).replace('.', ','); const f = faixa(c.pct); const fx = m.querySelector('#ae-fx'); fx.className = 'gs-fx ' + f[0]; fx.textContent = f[1]; };
        m.querySelectorAll('.gs-fat input').forEach(i => i.onchange = atual);
        m.querySelector('#ae-ok').onclick = async () => { const msg = t => m.querySelector('#ae-msg').textContent = t;
        const notas = lerN(); if (notas.some(x => x === undefined)) return msg('Dê uma nota de 0 a 5 em todos os fatores.');
        const { tot, pct } = calcNotas(notas); const crit = FAT.map(([a], i) => [a, notas[i] == null ? 'não se aplica' : notas[i] + ' (' + notas[i] * 2 + ' pts)']);
        const dec = (m.querySelector('input[name=dec]:checked') || {}).value; if (!dec) return msg('Escolha a decisão.');
        if (dec === 'encerrar' && h > lim) return msg('Fora do prazo para encerramento. Fale com a Gestão de Pessoas.');
        const obs = m.querySelector('#ae-obs').value.trim(); if ((dec === 'encerrar' || dec === 'prorrogar') && obs.length < 10) return msg('Escreva o comentário que justifica a decisão.');
        const [ass, e] = lerAss(m, 'ae'); if (!ass) return msg(e);
        const b = m.querySelector('#ae-ok'); b.disabled = true;
        try { const row = await enviar('experiencia', p, { ref:et.k + '|' + et.venc, etapa:et.k, etapaT:et.t, venc:et.venc, decisao:dec, crit, notas, tot, pct, form:FORM_COD, obs, funcao:p.f, secao:p.s, adm:p.adm, prazoEnc:lim }, ass); fecharModal(); toast('Avaliação enviada ao RH.'); desenhar(); verEnvio(row, false); } catch(er){ msg(traduzErro(er)); b.disabled = false; } }; } });
  }
  async function formFer(f){ if (!f) return; const p = f.p, mi = minInicioFerias(h);
    let CAL = null; try { const L = window.CRV_FER_DATAS ? await window.CRV_FER_DATAS() : null; CAL = L && L.length ? L : null; } catch(_){}
    const LIB = CAL ? CAL.filter(c => c.ini >= mi) : [];   // gestor só escolhe nas datas liberadas; outra data, só o RH no painel Férias
    abrirModal({ titulo:`Programar férias · ${p.n}`, largo:true, corpo:`<div class="gs-fid" style="grid-template-columns:repeat(4,minmax(0,1fr))"><div><small>Período aquisitivo</small><b>${esc(brD(f.de))} a ${esc(brD(f.ate))}</b></div><div><small>Data limite</small><b>${esc(brD(f.lim))}</b></div><div><small>Saldo</small><b>${f.saldo} dias</b></div><div><small>Início mais cedo possível</small><b>${esc(brD(mi))}</b></div></div>
      <p class="nr-nota" style="padding:8px 0 0">Até 3 parcelas: uma com pelo menos 14 dias e as outras com pelo menos 5. Férias de um mês precisam ser enviadas até o dia 15 do mês anterior. <b>O início só pode ser numa das datas liberadas pelo RH.</b> Outra data, só o RH pode lançar, com autorização.</p>${!LIB.length ? '<div class="gs-avi crit">' + (CAL ? 'Ainda não há datas liberadas pelo RH a partir de ' + esc(brD(mi)) + '.' : 'Não consegui carregar o calendário de datas liberadas.') + ' Fale com o RH.</div>' : ''}
      <div class="gs-parc" id="pf-l"></div><button class="btn borda peq" id="pf-add">+ Parcela</button>
      <label class="gs-chk"><input type="checkbox" id="pf-ab"> Abono pecuniário: vender 10 dias (o colaborador precisa pedir)</label>
      <label class="gs-obs">Observação<textarea id="pf-obs" rows="2" maxlength="600"></textarea></label>
      <div id="pf-res" class="gs-avi" hidden></div>${blocoAssinatura('pf', E.perfil.nome)}<p class="nr-msg" id="pf-msg"></p>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="pf-c">Cancelar</button><button class="btn prim" id="pf-ok">Assinar e enviar ao RH</button>`,
      aoAbrir: m => { let L = [{ inicio:'', dias:Math.min(30, f.saldo) }];
        const pint = () => { m.querySelector('#pf-l').innerHTML = L.map((x, i) => `<div><b>${i + 1}ª parcela</b><label>Início ${true ? `<select data-i="${i}" data-k="inicio"><option value="">Escolha</option>${LIB.map(c => `<option value="${c.ini}" ${c.ini === x.inicio ? 'selected' : ''}>${esc(brD(c.ini))}${c.pag ? ' · pagamento ' + esc(brD(c.pag)) : ''}</option>`).join('')}</select>` : `<input type="date" data-i="${i}" data-k="inicio" min="${mi}" value="${esc(x.inicio)}">`}</label><label>Dias <input type="number" data-i="${i}" data-k="dias" min="5" max="30" value="${x.dias}"></label><span>${x.inicio && x.dias ? 'até ' + esc(brD(addD(x.inicio, +x.dias - 1))) : ''}</span>${L.length > 1 ? `<button class="link" data-rm="${i}">remover</button>` : ''}</div>`).join('');
          m.querySelectorAll('#pf-l input,#pf-l select').forEach(i => i.oninput = i.onchange = () => { L[+i.dataset.i][i.dataset.k] = i.dataset.k === 'dias' ? +i.value : i.value; checar(); if (i.dataset.k === 'inicio' || i.type === 'number') { const sp = i.parentNode.parentNode.querySelector('span'); const x = L[+i.dataset.i]; sp.textContent = x.inicio && x.dias ? 'até ' + brD(addD(x.inicio, +x.dias - 1)) : ''; } });
          m.querySelectorAll('#pf-l [data-rm]').forEach(b => b.onclick = () => { L.splice(+b.dataset.rm, 1); pint(); checar(); });
          m.querySelector('#pf-add').style.display = L.length >= 3 ? 'none' : ''; };
        const problemas = () => { const ab = m.querySelector('#pf-ab').checked ? 10 : 0, tot = L.reduce((t, x) => t + (+x.dias || 0), 0), w = [];
          if (L.some(x => !x.inicio)) w.push('Informe o início de cada parcela.');
          if (L.some(x => x.inicio && !LIB.some(c => c.ini === x.inicio))) w.push('O início precisa ser uma das datas liberadas pelo RH. Outra data, só o RH pode lançar.');
          if (L.some(x => x.inicio && x.inicio < mi)) w.push(`Fora do prazo: o início mais cedo possível hoje é ${brD(mi)} (envio até o dia 15 do mês anterior).`);
          if (tot + ab > f.saldo) w.push(`A soma (${tot} dias${ab ? ' + 10 de abono' : ''}) passa do saldo de ${f.saldo} dias.`);
          if (L.length > 1 && !L.some(x => +x.dias >= 14)) w.push('Uma das parcelas precisa ter pelo menos 14 dias.');
          if (L.some(x => +x.dias < 5)) w.push('Cada parcela precisa ter pelo menos 5 dias.');
          const S = L.filter(x => x.inicio).slice().sort((a, b) => a.inicio.localeCompare(b.inicio)); for (let i = 1; i < S.length; i++) if (S[i].inicio <= addD(S[i - 1].inicio, +S[i - 1].dias - 1)) w.push('As parcelas se sobrepõem.');
          const aviso = L[0] && L[0].inicio && f.lim && L.slice().sort((a, b) => a.inicio.localeCompare(b.inicio))[0].inicio > f.lim ? `O início passa da data limite (${brD(f.lim)}): o RH vai avaliar.` : '';
          return { w, aviso, ab, tot }; };
        const checar = () => { const r = problemas(), el = m.querySelector('#pf-res'); const t = r.w.concat(r.aviso ? [r.aviso] : []); el.hidden = !t.length; el.innerHTML = t.map(esc).join('<br>'); el.classList.toggle('crit', !!r.w.length); };
        m.querySelector('#pf-add').onclick = () => { L.push({ inicio:'', dias:5 }); pint(); checar(); }; m.querySelector('#pf-ab').onchange = checar;
        pint(); checar(); m.querySelector('#pf-c').onclick = fecharModal;
        m.querySelector('#pf-ok').onclick = async () => { const msg = t => m.querySelector('#pf-msg').textContent = t; const r = problemas(); if (r.w.length) return msg(r.w[0]);
          const [ass, e] = lerAss(m, 'pf'); if (!ass) return msg(e); const b = m.querySelector('#pf-ok'); b.disabled = true;
          const parc = L.slice().sort((a, b) => a.inicio.localeCompare(b.inicio)).map(x => ({ inicio:x.inicio, dias:+x.dias, fim:addD(x.inicio, +x.dias - 1) }));
          try { const row = await enviar('ferias', p, { ref:f.de, de:f.de, ate:f.ate, lim:f.lim, saldo:f.saldo, parcelas:parc, abono:r.ab, obs:m.querySelector('#pf-obs').value.trim(), funcao:p.f, secao:p.s, foraLimite:!!r.aviso }, ass); fecharModal(); toast('Programação enviada ao RH.'); desenhar(); verEnvio(row, false); } catch(er){ msg(traduzErro(er)); b.disabled = false; } }; } });
  }
  function formPerfil(p){ if (!p || !p.pf) return; const x = p.pf, pr = x.par || { acoes:[], txt:'', resp:'' };
    abrirModal({ titulo:`Perfil profissional · ${p.n}`, largo:true, corpo:`<div class="gs-fid" style="grid-template-columns:repeat(5,minmax(0,1fr))"><div><small>Atestados</small><b>${x.atest}</b></div><div><small>Faltas</small><b>${x.falta}${x.fj ? ' <small style="font-weight:500">+ ' + x.fj + ' just.</small>' : ''}</b></div><div><small>Advertências</small><b>${x.adv}</b></div><div><small>Suspensões</small><b>${x.susp}</b></div><div><small>Função</small><b>${esc(p.f)}</b></div></div>
      <p class="nr-nota" style="padding:6px 0 0">Números do levantamento do RH (últimos 12 meses). A decisão sobre cada caso é da gestão direta; o RH apoia e registra.</p>
      <h4 class="gs-h4">Ação da gestão <small>(marque uma ou mais)</small></h4><div class="gs-dec">${ACOES_PF.map(a => `<label><input type="checkbox" name="pp-a" value="${esc(a)}" ${pr.acoes.includes(a) ? 'checked' : ''}><b>${esc(a)}</b></label>`).join('')}</div>
      <label class="gs-obs">Observações, prazos e responsáveis<textarea id="pp-txt" rows="5" maxlength="2500" placeholder="Ex.: feedback formal até 15/11 com o líder da frente; acompanhar faltas por 60 dias; reavaliar em janeiro.">${esc(pr.txt || '')}</textarea></label>
      <label class="gs-obs">Responsável pelo acompanhamento<input id="pp-resp" maxlength="120" value="${esc(pr.resp || E.perfil.nome)}"></label>
      <div id="pp-av" class="gs-avi crit" hidden>Desligamento marcado: o RH vai conferir estabilidade, processos e o histórico antes de qualquer passo.</div>
      ${blocoAssinatura('pp', E.perfil.nome)}<p class="nr-msg" id="pp-msg"></p>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="pp-c">Cancelar</button><button class="btn prim" id="pp-ok">Assinar e enviar ao RH</button>`,
      aoAbrir: m => { const g = id => m.querySelector('#' + id), sel = () => [...m.querySelectorAll('input[name=pp-a]:checked')].map(i => i.value);
        const av = () => { g('pp-av').hidden = !sel().includes('Desligamento'); }; m.querySelectorAll('input[name=pp-a]').forEach(i => i.onchange = av); av(); g('pp-c').onclick = fecharModal;
        g('pp-ok').onclick = async () => { const msg = t => g('pp-msg').textContent = t, A2 = sel(), txt = g('pp-txt').value.trim();
          if (!A2.length) return msg('Marque pelo menos uma ação da gestão.'); if (txt.length < 15) return msg('Escreva as observações, com prazo e responsável.');
          const [a, e] = lerAss(m, 'pp'); if (!a) return msg(e); const b = g('pp-ok'); b.disabled = true;
          try { const row = await enviar('perfil', p, { ref:hoje(), acoes:A2, txt, resp:g('pp-resp').value.trim(), funcao:p.f, secao:p.s, nums:{ atest:x.atest, falta:x.falta, fj:x.fj, adv:x.adv, susp:x.susp } }, a); fecharModal(); toast('Parecer enviado ao RH.'); desenhar(); verEnvio(row, false); } catch(er){ msg(traduzErro(er)); b.disabled = false; } }; } });
  }
  function formSan(p0){ const ops = P.filter(p => p.sit !== 'Desligado');
    abrirModal({ titulo:'Pedido de sanção disciplinar', largo:true, corpo:`<p class="nr-nota" style="padding:0">O RH analisa os fatos e o histórico, define a medida e emite o documento para o colaborador assinar. O pedido sozinho não vale como sanção.</p>
      <label class="gs-obs">Buscar colaborador por nome ou matrícula<input id="ps-q" type="search" autocomplete="off" placeholder="Digite o nome ou a matrícula" value="${p0 ? esc(p0.m) : ''}"></label>
      <div class="gs-psl" id="ps-l"></div><input type="hidden" id="ps-p" value="${p0 ? esc(p0.m) : ''}">
      <div id="ps-hist" class="gs-ph" hidden></div>
      <h4 class="gs-h4">Medida sugerida</h4><div class="gs-dec">${Object.entries(SANC).map(([k, [t, d]]) => `<label><input type="radio" name="ps-t" value="${k}"><b>${t}</b><small>${d}</small></label>`).join('')}</div>
      <div class="gs-sang"><label class="gs-obs" id="ps-dw" hidden>Dias de suspensão<input type="number" id="ps-dias" min="1" max="30" inputmode="numeric"></label><label class="gs-obs">Data do ocorrido<input type="date" id="ps-data" max="${h}"></label><label class="gs-obs">Horário aproximado<input type="time" id="ps-hora"></label><label class="gs-obs">Local, frota ou frente<input id="ps-local" maxlength="120"></label></div>
      <div id="ps-av" class="gs-avi" hidden></div>
      <label class="gs-obs">Assunto (uma linha)<input id="ps-ass" maxlength="140" placeholder="Ex.: Ausência sem justificativa no turno da noite"></label>
      <label class="gs-obs">Descrição completa dos fatos<textarea id="ps-desc" rows="7" maxlength="5000" placeholder="Em ordem: o que aconteceu, quando e onde; o que o colaborador fez ou deixou de fazer; como você soube ou constatou; qual norma, procedimento ou orientação foi descumprida; consequências (risco, dano, prejuízo, atraso); o que o colaborador disse sobre o fato."></textarea><small class="gs-cnt" id="ps-cnt"></small></label>
      <label class="gs-obs">Testemunhas (nome e função)<input id="ps-test" maxlength="300" placeholder="Opcional"></label>
      <label class="gs-obs">O colaborador já tinha sido orientado sobre isso?<select id="ps-ant"><option value="">Não informado</option><option>Sim, verbalmente</option><option>Sim, por escrito</option><option>Não</option></select></label>
      ${blocoAssinatura('ps', E.perfil.nome)}<p class="nr-msg" id="ps-msg"></p>`,
      pe:`<span style="flex:1"></span><button class="btn borda" id="ps-c">Cancelar</button><button class="btn prim" id="ps-ok">Assinar e enviar ao RH</button>`,
      aoAbrir: m => { const g = id => m.querySelector('#' + id); g('ps-c').onclick = fecharModal;
        const pes = () => P.find(p => p.m === g('ps-p').value);
        const hist = () => { const p = pes(), w = g('ps-hist'); if (!p) { w.hidden = true; return; } const L = s12(p), ped = ENV.filter(e => e.tipo === 'sancao' && e.mat === p.m && e.status === 'enviado');
          w.hidden = false; w.innerHTML = `<b>Histórico de ${esc(p.n.split(' ')[0])}</b> · ${esc(p.f)} · admissão ${esc(brD(p.adm))}${p.exp && !p.exp.enc ? ' · <b>em experiência</b>' : ''}<br>${L.length ? `${L.length} sanç${L.length > 1 ? 'ões' : 'ão'} nos últimos 12 meses: ${L.slice(0, 4).map(x => esc(brD(x.d) + ' ' + x.t)).join('; ')}` : 'Nenhuma sanção nos últimos 12 meses.'} · ${p.fa90 || 0} falta${p.fa90 === 1 ? '' : 's'} em 90 dias${(p.rd || []).length ? ' · ' + p.rd.length + ' RD' : ''}${ped.length ? `<br><b class="nr-atr">Já existe ${ped.length > 1 ? ped.length + ' pedidos' : 'um pedido'} deste colaborador aguardando o RH.</b>` : ''}`; };
        const tipo = () => (m.querySelector('input[name=ps-t]:checked') || {}).value;
        const avisos = () => { const w = [], dt = g('ps-data').value;
          if (dt && dt <= h) { const n = fDias(dt, h); if (n > 7) w.push(`O fato foi há ${n} dias. Quanto mais tempo entre o fato e a medida, maior o risco de a sanção ser questionada (imediatidade). Envie o quanto antes.`); }
          const av = g('ps-av'); av.hidden = !w.length; av.textContent = w.join(' '); };
        m.querySelectorAll('input[name=ps-t]').forEach(i => i.onchange = () => { g('ps-dw').hidden = tipo() !== 'sus'; });
        const lista = () => { const nq = normal(g('ps-q').value.trim()), mq = g('ps-q').value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''), sel = g('ps-p').value;
          const L = nq ? ops.filter(p => normal(p.n).includes(nq) || (mq && String(p.m).includes(mq))) : ops;
          if (L.length === 1 && L[0].m !== sel) { g('ps-p').value = L[0].m; hist(); }
          g('ps-l').innerHTML = L.length ? L.slice(0, 40).map(p => `<button type="button" class="gs-pso ${p.m === g('ps-p').value ? 'on' : ''}" data-m="${esc(p.m)}"><b>${esc(p.n)}</b><span>${esc(p.m)} · ${esc(p.f)}${p.s ? ' · ' + esc(p.s) : ''}</span></button>`).join('') + (L.length > 40 ? `<small class="gs-cnt">Mostrando 40 de ${L.length}. Digite mais para filtrar.</small>` : '') : '<small class="gs-cnt">Ninguém da sua equipe com esse nome ou matrícula.</small>';
          g('ps-l').querySelectorAll('[data-m]').forEach(b => b.onclick = () => { g('ps-p').value = b.dataset.m; const p = pes(); g('ps-q').value = p ? p.n : ''; hist(); lista(); }); };
        g('ps-q').oninput = lista; g('ps-data').onchange = avisos; lista(); hist(); if (!p0) setTimeout(() => g('ps-q').focus(), 60);
        g('ps-desc').oninput = () => { const n = g('ps-desc').value.trim().length; g('ps-cnt').textContent = n < 80 ? `${n} caracteres · descreva com mais detalhes (mínimo 80)` : `${n} caracteres`; }; g('ps-desc').oninput();
        g('ps-ok').onclick = async () => { const msg = t => g('ps-msg').textContent = t; const p = pes(), t = tipo(), dt = g('ps-data').value, dias = +g('ps-dias').value, ass = g('ps-ass').value.trim(), desc = g('ps-desc').value.trim();
          if (!p) return msg('Escolha o colaborador.'); if (!t) return msg('Escolha a medida sugerida.');
          if (t === 'sus' && !(dias >= 1 && dias <= 30 && Number.isInteger(dias))) return msg('Informe os dias de suspensão (de 1 a 30).');
          if (!dt) return msg('Informe a data do ocorrido.'); if (dt > h) return msg('A data do ocorrido não pode ser no futuro.');
          if (ass.length < 5) return msg('Escreva o assunto em uma linha.'); if (desc.length < 80) return msg('Descreva os fatos com mais detalhes (mínimo 80 caracteres).');
          const [a, e] = lerAss(m, 'ps'); if (!a) return msg(e); const b = g('ps-ok'); b.disabled = true; const L = s12(p);
          try { const row = await enviar('sancao', p, { ref:dt, tipo:t, tipoT:SANC[t][0], dias:t === 'sus' ? dias : null, data:dt, hora:g('ps-hora').value, local:g('ps-local').value.trim(), assunto:ass, desc, test:g('ps-test').value.trim(), ant:g('ps-ant').value, funcao:p.f, secao:p.s, adm:p.adm, exp:!!(p.exp && !p.exp.enc), hist:{ s12:L.length, ult:L.slice(0, 5).map(x => brD(x.d) + ' ' + x.t), fa90:p.fa90 || 0 } }, a);
            fecharModal(); toast('Pedido de sanção enviado ao RH.'); desenhar(); verEnvio(row, false); } catch(er){ msg(traduzErro(er)); b.disabled = false; } }; } });
  }
  function imprimirFerias(L){ const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Programação de férias da equipe', A.map(a => a.nome).join(', ') + ' · prazo: até o dia 15 do mês anterior');
    doc.autoTable({ startY:104, head:[['Colaborador', 'Matrícula', 'Função', 'Período aquisitivo', 'Data limite', 'Saldo', '1ª parcela (início / dias)', '2ª parcela', '3ª parcela', 'Abono', 'Ciente do colaborador']], body:L.map(f => [f.p.n, f.p.m, f.p.f, brD(f.de) + ' a ' + brD(f.ate), brD(f.lim), f.saldo + 'd', f.prog || '', '', '', '', '']), margin:{ left:24, right:24 }, styles:{ fontSize:7.5, cellPadding:4, minCellHeight:20 }, headStyles:{ fillColor:[36,66,124] }, columnStyles:{ 0:{ cellWidth:130 }, 9:{ cellWidth:90 } } });
    const y = Math.min(doc.lastAutoTable.finalY + 40, 560); doc.setDrawColor(120); doc.line(60, y, 300, y); doc.line(480, y, 720, y); doc.setFontSize(8.5); doc.setTextColor(60, 70, 90);
    doc.text(ASSIST() ? 'Gestor da área: ' + tcN(ASSIST().nome) + ' · preenchido por ' + E.perfil.nome : 'Gestor da área: ' + E.perfil.nome, 60, y + 12); doc.text('Data: ____/____/______', 480, y + 12);
    rodapePDF(doc); baixar(doc.output('blob'), 'Programação de férias da equipe.pdf'); }
  function imprimirAvaliacoes(L){ const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' }); let first = true;
    L.forEach(p => { const et = etapaExp(p.exp, h); if (!et) return; if (!first) doc.addPage(); first = false;
      cabecalhoPDF(doc, 'Avaliação de experiência', p.n);
      doc.autoTable({ startY:100, body:[['Matrícula', p.m, 'Função', p.f], ['Seção', p.s, 'Admissão', brD(p.adm)], ['Etapa', et.t, 'Vencimento', brD(et.venc)], ['Encerramento: enviar até', brD(prazoEnc(et.venc)), 'Faltas no ano / sanções', (p.faAno || 0) + ' / ' + (p.san || []).length]], styles:{ fontSize:8.5, cellPadding:3 }, columnStyles:{ 0:{ fontStyle:'bold', cellWidth:110 }, 2:{ fontStyle:'bold', cellWidth:110 } }, margin:{ left:30, right:30 } });
      doc.setFontSize(8); doc.setTextColor(93, 106, 133); doc.text('Formulário ' + FORM_COD + ' · marque um X na nota de cada fator. Pontos = nota × 2; total = média; meta 70%.', 30, doc.lastAutoTable.finalY + 12);
      doc.autoTable({ startY:doc.lastAutoTable.finalY + 18, head:[['Nº', 'Fator', '0', '1', '2', '3', '4', '5', 'Pontos']], body:FAT.map(([a, dd], i) => [String(i + 1), a + '\n' + dd, '', '', '', '', '', '', '']), styles:{ fontSize:7.5, cellPadding:3, overflow:'linebreak' }, headStyles:{ fillColor:[46,138,87] }, columnStyles:{ 0:{ cellWidth:22 }, 1:{ cellWidth:300 } }, margin:{ left:30, right:30 } });
      { const yy = doc.lastAutoTable.finalY + 6; doc.setFontSize(8.5); doc.setTextColor(20, 33, 61); doc.text('Meta: 70%     % atingido: ________     Total de pontos: ________', 30, yy + 8); }
      let y = doc.lastAutoTable.finalY + 34; doc.setFontSize(10); doc.setTextColor(20, 33, 61); doc.setFont('helvetica', 'bold'); doc.text('Decisão:', 30, y); doc.setFont('helvetica', 'normal');
      DECG.forEach(([, t], i) => { doc.rect(100 + i * 150, y - 9, 10, 10); doc.text(t, 115 + i * 150, y); });
      y += 22; doc.text('Comentários do avaliador:', 30, y); for (let i = 1; i <= 3; i++) doc.line(30, y + i * 18, 565, y + i * 18);
      y += 80; doc.line(30, y, 280, y); doc.line(330, y, 565, y); doc.setFontSize(8.5); doc.text('Assinatura do gestor', 30, y + 12); doc.text('Data', 330, y + 12); });
    if (first) { toast('Ninguém em experiência com avaliação a fazer.'); return; }
    rodapePDF(doc); baixar(doc.output('blob'), 'Avaliações de experiência em branco.pdf'); }
  const nome = 'Minha equipe ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  $('#gs-xls').onclick = () => { const wb = XLSX.utils.book_new(); (aba === 'resumo' ? Object.keys(tabelas) : [aba]).forEach(k => { const T = comMat(tabelas[k]()); const ws = XLSX.utils.aoa_to_sheet([T.cab, ...T.lin]); ws['!cols'] = T.cab.map((x, i) => ({ wch: i === 0 ? 34 : 18 })); XLSX.utils.book_append_sheet(wb, ws, T.t.replace(/[\\/?*[\]:]/g, '-').slice(0, 31)); });
    baixar(new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nome + '.xlsx'); };
  $('#gs-pdf').onclick = () => { const T0 = tabelas[aba === 'resumo' ? 'eq' : aba](), T = Object.assign({}, T0, comMat(T0)); const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4', orientation:'landscape' });
    cabecalhoPDF(doc, 'Minha equipe · ' + T.t, A.map(a => a.nome).join(', '));
    doc.autoTable({ startY:104, head:[T.cab], body:T.lin.map(l => l.map(String)), margin:{ left:30, right:30 }, styles:{ fontSize:8, cellPadding:3 }, headStyles:{ fillColor:[36,66,124] }, alternateRowStyles:{ fillColor:[244,246,250] } });
    rodapePDF(doc); baixar(doc.output('blob'), nome + ' ' + T.t + '.pdf'); };
  desenhar();
}
/* ---------- envios (gestor e RH) ---------- */
function resumoEnvio(e){ const d = e.dados || {};
  if (e.tipo === 'ferias') return (d.parcelas || []).map(x => brD(x.inicio) + ' (' + x.dias + 'd)').join(' + ') + (d.abono ? ' + abono 10d' : '');
  if (e.tipo === 'perfil') return (d.acoes || []).join(', ') + (d.resp ? ' · responsável ' + d.resp : '');
  if (e.tipo === 'sancao') return ((SANC[d.tipo] || [d.tipo])[0]) + (d.tipo === 'sus' ? ' de ' + d.dias + ' dia' + (d.dias > 1 ? 's' : '') : '') + ' · fato em ' + brD(d.data) + (d.assunto ? ' · ' + d.assunto : '');
  return (d.etapaT || '') + ': ' + ((DECG.find(x => x[0] === d.decisao) || [])[1] || d.decisao || ''); }
function verEnvio(e, rh, aposAcao){ if (!e) return; const d = e.dados || {}, a = e.assinatura || {};
  const det = e.tipo === 'perfil'
    ? `<div class="gs-fid" style="grid-template-columns:repeat(5,minmax(0,1fr))">${[['Atestados', 'atest'], ['Faltas', 'falta'], ['Just.', 'fj'], ['Advertências', 'adv'], ['Suspensões', 'susp']].map(([t, k]) => `<div><small>${t}</small><b>${esc((d.nums || {})[k] ?? '—')}</b></div>`).join('')}</div><p class="fc-vz">Ação da gestão: <b>${esc((d.acoes || []).join(', '))}</b>${d.resp ? '<br>Responsável: ' + esc(d.resp) : ''}</p><div class="gs-fatos">${esc(d.txt || '')}</div>`
    : e.tipo === 'sancao'
    ? `<div class="gs-fid" style="grid-template-columns:repeat(4,minmax(0,1fr))"><div><small>Medida sugerida</small><b>${esc((SANC[d.tipo] || [d.tipo])[0])}${d.tipo === 'sus' ? ' · ' + esc(d.dias) + ' dia' + (d.dias > 1 ? 's' : '') : ''}</b></div><div><small>Data do ocorrido</small><b>${esc(brD(d.data))}${d.hora ? ' · ' + esc(d.hora) : ''}</b></div><div><small>Local</small><b>${esc(d.local || '—')}</b></div><div><small>Já tinha sido orientado</small><b>${esc(d.ant || 'não informado')}</b></div></div>
       <p class="fc-vz"><b>${esc(d.assunto || '')}</b></p><div class="gs-fatos">${esc(d.desc || '')}</div>
       <p class="fc-vz">Testemunhas: ${esc(d.test || 'não informadas')}${d.hist ? `<br>Histórico no envio: ${d.hist.s12} sanç${d.hist.s12 === 1 ? 'ão' : 'ões'} em 12 meses${d.hist.ult && d.hist.ult.length ? ' (' + esc(d.hist.ult.join('; ')) + ')' : ''} · ${d.hist.fa90} falta${d.hist.fa90 === 1 ? '' : 's'} em 90 dias${d.exp ? ' · em experiência' : ''}` : ''}${rh ? `<br>Enviado ${fDias(d.data, String(e.criado_em).slice(0, 10))} dia(s) depois do fato.` : ''}</p>`
    : e.tipo === 'ferias'
    ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Parcela</th><th>Início</th><th>Fim</th><th>Dias</th></tr></thead><tbody>${(d.parcelas || []).map((x, i) => `<tr><td>${i + 1}ª</td><td>${esc(brD(x.inicio))}</td><td>${esc(brD(x.fim))}</td><td>${x.dias}</td></tr>`).join('')}</tbody></table></div><p class="fc-vz">Período aquisitivo ${esc(brD(d.de))} a ${esc(brD(d.ate))} · data limite ${esc(brD(d.lim))} · saldo ${d.saldo} dias${d.abono ? ' · abono de 10 dias' : ''}${d.foraLimite ? ' · <b class="nr-atr">início depois da data limite</b>' : ''}${d.obs ? '<br>Obs.: ' + esc(d.obs) : ''}</p>`
    : `<p class="fc-vz"><b>${esc(d.etapaT)}</b> · vencimento ${esc(brD(d.venc))} · encerramento até ${esc(brD(d.prazoEnc))}</p><div class="fc-tw"><table class="fc-t"><tbody>${(d.crit || []).map(([c, n]) => `<tr><td>${esc(c)}</td><td><b>${esc(n)}</b></td></tr>`).join('')}</tbody></table></div>
       ${d.pct != null ? `<div class="gs-sc"><div><small>Meta</small><b>70%</b></div><div><small>% atingido</small><b>${esc(pctTxt(d.pct))}</b></div><div><small>Total de pontos</small><b>${esc(d.tot.toFixed(1).replace('.', ','))}</b></div><span class="gs-fx ${faixa(d.pct)[0]}">${esc(faixa(d.pct)[1])}</span></div>` : ''}
       <p class="fc-vz">Decisão: <b>${esc((DECG.find(x => x[0] === d.decisao) || [])[1] || d.decisao)}</b>${d.obs ? '<br>Comentário: ' + esc(d.obs) : ''}</p>`;
  abrirModal({ titulo:(TIPO_ENV[e.tipo] || e.tipo) + ' · ' + (e.colaborador || e.mat), largo:true,
    corpo:`<div class="gs-env-h"><span class="gs-st ${STE[e.status][1]}">${STE[e.status][0]}</span><span>Matrícula ${esc(e.mat)}${d.funcao ? ' · ' + esc(d.funcao) : ''}${d.secao ? ' · ' + esc(d.secao) : ''}</span></div>${det}
      <div class="gs-ass-v"><b>Assinado eletronicamente por ${esc(a.nome || e.autor_nome || '')}${a.gestorResp ? ' (assistente)' : ''}</b>${a.gestorResp ? `<span><b>${esc(linhaResp(a))}</b></span>` : ''}<span>${esc(dataHora(a.em || e.criado_em))} · usuário ${esc(a.usuario || '')} · ${esc(e.autor_nome || '')}</span><small>${esc(a.declaracao || '')}</small></div>
      ${e.status !== 'enviado' && (e.rh_por || e.rh_obs) ? `<p class="fc-vz">${esc(STE[e.status][0])}${e.rh_por ? ' por ' + esc(e.rh_por) : ''}${e.rh_em ? ' em ' + esc(dataHora(e.rh_em)) : ''}${e.rh_obs ? '<br>Retorno do RH: ' + esc(e.rh_obs) : ''}</p>` : ''}
      ${rh && e.status === 'enviado' ? `<label class="gs-obs">Retorno ao gestor (obrigatório para devolver)<textarea id="rh-obs" rows="2" maxlength="600"></textarea></label><p class="nr-msg" id="rh-msg"></p>` : ''}`,
    pe:`<button class="btn borda" id="ev-pdf">PDF</button><span style="flex:1"></span>${rh && e.status === 'enviado' ? '<button class="btn perigo" id="rh-dev">Devolver ao gestor</button><button class="btn prim" id="rh-ok">' + (e.tipo === 'sancao' ? 'Aceitar e encaminhar para emissão' : 'Aceitar e lançar') + '</button>' : '<button class="btn prim" id="ev-x">Fechar</button>'}`,
    aoAbrir: m => { const x = m.querySelector('#ev-x'); if (x) x.onclick = fecharModal; m.querySelector('#ev-pdf').onclick = () => pdfEnvio(e);
      const ok = m.querySelector('#rh-ok'); if (ok) ok.onclick = async () => { ok.disabled = true; try { await aceitar(e, m.querySelector('#rh-obs').value.trim()); fecharModal(); toast(e.tipo === 'sancao' ? 'Aceito. O pedido está no painel Sanções, em Pedidos dos gestores, para emitir o documento.' : 'Lançado no painel e devolvido como aceito ao gestor.'); aposAcao && aposAcao(); } catch(er){ m.querySelector('#rh-msg').textContent = traduzErro(er); ok.disabled = false; } };
      const dv = m.querySelector('#rh-dev'); if (dv) dv.onclick = async () => { const o = m.querySelector('#rh-obs').value.trim(); if (o.length < 5) { m.querySelector('#rh-msg').textContent = 'Escreva o motivo da devolução.'; return; }
        const { error } = await sb.from('gestor_envios').update({ status:'devolvido', rh_obs:o, rh_em:new Date().toISOString(), rh_por:E.perfil.nome }).eq('id', e.id); if (error) { m.querySelector('#rh-msg').textContent = traduzErro(error); return; } fecharModal(); toast('Devolvido ao gestor.'); aposAcao && aposAcao(); }; } });
}
function pdfEnvio(e){ const d = e.dados || {}, a = e.assinatura || {}; const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' });
  cabecalhoPDF(doc, TIPO_ENV[e.tipo] || e.tipo, e.colaborador || e.mat);
  doc.autoTable({ startY:100, body:[['Colaborador', e.colaborador || '', 'Matrícula', e.mat], ['Função', d.funcao || '', 'Seção', d.secao || ''], ['Situação do envio', STE[e.status][0], 'Enviado em', dataHora(e.criado_em)]], styles:{ fontSize:8.5, cellPadding:3 }, columnStyles:{ 0:{ fontStyle:'bold', cellWidth:100 }, 2:{ fontStyle:'bold', cellWidth:100 } }, margin:{ left:30, right:30 } });
  if (e.tipo === 'perfil') { doc.autoTable({ startY:doc.lastAutoTable.finalY + 10, body:[['Atestados / faltas', ((d.nums || {}).atest ?? '') + ' / ' + ((d.nums || {}).falta ?? ''), 'Advertências / suspensões', ((d.nums || {}).adv ?? '') + ' / ' + ((d.nums || {}).susp ?? '')], ['Ação da gestão', (d.acoes || []).join(', '), 'Responsável', d.resp || '']], styles:{ fontSize:9, cellPadding:4 }, margin:{ left:30, right:30 } });
    doc.autoTable({ startY:doc.lastAutoTable.finalY + 10, head:[['Observações, prazos e responsáveis']], body:[[d.txt || '']], styles:{ fontSize:9, cellPadding:6, overflow:'linebreak' }, headStyles:{ fillColor:[22,128,122] }, margin:{ left:30, right:30 } }); }
  else if (e.tipo === 'sancao') { doc.autoTable({ startY:doc.lastAutoTable.finalY + 10, body:[['Medida sugerida', (SANC[d.tipo] || [d.tipo])[0] + (d.tipo === 'sus' ? ' · ' + d.dias + ' dia(s)' : ''), 'Data do ocorrido', brD(d.data) + (d.hora ? ' · ' + d.hora : '')], ['Local', d.local || '—', 'Já orientado antes', d.ant || 'não informado'], ['Testemunhas', d.test || 'não informadas', 'Histórico (12 meses)', d.hist ? d.hist.s12 + ' sanção(ões) · ' + d.hist.fa90 + ' falta(s) em 90 dias' : '']], styles:{ fontSize:8.5, cellPadding:3, overflow:'linebreak' }, columnStyles:{ 0:{ fontStyle:'bold', cellWidth:100 }, 2:{ fontStyle:'bold', cellWidth:100 } }, margin:{ left:30, right:30 } });
    doc.autoTable({ startY:doc.lastAutoTable.finalY + 10, head:[['Assunto: ' + (d.assunto || '')]], body:[[d.desc || '']], styles:{ fontSize:9, cellPadding:6, overflow:'linebreak' }, headStyles:{ fillColor:[161,52,31] }, margin:{ left:30, right:30 } }); }
  else if (e.tipo === 'ferias') doc.autoTable({ startY:doc.lastAutoTable.finalY + 14, head:[['Parcela', 'Início', 'Fim', 'Dias']], body:(d.parcelas || []).map((x, i) => [(i + 1) + 'ª', brD(x.inicio), brD(x.fim), String(x.dias)]).concat(d.abono ? [['Abono pecuniário', '', '', '10']] : []), styles:{ fontSize:9, cellPadding:4 }, headStyles:{ fillColor:[36,66,124] }, margin:{ left:30, right:30 } });
  else { doc.setFontSize(8); doc.setTextColor(93, 106, 133); doc.text('Formulário ' + (d.form || FORM_COD) + ' · Avaliação de período de experiência e desempenho', 30, doc.lastAutoTable.finalY + 12);
    doc.autoTable({ startY:doc.lastAutoTable.finalY + 18, head:[['Fator avaliado', 'Nota (0 a 5) e pontos']], body:(d.crit || []).concat(d.pct != null ? [['% atingido (meta 70%)', pctTxt(d.pct) + ' · ' + faixa(d.pct)[1]]] : []), styles:{ fontSize:9, cellPadding:4 }, headStyles:{ fillColor:[46,138,87] }, margin:{ left:30, right:30 } });
    doc.autoTable({ startY:doc.lastAutoTable.finalY + 10, body:[['Etapa', d.etapaT || '', 'Vencimento', brD(d.venc)], ['Decisão', (DECG.find(x => x[0] === d.decisao) || [])[1] || '', 'Comentário', d.obs || '']], styles:{ fontSize:9, cellPadding:4 }, columnStyles:{ 0:{ fontStyle:'bold', cellWidth:80 }, 2:{ fontStyle:'bold', cellWidth:80 } }, margin:{ left:30, right:30 } }); }
  let y = doc.lastAutoTable.finalY + 26; doc.setFontSize(9.5); doc.setTextColor(20, 33, 61); doc.setFont('helvetica', 'bold'); doc.text('Assinado eletronicamente por ' + (a.nome || e.autor_nome || '') + (a.gestorResp ? ' (assistente)' : ''), 30, y); if (a.gestorResp) { y += 13; doc.text(linhaResp(a), 30, y); }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 70, 90); doc.text(dataHora(a.em || e.criado_em) + ' · usuário ' + (a.usuario || '') + ' · ' + (e.autor_nome || ''), 30, y + 13); doc.text(doc.splitTextToSize(a.declaracao || '', 530), 30, y + 26);
  if (e.status !== 'enviado' && e.rh_por) doc.text((STE[e.status][0]) + ' por ' + e.rh_por + ' em ' + dataHora(e.rh_em) + (e.rh_obs ? ' · ' + e.rh_obs : ''), 30, y + 50);
  rodapePDF(doc); baixar(doc.output('blob'), ({ ferias:'Férias ', sancao:'Pedido de sanção ', perfil:'Parecer perfil profissional ' }[e.tipo] || 'Avaliação ') + (e.colaborador || e.mat) + '.pdf'); }
/* RH aceita: lança no painel de Férias (programação) ou de Experiência (avaliação da área) */
async function aceitar(e, obs){ const d = e.dados || {}, a = e.assinatura || {}, agora = new Date().toISOString();
  if (e.tipo === 'perfil') { const id = String(e.mat).trim().replace(/[^A-Za-z0-9_\-.~:@+]/g, '-').slice(0, 100), cam = 'colaboradores/' + id;
    const { data: r0 } = await sb.from('registros').select('dados').eq('painel', 'perfil').eq('caminho', cam).maybeSingle();
    if (!r0) throw new Error('Este colaborador não está mais no levantamento de perfil profissional.');
    const v = Object.assign({}, r0.dados, { parecer:{ acoes:d.acoes || [], txt:d.txt || '', resp:d.resp || e.autor_nome || '', em:agora.slice(0, 10), por:quemG(a, e), envio:e.id } });
    const { error } = await sb.from('registros').upsert({ painel:'perfil', caminho:cam, colecao:'colaboradores', doc_id:id, dados:v, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' }); if (error) throw error;  try { window.CRV_GESTOR_GERAR && window.CRV_GESTOR_GERAR(); } catch(_){} }
  else if (e.tipo === 'sancao') { const id = 'g' + e.id;
    const v = { envio:e.id, mat:e.mat, nome:e.colaborador || '', funcao:d.funcao || '', secao:d.secao || '', area:String(e.chave || '').slice(2), tipo:d.tipo, dias:d.dias || null, data:d.data, hora:d.hora || '', local:d.local || '', assunto:d.assunto || '', desc:d.desc || '', test:d.test || '', ant:d.ant || '', gestor:quemG(a, e), assinadoEm:a.em || e.criado_em, rhObs:obs || '', aceitoEm:agora, aceitoPor:E.perfil.nome, emitido:false };
    const { error } = await sb.from('registros').upsert({ painel:'sancoes', caminho:'pedidos/' + id, colecao:'pedidos', doc_id:id, dados:v, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' }); if (error) throw error; }
  else if (e.tipo === 'ferias') { const id = e.mat + '_' + d.de, p0 = (d.parcelas || [])[0] || {};
    const v = { inicio:p0.inicio, dias:p0.dias, parcelas:(d.parcelas || []).map(x => ({ inicio:x.inicio, dias:x.dias })), abono:d.abono || 0, obs:['Programado pelo gestor ' + (quemG(a, e)) + ' em ' + dataHora(a.em || e.criado_em), d.obs, obs].filter(Boolean).join(' · '), at:agora, origem:'gestor', envio:e.id };
    const { error } = await sb.from('registros').upsert({ painel:'ferias', caminho:'prog/' + id, colecao:'prog', doc_id:id, dados:v, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' }); if (error) throw error; }
  else { const id = 'm' + e.mat; let cur = {}; try { const { data } = await sb.from('registros').select('dados').eq('painel', 'experiencia').eq('caminho', 'registros/' + id).maybeSingle(); cur = (data && data.dados) || {}; } catch(_){}
    const form = d.notas ? { tipo:'exp', gestor:quemG(a, e), cargoG:'', notas:d.notas.slice(), coment:d.obs || '', resultado:d.decisao === 'encerrar' ? 'nao' : 'efetivar', dataRec:agora.slice(0, 10), verif:E.perfil.nome, dataVerif:agora.slice(0, 10), pct:d.pct } : undefined;
    cur[d.etapa] = { decisao:d.decisao, data:agora.slice(0, 10), venc:d.venc, form, obs:['Avaliação do gestor ' + (quemG(a, e)) + ' (' + dataHora(a.em || e.criado_em) + ')', (d.crit || []).map(x => x[0] + ': ' + x[1]).join('; '), d.obs, obs].filter(Boolean).join(' · ').slice(0, 2000), gestor:{ nome:quemG(a, e), em:a.em || e.criado_em, crit:d.crit, envio:e.id } };
    const { error } = await sb.from('registros').upsert({ painel:'experiencia', caminho:'registros/' + id, colecao:'registros', doc_id:id, dados:cur, atualizado_por:E.perfil.nome }, { onConflict:'painel,caminho' }); if (error) throw error; }
  const { error } = await sb.from('gestor_envios').update({ status:'aceito', rh_obs:obs || '', rh_em:agora, rh_por:E.perfil.nome }).eq('id', e.id); if (error) throw error;
  gerar(true).catch(() => {});
}
async function lerEnviosRH(){ try { const r = await sb.from('gestor_envios').select('*').order('criado_em', { ascending:false }); return r.error ? null : (r.data || []); } catch(_){ return null; } }
async function semGestor(){
  const out = [];
  try { const { data: G } = await sb.from('perfis').select('areas,papel,ativo').eq('papel', 'gestor'); const K = new Set((G || []).filter(g => g.ativo).flatMap(g => g.areas || []));
    const Q = await window.CRV_QUADRO(); const d = await window.CRV_DADOS('experiencia'); if (!Q || !d) return out; const h = hoje(), lim = addD(h, 20);
    (d.dados.RAW || []).forEach(r => { const m = fMat(r[0]), c = Q.mapa[m]; if (!c || c.situacao === 'Desligado') return; const v = [r[7], r[8]].filter(x => x && x >= h && x <= lim).sort()[0]; if (!v || r[17]) return;
      if (K.has('a:' + c.area) || K.has('d:' + c.area + '|' + c.setor)) return; out.push({ nome:c.nome, mat:m, det:`${c.area || 'sem setor'} · ${c.setor || ''} · vence em ${brD(v)}` }); }); } catch(_){}
  return out; }
async function pendenciasEnvios(){ if (!E.perfil || !['admin', 'rh'].includes(E.perfil.papel)) return []; const out = [];
  const S = E.perfil.papel === 'admin' ? await semGestor() : []; if (S.length) out.push({ id:'sem-gestor', sev:'warn', t:'Experiências vencendo em áreas sem gestor no app', painel:'', rota:'#/admin', pnome:'Administração', d:'Todas as áreas respondem pelo app: cadastre o gestor dessas áreas (Administração → Usuários → Gestor de área) para ele conseguir avaliar.', itens:S });
  try { const PD = (await window.CRV_REGS('sancoes', 'pedidos')).filter(x => !x.emitido);
    if (PD.length) out.push({ id:'san-pedidos', sev:'warn', t:'Pedidos de sanção aceitos, sem documento emitido', painel:'sancoes', pnome:'Sanções', d:'O RH aceitou o pedido do gestor. Emita o documento no painel Sanções (botão Pedidos dos gestores) ou descarte o pedido com o motivo.',
      itens:PD.map(x => ({ nome:x.nome || x.mat, mat:x.mat, det:((SANC[x.tipo] || [x.tipo])[0]) + (x.tipo === 'sus' ? ' de ' + x.dias + 'd' : '') + ' · fato em ' + brD(x.data) + ' · pedido de ' + (x.gestor || '') })) }); } catch(_){}
  const L = (await lerEnviosRH() || []).filter(e => e.status === 'enviado'); if (!L.length) return out;
  return out.concat([{ id:'envios', sev:'warn', t:'Envios dos Gestores aguardando o RH', painel:'', rota:'#/envios', pnome:'Envios dos Gestores', d:'Programações de férias, avaliações de experiência e pedidos de sanção assinados pelos gestores. Aceite ou devolva com o motivo.',
    itens:L.map(e => ({ nome:e.colaborador || e.mat, mat:e.mat, det:(TIPO_CURTO[e.tipo] || e.tipo) + ': ' + resumoEnvio(e) + ' · por ' + (e.autor_nome || '') + ' em ' + brD(String(e.criado_em).slice(0, 10)) })) }]); }
async function telaEnvios(){
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Central de Rotinas do RH</div><h1>Envios dos Gestores</h1><div class="ini-data">Férias, avaliações de experiência, pedidos de sanção e pareceres do perfil profissional assinados pelos gestores de área</div></div></section><div id="ev-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  let L = await lerEnviosRH(), F = 'enviado'; const c = $('#ev-corpo'); if (!c) return;
  if (L === null) { c.innerHTML = '<div class="cartao vazio"><h3>A tabela de envios ainda não existe</h3><p>Rode o arquivo 04_gestor.sql atualizado no Supabase.</p></div>'; return; }
  const des = () => { const V = L.filter(e => !F || e.status === F); const n = k => L.filter(e => e.status === k).length;
    c.innerHTML = `<section class="dk-kpis">${[['enviado', 'Aguardando o RH', 'var(--amber)'], ['aceito', 'Aceitos', 'var(--cane)'], ['devolvido', 'Devolvidos', 'var(--coral)'], ['', 'Todos', '#2f6fa8']].map(([k, t, cor]) => `<button class="dk-k ${F === k ? 'on' : ''}" data-st="${k}" style="--c:${cor}"><span>${t}</span><b>${k ? n(k) : L.length}</b></button>`).join('')}</section>
      <section class="fc-sec cartao">${V.length ? `<div class="fc-tw"><table class="fc-t"><thead><tr><th>Enviado em</th><th>Gestor</th><th>Área</th><th>Tipo</th><th>Colaborador</th><th>Resumo</th><th>Prazo</th><th>Situação</th><th></th></tr></thead><tbody>${V.map(e => { const d = e.dados || {}; const pz = e.tipo === 'ferias' ? (d.parcelas && d.parcelas[0] ? (String(e.criado_em).slice(0, 10) <= prazoFerias(d.parcelas[0].inicio) ? 'no prazo' : 'fora do prazo') : '') : e.tipo === 'sancao' ? (d.data ? fDias(d.data, String(e.criado_em).slice(0, 10)) + ' dia(s) após o fato' : '') : (d.decisao === 'encerrar' ? (String(e.criado_em).slice(0, 10) <= d.prazoEnc ? 'no prazo' : 'fora do prazo') : '');
        return `<tr><td>${esc(dataHora(e.criado_em))}</td><td>${esc(e.autor_nome || '')}</td><td>${esc(String(e.chave || '').slice(2))}</td><td>${esc(TIPO_CURTO[e.tipo] || e.tipo)}</td><td><a class="cd-fl" href="#/ficha/${esc(e.mat)}">${esc(e.colaborador || e.mat)}</a></td><td>${esc(resumoEnvio(e))}</td><td>${pz ? `<span class="gs-st ${pz === 'no prazo' ? 'ok' : pz === 'fora do prazo' ? 'dev' : 'pend'}">${pz}</span>` : ''}</td><td><span class="gs-st ${STE[e.status][1]}">${STE[e.status][0]}</span></td><td><button class="btn peq ${e.status === 'enviado' ? 'prim' : 'borda'}" data-id="${esc(e.id)}">${e.status === 'enviado' ? 'Analisar' : 'Ver'}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="fc-vz">Nada aqui.</p>'}</section>
      <p class="nr-fonte">Ao aceitar, a programação entra no painel de Férias e a decisão entra no painel de Período de Experiência como avaliação da área, com o nome do gestor e a data da assinatura. O pedido de sanção aceito vai para o painel Sanções, em Pedidos dos gestores, para o RH emitir o documento (o RH pode mudar a medida). O parecer do perfil profissional aceito entra no levantamento de Perfil Profissional, como parecer da gestão.</p>`;
    c.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { F = b.dataset.st; des(); });
    c.querySelectorAll('[data-id]').forEach(b => b.onclick = () => verEnvio(L.find(e => e.id === b.dataset.id), true, async () => { L = await lerEnviosRH() || []; des(); })); };
  des();
}
return { tela, gerar, opcoes, ultimaGeracao, nomeChave, tipoChave, chaveOk, telaEnvios, pendenciasEnvios };
};
