/* ============ 🔎 THE AUDIT - the type checker we do not have yet ============
   @module  audit

   Everything in here is a question a compiler would answer for free, asked at boot
   instead. It exists because this file has grown past the size where reading it tells
   you the truth: twice in one afternoon a careful grep over these 9,700 lines produced
   a confident WRONG answer about which signs the game fires, and a wrong answer is far
   more expensive than no answer. Regexes see text. This sees the objects.

   Every check is something that fails SILENTLY today. A friend waiting on a sign nobody
   fires simply never acts, and looks like a balance problem. A creature whose name is
   not in the dictionary can never be spelled, so it can never be met, and looks like bad
   luck. None of these throw. That is exactly why they need a nagger.

   Runs by itself on localhost and file:// only - a player must never see this - and can
   be called from the console anywhere as Hush.audit(). When the codebase moves to
   TypeScript, most of this becomes types and can be deleted; the LAW check and the
   dictionary check stay, because no type system knows how often a sign fires or whether
   a word is spellable. */
const Audit = {
  run(loud){
    const err=[], warn=[], note=[];
    const isCreature = w => !!GROVE_BY_WORD[w];

    /* ── the registry itself ── */
    for(const [k,v] of Object.entries(SIGNS)){
      ["freq","order","title","noun"].forEach(f=>{
        if(v[f]===undefined) err.push('SIGNS.'+k+' has no '+f);
      });
    }

    /* ── WHERE EVERYONE LIVES ──
       The map is the pacing mechanism, so a friend with no home can never be met and a
       country with the wrong count silently rewrites the curve. Both are invisible in play
       and obvious here. Keystones are exempt: they are given at doors, not found. */
    {
      const keyed = new Set(Object.values(typeof KEYSTONE!=="undefined" ? KEYSTONE : {}));
      const perCountry = HOME_CURVE.map(()=>0);
      const starters = ["cat","dog"];
      GROVE.forEach(g=>{
        if(keyed.has(g.w)) {
          if(HOME[g.w]) warn.push('🗺️ '+g.w+' is a keystone AND has a home - it would arrive twice');
          return;
        }
        const h = HOME[g.w];
        if(!h){ err.push('🗺️ '+g.w+' lives nowhere - it can never be met'); return; }
        const [c,d] = h;
        if(!(c>=0 && c<HOME_CURVE.length)) err.push('🗺️ '+g.w+' lives in country '+c+', which is not on the map');
        else if(!starters.includes(g.w)) perCountry[c]++;
        if(!(d>=0 && d<BIOME_LEN)) err.push('🗺️ '+g.w+' starts listening at depth '+d+', outside its country');
      });
      perCountry.forEach((n,c)=>{
        if(n!==HOME_CURVE[c])
          err.push('🗺️ '+(BIOME_NAMES[c]||('country '+c))+' holds '+n+' friends, the curve says '+HOME_CURVE[c]);
      });
      const homed = Object.keys(HOME).length;
      if(homed + keyed.size !== GROVE.length)
        err.push('🗺️ '+homed+' homed + '+keyed.size+' keystones = '+(homed+keyed.size)+', but there are '+GROVE.length+' friends');
    }

    /* ── every friend ── */
    const seen=new Set();
    GROVE.forEach(g=>{
      const at='🐾 '+g.w+': ';
      if(seen.has(g.w)) err.push(at+'two friends share this name');
      seen.add(g.w);
      ["e","z","pn","pi","pd","f","fx"].forEach(f=>{
        if(g[f]===undefined || g[f]==="") err.push(at+'no '+f);
      });
      if(g.z!=="sky" && g.z!=="ground") err.push(at+'lives in "'+g.z+'", which is neither sky nor ground');
      if(g.fx && !g.fx.t) err.push(at+'fx has no t');

      // A NAME YOU CANNOT SPELL IS A FRIEND YOU CANNOT MEET. The whole game is spelling
      // these fifty words; one missing from the dictionary is a creature sealed out of
      // its own game, and nothing anywhere would ever say so.
      if(typeof COMMON!=="undefined" && !COMMON.has(g.w))
        err.push(at+'its name is not in the dictionary, so it can never be spelled');

      if(!g.ps && !g.wake) err.push(at+'is not passive and waits for nothing, so it can never act');
      // A PASSIVE'S wake IS DEAD DATA, not a bug. petActives() is equipped().filter(g=>!g.ps),
      // so sees() never counts for them, and every card and Book path tests g.ps before it
      // looks at the sign. It reads like a trigger and is inert, which is the kind of thing
      // that wastes an afternoon later - worth saying once, not worth shouting about.
      if(g.ps && g.wake) note.push(at+'is passive, so its wake on "'+g.wake.on+'" is never counted');

      if(g.wake){
        if(!SIGNS[g.wake.on]) err.push(at+'waits for "'+g.wake.on+'", which is not a sign');
        else if(!g.ps){
          /* judged on the DESIGNED count, not the tier-adjusted one. wakeNeed() divides by
             tierMul, so running this against a level-60 save made five friends look broken
             that are fine at the tier they were balanced for - a boot check whose answer
             depends on the save file is a check nobody will trust. (That tiering really
             does push some friends to ~9 stirs a round at the top end is a live design
             question, but it is a question about tiering, not about these numbers.) */
          const need = g.wake.n;
          const per  = SIGNS[g.wake.on].freq / (need||1);   // times it should stir per round
          // THE LAW, checked rather than trusted. A friend that stirs six times a round is
          // not a friend, it is the weather; one that stirs every third round was never
          // worth a seat. Both are invisible until someone plays fifty rounds.
          if(per > 5)    warn.push(at+'stirs about '+per.toFixed(1)+'x a round - far too often for a seat to be a choice');
          if(per < 0.35) warn.push(at+'stirs about once every '+(1/per).toFixed(1)+' rounds - too rare to feel owned');
        }
      }
    });

    /* ── does anyone listen? ── */
    const listened={};
    GROVE.forEach(g=>{ if(g.wake) listened[g.wake.on]=(listened[g.wake.on]||0)+1; });
    Object.keys(SIGNS).forEach(k=>{
      if(k==="passive") return;
      if(!listened[k]) note.push('🔕 nothing listens for "'+k+'" - a sign the wood fires into an empty room');
    });

    /* ── the tables that point at friends ──
       GATE is NOT one of them, which the first version of this audit got wrong and said so
       thirty times: it is keyed by level and holds the shape of a round (moves, seats,
       door), and the only creature in it is the optional friend a gate bars. */
    const pointsAt = (obj,label,pick) => {
      if(typeof obj==="undefined" || !obj) return;
      Object.entries(obj).forEach(([k,v])=>{
        const w = pick ? pick(k,v) : k;
        if(w && !isCreature(w)) err.push(label+' names "'+w+'", which is not a friend');
      });
    };
    pointsAt(typeof CALLINGS!=="undefined"&&CALLINGS, "CALLINGS");
    pointsAt(typeof KEYSTONE!=="undefined"&&KEYSTONE, "KEYSTONE", (k,v)=>v);
    // a gate that bars a friend who does not exist bars nobody, and silently
    if(typeof GATE!=="undefined" && GATE) Object.entries(GATE).forEach(([lv,g])=>{
      if(g && g.bars && !isCreature(g.bars)) err.push('GATE '+lv+' bars "'+g.bars+'", which is not a friend');
    });

    /* ── every power has somewhere to go ── */
    if(typeof POWERS!=="undefined"){
      const handled=new Set(Object.keys(POWERS));
      GROVE.forEach(g=>{ if(g.fx && g.fx.t && !g.ps && !handled.has(g.fx.t))
        err.push('🐾 '+g.w+': its power "'+g.fx.t+'" has no handler in POWERS'); });
      const used=new Set(GROVE.filter(g=>g.fx).map(g=>g.fx.t));
      handled.forEach(k=>{ if(!used.has(k)) note.push('🧹 POWERS.'+k+' is not used by any friend'); });
      /* THE SECOND TABLE KEYED ON fx.t. Game.petTarget() is its own switch deciding which
         tile a friend flies to before it works, so a power added to POWERS and forgotten
         there sends the creature to the middle of the board to do something at the edge.
         Nothing enforces the pairing, so say plainly which powers have no aimed target. */
      /* ONLY MEANINGFUL WITH A BOARD IN FRONT OF IT. The first version ran at boot, where
         S is null, so petTarget returned null for everything and it reported all 39 active
         friends as broken - a check that cries wolf is worse than no check, because the one
         time it is right nobody reads it. Aiming is a property of THIS board, not of the
         data, so it only speaks mid-round and says so. */
      if(Game.petTarget && S && S.board && Object.keys(S.tiles||{}).length){
        const aimless=[];
        GROVE.filter(g=>g.fx && !g.ps).forEach(g=>{
          let t=null; try{ t=Game.petTarget(g.fx); }catch(e){}
          if(t===null || t===undefined) aimless.push(g.w+"/"+g.fx.t);
        });
        if(aimless.length) note.push('🎯 on THIS board petTarget aims nowhere for '+aimless.length+' powers, so they would play at the centre: '+aimless.join(", "));
      }
    }

    /* ══════════════════════════════════════════════════════════════════════════════
       THE DRIFT CHECKS. Everything above asks "is this table complete?". These ask the
       question that actually broke the game: "do two tables that describe the SAME rule
       still agree?" A tester met ice in the First Clearing - 247 levels and 13 countries
       before the habitat table says ice can exist - because the obstacle schedule and the
       goal schedule were authored separately and nothing ever compared them. Neither was
       wrong on its own, which is exactly why nothing caught it.
       ══════════════════════════════════════════════════════════════════════════════ */

    /* ── 1. NO ROUND MAY ASK FOR A TROUBLE THAT CANNOT BE HERE ──
       seedGoal writes t.kind straight onto a tile with no debut or habitat check, while
       the random spread gates itself properly. One rule, two enforcers, one asleep. */
    if(typeof goalFor==="function" && typeof GOALS!=="undefined" && typeof TROUBLE!=="undefined"){
      const bad={};   // collapse a whole schedule into one line per goal, not 40 lines
      for(let A=1; A<=RING_LEN; A++){
        const L=A+PROLOGUE_END;                       // goalFor takes the raw counter
        const names=[];
        try{
          const g=goalFor(L);
          if(g==="gauntlet"){ gauntletPair(A).forEach(x=>names.push(x)); }   // ask the trial itself
          else if(g) names.push(g);
        }catch(e){ continue; }
        const biome=Math.floor((A-1)/BIOME_LEN);
        for(const gt of names){
          const G=GOALS[gt]; if(!G||!G.seed) continue;
          const tr=TROUBLE[G.seed]; if(!tr) continue;   // gold and wild are not troubles
          const early = A <= tr.at;
          const away  = tr.homes && !tr.homes.some(([lo,hi])=>biome>=lo && biome<=hi);
          if(early||away){
            const k=gt+"|"+G.seed;
            (bad[k]=bad[k]||{n:0,first:A,seed:G.seed,gt:gt,at:tr.at,homes:tr.homes,biome:biome}).n++;
          }
        }
      }
      Object.values(bad).forEach(b=>{
        err.push('🧊 "'+b.gt+'" seeds '+b.seed+' on '+b.n+' level'+(b.n>1?'s':'')
          +', first at A'+b.first+' (country '+b.biome+') - but '+b.seed
          +' debuts at A'+b.at+' in countries '+JSON.stringify(b.homes));
      });
    }

    /* ── 2. A VALVE THAT CANNOT OPEN IS NOT A VALVE ──
       Courtship is sold to the player as "do what it loves and it comes early". If a
       friend's guaranteed floor is BELOW its courtship minimum, the guarantee always wins
       and the hunt can never once pay out. Ten friends were in that state. */
    if(typeof FLOOR_AT!=="undefined" && typeof CALL_MINL!=="undefined"){
      const dead=[];
      for(const w in FLOOR_AT){
        const floor=FLOOR_AT[w], min=CALL_MINL[w];
        if(min!=null && floor<=min) dead.push(w+' (floor A'+floor+' vs calling A'+min+')');
      }
      if(dead.length) warn.push('🎣 courtship can never fire for '+dead.length+' friend'
        +(dead.length>1?'s':'')+' - the floor arrives first every time: '+dead.join(', '));
    }

    /* ── 3. A GIFT AT A DOOR NEEDS A DOOR ── keystones are handed over for clearing a
       gate, so a keystone on a level with no gate is a friend nobody can ever be given. */
    if(typeof KEYSTONE!=="undefined" && typeof GATE!=="undefined")
      Object.keys(KEYSTONE).forEach(lv=>{
        if(!GATE[lv]) err.push('🗝️ '+KEYSTONE[lv]+' is given at A'+lv+', which has no gate to clear');
      });

    /* ── 4. A COUNTRY MUST NOT HOLD MORE FRIENDS THAN IT HAS CHAIRS ──
       This is the pet bombardment as arithmetic rather than as a feeling: seven friends
       live in the First Clearing and it never offers more than four seats, so three of
       them arrive with nowhere to sit. Counted WITH the starters, unlike HOME_CURVE
       above, because a chair does not care that the cat was free. */
    if(typeof seatsByLevel==="function" && typeof HOME!=="undefined"){
      const per={};
      for(const w in HOME) per[HOME[w][0]]=(per[HOME[w][0]]||0)+1;
      Object.keys(per).forEach(c=>{
        const last=(Number(c)+1)*BIOME_LEN;              // chairs by the end of that country
        const chairs=seatsByLevel(last+PROLOGUE_END);
        if(per[c]>chairs) warn.push('🪑 '+(BIOME_NAMES[c]||('country '+c))+' homes '+per[c]
          +' friends but offers '+chairs+' seat'+(chairs>1?'s':'')+' by its end');
      });
    }

    const out={ err, warn, note, ok: !err.length };
    if(loud!==false){
      const tag='%c🔎 Hushwood audit';
      const style='background:#2f2416;color:#ffd9a8;padding:2px 8px;border-radius:6px';
      if(err.length)  { console.groupCollapsed(tag+'%c  '+err.length+' broken', style, 'color:#e06a5a'); err.forEach(m=>console.log('  '+m)); console.groupEnd(); }
      if(warn.length) { console.groupCollapsed(tag+'%c  '+warn.length+' suspect', style, 'color:#d9a441'); warn.forEach(m=>console.log('  '+m)); console.groupEnd(); }
      if(note.length) { console.groupCollapsed(tag+'%c  '+note.length+' worth knowing', style, 'color:#8aa06a'); note.forEach(m=>console.log('  '+m)); console.groupEnd(); }
      if(out.ok && !warn.length) console.log(tag+'%c  all clear - '+GROVE.length+' friends, '+Object.keys(SIGNS).length+' signs', style, 'color:#8aa06a');
    }
    return out;
  },
};

/* boot */
fitApp();
UI.home();
Game.watchdog();
document.querySelectorAll(".soundbtn").forEach(el=>el.textContent = P.sound?"🔊":"🔇");
{ const st=document.getElementById("menu-snd-state"); if(st) st.textContent=P.sound?"on":"off"; }
Snd.on = P.sound;
/* ============ 🌰 THE CONSOLE HANDLE ============
   One name to reach everything from devtools, because hunting for which of nine hundred
   script-scope consts holds the thing you want is not debugging, it is archaeology.
   S and P are getters on purpose: S is replaced wholesale at the start of every round and
   P is replaced by a restore, so anything that captured them by value would be quietly
   inspecting last round's game. */
window.Hush = {
  get S(){ return S; }, get P(){ return P; },
  Game, UI, Snd, Tele, Audit, GROVE, GROVE_BY_WORD, SIGNS, SIGN_ORDER,
  get POWERS(){ return typeof POWERS!=="undefined" ? POWERS : null; },
  audit: loud => Audit.run(loud),
  /* who is on duty and how close each one is to stirring - the single question I ask
     most often and used to answer by hand out of two different objects */
  duty(){ return UI.equipped().map(g=>({ friend:g.w, power:g.pn,
    sign:g.wake?g.wake.on:"passive",
    at:(S&&S.wake&&S.wake[g.w])||0, needs:g.wake?(Game.wakeNeed?Game.wakeNeed(g):g.wake.n):"-" })); },
};
// the loose globals stay: the ux/tools harnesses drive the game through them over CDP,
// and the handbook's console recipes are written against them
window.S = ()=>S; window.Game=Game; window.UI=UI; window.Snd=Snd; window.P=P; window.Tele=Tele;
// dev machines only - a player must never see the audit, and never pay for it either
/* ══ THE AUDIT RUNS EVERYWHERE NOW, NOT JUST ON MY MACHINE ══
   It used to run on localhost only, so its findings existed exactly where nobody was
   playing. The drift checks it just grew - a goal seeding an obstacle that cannot be in
   this country, a courtship valve the floor always beats - describe things a PLAYER meets,
   so the report has to travel with the player. Loud in console when local, one telemetry
   row when not: a build that ships disagreeing with itself says so in the data on its
   first boot, instead of waiting for someone to notice ice in the First Clearing. */
setTimeout(()=>{
  try{
    const local=Tele.isLocal();
    const r=Audit.run(local);
    if(!local && (r.err.length || r.warn.length))
      Tele.log("audit", { ok:r.ok, nerr:r.err.length, nwarn:r.warn.length,
                          err:r.err.slice(0,12), warn:r.warn.slice(0,8) });
  }catch(e){
    console.warn("audit fell over:",e);
    try{ Tele.log("audit_crashed",{ err:String((e&&e.message)||e) }); }catch(_){}
  }
}, 0);
Tele.boot();
Alder._watch();   // the stage manager's eyes: grace preemption + the quiet-window ticker
Info.wireTools(); // hold the breeze or the wish half a second to read it in the Field Guide
Game._sink = (n,p)=>Tele.log(n,p,"funnel");   // level_start/win/fail, wake, purchase*, ad*, shop_open
/* ══ EVERY WORD THE PLAYER COULD HAVE READ, AND WHERE IT APPEARED ══
   Wrapped at the surface rather than the call site, so a line added anywhere in the game
   is captured without anybody remembering to log it. `on` names the surface, which is
   what turns a list of strings back into a session you can read in order:
     bar    - Alder's bar, the running commentary
     window - his blocking card
     note   - a live tutorial instruction
     beat   - a tutorial card that waits for a tap
     toast  - the transient banner
   Paired with the board snapshot each one carries, this answers "what was on screen when
   they got stuck" without guessing. */
const _plain=h=>Tele.clip(String(h||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),180);
{ const _sc=UI.scene.bind(UI); UI.scene=(id)=>{ if(id!==Tele.scene){ Tele.log("nav",{to:id}); Tele.scene=id; } return _sc(id); }; }
{ const _ts=UI.toast.bind(UI); UI.toast=(m,h)=>{ Tele.said("toast",_plain(m),{hold:h||""}); return _ts(m,h); }; }
{ const _nt=FT.note.bind(FT); FT.note=(h)=>{ Tele.said("note",_plain(h)); return _nt(h); }; }
{ const _bt=FT.beat.bind(FT); FT.beat=(h,ms)=>{ Tele.said("beat",_plain(h)); return _bt(h,ms); }; }
{ const _sh=Alder._show.bind(Alder);
  Alder._show=(item)=>{ const r=_sh(item);
    try{ const t=document.querySelector("#alder .atxt");
      Tele.said("bar", _plain(t&&t.innerHTML), { key:item&&item.key, pri:item&&item.pri,
        windowed: !!(item&&item._full) }); }catch(e){}
    return r; }; }
{ const _ps=Alder._pageShow.bind(Alder);
  Alder._pageShow=(s,g,b,cb)=>{ Tele.said("window", _plain(s)+(g?" | "+_plain(g):"")); return _ps(s,g,b,cb); }; }
// a one-time, honest notice - testers should know their taps are recorded
if(Tele.on && !P.teleSeen){ setTimeout(()=>{ const o=$("ov-tele"); if(o){ o.classList.add("active"); } }, 600); }
// installable + offline: register the service worker (silent, non-blocking)
if("serviceWorker" in navigator){ window.addEventListener("load", ()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); }); }