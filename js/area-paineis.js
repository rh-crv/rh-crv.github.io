/* =====================================================================
   PAINÉIS DO RH RECORTADOS POR ÁREA (gestor e assistente)
   O gestor abre o MESMO painel do RH (mesmo arquivo, mesmo visual), mas com uma cópia da base só com as pessoas
   da área dele e sem dados pessoais sensíveis. As cópias são geradas pelo administrador (gestor.js → gerar)
   e ficam em area_dados, chave 'u:<id do gestor>'; a assistente lê a do gestor responsável.
   Cada painel registra aqui: como recortar a base (filtro) e quais lançamentos do painel o gestor pode ler (regs).
   Contexto do recorte: { mats:Set de matrículas da área (ativos e desligados), setores, areas, gerencias, funcoes, mapa }.
   ===================================================================== */
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

/* ---------- Período de experiência ---------- */
reg({ id:'experiencia', nome:'Período de experiência', frente:'Gestão de Colaboradores',
  filtro(c, ctx){ set(c, 'RAW', (get(c, 'RAW') || []).filter(r => ctx.mats.has(fm(r[0])))); },
  regs:{ registros:matDoId(/^m?(\d+)/) } });

/* ---------- Férias (sem gestantes: informação de saúde fica só com o RH) ---------- */
reg({ id:'ferias', nome:'Férias', frente:'Absenteísmo e Férias',
  filtro(c, ctx){ set(c, 'DATA', (get(c, 'DATA') || []).filter(p => ctx.mats.has(fm(p.c)))); set(c, 'GEST', []); },
  regs:{ prog:matDoId(/^(\d+)_/) } });

/* tira campos sensíveis de um lançamento antes de ir para o gestor (opcional, por painel) */
function limparReg(id, colecao, dados){ const D = def(id); return D && D.limparReg ? D.limparReg(colecao, clonar(dados)) : dados; }
return { LISTA, reg, def, get, set, fm, clonar, filtrar, regOk, limparReg, matDoId };
})();
