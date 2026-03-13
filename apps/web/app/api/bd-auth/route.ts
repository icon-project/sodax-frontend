import { NextResponse } from 'next/server';

const BD_PASSWORD = process.env.BD_PASSWORD;
const BD_COOKIE = 'bd_auth';

export async function POST(req: Request) {
  const { password } = await req.json();

  if (!BD_PASSWORD || password !== BD_PASSWORD) {
    return NextResponse.json({ error: 'wrong password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(BD_COOKIE, BD_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
