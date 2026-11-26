// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BackdropAssetDef } from '../assetBackdropArt';
import { starDots, wrapBackdropSvg } from '../assetSvgHelpers';

export const BACKDROPS_NATURE_SPACE: BackdropAssetDef[] = [
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
];
