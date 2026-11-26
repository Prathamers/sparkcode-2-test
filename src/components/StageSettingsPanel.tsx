// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, FlaskConical, Image as ImageIcon, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { SupporterTierId } from '../data/supporters';
import type {
  BackgroundShaderType,
  EngineTelemetry,
  RuntimeValue,
  SparkProject,
  StageSettings,
} from '../types/project';

interface StageSettingsPanelProps {
  project: SparkProject;
  supporterTier: SupporterTierId | null;
  renderBackend?: EngineTelemetry['renderBackend'];
  onChangeStage: (stage: StageSettings) => void;
  onChangeGlobals: (globals: Record<string, RuntimeValue>, watchedGlobals: string[]) => void;
  onOpenExperimentalTab: () => void;
  onOpenBackdropLibrary?: () => void;
}

const SHADERS: Array<{ id: BackgroundShaderType; label: string }> = [
  { id: 'synthwave', label: 'Perspective Synth Grid' },
  { id: 'starfield', label: 'Parallax Starfield' },
  { id: 'nebula', label: 'Procedural Nebula' },
  { id: 'grid', label: 'Studio Coordinate Grid' },
  { id: 'solid', label: 'Solid Gradient' },
];

export const StageSettingsPanel: React.FC<StageSettingsPanelProps> = ({
  project,
  supporterTier,
  renderBackend,
  onChangeStage,
  onChangeGlobals,
  onOpenExperimentalTab,
  onOpenBackdropLibrary,
}) => {
  const { stage } = project;
  const [newVarName, setNewVarName] = useState('');
  const [newVarKind, setNewVarKind] = useState<'number' | 'string' | 'array' | 'dict'>('number');
  const [newVarVal, setNewVarVal] = useState('0');

  const updateStage = (patch: Partial<StageSettings>) => {
    onChangeStage({ ...stage, ...patch });
  };

  const handleAddGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    const key = newVarName.trim();
    if (!key) return;
    let parsed: RuntimeValue = 0;
    if (newVarKind === 'number') parsed = Number(newVarVal) || 0;
    else if (newVarKind === 'string') parsed = newVarVal;
    else if (newVarKind === 'array') parsed = [];
    else parsed = {};

    const nextGlobals = { ...project.globals, [key]: parsed };
    const nextWatched = project.watchedGlobals.includes(key)
      ? project.watchedGlobals
      : [...project.watchedGlobals, key];
    onChangeGlobals(nextGlobals, nextWatched);
    setNewVarName('');
    setNewVarVal('0');
  };

  const handleDeleteGlobal = (key: string) => {
    const nextGlobals = { ...project.globals };
    delete nextGlobals[key];
    onChangeGlobals(
      nextGlobals,
      project.watchedGlobals.filter((w) => w !== key)
    );
  };

  const handleToggleWatch = (key: string) => {
    const watched = project.watchedGlobals.includes(key)
      ? project.watchedGlobals.filter((w) => w !== key)
      : [...project.watchedGlobals, key];
    onChangeGlobals(project.globals, watched);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 bg-[#0D121C]">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Physics & World Forces */}
        <section className="p-4 rounded-lg bg-[#111827] border border-slate-800/90">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">World Physics & Gravity</h2>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Gravity X (px/s²)</span>
              <input
                type="number"
                value={stage.gravityX}
                onChange={(e) => updateStage({ gravityX: Number(e.target.value) || 0 })}
                className="h-8 px-2.5 rounded bg-[#182132] border border-slate-700 font-mono text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Gravity Y (px/s²)</span>
              <input
                type="number"
                value={stage.gravityY}
                onChange={(e) => updateStage({ gravityY: Number(e.target.value) || 0 })}
                className="h-8 px-2.5 rounded bg-[#182132] border border-slate-700 font-mono text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Air Drag ({stage.airDrag.toFixed(2)})</span>
              <input
                type="range"
                min={0}
                max={4}
                step={0.05}
                value={stage.airDrag}
                onChange={(e) => updateStage({ airDrag: Number(e.target.value) })}
                className="mt-2 accent-sky-400"
              />
            </label>
          </div>
        </section>

        {/* Lighting & Background Shader */}
        <section className="p-4 rounded-lg bg-[#111827] border border-slate-800/90">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Lighting & Background Shader</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Background Shader</span>
              <select
                aria-label="Background shader"
                value={stage.backgroundShader}
                onChange={(e) => updateStage({ backgroundShader: e.target.value as BackgroundShaderType })}
                className="h-8 px-2.5 rounded bg-[#182132] border border-slate-700 text-slate-100"
              >
                {SHADERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-slate-400">
                <span>Top Color</span>
                <input
                  type="color"
                  value={stage.bgColorA}
                  onChange={(e) => updateStage({ bgColorA: e.target.value })}
                  className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-slate-400">
                <span>Bottom Color</span>
                <input
                  type="color"
                  value={stage.bgColorB}
                  onChange={(e) => updateStage({ bgColorB: e.target.value })}
                  className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Ambient Darkness ({Math.round(stage.ambientDarkness * 100)}%)</span>
              <input
                type="range"
                aria-label="Ambient darkness"
                min={0}
                max={0.92}
                step={0.02}
                value={stage.ambientDarkness}
                onChange={(e) => updateStage({ ambientDarkness: Number(e.target.value) })}
                className="accent-sky-400"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Ambient Shadow Tint</span>
              <input
                type="color"
                value={stage.ambientColor}
                onChange={(e) => updateStage({ ambientColor: e.target.value })}
                className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
            </label>
          </div>

          {/* Asset Library Stage Backdrop */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              {stage.backdropUrl ? (
                <img
                  src={stage.backdropUrl}
                  alt={stage.backdropName ?? 'Stage backdrop'}
                  className="w-14 h-9 rounded border border-slate-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-9 rounded border border-dashed border-slate-700 bg-[#0B0F17] flex items-center justify-center text-slate-500 shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-slate-200 truncate">
                  {stage.backdropName ? `Backdrop: ${stage.backdropName}` : 'No Scene Backdrop Applied'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Browse illustrated scenes and matched lighting presets in the Asset Library.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {stage.backdropUrl && (
                <button
                  type="button"
                  onClick={() => updateStage({ backdropUrl: undefined, backdropName: undefined })}
                  className="h-8 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
              {onOpenBackdropLibrary && (
                <button
                  type="button"
                  onClick={onOpenBackdropLibrary}
                  className="h-8 px-3 rounded-md bg-sky-600/20 hover:bg-sky-600/35 border border-sky-500/40 text-sky-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Backdrop Library</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Experimental Labs Callout (WebGL2 Hardware Shadow & Bloom Pass + Improved SparkVM) */}
        <section className="p-4 rounded-lg bg-[#111827] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 inline-flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <span>WebGL2 Hardware Shadow &amp; Bloom Pass · Improved SparkVM</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              GPU normal-mapped lighting, soft shadows, HDR bloom, and Improved SparkVM are managed in the{' '}
              <span className="text-amber-300 font-medium">Experimental</span> tab (Elite Member only). Active renderer:{' '}
              <span className="font-mono text-slate-200">
                {supporterTier === 'elite' && renderBackend?.active === 'webgl2'
                  ? 'WebGL2 GPU'
                  : '2D Canvas'}
              </span>
              .
            </p>
          </div>
          {supporterTier === 'pro' || supporterTier === 'elite' ? (
            <button
              type="button"
              onClick={onOpenExperimentalTab}
              className="h-8 px-3 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <span>Open Experimental Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="relative group inline-flex shrink-0">
              <button
                type="button"
                aria-disabled="true"
                title="Available to selected members only"
                onClick={(e) => e.preventDefault()}
                className="h-8 px-3 rounded-md bg-slate-800/50 border border-slate-700/70 text-slate-500 opacity-55 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-not-allowed select-none"
              >
                <span>Open Experimental Tab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 absolute bottom-full right-0 mb-2 z-50 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-100 whitespace-nowrap shadow-lg"
              >
                Available to selected members only
              </div>
            </div>
          )}
        </section>

        {/* Camera Bounds & Post-Processing FX */}
        <section className="p-4 rounded-lg bg-[#111827] border border-slate-800/90">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Camera & Stage Post-Processing FX</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Default Zoom ({stage.defaultZoom.toFixed(2)}x)</span>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={stage.defaultZoom}
                onChange={(e) => updateStage({ defaultZoom: Number(e.target.value) })}
                className="accent-sky-400"
              />
            </label>
            <label className="flex items-center gap-2 text-slate-300 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={stage.cameraBounds.enabled}
                onChange={(e) =>
                  updateStage({ cameraBounds: { ...stage.cameraBounds, enabled: e.target.checked } })
                }
                className="accent-sky-400"
              />
              <span>Clamp Camera Within Bounds</span>
            </label>

            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Vignette ({Math.round(stage.stageEffects.vignette * 100)}%)</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={stage.stageEffects.vignette}
                onChange={(e) =>
                  updateStage({
                    stageEffects: { ...stage.stageEffects, vignette: Number(e.target.value) },
                  })
                }
                className="accent-sky-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Chromatic Aberration ({stage.stageEffects.chromatic.toFixed(1)}px)</span>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={stage.stageEffects.chromatic}
                onChange={(e) =>
                  updateStage({
                    stageEffects: { ...stage.stageEffects, chromatic: Number(e.target.value) },
                  })
                }
                className="accent-sky-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Pixelate ({stage.stageEffects.pixelate}px)</span>
              <input
                type="range"
                min={0}
                max={14}
                step={1}
                value={stage.stageEffects.pixelate}
                onChange={(e) =>
                  updateStage({
                    stageEffects: { ...stage.stageEffects, pixelate: Number(e.target.value) },
                  })
                }
                className="accent-sky-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-slate-400">
              <span>Screen Tint ({Math.round(stage.stageEffects.tintAmount * 100)}%)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={stage.stageEffects.tint || '#38BDF8'}
                  onChange={(e) =>
                    updateStage({
                      stageEffects: { ...stage.stageEffects, tint: e.target.value },
                    })
                  }
                  className="w-8 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="range"
                  min={0}
                  max={0.6}
                  step={0.05}
                  value={stage.stageEffects.tintAmount}
                  onChange={(e) =>
                    updateStage({
                      stageEffects: { ...stage.stageEffects, tintAmount: Number(e.target.value) },
                    })
                  }
                  className="flex-1 accent-sky-400"
                />
              </div>
            </label>
          </div>
        </section>

        {/* Global Variables, Arrays & Dictionaries */}
        <section className="p-4 rounded-lg bg-[#111827] border border-slate-800/90">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Global Variables, 2D Arrays & Dictionaries
          </h2>

          <form onSubmit={handleAddGlobal} className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            <input
              type="text"
              aria-label="New global variable name"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="Variable name (e.g. inventory)"
              className="h-8 px-2.5 flex-1 min-w-[140px] rounded bg-[#182132] border border-slate-700 font-mono text-slate-100"
            />
            <select
              aria-label="Variable type"
              value={newVarKind}
              onChange={(e) => setNewVarKind(e.target.value as 'number' | 'string' | 'array' | 'dict')}
              className="h-8 px-2 rounded bg-[#182132] border border-slate-700 text-slate-100"
            >
              <option value="number">Number</option>
              <option value="string">String</option>
              <option value="array">Array []</option>
              <option value="dict">Dictionary {'{}'}</option>
            </select>
            {(newVarKind === 'number' || newVarKind === 'string') && (
              <input
                type="text"
                aria-label="Initial value"
                value={newVarVal}
                onChange={(e) => setNewVarVal(e.target.value)}
                placeholder="Initial value"
                className="h-8 w-24 px-2.5 rounded bg-[#182132] border border-slate-700 font-mono text-slate-100"
              />
            )}
            <button
              type="submit"
              className="h-8 px-3 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-md overflow-hidden">
            {Object.entries(project.globals).length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">No global variables defined.</div>
            ) : (
              Object.entries(project.globals).map(([key, val]) => {
                const isWatched = project.watchedGlobals.includes(key);
                return (
                  <div
                    key={key}
                    className="px-3 py-2 bg-[#141C2B] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-semibold text-emerald-300">{key}</span>
                      <span className="font-mono text-slate-300 truncate">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleWatch(key)}
                        aria-label={`Toggle stage watcher for ${key}`}
                        className={`h-6.5 px-2 rounded text-[11px] inline-flex items-center gap-1 cursor-pointer ${
                          isWatched
                            ? 'bg-sky-600/25 text-sky-300 border border-sky-500/40'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isWatched ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isWatched ? 'Watched' : 'Watch'}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete variable ${key}`}
                        onClick={() => handleDeleteGlobal(key)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
