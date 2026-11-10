# Kindle Web Apps

Small, self-contained web apps built for the Kindle's ancient built-in browser — no jailbreak, no app install, just a URL. Companion repo to [**Paperwhite OS**](https://github.com/Kaushik-04-max/paperwhite-os), a full custom-firmware launcher for jailbroken Kindle Paperwhites; everything here also works standalone on a completely stock Kindle (or any other very old WebKit browser).

## What's here

| Project | What it is | Screenshots |
|---|---|---|
| [`kindle-lyrics-worker/`](kindle-lyrics-worker) | A Cloudflare Worker: synced lyrics, now-playing, and an equaliser, driven by your Last.fm scrobbles | `screenshots/lyrics_*.png` |
| [`paperwhite-arcade/`](paperwhite-arcade) | 28+ offline board/puzzle/card/word games, one ES5 HTML file each | `screenshots/arcade_*.png` |

## Why these exist

Kindle's built-in browser is a ~2012-era WebKit: no flexbox, no `let`/`const`/arrow functions, no modern CSS, often no HTTPS trust for arbitrary sites either. Both projects here are written to that constraint — plain ES5, table/float layout, and (for the lyrics app) a Worker that does the heavy lifting server-side so the Kindle only ever renders plain HTML.

## Quick start

- **Want synced lyrics / now-playing on your Kindle?** → [`kindle-lyrics-worker/README.md`](kindle-lyrics-worker/README.md) (deploy a free Cloudflare Worker, takes a few minutes).
- **Want 28 offline games on your Kindle?** → [`paperwhite-arcade/README.md`](paperwhite-arcade/README.md) (open `site/index.html`, or deploy it anywhere static).
- **Running jailbroken Paperwhite OS?** → both of these are meant to be added as entries in its Home screen / hub page — see [Paperwhite OS](https://github.com/Kaushik-04-max/paperwhite-os).

## License

MIT — see [`LICENSE`](LICENSE).
