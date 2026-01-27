import { auth } from "./auth";
import { headers } from "next/headers";
import { type CMSPermission, getUserPermissions } from "./permissions";
import { db } from "./auth";

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
 * Middleware to verify user is authenticated and whitelisted
 * Only users who have been added to the database can access CMS
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized: No active session");
  }

  // Check if user exists in database and has valid role assigned (whitelist check)
  const usersCollection = db.collection("user");
  const existingUser = await usersCollection.findOne({ 
    email: session.user.email 
  });

  // User must exist AND have a valid role (admin or user) to access CMS
  const hasValidRole = existingUser?.role && ["admin", "user"].includes(existingUser.role);
  
  if (!existingUser || !hasValidRole) {
    // Delete the auto-created user record if they're not whitelisted
    if (existingUser && !hasValidRole) {
      await usersCollection.deleteOne({ email: session.user.email });
    }
    throw new Error("Forbidden: User not authorized for CMS access");
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

/**
 * Middleware to verify user has specific permission
 * Throws error if permission not granted
 */
export async function requirePermission(permission: CMSPermission) {
  const session = await requireAuth();
  const permissions = getUserPermissions(session.user);

  if (!permissions.includes(permission)) {
    throw new Error(`Forbidden: ${permission} permission required`);
  }

  return session;
}

/**
 * Middleware to verify user has any of the specified permissions
 * Throws error if no permissions match
 */
export async function requireAnyPermission(requiredPermissions: CMSPermission[]) {
  const session = await requireAuth();
  const permissions = getUserPermissions(session.user);

  const hasAccess = requiredPermissions.some(p => permissions.includes(p));
  if (!hasAccess) {
    throw new Error(`Forbidden: One of [${requiredPermissions.join(", ")}] permissions required`);
  }

  return session;
}
