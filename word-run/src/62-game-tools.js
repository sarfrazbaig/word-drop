Object.assign(Game, {
  /* these capped in silence: a player at the cap made the word that buys the wind, saw
     nothing, then saw a friend make a word and a breeze appear - and reported that the game
     paid the cat and not them. The pouch was full both times. The refusal now speaks. */
  /* thirty-four powers ended in a silent addMoves() when the board gave them no work: the
     dog with no letter to fetch, the worm with no pile deep enough. The player saw a friend
     fly out, saw a spare move appear, and had no way to connect them. */
  petShrug(n){
    n = n || 1;
    Game.addMoves(n);
    try{
      const pet = S && S._actingPet;
      const who = pet ? ((UI.artTag(pet.w,"toastimg")||pet.e)+" ") : "";
      UI.petEdge(who+"found nothing to work with - <b>+"+n+" move"+(n>1?"s":"")+"</b> instead");
    }catch(e){}
  },
  earnBreeze(){
    const was=P.pow.swap||0;
    P.pow.swap=Math.min(TOOL_CAP,was+1); save();
    if(P.pow.swap===was){ UI.say("breeze-full","breezes are full - spend one and your next 3-letter word buys another",2); return false; } // 🌰 Nest & Stash holds more
    UI.breezePill(); UI.pillPop("breezepill");
    Snd.tone(880,{dur:.08,type:"triangle",gain:.05});
    // the explanation is queued, not raced - see Game.showPendingTip
  },
  armBreeze(){
    /* SILENCE IS WHAT MAKES PEOPLE HAMMER A BUTTON. A tester with one move left tapped this
       eight times in three seconds and rage_tap fired, because the board was mid-settle and
       the refusal was a bare early return. She stopped playing shortly after.
       The pill flinches EVERY time, which is the answer to "did my tap land". The sentence
       is said once, ever, because that is all it takes to learn what a busy board is. */
    if(!S || S.over || S.won) return;
    if(S.busy){ Game.denyPill("breezepill");
      Alder.aside("busy-board","🍃 the board is still settling - the breeze answers the moment it is still",{once:true,pri:1});
      return; }
    // a no-tools gate does not TAKE your breezes - they are still in your pocket after,
    // and they still count. They simply do not answer inside this round.
    { const g=gateAt(S.level);
      if(g && g.noTools){ Snd.reject(); buzz(40);
        UI.say("gate-notools","🌿 <b>no tools in this round</b> - your breezes are kept, they just do not work here",3);
        return; } }
    Snd.init(); S.lastAction=Date.now();
    // during a lesson the breeze answers ONLY when the lesson says so. A curious tap
    // used to ARM it silently and then "drop the T" was impossible - a built-in fail
    // state inside lesson 2 itself (caught by the user, playing).
    if(S.guide && !S.guide.allowBreeze){
      const el=$("breezepill");
      el.classList.remove("deny"); void el.offsetWidth; el.classList.add("deny");
      setTimeout(()=>el.classList.remove("deny"),350);
      Snd.reject(); return;
    }
    if(S.usingBreeze){ Game.disarmBreeze(); return; }
    if(!(P.pow.swap>0)){ Game.askBuy("swap"); return; }   // empty pocket - ASK, never auto-spend
    S.usingBreeze=true;
    $("breezepill").classList.remove("pillglow"); // the lesson's gleam is spent the moment it's used
    $("breezepill").classList.add("armed");
    Game.markBreeze(true);
    // no prompt here: lesson 2 gives the breeze a full page AND walks the player through
    // a swap. Repeating the instruction every time they arm it afterwards is nagging
    // someone who already knows - the armed pill and the ghost cursor say it fine.
    Snd.tone(620,{dur:.14,type:"sine",gain:.07,verb:true}); Snd.tone(930,{dur:.1,type:"sine",gain:.05,when:.09,verb:true});
    UI.ghost(-1);
    FT.signal("breezeArmed");
  },
  disarmBreeze(){
    S.usingBreeze=false;
    Game.markBreeze(false);
    if(S.swapSel){ S.swapSel.inner.classList.remove("selswap"); S.swapSel=null; }
    $("breezepill").classList.remove("armed");
  },
  /* ONE RULE, ONE PLACE. What the breeze will accept is decided in breezeAt below; if the
     board marked itself from a second copy of that test the two would drift the first time
     either changed. So the marking asks the same questions in the same order - including the
     lesson's swapOnly, which means lesson 2 lights exactly the two tiles it rings and
     nothing else, for free. */
  breezeTakes(t){
    if(!t || NONWORD.has(t.kind)) return false;
    if(S.guide && S.guide.swapOnly && !S.guide.swapOnly.includes(t.id)) return false;
    return true;
  },
  markBreeze(on){
    if(!S || !S.tiles) return;
    boardEl.classList.toggle("breezing", !!on);
    Object.values(S.tiles).forEach(t=>{
      if(!t.inner) return;
      const ok = on && Game.breezeTakes(t);
      t.inner.classList.toggle("canswap", !!ok);
      t.inner.classList.toggle("nowind", !!(on && !ok));
      // a field of grass does not all sway together
      // NEGATIVE, so every tile is already mid-twitch on the first frame. A positive delay
      // makes a tile wait its turn before it moves at all, and the mode looks like it is
      // still loading - which is exactly how the first version came across.
      if(ok) t.inner.style.animationDelay = "-" + (((t.c*5 + t.r*3) % 9) * 0.038).toFixed(3) + "s";
      else   t.inner.style.animationDelay = "";
    });
  },
  async breezeAt(row,col){ // pick two tiles; a gentle gust carries them past each other
    const t = S.board[row] && S.board[row][col];
    if(!t || NONWORD.has(t.kind)){ Snd.reject(); return; } // stone won't budge; ice is frozen solid
    // in lesson 2 only the two ringed tiles answer the wind - everything else bounces
    if(S.guide && S.guide.swapOnly && !S.guide.swapOnly.includes(t.id)){
      FT.deny();
      // three misses is someone hunting, not someone thinking. Fetch the help for them.
      FT.swapTries=(FT.swapTries||0)+1;
      if(FT.swapTries>=3 && FT.helpSwap) FT.helpSwap();
      return; }
    if(!S.swapSel){
      S.swapSel=t; t.inner.classList.add("selswap");
      Snd.tone(760,{dur:.09,type:"triangle",gain:.07}); buzz(8);
      return;
    }
    if(S.swapSel===t){
      t.inner.classList.remove("selswap"); S.swapSel=null;
      Snd.tone(420,{dur:.08,type:"triangle",gain:.06});
      return;
    }
    const a=S.swapSel, b=t;
    a.inner.classList.remove("selswap"); S.swapSel=null;
    S.busy=true;
    P.pow.swap--; save(); Game.disarmBreeze(); UI.breezePill();
    UI.breeze(); // the soft gust + drifting leaves
    const ar=a.r, ac=a.c, br=b.r, bc=b.c;
    S.board[ar][ac]=b; S.board[br][bc]=a;
    [a,b].forEach(x=>{ x.el.style.transition="transform .5s cubic-bezier(.4,.05,.35,1)"; });
    placeTile(a,br,bc,false); placeTile(b,ar,ac,false);
    [a,b].forEach(x=>{ x.inner.classList.add("gust"); setTimeout(()=>x.inner.classList.remove("gust"),700); });
    buzz([15,25,15]);
    await wait(520);
    [a,b].forEach(x=>{ x.el.style.transition=""; });
    S.lastAction=Date.now();
    FT.signal("swapped");
    Game.tallyEv("breeze");
    S._noBreezeGrant=true;                 // this word is the breeze's doing - it pays no breeze
    await Game.toolResolve([a,b]); // the grace applies - tap 🌱 hold to keep building
    S._noBreezeGrant=false;
    await Game.tryPetAct();
    S.busy=false;
    UI.all(); saveRun();
    Game.checkEnd();
  },

  /* ---- the WISH: your second tool. 4-letter words earn one; pick any letter for your next tile. ---- */
  earnWish(){
    const was=P.pow.wild||0;
    P.pow.wild=Math.min(TOOL_CAP,was+1); save();
    if(P.pow.wild===was){ UI.say("wish-full","wishes are full - spend one and your next long word earns another",2); return false; } // 🌰 Nest & Stash holds more
    UI.wishPill(); UI.pillPop("wishbtn");
    Snd.tone(1046,{dur:.08,type:"sine",gain:.05});
    // the explanation is queued, not raced - see Game.showPendingTip
  },
  openWish(){
    if(!S || S.busy || S.over || S.won) return;
    { const g=gateAt(S.level);
      if(g && (g.noTools||g.noWish)){ Snd.reject(); buzz(40);
        UI.say("gate-nowish","🌿 <b>no wishes in this round</b> - your stars are kept, they just do not work here",3);
        return; } }
    Snd.init(); S.lastAction=Date.now();
    // A LESSON CAN NOW INVITE IT. Every lesson used to refuse the star flatly, which meant
    // the tutorial could explain the wish but never let anyone spend one - three cards about
    // a tool, then five rounds before it is ever touched. allowWish opens it for exactly the
    // beat that asks for it, the same way allowBreeze already does.
    if(S.guide && !S.guide.allowWish){ // lessons own the stage - the star waits its turn
      const el=$("wishbtn");
      el.classList.remove("deny"); void el.offsetWidth; el.classList.add("deny");
      setTimeout(()=>el.classList.remove("deny"),350);
      Snd.reject(); return;
    }
    if(S.usingBreeze) Game.disarmBreeze();
    if(!(P.pow.wild>0)){ Game.askBuy("wild"); return; }   // empty pocket - ASK, never auto-spend
    // a wish reshapes a LETTER - a hand with no letter to reshape politely refuses,
    // and no wish is spent learning that
    const k=S.cur && S.cur.kind;
    if(k==="bomb"){ UI.sky("🌰 the acorn is already exactly what it wants to be"); Snd.reject(); return; }
    if(k==="wild"){ UI.sky("⭐ that star is already <b>every</b> letter at once"); Snd.reject(); return; }
    const grid=$("wish-grid");
    if(!grid.children.length){
      "abcdefghijklmnopqrstuvwxyz".split("").forEach(l=>{
        const t=document.createElement("div"); t.className="tile"; t.textContent=l.toUpperCase();
        t.onclick=()=>Game.pickWish(l);
        grid.appendChild(t);
      });
    }
    // the picker tells the truth about what you'll get: golden hand, golden choices
    const gold = k==="gold";
    [...grid.children].forEach(t=>t.classList.toggle("gold", gold));
    /* THE FIRST WISH IS SHOWN, NOT EXAMINED. Handed 26 equal choices with no idea what a
       wish is for, a beginner is being quizzed. The lesson lights the one letter that
       finishes the word in front of them and blanks the rest - they see the mechanic do its
       job once, and every wish after this one is the full alphabet. */
    const only = S.guide && S.guide.wishOnly;
    [...grid.children].forEach(t=>{
      const off = only && t.textContent.toLowerCase() !== only;
      t.classList.toggle("hushed", !!off);
    });
    $("wish-sub").innerHTML = only ? "choose the <b>"+only.toUpperCase()+"</b>"
      : gold ? "your <b>golden</b> letter becomes it - still golden ✨"
      : k==="shift" ? "your restless letter becomes it - still restless 🌀"
      : "your letter becomes it - drop it anywhere";
    // while a lesson is asking for one letter, the card offers nothing else at all
    $("ov-wish").classList.toggle("guided", !!only);
    $("ov-wish").classList.add("active");
    Snd.tone(780,{dur:.14,type:"sine",gain:.07,verb:true}); Snd.tone(1170,{dur:.1,type:"sine",gain:.05,when:.09,verb:true});
  },
  closeWish(){
    /* A GUIDED WISH HAS NO WAY OUT BUT THROUGH. The lesson waits on wishPicked, and there
       were THREE ways to leave this card without ever picking: the ✕, the backdrop behind
       it, and the pluck button. Any of them left that wait hanging forever - no error, no
       toast, no way back, the lesson simply dead with the board still live. The buttons are
       hidden while a lesson is asking (see openWish) and refused here as well, because a
       hidden control is a suggestion and a guard is a rule. */
    if(S && S.guide && S.guide.wishOnly) return;
    $("ov-wish").classList.remove("active"); },
  armPluck(e){ // the other kind of wish: take a letter OUT of the way
    if(e) e.stopPropagation();
    // the lesson asked for a letter, not for the board to be pruned - and plucking here
    // spends the same wish, so the beat could never be completed afterwards
    if(S && S.guide && S.guide.wishOnly){ Snd.reject(); buzz(30); return; }
    if(!(P.pow.wild>0)) { Game.closeWish(); return; }
    Game.closeWish();
    S.usingPluck=true;
    $("wishbtn").classList.add("armed");
    UI.say("arm-pluck", "🍂 <b>tap a tile</b> to pull it off the board");
    Snd.tone(700,{dur:.12,type:"sine",gain:.06,verb:true});
    UI.ghost(-1);
  },
  async pluckAt(row,col){
    const t = S.board[row] && S.board[row][col];
    S.usingPluck=false; $("wishbtn").classList.remove("armed");
    if(!t || (t.kind!=="normal" && t.kind!=="gold" && t.kind!=="shift")){ Snd.reject(); UI.sky("that one won't budge"); S.freePluck=false; return; }
    S.busy=true;
    if(S.freePluck){ S.freePluck=false; }             // 🦡 Digger pays the bill
    else { P.pow.wild--; save(); UI.wishPill(); }
    Game.tallyEv("pluck");
    UI.shards(t.r,t.c,"#e8c9a0"); removeTile(t); Snd.crack(true); buzz([15,30]);
    await wait(200);
    const fell=await Game.gravity();
    S.lastAction=Date.now();
    await Game.toolResolve(fell||[]); // the grace applies here too - tumbled words wait a breath
    await Game.tryPetAct();
    S.busy=false;
    UI.all(); saveRun();
    Game.checkEnd();
  },
  pickWish(l){ // the wish TRANSFORMS your current letter - it changes the LETTER, never the KIND.
    if(S && S.guide && S.guide.wishOnly && l!==S.guide.wishOnly){
      /* this refused in silence, so a beginner tapping a dimmed tile got no reaction and
         could not tell a locked choice from a dead button */
      try{
        const want=S.guide.wishOnly;
        [...$("wish-grid").children].forEach(t=>{
          const L=t.textContent.toLowerCase();
          if(L===l){ t.classList.remove("deny"); void t.offsetWidth; t.classList.add("deny");
                     setTimeout(()=>t.classList.remove("deny"),380); }
          if(L===want){ t.classList.remove("want"); void t.offsetWidth; t.classList.add("want");
                        setTimeout(()=>t.classList.remove("want"),700); }
        });
        Snd.reject(); buzz(20);
      }catch(e){}
      return;
    }
    // AND THE HOLD IS RELEASED THE MOMENT IT IS TAKEN. closeWish() refuses while wishOnly is
    // set - that is what seals the card - but pickWish calls closeWish itself, so leaving the
    // flag up meant taking the right letter left the card stuck open over the board.
    if(S && S.guide) S.guide.wishOnly=null;
    // Players wishing while holding a golden tile were getting a plain one back - a
    // downgrade sold as a gift. Gold stays gold, restless stays restless; a pet's
    // blessing on your hand survives the wish that reshapes it.
    if(!(P.pow.wild>0)) { Game.closeWish(); return; }
    P.pow.wild--; save();
    S._wishedHand=true;                   // the letter in hand is a wish's doing - see drop()
    Game.tallyEv("wish");
    const kind = S.cur ? S.cur.kind : "normal";
    S.cur={letter:l, kind};
    // 🌈 BORN AGAIN GOLDEN - what the phoenix grants comes back rainbow. It outranks even
    // a golden hand: the rainbow is the bigger promise, and only friends ever deal it.
    if(Game.hasPassive("rainbowWish")) S.cur.kind="rainbow";
    Game.closeWish(); UI.wishPill(); UI.piece(); UI.hints(); UI.ghost(S.hoverCol);
    UI.stardrift(); // starlight drifts down as the wish arrives
    Snd.tone(1046,{dur:.16,type:"sine",gain:.07,verb:true}); Snd.tone(1568,{dur:.22,type:"sine",gain:.05,when:.1,verb:true});
    if(kind==="gold") Snd.gold();
    buzz([15,30]);
    // the gold branch used to add "and still golden" - the same promise the tip made, now
    // repeated on every wish a player spends while holding a gold tile. Keeping a golden
    // letter golden is the behaviour, not an achievement to announce.
    /* NO SENTENCE HERE. You just chose this letter from a picker and it is now in your hand,
       in your hand's own tile, at the size of a tile. Being told "S is yours" is the game
       reading its own UI aloud. The sound and the star-drift already fired above. */
    FT.signal("wishPicked", l);
    S.lastAction=Date.now();
  },

  /* the WHO'S-THAT reveal: silhouette to center stage, a held breath, then the face -
     and straight into the meet ritual, same round. closeMeet auto-equips and re-runs
     checkEnd, so a level won by the naming word still wins right after the welcome. */
  async reveal(g){
    S.lastAction=Date.now();
    const nm=$("namer"); if(nm){ nm.style.transition="opacity .3s"; nm.style.opacity="0"; setTimeout(()=>nm.remove(),350); }
    /* THE WOOD HOLDS STILL WHILE A NAME IS SPOKEN. The silhouette is a shape - a black
       cut-out you are being asked to recognise - and a shape can only be read against
       something plain. Branches leaning in at the top corners land exactly where it
       stands, so the one moment in the game that depends on a clean read had the busiest
       background in it. Everything growing at the edges steps back for the reveal, and
       comes back the moment the ritual is over. */
    boardEl.classList.add("naming");
    const big=document.createElement("div"); big.className="whosthat";
    // the player JUST spelled the name - repeating it here made the reveal answer its
    // own question ("who answers to BAT? …the BAT"). The question builds the hush;
    // the name lands exactly once, at the face, where it reads as an introduction.
    big.innerHTML='<div class="wt-e sil">'+(UI.artTag(g.w,"wtimg")||g.e)+'</div><div class="wt-q">the name is spoken… <b>something stirs</b></div>';
    boardEl.appendChild(big);
    Snd.tone(392,{dur:.5,type:"sine",gain:.06,verb:true}); Snd.tone(523,{dur:.55,type:"sine",gain:.05,when:.4,verb:true});
    buzz([15,25]);
    await wait(1400);                                    // the whole wood holds its breath
    big.querySelector(".wt-e").classList.remove("sil");
    const bon=S._revealBonus||0; S._revealBonus=0;
    // the caption CROSSFADES. Swapping innerHTML outright made the words snap to the new
    // line while the creature was still fading out of shadow - two different clocks in one
    // moment, which is most of why the beat read as unfinished.
    const q=big.querySelector(".wt-q");
    q.classList.add("swap");
    await wait(200);
    q.innerHTML="the <b>"+g.w.toUpperCase()+"</b> heard its true name!"
      +(bon?'<br><span class="wt-b">+'+bon+' ✨ the wood is grateful</span>':"");
    q.classList.remove("swap");
    // the prompt is a SIBLING of the caption. As a block inside a white-space:nowrap pill it
    // stretched the pill into a shape it was never styled for.
    /* this asked for a tap and the meet card immediately asks for another, so meeting a
       friend was silhouette, portrait, "tap to continue", then a second tap banner. The meet
       card carries the name, the power, the sign and the count; this is its animation. */
    // the name is spoken: the ceremony releases and the board wakes back into the night
    if(!S.tutorWord && boardEl.classList.contains("ceremony")){
      boardEl.classList.remove("ceremony");
      boardEl.classList.add("flash"); setTimeout(()=>boardEl.classList.remove("flash"),400);
      Snd.mode="normal";   // the heartbeat lets go
    }
    Snd.discover(); UI.confetti(); buzz([30,50,30,50,90]);
    await wait(1600);   // long enough to see it wake, short enough not to become a gate
    big.classList.add("fade");
    await wait(350); big.remove();
    boardEl.classList.remove("naming");   // the wood breathes out and the edges grow back
    // the ritual - through the SAME door showPendingMeet uses: _meetWord must be set,
    // or closeMeet never marks the meeting and the pending sweep runs the whole
    // ceremony a second time (caught live by the user).
    UI._meetWord=g.w; S.busy=true;
    UI.discover(g);
  },
});
