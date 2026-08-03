# Hushwood - what's next

Written 2026-08-04, end of the slate session. Branch `art/slate-port`, pushed.
`main` untouched at `97c60a3`.

**The standing rule:** nothing from the old build gets ported without explicit sign-off.
"It exists in the game" is evidence of nothing - a lot of it only existed to work around
constraints that are gone.

---

## Where things stand

| | |
|---|---|
| `main` | the warm game, refactored into 24 modules, 34 bug fixes, selftest 19/19 |
| `art/cool-slate` | the slate prototype - the direction, proven |
| `art/slate-port` | **the live branch** - slate becoming the game |

In `slate/` today: the real dictionary, the real reading rules, both tools, the beat, the
breath and hold, ten hand-written stages, the country palette, drop physics.

---

## Tomorrow, in order

### 1. The grove - 50 friends
Port `GROVE`, `CALLINGS`, `HOME`, `KEYSTONE`, `GATE`, `FLOOR_AT`, `CALL_MINL`. Pure data, no
DOM. Gets the shelf holding real friends with real names and the arrival schedule working.
**Blocked on nothing.**

### 2. The 22 tile designs
Decided: obstacles keep their identities - ice still reads as ice - but the treatment is new.
Identity from a coloured inlay and a damage state, not a texture swap.
`normal gold ice frost stone crate mist bramble root reed mire spore pest shroud branch scree
current crystal wild bomb rainbow friend`
**I'll show the full set on one board before wiring any of it.**

### 3. The level curve and goals
Real progression instead of the ten hand-written stages. `EARLY`, `TAPER_KNOTS`, `goalFor`,
`seedGoal` - with the legality check that came out of the ice bug.

### 4. Scoring, cascades and the moments
`chainburst`, `jackpotburst` (5+ letters), `droplabel`, the spare-moves bonus **said out
loud** on the clear card rather than ticking past under confetti.

### 5. The friend's voice
Decided: **a speech bubble over the empty upper board**, with the friend's circular portrait
as its avatar. No travel to the centre, no covering the board. Uses the dead sky the stack
never reaches.

### 6. The meeting
Decided: **no separate screen.** Same screen, panes recoloured so it stands out. No
silhouette, no purple glow, no spooky music.

### 7. Pips and tier badges
Both need designing from scratch - circular portraits changed the problem and the old row of
dots no longer fits.

---

## After that

- **The Book / party screen** - and the equip flow. Three options to build and compare
  side by side; C as I first described it dies on 50 pets and a double swipe.
- **Glossary / rules / how to play** in the hamburger, revisitable.
- Home, menu, shop, finale.
- Effects: shards, killcell, goldflash, shockwave.
- Save and telemetry into slate.

---

## Decided - do not re-open

| | |
|---|---|
| Alder | not ported. The ask row does his job |
| The silhouette reveal | dead. It was a hint for guessing names |
| Purple board glow + spooky music | dead. Killed the cosy for a guessing game that's gone |
| Per-country decorations | dead. Pane colour carries the country |
| `ov-journal` | dead |
| `ov-pet` | deleted, not redesigned. Equip folds into the party screen |
| FTUE and story cards | skipped - your designer has it |
| Friend fly-to-board animations | dead. Bubbles only |
| Tile geometry | unchanged. 94/8 IS the game's 44/4 at 2.16x |

---

## Needs your call

1. **Portrait art.** Five new medallions, fifty old ones. Do all 50 get redrawn, or does
   slate ship with the old art until they arrive?
2. **The gold ring and pastel field are baked into the new JPEGs.** Every other surface takes
   its colour from the country; gold won't. Ask the designer for transparent PNGs with no
   ring, so the UI can frame and tint them? Also file size - 145-390KB each, ~10MB for 50.
3. **The pale characters.** The white cat and white owl collapse into pale discs at shelf
   size. Worth asking for a darker rim or deeper background.

---

## Still open on the main game (separate from slate)

- **The level throwback.** Instrumented with `level_set`, never caught in the wild. Needs a
  session where it happens.
- **Guddu's lost run.** 17 levels destroyed by the flush bug - fixed, but that data is gone.
- **Four judgement calls to ratify or overrule:** branch payout 4 → 8, ICK accepted, NON
  still refused, dove's ask `flourish x1` → `word4 x2`.
- **Two standing audit warnings:** courtship can never fire for the first ten friends (the
  floor always beats the calling); the First Clearing homes seven friends against four seats.
- **37 unattached POWERS handlers**, 11 of them called by name and never true.
- The remainder of the 45-bug list beyond the 34 fixed.
