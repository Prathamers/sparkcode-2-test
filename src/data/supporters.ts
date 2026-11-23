// SPDX-License-Identifier: AGPL-3.0-or-later
export type SupporterTierId = 'plus' | 'pro' | 'elite';
export type BillingCycle = 'monthly' | 'yearly';

export interface SupporterTier {
  id: SupporterTierId;
  name: string;
  kicker: string;
  badgeName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyNote: string;
  summary: string;
  features: string[];
  ctaLabel: string;
}

export interface EliteSupporter {
  id: string;
  name: string;
  role: string;
  since: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  area: string;
  description: string;
  baseVotes: number;
}

export interface LocalSupporterProfile {
  tier: SupporterTierId;
  billing: BillingCycle;
  displayName: string;
  email: string;
  joinedAt: string;
}

export const SUPPORTER_TIERS: SupporterTier[] = [
  {
    id: 'plus',
    name: 'Plus Contributor',
    kicker: 'Value Tier',
    badgeName: 'PlusBadge',
    monthlyPrice: 3,
    yearlyPrice: 25,
    yearlyNote: 'Save $11/yr vs monthly',
    summary:
      'Back independent, 100% open-source development and keep SparkCode 2 fast, free, and zero-dependency for everyone.',
    features: [
      'PlusBadge displayed on your SparkCode 2 profile and project credits',
      'Directly funds core 60 FPS Canvas renderer and physics maintenance',
      'Keeps SparkCode 2 open-source with zero ads or tracking',
    ],
    ctaLabel: 'Choose Plus Contributor',
  },
  {
    id: 'pro',
    name: 'Pro Contributor',
    kicker: 'Creator & Builder Tier',
    badgeName: 'ProBadge',
    monthlyPrice: 10,
    yearlyPrice: 100,
    yearlyNote: 'Save $20/yr (2 months free)',
    summary:
      'Help steer the SparkCode 2 engine with direct roadmap voting and faster turnaround on bug reports.',
    features: [
      'ProBadge recognition across your studio workspace and exports',
      'Experimental Vector Pen Tool access (exclusively inside the Experimental tab)',
      'Priority bug reports with expedited engine & block triage',
      'Voting access on the public SparkCode 2 feature roadmap',
      'Includes all Plus Contributor benefits',
    ],
    ctaLabel: 'Choose Pro Contributor',
  },
  {
    id: 'elite',
    name: 'Elite Member',
    kicker: 'Founding Patron Tier',
    badgeName: 'Elite Badge',
    monthlyPrice: 20,
    yearlyPrice: 200,
    yearlyNote: 'Save $40/yr (2 months free)',
    summary:
      'Maximum impact for studios, educators, and power users—with full Experimental Labs access, all Pro benefits, and homepage credit.',
    features: [
      'Elite Badge insignia with custom supporter profile styling',
      'Full Experimental Labs: Vector Pen Tool, WebGL2 Hardware Shadow & Bloom Pass & Improved SparkVM',
      'All Pro benefits: ProBadge perks, priority bug reports & roadmap voting',
      'Your name permanently featured under Supporters on the Homepage',
    ],
    ctaLabel: 'Become an Elite Member',
  },
];

export const INITIAL_ELITE_SUPPORTERS: EliteSupporter[] = [
  { id: 'sup_1', name: 'Aarav Kulkarni', role: 'Indie Game Developer', since: '2026' },
  { id: 'sup_2', name: 'Hannah Lindqvist', role: 'CS Educator', since: '2026' },
  { id: 'sup_3', name: 'Mateo Castellanos', role: 'Pixel Artist & Animator', since: '2026' },
  { id: 'sup_4', name: 'Kenji Takahashi', role: 'Open-Source Maintainer', since: '2026' },
  { id: 'sup_5', name: 'Nadia Okafor', role: 'Creative Technologist', since: '2026' },
  { id: 'sup_6', name: 'David Kowalski', role: 'Physics Engine Enthusiast', since: '2026' },
];

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'rm_webgl_lights',
    title: 'WebGL2 Hardware Shadow & Bloom Pass',
    area: 'Renderer',
    description: 'Optional GPU-accelerated normal-mapped lighting while keeping 2D Canvas fallback.',
    baseVotes: 142,
  },
  {
    id: 'rm_tilemap',
    title: 'Native Tilemap & Auto-Tiler Layer',
    area: 'World Editor',
    description: 'Paint collision-ready grid maps with bitmask auto-tiling and parallax layers.',
    baseVotes: 118,
  },
  {
    id: 'rm_html_export',
    title: 'Single-File Standalone HTML5 Game Exporter',
    area: 'Export',
    description: 'Bundle any SparkCode 2 project into a self-contained playable HTML file.',
    baseVotes: 164,
  },
  {
    id: 'rm_synth',
    title: 'Web Audio Chiptune & SFX Block Pack',
    area: 'Audio',
    description: 'Zero-asset procedural sound effects and step-sequencer music blocks.',
    baseVotes: 93,
  },
];

const PROFILE_STORAGE_KEY = 'sparkcode2_supporter_profile_v1';
const ELITE_LIST_STORAGE_KEY = 'sparkcode2_elite_supporters_v1';
const VOTES_STORAGE_KEY = 'sparkcode2_roadmap_votes_v1';

export function loadSupporterProfile(): LocalSupporterProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSupporterProfile;
    if (parsed && parsed.tier && parsed.displayName) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveSupporterProfile(profile: LocalSupporterProfile | null): void {
  try {
    if (!profile) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function loadEliteSupporters(): EliteSupporter[] {
  try {
    const raw = window.localStorage.getItem(ELITE_LIST_STORAGE_KEY);
    if (!raw) return INITIAL_ELITE_SUPPORTERS;
    const custom = JSON.parse(raw) as EliteSupporter[];
    if (!Array.isArray(custom)) return INITIAL_ELITE_SUPPORTERS;
    const merged = [...custom];
    for (const seed of INITIAL_ELITE_SUPPORTERS) {
      if (!merged.some((m) => m.id === seed.id)) {
        merged.push(seed);
      }
    }
    return merged;
  } catch {
    return INITIAL_ELITE_SUPPORTERS;
  }
}

export function addEliteSupporter(name: string, role = 'Elite Member'): EliteSupporter[] {
  const trimmed = name.trim();
  const current = loadEliteSupporters();
  if (!trimmed) return current;

  const existingIdx = current.findIndex(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase()
  );
  const year = String(new Date().getFullYear());
  const nextEntry: EliteSupporter = {
    id: existingIdx >= 0 ? current[existingIdx].id : `sup_user_${Date.now().toString(36)}`,
    name: trimmed,
    role,
    since: year,
  };

  const customOnly = current.filter(
    (s) =>
      !INITIAL_ELITE_SUPPORTERS.some((seed) => seed.id === s.id) &&
      s.name.toLowerCase() !== trimmed.toLowerCase()
  );
  const updatedCustom = [nextEntry, ...customOnly];

  try {
    window.localStorage.setItem(ELITE_LIST_STORAGE_KEY, JSON.stringify(updatedCustom));
  } catch {
    // Ignore storage errors
  }
  return loadEliteSupporters();
}

export function loadRoadmapVotes(): string[] {
  try {
    const raw = window.localStorage.getItem(VOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function saveRoadmapVotes(ids: string[]): void {
  try {
    window.localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}
