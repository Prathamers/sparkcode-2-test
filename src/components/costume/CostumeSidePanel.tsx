// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Layers, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { ProceduralPreset } from '../../engine/procedural';
import type { CostumeLayer } from '../../types/project';
import { PROCEDURAL_PRESETS } from './drawing';

interface CostumeSidePanelProps {
  layers: CostumeLayer[];
  activeLayerId: string;
  procPreset: ProceduralPreset;
  secondaryColor: string;
  procSeed: number;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onToggleLayerVis: (layerId: string) => void;
  onMoveLayer: (layerId: string, dir: -1 | 1) => void;
  onDeleteLayer: (layerId: string) => void;
  onChangeProcPreset: (preset: ProceduralPreset) => void;
  onChangeSecondaryColor: (color: string) => void;
  onChangeProcSeed: (seed: number) => void;
  onGenerateProcedural: () => void;
}

export const CostumeSidePanel: React.FC<CostumeSidePanelProps> = ({
  layers,
  activeLayerId,
  procPreset,
  secondaryColor,
  procSeed,
  onSelectLayer,
  onAddLayer,
  onToggleLayerVis,
  onMoveLayer,
  onDeleteLayer,
  onChangeProcPreset,
  onChangeSecondaryColor,
  onChangeProcSeed,
  onGenerateProcedural,
}) => (
  <div className="w-[228px] shrink-0 bg-[#101623] border-l border-slate-800/80 flex flex-col overflow-y-auto divide-y divide-slate-800/80">
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Layers ({layers.length})</span>
        </div>
        <button
          type="button"
          aria-label="Add costume layer"
          onClick={onAddLayer}
          className="h-6 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {[...layers].reverse().map((layer) => {
          const isSelected = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded text-xs border transition-colors ${
                isSelected
                  ? 'bg-sky-500/15 border-sky-500/50 text-white'
                  : 'bg-[#161E2E] border-slate-800 text-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                className="flex-1 text-left truncate cursor-pointer"
              >
                {layer.name}
              </button>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  aria-label={`Toggle visibility for ${layer.name}`}
                  onClick={() => onToggleLayerVis(layer.id)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  aria-label={`Move ${layer.name} up`}
                  onClick={() => onMoveLayer(layer.id, 1)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${layer.name} down`}
                  onClick={() => onMoveLayer(layer.id, -1)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                {layers.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Delete ${layer.name}`}
                    onClick={() => onDeleteLayer(layer.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span>Procedural Generator</span>
      </div>
      <label className="flex flex-col gap-1 text-[11px] text-slate-400">
        <span>Algorithm Preset</span>
        <select
          aria-label="Procedural texture preset"
          value={procPreset}
          onChange={(e) => onChangeProcPreset(e.target.value as ProceduralPreset)}
          className="h-7.5 px-2 rounded bg-[#161E2E] border border-slate-700 text-xs text-slate-100"
        >
          {PROCEDURAL_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.group}: {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Secondary</span>
          <input
            type="color"
            aria-label="Procedural secondary color"
            value={secondaryColor}
            onChange={(e) => onChangeSecondaryColor(e.target.value)}
            className="w-full h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Seed</span>
          <input
            type="number"
            aria-label="Procedural seed"
            value={procSeed}
            onChange={(e) => onChangeProcSeed(Number(e.target.value) || 1)}
            className="h-7 px-2 rounded bg-[#161E2E] border border-slate-700 text-xs font-mono text-slate-100"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onGenerateProcedural}
        className="h-8 rounded-md bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors cursor-pointer"
      >
        Generate on Active Layer
      </button>
    </div>
  </div>
);
