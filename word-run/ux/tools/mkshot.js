/* Builds a throwaway copy of the game that can drive itself into a named state,
   so Chrome headless can photograph each screen. Deleted straight after. */
const fs = require("fs");
const SRC = require("path").join(__dirname,"..","..","word-drop.html");
const OUT = require("path").join(__dirname,"..","..","_shot.html");
let s = fs.readFileSync(SRC, "utf8");

/* ---- seed the save BEFORE the game boots ---- */
const seed = `<script>
(function(){
  try{
    var q=new URLSearchParams(location.search);
    if(q.get("fresh")){ localStorage.removeItem("worddrop_v3"); return; }
    var p=JSON.parse(localStorage.getItem("worddrop_v3")||"{}");
    p.level = +(q.get("L")||p.level||30);
    p.tut=1; p.gradued=1; p.coach=true;
    p.amber=500;
    p.pow=Object.assign({},p.pow,{swap:3,wild:3});
    p.grove=p.grove||{}; p.metGrove=p.metGrove||{};
    if(q.get("pets")){
      var have=(q.get("pets")||"").split(",").filter(Boolean);
      have.forEach(function(w){ p.grove[w]=1; p.metGrove[w]=1; });
      p.equip=have.slice(0,4);
    }
    localStorage.setItem("worddrop_v3", JSON.stringify(p));
  }catch(e){}
})();
</script>`;
/* the built file has no html/head/body tags at all - meta, style, markup, then one
   <script>. So the seed goes immediately before that script, and the driver after it. */
if(!s.includes("<script>")) throw new Error("no <script> anchor found");
s = s.replace("<script>", seed + "\n<script>");

/* ---- and drive it once it has booted ---- */
const driver = `<script>
(function(){
  var q=new URLSearchParams(location.search), st=q.get("s")||"home";
  var sleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
  function $id(i){ return document.getElementById(i); }
  async function boot(){ for(var i=0;i<300;i++){ if(window.Game&&window.UI&&window.P&&$id("btn-play")) return true; await sleep(50); } return false; }
  /* every first-time card the wood shows, waved through - a documentation shot wants the
     screen underneath, and these each appear once per save */
  var KEEP={};   // states that WANT a card left up
  async function clearCards(){
    var ids=["ov-tut","ov-meet","ov-unlock","ov-pet","ov-finale"];
    for(var pass=0;pass<6;pass++){
      var any=false;
      for(var i=0;i<ids.length;i++){ if(KEEP[ids[i]]) continue;
        var o=$id(ids[i]);
        if(o&&o.classList.contains("active")){
          var b=o.querySelector("button,.btn,[onclick]");
          (b||o).click(); any=true; await sleep(320); } }
      var t=$id("note"); if(t&&t.classList.contains("on")&&!KEEP.note){ t.click(); any=true; await sleep(280); }
      if(!any) return; }
  }
  async function calm(n){ n=n||60; for(var i=0;i<n;i++){ var t=$id("note");
      if(t&&t.classList.contains("on")&&!KEEP.note) t.click();
      if(window.S && !S.busy && !S.petActing) return; await sleep(80); } }
  /* Chrome's virtual clock fast-forwards timers, so polling for the intro card races the
     game's own async work. Call the function its tap calls - ov-intro is onclick=beginLevel. */
  async function toBoard(){
    Game.play();
    /* play() shows the intro card somewhere down an async chain, and on the virtual clock
       there is no reliable moment to catch it - so keep answering it until it stays down. */
    var seen=false, quiet=0;
    for(var i=0;i<110;i++){
      var iv=$id("ov-intro");
      if(iv && iv.classList.contains("active")){ seen=true; quiet=0; try{ Game.beginLevel(); }catch(e){} }
      else if(seen && window.S && !S.busy && ++quiet>6) break;   // only leave once it HAS shown and gone
      await sleep(110);
    }
    await clearCards(); await calm(); await clearCards();
    await sleep(400);
  }
  function boardXY(colF,rowF){ var b=document.getElementById("board").getBoundingClientRect();
    return [b.left+colF*b.width/7, b.top+rowF*b.height/8]; }
  function fire(el,type,x,y,id){ el.dispatchEvent(new PointerEvent(type,{clientX:x,clientY:y,
    pointerType:"touch",isPrimary:true,pointerId:id,bubbles:true,cancelable:true,buttons:type==="pointerup"?0:1})); }

  (async function(){
    if(!(await boot())) return;
    await sleep(500);
    try{
      if(st==="home"){ /* as it boots */ }

      else if(st==="menu"){ $id("home-menu-btn").click(); await sleep(600); }

      else if(st==="intro"){ Game.play(); await sleep(1500); }

      else if(st==="board"){ await toBoard(); }

      else if(st==="hold"){ await toBoard();
        var p=boardXY(3.5,4.2), t=document.elementFromPoint(p[0],p[1]);
        fire(t,"pointerdown",p[0],p[1],901); await sleep(60);
        for(var i=1;i<=4;i++) fire(document.getElementById("board"),"pointermove",p[0]+i*7,p[1]-i*4,901);
        await sleep(400); }

      /* the wood's own lookahead tells us which column completes a word, so the pause
         bubble is guaranteed rather than hoped for */
      else if(st==="grace"){ await toBoard(); KEEP.note=1;
        for(var k=0;k<30;k++){
          await calm();
          if(document.querySelector(".gracebubble")) break;
          if(S.over||S.won) break;
          var pick=-1;
          for(var c=0;c<7;c++) if(wouldClear(S.cur,c)){ pick=c; break; }
          if(pick<0){ for(var c2=0;c2<7;c2++) if(!S.board[0][c2]){ pick=c2; break; } }
          if(pick<0) break;
          Game.drop(pick);
          for(var w=0;w<14;w++){ if(document.querySelector(".gracebubble")) break; await sleep(70); }
        }
        await sleep(300); }

      else if(st==="breeze"){ await toBoard(); await calm();
        Game.armBreeze(); await sleep(700); }

      else if(st==="wish"){ await toBoard(); await calm();
        Game.openWish(); await sleep(700); }

      else if(st==="fail"){ await toBoard(); await calm();
        S.movesLeft=1;
        for(var f=0;f<8 && !S.over;f++){ await calm(); Game.drop(f%7); await sleep(500); }
        await sleep(1400); }

      else if(st==="album"){ UI.groveShow(); await sleep(1100); }

      else if(st==="petsheet"){ UI.groveShow(); await sleep(700);
        var w=(q.get("pets")||"cat").split(",")[0]; UI.petSheet(w); await sleep(800); }

      else if(st==="note"){ await toBoard(); await calm(); KEEP.note=1;
        UI.note("shot-note","a friend is <b>stirring</b> nearby<br><small>keep spelling and they will wake</small>","always");
        await sleep(900); }

      else if(st==="fullparty"){ KEEP["ov-tut"]=1; KEEP["ov-unlock"]=1;
        $id("btn-play").click(); await sleep(700);
        var iv2=$id("ov-intro"); if(iv2&&iv2.classList.contains("active")) iv2.click();
        await sleep(1600); }

      else if(st==="obstacles"){ await toBoard(); await sleep(600); }

      else if(st==="shop"){ Shop.open ? Shop.open() : $id("ov-shop").classList.add("active"); await sleep(900); }
    }catch(e){ document.title="SHOT-ERR "+e.message; }
    window.__SHOT_READY=true;
    document.title = "ready:"+st;
  })();
})();
</script>`;
s = s + "\n" + driver + "\n";

fs.writeFileSync(OUT, s);
const ok = s.includes("__SHOT_READY") && s.indexOf("worddrop_v3") < s.indexOf("<script>\nconst") ;
console.log("wrote _shot.html (" + Math.round(s.length/1024) + " KB)  driver:"
  + (s.includes("__SHOT_READY")?"in":"MISSING")
  + "  seed:" + (s.includes("q.get(\"fresh\")")?"in":"MISSING"));
