import { auth } from "./auth";
import { headers } from "next/headers";

/**
 * Server-side session verification utility
 * Returns session if authenticated, null otherwise
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/**
 * Middleware to verify user is authenticated and has @sodax.com email
 * Throws error if unauthorized
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized: No active session");
  }

  const email = session.user.email;
  if (!email?.endsWith("@sodax.com")) {
    throw new Error("Forbidden: Only @sodax.com users allowed");
  }

  return session;
}

/**
 * Middleware to verify user is admin
 * Throws error if not admin
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return session;
}
