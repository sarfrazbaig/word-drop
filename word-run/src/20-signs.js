/* @module  signs  -  one list of everything a friend can listen for.

   A sign is something the wood notices: a letter lands, a word is made, an obstacle
   gives way. Friends declare wake:{on:<sign>, n:<count>} and Game.sees(<sign>) fires
   them. Every sign the game knows about is in this table and nowhere else.

   ══ THIS WAS FOUR TABLES ══
   WAKE_FREQ sat on Game, SIGN_TITLE and WAKE_WORDS on UI, and the Book's section order
   was a bare array five hundred lines further down - four lists keyed on the same names
   with nothing checking they agreed. Adding a sign meant remembering four places, and
   forgetting one failed quietly rather than loudly: "tool" never got a title, so any
   friend waking on it dropped into a generic bucket in the Book, and "passive" never got
   a noun. Both had been wrong for as long as they had existed and neither ever threw.
   Merging them made those two gaps visible in about a second, which is the whole argument
   for one table. Hush.audit() now checks the rest at boot.

   Each entry says everything about one sign:
     freq  - roughly how often it fires in a round. THE LAW, and the reason this number is
             written down rather than guessed: a consonant lands about fifteen times a
             round and a five-letter word about once, so a friend watching consonants must
             need MANY of them or give very little. Get this wrong and the friend watching
             the commonest event is simply the best friend in the game and no other seat
             is ever worth taking.
     title - the Book's section heading, said in the wood's voice
     noun  - what the count is called on a friend's card ("hard letters")
     order - where it sits in the Book: everyday signs first, rare ones last, so the list
             runs roughly in the order a player meets them */
const SIGNS = {
  drop:      { freq:25,  order: 1, title:"🍂 they stir as you drop",         noun:"tiles dropped", do:"drop a tile" },
  consonant: { freq:15,  order: 2, title:"🪵 they listen for hard letters",  noun:"hard letters", do:"drop a consonant" },
  vowel:     { freq:10,  order: 3, title:"🌾 they listen for soft letters",  noun:"soft letters", do:"drop a vowel - A, E, I, O or U" },
  /* ⚠️ MEASURED AGAINST PLAYERS WHO KNOW THE GAME - and the cut matters more than the
     measurement. My first pass took every round from anyone who reached level 15, which
     dragged the prologue in: those rounds are short, scripted and rigged, and they pulled
     the figure down to 3.68 a round. Filtered properly - players who got past level 20,
     counting only their rounds past level 20 - it is SEVEN. Nearly double.
       all rounds from L15+ players   3.79 a round
       the same players past L6       5.09
       L20+ players, past L20         7.04   <- what these numbers are set to
     The LENGTH MIX barely moves across those cuts (70-72% threes, 25-26% fours, 3.4-4.0%
     five-plus), so the shape of what people spell is solid and only the rate was wrong.
     Thresholds sized against 3.68 asked a knowing player for half of what was intended.
     Thin sample, honestly: 28 rounds, 197 words, 3 players. Treat these as "about" figures
     and do not tune anything to two decimal places against them.
     word3 matches anyWord because the ladder feeds it every word of three letters or more.
     The rows below are still estimates - no telemetry counts a tumble or a thawed stone. */
  anyWord:   { freq: 7.04,order: 4, title:"📖 they stir at any word",         noun:"words", do:"make a word" },
  word3:     { freq: 7.04,order: 5, title:"🌱 they stir at any word",         noun:"words", do:"make a word" },
  word4:     { freq: 2.10,order: 6, title:"🌿 they wait for four letters",    noun:"four-letter words", do:"make a 4-letter word" },
  word5:     { freq: 0.25,order: 7, title:"🌟 they wait for five",            noun:"five-letter words", do:"make a 5-letter word" },
  gold:      { freq: 2,  order: 8, title:"✨ they follow the gold",          noun:"golden letters cleared", do:"clear a golden letter" },
  obstacle:  { freq: 3,  order: 9, title:"🪨 they wake when the way clears", noun:"things cleared away", do:"clear something in the way" },
  crate:     { freq: 1.2,order:10, title:"🎁 they wake at an opened gift",   noun:"gifts opened", do:"open a gift box" },
  cascade:   { freq: 2,  order:11, title:"💫 they wake on a tumble",         noun:"tumbles", do:"make a word from falling tiles" },
  /* ══ THE FLOURISH ══ every rare delight pooled into ONE sign a player can learn: a
     five-letter word, a twin, a cascade word, a palindrome, a rainbow clearing. Separately
     each is a lottery (palindrome 0.13, twin 0.6); pooled they land about once a round,
     and a friend that loves flourishes fires on ANY of them - the rarer the shape, the
     bigger its own bonus. One word to learn instead of five. */
  flourish:  { freq: 0.85,order:11.5, title:"🎇 they live for a flourish",    noun:"flourishes", do:"make a 5-letter word" },
  rare:      { freq: 0.46,order:12, title:"💎 they wake at a rare letter",    noun:"rare letters", do:"use a rare letter - Q, Z, X, J or V" },
  /* THE FIRST SIGN THAT IS ABOUT THE WORD ITSELF rather than about the board. Everything
     above fires because something happened - a tile landed, a stone broke. This one fires
     because of what a word IS, which is the whole point of putting it in a word game.
     Its freq is the lowest in the table by a wide margin and that is measured, not guessed:
     over 552 drops a palindrome was available to spell exactly once. Anything waiting on
     this alone would wait forever, so it pays as a multiplier and wants a friend that
     manufactures the chance. */
  mirror:    { freq: 0.13,order:22, title:"🔄 they wake at a word that reads both ways", noun:"words that read both ways", do:"make a word that reads the same backwards", noun1:"word that reads both ways" },
  tool:      { freq: 3,  order:13, title:"🌬️ they wake when you use a tool", noun:"tools used", do:"use a breeze or a wish" },
  /* ══ THE SHAPE AND MEANING SIGNS ══
     Every freq below is MEASURED from real playtesters (673 words over 183 rounds, dev
     sessions removed), not estimated - which matters because the numbers above it are not.
     Players make 3.68 words a round, and the table above assumes nine, so everything up
     there waits two to three times longer than it was written to. Fix that separately.
     rising / twin / held / gilded have no measurement yet: the engine computed all four and
     threw them away, so nothing has ever counted them. They now travel to the sheet. */
  /* same correction as the word rows: SHARE of words measured, times seven words a round
     rather than the 3.68 the unfiltered cut suggested */
  food:      { freq: 0.07,order:24, title:"🌰 they wake at something good to eat", noun:"good things to eat", do:"make a word that is something to eat" },
  weather:   { freq: 0.11,order:25, title:"🌦️ they wake at the weather",          noun:"weathers named", do:"make a word about the weather" },
  nested:    { freq: 0.82,order:15, title:"🪆 they wake at a word inside a word", noun:"words hiding words", do:"make a word hiding a shorter word", noun1:"word hiding a word" },
  doubled:   { freq: 0.78,order:16, title:"👯 they wake at a doubled letter",     noun:"doubled letters", do:"make a word with a double letter" },
  echo:      { freq: 0.42,order:17, title:"🔁 they wake when a word follows on",  noun:"words that follow on", do:"start a word with the last letter of your last one", noun1:"word that follows on" },
  truename:  { freq: 0.37,order:18, title:"🐾 they wake at a friend's true name", noun:"true names spoken", do:"spell a friend's name" },
  rising:    { freq: null,order:19, title:"🌱 they wake at a word read upward",   noun:"words read upward", do:"make a word reading upwards" },
  twin:      { freq: null,order:20, title:"👬 they wake at two words at once",    noun:"double words", do:"make two words at once" },
  held:      { freq: null,order:21, title:"✋ they wake at a word you kept",       noun:"words kept back", do:"keep a word, then grow it" },
  gilded:    { freq: null,order:23, title:"✨ they wake at a word spending gold",  noun:"golden words", do:"make a word using a golden letter" },
  // not an event at all: the shelf's last section, where the always-on friends live
  passive:   { freq: 0,  order:99, title:"♾️ always awake",                  noun:"play" },
};
/* the three ways the rest of the game asks about a sign. Falling back rather than
   throwing is deliberate - a missing title should cost a player a pretty heading, never
   a crash - but Hush.audit() shouts about it at boot so it never survives to a build. */
const signTitle = s => (SIGNS[s] && SIGNS[s].title) || "🐾 friends";
const signNoun  = (s, fb) => (SIGNS[s] && SIGNS[s].noun) || fb || "play";
/* Every sign's noun is written plural ("words", "hard letters", "golden letters
   cleared"), which reads as "1 more words" the moment a count reaches one. The head
   noun is not always the last word - "golden letters cleared" and "tiles dropped" put a
   participle after it - so singularise the LAST token that is itself a plural, which is
   the head in every phrase in SIGNS. */
function signNounN(s, n, fb){
  const noun=signNoun(s, fb);
  if(n!==1) return noun;
  /* three phrases put their head noun FIRST and a plural later ("words that read both
     ways"), so the rule below would singularise the wrong token. Those carry an explicit
     singular as DATA rather than being guessed at - a grammar engine for three strings
     is the wrong trade. */
  if(SIGNS[s] && SIGNS[s].noun1) return SIGNS[s].noun1;
  const parts=String(noun).split(" ");
  for(let i=parts.length-1;i>=0;i--){
    const w=parts[i];
    if(/(ches|shes|sses|xes)$/i.test(w)){ parts[i]=w.slice(0,-2); return parts.join(" "); }
    if(/[^s]s$/i.test(w)){ parts[i]=w.slice(0,-1); return parts.join(" "); }
  }
  return noun;
}
const SIGN_ORDER = Object.keys(SIGNS).sort((a,b)=>SIGNS[a].order-SIGNS[b].order);

/* =================== WHERE A FRIEND LIVES =================== */
