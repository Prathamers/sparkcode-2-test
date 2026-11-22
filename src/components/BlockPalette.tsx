// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useCallback, useMemo, useState } from 'react';
import { Clock, Plus, Search, X } from 'lucide-react';
import {
  BLOCK_CATEGORIES,
  BLOCK_DEF_MAP,
  BLOCK_DEFINITIONS,
  BLOCKS_BY_CATEGORY,
  CATEGORY_MAP,
  type BlockDefinition,
} from '../engine/blocks';
import type { BlockCategory } from '../types/project';
import { writeDragPayload, type DragPayload } from './BlockView';

type PaletteCategory = BlockCategory | 'recent';

const MAX_RECENT_BLOCKS = 8;
const RECENT_STORAGE_KEY = 'sparkcode2_recent_blocks_v1';

function loadRecentOpcodes(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((op): op is string => typeof op === 'string' && Boolean(BLOCK_DEF_MAP[op]))
      .slice(0, MAX_RECENT_BLOCKS);
  } catch {
    return [];
  }
}

function saveRecentOpcodes(opcodes: string[]): void {
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(opcodes));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

interface BlockPaletteProps {
  onQuickAddBlock: (opcode: string) => void;
  onCreateCustomFunction: (name: string, param1: string, param2: string) => void;
  onDragStartBlock: (payload: DragPayload) => void;
  onDragEndBlock: () => void;
}

export const BlockPalette: React.FC<BlockPaletteProps> = ({
  onQuickAddBlock,
  onCreateCustomFunction,
  onDragStartBlock,
  onDragEndBlock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory>('events');
  const [recentOpcodes, setRecentOpcodes] = useState<string[]>(() => loadRecentOpcodes());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFnForm, setShowFnForm] = useState(false);
  const [fnName, setFnName] = useState('computeDamage');
  const [fnParam1, setFnParam1] = useState('power');
  const [fnParam2, setFnParam2] = useState('armor');

  const recordRecentBlock = useCallback((opcode: string) => {
    if (!BLOCK_DEF_MAP[opcode]) return;
    setRecentOpcodes((prev) => {
      const next = [opcode, ...prev.filter((op) => op !== opcode)].slice(0, MAX_RECENT_BLOCKS);
      saveRecentOpcodes(next);
      return next;
    });
  }, []);

  const handleClearRecent = () => {
    setRecentOpcodes([]);
    saveRecentOpcodes([]);
  };

  const visibleBlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return BLOCK_DEFINITIONS.filter(
        (b) =>
          b.template.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.opcode.toLowerCase().includes(q)
      );
    }
    if (selectedCategory === 'recent') {
      return recentOpcodes
        .map((op) => BLOCK_DEF_MAP[op])
        .filter((def): def is BlockDefinition => Boolean(def));
    }
    return BLOCKS_BY_CATEGORY[selectedCategory];
  }, [selectedCategory, searchQuery, recentOpcodes]);

  const handleDragStart = (e: React.DragEvent, def: BlockDefinition) => {
    recordRecentBlock(def.opcode);
    const payload: DragPayload = {
      source: 'palette',
      opcode: def.opcode,
      shape: def.shape,
    };
    writeDragPayload(e, payload);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStartBlock(payload);
  };

  const handleQuickAdd = (opcode: string) => {
    recordRecentBlock(opcode);
    onQuickAddBlock(opcode);
  };

  const handleFnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = fnName.trim().replace(/\s+/g, '_');
    if (!clean) return;
    onCreateCustomFunction(clean, fnParam1.trim() || 'a', fnParam2.trim());
    setShowFnForm(false);
    setFnName('myFunction');
  };

  const isRecentActive = !searchQuery && selectedCategory === 'recent';

  return (
    <aside className="w-[288px] shrink-0 flex flex-col bg-[#101623] border-r border-slate-800/90 h-full overflow-hidden">
      {/* Search Bar */}
      <div className="p-2.5 border-b border-slate-800/80">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            aria-label="Search blocks"
            placeholder="Search blocks (tween, raycast, dict...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-md bg-[#182132] border border-slate-700/70 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear block search"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Rail + Block List */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Category Selector */}
        <nav
          aria-label="Block Categories"
          className="w-[108px] shrink-0 border-r border-slate-800/80 bg-[#0D131F] overflow-y-auto py-1.5 flex flex-col gap-0.5"
        >
          {/* Recent Category */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('recent');
            }}
            className={`px-2 py-2 text-left text-[11px] font-medium flex items-center justify-between gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              isRecentActive
                ? 'bg-slate-800/90 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />
              <span className="truncate">Recent</span>
            </span>
            {recentOpcodes.length > 0 && (
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                {recentOpcodes.length}
              </span>
            )}
          </button>

          <div className="mx-2 my-1 border-b border-slate-800/80" aria-hidden="true" />

          {BLOCK_CATEGORIES.map((cat) => {
            const active = !searchQuery && selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(cat.id);
                }}
                className={`px-2 py-2 text-left text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-800/90 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Filtered Blocks */}
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/60">
            <span className="font-semibold text-slate-200">
              {searchQuery
                ? `Matches (${visibleBlocks.length})`
                : selectedCategory === 'recent'
                  ? `Recent (${visibleBlocks.length})`
                  : CATEGORY_MAP[selectedCategory].label}
            </span>
            {selectedCategory === 'recent' && !searchQuery && recentOpcodes.length > 0 ? (
              <button
                type="button"
                onClick={handleClearRecent}
                className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span className="text-[10px] text-slate-500">Drag or click</span>
            )}
          </div>

          {selectedCategory === 'functions' && !searchQuery && (
            <div className="mb-1">
              {!showFnForm ? (
                <button
                  type="button"
                  onClick={() => setShowFnForm(true)}
                  className="w-full py-1.5 px-2.5 rounded-md bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-medium text-rose-200 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Custom Function</span>
                </button>
              ) : (
                <form
                  onSubmit={handleFnSubmit}
                  className="p-2 rounded-md bg-[#171F30] border border-slate-700 flex flex-col gap-1.5"
                >
                  <input
                    type="text"
                    aria-label="Function name"
                    value={fnName}
                    onChange={(e) => setFnName(e.target.value)}
                    placeholder="Function name"
                    className="h-7 px-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      aria-label="Parameter 1"
                      value={fnParam1}
                      onChange={(e) => setFnParam1(e.target.value)}
                      placeholder="param1"
                      className="h-7 px-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                    />
                    <input
                      type="text"
                      aria-label="Parameter 2"
                      value={fnParam2}
                      onChange={(e) => setFnParam2(e.target.value)}
                      placeholder="param2"
                      className="h-7 px-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFnForm(false)}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {visibleBlocks.length === 0 ? (
            <div className="py-8 px-2 text-center text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? `No blocks match "${searchQuery}".`
                : 'No recent blocks yet. Click or drag any block from a category to pin your last 8 used blocks here.'}
            </div>
          ) : (
            visibleBlocks.map((def) => {
              const cat = CATEGORY_MAP[def.category];
              const isBool = def.shape === 'boolean';
              const isReporter = def.shape === 'reporter';
              const prettyLabel = def.template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, k) => {
                const p = def.params.find((param) => param.name === k);
                return `[${p ? String(p.defaultValue) : k}]`;
              });

              return (
                <button
                  key={def.opcode}
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, def)}
                  onDragEnd={onDragEndBlock}
                  onClick={() => handleQuickAdd(def.opcode)}
                  title={`${def.description} (Drag into workspace or click to append)`}
                  style={{
                    backgroundColor: cat.color,
                    borderColor: cat.border,
                    color: cat.text,
                    clipPath: isBool
                      ? 'polygon(9px 0%, calc(100% - 9px) 0%, 100% 50%, calc(100% - 9px) 100%, 9px 100%, 0% 50%)'
                      : undefined,
                  }}
                  className={`w-full text-left text-[11.5px] font-medium leading-snug transition-transform hover:brightness-110 active:scale-[0.98] cursor-grab active:cursor-grabbing ${
                    isBool
                      ? 'px-3.5 py-1.5'
                      : isReporter
                        ? 'px-3 py-1 rounded-full border'
                        : 'px-2.5 py-1.5 rounded-md border'
                  }`}
                >
                  {prettyLabel}
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
