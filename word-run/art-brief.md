# Hushwood — Creature Art Brief (50 animals)

## The game in one line
A cozy word-puzzle "storybook of true names": players spell animal names to wake 50 creatures
in a twilight wood. Collecting and adoring the creatures IS the game — **cuteness is the product**.

## Style direction
- **Cozy dusk storybook**: warm, soft, rounded. The game world is permanent twilight
  (violet/indigo skies, warm amber light, cream and wood tones).
- **Cute above all** (baby-schema): big heads, big low-set eyes, blush, tiny mouths, stubby
  bodies, zero sharp angles. References the team responds to: Sanrio softness, Tsum Tsum
  proportions, Neko Atsume charm.
- Flat with soft shading is fine; painterly is fine — must stay readable at tiny sizes.

## Hard technical requirements
1. **Format**: SVG strongly preferred (crisp at every scale, small files). Otherwise
   transparent PNG at 512×512, consistent framing (creature centered, ~10% padding).
2. **One canvas, many sizes**: the SAME artwork is used at 96px (meeting card), 74px
   (profile sheet), ~40px (board visits), ~30px (party shelf), ~26px (album grid).
   **Every creature must stay readable at 30px.**
3. **Silhouette is a gameplay mechanic**: a "who's that?" reveal shows the creature as a
   dark silhouette first. Each creature's OUTLINE must be distinct and guessable —
   ears, tails, horns, wings readable in pure shadow. Please check every design as a
   black shape before finalizing.
4. Consistent light direction and line weight across all 50; consistent eye style.
5. Deliver on transparent background; no baked-in drop shadows (the game adds its own).

## Poses/states needed
- **v1 (launch): one hero pose per creature** — front-facing or 3/4, friendly.
  The game animates via CSS (hops, jiggles, walk-ons), so one pose carries everything.
- v2 (nice-to-have later): a "happy" variant (eyes closed / bounce) per creature.

## The 50 creatures
Grouped as the game groups them ("In the Sky" / "On the Ground"). The power name is
flavor context only — it can inspire small character details (a sly fox, a sleepy owl).

### In the Sky (16)
| # | Creature | Current emoji | Power (flavor) |
|---|----------|---------------|----------------|
| 1 | Bee | 🐝 | Busy Buzz — always working |
| 2 | Moth | 🦋 | Dream Dust — chases moonbeams |
| 3 | Owl | 🦉 | Far Sight — sees ahead |
| 4 | Crow | 🐦‍⬛ | Clever Beak — smart, tidy |
| 5 | Dove | 🕊️ | Sweet Song |
| 6 | Robin | 🐦 | Morning Chorus |
| 7 | Duck | 🦆 | Second Wind |
| 8 | Swan | 🦢 | Swan's Grace |
| 9 | Goose | 🪿 | Golden Egg |
| 10 | Hawk | 🦅 | Keen Eye |
| 11 | Bat | 🦇 | Echo Flip — loves echoes, upside-down energy |
| 12 | Heron | 🦩 | Patient Hunt |
| 13 | Beetle | 🪲 | Boulder Buster — tiny but mighty |
| 14 | Fly | 🪰 | Little Nibble |
| 15 | Ladybug | 🐞 | Lucky Spots |
| 16 | Cricket | 🦗 | Night Chorus — fiddler of the dusk |

### On the Ground (34)
| # | Creature | Current emoji | Power (flavor) |
|---|----------|---------------|----------------|
| 17 | Cat | 🐱 | Golden Paw — THE mascot; first friend every player meets |
| 18 | Dog | 🐶 | Fetch a Word — second friend, eager |
| 19 | Fox | 🦊 | Gilded Trail |
| 20 | Frog | 🐸 | Leapfrog — pond resident |
| 21 | Deer | 🦌 | Gentle Graze |
| 22 | Bear | 🐻 | Bear Hug |
| 23 | Wolf | 🐺 | Night Howl |
| 24 | Hare | 🐇 | Quickstep |
| 25 | Mouse | 🐭 | Crumb Collector |
| 26 | Pig | 🐷 | Truffle Dig |
| 27 | Snail | 🐌 | Slow & Sure |
| 28 | Worm | 🪱 | Aerate — garden helper |
| 29 | Ant | 🐜 | Tiny Planner |
| 30 | Crab | 🦀 | Sidestep |
| 31 | Fish | 🐟 | Shimmer School — pond resident |
| 32 | Snake | 🐍 | Shed Skin — keep it friendly, not menacing |
| 33 | Chick | 🐤 | Copycat Peep — the FINAL legendary; extra-special cute |
| 34 | Goat | 🐐 | Kindred Call |
| 35 | Otter | 🦦 | Warm Current — pond resident |
| 36 | Boar | 🐗 | Bulldoze |
| 37 | Moose | 🫎 | Antler Sweep — big antler silhouette |
| 38 | Seal | 🦭 | Playful Splash |
| 39 | Turtle | 🐢 | Shell Shield |
| 40 | Beaver | 🦫 | Dam Builder |
| 41 | Badger | 🦡 | Digger |
| 42 | Lizard | 🦎 | Sunbake |
| 43 | Pony | 🐴 | Gallop |
| 44 | Lamb | 🐑 | Soft Wool |
| 45 | Bunny | 🐰 | Daily Whisper |
| 46 | Skunk | 🦨 | Clear the Room — lovable, not gross |
| 47 | Raccoon | 🦝 | Rummage |
| 48 | Squirrel | 🐿️ | Acorn Stash |
| 49 | Spider | 🕷️ | Web Wrap — friendly weaver, not creepy |
| 50 | Bison | 🦬 | Stampede |

## Priority order for delivery
1. **Batch 1 (the FTUE ten — every new player sees these):** cat, dog, owl, bee, fox, bat,
   pig, moth, bunny, deer.
2. Batch 2: the remaining Tier-1/2 creatures (hare, crow, dove, frog, worm, duck, mouse,
   swan, wolf, fish, lamb, crab).
3. Batch 3–5: the rest; **chick last and most lovingly** (it's the game's final legendary).
