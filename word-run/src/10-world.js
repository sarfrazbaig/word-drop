/* @module  world  -  board size, biomes, decor, obstacle debuts - the shape of the place */
const COLS=7, ROWS=8, CELL=44, GAP=4, STEP=CELL+GAP;
const VAL = {a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10};
const FREQ = "aaaaaaaaabbcccddddeeeeeeeeeeeeffggghhiiiiiiiiijkllllmmnnnnnnooooooooppqrrrrrrssssssttttttuuuuvwwxyyz";
const VOWELS = new Set(["a","e","i","o","u"]);
const MIN_LEN = 3;
/* Level design is a RHYTHM, not a ramp: gentle → breather → build → breather → 🔥SPIKE.
   Every 10th level is a 👑 golden milestone. Targets grow sub-linearly so the wall never comes. */
const RHYTHM=[1.0, 0.88, 1.02, 0.92, 1.16];
/* FIFTEEN COUNTRIES, ONE WALK. It never doubles back: you wake on the wood floor and you
   end on a frozen summit, and every country is plausibly walkable from the last. Five
   places that cycled every twenty-five levels meant none of them was anywhere - there was
   no cold country for a friend who answers cold to belong to, and ice, the most familiar
   trouble in the game, was spent in the tutorial. Now the game climbs two hundred and
   sixty levels to earn it. */
const BIOMES=["🌼","🌿","🌱","🍄","🌊","🪷","🌀","💦","🕳️","🌑","💎","🪨","🌬️","❄️","👑"];
const BIOME_NAMES=["The First Clearing","The Bramblewood","The Mosswood","The Spore Hollow",
  "The Listening Pond","The Reedmarsh","The Running River","The Thunderfalls","The Undercave",
  "The Deep Dark","The Glimmer Seams","The Scree Slopes","The Windward Ridge","The Snowline",
  "The Frozen Crown"];
/* A PLACE YOU STAY IN, not a backdrop that changes every five levels.
   Biomes used to rotate every 5, so a player passed through all five of them every 25
   levels and none of them was anywhere - there was no "ice place" for a friend who
   answers ice to belong to. Eighteen levels each makes a biome a chapter: meet its
   trouble, struggle with words alone, find the friend who answers it, then master it.
   Five chapters is 90 levels, and the ring beyond that is the same wood walked again. */
/* ═══ THE BOOK ═══ every country is a chapter with a name and a line beneath it, and
   the first five levels are the page before the story starts. Shown on the door so a
   player always knows where in the tale they are standing. */
const NUMERAL=["ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN",
  "ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN"];
const CHAPTER_LINE=[
  "where every name begins",                    /* 1  First Clearing   */
  "the thorns close over the path",             /* 2  Bramblewood     */
  "soft ground, and everything furred",         /* 3  Mosswood        */
  "the low air, thick with drifting",           /* 4  Spore Hollow    */
  "still water, and something listening",       /* 5  Listening Pond  */
  "the ground stops holding",                   /* 6  Reedmarsh       */
  "nothing here stays where you put it",        /* 7  Running River   */
  "loud water, and a rainbow in it",            /* 8  Thunderfalls    */
  "the sky closes over",                        /* 9  Undercave       */
  "no light, and no need of it",                /* 10 Deep Dark       */
  "the wood is generous, for once",             /* 11 Glimmer Seams   */
  "the ground breaks as you climb it",          /* 12 Scree Slopes    */
  "high enough for weather",                    /* 13 Windward Ridge  */
  "the first snow, at last",                    /* 14 Snowline        */
  "the top of the wood, and the last name",     /* 15 Frozen Crown    */
];
/* one number: earnBreeze/earnWish capped at 3 while the shop and the daily gift capped at
   4, so two of the three ways to receive one could hand you a fourth a round would never pay */
const TOOL_CAP=3;
const PROLOGUE_END=5;   // the taught levels are the page before chapter one
/* THE ADVENTURE'S OWN COUNT. The lessons are the page before the story, so the first
   round you play unaided is 1 - and every authored schedule below is written in these
   numbers, which are the numbers on the chip. Returns 0 or less during the prologue,
   which every schedule reads as 'not yet'. */
function advOf(L){ return L - PROLOGUE_END; }
/* WHAT THE PLAYER SEES ON A LEVEL NUMBER. The five taught rounds are the prologue and
   carry no level number at all; the story starts counting at the first round you play
   unaided, so a player's first real level reads Level 1 and not Level 6. */
function levelLabel(L){ return L<=PROLOGUE_END ? "Prologue "+L+" of "+PROLOGUE_END
                                               : "Level "+(L-PROLOGUE_END); }
function levelShort(L){ return L<=PROLOGUE_END ? "P"+L : String(L-PROLOGUE_END); }
function chapterOf(L){
  if(L<=PROLOGUE_END) return { pre:"PROLOGUE", name:"The Awakening",
    line:"a hush fell, and every name was forgotten", from:1, to:PROLOGUE_END };
  const A=advOf(L), b=biomeOf(L), ring=Math.floor((A-1)/RING_LEN)+1;
  return { pre:"CHAPTER "+NUMERAL[b]+(ring>1?" \u00b7 RING "+ring:""),
    name:BIOME_NAMES[b], line:CHAPTER_LINE[b],
    from:b*BIOME_LEN+1, to:(b+1)*BIOME_LEN };
}
const BIOME_LEN=20;                          // a country is a chapter, not a backdrop
const RING_LEN=BIOME_LEN*BIOME_NAMES.length; // 300 - one whole walk, floor to summit
function biomeOf(L){ const A=Math.max(1, advOf(L));
  return Math.floor((A-1)/BIOME_LEN)%BIOME_NAMES.length; }
// each place gets living scenery on the plot - quiet, behind the tiles, never in the way
// scenery that drifts across the NIGHT SKY of each place - fireflies, moths, falling
// leaves, snow - quiet, behind the letters, tuned to each region's twilight.
/* WHAT DRIFTS ACROSS EACH SKY. Fifteen countries, fifteen airs - and the walk is legible
   in the scenery alone: butterflies, then falling leaves, then spores, then dragonflies
   over water, then spray, then no sky at all underground, then crystal light, then dust
   off the slope, then snow, then the aurora at the top. The old array had five, so the
   moment there were fifteen countries the board threw on every level past L100. */
const BIOME_DECOR=[
  /* 1 First Clearing - a bright gap in the trees */
  [ {e:"🌿",x:"-6%",y:"-4%",s:84,a:"edge tilt"}, {e:"🍃",x:"82%",y:"-8%",s:70,a:"edge tiltl"}, {e:"🌱",x:"-4%",y:"74%",s:62,a:"edge"},
    {e:"✨",x:"30%",y:"20%",s:10,a:"deco-twinkle"}, {e:"🦋",x:"70%",y:"26%",s:13,a:"deco-sway"} ],
  /* 2 Bramblewood - the thorns close over the path */
  [ {e:"🌿",x:"-8%",y:"-6%",s:96,a:"edge tilt"}, {e:"🌿",x:"78%",y:"-6%",s:90,a:"edge tiltl"}, {e:"🍂",x:"-6%",y:"70%",s:68,a:"edge"},
    {e:"🦋",x:"54%",y:"22%",s:11,a:"deco-bob"}, {e:"✨",x:"28%",y:"14%",s:9,a:"deco-twinkle"} ],
  /* 3 Mosswood - soft and damp, everything furred with moss */
  [ {e:"🌱",x:"-7%",y:"-5%",s:88,a:"edge tilt"}, {e:"🍃",x:"80%",y:"-4%",s:76,a:"edge tiltl"}, {e:"🍄",x:"84%",y:"72%",s:54,a:"edge"},
    {e:"🍃",x:"36%",y:"6%",s:12,a:"deco-fall"}, {e:"🐛",x:"62%",y:"26%",s:11,a:"deco-sway"} ],
  /* 4 Spore Hollow - caps crowding in from the low ground */
  [ {e:"🍄",x:"-8%",y:"62%",s:92,a:"edge"}, {e:"🍄",x:"78%",y:"68%",s:80,a:"edge flip"}, {e:"🌿",x:"-4%",y:"-6%",s:70,a:"edge tilt"},
    {e:"✨",x:"46%",y:"12%",s:10,a:"deco-twinkle2"}, {e:"🍄",x:"30%",y:"28%",s:12,a:"deco-bob"} ],
  /* 5 Listening Pond - lilies riding the waterline */
  [ {e:"🪷",x:"-6%",y:"70%",s:84,a:"edge"}, {e:"🪷",x:"80%",y:"74%",s:70,a:"edge flip"}, {e:"🌾",x:"86%",y:"-2%",s:66,a:"edge tiltl"},
    {e:"✨",x:"40%",y:"14%",s:9,a:"deco-twinkle"}, {e:"🌙",x:"72%",y:"10%",s:14,a:"deco-twinkle2"} ],
  /* 6 Reedmarsh - reeds standing on both banks */
  [ {e:"🌾",x:"-7%",y:"36%",s:104,a:"edge"}, {e:"🌾",x:"82%",y:"32%",s:96,a:"edge flip"}, {e:"🪷",x:"40%",y:"78%",s:58,a:"edge"},
    {e:"🪰",x:"58%",y:"20%",s:10,a:"deco-bob"}, {e:"✨",x:"24%",y:"12%",s:8,a:"deco-twinkle"} ],
  /* 7 Running River - the water will not hold still */
  [ {e:"🌀",x:"-9%",y:"54%",s:96,a:"edge"}, {e:"🌀",x:"80%",y:"20%",s:78,a:"edge flip"}, {e:"💧",x:"44%",y:"-6%",s:60,a:"edge"},
    {e:"💧",x:"30%",y:"10%",s:11,a:"deco-fall"}, {e:"💧",x:"68%",y:"6%",s:9,a:"deco-fall2"} ],
  /* 8 Thunderfalls - falling water down both walls */
  [ {e:"💦",x:"-8%",y:"-8%",s:100,a:"edge"}, {e:"💦",x:"80%",y:"-6%",s:92,a:"edge flip"}, {e:"🌈",x:"32%",y:"62%",s:76,a:"edge"},
    {e:"💦",x:"46%",y:"4%",s:12,a:"deco-fall"}, {e:"✨",x:"64%",y:"24%",s:9,a:"deco-twinkle2"} ],
  /* 9 Undercave - stone teeth hanging from the roof */
  [ {e:"🪨",x:"-8%",y:"-10%",s:96,a:"edge tilt"}, {e:"🪨",x:"78%",y:"-12%",s:88,a:"edge tiltl"}, {e:"🕳️",x:"40%",y:"74%",s:64,a:"edge"},
    {e:"🦇",x:"62%",y:"18%",s:13,a:"deco-bob"}, {e:"✨",x:"26%",y:"24%",s:8,a:"deco-twinkle"} ],
  /* 10 Deep Dark - almost nothing. The dark is the decoration */
  [ {e:"🌑",x:"74%",y:"-6%",s:78,a:"edge"}, {e:"🕳️",x:"-8%",y:"66%",s:84,a:"edge"},
    {e:"✨",x:"44%",y:"30%",s:7,a:"deco-twinkle2"} ],
  /* 11 Glimmer Seams - crystal growing from every corner */
  [ {e:"💎",x:"-7%",y:"-6%",s:86,a:"edge tilt"}, {e:"💎",x:"80%",y:"66%",s:78,a:"edge flip"}, {e:"💎",x:"78%",y:"-8%",s:64,a:"edge tiltl"},
    {e:"✨",x:"40%",y:"22%",s:11,a:"deco-twinkle"}, {e:"✨",x:"62%",y:"10%",s:9,a:"deco-twinkle2"} ],
  /* 12 Scree Slopes - loose rock piled at your feet */
  [ {e:"🪨",x:"-8%",y:"68%",s:88,a:"edge"}, {e:"🪨",x:"76%",y:"72%",s:76,a:"edge flip"}, {e:"⛰️",x:"36%",y:"-8%",s:82,a:"edge"},
    {e:"✨",x:"58%",y:"18%",s:8,a:"deco-twinkle"}, {e:"🪨",x:"24%",y:"26%",s:11,a:"deco-bob"} ],
  /* 13 Windward Ridge - cloud blowing past at eye level */
  [ {e:"☁️",x:"-10%",y:"14%",s:100,a:"edge"}, {e:"☁️",x:"78%",y:"54%",s:88,a:"edge flip"}, {e:"🌬️",x:"36%",y:"-8%",s:76,a:"edge"},
    {e:"🦅",x:"56%",y:"20%",s:13,a:"deco-sway"}, {e:"☁️",x:"20%",y:"40%",s:14,a:"deco-bob"} ],
  /* 14 Snowline - snow banked at the edges, ice reaching down */
  [ {e:"🏔️",x:"-8%",y:"60%",s:96,a:"edge"}, {e:"❄️",x:"80%",y:"-8%",s:82,a:"edge tiltl"}, {e:"🌲",x:"82%",y:"62%",s:70,a:"edge"},
    {e:"❄️",x:"30%",y:"2%",s:12,a:"deco-fall"}, {e:"❄️",x:"64%",y:"4%",s:10,a:"deco-fall2"} ],
  /* 15 Frozen Crown - the summit, and the sky lit up */
  [ {e:"🏔️",x:"-9%",y:"54%",s:104,a:"edge"}, {e:"🌌",x:"70%",y:"-8%",s:96,a:"edge"}, {e:"❄️",x:"-6%",y:"-6%",s:72,a:"edge tilt"},
    {e:"❄️",x:"24%",y:"4%",s:11,a:"deco-fall"}, {e:"⭐",x:"48%",y:"16%",s:11,a:"deco-twinkle2"} ],
];
/* which countries have a painted background sitting in art/bg/. Add a number here the moment
   its file lands and that country stops generating its own sky. */
const BG_ART=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]);
/* ══ THE PAINTING HAS TO BE LOADED BEFORE IT CAN BE SHOWN ══
   Fifteen countries, about 530KB each, and nothing was ever preloaded. Swapping the class
   swaps the CSS url instantly, but a browser keeps painting the OLD image until the new one
   has downloaded and decoded - so walking into a country for the first time showed the
   previous country's art until the file arrived. On a cached country it looked instant, on a
   fresh one it looked like nothing happened. That is the whole of "sometimes the background
   does not change", and it was never a toolbox bug: a real player crossing a border for the
   first time sees exactly the same thing.
   warmBiome resolves once the file is actually decodable. warmAhead quietly fetches the next
   country while you are still playing this one, which is the fix for real players. */
const _warmed = {};
function warmBiome(b){
  if(b<0 || b>=BIOME_NAMES.length) return Promise.resolve();
  if(_warmed[b]) return _warmed[b];
  return _warmed[b] = new Promise(res=>{
    const i = new Image();
    i.onload = i.onerror = () => res();
    i.src = "art/bg/bio" + b + ".jpg";
  });
}
function warmAhead(L){ const b=biomeOf(L); warmBiome(b); warmBiome(b+1); }
/* ══ ALDER'S GROUND IS THE HUD'S OWN SURFACE, AND HIS INK IS MEASURED AGAINST IT ══
   The bar paints with --tile-face, the same token as the top shell, so it turns green,
   brown or violet with the country exactly as the HUD does. That is a CSS matter (see
   #alder). What CSS cannot do is choose the ink, because --tile-face is a GRADIENT:
   there is no single background colour to test against, and a mid-tone country can be
   light at one end of the sweep and dark at the other.

   So the ink is chosen HERE, against every stop of that gradient:
     - pull the stops out of --tile-face
     - for warm-near-black and warm-near-white, score the WORST contrast each achieves
       across all of them
     - take the winner

   Worst-case, not average: a word must stay readable at the dark end of the sweep as
   well as the light end, and an average would happily hide the ends.
   Not #000/#fff - nothing else in this wood is a cold colour. */
/* keep in step with the glass rule - the measurement is only honest if these are the
   haze and brightness the panes actually composite with */
const ALDER_DARK="#241c12", ALDER_LIGHT="#fff8ea", ALDER_HAZE=0.10, ALDER_LIFT=1.06;
/* mean colour of each painting's top band (the region the panes cover), sampled once
   per country and cached - the ink decision has to come from the REAL surface */
const ALDER_BAND={};
function alderTone(){
  const app=document.getElementById("app"); if(!app) return null;
  const hex=c=>{ c=(c||"").trim();
    const m=c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(m){ let h=m[1]; if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
    const r=c.match(/[\d.]+/g); return r ? r.slice(0,3).map(Number) : null; };
  const lum=v=>{ const [r,g,b]=v.map(x=>{ x/=255; return x<=.03928 ? x/12.92 : Math.pow((x+.055)/1.055,2.4); });
    return .2126*r+.7152*g+.0722*b; };
  const ratio=(a,b)=>{ const x=lum(a), y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  const face=getComputedStyle(app).getPropertyValue("--tile-face").trim();
  const stops=(face.match(/#[0-9a-f]{3,6}\b|rgba?\([^)]*\)/gi)||[]).map(hex).filter(Boolean);
  if(!stops.length) stops.push([255,253,246]);            // pre-biome fallback
  /* THE PANES ARE CLEAR GLASS NOW, so the surface behind the words is the PAINTING -
     a thin haze cannot rescue an ink the artwork fights. The token stops stopped
     describing anything real the moment the tint went below ~50%, which is exactly
     why the violet country rendered dark-on-dark: the picker was still reading light
     tokens while the actual backdrop was near-black.
     So the ink comes from the painting itself: the mean colour of the top band of the
     country's own JPEG (sampled once, cached in ALDER_BAND by _sampleBand below),
     composited through the same haze and brightness the CSS applies. Mean, not
     worst-pixel: a 9px blur is live behind the text, and the band's blurred mean is
     what the glyphs truly sit on. A country whose band mixes bright and dark can still
     pinch either ink locally - that residual risk is accepted and measured, not hidden.
     Until the sample lands (first frame, image cache miss) the token fallback below
     keeps the old behaviour; _sampleBand re-runs alderTone the moment it resolves. */
  /* ══ ONE COUNTRY, FOUR SURFACES, FOUR MEASUREMENTS ══
     A single ink for the whole screen was the brown country's failure: the shell sits
     over the painting's bright amber ceiling while the dock sits over its dark floor,
     and any one ink must lose at one end or the other. Each pane is now measured
     against ITS OWN slice of the painting (per-pane means cached by _sampleBand) and
     carries its own ink and its own boost wash - custom properties are set on the pane
     ELEMENT, so its text and its ::before resolve locally while everything outside the
     panes still inherits the app-level pick.
     THE BOOST ESCALATES until the pane actually passes: 0, 16, 30, then 45% wash in
     the winning ink's own polarity. The loop exits on the first strength that clears
     4.5:1, so no pane wears more wash than its slice of art demands - and the reported
     ratio is re-measured after the wash, describing what is truly on screen. */
  const over=(fg,a,bg)=>fg.map((v,i)=>Math.round(v*a + bg[i]*(1-a)));
  const bio=(app.className.match(/\bbio(\d+)\b/)||[])[1];
  const bands=(bio!=null && app.classList.contains("bgart")) ? ALDER_BAND[bio] : null;
  if(!bands && bio!=null && app.classList.contains("bgart")) alderTone._sampleBand(bio);
  const pick=(surface)=>{
    let out=null;
    for(const b of [0, .16, .30, .45]){
      const rd0=ratio(hex(ALDER_DARK),  over([255,255,255], b, surface));
      const rl0=ratio(hex(ALDER_LIGHT), over([0,0,0],       b, surface));
      const useDark = rd0>=rl0;
      out={ ink: useDark?ALDER_DARK:ALDER_LIGHT, r:+Math.max(rd0,rl0).toFixed(2),
            boost: b===0 ? "transparent"
                 : useDark ? "rgba(255,255,255,"+b+")" : "rgba(0,0,0,"+b+")" };
      /* 5.0, not the 4.5 legal floor: a third of these players are older eyes, and a
         pane that lands exactly ON the floor is a pane someone squints at. The next
         boost step is cheap; the squint is not. */
      if(out.r>=5.0) break;
    }
    return out;
  };
  const tokenSurface=over(stops[0], 0.68, [128,128,128]);   // pre-sample fallback
  /* ══ THE HAZE TAKES THE POLARITY THAT SEPARATES IT ══
     The glass was always a WHITE haze, so its presence depended entirely on the backdrop
     being dark. Measured as relative lift, the same material read 378% against the violet
     country and 15% against the opening - twenty-five times weaker in the first levels
     than in the ones it was tuned on, which is why the early countries look washed out
     while the board (which has a real frame) looks like the only solid object.
     So the haze chooses its side the way the ink already does: white over a dark
     backdrop, DARK over a bright one. The pane then separates from whatever is behind
     it rather than only from darkness, and the ink follows the surface as it always has.
     0.34 is the crossover - a backdrop lighter than that gets dark glass. */
  const HAZE_FLIP=0.34;
  /* A DARK PANE HAS TO COMMIT. At the light haze's own strength, black over a bright sky
     still composites to something light - dark enough to look murky, not dark enough for
     pale ink, so the pane ended up dark glass wearing black text. The dark haze therefore
     DEEPENS until warm-white clears the 5.0 target against it, and the ink goes pale to
     match. A pane that chooses to be dark should read as dark, not as dimmed. */
  const paneGlass=k=>{
    const band=bands && bands[k];
    if(!band) return { surface:tokenSurface, dark:false, a:ALDER_HAZE };
    const lit=band.map(v=>Math.min(255,Math.round(v*ALDER_LIFT)));
    if(lum(lit) <= HAZE_FLIP)
      return { surface:over([255,255,255], ALDER_HAZE, lit), dark:false, a:ALDER_HAZE };
    /* 7.0, not the 5.0 floor the light panes use. A dark pane solved to exactly 5:1 is
       legible but flat - the white sits ON the glass instead of shining THROUGH it. The
       extra depth costs nothing (the backdrop is bright, so there is headroom) and it is
       what makes the pane read as a pane rather than as a dimmed patch of sky. */
    for(const a of [0.44,0.54,0.62,0.70,0.78]){
      const surface=over([0,0,0], a, lit);
      if(ratio(hex(ALDER_LIGHT), surface) >= 7.0) return { surface, dark:true, a };
    }
    const a=0.72;
    return { surface:over([0,0,0], a, lit), dark:true, a };
  };
  const surfFor=k=>paneGlass(k).surface;
  /* ══ ONE WASH FOR THE WHOLE TOP GROUP ══ per-pane boosts passed every measurement
     and immediately failed the eye: a pane wearing a 16% wash next to two wearing none
     reads as a DIFFERENT GLASS, and the seams announce it. So the three top panes share
     one wash - the strongest any of them needs - and each pane's ink re-picks against
     that washed surface. Same-polarity by construction when both need help; on the rare
     country where shell and Alder would pull opposite ways, the stronger need wins and
     the other pane's ink flips to whatever survives the shared wash (measured, so it
     always lands >=5 or at the .45 ceiling). The dock is its own pane at the far end of
     the screen - it keeps an independent wash, which no eye will compare across 500px. */
  const needFor=s=>{ for(const b of [0,.16,.30,.45]){
      const rd0=ratio(hex(ALDER_DARK),  over([255,255,255], b, s));
      const rl0=ratio(hex(ALDER_LIGHT), over([0,0,0],       b, s));
      if(Math.max(rd0,rl0)>=5.0) return { b, dir: rd0>=rl0 ? 1 : -1 };
    } return { b:.45, dir: ratio(hex(ALDER_DARK),over([255,255,255],.45,s))
                        >= ratio(hex(ALDER_LIGHT),over([0,0,0],.45,s)) ? 1 : -1 }; };
  const shS=surfFor("shell"), alS=surfFor("alder");
  const ns=needFor(shS), na=needFor(alS);
  let uni = (ns.b===0) ? na : (na.b===0) ? ns
            : (ns.dir===na.dir) ? { b:Math.max(ns.b,na.b), dir:ns.dir }
            : (ns.b>=na.b ? ns : na);
  /* and then ESCALATE: when the two panes pulled opposite polarities, the loser is
     being washed the wrong way, and its best ink can land under target at the chosen
     strength. Pushing the SAME wash harder fixes it - a strong wash in either
     direction carries both surfaces toward one extreme, where one ink beats 5 on both.
     Checked with each pane's best ink re-picked per step, so the loop stops at the
     first strength where the whole group truly passes. */
  { const w0=s=> uni.b===0 ? s : over(uni.dir>0?[255,255,255]:[0,0,0], uni.b, s);
    const best=s=>Math.max(ratio(hex(ALDER_DARK),s), ratio(hex(ALDER_LIGHT),s));
    for(const b of [uni.b, .16, .30, .45]){
      if(b<uni.b) continue;
      const t={ b, dir:uni.dir };
      const w=s=> b===0 ? s : over(t.dir>0?[255,255,255]:[0,0,0], b, s);
      if(best(w(shS))>=5.0 && best(w(alS))>=5.0){ uni=t; break; }
      uni=t;
    } }
  const uniCss = uni.b===0 ? "transparent"
               : uni.dir>0 ? "rgba(255,255,255,"+uni.b+")" : "rgba(0,0,0,"+uni.b+")";
  const washed=s=> uni.b===0 ? s
               : over(uni.dir>0?[255,255,255]:[0,0,0], uni.b, s);
  const inkFor=s=>{ const rd0=ratio(hex(ALDER_DARK),s), rl0=ratio(hex(ALDER_LIGHT),s);
    return { ink: rd0>=rl0?ALDER_DARK:ALDER_LIGHT, r:+Math.max(rd0,rl0).toFixed(2) }; };
  /* the three top panes share ONE haze polarity for the same reason they share one wash:
     side by side, two panes of different glass read as a mistake. The shell's backdrop
     decides, since it is the largest and the topmost. */
  const topGlass = paneGlass("shell");
  const topDark = topGlass.dark;
  /* the gradient carries the SOLVED alpha, not a fixed one - paneGlass deepened it until
     pale ink cleared 5.0, so the painted pane has to be that same depth or the measured
     contrast describes a surface nobody is looking at. The 0.66/0.86 multipliers keep the
     sweep's shape (denser at the top-left, thinner across) around whatever it solved to. */
  const hazeCss = (d,a) => d
    ? "linear-gradient(148deg, rgba(0,0,0,"+a.toFixed(2)+") 0%, rgba(0,0,0,"
      +(a*0.66).toFixed(2)+") 50%, rgba(0,0,0,"+(a*0.86).toFixed(2)+") 100%)"
    : "linear-gradient(148deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.09) 100%)";
  /* ══ THE DOCK IS ALWAYS LIGHT GLASS ══
     It was briefly given the top group's dark polarity so the whole screen would agree,
     and that was wrong for a reason no measurement would have caught: the dock is the one
     pane with OBJECTS in it. Wooden letter tiles, a green breeze, a star - all warm, all
     lit, all drawn to sit on a pale surface. A dark slab fights every one of them, and no
     amount of matching the panes above is worth the tray full of things that stop working.
     The panes above hold text, which can flip polarity freely; this one holds furniture,
     which cannot. So it keeps its light glass in every country. */
  const paneOut={};
  for(const p of [["topshell","shell",shS],["alder","alder",alS],["petbar","pets",null]]){
    const el=document.getElementById(p[0]); if(!el) continue;
    /* ON DARK GLASS THE INK IS WHITE, FULL STOP. Left to the picker, a pane that was
       merely dim still scored better with the dark ink - which is how the opening ended
       up as dark glass wearing black text. The pane's own polarity decides its ink; the
       measurement below is then a check on that decision, not a vote in it. */
    /* the party pane has no text of its own, so it never got an ink - but the empty-seat
       markers live on it and were left inheriting from the app. It takes the shell's ink:
       same glass, same polarity, so a "?" and its "LV 7" match the numbers above them. */
    let t = p[2] ? (topDark
              ? { ink:ALDER_LIGHT, r:+ratio(hex(ALDER_LIGHT), washed(p[2])).toFixed(2) }
              : inkFor(washed(p[2])))
          : { ink: (paneOut.shell && paneOut.shell.ink) || null };
    if(t.ink) el.style.setProperty("--alder-ink", t.ink);
    el.style.setProperty("--glass-boost", uniCss);
    el.style.setProperty("--glass-haze", hazeCss(topDark, topGlass.a));
    if(t.ink) paneOut[p[1]]={ ...t, boost:uniCss, darkGlass:topDark };
  }
  /* The dock keeps the pale glass it always had, in every country - see the note above.
     Its INK is still measured against its own slice of the painting, because the ground
     under it is not the sky above and the words on it have to answer to what is really
     there. Everything else about it is left alone. */
  { const el=document.getElementById("dock");
    if(el){
      const band=bands && bands.dock;
      const surface = band
        ? over([255,255,255], ALDER_HAZE,
               band.map(v=>Math.min(255,Math.round(v*ALDER_LIFT))))
        : tokenSurface;
      const t=pick(surface);
      el.style.setProperty("--alder-ink", t.ink);
      el.style.setProperty("--glass-boost", t.boost);
      el.style.removeProperty("--glass-haze");     // the default pale haze
      el.style.removeProperty("--glass-filter");   // the default saturating filter
      paneOut.dock={ ...t, darkGlass:false }; } }
  /* app-level pick follows Alder's pane - anything outside the panes that reads the
     var gets the middle band's answer rather than an extreme */
  const mid=paneOut.alder||pick(tokenSurface);
  const ink=mid.ink; const rd=mid.r, rl=mid.r;
  app.style.setProperty("--glass-boost","transparent");
  app.style.setProperty("--alder-ink", ink);
  alderTone.panes=paneOut;
  /* THE VESSEL'S FLOOR COLOUR. The basin has to arrive at exactly the shade the ground
     STARTS at, or fading it in only moves the seam instead of closing it. --tile-face
     is a gradient and CSS cannot reach inside one, so the light end is lifted out here
     and handed to the basin as a solid to finish on. */
  const v=stops[0];
  app.style.setProperty("--vessel","rgb("+v.join(",")+")");
  /* THE SCORE BAR'S FILL HAS TO CARRY ITS OWN TEXT. The fill was --frame2, the country's
     mid-brown frame tone, and the cream count printed on it measured 2.67:1 at worst -
     failing in thirteen of fifteen countries. It is the one surface here whose colour is
     NOT the painting's, so it can simply be darkened until it works: the country's own
     hue walked toward its shadow until cream clears 5.0. Keeps the country, loses the
     illegibility. */
  { const f2=hex(getComputedStyle(app).getPropertyValue("--frame2").trim())||[154,111,60];
    const cream=[255,253,243]; let fill=f2;
    for(const k of [0,.25,.45,.62,.75]){
      fill=f2.map(c=>Math.round(c*(1-k)+30*k));
      if(ratio(cream,fill)>=5.0) break;
    }
    app.style.setProperty("--gs-fill","rgb("+fill.join(",")+")"); }
  return { ink, ratio:+Math.max(rd,rl).toFixed(2), stops:stops.length,
           vessel:"rgb("+v.join(",")+")",
           darkWorst:+rd.toFixed(2), lightWorst:+rl.toFixed(2) };
}
/* sample a country's painting into PER-PANE means: the slice behind the shell, behind
   Alder's bar, and behind the dock. The paint is laid cover-fit on a 396x800 stage, so
   the same crop is reproduced here (scale to cover, centre the excess) before the rows
   are read - stretching the whole image to the canvas would sample sky that the crop
   actually threw away. 16 rows of 50 stage-px each: shell y40-98 = rows 0-1, Alder
   y102-144 = rows 2, dock y730-800 = rows 14-15.
   One in-flight guard per country so a slow decode never stacks reads. */
alderTone._sampleBand=function(bio){
  alderTone._busy=alderTone._busy||{};
  if(alderTone._busy[bio] || ALDER_BAND[bio]) return;
  alderTone._busy[bio]=1;
  const im=new Image();
  im.onload=()=>{ try{
    const c=document.createElement("canvas"); c.width=8; c.height=16;
    const x=c.getContext("2d"); x.imageSmoothingQuality="high";
    const iw=im.naturalWidth, ih=im.naturalHeight;
    const scale=Math.max(396/iw, 800/ih);
    const sw=396/scale, sh=800/scale;
    x.drawImage(im,(iw-sw)/2,(ih-sh)/2,sw,sh,0,0,8,16);
    const mean=(r0,r1)=>{ const d=x.getImageData(0,r0,8,r1-r0+1).data;
      let r=0,g=0,b=0,n=0;
      for(let p=0;p<d.length;p+=4){ r+=d[p]; g+=d[p+1]; b+=d[p+2]; n++; }
      return [Math.round(r/n),Math.round(g/n),Math.round(b/n)]; };
    ALDER_BAND[bio]={ shell:mean(0,1), alder:mean(2,2), dock:mean(14,15) };
    alderTone();   // re-pick with the real surfaces in hand
  }catch(e){} delete alderTone._busy[bio]; };
  im.onerror=()=>{ delete alderTone._busy[bio]; };
  im.src="art/bg/bio"+bio+".jpg";
};
function applyBiome(L){
  const app=document.getElementById("app");
  // \d, not \d+, meant bio10 through bio14 were never STRIPPED - they piled up on the
  // element, and which country you appeared to be in came down to CSS source order
  app.className = app.className.replace(/\bbio\d+\b/g,"").trim();
  const b=biomeOf(L);
  // ALWAYS class it, including the first country. bio0 was left bare so that the default
  // palette in :root would show through - which meant the First Clearing, the country
  // every player sees first and longest, was the one place that got no frame, no tinted
  // shelf and none of the country styling. It is a place like the other fourteen.
  app.classList.add("bio"+b);
  /* A PAINTED COUNTRY REPLACES THE GENERATED ONE. BG_ART lists which of the fifteen have a
     painting in art/bg/ - a country without one keeps the gradient sky and its scenery, so
     the two can coexist while the set is filled in. The CSS does the rest. */
  app.classList.toggle("bgart", BG_ART.has(b));
  alderTone();   // the country is on the element now, so his ground can be measured
  // scenery lives UNDER the tiles: first child of the board, rebuilt with each place
  const old=document.getElementById("biodecor"); if(old) old.remove();
  const d=document.createElement("div"); d.id="biodecor";
  BIOME_DECOR[b].forEach(o=>{
    const s=document.createElement("span");
    s.textContent=o.e; s.style.left=o.x; s.style.top=o.y; s.style.fontSize=o.s+"px";
    if(o.a) s.className=o.a;
    d.appendChild(s);
  });
  boardEl.insertBefore(d, boardEl.firstChild);
  // the hush hangs over every fresh clearing - words will thin it (see hud)
  const oldMist=document.getElementById("hushmist"); if(oldMist) oldMist.remove();
  const mist=document.createElement("div"); mist.id="hushmist";  // per-level hush, thins as you score
  boardEl.appendChild(mist);
  /* THE WAKING ARC IS GONE, and it had to go. It dimmed the WHOLE BOARD to
     brightness(0.82) until you owned most of the fifty friends - so a player three friends
     in was looking at every country at 84% brightness and 91% saturation, with a blanket
     grey laid over fifteen palettes that had each been chosen carefully. It made sense when
     the entire game was one continuous moonlit evening and the only story the light told
     was "the wood is asleep". Now the light tells you WHERE YOU ARE: the First Clearing is
     a blue morning, the Deep Dark is nearly black, and a country that ought to be dark is
     dark on purpose rather than by subtraction. Nothing dims the board any more. */
  boardEl.style.filter = "";
}
function isSpike(L){ const A=advOf(L); return A>0 && A%5===0; }
function isMilestone(L){ const A=advOf(L); return A>0 && A%10===0; }
// The first eight levels are hand-tuned - this is the funnel that decides if anyone
// stays. L1 is nearly unloseable; each new power gets an easy level to play with.
/* Retuned after the honest-play audit (50% loss rate at L4-7 was churning the cozy
   audience). Targets assume ~5-8 mostly-3-letter words per level; the first ten
   levels should be ~95% winnable while the game teaches itself. */
/* Clean, round move counts (15 then 20 - never an odd 13). Difficulty rides the
   TARGET, which is what we tune per level; moves stay a familiar multiple of 5.
   Targets are multiples of 5 too, so nothing on screen looks arbitrary. */
/* Retuned again after playtesters - including strong English speakers - called it
   "super hard". A cozy word game must be winnable by pleasant play, not optimal play:
   long words are the JACKPOT, never the requirement. */
const EARLY=[ null,
  [5,15],   // L1 · 🎓 lesson: the drop - one word wins it
  [15,15],  // L2 · 🎓 lesson: the breeze (TEN + GLOW clear it)
  [15,15],  // L3 · 🎓 lesson: the hold, then free play (lesson pays 8 - one more word wins)
  [30,15],  // L4 · spell CAT - the round ends the moment it wakes (30 is the safety net)
  [25,20],  // L5 · CAT's ritual + the Book, then the shelf & paw-meter lesson
  [25,20],  // L6 · spell DOG
  [30,20],  // L7 · two pets
  [35,20],  // L8
];
/* RETUNED against a party that BUILDS, not one that happens to be carried.
   The old curve was written for a game where friends fired twice a round under a cap and
   twenty-six best-friend pairs quietly padded the score. Both are gone, and friends now
   wake to their own signs and grow at milestones, so the ask has to move with them.

   Solved from the modelled win rates the wood is aiming for - generous early, fair in the
   middle, demanding late: ~85% to L25, ~65% through the middle, ~55% past L110, ~50% deep.
   That lands near 110 / 185 / 260 / 325 / 400 / 510 / 625 across L10 to L300, against an
   old curve that topped out at 530 and asked it of a weaker party.

   The steps are deliberately keyed to the growings at 50, 100 and 150: the wood asks for
   more right after your friends become more, so an upgrade is felt as relief rather than
   arriving into a level that was already comfortable. */
/* ══ THE ASK BENDS TO THE PARTY ══
   The original curve was arbitrary - the designer's own words - and it was tuned before
   the fifty friends existed. This taper is SOLVED from measured capacity: 500+ headless
   rounds of a band-resident party (what a player plausibly owns at each depth) against a
   friendless control, on the same seeds. Three rules shaped the knots:
     - the first sixty levels are untouched: they measured correct before pets and still do
     - the ask never dives more than ~a fifth between knots - except entering the Deep
       Dark, where it eases on purpose: no light, and no need of it
     - the friendless control must stay UNDER water everywhere past A60 - if you can win
       without friends, the friends make no sense. The taper floor is set by that rule,
       not by kindness.
   Knots are (adventure level, fraction of the old ask). */
const TAPER_KNOTS = [[60,1.00],[80,0.62],[110,0.52],[140,0.70],[180,0.70],
                     [210,0.47],[240,0.47],[270,0.46],[300,0.46]];
function TAPER(A){
  if(A<=60) return 1;
  const K=TAPER_KNOTS;
  if(A>=K[K.length-1][0]) return K[K.length-1][1];
  for(let i=0;i<K.length-1;i++){
    const [a0,s0]=K[i], [a1,s1]=K[i+1];
    if(A>=a0 && A<=a1) return s0 + (s1-s0)*(A-a0)/(a1-a0);
  }
  return 1;
}
function TARGET(L){
  if(EARLY[L]) return EARLY[L][0];
  const tier = L>=150 ? 3 : L>=100 ? 2 : L>=50 ? 1 : 0;
  // gentle multipliers, because the L^0.75 term ALREADY compounds - the first attempt
  // stacked ×2.00 on top of it and asked 1025 at L300 against a modelled 625
  const base = 35 + 6*Math.pow(L-8, 0.75) * [1, 1.12, 1.28, 1.45][tier];
  return Math.round(base*TAPER(advOf(L))*RHYTHM[(L-1)%5]/5)*5;   // always lands on a multiple of 5
}
/* The budget has to grow with the target. Holding it at 20 forever while the target
   climbed was the real wall: a level-20 board produced 5-8 words in 20 drops and the
   target wanted twelve. Moves rise in clean fives, slowly, so the board still fills up
   and the choice of where to drop still matters. */
function MOVES(L){
  if(EARLY[L]) return EARLY[L][1];
  return L<=14 ? 20 : L<=24 ? 25 : 30;
}
/* ═══ WHERE EACH TROUBLE LIVES ═══
   Troubles used to have a single debut level and then simply accumulate forever, so by the
   late game every board carried the same seven things and the countries were wallpaper.
   Now each one has a HABITAT - the countries it is native to - and it fades in and out
   along the walk. Mountains still have stones: stone is native from the Undercave to the
   summit, seven countries, which is what makes it worth building well.

     at    - the level it first shows its face, ALONE, on an otherwise clean board
     homes - biome indices it lives in. Two ranges means it appears twice in the walk:
             the mist is cave-dark underground and cloud at altitude - same trouble,
             completely different meaning.
     max   - how thick it ever gets
     todo  - behaviour not built yet; the table is the plan, and each one is a flag flip

   The seven new troubles are here so the shape of the whole walk is visible and testable
   before any of them exist. Three are re-skins of things that already work (spore spreads
   like the bramble, crystal is stone that pays gold, scree is stone that splits); the
   genuinely new behaviours are mire, current and wind - and current and wind are one
   engine pointed two ways. */
const TROUBLE={
  branch : { at:10,  homes:[[0,2]],          max:3 },
  bramble: { at:22,  homes:[[1,4]],          max:3 },
  root   : { at:42,  homes:[[2,6]],          max:2 },
  spore  : { at:62,  homes:[[3,5]],          max:3 },
  reed   : { at:82,  homes:[[4,7]],          max:2 },
  mire   : { at:102, homes:[[5,8]],          max:2 },
  current: { at:122, homes:[[6,8]],          max:2 },
  pest   : { at:142, homes:[[7,9]],          max:2 },
  stone  : { at:162, homes:[[8,14]],         max:3 },
  mist   : { at:182, homes:[[9,10],[12,14]], max:3 },
  shroud : { at:186, homes:[[9,10]],         max:2 },   // darkness stays underground
  crystal: { at:202, homes:[[10,12]],        max:3 },
  scree  : { at:222, homes:[[11,13]],        max:3 },
  wind   : { at:242, homes:[[12,14]],        max:2 },
  ice    : { at:262, homes:[[13,14]],        max:3 },
  frost  : { at:282, homes:[[14,14]],        max:2 },
};
/* the ceremony still needs to know what a player has already been taught */
const OBSTACLE_DEBUT={ crate:13 };
for(const k in TROUBLE) OBSTACLE_DEBUT[k]=TROUBLE[k].at;
/* A NAMING CEREMONY TEACHES EXACTLY ONE THING, AND IT IS THE NAME.
   A player meeting the ice for the first time while also being asked to spell a friend
   into being is being taught two things at once, and the ceremony is the one that loses -
   they read the new tile, not the blanks. Worse, the debut levels seed a trouble ALONE
   precisely so it can be understood alone, and a ceremony landing there wrecks both
   lessons at the same time.
   So a ceremony board carries only troubles this player has already met and beaten.
   Strictly already: on the debut level itself the trouble is still new. */
/* the same reasoning as the ceremony filter, for goal rounds: a player on the first special
   round met star tiles (the ask) and gift crates (also collectable, attached to no ask) at
   once. Troubles with no goal of their own are just the country's weather and stay. */
function recipeFor(L, ceremony, goalSeed){
  const r=recipe(L);
  if(ceremony) for(const k of Object.keys(r)) if(!(advOf(L) > (OBSTACLE_DEBUT[k]||0))) r[k]=0;
  if(goalSeed) for(const k of Object.keys(r)) if(k!==goalSeed && OBSTACLE_GOAL[k]) r[k]=0;
  return r;
}
const TROUBLE_KEYS=Object.keys(TROUBLE);
/* the face each trouble wears on a level card */
const TROUBLE_ICON={ branch:"🪾", bramble:"🌿", root:"🪵", spore:"🍄", reed:"🌾", mire:"🟤",
  current:"🌀", pest:"🐛", stone:"🪨", mist:"🌫️", shroud:"🌑", crystal:"💎", scree:"🪨",
  wind:"🌬️", ice:"🧊", frost:"❄❄", crate:"🎁" };
function livesHere(k, b){ return TROUBLE[k].homes.some(h=>b>=h[0] && b<=h[1]); }

function recipe(L){
  const b=biomeOf(L), r={crate:0};
  for(const k of TROUBLE_KEYS) r[k]=0;

  // THE SOLO DEBUT. A trouble meets you by itself, on an otherwise clean board, so it can
  // be understood alone before it ever has to be understood alongside anything else.
  const A=advOf(L);          // every .at below is a player level
  for(const k of TROUBLE_KEYS)
    if(TROUBLE[k].at===A && !TROUBLE[k].todo){ r[k]=2; return r; }

  // then: everything native to this country that you have already met, thickening slowly
  for(const k of TROUBLE_KEYS){
    const t=TROUBLE[k];
    if(t.todo || A<t.at || !livesHere(k,b)) continue;
    r[k]=Math.min(t.max, 1+Math.floor((A-t.at)/22));
  }
  r.crate = (A>=13 && A%3===0) ? 1 : 0;

  // A prefill holds ~18 tiles, so cap the blockers at six and play stays possible.
  // THE OLDEST TROUBLE STEPS BACK FIRST. A rotating trim was arbitrary - it stripped the
  // scree off the Scree Slopes' own neighbour and left one stone on a mountain. Thinning
  // by age instead means a country's SIGNATURE always survives, whatever else is crowding
  // the board, and the things you have known for two hundred levels quietly make room.
  const trim=TROUBLE_KEYS.slice().sort((a,z)=>TROUBLE[a].at-TROUBLE[z].at);
  let total=0; for(const k of TROUBLE_KEYS) total+=r[k];
  for(const k of trim){ while(total>6 && r[k]>0){ r[k]--; total--; } }
  return r;
}

/* =================== SOUND =================== */
