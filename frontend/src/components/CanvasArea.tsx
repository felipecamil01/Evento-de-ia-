import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { useLayoutStore } from '../store/useLayoutStore';
import { CanvasElement } from './CanvasElement';

export const CanvasArea = () => {
  const { layout, addElement, activeLayer, saveHistory } = useLayoutStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const parent=containerRef.current?.parentElement;
    if(!parent || !layout)return;
    const fit=()=>setZoom(Math.max(0.2,Math.min(1,(parent.clientWidth-64)/layout.canvasW,(parent.clientHeight-64)/layout.canvasH)));
    const observer=new ResizeObserver(fit);observer.observe(parent);fit();
    return ()=>observer.disconnect();
  },[layout?.id,layout?.canvasW,layout?.canvasH]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('input,textarea,select') || target.isContentEditable) return;
      if (e.key === 'Delete' && selectedId) {
        useLayoutStore.getState().setElements(
          useLayoutStore.getState().layout!.elements.filter(el => el.id !== selectedId)
        );
        useLayoutStore.getState().saveHistory();
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  if (!layout) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stageRef = containerRef.current?.querySelector('canvas');
    if (!stageRef) return;

    stageRef.focus();
    const data = e.dataTransfer.getData('element');
    if (data) {
      const parsed = JSON.parse(data);
      const rect = stageRef.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - parsed.defaultW / 2;
      const y = (e.clientY - rect.top) / zoom - parsed.defaultH / 2;

      addElement({
        type: parsed.type,
        label: parsed.label,
        x: Math.max(0, x),
        y: Math.max(0, y),
        w: parsed.defaultW,
        h: parsed.defaultH,
        layer: parsed.layer,
        color: parsed.color,
        rotation: 0,
        order: layout.elements.length
      });
      saveHistory();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Generate grid lines (28px spacing as suggested, but let's do 40px for better visibility, or 28 as requested)
  const gridLines = [];
  const gridSize = 28;
  for (let i = 0; i < layout.canvasW / gridSize; i++) {
    gridLines.push(<Line key={`v${i}`} points={[Math.round(i * gridSize), 0, Math.round(i * gridSize), layout.canvasH]} stroke="#2a2a2e" strokeWidth={1} />);
  }
  for (let j = 0; j < layout.canvasH / gridSize; j++) {
    gridLines.push(<Line key={`h${j}`} points={[0, Math.round(j * gridSize), layout.canvasW, Math.round(j * gridSize)]} stroke="#2a2a2e" strokeWidth={1} />);
  }

  // Filter by active layer
  const visibleElements = layout.elements.filter(el => activeLayer === 'all' || el.layer === activeLayer);

  // Sorting elements by layer z-index order roughly
  const layerOrder: Record<string, number> = { 'chao': 1, 'mobiliario': 2, 'teto': 3 };
  visibleElements.sort((a, b) => {
    if (layerOrder[a.layer] !== layerOrder[b.layer]) {
      return layerOrder[a.layer] - layerOrder[b.layer];
    }
    return a.order - b.order;
  });

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="shadow-2xl ring-1 ring-border bg-background relative"
      style={{ width: layout.canvasW * zoom, height: layout.canvasH * zoom }}
    >
      <Stage
        width={layout.canvasW * zoom}
        height={layout.canvasH * zoom}
        scaleX={zoom} scaleY={zoom}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
          <Rect width={layout.canvasW} height={layout.canvasH} fill="#18181c" listening={false} />
          {gridLines}
          {/* Space boundaries (M=38px dashed border) */}
          <Rect
            x={1} y={1}
            width={layout.canvasW - 2}
            height={layout.canvasH - 2}
            stroke="#444"
            strokeWidth={2}
            dash={[10, 10]}
            listening={false}
          />
        </Layer>
        <Layer>
          {visibleElements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={el.id === selectedId}
              onSelect={() => setSelectedId(el.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
