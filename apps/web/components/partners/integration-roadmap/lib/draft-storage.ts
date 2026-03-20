// Persist BD Composer options to localStorage so they can be restored after reload or when opening the BD page with no URL params.

import type { BdConfig } from '../types';
import { DEFAULT_FROM_SUFFIX } from '@/components/partners/integration-roadmap/data/constants';

export const BD_DRAFT_STORAGE_KEY = 'sodax-bd-composer-draft';

export function loadDraftFromStorage(): BdConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BD_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return null;
    const draft = data as Record<string, unknown>;
    return {
      fromName: typeof draft.fromName === 'string' ? draft.fromName : '',
      fromSuffix:
        typeof draft.fromSuffix === 'string' ? draft.fromSuffix : DEFAULT_FROM_SUFFIX,
      note: typeof draft.note === 'string' ? draft.note : '',
      timeline: typeof draft.timeline === 'string' ? draft.timeline : '',
      customWhy: typeof draft.customWhy === 'string' ? draft.customWhy : '',
      chains: typeof draft.chains === 'string' ? draft.chains : '',
      whyOverrides: Array.isArray(draft.whyOverrides)
        ? draft.whyOverrides.filter((x): x is string => typeof x === 'string')
        : [],
      stepsOverrides: Array.isArray(draft.stepsOverrides)
        ? draft.stepsOverrides.filter((x): x is string => typeof x === 'string')
        : [],
      nextStep: typeof draft.nextStep === 'string' ? draft.nextStep : '',
      blockerNote: typeof draft.blockerNote === 'string' ? draft.blockerNote : '',
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
