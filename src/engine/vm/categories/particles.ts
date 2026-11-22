// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ParticlePreset } from '../../../types/project';
import { toNumber, type StatementHandler } from '../types';

export const PARTICLES_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  particles_burst: ({ host, sprite, val }) => {
    host.burstParticles(
      sprite.id,
      String(val('preset')) as ParticlePreset,
      Math.max(1, Math.min(80, Math.floor(toNumber(val('count'))))),
      String(val('color')),
      toNumber(val('speed'))
    );
    return false;
  },
  particles_emitter: ({ host, sprite, val }) => {
    host.setEmitter(
      sprite.id,
      String(val('state')) === 'on',
      String(val('preset')) as ParticlePreset,
      Math.max(1, toNumber(val('rate'))),
      String(val('color'))
    );
    return false;
  },
};
