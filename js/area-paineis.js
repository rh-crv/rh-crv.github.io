/* =====================================================================
   PAINÉIS DO RH RECORTADOS POR ÁREA (gestor e assistente)
   O gestor abre o MESMO painel do RH (mesmo arquivo, mesmo visual), mas com uma cópia da base só com as pessoas
   da área dele e sem dados pessoais sensíveis. As cópias são geradas pelo administrador (gestor.js → gerar)
   e ficam em area_dados, chave 'u:<id do gestor>'; a assistente lê a do gestor responsável.
   Cada painel registra aqui: como recortar a base (filtro) e quais lançamentos do painel o gestor pode ler (regs).
   Contexto do recorte: { mats:Set de matrículas da área (ativos e desligados), setores, areas, gerencias, funcoes, mapa }.
   ===================================================================== */
/* muda quando a regra de recorte muda: força gerar de novo as cópias dos gestores */
window.CRV_AREA_V = 'r3-dep-regra';
window.CRV_AREA = (function(){
'use strict';
const LISTA = [];
const fm = m => String(m == null ? '' : m).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
const clonar = c => JSON.parse(JSON.stringify(c));
/* lê/grava um item da base, nos dois formatos de pacote (blocos de itens ou objeto de dados) */
function get(c, nome){ if (!c) return undefined; if (Array.isArray(c.blocos)) { for (const b of c.blocos) for (const i of (b.itens || [])) if (i.nome === nome) return i.valor; return undefined; }
  const d = c.dados; if (Array.isArray(d) && Array.isArray(c.nomes)) { const k = c.nomes.indexOf(nome); return k >= 0 ? d[k] : undefined; } return d ? d[nome] : undefined; }
function set(c, nome, v){ if (Array.isArray(c.blocos)) { for (const b of c.blocos) for (const i of (b.itens || [])) if (i.nome === nome) { i.valor = v; return; } return; }
  const d = c.dados; if (Array.isArray(d) && Array.isArray(c.nomes)) { const k = c.nomes.indexOf(nome); if (k >= 0) d[k] = v; return; } if (d) d[nome] = v; }
const def = id => LISTA.find(x => x.id === id);
function filtrar(id, conteudo, ctx){ const D = def(id); if (!D) return null; const c = clonar(conteudo); delete c.registros; return D.filtro(c, ctx) || c; }
/* lançamentos do painel que o gestor pode ler: só os da área (pelo id do documento ou por um campo de matrícula) */
function regOk(id, colecao, docId, dados, ctx){ const D = def(id); if (!D || !D.regs || !D.regs[colecao]) return false; return !!D.regs[colecao](String(docId || ''), dados || {}, ctx); }
const reg = d => { if (!def(d.id)) LISTA.push(d); };
const matDoId = rx => (id, d, ctx) => { const m = (String(id).match(rx) || [])[1]; return !!m && ctx.mats.has(fm(m)); };

/* ---------- o registro é do gestor? ----------
   Regra (out/2026, definida pela RH): vale o departamento ATUAL que o próprio painel do RH usa no filtro dele
   (o da planilha/base do painel), para os números do gestor baterem com o painel do RH filtrado pelo mesmo setor.
   ctx.areasN: setores inteiros do gestor (chave 'a:'); ctx.depSelN: 'setor|departamento' (chave 'd:');
   ctx.depsN: todos os departamentos dos setores inteiros (pelo Quadro, inclui desligados) + os departamentos marcados. */
const N = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
/* departamentos com o mesmo nome em dois setores: regra da RH (out/2026)
   RECEPCAO: auxiliar administrativo é da ADM - CRV; as demais funções são da Indústria (recepção de cana).
   OPERADOR - MAQUINAS HERBICIDA: sempre Tratos Culturais. */
const DEP_REGRA = {
  'RECEPCAO': (area, func) => func ? (/AUX[A-Z.]* *ADM/.test(N(func)) ? 'ADM - CRV' : 'Indústria') : (area || 'Indústria'),
  'OPERADOR - MAQUINAS HERBICIDA': () => 'Tratos Culturais' };
const areaDe = (area, dep, func) => { const r = DEP_REGRA[N(dep)]; return r ? r(area, func) : area; };
function casa(ctx, area, dep, func){ const d = N(dep);
  if (DEP_REGRA[d]) { const a2 = N(areaDe(area, dep, func)); return ctx.areasN.has(a2) || ctx.depSelN.has(a2 + '|' + d); }
  const a = N(area);
  if (a) { if (ctx.areasN.has(a)) return true; if (d && ctx.depSelN.has(a + '|' + d)) return true; if (ctx.areasConhecidasN && ctx.areasConhecidasN.has(a)) return false; }
  return !!d && ctx.depsN.has(d); }
/* monta o contexto a partir das chaves do gestor e do mapa do Quadro (usado no app e nos testes) */
function contexto(chaves, mapa){ const M = mapa || {}, ks = (chaves || []).filter(k => /^[ad]:/.test(k));
  const areasN = new Set(ks.filter(k => k[0] === 'a').map(k => N(k.slice(2)))), depSelN = new Set(ks.filter(k => k[0] === 'd').map(k => N(k.slice(2).split('|')[0]) + '|' + N(k.slice(2).split('|')[1])));
  const depsN = new Set([...depSelN].map(x => x.split('|')[1])), areasConhecidasN = new Set();
  const mm = [];
  Object.keys(M).forEach(m => { const p = M[m] || {}, a = N(areaDe(p.area, p.setor, p.funcao)), d = N(p.setor); if (a) areasConhecidasN.add(a);
    if (areasN.has(a)) { if (d) depsN.add(d); mm.push(m); } else if (depSelN.has(a + '|' + d)) mm.push(m); });
  const nomeN = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return { chaves:ks, mapa:M, mats:new Set(mm.map(fm)), areasN, depSelN, depsN, areasConhecidasN,
    areas:new Set(mm.map(m => M[m].area).filter(Boolean)), setores:new Set(mm.map(m => M[m].setor).filter(Boolean)), gerencias:new Set(mm.map(m => M[m].gerencia).filter(Boolean)),
    funcoes:new Set(mm.map(m => M[m].funcao).filter(Boolean)), nomes:new Set(mm.map(m => nomeN(M[m].nome)).filter(Boolean)) }; }

/* tira campos sensíveis de um lançamento antes de ir para o gestor (opcional, por painel) */
function limparReg(id, colecao, dados){ const D = def(id); return D && D.limparReg ? D.limparReg(colecao, clonar(dados)) : dados; }
return { LISTA, reg, def, get, set, fm, clonar, filtrar, regOk, limparReg, matDoId, casa, contexto, N, areaDe };
})();
