Object.assign(Game, {

  /* THE ONE PLACE AN OBSTACLE IS PAID FOR, whoever took it off the board.
     For a long time only the word-clear path paid. A friend's power or an acorn could
     erase the very thing the round was asking for and the ask would never notice -
     measured on a "melt every ice" round, the otter's Warm Current took all three ices
     and left the goal at 0/3. That is not a hard round, it is an unwinnable one, and the
     one pet whose whole identity is melting ice guaranteed a loss on the melt-the-ice
     round. Every destructive path routes through here now, so a new power cannot quietly
     bring it back.
     A crate taken by a blast is credited but not opened - a bomb should not hand out the
     pig's gifts. */
  credit(kind){
    if(!OBSTACLE_KINDS.includes(kind)) return false;
    Game.tallyEv(kind==="frost" ? "ice" : kind);
    Game.sees("obstacle");
    if(kind==="crate") Game.sees("crate");
    Game.amber(2);
    // 🦝 BIN RAIDER - trouble pays double while the raccoon is on duty, and every fourth
    // piece it rummages a little treasure out of the junk
    if(Game.hasPassive("binRaider")){ Game.amber(2);
      S._racc=(S._racc||0)+1;
      if(S._racc%4===0){ Game.amber(8);
        UI.petSay((UI.artTag("raccoon","toastimg")||"🦝")+" rummaged out a little treasure - <b>+8 🟠</b>"); } }
    const g=OBSTACLE_GOAL[kind];
    if(g) Game.goalTick(g);
    return true;
  },
  creditTile(t){ return t ? Game.credit(t.kind) : false; },

  goalTick(t){ // one step of the round's ask - a gauntlet listens on both channels
    if(!S) return;
    let hit=false;
    for(const g of [S.goal,S.goal2]){
      if(!g || g.t!==t || g.have>=g.need) continue;
      g.have=Math.min(g.need, g.have+1); hit=true;
      if(g.have>=g.need) Snd.tone(1046,{dur:.25,type:"sine",gain:.07,verb:true});
    }
    if(hit){ UI.hud(); Game.goalTell(); }
  },

  /* ══ ALDER NAMES WHAT THE BAR COUNTS ══
     The top bar says "cleared 1/5". It cannot say WHICH five, because a 7px track holds
     a proportion and nothing else. So he holds the list, and re-states it each time one
     falls: "thaw 3 ice and break 2 stones" becomes "thaw 2 ice and break 2 stones".
     Only what REMAINS is spoken - a finished ask drops out of the sentence entirely
     rather than lingering as "0 stones", so the line shortens as you win.
     It speaks only when the words CHANGE. Called on every credit, it would otherwise
     re-queue the same sentence on every drop and crowd out every other thing he says. */
  /* ══ ONE PLACE THAT KNOWS WHAT A MEETING ASKS ══
     "speak the name and it is yours" was written for a spelling test the game no longer
     runs. The real ask is N words of a kind, and the name is the REWARD - so a player
     who hit the score target was being told to do something that does not exist, at the
     exact moment they were trying to work out why the round had not ended.
     Built from courtship() so it cannot drift from the rule again, and shared by the
     in-round nudge and the loss card. */
  meetAskLine(){
    const fallback="🎭 <b>keep spelling</b> - the score will not end this one";
    try{
      const cg=Game.courtship(GROVE_BY_WORD[S.tutorWord]);
      if((P.nameFails[S.tutorWord]||0)>=2)
        return "🎭 <b>one more word</b> and it steps out - the score will not end this one";
      if(!cg) return fallback;
      const left=Math.max(0, cg.n-Math.min(cg.n,(S.sigs&&S.sigs[cg.sign])||0));
      if(!left) return fallback;
      /* this printed the sign's noun, so the dove asked a player to "spell 1 more flourish" - a
         word the game uses constantly and defines nowhere. Every sign now carries an action
         phrase, and it leads, because the bar shows the first clause. */
      const sg=SIGNS[cg.sign];
      if(sg && sg.do)
        return "🎭 <b>"+sg.do+"</b>"+(left>1 ? " ("+left+" to go)" : "")+" - the score will not end this one";
      return "🎭 spell <b>"+left+" more "+signNounN(cg.sign,left)+"</b> - the score will not end this one";
    }catch(e){ return fallback; }
  },
  goalTell(){
    if(!S) return;
    const parts=[];
    /* THE PIECE ITSELF, NOT ITS NAME. "thaw 2 🧊" beats "thaw 2 ice" because the glyph
       is the same thing the player is looking at on the board - no translation step
       between the instruction and the target. It also keeps the line short, which
       matters: his bar clips, and a two-ask sentence in words was the longest thing
       he ever has to say. */
    for(const g of [S.goal, S.goal2]){
      if(!g || g.t==="hush") continue;
      const left=Math.max(0, g.need-g.have);
      if(!left) continue;
      const G=GOALS[g.t]; if(!G || !G.v) continue;
      parts.push(G.v+" "+left+" "+G.i);
    }
    /* the meeting ask lost its pod too, so it says itself here. It keeps WORDS rather
       than a glyph: the ask is a kind of word to speak, and there is no emoji for
       "something watery" that a player could act on. */
    if(S.tutorWord){
      try{
        const cg=Game.courtship(GROVE_BY_WORD[S.tutorWord]);
        const waived=(P.nameFails[S.tutorWord]||0)>=2;
        if(waived) parts.push("speak any word - it likes you");
        else if(cg){
          const left=Math.max(0, cg.n-Math.min(cg.n,(S.sigs&&S.sigs[cg.sign])||0));
          if(left) parts.push("speak "+left+" "+signNounN(cg.sign,left));
        }
      }catch(e){}
    }
    if(!parts.length){ S._toldGoal=null; try{ Alder.rest(); }catch(e){} return; }
    const line=parts.join(" and ");
    if(S._toldGoal===line) return;                  // nothing new to say
    S._toldGoal=line;
    /* NOT an aside any more. The ask is the bar's resting content, not a notification -
       posting it as P2 put it in a queue with 35 pet-power call sites at the same
       priority, where per-drop coalescing silently killed one or the other. It simply
       becomes what the bar says whenever nothing is interrupting. */
    try{ Alder.rest(); }catch(e){}
  },

  /* ---- 🐕 THE WATCHDOG - a shipped game may NEVER soft-lock ----
     Every board action runs on async chains gated by S.busy. One uncaught error in
     the middle of one and the flag stays true forever: the board is dead, the player
     force-quits, the review says "froze on me". The watchdog waits 15 quiet seconds -
     unless something interactive is legitimately on stage (a grace bubble waiting for
     a hold, a ritual card, a tip) - then releases the flag and heals the stage. */
  /* ---- 📈 ANALYTICS STUB - every launch metric the store audit asked for, buffered
     locally until a provider is chosen. Wiring one later is one line:
     Game._sink = (name,props)=>realProvider.track(name,props);  */
  track(name,props){
    try{
      const K="worddrop_ev1";
      const q=JSON.parse(localStorage.getItem(K)||"[]");
      q.push({t:Date.now(), n:name, p:props||{}});
      while(q.length>300) q.shift();   // a ring, never a flood
      localStorage.setItem(K,JSON.stringify(q));
      if(Game._sink) Game._sink(name,props);
    }catch(e){}
  },

  watchdog(){
    setInterval(()=>{
      try{
        if(!S || !S.busy || S.over || S.won) return;
        if(Date.now()-(S.lastAction||0) < 15000) return;
        // tiptip is deliberately NOT in this list. It used to be, and that was the whole
        // problem: a tip both froze the board and told the watchdog to stand down, so the
        // one thing that could have rescued the player was disqualified by the thing that
        // trapped them. Tips no longer block anything, so they are no excuse to stay stuck.
        const surface = document.querySelector(".overlay.active")
          || document.querySelector(".wordbanner.breath")
          || document.querySelector(".ftue-scrim");
        if(surface) return;
        console.warn("[hushwood] watchdog: releasing a stuck board");
        S.busy=false; S.playerMove=false; S.pendingReveal=null;
        S.usingBreeze=false; S.usingPluck=false;
        try{ Game.markBreeze(false); }catch(e){}   // the watchdog must leave a settled board
        if(S.swapSel){ try{ S.swapSel.inner.classList.remove("selswap"); }catch(e){} S.swapSel=null; }
        $("breezepill").classList.remove("armed"); $("wishbtn").classList.remove("armed");
        document.querySelectorAll(".whosthat").forEach(e=>e.remove());
        boardEl.classList.remove("naming");
        S.lastAction=Date.now();
        UI.all();
        /* ══ IT STOPS AND ASKS, RATHER THAN MUTTERING ══
           This fires when a resolution chain THREW and left the board locked. The old
           line - "that took a moment" - handed the player the blame for a pause that was
           the game's fault, and it slid past in a bar they might not even be looking at.
           The recovery above already ran, so the board is safe BEFORE the card appears:
           if anything goes wrong with the card itself, the player is still playing.
           Then it stops the world and waits for a tap, because something did happen and
           they deserve to be told, and Alder greets them back afterwards. */
        /* "The wood held still for a moment" was atmosphere where a plain fact was
           needed. A player reading it has to work out whether something broke, whether
           they lost anything, and whether they did something wrong - three questions the
           line raises and answers none of. Greet them and let them get on with it. */
        Alder.pageData({ s:"Welcome back - your friends missed you.", b:"🌳" },
          { cb:()=>{ try{
              S.lastAction=Date.now();
              UI.petEdge("🌳 your friends missed you!");
            }catch(e){} } });
      }catch(e){}
    }, 5000);
  },

  /* ---- 🟠 AMBER - earned in drops, spent on small mercies ---- */
  amber(n, x, y){
    if(!P) return; P.amber=Math.max(0,(P.amber||0)+n); save();
    if(n<0) Game.track("amber_spend",{n:-n, L:S&&S.level, left:P.amber});
    const el=$("amber-n"); if(el) el.textContent=P.amber;
    if(n>0){ const f=document.createElement("div"); f.className="amberfloat"; f.textContent="+"+n+" 🟠";
      const ar=$("app").getBoundingClientRect(), cr=$("amberchip").getBoundingClientRect();
      f.style.left=(x!=null?x:(cr.left-ar.left))+"px"; f.style.top=(y!=null?y:(cr.top-ar.top+8))+"px";
      $("app").appendChild(f); setTimeout(()=>f.remove(),1100); }
  },

  /* ---- CALLINGS: the wood is always listening ---- */
  tallyEv(type, n){ // every notable act counts toward some creature's calling
    if(!P || !P.tally) return;
    P.tally[type]=(P.tally[type]||0)+(n||1);
    Game.checkCallings();
  },
  callProgress(w){ // the meter a calling shows - and the heart of 300-level pacing.
    // Tier 1 (the first six) counts for LIFE: the early shower must feel instant.
    // Tiers 2+ count FROM THE MOMENT THE CREATURE STARTS LISTENING (window entry) -
    // otherwise a level-60 player's lifetime tallies pre-complete every late calling
    // and all fifty friends arrive by level 65 (the math said so).
    const c=CALLINGS[w];
    const raw = c.t==="friends" ? Object.keys(P.grove).length : (P.tally[c.t]||0);
    // A PLACE-CALLING COUNTS FOR LIFE, whatever tier it sits in. Windowing it was harmless
    // while a biome lasted five levels and every place came round every twenty-five; at
    // eighteen a full circuit is ninety, so a fish that starts listening just after you
    // leave the pond waits seventy levels for it to return - and the window is three wide,
    // so it blocks the two behind it for all of that. The pity valve does not reach these:
    // it only fires below ten friends, and the fish is the eighteenth.
    if(/^regionwin/.test(c.t) || CALLING_ORDER.indexOf(w)<6) return {have:Math.min(raw,c.n), n:c.n};
    const base=P.callBase[w];
    return {have: base==null ? 0 : Math.min(Math.max(0,raw-base),c.n), n:c.n};
  },
  /* ══ CAN THIS FRIEND HEAR YOU? ══
     The map replaces the level gate. A friend listens from its own country onwards - you
     never lose one by walking past, which is what makes the map forgiving rather than a
     lockout - but you cannot reach ahead into a country you have not yet walked. That is
     the pacing, and it needs no counter: however well you play, only the creatures who live
     in the Clearing can answer you in the Clearing.
     Depth staggers arrivals inside a country so its back half is not empty. */
  /* ══ THE COURTSHIP ══
     How a friend is earned: do the thing it loves, in one round, while it is listening.

     This is the same taste it will reward once it is yours, which makes the courtship the
     cheapest tutorial in the game - you learn what the mouse wants by earning her, so when
     she takes a seat you already know how to play her. Nothing is explained anywhere.

     The COUNT comes from the measured rate of that taste, not from taste: crumbs happen
     2.65 times a round so the crumb-lovers ask for four, a four-letter word happens 1.03
     times so those ask for two, and anything rarer asks once. A courtship you would pass by
     accident is not a courtship, and one you can never pass is a wall. */
  courtNeed(g){
    const sign = g.wake && g.wake.on;
    if(!sign) return null;                     // passives are courted by their own meaning below
    const f = SIGNS[sign] && SIGNS[sign].freq;
    if(f==null) return 2;                      // unmeasured taste: ask twice and watch it
    if(f >= 8)   return 10;                    // per-drop things: four of them is not an ask
    if(f >= 2)   return 4;                     // everyday - crumbs, tumbles
    if(f >= 0.8) return 2;                     // most rounds - four-letter words, obstacles
    return 1;                                  // rare enough that once is the whole ask
  },
  /* ══ FIFTY ASKS, AUTHORED - the courtship IS the creature ══
     Derived asks collapsed: with the new roster, TWENTY-EIGHT friends asked the identical
     "4 words in one round", which is not a courtship, it is a toll. Every ask below is
     hand-set from the friend's own character, against the measured sign rates, so doing
     the thing it loves is both the invitation and the cheapest tutorial for its power.
     [sign, count] - counted by the round's own sigs, same meter as before.
     Signs must exist in SIGNS; counts sized so an aware player lands them in one round. */
  COURT: {
    /* the First Clearing - small asks for small friends */
    /* ══ MEETING A FRIEND AND ITS POWER ARE TWO DIFFERENT ASKS ══ the dove's courtship was a
       flourish, the same rare thing its power waits on. In the First Clearing that means a
       five-letter word, on a seven-wide board, in a round where every friend is asleep for
       the meeting - so the one creature you cannot get help with asked for the hardest play
       in the game. Reported twice over: "speak one flourish is a difficult task with pets
       asleep", and "DOVE did not wake up once equipped - no markers present to help it".
       Its WAKE stays a flourish, because that is who the dove is. Only the toll to meet it
       comes down to something a player at level 16 can actually aim at. Judgement call made
       without the designer present; it is one pair of values. */
    bee:["word3",4], mouse:["word3",5], robin:["anyWord",3], dove:["word4",2],
    chick:["vowel",6], worm:["cascade",1],
    /* the Bramblewood */
    fox:["flourish",1], hare:["obstacle",3], moth:["gold",1], crow:["gold",2],
    raccoon:["crate",1],
    /* the Mosswood */
    snail:["drop",12], lamb:["vowel",8], deer:["food",1], pony:["drop",10],
    boar:["obstacle",3],
    /* the Spore Hollow */
    fly:["doubled",1], ant:["word3",6], skunk:["doubled",2], ladybug:["anyWord",5],
    /* the Listening Pond */
    heron:["weather",1], duck:["vowel",7], fish:["gold",1], beaver:["held",1],
    /* the Reedmarsh */
    pig:["obstacle",4], frog:["cascade",1], spider:["word4",2],
    /* the Running River */
    crab:["word3",5], moose:["word4",2], bear:["held",2],
    /* the Thunderfalls */
    wolf:["anyWord",6], bison:["obstacle",4], hawk:["word4",2],
    /* the Undercave */
    bat:["mirror",1], snake:["word5",1], lizard:["rare",1],
    /* the Deep Dark */
    owl:["nested",1], seal:["word3",6], turtle:["held",2],
    /* the Glimmer Seams */
    swan:["word4",3], cricket:["cascade",2],
    /* the Scree Slopes */
    goat:["obstacle",5], dragon:["word4",3],
    /* the Windward Ridge */
    goose:["vowel",8], golem:["obstacle",5],
    /* the Snowline */
    penguin:["obstacle",4], wyrm:["word5",1],
    /* the Frozen Crown */
    phoenix:["flourish",2],
    /* the starters' own asks, for completeness (both arrive by other doors) */
    cat:["word3",3], dog:["anyWord",4],
  },
  courtship(g){
    const a = Game.COURT[g.w];
    if(a && SIGNS[a[0]]) return { sign:a[0], n:a[1] };
    if(g.ps) return { sign:"anyWord", n:4 };            // an unlisted passive falls back
    const sign = g.wake && g.wake.on;
    return sign ? { sign, n:Game.courtNeed(g) } : null;
  },
  /* has this round satisfied it? */
  courted(w){
    const g = GROVE_BY_WORD[w]; if(!g) return false;
    const c = Game.courtship(g); if(!c) return false;
    return ((S && S.sigs && S.sigs[c.sign]) || 0) >= c.n;
  },

  canHear(w){
    const h = HOME[w];
    if(!h) return false;                       // keystones are given at doors, never found
    const [country, depth] = h;
    const here = biomeOf(P.level);
    if(here > country) return true;            // you have walked past; the wood remembers
    if(here < country) return false;           // not yet - this is the whole pacing rule
    return ((Math.max(1, advOf(P.level)) - 1) % BIOME_LEN) >= depth;
  },
  /* who is abroad in this country right now - the Book's map reads this too */
  hereNow(){ return GROVE.filter(g=>HOME[g.w] && HOME[g.w][0]===biomeOf(P.level))
                          .map(g=>({ w:g.w, met:!!P.metGrove[g.w], listening:Game.canHear(g.w) })); },

  checkCallings(){
    // nothing calls before the cat is met - the pet system doesn't exist yet for
    // this player, and a mystery toast about it would be noise, not wonder
    if(!P.metGrove || !P.metGrove.cat) return;
    const plv = advOf(P.level);
    // THE SPACING RULE: never two callings summoned within CALL_GAP player-levels, so even
    // when several achievements land at once the friends still arrive one at a time.
    const gapOK = plv - (P.lastSummonL==null ? -99 : P.lastSummonL) >= CALL_GAP;
    /* THE WINDOW IS NOW THE MAP. It used to be the next three un-called creatures in a
       fixed roster order, which meant every player collected the same friends in the same
       sequence - convergent by construction, and the reason no two collections could ever
       differ. Now it is whoever lives where you are standing: the country decides who can
       answer, and which of them you earn first is decided by how you play. Two players walk
       the same road and come home with different friends.
       No .slice() any more - a country holds at most five, and the gap rule below already
       makes them arrive one at a time. */
    /* ══ THE FLOOR - the wood's own promise ══ every homed friend has an authored depth
       (its HOME country entry + stagger). REACHING that depth calls it regardless of how
       you played: nobody is ever late, nobody misses a friend for not knowing its ask.
       The courtship below stays as the VALVE - do the thing it loves inside its own
       country and it steps out early, "it heard you, and couldn't wait." canHear() caps
       the valve to the friend's own country, so nothing is ever chased across the map.
       The old lifetime-tally door is GONE: one guarantee, one hunt, both visible. */
    /* arrivals were authored in FLOOR_AT and seats in seatsByLevel, two hand-written tables
       nothing ever compared - the same fault as the ice, producing the opposite complaint at
       each end: two pets and one seat early, five pets by level 20 later. Seven friends are
       homed in the First Clearing and it never seats more than four. One clock now: a friend
       is called only while the bench has room - everyone met plus everyone on their way may
       exceed the seats by exactly one. Nothing is lost; a floor that cannot pay today is
       re-checked every round. Raise BENCH to loosen it. */
    const BENCH = 1;
    const roomToArrive = () => {
      try{
        const met=Object.keys(P.metGrove||{}).length;
        const coming=(P.summonQ||[]).length + (P.summon?1:0);
        return (met + coming) < (slotsFor(P.level) + BENCH);
      }catch(e){ return true; }
    };
    if(gapOK && roomToArrive()) for(const w in HOME){
      if(P.called[w] || P.grove[w] || !GROVE_BY_WORD[w]) continue;
      const h=HOME[w], floor=(FLOOR_AT[w]!=null ? FLOOR_AT[w] : h[0]*20+(h[1]||0));
      if(plv >= floor){
        P.called[w]=1; P.summonQ.push(w); P.quietLvls=0; P.lastSummonL=plv;
        P.annQ.push({ k:"ann-sum-"+w, b:(UI.artTag(w)||GROVE_BY_WORD[w].e),
          s:"The <b>"+w+"</b> steps out of "+(BIOME_NAMES[h[0]]||"the wood")+". It has been watching you walk for a while now.",
          g:"🐾 Meet them next round - show them the thing they love." });
        save();
        break;   // one scheduled arrival at a time - same spirit as the gap rule
      }
    }
    const win=(roomToArrive() ? CALLING_ORDER : []).filter(w=>!P.called[w] && !P.grove[w]
                                      && CALLINGS[w].t!=="school" && Game.canHear(w));
    for(const w of win){
      const c=CALLINGS[w];
      // entering the window starts the creature's own clock (the achievement can build
      // toward it even while the LEVEL gate below still holds the arrival back)
      if(CALLING_ORDER.indexOf(w)>=6 && P.callBase[w]==null){
        P.callBase[w] = c.t==="friends" ? Object.keys(P.grove).length : (P.tally[c.t]||0); save();
      }
      /* THE LEVEL GATE IS GONE - canHear() above is the gate now, and it is a better one
         because a player can SEE it: you are in the Mosswood, so the Mosswood's friends are
         the ones who might answer. CALL_MINL described the same pacing as an invisible
         number per creature, and two systems saying the same thing is one that will drift. */
      if(!gapOK) continue;   // a friend arrived too recently; this one waits its turn
      /* EARNED BY DOING THE THING IT LOVES, in this round, while it is listening. The old
         calling still counts as a second door - some of them are lovely and lifetime-shaped
         ("clear 150 words") in a way a single round cannot express - so a friend answers to
         either. What changed is that the everyday way in is now something you can feel
         happening rather than a hidden lifetime tally. */
      /* courted-only now: the lifetime tally was the second system, and the FLOOR above
         is a better guarantee than a hidden number - visible, authored, identical for
         every player. The tally data stays for the Book's flavour, gates nothing. */
      if(Game.courted(w)){
        P.called[w]=1; P.summonQ.push(w); P.quietLvls=0; P.lastSummonL=plv;
        Game.amber(10);
        // NEVER announced mid-play - the player is busy playing. The summons waits
        // for the win sequence, its own quiet card before the level-clear modal.
        P.annQ.push({ k:"ann-sum-"+w, b:(UI.artTag(w)||(GROVE_BY_WORD[w]&&GROVE_BY_WORD[w].e)||"🐾"),
          s:c.s, g:"🐾 A name will hide in a coming level - watch for the meeting." }); save();
        return; // one summon at a time; the next event re-checks
      }
    }
    save();
  },

  cheer(n){ // a crate, a quest, a cascade - the shelf reacts, but nothing is charged any
    // more. Friends wake to their own signs now; this is the sound of them noticing.
    if(!S || !UI.equipped().length) return;
    UI.petMeter();
    const pb=$("petbar"); pb.classList.remove("pulse"); void pb.offsetWidth; pb.classList.add("pulse");
    setTimeout(()=>pb.classList.remove("pulse"),520);
    Snd.tone(880,{dur:.08,type:"triangle",gain:.06});
  },

  /* ============ FRIENDS WAKE TO THE WORDS YOU MAKE ============
     Every friend watches its OWN event and stirs when it has seen enough of them.
     There is no shared meter and no rotation: the word you choose to make is the friend
     you choose to wake, which is agency without another tap or another pause.

     Because the events differ, something is always ticking - a drop that spells nothing
     still wakes whoever is counting consonants. And because one friend's gift is another
     friend's trigger, the chains write themselves: the dog hands you a four-letter word,
     which is exactly what the swan is waiting for.

     THE LAW, enforced by how often a trigger fires rather than by hand: a consonant lands
     roughly fifteen times a round and a five-letter word about once, so a friend watching
     consonants must need MANY of them or give very little. Every wake count in GROVE is
     set against SIGNS[sign].freq, which is where those numbers now live. */

  /* one event just happened - every friend counting it takes a step toward waking */
  /* except - the friend that CAUSED this sign, which must not be fed by its own work.
     The old rule was blunter: a friend's word emitted nothing at all, to stop a friend
     buying its own next act (a modelled runaway once scored 946 against a 530 target).
     That guard was right about the danger and too wide about the cure - it also stopped the
     cat from ever feeding the dog, which is why a party of four behaves like four separate
     animals instead of a row. Now the maker is excluded and everyone else hears it. */
  sees(ev, n, except){
    if(!S || S.over || S.won || !ev) return;
    /* AND IT IS DEAF TO EVERYTHING IT CAUSES, not only to the words it spells. A power that
       tumbles the board raises `cascade`, one that breaks a stone raises `obstacle`, and
       neither passed an exclusion - so a friend listening for the very thing its own power
       produces could crank itself. Defaulting the exclusion to whoever is mid-act closes
       every path at once instead of at each call site, where the next one would be missed. */
    if(!except && S.petActing && S.petActor) except = S.petActor;
    /* THE ROUND COUNTS WHAT IT HAS SEEN. A courtship asks for a creature's own taste N
       times in one round, so this is the meter it reads - and it counts the sign whoever
       raised it, because a friend helping you court another friend is a lovely thing and
       not a cheat. */
    S.sigs = S.sigs || {}; S.sigs[ev] = (S.sigs[ev]||0) + (n||1);
    S.wake = S.wake || {};
    for(const g of Game.petActives()){
      if(except && g.w===except) continue;
      // ONE DROP, ONE ACT EACH, however long the chain runs. Without this a cat can wake a
      // dog whose word wakes the cat again, and the move budget stops limiting anything.
      if((S._actedThisDrop||[]).includes(g.w)) continue;
      const w=g.wake; if(!w || w.on!==ev) continue;
      S.wake[g.w] = (S.wake[g.w]||0) + (n||1);
      /* THE COUNT IS NOT CLEARED HERE ANY MORE. It used to zero the moment it filled, which
         meant the meter jumped from three-of-four straight back to empty and the player
         never once saw a friend's pips complete - the whole point of the meter. It stays
         full while the friend waits its turn (which also reads correctly when a lesson or a
         naming is holding it back), and tryPetAct clears it after the friend has actually
         gone out and done the thing. */
      if(S.wake[g.w] >= Game.wakeNeed(g)){ S._woke = S._woke || [];
        // never queue the same friend twice - through a long lesson a drop-counter would
        // otherwise stack up and then empty itself all at once the moment teaching stopped
        if(!S._woke.includes(g.w)) S._woke.push(g.w); }
    }
    // …and repaint on EVERY sign, not only on a wake. Gated on S._woke, the pips only ever
    // redrew at the instant a friend woke - so all the progress in between, which is what
    // a meter is for, happened invisibly.
    UI.petMeter();
  },
  /* how far along a friend is, for the sleep dots on its card */
  wakeAt(g){ if(!g.wake) return null;
    return { have: (S && S.wake && S.wake[g.w]) || 0, need: Game.wakeNeed(g) }; },

  /* ============ FRIENDS GROW WITH YOU ============
     Every friend you own gains a tier at a milestone - never by use. Levelling the ones
     you play would have fought this whole design: a freshly swapped-in Lv1 sitting beside
     your Lv3 regular means you stop swapping, which is the exact habit the triggers exist
     to break. Milestones lift the whole collection at once, so a swap costs nothing but
     thought.

     And it is load-bearing, not garnish. Modelled with a fixed power budget, the target
     that holds a 50% win rate FLATLINES at 240 from L110 and never moves again for two
     hundred levels. Growth is what lets the wood keep asking for more. */
  /* FIVE GROWINGS NOW, NOT THREE. The measured wall: the ask grows x30 across the walk
     and pets were the only thing meant to grow with it, yet their growth stopped at L150
     while the ask kept climbing for 150 more levels. The two new growings land where the
     no-pet gap was measured at x3.8-x4.0, and the steeper steps double-dip on purpose:
     TIER_MUL divides wake counts too, so a grown friend acts OFTENER as well as BIGGER -
     which is exactly the cadence the four-arm sim showed the late parties starving for. */
  TIER_AT:[40,90,140,190,240],          // five growings, and the wood is different after each
  TIER_MUL:[1, 1.45, 2.0, 2.7, 3.5, 4.4],
  petTier(){ let t=0; for(const L of Game.TIER_AT) if((P.level||1)>=L) t++; return t; },
  tierMul(){ return Game.TIER_MUL[Game.petTier()] || 1; },
  /* a grown friend does MORE and waits LESS. The waiting half matters most: it is the
     only lever that reaches a power with no number in it. */
  wakeNeed(g){ if(!g.wake) return 0;
    return Math.max(1, Math.round(g.wake.n / Game.tierMul())); },

  petActives(){
    // a gate can bar one named friend - telegraphed on the card, never the only answer
    { const g=gateAt(S?S.level:0);
      if(g&&g.bars) return UI.equipped().filter(x=>x.w!==g.bars); } return UI.equipped().filter(g=>!g.ps); },
  hasPassive(t){ return UI.equipped().some(g=>g.ps && g.fx.t===t); },
  petNeed(){ const n=Game.petActives().length; return n>=2 ? 2 : 3; },
  // petCap() lived here - acts per round, 1/2/3 by level. Deleted with the shared meter:
  // it threw away charge the player had already earned (3-5 wasted charges a round for a
  // strong player), and the wake counts pace the friends far better than a cap ever did.
  async tryPetAct(){
    if(S.over || S.won) return;
    if(!S._woke || !S._woke.length) return;
    // a decided round takes no more help - firing a power into a finished board
    // reads as the game wasting YOUR charge. The win it was saving arrives anyway.
    const decided = (S.goal && S.goal.t!=="hush")
      ? (S.goal.have>=S.goal.need && (!S.goal2 || S.goal2.have>=S.goal2.need))
      : (S.levelScore>=S.target && !S.tutorWord);
    if(decided){ S._woke.length=0; return; }
    // THE WOOD IS TEACHING. A lesson is a scripted board with one right answer, and a
    // friend acting inside it changes the board under the player mid-sentence - measured:
    // the cat gilded a letter during lesson one, while the game was still saying "tap this
    // column". Friends keep counting through a lesson and act the moment it ends, which
    // reads as them waiting politely rather than as them being switched off.
    // …unless the lesson is ABOUT a friend acting. Lessons one to three script the board
    // and a friend moving a tile there changes the answer mid-sentence; lesson five
    // scripts nothing and its whole subject is the cat waking up, so switching the cat
    // off inside it left a player dropping letters at a promise that never arrived.
    if(S.guide && !S.guide.letFriendsAct) return;
    // A NAMING IS A SCRIPTED ANSWER, exactly like a lesson. Building RACCOON means holding
    // seven letters in place across several turns, and a friend that pats a letter into
    // "one that fits" or rearranges tiles into a longer word is dismantling the very name
    // the round is asking for. They keep counting and act the moment the round ends.
    if(S.tutorWord) return;
    // rituals own the stage: a reveal or a meet in progress means the friend WAITS -
    // it stays awake in the queue and acts on the next quiet drop.
    if(S.pendingReveal || document.querySelector(".whosthat") || $("ov-meet").classList.contains("active")) return;
    // no per-round cap any more: the wake counts ARE the pacing, and a cap on top of
    // them threw away charge the player had earned (measured at 3-5 wasted charges a
    // round for a strong player, which punished exactly the people playing best).
    while(S._woke.length){
      const g=GROVE_BY_WORD[S._woke.shift()];
      if(!g || !UI.equipped().includes(g)) continue;
      S.petActs=(S.petActs||0)+1;
      await Game.petAct(g);
      // NOW the meter empties - the friend has gone, done its work and come home, so the
      // pips draining is the end of that story rather than a number vanishing before it.
      if(S.wake) S.wake[g.w]=0;
      UI.petMeter();
      if(S.over || S.won) break;
    }
  },
  movesFloat(n){ const f=document.createElement("div"); f.className="movesfloat"; f.textContent="+"+n;
    const mb=$("movesbox").getBoundingClientRect(), ar=$("app").getBoundingClientRect();
    f.style.left=(mb.left-ar.left+mb.width/2-10)+"px"; f.style.top=(mb.top-ar.top)+"px";
    $("app").appendChild(f); setTimeout(()=>f.remove(),1000); },
  addMoves(n){ S.movesLeft+=n; UI.hud(); boardEl.classList.toggle("danger", S.movesLeft<=3); Game.movesFloat(n); },
  async settle(changed){ const fell=await Game.gravity(); S.chain=1; await Game.resolve([...(changed||[]),...(fell||[])]); },
  worstTiles(n){ // qzxjv first, then the priciest letters - the stuff that clogs a board
    const ts=Object.values(S.tiles).filter(t=>t.kind==="normal");
    return ts.sort((a,b)=>{
      const ja="qzxjv".includes(a.letter), jb="qzxjv".includes(b.letter);
      if(ja!==jb) return ja?-1:1;
      return VAL[b.letter]-VAL[a.letter];
    }).slice(0,n);
  },
  /* WORDS THROUGH ONE TILE ONLY. findWords() scans the whole board, which is 21 line scans;
     the cat has to try up to 26 letters on every candidate tile, so the whole-board version
     would be thousands of scans per turn. Everything the cat cares about passes through the
     tile it just changed, so three scans answer it. */
  wordThrough(t){
    if(!t) return null;
    const col=S.board.map(r=>r[t.c]);
    const hits=[...scanLine(S.board[t.r]), ...scanLine(col), ...scanLine([...col].reverse())];
    return hits.find(w=>w.cells.includes(t) && !w.cells.every(c=>c.heldWord===w.word)) || null;
  },
  catFit(cands){
    const AZ="abcdefghijklmnopqrstuvwxyz".split("");
    const pool=[...cands].sort(()=>Math.random()-.5);
    // TIER 1 - a letter that finishes a word where it stands
    for(const t of pool){
      const was=t.letter;
      for(const L of AZ){
        if(L===was) continue;
        t.letter=L;
        if(Game.wordThrough(t)){ t.letter=was; return {t, L, tier:1}; }
      }
      t.letter=was;
    }
    // TIER 2 - a letter that puts a word one drop away, using the letter already in hand
    const hand = S.cur && S.cur.kind==="normal" ? S.cur.letter : null;
    if(hand){
      for(let c=0;c<COLS;c++){
        if(S.board[0][c]) continue;
        let land=ROWS-1; while(land>=0 && S.board[land][c]) land--;
        if(land<0) continue;
        const fake={ id:"catfake", letter:hand, kind:"normal", r:land, c, inner:null };
        S.board[land][c]=fake;
        for(const t of pool){
          const was=t.letter;
          for(const L of AZ){
            if(L===was) continue;
            t.letter=L;
            if(Game.wordThrough(fake)){ t.letter=was; S.board[land][c]=null; return {t, L, tier:2}; }
          }
          t.letter=was;
        }
        S.board[land][c]=null;
      }
    }
    return null;   // TIER 3
  },
  retype(t,l){ t.letter=l; delete t.heldWord; // a new letter is a new tile - old spends don't apply
    t.inner.innerHTML=t.letter.toUpperCase()+"<small>"+VAL[t.letter]+"</small>";
    t.inner.classList.add("thawpop"); setTimeout(()=>t.inner.classList.remove("thawpop"),560); },
  handPop(){ const cw=document.querySelector("#currentwrap .tile"); if(cw){ cw.classList.add("thawpop"); setTimeout(()=>cw.classList.remove("thawpop"),560); } },

  async petAct(pet){
    const actives=Game.petActives(); if(!actives.length) return;
    // the friend is named by whoever woke - no rotation, because the player chose it
    // by choosing what to spell
    if(!pet) pet=actives[0];
    S.lastAction=Date.now();
    Game.tallyEv("act");
    const eq=UI.equipped();
    // powers land at their own strength now - the same-home doubling is gone, and the
    // milestone upgrades in phase 3 are what will make a friend stronger instead
    const boost=false;
    S.petActing=true;
    /* WHO is acting, not just THAT somebody is. recordWord needs the name so a friend's own
       word can feed the rest of the party without feeding the friend that made it. */
    S.petActor=pet.w;
    S._actedThisDrop = S._actedThisDrop || [];
    if(!S._actedThisDrop.includes(pet.w)) S._actedThisDrop.push(pet.w);
    const el=$("pet-"+eq.indexOf(pet)) || $("pet-0");
    el.classList.remove("happy"); void el.offsetWidth; el.classList.add("happy");
    Snd.discover(); buzz([25,40,60]);
    UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" <b>"+pet.pn+"</b> "+pet.pi+(boost?" ×2":""));
    // THE FRIEND COMES OUT. It hops from its seat onto the board, stands where it is
    // about to work, names its power there, and walks back when it's done - so a power
    // is something a creature you collected DOES, not something that happens to you.
    // WHERE A FRIEND GOES MUST BE WHERE IT IS ACTUALLY WORKING. Powers that act on the
    // board fly to the tile they change; a power that helps ANOTHER FRIEND crosses to that
    // friend's badge. The buzz target is chosen here, before the journey, so the bee cannot
    // land on one friend and then nudge a different one.
    let buzzT=null;
    if(pet.fx.t==="buzz"){
      // never buzz a friend who is ALREADY awake and queued - that help lands on somebody
      // who needs none, and the player watches the bee cross the shelf to do nothing
      const others=Game.petActives().filter(g=>g!==pet && g.wake && !(S._woke||[]).includes(g.w));
      if(others.length){
        const togo=g=>Game.wakeNeed(g)-((S.wake&&S.wake[g.w])||0);
        buzzT=others.slice().sort((a,b)=>togo(a)-togo(b))[0];
      }
    }
    const visit = buzzT ? await UI.petVisitSeat(pet, buzzT)
                        : await UI.petVisit(pet, Game.petTarget(pet.fx));
    await wait(300);
    // a grown friend gives more of whatever it gives - legendary powers carry no count,
    // so they are untouched by this and stay exactly as strong as the day you met them
    /* ══ THE BOND deepens a loved friend ══ every ten gratitudes is a rank (cap 3), and
       each rank is worth ~a seventh of a tier. Love, priced in words, paying in warmth. */
    const bondLv=Math.floor((((typeof P!=="undefined"&&P.bond)||{})[pet.w]||0)/10);
    const fx=pet.fx, m=Math.max(1, Math.round(Game.tierMul()*(1+0.15*bondLv)));
    const normals=()=>Object.values(S.tiles).filter(t=>t.kind==="normal");
    const cols=()=>{ const h=[]; for(let c=0;c<COLS;c++){ let n=0; for(let r=0;r<8;r++) if(S.board[r][c]) n++; h.push(n); } return h; };
    const rowTiles=(r)=>{ const out=[]; for(let c=0;c<COLS;c++){ const t=S.board[r][c]; if(t&&(t.kind==="normal"||t.kind==="gold"||t.kind==="wild")) out.push(t); } return out; };
    const run = POWERS[fx.t];
    S._actingPet = pet;   // so a power that cannot find work can still say whose turn it was
    if(run) await run({ fx, m, pet, boost, el, normals, cols, rowTiles, buzzT });
    else console.warn("no power handler for \"" + fx.t + "\" (" + pet.w + ")");
    S._actingPet = null;
    /* ══ THE ECHO ══
       A friend's work is heard by the rest of the row, in a family DELIBERATELY different
       from the one that woke it - that cross-family hop is what makes four friends a chain
       rather than four echoes of the same note. sees() already makes the actor deaf to it,
       so a friend cannot answer its own call however the table is later retuned. */
    if(pet.echo) Game.sees(pet.echo, 1, pet.w);
    // 🛶 River Games: frog & otter play on - a bonus paw charge
    if(visit) await visit.home();                                   // back to its seat, job done
    S.petActing=false; S.petActor=null;
    UI.petMeter(); UI.all(); saveRun();
  },
  /* WHERE THE FRIEND STANDS, and - more importantly - WHICH TILE IT IS ABOUT TO TOUCH.
     These used to be two separate decisions: the visit picked a random plain tile to walk
     to, and then the power went off and chose its own. So the bee flew to one letter and
     lifted a different one, which reads as the friend doing nothing and something else
     happening on its own.
     The aim is chosen ONCE here and stashed. Single-tile powers below use it rather than
     picking again, so what the player watches is what the friend does. */
  petTarget(fx){
    /* never aim at a tile that is mid-clear - the cat was photographed standing on empty
       sky where the ARK it aimed at had just dissolved (the replay's best frame) */
    const ts=Object.values(S.tiles).filter(t=>!(t.inner && t.inner.classList.contains("lit")));
    const pick=a=>a.length?a[Math.floor(Math.random()*a.length)]:null;
    const heights=()=>{ const h=[]; for(let c=0;c<COLS;c++){ let n=0;
      for(let r=0;r<ROWS;r++) if(S.board[r][c]) n++; h.push(n); } return h; };
    const topOf=c=>{ for(let r=0;r<ROWS;r++) if(S.board[r][c]) return S.board[r][c]; return null; };
    let t=null;
    switch(fx.t){
      case "liftTop": { const h=heights(); t=topOf(h.indexOf(Math.max(...h))); break; }
      case "goldCol": { const h=heights(); let c=-1, low=Infinity;
        for(let i=0;i<COLS;i++) if(h[i]>0 && h[i]<low){ low=h[i]; c=i; }
        t = c<0 ? null : topOf(c); break; }
      /* this picked a random neighbourly letter to fly to, and pawPat then asked catFit
         which letter could actually be improved. Two decisions about one gesture, so when
         the aimed tile could not be improved the cat flew to the J and changed the N. */
      case "pawPat": { const ns=ts.filter(x=>x.kind==="normal");
        let fit=null; try{ fit=Game.catFit(ns); }catch(e){}
        if(fit && fit.t){ t=fit.t; break; }
        const social=ns.filter(x=>(x.c>0 && S.board[x.r][x.c-1]) || (x.c<COLS-1 && S.board[x.r][x.c+1]));
        t=pick(social.length?social:ns); break; }
    }
    /* the bat used to be aimed from here, back when it flew down and slid a letter
       sideways. It is a passive now and never leaves the shelf, so there is nothing to
       aim - the rule it changes is true everywhere on the board at once. */
    t = t
      || (/stone|rock|crack|boulder/i.test(fx.t) && pick(ts.filter(x=>x.kind==="stone")))
      || (/ice|thaw|frost|melt/i.test(fx.t)     && pick(ts.filter(x=>x.kind==="ice")))
      /* honest aims for the new single-target powers - the walk goes where the work is */
      || (fx.t==="goatEat"  && pick(ts.filter(x=>OBSTACLE_KINDS.includes(x.kind) && x.kind!=="crate")))
      || (fx.t==="boarRoot" && pick(ts.filter(x=>x.kind==="root")))
      || (fx.t==="harePath" && (ts.find(x=>x.kind==="bramble")||ts.find(x=>x.kind==="branch")))
      || null;
    S._petAim = t || null;
    /* NO MORE RANDOM STAND-INS. A power with no single target is board-wide or hand-bound,
       and walking to a random letter faked a precision the act could not keep - the friend
       walked one way while the change landed another (caught live by the designer). The
       ruling: the CENTRE of the board. The friend addresses the whole stage. */
    return t ? {r:t.r,c:t.c} : {r:Math.floor(ROWS/2),c:Math.floor(COLS/2)};
  },
  /* the tile the visit aimed at, if it is still on the board */
  petAim(){ return (S && S._petAim && S.tiles[S._petAim.id]) ? S._petAim : null; },
  async petAlign(minLen){ // find two tiles whose swap makes a word of minLen+ - and weave it
    const ts=Object.values(S.tiles).filter(t=>t.kind==="normal"||t.kind==="gold");
    for(let i=ts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [ts[i],ts[j]]=[ts[j],ts[i]]; }
    for(let i=0;i<ts.length;i++) for(let j=i+1;j<ts.length;j++){
      const a=ts[i], b=ts[j];
      if(a.letter===b.letter) continue;
      S.board[a.r][a.c]=b; S.board[b.r][b.c]=a;
      const ar0=a.r,ac0=a.c; a.r=b.r; a.c=b.c; b.r=ar0; b.c=ac0;
      const hit=findWords().find(w=>w.cells.length>=minLen && (w.cells.includes(a)||w.cells.includes(b))
        && !w.cells.every(c=>c.heldWord===w.word)); // never weave toward a word the player already spent
      if(hit){
        // keep the board state and animate the weave
        [a,b].forEach(x=>{ x.el.style.transition="transform .5s cubic-bezier(.4,.05,.35,1)"; });
        placeTile(a,a.r,a.c,false); placeTile(b,b.r,b.c,false);
        UI.breeze();
        await wait(540);
        [a,b].forEach(x=>{ x.el.style.transition=""; });
        S.chain=1; await Game.resolve([a,b]);
        return true;
      }
      // revert
      S.board[a.r][a.c]=b; S.board[b.r][b.c]=a;
      const ar1=a.r,ac1=a.c; a.r=b.r; a.c=b.c; b.r=ar1; b.c=ac1;
    }
    return false;
  },
});
