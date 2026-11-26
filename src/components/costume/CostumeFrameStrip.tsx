// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Library, Plus, Trash2 } from 'lucide-react';
import type { CostumeData } from '../../types/project';

interface CostumeFrameStripProps {
  costumes: CostumeData[];
  activeIndex: number;
  onSelectFrame: (idx: number) => void;
  onAddFrame: () => void;
  onDeleteFrame: (idx: number) => void;
  onOpenCostumeLibrary?: () => void;
}

export const CostumeFrameStrip: React.FC<CostumeFrameStripProps> = ({
  costumes,
  activeIndex,
  onSelectFrame,
  onAddFrame,
  onDeleteFrame,
  onOpenCostumeLibrary,
}) => (
  <div className="h-20 shrink-0 px-3 bg-[#101623] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
    {costumes.map((c, idx) => (
      <div
        key={c.id}
        className={`relative shrink-0 w-16 h-14 rounded-md border p-1 flex flex-col items-center justify-center transition-colors ${
          idx === activeIndex
            ? 'border-sky-400 bg-sky-500/15'
            : 'border-slate-800 bg-[#151D2D] hover:border-slate-700'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelectFrame(idx)}
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
        >
          {c.previewUrl ? (
            <img
              src={c.previewUrl}
              alt={c.name}
              className="w-8 h-8 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-8 h-8 bg-slate-800 rounded" />
          )}
          <span className="text-[10px] text-slate-300 truncate max-w-[54px]">{c.name}</span>
        </button>
        {costumes.length > 1 && (
          <button
            type="button"
            aria-label={`Delete costume ${c.name}`}
            onClick={() => onDeleteFrame(idx)}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={onAddFrame}
      className="shrink-0 w-16 h-14 rounded-md border border-dashed border-slate-700 hover:border-sky-400 text-slate-400 hover:text-sky-300 flex flex-col items-center justify-center gap-0.5 text-[10px] cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>Frame</span>
    </button>
    {onOpenCostumeLibrary && (
      <button
        type="button"
        onClick={onOpenCostumeLibrary}
        title="Choose Costume from Asset Library"
        className="shrink-0 w-16 h-14 rounded-md border border-emerald-500/40 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer"
      >
        <Library className="w-3.5 h-3.5" />
        <span>Library</span>
      </button>
    )}
  </div>
);
