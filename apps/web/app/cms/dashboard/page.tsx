import { redirect } from 'next/navigation';
import { CMS_LOGIN_ROUTE, CMS_UNAUTHORIZED_ROUTE } from '@/constants/routes';
import { requireAuth } from '@/lib/auth-utils';
import { CMSDashboard } from '@/components/cms/cms-dashboard';

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const session = await requireAuth();
    return <CMSDashboard session={session} />;
  } catch (error) {
    // If error contains "Forbidden" or "not authorized", redirect to unauthorized page
    if (error instanceof Error && (error.message.includes('Forbidden') || error.message.includes('not authorized'))) {
      redirect(CMS_UNAUTHORIZED_ROUTE);
    }
    // Otherwise redirect to login
    redirect(CMS_LOGIN_ROUTE);
  }
}
