/* Pulls the real tile CSS out of the game so the handbook can render actual tiles rather
   than pictures of them. Scoped under .spec so it cannot collide with the document's own
   styles, and the country palettes are lifted out separately so the swatches can re-theme. */
const fs = require("fs");
const path = require("path");

/* scope: the class the rules get nested under. The caller's container must carry it, or
   nothing applies at all - and the failure is quiet, because a .tile with no base rule is
   simply a zero-height box with the right letter in it. */
function extract(templatePath, scope = ".spec"){
  const src = fs.readFileSync(templatePath, "utf8");

  /* ---- the tile rules themselves ---- */
  // every rule whose selector begins at 2-space indent with .tile or .tw
  const ruleRe = /^ {2}(\.(?:tile|tw)[^{\r\n]*)\{([^}]*)\}/gm;
  let m, rules = [];
  while ((m = ruleRe.exec(src))) rules.push({ sel: m[1].trim(), body: m[2].trim() });

  /* keyframes those rules ask for. A missing keyframe throws no error and fails silently,
     which is how one got deleted out from under three live rules once - so take the ones
     that are actually referenced, and count them so a zero is visible. */
  const used = new Set();
  rules.forEach(r => { const a = r.body.match(/animation:\s*([a-zA-Z0-9_-]+)/g);
    if (a) a.forEach(x => { const n = x.replace(/animation:\s*/, ""); if (n !== "none") used.add(n); }); });
  // keyframe bodies contain their own braces, so match them by counting rather than by regex
  const keyframes = [];
  for (const name of used){
    const at = src.indexOf("@keyframes " + name + "{");
    const at2 = at >= 0 ? at : src.indexOf("@keyframes " + name + " {");
    if (at2 < 0) continue;
    let i = src.indexOf("{", at2), depth = 0, end = -1;
    for (let j = i; j < src.length; j++){
      if (src[j] === "{") depth++;
      else if (src[j] === "}"){ depth--; if (!depth){ end = j; break; } }
    }
    if (end > 0) keyframes.push(src.slice(at2, end + 1));
  }

  /* ---- the fifteen country palettes. Each block closes on the same line as its last
     declaration, so match to the first brace rather than to an indented one. ---- */
  const bioRe = /#app\.bio(\d+)\{([^}]*)\}/g;
  let b, palettes = {};
  while ((b = bioRe.exec(src))) {
    const n = +b[1], body = b[2], p = {};
    for (const v of ["--tile-face","--tile-edge","--tile-ink","--tile-grain"]) {
      const hit = body.match(new RegExp(v.replace(/-/g,"\\-") + "\\s*:\\s*([^;]+);"));
      if (hit) p[v] = hit[1].trim();
    }
    if (Object.keys(p).length === 4) palettes[n] = p;
  }

  /* the :root fallback, for the record */
  const rootBlock = src.match(/:root\{([^}]*)\}/);
  const rootPal = {};
  if (rootBlock) for (const v of ["--tile-face","--tile-edge","--tile-ink","--tile-grain"]) {
    const hit = rootBlock[1].match(new RegExp(v.replace(/-/g,"\\-") + "\\s*:\\s*([^;]+);"));
    if (hit) rootPal[v] = hit[1].trim();
  }

  /* ---- scope every selector under .spec ---- */
  const scoped = rules.map(r => {
    const sels = r.sel.split(",").map(s => ".spec " + s.trim()).join(", ");
    return sels + "{" + r.body + "}";
  }).join("\n");

  return {
    css: scoped + "\n" + keyframes.join("\n"),
    palettes, rootPal,
    ruleCount: rules.length, keyframeCount: keyframes.length
  };
}

module.exports = { extract };

if (require.main === module) {
  const r = extract(path.join(__dirname, "..", "..", "word-drop.template.html"));
  console.log("rules:" + r.ruleCount + " keyframes:" + r.keyframeCount
    + " palettes:" + Object.keys(r.palettes).length
    + " rootPal:" + Object.keys(r.rootPal).length);
  console.log("bio1 face:", r.palettes[1] && r.palettes[1]["--tile-face"].slice(0,50));
}
