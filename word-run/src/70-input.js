/* @module  input  -  pointer handling and fitting the stage to the phone */
function fitBoard(){
  const wrap=$("boardwrap");
  if(!wrap.clientWidth) return;
  const bw=COLS*STEP-GAP, bh=ROWS*STEP-GAP;
  const k=Math.min(1.1, (wrap.clientWidth-4)/bw, (wrap.clientHeight-14)/bh);
  boardEl.style.transform="scale("+k+")";
  boardEl.style.transformOrigin="center center";
}
function fitApp(){
  // FIT THE WIDTH, THEN FILL THE HEIGHT. Scaling to contain 396x800 inside a phone left
  // a band above and below the stage - 396/800 is a wider ratio than 375/812 - and that
  // band was the brown bar. The logical WIDTH stays 396 because FT.scale() derives the
  // tutorial's coordinate space from it; the height simply becomes whatever reaches the
  // bottom of the screen at that scale, and the board takes up the slack.
  const k=Math.min(1, innerWidth/396, innerHeight/800);
  $("app").style.transform="translate(-50%,-50%) scale("+k+")";
}
window.addEventListener("resize", ()=>{ fitApp(); fitBoard(); });
setInterval(fitApp, 900); // some webviews don't fire resize reliably - cheap insurance
function colFromEvent(e){
  const r=boardEl.getBoundingClientRect();
  const x=e.clientX-r.left;
  if(x<0||x>r.width) return -1;
  return Math.max(0,Math.min(COLS-1,Math.floor(x/(r.width/COLS))));
}
/* AIMING IS A HELD STATE, so the carried tile has to know whether the finger is still down.
   A mouse sends pointermove with no button held all the time; a touch only sends it while
   pressed. One flag covers both: the tile rides the pointer only between down and up. */
/* ══════════ ONE GESTURE, AND IT CANNOT BE LOST ══════════
   Reported as finnicky: sometimes the hold works, sometimes it does not. It was not one bug,
   it was four, and every one of them was mine.

   1. THE BROWSER WAS ALLOWED TO STEAL IT. touch-action was "manipulation", which still leaves
      panning to the browser, so a mostly-vertical drag became a scroll candidate and the
      pointer stream simply stopped. Whether it happened depended on the angle of your thumb.
      Fixed on #board with touch-action:none.

   2. LEAVING THE BOARD KILLED IT. pointerleave cleared the aim, so on a mouse any drag that
      strayed past the edge died, and on touch it depended on whether the browser granted
      implicit capture. The pointer is captured explicitly now, so the gesture belongs to the
      board from press to release wherever the finger travels, and pointerleave no longer
      touches the aim at all.

   3. THE LETTER COULD VANISH WITH NOTHING DROPPED. Three early returns in pointerup - no
      state, the lesson-bubble guard, and a tool being armed - left the slot empty AND placed
      nothing, so the letter appeared to be swallowed. That is the one that reads as "the hold
      did not work": it worked, and then threw the letter away. Every exit now either places
      the letter or gives it back, and there is exactly one place that decides which.

   4. A SECOND FINGER COULD HIJACK IT. Any pointer's move or release was treated as the aiming
      one. The gesture now remembers which pointer started it and ignores the rest. */
let aiming=false, aimId=null;
function aimStop(){ aiming=false; aimId=null; UI.carry(false); }

/* ══ ASK THE WOOD ABOUT A TILE ══ hold a finger on any trouble tile for half a second
   (without dragging) and the Field Guide opens with its reading. The timer dies the
   moment the finger travels, so aiming never trips it - and when it DOES fire, the
   matching pointerup is swallowed so no letter drops behind the card. */
let pressT=null, pressX=0, pressY=0;
function pressClear(){ clearTimeout(pressT); pressT=null; }
boardEl.addEventListener("pointerdown", e=>{
  if(!S) return;
  const c=colFromEvent(e); S.hoverCol=c; UI.ghost(c);
  aiming=true; aimId=e.pointerId;
  try{ boardEl.setPointerCapture(e.pointerId); }catch(_){}
  UI.carry(true, e);
  pressClear(); pressX=e.clientX; pressY=e.clientY;
  { const r=boardEl.getBoundingClientRect();
    const row=Math.floor((e.clientY-r.top)/(r.height/ROWS));
    const t=(c>=0 && row>=0 && row<ROWS && S.board[row]) ? S.board[row][c] : null;
    if(t && t.kind && t.kind!=="normal" && !S.usingBreeze && !S.usingPluck){
      const kind=t.kind;
      pressT=setTimeout(()=>{ pressT=null;
        Info._boardAte=true; aimStop(); UI.handBack(); UI.ghost(-1);
        Info.tile(kind); }, 550);
    } }
});
boardEl.addEventListener("pointermove", e=>{
  if(!S) return;
  if(aiming && e.pointerId!==aimId) return;
  if(pressT && (Math.abs(e.clientX-pressX)>8 || Math.abs(e.clientY-pressY)>8)) pressClear();
  const c=colFromEvent(e);
  if(c>=0 && c!==S.hoverCol){ Snd.hover(c); }
  S.hoverCol=c; UI.ghost(c);
  if(aiming) UI.carry(true, e);
});
// only meaningful when NOT aiming: mid-drag the finger is allowed to roam
boardEl.addEventListener("pointerleave", ()=>{ if(!aiming) UI.ghost(-1); });
boardEl.addEventListener("pointercancel", e=>{
  pressClear();
  if(aiming && e.pointerId!==aimId) return;
  aimStop(); UI.handBack(); UI.ghost(-1);      // nothing was placed, so the letter is still yours
});
boardEl.addEventListener("pointerup", e=>{
  pressClear();
  // THE PRESS THAT OPENED THE GUIDE IS NOT A DROP. Its pointerup arrives with the card
  // already on screen; letting it fall through would drop a letter behind the reading.
  if(Info._boardAte){ Info._boardAte=false; UI.handBack(); UI.ghost(-1); return; }
  if(aiming && e.pointerId!==aimId) return;
  const hand = UI.handoff();          // where the letter is, before the held tile is taken away
  aimStop();
  try{ boardEl.releasePointerCapture(e.pointerId); }catch(_){}
  UI.ghost(-1);
  // EVERY WAY OUT OF HERE either places the letter or hands it back. One helper, so a future
  // early return cannot quietly reintroduce a swallowed letter.
  const back=()=>{ UI.handBack(); };
  if(!S) return back();
  // A TAP THAT CLOSED A LESSON BUBBLE IS NOT A TAP ON THE BOARD. The scrim closes on
  // pointerdown, so the matching pointerup arrives here with the scrim already gone and
  // would drop a tile the player never meant to drop.
  if(Date.now() - (FT.lastDismiss||0) < 380) return back();
  if(S.usingBreeze || S.usingPluck){ // a tool is armed: taps pick tiles instead of dropping
    const r=boardEl.getBoundingClientRect();
    const col=Math.max(0,Math.min(COLS-1,Math.floor((e.clientX-r.left)/(r.width/COLS))));
    const row=Math.max(0,Math.min(ROWS-1,Math.floor((e.clientY-r.top)/(r.height/ROWS))));
    if(!S.busy && !S.over && !S.won){ S.usingPluck ? Game.pluckAt(row,col) : Game.breezeAt(row,col); }
    return back();
  }
  const c=colFromEvent(e);
  if(c<0) return back();
  S._fromHand = hand;                 // so the tile falls from your hand, not from the sky
  // drop() hands over S.cur synchronously the moment it commits, before it awaits anything,
  // so an unchanged S.cur straight after the call means it bounced.
  const was=S.cur; Game.drop(c);
  if(S.cur===was) back();
});
document.addEventListener("pointerdown", ()=>Snd.init(), {once:true});

/* (idle tile sparkle removed - playtesters read random shine as "drop your tile HERE".
   only deliberate signals may light a tile: word clears, and pet powers.) */

/* THE STUCK NUDGE IS GONE. It watched for eight seconds of stillness and then ringed
   every winning column in gold - so a player who paused to THINK was answered by being
   shown the answer, which is the one response that guarantees they never work it out.
   Thinking is not being stuck. The board waits as long as you like now. */

/* ============ 📡 PLAYTEST TELEMETRY ============
   Records what each tester DOES and what the game SHOWED them, so a shared link
   turns into data you can read. Every tap carries its game context (screen, open
   card, level, moves) and whether it hit anything - so "nothing happened when I
   tapped" (dead taps) and "I kept mashing" (rage taps) become visible signals.
   Errors, screen changes, and the whole win/fail/wake/purchase/ad funnel flow in too.
   Endpoint-agnostic: paste your collector URL below (see playtest-telemetry-setup.md).
   With no URL it stays LOCAL-only - safe to ship, nothing leaves the device. */
/* ══ THE COLLECTOR IS A TABLE NOW, NOT A SPREADSHEET ══
   Apps Script was the wrong shape for this. It appends rows to a sheet, so a board
   snapshot had to be flattened into columns, the header drifted out of step with what
   was written (the file said seq,event,kind while the cells held runid,seq,event), and
   reading it back meant a human downloading a CSV and pasting it into a chat.
   Postgres takes the event as it is. p, c and b are jsonb, so a board snapshot goes in
   whole and comes back queryable: "every message shown in the run that passed level 15"
   is one request with a filter, not an export.
   The key below is the PUBLISHABLE key. It is designed to sit in client code, and the
   table's policies allow exactly two things through it: insert and select. No update, no
   delete. A tampered client can add noise to the table; it cannot alter or destroy what
   is already there.
   The key rides the QUERY STRING, not a header, because sendBeacon - the only send that
   survives a page being closed - cannot set headers. Measured against the live project:
   header auth and query auth both answer 201. */
const TELE_KEY = "sb_publishable_ir1iGWaLvgfibNH38cQ-hQ_VdGyqBx8";
/* ══ WHY AN RPC AND NOT THE TABLE ══ Posting straight at the table is all-or-nothing:
   measured against this project, a batch holding ONE id that had already landed answers
   409 and every other event in that batch is thrown away with it. PostgREST will forgive
   the duplicate, but only for a Prefer:resolution=ignore-duplicates header - and the
   pagehide beacon, which carries the last events of every session and is the one send we
   can least afford to lose, cannot set headers at all.
   So the duplicate rule moves into the database, where it applies no matter how the row
   arrived. hush_ingest is INSERT ... ON CONFLICT DO NOTHING: a resent batch quietly
   collapses to the events that are actually new, and the retry loop can run as often as
   it likes without ever costing us a row. */
const TELE_URL = TELE_KEY && "https://rcaxrwjxehdmfihuyrvu.supabase.co/rest/v1/rpc/hush_ingest?apikey="+TELE_KEY;
const Tele = {
  buf:[], sid:"", pid:"", seq:0, t0:0, recent:[], scene:"",
  /* ══ WHICH BUILD SAID THIS ══ two fields, both on EVERY batch, because a playtest is
     worthless if you cannot tell which version a complaint came from.
     WAVE is the human one: bump it whenever you want a clean cohort, and the old rows are
     one filter away from gone. It is deliberately hand-set - that is the point.
     VER is stamped by build.js at build time (same stamp the service worker gets), so it
     can never drift the way the hand-typed "hush-2026-07-20" did: that string sat through
     the pet rebuild, the party-row redesign, the painted countries and the whole tutorial
     pass, labelling all of them as one version. */
  wave:"v2",
  ver:"__TELEBUILD__",
  // DEV BUILDS MUST NOT POLLUTE THE PLAYTEST. Only the real deployed site reports -
  // localhost/127.0.0.1/file:// stay silent so testing never lands in the data.
  // (Escape hatch: localStorage.hush_tele_force="1" to send from a local build.)
  /* ══ LOCAL PLAY IS RECORDED, BUT NEVER SENT ══
     The collector holds real players. A developer replaying a level forty times, or an
     agent driving the board from a console, is not a player, and letting that reach the
     table poisons every number computed from it - which is precisely how a set of probe
     rows ended up sitting next to a genuine session.
     So localhost keeps recording, in exactly the row shape Postgres uses, into a local
     ring instead of the network. Same fields, same ids, same board snapshots; it can be
     read back, diffed and analysed identically, and nothing leaves the machine.
     hush_tele_force is gone deliberately: a switch that lets local play reach the live
     table is a switch that will eventually be left on. */
  isLocal(){ const h=location.hostname||"";
    return location.protocol==="file:" || !h || h==="localhost" || h==="127.0.0.1"
      || h==="[::1]" || h==="0.0.0.0" || h.endsWith(".local"); },
  get on(){ return !!TELE_URL || this.isLocal(); },   // local records; only the SINK differs
  LOCAL_KEY:"hush_playlog", LOCAL_CAP:8000,
  /* the local sink. Same rows the RPC would have received, appended and capped. */
  _toLocal(rows){
    try{
      const prev=JSON.parse(localStorage.getItem(this.LOCAL_KEY)||"[]");
      const all=prev.concat(rows);
      localStorage.setItem(this.LOCAL_KEY, JSON.stringify(all.slice(-this.LOCAL_CAP)));
      return true;
    }catch(e){ return false; }
  },
  /* what the playtest reads out. Returns NDJSON - one row per line, the shape the table
     stores - so a run can be written straight to a file and queried the same way. */
  dumpLocal(){
    try{ return JSON.parse(localStorage.getItem(this.LOCAL_KEY)||"[]")
      .map(r=>JSON.stringify(r)).join("\n"); }catch(e){ return ""; }
  },
  clearLocal(){ try{ localStorage.removeItem(this.LOCAL_KEY); }catch(e){} },
  localCount(){ try{ return JSON.parse(localStorage.getItem(this.LOCAL_KEY)||"[]").length; }catch(e){ return 0; } },
  /* the run number, read once and cached. Lives beside hush_pid so a save wipe cannot reach it. */
  loadRun(){
    try{ const r=parseInt(localStorage.getItem("hush_run")||"1",10);
      this.run = (r>0?r:1);
      if(!localStorage.getItem("hush_run")) localStorage.setItem("hush_run",String(this.run));
    }catch(e){ this.run=1; }
    return this.run;
  },
  /* called by every path that clears a save, BEFORE the reload, so the next boot reports the
     new number. The name and the pid deliberately survive: a second run is still their run. */
  newRun(){
    try{ const n=(parseInt(localStorage.getItem("hush_run")||"1",10)||1)+1;
      localStorage.setItem("hush_run",String(n)); this.run=n;
      this.log("run_end",{ run:n-1 });
    }catch(e){}
  },
  boot(){
    this.t0=Date.now();
    this.loadRun();
    this.sid=Math.random().toString(36).slice(2,10)+this.t0.toString(36);
    /* ══ WHO, WHICH RUN, WHICH SESSION - three different questions ══
       pid is the person and survives everything. sid is one page load. Between them sat a
       gap: a playtester told to wipe and start again produced a second run that was
       indistinguishable from the first, interleaved under the same pid and separable only
       by hunting for the wipe_all row and splitting on its timestamp by hand. So "where did
       they start, where did they stop" had no answer for anybody who had restarted, which
       is precisely the group we most wanted to watch.
       run is a counter in localStorage, next to pid, outside the save - so a wipe cannot
       take it - and it goes up by one every time the save is cleared. Group by pid+run and
       every attempt at the game is its own row. */
    try{ this.pid=localStorage.getItem("hush_pid"); if(!this.pid){ this.pid=Math.random().toString(36).slice(2,12); localStorage.setItem("hush_pid",this.pid); } }
    catch(e){ this.pid="anon"; }
    this.log("session_start",{ ua:navigator.userAgent.slice(0,180), lang:navigator.language,
      w:innerWidth, h:innerHeight, dpr:Math.round(devicePixelRatio*100)/100, ref:(document.referrer||"").slice(0,80),
      wave:this.wave, ver:this.ver, run:this.run||1,
      lvl:(typeof P!=="undefined"&&P.level)||1, friends:(typeof P!=="undefined"&&Object.keys(P.grove||{}).length)||0,
      fresh:!(typeof P!=="undefined"&&P.stats&&P.stats.wins) && (typeof P==="undefined"||(P.level||1)<=1),
      returning:!!(typeof P!=="undefined"&&P.stats&&P.stats.wins), who:this.who(), host:location.hostname,
      /* everything that happened to the level BEFORE this line could run: load() and the
         first writes both beat Tele to the boot by a wide margin, and the writes we most
         want are exactly the early ones. sv is the save counter, so a session that opens on
         a lower sv than it closed on is a stale restore rather than a mechanic. */
      sv:(typeof P!=="undefined"&&P.sv)||0,
      loadWarn:(typeof LOAD_WARN!=="undefined"&&LOAD_WARN)||null,
      trail:(typeof LVL_TRAIL!=="undefined"?LVL_TRAIL.slice(-12):[]) });
    document.addEventListener("click", e=>this._tap(e), true);
    window.addEventListener("error", e=>this.log("js_error",{ msg:(e.message||"").slice(0,180),
      src:(e.filename||"").split("/").pop(), line:e.lineno, col:e.colno }));
    window.addEventListener("unhandledrejection", e=>this.log("promise_reject",{ msg:String(e&&e.reason).slice(0,180) }));
    this._watchOverlays();
    this._restore();                 // finish sending whatever the last session could not
    setInterval(()=>this.flush(), 8000);
    document.addEventListener("visibilitychange", ()=>{ if(document.hidden){ this.log("app_hide",{ dt:Date.now()-this.t0 }); this.flush(true); } });
    window.addEventListener("pagehide", ()=>{ this.log("session_end",{ dt:Date.now()-this.t0, seq:this.seq }); this.flush(true); });
  },
  ctx(){
    const sc=(document.querySelector(".scene.active")||{}).id||"";
    const ov=[...document.querySelectorAll(".overlay.active")].map(o=>o.id).join("|");
    let lv=0, mv=null, guide=null, goal=null;
    try{ if(S){ lv=S.level; mv=S.movesLeft; guide=S.guide?S.guide.lesson:null; goal=S.goal?S.goal.t:null; } }catch(e){}
    if(!lv && typeof P!=="undefined") lv=P.level||0;
    const ms = this.t0 ? Date.now()-this.t0 : 0;   // rides the context column the sheet already writes
    /* THE NUMBER ON THE PLAYER'S SCREEN, NEXT TO THE NUMBER IN THE CODE. The five prologue
       rounds are P1-P5 and chapter one restarts the count, so internal 21 is "level 16" to
       whoever is holding the phone. Logging only the internal one meant every level in a
       bug report was five off from the level being reported, and we each did the arithmetic
       in a different direction. Both travel together now. */
    const shown = lv<=PROLOGUE_END ? "P"+lv : String(lv-PROLOGUE_END);
    return { sc, ov, lv, shown, mv, g:guide, goal, ms };
  },
  /* ══ THE BOARD, AS THE PLAYER IS SEEING IT ══
     A log of actions tells you what somebody DID. It cannot tell you whether the thing
     they did was reasonable, because it never says what was in front of them. "Stuck for
     30 seconds at level 5" is unanswerable without the board; with it, the question is
     usually answered on sight.
     Two parallel grids, one row per board row, because they compress well and both are
     readable at a glance in a spreadsheet cell:
       letters  "..CAT.."   the face of each tile, '.' for empty
       kinds    "..nnn.."   what each tile IS - see KINDMAP
     Plus the pieces in hand, the asks, and the counters. About 180 bytes for a full
     board, which is cheaper than the tap stream it replaces. */
  KINDMAP:{ normal:"n", gold:"g", ice:"i", frost:"f", stone:"s", crate:"c", mist:"m",
            bramble:"b", root:"r", reed:"d", mire:"q", spore:"p", pest:"x", shroud:"h",
            branch:"y", scree:"e", current:"u", crystal:"l", wild:"*", bomb:"o",
            rainbow:"w", friend:"F" },
  board(){
    try{
      if(typeof S==="undefined" || !S || !S.board) return null;
      const L=[], K=[], held=[];
      for(let r=0;r<ROWS;r++){
        let lr="", kr="";
        for(let c=0;c<COLS;c++){
          const t=S.board[r] && S.board[r][c];
          if(!t){ lr+="."; kr+="."; continue; }
          lr += (t.letter||"?").toUpperCase();
          kr += (this.KINDMAP[t.kind] || "?");
          if(t.heldWord) held.push(r+","+c);
        }
        L.push(lr); K.push(kr);
      }
      const pc=p=>p ? ((p.letter||"").toUpperCase()+":"+(p.kind||"normal")) : null;
      const o={ letters:L, kinds:K };
      if(held.length) o.held=held;
      o.hand={ cur:pc(S.cur), next:pc(S.next) };
      o.count={ mv:S.movesLeft, score:S.levelScore, target:S.target, drops:S.drops||0 };
      if(S.goal && S.goal.t!=="hush") o.goal={ t:S.goal.t, have:S.goal.have, need:S.goal.need };
      if(S.goal2) o.goal2={ t:S.goal2.t, have:S.goal2.have, need:S.goal2.need };
      if(S.tutorWord) o.meeting=S.tutorWord;
      try{ o.pow={ breeze:P.pow.swap||0, wish:P.pow.wild||0, amber:P.amber||0 }; }catch(e){}
      try{ o.party=UI.equipped().map(g=>g.w); }catch(e){}
      return o;
    }catch(e){ return null; }
  },
  /* ══ WHAT THE GAME SAID, AND ON WHICH SURFACE ══
     Every line the player could have read, tagged with where it appeared, so a session
     can be replayed as a conversation rather than reconstructed from guesses. */
  said(surface, text, extra){
    this.log("said", Object.assign({ on:surface, txt:this.clip(text,180) }, extra||{}));
  },
  /* ══ A VALUE THAT CANNOT BE WRITTEN DOWN MUST NOT COST US THE SESSION ══
     Callers pass whatever describes the moment, and one day one of them passes a DOM node,
     a circular object or a BigInt. JSON.stringify throws on all three, and the throw used
     to land where it could destroy a whole batch. Encoding is now defensive at the source:
     anything that will not survive the trip is replaced by a note saying what it was, so
     the event still arrives and the offender is named rather than hidden. */
  safe(o){
    if(o==null) return {};
    try{ JSON.stringify(o); return o; }catch(e){}
    const out={};
    for(const k in o){
      try{ JSON.stringify(o[k]); out[k]=o[k]; }
      catch(e){ out[k]="[unencodable "+(typeof o[k])+"]"; }
    }
    out._enc="repaired";
    return out;
  },
  log(n, props, kind){
    /* ══ THE SEQUENCE NUMBER IS THE PROOF OF DELIVERY ══ q is handed out here and nowhere
       else, so a gap in it means an event existed and did not arrive - which is exactly
       how the seventeen missing levels announced themselves, as 14→16 and 41→44 in an
       earlier run. That only works if a throw can never consume a number and then vanish.
       If anything below fails, a minimal stand-in carrying the same q is stored instead,
       so the gap becomes a visible, labelled failure rather than an absence. */
    let e;
    try{
      e=this._build(n, props, kind);
    }catch(err){
      e={ t:Date.now(), sid:this.sid, pid:this.pid, run:this.run||1, who:"",
          q:this.seq, n:"log_failed", k:"", c:{},
          p:{ was:String(n), err:String((err&&err.message)||err) } };
      e.id=this.sid+"-"+e.q;
    }
    this.buf.push(e);
    this._persist();
    if(this.buf.length>=25) this.flush();
  },
  _build(n, props, kind){
    const e={ t:Date.now(), sid:this.sid, pid:this.pid, run:this.run||1, who:this.who(),
              q:++this.seq, n, k:kind||"", p:props||{}, c:this.ctx() };
    /* ══ THE BOARD RIDES THE MOMENTS THAT CHANGE IT ══ not every event, or the payload is
       mostly duplicate grids. These are the ones where "what did it look like" is the
       question you will actually ask. */
    if(Tele.SNAP.indexOf(n)>=0){ const b=this.board(); if(b) e.b=b; }
    /* ══ A STABLE ID, SO A RETRY IS NOT A NEW ROW ══ the old sender had none, so every
       resend duplicated rows and there was no way to tell a duplicate from a real repeat.
       id is unique per event; q is monotonic per session, which makes GAPS visible - the
       thing that would have shown last run was truncated instead of complete. */
    e.id = this.sid+"-"+e.q;
    return e;   // storing and sending belong to log(), which guards them
  },
  SNAP:["level_start","level_win","level_fail","word_made","drop","tool_used","held",
        "obstacle_cleared","wake","dead_tap","stall","watchdog","said"],
  _tap(e){
    const hit=e.target.closest("button,[onclick],.tile,.gcard,.menu-item,.shoprow,.charm-btn,.toolbtn,.iconbtn,.chip,a,textarea,input");
    // THE BOARD IS NOT DEAD SPACE. Dropping a letter is handled by a pointerup listener
    // on #board itself - no button, no onclick - so closest() found nothing and the most
    // common action in the whole game was logged as a FAILED tap. Every drop showed up as
    // a dead_tap, and the rage detector fired on ordinary play: the one signal meant to
    // find broken UI was drowning in the sound of the game working perfectly.
    const onBoard = !hit && !!e.target.closest("#board");
    const label=hit? (hit.id||hit.getAttribute("aria-label")||(hit.textContent||"").trim()||"").slice(0,44)
      : (onBoard ? "drop" : "");
    const sel=hit? (hit.tagName.toLowerCase()+(hit.id?"#"+hit.id:"")
      +(typeof hit.className==="string"&&hit.className.trim()?"."+hit.className.trim().split(/\s+/)[0]:""))
      : (onBoard ? "board" : "none");
    const x=Math.round(e.clientX), y=Math.round(e.clientY), dead=!hit && !onBoard;
    this.log("tap",{ sel, label, x, y, dead });
    if(dead) this.log("dead_tap",{ x, y });
    /* THE ONE GESTURE THAT IS SUPPOSED TO BE HAMMERED. Opening the keeper's toolbox is seven
       fast taps on the level chip, which is exactly the shape the rage detector hunts for -
       so every single toolbox open logged two or three rage_taps and quietly poisoned the
       most important frustration signal we have. Seen in the wild: 381-384 in one tester's
       log, three taps on span#lvlcap followed by rage_tap n:3, then the toolbox opening.
       The chip is deliberately excluded, and so is the toolbox itself, where tapping the
       backdrop to dismiss also reads as dead space. */
    const isDebugGesture = !!(e.target.closest("#lvlcap") || e.target.closest("#ov-debug"));
    if(isDebugGesture){ this.recent=[]; return; }
    // rage: 3+ taps within 700ms and ~45px - the classic "why isn't this working" tell
    const now=Date.now();
    this.recent=this.recent.filter(p=>now-p.t<700);
    this.recent.push({x,y,t:now});
    const near=this.recent.filter(p=>Math.abs(p.x-x)<45&&Math.abs(p.y-y)<45);
    if(near.length>=3){ this.log("rage_tap",{ sel, x, y, n:near.length }); this.recent=[]; }
  },
  _watchOverlays(){
    const obs=new MutationObserver(muts=>muts.forEach(m=>{
      const el=m.target;
      if(el.classList&&el.classList.contains("overlay")&&el.classList.contains("active")&&el.dataset._t!=="1"){
        el.dataset._t="1";
        this.log("card_shown",{ id:el.id, txt:this.clip((el.textContent||"").trim().replace(/\s+/g," ")) });
      } else if(el.classList&&el.classList.contains("overlay")&&!el.classList.contains("active")){ el.dataset._t=""; }
    }));
    document.querySelectorAll(".overlay").forEach(o=>obs.observe(o,{attributes:true,attributeFilter:["class"]}));
  },
  async flush(beacon){
    if(!this.buf.length || !this.on) return;
    const batch=this.buf.splice(0, this.buf.length);
    /* ══ ONE EVENT, ONE ROW ══ The sheet wanted an envelope with the session named once
       and the events nested inside it. A table wants each event to stand on its own, so
       every row carries its own sid/pid/who and can be filtered without unpacking anything.
       id is the primary key, and hush_ingest drops the ones it has already seen, so a
       retried batch arrives as only the events that are genuinely new. That is what makes
       the retry in the catch block safe to run as often as it likes.

       ══ AND IT IS BUILT INSIDE A GUARD, BECAUSE THE SPLICE ABOVE ALREADY HAPPENED ══
       This construction used to sit outside every try block, one line after the events had
       been taken OUT of the queue. Anything that threw here - one unserialisable value in
       one props object, one bad timestamp reaching toISOString - destroyed the whole batch
       where it stood: not sent, not retried, and then _persist wrote the now-empty buffer
       over the durable copy, so the disk forgot it too. Silent, total, unrecoverable, and
       indistinguishable afterwards from a player who simply stopped.
       A playtester walked seventeen levels into that hole. Nothing between the splice and
       the retry may be unguarded again. */
    let body;
    try{
      body=JSON.stringify({ rows: batch.map(e=>({
        id:e.id, ts:new Date(e.t||Date.now()).toISOString(),
        sid:e.sid, pid:e.pid, who:e.who, run:e.run||1,
        lv:(e.c&&e.c.lv)||0, seq:e.q, n:e.n, k:e.k||"",
        p:this.safe(e.p), c:this.safe(e.c), b:e.b||null })) });
    }catch(err){
      /* put them back and say so. A batch we cannot encode is a bug in what was logged,
         not a reason to lose the session - the next flush re-tries with the same rows. */
      this.buf.unshift(...batch); this._persist();
      this.encFails=(this.encFails||0)+1;
      try{ console.warn("telemetry could not encode a batch:", err); }catch(e){}
      return;
    }

    /* LOCAL PLAY FORKS HERE, and only here - the rows above are already built, so the
       local log is byte-identical to what the table would have stored. If the write fails
       the batch goes back in the queue exactly as a failed POST would. */
    if(this.isLocal()){
      const rows=JSON.parse(body).rows;
      if(!this._toLocal(rows)){ this.buf.unshift(...batch); this._persist(); }
      return;
    }
    /* ══ A SEND THAT CANNOT FAIL CANNOT BE RETRIED ══
       This used mode:"no-cors", which makes every response opaque: a 404, a 500 and a
       deployment that has been archived all resolve exactly like success. So the catch below
       - which exists precisely to put the events back - could only ever fire on a total
       network outage, and never on a broken collector. When the Apps Script deployment was
       archived, every batch was posted into nothing, dropped, and the retry never ran. That
       playtest data is simply gone.
       Apps Script answers with permissive CORS headers, so no-cors bought nothing. Measured
       from a browser: mode:"cors" returns type:"cors", status 200, body "ok". Now a bad
       status is an exception, and an exception puts the events back in the queue.
       sendBeacon reports only whether the browser accepted the payload for delivery, which
       is the most it can tell us on a page that is closing - but that is better than the
       nothing we were reading before. */
    try{
      if(beacon && navigator.sendBeacon){
        /* PostgREST reads the body as JSON only if the Blob says so. A beacon cannot set
           headers, so the type on the Blob is the only place left to say it - send it as
           text/plain and the insert is rejected on a page that is already gone. */
        const blob=new Blob([body],{type:"application/json"});
        if(!navigator.sendBeacon(TELE_URL, blob)) { this.buf.unshift(...batch); this._persist(); }
        return;
      }
      const res = await fetch(TELE_URL,{ method:"POST", keepalive:true,
        headers:{"Content-Type":"application/json"}, body });
      if(!res.ok) throw new Error("collector answered "+res.status);
      this._persist();                      // sent - shrink the durable copy too
    }catch(e){
      /* ══ NEVER DROP THE OLDEST, AND NEVER DROP SILENTLY ══
         This used to splice from the FRONT once the queue passed 600 - discarding the
         earliest events and keeping the newest. A run that hit a bad patch came back
         looking like a complete, shorter session: unbroken, believable and wrong. That
         is how a level-20 run was filed as a clean level-9 run.
         Now the head is sacred. Overflow sheds the least informative events from the
         MIDDLE, and leaves a data_loss marker so the gap is visible in the data instead
         of pretending to be the end of the session. */
      this.buf.unshift(...batch);
      const CAP=1200;
      if(this.buf.length > CAP){
        const keep=n=>["session_start","level_start","level_win","level_fail","wake",
                       "said","error","watchdog","data_loss",
                       "level_set","save_failed"].indexOf(n)>=0;   // the progress-loss trail is never shed
        const before=this.buf.length;
        let i=1;
        while(this.buf.length>CAP && i<this.buf.length-1){
          if(!keep(this.buf[i].n)) this.buf.splice(i,1); else i++;
        }
        if(this.buf.length>CAP) this.buf.splice(1, this.buf.length-CAP);   // last resort
        const lost=before-this.buf.length;
        if(lost) this.buf.splice(1,0,{ t:Date.now(), sid:this.sid, pid:this.pid,
          run:this.run||1, who:this.who(), q:++this.seq, n:"data_loss", k:"",
          p:{ dropped:lost, reason:"queue over "+CAP+" - collector unreachable" },
          c:this.ctx(), id:this.sid+"-loss-"+this.seq });
      }
      this._persist();
    }
  },
  /* ══ THE QUEUE SURVIVES THE APP CLOSING ══ it lived only in memory, so a reload, a
     crash, or swiping the tab away took every unsent event with it. It is mirrored to
     localStorage on every log and re-loaded at boot, so the next launch finishes the
     last session's sending. */
  _persist(){
    try{ localStorage.setItem("hush_tq", JSON.stringify(this.buf.slice(-1200))); }catch(e){}
  },
  _restore(){
    try{
      const q=JSON.parse(localStorage.getItem("hush_tq")||"[]");
      if(q.length){ this.buf.unshift(...q); this.log("resumed_queue",{ n:q.length }); }
    }catch(e){}
  },
  /* A NAME IS NOT OPTIONAL HERE. These testers are all friends of the owner, and feedback
     that cannot be traced to a person is feedback nobody can follow up on - "somebody got
     stuck at level 9" is a fact you can do nothing with. The button was an inline handler
     that dismissed the card whatever the field held, so the easy path was to skip it. It
     asks, and it waits. Nothing else can dismiss this card: no ✕, no backdrop handler. */
  okNotice(){
    const el=$("tele-name"), n=(el.value||"").trim();
    if(!n){
      el.classList.remove("nag"); void el.offsetWidth; el.classList.add("nag");
      $("tele-nag").classList.add("on");
      try{ el.focus(); }catch(e){}
      Snd.reject(); buzz(30);
      return;
    }
    Tele.setName(n);
    P.teleSeen=true; save();
    Tele.log("tele_ok",{ named:true });
    $("ov-tele").classList.remove("active");
  },
  setName(n){   // whose notes are these? stored on their device, sent with every batch
    n=(n||"").trim().slice(0,24);
    if(!n) return;
    try{ P.teleName=n; save(); }catch(e){}
    this.log("tester_named",{ name:n });
    this.flush();
  },
  who(){ try{ return (P&&P.teleName)||""; }catch(e){ return ""; } },
  /* NEVER CUT AN EMOJI IN HALF. slice() counts UTF-16 code units, and every emoji in the
     game is two of them, so a card whose 90th unit lands mid-character shipped a lone
     surrogate into the log - a half-character with no partner, which is not text any more.
     Seen in the wild as a row ending "�". Drop the orphan. */
  clip(v, n){
    let t=String(v==null?"":v).slice(0, n||90);
    if(/[�-�]$/.test(t)) t=t.slice(0,-1);
    return t;
  },
  status(){ return (this.on?"📡 sending to your collector":(this.isLocal()?"🛠️ dev build - not sending":"📴 local-only (no URL set)"))
    +"\nplaying as: "+(this.who()||"(no name given)")
    +"\nplayer "+this.pid+" · run "+(this.run||1)+" · session "+this.sid
    +"\n"+this.seq+" events · "+this.buf.length+" waiting"; },
};

