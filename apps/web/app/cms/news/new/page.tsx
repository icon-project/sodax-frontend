import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { NewsForm } from "@/components/cms/news-form";

export default async function CreateNewsPage() {
  try {
    await requireAdmin();
    return <NewsForm />;
  } catch (error) {
    redirect("/cms/login");
  }
}
