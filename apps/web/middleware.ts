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

/** Secret value the QR code includes: /consensus-miami?ref=booth */
const CONSENSUS_BOOTH_REF = 'booth';
const CONSENSUS_COOKIE = 'consensus_miami_access';

export function middleware(request: NextRequest) {
  // ── Consensus Miami booth gate ──────────────────────────────────────────────
  if (request.nextUrl.pathname === '/consensus-miami') {
    const hasRef = request.nextUrl.searchParams.get('ref') === CONSENSUS_BOOTH_REF;
    const hasCookie = request.cookies.has(CONSENSUS_COOKIE);

    if (hasRef) {
      // Valid QR scan — set cookie, strip the param, redirect clean
      const clean = request.nextUrl.clone();
      clean.searchParams.delete('ref');
      const response = NextResponse.redirect(clean);
      response.cookies.set(CONSENSUS_COOKIE, '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return response;
    }

    if (!hasCookie) {
      // No QR scan, no cookie — redirect to homepage
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  const response = NextResponse.next();

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|zip|toml)).*)'],
};
