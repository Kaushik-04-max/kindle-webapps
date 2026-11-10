var KG = {
  $: function (id) { return document.getElementById(id); },
  el: function (tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.appendChild(document.createTextNode(text));
    if (parent) parent.appendChild(e);
    return e;
  },
  btn: function (text, fn, parent, cls) {
    var b = KG.el('span', 'btn' + (cls ? ' ' + cls : ''), text, parent);
    b.onclick = fn;
    return b;
  },
  get: function (k, d) { try { var v = window.localStorage.getItem('kg_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { window.localStorage.setItem('kg_' + k, JSON.stringify(v)); } catch (e) {} },
  rand: function (n) { return Math.floor(Math.random() * n); },
  shuffle: function (a) { for (var i = a.length - 1; i > 0; i--) { var j = KG.rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
  width: function (max) {
    var w = window.innerWidth || document.documentElement.clientWidth || 600;
    return Math.min(w - 44, max || 640);
  },
  clear: function (e) { while (e.firstChild) e.removeChild(e.firstChild); },
  setOn: function (list, i) { for (var k = 0; k < list.length; k++) list[k].className = 'btn' + (k === i ? ' on' : ''); },
  // grid table: returns {t:table, c:[[td]]}
  grid: function (rows, cols, size, parent, onTap) {
    var t = KG.el('table', 'grid', null, parent), c = [], r, k;
    for (r = 0; r < rows; r++) {
      var tr = document.createElement('tr'); c[r] = [];
      for (k = 0; k < cols; k++) {
        var td = document.createElement('td');
        td.style.width = size + 'px'; td.style.height = size + 'px';
        td.style.fontSize = Math.floor(size * 0.55) + 'px';
        (function (rr, kk) { td.onclick = function () { onTap(rr, kk); }; })(r, k);
        tr.appendChild(td); c[r][k] = td;
      }
      t.appendChild(tr);
    }
    return { t: t, c: c };
  },
  suit: function (s, px) {
    var P = { H: 'M10 18C2 12 1 8 1 5.5A4.5 4.5 0 0 1 10 4A4.5 4.5 0 0 1 19 5.5C19 8 18 12 10 18Z', D: 'M10 1L18 10L10 19L2 10Z', S: 'M10 1C16 7 19 10 19 13A4.5 4.5 0 0 1 11 15.5L13 19H7L9 15.5A4.5 4.5 0 0 1 1 13C1 10 4 7 10 1Z', C: 'M10 0.5a4.5 4.5 0 1 0 0.01 0ZM4.5 7.5a4.5 4.5 0 1 0 0.01 0ZM15.5 7.5a4.5 4.5 0 1 0 0.01 0ZM9 10L7.5 19H12.5L11 10Z' };
    var red = (s === 'H' || s === 'D');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 20 20"><path d="' + P[s] + '" fill="' + (red ? '#fff' : '#000') + '" stroke="#000" stroke-width="' + (red ? 1.6 : 0.5) + '"/></svg>';
  },
  card: function (rank, s, w) {
    var h = Math.floor(w * 1.4);
    return '<div style="display:inline-block;vertical-align:top;margin:3px;width:' + w + 'px;height:' + h + 'px;border:3px solid #000;background:#fff;text-align:center;line-height:1"><div style="font-size:' + Math.floor(w * 0.36) + 'px;margin-top:4px">' + rank + '</div><div style="margin-top:' + Math.floor(w * 0.08) + 'px">' + KG.suit(s, Math.floor(w * 0.5)) + '</div></div>';
  },
  cardBack: function (w) {
    var h = Math.floor(w * 1.4);
    return '<div style="display:inline-block;vertical-align:top;margin:3px;width:' + w + 'px;height:' + h + 'px;border:3px solid #000;background:#000;color:#fff;text-align:center;line-height:' + h + 'px;font-size:' + Math.floor(w * 0.5) + 'px">?</div>';
  },
  sys: function (name, def, parent, opts, onPick) {
    // option row helper: opts array of labels; remembers choice
    var cur = KG.get(name, def), btns = [], i;
    for (i = 0; i < opts.length; i++) (function (i) {
      btns[i] = KG.btn(opts[i], function () { KG.set(name, i); KG.setOn(btns, i); onPick(i); }, parent);
    })(i);
    KG.setOn(btns, cur);
    return cur;
  }
};
