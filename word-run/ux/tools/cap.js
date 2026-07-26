/* Captures the game's screens by driving headless Chrome over the DevTools protocol.
   Chrome's --screenshot flag needs --virtual-time-budget to wait for anything, and the
   virtual clock races chains that are gated on animations - so the level intro never got
   answered. Here the clock is real and we simply wait for the page to say it is ready. */
const fs = require("fs");
const { spawn } = require("child_process");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUTDIR = require("path").join(__dirname,"..",".work","shots");
const PORT = 9333;
const BASE = "http://localhost:8123/_shot.html";
const PETS = "cat,dog,owl,bee";

const SHOTS = [
  ["01-home-fresh", "s=home&fresh=1"],
  ["02-home",       "s=home&L=30&pets="+PETS],
  ["03-intro",      "s=intro&L=30&pets="+PETS],
  ["04-board",      "s=board&L=30&pets="+PETS],
  ["05-hold",       "s=hold&L=30&pets="+PETS],
  ["06-grace",      "s=grace&L=30&pets="+PETS],
  ["07-breeze",     "s=breeze&L=30&pets="+PETS],
  ["08-wish",       "s=wish&L=30&pets="+PETS],
  ["09-note",       "s=note&L=30&pets="+PETS],
  ["10-fail",       "s=fail&L=30&pets="+PETS],
  ["11-album",      "s=album&L=30&pets=cat,dog,owl,bee,fox,bat,moth,hare"],
  ["12-petsheet",   "s=petsheet&L=30&pets=cat,dog,owl,bee"],
  ["13-obstacles",  "s=obstacles&L=195&pets="+PETS],
  ["14-deep",       "s=board&L=255&pets="+PETS],
  ["15-menu",       "s=menu&L=30&pets="+PETS],
  ["16-fullparty",  "s=fullparty&L=30&pets="+PETS],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(path){
  const r = await fetch("http://127.0.0.1:"+PORT+path);
  return r.json();
}

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--mute-audio",
    "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port="+PORT,
    "--user-data-dir="+OUTDIR+"/_profile",
    "about:blank"
  ], { stdio: "ignore" });

  // wait for the protocol to come up
  let ver = null;
  for (let i=0; i<80; i++){ try { ver = await get("/json/version"); break; } catch(e){ await sleep(250); } }
  if(!ver) { chrome.kill(); throw new Error("Chrome never opened its debugging port"); }
  console.log(ver["Browser"]);

  const targets = await get("/json/list");
  const page = targets.find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params={}) => new Promise(res => {
    const my = ++id; pending.set(my, res);
    ws.send(JSON.stringify({ id: my, method, params }));
  });
  const evalJs = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: false });
    return r.result && r.result.result ? r.result.result.value : undefined;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",
    { width: 440, height: 930, deviceScaleFactor: 2, mobile: true });

  for (const [name, query] of SHOTS){
    await send("Page.navigate", { url: BASE + "?" + query });
    // real clock: just wait for the page to say it finished driving itself
    let ready = false;
    for (let i=0; i<160; i++){
      await sleep(250);
      if (await evalJs("window.__SHOT_READY === true")) { ready = true; break; }
    }
    let extra = "";
    /* THE PAUSE BUBBLE has to be caught, not waited for: it only exists between a word
       forming and that word blooming. So drive from here, where each step's result can be
       read, and use the wood's own lookahead to pick a column that completes a word.
       Note the order of the checks - the bubble is what MAKES the board busy, so testing
       busy first hides it, which is exactly the bug that cost the first three attempts. */
    if (name.endsWith("grace")){
      for (let k=0; k<26; k++){
        const st = await evalJs("(function(){ if(!window.S) return 'noS';"
          + " if(document.querySelector('.gracebubble')) return 'BUBBLE';"
          + " if(S.busy) return 'busy'; if(S.over||S.won) return 'ended';"
          + " var best=-1; for(var c=0;c<7;c++) if(wouldClear(S.cur,c)){best=c;break;}"
          + " if(best<0) for(var c2=0;c2<7;c2++) if(!S.board[0][c2]){best=c2;break;}"
          + " if(best<0) return 'full'; Game.drop(best); return 'drop'+best; })()");
        if (st === "BUBBLE"){ extra = " (bubble in "+k+")"; break; }
        if (st === "ended" || st === "noS" || st === "full") { extra = " ("+st+")"; break; }
        await sleep(400);
      }
    }
    await sleep(700);                       // let the last transition land
    const shot = await send("Page.captureScreenshot",
      { format: "jpeg", quality: 80, captureBeyondViewport: false });
    const data = shot.result && shot.result.data;
    if (data){
      fs.writeFileSync(OUTDIR + "/" + name + ".jpg", Buffer.from(data, "base64"));
      const kb = Math.round(Buffer.from(data,"base64").length/1024);
      console.log((ready?"  ok  ":" SLOW ") + name.padEnd(16) + " " + String(kb).padStart(4) + "KB" + extra);
    } else {
      console.log("  FAIL " + name);
    }
  }

  ws.close(); chrome.kill();
  await sleep(400);
  console.log("done");
  process.exit(0);
})().catch(e => { console.error("ERR " + e.message); process.exit(1); });
