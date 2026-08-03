/* ═══════════════════════════════════════════════════════════════════════════════════════
   @module  slate  -  the country dresses the chrome

   The warm build measures each painting and derives PANE INK from it, because glass sitting
   over fifteen different artworks cannot use one colour. Slate's panels are opaque, so they
   do not need that - but they can still use it, and without it every country wears the First
   Clearing's navy.

   Two rules earn their place here, both learned the hard way in the prototype:

   THE SKY, NOT THE WHOLE PAINTING. Averaging the entire image drags the ground in, and the
   ground is grass - the First Clearing came out olive when the comp it is copied from is
   navy. The comp took its colour from the sky the board hangs against, which is what a
   player reads as "the weather here". Top third only. Measured after the change: the First
   Clearing lands on hsl(207 42% 27%) against the comp's own hsl(216 41% 27%).

   HUE IS TAKEN, LIGHTNESS IS SOLVED. A tinted letter is the cheapest way to make the board
   belong to the place and the easiest way to quietly lose the game for someone reading it in
   sunlight. So the ink's lightness is darkened until its measured contrast on the tile face
   clears 7:1 - the ratio the untinted slate ink already held. Yellow-greens need five points
   more darkness than violets to reach the same legibility, which no fixed number would have
   given us. Across all fifteen countries the worst case is 7.01.

   Nothing here runs unless the skin is on.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
const Slate = {
  cache:{},

  on(){ const a=$("app"); return !!(a && a.classList.contains("skin-slate")); },

  /* the sky of a country, averaged once and remembered */
  sky(bio){
    return new Promise(res=>{
      if(this.cache[bio]) return res(this.cache[bio]);
      const im=new Image();
      im.onload=()=>{
        try{
          const c=document.createElement("canvas"); c.width=48; c.height=48;
          const g=c.getContext("2d"); g.drawImage(im,0,0,48,48);
          const d=g.getImageData(0,0,48,16).data;      // the top third
          let r=0,gr=0,b=0,n=0;
          for(let i=0;i<d.length;i+=4){ r+=d[i]; gr+=d[i+1]; b+=d[i+2]; n++; }
          this.cache[bio]=[r/n, gr/n, b/n];
          res(this.cache[bio]);
        }catch(e){ res(null); }
      };
      im.onerror=()=>res(null);
      im.src="art/bg/bio"+bio+".jpg";
    });
  },

  hsl(r,g,b){
    r/=255; g/=255; b/=255;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
    let h=0, s=0;
    if(mx!==mn){ const d=mx-mn; s = l>.5 ? d/(2-mx-mn) : d/(mx+mn);
      h = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4; h/=6; }
    return [h*360, s, l];
  },
  toRGB(h,s,l){
    const a=s*Math.min(l,1-l);
    const f=n=>{ const k=(n+h/30)%12; return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))); };
    return [f(0),f(8),f(4)];
  },
  lum(c){ const f=v=>{ v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); };
    return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]); },
  ratio(a,b){ const L=this.lum(a), M=this.lum(b);
    return (Math.max(L,M)+.05)/(Math.min(L,M)+.05); },

  async dress(level){
    if(!this.on()) return;
    const bio = typeof biomeOf==="function" ? biomeOf(level!=null?level:(P&&P.level)||1) : 0;
    const mean = await this.sky(bio);
    if(!mean || !this.on()) return;
    const app=$("app"); if(!app) return;
    const [h, sat] = this.hsl(mean[0], mean[1], mean[2]);
    const S1 = Math.min(.42, Math.max(.16, sat));
    const set=(k,l,s2)=>app.style.setProperty(k,
      "hsl("+h.toFixed(0)+" "+(((s2==null?S1:s2))*100).toFixed(0)+"% "+l+"%)");
    set("--sl-pane",27); set("--sl-pane2",37); set("--sl-line",42);
    set("--sl-slot",48); set("--sl-page",92,.30);
    set("--sl-dock",78,.22); set("--sl-dockink",32,.30); set("--sl-edge",82,.20);

    /* the letter takes the country's hue, never its legibility */
    const face=[253,251,247];
    let l=.34, ink=this.toRGB(h,.30,l), guard=0;
    while(this.ratio(face,ink) < 7 && guard++ < 40){ l-=.01; ink=this.toRGB(h,.30,l); }
    app.style.setProperty("--sl-ink","hsl("+h.toFixed(0)+" 30% "+(l*100).toFixed(0)+"%)");
    this.last={ bio, h:Math.round(h), ink:+this.ratio(face,ink).toFixed(2) };
  },

  /* dressing has to follow the country, and applyBiome is the one place that changes it */
  hook(){
    if(this._hooked || typeof applyBiome!=="function") return;
    this._hooked=true;
    const real=applyBiome;
    window.applyBiome=function(L){ const r=real.apply(this,arguments);
      try{ Slate.dress(L); }catch(e){} return r; };
  },
};
Slate.hook();
