// SPDX-License-Identifier: AGPL-3.0-or-later
import type { SparkProject } from '../types/project';
import { buildBasicProject, buildEmptyProject } from './templates/basic';
import { buildLightingDemoProject } from './templates/lightingDemo';
import { buildPlatformerProject } from './templates/platformer';
import { createBlankProject, createBlankSprite } from './templates/shared';
import { buildSpaceShooterProject } from './templates/spaceShooter';

export interface StarterTemplateMeta {
  id: string;
  name: string;
  description: string;
  group?: 'starter' | 'showcase';
  build: () => SparkProject;
}

export const STARTER_TEMPLATES: StarterTemplateMeta[] = [
  {
    id: 'tpl_platformer',
    name: 'Neon Physics Platformer',
    description: 'Rigid-body jumping, 2D lighting, custom reporter function & particles',
    group: 'showcase',
    build: buildPlatformerProject,
  },
  {
    id: 'tpl_shooter',
    name: 'Particle Space Shooter',
    description: 'Clone lasers, thruster fire emitters & chromatic shockwave FX',
    group: 'showcase',
    build: buildSpaceShooterProject,
  },
  {
    id: 'tpl_lighting',
    name: 'Camera & Lighting Demo',
    description: 'Dynamic spotlight shadows, 2D raycasting & elastic/bounce tweens',
    group: 'showcase',
    build: buildLightingDemoProject,
  },
];

export const STUDIO_LAUNCH_TEMPLATES: StarterTemplateMeta[] = [
  {
    id: 'tpl_empty',
    name: 'Empty',
    description: 'Blank dot-grid canvas with a single sprite and zero pre-placed blocks.',
    group: 'starter',
    build: buildEmptyProject,
  },
  {
    id: 'tpl_basic',
    name: 'Basic',
    description: 'Clean arrow-key movement, collectible star, particle burst, and live score.',
    group: 'starter',
    build: buildBasicProject,
  },
  ...STARTER_TEMPLATES,
];

export { createBlankProject, createBlankSprite };
