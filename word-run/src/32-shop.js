/* @module  shop  -  the trading post, ads and the daily quest.
   Split out of the roster so the grove above it is pure data and pure rules, and can be
   shared with the slate build. Everything here reaches for UI, Game and P; nothing above
   it does. */
/* ============ 🟠 THE TRADING POST - IAP catalog + adapter ============
   The SHOP is real; the TILL is pluggable. Shop.provider is null until a store
   is wired (Play Billing / StoreKit / Stripe) - one object with purchase(item)
   and restore(). Until then buys answer honestly and grant nothing. The
   toolbox's 💳 toggle mounts a test till so the whole flow runs end-to-end.
   Prices are PLACEHOLDERS until store listings exist. Receipt validation
   belongs to the store/server layer, not this file. */
const SHOP_ITEMS=[
  {sku:"starter", i:"🎒", n:"the wanderer's bundle", amber:300, extras:{swap:3,wild:3}, price:"$2.99", once:true},
  {sku:"amber_s", i:"🟠", n:"a handful of amber",    amber:200,  price:"$1.99"},
  {sku:"amber_m", i:"💰", n:"a pouch of amber",      amber:550,  price:"$4.99", best:true},
  {sku:"amber_l", i:"🏺", n:"a jar of amber",        amber:1200, price:"$9.99"},
  {sku:"blessing",i:"🕯️", n:"the keeper's blessing", price:"$6.99", once:true,
   d:"every gift opens freely - rescues, doubled thanks, the daily chest"},
];
/* ============ 🎬 THE PICTURE-SHOW - rewarded ads, and nothing else ============
   The brand rule, in code: no interstitials, no banners, ever. Every placement is
   something the player ASKS for. Ads.provider is null until AdMob (or kin) is wired
   at packaging time - one object with show(placement) that resolves when the reward
   is EARNED. Unwired, every placement simply doesn't appear. The toolbox's 🎬
   toggle mounts a test reel so the flows can be rehearsed end-to-end. */
const Ads={
  provider:null,
  DEV:{ name:"dev-reel", async show(p){ await wait(600); return {watched:true}; } },
  ready(){ return !!Ads.provider; },
  async show(placement){
    Game.track("ad_start",{p:placement});
    try{
      await Ads.provider.show(placement);
      Game.track("ad_complete",{p:placement});
      return true;
    }catch(e){
      Game.track("ad_fail",{p:placement});
      UI.chip("🌫️ the picture-show flickered out - <b>nothing was lost</b>");
      return false;
    }
  },
  giftRefresh(){ // the wood's daily chest - FREE now; shows whenever today's gift is unclaimed
    const g=$("homegift"); if(!g) return;
    const today=Math.floor(Date.now()/864e5);
    g.classList.toggle("on", P.tut && P.giftDay!==today);   // no longer gated on an ad provider
  },
  async dailyGift(){
    // THE REASON TO COME BACK TOMORROW. This used to demand a rewarded ad - which meant that
    // with no ad provider wired (and v1 ships free), the chest never opened at all: a dead
    // retention feature. Now returning IS the price. The gift grows gently with the run of
    // mornings, so the habit is rewarded - but a missed day only restarts the run, never
    // punishes it. Cozy games retain through warmth, not loss-anxiety.
    const today=Math.floor(Date.now()/864e5);
    // NOTHING SHOULD EVER LOOK TAPPABLE AND DO NOTHING. The chest is only meant to be on
    // screen while there is a gift waiting, but its visibility is refreshed by the home
    // render - so if the state moved on without one (a day rolling over mid-session, a
    // stale paint), it could sit there inviting a tap that silently did nothing. If we
    // arrive here with nothing to give, correct the chest instead of ignoring the player.
    if(P.giftDay===today){ Ads.giftRefresh(); return; }
    const newDay = P.lastDay!==today;                   // coordinate with play(): whoever meets the new day first claims it
    if(newDay){ P.streak = (P.lastDay===today-1) ? (P.streak||0)+1 : 1; P.lastDay=today; Game.tallyEv("day"); }
    P.giftDay=today;
    const st = P.streak||1;
    const amber = Math.min(45, 15 + st*5);              // day 1: 20🟠, climbing to 45 by the sixth morning
    Game.amber(amber);
    P.pow.swap=Math.min(TOOL_CAP,(P.pow.swap||0)+1);           // always a breeze
    const milestone = st===3 || (st>=7 && st%7===0);    // day 3, then each week: a wish as well
    if(milestone){ P.pow.wild=Math.min(TOOL_CAP,(P.pow.wild||0)+1); }
    save();
    Snd.levelUp(); UI.confetti(); buzz([30,50]);
    Game.track("daily_gift",{ streak:st, amber, milestone });
    const line = st<=1
      ? "🎁 the wood left you <b>"+amber+"🟠</b> and a 🍃 breeze"
      : "🌙 <b>"+st+" mornings</b> here - the wood left <b>"+amber+"🟠</b>, a 🍃 breeze"
        + (milestone ? " and a 🌟 wish" : "");
    UI.toast(line);
    Ads.giftRefresh();
  },
};

const Shop={
  provider:null,
  blessed(){ return !!(P && P.purchases && P.purchases.blessing); },
  DEV:{ name:"dev-test", async purchase(it){ await wait(450); return {test:true}; }, async restore(){ return []; } },
  open(){
    if(S && S.guide) return;                    // lessons keep their focus
    // ANYTHING OPENED FROM THE SIDEBAR MUST CLOSE IT FIRST. Menu actions that switch SCENE
    // get this for free - UI.scene() drops the panel on its way out - but an overlay does
    // not, so the panel stayed open on top of the Trading Post and hid the thing you just
    // asked for. statsShow already closed it by hand; this one never did.
    UI.menuToggle(false);
    Game.track("shop_open",{L:S?S.level:0, amber:P.amber||0});
    Shop.render(); $("ov-shop").classList.add("active");
  },
  close(){ $("ov-shop").classList.remove("active"); },
  // WHAT AMBER BUYS - the honest version. With no till wired (and v1 ships free), this used
  // to render five priced rows whose buy handler could only apologise. A shelf of things you
  // cannot buy reads as a broken shop, not a coming-soon one. Until a provider exists it
  // shows what amber genuinely does IN PLAY, which is the thing players were failing to
  // discover anyway. The moment a till is wired, the real rows come back untouched.
  SPENDS:[
    { i:"🍃", n:"A fresh breeze",  d:"swap any two tiles",              p:20 },
    { i:"🌟", n:"A wish",          d:"turn your letter into any other", p:25 },
    { i:"🪶", n:"Five more moves", d:"when a round runs out",           p:30 },
  ],
  render(){
    const r=$("shop-rows"); if(!r) return;
    const amber=(P&&P.amber)||0;

    if(!Shop.provider){
      $("shop-sub").innerHTML = "you have <b>🟠 "+amber+"</b> amber<br>"
        + "earned in play, spent on comfort - <b>never on power</b>.";
      r.innerHTML = Shop.SPENDS.map(s=>{
        const afford = amber>=s.p;
        return '<div class="shoprow'+(afford?"":" owned")+'">'
          +'<span class="si">'+s.i+'</span>'
          +'<span class="sn">'+s.n+'<small>'+s.d+'</small></span>'
          +'<span class="sp">'+s.p+'🟠</span></div>';
      }).join("");
      $("shop-note").innerHTML = "spend it where you need it: when a 🍃 or 🌟 runs dry, "
        + "<b>tap it on the board</b> and your amber buys a fresh one.";
      return;
    }

    r.innerHTML=SHOP_ITEMS.map(it=>{
      const owned=it.once && P.purchases[it.sku];
      return '<button class="shoprow'+(it.best?" best":"")+(owned?" owned":"")+'" onclick="Shop.buy(\''+it.sku+'\')">'
        +'<span class="si">'+it.i+'</span>'
        +'<span class="sn">'+it.n+(it.best?'<em class="besttag">best value</em>':'')+(it.once?'<em class="oncetag">once</em>':'')
        +'<small>'+(it.d ? it.d : (it.amber?"🟠 "+it.amber:"")+(it.extras?"  +  🍃×"+it.extras.swap+"  🌟×"+it.extras.wild:""))+'</small></span>'
        +'<span class="sp">'+(owned?"yours ✓":it.price)+'</span></button>';
    }).join("");
    $("shop-note").innerHTML = "💳 <b>test payments on</b> - no real money moves";
  },
  async buy(sku){
    const it=SHOP_ITEMS.find(x=>x.sku===sku); if(!it) return;
    if(it.once && P.purchases[sku]){ UI.chip("🎒 you already own this"); return; }
    Game.track("purchase_start",{sku});
    if(!Shop.provider){
      Game.track("purchase_unwired",{sku});
      UI.toast("🌰 the till opens with the full release -<br><small>everything here stays earnable in play</small>");
      return;
    }
    try{
      await Shop.provider.purchase(it);
      Shop.grant(it);
      Game.track("purchase_complete",{sku, amber:it.amber||0, test:Shop.provider===Shop.DEV});
    }catch(e){
      Game.track("purchase_fail",{sku, err:String(e).slice(0,80)});
      UI.chip("🌫️ the trade didn't go through - <b>nothing was taken</b>");
    }
  },
  grant(it){ // idempotent for once-items; every grant is saved before it's shown
    if(it.once){ if(P.purchases[it.sku]) return; P.purchases[it.sku]=Date.now(); }
    if(it.amber){ P.amberBought=(P.amberBought||0)+it.amber; Game.amber(it.amber); }
    if(it.extras){
      P.pow.swap=Math.min(TOOL_CAP,(P.pow.swap||0)+(it.extras.swap||0));
      P.pow.wild=Math.min(TOOL_CAP,(P.pow.wild||0)+(it.extras.wild||0));
    }
    save();
    Snd.levelUp(); UI.confetti(); buzz([30,50,90]);
    UI.chip(it.i+" "+it.n+" - <b>yours!</b>");
    if(S){ try{ UI.all(); }catch(e){} }
    Shop.render();
  },
  async restore(){ // store re-installs re-deliver their once-items here
    if(!Shop.provider || !Shop.provider.restore) return;
    const owned=await Shop.provider.restore();
    owned.forEach(sku=>{ const it=SHOP_ITEMS.find(x=>x.sku===sku); if(it && it.once && !P.purchases[sku]) Shop.grant(it); });
  },
};

function dailyQuest(){
  const day = Math.floor(Date.now()/86400000);
  return [
    {name:"Warm-up", emoji:"🌤️", type:"words", target:5, reward:"wild", text:"clear 5 words"},
    {name:"Word Picnic", emoji:"🧺", type:"letters", target:14, reward:"bomb", text:"clear 14 letters"},
    {name:"Little Treasure", emoji:"💎", type:"points", target:60, reward:"wild", text:"earn 60 points"},
    {name:"Long Way Home", emoji:"🏡", type:"long", target:2, reward:"bomb", text:"make two 4-letter words"},
  ][day % 4];
}

/* =================== PERSISTENCE (v2: level-based) =================== */
