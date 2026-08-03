/* ============ POWERS - what a friend actually does ============
   @module  powers

   One entry per power, keyed by the fx.t on a friend in GROVE. This was a single
   304-line switch inside petAct, which had become the place where every new friend
   went and where nothing could be found: adding the fifty-first meant reading to the
   middle of a function to learn what names were already taken, and a typo in an fx.t
   produced a friend that simply never did anything, with no error anywhere.

   Each power is handed only the things it uses, so the signature is the documentation:
     fx        the effect spec off the friend ({t, n})
     m         tier multiplier - a grown friend gives more of whatever it gives
     pet       the friend doing the work
     boost     legacy same-home doubling, always false now
     el        the friend's seat on the shelf, for animations that start there
     normals   () every plain letter tile on the board
     cols      () how many tiles stand in each column
     rowTiles  (r) the scoreable tiles in one row
     buzzT     the friend the bee has chosen to help

   `break` became `return` because a power now ends by returning rather than by
   leaving a switch - EXCEPT where a break belonged to a nested loop. sweepTops and
   antlerSort both scan columns with an inner `for` that breaks out of itself, and
   converting those two would have quietly destroyed the moose. Hush.audit() checks
   that every friend's fx.t has a handler here, which is the other half of what the
   switch's default case never did. */
const POWERS = {
  async pawPat({ normals }){
        const ns=normals();
        if(!ns.length){ Game.petShrug(1); return; }
        // the paw lands where the walk went - the aimed tile is tried first, so the
        // gesture and the pat agree (same fix as the goat)
        const aimed=Game.petAim();
        const pick = (aimed && aimed.kind==="normal" && Game.catFit([aimed])) || Game.catFit(ns);
        if(!pick){ Game.addMoves(1); UI.petEdge("🐾 nothing to pat into place - the cat found you a spare move instead"); return; }
        Game.retype(pick.t, pick.L); UI.shards(pick.t.r, pick.t.c, "#ffd9a8");
        Snd.tone(880,{dur:.1,type:"triangle",gain:.06,verb:true}); buzz(10);
        S.chain=1; await Game.resolve([pick.t]); return;
  },
      // reaches as far as it has grown: a maxed dog fishes for FIVE first, which is exactly
      // the length that wakes a legend. `boost?5:4` was left over from the same-home
      // doubling - with boost gone it read 4, so the dog scanned the whole board for a
      // four twice over and the first pass was pure waste.
  async weave({ m }){ const done = await Game.petAlign(m>=2?5:4) || await Game.petAlign(4) || await Game.petAlign(3);
        // no word to dig up on this board - rather than nothing, the dog brings back a
        // star. Players saw their letter silently become ★ and had no idea why.
        if(!done && S.cur){ S.cur={letter:"★",kind:"wild"}; UI.piece(); UI.stardrift();
          UI.petEdge((UI.artTag("dog","toastimg")||"🐶")+" no word to dig up - fetched a <b>⭐ star</b> instead"); } return;
  },
      // rainHelp lived here - the bee's old power, two helpful tiles a fire. It went with
      // the bee's rethink: at six fires a round it buried a small board, and burying the
      // board is how a beginner loses. Nothing else used it.
  async wildHand({ boost }){ if(S.cur) S.cur={letter:"★",kind:"wild"};
        if(boost && S.next) S.next={letter:"★",kind:"wild"};
        UI.piece(); UI.stardrift(); Game.handPop(); return;
  },
  async charm({ pet, m, fx }){ S.charm=(S.charm||0)+fx.n*m; // 🎼 Grace Notes
        UI.petEdge((UI.artTag(pet.w,"toastimg")||pet.e)+" sings! Your next "+(S.charm>1?S.charm+" words score":"word scores")+" <b>DOUBLE</b> 💖");
        for(let i=0;i<5;i++){ const h=document.createElement("div"); h.className="heart"; h.textContent="💖";
          h.style.left=(30+Math.random()*40)+"%"; h.style.top="40%"; h.style.animationDelay=(i*0.1)+"s";
          $("app").appendChild(h); setTimeout(()=>h.remove(),1300); }
        Snd.tone(1046,{dur:.3,type:"sine",gain:.07,verb:true}); return;
  },
  async moves({ m, fx }){Game.addMoves(fx.n*m); return; // 🐾 Pond Patrol
  },
  async wildOld({ normals, fx }){ const old=normals().sort((a,b)=>a.id.localeCompare?a.id.localeCompare(b.id):(a.id-b.id)).slice(0,fx.n);
        old.forEach(t=>{ t.kind="wild"; t.inner.className="tile wild thawpop"; t.inner.innerHTML=tileFace(t); });
        UI.stardrift(); S.chain=1; await Game.resolve(old); return;
  },
  async goldenEgg({ boost }){{ S.cur={letter:"e",kind:"gold"}; if(boost) S.next={letter:"e",kind:"gold"};
        UI.piece(); Snd.gold(); Game.handPop(); return; }
  },
  /* 🐦 MORNING CHORUS - sings the vowel the BOARD wants. helpfulByLength() already knows
     which letters finish words here; the robin picks the best vowel among them. */
  async robinVowel({ pet }){
        const best=helpfulByLength(); let pick=null;
        for(const l of ["a","e","i","o","u"]) if(best[l] && (!pick || best[l]>best[pick])) pick=l;
        pick = pick || "e";
        S.next={letter:pick, kind:"normal", pin:1}; UI.piece(); Game.handPop();
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" sings <b>"+pick.toUpperCase()+"</b> into your next slot");
        Snd.tone(1174,{dur:.12,type:"triangle",gain:.06,verb:true}); return;
  },
  /* 🦊 TOO CLEVER - the fox has already fetched the letter the board wants MOST, vowel or
     not. The same oracle the wish reads, one slot ahead of you. */
  async foxFetch({ pet }){
        const best=helpfulByLength(); let pick=null;
        for(const l in best) if(!pick || best[l]>best[pick]) pick=l;
        if(!pick){ Game.petShrug(1); return; }
        S.next={letter:pick, kind:"normal", pin:1}; UI.piece(); Game.handPop();
        UI.petEdge((UI.artTag(pet.w,"toastimg")||pet.e)+" has already fetched <b>"+pick.toUpperCase()+"</b>");
        Snd.tone(880,{dur:.1,type:"triangle",gain:.06,verb:true}); return;
  },
  /* 🐶 FETCH - the letter you just spent comes right back to the next slot. Beside the
     wolf (kinship), it comes back GOLDEN: the pack reminds the dog what it was. */
  async dogFetch({ pet }){
        const l=S._lastDropped; if(!l){ Game.petShrug(1); return; }
        const gilt=kinBeside("dog");
        S.next={letter:l, kind:gilt?"gold":"normal", pin:1}; UI.piece(); Game.handPop();
        if(gilt) Snd.gold();
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" fetches <b>"+l.toUpperCase()+"</b> right back"+(gilt?" - <b>golden</b>, the wolf approves":""));
        return;
  },
  /* 🐤 LITTLE EGG - hatches into a humbly helpful letter (the second-best, never the
     fox's pick - the chick is small and trying its best). */
  async chickEgg({ pet }){
        const best=helpfulByLength(); const ks=Object.keys(best).sort((a,b)=>best[b]-best[a]);
        const pick=ks[1]||ks[0]||"e";
        S.next={letter:pick, kind:"normal", pin:1}; UI.piece(); Game.handPop();
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" lays a little egg - it hatches into <b>"+pick.toUpperCase()+"</b>");
        Snd.tone(1568,{dur:.1,type:"triangle",gain:.05}); return;
  },
  /* 🪱 THE UNDER-WAY - the top letter of a busy pile slips beneath it, and words rise
     from below. Never a column with mire: the anchor cannot be burrowed past. */
  async wormTunnel({ pet }){
        let best=-1, bestN=0;
        for(let c=0;c<COLS;c++){ let n=0, anchored=false;
          for(let r=0;r<ROWS;r++){ const t=S.board[r][c]; if(t){ n++; if(t.kind==="mire") anchored=true; } }
          if(!anchored && n>=3 && n>bestN){ bestN=n; best=c; } }
        if(best<0){ Game.petShrug(1); return; }
        const c=best; let top=0; while(top<ROWS && !S.board[top][c]) top++;
        const t=S.board[top][c];
        for(let r=top;r<ROWS-1;r++){ const up=S.board[r+1][c]; S.board[r][c]=up;
          if(up){ up.r=r; placeTile(up,r,c,false); } }
        S.board[ROWS-1][c]=t; t.r=ROWS-1; placeTile(t,t.r,t.c,false);
        UI.shards(ROWS-1,c,"#9a7a55");
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" burrows - <b>"+((t.letter||"?").toUpperCase())+"</b> slips in from below");
        Snd.tone(300,{dur:.14,type:"triangle",gain:.06}); buzz(10);
        S.chain=1; await Game.resolve([t]); return;
  },
  /* 🐇 THE WAYS THROUGH - briar-born: one bramble becomes a path, and there is always
     a move hidden in a shortcut. */
  async harePath({ pet }){
        const b=Object.values(S.tiles).find(t=>t.kind==="bramble")
             || Object.values(S.tiles).find(t=>t.kind==="branch");
        if(!b){ Game.petShrug(1); return; }
        UI.shards(b.r,b.c,"#7dd87d"); Game.creditTile(b); removeTile(b); Game.addMoves(1);
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" knows the way through - <b>+1 move</b>");
        const fell=await Game.gravity(); S.chain=1; await Game.resolve(fell||[]); return;
  },
  /* 🐗 ROOTS IT UP - the door-gift of the Mosswood answers the Mosswood's own trouble. */
  async boarRoot({ pet, m }){
        const roots=Object.values(S.tiles).filter(t=>t.kind==="root");
        if(!roots.length){ Game.petShrug(1); return; }
        let pay=0;
        for(const t of roots){ UI.shards(t.r,t.c,"#8a6a44"); Game.creditTile(t); removeTile(t); pay+=2*m; }
        Game.amber(pay);
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" roots it all up - <b>+"+pay+" 🟠</b>");
        buzz(16);
        const fell=await Game.gravity(); S.chain=1; await Game.resolve(fell||[]); return;
  },
  /* 🪰 COMES RIGHT BACK - the letter you just dropped, re-offered. Annoying, usefully. */
  async flyReturn({ pet }){
        const l=S._lastDropped; if(!l){ Game.petShrug(1); return; }
        S.next={letter:l, kind:"normal", pin:1}; UI.piece(); Game.handPop();
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" brings <b>"+l.toUpperCase()+"</b> right back");
        return;
  },
  /* 🐞 LUCKY SPOT - your next word counts as a flourish, whatever it is. */
  async ladybugLuck({ pet }){
        S._ladyLuck=(S._ladyLuck||0)+1;
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" lands on you - your <b>next word is a flourish</b>");
        Snd.tone(1318,{dur:.12,type:"triangle",gain:.06,verb:true}); return;
  },
  /* 🐟 RAINBOW TROUT - leaps at a flourish and leaves the one tile the wood never deals. */
  async fishLeap({ pet }){
        const ns=Object.values(S.tiles).filter(t=>t.kind==="normal");
        if(!ns.length){ Game.petShrug(1); return; }
        const t=ns[Math.floor(Math.random()*ns.length)];
        t.kind="rainbow"; t.inner.className="tile rainbow thawpop"; t.inner.innerHTML=tileFace(t);
        Snd.gold(); UI.shards(t.r,t.c,"#c69eff");
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" leaps! <b>"+((t.letter||"").toUpperCase())+"</b> comes down RAINBOW");
        S.chain=1; await Game.resolve([t]); return;
  },
  /* 🐺 RALLY THE PACK - the late-game bee: one howl and every friend on duty stirs. */
  async wolfHowl({ pet, m }){
        const others=Game.petActives().filter(g=>g!==pet && g.wake && !(S._woke||[]).includes(g.w));
        if(!others.length){ Game.petShrug(1); return; }
        S.wake=S.wake||{};
        for(const g of others){ S.wake[g.w]=(S.wake[g.w]||0)+1*m;
          if(S.wake[g.w]>=Game.wakeNeed(g)){ S._woke=S._woke||[];
            if(!S._woke.includes(g.w)) S._woke.push(g.w); } }
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" howls - <b>the whole pack stirs</b>");
        Snd.tone(392,{dur:.4,type:"sine",gain:.07,verb:true}); buzz([30,50,30]);
        UI.petMeter(); return;
  },
  /* 🐉 THE GREAT BREATH - a whole row blows one step round, wrapping. The biggest breeze
     in the wood, from the creature whose breath IS weather. Never a row with mire. */
  async dragonGale({ pet }){
        let best=-1, bestN=0;
        for(let r=0;r<ROWS;r++){ let n=0, bad=false;
          for(let c=0;c<COLS;c++){ const t=S.board[r][c]; if(t){ if(t.kind==="mire"){ bad=true; break; } n++; } }
          if(!bad && n>=3 && n>bestN){ bestN=n; best=r; } }
        if(best<0){ Game.petShrug(2); return; }
        const r=best, keep=S.board[r][COLS-1];
        for(let c=COLS-1;c>0;c--){ const t=S.board[r][c-1]; S.board[r][c]=t;
          if(t){ t.c=c; placeTile(t,r,c,false); } }
        S.board[r][0]=keep; if(keep){ keep.c=0; placeTile(keep,r,0,false); }
        Snd.tone(220,{dur:.25,type:"sine",gain:.06,verb:true}); buzz(14);
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" breathes - <b>the row blows round</b>");
        const moved=[]; for(let c=0;c<COLS;c++){ const t=S.board[r][c]; if(t) moved.push(t); }
        await Game.gravity(); S.chain=1; await Game.resolve(moved.filter(t=>S.tiles[t.id])); return;
  },
  /* 🐐 EATS ANYTHING - one piece of trouble, straight down, digested into amber. Never a
     crate: gifts are not junk, even to a goat. */
  async goatEat({ pet, m, fx }){
        const junk=Object.values(S.tiles).filter(t=>OBSTACLE_KINDS.includes(t.kind) && t.kind!=="crate");
        if(!junk.length){ Game.petShrug(1); return; }
        // eat the tile the walk aimed at, so the gesture and the bite agree
        const aimed=Game.petAim();
        const t=(aimed && OBSTACLE_KINDS.includes(aimed.kind) && aimed.kind!=="crate")
          ? aimed : junk[Math.floor(Math.random()*junk.length)];
        UI.shards(t.r,t.c,"#c8a96e");
        Game.creditTile(t); removeTile(t);
        const pay=Math.round((fx.n||5)*m); Game.amber(pay);
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" ate the "+t.kind+" - <b>+"+pay+" 🟠</b>");
        Snd.tone(520,{dur:.12,type:"triangle",gain:.07}); buzz(12);
        const fell=await Game.gravity(); await Game.resolve(fell||[]); return;
      /* 🦇 ECHO NUDGE. Reversing the whole bottom row could shred letters a player was
         deliberately assembling - a friend that undoes your plan is anti-magical, and at
         two and a half fires a round it would have happened most rounds. One letter slides
         one space instead, and it looks for a slide that MAKES a word before settling for
         any slide at all. */
  },
      // the slide was already chosen by petTarget, and the bat is standing beside that
      // exact letter - this only carries it out
  /* 🦇 READ IT BACKWARDS is a passive and does nothing here - findWords() asks
     hasPassive("readsBoth") directly, because the rule has to be true at the moment the
     player is choosing a column, not at the moment a friend takes a turn. S.batReads stays
     as a manual override so tools and tests can switch backwards reading on without
     equipping anybody. */
  async readsBoth(){ /* passive - the rule lives in findWords() */

      /* 🐝 THE BEE MAKES SPACE, it does not make letters. Two helpful tiles a fire at six
         fires a round was about twelve extra tiles per round, which buries a small board -
         and burying the board is exactly how a beginner loses. It was also the cat's beat
         wearing a different coat: both handed you a letter you could use. Lifting the top
         off the tallest pile is the opposite of the cat, and answers the real failure. */
      /* 🐝 THE ONLY POWER THAT IS PURELY ABOUT THE OTHERS.
         Lifting a tile off a pile was correct and dull: it ended in silence, while the cat
         and the dog both end in a word. And an automatic pluck was worse than useless
         beside the wish, which plucks whatever the PLAYER chooses.
         So the bee does what a bee does - it goes friend to friend. Its whole power is
         other friends, which makes it the one pet that grows with every creature you ever
         meet, and it teaches the second lesson of the wood out loud: your friends are not
         five separate powers, they are a party.
         It nudges whoever is CLOSEST to stirring, so the buzz is felt now rather than
         banked - and if that tips them over, they act inside this same turn. The drain
         loop in tryPetAct is still running, so the chain resolves as one moment. */
  },
  async buzz({ pet, m, buzzT }){
        const others=Game.petActives().filter(g=>g!==pet && g.wake && !(S._woke||[]).includes(g.w));
        if(!others.length){ Game.petShrug(1); return; }
        const togo=g=>Game.wakeNeed(g)-((S.wake&&S.wake[g.w])||0);
        others.sort((a,b)=>togo(a)-togo(b));
        // the one the bee actually flew to, so the animation and the effect agree
        const friend=buzzT||others[0];
        S.wake=S.wake||{};
        S.wake[friend.w]=(S.wake[friend.w]||0)+1*m;
        const woke = S.wake[friend.w] >= Game.wakeNeed(friend);
        // the buzzed friend's pips FILL and stay full until it has had its turn - same rule
        // as every other wake (see sees()), so the bee's help is something you watch land
        if(woke){ S._woke=S._woke||[];
          if(!S._woke.includes(friend.w)) S._woke.push(friend.w); }
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" buzzes - "+(UI.artTag(friend.w,"toastimg")||friend.e)+(woke?" <b>wakes!</b>":" stirs"));
        Snd.tone(woke?990:760,{dur:.11,type:"triangle",gain:.06,verb:true}); buzz(10);
        UI.petMeter(); return;
  },
  async movesScale({ m }){Game.addMoves(Math.max(1, Math.min(6, Math.floor((S.wordsMade||0)/2)))*m); return;
  },
  async crackAll({ boost }){ const rocks=Object.values(S.tiles).filter(t=>t.kind==="stone");
        if(!rocks.length){ Game.petShrug(2); return; }
        $("boardwrap").classList.add("shake"); setTimeout(()=>$("boardwrap").classList.remove("shake"),450);
        for(const t of rocks){ if(boost||t.cracks){ UI.shards(t.r,t.c,"#8a8f99"); Game.credit("stone"); removeTile(t); S.levelScore+=5; Snd.crack(true); }
          else { t.cracks=1; t.inner.classList.add("cracked"); Snd.crack(false); } await wait(110); }
        UI.hud(); await Game.settle(); return;
  },
  async eatWorst({ m, fx }){ const picks=Game.worstTiles(fx.n*m);
        if(!picks.length){ Game.petShrug(2); return; }
        for(const t of picks){ UI.shards(t.r,t.c,"#c9b18a"); removeTile(t); Snd.crack(true); await wait(160); }
        await Game.settle(); return;
  },
  async flatBonus({ m, fx }){S.flatB=(S.flatB||0)+fx.n*m; return;
  },
  async chainBoost({ pet }){S.chainBoost=true;
        /* 🦗 THE CHIRP RESONATES - the cricket's note is the only thing in the wood that
           crystal answers. Every crystal on the board cracks a step when it sings, which
           is the Glimmer Seams' own trouble meeting its own friend. */
        if(pet && pet.w==="cricket"){
          const cr=Object.values(S.tiles).filter(t=>t.kind==="crystal");
          for(const t of cr){ t.cracks=(t.cracks||0)+1;
            if(t.cracks>=2){ UI.shards(t.r,t.c,"#bfe7f2"); Game.creditTile(t); removeTile(t); }
            else { t.inner.classList.add("cracked"); UI.shards(t.r,t.c,"#e2f4fa"); } }
          if(cr.length){ Snd.tone(1567,{dur:.2,type:"triangle",gain:.06,verb:true});
            UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" sings - <b>the crystal answers</b>");
            const fell=await Game.gravity(); await Game.resolve(fell||[]); } }
        return;
  },
      // gilds the SHORTEST column, not the tallest. Gold on the tallest pile is the
      // hardest gold on the board to ever reach - measured earlier, a fox-gilded column
      // sat untouched for twenty-six drops. Down in the low ground it gets spent.
      // the shortest column that actually HAS something in it. Plain Math.min picks an
      // empty column on a sparse early board, and gilding nothing at all is a worse
      // failure than gilding the unreachable tallest pile was.
  async goldCol({ cols }){ const h=cols(); let c=-1, low=Infinity;
        for(let i=0;i<COLS;i++) if(h[i]>0 && h[i]<low){ low=h[i]; c=i; }
        if(c<0){ Game.petShrug(1); return; }
        const changed=[]; for(let r=0;r<8;r++){ const t=S.board[r][c]; if(t&&t.kind==="normal"){ t.kind="gold"; t.inner.classList.add("gold","thawpop"); setTimeout(()=>t.inner.classList.remove("thawpop"),560); changed.push(t); UI.shards(t.r,t.c,"#ffd54f"); } }
        Snd.gold(); return;
  },
  async swapCols({ cols, el }){ const h=cols(); const opts=[]; for(let c=0;c<COLS-1;c++) if(h[c]&&h[c+1]) opts.push(c);
        if(!opts.length){ Game.petShrug(2); return; }
        const c=rand(opts); const moved=[];
        for(let r=0;r<8;r++){ const a=S.board[r][c], b=S.board[r][c+1];
          S.board[r][c]=b; S.board[r][c+1]=a;
          if(a){ a.c=c+1; moved.push(a); } if(b){ b.c=c; moved.push(b); } }
        moved.forEach(t=>{ t.el.style.transition="transform .45s cubic-bezier(.4,.05,.35,1)"; placeTile(t,t.r,t.c,false); });
        UI.breeze(); await wait(480); moved.forEach(t=>t.el.style.transition="");
        await Game.settle(moved); return;
  },
  async eatRow({ rowTiles }){ const ts=rowTiles(ROWS-1);
        for(const t of ts){ UI.shards(t.r,t.c,"#a8c9a0"); removeTile(t); }
        Snd.collapse(ts.length); await Game.settle(); return;
  },
  async midRow({ rowTiles }){ const ts=rowTiles(ROWS-2);
        if(!ts.length){ Game.petShrug(2); return; }
        $("boardwrap").classList.add("shake"); setTimeout(()=>$("boardwrap").classList.remove("shake"),450);
        for(const t of ts){ UI.shards(t.r,t.c,"#d8b077"); removeTile(t); }
        Snd.collapse(ts.length); await Game.settle(); return;
  },
  async smashPatch(){ const picks=[];
        for(let r=ROWS-2;r<ROWS;r++) for(let c=3;c<=4;c++){ const t=S.board[r][c]; if(t) picks.push(t); }
        if(!picks.length){ Game.petShrug(2); return; }
        $("boardwrap").classList.add("shake"); setTimeout(()=>$("boardwrap").classList.remove("shake"),450);
        for(const t of picks){ UI.shards(t.r,t.c,"#c5a3e0"); Game.creditTile(t); removeTile(t); Snd.crack(true); await wait(90); }
        await Game.settle(); return;
  },
  async digCrate({ cols }){ const h=cols(); const c=h.indexOf(Math.min(...h));
        let land=ROWS-1; while(land>=0&&S.board[land][c]) land--;
        if(land<0){ Game.petShrug(2); return; }
        newTile("?","crate",land,c); Snd.gold(); return;
  },
  async churn({ normals, m, fx }){ const picks=normals().sort(()=>Math.random()-.5).slice(0,fx.n*m);
        picks.forEach(t=>Game.retype(t, riggedLetter()));
        S.chain=1; await Game.resolve(picks); return;
  },
  async slideRow({ rowTiles }){ const ts=rowTiles(ROWS-1); if(ts.length<2){ Game.petShrug(2); return; }
        const contents=ts.map(t=>({l:t.letter,k:t.kind}));
        contents.unshift(contents.pop());
        ts.forEach((t,i)=>{ t.letter=contents[i].l; t.kind=contents[i].k;
          t.inner.className="tile"+(t.kind!=="normal"?" "+t.kind:""); t.inner.innerHTML=tileFace(t); });
        UI.breeze(); S.chain=1; await Game.resolve(ts); return;
  },
  async goldSchool({ normals }){ const count={}; normals().forEach(t=>count[t.letter]=(count[t.letter]||0)+1);
        const top=Object.keys(count).sort((a,b)=>count[b]-count[a])[0];
        if(!top){ Game.petShrug(2); return; }
        normals().filter(t=>t.letter===top).forEach(t=>{ t.kind="gold"; t.inner.classList.add("gold","thawpop"); setTimeout(()=>t.inner.classList.remove("thawpop"),560); UI.shards(t.r,t.c,"#ffd54f"); });
        Snd.gold(); return;
  },
  async bestHand(){ const best=helpfulByLength(); const ks=Object.keys(best).sort((a,b)=>best[b]-best[a]);
        const l=ks[0] || (builderLetters()[0]) || riggedLetter();
        S.cur={letter:l, kind:(S.cur&&S.cur.kind==="gold")?"gold":"normal"}; // 🎯 Sharp Hunters gild the strike
        UI.piece(); Game.handPop(); return;
  },
  async twinHand(){ if(S.cur) S.next={letter:S.cur.letter,kind:S.cur.kind,pin:1}; UI.piece(); Game.handPop(); return;
  },
  async thawAll(){ const ices=Object.values(S.tiles).filter(t=>t.kind==="ice");
        if(!ices.length){ Game.petShrug(2); return; }
        ices.forEach(t=>{ Game.credit("ice"); t.kind="normal"; t.inner.className="tile thawpop"; t.inner.innerHTML=tileFace(t); UI.shards(t.r,t.c,"#a8dcf5"); });
        Snd.thaw(); S.chain=1; await Game.resolve(ices); return;
  },
  async smashCol({ cols }){ const h=cols(); const c=h.indexOf(Math.max(...h));
        if(!h[c]){ Game.petShrug(2); return; }
        $("boardwrap").classList.add("shake"); setTimeout(()=>$("boardwrap").classList.remove("shake"),450);
        for(let r=0;r<8;r++){ const t=S.board[r][c]; if(t){ UI.shards(r,c,"#c5a3e0"); Game.creditTile(t); removeTile(t); } }
        Snd.collapse(6); return;
  },
  /* 🦬 STAMPEDE - the column with the most TROUBLE loses all of it; the letters hold on
     and tumble down through the gaps. smashCol before it flattened letters too, which the
     sim caught as a friend that vandalised its own player: 8.6 acts a round, zero value. */
  async stampede({ pet }){
        let best=-1, bestN=0;
        for(let c=0;c<COLS;c++){ let n=0;
          for(let r=0;r<8;r++){ const t=S.board[r][c];
            if(t && OBSTACLE_KINDS.includes(t.kind) && t.kind!=="crate") n++; }
          if(n>bestN){ bestN=n; best=c; } }
        if(best<0){ Game.petShrug(2); return; }
        $("boardwrap").classList.add("shake"); setTimeout(()=>$("boardwrap").classList.remove("shake"),450);
        for(let r=0;r<8;r++){ const t=S.board[r][best];
          if(t && OBSTACLE_KINDS.includes(t.kind) && t.kind!=="crate"){
            UI.shards(r,best,"#c5a3e0"); Game.creditTile(t); removeTile(t); } }
        Snd.collapse(bestN); buzz(16);
        UI.petSay((UI.artTag(pet.w,"toastimg")||pet.e)+" stampedes - <b>"+bestN+" trouble shaken loose</b>");
        const fell=await Game.gravity(); S.chain=1; await Game.resolve(fell||[]); return;
  },
  async sweepTops(){ const picks=[];
        for(let c=0;c<COLS;c++){ for(let r=0;r<8;r++){ const t=S.board[r][c]; if(t){ if(t.kind==="normal"||t.kind==="gold"||t.kind==="wild") picks.push(t); break; } } }
        if(!picks.length){ Game.petShrug(2); return; }
        for(const t of picks){ UI.shards(t.r,t.c,"#9fd4f2"); removeTile(t); }
        Snd.collapse(picks.length); return;
  },
  async splash({ m, fx }){{ S.splash=(S.splash||0)+fx.n*m;
        return; } // 🏖️ Beach Day
  },
  async damFill({ cols, el, fx }){ const h=cols(); const order=[...Array(COLS).keys()].sort((a,b)=>h[a]-h[b]).slice(0,fx.n);
        const added=[];
        for(const c of order){ let land=ROWS-1; while(land>=0&&S.board[land][c]) land--;
          if(land<2) continue; const t=newTile(riggedLetter(),"normal",land,c,false); added.push(t);
          t.el.style.transition="none"; t.el.style.transform=xy(-1.2,c); void t.el.offsetWidth;
          t.el.style.transition="transform 240ms cubic-bezier(.55,0,.85,.55)"; t.el.style.transform=xy(land,c);
          await wait(250); t.el.style.transition=""; }
        S.chain=1; await Game.resolve(added); return;
  },
  async freePluck({ pet }){ S.freePluck=true; S.usingPluck=true; $("wishbtn").classList.add("armed");
        UI.petEdge((UI.artTag(pet.w,"toastimg")||pet.e)+" dug a hole - <b>tap any letter to pluck it FREE</b>"); return;
  },
  async stoneGold(){ const rocks=Object.values(S.tiles).filter(t=>t.kind==="stone");
        if(!rocks.length){ Game.petShrug(2); return; }
        rocks.forEach(t=>{ Game.credit("stone"); t.kind="gold"; t.letter=riggedLetter(); t.inner.className="tile gold thawpop"; t.inner.innerHTML=tileFace(t); UI.shards(t.r,t.c,"#ffd54f"); });
        Snd.gold(); S.chain=1; await Game.resolve(rocks); return;
  },
  async shuffleCols({ el }){ const perm=[...Array(COLS).keys()].sort(()=>Math.random()-.5);
        const grid=[]; for(let r=0;r<8;r++){ grid.push([...S.board[r]]); }
        const moved=[];
        for(let r=0;r<8;r++) for(let c=0;c<COLS;c++){ const t=grid[r][perm[c]]; S.board[r][c]=t||null;
          if(t){ t.c=c; moved.push(t); } }
        moved.forEach(t=>{ t.el.style.transition="transform .55s cubic-bezier(.4,.05,.35,1)"; placeTile(t,t.r,t.c,false); });
        UI.breeze(); await wait(580); moved.forEach(t=>t.el.style.transition="");
        await Game.settle(moved); return;
  },
  async vowelize({ normals, m, fx }){ const picks=normals().filter(t=>!"aeiou".includes(t.letter)).sort(()=>Math.random()-.5).slice(0,fx.n*m);
        if(!picks.length){ Game.petShrug(2); return; }
        picks.forEach(t=>Game.retype(t, rand(["a","e","i","o","u"])));
        S.chain=1; await Game.resolve(picks); return;
  },
  async clearRoom({ normals }){ const ts=normals(); if(!ts.length){ Game.petShrug(2); return; }
        const junk=ts.filter(t=>"qzxjv".includes(t.letter));
        const target = junk.length ? junk[0].letter
          : ts.slice().sort((a,b)=>VAL[b.letter]-VAL[a.letter])[0].letter;
        const picks=ts.filter(t=>t.letter===target);
        for(const t of picks){ UI.shards(t.r,t.c,"#c9e29a"); removeTile(t); await wait(120); }
        Snd.collapse(picks.length); await Game.settle(); return;
  },
  async junkToGift(){ const cand=Object.values(S.tiles).find(t=>t.kind==="stone"||t.kind==="ice"||t.kind==="frost"||t.kind==="mist"||t.kind==="bramble"||t.kind==="root"||t.kind==="shroud"||t.kind==="pest") || Game.worstTiles(1)[0];
        if(!cand){ Game.petShrug(2); return; }
        Game.creditTile(cand);   // the rummaged obstacle is genuinely gone - pay the ask for it
        cand.kind="crate"; cand.inner.className="tile thawpop"; cand.inner.innerHTML=tileFace(cand);
        UI.shards(cand.r,cand.c,"#ffd54f"); Snd.gold(); return;
  },
  async acornBlast({ cols }){ const h=cols(); const c=h.indexOf(Math.max(...h));
        let land=ROWS-1; while(land>=0&&S.board[land][c]) land--;
        if(land<0){ Game.petShrug(2); return; }
        const t=newTile("🌰","bomb",land,c);
        await wait(550);
        const fell=await Game.explode(t);
        S.chain=1; await Game.resolve(fell); return;
  },
  async webWrap({ m }){S.web=(S.web||0)+1*m; return;

      /* ---- the five re-aimed powers ------------------------------------------------
         The roster was fourteen ways to clear things and two ways to build a word, which
         is why a party could never be built toward anything. These five were the weakest
         or the most duplicated, and each becomes a distinct way to MAKE a word possible. */
  },

      // 🪰 the fly's old power was wolf's, at a third the strength - an exact duplicate
  async vowelSwarm({ normals }){ const junk=normals().filter(t=>"qzxjv".includes(t.letter));
        if(!junk.length){ Game.petShrug(2); return; }
        for(const t of junk){ Game.retype(t, rand(["a","e","i","o","u"])); UI.shards(t.r,t.c,"#c9e29a"); }
        Snd.thaw(); S.chain=1; await Game.resolve(junk); return;
  },

      // 🦬 the herd calls ahead: the next three letters are all ones that fit
  async herdCall({ pet, m }){ S._helpNext=(S._helpNext||0)+3*m;
        if(S.next && S.next.kind==="normal"){ S.next=makePiece(); UI.piece(); }
        UI.petEdge((UI.artTag(pet.w,"toastimg")||pet.e)+" calls the herd - the next letters are <b>chosen for you</b>");
        return;
  },

      // 🫎 the sweep only ever touched plain tiles and read as a weaker row clear
  async antlerSort(){ const tops=[];
        for(let c=0;c<COLS;c++){ for(let r=0;r<ROWS;r++){ const t=S.board[r][c];
          if(t){ if(t.kind==="normal") tops.push(t); break; } } }
        if(!tops.length){ Game.petShrug(2); return; }
        for(const t of tops){ Game.retype(t, riggedLetter()); UI.shards(t.r,t.c,"#9fd4f2"); }
        Snd.gold(); S.chain=1; await Game.resolve(tops); return;
  },

      // 🐞 a flat +5 on three words was the thinnest power in the wood
  async luckyTile({ normals, m }){ const ns=normals();
        if(!ns.length){ Game.petShrug(2); return; }
        const picks=ns.sort(()=>Math.random()-.5).slice(0, 1*m);
        for(const t of picks){ t.kind="wild"; t.inner.className="tile wild thawpop";
          t.inner.innerHTML=tileFace(t); UI.shards(t.r,t.c,"#e8b64c"); }
        Snd.gold(); S.chain=1; await Game.resolve(picks); return;
  },

      // 🦭 "next two words score half again" sat on top of three other score powers
  async tidePool({ cols, el }){ const h=cols();
        const order=[...Array(COLS).keys()].sort((a,b)=>h[a]-h[b]).slice(0, 2);
        const added=[];
        for(const c of order){ let land=ROWS-1; while(land>=0&&S.board[land][c]) land--;
          if(land<2) continue;
          const t=newTile(rand(["a","e","i","o","u"]),"normal",land,c,false); added.push(t);
          t.el.style.transition="none"; t.el.style.transform=xy(-1.2,c); void t.el.offsetWidth;
          t.el.style.transition="transform 260ms cubic-bezier(.55,0,.85,.55)"; t.el.style.transform=xy(land,c); }
        if(!added.length){ Game.petShrug(2); return; }
        await wait(300); added.forEach(t=>t.el.style.transition="");
        Snd.thaw(); S.chain=1; await Game.resolve(added); return;
  },
  async whisper(){
  },
  async next2(C){ return POWERS.whisper(C); },
  async skipJunk(C){ return POWERS.whisper(C); },
  async vowelDeck(C){ return POWERS.whisper(C); },
  async alwaysHint(C){ return POWERS.whisper(C); },
  async refund4(){ /* passive - petActives() filters these out before petAct */ },
  async crumb(){ /* passive - petActives() filters these out before petAct */ },
  /* ══ THE FOURTEEN'S PASSIVES ══ each lives where its rule must be true, not here:
     the scan, the scoring loop, the wood's tick, the wish, the fail state. */
  async nibble(){ /* passive - the licence lives in scanLine() */ },
  async wallow(){ /* passive - mire joins the line in scanLine() */ },
  async ripen(){ /* passive - the snail ticks in woodTick() */ },
  async damBreak(){ /* passive - pays in the scoring loop when a held word cashes */ },
  async binRaider(){ /* passive - paid inside Game.credit() */ },
  async rainbowWish(){ /* passive - the grant is recoloured in pickWish() */ },
  async bearCarry(){ /* passive - the catch lives in failLevel() */ },
  async mothLight(){ /* passive - gilded and rainbow words pay extra in the scoring loop */ },
  async crowHoard(){ /* passive - amber per shine, paid at the gold count in resolve */ },
  async snakeLong(){ /* passive - the 5+ bonus lives in the scoring loop */ },
  async antMany(){ /* passive - pays per acted friend, in the scoring loop */ },
  async reedPass(){ /* passive - reeds join the line in scanLine() */ },
  async sealWhisker(){ /* passive - misted letters join the line in scanLine() */ },
  async turtleShell(){ /* passive - guards held neighbours in woodTick() and brambleSpread() */ },
  async owlForgive(){ /* passive - the licence lives in scanLine() */ },
  async skunkCount(){ /* passive - the licence lives in scanLine() */ },
  async mooseCalm(){ /* passive - stills the current in boardDrift() */ },
  /* THE TWO MEANING PASSIVES. Their tastes are the rarest in the game - something good to
     eat happens 0.03 times a round, the weather 0.05 - which is precisely why neither can
     be a wake condition: a friend that stirs once in thirty rounds is not a friend. As
     passives they cost nothing while they wait and simply pay when the lovely thing
     happens, which is what a light-hearted power should do. The effects live where the
     word is scored; these entries exist so the audit can see the handler. */
  async foodJoy(){ /* passive - see the +15 in resolve() */ },
  async weatherWatch(){ /* passive - see the +1 move in resolve() */ },
  async freeStep(){ /* passive - petActives() filters these out before petAct */ },
  async helpDeck(){ /* passive - petActives() filters these out before petAct */ },
  async kindred(){ /* passive - petActives() filters these out before petAct */ },
  async firstFree(){ /* passive - petActives() filters these out before petAct */ },
};

/* =================== GAME =================== */
