import React, { useMemo, useRef, useState } from 'react';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import {
  BLOCK_DEF_MAP,
  collectBlockSubtreeIds,
  createBlockNode,
  createUid,
  estimateStackBounds,
  extractBlockTailFromStacks,
  findBlockTailIds,
  findFreeCanvasPosition,
  insertBlocksRelative,
  layoutStacksWithoutOverlap,
  removeBlockFromStacks,
  updateBlockInTree,
  type InsertPosition,
} from '../engine/blocks';
import type { BlockInput, BlockShape, ScriptStack, SpriteData } from '../types/project';
import { BlockView, parseDragPayload, type DragPayload } from './BlockView';

interface BlockWorkspaceProps {
  sprite: SpriteData;
  activeBlockIds: string[];
  activeDrag: DragPayload | null;
  onDragStartBlock: (payload: DragPayload) => void;
  onDragEndBlock: () => void;
  onChangeScripts: (scripts: ScriptStack[]) => void;
}

interface MagneticSnap {
  targetBlockId: string;
  position: InsertPosition;
}

export const BlockWorkspace: React.FC<BlockWorkspaceProps> = ({
  sprite,
  activeBlockIds,
  activeDrag,
  onDragStartBlock,
  onDragEndBlock,
  onChangeScripts,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [magneticSnap, setMagneticSnap] = useState<MagneticSnap | null>(null);
  const [frontStackId, setFrontStackId] = useState<string | null>(null);

  const activeSet = useMemo(() => new Set(activeBlockIds), [activeBlockIds]);

  // All block IDs currently moving together (parent block + every joined block beneath it)
  const draggedBlockIds = useMemo(() => {
    if (!activeDrag || activeDrag.source !== 'workspace' || !activeDrag.blockId) {
      return undefined;
    }
    return findBlockTailIds(sprite.scripts, activeDrag.blockId);
  }, [activeDrag, sprite.scripts]);

  // Measure real rendered DOM sizes of all stacks for accurate collision-free layout
  const measureDomStacks = (): Map<string, { width: number; height: number }> => {
    const map = new Map<string, { width: number; height: number }>();
    const container = canvasRef.current;
    if (!container) return map;
    container.querySelectorAll<HTMLElement>('[data-stack-id]').forEach((el) => {
      const id = el.dataset.stackId;
      if (!id) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        map.set(id, { width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
      }
    });
    return map;
  };

  /**
   * Finds the nearest compatible block notch or C-block interior within magnetic snap range.
   */
  const findNearestMagneticSnap = (
    clientX: number,
    clientY: number,
    draggedShape: BlockShape,
    excludeIds: Set<string>
  ): MagneticSnap | null => {
    const container = canvasRef.current;
    if (!container) return null;
    // Reporters & booleans only plug into expression slots, never statement notches
    if (draggedShape === 'reporter' || draggedShape === 'boolean') return null;

    // 1. Check direct hit inside an empty C-block body or else slot first (for non-hat blocks)
    if (draggedShape !== 'hat') {
      const cBodies = container.querySelectorAll<HTMLElement>('[data-cblock-body-id], [data-cblock-else-id]');
      for (const bodyEl of cBodies) {
        const bodyId = bodyEl.dataset.cblockBodyId;
        const elseId = bodyEl.dataset.cblockElseId;
        const targetId = bodyId ?? elseId;
        if (!targetId || excludeIds.has(targetId)) continue;
        const rect = bodyEl.getBoundingClientRect();
        if (
          clientX >= rect.left - 12 &&
          clientX <= rect.right + 12 &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          if (bodyEl.querySelectorAll('[data-block-id]').length === 0) {
            return { targetBlockId: targetId, position: bodyId ? 'body' : 'else' };
          }
        }
      }
    }

    // 2. Check proximity to top (before) and bottom (after) edges of eligible blocks
    const nodes = container.querySelectorAll<HTMLElement>('[data-block-id]');
    let best: { dist: number; snap: MagneticSnap } | null = null;
    const snapRadiusY = 34;
    const snapPadX = 32;

    nodes.forEach((el) => {
      const id = el.dataset.blockId;
      const targetShape = el.dataset.blockShape as BlockShape | undefined;
      if (!id || excludeIds.has(id)) return;
      if (targetShape === 'reporter' || targetShape === 'boolean') return;

      const rect = el.getBoundingClientRect();
      if (clientX < rect.left - snapPadX || clientX > rect.right + snapPadX) return;

      // Candidate 1: snap BEFORE (above top edge of non-hat block)
      if (targetShape !== 'hat') {
        const dyTop = Math.abs(clientY - rect.top);
        if (dyTop <= snapRadiusY && (!best || dyTop < best.dist)) {
          best = { dist: dyTop, snap: { targetBlockId: id, position: 'before' } };
        }
      }

      // Candidate 2: snap AFTER (below bottom edge of any block, if dragged isn't a hat)
      if (draggedShape !== 'hat') {
        const dyBot = Math.abs(clientY - rect.bottom);
        if (dyBot <= snapRadiusY && (!best || dyBot < best.dist)) {
          best = { dist: dyBot, snap: { targetBlockId: id, position: 'after' } };
        }
      }
    });

    return best ? (best as { dist: number; snap: MagneticSnap }).snap : null;
  };

  const handleUpdateInput = (blockId: string, paramName: string, nextInput: BlockInput) => {
    const nextStacks = sprite.scripts.map((stack) => ({
      ...stack,
      blocks: updateBlockInTree(stack.blocks, blockId, (node) => ({
        ...node,
        inputs: {
          ...node.inputs,
          [paramName]: nextInput,
        },
      })),
    }));
    onChangeScripts(nextStacks);
  };

  const handleDeleteBlock = (blockId: string) => {
    const res = removeBlockFromStacks(sprite.scripts, blockId);
    onChangeScripts(res.stacks);
  };

  /**
   * Snaps a dragged block AND every joined block below it onto targetBlockId at `position`.
   */
  const handleDropRelative = (
    targetBlockId: string,
    position: InsertPosition,
    payload: DragPayload
  ) => {
    setMagneticSnap(null);
    const droppedDef = BLOCK_DEF_MAP[payload.opcode];
    if (!droppedDef || droppedDef.shape === 'reporter' || droppedDef.shape === 'boolean') {
      return;
    }

    let workingStacks = sprite.scripts;
    let nodesToInsert = [createBlockNode(payload.opcode)];

    if (payload.source === 'workspace' && payload.blockId) {
      const extracted = extractBlockTailFromStacks(workingStacks, payload.blockId);
      if (extracted.extracted.length === 0) return;
      // Prevent dropping a block/tail onto itself or any of its joined/nested descendants
      const movingIds = collectBlockSubtreeIds(extracted.extracted);
      if (movingIds.has(targetBlockId)) {
        return;
      }
      workingStacks = extracted.stacks;
      nodesToInsert = extracted.extracted;
    }

    let didInsert = false;
    const nextStacks = workingStacks.map((stack) => {
      const res = insertBlocksRelative(stack.blocks, targetBlockId, position, nodesToInsert);
      if (res.inserted) {
        didInsert = true;
        setFrontStackId(stack.id);
      }
      return res.inserted ? { ...stack, blocks: res.blocks } : stack;
    });

    if (didInsert) {
      onChangeScripts(nextStacks);
    }
  };

  const handleDropIntoInput = (targetBlockId: string, paramName: string, payload: DragPayload) => {
    setMagneticSnap(null);
    let workingStacks = sprite.scripts;
    let exprNode = createBlockNode(payload.opcode);

    if (payload.source === 'workspace' && payload.blockId) {
      const movingIds = findBlockTailIds(workingStacks, payload.blockId);
      if (movingIds.has(targetBlockId)) {
        return;
      }
      const removed = removeBlockFromStacks(workingStacks, payload.blockId);
      if (removed.removed) {
        workingStacks = removed.stacks;
        exprNode = removed.removed;
      }
    }

    const nextStacks = workingStacks.map((stack) => ({
      ...stack,
      blocks: updateBlockInTree(stack.blocks, targetBlockId, (node) => ({
        ...node,
        inputs: {
          ...node.inputs,
          [paramName]: { type: 'block', value: '', block: exprNode },
        },
      })),
    }));
    onChangeScripts(nextStacks);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!activeDrag) return;
    const def = BLOCK_DEF_MAP[activeDrag.opcode];
    if (!def) return;
    const exclude =
      draggedBlockIds ??
      (activeDrag.blockId ? findBlockTailIds(sprite.scripts, activeDrag.blockId) : new Set<string>());
    const snap = findNearestMagneticSnap(e.clientX, e.clientY, def.shape, exclude);
    setMagneticSnap((prev) =>
      prev?.targetBlockId === snap?.targetBlockId && prev?.position === snap?.position
        ? prev
        : snap
    );
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const payload = parseDragPayload(e, activeDrag);
    setMagneticSnap(null);
    onDragEndBlock();
    if (!payload) return;
    const def = BLOCK_DEF_MAP[payload.opcode];
    if (!def) return;

    const exclude =
      payload.source === 'workspace' && payload.blockId
        ? findBlockTailIds(sprite.scripts, payload.blockId)
        : new Set<string>();

    // 1. Try magnetic proximity snap first so near-misses still connect cleanly
    const nearSnap = findNearestMagneticSnap(e.clientX, e.clientY, def.shape, exclude);
    if (nearSnap) {
      handleDropRelative(nearSnap.targetBlockId, nearSnap.position, payload);
      return;
    }

    // 2. Place the moved block + ALL joined blocks below it at the exact dropped canvas position
    const rect = canvasRef.current?.getBoundingClientRect();
    const offsetX = payload.grabOffsetX ?? activeDrag?.grabOffsetX ?? 36;
    const offsetY = payload.grabOffsetY ?? activeDrag?.grabOffsetY ?? 18;
    const dropX = rect
      ? Math.max(12, Math.round(e.clientX - rect.left + (canvasRef.current?.scrollLeft ?? 0) - offsetX))
      : 24;
    const dropY = rect
      ? Math.max(12, Math.round(e.clientY - rect.top + (canvasRef.current?.scrollTop ?? 0) - offsetY))
      : 24;

    let workingStacks = sprite.scripts;
    let movedBlocks = [createBlockNode(payload.opcode)];
    let stackId = createUid('stack');

    if (payload.source === 'workspace' && payload.blockId) {
      const res = extractBlockTailFromStacks(workingStacks, payload.blockId);
      if (res.extracted.length > 0) {
        workingStacks = res.stacks;
        movedBlocks = res.extracted;
        if (res.wasFullStack && res.sourceStackId) {
          stackId = res.sourceStackId;
        }
      }
    }

    const newStack: ScriptStack = {
      id: stackId,
      x: dropX,
      y: dropY,
      blocks: movedBlocks,
    };
    setFrontStackId(stackId);
    onChangeScripts([...workingStacks, newStack]);
  };

  // Bounding-box collision solver using real measured DOM dimensions
  const handleCleanUp = () => {
    const measured = measureDomStacks();
    const tidied = layoutStacksWithoutOverlap(sprite.scripts, {
      measured,
      columns: 2,
      padding: 20,
      gapX: 34,
      gapY: 28,
    });
    onChangeScripts(tidied);
  };

  const handleAddStarterScript = () => {
    const draft: ScriptStack = {
      id: createUid('stack'),
      x: 20,
      y: 20,
      blocks: [
        createBlockNode('event_when_flag'),
        createBlockNode('motion_turn', { deg: 15 }),
      ],
    };
    const measured = measureDomStacks();
    const pos = findFreeCanvasPosition(sprite.scripts, draft, measured);
    const stack: ScriptStack = { ...draft, x: pos.x, y: pos.y };
    setFrontStackId(stack.id);
    onChangeScripts([...sprite.scripts, stack]);
  };

  // Dynamically expand scrollable canvas area so wide/tall scripts never clip
  const canvasDimensions = useMemo(() => {
    let maxRight = 820;
    let maxBottom = 780;
    for (const st of sprite.scripts) {
      const est = estimateStackBounds(st);
      maxRight = Math.max(maxRight, st.x + est.width + 140);
      maxBottom = Math.max(maxBottom, st.y + est.height + 160);
    }
    return { minWidth: maxRight, minHeight: maxBottom };
  }, [sprite.scripts]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Workspace Action Bar */}
      <div className="h-9 shrink-0 px-3 bg-[#101623] border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-semibold text-slate-200">{sprite.name}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{sprite.scripts.length} scripts</span>
          {activeDrag && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-sky-300">
                Drop on any block to snap
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddStarterScript}
            className="h-6.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3 h-3" />
            <span>New Script</span>
          </button>
          <button
            type="button"
            onClick={handleCleanUp}
            className="h-6.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Tidy Blocks</span>
          </button>
        </div>
      </div>

      {/* Interactive Dot-Grid Block Canvas */}
      <div
        ref={canvasRef}
        onDragOver={handleCanvasDragOver}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setMagneticSnap(null);
          }
        }}
        onDrop={handleCanvasDrop}
        data-testid="block-workspace"
        className="flex-1 relative overflow-auto spark-grid-bg"
      >
        <div
          style={{ minWidth: canvasDimensions.minWidth, minHeight: canvasDimensions.minHeight }}
          className="relative p-4"
        >
          {sprite.scripts.length === 0 ? (
            <div className="max-w-sm mx-auto mt-20 p-6 rounded-lg border border-dashed border-slate-700/80 bg-[#111827]/70 text-center">
              <p className="text-sm font-medium text-slate-200">No scripts on {sprite.name} yet</p>
              <p className="mt-1.5 text-xs text-slate-400">
                Drag blocks from the palette on the left or click any block to add it here.
              </p>
              <button
                type="button"
                onClick={handleAddStarterScript}
                className="mt-4 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white cursor-pointer"
              >
                Add Flag Script
              </button>
            </div>
          ) : (
            sprite.scripts.map((stack) => {
              const isFront = frontStackId === stack.id;
              return (
                <div
                  key={stack.id}
                  style={{ left: stack.x, top: stack.y }}
                  data-stack-id={stack.id}
                  onMouseDown={() => setFrontStackId(stack.id)}
                  className={`absolute inline-flex flex-col items-start w-max group/stack ${
                    isFront ? 'z-20' : 'z-10'
                  }`}
                >
                  {/* Unobtrusive hover-only Delete Stack button (top hat block itself is the drag handle) */}
                  <button
                    type="button"
                    aria-label="Delete script stack"
                    title="Delete entire script stack"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeScripts(sprite.scripts.filter((s) => s.id !== stack.id));
                    }}
                    className="opacity-0 group-hover/stack:opacity-100 focus:opacity-100 absolute -top-2 -right-2 z-30 w-5 h-5 rounded-full bg-slate-900/95 border border-slate-700 hover:border-rose-500 hover:bg-rose-950 text-slate-400 hover:text-rose-200 inline-flex items-center justify-center shadow-md transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>

                  {/* Stacked Blocks */}
                  <div className="flex flex-col gap-0 items-start">
                    {stack.blocks.map((blk, idx) => (
                      <BlockView
                        key={blk.id}
                        block={blk}
                        activeBlockIds={activeSet}
                        activeDrag={activeDrag}
                        draggedBlockIds={draggedBlockIds}
                        magneticTargetId={magneticSnap?.targetBlockId ?? null}
                        magneticPosition={magneticSnap?.position ?? null}
                        isStackHead={idx === 0}
                        onDragStartBlock={(payload) => {
                          setFrontStackId(stack.id);
                          onDragStartBlock(payload);
                        }}
                        onDragEndBlock={onDragEndBlock}
                        onUpdateInput={handleUpdateInput}
                        onDropRelative={handleDropRelative}
                        onDropIntoInput={handleDropIntoInput}
                        onDeleteBlock={handleDeleteBlock}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
