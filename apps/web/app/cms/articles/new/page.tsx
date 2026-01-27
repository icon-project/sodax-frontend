import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { ArticleForm } from "@/components/cms/article-form";

export default async function CreateArticlePage() {
  try {
    await requireAdmin();
    return <ArticleForm />;
  } catch (error) {
    redirect("/cms/login");
  }
}
