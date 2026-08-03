Object.assign(Game, {

  recordWord(word, points, chain, shape){
    shape = shape || {};
    FT.signal("wordCleared", word);
    /* 🐻 your words hum the hibernating bear awake - the only clock is real play, so a
       quick thrown round cannot cheese it and a long careful one is never punished. */
    if(typeof P!=="undefined" && P.bearRest){
      P.bearRest.have=(P.bearRest.have||0)+1;
      if(P.bearRest.have>=P.bearRest.need){ P.bearRest=null; save();
        P.annQ=P.annQ||[]; P.annQ.push({ k:"ann-bearwake", b:(UI.artTag("bear")||"🐻"),
          s:"The bear wakes under the big tree - rested, and proud of you.",
          g:"🐻 Ready to be asked again. Its seat is still warm." }); }
    }
    /* THE ROUND REMEMBERS WHAT IT SAID. S.wordsMade was a count, so nothing could ask what
       came before - no echo, no "you said that already", no rhythm of any kind. */
    S.said = S.said || [];
    S.said.push({ w:word.word, n:word.cells.length, pts:points, chain,
                  by: S.petActing ? "pet" : "player",
                  dir:shape.dir||null, twin:!!shape.twin, held:!!shape.held, gilded:!!shape.gilded });
    // the shape travels to the sheet too, so the next playtest can measure the four tastes
    // that were drafted on judgement because the engine used to discard them
    Game.track("word_made", { w:word.word, n:word.cells.length, pts:points,
      chain, by: S.petActing ? "pet" : "player", L:S.level,
      dir:shape.dir||null, twin:!!shape.twin, held:!!shape.held, gilded:!!shape.gilded });
    P.stats.words++;
    Game.tallyEv("words");
    // THE FOX'S TRAIL. Points are what its Gilded Trail multiplies, so points are what
    // it listens for. Guarded above zero because a gate can zero a word's pay, and
    // tallyEv treats a zero as a one.
    if(points>0) Game.tallyEv("score", points);
    const wl=word.cells.length;
    // A FRIEND'S OWN WORD DOES NOT WAKE ANYBODY. S.petActing was tracked and then used
    // only for telemetry, so a word the dog built counted toward the dog's own two-word
    // trigger - it acted, and by acting earned its next act. The wakes belong to the
    // player's play; a friend's work is the reward, not another turn of the crank.
    // …and ONLY the wakes are withheld. A friend's word is still a word: it still counts
    // toward callings, still fills the round's word count, still unlocks a name. What it must
    // not do is buy the next act. An early return here would have taken all of that with it.
    /* A FRIEND'S WORD IS A WORD. The guard above used to be `if(!S.petActing)`, which kept
       a friend from earning its own next act - right - but also silenced its word for
       everybody else, which is the whole reason no party ever became a machine. Now the
       word speaks, and only its MAKER is deaf to it. S.petActor carries who that is. */
    {
      const maker = S.petActing ? S.petActor : null;
      const sees = (sign, k) => Game.sees(sign, k, maker);
      // WORD-SHAPED WAKES. Longer counts as shorter - a five-letter word satisfies a friend
      // waiting on four - so reaching further never costs you a wake you had already earned.
      sees("anyWord");
      /* WAS wl===3, AND IT PUNISHED GOOD PLAY. word4 and word5 have always been "or more",
         so a five-letter word feeds both of them - but word3 wanted EXACTLY three, so the
         same five-letter word fed the cat nothing. Twelve of the fifty friends listen on
         word3; a player who makes long words was starving a quarter of the roster, and the
         better they played the worse it got. The owner hit exactly this: cleared levels with
         long words, the cat never woke, so the dog never arrived, so the first seven levels
         felt like a grind. It was not pacing, it was this line.
         Now it is a ladder that never punishes you for climbing it: any word feeds word3,
         four or more also feeds word4, five or more also feeds word5. */
      if(wl>=3) sees("word3");
      if(wl>=4)  sees("word4");
      if(wl>=5)  sees("word5");
      if(/[qzxjv]/.test(word.word)) sees("rare");
      // …and the first sign about the word rather than the board
      if(isMirror(word.word)) sees("mirror");
      /* THE SHAPE SIGNS. All four of these were computed and thrown away: the word knew its
         direction, whether it arrived with a sibling, whether you had held it and whether it
         spent gold, and nothing could listen for any of it. */
      if(shape.dir==="up") sees("rising");
      if(shape.twin) sees("twin");
      if(shape.held) sees("held");
      if(shape.gilded) sees("gilded");
      if(FOOD.has(word.word)) sees("food");
      if(WEATHER.has(word.word)) sees("weather");
      if(nestedWord(word.word)) sees("nested");
      if(/(.)\1/.test(word.word)) sees("doubled");
      if(GROVE_BY_WORD[word.word]) sees("truename");
      // a word that starts where the last one stopped
      { const prev=(S.said||[])[(S.said||[]).length-1];
        if(prev && prev.w && prev.w.slice(-1)===word.word[0]) sees("echo"); }
    }
    Game.tallyEv(wl>=6?"word6":"word"+wl);
    if(/[qzxjv]/.test(word.word)) Game.tallyEv("qzxjv");
    S.wordsMade=(S.wordsMade||0)+1;
    // words no longer feed a shared meter - Game.sees() above already woke whichever
    // friends were counting this word's shape
    if(Game.petActives().length && !S.petActing) UI.petMeter();
    // the grove and the daily word must be EARNED: only words YOU made (chain 1 count).
    // A friend is UNLOCKED here but you MEET them (the ritual) at the start of the next round.
    if(chain===1){
      let g = GROVE_BY_WORD[word.word];   // let - the ceremony guest can claim the word below
      // THE CEREMONY HEARS GENEROUSLY: any word CONTAINING the guest's name speaks
      // it - CATS honours CAT (a real player spelled CATS and watched nothing happen).
      // Organic wakes stay exact-match, so BEEF can never wake the bee.
      const guest = S.tutorWord && !P.grove[S.tutorWord] && word.word.includes(S.tutorWord)
        ? GROVE_BY_WORD[S.tutorWord] : null;
      if(guest) g = guest;
      if(g && !P.grove[g.w]){
        /* THE ASK IS THE GATE, EVERYWHERE. Spelling the guest's name used to wake it on
           the spot - and with the board pre-staged toward that name, the old ceremony
           survived in practice: the designer spelled DOG on a served platter and the
           round ended with the ask untouched (caught on the live deploy). A spelled name
           during a meeting is now a warm moment, never a key: the friend answers, and
           asks for the loving. The ask met (or the pity) is the only way in. */
        const meetGated = S.tutorWord===g.w && !Game.courted(g.w) && (P.nameFails[g.w]||0)<2;
        if(meetGated && !S._nameTeased){
          S._nameTeased=true; Game.amber(3);
          UI.petSay((UI.artTag(g.w,"toastimg")||g.e)
            +" perks up at its own name! <b>+3 🟠</b> - now <b>show it the thing it loves</b>");
        }
        const awake = (!!guest || P.called[g.w]) && !meetGated;
        if(awake){
          P.grove[g.w]=Date.now();
          S.newGrove.push(g.w);
          delete P.nameFails[g.w];             // all is forgiven the moment it wakes
          Game.track("wake",{w:g.w, L:S.level});
          if(guest){
            S.tutorWord=null;
            S.guestNamed=true;   // the round's whole contract, met
            // the naming gift: the wood pays +5 a letter, so the ceremony funds the level
            S._revealBonus=g.w.length*5;
            S.levelScore+=S._revealBonus; UI.hud();
          }
          if(P.summon===g.w) P.summon=null;   // the summons is answered
          P.quietLvls=0; save();
          Game.amber(25);                      // a name spoken is the richest moment there is
          S.pendingReveal=g;                   // 🎭 who's-that - fires once this resolve settles
          Game.cheer(2);
          // level 4's lesson has no second act: the moment the cat wakes, the round is won
          if(S.level===4 && g.w==="cat"){ S.levelScore=Math.max(S.levelScore,S.target); UI.hud(); }
          Game.checkCallings();                // the goat counts its kindred as the grove grows
        } else if(P.metGrove.cat){
          /* SAY THE REAL REASON. This always quoted the lifetime calling - "wake it: clear
             150 words (0/150)" - which since the map arrived is usually not why nobody
             answered. Spell FLY in the Bramblewood and the fly is two countries away; being
             told to clear a hundred and fifty words sends you off to grind something that
             was never the obstacle. A name spoken where its owner cannot hear it should say
             so, and name the place, because the place is now the answer. */
          const home = HOME[g.w];
          const c=CALLINGS[g.w];
          const pr=Game.callProgress(g.w);
          let why;
          if(Object.values(KEYSTONE).includes(g.w))
            why = "it waits at a door further on";
          else if(home && !Game.canHear(g.w))
            why = "it lives in <b>"+(BIOME_NAMES[home[0]]||"a country further on")+"</b>, too far to hear you";
          else {
            const ct = Game.courtship(g);
            why = ct ? "spell <b>"+ct.n+" "+signNounN(ct.sign,ct.n)+"</b> in one round and it will"
                     : c.c+" ("+pr.have+"/"+pr.n+")";
          }
          /* "is a true name - but nothing answers yet" is a riddle in the one moment a
             player has done something clever and wants to know why it did not work. Say
             that the creature exists and what stands between them and it. */
          UI.say("stir-"+g.w, "🌫️ <b>"+g.w.toUpperCase()+"</b> is a creature's name, but it cannot join you yet.<br><small>"+why+"</small>", 2);
        }
      }
      const day=Math.floor(Date.now()/864e5);
      if(word.word===dailyWord() && P.dailyWordDay!==day){
        P.dailyWordDay=day;
        Game.tallyEv("daily");
        Snd.levelUp(); UI.confetti(); buzz([40,60,40,90]);
        const b=document.createElement("div"); b.className="lvlbanner"; b.textContent="📅 ✨ "+word.word.toUpperCase()+" ✨";
        $("app").appendChild(b); setTimeout(()=>b.remove(),2350);
        Game.cheer(Game.petNeed()); // the daily word fills the paw meter outright
      }
    }
    if(!P.questDone){
      const q=dailyQuest();
      if(q.type==="words") P.questProgress++;
      else if(q.type==="letters") P.questProgress+=word.cells.length;
      else if(q.type==="points") P.questProgress=Math.min(q.target,P.questProgress+points);
      else if(q.type==="long") P.questProgress += word.cells.length>=4 ? 1 : 0;
      if(P.questProgress>=q.target){ P.questProgress=q.target; P.questDone=true; Game.cheer(Game.petNeed()); UI.pillPop("quest"); Game.amber(15); }
    }
    save();
    UI.cozy();
  },

  async explode(bomb){
    await wait(120);
    Snd.bomb(); buzz([40,30,90]);
    $("boardwrap").classList.add("shake"); setTimeout(()=>$("boardwrap").classList.remove("shake"),450);
    const {r,c}=bomb;
    const sw=document.createElement("div"); sw.className="shockwave"; // it should FEEL like a bomb
    sw.style.width=CELL*2+"px"; sw.style.height=CELL*2+"px";
    sw.style.left=(c*STEP+CELL/2-CELL)+"px"; sw.style.top=(r*STEP+CELL/2-CELL)+"px";
    boardEl.appendChild(sw); setTimeout(()=>sw.remove(),600);
    for(let rr=r-1;rr<=r+1;rr++) for(let cc=c-1;cc<=c+1;cc++){
      if(rr<0||rr>=ROWS||cc<0||cc>=COLS) continue;
      const t=S.board[rr][cc]; if(t){ Game.creditTile(t); removeTile(t); }
    }
    S.levelScore += 10; UI.hud();
    await wait(340);
    return await Game.gravity();
  },

  async stirShifters(){
    const shifts=Object.values(S.tiles).filter(t=>t.kind==="shift");
    if(!shifts.length) return;
    shifts.forEach((t,i)=>{
      setTimeout(()=>{
        t.inner.classList.add("shiftspin");
        Snd.tone(600+i*120,{dur:.14,type:"triangle",gain:.06,verb:true});
        setTimeout(()=>{
          t.letter=drawLetter();
          t.inner.innerHTML = t.letter.toUpperCase()+"<small>"+VAL[t.letter]+"</small>";
        },270);
        setTimeout(()=>t.inner.classList.remove("shiftspin"),560);
      }, i*110);
    });
    await wait(shifts.length*110+620);
    S.chain=1;
    // only words the SHIFTERS changed may clear - an unfocused resolve would also pop
    // held words sitting quietly elsewhere on the board, and held words are a promise
    await Game.resolve(shifts);
  },

  async jackpot(len){
    Game.tallyEv("jackpot"); // 🎆 a 5-6+ letter word is the rarest feat in the game - pay it like a slot machine
    const title = len>=8 ? "MYTHICAL!" : len>=7 ? "LEGENDARY!" : len>=6 ? "SPECTACULAR!" : "SPLENDID!";
    Snd.fanfare(); buzz([40,60,40,60,140]);
    const jb=document.createElement("div"); jb.className="jackpotburst"; jb.textContent=title;
    $("boardwrap").appendChild(jb); setTimeout(()=>jb.remove(),2400);
    const fl=document.createElement("div"); fl.className="goldflash";
    $("app").appendChild(fl); setTimeout(()=>fl.remove(),900);
    UI.confetti(); setTimeout(()=>UI.confetti(),350); if(len>=6) setTimeout(()=>UI.confetti(),700);
    for(let i=0;i<14;i++){ const s=document.createElement("div"); s.className="petal"; s.textContent="✨";
      s.style.left=Math.random()*100+"%"; s.style.top="0";
      s.style.setProperty("--fall",(boardEl.clientHeight*0.9+Math.random()*30)+"px");
      s.style.animationDuration=(1.0+Math.random()*0.8)+"s"; s.style.animationDelay=(Math.random()*0.5)+"s";
      boardEl.appendChild(s); setTimeout(()=>s.remove(),2400); }
    // the whole party goes wild, the paw meter fills, and the garden showers you with tools
    for(let s=0;s<4;s++){ const el=$("pet-"+s); if(el && el.classList.contains("has")){
      el.classList.remove("happy"); void el.offsetWidth; el.classList.add("happy"); } }
    Game.cheer(Game.petNeed());
    Game.earnBreeze(); if(len>=6){ Game.earnWish(); }
    await wait(900);
  },

  /* 🌱 THE GRACE - one rule for every word you make. Any word YOU form - by drop or
     by tool - lights up and waits a breath (P.breathMs, the menu's 1-5s setting).
     TAP ANYWHERE and the board keeps it for you to build bigger; do nothing and it
     blooms, points and all. The invitation lives in the word banner at the board's
     top («"EAT" · tap to hold» with the draining clock line). There is NO hurry
     gesture anymore - it was the opposite verb on the same surface as holding;
     speed lives in the breath setting now.
     Three things never pause, each because pausing would break a promise:
     cascades (they are the game paying you), an undiscovered true name (the
     creature must wake - held, CAT could become CATS and the cat never met),
     and your last move (holding it would be a loss you didn't choose). */
  async grace(words){
    const cells=[...new Set(words.flatMap(w=>w.cells))];
    cells.forEach(t=>t.inner.classList.add("lit"));
    // one frame per WORD, drawn over its whole run - a word is one thing, not a row of
    // separately-caged letters. Works for any length, across or down.
    const boxes=words.map(w=>{
      const rs=w.cells.map(t=>t.r), cs=w.cells.map(t=>t.c);
      const r0=Math.min(...rs), r1=Math.max(...rs), c0=Math.min(...cs), c1=Math.max(...cs);
      const bx=document.createElement("div"); bx.className="wordbox";
      bx.style.left=(c0*STEP-4)+"px";  bx.style.top=(r0*STEP-4)+"px";
      bx.style.width=((c1-c0)*STEP+CELL+8)+"px";
      bx.style.height=((r1-r0)*STEP+CELL+8)+"px";
      boardEl.appendChild(bx); return bx;
    });
    const noHold = !!(S.guide && S.guide.noHold);   // a lesson beat that must end in a bloom
    /* 🌱 TAP-ANYWHERE HOLD (2026-08-01, the data-driven redesign). The bubble button
       is gone: during the breath the WHOLE SCREEN is the hold surface. The export
       showed fingers already live on the board in this window (264 board-taps inside
       the old 2s pause) and that 21 of 31 players pressed the old button but never
       adopted it - a 2-second race to a 92px capsule. The word banner at the board's
       top carries the invitation; tapping anywhere keeps the word. Tap-to-hurry is
       REMOVED with it: it was the opposite verb on the same surface, and speed now
       belongs to the breath setting (menu, 1-5s) instead of a gesture. */
    const mustHold = S.guide && S.guide.mustHold;   // lesson 3: waits for the tap itself
    /* a lesson is the only window in which the thing being taught is on screen, and two
       seconds is not long enough to read a sentence you have never seen. It still clears on
       its own, so nothing can stall - it just waits long enough to be read. */
    const breath = S.guide ? Math.max(6000, P.breathMs||2000)
                           : Math.max(1000, Math.min(5000, P.breathMs||2000));
    const banner=document.createElement("div");
    banner.className="wordbanner breath"+(noHold?" nohold":"");
    banner.innerHTML = noHold ? '🌸 clearing…'
      : '<b>'+words.map(w=>w.word.toUpperCase()).join(" · ")+'</b>'
        +'<span class="wb-tap">'+(mustHold?'tap anywhere to keep it':'tap anywhere to hold')+'</span>'
        +(mustHold?'':'<i class="wb-clock" style="animation-duration:'+breath+'ms"></i>');
    boardEl.appendChild(banner);   // inside the board frame - cannot collide with HUD or pills
    Snd.tone(1046,{dur:.3,type:"sine",gain:.05,verb:true}); Snd.tone(1318,{dur:.4,type:"sine",gain:.04,when:.15,verb:true});
    /* ACTION FIRST. The bar shows the first clause and puts the rest in the window, so a
       line written "here is the situation - here is what to do" lands with the situation
       on screen and the instruction hidden. Every teaching line leads with the verb. */
    if(!S.guide) UI.say("grace", "<b>tap anywhere</b> to keep these letters - then build a longer word from them", 2);
    if(Alder.cur) Alder._preempt();   // RULE ZERO by direct call - the breath owns the moment
    FT.signal("graceShown",{bubble:banner,words});
    let held=false;
    // the whole screen holds - except the controls that keep their own jobs.
    // THE TAP IS SPENT BY THE HOLD: once it means "keep the word" it must never
    // also mean "drop a tile" - the gesture is swallowed whole (down, up and click),
    // exactly as the old bubble swallowed its own taps. Without this, holding on
    // the board dropped the next letter with the same finger (caught by designer).
    const EXEMPT="#game-menu-btn,#home-menu-btn,#breezepill,#wishbtn,#menu-panel,#menu-scrim,#ov-debug,.overlay.active";
    const swallow=e=>{ e.stopPropagation(); e.preventDefault(); };
    const bornAt=Date.now();
    const breathTap=e=>{
      if(noHold) return;
      /* the breath opens the instant a word forms, so a player tapping at their own speed
         had their NEXT drop land inside the window and silently hold a word they meant to
         clear. 220ms is under a deliberate second tap and over a fast one. */
      if(Date.now()-bornAt < 220){ swallow(e); return; }
      if(e.target && e.target.closest && e.target.closest(EXEMPT)) return;
      held=true; swallow(e);
      ["pointerup","click"].forEach(ev=>
        document.addEventListener(ev, function once(x){ swallow(x);
          document.removeEventListener(ev, once, true); }, true));
    };
    document.addEventListener("pointerdown", breathTap, true);
    for(let i=0, n=Math.round(breath/100); mustHold ? !held : (i<n && !held); i++) await wait(100);
    document.removeEventListener("pointerdown", breathTap, true);
    if(!held && !noHold) Game.tallyEv("breathto");   // resolved untapped - the adoption instrument
    banner.remove();
    setTimeout(()=>Alder._pump(), 400);   // the wood may speak again
    boxes.forEach(bx=>bx.remove());
    cells.forEach(t=>t.inner.classList.remove("lit"));
    if(held){
      // HOLDING SPENDS THE WORD. The letters stay, but as plain material - each tile
      // remembers the word it was held as, and that exact word can never resolve from
      // those exact tiles again. Without this, a held WIT re-cleared against the
      // player's will the moment a cascade jostled it (they were saving it for WITH,
      // made BOX nearby, and watched both pop as a "double word"). Only a BIGGER word
      // that includes an extra tile can cash these letters in now. No glow, no marker:
      // the player was told they're normal letters, so they must look like it too.
      Game.tallyEv("hold");
      words.forEach(w=>w.cells.forEach(t=>{ if(S.tiles[t.id]) t.heldWord=w.word; }));
      if(!S.guide) UI.say("hold-saved", "🌱 <b>kept</b> - build a longer word from these letters");
      Snd.tone(660,{dur:.14,type:"triangle",gain:.06,verb:true}); buzz(12);
      FT.signal("held");
      // the queued tile was drawn before this word existed and is blind to it -
      // redraw it so the deck can offer a letter that finishes what you kept
      if(S.next && S.next.kind==="normal" && !S.next.pin){ S.next=makePiece(); UI.piece(); }
    }
    return held;
  },

  async toolResolve(focus){ S.playerMove=true; S.chain=1; try{ await Game.resolve(focus); } finally{ S.playerMove=false; } },

  /* THE RITUAL IS OWED, WHATEVER SPELLED IT. A name can be completed by a drop, a
     breeze swap, a pluck, a pet's power, a restless tile, or a cascade off thawing ice -
     but for a long time only drop() ever cashed in S.pendingReveal. Every other route
     woke the creature silently and it turned up as a Book page a round later (a tester
     spelled MOTH with their last hand and never met it). The debt is settled HERE, at
     the outermost resolve, so no present or future path can forget it. */
  async resolve(focus){
    S._rdepth=(S._rdepth||0)+1;
    try{ await Game._resolve(focus); }
    finally{
      S._rdepth--;
      if(S._rdepth===0 && S.pendingReveal){          // cascades finish first, then the ceremony
        const rg=S.pendingReveal; S.pendingReveal=null;
        await Game.reveal(rg);
      }
    }
  },
  async _resolve(focus){
    let words = findWords();
    // AUTHORED clears: every pass only clears words involving tiles that just changed -
    // the tile you placed or moved, then (in cascades) tiles that fell or thawed.
    // The game must never "spell words for you" out of static leftovers.
    if(focus && focus.length){
      words = words.filter(w=>w.cells.some(c=>focus.includes(c)));
    }
    // a held word is SPENT: if every one of its tiles was held as exactly this word,
    // it may never resolve again - not from a cascade jostling it, not from a shifter,
    // not from re-forming after a tumble. An extra tile makes it a new, bigger word.
    words = words.filter(w=>!w.cells.every(c=>c.heldWord===w.word));
    if(!words.length) return;
    // the grace: every word the player makes waits a breath (see Game.grace above)
    if(S.chain===1 && S.playerMove && !(S.guide && S.guide.noGrace)){ // lesson 1 teaches the drop ALONE
      const urgent = S.movesLeft<=0
        || words.some(w=>(GROVE_BY_WORD[w.word] && !P.grove[w.word] && P.called[w.word])
          || (S.tutorWord && !P.grove[S.tutorWord] && w.word.includes(S.tutorWord)));
      if(!urgent && await Game.grace(words)) return;   // held - the board keeps it
    }
    S.clearedThisDrop = true;
    if(S.chain>=2){
      Game.tallyEv("chain"); if(S.chain>=3) Game.tallyEv("chain3");
      const cb=document.createElement("div"); cb.className="chainburst";
      cb.textContent="CHAIN ×"+S.chain+"!";
      $("boardwrap").appendChild(cb); setTimeout(()=>cb.remove(),1650);
      Snd.chainBig(S.chain); buzz([30,40,30,80]);
      if(S.chain>=3) UI.confetti();
      await wait(400);
    }
    // TWIN WORDS: one move clearing two+ words at once is a feat - celebrate it loudly
    const twin = words.length>=2;
    if(twin){
      Game.tallyEv("twin");
      const cb=document.createElement("div"); cb.className="chainburst";
      cb.textContent = words.length>=3 ? "TRIPLE WORD!" : "DOUBLE WORD!";
      $("boardwrap").appendChild(cb); setTimeout(()=>cb.remove(),1650);
      Snd.chainBig(2); UI.confetti(); buzz([30,40,30,80]);
      Game.cheer(1); // the pets love a clever move
      await wait(400);
    }
    const allCells = new Set();
    let gained=0;
    for(const w of words){
      S.lastAction=Date.now();               // long cascades are alive, not stuck
      // a nibbled word is judged by the WORD, not the cells - the spare letter is the
      // mouse's snack, not part of the achievement
      const len=(w.word||"").length || w.cells.length;
      let pts=0;
      const goldX = 3;                       // 🌊 River Gold: fox & fish gild deeper
      const wildV = 0;                   // 🌃 Night Flight: fallen stars are worth something
      const vowelB = 0;                 // 🌅 Dawn Chorus: vowels sing
      // 🌈 ONE RAINBOW GILDS THE WHOLE WORD - every letter in it pays as gold, so a
      // rainbow's worth grows with the word's length. Gold stays x3, never x9.
      const rainbowIn = w.cells.some(t=>t.kind==="rainbow");
      w.cells.forEach(t=>{ if(t===w.nibbled) return;
        let v = t.kind==="wild"?wildV:(VAL[t.letter]||0); if(t.kind==="gold"||rainbowIn) v*=goldX;
        if(t.kind!=="wild" && "aeiou".includes(t.letter||"")) v+=vowelB; pts+=v; });
      // 5+ letter words are JACKPOTS: rare, hard, and they should pay like it.
      // a good 6-letter word will often clear the whole level - that's the chase.
      const lenMult = len<=4 ? (1.3+0.7*(len-3)) : (len-3)*2; // 3→1.3, 4→2, 5→4, 6→6, 7→8, 8→10
      pts = Math.round(pts * lenMult * S.chain * (twin?1.5:1));
      let charmed=false;
      if(S.charm>0){ pts*=2; S.charm--; charmed=true; }            // 💖 Sweet Song: this word sings double
      if(S.splash>0){ pts=Math.round(pts*1.5); S.splash--; }       // 💦 Playful Splash: +50%
      if(S.web>0){ pts*=2; S.web--; Game.addMoves(1);
        }                // 🕸️ Web Wrap (+🎶 Night Music: the web hums on)
      if(S.chainBoost && S.chain>=2){ pts*=2; S._chainBoostUsed=true; } // 🎻 Night Chorus: this cascade counts double
      if(S.flatB>0){ pts+=5; S.flatB--; }                          // 🍀 Lucky Spots: +5 a word
      if(len===3 && Game.hasPassive("crumb")) pts+=3;              // 🧀 Crumb Collector
      // 🦫 THE DAM BREAKS - letters you HELD, finally cashed in a bigger word, pay their
      // stored water. The hold's own rule guarantees "bigger": held tiles can only ever
      // re-clear inside a longer word than the one they were kept as.
      if(Game.hasPassive("damBreak") && w.cells.some(t=>t.heldWord)){
        const dam=Math.round(12*Game.tierMul()); pts+=dam;
        UI.petSay((UI.artTag("beaver","toastimg")||"🦫")+" the dam breaks - <b>+"+dam+"</b>"); }
      // 🐍 MEASURES ITSELF - the longest creature pays court to the longest words
      if(len>=5 && Game.hasPassive("snakeLong")){
        const coil=Math.round(15*Game.tierMul()); pts+=coil;
        UI.petSay((UI.artTag("snake","toastimg")||"🐍")+" measures <b>"+w.word.toUpperCase()+"</b> - worthy. <b>+"+coil+"</b>"); }
      // 🦋 DRAWN TO THE LIGHT - a gilded or rainbow word pays extra while the moth circles
      if(Game.hasPassive("mothLight") && (rainbowIn || w.cells.some(t=>t.kind==="gold")))
        pts+=Math.round(8*Game.tierMul());
      // 🐜 MANY HANDS - every friend who acted this drop makes the word a little heavier
      if(Game.hasPassive("antMany") && (S._actedThisDrop||[]).length)
        pts+=2*(S._actedThisDrop||[]).length;
      // 🦌 spell her something to eat, and 🦩 name the weather - the two meaning powers
      if(FOOD.has(w.word) && Game.hasPassive("foodJoy")) pts+=15;
      if(WEATHER.has(w.word) && Game.hasPassive("weatherWatch")) Game.addMoves(1);
      if(GROVE_BY_WORD[w.word] && Game.hasPassive("kindred")) pts*=(2); // 🐾 Kindred Call (🌼 Meadow Kin sings louder)
      /* 🔄 THE OTHER HALF OF THE BAT. She reads every row both ways, so the word that
         reads the SAME both ways is the one she is really waiting for. Deliberately a
         multiplier on a power that already earns its seat, never a power of its own:
         measured in play, a palindrome was available to spell on 1 drop in 552 - about
         once every eight rounds, and that is the ceiling for a player hunting them, not
         the average. A creature whose whole job fired that rarely would be a rumour.
         Which is also why the palindrome-maker is not a nice-to-have: without something
         that manufactures the chance, this line almost never pays. */
      if(isMirror(w.word) && Game.hasPassive("readsBoth")) pts*=2;  // 🔄 true both ways
      if(len>=(4) && S.chain===1 && Game.hasPassive("refund4") && !S._refunded){ S._refunded=true; Game.addMoves(1); } // 💨 Quickstep (🌪️ The Chase widens it)
      // 🌑 a shroud dims every word cleared in its shadow - half the joy, rounded up
      if(w.cells.some(t=>[[1,0],[-1,0],[0,1],[0,-1]].some(d=>{
        const n=(S.board[t.r+d[0]]||[])[t.c+d[1]]; return n && n.kind==="shroud"; })))
        pts=Math.ceil(pts/2);
      // NO CAP HERE. Clamping a prologue word to a third of the target made lesson two
      // unwinnable: its tiles are scripted, only a few words can be made from them, and
      // 15 stopped being reachable. The EARLY targets were tuned against these exact
      // multipliers - changing one without the other is the wrong half of the change.
      gained += pts;
      const banner=document.createElement("div"); banner.className="wordbanner";
      banner.style.fontSize = Math.min(16+len*2, 28)+"px";
      boardEl.appendChild(banner); // lives INSIDE the board frame - cannot collide with HUD or pills
      const base = Math.min(4+(S.chain-1)*2, Snd.PENTA.length-len);
      for(let i=0;i<len;i++){
        const t=w.cells[i];
        t.inner.classList.add("lit"); allCells.add(t);
        banner.textContent = w.word.slice(0,i+1).toUpperCase();
        Snd.tone(Snd.PENTA[Math.min(base+i,Snd.PENTA.length-1)]*(0.995+Math.random()*0.01),
          {dur:.18,type:"triangle",gain:.12,verb:true});
        buzz(8);
        await wait(165);
      }
      // the word is the achievement; the number is the receipt. They were the same size.
      banner.innerHTML = '<b>'+w.word.toUpperCase()+'</b>'
        +'<i class="wb-pts">+'+pts+(S.chain>=2 ? " ×"+S.chain : "")+(charmed?" 💖":"")+'</i>';
      banner.classList.add("done");
      Snd.tone(Snd.PENTA[Math.min(base+len,Snd.PENTA.length-1)]*2,{dur:.32,type:"sine",gain:.06,verb:true});
      if(pts>S.bestWordPts){ S.bestWordPts=pts; S.bestWord=w.word.toUpperCase(); }
      if(len>=5) await Game.jackpot(len);              // 🎆 the moment worth chasing
      // 3-letter words buy you the wind 🍃, 4+ letter words earn a wish 🌟 - but A TOOL NEVER
      // PAYS FOR ITSELF. A breeze-made word grants no breeze and a wish-made word grants no
      // wish, or either one becomes a perpetual motion machine: swap, clear, get the swap
      // back, forever. The OTHER tool still pays, so a breeze into a four-letter word is a
      // real trade - you spent the wind and bought a star.
      if(S.chain===1){
        if(len>=4){ if(!S._noWishGrant) Game.earnWish(); }
        else if(len===3){ if(!S._noBreezeGrant) Game.earnBreeze(); }
      }
      const goldN=w.cells.filter(t=>t.kind==="gold").length;
      // THE GOLD SIGN WAS NEVER EMITTED. tallyEv fed the CALLINGS (how a creature notices
      // you); sees() feeds the WAKES (what stirs one already on your shelf) - and nothing
      // anywhere called sees("gold"), so the fish, whose whole sign is a golden letter,
      // could never wake once in an entire run. It counts here, where the gold is spent.
      if(goldN){ Game.tallyEv("gold",goldN); Game.sees("gold");
                 for(let gi=0;gi<goldN;gi++) Game.goalTick("harvest"); }
      // 🐦‍⬛ COUNTS ITS TREASURE - amber per shine, and a rainbow is the shiniest thing there is
      { const shine=goldN + (rainbowIn ? 2 : 0);
        if(shine && Game.hasPassive("crowHoard")){ Game.amber(2*shine);
          UI.petSay((UI.artTag("crow","toastimg")||"🐦‍⬛")+" counts its treasure - <b>+"+(2*shine)+" 🟠</b>"); } }
      const wildN=w.cells.filter(t=>t.kind==="wild").length;
      if(wildN){ Game.tallyEv("star"); for(let wi=0;wi<wildN;wi++) Game.goalTick("star"); }
      if(len>=4) Game.goalTick("long");                       // 🏔️ the long trial hears you
      if(w.dir==="up") Game.tallyEv("upword");
      { const g=gateAt(S.level);
        if(g && g.small && w.cells.length<4) pts=0; }   // it still clears; it just does not pay
      // 🐭🦨🦉 licences are spent HERE, when their word actually clears - not in the scan
      /* the nibble is a PASSIVE, so no creature flies out and the word simply changed shape.
         The toast was already there; what was missing was somewhere to look. */
      if(w.nibbled){ S.mouseUsed=true;
        try{ UI.shards(w.nibbled.r, w.nibbled.c, "#e8d9a8"); }catch(e){}
        UI.petSay((UI.artTag("mouse","toastimg")||"🐭")+" nibbled the spare "
          +((w.nibbled.letter||"").toUpperCase())+" - <b>"+w.word.toUpperCase()+"</b> counts!"); }
      if(w.skunked){ S.skunkUsed=true; Game.amber(3);
        UI.petEdge((UI.artTag("skunk","toastimg")||"🦨")+" the wood refuses <b>"+w.word.toUpperCase()
          +"</b> - the skunk counts it anyway, giggling. <b>+3 🟠</b>"); }
      if(w.forgiven){ S.owlUsed=true;
        UI.petEdge((UI.artTag("owl","toastimg")||"🦉")+" knew you meant <b>"+w.word.toUpperCase()
          +"</b> - the "+((w.forgiven.letter||"").toUpperCase())+" is forgiven"); }
      /* ══ GRATITUDE ══ spell an on-duty friend's own name, or its signature word, and it
         thanks you. Hidden until found; the Book remembers after; once per friend a round.
         The BOND grows a rank every ten thanks (cap 3) and quietly deepens that friend. */
      { const gw = (GROVE_BY_WORD[w.word] && w.word) || SIG_OF[w.word];
        if(gw && UI.equipped().some(g=>g && g.w===gw)){
          S._grat=S._grat||{};
          if(!S._grat[gw]){ S._grat[gw]=1;
            P.bond=P.bond||{}; P.bond[gw]=Math.min(30,(P.bond[gw]||0)+1);
            P.gratitude=P.gratitude||{}; const first=!P.gratitude[gw]; P.gratitude[gw]=1;
            const g=GROVE_BY_WORD[gw], thanks=3+Math.floor((P.bond[gw]||0)/10)*2;
            Game.amber(thanks); Game.tallyEv("gratitude");
            Game.track("gratitude",{ w:gw, said:w.word, bond:P.bond[gw] });
            UI.petSay((UI.artTag(gw,"toastimg")||g.e)+" hears <b>"+w.word.toUpperCase()
              +"</b> and beams - <b>+"+thanks+" 🟠</b>"+(first?" <i>(the Book will remember this)</i>":""));
            save(); } } }
      // 🐷🦩🦭 a word through the wallow, the reeds or the mist clears what it borrowed -
      // and the wood pays for every piece of trouble spent this way
      w.cells.forEach(t=>{ if(t.kind==="mire"||t.kind==="reed"||t.kind==="mist") Game.credit(t.kind); });
      if(rainbowIn) Game.tallyEv("rainbow");
      Game.recordWord(w, pts, S.chain, {
        dir: w.dir, twin: !!twin,
        held: w.cells.some(t=>t.heldWord),          // you kept this one back before it bloomed
        gilded: goldN>0, rainbow: rainbowIn });
      /* ══ THE FLOURISH ══ word5+, a twin, a cascade word, a palindrome, a rainbow - any
         rare delight raises the ONE pooled sign, so a friend that loves flourishes fires
         on all of them and a player learns one word instead of five. The ladybug can
         bless an ordinary word into one. */
      { const lucky = (S._ladyLuck||0) > 0; if(lucky) S._ladyLuck--;
        if(len>=5 || twin || S.chain>=2 || isMirror(w.word) || rainbowIn || lucky)
          Game.sees("flourish"); }
      // THE announcement of this game - the word you made and what it paid - used to sit
      // for 700ms and vanish. Nobody could read it, and the bigger the word the more
      // there was to miss. It holds long enough to land now, longer for the big ones.
      await wait(len>=5 ? 1700 : len>=4 ? 1350 : 1100);
      banner.classList.add("fade"); setTimeout(()=>banner.remove(),450);
    }
    S.maxChain=Math.max(S.maxChain,S.chain);
    S.cascadeMax=Math.max(S.cascadeMax,S.chain);
    if(S.chain>=2){ boardEl.classList.add("flash"); setTimeout(()=>boardEl.classList.remove("flash"),400); }
    S.levelScore += gained;
    UI.hud();
    await wait(150);
    const clearedPos=[...allCells].map(t=>({r:t.r,c:t.c}));
    allCells.forEach(t=>removeTile(t));
    Snd.collapse(allCells.size);
    await wait(220);
    const thawed = await Game.hitNeighbors(clearedPos);
    const fell = await Game.gravity();
    // NO rain tile here. The sky used to drop one random letter after every clear -
    // "cascade potential" on paper, but players had a build in mind and the stray
    // letter kept landing in the middle of it. The board only holds what YOU placed
    // and what fell; nothing arrives that you didn't cause.
    S.chain++;
    // …and the CASCADE sign, likewise never emitted. A tumble is one of the most legible
    // things that happens on this board and no friend could listen for it.
    Game.sees("cascade");
    Snd.riser(S.chain);
    await wait(430);
    await Game.resolve([...(thawed||[]), ...(fell||[])]);
  },

  async woodTick(){ // the wood's own small moves, once per drop
    if(!S || S.over || S.won) return;
    /* 🐌 WHAT WAITS, RIPENS. The snail camps on your OLDEST letter - same age order
       wildOld uses. Ten drops of patience turn it gold; ten more turn it RAINBOW, the
       one tile the wood itself never deals. Patience squared. */
    if(Game.hasPassive("ripen")){
      const ts=Object.values(S.tiles).filter(t=>t.kind==="normal"
        || ((t.kind==="gold"||t.kind==="rainbow") && t._snail));
      if(ts.length){
        ts.sort((a,b)=>a.id.localeCompare?a.id.localeCompare(b.id):(a.id-b.id));
        const oldest=ts[0];
        if(!S.snail || S.snail.id!==oldest.id) S.snail={id:oldest.id, ticks:0};
        S.snail.ticks++;
        const t=S.tiles[S.snail.id];
        // 🐢🐌 KINSHIP: under the shell's law the two slow ones agree, and everything
        // ripens twice as fast
        const _t1=kinBeside("snail")?5:10, _t2=kinBeside("snail")?10:20;
        if(t && S.snail.ticks>=_t1 && t.kind==="normal"){ t.kind="gold"; t._snail=true;
          t.inner.className="tile gold thawpop"; t.inner.innerHTML=tileFace(t);
          Snd.gold(); UI.shards(t.r,t.c,"#ffd54f");
          UI.petSay((UI.artTag("snail","toastimg")||"🐌")+" what waits, ripens - <b>"
            +(t.letter||"").toUpperCase()+"</b> turns gold");
        } else if(t && S.snail.ticks>=_t2 && t.kind==="gold" && t._snail){ t.kind="rainbow";
          t.inner.className="tile rainbow thawpop"; t.inner.innerHTML=tileFace(t);
          Snd.gold(); UI.shards(t.r,t.c,"#c69eff");
          UI.petSay((UI.artTag("snail","toastimg")||"🐌")+" …and past gold into <b>RAINBOW</b>");
        }
      }
    }
    // 🪵 a cut root left alone for 3 drops closes its wound
    for(const t of Object.values(S.tiles)){
      if(t.kind==="root" && t.cracks>=1 && S.drops-(t.cutDrop||0)>=3){
        t.cracks=0; delete t.cutDrop;
        t.inner.classList.remove("cracked");
        t.inner.classList.add("jostle"); setTimeout(()=>t.inner.classList.remove("jostle"),260);
        UI.shards(t.r,t.c,"#8a6a44");
        Snd.tone(240,{dur:.16,type:"triangle",gain:.05,verb:true});
      }
    }
    // 🐛 every 3rd drop, each pest trades seats with a neighboring letter
    if(S.drops % 3 === 0){
      let hopped=false;
      // 🐸 THE TONGUE IS FASTER - a frog on duty snatches the first pest that dares to
      // hop, and pockets amber for it. One pest a beat: even a frog must swallow.
      if(UI.equipped().some(g=>g&&g.w==="frog")){
        const p=Object.values(S.tiles).find(t=>t.kind==="pest");
        if(p){ UI.shards(p.r,p.c,"#8fbf6a"); Game.creditTile(p); removeTile(p); Game.amber(3);
          UI.petEdge((UI.artTag("frog","toastimg")||"🐸")+" <i>slurp</i> - the pest never landed. <b>+3 🟠</b>");
          Snd.tone(700,{dur:.08,type:"triangle",gain:.06}); await Game.gravity(); }
      }
      for(const p of Object.values(S.tiles).filter(t=>t.kind==="pest")){
        let ns=[[1,0],[-1,0],[0,1],[0,-1]].map(d=>(S.board[p.r+d[0]]||[])[p.c+d[1]])
          .filter(n=>n && n.kind==="normal" && !n.heldWord);  // held words are safe seats
        // 🐢 and beside a held word is the shell's ground too
        if(Game.hasPassive("turtleShell"))
          ns=ns.filter(n=>![[1,0],[-1,0],[0,1],[0,-1]].some(d=>{
            const h=(S.board[n.r+d[0]]||[])[n.c+d[1]]; return h && h.heldWord; }));
        const n=rand(ns); if(!n) continue;
        const pr=p.r, pc=p.c;
        S.board[pr][pc]=n; S.board[n.r][n.c]=p;
        p.r=n.r; p.c=n.c; n.r=pr; n.c=pc;
        placeTile(p,p.r,p.c); placeTile(n,n.r,n.c);
        p.inner.classList.add("jostle"); n.inner.classList.add("jostle");
        setTimeout(()=>{ p.inner.classList.remove("jostle"); n.inner.classList.remove("jostle"); },260);
        Snd.tone(520,{dur:.1,type:"triangle",gain:.05}); hopped=true;
      }
      if(hopped) await wait(240);
    }
  },

  /* every 3rd drop the growing things reach for ONE more letter - capped at 6 each.
     The bramble CREEPS: it only takes a letter it is already touching. The spore DRIFTS:
     it can land anywhere on the board. Same lesson, different grammar, which is why the
     Spore Hollow is not just the Bramblewood again with new paint. */
  async brambleSpread(){
    if(!S || S.over || S.won) return;
    for(const kind of ["bramble","spore"]){
      const src=Object.values(S.tiles).filter(t=>t.kind===kind);
      if(!src.length || src.length>=6) continue;
      let spots=[];
      if(kind==="bramble"){
        for(const b of src) for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
          const r=b.r+d[0], c=b.c+d[1];
          if(r<0||r>=ROWS||c<0||c>=COLS) continue;
          const t=S.board[r][c];
          if(t && t.kind==="normal" && !t.heldWord) spots.push(t); // specials and held words are safe
        }
      } else {
        spots=Object.values(S.tiles).filter(t=>t.kind==="normal" && !t.heldWord);
      }
      // 🐢 THE SHELL'S LAW - nothing may creep in BESIDE a held word either
      if(Game.hasPassive("turtleShell"))
        spots=spots.filter(t=>![[1,0],[-1,0],[0,1],[0,-1]].some(d=>{
          const n=(S.board[t.r+d[0]]||[])[t.c+d[1]]; return n && n.heldWord; }));
      if(!spots.length) continue;
      const t=rand(spots);
      t.kind=kind; t.cracks=0;
      t.inner.className="tile "+kind+" jostle"; t.inner.innerHTML=tileFace(t);
      setTimeout(()=>t.inner.classList.remove("jostle"),260);
      UI.shards(t.r,t.c, kind==="spore" ? "#c9a6d8" : "#6f8a52");
      Snd.tone(kind==="spore"?300:180,{dur:.14,type:"triangle",gain:.05,verb:true}); buzz(8);
      await wait(220);
    }
  },

  /* 🌀 THE CURRENT and 🌬️ THE WIND are one engine pointed two ways: the board moves on its
     own, and everything you knew about placement gets an asterisk. The river shoves a whole
     row sideways; the ridge takes the top off your tallest pile and drops it elsewhere.
     Both step every 4th drop so a player can feel the beat and plan around it. */
  async boardDrift(){
    if(!S || S.over || S.won || S.drops%4!==0) return;

    // 🫎 the moose stands in the river, and the current goes around it
    if(Object.values(S.tiles).some(t=>t.kind==="current") && !Game.hasPassive("mooseCalm")){
      const rows=[];
      for(let r=0;r<ROWS;r++){
        const line=[]; for(let c=0;c<COLS;c++) line.push(S.board[r][c]);
        const n=line.filter(Boolean).length;
        if(n>=2 && (!line[0] || !line[COLS-1])) rows.push({r,line,right:!line[COLS-1]});
      }
      const pick=rand(rows);
      if(pick){
        const {r,right}=pick, order = right ? [...Array(COLS).keys()].reverse() : [...Array(COLS).keys()];
        for(const c of order){
          const t=S.board[r][c]; if(!t || t.kind==="mire") continue;
          const nc=c+(right?1:-1);
          if(nc<0||nc>=COLS||S.board[r][nc]) continue;
          S.board[r][c]=null; S.board[r][nc]=t; t.c=nc;
          t.el.style.transition="transform .34s cubic-bezier(.4,.05,.35,1)";
          placeTile(t,t.r,t.c,false);
          setTimeout(()=>{ t.el.style.transition=""; },360);
        }
        UI.breeze(); Snd.tone(200,{dur:.2,type:"sine",gain:.05,verb:true}); buzz(12);
        await wait(360); await Game.settle();
      }
    }

    // 🗿 the golem was a mountain once - the wind stills while it stands on duty
    if(Object.values(S.tiles).some(t=>t.kind==="wind") && !UI.equipped().some(g=>g&&g.w==="golem")){
      const h=[]; for(let c=0;c<COLS;c++){ let n=0; for(let r=0;r<ROWS;r++) if(S.board[r][c]) n++; h.push(n); }
      const from=h.indexOf(Math.max(...h));
      let top=0; while(top<ROWS && !S.board[top][from]) top++;
      const t=S.board[top] && S.board[top][from];
      if(t && t.kind!=="mire" && !t.heldWord){
        const to=h.map((n,c)=>({n,c})).filter(x=>x.c!==from && x.n<h[from] && !S.board[0][x.c]);
        const dest=rand(to);
        if(dest){
          let land=ROWS-1; while(land>=0 && S.board[land][dest.c]) land--;
          if(land>=0){
            S.board[top][from]=null; S.board[land][dest.c]=t; t.r=land; t.c=dest.c;
            t.el.style.transition="transform .42s cubic-bezier(.35,.9,.4,1)";
            placeTile(t,t.r,t.c,false);
            setTimeout(()=>{ t.el.style.transition=""; },440);
            UI.breeze(); Snd.tone(760,{dur:.22,type:"sine",gain:.05,verb:true}); buzz(10);
            await wait(440); await Game.settle();
          }
        }
      }
    }
  },

  async hitNeighbors(cells){ // clearing beside stone cracks it, beside ice thaws it, beside a crate pops it
    const seen=new Set(); let acted=false; const thawed=[];
    for(const p of cells){
      for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
        const r=p.r+d[0], c=p.c+d[1];
        if(r<0||r>=ROWS||c<0||c>=COLS) continue;
        const t=S.board[r][c];
        if(!t || seen.has(t.id)) continue;
        seen.add(t.id);
        if(t.kind==="branch"){
          // THE FIRST TROUBLE ANYBODY MEETS, so it asks for exactly one thing: spell a word
          // beside it. One touch and it is gone. Everything harder in three hundred levels
          // is a variation on this, and it is deliberately the only one you can clear
          // without understanding anything else.
          acted=true;
          /* it paid 4 and an average three-letter word pays about the same, so clearing the thing
             in your way was worth no more than ignoring it. 8 is double a small word and well
             under a five-letter one. Judgement call made without the designer - one number. */
          removeTile(t); S.levelScore+=8; Game.credit("branch");
          UI.shards(t.r,t.c,"#a8794e");
          Snd.crack(true); buzz(12);
        } else if(t.kind==="crystal"){
          // 💎 THE ONLY TROUBLE THAT LEAVES YOU BETTER OFF. It takes two, like stone, and
          // then it does not vanish - it PAYS. After the Deep Dark the game is being
          // generous on purpose, and the gold engine finally has a country of its own.
          acted=true;
          t.cracks=(t.cracks||0)+1;
          if(t.cracks>=2){
            t.kind="gold"; t.letter=riggedLetter(); t.cracks=0;
            t.inner.className="tile gold thawpop"; t.inner.innerHTML=tileFace(t);
            setTimeout(()=>t.inner.classList.remove("thawpop"),560);
            UI.shards(t.r,t.c,"#ffd54f"); Snd.gold(); Game.credit("crystal");
          } else {
            t.inner.classList.add("cracked","jostle"); setTimeout(()=>t.inner.classList.remove("jostle"),220);
            Snd.crack(false);
          }
          buzz(14);
        } else if(t.kind==="scree"){
          // 🪨 IT GETS WORSE WHEN YOU ANSWER IT - the only trouble in three hundred levels
          // that does. Loose rock breaks into more loose rock. The child cannot break
          // again, so the slope always ends, but the first hit never feels like progress.
          acted=true;
          const first=!t.split;
          removeTile(t); S.levelScore+=3; Game.credit("scree");
          UI.shards(t.r,t.c,"#a49a90"); Snd.crack(true); buzz(15);
          if(first){
            const open=[]; for(let c=0;c<COLS;c++) if(!S.board[0][c]) open.push(c);
            if(open.length){
              const c=rand(open); let land=ROWS-1;
              while(land>=0 && S.board[land][c]) land--;
              if(land>=0){ const n=newTile(riggedLetter(),"scree",land,c,false); n.split=true; }
            }
          }
        } else if(t.kind==="reed"){
          // 🌾 two cuts, because a reed is not in your way by accident - it is standing in
          // a whole column and nothing drops through it until it falls
          acted=true;
          t.cracks=(t.cracks||0)+1;
          if(t.cracks>=2){ removeTile(t); S.levelScore+=5; Snd.crack(true); Game.credit("reed"); }
          else { t.inner.classList.add("cracked","jostle"); setTimeout(()=>t.inner.classList.remove("jostle"),220);
            Snd.crack(false); }
          buzz(15);
        } else if(t.kind==="mire"){
          // 🟤 one pull frees it, and the moment it is gone the column remembers gravity
          acted=true;
          removeTile(t); S.levelScore+=5; Game.credit("mire");
          UI.shards(t.r,t.c,"#7a5c3a"); Snd.crack(true); buzz(14);
        } else if(t.kind==="spore"){
          // 🍄 one clean swipe, same as the tangle - but it drifts rather than creeps
          acted=true;
          t.kind="normal"; thawed.push(t); Game.credit("spore");
          t.inner.className="tile thawpop"; t.inner.innerHTML=tileFace(t);
          setTimeout(()=>t.inner.classList.remove("thawpop"),560);
          UI.shards(t.r,t.c,"#c9a6d8"); Snd.thaw(); buzz(10);
        } else if(t.kind==="stone"){
          acted=true;
          t.cracks=(t.cracks||0)+1;
          if(t.cracks>=2){ removeTile(t); S.levelScore+=5; Snd.crack(true); Game.credit("stone"); }
          else {
            t.inner.classList.add("cracked");
            t.inner.classList.add("jostle"); setTimeout(()=>t.inner.classList.remove("jostle"),220);
            Snd.crack(false);
          }
          buzz(15);
        } else if(t.kind==="ice"){
          acted=true;
          t.kind="normal"; thawed.push(t); Game.credit("ice");
          t.inner.className="tile thawpop"; t.inner.innerHTML=tileFace(t);
          setTimeout(()=>t.inner.classList.remove("thawpop"),560);
          UI.shards(t.r,t.c,"#a8dcf5");
          Snd.thaw(); buzz(10);
        } else if(t.kind==="root"){     // cut once it heals, cut twice it yields
          acted=true;
          if(t.cracks>=1){ removeTile(t); S.levelScore+=5; Snd.crack(true); Game.credit("root"); }
          else { t.cracks=1; t.cutDrop=S.drops;
            t.inner.classList.add("cracked","jostle"); setTimeout(()=>t.inner.classList.remove("jostle"),220);
            Snd.crack(false); }
          buzz(15);
        } else if(t.kind==="shroud"){   // the gloom thins once, lifts the second time
          acted=true;
          t.cracks=(t.cracks||0)+1;
          if(t.cracks>=2){ removeTile(t); Snd.thaw(); Game.credit("shroud"); }
          else { t.inner.classList.add("cracked","jostle"); setTimeout(()=>t.inner.classList.remove("jostle"),220); Snd.crack(false); }
          buzz(10);
        } else if(t.kind==="pest"){     // one clean swat
          acted=true;
          removeTile(t); S.levelScore+=5; Snd.crack(true); Game.credit("pest");
          buzz(15);
        } else if(t.kind==="frost"){    // deep frost sheds a LAYER - ordinary ice remains
          acted=true;
          t.kind="ice"; t.cracks=0;
          t.inner.className="tile ice thawpop"; t.inner.innerHTML=tileFace(t);
          setTimeout(()=>t.inner.classList.remove("thawpop"),560);
          UI.shards(t.r,t.c,"#e8f4fc");
          Snd.crack(false); buzz(10);
        } else if(t.kind==="mist"){     // the mist lifts - the letter shows its face
          acted=true;
          t.kind="normal"; thawed.push(t); Game.credit("mist");
          t.inner.className="tile thawpop"; t.inner.innerHTML=tileFace(t);
          setTimeout(()=>t.inner.classList.remove("thawpop"),560);
          UI.shards(t.r,t.c,"#c9c2d8");
          Snd.thaw(); buzz(10);
        } else if(t.kind==="bramble"){  // one clean cut and the tangle falls away
          acted=true;
          removeTile(t); S.levelScore+=5;
          Snd.crack(true); Game.credit("bramble");
          buzz(15);
        } else if(t.kind==="crate"){
          acted=true;
          const cr=t.r, cc=t.c;
          removeTile(t);
          await Game.openCrate(cr,cc);
        }
      }
    }
    if(acted){ UI.hud(); await wait(340); }
    return thawed;
  },

  /* A gift used to do exactly one thing, and that thing was invisible: fill the paw
     meter. Players popped it, watched nothing happen, and concluded the pig's entire
     power was pointless - they were right. A gift has to GIVE, and it has to say so. */
  async openCrate(r,c){
    Game.credit("crate");
    const got=[];
    S.levelScore+=15; got.push("<b>+15</b>");
    // A CRATE NEVER PAID A SINGLE COIN - score, a breeze, a wish and moves, and nothing
    // for the purse. With amber now buying rounds back, the crate is the obvious place
    // for it to come from.
    { const coins = 10 + Math.floor(Math.max(0,advOf(S.level))/30)*5;
      Game.amber(coins); got.push("<b>+"+coins+"</b>🟠"); }
    if((P.pow.swap||0)<3){ Game.earnBreeze(); got.push("🍃 a breeze"); }
    if((P.pow.wild||0)<3){ Game.earnWish();  got.push("🌟 a wish"); }
    if(got.length<3){ Game.addMoves(3); got.push("<b>+3 moves</b>"); }   // never a dud
    Game.cheer(Game.petNeed());                                          // and the pets get their treat
    UI.shards(r,c,"#ffd54f"); UI.confetti();
    Snd.gold(); Snd.levelUp(); buzz([15,25,15,45]);
    // no "your friends are ready" - nothing here brings a friend any closer. The list above
    // is the whole gift, and it is plenty; a false line under a true one poisons both.
    UI.toast("🎁 the gift bursts open!<br>"+got.join(" · "));
    UI.hud();
    await wait(620);
  },


  async gravity(){
    let moved=false; const movedTiles=[];
    for(let c=0;c<COLS;c++){
      // 🟤 MIRE DOES NOT FALL. Gravity has been the one reliable thing in this game for a
      // hundred levels, and in the marsh it stops being. Anchored tiles keep their exact
      // row and everything else settles around them, so a mire leaves a shelf in the air.
      const stack=[], anchor=[];
      for(let r=ROWS-1;r>=0;r--){ const t=S.board[r][c]; if(!t) continue;
        (t.kind==="mire" ? anchor : stack).push(t); }
      for(let r=0;r<ROWS;r++) S.board[r][c]=null;
      for(const a of anchor) S.board[a.r][c]=a;
      let slot=ROWS-1;
      stack.forEach((t,i)=>{      // i still staggers the fall - the cascade reads as weight
        while(slot>=0 && S.board[slot][c]) slot--;
        if(slot<0){ S.board[t.r][c]=t; return; }   // nowhere to go - leave it where it is
        const nr=slot--;
        const dist = nr - t.r;
        const falling = dist>0;
        if(falling){ moved=true; movedTiles.push(t); }
        S.board[nr][c]=t; t.r=nr; t.c=c;
        setTimeout(()=>{
          if(falling){ t.el.style.transition="transform "+(90+dist*55)+"ms cubic-bezier(.55,0,.85,.6)"; }
          t.el.style.transform=xy(nr,c);
          if(falling) setTimeout(()=>{ t.el.style.transition="";
            t.inner.classList.add("landsquash"); setTimeout(()=>t.inner.classList.remove("landsquash"),400);
          }, 90+dist*55);
        }, i*24);
      });
    }
    if(moved) await wait(340);
    return movedTiles;
  },
});
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

/* =================== UI =================== */
