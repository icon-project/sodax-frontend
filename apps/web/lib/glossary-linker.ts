import { cache } from 'react';
import { getNotionPages, slugify } from './notion';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  /** The display name of the glossary entry (e.g. "Solver") */
  term: string;
  /** The internal URL path (e.g. "/system/solver") */
  url: string;
  /** Optional one-sentence summary shown as a tooltip on hover */
  summary?: string;
}

// ─── Glossary term fetching (cached per-request) ────────────────────────────

/**
 * Fetches all glossary terms from both Notion databases (concepts + system).
 * Wrapped with React `cache()` for per-request deduplication so multiple
 * calls during the same ISR render don't re-fetch from Notion.
 */
export const getGlossaryTerms = cache(async (): Promise<GlossaryTerm[]> => {
  const [concepts, system] = await Promise.all([getNotionPages('concepts'), getNotionPages('system')]);

  const terms: GlossaryTerm[] = [];

  for (const page of concepts) {
    const title = page.properties.Title.title[0]?.plain_text;
    if (!title) continue;
    terms.push({
      term: title,
      url: `/concepts/${slugify(title)}`,
      summary: page.properties['One-sentency summary'].rich_text[0]?.plain_text || undefined,
    });
  }

  for (const page of system) {
    const title = page.properties.Title.title[0]?.plain_text;
    if (!title) continue;
    terms.push({
      term: title,
      url: `/system/${slugify(title)}`,
      summary: page.properties['One-sentency summary'].rich_text[0]?.plain_text || undefined,
    });
  }

  return terms;
});

// ─── HTML glossary auto-linker ──────────────────────────────────────────────

/**
 * Tags whose text content should NEVER be turned into a glossary link.
 * - `a`      → already a link; nesting <a> inside <a> is invalid HTML
 * - `code/pre` → code blocks should stay verbatim
 * - `h1`–`h6`  → linking headings is unusual and hurts readability
 */
const NO_LINK_TAGS = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/** Matches opening, closing, and self-closing HTML tags */
const HTML_TAG_RE = /<\/?[a-z][a-z0-9]*(?:\s[^>]*)?\/?>/gi;

/**
 * Injects glossary hyperlinks into already-sanitised HTML content.
 *
 * How it works:
 * 1. Terms are sorted longest-first so "Money Market" is matched before "Money".
 * 2. For each term the HTML is tokenised into tags vs text segments.
 * 3. A simple stack tracks whether we are inside a no-link element.
 * 4. Up to `maxLinksPerTerm` whole-word, case-insensitive matches in text
 *    segments are wrapped in `<a>` tags pointing to the glossary page.
 * 5. Because each term pass re-tokenises the (updated) HTML, links injected
 *    for earlier terms are correctly treated as `<a>` no-link zones for later
 *    terms — so there is no risk of double-linking.
 *
 * @param html              Sanitised HTML string (from sanitize-html)
 * @param terms             Array of glossary terms to link
 * @param maxLinksPerTerm   Maximum number of links per term (default 2)
 */
export function injectGlossaryLinks(html: string, terms: GlossaryTerm[], maxLinksPerTerm = 2): string {
  if (!terms.length || !html) return html;

  // Longest terms first to prevent partial matches
  const sorted = [...terms].sort((a, b) => b.term.length - a.term.length);

  let result = html;
  for (const term of sorted) {
    result = linkSingleTerm(result, term, maxLinksPerTerm);
  }
  return result;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

interface Segment {
  isTag: boolean;
  content: string;
}

/**
 * Processes a single glossary term against the full HTML, returning
 * the HTML with up to `maxLinks` occurrences wrapped in anchor tags.
 */
function linkSingleTerm(html: string, term: GlossaryTerm, maxLinks: number): string {
  // ── Tokenise ──────────────────────────────────────────────────────────
  const segments: Segment[] = [];
  let lastIdx = 0;
  HTML_TAG_RE.lastIndex = 0;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = HTML_TAG_RE.exec(html)) !== null) {
    if (tagMatch.index > lastIdx) {
      segments.push({ isTag: false, content: html.slice(lastIdx, tagMatch.index) });
    }
    segments.push({ isTag: true, content: tagMatch[0] });
    lastIdx = HTML_TAG_RE.lastIndex;
  }
  if (lastIdx < html.length) {
    segments.push({ isTag: false, content: html.slice(lastIdx) });
  }

  // ── Prepare term regex ────────────────────────────────────────────────
  const escaped = term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const termRe = new RegExp(`\\b(${escaped})\\b`, 'gi');

  // ── Pass 1: Collect ALL eligible match positions ──────────────────────
  // Each match is { segIdx, matchIdx, matchEnd, originalText }
  interface MatchPos {
    segIdx: number;
    matchIdx: number;
    matchEnd: number;
    originalText: string;
  }

  const noLinkStack: string[] = [];
  const allMatches: MatchPos[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] as Segment;

    if (seg.isTag) {
      const parsed = seg.content.match(/^<\/?([a-z][a-z0-9]*)/i);
      if (parsed?.[1]) {
        const name = parsed[1].toLowerCase();
        if (NO_LINK_TAGS.has(name)) {
          if (seg.content.startsWith('</')) {
            if (noLinkStack.length > 0 && noLinkStack[noLinkStack.length - 1] === name) {
              noLinkStack.pop();
            }
          } else if (!seg.content.endsWith('/>')) {
            noLinkStack.push(name);
          }
        }
      }
      continue;
    }

    // Skip text inside no-link elements
    if (noLinkStack.length > 0) continue;

    termRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = termRe.exec(seg.content)) !== null) {
      allMatches.push({
        segIdx: i,
        matchIdx: m.index,
        matchEnd: termRe.lastIndex,
        originalText: m[1] ?? m[0],
      });
    }
  }

  // Nothing to link
  if (allMatches.length === 0) return html;

  // ── Pick evenly-spaced matches ────────────────────────────────────────
  // e.g. 5 matches, maxLinks=2 → pick indices 1 and 3 (roughly ⅓ and ⅔)
  const chosen = pickSpread(allMatches.length, maxLinks);
  const chosenSet = new Set(chosen);

  // ── Pass 2: Rebuild HTML, applying only chosen matches ────────────────
  // Group chosen matches by segment index for efficient lookup
  const matchesBySeg = new Map<number, MatchPos[]>();
  for (let i = 0; i < allMatches.length; i++) {
    if (!chosenSet.has(i)) continue;
    const mp = allMatches[i] as MatchPos;
    const list = matchesBySeg.get(mp.segIdx) ?? [];
    list.push(mp);
    matchesBySeg.set(mp.segIdx, list);
  }

  const out: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] as Segment;
    const segMatches = matchesBySeg.get(i);

    if (seg.isTag || !segMatches || segMatches.length === 0) {
      out.push(seg.content);
      continue;
    }

    // Sort matches by position within the segment
    segMatches.sort((a, b) => a.matchIdx - b.matchIdx);

    let result = '';
    let cursor = 0;
    for (const mp of segMatches) {
      result += seg.content.slice(cursor, mp.matchIdx);
      const titleAttr = term.summary ? ` title="${escapeHtmlAttr(term.summary)}"` : '';
      result += `<a href="${term.url}"${titleAttr}>${mp.originalText}</a>`;
      cursor = mp.matchEnd;
    }
    result += seg.content.slice(cursor);
    out.push(result);
  }

  return out.join('');
}

/**
 * Given `total` items, picks up to `max` evenly-spaced indices.
 * Examples:
 *   pickSpread(1, 2) → [0]           — only 1 match, use it
 *   pickSpread(2, 2) → [0, 1]        — both
 *   pickSpread(5, 2) → [1, 3]        — roughly ⅓ and ⅔ through the article
 *   pickSpread(8, 2) → [2, 5]        — spread across the piece
 */
function pickSpread(total: number, max: number): number[] {
  const count = Math.min(total, max);
  if (count === total) return Array.from({ length: total }, (_, i) => i);

  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    // Distribute evenly: (i+1)/(count+1) of the way through
    indices.push(Math.round(((i + 1) * (total - 1)) / (count + 1)));
  }
  return indices;
}

/** Escapes a string for safe use inside an HTML attribute value. */
function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
