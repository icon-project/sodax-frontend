import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { ArticleForm } from "@/components/cms/article-form";

export default async function CreateArticlePage() {
  try {
    await requirePermission("articles");
    return <ArticleForm />;
  } catch (error) {
    redirect("/cms/dashboard");
  }
}
