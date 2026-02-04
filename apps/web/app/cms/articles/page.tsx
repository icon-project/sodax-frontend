import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { ArticlesListView } from "@/components/cms/articles-list-view";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function ArticlesManagementPage() {
  try {
    await requirePermission("articles");
    return <ArticlesListView />;
  } catch (error) {
    redirect("/cms/dashboard");
  }
}
