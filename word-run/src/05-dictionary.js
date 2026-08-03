/* @module  dictionary  -  the word list, injected at build time */
const COMMON = new Set("__COMMON__".split(" "));
if(COMMON.size < 500){
  document.body.innerHTML = '<div style="padding:40px 24px;font-family:system-ui;text-align:center;color:#fff">'+
    '<h2>⚠️ This is the source template</h2><p>Run <code>node build.js</code> and open <b><a href="word-drop.html" style="color:#7dd87d">word-drop.html</a></b> instead.</p></div>';
  throw new Error("Template opened directly - open word-drop.html");
}
const BY_LEN = {};
COMMON.forEach(w=>{ (BY_LEN[w.length] = BY_LEN[w.length]||[]).push(w); });

/* =================== CONSTANTS =================== */
