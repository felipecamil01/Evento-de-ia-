'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {evaluate}=require('./oracle.cjs');const corpus=require('./corpus.json');
const {rng}=require('./run.cjs');
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
function bootstrap(rows,key,seed=20261006){
 const random=rng(seed), groups=['quantidades','relacoes','preservacao'].map(g=>rows.filter(r=>r.stratum===g));const estimates=[];
 for(let i=0;i<10000;i++){const sample=groups.flatMap(g=>g.map(()=>g[Math.floor(random()*g.length)][key]));estimates.push(mean(sample));}
 estimates.sort((a,b)=>a-b);
 return {effect:mean(rows.map(r=>r[key])),ci975:[estimates[125],estimates[9874]],method:'paired stratified percentile bootstrap, 10000 resamples',
   practicalThreshold:0.10,zeroObservedVariance:new Set(rows.map(r=>r[key])).size===1};
}
function analyze(dir){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 if(manifest.kind!=='live-llm'||manifest.status!=='complete')throw new Error('Somente execuções reais e completas podem ser analisadas.');
 if(manifest.repetitions!==3)throw new Error('O protocolo principal exige 3 repetições. Registre outro protocolo antes de alterar a análise.');
 for(const f of ['pipeline.cjs','oracle.cjs','corpus.json','run.cjs','analyze.cjs','../src/services/validationService.ts','../src/services/inputSchemas.ts']) {
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,f))).digest('hex');
  if(hash!==manifest.hashes[f])throw new Error(`Versão incompatível: ${f}. Analise com o código arquivado na coleta.`);
 }
 const records=fs.readFileSync(path.join(dir,'records.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 if(records.length!==360)throw new Error('Esperadas 360 respostas finais: 30 casos × 3 repetições × 4 condições.');
 const map=new Map();
 for(const r of records){const k=`${r.caseId}/${r.repetition}/${r.condition}`;if(map.has(k))throw new Error('Registro duplicado');map.set(k,r);}
 const rows=[];
 for(const s of corpus.cases){const measures=[];
  for(let r=1;r<=3;r++){
   const rec=Object.fromEntries(['A','B','C','D'].map(c=>{const row=map.get(`${s.id}/${r}/${c}`);if(!row)throw new Error('Par ausente');return [c,row];}));
   const score=Object.fromEntries(Object.entries(rec).map(([c,row])=>[c,evaluate(s,row)]));
   const regression=c=>Object.keys(score.B.bits).filter(k=>score.B.bits[k]&&!score[c].bits[k]).length;
   measures.push({h1:score.B.success-score.A.success,h2:score.C.loss-score.D.loss,
     successA:score.A.success,successB:score.B.success,lossC:score.C.loss,lossD:score.D.loss,introducedC:regression('C'),introducedD:regression('D')});
  }
  rows.push({caseId:s.id,stratum:s.stratum,...Object.fromEntries(Object.keys(measures[0]).map(k=>[k,mean(measures.map(m=>m[k]))]))});
 }
 const costs=Object.fromEntries(['A','B','C','D'].map(c=>{
  const rs=records.filter(r=>r.condition===c); const stages=rs.flatMap(r=>r.stages);
  return [c,{responses:rs.length,failed:rs.filter(r=>r.error).length,calls:stages.length,
    meanDurationMs:mean(rs.map(r=>r.stages.reduce((n,s)=>n+s.durationMs,0))),
    totalTokens:stages.reduce((n,s)=>n+(s.usage?.totalTokenCount||0),0),usageMissing:stages.filter(s=>!s.usage).length,
    modelVersions:[...new Set(stages.map(s=>s.modelVersion).filter(Boolean))]}];
 }));
 const summary={kind:'live-llm',cases:30,repetitions:3,rows,h1:bootstrap(rows,'h1'),h2:bootstrap(rows,'h2',20261007),costs,
   scope:'Exploratory synthetic benchmark. Repetitions are clustered by scenario. Intervals are approximate; no guarantee of population representativeness or stability at n=30.'};
 fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));
 const keys=Object.keys(rows[0]);fs.writeFileSync(path.join(dir,'scenario-means.csv'),[keys.join(','),...rows.map(r=>keys.map(k=>r[k]).join(','))].join('\n')+'\n');
 return summary;
}
if(require.main===module){try{const result=analyze(path.resolve(process.argv[2]||''));console.log(JSON.stringify({h1:result.h1,h2:result.h2,costs:result.costs},null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={bootstrap,analyze};
