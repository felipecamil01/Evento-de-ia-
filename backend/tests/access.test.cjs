const {test}=require('node:test');const assert=require('node:assert/strict');
let found=null,query;
const fake={layout:{findFirst:async q=>(query=q,found)},event:{findFirst:async q=>(query=q,found)}};
require.cache[require.resolve('@prisma/client')]={exports:{PrismaClient:class{constructor(){return fake}}}};
const {layoutOwner}=require('../dist/middlewares/layoutOwner');
const {createPreview}=require('../dist/controllers/previewController');
function response(){return {code:200,body:null,status(c){this.code=c;return this},json(b){this.body=b;return this}}}
const previewBody={canvasW:800,canvasH:500,elements:[{type:'entrada',label:'Entrada',x:400,y:470,w:70,h:20,layer:'chao'},{type:'mesa_retangular',label:'Mesa',x:100,y:100,w:100,h:50,layer:'mobiliario'}],planImage:'data:image/png;base64,aGVsbG8=',style:'classico',lighting:'dia'};
test('layout lookup is scoped to authenticated owner',async()=>{found={id:'l'};let next=false;const res=response();await layoutOwner({params:{id:'l'},user:{userId:'owner'}},res,()=>next=true);assert.equal(query.where.event.userId,'owner');assert.ok(next)});
test('unowned layout is rejected before controller',async()=>{found=null;let next=false;const res=response();await layoutOwner({params:{id:'other'},user:{userId:'owner'}},res,()=>next=true);assert.equal(res.code,404);assert.equal(next,false)});
test('new layout checks event owner',async()=>{found=null;const res=response();await layoutOwner({params:{},body:{eventId:'other'},user:{userId:'owner'}},res,()=>assert.fail('should not reach controller'));assert.deepEqual(query.where,{id:'other',userId:'owner'});assert.equal(res.code,404)});
test('preview rejects malformed request before network',async()=>{const res=response();await createPreview({body:{},user:{userId:'owner'}},res);assert.equal(res.code,400)});
test('valid preview without credentials is explicit 503',async()=>{const key=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;const res=response();try{await createPreview({user:{userId:'owner'},body:{canvasW:800,canvasH:500,elements:[{type:'entrada',label:'Entrada',x:400,y:470,w:70,h:20,layer:'chao'}],planImage:'data:image/png;base64,aGVsbG8=',style:'classico',lighting:'dia'}},res);assert.equal(res.code,503)}finally{if(key)process.env.GEMINI_API_KEY=key}});
test('image quota errors explain the free-tier limit and do not lock retries',async()=>{
 const original=global.fetch,key=process.env.GEMINI_API_KEY;
 process.env.GEMINI_API_KEY='test-key';
 let calls=0;
 global.fetch=async()=>{calls+=1;return {ok:false,status:429,json:async()=>({error:{status:'RESOURCE_EXHAUSTED',message:'Free Tier limit: 0 requests per day'}})}};
 try {
  const first=response();await createPreview({user:{userId:'quota-user'},body:previewBody},first);
  assert.equal(first.code,429);assert.match(first.body.error,/limite atual: 0/);
  const second=response();await createPreview({user:{userId:'quota-user'},body:previewBody},second);
  assert.equal(second.code,429);assert.equal(calls,2);
 } finally {global.fetch=original;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;}
});
