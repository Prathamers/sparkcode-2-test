// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockCategory } from '../../types/project';
import type { CategoryMeta } from './types';

export const BLOCK_CATEGORIES: CategoryMeta[] = [
  { id: 'events', label: 'Events', color: '#D97706', border: '#F59E0B', text: '#FFFBEB' },
  { id: 'motion', label: 'Motion', color: '#2563EB', border: '#60A5FA', text: '#EFF6FF' },
  { id: 'looks', label: 'Looks', color: '#7C3AED', border: '#A78BFA', text: '#F5F3FF' },
  { id: 'physics', label: 'Physics', color: '#0D9488', border: '#2DD4BF', text: '#F0FDFA' },
  { id: 'camera', label: 'Camera & FX', color: '#DB2777', border: '#F472B6', text: '#FDF2F8' },
  { id: 'particles', label: 'Particles', color: '#EA580C', border: '#FB923C', text: '#FFF7ED' },
  { id: 'control', label: 'Control', color: '#B45309', border: '#FBBF24', text: '#FFFBEB' },
  { id: 'sensing', label: 'Sensing', color: '#0284C7', border: '#38BDF8', text: '#F0F9FF' },
  { id: 'data', label: 'Data & Dicts', color: '#059669', border: '#34D399', text: '#ECFDF5' },
  { id: 'functions', label: 'My Functions', color: '#E11D48', border: '#FB7185', text: '#FFF1F2' },
];

export const CATEGORY_MAP: Record<BlockCategory, CategoryMeta> = BLOCK_CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<BlockCategory, CategoryMeta>
);
