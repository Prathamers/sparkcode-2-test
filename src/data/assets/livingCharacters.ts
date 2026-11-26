// SPDX-License-Identifier: AGPL-3.0-or-later
import { drawEyes, drawMouth, wrapSpriteSvg, type EyeStyle } from '../assetSvgHelpers';
import type { LivingArtKind } from '../assetArtLiving';

export interface LivingRenderContext {
  kind: LivingArtKind;
  primary: string;
  secondary: string;
  accent: string;
  eye: EyeStyle;
  dark: string;
  light: string;
  stroke: string;
  step: boolean;
  bob: number;
}

export function renderLivingCharacterSvg(ctx: LivingRenderContext): string | null {
  const { kind, primary, secondary, accent, eye, dark, light, stroke, step, bob } = ctx;

  switch (kind) {
    case 'mascot_cat':
    case 'animal_cat': {
      const isMascot = kind === 'mascot_cat';
      const tailRot = step ? -16 : 12;
      const legA = step ? -5 : 4;
      const legB = step ? 5 : -4;
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.24"/>
        <g transform="translate(0,${bob})">
          <path d="M24 62 Q10 54 14 38" fill="none" stroke="${dark}" stroke-width="8" stroke-linecap="round" transform="rotate(${tailRot} 24 62)"/>
          <path d="M24 62 Q10 54 14 38" fill="none" stroke="${primary}" stroke-width="5" stroke-linecap="round" transform="rotate(${tailRot} 24 62)"/>
          <rect x="33" y="${66 + legA}" width="10" height="16" rx="5" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="53" y="${66 + legB}" width="10" height="16" rx="5" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="48" cy="60" rx="18" ry="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="48" cy="61" rx="10" ry="10" fill="${secondary}"/>
          <polygon points="27,32 23,11 41,22" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <polygon points="69,32 73,11 55,22" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <polygon points="29,28 26,16 37,22" fill="${accent}"/>
          <polygon points="67,28 70,16 59,22" fill="${accent}"/>
          <ellipse cx="48" cy="36" rx="23" ry="19" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="48" cy="42" rx="14" ry="10" fill="${secondary}"/>
          <line x1="21" y1="38" x2="31" y2="39" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
          <line x1="21" y1="44" x2="31" y2="43" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
          <line x1="75" y1="38" x2="65" y2="39" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
          <line x1="75" y1="44" x2="65" y2="43" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
          ${drawEyes(48, 33, 9, isMascot && step ? 'wink' : eye)}
          ${drawMouth(48, 43, 'cat')}
          ${isMascot ? `<path d="M36 52 Q48 58 60 52" fill="none" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>` : ''}
        </g>
      `);
    }

    case 'cyber_cat':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.26"/>
        <g transform="translate(0,${bob})">
          ${step ? `<polygon points="36,75 43,88 50,75" fill="#38BDF8" opacity="0.85"/><polygon points="48,75 55,88 62,75" fill="#22D3EE" opacity="0.85"/>` : ''}
          <rect x="33" y="50" width="30" height="26" rx="9" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <polygon points="27,32 23,12 41,22" fill="${secondary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <polygon points="69,32 73,12 55,22" fill="${secondary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="24" y="19" width="48" height="36" rx="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          ${drawEyes(48, 36, 9, 'visor')}
          <path d="M41 47 L46 49 L50 49 L55 47" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="48" cy="63" r="6" fill="#0F172A" stroke="${accent}" stroke-width="2"/>
          <circle cx="48" cy="63" r="2.5" fill="${accent}"/>
        </g>
      `);

    case 'astronaut':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.25"/>
        <g transform="translate(0,${bob})">
          <rect x="26" y="46" width="44" height="28" rx="8" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
          ${step ? `<polygon points="29,74 33,86 38,74" fill="#F97316"/><polygon points="58,74 63,86 67,74" fill="#F97316"/>` : ''}
          <rect x="34" y="48" width="28" height="25" rx="8" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="37" y="71" width="9" height="12" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
          <rect x="50" y="71" width="9" height="12" rx="4" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>
          <circle cx="48" cy="32" r="21" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="33" y="21" width="30" height="20" rx="9" fill="#0F172A" stroke="${accent}" stroke-width="2.5"/>
          <path d="M38 25 Q46 22 57 26" fill="none" stroke="#7DD3FC" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
          <rect x="41" y="54" width="14" height="9" rx="2.5" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/>
        </g>
      `);

    case 'ninja':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="20" ry="5" fill="#0F172A" opacity="0.25"/>
        <g transform="translate(0,${bob})">
          <line x1="25" y1="70" x2="73" y2="20" stroke="#94A3B8" stroke-width="4" stroke-linecap="round"/>
          <path d="M62 27 L76 17" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
          <path d="M32 50 L64 50 L60 76 L36 76 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="37" y="74" width="9" height="10" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2"/>
          <rect x="50" y="74" width="9" height="10" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2"/>
          <circle cx="48" cy="34" r="19" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="32" y="27" width="32" height="12" rx="5" fill="#FDE68A"/>
          <rect x="28" y="22" width="40" height="7" rx="3" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
          <path d="M66 25 L82 ${step ? 18 : 28} L78 ${step ? 25 : 34} Z" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/>
          ${drawEyes(48, 33, 7, 'angry')}
          <line x1="34" y1="60" x2="62" y2="60" stroke="${accent}" stroke-width="4"/>
        </g>
      `);

    case 'knight':
    case 'paladin':
    case 'monster_darkknight': {
      const isDark = kind === 'monster_darkknight';
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.25"/>
        <g transform="translate(0,${bob})">
          <path d="M40 16 Q48 4 62 12 Q56 21 44 21 Z" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
          <rect x="32" y="48" width="32" height="28" rx="7" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <path d="M36 76 L36 84 M60 76 L60 84" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
          <rect x="30" y="20" width="36" height="31" rx="11" fill="${light}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="34" y="29" width="28" height="11" rx="4" fill="#0F172A"/>
          ${isDark ? `<circle cx="41" cy="34.5" r="2.8" fill="#F43F5E"/><circle cx="55" cy="34.5" r="2.8" fill="#F43F5E"/>` : `<line x1="40" y1="34" x2="45" y2="34" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round"/><line x1="51" y1="34" x2="56" y2="34" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round"/>`}
          <path d="M18 48 L31 48 L31 66 Q24 72 18 66 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.3"/>
          <rect x="${step ? 65 : 67}" y="${step ? 26 : 32}" width="6" height="30" rx="2" fill="#E2E8F0" stroke="${stroke}" stroke-width="2"/>
          <rect x="${step ? 61 : 63}" y="${step ? 50 : 56}" width="14" height="4" rx="2" fill="${accent}" stroke="${stroke}" stroke-width="1.6"/>
        </g>
      `);
    }

    case 'wizard':
    case 'mage':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.25"/>
        <g transform="translate(0,${bob})">
          <path d="M30 82 L36 46 L60 46 L66 82 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="73" y1="26" x2="73" y2="82" stroke="#78350F" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="73" cy="24" r="${step ? 9 : 7}" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
          <circle cx="48" cy="36" r="15" fill="#FDE68A" stroke="${stroke}" stroke-width="2.5"/>
          ${drawEyes(48, 36, 6, eye)}
          <path d="M39 43 Q48 56 57 43 Z" fill="#F8FAFC" stroke="${stroke}" stroke-width="2"/>
          <polygon points="48,4 27,28 69,28" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <ellipse cx="48" cy="28" rx="24" ry="5" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
          <polygon points="48,13 50,18 55,18 51,21 53,26 48,23 43,26 45,21 41,18 46,18" fill="${accent}"/>
        </g>
      `);

    case 'volt_bot':
    case 'mecha_girl':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="20" ry="5" fill="#0F172A" opacity="0.25"/>
        <g transform="translate(0,${bob})">
          <line x1="48" y1="16" x2="48" y2="6" stroke="${stroke}" stroke-width="3"/>
          <circle cx="48" cy="6" r="${step ? 5 : 4}" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
          <rect x="33" y="48" width="30" height="25" rx="6" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="36" y="73" width="8" height="10" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2"/>
          <rect x="52" y="73" width="8" height="10" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2"/>
          <rect x="26" y="16" width="44" height="32" rx="10" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="32" y="23" width="32" height="16" rx="5" fill="#0F172A"/>
          <circle cx="41" cy="31" r="3.5" fill="${accent}"/>
          <circle cx="55" cy="31" r="3.5" fill="${accent}"/>
          <polygon points="47,53 43,62 49,62 46,69 54,59 48,59" fill="${accent}"/>
        </g>
      `);

    case 'pirate':
    case 'pixel_hero':
    case 'skater':
    case 'samurai':
    case 'diver':
    case 'pilot':
    case 'chef':
    case 'detective':
    case 'superhero':
    case 'dino_ranger':
    case 'princess': {
      let hat = '';
      let extra = '';
      if (kind === 'pirate') {
        hat = `<path d="M26 28 Q48 10 70 28 Z" fill="${accent}" stroke="${stroke}" stroke-width="2.5"/><circle cx="48" cy="21" r="4" fill="#FFFFFF"/>`;
        extra = `<rect x="37" y="31" width="9" height="8" rx="3" fill="#0F172A"/>`;
      } else if (kind === 'chef') {
        hat = `<path d="M32 25 C25 14 35 6 48 9 C61 6 71 14 64 25 Z" fill="#FFFFFF" stroke="${stroke}" stroke-width="2.5"/>`;
        extra = `<circle cx="71" cy="56" r="8" fill="#E2E8F0" stroke="${stroke}" stroke-width="2"/><line x1="71" y1="64" x2="71" y2="75" stroke="${stroke}" stroke-width="3"/>`;
      } else if (kind === 'superhero') {
        hat = `<path d="M28 50 L14 78 L34 74 Z" fill="${accent}" stroke="${stroke}" stroke-width="2"/><path d="M68 50 L82 78 L62 74 Z" fill="${accent}" stroke="${stroke}" stroke-width="2"/>`;
        extra = `<polygon points="48,53 50,58 55,58 51,61 52,66 48,63 44,66 45,61 41,58 46,58" fill="${accent}"/>`;
      } else if (kind === 'princess') {
        hat = `<polygon points="34,23 38,10 44,18 48,8 52,18 58,10 62,23" fill="#FACC15" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
        extra = `<path d="M32 50 L26 81 L70 81 L64 50 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>`;
      } else if (kind === 'diver') {
        hat = `<circle cx="48" cy="34" r="22" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/><circle cx="48" cy="34" r="11" fill="#0EA5E9" stroke="#FACC15" stroke-width="3"/>`;
      } else if (kind === 'samurai') {
        hat = `<path d="M24 27 Q48 10 72 27 L66 34 L30 34 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/><polygon points="48,17 34,8 44,21" fill="${accent}"/><polygon points="48,17 62,8 52,21" fill="${accent}"/>`;
      } else if (kind === 'skater') {
        hat = `<path d="M30 25 Q48 11 66 25 Z" fill="${accent}" stroke="${stroke}" stroke-width="2.3"/><rect x="52" y="22" width="19" height="5" rx="2" fill="${accent}" stroke="${stroke}" stroke-width="2"/>`;
        extra = `<rect x="20" y="79" width="56" height="6" rx="3" fill="${secondary}" stroke="${stroke}" stroke-width="2"/><circle cx="30" cy="87" r="4" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/><circle cx="66" cy="87" r="4" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/>`;
      } else if (kind === 'detective') {
        hat = `<ellipse cx="48" cy="24" rx="25" ry="5" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/><path d="M33 24 L37 11 L59 11 L63 24 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.2"/>`;
        extra = `<circle cx="71" cy="54" r="8" fill="#BAE6FD" stroke="#78350F" stroke-width="3"/><line x1="65" y1="60" x2="58" y2="68" stroke="#78350F" stroke-width="3.5" stroke-linecap="round"/>`;
      } else if (kind === 'pilot') {
        hat = `<path d="M29 30 Q48 10 67 30 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/><rect x="32" y="23" width="14" height="9" rx="3" fill="#38BDF8" stroke="${stroke}" stroke-width="2"/><rect x="50" y="23" width="14" height="9" rx="3" fill="#38BDF8" stroke="${stroke}" stroke-width="2"/>`;
      } else if (kind === 'dino_ranger') {
        hat = `<path d="M27 32 Q48 8 69 32 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/><polygon points="43,14 48,5 53,14" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/>`;
      } else {
        hat = `<path d="M29 26 Q48 10 67 26 Z" fill="${accent}" stroke="${stroke}" stroke-width="2.3"/><rect x="46" y="22" width="24" height="5" rx="2.5" fill="${accent}" stroke="${stroke}" stroke-width="2"/>`;
      }

      return wrapSpriteSvg(`
        <ellipse cx="48" cy="87" rx="21" ry="4.5" fill="#0F172A" opacity="0.24"/>
        <g transform="translate(0,${bob})">
          <rect x="33" y="48" width="30" height="27" rx="8" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="36" y="73" width="9" height="10" rx="3.5" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
          <rect x="51" y="73" width="9" height="10" rx="3.5" fill="${secondary}" stroke="${stroke}" stroke-width="2"/>
          ${kind !== 'diver' ? `<circle cx="48" cy="35" r="18" fill="#FDE68A" stroke="${stroke}" stroke-width="2.5"/>${drawEyes(48, 35, 7, eye)}${drawMouth(48, 43, 'smile')}` : ''}
          ${hat}
          ${extra}
        </g>
      `);
    }

    case 'slime_hero':
    case 'monster_slime': {
      const isHero = kind === 'slime_hero';
      const squashX = step ? 28 : 24;
      const squashY = step ? 18 : 22;
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="83" rx="26" ry="5" fill="#0F172A" opacity="0.24"/>
        <path d="M${48 - squashX} 78 C${48 - squashX} ${78 - squashY * 2} ${48 + squashX} ${78 - squashY * 2} ${48 + squashX} 78 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
        <ellipse cx="38" cy="54" rx="5" ry="3" fill="#FFFFFF" opacity="0.55" transform="rotate(-20 38 54)"/>
        ${drawEyes(48, 59, 9, isHero ? 'cute' : 'angry')}
        ${drawMouth(48, 68, isHero ? 'smile' : 'grin')}
        ${isHero ? `<polygon points="36,38 40,26 48,34 56,26 60,38" fill="#FACC15" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>` : `<circle cx="62" cy="48" r="4" fill="${accent}" opacity="0.85"/><circle cx="31" cy="45" r="3" fill="${accent}" opacity="0.8"/>`}
      `);
    }

    default:
      return null;
  }
}
