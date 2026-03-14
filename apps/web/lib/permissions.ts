/**
 * CMS Permission Types
 */
export type CMSPermission = "news" | "articles" | "glossary";

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: CMSPermission[];
}

/**
 * Parse permissions from session user
 */
export function parsePermissions(permissionsString: string | undefined): CMSPermission[] {
  if (!permissionsString) return [];
  
  try {
    const parsed = JSON.parse(permissionsString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: CMSPermission[],
  required: CMSPermission
): boolean {
  return permissions.includes(required);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  permissions: CMSPermission[],
  required: CMSPermission[]
): boolean {
  return required.some(p => permissions.includes(p));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(
  permissions: CMSPermission[],
  required: CMSPermission[]
): boolean {
  return required.every(p => permissions.includes(p));
}

/**
 * Admin always has all permissions
 */
export function getUserPermissions(user: {
  role?: string | null;
  permissions?: string | null;
}): CMSPermission[] {
  if (user.role === "admin") {
    return ["news", "articles", "glossary"];
  }
  
  return parsePermissions(user.permissions || undefined);
}
