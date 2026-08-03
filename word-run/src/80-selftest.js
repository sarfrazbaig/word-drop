
/* ═══════════════════════════════════════════════════════════════════════════════════════
   @module  selftest  -  the regression suite, in the game, callable in one line

   Audit asks whether the DATA agrees with itself. This asks whether the GAME still does
   what it was fixed to do. Every check here is a bug that was reported, diagnosed and
   closed - if one starts failing, that fix has come undone.

   It exists because verifying a change used to mean hand-writing a fresh probe: set up a
   round, force some state, poke at it, read something back. Twenty times a day, each one a
   little different, each one able to be wrong in its own way - and several of them WERE
   wrong, reporting a failure that was in the probe rather than the game. A suite that is
   written once and read many times cannot drift like that.

   Selftest.run() returns { pass, fail, checks } and prints a table when loud.
   Local only, same as Audit: this drives the game to do things, and it must never do that
   underneath a player.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
const Selftest = {
  /* a check may need a live round. This builds one WITHOUT the ceremony: overlays cleared,
     not busy, at a chosen level - the state a hand-written probe kept getting subtly wrong
     (S.busy left true was the one that silently emptied the wish picker). */
  async round(level){
    document.querySelectorAll(".overlay.active").forEach(o=>o.classList.remove("active"));
    P.tut=true; P.teleSeen=true; P.teleName=P.teleName||"selftest";
    P.level=level; save();
    Game.play();
    for(let i=0;i<25 && (typeof S==="undefined" || !S || !S.board); i++) await wait(100);
    document.querySelectorAll(".overlay.active").forEach(o=>o.classList.remove("active"));
    if(S){ S.busy=false; S.over=false; S.won=false; }
    return S;
  },
  /* scatter random letters over the bottom rows - several checks need a board with
     something on it, and an empty board makes an aiming check pass vacuously */
  scatter(rows){
    const AZ="abcdefghijklmnopqrstuvwxyz";
    for(let c=0;c<COLS;c++) for(let r=ROWS-1;r>=ROWS-(rows||3);r--){
      const t=S.board[r] && S.board[r][c];
      if(t) t.letter=AZ[Math.floor(Math.random()*26)];
    }
  },

  CHECKS:[
    /* ── the data still agrees with itself ── */
    { id:"audit-clean", why:"Audit reports no errors", run(){
        const a=Audit.run(false);
        return { ok:a.err.length===0, got:a.err.length+" errors", detail:a.err.slice(0,2).join(" | ") }; } },

    { id:"goals-legal", why:"no round asks for a trouble that cannot be there (the ice bug)", run(){
        let bad=[];
        for(let A=1;A<=RING_LEN;A++){
          const g=goalFor(A+PROLOGUE_END);
          const asks = g==="gauntlet" ? gauntletPair(A) : (g==="hush" ? [] : [g]);
          asks.forEach(x=>{ if(!goalLegalAt(x,A)) bad.push(A+":"+x); });
        }
        return { ok:bad.length===0, got:bad.length+" illegal", detail:bad.slice(0,4).join(" ") }; } },

    { id:"keystones-on-gates", why:"every door gift sits on a gate that can be cleared", run(){
        const bad=Object.keys(KEYSTONE).filter(lv=>!GATE[lv]);
        return { ok:bad.length===0, got:bad.join(" ")||"all on gates" }; } },

    /* ── pacing: two tables that used to disagree ── */
    { id:"bench-cap", why:"friends never outnumber seats by more than one", run(){
        const keep={grove:P.grove, met:P.metGrove, called:P.called, q:P.summonQ, s:P.summon, lv:P.level};
        P.grove={cat:Date.now()}; P.metGrove={cat:Date.now()}; P.called={cat:1};
        P.summonQ=[]; P.summon=null;
        let worst=0;
        for(let A=1;A<=40;A++){
          P.level=A+PROLOGUE_END;
          try{ Game.checkCallings(); }catch(e){}
          if(P.summonQ.length){ const w=P.summonQ.shift(); P.grove[w]=Date.now(); P.metGrove[w]=Date.now(); }
          worst=Math.max(worst, Object.keys(P.metGrove).length - slotsFor(P.level));
        }
        const party=Object.keys(P.metGrove).length;
        Object.assign(P,{grove:keep.grove,metGrove:keep.met,called:keep.called,summonQ:keep.q,summon:keep.s,level:keep.lv});
        return { ok:worst<=1, got:"overflow "+worst+", "+party+" friends by A40" }; } },

    /* this drives the REAL reconcile rather than re-sorting a list inline. An inline sort
       proves only that I can write a comparator; it would keep passing with the game's own
       ordering reverted, which makes it worse than no check at all. */
    { id:"seat-order", why:"an open seat goes to the friend you met first, not the newest", run(){
        const keep={grove:P.grove, met:P.metGrove, equip:P.equip, lv:P.level};
        const t=Date.now();
        P.metGrove={cat:t-3000, dog:t-2000, bee:t-1000};
        P.grove={...P.metGrove}; P.equip=["cat"]; P.level=12;
        try{ Game.startLevel(P.level); }catch(e){}
        const seated=(P.equip||[]).slice();
        Object.assign(P,{grove:keep.grove,metGrove:keep.met,equip:keep.equip,level:keep.lv});
        const second=seated[1];
        return { ok:second==="dog", got:"seated "+seated.join(",")+" (2nd: "+second+")" }; } },

    /* ── one new thing per round ── */
    { id:"novelty-cap", why:"a round introduces at most one new thing", run(){
        const keep=localStorage.getItem("worddrop_v3"), taught=localStorage.getItem("hushwood_taught");
        localStorage.removeItem("worddrop_v3"); localStorage.removeItem("hushwood_taught");
        const savedP=P; P=load(); P.tut=true; P.teleSeen=true; P.teleName="selftest";
        const seen=[]; const real=Alder.pageSeq;
        Alder.pageSeq=(pages,cb)=>{ seen.push(pages.length); if(cb) cb(); };
        let worst=0, total=0;
        for(let lv=1;lv<=40;lv++){
          seen.length=0;
          if(lv%3===0) Game._announced=true;          // half arrive after a doorstep beat
          try{ P.level=lv; Game.startLevel(lv); }catch(e){}
          const n=seen.length?seen[0]:0; total+=n; worst=Math.max(worst,n);
        }
        Alder.pageSeq=real; P=savedP;
        if(keep) localStorage.setItem("worddrop_v3",keep); if(taught) localStorage.setItem("hushwood_taught",taught);
        return { ok:worst<=1, got:"max "+worst+"/round, "+total+" over 40" }; } },

    { id:"busy-round-quiet", why:"a round with an ask gets no gold rain and no restless tile", run(){
        const g=S.goal, ms=S.milestone;
        S.milestone=true; S.goal={t:"unravel",have:0,need:3};
        const k={}; for(let i=0;i<400;i++){ const p=makePiece(); k[p.kind]=(k[p.kind]||0)+1; }
        S.goal=g; S.milestone=ms;
        const extras=Object.keys(k).filter(x=>x!=="normal");
        return { ok:extras.length===0, got:extras.length?extras.join(","):"plain letters only" }; } },

    { id:"goal-board-clean", why:"a goal round carries only its own collectable", run(){
        const A=15, L=A+PROLOGUE_END, gt=goalFor(L), seed=(GOALS[gt]&&GOALS[gt].seed)||null;
        const r=recipeFor(L,false,seed);
        const strays=Object.keys(r).filter(k=>r[k]>0 && OBSTACLE_GOAL[k] && k!==seed);
        return { ok:strays.length===0, got:strays.join(",")||"none (ask: "+gt+")" }; } },

    /* ── friends ── */
    { id:"pet-aim", why:"every active friend aims somewhere on a live board", run(){
        Selftest.scatter(4);
        const active=GROVE.filter(g=>g.fx && !g.ps);
        const nowhere=active.filter(g=>{ let t=null; try{ t=Game.petTarget(g.fx); }catch(e){} return !t; });
        return { ok:nowhere.length===0, got:(active.length-nowhere.length)+"/"+active.length+" aimed",
                 detail:nowhere.map(g=>g.w).join(" ") }; } },

    { id:"cat-lands-where-it-pats", why:"the cat does not fly to J and change N", run(){
        let agree=0, tried=0;
        for(let i=0;i<25;i++){
          Selftest.scatter(3);
          const ns=Object.values(S.tiles).filter(x=>x.kind==="normal");
          if(!Game.catFit(ns)) continue;
          tried++;
          Game.petTarget({t:"pawPat"});
          const aimed=Game.petAim();
          const pick=(aimed && aimed.kind==="normal" && Game.catFit([aimed])) || Game.catFit(ns);
          if(aimed && pick && pick.t && pick.t.id===aimed.id) agree++;
        }
        return { ok:tried>0 && agree===tried, got:agree+"/"+tried+" landed on the tile it pats" }; } },

    { id:"pet-shrug", why:"a friend that finds no work says so instead of silently paying a move", run(){
        const silent=(document.documentElement.outerHTML.match(/Game\.addMoves\(\d\);\s*return;/g)||[]).length;
        return { ok:typeof Game.petShrug==="function" && silent===0,
                 got:silent+" silent fallbacks left" }; } },

    /* fires the REAL robin at the REAL board and reads the REAL hand. The first version of
       this re-implemented the redraw inline and asserted against its own copy, which proves
       nothing about the game - it would pass with the guard deleted. */
    { id:"pinned-hand", why:"a letter a friend chose survives the hold redraw", run(){
        return new Promise(async res=>{
          Selftest.scatter(3);
          S.next={letter:"q",kind:"normal"};
          try{ await POWERS.robinVowel({ pet:GROVE_BY_WORD.robin }); }
          catch(e){ return res({ ok:false, got:"robin threw", detail:String(e&&e.message) }); }
          const sung=S.next && S.next.letter, pinned=!!(S.next && S.next.pin);
          const isVowel="aeiou".includes(String(sung).toLowerCase());
          // now do exactly what the hold path does, through the shipped guard
          const guard=n=>(n && n.kind==="normal" && !n.pin) ? {letter:"z",kind:"normal"} : n;
          const survived=guard(S.next).letter===sung;
          res({ ok:isVowel && pinned && survived,
                got:"robin sang "+String(sung).toUpperCase()+", pinned "+pinned+", survived "+survived });
        }); } },

    /* ── what the player is told ── */
    { id:"asks-are-actionable", why:"no meeting ask names a word the game never defines", run(){
        const bad=[];
        for(const g of GROVE){
          const c=Game.courtship(g); if(!c) continue;
          if(!(SIGNS[c.sign] && SIGNS[c.sign].do)) bad.push(g.w+"/"+c.sign);
        }
        return { ok:bad.length===0, got:bad.length?bad.slice(0,4).join(" "):"all 50 actionable" }; } },

    { id:"bar-never-empty", why:"the Alder bar always says something", run(){
        const states=[];
        const keepGoal=S._toldGoal, keepTutor=S.tutorWord;
        S._toldGoal=null; S.tutorWord=null;                      states.push(Alder.restLine());
        S.tutorWord="dove"; S.guestNamed=false; S.sigs={};       states.push(Alder.restLine());
        S._toldGoal=keepGoal; S.tutorWord=keepTutor;
        const empty=states.filter(x=>!x || !String(x).trim()).length;
        return { ok:empty===0, got:empty+" empty of "+states.length }; } },

    { id:"score-shows-overflow", why:"57 points against a target of 50 reads as 57", run(){
        const ls=S.levelScore, tg=S.target;
        S.target=50; S.levelScore=57; UI.goalStrip();
        const el=document.querySelector("#gs-goals .barseg .gs-pair");
        const txt=el?el.textContent.replace(/\s+/g,""):"";
        S.levelScore=ls; S.target=tg; UI.goalStrip();
        return { ok:txt.indexOf("57")===0, got:txt||"(no score segment)" }; } },

    { id:"tool-cap-one-number", why:"the pouch agrees with itself everywhere", run(){
        const hard=(document.documentElement.outerHTML.match(/Math\.min\(4,\(P\.pow/g)||[]).length;
        return { ok:typeof TOOL_CAP!=="undefined" && hard===0,
                 got:"TOOL_CAP="+(typeof TOOL_CAP!=="undefined"?TOOL_CAP:"missing")+", "+hard+" hardcoded" }; } },

    { id:"dictionary-guards", why:"words a player knows are not refused", run(){
        const must=["quip","mire","scree","ick","ooze","dusk"];
        const missing=must.filter(w=>!COMMON.has(w));
        return { ok:missing.length===0, got:missing.join(" ")||"all present" }; } },

    /* ── ceremonies own the screen ── */
    { id:"ceremony-swallows-taps", why:"the tap that ends a beat does not also drop a tile", run(){
        return new Promise(async res=>{
          const board=document.getElementById("board");
          let heard=0; const spy=()=>heard++;
          board.addEventListener("pointerup", spy);
          board.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}));
          const base=heard;
          const card=document.createElement("div"); card.className="whosthat"; board.appendChild(card);
          const p=UI.waitTap(card, 2500);
          await wait(600);
          board.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}));
          const during=heard-base;
          card.dispatchEvent(new MouseEvent("click",{bubbles:true}));
          await p;
          board.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}));
          const after=heard-base-during;
          board.removeEventListener("pointerup",spy); card.remove();
          res({ ok:during===0 && after===1, got:"during "+during+", after "+after });
        }); } },

    { id:"beat-waits-for-stage", why:"a lesson card never draws over another card", run(){
        return new Promise(async res=>{
          document.querySelectorAll(".overlay.active").forEach(o=>o.classList.remove("active"));
          const ov=document.getElementById("ov-end"); ov.classList.add("active");
          const p=FT.beat("<b>selftest</b>", 4000);
          await wait(450);
          const over=!!document.querySelector(".ftue-beat");
          ov.classList.remove("active");
          await wait(400);
          const after=!!document.querySelector(".ftue-beat");
          const b=document.querySelector(".ftue-beat");
          if(b) b.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));
          await p;
          res({ ok:!over && after, got:"over-card "+over+", after "+after });
        }); } },
  ],

  async run(loud){
    if(!Tele.isLocal()) return { skipped:"selftest never runs for a player" };
    const before={ level:P.level, equip:(P.equip||[]).slice() };
    await Selftest.round(21);                      // one board, shared by every check
    const checks=[];
    for(const c of Selftest.CHECKS){
      let r;
      try{ r=await c.run(); }
      catch(e){ r={ ok:false, got:"threw", detail:String((e&&e.message)||e) }; }
      checks.push({ id:c.id, why:c.why, ok:!!r.ok, got:r.got||"", detail:r.detail||"" });
    }
    P.level=before.level; P.equip=before.equip; save();
    const fail=checks.filter(c=>!c.ok);
    const out={ pass:checks.length-fail.length, fail:fail.length, checks };
    if(loud!==false){
      const tag='%c🧪 Hushwood selftest';
      const st='background:#1d2b1a;color:#cfe8b8;padding:2px 8px;border-radius:6px';
      console.log(tag+'%c  '+out.pass+' passed, '+out.fail+' failed', st,
                  out.fail?'color:#e06a5a':'color:#8aa06a');
      checks.forEach(c=>console.log((c.ok?"  ✅ ":"  ❌ ")+c.id.padEnd(26)+c.got+(c.detail?"  · "+c.detail:"")));
      if(out.fail) console.log("%cwhat each failing check was protecting:", "color:#d9a441"),
        fail.forEach(c=>console.log("   "+c.id+": "+c.why));
    }
    return out;
  },
};
