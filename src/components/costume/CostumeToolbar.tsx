// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import {
  Circle,
  Clipboard,
  Copy,
  Crosshair,
  Eraser,
  FlipHorizontal2,
  FlipVertical2,
  Hexagon,
  Minus,
  MousePointer2,
  PaintBucket,
  Pencil,
  Pipette,
  Square,
  Type,
} from 'lucide-react';
import type { DrawTool } from './drawing';

interface CostumeTopBarProps {
  tool: DrawTool;
  color: string;
  brushSize: number;
  brushOpacity: number;
  textValue: string;
  hasSelection: boolean;
  onionSkin: boolean;
  onChangeColor: (color: string) => void;
  onChangeBrushSize: (size: number) => void;
  onChangeBrushOpacity: (opacity: number) => void;
  onChangeTextValue: (value: string) => void;
  onFlip: (axis: 'h' | 'v') => void;
  onCopy: () => void;
  onPaste: () => void;
  onCommitSelection: () => void;
  onToggleOnionSkin: () => void;
}

export const CostumeTopBar: React.FC<CostumeTopBarProps> = ({
  tool,
  color,
  brushSize,
  brushOpacity,
  textValue,
  hasSelection,
  onionSkin,
  onChangeColor,
  onChangeBrushSize,
  onChangeBrushOpacity,
  onChangeTextValue,
  onFlip,
  onCopy,
  onPaste,
  onCommitSelection,
  onToggleOnionSkin,
}) => (
  <div className="px-3 py-2 bg-[#101623] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
    <div className="flex items-center gap-2.5 flex-wrap">
      <label className="flex items-center gap-1.5 text-slate-400">
        <span>Color</span>
        <input
          type="color"
          aria-label="Primary brush color"
          value={color}
          onChange={(e) => onChangeColor(e.target.value)}
          className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
        />
      </label>
      <label className="flex items-center gap-1.5 text-slate-400">
        <span>Size</span>
        <input
          type="range"
          aria-label="Brush size"
          min={1}
          max={16}
          value={brushSize}
          onChange={(e) => onChangeBrushSize(Number(e.target.value))}
          className="w-16 accent-sky-400"
        />
        <span className="font-mono tabular-nums text-slate-200 w-5">{brushSize}</span>
      </label>
      <label className="flex items-center gap-1.5 text-slate-400">
        <span>Alpha</span>
        <input
          type="range"
          aria-label="Brush opacity"
          min={0.1}
          max={1}
          step={0.1}
          value={brushOpacity}
          onChange={(e) => onChangeBrushOpacity(Number(e.target.value))}
          className="w-14 accent-sky-400"
        />
        <span className="font-mono tabular-nums text-slate-200">
          {Math.round(brushOpacity * 100)}%
        </span>
      </label>
      {tool === 'text' && (
        <input
          type="text"
          aria-label="Text stamp value"
          value={textValue}
          onChange={(e) => onChangeTextValue(e.target.value)}
          className="h-7 w-24 px-2 rounded bg-slate-900 border border-slate-700 text-xs text-white"
          placeholder="Text..."
        />
      )}
    </div>

    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onFlip('h')}
        aria-label="Flip horizontal"
        title="Flip Horizontal"
        className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
      >
        <FlipHorizontal2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onFlip('v')}
        aria-label="Flip vertical"
        title="Flip Vertical"
        className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
      >
        <FlipVertical2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy selection"
        title="Copy"
        className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onPaste}
        aria-label="Paste selection"
        title="Paste"
        className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
      >
        <Clipboard className="w-3.5 h-3.5" />
      </button>
      {hasSelection && (
        <button
          type="button"
          onClick={onCommitSelection}
          className="h-7 px-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer whitespace-nowrap"
        >
          Apply Transform
        </button>
      )}
      <button
        type="button"
        onClick={onToggleOnionSkin}
        className={`h-7 px-2.5 rounded text-[11px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
          onionSkin ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        }`}
      >
        Onion Skin
      </button>
    </div>
  </div>
);

const TOOL_ITEMS: Array<{ id: DrawTool; label: string; icon: React.ReactNode }> = [
  { id: 'brush', label: 'Brush', icon: <Pencil className="w-3.5 h-3.5" /> },
  { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-3.5 h-3.5" /> },
  { id: 'line', label: 'Line', icon: <Minus className="w-3.5 h-3.5" /> },
  { id: 'rect', label: 'Rectangle', icon: <Square className="w-3.5 h-3.5" /> },
  { id: 'ellipse', label: 'Ellipse', icon: <Circle className="w-3.5 h-3.5" /> },
  { id: 'polygon', label: 'Polygon', icon: <Hexagon className="w-3.5 h-3.5" /> },
  { id: 'fill', label: 'Fill Bucket', icon: <PaintBucket className="w-3.5 h-3.5" /> },
  { id: 'eyedropper', label: 'Eyedropper', icon: <Pipette className="w-3.5 h-3.5" /> },
  { id: 'text', label: 'Text Tool', icon: <Type className="w-3.5 h-3.5" /> },
  { id: 'marquee', label: 'Marquee & Transform', icon: <MousePointer2 className="w-3.5 h-3.5" /> },
  { id: 'pivot', label: 'Pivot / Origin Point', icon: <Crosshair className="w-3.5 h-3.5" /> },
];

export const CostumeToolRail: React.FC<{
  activeTool: DrawTool;
  onSelectTool: (tool: DrawTool) => void;
}> = ({ activeTool, onSelectTool }) => (
  <div className="w-11 shrink-0 bg-[#0F1522] border-r border-slate-800/80 py-2 flex flex-col items-center gap-1 overflow-y-auto">
    {TOOL_ITEMS.map((item) => (
      <button
        key={item.id}
        type="button"
        aria-label={item.label}
        title={item.label}
        onClick={() => onSelectTool(item.id)}
        className={`w-8 h-8 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer ${
          activeTool === item.id
            ? 'bg-sky-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        {item.icon}
      </button>
    ))}
  </div>
);
