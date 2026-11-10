# Paperwhite Arcade — 28+ Offline Games for Any E-Ink Kindle

A single-file-per-game, ES5-only, zero-dependency arcade built to run inside the stock Kindle browser (and any other very old WebKit) — no jailbreak, no app install, just a URL. Board, puzzle, card and word games, each playable fully offline once the page has loaded.

## Why it's built this way

Old Kindle WebKit (circa 2012-2014) has no flexbox, no `let`/`const`, no arrow functions, no template literals — plain ES5 and table/float layout only. `build.py` runs a small lint pass (`lint()`) over every generated game to catch accidental modern syntax before it ships, and `kg.css`/`kg.js` are a tiny shared framework (DOM helpers, shared styling) rather than pulling in any external library.

## Structure

```text
.
├── build.py          # Generator: reads src/, writes site/ (one .html per game) + a zip
├── src/
│   ├── kg.js          # Shared DOM/UI helper library (ES5)
│   ├── kg.css         # Shared styling
│   ├── chess.js        # Chess + Checkers engine
│   └── games1-4.js      # The rest of the games, grouped into 4 files
└── site/             # Pre-built output — open index.html directly, or deploy this folder
```

## Running it

Just open `site/index.html` in a browser (or on the Kindle itself over a local server/USB). It's a self-contained hub page listing every game with search and category filters.

## Rebuilding from source

After editing anything in `src/`:

```bash
python3 build.py
```

This regenerates every `site/*.html` file and a fresh `paperwhite-arcade-site.zip` next to `build.py`.

## Deploying it as a real website

Any static host works since it's plain HTML/CSS/JS with no build step beyond the Python script above:

- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the `site/` folder, or connect the repo and set the publish directory to `paperwhite-arcade/site`.
- **GitHub Pages**: enable Pages on this repo pointed at this folder (or copy `site/` to its own repo's root).

## Adding a new game

1. Add an entry to the `GAMES` list at the top of `build.py` — `(id, title, category, description, icon_glyph)`.
2. Write the game's logic as a `GAME_<id>` block inside one of the `src/games*.js` files (see existing games for the pattern — each exposes itself via `SECTIONS[gid]` through the `load()` function at the top of `build.py`).
3. Run `python3 build.py` again.

## Games included

Board: Chess, Tic-Tac-Toe, Connect Four, Reversi, Checkers, Mancala, Gomoku, Battleship, Dots and Boxes, Nim.
Puzzle: Memory Match, Minesweeper, Lights Out, Slide Puzzle, Tower of Hanoi, 2048, Flood-It, Sudoku, Peg Solitaire, Mastermind, Nonogram, Takuzu.
Cards: Blackjack, Higher or Lower, Pig.
Word: Word Search, Word Scramble, Hangman.
