// SPDX-License-Identifier: AGPL-3.0-or-later
import { blockInputFromNode, createBlockNode } from '../../engine/blocks';
import type { SparkProject } from '../../types/project';
import {
  createSpriteTemplate,
  defaultLight,
  defaultPhysics,
  makeProceduralCostume,
} from './shared';

export function buildSpaceShooterProject(): SparkProject {
  const shipCostume = makeProceduralCostume(
    'c_ship',
    'Vanguard Fighter',
    'symmetry_ship',
    48,
    48,
    5512,
    '#38BDF8',
    '#334155',
    '#F97316'
  );
  const laserCostume = makeProceduralCostume(
    'c_laser',
    'Plasma Bolt',
    'geo_laser',
    12,
    28,
    112,
    '#38BDF8',
    '#0284C7',
    '#FFFFFF'
  );
  const droneCostume = makeProceduralCostume(
    'c_enemy_drone',
    'Asteroid Drone',
    'symmetry_gem',
    42,
    42,
    8821,
    '#F43F5E',
    '#4C0519',
    '#FDE047'
  );

  const ship = createSpriteTemplate({
    id: 'sp_ship',
    name: 'Starfighter',
    y: -115,
    zIndex: 10,
    costumes: [shipCostume],
    physics: defaultPhysics({ shape: 'circle', friction: 0, gravityScale: 0, solid: false }),
    light: defaultLight({ type: 'point', color: '#38BDF8', radius: 170, intensity: 0.85 }),
    scripts: [
      {
        id: 'st_ship_loop',
        x: 24,
        y: 24,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('particles_emitter', { state: 'on', preset: 'fire', rate: 26, color: '#F97316' }),
          createBlockNode('looks_say', { text: 'Arrows Move · Space Fire', secs: 2.5 }),
          createBlockNode('control_forever', {}, [
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowLeft' })) },
              [createBlockNode('motion_change_xy', { dx: -6, dy: 0 })]
            ),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowRight' })) },
              [createBlockNode('motion_change_xy', { dx: 6, dy: 0 })]
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
          ]),
        ],
      },
      {
        id: 'st_ship_fire',
        x: 430,
        y: 24,
        blocks: [
          createBlockNode('event_when_key', { key: 'Space' }),
          createBlockNode('control_create_clone', { target: 'PlasmaBolt' }),
          createBlockNode('particles_burst', { count: 8, preset: 'sparks', color: '#38BDF8', speed: 130 }),
        ],
      },
    ],
  });

  const laser = createSpriteTemplate({
    id: 'sp_laser',
    name: 'PlasmaBolt',
    y: -115,
    rotation: 90,
    zIndex: 8,
    visible: false,
    blendMode: 'add',
    costumes: [laserCostume],
    physics: defaultPhysics({ shape: 'circle', mass: 0.2, friction: 0, restitution: 0, gravityScale: 0, solid: false }),
    light: defaultLight({ type: 'point', color: '#38BDF8', radius: 95, intensity: 0.75 }),
    scripts: [
      {
        id: 'st_laser_clone',
        x: 24,
        y: 24,
        blocks: [
          createBlockNode('event_when_clone'),
          createBlockNode('looks_visible', { state: 'true' }),
          createBlockNode('control_repeat', { times: 45 }, [
            createBlockNode('motion_change_xy', { dx: 0, dy: 10 }),
            createBlockNode(
              'control_if',
              { condition: blockInputFromNode(createBlockNode('physics_touching', { target: 'Drone' })) },
              [
                createBlockNode('event_broadcast', { message: 'drone_hit' }),
                createBlockNode('particles_burst', { count: 24, preset: 'plasma', color: '#F43F5E', speed: 240 }),
                createBlockNode('camera_shake', { power: 8, secs: 0.2 }),
                createBlockNode('control_delete_clone'),
              ]
            ),
          ]),
          createBlockNode('control_delete_clone'),
        ],
      },
    ],
  });

  const drone = createSpriteTemplate({
    id: 'sp_drone',
    name: 'Drone',
    y: 110,
    zIndex: 9,
    costumes: [droneCostume],
    physics: defaultPhysics({ shape: 'circle', friction: 0, restitution: 0.3, gravityScale: 0, solid: false }),
    light: defaultLight({ type: 'point', color: '#F43F5E', radius: 130, intensity: 0.7 }),
    scripts: [
      {
        id: 'st_drone_patrol',
        x: 24,
        y: 24,
        blocks: [
          createBlockNode('event_when_flag'),
          createBlockNode('control_forever', {}, [
            createBlockNode('motion_tween', { prop: 'x', target: 170, secs: 1.2, easing: 'easeInOut' }),
            createBlockNode('motion_tween', { prop: 'x', target: -170, secs: 1.2, easing: 'easeInOut' }),
          ]),
        ],
      },
      {
        id: 'st_drone_hit',
        x: 455,
        y: 24,
        blocks: [
          createBlockNode('event_when_broadcast', { message: 'drone_hit' }),
          createBlockNode('data_change_global', { name: 'score', delta: 100 }),
          createBlockNode('fx_set_stage', { fx: 'chromatic', amount: 4 }),
          createBlockNode('control_wait', { secs: 0.14 }),
          createBlockNode('fx_set_stage', { fx: 'chromatic', amount: 0 }),
          createBlockNode('motion_goto', {
            x: blockInputFromNode(createBlockNode('op_random', { min: -175, max: 175 })),
            y: blockInputFromNode(createBlockNode('op_random', { min: 45, max: 125 })),
          }),
        ],
      },
    ],
  });

  return {
    version: '2.0',
    id: 'tpl_shooter',
    name: 'Particle Space Shooter',
    description: 'Clone laser projectiles, thruster fire emitters, chromatic aberration shockwaves, and elastic patrol targets.',
    stage: {
      width: 560,
      height: 360,
      gravityX: 0,
      gravityY: 0,
      airDrag: 0.1,
      ambientDarkness: 0.42,
      ambientColor: '#03050C',
      backgroundShader: 'starfield',
      bgColorA: '#050814',
      bgColorB: '#0D1528',
      cameraBounds: { enabled: false, minX: -200, maxX: 200, minY: -150, maxY: 150 },
      defaultZoom: 1,
      stageEffects: { chromatic: 0, pixelate: 0, vignette: 0.35, tint: '#38BDF8', tintAmount: 0 },
    },
    globals: { score: 0, wave: 1 },
    watchedGlobals: ['score', 'wave'],
    sprites: [ship, laser, drone],
  };
}
