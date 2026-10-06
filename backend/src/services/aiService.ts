import { z } from 'zod';
import { elementSchema, layoutSchema } from './inputSchemas';
import { validateLayout } from './validationService';
const pipeline = require('../../research/pipeline.cjs');
const spatial = z.object({ layout_sugerido:z.string(), restricoes_csp:z.array(z.string()), elementos:z.array(elementSchema).min(1).max(300) });
export async function processBriefingWithAI(rawText: string, context: z.infer<typeof layoutSchema> & {guestCount:number;mode:string;autoRepair?:boolean}) {
  const start=Date.now(), modelName=process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  const call=pipeline.createProvider({key:process.env.GEMINI_API_KEY,model:modelName});
  const input={rawText,context};
  const initial=await pipeline.generate('B',input,call);
  const stages=[...initial.stages];
  let selected=initial;
  const before=pipeline.diagnose(initial.raw,context,{elementSchema,validateLayout});
  const repair:{attempted:boolean;accepted:boolean;before:string[];after:string[];error:string|null}={attempted:false,accepted:false,before,after:before,error:null};
  if(context.autoRepair) {
    repair.attempted=true;
    const revised=await pipeline.revise('D',input,initial,before,call); stages.push(...revised.stages);
    const after=pipeline.diagnose(revised.raw,context,{elementSchema,validateLayout}); repair.after=after; repair.error=revised.error || null;
    const valid=spatial.safeParse(pipeline.parse(revised.raw)).success;
    // Accept only fully clean geometry/identity diagnostics. Never claim semantic correctness.
    if(!revised.error && valid && !after.length) { selected=revised; repair.accepted=true; }
  }
  if(selected.error) throw new Error('AI_GENERATION_FAILED');
  const proposal=spatial.parse(pipeline.parse(selected.raw));
  const ids=proposal.elementos.map(e=>e.id);
  if(ids.some(id=>!id?.trim()) || new Set(ids).size!==ids.length) throw new Error('AI_INVALID_IDS');
  if(context.mode==='improve' && context.elements.some(old=>proposal.elementos.filter(e=>e.id===old.id&&e.type===old.type).length!==1)) throw new Error('AI_PRESERVATION_FAILED');
  const brief=pipeline.parse(initial.stages[0]?.raw)||{};
  const validation=validateLayout(proposal.elementos,context.canvasW,context.canvasH);
  return {structured:{briefing_estruturado:brief.briefing_estruturado||rawText,num_convidados:context.guestCount,
    requisitos:Array.isArray(brief.requisitos)?brief.requisitos:[],pendencias:Array.isArray(brief.pendencias)?brief.pendencias:[],
    ...proposal,tipo_evento:'wedding',elementos:proposal.elementos.map(e=>({...e,tipo:e.type})),validation,repair,stages,promptVersion:pipeline.VERSION},
    processingTimeMs:Date.now()-start,modelName};
}
