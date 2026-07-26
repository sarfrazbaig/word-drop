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
| Flat pure magenta `#FF00FF` | the 37 opaque assets | maximally far from every green, brown and grey in the set, so the cut is clean and the subject's own colours survive untouched | `--mode=chroma` |
| Flat pure black | the 4 coatings - ice, both frosts, mist | these are meant to be semi-transparent anyway, so brightness becomes opacity: thick crystals solid, thin edges faint. Honest soft edges, no keying halo | `--mode=luma` |

Each prompt says which one it wants and which mode recovers it. Then:

```bash
node ux/tools/dealpha.js incoming/01-tile.png art/tiles/face.png --mode=chroma --key=ff00ff
```

Run it with `--report` on anything and it will tell you whether the file has real alpha, how
much of it is used, and whether it can see a painted checkerboard.

**If something already came back with a checkerboard**, `--mode=checker` will attempt a
salvage, but read its warning. It cuts away any part of the subject that happens to match a
checker square, which on a greyscale asset means most of it. Regenerating on magenta is
cheaper than fighting it.

## How to use it

Each block below is the whole prompt. Copy one, paste it, generate. Do not add a shadow or a
border - the constraint text already asks for their absence, and every one of
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

`256x256` &middot; **greyscale, tinted at runtime** &middot; `magenta bg, recover with --mode=chroma`

*Everything else is judged against this. Tinted at runtime, so one asset serves all 15 countries.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A square wooden letter tile seen straight on, gently rounded corners, with fine vertical wood grain running from top to bottom and a soft sheen along the upper edge. The centre is almost clean and unmarked so that a bold letter can sit over it and stay readable. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

---

# Coatings (4)

## 02 &middot; Ice

`256x256` &middot; **greyscale, tinted at runtime** &middot; `black bg, recover with --mode=luma`

*Greyscale is not a style choice here - it is what stops the measured colour collision returning.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thin sheet of clear ice over an invisible square surface, seen straight on, with delicate frost crystals growing inward from all four edges and the centre left almost clear. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure black background filling the entire frame edge to edge. Do NOT draw a checkerboard pattern and do NOT draw a scene. The subject must be the only bright thing in the frame, fading to pure black at its softest edges.
```

## 03 &middot; Deep frost

`256x256` &middot; **greyscale, tinted at runtime** &middot; `black bg, recover with --mode=luma`

*Two words to clear: this is the full state. See 04 for the shed state.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick double layer of hoar frost over an invisible square surface, dense feathery crystals covering most of the area, with only a small clear patch remaining at the very centre. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure black background filling the entire frame edge to edge. Do NOT draw a checkerboard pattern and do NOT draw a scene. The subject must be the only bright thing in the frame, fading to pure black at its softest edges.
```

## 04 &middot; Frost, one layer shed

`256x256` &middot; **greyscale, tinted at runtime** &middot; `black bg, recover with --mode=luma`

*The halfway state after one word beside it.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A layer of hoar frost over an invisible square surface that has partly flaked away, the feathery crystals broken and lifting at the edges with more of the centre now clear, small flakes coming loose. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure black background filling the entire frame edge to edge. Do NOT draw a checkerboard pattern and do NOT draw a scene. The subject must be the only bright thing in the frame, fading to pure black at its softest edges.
```

## 05 &middot; Mist

`256x256` &middot; **greyscale, tinted at runtime** &middot; `black bg, recover with --mode=luma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A soft veil of fog drifting across an invisible square surface, thickest along the top and thinning toward the bottom, wispy and uneven, like breath on cold glass. Pure white and shades of pale grey ONLY - absolutely no colour of any kind, not even a tint. All character must come from texture, shading and shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure black background filling the entire frame edge to edge. Do NOT draw a checkerboard pattern and do NOT draw a scene. The subject must be the only bright thing in the frame, fading to pure black at its softest edges.
```

---

# Bodies (14)

## 06 &middot; Branch

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Debuts at level 10 - the first obstacle anybody meets. Currently the emoji that may not render at all.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single fallen leafless branch lying diagonally across the frame, bare grey-brown wood with a few short broken side twigs and a little lichen. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 07 &middot; Bramble

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A dense tangle of thorny bramble knotted into a rough ball, dark green leaves and woody stems, a few soft thorns and one or two ripe blackberries tucked inside. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 08 &middot; Root

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick woody tree root, whole and unbroken, running across the frame, warm brown bark with a raised knotted burl at its middle. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 09 &middot; Spore

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A cluster of pale lilac mushrooms with softly domed caps at three different heights, plump stems, a faint dusting of spores around the base. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 10 &middot; Reed

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small stand of olive green marsh reeds seen straight on, five or six slender upright stalks with fine leaf blades and one soft brown seed head. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 11 &middot; Mire

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A pool of glossy brown bog mud, thick and sticky, its surface slowly bulging with one lazy bubble rising, a few reed stubs at the edge. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 12 &middot; Stone

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A rounded mossy grey boulder, weathered and softly lumpy, patches of bright green moss across the top and a few tiny ferns at its base. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 13 &middot; Shroud

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A dense sphere of soft darkness hanging in the air, edges frayed and smoky, swallowing the light around it, with the faintest cool glow deep inside. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 14 &middot; Crystal

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A cluster of translucent pale blue crystal shards growing outward from a common base, faceted and glassy, catching light along their edges. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 15 &middot; Scree

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A heap of loose grey shale fragments piled unsteadily, flat angular chips of stone in several sizes, a few having slipped to one side. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 16 &middot; Current

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A tight spiral of clear water turning in place, a small whirlpool seen from above, with curved white foam lines following the spin and a few flecks of spray. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 17 &middot; Wind

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A curl of moving air made visible, three or four swirling white streaks looping around each other with a few small leaves caught up and carried along. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 18 &middot; Pest

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Facing right only - flipped for left, reused for up and down.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small round grub-like garden bug, plump and soft, cosy rather than creepy, with big friendly dark eyes and two short antennae, seen from the side facing right. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 19 &middot; Gift crate

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small gift parcel wrapped in soft brown paper with a wide fabric ribbon tied in a bow on top, slightly squashed and hand-wrapped looking. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

---

# Damage (7)

## 20 &middot; Stone, cracked

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*A chip out of the silhouette, not a filter over the whole tile.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A mossy grey boulder with a large piece freshly broken off one side, the break face bright and raw against the weathered mossy surface, sharp fresh edges, a few small chips fallen away below. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 21 &middot; Crystal, cracked

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A cluster of pale blue crystal shards with one large facet sheared clean off, the exposed inner crystal brighter and rawer than the weathered outer faces, fine fracture lines running back from the break. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 22 &middot; Shroud, thinning

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A sphere of soft darkness torn open across one side, the frayed edges pulling back and a dim cool light showing through the gap. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 23 &middot; Root, freshly cut

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Stage 1 of the healing countdown.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick woody tree root severed cleanly across its middle, the two cut ends held slightly apart with a dark open gap between them, pale raw wood at both cut faces, a few fibrous strands beginning to reach across the gap. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 24 &middot; Root, half knitted

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Stage 2 of 3. The clock, on the tile.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A severed woody tree root whose two cut ends are being drawn back together, roughly half the gap now bridged by pale fibrous strands knitting across it, bark starting to creep over from both sides. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 25 &middot; Root, healed over

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Stage 3. Back to square one.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A thick woody tree root, whole and unbroken, with a raised knotted scar across its middle where it has healed shut, rough new bark grown across the join. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 26 &middot; Scree, fractured

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Drawn from the start, so the split is a promise kept rather than the game cheating.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A heap of loose grey shale fragments with a network of fine dark fracture lines running through the larger pieces, visibly about to break apart further. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

---

# Telegraph (12)

## 27 &middot; Bramble vine, reaching one third

`512x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Two tiles wide. Vine starts at the left edge, mid-height.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine growing horizontally out from the left edge of the frame, thin woody stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip. The vine occupies only the middle horizontal third of the frame and reaches exactly one third of the way across. The entire right two thirds of the frame is empty. The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 28 &middot; Bramble vine, reaching two thirds

`512x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine growing horizontally out from the left edge of the frame, thin woody stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip. The vine reaches exactly two thirds of the way across the frame. The remaining right-hand third is empty. The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 29 &middot; Bramble vine, closing over

`512x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*The moment of conversion. The most important frame in the whole set.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine that has grown all the way across the frame from left to right and is now curling and closing over an unseen square object at the right-hand end, wrapping around it the way fingers close over a stone. Small dark green leaves along the stem, soft thorns, a curled tendril. The vine must begin hard against the left edge of the frame with nothing to its left, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 30 &middot; Bramble vine, vertical set

`256x512` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Needed at all three lengths, same as 27-29. Down and left come from flipping.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single thorny bramble vine growing vertically upward from the bottom edge of the frame, thin woody stem with small dark green leaves and a few soft thorns, a curled tendril at the growing tip, reaching two thirds of the way up. The top third of the frame is empty. The vine must begin hard against the bottom edge of the frame with nothing below it, and it must not be centred. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 31 &middot; Spore motes drifting

`128x128` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*I animate the path - spores land anywhere, so the travel cannot be baked in.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small drifting cluster of pale lilac fungal spores, soft and downy like dandelion seed, five or six motes at slightly different sizes, faintly luminous. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 32 &middot; Spore dusting, light

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A light scattering of pale lilac fungal spores settled unevenly across an invisible square surface, sparse and patchy, thickest near the centre. Only the dust - no tile, no border, no edge. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 33 &middot; Spore dusting, heavy

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*One drop before it converts. This is the tell.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A heavy dusting of pale lilac fungal spores settled thickly across an invisible square surface, almost covering it, thinning slightly at the corners. Only the dust - no tile, no border, no edge. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 34 &middot; Pest, staring at its target

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small round grub-like garden bug, plump and soft, cosy rather than creepy, with big friendly dark eyes and two short antennae, seen from the side facing right. It is staring intently at something out of frame to the right, both antennae pointed the same way. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 35 &middot; Pest, crouched to jump

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small round grub-like garden bug, plump and soft, with big friendly dark eyes and two short antennae, seen from the side facing right, body squashed low and tensed as though about to spring sideways, antennae swept back. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 36 &middot; Reed stalk, tileable

`128x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Column height varies, so this has to tile. Seamless top and bottom is the whole requirement.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. Two tall slender olive green marsh reed stalks running straight up the frame with fine leaf blades, drawn so that the very top and the very bottom edges match exactly and the image can be repeated vertically without a visible seam. The stalks must run right off both the top and the bottom edge of the frame so the image tiles seamlessly, and must not be centred vertically. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 37 &middot; Reed grip

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Sits on each tile the reed is holding.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. Two olive green marsh reed stalks curling and gripping around an unseen square object, wrapping it from both sides the way a hand closes, leaf blades bent around the shape. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 38 &middot; Mire strands

`256x128` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

*Explains why a shelf of tiles is hanging in mid-air.*

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. Thick sticky strands of brown bog mud stretched vertically between two unseen surfaces, like warm caramel pulled apart, three or four strands of uneven thickness, glistening slightly. The strands must run right off both the top and the bottom edge of the frame, and must not be centred vertically. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

---

# Specials (3)

## 39 &middot; Gold tile

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A square wooden letter tile turned to solid gold, warm and buttery, gently rounded corners, a soft highlight running along one edge as though catching low afternoon sun. The centre is clean enough for a letter to sit over it. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 40 &middot; A fallen star

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A small fallen star resting on nothing, five soft rounded points, pale gold at the tips deepening to warm cream at the centre, glowing faintly from within, slightly lopsided and hand-made looking rather than geometric. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
```

## 41 &middot; An acorn

`256x256` &middot; full colour &middot; `magenta bg, recover with --mode=chroma`

```text
Hand-painted storybook illustration in soft gouache, warm and cosy, the look of a children's picture book. Visible brush texture, soft edges, no hard outlines, no cel shading, not flat vector art, not photorealistic, not a 3D render. Gentle and inviting rather than threatening. A single plump acorn with its cap on, warm brown nut and a textured tan cap, seen from the side, round and cosy. Centred with a small even margin. No drop shadow, no contact shadow, no ground plane. No text, letters, numbers or symbols. Flat even lighting or a soft light from the upper left. Bold simple silhouette that still reads when shrunk to 45 pixels. Place the subject on a completely flat, solid, uniform pure magenta background, hex FF00FF, filling the entire frame edge to edge. Do NOT draw a checkerboard pattern, do NOT draw a scene or a surface, and use no magenta or pink anywhere in the subject itself.
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
