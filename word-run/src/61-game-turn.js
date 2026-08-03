Object.assign(Game, {

  async drop(col){
    // where the letter was let go. Read first, and cleared whatever happens next, so a
    // bounced drop cannot leave a stale hand position for some later programmatic one.
    const hand = S && S._fromHand; if(S) S._fromHand=null;
    if(!S||S.over||S.won||S.busy) return;
    Snd.init();
    // school rules: during a lesson the only legal column is the one being taught.
    // everywhere else bounces - an idiot-proof lesson permits no wrong answers.
    if(S.guide && S.guide.allowCol!=null && col!==S.guide.allowCol){ FT.deny(); return; }
    // 🌾 A REED STANDS IN THE WHOLE COLUMN. The first trouble that is about SHAPE rather
    // than tiles - nothing drops past it, so a seven-wide board quietly becomes six.
    if(S.board.some(row=>row[col] && row[col].kind==="reed")){
      Snd.reject(); buzz(50);
      UI.say("reed-block","🌾 <b>spell a word beside the reed</b> - twice - to bring it down",2);
      boardEl.classList.remove("shake"); void boardEl.offsetWidth; boardEl.classList.add("shake");
      setTimeout(()=>boardEl.classList.remove("shake"),420);
      return;
    }
    if(S.board[0][col]){ Snd.reject(); buzz(60);
      boardEl.classList.remove("shake"); void boardEl.offsetWidth; boardEl.classList.add("shake");
      setTimeout(()=>boardEl.classList.remove("shake"),420);
      return; }
    S.busy = true;
    // a fresh drop, so every friend may act once more. This list is the only thing standing
    // between "the row conducts" and "the party plays itself".
    S._actedThisDrop = [];
    // a wished letter is being placed: whatever word it makes must not pay for another wish
    S._noWishGrant = !!S._wishedHand; S._wishedHand=false;
    UI.ghost(-1);
    if(!P.coach){ P.coach=true; save(); const h=document.querySelector(".coach"); if(h) h.remove(); }
    let land=ROWS-1; while(land>=0 && S.board[land][col]) land--;
    /* the board BEFORE the letter lands, plus where it is going. Paired with the
       word_made / settle events that follow, this is what makes a level replayable:
       what was on screen, what the player chose, and what it did. */
    try{ Tele.log("drop",{ col, row:land, letter:(S.cur&&S.cur.letter||"").toUpperCase(),
      kind:(S.cur&&S.cur.kind)||"normal", by:hand?"hand":"tap" }); }catch(e){}
    const piece=S.cur; S.cur=S.next;
    if(Game.hasPassive("next2")){ S.next=S.next2||makePiece(); S.next2=makePiece(); } // 👁 Far Sight: the queue runs deeper
    else { S.next=makePiece(); S.next2=null; }
    // the stake: every drop costs one - unless a friend covers it
    let free=false;
    if(Game.hasPassive("firstFree") && S.drops===0){ free=true; }                    // 🛡️ Shell Shield
    S.stepN=(S.stepN||0)+1;
    if(!free && Game.hasPassive("freeStep") && S.stepN%(6)===0){ free=true; } // 🐌 Slow & Sure (🪹 Soil Crew hurries it)
    if(free){ Game.movesFloat("0 · free step"); Snd.tone(740,{dur:.1,type:"triangle",gain:.05,verb:true}); }
    else S.movesLeft--;
    S._refunded=false; // Quickstep refunds at most once per drop

    /* ══ ONE TILE, NOT TWO ══
       The tile in your hand used to be deleted at your fingertip while a different tile was
       created above the column and dropped in. On a tap that is the whole interaction: a
       flash where you pressed, then something else falling out of the sky. So the piece you
       are holding is the piece that falls - it keeps its position at the moment of release
       and carries on down from there, and the held element is removed in the same frame it
       is replaced, which is why there is nothing to see in the handover.
       The fall is timed from the distance actually travelled, using the same 42ms-per-cell
       the sky drop used, so a release high above the stack still falls at the old speed and
       a tap just above the landing cell takes the 80ms floor rather than dawdling. With
       nothing in hand - a friend acting, a lesson placing a letter - it drops from the sky
       exactly as before. */
    const t = newTile(piece.letter, piece.kind, land, col, false);
    const from = hand ? "translate("+hand.x+"px,"+hand.y+"px)" : xy(-1.2,col);
    const cells = hand ? Math.max(0,(land*STEP - hand.y)/STEP) : land;
    t.el.style.transition="none"; t.el.style.transform=from; void t.el.offsetWidth;
    { const held=$("carry"); if(held) held.remove(); }   // the handover, in one frame
    const fallMs = 80 + Math.round(cells*42);
    t.el.style.transition="transform "+fallMs+"ms cubic-bezier(.55,0,.85,.55)";
    t.el.style.transform=xy(land,col);
    Snd.whoosh();
    await wait(fallMs);
    t.el.style.transition="";
    t.inner.classList.add("landsquash"); setTimeout(()=>t.inner.classList.remove("landsquash"),400);
    UI.dust(land,col);
    for(let r=land+1, d=0; r<ROWS; r++, d++){
      const below=S.board[r][col];
      if(below) setTimeout(()=>{ below.inner.classList.add("jostle"); setTimeout(()=>below.inner.classList.remove("jostle"),220); }, 30+d*28);
    }
    Snd.land(land); buzz(12);
    if(piece.kind==="gold") Snd.gold();
    if(piece.kind==="wild") UI.stardrift(); // a star settles over the board

    S.cascadeMax=1; S.clearedThisDrop=false; S.lastAction=Date.now();
    S.chain=1;
    S.playerMove=true;                    // this resolve is YOURS - the grace applies
    await Game.resolve([t]);
    S.playerMove=false;
    S._noWishGrant=false;   // the wished letter has been spent; later words pay normally
    // 🎭 a name was spelled: the silhouette takes center stage, the wood holds its
    // breath, and the reveal runs into the meet ritual - SAME round, no cliffhanger
    if(S.pendingReveal){ const rg=S.pendingReveal; S.pendingReveal=null; await Game.reveal(rg); }
    // the KEEPER: if every trace of the guest's anchor has been eaten by ordinary
    // clears, quietly stage a fresh one. It never rebuilds the player's progress -
    // only the foothold. The WORK stays theirs.
    /* this re-laid the guest's letters every time they were consumed, so clearing CAT brought
       CAT straight back. Two re-stages is still a net, and the ask is waived after two
       letdowns anyway, so nothing here can strand anyone. */
    if(S.tutorWord && P.level<=PROLOGUE_END && !S.over && !S.won && !tutorAlive()
       && (S.prefills=(S.prefills||0)) < 2){ S.prefills++; tutorPrefill(S.tutorWord); }
    if(S._chainBoostUsed){ S.chainBoost=false; S._chainBoostUsed=false; } // 🎻 the doubled cascade has sung
    if(S.cascadeMax>=3) Game.cheer(2); // big cascades excite your pets
    if(Game.hasPassive("alwaysHint")) Game.petHint(false); // 🎯 Keen Eye: the hawk points, quietly, every time

    // hints are onboarding only (levels 1-2): with real stakes, the game must not solve itself
    if(S.clearedThisDrop){ S.deadDrops=0; S.idleNudges=0; }
    /* deadDrops is still counted - the deck reads it to soften what it deals (see the
       mercy checks) - but it no longer summons the hint rings. A dry spell changes what
       arrives in your hand, not what the board tells you to do with it. */
    else { S.deadDrops++; }
    S.drops++;
    // A DROP IS AN EVENT, and so is the letter itself. This is what keeps something
    // ticking even on a turn that spells nothing - the friend counting consonants took
    // a step, so the round never feels like a wasted move.
    Game.sees("drop");
    if(piece && piece.letter){ S._lastDropped=piece.letter;   // 🐶🪰 fetch and return read this
      Game.sees("aeiou".includes(piece.letter) ? "vowel" : "consonant"); }
    // THE DRAIN MUST FOLLOW THE SIGNS, not precede them. This sat above the sees() calls
    // at first, so a friend woken by the drop itself queued up after the drainer had
    // already gone by and sat there until the NEXT drop - the bee counted to four and
    // then did nothing at all.
    await Game.tryPetAct();
    if(S.drops % 3 === 0){ await Game.stirShifters(); await Game.brambleSpread(); }
    await Game.boardDrift();   // the river and the ridge move the board on their own
    await Game.woodTick();
    S.busy=false;
    UI.all();
    saveRun();
    Game.checkEnd();
    if(!S.over && !S.won) Game.showPendingTip(); // e.g. a gold or shifting tile just showed up
  },

  checkEnd(){
    if(S.over || S.won) return;
    if($("ov-meet").classList.contains("active")) return; // the ritual owns the stage - closeMeet re-checks
    // THE NAME IS THE WHOLE ASK. The contract used to be "beat the level AND speak the
    // name", so a player could spell RACCOON - the hardest thing the game asks of anyone -
    // and still lose the round on points. Speaking it ends the round, once the silhouette
    // has had its reveal.
    if(S.guestNamed && !S.pendingReveal && !document.querySelector(".whosthat")){
      Game.winLevel(); return; }
    /* ══ THE MEETING IS THE CHALLENGE, NOT A SPELLING TEST ══ (designer's ruling, proven
       by play: the ask was done in eight moves and the round then died twice hunting
       D-O-G.) Show the friend the thing it loves - counted by this round's own sigs -
       and it steps out and TELLS you its name: the reveal is the wood's to speak, the
       challenge is yours to meet. Spelling the name still works instantly (above) as the
       hunter's shortcut, it just is not the toll. After two letdowns even the ask is
       waived: it likes you regardless. */
    if(S.tutorWord && !S.guestNamed && !S.pendingReveal && !document.querySelector(".whosthat")){
      const gw = S.tutorWord;
      if(Game.courted(gw) || (P.nameFails[gw]||0) >= 2){
        const g = GROVE_BY_WORD[gw];
        if(g && !P.grove[gw]){
          P.grove[gw]=Date.now(); S.newGrove.push(gw);
          delete P.nameFails[gw]; P.quietLvls=0;
          Game.track("wake",{ w:gw, L:S.level, how:"challenge" });
        }
        /* THE SLOT IS FREED THE MOMENT THE MEETING ENDS. The old spelling path cleared
           the summon; the challenge path did not, so the first met friend clogged the
           queue and NO LATER FRIEND could ever be met (caught in the ten-level replay:
           the mouse waited behind the dog forever). One meeting, one slot, released. */
        if(P.summon===gw) P.summon=null;
        P.summonQ=(P.summonQ||[]).filter(w=>w!==gw);
        save();
        S.guestNamed = true;
        if(!g){ Game.winLevel(); return; }   // an unknown guest can only be waved through
        /* THE JOIN IS THE ROUND'S BIGGEST MOMENT, AND IT GETS THE FULL REVEAL - the same
           whosthat ritual the spelled name gets (the ask-met path used to jump straight
           to winLevel behind a two-second pill, so the reveal "sometimes happened,
           sometimes did not" and the one line explaining it died under the win card -
           designer, on device). This is the bought-friend path's proven shape: burst,
           reveal, meet card - and closeMeet's checkEnd sees guestNamed and wins the
           round on the way out. */
        S.tutorWord = null;
        { const cb=document.createElement("div"); cb.className="chainburst";
          cb.textContent=(g.e||"🐾")+" "+gw.toUpperCase()+"!";
          $("boardwrap").appendChild(cb); setTimeout(()=>cb.remove(),1800);
          UI.confetti && UI.confetti(); Snd.fanfare && Snd.fanfare(); buzz([30,50,30,90]); }
        S.pendingReveal = g;                 // the resolve tail cashes this the moment it settles
        setTimeout(async ()=>{               // ...and if no resolve is coming, this does
          if(S && S.pendingReveal===g && !document.querySelector(".whosthat")){
            S.pendingReveal=null; await Game.reveal(g); } }, 600);
        return;
      }
    }
    // THE CEREMONY CONTRACT IS THE NAME, AND ONLY THE NAME. It used to be "beat the level
    // AND speak the name", which meant a player could spell RACCOON and still lose on
    // points. Reaching the target does not close a naming round; speaking the name does,
    // and it does so on its own.
    if(S.goal && S.goal.t!=="hush"){
      // an obstacle round asks ONLY for its obstacles - a 👑 gauntlet asks for BOTH lists.
      // THE NAME STILL COMES FIRST: a guest in the round outranks any other ask, so a
      // thaw round with a creature in it can never be cleared by melting ice alone.
      if(S.goal.have>=S.goal.need && (!S.goal2 || S.goal2.have>=S.goal2.need)){
        if(S.tutorWord){ UI.say("name-first", Game.meetAskLine(), 2); }
        else { Game.winLevel(); return; }
      }
    } else if(S.levelScore >= S.target){
      if(S.tutorWord){ UI.say("name-first", Game.meetAskLine(), 2); }
      else { Game.winLevel(); return; }
    }
    if(S.movesLeft <= 0 || boardFull()){ Game.failLevel(); return; }
    if(S.movesLeft <= 3) Snd.danger();
    boardEl.classList.toggle("danger", S.movesLeft<=3);
    // players kept dying with charged tools they'd forgotten - one gentle reminder per level
    if(S.movesLeft<=4 && !S.toolNudged){
      const freeBreeze = P.pow.swap>0, freeWish = P.pow.wild>0;
      if(freeBreeze || freeWish){
        S.toolNudged=true;
        const which = freeBreeze && freeWish ? "🍃 a breeze or a 🌟 wish" : freeBreeze ? "🍃 a breeze" : "🌟 a wish";
        UI.sky("psst - you still have "+which+"!");
        [freeBreeze&&"breezepill", freeWish&&"wishbtn"].filter(Boolean).forEach(id=>{
          const el=$(id); el.classList.add("pop"); setTimeout(()=>el.classList.remove("pop"),700); });
      } else if((P.amber||0)>=20){
        // THE MOMENT AMBER MATTERS. Free tools are gone, moves are running out, and there is
        // amber in your pocket - exactly when spending it feels worth it, and exactly where a
        // hoarder never learns they can. (A tester reached level 13 sitting on 279 amber,
        // having never spent one.) Tapping an empty pill already buys one for amber, so we
        // point straight at it - no menu, one tap.
        S.toolNudged=true;
        const canWish = (P.amber||0)>=25;
        UI.chip("🟠 your amber buys help - a fresh 🍃 breeze"+(canWish?" or 🌟 wish":"")+", just <b>tap it</b>");
        ["breezepill", canWish && "wishbtn"].filter(Boolean).forEach(id=>{
          const el=$(id); el.classList.add("pop"); setTimeout(()=>el.classList.remove("pop"),700); });
        Game.track("amber_nudge",{ amber:P.amber, L:S.level });
      }
    }
  },

  showAnnounce(cb){ // the doorstep beat: Alder reads what the round earned, page by page
    /* whatever is announced here counts against the round's one-new-thing budget, or one
       event still arrives as a stack: "something purrs", then Alder again, then the card */
    Game._announced = true;
    const items=P.annQ.splice(0); save();
    // items are {s,g,b,k} pages now; strings from an old save cannot be read and are let go
    Alder.pageSeq(items.filter(it=>it && it.s), cb);
    Snd.tone(523,{dur:.3,type:"sine",gain:.06,verb:true}); Snd.tone(784,{dur:.4,type:"sine",gain:.05,when:.2,verb:true});
  },
  async doubleThanks(){ // one tap, one reel, the same thanks again - then the button retires
    if(!S || !S._winAmber) return;
    const dbl=$("btn-double"); dbl.disabled=true;
    const ok=await Ads.show("double");
    if(!ok){ dbl.disabled=false; return; }
    Game.amber(S._winAmber); S._winAmber=0;
    dbl.style.display="none";
    UI.chip("🌟 the wood's thanks, doubled");
  },

  async winLevel(){
    S.won=true; S.busy=true;
    Game.track("level_win",{L:S.level, moves_left:S.movesLeft, goal:S.goal?S.goal.t:"hush"});
    // THE DOOR PAYS. Clearing a country's last level hands you the friend who answers the
    // country ahead - no calling, no spelling, no waiting. It is the only friend in the
    // game you are simply given, and it arrives exactly when it becomes useful.
    // finishing level 5 means the lessons are behind you FOR GOOD - the mark lives outside
    // the save file, so a wipe cannot make you sit through them a second time
    if(S.level>=5) UI.markTutorialSeen();
    { const key=KEYSTONE[advOf(S.level)];
      if(key && GROVE_BY_WORD[key] && !P.grove[key]){
        /* P.grove says a friend exists; P.metGrove says it is yours - it is what the Book
           renders and what a seat accepts, and it is written when a MEETING closes. A
           keystone has no meeting; its own card says "no meeting needed". So the worm was
           handed over, counted on the cover, and was in no Book and on no bench. */
        P.grove[key]=Date.now(); P.metGrove[key]=Date.now(); S.newGrove.push(key);
        delete P.nameFails[key]; P.quietLvls=0;
        /* THE DOOR IS THE COUNTRY'S BIGGEST GIFT and it was a silent grant inside the win
           sequence - nobody ever SAW a keystone work (designer, before the batch). It
           speaks now at the doorstep, ahead of the next country's chapter card, and the
           meet ritual follows as its second beat. */
        const kg=GROVE_BY_WORD[key];
        P.annQ=P.annQ||[];
        P.annQ.push({ k:"door-"+key, b:(UI.artTag(key)||kg.e),
          /* this was two sentences of atmosphere and no information - "one of the wood's keepers
           before the hush" tells a player nothing about the creature now on their bench. The
           guidance line states the power, read from the friend's own card so it cannot drift. */
          s:"The door opens, and the <b>"+key.toUpperCase()+"</b> comes through with you. It knows the country ahead.",
          g:"🗝️ <b>"+key.toUpperCase()+"</b> joins you - no meeting needed. "
            +(kg.pd ? kg.pd.charAt(0).toUpperCase()+kg.pd.slice(1)+"." : "")+" +25 🟠" });
        save();
        Game.track("keystone",{w:key, L:S.level});
        Game.amber(25);
      } }
    // stars scale with the level's OWN budget (not an absolute count), so a tight
    // level's 3★ stays earnable: clear with ~30% of your moves spare for gold.
    const mv=MOVES(S.level);
    S.stars = S.movesLeft>=Math.ceil(mv*0.30) ? 3 : S.movesLeft>=Math.ceil(mv*0.12) ? 2 : 1;
    if(S.bearCarried) S.stars=1;   // 🐻 carried, not conquered - one star, warmly given
    // the cat's calling IS clearing level 3 - the achievement announces in the win
    // sequence, never over something the player is reading mid-game
    if(S.level===3 && !P.grove.cat && !P.called.cat){
      P.called.cat=1; P.summon="cat";
      P.annQ.push({ k:"ann-cat-call", b:(UI.artTag("cat")||"🐱"),
        s:CALLINGS.cat.s, g:"🐾 Meet them next round." }); save();
    }
    // THE TAPS GROW WITH THE SINKS. A flat 10+stars*5 forever meant scaling grace prices
    // would have priced the late game out of its own economy.
    // A BOUGHT ROUND PAYS NOTHING. Without this the win bonus came straight back out of
    // the purse the friend was just bought with - 90 charged, 20 refunded, and the price
    // on the button was a lie by 22%.
    S._winAmber = S._boughtWin ? 0
      : 10 + (S.stars||1)*5 + Math.floor(Math.max(0,advOf(S.level))/25)*5;
    Game.amber(S._winAmber + (Shop.blessed() ? S._winAmber : 0));  // 🕯️ blessed pay comes doubled
    Game.tallyEv("win"); Game.tallyEv("regionwin"+biomeOf(S.level));
    if(S.stars===3) Game.tallyEv("star3");
    if(S.movesLeft>=10) Game.tallyEv("bigwin");
    if(S.movesLeft<=2) Game.tallyEv("closewin");
    // the pity floor: a LONG quiet stretch (the new pace already leaves ~5 quiet levels
    // between friends, so pity waits for 6) and the wood sends the next DUE friend on its
    // own - but only one whose level has actually come, so mercy can never outrun the pace.
    if(P.metGrove.cat){
      if(S.newGrove.length || P.summon || P.summonQ.length) P.quietLvls=0;
      else if(Object.keys(P.grove).length<10 && ++P.quietLvls>=6){
        const plv=advOf(P.level);
        const next=CALLING_ORDER.find(w=>!P.called[w] && !P.grove[w] && CALLINGS[w].t!=="school" && plv>=(CALLINGS[w].minL||0));
        if(next){ P.called[next]=1; P.summonQ.push(next); P.quietLvls=0; P.lastSummonL=plv;
          P.annQ.push({ k:"ann-curious", b:"🌿",
            s:"The wood has grown curious about you. I heard a name trying to remember itself.",
            g:"🐾 A name will hide in a coming level - watch for the meeting." }); save(); }
      }
      save();
    }
    const bonus = S.movesLeft*5;
    if(bonus){
      for(let i=0;i<S.movesLeft;i++){
        setTimeout(()=>{ S.levelScore+=5; Snd.tone(880+i*60,{dur:.08,type:"square",gain:.05}); UI.hud(); }, i*90);
      }
      await wait(S.movesLeft*90+250);
    }
    P.level++; P.stats.wins++; P.stats.stars=(P.stats.stars||0)+S.stars; P.run=null;
    if(S.bestWordPts>0) P.bestWord=S.bestWord;
    P.stats.bestChain=Math.max(P.stats.bestChain,S.maxChain);
    save(); // friends are only EARNED by spelling their name - no random gifting
    if(S.milestone) Game.cheer(3); // 👑 milestones send the pets wild
    Snd.levelUp(); UI.confetti(); buzz([50,50,120]);
    if(S.milestone) setTimeout(()=>UI.confetti(), 400);
    await wait(500);
    /* THE WIN COMES FIRST. The whisper used to interpose between winning and the win
       card - you beat the level and the wood spoke over your stars (caught twice in the
       replay). Announcements now wait for the NEXT round's doorstep: nextLevel drains
       them before the level card, which is a true boundary. */
    UI.endCard(true);
  },

  failLevel(){
    /* 🐻 NOT YOUR FAULT. If the bear is on duty and awake, the round is not lost - it is
       CARRIED. The bear steps forward, shoulders it (cleared, one star), and hibernates:
       fifty of your words hum it awake, and its seat stays warm for two rounds. No
       threshold, no fine print - the cost is an empty seat, which is the same currency
       the whole pipeline runs on. A ceremony is the one thing it cannot carry: a name
       must be spoken, not shouldered. */
    if(!S.tutorWord && !S.bearCarried && !P.bearRest && UI.equipped().some(g=>g&&g.w==="bear")){
      Game.track("bear_carried",{ L:S.level, goal:S.goal?S.goal.t:"hush",
        short:Math.max(0, S.target-S.levelScore) });
      P.equip=(P.equip||[]).filter(w=>w!=="bear");
      P.bearRest={ need:50, have:0, seatWarmUntil:(advOf(S.level)||0)+2 }; save();
      S.bearCarried=true;
      Game.winLevel();
      return;
    }
    Game.track("level_fail",{ L:S.level, goal:S.goal?S.goal.t:"hush", ceremony:S.tutorWord||"",
      why: S.movesLeft<=0 ? "out_of_moves" : "board_full",
      short: Math.max(0, S.target-S.levelScore), target:S.target, got:S.levelScore,
      words:S.wordsMade||0, amber:(typeof P!=="undefined"?P.amber:0)||0 });
    /* LOSING A DOOR COSTS THREE LEVELS, NOT THE RUN. You keep every friend, every growing
       and every coin - you walk back three, and those three are exactly where a calling
       finishes and the friend you were missing finally arrives. The wood is not punishing
       you; it is telling you what to go and fetch.
       Three, not one: at one you bounce straight back into the same door with nothing
       changed, which is a treadmill rather than a lesson. And the practice gate at L10
       costs nothing at all - it exists to teach what a gate IS, at zero stakes. */
    { const g=gateAt(S.level);
      if(g && !g.free && P.level>3){
        S._pushedBack=Math.min(3, P.level-1);
        P.level=Math.max(1, P.level-S._pushedBack); save();
        Game.track("gate_pushback",{ L:S.level, back:S._pushedBack, gate:g.n });
      } }
    // a letdown at a ceremony is counted - after two, the wood starts lending letters
    if(S.tutorWord){ P.nameFails[S.tutorWord]=(P.nameFails[S.tutorWord]||0)+1; }
    S.over=true; P.run=null;
    P.stats.bestChain=Math.max(P.stats.bestChain,S.maxChain);
    save();
    Snd.fail(); buzz([80,60,150]);
    UI.endCard(false);
  },

  /* ══ THE PRICE OF GRACE ══ every cost in one place, so the economy can be read and
     tuned as a whole rather than hunted for across the file.
     The step is every 40 levels and caps at 4x: a flat price was a real decision at
     level 3 and pocket change at level 200. */
  graceScale(){ const A=Math.max(1, advOf(S?S.level:1));
    return Math.min(4, 1 + Math.floor(A/40)*0.5); },
  graceCost(kind){
    const k=Math.round.bind(Math), x=Game.graceScale();
    if(kind==="moves")  return k(25*x);
    if(kind==="retry")  return k(35*x);
    if(kind==="letter") return k(15*x);
    if(kind==="friend"){
      // priced by WHICH friend: the calling order is sorted by how hard the name is,
      // so the ones the wood makes you work for cost the most to skip.
      const rank=Math.max(0, CALLING_ORDER.indexOf(S&&S.tutorWord));
      return k((90 + rank*6) * x); }
    return 0;
  },
  canAfford(kind){ return (P.amber||0) >= Game.graceCost(kind); },

  /* ══ THE FIRST ONE IS ON THE WOOD ══ one free save of each kind per LEVEL, so a
     near-miss never costs anything and the SECOND is where the choice starts.

     Stamped on P with the level it was spent on, NOT on S. S is per-round state and
     retryLevel builds a fresh one, so keeping it there handed back a new free retry on
     every retry - the free save was infinite and nothing was ever bought. Stamping the
     level means it survives a retry and clears itself when the level changes, with no
     cleanup to remember anywhere. */
  freeLeft(kind){
    const g=P.graceUsed, L=S?S.level:0;
    return !(g && g.lvl===L && g[kind]);
  },
  spendGrace(kind){
    const L=S?S.level:0;
    if(Game.freeLeft(kind)){
      if(!P.graceUsed || P.graceUsed.lvl!==L) P.graceUsed={lvl:L};
      P.graceUsed[kind]=1; save();
      Game.track("grace_spent",{ kind, cost:0, free:true, L });
      return true;
    }
    const c=Game.graceCost(kind);
    if((P.amber||0) < c) return false;
    Game.amber(-c);
    Game.track("grace_spent",{ kind, cost:c, L, left:P.amber });
    return true;
  },

  async extraMoves(){ // the first is on the wood, every one after is bought
    if(!S) return;
    // the ad still stands in for the FREE one where it is offered
    if(Game.freeLeft("moves") && Ads.ready() && !Shop.blessed() && P.level>=8){
      const ok=await Ads.show("revive"); if(!ok) return;
    }
    if(!Game.spendGrace("moves")) return;
    S.revived=true;
    S.over=false;
    $("ov-end").classList.remove("active");
    S.movesLeft += 5;
    Snd.levelUp(); UI.confetti(); buzz([40,60,40]);
    boardEl.classList.toggle("danger", S.movesLeft<=3);
    UI.all(); saveRun();
  },

  share(){
    const txt="🌲 Hushwood - "+levelLabel(S.level)+" · "+S.levelScore+" pts · 👑 best word "+(S.bestWord||"-")+"\nplay: sarfrazbaig.github.io/word-drop";
    if(navigator.share){ navigator.share({text:txt}).catch(()=>{}); }
    else if(navigator.clipboard){ navigator.clipboard.writeText(txt); UI.chip("copied ✓"); }
  },

  /* ---- the BREEZE: the player's own hands-on tool. pets act on their own; the wind is YOURS. ---- */
  /* ══ BUYING A TOOL, WITH THE PLAYER'S CONSENT ══ the empty pill opens this card instead of
     reaching into the purse. Same tap, different question, and the answer is always theirs. */
  TOOL_PRICE:{ swap:20, wild:25 },
  askBuy(kind){
    if(!S || S.over || S.won) return;
    const cost=Game.TOOL_PRICE[kind], have=P.amber||0, poor=have<cost;
    UI._buyKind=kind;
    $("buy-icon").textContent   = kind==="swap" ? "🍃" : "🌟";
    $("buy-title").textContent  = kind==="swap" ? "Another breeze?" : "Another wish?";
    /* SAY WHAT IT DOES, not who is selling it. "the wood will sell you one" tells a
       player nothing they can act on at the moment they are deciding to spend. The
       point of sale is the worst place in the game to be atmospheric: name the tool,
       name what it does, and for the short-of-amber case say exactly how to get more. */
    $("buy-body").innerHTML     = poor
      ? "you need <b>"+(cost-have)+" more</b> 🟠 - amber comes from clearing troubles and finishing rounds"
      : (kind==="swap" ? "you have no breezes left. A breeze <b>swaps any two letters</b> on the board."
                       : "you have no wishes left. A wish <b>turns your letter into any letter</b> you choose.");
    $("buy-cost").textContent   = cost;
    $("buy-have").textContent   = have;
    $("ov-buy").classList.toggle("poor", poor);
    $("ov-buy").classList.add("active");
    Snd.tone(700,{dur:.1,type:"sine",gain:.05,verb:true});
  },
  closeBuy(){ $("ov-buy").classList.remove("active"); UI._buyKind=null; },
  confirmBuy(){
    const kind=UI._buyKind; if(!kind) return;
    const cost=Game.TOOL_PRICE[kind];
    if((P.amber||0) < cost){ Snd.reject(); buzz(30); return; }
    Game.amber(-cost);
    P.pow[kind]=(P.pow[kind]||0)+1; save();
    /* YOU BOUGHT IT TO USE IT. It granted the tool, closed the card and stopped - so the
       player tapped the board expecting to be in breeze mode and nothing happened. Reported
       by the owner playing his own build, and visible in the logs as repeat buys.
       Arming it immediately also removes the need to say anything: the board changing state
       under your thumb is the receipt. The chip that used to announce the purchase is gone
       with it - it was the game reading its own counter aloud.
       (The old chip also carried a U+2212 MINUS SIGN, which is not on a keyboard either.) */
    if(kind==="swap"){ UI.breezePill(); Snd.tone(880,{dur:.1,type:"triangle",gain:.06}); }
    else             { UI.wishPill();   Snd.tone(1046,{dur:.1,type:"sine",gain:.06}); }
    Game.track("tool_bought",{ kind, cost, left:P.amber });
    buzz(15);
    Game.closeBuy();
    if(kind==="swap") Game.armBreeze(); else Game.openWish();
  },
});
