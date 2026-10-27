/* Totais no fim dos relatórios em PDF (pedido do RH, 27/10/2026):
   toda tabela de pessoas sai com a quantidade de pessoas na última linha e, se tiver valores em R$, a soma.
   Funciona por cima do jsPDF-AutoTable: no app e dentro de cada painel (o app injeta este código em todos).
   Tabelas que já têm linha de total (foot) ficam como estão. Para desligar numa tabela: opção semTotal:true. */
window.CRV_TOTAIS_PDF = function(w){
  'use strict';
  /* Excel: ao montar a planilha (XLSX.utils.book_append_sheet), tabela de pessoas ganha a linha de total no fim */
  try {
    const X = w.XLSX;
    if (X && X.utils && typeof X.utils.book_append_sheet === 'function' && !X.utils.book_append_sheet.__crvTot) {
      const ap = X.utils.book_append_sheet;
      const nz = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
      const PES = /^(nome|colaborador|colaboradora|aprendiz|jovem|titular|funcionario|pessoa|beneficiario|candidato|motorista|dependente|participante|lider)\b/;
      const MT = /^(mat\b|mat\.|matr|matricula|codigo - matricula|codigo do funcionario)/;
      const DN = /(valor|r\$|salario|desconto|mensalidade|copart|pago|previsto|a receber|gratifica|custo|parcela|total|vale)/;
      const NO = /(%|percent|\bqtd|\bquant|\bdias\b|\bhoras\b|\bidade\b|\bnota|\bpontos\b|\bano\b|\bn[ºo°])/;
      const nb = c => { if (!c) return null; if (c.t === 'n' && typeof c.v === 'number') return c.v; let t = String(c.v == null ? '' : c.v).replace(/R\$\s*/i, '').replace(/\s/g, ''); if (!/^-?[\d.,]+$/.test(t)) return null; if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else if (/\.\d{3}(\.|$)/.test(t)) t = t.replace(/\./g, ''); const v = parseFloat(t); return isNaN(v) ? null : v; };
      const total = ws => { if (!ws || !ws['!ref'] || ws.__crvTot) return; const R = X.utils.decode_range(ws['!ref']); const cel = (r, c) => ws[X.utils.encode_cell({ r, c })];
        let hr = -1, iM = -1, iN = -1;
        for (let r = R.s.r; r <= Math.min(R.e.r, R.s.r + 12) && hr < 0; r++) { let m = -1, n = -1, cheios = 0; for (let c = R.s.c; c <= R.e.c; c++) { const v = cel(r, c); if (!v || v.v === '' || v.v == null) continue; cheios++; const h = nz(v.v); if (m < 0 && MT.test(h)) m = c; if (n < 0 && PES.test(h)) n = c; } if (cheios >= 2 && (m >= 0 || n >= 0)) { hr = r; iM = m; iN = n; } }
        if (hr < 0) return; const rows = [];
        for (let r = hr + 1; r <= R.e.r; r++) { let vazio = true; for (let c = R.s.c; c <= R.e.c; c++) { const v = cel(r, c); if (v && v.v !== '' && v.v != null) { vazio = false; break; } }
          if (vazio) { for (let r2 = r + 1; r2 <= R.e.r; r2++) for (let c = R.s.c; c <= R.e.c; c++) { const v = cel(r2, c); if (v && v.v !== '' && v.v != null) return; } break; } // mais de um bloco: não mexe
          const c0 = cel(r, R.s.c); if (c0 && /^(total|subtotal)/i.test(String(c0.v).trim())) return; rows.push(r); }
        if (!rows.length) return;
        const ch = r => { const m = iM >= 0 ? cel(r, iM) : null, n = iN >= 0 ? cel(r, iN) : null; const mv = m ? String(m.v).trim() : ''; return mv && mv !== '-' ? 'm' + mv : n ? 'n' + nz(n.v) : ''; };
        const ks = new Set(rows.map(ch).filter(Boolean)), np = ks.size || rows.length, tr = R.e.r + 1, lc = iN >= 0 ? iN : iM;
        for (let c = R.s.c; c <= R.e.c; c++) { if (c === lc) continue; const h = nz((cel(hr, c) || {}).v); if (!DN.test(h) || NO.test(h)) continue; let s = 0, k = 0, z = null, bad = false;
          for (const r of rows) { const v = cel(r, c); if (!v || v.v === '' || v.v == null || v.v === '-') continue; const x = nb(v); if (x == null) { bad = true; break; } s += x; k++; if (v.z) z = v.z; }
          if (!bad && k) ws[X.utils.encode_cell({ r:tr, c })] = { t:'n', v:Math.round(s * 100) / 100, z: z || '"R$" #,##0.00' }; }
        ws[X.utils.encode_cell({ r:tr, c:lc })] = { t:'s', v:'Total: ' + np + (np === 1 ? ' pessoa' : ' pessoas') + (rows.length !== np ? ' · ' + rows.length + ' registros' : '') };
        R.e.r = tr; ws['!ref'] = X.utils.encode_range(R); ws.__crvTot = true; };
      X.utils.book_append_sheet = function(wb, ws){ try { if (!(arguments[3] && arguments[3].semTotal)) total(ws); } catch(_){} return ap.apply(this, arguments); };
      X.utils.book_append_sheet.__crvTot = true;
    }
  } catch(e){ try { console.warn('totais excel', e); } catch(_){} }
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
