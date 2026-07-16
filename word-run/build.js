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
const subs = fs.readFileSync(path.join(__dirname, "freq50k.txt"), "utf8")
  .split(/\r?\n/).slice(0, 30000).map(l => l.split(" ")[0])
  .filter(w => /^[a-z]{3,8}$/.test(w) && enableSet.has(w));
// family filter: this is a cozy game that auto-celebrates words with chimes and
// confetti — crude words must never get the fanfare (playtest cleared "ASS" with applause).
const CRUDE = new Set(("ass arse anal anus boob boobs butt clit cock cum dick dildo fag fart hell homo jerk "+
  "kink milf nude oral orgy penis pee piss poo poop porn pube rape scat semen sex sexy shag shit slut smut "+
  "tit tits turd twat vagina wank whore damn crap cunt hoe").split(" "));
const common = [...new Set([...g10k, ...subs])].filter(w => !CRUDE.has(w));
const dropTemplate = fs.readFileSync(path.join(__dirname, "word-drop.template.html"), "utf8");
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
