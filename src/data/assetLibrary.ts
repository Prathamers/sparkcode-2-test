// SPDX-License-Identifier: AGPL-3.0-or-later
import { createUid } from '../engine/blocks';
import type {
  BlendModeType,
  ColliderShape,
  CostumeData,
  SpriteData,
  StageSettings,
} from '../types/project';
import { renderLivingSvg, type LivingArtSpec } from './assetArtLiving';
import { renderWorldSvg, type WorldArtSpec } from './assetArtWorld';
import {
  ASSET_BACKDROPS,
  getBackdropPreviewUrl,
  type BackdropAssetDef,
  type BackdropCategoryId,
} from './assetBackdropArt';
import { svgToDataUrl } from './assetSvgHelpers';

export type { BackdropAssetDef, BackdropCategoryId };
export { ASSET_BACKDROPS, getBackdropPreviewUrl };

export type AssetCategoryId =
  | 'all'
  | 'characters'
  | 'animals'
  | 'monsters'
  | 'space'
  | 'platforms'
  | 'items'
  | 'food_nature'
  | 'vehicles_sports'
  | 'fx_ui'
  | 'letters';

export interface AssetCategoryMeta {
  id: AssetCategoryId;
  label: string;
}

export const ASSET_CATEGORIES: AssetCategoryMeta[] = [
  { id: 'all', label: 'All' },
  { id: 'characters', label: 'Characters' },
  { id: 'animals', label: 'Animals' },
  { id: 'monsters', label: 'Monsters' },
  { id: 'space', label: 'Space & Sci-Fi' },
  { id: 'platforms', label: 'Platforms & Tiles' },
  { id: 'items', label: 'Items & Weapons' },
  { id: 'food_nature', label: 'Food & Nature' },
  { id: 'vehicles_sports', label: 'Vehicles & Sports' },
  { id: 'fx_ui', label: 'FX & UI' },
  { id: 'letters', label: 'Letters & Numbers' },
];

export const BACKDROP_CATEGORIES: Array<{ id: BackdropCategoryId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'space', label: 'Space & Sci-Fi' },
  { id: 'nature', label: 'Nature & Outdoors' },
  { id: 'fantasy', label: 'Fantasy & Dungeon' },
  { id: 'urban', label: 'Urban & Retro' },
  { id: 'abstract', label: 'Abstract & Studio' },
];

type ArtGenerator =
  | { group: 'living'; spec: LivingArtSpec }
  | { group: 'world'; spec: WorldArtSpec };

export interface SpriteAssetFrame {
  name: string;
  renderSvg: () => string;
}

export interface SpriteAssetDef {
  id: string;
  name: string;
  category: Exclude<AssetCategoryId, 'all'>;
  tags: string[];
  width: number;
  height: number;
  colliderShape?: ColliderShape;
  solidPlatform?: boolean;
  glowLightColor?: string;
  blendMode?: BlendModeType;
  frames: SpriteAssetFrame[];
}

export interface CostumeAssetItem {
  id: string;
  spriteId: string;
  name: string;
  category: Exclude<AssetCategoryId, 'all'>;
  tags: string[];
  width: number;
  height: number;
  renderSvg: () => string;
}

const dataUrlCache = new Map<string, string>();

export function getCachedSvgUrl(cacheKey: string, renderSvg: () => string): string {
  let url = dataUrlCache.get(cacheKey);
  if (!url) {
    url = svgToDataUrl(renderSvg());
    dataUrlCache.set(cacheKey, url);
  }
  return url;
}

function genUrl(cacheKey: string, gen: ArtGenerator): () => string {
  return () => (gen.group === 'living' ? renderLivingSvg(gen.spec) : renderWorldSvg(gen.spec));
}

function living(
  id: string,
  name: string,
  category: Exclude<AssetCategoryId, 'all'>,
  tags: string[],
  spec: Omit<LivingArtSpec, 'frame'>,
  frameNames: string[] = ['Idle'],
  opts: { width?: number; height?: number; colliderShape?: ColliderShape; glowLightColor?: string } = {}
): SpriteAssetDef {
  return {
    id,
    name,
    category,
    tags: [name.toLowerCase(), category, ...tags],
    width: opts.width ?? 56,
    height: opts.height ?? 56,
    colliderShape: opts.colliderShape ?? 'aabb',
    glowLightColor: opts.glowLightColor,
    frames: frameNames.map((fn, idx) => ({
      name: fn,
      renderSvg: genUrl(`${id}:${idx}`, { group: 'living', spec: { ...spec, frame: idx } }),
    })),
  };
}

function world(
  id: string,
  name: string,
  category: Exclude<AssetCategoryId, 'all'>,
  tags: string[],
  spec: Omit<WorldArtSpec, 'frame'>,
  frameNames: string[] = ['Default'],
  opts: {
    width?: number;
    height?: number;
    colliderShape?: ColliderShape;
    solidPlatform?: boolean;
    glowLightColor?: string;
    blendMode?: BlendModeType;
  } = {}
): SpriteAssetDef {
  return {
    id,
    name,
    category,
    tags: [name.toLowerCase(), category, ...tags],
    width: opts.width ?? 52,
    height: opts.height ?? 52,
    colliderShape: opts.colliderShape ?? 'aabb',
    solidPlatform: opts.solidPlatform,
    glowLightColor: opts.glowLightColor,
    blendMode: opts.blendMode,
    frames: frameNames.map((fn, idx) => ({
      name: fn,
      renderSvg: genUrl(`${id}:${idx}`, { group: 'world', spec: { ...spec, frame: idx } }),
    })),
  };
}

// =========================================================================
// 1. CHARACTERS & HEROES (22 sprites)
// =========================================================================
const CHARACTER_ASSETS: SpriteAssetDef[] = [
  living('chr_sparky_cat', 'Sparky Cat', 'characters', ['mascot', 'scratch', 'hero', 'orange'], { kind: 'mascot_cat', primary: '#F97316', secondary: '#FEF3C7', accent: '#FDBA74' }, ['Walk 1', 'Walk 2']),
  living('chr_cyber_cat', 'Cyber Cat', 'characters', ['cat', 'robot', 'neon', 'sci-fi'], { kind: 'cyber_cat', primary: '#0EA5E9', secondary: '#1E293B', accent: '#22D3EE' }, ['Idle', 'Boost'], { glowLightColor: '#38BDF8' }),
  living('chr_astro', 'Astro Explorer', 'characters', ['astronaut', 'space', 'suit'], { kind: 'astronaut', primary: '#F8FAFC', secondary: '#64748B', accent: '#38BDF8' }, ['Stand', 'Jetpack']),
  living('chr_ninja', 'Shadow Ninja', 'characters', ['ninja', 'sword', 'stealth'], { kind: 'ninja', primary: '#1E293B', secondary: '#0F172A', accent: '#EF4444' }, ['Ready', 'Dash']),
  living('chr_knight', 'Emerald Knight', 'characters', ['knight', 'armor', 'shield', 'sword'], { kind: 'knight', primary: '#94A3B8', secondary: '#10B981', accent: '#FACC15' }, ['Guard', 'Slash']),
  living('chr_wizard', 'Arcane Wizard', 'characters', ['magic', 'staff', 'hat', 'spell'], { kind: 'wizard', primary: '#6366F1', secondary: '#4338CA', accent: '#FACC15' }, ['Idle', 'Cast'], { glowLightColor: '#818CF8' }),
  living('chr_voltbot', 'Volt Bot', 'characters', ['robot', 'mech', 'electric'], { kind: 'volt_bot', primary: '#38BDF8', secondary: '#334155', accent: '#FACC15' }, ['Idle', 'Charge']),
  living('chr_pirate', 'Sky Pirate', 'characters', ['pirate', 'bandana', 'adventure'], { kind: 'pirate', primary: '#B91C1C', secondary: '#1E293B', accent: '#F59E0B' }, ['Stand', 'Cheer']),
  living('chr_pixel_hero', 'Pixel Adventurer', 'characters', ['hero', 'cap', 'platformer'], { kind: 'pixel_hero', primary: '#2563EB', secondary: '#1E293B', accent: '#EF4444' }, ['Idle', 'Jump']),
  living('chr_flame_mage', 'Flame Mage', 'characters', ['fire', 'magic', 'wizard', 'red'], { kind: 'mage', primary: '#DC2626', secondary: '#991B1B', accent: '#F97316' }, ['Idle', 'Fireball'], { glowLightColor: '#F97316' }),
  living('chr_frost_paladin', 'Frost Paladin', 'characters', ['ice', 'knight', 'paladin', 'blue'], { kind: 'paladin', primary: '#7DD3FC', secondary: '#0284C7', accent: '#E0F2FE' }, ['Guard', 'Strike']),
  living('chr_skater', 'Street Skater', 'characters', ['skateboard', 'cool', 'urban'], { kind: 'skater', primary: '#14B8A6', secondary: '#0F172A', accent: '#F43F5E', eye: 'cool' }, ['Roll', 'Ollie']),
  living('chr_samurai', 'Crimson Ronin', 'characters', ['samurai', 'warrior', 'katana'], { kind: 'samurai', primary: '#991B1B', secondary: '#1E293B', accent: '#FACC15' }, ['Stance']),
  living('chr_diver', 'Deep Sea Diver', 'characters', ['ocean', 'helmet', 'underwater'], { kind: 'diver', primary: '#F59E0B', secondary: '#B45309', accent: '#38BDF8' }, ['Swim']),
  living('chr_pilot', 'Ace Sky Pilot', 'characters', ['aviator', 'plane', 'goggles'], { kind: 'pilot', primary: '#78350F', secondary: '#334155', accent: '#FACC15' }, ['Ready']),
  living('chr_chef', 'Master Chef', 'characters', ['cook', 'food', 'hat', 'kitchen'], { kind: 'chef', primary: '#FFFFFF', secondary: '#334155', accent: '#EF4444' }, ['Cook']),
  living('chr_detective', 'Mystery Detective', 'characters', ['sleuth', 'mystery', 'hat'], { kind: 'detective', primary: '#B45309', secondary: '#451A03', accent: '#38BDF8' }, ['Search']),
  living('chr_supernova', 'Captain Nova', 'characters', ['superhero', 'cape', 'star'], { kind: 'superhero', primary: '#2563EB', secondary: '#1E3A8A', accent: '#EF4444' }, ['Stand', 'Fly']),
  living('chr_slime_hero', 'King Slime Hero', 'characters', ['slime', 'crown', 'cute', 'rpg'], { kind: 'slime_hero', primary: '#38BDF8', secondary: '#0284C7', accent: '#FACC15' }, ['Idle', 'Bounce']),
  living('chr_dino_ranger', 'Dino Ranger', 'characters', ['hoodie', 'dino', 'green'], { kind: 'dino_ranger', primary: '#10B981', secondary: '#065F46', accent: '#FACC15' }, ['Ready']),
  living('chr_mecha_girl', 'Cyber Droid', 'characters', ['android', 'neon', 'pink', 'bot'], { kind: 'mecha_girl', primary: '#EC4899', secondary: '#1E293B', accent: '#22D3EE' }, ['Idle', 'Overdrive']),
  living('chr_princess', 'Emerald Princess', 'characters', ['royal', 'crown', 'fantasy'], { kind: 'princess', primary: '#10B981', secondary: '#047857', accent: '#FACC15' }, ['Wave']),
];

// =========================================================================
// 2. ANIMALS & CREATURES (32 sprites)
// =========================================================================
const ANIMAL_ASSETS: SpriteAssetDef[] = [
  living('ani_ginger_cat', 'Ginger Tabby', 'animals', ['cat', 'pet', 'kitten'], { kind: 'animal_cat', primary: '#FB923C', secondary: '#FFFBEB', accent: '#FDA4AF' }, ['Walk 1', 'Walk 2']),
  living('ani_tuxedo_cat', 'Tuxedo Cat', 'animals', ['cat', 'black', 'pet'], { kind: 'animal_cat', primary: '#334155', secondary: '#F8FAFC', accent: '#F472B6' }, ['Sit', 'Step']),
  living('ani_golden_pup', 'Golden Puppy', 'animals', ['dog', 'puppy', 'pet'], { kind: 'animal_dog', primary: '#F59E0B', secondary: '#FEF3C7', accent: '#EF4444' }, ['Sit', 'Wag']),
  living('ani_husky', 'Arctic Husky', 'animals', ['dog', 'wolf', 'snow'], { kind: 'animal_dog', primary: '#64748B', secondary: '#F8FAFC', accent: '#38BDF8' }, ['Stand', 'Bark']),
  living('ani_red_fox', 'Red Fox', 'animals', ['fox', 'forest', 'wildlife'], { kind: 'animal_fox', primary: '#EA580C', secondary: '#FFFFFF', accent: '#FDBA74' }, ['Alert']),
  living('ani_snow_bunny', 'Snow Bunny', 'animals', ['rabbit', 'bunny', 'easter'], { kind: 'animal_bunny', primary: '#F8FAFC', secondary: '#E2E8F0', accent: '#FDA4AF' }, ['Sit', 'Hop']),
  living('ani_pink_bunny', 'Berry Bunny', 'animals', ['rabbit', 'pink', 'cute'], { kind: 'animal_bunny', primary: '#F9A8D4', secondary: '#FCE7F3', accent: '#EC4899' }, ['Sit', 'Hop']),
  living('ani_tree_frog', 'Tree Frog', 'animals', ['frog', 'pond', 'green', 'jump'], { kind: 'animal_frog', primary: '#22C55E', secondary: '#BBF7D0', accent: '#FACC15' }, ['Sit', 'Leap']),
  living('ani_barn_owl', 'Wise Owl', 'animals', ['bird', 'owl', 'night'], { kind: 'animal_owl', primary: '#92400E', secondary: '#FEF3C7', accent: '#F59E0B' }, ['Perch', 'Flap']),
  living('ani_penguin', 'Emperor Penguin', 'animals', ['bird', 'snow', 'ice', 'arctic'], { kind: 'animal_penguin', primary: '#1E293B', secondary: '#F8FAFC', accent: '#F97316' }, ['Waddle 1', 'Waddle 2']),
  living('ani_panda', 'Giant Panda', 'animals', ['bear', 'bamboo', 'cute'], { kind: 'animal_panda', primary: '#F8FAFC', secondary: '#E2E8F0', accent: '#1E293B' }, ['Wave']),
  living('ani_grizzly', 'Forest Bear', 'animals', ['bear', 'woods', 'brown'], { kind: 'animal_bear', primary: '#92400E', secondary: '#FDE68A', accent: '#78350F' }, ['Stand']),
  living('ani_polar_bear', 'Polar Bear', 'animals', ['bear', 'ice', 'snow'], { kind: 'animal_bear', primary: '#F1F5F9', secondary: '#FFFFFF', accent: '#CBD5E1' }, ['Stand']),
  living('ani_lion', 'Savanna Lion', 'animals', ['cat', 'king', 'safari'], { kind: 'animal_lion', primary: '#F59E0B', secondary: '#FEF3C7', accent: '#B45309' }, ['Roar']),
  living('ani_tiger', 'Bengal Tiger', 'animals', ['cat', 'stripes', 'jungle'], { kind: 'animal_tiger', primary: '#F97316', secondary: '#FFFBEB', accent: '#0F172A' }, ['Prowl']),
  living('ani_shark', 'Great White Shark', 'animals', ['ocean', 'fish', 'sea'], { kind: 'animal_shark', primary: '#64748B', secondary: '#F8FAFC', accent: '#38BDF8' }, ['Swim 1', 'Swim 2']),
  living('ani_octopus', 'Coral Octopus', 'animals', ['ocean', 'sea', 'tentacles'], { kind: 'animal_octopus', primary: '#A855F7', secondary: '#C084FC', accent: '#F472B6' }, ['Float']),
  living('ani_whale', 'Blue Whale', 'animals', ['ocean', 'sea', 'big'], { kind: 'animal_whale', primary: '#0284C7', secondary: '#E0F2FE', accent: '#38BDF8' }, ['Swim 1', 'Spout']),
  living('ani_butterfly', 'Monarch Butterfly', 'animals', ['bug', 'insect', 'wings'], { kind: 'animal_butterfly', primary: '#F97316', secondary: '#FACC15', accent: '#FFFBEB' }, ['Open', 'Flap']),
  living('ani_azure_butterfly', 'Morpho Butterfly', 'animals', ['bug', 'blue', 'wings'], { kind: 'animal_butterfly', primary: '#38BDF8', secondary: '#818CF8', accent: '#E0F2FE' }, ['Open', 'Flap']),
  living('ani_honey_bee', 'Honey Bee', 'animals', ['bug', 'bee', 'honey', 'fly'], { kind: 'animal_bee', primary: '#E0F2FE', secondary: '#BAE6FD', accent: '#FACC15' }, ['Fly 1', 'Fly 2']),
  living('ani_ladybug', 'Spotted Ladybug', 'animals', ['bug', 'beetle', 'red'], { kind: 'animal_ladybug', primary: '#EF4444', secondary: '#FCA5A5', accent: '#0F172A' }, ['Crawl']),
  living('ani_dragon', 'Emerald Dragon', 'animals', ['fantasy', 'wings', 'fire'], { kind: 'animal_dragon', primary: '#10B981', secondary: '#34D399', accent: '#FACC15' }, ['Perch', 'Fly']),
  living('ani_unicorn', 'Starlight Unicorn', 'animals', ['fantasy', 'horse', 'magic'], { kind: 'animal_unicorn', primary: '#F8FAFC', secondary: '#FCE7F3', accent: '#F472B6' }, ['Stand']),
  living('ani_phoenix', 'Solar Phoenix', 'animals', ['bird', 'fire', 'fantasy'], { kind: 'animal_phoenix', primary: '#EF4444', secondary: '#F97316', accent: '#FACC15' }, ['Glide', 'Soar'], { glowLightColor: '#F97316' }),
  living('ani_trex', 'T-Rex Dino', 'animals', ['dinosaur', 'jurassic', 'green'], { kind: 'animal_trex', primary: '#16A34A', secondary: '#BBF7D0', accent: '#FACC15' }, ['Stomp']),
  living('ani_triceratops', 'Triceratops', 'animals', ['dinosaur', 'horns', 'blue'], { kind: 'animal_triceratops', primary: '#0EA5E9', secondary: '#BAE6FD', accent: '#FEF3C7' }, ['Stand']),
  living('ani_bat', 'Midnight Bat', 'animals', ['night', 'spooky', 'wings'], { kind: 'animal_bat', primary: '#6D28D9', secondary: '#4C1D95', accent: '#F43F5E' }, ['Flap 1', 'Flap 2']),
  living('ani_duck', 'Pond Duckling', 'animals', ['bird', 'duck', 'yellow'], { kind: 'animal_duck', primary: '#FACC15', secondary: '#FEF08A', accent: '#F97316' }, ['Waddle']),
  living('ani_crab', 'Beach Crab', 'animals', ['ocean', 'beach', 'claws'], { kind: 'animal_crab', primary: '#EF4444', secondary: '#FCA5A5', accent: '#F97316' }, ['Snip 1', 'Snip 2']),
  living('ani_turtle', 'Sea Turtle', 'animals', ['ocean', 'shell', 'green'], { kind: 'animal_turtle', primary: '#15803D', secondary: '#86EFAC', accent: '#FACC15' }, ['Crawl']),
  living('ani_jellyfish', 'Neon Jellyfish', 'animals', ['ocean', 'glow', 'sea'], { kind: 'animal_jellyfish', primary: '#EC4899', secondary: '#F9A8D4', accent: '#38BDF8' }, ['Pulse 1', 'Pulse 2'], { glowLightColor: '#EC4899' }),
  living('ani_snail', 'Garden Snail', 'animals', ['bug', 'shell', 'slow'], { kind: 'animal_snail', primary: '#D97706', secondary: '#FDE68A', accent: '#FEF3C7' }, ['Slide']),
  living('ani_monkey', 'Jungle Monkey', 'animals', ['jungle', 'ape', 'brown'], { kind: 'animal_monkey', primary: '#92400E', secondary: '#FDE68A', accent: '#78350F' }, ['Grin']),
];

// =========================================================================
// 3. MONSTERS & ENEMIES (20 sprites)
// =========================================================================
const MONSTER_ASSETS: SpriteAssetDef[] = [
  living('mon_toxic_slime', 'Toxic Slime', 'monsters', ['enemy', 'slime', 'green'], { kind: 'monster_slime', primary: '#22C55E', secondary: '#15803D', accent: '#A3E635' }, ['Squish', 'Jump'], { width: 48, height: 48 }),
  living('mon_lava_slime', 'Magma Slime', 'monsters', ['enemy', 'fire', 'slime'], { kind: 'monster_slime', primary: '#EF4444', secondary: '#991B1B', accent: '#FACC15' }, ['Squish', 'Jump'], { width: 48, height: 48, glowLightColor: '#F97316' }),
  living('mon_ghost', 'Shadow Ghost', 'monsters', ['spooky', 'halloween', 'spirit'], { kind: 'monster_ghost', primary: '#E2E8F0', secondary: '#94A3B8', accent: '#38BDF8' }, ['Float', 'Boo']),
  living('mon_skull', 'Cursed Skull', 'monsters', ['skeleton', 'undead', 'spooky'], { kind: 'monster_skull', primary: '#F1F5F9', secondary: '#CBD5E1', accent: '#EF4444' }, ['Idle', 'Chatter']),
  living('mon_goblin', 'Goblin Scout', 'monsters', ['goblin', 'rpg', 'enemy'], { kind: 'monster_goblin', primary: '#4ADE80', secondary: '#78350F', accent: '#EF4444' }, ['Stance']),
  living('mon_imp', 'Crimson Imp', 'monsters', ['demon', 'horns', 'fire'], { kind: 'monster_imp', primary: '#E11D48', secondary: '#4C0519', accent: '#FACC15' }, ['Ready']),
  living('mon_cyclops', 'Cyclops Brute', 'monsters', ['giant', 'one-eye', 'boss'], { kind: 'monster_cyclops', primary: '#8B5CF6', secondary: '#5B21B6', accent: '#F43F5E' }, ['Stomp'], { width: 64, height: 64 }),
  living('mon_mimic', 'Mimic Chest', 'monsters', ['chest', 'trap', 'rpg'], { kind: 'monster_mimic', primary: '#92400E', secondary: '#B45309', accent: '#FACC15' }, ['Disguise', 'Bite']),
  living('mon_golem', 'Stone Golem', 'monsters', ['rock', 'boss', 'heavy'], { kind: 'monster_golem', primary: '#64748B', secondary: '#334155', accent: '#38BDF8' }, ['Guard'], { width: 64, height: 64 }),
  living('mon_vampire', 'Vampire Count', 'monsters', ['dracula', 'spooky', 'fangs'], { kind: 'monster_vampire', primary: '#0F172A', secondary: '#991B1B', accent: '#F43F5E' }, ['Hover']),
  living('mon_spider', 'Mech Spider', 'monsters', ['spider', 'robot', 'enemy'], { kind: 'monster_spider', primary: '#334155', secondary: '#0F172A', accent: '#EF4444' }, ['Crawl']),
  living('mon_bombbot', 'Bomb Bot', 'monsters', ['bomb', 'explode', 'robot'], { kind: 'monster_bombbot', primary: '#1E293B', secondary: '#0F172A', accent: '#EF4444' }, ['Tick', 'Flash'], { colliderShape: 'circle' }),
  living('mon_beetle', 'Spike Beetle', 'monsters', ['bug', 'armor', 'enemy'], { kind: 'monster_beetle', primary: '#6366F1', secondary: '#312E81', accent: '#FACC15' }, ['Scuttle']),
  living('mon_gargoyle', 'Stone Gargoyle', 'monsters', ['wings', 'statue', 'castle'], { kind: 'monster_gargoyle', primary: '#475569', secondary: '#334155', accent: '#F59E0B' }, ['Glide', 'Swoop']),
  living('mon_eyeball', 'Laser Eyeball', 'monsters', ['eye', 'floating', 'boss'], { kind: 'monster_eyeball', primary: '#F8FAFC', secondary: '#CBD5E1', accent: '#EF4444' }, ['Watch', 'Hover'], { colliderShape: 'circle' }),
  living('mon_darkknight', 'Dark Knight', 'monsters', ['boss', 'armor', 'villain'], { kind: 'monster_darkknight', primary: '#334155', secondary: '#7F1D1D', accent: '#F43F5E' }, ['Guard', 'Slash']),
  living('mon_yeti', 'Frost Yeti', 'monsters', ['ice', 'snow', 'monster'], { kind: 'monster_yeti', primary: '#E0F2FE', secondary: '#7DD3FC', accent: '#0284C7' }, ['Stomp'], { width: 62, height: 62 }),
  living('mon_void_horror', 'Void Tentacle', 'monsters', ['cosmic', 'alien', 'purple'], { kind: 'monster_tentacle', primary: '#7C3AED', secondary: '#4C1D95', accent: '#22D3EE' }, ['Float 1', 'Float 2']),
  living('mon_zombie', 'Cartoon Zombie', 'monsters', ['undead', 'halloween', 'green'], { kind: 'monster_zombie', primary: '#84CC16', secondary: '#4D7C0F', accent: '#EF4444' }, ['Shamble']),
  living('mon_bossdragon', 'Inferno Boss Dragon', 'monsters', ['dragon', 'boss', 'fire'], { kind: 'monster_bossdragon', primary: '#DC2626', secondary: '#7F1D1D', accent: '#FACC15' }, ['Idle', 'Roar'], { width: 72, height: 72, glowLightColor: '#EF4444' }),
];

// =========================================================================
// 4. SPACE & SCI-FI (20 sprites)
// =========================================================================
const SPACE_ASSETS: SpriteAssetDef[] = [
  world('spc_rocket', 'Star Rocket', 'space', ['ship', 'launch', 'nasa'], { kind: 'space_rocket', primary: '#F8FAFC', secondary: '#94A3B8', accent: '#EF4444' }, ['Idle', 'Launch'], { width: 52, height: 64 }),
  world('spc_fighter', 'Cyber Starfighter', 'space', ['ship', 'shooter', 'jet'], { kind: 'space_fighter', primary: '#38BDF8', secondary: '#1E293B', accent: '#FACC15' }, ['Cruise', 'Boost']),
  world('spc_crimson_jet', 'Crimson Viper Jet', 'space', ['ship', 'fighter', 'red'], { kind: 'space_fighter', primary: '#EF4444', secondary: '#1E293B', accent: '#38BDF8' }, ['Cruise', 'Boost']),
  world('spc_cruiser', 'Galactic Cruiser', 'space', ['mothership', 'heavy', 'ship'], { kind: 'space_cruiser', primary: '#475569', secondary: '#0EA5E9', accent: '#FACC15' }, ['Fleet'], { width: 64, height: 64 }),
  world('spc_ufo', 'Alien UFO Saucer', 'space', ['ufo', 'alien', 'spaceship'], { kind: 'space_ufo', primary: '#94A3B8', secondary: '#475569', accent: '#22C55E' }, ['Hover', 'Abduct']),
  world('spc_satellite', 'Orbit Satellite', 'space', ['solar', 'orbit', 'tech'], { kind: 'space_satellite', primary: '#E2E8F0', secondary: '#334155', accent: '#FACC15' }, ['Orbit']),
  world('spc_station', 'Orbital Ring Station', 'space', ['station', 'base', 'sci-fi'], { kind: 'space_station', primary: '#CBD5E1', secondary: '#475569', accent: '#38BDF8' }, ['Spin'], { width: 64, height: 64 }),
  world('spc_asteroid', 'Craggy Asteroid', 'space', ['rock', 'obstacle', 'meteor'], { kind: 'space_asteroid', primary: '#64748B', secondary: '#475569', accent: '#94A3B8' }, ['Drift'], { colliderShape: 'circle' }),
  world('spc_meteor', 'Blazing Meteor', 'space', ['fire', 'comet', 'hazard'], { kind: 'space_meteor', primary: '#78716C', secondary: '#F97316', accent: '#FACC15' }, ['Fall'], { colliderShape: 'circle', glowLightColor: '#F97316' }),
  world('spc_earth', 'Planet Earth', 'space', ['planet', 'globe', 'world'], { kind: 'space_earth', primary: '#0284C7', secondary: '#22C55E', accent: '#FFFFFF' }, ['Globe'], { width: 60, height: 60, colliderShape: 'circle' }),
  world('spc_saturn', 'Ringed Saturn', 'space', ['planet', 'rings', 'cosmos'], { kind: 'space_saturn', primary: '#F59E0B', secondary: '#FEF3C7', accent: '#FDE68A' }, ['Globe'], { width: 68, height: 68, colliderShape: 'circle' }),
  world('spc_mars', 'Red Mars', 'space', ['planet', 'red', 'desert'], { kind: 'space_mars', primary: '#EA580C', secondary: '#9A3412', accent: '#FDBA74' }, ['Globe'], { width: 58, height: 58, colliderShape: 'circle' }),
  world('spc_neptune', 'Ice Neptune', 'space', ['planet', 'blue', 'ice'], { kind: 'space_neptune', primary: '#06B6D4', secondary: '#0E7490', accent: '#A5F3FC' }, ['Globe'], { width: 58, height: 58, colliderShape: 'circle' }),
  world('spc_blackhole', 'Black Hole Vortex', 'space', ['gravity', 'portal', 'cosmos'], { kind: 'space_blackhole', primary: '#0F172A', secondary: '#7C3AED', accent: '#F97316' }, ['Pulse 1', 'Pulse 2'], { colliderShape: 'circle' }),
  world('spc_portal', 'Warp Portal Gate', 'space', ['teleport', 'gate', 'sci-fi'], { kind: 'space_portal', primary: '#06B6D4', secondary: '#0284C7', accent: '#7DD3FC' }, ['Swirl 1', 'Swirl 2'], { colliderShape: 'circle', glowLightColor: '#22D3EE' }),
  world('spc_turret', 'Laser Turret', 'space', ['cannon', 'defense', 'sci-fi'], { kind: 'space_turret', primary: '#64748B', secondary: '#334155', accent: '#38BDF8' }, ['Aim']),
  world('spc_mech', 'Titan Mech Walker', 'space', ['robot', 'mech', 'armor'], { kind: 'space_mech', primary: '#475569', secondary: '#1E293B', accent: '#F97316' }, ['Walk'], { width: 62, height: 62 }),
  world('spc_hoverbike', 'Neon Hover Bike', 'space', ['speeder', 'vehicle', 'cyber'], { kind: 'space_hoverbike', primary: '#EC4899', secondary: '#1E293B', accent: '#22D3EE' }, ['Hover']),
  world('spc_plasma', 'Plasma Reactor Core', 'space', ['energy', 'orb', 'glow'], { kind: 'space_plasma', primary: '#22D3EE', secondary: '#0EA5E9', accent: '#FFFFFF' }, ['Core'], { width: 40, height: 40, colliderShape: 'circle', glowLightColor: '#22D3EE', blendMode: 'add' }),
  world('spc_raygun', 'Retro Raygun', 'space', ['weapon', 'blaster', 'laser'], { kind: 'space_raygun', primary: '#EF4444', secondary: '#94A3B8', accent: '#38BDF8' }, ['Ready']),
];

// =========================================================================
// 5. PLATFORMS, TILES & BUILDINGS (22 sprites — Solid Static Physics ready!)
// =========================================================================
const PLATFORM_ASSETS: SpriteAssetDef[] = [
  world('plt_grass', 'Grass Turf Platform', 'platforms', ['ground', 'floor', 'grass', 'solid'], { kind: 'plat_grass', primary: '#22C55E', secondary: '#78350F', accent: '#86EFAC' }, ['Turf'], { width: 144, height: 36, solidPlatform: true }),
  world('plt_brick', 'Terracotta Brick Tile', 'platforms', ['wall', 'mario', 'bricks', 'solid'], { kind: 'plat_brick', primary: '#B45309', secondary: '#451A03', accent: '#F59E0B' }, ['Brick'], { width: 96, height: 48, solidPlatform: true }),
  world('plt_stone', 'Dungeon Stone Block', 'platforms', ['wall', 'stone', 'castle', 'solid'], { kind: 'plat_stone', primary: '#64748B', secondary: '#475569', accent: '#94A3B8' }, ['Stone'], { width: 96, height: 48, solidPlatform: true }),
  world('plt_neon_blue', 'Cyber Neon Platform', 'platforms', ['ledge', 'sci-fi', 'cyan', 'solid'], { kind: 'plat_neon', primary: '#38BDF8', secondary: '#0F172A', accent: '#7DD3FC' }, ['Deck'], { width: 144, height: 32, solidPlatform: true }),
  world('plt_neon_green', 'Emerald Laser Ledge', 'platforms', ['ledge', 'sci-fi', 'green', 'solid'], { kind: 'plat_neon', primary: '#34D399', secondary: '#0F172A', accent: '#A7F3D0' }, ['Deck'], { width: 144, height: 32, solidPlatform: true }),
  world('plt_neon_pink', 'Synthwave Pink Ledge', 'platforms', ['ledge', 'retro', 'pink', 'solid'], { kind: 'plat_neon', primary: '#F472B6', secondary: '#0F172A', accent: '#FBCFE8' }, ['Deck'], { width: 144, height: 32, solidPlatform: true }),
  world('plt_ice', 'Slippery Ice Block', 'platforms', ['snow', 'frozen', 'ledge', 'solid'], { kind: 'plat_ice', primary: '#7DD3FC', secondary: '#0284C7', accent: '#FFFFFF' }, ['Ice'], { width: 144, height: 32, solidPlatform: true }),
  world('plt_lava', 'Molten Magma Tile', 'platforms', ['fire', 'hazard', 'floor', 'solid'], { kind: 'plat_lava', primary: '#F97316', secondary: '#7C2D12', accent: '#FACC15' }, ['Magma'], { width: 144, height: 36, solidPlatform: true, glowLightColor: '#F97316' }),
  world('plt_woodcrate', 'Timber Wood Crate', 'platforms', ['box', 'crate', 'solid'], { kind: 'plat_woodcrate', primary: '#B45309', secondary: '#D97706', accent: '#FDE68A' }, ['Crate'], { width: 52, height: 52, solidPlatform: true }),
  world('plt_metalcrate', 'Steel Hazard Crate', 'platforms', ['box', 'metal', 'solid'], { kind: 'plat_metalcrate', primary: '#64748B', secondary: '#475569', accent: '#F59E0B' }, ['Crate'], { width: 52, height: 52, solidPlatform: true }),
  world('plt_question', 'Mystery ? Block', 'platforms', ['arcade', 'bonus', 'box', 'solid'], { kind: 'plat_question', primary: '#F59E0B', secondary: '#B45309', accent: '#FEF08A' }, ['Block'], { width: 48, height: 48, solidPlatform: true }),
  world('plt_spikes', 'Steel Floor Spikes', 'platforms', ['trap', 'hazard', 'danger'], { kind: 'plat_spikes', primary: '#CBD5E1', secondary: '#334155', accent: '#F8FAFC' }, ['Spikes'], { width: 128, height: 36, solidPlatform: true }),
  world('plt_spring', 'Jump Spring Pad', 'platforms', ['bounce', 'pad', 'trampoline'], { kind: 'plat_spring', primary: '#EF4444', secondary: '#94A3B8', accent: '#FACC15' }, ['Compressed', 'Boing'], { width: 56, height: 56, solidPlatform: true }),
  world('plt_ladder', 'Climbable Ladder', 'platforms', ['climb', 'wood', 'tile'], { kind: 'plat_ladder', primary: '#92400E', secondary: '#D97706', accent: '#FDE68A' }, ['Ladder'], { width: 40, height: 112 }),
  world('plt_bridge', 'Stone Arch Bridge', 'platforms', ['bridge', 'walkway', 'solid'], { kind: 'plat_bridge', primary: '#94A3B8', secondary: '#475569', accent: '#CBD5E1' }, ['Bridge'], { width: 144, height: 40, solidPlatform: true }),
  world('plt_castle', 'Castle Turret', 'platforms', ['building', 'medieval', 'tower'], { kind: 'plat_castle', primary: '#94A3B8', secondary: '#78350F', accent: '#EF4444' }, ['Tower'], { width: 72, height: 72 }),
  world('plt_house', 'Cozy Cottage', 'platforms', ['building', 'home', 'village'], { kind: 'plat_house', primary: '#EF4444', secondary: '#FEF3C7', accent: '#78350F' }, ['Home'], { width: 72, height: 72 }),
  world('plt_skyscraper', 'Cyber Skyscraper', 'platforms', ['building', 'city', 'tower'], { kind: 'plat_skyscraper', primary: '#1E293B', secondary: '#0F172A', accent: '#38BDF8' }, ['Tower'], { width: 68, height: 84 }),
  world('plt_flag', 'Checkpoint Flag', 'platforms', ['goal', 'finish', 'checkpoint'], { kind: 'plat_flag', primary: '#EF4444', secondary: '#10B981', accent: '#FFFFFF' }, ['Raised', 'Lowered'], { width: 56, height: 64 }),
  world('plt_arch', 'Rune Portal Arch', 'platforms', ['gate', 'door', 'fantasy'], { kind: 'plat_arch', primary: '#64748B', secondary: '#334155', accent: '#38BDF8' }, ['Gate'], { width: 68, height: 72 }),
  world('plt_pipe', 'Emerald Warp Pipe', 'platforms', ['pipe', 'green', 'platformer', 'solid'], { kind: 'plat_pipe', primary: '#16A34A', secondary: '#15803D', accent: '#86EFAC' }, ['Pipe'], { width: 60, height: 64, solidPlatform: true }),
  world('plt_cloud', 'Walkable Sky Cloud', 'platforms', ['sky', 'cloud', 'platform', 'solid'], { kind: 'plat_cloud', primary: '#FFFFFF', secondary: '#E2E8F0', accent: '#94A3B8' }, ['Cloud'], { width: 144, height: 48, solidPlatform: true }),
];

// =========================================================================
// 6. COLLECTIBLES, WEAPONS & ITEMS (26 sprites)
// =========================================================================
const ITEM_ASSETS: SpriteAssetDef[] = [
  world('itm_gold_coin', 'Gold Coin', 'items', ['money', 'collectible', 'score'], { kind: 'item_coin', primary: '#FACC15', secondary: '#F59E0B', accent: '#FEF08A' }, ['Front', 'Turn'], { width: 40, height: 40, colliderShape: 'circle' }),
  world('itm_silver_coin', 'Silver Coin', 'items', ['money', 'collectible', 'silver'], { kind: 'item_coin', primary: '#E2E8F0', secondary: '#94A3B8', accent: '#FFFFFF' }, ['Front', 'Turn'], { width: 40, height: 40, colliderShape: 'circle' }),
  world('itm_diamond', 'Sky Diamond', 'items', ['gem', 'jewel', 'treasure'], { kind: 'item_gem', primary: '#38BDF8', secondary: '#0284C7', accent: '#E0F2FE' }, ['Gem'], { width: 42, height: 42 }),
  world('itm_ruby', 'Crimson Ruby', 'items', ['gem', 'jewel', 'red'], { kind: 'item_gem', primary: '#F43F5E', secondary: '#BE123C', accent: '#FFE4E6' }, ['Gem'], { width: 42, height: 42 }),
  world('itm_emerald', 'Forest Emerald', 'items', ['gem', 'jewel', 'green'], { kind: 'item_gem', primary: '#10B981', secondary: '#047857', accent: '#D1FAE5' }, ['Gem'], { width: 42, height: 42 }),
  world('itm_gold_key', 'Golden Key', 'items', ['key', 'unlock', 'treasure'], { kind: 'item_key', primary: '#FACC15', secondary: '#B45309', accent: '#FEF08A' }, ['Key'], { width: 48, height: 48 }),
  world('itm_silver_key', 'Dungeon Key', 'items', ['key', 'silver', 'door'], { kind: 'item_key', primary: '#CBD5E1', secondary: '#64748B', accent: '#FFFFFF' }, ['Key'], { width: 48, height: 48 }),
  world('itm_chest', 'Treasure Chest', 'items', ['loot', 'box', 'gold'], { kind: 'item_chest', primary: '#92400E', secondary: '#B45309', accent: '#FACC15' }, ['Closed'], { width: 54, height: 54 }),
  world('itm_heart', 'Life Heart', 'items', ['hp', 'health', 'love'], { kind: 'item_heart', primary: '#EF4444', secondary: '#B91C1C', accent: '#FFFFFF' }, ['Heart'], { width: 42, height: 42 }),
  world('itm_star', 'Golden Star', 'items', ['star', 'powerup', 'bonus'], { kind: 'item_star', primary: '#FACC15', secondary: '#F59E0B', accent: '#FFFFFF' }, ['Star'], { width: 44, height: 44, glowLightColor: '#FACC15' }),
  world('itm_hp_potion', 'Health Potion', 'items', ['flask', 'heal', 'red'], { kind: 'item_potion', primary: '#EF4444', secondary: '#991B1B', accent: '#FCA5A5' }, ['Flask'], { width: 44, height: 44 }),
  world('itm_mana_potion', 'Mana Potion', 'items', ['flask', 'magic', 'blue'], { kind: 'item_potion', primary: '#3B82F6', secondary: '#1D4ED8', accent: '#93C5FD' }, ['Flask'], { width: 44, height: 44 }),
  world('itm_crown', 'Royal Gold Crown', 'items', ['king', 'winner', 'hat'], { kind: 'item_crown', primary: '#FACC15', secondary: '#D97706', accent: '#EF4444' }, ['Crown'], { width: 48, height: 48 }),
  world('itm_trophy', 'Champion Trophy', 'items', ['cup', 'winner', 'award'], { kind: 'item_trophy', primary: '#FACC15', secondary: '#D97706', accent: '#FEF08A' }, ['Cup'], { width: 48, height: 48 }),
  world('itm_sword', 'Hero Broadsword', 'items', ['weapon', 'blade', 'knight'], { kind: 'item_sword', primary: '#CBD5E1', secondary: '#FACC15', accent: '#FFFFFF' }, ['Sword'], { width: 52, height: 52 }),
  world('itm_lasersword', 'Plasma Saber', 'items', ['weapon', 'laser', 'sci-fi'], { kind: 'item_lasersword', primary: '#22D3EE', secondary: '#334155', accent: '#38BDF8' }, ['Saber'], { width: 52, height: 52, glowLightColor: '#22D3EE' }),
  world('itm_shield', 'Crest Kite Shield', 'items', ['defense', 'armor', 'knight'], { kind: 'item_shield', primary: '#2563EB', secondary: '#1E3A8A', accent: '#FACC15' }, ['Shield'], { width: 48, height: 48 }),
  world('itm_bow', 'Ranger Bow', 'items', ['weapon', 'arrow', 'archer'], { kind: 'item_bow', primary: '#92400E', secondary: '#78350F', accent: '#CBD5E1' }, ['Bow'], { width: 52, height: 52 }),
  world('itm_wand', 'Starlight Wand', 'items', ['magic', 'fairy', 'spell'], { kind: 'item_wand', primary: '#FACC15', secondary: '#F472B6', accent: '#FFFFFF' }, ['Wand'], { width: 50, height: 50 }),
  world('itm_bomb', 'Fuse Bomb', 'items', ['explode', 'weapon', 'hazard'], { kind: 'item_bomb', primary: '#1E293B', secondary: '#0F172A', accent: '#F97316' }, ['Bomb'], { width: 46, height: 46, colliderShape: 'circle' }),
  world('itm_magnet', 'Power Magnet', 'items', ['pull', 'collect', 'powerup'], { kind: 'item_magnet', primary: '#EF4444', secondary: '#E2E8F0', accent: '#38BDF8' }, ['Magnet'], { width: 46, height: 46 }),
  world('itm_hourglass', 'Time Hourglass', 'items', ['timer', 'clock', 'sand'], { kind: 'item_hourglass', primary: '#F59E0B', secondary: '#78350F', accent: '#FEF3C7' }, ['Timer'], { width: 46, height: 46 }),
  world('itm_compass', 'Explorer Compass', 'items', ['map', 'north', 'direction'], { kind: 'item_compass', primary: '#F59E0B', secondary: '#B45309', accent: '#1E293B' }, ['Compass'], { width: 46, height: 46, colliderShape: 'circle' }),
  world('itm_lantern', 'Dungeon Lantern', 'items', ['light', 'lamp', 'glow'], { kind: 'item_lantern', primary: '#F59E0B', secondary: '#334155', accent: '#FEF08A' }, ['Lit'], { width: 46, height: 46, glowLightColor: '#F59E0B' }),
  world('itm_scroll', 'Ancient Scroll', 'items', ['quest', 'spell', 'paper'], { kind: 'item_scroll', primary: '#FEF3C7', secondary: '#D97706', accent: '#78350F' }, ['Scroll'], { width: 48, height: 48 }),
  world('itm_jetpack', 'Rocket Jetpack', 'items', ['fly', 'boost', 'gear'], { kind: 'item_jetpack', primary: '#94A3B8', secondary: '#334155', accent: '#F97316' }, ['Pack'], { width: 48, height: 48 }),
];

// =========================================================================
// 7. FOOD & NATURE (28 sprites)
// =========================================================================
const FOOD_NATURE_ASSETS: SpriteAssetDef[] = [
  world('fod_apple', 'Crisp Red Apple', 'food_nature', ['fruit', 'food', 'healthy'], { kind: 'food_apple', primary: '#EF4444', secondary: '#16A34A', accent: '#FFFFFF' }, ['Apple'], { width: 44, height: 44 }),
  world('fod_banana', 'Ripe Banana', 'food_nature', ['fruit', 'yellow', 'food'], { kind: 'food_banana', primary: '#FACC15', secondary: '#CA8A04', accent: '#FEF08A' }, ['Banana'], { width: 46, height: 46 }),
  world('fod_cherries', 'Twin Cherries', 'food_nature', ['fruit', 'red', 'pacman'], { kind: 'food_cherries', primary: '#DC2626', secondary: '#16A34A', accent: '#FFFFFF' }, ['Cherries'], { width: 46, height: 46 }),
  world('fod_strawberry', 'Fresh Strawberry', 'food_nature', ['fruit', 'berry', 'pink'], { kind: 'food_strawberry', primary: '#F43F5E', secondary: '#22C55E', accent: '#FEF08A' }, ['Berry'], { width: 44, height: 44 }),
  world('fod_watermelon', 'Watermelon Slice', 'food_nature', ['fruit', 'summer', 'food'], { kind: 'food_watermelon', primary: '#FB7185', secondary: '#22C55E', accent: '#0F172A' }, ['Slice'], { width: 48, height: 48 }),
  world('fod_pizza', 'Pepperoni Pizza', 'food_nature', ['pizza', 'cheese', 'food'], { kind: 'food_pizza', primary: '#FACC15', secondary: '#D97706', accent: '#EF4444' }, ['Slice'], { width: 48, height: 48 }),
  world('fod_burger', 'Cheeseburger', 'food_nature', ['burger', 'fast food', 'meal'], { kind: 'food_burger', primary: '#F59E0B', secondary: '#78350F', accent: '#22C55E' }, ['Burger'], { width: 48, height: 48 }),
  world('fod_taco', 'Crispy Taco', 'food_nature', ['taco', 'food', 'scratch'], { kind: 'food_taco', primary: '#FACC15', secondary: '#EF4444', accent: '#22C55E' }, ['Taco'], { width: 48, height: 48 }),
  world('fod_donut', 'Sprinkle Donut', 'food_nature', ['sweet', 'dessert', 'pink'], { kind: 'food_donut', primary: '#F472B6', secondary: '#F59E0B', accent: '#38BDF8' }, ['Donut'], { width: 46, height: 46, colliderShape: 'circle' }),
  world('fod_cupcake', 'Berry Cupcake', 'food_nature', ['cake', 'sweet', 'dessert'], { kind: 'food_cupcake', primary: '#F472B6', secondary: '#A855F7', accent: '#FEF3C7' }, ['Cupcake'], { width: 46, height: 46 }),
  world('fod_icecream', 'Double Ice Cream', 'food_nature', ['cone', 'dessert', 'summer'], { kind: 'food_icecream', primary: '#38BDF8', secondary: '#F472B6', accent: '#FEF3C7' }, ['Cone'], { width: 46, height: 46 }),
  world('fod_mug', 'Hot Cocoa Mug', 'food_nature', ['coffee', 'tea', 'drink'], { kind: 'food_mug', primary: '#38BDF8', secondary: '#0284C7', accent: '#FFFFFF' }, ['Mug'], { width: 46, height: 46 }),
  world('nat_oak', 'Oak Tree', 'food_nature', ['tree', 'forest', 'nature', 'green'], { kind: 'nature_oak', primary: '#22C55E', secondary: '#16A34A', accent: '#78350F' }, ['Tree'], { width: 68, height: 72 }),
  world('nat_pine', 'Evergreen Pine', 'food_nature', ['tree', 'woods', 'snow'], { kind: 'nature_pine', primary: '#10B981', secondary: '#059669', accent: '#78350F' }, ['Pine'], { width: 64, height: 72 }),
  world('nat_palm', 'Tropical Palm Tree', 'food_nature', ['beach', 'island', 'tree'], { kind: 'nature_palm', primary: '#22C55E', secondary: '#16A34A', accent: '#78350F' }, ['Palm'], { width: 68, height: 72 }),
  world('nat_cactus', 'Desert Cactus', 'food_nature', ['plant', 'desert', 'spikes'], { kind: 'nature_cactus', primary: '#16A34A', secondary: '#15803D', accent: '#F43F5E' }, ['Cactus'], { width: 56, height: 64 }),
  world('nat_mushroom', 'Red Toadstool', 'food_nature', ['fungi', 'forest', 'mario'], { kind: 'nature_mushroom', primary: '#EF4444', secondary: '#FEF3C7', accent: '#FFFFFF' }, ['Mushroom'], { width: 46, height: 46 }),
  world('nat_sun', 'Radiant Sun', 'food_nature', ['weather', 'day', 'light'], { kind: 'nature_sun', primary: '#FACC15', secondary: '#F59E0B', accent: '#FDE047' }, ['Sun'], { width: 56, height: 56, colliderShape: 'circle', glowLightColor: '#FACC15' }),
  world('nat_moon', 'Crescent Moon', 'food_nature', ['night', 'sky', 'lunar'], { kind: 'nature_moon', primary: '#FEF08A', secondary: '#FACC15', accent: '#FFFFFF' }, ['Moon'], { width: 50, height: 50 }),
  world('nat_cloud', 'Fluffy Cloud', 'food_nature', ['sky', 'weather', 'white'], { kind: 'nature_cloud', primary: '#FFFFFF', secondary: '#E2E8F0', accent: '#CBD5E1' }, ['Cloud'], { width: 64, height: 48 }),
  world('nat_rainbow', 'Sky Rainbow', 'food_nature', ['sky', 'color', 'weather'], { kind: 'nature_rainbow', primary: '#EF4444', secondary: '#38BDF8', accent: '#FACC15' }, ['Arc'], { width: 64, height: 48 }),
  world('nat_lightning', 'Lightning Bolt', 'food_nature', ['storm', 'electric', 'energy'], { kind: 'nature_lightning', primary: '#FACC15', secondary: '#F59E0B', accent: '#FFFFFF' }, ['Bolt'], { width: 48, height: 54, glowLightColor: '#FACC15' }),
  world('nat_snowflake', 'Ice Snowflake', 'food_nature', ['winter', 'snow', 'cold'], { kind: 'nature_snowflake', primary: '#7DD3FC', secondary: '#38BDF8', accent: '#FFFFFF' }, ['Flake'], { width: 46, height: 46 }),
  world('nat_flame', 'Campfire Flame', 'food_nature', ['fire', 'torch', 'heat'], { kind: 'nature_flame', primary: '#F97316', secondary: '#EF4444', accent: '#FACC15' }, ['Flicker 1', 'Flicker 2'], { width: 46, height: 52, glowLightColor: '#F97316' }),
  world('nat_pink_flower', 'Blossom Flower', 'food_nature', ['plant', 'garden', 'spring'], { kind: 'nature_flower', primary: '#F472B6', secondary: '#EC4899', accent: '#FACC15' }, ['Bloom'], { width: 44, height: 44 }),
  world('nat_blue_flower', 'Sky Daisy', 'food_nature', ['plant', 'garden', 'blue'], { kind: 'nature_flower', primary: '#38BDF8', secondary: '#0EA5E9', accent: '#FEF08A' }, ['Bloom'], { width: 44, height: 44 }),
  world('nat_bush', 'Garden Bush', 'food_nature', ['shrub', 'forest', 'green'], { kind: 'nature_bush', primary: '#16A34A', secondary: '#15803D', accent: '#4ADE80' }, ['Bush'], { width: 60, height: 48 }),
  world('nat_rock', 'Mossy Boulder', 'food_nature', ['stone', 'rock', 'obstacle'], { kind: 'nature_rock', primary: '#64748B', secondary: '#475569', accent: '#94A3B8' }, ['Rock'], { width: 54, height: 48 }),
];

// =========================================================================
// 8. VEHICLES & SPORTS (20 sprites)
// =========================================================================
const VEHICLE_SPORTS_ASSETS: SpriteAssetDef[] = [
  world('veh_red_car', 'Turbo Race Car', 'vehicles_sports', ['car', 'racing', 'red'], { kind: 'veh_racecar', primary: '#EF4444', secondary: '#1E293B', accent: '#FACC15' }, ['Drive'], { width: 64, height: 52 }),
  world('veh_blue_car', 'Cyan Rally Car', 'vehicles_sports', ['car', 'racing', 'blue'], { kind: 'veh_racecar', primary: '#0EA5E9', secondary: '#1E293B', accent: '#FFFFFF' }, ['Drive'], { width: 64, height: 52 }),
  world('veh_police', 'Police Cruiser', 'vehicles_sports', ['car', 'siren', 'city'], { kind: 'veh_police', primary: '#1E293B', secondary: '#F8FAFC', accent: '#38BDF8' }, ['Patrol'], { width: 64, height: 52 }),
  world('veh_firetruck', 'Fire Engine', 'vehicles_sports', ['truck', 'rescue', 'red'], { kind: 'veh_firetruck', primary: '#DC2626', secondary: '#CBD5E1', accent: '#FACC15' }, ['Rescue'], { width: 66, height: 54 }),
  world('veh_bus', 'City School Bus', 'vehicles_sports', ['bus', 'yellow', 'city'], { kind: 'veh_bus', primary: '#FACC15', secondary: '#1E293B', accent: '#F97316' }, ['Drive'], { width: 66, height: 54 }),
  world('veh_moto', 'Sport Motorcycle', 'vehicles_sports', ['bike', 'fast', 'moto'], { kind: 'veh_moto', primary: '#F97316', secondary: '#1E293B', accent: '#38BDF8' }, ['Ride'], { width: 60, height: 50 }),
  world('veh_bike', 'Road Bicycle', 'vehicles_sports', ['cycle', 'pedal', 'green'], { kind: 'veh_bike', primary: '#10B981', secondary: '#1E293B', accent: '#FACC15' }, ['Ride'], { width: 58, height: 50 }),
  world('veh_heli', 'Rescue Helicopter', 'vehicles_sports', ['fly', 'air', 'chopper'], { kind: 'veh_heli', primary: '#0EA5E9', secondary: '#0284C7', accent: '#FACC15' }, ['Spin 1', 'Spin 2'], { width: 68, height: 56 }),
  world('veh_plane', 'Jet Airliner', 'vehicles_sports', ['fly', 'sky', 'airplane'], { kind: 'veh_plane', primary: '#F8FAFC', secondary: '#38BDF8', accent: '#EF4444' }, ['Fly'], { width: 68, height: 56 }),
  world('veh_boat', 'Ocean Sailboat', 'vehicles_sports', ['ship', 'water', 'sea'], { kind: 'veh_boat', primary: '#B45309', secondary: '#FFFFFF', accent: '#38BDF8' }, ['Sail'], { width: 60, height: 60 }),
  world('veh_sub', 'Yellow Submarine', 'vehicles_sports', ['ocean', 'underwater', 'sub'], { kind: 'veh_sub', primary: '#FACC15', secondary: '#CA8A04', accent: '#7DD3FC' }, ['Dive'], { width: 64, height: 52 }),
  world('veh_train', 'Express Locomotive', 'vehicles_sports', ['railway', 'steam', 'train'], { kind: 'veh_train', primary: '#DC2626', secondary: '#1E293B', accent: '#FACC15' }, ['Chug'], { width: 66, height: 56 }),
  world('veh_skateboard', 'Street Skateboard', 'vehicles_sports', ['skate', 'deck', 'sport'], { kind: 'veh_skateboard', primary: '#8B5CF6', secondary: '#4C1D95', accent: '#22D3EE' }, ['Deck'], { width: 56, height: 42 }),
  world('spt_soccer', 'Soccer Ball', 'vehicles_sports', ['football', 'ball', 'kick'], { kind: 'sport_soccer', primary: '#FFFFFF', secondary: '#0F172A', accent: '#0F172A' }, ['Ball'], { width: 42, height: 42, colliderShape: 'circle' }),
  world('spt_basket', 'Basketball', 'vehicles_sports', ['hoop', 'ball', 'orange'], { kind: 'sport_basket', primary: '#F97316', secondary: '#0F172A', accent: '#0F172A' }, ['Ball'], { width: 42, height: 42, colliderShape: 'circle' }),
  world('spt_tennis', 'Tennis Ball', 'vehicles_sports', ['racket', 'ball', 'lime'], { kind: 'sport_tennis', primary: '#A3E635', secondary: '#FFFFFF', accent: '#FFFFFF' }, ['Ball'], { width: 38, height: 38, colliderShape: 'circle' }),
  world('spt_baseball', 'Baseball', 'vehicles_sports', ['bat', 'ball', 'white'], { kind: 'sport_baseball', primary: '#F8FAFC', secondary: '#EF4444', accent: '#EF4444' }, ['Ball'], { width: 38, height: 38, colliderShape: 'circle' }),
  world('spt_football', 'Pro Football', 'vehicles_sports', ['rugby', 'throw', 'ball'], { kind: 'sport_football', primary: '#92400E', secondary: '#FFFFFF', accent: '#FFFFFF' }, ['Ball'], { width: 46, height: 46 }),
  world('spt_bowling', 'Bowling Pin', 'vehicles_sports', ['alley', 'pin', 'strike'], { kind: 'sport_bowling', primary: '#EF4444', secondary: '#FFFFFF', accent: '#EF4444' }, ['Pin'], { width: 44, height: 54 }),
  world('spt_medal', 'Gold 1st Medal', 'vehicles_sports', ['award', 'winner', 'olympic'], { kind: 'sport_medal', primary: '#FACC15', secondary: '#D97706', accent: '#FFFFFF' }, ['Medal'], { width: 46, height: 50 }),
  world('spt_finishflag', 'Checkered Finish Flag', 'vehicles_sports', ['race', 'goal', 'win'], { kind: 'sport_finishflag', primary: '#0F172A', secondary: '#FFFFFF', accent: '#0F172A' }, ['Flag'], { width: 54, height: 58 }),
];

// =========================================================================
// 9. FX, PARTICLES & UI (18 sprites)
// =========================================================================
const FX_UI_ASSETS: SpriteAssetDef[] = [
  world('fx_explosion', 'Comic Boom Burst', 'fx_ui', ['boom', 'explosion', 'blast'], { kind: 'fx_explosion', primary: '#F97316', secondary: '#EF4444', accent: '#FEF08A' }, ['Burst 1', 'Burst 2'], { width: 60, height: 60, glowLightColor: '#F97316' }),
  world('fx_shockwave', 'Cyan Shockwave Ring', 'fx_ui', ['ring', 'wave', 'pulse'], { kind: 'fx_shockwave', primary: '#38BDF8', secondary: '#0EA5E9', accent: '#E0F2FE' }, ['Ring'], { width: 60, height: 60, blendMode: 'add' }),
  world('fx_magiccircle', 'Arcane Rune Circle', 'fx_ui', ['magic', 'spell', 'sigil'], { kind: 'fx_magiccircle', primary: '#A855F7', secondary: '#6366F1', accent: '#38BDF8' }, ['Sigil'], { width: 64, height: 64, blendMode: 'add' }),
  world('fx_smoke', 'Smoke Puff', 'fx_ui', ['dust', 'cloud', 'puff'], { kind: 'fx_smoke', primary: '#CBD5E1', secondary: '#94A3B8', accent: '#F8FAFC' }, ['Puff'], { width: 52, height: 52 }),
  world('fx_sparkle', 'Twinkle Sparkles', 'fx_ui', ['star', 'shine', 'magic'], { kind: 'fx_sparkle', primary: '#FACC15', secondary: '#F59E0B', accent: '#FFFFFF' }, ['Shine'], { width: 48, height: 48, blendMode: 'add' }),
  world('fx_laser_cyan', 'Cyan Laser Bolt', 'fx_ui', ['projectile', 'beam', 'shot'], { kind: 'fx_laser', primary: '#22D3EE', secondary: '#0EA5E9', accent: '#FFFFFF' }, ['Bolt'], { width: 52, height: 18, blendMode: 'add', glowLightColor: '#22D3EE' }),
  world('fx_laser_red', 'Crimson Plasma Bolt', 'fx_ui', ['projectile', 'enemy', 'shot'], { kind: 'fx_laser', primary: '#F43F5E', secondary: '#E11D48', accent: '#FFE4E6' }, ['Bolt'], { width: 52, height: 18, blendMode: 'add', glowLightColor: '#F43F5E' }),
  world('ui_arrow_up', 'Button Arrow Up', 'fx_ui', ['control', 'button', 'up'], { kind: 'ui_arrow', primary: '#0EA5E9', secondary: '#0284C7', accent: '#FFFFFF', rotation: 0 }, ['Up'], { width: 48, height: 48 }),
  world('ui_arrow_right', 'Button Arrow Right', 'fx_ui', ['control', 'button', 'right'], { kind: 'ui_arrow', primary: '#0EA5E9', secondary: '#0284C7', accent: '#FFFFFF', rotation: 90 }, ['Right'], { width: 48, height: 48 }),
  world('ui_arrow_down', 'Button Arrow Down', 'fx_ui', ['control', 'button', 'down'], { kind: 'ui_arrow', primary: '#0EA5E9', secondary: '#0284C7', accent: '#FFFFFF', rotation: 180 }, ['Down'], { width: 48, height: 48 }),
  world('ui_arrow_left', 'Button Arrow Left', 'fx_ui', ['control', 'button', 'left'], { kind: 'ui_arrow', primary: '#0EA5E9', secondary: '#0284C7', accent: '#FFFFFF', rotation: 270 }, ['Left'], { width: 48, height: 48 }),
  world('ui_play', 'Play Button', 'fx_ui', ['start', 'menu', 'button'], { kind: 'ui_play', primary: '#10B981', secondary: '#059669', accent: '#FFFFFF' }, ['Play'], { width: 48, height: 48, colliderShape: 'circle' }),
  world('ui_pause', 'Pause Button', 'fx_ui', ['stop', 'menu', 'button'], { kind: 'ui_pause', primary: '#F59E0B', secondary: '#D97706', accent: '#FFFFFF' }, ['Pause'], { width: 48, height: 48, colliderShape: 'circle' }),
  world('ui_crosshair', 'Target Crosshair', 'fx_ui', ['aim', 'reticle', 'cursor'], { kind: 'ui_crosshair', primary: '#EF4444', secondary: '#DC2626', accent: '#FACC15' }, ['Aim'], { width: 48, height: 48, colliderShape: 'circle' }),
  world('ui_speech', 'Comic Speech Bubble', 'fx_ui', ['dialog', 'chat', 'talk'], { kind: 'ui_speech', primary: '#38BDF8', secondary: '#0EA5E9', accent: '#0F172A' }, ['Bubble'], { width: 54, height: 50 }),
  world('ui_warning', 'Caution Alert Sign', 'fx_ui', ['alert', 'danger', 'sign'], { kind: 'ui_warning', primary: '#FACC15', secondary: '#F59E0B', accent: '#0F172A' }, ['Alert'], { width: 48, height: 48 }),
  world('ui_dpad', 'Arcade D-Pad', 'fx_ui', ['gamepad', 'controller', 'touch'], { kind: 'ui_dpad', primary: '#334155', secondary: '#64748B', accent: '#38BDF8' }, ['D-Pad'], { width: 54, height: 54 }),
  world('ui_joystick', 'Arcade Stick', 'fx_ui', ['gamepad', 'controller', 'retro'], { kind: 'ui_joystick', primary: '#EF4444', secondary: '#334155', accent: '#FACC15' }, ['Stick'], { width: 52, height: 52 }),
];

// =========================================================================
// 10. LETTERS & NUMBERS (36 sprites: A-Z + 0-9)
// =========================================================================
const GLYPH_PALETTE = ['#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444'];
const GLYPH_CHARS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  ...'0123456789'.split(''),
];

const LETTER_ASSETS: SpriteAssetDef[] = GLYPH_CHARS.map((ch, idx) => {
  const col = GLYPH_PALETTE[idx % GLYPH_PALETTE.length];
  const isDigit = idx >= 26;
  return world(
    `gly_${ch}`,
    isDigit ? `Number ${ch}` : `Letter ${ch}`,
    'letters',
    [ch.toLowerCase(), isDigit ? 'number' : 'letter', 'alphabet', 'font', 'text'],
    { kind: 'glyph_badge', primary: col, secondary: '#FFFFFF', accent: '#FFFFFF', label: ch },
    [ch],
    { width: 44, height: 44 }
  );
});

export const ASSET_SPRITES: SpriteAssetDef[] = [
  ...CHARACTER_ASSETS,
  ...ANIMAL_ASSETS,
  ...MONSTER_ASSETS,
  ...SPACE_ASSETS,
  ...PLATFORM_ASSETS,
  ...ITEM_ASSETS,
  ...FOOD_NATURE_ASSETS,
  ...VEHICLE_SPORTS_ASSETS,
  ...FX_UI_ASSETS,
  ...LETTER_ASSETS,
];

export const ASSET_COSTUMES: CostumeAssetItem[] = ASSET_SPRITES.flatMap((sprite) =>
  sprite.frames.map((frame, idx) => ({
    id: `${sprite.id}_f${idx}`,
    spriteId: sprite.id,
    name: sprite.frames.length > 1 ? `${sprite.name} (${frame.name})` : sprite.name,
    category: sprite.category,
    tags: [...sprite.tags, frame.name.toLowerCase()],
    width: sprite.width,
    height: sprite.height,
    renderSvg: frame.renderSvg,
  }))
);

export function searchSpriteAssets(query: string, category: AssetCategoryId): SpriteAssetDef[] {
  const q = query.trim().toLowerCase();
  return ASSET_SPRITES.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });
}

export function searchCostumeAssets(query: string, category: AssetCategoryId): CostumeAssetItem[] {
  const q = query.trim().toLowerCase();
  return ASSET_COSTUMES.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });
}

export function searchBackdropAssets(
  query: string,
  category: BackdropCategoryId
): BackdropAssetDef[] {
  const q = query.trim().toLowerCase();
  return ASSET_BACKDROPS.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });
}

function makeCostumeFromSvg(
  name: string,
  width: number,
  height: number,
  dataUrl: string
): CostumeData {
  return {
    id: createUid('cos'),
    name,
    width,
    height,
    pivotX: 0.5,
    pivotY: 0.5,
    layers: [
      {
        id: createUid('lyr'),
        name: 'Base Layer',
        visible: true,
        opacity: 1,
        dataUrl,
      },
    ],
    previewUrl: dataUrl,
  };
}

/**
 * Converts a library sprite asset into a ready-to-use SparkCode 2 SpriteData object.
 */
export function instantiateLibrarySprite(
  def: SpriteAssetDef,
  existingSpritesCount = 0
): SpriteData {
  const costumes: CostumeData[] = def.frames.map((frame, idx) => {
    const url = getCachedSvgUrl(`${def.id}:${idx}`, frame.renderSvg);
    return makeCostumeFromSvg(frame.name, def.width, def.height, url);
  });

  // Gentle spiral stagger when adding multiple sprites so they don't stack on exact (0, 0)
  const ring = existingSpritesCount % 6;
  const x = ring === 0 ? 0 : Math.round(Math.cos(ring * 1.1) * (34 + ring * 10));
  const y = ring === 0 ? 0 : Math.round(Math.sin(ring * 1.1) * (24 + ring * 8));

  return {
    id: createUid('sp'),
    name: def.name,
    x,
    y,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: def.solidPlatform ? 2 : 6,
    opacity: 1,
    visible: true,
    blendMode: def.blendMode ?? 'normal',
    activeCostumeIndex: 0,
    costumes,
    physics: {
      enabled: Boolean(def.solidPlatform),
      isStatic: Boolean(def.solidPlatform),
      shape: def.colliderShape ?? 'aabb',
      mass: def.solidPlatform ? 100 : 1,
      friction: def.solidPlatform ? 0.5 : 0.3,
      restitution: def.solidPlatform ? 0.15 : 0.25,
      gravityScale: def.solidPlatform ? 0 : 1,
      solid: true,
    },
    light: def.glowLightColor
      ? {
          type: 'point',
          color: def.glowLightColor,
          radius: 165,
          intensity: 0.85,
          angle: 60,
          castsShadow: false,
        }
      : {
          type: 'none',
          color: '#38BDF8',
          radius: 140,
          intensity: 0.8,
          angle: 60,
          castsShadow: Boolean(def.solidPlatform),
        },
    effects: {
      chromatic: 0,
      pixelate: 0,
      vignette: 0,
      tint: '#38BDF8',
      tintAmount: 0,
    },
    functions: [],
    scripts: [],
  };
}

/**
 * Converts a library costume item into a SparkCode 2 CostumeData frame.
 */
export function instantiateLibraryCostume(item: CostumeAssetItem): CostumeData {
  const url = getCachedSvgUrl(item.id, item.renderSvg);
  return makeCostumeFromSvg(item.name, item.width, item.height, url);
}

/**
 * Applies a library backdrop preset (scene artwork + coordinated shader & ambient lighting) onto StageSettings.
 */
export function applyLibraryBackdrop(
  stage: StageSettings,
  backdrop: BackdropAssetDef
): StageSettings {
  const previewUrl = getBackdropPreviewUrl(backdrop);
  return {
    ...stage,
    backgroundShader: backdrop.backgroundShader,
    bgColorA: backdrop.bgColorA,
    bgColorB: backdrop.bgColorB,
    ambientDarkness: backdrop.ambientDarkness,
    ambientColor: backdrop.ambientColor,
    backdropUrl: backdrop.hasSceneSvg ? previewUrl : undefined,
    backdropName: backdrop.name,
  };
}

/**
 * Creates a CostumeData object from a user-uploaded PNG/SVG/JPG data URL.
 */
export function createCostumeFromDataUrl(
  name: string,
  dataUrl: string,
  width = 64,
  height = 64
): CostumeData {
  return makeCostumeFromSvg(name, Math.max(16, Math.min(240, width)), Math.max(16, Math.min(240, height)), dataUrl);
}

/**
 * Creates a full SpriteData object from a user-uploaded image data URL.
 */
export function createSpriteFromDataUrl(
  name: string,
  dataUrl: string,
  width = 64,
  height = 64
): SpriteData {
  const cleanName = name.replace(/\.[^.]+$/, '').slice(0, 28) || 'Custom Sprite';
  const costume = createCostumeFromDataUrl(cleanName, dataUrl, width, height);
  return {
    id: createUid('sp'),
    name: cleanName,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 6,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
    activeCostumeIndex: 0,
    costumes: [costume],
    physics: {
      enabled: false,
      isStatic: false,
      shape: 'aabb',
      mass: 1,
      friction: 0.3,
      restitution: 0.25,
      gravityScale: 1,
      solid: true,
    },
    light: {
      type: 'none',
      color: '#38BDF8',
      radius: 140,
      intensity: 0.8,
      angle: 60,
      castsShadow: false,
    },
    effects: {
      chromatic: 0,
      pixelate: 0,
      vignette: 0,
      tint: '#38BDF8',
      tintAmount: 0,
    },
    functions: [],
    scripts: [],
  };
}
