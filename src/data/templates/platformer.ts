// SPDX-License-Identifier: AGPL-3.0-or-later
import { blockInputFromNode, createBlockNode } from '../../engine/blocks';
import type { SparkProject } from '../../types/project';
import {
  createSpriteTemplate,
  defaultLight,
  defaultPhysics,
  makeProceduralCostume,
} from './shared';

export function buildPlatformerProject(): SparkProject {
  const runnerCostume1 = makeProceduralCostume(
    'c_runner_1',
    'Runner Idle',
    'symmetry_bot',
    44,
    44,
    1042,
    '#38BDF8',
    '#1E3A8A',
    '#E0F2FE'
  );
  const runnerCostume2 = makeProceduralCostume(
    'c_runner_2',
    'Runner Jump',
    'symmetry_bot',
    44,
    44,
    2088,
    '#22D3EE',
    '#0E7490',
    '#FEF08A'
  );
  const floorCostume = makeProceduralCostume(
    'c_floor',
    'Deck Floor',
    'geo_platform',
    360,
    28,
    301,
    '#38BDF8',
    '#1E293B',
    '#BAE6FD'
  );
  const ledgeCostume = makeProceduralCostume(
    'c_ledge',
    'Jump Ledge',
    'geo_platform',
    150,
    24,
    409,
    '#34D399',
    '#1E293B',
    '#A7F3D0'
  );
  const orbCostume = makeProceduralCostume(
    'c_orb',
    'Energy Core',
    'geo_crystal',
    34,
    34,
    777,
    '#F59E0B',
    '#B45309',
    '#FEF3C7'
  );
  const bouncerCostume = makeProceduralCostume(
    'c_bouncer',
    'Plasma Sphere',
    'noise_plasma',
    36,
    36,
    919,
    '#F43F5E',
    '#881337',
    '#FFE4E6'
  );

  const player = createSpriteTemplate({
    id: 'sp_player',
    name: 'Runner',
    x: -110,
    y: 40,
    zIndex: 10,
    costumes: [runnerCostume1, runnerCostume2],
    physics: defaultPhysics({ enabled: true, friction: 0.35, restitution: 0.12 }),
    light: defaultLight({ type: 'point', color: '#38BDF8', radius: 195, intensity: 0.95 }),
    functions: [
      {
        id: 'fn_bonus',
        name: 'calcBonus',
        params: [
          { name: 'base', type: 'number' },
          { name: 'mult', type: 'number' },
        ],
        returnsValue: true,
      },
    ],
    scripts: [
      {
        id: 'st_fn_bonus',
        x: 590,
        y: 20,
        blocks: [
          createBlockNode('fn_define', { name: 'calcBonus', param1: 'base', param2: 'mult' }),
          createBlockNode('data_let_local', {
            name: 'total',
            value: blockInputFromNode(
              createBlockNode('op_math', {
                a: blockInputFromNode(createBlockNode('data_get_var', { name: 'base' })),
                op: '*',
                b: blockInputFromNode(createBlockNode('data_get_var', { name: 'mult' })),
              })
            ),
          }),
          createBlockNode('fn_return', {
            value: blockInputFromNode(createBlockNode('data_get_var', { name: 'total' })),
          }),
        ],
      },
      {
        id: 'st_player_main',
        x: 20,
        y: 20,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('camera_follow', { target: 'self', smooth: 0.12 }),
          createBlockNode('particles_emitter', { state: 'on', preset: 'trail', rate: 18, color: '#38BDF8' }),
          createBlockNode('looks_say', { text: 'Arrows + Space to Jump!', secs: 2.5 }),
          createBlockNode('control_forever', {}, [
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowRight' })) },
              [createBlockNode('physics_set_vx', { vx: 215 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowLeft' })) },
              [createBlockNode('physics_set_vx', { vx: -215 })]
            ),
            createBlockNode(
              'control_if',
              {
                condition: blockInputFromNode(
                  createBlockNode('op_logic', {
                    a: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'Space' })),
                    op: 'and',
                    b: blockInputFromNode(createBlockNode('physics_on_ground')),
                  })
                ),
              },
              [
                createBlockNode('physics_impulse', { ix: 0, iy: 430 }),
                createBlockNode('looks_costume', { index: 1 }),
                createBlockNode('particles_burst', { count: 16, preset: 'sparks', color: '#38BDF8', speed: 190 }),
                createBlockNode('camera_shake', { power: 4, secs: 0.14 }),
              ]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('physics_on_ground')) },
              [createBlockNode('looks_costume', { index: 0 })]
            ),
            createBlockNode(
              'control_if',
              {
                condition: blockInputFromNode(
                  createBlockNode('op_compare', {
                    a: blockInputFromNode(createBlockNode('sensing_prop', { prop: 'y' })),
                    op: '<',
                    b: -240,
                  })
                ),
              },
              [
                createBlockNode('motion_goto', { x: -110, y: 60 }),
                createBlockNode('physics_set_velocity', { vx: 0, vy: 0 }),
              ]
            ),
          ]),
        ],
      },
      {
        id: 'st_player_collect',
        x: 590,
        y: 190,
        blocks: [
          createBlockNode('event_when_broadcast', { message: 'core_collected' }),
          createBlockNode('data_change_global', {
            name: 'score',
            delta: blockInputFromNode(
              createBlockNode('fn_call_reporter', { name: 'calcBonus', arg1: 25, arg2: 2 })
            ),
          }),
          createBlockNode('data_dict_set', {
            name: 'stats',
            key: 'cores',
            value: blockInputFromNode(
              createBlockNode('op_math', {
                a: blockInputFromNode(createBlockNode('data_dict_get', { name: 'stats', key: 'cores' })),
                op: '+',
                b: 1,
              })
            ),
          }),
          createBlockNode('particles_burst', { count: 24, preset: 'sparks', color: '#F59E0B', speed: 220 }),
          createBlockNode('camera_shake', { power: 7, secs: 0.2 }),
          createBlockNode('looks_say', { text: '+50 Energy!', secs: 1.1 }),
        ],
      },
    ],
  });

  const floor = createSpriteTemplate({
    id: 'sp_floor',
    name: 'MainDeck',
    y: -125,
    zIndex: 2,
    costumes: [floorCostume],
    physics: defaultPhysics({ enabled: true, isStatic: true, mass: 100, friction: 0.55, gravityScale: 0 }),
    light: defaultLight({ intensity: 0, castsShadow: true }),
  });

  const ledge = createSpriteTemplate({
    id: 'sp_ledge',
    name: 'UpperLedge',
    x: 115,
    y: -20,
    zIndex: 2,
    costumes: [ledgeCostume],
    physics: defaultPhysics({ enabled: true, isStatic: true, mass: 100, friction: 0.45, gravityScale: 0 }),
    light: defaultLight({ color: '#34D399', intensity: 0, castsShadow: true }),
  });

  const orb = createSpriteTemplate({
    id: 'sp_core',
    name: 'EnergyCore',
    x: 115,
    y: 42,
    zIndex: 8,
    blendMode: 'add',
    costumes: [orbCostume],
    physics: defaultPhysics({ isStatic: true, shape: 'circle', friction: 0, restitution: 0.5, gravityScale: 0, solid: false }),
    light: defaultLight({ type: 'point', color: '#F59E0B', radius: 150, intensity: 0.85 }),
    scripts: [
      {
        id: 'st_orb_float',
        x: 24,
        y: 28,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('control_forever', {}, [
            createBlockNode('motion_turn', { deg: 3 }),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('physics_touching', { target: 'Runner' })) },
              [
                createBlockNode('event_broadcast', { message: 'core_collected' }),
                createBlockNode('motion_goto', {
                  x: blockInputFromNode(createBlockNode('op_random', { min: -140, max: 155 })),
                  y: blockInputFromNode(createBlockNode('op_random', { min: -65, max: 75 })),
                }),
              ]
            ),
          ]),
        ],
      },
    ],
  });

  const bouncer = createSpriteTemplate({
    id: 'sp_bouncer',
    name: 'PlasmaOrb',
    x: 50,
    y: 120,
    zIndex: 7,
    costumes: [bouncerCostume],
    physics: defaultPhysics({ enabled: true, shape: 'circle', mass: 0.7, friction: 0.1, restitution: 0.88, gravityScale: 0.75 }),
    light: defaultLight({ type: 'point', color: '#F43F5E', radius: 125, intensity: 0.75 }),
    scripts: [
      {
        id: 'st_bouncer',
        x: 24,
        y: 28,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('physics_set_velocity', { vx: 95, vy: 120 }),
          createBlockNode('control_forever', {}, [
            createBlockNode(
              'control_if',
              {
                condition: blockInputFromNode(
                  createBlockNode('op_compare', {
                    a: blockInputFromNode(createBlockNode('sensing_prop', { prop: 'x' })),
                    op: '>',
                    b: 170,
                  })
                ),
              },
              [createBlockNode('physics_set_vx', { vx: -110 })]
            ),
            createBlockNode(
              'control_if',
              {
                condition: blockInputFromNode(
                  createBlockNode('op_compare', {
                    a: blockInputFromNode(createBlockNode('sensing_prop', { prop: 'x' })),
                    op: '<',
                    b: -170,
                  })
                ),
              },
              [createBlockNode('physics_set_vx', { vx: 110 })]
            ),
          ]),
        ],
      },
    ],
  });

  return {
    version: '2.0',
    id: 'tpl_platformer',
    name: 'Neon Physics Platformer',
    description: 'Rigid-body jumping, 2D dynamic lighting & shadows, custom reporter function, and particle bursts.',
    stage: {
      width: 560,
      height: 360,
      gravityX: 0,
      gravityY: -920,
      airDrag: 0.85,
      ambientDarkness: 0.52,
      ambientColor: '#040814',
      backgroundShader: 'synthwave',
      bgColorA: '#090F1E',
      bgColorB: '#0F1B33',
      cameraBounds: { enabled: true, minX: -120, maxX: 120, minY: -60, maxY: 90 },
      defaultZoom: 1,
      stageEffects: { chromatic: 0, pixelate: 0, vignette: 0.32, tint: '#0EA5E9', tintAmount: 0 },
    },
    globals: { score: 0, stats: { cores: 0, rank: 'A' } },
    watchedGlobals: ['score', 'stats'],
    sprites: [player, floor, ledge, orb, bouncer],
  };
}
