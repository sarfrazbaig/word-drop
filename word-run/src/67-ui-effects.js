Object.assign(UI, {
  shards(r,c,color){
    for(let i=0;i<6;i++){
      const s=document.createElement("div"); s.className="shard";
      s.style.background=color;
      s.style.left=(c*STEP+CELL/2)+"px"; s.style.top=(r*STEP+CELL/2)+"px";
      s.style.setProperty("--dx",(Math.random()*110-55)+"px");
      s.style.setProperty("--dy",(Math.random()*-90-15)+"px");
      boardEl.appendChild(s); setTimeout(()=>s.remove(),580);
    }
  },
  dust(r,c){
    for(let i=0;i<4;i++){
      const d=document.createElement("div"); d.className="dust";
      d.style.left=(c*STEP + 6 + Math.random()*(CELL-12))+"px";
      d.style.top=(r*STEP + CELL - 6)+"px";
      d.style.setProperty("--dx",(Math.random()*44-22)+"px");
      d.style.setProperty("--dy",(-6-Math.random()*16)+"px");
      boardEl.appendChild(d); setTimeout(()=>d.remove(),480);
    }
  },
  ghostEl:null,
  /* the tile in flight. Kept deliberately dumb: it is told where the finger is and draws
     itself there, and every decision about whether aiming is even allowed is the same set of
     guards ghost() uses, so the two can never disagree about the state of the round. */
  handBack(){ document.body.classList.remove("handout"); },   // a refused drop gives it back
  /* THE STAGE IS SCALED TWICE OVER: #app shrinks the whole thing to fit the screen, and
     #board scales again inside that. A tile living in #boardwrap sits between the two, so it
     gets #app's scale for free and has to be given the board's. Both are measured off real
     elements rather than recomputed, so they cannot drift from what is actually on screen. */
  carryScale(){
    const bw=$("boardwrap"), bwr=bw.getBoundingClientRect();
    const kApp=bwr.width/bw.offsetWidth;                              // what #app did
    return { bwr, kApp, kBoard:(boardEl.getBoundingClientRect().width/boardEl.offsetWidth)/kApp };
  },
  carry(on, e){
    // taking the tile away is NOT the same as putting the letter back: on release the slot
    // must stay empty until its replacement is drawn, so this only removes the floating tile
    const gone=()=>{ const c=$("carry"); if(c) c.remove(); };
    if(!on) return gone();
    if(!S || !S.cur || S.over || S.won || S.busy || S.usingBreeze || S.usingPluck){ gone(); return UI.handBack(); }
    const { bwr, kApp, kBoard } = UI.carryScale();
    let c=$("carry");
    if(!c){
      // built exactly as makeTileEl builds a board tile, so there is one idea of what a tile
      // is: a .tw wrapper the size of a cell, around a .tile that fills it
      c=document.createElement("div"); c.id="carry"; c.className="tw";
      c.style.width=CELL+"px"; c.style.height=CELL+"px";
      const inner=document.createElement("div");
      inner.className="tile "+(S.cur.kind!=="normal"?S.cur.kind:"");
      inner.style.fontSize="20px";
      inner.style.transform="rotate(-2deg)";        // a piece held in a hand is never quite square
      inner.innerHTML=tileFace(S.cur);              // the board's own face, not a second copy of it
      c.appendChild(inner);
      $("boardwrap").appendChild(c);
      document.body.classList.add("handout");
    }
    // the finger, in #boardwrap's own coordinates
    const lx=(e.clientX-bwr.left)/kApp, ly=(e.clientY-bwr.top)/kApp;
    // and held one tile-height clear of it, so the fingertip never covers the letter
    const lift=CELL*kBoard*1.02;
    c.style.transform="translate("+(lx-CELL/2)+"px,"+(ly-CELL/2-lift)+"px) scale("+kBoard+")";
  },
  /* WHERE THE LETTER IS, at the instant it leaves your hand, in the board's own coordinates -
     so drop() can start the fall from there instead of inventing a tile above the column.
     Read before the held tile is taken away; null when there was nothing in hand. */
  handoff(){
    const c=$("carry"); if(!c) return null;
    const cr=c.getBoundingClientRect(), br=boardEl.getBoundingClientRect();
    const kTot=br.width/boardEl.offsetWidth;
    return { x:(cr.left+cr.width/2-br.left)/kTot - CELL/2,
             y:(cr.top +cr.height/2-br.top )/kTot - CELL/2 };
  },
  ghost(col){
    if(this.ghostEl){ if(this.ghostEl._label) this.ghostEl._label.remove(); this.ghostEl.remove(); this.ghostEl=null; }
    if(!S || col<0 || S.over || S.won || S.busy || S.usingBreeze || S.usingPluck) return;
    if(S.board[0][col]) return;
    let land=ROWS-1; while(land>=0 && S.board[land][col]) land--;
    const g=document.createElement("div");
    g.className="tile ghost"; g.style.width=CELL+"px"; g.style.height=CELL+"px"; g.style.fontSize="20px";
    g.textContent = S.cur.kind==="bomb"?"💣":S.cur.kind==="wild"?"★":S.cur.letter.toUpperCase();
    g.style.transform=xy(land,col);
    boardEl.appendChild(g); this.ghostEl=g;
    if(S.killers[col]){
      const dl=document.createElement("div"); dl.className="droplabel";
      dl.textContent = S.killers[col].toUpperCase();
      dl.style.left=(col*STEP+CELL/2)+"px"; dl.style.top=(land*STEP)+"px";
      boardEl.appendChild(dl); g._label=dl;
    }
  },
  waitTap(el, fallbackMs){ // pause a story beat until the player taps - never a soft-lock
    return new Promise(res=>{
      let done=false;
      /* the beat resolved on "click", and a letter drops on "pointerup", which fires FIRST -
         so the tap that dismissed a reveal had already dropped a tile on the way through,
         and the reveal card is a child of the board with nothing in between. The pointer
         half is swallowed at the capture phase; only the click dismisses. */
      const eat=e=>{ e.stopPropagation(); };
      const PTR=["pointerdown","pointerup","touchstart","touchend"];
      PTR.forEach(t=>boardEl.addEventListener(t, eat, true));
      const finish=()=>{ if(done) return; done=true; clearTimeout(fb);
        PTR.forEach(t=>boardEl.removeEventListener(t, eat, true));
        boardEl.removeEventListener("click", finish, true);
        if(el) el.removeEventListener("click", finish, true);
        res(); };
      const fb=setTimeout(finish, fallbackMs||12000);
      // ignore the first 450ms so the very tap that spelled the name can't skip the reveal
      setTimeout(()=>{ if(done) return;
        boardEl.addEventListener("click", finish, true);
        if(el) el.addEventListener("click", finish, true); }, 450);
    });
  },
  /* THE OLD FOUR ARE DOORS ONTO THE ONE CHANNEL NOW. They are kept as names because 68 call
     sites use them and their meanings were never wrong - "sky" meant a line about the board,
     "chip" meant a note by the counters. What was wrong was that each owned its own patch of
     screen and its own timer. They all say the same thing through the same mouth now, and a
     call with no key of its own is keyed by its own words, so the same sentence never
     arrives twice. (The _toastOld/_petSayOld implementations are deleted with their DOM.) */
  /* ══ EVERY CHANNEL IS ALDER NOW ══ sky, chip, toast, say and petSay route into the one
     speaking band; the boundary cards are Alder's Pages. The old surfaces - the note
     centre card, the sky rail, the chip toast, their scrims and timers - are DELETED,
     not parked: seven channels became one keeper, and nothing else may speak. */
  sky(html, ms){ if(html) Alder.aside(UI._noteKey(html), html, {once:true, pri:2}); },
  chip(html, ms){ if(html) Alder.aside(UI._noteKey(html), html, {pri:1}); },   // a chip answers a tap - now
  /* A FRIEND ACTING IS SOMETHING TO WATCH, NOT SOMETHING TO READ OVER.
     This used mode "once", and note() promotes the FIRST showing of any message to centre
     stage with a scrim and a tap-to-continue - so the very first time each friend acted,
     its card covered the board precisely while its effect was playing out behind it, and
     the player tapped it away having seen nothing. Worse, "once" then suppressed it
     forever, so every later act was silent: the one moment it mattered was hidden, and the
     rest said nothing at all.
     "brief" never blocks and never waits, so the banner rides alongside the board every
     time a friend goes out. The power is legible from what happens to the tiles; the
     banner only needs to say who did it. */
  /* pet speech NEVER touches the note system - no once-keys, no queue, no scrim, no
     centre stage. One pill in the hold slot; the newest line replaces the last. */
  /* ══ THE FACE SAYS WHO IS SPEAKING ══ every one of these lines is written as
     "<pet art> did a thing", so the speaker was already there - just buried in the
     sentence, where it cost bar width and left the FACE showing the round's sign. A
     dog's message wore an ice cube.
     The portrait is lifted out of the front of the line and handed to Alder as `who`,
     which the face already honours above roundFace(). Done here rather than at the 35
     call sites: they all share this shape, and one of them would have been missed. */
  /* ══ A PET DOING ITS JOB IS NOT NEWS ══
     Every one of these fired AFTER the effect had already played on the board, so the
     line narrated the past: the dog fetched, you watched it fetch, and a beat later the
     bar said "fetches K right back" - by which time the bee was already doing something
     else and the two were out of step. It also competed with the word forming in the
     middle of the screen, which is the thing the player is actually watching.
     So the routine announcement is gone. petSay() keeps its 26 call sites and simply
     says nothing; the pet's work speaks for itself on the board.
     petEdge() is what still speaks, and only for the cases the board CANNOT show:
       - a power that could not do its job and did something else instead
       - a no-op ("already fetched that")
       - an invisible state change (your next words score double)
       - anything that asks the player to act
     If you cannot see it happen, Alder says it. If you can, he stays quiet. */
  petSay(){ /* silent by design - see petEdge */ },
  petEdge(html){
    if(!html) return;
    let who=null, txt=String(html);
    const m=txt.match(/^\s*(<img[^>]*>|(?:\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*))\s*/u);
    if(m){ who=m[1]; txt=txt.slice(m[0].length); }
    /* hold:true - these get a GENEROUS 13s, not the 6.5s ceiling every other line uses.
       They arrive at the end of a resolution the player was watching, so the first
       seconds of any normal timer are spent while their eyes are still on the board and
       the chain is still animating. By the time they look up, a short line has gone.
       13s survives the resolution and still leaves a real read window. */
    Alder.aside(UI._noteKey(html), txt || html,
      Object.assign({hold:true}, who ? {who} : null));
  },
  toast(m, hold){ if(m) Alder.aside(UI._noteKey(m), m, {once:true}); },
  skyClear(){ if(Alder.cur) Alder._dismiss(); },
  chipClear(){ if(Alder.cur) Alder._dismiss(); },
  toastClear(){ Alder.Q.length=0; if(Alder.cur) Alder._dismiss(); },
  /* RESOLVES WHEN ALDER IS SILENT - the lessons wait on this before raising a bubble */
  toastQuiet(){ return Alder.quietWait(); },
  /* Send a friend out onto the board. Returns a handle whose .home() walks it back -
     the caller runs its power in between, so the pet is standing there while it works
     and there is never any doubt about who did it. */
  /* PAINTED PETS. Words in PET_ART have a hand-rendered sprite in art/pets/; everything
     else (cat, dog, the birds not yet cut) falls back to its emoji, so nothing breaks while
     the roster is half art and half glyph. */
  // The full painted set lives in art/pets/<name>.png - one per friend, so every pet shows
  // its portrait, not an emoji. Derived from the roster so a new friend just needs its PNG
  // dropped in (missing files are the only way to fall back, and there are none today).
  PET_ART: new Set(GROVE.map(g=>g.w)),
  artTag(w, cls){ return UI.PET_ART.has(w)
    ? '<img class="petimg '+(cls||"")+'" src="art/pets/'+w+'.png" alt="" draggable="false">'
    : null; },
  /* THE SILHOUETTE, from the painted portrait. Drop this inside any .sil / .ks-sil / .petsil /
     #namer element and its brightness(0) filter cuts the art into a shape. Falls back to the
     emoji only if a friend has no PNG (none do today). This is what makes every "who's hiding"
     mystery - the ceremony corner, the locked seats, the intro card, the reveal - the real
     creature's outline instead of an emoji's. */
  /* ONE MATERIAL, MANY RHYTHMS. Tinting each badge to its creature was tried and dropped: the
     colour belonged to nothing, and five pastels made the counter unreadable. The badges are
     all one carved material now and the PAINTED FRIEND supplies the colour. What still varies
     is the movement - six idle rhythms, so no two friends on the shelf breathe together. */
  petAnim(w){ const i=Math.max(0, GROVE.findIndex(g=>g.w===w)); return "pa"+((i%6)+1); },
  silTag(w){ const g=GROVE_BY_WORD[w];
    return UI.PET_ART.has(w)
      ? '<img class="petimg silimg" src="art/pets/'+w+'.png" alt="" draggable="false">'
      : (g ? g.e : "🐾"); },
  async petVisit(pet, cell){
    const eq=UI.equipped(); let i=eq.indexOf(pet); if(i<0) i=0;
    const seat=$("pet-"+i); if(!seat) return null;
    const app=$("app"), ar=app.getBoundingClientRect(), sr=seat.getBoundingClientRect(), br=boardEl.getBoundingClientRect();
    if(!sr.width || !br.width) return null;
    const x0=sr.left-ar.left+sr.width/2, y0=sr.top-ar.top+sr.height/2;
    const sp=document.createElement("div"); sp.className="petsprite";
    { const art=UI.artTag(pet.w); if(art) sp.innerHTML=art; else sp.textContent=pet.e; }
    sp.style.left=x0+"px"; sp.style.top=y0+"px";
    app.appendChild(sp);
    seat.classList.add("away");   // its seat stands empty while it is out - never two of one friend
    const k=br.width/(COLS*STEP-GAP);                       // the board is scaled to fit
    // THE BOX IS THE COLUMN. Without an explicit width the sprite was as wide as the emoji
    // glyph wanted to be - 68px against a far narrower cell - so even hovering dead centre
    // over its own column it clipped the letter beside it. Now it cannot.
    sp.style.width=sp.style.height=(CELL*k)+"px";
    // STAND BESIDE THE TILE, NEVER ON IT. A friend landing squarely on the letter it is
    // about to change hides the one thing the player is meant to watch. It steps to
    // whichever side has room - outward from the middle, so it never walks off the board.
    // HOVER IN THE SKY ABOVE ITS OWN COLUMN. Stepping sideways only moved the problem one
    // square over: at 46px the sprite covered the NEIGHBOUR's letter instead of the
    // target's. Letters stack from the floor, so the square above a column's top tile is
    // empty by definition - it is where the next tile would fall. The friend leans down out
    // of that gap, and the tile it is working on stays completely visible.
    let topR=ROWS; for(let r=0;r<ROWS;r++){ if(S.board[r] && S.board[r][cell.c]){ topR=r; break; } }
    const hoverR=Math.min(cell.r, topR)-1;
    const inSky = hoverR>=0;   // a column filled to the very brim has no sky left over it
    const side = cell.c >= COLS/2 ? -1 : 1;   // the old dodge, kept for exactly that case
    const x1=br.left-ar.left+(cell.c*STEP+CELL/2)*k + (inSky?0:side*CELL*0.82*k);
    const y1=br.top -ar.top +((inSky?hoverR:cell.r)*STEP+CELL/2)*k;
    // with the friend no longer touching it, the tile has to say for itself that it is the
    // one being worked on.
    const tgt=(cell && cell.inner) || (S.board[cell.r] && S.board[cell.r][cell.c] && S.board[cell.r][cell.c].inner) || null;
    if(tgt) tgt.classList.add("petmark");
    await wait(40);
    sp.style.left=x1+"px"; sp.style.top=y1+"px";
    Snd.tone(660,{dur:.1,type:"triangle",gain:.06,verb:true});
    await wait(430);
    sp.classList.add("landed");
    // the name plate is gone. It sat over the board announcing what the friend was called
    // while covering the tiles the player needed to see it working on - and the friend is
    // right there, doing the thing, which says it better than a label did.
    Snd.tone(990,{dur:.14,type:"sine",gain:.06,verb:true}); buzz([18,25]);
    const shown=Date.now();
    return { async home(){
      // an instant power used to hop the friend home 300ms after it arrived - long enough
      // to see a blur, not long enough to see WHAT it did. It lingers beside its work
      // instead, and since the plate is gone that dwell is now spent watching the tile
      // rather than reading a label over it.
      const dwell=1200-(Date.now()-shown); if(dwell>0) await wait(dwell);
      if(tgt) tgt.classList.remove("petmark");
      sp.classList.remove("landed");
      sp.style.left=x0+"px"; sp.style.top=y0+"px";
      Snd.tone(560,{dur:.09,type:"triangle",gain:.05,verb:true});
      await wait(430); sp.remove();
      seat.classList.remove("away");   // home again, and the seat is filled once more
    } };
  },
  /* ══ A FRIEND-HELPING POWER GOES TO THE FRIEND ══ the bee's buzz wakes somebody on the
     shelf, but it used to fly out over the board like every other power - the animation
     said "I am working on these tiles" while the toast said "I am nudging the cat". It
     crosses to that friend's badge instead, leans on it, and comes home. */
  async petVisitSeat(pet, target){
    const eq=UI.equipped();
    const i=eq.indexOf(pet), j=eq.indexOf(target);
    if(i<0 || j<0 || i===j) return null;
    const from=$("pet-"+i), to=$("pet-"+j); if(!from || !to) return null;
    const app=$("app"), ar=app.getBoundingClientRect();
    const fr=from.getBoundingClientRect(), tr=to.getBoundingClientRect();
    if(!fr.width || !tr.width) return null;
    const x0=fr.left-ar.left+fr.width/2, y0=fr.top-ar.top+fr.height/2;
    const x1=tr.left-ar.left+tr.width/2, y1=tr.top -ar.top +tr.height/2 - 16;  // hovers just above
    const sp=document.createElement("div"); sp.className="petsprite";
    { const art=UI.artTag(pet.w); if(art) sp.innerHTML=art; else sp.textContent=pet.e; }
    sp.style.width=sp.style.height="46px";
    sp.style.left=x0+"px"; sp.style.top=y0+"px";
    app.appendChild(sp);
    from.classList.add("away");
    await wait(40);
    sp.style.left=x1+"px"; sp.style.top=y1+"px";
    Snd.tone(760,{dur:.1,type:"triangle",gain:.06,verb:true});
    await wait(430);
    sp.classList.add("landed");
    to.classList.add("hosting");
    const shown=Date.now();
    return { async home(){
      const dwell=1000-(Date.now()-shown); if(dwell>0) await wait(dwell);
      to.classList.remove("hosting");
      sp.classList.remove("landed");
      sp.style.left=x0+"px"; sp.style.top=y0+"px";
      Snd.tone(560,{dur:.09,type:"triangle",gain:.05,verb:true});
      await wait(430); sp.remove();
      from.classList.remove("away");
    } };
  },
  /* THE NOTE MACHINERY IS GONE. note()/_noteNext and their centre card, scrim, and
     14-second timers were the last of the seven channels - every caller now speaks
     through Alder (aside for lines, page for cards), and the one law lives in the
     stage manager: nothing covers a live board, nothing demands a tap to play. */
  _noteKey(html){                 // a message with no key of its own is keyed by what it says
    const t=String(html).replace(/<[^>]+>/g,"").trim();
    let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))|0;
    return "m"+(h>>>0).toString(36);
  },
  say(key, msg, times){ // teaching goes to the POCKET: spoken once, in a quiet moment
    Alder.aside(key, msg, {once:true, pri:3});
  },
  /* TIPS holds ONLY what has no Alder Page: the two treats that arrive mid-round.
     Every trouble, goal and tool teaching lives in ALDER_PAGES now - one copy, one voice. */
  TIPS:{
    gold:  {i:"✨", t:"A <b>golden tile</b>! Use it in a word and its letter scores <b>triple</b>."},
    shift: {i:"🌀", t:"A <b>restless tile</b> - it changes its letter every few drops. Catch it at the right moment!"},
  },  /* ---- 🧿 KEEPER'S CHARM - export/restore. iOS quietly evicts a PWA's storage after
     ~a week of neglect; until a real cloud save exists, the charm is the lifeboat.
     Format: HW1.<checksum36>.<base64 of P> - the checksum catches half-pasted codes. */
  _charmSum(raw){ let h=0; for(let i=0;i<raw.length;i++){ h=(h*31+raw.charCodeAt(i))>>>0; } return h.toString(36); },
  charmCode(){ const raw=JSON.stringify(P); return "HW1."+UI._charmSum(raw)+"."+btoa(unescape(encodeURIComponent(raw))); },
  charmParse(code){
    try{
      code=(code||"").trim();
      if(!code.startsWith("HW1.")) return null;
      const dot=code.indexOf(".",4); if(dot<0) return null;
      const raw=decodeURIComponent(escape(atob(code.slice(dot+1))));
      if(UI._charmSum(raw)!==code.slice(4,dot)) return null;
      const p=JSON.parse(raw);
      if(typeof p.level!=="number" || typeof p.grove!=="object" || p.grove===null) return null;
      return p;
    }catch(e){ return null; }
  },
  charmToggle(){
    const b=$("charm-box"); b.classList.toggle("open");
    $("charm-msg").textContent=""; $("charm-in").value=""; UI._charmArmed=null;
    $("charm-in").classList.remove("show"); $("charm-plant").classList.remove("show");
  },
  async charmCopy(){
    const code=UI.charmCode();
    try{
      await navigator.clipboard.writeText(code);
      $("charm-msg").textContent="🧿 copied - tuck it somewhere safe (a note, an email to yourself, anywhere)";
    }catch(e){ // no clipboard leave? show the code and let fingers do it
      $("charm-in").classList.add("show"); $("charm-in").value=code; $("charm-in").select();
      $("charm-msg").textContent="copy the code above and tuck it somewhere safe";
    }
  },
  charmPasteShow(){
    $("charm-in").classList.add("show"); $("charm-plant").classList.add("show");
    $("charm-in").value=""; $("charm-in").focus(); $("charm-msg").textContent=""; UI._charmArmed=null;
  },
  charmPlant(){
    const code=($("charm-in").value||"").trim();
    const p=UI.charmParse(code);
    if(!p){ $("charm-msg").textContent="🌫️ that charm doesn't take root - check it copied out whole, end to end"; UI._charmArmed=null; return; }
    if(UI._charmArmed!==code){ // planting replaces a living wood - ask twice, plainly
      UI._charmArmed=code;
      $("charm-msg").innerHTML="⚠️ this replaces your current wood ("+levelLabel(P.level)+" · "+Object.keys(P.grove||{}).length+
        " friends) with <b>Level "+p.level+" · "+Object.keys(p.grove||{}).length+" friends</b>. tap <b>plant it</b> once more to be sure.";
      return;
    }
    try{ localStorage.setItem("worddrop_v3", JSON.stringify(p)); }catch(e){}
    location.reload(); // load() renormalizes everything on the way back up
  },

  /* ---- 🔧 KEEPER'S TOOLBOX - dev drawer behind seven quick taps on the LV chip.
     Nothing here is discoverable by accident; nothing here is load-bearing. ---- */
  /* ══════════ THE KEEPER'S TOOLBOX ══════════
     Seven taps on the level chip, then a number. It is behind a lock because it can hand
     itself every friend in the wood and win any round on demand, and this ships to
     playtesters. The lock lasts the browser session, not forever - a reload asks again. */
  DBG_PW:"694739",
  dbgTap(){
    const now=Date.now();
    UI._dbgT = (UI._dbgT && now-UI._dbgT.t<900) ? {n:UI._dbgT.n+1, t:now} : {n:1, t:now};
    if(UI._dbgT.n>=7){
      UI._dbgT=null;
      let open=false; try{ open = sessionStorage.getItem("hush_dbg")==="1"; }catch(e){}
      if(open) UI.dbgShow(); else UI.dbgLock();
    }
  },
});
