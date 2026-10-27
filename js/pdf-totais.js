/* Totais no fim dos relatórios em PDF (pedido do RH, 27/10/2026):
   toda tabela de pessoas sai com a quantidade de pessoas na última linha e, se tiver valores em R$, a soma.
   Funciona por cima do jsPDF-AutoTable: no app e dentro de cada painel (o app injeta este código em todos).
   Tabelas que já têm linha de total (foot) ficam como estão. Para desligar numa tabela: opção semTotal:true. */
window.CRV_TOTAIS_PDF = function(w){
  'use strict';
  try {
    const J = w.jspdf && w.jspdf.jsPDF; if (!J || !J.API || typeof J.API.autoTable !== 'function' || J.API.autoTable.__crvTot) return;
    const orig = J.API.autoTable;
    const txt = c => c == null ? '' : typeof c === 'object' ? String(c.content != null ? c.content : c.v != null ? c.v : '') : String(c);
    const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const PESSOA = /^(nome|colaborador|colaboradora|aprendiz|jovem|titular|funcionario|pessoa|beneficiario|candidato|motorista|dependente|participante|lider)\b/;
    const MAT = /^(mat\b|mat\.|matr|matricula|codigo do funcionario|cod\. func)/;
    const DIN = /(valor|r\$|salario|desconto|mensalidade|copart|pago|previsto|a receber|gratifica|custo|parcela|total|vale)/;
    const NAO = /(%|percent|\bqtd|\bquant|\bdias\b|\bhoras\b|\bidade\b|\bnota|\bpontos\b|\bano\b|\bn[ºo°])/;
    const num = s => { let t = String(s).replace(/R\$\s*/i, '').replace(/\s/g, ''); if (!/^-?[\d.,]+$/.test(t)) return null; if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else if (/\.\d{3}(\.|$)/.test(t)) t = t.replace(/\./g, ''); const v = parseFloat(t); return isNaN(v) ? null : v; };
    const brl = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
    function comTotal(o){
      if (!o || typeof o !== 'object' || o.semTotal || o.foot || !Array.isArray(o.body) || o.body.length < 1) return o;
      const head = Array.isArray(o.head) && o.head.length ? o.head[o.head.length - 1] : null; if (!Array.isArray(head)) return o;
      const H = head.map(c => norm(txt(c)));
      const iM = H.findIndex(h => MAT.test(h)), iP = H.findIndex(h => PESSOA.test(h));
      if (iM < 0 && iP < 0) return o;   // não é uma tabela de pessoas
      const rows = o.body.filter(r => Array.isArray(r) && r.length >= H.length - 1 && !/^(total|subtotal)/i.test(txt(r[0]).trim()));
      if (!rows.length) return o;
      const chave = r => { const m = iM >= 0 ? txt(r[iM]).trim() : '', n = iP >= 0 ? norm(txt(r[iP])) : ''; return m && m !== '-' && m !== '–' ? 'm' + m : n ? 'n' + n : ''; };
      const ks = new Set(rows.map(chave).filter(Boolean)), np = ks.size || rows.length;
      const foot = H.map(() => '');
      H.forEach((h, i) => { if (!DIN.test(h) || NAO.test(h)) return; let s = 0, ok = 0, rs = false;
        for (const r of rows) { const t = txt(r[i]).trim(); if (!t || t === '-' || t === '–') continue; const v = num(t); if (v == null) { ok = -1; break; } s += v; ok++; if (/R\$/i.test(t) || /,\d{2}$/.test(t)) rs = true; }
        if (ok > 0) foot[i] = rs || /r\$|valor|salario|desconto|mensalidade|copart|pago|previsto|receber|gratifica|custo|parcela/.test(h) ? brl(s) : s.toLocaleString('pt-BR'); });
      const lab = 'Total: ' + np + (np === 1 ? ' pessoa' : ' pessoas') + (rows.length !== np ? ' · ' + rows.length + ' registros' : '');
      let span = Math.max(iP, iM, 0) + 1; const fm = foot.findIndex(f => f); if (fm >= 0 && fm < span) span = Math.max(1, fm);
      const row = [{ content:lab, colSpan:span, styles:{ halign:'left' } }].concat(foot.slice(span));
      const fs = Object.assign({ fillColor:[238, 241, 245], textColor:[20, 33, 61], fontStyle:'bold' }, o.footStyles || {});
      return Object.assign({}, o, { foot:[row], showFoot:'lastPage', footStyles:fs });
    }
    J.API.autoTable = function(){ const a = Array.prototype.slice.call(arguments); if (a.length === 1 && a[0] && typeof a[0] === 'object' && !Array.isArray(a[0])) { try { a[0] = comTotal(a[0]); } catch(_){} } return orig.apply(this, a); };
    J.API.autoTable.__crvTot = true;
    if (typeof w.jspdf.autoTable === 'function' && !w.jspdf.autoTable.__crvTot) { const o2 = w.jspdf.autoTable; w.jspdf.autoTable = function(doc, o){ try { o = comTotal(o); } catch(_){} return o2.call(this, doc, o); }; w.jspdf.autoTable.__crvTot = true; }
  } catch(e){ try { console.warn('totais pdf', e); } catch(_){} }
};
window.CRV_TOTAIS_PDF(window);
