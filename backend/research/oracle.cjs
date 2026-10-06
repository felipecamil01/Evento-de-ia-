'use strict';
// Independent evaluator: no production validator/schema imports. Axis-aligned corpus only.
function evaluate(scenario,record) {
  let obj=null; try {obj=JSON.parse(record.raw);} catch {}
  const expected=scenario.expected, context=scenario.input.context;
  const names=['contract','unique_ids','catalog','bounds','no_overlap',...Object.keys(expected.counts).map(t=>`count:${t}`),...expected.relations.map((_,i)=>`relation:${i}`),'preservation'];
  const bits=Object.fromEntries(names.map(n=>[n,false]));
  const es=obj?.elementos;
  const contract=!record.error && typeof obj?.layout_sugerido==='string' && Array.isArray(obj?.restricoes_csp) && obj.restricoes_csp.every(s=>typeof s==='string') &&
    Array.isArray(es)&&es.length>0&&es.length<=300 && es.every(e=>e && typeof e==='object' &&
      typeof e.id==='string'&&e.id.trim().length>0&&e.id.length<=100 && typeof e.label==='string'&&e.label.length>0&&e.label.length<=120 &&
      Object.hasOwn(expected.catalog,e.type) && ['chao','mobiliario','teto'].includes(e.layer) &&
      ['x','y','w','h','rotation','order'].every(k=>Number.isFinite(e[k])) && e.w>0&&e.h>0&&e.w<=4000&&e.h<=4000&&e.rotation===0&&Number.isInteger(e.order)&&e.order>=0);
  if(contract) {
    bits.contract=true;
    bits.unique_ids=new Set(es.map(e=>e.id)).size===es.length;
    bits.catalog=es.every(e=>{const [w,h,l]=expected.catalog[e.type];return e.w===w&&e.h===h&&e.layer===l;});
    bits.bounds=es.every(e=>e.x>=0&&e.y>=0&&e.x+e.w<=context.canvasW&&e.y+e.h<=context.canvasH);
    bits.no_overlap=true;
    for(let i=0;i<es.length;i++) for(let j=0;j<i;j++) {
      const a=es[i],b=es[j];
      const intersects=Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)+1e-6 && Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y)+1e-6;
      const incompatible=a.layer===b.layer || (a.type==='pista_danca'&&b.layer==='mobiliario') || (b.type==='pista_danca'&&a.layer==='mobiliario') || (a.type==='entrada'&&b.layer!=='teto') || (b.type==='entrada'&&a.layer!=='teto');
      if(intersects&&incompatible) bits.no_overlap=false;
    }
    for(const [type,count] of Object.entries(expected.counts)) bits[`count:${type}`]=es.filter(e=>e.type===type).length===count;
    expected.relations.forEach((r,i)=>{
      const a=es.filter(e=>e.type===r.a),b=es.filter(e=>e.type===r.b);
      if(a.length===1&&b.length===1) {const center=e=>r.axis==='x'?e.x+e.w/2:e.y+e.h/2; bits[`relation:${i}`]=r.direction==='less'?center(a[0])<center(b[0]):center(a[0])>center(b[0]);}
    });
    bits.preservation=context.elements.every(old=>es.filter(e=>e.id===old.id&&e.type===old.type).length===1);
  }
  const violations=Object.values(bits).filter(b=>!b).length;
  return {success:violations===0?1:0,loss:violations/names.length,violations,total:names.length,bits};
}
module.exports={evaluate};
