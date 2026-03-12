/**
 * Centralized route constants for the web app.
 *
 * Use these instead of hardcoding paths or URLs (e.g. href={NEWS_ROUTE},
 * router.push(SWAP_ROUTE)). When adding a link used in more than one place—or
 * that you might change later—add it here and import from '@/constants/routes'.
 */

// ── In-app routes (same-origin paths) ───────────────────────────────────────
export const HOME_ROUTE = '/';
export const SWAP_ROUTE = '/swap';
export const SAVE_ROUTE = '/save';
export const LOANS_ROUTE = '/loans';
export const STAKE_ROUTE = '/stake';
export const POOL_ROUTE = '/pool';
export const MIGRATE_ROUTE = '/migrate';
export const GLOSSARY_ROUTE = '/glossary';
export const PARTNERS_ROUTE = '/partners';
/** Integration Roadmap: type protocol name, get visual integration roadmap (partners). */
export const INTEGRATION_ROADMAP_ROUTE = '/partners/integration-roadmap';
/** BD-only view of the Integration Roadmap (clean URL; no ?bd=1). */
export const INTEGRATION_ROADMAP_BD_ROUTE = `${INTEGRATION_ROADMAP_ROUTE}/bd`;
export const NEWS_ROUTE = '/news';
export const COMMUNITY_ROUTE = '/community';
export const PARTNER_DASHBOARD_ROUTE = '/partner-dashboard';
/** In-app page that redirects to Discord invite; use DISCORD_ROUTE for external links. */
export const DISCORD_PAGE_ROUTE = '/discord';

/** True when pathname is the partner dashboard or a sub-route. */
export function isPartnerRoute(pathname: string): boolean {
  return pathname === PARTNER_DASHBOARD_ROUTE || pathname.startsWith(`${PARTNER_DASHBOARD_ROUTE}/`);
}

// ── News category and feed (in-app, under /news) ───────────────────────────
export const PRODUCT_UPDATES_ROUTE = '/news?category=product';
export const PARTNERSHIPS_ROUTE = '/news?category=partnerships';
export const COMMUNITY_NEWS_ROUTE = '/news?category=community';
export const TECHNICAL_UPDATES_ROUTE = '/news?category=technical';
export const SUBSCRIBE_VIA_RSS_ROUTE = '/news/feed.xml';

// ── CMS (admin, under /cms) ────────────────────────────────────────────────
export const CMS_DASHBOARD_ROUTE = '/cms/dashboard';
export const CMS_LOGIN_ROUTE = '/cms/login';
export const CMS_UNAUTHORIZED_ROUTE = '/cms/unauthorized';
export const CMS_NEWS_ROUTE = '/cms/news';
export const CMS_NEWS_NEW_ROUTE = '/cms/news/new';
export const CMS_GLOSSARY_ROUTE = '/cms/glossary';
export const CMS_GLOSSARY_NEW_ROUTE = '/cms/glossary/new';
export const CMS_ARTICLES_ROUTE = '/cms/articles';
export const CMS_ARTICLES_NEW_ROUTE = '/cms/articles/new';
export const CMS_USERS_ROUTE = '/cms/users';

// ── Documentation (external) ─────────────────────────────────────────────────
/** Canonical product & developer docs (docs.sodax.com). */
export const DOCUMENTATION_ROUTE = 'https://docs.sodax.com';
/** Legacy GitBook; prefer DOCUMENTATION_ROUTE for primary docs. */
export const DOCUMENTATION_GITBOOK_ROUTE = 'https://sodax-1.gitbook.io/sodax-docs/readme-1';

// ── Social & community (external) ──────────────────────────────────────────
export const DISCORD_ROUTE = 'https://discord.com/invite/xM2Nh4S6vN';
export const X_ROUTE = 'https://x.com/gosodax';
/** X (Twitter) “follow” intent URL. */
export const X_INTENT_FOLLOW_ROUTE = 'https://x.com/intent/user?screen_name=gosodax';
export const LINKTREE_ROUTE = 'https://linktr.ee/go.sodax';
export const REDDIT_ROUTE = 'https://www.reddit.com/r/SODAX/';
export const YOUTUBE_ROUTE = 'https://www.youtube.com/@gosodax';

// ── External apps & partners ───────────────────────────────────────────────
export const BALANCED_DEFI_ROUTE = 'https://app.balanced.network/';
export const HANA_WALLET_ROUTE = 'https://www.hanawallet.io/';

// ── Resources & tools (external) ───────────────────────────────────────────
/** Frontend repo (this app). */
export const GITHUB_ROUTE = 'https://github.com/icon-project/sodax-frontend';
/** Main SODAX SDK / monorepo (e.g. partner CTA “Explore SDKs”). */
export const GITHUB_SODAX_REPO_ROUTE = GITHUB_ROUTE;
/** Demo app source (run locally); used in Integration Roadmap Code & resources. */
export const DEMO_APP_GITHUB_ROUTE = 'https://github.com/icon-project/sodax-frontend/tree/main/apps/demo';
export const SODAX_SCAN_ROUTE = 'https://sodaxscan.com/';
export const SODAX_SCAN_TOKEN_ROUTE = 'https://sonicscan.org/token/0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963';
export const BRAND_KIT_ROUTE = '/SODAX.logos.and.token.zip';

// ── SODAX portals & share ───────────────────────────────────────────────────
/** Builders portal (MCP, tools); use for “Build with SODAX” / builder links. */
export const BUILDERS_PORTAL_ROUTE = 'https://builders.sodax.com';
/** Reddit share base URL (append ?url=…&title=…). */
export const REDDIT_SUBMIT_BASE_ROUTE = 'https://reddit.com/submit';

// Partner-specific URLs (lightlink, amped, etc.) live in partner pages; add here
// only if reused. Explorer base URLs stay in config (web3.ts, chain-explorers.ts).
