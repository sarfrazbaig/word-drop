# Obstacle telegraph art - generation prompts

Everything here is for the staged-warning work: making it visible that an obstacle is about
to act, and what it will act on. Motion reference lives in Claude Design as
**Obstacle physics**; this is the shopping list.

Existing art for reference: `art/pets/*.png` are 50 portraits at 256x256 with alpha,
`art/bg/*.jpg` are the 15 country paintings. Match that style and that pipeline.

---

## Read this first

**Prepend this style line to every prompt.** It is the only thing keeping the set coherent,
and generators drift badly without it.

> Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a
> children's picture book. Visible brush texture, soft edges, no hard outlines, no cel
> shading, not flat vector art, not photorealistic, not 3D render. Muted natural palette.
> Gentle and inviting rather than threatening.

**Every output must satisfy all of these:**

| | |
|---|---|
| Background | Fully transparent. If alpha is impossible, flat pure green `#00FF00` with no green anywhere in the subject, and I will key it out. |
| Canvas | Square 256x256 unless the asset says otherwise. Subject centred with a small margin. |
| Shadows | **None.** No drop shadow, no contact shadow, no ground plane. These sit on 15 different painted backgrounds and a baked shadow will be wrong on all of them. |
| Lighting | Flat and even, or lit softly from the upper left. No strong directional light. |
| Detail | These render at about 45 pixels on a phone. Bold simple silhouettes only. Fine detail will vanish. |
| Text | None. No letters, no numbers, no symbols. |
| Tolerance | Every tile is dealt with up to 1.3 degrees of random rotation, so nothing may depend on being perfectly level. |

**On format.** Flow makes video, which is fine - generate a short clip of the motion and I
will pull the frames I need. Where I have asked for discrete stages, either give me one
still per stage, or one clip and I will sample it. Stills are more reliable if the tool
will do them.

**What I am not asking for.** The current's swell, the wind's streaks and the doomed-tile
dimming are soft gradients and tints. They belong in code, not in art - they have to stretch
to arbitrary row widths and tint per country, which a bitmap cannot do. I have those working
already. Everything below is the stuff that genuinely needs a hand.

---

## A. The staged threats

These are the six obstacles that act on a fixed beat with no warning today. Each needs the
threat to grow visibly over 3 or 4 drops.

### A1 - Bramble vine, reaching (highest priority)

The whole idea in one asset. A vine grows out of a bramble toward the letter it has chosen,
lengthening on each drop, and on the last one it closes over the letter and that tile becomes
a bramble too.

- **Canvas 512x256** (two tiles wide, one tall). The vine starts at the left edge, mid-height.
- **3 stages**: reaching a third of the way, two thirds, then fully across and curling over
  the far tile's face.
- Needs a vertical version too - **256x512**, growing upward - because brambles spread in all
  four directions. Left and down I will get by flipping.

> A single thorny bramble vine growing horizontally from the left edge toward the right, thin
> woody stem with small dark green leaves and a few soft thorns, a curled tendril at the
> growing tip. The vine occupies only the middle horizontal third of the frame and reaches
> exactly two thirds of the way across. Nothing at all in the remaining right-hand third.
> Transparent background, no shadow.

Then the same again for stage 3, which is the one that matters most:

> A single thorny bramble vine that has grown all the way across the frame from left to right
> and is curling and closing over an unseen square object at the right-hand end, wrapping it
> like fingers closing over a stone. Small dark green leaves along the stem, soft thorns, a
> curled tendril. Transparent background, no shadow.

### A2 - Spore motes and dusting

Spores do not creep to a neighbour, they land anywhere, so a vine would be a lie. Instead the
spore puffs motes that visibly travel across the board and settle on the tile they will take.

- **Motes: 128x128**, 4 to 6 frames of a drifting particle cluster. I will animate the path.
- **Dusting: 256x256**, 3 stages of increasing settled dust on a tile face.

> A small drifting cluster of pale lilac fungal spores, soft and downy like dandelion seed,
> five or six motes at slightly different sizes, faintly luminous. Transparent background,
> no shadow.

> A soft dusting of pale lilac fungal spores settled unevenly across an invisible square
> surface, thickest toward the centre, thin and patchy at the edges, like frost forming.
> Nothing but the dust - no tile, no border. Transparent background, no shadow.

### A3 - Pest, facing its target

A pest swaps places with a neighbouring letter. It should visibly pick one and turn to look
at it before it jumps, so a swap reads as a swap rather than a glitch.

- **256x256**, 3 stages: settled, turned and staring, crouched to jump.
- Facing right only. I will flip for left, and use the same art for up and down.

> A small round grub-like garden bug, plump and soft, cosy rather than creepy, with big
> friendly dark eyes and two short antennae, seen from the side facing right. It is looking
> intently to the right at something out of frame, antennae pointed the same way, body
> crouched and tensed as though about to hop sideways. Transparent background, no shadow.

### A4 - Root, knitting its wound shut

The clearest case in the set: the mechanic is already a countdown - a cut root heals three
drops later - and it has no face at all. Today it simply pops back with a shake.

- **256x256**, 4 stages: freshly cut and open, a third knit, two thirds knit, whole.
- The wound must sit across the middle of the frame so it overlays a tile face.

> A thick woody tree root severed cleanly across the middle, the two cut ends held slightly
> apart with a dark open gap between them, pale raw wood visible at both cut faces, fibrous
> strands beginning to reach across the gap from either side. Warm brown bark. Transparent
> background, no shadow.

Then stages 2 and 3 with progressively more fibres bridging the gap, and stage 4:

> A thick woody tree root, whole and unbroken, with a raised knotted scar across its middle
> where it has healed over, bark grown back rough across the join. Warm brown. Transparent
> background, no shadow.

---

## B. Static rules that have no picture

Not warnings - rules the board obeys with nothing on screen to explain them. Your reed
example is exactly this.

### B2 - Reed grip on the column

A reed blocks a whole column and nothing drops past it. Players read that as the game
refusing them rather than as a thing in the way. So the reed grows stalks up the column and
grips the tiles above it.

- **Tileable stalk segment: 128x256**, must repeat vertically without a visible seam, because
  the column height varies.
- **Grip cap: 256x256**, a curl that closes around one tile.

> Two tall slender marsh reed stalks running vertically, olive green, with fine leaf blades,
> photographed straight on so the top and bottom edges match seamlessly for tiling.
> Transparent background, no shadow.

> Two olive green marsh reed stalks curling and gripping around an unseen square object,
> wrapping it from both sides like a hand closing, leaf blades bent around the shape.
> Transparent background, no shadow.

### B3 - Mire strands holding a shelf up

Mire does not fall. Everything else settles around it and it hangs in mid-air holding
whatever rests on top of it. That is one of the strangest things on the board and there is
currently nothing at all to explain it.

- **256x128**, sits between the mire and the tile above it.

> Thick sticky strands of brown bog mud stretching vertically between two unseen surfaces,
> like warm caramel pulled apart, three or four strands of uneven thickness, glistening
> slightly. Transparent background, no shadow.

### B4 - Scree fractures

Clear scree and it breaks into more scree, once. Unannounced, that feels like the game
cheating. Fracture lines drawn on it from the start turn the split into the tile keeping a
promise.

- **256x256**, an overlay of cracks only.

> A network of fine dark fracture lines across an invisible square surface, like cracks in
> dry stone about to break apart, radiating from slightly off centre, thicker at the centre
> and hairline at the edges. Only the cracks, nothing else. Transparent background, no shadow.

---

## C. Halfway damage, for the four that take two clears

Stone, crystal, shroud and frost all need two words beside them. Right now the halfway state
is a CSS filter over the whole tile, which reads as "slightly faded" rather than "damaged".
It should be a **chip out of the silhouette**.

- **256x256 each**, one damaged variant per obstacle.

> A mossy grey boulder with a large piece freshly broken off one side, the break face bright
> and raw against the weathered mossy surface, sharp fresh edges, a few small chips fallen
> away. Rounded pebble silhouette. Transparent background, no shadow.

Same shape of prompt for the other three: a crystal with one facet sheared off and bright raw
crystal inside; a shroud torn open with dim light showing through the tear; a double frost
layer with the outer shell cracked and flaking away.

---

## D. The three coatings - greyscale only, and this one is important

Ice, mist and frost sit **on top of** a letter you can still read. They are also the source of
a measured bug: they are painted in fixed colours while the tile underneath takes the
country's palette, so in the pale cold countries they become the same colour as an ordinary
letter. Measured, an iced letter in the Glimmer Seams differs from a plain one by deltaE 2.5,
which is the point at which two colours are the same colour.

**So generate these as white and grey only, with alpha.** No blue, no lilac, no colour of any
kind. The game tints them from the country palette at runtime, which is what structurally
prevents the collision from coming back.

- **256x256 each.** Must leave the middle readable - the letter shows through.

> A thin sheet of clear ice over an invisible square surface, seen straight on, with frost
> crystals growing inward from the four edges and the centre left almost clear. Pure white
> and pale grey only, no colour whatsoever. Transparent background, no shadow.

> A soft veil of fog drifting across an invisible square surface, thickest at the top and
> thinning toward the bottom, wispy and uneven. Pure white and pale grey only, no colour
> whatsoever. Transparent background, no shadow.

> A thick double layer of hoar frost over an invisible square surface, dense feathery crystals
> covering most of the area with only a small clear patch at the centre. Pure white and pale
> grey only, no colour whatsoever. Transparent background, no shadow.

---

---
---

# Part 2 - the tile system, since you offered

You asked what else is needed so the tiles and the obstacles go together. Two answers, and
the first one is bigger than anything in Part 1.

## The problem I did not expect to find

**Thirteen emoji are currently doing the obstacles' identity work, and there is no art behind
any of them.** They are system font glyphs, rendered by whatever device the player is holding:

| | |
|---|---|
| In CSS `content:` | 🌿 bramble and stone, 🪾 branch, ❄ ice, ❄❄ frost, 🌫️ mist, 🍄 spore |
| In `tileFace()` | 🌰 acorn, ★ star, 🌀 current, 🌬️ wind, 🎁 gift, 🪵 root, 🌑 shroud, 🐛 pest |

Three consequences, in order of how much they matter:

1. **They look different on every device.** An iPhone, a Pixel and a Samsung draw all thirteen
   differently. The wood does not have one look; it has as many as there are emoji fonts.
2. **They are flat vector shapes on painted backgrounds.** This is exactly the mismatch that
   would get worse, not better, if Part 1 lands and the vines are painted while the thing the
   vine grows out of is a font glyph.
3. **🪾 may not render at all.** It is one of the newest additions to Unicode, and on an older
   phone it will draw as an empty box. That is the branch, which is the *first* obstacle a
   player ever meets, at level 10.

So the answer to "what else do you need" is: **the identity of every obstacle, as art.**

## C1 - The tile face itself, greyscale and tintable (do this one first)

This is the keystone. If the obstacles become painted and the letter tiles stay as CSS
gradients, the board will look like two different games stitched together - and the painted
ones will make the flat ones look worse.

The catch is that the tile face has to keep working in **15 different country palettes**, so it
cannot be a coloured bitmap. Generate it as **white and grey only with alpha**, and I will
multiply the country's colour through it. Same trick as the coatings in Part 1, same reason.

- **256x256.** Must leave the middle clean enough to read a bold letter over it.

> A square wooden letter tile seen straight on, gently rounded corners, with fine vertical
> wood grain running top to bottom and a soft sheen along the upper edge. Pure white and pale
> grey only, no colour whatsoever. The centre is almost clean so text can sit over it. Soft
> painted texture, no hard outline. Transparent background, no shadow.

## C2 - The four that are not letters

Currently: a hardcoded gradient, a text star, and two emoji.

- **256x256 each.** These are objects, not coatings, so full colour is right.

> A wooden letter tile turned to solid gold, warm and buttery, gently rounded corners, with a
> soft highlight along one edge as though catching low sunlight. Painted storybook style, no
> hard outline. Transparent background, no shadow.

> A small fallen star resting on nothing, five soft rounded points, pale gold at the tips
> deepening to warm cream at the centre, glowing faintly from within, slightly lopsided and
> hand-made looking rather than geometric. Transparent background, no shadow.

> A single plump acorn with its cap on, warm brown nut and a textured tan cap, seen from the
> side, cosy and round. Transparent background, no shadow.

> A small gift parcel wrapped in soft brown paper with a wide fabric ribbon tied in a bow on
> top, slightly squashed and hand-wrapped looking. Transparent background, no shadow.

## C3 - The eight obstacle bodies

These are currently CSS radial gradients with an emoji stuck on top. They are the actual
things a player is looking at, and they should be painted objects.

- **256x256 each.** Full colour. Bold silhouette - these read at 45px.
- Eight of them: **stone, bramble, branch, spore, reed, mire, crystal, scree.**
- Each also needs the halfway damage variant from section C above, where it takes two clears.

One prompt each, in the same shape. Two examples to set the tone:

> A rounded mossy grey boulder, weathered and softly lumpy, with patches of bright green moss
> across the top and a few tiny ferns at the base. Painted storybook style. Transparent
> background, no shadow.

> A dense tangle of thorny bramble, dark green leaves and woody stems knotted into a rough
> ball shape with a few soft thorns and one or two blackberries. Painted storybook style.
> Transparent background, no shadow.

The remaining six: a fallen leafless branch lying across the frame; a cluster of pale lilac
mushrooms with domed caps; a stand of olive marsh reeds seen head on; a pool of glossy brown
bog mud; a cluster of translucent pale blue crystal shards; a heap of loose grey shale
fragments.

---

## What I need back, in priority order

Part 2 item 1 outranks everything, because it is what makes the rest look like one game.

1. **C1 the greyscale tile face** - the keystone. Everything else is judged against it.
2. **A1 bramble vine** - horizontal and vertical, 3 stages each. Proves the staged-warning
   idea, and bramble is the second obstacle a player ever meets.
3. **D ice, mist, frost** in greyscale - these fix a measured bug, not just a feel.
4. **C3 the eight obstacle bodies** - retires nine of the thirteen emoji.
5. **C2 acorn, star, gold, gift** - retires the other four.
6. **B2 reed grip** - your own example, and the rule players most often misread.
7. **A4 root**, then everything else.

Send them at whatever size Flow gives and I will resample to 256. If a clip is easier than
stills, send the clip.

## One thing to decide before you start

The greyscale-and-tint approach in C1 and D is what keeps 15 countries working from one asset,
and it is what stops the colour collision I measured from coming back. The cost is that those
assets cannot carry any colour of their own - all their character has to come from texture and
shape. If you would rather they were painted in full colour, that is a real choice, but it
means 15 versions of each and a rule that someone has to keep in step by hand. I would take
the greyscale.
