import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { GlossaryListView } from "@/components/cms/glossary-list-view";

export default async function GlossaryManagementPage() {
  try {
    await requireAdmin();
    return <GlossaryListView />;
  } catch (error) {
    redirect("/cms/login");
  }
}
