'use client';
import React from 'react';

type Tool = 'text' | 'pen' | 'arrow' | 'rectangle';

type Annotation = {
  type: Tool;
  color: 'black' | 'white' | 'red' | 'green';
} & (
  | { type: 'text'; x: number; y: number; text: string }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'rectangle'; x: number; y: number; width: number; height: number }
  | { type: 'pen'; points: {x: number; y: number}[] }
);

interface PhotoEditorProps {
  image: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

// 在Annotation类型定义后新增类型
type AILabel = {
  x: number;
  y: number;
  label: string;
  confidence: number;
};

// 修改组件定义
export default function PhotoEditor({ image, onSave, onCancel }: PhotoEditorProps) {
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [aiAnnotations, setAIAnnotations] = React.useState<AILabel[]>([]); // 新增状态
  const [activeTool, setActiveTool] = React.useState<Tool>('text');
  const [color, setColor] = React.useState<'black' | 'white' | 'red' | 'green'>('black');

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch(activeTool) {
      case 'text':
        setAnnotations([...annotations, { type: 'text', x, y, text: '双击编辑', color }]);
        break;
      case 'pen':
        // 画笔实现
        break;
      case 'arrow':
        setAnnotations([...annotations, { type: 'arrow', x1: x, y1: y, x2: x+50, y2: y+50, color }]);
        break;
      case 'rectangle':
        setAnnotations([...annotations, { type: 'rectangle', x, y, width: 100, height: 50, color }]);
        break;
    }
  };

  // 实现各种绘图工具的处理逻辑
  // ...

  // 在渲染部分修改
  return (
    <div className="editor-container fixed inset-0 bg-black bg-opacity-80 z-50 p-4 md:p-8">
      <div className="toolbar flex flex-wrap gap-2 p-2 bg-gray-800 rounded-lg mb-4">
        <button onClick={() => setActiveTool('text')}>文字</button>
        <button onClick={() => setActiveTool('pen')}>画笔</button>
        <button onClick={() => setActiveTool('arrow')}>箭头</button>
        <button onClick={() => setActiveTool('rectangle')}>矩形</button>

        <select
          value={color}
          onChange={(e) => setColor(e.target.value as 'black' | 'white' | 'red' | 'green')}
          className="p-2 border rounded bg-gray-700 text-white"
        >
          <option value="black">黑色</option>
          <option value="white">白色</option>
          <option value="red">红色</option>
          <option value="green">绿色</option>
        </select>
      </div>

      <div className="image-container relative h-[calc(100vh-200px)] md:h-[calc(100vh-150px)] overflow-auto">
        <img src={image} alt="Editable content" className="max-w-full" />
        <canvas
          className="absolute top-0 left-0 w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
        />

        {/* 新增AI标注层 */}
        <AILabelLayer annotations={aiAnnotations} />

        {/* 原有标注渲染 */}
        {annotations.map((annotation, i) => {
          switch (annotation.type) {
            case 'text':
              return (
                  <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: annotation.x,
                        top: annotation.y,
                        color: annotation.color
                      }}
                      className="p-1"
                  >
                    {annotation.text}
                  </div>
              );
            case 'arrow':
              // 箭头渲染逻辑
              break;
            case 'rectangle':
              // 矩形渲染逻辑
              break;
          }
        })}
      </div>

      <div className="action-buttons">
        <button onClick={onCancel}>取消</button>
        <button onClick={() => onSave(image)}>保存</button>
      </div>
    </div>
  )
}
// 修复AILabelLayer类型定义
const AILabelLayer = ({ annotations }: { annotations: AILabel[] }) => {
  return (
    <>
      {annotations.map((item, i) => (
        <div key={i} className="ai-label" style={{ left: item.x, top: item.y }}>
          <span className="tag">{item.label}</span>
          <div className="confidence-bar" style={{ width: `${item.confidence}%` }}/>
        </div>
      ))}
    </>
  );
};