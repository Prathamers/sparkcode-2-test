// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderItemAndNatureSvg, type ItemAndNatureKind } from './assets/worldItemsAndNature';
import { renderSpaceAndTileSvg, type SpaceAndTileKind } from './assets/worldSpaceAndTiles';
import { renderVehicleFxGlyphSvg, type VehicleFxGlyphKind } from './assets/worldVehiclesFxGlyphs';

export type WorldArtKind = SpaceAndTileKind | ItemAndNatureKind | VehicleFxGlyphKind;

export interface WorldArtSpec {
  kind: WorldArtKind;
  primary: string;
  secondary: string;
  accent: string;
  frame?: number;
  label?: string;
  rotation?: number;
}

export function renderWorldSvg(spec: WorldArtSpec): string {
  const { kind, primary, secondary, accent, frame = 0, label = 'A', rotation = 0 } = spec;
  const step = frame % 2 === 1;

  if (kind.startsWith('space_') || kind.startsWith('plat_')) {
    return renderSpaceAndTileSvg(kind as SpaceAndTileKind, primary, secondary, accent, step);
  }
  if (kind.startsWith('item_') || kind.startsWith('food_') || kind.startsWith('nature_')) {
    return renderItemAndNatureSvg(kind as ItemAndNatureKind, primary, secondary, accent, step);
  }
  return renderVehicleFxGlyphSvg(
    kind as VehicleFxGlyphKind,
    primary,
    secondary,
    accent,
    step,
    label,
    rotation
  );
}
