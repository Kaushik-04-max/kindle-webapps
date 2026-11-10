//@@ tic-tac-toe
var mode = KG.get('ttt_m', 0), lvl = KG.get('ttt_l', 1), sc = [0, 0, 0], b, turn, over, cells;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Mode', r1); var rr1 = KG.el('div', 'r', null, r1);
var bm = [KG.btn('vs AI', function () { mode = 0; KG.set('ttt_m', 0); reset(); }, rr1), KG.btn('2 players', function () { mode = 1; KG.set('ttt_m', 1); reset(); }, rr1)];
var r2 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r2); var rr2 = KG.el('div', 'r', null, r2);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('ttt_l', 0); reset(); }, rr2), KG.btn('Unbeatable', function () { lvl = 1; KG.set('ttt_l', 1); reset(); }, rr2)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel);
var tally = KG.el('div', 'center', '', panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
var L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function win(bd){ for (var i = 0; i < 8; i++) { var l = L[i]; if (bd[l[0]] && bd[l[0]] === bd[l[1]] && bd[l[1]] === bd[l[2]]) return bd[l[0]]; } return bd.join('').length === 9 ? 'D' : ''; }
function mm(bd, p){ var w = win(bd); if (w) return w === 'D' ? 0 : (w === 'O' ? 10 : -10); var best = p === 'O' ? -99 : 99, i, v; for (i = 0; i < 9; i++) if (!bd[i]) { bd[i] = p; v = mm(bd, p === 'O' ? 'X' : 'O'); bd[i] = ''; if (p === 'O' ? v > best : v < best) best = v; } return best; }
function ai(){
  var e = [], i, best = -99, bi = -1, v;
  for (i = 0; i < 9; i++) if (!b[i]) e.push(i);
  if (lvl === 0 && KG.rand(10) < 6) return e[KG.rand(e.length)];
  KG.shuffle(e);
  for (i = 0; i < e.length; i++) { b[e[i]] = 'O'; v = mm(b, 'X'); b[e[i]] = ''; if (v > best) { best = v; bi = e[i]; } }
  return bi;
}
function reset(){
  b = ['', '', '', '', '', '', '', '', '']; turn = 'X'; over = false; KG.setOn(bm, mode); KG.setOn(bl, lvl);
  var sz = Math.floor(KG.width(480) / 3); KG.clear(box); cells = KG.grid(3, 3, sz, box, function (r, c) { tap(r * 3 + c); });
  for (var i = 0; i < 9; i++) cells.c[(i / 3) | 0][i % 3].style.fontSize = Math.floor(sz * 0.8) + 'px';
  show();
}
function show(){
  var i, w = win(b);
  for (i = 0; i < 9; i++) { var td = cells.c[(i / 3) | 0][i % 3]; td.innerHTML = b[i]; td.style.background = '#fff'; td.style.color = '#000'; }
  if (w && w !== 'D') for (i = 0; i < 8; i++) { var l = L[i]; if (b[l[0]] === w && b[l[1]] === w && b[l[2]] === w) for (var k = 0; k < 3; k++) { var t = cells.c[(l[k] / 3) | 0][l[k] % 3]; t.style.background = '#000'; t.style.color = '#fff'; } }
  KG.clear(msg);
  var t2 = w ? (w === 'D' ? 'Draw!' : (mode === 0 ? (w === 'X' ? 'You win!' : 'AI wins!') : w + ' wins!')) : (mode === 0 ? (turn === 'X' ? 'Your move (X)' : 'AI thinking...') : turn + ' to move');
  msg.appendChild(document.createTextNode(t2));
  KG.clear(tally); tally.appendChild(document.createTextNode('X wins: ' + sc[0] + '   O wins: ' + sc[1] + '   Draws: ' + sc[2]));
}
function end(){ var w = win(b); if (w) { over = true; sc[w === 'X' ? 0 : (w === 'O' ? 1 : 2)]++; } }
function tap(i){
  if (over || b[i] || (mode === 0 && turn !== 'X')) return;
  b[i] = turn; turn = turn === 'X' ? 'O' : 'X'; end(); show();
  if (!over && mode === 0) setTimeout(function () { var m = ai(); b[m] = 'O'; turn = 'X'; end(); show(); }, 250);
}
reset();
//@@ connect-four
var mode = KG.get('c4_m', 0), lvl = KG.get('c4_l', 1), R = 6, C = 7, b, turn, over, cells, sz, wins = [0, 0];
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Mode', r1); var rr1 = KG.el('div', 'r', null, r1);
var bm = [KG.btn('vs AI', function () { mode = 0; KG.set('c4_m', 0); reset(); }, rr1), KG.btn('2 players', function () { mode = 1; KG.set('c4_m', 1); reset(); }, rr1)];
var r2 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r2); var rr2 = KG.el('div', 'r', null, r2);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('c4_l', 0); reset(); }, rr2), KG.btn('Normal', function () { lvl = 1; KG.set('c4_l', 1); reset(); }, rr2), KG.btn('Hard', function () { lvl = 2; KG.set('c4_l', 2); reset(); }, rr2)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
var info = KG.el('div', 'center', '', panel); info.style.marginTop = '8px';
function reset(){
  b = []; for (var r = 0; r < R; r++) { b[r] = []; for (var c = 0; c < C; c++) b[r][c] = 0; }
  turn = 1; over = false; KG.setOn(bm, mode); KG.setOn(bl, lvl);
  sz = Math.floor(KG.width(630) / C); KG.clear(box); cells = KG.grid(R, C, sz, box, function (r, c) { drop(c); });
  show(null);
}
function four(bd){
  var r, c, d, p, dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (r = 0; r < R; r++) for (c = 0; c < C; c++) { p = bd[r][c]; if (!p) continue;
    for (d = 0; d < 4; d++) { var k, ok = true, cs = [[r, c]];
      for (k = 1; k < 4; k++) { var rr = r + dirs[d][0] * k, cc = c + dirs[d][1] * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C || bd[rr][cc] !== p) { ok = false; break; } cs.push([rr, cc]); }
      if (ok) return { p: p, cs: cs }; } }
  return null;
}
function full(bd){ for (var c = 0; c < C; c++) if (!bd[0][c]) return false; return true; }
function rowFor(bd, c){ for (var r = R - 1; r >= 0; r--) if (!bd[r][c]) return r; return -1; }
function show(w){
  var r, c, v, html, td;
  for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
    v = b[r][c]; td = cells.c[r][c];
    var hi = false; if (w) for (var i = 0; i < 4; i++) if (w.cs[i][0] === r && w.cs[i][1] === c) hi = true;
    var d = Math.floor(sz * 0.72), bd = hi ? '6px double #000' : '3px solid #000';
    td.innerHTML = v ? '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;border:' + bd + ';background:' + (v === 1 ? '#000' : '#fff') + '"></div>' + '' : '';
    if (v === 2) td.firstChild.innerHTML = '<div style="margin:' + Math.floor(d * 0.22) + 'px;width:' + Math.floor(d * 0.34) + 'px;height:' + Math.floor(d * 0.34) + 'px;border-radius:50%;background:#000"></div>';
  }
  KG.clear(msg);
  var t = w ? (mode === 0 ? (w.p === 1 ? 'You win!' : 'AI wins!') : (w.p === 1 ? 'Black wins!' : 'White wins!')) : (over ? 'Draw!' : (mode === 0 ? (turn === 1 ? 'Your move (black discs)' : 'AI thinking...') : (turn === 1 ? 'Black to move' : 'White to move')));
  msg.appendChild(document.createTextNode(t));
  KG.clear(info); info.appendChild(document.createTextNode('Tap any column to drop a disc.  Black ' + wins[0] + ' - ' + wins[1] + ' White'));
}
function drop(c){
  if (over || (mode === 0 && turn !== 1)) return;
  var r = rowFor(b, c); if (r < 0) return;
  b[r][c] = turn; var w = four(b);
  if (w) { over = true; wins[w.p - 1]++; } else if (full(b)) over = true; else turn = turn === 1 ? 2 : 1;
  show(w);
  if (!over && mode === 0 && turn === 2) setTimeout(aiMove, 200);
}
function score(bd, p){
  var s = 0, r, c, d, k, dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (r = 0; r < R; r++) if (bd[r][3] === p) s += 3;
  for (r = 0; r < R; r++) for (c = 0; c < C; c++) for (d = 0; d < 4; d++) {
    var me = 0, op = 0, ok = true;
    for (k = 0; k < 4; k++) { var rr = r + dirs[d][0] * k, cc = c + dirs[d][1] * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C) { ok = false; break; } var v = bd[rr][cc]; if (v === p) me++; else if (v) op++; }
    if (!ok) continue;
    if (me && op) continue;
    if (me === 3) s += 5; else if (me === 2) s += 2; else if (op === 3) s -= 4; else if (op === 2) s -= 1;
  }
  return s;
}
var ORD = [3, 2, 4, 1, 5, 0, 6];
function nega(bd, d, a, bt, p){
  var w = four(bd); if (w) return w.p === p ? 1000 + d : -1000 - d;
  if (full(bd)) return 0; if (d === 0) return score(bd, p) - score(bd, 3 - p) * 0.5;
  var i, c, r, v;
  for (i = 0; i < C; i++) { c = ORD[i]; r = rowFor(bd, c); if (r < 0) continue; bd[r][c] = p; v = -nega(bd, d - 1, -bt, -a, 3 - p); bd[r][c] = 0; if (v >= bt) return v; if (v > a) a = v; }
  return a;
}
function aiMove(){
  var depth = [1, 3, 5][lvl], best = -9999, bc = -1, i, c, r, v;
  for (i = 0; i < C; i++) { c = ORD[i]; r = rowFor(b, c); if (r < 0) continue; b[r][c] = 2; v = -nega(b, depth - 1, -9999, 9999, 1); b[r][c] = 0; if (lvl === 0) v += KG.rand(8); if (v > best) { best = v; bc = c; } }
  var r2 = rowFor(b, bc); b[r2][bc] = 2; var w = four(b);
  if (w) { over = true; wins[1]++; } else if (full(b)) over = true; else turn = 1;
  show(w);
}
reset();
//@@ memory
var sizes = [[4, 4], [4, 5], [6, 6]], si = KG.get('mem_s', 0), grid, flips, first, lock, gen = 0, matched, moves, best;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Size', r1); var rr1 = KG.el('div', 'r', null, r1);
var bs = [KG.btn('Easy 4x4', function () { pick(0); }, rr1), KG.btn('4x5', function () { pick(1); }, rr1), KG.btn('Big 6x6', function () { pick(2); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
function pick(i){ si = i; KG.set('mem_s', i); reset(); }
function reset(){
  gen++; var R = sizes[si][0], C = sizes[si][1], n = R * C / 2, L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('').slice(0, n), i;
  var vals = []; for (i = 0; i < n; i++) { vals.push(L[i]); vals.push(L[i]); } KG.shuffle(vals);
  grid = vals; flips = []; first = -1; lock = false; matched = 0; moves = 0; best = KG.get('mem_b' + si, 0);
  KG.setOn(bs, si); KG.clear(box);
  var sz = Math.floor(KG.width(640) / C); if (sz > 150) sz = 150;
  var g = KG.grid(R, C, sz, box, function (r, c) { flip(r * C + c); }); box.g = g; box.C = C;
  for (i = 0; i < R * C; i++) cover(i);
  info();
}
function td(i){ return box.g.c[(i / box.C) | 0][i % box.C]; }
function cover(i){ var t = td(i); t.style.background = '#000'; t.style.color = '#fff'; t.innerHTML = '?'; t.style.opacity = 1; }
function face(i){ var t = td(i); t.style.background = '#fff'; t.style.color = '#000'; t.innerHTML = grid[i]; }
function done(i){ var t = td(i); t.style.background = '#fff'; t.style.color = '#000'; t.innerHTML = '<span style="border:3px solid #000;padding:0 8px">' + grid[i] + '</span>'; }
function info(){ KG.clear(msg); msg.appendChild(document.createTextNode('Moves: ' + moves + '   Pairs: ' + matched + '/' + grid.length / 2 + (best ? '   Best: ' + best : ''))); }
function flip(i){
  if (lock || td(i).innerHTML.indexOf('span') >= 0 || i === first) return;
  if (td(i).style.background.indexOf('0, 0, 0') < 0 && td(i).style.background !== '#000' && td(i).innerHTML !== '?') return;
  face(i);
  if (first < 0) { first = i; return; }
  moves++; var a = first, myGen = gen; first = -1;
  if (grid[a] === grid[i]) { matched++; done(a); done(i); info(); if (matched === grid.length / 2) { KG.clear(msg); msg.appendChild(document.createTextNode('You did it in ' + moves + ' moves!')); if (!best || moves < best) KG.set('mem_b' + si, moves); } return; }
  lock = true; info();
  setTimeout(function () { if (myGen !== gen) return; cover(a); cover(i); lock = false; }, 1100);
}
reset();
//@@ minesweeper
var N = 9, M = 10, mode = 0, g, open, flag, over, first, cells, sz;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); var lc = KG.el('div', 'l', '', r1); var rr1 = KG.el('div', 'r', null, r1);
var bm = [KG.btn('Dig', function () { mode = 0; KG.setOn(bm, 0); }, rr1), KG.btn('Flag', function () { mode = 1; KG.setOn(bm, 1); }, rr1)];
var msg = KG.el('div', 'msg', 'Tap squares to dig. Use Flag mode to mark mines.', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
function nbrs(r, c){ var o = [], a, b; for (a = -1; a <= 1; a++) for (b = -1; b <= 1; b++) if ((a || b) && r + a >= 0 && r + a < N && c + b >= 0 && c + b < N) o.push([r + a, c + b]); return o; }
function reset(){
  var r, c; g = []; open = []; flag = []; over = false; first = true; mode = 0; KG.setOn(bm, 0);
  for (r = 0; r < N; r++) { g[r] = []; open[r] = []; flag[r] = []; for (c = 0; c < N; c++) { g[r][c] = 0; open[r][c] = false; flag[r][c] = false; } }
  sz = Math.floor(KG.width(640) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, tap); draw();
}
function place(sr, sc){
  var n = 0, r, c; while (n < M) { r = KG.rand(N); c = KG.rand(N); if (g[r][c] === -1 || (Math.abs(r - sr) < 2 && Math.abs(c - sc) < 2)) continue; g[r][c] = -1; n++; }
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (g[r][c] !== -1) { var k = 0, ns = nbrs(r, c); for (var i = 0; i < ns.length; i++) if (g[ns[i][0]][ns[i][1]] === -1) k++; g[r][c] = k; }
}
function reveal(r, c){
  if (open[r][c] || flag[r][c]) return; open[r][c] = true;
  if (g[r][c] === 0) { var ns = nbrs(r, c); for (var i = 0; i < ns.length; i++) reveal(ns[i][0], ns[i][1]); }
}
function tap(r, c){
  if (over) return;
  if (mode === 1) { if (!open[r][c]) flag[r][c] = !flag[r][c]; draw(); return; }
  if (flag[r][c] || open[r][c]) return;
  if (first) { place(r, c); first = false; }
  if (g[r][c] === -1) { over = 'lose'; open[r][c] = true; draw(); return; }
  reveal(r, c); var left = 0, a, b; for (a = 0; a < N; a++) for (b = 0; b < N; b++) if (!open[a][b] && g[a][b] !== -1) left++;
  if (!left) over = 'win'; draw();
}
function draw(){
  var r, c, f = 0, t;
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
    t = cells.c[r][c]; if (flag[r][c]) f++;
    if (open[r][c]) { t.style.background = '#fff'; t.style.color = '#000'; t.innerHTML = g[r][c] === -1 ? '*' : (g[r][c] || ''); if (g[r][c] === -1) { t.style.background = '#000'; t.style.color = '#fff'; } }
    else if (over === 'lose' && g[r][c] === -1) { t.style.background = '#fff'; t.style.color = '#000'; t.innerHTML = flag[r][c] ? 'X' : '*'; }
    else { t.style.background = '#000'; t.style.color = '#fff'; t.innerHTML = flag[r][c] ? 'F' : ''; if (!flag[r][c]) t.style.background = '#bbb'; }
  }
  KG.clear(lc); lc.appendChild(document.createTextNode('Mines left: ' + (M - f)));
  KG.clear(msg); msg.appendChild(document.createTextNode(over === 'win' ? 'Cleared! You win!' : over === 'lose' ? 'BOOM! Try again.' : 'Tap to dig. Flag mode marks mines (F).'));
}
reset();
//@@ lights-out
var N = 5, g, moves, cells, sz;
var panel = KG.el('div', 'panel', null, app), msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New puzzle', reset, nb, 'on');
function tog(r, c){ var d = [[0,0],[1,0],[-1,0],[0,1],[0,-1]], i; for (i = 0; i < 5; i++) { var a = r + d[i][0], b = c + d[i][1]; if (a >= 0 && a < N && b >= 0 && b < N) g[a][b] = !g[a][b]; } }
function reset(){
  var r, c, i; g = []; moves = 0; for (r = 0; r < N; r++) { g[r] = []; for (c = 0; c < N; c++) g[r][c] = false; }
  for (i = 0; i < 12; i++) tog(KG.rand(N), KG.rand(N));
  if (!left()) tog(2, 2);
  sz = Math.floor(KG.width(560) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, tap); draw();
}
function left(){ var n = 0, r, c; for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (g[r][c]) n++; return n; }
function tap(r, c){ if (!left()) return; tog(r, c); moves++; draw(); }
function draw(){
  var r, c, t; for (r = 0; r < N; r++) for (c = 0; c < N; c++) { t = cells.c[r][c]; t.style.background = g[r][c] ? '#000' : '#fff'; t.style.color = g[r][c] ? '#fff' : '#000'; t.innerHTML = ''; }
  KG.clear(msg); msg.appendChild(document.createTextNode(left() ? 'Turn every square white. Tapping flips it and its neighbours.   Moves: ' + moves : 'Solved in ' + moves + ' moves!'));
}
reset();
//@@ slide-puzzle
var N = KG.get('sl_n', 4), g, moves, cells, sz;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Size', r1); var rr1 = KG.el('div', 'r', null, r1);
var bs = [KG.btn('3x3', function () { N = 3; KG.set('sl_n', 3); reset(); }, rr1), KG.btn('4x4', function () { N = 4; KG.set('sl_n', 4); reset(); }, rr1), KG.btn('5x5', function () { N = 5; KG.set('sl_n', 5); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('Shuffle', reset, nb, 'on');
function reset(){
  var i, r, c; g = []; moves = 0; for (i = 0; i < N * N; i++) g.push((i + 1) % (N * N));
  var br = N - 1, bc = N - 1, k, d = [[1,0],[-1,0],[0,1],[0,-1]], last = -1;
  for (k = 0; k < N * N * 30; k++) { var m = KG.rand(4); if (last >= 0 && m === (last ^ 1)) continue; var a = br + d[m][0], b = bc + d[m][1]; if (a < 0 || a >= N || b < 0 || b >= N) continue; g[br * N + bc] = g[a * N + b]; g[a * N + b] = 0; br = a; bc = b; last = m; }
  KG.setOn(bs, N - 3); sz = Math.floor(KG.width(600) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, tap); draw();
}
function solved(){ for (var i = 0; i < N * N - 1; i++) if (g[i] !== i + 1) return false; return true; }
function tap(r, c){
  if (solved()) return; var z = g.indexOf(0), zr = (z / N) | 0, zc = z % N, i;
  if (r === zr) { if (c < zc) for (i = zc; i > c; i--) g[r * N + i] = g[r * N + i - 1]; else for (i = zc; i < c; i++) g[r * N + i] = g[r * N + i + 1]; g[r * N + c] = 0; moves += Math.abs(c - zc); }
  else if (c === zc) { if (r < zr) for (i = zr; i > r; i--) g[i * N + c] = g[(i - 1) * N + c]; else for (i = zr; i < r; i++) g[i * N + c] = g[(i + 1) * N + c]; g[r * N + c] = 0; moves += Math.abs(r - zr); }
  draw();
}
function draw(){
  var r, c, t, v; for (r = 0; r < N; r++) for (c = 0; c < N; c++) { v = g[r * N + c]; t = cells.c[r][c]; t.innerHTML = v || ''; t.style.background = v ? '#fff' : '#000'; t.style.color = '#000'; t.style.borderWidth = v ? '3px' : '2px'; }
  KG.clear(msg); msg.appendChild(document.createTextNode(solved() ? 'Solved in ' + moves + ' moves!' : 'Tap a tile in line with the gap to slide.   Moves: ' + moves));
}
reset();
//@@ hanoi
var n = KG.get('han_n', 4), pegs, sel, moves;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Discs', r1); var rr1 = KG.el('div', 'r', null, r1), bs = [], i;
for (i = 3; i <= 7; i++) (function (k) { bs.push(KG.btn('' + k, function () { n = k; KG.set('han_n', k); reset(); }, rr1)); })(i);
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('Restart', reset, nb, 'on');
function reset(){ pegs = [[], [], []]; for (var k = n; k >= 1; k--) pegs[0].push(k); sel = -1; moves = 0; KG.setOn(bs, n - 3); draw(); }
function tap(p){
  if (pegs[2].length === n) return;
  if (sel < 0) { if (pegs[p].length) sel = p; }
  else { if (sel !== p) { var d = pegs[sel][pegs[sel].length - 1], t = pegs[p][pegs[p].length - 1]; if (!t || d < t) { pegs[p].push(pegs[sel].pop()); moves++; } } sel = -1; }
  draw();
}
function draw(){
  var w = KG.width(640), pw = Math.floor(w / 3), dh = Math.min(40, Math.floor(300 / n)), p, k, html = '<table style="margin:0 auto;border-collapse:collapse"><tr>';
  for (p = 0; p < 3; p++) {
    html += '<td id="pg' + p + '" style="width:' + pw + 'px;height:' + (dh * 7 + 30) + 'px;vertical-align:bottom;text-align:center;border:' + (sel === p ? '5px solid #000' : '2px solid #000') + ';padding:0;cursor:pointer">';
    for (k = pegs[p].length - 1; k >= 0; k--) { var v = pegs[p][k]; html += '<div style="margin:0 auto 2px;height:' + dh + 'px;width:' + Math.floor((pw - 16) * (0.25 + 0.75 * v / n)) + 'px;background:#000;color:#fff;line-height:' + dh + 'px;font-size:' + Math.floor(dh * 0.6) + 'px">' + v + '</div>'; }
    html += '<div style="height:10px;background:#000;margin-top:4px"></div></td>';
  }
  box.innerHTML = html + '</tr></table>';
  for (p = 0; p < 3; p++) (function (q) { KG.$('pg' + q).onclick = function () { tap(q); }; })(p);
  var min = Math.pow(2, n) - 1;
  KG.clear(msg); msg.appendChild(document.createTextNode(pegs[2].length === n ? 'Done in ' + moves + ' moves (best possible: ' + min + ')' : 'Move the tower to the right peg. Tap a peg, then tap where it goes.  Moves: ' + moves + ' / ' + min));
}
reset();
//@@ 2048
var N = 4, g, score, best = KG.get('2048_b', 0), over, cells, sz;
var panel = KG.el('div', 'panel', null, app), r1 = KG.el('div', 'row', null, panel), sl = KG.el('div', 'l', '', r1), rr1 = KG.el('div', 'r', null, r1);
KG.btn('New game', reset, rr1, 'on');
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), pad = KG.el('div', 'center', null, panel); pad.style.marginTop = '12px';
KG.btn('<  Left', function () { mv(0); }, pad, 'big'); KG.btn('^  Up', function () { mv(1); }, pad, 'big'); KG.btn('v  Down', function () { mv(2); }, pad, 'big'); KG.btn('Right  >', function () { mv(3); }, pad, 'big');
KG.el('div', 'foot', 'You can also swipe on the board.', panel);
function empty(){ var e = [], r, c; for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (!g[r][c]) e.push([r, c]); return e; }
function spawn(){ var e = empty(); if (!e.length) return; var p = e[KG.rand(e.length)]; g[p[0]][p[1]] = KG.rand(10) ? 2 : 4; }
function reset(){ g = []; score = 0; over = false; for (var r = 0; r < N; r++) { g[r] = [0, 0, 0, 0]; } spawn(); spawn(); sz = Math.floor(KG.width(560) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, function () {}); hook(); draw(); }
function line(a){ var o = [], i, gain = 0; for (i = 0; i < 4; i++) if (a[i]) o.push(a[i]); for (i = 0; i < o.length - 1; i++) if (o[i] === o[i + 1]) { o[i] *= 2; gain += o[i]; o.splice(i + 1, 1); } while (o.length < 4) o.push(0); return { l: o, g: gain }; }
function mv(d){
  if (over) return; var r, c, moved = false, ln, before;
  for (r = 0; r < 4; r++) {
    var a = [];
    for (c = 0; c < 4; c++) a.push(d === 0 ? g[r][c] : d === 3 ? g[r][3 - c] : d === 1 ? g[c][r] : g[3 - c][r]);
    before = a.join(','); ln = line(a); if (ln.l.join(',') !== before) moved = true; score += ln.g;
    for (c = 0; c < 4; c++) { var v = ln.l[c]; if (d === 0) g[r][c] = v; else if (d === 3) g[r][3 - c] = v; else if (d === 1) g[c][r] = v; else g[3 - c][r] = v; }
  }
  if (!moved) return; spawn();
  if (score > best) { best = score; KG.set('2048_b', best); }
  if (!canMove()) over = true; draw();
}
function canMove(){ if (empty().length) return true; for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) { if (c < 3 && g[r][c] === g[r][c + 1]) return true; if (r < 3 && g[r][c] === g[r + 1][c]) return true; } return false; }
function draw(){
  var r, c, t, v, big = 0;
  for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) { v = g[r][c]; if (v > big) big = v; t = cells.c[r][c]; t.innerHTML = v || ''; var dark = v >= 128; t.style.background = dark ? '#000' : (v ? '#ddd' : '#fff'); t.style.color = dark ? '#fff' : '#000'; t.style.fontSize = Math.floor(sz * (v >= 1000 ? 0.32 : v >= 100 ? 0.4 : 0.5)) + 'px'; }
  KG.clear(sl); sl.appendChild(document.createTextNode('Score ' + score + '   Best ' + best));
  KG.clear(msg); msg.appendChild(document.createTextNode(over ? 'No moves left! Game over.' : big >= 2048 ? 'You made 2048! Keep going!' : 'Merge equal tiles to reach 2048.'));
}
var sx = 0, sy = 0;
function hook(){
  box.ontouchstart = function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; };
  box.ontouchend = function (e) { var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return; if (Math.abs(dx) > Math.abs(dy)) mv(dx < 0 ? 0 : 3); else mv(dy < 0 ? 1 : 2); };
}
reset();
//@@ flood-it
var N = 12, K = 6, g, moves, maxm = 22, cells, sz, SH = ['#fff', '#ddd', '#bbb', '#999', '#555', '#000'], LT = ['A', 'B', 'C', 'D', 'E', 'F'];
var panel = KG.el('div', 'panel', null, app), msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), pal = KG.el('div', 'center', null, panel); pal.style.marginTop = '12px';
var i; for (i = 0; i < K; i++) (function (k) { var b = KG.btn(LT[k], function () { pick(k); }, pal, 'big'); b.style.background = SH[k]; b.style.color = k >= 3 ? '#fff' : '#000'; b.style.borderWidth = '3px'; })(i);
var nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px'; KG.btn('New game', reset, nb, 'on');
KG.el('div', 'foot', 'Start at the top-left corner. Pick a letter to flood the corner region with that shade. Fill the whole board in time.', panel);
function reset(){ var r, c; g = []; moves = 0; for (r = 0; r < N; r++) { g[r] = []; for (c = 0; c < N; c++) g[r][c] = KG.rand(K); } sz = Math.floor(KG.width(600) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, function () {}); draw(); }
function won(){ for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (g[r][c] !== g[0][0]) return false; return true; }
function pick(k){
  if (won() || moves >= maxm) return; var old = g[0][0]; if (k === old) return; moves++;
  var st = [[0, 0]], d = [[1,0],[-1,0],[0,1],[0,-1]];
  while (st.length) { var p = st.pop(); if (g[p[0]][p[1]] !== old) continue; g[p[0]][p[1]] = k; for (var j = 0; j < 4; j++) { var a = p[0] + d[j][0], b = p[1] + d[j][1]; if (a >= 0 && a < N && b >= 0 && b < N && g[a][b] === old) st.push([a, b]); } }
  draw();
}
function draw(){
  var r, c, t; for (r = 0; r < N; r++) for (c = 0; c < N; c++) { t = cells.c[r][c]; t.style.background = SH[g[r][c]]; t.style.color = g[r][c] >= 3 ? '#fff' : '#000'; t.style.fontSize = Math.floor(sz * 0.5) + 'px'; t.innerHTML = LT[g[r][c]]; t.style.border = '1px solid #000'; }
  KG.clear(msg); msg.appendChild(document.createTextNode(won() ? 'Flooded in ' + moves + ' moves - you win!' : moves >= maxm ? 'Out of moves. Try again!' : 'Moves: ' + moves + ' / ' + maxm));
}
reset();
