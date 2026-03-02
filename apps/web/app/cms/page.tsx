import { redirect } from "next/navigation";
import { CMS_DASHBOARD_ROUTE, CMS_LOGIN_ROUTE } from "@/constants/routes";
import { getServerSession } from "@/lib/auth-utils";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function CMSIndexPage() {
  const session = await getServerSession();
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect(CMS_LOGIN_ROUTE);
  }
  
  // Redirect to dashboard if authenticated
  redirect(CMS_DASHBOARD_ROUTE);
}
