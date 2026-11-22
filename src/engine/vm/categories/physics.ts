// SPDX-License-Identifier: AGPL-3.0-or-later
import { toBoolean, toNumber, type ExpressionHandler, type StatementHandler } from '../types';

export const PHYSICS_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  physics_impulse: ({ sprite, val }) => {
    sprite.vx += toNumber(val('ix'));
    sprite.vy += toNumber(val('iy'));
    return false;
  },
  physics_set_velocity: ({ sprite, val }) => {
    sprite.vx = toNumber(val('vx'));
    sprite.vy = toNumber(val('vy'));
    return false;
  },
  physics_set_vx: ({ sprite, val }) => {
    sprite.vx = toNumber(val('vx'));
    return false;
  },
  physics_set_gravity: ({ host, val }) => {
    host.setGravityY(toNumber(val('gy')));
    return false;
  },
  physics_set_solid: ({ sprite, val }) => {
    sprite.physics.solid = toBoolean(val('solid'));
    return false;
  },
};

export const PHYSICS_EXPRESSION_HANDLERS: Record<string, ExpressionHandler> = {
  physics_on_ground: ({ sprite }) => sprite.onGround,
  physics_touching: ({ host, sprite, val }) => host.isTouching(sprite.id, String(val('target'))),
  physics_raycast_hit: ({ host, sprite, val }) =>
    host.raycast(sprite.id, toNumber(val('deg')), toNumber(val('dist'))).hit,
  physics_raycast_dist: ({ host, sprite, val }) =>
    Math.round(host.raycast(sprite.id, toNumber(val('deg')), toNumber(val('dist'))).distance),
};
