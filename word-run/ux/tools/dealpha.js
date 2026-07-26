/* Turns generated art into game-ready PNGs with real alpha.

   Image generators do not produce alpha. They produce an opaque image, and when you ask for
   "transparent background" they paint a checkerboard, because that is what transparency looks
   like in every screenshot they were trained on. So the background has to be something we can
   remove on purpose.

   Three modes, and which one to use depends on what the asset is:

     chroma   a flat keyable colour behind an OPAQUE object - the tile face, the obstacle
              bodies, the damage states. Keeps the subject's own greys and colours intact and
              gives a hard edge.

     luma     a BLACK background behind a WHITE subject, for things that are meant to be
              semi-transparent overlays - ice, frost, mist. Alpha comes from brightness, which
              is exactly how a frost overlay should behave: thick crystals opaque, thin edges
              faint. No keying artefacts, no halo, and soft edges for free.

     checker  salvage only. Detects a painted checkerboard and removes it. Works on hard-edged
              full-colour subjects and fails on anything soft or grey, because a grey subject
              pixel sitting on a grey checker square is genuinely ambiguous - there is no
              information left to recover. Reports its own confidence; do not trust a low one.

   Usage:
     node ux/tools/dealpha.js <in.png> <out.png> --mode=luma
     node ux/tools/dealpha.js <in.png> <out.png> --mode=chroma --key=ff00ff --tol=90
     node ux/tools/dealpha.js <in.png> <out.png> --mode=checker
     node ux/tools/dealpha.js <in.png> --report          (just tell me what this file is)
*/
const fs = require("fs");
const path = require("path");
const { PNG } = require(path.join(__dirname, "..", "..", "node_modules", "pngjs"));

const args = process.argv.slice(2);
const inPath = args[0];
const outPath = args[1] && !args[1].startsWith("--") ? args[1] : null;
const opt = k => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : null; };
const has = k => args.includes("--" + k);

if (!inPath){ console.error("need an input png"); process.exit(1); }
const png = PNG.sync.read(fs.readFileSync(inPath));
const { width: W, height: H, data: D } = png;
const at = (x,y) => (W*y + x) << 2;

/* ---------- report: what is actually in this file ---------- */
function report(){
  let opaque = 0, clear = 0, partial = 0, grey = 0, coloured = 0;
  let min = 255, max = 0;
  for (let i = 0; i < D.length; i += 4){
    const a = D[i+3];
    if (a === 255) opaque++; else if (a === 0) clear++; else partial++;
    if (a < min) min = a; if (a > max) max = a;
    const r = D[i], g = D[i+1], b = D[i+2];
    if (Math.max(r,g,b) - Math.min(r,g,b) <= 8) grey++; else coloured++;
  }
  const n = W*H;
  const pc = v => (v/n*100).toFixed(1) + "%";
  console.log("  size          " + W + "x" + H);
  console.log("  alpha range   " + min + " to " + max);
  console.log("  fully opaque  " + pc(opaque));
  console.log("  fully clear   " + pc(clear));
  console.log("  partial       " + pc(partial));
  console.log("  greyscale px  " + pc(grey) + "   coloured px " + pc(coloured));
  const realAlpha = clear > n*0.005 || partial > n*0.005;
  console.log("  VERDICT       " + (realAlpha
    ? "has real alpha (" + pc(clear+partial) + " of pixels are not fully opaque)"
    : "NO real alpha - every pixel is opaque, so any 'transparency' is painted into the image"));
  if (!realAlpha) console.log("                " + detectChecker().summary);
  return realAlpha;
}

/* ---------- is there a painted checkerboard, and what is its period? ---------- */
function detectChecker(){
  // a checkerboard is two alternating greys on a regular grid. Look along the top row for a
  // repeating two-tone pattern, since the corner is the most likely place to be background.
  const lum = (x,y) => { const i = at(x,y); return (D[i]*0.299 + D[i+1]*0.587 + D[i+2]*0.114); };
  let best = null;
  for (let p = 4; p <= 64; p++){
    let score = 0, n = 0;
    for (let x = 0; x + p < Math.min(W, 160); x++){
      const a = lum(x, 2), b = lum(x + p, 2);
      score += Math.abs(a - b) < 6 ? 1 : 0; n++;            // same phase, should match
      const c = lum(x, 2), d = lum(x + Math.floor(p/2), 2);
      score += Math.abs(c - d) > 8 ? 1 : 0; n++;            // half phase, should differ
    }
    const s = score / n;
    if (!best || s > best.s) best = { p, s };
  }
  const tones = {};
  for (let y = 0; y < 6; y++) for (let x = 0; x < Math.min(W,120); x++){
    const v = Math.round(lum(x,y)/4)*4; tones[v] = (tones[v]||0)+1;
  }
  const top = Object.entries(tones).sort((a,b)=>b[1]-a[1]).slice(0,2).map(t=>+t[0]);
  return { period: best.p, confidence: best.s, tones: top,
    summary: best.s > 0.8
      ? "looks like a painted checkerboard, period about " + best.p + "px, tones " + top.join(" and ")
      : "no clear checkerboard found either - the background may be flat or painted scenery" };
}

if (has("report") || !outPath){ console.log(path.basename(inPath)); report(); process.exit(0); }

/* ---------- the three modes ---------- */
const mode = opt("mode") || "luma";
const out = new PNG({ width: W, height: H });
let touched = 0;

if (mode === "chroma"){
  const key = opt("key") || "ff00ff";
  const kr = parseInt(key.slice(0,2),16), kg = parseInt(key.slice(2,4),16), kb = parseInt(key.slice(4,6),16);
  const tol = +(opt("tol") || 90);
  for (let i = 0; i < D.length; i += 4){
    const d = Math.hypot(D[i]-kr, D[i+1]-kg, D[i+2]-kb);
    // a soft band at the edge of the key range, so the cut is not jagged
    let a = d < tol ? 0 : d < tol*1.6 ? Math.round(255 * (d - tol) / (tol*0.6)) : 255;
    out.data[i] = D[i]; out.data[i+1] = D[i+1]; out.data[i+2] = D[i+2]; out.data[i+3] = a;
    if (a < 255) touched++;
  }
} else if (mode === "luma"){
  /* white subject on black: brightness IS opacity, and the colour becomes flat white so the
     game can tint it. This is the only mode that gives honest soft edges. */
  const gain = +(opt("gain") || 1);
  const floor = +(opt("floor") || 6);
  for (let i = 0; i < D.length; i += 4){
    const l = D[i]*0.299 + D[i+1]*0.587 + D[i+2]*0.114;
    let a = Math.max(0, Math.min(255, Math.round((l - floor) * gain * 255 / (255 - floor))));
    out.data[i] = 255; out.data[i+1] = 255; out.data[i+2] = 255; out.data[i+3] = a;
    if (a < 255) touched++;
  }
} else if (mode === "checker"){
  const c = detectChecker();
  if (c.confidence < 0.7){
    console.error("  refusing: no checkerboard detected with any confidence (" + c.confidence.toFixed(2) + ")");
    console.error("  " + c.summary);
    process.exit(2);
  }
  const p = c.period, [t1, t2] = c.tones.sort((a,b)=>a-b);
  const lum = (x,y) => { const i = at(x,y); return (D[i]*0.299 + D[i+1]*0.587 + D[i+2]*0.114); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const i = at(x,y);
    const phase = (Math.floor(x/p) + Math.floor(y/p)) % 2;
    const expect = phase ? t2 : t1;
    const r = D[i], g = D[i+1], b = D[i+2];
    const isGrey = Math.max(r,g,b) - Math.min(r,g,b) <= 10;
    const near = Math.abs(lum(x,y) - expect) < 10;
    const a = (isGrey && near) ? 0 : 255;
    out.data[i] = r; out.data[i+1] = g; out.data[i+2] = b; out.data[i+3] = a;
    if (a < 255) touched++;
  }
  console.log("  checker period " + p + "px, tones " + t1 + "/" + t2 + ", confidence " + c.confidence.toFixed(2));
  console.log("  WARNING: any part of the subject that is grey and happens to match a checker");
  console.log("  square has been cut away too. Check the result before using it.");
} else {
  console.error("unknown mode " + mode); process.exit(1);
}

fs.writeFileSync(outPath, PNG.sync.write(out));
console.log("  wrote " + path.basename(outPath) + "  mode=" + mode
  + "  " + (touched/(W*H)*100).toFixed(1) + "% of pixels made non-opaque");
