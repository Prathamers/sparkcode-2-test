// SPDX-License-Identifier: AGPL-3.0-or-later
import { createUid } from '../engine/blocks';
import type { CostumeData, SpriteData, StageSettings } from '../types/project';
import {
  ASSET_BACKDROPS,
  getBackdropPreviewUrl,
  type BackdropAssetDef,
  type BackdropCategoryId,
} from './assetBackdropArt';
import { svgToDataUrl } from './assetSvgHelpers';
import { ANIMAL_ASSETS, CHARACTER_ASSETS, MONSTER_ASSETS } from './assets/catalogLiving';
import {
  FOOD_NATURE_ASSETS,
  FX_UI_ASSETS,
  ITEM_ASSETS,
  LETTER_ASSETS,
  PLATFORM_ASSETS,
  SPACE_ASSETS,
  VEHICLE_SPORTS_ASSETS,
} from './assets/catalogWorld';
import {
  ASSET_CATEGORIES,
  BACKDROP_CATEGORIES,
  type AssetCategoryId,
  type AssetCategoryMeta,
  type CostumeAssetItem,
  type SpriteAssetDef,
  type SpriteAssetFrame,
} from './assets/types';
import { createSpriteTemplate, defaultLight, defaultPhysics } from './templates/shared';

export type {
  AssetCategoryId,
  AssetCategoryMeta,
  BackdropAssetDef,
  BackdropCategoryId,
  CostumeAssetItem,
  SpriteAssetDef,
  SpriteAssetFrame,
};
export { ASSET_BACKDROPS, ASSET_CATEGORIES, BACKDROP_CATEGORIES, getBackdropPreviewUrl };

const dataUrlCache = new Map<string, string>();

export function getCachedSvgUrl(cacheKey: string, renderSvg: () => string): string {
  let url = dataUrlCache.get(cacheKey);
  if (!url) {
    url = svgToDataUrl(renderSvg());
    dataUrlCache.set(cacheKey, url);
  }
  return url;
}

export const ASSET_SPRITES: SpriteAssetDef[] = [
  ...CHARACTER_ASSETS,
  ...ANIMAL_ASSETS,
  ...MONSTER_ASSETS,
  ...SPACE_ASSETS,
  ...PLATFORM_ASSETS,
  ...ITEM_ASSETS,
  ...FOOD_NATURE_ASSETS,
  ...VEHICLE_SPORTS_ASSETS,
  ...FX_UI_ASSETS,
  ...LETTER_ASSETS,
];

export const ASSET_COSTUMES: CostumeAssetItem[] = ASSET_SPRITES.flatMap((sprite) =>
  sprite.frames.map((frame, idx) => ({
    id: `${sprite.id}_f${idx}`,
    spriteId: sprite.id,
    name: sprite.frames.length > 1 ? `${sprite.name} (${frame.name})` : sprite.name,
    category: sprite.category,
    tags: [...sprite.tags, frame.name.toLowerCase()],
    width: sprite.width,
    height: sprite.height,
    renderSvg: frame.renderSvg,
  }))
);

function filterByQuery<T extends { name: string; category: string; tags: string[] }>(
  items: T[],
  query: string,
  category: string
): T[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });
}

export function searchSpriteAssets(query: string, category: AssetCategoryId): SpriteAssetDef[] {
  return filterByQuery(ASSET_SPRITES, query, category);
}

export function searchCostumeAssets(query: string, category: AssetCategoryId): CostumeAssetItem[] {
  return filterByQuery(ASSET_COSTUMES, query, category);
}

export function searchBackdropAssets(
  query: string,
  category: BackdropCategoryId
): BackdropAssetDef[] {
  return filterByQuery(ASSET_BACKDROPS, query, category);
}

function makeCostumeFromSvg(
  name: string,
  width: number,
  height: number,
  dataUrl: string
): CostumeData {
  return {
    id: createUid('cos'),
    name,
    width,
    height,
    pivotX: 0.5,
    pivotY: 0.5,
    layers: [
      {
        id: createUid('lyr'),
        name: 'Base Layer',
        visible: true,
        opacity: 1,
        dataUrl,
      },
    ],
    previewUrl: dataUrl,
  };
}

/**
 * Converts a library sprite asset into a ready-to-use SparkCode 2 SpriteData object.
 */
export function instantiateLibrarySprite(
  def: SpriteAssetDef,
  existingSpritesCount = 0
): SpriteData {
  const costumes: CostumeData[] = def.frames.map((frame, idx) => {
    const url = getCachedSvgUrl(`${def.id}:${idx}`, frame.renderSvg);
    return makeCostumeFromSvg(frame.name, def.width, def.height, url);
  });

  // Gentle spiral stagger when adding multiple sprites so they don't stack on exact (0, 0)
  const ring = existingSpritesCount % 6;
  const x = ring === 0 ? 0 : Math.round(Math.cos(ring * 1.1) * (34 + ring * 10));
  const y = ring === 0 ? 0 : Math.round(Math.sin(ring * 1.1) * (24 + ring * 8));

  return createSpriteTemplate({
    id: createUid('sp'),
    name: def.name,
    x,
    y,
    zIndex: def.solidPlatform ? 2 : 6,
    blendMode: def.blendMode ?? 'normal',
    costumes,
    physics: defaultPhysics({
      enabled: Boolean(def.solidPlatform),
      isStatic: Boolean(def.solidPlatform),
      shape: def.colliderShape ?? 'aabb',
      mass: def.solidPlatform ? 100 : 1,
      friction: def.solidPlatform ? 0.5 : 0.3,
      restitution: def.solidPlatform ? 0.15 : 0.25,
      gravityScale: def.solidPlatform ? 0 : 1,
    }),
    light: def.glowLightColor
      ? defaultLight({
          type: 'point',
          color: def.glowLightColor,
          radius: 165,
          intensity: 0.85,
          castsShadow: false,
        })
      : defaultLight({
          castsShadow: Boolean(def.solidPlatform),
        }),
  });
}

/**
 * Converts a library costume item into a SparkCode 2 CostumeData frame.
 */
export function instantiateLibraryCostume(item: CostumeAssetItem): CostumeData {
  const url = getCachedSvgUrl(item.id, item.renderSvg);
  return makeCostumeFromSvg(item.name, item.width, item.height, url);
}

/**
 * Applies a library backdrop preset (scene artwork + coordinated shader & ambient lighting) onto StageSettings.
 */
export function applyLibraryBackdrop(
  stage: StageSettings,
  backdrop: BackdropAssetDef
): StageSettings {
  const previewUrl = getBackdropPreviewUrl(backdrop);
  return {
    ...stage,
    backgroundShader: backdrop.backgroundShader,
    bgColorA: backdrop.bgColorA,
    bgColorB: backdrop.bgColorB,
    ambientDarkness: backdrop.ambientDarkness,
    ambientColor: backdrop.ambientColor,
    backdropUrl: backdrop.hasSceneSvg ? previewUrl : undefined,
    backdropName: backdrop.name,
  };
}

/**
 * Creates a CostumeData object from a user-uploaded PNG/SVG/JPG data URL.
 */
export function createCostumeFromDataUrl(
  name: string,
  dataUrl: string,
  width = 64,
  height = 64
): CostumeData {
  return makeCostumeFromSvg(
    name,
    Math.max(16, Math.min(240, width)),
    Math.max(16, Math.min(240, height)),
    dataUrl
  );
}

/**
 * Creates a full SpriteData object from a user-uploaded image data URL.
 */
export function createSpriteFromDataUrl(
  name: string,
  dataUrl: string,
  width = 64,
  height = 64
): SpriteData {
  const cleanName = name.replace(/\.[^.]+$/, '').slice(0, 28) || 'Custom Sprite';
  const costume = createCostumeFromDataUrl(cleanName, dataUrl, width, height);
  return createSpriteTemplate({
    id: createUid('sp'),
    name: cleanName,
    zIndex: 6,
    costumes: [costume],
    physics: defaultPhysics({ restitution: 0.25 }),
  });
}
