import { redirect } from "next/navigation";
import { CMS_DASHBOARD_ROUTE } from "@/constants/routes";
import { requirePermission } from "@/lib/auth-utils";
import { NewsListView } from "@/components/cms/news-list-view";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function NewsManagementPage() {
  try {
    await requirePermission("news");
    return <NewsListView />;
  } catch (error) {
    redirect(CMS_DASHBOARD_ROUTE);
  }
}
