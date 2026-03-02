import { redirect } from "next/navigation";
import { CMS_DASHBOARD_ROUTE } from "@/constants/routes";
import { requirePermission } from "@/lib/auth-utils";
import { ArticleForm } from "@/components/cms/article-form";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function CreateArticlePage() {
  try {
    await requirePermission("articles");
    return <ArticleForm />;
  } catch (error) {
    redirect(CMS_DASHBOARD_ROUTE);
  }
}
