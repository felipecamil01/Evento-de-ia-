export interface LayoutElement {
  type: string; label: string; x: number; y: number; w: number; h: number; layer: string; rotation?: number;
}
type Point = {x: number; y: number};
// Konva rotates around the top-left origin. Use the same convention.
function corners(e: LayoutElement): Point[] {
  const r = (e.rotation ?? 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [[0,0],[e.w,0],[e.w,e.h],[0,e.h]].map(([x,y]) => ({x:e.x+x*c-y*s,y:e.y+x*s+y*c}));
}
function overlap(a: Point[], b: Point[]) {
  for (const p of [a,b]) for (let i=0;i<4;i++) {
    const next=p[(i+1)%4], axis={x:-(next.y-p[i].y),y:next.x-p[i].x};
    const pa=a.map(v=>v.x*axis.x+v.y*axis.y), pb=b.map(v=>v.x*axis.x+v.y*axis.y);
    if (Math.max(...pa)<=Math.min(...pb)+1e-6 || Math.max(...pb)<=Math.min(...pa)+1e-6) return false;
  }
  return true;
}
export function validateLayout(elements: LayoutElement[], CW: number, CH: number) {
  const issues: string[]=[];
  if (!Number.isFinite(CW) || !Number.isFinite(CH) || CW<=0 || CH<=0) return {passed:false,issues:['Dimensões inválidas.']};
  if (!elements.length) return {passed:false,issues:['Adicione elementos antes de validar.']};
  if (elements.some(e=>![e.x,e.y,e.w,e.h,e.rotation??0].every(Number.isFinite)||e.w<=0||e.h<=0))
    return {passed:false,issues:['Há elementos com dimensões ou posições inválidas.']};
  const polys=elements.map(corners);
  elements.forEach((e,i)=>{
    if(polys[i].some(p=>p.x<0||p.y<0||p.x>CW||p.y>CH)) issues.push(`"${e.label}" está fora do salão.`);
    for(let j=0;j<i;j++) {
      const b=elements[j];
      const floorObstacle = (e.type==='pista_danca' && b.layer==='mobiliario') || (b.type==='pista_danca' && e.layer==='mobiliario');
      const entranceObstacle = (e.type==='entrada' && b.layer!=='teto') || (b.type==='entrada' && e.layer!=='teto');
      if((e.layer===b.layer || floorObstacle || entranceObstacle) && overlap(polys[i],polys[j]))
        issues.push(`"${e.label}" sobrepõe "${b.label}".`);
    }
  });
  if(!elements.some(e=>e.type==='entrada')) issues.push('Indique a entrada do salão.');
  return {passed:issues.length===0,issues};
}
