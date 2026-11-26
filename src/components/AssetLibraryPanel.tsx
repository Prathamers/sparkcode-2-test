// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Film,
  Image as ImageIcon,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  ASSET_BACKDROPS,
  ASSET_CATEGORIES,
  ASSET_COSTUMES,
  ASSET_SPRITES,
  applyLibraryBackdrop,
  BACKDROP_CATEGORIES,
  createCostumeFromDataUrl,
  createSpriteFromDataUrl,
  getBackdropPreviewUrl,
  getCachedSvgUrl,
  instantiateLibraryCostume,
  instantiateLibrarySprite,
  searchBackdropAssets,
  searchCostumeAssets,
  searchSpriteAssets,
  type AssetCategoryId,
  type BackdropAssetDef,
  type BackdropCategoryId,
  type CostumeAssetItem,
  type SpriteAssetDef,
} from '../data/assetLibrary';
import type { CostumeData, SpriteData, StageSettings } from '../types/project';

export type AssetLibraryMode = 'sprites' | 'costumes' | 'backdrops';

interface AssetLibraryPanelProps {
  mode: AssetLibraryMode;
  onChangeMode: (mode: AssetLibraryMode) => void;
  selectedSprite: SpriteData;
  existingSpriteCount: number;
  stage: StageSettings;
  onAddSprite: (sprite: SpriteData) => void;
  onAddCostume: (costume: CostumeData, replaceActive?: boolean) => void;
  onApplyBackdrop: (nextStage: StageSettings, label: string) => void;
}

const SpriteAssetCard: React.FC<{
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

          {/* Attribute badges */}
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

      {/* Secondary quick action: add artwork as a costume to the currently selected sprite */}
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

const CostumeAssetCard: React.FC<{
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

const BackdropAssetCard: React.FC<{
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

export const AssetLibraryPanel: React.FC<AssetLibraryPanelProps> = ({
  mode,
  onChangeMode,
  selectedSprite,
  existingSpriteCount,
  stage,
  onAddSprite,
  onAddCostume,
  onApplyBackdrop,
}) => {
  const [query, setQuery] = useState('');
  const [spriteCategory, setSpriteCategory] = useState<AssetCategoryId>('all');
  const [backdropCategory, setBackdropCategory] = useState<BackdropCategoryId>('all');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const filteredSprites = useMemo(
    () => searchSpriteAssets(query, spriteCategory),
    [query, spriteCategory]
  );

  const filteredCostumes = useMemo(
    () => searchCostumeAssets(query, spriteCategory),
    [query, spriteCategory]
  );

  const filteredBackdrops = useMemo(
    () => searchBackdropAssets(query, backdropCategory),
    [query, backdropCategory]
  );

  const spriteCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ASSET_SPRITES.length };
    for (const item of ASSET_SPRITES) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const costumeCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ASSET_COSTUMES.length };
    for (const item of ASSET_COSTUMES) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const backdropCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ASSET_BACKDROPS.length };
    for (const item of ASSET_BACKDROPS) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const handlePickSprite = (asset: SpriteAssetDef) => {
    const newSprite = instantiateLibrarySprite(asset, existingSpriteCount);
    onAddSprite(newSprite);
  };

  const handlePickSpriteAsCostume = (asset: SpriteAssetDef) => {
    const firstFrame = asset.frames[0];
    if (!firstFrame) return;
    const costumeItem: CostumeAssetItem = {
      id: `${asset.id}_f0`,
      spriteId: asset.id,
      name: asset.name,
      category: asset.category,
      tags: asset.tags,
      width: asset.width,
      height: asset.height,
      renderSvg: firstFrame.renderSvg,
    };
    onAddCostume(instantiateLibraryCostume(costumeItem), false);
  };

  const handlePickCostume = (item: CostumeAssetItem, replaceActive = false) => {
    onAddCostume(instantiateLibraryCostume(item), replaceActive);
  };

  const handlePickBackdrop = (backdrop: BackdropAssetDef) => {
    onApplyBackdrop(applyLibraryBackdrop(stage, backdrop), backdrop.name);
  };

  const handleClearBackdrop = () => {
    onApplyBackdrop(
      {
        ...stage,
        backdropUrl: undefined,
        backdropName: undefined,
      },
      'Cleared custom backdrop'
    );
  };

  const handleSurprise = () => {
    if (mode === 'sprites') {
      const pool = filteredSprites.length > 0 ? filteredSprites : ASSET_SPRITES;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) handlePickSprite(pick);
    } else if (mode === 'costumes') {
      const pool = filteredCostumes.length > 0 ? filteredCostumes : ASSET_COSTUMES;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) handlePickCostume(pick, false);
    } else {
      const pool = filteredBackdrops.length > 0 ? filteredBackdrops : ASSET_BACKDROPS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) handlePickBackdrop(pick);
    }
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 64;
        const h = img.naturalHeight || 64;
        if (mode === 'backdrops') {
          const cleanName = file.name.replace(/\.[^.]+$/, '') || 'Custom Backdrop';
          onApplyBackdrop(
            {
              ...stage,
              backdropUrl: dataUrl,
              backdropName: cleanName,
            },
            cleanName
          );
        } else if (mode === 'costumes') {
          const scaledW = Math.min(180, Math.max(24, w > 180 ? Math.round((w / Math.max(w, h)) * 96) : w));
          const scaledH = Math.min(180, Math.max(24, h > 180 ? Math.round((h / Math.max(w, h)) * 96) : h));
          const cleanName = file.name.replace(/\.[^.]+$/, '') || 'Uploaded Costume';
          onAddCostume(createCostumeFromDataUrl(cleanName, dataUrl, scaledW, scaledH), false);
        } else {
          const scaledW = Math.min(180, Math.max(24, w > 180 ? Math.round((w / Math.max(w, h)) * 96) : w));
          const scaledH = Math.min(180, Math.max(24, h > 180 ? Math.round((h / Math.max(w, h)) * 96) : h));
          onAddSprite(createSpriteFromDataUrl(file.name, dataUrl, scaledW, scaledH));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const activeTotalCount =
    mode === 'sprites'
      ? filteredSprites.length
      : mode === 'costumes'
        ? filteredCostumes.length
        : filteredBackdrops.length;

  return (
    <div
      data-testid="asset-library-panel"
      className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0D121C]"
    >
      {/* Top Library Controls */}
      <div className="px-4 py-3 bg-[#101623] border-b border-slate-800/90 flex flex-col gap-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Library Section Switcher (Sprites | Costumes | Backdrops) */}
          <div
            role="tablist"
            aria-label="Asset library sections"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#0B0F17] border border-slate-800/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'sprites'}
              onClick={() => onChangeMode('sprites')}
              className={`h-7.5 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'sprites'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sprites</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950/35 text-[10px] font-mono tabular-nums">
                {ASSET_SPRITES.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'costumes'}
              onClick={() => onChangeMode('costumes')}
              className={`h-7.5 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'costumes'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Costumes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950/35 text-[10px] font-mono tabular-nums">
                {ASSET_COSTUMES.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'backdrops'}
              onClick={() => onChangeMode('backdrops')}
              className={`h-7.5 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'backdrops'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Backdrops</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950/35 text-[10px] font-mono tabular-nums">
                {ASSET_BACKDROPS.length}
              </span>
            </button>
          </div>

          {/* Search + Surprise Me + Upload */}
          <div className="flex flex-1 min-w-[220px] items-center justify-end gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Search asset library"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${mode} (cat, rocket, grass, coin...)`}
                className="w-full h-8 pl-8 pr-7 rounded-md bg-[#161E2E] border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear asset search"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSurprise}
              title="Add a random asset from this library"
              className="h-8 px-2.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Surprise</span>
            </button>

            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              title="Upload custom PNG, SVG, or JPG image"
              className="h-8 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={handleUploadImage}
              className="hidden"
              aria-label="Upload custom image asset"
            />
          </div>
        </div>

        {/* Category Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {mode === 'backdrops'
            ? BACKDROP_CATEGORIES.map((cat) => {
                const active = backdropCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setBackdropCategory(cat.id)}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      active
                        ? 'bg-sky-600 text-white'
                        : 'bg-[#161E2E] text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] opacity-75 font-mono tabular-nums">
                      {backdropCategoryCounts[cat.id] ?? 0}
                    </span>
                  </button>
                );
              })
            : ASSET_CATEGORIES.map((cat) => {
                const active = spriteCategory === cat.id;
                const count =
                  mode === 'sprites'
                    ? spriteCategoryCounts[cat.id] ?? 0
                    : costumeCategoryCounts[cat.id] ?? 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSpriteCategory(cat.id)}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      active
                        ? mode === 'costumes'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-sky-600 text-white'
                        : 'bg-[#161E2E] text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] opacity-75 font-mono tabular-nums">{count}</span>
                  </button>
                );
              })}
        </div>

        {/* Helpful Context Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>
            {mode === 'sprites' &&
              'Click any sprite to add it to your Stage. Hover multi-frame sprites to preview animation.'}
            {mode === 'costumes' && (
              <>
                Adding costume frames to{' '}
                <strong className="text-emerald-300">{selectedSprite.name}</strong> (click to append,
                or hover → Replace).
              </>
            )}
            {mode === 'backdrops' &&
              'Click any backdrop to apply its scene, background shader, and ambient lighting to the Stage.'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {mode === 'backdrops' && stage.backdropUrl && (
              <button
                type="button"
                onClick={handleClearBackdrop}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10.5px] text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Backdrop Image</span>
              </button>
            )}
            <span className="font-mono tabular-nums text-slate-400">
              {activeTotalCount} {activeTotalCount === 1 ? 'result' : 'results'}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Library Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTotalCount === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center gap-2 text-slate-400">
            <Search className="w-8 h-8 text-slate-500" />
            <div className="text-sm font-semibold text-slate-200">No matching assets found</div>
            <div className="text-xs max-w-sm">
              Try a different keyword (like &ldquo;cat&rdquo;, &ldquo;rocket&rdquo;, &ldquo;coin&rdquo;, &ldquo;platform&rdquo;, or &ldquo;space&rdquo;) or clear your filters.
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSpriteCategory('all');
                setBackdropCategory('all');
              }}
              className="mt-1 h-8 px-3 rounded-md bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : mode === 'sprites' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredSprites.map((asset) => (
              <SpriteAssetCard
                key={asset.id}
                asset={asset}
                onAddSprite={handlePickSprite}
                onAddAsCostume={handlePickSpriteAsCostume}
              />
            ))}
          </div>
        ) : mode === 'costumes' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredCostumes.map((item) => (
              <CostumeAssetCard
                key={item.id}
                item={item}
                onAddCostume={handlePickCostume}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredBackdrops.map((backdrop) => (
              <BackdropAssetCard
                key={backdrop.id}
                backdrop={backdrop}
                isActive={stage.backdropName === backdrop.name}
                onSelect={handlePickBackdrop}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
