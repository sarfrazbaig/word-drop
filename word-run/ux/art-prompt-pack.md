# The art prompt pack

Every asset, every prompt, complete and ready to paste. **41 prompts.**

Generated from `ux/tools/mkprompts.js` rather than written by hand, so the style line and the
constraint block are byte-identical in all 41. That is the part that drifts when you write
forty of these one at a time, and drift is what makes a set of assets look like it came from
four different people.

Companion documents: **ux/obstacle-art-prompts.md** for the reasoning behind each one, and
**Obstacle physics** in Claude Design for the motion these frames have to serve.

## Decisions already made

- **Greyscale and tint, confirmed.** 5 of the 41 assets are white and grey only and get
  the country's colour applied at runtime. One asset then serves all 15 countries, and it is
  what structurally stops the colour collision that was measured at deltaE 2.5 from coming
  back. Those prompts carry an explicit no-colour clause.
- **The rest are full colour.** They are objects - rocks, wood, fungus, water - and objects
  keep their own colour in every country.
- **256x256 PNG with alpha**, matching the 50 existing pet portraits, unless a prompt says
  otherwise. Flow can output whatever size is convenient and I will resample.
- **Video is fine.** Where a prompt is one frame of a sequence, a short clip works just as
  well and I will pull the frames.

## How to use it

Each block below is the whole prompt. Copy one, paste it, generate. Do not add a background,
a shadow or a border - the constraint text already asks for their absence, and every one of
them has to sit on fifteen different painted country backgrounds.

## Priority

If you generate in order, the game improves in the largest steps first.

| Order | Prompts | Why first |
|---|---|---|
| 1 | **01** | The keystone. Every other asset is judged against the tile it sits on. |
| 2 | **27, 28, 29** | The bramble vine. Proves the staged-warning idea end to end. |
| 3 | **02, 03, 04, 05** | The coatings. These fix a measured bug, not a feeling. |
| 4 | **06 to 19** | The fourteen bodies. Retires eleven of the thirteen emoji. |
| 5 | **36, 37, 38** | The reed grip and mire strands - rules with no picture. |
| 6 | **23, 24, 25** | The root countdown. |
| 7 | Everything else | |

---

# Keystone (1)

## 01 &middot; The letter tile face

`256x256` &middot; **greyscale, tinted at runtime**

*Everything else is judged against this. Tinted at runtime, so one asset serves all 15 countries.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A square wooden letter tile seen straight on, gently rounded corners, with fine vertical wood grain running from top to bottom and a soft sheen along the upper edge. The centre is almost clean and unmarked so that a bold letter can sit over it and stay readable. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

---

# Coatings (4)

## 02 &middot; Ice

`256x256` &middot; **greyscale, tinted at runtime**

*Greyscale is not a style choice here - it is what stops the measured colour collision returning.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thin sheet of clear ice over an invisible square surface, seen straight on, with delicate frost crystals growing inward from all four edges and the centre left almost clear. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 03 &middot; Deep frost

`256x256` &middot; **greyscale, tinted at runtime**

*Two words to clear: this is the full state. See 04 for the shed state.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick double layer of hoar frost over an invisible square surface, dense feathery crystals covering most of the area, with only a small clear patch remaining at the very centre. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 04 &middot; Frost, one layer shed

`256x256` &middot; **greyscale, tinted at runtime**

*The halfway state after one word beside it.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A layer of hoar frost over an invisible square surface that has partly flaked away, the feathery crystals broken and lifting at the edges with more of the centre now clear, small flakes coming loose. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 05 &middot; Mist

`256x256` &middot; **greyscale, tinted at runtime**

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A soft veil of fog drifting across an invisible square surface, thickest along the top and thinning toward the bottom, wispy and uneven, like breath on cold glass. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

---

# Bodies (14)

## 06 &middot; Branch

`256x256` &middot; full colour

*Debuts at level 10 - the first obstacle anybody meets. Currently the emoji that may not render at all.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single fallen leafless branch lying diagonally across the frame, bare grey-brown wood with a few short broken side twigs and a little lichen. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 07 &middot; Bramble

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A dense tangle of thorny bramble knotted into a rough ball, dark green leaves and woody stems, a few soft thorns and one or two ripe blackberries tucked inside. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 08 &middot; Root

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick woody tree root, whole and unbroken, running across the frame, warm brown bark with a raised knotted burl at its middle. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 09 &middot; Spore

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A cluster of pale lilac mushrooms with softly domed caps at three different heights, plump stems, a faint dusting of spores around the base. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 10 &middot; Reed

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small stand of olive green marsh reeds seen straight on, five or six slender upright stalks with fine leaf blades and one soft brown seed head. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 11 &middot; Mire

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A pool of glossy brown bog mud, thick and sticky, its surface slowly bulging with one lazy bubble rising, a few reed stubs at the edge. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 12 &middot; Stone

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A rounded mossy grey boulder, weathered and softly lumpy, patches of bright green moss across the top and a few tiny ferns at its base. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 13 &middot; Shroud

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A dense sphere of soft darkness hanging in the air, edges frayed and smoky, swallowing the light around it, with the faintest cool glow deep inside. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 14 &middot; Crystal

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A cluster of translucent pale blue crystal shards growing outward from a common base, faceted and glassy, catching light along their edges. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 15 &middot; Scree

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A heap of loose grey shale fragments piled unsteadily, flat angular chips of stone in several sizes, a few having slipped to one side. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 16 &middot; Current

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A tight spiral of clear water turning in place, a small whirlpool seen from above, with curved white foam lines following the spin and a few flecks of spray. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 17 &middot; Wind

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A curl of moving air made visible, three or four swirling white streaks looping around each other with a few small leaves caught up and carried along. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 18 &middot; Pest

`256x256` &middot; full colour

*Facing right only - flipped for left, reused for up and down.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small round grub-like garden bug, plump and soft, cosy rather than creepy, with big friendly dark eyes and two short antennae, seen from the side facing right. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 19 &middot; Gift crate

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small gift parcel wrapped in soft brown paper with a wide fabric ribbon tied in a bow on top, slightly squashed and hand-wrapped looking. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

---

# Damage (7)

## 20 &middot; Stone, cracked

`256x256` &middot; full colour

*A chip out of the silhouette, not a filter over the whole tile.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A mossy grey boulder with a large piece freshly broken off one side, the break face bright and raw against the weathered mossy surface, sharp fresh edges, a few small chips fallen away below. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 21 &middot; Crystal, cracked

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A cluster of pale blue crystal shards with one large facet sheared clean off, the exposed inner crystal brighter and rawer than the weathered outer faces, fine fracture lines running back from the break. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 22 &middot; Shroud, thinning

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A sphere of soft darkness torn open across one side, the frayed edges pulling back and a dim cool light showing through the gap. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 23 &middot; Root, freshly cut

`256x256` &middot; full colour

*Stage 1 of the healing countdown.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick woody tree root severed cleanly across its middle, the two cut ends held slightly apart with a dark open gap between them, pale raw wood at both cut faces, a few fibrous strands beginning to reach across the gap. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 24 &middot; Root, half knitted

`256x256` &middot; full colour

*Stage 2 of 3. The clock, on the tile.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A severed woody tree root whose two cut ends are being drawn back together, roughly half the gap now bridged by pale fibrous strands knitting across it, bark starting to creep over from both sides. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 25 &middot; Root, healed over

`256x256` &middot; full colour

*Stage 3. Back to square one.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick woody tree root, whole and unbroken, with a raised knotted scar across its middle where it has healed shut, rough new bark grown across the join. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 26 &middot; Scree, fractured

`256x256` &middot; full colour

*Drawn from the start, so the split is a promise kept rather than the game cheating.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A heap of loose grey shale fragments with a network of fine dark fracture lines running through the larger pieces, visibly about to break apart further. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

---

# Telegraph (12)

## 27 &middot; Bramble vine, reaching one third

`512x256` &middot; full colour

*Two tiles wide. Vine starts at the left edge, mid-height.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine growing horizontally out from the left edge of the frame, thin woody stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip. The vine occupies only the middle horizontal third of the frame and reaches exactly one third of the way across. The entire right two thirds of the frame is empty. The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 28 &middot; Bramble vine, reaching two thirds

`512x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine growing horizontally out from the left edge of the frame, thin woody stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip. The vine reaches exactly two thirds of the way across the frame. The remaining right-hand third is empty. The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 29 &middot; Bramble vine, closing over

`512x256` &middot; full colour

*The moment of conversion. The most important frame in the whole set.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine that has grown all the way across the frame from left to right and is now curling and closing over an unseen square object at the right-hand end, wrapping around it the way fingers close over a stone. Small dark green leaves along the stem, soft thorns, a curled tendril. The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 30 &middot; Bramble vine, vertical set

`256x512` &middot; full colour

*Needed at all three lengths, same as 27-29. Down and left come from flipping.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine growing vertically upward from the bottom edge of the frame, thin woody stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip, reaching two thirds of the way up. The top third of the frame is empty. The vine must begin hard against the bottom edge of the frame with nothing below it, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 31 &middot; Spore motes drifting

`128x128` &middot; full colour

*I animate the path - spores land anywhere, so the travel cannot be baked in.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small drifting cluster of pale lilac fungal spores, soft and downy like dandelion seed, five or six motes at slightly different sizes, faintly luminous. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 32 &middot; Spore dusting, light

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A light scattering of pale lilac fungal spores settled unevenly across an invisible square surface, sparse and patchy, thickest near the centre. Only the dust - no tile, no border, no edge. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 33 &middot; Spore dusting, heavy

`256x256` &middot; full colour

*One drop before it converts. This is the tell.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A heavy dusting of pale lilac fungal spores settled thickly across an invisible square surface, almost covering it, thinning slightly at the corners. Only the dust - no tile, no border, no edge. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 34 &middot; Pest, staring at its target

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small round grub-like garden bug, plump and soft, cosy rather than creepy, with big friendly dark eyes and two short antennae, seen from the side facing right. It is staring intently at something out of frame to the right, both antennae pointed the same way. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 35 &middot; Pest, crouched to jump

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small round grub-like garden bug, plump and soft, with big friendly dark eyes and two short antennae, seen from the side facing right, body squashed low and tensed as though about to spring sideways, antennae swept back. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 36 &middot; Reed stalk, tileable

`128x256` &middot; full colour

*Column height varies, so this has to tile. Seamless top and bottom is the whole requirement.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. Two tall slender olive green marsh reed stalks running straight up the frame with fine leaf blades, drawn so that the very top and the very bottom edges match exactly and the image can be repeated vertically without a visible seam. The stalks must run right off both the top and the bottom edge of the frame so the image tiles seamlessly, and must not be centred vertically. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 37 &middot; Reed grip

`256x256` &middot; full colour

*Sits on each tile the reed is holding.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. Two olive green marsh reed stalks curling and gripping around an unseen square object, wrapping it from both sides the way a hand closes, leaf blades bent around the shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 38 &middot; Mire strands

`256x128` &middot; full colour

*Explains why a shelf of tiles is hanging in mid-air.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. Thick sticky strands of brown bog mud stretched vertically between two unseen surfaces, like warm caramel pulled apart, three or four strands of uneven thickness, glistening slightly. The strands must run right off both the top and the bottom edge of the frame, and must not be centred vertically. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

---

# Specials (3)

## 39 &middot; Gold tile

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A square wooden letter tile turned to solid gold, warm and buttery, gently rounded corners, a soft highlight running along one edge as though catching low afternoon sun. The centre is clean enough for a letter to sit over it. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 40 &middot; A fallen star

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small fallen star resting on nothing, five soft rounded points, pale gold at the tips deepening to warm cream at the centre, glowing faintly from within, slightly lopsided and hand-made looking rather than geometric. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

## 41 &middot; An acorn

`256x256` &middot; full colour

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single plump acorn with its cap on, warm brown nut and a textured tan cap, seen from the side, round and cosy. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Fully transparent background.
```

---

## Counts

- Keystone: 1
- Coatings: 4
- Bodies: 14
- Damage: 7
- Telegraph: 12
- Specials: 3
- **Total: 41** (5 greyscale, 36 full colour)
