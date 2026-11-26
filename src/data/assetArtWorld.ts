// SPDX-License-Identifier: AGPL-3.0-or-later
import { shadeHex, wrapSizedSvg, wrapSpriteSvg } from './assetSvgHelpers';

export type WorldArtKind =
  // Space & Sci-Fi
  | 'space_rocket'
  | 'space_fighter'
  | 'space_cruiser'
  | 'space_ufo'
  | 'space_satellite'
  | 'space_station'
  | 'space_asteroid'
  | 'space_meteor'
  | 'space_earth'
  | 'space_saturn'
  | 'space_mars'
  | 'space_neptune'
  | 'space_blackhole'
  | 'space_portal'
  | 'space_turret'
  | 'space_mech'
  | 'space_hoverbike'
  | 'space_plasma'
  | 'space_cryopod'
  | 'space_raygun'
  // Platforms & Buildings
  | 'plat_grass'
  | 'plat_brick'
  | 'plat_stone'
  | 'plat_neon'
  | 'plat_ice'
  | 'plat_lava'
  | 'plat_woodcrate'
  | 'plat_metalcrate'
  | 'plat_question'
  | 'plat_spikes'
  | 'plat_spring'
  | 'plat_ladder'
  | 'plat_bridge'
  | 'plat_castle'
  | 'plat_house'
  | 'plat_skyscraper'
  | 'plat_flag'
  | 'plat_arch'
  | 'plat_pipe'
  | 'plat_lever'
  | 'plat_cloud'
  // Collectibles & Items
  | 'item_coin'
  | 'item_gem'
  | 'item_key'
  | 'item_chest'
  | 'item_heart'
  | 'item_star'
  | 'item_potion'
  | 'item_crown'
  | 'item_trophy'
  | 'item_sword'
  | 'item_lasersword'
  | 'item_shield'
  | 'item_bow'
  | 'item_wand'
  | 'item_bomb'
  | 'item_magnet'
  | 'item_hourglass'
  | 'item_compass'
  | 'item_lantern'
  | 'item_scroll'
  | 'item_jetpack'
  // Food & Nature
  | 'food_apple'
  | 'food_banana'
  | 'food_cherries'
  | 'food_strawberry'
  | 'food_watermelon'
  | 'food_pizza'
  | 'food_burger'
  | 'food_taco'
  | 'food_donut'
  | 'food_cupcake'
  | 'food_icecream'
  | 'food_mug'
  | 'nature_oak'
  | 'nature_pine'
  | 'nature_palm'
  | 'nature_cactus'
  | 'nature_mushroom'
  | 'nature_sun'
  | 'nature_moon'
  | 'nature_cloud'
  | 'nature_rainbow'
  | 'nature_lightning'
  | 'nature_snowflake'
  | 'nature_flame'
  | 'nature_flower'
  | 'nature_bush'
  | 'nature_rock'
  // Vehicles & Sports
  | 'veh_racecar'
  | 'veh_police'
  | 'veh_firetruck'
  | 'veh_bus'
  | 'veh_moto'
  | 'veh_bike'
  | 'veh_heli'
  | 'veh_plane'
  | 'veh_boat'
  | 'veh_sub'
  | 'veh_train'
  | 'veh_skateboard'
  | 'sport_soccer'
  | 'sport_basket'
  | 'sport_tennis'
  | 'sport_baseball'
  | 'sport_football'
  | 'sport_bowling'
  | 'sport_medal'
  | 'sport_finishflag'
  // FX & UI
  | 'fx_explosion'
  | 'fx_shockwave'
  | 'fx_magiccircle'
  | 'fx_smoke'
  | 'fx_sparkle'
  | 'fx_laser'
  | 'ui_arrow'
  | 'ui_play'
  | 'ui_pause'
  | 'ui_crosshair'
  | 'ui_speech'
  | 'ui_warning'
  | 'ui_dpad'
  | 'ui_joystick'
  // Letters & Numbers
  | 'glyph_badge';

export interface WorldArtSpec {
  kind: WorldArtKind;
  primary: string;
  secondary: string;
  accent: string;
  frame?: number;
  label?: string;
  rotation?: number;
}

export function renderWorldSvg(spec: WorldArtSpec): string {
  const { kind, primary, secondary, accent, frame = 0, label = 'A', rotation = 0 } = spec;
  const stroke = '#0F172A';
  const dark = shadeHex(primary, -0.28);
  const light = shadeHex(primary, 0.28);
  const step = frame % 2 === 1;

  switch (kind) {
    // ================= SPACE & SCI-FI =================
    case 'space_rocket':
      return wrapSpriteSvg(`
        <polygon points="36,68 23,80 35,78" fill="${accent}" stroke="${stroke}" stroke-width="2.3"/>
        <polygon points="60,68 73,80 61,78" fill="${accent}" stroke="${stroke}" stroke-width="2.3"/>
        <polygon points="41,74 48,${step ? 94 : 88} 55,74" fill="#F59E0B"/>
        <path d="M48 10 C64 26 65 55 58 74 L38 74 C31 55 32 26 48 10 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M39 24 Q48 10 57 24 Z" fill="${accent}"/>
        <circle cx="48" cy="43" r="9" fill="#0F172A" stroke="${secondary}" stroke-width="3"/>
        <circle cx="48" cy="43" r="6" fill="#38BDF8"/>
      `);

    case 'space_fighter':
      return wrapSpriteSvg(`
        ${step ? `<polygon points="40,76 48,93 56,76" fill="#38BDF8"/>` : ''}
        <polygon points="48,14 20,66 36,66 48,54 60,66 76,66" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="48,22 39,58 57,58" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
        <ellipse cx="48" cy="42" rx="5.5" ry="11" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
      `);

    case 'space_cruiser':
      return wrapSpriteSvg(`
        <polygon points="48,10 74,48 64,82 32,82 22,48" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="40" y="24" width="16" height="46" rx="6" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="48" cy="42" r="7" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
      `);

    case 'space_ufo':
      return wrapSpriteSvg(`
        ${step ? `<polygon points="34,58 20,90 76,90 62,58" fill="${accent}" opacity="0.32"/>` : ''}
        <path d="M30 44 C30 22 66 22 66 44 Z" fill="#7DD3FC" stroke="${stroke}" stroke-width="2.4"/>
        <ellipse cx="48" cy="49" rx="34" ry="12" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="28" cy="49" r="3.5" fill="${accent}"/><circle cx="48" cy="52" r="3.5" fill="${accent}"/><circle cx="68" cy="49" r="3.5" fill="${accent}"/>
      `);

    case 'space_satellite':
      return wrapSpriteSvg(`
        <g transform="rotate(-22 48 48)">
          <rect x="8" y="34" width="26" height="28" rx="3" fill="#0284C7" stroke="${stroke}" stroke-width="2.3"/>
          <rect x="62" y="34" width="26" height="28" rx="3" fill="#0284C7" stroke="${stroke}" stroke-width="2.3"/>
          <line x1="16" y1="34" x2="16" y2="62" stroke="#7DD3FC" stroke-width="1.5"/>
          <line x1="70" y1="34" x2="70" y2="62" stroke="#7DD3FC" stroke-width="1.5"/>
          <rect x="36" y="36" width="24" height="24" rx="5" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="48" cy="48" r="5" fill="${accent}"/>
        </g>
      `);

    case 'space_station':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="30" fill="none" stroke="${primary}" stroke-width="9"/>
        <circle cx="48" cy="48" r="30" fill="none" stroke="${stroke}" stroke-width="2"/>
        <rect x="44" y="14" width="8" height="68" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
        <rect x="14" y="44" width="68" height="8" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="48" cy="48" r="10" fill="${accent}" stroke="${stroke}" stroke-width="2.2"/>
      `);

    case 'space_asteroid':
    case 'space_meteor':
      return wrapSpriteSvg(`
        ${kind === 'space_meteor' ? `<polygon points="30,30 84,14 66,64" fill="#F97316" opacity="0.85"/><polygon points="36,36 74,22 60,58" fill="#FACC15"/>` : ''}
        <polygon points="24,36 42,18 68,22 78,46 66,72 36,76 20,58" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <circle cx="42" cy="42" r="7" fill="${dark}"/><circle cx="60" cy="56" r="5" fill="${dark}"/><circle cx="56" cy="34" r="4" fill="${dark}"/>
      `);

    case 'space_earth':
    case 'space_mars':
    case 'space_neptune':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="30" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <path d="M30 34 Q42 26 52 38 Q44 48 32 45 Z" fill="${secondary}"/>
        <path d="M52 50 Q66 44 69 60 Q56 68 48 58 Z" fill="${secondary}"/>
        <ellipse cx="38" cy="33" rx="10" ry="4" fill="${accent}" opacity="0.55" transform="rotate(-25 38 33)"/>
      `);

    case 'space_saturn':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="48" rx="39" ry="12" fill="none" stroke="${accent}" stroke-width="6" transform="rotate(-22 48 48)"/>
        <circle cx="48" cy="48" r="22" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M12 52 Q48 66 84 44" fill="none" stroke="${secondary}" stroke-width="5" stroke-linecap="round"/>
      `);

    case 'space_blackhole':
    case 'space_portal':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="${step ? 34 : 31}" fill="${secondary}" opacity="0.35"/>
        <circle cx="48" cy="48" r="25" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="14 6"/>
        <circle cx="48" cy="48" r="16" fill="${kind === 'space_blackhole' ? '#020617' : primary}" stroke="${accent}" stroke-width="3"/>
      `);

    case 'space_turret':
      return wrapSpriteSvg(`
        <rect x="26" y="60" width="44" height="20" rx="5" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="48" y="34" width="32" height="8" rx="3" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
        <rect x="48" y="46" width="32" height="8" rx="3" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="44" cy="46" r="18" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="44" cy="46" r="6" fill="${accent}"/>
      `);

    case 'space_mech':
      return wrapSpriteSvg(`
        <rect x="30" y="62" width="12" height="20" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2.3"/>
        <rect x="54" y="62" width="12" height="20" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2.3"/>
        <rect x="22" y="22" width="52" height="42" rx="10" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="33" y="31" width="30" height="12" rx="4" fill="#0F172A"/>
        <line x1="39" y1="37" x2="57" y2="37" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
      `);

    case 'space_hoverbike':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="70" rx="30" ry="6" fill="${accent}" opacity="0.4"/>
        <path d="M16 54 L36 36 L68 42 L82 54 L66 60 L28 60 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="42" y="33" width="22" height="8" rx="4" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="24" cy="54" r="6" fill="${accent}"/>
      `);

    case 'space_plasma':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="32" fill="${primary}" opacity="0.28"/>
        <circle cx="48" cy="48" r="22" fill="${primary}" stroke="${accent}" stroke-width="3"/>
        <circle cx="48" cy="48" r="11" fill="#FFFFFF" opacity="0.88"/>
      `);

    case 'space_cryopod':
      return wrapSpriteSvg(`
        <rect x="28" y="14" width="40" height="68" rx="18" fill="${secondary}" stroke="${stroke}" stroke-width="2.6"/>
        <rect x="34" y="22" width="28" height="48" rx="12" fill="${primary}" stroke="${accent}" stroke-width="2"/>
        <line x1="40" y1="30" x2="40" y2="60" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.65"/>
      `);

    case 'space_raygun':
      return wrapSpriteSvg(`
        <polygon points="74,40 86,35 82,45" fill="${accent}"/>
        <path d="M22 40 L68 35 L74 44 L44 48 L36 68 L22 65 L28 48 L18 46 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="40" cy="42" r="5" fill="${accent}"/>
      `);

    // ================= PLATFORMS & BUILDINGS =================
    case 'plat_grass':
      return wrapSizedSvg(144, 36, `
        <rect x="2" y="2" width="140" height="32" rx="6" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M2 8 Q2 2 8 2 L136 2 Q142 2 142 8 L142 13 Q130 18 118 13 Q106 18 94 13 Q82 18 70 13 Q58 18 46 13 Q34 18 22 13 Q10 18 2 13 Z" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
      `);

    case 'plat_brick':
      return wrapSizedSvg(96, 48, `
        <rect x="2" y="2" width="92" height="44" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <line x1="2" y1="17" x2="94" y2="17" stroke="${secondary}" stroke-width="3"/>
        <line x1="2" y1="32" x2="94" y2="32" stroke="${secondary}" stroke-width="3"/>
        <line x1="32" y1="2" x2="32" y2="17" stroke="${secondary}" stroke-width="3"/>
        <line x1="64" y1="2" x2="64" y2="17" stroke="${secondary}" stroke-width="3"/>
        <line x1="48" y1="17" x2="48" y2="32" stroke="${secondary}" stroke-width="3"/>
        <line x1="26" y1="32" x2="26" y2="46" stroke="${secondary}" stroke-width="3"/>
        <line x1="70" y1="32" x2="70" y2="46" stroke="${secondary}" stroke-width="3"/>
      `);

    case 'plat_stone':
      return wrapSizedSvg(96, 48, `
        <rect x="2" y="2" width="92" height="44" rx="5" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="7" y="7" width="82" height="34" rx="3" fill="${secondary}" stroke="${dark}" stroke-width="2"/>
        <line x1="20" y1="14" x2="42" y2="14" stroke="${light}" stroke-width="2.5" stroke-linecap="round"/>
      `);

    case 'plat_neon':
      return wrapSizedSvg(144, 32, `
        <rect x="2" y="2" width="140" height="28" rx="7" fill="#0F172A" stroke="${primary}" stroke-width="2.5"/>
        <rect x="8" y="6" width="128" height="6" rx="3" fill="${primary}"/>
        <circle cx="16" cy="21" r="2.5" fill="${accent}"/><circle cx="128" cy="21" r="2.5" fill="${accent}"/>
      `);

    case 'plat_ice':
      return wrapSizedSvg(144, 32, `
        <rect x="2" y="2" width="140" height="28" rx="6" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
        <polygon points="18,4 36,4 22,28 8,28" fill="#FFFFFF" opacity="0.45"/>
        <polygon points="78,4 94,4 80,28 66,28" fill="#FFFFFF" opacity="0.35"/>
      `);

    case 'plat_lava':
      return wrapSizedSvg(144, 36, `
        <rect x="2" y="2" width="140" height="32" rx="5" fill="#451A03" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M6 12 Q28 4 50 14 Q74 24 98 11 Q120 4 138 14" fill="none" stroke="${primary}" stroke-width="6" stroke-linecap="round"/>
        <path d="M10 12 Q32 5 54 14 Q76 23 100 11" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round"/>
      `);

    case 'plat_woodcrate':
    case 'plat_metalcrate':
      return wrapSpriteSvg(`
        <rect x="14" y="14" width="68" height="68" rx="6" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <rect x="22" y="22" width="52" height="52" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2.2"/>
        <line x1="22" y1="22" x2="74" y2="74" stroke="${primary}" stroke-width="7"/>
        <line x1="74" y1="22" x2="22" y2="74" stroke="${primary}" stroke-width="7"/>
        <rect x="22" y="22" width="52" height="52" rx="3" fill="none" stroke="${stroke}" stroke-width="2.2"/>
      `);

    case 'plat_question':
      return wrapSpriteSvg(`
        <rect x="14" y="14" width="68" height="68" rx="8" fill="${primary}" stroke="${stroke}" stroke-width="2.8"/>
        <circle cx="22" cy="22" r="2.5" fill="${dark}"/><circle cx="74" cy="22" r="2.5" fill="${dark}"/>
        <circle cx="22" cy="74" r="2.5" fill="${dark}"/><circle cx="74" cy="74" r="2.5" fill="${dark}"/>
        <text x="48" y="64" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" stroke="${stroke}" stroke-width="2">?</text>
      `);

    case 'plat_spikes':
      return wrapSizedSvg(128, 36, `
        <rect x="2" y="26" width="124" height="8" rx="3" fill="#334155" stroke="${stroke}" stroke-width="2"/>
        <polygon points="8,26 20,4 32,26" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
        <polygon points="36,26 48,4 60,26" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
        <polygon points="64,26 76,4 88,26" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
        <polygon points="92,26 104,4 116,26" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
      `);

    case 'plat_spring':
      return wrapSpriteSvg(`
        <rect x="22" y="72" width="52" height="10" rx="3" fill="#475569" stroke="${stroke}" stroke-width="2.3"/>
        <path d="M32 72 L64 60 L32 50 L64 40" fill="none" stroke="#94A3B8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="18" y="${step ? 24 : 34}" width="60" height="13" rx="5" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
      `);

    case 'plat_ladder':
      return wrapSizedSvg(48, 128, `
        <rect x="8" y="4" width="7" height="120" rx="3" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <rect x="33" y="4" width="7" height="120" rx="3" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <rect x="14" y="20" width="20" height="6" rx="2" fill="${secondary}" stroke="${stroke}" stroke-width="1.8"/>
        <rect x="14" y="46" width="20" height="6" rx="2" fill="${secondary}" stroke="${stroke}" stroke-width="1.8"/>
        <rect x="14" y="72" width="20" height="6" rx="2" fill="${secondary}" stroke="${stroke}" stroke-width="1.8"/>
        <rect x="14" y="98" width="20" height="6" rx="2" fill="${secondary}" stroke="${stroke}" stroke-width="1.8"/>
      `);

    case 'plat_bridge':
      return wrapSizedSvg(144, 40, `
        <path d="M4 34 Q72 8 140 34" fill="none" stroke="${secondary}" stroke-width="10" stroke-linecap="round"/>
        <rect x="10" y="14" width="124" height="10" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
      `);

    case 'plat_castle':
      return wrapSpriteSvg(`
        <rect x="20" y="28" width="56" height="58" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="18" y="16" width="14" height="14" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="41" y="16" width="14" height="14" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="64" y="16" width="14" height="14" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
        <path d="M36 86 L36 62 C36 52 60 52 60 62 L60 86 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>
      `);

    case 'plat_house':
      return wrapSpriteSvg(`
        <rect x="22" y="46" width="52" height="40" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
        <polygon points="12,48 48,16 84,48" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="41" y="60" width="14" height="26" rx="2" fill="#78350F" stroke="${stroke}" stroke-width="2"/>
        <rect x="27" y="54" width="10" height="10" rx="1.5" fill="#7DD3FC" stroke="${stroke}" stroke-width="1.8"/>
      `);

    case 'plat_skyscraper':
      return wrapSpriteSvg(`
        <rect x="24" y="12" width="48" height="74" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="31" y="20" width="10" height="8" fill="${accent}"/><rect x="55" y="20" width="10" height="8" fill="${accent}"/>
        <rect x="31" y="34" width="10" height="8" fill="${accent}"/><rect x="55" y="34" width="10" height="8" fill="${accent}"/>
        <rect x="31" y="48" width="10" height="8" fill="${accent}"/><rect x="55" y="48" width="10" height="8" fill="${accent}"/>
        <rect x="41" y="66" width="14" height="20" fill="${secondary}"/>
      `);

    case 'plat_flag':
      return wrapSpriteSvg(`
        <rect x="24" y="14" width="6" height="70" rx="3" fill="#E2E8F0" stroke="${stroke}" stroke-width="2"/>
        <polygon points="30,${step ? 16 : 26} 76,${step ? 28 : 38} 30,${step ? 42 : 52}" fill="${primary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
      `);

    case 'plat_arch':
      return wrapSpriteSvg(`
        <path d="M18 84 L18 42 C18 14 78 14 78 42 L78 84 L62 84 L62 46 C62 32 34 32 34 46 L34 84 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="48" cy="58" rx="12" ry="22" fill="${accent}" opacity="0.65"/>
      `);

    case 'plat_pipe':
      return wrapSpriteSvg(`
        <rect x="24" y="30" width="48" height="54" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="18" y="16" width="60" height="18" rx="4" fill="${light}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="30" y="34" width="8" height="46" fill="#FFFFFF" opacity="0.25"/>
      `);

    case 'plat_lever':
      return wrapSpriteSvg(`
        <rect x="22" y="66" width="52" height="16" rx="5" fill="#475569" stroke="${stroke}" stroke-width="2.5"/>
        <line x1="48" y1="66" x2="${step ? 68 : 28}" y2="30" stroke="#CBD5E1" stroke-width="6" stroke-linecap="round"/>
        <circle cx="${step ? 68 : 28}" cy="28" r="9" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
      `);

    case 'plat_cloud':
      return wrapSizedSvg(144, 48, `
        <path d="M26 42 C12 42 8 24 22 20 C24 8 44 4 56 14 C68 4 92 6 98 18 C114 14 128 24 126 36 C136 40 128 42 118 42 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2.5"/>
      `);

    // ================= COLLECTIBLES & ITEMS =================
    case 'item_coin':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="48" rx="${step ? 15 : 27}" ry="28" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <ellipse cx="48" cy="48" rx="${step ? 9 : 19}" ry="20" fill="${secondary}" stroke="${dark}" stroke-width="2"/>
        <rect x="44" y="36" width="${step ? 5 : 8}" height="24" rx="3" fill="${accent}"/>
      `);

    case 'item_gem':
      return wrapSpriteSvg(`
        <polygon points="30,22 66,22 80,42 48,80 16,42" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <polygon points="30,22 66,22 56,42 40,42" fill="${light}"/>
        <polygon points="40,42 56,42 48,80" fill="${secondary}"/>
      `);

    case 'item_key':
      return wrapSpriteSvg(`
        <circle cx="30" cy="48" r="15" fill="none" stroke="${primary}" stroke-width="7"/>
        <circle cx="30" cy="48" r="15" fill="none" stroke="${stroke}" stroke-width="2"/>
        <rect x="43" y="44" width="38" height="8" rx="3" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <rect x="65" y="52" width="6" height="11" rx="2" fill="${primary}" stroke="${stroke}" stroke-width="1.8"/>
        <rect x="74" y="52" width="6" height="8" rx="2" fill="${primary}" stroke="${stroke}" stroke-width="1.8"/>
      `);

    case 'item_chest':
      return wrapSpriteSvg(`
        <rect x="18" y="42" width="60" height="36" rx="5" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <path d="M18 42 C18 22 78 22 78 42 Z" fill="${light}" stroke="${stroke}" stroke-width="2.6"/>
        <rect x="28" y="28" width="8" height="50" fill="${accent}"/>
        <rect x="60" y="28" width="8" height="50" fill="${accent}"/>
        <rect x="42" y="39" width="12" height="14" rx="3" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
      `);

    case 'item_heart':
      return wrapSpriteSvg(`
        <path d="M48 79 C24 62 14 48 14 33 C14 20 26 14 37 18 C42 20 46 24 48 28 C50 24 54 20 59 18 C70 14 82 20 82 33 C82 48 72 62 48 79 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <ellipse cx="30" cy="31" rx="5" ry="3" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 30 31)"/>
      `);

    case 'item_star':
      return wrapSpriteSvg(`
        <polygon points="48,12 58,34 82,36 64,52 69,76 48,64 27,76 32,52 14,36 38,34" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <polygon points="48,20 54,36 70,38 58,49 61,65 48,57 35,65 38,49 26,38 42,36" fill="${accent}" opacity="0.45"/>
      `);

    case 'item_potion':
      return wrapSpriteSvg(`
        <rect x="40" y="14" width="16" height="10" rx="2" fill="#D97706" stroke="${stroke}" stroke-width="2"/>
        <path d="M41 24 L55 24 L55 34 L72 56 C76 62 72 78 60 80 L36 80 C24 78 20 62 24 56 L41 34 Z" fill="#E2E8F0" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M27 57 L69 57 C71 64 67 74 58 76 L38 76 C29 74 25 64 27 57 Z" fill="${primary}"/>
        <circle cx="42" cy="65" r="3" fill="${accent}"/><circle cx="55" cy="62" r="2.2" fill="${accent}"/>
      `);

    case 'item_crown':
      return wrapSpriteSvg(`
        <polygon points="16,66 14,28 34,44 48,20 62,44 82,28 80,66" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <rect x="16" y="64" width="64" height="12" rx="4" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>
        <circle cx="48" cy="48" r="5" fill="${accent}"/><circle cx="28" cy="52" r="4" fill="#38BDF8"/><circle cx="68" cy="52" r="4" fill="#34D399"/>
      `);

    case 'item_trophy':
      return wrapSpriteSvg(`
        <path d="M22 24 C12 24 12 44 26 44" fill="none" stroke="${primary}" stroke-width="5"/>
        <path d="M74 24 C84 24 84 44 70 44" fill="none" stroke="${primary}" stroke-width="5"/>
        <path d="M26 20 L70 20 L64 52 C61 60 35 60 32 52 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="44" y="56" width="8" height="16" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <rect x="30" y="71" width="36" height="11" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>
      `);

    case 'item_sword':
    case 'item_lasersword':
      return wrapSpriteSvg(`
        <g transform="rotate(45 48 48)">
          <polygon points="48,10 55,22 55,62 41,62 41,22" fill="${primary}" stroke="${kind === 'item_lasersword' ? accent : stroke}" stroke-width="2.5"/>
          <rect x="33" y="60" width="30" height="7" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2.2"/>
          <rect x="44" y="67" width="8" height="16" rx="2" fill="#78350F" stroke="${stroke}" stroke-width="2"/>
        </g>
      `);

    case 'item_shield':
      return wrapSpriteSvg(`
        <path d="M22 20 L74 20 L74 48 C74 68 48 82 48 82 C48 82 22 68 22 48 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M48 26 L48 74 M28 45 L68 45" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
      `);

    case 'item_bow':
      return wrapSpriteSvg(`
        <path d="M36 16 C64 26 64 70 36 80" fill="none" stroke="${primary}" stroke-width="6" stroke-linecap="round"/>
        <line x1="36" y1="16" x2="36" y2="80" stroke="#CBD5E1" stroke-width="2"/>
        <line x1="22" y1="48" x2="76" y2="48" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
        <polygon points="82,48 70,41 70,55" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/>
      `);

    case 'item_wand':
      return wrapSpriteSvg(`
        <line x1="20" y1="78" x2="62" y2="36" stroke="#78350F" stroke-width="7" stroke-linecap="round"/>
        <polygon points="65,16 69,26 80,27 71,34 74,44 65,38 56,44 59,34 50,27 61,26" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
      `);

    case 'item_bomb':
      return wrapSpriteSvg(`
        <path d="M54 24 Q62 12 72 15" fill="none" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="74" cy="16" r="6" fill="#F97316"/>
        <circle cx="46" cy="54" r="25" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <ellipse cx="37" cy="43" rx="6" ry="3.5" fill="#FFFFFF" opacity="0.45" transform="rotate(-35 37 43)"/>
      `);

    case 'item_magnet':
      return wrapSpriteSvg(`
        <path d="M26 24 L26 52 C26 74 70 74 70 52 L70 24" fill="none" stroke="${primary}" stroke-width="14" stroke-linecap="butt"/>
        <rect x="19" y="20" width="14" height="13" fill="#E2E8F0" stroke="${stroke}" stroke-width="2"/>
        <rect x="63" y="20" width="14" height="13" fill="#E2E8F0" stroke="${stroke}" stroke-width="2"/>
      `);

    case 'item_hourglass':
      return wrapSpriteSvg(`
        <rect x="26" y="14" width="44" height="8" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="26" y="74" width="44" height="8" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2.2"/>
        <polygon points="32,22 64,22 48,48 64,74 32,74 48,48" fill="#E0F2FE" stroke="${stroke}" stroke-width="2.3"/>
        <polygon points="37,72 59,72 48,57" fill="${primary}"/>
      `);

    case 'item_compass':
      return wrapSpriteSvg(`
        <circle cx="48" cy="50" r="28" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <circle cx="48" cy="50" r="21" fill="#F8FAFC" stroke="${stroke}" stroke-width="2"/>
        <polygon points="48,31 54,50 48,69 42,50" fill="${accent}"/>
        <polygon points="48,31 54,50 42,50" fill="#EF4444"/>
      `);

    case 'item_lantern':
      return wrapSpriteSvg(`
        <path d="M36 22 Q48 10 60 22" fill="none" stroke="#94A3B8" stroke-width="3.5"/>
        <rect x="30" y="24" width="36" height="8" rx="3" fill="#334155" stroke="${stroke}" stroke-width="2"/>
        <rect x="33" y="32" width="30" height="36" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
        <circle cx="48" cy="50" r="8" fill="#FEF08A"/>
        <rect x="28" y="68" width="40" height="9" rx="3" fill="#334155" stroke="${stroke}" stroke-width="2"/>
      `);

    case 'item_scroll':
      return wrapSpriteSvg(`
        <rect x="24" y="22" width="48" height="52" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
        <rect x="18" y="18" width="60" height="10" rx="5" fill="${secondary}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="18" y="68" width="60" height="10" rx="5" fill="${secondary}" stroke="${stroke}" stroke-width="2.2"/>
        <line x1="34" y1="38" x2="62" y2="38" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="34" y1="48" x2="58" y2="48" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="34" y1="58" x2="52" y2="58" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
      `);

    case 'item_jetpack':
      return wrapSpriteSvg(`
        <rect x="24" y="22" width="20" height="46" rx="9" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="52" y="22" width="20" height="46" rx="9" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="38" y="34" width="20" height="18" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
        <polygon points="28,68 34,86 40,68" fill="#F97316"/><polygon points="56,68 62,86 68,68" fill="#F97316"/>
      `);

    // ================= FOOD & NATURE =================
    case 'food_apple':
      return wrapSpriteSvg(`
        <path d="M48 26 Q50 14 58 14" fill="none" stroke="#78350F" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse cx="58" cy="19" rx="8" ry="4" fill="#22C55E" stroke="${stroke}" stroke-width="1.8" transform="rotate(-20 58 19)"/>
        <path d="M48 30 C32 20 18 34 22 55 C25 72 37 80 48 75 C59 80 71 72 74 55 C78 34 64 20 48 30 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="33" cy="40" rx="4" ry="7" fill="#FFFFFF" opacity="0.45" transform="rotate(15 33 40)"/>
      `);

    case 'food_banana':
      return wrapSpriteSvg(`
        <path d="M22 64 C32 78 68 74 74 22 C66 20 62 24 60 32 C54 54 38 60 22 56 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
      `);

    case 'food_cherries':
      return wrapSpriteSvg(`
        <path d="M32 54 Q44 22 54 16 Q60 28 64 54" fill="none" stroke="#16A34A" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="32" cy="64" r="14" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="64" cy="64" r="14" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="27" cy="59" r="3.5" fill="#FFFFFF" opacity="0.5"/>
        <circle cx="59" cy="59" r="3.5" fill="#FFFFFF" opacity="0.5"/>
      `);

    case 'food_strawberry':
      return wrapSpriteSvg(`
        <path d="M26 30 C26 18 70 18 70 30 C70 54 56 78 48 80 C40 78 26 54 26 30 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <polygon points="34,24 48,14 62,24 52,29 44,29" fill="#22C55E" stroke="${stroke}" stroke-width="2"/>
        <circle cx="38" cy="44" r="2" fill="#FEF08A"/><circle cx="56" cy="44" r="2" fill="#FEF08A"/><circle cx="48" cy="56" r="2" fill="#FEF08A"/><circle cx="40" cy="62" r="2" fill="#FEF08A"/>
      `);

    case 'food_watermelon':
      return wrapSpriteSvg(`
        <path d="M16 38 L80 38 C76 74 20 74 16 38 Z" fill="#22C55E" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M22 38 L74 38 C70 66 26 66 22 38 Z" fill="${primary}"/>
        <circle cx="38" cy="48" r="2.2" fill="${stroke}"/><circle cx="48" cy="52" r="2.2" fill="${stroke}"/><circle cx="58" cy="48" r="2.2" fill="${stroke}"/>
      `);

    case 'food_pizza':
      return wrapSpriteSvg(`
        <polygon points="48,14 80,76 16,76" fill="#FACC15" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M15 74 Q48 84 81 74" fill="none" stroke="#D97706" stroke-width="9" stroke-linecap="round"/>
        <circle cx="48" cy="44" r="6" fill="#EF4444"/><circle cx="38" cy="62" r="5.5" fill="#EF4444"/><circle cx="58" cy="60" r="5" fill="#EF4444"/>
      `);

    case 'food_burger':
      return wrapSpriteSvg(`
        <path d="M20 44 C20 20 76 20 76 44 Z" fill="#F59E0B" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="18" y="44" width="60" height="7" rx="3" fill="#22C55E" stroke="${stroke}" stroke-width="1.8"/>
        <rect x="17" y="51" width="62" height="10" rx="4" fill="#78350F" stroke="${stroke}" stroke-width="2"/>
        <rect x="20" y="61" width="56" height="12" rx="5" fill="#F59E0B" stroke="${stroke}" stroke-width="2.5"/>
      `);

    case 'food_taco':
      return wrapSpriteSvg(`
        <path d="M18 58 C24 32 72 32 78 58 Z" fill="#EF4444" stroke="${stroke}" stroke-width="2"/>
        <path d="M14 60 C14 28 82 28 82 60 Z" fill="#FACC15" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="36" cy="48" r="3" fill="#B45309"/><circle cx="58" cy="48" r="3" fill="#B45309"/>
      `);

    case 'food_donut':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="30" fill="#F59E0B" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="48" cy="48" r="27" fill="${primary}"/>
        <circle cx="48" cy="48" r="10" fill="#0D121C" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="33" y="29" width="7" height="3" rx="1.5" fill="#FEF08A" transform="rotate(20 33 29)"/>
        <rect x="57" y="31" width="7" height="3" rx="1.5" fill="#38BDF8" transform="rotate(-25 57 31)"/>
        <rect x="58" y="60" width="7" height="3" rx="1.5" fill="#FFFFFF" transform="rotate(15 58 60)"/>
      `);

    case 'food_cupcake':
    case 'food_icecream':
      return wrapSpriteSvg(`
        <polygon points="28,50 68,50 60,82 36,82" fill="#D97706" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="38" cy="44" r="13" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
        <circle cx="58" cy="44" r="13" fill="${secondary}" stroke="${stroke}" stroke-width="2.3"/>
        <circle cx="48" cy="30" r="14" fill="${accent}" stroke="${stroke}" stroke-width="2.3"/>
        <circle cx="48" cy="14" r="5" fill="#EF4444" stroke="${stroke}" stroke-width="1.8"/>
      `);

    case 'food_mug':
      return wrapSpriteSvg(`
        <path d="M64 42 C78 42 78 64 64 64" fill="none" stroke="${primary}" stroke-width="6"/>
        <rect x="24" y="34" width="42" height="44" rx="7" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M36 24 Q40 16 36 10 M50 24 Q54 16 50 10" fill="none" stroke="#E2E8F0" stroke-width="3" stroke-linecap="round"/>
      `);

    case 'nature_oak':
    case 'nature_pine':
    case 'nature_palm':
      return wrapSpriteSvg(`
        <rect x="42" y="54" width="12" height="30" rx="3" fill="#78350F" stroke="${stroke}" stroke-width="2.2"/>
        ${
          kind === 'nature_pine'
            ? `<polygon points="48,10 74,40 22,40" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/><polygon points="48,26 78,60 18,60" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>`
            : kind === 'nature_palm'
              ? `<path d="M48 34 Q22 20 14 36 M48 34 Q28 10 22 20 M48 34 Q74 20 82 36 M48 34 Q68 10 74 20" fill="none" stroke="${primary}" stroke-width="7" stroke-linecap="round"/>`
              : `<circle cx="48" cy="36" r="24" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/><circle cx="32" cy="44" r="15" fill="${secondary}"/><circle cx="64" cy="44" r="15" fill="${secondary}"/>`
        }
      `);

    case 'nature_cactus':
      return wrapSpriteSvg(`
        <rect x="40" y="18" width="16" height="64" rx="8" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M40 50 L24 50 L24 34" fill="none" stroke="${primary}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M56 44 L72 44 L72 28" fill="none" stroke="${primary}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="48" cy="15" r="5" fill="${accent}"/>
      `);

    case 'nature_mushroom':
      return wrapSpriteSvg(`
        <rect x="38" y="48" width="20" height="32" rx="6" fill="#FEF3C7" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M16 52 C16 18 80 18 80 52 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="36" cy="34" r="5" fill="#FFFFFF"/><circle cx="58" cy="32" r="4.5" fill="#FFFFFF"/><circle cx="49" cy="43" r="3.5" fill="#FFFFFF"/>
      `);

    case 'nature_sun':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="28" fill="none" stroke="${accent}" stroke-width="8" stroke-dasharray="6 9"/>
        <circle cx="48" cy="48" r="20" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
      `);

    case 'nature_moon':
      return wrapSpriteSvg(`
        <path d="M58 18 C34 18 20 36 24 58 C28 76 48 84 68 74 C48 74 38 60 40 42 C42 28 50 22 58 18 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
      `);

    case 'nature_cloud':
    case 'nature_bush':
      return wrapSpriteSvg(`
        <path d="M22 66 C12 66 10 50 22 46 C24 30 44 26 54 36 C64 26 84 32 82 48 C90 52 86 66 74 66 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
      `);

    case 'nature_rainbow':
      return wrapSpriteSvg(`
        <path d="M14 66 A34 34 0 0 1 82 66" fill="none" stroke="#EF4444" stroke-width="6" stroke-linecap="round"/>
        <path d="M20 66 A28 28 0 0 1 76 66" fill="none" stroke="#F59E0B" stroke-width="6" stroke-linecap="round"/>
        <path d="M26 66 A22 22 0 0 1 70 66" fill="none" stroke="#22C55E" stroke-width="6" stroke-linecap="round"/>
        <path d="M32 66 A16 16 0 0 1 64 66" fill="none" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
      `);

    case 'nature_lightning':
      return wrapSpriteSvg(`
        <polygon points="54,10 24,52 46,52 38,86 72,42 50,42" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
      `);

    case 'nature_snowflake':
      return wrapSpriteSvg(`
        <g stroke="${primary}" stroke-width="5" stroke-linecap="round">
          <line x1="48" y1="14" x2="48" y2="82"/><line x1="18" y1="31" x2="78" y2="65"/><line x1="78" y1="31" x2="18" y2="65"/>
        </g>
        <circle cx="48" cy="48" r="7" fill="${accent}"/>
      `);

    case 'nature_flame':
      return wrapSpriteSvg(`
        <path d="M48 ${step ? 10 : 14} C68 34 76 54 68 72 C62 82 34 82 28 72 C20 54 32 34 48 ${step ? 10 : 14} Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M48 34 C58 48 62 62 56 74 C52 79 44 79 40 74 C34 62 40 48 48 34 Z" fill="${accent}"/>
      `);

    case 'nature_flower':
      return wrapSpriteSvg(`
        <circle cx="48" cy="24" r="12" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="70" cy="40" r="12" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="62" cy="66" r="12" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="34" cy="66" r="12" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="26" cy="40" r="12" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="48" cy="48" r="13" fill="${accent}" stroke="${stroke}" stroke-width="2.4"/>
      `);

    case 'nature_rock':
      return wrapSpriteSvg(`
        <polygon points="18,72 24,40 44,28 72,38 80,72" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <polygon points="44,28 72,38 56,52 32,48" fill="${light}" opacity="0.5"/>
      `);

    // ================= VEHICLES & SPORTS =================
    case 'veh_racecar':
    case 'veh_police':
    case 'veh_firetruck':
    case 'veh_bus':
      return wrapSpriteSvg(`
        <path d="M16 58 L22 38 L36 28 L64 28 L78 44 L84 58 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="37,33 58,33 66,43 32,43" fill="#7DD3FC" stroke="${stroke}" stroke-width="1.8"/>
        ${kind === 'veh_police' ? `<rect x="44" y="22" width="10" height="6" rx="2" fill="#EF4444" stroke="${stroke}" stroke-width="1.5"/>` : ''}
        <circle cx="30" cy="62" r="10" fill="#1E293B" stroke="${stroke}" stroke-width="2.4"/><circle cx="30" cy="62" r="4" fill="#CBD5E1"/>
        <circle cx="66" cy="62" r="10" fill="#1E293B" stroke="${stroke}" stroke-width="2.4"/><circle cx="66" cy="62" r="4" fill="#CBD5E1"/>
      `);

    case 'veh_moto':
    case 'veh_bike':
      return wrapSpriteSvg(`
        <circle cx="25" cy="62" r="13" fill="none" stroke="${stroke}" stroke-width="5"/>
        <circle cx="71" cy="62" r="13" fill="none" stroke="${stroke}" stroke-width="5"/>
        <path d="M25 62 L44 40 L62 40 L71 62 M44 40 L48 62 L25 62" fill="none" stroke="${primary}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      `);

    case 'veh_heli':
      return wrapSpriteSvg(`
        <line x1="${step ? 24 : 10}" y1="24" x2="${step ? 72 : 86}" y2="24" stroke="#E2E8F0" stroke-width="5" stroke-linecap="round"/>
        <line x1="48" y1="24" x2="48" y2="38" stroke="${stroke}" stroke-width="4"/>
        <path d="M22 46 L8 42 L8 52 L28 52 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
        <ellipse cx="48" cy="50" rx="24" ry="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="56" cy="48" rx="11" ry="8" fill="#7DD3FC" stroke="${stroke}" stroke-width="2"/>
        <line x1="30" y1="70" x2="66" y2="70" stroke="#94A3B8" stroke-width="4" stroke-linecap="round"/>
      `);

    case 'veh_plane':
      return wrapSpriteSvg(`
        <polygon points="42,20 56,20 50,76 42,76" fill="${secondary}" stroke="${stroke}" stroke-width="2.2"/>
        <polygon points="12,48 84,48 76,58 20,58" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="48" cy="48" rx="34" ry="10" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="64" cy="46" r="4" fill="#7DD3FC"/>
      `);

    case 'veh_boat':
      return wrapSpriteSvg(`
        <polygon points="48,14 48,54 74,54" fill="#FFFFFF" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round"/>
        <polygon points="44,22 44,54 24,54" fill="${accent}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>
        <polygon points="16,58 80,58 70,76 26,76" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
      `);

    case 'veh_sub':
      return wrapSpriteSvg(`
        <path d="M48 34 L48 18 L58 18" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="48" cy="54" rx="30" ry="17" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="36" cy="54" r="5" fill="#7DD3FC" stroke="${stroke}" stroke-width="2"/>
        <circle cx="52" cy="54" r="5" fill="#7DD3FC" stroke="${stroke}" stroke-width="2"/>
      `);

    case 'veh_train':
      return wrapSpriteSvg(`
        <rect x="20" y="34" width="56" height="32" rx="6" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="22" y="20" width="22" height="16" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2.3"/>
        <rect x="58" y="20" width="9" height="14" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="32" cy="70" r="8" fill="#1E293B" stroke="${stroke}" stroke-width="2.3"/>
        <circle cx="62" cy="70" r="8" fill="#1E293B" stroke="${stroke}" stroke-width="2.3"/>
      `);

    case 'veh_skateboard':
      return wrapSpriteSvg(`
        <rect x="12" y="42" width="72" height="12" rx="6" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="28" cy="60" r="7" fill="${accent}" stroke="${stroke}" stroke-width="2.2"/>
        <circle cx="68" cy="60" r="7" fill="${accent}" stroke="${stroke}" stroke-width="2.2"/>
      `);

    case 'sport_soccer':
    case 'sport_basket':
    case 'sport_tennis':
    case 'sport_baseball':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="28" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        ${
          kind === 'sport_soccer'
            ? `<polygon points="48,36 58,43 54,55 42,55 38,43" fill="#0F172A"/>`
            : `<path d="M22 48 L74 48 M48 20 L48 76" fill="none" stroke="${secondary}" stroke-width="2.8"/>`
        }
      `);

    case 'sport_football':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="48" rx="32" ry="20" fill="${primary}" stroke="${stroke}" stroke-width="2.6" transform="rotate(-20 48 48)"/>
        <line x1="36" y1="48" x2="60" y2="48" stroke="#FFFFFF" stroke-width="3" transform="rotate(-20 48 48)"/>
      `);

    case 'sport_bowling':
      return wrapSpriteSvg(`
        <path d="M40 16 C40 10 56 10 56 16 L54 36 C64 46 64 78 56 82 L40 82 C32 78 32 46 42 36 Z" fill="#FFFFFF" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="40" y="34" width="16" height="6" fill="${primary}"/>
      `);

    case 'sport_medal':
      return wrapSpriteSvg(`
        <polygon points="32,12 44,12 48,40 36,40" fill="#EF4444" stroke="${stroke}" stroke-width="2"/>
        <polygon points="52,12 64,12 60,40 48,40" fill="#3B82F6" stroke="${stroke}" stroke-width="2"/>
        <circle cx="48" cy="58" r="21" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <text x="48" y="65" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="${stroke}">1</text>
      `);

    case 'sport_finishflag':
      return wrapSpriteSvg(`
        <rect x="22" y="14" width="6" height="70" rx="3" fill="#E2E8F0" stroke="${stroke}" stroke-width="2"/>
        <rect x="28" y="18" width="46" height="32" fill="#FFFFFF" stroke="${stroke}" stroke-width="2.4"/>
        <rect x="28" y="18" width="15" height="16" fill="#0F172A"/><rect x="58" y="18" width="16" height="16" fill="#0F172A"/>
        <rect x="43" y="34" width="15" height="16" fill="#0F172A"/>
      `);

    // ================= FX & UI =================
    case 'fx_explosion':
      return wrapSpriteSvg(`
        <polygon points="48,${step ? 6 : 12} 58,30 82,20 68,42 88,52 66,62 76,84 52,70 40,88 34,64 12,68 28,48 12,30 36,34" fill="${primary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="48" cy="48" r="14" fill="${accent}"/>
      `);

    case 'fx_shockwave':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="34" fill="none" stroke="${primary}" stroke-width="6" opacity="0.5"/>
        <circle cx="48" cy="48" r="24" fill="none" stroke="${accent}" stroke-width="4"/>
      `);

    case 'fx_magiccircle':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="34" fill="none" stroke="${primary}" stroke-width="3"/>
        <polygon points="48,16 76,64 20,64" fill="none" stroke="${accent}" stroke-width="2.5"/>
        <polygon points="48,80 76,32 20,32" fill="none" stroke="${accent}" stroke-width="2.5"/>
      `);

    case 'fx_smoke':
      return wrapSpriteSvg(`
        <circle cx="36" cy="52" r="16" fill="${primary}" opacity="0.8"/>
        <circle cx="56" cy="46" r="18" fill="${primary}" opacity="0.85"/>
        <circle cx="48" cy="60" r="15" fill="${secondary}" opacity="0.75"/>
      `);

    case 'fx_sparkle':
      return wrapSpriteSvg(`
        <path d="M48 12 L54 40 L82 46 L54 52 L48 80 L42 52 L14 46 L42 40 Z" fill="${primary}" stroke="${stroke}" stroke-width="2"/>
        <path d="M74 14 L77 23 L86 26 L77 29 L74 38 L71 29 L62 26 L71 23 Z" fill="${accent}"/>
      `);

    case 'fx_laser':
      return wrapSizedSvg(96, 32, `
        <rect x="4" y="8" width="88" height="16" rx="8" fill="${primary}" opacity="0.45"/>
        <rect x="8" y="12" width="80" height="8" rx="4" fill="${accent}"/>
      `);

    case 'ui_arrow':
      return wrapSpriteSvg(`
        <g transform="rotate(${rotation} 48 48)">
          <rect x="14" y="14" width="68" height="68" rx="16" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
          <polygon points="48,26 68,50 56,50 56,70 40,70 40,50 28,50" fill="#FFFFFF" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        </g>
      `);

    case 'ui_play':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="34" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <polygon points="38,30 70,48 38,66" fill="#FFFFFF" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
      `);

    case 'ui_pause':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="34" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <rect x="34" y="30" width="10" height="36" rx="3" fill="#FFFFFF"/>
        <rect x="52" y="30" width="10" height="36" rx="3" fill="#FFFFFF"/>
      `);

    case 'ui_crosshair':
      return wrapSpriteSvg(`
        <circle cx="48" cy="48" r="26" fill="none" stroke="${primary}" stroke-width="4"/>
        <line x1="48" y1="12" x2="48" y2="34" stroke="${primary}" stroke-width="4" stroke-linecap="round"/>
        <line x1="48" y1="62" x2="48" y2="84" stroke="${primary}" stroke-width="4" stroke-linecap="round"/>
        <line x1="12" y1="48" x2="34" y2="48" stroke="${primary}" stroke-width="4" stroke-linecap="round"/>
        <line x1="62" y1="48" x2="84" y2="48" stroke="${primary}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="48" cy="48" r="4" fill="${accent}"/>
      `);

    case 'ui_speech':
      return wrapSpriteSvg(`
        <path d="M16 24 C16 18 80 18 80 24 L80 60 C80 66 52 66 52 66 L32 80 L36 66 L16 66 Z" fill="#FFFFFF" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <circle cx="34" cy="45" r="4" fill="${primary}"/><circle cx="48" cy="45" r="4" fill="${primary}"/><circle cx="62" cy="45" r="4" fill="${primary}"/>
      `);

    case 'ui_warning':
      return wrapSpriteSvg(`
        <polygon points="48,14 84,78 12,78" fill="${primary}" stroke="${stroke}" stroke-width="2.8" stroke-linejoin="round"/>
        <rect x="44" y="36" width="8" height="22" rx="3" fill="${stroke}"/>
        <circle cx="48" cy="67" r="4.5" fill="${stroke}"/>
      `);

    case 'ui_dpad':
      return wrapSpriteSvg(`
        <path d="M38 18 L58 18 L58 38 L78 38 L78 58 L58 58 L58 78 L38 78 L38 58 L18 58 L18 38 L38 38 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <circle cx="48" cy="48" r="6" fill="${secondary}"/>
      `);

    case 'ui_joystick':
      return wrapSpriteSvg(`
        <rect x="22" y="62" width="52" height="18" rx="5" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
        <line x1="48" y1="62" x2="48" y2="34" stroke="#CBD5E1" stroke-width="7" stroke-linecap="round"/>
        <circle cx="48" cy="28" r="14" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
      `);

    // ================= LETTERS & NUMBERS =================
    case 'glyph_badge':
    default:
      return wrapSpriteSvg(`
        <rect x="14" y="14" width="68" height="68" rx="16" fill="${dark}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="14" y="11" width="68" height="66" rx="16" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="20" y="17" width="56" height="54" rx="11" fill="none" stroke="${light}" stroke-width="2" opacity="0.6"/>
        <text x="48" y="60" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="42" fill="#FFFFFF" stroke="${stroke}" stroke-width="2">${label}</text>
      `);
  }
}
