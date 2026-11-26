// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Particle, ParticlePreset } from '../types/project';

interface ParticlePresetProfile {
  sizeRange: [number, number];
  endSize: number;
  lifeRange: [number, number];
  gravity: number;
  drag: number;
  blend: Particle['blend'];
  alpha: number;
  velocity: (speed: number) => { vx: number; vy: number };
}

const DEFAULT_PROFILE: ParticlePresetProfile = {
  sizeRange: [4, 7],
  endSize: 0.5,
  lifeRange: [0.35, 0.75],
  gravity: 0,
  drag: 1.6,
  blend: 'add',
  alpha: 0.95,
  velocity: (speed) => {
    const angle = Math.random() * Math.PI * 2;
    const spd = (0.35 + Math.random() * 0.75) * speed;
    return { vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd };
  },
};

const PRESET_PROFILES: Partial<Record<ParticlePreset, ParticlePresetProfile>> = {
  fire: {
    sizeRange: [6, 11],
    endSize: 1,
    lifeRange: [0.3, 0.65],
    gravity: 90,
    drag: 1.2,
    blend: 'add',
    alpha: 0.95,
    velocity: (speed) => ({
      vx: (Math.random() - 0.5) * speed * 0.55,
      vy: Math.abs(Math.random() * speed * 0.9) + 30,
    }),
  },
  smoke: {
    sizeRange: [5, 9],
    endSize: 14,
    lifeRange: [0.55, 1.0],
    gravity: 40,
    drag: 1.8,
    blend: 'normal',
    alpha: 0.5,
    velocity: (speed) => ({
      vx: (Math.random() - 0.5) * speed * 0.45,
      vy: 25 + Math.random() * speed * 0.5,
    }),
  },
  sparks: {
    ...DEFAULT_PROFILE,
    sizeRange: [2.5, 4.7],
    endSize: 0.4,
    lifeRange: [0.25, 0.57],
    gravity: -360,
    drag: 1.1,
  },
  trail: {
    ...DEFAULT_PROFILE,
    sizeRange: [4.5, 7],
    endSize: 0.5,
    lifeRange: [0.22, 0.42],
    drag: 2.5,
    velocity: (speed) => ({
      vx: (Math.random() - 0.5) * speed * 0.25,
      vy: (Math.random() - 0.5) * speed * 0.25,
    }),
  },
  plasma: {
    ...DEFAULT_PROFILE,
    sizeRange: [5, 9],
    endSize: 0.8,
    lifeRange: [0.45, 0.85],
    drag: 0.9,
  },
};

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function spawnParticleBurst(
  particles: Particle[],
  maxParticles: number,
  x: number,
  y: number,
  preset: ParticlePreset,
  count: number,
  color: string,
  speed: number
): void {
  const profile = PRESET_PROFILES[preset] ?? DEFAULT_PROFILE;
  for (let i = 0; i < count; i++) {
    if (particles.length >= maxParticles) particles.shift();
    const { vx, vy } = profile.velocity(speed);
    const maxLife = randBetween(profile.lifeRange[0], profile.lifeRange[1]);
    particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx,
      vy,
      size: randBetween(profile.sizeRange[0], profile.sizeRange[1]),
      endSize: profile.endSize,
      life: maxLife,
      maxLife,
      color,
      alpha: profile.alpha,
      drag: profile.drag,
      gravity: profile.gravity,
      blend: profile.blend,
    });
  }
}
