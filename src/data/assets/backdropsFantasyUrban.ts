// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BackdropAssetDef } from '../assetBackdropArt';
import { wrapBackdropSvg } from '../assetSvgHelpers';

export const BACKDROPS_FANTASY_URBAN: BackdropAssetDef[] = [
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
