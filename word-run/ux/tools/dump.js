/* Reads the game's own tables out of a running copy, so the handbook is generated from
   the source of truth rather than transcribed by hand. */
const fs = require("fs"), { spawn } = require("child_process");
const OUT = require("path").join(__dirname,"..",".work");
const PORT = 9351, sleep = ms => new Promise(r => setTimeout(r, ms));

const EXPR = `(function(){
  var strip=function(s){ return String(s==null?"":s).replace(/<br\\s*\\/?>/gi," / ").replace(/<[^>]+>/g,"").replace(/\\s+/g," ").trim(); };
  var walk=function(v){ if(v==null) return null;
    if(typeof v==="string") return strip(v);
    if(Array.isArray(v)) return v.map(walk);
    if(typeof v==="object") { var o={}; for(var k in v) o[k]=walk(v[k]); return o; }
    return v; };
  var pets = GROVE.map(function(g){
    var c = CALLINGS[g.w];
    return { w:g.w, emoji:g.e, zone:g.z, passive:!!g.ps,
      wakeOn: g.wake? g.wake.on : null, wakeN: g.wake? g.wake.n : null,
      power:g.pn, powerIcon:g.pi, does:strip(g.pd), fx:g.fx&&g.fx.t, flavour:strip(g.f),
      minL: CALL_MINL[g.w]||null,
      keystoneAt: (function(){ for(var k in KEYSTONE) if(KEYSTONE[k]===g.w) return +k; return null; })(),
      callTask: c? c.t : null, callN: c? c.n : null, calling: c? strip(c.c) : null };
  });
  return {
    consts:{COLS:COLS,ROWS:ROWS,CELL:CELL,GAP:GAP,STEP:STEP,PROLOGUE_END:PROLOGUE_END,BIOME_LEN:BIOME_LEN,
            RING_LEN:(typeof RING_LEN!=="undefined"?RING_LEN:null), TOTAL:GROVE.length},
    VAL:VAL,
    biomes: BIOME_NAMES.map(function(n,i){ return { i:i, name:n, icon:BIOMES[i], line:CHAPTER_LINE[i],
      from:i*BIOME_LEN+1, to:(i+1)*BIOME_LEN }; }),
    trouble: (function(){ var o={}; for(var k in TROUBLE) o[k]={ debut:TROUBLE[k].at, homes:TROUBLE[k].homes,
      max:TROUBLE[k].max, icon:TROUBLE_ICON[k], goal:OBSTACLE_GOAL[k]||null }; return o; })(),
    goals: walk(GOALS),
    gates: GATE,
    keystones: KEYSTONE,
    tips: walk(UI.TIPS),
    wakeWords: UI.WAKE_WORDS, wakeFreq: UI.WAKE_FREQ,
    toolPrice: Game.TOOL_PRICE,
    pets: pets
  };
})()`;

(async () => {
  const ch = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
    ["--headless=new","--disable-gpu","--mute-audio","--no-first-run",
     "--remote-debugging-port="+PORT,"--user-data-dir="+OUT+"/_dumpprofile","about:blank"], {stdio:"ignore"});
  for(let i=0;i<80;i++){ try{ await (await fetch("http://127.0.0.1:"+PORT+"/json/version")).json(); break; }catch(e){ await sleep(250); } }
  const t=(await (await fetch("http://127.0.0.1:"+PORT+"/json/list")).json()).find(x=>x.type==="page");
  const ws=new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ ws.onopen=res; ws.onerror=rej; });
  let id=0; const p=new Map();
  ws.onmessage=e=>{ const m=JSON.parse(e.data); if(m.id&&p.has(m.id)){ p.get(m.id)(m); p.delete(m.id);} };
  const send=(m,q={})=>new Promise(r=>{ const i=++id; p.set(i,r); ws.send(JSON.stringify({id:i,method:m,params:q})); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate",{url:"http://localhost:8123/"});
  for(let i=0;i<80;i++){ await sleep(250);
    const r=await send("Runtime.evaluate",{expression:"typeof GROVE!=='undefined' && typeof UI!=='undefined'",returnByValue:true});
    if(r.result&&r.result.result&&r.result.result.value) break; }
  await sleep(600);
  const r=await send("Runtime.evaluate",{expression:EXPR, returnByValue:true});
  if(r.result && r.result.exceptionDetails){ console.error("EVAL FAILED:", JSON.stringify(r.result.exceptionDetails).slice(0,400)); process.exit(1); }
  const data=r.result.result.value;
  fs.writeFileSync(OUT+"/data.json", JSON.stringify(data,null,1));
  console.log("pets:"+data.pets.length+" biomes:"+data.biomes.length+" troubles:"+Object.keys(data.trouble).length
    +" gates:"+Object.keys(data.gates).length+" tips:"+Object.keys(data.tips).length);
  ws.close(); ch.kill(); await sleep(300); process.exit(0);
})().catch(e=>{ console.error("ERR "+e.message); process.exit(1); });
