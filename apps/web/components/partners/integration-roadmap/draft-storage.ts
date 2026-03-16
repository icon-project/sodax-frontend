// apps/web/components/partners/integration-roadmap/draft-storage.ts
// Persist BD Composer options to localStorage so they can be restored after reload or when opening the BD page with no URL params.

import type { BdConfig } from './types';
import { DEFAULT_FROM_SUFFIX } from './constants';

export const BD_DRAFT_STORAGE_KEY = 'sodax-bd-composer-draft';

export function loadDraftFromStorage(): BdConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BD_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return null;
    const o = data as Record<string, unknown>;
    return {
      fromName: typeof o.fromName === 'string' ? o.fromName : '',
      fromSuffix: typeof o.fromSuffix === 'string' ? o.fromSuffix : DEFAULT_FROM_SUFFIX,
      note: typeof o.note === 'string' ? o.note : '',
      timeline: typeof o.timeline === 'string' ? o.timeline : '',
      customWhy: typeof o.customWhy === 'string' ? o.customWhy : '',
      chains: typeof o.chains === 'string' ? o.chains : '',
      whyOverrides: Array.isArray(o.whyOverrides)
        ? o.whyOverrides.filter((x): x is string => typeof x === 'string')
        : [],
      stepsOverrides: Array.isArray(o.stepsOverrides)
        ? o.stepsOverrides.filter((x): x is string => typeof x === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

export function saveDraftToStorage(config: BdConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BD_DRAFT_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}
