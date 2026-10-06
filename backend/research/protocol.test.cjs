'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const corpus=require('./corpus.json').cases;
const {evaluate}=require('./oracle.cjs');
const {generate,revise,revisionRequest,diagnose,publicInput,createProvider}=require('./pipeline.cjs');
// These 60 checks test software/protocol using fixtures, NOT scientific hypotheses about an LLM.
for(const s of corpus) {
  test(`H1 protocolo ${s.id}: testemunha viável e erro de quantidade`,()=>{
    const good={raw:JSON.stringify(s.witness)}; assert.equal(evaluate(s,good).success,1);assert.deepEqual(diagnose(good.raw,s.input.context),[]);
    const bad=structuredClone(s.witness);bad.elementos=bad.elementos.filter(e=>e.type!=='buffet');
    const score=evaluate(s,{raw:JSON.stringify(bad)});assert.equal(score.success,0);assert.equal(score.bits['count:buffet'],false);
    assert.equal(evaluate(s,{raw:'invalid'}).loss,1);
  });
  test(`H2 protocolo ${s.id}: mesmo ponto de partida e isolamento do diagnóstico`,async()=>{
    const bad=structuredClone(s.witness);bad.elementos[1].x=-1;
    const initial={raw:JSON.stringify({...bad,validation:{issues:['SEGREDO']},expected:s.expected})};
    const diagnostics=diagnose(initial.raw,s.input.context);assert.ok(diagnostics.length);
    const c=revisionRequest('C',s.input,initial,diagnostics),d=revisionRequest('D',s.input,initial,diagnostics);
    assert.equal(c.instruction,d.instruction);assert.deepEqual(c.data.previous,d.data.previous);
    assert.ok(!JSON.stringify(c).includes('SEGREDO'));assert.ok(!Object.hasOwn(c.data,'diagnostics'));assert.deepEqual(d.data.diagnostics,diagnostics);
    assert.deepEqual({...d.data,diagnostics:undefined},{...c.data,diagnostics:undefined});
    const original=JSON.stringify(initial);let calls=0;
    const mock=async()=>{calls++;return {raw:JSON.stringify(s.witness),error:null}};
    await revise('C',s.input,initial,diagnostics,mock);await revise('D',s.input,initial,diagnostics,mock);
    assert.equal(calls,2);assert.equal(JSON.stringify(initial),original);
    assert.ok(evaluate(s,initial).loss>evaluate(s,{raw:JSON.stringify(s.witness)}).loss);
  });
}
test('corpus: 30 ids únicos, dez casos por estrato e nenhuma resposta no prompt',()=>{
 assert.equal(new Set(corpus.map(s=>s.id)).size,30);
 for(const stratum of ['quantidades','relacoes','preservacao']) assert.equal(corpus.filter(s=>s.stratum===stratum).length,10);
 for(const s of corpus) assert.deepEqual(Object.keys(publicInput(s.input)).sort(),['context','rawText']);
});
test('A usa uma chamada; B usa duas e não expõe gabarito',async()=>{
 const roles=[]; const mock=async(role,instruction,data)=>{roles.push(role); assert.ok(!Object.hasOwn(data,'expected'));return {raw:role==='briefing'?JSON.stringify({briefing_estruturado:'s',requisitos:[],pendencias:[]}):JSON.stringify(corpus[0].witness)}};
 await generate('A',corpus[0].input,mock);assert.deepEqual(roles,['layout']);roles.length=0;
 await generate('B',corpus[0].input,mock);assert.deepEqual(roles,['briefing','layout']);
});
test('falha de extração não vira sucesso e não provoca retentativas',async()=>{
 let calls=0; const out=await generate('B',corpus[0].input,async()=>{calls++;return {raw:'',error:'HTTP_429'}});
 assert.equal(calls,1);assert.equal(evaluate(corpus[0],out).loss,1);
});
test('oracle rejeita ids repetidos, colisão, perda de identidade e dimensões erradas',()=>{
 const s=corpus[20];
 for(const mutate of [e=>{e[1].id=e[0].id},e=>{e[2].x=e[3].x;e[2].y=e[3].y},e=>{e[1].id='new-id'},e=>{e[1].w=1}]) {
  const bad=structuredClone(s.witness);mutate(bad.elementos);assert.equal(evaluate(s,{raw:JSON.stringify(bad)}).success,0);
 }
});
test('provider: timeout/erro sem repetição e limite igual em C/D',async()=>{
 const old=global.fetch;let count=0;
 global.fetch=async(url,request)=>{count++;const body=JSON.parse(request.body);assert.equal(body.generationConfig.maxOutputTokens,8192);assert.equal(body.generationConfig.temperature,0.2);return {ok:false,status:429}};
 try {const result=await createProvider({key:'fixture',model:'fixture'})('revision','s',{});assert.equal(result.error,'HTTP_429');assert.equal(count,1);}finally{global.fetch=old;}
});
test('bootstrap mantém sinal e unidade do efeito pareado',()=>{
 const {bootstrap}=require('./analyze.cjs');
 const rows=corpus.map(s=>({stratum:s.stratum,h1:0.25}));
 const b=bootstrap(rows,'h1');assert.equal(b.effect,0.25);assert.deepEqual(b.ci975,[0.25,0.25]);assert.equal(b.zeroObservedVariance,true);
});
test('analisador recusa simulação e confere agregação de 360 fixtures controladas',()=>{
 const fs=require('node:fs'),path=require('node:path');const dir=fs.mkdtempSync(path.join(__dirname,'fixture-'));
 try{
  const {analyze}=require('./analyze.cjs');
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({kind:'simulated',status:'complete'}));assert.throws(()=>analyze(dir),/Somente execuções reais/);
  // Isolated unit fixture for parser/aggregation. Never persisted as research evidence.
  const crypto=require('node:crypto');
  const names=['pipeline.cjs','oracle.cjs','corpus.json','run.cjs','analyze.cjs','../src/services/validationService.ts','../src/services/inputSchemas.ts'];
  const hashes=Object.fromEntries(names.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,f))).digest('hex')]));
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({kind:'live-llm',status:'complete',repetitions:3,hashes,fixtureOnly:true}));
  const records=[];
  for(const s of corpus)for(let r=1;r<=3;r++)for(const c of ['A','B','C','D'])records.push({caseId:s.id,repetition:r,condition:c,
    raw:['B','D'].includes(c)?JSON.stringify(s.witness):'invalid',stages:[{durationMs:10,usage:{totalTokenCount:2},modelVersion:'fixture'}]});
  fs.writeFileSync(path.join(dir,'records.jsonl'),records.map(r=>JSON.stringify(r)).join('\n')+'\n');
  const result=analyze(dir);assert.equal(result.rows.length,30);assert.equal(result.h1.effect,1);assert.equal(result.h2.effect,1);
  assert.equal(result.costs.A.responses,90);assert.equal(result.costs.D.totalTokens,180);
  fs.appendFileSync(path.join(dir,'records.jsonl'),JSON.stringify(records[0])+'\n');assert.throws(()=>analyze(dir),/360/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
