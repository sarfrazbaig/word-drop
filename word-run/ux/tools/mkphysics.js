/* Builds the obstacle-physics design card. Uses the game's real tile CSS so the motion is
   proposed on top of the actual thing, not an approximation of it. */
const fs = require("fs");
const TS = require("./tilespec.js").extract(require("path").join(__dirname,"..","..","word-drop.template.html"), ".demo");
const OUT = require("path").join(__dirname,"..","..","ds/obstacle-physics.html");
const P = TS.palettes[1];   // the Bramblewood, where the screenshots live

const html = `<!-- @dsCard group="Screens" -->
<!doctype html><html><head><meta charset="utf-8">
<title>Obstacle physics</title>
<style>
  body{margin:0;padding:22px 14px 70px;background:#b9ac96;
    font-family:Nunito,"Segoe UI",system-ui,sans-serif;color:#3d3226}
  h1{font-family:Fraunces,Georgia,serif;font-size:22px;margin:0 0 4px;text-align:center}
  .top{text-align:center;font-size:11.5px;color:#5f5138;max-width:740px;margin:0 auto 18px;line-height:1.6}
  .panel{max-width:740px;margin:0 auto 18px;background:#f6efdd;border-radius:14px;padding:15px 17px 17px;
    box-shadow:0 6px 16px rgba(70,52,25,.24)}
  .panel h2{font-family:Fraunces,Georgia,serif;font-size:16px;margin:0 0 3px}
  .panel h3{font-family:Fraunces,Georgia,serif;font-size:13.5px;margin:14px 0 3px;color:#2f5330}
  .panel p{font-size:11.5px;color:#6b5a3d;margin:0 0 9px;line-height:1.58}
  .tag{font-size:8.5px;font-weight:900;letter-spacing:.9px;text-transform:uppercase;
    border-radius:5px;padding:2px 6px;vertical-align:2px;margin-left:6px}
  .t-rec{background:#4c7a46;color:#eefae9} .t-alt{background:#5b6f86;color:#eef4fa}
  .t-both{background:#8a6414;color:#fff6e0}
  .prob{max-width:740px;margin:0 auto 18px;background:rgba(200,85,47,.13);border:1px solid rgba(200,85,47,.32);
    border-radius:12px;padding:12px 15px;font-size:11.5px;line-height:1.6;color:#7a3418}
  .prob b{color:#5e2610}
  .rule{max-width:740px;margin:0 auto 18px;background:rgba(76,122,70,.14);border:1px solid rgba(76,122,70,.3);
    border-radius:12px;padding:12px 15px;font-size:11.5px;line-height:1.6;color:#2f5330}
  .rule b{color:#20401f}
  table{border-collapse:collapse;width:100%;font-size:11px;margin:6px 0}
  th{text-align:left;padding:5px 7px;background:#ece1c6;font-size:9px;letter-spacing:.06em;
    text-transform:uppercase;color:#6a5730}
  td{padding:5px 7px;border-top:1px solid #e6dcc2}
  td.n{font-weight:900;color:#8a6414;white-space:nowrap}

  /* ============ the game's own tile rules ============ */
  ${TS.css}
  .demo{ --tile-face:${P["--tile-face"]}; --tile-edge:${P["--tile-edge"]};
    --tile-ink:${P["--tile-ink"]}; --tile-grain:${P["--tile-grain"]}; }
  .demo .tw{ position:absolute !important; transition:transform .3s cubic-bezier(.3,1.2,.5,1) !important; }
  .demo .tile{ font-size:19px }
  .demo .tile small{ font-size:8px }

  /* a strip of board */
  .board{position:relative;width:100%;max-width:290px;height:108px;border-radius:11px;overflow:hidden;
    background:linear-gradient(180deg,#4a7a58,#2e5540);border:1px solid rgba(30,50,30,.5);flex:0 0 auto}
  .row{display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin:10px 0 2px}
  .beat{font-size:10px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:#8b7a5d;
    margin-top:6px;min-height:14px}
  .beat b{color:#2f5330}
  .side{flex:1 1 250px;min-width:230px;font-size:11.5px;line-height:1.55;color:#6b5a3d}
  .side b{color:#3d3226}
  .side ol{margin:4px 0 0;padding-left:18px} .side li{margin-bottom:3px}
  .now{display:inline-block;font-size:9px;font-weight:900;padding:1px 6px;border-radius:5px;
    background:#c8552f;color:#fff2e6;letter-spacing:.05em;text-transform:uppercase}

  /* ---- the telegraph parts, all overlaid on the board ---- */
  .fx{position:absolute;pointer-events:none;z-index:9}
  /* a vine reaching from one cell toward the next */
  .vine{transform-origin:left center;height:6px;border-radius:4px;
    background:linear-gradient(90deg,#3e5c30,#6f8a52);box-shadow:0 1px 0 rgba(0,0,0,.25);
    transform:scaleX(0);transition:transform .5s cubic-bezier(.4,1.3,.5,1)}
  .vine::after{content:"";position:absolute;right:-3px;top:-3px;width:11px;height:11px;border-radius:50%;
    background:radial-gradient(circle at 35% 35%,#8fae64,#4a6634)}
  .demo[data-stage="1"] .vine{transform:scaleX(.34)}
  .demo[data-stage="2"] .vine{transform:scaleX(.68)}
  .demo[data-stage="3"] .vine{transform:scaleX(1)}
  /* the tile being reached for */
  .doomed{transition:filter .4s, opacity .4s}
  .demo[data-stage="1"] .doomed{filter:saturate(.85)}
  .demo[data-stage="2"] .doomed{filter:saturate(.6) brightness(.92)}
  .demo[data-stage="3"] .doomed{filter:saturate(.2) brightness(.72)}
  /* motes for the spore */
  .mote{width:7px;height:7px;border-radius:50%;background:#c9a6d8;opacity:0;
    transition:transform .55s ease-out, opacity .4s}
  .demo[data-stage="1"] .mote{opacity:.9;transform:translate(6px,-8px)}
  .demo[data-stage="2"] .mote{opacity:.9;transform:translate(46px,-16px)}
  .demo[data-stage="3"] .mote{opacity:0;transform:translate(84px,-4px)}
  .dust{position:absolute;inset:0;border-radius:12px;background:radial-gradient(circle at 50% 40%,
    rgba(201,166,216,.75),rgba(201,166,216,0) 70%);opacity:0;transition:opacity .4s}
  .demo[data-stage="2"] .dust{opacity:.6}
  .demo[data-stage="3"] .dust{opacity:1}
  /* arrows for the current */
  .arrow{font-size:15px;color:#bfe6ff;opacity:0;transition:opacity .35s, transform .45s;
    text-shadow:0 1px 3px rgba(0,20,40,.6)}
  .demo[data-stage="1"] .arrow{opacity:.4}
  .demo[data-stage="2"] .arrow{opacity:.7;transform:translateX(5px)}
  .demo[data-stage="3"] .arrow{opacity:1;transform:translateX(11px)}
  .swell{position:absolute;height:100%;border-radius:8px;
    background:linear-gradient(90deg,rgba(150,220,255,0),rgba(150,220,255,.3));opacity:0;transition:opacity .4s}
  .demo[data-stage="1"] .swell{opacity:.35}
  .demo[data-stage="2"] .swell{opacity:.6}
  .demo[data-stage="3"] .swell{opacity:.95}
  /* streaks for the wind */
  .streak{height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.85));
    opacity:0;transition:opacity .35s, width .45s;width:12px}
  .demo[data-stage="1"] .streak{opacity:.5;width:22px}
  .demo[data-stage="2"] .streak{opacity:.75;width:38px}
  .demo[data-stage="3"] .streak{opacity:1;width:56px}
  .lift{transition:transform .4s}
  .demo[data-stage="2"] .lift{transform:translateY(-4px) rotate(-4deg)}
  .demo[data-stage="3"] .lift{transform:translateY(-13px) rotate(-9deg)}
  /* fibres knitting a root back together */
  .fibre{height:3px;border-radius:3px;background:#c2a06a;transform:scaleX(0);transform-origin:left center;
    transition:transform .45s}
  .demo[data-stage="1"] .fibre{transform:scaleX(.33)}
  .demo[data-stage="2"] .fibre{transform:scaleX(.66)}
  .demo[data-stage="3"] .fibre{transform:scaleX(1)}
  /* the reed's grip on the column above it */
  .grip{width:9px;border-radius:5px;background:linear-gradient(180deg,#8fa85c,#46592c);
    transform-origin:bottom center;transform:scaleY(.25);opacity:.55;transition:transform .5s, opacity .4s}
  .demo[data-stage="1"] .grip,.demo[data-stage="2"] .grip,.demo[data-stage="3"] .grip{transform:scaleY(1);opacity:.95}
  /* the mire's sticky strands holding a shelf up */
  .strand{width:4px;background:linear-gradient(180deg,rgba(120,80,40,.9),rgba(90,60,25,.35));
    border-radius:3px;transform-origin:top center;transform:scaleY(.2);opacity:.4;transition:transform .5s,opacity .4s}
  .demo[data-stage="1"] .strand,.demo[data-stage="2"] .strand,.demo[data-stage="3"] .strand{transform:scaleY(1);opacity:.95}
  /* fracture lines on scree */
  .frac{position:absolute;inset:0;opacity:0;transition:opacity .4s;
    background:linear-gradient(118deg,transparent 44%,rgba(20,20,20,.55) 46% 48%,transparent 50%),
               linear-gradient(64deg,transparent 52%,rgba(20,20,20,.4) 54% 56%,transparent 58%)}
  .demo[data-stage="1"] .frac{opacity:.5} .demo[data-stage="2"] .frac{opacity:.8}
  .demo[data-stage="3"] .frac{opacity:1}
</style></head><body>

<h1>Obstacle physics: telling the player what is about to happen</h1>
<p class="top">Six obstacles act on their own, on a fixed beat, and not one of them gives any warning at all.
   Everything below loops. Watch the drop counter.</p>

<div class="prob">
  <b>What the code actually does today.</b> On the third drop, a bramble picks a random adjacent letter and
  converts it in a single frame - the target is chosen at the instant of conversion, so there was never
  anything to read even if you had been watching. Pest, spore, current and wind work the same way. A cut root
  heals silently three drops later. The only feedback any of them give is a 260ms shake <i>after</i> the fact.
  <table>
    <tr><th>Obstacle</th><th>Acts</th><th>What it does</th><th>Warning</th></tr>
    <tr><td>bramble</td><td class="n">every 3rd drop</td><td>converts a random adjacent letter</td><td>none</td></tr>
    <tr><td>spore</td><td class="n">every 3rd drop</td><td>converts a random letter anywhere</td><td>none</td></tr>
    <tr><td>pest</td><td class="n">every 3rd drop</td><td>swaps seats with a random neighbour</td><td>none</td></tr>
    <tr><td>current</td><td class="n">every 4th drop</td><td>shoves a whole row sideways</td><td>none</td></tr>
    <tr><td>wind</td><td class="n">every 4th drop</td><td>lifts the top off the tallest pile</td><td>none</td></tr>
    <tr><td>root</td><td class="n">3 drops after cutting</td><td>heals completely</td><td>none</td></tr>
  </table>
</div>

<div class="rule">
  <b>The rule this is all built on.</b> A threat has to answer three questions before it lands, or it is not a
  threat, it is a dice roll: <b>is something coming</b>, <b>what will it do</b>, and <b>to whom</b>. The third is
  the one the current code cannot answer at all, because nothing is chosen until the moment it happens. So the
  change is not only visual: <b>the target has to be picked early and then kept</b>. That is what makes the
  warning worth reading, and it is what turns each of these from a punishment into a problem you can play
  against - clear the bramble, or spend the doomed letter in a word before it is taken.
</div>

<div id="opts"></div>
<div id="demos"></div>

<div class="panel" style="background:rgba(255,253,246,.6)">
  <h2>What I would do</h2>
  <p><b>A, and it is not close.</b> Every one of these obstacles already has a physical idea behind it - the
     tangle reaches, the spore drifts, the river pushes, the ridge lifts, the root knits itself shut. None of
     that is on screen. Option A is mostly just drawing what the rules already say, which is why it needs no new
     vocabulary and cannot be mistaken for UI. B is more legible and much cheaper, and if the schedule is tight
     it is a real answer, but it puts a row of counters on a painted board and it teaches the player to read
     pips instead of reading the wood.</p>
  <p><b>One thing to decide either way:</b> how much warning. Three drops of vine on a three-drop cycle means
     the threat is visible from the moment it resets, which is the most generous reading and the easiest to
     learn. Starting at drop two would keep more tension. My instinct is generosity first - this is a cosy
     game, and the complaint was not that it is too easy.</p>
</div>

<script>
const OPTS = [
 ["A","Each obstacle telegraphs in its own idiom",
  "The bramble grows a vine toward the letter it has chosen, and that vine gets longer on every drop until it closes over the letter. The spore puffs motes that drift and settle on their target before it turns. The river builds a swell and shows which way it will push. The ridge gathers streaks around the tile it is going to take. The root visibly knits its wound shut, one fibre at a time. Nothing new is added to the screen: every obstacle simply does on screen what its own rule already claims it does.",
  "t-rec","Recommended"],
 ["B","One shared charge mark on every active obstacle",
  "Every obstacle that acts carries the same small indicator - three pips that fill, plus a chevron pointing at whatever it has targeted. Learn it once and it reads on all six. It is far less work than A, it is unambiguous, and it scales to anything added later. The cost is that it is furniture: six tiles gain a piece of UI on a board that is meant to look painted, and a pip is a thing you read rather than a thing you see.",
  "t-alt","Cheapest and clearest"],
 ["C","Both: the obstacle acts, and the target is marked",
  "A for the obstacle plus a light mark on the doomed tile, so the answer to who is never ambiguous even in a crowded board. Belt and braces. Worth it if playtesting shows people can see something coming but not what it is coming for.",
  "t-both","If A tests unclear"],
];
document.getElementById("opts").innerHTML =
  '<div class="panel"><h2>How the warning should be expressed</h2>'
  + OPTS.map(([k,t,d,cls,tag]) =>
      '<h3>' + k + ' &middot; ' + t + '<span class="tag ' + cls + '">' + tag + '</span></h3><p>' + d + '</p>').join("")
  + '</div>';

/* ---------- demos ---------- */
const CELL = 40, GAP = 4, STEP = CELL + GAP;
const at = (r,c) => 'style="left:' + (8 + c*STEP) + 'px;top:' + (8 + r*STEP) + 'px;width:' + CELL + 'px;height:' + CELL + 'px"';
const tl = (r,c,kind,letter,extra) =>
  '<div class="tw" ' + at(r,c) + '><div class="tile ' + (kind||'') + ' ' + (extra||'') + '">'
  + (letter ? letter + '<small>1</small>' : '') + '</div></div>';

const DEMOS = [
 { key:"bramble", title:"Bramble &middot; the tangle reaches",
   beats:["a vine appears, pointing at the letter it has chosen","the vine reaches halfway across it",
          "the vine closes over the letter - it is a tangle now"],
   cycle:3,
   how:["A vine appears on the drop after it last acted, aimed at one specific letter. That letter is now chosen and will not change.",
        "It lengthens on each drop.","On the third it closes over the face and the tile converts.",
        "You have two drops to answer it: clear the bramble, or use that letter in a word and it leaves with the word."],
   board:
     tl(1,0,"bramble") +
     tl(1,1,"","E","doomed") +
     tl(1,2,"","T") + tl(1,3,"","H") +
     tl(0,2,"","A") +
     '<div class="fx vine" style="left:' + (8+CELL) + 'px;top:' + (8+1*STEP+CELL/2-3) + 'px;width:' + (STEP) + 'px"></div>'
 },
 { key:"spore", title:"Spore &middot; it drifts, it does not creep",
   beats:["the cap swells and motes lift off","the motes settle on a letter across the board",
          "the dusted letter turns"],
   cycle:3,
   how:["A spore does not spread to a neighbour, it lands anywhere - so a vine would be a lie.",
        "Instead it releases motes that visibly travel to the tile they will land on.",
        "The target wears a faint dusting for a drop before it converts, which is the tell.",
        "Same escape: spend the dusted letter, or clear the spore."],
   board:
     tl(1,0,"spore") +
     tl(1,1,"","N") + tl(1,2,"","O") +
     tl(1,3,"","W","doomed") +
     '<div class="tw" style="left:' + (8+3*STEP) + 'px;top:' + (8+STEP) + 'px;width:' + CELL + 'px;height:' + CELL + 'px;z-index:8"><div class="dust"></div></div>' +
     '<div class="fx mote" style="left:' + (8+CELL-4) + 'px;top:' + (8+STEP+8) + 'px"></div>' +
     '<div class="fx mote" style="left:' + (8+CELL-9) + 'px;top:' + (8+STEP+20) + 'px;transition-delay:.08s"></div>'
 },
 { key:"pest", title:"Pest &middot; it eyes a letter, then takes its seat",
   beats:["it turns to face the letter it wants","both tiles lean toward the swap","they trade places"],
   cycle:3,
   how:["The pest picks its neighbour early and turns to look at it.",
        "Both tiles tilt toward each other, so the swap is legible as a swap rather than a glitch.",
        "On the third drop they exchange seats.",
        "This one matters most inside a word you are building: right now a pest can walk into the middle of a held word with no warning at all."],
   board:
     tl(1,1,"pest") +
     tl(1,2,"","S","doomed lift") +
     tl(1,0,"","C") + tl(1,3,"","T") +
     '<div class="fx arrow" style="left:' + (8+STEP+CELL-6) + 'px;top:' + (8+STEP+9) + 'px">&#8646;</div>'
 },
 { key:"current", title:"Current &middot; the river builds, then pushes",
   beats:["a swell gathers along one row, arrows show the direction","the swell brightens and the arrows drift",
          "the whole row shoves sideways"],
   cycle:4,
   how:["Today a random eligible row moves with no notice, and everything you planned is wrong.",
        "The row that will move is lit from the first drop, and the arrows say which way.",
        "Four drops of build-up, then the push - so a player can plan around the beat instead of being surprised by it.",
        "The swell is the important part: it marks the ROW, which is the thing you cannot currently know."],
   board:
     tl(2,0,"current") +
     tl(2,1,"","R") + tl(2,2,"","A") + tl(2,3,"","I") + tl(2,4,"","N") +
     '<div class="fx swell" style="left:6px;top:' + (8+2*STEP-2) + 'px;width:' + (5*STEP) + 'px;height:' + (CELL+4) + 'px"></div>' +
     '<div class="fx arrow" style="left:' + (8+5*STEP-6) + 'px;top:' + (8+2*STEP+9) + 'px">&#8594;</div>'
 },
 { key:"wind", title:"Wind &middot; the ridge gathers, then lifts",
   beats:["streaks gather around the tile it wants","the tile starts to lift and tilt","it is carried off"],
   cycle:4,
   how:["The ridge takes the top letter off your tallest pile. Which tile that is, is knowable - so show it.",
        "Streaks build across it and it begins to rock, then tilt, then leave.",
        "Because the target is the top of the tallest pile, a player can also change it by playing elsewhere, which turns the whole thing into a decision."],
   board:
     tl(0,3,"wind") +
     tl(1,1,"","T","lift doomed") +
     tl(2,1,"","O") + tl(2,2,"","P") + tl(2,0,"","S") +
     '<div class="fx streak" style="left:' + (8+STEP+CELL+2) + 'px;top:' + (8+STEP+10) + 'px"></div>' +
     '<div class="fx streak" style="left:' + (8+STEP+CELL+2) + 'px;top:' + (8+STEP+20) + 'px;transition-delay:.07s"></div>'
 },
 { key:"root", title:"Root &middot; the wound knits itself shut",
   beats:["one fibre crosses the cut","two thirds closed","whole again, and you have to start over"],
   cycle:3,
   how:["Cut a root once and it heals three drops later. At the moment it simply pops back with a shake, and a player who did not count has no idea why their work was undone.",
        "The wound knits visibly, a third at a time, so the clock is on the tile itself.",
        "This is the clearest case in the whole set: the mechanic is already a countdown, it just has no face."],
   board:
     tl(1,1,"root","","cracked") +
     tl(1,0,"","D") + tl(1,2,"","E") + tl(1,3,"","N") +
     '<div class="fx fibre" style="left:' + (8+STEP+7) + 'px;top:' + (8+STEP+13) + 'px;width:' + (CELL-14) + 'px"></div>' +
     '<div class="fx fibre" style="left:' + (8+STEP+7) + 'px;top:' + (8+STEP+22) + 'px;width:' + (CELL-14) + 'px;transition-delay:.1s"></div>'
 },
 { key:"reed", title:"Reed &middot; it holds the column shut",
   beats:["the grip is always there - this is not a timer","","the column is held, and nothing drops past"],
   cycle:3, static:true,
   how:["This is your second example, and it is a different problem: not a warning, but a rule with no picture.",
        "A reed blocks a whole column and nothing drops past it. Players read that as the game refusing them rather than as a thing in the way.",
        "So the reed grows stalks up the column and visibly grips the tiles above it. The column looks held, so a bounced drop makes sense before you read any message.",
        "No stages needed. It is permanent until the reed is cleared from the side."],
   board:
     tl(3,2,"reed") +
     tl(2,2,"","G") + tl(1,2,"","R") +
     tl(3,0,"","A") + tl(3,1,"","B") + tl(3,3,"","E") +
     '<div class="fx grip" style="left:' + (8+2*STEP+7) + 'px;top:' + (8+STEP+6) + 'px;height:' + (2*STEP-6) + 'px"></div>' +
     '<div class="fx grip" style="left:' + (8+2*STEP+CELL-16) + 'px;top:' + (8+STEP+6) + 'px;height:' + (2*STEP-6) + 'px;transition-delay:.08s"></div>'
 },
 { key:"mire", title:"Mire &middot; it holds a shelf in the air",
   beats:["strands show what is resting on it","","the shelf hangs, and that is why nothing falls"],
   cycle:3, static:true,
   how:["Mire does not fall. Everything else settles around it and it hangs where it is, holding whatever is on top of it in mid-air.",
        "That is one of the strangest things on the board and there is currently nothing to explain it.",
        "Sticky strands run from the mire to the tiles it is holding, so a floating shelf reads as held rather than broken."],
   board:
     tl(2,1,"mire") +
     tl(1,1,"","L") + tl(1,2,"","O") +
     tl(3,0,"","F") + tl(3,3,"","T") +
     '<div class="fx strand" style="left:' + (8+STEP+10) + 'px;top:' + (8+STEP+CELL-4) + 'px;height:12px"></div>' +
     '<div class="fx strand" style="left:' + (8+STEP+26) + 'px;top:' + (8+STEP+CELL-4) + 'px;height:12px;transition-delay:.09s"></div>'
 },
 { key:"scree", title:"Scree &middot; it is already broken",
   beats:["the fracture lines are visible before you hit it","","so the split is expected, not a betrayal"],
   cycle:3, static:true,
   how:["Clear scree and it breaks into more scree, once. Doing that unannounced feels like the game cheating.",
        "Fracture lines drawn on it from the start say it is going to split. Then the split is the tile keeping its promise.",
        "Same idea applies to everything that needs two clears - stone, crystal, shroud, frost. The halfway state should be a chip out of the silhouette, not a filter over it."],
   board:
     tl(2,2,"scree") +
     tl(2,1,"","S") + tl(2,3,"","T") + tl(1,2,"","O") +
     '<div class="tw" style="left:' + (8+2*STEP) + 'px;top:' + (8+2*STEP) + 'px;width:' + CELL + 'px;height:' + CELL + 'px;z-index:10"><div class="frac"></div></div>'
 },
];

document.getElementById("demos").innerHTML = DEMOS.map(d => {
  const cyc = d.cycle;
  return '<div class="panel"><h2>' + d.title + '</h2>'
    + '<div class="row">'
    + '<div><div class="demo board" data-key="' + d.key + '" data-stage="0" data-cycle="' + cyc + '">' + d.board + '</div>'
    + '<div class="beat" id="beat-' + d.key + '"></div></div>'
    + '<div class="side">' + (d.static ? '' : '<span class="now">acts every ' + cyc + ' drops</span><br>')
    + '<ol>' + d.how.map(x => '<li>' + x + '</li>').join("") + '</ol></div>'
    + '</div></div>';
}).join("");

/* one clock for every demo, so they read as the same system */
const els = DEMOS.map(d => ({ d, el: document.querySelector('.demo[data-key="' + d.key + '"]'),
  beat: document.getElementById("beat-" + d.key) }));
let n = 0;
function tick(){
  n++;
  els.forEach(({d, el, beat}) => {
    /* the static three are not on a timer - they are a permanent state, so they must never
       fall back to the empty stage or they read as though they were charging up */
    if (d.static){ el.setAttribute("data-stage", "3");
      beat.innerHTML = "<b>always</b> &middot; " + d.beats[2]; return; }
    const stage = ((n - 1) % (d.cycle + 1));
    const shown = Math.min(stage, 3);
    el.setAttribute("data-stage", String(shown));
    beat.innerHTML = shown === 0 ? "<b>it just acted</b> &middot; the next target is chosen"
      : "<b>drop " + shown + " of " + d.cycle + "</b> &middot; " + (d.beats[shown-1] || d.beats[d.beats.length-1]);
  });
}
tick(); setInterval(tick, 1100);
</script>
</body></html>
`;

fs.writeFileSync(OUT, html);
const dashes = (html.match(/\u2014/g) || []).length;
console.log("wrote " + OUT + "  " + Math.round(html.length/1024) + " KB  em-dashes:" + dashes);
