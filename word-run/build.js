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
// TIERED vocabulary. Short words (3-4 letters) clear by ACCIDENT all the time, so they
// must be strictly familiar — the audit showed lei/nos/vee/sei popping "for" the player,
// which reads as the game cheating. Long words (5+) are essentially always deliberate,
// so they get the full vocabulary: spelling BISTRO must always pay its jackpot.
const subsLines = fs.readFileSync(path.join(__dirname, "freq50k.txt"), "utf8").split(/\r?\n/);
const subsAt = n => subsLines.slice(0, n).map(l => l.split(" ")[0])
  .filter(w => /^[a-z]{3,8}$/.test(w) && enableSet.has(w));
const subsStrict = subsAt(12000), subsWide = subsAt(30000);
const subs = [
  ...[...new Set([...subsStrict])].filter(w => w.length <= 4),
  ...[...new Set([...subsWide])].filter(w => w.length >= 5),
];
// family filter: this is a cozy game that auto-celebrates words with chimes and
// confetti — crude words must never get the fanfare (playtest cleared "ASS" with applause).
const CRUDE = new Set(("ass arse anal anus boob boobs butt clit cock cum dick dildo fag fart hell homo jerk "+
  "kink milf nude oral orgy penis pee piss poo poop porn pube rape scat semen sex sexy shag shit slut smut "+
  "tit tits turd twat vagina wank whore damn crap cunt hoe").split(" "));
const dropTemplate = fs.readFileSync(path.join(__dirname, "word-drop.template.html"), "utf8");
// every grove creature must stay spellable no matter how the frequency lists shift —
// pull their names straight out of the template so the two can never drift apart.
const grove = [...dropTemplate.matchAll(/\{w:"([a-z]+)"/g)].map(m => m[1]);
// g10k is web-frequency: its long tail is fine, but its SHORT tail carries web junk
// (biz, faq...) — hold short words to the same strict spoken-familiarity bar.
const strictShort = new Set(subsStrict.filter(w => w.length <= 4));
const g10kTiered = g10k.filter(w => w.length >= 5 || strictShort.has(w));
const common = [...new Set([...g10kTiered, ...subs, ...grove])].filter(w => !CRUDE.has(w));
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
