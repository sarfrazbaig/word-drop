/* Slice the Gemini ground-animal sheet into clean transparent per-pet PNGs.
   The sheet's "transparent" checkerboard is baked-in solid grey (two tones ~72 & ~96), so
   the background is removed by a flood-fill from the borders — that clears the connected grey
   without touching grey INSIDE a pet (mouse, badger) which is not border-connected. Then each
   of the 24 grid cells is cropped to a tight bounding box, with the white label text below it
   excluded by finding the transparent gap between art and label (plus an absolute height cap
   as a backstop — the skunk's short body fooled gap-detection alone). */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const SRC = path.join(__dirname, "art", "sheet-ground.png");
const OUT = path.join(__dirname, "art", "pets");
fs.mkdirSync(OUT, { recursive: true });

const NAMES = ["frog","deer","hare","mouse","pig","snail","worm","ant",
               "crab","fish","chick","goat","otter","boar","moose","seal",
               "turtle","beaver","badger","lizard","pony","lamb","bunny","skunk"];

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width: W, height: H, data: d } = png;
const A = (x, y) => d[(y * W + x) * 4 + 3];

const neutral = (i) => {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  return Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && Math.abs(r - b) < 16;
};
const isBg = (i) => { const r = d[i]; return neutral(i) && r >= 52 && r <= 116; };

/* PASS 1 — flood-fill the checkerboard from every border pixel. Clears the big connected
   background but cannot reach grey pockets ENCLOSED by a pet (between the deer's antlers,
   under the mouse's arm holding cheese, inside the snail's shell curl). */
const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push(x); stack.push((H - 1) * W + x); }
for (let y = 0; y < H; y++) { stack.push(y * W); stack.push(y * W + W - 1); }
while (stack.length) {
  const p = stack.pop(); if (seen[p]) continue; seen[p] = 1;
  const i = p * 4; if (!isBg(i)) continue;
  d[i + 3] = 0;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}
/* PASS 2 — the enclosed pockets. The checkerboard is two EXACT flat tones (~72 and ~96); a
   pet's own grey is shaded, so it never sits as a flat field on those precise values. Key
   any still-opaque neutral pixel locked onto either tone, wherever it hides. */
for (let p = 0; p < W * H; p++) {
  const i = p * 4; if (d[i + 3] === 0) continue;
  if (!neutral(i)) continue;
  const r = d[i];
  if (Math.abs(r - 72) <= 6 || Math.abs(r - 96) <= 6) d[i + 3] = 0;
}
/* despill: drop the 1px grey fringe that anti-aliasing left touching transparency */
for (let p = 0; p < W * H; p++) {
  const i = p * 4; if (d[i + 3] === 0) continue;
  const x = p % W, y = (p / W) | 0;
  const near = (x > 0 && d[(p - 1) * 4 + 3] === 0) || (x < W - 1 && d[(p + 1) * 4 + 3] === 0)
            || (y > 0 && d[(p - W) * 4 + 3] === 0) || (y < H - 1 && d[(p + W) * 4 + 3] === 0);
  if (near) { const r = d[i], g = d[i + 1], b = d[i + 2];
    if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && r >= 52 && r <= 124) d[i + 3] = 0; }
}

const COLS = 8, ROWS = 3, cw = W / COLS, ch = H / ROWS;
const opaque = (x, y) => A(x, y) > 60;

/* FUSED DECORATIONS. Many pets have a decoration TOUCHING the body — one connected blob, so
   largest-component keeps it. Each is a distinct hue from its animal and can be keyed by
   colour without harming the creature. Only listed pets are touched, and only with hues that
   are absent from that animal: green foliage off brown/white animals, a blue splash off the
   brown otter, a brown ground-shadow off the white bunny and black-white badger. The green
   frog, lizard and turtle are never listed. */
const STRIP = {
  deer: ["green"], moose: ["green"], boar: ["green", "yellow"], pony: ["green", "yellow"],
  lamb: ["green"], chick: ["green"],
  otter: ["blue"], bunny: ["ground"], badger: ["ground"],
  /* turtle & lizard get NO strip: they are green, so a green strip would eat them, and a
     near-white sparkle strip ate their light-green highlights and half-cut the body. Their
     small green sparkles stay — a faint sparkle is far better than a gutted animal. */
};
const stripPix = (i, hue) => {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  if (hue === "green")  return g > r + 12 && g > b + 6 && g > 55;
  if (hue === "blue")   return b > r + 10 && b >= g - 6 && b > 90;
  /* a bright golden sparkle-star. Its blue rides up to ~128, so the gate is the WIDE
     green-over-blue gap (>60), which a tan mane (~40) never reaches — the boar and pony
     bodies are safe while the star goes. */
  if (hue === "yellow") return r > 158 && g > 138 && (r - b) > 64 && (g - b) > 47;
  /* a near-white sparkle core on a green animal — the only near-white on a turtle or lizard,
     so keying it removes the star without touching the green body. */
  if (hue === "sparkle") return Math.min(r, g, b) > 168 && Math.max(r, g, b) > 205;
  /* the ground the bunny/badger sit on is a muted warm brown or grey; both animals are
     white / black-and-white, so a warm or neutral mid-tone at the base is dirt, not fur. */
  if (hue === "ground") return (r > g && g >= b - 4 && r < 165 && r - b > 14) ||
                               (Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r >= 90 && r <= 150);
  return false;
};

/* PER-PET HUE STRIP — done as a global pass so the halo despill below sees the result. */
{ let n2 = 0;
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++, n2++) {
    const hues = STRIP[NAMES[n2]]; if (!hues) continue;
    const x0 = Math.round(col * cw), y0 = Math.round(r * ch), y1 = Math.round((r + 1) * ch);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x0 + cw; x++) {
      const i = (y * W + x) * 4; if (!d[i + 3]) continue;
      for (const h of hues) if (stripPix(i, h)) { d[i + 3] = 0; break; }
    }
  }
}

/* KILL THE HALO — WITHOUT EATING THE PET. The ring where a pet met the checkerboard is a
   BLEND toward the checkerboard grey (~72/96): near the background it is almost that grey,
   further in it turns to pet colour. So the halo is not "any desaturated pixel" — an earlier
   version that removed those obliterated the dark-brown ant and the pale fish. It is
   specifically a NEUTRAL pixel close to the checkerboard brightness, touching transparency.
   The ant's brown (r>g>b, not neutral), the fish's blue (b leads), the grey mouse and badger
   (brighter than the board) all fall outside that and survive. Two gentle passes, no blanket
   erosion. */
const touchesClear = (p) => {
  const x = p % W, y = (p / W) | 0;
  return (x > 0 && d[(p - 1) * 4 + 3] === 0) || (x < W - 1 && d[(p + 1) * 4 + 3] === 0)
      || (y > 0 && d[(p - W) * 4 + 3] === 0) || (y < H - 1 && d[(p + W) * 4 + 3] === 0);
};
const isCheckerBlend = (i) => {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return (mx - mn) <= 22 && mx >= 55 && mx <= 112;   // neutral AND in the checkerboard's brightness band
};
for (let pass = 0; pass < 2; pass++) {
  const kill = [];
  for (let p = 0; p < W * H; p++) {
    const i = p * 4; if (d[i + 3] === 0 || !touchesClear(p)) continue;
    if (isCheckerBlend(i)) kill.push(p);
  }
  if (!kill.length) break;
  for (const p of kill) d[p * 4 + 3] = 0;
}

const map = {};
let n = 0;
for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
  const x0 = Math.round(col * cw), y0 = Math.round(r * ch), y1 = Math.round((r + 1) * ch);
  /* find where the art ends and the label begins: first 6px transparent run after the art */
  let artEnd = 0, started = false, gap = 0;
  for (let y = y0; y < y1; y++) {
    let cnt = 0; for (let x = x0; x < x0 + cw; x++) if (opaque(x, y)) cnt++;
    if (cnt > 2) { started = true; artEnd = y - y0; gap = 0; }
    else if (started) { if (++gap >= 6) break; }
  }
  const cutY = Math.min(y0 + artEnd + 1, Math.round(y0 + ch * 0.76));  // cap: labels sit lower

  /* ISOLATE THE ANIMAL. Tone-keying leaves the AI's COLOURED decorations behind — grass
     tufts at the deer's hooves, loose sparkles, a stray water droplet, a floating snowflake.
     None of those are the pet, and every one of them is a SEPARATE blob from the animal's
     body. Label every connected component in the cell (8-way) and keep only the largest;
     erase the alpha of everything else. */
  const compId = new Int32Array((x0 + Math.ceil(cw)) * 0); // placeholder to satisfy linters
  const lab = new Map(); // pixel index -> component id, sparse via object would be slow; use array
  const cellW = Math.ceil(cw), cellH = cutY - y0;
  const id = new Int32Array(cellW * cellH).fill(0);
  let next = 0; const sizes = [0];
  const at = (lx, ly) => opaque(x0 + lx, y0 + ly);
  for (let ly = 0; ly < cellH; ly++) for (let lx = 0; lx < cellW; lx++) {
    if (!at(lx, ly) || id[ly * cellW + lx]) continue;
    next++; sizes.push(0);
    const st = [ly * cellW + lx]; id[ly * cellW + lx] = next;
    while (st.length) {
      const q = st.pop(); const qx = q % cellW, qy = (q / cellW) | 0; sizes[next]++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= cellW || ny >= cellH) continue;
        const ni = ny * cellW + nx;
        if (id[ni] || !at(nx, ny)) continue;
        id[ni] = next; st.push(ni);
      }
    }
  }
  let biggest = 1; for (let k = 2; k <= next; k++) if (sizes[k] > sizes[biggest]) biggest = k;

  /* crop the largest component tight, copying ONLY its pixels */
  let mnX = 1e9, mnY = 1e9, mxX = -1, mxY = -1;
  for (let ly = 0; ly < cellH; ly++) for (let lx = 0; lx < cellW; lx++)
    if (id[ly * cellW + lx] === biggest) {
      const gx = x0 + lx, gy = y0 + ly;
      if (gx < mnX) mnX = gx; if (gx > mxX) mxX = gx; if (gy < mnY) mnY = gy; if (gy > mxY) mxY = gy;
    }
  const bw = mxX - mnX + 1, bh = mxY - mnY + 1;
  const out = new PNG({ width: bw, height: bh });
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const gx = mnX + x, gy = mnY + y, lx = gx - x0, ly = gy - y0;
    const di = (y * bw + x) * 4;
    if (ly >= 0 && ly < cellH && lx >= 0 && lx < cellW && id[ly * cellW + lx] === biggest) {
      const si = (gy * W + gx) * 4;
      out.data[di] = d[si]; out.data[di + 1] = d[si + 1]; out.data[di + 2] = d[si + 2]; out.data[di + 3] = d[si + 3];
    } else { out.data[di + 3] = 0; }   // anything not the animal is dropped
  }
  fs.writeFileSync(path.join(OUT, NAMES[n] + ".png"), PNG.sync.write(out));
  map[NAMES[n]] = { w: bw, h: bh, blobs: next };
  n++;
}
console.log("wrote " + n + " pet PNGs to art/pets/");
console.log(JSON.stringify(map));
