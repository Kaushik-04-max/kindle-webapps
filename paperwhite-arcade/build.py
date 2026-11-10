import os, re, zipfile, html
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src'); OUT = os.path.join(ROOT, 'site')

# id, title, category, description, glyph
GAMES = [
 ('chess', 'Chess', 'Board', 'Full rules, checkmate detection, 3 AI levels or 2 players.', '♞'),
 ('tic-tac-toe', 'Tic-Tac-Toe', 'Board', 'Beat the AI or play a friend.', 'X'),
 ('connect-four', 'Connect Four', 'Board', 'Drop discs, line up four.', '4'),
 ('reversi', 'Reversi', 'Board', 'Flip the board. Easy, Normal, Hard AI.', 'R'),
 ('memory', 'Memory Match', 'Puzzle', 'Find the pairs. Three board sizes.', '?'),
 ('minesweeper', 'Minesweeper', 'Puzzle', 'Classic 9x9 with a Flag mode for tapping.', '*'),
 ('lights-out', 'Lights Out', 'Puzzle', 'Turn every square white.', 'L'),
 ('slide-puzzle', 'Slide Puzzle', 'Puzzle', 'Number sliding puzzle in 3 sizes.', '15'),
 ('hanoi', 'Tower of Hanoi', 'Puzzle', 'Move the tower with 3 to 7 discs.', 'H'),
 ('2048', '2048', 'Puzzle', 'Merge tiles. Swipe or tap the arrows.', '2K'),
 ('flood-it', 'Flood-It', 'Puzzle', 'Flood the board in 22 moves.', 'F'),
 ('sudoku', 'Sudoku', 'Puzzle', 'Fresh puzzles in 3 difficulties.', '9'),
 ('checkers', 'Checkers', 'Board', 'Forced captures and kings. 3 AI levels.', 'C'),
 ('mancala', 'Mancala', 'Board', 'Sow seeds, steal captures, win the store race.', 'M'),
 ('gomoku', 'Gomoku', 'Board', 'Five in a row on a 15x15 board.', '5'),
 ('battleship', 'Battleship', 'Board', 'Hunt the enemy fleet on a 10x10 sea.', 'B'),
 ('dots-and-boxes', 'Dots and Boxes', 'Board', 'Draw lines, close boxes, beat the AI.', '#'),
 ('nim', 'Nim', 'Board', 'Take the last stone. Can you beat perfect play?', 'N'),
 ('peg-solitaire', 'Peg Solitaire', 'Puzzle', 'Jump pegs until only one is left.', 'P'),
 ('mastermind', 'Mastermind', 'Puzzle', 'Crack the secret letter code in 10 tries.', 'MM'),
 ('nonogram', 'Nonogram', 'Puzzle', 'Fill the grid using number clues to reveal a picture.', 'NG'),
 ('takuzu', 'Takuzu', 'Puzzle', 'Binary logic puzzle: fill with 0 and 1.', '01'),
 ('blackjack', 'Blackjack', 'Cards', 'Beat the dealer to 21. Hit, stand or double.', '21'),
 ('higher-or-lower', 'Higher or Lower', 'Cards', 'Guess the next card and build a streak.', '↕'),
 ('pig', 'Pig', 'Cards', 'Push-your-luck dice race to 100.', 'D'),
 ('word-search', 'Word Search', 'Word', 'Find the hidden words in the grid.', 'W'),
 ('word-scramble', 'Word Scramble', 'Word', 'Unscramble the letters.', 'S'),
 ('hangman', 'Hangman', 'Word', 'Guess the word with the on-screen keys.', 'A'),
]
SECTIONS = {}
def load():
    for gf in sorted(os.listdir(SRC)):
        if not (gf.startswith('games') and gf.endswith('.js')): continue
        t = open(os.path.join(SRC, gf), encoding='utf-8').read()
        for part in re.split(r'^//@@ ', t, flags=re.M)[1:]:
            name, _, body = part.partition('\n'); SECTIONS[name.strip()] = body
    for f in os.listdir(SRC):
        if f.endswith('.js') and f != 'kg.js' and not f.startswith('games'):
            SECTIONS[f[:-3]] = open(os.path.join(SRC, f), encoding='utf-8').read()
BAD = [r'\blet\b', r'\bconst\b', r'=>', r'`', r'\.includes\(', r'Array\.from', r'Object\.assign', r'\.fill\(', r'\bclass\b']
def lint(name, code):
    for p in BAD:
        for m in re.finditer(p, re.sub(r"'[^'\n]*'|\"[^\"\n]*\"", "''", code)):
            raise SystemExit('ES5 lint: %s has %s' % (name, p))
HEAD = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title><style>%s</style></head><body><div class="wrap">'
def page(g, css, kgjs):
    gid, title, cat, desc, gl = g
    code = SECTIONS[gid]; lint(gid, code)
    return (HEAD % (html.escape(title) + ' - Paperwhite Arcade', css) +
      '<div class="top"><a class="back" href="index.html">&larr; All games</a><h1>%s</h1><p>%s</p></div><div id="app"></div>' % (html.escape(title), html.escape(desc)) +
      '<div class="foot">Paperwhite Arcade</div></div><script>%s</script><script>var app=KG.$("app");%s</script></body></html>' % (kgjs, code))
HUB_JS = '''
var cat='All',q='';
function apply(){var cs=document.getElementsByClassName('card'),n=0,i;for(i=0;i<cs.length;i++){var c=cs[i],ok=(cat==='All'||c.getAttribute('data-c')===cat)&&(!q||c.getAttribute('data-t').indexOf(q)>=0);c.style.display=ok?'block':'none';if(ok)n++;}document.getElementById('none').style.display=n?'none':'block';}
function setCat(el,c){cat=c;var ch=document.getElementsByClassName('chip'),i;for(i=0;i<ch.length;i++)ch[i].className='chip'+(ch[i]===el?' on':'');apply();}
function srch(v){q=v.toLowerCase();apply();}
function surprise(){var cs=document.getElementsByClassName('card');location.href=cs[Math.floor(Math.random()*cs.length)].getAttribute('href');}
'''
def hub(css):
    cats = ['All'] + sorted(set(g[2] for g in GAMES), key=lambda c: ['Board','Puzzle','Cards','Word'].index(c) if c in ['Board','Puzzle','Cards','Word'] else 9)
    h = HEAD % ('Paperwhite Arcade', css) + '<div class="top"><h1 style="text-transform:uppercase;margin:0;font-size:28px">Paperwhite Arcade<span class="badge">Kindle Edition</span></h1></div>'
    h += '<input class="search" placeholder="Search games" oninput="srch(this.value)">'
    h += '<div class="chips">' + ''.join('<span class="chip%s" onclick="setCat(this,\'%s\')">%s (%d)</span>' % (' on' if c == 'All' else '', c, c, len(GAMES) if c == 'All' else sum(1 for g in GAMES if g[2] == c)) for c in cats)
    h += '<span class="chip" onclick="surprise()">Surprise me</span></div><div class="cards">'
    for n, (gid, title, cat, desc, gl) in enumerate(GAMES, 1):
        h += '<a class="card" href="%s.html" data-c="%s" data-t="%s"><span class="num">%d</span><div class="ic">%s</div><h2>%s</h2></a>' % (gid, cat, html.escape((title + ' ' + desc + ' ' + cat).lower()), n, gl, html.escape(title))
    h += '</div><div class="msg" id="none" style="display:none">Nothing found.</div><div class="foot">Tip: bookmark this page in the Kindle browser.</div></div><script>%s</script></body></html>' % HUB_JS
    return h
def main():
    load(); os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    css = open(os.path.join(SRC, 'kg.css'), encoding='utf-8').read(); kgjs = open(os.path.join(SRC, 'kg.js'), encoding='utf-8').read()
    for g in GAMES:
        if g[0] not in SECTIONS: print('skip (not written yet):', g[0]); continue
        open(os.path.join(OUT, g[0] + '.html'), 'w', encoding='utf-8').write(page(g, css, kgjs))
    built = [g for g in GAMES if g[0] in SECTIONS]
    GAMES[:] = built
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(hub(css))
    z = zipfile.ZipFile(os.path.join(ROOT, 'paperwhite-arcade-site.zip'), 'w', zipfile.ZIP_DEFLATED)
    for f in os.listdir(OUT): z.write(os.path.join(OUT, f), f)
    z.close(); print('built', len(built), 'games')
main()
