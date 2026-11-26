// SPDX-License-Identifier: AGPL-3.0-or-later
import { shadeHex, wrapSpriteSvg } from '../assetSvgHelpers';

export type ItemAndNatureKind =
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
  | 'nature_rock';

export function renderItemAndNatureSvg(
  kind: ItemAndNatureKind,
  primary: string,
  secondary: string,
  accent: string,
  step: boolean
): string {
  const stroke = '#0F172A';
  const dark = shadeHex(primary, -0.28);
  const light = shadeHex(primary, 0.28);

  switch (kind) {
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
  }
}
