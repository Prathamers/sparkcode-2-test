// SPDX-License-Identifier: AGPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { raycastBodies, stepPhysicsWorld, type PhysicsBody } from './physics';
import {
  BLOCK_CATEGORIES,
  BLOCK_DEFINITIONS,
  BLOCKS_BY_CATEGORY,
  blockInputFromNode,
  containsBlockId,
  createBlockNode,
  estimateStackBounds,
  extractBlockTailFromStacks,
  findBestInputSlotForBlock,
  findBlockTailIds,
  findFreeCanvasPosition,
  insertBlockRelative,
  insertBlocksRelative,
  layoutStacksWithoutOverlap,
  rectsOverlap,
} from './blocks';
import {
  DEFAULT_IMPROVED_VM_CONFIG,
  evaluateEasing,
  EXPRESSION_HANDLERS,
  normalizeImprovedVMConfig,
  SparkVM,
  STATEMENT_HANDLERS,
  type VMHost,
} from './vm';
import { SparkEngine } from './SparkEngine';
import { floodFillPixels, generateProceduralBuffer } from './procedural';
import {
  AddSpriteCommand,
  CommandHistoryManager,
  DeleteSpriteCommand,
  UpdateGlobalsCommand,
  UpdateScriptsCommand,
  UpdateSpriteCommand,
  UpdateStageCommand,
} from './history';
import {
  DEFAULT_WEBGL2_CONFIG,
  GLSL_SHADERS,
  hexToRgb01,
  MAX_WEBGL2_LIGHTS,
  MAX_WEBGL2_OCCLUDERS,
  normalizeWebGL2Config,
  packLightsUniformData,
  packOccludersUniformData,
  WebGL2LightingBloomPipeline,
} from './webgl2Pipeline';
import { createBlankSprite, STARTER_TEMPLATES } from '../data/starterProjects';
import type { RuntimeSpriteState, RuntimeValue, ScriptStack } from '../types/project';

test('Physics solver integrates gravity and resolves dynamic vs static floor bounce', () => {
  const bodies: PhysicsBody[] = [
    {
      id: 'ball',
      x: 0,
      y: 25,
      vx: 0,
      vy: -200,
      width: 20,
      height: 20,
      scaleX: 1,
      scaleY: 1,
      enabled: true,
      isStatic: false,
      solid: true,
      shape: 'circle',
      mass: 1,
      friction: 0.2,
      restitution: 0.8,
      gravityScale: 1,
      onGround: false,
    },
    {
      id: 'floor',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: 200,
      height: 20,
      scaleX: 1,
      scaleY: 1,
      enabled: true,
      isStatic: true,
      solid: true,
      shape: 'aabb',
      mass: 100,
      friction: 0.5,
      restitution: 0.8,
      gravityScale: 0,
      onGround: false,
    },
  ];

  // Step several frames until ball hits floor and bounces up
  let bounced = false;
  for (let i = 0; i < 15; i++) {
    stepPhysicsWorld(bodies, { gravityX: 0, gravityY: -500, airDrag: 0 }, 1 / 60);
    if (bodies[0].vy > 0) {
      bounced = true;
      break;
    }
  }
  assert.equal(bounced, true, 'Dynamic circle should bounce upward off static AABB floor');
  assert.equal(bodies[1].y, 0, 'Static floor must not move');
});

test('2D Raycaster detects AABB obstacle and returns exact distance', () => {
  const bodies: PhysicsBody[] = [
    {
      id: 'wall',
      x: 100,
      y: 0,
      vx: 0,
      vy: 0,
      width: 40,
      height: 100,
      scaleX: 1,
      scaleY: 1,
      enabled: true,
      isStatic: true,
      solid: true,
      shape: 'aabb',
      mass: 10,
      friction: 0,
      restitution: 0,
      gravityScale: 0,
      onGround: false,
    },
  ];

  const hit = raycastBodies(0, 0, 200, 0, bodies);
  assert.equal(hit.hit, true);
  assert.equal(hit.bodyId, 'wall');
  assert.ok(Math.abs(hit.distance - 80) < 0.01, `Expected distance 80, got ${hit.distance}`);

  const miss = raycastBodies(0, 0, 0, 200, bodies);
  assert.equal(miss.hit, false);
});

test('SparkVM executes first-class functions with return values, local let scope, arrays and dictionaries', () => {
  const globals: Record<string, RuntimeValue> = { result: 0, stats: {}, items: [] };
  const sprite: RuntimeSpriteState = {
    id: 's1',
    sourceId: 's1',
    name: 'Hero',
    isClone: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 1,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    width: 32,
    height: 32,
    pivotX: 0.5,
    pivotY: 0.5,
    physics: { enabled: false, isStatic: false, shape: 'aabb', mass: 1, friction: 0, restitution: 0, gravityScale: 0, solid: false },
    light: { type: 'none', color: '#fff', radius: 100, intensity: 0, angle: 60, castsShadow: false },
    effects: { chromatic: 0, pixelate: 0, vignette: 0, tint: '', tintAmount: 0 },
    sayText: '',
    sayTimer: 0,
    onGround: false,
    emitter: null,
  };

  const scripts: ScriptStack[] = [
    {
      id: 'fn_stack',
      x: 0,
      y: 0,
      blocks: [
        createBlockNode('fn_define', { name: 'addScaled', param1: 'a', param2: 'b' }),
        createBlockNode('data_let_local', {
          name: 'tmp',
          value: blockInputFromNode(
            createBlockNode('op_math', {
              a: blockInputFromNode(createBlockNode('data_get_var', { name: 'a' })),
              op: '+',
              b: blockInputFromNode(createBlockNode('data_get_var', { name: 'b' })),
            })
          ),
        }),
        createBlockNode('fn_return', {
          value: blockInputFromNode(
            createBlockNode('op_math', {
              a: blockInputFromNode(createBlockNode('data_get_var', { name: 'tmp' })),
              op: '*',
              b: 3,
            })
          ),
        }),
      ],
    },
    {
      id: 'main_stack',
      x: 0,
      y: 0,
      blocks: [
        createBlockNode('event_when_flag'),
        createBlockNode('data_set_global', {
          name: 'result',
          value: blockInputFromNode(createBlockNode('fn_call_reporter', { name: 'addScaled', arg1: 4, arg2: 6 })),
        }),
        createBlockNode('data_dict_set', { name: 'stats', key: 'hp', value: 95 }),
        createBlockNode('data_array_push', { name: 'items', value: 'keycard' }),
        createBlockNode('motion_tween', { prop: 'x', target: 100, secs: 0.5, easing: 'easeInOut' }),
      ],
    },
  ];

  const host: VMHost = {
    getSprite: (id) => (id === 's1' ? sprite : undefined),
    getAllSprites: () => [sprite],
    findSpritesByName: () => [sprite],
    getSpriteScripts: () => scripts,
    getGlobal: (k) => globals[k] ?? 0,
    setGlobal: (k, v) => {
      globals[k] = v;
    },
    isKeyDown: () => false,
    getMouse: () => ({ x: 0, y: 0, down: false }),
    getTimer: () => 0,
    isTouching: () => false,
    raycast: () => ({ hit: false, distance: 100 }),
    setGravityY: () => {},
    cameraGoTo: () => {},
    cameraFollow: () => {},
    cameraSetZoom: () => {},
    cameraShake: () => {},
    setStageFx: () => {},
    burstParticles: () => {},
    setEmitter: () => {},
    spawnClone: () => null,
    deleteClone: () => {},
    getCostumeCount: () => 1,
  };

  const vm = new SparkVM(host);
  vm.triggerFlag();
  vm.stepTick(0.25); // executes result, dict, array, starts tween
  assert.equal(globals.result, 30, 'Custom function addScaled(4, 6) should return (4+6)*3 = 30');
  assert.deepEqual(globals.stats, { hp: 95 });
  assert.deepEqual(globals.items, ['keycard']);

  // Advance tween to completion
  vm.stepTick(0.25);
  vm.stepTick(0.25);
  assert.equal(sprite.x, 100, 'Tween should reach exact target value 100');
  assert.equal(evaluateEasing(0, 'bounce'), 0);
  assert.equal(evaluateEasing(1, 'elastic'), 1);
});

test('Procedural pixel-art symmetry generator is mirrored and flood fill fills enclosed area', () => {
  const buf = generateProceduralBuffer({
    preset: 'symmetry_ship',
    width: 24,
    height: 24,
    seed: 1234,
    primaryColor: '#38BDF8',
    secondaryColor: '#1E293B',
  });
  assert.equal(buf.data.length, 24 * 24 * 4);

  // Verify horizontal symmetry across X axis
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 12; x++) {
      const leftIdx = (y * 24 + x) * 4;
      const rightIdx = (y * 24 + (23 - x)) * 4;
      assert.equal(buf.data[leftIdx + 3], buf.data[rightIdx + 3], `Alpha should mirror at (${x},${y})`);
    }
  }

  // Flood fill test on 4x4 buffer
  const small = new Uint8ClampedArray(4 * 4 * 4);
  const changed = floodFillPixels(small, 4, 4, 1, 1, [255, 0, 128, 255]);
  assert.equal(changed, true);
  assert.equal(small[0], 255);
  assert.equal(small[2], 128);
  assert.equal(small[3], 255);
});

test('Starter projects serialize and deserialize cleanly via JSON round-trip', () => {
  assert.equal(STARTER_TEMPLATES.length, 3);
  for (const tpl of STARTER_TEMPLATES) {
    const project = tpl.build();
    const json = JSON.stringify(project);
    const parsed = JSON.parse(json);
    assert.equal(parsed.id, project.id);
    assert.equal(parsed.sprites.length, project.sprites.length);
    assert.ok(parsed.sprites.length >= 3);
  }
});

test('Block AST snapping supports before/after/body, multi-block stacks, cycle detection, and smart expression slots', () => {
  const moveBlk = createBlockNode('motion_move', { steps: 10 });
  const turnBlk = createBlockNode('motion_turn', { deg: 15 });
  const hatBlk = createBlockNode('event_when_flag');
  const ifBlk = createBlockNode('control_if', {}, [moveBlk]);

  // 1. Insert hat BEFORE a loose statement block
  const resBefore = insertBlockRelative([ifBlk], ifBlk.id, 'before', hatBlk);
  assert.equal(resBefore.inserted, true);
  assert.equal(resBefore.blocks.length, 2);
  assert.equal(resBefore.blocks[0].id, hatBlk.id);
  assert.equal(resBefore.blocks[1].id, ifBlk.id);

  // 2. Insert multiple blocks (merged stack) inside C-block body
  const merged = insertBlocksRelative(resBefore.blocks, ifBlk.id, 'body', [turnBlk]);
  assert.equal(merged.inserted, true);
  assert.equal(merged.blocks[1].body?.length, 2);
  assert.equal(merged.blocks[1].body?.[1].id, turnBlk.id);

  // 3. Ancestor cycle check detects child inside C-block
  assert.equal(containsBlockId(merged.blocks[1], moveBlk.id), true);
  assert.equal(containsBlockId(merged.blocks[1], hatBlk.id), false);

  // 4. Smart input slot matcher snaps boolean into `if` condition and reporter into `move` steps
  assert.equal(findBestInputSlotForBlock(ifBlk, 'boolean'), 'condition');
  assert.equal(findBestInputSlotForBlock(moveBlk, 'reporter'), 'steps');
});

test('Moving a parent block preserves all joined blocks below it (full stack & mid-stack split)', () => {
  const hat = createBlockNode('event_when_flag');
  const b1 = createBlockNode('motion_move', { steps: 10 });
  const b2 = createBlockNode('motion_turn', { deg: 15 });
  const b3 = createBlockNode('looks_say', { text: 'Hi', secs: 1 });
  const stacks: ScriptStack[] = [
    { id: 'st_1', x: 20, y: 20, blocks: [hat, b1, b2, b3] },
  ];

  // Dragging top hat block moves the entire joined stack (4 blocks) together
  const tailIdsFromTop = findBlockTailIds(stacks, hat.id);
  assert.equal(tailIdsFromTop.size, 4);
  const fullMove = extractBlockTailFromStacks(stacks, hat.id);
  assert.equal(fullMove.wasFullStack, true);
  assert.equal(fullMove.extracted.length, 4);
  assert.equal(fullMove.stacks.length, 0);

  // Dragging mid-stack parent block `b1` carries `[b1, b2, b3]` together while leaving `[hat]`
  const midMove = extractBlockTailFromStacks(stacks, b1.id);
  assert.equal(midMove.wasFullStack, false);
  assert.deepEqual(
    midMove.extracted.map((n) => n.id),
    [b1.id, b2.id, b3.id]
  );
  assert.equal(midMove.stacks.length, 1);
  assert.deepEqual(
    midMove.stacks[0].blocks.map((n) => n.id),
    [hat.id]
  );
});

test('Tidy Blocks bounding-box solver and free position finder produce zero overlaps across 5+ scripts', () => {
  const project = STARTER_TEMPLATES[0].build();
  const runner = project.sprites[0];
  // Add 2 extra stacks (bringing Runner to 5 scripts, including overlapping initial coords)
  const messy: ScriptStack[] = [
    ...runner.scripts.map((s) => ({ ...s, x: 20, y: 20 })),
    {
      id: 'st_extra_1',
      x: 20,
      y: 20,
      blocks: [createBlockNode('event_when_flag'), createBlockNode('motion_turn', { deg: 15 })],
    },
    {
      id: 'st_extra_2',
      x: 20,
      y: 20,
      blocks: [createBlockNode('motion_turn', { deg: 30 }), createBlockNode('motion_move', { steps: 20 })],
    },
  ];

  const tidied = layoutStacksWithoutOverlap(messy, { columns: 2, padding: 20, gapX: 34, gapY: 28 });
  assert.equal(tidied.length, 5);

  const boxes = tidied.map((st) => {
    const sz = estimateStackBounds(st);
    return { id: st.id, x: st.x, y: st.y, width: sz.width, height: sz.height };
  });

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      assert.equal(
        rectsOverlap(boxes[i], boxes[j], 10),
        false,
        `Stacks ${boxes[i].id} and ${boxes[j].id} must not overlap after Tidy Blocks`
      );
    }
  }

  // Finding free canvas position for a 6th stack must not overlap any of the 5 tidied stacks
  const sixth: ScriptStack = {
    id: 'st_extra_3',
    x: 0,
    y: 0,
    blocks: [createBlockNode('event_when_flag'), createBlockNode('motion_move', { steps: 5 })],
  };
  const freePos = findFreeCanvasPosition(tidied, sixth);
  const sixthSz = estimateStackBounds(sixth);
  const sixthBox = { x: freePos.x, y: freePos.y, width: sixthSz.width, height: sixthSz.height };
  for (const b of boxes) {
    assert.equal(rectsOverlap(sixthBox, b, 8), false, `New stack must not overlap ${b.id}`);
  }
});

test('All 10 bifurcated block categories register definitions and matching VM handlers', () => {
  assert.equal(BLOCK_CATEGORIES.length, 10);
  let totalCategoryBlocks = 0;
  for (const cat of BLOCK_CATEGORIES) {
    const list = BLOCKS_BY_CATEGORY[cat.id];
    assert.ok(Array.isArray(list) && list.length > 0, `Category ${cat.id} should have dedicated blocks`);
    for (const def of list) {
      assert.equal(def.category, cat.id, `Block ${def.opcode} must match category ${cat.id}`);
      if (def.shape === 'reporter' || def.shape === 'boolean') {
        assert.ok(
          EXPRESSION_HANDLERS[def.opcode],
          `Expression opcode ${def.opcode} must have a registered VM expression handler`
        );
      } else if (def.shape === 'stack' || def.shape === 'c-block') {
        assert.ok(
          STATEMENT_HANDLERS[def.opcode],
          `Statement opcode ${def.opcode} must have a registered VM statement handler`
        );
      }
    }
    totalCategoryBlocks += list.length;
  }
  assert.equal(totalCategoryBlocks, BLOCK_DEFINITIONS.length);
});

test('CommandHistoryManager supports undo/redo across scripts, sprites, stage, globals, and edit coalescing', () => {
  let state = STARTER_TEMPLATES[0].build();
  const history = new CommandHistoryManager(50, 500);
  const sprite0 = state.sprites[0];
  const initialScriptCount = sprite0.scripts.length;

  // 1. Block script edit + undo + redo
  const addedStack: ScriptStack = {
    id: 'stack_cmd_test',
    x: 40,
    y: 40,
    blocks: [createBlockNode('event_when_flag'), createBlockNode('motion_move', { steps: 12 })],
  };
  state = history.execute(
    new UpdateScriptsCommand(
      sprite0.id,
      sprite0.scripts,
      [...sprite0.scripts, addedStack],
      'Add block'
    ),
    state
  ).state;
  assert.equal(state.sprites[0].scripts.length, initialScriptCount + 1);
  assert.equal(history.getSnapshot().canUndo, true);
  assert.equal(history.getSnapshot().undoLabel, 'Add block');

  // 2. Coalesced rapid edits (e.g., typing into a block input) merge into a single undo step
  const baseScripts = state.sprites[0].scripts;
  const edit1 = baseScripts.map((st) => (st.id === addedStack.id ? { ...st, x: 50 } : st));
  const edit2 = baseScripts.map((st) => (st.id === addedStack.id ? { ...st, x: 80 } : st));
  state = history.execute(
    new UpdateScriptsCommand(sprite0.id, baseScripts, edit1, 'Edit block value', 'input:1', 1000),
    state
  ).state;
  state = history.execute(
    new UpdateScriptsCommand(sprite0.id, edit1, edit2, 'Edit block value', 'input:1', 1200),
    state
  ).state;
  assert.equal(history.getSnapshot().undoCount, 2, 'Rapid edits with same mergeKey should coalesce');
  assert.equal(state.sprites[0].scripts.find((s) => s.id === addedStack.id)?.x, 80);

  // Undo coalesced edit restores original x = 40 in one step
  const undoCoalesced = history.undo(state);
  assert.ok(undoCoalesced);
  state = undoCoalesced.state;
  assert.equal(state.sprites[0].scripts.find((s) => s.id === addedStack.id)?.x, 40);
  assert.equal(history.getSnapshot().canRedo, true);

  // Redo restores x = 80
  const redoCoalesced = history.redo(state);
  assert.ok(redoCoalesced);
  state = redoCoalesced.state;
  assert.equal(state.sprites[0].scripts.find((s) => s.id === addedStack.id)?.x, 80);

  // 3. AddSpriteCommand + DeleteSpriteCommand preserve exact sprite index and texture rebuild flag
  const extraSprite = createBlankSprite(99);
  const addRes = history.execute(new AddSpriteCommand(extraSprite), state);
  assert.equal(addRes.rebuildTextures, true);
  state = addRes.state;
  const insertedIdx = state.sprites.findIndex((s) => s.id === extraSprite.id);
  assert.ok(insertedIdx > 0);

  const delRes = history.execute(new DeleteSpriteCommand(extraSprite, insertedIdx), state);
  assert.equal(delRes.rebuildTextures, true);
  state = delRes.state;
  assert.equal(state.sprites.some((s) => s.id === extraSprite.id), false);

  const undoDel = history.undo(state);
  assert.ok(undoDel);
  state = undoDel.state;
  assert.equal(state.sprites[insertedIdx]?.id, extraSprite.id, 'Undoing delete should restore exact index');

  // 4. Executing a new command after undo clears the redo stack
  const prevSprite = state.sprites[0];
  state = history.execute(
    new UpdateSpriteCommand(prevSprite, { ...prevSprite, x: 123 }, false, 'Move sprite'),
    state
  ).state;
  assert.equal(history.getSnapshot().canRedo, false);
  assert.equal(state.sprites[0].x, 123);

  // 5. Stage and globals commands undo/redo cleanly
  const origGravity = state.stage.gravityY;
  state = history.execute(
    new UpdateStageCommand(state.stage, { ...state.stage, gravityY: -400 }),
    state
  ).state;
  assert.equal(state.stage.gravityY, -400);
  state = history.undo(state)!.state;
  assert.equal(state.stage.gravityY, origGravity);

  state = history.execute(
    new UpdateGlobalsCommand(
      state.globals,
      state.watchedGlobals,
      { ...state.globals, lives: 5 },
      [...state.watchedGlobals, 'lives']
    ),
    state
  ).state;
  assert.equal(state.globals.lives, 5);
  state = history.undo(state)!.state;
  assert.equal(state.globals.lives, undefined);

  // 6. Bounded maxDepth trims oldest entries
  const smallHistory = new CommandHistoryManager(2, 0);
  for (let i = 1; i <= 4; i += 1) {
    const prev = state.stage;
    state = smallHistory.execute(
      new UpdateStageCommand(prev, { ...prev, gravityY: -i * 100 }, `Stage ${i}`),
      state
    ).state;
  }
  assert.equal(smallHistory.getSnapshot().undoCount, 2);
});

test('WebGL2 Hardware Shadow & Bloom pipeline normalizes config, packs GPU uniforms, and falls back gracefully without WebGL2', () => {
  // 1. Default & clamped config normalization
  const def = normalizeWebGL2Config();
  assert.deepEqual(def, DEFAULT_WEBGL2_CONFIG);
  const clamped = normalizeWebGL2Config({
    backend: 'webgl2',
    normalStrength: 99,
    shadowSoftness: -2,
    bloomThreshold: 0.01,
    bloomIntensity: 10,
    bloomRadius: 20,
  });
  assert.equal(clamped.backend, 'webgl2');
  assert.equal(clamped.normalStrength, 3);
  assert.equal(clamped.shadowSoftness, 0);
  assert.equal(clamped.bloomThreshold, 0.15);
  assert.equal(clamped.bloomIntensity, 2.5);
  assert.equal(clamped.bloomRadius, 6);

  // 2. Hex to linear RGB conversion
  const [r, g, b] = hexToRgb01('#FF8000');
  assert.ok(Math.abs(r - 1) < 0.01);
  assert.ok(Math.abs(g - 128 / 255) < 0.01);
  assert.equal(b, 0);

  // 3. Light & Occluder uniform packing (GL Y-up pixel coordinates + spotlight cone + OBB rotation)
  const makeSprite = (overrides: Partial<RuntimeSpriteState>): RuntimeSpriteState => ({
    id: 'sp',
    sourceId: 'sp',
    name: 'Sprite',
    isClone: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 1,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    width: 40,
    height: 20,
    pivotX: 0.5,
    pivotY: 0.5,
    physics: { enabled: true, isStatic: true, shape: 'aabb', mass: 1, friction: 0, restitution: 0, gravityScale: 0, solid: true },
    light: { type: 'none', color: '#38BDF8', radius: 150, intensity: 1, angle: 60, castsShadow: true },
    effects: { chromatic: 0, pixelate: 0, vignette: 0, tint: '', tintAmount: 0 },
    sayText: '',
    sayTimer: 0,
    onGround: false,
    emitter: null,
    ...overrides,
  });

  const spotLight = makeSprite({
    id: 'spot1',
    x: 50,
    y: 40,
    rotation: 90, // straight UP in world & WebGL2 Y-up space
    light: { type: 'spot', color: '#38BDF8', radius: 200, intensity: 1.2, angle: 60, castsShadow: false },
  });
  const packedLights = packLightsUniformData(
    [spotLight],
    (wx) => 280 + wx,
    (wy) => 180 - wy,
    1,
    2,
    720
  );
  assert.equal(packedLights.count, 1);
  assert.equal(packedLights.posRad[0], 660); // (280 + 50) * 2
  assert.equal(packedLights.posRad[1], 440); // 720 - (180 - 40) * 2
  assert.equal(packedLights.posRad[2], 400); // radius 200 * camZoom 1 * dpr 2
  assert.equal(packedLights.colorType[3], 1); // isSpot === 1
  assert.ok(Math.abs(packedLights.spotDir[0] - 0) < 1e-5, 'cos(90deg) = 0');
  assert.ok(Math.abs(packedLights.spotDir[1] - 1) < 1e-5, 'sin(90deg) = 1');
  assert.ok(Math.abs(packedLights.spotDir[2] - Math.cos(Math.PI / 6)) < 1e-5, 'cos(30deg) half-cone');

  // Verify max light clamping
  const manyLights = Array.from({ length: MAX_WEBGL2_LIGHTS + 5 }, (_, i) =>
    makeSprite({ id: `l_${i}`, light: { type: 'point', color: '#fff', radius: 100, intensity: 1, angle: 60, castsShadow: false } })
  );
  assert.equal(
    packLightsUniformData(manyLights, (x) => x, (y) => y, 1, 1, 360).count,
    MAX_WEBGL2_LIGHTS
  );

  // Verify OBB occluder packing & max clamping
  const pillar = makeSprite({ id: 'occ1', x: 10, y: 20, width: 60, height: 30, rotation: 90 });
  const packedOcc = packOccludersUniformData(
    [pillar],
    (wx) => 100 + wx,
    (wy) => 100 - wy,
    1,
    1,
    200
  );
  assert.equal(packedOcc.count, 1);
  assert.equal(packedOcc.boxes[0], 110);
  assert.equal(packedOcc.boxes[1], 120);
  assert.equal(packedOcc.boxes[2], 30); // halfW
  assert.equal(packedOcc.boxes[3], 15); // halfH
  assert.ok(Math.abs(packedOcc.rotations[0] - 0) < 1e-5);
  assert.ok(Math.abs(packedOcc.rotations[1] - 1) < 1e-5);

  const manyOcc = Array.from({ length: MAX_WEBGL2_OCCLUDERS + 4 }, (_, i) => makeSprite({ id: `o_${i}` }));
  assert.equal(
    packOccludersUniformData(manyOcc, (x) => x, (y) => y, 1, 1, 360).count,
    MAX_WEBGL2_OCCLUDERS
  );

  // 4. All 5 GLSL ES 3.00 shaders present with expected passes
  for (const [name, src] of Object.entries(GLSL_SHADERS)) {
    assert.ok(src.startsWith('#version 300 es'), `Shader ${name} must target GLSL ES 3.00`);
  }
  assert.ok(GLSL_SHADERS.lightingFrag.includes('computeSpriteNormal'));
  assert.ok(GLSL_SHADERS.lightingFrag.includes('computeHardSoftShadow'));
  assert.ok(GLSL_SHADERS.bloomExtractFrag.includes('uThreshold'));
  assert.ok(GLSL_SHADERS.bloomBlurFrag.includes('uDirection'));
  assert.ok(GLSL_SHADERS.compositeFrag.includes('uBloomTex'));

  // 5. Graceful fallback in headless Node environment (no DOM / no WebGL2)
  const lightingProject = STARTER_TEMPLATES[2].build();
  assert.equal(lightingProject.stage.webgl2?.backend, 'webgl2');
  const pipeline = new WebGL2LightingBloomPipeline();
  assert.equal(pipeline.isAvailable(), false);
  assert.ok(pipeline.getFallbackReason());
  assert.equal(
    pipeline.render({
      sceneCanvas: null as unknown as HTMLCanvasElement,
      spriteCanvas: null,
      width: 560,
      height: 360,
      dpr: 1,
      stage: lightingProject.stage,
      config: normalizeWebGL2Config(lightingProject.stage.webgl2),
      lights: [],
      occluders: [],
      toScreenX: (x) => x,
      toScreenY: (y) => y,
      camZoom: 1,
    }),
    -1
  );
  pipeline.dispose();
});

test('Improved SparkVM normalizes config, boosts step budget with symbol cache, and SparkEngine enforces Elite-only gating', () => {
  // 1. Config normalization & clamping
  const def = normalizeImprovedVMConfig();
  assert.deepEqual(def, DEFAULT_IMPROVED_VM_CONFIG);
  const clamped = normalizeImprovedVMConfig({
    enabled: true,
    stepBudget: 5000,
    fastSymbolCache: true,
    expandedLimits: true,
  });
  assert.equal(clamped.enabled, true);
  assert.equal(clamped.stepBudget, 1024);

  const lowClamp = normalizeImprovedVMConfig({ enabled: true, stepBudget: 10 });
  assert.equal(lowClamp.stepBudget, 128);

  // 2. SparkEngine Elite-only gating for WebGL2 & Improved SparkVM
  const project = STARTER_TEMPLATES[2].build(); // Lighting demo requests webgl2
  project.stage.improvedVM = {
    enabled: true,
    stepBudget: 512,
    fastSymbolCache: true,
    expandedLimits: true,
  };

  const engine = new SparkEngine(project);
  // Default (free / null) must gate WebGL2 & Improved SparkVM off
  let tele = engine.getTelemetry();
  assert.equal(tele.renderBackend.requested, 'canvas2d');
  assert.equal(tele.vmStats.improvedActive, false);
  assert.equal(tele.vmStats.stepBudget, 48);
  assert.equal(tele.vmStats.maxClones, 90);
  assert.equal(tele.vmStats.maxParticles, 420);

  // Pro Contributor still does not unlock Elite-only WebGL2 or Improved SparkVM
  engine.setEntitlementTier('pro');
  tele = engine.getTelemetry();
  assert.equal(tele.renderBackend.requested, 'canvas2d');
  assert.equal(tele.vmStats.improvedActive, false);
  assert.equal(tele.vmStats.stepBudget, 48);

  // Elite Member unlocks both WebGL2 request and Improved SparkVM turbo budget & caps
  engine.setEntitlementTier('elite');
  tele = engine.getTelemetry();
  assert.equal(tele.renderBackend.requested, 'webgl2');
  assert.equal(tele.vmStats.improvedActive, true);
  assert.equal(tele.vmStats.stepBudget, 512);
  assert.equal(tele.vmStats.fastSymbolCache, true);
  assert.equal(tele.vmStats.maxClones, 250);
  assert.equal(tele.vmStats.maxParticles, 1200);

  // Downgrading back to Plus revokes Elite runtime boosts cleanly
  engine.setEntitlementTier('plus');
  tele = engine.getTelemetry();
  assert.equal(tele.renderBackend.requested, 'canvas2d');
  assert.equal(tele.vmStats.improvedActive, false);
  assert.equal(tele.vmStats.stepBudget, 48);
  assert.equal(tele.vmStats.maxClones, 90);
  assert.equal(tele.vmStats.maxParticles, 420);

  engine.dispose();
});





