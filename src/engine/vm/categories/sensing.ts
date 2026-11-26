// SPDX-License-Identifier: AGPL-3.0-or-later
import { toBoolean, toDisplayString, toNumber, type ExpressionHandler } from '../types';

export const SENSING_EXPRESSION_HANDLERS: Record<string, ExpressionHandler> = {
  sensing_key_pressed: ({ host, val }) => host.isKeyDown(String(val('key'))),
  sensing_mouse_down: ({ host }) => host.getMouse().down,
  sensing_prop: ({ host, sprite, val }) => {
    const prop = String(val('prop'));
    const mouse = host.getMouse();
    if (prop === 'x') return sprite.x;
    if (prop === 'y') return sprite.y;
    if (prop === 'vx') return sprite.vx;
    if (prop === 'vy') return sprite.vy;
    if (prop === 'rotation') return sprite.rotation;
    if (prop === 'scaleX') return sprite.scaleX;
    if (prop === 'scaleY') return sprite.scaleY;
    if (prop === 'costume') return sprite.activeCostumeIndex;
    if (prop === 'mouseX') return mouse.x;
    if (prop === 'mouseY') return mouse.y;
    if (prop === 'timer') return host.getTimer();
    return 0;
  },
  sensing_distance_to: ({ host, sprite, val }) => {
    const target = String(val('target'));
    if (target === 'mouse') {
      const m = host.getMouse();
      return Math.hypot(m.x - sprite.x, m.y - sprite.y);
    }
    const found = host.findSpritesByName(target)[0];
    if (!found) return 9999;
    return Math.hypot(found.x - sprite.x, found.y - sprite.y);
  },
  op_math: ({ val }) => {
    const a = toNumber(val('a'));
    const b = toNumber(val('b'));
    const op = String(val('op'));
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') return b === 0 ? 0 : a / b;
    if (op === '%') return b === 0 ? 0 : a % b;
    return 0;
  },
  op_compare: ({ val }) => {
    const rawA = val('a');
    const rawB = val('b');
    const op = String(val('op'));
    const numA = Number(rawA);
    const numB = Number(rawB);
    const bothNumeric = !Number.isNaN(numA) && !Number.isNaN(numB) && rawA !== '' && rawB !== '';
    const a = bothNumeric ? numA : String(rawA);
    const b = bothNumeric ? numB : String(rawB);
    if (op === '>') return a > b;
    if (op === '<') return a < b;
    if (op === '>=') return a >= b;
    if (op === '<=') return a <= b;
    if (op === '==') return a === b;
    if (op === '!=') return a !== b;
    return false;
  },
  op_logic: ({ val }) => {
    const a = toBoolean(val('a'));
    const b = toBoolean(val('b'));
    return String(val('op')) === 'or' ? a || b : a && b;
  },
  op_not: ({ val }) => !toBoolean(val('a')),
  op_random: ({ val }) => {
    const min = toNumber(val('min'));
    const max = toNumber(val('max'));
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  op_math_fn: ({ val }) => {
    const fn = String(val('fn'));
    const v = toNumber(val('value'));
    if (fn === 'abs') return Math.abs(v);
    if (fn === 'floor') return Math.floor(v);
    if (fn === 'ceil') return Math.ceil(v);
    if (fn === 'round') return Math.round(v);
    if (fn === 'sqrt') return v < 0 ? 0 : Math.sqrt(v);
    if (fn === 'sin') return Math.sin((v * Math.PI) / 180);
    if (fn === 'cos') return Math.cos((v * Math.PI) / 180);
    return v;
  },
  op_join: ({ val }) => `${toDisplayString(val('a'))}${toDisplayString(val('b'))}`,
};
