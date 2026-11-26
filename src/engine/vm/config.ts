// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ImprovedVMConfig } from '../../types/project';

export const DEFAULT_IMPROVED_VM_CONFIG: ImprovedVMConfig = {
  enabled: false,
  stepBudget: 256,
  fastSymbolCache: true,
  expandedLimits: true,
};

export function normalizeImprovedVMConfig(cfg?: Partial<ImprovedVMConfig>): ImprovedVMConfig {
  const budget = Number(cfg?.stepBudget ?? DEFAULT_IMPROVED_VM_CONFIG.stepBudget);
  return {
    enabled: Boolean(cfg?.enabled),
    stepBudget: Number.isFinite(budget) ? Math.min(1024, Math.max(128, Math.round(budget))) : 256,
    fastSymbolCache: cfg?.fastSymbolCache ?? DEFAULT_IMPROVED_VM_CONFIG.fastSymbolCache,
    expandedLimits: cfg?.expandedLimits ?? DEFAULT_IMPROVED_VM_CONFIG.expandedLimits,
  };
}
