// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Copy, Library, Plus, Trash2 } from 'lucide-react';
import type {
  BlendModeType,
  ColliderShape,
  EngineTelemetry,
  LightType,
  SpriteData,
} from '../types/project';

interface SpriteInspectorProps {
  sprites: SpriteData[];
  selectedSpriteId: string;
  telemetry: EngineTelemetry;
  onSelectSprite: (id: string) => void;
  onUpdateSprite: (next: SpriteData) => void;
  onAddSprite: () => void;
  onOpenSpriteLibrary: () => void;
  onDuplicateSprite: (id: string) => void;
  onDeleteSprite: (id: string) => void;
}

export const SpriteInspector: React.FC<SpriteInspectorProps> = ({
  sprites,
  selectedSpriteId,
  telemetry,
  onSelectSprite,
  onUpdateSprite,
  onAddSprite,
  onOpenSpriteLibrary,
  onDuplicateSprite,
  onDeleteSprite,
}) => {
  const selected = sprites.find((s) => s.id === selectedSpriteId) ?? sprites[0];
  const liveSelected = telemetry.sprites.find((s) => s.id === selected?.id);
  const activeClones = telemetry.sprites.filter((s) => s.isClone);

  if (!selected) return null;

  const isRunning = telemetry.runState !== 'stopped';
  const displayX = isRunning && liveSelected ? liveSelected.x : selected.x;
  const displayY = isRunning && liveSelected ? liveSelected.y : selected.y;
  const displayRot = isRunning && liveSelected ? liveSelected.rotation : selected.rotation;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#101623]">
      {/* Sprite & Clone Header */}
      <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
          <span>Sprites ({sprites.length})</span>
          {activeClones.length > 0 && (
            <span className="text-sky-400 font-mono text-[11px] tabular-nums">
              +{activeClones.length} live clones
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSpriteLibrary}
            title="Choose a Sprite from Asset Library"
            className="h-6.5 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-[11px] font-medium text-emerald-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Library className="w-3 h-3" />
            <span>Library</span>
          </button>
          <button
            type="button"
            onClick={onAddSprite}
            className="h-6.5 px-2 rounded bg-sky-600/20 hover:bg-sky-600/35 border border-sky-500/40 text-[11px] font-medium text-sky-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3 h-3" />
            <span>Sprite</span>
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5">
        {/* Sprite Thumbnail Grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {sprites.map((sp) => {
            const isSel = sp.id === selected.id;
            const thumb = sp.costumes[sp.activeCostumeIndex]?.previewUrl ?? sp.costumes[0]?.previewUrl;
            return (
              <div
                key={sp.id}
                className={`relative rounded-md border p-1 flex flex-col items-center gap-0.5 transition-colors ${
                  isSel
                    ? 'bg-sky-500/15 border-sky-400'
                    : 'bg-[#151D2D] border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSprite(sp.id)}
                  className="w-full flex flex-col items-center gap-0.5 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-slate-950/70 flex items-center justify-center overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={sp.name}
                        className="w-7 h-7 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded bg-sky-500/40" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-200 truncate w-full text-center">
                    {sp.name}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Sprite Transform & Telemetry */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              aria-label="Sprite name"
              value={selected.name}
              onChange={(e) => onUpdateSprite({ ...selected, name: e.target.value })}
              className="h-7 px-2 flex-1 rounded bg-[#182132] border border-slate-700 font-semibold text-slate-100 text-xs"
            />
            <button
              type="button"
              aria-label={`Duplicate ${selected.name}`}
              title="Duplicate Sprite"
              onClick={() => onDuplicateSprite(selected.id)}
              className="h-7 w-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center justify-center cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {sprites.length > 1 && (
              <button
                type="button"
                aria-label={`Delete ${selected.name}`}
                title="Delete Sprite"
                onClick={() => onDeleteSprite(selected.id)}
                className="h-7 w-7 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 inline-flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live X / Y / Dir / Layer */}
          <div className="grid grid-cols-4 gap-1.5">
            <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
              <span>X</span>
              <input
                type="number"
                aria-label="Sprite X"
                value={displayX}
                onChange={(e) => onUpdateSprite({ ...selected, x: Number(e.target.value) || 0 })}
                className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
              <span>Y</span>
              <input
                type="number"
                aria-label="Sprite Y"
                value={displayY}
                onChange={(e) => onUpdateSprite({ ...selected, y: Number(e.target.value) || 0 })}
                className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
              <span>Dir°</span>
              <input
                type="number"
                aria-label="Sprite Rotation"
                value={displayRot}
                onChange={(e) => onUpdateSprite({ ...selected, rotation: Number(e.target.value) || 0 })}
                className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
              <span>Layer</span>
              <input
                type="number"
                aria-label="Sprite Z Layer"
                value={selected.zIndex}
                onChange={(e) => onUpdateSprite({ ...selected, zIndex: Number(e.target.value) || 0 })}
                className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
              />
            </label>
          </div>

          {/* Scale X/Y & Blend Mode */}
          <div className="grid grid-cols-3 gap-1.5">
            <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
              <span>Scale X</span>
              <input
                type="number"
                step={0.1}
                value={selected.scaleX}
                onChange={(e) => onUpdateSprite({ ...selected, scaleX: Number(e.target.value) || 1 })}
                className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
              <span>Scale Y</span>
              <input
                type="number"
                step={0.1}
                value={selected.scaleY}
                onChange={(e) => onUpdateSprite({ ...selected, scaleY: Number(e.target.value) || 1 })}
                className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
              <span>Blend</span>
              <select
                aria-label="Sprite blend mode"
                value={selected.blendMode}
                onChange={(e) => onUpdateSprite({ ...selected, blendMode: e.target.value as BlendModeType })}
                className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 text-slate-100"
              >
                <option value="normal">Normal</option>
                <option value="add">Add</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
              </select>
            </label>
          </div>

          {/* Physics State Section */}
          <div className="pt-2 border-t border-slate-800/70 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">Rigid-Body Physics</span>
              {liveSelected && (
                <span className="font-mono tabular-nums text-slate-400">
                  v({liveSelected.vx}, {liveSelected.vy}) {liveSelected.onGround ? '· grounded' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.physics.enabled}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      physics: { ...selected.physics, enabled: e.target.checked },
                    })
                  }
                  className="accent-sky-400"
                />
                <span>Enabled</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.physics.isStatic}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      physics: { ...selected.physics, isStatic: e.target.checked },
                    })
                  }
                  className="accent-sky-400"
                />
                <span>Static</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.physics.solid}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      physics: { ...selected.physics, solid: e.target.checked },
                    })
                  }
                  className="accent-sky-400"
                />
                <span>Solid</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
                <span>Collider</span>
                <select
                  value={selected.physics.shape}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      physics: { ...selected.physics, shape: e.target.value as ColliderShape },
                    })
                  }
                  className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 text-slate-100"
                >
                  <option value="aabb">AABB Box</option>
                  <option value="circle">Circle</option>
                </select>
              </label>
              <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
                <span>Bounce</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={1.2}
                  value={selected.physics.restitution}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      physics: { ...selected.physics, restitution: Number(e.target.value) || 0 },
                    })
                  }
                  className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
                <span>Friction</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={1}
                  value={selected.physics.friction}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      physics: { ...selected.physics, friction: Number(e.target.value) || 0 },
                    })
                  }
                  className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
                />
              </label>
            </div>
          </div>

          {/* 2D Light Source Config */}
          <div className="pt-2 border-t border-slate-800/70 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">2D Lighting & Shadows</span>
              <label className="inline-flex items-center gap-1.5 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.light.castsShadow}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      light: { ...selected.light, castsShadow: e.target.checked },
                    })
                  }
                  className="accent-sky-400"
                />
                <span>Casts Shadow</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
                <span>Type</span>
                <select
                  value={selected.light.type}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      light: { ...selected.light, type: e.target.value as LightType },
                    })
                  }
                  className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 text-slate-100"
                >
                  <option value="none">None</option>
                  <option value="point">Point</option>
                  <option value="spot">Spotlight</option>
                </select>
              </label>
              <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
                <span>Radius</span>
                <input
                  type="number"
                  step={10}
                  value={selected.light.radius}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      light: { ...selected.light, radius: Number(e.target.value) || 100 },
                    })
                  }
                  className="h-7 px-1.5 rounded bg-[#182132] border border-slate-700 font-mono tabular-nums text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-0.5 text-[10.5px] text-slate-400">
                <span>Color</span>
                <input
                  type="color"
                  value={selected.light.color}
                  onChange={(e) =>
                    onUpdateSprite({
                      ...selected,
                      light: { ...selected.light, color: e.target.value },
                    })
                  }
                  className="w-full h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
