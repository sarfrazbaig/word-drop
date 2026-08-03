/* @module  words  -  reading rows and columns and deciding what is a word. PURE - test it first */
/* a word that reads the same both ways. Kept here with the other pure reading rules
   rather than beside the bat, because it is a fact about a word, not about a creature -
   the mirror sign, the bat's double and anything later that cares about shape all ask
   this same question. Two letters do not count: "aa" is not a delight. */
function isMirror(w){
  if(!w || w.length<3) return false;
  for(let i=0,j=w.length-1;i<j;i++,j--) if(w[i]!==w[j]) return false;
  return true;
}
/* ══ WORDS THAT MEAN SOMETHING ══
   The first two tastes that are about what a word MEANS rather than how it is shaped, and
   the reason the deer and the heron exist. Both lists are small on purpose: a family that
   matches half the dictionary is not a delight, it is a tax. Every entry was checked to be
   in the shipped word list, and measured at 0.03 and 0.05 a round respectively - which is
   precisely why each ships with a gardener (pig roots food up, robin brings the weather).
   Authored, not generated: "food" means something a creature in this wood would eat. */
const FOOD = new Set(("grass leaf moss seed berry honey egg root bud nut pea corn plum fig "
  + "date bean rice oat herb sage mint kale yam jam milk bread cake acorn").split(" "));
const WEATHER = new Set(("rain snow mist wind moon dusk frost sun star cloud storm dew ice "
  + "hail fog dawn night sky sea river stone hill cave tree").split(" "));
/* 🦨 THE WORDS THE WOOD REFUSES. build.js blocks these from COMMON so they never clear
   with chimes and confetti - and that stays true. The skunk simply COUNTS them anyway,
   paying out of its own pocket while the wood pretends not to laugh. Kid-grade rude,
   authored, tiny: this is a giggle, not a loophole. */
const SKUNK_WORDS = new Set("poo poop pee fart butt turd damn crap hell piss".split(" "));
/* ══ THE GRATITUDE LAYER ══ spell an on-duty friend's own name and it thanks you; a few
   friends also answer to a signature word. Hidden until found - the Book writes it down
   after. Some thanks are purely cosmetic on purpose: this layer is love, not a lever. */
const SIG_OF = { buzz:"bee", hoot:"owl", grass:"deer", dig:"dog", nap:"cat", hop:"frog",
  howl:"wolf", leap:"hare", moo:"bison", egg:"goose", web:"spider", mud:"pig" };
/* ══ KINSHIP ══ a loved early friend can be kept alive by its elder: seat BOTH and the
   elder wakes the youngster's wild side. Two seats spent is the price - coverage, the
   same currency the pipeline runs on - so it reaches viable, never optimal. */
const KIN = { dog:"wolf", cat:"owl", snail:"turtle" };
function kinBeside(w){ return !!(KIN[w] && UI.equipped().some(g=>g && g.w===KIN[w])); }
/* a word with a shorter real word hiding inside it. Measured at 0.46 a round in real play,
   which makes it a payer rather than the curiosity it was assumed to be. */
function nestedWord(w){
  if(!w || w.length<4) return null;
  for(let L=w.length-1; L>=MIN_LEN; L--)
    for(let i=0; i+L<=w.length; i++){
      const s=w.slice(i,i+L);
      if(s!==w && COMMON.has(s)) return s;
    }
  return null;
}
/* THE WORD YOU ALMOST MADE. Returns the real word a string is one letter away from, or null.
   556 three-letter words exist and 10,361 strings sit one letter off them, so anything built
   on this must be rationed - once a round, never a passive. Kept here with the other pure
   reading rules so it can be tested without a board. */
function nearWord(s){
  if(!s || s.length<MIN_LEN) return null;
  const A="abcdefghijklmnopqrstuvwxyz";
  for(let i=0;i<s.length;i++)
    for(const c of A){
      if(c===s[i]) continue;
      const t=s.slice(0,i)+c+s.slice(i+1);
      if(COMMON.has(t)) return t;
    }
  return null;
}
function cellsToPattern(cells){ return cells.map(t=>(t.kind==="wild"||t.kind==="mire"||t.kind==="reed")?".":t.letter).join(""); }
function matchPattern(pat){
  if(!pat.includes(".")) return COMMON.has(pat) ? pat : null;
  const list = BY_LEN[pat.length]||[], re = new RegExp("^"+pat+"$");
  for(const w of list) if(re.test(w)) return w;
  return null;
}
function scanLine(cellsLine){
  const found=[]; let seg=[];
  /* 🐷 THE WALLOW - mud takes any shape. While the pig is on duty, a mire tile JOINS the
     line as a letterless wild instead of cutting it, so words run straight through the
     marsh - and the mire they borrow clears with them (credited in the scoring loop).
     The thing that blocked the column becomes the letter the column needed. */
  const wallow = typeof Game!=="undefined" && S && Game.hasPassive && Game.hasPassive("wallow");
  /* 🦩 the heron's stillness lets words pass through reeds; 🦭 the seal's whiskers read
     the letters mist is hiding. Same door as the wallow: the obstacle joins the line. */
  const reedP = typeof Game!=="undefined" && S && Game.hasPassive && Game.hasPassive("reedPass");
  const sealW = typeof Game!=="undefined" && S && Game.hasPassive && Game.hasPassive("sealWhisker");
  /* 🐭 THE NIBBLE - a near-word loses its one spare letter and counts. Rationed to once a
     round per nearWord()'s own rule; the licence is spent only when a nibbled word actually
     CLEARS (see resolve), so the hint may show the play without consuming it. */
  const nibble = typeof Game!=="undefined" && S && !S.mouseUsed && Game.hasPassive && Game.hasPassive("nibble");
  /* 🦨 the skunk counts what the wood refuses; 🦉 the owl forgives one wrong letter.
     Both licences ration to once a round, and both are spent only when their word CLEARS. */
  const skunk = typeof Game!=="undefined" && S && !S.skunkUsed && Game.hasPassive && Game.hasPassive("skunkCount");
  const owl   = typeof Game!=="undefined" && S && !S.owlUsed   && Game.hasPassive && Game.hasPassive("owlForgive");
  const flush=()=>{
    let pos=0;
    while(pos <= seg.length-MIN_LEN){
      let hit=null;
      for(let L=Math.min(seg.length-pos,8); L>=MIN_LEN; L--){
        const cells=seg.slice(pos,pos+L);
        if(cells.every(t=>t.kind==="wild"||t.kind==="mire")) continue;
        const w=matchPattern(cellsToPattern(cells));
        if(w){ hit={cells,word:w}; break; }
      }
      if(!hit && nibble){
        outer:
        for(let L=Math.min(seg.length-pos,8); L>=MIN_LEN+1; L--){
          const cells=seg.slice(pos,pos+L);
          for(let k=0;k<cells.length;k++){
            const rest=cells.filter((_,i)=>i!==k);
            if(rest.every(t=>t.kind==="wild"||t.kind==="mire")) continue;
            const w=matchPattern(cellsToPattern(rest));
            if(w){ hit={cells, word:w, nibbled:cells[k]}; break outer; }
          }
        }
      }
      // 🦨 a refused word still counts while the skunk is on duty - exact letters only
      if(!hit && skunk){
        for(let L=Math.min(seg.length-pos,8); L>=MIN_LEN; L--){
          const cells=seg.slice(pos,pos+L);
          if(cells.some(t=>t.kind==="wild"||t.kind==="mire")) continue;
          const p=cells.map(t=>t.letter).join("");
          if(SKUNK_WORDS.has(p)){ hit={cells, word:p, skunked:true}; break; }
        }
      }
      // 🦉 one letter wrong, and the owl knows what you meant
      if(!hit && owl){
        outer2:
        for(let L=Math.min(seg.length-pos,8); L>=MIN_LEN; L--){
          const cells=seg.slice(pos,pos+L);
          if(cells.some(t=>t.kind==="wild"||t.kind==="mire")) continue;
          for(let k=0;k<cells.length;k++){
            const pat=cells.map((t,i)=>i===k?".":t.letter).join("");
            const w=matchPattern(pat);
            if(w && w!==cells.map(t=>t.letter).join("")){
              hit={cells, word:w, forgiven:cells[k]}; break outer2; }
          }
        }
      }
      if(hit){ found.push(hit); pos += hit.cells.length; }
      else pos++;
    }
    seg=[];
  };
  cellsLine.forEach(t=>{ if(t && (!NONWORD.has(t.kind) || (t.kind==="mire" && wallow)
    || (t.kind==="reed" && reedP) || (t.kind==="mist" && sealW))) seg.push(t); else flush(); });
  flush();
  return found;
}
/* Reading rules. Horizontal is left→right ONLY - a word reading backwards across a row
   is an illegible surprise, not a reward. But COLUMNS read BOTH ways, because letters
   stack upward as they fall: dropping C, A, T builds "CAT" bottom-up, and demanding the
   player plan it in reverse was the single biggest reason nobody made long words. */
function findWords(){
  const found=[], seen=new Set();
  const push=h=>{
    const key=h.cells.map(t=>t.id).sort().join(",");
    if(seen.has(key)) return;
    seen.add(key); found.push(h);
  };
  for(let r=0;r<ROWS;r++) scanLine(S.board[r]).forEach(h=>{ h.dir="row"; push(h); });
  /* 🦇 AND THEN THERE IS THE BAT. The rule directly above - rows read left to right and
     never back - is a good rule, and it stays for everyone except the one creature whose
     card has always said otherwise. While the bat is on duty the wood reads both ways.

     ══ WHY THIS IS A PASSIVE AND NOT A POWER ══
     It was written first as an act: the bat wakes, reads the bottom row backwards, takes
     whatever it finds. It worked perfectly and it was worthless. Measured over 380 drops,
     a backwards-only word existed in the bottom row on 5.5% of them and anywhere on the
     board on 7.6% - so a friend that fires about 1.5 times a round would have paid off
     roughly once every twelve rounds. That is not a power, it is a rumour, and it would
     have been the second time in a row this creature's card described something a player
     could never see happening.
     Reading is reactive: it can only hope the board already did something. On duty and
     always-on it is the opposite - the rule changes while you are still choosing where to
     drop, so you can go looking for it, which is the only version of this that changes how
     anybody plays. The 7.6% still arrives on its own as a small steady gift; the rest is
     the player deliberately spelling backwards, which nothing else in the game rewards.
     push() de-dupes on cell ids, so a palindrome read both ways is one word and pays once. */
  if(S.batReads || (Game.hasPassive && Game.hasPassive("readsBoth"))){
    for(let r=0;r<ROWS;r++)
      scanLine([...S.board[r]].reverse()).forEach(h=>{ h.dir="rowback"; push(h); });
  }
  for(let c=0;c<COLS;c++){
    const col=S.board.map(row=>row[c]);
    scanLine(col).forEach(h=>{ h.dir="down"; push(h); });                 // read down the column
    scanLine([...col].reverse()).forEach(h=>{ h.dir="up"; push(h); });    // …and up it, the way you stacked it
  }
  return found;
}
function wouldClear(piece, c){
  if(piece.kind==="bomb") return null;
  if(S.board[0][c]) return null;
  /* ⚠️ A REED STANDS IN THE WHOLE COLUMN AND NOTHING DROPS PAST IT. drop() has always
     refused such a column; this function did not know reeds existed - and it is the
     foundation of helpfulByLength(), which is what the deck's MERCY, the hints and every
     "is a word available" check are built on. So in reed country the game would hand you a
     letter whose only home was behind a reed, point at a column you cannot use, and count
     itself as having rescued you.
     Found by autopsy: a round at the Running River scored ZERO from thirty moves while the
     board reported eleven letters that could complete a word. Reeds live in biomes 4-7 -
     the Pond, the Marsh, the River and the Falls - which are the four countries where
     measured capacity collapsed. */
  if(S.board.some(row => row[c] && row[c].kind === "reed")) return null;
  let land=ROWS-1; while(land>=0 && S.board[land][c]) land--;
  const fake={ id:"fake", letter:piece.kind==="wild"?"?":piece.letter, kind:piece.kind==="wild"?"wild":"normal", r:land, c };
  S.board[land][c]=fake;
  const col=S.board.map(row=>row[c]);
  const words=[...scanLine(S.board[land]), ...scanLine(col), ...scanLine([...col].reverse())];
  S.board[land][c]=null;
  let best=null;
  for(const w of words) if(w.cells.includes(fake) && (!best || w.word.length>best.length)) best=w.word;
  return best;
}
function helpfulByLength(){
  const best={};
  for(let c=0;c<COLS;c++){
    if(S.board[0][c]) continue;
    for(const l of "abcdefghijklmnopqrstuvwxyz"){
      const w=wouldClear({letter:l,kind:"normal"},c);
      if(w && w.length>(best[l]||0)) best[l]=w.length;
    }
  }
  return best;
}
const PRE=(()=>{ const s=new Set();
  COMMON.forEach(w=>{ if(w.length>=4) for(let i=2;i<w.length;i++) s.add(w.slice(0,i)); });
  return s; })();
function builderLetters(){
  const out=new Set();
  for(let c=0;c<COLS;c++){
    if(S.board[0][c]) continue;
    let land=ROWS-1; while(land>=0&&S.board[land][c]) land--;
    let below="";
    for(let r=land+1;r<Math.min(ROWS,land+4);r++){ const t=S.board[r][c]; if(!t||t.kind!=="normal"&&t.kind!=="gold") break; below+=t.letter; }
    let left="";
    for(let cc=c-1;cc>=0&&c-cc<=3;cc--){ const t=S.board[land][cc]; if(!t||t.kind!=="normal"&&t.kind!=="gold") break; left=t.letter+left; }
    for(const l of "abcdefghijklmnopqrstuvwxyz"){
      if(below && PRE.has((l+below).slice(0,4))) out.add(l);
      if(left && PRE.has(left+l)) out.add(l);
    }
  }
  return [...out];
}
function riggedLetter(){
  /* A KIND but not trivial deck. Words should form often - this is cozy, not a crossword.
     Generosity is highest in the early levels and eases as the player finds their feet. */
  if(!S) return drawLetter();
  // generous much longer: the audit showed honest players starving from L4 on
  // generosity stays high far longer - the deck should keep offering you good letters,
  // not quietly starve you at level 12 the way playtesters experienced.
  let gen = S.level<=8 ? 1 : S.level<=14 ? 0.8 : S.level<=22 ? 0.62 : 0.5;
  if(Game && Game.hasPassive && Game.hasPassive("helpDeck")) gen=Math.min(1, gen+0.25); // 📐 Tiny Planner
  /* THE SPAM LIVED HERE. These pools are usually tiny - the letters that finish a long word
     are often a single letter - and taking one at ~90% meant the deck locked onto the same
     two or three letters for as long as the board held still. Measured on a static board it
     dealt three letters for 94% of 400 draws, with runs of nine identical tiles. A player
     stuck on a level, which is exactly when the board stops changing, got the worst of it.

     Two changes. The narrower the choice, the less hard we steer - a pool of one or two is
     not guidance, it is a rut. And whatever pool we do use, letters dealt in the last few
     drops go to the back of the queue. */
  const pick=(pool, p)=>{
    if(!pool.length) return null;
    const narrow = pool.length<=1 ? 0.35 : pool.length<=2 ? 0.55 : pool.length<=3 ? 0.78 : 1;
    return Math.random() < p*narrow ? rand(notRecent(pool)) : null;
  };
  const best=helpfulByLength();
  // long words FIRST and most often - 3-letter pops got boring; 4+ is where the joy is
  const longs=Object.keys(best).filter(l=>best[l]>=4);
  return pick(longs, 0.66+0.24*gen)                    // finish a long word
      ?? pick(builderLetters(), 0.56+0.24*gen)         // grow a fragment toward a long word
      ?? pick(Object.keys(best), 0.30+0.30*gen)        // any completion at all
      ?? drawLetter();
}

