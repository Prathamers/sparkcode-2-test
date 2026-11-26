// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  BLOCK_DEF_MAP,
  CATEGORY_MAP,
  findBestInputSlotForBlock,
  type InsertPosition,
} from '../engine/blocks';
import type { BlockInput, BlockNode, BlockShape } from '../types/project';
import { BlockInputSlot } from './blocks/BlockInputSlot';
import {
  computeHeaderSnapPosition,
  isExpressionShape,
  parseDragPayload,
  writeDragPayload,
  type DragPayload,
} from './blocks/blockUtils';

export { parseDragPayload, writeDragPayload, type DragPayload };

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

const NotchSvg: React.FC<{ fill: string; fillOpacity?: number; className: string }> = ({
  fill,
  fillOpacity,
  className,
}) => (
  <svg width="28" height="5" viewBox="0 0 28 5" className={className} aria-hidden="true">
    <path
      d="M 0 0 C 5 0, 6 5, 10 5 L 18 5 C 22 5, 23 0, 28 0 Z"
      fill={fill}
      fillOpacity={fillOpacity}
    />
  </svg>
);

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
    (activeDrag?.blockId && activeDrag.blockId === block.id) || draggedBlockIds?.has(block.id)
  );
  const isDraggingExpression = isExpressionShape(draggedShape);
  const isDraggingHat = draggedShape === 'hat';
  const isDraggingStatement = draggedShape === 'stack' || draggedShape === 'c-block';

  const effectiveSnap: 'none' | InsertPosition | 'expr' =
    !isDraggingSelf && magneticTargetId === block.id && magneticPosition
      ? magneticPosition
      : snapHighlight;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const payload: DragPayload = {
      source: 'workspace',
      opcode: block.opcode,
      blockId: block.id,
      shape: def.shape,
      grabOffsetX: Math.max(8, Math.round(e.clientX - rect.left)),
      grabOffsetY: Math.max(8, Math.round(e.clientY - rect.top)),
    };
    writeDragPayload(e, payload);
    e.dataTransfer.effectAllowed = 'move';

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
          // Synthetic drag image events can disallow custom preview nodes
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

  const tokens = def.template.split(/(\{[a-zA-Z0-9_]+\})/g).filter(Boolean);
  const renderedContent = (
    <div className="inline-flex flex-nowrap items-center gap-1 text-[11.5px] font-medium leading-none whitespace-nowrap">
      {tokens.map((tok, i) => {
        if (tok.startsWith('{') && tok.endsWith('}')) {
          const paramName = tok.slice(1, -1);
          const spec = def.params.find((p) => p.name === paramName);
          const input = block.inputs[paramName] ?? {
            type: 'literal',
            value: spec?.defaultValue ?? '',
          };
          return (
            <BlockInputSlot
              key={paramName}
              blockId={block.id}
              paramName={paramName}
              spec={spec}
              input={input}
              isDraggingSelf={isDraggingSelf}
              activeDrag={activeDrag}
              draggedShape={draggedShape}
              draggedBlockIds={draggedBlockIds}
              isDropTarget={hoverInputParam === paramName}
              onHoverParam={(p) =>
                setHoverInputParam((curr) => (p ? p : curr === paramName ? null : curr))
              }
              onClearHighlight={() => setSnapHighlight('none')}
              onUpdateInput={onUpdateInput}
              onDropIntoInput={onDropIntoInput}
              onDragEndBlock={onDragEndBlock}
              renderNestedBlock={(nested) => (
                <BlockView
                  block={nested}
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
              )}
            />
          );
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

  if (isExpressionShape(def.shape)) {
    const isBool = def.shape === 'boolean';
    return (
      <div
        draggable
        data-block-id={block.id}
        data-block-shape={def.shape}
        data-block-opcode={block.opcode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (isDraggingSelf || !isDraggingExpression) return;
          if (!findBestInputSlotForBlock(block, draggedShape)) return;
          e.preventDefault();
          e.stopPropagation();
          setSnapHighlight('expr');
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setSnapHighlight('none');
        }}
        onDrop={(e) => {
          const payload = parseDragPayload(e, activeDrag);
          if (!payload || payload.blockId === block.id || isDraggingSelf) return;
          const dDef = BLOCK_DEF_MAP[payload.opcode];
          if (!dDef || !isExpressionShape(dDef.shape)) return;
          const slot = findBestInputSlotForBlock(block, dDef.shape);
          if (!slot) return;
          e.preventDefault();
          e.stopPropagation();
          setSnapHighlight('none');
          onDropIntoInput(block.id, slot, payload);
          onDragEndBlock();
        }}
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

  const isHat = def.shape === 'hat';
  const isCBlock = def.shape === 'c-block';

  const makeDropHandlers = (zone: InsertPosition) => ({
    onDragOver: (e: React.DragEvent) => {
      if (isDraggingSelf || isDraggingExpression) return;
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
      if (!droppedDef || isExpressionShape(droppedDef.shape)) return;
      if (droppedDef.shape === 'hat' && zone !== 'before') return;
      if (zone === 'before' && isHat) return;
      e.preventDefault();
      e.stopPropagation();
      onDropRelative(block.id, zone, payload);
      onDragEndBlock();
    },
  });

  const renderBranch = (zone: 'body' | 'else', nodes: BlockNode[] | undefined, emptyText: string) => {
    const handlers = makeDropHandlers(zone);
    const dataAttr = zone === 'body' ? { 'data-cblock-body-id': block.id } : { 'data-cblock-else-id': block.id };
    return (
      <div className="flex">
        <div
          {...handlers}
          style={{ backgroundColor: cat.color, borderColor: cat.border }}
          className="w-3 shrink-0 border-l border-r"
        />
        <div
          {...handlers}
          {...dataAttr}
          className={`flex-1 ${zone === 'body' ? 'min-h-[34px] rounded-r' : 'min-h-[32px]'} py-1 pl-1.5 pr-1 flex flex-col items-start gap-0.5 transition-all ${
            effectiveSnap === zone
              ? 'bg-sky-500/25 ring-2 ring-sky-400'
              : isDraggingStatement && !isDraggingSelf
                ? 'bg-slate-950/50 ring-1 ring-slate-700/60'
                : 'bg-slate-950/35'
          }`}
        >
          {nodes && nodes.length > 0 ? (
            nodes.map((child) => (
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
              {emptyText}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative group/blk select-none w-max ${isRunning ? 'spark-block-running z-10' : ''} ${
        isDraggingSelf ? 'opacity-45' : ''
      }`}
      data-block-id={block.id}
      data-block-shape={def.shape}
      data-block-opcode={block.opcode}
    >
      {!isHat && effectiveSnap === 'before' && (
        <div
          className="h-2 mb-1 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.95)] pointer-events-none"
          data-testid="snap-preview-before"
        />
      )}

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

      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (isDraggingSelf) return;
          const zone: 'none' | InsertPosition | 'expr' =
            isDraggingExpression && draggedShape
              ? findBestInputSlotForBlock(block, draggedShape)
                ? 'expr'
                : 'none'
              : isDraggingHat
                ? isHat
                  ? 'none'
                  : 'before'
                : computeHeaderSnapPosition(e.currentTarget, e.clientY, isHat, isCBlock);
          if (zone === 'none') return;
          e.preventDefault();
          e.stopPropagation();
          setSnapHighlight(zone);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          e.stopPropagation();
          setSnapHighlight('none');
        }}
        onDrop={(e) => {
          const payload = parseDragPayload(e, activeDrag);
          setSnapHighlight('none');
          if (!payload || payload.blockId === block.id || isDraggingSelf) return;
          const droppedDef = BLOCK_DEF_MAP[payload.opcode];
          if (!droppedDef) return;

          if (isExpressionShape(droppedDef.shape)) {
            const slot = findBestInputSlotForBlock(block, droppedDef.shape);
            if (slot) {
              e.stopPropagation();
              onDropIntoInput(block.id, slot, payload);
              onDragEndBlock();
            }
            return;
          }

          if (droppedDef.shape === 'hat') {
            if (!isHat) {
              e.stopPropagation();
              onDropRelative(block.id, 'before', payload);
              onDragEndBlock();
            }
            return;
          }

          const pos = computeHeaderSnapPosition(e.currentTarget, e.clientY, isHat, isCBlock);
          e.stopPropagation();
          onDropRelative(block.id, pos, payload);
          onDragEndBlock();
        }}
        style={{ backgroundColor: cat.color, borderColor: cat.border, color: cat.text }}
        title={
          isStackHead
            ? 'Drag to move entire script or snap onto another block'
            : 'Drag to move this block and all blocks joined below it'
        }
        className={`relative flex items-center justify-between gap-2 px-2.5 py-1 min-h-[30px] border cursor-grab active:cursor-grabbing shadow-sm transition-shadow ${
          isHat ? 'rounded-tr-lg rounded-br-md rounded-bl-sm' : 'rounded-md'
        } ${isCBlock ? 'rounded-bl-none min-w-[148px]' : ''} ${
          isRunning ? 'ring-2 ring-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.55)]' : ''
        } ${effectiveSnap === 'expr' ? 'ring-2 ring-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.85)]' : ''}`}
      >
        {!isHat && (
          <NotchSvg
            fill="#0D121C"
            fillOpacity={0.65}
            className="absolute top-0 left-4 pointer-events-none"
          />
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

        {!isCBlock && (
          <NotchSvg fill={cat.color} className="absolute -bottom-[5px] left-4 pointer-events-none z-10" />
        )}
      </div>

      {isCBlock && renderBranch('body', block.body, 'Drop blocks inside')}

      {isCBlock && def.hasElse && (
        <>
          <div
            style={{ backgroundColor: cat.color, borderColor: cat.border, color: cat.text }}
            className="px-3 py-1 text-[11px] font-semibold border-x border-y"
          >
            else
          </div>
          {renderBranch('else', block.elseBody, 'Drop else blocks')}
        </>
      )}

      {isCBlock && (
        <div
          {...makeDropHandlers('after')}
          style={{ backgroundColor: cat.color, borderColor: cat.border }}
          className="relative h-4 rounded-b-md border-x border-b"
        >
          <NotchSvg fill={cat.color} className="absolute -bottom-[5px] left-4 pointer-events-none z-10" />
        </div>
      )}

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
