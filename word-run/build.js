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
fs.writeFileSync(path.join(__dirname, "index.html"), out); // so http://localhost:8123/ opens the game directly
console.log(`Built word-run.html + index.html — ${words.length} words, ${(out.length / 1024 / 1024).toFixed(2)} MB`);

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
const common = [...new Set([...g10k, ...subs])];
const dropTemplate = fs.readFileSync(path.join(__dirname, "word-drop.template.html"), "utf8");
const dropOut = dropTemplate.split("__COMMON__").join(common.join(" "));
fs.writeFileSync(path.join(__dirname, "word-drop.html"), dropOut);
console.log(`Built word-drop.html — ${common.length} common words, ${(dropOut.length / 1024).toFixed(0)} KB`);
