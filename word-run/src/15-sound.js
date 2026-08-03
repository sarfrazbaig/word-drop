/* @module  sound  -  every tone the wood makes */
const Snd = {
  ctx:null, master:null, wet:null, on:true, ambientTimer:null, musicTimer:null,
  init(){
    if(this.ctx) { if(this.ctx.state==="suspended") this.ctx.resume(); return; }
    const C = window.AudioContext||window.webkitAudioContext; if(!C) { this.on=false; return; }
    this.ctx = new C();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value=-18; comp.ratio.value=6;
    this.master = this.ctx.createGain(); this.master.gain.value=0.9;
    this.master.connect(comp); comp.connect(this.ctx.destination);
    const len = this.ctx.sampleRate*1.8, ir = this.ctx.createBuffer(2,len,this.ctx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch);
      for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
    const conv = this.ctx.createConvolver(); conv.buffer=ir;
    this.wet = this.ctx.createGain(); this.wet.gain.value=0.32;
    this.wet.connect(conv); conv.connect(this.master);
    this.startAmbient();
  },
  toggle(){ this.on=!this.on; P.sound=this.on; save();
    // .soundbtn is only ever the ICON - the menu row keeps its "Sound" label and
    // shows its state in words, because a lone muted-speaker glyph reads as broken UI
    document.querySelectorAll(".soundbtn").forEach(el=>el.textContent = this.on?"🔊":"🔇");
    const st=document.getElementById("menu-snd-state"); if(st) st.textContent=this.on?"on":"off";
    if(this.on){ this.init(); this.startMusic(); }
    else { clearInterval(this.musicTimer); clearInterval(this.ambientTimer); } },
  now(){ return this.ctx.currentTime; },
  tone(freq, o){
    if(!this.on||!this.ctx) return; o=o||{};
    const t0=this.now()+(o.when||0), dur=o.dur||0.15;
    const osc=this.ctx.createOscillator(), g=this.ctx.createGain();
    osc.type=o.type||"sine"; osc.frequency.setValueAtTime(freq,t0);
    if(o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(o.slideTo,1),t0+dur);
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(o.gain||0.1, t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    osc.connect(g); g.connect(this.master);
    if(o.verb) g.connect(this.wet);
    osc.start(t0); osc.stop(t0+dur+0.05);
  },
  noise(o){
    if(!this.on||!this.ctx) return; o=o||{};
    const t0=this.now()+(o.when||0), dur=o.dur||0.15;
    const len=Math.max(1,this.ctx.sampleRate*dur), buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
    const src=this.ctx.createBufferSource(); src.buffer=buf;
    let node=src;
    if(o.lp){ const f=this.ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=o.lp; node.connect(f); node=f; }
    if(o.hp){ const f=this.ctx.createBiquadFilter(); f.type="highpass"; f.frequency.value=o.hp; node.connect(f); node=f; }
    const g=this.ctx.createGain(); g.gain.value=o.gain||0.08;
    node.connect(g); g.connect(this.master);
    if(o.verb) g.connect(this.wet);
    src.start(t0);
  },
  PENTA:[262,294,330,392,440,523,587,659,784,880,1047,1175],
  hover(col){ this.tone(300+col*36, {dur:.04, type:"triangle", gain:.018}); },
  whoosh(){ this.noise({dur:.22, gain:.05, lp:900}); },
  wind(){ // a soft, airy gust - filtered noise that swells and fades like a real breeze
    this.noise({dur:1.6, gain:.055, lp:700, hp:200, verb:true});
    this.noise({dur:1.3, gain:.035, lp:1100, hp:400, when:.25, verb:true});
    this.tone(520,{dur:1.2,type:"sine",gain:.02,slideTo:660,when:.1,verb:true}); // a gentle airy whistle
  },
  land(row){ const f = 120 + (ROWS-1-row)*22;
    this.tone(f,{dur:.13,type:"sine",gain:.22}); this.noise({dur:.05,gain:.1,hp:2000}); },
  riser(chain){ this.tone(180*chain,{dur:.32,type:"sawtooth",gain:.045,slideTo:180*chain*3,verb:true}); },
  collapse(n){ for(let i=0;i<Math.min(n,7);i++) this.noise({dur:.04,gain:.05,hp:900,when:i*0.045}); },
  chainBig(chain){
    [0,4,7,12].forEach((st,i)=>this.tone(262*Math.pow(2,(st+chain*2)/12),{dur:.35,type:"triangle",gain:.12,when:i*0.09,verb:true}));
    this.noise({dur:.5,gain:.06,lp:1200,verb:true}); },
  bomb(){ this.noise({dur:.09,gain:.09,hp:3000}); this.tone(55,{dur:.5,type:"sine",gain:.3,when:.05}); this.noise({dur:.4,gain:.16,lp:300,when:.05}); },
  gold(){ [1568,2093,2637].forEach((f,i)=>this.tone(f,{dur:.12,type:"square",gain:.04,when:i*0.06,verb:true})); },
  crack(shatter){ this.noise({dur:.08,gain:.12,hp:600});
    if(shatter){ this.noise({dur:.25,gain:.1,lp:900,when:.05}); this.tone(160,{dur:.2,type:"triangle",gain:.1,when:.03}); } },
  thaw(){ this.tone(1200,{dur:.18,type:"sine",gain:.07,slideTo:1800,verb:true}); this.noise({dur:.12,gain:.05,hp:3000}); },
  levelUp(){ [262,330,392,523,659,784].forEach((f,i)=>this.tone(f,{dur:.28,type:"triangle",gain:.13,when:i*0.09,verb:true})); this.noise({dur:.6,gain:.05,lp:1500,verb:true,when:.3}); },
  fail(){ [392,330,262,196].forEach((f,i)=>this.tone(f,{dur:.34,type:"triangle",gain:.12,when:i*0.17,verb:true})); },
  fanfare(){ // the jackpot: a bright rising fanfare with a shimmering crown chord
    [523,659,784,1047].forEach((f,i)=>this.tone(f,{dur:.22,type:"triangle",gain:.13,when:i*0.11,verb:true}));
    [1047,1319,1568].forEach((f,i)=>this.tone(f,{dur:.9,type:"sine",gain:.07,when:.5+i*0.04,verb:true}));
    this.tone(2093,{dur:1.1,type:"sine",gain:.04,when:.66,verb:true});
    this.noise({dur:.7,gain:.05,lp:2000,verb:true,when:.45});
  },
  earn(){ this.tone(1047,{dur:.1,type:"square",gain:.05,verb:true}); this.tone(1319,{dur:.16,type:"square",gain:.05,when:.08,verb:true}); },
  discover(){ [523,659,784,1047,1319,1568].forEach((f,i)=>this.tone(f,{dur:.4,type:"sine",gain:.09,when:i*0.09,verb:true}));
    this.tone(2093,{dur:.8,type:"sine",gain:.04,when:.55,verb:true}); },
  danger(){ this.tone(70,{dur:.18,type:"sine",gain:.14}); this.tone(70,{dur:.14,type:"sine",gain:.1,when:.25}); },
  reject(){ this.tone(140,{dur:.18,type:"sawtooth",gain:.09}); },
  startAmbient(){
    clearInterval(this.ambientTimer);
    this.ambientTimer = setInterval(()=>{
      if(!this.on||!this.ctx||!S||S.over||S.busy) return;
      if(Math.random()<0.5){
        const n=this.PENTA[Math.floor(Math.random()*6)];
        this.tone(n/2,{dur:1.4,type:"sine",gain:.012,verb:true});
      }
    }, 3600);
    this.startMusic();
  },
  // a slow, cozy lofi-ish chord bed - soft warm pads through the reverb, one chord every 4.4s
  CHORDS:[ [130.8,164.8,196.0], [146.8,174.6,220.0], [110.0,164.8,220.0], [123.5,146.8,196.0] ], // C · Dm-ish · Am · G, low & mellow
  // 🎭 the ceremony bed: same instrument, darker room - minor chords a register down,
  // no birdsong, and a soft heartbeat under it. Tense enough to feel the code
  // waiting to be cracked; never tense enough to stop being Hushwood.
  CEREMONY_CHORDS:[ [110.0,130.8,164.8], [87.3,130.8,164.8], [82.4,123.5,164.8], [110.0,130.8,155.6] ], // Am · F · Em · Am(b6)
  mode:"normal",
  _chord:0,
  startMusic(){
    clearInterval(this.musicTimer);
    const play=()=>{
      if(!this.on||!this.ctx) return;
      const cer=this.mode==="ceremony";
      const set=cer?this.CEREMONY_CHORDS:this.CHORDS;
      const ch=set[this._chord%set.length]; this._chord++;
      ch.forEach((f,i)=>{
        // soft triangle pad, slow attack, long release, gentle detune for warmth
        const c=this.ctx, t0=c.currentTime;
        const o=c.createOscillator(), g=c.createGain(), lp=c.createBiquadFilter();
        o.type="triangle"; o.frequency.value=f*(1+(Math.random()*0.006-0.003));
        lp.type="lowpass"; lp.frequency.value=cer?640:900;      // the dark keeps its lid on
        g.gain.setValueAtTime(0.0001,t0);
        g.gain.exponentialRampToValueAtTime(0.02,t0+0.9);      // slow swell
        g.gain.exponentialRampToValueAtTime(0.0001,t0+4.2);    // long fade
        o.connect(lp); lp.connect(g); g.connect(this.master); g.connect(this.wet);
        o.start(t0); o.stop(t0+4.4);
      });
      if(cer){
        // the heartbeat: a soft double thump, and once in a while one high lone note
        this.tone(58,{dur:.16,type:"sine",gain:.09,when:1.1});
        this.tone(55,{dur:.2,type:"sine",gain:.07,when:1.42});
        if(Math.random()<0.3) this.tone(this.PENTA[9+Math.floor(Math.random()*2)],{dur:.9,type:"sine",gain:.014,when:2.4+Math.random(),verb:true});
      } else {
        // a soft high sparkle note occasionally, like birdsong
        if(Math.random()<0.5) this.tone(this.PENTA[6+Math.floor(Math.random()*4)],{dur:.5,type:"sine",gain:.02,when:1+Math.random(),verb:true});
      }
    };
    play();
    this.musicTimer=setInterval(play, 4400);
  },
};
function buzz(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }

/* =================== SIGNS =================== */
