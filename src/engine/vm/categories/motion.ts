// SPDX-License-Identifier: AGPL-3.0-or-later
import type { EasingType } from '../../../types/project';
import { toNumber, type ActiveTween, type StatementHandler } from '../types';

const VALID_TWEEN_PROPS: ActiveTween['prop'][] = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity'];
const VALID_EASINGS: EasingType[] = ['linear', 'easeInOut', 'bounce', 'elastic'];

export const MOTION_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  motion_move: ({ sprite, val }) => {
    const steps = toNumber(val('steps'));
    const rad = (sprite.rotation * Math.PI) / 180;
    sprite.x += Math.cos(rad) * steps;
    sprite.y += Math.sin(rad) * steps;
    return false;
  },
  motion_goto: ({ sprite, val }) => {
    sprite.x = toNumber(val('x'));
    sprite.y = toNumber(val('y'));
    return false;
  },
  motion_change_xy: ({ sprite, val }) => {
    sprite.x += toNumber(val('dx'));
    sprite.y += toNumber(val('dy'));
    return false;
  },
  motion_turn: ({ sprite, val }) => {
    sprite.rotation = (sprite.rotation + toNumber(val('deg'))) % 360;
    return false;
  },
  motion_point_dir: ({ sprite, val }) => {
    sprite.rotation = toNumber(val('deg'));
    return false;
  },
  motion_point_mouse: ({ host, sprite }) => {
    const m = host.getMouse();
    sprite.rotation = (Math.atan2(m.y - sprite.y, m.x - sprite.x) * 180) / Math.PI;
    return false;
  },
  motion_tween: ({ sprite, thread, val }) => {
    const prop = String(val('prop')) as ActiveTween['prop'];
    const safeProp = VALID_TWEEN_PROPS.includes(prop) ? prop : 'x';
    const targetVal = toNumber(val('target'));
    const duration = Math.max(0.01, toNumber(val('secs')));
    const easing = String(val('easing')) as EasingType;
    thread.activeTween = {
      prop: safeProp,
      startVal: sprite[safeProp],
      targetVal,
      elapsed: 0,
      duration,
      easing: VALID_EASINGS.includes(easing) ? easing : 'easeInOut',
    };
    return true;
  },
  motion_scale: ({ sprite, val }) => {
    sprite.scaleX = toNumber(val('sx'));
    sprite.scaleY = toNumber(val('sy'));
    return false;
  },
  motion_skew: ({ sprite, val }) => {
    sprite.skewX = toNumber(val('skx'));
    sprite.skewY = toNumber(val('sky'));
    return false;
  },
};
