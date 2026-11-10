//@@ reversi
var N = 8, lvl = KG.get('rev_l', 1), b, turn, over, cells, sz, W = [[100,-20,10,5,5,10,-20,100],[-20,-50,-2,-2,-2,-2,-50,-20],[10,-2,1,1,1,1,-2,10],[5,-2,1,0,0,1,-2,5],[5,-2,1,0,0,1,-2,5],[10,-2,1,1,1,1,-2,10],[-20,-50,-2,-2,-2,-2,-50,-20],[100,-20,10,5,5,10,-20,100]];
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('rev_l', 0); reset(); }, rr1), KG.btn('Normal', function () { lvl = 1; KG.set('rev_l', 1); reset(); }, rr1), KG.btn('Hard', function () { lvl = 2; KG.set('rev_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('New game', reset, nb, 'on');
KG.el('div', 'foot', 'You are black (solid discs). Dots show legal moves.', panel);
var D = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function flips(bd, r, c, p){
  var out = [], i, k; if (bd[r][c]) return out;
  for (i = 0; i < 8; i++) { var rr = r + D[i][0], cc = c + D[i][1], line = [];
    while (rr >= 0 && rr < N && cc >= 0 && cc < N && bd[rr][cc] === 3 - p) { line.push([rr, cc]); rr += D[i][0]; cc += D[i][1]; }
    if (line.length && rr >= 0 && rr < N && cc >= 0 && cc < N && bd[rr][cc] === p) for (k = 0; k < line.length; k++) out.push(line[k]); }
  return out;
}
function moves(bd, p){ var o = [], r, c; for (r = 0; r < N; r++) for (c = 0; c < N; c++) { var f = flips(bd, r, c, p); if (f.length) o.push([r, c, f]); } return o; }
function put(bd, m, p){ bd[m[0]][m[1]] = p; for (var i = 0; i < m[2].length; i++) bd[m[2][i][0]][m[2][i][1]] = p; }
function copy(bd){ var o = [], r; for (r = 0; r < N; r++) o.push(bd[r].slice()); return o; }
function count(bd, p){ var n = 0, r, c; for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (bd[r][c] === p) n++; return n; }
function ev(bd){ var s = 0, r, c; for (r = 0; r < N; r++) for (c = 0; c < N; c++) { if (bd[r][c] === 2) s += W[r][c]; else if (bd[r][c] === 1) s -= W[r][c]; } return s + (moves(bd, 2).length - moves(bd, 1).length) * 4; }
function mm(bd, d, a, bt, p){
  if (d === 0) return ev(bd);
  var ms = moves(bd, p);
  if (!ms.length) { if (!moves(bd, 3 - p).length) return (count(bd, 2) - count(bd, 1)) * 100; return mm(bd, d - 1, a, bt, 3 - p); }
  var i, v, nb;
  for (i = 0; i < ms.length; i++) { nb = copy(bd); put(nb, ms[i], p); v = mm(nb, d - 1, a, bt, 3 - p);
    if (p === 2) { if (v > a) a = v; } else { if (v < bt) bt = v; } if (a >= bt) break; }
  return p === 2 ? a : bt;
}
function reset(){
  var r, c; b = []; for (r = 0; r < N; r++) { b[r] = []; for (c = 0; c < N; c++) b[r][c] = 0; }
  b[3][3] = 2; b[4][4] = 2; b[3][4] = 1; b[4][3] = 1; turn = 1; over = false; KG.setOn(bl, lvl);
  sz = Math.floor(KG.width(640) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, tap); draw();
}
function tap(r, c){
  if (over || turn !== 1) return; var f = flips(b, r, c, 1); if (!f.length) return;
  put(b, [r, c, f], 1); turn = 2; next();
}
function next(){
  var mine = moves(b, 1), ai = moves(b, 2);
  if (!mine.length && !ai.length) { over = true; draw(); return; }
  if (turn === 2) { if (!ai.length) { turn = 1; draw('AI has no move - your turn again.'); return; } draw(); setTimeout(aiGo, 250); }
  else { if (!mine.length) { turn = 2; draw('You have no move - AI plays again.'); setTimeout(aiGo, 600); return; } draw(); }
}
function aiGo(){
  var ms = moves(b, 2), best = null, bv = -999999, i, v, nb;
  for (i = 0; i < ms.length; i++) {
    if (lvl === 0) v = ms[i][2].length * 3 + KG.rand(12);
    else { nb = copy(b); put(nb, ms[i], 2); v = lvl === 1 ? ev(nb) + KG.rand(3) : mm(nb, 3, -999999, 999999, 1); }
    if (v > bv) { bv = v; best = ms[i]; } }
  put(b, best, 2); turn = 1; next();
}
function draw(note){
  var r, c, t, ms = turn === 1 && !over ? moves(b, 1) : [], d = Math.floor(sz * 0.7), v, h;
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) { t = cells.c[r][c]; t.style.background = '#fff'; v = b[r][c]; h = '';
    if (v === 1) h = '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#000"></div>';
    else if (v === 2) h = '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#fff;border:4px solid #000"></div>';
    t.innerHTML = h; }
  for (var i = 0; i < ms.length; i++) cells.c[ms[i][0]][ms[i][1]].innerHTML = '<div style="margin:auto;width:' + Math.floor(sz * 0.2) + 'px;height:' + Math.floor(sz * 0.2) + 'px;border-radius:50%;background:#000"></div>';
  var a = count(b, 1), z = count(b, 2);
  KG.clear(msg); msg.appendChild(document.createTextNode(over ? (a > z ? 'You win! ' : a < z ? 'AI wins. ' : 'Draw. ') + a + ' - ' + z : (note || (turn === 1 ? 'Your move.' : 'AI thinking...')) + '   You ' + a + ' - AI ' + z));
}
reset();
//@@ hangman
var WORDS = 'planet,guitar,jungle,castle,pirate,rocket,island,bridge,garden,mirror,pencil,winter,summer,dragon,wizard,silver,orange,purple,monkey,turtle,rabbit,tiger,zebra,camera,candle,button,basket,anchor,desert,forest,magnet,ticket,window,yellow,pocket,whistle,balloon,blanket,compass,diamond,elephant,fireworks,giraffe,harbor,journey,kitchen,lantern,mountain,notebook,octopus,penguin,quarter,rainbow,sandwich,thunder,umbrella,village,waterfall,treasure,volcano,dolphin,puzzle,library,pyramid,airplane,backpack,chimney,doorbell,eclipse,feather,glacier,hammock,iceberg,jigsaw,kingdom,lighthouse,mermaid,nutshell,orchard,pancake,quicksand,riddle,sunrise,tornado,universe,vampire,walnut,yogurt,zeppelin,bicycle,cactus,galaxy,jacket,marble,ladder,scooter,trumpet'.split(',');
var word, got, wrong, MAXW = 7, wins = KG.get('hm_w', 0), losses = KG.get('hm_l', 0);
var panel = KG.el('div', 'panel', null, app), msg = KG.el('div', 'msg', '', panel), art = KG.el('div', 'center', null, panel), wd = KG.el('div', 'center', null, panel), kb = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel);
wd.style.cssText = 'font-size:42px;letter-spacing:6px;margin:8px 0'; kb.style.margin = '8px 0'; nb.style.marginTop = '10px';
KG.btn('New word', reset, nb, 'on');
function reset(){ word = WORDS[KG.rand(WORDS.length)].toUpperCase(); got = {}; wrong = 0; draw(); }
function done(){ for (var i = 0; i < word.length; i++) if (!got[word.charAt(i)]) return false; return true; }
function guess(l){
  if (got[l] || wrong >= MAXW || done()) return; got[l] = 1;
  if (word.indexOf(l) < 0) wrong++;
  if (done()) { wins++; KG.set('hm_w', wins); } else if (wrong >= MAXW) { losses++; KG.set('hm_l', losses); }
  draw();
}
function gallows(){
  var p = ['<line x1="20" y1="190" x2="140" y2="190"/>', '<line x1="50" y1="190" x2="50" y2="15"/><line x1="50" y1="15" x2="115" y2="15"/>', '<line x1="115" y1="15" x2="115" y2="40"/>', '<circle cx="115" cy="55" r="15"/>', '<line x1="115" y1="70" x2="115" y2="120"/>', '<line x1="115" y1="85" x2="95" y2="108"/><line x1="115" y1="85" x2="135" y2="108"/>', '<line x1="115" y1="120" x2="98" y2="155"/>', '<line x1="115" y1="120" x2="132" y2="155"/>'], s = '', i;
  for (i = 0; i <= wrong; i++) s += p[i]; if (wrong >= MAXW) s += '<line x1="107" y1="48" x2="113" y2="54"/><line x1="113" y1="48" x2="107" y2="54"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 160 200" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round">' + s + '</svg>';
}
function draw(){
  var i, s = '', L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', c;
  art.innerHTML = gallows();
  for (i = 0; i < word.length; i++) { c = word.charAt(i); s += (got[c] || wrong >= MAXW) ? c : '_'; s += ' '; }
  KG.clear(wd); wd.appendChild(document.createTextNode(s));
  KG.clear(kb);
  for (i = 0; i < 26; i++) (function (l) { var b = KG.btn(l, function () { guess(l); }, kb); b.style.cssText = 'margin:3px;width:' + Math.floor(KG.width(640) / 7 - 8) + 'px;padding:10px 0;' + (got[l] ? 'background:#000;color:#fff;opacity:.4' : ''); })(L.charAt(i));
  KG.clear(msg); msg.appendChild(document.createTextNode(done() ? 'You got it!   Wins ' + wins + '  Losses ' + losses : wrong >= MAXW ? 'Out of lives! Word was ' + word : 'Lives left: ' + (MAXW - wrong) + '   Wins ' + wins + '  Losses ' + losses));
}
reset();
//@@ sudoku
var lvl = KG.get('sd_l', 1), sol, giv, g, sel = -1, cells, sz, hint = false;
var panel = KG.el('div', 'panel', null, app), r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('sd_l', 0); reset(); }, rr1), KG.btn('Medium', function () { lvl = 1; KG.set('sd_l', 1); reset(); }, rr1), KG.btn('Hard', function () { lvl = 2; KG.set('sd_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), pad = KG.el('div', 'center', null, panel); pad.style.marginTop = '10px';
var nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('Check', function () { hint = !hint; draw(); }, nb); KG.btn('New puzzle', reset, nb, 'on');
function mask(g, i){ var r = (i / 9) | 0, c = i % 9, u = 0, k, br = r - r % 3, bc = c - c % 3; for (k = 0; k < 9; k++) { u |= 1 << g[r * 9 + k]; u |= 1 << g[k * 9 + c]; u |= 1 << g[(br + ((k / 3) | 0)) * 9 + bc + k % 3]; } return u; }
// counts solutions up to lim; when keep is true the first solution found stays in g
function solve(g, lim, keep){
  var best = -1, bn = 10, i, u, n, k, cnt = 0, ds = [];
  for (i = 0; i < 81; i++) if (!g[i]) { u = mask(g, i); n = 0; for (k = 1; k <= 9; k++) if (!(u & (1 << k))) n++; if (n < bn) { bn = n; best = i; if (n <= 1) break; } }
  if (best < 0) return 1; if (!bn) return 0;
  u = mask(g, best); for (k = 1; k <= 9; k++) if (!(u & (1 << k))) ds.push(k); if (keep) KG.shuffle(ds);
  for (k = 0; k < ds.length; k++) { g[best] = ds[k]; cnt += solve(g, lim - cnt, keep); if (cnt >= lim) { if (!keep) g[best] = 0; return cnt; } }
  g[best] = 0; return cnt;
}
function reset(){
  var i, f = []; for (i = 0; i < 81; i++) f.push(0); solve(f, 1, true); sol = f.slice();
  var keepN = [38, 31, 26][lvl], order = [], t, s; for (i = 0; i < 81; i++) order.push(i); KG.shuffle(order); var p = sol.slice(), left = 81;
  for (i = 0; i < 81 && left > keepN; i++) { s = p[order[i]]; p[order[i]] = 0; t = p.slice(); if (solve(t, 2, false) !== 1) p[order[i]] = s; else left--; }
  giv = p.slice(); g = p.slice(); sel = -1; hint = false; KG.setOn(bl, lvl);
  sz = Math.floor(KG.width(600) / 9); KG.clear(box); cells = KG.grid(9, 9, sz, box, function (r, c) { sel = r * 9 + c; draw(); });
  KG.clear(pad); for (i = 1; i <= 9; i++) (function (k) { var b = KG.btn('' + k, function () { setv(k); }, pad); b.style.cssText = 'margin:3px;width:' + Math.floor(KG.width(640) / 5 - 8) + 'px;padding:12px 0;font-size:26px'; })(i);
  var e = KG.btn('Erase', function () { setv(0); }, pad); e.style.cssText = 'margin:3px;width:' + Math.floor(KG.width(640) / 5 - 8) + 'px;padding:12px 0;font-size:20px';
  draw();
}
function setv(k){ if (sel < 0 || giv[sel]) return; g[sel] = k; draw(); }
function draw(){
  var r, c, i, t, v, bad, full = true, ok = true;
  for (r = 0; r < 9; r++) for (c = 0; c < 9; c++) { i = r * 9 + c; v = g[i]; t = cells.c[r][c];
    bad = hint && v && v !== sol[i]; if (!v) full = false; if (v && v !== sol[i]) ok = false;
    t.style.background = i === sel ? '#000' : bad ? '#bbb' : ((((r / 3) | 0) + ((c / 3) | 0)) % 2 ? '#eee' : '#fff'); t.style.color = i === sel ? '#fff' : '#000';
    t.innerHTML = v ? (giv[i] ? v : '<span style="font-weight:normal;text-decoration:underline">' + v + '</span>') : '';
    t.style.borderRightWidth = c % 3 === 2 ? '4px' : '1px'; t.style.borderBottomWidth = r % 3 === 2 ? '4px' : '1px'; t.style.borderTopWidth = r % 3 === 0 ? '4px' : '1px'; t.style.borderLeftWidth = c % 3 === 0 ? '4px' : '1px'; }
  KG.clear(msg); msg.appendChild(document.createTextNode(full && ok ? 'Solved! Well done!' : hint ? 'Grey squares are wrong.' : 'Tap a square, then a number. Underlined = yours.'));
}
reset();
