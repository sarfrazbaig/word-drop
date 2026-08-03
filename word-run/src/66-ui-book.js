Object.assign(UI, {
  markTutorialSeen(){ try{ localStorage.setItem("hushwood_taught","1"); }catch(e){} },
  tutSkip(){
    Snd.init(); $("ov-tut").classList.remove("active");
    // straight to the far side of the lessons, with the cat already met - skipping the
    // teaching must never cost you the friend the teaching gives you
    P.tut=true; P.level=Math.max(P.level,6); P.run=null;
    if(!P.grove.cat){ P.grove.cat=Date.now(); P.metGrove.cat=Date.now(); }
    if(!(P.equip||[]).length) P.equip=["cat"];
    /* THE SKIPPER WAS AMBUSHED ANYWAY. tutSkip set the level and the cat and never touched
       P.seenTip, so the breeze card ambushed them at L6 and the wish card at L7 - mid-round,
       unasked, on top of play. Caught in a tester's own session (skip at 4.4s, breeze card
       at 25s, wish card at 155s). My own change made it worse: those cards became three
       tap-through steps each, so a skipper now had six cards to dismiss.
       The button says "I know the wood". Honour that: the two TOOL cards are what the
       lessons taught, so they count as taught. Obstacle cards are NOT marked - spore and
       mire and scree arrive hundreds of levels later and knowing the basics is not knowing
       those, so they still introduce themselves when they first appear. */
    P.seenTip = P.seenTip || {};
    ["breeze","wish"].forEach(k=>{ P.seenTip[k]=true; });
    save();
    Game.track("tutorial_skipped",{ L:P.level });
    UI.say("tut-skipped","🌿 straight on, then - the cat is already with you",3);
    Game.startLevel(P.level);
  },
  wipeAll(){ // every level, every friend, every coin - gone. So: ask twice, plainly.
    const b=$("menu-wipe"), lbl=$("menu-wipe-lbl"), ic=$("menu-wipe-i");
    if(!UI._wipeArmed){
      UI._wipeArmed=true;
      b.classList.add("armed"); ic.textContent="⚠️";
      lbl.textContent="tap again - this cannot be undone";
      Snd.reject();
      clearTimeout(UI._wipeT);
      UI._wipeT=setTimeout(()=>{ UI._wipeArmed=false; b.classList.remove("armed");
        ic.textContent="🍂"; lbl.textContent="wipes everything"; }, 6000);
      return;
    }
    clearTimeout(UI._wipeT); UI._wipeArmed=false;
    try{
      Game.track("wipe_all",{ L:P.level, friends:Object.keys(P.grove||{}).length, run:Tele.run||1 });
      Tele.newRun();          // the next boot is run N+1, and says so
      Tele.flush(true);
    }catch(e){}
    // a playtester keeps their NAME through a restart - a second run is still their run,
    // and the notes should still say who they belong to.
    const keepName=(P&&P.teleName)||"", keepSeen=!!(P&&P.teleSeen);
    try{
      localStorage.removeItem("worddrop_v3");
      localStorage.removeItem("worddrop_v2");
      localStorage.removeItem("worddrop_ev1");
      if(keepName||keepSeen) localStorage.setItem("worddrop_v3", JSON.stringify({teleName:keepName, teleSeen:keepSeen}));
    }catch(e){}
    location.reload();
  },
  tutReplay(){ // re-read the rules any time, without touching your progress
    Snd.init(); UI.menuToggle(false); UI._tutReplay=true; UI.tutShow(0);
  },
  tutNext(){
    if(Game.guard("tut")) return; // one beat per slide - spam-tapping can't skip the rules
    Snd.init();
    if(UI._tut < UI.TUT.length-1){ UI.tutShow(UI._tut+1); Snd.tone(660,{dur:.08,type:"triangle",gain:.07}); return; }
    $("ov-tut").classList.remove("active");
    if(UI._tutReplay){ UI._tutReplay=false; return; } // just refreshing the rules - stay where you were
    P.tut=true; save();
    if(loadRun()){ fitBoard(); UI.all(); return; }
    Game.startLevel(P.level);
  },
  SLOT_LV:[null,7,10,14],    // the level each seat (index 1-3) unlocks at - four in all
  visitor(){ // the meadow shows ALL FOUR seats: pets, open seats, and locked ones with their level
    const eq = UI.equipped(), slots=slotsFor(P.level);
    // WHO THE GATE SENT HOME. A barred friend is filtered out of petActives(), so it never
    // sees a sign and never acts - but the seat drew it at full strength anyway, next to a
    // meter that could not move. The seat has to say it.
    const gate = gateAt(S ? S.level : P.level), barredW = (gate && gate.bars) || null;
    // ALWAYS ON. It used to appear only once a friend was equipped, which meant the whole
    // tutorial ran without a shelf and then the board and dock shifted the moment one
    // arrived - furniture moving under a player mid-lesson.
    $("petbar").classList.add("on");
    // A NAMING ROUND SENDS THEM TO SLEEP, and a friend that quietly stops working is
    // indistinguishable from a broken one. The shelf shows it.
    $("petbar").classList.toggle("dozing", !!(S && S.tutorWord));
    for(let s=0;s<4;s++){
      const el=$("pet-"+s), g=eq[s];
      el.classList.remove("slotopen","slotlocked","flips","flipping","barred","pa1","pa2","pa3","pa4","pa5","pa6");
      if(g){ el.dataset.w=g.w; el.style.fontSize="40px";
        el.innerHTML = '<span class="petface">'
                     + (UI.artTag(g.w,"petbody") || ('<span class="petbody">'+g.e+'</span>'))
                     + '<span class="seatmark seatgone"><b>+</b></span></span>';
        el.classList.add(UI.petAnim(g.w));      // its own idle rhythm
        el.title=g.w.toUpperCase()+" · "+g.pn; el.classList.add("has");
        if(g.w===barredW){ el.classList.add("barred");
          el.title=g.w.toUpperCase()+" stays home this round"; } }
      else if(s<slots){
        // AN INVITATION ONLY IF THERE IS SOMEBODY TO INVITE. slotsFor floors at one, so
        // this chair exists even for a player who owns nobody - and through the tutorial
        // it offered a paw and "meet more friends!", which is an action they cannot take.
        // With a friend on the bench the paw still invites; with nobody, the seat shows
        // who is walking towards it.
        // A SEAT SAYS WHAT YOU CAN DO ABOUT IT, AND NOTHING ELSE. It used to show the hushed
        // silhouette of whoever was walking towards it, which read as a fifth kind of creature
        // standing among the four real ones rather than as an empty chair. Two marks now carry
        // the whole state: a PLUS where you could seat somebody today, a QUESTION MARK with
        // the level on it where you could not.
        el.innerHTML = '<span class="petface"><span class="seatmark"><b>+</b></span></span>';
        el.classList.remove("has"); el.classList.add("slotopen"); el.style.fontSize="34px";
        el.title = "an open seat - bring a friend to it"; }
      else if(s < seatsByLevel(P.level)){
        // the LEVEL has opened this one; what is missing is somebody to sit in it
        el.innerHTML = '<span class="petface"><span class="seatmark"><b>+</b></span></span>';
        el.classList.remove("has","flips"); el.classList.add("slotopen"); el.style.fontSize="34px";
        el.title = "this seat is ready - meet another friend to fill it"; }
      else { // a locked seat - somebody still out there, and the level they can join you
        // IT SAYS WHEN, WITHOUT BEING ASKED. The seat used to flip on tap to show the level on
        // its back - a whole interaction spent hiding two characters. With no portrait to make
        // room for, the level just sits under the mark and the tap is free to say something else.
        el.innerHTML='<span class="petface"><span class="seatmark">'
                    +'<b>?</b><i>LV '+UI.SLOT_LV[s]+'</i></span></span>';
        el.classList.remove("has"); el.classList.add("slotlocked"); el.style.fontSize="34px";
        el.title="this seat unlocks at level "+UI.SLOT_LV[s]; }
    }
    if(S && !S.over) UI.petMeter(); // repainting wipes the countdown badge - restore it
  },
  discover(g){ // the MEET ritual: shown at the start of the round AFTER you unlocked them
    if(!g){ if(S){ S.busy=false; } return; } // never let a missing creature freeze the garden
    Snd.discover(); buzz([30,50,30,50,90]); UI.confetti();
    { const art=UI.artTag(g.w,"meetimg"); if(art) $("meet-creature").innerHTML=art; else $("meet-creature").textContent=g.e; }
    $("meet-name").textContent = g.w.toUpperCase();
    // the ritual explains this pet's OWN power - no two friends are alike
    const firstEver = Object.keys(P.metGrove).length===0;
    // "every few words" was the shared-meter model, retired when every friend got its own
    // sign. It was the FIRST thing ever said about a friend's timing, and it was wrong for
    // all fifty of them - the fish follows gold, the fox follows tumbles, the snail counts
    // drops. Say the friend's actual sign.
    const how = g.ps ? "always on while "+g.w+"'s on duty" : "wakes on "+UI.signPhrase(g);
    $("meet-line").innerHTML = firstEver
      ? "awake, and itself again. <b>"+g.pn+" "+g.pi+"</b> - "+how+": "+g.pd+".<br>Your friends wait above the board · swap them in the Book 📖"
      : "<b>"+g.pn+" "+g.pi+"</b> - "+how+": "+g.pd+".";
    // if the party is full, say so RIGHT NOW - otherwise the missing pet reads as a bug
    const max=slotsFor(P.level), full=(P.equip||[]).length>=max && !(P.equip||[]).includes(g.w);
    $("meet-count").innerHTML = "name "+Object.keys(P.grove).length+" of "+GROVE.length+" remembered"
      + (full ? "<br>your party is full (<b>"+max+"</b> for now"+(UI.nextSlotAt()?", room for more at level "+UI.nextSlotAt():"")+") - swap friends in the Book 📖" : "");
    UI._meetCreature = g.w;
    $("ov-meet").classList.add("active"); Game.shown("meet");
    // a slow rain of sparks around the waking creature - staggered so the moment breathes
    const card=$("ov-meet").querySelector(".card");
    for(let i=0;i<10;i++) setTimeout(()=>{
      if(!$("ov-meet").classList.contains("active")) return;
      const s=document.createElement("span"); s.className="meetspark"; s.textContent=rand(["✨","⭐","🌟"]);
      s.style.left=(14+Math.random()*72)+"%"; s.style.top=(34+Math.random()*90)+"px";
      card.appendChild(s); setTimeout(()=>s.remove(),1500);
    }, i*420);
  },
  breeze(){ // a soft, gentle breeze drifts across, carrying leaves that twirl in the wind
    const g=document.createElement("div"); g.className="gustsweep"; boardEl.appendChild(g);
    setTimeout(()=>g.remove(),2300);
    const leaves=["🍃","🍂","🌿"];
    for(let i=0;i<11;i++){ const l=document.createElement("div"); l.className="windleaf";
      l.textContent = leaves[i%3];
      l.style.top=(6+Math.random()*82)+"%";
      l.style.fontSize=(13+Math.random()*10)+"px";
      l.style.setProperty("--dur",(1.0+Math.random()*0.6)+"s");
      l.style.animationDelay=(Math.random()*0.4)+"s";
      l.style.opacity=(0.7+Math.random()*0.3);
      boardEl.appendChild(l); setTimeout(()=>l.remove(),3200); }
    Snd.wind ? Snd.wind() : Snd.whoosh();
  },
  stardrift(){ // SILVER starlight drifts down - text glyphs so the white takes
    for(let i=0;i<14;i++){ const p=document.createElement("div"); p.className="petal starfall";
      p.textContent=["★","✦","✧"][i%3];
      p.style.left=Math.random()*100+"%"; p.style.top="0";
      p.style.setProperty("--fall",(boardEl.clientHeight*0.85+Math.random()*30)+"px");
      p.style.animationDuration=(1.1+Math.random()*0.7)+"s"; p.style.animationDelay=(Math.random()*0.4)+"s";
      boardEl.appendChild(p); setTimeout(()=>p.remove(),2200); }
  },
  meetBloom(emoji){ // the friend arrives ON the board: petals rain, the critter scampers across
    const colors=["🌸","🌼","🌷","💮","🏵️"];
    for(let i=0;i<16;i++){
      const p=document.createElement("div"); p.className="petal"; p.textContent=colors[i%colors.length];
      p.style.left=Math.random()*100+"%"; p.style.top="0";
      p.style.setProperty("--fall",(boardEl.clientHeight*0.9+Math.random()*30)+"px");
      p.style.animationDuration=(1.3+Math.random()*0.8)+"s"; p.style.animationDelay=(Math.random()*0.5)+"s";
      boardEl.appendChild(p); setTimeout(()=>p.remove(),2700);
    }
    const c=document.createElement("div"); c.className="critter-run";
    c.innerHTML=UI.artTag(emoji,"critterimg")||emoji;   // 'emoji' is the creature's WORD now
    c.style.left="-14%"; c.style.top="46%";
    boardEl.appendChild(c); setTimeout(()=>c.remove(),1700);
    Snd.discover();
  },
  GROVE_MILES:[ {n:10,i:"🌸",t:"The wood begins to stir!"}, {n:25,i:"🎶",t:"The wood is waking!"},
    {n:40,i:"🎼",t:"The wood remembers its song!"}, {n:50,i:"🌈",t:"The wood is AWAKE!"} ],
  // ONE SIGNAL, SHOWN ONCE. "your next friend" exists to show a brand-new player that the
  // hushed cards are earnable and where the requirement is written. It runs only while the
  // cat is their single friend and retires the moment the dog is home.
  //
  // Nothing else in this Book glows. A creature whose calling completes is already
  // announced twice - the whispers card, then the level intro naming what hides there - so
  // a third badge here would be noise, and a permanent "next" signpost would be a lie
  // besides: callings complete from how you play, not from the order they are listed in.
  teachingQuarry(){
    if(Object.keys(P.metGrove||{}).length!==1) return null;   // the window is exactly one friend wide
    const next = GROVE.find(g=>!P.grove[g.w]);
    return next ? next.w : null;
  },
  groveShow(){
    const found=Object.keys(P.grove).length;
    $("gr-count").textContent = found+"/"+GROVE.length;
    $("gr-daily").textContent = P.dailyWordDay===Math.floor(Date.now()/864e5) ? "✓"
      : (Game.hasPassive("whisper") ? dailyWord()[0].toUpperCase()+"…" : "?"); // 🐧 the penguin knows
    const f=$("grovefield"); f.innerHTML="";
    const onduty=UI.equipped().map(g=>g.w);
    const met=w=>!!P.metGrove[w];
    const fmt=ts=>new Date(ts).toLocaleDateString(undefined,{month:"short",day:"numeric"});
    // ---- the party shelf: your team, like framed family photos ----
    const party=document.createElement("div"); party.className="gparty";
    const eq=UI.equipped();
    const nxt=UI.nextSlotAt();
    const slots=slotsFor(P.level);
    const seats=[];
    for(let s=0;s<4;s++){
      const g=eq[s];
      if(g) seats.push('<div class="gpartypet"><span class="pe">'+(UI.artTag(g.w,"peimg")||g.e)+'</span><small>'+g.w.toUpperCase()+'</small><span class="pw">'+g.pi+' '+g.pn+'</span></div>');
      else if(s<slots) seats.push('<div class="gpartypet gseat"><span class="pe pawghost">🐾</span><small>open seat</small><span class="pw">meet a friend</span></div>');
      else seats.push('<div class="gpartypet gseat"><span class="pe pawghost">🐾</span><small>🔒 LV '+UI.SLOT_LV[s]+'</small><span class="pw">unlocks later</span></div>');
    }
    party.innerHTML="<h4>🌿 your party</h4>"
      + '<div class="row">'+seats.join("")+'</div>'
      // "around level 4" - no screen ever says that. The prologue is labelled Prologue 1-5
      // and the first thing called Level 1 comes AFTER the cat. Say the label the player is
      // actually looking at.
      + (eq.length? '' : '<div class="note">your first friend joins in <b>Prologue 4</b></div>')
      + '<div class="note">'+eq.length+' / '+slots+' seats filled</div>';
    f.appendChild(party);
    // ---- pawprint progress + keepsake badges ----
    const prog=document.createElement("div"); prog.className="gprog";
    const nextMile=UI.GROVE_MILES.find(mi=>found<mi.n);
    prog.innerHTML="🐾 <b>"+found+"</b> of "+GROVE.length+" friends"
      + '<div class="gbar"><div class="gbarfill" style="width:'+(100*found/GROVE.length)+'%"></div></div>'
      + (nextMile? (nextMile.n-found)+" more until "+nextMile.i+" <i>"+nextMile.t.toLowerCase()+"</i>" : "🌈 every friend is home")
      + '<div class="gmiles">'+UI.GROVE_MILES.map(mi=>'<span class="'+(found>=mi.n?"earned":"")+'" title="'+mi.t+'">'+mi.i+'</span>').join("")+'</div>';
    f.appendChild(prog);
    // milestone crossings celebrate ONCE, then the badge stays forever
    P.groveMile=P.groveMile||{};
    UI.GROVE_MILES.forEach(mi=>{ if(found>=mi.n && !P.groveMile[mi.n]){
      P.groveMile[mi.n]=true; save();
      setTimeout(()=>{ UI.confetti(); Snd.levelUp();
        Alder.pageData({ k:"mile-"+mi.n, b:mi.i, s:"<b>"+mi.t+"</b>",
          g:"🐾 "+mi.n+" names remembered. The wood is louder for it." }, {once:true}); }, 500); } });
    // ---- the album: sky then ground, every friend a trophy card ----
    /* ONE CARD, BUILT ONCE. It used to live inside section(), which meant the only way to
       show a friend was to also show a heading and a grid - and the road needs the card
       without either. Hoisted, not duplicated: a second copy would be the third place in
       this file that decides what a friend's card says. */
    const mkCard=(g)=>{
        const has=!!P.grove[g.w];
        const el=document.createElement("div");
        if(has){
          el.className="gcard";
          el.innerHTML=(onduty.includes(g.w)?'<span class="ribbon">ON DUTY</span>':'')
            +'<span class="ge">'+(UI.artTag(g.w,"geimg")||g.e)+'</span><span class="mound"></span>'
            +'<span class="gn">'+g.w.toUpperCase()+'</span>'
            +'<span class="gp">'+g.pi+' '+g.pn+'</span>'
            // the SIGN, on the face of the card. The date it joined is a keepsake and it
            // lives on the friend's own page; what a player needs while choosing a party
            // is what wakes this one.
            +'<span class="gd">'+(g.ps ? "always awake"
                : "wakes at "+(Game.wakeNeed(g)>1 ? Game.wakeNeed(g)+" " : "")
                  +signNoun(g.wake&&g.wake.on))+'</span>';
          el.onclick=()=>UI.petSheet(g.w);
        } else {
          const isNext = g.w===UI.teachingQuarry();      // the one-time lesson, and nothing else
          el.className="gcard mystery"+(isNext?" nextup":"");
          // the card IS the quest log: its calling, its progress, and - once it's
          // listening - the drumroll that a naming level is coming
          const c=CALLINGS[g.w]||{};
          const pr=Game.callProgress(g.w);
          /* WHAT THE CARD ASKS FOR HAS TO BE WHAT THE GAME ASKS FOR. The courtship is the
             everyday door now - do this creature's own thing, in one round, while it can
             hear you - but the card still advertised the lifetime calling, which is the
             slower second door. A player would have chased "clear 300 words" while the
             friend was two crumbs away. So: while it is listening, the card says the thing
             you can do RIGHT NOW; the lifetime calling stays for the friends whose country
             is still ahead, where it is the only progress that means anything yet. */
          /* the lifetime-calling line is DEAD - its door was removed with the tally, and a
             card that advertises "win 3 times in the Bramblewood" sells a grind that opens
             nothing (caught in the replay's Book audit). Every hushed card now speaks the
             ONE real system: the ask, and where the friend must be to hear it. */
          const court = Game.courtship(g);
          const canHear = Game.canHear(g.w);
          const homeC = (typeof HOME!=="undefined" && HOME[g.w]) ? BIOME_NAMES[HOME[g.w][0]] : null;
          const callLine = P.called[g.w]
            ? '<span class="gcall listening">💫 it is coming to meet you…<br>show it the thing it loves</span>'
            : (canHear && court)
              ? '<span class="gcall">loves '+court.n+' &times; '+signNoun(court.sign)+' <b>in one round</b></span>'
              : '<span class="gcall">'+(homeC ? 'waits in <b>'+homeC+'</b>' : 'waits further on')
                +(court ? '<br><small>loves '+court.n+' &times; '+signNoun(court.sign)+'</small>' : '')+'</span>';
          el.innerHTML='<span class="ge">'+(UI.artTag(g.w,"geimg")||g.e)+'</span><span class="mound"></span>'
            +(isNext?'<span class="nexttag">your next friend</span>':'')
            +'<span class="gn">a hushed friend</span>'
            +'<span class="gp">its name has '+g.w.length+' letters</span>'
            +callLine;
          el.onclick=()=>{ el.classList.remove("wiggle"); void el.offsetWidth; el.classList.add("wiggle");
            Snd.tone(520,{dur:.08,type:"triangle",gain:.05}); };
        }
        return el;
    };
    /* ══ THE LONG ROAD ══
       The Book was a scrolling list of fifty, which is why only about a third of testers
       ever opened it: a heap tells you creatures exist and nothing about how to meet one.
       It is the walk now. Fifteen countries on one spine, each a slim band carrying its own
       painting, and the country you are standing in OPENS to full portraits and the
       courtship each friend is asking for right now. Tap any other band to open it in place.

       Three things become readable that no list could say, and none of them is written out:
       how far you have come (the ticked pins behind you), that a country you have left still
       listens so nobody is ever stranded, and that the wood keeps going a long way past you.

       A page per country was the other candidate and it was rejected on sight - countries
       hold between one and five friends, so a full page each is mostly whitespace and the
       last four countries would be a painting and a single frame. */
    const keyed = new Set(Object.values(KEYSTONE));
    const here  = biomeOf(P.level);
    if(UI._roadOpen==null) UI._roadOpen = here;
    const road = document.createElement("div"); road.id="road";
    const byCountry = {};
    GROVE.forEach(g=>{ const h=HOME[g.w]; if(!h || keyed.has(g.w)) return;
      (byCountry[h[0]]=byCountry[h[0]]||[]).push(g); });

    for(let c=0;c<BIOME_NAMES.length;c++){
      const list = byCountry[c]; if(!list || !list.length) continue;
      const met  = list.filter(g=>P.grove[g.w]).length;
      const walked = here>=c;
      const stop = document.createElement("div"); stop.className="rstop";
      const pin  = document.createElement("div");
      pin.className = "rpin"+(c===here ? " here" : (walked && met===list.length ? " done" : (walked?" done":"")));
      stop.appendChild(pin);
      const art = 'url("art/bg/bio'+c+'.jpg")';

      if(c===UI._roadOpen){
        const box=document.createElement("div"); box.className="ropen"+(c===here?"":" past");
        const head=document.createElement("div"); head.className="rhead";
        head.style.backgroundImage=art;
        const listening = list.filter(g=>!P.grove[g.w] && Game.canHear(g.w)).length;
        head.innerHTML='<span class="rname">'+(BIOMES[c]||"")+' '+(BIOME_NAMES[c]||"")+'</span>'
          +'<span class="rstate">'+(c===here
              ? (listening ? "you are here &middot; "+listening+" listening" : "you are here")
              : (c<here ? (listening?"behind you &middot; still listening":"behind you")
                        : "further on"))+'</span>';
        head.onclick=()=>{ UI._roadOpen = (UI._roadOpen===c ? -1 : c); UI.groveShow(); };
        const body=document.createElement("div"); body.className="rbody";
        list.forEach(g=>body.appendChild(mkCard(g)));
        const foot=document.createElement("div"); foot.className="rfoot";
        foot.innerHTML = met===list.length ? "every name here is remembered"
          : met+" of "+list.length+" remembered here";
        box.appendChild(head); box.appendChild(body); box.appendChild(foot);
        stop.appendChild(box);
      } else {
        const band=document.createElement("div");
        band.className="rband"+(walked?"":" locked");
        band.style.backgroundImage=art;
        const listening = list.filter(g=>!P.grove[g.w] && Game.canHear(g.w)).length;
        // the band says where it stands in your walk without you having to open it
        const sub = !walked ? "further on"
          : met===list.length ? "all remembered"
          : listening ? met+" of "+list.length+" &middot; "+listening+" listening"
          : met+" of "+list.length+" remembered";
        band.innerHTML='<span class="rtext"><span class="rname">'+(BIOME_NAMES[c]||"")+'</span>'
          +'<span class="rsub">'+sub+'</span></span>'
          +'<span class="rmini'+(list.length>5?" many":"")+'">'+list.map(g=>{
              const has=!!P.grove[g.w];
              return '<i class="'+(has?"":"dim")+'">'+(UI.artTag(g.w)||("<span>"+g.e+"</span>"))+'</i>';
            }).join("")+'</span>';
        band.onclick=()=>{ UI._roadOpen=c; UI.groveShow(); };
        stop.appendChild(band);
      }
      road.appendChild(stop);
    }
    /* the keystones get their own tray. They are given at doors, never found, and listing
       them among the findable would send somebody hunting for a gift. */
    const gifts = GROVE.filter(g=>keyed.has(g.w) && !P.grove[g.w]);
    if(gifts.length){
      const tray=document.createElement("div"); tray.className="rdoors";
      tray.innerHTML='<div class="rd-t">🗝️ waiting at the doors ahead</div>'
        +'<div class="rd-g">'+gifts.map(g=>'<i>'+(UI.artTag(g.w)||("<span>"+g.e+"</span>"))+'</i>').join("")+'</div>';
      road.appendChild(tray);
    }
    f.appendChild(road);
    // …and if the one-time lesson card has fallen below the fold, lift it into view. Only
    // then - nobody wants the party shelf yanked out from under them when it was already
    // in plain sight. Once the lesson retires there is nothing here to chase the player to.
    /* ONE SCROLL, AND IT GLIDES.
       This was three moves fighting each other on every repaint: snap to the top, jump to
       the open country, then jump again to the one-time lesson card. Tapping a band redraws
       the whole road, so every tap ran all three and the screen lurched twice - which is
       what "abrupt, random up and down" was. One target, chosen once, moved to smoothly.
       Reduced motion still gets the instant version, because gliding a whole screen is
       exactly the kind of movement that setting exists to refuse. */
    requestAnimationFrame(()=>{
      const target = f.querySelector(".ropen") || f.querySelector(".gcard.nextup");
      if(!target){ f.scrollTop=0; return; }
      const fr=f.getBoundingClientRect(), tr=target.getBoundingClientRect();
      if(tr.top>=fr.top && tr.bottom<=fr.bottom) return;   // already in sight: do not move at all
      const to = f.scrollTop + (tr.top-fr.top) - fr.height*0.16;
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if(still || typeof f.scrollTo!=="function") f.scrollTop = to;
      else f.scrollTo({ top:to, behavior:"smooth" });
    });
    UI.scene("scene-grove");
  },
  petSheet(w){ // one friend, told properly - portrait, plaque, power, and the duty button
    const g=GROVE_BY_WORD[w]; if(!g || !P.grove[w]) return;
    UI._sheetW=w;
    Snd.tone(880,{dur:.1,type:"triangle",gain:.06,verb:true}); buzz(8);
    $("pet-sheet-e").innerHTML=UI.artTag(g.w,"sheetimg")||g.e;
    $("pet-sheet-n").textContent=g.w.toUpperCase();
    $("pet-sheet-f").textContent='"'+g.f+'"';
    $("pet-sheet-p").innerHTML="<b>"+g.pn+" "+g.pi+"</b><br>"+g.pd+(g.ps?"<br><small>always on while on duty</small>":"");
    // WHAT WAKES IT - the rule is stated where a party is chosen. Which friends suit
    // which round is never stated anywhere, and stays the player's to notice.
    $("pet-sheet-mate").innerHTML = g.ps ? ""
      : "stirs at <b>"+((g.wake&&g.wake.n>1 ? g.wake.n+" " : "")
        +signNoun(g.wake&&g.wake.on))+"</b>";
    $("pet-sheet-met").textContent="part of your grove since "+new Date(P.grove[w]).toLocaleDateString(undefined,{month:"long",day:"numeric"});
    const isMet=!!P.metGrove[w], on=UI.equipped().some(x=>x.w===w);
    const btn=$("pet-sheet-btn");
    if(!isMet){ btn.textContent="arriving next round…"; btn.disabled=true; }
    else { btn.disabled=false; btn.textContent = on ? "💤 Let them rest" : "🌿 Bring on duty"; }
    $("ov-pet").classList.add("active");
  },
  closeSheet(){ $("ov-pet").classList.remove("active"); $("pet-sheet-swap").classList.remove("on"); },
  sheetEquip(){
    const w=UI._sheetW; if(!w || !P.metGrove[w]) return;
    const on=UI.equipped().some(x=>x.w===w);
    const full=(P.equip||[]).length>=slotsFor(P.level);
    // TARGETED SWAP: a tile was double-tapped, so the choice replaces exactly that tile -
    // no "pick who rests" step, that IS the swap the player just asked for.
    if(!on && full && UI._swapSlot!=null && UI._swapOut){
      UI.equipSwap(UI._swapOut, w); UI._swapSlot=null; UI._swapOut=null; return;
    }
    UI._swapSlot=null; UI._swapOut=null;
    if(on || !full){ UI.equipToggle(w); UI.petSheet(w); return; }
    // party full: YOU pick who rests - no surprise swaps
    const row=$("pet-sheet-swrow"); row.innerHTML="";
    UI.equipped().forEach(g=>{
      const b=document.createElement("button"); b.className="swpet";
      b.innerHTML='<span class="se">'+(UI.artTag(g.w,"seimg")||g.e)+'</span><small>'+g.w.toUpperCase()+'</small>';
      b.onclick=()=>UI.equipSwap(g.w, w);
      row.appendChild(b);
    });
    $("pet-sheet-swap").classList.add("on");
    Snd.tone(700,{dur:.1,type:"sine",gain:.05,verb:true});
  },
  equipSwap(outW, inW){ // the deliberate trade: outW rests, inW joins
    P.equip=(P.equip||[]).filter(x=>x!==outW);
    P.equip.push(inW);
    save();
    UI.chip((UI.artTag(outW,"chipimg")||GROVE_BY_WORD[outW].e)+" rests · "+(UI.artTag(inW,"chipimg")||GROVE_BY_WORD[inW].e)+" joins the party!");
    Snd.tone(988,{dur:.12,type:"triangle",gain:.07,verb:true}); buzz(15);
    $("pet-sheet-swap").classList.remove("on");
    UI.visitor(); UI.groveShow(); UI.petSheet(inW);
  },
  // "another seat opens at level N" is about the LADDER, so it reads the level, not the
  // seats you can currently fill - otherwise a player with one friend is told the next
  // seat comes at 7 while they stand on level 15
  nextSlotAt(){ const m=seatsByLevel(P.level); return m>=4?null : m===3?14 : m===2?10 : 7; },
  equipToggle(w){ // choose who comes adventuring with you (slots grow with your level)
    if(!P.metGrove[w]) return;
    /* 🐻 the hibernating bear cannot be asked - and its seat stays WARM for two rounds
       after it carried you, so letting the bear go is felt before the seat frees. */
    if(P.bearRest && w==="bear"){
      UI.chip((UI.artTag("bear","toastimg")||"🐻")+" still hibernating - <b>"
        +Math.max(0,(P.bearRest.need-(P.bearRest.have||0)))+" words</b> of yours will wake it");
      return;
    }
    P.equip = P.equip||[];
    const max=slotsFor(P.level);
    const i=P.equip.indexOf(w);
    if(i>=0){ P.equip.splice(i,1); UI.chip((UI.artTag(w,"chipimg")||GROVE_BY_WORD[w].e)+" stays home for now"); }
    else {
      if(P.bearRest && P.bearRest.seatWarmUntil > (advOf(P.level)||0) && P.equip.length>=max-1){
        UI.chip("🐻 the bear's seat is still warm - give it a round or two");
        return;
      }
      if(P.equip.length>=max){ // never surprise-swap: the sheet's picker owns full-party trades
        const nxt=UI.nextSlotAt();
        UI.chip("all "+max+" seats are taken - pick who rests first 💤"+(nxt?"<br><small>another seat opens at level "+nxt+"</small>":""));
        return;
      }
      UI.chip((UI.artTag(w,"chipimg")||GROVE_BY_WORD[w].e)+" joins the party!");
      P.equip.push(w);
      Snd.tone(988,{dur:.12,type:"triangle",gain:.07,verb:true}); buzz(15);
    }
    save(); UI.visitor(); UI.groveShow();
  },
  statsShow(){
    UI.menuToggle(false);
    // the collection leads - it is what the game is actually about
    const found=Object.keys(P.metGrove||{}).length, total=GROVE.length;
    const mile=UI.GROVE_MILES.find(mi=>found<mi.n);
    $("st-grovehead").innerHTML = "🐾 <b>"+found+"</b> of "+total+" names remembered";
    /* THE BAR WAS DELETED AND THIS LINE WAS NOT. $("st-grovebar") is null, so this threw a
       TypeError before the panel was ever shown - "📊 Your journey" in the menu closed the
       menu and then did nothing at all, on every tap, for every player. Nothing logs it
       because the throw happens inside a click handler. */
    $("st-mile").innerHTML = mile
      ? "<b>"+(mile.n-found)+"</b> more until "+mile.i+" "+mile.t.toLowerCase()
      : "🌈 every name is home - the hush is over";
    const bi=biomeOf(P.level);
    /* THE PROLOGUE OFFSET, MISSED IN FOUR PLACES. levelLabel()/levelShort() subtract
       PROLOGUE_END everywhere the player normally looks, so this panel read "level 26" while
       the chip above it read LV 21, and "level 3" during a round labelled Prologue 3 of 5. */
    $("st-place").innerHTML = BIOMES[bi]+" &nbsp;<b>"+BIOME_NAMES[bi]+"</b> &nbsp;·&nbsp; "+levelLabel(P.level).toLowerCase();
    $("st-level").textContent=levelShort(P.level);
    $("st-wins").textContent=P.stats.wins;
    $("st-words").textContent=P.stats.words;
    $("st-streak").textContent=P.streak||0;
    $("st-chain").textContent="×"+P.stats.bestChain;
    $("st-word").textContent=P.bestWord||"-";
    $("st-amber").textContent=P.amber||0;
    $("st-party").textContent=(P.equip||[]).length;
    $("m-stats").classList.add("active");
  },
  statsHide(e){
    // close only from the backdrop or the ✓ button - clicks INSIDE the card must not bubble into a close
    if(e && e.target.closest(".card")) return;
    $("m-stats").classList.remove("active");
  },
  /* retired with the hint rings - kept as a no-op because the stuck-detector and the
     dead-drop counter still call it, and a missing function there would throw inside a
     timer nobody is watching. */
  nudge(){ },
  hadKillers:false,
  /* ══ THE GAME DOES NOT PLAY ITSELF ══
     This scanned every column for a word your letter would finish and ringed the landing
     cells in gold, unasked, whenever a player went quiet or dropped twice without
     clearing. It is the single most powerful thing on the screen: once it fires there is
     no puzzle left, only the ring to tap - and a player who has been shown the answer has
     not solved anything, so the next round teaches them nothing either.
     It is gone. The board stays silent and the player reads it themselves.
     NOTE: Game.petHint (Bright Eyes) draws the same rings and STAYS - that is a power a
     player chose to bring, spent a seat on, and asked for. Being handed the answer by a
     friend you equipped is a reward; being handed it for hesitating is a correction. */
  hints(){
    S.killers={};
    document.querySelectorAll(".killcell,.droplabel").forEach(e=>e.remove());
    UI.hadKillers=false;
  },
});
