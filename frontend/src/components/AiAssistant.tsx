import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLayoutStore } from '../store/useLayoutStore';
import { Bot, Zap } from 'lucide-react';

export const AiAssistant = ({ eventId }: { eventId: string }) => {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<{role: string, text: string}[]>([
    { role: 'ai', text: 'Olá! Descreva seu evento e eu decido onde cada elemento vai ficar no espaço.\n\nEx: "Casamento para 120 pessoas com pista de dança central, palco para banda, mesas redondas e buffet lateral."' }
  ]);
  const { layout, setElements, saveHistory } = useLayoutStore();

  const handleGenerate = async () => {
    if (!briefing.trim() || !layout) return;

    const userMsg = briefing;
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setBriefing('');
    setLoading(true);

    try {
      const res = await api.post('/briefing/process', { eventId, rawText: userMsg });
      const structured = res.data.structured;

      // A IA já retorna x, y, w, h para cada elemento — só mapeia direto
      const COLOR_MAP: Record<string, string> = {
        mesa_redonda:    '#4a3a8a',
        mesa_retangular: '#3a5a8a',
        palco:           '#6a3a3a',
        pista_danca:     '#2a5a4a',
        buffet:          '#5a4a2a',
        cadeira:         '#4a4a5a',
        bar:             '#4a2a5a',
        dj:              '#2a4a6a',
        decoracao:       '#5a3a5a',
        entrada:         '#3a3a3a',
        banheiro:        '#3a4a3a',
        iluminacao:      '#6a5a2a',
      };

      const newElements = structured.elementos.map((el: any, index: number) => ({
        id: `ai_${Math.random().toString(36).substr(2, 9)}`,
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
      saveHistory();

      const reply =
        `✦ Layout gerado em ${res.data.processingTimeMs}ms!\n\n` +
        `📋 ${structured.briefing_estruturado}\n\n` +
        `🏛 Tipo: ${structured.tipo_evento} • ${structured.num_convidados} convidados\n` +
        `📦 ${newElements.length} elementos posicionados pela IA\n\n` +
        `💡 ${structured.layout_sugerido}\n\n` +
        (structured.restricoes_csp?.length
          ? `⚠ Restrições aplicadas:\n${structured.restricoes_csp.map((r: string) => '• ' + r).join('\n')}`
          : '');

      setChat(prev => [...prev, { role: 'ai', text: reply }]);
      toast.success(`${newElements.length} elementos posicionados pela IA!`);

    } catch (error) {
      toast.error('Erro ao processar briefing');
      setChat(prev => [...prev, { role: 'ai', text: '❌ Erro ao gerar layout. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '💒 Casamento',    text: 'Casamento elegante para 120 pessoas. Quero pista de dança central, palco para banda ao vivo, 12 mesas redondas para os convidados, buffet lateral, bar, iluminação no teto e decorações florais.' },
    { label: '💼 Corporativo',  text: 'Conferência corporativa para 80 pessoas. Palco principal na frente, cadeiras enfileiradas para a plateia, mesa de buffet no fundo e área de networking com mesas.' },
    { label: '🎂 Aniversário',  text: 'Festa de aniversário para 50 convidados, temática tropical. Pista de dança no centro, DJ na lateral, 6 mesas redondas, buffet, bar e bastante decoração colorida.' },
    { label: '🍽 Jantar',       text: 'Jantar formal para 40 pessoas. Mesas retangulares elegantes dispostas em fileiras, iluminação suave no teto, palco pequeno para música ao vivo e buffet lateral.' },
    { label: '🎤 Palestra',     text: 'Palestra para 100 pessoas. Palco grande no fundo, 100 cadeiras enfileiradas voltadas para o palco, buffet na lateral, 2 entradas e iluminação profissional.' },
  ];

  return (
    <div className="w-80 bg-sidebar border-l border-border h-[calc(100vh-64px)] flex flex-col">

      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-2 text-primary font-semibold">
        <Bot size={20} />
        Assistente IA
        <span className="ml-auto text-xs text-textSecondary bg-background border border-border px-2 py-0.5 rounded-full">
          Gemini
        </span>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[90%] text-xs leading-relaxed ${
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
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border space-y-2">

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1">
          {quickPrompts.map((q) => (
            <button
              key={q.label}
              onClick={() => setBriefing(q.text)}
              className="text-xs bg-background border border-border px-2 py-1 rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          placeholder="Descreva seu evento... (Enter para enviar)"
          className="w-full bg-background border border-border p-2 rounded text-xs text-textPrimary focus:outline-none focus:border-primary resize-none h-24"
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !briefing.trim()}
          className="w-full bg-primary hover:bg-primaryHover disabled:bg-border disabled:cursor-not-allowed text-white p-2 rounded flex items-center justify-center gap-2 transition-colors text-sm font-medium"
        >
          {loading ? <Bot size={16} className="animate-pulse" /> : <Zap size={16} />}
          {loading ? 'IA pensando...' : 'Gerar Layout com IA'}
        </button>

      </div>
    </div>
  );
};
