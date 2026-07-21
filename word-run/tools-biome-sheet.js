/* Builds a contact sheet of all fifteen countries from the REAL shipped CSS, so the art
   can be judged side by side instead of one board at a time. Rules are lifted verbatim
   out of the built game and only their selectors are rewritten (#app -> .app etc), so
   what this page shows is what the game draws. */
const fs=require("fs");
const SRC="E:/Game Research/word-run/word-drop.html";
const OUT="E:/Game Research/word-run/biome-sheet.html";
const src=fs.readFileSync(SRC,"utf8");

/* pull one CSS rule out of the game by its selector text */
const grab=(sel)=>{
  const i=src.indexOf(sel);
  if(i<0) return "";
  const open=src.indexOf("{", i);
  let depth=0, j=open;
  for(; j<src.length; j++){ if(src[j]==="{") depth++; else if(src[j]==="}"){ depth--; if(!depth) break; } }
  return src.slice(i, j+1);
};

const wanted=[
  ":root{", "#board{", "#board::before{", "#board::after{",
  '#app[class*="bio"] #board{', "#biodecor::before{", "#biodecor span.edge{",
  "#biodecor{", "#biodecor span{", "#hushmist{",
  "#app.bio0, #app.bio1, #app.bio2{",
  "#app.bio0 #board::after, #app.bio1 #board::after, #app.bio2 #board::after{",
  "#app.bio10{", "#app.bio12, #app.bio13, #app.bio14{",
  "#app.bio11 #biodecor::before, #app.bio12 #biodecor::before,",
  "#app.bio8 #biodecor::before, #app.bio9 #biodecor::before{",
  "#app.bio8 #board::after, #app.bio9 #board::after{",
  "#app.bio10 #board::after{",
  "@keyframes moonglow{", "@keyframes sunglow{",
];
let css = wanted.map(grab).filter(Boolean).join("\n");
for(let b=0;b<15;b++) css += "\n" + grab("#app.bio"+b+"{ ");
// the decor animations
["deco-twinkle","deco-twinkle2","deco-bob","deco-sway","deco-fall","deco-fall2"].forEach(a=>{
  css += "\n" + grab("@keyframes "+a+"{");
  css += "\n" + grab("."+a+"{");
});

/* rewrite ids to classes so fifteen can live on one page */
css = css.replace(/#app/g,".app").replace(/#board/g,".board")
         .replace(/#biodecor/g,".biodecor").replace(/#hushmist/g,".hushmist")
         .replace(/\.app\[class\*="bio"\]/g,'.app[class*="bio"]');

/* the names and the scenery straight out of the game */
const names=JSON.parse("["+src.match(/const BIOME_NAMES=\[([\s\S]*?)\];/)[1].replace(/\n/g,"")+"]");
const decorRaw=src.match(/const BIOME_DECOR=\[([\s\S]*?)\n\];/)[1];
const decor=new Function("return ["+decorRaw+"]")();

const cells=names.map((n,b)=>{
  const d=(decor[b]||[]).map(o=>
    `<span class="${o.a||""}" style="left:${o.x};top:${o.y};font-size:${Math.round(o.s*0.62)}px">${o.e}</span>`).join("");
  const tiles=Array.from({length:21},(_,i)=>`<i>${"ABCDEFGHIJKLMNOPQRSTU"[i]}</i>`).join("");
  return `<figure class="app bio${b}">
    <div class="board"><div class="biodecor">${d}</div><div class="hushmist"></div><div class="tiles">${tiles}</div></div>
    <figcaption><b>${b+1}</b> ${n}<small>L${b*20+1}–${b*20+20}</small></figcaption>
  </figure>`;
}).join("\n");

const page=`<title>Hushwood — all fifteen countries</title>
<style>
${css}
body{ background:#14121a; color:#e8e4ef; font:13px/1.4 system-ui,sans-serif; margin:0; padding:20px; }
h1{ font:600 20px/1.2 Georgia,serif; margin:0 0 4px; }
p.note{ color:#9a92ab; margin:0 0 18px; max-width:70ch; }
.grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
figure{ margin:0; }
.board{ position:relative; height:190px; border-radius:14px; overflow:hidden; }
.biodecor{ position:absolute; inset:0; overflow:hidden; border-radius:inherit; z-index:0; }
.biodecor span{ position:absolute; line-height:1; }
.tiles{ position:absolute; left:5%; right:5%; bottom:5%; display:grid; grid-template-columns:repeat(7,1fr);
  gap:3px; z-index:20; }
.tiles i{ font:700 10px/1 system-ui; font-style:normal; display:grid; place-items:center; aspect-ratio:1;
  border-radius:4px; background:var(--tile-face); color:var(--tile-ink);
  box-shadow:0 2px 0 var(--tile-edge), inset 0 1px 0 rgba(255,255,255,.7); }
figcaption{ padding:6px 2px; font-size:11.5px; color:#c7c0d6; }
figcaption b{ color:#8b83a3; margin-right:5px; }
figcaption small{ display:block; color:#7b7290; font-size:10px; }
</style>
<h1>Hushwood — all fifteen countries</h1>
<p class="note">Lifted from the shipped CSS: same sky, horizon glow, mid-ground, frame, edge scenery, hush and tile faces the game draws. Judged side by side rather than one at a time.</p>
<div class="grid">
${cells}
</div>`;

fs.writeFileSync(OUT,page);
console.log("contact sheet written — "+names.length+" countries, "+css.length+" chars of real CSS");
