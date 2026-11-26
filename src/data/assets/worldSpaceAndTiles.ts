// SPDX-License-Identifier: AGPL-3.0-or-later
import { shadeHex, wrapSizedSvg, wrapSpriteSvg } from '../assetSvgHelpers';

export type SpaceAndTileKind =
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
  | 'plat_cloud';

export function renderSpaceAndTileSvg(
  kind: SpaceAndTileKind,
  primary: string,
  secondary: string,
  accent: string,
  step: boolean
): string {
  const stroke = '#0F172A';
  const dark = shadeHex(primary, -0.28);
  const light = shadeHex(primary, 0.28);

  switch (kind) {
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
  }
}
