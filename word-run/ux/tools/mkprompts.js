/* Emits the complete art prompt pack. Generated rather than hand-written so the style
   preamble and the constraint block are byte-identical in every single prompt - that is the
   part that drifts when you write forty of these by hand, and drift is what makes a set of
   assets look like it came from four different people. */
const fs = require("fs");
const OUT = require("path").join(__dirname,"..","..","ux/art-prompt-pack.md");

const STYLE = "Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a "
  + "children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, "
  + "not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than "
  + "threatening.";

const CENTRED = "Centred with a small even margin.";
/* Some assets are anchored to an edge on purpose - a vine has to start where the tile it grows
   out of is, and a tileable stalk has to run right off both ends. Telling those to be centred
   as well is a contradiction, and a generator resolves a contradiction by ignoring one half of
   it at random. So the centring clause is per-asset, not shared. */
const RULES = "No drop shadow, no contact shadow, no ground "
  + "plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the "
  + "upper left. Bold simple silhouette that still reads when shrunk to 45 pixels.";

/* ASKING FOR A TRANSPARENT BACKGROUND DOES NOT WORK. A generator has no alpha channel to give
   you, so it paints the checkerboard instead - that is what transparency looks like in every
   screenshot it ever saw. So ask for a background we can remove on purpose. Two of them:

   magenta  for anything OPAQUE. Keys to a hard edge and leaves the subject's own colours and
            greys untouched. Maximally far from the greens, browns and greys in this set.
   black    for the coatings, which are meant to be semi-transparent anyway. Brightness becomes
            opacity, which is exactly how frost should behave - thick crystals solid, thin
            edges faint - and it gives honest soft edges with no keying halo. */
const BG_KEY = "Place the subject on a completely flat, solid, uniform pure magenta background, "
  + "hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do "
  + "NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.";
const BG_BLACK = "Place the subject on a completely flat, solid, uniform pure black background "
  + "filling the entire frame edge to edge. Do NOT draw a checkerboard pattern and do NOT draw a "
  + "scene. The subject must be the only bright thing in the frame, fading to pure black at its "
  + "softest edges.";

const GREY = "Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not "
  + "even a tint. All character must come from texture, shading and shape.";

/* every asset: id, group, name, canvas, grey?, subject, note */
const A = [];
const add = (id, group, name, canvas, grey, subject, note, anchor, bg) =>
  A.push({ id, group, name, canvas, grey, subject, note,
           anchor: anchor || CENTRED, bg: bg || BG_KEY });

/* ── 1 · the keystone ───────────────────────────────────────────── */
add("01", "Keystone", "The letter tile face", "256x256", true,
  "A square wooden letter tile seen straight on, gently rounded corners, with fine vertical wood "
  + "grain running from top to bottom and a soft sheen along the upper edge. The centre is almost "
  + "clean and unmarked so that a bold letter can sit over it and stay readable.",
  "Everything else is judged against this. Tinted at runtime, so one asset serves all 15 countries.");

/* ── 2 · the three coatings, greyscale, letter reads through ────── */
add("02", "Coatings", "Ice", "256x256", true,
  "A thin sheet of clear ice over an invisible square surface, seen straight on, with delicate "
  + "frost crystals growing inward from all four edges and the centre left almost clear.",
  "Greyscale is not a style choice here - it is what stops the measured colour collision returning.", CENTRED, BG_BLACK);
add("03", "Coatings", "Deep frost", "256x256", true,
  "A thick double layer of hoar frost over an invisible square surface, dense feathery crystals "
  + "covering most of the area, with only a small clear patch remaining at the very centre.",
  "Two words to clear: this is the full state. See 04 for the shed state.", CENTRED, BG_BLACK);
add("04", "Coatings", "Frost, one layer shed", "256x256", true,
  "A layer of hoar frost over an invisible square surface that has partly flaked away, the "
  + "feathery crystals broken and lifting at the edges with more of the centre now clear, small "
  + "flakes coming loose.",
  "The halfway state after one word beside it.", CENTRED, BG_BLACK);
add("05", "Coatings", "Mist", "256x256", true,
  "A soft veil of fog drifting across an invisible square surface, thickest along the top and "
  + "thinning toward the bottom, wispy and uneven, like breath on cold glass.", "", CENTRED, BG_BLACK);

/* ── 3 · the fourteen solid bodies ─────────────────────────────── */
const BODIES = [
  ["06","Branch","A single fallen leafless branch lying diagonally across the frame, bare grey-brown "
    + "wood with a few short broken side twigs and a little lichen.",
    "Debuts at level 10 - the first obstacle anybody meets. Currently the emoji that may not render at all."],
  ["07","Bramble","A dense tangle of thorny bramble knotted into a rough ball, dark green leaves and "
    + "woody stems, a few soft thorns and one or two ripe blackberries tucked inside.", ""],
  ["08","Root","A thick woody tree root, whole and unbroken, running across the frame, warm brown bark "
    + "with a raised knotted burl at its middle.", ""],
  ["09","Spore","A cluster of pale lilac mushrooms with softly domed caps at three different heights, "
    + "plump stems, a faint dusting of spores around the base.", ""],
  ["10","Reed","A small stand of olive green marsh reeds seen straight on, five or six slender upright "
    + "stalks with fine leaf blades and one soft brown seed head.", ""],
  ["11","Mire","A pool of glossy brown bog mud, thick and sticky, its surface slowly bulging with one "
    + "lazy bubble rising, a few reed stubs at the edge.", ""],
  ["12","Stone","A rounded mossy grey boulder, weathered and softly lumpy, patches of bright green moss "
    + "across the top and a few tiny ferns at its base.", ""],
  ["13","Shroud","A dense sphere of soft darkness hanging in the air, edges frayed and smoky, swallowing "
    + "the light around it, with the faintest cool glow deep inside.", ""],
  ["14","Crystal","A cluster of translucent pale blue crystal shards growing outward from a common base, "
    + "faceted and glassy, catching light along their edges.", ""],
  ["15","Scree","A heap of loose grey shale fragments piled unsteadily, flat angular chips of stone in "
    + "several sizes, a few having slipped to one side.", ""],
  ["16","Current","A tight spiral of clear water turning in place, a small whirlpool seen from above, with "
    + "curved white foam lines following the spin and a few flecks of spray.", ""],
  ["17","Wind","A curl of moving air made visible, three or four swirling white streaks looping around "
    + "each other with a few small leaves caught up and carried along.", ""],
  ["18","Pest","A small round grub-like garden bug, plump and soft, cosy rather than creepy, with big "
    + "friendly dark eyes and two short antennae, seen from the side facing right.",
    "Facing right only - flipped for left, reused for up and down."],
  ["19","Gift crate","A small gift parcel wrapped in soft brown paper with a wide fabric ribbon tied in a "
    + "bow on top, slightly squashed and hand-wrapped looking.", ""],
];
BODIES.forEach(([id,name,subj,note]) => add(id, "Bodies", name, "256x256", false, subj, note));

/* ── 4 · halfway damage, for the ones that take two clears ─────── */
const DAMAGE = [
  ["20","Stone, cracked","A mossy grey boulder with a large piece freshly broken off one side, the break "
    + "face bright and raw against the weathered mossy surface, sharp fresh edges, a few small chips "
    + "fallen away below.","A chip out of the silhouette, not a filter over the whole tile."],
  ["21","Crystal, cracked","A cluster of pale blue crystal shards with one large facet sheared clean off, "
    + "the exposed inner crystal brighter and rawer than the weathered outer faces, fine fracture lines "
    + "running back from the break.",""],
  ["22","Shroud, thinning","A sphere of soft darkness torn open across one side, the frayed edges pulling "
    + "back and a dim cool light showing through the gap.",""],
  ["23","Root, freshly cut","A thick woody tree root severed cleanly across its middle, the two cut ends "
    + "held slightly apart with a dark open gap between them, pale raw wood at both cut faces, a few "
    + "fibrous strands beginning to reach across the gap.","Stage 1 of the healing countdown."],
  ["24","Root, half knitted","A severed woody tree root whose two cut ends are being drawn back together, "
    + "roughly half the gap now bridged by pale fibrous strands knitting across it, bark starting to "
    + "creep over from both sides.","Stage 2 of 3. The clock, on the tile."],
  ["25","Root, healed over","A thick woody tree root, whole and unbroken, with a raised knotted scar across "
    + "its middle where it has healed shut, rough new bark grown across the join.","Stage 3. Back to square one."],
  ["26","Scree, fractured","A heap of loose grey shale fragments with a network of fine dark fracture lines "
    + "running through the larger pieces, visibly about to break apart further.",
    "Drawn from the start, so the split is a promise kept rather than the game cheating."],
];
DAMAGE.forEach(([id,name,subj,note]) => add(id, "Damage", name, "256x256", false, subj, note));

/* ── 5 · the staged telegraphs ─────────────────────────────────── */
add("27", "Telegraph", "Bramble vine, reaching one third", "512x256", false,
  "A single thorny bramble vine growing horizontally out from the left edge of the frame, thin woody "
  + "stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip. The "
  + "vine occupies only the middle horizontal third of the frame and reaches exactly one third of the "
  + "way across. The entire right two thirds of the frame is empty.",
  "Two tiles wide. Vine starts at the left edge, mid-height.",
  "The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred.");
add("28", "Telegraph", "Bramble vine, reaching two thirds", "512x256", false,
  "A single thorny bramble vine growing horizontally out from the left edge of the frame, thin woody "
  + "stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip. The "
  + "vine reaches exactly two thirds of the way across the frame. The remaining right-hand third is empty.",
  "",
  "The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred.");
add("29", "Telegraph", "Bramble vine, closing over", "512x256", false,
  "A single thorny bramble vine that has grown all the way across the frame from left to right and is "
  + "now curling and closing over an unseen square object at the right-hand end, wrapping around it the "
  + "way fingers close over a stone. Small dark green leaves along the stem, soft thorns, a curled tendril.",
  "The moment of conversion. The most important frame in the whole set.",
  "The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred.");
add("30", "Telegraph", "Bramble vine, vertical set", "256x512", false,
  "A single thorny bramble vine growing vertically upward from the bottom edge of the frame, thin woody "
  + "stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip, "
  + "reaching two thirds of the way up. The top third of the frame is empty.",
  "Needed at all three lengths, same as 27-29. Down and left come from flipping.",
  "The vine must begin hard against the bottom edge of the frame with nothing below it, and it must not be centred.");
add("31", "Telegraph", "Spore motes drifting", "128x128", false,
  "A small drifting cluster of pale lilac fungal spores, soft and downy like dandelion seed, five or six "
  + "motes at slightly different sizes, faintly luminous.",
  "I animate the path - spores land anywhere, so the travel cannot be baked in.");
add("32", "Telegraph", "Spore dusting, light", "256x256", false,
  "A light scattering of pale lilac fungal spores settled unevenly across an invisible square surface, "
  + "sparse and patchy, thickest near the centre. Only the dust - no tile, no border, no edge.", "");
add("33", "Telegraph", "Spore dusting, heavy", "256x256", false,
  "A heavy dusting of pale lilac fungal spores settled thickly across an invisible square surface, "
  + "almost covering it, thinning slightly at the corners. Only the dust - no tile, no border, no edge.",
  "One drop before it converts. This is the tell.");
add("34", "Telegraph", "Pest, staring at its target", "256x256", false,
  "A small round grub-like garden bug, plump and soft, cosy rather than creepy, with big friendly dark "
  + "eyes and two short antennae, seen from the side facing right. It is staring intently at something "
  + "out of frame to the right, both antennae pointed the same way.", "");
add("35", "Telegraph", "Pest, crouched to jump", "256x256", false,
  "A small round grub-like garden bug, plump and soft, with big friendly dark eyes and two short antennae, "
  + "seen from the side facing right, body squashed low and tensed as though about to spring sideways, "
  + "antennae swept back.", "");
add("36", "Telegraph", "Reed stalk, tileable", "128x256", false,
  "Two tall slender olive green marsh reed stalks running straight up the frame with fine leaf blades, "
  + "drawn so that the very top and the very bottom edges match exactly and the image can be repeated "
  + "vertically without a visible seam.",
  "Column height varies, so this has to tile. Seamless top and bottom is the whole requirement.",
  "The stalks must run right off both the top and the bottom edge of the frame so the image tiles seamlessly, and must not be centred vertically.");
add("37", "Telegraph", "Reed grip", "256x256", false,
  "Two olive green marsh reed stalks curling and gripping around an unseen square object, wrapping it "
  + "from both sides the way a hand closes, leaf blades bent around the shape.",
  "Sits on each tile the reed is holding.");
add("38", "Telegraph", "Mire strands", "256x128", false,
  "Thick sticky strands of brown bog mud stretched vertically between two unseen surfaces, like warm "
  + "caramel pulled apart, three or four strands of uneven thickness, glistening slightly.",
  "Explains why a shelf of tiles is hanging in mid-air.",
  "The strands must run right off both the top and the bottom edge of the frame, and must not be centred vertically.");

/* ── 6 · the four that are not letters ─────────────────────────── */
add("39", "Specials", "Gold tile", "256x256", false,
  "A square wooden letter tile turned to solid gold, warm and buttery, gently rounded corners, a soft "
  + "highlight running along one edge as though catching low afternoon sun. The centre is clean enough "
  + "for a letter to sit over it.", "");
add("40", "Specials", "A fallen star", "256x256", false,
  "A small fallen star resting on nothing, five soft rounded points, pale gold at the tips deepening to "
  + "warm cream at the centre, glowing faintly from within, slightly lopsided and hand-made looking "
  + "rather than geometric.", "");
add("41", "Specials", "An acorn", "256x256", false,
  "A single plump acorn with its cap on, warm brown nut and a textured tan cap, seen from the side, "
  + "round and cosy.", "");

/* ---------- emit ---------- */
const groups = [...new Set(A.map(a => a.group))];
const grey = A.filter(a => a.grey).length;

let md = `# The art prompt pack

Every asset, every prompt, complete and ready to paste. **41 prompts.**

Generated from \`ux/tools/mkprompts.js\` rather than written by hand, so the style line and the
constraint block are byte-identical in all 41. That is the part that drifts when you write
forty of these one at a time, and drift is what makes a set of assets look like it came from
four different people.

Companion documents: **ux/obstacle-art-prompts.md** for the reasoning behind each one, and
**Obstacle physics** in Claude Design for the motion these frames have to serve.

## Decisions already made

- **Greyscale and tint, confirmed.** ${grey} of the 41 assets are white and grey only and get
  the country's colour applied at runtime. One asset then serves all 15 countries, and it is
  what structurally stops the colour collision that was measured at deltaE 2.5 from coming
  back. Those prompts carry an explicit no-colour clause.
- **The rest are full colour.** They are objects - rocks, wood, fungus, water - and objects
  keep their own colour in every country.
- **256x256 PNG**, matching the 50 existing pet portraits, unless a prompt says otherwise.
  Flow can output whatever size is convenient and I will resample.
- **Video is fine.** Where a prompt is one frame of a sequence, a short clip works just as
  well and I will pull the frames.

## Nobody asks for a transparent background any more

The first generated tile came back with a checkerboard **painted into the pixels**. That is
what these tools do: there is no alpha channel to give you, so asking for transparency gets you
a picture of transparency, because that is what it looked like in every screenshot the model
ever saw.

Worse, a checkerboard is the single worst background for this set. It is grey and white, and so
is the tile - a white subject pixel sitting on a white checker square is genuinely
indistinguishable, and no tool can recover what is not there.

So every prompt now asks for a background that **can** be removed, and there are two:

| Background | Used for | Why | Recovered with |
|---|---|---|---|
| Flat pure magenta \`#FF00FF\` | the 37 opaque assets | maximally far from every green, brown and grey in the set, so the cut is clean and the subject's own colours survive untouched | \`--mode=chroma\` |
| Flat pure black | the 4 coatings - ice, both frosts, mist | these are meant to be semi-transparent anyway, so brightness becomes opacity: thick crystals solid, thin edges faint. Honest soft edges, no keying halo | \`--mode=luma\` |

Each prompt says which one it wants and which mode recovers it. Then:

\`\`\`bash
node ux/tools/dealpha.js incoming/01-tile.png art/tiles/face.png --mode=chroma --key=ff00ff
\`\`\`

Run it with \`--report\` on anything and it will tell you whether the file has real alpha, how
much of it is used, and whether it can see a painted checkerboard.

**If something already came back with a checkerboard**, \`--mode=checker\` will attempt a
salvage, but read its warning. It cuts away any part of the subject that happens to match a
checker square, which on a greyscale asset means most of it. Regenerating on magenta is
cheaper than fighting it.

## How to use it

Each block below is the whole prompt. Copy one, paste it, generate. Do not add a shadow or a
border - the constraint text already asks for their absence, and every one of
them has to sit on fifteen different painted country backgrounds.

`;

md += "## Priority\n\nIf you generate in order, the game improves in the largest steps first.\n\n"
  + "| Order | Prompts | Why first |\n|---|---|---|\n"
  + "| 1 | **01** | The keystone. Every other asset is judged against the tile it sits on. |\n"
  + "| 2 | **27, 28, 29** | The bramble vine. Proves the staged-warning idea end to end. |\n"
  + "| 3 | **02, 03, 04, 05** | The coatings. These fix a measured bug, not a feeling. |\n"
  + "| 4 | **06 to 19** | The fourteen bodies. Retires eleven of the thirteen emoji. |\n"
  + "| 5 | **36, 37, 38** | The reed grip and mire strands - rules with no picture. |\n"
  + "| 6 | **23, 24, 25** | The root countdown. |\n"
  + "| 7 | Everything else | |\n\n";

for (const g of groups){
  const items = A.filter(a => a.group === g);
  md += "---\n\n# " + g + " (" + items.length + ")\n\n";
  for (const a of items){
    md += "## " + a.id + " &middot; " + a.name + "\n\n";
    md += "`" + a.canvas + "`" + (a.grey ? " &middot; **greyscale, tinted at runtime**" : " &middot; full colour")
      + " &middot; `" + (a.bg === BG_BLACK ? "black bg, recover with --mode=luma"
                                           : "magenta bg, recover with --mode=chroma") + "`\n\n";
    if (a.note) md += "*" + a.note + "*\n\n";
    md += "```text\n" + STYLE + " " + a.subject + " " + (a.grey ? GREY + " " : "")
      + a.anchor + " " + RULES + " " + a.bg + "\n```\n\n";
  }
}

md += "---\n\n## Counts\n\n";
for (const g of groups) md += "- " + g + ": " + A.filter(a => a.group === g).length + "\n";
md += "- **Total: " + A.length + "** (" + grey + " greyscale, " + (A.length - grey) + " full colour)\n";

fs.writeFileSync(OUT, md);
const dashes = (md.match(/\u2014/g) || []).length;
console.log("wrote " + OUT);
console.log("  " + A.length + " prompts (" + grey + " greyscale) " + Math.round(md.length/1024) + " KB  em-dashes:" + dashes);
const ids = A.map(a => a.id);
console.log("  ids unique: " + (new Set(ids).size === ids.length) + "  sequential: " + ids.every((v,i) => +v === i+1));
