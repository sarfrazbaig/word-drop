# src/ - where everything lives

The game ships as one HTML file, but it is no longer written as one. `build.js` stitches
these together in **filename order** and injects them into `word-drop.template.html`, which
is now just the markup shell.

**The numeric prefix is the load order, and it matters.** These were cut from a single file
and still share its globals - a top-level `const` read by a later module is a temporal dead
zone error if the order changes, and that means a blank page, not a warning.

| file | lines | what is decided here |
|---|---|---|
| `00-boot.js` | 32 | the very first lines: `$`, viewport, service worker |
| `05-dictionary.js` | 11 | `COMMON` - the word list, injected at build time |
| `10-world.js` | 636 | board size, biomes, `TROUBLE` habitats, obstacle debuts, level curve |
| `15-sound.js` | 142 | every tone the wood makes |
| `20-signs.js` | 121 | `SIGNS` - everything a friend can listen for, and the action phrase for each |
| `25-grove-homes.js` | 54 | `HOME` - which country each friend lives in. The pacing mechanism |
| `30-grove-roster.js` | 620 | the fifty friends as data, `CALLINGS`, `KEYSTONE`, `GATE`, `GOALS` |
| `35-save.js` | 767 | `P`, localStorage, migrations, the save/load repair paths |
| `40-round.js` | 603 | `S` - everything true only while a round is being played |
| `45-tiles.js` | 65 | making, moving and destroying tile elements |
| `50-words.js` | 270 | reading rows and columns, deciding what is a word. Pure - test it first |
| `55-powers.js` | 551 | `POWERS` - one handler per friend's ability |
| `60-game-flow.js` | 657 | `Game` begins. play, startLevel, beginLevel, meetings, navigation |
| `61-game-turn.js` | 500 | drop, checkEnd, winLevel, failLevel, grace and purchases |
| `62-game-tools.js` | 346 | breeze, wish, pluck, the reveal ceremony |
| `63-game-friends.js` | 761 | callings, courtship, waking, seats, pet acting and aiming |
| `64-game-board.js` | 952 | recordWord, resolve, cascades, obstacles, gravity |
| `65-ui-screens.js` | 578 | `UI` begins. scenes, HUD, the goal strip, the dock |
| `66-ui-book.js` | 548 | the Book of Names, the meet ritual, stats, the charm |
| `67-ui-effects.js` | 383 | shards, toasts, Alder's surfaces, pet visits |
| `68-ui-toolbox.js` | 296 | the keeper's toolbox - dev only |
| `70-input.js` | 587 | pointer handling, fitting the stage to the phone, telemetry |
| `75-audit.js` | 326 | does the DATA agree with itself |
| `80-selftest.js` | 268 | does the GAME still do what it was fixed to do |
| `style.css` | 3192 | all of it |

`Game` and `UI` are each one object spread over several files: the first declares it, the
rest `Object.assign` onto it. Split at property boundaries only - a cut inside a data object
or a comment produces a file that cannot parse, which the build will refuse.

## Before you trust a change

```
node build.js          # refuses if it will not parse, if a placeholder is unresolved,
                       # or if a module has gone missing
```

then in the browser console, or the 🧪 button in the toolbox:

```
Selftest.run()         # 19 checks, each one a bug that was reported and closed
Audit.run()            # do the tables still agree with each other
```

Every check in `80-selftest.js` exercises the real code path. Two of them originally
re-implemented the logic inline and asserted against their own copy - they passed with the
fix reverted, which is worse than no check at all. If you add one, make it call the game.

## Two things that have bitten hard

**A single stray token blanks the whole game.** It is one inline script, so an edit that
lands between an `if` and its `else` does not break a feature - it breaks everything, with
no error a player would ever report. The build's parse gate exists for exactly this.

**Two tables describing one rule will drift.** Ice was asked for 247 levels before ice could
exist, because the obstacle schedule and the goal schedule were written separately and
nothing compared them. Arrivals and seats had the same disease. When you add a rule, ask
where else it is already written down - and if it is written twice, make one of them derive
from the other, or add a check to `75-audit.js` that they still agree.
