// SPDX-License-Identifier: AGPL-3.0-or-later
import { toNumber, type StatementHandler } from '../types';

export const CAMERA_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  camera_goto: ({ host, val }) => {
    host.cameraGoTo(toNumber(val('x')), toNumber(val('y')));
    return false;
  },
  camera_follow: ({ host, sprite, val }) => {
    host.cameraFollow(String(val('target')), sprite.id, toNumber(val('smooth')));
    return false;
  },
  camera_zoom: ({ host, val }) => {
    host.cameraSetZoom(toNumber(val('zoom')));
    return false;
  },
  camera_shake: ({ host, val }) => {
    host.cameraShake(toNumber(val('power')), toNumber(val('secs')));
    return false;
  },
  fx_set_stage: ({ host, val }) => {
    host.setStageFx(String(val('fx')), toNumber(val('amount')));
    return false;
  },
  fx_set_sprite: ({ sprite, val }) => {
    const fx = String(val('fx'));
    const amt = toNumber(val('amount'));
    if (fx === 'pixelate') sprite.effects.pixelate = Math.max(0, amt);
    else if (fx === 'chromatic') sprite.effects.chromatic = Math.max(0, amt);
    else if (fx === 'tintAmount') sprite.effects.tintAmount = Math.max(0, Math.min(1, amt));
    return false;
  },
};
