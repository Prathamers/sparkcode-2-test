// SPDX-License-Identifier: AGPL-3.0-or-later
import { createBlockNode } from '../../engine/blocks';
import {
  generateProceduralBuffer,
  rgbaBufferToDataUrl,
  type ProceduralPreset,
} from '../../engine/procedural';
import type {
  CostumeData,
  LightConfig,
  PhysicsConfig,
  SparkProject,
  SpriteData,
  VisualEffects,
} from '../../types/project';

export function makeProceduralCostume(
  id: string,
  name: string,
  preset: ProceduralPreset,
  width: number,
  height: number,
  seed: number,
  primaryColor: string,
  secondaryColor: string,
  accentColor = '#FFFFFF'
): CostumeData {
  const buf = generateProceduralBuffer({
    preset,
    width,
    height,
    seed,
    primaryColor,
    secondaryColor,
    accentColor,
  });
  const dataUrl = rgbaBufferToDataUrl(buf);
  return {
    id,
    name,
    width,
    height,
    pivotX: 0.5,
    pivotY: 0.5,
    layers: [
      {
        id: `${id}_base`,
        name: 'Base Layer',
        visible: true,
        opacity: 1,
        dataUrl,
      },
    ],
    previewUrl: dataUrl,
  };
}

export function defaultEffects(): VisualEffects {
  return {
    chromatic: 0,
    pixelate: 0,
    vignette: 0,
    tint: '#38BDF8',
    tintAmount: 0,
  };
}

export function defaultPhysics(overrides: Partial<PhysicsConfig> = {}): PhysicsConfig {
  return {
    enabled: false,
    isStatic: false,
    shape: 'aabb',
    mass: 1,
    friction: 0.3,
    restitution: 0.2,
    gravityScale: 1,
    solid: true,
    ...overrides,
  };
}

export function defaultLight(overrides: Partial<LightConfig> = {}): LightConfig {
  return {
    type: 'none',
    color: '#38BDF8',
    radius: 140,
    intensity: 0.8,
    angle: 60,
    castsShadow: false,
    ...overrides,
  };
}

export function createSpriteTemplate(
  base: Pick<SpriteData, 'id' | 'name' | 'costumes'> & Partial<SpriteData>
): SpriteData {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 5,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    physics: defaultPhysics(),
    light: defaultLight(),
    effects: defaultEffects(),
    functions: [],
    scripts: [],
    ...base,
  };
}

export function createBlankSprite(index: number): SpriteData {
  const costume = makeProceduralCostume(
    `c_new_${Date.now()}`,
    'Costume 1',
    'symmetry_bot',
    48,
    48,
    100 + index * 73,
    '#38BDF8',
    '#1E293B',
    '#F8FAFC'
  );
  return createSpriteTemplate({
    id: `sp_${Date.now().toString(36)}_${index}`,
    name: `Sprite ${index}`,
    costumes: [costume],
    physics: defaultPhysics({ restitution: 0.25 }),
    scripts: [
      {
        id: `st_init_${Date.now()}`,
        x: 28,
        y: 28,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('motion_turn', { deg: 15 }),
        ],
      },
    ],
  });
}

export function createBlankProject(): SparkProject {
  return {
    version: '2.0',
    id: `proj_blank_${Date.now().toString(36)}`,
    name: 'Untitled Project',
    description: 'Clean blank SparkCode 2 workspace.',
    stage: {
      width: 560,
      height: 360,
      gravityX: 0,
      gravityY: -920,
      airDrag: 0.4,
      ambientDarkness: 0.25,
      ambientColor: '#050914',
      backgroundShader: 'grid',
      bgColorA: '#09101E',
      bgColorB: '#0F1A30',
      cameraBounds: { enabled: false, minX: -200, maxX: 200, minY: -150, maxY: 150 },
      defaultZoom: 1,
      stageEffects: { chromatic: 0, pixelate: 0, vignette: 0.18, tint: '#38BDF8', tintAmount: 0 },
    },
    globals: { score: 0 },
    watchedGlobals: ['score'],
    sprites: [createBlankSprite(1)],
  };
}
