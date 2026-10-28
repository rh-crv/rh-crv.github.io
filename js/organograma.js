/* =====================================================================
   ORGANOGRAMA DO RH (Gestão de Pessoas)
   Quem entra: ativos do Quadro Geral com setor "Gestão de Pessoas" + jovens aprendizes ativos alocados no RH
   (painéis do Instituto João Bittar e da RENAPSI), mais inclusões manuais e menos as retiradas.
   Desligado no Quadro (ou baixa do jovem) sai sozinho. Nunca mostra salário, CPF ou dados pessoais.
   Configuração: registros do Quadro, caminho 'sistema/organograma'. Fotos: coleção 'org_foto' (uma por pessoa),
   só recorte/enquadramento da foto enviada (nada é alterado ou gerado).
   ===================================================================== */
window.CRV_ORG_INIT = function(X){
'use strict';
const { sb, E, $, esc, normal, moldura, toast, traduzErro, ehRH } = X;
const quem = () => (E.perfil && E.perfil.nome) || '';
const nrm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const tc = s => String(s || '').toLowerCase().replace(/(^|[\s\/(.-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Dos|Das|E) /g, m => m.toLowerCase()).replace(/\b(Ii|Iii|Iv|Rh|Crv|Dp|T&d)\b/gi, m => m.toUpperCase()).replace(/\((A|O|As|Os)\)/g, m => m.toLowerCase()).replace(/\.(\S)/g, '. $1');
const NIV = [ { n:'Gerência', c:'#1f3a68' }, { n:'Coordenação', c:'#2e7d4f' }, { n:'Analistas e assistentes', c:'#b5731a' }, { n:'Auxiliares', c:'#1d7a88' }, { n:'Jovens aprendizes', c:'#7b3fa0' } ];
const SETOR_RH = /^(GESTAO DE PESSOAS)$/;                       // setor do Quadro
const SETOR_JOV = /^(RH|RECURSOS HUMANOS|GESTAO DE PESSOAS)$/;  // setor de alocação do jovem
const nivelAuto = p => { if (p.jovem) return 4; const f = nrm(p.funcao); if (/GERENTE|GERENCIA|DIRETOR/.test(f)) return 0; if (/COORDENAD|SUPERVIS/.test(f)) return 1; if (/AUXILIAR|AJUDANTE|RECEPCION|ESTAGI/.test(f)) return 3; return 2; };
const grau = f => { const m = nrm(f).match(/\b(I{1,3}|IV|V)\b\s*$/); return m ? ({ I:1, II:2, III:3, IV:4, V:5 })[m[1]] : 0; };
const iniciais = n => String(n || '?').split(/\s+/).filter(w => w.length > 2 || /^[A-Z]/.test(w)).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const corDe = k => { const P = ['#2e7d4f', '#b5731a', '#7b3fa0', '#1d7a88', '#c0583f', '#5b3f9e', '#8a7a2e', '#2f6fa8']; let h = 0; String(k).split('').forEach(c => h = (h * 31 + c.charCodeAt(0)) >>> 0); return P[h % P.length]; };
const brD = s => { s = String(s || ''); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[3] + '/' + m[2] + '/' + m[1]; return s.slice(0, 10); };
const iso = s => { s = String(s || ''); const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : s.slice(0, 10); };
const tempoCasa = adm => { adm = iso(adm); if (!/^\d{4}-\d{2}-\d{2}$/.test(adm)) return ''; const a = new Date(adm + 'T12:00:00'), h = new Date(); let m = (h.getFullYear() - a.getFullYear()) * 12 + (h.getMonth() - a.getMonth()); if (h.getDate() < a.getDate()) m--; if (m < 0) return '';
  const y = Math.floor(m / 12), r = m % 12; return y ? y + (y === 1 ? ' ano' : ' anos') + (r ? ' e ' + r + (r === 1 ? ' mês' : ' meses') : '') : r ? r + (r === 1 ? ' mês' : ' meses') : 'menos de 1 mês'; };

/* atividades informadas pelo RH (preenchimento inicial; depois de salvo na ficha, vale o que estiver salvo) */
const ASSIST = 'Triagem de candidatos\nOrganização documental\nContratos físicos\nConferência das informações\nInterface com áreas\nCumprimento de prazos\nSanções disciplinares\nIndicadores (acompanhamento)\nWhatsApp interno e externo';
const PADRAO = { 'q:6932':{ faz:ASSIST }, 'q:15441':{ faz:ASSIST },
  'q:2471':{ faz:'Onboarding\nAcompanhamento de experiência\nFérias\nVida funcional\nTreinamentos (controle) relacionados à jornada\nJovem Aprendiz\nDemissões\nRH Externo\nAplicativo Gestão de Pessoas\nSocial (eventos)\nMídia / comunicação\nNotas fiscais (lançamentos) e pedidos\nSanções disciplinares\nIndicadores (acompanhamento)' },
  'q:45433':{ faz:'Recepção e atendimento interno\nConexão com contratos\nColeta de assinaturas\nApoio na chegada à área\nOrientação inicial\nWhatsApp interno e externo' } };
let CFG = null, FOTOS = {}, PESS = [], ACHADOS = [], VIEW = '';
async function lerCfg(){ const { data } = await sb.from('registros').select('dados').eq('painel', 'quadro').eq('caminho', 'sistema/organograma').maybeSingle();
  CFG = Object.assign({ conf:false, inc:[], exc:[], chefe:{}, nivel:{}, info:{} }, (data && data.dados) || {}); }
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
  return { quadro, jov, temQ:!!(Q && Q.mapa) };
}
async function montar(){
  const F = await fontes(); const porK = new Map(); F.quadro.concat(F.jov).forEach(p => porK.set(p.key, p));
  ACHADOS = F.quadro.filter(p => SETOR_RH.test(nrm(p.setor))).concat(F.jov.filter(p => SETOR_JOV.test(nrm(p.setor))));
  const ks = new Set(ACHADOS.map(p => p.key)); (CFG.inc || []).forEach(k => ks.add(k)); (CFG.exc || []).forEach(k => ks.delete(k));
  PESS = [...ks].map(k => porK.get(k)).filter(Boolean).map(p => Object.assign({}, p, { nivel:CFG.nivel[p.key] != null ? +CFG.nivel[p.key] : nivelAuto(p), manual:(CFG.inc || []).includes(p.key) }));
  /* responde a: manual ou o líder mais próximo acima (gerência/coordenação); quem é líder responde ao nível acima */
  const ord = (a, b) => a.nivel - b.nivel || grau(b.funcao) - grau(a.funcao) || String(iso(a.adm)).localeCompare(String(iso(b.adm))) || String(a.nome).localeCompare(String(b.nome), 'pt-BR');
  PESS.sort(ord);
  PESS.forEach(p => { const m = CFG.chefe[p.key]; if (m && m !== p.key && PESS.some(x => x.key === m)) { p.chefe = m; return; }
    const acima = PESS.filter(x => x.nivel < p.nivel); if (!acima.length) { p.chefe = ''; return; }
    const lid = acima.filter(x => x.nivel <= 1); const alvo = (lid.length ? lid : acima).sort((a, b) => b.nivel - a.nivel || ord(a, b))[0]; p.chefe = alvo ? alvo.key : ''; });
  /* evita ciclos */
  PESS.forEach(p => { const vis = new Set([p.key]); let c = p.chefe; while (c) { if (vis.has(c)) { p.chefe = ''; break; } vis.add(c); c = (PESS.find(x => x.key === c) || {}).chefe; } });
  return F;
}

/* ---------- layout em níveis (o mesmo para a tela e o PDF) ---------- */
function layout(cw, ch, gx, gy){
  const lv = [...new Set(PESS.map(p => p.nivel))].sort((a, b) => a - b); const pos = {}; let maxW = 0;
  lv.forEach((n, i) => { const L = PESS.filter(p => p.nivel === n);
    L.sort((a, b) => { const xa = pos[a.chefe] ? pos[a.chefe].x : -1, xb = pos[b.chefe] ? pos[b.chefe].x : -1; return xa - xb || grau(b.funcao) - grau(a.funcao) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'); });
    const w = L.length * cw + (L.length - 1) * gx; maxW = Math.max(maxW, w); L.forEach((p, j) => { pos[p.key] = { x:j * (cw + gx), y:i * (ch + gy), row:i, w }; }); });
  Object.values(pos).forEach(o => { o.x += (maxW - o.w) / 2; });
  return { pos, W:maxW, H:lv.length * ch + (lv.length - 1) * gy, lv };
}
const linhas = (pos, cw, ch, gy) => PESS.filter(p => p.chefe && pos[p.chefe]).map(p => { const a = pos[p.chefe], b = pos[p.key]; const x1 = a.x + cw / 2, y1 = a.y + ch, x2 = b.x + cw / 2, y2 = b.y; const ym = y2 - gy / 2; return [[x1, y1], [x1, ym], [x2, ym], [x2, y2]]; });

/* ---------- tela ---------- */
const CSS = `.og-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px}.og-bar .sp{flex:1}
.og-wrap{background:var(--card,#fff);border:1px solid var(--line,#e4e7ec);border-radius:14px;padding:18px;overflow:auto;position:relative}
.og-area{position:relative;margin:0 auto}.og-svg{position:absolute;left:0;top:0;pointer-events:none}
.og-c{position:absolute;box-sizing:border-box;background:#fff;border:1px solid #e3e6ec;border-top:4px solid var(--c);border-radius:12px;padding:10px 8px 8px;text-align:center;cursor:pointer;box-shadow:0 2px 6px rgba(20,33,61,.06);transition:transform .12s}
.og-c:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(20,33,61,.12)}
.og-f{width:64px;height:64px;border-radius:50%;margin:0 auto 6px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:22px;border:3px solid #fff;box-shadow:0 0 0 2px var(--c)}
.og-f img{width:100%;height:100%;object-fit:cover;display:block}
.og-n{font-weight:800;font-size:12.5px;line-height:1.2;color:#14213d}.og-fu{font-size:11px;color:#5d6a85;margin-top:2px;line-height:1.2}.og-t{font-size:10.5px;color:#8a94a8;margin-top:3px}
.og-sel{display:inline-block;margin-top:4px;background:#f1e8f8;color:#5a2d82;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:800;letter-spacing:.03em}
.og-af{display:inline-block;margin-top:4px;background:#fff1d6;color:#7a5200;border-radius:99px;padding:1px 8px;font-size:10px;font-weight:800}
.og-lg{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#5d6a85;margin:0 0 10px}.og-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.og-lv h3{margin:14px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--c)}.og-lv .og-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.og-lv .og-c{position:relative}
.og-ov{position:fixed;inset:0;background:rgba(10,20,40,.5);z-index:95;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 10px}
.og-m{background:#fff;border-radius:16px;width:min(620px,100%);box-shadow:0 20px 50px rgba(0,0,0,.3);max-height:calc(100vh - 48px);display:flex;flex-direction:column}
.og-mh{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid #e4e7ec}.og-mh h3{margin:0;flex:1;font-size:17px}.og-mb{padding:16px 18px;overflow:auto}.og-mf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 18px;border-top:1px solid #e4e7ec}
.og-tb{width:100%;border-collapse:collapse;font-size:13px}.og-tb th{text-align:left;font-size:11px;text-transform:uppercase;color:#667085;padding:6px;border-bottom:2px solid #e4e7ec}.og-tb td{padding:6px;border-top:1px solid #eef0f4}
@media (max-width:760px){.og-wrap{padding:10px}}`;
function estilo(){ if (!document.getElementById('og-css')) { const s = document.createElement('style'); s.id = 'og-css'; s.textContent = CSS; document.head.appendChild(s); } }
const fotoHtml = (p, tam) => FOTOS[p.key] ? `<img src="${FOTOS[p.key]}" alt="">` : `<span style="font-size:${tam ? Math.round(tam / 2.9) : 22}px">${esc(iniciais(p.nome))}</span>`;
const cartao = (p, st) => { const c = NIV[p.nivel].c; return `<div class="og-c" data-k="${esc(p.key)}" style="--c:${c};${st || ''}"><div class="og-f" style="background:${corDe(p.key)}">${fotoHtml(p)}</div><div class="og-n">${esc(tc(p.nome))}</div><div class="og-fu">${esc(tc(p.funcao))}</div>${p.jovem ? `<div class="og-t">${esc(p.entidade)}</div><span class="og-sel">JOVEM APRENDIZ</span>` : `<div class="og-t">${esc(tempoCasa(p.adm))}${tempoCasa(p.adm) ? ' de casa' : ''}</div>`}${p.sit === 'Afastado' ? '<span class="og-af">Afastado</span>' : ''}</div>`; };

async function tela(){
  estilo(); const pode = ehRH();
  moldura(`<section class="ini-topo"><div><div class="ini-eyebrow">Gestão de Pessoas · CRV Industrial</div><h1>Organograma do RH</h1><div class="ini-data">Equipe de Gestão de Pessoas: quem é quem e o que cada um faz</div></div></section><div id="og-corpo"><div class="cartao vazio"><div class="spinner" style="margin:0 auto"></div></div></div>`);
  try { await Promise.all([lerCfg(), lerFotos()]); await montar(); } catch(e){ const c = $('#og-corpo'); if (c) c.innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; return; }
  if (!CFG.conf && pode) return conferir(true);
  desenhar();
}
function desenhar(){
  const c = $('#og-corpo'); if (!c) return; const pode = ehRH(); const mob = window.innerWidth < 760; if (!VIEW) VIEW = mob ? 'lv' : 'org';
  const cw = 168, ch = 168, gx = 18, gy = 46; const L = layout(cw, ch, gx, gy);
  c.innerHTML = `<div class="og-bar">${PESS.length ? `<button class="btn ${VIEW === 'org' ? 'prim' : 'borda'}" data-v="org">Organograma</button><button class="btn ${VIEW === 'lv' ? 'prim' : 'borda'}" data-v="lv">Por nível</button>` : ''}<span class="sp"></span>${pode ? '<button class="btn borda" id="og-eq">Equipe (incluir / retirar)</button>' : ''}<button class="btn prim" id="og-pdf">Imprimir / Gerar PDF</button></div>
    <div class="og-lg">${NIV.map((n, i) => PESS.some(p => p.nivel === i) ? `<span><i style="background:${n.c}"></i>${n.n}</span>` : '').join('')}<span style="margin-left:auto">${PESS.length} pessoas · clique no cartão para ver o que cada um faz</span></div>
    ${!PESS.length ? '<div class="cartao vazio"><h3>Ninguém na equipe</h3><p>Use "Equipe" para incluir pela matrícula.</p></div>' : VIEW === 'org'
      ? `<div class="og-wrap"><div class="og-area" style="width:${L.W}px;height:${L.H}px"><svg class="og-svg" width="${L.W}" height="${L.H}">${linhas(L.pos, cw, ch, gy).map(pts => `<polyline points="${pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="#c3cad6" stroke-width="2"/>`).join('')}</svg>
        ${PESS.map(p => cartao(p, `left:${L.pos[p.key].x}px;top:${L.pos[p.key].y}px;width:${cw}px;height:${ch}px`)).join('')}</div></div>`
      : `<div class="og-wrap">${NIV.map((n, i) => { const G = PESS.filter(p => p.nivel === i); return G.length ? `<div class="og-lv" style="--c:${n.c}"><h3>${n.n} (${G.length})</h3><div class="og-grid">${G.map(p => cartao(p)).join('')}</div></div>` : ''; }).join('')}</div>`}`;
  c.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { VIEW = b.dataset.v; desenhar(); });
  c.querySelectorAll('.og-c').forEach(b => b.onclick = () => ficha(b.dataset.k));
  const eq = $('#og-eq'); if (eq) eq.onclick = () => conferir(false);
  $('#og-pdf').onclick = () => pdf().catch(e => toast('Não consegui gerar o PDF: ' + (e.message || e), true));
}
function janela(tit, corpo, pe){ const w = document.createElement('div'); w.className = 'og-ov'; w.innerHTML = `<div class="og-m"><div class="og-mh"><h3>${tit}</h3><button class="btn borda peq" data-x>Fechar</button></div><div class="og-mb">${corpo}</div><div class="og-mf">${pe || ''}</div></div>`;
  document.body.appendChild(w); w.addEventListener('mousedown', e => { if (e.target === w) w.remove(); }); w.querySelectorAll('[data-x]').forEach(b => b.onclick = () => w.remove()); return w; }

/* ---------- conferir a equipe (antes de montar e depois, para incluir/retirar) ---------- */
async function conferir(primeira){
  const F = await fontes(); const todos = F.quadro.concat(F.jov); const porK = new Map(todos.map(p => [p.key, p]));
  const exc = new Set(CFG.exc || []), inc = new Set(CFG.inc || []);
  const lista = () => { const ks = new Set(ACHADOS.map(p => p.key).concat([...inc])); return [...ks].map(k => porK.get(k)).filter(Boolean).sort((a, b) => (a.jovem ? 1 : 0) - (b.jovem ? 1 : 0) || String(a.nome).localeCompare(String(b.nome), 'pt-BR')); };
  const sumidos = [...inc].filter(k => !porK.has(k));
  const w = janela(primeira ? 'Conferir a equipe antes de montar' : 'Equipe do organograma', '', `<span id="og-msg" style="flex:1;font-size:13px;color:#a3301c"></span>${primeira ? '' : '<button class="btn borda" data-x>Cancelar</button>'}<button class="btn prim" id="og-ok">${primeira ? 'Confirmar e montar o organograma' : 'Salvar'}</button>`);
  const des = () => { const L = lista(), nJ = L.filter(p => p.jovem && !exc.has(p.key)).length;
    w.querySelector('.og-mb').innerHTML = `<p style="margin-top:0;font-size:13.5px">Encontrados: colaboradores ativos do Quadro Geral com setor <b>Gestão de Pessoas</b> e jovens aprendizes ativos alocados no <b>RH</b> (painéis do João Bittar e da RENAPSI). Desmarque quem não deve entrar.</p>
      ${nJ !== 4 ? `<div style="background:#fff1d6;border:1px solid #f0c98a;border-radius:10px;padding:8px 12px;font-size:13px;color:#5c3b00;margin-bottom:10px"><b>Atenção:</b> ${nJ} jovem(ns) aprendiz(es) no RH, e não 4. Confira nos painéis do Jovem Aprendiz o setor de alocação, ou inclua/retire pela matrícula.</div>` : ''}
      ${sumidos.length ? `<div style="background:#fdecea;border-radius:10px;padding:8px 12px;font-size:13px;color:#8f1d12;margin-bottom:10px">${sumidos.length} pessoa(s) incluída(s) antes não estão mais ativas (desligadas) e saíram do organograma.</div>` : ''}
      <div style="overflow:auto"><table class="og-tb"><thead><tr><th></th><th>Matrícula</th><th>Nome</th><th>Função</th><th>Origem</th></tr></thead><tbody>${L.map(p => `<tr><td><input type="checkbox" data-ck="${esc(p.key)}" ${exc.has(p.key) ? '' : 'checked'}></td><td>${esc(p.mat)}</td><td><b>${esc(tc(p.nome))}</b>${inc.has(p.key) ? ' <span class="og-af" style="background:#e6f3ec;color:#1d4d33">incluído à mão</span>' : ''}</td><td>${esc(tc(p.funcao))}${p.jovem ? ' · ' + esc(brD(p.ini)) + ' a ' + esc(brD(p.fim)) : ''}</td><td>${esc(p.origem)}${p.setor ? '<div style="font-size:11.5px;color:#8a94a8">' + esc(tc(p.setor)) + '</div>' : ''}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="5" style="font-weight:700">Total: ${L.filter(p => !exc.has(p.key)).length} pessoas no organograma (${L.filter(p => !exc.has(p.key) && !p.jovem).length} do Quadro e ${nJ} jovens aprendizes)</td></tr></tfoot></table></div>
      <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><b style="font-size:13px">Incluir pela matrícula:</b><input id="og-im" inputmode="numeric" placeholder="Matrícula" style="width:120px;padding:7px 9px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"><button class="btn borda" id="og-ib">Procurar</button><span id="og-ir" style="font-size:13px"></span></div>`;
    w.querySelectorAll('[data-ck]').forEach(c => c.onchange = () => { c.checked ? exc.delete(c.dataset.ck) : exc.add(c.dataset.ck); des(); });
    w.querySelector('#og-ib').onclick = () => { const m = w.querySelector('#og-im').value.replace(/\D/g, ''); const r = w.querySelector('#og-ir'); if (!m) return;
      const H = todos.filter(p => String(p.mat) === m); if (!H.length) { r.innerHTML = '<span style="color:#a3301c">Matrícula não encontrada entre os ativos do Quadro nem entre os jovens ativos.</span>'; return; }
      r.innerHTML = H.map(p => `<button class="btn borda peq" data-add="${esc(p.key)}">${esc(tc(p.nome))} · ${esc(p.origem)}</button>`).join(' ');
      r.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { inc.add(b.dataset.add); exc.delete(b.dataset.add); des(); }); };
  };
  des();
  w.querySelector('#og-ok').onclick = async () => { const b = w.querySelector('#og-ok'); b.disabled = true;
    try { const base = new Set(ACHADOS.map(p => p.key)); CFG.inc = [...inc].filter(k => !base.has(k) && porK.has(k)); CFG.exc = [...exc]; CFG.conf = true; await salvarCfg(); await montar(); w.remove(); desenhar(); toast('Equipe salva.'); }
    catch(e){ b.disabled = false; w.querySelector('#og-msg').textContent = traduzErro(e); } };
}

/* ---------- ficha da pessoa ---------- */
function ficha(k){
  const p = PESS.find(x => x.key === k); if (!p) return; const pode = ehRH(); const info = CFG.info[k] || PADRAO[k] || {};
  const faz = String(info.faz || '').split(/\n/).map(t => t.replace(/^[-•·\s]+/, '').trim()).filter(Boolean), proc = String(info.procure || '').split(/[,;\n]/).map(t => t.trim()).filter(Boolean);
  const chefe = PESS.find(x => x.key === p.chefe);
  const w = janela(esc(tc(p.nome)), `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><div class="og-f" style="width:120px;height:120px;margin:0;background:${corDe(p.key)};--c:${NIV[p.nivel].c}">${fotoHtml(p, 120)}</div>
      <div style="flex:1;min-width:200px"><div style="font-size:19px;font-weight:800;color:#14213d">${esc(tc(p.nome))}</div><div style="color:#5d6a85;margin-top:2px">${esc(tc(p.funcao))}${p.jovem ? ' · ' + esc(p.entidade) : ''}</div>
      <div style="font-size:13px;color:#5d6a85;margin-top:6px">${p.jovem ? 'Contrato de ' + esc(brD(p.ini)) + ' a ' + esc(brD(p.fim)) : (tempoCasa(p.adm) ? esc(tempoCasa(p.adm)) + ' de casa (desde ' + esc(brD(p.adm)) + ')' : '')}${chefe ? '<br>Responde a: <b>' + esc(tc(chefe.nome)) + '</b>' : ''}</div>
      ${p.jovem ? '<span class="og-sel">JOVEM APRENDIZ</span>' : ''}</div></div>
    <h4 style="margin:6px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:${NIV[p.nivel].c}">O que faz no departamento</h4>
    ${faz.length ? '<ul style="margin:0 0 10px;padding-left:18px;line-height:1.6;' + (faz.length > 7 ? 'columns:2 220px;column-gap:24px' : '') + '">' + faz.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '<p style="color:#8a94a8;margin:0 0 10px">Ainda não preenchido.</p>'}
    ${proc.length ? `<h4 style="margin:6px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:${NIV[p.nivel].c}">Procure para</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${proc.map(t => `<span style="background:#eef1f5;border-radius:99px;padding:3px 10px;font-size:12.5px">${esc(t)}</span>`).join('')}</div>` : ''}
    ${pode ? `<details style="margin-top:14px;border-top:1px solid #e4e7ec;padding-top:10px"><summary style="cursor:pointer;font-weight:700">Editar (RH)</summary>
      <label style="display:block;font-size:12px;font-weight:700;color:#667085;margin-top:10px">O QUE FAZ NO DEPARTAMENTO (um tópico por linha)<textarea id="og-faz" rows="6" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit">${esc(faz.join('\n'))}</textarea></label>
      <label style="display:block;font-size:12px;font-weight:700;color:#667085;margin-top:8px">PROCURE PARA (separe por vírgula)<input id="og-pro" value="${esc(proc.join(', '))}" placeholder="Ex.: atestados, benefícios, admissão" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><label style="flex:1;min-width:180px;font-size:12px;font-weight:700;color:#667085">NÍVEL<select id="og-niv" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit">${NIV.map((n, i) => `<option value="${i}" ${p.nivel === i ? 'selected' : ''}>${n.n}${CFG.nivel[k] == null && nivelAuto(p) === i ? ' (pela função)' : ''}</option>`).join('')}</select></label>
      <label style="flex:1;min-width:180px;font-size:12px;font-weight:700;color:#667085">RESPONDE A<select id="og-che" style="width:100%;margin-top:4px;padding:8px;border:1px solid #d5dbe6;border-radius:8px;font:inherit"><option value="">(automático)</option><option value="-" ${CFG.chefe[k] === '-' ? 'selected' : ''}>Ninguém (topo do organograma)</option>${PESS.filter(x => x.key !== k).map(x => `<option value="${esc(x.key)}" ${CFG.chefe[k] === x.key ? 'selected' : ''}>${esc(tc(x.nome))} · ${esc(tc(x.funcao))}</option>`).join('')}</select></label></div></details>` : ''}`,
    pode ? `<button class="btn borda" id="og-foto">${FOTOS[k] ? 'Trocar foto' : 'Adicionar foto'}</button>${FOTOS[k] ? '<button class="btn borda" id="og-fx" style="color:#a3301c">Tirar foto</button>' : ''}<span style="flex:1"></span><button class="btn borda" data-x>Fechar</button><button class="btn prim" id="og-sv">Salvar</button>` : '<span style="flex:1"></span><button class="btn prim" data-x>Fechar</button>');
  if (!pode) return;
  w.querySelector('#og-foto').onclick = () => recortar(k, () => { w.remove(); desenhar(); ficha(k); });
  const fx = w.querySelector('#og-fx'); if (fx) fx.onclick = async () => { if (!confirm('Tirar a foto de ' + tc(p.nome) + '?')) return; try { await salvarFoto(k, ''); w.remove(); desenhar(); toast('Foto retirada.'); } catch(e){ toast(traduzErro(e), true); } };
  w.querySelector('#og-sv').onclick = async () => { const b = w.querySelector('#og-sv'); b.disabled = true;
    CFG.info[k] = { faz:w.querySelector('#og-faz').value.trim(), procure:w.querySelector('#og-pro').value.trim() };
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
/* ---------- PDF: organograma completo numa página (A4 deitado), no padrão dos documentos do RH ---------- */
const circulo = src => new Promise(ok => { const im = new Image(); im.onload = () => { const S = 240, c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d'); x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); x.clip(); x.drawImage(im, 0, 0, S, S); ok(c.toDataURL('image/png')); }; im.onerror = () => ok(null); im.src = src; });
async function pdf(){
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'mm', format:'a4', orientation:'landscape' }); const D = window.CRV_DOC; const W = 297, H = 210;
  let y0 = D ? D.titulo(doc, 'Organograma do RH', 'Gestão de Pessoas · CRV Industrial · Unidade Capinópolis · ' + PESS.length + ' pessoas') : 30;
  const lg = NIV.map((n, i) => [n, i]).filter(([, i]) => PESS.some(p => p.nivel === i)); let lx = 12; doc.setFontSize(7.5);
  lg.forEach(([n]) => { doc.setFillColor(...hex(n.c)); doc.roundedRect(lx, y0 - 2.6, 3, 3, .6, .6, 'F'); doc.setTextColor(93, 106, 133); doc.text(n.n, lx + 4.2, y0); lx += doc.getTextWidth(n.n) + 10; }); y0 += 5;
  const areaW = W - 24, areaH = H - 24 - y0; const base = layout(34, 40, 5, 12); const k = Math.min(1.6, areaW / base.W, areaH / base.H);
  const cw = 34 * k, ch = 40 * k, gy = 12 * k; const L = layout(cw, ch, 5 * k, gy); const ox = 12 + (areaW - L.W) / 2, oy = y0;
  doc.setDrawColor(195, 202, 214); doc.setLineWidth(.4); linhas(L.pos, cw, ch, gy).forEach(pts => { for (let i = 1; i < pts.length; i++) doc.line(ox + pts[i - 1][0], oy + pts[i - 1][1], ox + pts[i][0], oy + pts[i][1]); });
  const FC = {}; for (const p of PESS) if (FOTOS[p.key]) FC[p.key] = await circulo(FOTOS[p.key]);
  PESS.forEach(p => { const o = L.pos[p.key], x = ox + o.x, y = oy + o.y, c = hex(NIV[p.nivel].c);
    doc.setFillColor(255, 255, 255); doc.setDrawColor(227, 230, 236); doc.setLineWidth(.25); doc.roundedRect(x, y, cw, ch, 2 * k, 2 * k, 'FD'); doc.setFillColor(...c); doc.rect(x, y, cw, 1.1 * k, 'F');
    const r = 7 * k, fx = x + cw / 2, fy = y + 3 * k + r;
    if (FC[p.key]) { doc.addImage(FC[p.key], 'PNG', fx - r, fy - r, 2 * r, 2 * r); } else { doc.setFillColor(...hex(corDe(p.key))); doc.circle(fx, fy, r, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9 * k); doc.text(iniciais(p.nome), fx, fy + 1.1 * k, { align:'center' }); }
    doc.setDrawColor(...c); doc.setLineWidth(.35 * k); doc.circle(fx, fy, r + .5 * k, 'S');
    let ty = fy + r + 4.2 * k; doc.setTextColor(20, 33, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6 * k); doc.splitTextToSize(tc(p.nome), cw - 3 * k).slice(0, 2).forEach(t => { doc.text(t, fx, ty, { align:'center' }); ty += 2.7 * k; });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.6 * k); doc.setTextColor(93, 106, 133); doc.splitTextToSize(tc(p.funcao), cw - 3 * k).slice(0, 2).forEach(t => { doc.text(t, fx, ty + .4 * k, { align:'center' }); ty += 2.4 * k; });
    doc.setFontSize(5.2 * k); doc.setTextColor(138, 148, 168);
    if (p.jovem) { doc.text(p.entidade, fx, ty + .9 * k, { align:'center' }); const t = 'JOVEM APRENDIZ', tw = doc.getTextWidth(t) + 3 * k; doc.setFillColor(241, 232, 248); doc.roundedRect(fx - tw / 2, y + ch - 4.6 * k, tw, 3.3 * k, 1.5 * k, 1.5 * k, 'F'); doc.setTextColor(90, 45, 130); doc.setFont('helvetica', 'bold'); doc.setFontSize(4.8 * k); doc.text(t, fx, y + ch - 2.2 * k, { align:'center' }); }
    else if (tempoCasa(p.adm)) doc.text(tempoCasa(p.adm) + ' de casa', fx, ty + .9 * k, { align:'center' }); });
  if (D) D.moldura(doc);
  const logo = window.CRV_LOGO ? await window.CRV_LOGO('logo-crv') : null; if (logo && logo.src) { try { const h = 11, w = h * logo.w / logo.h; doc.addImage(logo.src, 'PNG', W - 12 - w, 7, w, h); } catch(_){} }
  const blob = doc.output('blob'); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = 'Organograma do RH - ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.pdf'; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 3000);
}
const hex = h => { h = String(h).replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
window.addEventListener('resize', () => { if (location.hash === '#/organograma' && PESS.length) { const mob = window.innerWidth < 760; if (mob && VIEW === 'org' && !desenhar._man) { VIEW = 'lv'; desenhar(); } } });
return { tela };
};
