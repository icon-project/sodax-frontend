import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { ArticlesListView } from "@/components/cms/articles-list-view";

export default async function ArticlesManagementPage() {
  try {
    await requirePermission("articles");
    return <ArticlesListView />;
  } catch (error) {
    redirect("/cms/dashboard");
  }
}
