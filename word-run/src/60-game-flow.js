/* @module  game  -  the rules: dropping, resolving, scoring, waking, winning */
const Game = {
  play(){
    Snd.init();
    const today=Math.floor(Date.now()/864e5);
    if(P.lastDay!==today){ P.streak = (P.lastDay===today-1) ? (P.streak||0)+1 : 1; P.lastDay=today; Game.tallyEv("day"); }
    if(P.questDay!==today){ P.questDay=today; P.questProgress=0; P.questDone=false; }
    save();
    UI.scene("scene-game");
    if(!P.tut){ UI.tutShow(0); return; } // first ever play: the tutorial ends into level 1
    if(loadRun()){ fitBoard(); UI.all(); return; }
    Game.startLevel(P.level);
  },

  // restartFromOne() lived here - removed with its button. See the note in the menu markup:
  // the ladder and the grove are one progression, so sending a player back to level 1 while
  // they keep their friends replayed the lessons at someone who needs none and hollowed out
  // the ceremony levels for names already spoken.
  startLevel(level){
    Game.track("level_start",{L:level});
    UI.toastClear(); // stale announcements never follow you into a fresh round
    FT.cleanup(); // no lesson litter survives into a new level
    boardEl.innerHTML="";
    S = newState(level);
    // level SHAPE varies with the rhythm so no two feel the same: some open airy,
    // spikes start crowded, breathers start nearly bare. tuned by the same 5-beat cycle.
    // strays are what make words POSSIBLE: a landing slot next to a stray is a
    // completion waiting to happen. airy boards were starving players of words.
    const shapes=[
      {rows:1, strays:5},   // beat 1 - gentle
      {rows:1, strays:4},   // beat 2 - breather
      {rows:2, strays:4},   // beat 3 - build
      {rows:1, strays:4},   // beat 4 - breather
      {rows:2, strays:5},   // beat 5 - 🔥 spike (crowded)
    ];
    const sh = isMilestone(level) ? {rows:2, strays:6} : shapes[(level-1)%5];
    for(let r=0;r<sh.rows;r++) for(let c=0;c<COLS;c++) newTile(drawLetter(),"normal",ROWS-1-r,c);
    for(let i=0;i<sh.strays;i++){ const c=Math.floor(Math.random()*COLS); const rr=ROWS-1-sh.rows; if(rr>=0 && !S.board[rr][c]) newTile(drawLetter(),"normal",rr,c); }
    let guard=0;
    while(findWords().length && guard++<80){
      const w=findWords()[0]; const t=rand(w.cells);
      t.letter = drawLetter(); t.inner.innerHTML = t.letter.toUpperCase()+"<small>"+VAL[t.letter]+"</small>";
    }
    // level recipe: convert some prefill tiles into this level's obstacles - but a naming
    // round only ever carries troubles this player already knows how to answer.
    // The guest is decided HERE rather than read off S.tutorWord, which is not assigned
    // until fifty lines below this: reading it early made the flag permanently false and
    // the whole filter silently inert.
    const naming = (P.summon && !P.grove[P.summon]) || (level===4 && !P.grove.cat);
    /* worked out here for the same reason the guest is: S.goal is not assigned until fifty
       lines below, so reading it now would make the filter permanently inert. */
    let goalSeed=null;
    if(!naming) try{
      const gt=goalFor(level);
      if(gt==="gauntlet"){ const gp=gauntletPair(advOf(level)); goalSeed=gp[0]?GOALS[gp[0]].seed:null; }
      else if(gt && GOALS[gt]) goalSeed=GOALS[gt].seed||null;
    }catch(e){}
    const rec=recipeFor(level, !!naming, goalSeed);
    const pool=Object.values(S.tiles).filter(t=>t.kind==="normal");
    const convert=(kind,n)=>{
      for(let i=0;i<n;i++){
        if(!pool.length) return;
        const t=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
        t.kind=kind; t.cracks=0;
        t.inner.className="tile "+kind; t.inner.innerHTML=tileFace(t);
      }
    };
    // seed whatever the recipe asked for, WHATEVER it asked for. This was nine hardcoded
    // lines, so a trouble could be fully designed, tabled and tested and still never reach
    // a board - the branch was seeded zero times at level 10 for exactly that reason.
    for(const kind in rec) if(rec[kind]>0) convert(kind, rec[kind]);
    // the round's ASK: ceremonies keep the hush (their contract is the name); other
    // levels may ask for obstacles instead - and the board seeds enough to ask fairly
    S.goal={t:"hush",need:0,have:0}; S.goal2=null;
    // ONE ROUND, ONE CHALLENGE. The summons must be drawn BEFORE the goal is chosen:
    // it used to be pulled afterwards, so a round could seed "melt every ice" and THEN
    // discover it also had a guest to name - and clearing the ice won the level without
    // the name ever being spoken. The queue is emptied first now, so the goal block
    // below sees the ceremony and stands aside.
    if(!P.summon && P.summonQ.length && P.metGrove.cat) P.summon=P.summonQ.shift();
    const seedGoal=(gt,cap)=>{ // seed a goal's pieces and return its ask
      const G=GOALS[gt];
      const need=Math.min(cap||7, G.base+Math.floor(level/(G.slowScale||25)));
      if(!G.seed) return {t:gt, need:Math.min(cap||6, G.base+Math.floor(level/40)), have:0}; // 🏔️ deeds only
      const pool2=Object.values(S.tiles).filter(t=>t.kind==="normal");
      const seedN=G.fixedSeed || need;
      let seeded=Object.values(S.tiles).filter(t=>t.kind===G.seed).length;
      while(seeded<seedN && pool2.length){
        const t=pool2.splice(Math.floor(Math.random()*pool2.length),1)[0];
        t.kind=G.seed; t.cracks=0;
        t.inner.className="tile "+G.seed; t.inner.innerHTML=tileFace(t);
        seeded++;
      }
      // hunt-goals count deeds (the spread supplies them); piece-goals count what's seeded
      return {t:gt, need: G.fixedSeed ? need : seeded, have:0};
    };
    if(!(P.summon && !P.grove[P.summon]) && !(level===4 && !P.grove.cat)){
      const gt=goalFor(level);
      if(gt==="gauntlet"){ // 👑 two asks at once, each cut down to size
        /* the crown trial drew from a fixed four - thaw and boulder among them - so it
           conjured ice and stone in whatever country it landed in, exactly like the
           schedule did. It now draws from what this country can legally be asked.
           gi also read the RAW counter while goalFor reads the adventure level: two units
           in one system, five apart. Both read the adventure level now. */
        const gp=gauntletPair(advOf(level));
        if(gp[0]) S.goal =seedGoal(gp[0],4);
        if(gp[1]) S.goal2=seedGoal(gp[1],4);
      } else if(gt!=="hush"){
        S.goal=seedGoal(gt);
      }
    }
    // a met calling becomes a NAMING LEVEL: the summoned creature hides in the corner
    // of the board and its name hides in the letters. One guest per level - the queue
    // was already drawn above, before the goal was chosen.
    S.tutorWord = (P.summon && !P.grove[P.summon]) ? P.summon
                : (level===4 && !P.grove.cat) ? "cat" : null;   // school fallback, never missable
    /* the board is no longer staged toward the NAME - that platter plus the spell-wake
       was the whole old ceremony sneaking back. Prologue lessons keep their scripted
       boards; a real meeting deals an honest deck and asks for the loving. */
    if(S.tutorWord && P.level<=PROLOGUE_END) tutorPrefill(S.tutorWord);
    S.cur = makePiece(); S.next = makePiece();
    if(Game.hasPassive("next2")) S.next2 = makePiece(); // 👁 Far Sight from the first drop
    if(S.tutorWord && P.level<=6){ const l=S.tutorWord.slice(-1); S.cur={letter:l,kind:"normal"}; S.next={letter:l,kind:"normal"}; }
    FT.setup(level); // lessons 1-3 restage the board entirely; level 5 arms the shelf lesson
    /* ══ ONE DUTY TRUTH ══ a friend met while the party was full sat benched FOREVER when
       a seat later opened - the Book said on duty, the shelf said empty, the round agreed
       with neither (caught in the ten-level replay). Every round start reconciles: open
       seats fill from the bench, most recently met first, and the shelf says so. */
    /* ══ THE BENCH GROWING IS AN ACHIEVEMENT, AND IT ARRIVED SILENTLY ══
       "TWO can walk with you now immediately as level 7 starts - this should be a moment,
       ideally the question mark should have shaken and disappeared opening a slot and
       pointing the user to go to the book to add a pet. All that moment of achievement is
       lost." The seat simply became fillable and the auto-fill quietly filled it. */
    { const seats=slotsFor(level), wasSeats=P.lastSeats||0;
      if(seats!==wasSeats){ P.lastSeats=seats; save(); }
      if(seats>wasSeats && wasSeats>0) setTimeout(()=>{
        try{
          const el=$("pet-"+(seats-1));
          if(el){ el.classList.remove("opened"); void el.offsetWidth; el.classList.add("opened");
                  setTimeout(()=>el.classList.remove("opened"), 1800); }
          Snd.levelUp(); buzz([30,50,30]);
          UI.say("seat-open-"+seats, "🪑 <b>a seat opened</b> - choose who fills it in 📖 the Book", 2);
        }catch(e){}
      }, 650);
    }
    { const max=slotsFor(level); P.equip=(P.equip||[]).filter(w=>P.metGrove[w]);
      if(P.equip.length<max){
        const bench=Object.keys(P.metGrove).filter(w=>!P.equip.includes(w) && GROVE_BY_WORD[w])
          .sort((a,b)=>(P.metGrove[a]||0)-(P.metGrove[b]||0));   // oldest first: the newest
          // arrival used to walk past everybody waiting, which reads as the game overruling you
        while(P.equip.length<max && bench.length){ const w=bench.shift(); P.equip.push(w);
          UI.petSay((UI.artTag(w,"toastimg")||GROVE_BY_WORD[w].e)+" <b>takes the open seat</b>"); }
        save(); } }
    // 🎭 a naming level wears the ceremony: the board itself holds its breath
    boardEl.classList.toggle("ceremony", !!S.tutorWord);
    Snd.mode = S.tutorWord ? "ceremony" : "normal";   // the music leans in with it
    boardEl.classList.remove("danger"); // fresh level, fresh calm - no leftover low-moves glow
    $("breezepill").classList.remove("armed");
    $("wishbtn").classList.remove("armed");
    $("ov-wish").classList.remove("active");
    fitBoard(); UI.all(); UI.visitor();
    applyBiome(level);
    warmAhead(level);      // the next country arrives before the player does
    $("ov-end").classList.remove("active");
    const bi=biomeOf(level);
    $("iv-placeicon").textContent = BIOMES[bi];
    $("iv-placename").textContent = BIOME_NAMES[bi];
    // WHAT KIND OF ROUND IS THIS? Every card looked identical whether the round was an
    // ordinary one, a naming ceremony or an obstacle trial - so the player had to infer the
    // shape of the next few minutes from a changed number. Name it under the place, and let
    // the band below spell out the terms. A guest outranks everything: if a creature hides
    // here, that is what this round IS, whatever else it also asks for.
    { const ty=$("iv-type"); const sp = S.goal && S.goal.t!=="hush";
      const card=$("ov-intro").querySelector(".card");
      card.classList.remove("ceremony","trial");     // the card itself changes clothes
      const waiting = KEYSTONE[advOf(level)];   // a friend handed over at the end of this road
      if(S.tutorWord)  { ty.style.display="block"; ty.className="ceremony"; ty.textContent="🎭 naming ceremony";
                         card.classList.add("ceremony"); }
      else if(waiting && GROVE_BY_WORD[waiting] && !P.grove[waiting]){
        // IT USED TO ARRIVE WITH NO WARNING AT ALL - the player met the worm and had no
        // idea what had earned it. Say what the round gives AND what claims it; a player
        // who loses this one should know exactly what they are coming back for.
        // The creature is a silhouette: somebody is coming, and who it is still belongs to
        // the meeting. (The locked SEATS used to do this too - they show a plain '?' now.)
        // flex, not block: the inline style wins over the stylesheet, so setting
        // "block" here silently defeated the two-line shape the class defines.
        ty.style.display="flex"; ty.className="keystone";
        ty.innerHTML='<span class="ks-sil">'+UI.silTag(waiting)+'</span>'
          +'<b>a friend waits here</b>'
          +'<i>win this round and they walk with you</i>';
        card.classList.add("ceremony"); }
      else if(sp)      { ty.style.display="block"; ty.className="special";
                         ty.textContent=GOALS[S.goal.t].i+" special round · "+GOALS[S.goal.t].n;
                         card.classList.add("trial"); }
      else             { ty.style.display="none"; ty.textContent=""; } }
    // the garden path: 5 stepping stones through this stretch, you standing on today's
    const step=(level-1)%5;
    $("iv-path").innerHTML = Array.from({length:5},(_,i)=>
      '<span class="stone'+(i<step?" done":i===step?" here":"")+'">'+(i===step?"🚶":"")+'</span>').join("<span class='dash'></span>");
    const ring=Math.floor((level-1)/RING_LEN)+1;   // one ring = all fifteen countries walked
    $("iv-level").textContent = (ring>1?"Ring "+ring+" · ":"")+levelLabel(level) + (isMilestone(level)?" 👑":isSpike(level)?" 🔥":"");
    // …and label it for what it actually is. On an obstacle round this number is a count of
    // things to clear, not a score - calling it "target" directly under a band saying the
    // score will not end the round was the card arguing with itself.
    { const sp = S.goal && S.goal.t!=="hush";
      $("iv-targetlbl").textContent = sp ? "🧹 to clear" : "🎯 target"; }
    $("iv-target").textContent = (S.goal&&S.goal.t!=="hush")
      ? GOALS[S.goal.t].i+" "+S.goal.need+(S.goal2 ? "  "+GOALS[S.goal2.t].i+" "+S.goal2.need : "") : S.target;
    $("iv-moves").textContent = S.movesLeft;
    const ob=$("iv-obstacles");
    const parts=[];
    // same rule as the seeder: the card shows whatever is actually on the board, so a new
    // trouble cannot arrive unannounced
    for(const kind in rec) if(rec[kind]>0) parts.push((TROUBLE_ICON[kind]||"•")+"×"+rec[kind]);
    // A GATE IS A PUZZLE, NEVER AN AMBUSH. Every rule it imposes is on this card, before
    // you commit - you should be able to lose a gate in the Book and know exactly why.
    { const g=gateAt(level);
      if(g){
        if(g.seats)   parts.push("🪑 "+g.seats+" seats");
        if(g.moves)   parts.push("👣 "+g.moves+" only");
        if(g.bars)    parts.push("🚫 "+g.bars+" stays home");
        if(g.noTools) parts.push("🚫 no tools");
        else if(g.noWish) parts.push("🚫 no wishes");
        if(g.small)   parts.push("📏 small words score 0");
      } }
    if(parts.length){ ob.style.display="block"; ob.textContent=parts.join("  "); }
    else ob.style.display="none";
    const iv=$("iv-visitor");
    if(S.guide){ iv.style.display="block";
      iv.innerHTML="🎓 <b>lesson "+S.guide.lesson+"</b> · "+({1:"the drop",2:"the breeze",3:"the hold",5:"your first friend"})[S.guide.lesson]; }
    else if(S.tutorWord){ iv.style.display="block";
      // FTUE names are spelled out in full; after school, the guest keeps some mystery -
      // a silhouette, the first letter, and blanks (the board's fragment gives the rest)
      const tw=S.tutorWord, full=P.level<=6;
      const disp = full ? tw.toUpperCase() : tw[0].toUpperCase()+"&thinsp;▁".repeat(tw.length-1);
      // SAY THE STAKES BEFORE THEY BITE. A naming round ends when the name is spoken and
    // at no other moment - it belongs here, before the first drop, where it reframes the
    // round from "clear the target" to "find this creature", rather than arriving as a
    // correction the first time somebody hits the target and nothing happens.
    // It used to read as a WARNING - points alone will not finish this, you must also do
    // the name - which is the exact opposite of the deal now. The name is the whole ask.
    const spg = S.goal && S.goal.t!=="hush";
    /* NOT TWICE IN A ROW. On a player's FIRST naming round the teaching card raised just
       below ("A naming round") has already said exactly this, and it says it at more length
       and with more room - so repeating it on the level card two taps later is the same
       sentence arriving again with nothing added. It is suppressed for that one round only.
       Every naming round after it shows the stake as before, because no teaching card comes
       with those and the line is the only place the rule is stated.
       TIMING NOTE: this card is BUILT here but the teaching card is decided further down in
       startLevel, so P.said["naming-intro"] is still unset at this point on the first round -
       which is precisely what makes it the right flag to test. */
    const taughtAlready = !!P.said["naming-intro"];
    { const _cg=Game.courtship(GROVE_BY_WORD[tw]);
      iv.innerHTML='<span class="sil">'+UI.silTag(tw)+'</span> someone is hiding here - it loves <b style="white-space:nowrap">'
        +(_cg ? _cg.n+" &times; "+signNoun(_cg.sign) : "words")+'</b>'
      + (taughtAlready
          ? '<small class="ivstake">🎭 '+(spg
              ? '<b>show it the thing it loves</b> and it steps out - the target does not matter here'
              : '<b>show it the thing it loves</b> and it will tell you its name - you do not have to reach the target')
            + '</small>'
          : ''); } }
  // A SPECIAL ROUND IS NOT WON ON POINTS. Its win condition is the goal itself - melt every
  // ice, smash every stone - and the score target is scenery. The card showed the same big
  // "target" number as always, so a player could chase points on a round where points do not
  // end anything. Say what actually finishes it, in the same band the ceremony uses.
  else if(S.goal && S.goal.t!=="hush"){ iv.style.display="block";
    const g=GOALS[S.goal.t];
    iv.innerHTML='<small class="ivstake special">'+g.i+' the score won\'t end this round - '
      + 'it finishes when you <b>'+g.n+'</b>'
      + (S.goal2 ? ' and <b>'+GOALS[S.goal2.t].n+'</b>' : '')+'</small>'; }
    else iv.style.display="none";
    $("ov-intro").classList.remove("active");
    /* ══ THE DOORSTEP READS FROM THE BOOK ══ every announcement that used to fight for
       the one #ov-unlock card is an Alder Page now: same storybook shape, each waits for
       its own tap, all of it kept in the Journal for the player who tapped too fast.
       Pages self-once (page() checks P.said), so this list holds only what is DUE - and
       on the rare level where two things are due at once, they simply read in order. */
    const slots=slotsFor(level);
    const tier=Game.petTier();
    P.seenSlots=P.seenSlots||{}; P.seenTier=P.seenTier||{}; P.seenChapter=P.seenChapter||{};
    /* every subsystem here decided on its own whether today was its day - the chapter, the
       growing, a seat opening, the meeting, a trouble's debut, a goal's explainer - and none
       could see the others, so on a bad level five fired at once. Nothing is lost by waiting:
       each is gated on a flag that stays unset until its page is actually queued. */
    const duePages=[];
    const spent = !!Game._announced; Game._announced = false;   // the doorstep already spoke
    const ROOM=()=>!spent && duePages.length===0;
    // the graduation: a word for finishing the lessons, and a purse to walk in with
    /* >= and not ===, because this now stands aside when the doorstep already spoke. Pinned to
       one exact level it could fire only once, so a single deferral lost the whole hand-off -
       the kit, the amber and the story - forever. */
    if(ROOM() && level>=PROLOGUE_END+1 && !P.gradued){
      P.gradued=1; Game.amber(60);
      // the opening story goes into the Journal here, tap-skippers included
      P.journal=P.journal||[];
      ["story-1","story-2","story-3"].forEach(k=>{ if(!P.journal.includes(k)) P.journal.push(k); });
      save();
      duePages.push("graduate");
      Game.track("prologue_done",{ amber:60 });
    }
    /* THE BORDER IS A MOMENT. Keys on the adventure count (the raw-level version announced
       Chapter Two five levels early - caught in the replay batch). The chapter page says
       what this land is and who stopped tending it; the g beat is assembled here because
       only this moment knows the counts: what new trouble, how many friends to meet. */
    if(advOf(level)>1 && (advOf(level)-1)%BIOME_LEN===0 && !P.seenChapter[biomeOf(level)]){
      const b=biomeOf(level), A0=advOf(level);
      P.seenChapter[b]=1; save();
      const newTrouble = TROUBLE_KEYS.filter(k=>TROUBLE[k] && TROUBLE[k].at>=A0 && TROUBLE[k].at<A0+BIOME_LEN && !TROUBLE[k].todo);
      const residents = Object.keys(HOME).filter(w=>HOME[w][0]===b && !P.grove[w]).length;
      const gline = (newTrouble.length ? "New trouble lives here: <b>"+newTrouble.map(k=>(TROUBLE_ICON[k]||"")+" "+k).join(", ")+"</b>.<br>" : "")
        + (residents ? "🐾 <b>"+residents+" friend"+(residents>1?"s":"")+"</b> can be met in this country - the Book 📖 knows what each one loves."
                     : "🗝️ A friend waits at this country's far door.");
      duePages.push(["ch-"+b, { g: gline }]);
      Game.track("chapter_open",{ b, L:level });
    }
    // A GROWING happens to every friend at once - it has to be a moment
    if(ROOM() && tier>0 && !P.seenTier[tier] && Object.keys(P.metGrove).length && ALDER_PAGES["tier-"+tier]){
      P.seenTier[tier]=true; save();
      duePages.push("tier-"+tier);
      Snd.levelUp(); UI.confetti(); buzz([40,60,120]);
    }
    if(ROOM() && SLOT_MSG[slots] && !P.seenSlots[slots] && Object.keys(P.metGrove).length && ALDER_PAGES["seat-"+slots]){
      P.seenSlots[slots]=true; save();
      duePages.push("seat-"+slots);
      Snd.levelUp(); UI.confetti(); buzz([40,60,120]);
    }
    /* SAY WHAT A MEETING IS BEFORE THE FIRST ONE, never after. The ask itself lives on
       the level card and the strip - this page only has to teach the shape of the thing. */
    if(ROOM() && S.tutorWord && !P.said["pg-meeting"]) duePages.push("meeting");
    /* A TROUBLE INTRODUCES ITSELF ON ITS OWN DOORSTEP. The debut level seeds the trouble
       alone precisely so it can be understood alone - the page is its introduction, story
       first, rule second, before a single letter falls on it. (Alder already gave the
       heads-up at the end of the round before - the foreshadow.) */
    { const A=advOf(level);
      for(const k of TROUBLE_KEYS)
        if(ROOM() && TROUBLE[k].at===A && !TROUBLE[k].todo && !P.seenTip[k] && ALDER_PAGES[k]){
          P.seenTip[k]=true; duePages.push(k); } }   // the page IS the tip - never both
    // a special round explains its whole contract before it starts, once per goal type
    /* these never checked whether they had already been shown - they set the seen flag and
       queued the page anyway, so a goal re-explained itself in full every time it came round */
    if(ROOM() && S.goal && S.goal.t!=="hush" && !P.seenTip["goal-"+S.goal.t] && ALDER_PAGES["goal-"+S.goal.t]){
      P.seenTip["goal-"+S.goal.t]=true; duePages.push("goal-"+S.goal.t); }
    if(ROOM() && S.goal2 && !P.seenTip["goal-"+S.goal2.t] && ALDER_PAGES["goal-"+S.goal2.t]){
      P.seenTip["goal-"+S.goal2.t]=true; duePages.push("goal-"+S.goal2.t); }
    if(duePages.length) Alder.pageSeq(duePages, ()=>{ $("ov-intro").classList.add("active"); });
    else $("ov-intro").classList.add("active");
  },
  // spam-guard: fast tappers were skipping their own rewards before seeing them.
  // important cards ignore taps for the first beat - long enough to register, never annoying.
  guard(key){ const t=Game._shownAt && Game._shownAt[key]; return t && (Date.now()-t)<700; },
  shown(key){ (Game._shownAt=Game._shownAt||{})[key]=Date.now(); },
  /* closeUnlock is retired with its overlay - Alder.pageClose() runs the hand-offs now */
  closeMeet(){
    if(Game.guard("meet")) return;
    Snd.init(); $("ov-meet").classList.remove("active");
    if(UI._meetWord){
      P.metGrove[UI._meetWord]=Date.now();
      if((P.equip||[]).length<slotsFor(P.level) && !P.equip.includes(UI._meetWord)) P.equip.push(UI._meetWord); // new friends join the party while there's room
      const complete = Object.keys(P.metGrove).length >= GROVE.length && !P.finale;
      if(complete){ P.finale=Date.now(); }
      save(); UI._meetWord=null;
      if(complete){ UI.meetBloom(UI._meetCreature);
        setTimeout(()=>Game.finale(), 1400); return; }   // the wood wakes, after the last is welcomed
    }
    UI.meetBloom(UI._meetCreature); buzz(20);
    UI.visitor(); // the new friend now sits by your letters
    // the FIRST meeting opens the Book - announced through the ONE discipline every
    // announcement follows now: its own card between the win and the clear modal.
    // (As a timed toast it landed exactly on top of the level-clear CTA - caught live.)
    if(Object.keys(P.metGrove).length===1 && !(P.said["book-intro"])){
      P.said["book-intro"]=2;
      // NAME THE CAUSE, THEN THE RULE, THEN WHERE TO LOOK. The old card stated the loop in
      // one dense paragraph and never said WHY the cat had come - so a player's first
      // friend read as luck rather than something they earned, and nothing taught them the
      // loop was theirs to drive. Three short beats instead: what you did, what happens
      // next, and the one place that tracks it.
      /* TWO DENSE CARDS BECOME ONE SHORT ONE. This used to carry the entire naming loop -
         what you did, what a naming round is, and where to look - delivered at the end of the
         first naming round, i.e. after the player had already lived through it. The round now
         introduces itself beforehand, so this card no longer has to teach anything: it only
         has to say that it happens again, and where to watch for it. */
      P.annQ.push({ k:"ann-cat-answered", b:(UI.artTag("cat")||"🐱"),
        s:"The cat answered you. Play a certain way and something notices - then its name hides in a round, just like that one.",
        g:"📖 The Book of Names holds all fifty, and what each one is listening for." });
      save();
    }
    // …and once the Book has spoken, the shelf lesson takes the stage
    if(S && S.guide && S.guide.deferred) setTimeout(()=>FT.run(true), 5200);
    setTimeout(()=>{ if(!Game.showPendingMeet()){ if(S){ S.busy=false; S.lastAction=Date.now(); }
      Game.checkCallings();               // callings met before the cat now surface
      if(S) Game.checkEnd();              // a win that waited for the ritual lands FIRST…
      if(S && !S.won && !S.over) Game.showPendingTip(); // …and tips only if play continues -
      // the old order stacked a tip card on top of the win sequence (caught live)
    } }, 900);
  },
  finale(){
    // gather every name that came home, in the order the wood learned them
    const woken = Object.keys(P.metGrove).sort((a,b)=>(P.metGrove[a]||0)-(P.metGrove[b]||0));
    const grove = woken.map(w=>GROVE_BY_WORD[w] ? (UI.artTag(w,"finimg")||GROVE_BY_WORD[w].e) : "🐾");
    $("fin-grove").innerHTML = grove.map((e,i)=>
      '<span style="animation-delay:'+(0.4+i*0.045).toFixed(2)+'s">'+e+'</span>').join("");
    $("fin-body").innerHTML =
      "Fifty names, spoken back into the world.<br>The wood is loud with them now - "
      + "and the quiet that swallowed this place is <b>gone</b>.<br><br>"
      + "<b>You</b> are the one who remembered. The wood will not forget it.";
    Game.track("finale",{ names:woken.length, level:P.level, streak:P.streak||0 });
    if(S){ S.busy=true; }                          // hold the board under the moment
    $("ov-finale").classList.add("active");
    Snd.levelUp();
    // a soft rising flourish as the light returns - built from tones that actually exist
    [523,659,784,1047].forEach((f,i)=> setTimeout(()=>{ try{ Snd.tone(f,{dur:.5,type:"sine",gain:.06,verb:true}); }catch(e){} }, 700+i*180));
    UI.confetti && setTimeout(()=>UI.confetti(), 1700);
    buzz([40,60,40,120]);
  },
  finaleClose(){
    $("ov-finale").classList.remove("active");
    if(S){ S.busy=false; S.lastAction=Date.now();
      Game.checkCallings(); Game.checkEnd(); if(!S.won && !S.over) Game.showPendingTip(); }
    else { UI.home && UI.home(); }
    save();
  },
  showPendingMeet(){ // meet any friend you unlocked last round - the ritual explains what pets do
    if(!S || S.over || S.won) return false;
    let pending = Object.keys(P.grove).filter(w=>GROVE_BY_WORD[w] && !P.metGrove[w])
      .sort((a,b)=>(P.grove[a]||0)-(P.grove[b]||0));
    // the CAT is always the first meeting, and nobody else meets before round 5 is
    // done - a lucky early spell (BAT at level 2) waits its turn so the taught arc
    // (spell CAT → ritual → Book → shelf lesson) is the same for every player. From
    // level 6 the queue opens and the latecomers get their rituals back to back,
    // identical to the cat's - deferred, never diminished.
    if(P.level<6) pending = pending.filter(w=>w==="cat");
    // an unknown word must NEVER freeze the level - release it and move on
    Object.keys(P.grove).forEach(w=>{ if(!GROVE_BY_WORD[w]){ delete P.grove[w]; save(); } });
    if(!pending.length) return false;
    UI._meetWord = pending[0];
    S.busy = true;
    UI.discover(GROVE_BY_WORD[pending[0]]);
    return true;
  },
  beginLevel(){
    $("ov-intro").classList.remove("active");
    S.busy=false; S.lastAction=Date.now();
    Snd.init();
    /* the round's list, said once as it opens - cleared first so a round that repeats
       the same ask as the last one still gets spoken. Deferred behind the intro card so
       it is not queued while an overlay owns the stage (Alder holds his tongue then). */
    S._toldGoal=null;
    setTimeout(()=>{ try{ Game.goalTell(); }catch(e){} }, 700);
    // (the old pre-school "generic coach hand" is gone: it lived on #boardwrap, which
    // level changes never wipe, so it could survive and DOUBLE with the lesson's own
    // hand. Lesson 1 teaches the drop now - nobody else needs a floating finger.)
    document.querySelectorAll(".coach:not(.ftue-hand)").forEach(h=>h.remove());
    if(S.guide) setTimeout(()=>FT.run(), 350); // the lesson begins (deferred ones wait for their cue)
    // THE FIRST TIME THE SHELF GOES QUIET, SAY WHY. Friends standing back is the right
    // behaviour and the wrong surprise: without a word for it, a player reads their own
    // party breaking. Said twice, then the drifting 'z' on each seat carries it alone.
    if(S.tutorWord && UI.equipped().length)
      setTimeout(()=>UI.say("pets-doze",
        "\uD83D\uDCA4 your friends are <b>asleep</b> for a meeting<br>"
        +"<small>they will not touch the board while you court the newcomer - they wake the moment it joins</small>", 2), 900);
    // a goal type introduces itself ONCE, as an Alder Page at the round's own doorstep -
    // wired into the duePages chain in startLevel, so nothing fires here any more
    // the pity speaks once: after two letdowns the ask is waived and the friend simply comes
    if(S.tutorWord && P.level>6 && (P.nameFails[S.tutorWord]||0)>=2)
      setTimeout(()=>UI.say("mercy-"+S.tutorWord+"-"+P.nameFails[S.tutorWord],
        "🌿 it likes you regardless - <b>one more word and it steps out</b>", 1), 900);
    // the summoned creature waits in the corner of the board, a jiggling silhouette -
    // "who's that?" starts the moment the level does
    if(S.tutorWord && !$("namer")){
      const n=document.createElement("div"); n.id="namer"; n.className="sil";
      n.innerHTML=UI.silTag(S.tutorWord);   // the painted creature, cut to a silhouette by #namer.sil
      n.title="someone is hiding here - show it the thing it loves";
      boardEl.appendChild(n);
    }
    // TEACH THE HOARDER, ONCE. The moment-of-need nudge only reaches a player in trouble; a
    // comfortable one can bank amber for hours never knowing it spends. The first time it has
    // grown genuinely useful, on a calm level start, say so once - then never again.
    if(!P.amberTaught && P.level>=5 && (P.amber||0)>=45 && !S.guide && !S.tutorWord){
      P.amberTaught=1; save();
      setTimeout(()=>{ if(S && !S.busy && !S.over && !S.won && !$("ov-meet").classList.contains("active"))
        UI.say("amber-teach","🟠 <b>tap an empty tool</b> - amber buys a refill", 4); }, 1400);
    }
    /* ══ THE FORESHADOW ══ Alder looks one level ahead and says so DURING this round,
       in a quiet moment (P3 pocket) - so a new trouble is warned about the round before
       it appears, and its full page then opens on its own doorstep. The heads-up and the
       lesson are two different beats on two different days, the way a keeper would do it. */
    /* S.level, not `level` - this block lives in beginLevel, which has no such argument.
       The bare name threw a ReferenceError that silently killed everything below it,
       INCLUDING showPendingMeet - so no friend could ever be met or equipped again
       (designer caught it live: "got CAT, it just kept saying arriving next round"). */
    { const nA=advOf(S.level)+1;
      if(nA>1 && !S.guide){
        for(const k of TROUBLE_KEYS)
          if(TROUBLE[k].at===nA && !TROUBLE[k].todo && ALDER_PAGES[k] && ALDER_PAGES[k].f)
            Alder.aside("f-"+k, ALDER_PAGES[k].f, {once:true, pri:3});
        if(KEYSTONE[nA] && GROVE_BY_WORD[KEYSTONE[nA]] && !P.grove[KEYSTONE[nA]])
          Alder.aside("f-door-"+nA, ALDER_EVES["door-eve"], {once:true, pri:3});
      } }
    saveRun();
    setTimeout(()=>{ if(!Game.showPendingMeet()) Game.showPendingTip(); }, 450); // meet new friends, then explain tiles
  },
  showPendingTip(){ // first time you meet a special tile - or earn a tool - explain it
    if(!S || S.over || S.won) return;
    if(S.guide) return; // a lesson explains things in its own voice - no tips mid-class
    // NOR DURING A NAMING - the board is already asking for one exact thing. A tip is
    // owed until it is shown, so it introduces itself on the next ordinary round.
    if(S.tutorWord) return;
    if($("ov-meet").classList.contains("active")) return; // never slide a tip under a ritual
    /* THE TWO TOOLS read as full Pages, and only at a round's own doorstep - no letters
       down yet, nothing to cover. (Lessons and the skip path mark these seen, so this is
       the safety net for tools that arrive by gift.) */
    if(!S.drops && !S.busy){
      if((P.pow.swap||0)>0 && !P.seenTip.breeze){ P.seenTip.breeze=true; save(); Alder.page("breeze",{again:true}); return; }
      if((P.pow.wild||0)>0 && !P.seenTip.wish){ P.seenTip.wish=true; save(); Alder.page("wish",{again:true}); return; }
    }
    /* EVERYTHING ELSE is one idea, and it can arrive mid-round - so it rides Alder's
       pocket: the trouble's own g line, spoken in the next quiet moment, never a card
       over live letters. (Troubles met at their authored debut got their full page at
       the doorstep already - this catches golds, shifts, crates, and old saves walking
       into things out of order.) */
    const kinds=[];
    if(S.cur && S.cur.kind && S.cur.kind!=="normal") kinds.push(S.cur.kind);
    for(const t of Object.values(S.tiles)){ if(t.kind && t.kind!=="normal" && kinds.indexOf(t.kind)<0) kinds.push(t.kind); }
    for(const k of kinds){
      if(P.seenTip[k]) continue;
      const pg=ALDER_PAGES[k], tip=UI.TIPS[k];
      const line = pg ? pg.g : (tip && !Array.isArray(tip.t) ? "<b>"+tip.i+"</b> "+tip.t : null);
      if(!line) continue;
      P.seenTip[k]=true; save();
      Alder.aside("tip-"+k, line, {pri:3});
      Game.track("tip_shown",{ kind:k, L:S.level });
      return;
    }
  },
  retryLevel(){
    // A RETRY IS A GRACE TOO. It was free and unlimited, which is why amber had nothing
    // to do: you could always just go again. The first is still free - a fresh board
    // after one bad round is not a purchase - and the rest are bought.
    if(!Game.spendGrace("retry")) return;
    Snd.init(); $("ov-end").classList.remove("active");
    const back=S.level; Game.startLevel(back);
  },
  nextLevel(){ Snd.init(); $("ov-end").classList.remove("active");
    // the doorstep: whispers and achievements speak here, between rounds, never over one
    if(P.annQ && P.annQ.length){ Game.showAnnounce(()=>Game.startLevel(P.level)); return; }
    Game.startLevel(P.level); },

  /* ══ A LETTER OF THE NAME ══ the mercy that already existed for repeated failures,
     offered as a choice instead of a consolation. */
  buyLetter(){
    const w=S && S.tutorWord; if(!w) return;
    if(!Game.canAfford("letter")) return;
    Game.amber(-Game.graceCost("letter"));
    P.nameFails[w]=(P.nameFails[w]||0)+1;   // one more letter glows on the next board
    Game.track("grace_spent",{ kind:"letter", cost:Game.graceCost("letter"), L:S.level });
    save(); Snd.levelUp(); buzz([20,30,20]);
    $("ov-end").classList.remove("active");
    Game.startLevel(S.level);
  },

  /* ══ THE FRIEND, BOUGHT ══ the name goes unspoken and they come anyway. The most
     expensive thing here, because it skips the hardest thing here - and a player who
     has failed a long name three times should be able to pay their way past it rather
     than bounce off it forever. */
  async buyFriend(){
    const w=S && S.tutorWord; if(!w || P.grove[w]) return;
    const c=Game.graceCost("friend");
    if((P.amber||0) < c) return;
    Game.amber(-c);
    const g=GROVE_BY_WORD[w];
    P.grove[w]=Date.now(); P.called[w]=1;
    delete P.nameFails[w];
    if(P.summon===w) P.summon=null;
    S.newGrove.push(w);
    S.guestNamed=true;   // the round's contract, met - checkEnd wins it after the meeting
    S.tutorWord=null;
    S._boughtWin=true;   // a bought round does not also pay a winner's purse
    S._revealBonus=0;    // no score gift on a bought reveal - the friend is the whole point
    Game.track("grace_spent",{ kind:"friend", w, cost:c, L:S.level });
    save();
    // BOUGHT OR SPOKEN, THE FRIEND ARRIVES THE SAME WAY. buyFriend used to jump straight to
    // winLevel - so the most expensive purchase in the game gave you a win card and no
    // creature, which reads as paying ninety amber for nothing. It runs the exact ritual a
    // spelled name gets now: the silhouette stirs, the friend is revealed, you meet them -
    // and closeMeet's checkEnd sees guestNamed and wins the round on the way out.
    S.over=false;
    $("ov-end").classList.remove("active");
    Snd.levelUp(); buzz([40,60,120]);
    await Game.reveal(g);
  },
  goHome(){
    Snd.mode="normal";   // the home meadow never carries the ceremony's weight
    if(S && !S.over && !S.won) saveRun();
    $("ov-end").classList.remove("active"); $("ov-intro").classList.remove("active");
    UI.scene("scene-home"); UI.home();
  },

  /* A CONTROL THAT REFUSES MUST LOOK LIKE IT REFUSED. Shared by every tool button, so a
     dead tap is never indistinguishable from a missed tap. */
  denyPill(id){
    const el=$(id); if(!el) return;
    el.classList.remove("deny"); void el.offsetWidth; el.classList.add("deny");
    setTimeout(()=>el.classList.remove("deny"), 380);
    Snd.reject(); buzz(25);
  },
  restartBtn(){
    /* CAUGHT IN PLAYTEST TELEMETRY, NOT BY ME. A tester opened the menu, tapped "↻ Restart
       this level", and the log recorded a TypeError on b.classList - because #btn-restart
       was removed when the once-a-session controls moved behind the ☰, and this function
       kept reaching for it. The menu item threw on every tap, for every player, silently:
       the throw happens inside a click handler, so nothing surfaces.
       The arm-then-confirm dance went with the button. It only ever worked because there was
       a control on screen to turn red and say "tap again" - from a menu that closes itself
       first there is nowhere to show that, so a second tap would have been asked for and
       never hinted at. The menu item is already deliberate (open the menu, choose a named
       item), and a restart costs one attempt at one level, not progress: it just restarts.
       Second ghost of this exact shape today. There is now a sweep for the rest of them. */
    if(!S || S.busy) return;
    Snd.init(); buzz(20);
    Game.startLevel(S.level);
  },

  petHint(boost){ // Bright Eyes: your friend spots every place your letter finishes a word
    document.querySelectorAll(".killcell,.droplabel").forEach(e=>e.remove());
    const shots=[];
    for(let c=0;c<COLS;c++){
      const w=wouldClear(S.cur,c);
      if(!w) continue;
      let land=ROWS-1; while(land>=0 && S.board[land][c]) land--;
      shots.push({c,land,w});
    }
    if(!shots.length) return false;
    let fx=$("oraclefx");
    if(!fx){ fx=document.createElement("div"); fx.id="oraclefx"; $("boardwrap").appendChild(fx); }
    fx.classList.add("on");
    shots.forEach((s,i)=>{
      setTimeout(()=>{
        const m=document.createElement("div"); m.className="killcell";
        m.style.width=CELL+"px"; m.style.height=CELL+"px";
        m.style.left=(s.c*STEP)+"px"; m.style.top=(s.land*STEP)+"px";
        m.style.animation="killcell 1.1s 4";
        boardEl.appendChild(m);
        const dl=document.createElement("div"); dl.className="droplabel";
        dl.textContent=s.w.toUpperCase();
        dl.style.left=(s.c*STEP+CELL/2)+"px"; dl.style.top=(s.land*STEP)+"px";
        boardEl.appendChild(dl);
        Snd.tone(784+i*180,{dur:.3,type:"sine",gain:.07,verb:true});
      }, 200+i*220);
    });
    buzz([15,25,15]);
    setTimeout(()=>{
      fx.classList.remove("on");
      document.querySelectorAll(".killcell,.droplabel").forEach(e=>{ e.style.opacity=0; setTimeout(()=>e.remove(),520); });
    }, boost?6200:4600);
    return true;
  },
};
