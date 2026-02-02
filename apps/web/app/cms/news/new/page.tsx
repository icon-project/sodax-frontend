import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { NewsForm } from "@/components/cms/news-form";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function CreateNewsPage() {
  try {
    await requirePermission("news");
    return <NewsForm />;
  } catch (error) {
    redirect("/cms/dashboard");
  }
}
