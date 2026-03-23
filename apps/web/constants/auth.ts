/** Cookie name used to authenticate BD access to the integration roadmap. */
export const BD_AUTH_COOKIE = 'bd_auth';

/**
 * Generates a secure token to store in the BD auth cookie.
 *
 * WHY NOT JUST STORE THE PASSWORD IN THE COOKIE?
 * If we stored BD_PASSWORD directly in the cookie and the cookie was ever
 * leaked (e.g. in a server log, a proxy, or a browser devtools screenshot),
 * an attacker would immediately have the real password and could log in.
 *
 * WHAT IS AN HMAC TOKEN?
 * HMAC (Hash-based Message Authentication Code) is a one-way fingerprint.
 * Think of it like a wax seal: you combine the password + a secret key and
 * run them through a hash function to get a fixed-length string (the token).
 * - You cannot reverse the token back to the password.
 * - The same inputs always produce the same token, so the server can re-derive
 *   it on every request and compare — no need to store anything in a database.
 * - Changing BD_COOKIE_SECRET instantly invalidates all existing cookies
 *   (forces everyone to log in again), which is useful if you suspect a leak.
 *
 * HOW IT WORKS HERE:
 * 1. User enters the passcode → POST /api/bd-auth
 * 2. Server checks the passcode is correct, then derives the HMAC token and
 *    stores it in an httpOnly cookie (JS cannot read httpOnly cookies).
 * 3. On each BD page render, the server re-derives the same token and checks
 *    it matches what's in the cookie. If yes → authenticated.
 *
 * REQUIRED ENV VARS (set in .env and in Vercel):
 *   BD_PASSWORD       — the passcode users type to get in
 *   BD_COOKIE_SECRET  — a random 32-byte hex string used as the HMAC key.
 *                       Generate one with: openssl rand -hex 32
 *                       Keep it secret — anyone with this value can forge cookies.
 *
 * Returns null if either env var is missing (the pages treat null as "no auth
 * configured" and allow access, matching the existing no-password behaviour).
 */
export async function deriveBdToken(): Promise<string | null> {
  const password = process.env.BD_PASSWORD;
  const secret = process.env.BD_COOKIE_SECRET;
  if (!password || !secret) return null;

  // Import the secret as a key for HMAC-SHA256.
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  // Sign the password with that key → produces a 32-byte signature.
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(password));

  // Convert the raw bytes to a hex string (e.g. "a3f9c2...") — safe to store in a cookie.
  return Buffer.from(sig).toString('hex');
}
