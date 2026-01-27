import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { NewsListView } from "@/components/cms/news-list-view";

export default async function NewsManagementPage() {
  try {
    await requireAdmin();
    return <NewsListView />;
  } catch (error) {
    redirect("/cms/login");
  }
}
