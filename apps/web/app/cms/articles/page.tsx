import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { ArticlesListView } from "@/components/cms/articles-list-view";

export default async function ArticlesManagementPage() {
  try {
    await requireAdmin();
    return <ArticlesListView />;
  } catch (error) {
    redirect("/cms/login");
  }
}
