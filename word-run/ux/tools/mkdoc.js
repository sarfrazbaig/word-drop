/* Builds the UX handbook: one self-contained HTML file, tables generated from the game's
   own data dump, screens embedded from the headless captures. No em-dashes anywhere. */
const fs = require("fs");
const SP  = require("path").join(__dirname,"..",".work");
const OUT = require("path").join(__dirname,"..","..") + "/ux/hushwood-handbook.html";
const D   = JSON.parse(fs.readFileSync(SP + "/data.json", "utf8"));

const img = n => {
  const p = SP + "/shots/" + n + ".jpg";
  if (!fs.existsSync(p)) return "";
  return "data:image/jpeg;base64," + fs.readFileSync(p).toString("base64");
};
const esc = s => String(s == null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

/* a phone-framed screen with a caption */
const shot = (file, cap, note) =>
  '<figure class="shot"><div class="phone"><img loading="lazy" src="' + img(file) + '" alt="' + esc(cap) + '"></div>'
  + '<figcaption><b>' + esc(cap) + '</b>' + (note ? '<span>' + note + '</span>' : '') + '</figcaption></figure>';

const adv = n => "L" + n;                    // adventure levels, the number the player sees

/* ---------- tables ---------- */
const valRows = (() => {
  const byVal = {};
  for (const k in D.VAL) (byVal[D.VAL[k]] = byVal[D.VAL[k]] || []).push(k.toUpperCase());
  return Object.keys(byVal).sort((a,b)=>a-b)
    .map(v => '<tr><td class="num">' + v + '</td><td class="letters">' + byVal[v].sort().join(" ") + '</td></tr>').join("");
})();

const troubleRows = Object.entries(D.trouble).map(([k, t]) => {
  const tip = D.tips[k];
  const homes = t.homes.map(h => h[0] === h[1] ? D.biomes[h[0]].name : D.biomes[h[0]].name + " to " + D.biomes[h[1]].name).join(", ");
  return '<tr><td class="ob"><span class="obi">' + t.icon + '</span><b>' + k + '</b></td>'
    + '<td>' + esc(tip ? tip.t : "") + '</td>'
    + '<td class="num">' + adv(t.debut) + '</td>'
    + '<td class="small">' + esc(homes) + '</td>'
    + '<td class="num">' + t.max + '</td>'
    + '<td class="small">' + (t.goal ? D.goals[t.goal].name : "-") + '</td></tr>';
}).join("");

const petRows = D.pets.map(p => {
  const how = p.keystoneAt
    ? '<span class="tag key">handed to you</span> at the door of ' + adv(p.keystoneAt)
    : '<span class="tag call">spell the name</span> ' + (p.minL ? 'from ' + adv(p.minL) : '') ;
  const wake = p.passive
    ? '<span class="tag pass">always on</span>'
    : (p.wakeOn ? esc(D.wakeWords[p.wakeOn] || p.wakeOn) + ' &times;' + p.wakeN : '-');
  /* a keystone is never called for - it is given at a door - so showing its calling text
     would say it can be earned two ways when only one of them is real */
  return '<tr><td class="pet"><span class="pe">' + p.emoji + '</span><b>' + p.w.toUpperCase() + '</b>'
    + '<i>' + esc(p.flavour) + '</i></td>'
    + '<td class="small">' + how + ((p.calling && !p.keystoneAt) ? '<br><span class="dim">' + esc(p.calling) + '</span>' : '') + '</td>'
    + '<td class="small">' + wake + '</td>'
    + '<td><b>' + p.powerIcon + ' ' + esc(p.power) + '</b><br><span class="dim">' + esc(p.does) + '</span></td></tr>';
}).join("");

const biomeRows = D.biomes.map(b =>
  '<tr><td class="num">' + b.icon + '</td><td><b>' + esc(b.name) + '</b><br><span class="dim">' + esc(b.line) + '</span></td>'
  + '<td class="num">' + adv(b.from) + '-' + adv(b.to) + '</td>'
  + '<td class="small">' + Object.entries(D.trouble).filter(([k,t]) => t.homes.some(h => b.i >= h[0] && b.i <= h[1]))
      .map(([k,t]) => t.icon + " " + k).join("  ") + '</td></tr>').join("");

const gateRows = Object.entries(D.gates).map(([lv, g]) => {
  const rules = [];
  if (g.moves) rules.push("only " + g.moves + " moves");
  if (g.seats) rules.push("only " + g.seats + " friends may come");
  if (g.small) rules.push("words under 4 letters score nothing");
  if (g.noWish) rules.push("no wish");
  if (g.noTools) rules.push("no tools at all");
  if (g.free)  rules.push("a gentle one, to teach the idea");
  if (g.bars)  rules.push(g.bars + " is barred");
  return '<tr><td class="num">' + adv(+lv) + '</td><td><b>' + esc(g.n) + '</b></td>'
    + '<td class="small">' + (rules.length ? esc(rules.join(" &middot; ")).replace(/&amp;middot;/g,"&middot;") : "-") + '</td>'
    + '<td class="num">' + (g.door ? "door" : "") + '</td>'
    + '<td class="small">' + (D.keystones[lv] ? "you are handed the <b>" + D.keystones[lv] + "</b>" : "") + '</td></tr>';
}).join("");

const goalRows = Object.entries(D.goals).map(([k,g]) =>
  '<tr><td class="num">' + g.i + '</td><td><b>' + esc(g.n) + '</b></td>'
  + '<td class="small">' + esc(D.tips["goal-" + k] ? D.tips["goal-" + k].t : "") + '</td></tr>').join("");

/* how many of the fifty listen for each event, which is the number that actually matters
   when you are deciding whether an event fires often enough to be worth listening for */
const wakeRows = (() => {
  const count = {};
  D.pets.filter(p => p.wakeOn).forEach(p => (count[p.wakeOn] = (count[p.wakeOn] || 0) + 1));
  return Object.entries(count).sort((a,b) => b[1] - a[1]).map(([k,n]) =>
    '<tr><td><b>' + esc(D.wakeWords[k] || k) + '</b></td>'
    + '<td class="small dim">' + k + '</td>'
    + '<td class="num">' + n + '</td>'
    + '<td class="small">' + esc(D.pets.filter(p => p.wakeOn === k).map(p => p.w).join(", ")) + '</td></tr>').join("");
})();

/* ---------- the page ---------- */
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hushwood - the interaction handbook</title>
<style>
:root{
  --ink:#3a2f22; --ink2:#6b5a3d; --dim:#8d7a5c; --paper:#f7f1e2; --paper2:#fffdf6;
  --edge:#e0d4b8; --gold:#c9962f; --gold2:#8a6414; --green:#4c7a46; --green2:#2f5330;
  --rust:#c8552f; --shadow:0 8px 24px -14px rgba(70,50,20,.55);
  --serif:"Fraunces",Georgia,"Times New Roman",serif;
  --sans:"Nunito","Segoe UI",system-ui,-apple-system,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:#b9ac96;color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.65;
  -webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:0 18px 90px;display:grid;grid-template-columns:224px 1fr;gap:34px;align-items:start}
@media(max-width:900px){.wrap{grid-template-columns:1fr;gap:0}}

/* cover */
header.cover{background:linear-gradient(170deg,#2f5330,#243d26 60%,#1d3220);color:#f4ecd8;
  padding:52px 22px 44px;text-align:center;border-bottom:5px solid var(--gold)}
header.cover h1{font-family:var(--serif);font-size:clamp(28px,5vw,46px);margin:0 0 6px;letter-spacing:-.01em}
header.cover .sub{font-size:15px;opacity:.9;max-width:620px;margin:0 auto 14px;line-height:1.6}
header.cover .meta{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.72}
header.cover .tiles{display:flex;gap:6px;justify-content:center;margin-bottom:16px;flex-wrap:wrap}
header.cover .tiles b{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;
  font-weight:900;font-size:17px;color:#5b431c;position:relative;
  background:linear-gradient(148deg,#fffdf4,#f2e6c8 52%,#e2d0a4);box-shadow:0 4px 0 #c2a068}

/* nav */
nav{position:sticky;top:14px;background:var(--paper2);border:1px solid var(--edge);border-radius:14px;
  padding:14px 12px;box-shadow:var(--shadow);margin-top:26px;max-height:calc(100vh - 40px);overflow:auto}
@media(max-width:900px){nav{position:static;max-height:none;margin-top:18px}}
nav h4{font-family:var(--serif);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin:0 0 8px}
nav a{display:block;padding:4px 8px;border-radius:7px;color:var(--ink2);text-decoration:none;font-size:12.5px;line-height:1.4}
nav a:hover{background:#f0e7cf;color:var(--green2)}
nav a.d{padding-left:18px;font-size:12px;color:var(--dim)}

main{margin-top:26px;min-width:0}
section{background:var(--paper);border:1px solid var(--edge);border-radius:16px;padding:24px 26px 28px;
  margin-bottom:22px;box-shadow:var(--shadow)}
@media(max-width:560px){section{padding:18px 15px 22px}}
section>h2{font-family:var(--serif);font-size:24px;margin:0 0 4px;color:var(--green2);letter-spacing:-.01em}
section>.lead{color:var(--ink2);margin:0 0 18px;font-size:14.5px}
h3{font-family:var(--serif);font-size:17px;margin:26px 0 6px;color:var(--ink)}
h3:first-of-type{margin-top:10px}
h4{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:20px 0 6px}
p{margin:0 0 11px}
ul,ol{margin:0 0 12px;padding-left:20px}
li{margin-bottom:5px}
b,strong{color:var(--ink)}
code{background:#ebe0c4;border-radius:4px;padding:1px 5px;font-size:12.5px;
  font-family:ui-monospace,"Cascadia Code",Consolas,monospace;color:#5c4a24}
.dim{color:var(--dim)}
.small{font-size:12.5px}

/* callouts */
.why{background:rgba(76,122,70,.12);border-left:3px solid var(--green);border-radius:0 10px 10px 0;
  padding:11px 14px;margin:12px 0;font-size:13.5px;line-height:1.6}
.why b:first-child{color:var(--green2)}
.warn{background:rgba(200,85,47,.11);border-left:3px solid var(--rust);border-radius:0 10px 10px 0;
  padding:11px 14px;margin:12px 0;font-size:13.5px}
.warn b:first-child{color:#8f3a17}
.note{background:rgba(201,150,47,.13);border-left:3px solid var(--gold);border-radius:0 10px 10px 0;
  padding:11px 14px;margin:12px 0;font-size:13.5px}

/* screens */
.shots{display:flex;flex-wrap:wrap;gap:20px;margin:16px 0 6px}
.shot{margin:0;flex:0 0 auto;width:212px}
.shot.wide{width:262px}
.phone{border-radius:16px;overflow:hidden;background:#2a2118;box-shadow:0 10px 26px -12px rgba(40,28,10,.65);
  border:1px solid rgba(90,70,40,.4)}
.phone img{display:block;width:100%;height:auto}
.shot figcaption{font-size:11.5px;line-height:1.5;color:var(--ink2);margin-top:7px}
.shot figcaption b{display:block;color:var(--green2);font-size:12px}
.shot figcaption span{display:block;color:var(--dim);margin-top:2px}

/* tables */
.tbl{width:100%;overflow-x:auto;margin:12px 0 6px;border-radius:11px;border:1px solid var(--edge);background:var(--paper2)}
table{border-collapse:collapse;width:100%;font-size:13px;min-width:520px}
th{background:#ece1c6;text-align:left;padding:8px 10px;font-size:11px;letter-spacing:.07em;
  text-transform:uppercase;color:#6a5730;position:sticky;top:0;white-space:nowrap}
td{padding:8px 10px;border-top:1px solid #eee3c9;vertical-align:top}
tr:nth-child(even) td{background:rgba(236,225,198,.32)}
td.num{white-space:nowrap;font-weight:800;color:var(--gold2);font-size:12.5px}
td.letters{font-weight:800;letter-spacing:.16em;color:var(--ink)}
td.ob b{text-transform:capitalize}
.obi{font-size:16px;margin-right:6px}
td.pet{white-space:nowrap}
td.pet .pe{font-size:17px;margin-right:6px}
td.pet i{display:block;font-style:normal;font-size:11px;color:var(--dim);white-space:normal;max-width:190px;margin-top:2px}
.tag{display:inline-block;font-size:9.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;
  padding:2px 6px;border-radius:5px;vertical-align:1px}
.tag.key{background:#8a6414;color:#fff6e0}
.tag.call{background:#4c7a46;color:#eefae9}
.tag.pass{background:#5b6f86;color:#eef4fa}

/* number strip */
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:6px 0 16px}
.stat{background:var(--paper2);border:1px solid var(--edge);border-radius:11px;padding:9px 14px;min-width:96px}
.stat b{display:block;font-family:var(--serif);font-size:22px;color:var(--green2);line-height:1.15}
.stat span{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--dim)}

/* step list */
.steps{counter-reset:s;list-style:none;padding:0;margin:10px 0}
.steps li{counter-increment:s;position:relative;padding-left:34px;margin-bottom:10px}
.steps li::before{content:counter(s);position:absolute;left:0;top:1px;width:23px;height:23px;border-radius:50%;
  background:var(--green);color:#eefae9;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center}

/* two-column split */
.split{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media(max-width:700px){.split{grid-template-columns:1fr}}

/* log */
.log{border-left:2px solid var(--edge);padding-left:16px;margin:12px 0}
.log .item{position:relative;margin-bottom:14px}
.log .item::before{content:"";position:absolute;left:-21px;top:6px;width:9px;height:9px;border-radius:50%;
  background:var(--gold);box-shadow:0 0 0 3px var(--paper)}
.log h5{margin:0 0 2px;font-size:13.5px;font-family:var(--serif);color:var(--green2)}
.log p{margin:0;font-size:13px;color:var(--ink2)}

/* any screen can be opened full size - they are 212px in the flow, which is enough to
   follow along but not enough to read a tile */
.phone img{cursor:zoom-in}
#lb{position:fixed;inset:0;background:rgba(28,22,12,.9);display:none;align-items:center;justify-content:center;
  z-index:999;padding:22px;cursor:zoom-out;backdrop-filter:blur(3px)}
#lb.on{display:flex}
#lb img{max-width:min(430px,92vw);max-height:92vh;border-radius:16px;box-shadow:0 20px 60px -18px #000}
#lb .cap{position:absolute;bottom:16px;left:0;right:0;text-align:center;color:#f2e8d0;font-size:12.5px;
  letter-spacing:.03em;text-shadow:0 1px 3px rgba(0,0,0,.8)}
footer{text-align:center;color:#6b5c44;font-size:12px;padding:26px 18px 50px}
@media print{ body{background:#fff} nav{display:none} .wrap{grid-template-columns:1fr} section{break-inside:avoid;box-shadow:none} }
</style></head><body>

<header class="cover">
  <div class="tiles"><b>H</b><b>U</b><b>S</b><b>H</b><b>W</b><b>O</b><b>O</b><b>D</b></div>
  <h1>The interaction handbook</h1>
  <p class="sub">Every input a player can make, everything the wood shows back, and the reason behind each
     decision. Written for a designer joining the project, so nothing assumes you have played it.</p>
  <div class="meta">a storybook of true names &middot; 300 levels &middot; 50 friends &middot; built for phones</div>
</header>

<div class="wrap">
<nav>
  <h4>Contents</h4>
  <a href="#what">1 &middot; What this is</a>
  <a href="#shape">2 &middot; The shape of it</a>
  <a href="#screens">3 &middot; The screens</a>
  <a href="#drop">4 &middot; Dropping a letter</a>
  <a href="#drop" class="d">tap</a>
  <a href="#drop" class="d">hold and slide</a>
  <a href="#drop" class="d">refused drops</a>
  <a href="#board">5 &middot; The board and its tiles</a>
  <a href="#board" class="d">letter values</a>
  <a href="#board" class="d">obstacles</a>
  <a href="#words">6 &middot; Words</a>
  <a href="#words" class="d">the grace</a>
  <a href="#words" class="d">scoring</a>
  <a href="#tools">7 &middot; Breeze and wish</a>
  <a href="#friends">8 &middot; The fifty friends</a>
  <a href="#ceremony">9 &middot; The naming ceremony</a>
  <a href="#levels">10 &middot; Levels and countries</a>
  <a href="#amber">11 &middot; Amber</a>
  <a href="#tutorial">12 &middot; The prologue</a>
  <a href="#notify">13 &middot; One voice</a>
  <a href="#log">14 &middot; What we changed</a>
  <a href="#open">15 &middot; Still open</a>
</nav>

<main>

<section id="what">
<h2>1 &middot; What this is</h2>
<p class="lead">A cosy word game where letters fall, words bloom, and spelling a creature's true name wakes it.</p>

<p>You are given one letter at a time and you choose a column. The letter falls to the bottom of that column
   like a coin in Connect Four. When the letters on the board happen to spell a word - along a row, down a
   column, or up one - that word lights up, pays out, and clears. What is above it falls into the gap, which
   often spells something else, which is where the game gets its rhythm.</p>

<p>On top of that sits the reason to keep going: fifty creatures live in the wood and every one of them has
   forgotten its name. Spell <b>CAT</b> on the board and the cat wakes up and walks with you. Friends have
   powers, powers change how a round plays, and the whole 300-level walk is built around collecting them.</p>

<div class="why"><b>The feeling we are aiming at.</b> Unhurried. Nothing in the game is on a timer, nothing
   punishes you for thinking, and the art is painted rather than rendered. The competitor set is Wordscapes
   and Word Cookies; the difference we are betting on is that those games have no characters and no reason to
   come back besides the next puzzle.</div>

<h3>Where it runs</h3>
<ul>
<li><b>Phones first.</b> The whole layout is a fixed ${D.consts.COLS}-column stage scaled to fit the screen.
    Desktop works but is not the target.</li>
<li><b>One file.</b> The entire game is a single HTML file, built to a static site. There is no server and no
    account. Progress lives in the browser.</li>
<li><b>Installable.</b> It registers a service worker, so it can be added to a home screen and played offline.</li>
</ul>

<div class="note"><b>How to read this document.</b> Every number, table and quoted line of copy in here was
   pulled straight out of the game's own data at build time, not typed out by hand, so it cannot drift from
   what actually ships. The green blocks are the reasoning behind a decision. The red blocks are problems we
   already know about and have not fixed yet.</div>
</section>

<section id="shape">
<h2>2 &middot; The shape of it</h2>
<p class="lead">The numbers a designer needs in their head before anything else.</p>
<div class="stats">
  <div class="stat"><b>${D.consts.COLS}&times;${D.consts.ROWS}</b><span>board</span></div>
  <div class="stat"><b>300</b><span>levels</span></div>
  <div class="stat"><b>${D.biomes.length}</b><span>countries</span></div>
  <div class="stat"><b>${D.consts.BIOME_LEN}</b><span>levels each</span></div>
  <div class="stat"><b>${D.consts.TOTAL}</b><span>friends</span></div>
  <div class="stat"><b>${Object.keys(D.trouble).length}</b><span>obstacle kinds</span></div>
  <div class="stat"><b>${Object.keys(D.gates).length}</b><span>gate levels</span></div>
  <div class="stat"><b>${D.consts.PROLOGUE_END}</b><span>taught rounds</span></div>
</div>

<h3>Two different level numbers, and why</h3>
<p>The first ${D.consts.PROLOGUE_END} rounds are the prologue: scripted lessons that teach the game. They are
   labelled <b>Prologue 1 of ${D.consts.PROLOGUE_END}</b> and carry no level number. The story starts counting
   at the first round you play unaided, so a player's first real level reads <b>Level 1</b>, not Level 6.</p>
<div class="warn"><b>A trap for anyone reading the code.</b> Internally the counter includes the prologue, so
   internal level 6 is the player's Level 1. Every schedule table in the game is written in <i>player</i>
   numbers and converted. If you see a level number in this document it is the number the player sees.</div>
</section>

<section id="screens">
<h2>3 &middot; The screens</h2>
<p class="lead">There are only three real places: the doorway, the round, and the book. Everything else is a
   card that appears over one of them.</p>
<div class="shots">
  ${shot("01-home-fresh","The doorway, first time","A new player sees the prologue button and nothing else. No pets, no counters, nothing to explain yet.")}
  ${shot("02-home","The doorway, later","The country's painting becomes the backdrop. The button carries the level you are on.")}
  ${shot("03-intro","Before a round","Where you are, what the round asks, how many moves, and which troubles are on the board.")}
  ${shot("04-board","The round","Party along the top, board in the middle, your letter and the two tools along the bottom.")}
  ${shot("11-album","The Book of Names","Your party, your progress, and every friend grouped by what wakes them.")}
  ${shot("12-petsheet","One friend","Portrait, power, what wakes them, and the button that puts them on duty.")}
  ${shot("15-menu","The menu","Sound, the shop, telemetry, and the way back out.")}
  ${shot("10-fail","When a round runs out","The score you reached, your best word, and the ways back in - each showing its own price.")}
</div>
</section>

<section id="drop">
<h2>4 &middot; Dropping a letter</h2>
<p class="lead">This is the whole game. Everything else is decoration on top of one gesture, so it gets the
   longest section in this document.</p>

<div class="shots">
  ${shot("05-hold","A letter in your hand","The tile has lifted out of the dock and rides above the fingertip. The dashed outline below marks the cell it will land in, and the dock slot is faded because the letter is not in it any more.")}
  ${shot("04-board","At rest","The letter sits in the dock, with the next two queued beside it.")}
</div>

<h3>There are two ways to do it, and they are the same gesture</h3>
<ol class="steps">
<li><b>Tap a column.</b> Press anywhere in a column and let go. The letter materialises just above where you
    pressed and falls from there into the column.</li>
<li><b>Hold and slide.</b> Press, keep your finger down, and move across the board. The tile comes loose and
    rides with you, held one tile-height clear of your fingertip so your own thumb never covers it. A dashed
    outline shows the cell it will drop into. Let go and it falls from your finger.</li>
</ol>

<div class="why"><b>Why the tile is held above the finger.</b> On a phone the thing that tells you where the
   letter will land is directly underneath the thumb doing the aiming. Lifting the piece clear solves that,
   and it does something else at the same time: something visibly comes loose the moment you press, which is
   how a player discovers that sliding is possible at all. A playtester finished the whole game without ever
   finding out.</div>

<div class="why"><b>Why one object, never two.</b> The tile you are holding is the tile that lands. It keeps
   its position at the moment of release and carries on down from there, and the held element is removed in
   the same frame its replacement is drawn, so there is nothing to see in the handover. It used to be deleted
   at your fingertip while a different tile was created above the column and dropped in, which on a tap read
   as a flash where you pressed and then something else falling out of the sky.</div>

<h4>The details that took the longest to get right</h4>
<ul>
<li><b>The held tile is a real tile.</b> Same structure, same face, same size, same letter value as a tile on
    the board, and it takes its colours from whichever country you are in. It used to draw its own
    approximation and was wrong in all ${D.biomes.length} countries, ten percent too large, and showed a stick
    of dynamite where the board shows an acorn.</li>
<li><b>The fall is timed by distance.</b> Roughly 42ms per cell travelled, with an 80ms floor. A release high
    above the stack falls at full speed; a tap just above the landing cell does not dawdle.</li>
<li><b>The gesture cannot be stolen.</b> The board takes <code>touch-action: none</code> so the browser never
    reinterprets a drag as a scroll, and the pointer is captured explicitly so the drag survives your finger
    wandering off the board.</li>
<li><b>A second finger is ignored.</b> The gesture remembers which pointer started it.</li>
</ul>

<h3>What happens when a drop is refused</h3>
<p>The letter is always given back. The slot fills again and no move is spent. A drop bounces when:</p>
<ul>
<li>the column is full to the top</li>
<li>a ${D.trouble.reed ? D.trouble.reed.icon : ""} reed stands in the column, which blocks the whole column</li>
<li>the board is still resolving a previous word</li>
<li>a lesson is asking for a specific column and you chose a different one</li>
</ul>
<div class="warn"><b>Known gap.</b> A tap while the board is still resolving is silently ignored: no tile, no
   drop, no feedback. It is not new behaviour and it does not lose the letter, but it is the one case where a
   press does nothing visible and says nothing about why.</div>

<h4>The move economy</h4>
<p>Every drop costs one move, and the moves left is the round's real clock. Two friends change this: the
   turtle makes the first drop of every level free, and the snail makes every sixth drop free. A refused drop
   never costs anything.</p>
</section>

<section id="board">
<h2>5 &middot; The board and its tiles</h2>
<p class="lead">${D.consts.COLS} columns, ${D.consts.ROWS} rows, ${D.consts.CELL}px tiles with a
   ${D.consts.GAP}px gap, and the whole stage scaled to whatever screen it lands on.</p>

<h3>Ordinary letters</h3>
<p>Each letter carries a value, printed small in its corner, and those values are Scrabble-like: common
   letters are cheap, awkward letters pay.</p>
<div class="tbl"><table>
<thead><tr><th>Value</th><th>Letters</th></tr></thead><tbody>${valRows}</tbody></table></div>

<h3>The three special tiles</h3>
<div class="split">
<div>
<p><b>&#10024; Gold.</b> ${esc(D.tips.gold.t)}</p>
<p><b>&#11088; A fallen star.</b> A wild tile. It becomes whichever letter the word needs, and it is worth
   nothing itself, so a star is a key rather than a prize.</p>
</div>
<div>
<p><b>&#127792; An acorn.</b> Dropped by the phoenix rather than dealt. It bursts in a three by three blast
   instead of landing as a letter.</p>
<p><b>&#127744; Mist and ice</b> sit on top of ordinary letters rather than replacing them, which is why they
   are in the table below rather than here.</p>
</div>
</div>

<h3>The sixteen troubles</h3>
<p>Each one debuts <b>alone</b>, on an otherwise clean board, so it can be understood by itself before it ever
   has to be understood next to anything else. After that it thickens slowly and only appears in the countries
   it belongs to. The wording in this table is the game's own explanation, shown to the player the first time
   they meet it.</p>
<div class="tbl"><table>
<thead><tr><th>Trouble</th><th>What the wood tells the player</th><th>Debuts</th><th>Lives in</th><th>Max</th><th>Can be a goal</th></tr></thead>
<tbody>${troubleRows}</tbody></table></div>

<div class="why"><b>The rule underneath all of them.</b> Almost nothing is cleared by spelling <i>through</i>
   it. You clear a word <b>beside</b> it. That single idea covers fifteen of the sixteen, which is why a player
   who learns the branch can guess the rest, and it is why the reed - which blocks a whole column and has to be
   attacked from the side - is the one that reliably confuses people.</div>
</section>

<section id="words">
<h2>6 &middot; Words</h2>
<p class="lead">Three letters minimum, from a ${(16304).toLocaleString()}-word dictionary of common English.</p>

<h3>Which directions read</h3>
<ul>
<li><b>Along a row</b>, left to right.</li>
<li><b>Down a column</b>, top to bottom.</li>
<li><b>Up a column</b>, bottom to top - the way you stacked it.</li>
</ul>
<p>Right-to-left along a row does not count. Upward words are deliberate: you build a column from the bottom,
   so reading it upward is reading it in the order you played it.</p>

<h3>The grace: hold, or let it bloom</h3>
<div class="shots">
  ${shot("06-grace","A word, paused","The word lights up on the board and a pill appears above the dock. Do nothing and it blooms. Tap HOLD and the letters stay so you can build something longer.")}
</div>
<p>Any word you make lights up and waits a breath. Then:</p>
<ul>
<li><b>Do nothing</b> and it blooms - it clears and pays.</li>
<li><b>Tap 🌱 HOLD</b> and the board keeps the letters, so you can extend CAT into CATS.</li>
<li><b>Tap the board</b> and it blooms immediately. Patience is never taxed.</li>
</ul>
<p>Three things never pause, each because pausing would break a promise: a cascade, because that is the game
   paying you; an undiscovered true name, because the creature must wake and a held CAT could become CATS; and
   your last move, because holding it would be a loss you did not choose.</p>

<h3>How a word is scored</h3>
<ol class="steps">
<li>Add up the letter values. A gold tile counts its letter three times. A star counts zero.</li>
<li>Multiply by length: 3 letters &times;1.3, 4 &times;2, 5 &times;4, 6 &times;6, 7 &times;8, 8 &times;10.</li>
<li>Multiply by the cascade number - the second word in a chain doubles, the third triples, and so on.</li>
<li>Then friends and effects apply: doubling songs, half-scoring shrouds, flat bonuses.</li>
</ol>
<div class="why"><b>Why long words pay so steeply.</b> Telemetry from real players says three letters 71% of
   the time, four 25%, five 4%, and six or more never once. A five-letter word has to feel like an event
   because it nearly never happens, and a good six-letter word should be able to clear a level on its own.
   That is the chase.</div>
</section>

<section id="tools">
<h2>7 &middot; Breeze and wish</h2>
<p class="lead">Two tools, both earned by playing well, both buyable when you run dry.</p>
<div class="shots">
  ${shot("07-breeze","The breeze, armed","The board enters a mode: the tiles you may trade stir gently, and the ones you may not go still.")}
  ${shot("08-wish","The wish","Every letter of the alphabet, and the one in your hand becomes whichever you choose.")}
</div>
<div class="split">
<div>
<h4>&#127811; Breeze</h4>
<ul>
${D.tips.breeze.t.map(l => "<li>" + esc(l) + "</li>").join("\n")}
</ul>
<p class="small dim">Costs ${D.toolPrice.swap} amber to buy.</p>
</div>
<div>
<h4>&#127775; Wish</h4>
<ul>
${D.tips.wish.t.map(l => "<li>" + esc(l) + "</li>").join("\n")}
</ul>
<p class="small dim">Costs ${D.toolPrice.wild} amber to buy.</p>
</div>
</div>
<div class="why"><b>Why a tool cannot pay for itself.</b> A word made <i>by</i> a breeze does not earn another
   breeze. Without that rule the tools become a loop that plays the game for you.</div>
</section>

<section id="friends">
<h2>8 &middot; The fifty friends</h2>
<p class="lead">The reason to keep walking. Every friend owns a power the base game never gives you.</p>

<h3>How a friend arrives</h3>
<div class="split">
<div>
<p><b>Forty are spelled.</b> The wood decides a creature is stirring, and the next round becomes a naming
   ceremony where its name is hidden on the board. Spell it and they are yours.</p>
</div>
<div>
<p><b>Ten are handed over.</b> Every name of six letters or more is given at a door instead of spelled,
   because asking somebody to spell SQUIRREL is not a challenge, it is a wall.</p>
</div>
</div>
<div class="why"><b>A keystone answers the country you are walking into, not the one you just left.</b> Clear
   the Undercave and the wood gives you the friend who sees through mist, because the Deep Dark is next. You do
   not get the tool for the room you finished. You get the key to the room ahead.</div>

<h3>The party, and waking</h3>
<p>Four friends walk with you at a time, chosen in the Book. Under each portrait is a row of pips: that is how
   close they are to acting. Each friend listens for one kind of event and needs to hear it a certain number
   of times, then acts on its own. Passive friends have no pips - they are simply always on.</p>
<h4>What friends listen for, and how often it happens</h4>
<div class="tbl"><table style="min-width:560px">
<thead><tr><th>Listens for</th><th>internal name</th><th>friends</th><th>who</th></tr></thead>
<tbody>${wakeRows}</tbody></table></div>
<div class="warn"><b>Known problem: too many friends, too early.</b> A fast player used to trip six friends in
   six levels, which turned the opening into a parade of cards. The arrival schedule now gives the First
   Clearing exactly three, then roughly one friend every five levels. Whether that is still too many in the
   first twenty levels is an open question and is parked, not settled.</div>

<h3>All fifty</h3>
<div class="tbl"><table style="min-width:760px">
<thead><tr><th>Friend</th><th>How they come to you</th><th>Wakes on</th><th>Power</th></tr></thead>
<tbody>${petRows}</tbody></table></div>
</section>

<section id="ceremony">
<h2>9 &middot; The naming ceremony</h2>
<p class="lead">The set piece the whole collection hangs on.</p>
<ol class="steps">
<li>At the end of a round the wood says <b>a name is stirring</b>. No name, no picture, just a promise.</li>
<li>The next round's card says a name hides in it, and which word to spell.</li>
<li>The board is seeded so the name can be built. Nothing else about the round changes: same moves, same
    target.</li>
<li>Spell it and the round stops. The creature is revealed, named, and joins you.</li>
<li>If you fail, the card offers two ways through: buy a glowing letter as a hint, or pay to have them come
    anyway.</li>
</ol>
<div class="why"><b>A ceremony board carries only troubles you have already beaten.</b> A player meeting ice
   for the first time while also being asked to spell a friend into being is being taught two things at once,
   and the ceremony is the one that loses. They read the new tile, not the blanks.</div>
<div class="why"><b>The price of skipping is set by the name.</b> Buying a friend outright is the most
   expensive thing in the game, and it costs more for the names the wood makes you work hardest for. A player
   who has failed a long name three times should be able to pay past it rather than bounce off it forever.</div>
</section>

<section id="levels">
<h2>10 &middot; Levels and countries</h2>
<p class="lead">300 levels, ${D.biomes.length} countries of ${D.consts.BIOME_LEN}, one walk from the floor of
   the wood to the summit.</p>

<h3>The countries</h3>
<p>A country is a chapter, not a backdrop. Each one has its own painting, its own tile colours, its own
   troubles, and its own line of story.</p>
<div class="tbl"><table>
<thead><tr><th></th><th>Country</th><th>Levels</th><th>Troubles that live here</th></tr></thead>
<tbody>${biomeRows}</tbody></table></div>
<div class="shots">
  ${shot("04-board","The Bramblewood","Chapter two. Green closes over the path, and the tiles take the country's colour.")}
  ${shot("14-deep","Deeper in","The same board, a different country. Everything except the rules changes.")}
  ${shot("13-obstacles","A crowded board","Later levels stack several kinds of trouble at once.")}
</div>

<h3>What a round can ask of you</h3>
<p>Most rounds ask for points. The rest make an obstacle the win condition, and each of those introduces
   itself alone before joining the rotation.</p>
<div class="tbl"><table>
<thead><tr><th></th><th>The ask</th><th>What the player is told</th></tr></thead>
<tbody>${goalRows}</tbody></table></div>

<h3>The thirty gates</h3>
<p>Every tenth level is a gate: a named, authored round with a rule the ordinary levels do not have. The ones
   marked <b>door</b> are the last level of a country, and passing one hands you a friend.</p>
<div class="tbl"><table>
<thead><tr><th>Level</th><th>Name</th><th>The rule</th><th></th><th>Reward</th></tr></thead>
<tbody>${gateRows}</tbody></table></div>
</section>

<section id="amber">
<h2>11 &middot; Amber</h2>
<p class="lead">The soft currency. Earned in small drops, spent on small mercies.</p>
<div class="split">
<div>
<h4>Where it comes from</h4>
<ul>
<li>Winning a round: 10, plus 5 per star, plus 5 for every 25 levels reached</li>
<li>Clearing a trouble: 2 each</li>
<li>Speaking a name: 25 - the richest single moment in the game</li>
<li>The daily quest: 15</li>
<li>Finishing the prologue: 60</li>
<li>Bought outright, from 200 for $1.99</li>
</ul>
</div>
<div>
<h4>Where it goes</h4>
<ul>
<li>A breeze: ${D.toolPrice.swap}</li>
<li>A wish: ${D.toolPrice.wild}</li>
<li>+5 moves on a lost round: 25</li>
<li>Retry a round: 35</li>
<li>A glowing letter in a ceremony: 15</li>
<li>Bringing a friend anyway: from 90, more for harder names</li>
</ul>
</div>
</div>
<div class="why"><b>Prices scale, slowly.</b> Every grace costs half as much again every 40 levels, capped at
   four times the base. A flat price was a real decision at level 3 and pocket change at level 200.</div>
<div class="why"><b>The first one is on the wood.</b> One free save of each kind per level, so a near miss
   never costs anything and the <i>second</i> is where the choice starts.</div>
</section>

<section id="tutorial">
<h2>12 &middot; The prologue</h2>
<p class="lead">${D.consts.PROLOGUE_END} scripted rounds. It is the most carefully built part of the game and
   still the weakest.</p>
<ol class="steps">
<li><b>The drop.</b> This is your letter, this is the next one, tap a column - and you can also hold and
    slide. Then spell ONE, then TEN, and watch the word pause and bloom by itself.</li>
<li><b>The breeze.</b> Three beats, deliberately separated: how you earn one, how you spend one, and the one
    catch. The board is locked to a single legal swap. If a player fumbles it three times the game steps in
    and helps, but not before - the first two attempts are theirs.</li>
<li><b>The wish and the hold.</b> Spell TEN again, then tap HOLD and keep the letters instead of letting them
    bloom. Then a wish, with every letter blanked except the one you need.</li>
<li><b>A name.</b> The idea of a naming ceremony is explained <i>before</i> the round starts rather than after
    it, and then you spell CAT and the cat wakes.</li>
<li><b>The friends.</b> Where they stand, what the pips mean, and the Book.</li>
</ol>
<div class="warn"><b>What playtesters actually did.</b> One read everything and was frustrated when messages
   vanished before he finished. One skipped it entirely and was then shown the same cards again mid-game. One
   read nothing at all and hammered the breeze button. Those three sessions drove most of the changes in the
   next section.</div>
</section>

<section id="notify">
<h2>13 &middot; One voice</h2>
<p class="lead">Every message in the game comes out of a single channel, and it only ever says one thing at a
   time.</p>
<div class="shots">
  ${shot("09-note","A message that waits","It owns the middle of the board, dims what is behind it, and stays until you tap. Anything else queued behind it waits its turn.")}
  ${shot("16-fullparty","A card that teaches","Bigger moments get a card rather than a line. This one appears the first time your party is full.")}
</div>
<p>There are two registers and one rule.</p>
<ul>
<li><b>It waits for you.</b> First time only. It takes the middle, dims the board behind it, and does not
    leave until you tap.</li>
<li><b>It steps aside.</b> Everything after that. A quiet line at the top that leaves on its own.</li>
<li><b>The rule:</b> if you have been told something once, you have been told. A message never repeats itself
    in its loud form.</li>
</ul>
<div class="why"><b>Why this was rebuilt.</b> There used to be four separate surfaces that could all speak at
   once, with four separate timers and no knowledge of each other. Players lost messages behind other
   messages, and one tester described being talked over.</div>
</section>

<section id="log">
<h2>14 &middot; What we changed, and why</h2>
<p class="lead">Recent history, so you know which ground has been walked already.</p>
<div class="log">
<div class="item"><h5>The middle of the board was eating presses</h5>
<p>An invisible message box kept its click-catching after being dismissed, and sat across the centre of the
   play area. Presses that landed in it did nothing. Measured: 3 of 56 cells dead, and the size of the dead
   zone depended on how long the last message was, which is why it felt random rather than positional. It had
   been swallowing ordinary taps for as long as the message system had existed.</p></div>
<div class="item"><h5>The tile in your hand became the tile that lands</h5>
<p>Previously the held tile was destroyed at your fingertip and an unrelated new one was spawned above the
   column. It also did not match a board tile: wrong palette in all ${D.biomes.length} countries, ten percent
   too large, and the wrong glyph for an acorn.</p></div>
<div class="item"><h5>The cat stopped lying</h5>
<p>Its card promised it would pat a letter into <i>one that fits</i>, but nothing checked whether the result
   fitted anything. It now searches for a letter that completes a word and only falls back to a plain bonus if
   there is genuinely nothing.</p></div>
<div class="item"><h5>Twelve friends had been starving</h5>
<p>One operator: the game credited "a word was made" only on words of exactly three letters, so every longer
   word counted for nothing. Twelve of the fifty friends listen for that event. The reported symptom was that
   the middle game felt like a grind.</p></div>
<div class="item"><h5>The breeze became a mode</h5>
<p>Arming it used to change a small pill and nothing else. Now the board itself answers: tiles you may trade
   stir gently, tiles you may not go still.</p></div>
<div class="item"><h5>Celebration had been invisible</h5>
<p>Every painted country was quietly covering the win effects. On all fifteen.</p></div>
<div class="item"><h5>Two menu items had never worked</h5>
<p>They wrote to elements that had been deleted, so they threw on every tap. One of them was Restart. Caught
   in a tester's telemetry.</p></div>
<div class="item"><h5>No em-dashes, anywhere</h5>
<p>Two playtesters independently worked out the tutorial was machine-written, and the tell was the long dash.
   Every one was replaced with a plain hyphen and it is now a hard rule for all copy.</p></div>
</div>
</section>

<section id="open">
<h2>15 &middot; Still open</h2>
<p class="lead">Known, measured where possible, and not yet fixed. This is the most useful page in the
   document.</p>

<div class="warn"><b>The level 6 cliff.</b> The first unaided level after the prologue. One tester failed it
   three times, another twice, and both stopped playing. Nothing has been done about it yet. This is the
   single highest-stakes problem in the game.</div>

<div class="warn"><b>Obstacle contrast.</b> Measured against the painting behind them: an ordinary letter tile
   scores 4.6:1, a bramble 1.26:1 and a branch 1.20:1. The two most common early obstacles are close to
   invisible. A full audit across all ${D.biomes.length} countries has not been done.</div>

<div class="warn"><b>A tap during resolution says nothing.</b> The press is ignored, correctly, but with no
   feedback of any kind.</div>

<div class="warn"><b>The tap flash.</b> A very quick tap shows the tile for about 40ms at 84% opacity, part
   way through its appearing animation, and then it is gone. Less jarring since the tile now continues into
   the fall, but not measured on a real device.</div>

<div class="warn"><b>Losing everything takes 1.7 seconds.</b> A tester wiped a level 15 save with eight
   friends in it, by accident, in under two seconds. The confirmation is not doing its job.</div>

<div class="warn"><b>Junk in the dictionary.</b> HEIL, SHES, PAC, MAE, ALA and LOO are all playable. In a game
   this gentle, some of those are worse than others.</div>

<div class="warn"><b>Pets arrive too fast in the first twenty levels.</b> Improved, not solved, and
   deliberately parked.</div>

<h3>If you want somewhere to start</h3>
<p>The level 6 cliff is the one that costs us players, and it is measurable: we have telemetry that can show
   exactly where people stop. The tutorial is the one with the clearest brief and the most evidence already
   gathered. Obstacle contrast is the one where the answer is most likely to be simply <i>correct</i> rather
   than a matter of taste, and it is already half measured.</p>
</section>

</main>
</div>

<footer>
Hushwood &middot; generated from the game's own data and live captures &middot; every table here is pulled from
the build, so it cannot drift from what ships.
</footer>

<div id="lb"><img alt=""><div class="cap"></div></div>
<script>
(function(){
  var lb=document.getElementById("lb"), im=lb.querySelector("img"), cap=lb.querySelector(".cap");
  document.addEventListener("click", function(e){
    var t=e.target;
    if(t.tagName==="IMG" && t.closest(".phone")){
      im.src=t.src;
      var f=t.closest("figure"); cap.textContent=f? f.querySelector("b").textContent : "";
      lb.classList.add("on");
    } else if(lb.classList.contains("on")) lb.classList.remove("on");
  });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape") lb.classList.remove("on"); });
})();
</script>
</body></html>`;

fs.mkdirSync(require("path").join(__dirname,"..","..") + "/ux", { recursive: true });
fs.writeFileSync(OUT, html);
const mb = (Buffer.byteLength(html) / 1048576).toFixed(2);
const dashes = (html.match(/\u2014/g) || []).length;
console.log("wrote " + OUT);
console.log("  " + mb + " MB   pets:" + D.pets.length + "  troubles:" + Object.keys(D.trouble).length
  + "  gates:" + Object.keys(D.gates).length + "  em-dashes:" + dashes);
