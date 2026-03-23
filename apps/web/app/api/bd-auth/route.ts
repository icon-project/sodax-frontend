import { NextResponse } from 'next/server';
import { BD_AUTH_COOKIE, deriveBdToken } from '@/constants/auth';

const BD_PASSWORD = process.env.BD_PASSWORD;

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter: max 5 attempts per IP per 60 s window.
// Serverless functions are short-lived, so this is a best-effort guard rather
// than a strict guarantee — it stops casual brute-force without adding infra.
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

const attempts = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

export async function POST(req: Request) {
  // Rate limit by IP (Vercel sets x-forwarded-for; fall back to 'unknown').
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed, retryAfterSec } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'too many attempts' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    });
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!BD_PASSWORD || password !== BD_PASSWORD) {
    return NextResponse.json({ error: 'wrong password' }, { status: 401 });
  }

  // Derive HMAC token — never store the raw password in the cookie.
  const token = await deriveBdToken();
  if (!token) {
    return NextResponse.json({ error: 'server misconfiguration' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(BD_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
