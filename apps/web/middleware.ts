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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Agent Readiness: markdown content negotiation ───────────────────────────
  // Rewrite `Accept: text/markdown` requests and `*/index.md` URL suffixes to
  // the dedicated /agent/md handler. Skip framework-internal paths so we don't
  // recurse into our own handler or interfere with API/asset routing.
  if (!isInternalPath(pathname)) {
    const accept = request.headers.get('accept') ?? '';
    const wantsMarkdown = accept.includes('text/markdown');
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

  // Advertise the markdown alternate to agents on every HTML response.
  if (!isInternalPath(pathname)) {
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
