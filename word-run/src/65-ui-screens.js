/* @module  ui  -  every screen, card and animation */
const UI = {
  scene(id){
    document.querySelectorAll(".scene").forEach(s=>s.classList.remove("active"));
    $(id).classList.add("active");
    const mp=$("menu-panel"); if(mp){ mp.classList.remove("on"); $("menu-scrim").classList.remove("on"); }
    if(id==="scene-game") fitBoard();
  },
  home(){
    Ads.giftRefresh(); // the wood's daily chest shows itself only when it can open
    // the cover takes on the region you're walking - now by hanging its actual painting
    const hb=biomeOf(P.level), sh=$("scene-home");
    for(let i=0;i<BIOME_NAMES.length;i++) sh.classList.remove("hb"+i);
    if(hb) sh.classList.add("hb"+hb);
    /* THE DOOR READS THE SAME TWO VARIABLES THE BOARD DOES. --bgart and --deep are declared
       on #app.bgart.bioN, so the country has to be named on #app for the home screen to
       inherit them. applyBiome() does this on level start - but on a COLD BOOT nothing has
       started a level yet, so the door opened with no painting at all until you had played
       one round. Only the two class lines are copied here, deliberately: applyBiome also
       rebuilds board scenery and the hush, which the door has no business touching. */
    const app=$("app");
    app.className = app.className.replace(/\bbio\d+\b/g,"").trim();
    app.classList.add("bio"+hb);
    app.classList.toggle("bgart", BG_ART.has(hb));
    alderTone();   // cold boot reaches the door before any level - his bar needs a tone too
    $("play-lvl").textContent = P.level<=PROLOGUE_END ? "P"+P.level : "LV "+(P.level-PROLOGUE_END);
    const ring=Math.floor((P.level-1)/RING_LEN)+1;
    { const ch=chapterOf(P.level);
          // a place name alone told you nothing about being partway through a story
          $("home-place").innerHTML =
            '<span class="ch-pre">'+ch.pre+'</span>'
          + '<span class="ch-name">'+ch.name+'</span>'
          + '<span class="ch-line">'+ch.line+'</span>'
            ; }   // no page count: the play button already carries the level, right above this
    // the ladder from the Book, on the door - the reason to come back, before you press play
    { const hp=$("home-prog");
      if(hp){
        const found=Object.keys(P.grove).length;
        const mile=UI.GROVE_MILES.find(mi=>found<mi.n);
        hp.innerHTML = !P.tut ? ""
        // ONE line, not three. The count and the next milestone were two separate
        // sentences with a bar wedged between them, in a strip that also has to carry a
        // chapter heading - seven rows of text stacked into the bottom eighth of the door.
          : '<span class="hp-line"><b>'+found+'</b> of '+GROVE.length+' names'
            + (mile ? ' \u00b7 '+(mile.n-found)+' to '+mile.i : ' \u00b7 all home')
            + '</span>'
        ;   // no bar: the line above it already says the number, and a bar that repeats a
      } }
    $("hm-streak").textContent=P.streak||0;
    $("menu-grove-n").textContent=Object.keys(P.grove).length+" / "+GROVE.length;
    // (the quest row is refreshed by menuToggle each open - one writer, no drift)
    const n=Object.keys(P.grove).length;
    $("grove-badge").textContent=n;
    $("grove-badge").style.display = n ? "flex" : "none"; // a zero badge is noise, and at 10px "0" reads as "8"
  },
  /* 🌱 the breath setting - how long a made word waits before it clears (1-5s).
     One tap cycles; the value rides P and persists. Replaces tap-to-hurry. */
  breathCycle(){ Snd.init();
    const secs = Math.round((P.breathMs||2000)/1000);
    P.breathMs = (secs>=5 ? 1 : secs+1)*1000; save();
    UI.breathLabel();
  },
  breathLabel(){
    const el=$("menu-breath-state");
    if(el) el.textContent = Math.round((P.breathMs||2000)/1000)+"s · a word waits this long";
  },
  menuToggle(open){ Snd.init();
    const on = open===undefined ? !$("menu-panel").classList.contains("on") : open;
    $("menu-panel").classList.toggle("on", on);
    // restart and "leave to the wood" only mean anything with a round on the table
    $("menu-panel").classList.toggle("ingame", !!(S && !S.over && $("scene-game").classList.contains("active")));
    $("menu-scrim").classList.toggle("on", on);
    if(on){ $("hm-streak").textContent=P.streak||0;
      UI.breathLabel();
      const q=dailyQuest();
      // the quest is a promise of a reward - show the goal, the progress, and the prize,
      // not a bare grey whisper that reads like placeholder text
      const rw = q.reward==="wild" ? "🌟 a wish" : "🌰 an acorn";
      $("hm-quest").innerHTML = P.questDone
        ? '<span>'+q.emoji+' <b>quest done ✓</b></span><em>'+rw+' earned</em>'
        : '<span>'+q.emoji+' today: <b>'+q.text+'</b></span><em>'+Math.min(P.questProgress||0,q.target)+'/'+q.target+' done · earns '+rw+'</em>';
      $("menu-grove-n").textContent=Object.keys(P.grove).length+" / "+GROVE.length; }
  },
  hud(){
    const an=$("amber-n"); if(an) an.textContent=P.amber||0;
    // THE PROLOGUE IS NOT LEVEL ONE. levelLabel() has said so on the level card and the
    // play button for a while; this chip was still printing the raw number, so the
    // tutorial read LV 1 and the first round played unaided read LV 6.
    { const pro = S.level<=PROLOGUE_END;
      const pre = $("lv-pre"); if(pre) pre.textContent = pro ? "prologue" : "level";
      $("h-level").textContent = pro ? S.level : (S.level-PROLOGUE_END); }
    const m=$("movesbig");
    m.textContent=S.movesLeft;
    const mp=$("movespill"); if(mp) mp.classList.toggle("low", S.movesLeft<=3 && !S.won);
    UI.goalStrip();
    /* goalTick covers the obstacle asks, but a MEETING round has no goals to tick - its
       progress lives in S.sigs, which nothing else notifies. Calling from here catches
       every state change; goalTell itself is a string build and a compare, and returns
       immediately unless the words actually changed. */
    try{ Game.goalTell(); }catch(e){}
    /* keep the face right while he is SILENT too - _show only runs when a line appears,
       so without this the bar wore the previous round's sign until he next spoke.
       A pet borrowing the bar (cur.who) keeps its own portrait. */
    try{ const af=$("alder") && $("alder").querySelector(".aface");
      if(af && !(Alder.cur && Alder.cur.who)) af.innerHTML=Alder.roundFace();
    }catch(e){}
    const goalMode=S.goal && S.goal.t!=="hush";
    const pct=goalMode ? Math.min(100,100*S.goal.have/Math.max(1,S.goal.need))
                       : Math.min(100, 100*S.levelScore/S.target);
    const mist=document.getElementById("hushmist"); // every word thins the hush - visibly
    if(mist) mist.style.opacity=Math.max(0, 1-(pct/100)*1.25);
  },
  goalStrip(){ // every ask of the round, one segment each - built to hold SEVERAL
    const gs=$("gs-goals"); if(!gs || !S) return;
    const segs=[];
    // ONE BUILDER for every ask. A long ratio steps its own type down rather than growing
    // wide enough to shove the moves onto a second line - 625/625 at full size is wider
    // than the centre of the strip has to give.
    // A BAR THAT FILLS, with its icon at the left and its count at the right - the shape
    // the layout asks for, and a ratio reads faster as a length than as two numbers.
    // THE TEXT IS DRAWN TWICE: once dark for the bare track, once cream clipped to exactly
    // the filled width. That way neither copy is ever caught on the wrong ground as the
    // bar sweeps past it, and no single colour has to survive both.
    // WHAT IT PRINTS, NOT WHAT IT COUNTS. A big word in a small round could read 95/15,
    // which looks like a bug rather than a triumph. The score still accumulates in full
    // underneath - stars and rewards read the real number - the bar just never claims
    // more than the round asked for.
    const seg=(met, have, need, icon, name)=>{
      const pct=Math.max(0, Math.min(1, have/Math.max(1,need)));
      const shown=Math.min(have, need);
      /* NO BAR. The ask reads as its own number now, in the moves' exact type, so the
         shell carries three numerals of equal voice instead of two numerals and a
         gauge. pct is still computed - metdone still marks a met ask - but the length
         is no longer drawn. */
      /* ICON + COUNT, NOT A WORD (the borrow from Royal Match / Toon Blast / Homescapes).
         A word label costs ~40px per ask and three of them cannot share this cell at any
         readable size - the labels, not the numerals, were what overflowed. A glyph costs
         the width of the numeral it sits above, so three asks fit. */
      /* THE ROYAL MATCH SHAPE. The ask is the ICON, at full size, and the count is a
         small plate hung off its corner - not a numeral wearing the glyph as a hat.
         The plate carries what is LEFT rather than have/need: a collection ask is
         answered by "how many more", and one short number keeps the plate small
         enough to hang off the glyph instead of displacing it. When the ask is met
         the plate becomes a tick, so a finished ask reads without being counted.
         The word is gone from the screen, so it has to survive in the label - a glyph
         alone tells a screen reader nothing. */
      const left=Math.max(0, need-shown);
      return '<div class="gseg'+(met?" metdone":"")+'" data-pct="'+pct.toFixed(3)+'"'
        +' role="img" aria-label="'+(met ? (name||"ask")+" complete"
              : left+' more '+(name||"")+' needed, '+shown+' of '+need)+'">'
        +'<span class="gs-ico" aria-hidden="true">'+icon+'</span>'
        +'<b class="gs-num" aria-hidden="true">'+(met ? "✓" : left)+'</b>'
        +'</div>';
    };
    /* THE SCORE IS A LENGTH, NOT A COUNT. A collection ask answers "how many more" and
       reads as a glyph plus a small number; the score answers "how far along", and a
       ratio like 39/295 is a sum you have to do. The bar shows it without arithmetic.
       Its count is drawn TWICE - dark for the bare track, cream clipped to exactly the
       filled width - so neither copy is ever caught on the wrong ground as the fill
       sweeps past it, and no single colour has to survive both. */
    const bar=(met, have, need, label)=>{
      label=label||"score";
      const pct=Math.max(0, Math.min(1, have/Math.max(1,need)));
      /* this clamped to the target so a big word could not read "95/15". Played, it reads as
         the opposite bug: 57 against a target of 50 shows 50, and a player who just scored
         watches the number refuse to move. The BAR still clamps; the numeral is the score. */
      const shown=have;
      /* THE COUNT SITS ABOVE THE TRACK, NOT INSIDE IT. Printing it inside meant the
         track had to be tall enough to hold type, and the two copies (dark, then cream
         clipped to the fill) existed only because the fill kept sliding under the text.
         Above the bar, one copy in the pane's measured ink is enough, and the track is
         free to become the thin rule it should always have been. */
      return '<div class="gseg barseg'+(met?" metdone":"")+'"'
        +' role="img" aria-label="'+label+' '+shown+' of '+need+'">'
        /* both figures, because the track is 7px and can carry no type of its own -
           the bar shows the shape of the progress, the line states its terms */
        +'<span class="gs-cap" aria-hidden="true">'+label
        +'<span class="gs-pair"><b>'+shown+'</b><i>/'+need+'</i></span></span>'
        +'<div class="gs-track"><i style="transform:scaleX('+pct+')"></i></div>'
        +'</div>';
    };
    /* on a naming round S.goal is null, so the strip fell through to the score bar and
       tracked a number that could not win the round - checkEnd ends these the moment the
       friend is courted, whatever the score says. */
    const meetW = S.tutorWord && !S.guestNamed ? S.tutorWord : null;
    const meetC = meetW && GROVE_BY_WORD[meetW] ? Game.courtship(GROVE_BY_WORD[meetW]) : null;
    const goalMode=S.goal && S.goal.t!=="hush";
    if(meetC){
      const have=Math.min((S.sigs&&S.sigs[meetC.sign])||0, meetC.n);
      const noun=(SIGNS[meetC.sign] && SIGNS[meetC.sign].noun) || "to meet";
      segs.push(bar(have>=meetC.n, have, meetC.n, noun));
    } else if(goalMode){
      /* ══ ONE BAR, WHATEVER THE ROUND ASKS ══ a special round used to swap the bar out
         for icon pods, so the top of the screen changed shape the moment you crossed
         into a goal level. The bar stays; it just counts a different thing. Every ask
         in the round is summed - three ice and two stones is five pieces - and the bar
         reads "cleared 1/5". What the five ARE is Alder's job (Game.goalTell), because
         a 7px track can hold a proportion but never a list. */
      const gs2=[S.goal, S.goal2].filter(Boolean);
      const have=gs2.reduce((a,g)=>a+Math.min(g.have,g.need),0);
      const need=gs2.reduce((a,g)=>a+g.need,0);
      segs.push(bar(have>=need, have, need, "cleared"));
    } else {
      const done=S.levelScore>=S.target;
      segs.push(bar(done, S.levelScore, S.target));
    }
    /* goal2 gets NO pod of its own any more - it is already inside the bar's total, and
       leaving this in printed the second ask twice: once as part of "cleared 1/5" and
       again as a stray 🪨2 floating beside it. */
    /* The meeting ask gets no pod either, for the same reason as goal2: Alder now speaks
       every ask in the round, so a 🎭 floating beside the bar was the detail printed
       twice. seg() is kept - nothing calls it today, but it is the only pod builder and
       deleting it would take the icon+plate shape with it. */
    gs.innerHTML=segs.join("");
    /* A pod is now the width of its GLYPH, not of its digits, so every reachable round
       fits at full size and this loop should never step. It stays as the backstop for
       an ask count this build does not foresee - the glyph gives way, the plate does
       not, because the plate is what you read. */
    const st=$("goalstrip");
    if(st && st.clientWidth>10){
      for(const px of [26,22,19,16]){
        gs.style.setProperty("--gs-ico-size", px+"px");
        if(gs.scrollWidth <= st.clientWidth) break;
      }
    }
    // a crown trial asks two things at once, so the centre carries three pods

    const gn=$("gs-name");
    if(gn){ gn.innerHTML=""; gn.classList.remove("on"); }   // the footnote row is retired
    /* THE BOARD RE-FITS WHEN THE STRIP CHANGES SHAPE. A meeting adds a second track and
       the column below shifts - fitBoard() had already run against the old height, so
       the scaled board overflowed its wrap upward and the friends' pips sat ON the
       board's top edge (measured: -1px). One deferred refit closes the loop. */
    requestAnimationFrame(()=>{ try{ fitBoard(); }catch(e){} });
  },
  miniTile(t, size, font){
    const el=document.createElement("div");
    el.className="tile "+(t.kind!=="normal"?t.kind:"");
    el.style.position="relative"; el.style.width=size+"px"; el.style.height=(size+2)+"px"; el.style.fontSize=font+"px";
    el.textContent=(t.kind==="bomb"?"💣":t.kind==="wild"?"★":t.letter.toUpperCase());
    return el;
  },
  piece(){
    // the replacement is on screen, so the slot is no longer empty - and if any carried tile
    // somehow outlived its gesture, this is the moment it is provably stale
    document.body.classList.remove("handout");
    { const stray=$("carry"); if(stray) stray.remove(); }
    const w=$("currentwrap"); w.innerHTML="";
    const t = S.cur;
    const el=UI.miniTile(t,62,29);
    if(t.kind!=="bomb"&&t.kind!=="wild") el.innerHTML += "<small>"+VAL[t.letter]+"</small>";
    w.appendChild(el);
    const n=$("nextslot"); n.innerHTML="";
    n.appendChild(UI.miniTile(S.next,44,19));
    // 👁 FAR SIGHT gets its own labelled slot rather than a second tile squeezed under the
    // first one. The queue reads left to right and shrinks as it goes: 62, 44, 36.
    const n2w=$("next2wrap"), n2=$("next2slot");
    const deep = !!(S.next2 && Game.hasPassive("next2"));
    // the slot never leaves. Without Far Sight it holds a question mark - a standing hint
    // that something can see further than you can, and no shuffling of the row on the day
    // the owl finally does.
    if(n2w){ n2w.classList.toggle("locked", !deep);
      n2w.title = deep ? "the owl reads one further ahead"
                       : "something out there reads further ahead than you do…"; }
    // the same size as NEXT: both are simply "coming", and the only rank that means
    // anything here is the one between the tile you can drop and the ones you cannot.
    if(n2){ n2.innerHTML="";
      n2.appendChild(UI.miniTile(deep ? S.next2 : {letter:"?",kind:"normal"}, 44, 19)); }
  },
  /* ══ THIS USED TO RETURN BEFORE IT DID ANYTHING ══
     The daily-quest chip was removed and the goal strip took over its job, but the guard that
     had protected the chip stayed: `const qe=$("quest"); if(!qe){ UI.goalStrip(); return; }`.
     #quest no longer exists, so that condition was true every single time, and the three
     lines below it - the paw meter and both tool counts - were never reached from UI.all()
     again. Nothing errors when an element is missing, which is why it sat there.

     What a player saw: the pills are drawn by their earn and spend handlers, so during a
     session they look right. On a fresh boot, or when a backgrounded tab is evicted and the
     round is restored from the save, nothing draws them at all and they keep the value that
     is hard-coded in the markup - which is 0. The tools still worked, because the click reads
     P.pow and not the label. The paw pips under each friend were wrong in the same way and
     for the same reason.

     Same shape of fault as the two dead menu items and the "Your journey" button before it:
     an element gets deleted, its guard is left behind, and the guard quietly switches off
     everything after it. */
  cozy(){
    UI.goalStrip();
    UI.petMeter(); UI.breezePill(); UI.wishPill();
  },
  equipped(){ // the party on duty: chosen in the grove, else your most recent friends
    const max=slotsFor(P.level);
    const met = GROVE.filter(g=>P.metGrove[g.w]);
    const chosen = (P.equip||[]).map(w=>GROVE_BY_WORD[w]).filter(g=>g && P.metGrove[g.w]);
    if(chosen.length) return chosen.slice(0,max);
    return met.sort((a,b)=>(P.metGrove[a.w]||0)-(P.metGrove[b.w]||0)).slice(0,max);
  },
  breezePill(){ // the wind in your pocket: 3-letter words refill it (up to 3)
    const el=$("breezepill"); if(!el) return;
    const bn=P.pow.swap||0;
    $("breeze-cnt").textContent = bn>0 ? bn : "20🟠";
    $("breeze-cnt").classList.toggle("price", bn<=0);
    el.classList.toggle("empty", bn<=0);
    el.title="every 3-letter word earns a breeze · tap, then tap two tiles to swap them";
  },
  wishPill(){ // the star in your pocket: 4-letter words refill it (up to 3)
    const el=$("wishbtn"); if(!el) return;
    const wn=P.pow.wild||0;
    $("wish-cnt").textContent = wn>0 ? wn : "25🟠";
    $("wish-cnt").classList.toggle("price", wn<=0);
    el.classList.toggle("empty", wn<=0);
    el.title="every 4-letter word earns a wish · tap to choose any letter for your next tile";
  },
  /* what a sign is CALLED, in the wood's own voice, now lives beside the sign itself in
     SIGNS - use signTitle(s) for a Book heading and signNoun(s) for the word on a card. */
  petMeter(){
    // EVERY FRIEND CARRIES ITS OWN COUNT. There is no shared meter to read any more -
    // one friend may be two consonants from stirring while another waits on a word you
    // have not spelled yet, and both have to be legible at a glance.
    if(UI.equipped().length && S){
      const eq=UI.equipped();
      // the shelf glows for whoever is closest to waking
      let closest=0;
      for(const g of Game.petActives()){
        const w=Game.wakeAt(g); if(!w) continue;
        closest=Math.max(closest, w.have/w.need);
      }
      /* THREE PROPERTIES WRITTEN EVERY REPAINT AND READ BY NOTHING. --pawglow/--pawalpha/
         --pawring drove a warm glow on the shelf's border; the shelf was removed when the
         friends started standing free, and the CSS that consumed them went with it. The
         tooltip outlived them too, and promised a warming that could no longer happen.
         What actually tells you a friend is close is its pips filling - so that is what
         it says. The "closest" figure above is still worth computing: it is what decides
         the "excited" class on a friend one sign from waking. */
      const bar=$("petbar");
      bar.title="each friend stirs to its own sign - its pips fill as it gets close";
      for(let s=0;s<4;s++){ const el=$("pet-"+s); if(!el) continue;
        const g=eq[s];
        let b=el.querySelector(".pips");
        // A BARRED FRIEND HAS NOTHING TO COUNT - same as an empty seat, for the same reason:
        // there is no progress to show, and four frozen sockets read as a broken meter.
        const gate=gateAt(S.level);
        if(!g || (gate && gate.bars===g.w)){ if(b) b.remove(); el.classList.remove("excited"); continue; }
        if(!b){ b=document.createElement("span"); b.className="pips"; el.appendChild(b); }
        // PIPS: one dot per sign this friend still needs, under the badge and never on it.
        // The roster is tuned so nobody asks for more than four - if a future friend ever
        // exceeds it the dots cap rather than overflow the seat.
        const PIPMAX=4;
        if(g.ps){ b.className="pips always"; b.innerHTML="<i></i><i></i><i></i><i></i>";
                  el.classList.remove("excited"); continue; }
        const w=Game.wakeAt(g);
        const need=Math.min(PIPMAX, w ? w.need : 1);
        const have=Math.min(need, w ? w.have : 0);
        const togo = w ? Math.max(0, w.need-w.have) : 0;
        let dots=""; for(let i=0;i<need;i++) dots+='<i class="'+(i<have?"on":"")+'"></i>';
        b.className="pips"+(togo<=0?" ready":"");
        b.innerHTML=dots;
        el.classList.toggle("excited", togo<=1);     // one sign away and it can hardly wait
      }
    }
  },
  /* ══ WHAT WAKES THIS FRIEND, IN ONE PLACE ══ three surfaces answered this question and
     they did not agree: the pet sheet read it off the roster correctly, the naming card said
     "every few words" for all fifty, and the tutorial told a beginner the cat watches drops
     (it watches three-letter words - only the snail watches drops). A friend's sign is data;
     every surface reads it from here now, so none of them can drift from the roster again. */
  signPhrase(g){
    if(!g) return "";
    if(g.ps) return "always awake";
    const sign = signNoun(g.wake && g.wake.on, "words");
    return (g.wake && g.wake.n > 1) ? g.wake.n + " " + sign : sign;
  },
  petInfo(slot){ // tap a pet: what it does, and exactly when it acts - no mystery
    const eq=UI.equipped(), g=eq[slot];
    if(!g){ // an empty or locked seat still answers when tapped
      if(!S) return;
      // A LOCKED SEAT ANSWERS BY TURNING OVER. The level it opens at is on its back, so the
      // tile shows it when asked instead of wearing a label forever.
      const el=$("pet-"+slot);
      if(el && el.querySelector(".ptback")){
        el.classList.remove("flipping"); void el.offsetWidth; el.classList.add("flipping");
        setTimeout(()=>el.classList.remove("flipping"), 2600);
        Snd.tone(660,{dur:.09,type:"triangle",gain:.05}); buzz(8);
        return;
      }
      const slots=slotsFor(P.level);
      /* "wake more friends" names no action. Meeting creatures is how seats fill, and the
         Book is where you see who is close - so point at both. */
      if(slot<slots) UI.say("seat-open", "🐾 <b>meet a creature</b> to fill this seat", 3);
      else if(slot < seatsByLevel(P.level))
        UI.say("seat-ready", "🐾 <b>meet another creature</b> - it can sit here", 3);
      else UI.chip("🔒 this seat unlocks at <b>level "+UI.SLOT_LV[slot]+"</b>");
      Snd.tone(520,{dur:.08,type:"triangle",gain:.05});
      return;
    }
    if(!S) return;
    Snd.tone(880,{dur:.09,type:"triangle",gain:.06,verb:true}); buzz(8);
    let turn;
    const gate=gateAt(S.level);
    if(gate && gate.bars===g.w) turn="<b>staying home</b> this round - the way in is barred to them";
    else if(g.ps) turn="<b>always on</b> while on duty";
    else {
      // THE TRIGGER IS STATED, THE STRATEGY IS NOT. A player choosing a party has to know
      // what wakes a friend; nothing anywhere tells them which round wants which friend.
      const w=Game.wakeAt(g);
      const togo=w ? Math.max(0, w.need-w.have) : 0;
      turn = "wakes on <b>"+UI.signPhrase(g)+"</b>"
           + (togo<=0 ? " - <b>stirring now!</b>" : "<br><small>"+togo+" to go</small>");
    }
    /* the pill clipped this - a power description is three lines of reading, not one.
       A tapped friend opens the Field Guide: room to read, closes on your own tap. */
    Info.show({ b:(UI.artTag(g.w)||g.e), t:g.w.toUpperCase()+" · "+g.pn+" "+g.pi,
      body:'<div class="i-game">'+g.pd+'</div><div class="i-note">'+turn+'</div>' });
  },
  /* ONE TAP tells you what a tile's friend does; TWO taps opens the Book to change that
     tile. No swap buttons anywhere - the tile IS the control. */
  petTap(slot){
    if(UI._ptSlot!==slot){ UI._ptCount=0; UI._ptSlot=slot; }
    UI._ptCount=(UI._ptCount||0)+1;
    clearTimeout(UI._ptTimer);
    UI._ptTimer=setTimeout(()=>{ const c=UI._ptCount; UI._ptCount=0;
      if(c>=2) UI.petSwapPick(slot); else UI.petInfo(slot); }, 230);
  },
  petSwapPick(slot){ // double-tapped a tile - choose a friend for exactly THIS seat, in the Book
    const eq=UI.equipped();
    UI._swapSlot=slot; UI._swapOut=eq[slot]?eq[slot].w:null;
    Snd.tone(760,{dur:.1,type:"sine",gain:.06,verb:true}); buzz(10);
    UI.groveShow();
    UI.say("swap-pick","📖 <b>pick a friend</b> to sit in this seat", 4);
  },
  pillPop(id){
    const el=$(id); if(!el) return;      // some pills have retired from the stage
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    setTimeout(()=>el.classList.remove("pop"),500);
  },
  endCard(won){
    UI.toastClear();   // the card gets a clean stage - no leftovers drifting across it
    // stars sit on their own line - inline they forced "Level 1 / clear!" to wrap mid-phrase
    $("ev-title").innerHTML = won && S.bearCarried
      ? '<span class="evstars">⭐</span>Not your fault. '
        +'The bear carried this one.<br><small>'+(UI.artTag("bear","toastimg")||"🐻")
        +' gone to sleep under the big tree, proud of you - your words will wake it</small>'
      : won
      ? '<span class="evstars">'+"⭐".repeat(S.stars||1)+'</span>'+levelLabel(S.level)+' clear!'
      /* a meeting loss used to say "It watched, and waited…", which is a mood where the
         player needs the reason. They ran out of moves before finishing the ask. */
      : (S.tutorWord ? "Out of moves - it is still waiting"
         : (S.goal&&S.goal.t!=="hush") ? ((S.goal.have<S.goal.need
             ? GOALS[S.goal.t].i+" "+(S.goal.need-S.goal.have)
             : GOALS[S.goal2.t].i+" "+(S.goal2.need-S.goal2.have))+" remained…")
         : S.levelScore>=S.target*0.85 ? "So close…" : "Out of moves");
    /* a won card says just the score - "76 / 15" read like a broken fraction, and the
       title already says the target fell. A loss keeps the gap visible: "58 / 75".
       BUT NOT ON A GOAL ROUND. There the score decides nothing, so printing "210 / 295"
       tells the player they were 85 points short of a number that could not have saved
       them - the same lie the gap line below was already fixed for. */
    { const goalRound = !!(S.goal && S.goal.t && S.goal.t!=="hush");
      $("ev-score").textContent = (won || goalRound || S.tutorWord)
        ? S.levelScore : S.levelScore + " / " + S.target; }
    $("ev-word").textContent = S.bestWord||"-";
    // silent early discoveries stay silent here too - their reveal is the post-round-5
    // ritual, not a stray emoji on a win card the player can't ask questions of
    const found = S.newGrove.filter(w=>w==="cat"||S.level>=5).map(w=>UI.artTag(w,"evimg")||GROVE_BY_WORD[w].e);
    if(won){
      $("ev-grove").innerHTML = found.map(e=>"<span>"+e+"</span>").join(" ");
    } else { // a loss should feel like your friends rooting for you, not a cold verdict
      const eq=UI.equipped(), gap=S.target-S.levelScore;
      if(S.tutorWord){
        $("ev-grove").innerHTML = '<span class="sil" style="font-size:34px">'+UI.silTag(S.tutorWord)+'</span><br>'
          /* "its name is still hiding here" describes a mechanic the game no longer has -
             the ask is to SPEAK a kind of word, and the name arrives as the reward. Say
             the ask, and say that a retry keeps whatever they already did. */
          + '<span style="font-size:12px;color:var(--dim);letter-spacing:normal">'
          + (()=>{ try{ const cg=Game.courtship(GROVE_BY_WORD[S.tutorWord]);
                 return cg ? 'it is listening for <b>'+cg.n+' '+signNounN(cg.sign,cg.n)+'</b> - try again'
                           : 'try again';
               }catch(e){ return 'try again'; } })()
          + '</span>';
      } else {
      // the gap line must speak the round's OWN win condition: on a goal round
      // ("harvest the gold", "clear the brambles") points cannot win, so telling the
      // player how many points they were short is a lie wearing encouragement's clothes
      const gl=S.goal, isGoal = !!(gl && gl.t && gl.t!=="hush");
      const left = isGoal ? Math.max(1,(gl.need||0)-(gl.have||0)) : gap;
      const gapLine = isGoal
        ? (left<=2 ? "only <b>"+left+"</b> more to clear - you nearly had it!"
                   : (eq.length? "your friends believe in you - " : "")+"<b>"+left+"</b> still to clear")
        : (gap<=10 ? "only <b>"+gap+"</b> points to go - you nearly had it!"
                   : (eq.length? "your friends believe in you - " : "")+"<b>"+gap+"</b> points to go");
      $("ev-grove").innerHTML = (eq.length?eq.map(g=>"<span>"+(UI.artTag(g.w,"evimg")||g.e)+"</span>").join(" ")+"<br>":"")
        + '<span style="font-size:12px;color:var(--dim);letter-spacing:normal">'
        + gapLine
        + '</span>';
      }
    }
    // WHAT WAITS NEXT - the reason to tap "next level" instead of putting it down
    { const pull=$("ev-pull");
      if(!won){ pull.innerHTML=""; }
      else {
        const found=Object.keys(P.grove).length;
        const stirring = (P.summon && !P.grove[P.summon]) ? P.summon
          : (P.summonQ||[]).find(w=>!P.grove[w]);
        const mile=UI.GROVE_MILES.find(mi=>found<mi.n);
        pull.innerHTML = stirring
          ? '🌙 <b>a friend is coming</b><br><small>next round it hides on the board - show it the thing it loves</small>'
          : found
            ? '🐾 <b>'+found+'</b> of '+GROVE.length+' names remembered'
              + (mile ? '<small>'+(mile.n-found)+' more until '+mile.i+' '+mile.t.toLowerCase()+'</small>'
                      : '<small>🌈 the wood is awake</small>')
            : '🐾 <b>50</b> names sleep in this wood<br><small>the first is already close</small>';
      } }
    $("btn-next").style.display = won ? "flex":"none";
    $("btn-retry").style.display = won ? "none":"flex";
    // ══ THE GRACES. Each says its own price, and shows only when it can actually be
    // taken - a button you cannot afford is worse than no button at all.
    { const mFree=Game.freeLeft("moves"), mCost=Game.graceCost("moves");
      const canMoves = mFree || (P.amber||0)>=mCost;
      $("btn-moves").style.display = (!won && S.levelScore>0 && !boardFull() && canMoves) ? "flex":"none";
      $("btn-moves").innerHTML = mFree
        ? (Ads.ready() && !Shop.blessed() && P.level>=8 ? "🎬 watch · +5 moves" : "🪶 +5 moves · <b>free</b>")
        : "🪶 +5 moves · <b>"+mCost+"</b>🟠";

      const rFree=Game.freeLeft("retry"), rCost=Game.graceCost("retry");
      $("btn-retry").style.display = won ? "none" : ((rFree || (P.amber||0)>=rCost) ? "flex":"none");
      $("btn-retry").innerHTML = rFree ? "↻ Retry" : "↻ Retry · <b>"+rCost+"</b>🟠";

      // the two that only exist while a name is going unspoken
      const guest = !won && S.tutorWord && !P.grove[S.tutorWord];
      const fCost=Game.graceCost("friend");
      const bl=$("btn-letter"), bf=$("btn-friend");
      /* the letter-lending grace sold letters of a name nobody has to spell any more -
         a dead purchase wearing help's clothes. Retired with the spelling test. */
      bl.style.display = "none";
      bf.style.display = (guest && (P.amber||0)>=fCost) ? "flex":"none";
      /* "bring them anyway" leaves a player guessing what they get for 90 amber. Say it:
         the friend joins now, and the round counts as won. */
      bf.innerHTML = (guest?(UI.silTag(S.tutorWord)||GROVE_BY_WORD[S.tutorWord].e):"🐾")
        +" Bring them home now · <b>"+fCost+"</b>🟠"; }
    // 🎬 PLACEMENT 2: the win doubler - appears only after the win is already banked
    const dbl=$("btn-double");
    if(won && Ads.ready() && !Shop.blessed() && P.level>=8 && S._winAmber){
      dbl.style.display="flex"; dbl.disabled=false;
      dbl.innerHTML="🎬 Watch an ad for <b>+"+S._winAmber+"</b>🟠 more";
    } else dbl.style.display="none";
    $("ev-blessed").style.display = (won && Shop.blessed()) ? "block" : "none";
    $("ov-end").classList.add("active");
  },
  /* ══ THE DOOR SLIDES CARRY THE STORY BIBLE ══ the same tale ALDER_PAGES tells - the
     forgetting fell FROM the mountain, you carry the Book - so the first minute and the
     next forty hours are one story. The three story pages are seeded into the Journal at
     graduation, so a player who tapped through can always read it back. */
  TUT:[
    '<div class="big">🏔️</div><p>The forgetting started at the top of the mountain -<br>and it spread. Every creature forgot its name.</p><small>a name unspoken too long fades - and fading travels</small>',
    '<div class="big">🌳</div><p>"I am Alder. I kept this wood, and I kept its Book.<br>The hush is taking my memory too - <b>so the Book is yours now.</b>"</p><small>the old Keeper will walk with you and point the way</small>',
    '<div class="demo"><div class="tile">C</div><div class="tile">A</div><div class="tile">T</div></div><p>You are the <b>Namekeeper</b>.<br>Weave letters into words ✨</p><small>words read left → right across a row, and either way up a column</small>',
    '<div class="tut-goals"><span>🎯<b>'+TARGET(1)+'</b>target</span><span>👣<b>'+MOVES(1)+'</b>moves</span></div><p>Every word thins the hush.<br>Clear it before your moves run out.</p><small>spare moves become bonus ⭐ stars</small>',
    '<div class="big"><img class="petimg tutbig" src="art/pets/fox.png" alt=""><img class="petimg tutbig" src="art/pets/owl.png" alt=""><img class="petimg tutbig" src="art/pets/bee.png" alt=""></div><p>Show a creature <b>the thing it loves</b><br>and it remembers itself - and joins you.</p><small>50 friends to meet · every one has its OWN power</small>',
    '<div class="big">👑</div><p>Fifty names sleep between here and the summit.<br><b>The last one burns.</b> Bring her back, and the wood wakes.</p><small>the walk ends at the Frozen Crown</small>',
  ],
  _tut:0,
  tutShow(i){
    UI._tut=i;
    $("tut-slide").innerHTML=UI.TUT[i];
    $("tut-dots").innerHTML=UI.TUT.map((_,d)=>'<i class="'+(d===i?"on":"")+'"></i>').join("");
    $("tut-next").textContent = i===UI.TUT.length-1 ? (UI._tutReplay ? "Got it ✓" : "Play ▶") : "Next";
    /* THE SKIP, AND WHO IS ALLOWED TO SEE IT. Four of the eight playtesters wiped their
       save, and every one of them was then walked through the same five lessons again -
       drop, breeze, hold, the cat's naming, your first friend. The lessons are good; being
       taught them twice is not. A player who has finished level 5 even once has a mark
       kept OUTSIDE the save file, so it survives a wipe the way their tester name does,
       and from then on the door offers a way past. A first-time player never sees it. */
    const veteran = !UI._tutReplay && UI.tutorialSeen() && P.level<=5;
    $("tut-skip").style.display = veteran ? "block" : "none";
    $("ov-tut").classList.add("active"); Game.shown("tut");
  },
  /* kept in its own key so a wipe cannot take it - you do not un-learn a game */
  tutorialSeen(){ try{ return localStorage.getItem("hushwood_taught")==="1"; }catch(e){ return false; } },
};
