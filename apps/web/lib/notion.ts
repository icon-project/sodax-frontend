// Lightweight Notion API client - no SDK dependencies

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// Database IDs
export const NOTION_DB = {
  concepts: '2fe8c1d2-979c-808b-8213-edc54b17e8b3',
  system: '2c68c1d2-979c-806c-8153-f7009b55418d',
} as const;

type NotionDB = keyof typeof NOTION_DB;

// Minimal types for what we need
interface NotionRichText {
  plain_text: string;
  href?: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    code: boolean;
  };
}

interface NotionImageBlock {
  type: 'external' | 'file';
  external?: { url: string };
  file?: { url: string };
  caption?: NotionRichText[];
}

interface NotionBlock {
  id: string;
  type: string;
  paragraph?: { rich_text: NotionRichText[] };
  heading_1?: { rich_text: NotionRichText[] };
  heading_2?: { rich_text: NotionRichText[] };
  heading_3?: { rich_text: NotionRichText[] };
  bulleted_list_item?: { rich_text: NotionRichText[] };
  numbered_list_item?: { rich_text: NotionRichText[] };
  quote?: { rich_text: NotionRichText[] };
  code?: { rich_text: NotionRichText[]; language?: string };
  image?: NotionImageBlock;
}

export interface NotionPage {
  id: string;
  properties: {
    Title: { title: [{ plain_text: string }] };
    'One-sentency summary': { rich_text: [{ plain_text: string }] };
    Tags: { multi_select: Array<{ name: string }> };
    Validated: { checkbox: boolean };
  };
  last_edited_time: string;
}

async function notionFetch(endpoint: string, options: RequestInit = {}) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN not set');

  const res = await fetch(`${NOTION_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Notion API error: ${res.status}`);
  }

  return res.json();
}

export async function getNotionPages(db: NotionDB): Promise<NotionPage[]> {
  try {
    const data = await notionFetch(`/databases/${NOTION_DB[db]}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 100 }),
    });

    return data.results;
  } catch (error) {
    // Gracefully return empty during build when NOTION_TOKEN isn't available
    // Pages using ISR will populate at runtime via revalidation
    console.warn(`Failed to fetch Notion ${db} pages:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getNotionPageBySlug(
  db: NotionDB,
  slug: string,
): Promise<{ page: NotionPage; content: string } | null> {
  const pages = await getNotionPages(db);
  const page = pages.find(p => slugify(p.properties.Title.title[0].plain_text) === slug);

  if (!page) return null;

  const blocks = await notionFetch(`/blocks/${page.id}/children`);
  const content = blocksToHtml(blocks.results);

  return { page, content };
}

// Slugify helper
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Convert Notion blocks to simple HTML
function blocksToHtml(blocks: NotionBlock[]): string {
  let html = '';
  let inList = false;

  for (const block of blocks) {
    const { type } = block;

    if (type === 'paragraph' && block.paragraph?.rich_text) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<p>${richTextToHtml(block.paragraph.rich_text)}</p>\n`;
    } else if (type === 'heading_1' && block.heading_1?.rich_text) {
      html += `<h1>${richTextToHtml(block.heading_1.rich_text)}</h1>\n`;
    } else if (type === 'heading_2' && block.heading_2?.rich_text) {
      html += `<h2>${richTextToHtml(block.heading_2.rich_text)}</h2>\n`;
    } else if (type === 'heading_3' && block.heading_3?.rich_text) {
      html += `<h3>${richTextToHtml(block.heading_3.rich_text)}</h3>\n`;
    } else if (type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      html += `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>\n`;
    } else if (type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
      if (!inList) {
        html += '<ol>\n';
        inList = true;
      }
      html += `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>\n`;
    }
  }

  if (inList) html += '</ul>\n';

  return html;
}

function richTextToHtml(richTexts: NotionRichText[]): string {
  return richTexts
    .map(rt => {
      let text = rt.plain_text;
      if (rt.annotations.bold) text = `<strong>${text}</strong>`;
      if (rt.annotations.italic) text = `<em>${text}</em>`;
      if (rt.annotations.code) text = `<code>${text}</code>`;
      return text;
    })
    .join('');
}

// Get all slugs for static generation
export async function getAllSlugs(db: NotionDB): Promise<string[]> {
  const pages = await getNotionPages(db);
  return pages.map(p => slugify(p.properties.Title.title[0].plain_text));
}

// ── Markdown rendering for agent-facing endpoints ──────────────────────────
// Sibling of getNotionPageBySlug / blocksToHtml. Same fetch path, different
// renderer. Block-level allowlist matches docs/agent-readiness.md §7.

export async function getNotionPageBySlugMarkdown(
  db: NotionDB,
  slug: string,
): Promise<{ page: NotionPage; markdown: string } | null> {
  const pages = await getNotionPages(db);
  const page = pages.find(p => slugify(p.properties.Title.title[0].plain_text) === slug);

  if (!page) return null;

  const blocks = await notionFetch(`/blocks/${page.id}/children`);
  const markdown = blocksToMarkdown(blocks.results);

  return { page, markdown };
}

const HTTP_URL_PATTERN = /^https?:\/\//i;

function isSafeHttpUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && HTTP_URL_PATTERN.test(url);
}

function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_{}\[\]()#+\-.!|>])/g, '\\$1');
}

function richTextToMarkdown(richTexts: NotionRichText[]): string {
  return richTexts
    .map(rt => {
      let text = escapeMarkdown(rt.plain_text);
      if (rt.annotations.code) text = `\`${rt.plain_text}\``; // code spans don't escape
      if (rt.annotations.bold) text = `**${text}**`;
      if (rt.annotations.italic) text = `*${text}*`;
      if (isSafeHttpUrl(rt.href)) text = `[${text}](${rt.href})`;
      return text;
    })
    .join('');
}

// Convert Notion blocks to markdown. Allowlist: paragraph, heading_1/2/3,
// bulleted_list_item, numbered_list_item, quote, code, divider, image (with
// http(s) src). Anything else is dropped.
export function blocksToMarkdown(blocks: NotionBlock[]): string {
  const out: string[] = [];
  let numberedCounter = 0;

  for (const block of blocks) {
    const { type } = block;

    if (type === 'paragraph' && block.paragraph?.rich_text) {
      numberedCounter = 0;
      const rendered = richTextToMarkdown(block.paragraph.rich_text);
      if (rendered) out.push(rendered);
    } else if (type === 'heading_1' && block.heading_1?.rich_text) {
      numberedCounter = 0;
      out.push(`# ${richTextToMarkdown(block.heading_1.rich_text)}`);
    } else if (type === 'heading_2' && block.heading_2?.rich_text) {
      numberedCounter = 0;
      out.push(`## ${richTextToMarkdown(block.heading_2.rich_text)}`);
    } else if (type === 'heading_3' && block.heading_3?.rich_text) {
      numberedCounter = 0;
      out.push(`### ${richTextToMarkdown(block.heading_3.rich_text)}`);
    } else if (type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
      numberedCounter = 0;
      out.push(`- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`);
    } else if (type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
      numberedCounter += 1;
      out.push(`${numberedCounter}. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`);
    } else if (type === 'quote' && block.quote?.rich_text) {
      numberedCounter = 0;
      out.push(`> ${richTextToMarkdown(block.quote.rich_text)}`);
    } else if (type === 'code' && block.code?.rich_text) {
      numberedCounter = 0;
      const lang = block.code.language || '';
      const codeText = block.code.rich_text.map(rt => rt.plain_text).join('');
      out.push(`\`\`\`${lang}\n${codeText}\n\`\`\``);
    } else if (type === 'divider') {
      numberedCounter = 0;
      out.push('---');
    } else if (type === 'image' && block.image) {
      numberedCounter = 0;
      const src = block.image.external?.url ?? block.image.file?.url;
      if (isSafeHttpUrl(src)) {
        const alt = block.image.caption ? richTextToMarkdown(block.image.caption) : '';
        out.push(`![${alt}](${src})`);
      }
    }
    // Anything else (raw HTML, embeds, child databases, etc.) is intentionally dropped.
  }

  return out.join('\n\n');
}
