/**
 * Connect CRM — Notion-backed data layer for `/connect/[slug]` pages.
 *
 * Each row in the Notion "Connect" DB represents a teammate's mobile-first
 * business card. Rows with `Live on website = true` publish at
 * `sodax.com/connect/{slug}`. Unpublished or missing slugs 404.
 *
 * Notion file URLs are presigned S3 links that expire in ~1h, so callers must
 * always re-fetch the entry when the URL itself is consumed (e.g. the avatar
 * proxy route). Page HTML is safe to ISR-cache because it references the
 * stable `/connect/{slug}/avatar` proxy, not the raw S3 URL.
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

interface NotionRichText {
  plain_text: string;
}

interface NotionFile {
  name?: string;
  type: 'file' | 'external';
  file?: { url: string; expiry_time: string };
  external?: { url: string };
}

interface NotionConnectPage {
  id: string;
  properties: {
    Name?: { title: NotionRichText[] };
    slug?: { rich_text: NotionRichText[] };
    Role?: { rich_text: NotionRichText[] };
    Email?: { email: string | null };
    Telegram?: { url: string | null };
    X?: { url: string | null };
    LinkedIn?: { url: string | null };
    'Files & media'?: { files: NotionFile[] };
    'Live on website'?: { checkbox: boolean };
  };
}

export interface ConnectEntry {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  email: string | null;
  telegram: string | null;
  x: string | null;
  linkedin: string | null;
  /** Presigned S3 URL (expires ~1h after fetch). Null if no photo attached. */
  avatarUrl: string | null;
}

function richText(field: { rich_text: NotionRichText[] } | undefined): string {
  return field?.rich_text?.map(t => t.plain_text).join('') ?? '';
}

function titleText(field: { title: NotionRichText[] } | undefined): string {
  return field?.title?.map(t => t.plain_text).join('') ?? '';
}

function resolveFileUrl(file: NotionFile | undefined): string | null {
  if (!file) return null;
  return file.file?.url ?? file.external?.url ?? null;
}

function parseEntry(page: NotionConnectPage): ConnectEntry | null {
  const slug = richText(page.properties.slug).trim().toLowerCase();
  if (!slug) return null;

  return {
    id: page.id,
    slug,
    name: titleText(page.properties.Name).trim(),
    role: richText(page.properties.Role).trim() || null,
    email: page.properties.Email?.email ?? null,
    telegram: page.properties.Telegram?.url ?? null,
    x: page.properties.X?.url ?? null,
    linkedin: page.properties.LinkedIn?.url ?? null,
    avatarUrl: resolveFileUrl(page.properties['Files & media']?.files?.[0]),
  };
}

function connectConfig(): { token: string; dbId: string } | null {
  const token = process.env.NOTION_CONSENSUS_MIAMI_TOKEN;
  const dbId = process.env.NOTION_CONNECT_DB_ID;
  if (!token || !dbId) return null;
  return { token, dbId };
}

async function notionQuery(body: Record<string, unknown>): Promise<NotionConnectPage[]> {
  const cfg = connectConfig();
  if (!cfg) return [];

  try {
    const res = await fetch(`${NOTION_API}/databases/${cfg.dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Revalidate every 5 min. ISR on the page matches this cadence, and is
      // well under Notion's ~1h presigned-URL expiry when URLs surface to
      // clients via the avatar proxy.
      next: { revalidate: 300, tags: ['connect'] },
    });

    if (!res.ok) {
      console.error(`[connect] Notion query failed: ${res.status} ${await res.text()}`);
      return [];
    }

    const data = (await res.json()) as { results: NotionConnectPage[] };
    return data.results;
  } catch (error) {
    console.warn('[connect] Notion fetch error:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Fetch a single published Connect entry by slug. Returns null if the slug
 * doesn't exist OR if the row's `Live on website` checkbox is unchecked.
 */
export async function getConnectEntryBySlug(slug: string): Promise<ConnectEntry | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const pages = await notionQuery({
    filter: {
      and: [
        { property: 'slug', rich_text: { equals: normalized } },
        { property: 'Live on website', checkbox: { equals: true } },
      ],
    },
    page_size: 1,
  });

  const entry = pages[0] ? parseEntry(pages[0]) : null;
  return entry && entry.slug === normalized ? entry : null;
}

/**
 * List all published slugs. Used by `generateStaticParams` to pre-render
 * known pages at build time; new slugs added after build still work
 * on-demand via Next.js dynamic params.
 */
export async function getAllConnectSlugs(): Promise<string[]> {
  const pages = await notionQuery({
    filter: { property: 'Live on website', checkbox: { equals: true } },
    page_size: 100,
  });

  return pages.map(p => richText(p.properties.slug).trim().toLowerCase()).filter((s): s is string => Boolean(s));
}
