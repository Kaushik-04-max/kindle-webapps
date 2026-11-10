var app = KG.$('app');
var SHAPES = {
 P:{p:['M37 28a13 13 0 1 0 26 0a13 13 0 1 0 -26 0Z','M34 80C34 62 39 54 50 50C61 54 66 62 66 80Z','M26 80H74V90H26Z'],d:['M40 66H60']},
 R:{p:['M28 90V78H72V90Z','M34 78L37 48H63L66 78Z','M29 48V20H40V30H45V20H55V30H60V20H71V48Z'],d:['M37 48H63','M37 62H63']},
 N:{p:['M28 90V80C28 60 42 56 46 44C40 44 34 48 30 56L20 52C25 36 35 22 52 18L57 9L64 19C77 25 80 44 77 62L75 90Z'],d:['M54 30H54.5','M24 52L32 49','M44 62C50 58 58 56 62 50']},
 B:{p:['M43 12a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z','M50 20C68 32 70 46 59 56H41C30 46 32 32 50 20Z','M42 56L38 76H62L58 56Z','M26 76H74V90H26Z'],d:['M50 30V44','M43 37H57']},
 Q:{p:['M14 30a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z','M30 22a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z','M44 16a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z','M58 22a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z','M74 30a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z','M20 34L32 68H68L80 34L64 52L50 26L36 52Z','M28 68H72L74 80H26Z','M22 80H78V91H22Z'],d:['M32 68H68','M30 80H70']},
 K:{p:['M45 4H55V12H63V22H55V30H45V22H37V12H45Z','M50 30C72 30 80 46 71 60L69 72H31L29 60C20 46 28 30 50 30Z','M27 72H73V82H27Z','M22 82H78V92H22Z'],d:['M32 60H68','M30 72H70']}
};
var START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
var VAL = {P:100,N:320,B:335,R:500,Q:900,K:0};
function isW(p){ return p >= 'A' && p <= 'Z'; }
function fromStart(){
  var b = [], i, ch, rows = START.split('/'), r, k;
  for (r = 0; r < 8; r++) for (k = 0; k < rows[r].length; k++) {
    ch = rows[r].charAt(k);
    if (ch >= '1' && ch <= '8') { for (i = 0; i < +ch; i++) b.push(''); } else b.push(ch);
  }
  return { b: b, s: 'w', c: 'KQkq', e: -1, h: 0 };
}
function attacked(b, sq, byW){
  var r = sq >> 3, c = sq & 7, i, rr, cc, p, dr, dc, N = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
  var pr = byW ? r + 1 : r - 1, P = byW ? 'P' : 'p';
  if (pr >= 0 && pr < 8) { if (c > 0 && b[pr * 8 + c - 1] === P) return true; if (c < 7 && b[pr * 8 + c + 1] === P) return true; }
  var Kn = byW ? 'N' : 'n', Kg = byW ? 'K' : 'k';
  for (i = 0; i < 8; i++) { rr = r + N[i][0]; cc = c + N[i][1]; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === Kn) return true; }
  for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    rr = r + dr; cc = c + dc;
    if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === Kg) return true;
    var diag = dr && dc, Q = byW ? 'Q' : 'q', S = diag ? (byW ? 'B' : 'b') : (byW ? 'R' : 'r');
    while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
      p = b[rr * 8 + cc];
      if (p) { if (p === Q || p === S) return true; break; }
      rr += dr; cc += dc;
    }
  }
  return false;
}
function gen(st){
  var b = st.b, w = st.s === 'w', out = [], i, r, c, p, t, dr, dc, rr, cc, q, k, tt;
  function add(f, to, promo){
    if (promo) { out.push({f:f,t:to,pr:'q'},{f:f,t:to,pr:'r'},{f:f,t:to,pr:'b'},{f:f,t:to,pr:'n'}); } else out.push({f:f,t:to});
  }
  var KN = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
  for (i = 0; i < 64; i++) {
    p = b[i]; if (!p || isW(p) !== w) continue;
    r = i >> 3; c = i & 7; t = p.toUpperCase();
    if (t === 'P') {
      var d = w ? -1 : 1, home = w ? 6 : 1, last = w ? 0 : 7, r1 = r + d;
      if (r1 < 0 || r1 > 7) continue;
      if (!b[r1 * 8 + c]) { add(i, r1 * 8 + c, r1 === last); if (r === home && !b[(r + 2 * d) * 8 + c]) out.push({f:i,t:(r + 2 * d) * 8 + c}); }
      for (dc = -1; dc <= 1; dc += 2) {
        cc = c + dc; if (cc < 0 || cc > 7) continue; tt = r1 * 8 + cc;
        if (b[tt] && isW(b[tt]) !== w) add(i, tt, r1 === last); else if (tt === st.e) out.push({f:i,t:tt,ep:1});
      }
    } else if (t === 'N' || t === 'K') {
      var offs = [];
      if (t === 'N') offs = KN; else for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) if (dr || dc) offs.push([dr,dc]);
      for (k = 0; k < offs.length; k++) {
        rr = r + offs[k][0]; cc = c + offs[k][1]; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        tt = rr * 8 + cc; q = b[tt]; if (!q || isW(q) !== w) out.push({f:i,t:tt});
      }
    } else {
      for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var dg = dr && dc; if (t === 'B' && !dg) continue; if (t === 'R' && dg) continue;
        rr = r + dr; cc = c + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
          tt = rr * 8 + cc; q = b[tt];
          if (!q) out.push({f:i,t:tt}); else { if (isW(q) !== w) out.push({f:i,t:tt}); break; }
          rr += dr; cc += dc;
        }
      }
    }
  }
  var kr = w ? 56 : 0, KK = w ? 'K' : 'k', RK = w ? 'R' : 'r', rk = w ? 'K' : 'k', rq = w ? 'Q' : 'q';
  if (b[kr + 4] === KK && !attacked(b, kr + 4, !w)) {
    if (st.c.indexOf(rk) >= 0 && b[kr + 7] === RK && !b[kr + 5] && !b[kr + 6] && !attacked(b, kr + 5, !w) && !attacked(b, kr + 6, !w)) out.push({f:kr + 4,t:kr + 6,ca:1});
    if (st.c.indexOf(rq) >= 0 && b[kr] === RK && !b[kr + 1] && !b[kr + 2] && !b[kr + 3] && !attacked(b, kr + 3, !w) && !attacked(b, kr + 2, !w)) out.push({f:kr + 4,t:kr + 2,ca:1});
  }
  return out;
}
function apply(st, m){
  var b = st.b.slice(), p = b[m.f], w = isW(p), cap = b[m.t], c = st.c, e = -1;
  b[m.t] = m.pr ? (w ? m.pr.toUpperCase() : m.pr) : p; b[m.f] = '';
  if (m.ep) b[(m.f >> 3) * 8 + (m.t & 7)] = '';
  if (m.ca) { if (m.t > m.f) { b[m.f + 1] = b[m.f + 3]; b[m.f + 3] = ''; } else { b[m.f - 1] = b[m.f - 4]; b[m.f - 4] = ''; } }
  if (p === 'K') c = c.replace('K', '').replace('Q', '');
  if (p === 'k') c = c.replace('k', '').replace('q', '');
  if (m.f === 0 || m.t === 0) c = c.replace('q', '');
  if (m.f === 7 || m.t === 7) c = c.replace('k', '');
  if (m.f === 56 || m.t === 56) c = c.replace('Q', '');
  if (m.f === 63 || m.t === 63) c = c.replace('K', '');
  if ((p === 'P' || p === 'p') && Math.abs(m.t - m.f) === 16) e = (m.f + m.t) / 2;
  return { b: b, s: w ? 'b' : 'w', c: c, e: e, h: (cap || p === 'P' || p === 'p') ? 0 : st.h + 1 };
}
function kingPos(b, w){ var K = w ? 'K' : 'k', i; for (i = 0; i < 64; i++) if (b[i] === K) return i; return -1; }
function legal(st){
  var ms = gen(st), out = [], w = st.s === 'w', i, n;
  for (i = 0; i < ms.length; i++) { n = apply(st, ms[i]); if (!attacked(n.b, kingPos(n.b, w), !w)) out.push(ms[i]); }
  return out;
}
function inCheck(st){ var w = st.s === 'w'; return attacked(st.b, kingPos(st.b, w), !w); }
function insufficient(b){
  var i, n = 0, p;
  for (i = 0; i < 64; i++) { p = b[i]; if (!p) continue; p = p.toUpperCase(); if (p === 'P' || p === 'R' || p === 'Q') return false; if (p !== 'K') n++; }
  return n <= 1;
}
/* ---------- AI ---------- */
var nodes = 0, cap = 0, stop = false;
function evalSt(st){
  var b = st.b, s = 0, i, p, v, r, c, cen, w, t;
  for (i = 0; i < 64; i++) {
    p = b[i]; if (!p) continue;
    r = i >> 3; c = i & 7; w = isW(p); t = p.toUpperCase();
    v = VAL[t];
    cen = 3 - Math.max(Math.abs(c - 3.5) - 0.5, 0) - Math.max(Math.abs(r - 3.5) - 0.5, 0) * 0.5;
    if (t === 'P') v += (w ? 6 - r : r - 1) * 8 + cen * 3;
    else if (t === 'N' || t === 'B') v += cen * 8;
    else if (t === 'Q') v += cen * 2;
    s += w ? v : -v;
  }
  return st.s === 'w' ? s : -s;
}
function order(st, ms){
  var b = st.b, i, m, v;
  for (i = 0; i < ms.length; i++) { m = ms[i]; v = b[m.t] ? VAL[b[m.t].toUpperCase()] * 10 - VAL[b[m.f].toUpperCase()] : 0; if (m.pr === 'q') v += 800; m.o = v; }
  ms.sort(function (a, c) { return c.o - a.o; });
}
function qs(st, a, bt, d){
  var sp = evalSt(st); if (sp >= bt) return sp; if (d <= 0) return sp; if (sp > a) a = sp;
  var ms = legal(st), i, caps = [], sc;
  for (i = 0; i < ms.length; i++) if (st.b[ms[i].t] || ms[i].ep) caps.push(ms[i]);
  order(st, caps);
  for (i = 0; i < caps.length; i++) {
    nodes++; if (nodes > cap) { stop = true; return 0; }
    sc = -qs(apply(st, caps[i]), -bt, -a, d - 1); if (stop) return 0;
    if (sc >= bt) return sc; if (sc > a) a = sc;
  }
  return a;
}
function nega(st, d, a, bt){
  nodes++; if (nodes > cap) { stop = true; return 0; }
  var ms = legal(st);
  if (!ms.length) return inCheck(st) ? -90000 - d : 0;
  if (st.h >= 100) return 0;
  if (d <= 0) return qs(st, a, bt, 2);
  order(st, ms);
  var i, sc;
  for (i = 0; i < ms.length; i++) {
    sc = -nega(apply(st, ms[i]), d - 1, -bt, -a); if (stop) return 0;
    if (sc >= bt) return sc; if (sc > a) a = sc;
  }
  return a;
}
var LV = [{d:1,cap:400,noise:140},{d:2,cap:5000,noise:12},{d:4,cap:22000,noise:0}];
function think(st, lv){
  var L = LV[lv], ms = legal(st), best, d, i, sc, res, bestSc;
  order(st, ms); best = ms[0];
  cap = L.cap; nodes = 0; stop = false;
  for (d = 1; d <= L.d; d++) {
    res = null; bestSc = -999999;
    for (i = 0; i < ms.length; i++) {
      sc = -nega(apply(st, ms[i]), d - 1, -999999, 999999); if (stop) break;
      sc += KG.rand(L.noise + 1);
      if (sc > bestSc) { bestSc = sc; res = ms[i]; }
    }
    if (stop || !res) break;
    best = res;
    ms.sort(function (x, y) { return (y === best ? 1 : 0) - (x === best ? 1 : 0); });
  }
  return best;
}
/* ---------- UI ---------- */
var mode = KG.get('chess_mode', 0), level = KG.get('chess_lv', 1), human = KG.get('chess_side', 0);
var hist = [], cur, sel = -1, targets = [], last = null, over = null, busy = false, pend = null;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel), turnL = KG.el('div', 'l', '', r1), rr1 = KG.el('div', 'r', null, r1);
var bM = [KG.btn('vs AI', function () { setMode(0); }, rr1), KG.btn('2P', function () { setMode(1); }, rr1)];
KG.btn('Undo', undo, rr1);
KG.el('hr', 'rule', null, panel);
var msg = KG.el('div', 'msg', '', panel);
var boardBox = KG.el('div', 'center', null, panel);
var chooser = KG.el('div', 'center', null, panel);
KG.el('hr', 'rule', null, panel);
var r2 = KG.el('div', 'row', null, panel), l2 = KG.el('div', 'l', 'Level', r2), rr2 = KG.el('div', 'r', null, r2);
var bL = [], li, names = ['Easy', 'Normal', 'Hard'];
for (li = 0; li < 3; li++) (function (i) { bL[i] = KG.btn(names[i], function () { level = i; KG.set('chess_lv', i); KG.setOn(bL, i); }, rr2); })(li);
var r3 = KG.el('div', 'row', null, panel), l3 = KG.el('div', 'l', 'You play', r3), rr3 = KG.el('div', 'r', null, r3);
var bS = [KG.btn('White', function () { setSide(0); }, rr3), KG.btn('Black', function () { setSide(1); }, rr3)];
KG.btn('New game', newGame, rr3, 'on');
function setMode(m){ mode = m; KG.set('chess_mode', m); newGame(); }
function setSide(s){ human = s; KG.set('chess_side', s); newGame(); }
function newGame(){ cur = fromStart(); hist = []; sel = -1; targets = []; last = null; over = null; busy = false; pend = null; KG.clear(chooser); refresh(); maybeAI(); }
function flipped(){ return mode === 0 && human === 1; }
function sqXY(i){ var r = i >> 3, c = i & 7; if (flipped()) { r = 7 - r; c = 7 - c; } return [c * 100, r * 100]; }
function pieceSvg(p, x, y){
  var w = isW(p), sh = SHAPES[p.toUpperCase()], path = sh.p.join(' '), det = sh.d.join(' ');
  var g = '<g transform="translate(' + (x + 4) + ',' + (y + 4) + ') scale(.92)">';
  g += '<path d="' + path + '" fill="#fff" stroke="#fff" stroke-width="16" stroke-linejoin="round"/>';
  g += '<path d="' + path + '" fill="#000" stroke="#000" stroke-width="8" stroke-linejoin="round"/>';
  if (w) g += '<path d="' + path + '" fill="#fff"/>';
  g += '<path d="' + det + '" fill="none" stroke="' + (w ? '#000' : '#fff') + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
  return g + '</g>';
}
function draw(){
  var sz = KG.width(620), s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + sz + '" height="' + sz + '" viewBox="0 0 800 800">';
  s += '<defs><pattern id="dt" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#000"/><circle cx="9" cy="9" r="2.2" fill="#000"/></pattern></defs>';
  var i, xy, dark;
  for (i = 0; i < 64; i++) {
    xy = sqXY(i); dark = ((i >> 3) + (i & 7)) % 2 === 1;
    s += '<rect x="' + xy[0] + '" y="' + xy[1] + '" width="100" height="100" fill="#fff"/>';
    if (dark) s += '<rect x="' + xy[0] + '" y="' + xy[1] + '" width="100" height="100" fill="url(#dt)"/>';
  }
  if (last) for (i = 0; i < 2; i++) { xy = sqXY(i ? last.t : last.f); s += '<rect x="' + (xy[0] + 5) + '" y="' + (xy[1] + 5) + '" width="90" height="90" fill="none" stroke="#000" stroke-width="5" stroke-dasharray="14 8"/>'; }
  for (i = 0; i < 64; i++) if (cur.b[i]) { xy = sqXY(i); s += pieceSvg(cur.b[i], xy[0], xy[1]); }
  if (inCheck(cur) && !over) { xy = sqXY(kingPos(cur.b, cur.s === 'w')); s += '<circle cx="' + (xy[0] + 50) + '" cy="' + (xy[1] + 50) + '" r="47" fill="none" stroke="#000" stroke-width="7" stroke-dasharray="4 7"/>'; }
  if (sel >= 0) { xy = sqXY(sel); s += '<rect x="' + (xy[0] + 4) + '" y="' + (xy[1] + 4) + '" width="92" height="92" fill="none" stroke="#000" stroke-width="10"/>'; }
  for (i = 0; i < targets.length; i++) {
    xy = sqXY(targets[i]);
    if (cur.b[targets[i]]) s += '<rect x="' + (xy[0] + 3) + '" y="' + (xy[1] + 3) + '" width="94" height="94" fill="none" stroke="#000" stroke-width="9" stroke-dasharray="26 12"/>';
    else s += '<circle cx="' + (xy[0] + 50) + '" cy="' + (xy[1] + 50) + '" r="15" fill="#000" stroke="#fff" stroke-width="5"/>';
  }
  s += '<rect x="2" y="2" width="796" height="796" fill="none" stroke="#000" stroke-width="6"/></svg>';
  boardBox.innerHTML = s;
  boardBox.onclick = function (e){
    var rc = boardBox.getElementsByTagName('svg')[0].getBoundingClientRect();
    var x = (e.clientX - rc.left) / rc.width, y = (e.clientY - rc.top) / rc.height;
    if (x < 0 || x >= 1 || y < 0 || y >= 1) return;
    var c = Math.floor(x * 8), r = Math.floor(y * 8);
    if (flipped()) { c = 7 - c; r = 7 - r; }
    tap(r * 8 + c);
  };
}
function nameOf(s){ return s === 'w' ? 'WHITE' : 'BLACK'; }
function refresh(){
  var side = cur.s, t;
  if (!over) {
    var ms = legal(cur);
    if (!ms.length) over = inCheck(cur) ? { t: 'CHECKMATE! ' + nameOf(side === 'w' ? 'b' : 'w') + ' WINS' } : { t: 'STALEMATE: DRAW' };
    else if (insufficient(cur.b)) over = { t: 'DRAW: NOT ENOUGH PIECES' };
    else if (cur.h >= 100) over = { t: 'DRAW: 50-MOVE RULE' };
  }
  KG.clear(turnL);
  turnL.appendChild(document.createTextNode(over ? 'GAME OVER' : 'TURN: ' + nameOf(side) + (inCheck(cur) ? ' - CHECK!' : '')));
  KG.setOn(bM, mode); KG.setOn(bS, human); KG.setOn(bL, level);
  KG.clear(msg);
  if (over) t = over.t;
  else if (busy) t = 'Thinking...';
  else if (pend) t = 'Choose a piece to promote to:';
  else if (mode === 0 && side !== (human ? 'b' : 'w')) t = 'Waiting...';
  else t = 'Select a ' + (side === 'w' ? 'White' : 'Black') + ' piece, then tap a highlighted square.';
  msg.appendChild(document.createTextNode(t));
  draw();
}
function mineTurn(){ return mode === 1 || cur.s === (human ? 'b' : 'w'); }
function tap(i){
  if (over || busy || pend || !mineTurn()) return;
  var p = cur.b[i], w = cur.s === 'w';
  if (sel >= 0 && targets.indexOf(i) >= 0) {
    var cand = [], ms = legal(cur), k;
    for (k = 0; k < ms.length; k++) if (ms[k].f === sel && ms[k].t === i) cand.push(ms[k]);
    if (cand.length > 1) { pend = cand; showChooser(); refresh(); return; }
    play(cand[0]); return;
  }
  if (p && isW(p) === w) {
    sel = i; targets = [];
    var all = legal(cur), j;
    for (j = 0; j < all.length; j++) if (all[j].f === i) targets.push(all[j].t);
  } else { sel = -1; targets = []; }
  refresh();
}
function showChooser(){
  KG.clear(chooser);
  var o = [['Queen','q'],['Rook','r'],['Bishop','b'],['Knight','n']], k;
  for (k = 0; k < 4; k++) (function (x) {
    KG.btn(x[0], function () { var m = null, q; for (q = 0; q < pend.length; q++) if (pend[q].pr === x[1]) m = pend[q]; pend = null; KG.clear(chooser); play(m); }, chooser);
  })(o[k]);
}
function play(m){
  hist.push({ st: cur, last: last });
  cur = apply(cur, m); last = m; sel = -1; targets = [];
  refresh(); maybeAI();
}
function maybeAI(){
  if (mode !== 0 || over || cur.s === (human ? 'b' : 'w')) return;
  busy = true; refresh();
  setTimeout(function () {
    var m = think(cur, level); busy = false;
    if (m) play(m); else refresh();
  }, 60);
}
function undo(){
  if (busy || !hist.length) return;
  var h = hist.pop(); cur = h.st; last = h.last;
  if (mode === 0 && cur.s !== (human ? 'b' : 'w') && hist.length) { h = hist.pop(); cur = h.st; last = h.last; }
  over = null; sel = -1; targets = []; pend = null; KG.clear(chooser); refresh(); maybeAI();
}
newGame();
if (location.search.indexOf('test') >= 0) window.__chess = { fromStart: fromStart, legal: legal, apply: apply };
