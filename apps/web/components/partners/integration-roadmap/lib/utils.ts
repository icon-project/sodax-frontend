// apps/web/components/partners/integration-roadmap/lib/utils.ts
// Helpers for protocol display label and category matching. Keep server-safe slug helpers in `slug.ts`.

import type { CategoryId, ProtocolOverride, RoadmapCategory } from '../types';
import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  GENERIC_DISPLAY_TERMS,
  NOTION_CATEGORY_TO_SCANNER_ID,
  PROTOCOL_OVERRIDES,
} from '@/components/partners/integration-roadmap/data/constants';

/** Find a protocol override by exact or prefix match (handles "Uniswap v4", "Aave v3", etc.). */
export function findProtocolOverride(lowerName: string): ProtocolOverride | undefined {
  if (!lowerName) return undefined;
  if (PROTOCOL_OVERRIDES[lowerName]) return PROTOCOL_OVERRIDES[lowerName];
  for (const [key, override] of Object.entries(PROTOCOL_OVERRIDES)) {
    if (lowerName.startsWith(`${key} `)) return override;
  }
  return undefined;
}

/** Match protocol name to a roadmap category; returns category and whether it was confidently matched. */
export function matchCategory(protocolName: string): { category: RoadmapCategory; matched: boolean } {
  const lower = protocolName.trim().toLowerCase();
  if (!lower) return { category: DEFAULT_CATEGORY, matched: false };

  const override = findProtocolOverride(lower);
  if (override) {
    const cat = CATEGORIES.find(c => c.id === override.categoryId);
    if (cat) return { category: cat, matched: true };
  }

  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) return { category: cat, matched: true };
  }
  return { category: DEFAULT_CATEGORY, matched: false };
}

/**
 * Map a BD CRM (Notion) Category value to Integration Roadmap CategoryId for URL cat= param.
 * Normalizes input (lowercase, trim, collapse spaces). Returns null if no mapping exists.
 */
export function notionCategoryToRoadmapId(notionCategory: string): CategoryId | null {
  const key = notionCategory
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,(\s*)/g, ',');
  return NOTION_CATEGORY_TO_SCANNER_ID[key] ?? null;
}

/** User-facing label: use category title when the input is a generic term; otherwise use the protocol name. */
export function getProtocolDisplayLabel(protocolDisplay: string, category: RoadmapCategory): string {
  const trimmed = protocolDisplay.trim();
  const lower = trimmed.toLowerCase();
  if (!lower) return category.title;
  if (lower === category.title.toLowerCase()) return category.title;
  if (GENERIC_DISPLAY_TERMS.has(lower)) return category.title;
  return trimmed;
}

// --- Notion roadmap fetch (used by the UI; does not affect category matching logic above) ---

export interface NotionRoadmapData {
  protocolDisplay: string;
  categoryId: CategoryId;
  why: string[];
  sdkLayer: string;
  complexity: string;
  integrationSteps: string[];
  chains: string[];
  blockers: string[];
  nextSteps: string;
  timeline: string;
}

export async function fetchNotionRoadmap(protocolSlug: string): Promise<NotionRoadmapData | null> {
  try {
    const res = await fetch(`/api/roadmap/${encodeURIComponent(protocolSlug)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
