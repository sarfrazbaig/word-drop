Object.assign(UI, {
  dbgLock(){
    const o=$("ov-debug");
    o.classList.add("active","locked");
    $("dbg-lockmsg").textContent="enter the keeper's number";
    const pw=$("dbg-pw"); pw.value="";
    pw.onkeydown = e => { if(e.key==="Enter") UI.dbgUnlock(); };
    setTimeout(()=>pw.focus(), 80);
  },
  dbgUnlock(){
    const pw=$("dbg-pw");
    if(pw.value.trim()!==UI.DBG_PW){
      $("dbg-lockmsg").textContent="not that one";
      pw.value=""; buzz(60); Snd.reject && Snd.reject();
      return;
    }
    try{ sessionStorage.setItem("hush_dbg","1"); }catch(e){}
    UI.dbgShow();
  },
  dbgShow(){
    UI._dbgWipeArmed=false;
    UI._dbgTab = UI._dbgTab || "road";
    $("ov-debug").classList.remove("locked");
    $("ov-debug").classList.add("active");
    UI.dbgRender();
  },
  dbgClose(){ $("ov-debug").classList.remove("active","locked"); },

  DBG_TABS:[["road","🧭 road"],["round","🎯 round"],["friends","🐾 friends"],["save","💾 save"]],
  dbgTab(t){ UI._dbgTab=t; UI.dbgRender(); },
  dbgRender(){
    /* THE WIPE DISARMS ON EVERY REDRAW. Its armed state lived on UI while its label lived in
       the panel, so arming it and switching tabs put the button back to reading "wipe save"
       with the trigger still pulled - one tap, no second chance, save gone. A tester already
       lost a level 15 run to a confirmation that was too easy; this one was worse. */
    UI._dbgWipeArmed=false;
    const lv=P.level||1, b=biomeOf(lv);
    $("dbg-state").innerHTML = levelLabel(lv) + " &middot; " + BIOMES[b] + " " + BIOME_NAMES[b]
      + "<br>🟠 " + (P.amber||0) + " &middot; " + Object.keys(P.grove||{}).length + "/" + GROVE.length + " friends"
      + " &middot; 🍃" + (P.pow.swap||0) + " 🌟" + (P.pow.wild||0);
    $("dbg-tabs").innerHTML = UI.DBG_TABS.map(([k,label]) =>
      '<button class="dbgtab' + (UI._dbgTab===k?" on":"") + '" onclick="UI.dbgTab(\''+k+'\')">' + label + '</button>').join("");
    const B = (fn,label) => '<button class="charm-btn" onclick="'+fn+'">'+label+'</button>';
    let h="";
    if(UI._dbgTab==="road"){
      h += '<div class="dbggroup">jump to a level</div>'
        + '<div class="dbgjump"><input id="dbg-lv" type="number" inputmode="numeric" min="1" value="'+lv+'">'
        + '<button class="charm-btn" onclick="UI.dbgGoInput()" style="flex:0 0 auto;padding:8px 14px">go</button></div>'
        + '<div class="dbggroup">or walk</div><div id="dbg-rows">'
        + B("UI.dbgSkip(1)","▶ next level") + B("UI.dbgSkip(-1)","◀ back one")
        + B("UI.dbgSkip(10)","▶▶ +10") + B("UI.dbgSkip(-10)","◀◀ -10")
        + B("UI.dbgSkip(0)","↻ replay this one") + B("UI.dbgGo("+(PROLOGUE_END+1)+")","⇤ first real level")
        + '</div>'
        + '<div class="dbggroup">jump to a country</div><div class="dbgcountry">'
        + BIOME_NAMES.map((n,i)=>'<button class="'+(i===b?"on":"")+'" onclick="UI.dbgCountry('+i+')">'
            + BIOMES[i] + '<br>' + n.replace(/^The /,"") + '</button>').join("")
        + '</div>';
    } else if(UI._dbgTab==="round"){
      const live = !!(S && !S.over && !S.won);
      h += '<div class="dbggroup">this round' + (live?"":" (not in one)") + '</div><div id="dbg-rows">'
        + B("UI.dbgWin()","🏆 win it now") + B("UI.dbgLose()","💀 lose it now")
        + B("UI.dbgMoves(10)","👣 +10 moves") + B("UI.dbgMoves(-5)","👣 -5 moves")
        + B("UI.dbgScore()","🎯 meet the target") + B("UI.dbgClearBoard()","🧹 clear the board")
        + '</div>'
        + '<div class="dbggroup">pockets</div><div id="dbg-rows">'
        + B("UI.dbgAmber()","🟠 +100 amber") + B("UI.dbgTool()","🍃🌟 +3 of each tool")
        + '</div>'
        + '<div class="dbggroup">drop a trouble on the board</div><div class="dbgcountry">'
        + OBSTACLE_KINDS.map(k=>'<button onclick="UI.dbgSeed(\''+k+'\')">'
            + (TROUBLE_ICON[k]||"?") + '<br>' + k + '</button>').join("")
        + '</div>';
    } else if(UI._dbgTab==="friends"){
      const eq = P.equip||[];
      h += '<div class="dbggroup">tap to give or take a friend &middot; their calling is answered for them</div>'
        + '<div id="dbg-rows">' + B("UI.dbgPetsAll(1)","🐾 give me all 50") + B("UI.dbgPetsAll(0)","🚫 take them all back") + '</div>'
        + '<div class="dbggroup">the fifty</div><div class="dbgpets">'
        + GROVE.map(g=>{
            const has=!!P.grove[g.w], duty=eq.indexOf(g.w)>=0;
            const face = UI.artTag ? (UI.artTag(g.w,"") || ("<b>"+g.e+"</b>")) : ("<b>"+g.e+"</b>");
            return '<button class="dbgpet'+(has?" has":"")+(duty?" duty":"")+'" onclick="UI.dbgPet(\''+g.w+'\')">'
              + face + g.w + '</button>';
          }).join("")
        + '</div>';
    } else {
      h += '<div class="dbggroup">test rigs</div><div id="dbg-rows">'
        + '<button class="charm-btn" id="dbg-shop" onclick="UI.dbgShop()">💳 payments</button>'
        + '<button class="charm-btn" id="dbg-ads" onclick="UI.dbgAds()">🎬 ads</button>'
        + '<button class="charm-btn" id="dbg-finale" onclick="UI.dbgFinale()">🌈 finale</button>'
        + '<button class="charm-btn" id="dbg-tele" onclick="UI.dbgTele()">📡 telemetry</button>'
        + '<button class="charm-btn" id="dbg-selftest" onclick="UI.dbgSelftest()">🧪 selftest</button>'
        + '<button class="charm-btn" id="dbg-skin" onclick="UI.dbgSkin()">🎨 skin</button>'
        + '</div>'
        + '<div class="dbggroup">danger</div><div id="dbg-rows">'
        + '<button class="charm-btn" id="dbg-wipe" onclick="UI.dbgWipe()">🗑️ wipe save</button>'
        + '<button class="charm-btn" id="dbg-new" onclick="UI.dbgNewTester()">🆕 new playtester</button>'
        + B("UI.dbgRelock()","🔒 lock the toolbox")
        + '</div>';
    }
    $("dbg-body").innerHTML=h;
  },
  dbgRelock(){ try{ sessionStorage.removeItem("hush_dbg"); }catch(e){} UI.dbgClose(); },
  /* the HUD only exists inside a round; the panel always does */
  dbgRefresh(){ try{ if(typeof S!=="undefined" && S) UI.all(); }catch(e){} UI.dbgRender(); },

  /* ---- the road ---- */
  dbgGoInput(){ const v=parseInt($("dbg-lv").value,10); if(v>0) UI.dbgGo(v); },
  dbgCountry(b){ UI.dbgGo(b*BIOME_LEN + 1 + PROLOGUE_END); },
  dbgSkip(n){ UI.dbgGo(n===0 ? (P.level||1) : Math.max(1,(P.level||1)+n)); },
  /* the painting is fetched and decoded BEFORE the level starts, so the country always
     changes on the same frame the number does */
  async dbgGo(level){
    level=Math.max(1, level|0);
    await warmBiome(biomeOf(level));
    P.level=level; P.run=null; save();
    UI.dbgClose();
    Game.startLevel(P.level); UI.scene("scene-game");
  },

  /* ---- the round ---- */
  dbgWin(){ if(!S || S.over || S.won) return; UI.dbgClose();
    S.tutorWord=null; S.guestNamed=false;
    if(S.goal){ S.goal.have=S.goal.need; } if(S.goal2){ S.goal2.have=S.goal2.need; }
    S.levelScore=Math.max(S.levelScore, S.target||0);
    Game.winLevel(); },
  dbgLose(){ if(!S || S.over || S.won) return; UI.dbgClose(); S.movesLeft=0; Game.failLevel(); },
  dbgMoves(n){ if(!S) return; S.movesLeft=Math.max(0,(S.movesLeft||0)+n); UI.dbgRefresh(); },
  dbgScore(){ if(!S) return; S.levelScore=Math.max(S.levelScore||0, S.target||0); UI.dbgRefresh(); },
  dbgTool(){ P.pow.swap=(P.pow.swap||0)+3; P.pow.wild=(P.pow.wild||0)+3; save();
    try{ UI.breezePill(); UI.wishPill(); }catch(e){}
    UI.dbgRefresh(); },
  dbgClearBoard(){ if(!S) return;
    Object.values(S.tiles).forEach(t=>{ if(OBSTACLE_KINDS.includes(t.kind)){
      t.kind="normal"; t.cracks=0; t.inner.className="tile"; t.inner.innerHTML=tileFace(t); } });
    UI.dbgRefresh(); },
  dbgSeed(kind){ if(!S) return;
    const spots=Object.values(S.tiles).filter(t=>t.kind==="normal");
    const t=spots.length?spots[Math.floor(Math.random()*spots.length)]:null;
    if(!t) return;
    t.kind=kind; t.cracks=0;
    t.inner.className="tile "+kind; t.inner.innerHTML=tileFace(t);
    UI.dbgRefresh(); },

  /* ---- the friends ----
     Giving a friend answers its calling too. Handing somebody the cat while the wood still
     believes the cat is unclaimed leaves it queued to be summoned all over again, so the
     toolbox would create a state the game can never reach on its own - which is the one
     thing a debug tool must never do. */
  dbgPet(w){
    const g=GROVE_BY_WORD[w]; if(!g) return;
    if(P.grove[w]){
      delete P.grove[w]; delete P.metGrove[w]; delete P.called[w];
      P.equip=(P.equip||[]).filter(x=>x!==w);
      P.summonQ=(P.summonQ||[]).filter(x=>x!==w);
      if(P.summon===w) P.summon=null;
    } else {
      P.grove[w]=Date.now(); P.metGrove[w]=Date.now(); P.called[w]=1;
      P.summonQ=(P.summonQ||[]).filter(x=>x!==w);
      if(P.summon===w) P.summon=null;
      if(P.nameFails) delete P.nameFails[w];
    }
    save(); UI.dbgRefresh();
  },
  dbgPetsAll(on){
    GROVE.forEach(g=>{
      if(on){ P.grove[g.w]=P.grove[g.w]||Date.now(); P.metGrove[g.w]=P.metGrove[g.w]||Date.now(); P.called[g.w]=1; }
      else { delete P.grove[g.w]; delete P.metGrove[g.w]; delete P.called[g.w]; }
    });
    if(!on) P.equip=[];
    P.summonQ=[]; P.summon=null;
    save(); UI.dbgRefresh();
  },
  /* ART PREVIEW - staged rounds for judging portraits in place. The sets used to name
     "otter" and "badger", neither of which is one of the fifty, so two of the five preview
     rounds silently staged short. Built from the roster now, so it cannot say a name the
     wood does not know. */
  get ART_SETS(){
    const w=GROVE.map(g=>g.w), out=[];
    for(let i=0;i<w.length;i+=4) out.push(w.slice(i,i+4));
    return out;
  },
  artPreview(n){
    const pets = UI.ART_SETS[(n-1) % UI.ART_SETS.length];
    P.grove={}; P.metGrove={}; pets.forEach(w=>{ P.grove[w]=Date.now(); P.metGrove[w]=Date.now(); });
    P.equip = pets.slice(0,5);
    P.tut=true; P.gradued=1; P.amber=140; P.run=null;
    P.level = 30;   // player level 25 → five seats, so the whole set shows
    P.summon=null; P.summonQ=[]; P.called={};
    P.seenSlots={1:1,2:1,3:1,4:1,5:1}; P.seenTier={1:1,2:1,3:1};
    P.seenChapter={}; for(let b=0;b<15;b++) P.seenChapter[b]=1;
    P.graceUsed=null; P.said={"book-intro":2};
    P.seenTip={}; Object.keys(UI.TIPS||{}).forEach(k=>P.seenTip[k]=1);  // no tutorial toasts in the preview
    save();
    UI.dbgClose();
    $("app").classList.add("artbg");            // the night scene, for the preview only
    Game.startLevel(P.level); UI.scene("scene-game");
  },
  artPreviewOff(){ $("app").classList.remove("artbg"); UI.dbgClose(); },
  dbgAmber(){
    Game.amber(100);
    UI.dbgRefresh();   // one place draws the state line, so it cannot drift from the panel
  },
  dbgShop(){ // session-only test till: the full purchase flow, zero real money
    Shop.provider = Shop.provider ? null : Shop.DEV;
    $("dbg-shop").textContent = Shop.provider ? "💳 test pay ON" : "💳 test payments";
    UI.toast(Shop.provider ? "💳 test payments <b>on</b> - no real money moves" : "💳 test payments off");
    Shop.render();
  },
  dbgTele(){ Tele.flush(); UI.toast(Tele.status().replace(/\n/g,"<br>")); },
  /* ══ TRY THE OTHER LOOK ══ a skin is a class on #app and a line in localStorage, so the
     warm original is always one tap away. Two directions you can flip between are
     comparable; a rewrite is only defensible after the comparison. */
  skin(name){
    const app=$("app"); if(!app) return;
    app.classList.remove("skin-slate");
    if(name && name!=="classic") app.classList.add("skin-"+name);
    try{ localStorage.setItem("hush_skin", name||"classic"); }catch(e){}
  },
  dbgSkin(){
    const now=(localStorage.getItem("hush_skin")||"classic")==="slate" ? "classic" : "slate";
    UI.skin(now);
    UI.toast(now==="slate" ? "🎨 <b>slate</b> - the designer's direction"
                           : "🎨 <b>classic</b> - the warm original");
  },
  /* ══ THE REGRESSION SUITE, ON THE DEVICE ══ every check in it is a bug that was reported,
     diagnosed and closed, so a red line here means a fix has come undone. It drives the game
     to do things - starts rounds, fires powers, moves seats - which is why it refuses to run
     anywhere but a developer's own machine, and why it puts the level back when it is done. */
  async dbgSelftest(){
    const b=$("dbg-selftest"); if(b) b.textContent="🧪 running…";
    let r;
    try{ r=await Selftest.run(true); }
    catch(e){ if(b) b.textContent="🧪 selftest"; return UI.toast("selftest threw: "+((e&&e.message)||e)); }
    if(b) b.textContent="🧪 selftest";
    if(r.skipped) return UI.toast(r.skipped);
    const bad=r.checks.filter(c=>!c.ok);
    UI.toast(bad.length
      ? "🧪 <b>"+r.pass+" passed, "+bad.length+" FAILED</b><br>"+bad.map(c=>c.id+" - "+c.got).join("<br>")
      : "🧪 <b>all "+r.pass+" checks passed</b><br>every closed bug is still closed", 9000);
  },
  dbgFinale(){   // fill the grove and lift the hush - for testing the ending only
    GROVE.forEach(g=>{ P.grove[g.w]=P.grove[g.w]||Date.now(); P.metGrove[g.w]=P.metGrove[g.w]||Date.now(); });
    P.finale=0; save(); UI.closeToolbox && UI.closeToolbox();
    Game.finale();
  },
  dbgAds(){ // session-only test reel: rewarded flows end-to-end, no real network
    Ads.provider = Ads.provider ? null : Ads.DEV;
    $("dbg-ads").textContent = Ads.provider ? "🎬 test ads ON" : "🎬 test ads";
    UI.toast(Ads.provider ? "🎬 test ads <b>on</b> - a pretend reel, instantly watched" : "🎬 test ads off");
    Ads.giftRefresh();
  },
  dbgWipe(){ // destructive - ask twice even in a dev drawer
    if(!UI._dbgWipeArmed){ UI._dbgWipeArmed=true; $("dbg-wipe").textContent="⚠️ really? tap again"; return; }
    /* localStorage.clear() took hush_pid and the playtester's name with it, so a wipe from
       the toolbox turned that device into a brand new anonymous stranger and the run before
       it could never be tied to the run after. Clear the save, keep the identity, bump the
       run - exactly what the in-game wipe does. */
    try{
      Game.track("wipe_all",{ L:P.level, friends:Object.keys(P.grove||{}).length, run:Tele.run||1, from:"toolbox" });
      Tele.newRun(); Tele.flush(true);
    }catch(e){}
    const keepName=(P&&P.teleName)||"", keepSeen=!!(P&&P.teleSeen);
    try{
      localStorage.removeItem("worddrop_v3");
      localStorage.removeItem("worddrop_v2");
      localStorage.removeItem("worddrop_ev1");
      if(keepName||keepSeen) localStorage.setItem("worddrop_v3", JSON.stringify({teleName:keepName, teleSeen:keepSeen}));
    }catch(e){}
    location.reload();
  },

  /* ══ BECOME SOMEBODY ELSE ══ dbgWipe above deliberately KEEPS the identity - it clears the
     save and bumps the run so a device's second attempt can still be tied to its first, which
     is right for "let me replay this". It is the wrong tool for the other job: there was no
     way to sit down as a genuinely NEW playtester, because hush_pid, the run counter, the
     tester's name and the tutorial-seen mark all live outside the save file precisely so a
     wipe cannot reach them. Wiping the game therefore produced the same person starting over,
     never a stranger arriving - and a first-run experience can only be judged by a stranger.
     This clears the identity too, so the next boot has no pid, no run history, no name and no
     memory of the lessons: the welcome card asks who you are again, and everything after it is
     a true first session.
     The collected LOG is deliberately not cleared. Wiping who you are should not destroy the
     research already gathered, and every row carries its own sid and pid, so the old tester and
     the new one stay cleanly separable in the data. */
  dbgNewTester(){
    if(!UI._dbgNewArmed){ UI._dbgNewArmed=true;
      $("dbg-new").textContent="⚠️ erases your identity - tap again"; return; }
    try{
      // close the old tester's book BEFORE the name goes, or the last session lands anonymous
      Game.track("tester_retired",{ L:P.level, friends:Object.keys(P.grove||{}).length,
        run:Tele.run||1, was:Tele.who()||"(unnamed)", from:"toolbox" });
      Tele.flush(true);
    }catch(e){}
    ["worddrop_v3","worddrop_v2","worddrop_ev1","worddrop_sv",   // the save and its mirror
     "hush_pid","hush_run","hush_tq",                            // who you are, and the outbox
     "hushwood_taught"                                           // so the lessons play again
    ].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
    location.reload();
  },

  /* tileTip is RETIRED. Troubles and goals introduce themselves as Alder Pages on their
     debut doorstep; golds, shifts and out-of-order meetings ride Alder's pocket - see
     Game.showPendingTip. The tool lessons page through FT.waitTip. */
  confetti(){
    const colors=["#7dd87d","#ffd54f","#4fc3f7","#ff8a5c","#b388ff"];
    for(let i=0;i<24;i++){ const c=document.createElement("div"); c.className="confetti";
      c.style.left=Math.random()*100+"%"; c.style.background=colors[i%colors.length];
      c.style.animationDelay=(Math.random()*0.3)+"s";
      $("app").appendChild(c); setTimeout(()=>c.remove(),1900); }
  },
  all(){ UI.hud(); UI.piece(); UI.hints(); UI.cozy(); UI.visitor(); },
});
/* =================== LAYOUT & INPUT =================== */
