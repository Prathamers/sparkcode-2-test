// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlendModeType, LightType } from '../../../types/project';
import { toBoolean, toDisplayString, toNumber, type StatementHandler } from '../types';

export const LOOKS_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  looks_costume: ({ host, sprite, val }) => {
    const count = Math.max(1, host.getCostumeCount(sprite.sourceId));
    const idx = Math.floor(toNumber(val('index')));
    sprite.activeCostumeIndex = ((idx % count) + count) % count;
    return false;
  },
  looks_next_costume: ({ host, sprite }) => {
    const count = Math.max(1, host.getCostumeCount(sprite.sourceId));
    sprite.activeCostumeIndex = (sprite.activeCostumeIndex + 1) % count;
    return false;
  },
  looks_opacity: ({ sprite, val }) => {
    sprite.opacity = Math.max(0, Math.min(1, toNumber(val('alpha'))));
    return false;
  },
  looks_blend: ({ sprite, val }) => {
    sprite.blendMode = String(val('mode')) as BlendModeType;
    return false;
  },
  looks_zindex: ({ sprite, val }) => {
    sprite.zIndex = toNumber(val('z'));
    return false;
  },
  looks_say: ({ sprite, val }) => {
    sprite.sayText = toDisplayString(val('text'));
    sprite.sayTimer = Math.max(0.1, toNumber(val('secs')));
    return false;
  },
  looks_visible: ({ sprite, val }) => {
    sprite.visible = toBoolean(val('state'));
    return false;
  },
  looks_set_light: ({ sprite, val }) => {
    sprite.light = {
      ...sprite.light,
      type: String(val('kind')) as LightType,
      color: String(val('color')),
      radius: Math.max(10, toNumber(val('radius'))),
    };
    return false;
  },
};
