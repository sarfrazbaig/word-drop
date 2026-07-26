/* Measures how visible every obstacle actually is, in every country, from real rendered
   pixels rather than from the CSS that produced them.

   Two comparisons, because they are different questions:
     vsBoard  - can you see the thing at all, against the painting behind the board
     vsLetter - can you tell it apart from an ordinary letter tile, which is the one that
                matters while you are playing

   The board is laid out so all three surfaces sit next to each other: obstacles on even
   columns, letters on odd ones, and empty rows between so the painting shows through. */
const fs = require("fs"), { spawn } = require("child_process");
const { PNG } = require(require("path").join(__dirname,"..","..","node_modules/pngjs"));
const OUT = require("path").join(__dirname,"..",".work");
const PORT = 9361, sleep = ms => new Promise(r => setTimeout(r, ms));

/* WCAG relative luminance and contrast ratio */
const lum = ([r,g,b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
};
const ratio = (a,b) => { const L1 = Math.max(lum(a),lum(b)), L2 = Math.min(lum(a),lum(b));
  return (L1+0.05)/(L2+0.05); };

/* average colour over the middle of a rect, skipping the outer edge so the drop shadow and
   the rounded corners do not drag the number toward the background */
function sample(png, x, y, w, h, inset = 0.26){
  const x0 = Math.round(x + w*inset), x1 = Math.round(x + w*(1-inset));
  const y0 = Math.round(y + h*inset), y1 = Math.round(y + h*(1-inset));
  let r=0,g=0,b=0,n=0;
  for (let py=y0; py<y1; py++) for (let px=x0; px<x1; px++){
    if (px<0||py<0||px>=png.width||py>=png.height) continue;
    const i = (png.width*py + px) << 2;
    r += png.data[i]; g += png.data[i+1]; b += png.data[i+2]; n++;
  }
  return n ? [r/n, g/n, b/n] : [0,0,0];
}

(async () => {
  const ch = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
    ["--headless=new","--disable-gpu","--hide-scrollbars","--mute-audio","--no-first-run",
     "--remote-debugging-port="+PORT,"--user-data-dir="+OUT+"/_mprofile","about:blank"], {stdio:"ignore"});
  for(let i=0;i<80;i++){ try{ await (await fetch("http://127.0.0.1:"+PORT+"/json/version")).json(); break; }catch(e){ await sleep(250);} }
  const t=(await (await fetch("http://127.0.0.1:"+PORT+"/json/list")).json()).find(x=>x.type==="page");
  const ws=new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ ws.onopen=res; ws.onerror=rej; });
  let id=0; const pend=new Map();
  ws.onmessage=e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){ pend.get(m.id)(m); pend.delete(m.id);} };
  const send=(m,q={})=>new Promise(r=>{ const i=++id; pend.set(i,r); ws.send(JSON.stringify({id:i,method:m,params:q})); });
  const ev=async x=>{ const r=await send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails){
      const d=r.result.exceptionDetails;
      const msg=(d.exception&&(d.exception.description||d.exception.value))||d.text;
      throw new Error(String(msg).split("\n")[0]+"  ::  "+x.replace(/\s+/g," ").slice(0,100));
    }
    return r.result&&r.result.result?r.result.result.value:undefined; };

  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:440,height:930,deviceScaleFactor:2,mobile:true});
  await send("Page.navigate",{url:"http://localhost:8123/"});
  for(let i=0;i<80;i++){ await sleep(250); if(await ev("typeof Game!=='undefined' && !!document.getElementById('btn-play')")) break; }
  await sleep(600);

  /* a fresh Chrome profile is a brand new player, and a brand new player boots into the
     prologue - which is a scripted lesson and never gives us an ordinary round. Seed a save
     past it, then reload so the game reads it. */
  await ev(`(function(){ var p=JSON.parse(localStorage.getItem("worddrop_v3")||"{}");
    p.level=30; p.tut=1; p.gradued=1; p.coach=true; p.amber=500;
    p.grove=p.grove||{}; p.metGrove=p.metGrove||{};
    localStorage.setItem("worddrop_v3", JSON.stringify(p)); return p.level; })()`);
  await send("Page.reload",{ignoreCache:false});
  for(let i=0;i<80;i++){ await sleep(250); if(await ev("typeof Game!=='undefined' && !!document.getElementById('btn-play')")) break; }
  await sleep(700);

  // into a round, answering the intro card until it stays down
  await ev("Game.play()");
  for(let i=0;i<80;i++){
    const on = await ev("(function(){var o=document.getElementById('ov-intro');return !!(o&&o.classList.contains('active'))})()");
    if(on) await ev("try{Game.beginLevel()}catch(e){}");
    const ready = await ev("(function(){try{var o=document.getElementById('ov-intro');"
      + "return !!(S && !S.busy && o && !o.classList.contains('active'))}catch(e){return false}})()");
    if(ready && i>6) break;
    await sleep(200);
  }
  await ev("(function(){var n=document.getElementById('note'); if(n&&n.classList.contains('on')) n.click();"
    + "['ov-tut','ov-meet','ov-unlock','ov-pet'].forEach(function(k){var o=document.getElementById(k);"
    + "if(o&&o.classList.contains('active')){var b=o.querySelector('button,[onclick]');(b||o).click();}}); })()");
  await sleep(500);
  console.log("in a round:", await ev("(function(){try{return !!S}catch(e){return false}})()"));

  const KINDS = await ev("JSON.stringify(Object.keys(TROUBLE).concat(['crate']))").then(JSON.parse);
  const rows = [];

  for (let b = 0; b < 15; b++){
    const level = b*20 + 1 + 5;                      // a level inside country b
    await ev("applyBiome(" + level + ")");
   for (let page = 0; page*16 < KINDS.length; page++){
    // rebuild the board: obstacles on even columns, letters on odd, empty rows between
    const placed = await ev(`(function(){
      boardEl.querySelectorAll('.tw').forEach(function(e){e.remove()});
      S.tiles={}; S.board=[]; for(var r=0;r<ROWS;r++){ var row=[]; for(var c=0;c<COLS;c++) row.push(null); S.board.push(row); }
      var kinds=${JSON.stringify(KINDS)}.slice(${page*16}, ${page*16+16});
      var out=[], k=0;
      var rowsUsed=[1,3,5,7], colsOb=[0,2,4,6];
      for(var ri=0;ri<rowsUsed.length;ri++) for(var ci=0;ci<colsOb.length;ci++){
        if(k>=kinds.length) break;
        var r=rowsUsed[ri], c=colsOb[ci];
        var t=newTile('e', kinds[k], r, c, true);
        out.push({kind:kinds[k], r:r, c:c});
        k++;
      }
      for(var ri2=0;ri2<rowsUsed.length;ri2++) for(var c2=1;c2<COLS;c2+=2){
        newTile('e','normal',rowsUsed[ri2],c2,true);
      }
      return JSON.stringify(out);
    })()`).then(JSON.parse);
    await sleep(450);   // let the tiles settle into place

    const geo = await ev(`(function(){
      var b=boardEl.getBoundingClientRect(), out={board:{x:b.left,y:b.top,w:b.width,h:b.height}, tiles:{}};
      Object.values(S.tiles).forEach(function(t){
        var r=t.inner.getBoundingClientRect();
        out.tiles[t.r+'_'+t.c]={x:r.left,y:r.top,w:r.width,h:r.height,kind:t.kind};
      });
      return JSON.stringify(out);
    })()`).then(JSON.parse);

    const shotRes = await send("Page.captureScreenshot",{format:"png"});
    const png = PNG.sync.read(Buffer.from(shotRes.result.data,"base64"));
    const S2 = 2;   // deviceScaleFactor

    for (const p of placed){
      const g = geo.tiles[p.r + "_" + p.c]; if (!g) continue;
      const ob = sample(png, g.x*S2, g.y*S2, g.w*S2, g.h*S2);
      /* the letter tile beside it. Obstacles sit on even columns and letters on odd ones, so
         the right-hand neighbour always exists except in the last column - which is why four
         obstacles came back with no reading at all the first time. */
      const lg = geo.tiles[p.r + "_" + (p.c+1)] || geo.tiles[p.r + "_" + (p.c-1)];
      const le = lg ? sample(png, lg.x*S2, lg.y*S2, lg.w*S2, lg.h*S2) : null;
      // the empty cell directly above it: bare painting
      const cell = geo.board.w / 7, cy = g.y - cell;
      const bg = sample(png, g.x*S2, cy*S2, g.w*S2, g.h*S2, 0.3);
      /* keep the raw colours too. Contrast is luminance only and ignores hue, so a grey
         stone and a cream tile can score badly while being perfectly easy to tell apart.
         deltaE catches what contrast cannot, and disagreement between the two is the
         interesting case. */
      rows.push({ biome:b, kind:p.kind,
        vsBoard:+ratio(ob,bg).toFixed(2),
        vsLetter: le ? +ratio(ob,le).toFixed(2) : null,
        rgb:{ ob:ob.map(Math.round), bg:bg.map(Math.round), le: le ? le.map(Math.round) : null } });
    }
    // and the reference: an ordinary letter tile against the same painting
    const lg0 = page===0 ? geo.tiles["1_1"] : null;
    if (lg0){
      const cell = geo.board.w/7;
      const le0 = sample(png, lg0.x*S2, lg0.y*S2, lg0.w*S2, lg0.h*S2);
      const bg0 = sample(png, lg0.x*S2, (lg0.y-cell)*S2, lg0.w*S2, lg0.h*S2, 0.3);
      rows.push({ biome:b, kind:"(letter tile)", vsBoard:+ratio(le0,bg0).toFixed(2), vsLetter:null });
    }
    process.stdout.write(".");
   }
  }
  console.log("");

  fs.writeFileSync(OUT + "/contrast.json", JSON.stringify(rows, null, 1));
  console.log("measured " + rows.length + " obstacle/country pairs -> contrast.json");
  ws.close(); ch.kill(); await sleep(300); process.exit(0);
})().catch(e => { console.error("ERR " + e.message); process.exit(1); });
