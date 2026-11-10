//@@ mastermind
var L = 'ABCDEF', code, rows, cur, over, MAXR = 10;
var panel = KG.el('div', 'panel', null, app), msg = KG.el('div', 'msg', '', panel), hist = KG.el('div', 'center', null, panel), pad = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel);
pad.style.marginTop = '10px'; nb.style.marginTop = '10px';
KG.el('div', 'foot', 'Crack the 4-letter code (letters A-F, repeats allowed). Solid dot = right letter, right place. Ring = right letter, wrong place.', panel);
KG.btn('New game', reset, nb, 'on');
function reset(){ code = []; for (var i = 0; i < 4; i++) code.push(L.charAt(KG.rand(6))); rows = []; cur = []; over = ''; draw(); }
function score(g){
  var ex = 0, mi = 0, cc = {}, gg = {}, i, k;
  for (i = 0; i < 4; i++) { if (g[i] === code[i]) ex++; else { cc[code[i]] = (cc[code[i]] || 0) + 1; gg[g[i]] = (gg[g[i]] || 0) + 1; } }
  for (k in gg) if (cc[k]) mi += Math.min(gg[k], cc[k]);
  return [ex, mi];
}
function add(l){ if (over || cur.length >= 4) return; cur.push(l); draw(); }
function back(){ cur.pop(); draw(); }
function enter(){
  if (over || cur.length < 4) return; var s = score(cur); rows.push({ g: cur.slice(), s: s }); cur = [];
  if (s[0] === 4) over = 'You cracked it in ' + rows.length + '!'; else if (rows.length >= MAXR) over = 'Out of guesses. The code was ' + code.join('') + '.';
  draw();
}
function draw(){
  var h = '<table style="margin:0 auto;border-collapse:collapse;font-size:26px">', i, k;
  for (i = 0; i < rows.length; i++) { var r = rows[i], d = ''; for (k = 0; k < r.s[0]; k++) d += '●'; for (k = 0; k < r.s[1]; k++) d += '○'; h += '<tr><td style="border:2px solid #000;padding:4px 14px;width:40px">' + (i + 1) + '</td><td style="border:2px solid #000;padding:4px 18px;letter-spacing:10px">' + r.g.join('') + '</td><td style="border:2px solid #000;padding:4px 14px;min-width:150px;text-align:left;letter-spacing:3px">' + d + '</td></tr>'; }
  if (!over) { var c = cur.join(''); while (c.length < 4) c += '_'; h += '<tr><td style="border:3px solid #000;padding:4px 14px">' + (rows.length + 1) + '</td><td style="border:3px solid #000;padding:4px 18px;letter-spacing:10px">' + c + '</td><td style="border:3px solid #000;padding:4px 14px">?</td></tr>'; }
  hist.innerHTML = h + '</table>'; KG.clear(pad);
  for (i = 0; i < 6; i++) (function (l) { var b = KG.btn(l, function () { add(l); }, pad, 'big'); b.style.width = '78px'; })(L.charAt(i));
  var d2 = KG.el('div', null, null, pad); d2.style.marginTop = '8px'; KG.btn('Delete', back, d2); KG.btn('Enter', enter, d2, 'on');
  KG.clear(msg); msg.appendChild(document.createTextNode(over || 'Guess ' + (rows.length + 1) + ' of ' + MAXR));
}
reset();
//@@ word-search
var N = 10, WORDS = 'planet,guitar,jungle,castle,pirate,rocket,island,bridge,garden,mirror,pencil,winter,dragon,wizard,silver,orange,monkey,turtle,rabbit,tiger,zebra,camera,candle,button,basket,anchor,desert,forest,magnet,ticket,window,yellow,pocket,whistle,balloon,blanket,compass,diamond,giraffe,harbor,kitchen,lantern,mountain,octopus,penguin,rainbow,thunder,umbrella,village,volcano,dolphin,puzzle,library,pyramid,airplane,backpack,feather,glacier,hammock,iceberg,kingdom,mermaid,orchard,pancake,sunrise,tornado,bicycle,cactus,galaxy,jacket,marble,ladder,scooter,trumpet'.split(','), g, words, found, first, cells, sz, note = '';
var panel = KG.el('div', 'panel', null, app), msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), list = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel);
list.style.cssText = 'margin-top:10px;font-size:22px;line-height:1.7'; nb.style.marginTop = '10px'; KG.btn('New puzzle', reset, nb, 'on');
KG.el('div', 'foot', 'Tap the first letter of a word, then its last letter. Words run in straight lines, forwards or backwards.', panel);
function reset(){
  var r, c, i, tries; g = []; for (r = 0; r < N; r++) { g[r] = []; for (c = 0; c < N; c++) g[r][c] = ''; }
  var pool = KG.shuffle(WORDS.slice()), D = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[1,-1],[-1,-1]]; words = []; found = {}; first = null; note = '';
  for (i = 0; i < pool.length && words.length < 8; i++) { var w = pool[i].toUpperCase(), placed = false;
    for (tries = 0; tries < 60 && !placed; tries++) { var d = D[KG.rand(D.length)], r0 = KG.rand(N), c0 = KG.rand(N), k, ok = true, er = r0 + d[0] * (w.length - 1), ec = c0 + d[1] * (w.length - 1);
      if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
      for (k = 0; k < w.length; k++) { var cur = g[r0 + d[0] * k][c0 + d[1] * k]; if (cur && cur !== w.charAt(k)) { ok = false; break; } }
      if (!ok) continue; for (k = 0; k < w.length; k++) g[r0 + d[0] * k][c0 + d[1] * k] = w.charAt(k);
      words.push({ w: w, r0: r0, c0: c0, er: er, ec: ec, d: d }); placed = true; } }
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (!g[r][c]) g[r][c] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(KG.rand(26));
  sz = Math.floor(KG.width(640) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, tap); draw();
}
function tap(r, c){
  if (!first) { first = [r, c]; draw(); return; }
  var i, hit = null; note = '';
  for (i = 0; i < words.length; i++) { var w = words[i]; if ((w.r0 === first[0] && w.c0 === first[1] && w.er === r && w.ec === c) || (w.er === first[0] && w.ec === first[1] && w.r0 === r && w.c0 === c)) hit = w; }
  if (hit) { found[hit.w] = true; note = 'Found ' + hit.w + '!'; } else if (!(first[0] === r && first[1] === c)) note = 'Not a word - try again.';
  first = null; draw();
}
function draw(){
  var r, c, t, i, mark = {}, k, w, n = 0;
  for (i = 0; i < words.length; i++) if (found[words[i].w]) { n++; w = words[i]; for (k = 0; k < w.w.length; k++) mark[(w.r0 + w.d[0] * k) * N + w.c0 + w.d[1] * k] = 1; }
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) { t = cells.c[r][c]; t.innerHTML = g[r][c]; var sel = first && first[0] === r && first[1] === c; t.style.background = sel ? '#000' : mark[r * N + c] ? '#bbb' : '#fff'; t.style.color = sel ? '#fff' : '#000'; t.style.borderWidth = '1px'; }
  var h = ''; for (i = 0; i < words.length; i++) h += '<span style="margin:0 10px;white-space:nowrap;' + (found[words[i].w] ? 'text-decoration:line-through;opacity:.5' : '') + '">' + words[i].w + '</span> ';
  list.innerHTML = h; KG.clear(msg); msg.appendChild(document.createTextNode(n === words.length ? 'All words found! Great job!' : (note || 'Find the ' + words.length + ' words.') + '   ' + n + '/' + words.length));
}
reset();
//@@ nonogram
var N = KG.get('ng_n', 8), sol, g, rc, cc, mode = 0, cells, sz, solved = false;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Size', r1); var rr1 = KG.el('div', 'r', null, r1);
var bs = [KG.btn('5x5', function () { N = 5; KG.set('ng_n', 5); reset(); }, rr1), KG.btn('8x8', function () { N = 8; KG.set('ng_n', 8); reset(); }, rr1), KG.btn('10x10', function () { N = 10; KG.set('ng_n', 10); reset(); }, rr1)];
var r2 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Tap does', r2); var rr2 = KG.el('div', 'r', null, r2);
var bm = [KG.btn('Fill', function () { mode = 0; KG.setOn(bm, 0); }, rr2), KG.btn('Mark X', function () { mode = 1; KG.setOn(bm, 1); }, rr2)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px'; KG.btn('New puzzle', reset, nb, 'on');
KG.el('div', 'foot', 'Numbers give the lengths of black runs in each row and column. Fill squares to match them all.', panel);
function runs(a){ var o = [], n = 0, i; for (i = 0; i < a.length; i++) { if (a[i]) n++; else if (n) { o.push(n); n = 0; } } if (n) o.push(n); return o.length ? o : [0]; }
function reset(){
  var r, c; sol = []; g = []; for (r = 0; r < N; r++) { sol[r] = []; g[r] = []; for (c = 0; c < N; c++) { sol[r][c] = KG.rand(100) < 58 ? 1 : 0; g[r][c] = 0; } }
  rc = []; cc = []; for (r = 0; r < N; r++) rc.push(runs(sol[r])); for (c = 0; c < N; c++) { var col = []; for (r = 0; r < N; r++) col.push(sol[r][c]); cc.push(runs(col)); }
  solved = false; mode = 0; KG.setOn(bm, 0); KG.setOn(bs, N === 5 ? 0 : N === 8 ? 1 : 2); build();
}
function build(){
  var w = KG.width(660), cs = Math.floor(w / (N + 3)), r, c, h = '<table style="margin:0 auto;border-collapse:collapse"><tr><td></td>'; sz = cs;
  for (c = 0; c < N; c++) h += '<td style="vertical-align:bottom;text-align:center;font-size:' + Math.floor(cs * 0.42) + 'px;line-height:1.05;padding:0 0 4px;width:' + cs + 'px">' + cc[c].join('<br>') + '</td>';
  h += '</tr>';
  for (r = 0; r < N; r++) { h += '<tr><td style="text-align:right;padding-right:8px;white-space:nowrap;font-size:' + Math.floor(cs * 0.42) + 'px">' + rc[r].join(' ') + '</td>';
    for (c = 0; c < N; c++) h += '<td id="n' + r + '_' + c + '" style="width:' + cs + 'px;height:' + cs + 'px;border:2px solid #000;text-align:center;font-size:' + Math.floor(cs * 0.6) + 'px;cursor:pointer;' + (c % 5 === 4 && c < N - 1 ? 'border-right:5px solid #000;' : '') + (r % 5 === 4 && r < N - 1 ? 'border-bottom:5px solid #000;' : '') + '"></td>';
    h += '</tr>'; }
  box.innerHTML = h + '</table>';
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) (function (a, b) { KG.$('n' + a + '_' + b).onclick = function () { tap(a, b); }; })(r, c);
  draw();
}
function tap(r, c){ if (solved) return; var v = g[r][c]; if (mode === 0) g[r][c] = v === 1 ? 0 : 1; else g[r][c] = v === 2 ? 0 : 2; draw(); }
function draw(){
  var r, c, t, ok = true, col;
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) { t = KG.$('n' + r + '_' + c); t.style.background = g[r][c] === 1 ? '#000' : '#fff'; t.style.color = '#000'; t.innerHTML = g[r][c] === 2 ? 'x' : ''; }
  for (r = 0; r < N && ok; r++) { var a = []; for (c = 0; c < N; c++) a.push(g[r][c] === 1 ? 1 : 0); if (runs(a).join() !== rc[r].join()) ok = false; }
  for (c = 0; c < N && ok; c++) { col = []; for (r = 0; r < N; r++) col.push(g[r][c] === 1 ? 1 : 0); if (runs(col).join() !== cc[c].join()) ok = false; }
  solved = ok; KG.clear(msg); msg.appendChild(document.createTextNode(ok ? 'Solved! Nice picture.' : 'Fill the grid to match the clues.'));
}
reset();
//@@ pig
var me = 0, ai = 0, turnTot = 0, turn = 0, over = '', die = 0, note = '', lvl = KG.get('pig_l', 1), GOAL = 100;
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI style', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Careful', function () { lvl = 0; KG.set('pig_l', 0); reset(); }, rr1), KG.btn('Normal', function () { lvl = 1; KG.set('pig_l', 1); reset(); }, rr1), KG.btn('Daring', function () { lvl = 2; KG.set('pig_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), sc = KG.el('div', 'center', null, panel), dv = KG.el('div', 'center', null, panel), ctl = KG.el('div', 'center', null, panel); sc.style.cssText = 'font-size:26px;margin:8px 0'; ctl.style.marginTop = '12px';
KG.el('div', 'foot', 'Roll as many times as you dare to build your turn total, then Hold to bank it. Roll a 1 and you lose the turn total! First to 100 wins.', panel);
function dieSvg(n){
  var P = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] }, s = '<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="14" fill="#fff" stroke="#000" stroke-width="6"/>', i;
  if (n) for (i = 0; i < P[n].length; i++) s += '<circle cx="' + P[n][i][0] + '" cy="' + P[n][i][1] + '" r="8" fill="#000"/>'; return s + '</svg>';
}
function reset(){ me = 0; ai = 0; turnTot = 0; turn = 0; over = ''; die = 0; note = 'Your turn. Roll!'; KG.setOn(bl, lvl); draw(); }
function roll(){
  if (over || turn !== 0) return; die = 1 + KG.rand(6);
  if (die === 1) { note = 'You rolled a 1! Turn total lost.'; turnTot = 0; turn = 1; draw(); setTimeout(aiTurn, 900); } else { turnTot += die; note = ''; draw(); }
}
function hold(){
  if (over || turn !== 0 || !turnTot) return; me += turnTot; turnTot = 0; note = 'You banked it.'; if (me >= GOAL) { over = 'You win!'; draw(); return; } turn = 1; draw(); setTimeout(aiTurn, 700);
}
function aiTurn(){
  var lim = [15, 21, 28][lvl], tot = 0, log = '';
  while (true) { var d = 1 + KG.rand(6); die = d; if (d === 1) { tot = 0; log = 'AI rolled a 1 and lost its turn.'; break; } tot += d; if (tot >= lim || ai + tot >= GOAL) { log = 'AI banked ' + tot + '.'; break; } }
  ai += tot; turn = 0; turnTot = 0; note = log + ' Your turn.'; if (ai >= GOAL) over = 'AI wins this time.'; draw();
}
function draw(){
  KG.clear(sc); sc.appendChild(document.createTextNode('You ' + me + '   |   AI ' + ai)); dv.innerHTML = dieSvg(die); KG.clear(ctl);
  if (over) KG.btn('Play again', reset, ctl, 'big on'); else if (turn === 0) { KG.btn('Roll', roll, ctl, 'big'); KG.btn('Hold (+' + turnTot + ')', hold, ctl, 'big'); }
  KG.clear(msg); msg.appendChild(document.createTextNode(over || note + (turn === 0 && turnTot ? '   Turn total: ' + turnTot : '')));
}
reset();
//@@ dots-and-boxes
var B = 4, lvl = KG.get('db_l', 1), H, V, own, turn, over, sc = [0, 0], note = '';
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'AI level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('db_l', 0); reset(); }, rr1), KG.btn('Normal', function () { lvl = 1; KG.set('db_l', 1); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px'; KG.btn('New game', reset, nb, 'on');
KG.el('div', 'foot', 'Tap a gap between two dots to draw a line. Close a box to claim it (Y = you, A = AI) and move again.', panel);
function reset(){ var i, j; H = []; V = []; own = []; for (i = 0; i <= B; i++) { H[i] = []; V[i] = []; for (j = 0; j <= B; j++) { H[i][j] = 0; V[i][j] = 0; } } for (i = 0; i < B; i++) { own[i] = []; for (j = 0; j < B; j++) own[i][j] = ''; } sc = [0, 0]; turn = 0; over = ''; note = ''; KG.setOn(bl, lvl); draw(); }
function sides(i, j){ return H[i][j] + H[i + 1][j] + V[i][j] + V[i][j + 1]; }
function claim(who){ var n = 0, i, j; for (i = 0; i < B; i++) for (j = 0; j < B; j++) if (!own[i][j] && sides(i, j) === 4) { own[i][j] = who ? 'A' : 'Y'; sc[who]++; n++; } return n; }
function line(t, i, j){ if (t === 'H') H[i][j] = 1; else V[i][j] = 1; var n = claim(turn); if (sc[0] + sc[1] === B * B) { over = sc[0] > sc[1] ? 'You win ' + sc[0] + ' to ' + sc[1] + '!' : sc[0] < sc[1] ? 'AI wins ' + sc[1] + ' to ' + sc[0] + '.' : 'Draw!'; draw(); return; } if (!n) turn = 1 - turn; draw(); if (turn === 1) setTimeout(aiGo, 400); }
function tap(t, i, j){ if (over || turn !== 0) return; if ((t === 'H' ? H : V)[i][j]) return; line(t, i, j); }
function aiGo(){
  var all = [], i, j, take = [], safe = [], m;
  for (i = 0; i <= B; i++) for (j = 0; j < B; j++) if (!H[i][j]) all.push(['H', i, j]);
  for (i = 0; i < B; i++) for (j = 0; j <= B; j++) if (!V[i][j]) all.push(['V', i, j]);
  for (var k = 0; k < all.length; k++) { var a = all[k]; var cs = a[0] === 'H' ? [[a[1] - 1, a[2]], [a[1], a[2]]] : [[a[1], a[2] - 1], [a[1], a[2]]], gives = false, takes = false;
    for (var z = 0; z < 2; z++) { var bi = cs[z][0], bj = cs[z][1]; if (bi < 0 || bi >= B || bj < 0 || bj >= B) continue; var s = sides(bi, bj); if (s === 3) takes = true; if (s === 2) gives = true; }
    if (takes) take.push(a); else if (!gives) safe.push(a); }
  if (lvl === 1 && take.length) m = take[KG.rand(take.length)]; else if (lvl === 0 && take.length && KG.rand(3)) m = take[0]; else if (safe.length) m = safe[KG.rand(safe.length)]; else m = all[KG.rand(all.length)];
  line(m[0], m[1], m[2]);
}
function draw(){
  var d = 22, w = Math.floor((KG.width(640) - d * (B + 1)) / B), h = '<table style="margin:0 auto;border-collapse:collapse">', i, j;
  for (i = 0; i <= B; i++) {
    h += '<tr>'; for (j = 0; j <= B; j++) { h += '<td style="width:' + d + 'px;height:' + d + 'px;padding:0"><div style="width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#000"></div></td>'; if (j < B) h += '<td id="h' + i + '_' + j + '" style="width:' + w + 'px;height:' + d + 'px;padding:0;cursor:pointer"><div style="margin:' + (H[i][j] ? '0' : '8px 0') + ';height:' + (H[i][j] ? '22px' : '6px') + ';background:' + (H[i][j] ? '#000' : '#bbb') + '"></div></td>'; } h += '</tr>';
    if (i < B) { h += '<tr>'; for (j = 0; j <= B; j++) { h += '<td id="v' + i + '_' + j + '" style="width:' + d + 'px;height:' + w + 'px;padding:0;cursor:pointer"><div style="margin:0 ' + (V[i][j] ? '0' : '8px') + ';width:' + (V[i][j] ? '22px' : '6px') + ';height:' + w + 'px;background:' + (V[i][j] ? '#000' : '#bbb') + '"></div></td>'; if (j < B) h += '<td style="text-align:center;font-size:' + Math.floor(w * 0.5) + 'px;' + (own[i][j] === 'Y' ? 'background:#ddd' : own[i][j] === 'A' ? 'background:#999' : '') + '">' + own[i][j] + '</td>'; } h += '</tr>'; } }
  box.innerHTML = h + '</table>';
  for (i = 0; i <= B; i++) for (j = 0; j <= B; j++) { (function (a, b) { var e = KG.$('h' + a + '_' + b); if (e) e.onclick = function () { tap('H', a, b); }; var f = KG.$('v' + a + '_' + b); if (f) f.onclick = function () { tap('V', a, b); }; })(i, j); }
  KG.clear(msg); msg.appendChild(document.createTextNode(over || (turn === 0 ? 'Your move.' : 'AI thinking...') + '   You ' + sc[0] + ' - AI ' + sc[1]));
}
reset();
//@@ peg-solitaire
var N = 7, g, sel = null, hist, cells, sz;
var panel = KG.el('div', 'panel', null, app), msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px';
KG.btn('Undo', undo, nb); KG.btn('Restart', reset, nb, 'on');
KG.el('div', 'foot', 'Tap a peg, then tap an empty hole two steps away to jump over a neighbour and remove it. Finish with a single peg.', panel);
function ok(r, c){ return r >= 0 && r < 7 && c >= 0 && c < 7 && !((r < 2 || r > 4) && (c < 2 || c > 4)); }
function reset(){ var r, c; g = []; for (r = 0; r < 7; r++) { g[r] = []; for (c = 0; c < 7; c++) g[r][c] = ok(r, c) ? 1 : -1; } g[3][3] = 0; sel = null; hist = []; sz = Math.floor(KG.width(600) / 7); KG.clear(box); cells = KG.grid(7, 7, sz, box, tap); draw(); }
function jumps(r, c){ var o = [], d = [[2,0],[-2,0],[0,2],[0,-2]], i; for (i = 0; i < 4; i++) { var tr = r + d[i][0], tc = c + d[i][1]; if (ok(tr, tc) && g[tr][tc] === 0 && g[r + d[i][0] / 2][c + d[i][1] / 2] === 1) o.push([tr, tc]); } return o; }
function count(){ var n = 0, r, c; for (r = 0; r < 7; r++) for (c = 0; c < 7; c++) if (g[r][c] === 1) n++; return n; }
function anyMove(){ for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) if (g[r][c] === 1 && jumps(r, c).length) return true; return false; }
function tap(r, c){
  if (g[r][c] < 0) return;
  if (sel) { var js = jumps(sel[0], sel[1]), i; for (i = 0; i < js.length; i++) if (js[i][0] === r && js[i][1] === c) { hist.push(JSON.stringify(g)); g[r][c] = 1; g[sel[0]][sel[1]] = 0; g[(r + sel[0]) / 2][(c + sel[1]) / 2] = 0; sel = null; draw(); return; } }
  sel = g[r][c] === 1 ? [r, c] : null; draw();
}
function undo(){ if (hist.length) { g = JSON.parse(hist.pop()); sel = null; draw(); } }
function draw(){
  var r, c, t, d = Math.floor(sz * 0.7), js = sel ? jumps(sel[0], sel[1]) : [], i;
  for (r = 0; r < 7; r++) for (c = 0; c < 7; c++) { t = cells.c[r][c]; if (g[r][c] < 0) { t.style.border = 'none'; t.style.background = 'transparent'; t.innerHTML = ''; continue; } t.style.background = '#fff'; var s = sel && sel[0] === r && sel[1] === c;
    t.innerHTML = g[r][c] === 1 ? '<div style="margin:auto;width:' + d + 'px;height:' + d + 'px;border-radius:50%;background:#000;' + (s ? 'box-shadow:0 0 0 4px #fff,0 0 0 8px #000' : '') + '"></div>' : '<div style="margin:auto;width:' + Math.floor(d * 0.35) + 'px;height:' + Math.floor(d * 0.35) + 'px;border-radius:50%;border:3px solid #000"></div>'; }
  for (i = 0; i < js.length; i++) cells.c[js[i][0]][js[i][1]].innerHTML = '<div style="margin:auto;width:' + Math.floor(d * 0.6) + 'px;height:' + Math.floor(d * 0.6) + 'px;border-radius:50%;border:5px dashed #000"></div>';
  var n = count(); KG.clear(msg); msg.appendChild(document.createTextNode(n === 1 ? 'Perfect! One peg left!' : !anyMove() ? 'No moves left. ' + n + ' pegs remain. Try again (or Undo).' : 'Pegs left: ' + n));
}
reset();
//@@ takuzu
var N = 6, sol, g, giv, cells, sz, lvl = KG.get('tk_l', 1);
var panel = KG.el('div', 'panel', null, app);
var r1 = KG.el('div', 'row', null, panel); KG.el('div', 'l', 'Level', r1); var rr1 = KG.el('div', 'r', null, r1);
var bl = [KG.btn('Easy', function () { lvl = 0; KG.set('tk_l', 0); reset(); }, rr1), KG.btn('Medium', function () { lvl = 1; KG.set('tk_l', 1); reset(); }, rr1), KG.btn('Hard', function () { lvl = 2; KG.set('tk_l', 2); reset(); }, rr1)];
var msg = KG.el('div', 'msg', '', panel), box = KG.el('div', 'center', null, panel), nb = KG.el('div', 'center', null, panel); nb.style.marginTop = '10px'; KG.btn('Check', function () { chk = !chk; draw(); }, nb); KG.btn('New puzzle', reset, nb, 'on');
KG.el('div', 'foot', 'Fill every square with 0 or 1. No more than two of the same in a row or column, each row/column has equal 0s and 1s, and no two rows (or columns) are identical. Tap a square to cycle blank / 0 / 1.', panel);
var chk = false;
function valid(a, N2){ var r, c, k; for (r = 0; r < N2; r++) { var z = 0, o = 0; for (c = 0; c < N2; c++) { var v = a[r][c]; if (v === 0) z++; else if (v === 1) o++; if (c >= 2 && v !== -1 && v === a[r][c - 1] && v === a[r][c - 2]) return false; } if (z > N2 / 2 || o > N2 / 2) return false; }
  for (c = 0; c < N2; c++) { var z2 = 0, o2 = 0; for (r = 0; r < N2; r++) { var w = a[r][c]; if (w === 0) z2++; else if (w === 1) o2++; if (r >= 2 && w !== -1 && w === a[r - 1][c] && w === a[r - 2][c]) return false; } if (z2 > N2 / 2 || o2 > N2 / 2) return false; }
  for (r = 0; r < N2; r++) for (k = r + 1; k < N2; k++) { if (a[r].indexOf(-1) < 0 && a[k].indexOf(-1) < 0 && a[r].join() === a[k].join()) return false; }
  for (c = 0; c < N2; c++) for (k = c + 1; k < N2; k++) { var s1 = [], s2 = [], q; for (q = 0; q < N2; q++) { s1.push(a[q][c]); s2.push(a[q][k]); } if (s1.indexOf(-1) < 0 && s2.indexOf(-1) < 0 && s1.join() === s2.join()) return false; }
  return true; }
function fill(a, i){ if (i === N * N) return true; var r = (i / N) | 0, c = i % N, o = KG.rand(2), t; for (t = 0; t < 2; t++) { a[r][c] = (o + t) % 2; if (valid(a, N) && fill(a, i + 1)) return true; } a[r][c] = -1; return false; }
function reset(){
  var r, c, a = []; for (r = 0; r < N; r++) { a[r] = []; for (c = 0; c < N; c++) a[r][c] = -1; } fill(a, 0); sol = a;
  var keep = [0.55, 0.42, 0.32][lvl]; g = []; giv = []; for (r = 0; r < N; r++) { g[r] = []; giv[r] = []; for (c = 0; c < N; c++) { var k = KG.rand(1000) / 1000 < keep; giv[r][c] = k; g[r][c] = k ? sol[r][c] : -1; } }
  chk = false; KG.setOn(bl, lvl); sz = Math.floor(KG.width(520) / N); KG.clear(box); cells = KG.grid(N, N, sz, box, tap); draw();
}
function tap(r, c){ if (giv[r][c]) return; g[r][c] = g[r][c] === -1 ? 0 : g[r][c] === 0 ? 1 : -1; draw(); }
function draw(){
  var r, c, t, full = true;
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) { t = cells.c[r][c]; var v = g[r][c]; if (v < 0) full = false; t.innerHTML = v < 0 ? '' : v; t.style.background = giv[r][c] ? '#ddd' : '#fff'; if (chk && v >= 0 && !giv[r][c] && v !== sol[r][c]) t.style.background = '#888'; t.style.color = '#000'; }
  var done = full && valid(g, N); KG.clear(msg); msg.appendChild(document.createTextNode(done ? 'Solved! Well done!' : chk ? 'Dark squares differ from the solution.' : 'Grey squares are fixed. Tap others to set 0 / 1.'));
}
reset();
//@@ word-scramble
var WORDS = 'planet,guitar,jungle,castle,pirate,rocket,island,bridge,garden,mirror,pencil,winter,summer,dragon,wizard,silver,orange,purple,monkey,turtle,rabbit,tiger,zebra,camera,candle,button,basket,anchor,desert,forest,magnet,ticket,window,yellow,pocket,whistle,balloon,blanket,compass,diamond,elephant,giraffe,harbor,journey,kitchen,lantern,mountain,notebook,octopus,penguin,rainbow,sandwich,thunder,umbrella,village,volcano,dolphin,puzzle,library,pyramid,airplane,backpack,feather,glacier,hammock,iceberg,kingdom,mermaid,orchard,pancake,sunrise,tornado,bicycle,cactus,galaxy,jacket,marble,ladder,scooter,trumpet'.split(','), word, letters, used, ans, score = 0, streak = 0, note = '';
var panel = KG.el('div', 'panel', null, app), msg = KG.el('div', 'msg', '', panel), ansD = KG.el('div', 'center', null, panel), pad = KG.el('div', 'center', null, panel), ctl = KG.el('div', 'center', null, panel);
ansD.style.cssText = 'font-size:44px;letter-spacing:8px;margin:12px 0;min-height:56px'; pad.style.margin = '10px 0';
function scr(w){ var a = w.toUpperCase().split(''), t; do { KG.shuffle(a); t = a.join(''); } while (t === w.toUpperCase()); return a; }
function next(){ word = WORDS[KG.rand(WORDS.length)]; letters = scr(word); used = []; ans = ''; note = ''; draw(); }
function press(i){ if (used[i]) return; used[i] = true; ans += letters[i]; if (ans.length === word.length) { if (ans === word.toUpperCase()) { score++; streak++; note = 'Correct! ' + word.toUpperCase(); draw(); setTimeout(next, 900); return; } note = 'Not quite - try again.'; used = []; ans = ''; streak = 0; } draw(); }
function draw(){
  var i; KG.clear(ansD); ansD.appendChild(document.createTextNode(ans || ' ')); KG.clear(pad);
  for (i = 0; i < letters.length; i++) (function (k) { var b = KG.btn(letters[k], function () { press(k); }, pad, 'big'); b.style.cssText = 'margin:5px;width:70px;padding:12px 0;font-size:30px;' + (used[k] ? 'opacity:.2' : ''); })(i);
  KG.clear(ctl); KG.btn('Clear', function () { used = []; ans = ''; note = ''; draw(); }, ctl); KG.btn('Hint', function () { note = 'Starts with ' + word.charAt(0).toUpperCase(); draw(); }, ctl); KG.btn('Skip', function () { streak = 0; note = 'It was ' + word.toUpperCase(); next(); }, ctl, 'on');
  KG.clear(msg); msg.appendChild(document.createTextNode((note || 'Unscramble the word: tap the letters in order.') + '   Score ' + score));
}
next();
