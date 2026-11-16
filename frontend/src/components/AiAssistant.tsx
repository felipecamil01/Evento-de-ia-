import { useRef, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLayoutStore } from '../store/useLayoutStore';
import { Bot, Zap, Plus } from 'lucide-react';

interface RoomConfig {
  widthM: number;
  heightM: number;
  bathroomPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  entrancePosition: 'top' | 'bottom' | 'left' | 'right';
}

export const AiAssistant = ({ eventId }: { eventId: string }) => {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const generationLock = useRef(false);
  const [showRoomConfig, setShowRoomConfig] = useState(false);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    widthM: 20,
    heightM: 15,
    bathroomPosition: 'top-right',
    entrancePosition: 'bottom',
  });
  const [chat, setChat] = useState<{ role: string; text: string }[]>([
    {
      role: 'ai',
      text: 'Olá! Vamos planejar sua recepção de casamento. Eu proponho o layout e você revisa cada detalhe.\n\nConfigure o salão clicando em "⚙ Salão" antes de gerar para resultados mais precisos.\n\nEx: "Casamento para 120 pessoas com pista de dança central e palco para banda."',
    },
  ]);
  const { layout, setElements, saveHistory } = useLayoutStore();

  const buildRoomContext = () => {
    const pos = {
      'top-left': 'canto superior esquerdo',
      'top-right': 'canto superior direito',
      'bottom-left': 'canto inferior esquerdo',
      'bottom-right': 'canto inferior direito',
      none: 'não há banheiro no salão',
    };
    const ent = {
      top: 'borda superior',
      bottom: 'borda inferior',
      left: 'borda esquerda',
      right: 'borda direita',
    };
    return `\n\n[CONFIGURAÇÃO DO SALÃO]\nDimensões reais: ${roomConfig.widthM}m × ${roomConfig.heightM}m\nBanheiro: ${pos[roomConfig.bathroomPosition]}\nEntrada principal: ${ent[roomConfig.entrancePosition]}`;
  };

  const handleGenerate = async (mode: 'new' | 'improve' = 'new') => {
    if (generationLock.current || loading || !briefing.trim() || !layout) return;
    generationLock.current = true;

    setChat(prev => [...prev, { role: 'user', text: briefing + (mode === 'improve' ? ' (melhorar atual)' : '') }]);

    setLoading(true);

    const COLOR_MAP: Record<string, string> = {
      mesa_redonda: '#4a3a8a', mesa_retangular: '#3a5a8a', palco: '#6a3a3a',
      pista_danca: '#2a5a4a', buffet: '#5a4a2a', cadeira: '#4a4a5a',
      bar: '#4a2a5a', dj: '#2a4a6a', decoracao: '#5a3a5a',
      entrada: '#3a3a3a', banheiro: '#3a4a3a', iluminacao: '#6a5a2a',
    };

    try {
      const res = await api.post('/briefing/process', {
        eventId,
        rawText: briefing + buildRoomContext(),
        mode,
        canvasW: layout.canvasW, canvasH: layout.canvasH, elements: layout.elements,
      });
      const current = useLayoutStore.getState().layout;
      if (!current || current.id !== layout.id || JSON.stringify(current.elements) !== JSON.stringify(layout.elements)) {
        toast.error('O layout mudou durante a geração. Sua edição foi preservada; envie o pedido novamente.');
        return;
      }
      const structured = res.data.structured;

      const newElements = structured.elementos.map((el: any, index: number) => ({
        id: el.id || crypto.randomUUID(),
        type: el.tipo,
        label: el.label || el.tipo,
        x: el.x ?? 100,
        y: el.y ?? 100,
        w: el.w ?? 80,
        h: el.h ?? 80,
        rotation: el.rotation ?? 0,
        layer: el.layer || 'mobiliario',
        color: COLOR_MAP[el.tipo] || '#818cf8',
        order: index,
      }));

      setElements(newElements);
      setBriefing('');

      saveHistory();

      const notices = [...(structured.pendencias || []), ...(structured.validation?.issues || [])];
      const reply =
        `✦ ${mode === 'improve' ? 'Layout melhorado' : 'Layout gerado'} em ${res.data.processingTimeMs}ms!\n\n` +
        `📋 ${structured.briefing_estruturado}\n\n` +
        (notices.length ? `Revisão necessária:\n${notices.join('\n')}\n\n` : '') +
        `🏛 ${structured.tipo_evento} • ${structured.num_convidados} convidados\n` +
        `📦 ${newElements.length} elementos posicionados\n` +
        `📐 Salão: ${roomConfig.widthM}m × ${roomConfig.heightM}m\n\n` +
        `💡 ${structured.layout_sugerido}\n\n` +
        (structured.restricoes_csp?.length
          ? `⚠ Restrições:\n${structured.restricoes_csp.map((r: string) => '• ' + r).join('\n')}`
          : '');

      setChat(prev => [...prev, { role: 'ai', text: reply }]);
      toast.success(`${newElements.length} elementos posicionados pela IA!`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Não foi possível processar o briefing. Verifique a conexão com o servidor e tente novamente.';
      toast.error(message, { duration: 7000 });
      setChat(prev => [...prev, { role: 'ai', text: `❌ ${message}` }]);
    } finally {
      generationLock.current = false;
      setLoading(false);
    }
  };

  const quickPrompts = [
    {label:'Clássico',text:'Recepção de casamento em salão fechado, estilo clássico, mesas redondas, pista central, buffet lateral e entrada desobstruída.'},
    {label:'Rústico',text:'Recepção de casamento em salão fechado, estilo rústico, mesas retangulares, flores, pista e espaço para DJ.'},
    {label:'Minimalista',text:'Recepção de casamento em salão fechado, decoração minimalista, mesas redondas, buffet, bar e pista de dança.'}
  ];

  const hasElements = layout && layout.elements.length > 0;

  return (
    <div className="w-80 shrink-0 bg-sidebar border-l border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Bot size={18} className="text-primary" />
        <span className="font-semibold text-textPrimary text-sm">Assistente IA</span>
        <span className="ml-auto text-xs text-textSecondary bg-background border border-border px-2 py-0.5 rounded-full">Gemini</span>
        <button
          onClick={() => setShowRoomConfig(!showRoomConfig)}
          className={`text-xs px-2 py-0.5 rounded border transition-colors ${showRoomConfig ? 'border-primary text-primary bg-primary/10' : 'border-border text-textSecondary hover:border-primary'}`}
        >
          ⚙ Salão
        </button>
      </div>

      {/* Room Config Panel */}
      {showRoomConfig && (
        <div className="bg-background border-b border-border p-3 space-y-3">
          <p className="text-xs font-semibold text-primary">Configuração do Salão</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-textSecondary mb-1 block">Largura (metros)</label>
              <input
                type="number"
                value={roomConfig.widthM}
                onChange={e => setRoomConfig(r => ({ ...r, widthM: +e.target.value }))}
                className="w-full bg-sidebar border border-border rounded px-2 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-primary"
                min={5} max={100}
              />
            </div>
            <div>
              <label className="text-xs text-textSecondary mb-1 block">Profundidade (metros)</label>
              <input
                type="number"
                value={roomConfig.heightM}
                onChange={e => setRoomConfig(r => ({ ...r, heightM: +e.target.value }))}
                className="w-full bg-sidebar border border-border rounded px-2 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-primary"
                min={5} max={100}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-textSecondary mb-1 block">Posição do Banheiro</label>
            <select
              value={roomConfig.bathroomPosition}
              onChange={e => setRoomConfig(r => ({ ...r, bathroomPosition: e.target.value as any }))}
              className="w-full bg-sidebar border border-border rounded px-2 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-primary"
            >
              <option value="top-left">↖ Canto superior esquerdo</option>
              <option value="top-right">↗ Canto superior direito</option>
              <option value="bottom-left">↙ Canto inferior esquerdo</option>
              <option value="bottom-right">↘ Canto inferior direito</option>
              <option value="none">Sem banheiro no salão</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-textSecondary mb-1 block">Entrada Principal</label>
            <div className="grid grid-cols-4 gap-1">
              {(['top','bottom','left','right'] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => setRoomConfig(r => ({ ...r, entrancePosition: pos }))}
                  className={`py-1.5 text-xs rounded border transition-colors ${roomConfig.entrancePosition === pos ? 'border-primary bg-primary/10 text-primary' : 'border-border text-textSecondary hover:border-primary'}`}
                >
                  {pos === 'top' ? '↑ Cima' : pos === 'bottom' ? '↓ Baixo' : pos === 'left' ? '← Esq' : 'Dir →'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-sidebar border border-border rounded p-2 text-xs text-textSecondary">
            📐 Salão: <strong className="text-textPrimary">{roomConfig.widthM}m × {roomConfig.heightM}m</strong>
            {' '}({(roomConfig.widthM * roomConfig.heightM).toFixed(0)}m²)
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[92%] text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-background border border-border text-textPrimary rounded-bl-none'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border border-border p-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex flex-wrap gap-1">
          {quickPrompts.map(q => (
            <button key={q.label} onClick={() => setBriefing(q.text)}
              className="text-xs bg-background border border-border px-2 py-1 rounded-full hover:border-primary hover:text-primary transition-colors">
              {q.label}
            </button>
          ))}
        </div>

        <textarea
          value={briefing}
          onChange={e => setBriefing(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate('new'); } }}
          placeholder="Descreva o evento... (Enter para gerar)"
          className="w-full bg-background border border-border p-2 rounded text-xs text-textPrimary focus:outline-none focus:border-primary resize-none h-20"
        />

        {/* Dois botões: Gerar novo / Melhorar atual */}
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerate('new')}
            disabled={loading || !briefing.trim()}
            className="flex-1 bg-primary hover:bg-primaryHover disabled:bg-border disabled:cursor-not-allowed text-white p-2 rounded flex items-center justify-center gap-1.5 transition-colors text-xs font-medium"
          >
            <Zap size={13} />
            Gerar layout
          </button>
          {hasElements && (
            <button
              onClick={() => handleGenerate('improve')}
              disabled={loading || !briefing.trim()}
              className="flex-1 bg-background border border-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed text-primary p-2 rounded flex items-center justify-center gap-1.5 transition-colors text-xs font-medium"
            >
              <Plus size={13} />
              Melhorar
            </button>
          )}
        </div>
        {hasElements && (
          <p className="text-xs text-textSecondary text-center">
            "Melhorar" preserva os itens e pode reposicioná-los
          </p>
        )}
      </div>
    </div>
  );
};