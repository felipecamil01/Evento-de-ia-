import { useEffect, useRef, useState } from 'react';
import { Camera, Download, X, Sparkles } from 'lucide-react';
import api from '../services/api';
import type { Layout } from '../types';

// Snapshot generated from every element, independent of the editor layer filter.
export function planSnapshot(layout: Layout) {
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,1600/Math.max(layout.canvasW,layout.canvasH));
  canvas.width=layout.canvasW*scale; canvas.height=layout.canvasH*scale;
  const ctx=canvas.getContext('2d')!;
  ctx.scale(scale,scale);ctx.fillStyle='#faf7f0';ctx.fillRect(0,0,layout.canvasW,layout.canvasH);
  const layers:Record<string,number>={chao:0,mobiliario:1,teto:2};
  [...layout.elements].sort((a,b)=>layers[a.layer]-layers[b.layer]||a.order-b.order).forEach(el=>{
    ctx.save();ctx.translate(el.x,el.y);ctx.rotate(el.rotation*Math.PI/180);
    ctx.fillStyle=el.color || '#776399';ctx.strokeStyle='#31263e';ctx.lineWidth=1;
    ctx.beginPath();
    if(el.type==='mesa_redonda') ctx.arc(el.w/2,el.h/2,el.w/2,0,Math.PI*2);
    else ctx.rect(0,0,el.w,el.h);
    ctx.fill();ctx.stroke();ctx.fillStyle='white';ctx.font='11px sans-serif';ctx.textAlign='center';
    ctx.fillText(el.label,el.w/2,el.h/2+4,Math.max(5,el.w-8));ctx.restore();
  });
  return canvas.toDataURL('image/png');
}
export const EventPreview=({layout,onClose}:{layout:Layout;onClose:()=>void})=>{
  const [style,setStyle]=useState('classico'),[lighting,setLighting]=useState('aconchegante');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[image,setImage]=useState('');
  const [source,setSource]=useState(''),[generatedAt,setGeneratedAt]=useState('');
  const [snapshot]=useState(()=>JSON.parse(JSON.stringify(layout)) as Layout);
  const [plan]=useState(()=>planSnapshot(snapshot));
  const [generatedOptions,setGeneratedOptions]=useState('');
  const closeRef=useRef<HTMLButtonElement>(null),dialogRef=useRef<HTMLDivElement>(null);
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement;closeRef.current?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape') onClose();
      if(e.key==='Tab') {
        const nodes=dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,a[href]');
        if(!nodes?.length)return;
        const first=nodes[0],last=nodes[nodes.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return ()=>{document.removeEventListener('keydown',key);controller.current?.abort();previous?.focus();};
  },[onClose]);
  const generate=async()=>{
    if(busy)return;
    setBusy(true);setError('');controller.current=new AbortController();
    try {
      const result=await api.post(`/layouts/${snapshot.id}/preview`,{
        canvasW:snapshot.canvasW,canvasH:snapshot.canvasH,elements:snapshot.elements,planImage:plan,style,lighting
      },{timeout:120000,signal:controller.current.signal});
      setImage(result.data.image);setSource(result.data.model);setGeneratedAt(result.data.generatedAt);
      setGeneratedOptions(`${style}/${lighting}`);
    }catch(e:any){if(!controller.current?.signal.aborted)setError([e.response?.data?.error || 'A geração não foi concluída. Tente novamente.',...(e.response?.data?.issues||[]).slice(0,8)].join('\n'));}
    finally{setBusy(false);}
  };
  const stale=image && generatedOptions!==`${style}/${lighting}`;
  return <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="preview-title" className="w-full max-w-6xl max-h-[95vh] overflow-auto rounded-2xl border border-border bg-sidebar shadow-2xl">
      <header className="flex items-center justify-between p-6 border-b border-border">
        <div><p className="text-xs uppercase tracking-widest text-primary mb-2">EventIA · Visão do cliente</p><h2 id="preview-title" className="text-2xl font-semibold">Seu evento, antes de acontecer</h2><p className="text-textSecondary text-sm mt-2">Transforme esta planta em uma proposta de ambientação horizontal.</p></div>
        <button ref={closeRef} aria-label="Fechar prévia" onClick={onClose} className="p-2 rounded hover:bg-background"><X/></button>
      </header>
      <div className="p-6 grid lg:grid-cols-[250px_1fr] gap-6">
        <aside className="space-y-5">
          <div><h3 className="text-sm font-semibold mb-2">Planta de referência</h3><img src={plan} alt="Planta completa usada como referência para a imagem" className="rounded-lg border border-border w-full"/><p className="text-xs text-textSecondary mt-2">{snapshot.elements.length} elementos · Todas as camadas</p></div>
          <label className="block text-sm">Estilo<select aria-label="Estilo da ambientação" value={style} disabled={busy} onChange={e=>setStyle(e.target.value)} className="block w-full mt-2 bg-background border border-border rounded-lg p-3"><option value="classico">Clássico e elegante</option><option value="rustico">Rústico e acolhedor</option><option value="moderno">Moderno e minimalista</option></select></label>
          <label className="block text-sm">Iluminação<select aria-label="Iluminação da ambientação" value={lighting} disabled={busy} onChange={e=>setLighting(e.target.value)} className="block w-full mt-2 bg-background border border-border rounded-lg p-3"><option value="aconchegante">Quente e aconchegante</option><option value="dia">Luz natural</option><option value="noturna">Festa à noite</option></select></label>
          <button onClick={generate} disabled={busy || !snapshot.elements.length} className="flex gap-2 items-center justify-center w-full rounded-lg bg-primary hover:bg-primaryHover p-3 text-white disabled:opacity-50"><Sparkles size={17}/>{busy?'Criando ambientação…':image?'Gerar outra prévia':'Gerar prévia com IA'}</button>
          <p className="text-xs text-textSecondary">A geração usa a API configurada e pode ter custo. Cada nova tentativa gera outra imagem.</p>
        </aside>
        <section className="min-w-0">
          <div className="aspect-video rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden" aria-busy={busy}>
            {busy?<div className="text-center p-8" role="status"><Sparkles className="mx-auto mb-4 animate-pulse text-primary" size={40}/><p>Criando a visão do seu casamento…</p><p className="text-sm text-textSecondary mt-2">Isso pode levar até dois minutos.</p></div>:image?<img src={image} alt="Ambientação conceitual do casamento gerada por inteligência artificial" className="w-full h-full object-contain"/>:<div className="text-center p-8"><Camera size={44} className="mx-auto mb-4 text-primary"/><h3 className="text-lg">Imagine o ambiente pronto</h3><p className="text-textSecondary text-sm mt-2">Escolha o estilo e a luz para criar sua primeira prévia.</p></div>}
          </div>
          {error&&<p role="alert" className="whitespace-pre-wrap mt-4 p-4 rounded-lg border border-red-400/50 text-red-300 text-sm">{error}</p>}
          {stale&&<p className="text-amber-300 text-sm mt-3">As opções mudaram. Gere novamente para aplicá-las à imagem.</p>}
          <p className="text-sm text-textSecondary mt-4">Imagem ilustrativa gerada por IA. Confira quantidades e posições com a planta; a imagem pode apresentar diferenças e não substitui o projeto técnico.</p>
          {image&&<div className="flex items-center justify-between flex-wrap gap-3 mt-4"><span className="text-xs text-textSecondary">{source} · {new Date(generatedAt).toLocaleString('pt-BR')}</span><a href={image} download={`eventia-previa.${image.startsWith('data:image/jpeg')?'jpg':image.startsWith('data:image/webp')?'webp':'png'}`} className="inline-flex gap-2 items-center border border-border rounded-lg px-4 py-2"><Download size={16}/>Baixar imagem</a></div>}
        </section>
      </div>
    </div>
  </div>;
};
