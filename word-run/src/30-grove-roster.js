/* @module  grove  -  the fifty friends as data, plus callings, gates and goals */
// The grove is a living place - every friend is a real creature you might meet in a
// garden or a national park. Spell its name and it comes to live in your grove.
/* PETS ARE THE POWERS. There is no separate powerup bar - your equipped friends
   (up to 4 as your grove grows) act on their own, each waking to ITS OWN taste - what the
   word you just made IS, in shape or in meaning. Not "every few words": that was the shared
   paw meter, and it has been gone since the friends started listening for themselves. Jobs:
   gold  ✨ Golden Touch - turns a tile golden (×3 letter scores)
   align 🍀 Word Weaver  - nudges tiles together to line up a 4+ letter word
   wild  ⭐ Star Gift - a fallen star that matches any letter
   moves 🪽 Second Wind  - flutters in extra moves
   clear 🍂 Tidy Paws    - sweeps away awkward letters
   charm 💖 Sweet Song   - your next word scores double
   hint  🔆 Bright Eyes  - spots a word for you and lights it up
   smash 💥 Boulder Buster - cracks every stone and thaws every ice */
/* ============ 50 FRIENDS, 50 POWERS ============
   Every pet owns a power the base game never gives you. pn/pi/pd = power name/icon/
   description; fx = effect spec (petAct's switchboard); ps:true = PASSIVE, always on
   while on duty (a passive has no taste to wait for - it simply works). */
const GROVE = [
  // your first friends - taught in the early levels (f: = the little plaque on their album card)
  /* THE OPENING PAIR, and the first lesson in how friends work together.
     The cat counts DROPS, not words - that is what lets it act whether or not you just
     succeeded, so it can CAUSE a word instead of only reacting to one. The dog wakes on
     the small word that follows and reaches for a longer one. Cat makes it, dog grows it.
     Note the dog does NOT chase the cat: it chases the WORD, whoever made it. Wiring one
     friend to another would make the dog dead weight the moment the cat rests, and would
     teach "these two are a pair" - which is the authored-pair thinking we removed. */
  {w:"cat",wake:{on:"word3",n:2},echo:"word3",e:"🐱",z:"ground",pn:"Curious Paw",pi:"🐾",pd:"pats a letter on the board into <b>one that fits</b>",fx:{t:"pawPat"},f:"cannot leave a letter alone once it has noticed it"},
  {w:"dog",wake:{on:"anyWord",n:3},echo:"word3",e:"🐶",z:"ground",pn:"Fetch a Word",pi:"🍀",pd:"digs at the board and <b>unearths a longer word</b> for you",fx:{t:"weave"},f:"buries good words and digs them up for you"},
  // in the air
  {w:"bee",wake:{on:"word3",n:2},e:"🐝",z:"sky",pn:"Busy Buzz",pi:"🍯",pd:"buzzes whichever friend is <b>closest to waking</b> - watch the pips",fx:{t:"buzz"},f:"hums the alphabet while she works"},
  {w:"moth",e:"🦋",z:"sky",ps:true,pn:"Drawn to the Light",pi:"🌙",pd:"circles the brightest tiles: <b>gilded and rainbow words pay extra</b>",fx:{t:"mothLight"},f:"cannot help itself around anything that shines"},
  {w:"owl",e:"🦉",z:"sky",ps:true,pn:"Knows What You Meant",pi:"👁️",pd:"one word a round may be <b>one letter wrong</b> - the owl forgives it, and it counts",fx:{t:"owlForgive"},f:"has seen every mistake before, and none of them mattered"},
  {w:"crow",e:"🐦‍⬛",z:"sky",ps:true,pn:"Counts Its Treasure",pi:"🧠",pd:"hoards the shine: <b>+amber for every gold or rainbow</b> letter cleared",fx:{t:"crowHoard"},f:"knows exactly how many shiny things you owe it"},
  {w:"dove",wake:{on:"flourish",n:1},echo:"anyWord",e:"🕊️",z:"sky",pn:"Sweet Song",pi:"💖",pd:"on a <b>flourish</b>, coos it back - your <b>next word scores ×2</b>",fx:{t:"charm",n:1},f:"coos your best words back, twice as sweet"},
  {w:"robin",wake:{on:"anyWord",n:3},e:"🐦",z:"sky",pn:"Morning Chorus",pi:"🎶",pd:"sings the <b>vowel the board wants</b> into your next slot",fx:{t:"robinVowel"},f:"wakes the vowels up every morning"},
  {w:"duck",wake:{on:"anyWord",n:4},echo:"anyWord",e:"🦆",z:"sky",pn:"The Dabble",pi:"🪽",pd:"tips under and comes up with it: your hand becomes <b>the letter the board needs most</b>",fx:{t:"bestHand"},f:"bottoms up, and back with exactly the thing"},
  {w:"swan",wake:{on:"word4",n:2},echo:"word4",e:"🦢",z:"sky",pn:"Swan's Grace",pi:"🩰",pd:"your two <b>oldest letters turn wild</b>",fx:{t:"wildOld",n:2},f:"turns old letters into something graceful"},
  {w:"goose",wake:{on:"anyWord",n:4},echo:"gold",e:"🪿",z:"sky",pn:"Golden Egg",pi:"🥚",pd:"lays a <b>golden E</b> in your hand",fx:{t:"goldenEgg"},f:"guards her golden egg like a secret"},
  {w:"hawk",e:"🦅",z:"sky",ps:true,pn:"Keen Eye",pi:"🎯",pd:"spots where your letter finishes a word - <b>always</b>",fx:{t:"alwaysHint"},f:"sees the word before you drop a letter"},
  {w:"bat",e:"🦇",z:"sky",ps:true,pn:"Read It Backwards",pi:"🔄",pd:"<b>every row reads both ways</b> - and a word that reads the <b>same</b> both ways pays double",fx:{t:"readsBoth"},f:"reads the bottom row backwards for fun"},
  {w:"heron",ps:true,e:"🦩",z:"sky",pn:"Stands Among Reeds",pi:"⏳",pd:"so still the reeds forget it is there: <b>words pass straight through reeds</b>",fx:{t:"reedPass"},f:"stands so still the marsh mistakes it for a reed"},
  {w:"golem",wake:{on:"obstacle",n:3},echo:"obstacle",e:"🗿",z:"sky",pn:"Boulder Buster",pi:"💪",pd:"<b>cracks every stone</b> on the board - and the wind stills while it stands",fx:{t:"crackAll"},f:"was a mountain once, and remembers how mountains break"},
  {w:"fly",wake:{on:"anyWord",n:3},echo:"vowel",e:"🪰",z:"sky",pn:"Comes Right Back",pi:"🍃",pd:"annoying, usefully: <b>re-offers the letter you just dropped</b> in your next slot",fx:{t:"flyReturn"},f:"you cannot get rid of it, and one day that saves you"},
  {w:"ladybug",wake:{on:"anyWord",n:5},echo:"gold",e:"🐞",z:"sky",pn:"Lucky Spot",pi:"🍀",pd:"good luck lands on you: your <b>next word counts as a flourish</b>",fx:{t:"ladybugLuck"},f:"seven spots, and every one of them lucky"},
  {w:"cricket",wake:{on:"cascade",n:1},echo:"cascade",e:"🦗",z:"sky",pn:"Night Chorus",pi:"🎻",pd:"your <b>next cascade chain counts double</b>",fx:{t:"chainBoost"},f:"plays one song and the whole cascade dances"},
  // on the ground
  {w:"fox",wake:{on:"flourish",n:1},e:"🦊",z:"ground",pn:"Too Clever",pi:"✨",pd:"on a <b>flourish</b>, fetches the <b>letter the board wants most</b> into your next slot",fx:{t:"foxFetch"},f:"has already fetched what you were about to need"},
  {w:"frog",wake:{on:"word3",n:3},echo:"cascade",e:"🐸",z:"ground",pn:"Leapfrog",pi:"🔀",pd:"<b>swaps two neighbouring columns</b> whole",fx:{t:"swapCols"},f:"leaps a whole column in one hop"},
  {w:"deer",ps:true,e:"🦌",z:"ground",pn:"Gentle Graze",pi:"🌿",pd:"spell her <b>something to eat</b> and it pays <b>+15</b>",fx:{t:"foodJoy"},f:"grazes the bottom row down to fresh grass"},
  {w:"bear",e:"🐻",z:"ground",ps:true,pn:"Not Your Fault",pi:"🤗",pd:"a <b>lost round is carried</b> - the bear shoulders it, then hibernates until <b>50 of your words</b> wake it",fx:{t:"bearCarry"},f:"would carry you the whole way home, and does"},
  {w:"wolf",wake:{on:"anyWord",n:6},echo:"consonant",e:"🐺",z:"ground",pn:"Rally the Pack",pi:"🌕",pd:"howls, and <b>every friend on duty stirs</b> a step closer to waking",fx:{t:"wolfHowl"},f:"one voice, and the whole pack answers"},
  {w:"hare",wake:{on:"obstacle",n:2},e:"🐇",z:"ground",pn:"The Ways Through",pi:"💨",pd:"briar-born: turns a <b>bramble into a path</b> and finds <b>+1 move</b> in it",fx:{t:"harePath"},f:"was born in the briar patch, thank you very much"},
  {w:"mouse",e:"🐭",z:"ground",ps:true,pn:"The Nibble",pi:"🧀",pd:"drop a <b>near-word</b> and the mouse nibbles the spare letter away - <b>it counts</b> (once a round)",fx:{t:"nibble"},f:"nibbles the extra letter off, every time"},
  {w:"pig",e:"🐷",z:"ground",ps:true,pn:"The Wallow",pi:"🟤",pd:"mire is mud, and mud takes any shape - <b>mire joins your words as any letter</b>",fx:{t:"wallow"},f:"happiest exactly where the ground gives up"},
  {w:"snail",e:"🐌",z:"ground",ps:true,pn:"What Waits, Ripens",pi:"🐌",pd:"camps on your <b>oldest letter</b>: it ripens to <b>gold</b> - left longer still, to <b>rainbow</b>",fx:{t:"ripen"},f:"slow, sure, and everything it sits on sweetens"},
  {w:"worm",wake:{on:"anyWord",n:4},echo:"anyWord",e:"🪱",z:"ground",pn:"The Under-Way",pi:"🌱",pd:"moves the <b>top letter of a tall pile down to the bottom</b> - the rest shuffle up",fx:{t:"wormTunnel"},f:"has been under this wood longer than anyone"},
  {w:"ant",e:"🐜",z:"ground",ps:true,pn:"Many Hands",pi:"📐",pd:"carries many times its weight: <b>every word pays extra for each friend who acted</b> this drop",fx:{t:"antMany"},f:"small, and never once alone"},
  {w:"crab",wake:{on:"word3",n:3},echo:"word3",e:"🦀",z:"ground",pn:"Sidestep",pi:"↔️",pd:"walks the <b>bottom row one step sideways</b> - nothing here stays where you put it",fx:{t:"slideRow"},f:"tidies the bottom row walking sideways"},
  {w:"fish",wake:{on:"flourish",n:1},echo:"gold",e:"🐟",z:"ground",pn:"Rainbow Trout",pi:"🌈",pd:"leaps at a <b>flourish</b> and leaves a <b>RAINBOW letter</b> where it lands",fx:{t:"fishLeap"},f:"all its colours, and it shares them"},
  {w:"snake",e:"🐍",z:"ground",ps:true,pn:"Measures Itself",pi:"🐍",pd:"longest of all, and proud: <b>5+ letter words pay a big bonus</b>",fx:{t:"snakeLong"},f:"lies alongside your best words to check whose is longer"},
  {w:"chick",wake:{on:"anyWord",n:3},echo:"vowel",e:"🐤",z:"ground",pn:"Little Egg",pi:"🐣",pd:"lays a humble egg: your next slot <b>hatches into a letter the board wants</b>",fx:{t:"chickEgg"},f:"so proud of every single egg"},
  {w:"goat",wake:{on:"anyWord",n:5},e:"🐐",z:"ground",pn:"Eats Anything",pi:"🐐",pd:"eats <b>one piece of trouble</b> off the board and digests it into <b>amber</b>",fx:{t:"goatEat",n:5},f:"ice, stone, tin cans - all the same to a goat"},
  {w:"dragon",wake:{on:"word4",n:3},echo:"obstacle",e:"🐉",z:"ground",pn:"The Great Breath",pi:"🔥",pd:"breathes down a row: <b>every letter in it blows one step round</b>, and what falls off the end comes back at the other",fx:{t:"dragonGale"},f:"its breath is the biggest breeze in the wood"},
  {w:"boar",wake:{on:"obstacle",n:2},echo:"cascade",e:"🐗",z:"ground",pn:"Roots It Up",pi:"💥",pd:"tears <b>every root</b> out of the ground and turns them to <b>amber</b>",fx:{t:"boarRoot"},f:"the ground gives up what it was hiding"},
  {w:"moose",e:"🫎",z:"ground",ps:true,pn:"Stands in the River",pi:"🌬️",pd:"antlers part the water: <b>the current cannot drag the board</b> while it stands",fx:{t:"mooseCalm"},f:"the river goes around. it has learned to"},
  {w:"seal",e:"🦭",z:"ground",ps:true,pn:"Hunts by Whisker",pi:"💦",pd:"no light, and no need of it: <b>misted letters still count in your words</b>",fx:{t:"sealWhisker"},f:"closes its eyes to see better"},
  {w:"turtle",e:"🐢",z:"ground",ps:true,pn:"The Shell's Law",pi:"🛡️",pd:"what you hold is home: <b>nothing may creep or hop beside a held word</b>",fx:{t:"turtleShell"},f:"carries its home, and lends you the roof"},
  {w:"beaver",e:"🦫",z:"ground",ps:true,pn:"The Dam",pi:"🪵",pd:"a <b>held</b> word is dammed - when its letters finally clear in a bigger word, <b>the dam breaks and pays</b>",fx:{t:"damBreak"},f:"holds the river back until it is worth letting go"},
  {w:"wyrm",wake:{on:"word4",n:2},echo:"tool",e:"🐍",z:"ground",pn:"Deepdelve",pi:"⛏️",pd:"arms a <b>free pluck</b> - take any letter off the board",fx:{t:"freePluck"},f:"has been under this wood longer than the wood has"},
  {w:"lizard",wake:{on:"rare",n:1},echo:"gold",e:"🦎",z:"ground",pn:"Sunbake",pi:"☀️",pd:"every <b>stone bakes into a golden letter</b>",fx:{t:"stoneGold"},f:"bakes stones into gold on sunny afternoons"},
  {w:"pony",wake:{on:"drop",n:15},echo:"cascade",e:"🐴",z:"ground",pn:"Gallop",pi:"🎠",pd:"the columns gallop into a <b>brand-new order</b>",fx:{t:"shuffleCols"},f:"gallops the columns into a brand-new day"},
  {w:"lamb",wake:{on:"vowel",n:3},echo:"vowel",e:"🐑",z:"ground",pn:"Soft Wool",pi:"☁️",pd:"<b>3 letters soften into vowels</b>",fx:{t:"vowelize",n:3},f:"softens hard letters into gentle vowels"},
  {w:"penguin",wake:{on:"obstacle",n:3},e:"🐧",z:"ground",pn:"The Belly-Slide",pi:"🐧",pd:"slides the ice clean, delighted: <b>every ice on the board thaws a layer</b>",fx:{t:"thawAll"},f:"the whole Snowline is its playground"},
  {w:"skunk",e:"🦨",z:"ground",ps:true,pn:"Proudly Unwelcome",pi:"🦨",pd:"the wood refuses a <b>rude word</b> - the skunk counts it anyway, giggling (once a round)",fx:{t:"skunkCount"},f:"the wood pretends not to laugh. the skunk knows better"},
  {w:"raccoon",e:"🦝",z:"ground",ps:true,pn:"Bin Raider",pi:"🗑️",pd:"trouble you clear pays <b>+2 amber</b> - and every 4th piece, it rummages out <b>a little treasure</b>",fx:{t:"binRaider"},f:"one wood's trash is this fellow's fortune"},
  {w:"phoenix",e:"🦅",z:"ground",ps:true,pn:"Born Again Golden",pi:"🌈",pd:"what the phoenix grants comes back <b>RAINBOW</b> - every <b>wished letter</b> pays its whole word as gold",fx:{t:"rainbowWish"},f:"everything it returns comes back brighter"},
  {w:"spider",wake:{on:"word4",n:2},echo:"mirror",e:"🕷️",z:"ground",pn:"Web Wrap",pi:"🕸️",pd:"wraps your next word in silk: it scores <b>×2 AND refunds its move</b>",fx:{t:"webWrap"},f:"wraps a word so tight it pays double"},
  {w:"bison",wake:{on:"obstacle",n:2},echo:"word4",e:"🦬",z:"ground",pn:"Stampede",pi:"📣",pd:"thunder itself: charges a column and <b>shakes every piece of trouble out of it</b> - the letters hold on",fx:{t:"stampede"},f:"you hear it before you see it"},
];
const GROVE_BY_WORD = {}; GROVE.forEach(g=>GROVE_BY_WORD[g.w]=g);
/* ============ CALLINGS - how a creature notices you ============
   Balatro's lesson, worn picture-book style: you don't find a creature, it finds YOU -
   when you play the way it plays. Every calling is drawn from its own power (the
   woodpecker-hearted beetle hears you crack stones; the bat hears a word echo UP a
   column), so the chase teaches the very mechanic the friend will amplify.
   Meeting a calling SUMMONS the naming level; the name is still always SPELLED.
   The order of this object is also the pity order - the wood grows curious on its own
   if nothing calls for two levels. Early callings are things natural play trips over
   (the Balatro shower); late ones are a deliberate chase. */
const CALLINGS={
  /* ORDERED BY THE DIFFICULTY OF THE NAME ITSELF (computed against the dictionary):
     a prefix that is a valid word forces a HOLD on the build path - CHICK costs two
     (chi→chic), so the humble chick is the FINAL legend of the wood. Clean 3-letter
     names shower early; multi-hold names guard the deep game. The law of the wood:
     if lucky they crack it, else the hint shop will (one day) sell a lantern. */
  /* TIER 1 - the shower: clean names, trivial callings, ~4 friends in 10 levels */
  cat:     {t:"school",   n:1,  c:"finish the lessons of the wood",           s:"🐾 something <b>purrs</b> beyond the lesson…"},
  dog:     {t:"act",      n:3,  c:"watch a friend use its power 3 times",     s:"🐾 something wants to <b>fetch</b> too…"},
  owl:     {t:"hold",     n:4,  c:"hold 4 words with 🌱",                     s:"🌙 something admires your <b>patience</b>…"},
  bee:     {t:"words",    n:35, c:"clear 35 words",                           s:"🍯 something hums along with your <b>busy</b> spelling…"},
  fox:     {t:"score",    n:400,c:"earn 400 points in all",             s:"✨ something is following your <b>gilded trail</b>…"},
  bat:     {t:"upword",   n:2,  c:"clear 2 words that read UPWARD",           s:"🌑 something <b>echoed back</b> from the dark…"},
  /* TIER 2 - the walk: clean 3-4 letter names, moderate callings */
  pig:     {t:"pluck",    n:3,  c:"pluck 3 letters off the board (🌟 wish)",  s:"🍄 something smelled you <b>digging</b>…"},
  moth:    {t:"star",     n:3,  c:"use 3 ⭐ fallen stars in words",           s:"🌌 something is drawn to your <b>starlight</b>…"},
  hare:    {t:"word4",    n:8,  c:"clear 8 four-letter words",                s:"💨 something is racing your <b>quick</b> words…"},
  crow:    {t:"qzxjv",    n:2,  c:"clear 2 words using Q, Z, X, J or V",      s:"⚫ something clever admires your <b>rare letters</b>…"},
  dove:    {t:"jackpot",  n:2,  c:"clear 2 five-letter words",                s:"💫 something cooed at your <b>long, lovely words</b>…"},
  frog:    {t:"regionwin1",n:3, c:"win 3 times in the Bramblewood",           s:"🪷 something is croaking your name in the <b>brambles</b>…"},
  worm:    {t:"breeze",   n:8,  c:"use 8 breezes",                            s:"🌱 something felt you <b>stirring the soil</b>…"},
  duck:    {t:"closewin", n:1,  c:"win with 2 or fewer moves left",           s:"🌊 something flapped in on your <b>second wind</b>…"},
  mouse:   {t:"word3",    n:12, c:"clear 12 little words",                    s:"🧀 something is collecting your <b>crumbs</b>…"},
  swan:    {t:"star",     n:5,  c:"use 5 ⭐ fallen stars",                    s:"🤍 something graceful glides toward your <b>stars</b>…"},
  wolf:    {t:"qzxjv",    n:6,  c:"clear 6 words with rare letters",          s:"🌕 something howled back at your <b>wild letters</b>…"},
  fish:    {t:"regionwin1",n:6, c:"win 6 times in the Bramblewood",           s:"🫧 something shimmers in the <b>bramble shallows</b>…"},
  lamb:    {t:"word4",    n:20, c:"clear 20 four-letter words",               s:"☁️ something soft follows your <b>steady words</b>…"},
  crab:    {t:"breeze",   n:20, c:"use 20 breezes",                           s:"🌊 something sidles along your <b>sideways winds</b>…"},
  /* TIER 3 - the climb: clean longer names and the gentlest 1-hold names */
  snail:   {t:"win",      n:12, c:"win 12 levels",                            s:"🐾 something slow and sure has been <b>following you</b>…"},
  dragon:   {t:"ice",      n:6,  c:"thaw 6 frozen letters",                    s:"💧 something splashed in your <b>thawed waters</b>…"},
  snake:   {t:"wish",     n:8,  c:"transform your letter with 8 🌟 wishes",   s:"🍂 something admires how you <b>shed letters</b>…"},
  bear:    {t:"word5",    n:8,  c:"clear 8 five-letter words",                s:"🍯 something big smelled your <b>feast of words</b>…"},
  goat:    {t:"friends",  n:18, c:"wake 18 friends",                          s:"🔔 something calls to its <b>kindred</b> - you…"},
  pony:    {t:"win",      n:25, c:"win 25 levels",                            s:"🌾 something gallops alongside your <b>long journey</b>…"},
  skunk:   {t:"qzxjv",    n:14, c:"clear 14 words with rare letters",         s:"💨 something respects how you <b>clear the room</b>…"},
  bison:   {t:"act",      n:40, c:"watch friends use their powers 40 times",  s:"💨 something thunders in step with your <b>herd</b>…"},
  lizard:  {t:"regionwin2",n:6, c:"win 6 times in the Mosswood",         s:"🍂 something is sunbathing in the <b>amber light</b>…"},
  turtle:  {t:"win",      n:30, c:"win 30 levels",                            s:"🛡️ something steady has walked <b>every step</b> with you…"},
  spider:  {t:"jackpot",  n:8,  c:"clear 8 five-letter words",                s:"🕸️ something is weaving beside your <b>long words</b>…"},
  beaver:  {t:"hold",     n:24, c:"hold 24 words with 🌱",                    s:"🪵 something is impressed by your <b>building</b>…"},
  hawk:    {t:"chain",    n:6,  c:"set off 6 chain reactions",                s:"🎯 something sharp-eyed watches your <b>cascades</b>…"},
  deer:    {t:"star3",    n:6,  c:"earn 6 ⭐⭐⭐ wins",                       s:"🌱 something gentle grazes near your <b>quiet wins</b>…"},
  seal:    {t:"twin",     n:6,  c:"clear 6 DOUBLE WORDs",                     s:"⚪ something claps for your <b>playful doubles</b>…"},
  /* TIER 4 - the legends: long names, hidden-word names, and the true grinds */
  boar:    {t:"stone",    n:12, c:"smash 12 mossy stones",                    s:"💢 something charges toward the <b>rubble</b>…"},
  robin:   {t:"word4",    n:30, c:"clear 30 four-letter words",               s:"🎶 something sings back at your morning words…"},
  penguin: {t:"day",      n:3,  c:"visit the wood on 3 different days",     s:"❄️ something waddles in when you keep <b>coming back</b>…"},
  goose:   {t:"gold",     n:25, c:"clear 25 golden letters",                  s:"🥚 something golden waddles toward your <b>treasure</b>…"},
  moose:   {t:"word6",    n:3,  c:"clear 3 six-letter words",                 s:"🌲 something MIGHTY bows to your <b>great words</b>…"},
  fly:     {t:"words",    n:150,c:"clear 150 words",                          s:"〰️ something tiny circles your <b>busy board</b>…"},
  ant:     {t:"words",    n:300,c:"clear 300 words",                          s:"🪵 something industrious salutes your <b>work</b>…"},
  raccoon: {t:"crate",    n:8,  c:"burst open 8 gift crates",                 s:"🗑️ something heard you <b>rummaging</b>…"},
  phoenix:{t:"hold",     n:30, c:"hold 30 words with 🌱",                    s:"🌰 something envies your <b>stash</b>…"},
  cricket: {t:"chain3",   n:3,  c:"set off 3 triple chains",                  s:"🎻 something joined your <b>night chorus</b>…"},
  heron:   {t:"bigwin",   n:4,  c:"win 4 times with 10+ moves to spare",      s:"🪶 something admires your <b>patient hunt</b>…"},
  golem:  {t:"stone",    n:20, c:"smash 20 mossy stones",                    s:"🪨 something heard the <b>knocking</b>…"},
  wyrm:  {t:"pluck",    n:12, c:"pluck 12 letters off the board",           s:"🕳️ something respects a fellow <b>digger</b>…"},
  ladybug: {t:"chain",    n:15, c:"set off 15 chain reactions",               s:"🍀 something landed on your <b>lucky</b> chain…"},
  chick:   {t:"twin",     n:12, c:"clear 12 DOUBLE WORDs",                    s:"🥚 something peeps at your <b>twin words</b>…"},
};
// every creature MUST have a calling - a roster edit that forgets one gets a gentle default
GROVE.forEach(g=>{ if(!CALLINGS[g.w]) CALLINGS[g.w]={t:"words",n:40,c:"clear forty words",s:"🐾 something has been watching your words…"}; });

/* ═══ ⚠️ RETIRED AS A GATE, KEPT ONLY AS AN ORDERING ═══
   minL used to be the pace of friendship: the earliest player-level at which a calling
   could arrive, spread so the Clearing gave three friends and the rest came about one
   every five levels. HOME replaced it. A friend is paced by WHERE IT LIVES now, which a
   player can see and an invisible per-creature number never could, and two systems
   describing the same pacing is one that drifts.
   checkCallings no longer reads it. The table survives for one reason only: CALLING_ORDER
   sorts by it, so it still decides the order friends are considered within a country.
   Do not add a number here expecting it to gate anything. */
const CALL_MINL={
  cat:1,
  // Clearing (L1-20): three, and only three
  dog:7, owl:12, bat:17,
  // biomes 2-3 - bee & fox pushed out of the Clearing land here
  bee:23, fox:30, pig:36, moth:44, hare:51, crow:57,
  dove:64, frog:71, duck:77, mouse:84, swan:91, wolf:97,
  fish:105, lamb:112, crab:118, snail:124, snake:131, goat:137,
  pony:145, skunk:152, bison:158, deer:165, seal:172, robin:178,
  penguin:184, goose:191, moose:197, fly:205, ant:212, heron:218, chick:228
};
Object.keys(CALL_MINL).forEach(w=>{ if(CALLINGS[w]) CALLINGS[w].minL=CALL_MINL[w]; });
const CALL_GAP=3;   // never two callings summoned within this many player-levels
/* ═══ KEYSTONES - the friend you are HANDED at a door, never the one you spell ═══
   Two reasons, and the second is the one that matters.

   FIRST, ten of the fifty names cannot be spelled. The telemetry from real players says
   three letters 71% of the time, four 25%, five 4%, and six or more never once. Asking
   somebody to spell SQUIRREL is not a challenge, it is a wall - so every name of six
   letters and up is handed over instead, and its length stops mattering.

   SECOND, a keystone answers the country you are walking INTO, not the one you just left.
   Clear the Undercave and the wood gives you the friend who sees through mist, because the
   Deep Dark is next. You do not get the tool for the room you finished - you get the key
   to the room ahead. That is also why the legendaries land at the last four doors and not
   at the very end: they arrive twenty levels BEFORE the trouble they answer, with a
   country left to enjoy them in. */
const KEYSTONE={
   20:"worm",    /* → root - it loosens the soil so nothing can heal in it   */
   40:"raccoon", /* → spore - Rummage turns the hollow's junk into gifts     */
   60:"boar",    /* → reed - it smashes a whole column, which is the problem */
   80:"ladybug", /* → mire - a wild tile is the way off stuck ground         */
  100:"beaver",  /* → current - it dams a river. The clearest one on the map */
  120:"spider",  /* → pest - it webs what moves                             */
  140:"bear",    /* → stone - it smashes a patch                            */
  160:"hawk",    /* → mist - it sees what you cannot                        */
  180:"lizard",  /* → crystal - Sunbake turns rock to GOLD in the gold country */
  200:"turtle",  /* → scree - a shield, for the slope that fights back      */
  220:"cricket", /* → wind - the ridge is loud, and so is he                */
  240:"dragon",   /* → ice, at the Snowline                                  */
  260:"golem",  /* → deep frost, at the Crown                              */
  280:"wyrm",  /* → everything at once                                    */
  300:"phoenix" /* the hoard, at the summit                                */
};
const KEYSTONE_SET=new Set(Object.values(KEYSTONE));

/* ═══ THE THIRTY GATES ═══
   Two per country: a rehearsal at +10 and the door at +20. A gate never introduces a
   trouble - the country supplies those - it takes something AWAY, and every rule is on
   the card before you commit.

   THE ONE RULE THAT GOVERNS ALL OF THEM: a gate may only take away something the player
   has a surplus of. The first draft of this opened with "three seats" at level 10, where
   a player owns about three friends and has three seats - a rule that reads like a
   challenge and is a no-op. The number that decides it is the BENCH: friends owned minus
   seats available. It is zero at L10, four at L40, thirteen at L100, and forty-five at
   L300. So seat cuts do not begin until the Mosswood, and the early gates take moves and
   tools instead.

   Losing a door costs three levels, not the run - and those three levels are where a
   calling finishes and the friend you were missing arrives. L10 costs nothing at all: it
   is the card teaching you what a gate looks like, at zero stakes. */
const GATE={
   10:{n:"The First Branch",      moves:16, free:1},
   20:{n:"Out of the Clearing",   moves:16, door:1},
   30:{n:"The Short Breath",      moves:20, small:1},
   40:{n:"Out of the Bramblewood",moves:18, door:1},   /* was seats:4 - a no-op once the party IS four */
   50:{n:"The Stubborn Ground",   noWish:1},
   60:{n:"Out of the Mosswood",   seats:3,  door:1},   /* was seats:4 - a no-op once the party IS four */
   70:{n:"The Drifting Air",      moves:18},
   80:{n:"Out of the Spore Hollow",seats:3, door:1},
   90:{n:"The Blocked Way",       moves:20},
  100:{n:"Out of the Pond",       noTools:1, door:1},
  110:{n:"The Ground That Holds", seats:3},
  120:{n:"Out of the Reedmarsh",  seats:3, moves:18, door:1},
  130:{n:"The Moving Board",      moves:20},
  140:{n:"Out of the River",      noWish:1, door:1},
  150:{n:"The Hopping Dark",      seats:3},
  160:{n:"Out of the Thunderfalls",bars:"spider", door:1},
  170:{n:"The Weight of Rock",    moves:18},
  180:{n:"Out of the Undercave",  seats:3, door:1},
  190:{n:"The Unread Board",      moves:20},
  200:{n:"Out of the Deep Dark",  noTools:1, seats:3, door:1},
  210:{n:"The Bright Seam",       small:1},
  220:{n:"Out of the Glimmer Seams",seats:3, small:1, door:1},
  230:{n:"The Sliding Slope",     moves:20},
  240:{n:"Out of the Scree Slopes",seats:3, moves:18, door:1},
  250:{n:"The Gale",              bars:"dragon"},
  260:{n:"Out of the Windward Ridge",bars:"dragon", door:1},
  270:{n:"The First Snow",        moves:20},
  280:{n:"Out of the Snowline",   seats:2, door:1},
  290:{n:"The Last Climb",        seats:3, moves:18, small:1},
  300:{n:"The Frozen Crown",      seats:2, moves:20, noTools:1, door:1},
};
function gateAt(L){ const A=advOf(L); return A>0 ? (GATE[A]||null) : null; }
/* a keystone is never called for - it is given, so it must not also sit in the calling
   queue waiting to be spelled */
/* the window advances in ARRIVAL order now, which is minL order - so a late calling with an
   early slot can no longer sit at the front of the window blocking the ones due before it */
const CALLING_ORDER=Object.keys(CALLINGS).filter(w=>!KEYSTONE_SET.has(w))
  .sort((a,b)=>(CALLINGS[a].minL||999)-(CALLINGS[b].minL||999));
/* ============ LEVEL GOALS - what a round asks of you ============
   The hush (points) is the baseline; obstacle goals make obstacles the WIN CONDITION,
   Candy-Crush style: melt every ice, smash every stone, or lose the round. Each type
   introduces itself SOLO at an authored level, then joins a slow rotation. */
/* v/u/p are for the LINE ALDER SPEAKS: verb, singular unit, plural unit. The bar at the
   top carries the aggregate ("cleared 1/5") and cannot say what the five are, so he
   spells them out - "thaw 3 ice and break 2 stones" - and re-states it as they fall. */
const GOALS={
  hush:   {i:"🎯", s:"points",  n:"still the hush"},
  thaw:   {i:"🧊", s:"ice",     n:"melt every ice",    seed:"ice",   base:3,
           v:"thaw",    u:"ice",       p:"ice"},
  boulder:{i:"🪨", s:"stone",   n:"smash every stone", seed:"stone", base:3,
           v:"break",   u:"stone",     p:"stones"},
  harvest:{i:"✨", s:"gold",    n:"harvest the gold",  seed:"gold",  base:4,
           v:"harvest", u:"gold",      p:"gold"},
  unravel:{i:"🎁", s:"gifts",   n:"open every gift",   seed:"crate", base:2,
           v:"open",    u:"gift",      p:"gifts"},
  lift:   {i:"🌫️", s:"mist",    n:"lift the mist",     seed:"mist",  base:3,
           v:"lift",    u:"mist",      p:"mist"},
  // cut counts DEEDS, not pieces: seed a few tangles and the spread supplies the rest
  cut:    {i:"🌿", s:"tangles", n:"cut the tangles",   seed:"bramble", base:5, fixedSeed:3, slowScale:50,
           v:"cut",     u:"tangle",    p:"tangles"},
  long:   {i:"🏔️", s:"long words", n:"speak long words",  base:3,
           v:"speak",   u:"long word", p:"long words"},
  star:   {i:"⭐", s:"stars",   n:"walk the star course", seed:"wild", base:3,
           v:"walk",    u:"star",      p:"stars"},
  gauntlet:{i:"👑", s:"trial",  n:"the crown trial"},
};
/* WHICH ASK AN OBSTACLE ANSWERS TO. Frost is listed as a thaw because a frost destroyed
   outright never gets to shed its layer into ordinary ice - the round should not punish
   someone for clearing it in one blow instead of two. Root, shroud and pest have no goal
   of their own; they still pay their amber. */
const OBSTACLE_GOAL={ ice:"thaw", frost:"thaw", stone:"boulder", crate:"unravel",
  mist:"lift", bramble:"cut" };
/* derived from the habitat table, so a trouble starts crediting the round the moment its
   behaviour lands - one place to add a trouble, not two */
const OBSTACLE_KINDS=TROUBLE_KEYS.concat("crate");
/* ══ A ROUND MAY ONLY ASK FOR TROUBLE THAT LIVES HERE ══
   The schedule below and the habitat table in TROUBLE both describe when an obstacle may
   appear, and they were authored separately, so they drifted: "melt every ice" was asked at
   A15, in the First Clearing, when ice debuts at A262 in the two snow countries. seedGoal
   converts tiles with no check at all, so the round simply manufactured ice that cannot
   exist. Twenty-four levels were doing this - thaw, boulder, lift and cut.
   The schedule is no longer trusted on its own. Every goal it names is now checked against
   the habitat table, which becomes the single source of truth for where a trouble can be,
   and an illegal ask falls back rather than conjuring the obstacle.
   GOAL_LAG holds the intent that was already written in the comment below and never
   enforced: meet the trouble first, be asked about it a few levels later. */
const GOAL_LAG=3;
function goalLegalAt(gt, A){
  const G=GOALS[gt]; if(!G || !G.seed) return true;   // hush, long: no trouble to place
  const tr=TROUBLE[G.seed]; if(!tr) return true;      // gold and wild are not troubles
  if(A <= tr.at + GOAL_LAG) return false;             // the trouble has not been met yet
  if(!tr.homes) return true;
  const biome=Math.floor((A-1)/BIOME_LEN);
  return tr.homes.some(([lo,hi])=>biome>=lo && biome<=hi);
}
/* what this country CAN be asked, in a stable order - so a fallback is never random */
function legalGoalsAt(A){
  return ["thaw","boulder","unravel","harvest","lift","cut","long","star"]
    .filter(gt=>GOALS[gt] && goalLegalAt(gt,A));
}
/* ══ THE CROWN TRIAL'S TWO ASKS, IN ONE PLACE ══ this lived inline in beginLevel, and when
   the audit grew a check for it the audit had to RE-IMPLEMENT the choice to test it. That
   is the same disease being audited: two pieces of code describing one rule. The trial and
   its auditor now call this, so they cannot disagree about what a crown round asks. */
function gauntletPair(A){
  const pool=legalGoalsAt(A).filter(g=>GOALS[g] && GOALS[g].seed);
  if(!pool.length) return [];
  const gi=Math.floor(A/13);
  return pool.length>=2 ? [pool[gi%pool.length], pool[(gi+1)%pool.length]] : [pool[0]];
}
function goalFor(L){
  const want=goalPlan(L), A=advOf(L);
  if(want==="gauntlet" || want==="hush") return want;
  if(goalLegalAt(want, A)) return want;
  /* the round still wants to ASK something - fall back to what this country can honestly
     offer, keyed off the level so it stays stable across replays of the same round */
  const legal=legalGoalsAt(A);
  return legal.length ? legal[A % legal.length] : "hush";
}
function goalPlan(L){
  L = advOf(L);   // the rounds below are the player's, not the raw counter's
  // authored solo introductions, then one obstacle-goal level per 5-beat cycle.
  // every new goal debuts a few levels after its obstacle does - meet the trouble
  // first, then be asked about it.
  if(L===15) return "thaw";
  if(L===20) return "boulder";
  if(L===32) return "unravel";
  if(L===38) return "harvest";
  if(L===54) return "lift";      // mist arrived at 51
  if(L===58) return "long";
  if(L===79) return "cut";       // brambles arrived at 77
  if(L===84) return "star";
  if(L===107) return "gauntlet"; // 👑 the first crown trial
  if(L>110 && L%20===13) return "gauntlet";  // then one crown per twenty levels
  if(L>20 && L%5===3){
    const pool=["thaw","boulder","unravel","harvest"];
    if(L>54) pool.push("lift");
    if(L>58) pool.push("long");
    if(L>79) pool.push("cut");
    if(L>84) pool.push("star");
    return pool[Math.floor(L/7)%pool.length];
  }
  return "hush";
}
/* ============ BEST FRIENDS - simple, named pair synergies ============
   Put both halves of a duo on duty together and their bonus switches on.
   One line each, no math homework: this is Balatro's joy at picture-book size. */
/* PAIRS lived here - 26 authored best-friend duos, each a passive bonus for owning
   two named creatures together. They went with the paw meter. A pair was a fact about
   the roster rather than a decision at the shelf: it rewarded WHICH TWO you happened to
   own, never what the round in front of you was asking for. Friends help each other
   through their signs now - one friend's gift is another friend's trigger - which is a
   synergy the player builds rather than one we wrote down. */
function dailyWord(){
  const day=Math.floor(Date.now()/864e5);
  const list=GROVE.filter(g=>g.w.length>=4);
  return list[day % list.length].w;
}
/* five powers, five distinct verbs - and each announces how it wants to be used */
/* No powerup bar. Your FRIENDS are the powers - duty slots open as the grove grows. */
/* FIVE SEATS, not four. The fifth arrives at L20, where the bench first genuinely
   outgrows it: by then a player owns eight or nine friends, and choosing between them
   is the beginning of the game having a strategy at all. */
/* what the LEVEL would allow - the ladder, before the wood checks your pockets */
// the locked seats print these very numbers on their silhouettes, so they must be the
// player's levels or the shelf is lying about itself.
/* FOUR, NOT FIVE. A fifth seat let you keep a favourite AND still bring what the round
   wanted; at four the party is a decision every time. It also hands each friend a quarter
   more room, which is what finally made them legible on a small phone. */
function seatsByLevel(L){ const A=advOf(L);
  return A>=14 ? 4 : A>=10 ? 3 : A>=7 ? 2 : 1; }
/* A SEAT YOU CANNOT FILL IS NOT A SEAT. The level opened a second one at L7 whether or
   not the player had met anyone to put in it, so "Room for two!" arrived while they still
   had only the cat - a fanfare for nothing, and it reads as the game losing track of who
   you are. A seat now needs BOTH the level and a friend to sit in it. */
function slotsFor(L){
  // a gate may take a chair away - but never more than the bench can carry, which is the
  // whole reason no seat cut appears before the Mosswood
  const _g=gateAt(L), cap=(_g&&_g.seats)||99;
  // COUNT THE ONES YOU HAVE ACTUALLY MET, not the names you have spoken. A creature enters
  // the grove the moment its name is spelled, but you meet it - and may only then bring it
  // on duty - at the start of the NEXT round. Counting the grove opened a third seat while
  // the third friend was still a name on a page, so the seat sat empty and the fanfare was
  // for nobody. equipToggle gates on metGrove, so this must agree with it.
  const friends = Object.keys((typeof P!=="undefined" && P.metGrove) || {}).length;
  return Math.max(1, Math.min(seatsByLevel(L), friends, cap));
}
/* ══ ARRIVAL DATES, AUTHORED - the retention table ══ Friends arriving faster than seats
   to hold them is how a collection devalues itself (the ten-level replay delivered four
   friends against one seat, and the designer called it: "giving too many pets so early
   and within short spans will kill the game retention"). Each of the first four arrives
   ONE level before its seat opens - meet tonight, room for them tomorrow - and together
   they are the build system's own tutorial: the cat makes a word, the dog digs one up
   and the cat's word visibly charges him, the bee wakes whoever is closest, the robin
   sings in the vowels that feed all three. Four friends, one hum. The subtle friends
   (the mouse's nibble, the moth's shine-love) wait until a thinking player has been
   earned. Friends beyond this table fall back to their HOME depth. */
const FLOOR_AT = { dog:6, bee:9, robin:13, mouse:16, dove:18, chick:23,
                   fox:26, hare:29, moth:34, crow:37 };
const SLOT_MSG={
  2:{t:"Room for two! 🐾", b:"A second friend can come adventuring now. Each one stirs to its own sign, so two of them means two different things to watch for."},
  3:{t:"The pack grows! 🐾", b:"Three friends can join you now. Bring ones that answer to different signs and something is always about to happen."},
  4:{t:"Full party! 🐾", b:"Four friends at once, four signs to watch for. Now the wood is asking you a real question: whose signs suit the round ahead?"},
  /* the fifth seat is retired - four is the full party now */
};
/* The three growings. Every friend you own steps up together - the ones resting at home
   as much as the ones on duty - so a friend you swap in is never behind the one you swap
   out. Levelling only the friends you played would have made swapping cost something, and
   swapping is the whole point. */
const TIER_MSG={
  1:{t:"Your friends have grown 🌿", b:"Something in the wood has deepened. Every friend you have met stirs a little sooner now, and gives a little more when they do."},
  2:{t:"Grown again 🌿", b:"They know your hand by heart. Signs that used to take a while come quicker, and the wood is asking more of you to match."},
  3:{t:"Grown into themselves 🌿", b:"Your friends are as awake as the wood can make them. What comes now, you and they meet together."},
};
