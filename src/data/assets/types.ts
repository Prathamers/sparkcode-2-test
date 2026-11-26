// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlendModeType, ColliderShape } from '../../types/project';
import { renderLivingSvg, type LivingArtSpec } from '../assetArtLiving';
import { renderWorldSvg, type WorldArtSpec } from '../assetArtWorld';
import type { BackdropCategoryId } from '../assetBackdropArt';

export type AssetCategoryId =
  | 'all'
  | 'characters'
  | 'animals'
  | 'monsters'
  | 'space'
  | 'platforms'
  | 'items'
  | 'food_nature'
  | 'vehicles_sports'
  | 'fx_ui'
  | 'letters';

export interface AssetCategoryMeta {
  id: AssetCategoryId;
  label: string;
}

export const ASSET_CATEGORIES: AssetCategoryMeta[] = [
  { id: 'all', label: 'All' },
  { id: 'characters', label: 'Characters' },
  { id: 'animals', label: 'Animals' },
  { id: 'monsters', label: 'Monsters' },
  { id: 'space', label: 'Space & Sci-Fi' },
  { id: 'platforms', label: 'Platforms & Tiles' },
  { id: 'items', label: 'Items & Weapons' },
  { id: 'food_nature', label: 'Food & Nature' },
  { id: 'vehicles_sports', label: 'Vehicles & Sports' },
  { id: 'fx_ui', label: 'FX & UI' },
  { id: 'letters', label: 'Letters & Numbers' },
];

export const BACKDROP_CATEGORIES: Array<{ id: BackdropCategoryId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'space', label: 'Space & Sci-Fi' },
  { id: 'nature', label: 'Nature & Outdoors' },
  { id: 'fantasy', label: 'Fantasy & Dungeon' },
  { id: 'urban', label: 'Urban & Retro' },
  { id: 'abstract', label: 'Abstract & Studio' },
];

export interface SpriteAssetFrame {
  name: string;
  renderSvg: () => string;
}

export interface SpriteAssetDef {
  id: string;
  name: string;
  category: Exclude<AssetCategoryId, 'all'>;
  tags: string[];
  width: number;
  height: number;
  colliderShape?: ColliderShape;
  solidPlatform?: boolean;
  glowLightColor?: string;
  blendMode?: BlendModeType;
  frames: SpriteAssetFrame[];
}

export interface CostumeAssetItem {
  id: string;
  spriteId: string;
  name: string;
  category: Exclude<AssetCategoryId, 'all'>;
  tags: string[];
  width: number;
  height: number;
  renderSvg: () => string;
}

export function livingAsset(
  id: string,
  name: string,
  category: Exclude<AssetCategoryId, 'all'>,
  tags: string[],
  spec: Omit<LivingArtSpec, 'frame'>,
  frameNames: string[] = ['Idle'],
  opts: { width?: number; height?: number; colliderShape?: ColliderShape; glowLightColor?: string } = {}
): SpriteAssetDef {
  return {
    id,
    name,
    category,
    tags: [name.toLowerCase(), category, ...tags],
    width: opts.width ?? 56,
    height: opts.height ?? 56,
    colliderShape: opts.colliderShape ?? 'aabb',
    glowLightColor: opts.glowLightColor,
    frames: frameNames.map((fn, idx) => ({
      name: fn,
      renderSvg: () => renderLivingSvg({ ...spec, frame: idx }),
    })),
  };
}

export function worldAsset(
  id: string,
  name: string,
  category: Exclude<AssetCategoryId, 'all'>,
  tags: string[],
  spec: Omit<WorldArtSpec, 'frame'>,
  frameNames: string[] = ['Default'],
  opts: {
    width?: number;
    height?: number;
    colliderShape?: ColliderShape;
    solidPlatform?: boolean;
    glowLightColor?: string;
    blendMode?: BlendModeType;
  } = {}
): SpriteAssetDef {
  return {
    id,
    name,
    category,
    tags: [name.toLowerCase(), category, ...tags],
    width: opts.width ?? 52,
    height: opts.height ?? 52,
    colliderShape: opts.colliderShape ?? 'aabb',
    solidPlatform: opts.solidPlatform,
    glowLightColor: opts.glowLightColor,
    blendMode: opts.blendMode,
    frames: frameNames.map((fn, idx) => ({
      name: fn,
      renderSvg: () => renderWorldSvg({ ...spec, frame: idx }),
    })),
  };
}
