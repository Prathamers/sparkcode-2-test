// SPDX-License-Identifier: AGPL-3.0-or-later
import { blockInputFromNode, createBlockNode } from '../../engine/blocks';
import type { SparkProject } from '../../types/project';
import {
  createSpriteTemplate,
  defaultLight,
  defaultPhysics,
  makeProceduralCostume,
} from './shared';

export function buildEmptyProject(): SparkProject {
  const spriteCostume = makeProceduralCostume(
    'c_empty_sprite',
    'Costume 1',
    'symmetry_bot',
    44,
    44,
    202,
    '#38BDF8',
    '#1E293B',
    '#F8FAFC'
  );

  return {
    version: '2.0',
    id: 'tpl_empty',
    name: 'Empty',
    description: 'Clean blank workspace with one starter sprite and zero pre-placed scripts.',
    stage: {
      width: 560,
      height: 360,
      gravityX: 0,
      gravityY: -900,
      airDrag: 0.4,
      ambientDarkness: 0.12,
      ambientColor: '#050814',
      backgroundShader: 'grid',
      bgColorA: '#090F1E',
      bgColorB: '#0F1B33',
      cameraBounds: { enabled: false, minX: -200, maxX: 200, minY: -150, maxY: 150 },
      defaultZoom: 1,
      stageEffects: { chromatic: 0, pixelate: 0, vignette: 0.14, tint: '#38BDF8', tintAmount: 0 },
    },
    globals: { score: 0 },
    watchedGlobals: ['score'],
    sprites: [
      createSpriteTemplate({
        id: 'sp_empty_1',
        name: 'Sprite 1',
        costumes: [spriteCostume],
      }),
    ],
  };
}

export function buildBasicProject(): SparkProject {
  const heroCostume = makeProceduralCostume(
    'c_basic_hero',
    'Hero Bot',
    'symmetry_bot',
    44,
    44,
    512,
    '#38BDF8',
    '#1E3A8A',
    '#E0F2FE'
  );
  const starCostume = makeProceduralCostume(
    'c_basic_star',
    'Gold Star',
    'geo_star',
    34,
    34,
    808,
    '#F59E0B',
    '#B45309',
    '#FEF3C7'
  );

  const hero = createSpriteTemplate({
    id: 'sp_basic_hero',
    name: 'Hero',
    x: -70,
    zIndex: 10,
    costumes: [heroCostume],
    physics: defaultPhysics({ friction: 0.25, gravityScale: 0 }),
    light: defaultLight({ radius: 150, intensity: 0.7 }),
    scripts: [
      {
        id: 'st_basic_move',
        x: 24,
        y: 24,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('looks_say', { text: 'Use Arrow Keys to collect Stars!', secs: 2.5 }),
          createBlockNode('control_forever', {}, [
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowRight' })) },
              [createBlockNode('motion_change_xy', { dx: 5, dy: 0 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowLeft' })) },
              [createBlockNode('motion_change_xy', { dx: -5, dy: 0 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowUp' })) },
              [createBlockNode('motion_change_xy', { dx: 0, dy: 5 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowDown' })) },
              [createBlockNode('motion_change_xy', { dx: 0, dy: -5 })]
            ),
          ]),
        ],
      },
    ],
  });

  const star = createSpriteTemplate({
    id: 'sp_basic_star',
    name: 'Star',
    x: 95,
    y: 35,
    zIndex: 8,
    costumes: [starCostume],
    physics: defaultPhysics({ shape: 'circle', friction: 0, gravityScale: 0, solid: false }),
    light: defaultLight({ color: '#F59E0B', radius: 120, intensity: 0.6 }),
    scripts: [
      {
        id: 'st_basic_star',
        x: 24,
        y: 24,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('control_forever', {}, [
            createBlockNode('motion_turn', { deg: 3 }),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('physics_touching', { target: 'Hero' })) },
              [
                createBlockNode('data_change_global', { name: 'score', delta: 10 }),
                createBlockNode('particles_burst', { count: 14, preset: 'sparks', color: '#F59E0B', speed: 150 }),
                createBlockNode('motion_goto', {
                  x: blockInputFromNode(createBlockNode('op_random', { min: -200, max: 200 })),
                  y: blockInputFromNode(createBlockNode('op_random', { min: -120, max: 120 })),
                }),
              ]
            ),
          ]),
        ],
      },
    ],
  });

  return {
    version: '2.0',
    id: 'tpl_basic',
    name: 'Basic',
    description: 'Simple starter setup with arrow-key movement, collectible star, and score counter.',
    stage: {
      width: 560,
      height: 360,
      gravityX: 0,
      gravityY: 0,
      airDrag: 0.2,
      ambientDarkness: 0.14,
      ambientColor: '#050814',
      backgroundShader: 'grid',
      bgColorA: '#090F1E',
      bgColorB: '#0F1B33',
      cameraBounds: { enabled: false, minX: -200, maxX: 200, minY: -150, maxY: 150 },
      defaultZoom: 1,
      stageEffects: { chromatic: 0, pixelate: 0, vignette: 0.16, tint: '#38BDF8', tintAmount: 0 },
    },
    globals: { score: 0 },
    watchedGlobals: ['score'],
    sprites: [hero, star],
  };
}
