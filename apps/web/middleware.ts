import { type NextRequest, NextResponse } from 'next/server';

/**
 * EU/EEA/UK country codes (31 total).
 * Used to determine if the cookie consent banner should be shown.
 */
// biome-ignore format: compact country code table is more readable
const EU_EEA_UK_COUNTRY_CODES = new Set([
  // EU (27)
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA non-EU (3)
  'IS', 'LI', 'NO',
  // UK (1)
  'GB',
]);

// Static literal — guardrail §3 forbids interpolating request data into
// response headers. Agents append `/index.md` to the current path to fetch
// the markdown alternate.
const MARKDOWN_LINK_HEADER = '</index.md>; rel="alternate"; type="text/markdown"';

function isInternalPath(pathname: string): boolean {
  return pathname.startsWith('/agent') || pathname.startsWith('/api') || pathname.startsWith('/_next');
}

// Endpoints that already serve agent-native formats (llms.txt, sitemap, RSS,
// robots, .well-known/*) — they must not be rewritten to /agent/md even when
// the caller sends `Accept: text/markdown`. Their own routes set the right
// Content-Type and headers.
const AGENT_NATIVE_PATHS = new Set(['/llms.txt', '/llms-full.txt', '/sitemap.xml', '/robots.txt']);

function isAgentNativePath(pathname: string): boolean {
  if (AGENT_NATIVE_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/.well-known/')) return true;
  if (pathname.endsWith('/feed.xml')) return true;
  return false;
}

/**
 * Parse an HTTP Accept header into a media-type → q-value map (RFC 9110 §12.5.1).
 * Quality values default to 1.0 when the `q` parameter is absent. Invalid q
 * values are treated as 1.0 rather than rejecting the entry.
 */
function parseAcceptHeader(value: string): Map<string, number> {
  const entries = new Map<string, number>();
  for (const segment of value.split(',')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(';').map(p => p.trim());
    const mediaType = parts[0]?.toLowerCase();
    if (!mediaType) continue;
    let quality = 1;
    for (const param of parts.slice(1)) {
      const [key, raw] = param.split('=').map(p => p.trim());
      if (key === 'q' && raw) {
        const parsed = Number.parseFloat(raw);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) quality = parsed;
      }
    }
    entries.set(mediaType, quality);
  }
  return entries;
}

/**
 * Returns true when the Accept header explicitly prefers `text/markdown`
 * over `text/html`. Required so `Accept: text/html,text/markdown;q=0.5`
 * still serves HTML (q-value precedence per RFC 9110).
 *
 * `*\/*` is intentionally NOT honoured for markdown — a "give me anything"
 * request should serve the default representation (HTML); markdown requires
 * an explicit opt-in.
 */
function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;
  const accepts = parseAcceptHeader(acceptHeader);
  const markdownQ = accepts.get('text/markdown');
  if (markdownQ === undefined || markdownQ === 0) return false;
  const htmlQ = accepts.get('text/html') ?? accepts.get('text/*') ?? 0;
  return markdownQ >= htmlQ;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Agent Readiness: markdown content negotiation ───────────────────────────
  // Rewrite `Accept: text/markdown` requests and `*/index.md` URL suffixes to
  // the dedicated /agent/md handler. Skip framework-internal paths so we don't
  // recurse into our own handler or interfere with API/asset routing. Skip
  // agent-native endpoints (llms.txt, sitemap, .well-known/*) — they already
  // serve the right format and Content-Type from their own route handlers.
  if (!isInternalPath(pathname) && !isAgentNativePath(pathname)) {
    const wantsMarkdown = prefersMarkdown(request.headers.get('accept'));
    const isIndexMd = pathname === '/index.md' || pathname.endsWith('/index.md');

    if (wantsMarkdown || isIndexMd) {
      const targetPath = isIndexMd ? pathname.replace(/\/index\.md$/, '') || '/' : pathname;
      const url = request.nextUrl.clone();
      url.pathname = '/agent/md';
      url.search = '';
      // Pass the target path via a request header — search params don't survive
      // middleware rewrites reliably across Next.js runtimes.
      const rewriteHeaders = new Headers(request.headers);
      rewriteHeaders.set('x-agent-md-path', targetPath);
      return NextResponse.rewrite(url, { request: { headers: rewriteHeaders } });
    }
  }

  // ── Consensus Miami kill switch ─────────────────────────────────────────────
  // Set CONSENSUS_MIAMI_ENABLED=false in Vercel to disable the page (redirects
  // to homepage). Any other value — including missing — means enabled.
  if (pathname.startsWith('/consensus-miami') && process.env.CONSENSUS_MIAMI_ENABLED === 'false') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Forward x-pathname to server components (lets layout / RSC read the
  // current pathname without re-parsing).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Advertise the markdown alternate to agents on every HTML response. Skip
  // agent-native endpoints (llms.txt, sitemap.xml, etc.) — they already speak
  // an agent-readable format and a `</index.md>` alternate would point at the
  // homepage, not their own content.
  if (!isInternalPath(pathname) && !isAgentNativePath(pathname)) {
    response.headers.set('Link', MARKDOWN_LINK_HEADER);
  }

  // Only set the cookie if it hasn't been set yet
  if (request.cookies.has('cookie_consent_region')) {
    return response;
  }

  // Vercel injects geo data as request headers; undefined in local dev (defaults to 'other' → no banner)
  const country = request.headers.get('x-vercel-ip-country');
  const region = country && EU_EEA_UK_COUNTRY_CODES.has(country) ? 'eu' : 'other';

  response.cookies.set('cookie_consent_region', region, {
    httpOnly: false, // Client JS must read this cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}

export const config = {
  // biome-ignore format: keep original multi-line format to minimise PR diff
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|zip|toml)).*)',
  ],
};
