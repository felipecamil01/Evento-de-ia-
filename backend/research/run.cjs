'use strict';
require('dotenv').config();
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const pipeline=require('./pipeline.cjs'),{evaluate}=require('./oracle.cjs');
const corpus=require('./corpus.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function rng(seed){let n=seed>>>0;return ()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
async function main(){
 const args=process.argv.slice(2);
 if(!args.includes('--live')) throw new Error('Use --live para chamadas reais. Para verificação offline use npm run research:verify.');
 const value=(name,def)=>args.includes(name)?args[args.indexOf(name)+1]:def;
 const repetitions=Number(value('--repetitions','3'));
 if(!Number.isInteger(repetitions)||repetitions<1||repetitions>10) throw new Error('Repetições devem ser de 1 a 10. O protocolo principal fixa 3.');
 const model=process.env.GEMINI_TEXT_MODEL;
 const call=pipeline.createProvider({key:process.env.GEMINI_API_KEY,model});
 const output=path.resolve(value('--out',path.join(__dirname,'runs',new Date().toISOString().replace(/[:.]/g,'-'))));
 if(fs.existsSync(output)) throw new Error('Pasta já existe. Preserve o registro anterior e use uma nova pasta.');
 fs.mkdirSync(output,{recursive:true});
 const files=['pipeline.cjs','oracle.cjs','corpus.json','run.cjs','analyze.cjs','../src/services/validationService.ts','../src/services/inputSchemas.ts'];
 let commit='unavailable';try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
 const manifest={protocol:pipeline.VERSION,kind:'live-llm',startedAt:new Date().toISOString(),model,temperature:0.2,maxOutputTokens:8192,timeoutMs:60000,
   cases:30,repetitions,seed:20261006,commit,node:process.version,hashes:Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(path.join(__dirname,f)))])),
   corpusHash:sha(fs.readFileSync(path.join(__dirname,'corpus.json'))),maxCalls:30*repetitions*5,status:'running'};
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
 const random=rng(manifest.seed), jobs=[];
 for(const scenario of corpus.cases) for(let repetition=1;repetition<=repetitions;repetition++) jobs.push({scenario,repetition});
 for(let i=jobs.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[jobs[i],jobs[j]]=[jobs[j],jobs[i]];}
 const log=path.join(output,'records.jsonl');
 function save(scenario,repetition,condition,result){
   const row={caseId:scenario.id,stratum:scenario.stratum,repetition,condition,...result,score:evaluate(scenario,result)};
   fs.appendFileSync(log,JSON.stringify(row)+'\n');
   console.log(`${scenario.id} repetição ${repetition} condição ${condition}: sucesso=${row.score.success}; erro=${result.error||'nenhum'}`);
 }
 for(const {scenario,repetition} of jobs){
   let initial;
   for(const condition of (random()<0.5?['A','B']:['B','A'])){
     const result=await pipeline.generate(condition,scenario.input,call);save(scenario,repetition,condition,result);if(condition==='B')initial=result;
   }
   const diagnostics=pipeline.diagnose(initial.raw,scenario.input.context);
   for(const condition of (random()<0.5?['C','D']:['D','C'])){
     const result=await pipeline.revise(condition,scenario.input,initial,diagnostics,call);save(scenario,repetition,condition,result);
   }
 }
 manifest.status='complete';manifest.finishedAt=new Date().toISOString();
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(`Concluído. Analise com: node research/analyze.cjs ${JSON.stringify(output)}`);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={rng};
