// apps/web/components/partners/integration-roadmap/slug.ts
// Server-safe protocol slug helpers (no UI/icon imports).

/** Slug for URL path: e.g. "Hana Wallet" → "hana-wallet", "Uniswap" → "uniswap". */
export function slugifyProtocol(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'roadmap'
  );
}

/** Display name from path slug: e.g. "hana-wallet" → "Hana Wallet". */
export function slugToDisplay(slug: string): string {
  return slug
    .split('-')
    .map(part => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
    .filter(Boolean)
    .join(' ');
}

