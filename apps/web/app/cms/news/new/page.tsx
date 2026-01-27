import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { NewsForm } from "@/components/cms/news-form";

export default async function CreateNewsPage() {
  try {
    await requirePermission("news");
    return <NewsForm />;
  } catch (error) {
    redirect("/cms/dashboard");
  }
}
