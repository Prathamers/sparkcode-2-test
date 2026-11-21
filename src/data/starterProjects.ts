import { blockInputFromNode, createBlockNode } from '../engine/blocks';
import {
  generateProceduralBuffer,
  rgbaBufferToDataUrl,
  type ProceduralPreset,
} from '../engine/procedural';
import type { CostumeData, SparkProject, SpriteData } from '../types/project';

function makeProceduralCostume(
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

function defaultEffects() {
  return {
    chromatic: 0,
    pixelate: 0,
    vignette: 0,
    tint: '#38BDF8',
    tintAmount: 0,
  };
}

// =========================================================================
// 1. NEON PHYSICS PLATFORMER
// =========================================================================
function buildPlatformerProject(): SparkProject {
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

  const player: SpriteData = {
    id: 'sp_player',
    name: 'Runner',
    x: -110,
    y: 40,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 10,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [runnerCostume1, runnerCostume2],
    physics: {
      enabled: true,
      isStatic: false,
      shape: 'aabb',
      mass: 1,
      friction: 0.35,
      restitution: 0.12,
      gravityScale: 1,
      solid: true,
    },
    light: {
      type: 'point',
      color: '#38BDF8',
      radius: 195,
      intensity: 0.95,
      angle: 60,
      castsShadow: false,
    },
    effects: defaultEffects(),
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
      // Custom First-Class Function with Return Value
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
      // Main Platformer Loop
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
              {
                condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowRight' })),
              },
              [createBlockNode('physics_set_vx', { vx: 215 })]
            ),
            createBlockNode(
              'control_if',
              {
                condition: blockInputFromNode(createBlockNode('sensing_key_pressed', { key: 'ArrowLeft' })),
              },
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
              {
                condition: blockInputFromNode(createBlockNode('physics_on_ground')),
              },
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
      // Collect Energy Core Handler using Custom Function Return + Dictionary
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
  };

  const floor: SpriteData = {
    id: 'sp_floor',
    name: 'MainDeck',
    x: 0,
    y: -125,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 2,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [floorCostume],
    physics: {
      enabled: true,
      isStatic: true,
      shape: 'aabb',
      mass: 100,
      friction: 0.55,
      restitution: 0.2,
      gravityScale: 0,
      solid: true,
    },
    light: { type: 'none', color: '#38BDF8', radius: 100, intensity: 0, angle: 60, castsShadow: true },
    effects: defaultEffects(),
    functions: [],
    scripts: [],
  };

  const ledge: SpriteData = {
    id: 'sp_ledge',
    name: 'UpperLedge',
    x: 115,
    y: -20,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 2,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [ledgeCostume],
    physics: {
      enabled: true,
      isStatic: true,
      shape: 'aabb',
      mass: 100,
      friction: 0.45,
      restitution: 0.2,
      gravityScale: 0,
      solid: true,
    },
    light: { type: 'none', color: '#34D399', radius: 100, intensity: 0, angle: 60, castsShadow: true },
    effects: defaultEffects(),
    functions: [],
    scripts: [],
  };

  const orb: SpriteData = {
    id: 'sp_core',
    name: 'EnergyCore',
    x: 115,
    y: 42,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 8,
    opacity: 1,
    visible: true,
    blendMode: 'add',
    activeCostumeIndex: 0,
    costumes: [orbCostume],
    physics: {
      enabled: false,
      isStatic: true,
      shape: 'circle',
      mass: 1,
      friction: 0,
      restitution: 0.5,
      gravityScale: 0,
      solid: false,
    },
    light: {
      type: 'point',
      color: '#F59E0B',
      radius: 150,
      intensity: 0.85,
      angle: 60,
      castsShadow: false,
    },
    effects: defaultEffects(),
    functions: [],
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
              {
                condition: blockInputFromNode(createBlockNode('physics_touching', { target: 'Runner' })),
              },
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
  };

  const bouncer: SpriteData = {
    id: 'sp_bouncer',
    name: 'PlasmaOrb',
    x: 50,
    y: 120,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 7,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [bouncerCostume],
    physics: {
      enabled: true,
      isStatic: false,
      shape: 'circle',
      mass: 0.7,
      friction: 0.1,
      restitution: 0.88,
      gravityScale: 0.75,
      solid: true,
    },
    light: {
      type: 'point',
      color: '#F43F5E',
      radius: 125,
      intensity: 0.75,
      angle: 60,
      castsShadow: false,
    },
    effects: defaultEffects(),
    functions: [],
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
  };

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
    globals: {
      score: 0,
      stats: { cores: 0, rank: 'A' },
    },
    watchedGlobals: ['score', 'stats'],
    sprites: [player, floor, ledge, orb, bouncer],
  };
}

// =========================================================================
// 2. PARTICLE SPACE SHOOTER
// =========================================================================
function buildSpaceShooterProject(): SparkProject {
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

  const ship: SpriteData = {
    id: 'sp_ship',
    name: 'Starfighter',
    x: 0,
    y: -115,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 10,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [shipCostume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'circle',
      mass: 1,
      friction: 0,
      restitution: 0.2,
      gravityScale: 0,
      solid: false,
    },
    light: {
      type: 'point',
      color: '#38BDF8',
      radius: 170,
      intensity: 0.85,
      angle: 60,
      castsShadow: false,
    },
    effects: defaultEffects(),
    functions: [],
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
  };

  const laser: SpriteData = {
    id: 'sp_laser',
    name: 'PlasmaBolt',
    x: 0,
    y: -115,
    rotation: 90,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 8,
    opacity: 1,
    visible: false,
    blendMode: 'add',
    activeCostumeIndex: 0,
    costumes: [laserCostume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'circle',
      mass: 0.2,
      friction: 0,
      restitution: 0,
      gravityScale: 0,
      solid: false,
    },
    light: { type: 'point', color: '#38BDF8', radius: 95, intensity: 0.75, angle: 60, castsShadow: false },
    effects: defaultEffects(),
    functions: [],
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
  };

  const drone: SpriteData = {
    id: 'sp_drone',
    name: 'Drone',
    x: 0,
    y: 110,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 9,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [droneCostume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'circle',
      mass: 1,
      friction: 0,
      restitution: 0.3,
      gravityScale: 0,
      solid: false,
    },
    light: { type: 'point', color: '#F43F5E', radius: 130, intensity: 0.7, angle: 60, castsShadow: false },
    effects: defaultEffects(),
    functions: [],
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
  };

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
    globals: {
      score: 0,
      wave: 1,
    },
    watchedGlobals: ['score', 'wave'],
    sprites: [ship, laser, drone],
  };
}

// =========================================================================
// 3. CAMERA & LIGHTING DEMO
// =========================================================================
function buildLightingDemoProject(): SparkProject {
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

  const scout: SpriteData = {
    id: 'sp_scout',
    name: 'SpotDrone',
    x: -120,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 10,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [scoutCostume],
    physics: {
      enabled: true,
      isStatic: false,
      shape: 'circle',
      mass: 1,
      friction: 0.2,
      restitution: 0.2,
      gravityScale: 0,
      solid: true,
    },
    light: {
      type: 'spot',
      color: '#FDE047',
      radius: 280,
      intensity: 1,
      angle: 65,
      castsShadow: false,
    },
    effects: defaultEffects(),
    functions: [],
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
  };

  const makePillar = (id: string, name: string, x: number, y: number): SpriteData => ({
    id,
    name,
    x,
    y,
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
    costumes: [pillarCostume],
    physics: {
      enabled: true,
      isStatic: true,
      shape: 'aabb',
      mass: 100,
      friction: 0.5,
      restitution: 0.2,
      gravityScale: 0,
      solid: true,
    },
    light: { type: 'none', color: '#FFFFFF', radius: 100, intensity: 0, angle: 60, castsShadow: true },
    effects: defaultEffects(),
    functions: [],
    scripts: [],
  });

  const beacon: SpriteData = {
    id: 'sp_beacon',
    name: 'Beacon',
    x: 145,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 8,
    opacity: 1,
    visible: true,
    blendMode: 'add',
    activeCostumeIndex: 0,
    costumes: [beaconCostume],
    physics: {
      enabled: false,
      isStatic: true,
      shape: 'circle',
      mass: 1,
      friction: 0,
      restitution: 0,
      gravityScale: 0,
      solid: false,
    },
    light: { type: 'point', color: '#10B981', radius: 190, intensity: 0.9, angle: 60, castsShadow: false },
    effects: defaultEffects(),
    functions: [],
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
  };

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
    },
    globals: {
      rayDist: 260,
    },
    watchedGlobals: ['rayDist'],
    sprites: [
      scout,
      makePillar('sp_pil_1', 'PillarNorth', 0, 70),
      makePillar('sp_pil_2', 'PillarSouth', 0, -70),
      beacon,
    ],
  };
}

// =========================================================================
// 4. EMPTY TEMPLATE (ZERO SCRIPTS, CLEAN CANVAS)
// =========================================================================
function buildEmptyProject(): SparkProject {
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

  const emptySprite: SpriteData = {
    id: 'sp_empty_1',
    name: 'Sprite 1',
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
    costumes: [spriteCostume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'aabb',
      mass: 1,
      friction: 0.3,
      restitution: 0.2,
      gravityScale: 1,
      solid: true,
    },
    light: { type: 'none', color: '#38BDF8', radius: 140, intensity: 0.8, angle: 60, castsShadow: false },
    effects: defaultEffects(),
    functions: [],
    scripts: [],
  };

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
    globals: {
      score: 0,
    },
    watchedGlobals: ['score'],
    sprites: [emptySprite],
  };
}

// =========================================================================
// 5. BASIC TEMPLATE (SIMPLE KEYBOARD MOVEMENT + COLLECTIBLE STAR)
// =========================================================================
function buildBasicProject(): SparkProject {
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

  const hero: SpriteData = {
    id: 'sp_basic_hero',
    name: 'Hero',
    x: -70,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 10,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [heroCostume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'aabb',
      mass: 1,
      friction: 0.25,
      restitution: 0.2,
      gravityScale: 0,
      solid: true,
    },
    light: { type: 'none', color: '#38BDF8', radius: 150, intensity: 0.7, angle: 60, castsShadow: false },
    effects: defaultEffects(),
    functions: [],
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
  };

  const star: SpriteData = {
    id: 'sp_basic_star',
    name: 'Star',
    x: 95,
    y: 35,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 8,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [starCostume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'circle',
      mass: 1,
      friction: 0,
      restitution: 0.2,
      gravityScale: 0,
      solid: false,
    },
    light: { type: 'none', color: '#F59E0B', radius: 120, intensity: 0.6, angle: 60, castsShadow: false },
    effects: defaultEffects(),
    functions: [],
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
  };

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
    globals: {
      score: 0,
    },
    watchedGlobals: ['score'],
    sprites: [hero, star],
  };
}

export interface StarterTemplateMeta {
  id: string;
  name: string;
  description: string;
  group?: 'starter' | 'showcase';
  build: () => SparkProject;
}

export const STARTER_TEMPLATES: StarterTemplateMeta[] = [
  {
    id: 'tpl_platformer',
    name: 'Neon Physics Platformer',
    description: 'Rigid-body jumping, 2D lighting, custom reporter function & particles',
    group: 'showcase',
    build: buildPlatformerProject,
  },
  {
    id: 'tpl_shooter',
    name: 'Particle Space Shooter',
    description: 'Clone lasers, thruster fire emitters & chromatic shockwave FX',
    group: 'showcase',
    build: buildSpaceShooterProject,
  },
  {
    id: 'tpl_lighting',
    name: 'Camera & Lighting Demo',
    description: 'Dynamic spotlight shadows, 2D raycasting & elastic/bounce tweens',
    group: 'showcase',
    build: buildLightingDemoProject,
  },
];

export const STUDIO_LAUNCH_TEMPLATES: StarterTemplateMeta[] = [
  {
    id: 'tpl_empty',
    name: 'Empty',
    description: 'Blank dot-grid canvas with a single sprite and zero pre-placed blocks.',
    group: 'starter',
    build: buildEmptyProject,
  },
  {
    id: 'tpl_basic',
    name: 'Basic',
    description: 'Clean arrow-key movement, collectible star, particle burst, and live score.',
    group: 'starter',
    build: buildBasicProject,
  },
  ...STARTER_TEMPLATES,
];

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
  return {
    id: `sp_${Date.now().toString(36)}_${index}`,
    name: `Sprite ${index}`,
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
    costumes: [costume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'aabb',
      mass: 1,
      friction: 0.3,
      restitution: 0.25,
      gravityScale: 1,
      solid: true,
    },
    light: { type: 'none', color: '#38BDF8', radius: 140, intensity: 0.8, angle: 60, castsShadow: false },
    effects: defaultEffects(),
    functions: [],
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
  };
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
    globals: {
      score: 0,
    },
    watchedGlobals: ['score'],
    sprites: [createBlankSprite(1)],
  };
}

