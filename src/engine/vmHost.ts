// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  CameraState,
  ParticlePreset,
  RuntimeSpriteState,
  RuntimeValue,
  ScriptStack,
  SparkProject,
  SpriteData,
  StageSettings,
} from '../types/project';
import { checkOverlap, raycastBodies, type PhysicsBody } from './physics';
import type { VMHost } from './vm';
import { normalizeWebGL2Config } from './webgl2Pipeline';

export interface EngineHostAccess {
  getProject: () => SparkProject;
  getRuntimeStage: () => StageSettings;
  getRuntimeSprites: () => RuntimeSpriteState[];
  getRuntimeGlobals: () => Record<string, RuntimeValue>;
  getCamera: () => CameraState;
  isKeyDown: (key: string) => boolean;
  getMouse: () => { x: number; y: number; down: boolean };
  getSimTime: () => number;
  getMaxClones: () => number;
  nextCloneId: (sourceId: string) => string;
  createCloneRuntime: (source: SpriteData, cloneId: string) => RuntimeSpriteState;
  spawnParticlesAt: (
    x: number,
    y: number,
    preset: ParticlePreset,
    count: number,
    color: string,
    speed: number
  ) => void;
}

function toPhysicsBody(s: RuntimeSpriteState): PhysicsBody {
  return { ...s, ...s.physics, id: s.id, onGround: s.onGround };
}

export function createEngineVMHost(access: EngineHostAccess): VMHost {
  return {
    getSprite: (id) => access.getRuntimeSprites().find((s) => s.id === id),
    getAllSprites: () => access.getRuntimeSprites(),
    findSpritesByName: (name) =>
      access.getRuntimeSprites().filter((s) => s.name.toLowerCase() === name.toLowerCase()),
    getSpriteScripts: (sourceId): ScriptStack[] =>
      access.getProject().sprites.find((s) => s.id === sourceId)?.scripts ?? [],
    getGlobal: (name) => access.getRuntimeGlobals()[name] ?? 0,
    setGlobal: (name, value) => {
      access.getRuntimeGlobals()[name] = value;
    },
    isKeyDown: access.isKeyDown,
    getMouse: access.getMouse,
    getTimer: access.getSimTime,
    isTouching: (spriteId, targetName) => {
      const sprites = access.getRuntimeSprites();
      const self = sprites.find((s) => s.id === spriteId);
      if (!self || !self.visible) return false;
      const bodyA = toPhysicsBody(self);
      return sprites.some(
        (t) =>
          t.id !== spriteId &&
          t.visible &&
          t.name.toLowerCase() === targetName.toLowerCase() &&
          checkOverlap(bodyA, toPhysicsBody(t))
      );
    },
    raycast: (spriteId, deg, maxDist) => {
      const sprites = access.getRuntimeSprites();
      const self = sprites.find((s) => s.id === spriteId);
      if (!self) return { hit: false, distance: maxDist };
      const rad = ((self.rotation + deg) * Math.PI) / 180;
      const bodies = sprites.filter((s) => s.visible).map(toPhysicsBody);
      const hit = raycastBodies(
        self.x,
        self.y,
        self.x + Math.cos(rad) * maxDist,
        self.y + Math.sin(rad) * maxDist,
        bodies,
        spriteId
      );
      return { hit: hit.hit, distance: hit.distance };
    },
    setGravityY: (gy) => {
      access.getRuntimeStage().gravityY = gy;
    },
    cameraGoTo: (x, y) => {
      const cam = access.getCamera();
      cam.followTargetId = null;
      cam.x = x;
      cam.y = y;
    },
    cameraFollow: (targetNameOrId, spriteId, smoothing) => {
      const cam = access.getCamera();
      if (!targetNameOrId || targetNameOrId === 'none') {
        cam.followTargetId = null;
        return;
      }
      if (targetNameOrId === 'self') {
        cam.followTargetId = spriteId;
      } else {
        const found = access.getRuntimeSprites().find(
          (s) => s.name.toLowerCase() === targetNameOrId.toLowerCase() || s.id === targetNameOrId
        );
        cam.followTargetId = found ? found.id : null;
      }
      cam.followSmoothing = Math.max(0.02, Math.min(0.95, smoothing || 0.12));
    },
    cameraSetZoom: (zoom) => {
      access.getCamera().zoom = Math.max(0.25, Math.min(4, zoom));
    },
    cameraShake: (power, secs) => {
      const cam = access.getCamera();
      cam.shakeIntensity = Math.max(0, power);
      cam.shakeDuration = Math.max(0.05, secs);
      cam.shakeTimer = Math.max(0.05, secs);
    },
    setStageFx: (fx, amount) => {
      const stage = access.getRuntimeStage();
      if (fx === 'chromatic') stage.stageEffects.chromatic = Math.max(0, amount);
      else if (fx === 'pixelate') stage.stageEffects.pixelate = Math.max(0, amount);
      else if (fx === 'vignette') stage.stageEffects.vignette = Math.max(0, Math.min(1, amount));
      else if (fx === 'tintAmount') stage.stageEffects.tintAmount = Math.max(0, Math.min(1, amount));
      else if (fx === 'bloom') {
        const cfg = normalizeWebGL2Config(stage.webgl2);
        stage.webgl2 = {
          ...cfg,
          bloomEnabled: amount > 0.01,
          bloomIntensity: Math.max(0, Math.min(2.5, amount)),
        };
      }
    },
    burstParticles: (spriteId, preset, count, color, speed) => {
      const sp = access.getRuntimeSprites().find((s) => s.id === spriteId);
      if (sp) access.spawnParticlesAt(sp.x, sp.y, preset, count, color, speed);
    },
    setEmitter: (spriteId, active, preset, rate, color) => {
      const sp = access.getRuntimeSprites().find((s) => s.id === spriteId);
      if (!sp) return;
      sp.emitter = active
        ? { active: true, preset, rate, speed: 90, size: 4, color, accumulator: 0 }
        : null;
    },
    spawnClone: (targetNameOrSelf, callerSpriteId) => {
      const sprites = access.getRuntimeSprites();
      if (sprites.length >= access.getMaxClones()) return null;
      const caller = sprites.find((s) => s.id === callerSpriteId);
      const projectSprites = access.getProject().sprites;
      const sourceData =
        targetNameOrSelf === 'self' && caller
          ? projectSprites.find((s) => s.id === caller.sourceId)
          : projectSprites.find((s) => s.name.toLowerCase() === targetNameOrSelf.toLowerCase());
      if (!sourceData) return null;

      const clone = access.createCloneRuntime(sourceData, access.nextCloneId(sourceData.id));
      if (caller) {
        clone.x = caller.x;
        clone.y = caller.y;
        clone.rotation = caller.rotation;
      }
      sprites.push(clone);
      return clone;
    },
    deleteClone: (spriteId) => {
      const sprites = access.getRuntimeSprites();
      const idx = sprites.findIndex((s) => s.id === spriteId && s.isClone);
      if (idx >= 0) sprites.splice(idx, 1);
    },
    getCostumeCount: (sourceId) =>
      access.getProject().sprites.find((s) => s.id === sourceId)?.costumes.length ?? 1,
  };
}
