import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import {
  BLOCK_DEF_MAP,
  CATEGORY_MAP,
  findBestInputSlotForBlock,
  type BlockParamSpec,
  type InsertPosition,
} from '../engine/blocks';
import type { BlockInput, BlockNode, BlockShape } from '../types/project';

export interface DragPayload {
  source: 'palette' | 'workspace';
  opcode: string;
  blockId?: string;
  shape?: BlockShape;
  grabOffsetX?: number;
  grabOffsetY?: number;
}

export function writeDragPayload(e: React.DragEvent, payload: DragPayload): void {
  const serialized = JSON.stringify(payload);
  try {
    e.dataTransfer.setData('application/x-spark-block', serialized);
    e.dataTransfer.setData('text/plain', serialized);
  } catch {
    // Some synthetic drag events restrict dataTransfer mutations
  }
}

export function parseDragPayload(e: React.DragEvent, fallback?: DragPayload | null): DragPayload | null {
  try {
    const raw =
      e.dataTransfer.getData('application/x-spark-block') ||
      e.dataTransfer.getData('text/plain');
    if (raw && raw.startsWith('{')) {
      const parsed = JSON.parse(raw) as DragPayload;
      if (parsed && parsed.opcode) return parsed;
    }
  } catch {
    // Fall back to activeDrag state
  }
  return fallback ?? null;
}

interface BlockViewProps {
  block: BlockNode;
  activeBlockIds: Set<string>;
  activeDrag: DragPayload | null;
  draggedBlockIds?: Set<string>;
  magneticTargetId?: string | null;
  magneticPosition?: InsertPosition | null;
  isStackHead?: boolean;
  onDragStartBlock: (payload: DragPayload) => void;
  onDragEndBlock: () => void;
  onUpdateInput: (blockId: string, paramName: string, nextInput: BlockInput) => void;
  onDropRelative: (targetBlockId: string, position: InsertPosition, payload: DragPayload) => void;
  onDropIntoInput: (targetBlockId: string, paramName: string, payload: DragPayload) => void;
  onDeleteBlock: (blockId: string) => void;
  isNestedExpression?: boolean;
}

export const BlockView: React.FC<BlockViewProps> = ({
  block,
  activeBlockIds,
  activeDrag,
  draggedBlockIds,
  magneticTargetId,
  magneticPosition,
  isStackHead = false,
  onDragStartBlock,
  onDragEndBlock,
  onUpdateInput,
  onDropRelative,
  onDropIntoInput,
  onDeleteBlock,
  isNestedExpression = false,
}) => {
  const def = BLOCK_DEF_MAP[block.opcode];
  const [snapHighlight, setSnapHighlight] = useState<'none' | InsertPosition | 'expr'>('none');
  const [hoverInputParam, setHoverInputParam] = useState<string | null>(null);

  if (!def) return null;

  const cat = CATEGORY_MAP[def.category];
  const isRunning = activeBlockIds.has(block.id);

  const draggedDef = activeDrag ? BLOCK_DEF_MAP[activeDrag.opcode] : null;
  const draggedShape: BlockShape | null = activeDrag?.shape ?? draggedDef?.shape ?? null;
  const isDraggingSelf = Boolean(
    (activeDrag?.blockId && activeDrag.blockId === block.id) ||
      (draggedBlockIds && draggedBlockIds.has(block.id))
  );
  const isDraggingExpression = draggedShape === 'reporter' || draggedShape === 'boolean';
  const isDraggingHat = draggedShape === 'hat';
  const isDraggingStatement = draggedShape === 'stack' || draggedShape === 'c-block';

  // Merge HTML5 dragover highlight with magnetic proximity snap highlight
  const effectiveSnap: 'none' | InsertPosition | 'expr' =
    !isDraggingSelf && magneticTargetId === block.id && magneticPosition
      ? magneticPosition
      : snapHighlight;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const grabOffsetX = Math.max(8, Math.round(e.clientX - rect.left));
    const grabOffsetY = Math.max(8, Math.round(e.clientY - rect.top));

    const payload: DragPayload = {
      source: 'workspace',
      opcode: block.opcode,
      blockId: block.id,
      shape: def.shape,
      grabOffsetX,
      grabOffsetY,
    };
    writeDragPayload(e, payload);
    e.dataTransfer.effectAllowed = 'move';

    // When dragging the top block of a stack, show the entire connected stack as the drag preview
    if (isStackHead && !isNestedExpression) {
      const stackEl = e.currentTarget.closest<HTMLElement>('[data-stack-id]');
      if (stackEl && typeof e.dataTransfer.setDragImage === 'function') {
        const stackRect = stackEl.getBoundingClientRect();
        try {
          e.dataTransfer.setDragImage(
            stackEl,
            Math.max(8, Math.round(e.clientX - stackRect.left)),
            Math.max(8, Math.round(e.clientY - stackRect.top))
          );
        } catch {
          // Ignore synthetic drag image errors
        }
      }
    }

    onDragStartBlock(payload);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setSnapHighlight('none');
    setHoverInputParam(null);
    onDragEndBlock();
  };

  const renderParamSlot = (paramName: string) => {
    const spec: BlockParamSpec | undefined = def.params.find((p) => p.name === paramName);
    const input = block.inputs[paramName] ?? { type: 'literal', value: spec?.defaultValue ?? '' };
    const isDropTarget = hoverInputParam === paramName;

    const slotAcceptsDraggedExpr =
      isDraggingExpression &&
      !isDraggingSelf &&
      spec &&
      spec.kind !== 'select' &&
      spec.kind !== 'color' &&
      (draggedShape === 'boolean'
        ? spec.kind === 'boolean' || spec.kind === 'any'
        : spec.kind === 'number' || spec.kind === 'string' || spec.kind === 'any');

    const handleSlotDragOver = (e: React.DragEvent) => {
      if (isDraggingSelf) return;
      if (activeDrag && !isDraggingExpression) return; // Let statement drags bubble to block header
      e.preventDefault();
      e.stopPropagation();
      setHoverInputParam(paramName);
    };
    const handleSlotDragLeave = (e: React.DragEvent) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      e.stopPropagation();
      setHoverInputParam((curr) => (curr === paramName ? null : curr));
    };
    const handleSlotDrop = (e: React.DragEvent) => {
      const payload = parseDragPayload(e, activeDrag);
      if (!payload) return;
      const droppedDef = BLOCK_DEF_MAP[payload.opcode];
      if (!droppedDef) return;
      if (droppedDef.shape !== 'reporter' && droppedDef.shape !== 'boolean') {
        // Prevent native text-drop into <input>, while letting event bubble to block header
        e.preventDefault();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setHoverInputParam(null);
      setSnapHighlight('none');
      if (payload.blockId === block.id || (draggedBlockIds && draggedBlockIds.has(block.id))) return;
      onDropIntoInput(block.id, paramName, payload);
      onDragEndBlock();
    };

    if (input.type === 'block' && input.block) {
      return (
        <span
          key={paramName}
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
          <BlockView
            block={input.block}
            activeBlockIds={activeBlockIds}
            activeDrag={activeDrag}
            draggedBlockIds={draggedBlockIds}
            onDragStartBlock={onDragStartBlock}
            onDragEndBlock={onDragEndBlock}
            onUpdateInput={onUpdateInput}
            onDropRelative={onDropRelative}
            onDropIntoInput={onDropIntoInput}
            onDeleteBlock={onDeleteBlock}
            isNestedExpression
          />
          <button
            type="button"
            aria-label={`Clear ${paramName} block`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateInput(block.id, paramName, {
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
          key={paramName}
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateInput(block.id, paramName, { type: 'literal', value: !boolVal });
          }}
          onDragOver={handleSlotDragOver}
          onDragLeave={handleSlotDragLeave}
          onDrop={handleSlotDrop}
          style={{
            clipPath: 'polygon(7px 0%, calc(100% - 7px) 0%, 100% 50%, calc(100% - 7px) 100%, 7px 100%, 0% 50%)',
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
          key={paramName}
          aria-label={paramName}
          value={String(input.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            onUpdateInput(block.id, paramName, { type: 'literal', value: e.target.value })
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
          key={paramName}
          type="color"
          aria-label={paramName}
          value={String(input.value || '#38BDF8')}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            onUpdateInput(block.id, paramName, { type: 'literal', value: e.target.value })
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
        key={paramName}
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
              onUpdateInput(block.id, paramName, {
                type: 'literal',
                value: raw === '' || raw === '-' || Number.isNaN(parsed) ? raw : parsed,
              });
            } else {
              onUpdateInput(block.id, paramName, { type: 'literal', value: raw });
            }
          }}
          style={{ width: `${widthCh}ch` }}
          className={`h-5 px-1.5 rounded-full text-center text-[11px] font-mono leading-none text-slate-950 font-semibold transition-all focus:outline-none ${
            isDropTarget
              ? 'bg-sky-200'
              : 'bg-white/92 focus:bg-white focus:ring-2 focus:ring-sky-300'
          }`}
          title="Edit value or drop a reporter block here"
        />
      </span>
    );
  };

  // Single-line horizontal layout for crisp Scratch/Blockly alignment
  const tokens = def.template.split(/(\{[a-zA-Z0-9_]+\})/g).filter(Boolean);
  const renderedContent = (
    <div className="inline-flex flex-nowrap items-center gap-1 text-[11.5px] font-medium leading-none whitespace-nowrap">
      {tokens.map((tok, i) => {
        if (tok.startsWith('{') && tok.endsWith('}')) {
          return renderParamSlot(tok.slice(1, -1));
        }
        const trimmed = tok.trim();
        if (!trimmed) return null;
        return (
          <span key={i} className="whitespace-nowrap select-none leading-none">
            {trimmed}
          </span>
        );
      })}
    </div>
  );

  // Reporter pill or Boolean hexagon
  if (def.shape === 'reporter' || def.shape === 'boolean') {
    const isBool = def.shape === 'boolean';
    const handleExprSurfaceDragOver = (e: React.DragEvent) => {
      if (isDraggingSelf || !isDraggingExpression) return;
      const slot = findBestInputSlotForBlock(block, draggedShape);
      if (!slot) return;
      e.preventDefault();
      e.stopPropagation();
      setSnapHighlight('expr');
    };
    const handleExprSurfaceDragLeave = (e: React.DragEvent) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setSnapHighlight('none');
    };
    const handleExprSurfaceDrop = (e: React.DragEvent) => {
      const payload = parseDragPayload(e, activeDrag);
      if (!payload || payload.blockId === block.id || isDraggingSelf) return;
      const dDef = BLOCK_DEF_MAP[payload.opcode];
      if (!dDef || (dDef.shape !== 'reporter' && dDef.shape !== 'boolean')) return;
      const slot = findBestInputSlotForBlock(block, dDef.shape);
      if (!slot) return;
      e.preventDefault();
      e.stopPropagation();
      setSnapHighlight('none');
      onDropIntoInput(block.id, slot, payload);
      onDragEndBlock();
    };

    return (
      <div
        draggable
        data-block-id={block.id}
        data-block-shape={def.shape}
        data-block-opcode={block.opcode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleExprSurfaceDragOver}
        onDragLeave={handleExprSurfaceDragLeave}
        onDrop={handleExprSurfaceDrop}
        style={{
          backgroundColor: cat.color,
          borderColor: cat.border,
          color: cat.text,
          clipPath: isBool
            ? 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)'
            : undefined,
        }}
        className={`inline-flex flex-nowrap items-center gap-1 select-none shrink-0 cursor-grab active:cursor-grabbing ${
          isBool ? 'px-2.5 py-0.5 min-h-[22px]' : 'px-2 py-0.5 min-h-[22px] rounded-full border'
        } ${isRunning ? 'spark-block-running ring-2 ring-yellow-300' : ''} ${
          effectiveSnap === 'expr' ? 'ring-2 ring-white brightness-110' : ''
        } ${isDraggingSelf ? 'opacity-45' : ''} ${isNestedExpression ? 'shadow-sm' : 'shadow-md'}`}
      >
        {renderedContent}
      </div>
    );
  }

  // Statement / Hat / C-Block
  const isHat = def.shape === 'hat';
  const isCBlock = def.shape === 'c-block';

  const computeHeaderZone = (e: React.DragEvent<HTMLDivElement>): 'none' | InsertPosition | 'expr' => {
    if (isDraggingSelf) return 'none';

    if (isDraggingExpression && draggedShape) {
      return findBestInputSlotForBlock(block, draggedShape) ? 'expr' : 'none';
    }

    if (isDraggingHat) {
      return isHat ? 'none' : 'before';
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.6;

    if (isHat) {
      return 'after';
    }
    if (isCBlock) {
      return relY < 0.36 ? 'before' : 'body';
    }
    return relY < 0.38 ? 'before' : 'after';
  };

  const handleHeaderDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const zone = computeHeaderZone(e);
    if (zone === 'none') return;
    e.preventDefault();
    e.stopPropagation();
    setSnapHighlight(zone);
  };

  const handleHeaderDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    e.stopPropagation();
    setSnapHighlight('none');
  };

  const handleHeaderDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const payload = parseDragPayload(e, activeDrag);
    setSnapHighlight('none');
    if (!payload) return;
    e.preventDefault();
    if (payload.blockId === block.id || isDraggingSelf) return;
    const droppedDef = BLOCK_DEF_MAP[payload.opcode];
    if (!droppedDef) return;

    // Expression dropped anywhere on this block's header -> snap to best compatible input slot
    if (droppedDef.shape === 'reporter' || droppedDef.shape === 'boolean') {
      const slot = findBestInputSlotForBlock(block, droppedDef.shape);
      if (slot) {
        e.stopPropagation();
        onDropIntoInput(block.id, slot, payload);
        onDragEndBlock();
      }
      return;
    }

    // Hat block dropped on a non-hat block -> snap on top (before)
    if (droppedDef.shape === 'hat') {
      if (!isHat) {
        e.stopPropagation();
        onDropRelative(block.id, 'before', payload);
        onDragEndBlock();
      }
      return;
    }

    // Statement / C-block dropped on header -> snap before / body / after based on pointer Y
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.6;
    const pos: InsertPosition = isHat
      ? 'after'
      : isCBlock
        ? relY < 0.36
          ? 'before'
          : 'body'
        : relY < 0.38
          ? 'before'
          : 'after';

    e.stopPropagation();
    onDropRelative(block.id, pos, payload);
    onDragEndBlock();
  };

  const makeDropHandlers = (zone: InsertPosition) => ({
    onDragOver: (e: React.DragEvent) => {
      if (isDraggingSelf) return;
      if (isDraggingExpression) return;
      if (isDraggingHat && zone !== 'before') return;
      if (zone === 'before' && isHat) return;
      e.preventDefault();
      e.stopPropagation();
      setSnapHighlight(zone);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      e.stopPropagation();
      setSnapHighlight((curr) => (curr === zone ? 'none' : curr));
    },
    onDrop: (e: React.DragEvent) => {
      const payload = parseDragPayload(e, activeDrag);
      setSnapHighlight('none');
      if (!payload || payload.blockId === block.id || isDraggingSelf) return;
      const droppedDef = BLOCK_DEF_MAP[payload.opcode];
      if (!droppedDef || droppedDef.shape === 'reporter' || droppedDef.shape === 'boolean') return;
      if (droppedDef.shape === 'hat' && zone !== 'before') return;
      if (zone === 'before' && isHat) return;
      e.preventDefault();
      e.stopPropagation();
      onDropRelative(block.id, zone, payload);
      onDragEndBlock();
    },
  });

  return (
    <div
      className={`relative group/blk select-none w-max ${isRunning ? 'spark-block-running z-10' : ''} ${
        isDraggingSelf ? 'opacity-45' : ''
      }`}
      data-block-id={block.id}
      data-block-shape={def.shape}
      data-block-opcode={block.opcode}
    >
      {/* Snap-Before Preview Bar (above non-hat blocks) */}
      {!isHat && effectiveSnap === 'before' && (
        <div
          className="h-2 mb-1 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.95)] pointer-events-none"
          data-testid="snap-preview-before"
        />
      )}

      {/* Top Hat Dome SVG */}
      {isHat && (
        <svg
          width="112"
          height="12"
          viewBox="0 0 112 12"
          className="block -mb-px pointer-events-none"
          aria-hidden="true"
        >
          <path d="M 0 12 C 18 -2, 82 -2, 112 12 Z" fill={cat.color} />
        </svg>
      )}

      {/* Main Header Row — Full-surface drag handle (carries all joined blocks below) AND drop target */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleHeaderDragOver}
        onDragLeave={handleHeaderDragLeave}
        onDrop={handleHeaderDrop}
        style={{
          backgroundColor: cat.color,
          borderColor: cat.border,
          color: cat.text,
        }}
        title={isStackHead ? 'Drag to move entire script or snap onto another block' : 'Drag to move this block and all blocks joined below it'}
        className={`relative flex items-center justify-between gap-2 px-2.5 py-1 min-h-[30px] border cursor-grab active:cursor-grabbing shadow-sm transition-shadow ${
          isHat ? 'rounded-tr-lg rounded-br-md rounded-bl-sm' : 'rounded-md'
        } ${isCBlock ? 'rounded-bl-none min-w-[148px]' : ''} ${
          isRunning ? 'ring-2 ring-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.55)]' : ''
        } ${effectiveSnap === 'expr' ? 'ring-2 ring-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.85)]' : ''}`}
      >
        {/* Top Bezier Notch Socket indicator for stack/c-blocks */}
        {!isHat && (
          <svg
            width="28"
            height="5"
            viewBox="0 0 28 5"
            className="absolute top-0 left-4 pointer-events-none"
            aria-hidden="true"
          >
            <path d="M 0 0 C 5 0, 6 5, 10 5 L 18 5 C 22 5, 23 0, 28 0 Z" fill="#0D121C" fillOpacity="0.65" />
          </svg>
        )}

        <div className="shrink-0">{renderedContent}</div>

        <button
          type="button"
          aria-label={`Delete ${def.opcode} block`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteBlock(block.id);
          }}
          className="opacity-0 group-hover/blk:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-black/25 text-white/80 hover:text-white transition-opacity cursor-pointer shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Bottom Bezier Notch Tongue (non-C blocks) */}
        {!isCBlock && (
          <svg
            width="28"
            height="5"
            viewBox="0 0 28 5"
            className="absolute -bottom-[5px] left-4 pointer-events-none z-10"
            aria-hidden="true"
          >
            <path d="M 0 0 C 5 0, 6 5, 10 5 L 18 5 C 22 5, 23 0, 28 0 Z" fill={cat.color} />
          </svg>
        )}
      </div>

      {/* C-Block Body Slot */}
      {isCBlock && (
        <div className="flex">
          {/* Colored C-Block Spine */}
          <div
            {...makeDropHandlers('body')}
            style={{ backgroundColor: cat.color, borderColor: cat.border }}
            className="w-3 shrink-0 border-l border-r"
          />
          <div
            {...makeDropHandlers('body')}
            data-cblock-body-id={block.id}
            className={`flex-1 min-h-[34px] py-1 pl-1.5 pr-1 flex flex-col items-start gap-0.5 rounded-r transition-all ${
              effectiveSnap === 'body'
                ? 'bg-sky-500/25 ring-2 ring-sky-400'
                : isDraggingStatement && !isDraggingSelf
                  ? 'bg-slate-950/50 ring-1 ring-slate-700/60'
                  : 'bg-slate-950/35'
            }`}
          >
            {block.body && block.body.length > 0 ? (
              block.body.map((child) => (
                <BlockView
                  key={child.id}
                  block={child}
                  activeBlockIds={activeBlockIds}
                  activeDrag={activeDrag}
                  draggedBlockIds={draggedBlockIds}
                  magneticTargetId={magneticTargetId}
                  magneticPosition={magneticPosition}
                  onDragStartBlock={onDragStartBlock}
                  onDragEndBlock={onDragEndBlock}
                  onUpdateInput={onUpdateInput}
                  onDropRelative={onDropRelative}
                  onDropIntoInput={onDropIntoInput}
                  onDeleteBlock={onDeleteBlock}
                />
              ))
            ) : (
              <div className="text-[11px] text-slate-400 italic px-2 py-1.5 select-none">
                Drop blocks inside
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Else Branch for If-Else */}
      {isCBlock && def.hasElse && (
        <>
          <div
            style={{ backgroundColor: cat.color, borderColor: cat.border, color: cat.text }}
            className="px-3 py-1 text-[11px] font-semibold border-x border-y"
          >
            else
          </div>
          <div className="flex">
            <div
              {...makeDropHandlers('else')}
              style={{ backgroundColor: cat.color, borderColor: cat.border }}
              className="w-3 shrink-0 border-l border-r"
            />
            <div
              {...makeDropHandlers('else')}
              data-cblock-else-id={block.id}
              className={`flex-1 min-h-[32px] py-1 pl-1.5 pr-1 flex flex-col items-start gap-0.5 transition-all ${
                effectiveSnap === 'else'
                  ? 'bg-sky-500/25 ring-2 ring-sky-400'
                  : isDraggingStatement && !isDraggingSelf
                    ? 'bg-slate-950/50 ring-1 ring-slate-700/60'
                    : 'bg-slate-950/35'
              }`}
            >
              {block.elseBody && block.elseBody.length > 0 ? (
                block.elseBody.map((child) => (
                  <BlockView
                    key={child.id}
                    block={child}
                    activeBlockIds={activeBlockIds}
                    activeDrag={activeDrag}
                    draggedBlockIds={draggedBlockIds}
                    magneticTargetId={magneticTargetId}
                    magneticPosition={magneticPosition}
                    onDragStartBlock={onDragStartBlock}
                    onDragEndBlock={onDragEndBlock}
                    onUpdateInput={onUpdateInput}
                    onDropRelative={onDropRelative}
                    onDropIntoInput={onDropIntoInput}
                    onDeleteBlock={onDeleteBlock}
                  />
                ))
              ) : (
                <div className="text-[11px] text-slate-400 italic px-2 py-1.5 select-none">
                  Drop else blocks
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* C-Block Footer Cap — Dropping here cleanly snaps AFTER the C-block */}
      {isCBlock && (
        <div
          {...makeDropHandlers('after')}
          style={{ backgroundColor: cat.color, borderColor: cat.border }}
          className="relative h-4 rounded-b-md border-x border-b"
        >
          <svg
            width="28"
            height="5"
            viewBox="0 0 28 5"
            className="absolute -bottom-[5px] left-4 pointer-events-none z-10"
            aria-hidden="true"
          >
            <path d="M 0 0 C 5 0, 6 5, 10 5 L 18 5 C 22 5, 23 0, 28 0 Z" fill={cat.color} />
          </svg>
        </div>
      )}

      {/* Generous Snap-After Drop Zone */}
      <div
        {...makeDropHandlers('after')}
        data-testid={effectiveSnap === 'after' ? 'snap-preview-after' : undefined}
        className={`rounded-full transition-all ${
          effectiveSnap === 'after'
            ? 'h-2.5 my-1 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.95)]'
            : isDraggingStatement && !isDraggingSelf
              ? 'h-2.5 -mt-0.5 bg-transparent'
              : 'h-1.5 -mt-0.5 bg-transparent'
        }`}
      />
    </div>
  );
};
