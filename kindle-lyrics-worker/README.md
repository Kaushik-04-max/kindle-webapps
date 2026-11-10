# Kindle Lyrics — Synced Lyrics, Now Playing & Equaliser for Any E-Ink Kindle

A single-file [Cloudflare Worker](https://developers.cloudflare.com/workers/) that turns any Kindle's built-in browser into a synced-lyrics display, a "Now Playing" screen, and a music equaliser — no app install, no jailbreak required. Works on the stock Kindle browser as well as jailbroken setups like [Paperwhite OS](https://github.com/Kaushik-04-max/paperwhite-os), the custom-firmware project this was built alongside.

**Pipeline:** phone (scrobbling app, e.g. [Pano Scrobbler](https://github.com/kawaiiDango/pano-scrobbler)) → [Last.fm](https://www.last.fm/) → this Worker → Kindle's browser.

## Pages

| Path | What it shows |
|---|---|
| `/` | Menu / hub of all the pages below |
| `/lyrics` | Synced lyrics, revealed word-by-word (or line/letter) as the song plays |
| `/nowplaying` | Album art, title, artist, playback progress |
| `/equalizer` | Song title above a moving bar equaliser |
| `/api/now` | What Last.fm says is playing right now (JSON) |
| `/api/lyrics` | Synced lyrics pulled from [LRCLIB](https://lrclib.net/) for the current artist/title |

Every page has a **Normal / Inverted** toggle (black-on-white or white-on-black) in the top corner, remembered per-device.

## Deploy to Cloudflare (free, no install, no credit card)

You only need a browser. Cloudflare's menus change now and then, so the names below may differ slightly.

### 1. Create the Worker
1. Sign up at https://dash.cloudflare.com/sign-up and verify your email.
2. Go to **Workers & Pages** → **Create** → **Create Worker**.
3. Name it `kindle-lyrics` and click **Deploy** (it deploys a "Hello World" first).
4. Click **Edit code**. Select everything in the editor, delete it, and paste the whole of `worker.js`.
5. Click **Deploy**.

### 2. Add your settings
1. Open the Worker → **Settings** → **Variables and Secrets** → **Add**.
2. Add `LASTFM_API_KEY`, type **Secret**, value = your own [Last.fm API key](https://www.last.fm/api/account/create).
3. Add `LASTFM_USER`, type **Text**, value = your Last.fm username.
4. Save and deploy.

### 3. Test on your PC or phone
Your address looks like `https://kindle-lyrics.<your-subdomain>.workers.dev`.
- `/api/now` should show the song playing right now (JSON).
- `/lyrics` and `/nowplaying` are the Kindle pages.

### 4. Open it on the Kindle
Home screen → menu (three dots) → **Experimental Browser**. Type the address and bookmark it.

Behind an old Kindle browser that can't open HTTPS at all? Run `kindle_proxy.py` on a computer on the same Wi-Fi — it relays your Worker over plain HTTP (set `UPSTREAM` in the script to your deployed Worker URL first).

## Useful options (query parameters)
- `/lyrics?mode=letter` types letter by letter; `mode=line` shows whole lines; default is word by word.
- `/lyrics?tick=800` slows screen updates (less e-ink flashing). `/nowplaying?every=10` refreshes less often.
- Add `?mock_title=Fix You&mock_artist=Coldplay` to test with a fake song (no Last.fm needed — or set the `MOCK=1` env var).
- `/equalizer` shows the song above moving bars. `?style=mirror` mirrors them, `?tick=1100` is calmer, `?tick=450` is livelier.
- `?invert=1` / `?invert=0` force the colour theme without tapping the toggle.

## Testing locally without deploying
Open `test.html?path=/lyrics&mode=letter&mock_title=Yellow&mock_artist=Coldplay` in any browser — it runs `worker.js` directly in-page (via `MOCK=1`), no server or Cloudflare account needed.

## The hub page's app list
`worker.js`'s `/hub` route ends with a small `apps` array — add your own Kindle web-apps there (see the comment in the source) to build a simple tap-through home menu.

## If the lyrics are out of sync
Last.fm only reports what's playing, not the exact position, so timing is an estimate. Use the **Back 1s / Forward 1s / Restart** buttons on the lyrics page.
