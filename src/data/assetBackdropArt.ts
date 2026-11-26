// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BackgroundShaderType } from '../types/project';
import { svgToDataUrl } from './assetSvgHelpers';
import { BACKDROPS_FANTASY_URBAN } from './assets/backdropsFantasyUrban';
import { BACKDROPS_NATURE_SPACE } from './assets/backdropsNatureSpace';

export type BackdropCategoryId = 'all' | 'space' | 'nature' | 'fantasy' | 'urban' | 'abstract';

export interface BackdropAssetDef {
  id: string;
  name: string;
  category: Exclude<BackdropCategoryId, 'all'>;
  tags: string[];
  backgroundShader: BackgroundShaderType;
  bgColorA: string;
  bgColorB: string;
  ambientDarkness: number;
  ambientColor: string;
  hasSceneSvg: boolean;
  buildSvg: () => string;
}

const backdropUrlCache = new Map<string, string>();

export function getBackdropPreviewUrl(def: BackdropAssetDef): string {
  let cached = backdropUrlCache.get(def.id);
  if (!cached) {
    cached = svgToDataUrl(def.buildSvg());
    backdropUrlCache.set(def.id, cached);
  }
  return cached;
}

export const ASSET_BACKDROPS: BackdropAssetDef[] = [
  ...BACKDROPS_NATURE_SPACE,
  ...BACKDROPS_FANTASY_URBAN,
];
