const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateLayout}=require('../dist/services/validationService');
const {layoutSchema,previewSchema}=require('../dist/services/inputSchemas');
const {previewPrompt,extractImage,generatePreview,PreviewProviderError}=require('../dist/services/previewService');
const entry={type:'entrada',label:'Entrada',x:200,y:480,w:70,h:20,rotation:0,layer:'chao',order:0};
const table={type:'mesa_retangular',label:'Mesa',x:100,y:100,w:100,h:50,rotation:0,layer:'mobiliario',order:1};
const input={canvasW:800,canvasH:500,elements:[entry,table],style:'classico',lighting:'dia',planImage:'data:image/png;base64,aGVsbG8='};
test('valid arrangement',()=>assert.equal(validateLayout(input.elements,800,500).passed,true));
test('empty is not a completed arrangement',()=>assert.equal(validateLayout([],800,500).passed,false));
test('reject invalid input before save',()=>assert.equal(layoutSchema.safeParse({...input,elements:[{...table,w:-1}]}).success,false));
test('invalid canvas',()=>assert.equal(validateLayout([entry],NaN,500).passed,false));
test('rotation can push a rectangle out of room',()=>assert.equal(validateLayout([entry,{...table,x:0,rotation:90}],800,500).passed,false));
test('rotated overlap is detected',()=>assert.equal(validateLayout([entry,table,{...table,x:150,y:75,rotation:90}],800,500).passed,false));
test('touching edges is not overlap',()=>assert.equal(validateLayout([entry,table,{...table,x:200}],800,500).passed,true));
test('furniture cannot obstruct the dance floor',()=>assert.equal(validateLayout([entry,table,{...table,type:'pista_danca',layer:'chao'}],800,500).passed,false));
test('entrance cannot be obstructed',()=>assert.equal(validateLayout([entry,{...table,x:200,y:470}],800,500).passed,false));
test('missing entrance fails',()=>assert.equal(validateLayout([table],800,500).passed,false));
test('ceiling may overlap furniture',()=>assert.equal(validateLayout([entry,table,{...table,type:'iluminacao',layer:'teto'}],800,500).passed,true));
test('reject arbitrary remote image URLs',()=>assert.equal(previewSchema.safeParse({...input,planImage:'https://example.org/test.png'}).success,false));
test('image prompt includes actual positions and rotation',()=>assert.ok(previewPrompt(input).includes('"rotation":0')));
test('extract REST generated image',()=>assert.deepEqual(extractImage({steps:[{type:'model_output',content:[{type:'image',data:'abc',mime_type:'image/png'}]}]}),{type:'image',data:'abc',mime_type:'image/png'}));
test('text response is not disguised as an image',()=>assert.equal(extractImage({steps:[{type:'model_output',content:[{type:'text',text:'Cannot generate'}]}]}),undefined));
test('provider contract sends reference PNG and requests landscape',async()=>{
 const original=global.fetch;
 global.fetch=async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.response_format.aspect_ratio,'16:9');assert.equal(body.input[1].mime_type,'image/png');assert.equal(body.store,false);return {ok:true,json:async()=>({steps:[{content:[{type:'image',mime_type:'image/png',data:'abc'}]}]})};};
 try{assert.equal((await generatePreview(input)).image,'data:image/png;base64,abc');}finally{global.fetch=original;}
});
test('image provider errors retain quota status for actionable handling',async()=>{
 const original=global.fetch,originalKey=process.env.GEMINI_API_KEY;
 process.env.GEMINI_API_KEY='test-key';
 global.fetch=async()=>({ok:false,status:429,json:async()=>({error:{status:'RESOURCE_EXHAUSTED',message:'Free Tier limit: 0'}})});
 try{await assert.rejects(generatePreview(input),error=>error instanceof PreviewProviderError&&error.status===429&&error.providerStatus==='RESOURCE_EXHAUSTED'&&/Free Tier/.test(error.message));}
 finally{global.fetch=original;if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey;}
});

test('non-finite rotation is rejected',()=>assert.equal(validateLayout([entry,{...table,rotation:NaN}],800,500).passed,false));
