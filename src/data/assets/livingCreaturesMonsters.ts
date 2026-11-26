// SPDX-License-Identifier: AGPL-3.0-or-later
import { drawEyes, drawMouth, wrapSpriteSvg } from '../assetSvgHelpers';
import type { LivingRenderContext } from './livingCharacters';

export function renderLivingCreatureSvg(ctx: LivingRenderContext): string {
  const { kind, primary, secondary, accent, eye, dark, light, stroke, step, bob } = ctx;

  switch (kind) {
    case 'animal_dog':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.24"/>
        <g transform="translate(0,${bob})">
          <path d="M64 64 Q80 ${step ? 46 : 58} 76 42" fill="none" stroke="${primary}" stroke-width="7" stroke-linecap="round"/>
          <ellipse cx="48" cy="64" rx="18" ry="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="26" cy="42" rx="7" ry="15" fill="${dark}" stroke="${stroke}" stroke-width="2.3" transform="rotate(14 26 42)"/>
          <ellipse cx="70" cy="42" rx="7" ry="15" fill="${dark}" stroke="${stroke}" stroke-width="2.3" transform="rotate(-14 70 42)"/>
          <circle cx="48" cy="38" r="20" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="48" cy="44" rx="11" ry="9" fill="${secondary}"/>
          <ellipse cx="48" cy="41" rx="4.5" ry="3" fill="${stroke}"/>
          ${drawEyes(48, 33, 8, eye)}
          <path d="M44 47 Q48 53 52 47" fill="#FB7185" stroke="${stroke}" stroke-width="1.8"/>
          <path d="M35 55 Q48 61 61 55" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
        </g>
      `);

    case 'animal_fox':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.24"/>
        <path d="M62 66 Q86 52 78 30 Q68 38 62 56 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
        <polygon points="78,30 71,36 80,41" fill="#FFFFFF"/>
        <ellipse cx="48" cy="64" rx="16" ry="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <polygon points="28,33 24,10 42,23" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <polygon points="68,33 72,10 54,23" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M25 38 Q48 16 71 38 Q64 56 48 56 Q32 56 25 38 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M27 40 Q38 44 48 56 Q32 55 27 40 Z" fill="#FFFFFF"/>
        <path d="M69 40 Q58 44 48 56 Q64 55 69 40 Z" fill="#FFFFFF"/>
        ${drawEyes(48, 37, 8, eye)}
        <circle cx="48" cy="47" r="3" fill="${stroke}"/>
      `);

    case 'animal_bunny':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="20" ry="4.5" fill="#0F172A" opacity="0.22"/>
        <g transform="translate(0,${step ? -7 : 0})">
          <ellipse cx="38" cy="19" rx="6.5" ry="16" fill="${primary}" stroke="${stroke}" stroke-width="2.4" transform="rotate(-8 38 19)"/>
          <ellipse cx="58" cy="19" rx="6.5" ry="16" fill="${primary}" stroke="${stroke}" stroke-width="2.4" transform="rotate(8 58 19)"/>
          <ellipse cx="38" cy="20" rx="3" ry="10" fill="${accent}" transform="rotate(-8 38 20)"/>
          <ellipse cx="58" cy="20" rx="3" ry="10" fill="${accent}" transform="rotate(8 58 20)"/>
          <ellipse cx="48" cy="66" rx="16" ry="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="48" cy="44" r="19" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          ${drawEyes(48, 41, 8, eye)}
          <circle cx="35" cy="47" r="3.5" fill="${accent}" opacity="0.55"/>
          <circle cx="61" cy="47" r="3.5" fill="${accent}" opacity="0.55"/>
          ${drawMouth(48, 49, 'cat')}
        </g>
      `);

    case 'animal_frog':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="84" rx="25" ry="5" fill="#0F172A" opacity="0.24"/>
        <g transform="translate(0,${step ? -8 : 0})">
          <ellipse cx="48" cy="60" rx="26" ry="19" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="48" cy="66" rx="17" ry="11" fill="${secondary}"/>
          <circle cx="35" cy="36" r="10" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="61" cy="36" r="10" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="35" cy="35" r="6" fill="#FFFFFF"/>
          <circle cx="61" cy="35" r="6" fill="#FFFFFF"/>
          <circle cx="36" cy="35" r="3" fill="${stroke}"/>
          <circle cx="60" cy="35" r="3" fill="${stroke}"/>
          <path d="M35 54 Q48 63 61 54" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
        </g>
      `);

    case 'animal_owl':
    case 'animal_penguin':
    case 'animal_duck': {
      const isOwl = kind === 'animal_owl';
      const isPenguin = kind === 'animal_penguin';
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="85" rx="21" ry="5" fill="#0F172A" opacity="0.24"/>
        <g transform="translate(0,${bob})">
          <ellipse cx="${step ? 21 : 25}" cy="56" rx="8" ry="14" fill="${dark}" stroke="${stroke}" stroke-width="2.2" transform="rotate(${step ? 32 : 12} 25 56)"/>
          <ellipse cx="${step ? 75 : 71}" cy="56" rx="8" ry="14" fill="${dark}" stroke="${stroke}" stroke-width="2.2" transform="rotate(${step ? -32 : -12} 71 56)"/>
          ${isOwl ? `<polygon points="29,29 24,14 39,22" fill="${primary}" stroke="${stroke}" stroke-width="2"/><polygon points="67,29 72,14 57,22" fill="${primary}" stroke="${stroke}" stroke-width="2"/>` : ''}
          <ellipse cx="48" cy="52" rx="22" ry="26" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="48" cy="59" rx="15" ry="16" fill="${secondary}"/>
          ${isOwl ? `<circle cx="39" cy="40" r="9" fill="#FFFFFF" stroke="${stroke}" stroke-width="2"/><circle cx="57" cy="40" r="9" fill="#FFFFFF" stroke="${stroke}" stroke-width="2"/><circle cx="39" cy="40" r="4" fill="${stroke}"/><circle cx="57" cy="40" r="4" fill="${stroke}"/>` : drawEyes(48, 39, 9, eye)}
          ${drawMouth(48, isPenguin || isOwl ? 46 : 44, 'beak')}
          <ellipse cx="38" cy="79" rx="6" ry="3" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/>
          <ellipse cx="58" cy="79" rx="6" ry="3" fill="${accent}" stroke="${stroke}" stroke-width="1.8"/>
        </g>
      `);
    }

    case 'animal_panda':
    case 'animal_bear':
    case 'animal_lion':
    case 'animal_tiger':
    case 'animal_monkey': {
      const isLion = kind === 'animal_lion';
      const isPanda = kind === 'animal_panda';
      const isTiger = kind === 'animal_tiger';
      const isMonkey = kind === 'animal_monkey';
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.24"/>
        ${isLion ? `<circle cx="48" cy="40" r="28" fill="${accent}" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="10 4"/>` : ''}
        <circle cx="28" cy="23" r="9" fill="${isPanda || isMonkey ? dark : primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="68" cy="23" r="9" fill="${isPanda || isMonkey ? dark : primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="48" cy="66" rx="18" ry="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="48" cy="67" rx="11" ry="10" fill="${secondary}"/>
        <circle cx="48" cy="40" r="21" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        ${isPanda ? `<ellipse cx="38" cy="36" rx="6" ry="7" fill="${stroke}" transform="rotate(-15 38 36)"/><ellipse cx="58" cy="36" rx="6" ry="7" fill="${stroke}" transform="rotate(15 58 36)"/><circle cx="38" cy="36" r="2.2" fill="#FFFFFF"/><circle cx="58" cy="36" r="2.2" fill="#FFFFFF"/>` : drawEyes(48, 36, 9, eye)}
        ${isTiger ? `<path d="M44 21 L48 28 L52 21 M29 36 L35 38 L29 41 M67 36 L61 38 L67 41" fill="none" stroke="${stroke}" stroke-width="2.3" stroke-linecap="round"/>` : ''}
        <ellipse cx="48" cy="47" rx="10" ry="7" fill="${secondary}"/>
        <ellipse cx="48" cy="44" rx="4" ry="2.6" fill="${stroke}"/>
        ${drawMouth(48, 49, 'smile')}
      `);
    }

    case 'animal_shark':
    case 'animal_whale':
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <polygon points="42,27 52,11 58,28" fill="${dark}" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round"/>
          <polygon points="73,50 89,37 84,50 89,63" fill="${dark}" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round"/>
          <ellipse cx="46" cy="50" rx="31" ry="20" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <path d="M18 52 Q46 72 72 54 Q46 58 18 52 Z" fill="${secondary}"/>
          <circle cx="31" cy="43" r="4" fill="#FFFFFF" stroke="${stroke}" stroke-width="1.8"/>
          <circle cx="30" cy="43" r="2" fill="${stroke}"/>
          ${kind === 'animal_shark' ? `<path d="M24 54 L30 57 L36 54 L42 57" fill="none" stroke="${stroke}" stroke-width="2"/>` : `<path d="M42 26 Q38 14 31 16 M46 26 Q50 14 57 16" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round"/>`}
        </g>
      `);

    case 'animal_octopus':
    case 'animal_jellyfish':
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <path d="M27 56 Q22 78 16 82 M36 58 Q33 80 31 85 M48 60 Q48 82 48 87 M60 58 Q63 80 65 85 M69 56 Q74 78 80 82" fill="none" stroke="${primary}" stroke-width="${kind === 'animal_octopus' ? 7 : 4.5}" stroke-linecap="round"/>
          <path d="M23 44 C23 20 73 20 73 44 C73 58 63 62 48 62 C33 62 23 58 23 44 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <ellipse cx="38" cy="31" rx="7" ry="3.5" fill="${light}" opacity="0.6" transform="rotate(-20 38 31)"/>
          ${drawEyes(48, 44, 9, eye)}
          ${drawMouth(48, 52, 'smile')}
        </g>
      `);

    case 'animal_butterfly':
    case 'animal_bee':
    case 'animal_ladybug':
    case 'animal_bat': {
      const wingSpread = step ? 0.72 : 1;
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <g transform="translate(48,48) scale(${wingSpread},1) translate(-48,-48)">
            <ellipse cx="28" cy="38" rx="18" ry="14" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
            <ellipse cx="68" cy="38" rx="18" ry="14" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
            <ellipse cx="31" cy="58" rx="13" ry="11" fill="${secondary}" stroke="${stroke}" stroke-width="2.3"/>
            <ellipse cx="65" cy="58" rx="13" ry="11" fill="${secondary}" stroke="${stroke}" stroke-width="2.3"/>
            ${kind === 'animal_butterfly' ? `<circle cx="27" cy="37" r="5" fill="${accent}"/><circle cx="69" cy="37" r="5" fill="${accent}"/>` : ''}
          </g>
          <ellipse cx="48" cy="49" rx="10" ry="20" fill="${kind === 'animal_bee' ? '#FACC15' : dark}" stroke="${stroke}" stroke-width="2.5"/>
          ${kind === 'animal_bee' ? `<rect x="39" y="42" width="18" height="4" fill="#0F172A"/><rect x="39" y="51" width="18" height="4" fill="#0F172A"/>` : ''}
          ${kind === 'animal_ladybug' ? `<circle cx="42" cy="46" r="2.8" fill="#0F172A"/><circle cx="54" cy="46" r="2.8" fill="#0F172A"/><circle cx="48" cy="56" r="2.8" fill="#0F172A"/>` : ''}
          ${drawEyes(48, 36, 5, 'cute')}
        </g>
      `);
    }

    case 'animal_dragon':
    case 'monster_bossdragon':
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <path d="M30 42 L10 ${step ? 20 : 32} L24 54 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round"/>
          <path d="M66 42 L86 ${step ? 20 : 32} L72 54 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round"/>
          <path d="M34 52 L62 52 L66 79 L30 79 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
          <ellipse cx="48" cy="66" rx="11" ry="11" fill="${accent}"/>
          <polygon points="35,23 27,8 42,19" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
          <polygon points="61,23 69,8 54,19" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
          <rect x="29" y="21" width="38" height="31" rx="12" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          ${drawEyes(48, 34, 9, kind === 'monster_bossdragon' ? 'angry' : eye)}
          ${drawMouth(48, 44, 'fangs')}
          ${step && kind === 'monster_bossdragon' ? `<polygon points="48,47 38,60 58,60" fill="#F97316"/>` : ''}
        </g>
      `);

    case 'animal_unicorn':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="20" ry="5" fill="#0F172A" opacity="0.22"/>
        <polygon points="48,6 42,24 54,24" fill="#FACC15" stroke="${stroke}" stroke-width="2"/>
        <path d="M62 32 C76 34 78 52 68 62" fill="none" stroke="#F472B6" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="48" cy="64" rx="18" ry="15" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="48" cy="39" r="18" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M34 25 Q46 16 56 26" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
        ${drawEyes(48, 37, 7, 'cute')}
        <ellipse cx="48" cy="46" rx="9" ry="6" fill="${secondary}"/>
        ${drawMouth(48, 47, 'smile')}
      `);

    case 'animal_phoenix':
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <path d="M36 46 L10 ${step ? 20 : 38} L26 60 Z" fill="${accent}" stroke="${stroke}" stroke-width="2.2"/>
          <path d="M60 46 L86 ${step ? 20 : 38} L70 60 Z" fill="${accent}" stroke="${stroke}" stroke-width="2.2"/>
          <polygon points="48,70 36,88 48,80 60,88" fill="#F59E0B" stroke="${stroke}" stroke-width="2"/>
          <ellipse cx="48" cy="52" rx="15" ry="20" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          <polygon points="42,26 48,11 54,26" fill="#FACC15" stroke="${stroke}" stroke-width="2"/>
          <circle cx="48" cy="34" r="14" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          ${drawEyes(48, 32, 6, 'angry')}
          ${drawMouth(48, 40, 'beak')}
        </g>
      `);

    case 'animal_trex':
    case 'animal_triceratops':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="22" ry="5" fill="#0F172A" opacity="0.24"/>
        <path d="M26 64 L10 56 L22 72 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="48" cy="62" rx="18" ry="18" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <ellipse cx="52" cy="64" rx="11" ry="12" fill="${secondary}"/>
        ${kind === 'animal_triceratops' ? `<circle cx="44" cy="34" r="20" fill="${dark}" stroke="${stroke}" stroke-width="2.5"/><polygon points="62,28 78,21 66,35" fill="#FEF3C7" stroke="${stroke}" stroke-width="1.8"/>` : ''}
        <rect x="33" y="20" width="36" height="26" rx="10" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        ${drawEyes(52, 31, 7, eye)}
        <path d="M44 41 L68 41" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round"/>
      `);

    case 'animal_crab':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="80" rx="26" ry="5" fill="#0F172A" opacity="0.22"/>
        <circle cx="20" cy="${step ? 28 : 34}" r="10" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
        <circle cx="76" cy="${step ? 28 : 34}" r="10" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
        <path d="M24 62 L14 74 M30 67 L22 78 M72 62 L82 74 M66 67 L74 78" stroke="${primary}" stroke-width="4.5" stroke-linecap="round"/>
        <ellipse cx="48" cy="57" rx="24" ry="16" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        <line x1="38" y1="42" x2="36" y2="30" stroke="${stroke}" stroke-width="3"/>
        <line x1="58" y1="42" x2="60" y2="30" stroke="${stroke}" stroke-width="3"/>
        <circle cx="36" cy="28" r="5" fill="#FFFFFF" stroke="${stroke}" stroke-width="2"/>
        <circle cx="60" cy="28" r="5" fill="#FFFFFF" stroke="${stroke}" stroke-width="2"/>
        <circle cx="36" cy="28" r="2.2" fill="${stroke}"/>
        <circle cx="60" cy="28" r="2.2" fill="${stroke}"/>
        ${drawMouth(48, 59, 'grin')}
      `);

    case 'animal_turtle':
    case 'animal_snail':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="80" rx="26" ry="5" fill="#0F172A" opacity="0.22"/>
        <ellipse cx="46" cy="65" rx="24" ry="8" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>
        <path d="M22 61 C22 30 70 30 70 61 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <circle cx="46" cy="48" r="9" fill="none" stroke="${accent}" stroke-width="2.5"/>
        <circle cx="73" cy="54" r="10" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>
        <circle cx="76" cy="52" r="2.5" fill="${stroke}"/>
      `);

    case 'monster_ghost':
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <path d="M24 78 L24 44 C24 22 72 22 72 44 L72 78 L62 70 L53 79 L44 70 L35 79 Z" fill="${primary}" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
          ${drawEyes(48, 43, 9, step ? 'wide' : 'cute')}
          <ellipse cx="48" cy="58" rx="${step ? 7 : 4}" ry="${step ? 8 : 5}" fill="${stroke}"/>
        </g>
      `);

    case 'monster_skull':
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <circle cx="48" cy="40" r="24" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
          <rect x="33" y="54" width="30" height="20" rx="6" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
          <circle cx="38" cy="41" r="6.5" fill="${stroke}"/><circle cx="58" cy="41" r="6.5" fill="${stroke}"/>
          <circle cx="38" cy="41" r="2.2" fill="${accent}"/><circle cx="58" cy="41" r="2.2" fill="${accent}"/>
          <polygon points="48,47 44,54 52,54" fill="${stroke}"/>
          <line x1="40" y1="61" x2="40" y2="73" stroke="${stroke}" stroke-width="2.5"/>
          <line x1="48" y1="61" x2="48" y2="73" stroke="${stroke}" stroke-width="2.5"/>
          <line x1="56" y1="61" x2="56" y2="73" stroke="${stroke}" stroke-width="2.5"/>
        </g>
      `);

    case 'monster_goblin':
    case 'monster_imp':
    case 'monster_zombie':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="20" ry="5" fill="#0F172A" opacity="0.24"/>
        <polygon points="27,36 10,27 25,45" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
        <polygon points="69,36 86,27 71,45" fill="${primary}" stroke="${stroke}" stroke-width="2.3"/>
        <rect x="34" y="51" width="28" height="27" rx="7" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="48" cy="36" r="19" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
        ${kind === 'monster_imp' ? `<polygon points="34,21 29,8 41,17" fill="${accent}" stroke="${stroke}" stroke-width="2"/><polygon points="62,21 67,8 55,17" fill="${accent}" stroke="${stroke}" stroke-width="2"/>` : ''}
        ${drawEyes(48, 35, 8, 'angry', '#FACC15')}
        ${drawMouth(48, 45, 'fangs')}
      `);

    case 'monster_cyclops':
    case 'monster_eyeball':
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <ellipse cx="48" cy="50" rx="26" ry="26" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
          ${drawEyes(48, 44, 0, 'cyclops', accent)}
          ${kind === 'monster_cyclops' ? drawMouth(48, 63, 'fangs') : `<path d="M26 52 Q29 48 33 50 M68 50 Q64 46 61 51" fill="none" stroke="${accent}" stroke-width="2"/>`}
        </g>
      `);

    case 'monster_mimic':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="82" rx="28" ry="5" fill="#0F172A" opacity="0.25"/>
        <rect x="20" y="45" width="56" height="33" rx="6" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <path d="M20 ${step ? 34 : 45} C20 20 76 20 76 ${step ? 34 : 45} Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.6"/>
        ${step ? `<polygon points="26,45 32,55 38,45 44,55 50,45 56,55 62,45 68,55 72,45" fill="#FFFFFF" stroke="${stroke}" stroke-width="1.6"/>` : ''}
        <circle cx="38" cy="${step ? 31 : 38}" r="4.5" fill="#FACC15" stroke="${stroke}" stroke-width="1.8"/>
        <circle cx="58" cy="${step ? 31 : 38}" r="4.5" fill="#FACC15" stroke="${stroke}" stroke-width="1.8"/>
      `);

    case 'monster_golem':
    case 'monster_yeti':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="86" rx="26" ry="5" fill="#0F172A" opacity="0.25"/>
        <rect x="22" y="28" width="52" height="48" rx="12" fill="${primary}" stroke="${stroke}" stroke-width="2.8"/>
        <rect x="30" y="75" width="12" height="9" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="54" y="75" width="12" height="9" rx="3" fill="${dark}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="34" y="38" width="28" height="10" rx="4" fill="#0F172A"/>
        <circle cx="41" cy="43" r="3" fill="${accent}"/><circle cx="55" cy="43" r="3" fill="${accent}"/>
        <polygon points="48,55 43,64 53,64" fill="${accent}" opacity="0.8"/>
      `);

    case 'monster_vampire':
      return wrapSpriteSvg(`
        <path d="M18 42 L32 82 L64 82 L78 42 L62 52 L34 52 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="48" cy="36" r="18" fill="#E2E8F0" stroke="${stroke}" stroke-width="2.5"/>
        <path d="M30 30 Q48 16 66 30 L56 26 L48 33 L40 26 Z" fill="#0F172A"/>
        ${drawEyes(48, 37, 7, 'angry', '#F43F5E')}
        ${drawMouth(48, 46, 'fangs')}
      `);

    case 'monster_spider':
    case 'monster_beetle':
      return wrapSpriteSvg(`
        <path d="M28 42 L10 30 M25 50 L8 50 M28 58 L12 72 M68 42 L86 30 M71 50 L88 50 M68 58 L84 72" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="48" cy="52" rx="21" ry="19" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
        <circle cx="40" cy="46" r="4" fill="${accent}"/><circle cx="56" cy="46" r="4" fill="${accent}"/>
        <circle cx="48" cy="39" r="3" fill="${accent}"/>
      `);

    case 'monster_bombbot':
      return wrapSpriteSvg(`
        <ellipse cx="48" cy="84" rx="20" ry="5" fill="#0F172A" opacity="0.25"/>
        <path d="M48 25 Q54 12 63 14" fill="none" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="65" cy="14" r="${step ? 7 : 5}" fill="${step ? '#FACC15' : '#F97316'}"/>
        <circle cx="48" cy="52" r="24" fill="${step ? accent : primary}" stroke="${stroke}" stroke-width="2.8"/>
        <rect x="33" y="43" width="30" height="12" rx="5" fill="#0F172A"/>
        <circle cx="41" cy="49" r="3" fill="#EF4444"/><circle cx="55" cy="49" r="3" fill="#EF4444"/>
      `);

    case 'monster_gargoyle':
    case 'monster_tentacle':
    default:
      return wrapSpriteSvg(`
        <g transform="translate(0,${bob})">
          <path d="M28 46 L10 26 L24 58 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.3"/>
          <path d="M68 46 L86 26 L72 58 Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.3"/>
          <ellipse cx="48" cy="52" rx="22" ry="24" fill="${primary}" stroke="${stroke}" stroke-width="2.5"/>
          ${drawEyes(48, 45, 8, 'angry', accent)}
          ${drawMouth(48, 58, 'fangs')}
        </g>
      `);
  }
}
