// Partner dashboard route only for now. Centralized so path changes apply everywhere.

export const PARTNER_DASHBOARD_ROUTE = '/partner-dashboard';

/** Returns true when the path is the partner dashboard or a sub-route. */
export function isPartnerRoute(pathname: string): boolean {
  return pathname === PARTNER_DASHBOARD_ROUTE || pathname.startsWith(`${PARTNER_DASHBOARD_ROUTE}/`);
}
