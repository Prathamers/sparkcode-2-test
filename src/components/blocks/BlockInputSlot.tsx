// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { X } from 'lucide-react';
import { BLOCK_DEF_MAP, type BlockParamSpec } from '../../engine/blocks';
import type { BlockInput, BlockNode, BlockShape } from '../../types/project';
import {
  isExpressionShape,
  parseDragPayload,
  slotAcceptsShape,
  type DragPayload,
} from './blockUtils';

interface BlockInputSlotProps {
  blockId: string;
  paramName: string;
  spec: BlockParamSpec | undefined;
  input: BlockInput;
  isDraggingSelf: boolean;
  activeDrag: DragPayload | null;
  draggedShape: BlockShape | null;
  draggedBlockIds?: Set<string>;
  isDropTarget: boolean;
  onHoverParam: (paramName: string | null) => void;
  onClearHighlight: () => void;
  onUpdateInput: (blockId: string, paramName: string, nextInput: BlockInput) => void;
  onDropIntoInput: (targetBlockId: string, paramName: string, payload: DragPayload) => void;
  onDragEndBlock: () => void;
  renderNestedBlock: (nested: BlockNode) => React.ReactNode;
}

export const BlockInputSlot: React.FC<BlockInputSlotProps> = ({
  blockId,
  paramName,
  spec,
  input,
  isDraggingSelf,
  activeDrag,
  draggedShape,
  draggedBlockIds,
  isDropTarget,
  onHoverParam,
  onClearHighlight,
  onUpdateInput,
  onDropIntoInput,
  onDragEndBlock,
  renderNestedBlock,
}) => {
  const isDraggingExpression = isExpressionShape(draggedShape);
  const slotAcceptsDraggedExpr = !isDraggingSelf && slotAcceptsShape(spec, draggedShape);

  const handleSlotDragOver = (e: React.DragEvent) => {
    if (isDraggingSelf) return;
    if (activeDrag && !isDraggingExpression) return;
    e.preventDefault();
    e.stopPropagation();
    onHoverParam(paramName);
  };

  const handleSlotDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    e.stopPropagation();
    onHoverParam(null);
  };

  const handleSlotDrop = (e: React.DragEvent) => {
    const payload = parseDragPayload(e, activeDrag);
    if (!payload) return;
    const droppedDef = BLOCK_DEF_MAP[payload.opcode];
    if (!droppedDef) return;
    if (!isExpressionShape(droppedDef.shape)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onHoverParam(null);
    onClearHighlight();
    if (payload.blockId === blockId || draggedBlockIds?.has(blockId)) return;
    onDropIntoInput(blockId, paramName, payload);
    onDragEndBlock();
  };

  if (input.type === 'block' && input.block) {
    return (
      <span
        onDragOver={handleSlotDragOver}
        onDragLeave={handleSlotDragLeave}
        onDrop={handleSlotDrop}
        className={`inline-flex items-center flex-nowrap gap-0.5 align-middle rounded-full shrink-0 transition-all ${
          isDropTarget
            ? 'ring-2 ring-white scale-[1.03]'
            : slotAcceptsDraggedExpr
              ? 'ring-1 ring-sky-300/70'
              : ''
        }`}
      >
        {renderNestedBlock(input.block)}
        <button
          type="button"
          aria-label={`Clear ${paramName} block`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateInput(blockId, paramName, {
              type: 'literal',
              value: spec?.defaultValue ?? '',
            });
          }}
          className="w-3.5 h-3.5 rounded-full bg-black/30 hover:bg-black/60 inline-flex items-center justify-center text-white/80 hover:text-white cursor-pointer shrink-0"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </span>
    );
  }

  if (spec?.kind === 'boolean') {
    const boolVal = String(input.value) === 'true' || input.value === true;
    return (
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onUpdateInput(blockId, paramName, { type: 'literal', value: !boolVal });
        }}
        onDragOver={handleSlotDragOver}
        onDragLeave={handleSlotDragLeave}
        onDrop={handleSlotDrop}
        style={{
          clipPath:
            'polygon(7px 0%, calc(100% - 7px) 0%, 100% 50%, calc(100% - 7px) 100%, 7px 100%, 0% 50%)',
        }}
        className={`h-5 px-3 inline-flex items-center justify-center text-[11px] font-mono font-semibold leading-none shrink-0 cursor-pointer transition-all ${
          isDropTarget
            ? 'bg-sky-300 text-slate-950 scale-105'
            : slotAcceptsDraggedExpr
              ? 'bg-sky-500/45 text-white ring-1 ring-sky-200 px-3.5'
              : 'bg-slate-950/60 hover:bg-slate-950/80 text-sky-200'
        }`}
        title="Click to toggle or drop a hexagonal boolean block here"
      >
        {boolVal ? 'true' : 'false'}
      </button>
    );
  }

  if (spec?.kind === 'select' && spec.options) {
    return (
      <select
        aria-label={paramName}
        value={String(input.value)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) =>
          onUpdateInput(blockId, paramName, { type: 'literal', value: e.target.value })
        }
        className="h-5 px-1.5 rounded bg-slate-950/55 border border-white/25 text-[11px] font-mono leading-none text-white align-middle shrink-0 focus:outline-none focus:border-sky-300 cursor-pointer"
      >
        {spec.options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-900 text-slate-100">
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (spec?.kind === 'color') {
    return (
      <input
        type="color"
        aria-label={paramName}
        value={String(input.value || '#38BDF8')}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) =>
          onUpdateInput(blockId, paramName, { type: 'literal', value: e.target.value })
        }
        className="w-5 h-5 rounded border border-white/30 bg-transparent cursor-pointer p-0 shrink-0 align-middle"
      />
    );
  }

  const isNum = spec?.kind === 'number';
  const strVal = String(input.value ?? '');
  const widthCh = Math.max(3.5, Math.min(22, strVal.length + 2));

  return (
    <span
      onDragOver={handleSlotDragOver}
      onDragLeave={handleSlotDragLeave}
      onDrop={handleSlotDrop}
      className={`inline-flex items-center rounded-full shrink-0 transition-all ${
        isDropTarget
          ? 'p-0.5 bg-sky-300 ring-2 ring-white scale-105'
          : slotAcceptsDraggedExpr
            ? 'p-0.5 bg-sky-400/35 ring-1 ring-sky-200'
            : ''
      }`}
    >
      <input
        type="text"
        aria-label={paramName}
        value={strVal}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleSlotDragOver}
        onDrop={handleSlotDrop}
        onChange={(e) => {
          const raw = e.target.value;
          if (isNum) {
            const parsed = Number(raw);
            onUpdateInput(blockId, paramName, {
              type: 'literal',
              value: raw === '' || raw === '-' || Number.isNaN(parsed) ? raw : parsed,
            });
          } else {
            onUpdateInput(blockId, paramName, { type: 'literal', value: raw });
          }
        }}
        style={{ width: `${widthCh}ch` }}
        className={`h-5 px-1.5 rounded-full text-center text-[11px] font-mono leading-none text-slate-950 font-semibold transition-all focus:outline-none ${
          isDropTarget ? 'bg-sky-200' : 'bg-white/92 focus:bg-white focus:ring-2 focus:ring-sky-300'
        }`}
        title="Edit value or drop a reporter block here"
      />
    </span>
  );
};
