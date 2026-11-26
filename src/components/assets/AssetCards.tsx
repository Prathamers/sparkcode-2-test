// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useEffect, useMemo, useState } from 'react';
import { Check, Film, Layers, Plus } from 'lucide-react';
import {
  getBackdropPreviewUrl,
  getCachedSvgUrl,
  type BackdropAssetDef,
  type CostumeAssetItem,
  type SpriteAssetDef,
} from '../../data/assetLibrary';

export const SpriteAssetCard: React.FC<{
  asset: SpriteAssetDef;
  onAddSprite: (asset: SpriteAssetDef) => void;
  onAddAsCostume: (asset: SpriteAssetDef) => void;
}> = React.memo(({ asset, onAddSprite, onAddAsCostume }) => {
  const [hovered, setHovered] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    if (!hovered || asset.frames.length <= 1) {
      setFrameIdx(0);
      return;
    }
    const timer = window.setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % asset.frames.length);
    }, 340);
    return () => window.clearInterval(timer);
  }, [hovered, asset.frames.length]);

  const activeFrame = asset.frames[frameIdx] ?? asset.frames[0];
  const previewUrl = useMemo(
    () => getCachedSvgUrl(`${asset.id}:${frameIdx}`, activeFrame.renderSvg),
    [asset.id, frameIdx, activeFrame]
  );

  return (
    <div
      data-testid={`asset-sprite-${asset.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative rounded-lg bg-[#111827] border border-slate-800/90 hover:border-sky-400/80 transition-all overflow-hidden flex flex-col shadow-xs"
    >
      <button
        type="button"
        onClick={() => onAddSprite(asset)}
        className="w-full text-left flex flex-col cursor-pointer focus:outline-none"
      >
        <div className="relative h-24 w-full spark-checker-bg flex items-center justify-center p-2 overflow-hidden">
          <img
            src={previewUrl}
            alt={asset.name}
            loading="lazy"
            className="max-h-18 max-w-full object-contain transition-transform duration-150 group-hover:scale-108"
          />

          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
            {asset.frames.length > 1 && (
              <span
                title={`${asset.frames.length} animated costumes`}
                className="px-1.5 py-0.5 rounded bg-slate-900/85 border border-slate-700/80 text-[9.5px] font-mono font-semibold text-sky-300 inline-flex items-center gap-0.5"
              >
                <Film className="w-2.5 h-2.5" />
                {asset.frames.length}
              </span>
            )}
            {asset.solidPlatform && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-[9.5px] font-semibold text-emerald-300">
                Solid
              </span>
            )}
            {asset.glowLightColor && (
              <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/40 text-[9.5px] font-semibold text-amber-300">
                Light
              </span>
            )}
          </div>
        </div>

        <div className="px-2.5 py-2 flex items-center justify-between gap-1.5 border-t border-slate-800/80">
          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold text-slate-100 truncate">
              {asset.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {asset.width}×{asset.height}
            </div>
          </div>
          <span className="w-6 h-6 rounded-md bg-sky-600/20 group-hover:bg-sky-600 text-sky-300 group-hover:text-white inline-flex items-center justify-center transition-colors shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddAsCostume(asset);
        }}
        title="Add artwork as a costume frame to selected sprite"
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute top-1.5 right-1.5 h-6 px-1.5 rounded bg-slate-900/90 hover:bg-sky-600 border border-slate-700 text-[10px] font-medium text-slate-200 hover:text-white inline-flex items-center gap-0.5 cursor-pointer"
      >
        <Layers className="w-2.5 h-2.5" />
        <span>Costume</span>
      </button>
    </div>
  );
});

export const CostumeAssetCard: React.FC<{
  item: CostumeAssetItem;
  onAddCostume: (item: CostumeAssetItem, replaceActive?: boolean) => void;
}> = React.memo(({ item, onAddCostume }) => {
  const previewUrl = useMemo(
    () => getCachedSvgUrl(item.id, item.renderSvg),
    [item.id, item.renderSvg]
  );

  return (
    <div
      data-testid={`asset-costume-${item.id}`}
      className="group relative rounded-lg bg-[#111827] border border-slate-800/90 hover:border-emerald-400/80 transition-all overflow-hidden flex flex-col shadow-xs"
    >
      <button
        type="button"
        onClick={() => onAddCostume(item, false)}
        className="w-full text-left flex flex-col cursor-pointer focus:outline-none"
      >
        <div className="h-24 w-full spark-checker-bg flex items-center justify-center p-2 overflow-hidden">
          <img
            src={previewUrl}
            alt={item.name}
            loading="lazy"
            className="max-h-18 max-w-full object-contain transition-transform duration-150 group-hover:scale-108"
          />
        </div>
        <div className="px-2.5 py-2 flex items-center justify-between gap-1.5 border-t border-slate-800/80">
          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold text-slate-100 truncate">
              {item.name}
            </div>
            <div className="text-[10px] text-slate-400">
              {item.width}×{item.height}
            </div>
          </div>
          <span className="w-6 h-6 rounded-md bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white inline-flex items-center justify-center transition-colors shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddCostume(item, true);
        }}
        title="Replace active costume frame"
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute top-1.5 right-1.5 h-6 px-1.5 rounded bg-slate-900/90 hover:bg-amber-500 border border-slate-700 text-[10px] font-medium text-slate-200 hover:text-slate-950 cursor-pointer"
      >
        Replace
      </button>
    </div>
  );
});

export const BackdropAssetCard: React.FC<{
  backdrop: BackdropAssetDef;
  isActive: boolean;
  onSelect: (backdrop: BackdropAssetDef) => void;
}> = React.memo(({ backdrop, isActive, onSelect }) => {
  const previewUrl = useMemo(() => getBackdropPreviewUrl(backdrop), [backdrop]);

  return (
    <button
      type="button"
      data-testid={`asset-backdrop-${backdrop.id}`}
      onClick={() => onSelect(backdrop)}
      className={`group text-left rounded-lg bg-[#111827] border transition-all overflow-hidden flex flex-col cursor-pointer shadow-xs ${
        isActive
          ? 'border-sky-400 ring-1 ring-sky-400/50'
          : 'border-slate-800/90 hover:border-sky-400/75'
      }`}
    >
      <div className="relative aspect-[14/9] w-full bg-[#090F1E] overflow-hidden">
        <img
          src={previewUrl}
          alt={backdrop.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-104"
        />
        {isActive && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-semibold inline-flex items-center gap-1 shadow">
            <Check className="w-3 h-3" />
            Active
          </span>
        )}
        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700/80 text-[9.5px] font-mono text-slate-200">
          {backdrop.backgroundShader}
        </span>
      </div>
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-100 truncate">{backdrop.name}</div>
          <div className="text-[10.5px] text-slate-400 capitalize">{backdrop.category}</div>
        </div>
        <span className="text-[10.5px] font-medium text-sky-400 group-hover:underline shrink-0">
          Apply
        </span>
      </div>
    </button>
  );
});
