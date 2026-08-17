import { useLayoutStore } from '../store/useLayoutStore';
import { Layers } from 'lucide-react';

const ELEMENTS = [
  { type: 'mesa_redonda', label: 'Mesa Redonda', layer: 'mobiliario', defaultW: 80, defaultH: 80, color: '#818cf8' },
  { type: 'mesa_retangular', label: 'Mesa Retangular', layer: 'mobiliario', defaultW: 120, defaultH: 60, color: '#818cf8' },
  { type: 'palco', label: 'Palco', layer: 'mobiliario', defaultW: 200, defaultH: 100, color: '#818cf8' },
  { type: 'pista_danca', label: 'Pista de Dança', layer: 'chao', defaultW: 300, defaultH: 300, color: '#4ade80' },
  { type: 'buffet', label: 'Buffet', layer: 'mobiliario', defaultW: 150, defaultH: 60, color: '#818cf8' },
  { type: 'cadeira', label: 'Cadeira', layer: 'mobiliario', defaultW: 30, defaultH: 30, color: '#818cf8' },
  { type: 'bar', label: 'Bar', layer: 'mobiliario', defaultW: 120, defaultH: 60, color: '#818cf8' },
  { type: 'dj', label: 'DJ', layer: 'mobiliario', defaultW: 80, defaultH: 60, color: '#818cf8' },
  { type: 'decoracao', label: 'Decoração', layer: 'teto', defaultW: 50, defaultH: 50, color: '#fb923c' },
  { type: 'entrada', label: 'Entrada', layer: 'chao', defaultW: 100, defaultH: 40, color: '#4ade80' },
  { type: 'banheiro', label: 'Banheiro', layer: 'chao', defaultW: 80, defaultH: 80, color: '#4ade80' },
  { type: 'iluminacao', label: 'Iluminação', layer: 'teto', defaultW: 40, defaultH: 40, color: '#fb923c' },
];

export const Sidebar = () => {
  const { activeLayer, setActiveLayer, addElement, saveHistory } = useLayoutStore();

  const handleDragStart = (e: React.DragEvent, el: any) => {
    e.dataTransfer.setData('element', JSON.stringify(el));
  };

  return (
    <div className="w-64 bg-sidebar border-r border-border h-[calc(100vh-64px)] overflow-y-auto p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
        <Layers size={20} /> Camadas
      </h2>
      <select
        value={activeLayer}
        onChange={(e) => setActiveLayer(e.target.value)}
        className="bg-background border border-border p-2 rounded text-sm w-full mb-6 focus:outline-none focus:border-primary"
      >
        <option value="all">Todas as Camadas</option>
        <option value="chao">Chão</option>
        <option value="mobiliario">Mobiliário</option>
        <option value="teto">Teto</option>
      </select>

      <h2 className="text-lg font-semibold mb-4 text-primary">Elementos</h2>
      <div className="grid grid-cols-2 gap-2">
        {ELEMENTS.map(el => (
          <div
            key={el.type}
            draggable
            onDragStart={(e) => handleDragStart(e, el)}
            className="bg-background border border-border p-2 text-xs rounded text-center cursor-grab hover:border-primary transition-colors flex flex-col items-center justify-center h-20"
          >
            <div
              className="w-8 h-8 rounded mb-2 border border-white/20"
              style={{ backgroundColor: el.color }}
            />
            <span className="truncate w-full">{el.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-textSecondary mt-4 text-center">Arraste para o canvas</p>
    </div>
  );
};
