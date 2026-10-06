'use strict';
const fs=require('node:fs');
const {CATALOG}=require('./pipeline.cjs');
const corpus=[];
for(let i=0;i<30;i++) {
  const stratum=Math.floor(i/10), k=i%10;
  const id=`S${String(i+1).padStart(2,'0')}`, W=1400+(k%3)*100,H=1100+(k%2)*100;
  const elements=[];
  function add(type,x,y) {const [w,h,layer]=CATALOG[type]; const e={id:`${id}-${elements.length+1}`,type,label:`${type} ${elements.length+1}`,x,y,w,h,layer,rotation:0,order:elements.length}; elements.push(e);}
  add('entrada',W/2,H-18); add('pista_danca',800,320); add('buffet',1050,770);
  const tableType=k%2?'mesa_retangular':'mesa_redonda';
  for(let j=0;j<3+k;j++) add(tableType,60+(j%3)*170,100+Math.floor(j/3)*160);
  if(stratum>=1) {add('bar',1120,100);add('dj',760,100);add('banheiro',1200,930);}
  if(stratum===2) {add('palco',650,770);add('iluminacao',500,40);add('decoracao',400,40);}
  // Distinct left/right relations; witness mirrored along the x axis in odd cases.
  if(k%2) for(const e of elements) e.x=W-e.x-e.w;
  const expectedCounts=Object.fromEntries(Object.keys(CATALOG).map(t=>[t,elements.filter(e=>e.type===t).length]));
  const relations=stratum ? [
    {a:'dj',b:'bar',axis:'x',direction:k%2?'greater':'less'},
    {a:'bar',b:'buffet',axis:'y',direction:'less'},
    {a:'pista_danca',b:'buffet',axis:'y',direction:'less'}
  ]:[];
  const countsText=Object.entries(expectedCounts).filter(([,n])=>n).map(([t,n])=>`${n} ${t}`).join(', ');
  const relationText=relations.map(r=>`${r.a} deve ficar ${r.axis==='x'?(r.direction==='less'?'à esquerda de':'à direita de'):'acima de'} ${r.b}, comparando os centros`).join('; ');
  const guestCount=30+Math.round(k*120/9);
  const context={canvasW:W,canvasH:H,guestCount,mode:stratum===2?'improve':'new',elements:stratum===2?elements.map(e=>({...e})):[]};
  const rawText=`Recepção fictícia de casamento para ${guestCount} convidados, em canvas ${W} por ${H} pixels. Inclua exatamente ${countsText}. Não inclua outros objetos. Use as dimensões do catálogo e rotação zero. Evite sobreposições e respeite os limites. ${relationText}. ${stratum===2?'Retorne todos os objetos existentes preservando seus ids e tipos.':''} Não é necessário representar assentos individuais; não deduza lotação pela contagem de mesas.`;
  corpus.push({id,stratum:['quantidades','relacoes','preservacao'][stratum],input:{rawText,context},
    expected:{counts:expectedCounts,catalog:CATALOG,relations},witness:{layout_sugerido:'Testemunha de viabilidade, não fornecida ao modelo.',restricoes_csp:[],elementos:elements}});
}
fs.writeFileSync(`${__dirname}/corpus.json`,JSON.stringify({version:'synthetic-30-v1',synthetic:true,cases:corpus},null,2)+'\n');
