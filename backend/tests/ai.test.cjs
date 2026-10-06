const {test}=require('node:test');const assert=require('node:assert/strict');
const {processBriefingWithAI}=require('../dist/services/aiService');
const scenario=require('../research/corpus.json').cases[20];
async function withProvider(layout,revision,fn){
 const oldFetch=global.fetch,oldKey=process.env.GEMINI_API_KEY,oldModel=process.env.GEMINI_TEXT_MODEL;
 process.env.GEMINI_API_KEY='fixture';process.env.GEMINI_TEXT_MODEL='fixture';let count=0;
 global.fetch=async()=>{count++;const data=count===1?{briefing_estruturado:'Fictício',num_convidados:30,requisitos:[],pendencias:[]}:count===2?layout:revision;
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{totalTokenCount:10},modelVersion:'fixture'})};};
 try{await fn(()=>count);}finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;if(oldModel===undefined)delete process.env.GEMINI_TEXT_MODEL;else process.env.GEMINI_TEXT_MODEL=oldModel;}
}
test('revisão recusada preserva proposta inicial',async()=>{
 const bad=structuredClone(scenario.witness);bad.elementos[1].x=-1;
 await withProvider(scenario.witness,bad,async(count)=>{const out=await processBriefingWithAI(scenario.input.rawText,{...scenario.input.context,autoRepair:true});assert.equal(count(),3);assert.equal(out.structured.repair.accepted,false);assert.equal(out.structured.elementos[1].x,scenario.witness.elementos[1].x);});
});
test('revisão válida corrige conflito e registra a tentativa',async()=>{
 const bad=structuredClone(scenario.witness);bad.elementos[1].x=-1;
 await withProvider(bad,scenario.witness,async(count)=>{const out=await processBriefingWithAI(scenario.input.rawText,{...scenario.input.context,autoRepair:true});assert.equal(count(),3);assert.equal(out.structured.repair.accepted,true);assert.equal(out.structured.validation.passed,true);assert.ok(out.structured.repair.before.length);});
});
test('modo improve rejeita ids duplicados',async()=>{
 const bad=structuredClone(scenario.witness);bad.elementos[1].id=bad.elementos[0].id;
 await withProvider(bad,bad,async()=>{await assert.rejects(processBriefingWithAI(scenario.input.rawText,scenario.input.context),/AI_INVALID_IDS/);});
});
test('sem revisão opcional há somente duas chamadas',async()=>{
 await withProvider(scenario.witness,scenario.witness,async(count)=>{const out=await processBriefingWithAI(scenario.input.rawText,scenario.input.context);assert.equal(count(),2);assert.equal(out.structured.repair.attempted,false);});
});
