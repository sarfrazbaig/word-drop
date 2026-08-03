/* @module  tiles  -  making, moving and destroying tile elements */
const $ = id=>document.getElementById(id);
const boardEl = $("board");
boardEl.style.width = (COLS*STEP-GAP)+"px";
boardEl.style.height = (ROWS*STEP-GAP)+"px";
function xy(r,c){ return "translate("+(c*STEP)+"px,"+(r*STEP)+"px)"; }
function tileFace(t){
  if(t.kind==="bomb") return "🌰";              // acorn
  if(t.kind==="wild") return "★";              // the TEXT star - it takes our silver, emoji won't
  // the CSS renders these - rock, tangle, deadwood, fungus, reed, mud, crystal and scree
  if(["stone","bramble","branch","spore","reed","mire","crystal","scree"].includes(t.kind)) return "";
  if(t.kind==="current") return "🌀";
  if(t.kind==="wind") return "🌬️";
  if(t.kind==="crate") return "🎁";
  if(t.kind==="root") return "🪵";
  if(t.kind==="shroud") return "🌑";
  if(t.kind==="pest") return "🐛";
  if(t.kind==="mist") return "?";               // the letter keeps its secret until the mist lifts
  return t.letter.toUpperCase()+"<small>"+VAL[t.letter]+"</small>"; // ice & frost show the letter - you can see what to free
}
function makeTileEl(t){
  const outer=document.createElement("div");
  outer.className="tw";
  outer.style.width=CELL+"px"; outer.style.height=CELL+"px";
  const el=document.createElement("div");
  el.className="tile "+(t.kind!=="normal"?t.kind:"");
  el.style.fontSize="20px";
  el.style.transform="rotate("+(Math.random()*2.6-1.3).toFixed(2)+"deg)";
  el.innerHTML = tileFace(t);
  outer.appendChild(el);
  boardEl.appendChild(outer);
  return {outer, inner:el};
}
/* THESE BREAK WORDS APART. Anything the wood describes as cleared FROM BESIDE belongs
   here: it is a wall, not a letter. branch, spore, reed, mire, crystal and scree were all
   missing - and because the seeder only swaps t.kind, each of them kept the letter it was
   made from. A branch reading "x" sat silently inside any word crossing it, and
   cellsToPattern rendered it as nothing, so [branch]+l+o matched the pattern "lo" and the
   branch cleared as part of a word it was never supposed to join.
   current and wind stay OUT: they move letters around, they are not walls. */
const NONWORD = new Set(["bomb","stone","crate","ice","frost","mist","bramble","root","shroud","pest",
                         "branch","spore","reed","mire","crystal","scree"]);
function placeTile(t,r,c,instant){
  t.r=r; t.c=c;
  if(instant){ t.el.style.transition="none"; t.el.style.transform=xy(r,c); void t.el.offsetWidth; t.el.style.transition=""; }
  else t.el.style.transform=xy(r,c);
}
function newTile(letter,kind,r,c,instant){
  const t={ id:"d"+(++S.seq), letter, kind:kind||"normal", r, c };
  const m=makeTileEl(t);
  t.el=m.outer; t.inner=m.inner;
  placeTile(t,r,c,instant!==false);
  S.tiles[t.id]=t; S.board[r][c]=t;
  return t;
}
function removeTile(t){
  delete S.tiles[t.id];
  if(S.board[t.r] && S.board[t.r][t.c]===t) S.board[t.r][t.c]=null;
  t.inner.classList.add("popout");
  UI.shards(t.r, t.c, t.kind==="gold"?"#f0a92e":t.kind==="wild"?"#9a67ff":"#caa96b");
  setTimeout(()=>t.el.remove(), 320);
}
function boardFull(){ for(let c=0;c<COLS;c++) if(!S.board[0][c]) return false; return true; }

/* =================== WORD SCAN =================== */
