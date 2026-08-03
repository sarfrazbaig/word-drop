/* @module  round  -  S - everything true only while a round is being played */
function newState(level){
  return { level, milestone:isMilestone(level), board:Array.from({length:ROWS},()=>Array(COLS).fill(null)),
    tiles:{}, seq:0, levelScore:0, target:TARGET(level),
    // a gate hands you a shorter round; everything else about the level is unchanged
    movesLeft:(gateAt(level)&&gateAt(level).moves)||MOVES(level),
    drops:0, chain:1, maxChain:1, cascadeMax:1, playerMove:false, guide:null,
    goal:{t:"hush",need:0,have:0},
    deadDrops:0, nudging:false, idleNudges:0, lastAction:Date.now(), clearedThisDrop:false,
    usingBreeze:false, usingPluck:false, swapSel:null, revived:false, won:false, newGrove:[], tutorWord:null,
    _noWishGrant:false, _noBreezeGrant:false,   // a tool never pays for itself - see resolve()
    petCharge:0, petTurn:0, petReady:false, petActing:false, petActs:0, charm:0,
    wake:{}, _woke:[],          // how close each friend is to stirring, and who just did
    petActor:null,              // WHICH friend is mid-act, so its own word cannot feed it
    _actedThisDrop:[],          // one drop, one act each - the brake on a friend-fed runaway
    said:[],                    // every word this round, in order: the round's memory
    sigs:{},                    // how many of each sign this round - what a courtship reads
    dealtV:0, dealtC:0,         // vowels and consonants dealt, for the deck's governor
    wordsMade:0, flatB:0, splash:0, web:0, chainBoost:false, freePluck:false, next2:null, stepN:0,
    bestWord:"", bestWordPts:0, cur:null, next:null,
    over:false, busy:true, hoverCol:3, killers:{} };
}
function rand(a){ return a[Math.floor(Math.random()*a.length)]; }
function drawLetter(){
  let letters=0, vowels=0;
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const t=S.board[r][c]; if(t&&t.kind==="normal"){ letters++; if(VOWELS.has(t.letter)) vowels++; } }
  if(letters>4 && vowels/letters<0.25 && Math.random()<0.5) return rand(["a","e","i","o"]);
  if(Game && Game.hasPassive && Game.hasPassive("vowelDeck") && Math.random()<0.3) return rand(["a","e","i","o","u"]); // 🎶 Morning Chorus
  return FREQ[Math.floor(Math.random()*FREQ.length)];
}
function tutorAlive(){ // is the guest still spellable? checks the LONGEST surviving prefix
  const w=S.tutorWord; if(!w) return true;
  if(P.level<=6){ // school: the full head + finisher must be one drop away
    const last=w.slice(-1);
    for(let c=0;c<COLS;c++){ if(wouldClear({letter:last,kind:"normal"},c)===w) return true; }
    return false;
  }
  const K=1;   // the single granted foothold - the keeper only steps in when it's gone
  // any contiguous prefix run of at least the anchor, with room for the whole name,
  // counts as alive - including runs the player has grown themselves
  for(let j=w.length-1;j>=K;j--){
    const pre=w.slice(0,j);
    for(let r=0;r<ROWS;r++) for(let c=0;c+w.length-1<COLS;c++){
      let ok=true;
      for(let i=0;i<j;i++){ const t=S.board[r][c+i];
        if(!t || t.letter!==pre[i] || NONWORD.has(t.kind)){ ok=false; break; } }
      if(ok) return true;
    }
  }
  return false;
}
function tutorPrefill(word, dug){ // stage the guest's ANCHOR: level ground + a foothold of letters
  // School (levels 1-6) lays out everything but the last letter - idiot-proof.
  // After school the ceremony stages only an ANCHOR (1-3 letters): the player must
  // figure the name and BUILD the rest, holding the little words that form along the
  // way. If they crack it, glory; if not, the letdown - and one day, the hint shop.
  // post-school the wood grants ONE letter - the name's first - and nothing more
  const K = P.level<=6 ? word.length-1 : 1;
  const head=word.slice(0,K).split("");
  const L=word.length;                   // reserve room for the WHOLE name to grow rightward
  const landAt=c=>{ let r=ROWS-1; while(r>=0 && S.board[r][c]) r--; return r; };
  // rank every start column by how much filler it needs to become level ground
  const starts=[];
  for(let c=0; c+L-1<COLS; c++){
    const ls=[]; for(let i=0;i<L;i++) ls.push(landAt(c+i));
    if(ls.some(r=>r<2)) continue;                       // stacks too tall here
    const target=Math.min(...ls);                       // align to the tallest stack's level
    starts.push({c, target, filler:ls.reduce((a,r)=>a+(r-target),0)});
  }
  starts.sort((a,b)=>a.filler-b.filler || Math.abs(2-a.c)-Math.abs(2-b.c));
  for(const s of starts){
    const added=[], headTiles=[];
    for(let i=0;i<L;i++){                               // raise short columns up to the target level
      let r=landAt(s.c+i);
      while(r>s.target){ added.push(newTile(drawLetter(),"normal",r,s.c+i)); r--; }
    }
    head.forEach((l,i)=>{ const t=newTile(l,"normal",s.target,s.c+i); added.push(t); headTiles.push(t); });
    // reject only ACCIDENTAL words - ones leaking outside the staged head. A word living
    // entirely INSIDE the head is fine and inert: "CHIC" contains "chi", and that single
    // fact made CHICK unstageable forever (the real cause of the jammed ceremony).
    // Authored-clears never fire on untouched tiles, so an inner word just sits there
    // until the completion letter turns it into the guest's own name.
    if(findWords().some(w=>!w.cells.every(t=>headTiles.includes(t)))){
      added.forEach(t=>removeTile(t)); continue;
    }
    return true;
  }
  if(dug) return false;   // dug once already - surrender this attempt, the next drop retries
  // OVERGROWN: no span can host the name, and with the ceremony contract a jammed
  // guest means a guaranteed loss (the chick sat unspellable for THREE levels in
  // simulation). So the keeper DIGS: pick the span with the fewest special tiles,
  // shave plain letters off its column tops until there's room, and stage again.
  // Only tops are taken - nothing mid-column, so no tile is ever left floating.
  let bestc=-1, bestSpec=1e9;
  for(let c=0; c+L-1<COLS; c++){
    let spec=0;
    for(let i=0;i<L;i++) for(let r=0;r<ROWS;r++){ const t=S.board[r][c+i]; if(t && t.kind!=="normal") spec++; }
    if(spec<bestSpec){ bestSpec=spec; bestc=c; }
  }
  if(bestc<0) return false;
  for(let i=0;i<L;i++){
    const c=bestc+i; let guard=0;
    while(guard++<ROWS && landAt(c)<2){
      let top=0; while(top<ROWS && !S.board[top][c]) top++;
      const t=S.board[top] && S.board[top][c];
      if(!t || t.kind!=="normal") break;    // a stone/ice roof - this column keeps it
      UI.shards(t.r,t.c,"#b9a8de"); removeTile(t);
    }
  }
  return tutorPrefill(word, true);
}
/* =================== FTUE - the school of the wood ===================
   "Consider users are dumb - they don't even know how to use the phone."
   One lesson per level, and the wrong action is IMPOSSIBLE, not just discouraged:
   L1 the drop (one letter, one legal column, no grace, nothing else to learn)
   L2 the breeze + the hurry-tap (guided swap makes a 4-letter word)
   L3 the hold (the grace waits for the 🌱 tap, then you grow the word)
   L4 normal play, with a whisper that a friend is coming
   L5 the CAT is a gift: ritual, Book of Names, powers - taught on a friend you own.
   Discovery-by-spelling starts at level 6 with DOG, the training wheels off. */
const FT = {
  _w:{}, _bits:[],
  wait(name){ return new Promise(res=>{ (FT._w[name]=FT._w[name]||[]).push(res); }); },
  signal(name,data){ const q=FT._w[name]; if(q && q.length){ FT._w[name]=[]; q.forEach(f=>f(data)); } },
  // some beats are genuinely the player's call - end them on whichever choice they make
  waitAny(...names){ return new Promise(res=>{ let done=false;
    names.forEach(n=>{ (FT._w[n]=FT._w[n]||[]).push(d=>{ if(!done){ done=true; res({sig:n,data:d}); } }); }); }); },
  bit(el){ FT._bits.push(el); return el; },                    // everything spawned, so cleanup can't miss
  cleanup(){ FT._w={}; FT._bits.forEach(e=>e.remove()); FT._bits=[];
    document.querySelectorAll(".ftue-scrim,.ftue-callout,.ftue-arrow,.ftue-note,.ftue-ring,.ftue-hand,.coach").forEach(e=>e.remove()); },
  appRect(){ return $("app").getBoundingClientRect(); },
  /* THE STAGE IS SCALED - MEASURE IN ITS OWN UNITS. fitApp() shrinks the fixed 396×800
     stage to fit the screen. getBoundingClientRect() answers in SCREEN pixels (already
     scaled), but any overlay we position lives INSIDE that scaled box, so writing those
     numbers straight into left/top makes the browser scale them a second time. On a
     desktop preview k is 1 and everything looks perfect; on a real phone the ring drifts
     off its button, and the further from the top-left corner, the worse the miss.
     box() converts a target back into stage coordinates so highlights land true. */
  scale(){ const r=FT.appRect(); return r.width ? r.width/396 : 1; },
  box(el){
    const k=FT.scale(), ar=FT.appRect(), r=el.getBoundingClientRect();
    return { left:(r.left-ar.left)/k, top:(r.top-ar.top)/k,
             right:(r.right-ar.left)/k, bottom:(r.bottom-ar.top)/k,
             width:r.width/k, height:r.height/k };
  },
  callout(el, html, side){ // a tap-through teaching bubble with an arrow at its target
    return new Promise(res=>{
      const t=typeof el==="string"?document.querySelector(el):el;
      // A MISSING TARGET MUST NOT HANG THE CLASS. getBoundingClientRect() on null throws
      // inside the await chain, which leaves S.guide set for the whole round - friends
      // stop waking, tools stop answering, and nothing on screen explains it. Skipping
      // one bubble is a far smaller failure than freezing the lesson around it.
      if(!t){ console.warn("[hushwood] callout target missing:", el); return res(); }
      const app=$("app"), r=FT.box(t);          // stage coordinates, not screen pixels
      const SW=396, SH=800;                     // the stage's own size - clamp against THIS
      const scrim=FT.bit(document.createElement("div")); scrim.className="ftue-scrim";
      const b=FT.bit(document.createElement("div")); b.className="ftue-callout";
      b.innerHTML=html+'<div class="ftue-tap">TAP TO CONTINUE</div>';
      app.appendChild(scrim); app.appendChild(b);
      const cx=r.left+r.width/2;
      b.style.left=Math.max(8,Math.min(cx-112, SW-232))+"px";
      // NEVER off the stage: if the asked side has no room, flip to the other one
      // (a "below" callout on the bottom tray was rendering half off-screen)
      let above = side!=="below";
      const bh=b.offsetHeight;
      if(!above && r.bottom+24+bh > SH-8) above=true;
      if(above && r.top-bh-24 < 8) above=false;
      b.style.top = above ? Math.max(8, r.top-bh-24)+"px"
        : Math.min(SH-bh-8, r.bottom+24)+"px";
      const arrow=FT.bit(document.createElement("div")); arrow.className="ftue-arrow";
      arrow.textContent = above ? "▼" : "▲";
      arrow.style.left=cx+"px";
      arrow.style.top = above ? (r.top-22)+"px" : (r.bottom+2)+"px";
      app.appendChild(arrow);
      Snd.tone(880,{dur:.09,type:"sine",gain:.05,verb:true});
      // the board reads this: a press that closes this bubble must not also spend a move
      // when the finger lifts, and the lift is an event this handler never sees.
      const done=e=>{ e.stopPropagation(); FT.lastDismiss=Date.now();
        scrim.remove(); b.remove(); arrow.remove(); res(); };
      scrim.addEventListener("pointerdown",done,{once:true});
      b.addEventListener("pointerdown",done,{once:true});
    });
  },
  async waitTip(kind){ // the tool page at lesson start: Alder tells it, and waits for the tap
    if(P.seenTip[kind]) return;                    // replays skip the reading
    P.seenTip[kind]=true; save();
    /* The tool teaching is an Alder Page now: story beat, gold game beat, one tap - and
       page() only returns once the player has closed it, so the lesson genuinely waits. */
    await new Promise(res=>{ if(!Alder.page(kind, {again:true, cb:res})) res(); });
    await wait(350);                               // one breath between the page and the lesson
  },
  note(html){ FT.clearNote(); const n=FT.bit(document.createElement("div")); n.className="ftue-note";
    n.innerHTML=html; boardEl.appendChild(n); FT._note=n; },  // on the board, clear of the HUD
  clearNote(){ if(FT._note){ FT._note.remove(); FT._note=null; } },
  /* THE FINGER POINTS AT THE PLACE, NOT AT THE SKY. It used to sit at the top of the
     board whatever the column held, so on a board with one gap near the floor it hung
     dangling in mid-air, five rows from anything. It finds the cell the tile will
     actually land in and hovers just above it - and the idle bob dips it into the empty
     slot, which is the whole point of pointing. */
  /* THE HAND DEMONSTRATES INSTEAD OF POINTING. It used to appear at its column and bob in
     place, which shows WHERE to drop but never HOW. Sliding it in from a column away performs
     the gesture in front of the player before they are asked to perform it. */
  handSlide(col){
    FT.hand(col);
    const h=FT._hand; if(!h) return;
    const from=(col>0?col-1:col+1);
    h.style.transition="none";
    h.style.left=(from*STEP+CELL/2)+"px";
    void h.offsetWidth;
    h.style.transition="left .62s cubic-bezier(.35,.05,.35,1)";
    h.style.left=(col*STEP+CELL/2)+"px";
    setTimeout(()=>{ if(h) h.style.transition=""; }, 700);
  },
  hand(col){ FT.clearHand(); if(col==null) return;
    const h=FT.bit(document.createElement("div")); h.className="coach ftue-hand"; h.textContent="👇";
    boardEl.appendChild(h);
    let land=ROWS-1; while(land>=0 && S.board[land] && S.board[land][col]) land--;
    if(land<0) land=0;                                   // a full column: sit at the top
    const hh=h.offsetHeight||58;
    h.style.left=(col*STEP+CELL/2)+"px";
    h.style.top=Math.max(2, land*STEP - hh + 4)+"px";    // fingertip at the cell's lip
    FT._hand=h; },
  clearHand(){ if(FT._hand){ FT._hand.remove(); FT._hand=null; } },
  /* ══ A BEAT IS READ, A NOTE IS GLANCED ══
     Notes are live instructions ("drop the T") - they belong beside the thing you are
     doing and they should vanish when you do it. But the lesson also used notes to
     EXPLAIN what just happened ("that 4-letter word earned you a star"), and those were
     posted a frame before the resolve that cleared them: the text appeared and was wiped
     inside the same animation. Unreadable, and the player is left with a reward they
     never learned they had.
     A beat holds the stage. It dims the board, says one thing, and waits for a tap -
     reading speed belongs to the reader. The safety timeout is generous rather than
     absent so a lesson can never strand someone who put the phone down mid-beat. */
  /* this appended itself the moment it was called, so the wish award for a four-letter
     GLOW drew across the round-clear card. A beat is blocking and must be read, which makes
     it the one thing that can never share the screen. */
  async beat(html, safetyMs){
    for(let i=0; i<40 && document.querySelector(".overlay.active"); i++) await new Promise(r=>setTimeout(r,100));
    return new Promise(res=>{
      FT.clearNote();
      const app=$("app");
      const scrim=FT.bit(document.createElement("div")); scrim.className="ftue-scrim";
      const b=FT.bit(document.createElement("div")); b.className="ftue-callout ftue-beat";
      b.innerHTML=html+'<div class="ftue-tap">TAP TO CONTINUE</div>';
      app.appendChild(scrim); app.appendChild(b);
      Snd.tone(880,{dur:.09,type:"sine",gain:.05,verb:true});
      let done=false;
      const finish=e=>{ if(done) return; done=true;
        if(e) e.stopPropagation();
        FT.lastDismiss=Date.now();          // the lift must not also spend a move
        clearTimeout(t); scrim.remove(); b.remove(); res(); };
      const t=setTimeout(finish, safetyMs||12000);
      scrim.addEventListener("pointerdown",finish,{once:true});
      b.addEventListener("pointerdown",finish,{once:true});
    });
  },
  ringCell(r,c){ const g=FT.bit(document.createElement("div")); g.className="ftue-ring";
    g.style.left=(c*STEP-4)+"px"; g.style.top=(r*STEP-4)+"px";
    g.style.width=(CELL+2)+"px"; g.style.height=(CELL+2)+"px";
    boardEl.appendChild(g); return g; },
  ringEl(el){ const r=FT.box(el);   // stage coordinates - lands true at any screen scale
    const g=FT.bit(document.createElement("div")); g.className="ftue-ring"; g.style.borderRadius="999px";
    g.style.left=(r.left-5)+"px"; g.style.top=(r.top-5)+"px";
    g.style.width=(r.width+10)+"px"; g.style.height=(r.height+10)+"px";  // an even ring, centred
    $("app").appendChild(g); return g; },
  deny(){ Snd.reject(); buzz(40);
    boardEl.classList.remove("shake"); void boardEl.offsetWidth; boardEl.classList.add("shake");
    setTimeout(()=>boardEl.classList.remove("shake"),420);
    if(FT._hand){ FT._hand.style.fontSize="52px"; setTimeout(()=>{ if(FT._hand) FT._hand.style.fontSize=""; },300); } },

  setup(level){ // stage the lesson boards - exact tiles, exact hands, nothing random
    if(level===1){
      Object.values(S.tiles).slice().forEach(t=>removeTile(t));
      newTile("o","normal",ROWS-1,2); newTile("n","normal",ROWS-1,3);
      S.cur={letter:"e",kind:"normal"}; S.next={letter:"s",kind:"normal"};
      S.guide={lesson:1, allowCol:4, noGrace:true};
    } else if(level===2){
      Object.values(S.tiles).slice().forEach(t=>removeTile(t));
      // left: GLOW scrambled (G O L W - one swap away); right: E N waiting for the T
      newTile("g","normal",ROWS-1,0); newTile("o","normal",ROWS-1,1);
      newTile("l","normal",ROWS-1,2); newTile("w","normal",ROWS-1,3);
      newTile("e","normal",ROWS-1,5); newTile("n","normal",ROWS-1,6);
      S.cur={letter:"t",kind:"normal"}; S.next=makePiece();
      S.guide={lesson:2, allowCol:4, noHold:true};  // lesson 2 waits for blooms - no hold to trap it
    } else if(level===3){
      Object.values(S.tiles).slice().forEach(t=>removeTile(t));
      newTile("t","normal",ROWS-1,2); newTile("e","normal",ROWS-1,3);
      S.cur={letter:"n",kind:"normal"}; S.next={letter:"s",kind:"normal"};
      S.guide={lesson:3, allowCol:4, mustHold:true};
      if(!(P.pow.swap>0)){ P.pow.swap=1; save(); } // the free-play stretch should have a breeze to try
    } else if(level===5 && P.grove.cat && Object.keys(P.metGrove).length<=1){
      // the cat was SPELLED at level 4 and wakes here - after its ritual (and the
      // Book's first page), this lesson shows where friends live: the shelf, the
      // locked seats, and the paw meter that calls them onto the board.
      // letFriendsAct: this lesson teaches the cat waking, so the cat must be allowed to
      // wake inside it. It scripts no board - no allowCol, no swapOnly - so there is no
      // right answer for a friend to spoil.
      // allowBreeze: the breeze guard exists because a curious tap could arm it mid-
      // lesson-2 and make "drop the T" impossible. Lesson five scripts no board and has
      // no right answer to spoil, so its tools stay in the player's hands.
      S.guide={lesson:5, deferred:true, letFriendsAct:true, allowBreeze:true}; // after the meet ritual
    }
  },

  run(force){ // called from beginLevel - drives the lesson as a linear script
    const g=S.guide; if(!g || g.running) return;
    // a deferred lesson waits for its cue (the meet ritual closing) - unless there is
    // no meet coming at all (a replayed level 5), in which case it starts right away
    if(g.deferred && !force && Object.keys(P.grove).some(w=>GROVE_BY_WORD[w] && !P.metGrove[w])) return;
    g.running=true;
    if(g.lesson===1) FT.lesson1();
    else if(g.lesson===2) FT.lesson2();
    else if(g.lesson===3) FT.lesson3();
    else if(g.lesson===5) FT.lesson5();
  },
  async lesson1(){
    await FT.callout("#currentwrap", "this is your <b>letter</b><br><small>tap a column and it drops there</small>");
    await FT.callout("#nextwrap", "your <b>next</b> letter waits here<br><small>so you can plan ahead</small>");
    /* SAY THE GESTURE. The tile now visibly comes loose when you press, which is most of the
       discovery problem solved - but one sentence on the screen where the drop is being
       taught anyway costs nothing and removes the last of the doubt. A tester played the
       whole game without ever finding out he could slide. */
    await FT.callout("#currentwrap", "you can also <b>hold and slide</b><br><small>press your letter, move across to aim, let go to drop</small>");
    FT.handSlide(4);
    FT.note("drop the <b>E</b> after O N - spell <b>ONE</b>");
    await FT.wait("wordCleared");
    FT.clearNote(); FT.clearHand();
    // the word cleared; a lesson level never strands you on arithmetic - top up and win
    if(S.levelScore<S.target){ S.levelScore=S.target; UI.hud(); }
    $("breezepill").classList.add("pillglow"); // you EARNED something - it gleams until lesson 2 spends it
  },
  async lesson2(){
    const g=S.guide;
    // ONE idea at a time, and it opens with the FULL breeze page - read first, act after
    await FT.waitTip("breeze");
    FT.hand(4);
    FT.note("drop the <b>T</b> - spell <b>TEN</b>");
    const gr=await FT.wait("graceShown");
    FT.clearHand(); FT.clearNote();
    /* NOT "tap the board to hurry it". Tap-to-hurry was replaced by tap-anywhere-to-HOLD,
       so that instruction now does the OPPOSITE of what it promises - and worse, this
       beat waits on "wordCleared", which the tap it just asked for actively prevents.
       A player who followed the tutorial's own instruction stalled the tutorial.
       Lesson 3 is where the tap is taught, and it teaches it correctly. Here the word
       simply clears on its own, so say that and ask for nothing. */
    FT.note("the word waits a moment, then <b>clears by itself</b>");
    await FT.wait("wordCleared");
    FT.clearNote();
    await wait(900);                    // a clean breath - never two instructions at once
    g.allowCol=-1;                      // drops are done for this lesson - the breeze does the rest
    g.allowBreeze=true;                 // NOW the breeze answers - and only now
    $("breezepill").classList.add("pillglow");
    FT.note("now tap the 🍃 <b>breeze</b>");
    const pr=FT.ringEl($("breezepill"));
    await FT.wait("breezeArmed");
    pr.remove();
    const tO=S.board[ROWS-1][1], tL=S.board[ROWS-1][2];
    g.swapOnly=[tO&&tO.id, tL&&tL.id].filter(Boolean);
    /* ══ ASK BEFORE HELPING ══ every other beat of this tutorial rings its target and points
       a hand at it, so it can be completed start to finish without understanding a word of
       it - which is exactly what one playtester did. She tapped what was highlighted, learned
       nothing, reached the first real level, spammed the breeze because she had no idea what
       it did, and stopped. The lesson never found out, because it never asked.
       This beat asks. No ring, no hand: four letters on the board and "make GLOW". The help
       is still there, but it arrives only when it is needed - after three wrong taps, or
       nine seconds of nothing - so a player who understands is never nagged and a player who
       does not is never stranded. Either way the game learns which they were, because the
       result is tracked. */
    FT.clearNote(); FT.note("now <b>swap two letters</b> to spell <b>GLOW</b>");
    FT.swapTries=0; FT.swapHelped=false;
    FT.helpSwap=()=>{
      if(FT.swapHelped) return;
      FT.swapHelped=true;
      FT.ringCell(ROWS-1,1); FT.ringCell(ROWS-1,2);
      FT.clearNote(); FT.note("these two - swap <b>O</b> and <b>L</b>");
    };
    const helpT=setTimeout(FT.helpSwap, 9000);
    await FT.wait("swapped");
    clearTimeout(helpT); FT.helpSwap=null;
    Game.track("lesson_swap",{ tries:FT.swapTries||0, helped:!!FT.swapHelped });
    document.querySelectorAll(".ftue-ring").forEach(e=>e.remove());
    /* AFTER the clear, not before it. This used to be posted while GLOW was still
       resolving and wiped by the very event it was describing - the player earned their
       first star and never found out. Let the word land, then say what it bought. */
    FT.clearNote();
    await FT.wait("wordCleared");
    await FT.beat("🌟 <b>GLOW</b> was four letters long<br><small>four-letter words earn you a <b>wish</b> - a star that becomes any letter you need</small>");
    P.said.grace=2; save();
    S.guide=null;
  },
  async lesson3(){
    const g=S.guide;
    // the star's FULL page opens the level - they earned it with GLOW, now they read
    // what it does before anything else happens
    await FT.waitTip("wish");
    FT.hand(4);
    FT.note("spell <b>TEN</b> one more time");
    const gr=await FT.wait("graceShown");
    FT.clearHand(); FT.clearNote();
    FT.note("🌱 <b>tap anywhere</b> - holding <b>keeps the letters</b> instead of clearing them");
    FT.ringEl(gr.bubble);   // the ring lands on the breath banner - the invitation itself
    await FT.wait("held");
    g.mustHold=false;
    document.querySelectorAll(".ftue-ring").forEach(e=>e.remove());
    /* THE STAR IS SPENT HERE, NOT DESCRIBED HERE. The lesson used to hand the S over as the
       next dealt letter, so a player read three cards about the wish and finished the whole
       prologue without ever opening one. Now the S comes FROM the wish: the picker opens with
       one letter lit, they take it, and they drop it. A tool taught by using it. */
    /* THE HAND MUST BE WRONG FOR THE WISH TO MEAN ANYTHING. Walking this by hand, the deck
       had already dealt an S - so the lesson said "wish for an S" to somebody holding one,
       and the wish would have turned S into S. A tool whose first demonstration changes
       nothing teaches nothing. The hand is set to a letter that plainly cannot grow TEN, so
       the wish is visibly the thing that rescues it. */
    FT.clearNote();
    if(S.cur && S.cur.letter==="s"){ S.cur={letter:"q", kind:"normal"}; UI.piece(); UI.hints(); }
    FT.note("TEN is kept - but <b>"+((S.cur&&S.cur.letter)||"q").toUpperCase()+"</b> will not grow it. tap the 🌟 <b>wish</b>");
    if(!(P.pow.wild>0)){ P.pow.wild=1; save(); UI.wishPill(); } // never teach a tool they cannot open
    g.allowWish=true; g.wishOnly="s";
    $("wishbtn").classList.add("pillglow");
    const wr=FT.ringEl($("wishbtn"));
    await FT.wait("wishPicked");
    wr.remove(); $("wishbtn").classList.remove("pillglow");
    g.allowWish=false; g.wishOnly=null;
    FT.clearNote(); FT.note("your letter is an <b>S</b> now - drop it beside <b>TEN</b>");
    g.allowCol=5; FT.hand(5);
    await FT.wait("graceShown");
    FT.clearHand(); FT.clearNote();
    // NO PROMPT HERE. It used to say "your call - hold or let it bloom", which is a sentence
    // nobody reads in the second and a half the bubble is up, on a choice that explains
    // itself. The wait stays so the board is never reseeded under a live word.
    await FT.waitAny("wordCleared","held");
    // the lesson cleared the whole board - free play from BARE ground is the hardest
    // state in the game (nothing to complete). Seed level ground like every real level.
    for(let c=0;c<COLS;c++) if(!S.board[ROWS-1][c]) newTile(drawLetter(),"normal",ROWS-1,c);
    // A HELD WORD BELONGS TO THE PLAYER. This tidy-up rerolls a letter out of any word the
    // seeding happened to create, so the board doesn't open with free points sitting on it.
    // It used to pick from findWords() blindly - and the beat above literally invites you to
    // "hold to keep growing", so the word it reached for first was often the TENS you had
    // just chosen to keep. It overwrote one of its letters: TENS sat there refusing to clear
    // while unrelated tiles bloomed around it. Held tiles are now off limits, always.
    let guard=0;
    while(guard++<40){
      const w = findWords().find(w=>!w.cells.some(c=>c.heldWord));
      if(!w) break;
      const c=rand(w.cells);
      c.letter=drawLetter(); c.inner.innerHTML=c.letter.toUpperCase()+"<small>"+VAL[c.letter]+"</small>";
    }
    /* the handoff is the single most important sentence in the prologue - it is the moment
       the lesson stops driving and the player does. It was a 4.2-second note, which is a
       glance, not a briefing. */
    await FT.beat("🌿 <b>the board is yours</b><br><small>reach <b>"+S.target+"</b> points before your moves run out - drop letters, swap with a 🍃 breeze, and hold a word to grow it</small>");
    S.guide=null; // training wheels off - the purr waits for the WIN card, where it belongs
  },
  async lesson5(){ // the cat is awake - show where friends STAND, what wakes them, and the Book
    if(!P.metGrove.cat){ S.guide=null; return; }   // freak path: L4 won on points - no lesson to give
    Alder._dismiss();                              // the Book line has had its moment
    const seat=UI.equipped().findIndex(g=>g.w==="cat");
    // "your party lives on this shelf" - there is no shelf. The friends stand free on the
    // country now, which is a nicer thing to say anyway: they are companions, not inventory.
    await FT.callout("#pet-"+(seat<0?0:seat), (UI.artTag("cat","toastimg")||"🐱")+" <b>CAT walks with you now</b><br><small>your friends stand with you here - tap one anytime to see what it does</small>", "below");
    // THE TILE ANSWERS THIS ITSELF NOW. It wears a '?' and the level it opens at, so a
    // lesson saying "when you have somebody to fill it" contradicted the number the player
    // was looking at while reading the words. Say what the tile says.
    await FT.callout("#pet-2", "🔒 <b>more friends will walk with you</b><br><small>a <b>?</b> seat shows the level it opens at - this one at <b>"+UI.SLOT_LV[2]+"</b></small>", "below");
    /* THE SIGN, AND THE DOTS THAT COUNT IT. This is the one idea the whole game rests on.
       It was taught as "the number on its face" and "when that number reaches nothing" -
       written for a countdown badge that DOTS replaced, and never reworded. A beginner was
       being told to watch a number that is not on the screen. Dots fill; nothing counts
       down. Both lines say what the player can actually see. */
    /* THE CAT DOES NOT WATCH DROPS. It wakes on word3 ×2 - two three-letter words (roster,
       GROVE cat). The only friend that counts drops is the snail. So the prologue's central
       lesson, and its closing instruction, told the player to do the one thing that provably
       cannot light a pip: a beginner following it literally drops letters forever and nothing
       happens. Read from the roster rather than restating it, so a rebalance cannot make a
       liar of the lesson again. */
    const catSeat="#pet-"+(seat<0?0:seat);
    // the SIGN, not the count - the dots beneath the cat are the count, which is the whole
    // reason they exist. "listening for 2 small words" made the sentence do the pips' job.
    const catG=GROVE_BY_WORD.cat, catSign=signNoun(catG.wake.on,"words");
    await FT.callout(catSeat,
      "<b>every friend listens for something different</b><br><small>the cat is listening for <b>"+catSign+"</b> - each one you spell lights a dot beneath it</small>", "below");
    await FT.callout(catSeat,
      "<b>when every dot is lit, it wakes</b><br><small>it walks onto the board by itself and pats a letter into <b>one that fits</b> - you never tap a friend to use it</small>", "below");
    // …and finally, the thing that keeps them playing: WHO IS NEXT. The lesson used to end
    // on the paw meter, leaving the player with a pet but no notion that fifty more could be
    // earned or how. The swap button is gone - the TILE is the control now, so the lesson
    // points at the friend's own tile and teaches the two taps that live on it.
    await FT.callout(catSeat,
      "📔 <b>tap the tile</b> to see what a friend does<br><small><b>double-tap</b> it to open the Book of Names - every friend still hushed, what each is listening for, and who walks with you</small>", "below");
    FT.note("keep spelling - every small word brings the cat closer");
    setTimeout(()=>FT.clearNote(), 4200);
    S.guide=null;
  },
};
/* THE DECK MUST NOT STUTTER. Both steered paths below used to re-run the same
   deterministic pick every drop: tutorLetter walked d,o,g in fixed order and returned
   the first that fit, and mercy re-chose from the same tiny candidate set - so a player
   hunting a name got dealt G G G G, or a lone Q over and over. Whenever there is a
   choice, never deal the same letter twice running. */
function noRepeat(cands, last){
  const alt=cands.filter(l=>l!==last);
  return alt.length ? alt : cands;
}
/* ONE LETTER OF MEMORY WAS NEVER ENOUGH. The pools this deck steers toward are tiny -
   often two or three letters - so blocking just the previous draw still yields A B A B A B.
   Remember the last few and prefer anything outside them, falling back to the whole pool
   rather than dealing nothing. */
function notRecent(cands){
  if(!S || !S._recent || !S._recent.length) return cands;
  const alt=cands.filter(l=>!S._recent.includes(l));
  return alt.length ? alt : cands;
}
/* EVERY deal gets recorded, whichever path produced it. The old guard compared against
   S._lastDealt - which the MAIN deck never wrote to - so it was measuring a letter from
   several drops earlier and waving real repeats straight through. */
function recordDeal(l){
  if(!S || !l) return l;
  S._lastDealt=l;
  (S._recent = S._recent || []).push(l);
  while(S._recent.length>3) S._recent.shift();
  if("aeiou".includes(l)) S.dealtV=(S.dealtV||0)+1; else S.dealtC=(S.dealtC||0)+1;
  return l;
}
/* ══ THE VOWEL GOVERNOR ══
   The deck had a FLOOR and no ceiling: drawLetter forces a vowel when the BOARD falls below
   a quarter vowels, and nothing anywhere caps the top. Measured over twenty rounds at one
   country, the share of vowels the deck actually handed out ranged from 6% to 78%, and it
   explained three quarters of the score swing - vowel-rich rounds scored 58 against 112 and
   made half as many words. English runs near 40%; a word game's deck should sit near that.

   That is not difficulty, it is a round the player cannot win for a reason they can never
   see: letters arrive one at a time, so nobody perceives "I was dealt 78% vowels". They
   just feel like they played badly.

   Deliberately narrow in scope: this governs the ORDINARY draw only. Mercy letters, the
   herd's chosen letters and the tutor's steer are all decisions the game made on purpose,
   and a governor that overrode them would be breaking the thing that rescues a drought. */
const GOV_LO = 0.30, GOV_HI = 0.42, GOV_AFTER = 6;
function governVowels(l){
  if(!S || !l) return l;
  const v=S.dealtV||0, c=S.dealtC||0, n=v+c;
  if(n < GOV_AFTER) return l;              // the opening few fall as they fall
  const ratio = v/n, isV = "aeiou".includes(l);
  if(isV  && ratio > GOV_HI) return rand("bcdfghjklmnpqrstvwxyz".split(""));
  if(!isV && ratio < GOV_LO) return rand(["a","e","i","o","u"]);
  return l;
}
function tutorLetter(){ // steer the deck so the guided word (CAT/DOG) is easy to spell
  const w=S.tutorWord; if(!w) return null;
  const need=[...new Set(w.split(""))];
  const best=helpfulByLength();
  // letters that complete something NOW, else any letter the word still wants
  const useful=need.filter(l=>best[l]);
  // the school steer deliberately feeds the guest's own letters, but a three-letter name
  // dealt at 80% still produced runs of six identical tiles. Same memory as the main deck:
  // prefer a letter of the name we have NOT just dealt, and only repeat when there is no
  // other choice left.
  const pool=notRecent(noRepeat(useful.length?useful:need, S._lastDealt));
  return rand(pool);
}
function makePiece(){
  // gently paced: no special tiles in the early levels - one new idea at a time.
  // The steer is SCHOOL-ONLY: past level 6 the ceremony deck is stone-normal. Feeding
  // the name's letters to grown players spammed the same letter over and over - the
  // wood gives one foothold on the board and nothing else; powers do the rest.
  if(S && S.tutorWord && P.level<=6 && Math.random()<0.8){ const l=tutorLetter(); if(l){ recordDeal(l); return {letter:l, kind:"normal"}; } }
  // 🦬 the herd was called: these next few letters are chosen rather than drawn
  if(S && S._helpNext>0){ S._helpNext--; return {letter:recordDeal(riggedLetter()), kind:"normal"}; }
  // MERCY is deterministic, not a dice roll: after two wordless drops the deck ALWAYS
  // deals a completion if one exists. And in the ENDGAME (few moves left) even ONE dead
  // drop triggers it - a drought on your last moves is what quietly loses winnable levels.
  const mercy = S && (S.deadDrops>=2 || (S.movesLeft<=6 && S.deadDrops>=1));
  if(mercy){
    const best=helpfulByLength(); const ks=Object.keys(best);
    if(ks.length){ const longs=ks.filter(l=>best[l]>=4);
      const L=rand(notRecent(noRepeat(longs.length?longs:ks, S._lastDealt)));
      recordDeal(L); return {letter:L, kind:"normal"}; }
    // no completion exists (a scattered board) - force a BUILDER so one appears next drop.
    const b=builderLetters();
    if(b.length){ const L=rand(notRecent(noRepeat(b, S._lastDealt))); recordDeal(L); return {letter:L, kind:"normal"}; }
    // still nothing makeable in a real drought - a star falls in to rescue you.
    // it matches ANY letter, so beside almost any pair it completes a word. skill-proof.
    if(S.deadDrops>=3 || S.movesLeft<=5) return {letter:"★", kind:"wild"};
  }
  const roll=Math.random();
  // gold is the PETS' gift now - the deck only rains it on 👑 milestone celebration levels.
  // (if the game handed out gold freely, why would you need a cat?)
  /* the gold rain and the restless tile each decided alone whether today was their day, so
     adventure 20 arrived as a door, a keystone, an ask, a gold shower and a shifting tile at
     once. The ask owns the round; these are frequent and lose nothing by waiting. */
  const busyRound = S && S.goal && S.goal.t!=="hush";
  const shiftOK = S && S.level>=16 && !busyRound;
  const goldP = (S && S.milestone && !busyRound) ? 0.25 : 0;
  if(shiftOK && roll<0.02)  return {letter:drawLetter(), kind:"shift"};
  if(roll<goldP)            return {letter:recordDeal(riggedLetter()), kind:"gold"};
  let l=governVowels(riggedLetter());
  if(Game && Game.hasPassive && S && Game.hasPassive("skipJunk") && "qzxjv".includes(l)){
    l=governVowels(riggedLetter()); // 🧠 Clever Beak rerolls once
  }
  return {letter:recordDeal(l), kind:"normal"};
}

/* =================== BOARD DOM =================== */
