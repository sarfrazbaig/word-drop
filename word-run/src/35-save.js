/* @module  save  -  P, localStorage, migration between save versions */
let S = null;
function load(){
  const defaults = {level:1, sound:true, streak:0, lastDay:0, dailyWordDay:-1, grove:{}, bestWord:"", finale:0,
    pow:{wild:0,bomb:0,oracle:0,transmute:0,swap:0}, seenUnlock:{},
    stats:{wins:0, words:0, bestChain:1, stars:0},
    questDay:-1, questProgress:0, questDone:false, powProg:{}, coach:false, tut:false, petBond:0, seenTip:{}, seenChapter:{}, grove:{}, metGrove:{}, equip:[], run:null,
    graceUsed:null };   // which free save has been taken, and on which level
  try{
    let p = JSON.parse(localStorage.getItem("worddrop_v3"));
    if(!p){ // fresh brand: keep the grove & habits worth carrying, but relearn the powers
      const v2 = JSON.parse(localStorage.getItem("worddrop_v2")||"null");
      if(v2){ p = { sound:v2.sound, streak:v2.streak, lastDay:v2.lastDay, dailyWordDay:v2.dailyWordDay,
        grove:v2.grove, bestWord:v2.bestWord, tut:v2.tut,
        stats:v2.stats }; }
    }
    const out = Object.assign({}, defaults, p||{});
    out.seenUnlock = out.seenUnlock||{};
    out.seenTip = out.seenTip||{}; out.seenChapter = out.seenChapter||{};
    // A LIFE-COUNTED TALLY THAT DID NOT EXIST YESTERDAY. The fox counts every point you
    // have ever scored, and a tester at level thirty has scored thousands with no counter
    // running. Seed the ledger from the levels they have actually cleared - the sum of
    // those targets is the least they can possibly have scored - so a life-counted meter
    // does not open at nothing for the people who have played the most.
    out.tally = out.tally||{};
    if(out.tally.score==null){
      let est=0; for(let l=1;l<(out.level||1);l++) est+=TARGET(l);
      out.tally.score=est;
    }
    out.metGrove = out.metGrove||{};
    out.said = out.said||{};
    out.groveMile = out.groveMile||{};
    out.tally = out.tally||{};        // calling progress counters (stones cracked, words held…)
    out.called = out.called||{};      // creatures whose calling is met - their name can wake
    out.summonQ = out.summonQ||[];    // callings met, waiting for their naming level
    out.summon = out.summon||null;    // the creature whose naming level is running/next
    out.quietLvls = out.quietLvls||0; // levels since the last call/wake - pity at 3
    out.annQ = out.annQ||[];          // achievement announcements, shown in the WIN sequence only
    out.amber = out.amber||0;         // 🟠 amber drops - cheap, cheerful, never power
    out.callBase = out.callBase||{};  // per-creature meter baselines (windowed callings)
    out.nameFails = out.nameFails||{}; // ceremony letdowns per creature - the mercy counter
    out.purchases = out.purchases||{}; // once-items owned (receipts belong to the store layer)
    out.giftDay = out.giftDay||0;      // the wood's daily chest - one opening a day
    out.teleSeen = out.teleSeen||false; // the playtest notice has been shown
    out.teleName = out.teleName||"";     // whose playtest notes these are (they typed it)
    // players who already have friends predate the callings - their friends' callings
    // count as met, so nothing they own ever reads as un-earned
    Object.keys(out.grove).forEach(w=>{ out.called[w]=1; });
    // MIGRATION: some creatures were renamed in updates (wasp→beetle, toad→chick,
    // mole→pig, newt→goat) - carry the friendship over. Anything unknown is gently
    // released: one orphaned word in an old save froze every level start.
    const RENAMED={wasp:"golem",toad:"chick",mole:"pig",newt:"goat"};
    const remap=o=>{ const m={}; for(const w in (o||{})){ const nw=RENAMED[w]||w;
      if(GROVE_BY_WORD[nw] && !m[nw]) m[nw]=o[w]; } return m; };
    out.grove = remap(out.grove);
    out.metGrove = remap(out.metGrove);
    out.equip = (out.equip||[]).map(w=>RENAMED[w]||w).filter((w,i,a)=>GROVE_BY_WORD[w] && a.indexOf(w)===i);
    out.stats = Object.assign({}, defaults.stats, out.stats||{});
    out.pow = Object.assign({}, defaults.pow, out.pow||{});
    out.powProg = out.powProg||{};
    out.grove = out.grove||{};
    /* ══ AND REPAIR THE ONES ALREADY STRANDED ══ every save written before the door learned
       to write both halves holds a keystone that exists but was never met - present in the
       count, absent from the Book, impossible to equip. Nothing else can rescue it: the door
       has been walked and will not be walked again. Idempotent. */
    try{
      const keyed=new Set(Object.values(typeof KEYSTONE!=="undefined"?KEYSTONE:{}));
      let fixed=0;
      for(const w in out.grove){ if(keyed.has(w) && !out.metGrove[w]){ out.metGrove[w]=out.grove[w]||Date.now(); fixed++; } }
      if(fixed) LOAD_REPAIR={ keystonesMet:fixed };
    }catch(e){}
    /* ══ IS THIS THE SAVE WE LAST WROTE, OR AN OLDER ONE? ══ save() mirrors its write
       counter and level into a second key. Two keys cannot plausibly go stale together, so
       a main blob that comes back BEHIND the mirror is a stale read - the exact failure
       that would hand a player back a life they had already spent. Recorded rather than
       repaired: if it fires we will know it is real before deciding what to do about it. */
    try{
      const m=localStorage.getItem("worddrop_sv");
      if(m){ const [msv,mlv]=m.split(":").map(Number);
        if((out.sv||0) < msv || (out.level||0) < mlv)
          LOAD_WARN={ sv:out.sv||0, lv:out.level||0, mirrorSv:msv, mirrorLv:mlv,
                      lost:mlv-(out.level||0) }; }
    }catch(e){}
    return out;
  }catch(e){ LOAD_WARN={ err:String((e&&e.message)||e), fellBackToDefaults:true }; return defaults; }
}
let LOAD_WARN=null;
let LOAD_REPAIR=null;
let P = load();

/* ══ EVERY WRITE TO P.level, NAMED AND DATED ══
   A tester cleared the door at adventure 20 and was put back at 15. The win path only ever
   does P.level++, and the single backwards write in this file is the gate push-back, which
   is capped at three and fires only on a FAIL - so neither of them can produce what was
   seen. An older export has a jump of twenty-nine levels, which no mechanic here produces
   at all. That rules out the code I can find and points at the code I cannot: something
   writing this field that I have not thought of, or a save that never landed.
   So this is deliberately NOT a helper that the known writers call. It is an accessor on
   the field itself, which catches every writer including the one I have not found. The
   caller is read off the stack, so the event names its own culprit.
   PENDING exists because load() and the first writes happen long before Tele does; nothing
   is dropped for being early, it is drained at session_start. */
const LVL_TRAIL=[];
function _lvlWho(){
  try{ return (new Error()).stack.split("\n").slice(2,5)
    .map(s=>s.trim().replace(/^at\s+/,"").split(/[\s(]/)[0])
    .filter(s=>s&&s!=="Object.set").join(" < ").slice(0,90); }catch(e){ return ""; }
}
{ let _lv = P.level;
  Object.defineProperty(P, "level", {
    enumerable:true, configurable:true,        // enumerable so JSON.stringify(P) still saves it
    get(){ return _lv; },
    set(v){
      const from=_lv; _lv=v;
      if(v===from) return;
      const rec={ from, to:v, d:v-from, why:_lvlWho() };
      LVL_TRAIL.push(rec); if(LVL_TRAIL.length>60) LVL_TRAIL.shift();
      try{ if(typeof Tele!=="undefined" && Tele.log) Tele.log("level_set", rec); }catch(e){}
    } }); }

/* ══ A SAVE THAT FAILS SILENTLY LOOKS EXACTLY LIKE PROGRESS BEING TAKEN AWAY ══
   This was try{...}catch(e){} with an empty catch, so a quota error, a private-mode
   rejection or a serialisation throw all resolved like success. The level would advance in
   memory, never reach the disk, and the next boot would restore an older number - which is
   precisely the shape of "I cleared it and got sent back".
   sv is a write counter mirrored into a SECOND key. If the main blob ever comes back with a
   lower sv than the mirror, the read is stale and load() says so instead of quietly
   handing the player an old life. */
function save(){
  try{
    P.sv=(P.sv||0)+1;
    localStorage.setItem("worddrop_v3", JSON.stringify(P));
    localStorage.setItem("worddrop_sv", P.sv+":"+P.level);
  }catch(e){
    try{ if(typeof Tele!=="undefined") Tele.log("save_failed",
      { err:String((e&&e.message)||e), lv:P.level, sv:P.sv||0 }); }catch(_){}
    LVL_TRAIL.push({ from:P.level, to:P.level, d:0, why:"SAVE FAILED: "+String((e&&e.message)||e) });
  }
}
function saveRun(){
  // A FINISHED level has no run to resume - won counts as finished just as much as lost.
  // Only clearing on `over` left the winning board saved, so if the app closed between
  // the win and the level counter ticking over, you resumed a cleared level with its
  // score already banked and won it again on the first drop.
  if(!S || S.over || S.won){ P.run=null; save(); return; }
  // a lesson can't be resumed mid-script - restarting the level replays it cleanly
  if(S.guide){ P.run=null; save(); return; }
  P.run={ level:S.level, board:S.board.map(row=>row.map(t=>t?{l:t.letter,k:t.kind,x:t.cracks||0,h:t.heldWord||"",d:t.cutDrop||0}:null)),
    cur:S.cur, next:S.next, movesLeft:S.movesLeft, levelScore:S.levelScore,
    drops:S.drops, revived:S.revived, bestWord:S.bestWord, bestWordPts:S.bestWordPts,
    maxChain:S.maxChain, newGrove:S.newGrove, tutorWord:S.tutorWord, petCharge:S.petCharge, petTurn:S.petTurn, petActs:S.petActs||0, charm:S.charm||0,
    wake:S.wake||{},   // how close each friend is to stirring survives a reload mid-round
    goal:S.goal, goal2:S.goal2||null };
  save();
}
function loadRun(){
  const r=P.run;
  if(!r || !r.cur || r.level!==P.level) return false;
  try{
    boardEl.innerHTML="";
    S=newState(r.level);
    Object.assign(S,{ movesLeft:r.movesLeft, levelScore:r.levelScore, drops:r.drops,
      revived:!!r.revived, bestWord:r.bestWord||"", bestWordPts:r.bestWordPts||0,
      maxChain:r.maxChain||1, newGrove:(r.newGrove||[]).filter(w=>GROVE_BY_WORD[w]), cur:r.cur, next:r.next, tutorWord:r.tutorWord||null,
      petCharge:r.petCharge||0, petTurn:r.petTurn||0, petActs:r.petActs||0, charm:r.charm||0,
      wake:r.wake||{}, _woke:[],
      goal:r.goal||{t:"hush",need:0,have:0}, goal2:r.goal2||null });
    r.board.forEach((row,ri)=>row.forEach((cell,ci)=>{
      if(!cell) return;
      const t=newTile(cell.l,cell.k,ri,ci);
      if(cell.x){ t.cracks=cell.x; t.inner.classList.add("cracked"); }
      if(cell.d) t.cutDrop=cell.d;
      if(cell.h) t.heldWord=cell.h; // a spent word stays spent across a reload
    }));
    S.busy=false; // resumed runs skip the intro card, so unfreeze directly
    S.lastAction=Date.now();
    applyBiome(S.level);
    // a resumed ceremony wears its robes again: violet board, silhouette in the corner
    boardEl.classList.toggle("ceremony", !!S.tutorWord);
    Snd.mode = S.tutorWord ? "ceremony" : "normal";
    if(S.tutorWord && !document.getElementById("namer")){
      const n=document.createElement("div"); n.id="namer"; n.className="sil";
      n.innerHTML=UI.silTag(S.tutorWord);   // the painted creature, cut to a silhouette by #namer.sil
      n.title="someone is hiding here - show it the thing it loves";
      boardEl.appendChild(n);
    }
    UI.all(); UI.visitor();
    return true;
  }catch(e){ P.run=null; save(); return false; }
}

/* ══════════════ ALDER - the Keeper of the Wood, and the ONLY voice ══════════════
   One content table, three shapes. The ASIDE: one line in the speaking band, never
   blocks. The PAGE: a boundary card, story beat over game beat - two readings of every
   event. The JOURNAL: every page kept, so a fast thumb loses nothing. All seven old
   channels route here or die. */
/* ══ THE STORY BIBLE ══ Alder, Keeper of the Wood, speaks every page. Two beats each:
     s - one story breath. Plain and warm, never poetry for its own sake.
     g - what it means at the tiles: icon first, the verbs in bold.
     f - the heads-up Alder gives the round BEFORE ("|" splits into tap-throughs).
     b - the face the page wears (defaults to Alder's 🌳).
   The law of the register: a player who reads only the g line can play perfectly; a
   player who reads both knows why the wood is the way it is.
   THE STORY: the hush fell FROM the mountain - the phoenix at the summit forgot her own
   name first, and forgetting spreads. Every country's trouble below is a caretaker who
   stopped tending when its name went (the worm kept the soil, the beaver kept the dam).
   Naming mends. The walk ends where the trouble began. */
const ALDER_PAGES = {
  /* -- the opening. Also seeded into the Journal when the door slides finish. -- */
  "story-1": { b:"🏔️", s:"The forgetting started at the top of the mountain, with the one who lived there. A name left unspoken too long fades - and fading, once it starts, travels.",
               g:"🌲 Every creature in the wood has forgotten its name, and with the names went their gifts." },
  "story-2": { b:"📖", s:"I am Alder. I kept this wood, and I kept its Book - but the hush is taking my memory with the rest. So the Book is yours now.",
               g:"📖 You are the Namekeeper. Clear words to thin the hush, and creatures will remember themselves and join you." },
  "story-3": { b:"👑", s:"Fifty names sleep between here and the summit. The last one burns brighter than all the others put together. Bring her back and the wood wakes.",
               g:"🐾 50 friends to meet, one country at a time. The walk ends at the Frozen Crown." },

  /* -- the ways of the wood: one page per mechanic -- */
  graduate:{ b:"🌿", s:"That is everything I can teach you standing still. The rest, the wood teaches walking.",
             g:"🟠 Take 60 amber for the road. Your kit: 🍃 a breeze trades two letters, 🌟 a wish becomes any letter, and the cat wakes on your words." },
  hold:    { s:"Words like to linger a moment before they go. If you ask, one will stay.",
             g:"🌱 When a word pauses, tap anywhere to keep its letters on the board - then grow them into something longer." },
  breeze:  { s:"The wood lends a little wind to anyone who asks politely.",
             g:"🍃 Tap the breeze, then two letters - they trade places. Every 3-letter word refills it (you can keep 3). A word the breeze itself makes earns nothing back." },
  wish:    { s:"Stars fall here, some nights. Catch one and it becomes whatever you were missing.",
             g:"🌟 Tap the star and choose any letter - the one in your hand becomes it. Every 4-letter word earns one (keep 3). A word the wish itself makes earns nothing back." },
  amber:   { s:"Amber drips from the old trees, slow as memory. The wood trades kindly for it.",
             g:"🟠 When a breeze or wish runs dry, tap its empty pill and amber buys a fresh one. Amber also buys second chances when moves run out." },
  swap:    { s:"Friends do not mind resting. They mind being forgotten.",
             g:"🐾 Double-tap a friend on the shelf to open the Book and swap them. Different rounds suit different friends." },
  meeting: { b:"🎭", s:"When a creature is ready to remember itself, it steps halfway out of hiding. It only wants to see the thing it loves, first.",
             g:"🎭 The strip shows its ask. Do that in this round and it joins you - the score target does not decide a meeting." },
  book:    { b:"📖", s:"Everything I ever knew is written in the Book. What I forget, it remembers for me.",
             g:"📖 The Book of Names maps every country: who lives there, what each one loves, and who is on duty today." },

  /* -- the party growing -- */
  "seat-2":{ b:"🐾", s:"Two can walk with you now. The paths were full of company once - it is good to see a pair again.",
             g:"🐾 A second seat is open. Two friends means two powers working together - open the Book 📖 and choose your pair." },
  "seat-3":{ b:"🐾", s:"Three now. The wood trusts you a little further every day.",
             g:"🐾 A third seat is open. Bring friends who wake on different signs and something is always about to happen." },
  "seat-4":{ b:"🐾", s:"Four walkers. That was a whole family, by the old counting.",
             g:"🐾 The full party: four friends, four signs. The real question now is who fits the round ahead." },
  "tier-1":{ b:"🌿", s:"Something has deepened. I can feel it in the roots.",
             g:"🌿 Every friend you have met has grown - they stir sooner and give more when they do. The ones resting at home grew too." },
  "tier-2":{ b:"🌿", s:"They know your hand by heart now.",
             g:"🌿 Grown again: signs come quicker, and the wood asks more of you to match." },
  "tier-3":{ b:"🌿", s:"As awake as I can make them. What comes now, you meet together.",
             g:"🌿 Your friends are fully grown. From here the wood tests the keeper, not the kept." },

  /* -- the troubles. Each one is a caretaker who forgot. s tells you who; g tells you
        the rule; f is what Alder says the round BEFORE it first appears. -- */
  branch:  { s:"I used to walk these paths every morning and clear the deadfall myself. My arms are not what they were.",
             g:"🪾 A fallen branch holds no letter. Clear one word right beside it and it is gone.",
             f:"The path ahead has not been swept in a long while. That used to be my job.|🪾 Fallen branches next round - one word right beside a branch clears it." },
  bramble: { s:"These hedges were kept once. Untended thorn does what untended thorn always does - it reaches.",
             g:"🌿 Every few drops the tangle grabs another letter. Clear a word right beside a tangle to cut it away.",
             f:"I can smell thorn on the wind. The hedges have gone wild since the hush.|🌿 Brambles next round - they spread every few drops. Cut them with words right beside them." },
  root:    { s:"The worm kept the soil loose so the roots slept deep. The worm forgot her work, and the roots woke hungry.",
             g:"🪵 One word beside a root cuts it - but left alone three drops, it heals whole. Cut twice, quickly.",
             f:"The ground ahead is knotted. The one who kept the soil soft has forgotten how.|🪵 Roots next round - cut each one twice, quickly, or it heals itself whole." },
  spore:   { s:"The raccoon used to tidy this hollow and cart the drift away. Nobody has tidied in years.",
             g:"🍄 Spores land anywhere on the board every few drops. One word beside one clears it.",
             f:"Breathe lightly through here - the low air hangs thick.|🍄 Spores next round - they land anywhere, and one word beside each clears it." },
  reed:    { s:"The boar kept the banks thinned with his rooting. The reeds have not been walked through in an age.",
             g:"🌾 A reed blocks its whole column - nothing drops past it. Go around: clear a word beside it, twice.",
             f:"The banks ahead are overgrown taller than you are.|🌾 Reeds next round - a reed blocks its whole column. Two words beside it bring it down." },
  mire:    { s:"A little red gardener knew every dry path through this marsh. The mud has forgotten them all.",
             g:"🟤 Mire does not fall - it hangs where it is and holds a shelf in the air. One word beside it pulls it free.",
             f:"Mind your step past here. The ground stops holding.|🟤 Mire next round - it hangs in the air while everything settles around it. One word beside it pulls it free." },
  current: { s:"The beaver's dam kept this river slow and thoughtful. The dam is unmended, and the water remembers how to run.",
             g:"🌀 Every few drops the current shoves a whole row sideways. Held words and mire stay put.",
             f:"The river was calm, the last time I stood here. It is not calm now.|🌀 Currents next round - every few drops a row is shoved sideways. Held words stay put." },
  pest:    { s:"The spider kept the small biters tangled in her web. The web hangs empty now.",
             g:"🐛 Every few drops the pest trades places with one of your letters. One word right beside it shoos it off.",
             f:"Something small is loose ahead, and it likes to move your things.|🐛 A pest next round - it swaps seats with your letters until one word beside it shoos it off." },
  stone:   { s:"The bear rolled the fallen stones off these paths, in the years the bear still remembered to.",
             g:"🪨 A mossy stone blocks words. A word beside it cracks it - a second one smashes it.",
             f:"Stone has crept onto the path while nobody was rolling it away.|🪨 Stones next round - one word beside cracks, a second smashes." },
  mist:    { s:"The hawk saw through every fog on this dark stretch and called the shapes below. Nobody calls them now.",
             g:"🌫️ A misted letter hides its face - no word can use it. Clear a word beside it and the mist lifts.",
             f:"The air ahead is going white.|🌫️ Mist next round - a hidden letter cannot be used until a word beside it lifts the fog." },
  shroud:  { s:"Some dark is just night. This dark leans in close and drinks the sound of your words.",
             g:"🌑 Words cleared beside a shroud score half. Two words beside it lift the gloom for good.",
             f:"Past here, even I keep my voice down.|🌑 Shrouds next round - words beside them pay half until two words lift them." },
  crystal: { s:"The lizard baked on these seams and kept them warm. Warm crystal gives kindly - it remembers her, I think.",
             g:"💎 Two clears to break - and it does not vanish, it turns to gold. The one trouble that leaves you richer.",
             f:"The walls ahead glitter. Not everything hard is unkind.|💎 Crystal next round - break it twice and it turns to gold." },
  scree:   { s:"The turtle walked these slopes slow and settled the loose rock with her weight. The slope is loose again.",
             g:"🪨 Clear scree and it breaks into more, once. The slope always ends - keep swinging.",
             f:"Watch your footing on the climb ahead.|🪨 Scree next round - clearing it splits it once more before it goes for good." },
  wind:    { s:"The cricket sang this ridge to sleep every night. Without the song, the wind never settles.",
             g:"🌬️ Every few drops the wind lifts the top letter off your tallest pile and drops it somewhere else.",
             f:"Hold onto your hat past here.|🌬️ Wind next round - it carries the top of your tallest pile somewhere new every few drops." },
  ice:     { s:"The dragon's warm breath kept the Snowline gentle. The cold has had years to itself since.",
             g:"🧊 A frozen letter cannot be used yet. Clear a word beside it and it thaws.",
             f:"It gets colder with every step now.|🧊 Ice next round - a frozen letter thaws when a word clears beside it." },
  frost:   { s:"The golem stoked a fire under the Crown that is older than I am. The fire is down to embers.",
             g:"❄️ Deep frost is winter twice over. One word beside it sheds a layer - a second sets the letter free.",
             f:"The last climb is the coldest.|❄️ Deep frost next round - two words beside it, one for each layer." },
  crate:   { s:"Travellers used to leave parcels along the way for whoever came next. Some are still waiting.",
             g:"🎁 Clear a word beside a crate and it bursts open - points, a 🍃 breeze, a 🌟 wish, sometimes a move or two." },

  /* -- what a round can ask. Shown once, at the round's own doorstep. -- */
  "goal-thaw":    { b:"🧊", s:"The hush does not want points here. It wants the cold gone.",
                    g:"🧊 Melt every frozen letter before your moves run out - clear words beside the ice. Points do not decide this round." },
  "goal-boulder": { b:"🪨", s:"The stones have taken the path. Take it back.",
                    g:"🪨 Smash every mossy stone - two words beside each one. That is the whole ask." },
  "goal-harvest": { b:"✨", s:"Gold is only gold if somebody gathers it.",
                    g:"✨ Use every golden letter in a word. The gold is the goal, not the points." },
  "goal-unravel": { b:"🎁", s:"Parcels left for whoever came next. You came next.",
                    g:"🎁 Burst every gift crate with words beside them. What is inside is still yours." },
  "goal-lift":    { b:"🌫️", s:"The fog here is thick enough to lose a friend in.",
                    g:"🌫️ Lift every misted letter - clear words beside the fog until no letter hides." },
  "goal-cut":     { b:"🌿", s:"The tangle grows faster than it used to. Cut it back.",
                    g:"🌿 Cut the asked number of brambles before moves run out - words right beside them." },
  "goal-long":    { b:"🏔️", s:"Small words will not carry up here. Speak properly.",
                    g:"🏔️ Only words of 4 letters or more count this round. Build tall." },
  "goal-star":    { b:"⭐", s:"Stars fell in the night. They are still lying where they landed.",
                    g:"⭐ Use every fallen star in a word - a star becomes any letter you need it to be." },
  "goal-gauntlet":{ b:"👑", s:"The wood asks two things at once here. It only does that near crowns.",
                    g:"👑 Two asks stand on the strip - finish BOTH to clear the round." },

  /* -- the fifteen chapters. s is the land and its missing caretaker; the g beat is
        assembled live (what new trouble, who can be met) by the border code. -- */
  "ch-0": { b:"🌼", s:"<b>The First Clearing</b> - where every name begins. This one was mine to keep, and it is still the gentlest country the wood has. We begin where beginning is easy." },
  "ch-1": { b:"🌿", s:"<b>The Bramblewood.</b> There was a hedge here, and a keeper for it. The thorns have closed over the path since - my fault as much as anyone's." },
  "ch-2": { b:"🌱", s:"<b>The Mosswood.</b> Soft ground, and everything furred. The worm who kept the soil loose is down there somewhere, nameless, and the roots grow bold without her." },
  "ch-3": { b:"🍄", s:"<b>The Spore Hollow.</b> The low air hangs thick with drifting. The raccoon who tidied this hollow has forgotten what tidying is." },
  "ch-4": { b:"🌊", s:"<b>The Listening Pond.</b> Still water, and something listening. The boar who kept the banks thinned has gone quiet with the rest." },
  "ch-5": { b:"🪷", s:"<b>The Reedmarsh.</b> The ground stops holding here. A little red gardener knew every dry path through - the mud has forgotten them all." },
  "ch-6": { b:"🌀", s:"<b>The Running River.</b> Nothing here stays where you put it. The beaver's dam is unmended, and the water remembers how to run." },
  "ch-7": { b:"💦", s:"<b>The Thunderfalls.</b> Loud water, and a rainbow standing in it. The spider who kept the small biters strung her last web years ago." },
  "ch-8": { b:"🕳️", s:"<b>The Undercave.</b> The sky closes over here. The bear who rolled the stones off the path sleeps somewhere deep, past waking by anything but a name." },
  "ch-9": { b:"🌑", s:"<b>The Deep Dark.</b> No light, and no need of it - so they said, when the hawk still called the shapes below. Stay close to your letters." },
  "ch-10":{ b:"💎", s:"<b>The Glimmer Seams.</b> The wood is generous, for once. The lizard who kept these seams warm is gone - but warm crystal remembers how to give." },
  "ch-11":{ b:"🪨", s:"<b>The Scree Slopes.</b> The ground breaks as you climb it. The turtle who settled the stones walks slower than ever, and remembers less." },
  "ch-12":{ b:"🌬️", s:"<b>The Windward Ridge.</b> High enough for weather. The cricket used to sing the wind to sleep - the ridge has not slept since." },
  "ch-13":{ b:"❄️", s:"<b>The Snowline.</b> The first snow, at last. The dragon's warm breath kept winter polite here. Winter has stopped being polite." },
  "ch-14":{ b:"👑", s:"<b>The Frozen Crown.</b> The top of the wood, and the last name. She is up here - the one who forgot first. Everything below only followed her." },
};
/* the round-before warnings that have no trouble page of their own */
const ALDER_EVES = {
  "door-eve": "Tomorrow we reach this country's far door.|🗝️ Win the next round and a keeper gets its name back - it will join you at the door, no meeting needed.",
};
/* ══ THE STAGE MANAGER ══ one stage, two tenants, four priorities.
   RULE ZERO: the grace bubble is a CONTROL, not a message - it owns the stage
   absolutely. A showing pill swaps out the instant the bubble appears (a
   MutationObserver on the dock, not a poll) and its content returns to the
   front; speech resumes 400ms after the hold resolves.
   P1 urgent reactions   - jump the queue (direct answers to a tap)
   P2 event lines        - queue, but STALE-DROPPED if a newer drop happened
                           first, and COALESCED to one line per drop
   P3 teaching/foreshadow- never dropped, never queued: they wait in the POCKET
                           for a QUIET window (stage free, no hold, no overlay,
                           800ms since the last drop) and carry across rounds.
                           Multi-line sequences (split on "|") are P3-only:
                           tap ▸ advances, 8s advances anyway, interruption
                           pauses and resumes at the unread line.
   P4 flavor             - dropped freely if anyone else is waiting.
   No tap is ever REQUIRED; the board is never locked; once-keys are marked
   when a line is SHOWN, not when it is asked for. */
const Alder = { Q:[], pocket:[], cur:null, _hideT:null, _pageCb:null,
  _lastDrops:-1, _lastDropAt:0,
  aside(key, html, o){ o=o||{};
    if(!html) return;
    try{ P.said=P.said||{}; }catch(e){ return; }
    if(o.once && P.said[key]) return;
    const pri=o.pri||2;
    /* THE PILL IS ONE SENTENCE, ALWAYS. Dozens of call sites still write two-storey
       lines ("headline<br><small>detail</small>") from the old surfaces - flattened
       here into one flowing sentence, so the collapsed pill can never stack lines.
       If the flattened line runs long, the ▲ fold-out is the overflow, nothing else. */
    const flat=String(html).replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/?small>/gi, " ").replace(/\s{2,}/g, " ");
    const item={ key, chunks:flat.split("|").map(s=>s.trim()).filter(Boolean),
      idx:0, who:o.who||null, pri, once:!!o.once, hold:!!o.hold,
      drop:(typeof S!=="undefined" && S) ? S.drops : null };
    if(!item.chunks.length) return;
    if(pri===3){ if(!Alder.pocket.some(p=>p.key===key)) Alder.pocket.push(item); return; }
    if(pri===4){ if(Alder.cur || Alder.Q.length) return; Alder.Q.push(item); }
    else if(pri===1){ Alder.Q.unshift(item); }
    else {
      /* NO PER-DROP COALESCING. It existed because the round's ask was ALSO posted at
         P2, so an event and the ask on one drop would have duplicated. The ask is the
         bar's resting content now and never enters this queue, which leaves P2 to the
         pets alone - and pets chain: one word can set off three of them. Coalescing
         then meant the middle pet was deleted before it ever spoke. Measured live: a
         dog, a bee and a skunk fired on one drop and the bee was never shown.
         A player who does not see what their friend did cannot learn what it does. */
      Alder.Q.push(item);
    }
    /* 4, not 2 - a full chain is four pets at most, and the cap used to eat the tail of
       exactly the chains worth watching. Still bounded, so a runaway cannot queue forever. */
    while(Alder.Q.length>4){ const i=Alder.Q.findIndex(q=>q.pri>=2);
      Alder.Q.splice(i<0?Alder.Q.length-1:i,1); }
    Alder._pump();
  },
  /* ══ THE FACE READS THE ROUND ══ he is the keeper, so the tree is his ordinary self -
     but when the round has an ask of its own he wears its sign, and the bar he speaks
     from becomes the round's own surface rather than generic chrome. A pet speaking
     through him still overrides this (item.who wins): the face says WHO is talking
     first, and only falls back to WHAT KIND OF ROUND it is when that is Alder himself. */
  roundFace(){
    try{
      if(typeof S==="undefined" || !S) return "🌳";
      if(S.tutorWord) return "🎭";                       // someone is waiting to be met
      const goals=[S.goal,S.goal2].filter(g=>g && g.t!=="hush");
      if(goals.length>1) return "👑";                    // the crown trial asks two things
      if(goals.length===1) return GOALS[goals[0].t] ? GOALS[goals[0].t].i : "📜";
      return "🌳";
    }catch(e){ return "🌳"; }
  },
  _stageFree(){
    return $("alder") && !document.querySelector(".wordbanner.breath")
      && !document.querySelector(".overlay.active"); },
  _quiet(){
    if(!Alder._stageFree() || Alder.cur || Alder.Q.length) return false;
    if(typeof S==="undefined" || !S) return true;                 // the door is always quiet
    if(S.over || S.won) return false;                             // the card owns the end
    return !S.busy && (Date.now()-Alder._lastDropAt) > 800; },
  _pump(){
    if(Alder.cur || !Alder._stageFree()) return;
    // stale-drop: an event line older than the latest drop narrates the past - skip it
    while(Alder.Q.length){
      const n=Alder.Q[0];
      if(n.pri===2 && n.drop!=null && typeof S!=="undefined" && S && S.drops>n.drop){ Alder.Q.shift(); continue; }
      break;
    }
    const item=Alder.Q.shift() || (Alder._quiet() ? Alder.pocket.shift() : null);
    if(!item){ Alder.rest(); return; }          // nothing waiting - the ask holds the bar
    Alder._show(item);
  },
  /* ══ FITS, OR IT BECOMES A WINDOW ══
     The bar shows only copy that measurably fits. Nothing is ever cut, and there is no
     fold-out: an inline expander made the overflow the reader's problem and let the copy
     stay too long. What does not fit goes to Alder's window, which is built to hold a
     paragraph and is one tap away from every message.
     _fit() walks the line down through its own natural joints - " - " first, because
     nearly every line in this game is written "headline - detail", then sentences, then
     clauses - and takes the longest WHOLE piece that fits. It never trims mid-phrase and
     never appends an ellipsis: a shortened line still reads as a finished thought.
     When something was left behind, the bar wears "tap ▸" and the tap opens the window
     with the full text. So the short form is a headline, not a truncation. */
  _fit(html){
    const el=$("alder"); if(!el) return { head:html, rest:null };
    const t=el.querySelector(".atxt"); if(!t) return { head:html, rest:null };
    /* MEASURED IN THE REAL NODE, not a copy of it. An off-tree probe styled from the same
       computed font still disagreed - emoji resolve through a different fallback when the
       span is not in the bar's own context - and a line that "fitted" in the probe clipped
       on screen. Writing into the element and reading its own scrollWidth cannot be wrong
       about itself. The original text is restored before returning, so nothing flashes. */
    const keep=t.innerHTML;
    /* MEASURE IN THE STATE THE LINE WILL BE SHOWN IN. .atxt is flex:1 and "tap ▸" only
       occupies width while the bar is on, so measuring a resting bar gave a wider box
       than the message would actually get - the same line fitted or windowed depending
       on what the bar happened to be doing when it was measured. Force the shown state
       (with the hint present, the narrowest case) and restore afterwards. */
    const hadOn=el.classList.contains("on"), hadMore=el.classList.contains("more");
    el.classList.add("on","more");
    const restore=()=>{ el.classList.toggle("on",hadOn); el.classList.toggle("more",hadMore); };
    const fits=s=>{ t.innerHTML=s; return t.scrollWidth<=t.clientWidth+0.5; };
    let head=html, rest=null;
    if(!fits(html)){
      const joints=[/\s+-\s+/, /(?<=[.!?])\s+/, /,\s+/];
      for(const j of joints){
        const parts=String(html).split(j);
        if(parts.length<2) continue;
        // longest run of whole pieces that still fits
        let take=0;
        for(let n=1;n<parts.length;n++){
          if(fits(parts.slice(0,n).join(" - "))) take=n; else break;
        }
        if(take){ head=parts.slice(0,take).join(" - "); rest=html; break; }
      }
      if(!fits(head)){
        /* NO WORD-BOUNDARY FALLBACK. Trimming to whole words still produced "🦝 rummaged
           out a little" - grammatically a fragment, and a fragment IS a truncation even
           without an ellipsis. If the line has no joint short enough to stand alone, the
           bar does not get a mangled version of it: the whole thing goes to the window
           and the bar keeps whatever it was already showing. */
        head=null; rest=html;
      }
      try{ if(Tele.isLocal()) console.warn("[alder] copy over budget"
        +(head?" (windowed tail)":" (WINDOW ONLY - shorten this)")+":", html); }catch(e){}
    }
    t.innerHTML=keep; restore();
    return { head, rest };
  },
  _show(item){
    const el=$("alder"); if(!el) return;
    Alder.cur=item;
    if(item.once && item.idx===0){ try{ P.said[item.key]=1; save(); }catch(e){} }
    el.querySelector(".aface").innerHTML = item.who || Alder.roundFace();
    el.classList.add("on","msg");
    const raw=item.chunks[item.idx];
    /* measured against the REAL element, so it has to be on stage first - clientWidth of
       a hidden box is zero and every line would "fit" */
    const f=Alder._fit(raw);
    if(f.head===null){
      /* nothing of this line can stand alone in the bar. It is not shown badly - it is
         shown properly, in the window, and the bar returns to rest behind it. */
      el.classList.remove("on","msg","more");
      el.querySelector(".atxt").innerHTML="";     // no stale line left behind the window
      Alder.cur=null;
      Alder.pageData({ s:raw, b:(item.who||Alder.roundFace()) },
        { cb:()=>{ Alder.rest(); setTimeout(()=>Alder._pump(), 200); } });
      return;
    }
    el.querySelector(".atxt").innerHTML = f.head;
    item._full = f.rest;                      // null when the whole line is on the bar
    el.classList.toggle("more", !!f.rest || item.idx < item.chunks.length-1);
    item._drop0 = (typeof S!=="undefined" && S) ? S.drops : null;
    clearTimeout(Alder._hideT); Alder._hideT=null;
    const words=String(f.head).replace(/<[^>]+>/g," ").trim().split(/\s+/).length;
    /* a held line keeps its 13s even when something is queued behind it - the queue is
       almost always empty now, and a friend's news should not be cut short to make room */
    const ms = item.hold ? 13000
             : item.chunks.length>1 ? 8000
             : Math.min(6500, 1900+words*300);
    Alder._hideT=setTimeout(()=>Alder._advance(), ms);
  },
  _advance(){
    const item=Alder.cur; if(!item){ Alder._pump(); return; }
    if(item.idx < item.chunks.length-1){ item.idx++; Alder._show(item); return; }
    Alder._dismiss();
  },
  /* ══ THE BAR HAS A RESTING STATE ══
     It used to be a message surface and nothing else, so the moment a line expired - or
     you read one in the window and closed it - the bar went blank and 42px of the screen
     stopped meaning anything. That is what made it feel unfinished.
     At rest it carries the ROUND'S OWN ASK. That is not news, so it is not queued and it
     never expires; it is simply what this bar says when nobody is interrupting. Messages
     borrow the bar and hand it back.
     It also ends the collision the inventory turned up: the ask used to be posted as a
     P2 message, competing with 35 pet-power call sites at the same priority, where P2
     coalescing meant one of them died silently on any drop that did both. */
  /* ══ THE RESTING LINE SAYS WHAT TO DO ══
     It used to read "the wood is listening", which is atmosphere standing where an
     instruction belongs. A player glancing at the bar wants one thing from it: what
     finishes this round. In a goal round that is the ask; in an ordinary round it is
     the score, so say the score. Never a mood, always a target. */
  /* the standing rule is that this pane is never empty, and telemetry caught it broken: a
     session logged a bar line whose whole text was "". Every path here could return "". */
  restLine(){
    try{
      if(typeof S!=="undefined" && S){
        if(S._toldGoal) return S._toldGoal;
        if(S.tutorWord && !S.guestNamed && Game.meetAskLine) return Game.meetAskLine();
        if(S.target) return "reach "+S.target+" points";
      }
    }catch(e){}
    try{ if(typeof P!=="undefined" && P && P.level)
      return "level "+(P.level<=PROLOGUE_END ? "P"+P.level : (P.level-PROLOGUE_END))+" - press play when you are ready"; }catch(e){}
    return "the wood is waiting for you";
  },
  rest(){
    const el=$("alder"); if(!el) return;
    if(Alder.cur) return;                       // a message is speaking; it hands back later
    const t=el.querySelector(".atxt"); if(!t) return;
    const line=Alder.restLine();
    const f=Alder._fit(line);
    t.innerHTML = (f.head===null) ? line : f.head;
    el.querySelector(".aface").innerHTML = Alder.roundFace();
    el.classList.add("on");
    el.classList.remove("msg","more");
  },
  _dismiss(){
    const el=$("alder"); clearTimeout(Alder._hideT);
    Alder.cur=null;
    if(el) el.classList.remove("more","msg");
    /* only fall back to the ask when NOTHING is waiting. Resting unconditionally put a
       320ms flash of the round's ask between every pair of queued messages - measured
       live as message, rest, message - which reads as the bar glitching rather than as
       two friends speaking in turn. With a queue behind it, go straight to the next. */
    if(Alder.Q.length || (Alder._quiet() && Alder.pocket.length)){
      setTimeout(()=>Alder._pump(), 240);
    } else {
      Alder.rest();                             // never blank - back to the ask
      setTimeout(()=>Alder._pump(), 320);
    }
  },
  /* A TAP ALWAYS OPENS SOMETHING, and never advances past unread words. If the line was
     shortened, the window holds the whole of it. If it was not, the tap still opens the
     window on the round's own terms, so the gesture means one thing everywhere. */
  tap(){
    const item=Alder.cur;
    const full = item && item._full;
    if(full){
      clearTimeout(Alder._hideT); Alder._hideT=null;
      Alder.pageData({ s:full, b:(item.who||Alder.roundFace()) },
        { cb:()=>Alder._advance() });
      return;
    }
    if(item){ Alder._advance(); return; }
    Alder.restWindow();
  },
  /* tapped at rest: the round's terms in full, which is the one thing a player may want
     to re-read and the bar can only ever summarise */
  /* tapped at rest: the round's terms in full, and MORE than the bar could show - the
     bar states the ask, the window adds how you are doing against it. */
  restWindow(){
    let s="", g="";
    try{
      if(typeof S!=="undefined" && S){
        if(S._toldGoal){
          s="To finish this round: "+S._toldGoal+".";
          g="Spell words next to a piece to clear it. Moves left: "+S.movesLeft+".";
        } else if(S.target){
          s="To finish this round, reach "+S.target+" points.";
          g="You have "+(S.levelScore||0)+". Longer words score much more than short ones. Moves left: "+S.movesLeft+".";
        }
      }
    }catch(e){}
    if(!s) s="Spell words to score. Clear the target and the round is yours.";
    Alder.pageData({ s, g, b:Alder.roundFace() });
  },
  /* rule zero, mechanically: the dock observer preempts the pill the frame the
     grace bubble lands, and hands the stage back 400ms after it goes */
  _preempt(){
    const item=Alder.cur; if(!item) return;
    clearTimeout(Alder._hideT); Alder.cur=null;
    const el=$("alder"); if(el) el.classList.remove("on","more","msg");
    if(item.pri===3){ Alder.pocket.unshift(item); }               // resumes at unread line
    else Alder.Q.unshift(item);
  },
  _watch(){
    /* the grace bubble left the dock (tap-anywhere hold, 2026-08-01): the breath now
       preempts and resumes the pill by DIRECT calls from Game.grace - watching the
       dock for a bubble that never comes would be dead machinery. The observer stays
       retired rather than deleted so this note survives. */
    const dock=$("dock"); if(!dock || Alder._mo) return;
    Alder._mo=true; // retired: Game.grace calls _preempt()/_pump() itself
    // the quiet-window ticker: drains the pocket when the player is breathing - and an
    /* a SHORTENED line (one with more waiting in the window) holds no timer - reading
       speed belongs to the reader - so the next drop is what carries it away. Lines that
       fit whole still leave on their own timer. .exp/.clip are gone with the fold-out. */
    Alder._tick=setInterval(()=>{
      if(typeof S!=="undefined" && S && S.drops!==Alder._lastDrops){
        Alder._lastDrops=S.drops; Alder._lastDropAt=Date.now();
        const c=Alder.cur;
        if(c && c._drop0!=null && S.drops>c._drop0 && c._full) Alder._dismiss();
      }
      if(!Alder.cur) Alder._pump();
    }, 600);
  },
  /* A PAGE is the storybook card: story beat, then the gold game beat. o.g / o.s
     override the table (the border pages assemble their g beat live); the resolved
     text is what the Journal keeps, so a reread never shows a template. */
  page(key, o){ o=o||{};
    const pg=ALDER_PAGES[key]; if(!pg) return false;
    const s=o.s||pg.s, g=(o.g!=null?o.g:pg.g), b=o.b||pg.b;
    try{ P.said=P.said||{};
      if(P.said["pg-"+key] && !o.again) return false;
      P.said["pg-"+key]=1;
      Alder._journalKeep(key, s, g, b);
      save(); }catch(e){}
    Alder._pageShow(s, g, b, o.cb);
    return true;
  },
  /* a one-off page built at the call site (a door opening, a summons). Repeatable
     events show every time - the Journal keeps only the first telling of each k. */
  pageData(d, o){ o=o||{};
    if(!d || !d.s) return false;
    try{ P.said=P.said||{};
      if(d.k && o.once){ if(P.said["pg-"+d.k]) return false; P.said["pg-"+d.k]=1; }
      Alder._journalKeep(d.k||null, d.s, d.g, d.b);
      save(); }catch(e){}
    Alder._pageShow(d.s, d.g, d.b, o.cb);
    return true;
  },
  /* several pages in a row (the doorstep can owe more than one) - each waits for its
     tap. Items: "key" | ["key",{opts}] | {s,g,b,k} - anything unreadable is skipped. */
  pageSeq(items, cb){
    const next=()=>{
      const it=(items||[]).shift();
      if(it===undefined){ if(cb) cb(); return; }
      let shown=false;
      try{
        if(typeof it==="string") shown=Alder.page(it,{cb:next});
        else if(Array.isArray(it)) shown=Alder.page(it[0], Object.assign({}, it[1]||{}, {cb:next}));
        else if(it && it.s) shown=Alder.pageData(it,{cb:next});
      }catch(e){}
      if(!shown) next();               // already read, or unreadable - straight on
    };
    next();
  },
  _journalKeep(key, s, g, b){
    P.journal=P.journal||[];
    const flat = key && ALDER_PAGES[key] && ALDER_PAGES[key].s===s && ALDER_PAGES[key].g===g;
    if(flat){ if(!P.journal.includes(key)) P.journal.push(key); return; }
    if(key && P.journal.some(e=>e && e.k===key)) return;
    P.journal.push({ k:key||undefined, s, g, b });
  },
  _pageShow(s, g, b, cb){
    $("ap-story").innerHTML=s;
    $("ap-game").innerHTML=g||"";
    $("ap-game").style.display=g?"block":"none";
    { const f=document.querySelector("#ov-alder .ap-face"); if(f) f.innerHTML=b||"🌳"; }
    Alder._pageCb=cb||null;
    $("ov-alder").classList.add("active");
    Snd.tone(523,{dur:.25,type:"sine",gain:.05,verb:true});
  },
  pageClose(){ $("ov-alder").classList.remove("active");
    const cb=Alder._pageCb; Alder._pageCb=null; if(cb) cb(); },
  tease(key, html){ Alder.aside("tz-"+key, html, {once:true, pri:3}); },
  /* resolves when Alder is silent and owes nothing - the prologue lessons wait on this */
  quietWait(){
    return new Promise(res=>{
      const check=()=>{ if(!Alder.cur && !Alder.Q.length) return res(); setTimeout(check,120); };
      setTimeout(check, 60);
    });
  },
  journalShow(){ if(UI.menuToggle) UI.menuToggle(false);
    const list=(P.journal||[]).map(e=>{
      const p = typeof e==="string" ? ALDER_PAGES[e] : e;
      if(!p || !p.s) return "";
      return '<div class="j-entry"><div class="j-story">'+p.s+'</div>'
        +(p.g?'<div class="j-game">'+p.g+'</div>':'')+'</div>'; }).join("");
    $("j-list").innerHTML = list
      || '<div class="j-story">I have not written anything here yet. Walk on - I will.</div>';
    $("ov-journal").classList.add("active");
  },
  journalHide(){ $("ov-journal").classList.remove("active"); },
};

/* ══ THE FIELD GUIDE ══ the one loud surface the PLAYER summons. Hold a trouble tile,
   hold the breeze or the wish, or tap a friend, and this card opens at the top with the
   full story-and-rule reading - no clipping, no timer. It is a real overlay: while it is
   open nothing else can be played, so it never has to fight the board, and it leaves the
   moment you tap ✕ or anywhere outside it. Alder's pill pauses while it is up (an active
   overlay is never a free stage) and resumes on its own after. */
const Info = {
  _ate:false, _boardAte:false, _pt:null,
  show(d){
    $("info-face").innerHTML = d.b || "🌳";
    $("info-title").textContent = d.t || "";
    $("info-body").innerHTML = d.body || "";
    $("ov-info").classList.add("active");
    Snd.tone(660,{dur:.14,type:"sine",gain:.04,verb:true}); buzz(15);
  },
  hide(){ $("ov-info").classList.remove("active"); },
  tile(kind){
    const pg=ALDER_PAGES[kind], tip=UI.TIPS[kind];
    const icon=(typeof TROUBLE_ICON!=="undefined" && TROUBLE_ICON[kind]) || (tip&&tip.i) || (pg&&pg.b) || "🌳";
    if(pg) Info.show({ b:icon, t:"the "+kind,
      body:'<div class="i-story">'+pg.s+'</div><div class="i-game">'+(pg.g||"")+'</div>' });
    else if(tip) Info.show({ b:tip.i, t:"the "+kind, body:'<div class="i-game">'+tip.t+'</div>' });
  },
  tool(k){
    const pg=ALDER_PAGES[k]; if(!pg) return;
    Info.show({ b:(k==="breeze"?"🍃":"🌟"), t:"the "+k,
      body:'<div class="i-story">'+pg.s+'</div><div class="i-game">'+pg.g+'</div>' });
  },
  /* hold the breeze or the wish half a second to read it - a plain tap still arms it */
  wireTools(){
    [["breezepill","breeze"],["wishbtn","wish"]].forEach(([id,k])=>{
      const el=$(id); if(!el) return;
      let t=null;
      el.addEventListener("pointerdown", ()=>{ clearTimeout(t);
        t=setTimeout(()=>{ Info._ate=true; Info.tool(k); }, 550); });
      ["pointerup","pointerleave","pointercancel"].forEach(ev=>el.addEventListener(ev, ()=>clearTimeout(t)));
      el.addEventListener("click", e=>{ if(Info._ate){ Info._ate=false;
        e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    });
  },
};

/* =================== STATE =================== */
