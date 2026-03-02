import { redirect } from "next/navigation";
import { CMS_DASHBOARD_ROUTE } from "@/constants/routes";
import { requireAdmin } from "@/lib/auth-utils";
import { UserManagement } from "@/components/cms/user-management";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  try {
    await requireAdmin();
    return <UserManagement />;
  } catch (error) {
    redirect(CMS_DASHBOARD_ROUTE);
  }
}
