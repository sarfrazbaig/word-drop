// Builds word-run.html = template + embedded dictionary (ENABLE list, 2-8 letters)
const fs = require("fs");
const path = require("path");

const SCRATCH = "C:\\Users\\Sarfaraz\\AppData\\Local\\Temp\\claude\\E--Game-Research\\a0385b63-7c06-4135-9df5-1a45f4f2357a\\scratchpad";
const wordsPath = fs.existsSync(path.join(__dirname, "enable1.txt"))
  ? path.join(__dirname, "enable1.txt")
  : path.join(SCRATCH, "enable1.txt");

const words = fs.readFileSync(wordsPath, "utf8")
  .split(/\r?\n/)
  .filter(w => /^[a-z]{2,8}$/.test(w));

const template = fs.readFileSync(path.join(__dirname, "word-run.template.html"), "utf8");
const out = template.split("__DICT__").join(words.join(" "));
fs.writeFileSync(path.join(__dirname, "word-run.html"), out);
console.log(`Built word-run.html (classic) - ${words.length} words, ${(out.length / 1024 / 1024).toFixed(2)} MB`);

// Word Drop: curated common words so auto-clears feel like real words.
// google-10k (web frequency) has gaps (hut, owl, hen...) so we union it with
// OpenSubtitles top-30k (spoken frequency) - both intersected with ENABLE for validity.
const enableSet = new Set(words);
const g10k = fs.readFileSync(path.join(__dirname, "common10k.txt"), "utf8")
  .split(/\r?\n/)
  .filter(w => /^[a-z]{3,8}$/.test(w) && enableSet.has(w));
// INCLUSIVE, then blocklist. An earlier build held 3-4 letter words to a strict
// frequency tier to stop junk like "lei/nos/vee" clearing - but it also silently
// rejected VARY, OOZE, ORE, OAR, DUNE, FERN, LARK, VALE, DUSK. Players hit those,
// nothing happened, and it read as the game being broken. Rejecting a word a player
// KNOWS is far worse than accepting one they don't. So: take the wide list and
// remove the specific offenders by name.
/* ══ THE CUT IS TIERED BY LENGTH, because junk only hurts where words form BY ACCIDENT ══
   One flat cut at rank 30000 governed every length, and it refused SHAKERS (rank 37110)
   while accepting SHAKER (21124) and SHAKES. A playtester spent a breeze and a wish
   filling a whole row with the rarest thing this game has - seven letters on a seven-wide
   board - and the game did nothing. Across every session ever logged, players have made
   777 three-letter words, 256 four, 28 five, 6 six, and exactly ONE seven. He was
   reaching for the rarest play in the game and the dictionary was the thing that stopped
   him. SLURP missed by 514 places.

   The fear behind the flat cut was obscure words auto-clearing and reading as the game
   cheating. That fear is real at three and four letters, where gravity drops tiles into
   accidental words every round. It is imaginary at seven and eight: a 7-letter word needs
   an entire row of exactly the right letters, an 8-letter word an entire column. Nothing
   lands there by chance. So the long end can open all the way to ENABLE, and the short
   end keeps the strict cut and the blocklist below.

   3-4 letters  rank 30000 + SHORT_JUNK/FOUR_JUNK  - where accidents happen, stay strict
   5-6 letters  rank 50000                          - deliberate, but still plausible junk
   7-8 letters  all of ENABLE                       - never an accident, never refuse it */
const subsRank = new Map();
fs.readFileSync(path.join(__dirname, "freq50k.txt"), "utf8").split(/\r?\n/)
  .forEach((line, i) => { const w = line.split(" ")[0]; if (!subsRank.has(w)) subsRank.set(w, i + 1); });
const cutFor = len => len <= 4 ? 30000 : len <= 6 ? 50000 : Infinity;
const subs = words.filter(w => w.length >= 3 && (subsRank.get(w) || Infinity) <= cutFor(w.length));
// obscure/foreign/abbreviation/interjection short words - these are the ones that felt
// like the game cheating when they popped. Everything else short stays in.
const SHORT_JUNK = new Set(("sal hah yah umm ava kat deb nan lam goa guv tis ops dex tsk ole "+
  "bah ere yin tao cee lea hup hae kip cox wen eta ami ifs fay taj jag lei naw cor bey rin "+
  "tam tat tor gob rad hun coz sha yeh ich lux bop hap maw hes tod pia bel yip bub tau ell pap zee "+
  "dal zed dag luv baa dun nim sos mun ems hao wat pol yon sou yuk lum mor rem fro ria lev vee nos roc "+
  "mir hep lis rei arf oxy ama sae reb fer gan jus nae oft nom yow noo lac ged uns nog mis als bod pom gul "+
  "wop sei ora lar oot nee ani zig aga ade ait alp amu ana bant bize cru dei eft eld ers gie gju "+
  "hoc ide jee kae kea kex kip koa lek lin lop lur mho mna nim nur oba obi oca ose oud pht pyx qat "+
  "rax reh rho ria rya sab sax sei sri suq syn tav taw tef teg tho tid til tod tui tup twa ules uta "+
  "vac vau vig vug wab wae wha wis wot wud wye xis yag yay yeh yid yin yob yod zax zek zin zoa").split(/\s+/));
// family filter: this is a cozy game that auto-celebrates words with chimes and
// confetti - crude words must never get the fanfare (playtest cleared "ASS" with applause).
/* Two holes in this list, both live in the build testers are playing right now:
   "sshit" is a typo for "shit", so SHIT and SHITS have always cleared with full fanfare,
   and BITCH was never on it at all. The long entries below are new - opening 7-8 letters
   to all of ENABLE above admits BULLSHIT, ASSHOLES and thirty others, and this list was
   written when nothing over six letters could get in. Blocking is by exact word, so every
   inflection has to be spelled out. */
const CRUDE = new Set(("ass arse anal anus boob boobs butt clit cock cum dick dildo fag fart hell homo jerk "+
  "kink milf nude oral orgy penis pee piss poo poop porn pube rape scat semen sex sexy shit slut smut "+
  "tit tits turd twat vagina wank whore damn crap cunt hoe "+
  /* the plurals and inflections the singular never covered */
  "shits shitty shite bitch bitches bitchy arses anuses butts cocks dicks dildos fags farts jerks "+
  "nudes orgies pees pisses poops pubes rapes rapist rapists semens slurs sluts smutty tits turds "+
  "twats vaginas wanks whores craps damned damning hells homos kinky milfs "+
  /* seven and eight letters, admitted for the first time by the tier change above */
  "asshole assholes bastard bastards bollocks bugger buggers buggered bullshit condom condoms "+
  "erection erections erotica fucking fucked fucker fuckers genital genitals hooker hookers "+
  /* SCREWED and SCREWING are deliberately absent: their plain sense is a screwdriver and a
     shelf, and the rule at the top of this file is that wrongly refusing a word a player
     knows is the worse failure. Blocked only where the crude reading is the only reading. */
  "humping orgasm orgasms orgasmic pissing pissed scrotum shagged shagging shitting "+
  "shitted sluttish stripper strippers titties boobies urinate urinal wanker wankers wanking "+
  "whoring whorish").split(/\s+/));
const dropTemplate = fs.readFileSync(path.join(__dirname, "word-drop.template.html"), "utf8");
// every grove creature must stay spellable no matter how the frequency lists shift -
// pull their names straight out of the template so the two can never drift apart.
const grove = [...dropTemplate.matchAll(/\{w:"([a-z]+)"/g)].map(m => m[1]);
// four-letter offenders: proper nouns and transliterations that ENABLE happens to hold
// lowercase. A cozy game celebrating "WYNN" or "RHEA" reads as a broken dictionary.
// Deliberately short and conservative - a wrongly-blocked word is the worse failure,
// and creature names are exempt below no matter what lands in here.
const FOUR_JUNK = new Set(("wynn rhea tiki oyer olio ogee oleo nabe alia inca thor odin loki zeus hera "+
  "juno lyra vega ajax saab xmas raja").split(" "));
const groveSet = new Set(grove);
const common = [...new Set([...g10k, ...subs, ...grove])]
  .filter(w => groveSet.has(w) || (!CRUDE.has(w)
    && !(w.length <= 3 && SHORT_JUNK.has(w))
    && !(w.length === 4 && FOUR_JUNK.has(w))));
// a word the player KNOWS must never be rejected - guard the obvious ones in the build
/* QUIP is here because a playtester made it and nothing happened. It is four letters, so
   the strict short cut still governs it, and it appears in NEITHER frequency list - no
   amount of tiering reaches a word the corpora simply do not contain. MIRE and SCREE are
   here for the reason REED and GLEN already were: the game prints them at the player as
   the name of an obstacle and a country, and a game must be able to spell its own world. */
/* ICK joins them for the same reason: a playtester spelled it, nothing happened, and they
   filed it as a bug. It is in ENABLE, so it is a word by this game's own source; it was
   only ever missing because the frequency corpora rank interjections low. Judgement call
   made without the designer present - remove the token to reverse it.
   NON is deliberately NOT here. It is absent from ENABLE entirely, so by the game's own
   dictionary it is not a word, and it reads as a prefix rather than something to spell. */
const MUST = ("ooze vary ore oar dune fern lark vale dusk moss glen hush mist reed elm ivy pond brook cove "+
  "quip mire scree ick")
  .split(" ").filter(w => enableSet.has(w) && !common.includes(w));
if (MUST.length) { console.warn("!! missing expected words:", MUST.join(" ")); common.push(...MUST); }
// ONE STAMP, TWO CONSUMERS. It was computed further down for the service worker only; the
// telemetry needs the same value, and it has to exist before the game HTML is written. A
// second Date.now() here would drift by a millisecond and give the two a different id.
const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
const dropOut = dropTemplate.split("__COMMON__").join(common.join(" "))
                            .split("__TELEBUILD__").join(stamp);
/* ══ A BUILD THAT DOES NOT PARSE MUST NOT SHIP ══ the template is one enormous inline
   script, so a single stray token anywhere in it makes the WHOLE game a blank page - no
   Game, no P, no error the player would ever see reported. It has happened: an edit put a
   statement between an `if` and its `else`, the build reported success, wrote every output
   file, stamped a new service worker, and the result was a title bar and nothing else.
   The build now parses what it is about to write and refuses if it cannot. */
{
  const vm = require("vm");
  const scripts = dropOut.match(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g) || [];
  let checked = 0;
  for(const block of scripts){
    const body = block.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    if(!body.trim()) continue;
    try{ new vm.Script(body); checked++; }
    catch(err){
      console.error("!! BUILD REFUSED - the game would not parse:");
      console.error("   " + err.message);
      console.error("   nothing was written. fix the syntax and build again.");
      process.exit(1);
    }
  }
  console.log(`Parsed ${checked} inline script${checked===1?"":"s"} - the build runs`);
}
fs.writeFileSync(path.join(__dirname, "word-drop.html"), dropOut);
fs.writeFileSync(path.join(__dirname, "index.html"), dropOut); // Word Drop IS the game - it owns the root
const docs = path.join(__dirname, "..", "docs"); // GitHub Pages serves /docs on main
if (!fs.existsSync(docs)) fs.mkdirSync(docs);
fs.writeFileSync(path.join(docs, "index.html"), dropOut);
// PWA layer: ship manifest, service worker, and icon alongside the game
// Icons ship as PNG because Play and Android launchers need raster, not vector. The set is
// regenerated from the one source SVG by tools/icon-forge.html - missing ones are warned
// about rather than fatal, so a build never breaks just because an icon hasn't been forged.
const ASSETS = ["manifest.webmanifest", "icon.svg",
  "icon-192.png", "icon-512.png", "icon-192-maskable.png", "icon-512-maskable.png"];
const missingIcons = [];
ASSETS.forEach(f => {
  const src = path.join(__dirname, f);
  if (!fs.existsSync(src)) { missingIcons.push(f); return; }
  fs.copyFileSync(src, path.join(docs, f));
});
if (missingIcons.length) {
  console.warn("!! icons not forged yet: " + missingIcons.join(", "));
  console.warn("   open tools/icon-forge.html, click Forge, and move the PNGs into word-run/");
}
// PET ART: the painted friends live in art/pets/. The dev server serves them straight from
// word-run/, but GitHub Pages serves /docs - so mirror them into docs/art/pets on every build,
// or the deployed site shows broken portraits while localhost looks fine.
const petsSrc = path.join(__dirname, "art", "pets");
if (fs.existsSync(petsSrc)) {
  const petsDst = path.join(docs, "art", "pets");
  fs.mkdirSync(petsDst, { recursive: true });
  const pngs = fs.readdirSync(petsSrc).filter(f => f.endsWith(".png"));
  pngs.forEach(f => fs.copyFileSync(path.join(petsSrc, f), path.join(petsDst, f)));
  console.log(`Copied ${pngs.length} pet portraits → docs/art/pets`);
} else {
  console.warn("!! no art/pets folder - pets will fall back to emoji");
}
// THE FIFTEEN PAINTED COUNTRIES. Same reason as the portraits: the dev server serves
// word-run/ but Pages serves /docs, so a background that looks right on localhost is a
// broken image on the deployed site unless it is mirrored here.
const bgSrc = path.join(__dirname, "art", "bg");
if (fs.existsSync(bgSrc)) {
  const bgDst = path.join(docs, "art", "bg");
  fs.mkdirSync(bgDst, { recursive: true });
  const imgs = fs.readdirSync(bgSrc).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  let bytes = 0;
  imgs.forEach(f => {
    fs.copyFileSync(path.join(bgSrc, f), path.join(bgDst, f));
    bytes += fs.statSync(path.join(bgSrc, f)).size;
  });
  console.log(`Copied ${imgs.length} country backgrounds → docs/art/bg (${(bytes / 1048576).toFixed(1)} MB)`);
} else {
  console.warn("!! no art/bg folder - countries will draw their own gradient skies");
}
// the service worker is STAMPED, not copied: a fixed cache name means the browser sees an
// identical sw.js each deploy, never installs a new worker, and never drops the old cache -
// so a playtester keeps a stale build while you push fixes they never get. Stamping the
// file makes it differ every build, which forces install → activate → old caches deleted.
/* The worker template lives in sw.src.js and BOTH workers are written from it.
   Only docs/sw.js used to be stamped, so the dev server's own sw.js kept the literal
   cache name "hushwood-__BUILD__" forever: it never changed, so the browser never
   installed a new worker, never dropped the old cache, and served the same stale game
   no matter how many times the template was rebuilt. Every "why does it still look
   old?" in this project traces back to these two lines. */
const swSrc = path.join(__dirname, "sw.src.js");
const sw = fs.readFileSync(fs.existsSync(swSrc) ? swSrc : path.join(__dirname,"sw.js"), "utf8")
             .split("__BUILD__").join(stamp);
fs.writeFileSync(path.join(docs, "sw.js"), sw);
fs.writeFileSync(path.join(__dirname, "sw.js"), sw);   // the one the dev server serves
console.log(`Service worker stamped ${stamp} - every tester picks this build up`);
console.log(`Built word-drop.html + index.html + docs/ (game + PWA) - ${common.length} common words, ${(dropOut.length / 1024).toFixed(0)} KB`);
