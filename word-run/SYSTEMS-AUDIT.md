# Hushwood - systems audit

Against commit `624141a`, 2026-08-03.

## Coverage, stated honestly

I audited **every level-keyed rule table and its consumers**: `TROUBLE`, `OBSTACLE_DEBUT`,
`GOALS`, `goalFor`, `seedGoal`, `GATE`, `KEYSTONE`, `HOME`, `HOME_CURVE`, `FLOOR_AT`,
`CALL_MINL`, `CALL_GAP`, `CALLINGS`, `canHear`, `seatsByLevel`, `slotsFor`, `EARLY`,
`isMilestone`, `BIOME_LEN`, `PROLOGUE_END`, the summon queue, and the win/fail paths.

I did **not** line-by-line read rendering, audio, art loading, Alder staging, or the shop.
Those are listed in section 6 as unaudited. Everything in sections 1 to 4 is verified against
the code, not remembered.

**The signature of every fault found: a rule authored in two places that drifted apart.**

---

## 1. The collision map, by level

Adventure levels (what the player sees). Biome 0 = A1-20, biome 1 = A21-40, and so on.

| A | Seats | Friend due | Gate | Keystone | Milestone | Goal | Legal? |
|---|---|---|---|---|---|---|---|
| 6 | 1 | **dog** | | | | | 2 friends, 1 seat |
| 7 | 2 | | | | | | |
| 9 | 2 | **bee** | | | | | |
| 10 | 3 | | practice | | gold 25% | | |
| 13 | 3 | **robin** | | | | | |
| 14 | 4 | | | | | | |
| 15 | 4 | | | | | **thaw (ice)** | **ILLEGAL** |
| 16 | 4 | **mouse** | | | | | |
| 18 | 4 | **dove** | | | | | |
| 20 | 4 | | **door** | **worm** | gold 25% | **boulder (stone)** | **ILLEGAL** |
| 23 | 4 | **chick** | | | | harvest | ok |
| 26 | 4 | **fox** | | | | | |
| 28 | 4 | | | | | **thaw (ice)** | **ILLEGAL** |
| 29 | 4 | **hare** | | | | | |
| 30 | 4 | | gate | | gold 25% | | |
| 33 | 4 | | | | | **thaw (ice)** | **ILLEGAL** |
| 34 | 4 | **moth** | | | | | |
| 37 | 4 | **crow** | | | | | |
| 38 | 4 | | | | | harvest | ok |
| 40 | 4 | | **door** | **raccoon** | gold 25% | | |

**Adventure 20 carries five systems at once**: door gate, keystone grant, milestone gold,
an illegal boulder goal, and any pending summon. That is the round that broke for you, and
it was overloaded by design before any bug was involved.

---

## 2. Confirmed faults

### C1 - Goals demand obstacles that cannot legally exist

`seedGoal` writes `t.kind = G.seed` with **no debut or biome check**, while the random
spread gates itself correctly at line 4240. Two systems, one rule, one obeys.

| Goal | Seeds | Legal from | Legal in | Scheduled at |
|---|---|---|---|---|
| `thaw` | ice | **A262** | biomes 13-14 | **A15, A20, A28, A33, A88, A93…** |
| `boulder` | stone | **A162** | biomes 8-14 | **A20, A63, A68, A93…** |
| `lift` | mist | **A182** | biomes 9-10, 12-14 | **A54** |
| `unravel` | crate | A13 | - | A32, A43, A48… ok |
| `harvest` | gold | ungated | - | A38, A23… ok |
| `cut` | bramble | A22 | biomes 1-4 | A79, biome 3, ok |

**This is not two bad levels.** The rotation `if(L>20 && L%5===3)` draws from a pool
containing `thaw` and `boulder` **forever**, so ice and stone recur in every country for the
whole game. Ice is 247 levels and 13 countries early on first contact.

The authored comment states the intended rule and the code violates it:
*"every new goal debuts a few levels after its obstacle does - meet the trouble first, then
be asked about it."*

### C2 - Crown trials inherit C1, and use the wrong unit

```js
const gp=["thaw","boulder","harvest","unravel"], gi=Math.floor(level/13);
```

`goalFor` converts to adventure levels (`L = advOf(L)`); this line uses the **raw internal
level**. Two units in one system. At A107 it seeds thaw + boulder together, both illegal
there, in biome 5.

### C3 - `HOME_CURVE` disagrees with `HOME` - counted, not guessed

`HOME_CURVE` is declared as the audit that keeps the map honest. It has drifted.

```
declared: [5, 4,4,3,3,2,2,2,2,2,1,1,1,1,0]  = 33
actual  : [7, 4,4,3,3,2,2,2,2,2,1,1,1,1,0]  = 35
```

Biome 0 holds **seven** friends (cat, dog, bee, robin, mouse, dove, chick), not five. Every
other biome is correct. 35 homed + 15 keystones = 50, so the grove total is right and only
the curve is wrong.

**Seven friends live in the first country, which has at most four seats.** That is your pet
bombardment, arithmetically, and it is authored rather than emergent.

### C4 - The courtship valve can never fire for the first ten friends

Courtship is described as the valve: do what a friend loves and it arrives early. For every
friend that has a floor, **the floor is lower than the courtship minimum**, so the guarantee
always beats the hunt.

| Friend | Floor (guaranteed) | `CALL_MINL` (courtship) | Valve reachable? |
|---|---|---|---|
| dog | 6 | 7 | no |
| bee | 9 | 23 | no |
| robin | 13 | 178 | no |
| mouse | 16 | 84 | no |
| dove | 18 | 64 | no |
| chick | 23 | 228 | no |
| fox | 26 | 30 | no |
| hare | 29 | 51 | no |
| moth | 34 | 44 | no |
| crow | 37 | 57 | no |

"It heard you, and couldn't wait" cannot happen for any of them. The hunt is decorative for
the entire first third of the game. The meeting *ask* still fires - that part works - but the
early-arrival reward does not exist.

### C5 - Every gate is also a milestone

`GATE` keys are every 10. `isMilestone` is `advOf(L) % 10 === 0`. They are the same set, so
**every gate round also rains 25% gold**. Possibly intended, but nothing declares it, and it
means the hardest rounds are also the most generous.

### C6 - Seats stop at four, forever

`seatsByLevel` returns 4 from A14 onward with no further growth, against 50 collectable
friends. 46 friends are permanently bench decoration. A stale debug comment claims "player
level 25 → five seats", and the CSS at line 1959 was measured for **five** seats. Three
places disagree about how many chairs exist.

### C7 - The keystone bypasses the queue

Confirmed previously. `winLevel` writes `P.grove[key]` directly, skipping `summonQ`,
`metGrove`, and any encounter. At A20 with a summon pending this grants **two friends in one
round**, which is the state that produced your ghost worm.

### C8 - `grove` vs `metGrove`

Confirmed previously. Two answers to "do I have this friend". Book count reads `grove`, book
contents read `metGrove`. Also breaks the purchase flow.

---

## 3. Edge cases, and whether they are handled

| # | Edge case | Handled? |
|---|---|---|
| E1 | Summon pending on a goal level | **No** - goal deleted |
| E2 | Summon pending on a **gate** level | **No** - gate deleted, same line |
| E3 | Keystone due and summon pending | **No** - two friends, one round |
| E4 | Goal seeds an obstacle illegal in this biome | **No** - no check exists |
| E5 | Gate failed, push back below a friend's floor | Partly - friends are not revoked, but a floor can re-fire |
| E6 | Friend bought, app closed before next round | **No** - `metGrove` never written |
| E7 | App closed mid-reveal | **No** - state committed after ceremony |
| E8 | App closed mid-round | **Yes** - `saveRun` snapshots correctly |
| E9 | App closed after win, before counter ticks | **Yes** - explicitly fixed, `P.run=null` on win |
| E10 | Lesson interrupted mid-script | **Yes** - `P.run=null`, level replays cleanly |
| E11 | Save fails (quota, private mode) | **Now reported** - was silent until today |
| E12 | Save read back stale | **Now detected** - was invisible |
| E13 | Seats full when a friend arrives | Partly - joins bench, but seat count can exceed friends met |
| E14 | Two callings inside `CALL_GAP` | **Yes** - gap rule enforced |
| E15 | Naming round failed twice | **Yes** - ask waived after 2 fails |
| E16 | Courtship ask uses undefined vocabulary | **No** - "flourishes", "soft letters" |
| E17 | Gauntlet seeds two illegal obstacles | **No** - C2 |
| E18 | Milestone gold on a gate round | Unstated - C5 |
| E19 | `HOME_CURVE` drifts from `HOME` | **No** - the audit that was supposed to catch it is the thing that drifted |
| E20 | Prologue offset in any reported number | **Now handled** - `shown` ships with `lv` |

**13 of 20 unhandled.** Eleven of those thirteen are one disease: a rule written twice.

---

## 4. Root cause

Every fault in section 2 has the same shape.

| Rule | Source A | Source B | Result |
|---|---|---|---|
| Which obstacles exist here | `TROUBLE` | `goalFor` + `seedGoal` | ice in the Clearing |
| How many friends live here | `HOME` | `HOME_CURVE` | 7 vs 5 |
| When a friend arrives | `FLOOR_AT` | `CALL_MINL` | courtship dead |
| Do I own this friend | `grove` | `metGrove` | 8/50 showing 7 |
| How many can I field | `seatsByLevel` | CSS + debug comment | 4 vs 5 |
| What number is this level | internal | displayed | every bug report off by 5 |

**Nothing here is a coding error.** Every one is two hand-authored tables that agreed on the
day they were written and drifted afterwards, with nothing checking that they still agree.

---

## 5. The recommendation

Not a list of fixes. One structural change, then the fixes fall out.

**A boot-time consistency check that refuses to disagree with itself.** It runs in dev, logs
in production, and asserts:

1. No goal is scheduled before its obstacle's debut, or outside its biomes
2. `HOME_CURVE` equals the counted `HOME`
3. Homed + keystones equals `GROVE.length`
4. Every `FLOOR_AT` is above its `CALL_MINL`, or the valve is declared dead on purpose
5. Friends whose home is biome N never exceed seats available in biome N
6. Every keystone level is a gate level
7. One acquisition path, asserted: nothing writes `grove` without going through it

Item 1 alone would have caught the ice. Item 2 would have caught the bombardment before
you played it. This is the same instinct as the pet state machine in `PETS-SPEC.md`: make
it impossible for two things to be the truth.

---

## 6. Not yet audited

Stated so nothing is assumed clean:

- Alder staging, priority queue, windowing
- Powers - whether every friend's power fires, and its tier growth at 50/100/150
- The shop, ads, daily streak
- Score, target taper (`TAPER_KNOTS`), star thresholds
- Rendering, art loading, audio
- The level throwback - separate defect, now instrumented
- Whether every one of the 50 friends has working art and a working power
