import { type NextRequest, NextResponse } from 'next/server';

/**
 * EU/EEA/UK country codes (31 total).
 * Used to determine if the cookie consent banner should be shown.
 */
const EU_EEA_UK_COUNTRY_CODES = new Set([
  // EU (27)
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  // EEA non-EU (3)
  'IS',
  'LI',
  'NO',
  // UK (1)
  'GB',
]);

export function middleware(request: NextRequest) {
  // BD auth: /bd pages show login form in-page when unauthenticated (no redirect).

  // --- Cookie consent region (existing logic, unchanged) ---
  const response = NextResponse.next();

  if (!request.cookies.has('cookie_consent_region')) {
    const country = request.headers.get('x-vercel-ip-country');
    const region = country && EU_EEA_UK_COUNTRY_CODES.has(country) ? 'eu' : 'other';

    response.cookies.set('cookie_consent_region', region, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|zip|toml)).*)'],
};
