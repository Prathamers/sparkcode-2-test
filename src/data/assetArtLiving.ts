// SPDX-License-Identifier: AGPL-3.0-or-later
import { shadeHex, type EyeStyle } from './assetSvgHelpers';
import { renderLivingCharacterSvg } from './assets/livingCharacters';
import { renderLivingCreatureSvg } from './assets/livingCreaturesMonsters';

export type LivingArtKind =
  | 'mascot_cat'
  | 'cyber_cat'
  | 'astronaut'
  | 'ninja'
  | 'knight'
  | 'wizard'
  | 'volt_bot'
  | 'pirate'
  | 'pixel_hero'
  | 'mage'
  | 'paladin'
  | 'skater'
  | 'samurai'
  | 'diver'
  | 'pilot'
  | 'chef'
  | 'detective'
  | 'superhero'
  | 'slime_hero'
  | 'dino_ranger'
  | 'mecha_girl'
  | 'princess'
  | 'animal_cat'
  | 'animal_dog'
  | 'animal_fox'
  | 'animal_bunny'
  | 'animal_frog'
  | 'animal_owl'
  | 'animal_penguin'
  | 'animal_panda'
  | 'animal_bear'
  | 'animal_lion'
  | 'animal_tiger'
  | 'animal_shark'
  | 'animal_octopus'
  | 'animal_whale'
  | 'animal_butterfly'
  | 'animal_bee'
  | 'animal_ladybug'
  | 'animal_dragon'
  | 'animal_unicorn'
  | 'animal_phoenix'
  | 'animal_trex'
  | 'animal_triceratops'
  | 'animal_bat'
  | 'animal_duck'
  | 'animal_crab'
  | 'animal_turtle'
  | 'animal_jellyfish'
  | 'animal_snail'
  | 'animal_monkey'
  | 'monster_slime'
  | 'monster_ghost'
  | 'monster_skull'
  | 'monster_goblin'
  | 'monster_imp'
  | 'monster_cyclops'
  | 'monster_mimic'
  | 'monster_golem'
  | 'monster_vampire'
  | 'monster_spider'
  | 'monster_bombbot'
  | 'monster_beetle'
  | 'monster_gargoyle'
  | 'monster_eyeball'
  | 'monster_darkknight'
  | 'monster_yeti'
  | 'monster_tentacle'
  | 'monster_zombie'
  | 'monster_bossdragon';

export interface LivingArtSpec {
  kind: LivingArtKind;
  primary: string;
  secondary: string;
  accent: string;
  eye?: EyeStyle;
  frame?: number;
}

export function renderLivingSvg(spec: LivingArtSpec): string {
  const step = (spec.frame ?? 0) % 2 === 1;
  const ctx = {
    kind: spec.kind,
    primary: spec.primary,
    secondary: spec.secondary,
    accent: spec.accent,
    eye: spec.eye ?? 'cute',
    dark: shadeHex(spec.primary, -0.28),
    light: shadeHex(spec.primary, 0.28),
    stroke: '#0F172A',
    step,
    bob: step ? -3 : 0,
  };
  return renderLivingCharacterSvg(ctx) ?? renderLivingCreatureSvg(ctx);
}
