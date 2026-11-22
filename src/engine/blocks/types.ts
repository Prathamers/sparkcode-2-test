// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockCategory, BlockShape } from '../../types/project';

export interface BlockParamSpec {
  name: string;
  label?: string;
  kind: 'number' | 'string' | 'boolean' | 'select' | 'color' | 'any';
  defaultValue: string | number | boolean;
  options?: string[];
  width?: number;
}

export interface BlockDefinition {
  opcode: string;
  category: BlockCategory;
  shape: BlockShape;
  /** Template tokens separated by {paramName}, e.g. "glide {prop} to {target} over {secs}s ({easing})" */
  template: string;
  params: BlockParamSpec[];
  hasElse?: boolean;
  description: string;
}

export interface CategoryMeta {
  id: BlockCategory;
  label: string;
  color: string;
  border: string;
  text: string;
}

export type InsertPosition = 'before' | 'after' | 'body' | 'else';

export interface RectBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
