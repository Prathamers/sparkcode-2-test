// SPDX-License-Identifier: AGPL-3.0-or-later
import { blockInputFromNode, createBlockNode } from '../../engine/blocks';
import type { SparkProject, SpriteData } from '../../types/project';
import {
  createSpriteTemplate,
  defaultLight,
  defaultPhysics,
  makeProceduralCostume,
} from './shared';

export function buildLightingDemoProject(): SparkProject {
  const scoutCostume = makeProceduralCostume(
    'c_scout',
    'Spotlight Drone',
    'geo_drone',
    44,
    44,
    303,
    '#38BDF8',
    '#1E293B',
    '#FEF08A'
  );
  const pillarCostume = makeProceduralCostume(
    'c_pillar',
    'Shadow Pillar',
    'geo_pillar',
    54,
    54,
    505,
    '#64748B',
    '#1E293B',
    '#38BDF8'
  );
  const beaconCostume = makeProceduralCostume(
    'c_beacon',
    'Emerald Beacon',
    'geo_star',
    38,
    38,
    909,
    '#10B981',
    '#064E3B',
    '#D1FAE5'
  );

  const scout = createSpriteTemplate({
    id: 'sp_scout',
    name: 'SpotDrone',
    x: -120,
    zIndex: 10,
    costumes: [scoutCostume],
    physics: defaultPhysics({ enabled: true, shape: 'circle', friction: 0.2, gravityScale: 0 }),
    light: defaultLight({ type: 'spot', color: '#FDE047', radius: 280, intensity: 1, angle: 65 }),
    scripts: [
      {
        id: 'st_scout_ctrl',
        x: 24,
        y: 24,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('camera_follow', { target: 'self', smooth: 0.08 }),
          createBlockNode('looks_say', { text: 'Move Mouse + WASD/Arrows', secs: 3 }),
          createBlockNode('control_forever', {}, [
            createBlockNode('motion_point_mouse'),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowRight' })) },
              [createBlockNode('motion_change_xy', { dx: 4, dy: 0 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowLeft' })) },
              [createBlockNode('motion_change_xy', { dx: -4, dy: 0 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowUp' })) },
              [createBlockNode('motion_change_xy', { dx: 0, dy: 4 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowDown' })) },
              [createBlockNode('motion_change_xy', { dx: 0, dy: -4 })]
            ),
            createBlockNode('data_set_global', {
              name: 'rayDist',
              value: blockInputFromNode(createBlockNode('physics_raycast_dist', { deg: 0, dist: 260 })),
            }),
          ]),
        ],
      },
    ],
  });

  const makePillar = (id: string, name: string, x: number, y: number): SpriteData =>
    createSpriteTemplate({
      id,
      name,
      x,
      y,
      costumes: [pillarCostume],
      physics: defaultPhysics({ enabled: true, isStatic: true, mass: 100, friction: 0.5, gravityScale: 0 }),
      light: defaultLight({ color: '#FFFFFF', intensity: 0, castsShadow: true }),
    });

  const beacon = createSpriteTemplate({
    id: 'sp_beacon',
    name: 'Beacon',
    x: 145,
    zIndex: 8,
    blendMode: 'add',
    costumes: [beaconCostume],
    physics: defaultPhysics({ isStatic: true, shape: 'circle', friction: 0, restitution: 0, gravityScale: 0, solid: false }),
    light: defaultLight({ type: 'point', color: '#10B981', radius: 190, intensity: 0.9 }),
    scripts: [
      {
        id: 'st_beacon_tween',
        x: 24,
        y: 24,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('particles_emitter', { state: 'on', preset: 'plasma', rate: 14, color: '#10B981' }),
          createBlockNode('control_forever', {}, [
            createBlockNode('motion_tween', { prop: 'y', target: 85, secs: 1.4, easing: 'elastic' }),
            createBlockNode('motion_tween', { prop: 'y', target: -85, secs: 1.4, easing: 'bounce' }),
          ]),
        ],
      },
    ],
  });

  return {
    version: '2.0',
    id: 'tpl_lighting',
    name: 'Camera & Lighting Demo',
    description: 'Real-time spotlight shadow casting, 2D raycasting distance sensor, elastic/bounce tweens, and camera tracking.',
    stage: {
      width: 560,
      height: 360,
      gravityX: 0,
      gravityY: 0,
      airDrag: 0.5,
      ambientDarkness: 0.82,
      ambientColor: '#02050E',
      backgroundShader: 'nebula',
      bgColorA: '#080E1A',
      bgColorB: '#0E1729',
      cameraBounds: { enabled: true, minX: -120, maxX: 120, minY: -80, maxY: 80 },
      defaultZoom: 1.05,
      stageEffects: { chromatic: 0, pixelate: 0, vignette: 0.48, tint: '#0EA5E9', tintAmount: 0 },
      webgl2: {
        backend: 'webgl2',
        normalMapping: true,
        normalStrength: 1.8,
        hardwareShadows: true,
        shadowSoftness: 0.45,
        bloomEnabled: true,
        bloomThreshold: 0.54,
        bloomIntensity: 1.05,
        bloomRadius: 2.8,
      },
    },
    globals: { rayDist: 260 },
    watchedGlobals: ['rayDist'],
    sprites: [
      scout,
      makePillar('sp_pil_1', 'PillarNorth', 0, 70),
      makePillar('sp_pil_2', 'PillarSouth', 0, -70),
      beacon,
    ],
  };
}
