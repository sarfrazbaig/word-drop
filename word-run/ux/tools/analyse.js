const rows=require(require("path").join(__dirname,"contrast.json"));
const N=["First Clearing","Bramblewood","Mosswood","Spore Hollow","Listening Pond","Reedmarsh","Running River","Thunderfalls","Undercave","Deep Dark","Glimmer Seams","Scree Slopes","Windward Ridge","Snowline","Frozen Crown"];
/* sRGB -> CIE Lab -> deltaE76. Crude next to CIEDE2000 but plenty to separate "different
   colour" from "same colour", which is the only question being asked. */
const lab=([r,g,b])=>{ const f=v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
  const R=f(r),G=f(g),B=f(b);
  let X=(R*0.4124+G*0.3576+B*0.1805)/0.95047, Y=R*0.2126+G*0.7152+B*0.0722, Z=(R*0.0193+G*0.1192+B*0.9505)/1.08883;
  const k=t=>t>0.008856?Math.cbrt(t):(7.787*t+16/116);
  X=k(X);Y=k(Y);Z=k(Z);
  return [116*Y-16, 500*(X-Y), 200*(Y-Z)]; };
const dE=(a,b)=>{const A=lab(a),B=lab(b);return Math.sqrt((A[0]-B[0])**2+(A[1]-B[1])**2+(A[2]-B[2])**2)};
const obs=rows.filter(r=>r.kind!=="(letter tile)");
const byKind={}; obs.forEach(r=>(byKind[r.kind]=byKind[r.kind]||[]).push(r));
const s=[];
for(const k in byKind){ const g=byKind[k];
  const cb=g.map(r=>r.vsBoard), db=g.map(r=>dE(r.rgb.ob,r.rgb.bg)), dl=g.map(r=>r.rgb.le?dE(r.rgb.ob,r.rgb.le):null).filter(x=>x!=null);
  const m=a=>a.reduce((x,y)=>x+y,0)/a.length;
  s.push({k, cb:+m(cb).toFixed(2), fails:cb.filter(x=>x<3).length,
    db:+m(db).toFixed(1), dbLo:+Math.min(...db).toFixed(1), dbBad:db.filter(x=>x<12).length,
    dl:+m(dl).toFixed(1), dlLo:+Math.min(...dl).toFixed(1)});
}
s.sort((a,b)=>a.db-b.db);
console.log("                 vs PAINTING                  vs LETTER TILE");
console.log("OBSTACLE      contrast fails   deltaE  worst  invisible |  deltaE  worst");
s.forEach(x=>console.log(x.k.padEnd(13)+String(x.cb).padStart(6)+String(x.fails+"/15").padStart(7)
  +String(x.db).padStart(9)+String(x.dbLo).padStart(7)+String(x.dbBad+"/15").padStart(10)
  +" |"+String(x.dl).padStart(8)+String(x.dlLo).padStart(7)));
console.log("\ndeltaE guide: under 12 = hard to tell apart at a glance, under 5 = effectively the same colour");
const byB={}; obs.forEach(r=>(byB[r.biome]=byB[r.biome]||[]).push(dE(r.rgb.ob,r.rgb.bg)));
const bs=Object.entries(byB).map(([b,v])=>({b:+b,m:+(v.reduce((a,c)=>a+c,0)/v.length).toFixed(1),bad:v.filter(x=>x<12).length}));
bs.sort((a,b)=>a.m-b.m);
console.log("\nCOUNTRIES, worst first (mean deltaE of obstacle vs its painting)");
bs.forEach(x=>console.log("  "+N[x.b].padEnd(17)+String(x.m).padStart(6)+"   "+x.bad+"/17 hard to see"));
