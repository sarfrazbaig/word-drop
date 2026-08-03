# Hushwood - the friend system, specified whole

Status: proposal. Nothing here is built. Written 2026-08-03 against commit `624141a`.

---

## 0. The diagnosis in one sentence

A friend's arrival is currently *an event that happens to a level*, and a level already has a
job, so the two fight and the level loses.

Everything below follows from that. The bugs are not independent, and fixing them one at a
time is why a fix keeps producing a new symptom.

---

## 1. How it works today, exactly

### 1.1 The three channels a friend can arrive through

| Channel | Trigger | Code |
|---|---|---|
| **Floor** | You reach an authored depth. Guaranteed, regardless of play. | `FLOOR_AT`, `HOME` |
| **Courtship** | You do the thing a friend loves, inside its own country. Early valve. | `CALLINGS`, `canHear()` |
| **Keystone** | You clear a door. Handed over, never spelled. | `KEYSTONE` |

Floor and courtship both push onto `P.summonQ`. The keystone does not - it writes straight
into the grove during `winLevel`. **Three channels, two completely different landing paths.**

### 1.2 The four pieces of state a friend passes through

| Field | Meaning | Written when |
|---|---|---|
| `P.called[w]` | queued, announcement shown | at the moment of calling |
| `P.summonQ` | waiting for a naming level | same |
| `P.summon` | this round's naming target | start of a round, `summonQ.shift()` |
| `P.grove[w]` | in the book, counts toward 50 | name spelled, or bought, or keystone |
| `P.metGrove[w]` | actually usable, can be seated | start of the **next** round |

That is five fields for one concept, written by four different paths.

### 1.3 What a naming round does to a level

```js
if(!(P.summon && !P.grove[P.summon]) && !(level===4 && !P.grove.cat)){
  const gt = goalFor(level);
  ...   // the round's objective is assigned HERE
}
```

**A pending summon deletes the round's objective.** Not defers, not layers - deletes.

### 1.4 Seats

```js
seatsByLevel: 1 → 2 at adv 7 → 3 at adv 10 → 4 at adv 14
slotsFor    : min(seatsByLevel, count(metGrove), gate cap)
arrivals    : cat, dog@6, bee@9, robin@13, mouse@16, dove@18, chick@23
```

Two independent schedules that were never reconciled against each other.

---

## 2. The five structural faults, mapped to reported bugs

| # | Fault | Symptoms it produced |
|---|---|---|
| **F1** | A naming round and a progression round are the same round | Door at adv 20 became a chick naming round; "cleared it, then was asked to clear the goal too" |
| **F2** | `grove` and `metGrove` are two answers to one question | Book reads 8/50 but shows 7; bought friend must be earned again; a seat opens with nobody to fill it |
| **F3** | Arrivals and seats are separate schedules | 2 friends / 1 seat before adv 7; 5 friends by adv 20 |
| **F4** | The keystone bypasses the queue entirely | Two friends granted in one round at the door - a state nothing was written for |
| **F5** | Courtship asks use undefined vocabulary | "flourishes", "soft letters" - a reward gated behind a word the game never teaches |

The level throwback (adv 25 → 20) is **not** on this list. Its cause is still unknown and is
now instrumented. It is a persistence or progression defect, not a pet defect, and it should
not be folded into this work.

---

## 3. The proposed system

### 3.1 One rule

> **A friend is never acquired inside a progression round.**

Levels do levels. Encounters do friends. Nothing else in this document is negotiable if that
rule holds, and nothing else works if it does not.

### 3.2 One state machine, replacing five fields

```
UNKNOWN ──call──► CALLED ──encounter cleared──► MET ──seat available──► SEATED
                    │                            ▲
                    └──────── bought ────────────┘
```

| State | Meaning | In the book? | Counts toward 50? | Seatable? |
|---|---|---|---|---|
| `UNKNOWN` | not yet called | as a silhouette | no | no |
| `CALLED` | announced, encounter owed | as "on their way" | **no** | no |
| `MET` | encounter cleared or purchased | yes, fully | **yes** | yes |
| `SEATED` | on the bench this round | yes, marked on duty | yes | is seated |

Stored as `P.friends[w] = { state, at, via }`. `grove` and `metGrove` both derive from it.
`via` records channel (`floor` / `courtship` / `keystone` / `bought`) for telemetry.

**Solves F2.** One question, one answer. The count and the book can never disagree again,
because they read the same field. A purchase writes `MET` directly, so it is finished at the
moment it is paid for.

### 3.3 The encounter, defined

An **encounter** is a short self-contained board that sits *between* rounds. It is not
numbered, does not advance the level counter, and cannot be failed into progression loss.

| Property | Value |
|---|---|
| Board | Small (5x5), pre-seeded so the ask is always achievable |
| Moves | Fixed per friend, generous |
| Ask | Exactly one, stated in plain language with a worked example |
| Score | None. No target, no stars, no purse |
| Fail | Not possible. Running out of moves re-deals |
| Reward | The friend, revealed, then `MET` |
| Skippable | Yes - "not now" defers to the next round boundary |

**Solves F1.** The door at adventure 20 stays the door. The chick gets its own stage after
it. Neither can eat the other because they are no longer in the same container.

### 3.4 Seats become the only clock

```
A friend is CALLED only when a seat exists for them, or opens next level.
Cap: count(MET) ≤ seats + 1
```

The `+1` is the bench: exactly one friend waiting for a chair, never four. `FLOOR_AT` stops
being a schedule and becomes an *eligibility floor* - the earliest a friend may be called, not
the level it must be.

**Solves F3.** Drought and bombardment are the same bug seen from two ends, and one clock
removes both. Nothing changes for the player except that arrivals now feel earned.

### 3.5 The keystone joins the queue

The door still grants the worm. It grants it *as a CALLED friend with a pending encounter*,
opening after the door's win card, instead of writing into the grove mid-`winLevel`.

**Solves F4.** One landing path for all three channels.

### 3.6 Every ask defines its own terms

An ask must name a concrete, countable thing and show one example. `noun1`/`nounN` already
exists for the singular/plural work; this extends the same data with `example` and `plain`.

- Not "the dove likes flourishes" → **"Make a word ending in -LY. Like QUICKLY. 2 to go."**
- Not "wakes on soft letters" → **"Use S, F or H in a word. 1 of 3."**

**Solves F5.** The rule: if a player cannot act on the sentence without a glossary, it is not
finished.

---

## 4. Every state transition, and what happens

### 4.1 Round ends in a WIN

| Condition | Today | Proposed |
|---|---|---|
| No friend pending | `P.level++`, next round | unchanged |
| Friend pending | Next round silently becomes a naming round, goal deleted | Win card → **encounter** → next round, goal intact |
| Door cleared, keystone due | Friend written straight to grove inside `winLevel` | Win card → door announcement → **encounter** → next country |
| Door cleared **and** a friend already queued | Two friends in one round, undefined | Strict queue: keystone encounter first, other friend next round boundary |

### 4.2 Round ends in a LOSS

| Condition | Today | Proposed |
|---|---|---|
| Ordinary round | Retry, nothing lost | unchanged |
| Friend pending | Naming target persists, round stays hijacked | Encounter is untouched and still owed. A lost round never costs a friend |
| Gate round | Push back up to 3 levels | unchanged, but **the pending friend is not pushed back with you** |
| Pushback drops you below a friend's floor | Undefined | A `CALLED` or `MET` friend is **never** revoked. Floors gate calling, not keeping |

### 4.3 Encounter states

| Event | Behaviour |
|---|---|
| Ask completed | Reveal, `MET`, seat if one is free, return to the map |
| Moves exhausted | Board re-deals with the same ask. No loss, no penalty |
| Player taps "not now" | Stays `CALLED`, re-offered at the next round boundary, announcement not repeated |
| Deferred 3 times | Ask is waived. The friend joins anyway - it liked you regardless |
| Purchased from the encounter | Immediately `MET`, encounter closes, no second contract |
| Two encounters owed | Strictly one per round boundary, oldest first |
| Seats all full when `MET` | Friend joins the bench. One notification, not a fanfare |

### 4.4 Pause, background, app close

This is where the current system is weakest, because `P.run` only understands levels.

| Moment | Today | Proposed |
|---|---|---|
| Mid-round | `saveRun()` snapshots the board, resumes correctly | unchanged |
| Mid-round, level already won | `P.run=null` - correct, prevents re-winning a cleared board | unchanged |
| **Mid-encounter** | Does not exist | `P.enc` snapshots the encounter board identically. Resume lands back in the encounter |
| Closed between win card and encounter | Friend can be lost or double-granted | The friend is `CALLED` and persisted **before** the encounter opens. Reopening re-offers it |
| Closed mid-reveal | Undefined - the 8/50 vs 7 ghost | State moves to `MET` in one write, before the animation. The animation is decoration, never the source of truth |
| Save fails | Silent until today | Reports, and the encounter stays owed |

**The governing rule for every close/resume case:** the friend's state is committed *before*
any ceremony that shows it. A ceremony interrupted must never be able to lose or duplicate a
friend.

### 4.5 Purchase

| Step | Today | Proposed |
|---|---|---|
| Pay | `grove[w]` set, `metGrove` not | `MET` in one write |
| Round contract | Still must satisfy `checkEnd` | Encounter closes immediately, round unaffected |
| Usable | Next round | Now |
| Refund if interrupted | None | Payment and state are one write. Either both or neither |

---

## 5. What existing saves do

Players (you) already hold split `grove`/`metGrove` state, including one ghost worm.

```
for each w in grove:      state = metGrove[w] ? MET : MET     // both become MET
for each w in summonQ:    state = CALLED
P.summon                  → front of the CALLED queue
```

Everything in `grove` is promoted to `MET`, including the worm. That resolves your 8/50
showing 7 on the first load, and nobody loses anything. Migration runs once, is logged, and
is idempotent.

---

## 6. What this does not fix

Being explicit, so nothing is assumed handled:

- **The level throwback.** Unknown cause, now instrumented. Separate work.
- **Which friends exist, their powers, their art.** Untouched.
- **Courtship ask difficulty tuning.** The vocabulary is fixed here; the balance is not.
- **The 15 biomes, obstacles, goals.** Untouched.
- **`backdrop-filter` cost on mid-range Android.** Still unprofiled.

---

## 7. Decisions I need from you

These are genuine forks where I should not pick for you.

**7.1 Does the encounter interrupt, or wait on the map?**
- **(a) Interrupts** - after the win card, the encounter opens straight away. Strongest moment, keeps the reward next to the achievement. *Recommended.*
- **(b) Waits** - the friend appears on the map with a badge and you tap in when you want. More respectful of a player mid-session, but rewards deferred are rewards forgotten.

**7.2 Can an encounter be failed at all?**
- **(a) Never** - re-deals forever. It is a gift with a ribbon on it. *Recommended*, because the friend is the retention mechanic and gating it behind skill is what created the "buy it and earn it anyway" bug.
- **(b) Soft fail** - three re-deals, then the ask is waived. Keeps a little tension.

**7.3 Does the bench cap (`MET ≤ seats + 1`) delay friends you have already earned through courtship?**
- **(a) Yes, strictly** - courtship earns you *priority in the queue*, not an extra chair. Clean, and it protects pacing. *Recommended.*
- **(b) No** - courtship always pays out immediately. Keeps the valve exciting but re-opens bombardment.

**7.4 Scope of the first build.**
- **(a) Whole spec at once** - biggest change, one migration, one round of testing.
- **(b) State machine first** (section 3.2 + 4.5 + 5), then encounters. The state machine alone fixes F2 and your purchase bug, and it is what everything else stands on. *Recommended.*
