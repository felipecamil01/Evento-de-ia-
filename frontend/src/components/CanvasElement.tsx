import React, { useRef, useEffect } from 'react';
import { Group, Rect, Text, Transformer, Circle } from 'react-konva';
import { useLayoutStore } from '../store/useLayoutStore';
import type { LayoutElement } from '../types';

interface CanvasElementProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: () => void;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({ element, isSelected, onSelect }) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const { updateElement, saveHistory } = useLayoutStore();

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);



  const isMesaRedonda = element.type === 'mesa_redonda';

  return (
    <>
      <Group
        ref={shapeRef}
        x={element.x}
        y={element.y}
        width={element.w}
        height={element.h}
        rotation={element.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          updateElement(element.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
          saveHistory();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);

          updateElement(element.id, {
            x: node.x(),
            y: node.y(),
            w: Math.max(20, node.width() * scaleX),
            h: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
          });
          saveHistory();
        }}
      >
        {isMesaRedonda ? (
          <Circle
            x={element.w / 2}
            y={element.h / 2}
            radius={element.w / 2}
            fill={element.color || '#818cf8'}
            opacity={0.8}
            stroke="#fff"
            strokeWidth={1}
          />
        ) : (
          <Rect
            x={0}
            y={0}
            width={element.w}
            height={element.h}
            fill={element.color || '#818cf8'}
            opacity={0.8}
            cornerRadius={4}
            stroke="#fff"
            strokeWidth={1}
          />
        )}
        <Text
          x={0}
          y={0}
          width={element.w}
          height={element.h}
          text={element.label}
          fontSize={10}
          fill="#fff"
          align="center"
          verticalAlign="middle"
          listening={false}
          wrap="char"
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
