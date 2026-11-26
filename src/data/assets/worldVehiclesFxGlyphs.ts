// SPDX-License-Identifier: AGPL-3.0-or-later
import { shadeHex, wrapSizedSvg, wrapSpriteSvg } from '../assetSvgHelpers';

export type VehicleFxGlyphKind =
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
  | 'glyph_badge';

export function renderVehicleFxGlyphSvg(
  kind: VehicleFxGlyphKind,
  primary: string,
  secondary: string,
  accent: string,
  step: boolean,
  label: string,
  rotation: number
): string {
  const stroke = '#0F172A';
  const dark = shadeHex(primary, -0.28);
  const light = shadeHex(primary, 0.28);

  switch (kind) {
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
