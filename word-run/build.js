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
console.log(`Built word-run.html (classic) — ${words.length} words, ${(out.length / 1024 / 1024).toFixed(2)} MB`);

// Word Drop: curated common words so auto-clears feel like real words.
// google-10k (web frequency) has gaps (hut, owl, hen...) so we union it with
// OpenSubtitles top-30k (spoken frequency) — both intersected with ENABLE for validity.
const enableSet = new Set(words);
const g10k = fs.readFileSync(path.join(__dirname, "common10k.txt"), "utf8")
  .split(/\r?\n/)
  .filter(w => /^[a-z]{3,8}$/.test(w) && enableSet.has(w));
// INCLUSIVE, then blocklist. An earlier build held 3-4 letter words to a strict
// frequency tier to stop junk like "lei/nos/vee" clearing — but it also silently
// rejected VARY, OOZE, ORE, OAR, DUNE, FERN, LARK, VALE, DUSK. Players hit those,
// nothing happened, and it read as the game being broken. Rejecting a word a player
// KNOWS is far worse than accepting one they don't. So: take the wide list and
// remove the specific offenders by name.
const subsLines = fs.readFileSync(path.join(__dirname, "freq50k.txt"), "utf8").split(/\r?\n/);
const subsAt = n => subsLines.slice(0, n).map(l => l.split(" ")[0])
  .filter(w => /^[a-z]{3,8}$/.test(w) && enableSet.has(w));
const subs = subsAt(30000);
// obscure/foreign/abbreviation/interjection short words — these are the ones that felt
// like the game cheating when they popped. Everything else short stays in.
const SHORT_JUNK = new Set(("sal hah yah umm ava kat deb nan lam goa guv yum tis ops pow dex tad tsk loo ole "+
  "bah ere yin tao cee lea hag hup hae kip cox wen eta ami ifs fay git taj jag fez lei naw tux cor bey rin "+
  "tam tat tor gob rad hun coz sha yeh ich lux bop hap maw hes tod pia bel lax bot yip bub tau ell pap zee "+
  "dal zed dag luv baa dun nim sos mun ems hao wat pol yon sou yuk lum mor rem fro ria lev vee nos wiz roc "+
  "mir hep lis rei arf oxy ama sae reb fer gan jus nae oft nom yow noo lac ged uns nog mis als bod pom gul "+
  "wop zit sei ora lar oot nee ani zig aga ade ait alp amu ana bant bize cru dei eft eld emu ers gie gju "+
  "hoc ide ilk jee kae kea kex kip koa lek lin lop lur mho mna nim nur oba obi oca ose oud pht pyx qat "+
  "rax reh rho ria rya sab sax sei sri suq syn tav taw tef teg tho thy tid til tod tui tup twa ules uta "+
  "vac vau vig vim vug wab wae wha wis wot wud wye xis yag yay yeh yid yin yob yod zax zek zin zoa").split(/\s+/));
// family filter: this is a cozy game that auto-celebrates words with chimes and
// confetti — crude words must never get the fanfare (playtest cleared "ASS" with applause).
const CRUDE = new Set(("ass arse anal anus boob boobs butt clit cock cum dick dildo fag fart hell homo jerk "+
  "kink milf nude oral orgy penis pee piss poo poop porn pube rape scat semen sex sexy shag shit slut smut "+
  "tit tits turd twat vagina wank whore damn crap cunt hoe").split(" "));
const dropTemplate = fs.readFileSync(path.join(__dirname, "word-drop.template.html"), "utf8");
// every grove creature must stay spellable no matter how the frequency lists shift —
// pull their names straight out of the template so the two can never drift apart.
const grove = [...dropTemplate.matchAll(/\{w:"([a-z]+)"/g)].map(m => m[1]);
// four-letter offenders: proper nouns and transliterations that ENABLE happens to hold
// lowercase. A cozy game celebrating "WYNN" or "RHEA" reads as a broken dictionary.
// Deliberately short and conservative — a wrongly-blocked word is the worse failure,
// and creature names are exempt below no matter what lands in here.
const FOUR_JUNK = new Set(("wynn rhea tiki oyer olio ogee oleo nabe alia inca thor odin loki zeus hera "+
  "juno lyra vega ajax saab xmas raja").split(" "));
const groveSet = new Set(grove);
const common = [...new Set([...g10k, ...subs, ...grove])]
  .filter(w => groveSet.has(w) || (!CRUDE.has(w)
    && !(w.length <= 3 && SHORT_JUNK.has(w))
    && !(w.length === 4 && FOUR_JUNK.has(w))));
// a word the player KNOWS must never be rejected — guard the obvious ones in the build
const MUST = "ooze vary ore oar dune fern lark vale dusk moss glen hush mist reed elm ivy pond brook cove"
  .split(" ").filter(w => enableSet.has(w) && !common.includes(w));
if (MUST.length) { console.warn("!! missing expected words:", MUST.join(" ")); common.push(...MUST); }
const dropOut = dropTemplate.split("__COMMON__").join(common.join(" "));
fs.writeFileSync(path.join(__dirname, "word-drop.html"), dropOut);
fs.writeFileSync(path.join(__dirname, "index.html"), dropOut); // Word Drop IS the game — it owns the root
const docs = path.join(__dirname, "..", "docs"); // GitHub Pages serves /docs on main
if (!fs.existsSync(docs)) fs.mkdirSync(docs);
fs.writeFileSync(path.join(docs, "index.html"), dropOut);
// PWA layer: ship manifest, service worker, and icon alongside the game
["manifest.webmanifest", "sw.js", "icon.svg"].forEach(f => {
  fs.copyFileSync(path.join(__dirname, f), path.join(docs, f));
});
console.log(`Built word-drop.html + index.html + docs/ (game + PWA) — ${common.length} common words, ${(dropOut.length / 1024).toFixed(0)} KB`);
