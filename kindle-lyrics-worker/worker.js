// Kindle Lyrics: single-file Cloudflare Worker.
//
// Pipeline: phone (Pano Scrobbler) -> Last.fm -> this Worker -> Kindle browser.
//
// Settings (Cloudflare dashboard -> Worker -> Settings -> Variables and Secrets):
//   LASTFM_API_KEY  (Secret)  your Last.fm API key
//   LASTFM_USER     (Text)    your Last.fm username (defaults to 'lastfm_user' if unset)
//   MOCK            (Text)    set to 1 to show a fake song without Last.fm
//
// Pages:  /           menu
//         /lyrics     synced lyrics, revealed word by word (?mode=word|letter|line)
//         /nowplaying album art, title, artist, progress (?every=5 seconds)
//         /equalizer  song title above a moving equaliser (?style=bars|mirror&tick=700)
//         /hub        home menu: tap-through list of all Kindle apps (launched by a scriptlet)
// API:    /api/now    what Last.fm says is playing
//         /api/lyrics synced lyrics from LRCLIB for artist/title/album

const UA = 'KindleLyrics/1.0 (personal project)';
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      switch (url.pathname) {
        case '/':
          return page(MENU_PAGE);
        case '/lyrics':
          return page(LYRICS_PAGE);
        case '/nowplaying':
          return page(NOW_PAGE);
        case '/equalizer':
        case '/equaliser':
          return page(EQ_PAGE);
        case '/hub':
          return page(HUB_PAGE);
        case '/api/now':
          return json(await getNow(env, url.searchParams));
        case '/api/lyrics':
          return json(await getLyrics(url.searchParams));
        case '/art':
          return await proxyArt(url.searchParams.get('u'));
      }
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, 502);
    }
    return new Response('Not found', { status: 404 });
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}

function page(html) {
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
  });
}

// Album art is served from this Worker so an old browser (which may not manage HTTPS to
// other hosts) only ever talks to one address. Only the known art hosts are allowed.
async function proxyArt(u) {
  let t;
  try {
    t = new URL(u);
  } catch (e) {
    return new Response('Bad address', { status: 400 });
  }
  if (t.protocol !== 'https:' || !/(\.freetls\.fastly\.net|\.mzstatic\.com)$/.test(t.hostname)) {
    return new Response('Not allowed', { status: 403 });
  }
  const r = await fetch(t.toString(), { cf: { cacheTtl: 86400, cacheEverything: true } });
  return new Response(r.body, {
    status: r.status,
    headers: {
      'content-type': r.headers.get('content-type') || 'image/jpeg',
      'cache-control': 'public, max-age=86400',
    },
  });
}

// ---------- Last.fm: what is playing ----------

async function getNow(env, params) {
  if (!env.LASTFM_API_KEY || env.MOCK === '1') {
    return {
      playing: true,
      title: params.get('mock_title') || 'Yellow',
      artist: params.get('mock_artist') || 'Coldplay',
      album: params.get('mock_album') || 'Parachutes',
      art: '',
      mock: true,
    };
  }
  const user = env.LASTFM_USER || 'lastfm_user';
  const api =
    'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&extended=1&format=json' +
    '&user=' + encodeURIComponent(user) +
    '&api_key=' + encodeURIComponent(env.LASTFM_API_KEY);
  const r = await fetch(api, {
    headers: { 'User-Agent': UA },
    cf: { cacheTtl: 2, cacheEverything: true },
  });
  if (!r.ok) throw new Error('Last.fm HTTP ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error('Last.fm: ' + j.message);

  let t = j.recenttracks && j.recenttracks.track;
  if (Array.isArray(t)) t = t[0];
  if (!t) return { playing: false, title: '', artist: '' };

  const playing = !!(t['@attr'] && t['@attr'].nowplaying === 'true');
  const artist = t.artist ? t.artist.name || t.artist['#text'] || '' : '';
  let art = pickImage(t.image);
  if (!art) art = await itunesArt(artist, t.name);
  return {
    playing,
    title: t.name || '',
    artist,
    album: t.album ? t.album['#text'] || '' : '',
    art,
    playedAt: t.date ? Number(t.date.uts) : 0,
  };
}

function pickImage(images) {
  if (!Array.isArray(images)) return '';
  for (let i = images.length - 1; i >= 0; i--) {
    const u = images[i] && images[i]['#text'];
    if (u && u.indexOf(LASTFM_PLACEHOLDER) < 0) return u;
  }
  return '';
}

// Last.fm often has no art for new releases; iTunes search needs no key.
async function itunesArt(artist, title) {
  try {
    const u =
      'https://itunes.apple.com/search?media=music&entity=song&limit=1&term=' +
      encodeURIComponent(artist + ' ' + title);
    const r = await fetch(u, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!r.ok) return '';
    const j = await r.json();
    const a = j.results && j.results[0] && j.results[0].artworkUrl100;
    return a ? a.replace(/\d+x\d+bb/, '600x600bb') : '';
  } catch (e) {
    return '';
  }
}

// ---------- LRCLIB: lyrics ----------

async function getLyrics(params) {
  const artist = params.get('artist') || '';
  const title = cleanTitle(params.get('title') || '');
  const album = params.get('album') || '';
  if (!artist || !title) return { found: false };

  let hit = null;
  if (album) hit = await lrclib('get', { artist_name: artist, track_name: title, album_name: album });
  if (!hit) hit = await lrclib('get', { artist_name: artist, track_name: title });
  if (!hit || (!hit.syncedLyrics && !hit.plainLyrics)) {
    const list = await lrclib('search', { q: artist + ' ' + title });
    if (Array.isArray(list)) {
      hit = list.find((x) => x.syncedLyrics) || list.find((x) => x.plainLyrics) || null;
    }
  }
  if (!hit) return { found: false };

  const synced = parseLrc(hit.syncedLyrics);
  const plain = hit.plainLyrics || '';
  if (!synced.length && !plain) return { found: false };
  return { found: true, synced, plain, duration: hit.duration || 0 };
}

async function lrclib(path, query) {
  const u = 'https://lrclib.net/api/' + path + '?' + new URLSearchParams(query);
  const r = await fetch(u, {
    headers: { 'User-Agent': UA },
    cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 86400, 404: 3600, '500-599': 0 } },
  });
  if (!r.ok) return null;
  return r.json();
}

// "Song (feat. X)", "Song - Remastered 2011" -> "Song"
function cleanTitle(s) {
  return s
    .replace(/\s*[(\[][^)\]]*(feat|ft\.|with|remaster|version|live|edit)[^)\]]*[)\]]/gi, '')
    .replace(/\s+-\s+(remaster|\d{4}|single|radio|live|mono|stereo).*$/i, '')
    .trim();
}

// "[01:23.45] text" -> [[83.45, "text"], ...]
function parseLrc(lrc) {
  if (!lrc) return [];
  const out = [];
  for (const line of lrc.split(/\r?\n/)) {
    const re = /\[(\d+):(\d+(?:\.\d+)?)\]/g;
    const times = [];
    let m;
    let end = 0;
    while ((m = re.exec(line))) {
      times.push(Number(m[1]) * 60 + Number(m[2]));
      end = re.lastIndex;
    }
    if (!times.length) continue;
    const text = line.slice(end).replace(/<\d+:\d+(?:\.\d+)?>/g, '').trim();
    for (const t of times) out.push([Math.round(t * 100) / 100, text]);
  }
  out.sort((a, b) => a[0] - b[0]);
  return out;
}

// ---------- Kindle pages (plain ES5 + simple CSS: the Kindle browser is old) ----------
// Sizes are in em; fit() scales the page text to the screen width, so the same
// markup suits the Kindle (about 760px wide) and a desktop browser.

const BASE_CSS = String.raw`
html{background:#fff}
html,body{margin:0;padding:0;color:#000}
#bg{position:fixed;left:0;top:0;z-index:-1}
body{font-family:Figtree,'Plus Jakarta Sans','Helvetica Neue',Arial,sans-serif;font-size:30px;padding:0.45em 0.7em 0.6em}
a{color:#000}
.sans{font-family:Figtree,Helvetica,Arial,sans-serif}
.top{font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.48em;letter-spacing:0.14em;text-transform:uppercase;padding-bottom:0.7em;border-bottom:2px solid #000}
.top a{text-decoration:none;color:#666;margin-right:1.8em;padding-bottom:0.3em}
.top a.on{color:#000;border-bottom:3px solid #000}
.h{visibility:hidden}
.caret{display:inline-block;width:0;margin-right:-0.06em;height:0.9em;border-right:0.06em solid #000;vertical-align:-0.1em}
.prog{height:8px;background:#fff;border:2px solid #000;margin:0.9em 0}
.prog div{height:8px;background:#000;width:0}
.btn{display:inline-block;background:#fff;border:2px solid #000;padding:0.35em 0.8em;margin:0.6em 0.5em 0 0;font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.55em;color:#000;text-decoration:none}
.note{font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.48em;color:#555}
.top .inv{display:block;text-align:right;margin-top:0.55em}
.top .inv a{margin-right:0;margin-left:1.4em}
.top .inv:before{content:'Colour';color:#999}
html.inv{background:#000;color:#fff}
html.inv body{background:transparent;color:#fff}
html.inv a{color:#fff}
html.inv .top{border-bottom-color:#fff}
html.inv .top a{color:#999}
html.inv .top a.on{color:#fff;border-bottom-color:#fff}
html.inv .caret{border-right-color:#fff}
html.inv .prog{background:#000;border-color:#fff}
html.inv .prog div{background:#fff}
html.inv .btn{background:#000;color:#fff;border-color:#fff}
html.inv .note{color:#aaa}
html.inv .ctx{color:#9a9a9a}
html.inv #a,html.inv #artist{color:#ddd}
html.inv #album,html.inv .sub{color:#aaa}
html.inv #quote{color:#ddd}
html.inv .card{border-color:#fff}
html.inv .card span{color:#bbb}
html.inv #foot{border-top-color:#fff}
html.inv .modes a{color:#999}
html.inv .modes a.on{color:#fff;border-bottom-color:#fff}
html.inv #eqwrap{border-color:#fff;background:#000}
html.inv #cover,html.inv #art{border-color:#fff}
`;

function nav(active) {
  const item = (href, name, key) =>
    '<a href="' + href + '"' + (active === key ? ' class="on"' : '') + '>' + name + '</a>';
  return '<div class="top">' + item('/', 'Menu', 'menu') + item('/lyrics', 'Lyrics', 'lyrics') +
    item('/nowplaying', 'Now Playing', 'now') + item('/equalizer', 'Equaliser', 'eq') +
    '<span class="inv"><a href="#" id="cn" onclick="setInv(0);return false">Normal</a><a href="#" id="ci" onclick="setInv(1);return false">Inverted</a></span></div>';
}

function layout(css, body, script) {
  return (
    '<!doctype html>\n<html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Kindle Lyrics</title>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;700;800;900&display=swap">' +
    '<style>' + BASE_CSS + css + '</style></head><body>' +
    '<canvas id="bg" width="10" height="10"></canvas>' +
    body +
    '<div id="jsmsg" class="note" style="margin-top:1em">Loading... If this message stays, this browser is not running the page script.</div>' +
    // Separate first script so a syntax error in the main one is still reported on screen.
    '<script>window.onerror=function(m,u,l){var j=document.getElementById("jsmsg");' +
    'if(j){j.style.display="block";j.textContent="Script error: "+m+" (line "+l+")";}return false;};</script>' +
    '<script>' + COMMON_JS + 'var jm=$("jsmsg");if(jm)jm.style.display="none";' + script + '</script></body></html>'
  );
}

// Shared tracker: polls /api/now, notices song changes, estimates the playback position.
// Last.fm only says WHAT is playing and that it started just now, so position = time since
// we noticed the song, plus a manual offset the Kindle buttons can nudge.
const COMMON_JS = String.raw`
var T={d:null,key:'',start:0,pausedAt:0,playing:false,lyrics:null,offset:0,err:0,pollMs:3000};
var LAG=3000,defaultOffset=0;
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function qp(name,def){var m=location.search.match(new RegExp('[?&]'+name+'=([^&]*)'));return m?decodeURIComponent(m[1]):def;}
function fit(){var w=window.innerWidth||760;document.body.style.fontSize=Math.max(16,Math.min(36,Math.round(w/22)))+'px';}
fit();window.onresize=function(){fit();paintBackdrop();};
// Inverted (white on black) mode: ?invert=1 or the Invert link; remembered on the device.
var INV=false;
(function(){
  var v=qp('invert',null);
  try{if(v===null)v=localStorage.getItem('inv')||'0';localStorage.setItem('inv',v==='1'?'1':'0');}catch(e){if(v===null)v='0';}
  INV=v==='1';
  if(INV)document.documentElement.className='inv';
  var cn=document.getElementById('cn'),ci=document.getElementById('ci');
  if(cn)cn.className=INV?'':'on';
  if(ci)ci.className=INV?'on':'';
})();
function setInv(n){
  if((n===1)===INV)return;
  try{localStorage.setItem('inv',n?'1':'0');}catch(e){}
  var q=location.search.replace(/[?&]invert=[^&]*/,'').replace(/^&/,'?');
  location.href=location.pathname+(q&&q!=='?'?q+'&':'?')+'invert='+n;
}
function getJSON(url,cb){
  var x=new XMLHttpRequest();
  x.open('GET',url+(url.indexOf('?')<0?'?':'&')+'_='+Date.now(),true);
  x.onreadystatechange=function(){
    if(x.readyState!==4)return;
    var d=null;
    if(x.status===200){try{d=JSON.parse(x.responseText);}catch(e){d=null;}}
    cb(d);
  };
  x.send();
}
T.elapsed=function(){return(((T.playing||!T.pausedAt)?Date.now():T.pausedAt)-T.start)/1000+T.offset;};
function fmt(s){s=Math.max(0,Math.floor(s));var m=Math.floor(s/60),r=s%60;return m+':'+(r<10?'0':'')+r;}
function poll(){
  getJSON('/api/now'+location.search,function(d){
    if(!d||d.error){T.err++;onError(d&&d.error);}
    else{T.err=0;handleNow(d);}
    setTimeout(poll,T.pollMs);
  });
}
function handleNow(d){
  var now=Date.now();
  if(!d.title){T.playing=false;T.d=d;onState();return;}
  var key=d.artist+'|'+d.title;
  if(key!==T.key){
    T.key=key;T.d=d;T.lyrics=null;T.offset=defaultOffset;T.start=now-LAG;
    T.playing=d.playing;T.pausedAt=d.playing?0:now;
    onTrack(d);
    loadLyrics(d,key);
  }else{
    T.d=d;
    if(d.playing&&!T.playing){if(T.pausedAt)T.start+=now-T.pausedAt;T.pausedAt=0;}
    if(!d.playing&&T.playing){T.pausedAt=now;}
    T.playing=d.playing;
    var dur=T.lyrics&&T.lyrics.duration;
    if(T.playing&&dur&&T.elapsed()>dur+4){T.start=now-LAG;T.offset=defaultOffset;}
  }
  onState();
}
function loadLyrics(d,key){
  getJSON('/api/lyrics?artist='+encodeURIComponent(d.artist)+'&title='+encodeURIComponent(d.title)+'&album='+encodeURIComponent(d.album||''),function(l){
    if(key!==T.key)return;
    T.lyrics=(l&&!l.error)?l:{found:false};
    onLyrics();
  });
}
function artUrl(u){return '/art?u='+encodeURIComponent(u);}
function lineAt(S,i){return(i>=0&&i<S.length)?(S[i][1]||'♪'):'';}
function lineIndex(S,e){var idx=-1,i;for(i=0;i<S.length;i++){if(S[i][0]<=e)idx=i;else break;}return idx;}
// Voronoi backdrop: one pattern per song, seeded from its name, drawn once behind the whole
// page as light gray lines and a few pale cells (so black text stays readable on e-ink).
// Each cell is the screen rectangle clipped by the "closer to me than to X" half-plane of
// every other point, so lines are crisp at full screen resolution.
function vclip(poly,a,b){
  var mx=(a.x+b.x)/2,my=(a.y+b.y)/2,nx=b.x-a.x,ny=b.y-a.y,out=[],n=poly.length,i,p,q,dp,dq,t;
  for(i=0;i<n;i++){
    p=poly[i];q=poly[(i+1)%n];
    dp=(p[0]-mx)*nx+(p[1]-my)*ny;dq=(q[0]-mx)*nx+(q[1]-my)*ny;
    if(dp<=0)out.push(p);
    if((dp<0&&dq>0)||(dp>0&&dq<0)){t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
  }
  return out;
}
function paintBackdrop(){
  var cv=$('bg'),ctx=cv&&cv.getContext&&cv.getContext('2d');
  if(!ctx||qp('bg','1')==='0'){if(cv)cv.style.display='none';return;}
  var W=window.innerWidth||760,H=window.innerHeight||1000;
  cv.width=W;cv.height=H;
  var seedStr=T.key||'kindle-lyrics',hs=0,i,j,k,x,y;
  for(i=0;i<seedStr.length;i++)hs=((hs<<5)-hs+seedStr.charCodeAt(i))|0;
  var s=hs>>>0;
  function rnd(){s=(s*1664525+1013904223)>>>0;return s/4294967296;}
  var cell=Math.max(90,Math.round(W/6)),cols=Math.ceil(W/cell),rows=Math.ceil(H/cell),pts=[];
  for(y=0;y<rows;y++)for(x=0;x<cols;x++)pts.push({x:(x+0.1+0.8*rnd())*cell,y:(y+0.1+0.8*rnd())*cell,f:rnd()<0.3});
  ctx.fillStyle=INV?'#000':'#fff';ctx.fillRect(0,0,W,H);
  ctx.lineWidth=2;ctx.lineJoin='round';
  for(i=0;i<pts.length;i++){
    var poly=[[0,0],[W,0],[W,H],[0,H]];
    for(j=0;j<pts.length&&poly.length;j++){if(j!==i)poly=vclip(poly,pts[i],pts[j]);}
    if(poly.length<3)continue;
    ctx.beginPath();ctx.moveTo(poly[0][0],poly[0][1]);
    for(k=1;k<poly.length;k++)ctx.lineTo(poly[k][0],poly[k][1]);
    ctx.closePath();
    if(pts[i].f){ctx.fillStyle=INV?'#141414':'#eeeeee';ctx.fill();}
    ctx.strokeStyle=INV?'#3c3c3c':'#b0b0b0';ctx.stroke();
  }
  ctx.fillStyle=INV?'#6a6a6a':'#8a8a8a';
  for(i=0;i<pts.length;i++){ctx.beginPath();ctx.arc(pts[i].x,pts[i].y,3,0,6.2832,false);ctx.fill();}
}
`;

const MENU_PAGE = layout(
  String.raw`
h1{font-size:1.7em;text-align:center;margin:1em 0 0.15em}
.sub{text-align:center;font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.5em;letter-spacing:0.14em;text-transform:uppercase;color:#555;margin-bottom:1.6em}
.card{display:block;border:3px solid #000;padding:1.1em 0.9em;margin:0.9em 0;text-decoration:none;text-align:center}
.card b{display:block;font-size:1.35em}
.card span{display:block;font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.5em;color:#444;margin-top:0.5em}
`,
  nav('menu') +
    String.raw`
<h1>Kindle Lyrics</h1>
<div class="sub">What your phone plays, on e-ink</div>
<a class="card" href="/lyrics"><b>Lyrics</b><span>Synced lyrics, typed out as the song plays</span></a>
<a class="card" href="/nowplaying"><b>Now Playing</b><span>Album art, title and progress</span></a>
<a class="card" href="/equalizer"><b>Equaliser</b><span>Bars that move with the song</span></a>
<div class="note" style="text-align:center;margin-top:1.4em">Bookmark the page you use most.</div>
`,
  ''
);

const LYRICS_PAGE = layout(
  String.raw`
#head{overflow:hidden;margin-top:0.8em}
#cover{float:left;width:2.5em;height:2.5em;margin-right:0.6em;border:2px solid #000;display:none}
#t{font-size:0.85em;font-weight:800;line-height:1.15}
#a{font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.5em;color:#444;margin-top:0.3em;letter-spacing:0.04em}
#stage{text-align:left;padding:0.3em 0.1em}
.ctx{font-size:1em;line-height:1.2;font-weight:800;color:#686868}
#prev{margin:0.6em 0}
#cur{font-size:2.05em;line-height:1.1;font-weight:900;letter-spacing:-0.01em;margin:0.4em 0;min-height:3.4em}
#next{margin:0.6em 0}
#plain{font-size:0.7em;line-height:1.5;white-space:pre-wrap;text-align:left;display:none}
#foot{border-top:2px solid #000;padding-top:0.5em;margin-top:0.4em}
.modes a{font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.5em;text-decoration:none;color:#666;margin-right:1.2em;letter-spacing:0.08em;text-transform:uppercase}
.modes a.on{color:#000;border-bottom:3px solid #000}
`,
  nav('lyrics') +
    String.raw`
<div id="head"><img id="cover" alt=""><div id="t">Waiting for a song</div><div id="a">Play something on your phone</div></div>
<div class="prog"><div id="pf"></div></div>
<div id="stage">
<div class="ctx" id="prev"></div>
<div id="cur"></div>
<div class="ctx" id="next"></div>
<div id="plain"></div>
</div>
<div id="foot">
<div class="modes" id="modes"></div>
<a class="btn" href="#" onclick="jumpLine(-1);return false">&laquo; Line</a><a class="btn" href="#" onclick="jumpLine(1);return false">Line &raquo;</a><a class="btn" href="#" onclick="nudge(-1);return false">-1s</a><a class="btn" href="#" onclick="nudge(1);return false">+1s</a><a class="btn" href="#" onclick="restart();return false">Restart</a>
<div class="note" id="status"></div>
</div>
`,
  String.raw`
var mode=qp('mode','word'),sig='',statusSig='',pctSig=-1,coverSrc='';
T.pollMs=Number(qp('poll',3))*1000;
(function(){
  var m=['word','letter','line'],l=['Word','Letter','Line'],h='<span class="note">Typing: </span>',i;
  for(i=0;i<3;i++)h+='<a href="?mode='+m[i]+'"'+(mode===m[i]?' class="on"':'')+'>'+l[i]+'</a>';
  $('modes').innerHTML=h;
  $('stage').style.minHeight=Math.round((window.innerHeight||900)*0.45)+'px';
})();
function draw(p,c,n,s){
  if(s===sig)return;
  sig=s;
  $('plain').style.display='none';
  $('prev').innerHTML=p;$('cur').innerHTML=c;$('next').innerHTML=n;
  $('prev').style.display=$('cur').style.display=$('next').style.display='block';
}
function setStatus(){
  var s='';
  if(T.err>0)s='Connection problem, retrying... ';
  else if(T.d&&T.d.title&&!T.playing)s='Paused. ';
  if(T.offset)s+='Offset '+(T.offset>0?'+':'')+T.offset+'s';
  if(s!==statusSig){statusSig=s;$('status').innerHTML=esc(s);}
}
function setHead(d){
  if(!d||!d.title){$('t').innerHTML='Waiting for a song';$('a').innerHTML='Play something on your phone';$('cover').style.display='none';coverSrc='';return;}
  $('t').innerHTML=esc(d.title);$('a').innerHTML=esc(d.artist);
  if(d.art){if(d.art!==coverSrc){coverSrc=d.art;$('cover').src=artUrl(d.art);}$('cover').style.display='block';}
  else{coverSrc='';$('cover').style.display='none';}
}
function onError(){setStatus();}
function onTrack(d){
  sig='';setHead(d);paintBackdrop();
}
function onLyrics(){sig='';tick();}
function onState(){setHead(T.d);setStatus();tick();}
// Back/Forward 1s corrections are remembered for later songs (the delay is mostly constant).
// Line jumps and Restart only affect the current song.
try{defaultOffset=Number(localStorage.getItem('lyricOffset'))||0;T.offset=defaultOffset;}catch(e){}
function nudge(s){
  T.offset=Math.round((T.offset+s)*10)/10;
  defaultOffset=Math.max(-8,Math.min(8,Math.round((defaultOffset+s)*10)/10));
  try{localStorage.setItem('lyricOffset',String(defaultOffset));}catch(e){}
  sig='';setStatus();tick();
}
function jumpLine(dir){
  var L=T.lyrics;
  if(!L||!L.synced||!L.synced.length)return;
  var S=L.synced,e=T.elapsed(),t=Math.max(0,Math.min(S.length-1,lineIndex(S,e)+dir));
  T.offset=Math.round((T.offset+S[t][0]+0.3-e)*10)/10;
  sig='';setStatus();tick();
}
function restart(){T.start=Date.now();T.pausedAt=T.playing?0:Date.now();T.offset=defaultOffset;sig='';setStatus();tick();}
function revealCount(text,frac){
  if(mode==='line')return text.length;
  if(mode==='letter')return Math.max(1,Math.ceil(text.length*frac));
  var w=text.split(' '),n=Math.max(1,Math.ceil(w.length*frac));
  return w.slice(0,n).join(' ').length;
}
function progress(){
  var dur=T.lyrics&&T.lyrics.duration;
  var p=dur?Math.min(100,Math.floor(T.elapsed()/dur*100)):0;
  if(p!==pctSig){pctSig=p;$('pf').style.width=p+'%';}
}
function tick(){
  var d=T.d,L=T.lyrics;
  progress();
  if(!d||!d.title){draw('','Nothing playing yet','','idle');return;}
  if(!L){draw('','Loading lyrics...','','load:'+T.key);return;}
  if(!L.found){draw('','No lyrics found<br><span class="note">for this song</span>','','none:'+T.key);return;}
  if(!L.synced||!L.synced.length){
    if(sig!=='plain:'+T.key){
      sig='plain:'+T.key;
      $('prev').style.display=$('cur').style.display=$('next').style.display='none';
      $('plain').style.display='block';$('plain').innerHTML=esc(L.plain);
    }
    return;
  }
  var S=L.synced,e=T.elapsed(),idx=lineIndex(S,e);
  if(idx<0){draw('','♪',esc(lineAt(S,0)),'intro:'+T.key);return;}
  var text=lineAt(S,idx);
  var endT=idx+1<S.length?S[idx+1][0]:S[idx][0]+5;
  var span=Math.max(0.5,Math.min(endT-S[idx][0],4)*0.8);
  var frac=Math.min(1,(e-S[idx][0])/span);
  var c=revealCount(text,frac);
  var s=T.key+':'+idx+':'+c;
  if(s===sig)return;
  var caret=(mode!=='line'&&c<text.length)?'<span class="caret"></span>':'';
  var cur=esc(text.substr(0,c))+caret+'<span class="h">'+esc(text.substr(c))+'</span>';
  var nx=esc(lineAt(S,idx+1));
  if(idx+2<S.length)nx+='<br>'+esc(lineAt(S,idx+2));
  draw(esc(lineAt(S,idx-1)),cur,nx,s);
}
paintBackdrop();
poll();
setInterval(tick,Number(qp('tick',400)));
`
);

const NOW_PAGE = layout(
  String.raw`
#artbox{text-align:center;margin:1em 0 0.7em}
#art{width:64%;max-width:480px;border:3px solid #000;display:none;-webkit-filter:grayscale(1) contrast(1.2)}
#title{font-size:1.7em;font-weight:900;text-align:center;line-height:1.15;margin:0.2em 0 0.2em}
#artist{font-size:0.95em;text-align:center;color:#222}
#album{font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;text-align:center;color:#666;margin-top:0.5em}
#barbox{display:none;margin:0 6%}
#time{text-align:center}
#quote{font-size:0.8em;font-style:italic;text-align:center;color:#333;margin:1.1em 6% 0;line-height:1.35;min-height:2.7em}
`,
  nav('now') +
    String.raw`
<div id="artbox"><img id="art" alt=""></div>
<div id="title">Nothing playing</div>
<div id="artist"></div>
<div id="album"></div>
<div id="barbox"><div class="prog"><div id="fill"></div></div><div class="note" id="time"></div></div>
<div id="quote"></div>
<div class="note" id="status" style="text-align:center"></div>
`,
  String.raw`
T.pollMs=Number(qp('every',5))*1000;
var shown='',artSrc='',quoteSig='';
function onError(){$('status').innerHTML='Connection problem, retrying...';}
function onTrack(d){paintBackdrop();}
function onLyrics(){render();}
function onState(){render();}
function render(){
  var d=T.d;
  if(T.err===0)$('status').innerHTML='';
  if(!d||!d.title){
    if(shown!=='idle'){shown='idle';$('title').innerHTML='Nothing playing';$('artist').innerHTML='';$('album').innerHTML='';$('art').style.display='none';$('barbox').style.display='none';$('quote').innerHTML='';}
    return;
  }
  var L=T.lyrics,dur=L&&L.duration,e=Math.max(0,T.elapsed());
  if(dur){
    $('fill').style.width=Math.min(100,Math.round(e/dur*100))+'%';
    $('time').innerHTML=fmt(Math.min(e,dur))+' / '+fmt(dur)+(T.playing?'':' &middot; paused');
    $('barbox').style.display='block';
  }else{$('barbox').style.display='none';}
  var s=T.key+':'+(T.playing?1:0);
  if(s!==shown){
    shown=s;
    $('title').innerHTML=esc(d.title);
    $('artist').innerHTML=esc(d.artist);
    $('album').innerHTML=esc(d.album||'')+(T.playing?'':(d.album?' &middot; ':'')+'last played');
  }
  if(d.art){
    if(d.art!==artSrc){artSrc=d.art;$('art').src=artUrl(d.art);}
    $('art').style.display='inline';
  }else{artSrc='';$('art').style.display='none';}
  var q='';
  if(T.playing&&L&&L.synced&&L.synced.length){var i=lineIndex(L.synced,e);if(i>=0)q=lineAt(L.synced,i);}
  if(q!==quoteSig){quoteSig=q;$('quote').innerHTML=q?esc(q):'';}
}
paintBackdrop();
poll();
setInterval(render,Number(qp('every',5))*1000);
`
);

// Equaliser: the song above, LED-style bars below. The Kindle cannot hear the music, so the bars
// are not a real spectrum: their height follows the song's own timing (sung lines are loud, gaps
// and intros are quiet, a paused song is flat) with a per-song beat and bar personality.
const EQ_PAGE = layout(
  String.raw`
#head{text-align:center;margin:0.9em 0 0.5em}
#title{font-size:1.7em;font-weight:900;line-height:1.15;margin:0.1em 0}
#artist{font-size:0.95em;color:#222}
#album{font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;color:#666;margin-top:0.5em}
#eqwrap{border:3px solid #000;background:#fff;margin:0.7em 0 0;line-height:0}
#eq{display:block}
#time{text-align:center;margin-top:0.2em}
#foot{border-top:2px solid #000;padding-top:0.5em;margin-top:0.6em}
.modes a{font-family:Figtree,Helvetica,Arial,sans-serif;font-size:0.5em;text-decoration:none;color:#666;margin-right:1.2em;letter-spacing:0.08em;text-transform:uppercase}
.modes a.on{color:#000;border-bottom:3px solid #000}
`,
  nav('eq') +
    String.raw`
<div id="head"><div id="title">Nothing playing</div><div id="artist">Play something on your phone</div><div id="album"></div></div>
<div id="eqwrap"><canvas id="eq" width="10" height="10"></canvas></div>
<div class="prog"><div id="pf"></div></div>
<div class="note" id="time"></div>
<div id="foot">
<div class="modes" id="modes"></div>
<div class="note" id="status"></div>
</div>
`,
  String.raw`
var style=qp('style','bars'),N=Number(qp('n',style==='mirror'?18:16)),tickMs=Number(qp('tick',700)),shown='',eqSig='',pctSig=-1,peaks=[],prevLvl=[];
T.pollMs=Number(qp('poll',3))*1000;
(function(){
  var m=['bars','mirror'],l=['Bars','Mirror'],h='<span class="note">Style: </span>',i;
  for(i=0;i<2;i++)h+='<a href="?style='+m[i]+'"'+(style===m[i]?' class="on"':'')+'>'+l[i]+'</a>';
  var sp=[['Calm',1100],['Normal',700],['Lively',450]];
  h+='<span class="note"> &nbsp; Speed: </span>';
  for(i=0;i<3;i++)h+='<a href="?style='+style+'&tick='+sp[i][1]+'"'+(tickMs===sp[i][1]?' class="on"':'')+'>'+sp[i][0]+'</a>';
  $('modes').innerHTML=h;
})();
function hash(s){var h=0,i;for(i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return h>>>0;}
// Per-song character: tempo plus a slow/fast wobble for every bar, all derived from the song name.
var P={key:'',bpm:100,f1:[],f2:[],p1:[],p2:[]};
function personality(){
  var key=T.key||'idle';
  if(P.key===key)return;
  P.key=key;
  var s=hash(key);
  function rnd(){s=(s*1664525+1013904223)>>>0;return s/4294967296;}
  P.bpm=78+Math.floor(rnd()*62);
  var i;P.f1=[];P.f2=[];P.p1=[];P.p2=[];
  for(i=0;i<64;i++){P.f1.push(1.1+rnd()*2.6);P.f2.push(2.3+rnd()*4.4);P.p1.push(rnd()*6.28);P.p2.push(rnd()*6.28);}
}
// How loud the song is right now, 0..1, from the lyric timing.
function energy(e){
  if(!T.playing)return 0.06;
  var L=T.lyrics;
  if(L&&L.synced&&L.synced.length){
    var S=L.synced,i=lineIndex(S,e);
    if(i<0)return 0.4;
    var start=S[i][0],end=i+1<S.length?S[i+1][0]:start+4,len=Math.max(0.5,end-start),txt=S[i][1]||'';
    if(!txt)return 0.25;
    var dens=Math.min(1,txt.length/(len*13)),since=e-start,sung=since<Math.min(len,txt.length/9+0.6)?1:0.5;
    return Math.max(0.2,Math.min(1,0.4+0.3*dens+0.3*sung));
  }
  return 0.6;
}
function levels(e){
  personality();
  var en=energy(e),beat=(e*P.bpm/60)%1,kick=Math.pow(1-beat,2),out=[],b,x,w,bass;
  for(b=0;b<N;b++){
    w=0.5+0.5*Math.sin(e*P.f1[b]+P.p1[b]);
    x=0.5+0.5*Math.sin(e*P.f2[b]+P.p2[b]);
    bass=1-b/N;
    var v=en*(0.25+0.55*w*x+0.2*w)+(T.playing?0.28*kick*bass*en:0)+(T.playing?0.05*bass:0);
    out.push(Math.max(0.04,Math.min(1,v*1.75)));
  }
  return out;
}
function drawEq(e){
  var wrap=$('eqwrap'),W=wrap.clientWidth-6||(window.innerWidth||760)-60,H=Math.max(Math.round(W*0.75),Math.min(Math.round(W*1.15),(window.innerHeight||1000)-340)),cv=$('eq'),ctx=cv.getContext&&cv.getContext('2d');
  if(!ctx)return;
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  var lv=levels(e),pad=Math.round(W*0.06),bw=(W-pad*2)/N,base=H-pad,top=pad,area=base-top,b,r,x,y,cx,cy,rows,g;
  ctx.fillStyle=INV?'#000':'#fff';ctx.fillRect(0,0,W,H);
  ctx.fillStyle=INV?'#fff':'#000';
  var mirror=style==='mirror',R=mirror?12:18,gap=Math.max(3,Math.round(H/85)),fillW=Math.max(4,Math.floor(bw*0.74)),segH=Math.floor((mirror?area/2:area)/R)-gap,mid=top+area/2;
  for(b=0;b<N;b++){
    x=Math.round(pad+b*bw+(bw-fillW)/2);rows=Math.max(1,Math.round(lv[b]*R));
    if(mirror){
      for(r=0;r<rows;r++){
        ctx.fillRect(x,Math.round(mid-(r+1)*(segH+gap)+gap/2),fillW,segH);
        ctx.fillRect(x,Math.round(mid+r*(segH+gap)+gap/2),fillW,segH);
      }
    }else{
      for(r=0;r<rows;r++)ctx.fillRect(x,Math.round(base-(r+1)*(segH+gap)+gap),fillW,segH);
      // falling peak cap: a thin bar that drops one step at a time
      var pk=Math.max(peaks[b]||0,rows);
      if(rows>=pk)pk=rows;else pk=Math.max(rows,pk-1);
      peaks[b]=pk;
      if(pk>rows)ctx.fillRect(x,Math.round(base-pk*(segH+gap)+gap),fillW,Math.max(3,Math.round(segH*0.35)));
    }
  }
  if(!mirror)ctx.fillRect(pad-4,base+gap+3,W-pad*2+8,4);
  else ctx.fillRect(pad-4,Math.round(mid-2),W-pad*2+8,4);
}
function setHead(){
  var d=T.d;
  if(!d||!d.title){$('title').innerHTML='Nothing playing';$('artist').innerHTML='Play something on your phone';$('album').innerHTML='';return;}
  $('title').innerHTML=esc(d.title);$('artist').innerHTML=esc(d.artist);
  $('album').innerHTML=esc(d.album||'')+(T.playing?'':(d.album?' &middot; ':'')+'paused');
}
function setStatus(){$('status').innerHTML=T.err>0?'Connection problem, retrying...':'';}
function frame(){
  var e=Math.max(0,T.elapsed()),dur=T.lyrics&&T.lyrics.duration;
  var sig=T.key+':'+(T.playing?1:0);
  if(sig!==shown){shown=sig;setHead();}
  if(dur){
    var p=Math.min(100,Math.floor(e/dur*100));
    if(p!==pctSig){pctSig=p;$('pf').style.width=p+'%';}
    $('time').innerHTML=fmt(Math.min(e,dur))+' / '+fmt(dur);
  }else{$('time').innerHTML=T.d&&T.d.title?fmt(e):'';}
  if(T.playing||eqSig!=='flat'){drawEq(e);eqSig=T.playing?'live':'flat';}
}
function onError(){setStatus();}
function onTrack(d){paintBackdrop();shown='';frame();}
function onLyrics(){frame();}
function onState(){setStatus();frame();}
paintBackdrop();
poll();
setInterval(frame,tickMs);
frame();
`
);

// Home menu: a plain static page, no backdrop/polling needed. Launched on the Kindle by a
// scriptlet (a .sh file in /mnt/us/documents) that runs:
//   lipc-set-prop -s com.lab126.appmgrd start "app://com.lab126.browser?view=https://<this-worker>/hub"
const HUB_PAGE = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
<title>Paperwhite Hub</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Helvetica,Arial,sans-serif;font-weight:bold}
a{color:#000;text-decoration:none}
.top{border-bottom:3px solid #000;padding:14px 16px;text-align:center}
.top h1{margin:0;font-size:26px;letter-spacing:1px}
.view{display:none;padding-bottom:90px}
.view.on{display:block}
.sect{font-size:15px;letter-spacing:3px;text-transform:uppercase;color:#555;padding:16px 18px 6px;font-weight:bold}
.item{display:block;padding:18px;border-bottom:2px solid #d8d8d8;overflow:hidden}
.item .tile{float:left;width:56px;height:56px;border:3px solid #000;border-radius:14px;text-align:center;line-height:56px;font-size:24px;margin-right:16px}
.item b{display:block;font-size:23px;line-height:1.1;padding-top:4px}
.item span{display:block;font-size:16px;color:#555;font-weight:normal;margin-top:4px}
.dock{position:fixed;left:0;right:0;bottom:0;border-top:3px solid #000;background:#fff;padding:8px 0;overflow:hidden}
.dk{display:block;float:left;width:33%;text-align:center;padding:10px 0;font-size:16px;letter-spacing:1px;text-transform:uppercase;font-weight:bold}
.dk.on{background:#000;color:#fff}
.msg{padding:30px 18px;font-size:18px;font-weight:normal;color:#444;line-height:1.5}
</style>
</head>
<body>
<div class="top"><h1>PAPERWHITE HUB</h1></div>

<div class="view on" id="v-home">
  <div class="sect">Your apps</div>
  <div id="applist"></div>
</div>

<div class="view" id="v-library">
  <div class="sect">Library</div>
  <div class="msg">Full library browsing (your books, covers, progress) isn't built yet. Use the Kindle's physical Home button to reach your normal book library, then come back here.</div>
</div>

<div class="view" id="v-web">
  <div class="sect">Web</div>
  <a class="item" id="open-browser"><span class="tile">B</span><b>Open Browser</b><span>Blank page, type any address</span></a>
  <div class="sect">Favourites</div>
  <div id="weblist"></div>
</div>

<div class="dock">
  <div class="dk on" id="dock-home">Home</div>
  <div class="dk" id="dock-library">Library</div>
  <div class="dk" id="dock-web">Web</div>
</div>

<script>
// Try to hide the browser's own toolbar via the native chrome service, if this page is
// allowed to call it (ordinary web content usually isn't - this just fails silently if not).
try {
  var kindle = window.kindle || top.kindle;
  if (kindle && kindle.messaging) {
    kindle.messaging.sendMessage('com.lab126.chromebar', 'configureChrome', { topNavBar: { template: 'none' } });
  }
} catch (e) {}
var apps = [
  { icon: 'L', name: 'Lyrics', sub: 'Synced lyrics as the song plays', url: '/lyrics' },
  { icon: 'N', name: 'Now Playing', sub: 'Album art and progress', url: '/nowplaying' },
  { icon: 'E', name: 'Equaliser', sub: 'Bars that move with the song', url: '/equalizer' },
  // Add more apps here, e.g.:
  // { icon: 'S', name: 'My Sensor', sub: 'Description', url: 'https://example.com' }
];
function buildList(container, items) {
  for (var i = 0; i < items.length; i++) {
    (function (a) {
      var item = document.createElement('a');
      item.className = 'item';
      item.href = a.url;
      item.innerHTML = '<span class="tile">' + a.icon + '</span><b>' + a.name + '</b><span>' + a.sub + '</span>';
      container.appendChild(item);
    })(items[i]);
  }
}
buildList(document.getElementById('applist'), apps);
buildList(document.getElementById('weblist'), apps);
document.getElementById('open-browser').onclick = function () {
  window.location.href = 'app://com.lab126.browser';
};
var views = { home: document.getElementById('v-home'), library: document.getElementById('v-library'), web: document.getElementById('v-web') };
var docks = { home: document.getElementById('dock-home'), library: document.getElementById('dock-library'), web: document.getElementById('dock-web') };
function show(name) {
  for (var k in views) { views[k].className = 'view' + (k === name ? ' on' : ''); docks[k].className = 'dk' + (k === name ? ' on' : ''); }
}
docks.home.onclick = function () { show('home'); };
docks.library.onclick = function () { show('library'); };
docks.web.onclick = function () { show('web'); };
</script>
</body></html>`;
