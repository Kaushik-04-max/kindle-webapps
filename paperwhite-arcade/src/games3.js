//@@ checkers
var lvl = KG.get('ck_l', 1), b, turn, over, sel = null, cells, sz, note = '';
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('ck_l', 0); reset(); }, rr1), KG.btn('Normal', function () { lvl = 1; KG.set('ck_l', 1); reset(); }, rr1), KG.btn('Hard', function () { lvl = 2; KG.set('ck_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
KG.el('div', 'foot', 'You are solid black and move up. Captures are compulsory. Reach the far row to become a king (K).', panel);
function inb(r, c){ return r >= 0 && r < 8 && c >= 0 && c < 8; }
function cp(bd){ var o = [], i; for (i = 0; i < 8; i++) o.push(bd[i].slice()); return o; }
function seqFrom(bd, r0, c0, s){
  var out = [], p = bd[r0][c0], endRow = s === 1 ? 0 : 7;
  bd[r0][c0] = 0;
  function dfs(r, c, king, path, caps){
    var dirs = king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (s === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]), i, any = false;
    for (i = 0; i < dirs.length; i++) {
      var dr = dirs[i][0], dc = dirs[i][1], mr = r + dr, mc = c + dc, tr = r + 2 * dr, tc = c + 2 * dc;
      if (!inb(tr, tc) || bd[mr][mc] * s >= 0 || bd[tr][tc] || caps.indexOf(mr * 8 + mc) >= 0) continue;
      any = true; var nk = king || tr === endRow, np = path.concat([[tr, tc]]), nc = caps.concat([mr * 8 + mc]);
      if (nk && !king) out.push({ path: np, caps: nc }); else dfs(tr, tc, nk, np, nc);
    }
    if (!any && path.length > 1) out.push({ path: path, caps: caps });
  }
  dfs(r0, c0, Math.abs(p) === 2, [[r0, c0]], []);
  bd[r0][c0] = p; return out;
}
function allMoves(bd, s){
  var jumps = [], simple = [], r, c, p, i;
  for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { p = bd[r][c]; if (p * s <= 0) continue;
    jumps = jumps.concat(seqFrom(bd, r, c, s));
    var dirs = Math.abs(p) === 2 ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (s === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
    for (i = 0; i < dirs.length; i++) { var tr = r + dirs[i][0], tc = c + dirs[i][1]; if (inb(tr, tc) && !bd[tr][tc]) simple.push({ path: [[r, c], [tr, tc]], caps: [] }); } }
  return jumps.length ? jumps : simple;
}
function doMove(bd, m, s){
  var f = m.path[0], t = m.path[m.path.length - 1], p = bd[f[0]][f[1]], i;
  bd[f[0]][f[1]] = 0; for (i = 0; i < m.caps.length; i++) bd[(m.caps[i] / 8) | 0][m.caps[i] % 8] = 0;
  if (t[0] === (s === 1 ? 0 : 7)) p = 2 * s; bd[t[0]][t[1]] = p;
}
function ev(bd){ var s = 0, r, c, p; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { p = bd[r][c]; if (!p) continue; var v = Math.abs(p) === 2 ? 170 : 100 + (p < 0 ? r : 7 - r) * 4; s += p < 0 ? v : -v; } return s; }
function mm(bd, d, a, bt, s){
  var ms = allMoves(bd, s); if (!ms.length) return s === -1 ? -9000 - d : 9000 + d; if (d === 0) return ev(bd);
  var i, v, nb;
  for (i = 0; i < ms.length; i++) { nb = cp(bd); doMove(nb, ms[i], s); v = mm(nb, d - 1, a, bt, -s); if (s === -1) { if (v > a) a = v; } else if (v < bt) bt = v; if (a >= bt) break; }
  return s === -1 ? a : bt;
}
function reset(){
  var r, c; b = []; for (r = 0; r < 8; r++) { b[r] = []; for (c = 0; c < 8; c++) b[r][c] = ((r + c) % 2 === 1) ? (r < 3 ? -1 : r > 4 ? 1 : 0) : 0; }
  turn = 1; over = ''; sel = null; note = ''; KG.setOn(bl, lvl); sz = Math.floor(KG.width(640) / 8); KG.clear(box); cells = KG.grid(8, 8, sz, box, tap); draw();
}
function tap(r, c){
  if (over || turn !== 1) return;
  var ms = allMoves(b, 1), i, p = b[r][c];
  if (sel) for (i = 0; i < ms.length; i++) { var m = ms[i], e = m.path[m.path.length - 1]; if (m.path[0][0] === sel[0] && m.path[0][1] === sel[1] && e[0] === r && e[1] === c) { doMove(b, m, 1); sel = null; turn = -1; note = ''; after(); return; } }
  sel = null; note = '';
  if (p * 1 > 0) { for (i = 0; i < ms.length; i++) if (ms[i].path[0][0] === r && ms[i].path[0][1] === c) { sel = [r, c]; break; } if (!sel) note = ms.length && ms[0].caps.length ? 'You must make a capture.' : 'That piece cannot move.'; }
  draw();
}
function after(){
  var ms = allMoves(b, turn); if (!ms.length) { over = turn === 1 ? 'AI wins.' : 'You win!'; draw(); return; }
  draw(); if (turn === -1) setTimeout(aiGo, 300);
}
function aiGo(){
  var ms = allMoves(b, -1), best = null, bv = -99999, i, v, nb, d = [1, 4, 6][lvl];
  for (i = 0; i < ms.length; i++) { nb = cp(b); doMove(nb, ms[i], -1); v = mm(nb, d - 1, -99999, 99999, 1) + (lvl === 0 ? KG.rand(150) : KG.rand(3)); if (v > bv) { bv = v; best = ms[i]; } }
  doMove(b, best, -1); turn = 1; after();
}
function draw(){
  var r, c, t, p, d = Math.floor(sz * 0.72), dests = [], i, ms = turn === 1 ? allMoves(b, 1) : [];
  if (sel) for (i = 0; i < ms.length; i++) if (ms[i].path[0][0] === sel[0] && ms[i].path[0][1] === sel[1]) dests.push(ms[i].path[ms[i].path.length - 1]);
  for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
    t = cells.c[r][c]; p = b[r][c]; t.style.background = (r + c) % 2 ? '#bbb' : '#fff'; var h = '', kk = Math.abs(p) === 2 ? 'K' : '', isSel = sel && sel[0] === r && sel[1] === c;
    if (p > 0) h = '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#000;color:#fff;line-height:' + d + 'px;font-size:' + Math.floor(d * 0.55) + 'px;' + (isSel ? 'border:5px double #fff;box-shadow:0 0 0 4px #000;' : '') + '">' + kk + '</div>';
    else if (p < 0) h = '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#fff;color:#000;border:4px solid #000;line-height:' + (d - 8) + 'px;font-size:' + Math.floor(d * 0.55) + 'px">' + kk + '</div>';
    t.innerHTML = h;
  }
  for (i = 0; i < dests.length; i++) cells.c[dests[i][0]][dests[i][1]].innerHTML = '<div style="margin:auto;width:' + Math.floor(sz * 0.3) + 'px;height:' + Math.floor(sz * 0.3) + 'px;border-radius:50%;background:#000"></div>';
  KG.clear(msg); msg.appendChild(document.createTextNode(over || note || (turn === 1 ? 'Your move.' : 'AI thinking...')));
}
reset();
//@@ mancala
var lvl = KG.get('mc_l', 1), s, turn, over, cells, sz, msgT = '';
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('mc_l', 0); reset(); }, rr1), KG.btn('Normal', function () { lvl = 1; KG.set('mc_l', 1); reset(); }, rr1), KG.btn('Hard', function () { lvl = 2; KG.set('mc_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
KG.el('div', 'foot', 'Tap one of your pits (bottom row). Seeds go anticlockwise. End in your store (right) for a free turn; end in an empty pit of yours to capture.', panel);
function sow(st, i, side){
  var a = st.slice(), n = a[i], skip = side === 0 ? 13 : 6, k = i, own0 = side === 0 ? 0 : 7, store = side === 0 ? 6 : 13;
  a[i] = 0; while (n > 0) { k = (k + 1) % 14; if (k === skip) continue; a[k]++; n--; }
  var extra = k === store;
  if (!extra && k >= own0 && k < own0 + 6 && a[k] === 1 && a[12 - k] > 0) { a[store] += a[k] + a[12 - k]; a[k] = 0; a[12 - k] = 0; }
  return { s: a, extra: extra };
}
function empt(a, side){ var o = side === 0 ? 0 : 7, i; for (i = o; i < o + 6; i++) if (a[i]) return false; return true; }
function sweep(a){ var i; if (empt(a, 0) || empt(a, 1)) { for (i = 0; i < 6; i++) { a[6] += a[i]; a[i] = 0; a[13] += a[7 + i]; a[7 + i] = 0; } return true; } return false; }
function mm(a, d, side){
  var o = side === 0 ? 0 : 7, best = side === 1 ? -999 : 999, i, any = false, r, b2, v;
  for (i = o; i < o + 6; i++) if (a[i]) { any = true; r = sow(a, i, side); b2 = r.s; if (sweep(b2)) v = b2[13] - b2[6]; else if (d <= 0) v = b2[13] - b2[6]; else v = mm(b2, d - 1, r.extra ? side : 1 - side);
    if (side === 1 ? v > best : v < best) best = v; }
  return any ? best : a[13] - a[6];
}
function reset(){ s = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]; turn = 0; over = ''; msgT = ''; KG.setOn(bl, lvl); draw(); }
function tap(i){
  if (over || turn !== 0 || i > 5 || !s[i]) return;
  var r = sow(s, i, 0); s = r.s; msgT = r.extra ? 'Free turn! Go again.' : '';
  if (sweep(s)) return finish(); turn = r.extra ? 0 : 1; draw(); if (turn === 1) setTimeout(aiGo, 500);
}
function aiGo(){
  var best = -1, bv = -9999, i, r, v, cand = [];
  for (i = 7; i < 13; i++) if (s[i]) cand.push(i);
  for (i = 0; i < cand.length; i++) { r = sow(s, cand[i], 1); var b2 = r.s;
    if (lvl === 0) v = KG.rand(100); else if (lvl === 1) v = (b2[13] - s[13]) * 10 + (r.extra ? 15 : 0) + KG.rand(5); else v = sweep(b2) ? b2[13] - b2[6] : mm(b2, 5, r.extra ? 1 : 0);
    if (v > bv) { bv = v; best = cand[i]; } }
  var rr = sow(s, best, 1); s = rr.s; msgT = rr.extra ? 'AI got a free turn.' : '';
  if (sweep(s)) return finish(); turn = rr.extra ? 1 : 0; draw(); if (turn === 1) setTimeout(aiGo, 600);
}
function finish(){ over = s[6] > s[13] ? 'You win ' + s[6] + ' to ' + s[13] + '!' : s[6] < s[13] ? 'AI wins ' + s[13] + ' to ' + s[6] + '.' : 'Draw ' + s[6] + ' - ' + s[13]; draw(); }
function draw(){
  var w = KG.width(640), u = Math.floor(w / 8), h = '<table style="margin:0 auto;border-collapse:separate;border-spacing:4px"><tr><td rowspan="2" style="' + st(u, u * 2 + 4, 1) + '">' + s[13] + '<div style="font-size:14px">AI</div></td>', i;
  for (i = 12; i >= 7; i--) h += '<td style="' + st(u, u, 0) + '">' + s[i] + '</td>';
  h += '<td rowspan="2" style="' + st(u, u * 2 + 4, 1) + '">' + s[6] + '<div style="font-size:14px">YOU</div></td></tr><tr>';
  for (i = 0; i < 6; i++) h += '<td id="p' + i + '" style="' + st(u, u, 0) + (turn === 0 && !over && s[i] ? ';background:#000;color:#fff' : '') + '">' + s[i] + '</td>';
  box.innerHTML = h + '</tr></table>';
  for (i = 0; i < 6; i++) (function (k) { KG.$('p' + k).onclick = function () { tap(k); }; })(i);
  KG.clear(msg); msg.appendChild(document.createTextNode(over || (turn === 0 ? 'Your move. ' : 'AI thinking... ') + msgT));
}
function st(w, h, store){ return 'width:' + w + 'px;height:' + h + 'px;border:3px solid #000;border-radius:' + (store ? 24 : 50) + '%;text-align:center;font-size:' + Math.floor(w * 0.5) + 'px;cursor:pointer;' + (store ? 'background:#ddd' : ''); }
reset();
//@@ gomoku
var N = 15, lvl = KG.get('gm_l', 1), b, over, turn, cells, sz, lastM = null;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('gm_l', 0); reset(); }, rr1), KG.btn('Normal', function () { lvl = 1; KG.set('gm_l', 1); reset(); }, rr1), KG.btn('Hard', function () { lvl = 2; KG.set('gm_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
KG.el('div', 'foot', 'Get five in a row (any direction) before the AI. You are black.', panel);
var DR = [[0,1],[1,0],[1,1],[1,-1]];
function line(r, c, p){
  var t = 0, d, k, cnt, open, rr, cc;
  for (d = 0; d < 4; d++) { cnt = 1; open = 0;
    for (k = 1; k < 5; k++) { rr = r + DR[d][0] * k; cc = c + DR[d][1] * k; if (rr < 0 || rr >= N || cc < 0 || cc >= N) break; if (b[rr][cc] === p) cnt++; else { if (!b[rr][cc]) open++; break; } }
    for (k = 1; k < 5; k++) { rr = r - DR[d][0] * k; cc = c - DR[d][1] * k; if (rr < 0 || rr >= N || cc < 0 || cc >= N) break; if (b[rr][cc] === p) cnt++; else { if (!b[rr][cc]) open++; break; } }
    if (cnt >= 5) t += 100000; else if (cnt === 4) t += open === 2 ? 10000 : open === 1 ? 1000 : 0; else if (cnt === 3) t += open === 2 ? 1000 : open === 1 ? 100 : 0; else if (cnt === 2) t += open === 2 ? 100 : open === 1 ? 10 : 0; else t += open; }
  return t;
}
function five(r, c, p){ var d, k, cnt, rr, cc; for (d = 0; d < 4; d++) { cnt = 1; for (k = 1; k < 5; k++) { rr = r + DR[d][0] * k; cc = c + DR[d][1] * k; if (rr < 0 || rr >= N || cc < 0 || cc >= N || b[rr][cc] !== p) break; cnt++; } for (k = 1; k < 5; k++) { rr = r - DR[d][0] * k; cc = c - DR[d][1] * k; if (rr < 0 || rr >= N || cc < 0 || cc >= N || b[rr][cc] !== p) break; cnt++; } if (cnt >= 5) return true; } return false; }
function reset(){
  var r, c; b = []; for (r = 0; r < N; r++) { b[r] = []; for (c = 0; c < N; c++) b[r][c] = 0; }
  over = ''; turn = 1; lastM = null; KG.setOn(bl, lvl); sz = Math.floor(KG.width(660) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, tap);
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) cells.c[r][c].style.border = '1px solid #000';
  draw();
}
function full(){ for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (!b[r][c]) return false; return true; }
function tap(r, c){
  if (over || turn !== 1 || b[r][c]) return; b[r][c] = 1; lastM = [r, c];
  if (five(r, c, 1)) { over = 'You win!'; draw(); return; } if (full()) { over = 'Draw.'; draw(); return; }
  turn = 2; draw(); setTimeout(aiGo, 150);
}
function aiGo(){
  var r, c, best = -1, br = 7, bc = 7, any = false, v, dr, dc, near, W = [0.5, 0.9, 1.1][lvl], noise = [4000, 40, 5][lvl];
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (b[r][c]) any = true;
  if (any) for (r = 0; r < N; r++) for (c = 0; c < N; c++) { if (b[r][c]) continue; near = false;
    for (dr = -2; dr <= 2 && !near; dr++) for (dc = -2; dc <= 2; dc++) { var rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr][cc]) { near = true; break; } }
    if (!near) continue; v = line(r, c, 2) + line(r, c, 1) * W + KG.rand(noise); if (v > best) { best = v; br = r; bc = c; } }
  b[br][bc] = 2; lastM = [br, bc];
  if (five(br, bc, 2)) over = 'AI wins.'; else if (full()) over = 'Draw.'; else turn = 1; draw();
}
function draw(){
  var r, c, t, p, d = Math.floor(sz * 0.78);
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) { t = cells.c[r][c]; p = b[r][c]; var lm = lastM && lastM[0] === r && lastM[1] === c;
    t.style.background = '#fff';
    t.innerHTML = p === 1 ? '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#000;' + (lm ? 'box-shadow:0 0 0 3px #fff,0 0 0 6px #000' : '') + '"></div>' : p === 2 ? '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#fff;border:3px solid #000;' + (lm ? 'box-shadow:0 0 0 3px #fff,0 0 0 6px #000' : '') + '"></div>' : '<div style="margin:auto;width:4px;height:4px;background:#000"></div>'; }
  KG.clear(msg); msg.appendChild(document.createTextNode(over || (turn === 1 ? 'Your move.' : 'AI thinking...')));
}
reset();
//@@ battleship
var lvl = KG.get('bs_l', 1), SH = [['Carrier', 5], ['Battleship', 4], ['Cruiser', 3], ['Submarine', 3], ['Destroyer', 2]], me, en, ms2, es, over, note = '', cellsE, cellsM, szE, szM;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('bs_l', 0); reset(); }, rr1), KG.btn('Normal', function () { lvl = 1; KG.set('bs_l', 1); reset(); }, rr1), KG.btn('Hard', function () { lvl = 2; KG.set('bs_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel);
KG.el('div', 'center', 'ENEMY WATERS - tap to fire', panel);
var boxE = KG.el('div', 'center', null, panel); boxE.style.marginTop = '6px';
KG.el('div', 'center', 'YOUR FLEET', panel).style.marginTop = '12px';
var boxM = KG.el('div', 'center', null, panel); boxM.style.marginTop = '6px';
var nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px'; KG.btn('New game', reset, nb, 'on');
function newFleet(){
  var g = [], ships = [], r, c, i; for (r = 0; r < 10; r++) { g[r] = []; for (c = 0; c < 10; c++) g[r][c] = -1; }
  for (i = 0; i < 5; i++) { var ok = false; while (!ok) { var hz = KG.rand(2), len = SH[i][1], r0 = KG.rand(hz ? 10 : 11 - len), c0 = KG.rand(hz ? 11 - len : 10), cs = [], k; ok = true;
    for (k = 0; k < len; k++) { var rr = r0 + (hz ? 0 : k), cc = c0 + (hz ? k : 0); if (g[rr][cc] >= 0) { ok = false; break; } cs.push([rr, cc]); }
    if (ok) { for (k = 0; k < len; k++) g[cs[k][0]][cs[k][1]] = i; ships.push({ n: SH[i][0], cs: cs, hits: 0 }); } } }
  return { g: g, ships: ships };
}
function blank(){ var s = [], r, c; for (r = 0; r < 10; r++) { s[r] = []; for (c = 0; c < 10; c++) s[r][c] = 0; } return s; }
function reset(){
  me = newFleet(); en = newFleet(); ms2 = blank(); es = blank(); over = ''; note = 'Your turn - fire!'; KG.setOn(bl, lvl);
  szE = Math.floor(KG.width(640) / 10); szM = Math.floor(szE * 0.55); KG.clear(boxE); cellsE = KG.grid(10, 10, szE, boxE, fire); KG.clear(boxM); cellsM = KG.grid(10, 10, szM, boxM, function () {}); draw();
}
function alive(f){ for (var i = 0; i < 5; i++) if (f.ships[i].hits < f.ships[i].cs.length) return true; return false; }
function shoot(f, sh, r, c){ sh[r][c] = f.g[r][c] >= 0 ? 2 : 1; if (f.g[r][c] >= 0) { var s = f.ships[f.g[r][c]]; s.hits++; if (s.hits === s.cs.length) return s.n; } return ''; }
function fire(r, c){
  if (over || es[r][c]) return; var sunk = shoot(en, es, r, c); note = es[r][c] === 2 ? (sunk ? 'You sank their ' + sunk + '!' : 'Hit!') : 'Miss.';
  if (!alive(en)) { over = 'VICTORY! You sank the whole fleet.'; draw(); return; }
  var m = aiPick(), sk = shoot(me, ms2, m[0], m[1]); note += '  Enemy ' + (ms2[m[0]][m[1]] === 2 ? (sk ? 'sank your ' + sk + '!' : 'hit you!') : 'missed.');
  if (!alive(me)) over = 'Defeat - your fleet is gone.'; draw();
}
function aiPick(){
  var c = [], tg = [], r, k, d = [[1,0],[-1,0],[0,1],[0,-1]];
  for (r = 0; r < 10; r++) for (k = 0; k < 10; k++) if (!ms2[r][k]) { c.push([r, k]); }
  if (lvl > 0) for (r = 0; r < 10; r++) for (k = 0; k < 10; k++) if (ms2[r][k] === 2) { var s = me.ships[me.g[r][k]]; if (s.hits >= s.cs.length) continue;
    for (var i = 0; i < 4; i++) { var rr = r + d[i][0], cc = k + d[i][1]; if (rr >= 0 && rr < 10 && cc >= 0 && cc < 10 && !ms2[rr][cc]) { var w = 1; var br = r - d[i][0], bc = k - d[i][1]; if (br >= 0 && br < 10 && bc >= 0 && bc < 10 && ms2[br][bc] === 2) w = 4; for (var z = 0; z < w; z++) tg.push([rr, cc]); } } }
  if (tg.length) return tg[KG.rand(tg.length)];
  if (lvl === 2) { var par = []; for (r = 0; r < c.length; r++) if ((c[r][0] + c[r][1]) % 2 === 0) par.push(c[r]); if (par.length) return par[KG.rand(par.length)]; }
  return c[KG.rand(c.length)];
}
function draw(){
  var r, c, t, v;
  for (r = 0; r < 10; r++) for (c = 0; c < 10; c++) {
    t = cellsE.c[r][c]; v = es[r][c]; t.style.background = v === 2 ? '#000' : '#fff'; t.style.color = v === 2 ? '#fff' : '#000'; t.innerHTML = v === 2 ? 'X' : v === 1 ? '.' : '';
    if (over && !v && en.g[r][c] >= 0) { t.style.background = '#ccc'; }
    t = cellsM.c[r][c]; v = ms2[r][c]; var sh = me.g[r][c] >= 0; t.style.background = v === 2 ? '#000' : sh ? '#999' : '#fff'; t.style.color = v === 2 ? '#fff' : '#000'; t.style.fontSize = Math.floor(szM * 0.6) + 'px'; t.innerHTML = v === 2 ? 'X' : v === 1 ? '.' : '';
  }
  KG.clear(msg); msg.appendChild(document.createTextNode(over || note));
}
reset();
//@@ blackjack
var bank = KG.get('bj_bank', 100), deck, ph, dh, bet = 10, state = 'bet', note = '', doubled = false;
var panel = KG.el('div', 'panel', null, app), info = KG.el('div', 'msg', '', panel), tbl = KG.el('div', 'center', null, panel), ctl = KG.el('div', 'center', null, panel); ctl.style.marginTop = '12px';
function newDeck(){ var d = [], s = ['S', 'H', 'D', 'C'], r = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], i, j; for (i = 0; i < 4; i++) for (j = 0; j < 13; j++) d.push({ r: r[j], s: s[i] }); return KG.shuffle(d); }
function val(h){ var t = 0, a = 0, i; for (i = 0; i < h.length; i++) { var r = h[i].r; if (r === 'A') { a++; t += 11; } else if (r === 'J' || r === 'Q' || r === 'K') t += 10; else t += +r; } while (t > 21 && a) { t -= 10; a--; } return t; }
function draw1(){ if (deck.length < 12) deck = newDeck(); return deck.pop(); }
function deal(){
  if (bet > bank) bet = bank; if (bet < 1) return; deck = deck && deck.length > 15 ? deck : newDeck(); ph = [draw1(), draw1()]; dh = [draw1(), draw1()]; state = 'play'; note = ''; doubled = false;
  if (val(ph) === 21) finish(); else render();
}
function hit(){ ph.push(draw1()); if (val(ph) >= 21) { if (val(ph) > 21) finish(); else stand(); } else render(); }
function dbl(){ if (bank < bet * 2) return; doubled = true; ph.push(draw1()); if (val(ph) > 21) finish(); else stand(); }
function stand(){ while (val(dh) < 17) dh.push(draw1()); finish(); }
function finish(){
  state = 'done'; var p = val(ph), d = val(dh), b = doubled ? bet * 2 : bet, res;
  if (p > 21) { res = 'Bust! You lose ' + b + '.'; bank -= b; }
  else if (p === 21 && ph.length === 2 && !(d === 21 && dh.length === 2)) { var w = Math.floor(bet * 1.5); res = 'BLACKJACK! You win ' + w + '.'; bank += w; }
  else if (d > 21) { res = 'Dealer busts! You win ' + b + '.'; bank += b; }
  else if (p > d) { res = 'You win ' + b + '!'; bank += b; }
  else if (p < d) { res = 'Dealer wins. You lose ' + b + '.'; bank -= b; }
  else res = 'Push - bet returned.';
  note = res; KG.set('bj_bank', bank); render();
}
function render(){
  if (state === 'bet') { tbl.innerHTML = ''; KG.clear(ctl); bar(); KG.clear(info); info.appendChild(document.createTextNode((note ? note + '   ' : '') + 'Chips: ' + bank + '   Bet: ' + bet)); return; }
  var i, h = '<div>Dealer' + (state === 'play' ? '' : ' (' + val(dh) + ')') + '</div>', w = Math.min(78, Math.floor(KG.width(640) / 6));
  for (i = 0; i < dh.length; i++) h += (i === 1 && state === 'play') ? KG.cardBack(w) : KG.card(dh[i].r, dh[i].s, w);
  h += '<div style="margin-top:10px">You (' + val(ph) + ')</div>'; for (i = 0; i < ph.length; i++) h += KG.card(ph[i].r, ph[i].s, w);
  tbl.innerHTML = h; KG.clear(ctl);
  if (state === 'play') { KG.btn('Hit', hit, ctl, 'big'); KG.btn('Stand', stand, ctl, 'big'); if (ph.length === 2 && bank >= bet * 2) KG.btn('Double', dbl, ctl, 'big'); }
  else { bar(); }
  KG.clear(info); info.appendChild(document.createTextNode((note ? note + '   ' : '') + 'Chips: ' + bank + '   Bet: ' + bet));
}
function bar(){
  if (bank <= 0) { KG.btn('Out of chips - restart with 100', function () { bank = 100; KG.set('bj_bank', 100); bet = 10; start(); }, ctl, 'big'); return; }
  var o = [5, 10, 25, 50], i; ctl.appendChild(document.createTextNode('Bet: ')); for (i = 0; i < 4; i++) (function (v) { var b = KG.btn('' + v, function () { bet = v > bank ? bank : v; start2(); }, ctl); if (bet === v) b.className += ' on'; })(o[i]);
  var d = KG.el('div', null, null, ctl); d.style.marginTop = '10px'; KG.btn('Deal', deal, d, 'big on');
}
function start2(){ state = state === 'play' ? state : 'bet'; render(); }
function start(){ ph = []; dh = []; state = 'bet'; note = 'Place your bet and tap Deal.'; render(); }
deck = newDeck(); ph = []; dh = []; if (bank <= 0) { bank = 100; } start();
//@@ higher-or-lower
var deck, cur, streak = 0, best = KG.get('hl_b', 0), note = '', over = false;
var panel = KG.el('div', 'panel', null, app), info = KG.el('div', 'msg', '', panel), tbl = KG.el('div', 'center', null, panel), ctl = KG.el('div', 'center', null, panel); ctl.style.marginTop = '14px';
var RK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function mk(){ var d = [], s = ['S', 'H', 'D', 'C'], i, j; for (i = 0; i < 4; i++) for (j = 0; j < 13; j++) d.push({ n: j + 1, r: RK[j], s: s[i] }); return KG.shuffle(d); }
function nextCard(){ if (!deck.length) deck = mk(); return deck.pop(); }
function reset(){ deck = mk(); cur = nextCard(); streak = 0; over = false; note = 'Will the next card be higher or lower? (Ace is low)'; render(); }
function guess(up){
  var n = nextCard(), ok = n.n === cur.n ? null : (up ? n.n > cur.n : n.n < cur.n);
  var old = cur; cur = n;
  if (ok === null) note = 'Same rank! No change.'; else if (ok) { streak++; note = 'Correct!'; if (streak > best) { best = streak; KG.set('hl_b', best); } } else { over = true; note = 'Wrong! Streak ended at ' + streak + '.'; }
  render(old);
}
function render(old){
  var w = Math.min(120, Math.floor(KG.width(640) / 4)), h = '';
  if (old) h += '<span style="opacity:.55">' + KG.card(old.r, old.s, Math.floor(w * 0.7)) + '</span> &rarr; ';
  h += KG.card(cur.r, cur.s, w); tbl.innerHTML = h; KG.clear(ctl);
  if (over) KG.btn('Play again', reset, ctl, 'big on'); else { KG.btn('Higher', function () { guess(true); }, ctl, 'big'); KG.btn('Lower', function () { guess(false); }, ctl, 'big'); }
  KG.clear(info); info.appendChild(document.createTextNode(note + '   Streak: ' + streak + '   Best: ' + best));
}
reset();
//@@ nim
var piles, turn, over, first = KG.get('nim_f', 0), lvl = KG.get('nim_l', 1), note = '';
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('nim_l', 0); reset(); }, rr1), KG.btn('Unbeatable', function () { lvl = 1; KG.set('nim_l', 1); reset(); }, rr1)];
var r2 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Who starts', r2); var rr2 = KG.el('div', 'r', null, r2);
var bf = [KG.btn('You', function () { first = 0; KG.set('nim_f', 0); reset(); }, rr2), KG.btn('AI', function () { first = 1; KG.set('nim_f', 1); reset(); }, rr2)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px'; KG.btn('New game', reset, nb, 'on');
KG.el('div', 'foot', 'Tap a stone to take it and every stone to its right in that row. Whoever takes the LAST stone wins.', panel);
function reset(){ piles = [3, 4, 5, 6]; over = ''; note = ''; turn = first ? 1 : 0; KG.setOn(bl, lvl); KG.setOn(bf, first); draw(); if (turn === 1) setTimeout(aiGo, 500); }
function total(){ var t = 0; for (var i = 0; i < piles.length; i++) t += piles[i]; return t; }
function take(i, k){
  piles[i] = k; if (!total()) { over = turn === 0 ? 'You took the last stone - YOU WIN!' : 'AI took the last stone - AI wins.'; draw(); return; }
  turn = 1 - turn; draw(); if (turn === 1) setTimeout(aiGo, 600);
}
function aiGo(){
  var x = 0, i, mv = null; for (i = 0; i < piles.length; i++) x ^= piles[i];
  if (lvl === 1 && x) for (i = 0; i < piles.length; i++) if ((piles[i] ^ x) < piles[i]) { mv = [i, piles[i] ^ x]; break; }
  if (!mv) { var c = []; for (i = 0; i < piles.length; i++) if (piles[i]) c.push(i); var p = c[KG.rand(c.length)]; mv = [p, KG.rand(piles[p])]; }
  note = 'AI left ' + mv[1] + ' in row ' + (mv[0] + 1) + '.'; take(mv[0], mv[1]);
}
function draw(){
  var h = '', i, k, d = Math.min(56, Math.floor(KG.width(640) / 8));
  for (i = 0; i < piles.length; i++) { h += '<div style="margin:8px 0;white-space:nowrap">'; for (k = 0; k < piles[i]; k++) h += '<span id="s' + i + '_' + k + '" style="display:inline-block;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#000;margin:0 5px;cursor:pointer"></span>'; if (!piles[i]) h += '<span style="display:inline-block;height:' + d + 'px;line-height:' + d + 'px">(empty)</span>'; h += '</div>'; }
  box.innerHTML = h;
  for (i = 0; i < piles.length; i++) for (k = 0; k < piles[i]; k++) (function (a, b) { KG.$('s' + a + '_' + b).onclick = function () { if (!over && turn === 0) take(a, b); }; })(i, k);
  KG.clear(msg); msg.appendChild(document.createTextNode(over || (turn === 0 ? 'Your move. ' : 'AI thinking... ') + note));
}
reset();
