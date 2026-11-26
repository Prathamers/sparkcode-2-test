// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BackgroundShaderType } from '../types/project';
import { svgToDataUrl, wrapBackdropSvg } from './assetSvgHelpers';

export type BackdropCategoryId = 'all' | 'space' | 'nature' | 'fantasy' | 'urban' | 'abstract';

export interface BackdropAssetDef {
  id: string;
  name: string;
  category: Exclude<BackdropCategoryId, 'all'>;
  tags: string[];
  backgroundShader: BackgroundShaderType;
  bgColorA: string;
  bgColorB: string;
  ambientDarkness: number;
  ambientColor: string;
  hasSceneSvg: boolean;
  buildSvg: () => string;
}

const backdropUrlCache = new Map<string, string>();

export function getBackdropPreviewUrl(def: BackdropAssetDef): string {
  let cached = backdropUrlCache.get(def.id);
  if (!cached) {
    cached = svgToDataUrl(def.buildSvg());
    backdropUrlCache.set(def.id, cached);
  }
  return cached;
}

function starDots(seed: number, count = 40, color = '#FFFFFF'): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = ((Math.sin(i * 19.31 + seed) * 43758.54) % 1 + 1) % 1;
    const y = ((Math.sin(i * 73.17 + seed) * 24634.63) % 1 + 1) % 1;
    const r = 0.8 + (i % 3) * 0.7;
    const op = 0.35 + (i % 5) * 0.14;
    out += `<circle cx="${Math.round(x * 560)}" cy="${Math.round(y * 280)}" r="${r.toFixed(1)}" fill="${color}" opacity="${op.toFixed(2)}"/>`;
  }
  return out;
}

export const ASSET_BACKDROPS: BackdropAssetDef[] = [
  {
    id: 'bg_deep_nebula',
    name: 'Deep Space Nebula',
    category: 'space',
    tags: ['space', 'stars', 'nebula', 'cosmos', 'galaxy'],
    backgroundShader: 'starfield',
    bgColorA: '#06081A',
    bgColorB: '#1B103B',
    ambientDarkness: 0.28,
    ambientColor: '#050814',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_neb)"/>
         <circle cx="150" cy="120" r="130" fill="#6366F1" opacity="0.22"/>
         <circle cx="410" cy="210" r="150" fill="#EC4899" opacity="0.16"/>
         <circle cx="310" cy="95" r="95" fill="#06B6D4" opacity="0.18"/>
         ${starDots(11, 55)}
         <circle cx="445" cy="86" r="34" fill="#38BDF8" opacity="0.88"/>
         <ellipse cx="445" cy="86" rx="64" ry="14" fill="none" stroke="#BAE6FD" stroke-width="4" transform="rotate(-18 445 86)" opacity="0.8"/>`,
        `<linearGradient id="g_neb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#06081A"/><stop offset="100%" stop-color="#1E1B4B"/></linearGradient>`
      ),
  },
  {
    id: 'bg_lunar_surface',
    name: 'Lunar Crater Surface',
    category: 'space',
    tags: ['moon', 'crater', 'astronaut', 'space', 'planet'],
    backgroundShader: 'starfield',
    bgColorA: '#030712',
    bgColorB: '#1E293B',
    ambientDarkness: 0.25,
    ambientColor: '#020617',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#070B19"/>
        ${starDots(23, 50)}
        <circle cx="110" cy="88" r="34" fill="#0284C7"/>
        <path d="M96 74 Q114 66 126 84 Q112 96 96 86 Z" fill="#22C55E"/>
        <path d="M0 265 Q140 240 280 262 Q420 280 560 250 L560 360 L0 360 Z" fill="#475569"/>
        <ellipse cx="140" cy="306" rx="54" ry="14" fill="#334155"/>
        <ellipse cx="385" cy="316" rx="70" ry="17" fill="#334155"/>
      `),
  },
  {
    id: 'bg_red_mars',
    name: 'Red Mars Frontier',
    category: 'space',
    tags: ['mars', 'desert', 'planet', 'sci-fi', 'red'],
    backgroundShader: 'starfield',
    bgColorA: '#1F0A14',
    bgColorB: '#7C2D12',
    ambientDarkness: 0.2,
    ambientColor: '#1C0A09',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_mars)"/>
         ${starDots(37, 30, '#FED7AA')}
         <circle cx="430" cy="96" r="46" fill="#FB923C" opacity="0.28"/>
         <path d="M0 252 L110 198 L200 245 L325 182 L440 242 L560 196 L560 360 L0 360 Z" fill="#9A3412"/>
         <path d="M0 285 Q180 260 360 288 Q460 302 560 278 L560 360 L0 360 Z" fill="#7C2D12"/>`,
        `<linearGradient id="g_mars" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2E1025"/><stop offset="100%" stop-color="#9A3412"/></linearGradient>`
      ),
  },
  {
    id: 'bg_alien_horizon',
    name: 'Alien Twin Moons',
    category: 'space',
    tags: ['alien', 'moons', 'sci-fi', 'purple', 'cyan'],
    backgroundShader: 'nebula',
    bgColorA: '#0F172A',
    bgColorB: '#3B0764',
    ambientDarkness: 0.22,
    ambientColor: '#1E1B4B',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_al)"/>
         ${starDots(51, 45, '#E9D5FF')}
         <circle cx="150" cy="108" r="48" fill="#A855F7" opacity="0.78"/>
         <circle cx="245" cy="76" r="22" fill="#22D3EE" opacity="0.85"/>
         <path d="M0 265 Q160 218 320 265 Q440 295 560 245 L560 360 L0 360 Z" fill="#1E1B4B"/>
         <path d="M0 300 Q200 280 560 306 L560 360 L0 360 Z" fill="#0F172A"/>`,
        `<linearGradient id="g_al" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#090D24"/><stop offset="100%" stop-color="#4C1D95"/></linearGradient>`
      ),
  },
  {
    id: 'bg_space_deck',
    name: 'Starship Command Deck',
    category: 'space',
    tags: ['spaceship', 'station', 'window', 'bridge', 'sci-fi'],
    backgroundShader: 'starfield',
    bgColorA: '#090F1E',
    bgColorB: '#1E293B',
    ambientDarkness: 0.18,
    ambientColor: '#050814',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#050814"/>
        ${starDots(63, 60)}
        <path d="M0 0 L560 0 L560 360 L0 360 Z M70 36 L490 36 L450 236 L110 236 Z" fill="#1E293B" fill-rule="evenodd"/>
        <polygon points="70,36 490,36 450,236 110,236" fill="none" stroke="#38BDF8" stroke-width="3" opacity="0.7"/>
        <rect x="0" y="256" width="560" height="104" fill="#0F172A"/>
        <rect x="130" y="276" width="300" height="32" rx="6" fill="#1E293B" stroke="#334155" stroke-width="2"/>
        <circle cx="165" cy="292" r="6" fill="#22C55E"/><circle cx="190" cy="292" r="6" fill="#38BDF8"/><circle cx="215" cy="292" r="6" fill="#F59E0B"/>
      `),
  },
  {
    id: 'bg_wormhole',
    name: 'Quantum Warp Tunnel',
    category: 'space',
    tags: ['warp', 'portal', 'tunnel', 'hyperspace'],
    backgroundShader: 'starfield',
    bgColorA: '#020617',
    bgColorB: '#0E7490',
    ambientDarkness: 0.24,
    ambientColor: '#082F49',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#020617"/>
        <circle cx="280" cy="180" r="240" fill="none" stroke="#0E7490" stroke-width="18" opacity="0.35"/>
        <circle cx="280" cy="180" r="185" fill="none" stroke="#06B6D4" stroke-width="12" opacity="0.45"/>
        <circle cx="280" cy="180" r="130" fill="none" stroke="#38BDF8" stroke-width="8" opacity="0.6"/>
        <circle cx="280" cy="180" r="80" fill="none" stroke="#7DD3FC" stroke-width="5" opacity="0.75"/>
        <circle cx="280" cy="180" r="35" fill="#E0F2FE" opacity="0.85"/>
      `),
  },

  // ================= NATURE & OUTDOORS =================
  {
    id: 'bg_sunny_meadow',
    name: 'Sunny Blue Sky Meadow',
    category: 'nature',
    tags: ['sky', 'grass', 'meadow', 'day', 'sunny', 'scratch'],
    backgroundShader: 'solid',
    bgColorA: '#38BDF8',
    bgColorB: '#BAE6FD',
    ambientDarkness: 0,
    ambientColor: '#0F172A',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_sky)"/>
         <circle cx="470" cy="72" r="36" fill="#FACC15"/>
         <path d="M90 88 C75 88 72 68 88 64 C94 48 118 46 128 58 C144 50 162 64 156 78 C166 84 158 88 144 88 Z" fill="#FFFFFF" opacity="0.92"/>
         <path d="M290 112 C278 112 275 96 289 92 C294 78 314 76 322 86 C336 80 350 92 344 104 C352 108 346 112 336 112 Z" fill="#FFFFFF" opacity="0.88"/>
         <path d="M0 264 Q140 218 280 256 Q420 290 560 242 L560 360 L0 360 Z" fill="#4ADE80"/>
         <path d="M0 296 Q190 272 390 298 Q480 310 560 288 L560 360 L0 360 Z" fill="#22C55E"/>`,
        `<linearGradient id="g_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0EA5E9"/><stop offset="100%" stop-color="#E0F2FE"/></linearGradient>`
      ),
  },
  {
    id: 'bg_enchanted_forest',
    name: 'Enchanted Pine Forest',
    category: 'nature',
    tags: ['forest', 'trees', 'woods', 'nature', 'green'],
    backgroundShader: 'solid',
    bgColorA: '#064E3B',
    bgColorB: '#022C22',
    ambientDarkness: 0.16,
    ambientColor: '#022C22',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_for)"/>
         <circle cx="280" cy="110" r="85" fill="#A7F3D0" opacity="0.16"/>
         <polygon points="80,295 140,120 200,295" fill="#065F46"/>
         <polygon points="180,295 255,95 330,295" fill="#047857"/>
         <polygon points="340,295 415,115 490,295" fill="#065F46"/>
         <polygon points="440,295 510,145 580,295" fill="#059669"/>
         <rect x="0" y="288" width="560" height="72" fill="#022C22"/>`,
        `<linearGradient id="g_for" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#065F46"/><stop offset="100%" stop-color="#022C22"/></linearGradient>`
      ),
  },
  {
    id: 'bg_ocean_reef',
    name: 'Underwater Coral Reef',
    category: 'nature',
    tags: ['ocean', 'underwater', 'sea', 'water', 'fish'],
    backgroundShader: 'solid',
    bgColorA: '#0284C7',
    bgColorB: '#0C4A6E',
    ambientDarkness: 0.14,
    ambientColor: '#082F49',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_sea)"/>
         <polygon points="90,0 160,0 230,360 120,360" fill="#7DD3FC" opacity="0.12"/>
         <polygon points="280,0 350,0 440,360 330,360" fill="#7DD3FC" opacity="0.1"/>
         <circle cx="140" cy="140" r="7" fill="#E0F2FE" opacity="0.5"/>
         <circle cx="155" cy="108" r="5" fill="#E0F2FE" opacity="0.5"/>
         <circle cx="420" cy="155" r="8" fill="#E0F2FE" opacity="0.45"/>
         <path d="M0 302 Q160 282 320 305 Q440 320 560 296 L560 360 L0 360 Z" fill="#FDE68A"/>
         <path d="M62 320 Q56 260 72 240 Q86 268 78 320 Z" fill="#F43F5E"/>
         <path d="M472 320 Q462 250 482 225 Q498 255 490 320 Z" fill="#A855F7"/>`,
        `<linearGradient id="g_sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0EA5E9"/><stop offset="100%" stop-color="#082F49"/></linearGradient>`
      ),
  },
  {
    id: 'bg_tropical_beach',
    name: 'Tropical Sunset Beach',
    category: 'nature',
    tags: ['beach', 'sunset', 'palm', 'ocean', 'summer'],
    backgroundShader: 'solid',
    bgColorA: '#FB7185',
    bgColorB: '#F59E0B',
    ambientDarkness: 0.05,
    ambientColor: '#7C2D12',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_sun)"/>
         <circle cx="280" cy="205" r="52" fill="#FEF08A"/>
         <rect x="0" y="210" width="560" height="82" fill="#0284C7"/>
         <path d="M0 278 Q280 258 560 286 L560 360 L0 360 Z" fill="#FDE047"/>`,
        `<linearGradient id="g_sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EC4899"/><stop offset="60%" stop-color="#F97316"/><stop offset="100%" stop-color="#FACC15"/></linearGradient>`
      ),
  },
  {
    id: 'bg_snowy_peaks',
    name: 'Snowy Alpine Peaks',
    category: 'nature',
    tags: ['snow', 'mountain', 'winter', 'ice', 'cold'],
    backgroundShader: 'solid',
    bgColorA: '#0284C7',
    bgColorB: '#E0F2FE',
    ambientDarkness: 0.04,
    ambientColor: '#0C4A6E',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_ice)"/>
         <polygon points="20,300 155,105 290,300" fill="#64748B"/>
         <polygon points="155,105 112,168 155,152 198,168" fill="#FFFFFF"/>
         <polygon points="210,300 355,82 500,300" fill="#475569"/>
         <polygon points="355,82 308,150 355,134 402,150" fill="#FFFFFF"/>
         <rect x="0" y="286" width="560" height="74" fill="#F8FAFC"/>`,
        `<linearGradient id="g_ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#F0F9FF"/></linearGradient>`
      ),
  },
  {
    id: 'bg_desert_dunes',
    name: 'Golden Desert Dunes',
    category: 'nature',
    tags: ['desert', 'sand', 'dunes', 'cactus', 'hot'],
    backgroundShader: 'solid',
    bgColorA: '#F59E0B',
    bgColorB: '#FEF3C7',
    ambientDarkness: 0.03,
    ambientColor: '#78350F',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_des)"/>
         <circle cx="450" cy="84" r="38" fill="#FEF9C3"/>
         <path d="M0 245 Q150 185 320 245 Q440 285 560 220 L560 360 L0 360 Z" fill="#F59E0B"/>
         <path d="M0 288 Q190 250 390 296 Q490 315 560 278 L560 360 L0 360 Z" fill="#D97706"/>`,
        `<linearGradient id="g_des" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0EA5E9"/><stop offset="100%" stop-color="#FDE68A"/></linearGradient>`
      ),
  },
  {
    id: 'bg_night_aurora',
    name: 'Northern Aurora Night',
    category: 'nature',
    tags: ['aurora', 'night', 'stars', 'northern lights'],
    backgroundShader: 'starfield',
    bgColorA: '#041226',
    bgColorB: '#0F2942',
    ambientDarkness: 0.25,
    ambientColor: '#042F2E',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#041226"/>
        ${starDots(81, 45)}
        <path d="M0 140 Q140 50 280 120 Q420 190 560 80 L560 155 Q420 240 280 175 Q140 110 0 195 Z" fill="#10B981" opacity="0.34"/>
        <path d="M0 100 Q180 40 340 115 Q460 165 560 110 L560 140 Q450 190 340 145 Q180 80 0 135 Z" fill="#38BDF8" opacity="0.28"/>
        <polygon points="0,360 110,235 230,360" fill="#064E3B"/>
        <polygon points="180,360 310,220 440,360" fill="#022C22"/>
        <polygon points="390,360 500,245 560,360" fill="#064E3B"/>
      `),
  },

  // ================= FANTASY & DUNGEON =================
  {
    id: 'bg_castle_courtyard',
    name: 'Royal Castle Courtyard',
    category: 'fantasy',
    tags: ['castle', 'medieval', 'knight', 'kingdom'],
    backgroundShader: 'solid',
    bgColorA: '#38BDF8',
    bgColorB: '#BAE6FD',
    ambientDarkness: 0.05,
    ambientColor: '#1E293B',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_cas)"/>
         <rect x="75" y="130" width="90" height="160" fill="#94A3B8"/>
         <rect x="395" y="130" width="90" height="160" fill="#94A3B8"/>
         <polygon points="65,130 120,70 175,130" fill="#EF4444"/>
         <polygon points="385,130 440,70 495,130" fill="#EF4444"/>
         <rect x="165" y="175" width="230" height="115" fill="#CBD5E1"/>
         <path d="M245 290 L245 225 C245 200 315 200 315 225 L315 290 Z" fill="#78350F"/>
         <rect x="0" y="286" width="560" height="74" fill="#22C55E"/>`,
        `<linearGradient id="g_cas" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#E0F2FE"/></linearGradient>`
      ),
  },
  {
    id: 'bg_stone_dungeon',
    name: 'Torchlit Stone Dungeon',
    category: 'fantasy',
    tags: ['dungeon', 'cave', 'stone', 'castle', 'rpg'],
    backgroundShader: 'solid',
    bgColorA: '#0F172A',
    bgColorB: '#1E293B',
    ambientDarkness: 0.32,
    ambientColor: '#090D16',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#1E293B"/>
        <rect x="0" y="290" width="560" height="70" fill="#0F172A"/>
        <circle cx="110" cy="145" r="46" fill="#F59E0B" opacity="0.22"/>
        <circle cx="450" cy="145" r="46" fill="#F59E0B" opacity="0.22"/>
        <rect x="106" y="150" width="8" height="28" fill="#78350F"/>
        <circle cx="110" cy="144" r="9" fill="#F97316"/>
        <rect x="446" y="150" width="8" height="28" fill="#78350F"/>
        <circle cx="450" cy="144" r="9" fill="#F97316"/>
        <path d="M210 290 L210 150 C210 95 350 95 350 150 L350 290 Z" fill="#090D16"/>
      `),
  },
  {
    id: 'bg_volcano_cavern',
    name: 'Magma Volcano Cavern',
    category: 'fantasy',
    tags: ['volcano', 'lava', 'fire', 'boss', 'cave'],
    backgroundShader: 'solid',
    bgColorA: '#2A0808',
    bgColorB: '#7F1D1D',
    ambientDarkness: 0.25,
    ambientColor: '#450A0A',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_lav)"/>
         <polygon points="0,300 95,150 210,300" fill="#451A03"/>
         <polygon points="340,300 450,130 560,300" fill="#451A03"/>
         <rect x="0" y="295" width="560" height="65" fill="#F97316"/>
         <path d="M0 302 Q140 286 280 302 Q420 318 560 298 L560 360 L0 360 Z" fill="#FACC15" opacity="0.45"/>`,
        `<linearGradient id="g_lav" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1F0808"/><stop offset="100%" stop-color="#991B1B"/></linearGradient>`
      ),
  },
  {
    id: 'bg_spooky_graveyard',
    name: 'Spooky Midnight Manor',
    category: 'fantasy',
    tags: ['halloween', 'ghost', 'spooky', 'moon', 'night'],
    backgroundShader: 'starfield',
    bgColorA: '#09071A',
    bgColorB: '#311042',
    ambientDarkness: 0.34,
    ambientColor: '#1E1B4B',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_spk)"/>
         <circle cx="430" cy="86" r="42" fill="#FEF08A" opacity="0.9"/>
         <path d="M0 280 Q150 248 310 278 Q450 300 560 264 L560 360 L0 360 Z" fill="#1E1B4B"/>
         <rect x="90" y="232" width="24" height="44" rx="10" fill="#64748B"/>
         <rect x="170" y="242" width="22" height="36" rx="9" fill="#475569"/>`,
        `<linearGradient id="g_spk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#09071A"/><stop offset="100%" stop-color="#4C1D95"/></linearGradient>`
      ),
  },
  {
    id: 'bg_candy_kingdom',
    name: 'Candy Cloud Kingdom',
    category: 'fantasy',
    tags: ['candy', 'pastel', 'pink', 'cute', 'clouds'],
    backgroundShader: 'solid',
    bgColorA: '#F472B6',
    bgColorB: '#FDE68A',
    ambientDarkness: 0,
    ambientColor: '#831843',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_can)"/>
         <path d="M0 275 Q140 240 280 275 Q420 310 560 265 L560 360 L0 360 Z" fill="#F9A8D4"/>
         <path d="M0 308 Q180 286 380 310 Q480 322 560 296 L560 360 L0 360 Z" fill="#F472B6"/>
         <circle cx="110" cy="252" r="24" fill="#F43F5E"/><rect x="106" y="272" width="8" height="35" fill="#FFFFFF"/>
         <circle cx="445" cy="246" r="24" fill="#38BDF8"/><rect x="441" y="266" width="8" height="35" fill="#FFFFFF"/>`,
        `<linearGradient id="g_can" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FBCFE8"/><stop offset="100%" stop-color="#FEF3C7"/></linearGradient>`
      ),
  },
  {
    id: 'bg_cloud_temple',
    name: 'Floating Sky Temple',
    category: 'fantasy',
    tags: ['sky', 'clouds', 'temple', 'heaven', 'platformer'],
    backgroundShader: 'solid',
    bgColorA: '#0EA5E9',
    bgColorB: '#E0F2FE',
    ambientDarkness: 0,
    ambientColor: '#0C4A6E',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_ct)"/>
         <ellipse cx="280" cy="275" rx="180" ry="38" fill="#FFFFFF" opacity="0.92"/>
         <rect x="200" y="160" width="160" height="100" fill="#F1F5F9"/>
         <polygon points="180,160 280,105 380,160" fill="#F59E0B"/>
         <rect x="220" y="175" width="18" height="85" fill="#CBD5E1"/>
         <rect x="271" y="175" width="18" height="85" fill="#CBD5E1"/>
         <rect x="322" y="175" width="18" height="85" fill="#CBD5E1"/>`,
        `<linearGradient id="g_ct" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#E0F2FE"/></linearGradient>`
      ),
  },

  // ================= URBAN & RETRO =================
  {
    id: 'bg_neon_city',
    name: 'Cyber Neon City',
    category: 'urban',
    tags: ['city', 'cyberpunk', 'neon', 'night', 'buildings'],
    backgroundShader: 'synthwave',
    bgColorA: '#090D1C',
    bgColorB: '#1E1B4B',
    ambientDarkness: 0.24,
    ambientColor: '#090D1C',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_nc)"/>
         <circle cx="280" cy="175" r="70" fill="#EC4899" opacity="0.72"/>
         <rect x="20" y="150" width="70" height="210" fill="#0F172A"/>
         <rect x="105" y="110" width="80" height="250" fill="#1E293B"/>
         <rect x="205" y="170" width="60" height="190" fill="#0F172A"/>
         <rect x="315" y="120" width="75" height="240" fill="#1E293B"/>
         <rect x="410" y="155" width="65" height="205" fill="#0F172A"/>
         <rect x="490" y="130" width="60" height="230" fill="#1E293B"/>
         <rect x="120" y="130" width="12" height="14" fill="#38BDF8"/><rect x="148" y="130" width="12" height="14" fill="#38BDF8"/>
         <rect x="335" y="140" width="12" height="14" fill="#F472B6"/><rect x="360" y="140" width="12" height="14" fill="#F472B6"/>`,
        `<linearGradient id="g_nc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#090D1C"/><stop offset="100%" stop-color="#311042"/></linearGradient>`
      ),
  },
  {
    id: 'bg_metro_day',
    name: 'Sunny City Skyline',
    category: 'urban',
    tags: ['city', 'buildings', 'day', 'street', 'skyline'],
    backgroundShader: 'solid',
    bgColorA: '#38BDF8',
    bgColorB: '#BAE6FD',
    ambientDarkness: 0,
    ambientColor: '#0F172A',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#7DD3FC"/>
        <rect x="35" y="140" width="80" height="160" fill="#64748B"/>
        <rect x="130" y="95" width="90" height="205" fill="#475569"/>
        <rect x="240" y="160" width="75" height="140" fill="#94A3B8"/>
        <rect x="335" y="110" width="95" height="190" fill="#64748B"/>
        <rect x="450" y="150" width="85" height="150" fill="#475569"/>
        <rect x="0" y="294" width="560" height="66" fill="#334155"/>
        <line x1="20" y1="327" x2="540" y2="327" stroke="#FACC15" stroke-width="5" stroke-dasharray="28 20"/>
      `),
  },
  {
    id: 'bg_synthwave_sun',
    name: 'Retro Synthwave Grid',
    category: 'urban',
    tags: ['synthwave', 'retro', '80s', 'arcade', 'grid'],
    backgroundShader: 'synthwave',
    bgColorA: '#09061A',
    bgColorB: '#3B0764',
    ambientDarkness: 0.16,
    ambientColor: '#1E1B4B',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_sw)"/>
         <circle cx="280" cy="175" r="76" fill="url(#g_swsun)"/>
         <rect x="0" y="210" width="560" height="150" fill="#1E1B4B" opacity="0.88"/>
         <line x1="0" y1="210" x2="560" y2="210" stroke="#22D3EE" stroke-width="3"/>
         <line x1="0" y1="245" x2="560" y2="245" stroke="#22D3EE" stroke-width="1.5" opacity="0.6"/>
         <line x1="0" y1="290" x2="560" y2="290" stroke="#22D3EE" stroke-width="2" opacity="0.7"/>`,
        `<linearGradient id="g_sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#09061A"/><stop offset="100%" stop-color="#4C1D95"/></linearGradient>
         <linearGradient id="g_swsun" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FACC15"/><stop offset="100%" stop-color="#EC4899"/></linearGradient>`
      ),
  },
  {
    id: 'bg_soccer_pitch',
    name: 'Stadium Soccer Field',
    category: 'urban',
    tags: ['soccer', 'sports', 'field', 'stadium', 'grass'],
    backgroundShader: 'solid',
    bgColorA: '#0284C7',
    bgColorB: '#BAE6FD',
    ambientDarkness: 0,
    ambientColor: '#0F172A',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#38BDF8"/>
        <rect x="0" y="190" width="560" height="170" fill="#16A34A"/>
        <rect x="0" y="230" width="560" height="40" fill="#22C55E" opacity="0.55"/>
        <rect x="0" y="310" width="560" height="50" fill="#22C55E" opacity="0.55"/>
        <line x1="280" y1="190" x2="280" y2="360" stroke="#FFFFFF" stroke-width="4" opacity="0.75"/>
        <circle cx="280" cy="275" r="46" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.75"/>
      `),
  },
  {
    id: 'bg_race_circuit',
    name: 'Grand Prix Track',
    category: 'urban',
    tags: ['racing', 'track', 'car', 'road', 'asphalt'],
    backgroundShader: 'solid',
    bgColorA: '#0EA5E9',
    bgColorB: '#7DD3FC',
    ambientDarkness: 0,
    ambientColor: '#0F172A',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#22C55E"/>
        <rect x="0" y="0" width="560" height="120" fill="#38BDF8"/>
        <path d="M40 360 L185 120 L375 120 L520 360 Z" fill="#334155"/>
        <line x1="280" y1="130" x2="280" y2="355" stroke="#FACC15" stroke-width="6" stroke-dasharray="24 18"/>
      `),
  },
  {
    id: 'bg_concert_stage',
    name: 'Concert Spotlight Stage',
    category: 'urban',
    tags: ['stage', 'spotlight', 'music', 'concert', 'theater'],
    backgroundShader: 'solid',
    bgColorA: '#090D16',
    bgColorB: '#1E1B4B',
    ambientDarkness: 0.25,
    ambientColor: '#090D16',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#0F172A"/>
        <polygon points="150,0 230,0 320,300 60,300" fill="#38BDF8" opacity="0.18"/>
        <polygon points="330,0 410,0 500,300 240,300" fill="#F472B6" opacity="0.18"/>
        <rect x="0" y="285" width="560" height="75" fill="#334155"/>
        <rect x="0" y="285" width="560" height="8" fill="#38BDF8"/>
      `),
  },

  // ================= ABSTRACT & STUDIO =================
  {
    id: 'bg_studio_grid',
    name: 'Studio Coordinate Grid',
    category: 'abstract',
    tags: ['grid', 'blueprint', 'studio', 'default', 'coordinates'],
    backgroundShader: 'grid',
    bgColorA: '#090F1E',
    bgColorB: '#0F1B33',
    ambientDarkness: 0.14,
    ambientColor: '#050814',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#0B1325"/>
        <path d="M0 60 H560 M0 120 H560 M0 180 H560 M0 240 H560 M0 300 H560 M80 0 V360 M160 0 V360 M240 0 V360 M320 0 V360 M400 0 V360 M480 0 V360" stroke="#38BDF8" stroke-width="1" opacity="0.18"/>
        <line x1="280" y1="0" x2="280" y2="360" stroke="#38BDF8" stroke-width="1.5" opacity="0.45"/>
        <line x1="0" y1="180" x2="560" y2="180" stroke="#38BDF8" stroke-width="1.5" opacity="0.45"/>
      `),
  },
  {
    id: 'bg_circuit_matrix',
    name: 'Cyber Circuit Board',
    category: 'abstract',
    tags: ['circuit', 'tech', 'matrix', 'code', 'green'],
    backgroundShader: 'solid',
    bgColorA: '#021712',
    bgColorB: '#064E3B',
    ambientDarkness: 0.18,
    ambientColor: '#022C22',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#031A14"/>
        <path d="M40 70 H170 L210 110 H360 M60 280 H200 L240 240 H490 M420 50 V160 L380 200 H540" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
        <circle cx="170" cy="70" r="6" fill="#34D399"/><circle cx="360" cy="110" r="6" fill="#34D399"/>
        <circle cx="200" cy="280" r="6" fill="#34D399"/><circle cx="490" cy="240" r="6" fill="#34D399"/>
      `),
  },
  {
    id: 'bg_aurora_nebula',
    name: 'Prism Nebula Glow',
    category: 'abstract',
    tags: ['nebula', 'glow', 'shader', 'ambient'],
    backgroundShader: 'nebula',
    bgColorA: '#090D16',
    bgColorB: '#16233B',
    ambientDarkness: 0.2,
    ambientColor: '#090D16',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#0B1220"/>
        <circle cx="180" cy="160" r="140" fill="#0EA5E9" opacity="0.22"/>
        <circle cx="390" cy="200" r="150" fill="#8B5CF6" opacity="0.22"/>
        <circle cx="290" cy="120" r="110" fill="#14B8A6" opacity="0.18"/>
      `),
  },
  {
    id: 'bg_pixel_checker',
    name: 'Arcade Checker Floor',
    category: 'abstract',
    tags: ['checker', 'arcade', 'retro', 'tiles'],
    backgroundShader: 'solid',
    bgColorA: '#1E293B',
    bgColorB: '#0F172A',
    ambientDarkness: 0.08,
    ambientColor: '#0F172A',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#1E293B"/>
        <path d="M0 0 H140 V120 H0 Z M280 0 H420 V120 H280 Z M140 120 H280 V240 H140 Z M420 120 H560 V240 H420 Z M0 240 H140 V360 H0 Z M280 240 H420 V360 H280 Z" fill="#0F172A" opacity="0.7"/>
      `),
  },
  {
    id: 'bg_clean_white',
    name: 'Classic White Canvas',
    category: 'abstract',
    tags: ['white', 'blank', 'clean', 'light', 'scratch'],
    backgroundShader: 'solid',
    bgColorA: '#FFFFFF',
    bgColorB: '#F1F5F9',
    ambientDarkness: 0,
    ambientColor: '#0F172A',
    hasSceneSvg: false,
    buildSvg: () =>
      wrapBackdropSvg(`<rect width="560" height="360" fill="#FFFFFF"/><rect x="8" y="8" width="544" height="344" fill="none" stroke="#E2E8F0" stroke-width="2"/>`),
  },
  {
    id: 'bg_dark_slate',
    name: 'Midnight Slate Studio',
    category: 'abstract',
    tags: ['dark', 'slate', 'minimal', 'solid'],
    backgroundShader: 'solid',
    bgColorA: '#0B0F17',
    bgColorB: '#111827',
    ambientDarkness: 0.12,
    ambientColor: '#050814',
    hasSceneSvg: false,
    buildSvg: () =>
      wrapBackdropSvg(`<rect width="560" height="360" fill="#0F172A"/>`),
  },
  {
    id: 'bg_sunset_gradient',
    name: 'Warm Coral Sunset',
    category: 'abstract',
    tags: ['gradient', 'sunset', 'warm', 'coral'],
    backgroundShader: 'solid',
    bgColorA: '#F43F5E',
    bgColorB: '#FB923C',
    ambientDarkness: 0.04,
    ambientColor: '#7C2D12',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_cor)"/>`,
        `<linearGradient id="g_cor" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E11D48"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient>`
      ),
  },
  {
    id: 'bg_mint_breeze',
    name: 'Emerald Mint Gradient',
    category: 'abstract',
    tags: ['gradient', 'mint', 'teal', 'clean'],
    backgroundShader: 'solid',
    bgColorA: '#0D9488',
    bgColorB: '#34D399',
    ambientDarkness: 0,
    ambientColor: '#064E3B',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_mnt)"/>`,
        `<linearGradient id="g_mnt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0F766E"/><stop offset="100%" stop-color="#6EE7B7"/></linearGradient>`
      ),
  },
  {
    id: 'bg_royal_violet',
    name: 'Royal Cosmic Violet',
    category: 'abstract',
    tags: ['violet', 'purple', 'gradient', 'magic'],
    backgroundShader: 'nebula',
    bgColorA: '#2E1065',
    bgColorB: '#6D28D9',
    ambientDarkness: 0.18,
    ambientColor: '#1E1B4B',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(
        `<rect width="560" height="360" fill="url(#g_vio)"/>`,
        `<linearGradient id="g_vio" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2E1065"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient>`
      ),
  },
  {
    id: 'bg_cyber_lab',
    name: 'Cyber Research Lab',
    category: 'urban',
    tags: ['lab', 'science', 'tech', 'futuristic', 'sci-fi'],
    backgroundShader: 'grid',
    bgColorA: '#0B1324',
    bgColorB: '#16243D',
    ambientDarkness: 0.14,
    ambientColor: '#050814',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#0F172A"/>
        <rect x="40" y="50" width="110" height="200" rx="14" fill="#0C4A6E" stroke="#38BDF8" stroke-width="3"/>
        <rect x="410" y="50" width="110" height="200" rx="14" fill="#0C4A6E" stroke="#38BDF8" stroke-width="3"/>
        <circle cx="95" cy="145" r="24" fill="#22D3EE" opacity="0.45"/>
        <circle cx="465" cy="145" r="24" fill="#34D399" opacity="0.45"/>
        <rect x="190" y="75" width="180" height="105" rx="6" fill="#020617" stroke="#334155" stroke-width="3"/>
        <path d="M210 135 L245 110 L275 145 L315 95 L350 125" fill="none" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
        <rect x="0" y="278" width="560" height="82" fill="#1E293B"/>
      `),
  },
  {
    id: 'bg_blueprint_arch',
    name: 'Engineering Blueprint',
    category: 'abstract',
    tags: ['blueprint', 'grid', 'technical', 'blue'],
    backgroundShader: 'grid',
    bgColorA: '#0C4A6E',
    bgColorB: '#075985',
    ambientDarkness: 0.06,
    ambientColor: '#082F49',
    hasSceneSvg: true,
    buildSvg: () =>
      wrapBackdropSvg(`
        <rect width="560" height="360" fill="#0369A1"/>
        <path d="M0 45 H560 M0 90 H560 M0 135 H560 M0 180 H560 M0 225 H560 M0 270 H560 M0 315 H560 M70 0 V360 M140 0 V360 M210 0 V360 M280 0 V360 M350 0 V360 M420 0 V360 M490 0 V360" stroke="#E0F2FE" stroke-width="1" opacity="0.22"/>
        <rect x="24" y="24" width="512" height="312" fill="none" stroke="#E0F2FE" stroke-width="2" opacity="0.45"/>
      `),
  },
];
