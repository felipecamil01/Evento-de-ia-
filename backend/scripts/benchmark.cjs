// Offline regression corpus: no API, participants or personal data.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {validateLayout}=require('../dist/services/validationService');
const corpus=fs.readFileSync(path.join(__dirname,'../benchmarks/cases.json'));
const cases=JSON.parse(corpus);
const source=fs.readFileSync(path.join(__dirname,'../src/services/validationService.ts'));
const results=cases.map(c=>{
 const begin=performance.now();
 const observed=validateLayout(c.elements,c.canvasW,c.canvasH);
 return {id:c.id,description:c.description,expectedValid:c.expectedValid,observedValid:observed.passed,correct:observed.passed===c.expectedValid,durationMs:performance.now()-begin,issues:observed.issues};
});
const report={mode:'offline-regression-not-ai-evaluation',createdAt:new Date().toISOString(),node:process.version,platform:process.platform,corpusSha256:crypto.createHash('sha256').update(corpus).digest('hex'),validatorSha256:crypto.createHash('sha256').update(source).digest('hex'),total:results.length,correct:results.filter(r=>r.correct).length,results};
const out=path.join(__dirname,'../reports',report.createdAt.replace(/[:.]/g,'-'));
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'benchmark.json'),JSON.stringify(report,null,2));
const columns=['id','description','expectedValid','observedValid','correct','durationMs'];
fs.writeFileSync(path.join(out,'benchmark.csv'),columns.join(',')+'\n'+results.map(r=>columns.map(k=>'"'+String(r[k]).replaceAll('"','""')+'"').join(',')).join('\n')+'\n');
console.log(`${report.correct}/${report.total} casos concordam com o resultado esperado. Relatórios: ${out}`);
console.log('Resultados de regressão do validador; não medem IA, usabilidade, segurança física ou economia de tempo.');
if(report.correct!==report.total)process.exitCode=1;
