// ─── Integration Roadmap — shared TypeScript types ──────────────────────────
// Keep all interfaces here so constants, utils, and components all import from
// a single source of truth. No runtime values live in this file.

import type { Icon } from '@phosphor-icons/react';

// ─── Category ────────────────────────────────────────────────────────────────

export type CategoryId =
  | 'wallets'
  | 'dexs'
  | 'lending'
  | 'perp-yield'
  | 'new-networks'
  | 'solver-marketplaces';

// ─── Data shapes ─────────────────────────────────────────────────────────────

/** A single "Why SODAX" bullet with a scannable headline and supporting copy. */
export interface WhyBullet {
  headline: string;
  copy: string;
}

export interface RoadmapCategory {
  id: CategoryId;
  title: string;
  description: string;
  /** Phosphor icon component rendered in the category card. */
  icon: Icon;
  /** Keywords used to auto-match a free-text protocol name to this category. */
  keywords: string[];
}

export interface SdkLayer {
  name: string;
  package: string;
  labels: string[];
  docUrl: string;
}

/** Protocol-specific overrides that take priority over keyword matching. */
export interface ProtocolOverride {
  categoryId: CategoryId;
  /** If provided, replaces the default "Why SODAX" bullets for this protocol. */
  customWhy?: WhyBullet[];
}

// ─── BD Composer state ───────────────────────────────────────────────────────

/** All fields that the BD Composer panel can write to a shareable URL. */
export interface BdConfig {
  /** BD person's first name, used as the signature. */
  fromName: string;
  /** Team / company suffix displayed after the name (default: "from SODAX"). */
  fromSuffix: string;
  /** Free-text personal note shown at the top of the prospect's roadmap. */
  note: string;
  /** Optional timeline override (e.g. "1–2 weeks (agreed in call)"). */
  timeline: string;
  /** Single extra "Why SODAX" bullet appended to the default list. */
  customWhy: string;
  /** Comma-separated list of prospect's target chains, shown in the Networks card. */
  chains: string;
  /** Full replacement list for the "Why SODAX" bullets (set via Customize panel). */
  whyOverrides: string[];
  /** Full replacement list for the integration steps (set via Customize panel). */
  stepsOverrides: string[];
}

// ─── Roadmap state ───────────────────────────────────────────────────────────

/** The computed result shown after the user hits "Generate roadmap". */
export interface RoadmapState {
  category: RoadmapCategory;
  /** The name to display (protocol name, or category title for generic input). */
  protocolDisplay: string;
  /** Whether we found a confident category match; false shows a "couldn't identify" notice. */
  matched: boolean;
}

export type RoadmapView = 'public' | 'prospect' | 'bd';
